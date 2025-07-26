import os
import pandas as pd
import numpy as np
from flask import Flask, request, jsonify
from flask_cors import CORS
from cv import cv_calculation
from mean_std import std_calculation
from MAD import mad_calculation
from DEPTH2 import depth2_calculation
from DEPTH_ITH import depth_ith_calculation
from gseapy import enrichr
from cv_2 import cv2_calculation
from mean import mean_calculation

# Initialize Flask App
app = Flask(__name__)
CORS(app, resources={r"/api/*": {
    "origins": ["http://localhost:8081"],
    "methods": ["GET", "POST", "OPTIONS"],
    "allow_headers": ["Content-Type", "Authorization"],
    "supports_credentials": True
}})

# Globals
base_raw_dir = "../data/raw"
data_types = ["tpm", "fpkm", "fpkm_uq"]
metric_funcs_TH = {
    "DEPTH2": depth2_calculation,
    "tITH": depth_ith_calculation,
}
metric_funcs_gene = {
    "cv": cv_calculation,
    "cv_squared": cv2_calculation,
    "mean_std": std_calculation,
    "mad": mad_calculation,
    "mean": mean_calculation
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

# Helpers
# def load_expression_file(cancer_name, dtype, input_dir, cond):
#     if cond == 'gene':
#         filename = f"{dtype}.csv.gz"
#     else:
#         filename = f"tumor_{dtype}.csv.gz"
#     filepath = os.path.join(input_dir, cancer_name, filename)
#     try:
#         df = pd.read_csv(filepath, index_col=0, compression='gzip')
#         # df = pd.read_csv(filepath, index_col=1)
#         df.drop(columns=["gene_name"], inplace=True, errors='ignore')
#         # df = df.groupby(df.index).mean()
#         df = df.fillna(0)
#         # print(df)
#         # if df.empty or df.shape[1] == 0:
#         if len(df) == 0:
#             return None
#         return df
#     except FileNotFoundError as e:
#         print(f"File not found: {filepath}")
#         raise
#     except Exception as e:
#         print(f"Failed to load file {filepath}: {e}")
#         raise

def load_expression_file(cancer_name, dtype, input_dir, cond):
    if cond == 'gene' or cond=='pathway':
        filename = f"{dtype}.csv.gz"
    else:
        filename = f"tumor_{dtype}.csv.gz"
    filepath = os.path.join(input_dir, cancer_name, filename)
    try:
        df = pd.read_csv(filepath, index_col=0)  # ensembl_id as index
        print(f"[DEBUG] Loaded file: {filepath}, shape: {df.shape}")
        print(f"[DEBUG] Columns: {df.columns.tolist()}")
        print(f"[DEBUG] First few rows:\n{df.head()}")

        # Drop non-numeric columns (e.g., gene_name or Hugo_Symbol)
        if cond == 'pathway':
            df = df.reset_index()
            df = df.drop(columns=['gene_id'])
            df = df.set_index('gene_name')
        if 'gene_name' in df.columns:
            df = df.drop(columns=['gene_name'])
        if 'Hugo_Symbol' in df.columns:
            df = df.drop(columns=['Hugo_Symbol'])
        
        # Convert all columns to numeric
        df = df.apply(pd.to_numeric, errors='coerce')
        print(f"[DEBUG] After converting to numeric, shape: {df.shape}")
        print(f"[DEBUG] Columns after conversion: {df.columns.tolist()}")

        # Fill NaN values with column median
        df = df.fillna(df.median())
        print(f"[DEBUG] After filling NaN with median:\n{df.head()}")
        print(f"[DEBUG] Remaining NaN values: {df.isna().sum().sum()}")

        if len(df) == 0:
            print(f"[DEBUG] Empty DataFrame for {filepath}")
            return None
        return df
    except FileNotFoundError as e:
        print(f"[ERROR] File not found: {filepath}")
        raise
    except Exception as e:
        print(f"[ERROR] Failed to load file {filepath}: {e}")
        raise

def compute_metrics_for_condition(cancer_name, input_dir, metric_funcs, condition, genes=None, tumor_samples=None, normal_samples=None):
    expr_dfs = {}
    for dtype in data_types:
        try:
            expr_df = load_expression_file(cancer_name, dtype, input_dir, condition)
            if expr_df is not None:
                # Remove log2 transformation to match script
                # expr_df = np.log2(expr_df + 1)  # Commented out
                print(f"[DEBUG] {dtype} DataFrame, shape: {expr_df.shape}")
                print(f"[DEBUG] {dtype} columns: {expr_df.columns.tolist()}")
                expr_dfs[dtype] = expr_df
        except FileNotFoundError:
            print(f"[DEBUG] File not found for {dtype}, skipping")
            continue

    if not expr_dfs:
        print("[DEBUG] No expression data loaded")
        return None

    result = {}
    if condition == "gene":
        if not genes:
            print("[DEBUG] No genes provided")
            return None
        for dtype, df in expr_dfs.items():
            dtype_result = {}
            valid_genes = [gene for gene in genes if gene in df.index]
            print(f"[DEBUG] Valid genes for {dtype}: {valid_genes}")
            if not valid_genes:
                print(f"[DEBUG] No valid genes found for {dtype}")
                result[dtype] = {}
                continue

            # Filter samples to those present in the DataFrame
            tumor_samples = [s for s in tumor_samples if s in df.columns] if tumor_samples else []
            normal_samples = [s for s in normal_samples if s in df.columns] if normal_samples else []
            print(f"[DEBUG] Valid tumor samples: {tumor_samples}")
            print(f"[DEBUG] Valid normal samples: {normal_samples}")

            tumor_df = df.loc[valid_genes, tumor_samples] if tumor_samples else pd.DataFrame(index=valid_genes)
            normal_df = df.loc[valid_genes, normal_samples] if normal_samples else pd.DataFrame(index=valid_genes)
            combined_df = df.loc[valid_genes, tumor_samples + normal_samples] if tumor_samples or normal_samples else pd.DataFrame(index=valid_genes)
            print(f"[DEBUG] Tumor DataFrame shape: {tumor_df.shape}")
            print(f"[DEBUG] Normal DataFrame shape: {normal_df.shape}")
            print(f"[DEBUG] Combined DataFrame shape: {combined_df.shape}")

            for metric_name, func in metric_funcs.items():
                try:
                    tumor_metric = func(tumor_df) if not tumor_df.empty else pd.Series(0, index=valid_genes)
                    normal_metric = func(normal_df) if not normal_df.empty else pd.Series(0, index=valid_genes)
                    combined_metric = func(combined_df) if not combined_df.empty else pd.Series(0, index=valid_genes)
                    print(f"[DEBUG] {metric_name} tumor metric: {tumor_metric.to_dict()}")
                    print(f"[DEBUG] {metric_name} normal metric: {normal_metric.to_dict()}")
                    print(f"[DEBUG] {metric_name} combined metric: {combined_metric.to_dict()}")
                except Exception as e:
                    print(f"[ERROR] Error computing {metric_name}: {e}")
                    tumor_metric = pd.Series(0, index=valid_genes)
                    normal_metric = pd.Series(0, index=valid_genes)
                    combined_metric = pd.Series(0, index=valid_genes)

                for gene in valid_genes:
                    if gene not in dtype_result:
                        dtype_result[gene] = {}
                    dtype_result[gene][f"{metric_name}_tumor"] = float(tumor_metric.get(gene, 0))
                    dtype_result[gene][f"{metric_name}_normal"] = float(normal_metric.get(gene, 0))
                    dtype_result[gene][f"{metric_name}_combined"] = float(combined_metric.get(gene, 0))

            result[dtype] = dtype_result
    elif condition == "tumor":
        sample_ids = set()
        for df in expr_dfs.values():
            sample_ids.update(df.columns)
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
                    print(f"[ERROR] Error computing {metric_name} for {dtype}: {e}")
                    metric_data[dtype] = [0] * len(sample_ids)

            result_list = []
            for i, sid in enumerate(sample_ids):
                record = {"sample_id": sid}
                for dtype in data_types:
                    record[dtype] = metric_data[dtype][i]
                result_list.append(record)
            metric_results[metric_name] = result_list
        return metric_results if metric_results else None

    print(f"[DEBUG] Final result for {cancer_name}: {result}")
    return result if result else None

# API Endpoint
@app.route('/api/TH-metrics', methods=['GET'])
def TH_metrics():
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
        # results = compute_metrics_for_condition(cancer_name, base_raw_dir, {metric: metric_funcs_TH[metric]}, "tumor")
        # if not results or metric not in results:
        #     return jsonify({"error": "Metric computation failed or no data"}), 500
        results = compute_metrics_for_condition(
            cancer_name=cancer_name,
            input_dir=base_raw_dir,
            metric_funcs={metric: metric_funcs_TH[metric]},
            condition="tumor"
        )

        if not results or metric not in results:
            return jsonify({"error": "Metric computation failed or no data"}), 500

        return jsonify(results[metric])


        # return jsonify(results[metric])
    except FileNotFoundError as e:
        return jsonify({"error": f"Missing data file: {str(e)}"}), 404
    except Exception as e:
        return jsonify({"error": f"Internal error: {str(e)}"}), 500

@app.route('/api/gene_noise', methods=['GET'])
def gene_noise():
    cancer = request.args.get('cancer')
    metrics = request.args.get('metric').split(',') if request.args.get('metric') else []
    gene_ensembl_ids = request.args.get('gene_ensembl_id').split(',') if request.args.get('gene_ensembl_id') else []
    tumor_samples_param = request.args.get('tumor_samples')
    normal_samples_param = request.args.get('normal_samples')
    
    gene_ensembl_ids = [g.strip() for g in gene_ensembl_ids if g.strip()]
    tumor_samples = [s.strip() for s in tumor_samples_param.split(',')] if tumor_samples_param else []
    normal_samples = [s.strip() for s in normal_samples_param.split(',')] if normal_samples_param else []

    print(f"[INFO] Request: cancer={cancer}, metrics={metrics}, gene_ensembl_ids={gene_ensembl_ids}, tumor_samples={len(tumor_samples)}, normal_samples={len(normal_samples)}")

    if not all([cancer, metrics, gene_ensembl_ids]):
        return jsonify({"error": "Missing parameters (cancer, metric, or gene_ensembl_id)"}), 400

    invalid_metrics = [m for m in metrics if m not in metric_funcs_gene]
    if invalid_metrics:
        return jsonify({"error": f"Unsupported metric: {','.join(invalid_metrics)}"}), 400

    cancer_key = cancer.lower()
    cancer_name = cancer_mapping.get(cancer_key)
    if not cancer_name:
        return jsonify({"error": f"Unsupported cancer name: {cancer}"}), 400

    try:
        results = compute_metrics_for_condition(
            cancer_name=cancer_name,
            input_dir=base_raw_dir,
            metric_funcs={m: metric_funcs_gene[m] for m in metrics},
            condition="gene",
            genes=gene_ensembl_ids,
            tumor_samples=tumor_samples,
            normal_samples=normal_samples
        )

        if not results:
            return jsonify({"error": "Metric computation failed or no data"}), 500

        print(f"[DEBUG] Gene noise results: {results}")
        return jsonify(results)
    except Exception as e:
        print(f"[ERROR] Error in gene_noise: {str(e)}")
        return jsonify({"error": f"Internal error: {str(e)}"}), 500
    
@app.route('/api/pathway-analysis', methods=['GET'])
def pathway_analysis():
    try:
        cancer = request.args.get("cancer")
        method = request.args.get("method", "tpm")
        tumor_samples_param = request.args.get("tumor_samples", "")
        normal_samples_param = request.args.get("normal_samples", "")
        top_n = int(request.args.get("top_n", 200))
        print(top_n)
        tumor_samples = [s.strip() for s in tumor_samples_param.split(',') if s.strip()]
        normal_samples = [s.strip() for s in normal_samples_param.split(',') if s.strip()]

        if not cancer or not tumor_samples or not normal_samples:
            return jsonify({"error": "Missing required parameters"}), 400

        cancer_key = cancer.lower()
        cancer_name = cancer_mapping.get(cancer_key)
        if not cancer_name:
            return jsonify({"error": f"Unsupported cancer name: {cancer}"}), 400

        expr_df = load_expression_file(cancer_name, method, base_raw_dir, "pathway")
        if expr_df is None:
            return jsonify({"error": "Expression file not found"}), 404

        # expr_df = np.log2(expr_df + 1)

        tumor_samples = [s for s in tumor_samples if s in expr_df.columns]
        normal_samples = [s for s in normal_samples if s in expr_df.columns]

        if not tumor_samples or not normal_samples:
            return jsonify({"error": "No valid tumor/normal sample IDs found in expression data"}), 400

        tumor_mean = expr_df[tumor_samples].mean(axis=1)
        normal_mean = expr_df[normal_samples].mean(axis=1)
        log2fc = tumor_mean - normal_mean

        top_genes = log2fc.sort_values(ascending=False).head(top_n).index.tolist()
        print()
        # Calculate mean expression for top genes
        gene_stats = {}
        for gene in top_genes:
            tumor_vals = expr_df.loc[gene, tumor_samples].dropna().values if tumor_samples else np.array([])
            normal_vals = expr_df.loc[gene, normal_samples].dropna().values if normal_samples else np.array([])
            gene_stats[gene] = {
                "mean_tumor": float(np.mean(tumor_vals)) if tumor_vals.size else 0,
                "mean_normal": float(np.mean(normal_vals)) if normal_vals.size else 0
            }

        enr = enrichr(gene_list=top_genes,
                      gene_sets="KEGG_2021_Human",
                      organism="Human",
                      outdir=None,
                      cutoff=0.05)

        results_df = enr.results
        results = results_df[["Term", "P-value", "Adjusted P-value", "Odds Ratio", "Combined Score"]].head(10).to_dict(orient="records")
        # enr = enrichr(gene_list=top_genes,
        #               gene_sets="GO_Biological_Process_2021",
        #               organism="Human",
        #               outdir=None,
        #               cutoff=0.05)

        # results_df = enr.results
        # results = results_df[["Term", "P-value", "Adjusted P-value", "Odds Ratio", "Combined Score"]].head(10).to_dict(orient="records")
        print(f"[INFO] Pathway analysis response: {results}, top_genes: {top_genes}")
        return jsonify({
            "enrichment": results,
            "top_genes": top_genes,
            "gene_stats": gene_stats
        })

    except Exception as e:
        print(f"[ERROR] Pathway analysis failed: {e}")
        return jsonify({"error": f"Internal server error: {str(e)}"}), 500


# Run server
if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5001)
