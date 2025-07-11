import os
import pandas as pd
import numpy as np
from flask import Flask, request, jsonify
from flask_cors import CORS

from cv import cv_calculation
from mean_std import mean_std_calculation
from MAD import mad_calculation
from DEPTH2 import depth2_calculation
from DEPTH_ITH import depth_ith_calculation

# --- Initialize Flask App ---
app = Flask(__name__)
CORS(app, resources={r"/api/*": {
    "origins": ["http://localhost:8080"],
    "methods": ["GET", "OPTIONS"],
    "allow_headers": ["Content-Type", "Authorization"],
    "supports_credentials": True
}})

# --- Globals ---
base_raw_dir = "../data/raw"
data_types = ["tpm", "fpkm", "fpkm_uq"]

metric_funcs_TH = {
    "DEPTH2": depth2_calculation,
    "tITH": depth_ith_calculation,
}
cancer_mapping = {
    "liver and bile duct": "liver",
    "breast": "breast",
    "bladder": "bladder",
    "colorectal": "colon",
    "lung": "lung",
    "thymus": "thymus",
    "TCGA-LIHC": "liver",
    "TCGA-BRCA": "breast",
    "TCGA-BLCA": "bladder",
    "TCGA-COAD": "colon",
    "TCGA-LUAD": "lung",
    "TCGA-THYM": "thymus"
}

# --- Helpers ---
def load_expression_file(cancer_name, dtype, input_dir):
    filename = f"tumor_{dtype}.csv"
    filepath = os.path.join(input_dir, cancer_name, filename)
    try:
        df = pd.read_csv(filepath, index_col=0)
        df.drop(columns=["gene_name"], inplace=True, errors='ignore')
        df = df.groupby(df.index).mean()
        df = df.fillna(0)
        if df.empty or df.shape[1] == 0:
            return None
        return df
    except FileNotFoundError as e:
        print(f"File not found: {filepath}")
        raise
    except Exception as e:
        print(f"Failed to load file {filepath}: {e}")
        raise

def compute_metrics_for_condition(cancer_name, input_dir, metric_funcs):
    expr_dfs = {}
    sample_ids = set()

    for dtype in data_types:
        try:
            expr_df = load_expression_file(cancer_name, dtype, input_dir)
            if expr_df is not None:
                expr_df = np.log2(expr_df + 1)
                expr_dfs[dtype] = expr_df
                sample_ids.update(expr_df.columns)
        except FileNotFoundError:
            continue

    if not sample_ids:
        return None

    sample_ids = sorted(list(sample_ids))
    metric_results = {}

    for metric_name, func in metric_funcs.items():
        metric_data = {}
        for dtype in data_types:
            expr_df = expr_dfs.get(dtype)
            if expr_df is None:
                metric_data[dtype] = [0] * len(sample_ids)
                continue
            try:
                metric_series = func(expr_df)
                if not isinstance(metric_series, pd.Series):
                    raise ValueError(f"{metric_name} did not return a Series")
                metric_data[dtype] = metric_series.reindex(sample_ids, fill_value=0).tolist()
            except Exception as e:
                print(f"Error computing {metric_name} for {dtype}: {e}")
                metric_data[dtype] = [0] * len(sample_ids)

        # Structure: list of dicts with sample_id and one value per dtype
        result_list = []
        for i, sid in enumerate(sample_ids):
            record = {"sample_id": sid}
            for dtype in data_types:
                record[dtype] = metric_data[dtype][i]
            result_list.append(record)
        metric_results[metric_name] = result_list

    return metric_results if metric_results else None

# --- API Endpoint ---
@app.route('/api/calculate-metrics', methods=['GET'])
def calculate_metrics():
    cancer = request.args.get('cancer')
    method = request.args.get('method')
    metric = request.args.get('metric')

    print(f"[INFO] Received request: cancer={cancer}, method={method}, metric={metric}")

    if not all([cancer, method, metric]):
        return jsonify({"error": "Missing parameters"}), 400

    cancer_key = cancer.lower()
    cancer_name = cancer_mapping.get(cancer_key)
    if not cancer_name:
        return jsonify({"error": f"Unsupported cancer name or code: {cancer}"}), 400

    try:
        results = compute_metrics_for_condition(cancer_name, base_raw_dir, {metric: metric_funcs_TH[metric]})
        if not results or metric not in results:
            return jsonify({"error": "Metric computation failed or no data"}), 500

        return jsonify(results[metric])  # Send as list, not dict

    except FileNotFoundError as e:
        return jsonify({"error": f"Missing data file: {str(e)}"}), 404
    except Exception as e:
        return jsonify({"error": f"Internal error: {str(e)}"}), 500

# --- Run server ---
if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5001)
