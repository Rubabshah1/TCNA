# # # # # # # # import os
# # # # # # # # import pandas as pd
# # # # # # # # import numpy as np
# # # # # # # # from flask import Flask, request, jsonify
# # # # # # # # from flask_cors import CORS

# # # # # # # # from cv import cv_calculation
# # # # # # # # from std import std_calculation
# # # # # # # # from MAD import mad_calculation
# # # # # # # # from DEPTH2 import depth2_calculation
# # # # # # # # from DEPTH_ITH import depth_ith_calculation

# # # # # # # # # --- Initialize Flask App ---
# # # # # # # # app = Flask(__name__)
# # # # # # # # CORS(app, resources={r"/api/*": {
# # # # # # # #     "origins": ["http://localhost:8080"],
# # # # # # # #     "methods": ["GET", "OPTIONS"],
# # # # # # # #     "allow_headers": ["Content-Type", "Authorization"],
# # # # # # # #     "supports_credentials": True
# # # # # # # # }})

# # # # # # # # # --- Globals ---
# # # # # # # # base_raw_dir = "../data/raw"
# # # # # # # # data_types = ["tpm", "fpkm", "fpkm_uq"]

# # # # # # # # metric_funcs_TH = {
# # # # # # # #     "DEPTH2": depth2_calculation,
# # # # # # # #     "tITH": depth_ith_calculation,
# # # # # # # # }
# # # # # # # # cancer_mapping = {
# # # # # # # #     "liver and bile duct": "liver",
# # # # # # # #     "breast": "breast",
# # # # # # # #     "bladder": "bladder",
# # # # # # # #     "colorectal": "colon",
# # # # # # # #     "lung": "lung",
# # # # # # # #     "thymus": "thymus",
# # # # # # # #     "TCGA-LIHC": "liver",
# # # # # # # #     "TCGA-BRCA": "breast",
# # # # # # # #     "TCGA-BLCA": "bladder",
# # # # # # # #     "TCGA-COAD": "colon",
# # # # # # # #     "TCGA-LUAD": "lung",
# # # # # # # #     "TCGA-THYM": "thymus"
# # # # # # # # }

# # # # # # # # # --- Helpers ---
# # # # # # # # def load_expression_file(cancer_name, dtype, input_dir):
# # # # # # # #     # filename = f"tumor_{dtype}.csv"
# # # # # # # #     filename = f"tumor_{dtype}.csv.gz"

# # # # # # # #     filepath = os.path.join(input_dir, cancer_name, filename)
# # # # # # # #     try:
# # # # # # # #         # df = pd.read_csv(filepath, index_col=0)
# # # # # # # #         df = pd.read_csv(filepath, index_col=0, compression='gzip')

# # # # # # # #         df.drop(columns=["gene_name"], inplace=True, errors='ignore')
# # # # # # # #         df = df.groupby(df.index).mean()
# # # # # # # #         df = df.fillna(0)
# # # # # # # #         if df.empty or df.shape[1] == 0:
# # # # # # # #             return None
# # # # # # # #         return df
# # # # # # # #     except FileNotFoundError as e:
# # # # # # # #         print(f"File not found: {filepath}")
# # # # # # # #         raise
# # # # # # # #     except Exception as e:
# # # # # # # #         print(f"Failed to load file {filepath}: {e}")
# # # # # # # #         raise

# # # # # # # # def compute_metrics_for_condition(cancer_name, input_dir, metric_funcs):
# # # # # # # #     expr_dfs = {}
# # # # # # # #     sample_ids = set()

# # # # # # # #     for dtype in data_types:
# # # # # # # #         try:
# # # # # # # #             expr_df = load_expression_file(cancer_name, dtype, input_dir)
# # # # # # # #             if expr_df is not None:
# # # # # # # #                 expr_df = np.log2(expr_df + 1)
# # # # # # # #                 expr_dfs[dtype] = expr_df
# # # # # # # #                 sample_ids.update(expr_df.columns)
# # # # # # # #         except FileNotFoundError:
# # # # # # # #             continue

# # # # # # # #     if not sample_ids:
# # # # # # # #         return None

# # # # # # # #     sample_ids = sorted(list(sample_ids))
# # # # # # # #     metric_results = {}

# # # # # # # #     for metric_name, func in metric_funcs.items():
# # # # # # # #         metric_data = {}
# # # # # # # #         for dtype in data_types:
# # # # # # # #             expr_df = expr_dfs.get(dtype)
# # # # # # # #             if expr_df is None:
# # # # # # # #                 metric_data[dtype] = [0] * len(sample_ids)
# # # # # # # #                 continue
# # # # # # # #             try:
# # # # # # # #                 metric_series = func(expr_df)
# # # # # # # #                 if not isinstance(metric_series, pd.Series):
# # # # # # # #                     raise ValueError(f"{metric_name} did not return a Series")
# # # # # # # #                 metric_data[dtype] = metric_series.reindex(sample_ids, fill_value=0).tolist()
# # # # # # # #             except Exception as e:
# # # # # # # #                 print(f"Error computing {metric_name} for {dtype}: {e}")
# # # # # # # #                 metric_data[dtype] = [0] * len(sample_ids)

# # # # # # # #         # Structure: list of dicts with sample_id and one value per dtype
# # # # # # # #         result_list = []
# # # # # # # #         for i, sid in enumerate(sample_ids):
# # # # # # # #             record = {"sample_id": sid}
# # # # # # # #             for dtype in data_types:
# # # # # # # #                 record[dtype] = metric_data[dtype][i]
# # # # # # # #             result_list.append(record)
# # # # # # # #         metric_results[metric_name] = result_list

# # # # # # # #     return metric_results if metric_results else None

# # # # # # # # # --- API Endpoint ---
# # # # # # # # @app.route('/api/calculate-metrics', methods=['GET'])
# # # # # # # # def calculate_metrics():
# # # # # # # #     cancer = request.args.get('cancer')
# # # # # # # #     method = request.args.get('method')
# # # # # # # #     metric = request.args.get('metric')

# # # # # # # #     print(f"[INFO] Received request: cancer={cancer}, method={method}, metric={metric}")

# # # # # # # #     if not all([cancer, method, metric]):
# # # # # # # #         return jsonify({"error": "Missing parameters"}), 400

# # # # # # # #     cancer_key = cancer.lower()
# # # # # # # #     cancer_name = cancer_mapping.get(cancer_key)
# # # # # # # #     if not cancer_name:
# # # # # # # #         return jsonify({"error": f"Unsupported cancer name or code: {cancer}"}), 400

# # # # # # # #     try:
# # # # # # # #         results = compute_metrics_for_condition(cancer_name, base_raw_dir, {metric: metric_funcs_TH[metric]})
# # # # # # # #         if not results or metric not in results:
# # # # # # # #             return jsonify({"error": "Metric computation failed or no data"}), 500

# # # # # # # #         return jsonify(results[metric])  # Send as list, not dict

# # # # # # # #     except FileNotFoundError as e:
# # # # # # # #         return jsonify({"error": f"Missing data file: {str(e)}"}), 404
# # # # # # # #     except Exception as e:
# # # # # # # #         return jsonify({"error": f"Internal error: {str(e)}"}), 500

# # # # # # # # # --- Run server ---
# # # # # # # # if __name__ == '__main__':
# # # # # # # #     app.run(debug=True, host='0.0.0.0', port=5001)

# # # # # # # import os
# # # # # # # import pandas as pd
# # # # # # # import numpy as np
# # # # # # # from flask import Flask, request, jsonify
# # # # # # # from flask_cors import CORS

# # # # # # # from cv import cv_calculation
# # # # # # # from std import std_calculation
# # # # # # # from MAD import mad_calculation
# # # # # # # from DEPTH2 import depth2_calculation
# # # # # # # from DEPTH_ITH import depth_ith_calculation

# # # # # # # # --- Initialize Flask App ---
# # # # # # # app = Flask(__name__)
# # # # # # # CORS(app, resources={
# # # # # # #     r"/api/*": {
# # # # # # #         "origins": ["http://localhost:8080"],
# # # # # # #         "methods": ["GET", "POST", "OPTIONS"],
# # # # # # #         "allow_headers": ["Content-Type", "Authorization"],
# # # # # # #         "supports_credentials": True
# # # # # # #     }
# # # # # # # })

# # # # # # # # --- Globals ---
# # # # # # # base_raw_dir = "../data/raw"
# # # # # # # data_types = ["tpm", "fpkm", "fpkm_uq"]
# # # # # # # metric_funcs_TH = {
# # # # # # #     "DEPTH2": depth2_calculation,
# # # # # # #     "tITH": depth_ith_calculation,
# # # # # # # }
# # # # # # # metric_funcs_gene = {
# # # # # # #     "CV": cv_calculation,
# # # # # # #     "MeanSTD": std_calculation,
# # # # # # #     "MAD": mad_calculation,
# # # # # # # }
# # # # # # # cancer_mapping = {
# # # # # # #     "liver and bile duct": "liver",
# # # # # # #     "breast": "breast",
# # # # # # #     "bladder": "bladder",
# # # # # # #     "colorectal": "colon",
# # # # # # #     "lung": "lung",
# # # # # # #     "thymus": "thymus",
# # # # # # #     "tcga-lihc": "liver",
# # # # # # #     "tcga-brca": "breast",
# # # # # # #     "tcga-blca": "bladder",
# # # # # # #     "tcga-coad": "colon",
# # # # # # #     "tcga-luad": "lung",
# # # # # # #     "tcga-thym": "thymus"
# # # # # # # }

# # # # # # # # --- Helpers ---
# # # # # # # def load_expression_file(cancer_name, normalization, sample_type, input_dir):
# # # # # # #     filename = f"{sample_type}_{normalization}.csv.gz"
# # # # # # #     filepath = os.path.join(input_dir, cancer_name, filename)
# # # # # # #     try:
# # # # # # #         df = pd.read_csv(filepath, index_col=0, compression='gzip')
# # # # # # #         if 'gene_name' not in df.columns:
# # # # # # #             raise ValueError(f"Missing 'gene_name' column in {filepath}")
# # # # # # #         gene_names = df["gene_name"].copy()
# # # # # # #         df.drop(columns=["gene_name"], inplace=True, errors='ignore')
# # # # # # #         df = df.groupby(df.index).mean()
# # # # # # #         df = df.fillna(0)
# # # # # # #         if df.empty or df.shape[1] == 0:
# # # # # # #             print(f"No data in {filepath} after processing")
# # # # # # #             return None, None
# # # # # # #         return df, gene_names
# # # # # # #     except FileNotFoundError as e:
# # # # # # #         print(f"File not found: {filepath}")
# # # # # # #         return None, None
# # # # # # #     except Exception as e:
# # # # # # #         print(f"Failed to load file {filepath}: {str(e)}")
# # # # # # #         return None, None

# # # # # # # def compute_metrics_for_condition(cancer_name, input_dir, metric_funcs, normalization):
# # # # # # #     expr_df, _ = load_expression_file(cancer_name, normalization, "tumor", input_dir)
# # # # # # #     if expr_df is None:
# # # # # # #         return None
# # # # # # #     expr_df = np.log2(expr_df + 1)
# # # # # # #     sample_ids = sorted(list(expr_df.columns))
# # # # # # #     metric_results = {}

# # # # # # #     for metric_name, func in metric_funcs.items():
# # # # # # #         try:
# # # # # # #             metric_series = func(expr_df)
# # # # # # #             if not isinstance(metric_series, pd.Series):
# # # # # # #                 raise ValueError(f"{metric_name} did not return a Series")
# # # # # # #             metric_data = metric_series.reindex(sample_ids, fill_value=0).tolist()
# # # # # # #             result_list = [{"sample_id": sid, normalization: value} for sid, value in zip(sample_ids, metric_data)]
# # # # # # #             metric_results[metric_name] = result_list
# # # # # # #         except Exception as e:
# # # # # # #             print(f"Error computing {metric_name} for {normalization}: {str(e)}")
# # # # # # #             metric_results[metric_name] = [{"sample_id": sid, normalization: 0} for sid in sample_ids]

# # # # # # #     return metric_results if metric_results else None

# # # # # # # def compute_gene_metrics(cancer_name, input_dir, genes, metrics, tumor_samples, normal_samples, normalization):
# # # # # # #     results = []
    
# # # # # # #     tumor_df, tumor_gene_names = load_expression_file(cancer_name, normalization, "tumor", input_dir)
# # # # # # #     normal_df, normal_gene_names = load_expression_file(cancer_name, normalization, "normal", input_dir)
    
# # # # # # #     tumor_sample_ids = set(tumor_samples) if tumor_samples and tumor_samples[0] else set()
# # # # # # #     normal_sample_ids = set(normal_samples) if normal_samples and normal_samples[0] else set()
# # # # # # #     gene_names = tumor_gene_names.to_dict() if tumor_gene_names is not None else (normal_gene_names.to_dict() if normal_gene_names is not None else {})

# # # # # # #     # Filter samples
# # # # # # #     if tumor_df is not None:
# # # # # # #         valid_tumor_samples = [s for s in tumor_samples if s in tumor_df.columns]
# # # # # # #         if not valid_tumor_samples and tumor_samples and tumor_samples[0]:
# # # # # # #             print(f"No valid tumor samples found for {cancer_name} in {normalization} data: {tumor_samples}")
# # # # # # #         tumor_df = tumor_df[valid_tumor_samples]
# # # # # # #         if not tumor_df.empty:
# # # # # # #             tumor_df = np.log2(tumor_df + 1)
# # # # # # #             tumor_sample_ids = set(valid_tumor_samples)
    
# # # # # # #     if normal_df is not None:
# # # # # # #         valid_normal_samples = [s for s in normal_samples if s in normal_df.columns]
# # # # # # #         if not valid_normal_samples and normal_samples and normal_samples[0]:
# # # # # # #             print(f"No valid normal samples found for {cancer_name} in {normalization} data: {normal_samples}")
# # # # # # #         normal_df = normal_df[valid_normal_samples]
# # # # # # #         if not normal_df.empty:
# # # # # # #             normal_df = np.log2(normal_df + 1)
# # # # # # #             normal_sample_ids = set(valid_normal_samples)

# # # # # # #     if not tumor_df and not normal_df:
# # # # # # #         print(f"No data available for {cancer_name} with normalization {normalization}")
# # # # # # #         return None

# # # # # # #     valid_genes = [g for g in genes if (tumor_df is not None and g in tumor_df.index) or (normal_df is not None and g in normal_df.index)]
# # # # # # #     if not valid_genes:
# # # # # # #         print(f"No valid genes found: {genes}")
# # # # # # #         return None

# # # # # # #     for gene in valid_genes:
# # # # # # #         gene_result = {
# # # # # # #             "gene_id": gene,
# # # # # # #             "gene_name": gene_names.get(gene, "Unknown"),
# # # # # # #             "tumor": {"sample_count": len(tumor_sample_ids), "samples": list(tumor_sample_ids)},
# # # # # # #             "normal": {"sample_count": len(normal_sample_ids), "samples": list(normal_sample_ids)},
# # # # # # #         }

# # # # # # #         for metric in metrics:
# # # # # # #             if metric in metric_funcs_gene:
# # # # # # #                 func = metric_funcs_gene[metric]
                
# # # # # # #                 normal_value = None
# # # # # # #                 if normal_df is not None and gene in normal_df.index and not normal_df.empty:
# # # # # # #                     try:
# # # # # # #                         normal_series = normal_df.loc[gene]
# # # # # # #                         if normal_series.empty:
# # # # # # #                             print(f"Empty series for {gene} (normal) in {normalization}")
# # # # # # #                         else:
# # # # # # #                             normal_value = func(normal_series)
# # # # # # #                             if isinstance(normal_value, (pd.Series, np.ndarray)):
# # # # # # #                                 normal_value = float(normal_value.iloc[0] if isinstance(normal_value, pd.Series) else normal_value[0])
# # # # # # #                     except Exception as e:
# # # # # # #                         print(f"Error computing {metric} for {gene} (normal) in {normalization}: {str(e)}")
                
# # # # # # #                 tumor_value = None
# # # # # # #                 if tumor_df is not None and gene in tumor_df.index and not tumor_df.empty:
# # # # # # #                     try:
# # # # # # #                         tumor_series = tumor_df.loc[gene]
# # # # # # #                         if tumor_series.empty:
# # # # # # #                             print(f"Empty series for {gene} (tumor) in {normalization}")
# # # # # # #                         else:
# # # # # # #                             tumor_value = func(tumor_series)
# # # # # # #                             if isinstance(tumor_value, (pd.Series, np.ndarray)):
# # # # # # #                                 tumor_value = float(tumor_value.iloc[0] if isinstance(tumor_value, pd.Series) else normal_value[0])
# # # # # # #                     except Exception as e:
# # # # # # #                         print(f"Error computing {metric} for {gene} (tumor) in {normalization}: {str(e)}")

# # # # # # #                 gene_result["tumor"][metric] = tumor_value
# # # # # # #                 gene_result["normal"][metric] = normal_value

# # # # # # #         results.append(gene_result)

# # # # # # #     return results if results else None

# # # # # # # # --- API Endpoints ---
# # # # # # # @app.route('/api/calculate-metrics', methods=['GET', 'OPTIONS'])
# # # # # # # def calculate_metrics():
# # # # # # #     if request.method == 'OPTIONS':
# # # # # # #         return '', 200

# # # # # # #     cancer = request.args.get('cancer')
# # # # # # #     method = request.args.get('method')
# # # # # # #     metric = request.args.get('metric')

# # # # # # #     print(f"[INFO] Received request: cancer={cancer}, method={method}, metric={metric}")

# # # # # # #     if not all([cancer, method, metric]):
# # # # # # #         return jsonify({"error": "Missing parameters: cancer, method, metric are required"}), 400

# # # # # # #     cancer_key = cancer.lower()
# # # # # # #     cancer_name = cancer_mapping.get(cancer_key)
# # # # # # #     if not cancer_name:
# # # # # # #         return jsonify({"error": f"Unsupported cancer name or code: {cancer}"}), 400

# # # # # # #     try:
# # # # # # #         results = compute_metrics_for_condition(cancer_name, base_raw_dir, {metric: metric_funcs_TH[metric]}, method)
# # # # # # #         if not results or metric not in results:
# # # # # # #             return jsonify({"error": f"Metric computation failed or no data for {cancer_name} with normalization {method}"}), 500

# # # # # # #         return jsonify(results[metric])

# # # # # # #     except FileNotFoundError as e:
# # # # # # #         return jsonify({"error": f"Missing data file: {str(e)}"}), 404
# # # # # # #     except Exception as e:
# # # # # # #         return jsonify({"error": f"Internal error computing metrics: {str(e)}"}), 500

# # # # # # # @app.route('/api/gene-metrics', methods=['GET', 'OPTIONS'])
# # # # # # # def gene_metrics():
# # # # # # #     if request.method == 'OPTIONS':
# # # # # # #         return '', 200

# # # # # # #     cancer = request.args.get('cancer')
# # # # # # #     genes = request.args.get('genes', '').split(',')
# # # # # # #     metrics = request.args.get('metrics', '').split(',')
# # # # # # #     tumor_samples = request.args.get('tumor_samples', '').split(',')
# # # # # # #     normal_samples = request.args.get('normal_samples', '').split(',')
# # # # # # #     normalization = request.args.get('normalization', '')

# # # # # # #     print(f"[INFO] Received request: cancer={cancer}, genes={genes}, metrics={metrics}, tumor_samples={tumor_samples}, normal_samples={normal_samples}, normalization={normalization}")

# # # # # # #     if not all([cancer, genes, metrics, genes[0], metrics[0], normalization]):
# # # # # # #         return jsonify({"error": "Missing parameters: cancer, genes, metrics, and normalization are required"}), 400

# # # # # # #     cancer_key = cancer.lower()
# # # # # # #     cancer_name = cancer_mapping.get(cancer_key)
# # # # # # #     if not cancer_name:
# # # # # # #         return jsonify({"error": f"Unsupported cancer name or code: {cancer}"}), 400

# # # # # # #     try:
# # # # # # #         results = compute_gene_metrics(cancer_name, base_raw_dir, genes, metrics, tumor_samples, normal_samples, normalization)
# # # # # # #         if not results:
# # # # # # #             return jsonify({"error": f"Metric computation failed or no data for {cancer_name} with normalization {normalization} for specified genes/samples"}), 500

# # # # # # #         return jsonify(results)

# # # # # # #     except FileNotFoundError as e:
# # # # # # #         return jsonify({"error": f"Missing data file: {str(e)}"}), 404
# # # # # # #     except Exception as e:
# # # # # # #         return jsonify({"error": f"Internal error computing gene metrics: {str(e)}"}), 500

# # # # # # # # --- Run server ---
# # # # # # # if __name__ == '__main__':
# # # # # # #     app.run(debug=True, host='0.0.0.0', port=5001)

# # # # # # import os
# # # # # # import pandas as pd
# # # # # # import numpy as np
# # # # # # from flask import Flask, request, jsonify
# # # # # # from flask_cors import CORS

# # # # # # from cv import cv_calculation
# # # # # # from std import std_calculation
# # # # # # from MAD import mad_calculation
# # # # # # from DEPTH2 import depth2_calculation
# # # # # # from DEPTH_ITH import depth_ith_calculation

# # # # # # # --- Initialize Flask App ---
# # # # # # app = Flask(__name__)
# # # # # # CORS(app, resources={
# # # # # #     r"/api/*": {
# # # # # #         "origins": ["http://localhost:8080"],
# # # # # #         "methods": ["GET", "POST", "OPTIONS"],
# # # # # #         "allow_headers": ["Content-Type", "Authorization"],
# # # # # #         "supports_credentials": True
# # # # # #     }
# # # # # # })

# # # # # # # --- Globals ---
# # # # # # base_raw_dir = "../data/raw"
# # # # # # data_types = ["tpm", "fpkm", "fpkm_uq"]
# # # # # # metric_funcs_TH = {
# # # # # #     "DEPTH2": depth2_calculation,
# # # # # #     "tITH": depth_ith_calculation,
# # # # # # }
# # # # # # metric_funcs_gene = {
# # # # # #     "CV": cv_calculation,
# # # # # #     "MeanSTD": std_calculation,
# # # # # #     "MAD": mad_calculation,
# # # # # # }
# # # # # # cancer_mapping = {
# # # # # #     "liver and bile duct": "liver",
# # # # # #     "breast": "breast",
# # # # # #     "bladder": "bladder",
# # # # # #     "colorectal": "colon",
# # # # # #     "lung": "lung",
# # # # # #     "thymus": "thymus",
# # # # # #     "tcga-lihc": "liver",
# # # # # #     "tcga-brca": "breast",
# # # # # #     "tcga-blca": "bladder",
# # # # # #     "tcga-coad": "colon",
# # # # # #     "tcga-luad": "lung",
# # # # # #     "tcga-thym": "thymus"
# # # # # # }

# # # # # # # --- Helpers ---
# # # # # # def load_expression_file(cancer_name, normalization, sample_type, input_dir):
# # # # # #     filename = f"{sample_type}_{normalization}.csv.gz"
# # # # # #     filepath = os.path.join(input_dir, cancer_name, filename)
# # # # # #     try:
# # # # # #         df = pd.read_csv(filepath, index_col=0, compression='gzip')
# # # # # #         if 'gene_name' not in df.columns:
# # # # # #             print(f"Warning: Missing 'gene_name' column in {filepath}")
# # # # # #         gene_names = df["gene_name"].copy() if 'gene_name' in df.columns else pd.Series(df.index, index=df.index)
# # # # # #         df.drop(columns=["gene_name"], inplace=True, errors='ignore')
# # # # # #         df = df.groupby(df.index).mean()
# # # # # #         df = df.fillna(0)
# # # # # #         if df.empty or df.shape[1] == 0:
# # # # # #             print(f"No data in {filepath} after processing")
# # # # # #             return None, None
# # # # # #         return df, gene_names
# # # # # #     except FileNotFoundError as e:
# # # # # #         print(f"File not found: {filepath}")
# # # # # #         return None, None
# # # # # #     except Exception as e:
# # # # # #         print(f"Failed to load file {filepath}: {str(e)}")
# # # # # #         return None, None

# # # # # # def compute_metrics_for_condition(cancer_name, input_dir, metric_funcs, normalization):
# # # # # #     expr_df, _ = load_expression_file(cancer_name, normalization, "tumor", input_dir)
# # # # # #     if expr_df is None:
# # # # # #         return None
# # # # # #     expr_df = np.log2(expr_df + 1)
# # # # # #     sample_ids = sorted(list(expr_df.columns))
# # # # # #     metric_results = {}

# # # # # #     for metric_name, func in metric_funcs.items():
# # # # # #         try:
# # # # # #             metric_series = func(expr_df)
# # # # # #             if not isinstance(metric_series, pd.Series):
# # # # # #                 raise ValueError(f"{metric_name} did not return a Series")
# # # # # #             metric_data = metric_series.reindex(sample_ids, fill_value=0).tolist()
# # # # # #             result_list = [{"sample_id": sid, normalization: value} for sid, value in zip(sample_ids, metric_data)]
# # # # # #             metric_results[metric_name] = result_list
# # # # # #         except Exception as e:
# # # # # #             print(f"Error computing {metric_name} for {normalization}: {str(e)}")
# # # # # #             metric_results[metric_name] = [{"sample_id": sid, normalization: 0} for sid in sample_ids]

# # # # # #     return metric_results if metric_results else None

# # # # # # def compute_gene_metrics(cancer_name, input_dir, genes, metrics, tumor_samples, normal_samples, normalization):
# # # # # #     results = []
    
# # # # # #     tumor_df, tumor_gene_names = load_expression_file(cancer_name, normalization, "tumor", input_dir)
# # # # # #     normal_df, normal_gene_names = load_expression_file(cancer_name, normalization, "normal", input_dir)
    
# # # # # #     tumor_sample_ids = set(tumor_samples) if tumor_samples and tumor_samples[0] else set()
# # # # # #     normal_sample_ids = set(normal_samples) if normal_samples and normal_samples[0] else set()
# # # # # #     gene_names = tumor_gene_names.to_dict() if tumor_gene_names is not None else (normal_gene_names.to_dict() if normal_gene_names is not None else {})

# # # # # #     # Filter samples
# # # # # #     if tumor_df is not None:
# # # # # #         valid_tumor_samples = [s for s in tumor_samples if s in tumor_df.columns]
# # # # # #         if not valid_tumor_samples and tumor_samples and tumor_samples[0]:
# # # # # #             print(f"No valid tumor samples found for {cancer_name} in {normalization} data: {tumor_samples}")
# # # # # #         tumor_df = tumor_df[valid_tumor_samples]
# # # # # #         if not tumor_df.empty:
# # # # # #             tumor_df = np.log2(tumor_df + 1)
# # # # # #             tumor_sample_ids = set(valid_tumor_samples)
    
# # # # # #     if normal_df is not None:
# # # # # #         valid_normal_samples = [s for s in normal_samples if s in normal_df.columns]
# # # # # #         if not valid_normal_samples and normal_samples and normal_samples[0]:
# # # # # #             print(f"No valid normal samples found for {cancer_name} in {normalization} data: {normal_samples}")
# # # # # #         normal_df = normal_df[valid_normal_samples]
# # # # # #         if not normal_df.empty:
# # # # # #             normal_df = np.log2(normal_df + 1)
# # # # # #             normal_sample_ids = set(valid_normal_samples)

# # # # # #     if not tumor_df and not normal_df:
# # # # # #         print(f"No data available for {cancer_name} with normalization {normalization}")
# # # # # #         return None

# # # # # #     valid_genes = [g for g in genes if (tumor_df is not None and g in tumor_df.index) or (normal_df is not None and g in normal_df.index)]
# # # # # #     if not valid_genes:
# # # # # #         print(f"No valid genes found: {genes}")
# # # # # #         return None

# # # # # #     # Compute metrics for all genes at once
# # # # # #     tumor_results = {}
# # # # # #     normal_results = {}
# # # # # #     for metric in metrics:
# # # # # #         if metric in metric_funcs_gene:
# # # # # #             func = metric_funcs_gene[metric]
# # # # # #             if tumor_df is not None and not tumor_df.empty:
# # # # # #                 try:
# # # # # #                     tumor_metric_series = func(tumor_df)
# # # # # #                     if not isinstance(tumor_metric_series, pd.Series):
# # # # # #                         raise ValueError(f"{metric} did not return a Series")
# # # # # #                     tumor_results[metric] = tumor_metric_series
# # # # # #                     print(tumor_results)
# # # # # #                 except Exception as e:
# # # # # #                     print(f"Error computing {metric} for tumor data: {str(e)}")
# # # # # #                     tumor_results[metric] = pd.Series(0, index=tumor_df.index)
# # # # # #             else:
# # # # # #                 tumor_results[metric] = pd.Series(0, index=pd.Index(valid_genes))
                
# # # # # #             if normal_df is not None and not normal_df.empty:
# # # # # #                 try:
# # # # # #                     normal_metric_series = func(normal_df)
# # # # # #                     if not isinstance(normal_metric_series, pd.Series):
# # # # # #                         raise ValueError(f"{metric} did not return a Series")
# # # # # #                     normal_results[metric] = normal_metric_series
# # # # # #                     print(normal_results)
# # # # # #                 except Exception as e:
# # # # # #                     print(f"Error computing {metric} for normal data: {str(e)}")
# # # # # #                     normal_results[metric] = pd.Series(0, index=normal_df.index)
# # # # # #             else:
# # # # # #                 normal_results[metric] = pd.Series(0, index=pd.Index(valid_genes))

# # # # # #     for gene in valid_genes:
# # # # # #         gene_result = {
# # # # # #             "gene_id": gene,
# # # # # #             "gene_name": gene_names.get(gene, "Unknown"),
# # # # # #             "tumor": {"sample_count": len(tumor_sample_ids), "samples": list(tumor_sample_ids)},
# # # # # #             "normal": {"sample_count": len(normal_sample_ids), "samples": list(normal_sample_ids)},
# # # # # #         }

# # # # # #         for metric in metrics:
# # # # # #             tumor_value = None
# # # # # #             if metric in tumor_results and gene in tumor_results[metric].index:
# # # # # #                 tumor_value = tumor_results[metric].loc[gene]
# # # # # #                 if pd.isna(tumor_value):
# # # # # #                     print(f"NaN result for {metric} for {gene} (tumor) in {normalization}")
# # # # # #                     tumor_value = None

# # # # # #             normal_value = None
# # # # # #             if metric in normal_results and gene in normal_results[metric].index:
# # # # # #                 normal_value = normal_results[metric].loc[gene]
# # # # # #                 if pd.isna(normal_value):
# # # # # #                     print(f"NaN result for {metric} for {gene} (normal) in {normalization}")
# # # # # #                     normal_value = None

# # # # # #             gene_result["tumor"][metric] = tumor_value
# # # # # #             gene_result["normal"][metric] = normal_value

# # # # # #         results.append(gene_result)

# # # # # #     return results if results else None

# # # # # # # --- API Endpoints ---
# # # # # # @app.route('/api/calculate-metrics', methods=['GET', 'OPTIONS'])
# # # # # # def calculate_metrics():
# # # # # #     if request.method == 'OPTIONS':
# # # # # #         return '', 200

# # # # # #     cancer = request.args.get('cancer')
# # # # # #     method = request.args.get('method')
# # # # # #     metric = request.args.get('metric')

# # # # # #     print(f"[INFO] Received request: cancer={cancer}, method={method}, metric={metric}")

# # # # # #     if not all([cancer, method, metric]):
# # # # # #         return jsonify({"error": "Missing parameters: cancer, method, metric are required"}), 400

# # # # # #     cancer_key = cancer.lower()
# # # # # #     cancer_name = cancer_mapping.get(cancer_key)
# # # # # #     if not cancer_name:
# # # # # #         return jsonify({"error": f"Unsupported cancer name or code: {cancer}"}), 400

# # # # # #     try:
# # # # # #         results = compute_metrics_for_condition(cancer_name, base_raw_dir, {metric: metric_funcs_TH[metric]}, method)
# # # # # #         if not results or metric not in results:
# # # # # #             return jsonify({"error": f"Metric computation failed or no data for {cancer_name} with normalization {method}"}), 500

# # # # # #         return jsonify(results[metric])

# # # # # #     except FileNotFoundError as e:
# # # # # #         return jsonify({"error": f"Missing data file: {str(e)}"}), 404
# # # # # #     except Exception as e:
# # # # # #         return jsonify({"error": f"Internal error computing metrics: {str(e)}"}), 500

# # # # # # @app.route('/api/gene-metrics', methods=['GET', 'OPTIONS'])
# # # # # # def gene_metrics():
# # # # # #     if request.method == 'OPTIONS':
# # # # # #         return '', 200

# # # # # #     cancer = request.args.get('cancer')
# # # # # #     genes = request.args.get('genes', '').split(',')
# # # # # #     metrics = request.args.get('metrics', '').split(',')
# # # # # #     tumor_samples = request.args.get('tumor_samples', '').split(',')
# # # # # #     normal_samples = request.args.get('normal_samples', '').split(',')
# # # # # #     normalization = request.args.get('normalization', '')

# # # # # #     print(f"[INFO] Received request: cancer={cancer}, genes={genes}, metrics={metrics}, tumor_samples={len(tumor_samples)}, normal_samples={len(normal_samples)}, normalization={normalization}")

# # # # # #     if not all([cancer, genes, metrics, genes[0], metrics[0], normalization]):
# # # # # #         return jsonify({"error": "Missing parameters: cancer, genes, metrics, and normalization are required"}), 400

# # # # # #     cancer_key = cancer.lower()
# # # # # #     cancer_name = cancer_mapping.get(cancer_key)
# # # # # #     if not cancer_name:
# # # # # #         return jsonify({"error": f"Unsupported cancer name or code: {cancer}"}), 400

# # # # # #     try:
# # # # # #         results = compute_gene_metrics(cancer_name, base_raw_dir, genes, metrics, tumor_samples, normal_samples, normalization)
# # # # # #         print(results)
# # # # # #         if not results:
# # # # # #             return jsonify({"error": f"No data available for {cancer_name} with normalization {normalization} for specified genes/samples"}), 404

# # # # # #         return jsonify(results)

# # # # # #     except FileNotFoundError as e:
# # # # # #         return jsonify({"error": f"Missing data file: {str(e)}"}), 404
# # # # # #     except Exception as e:
# # # # # #         return jsonify({"error": f"Internal error computing gene metrics: {str(e)}"}), 500

# # # # # # # --- Run server ---
# # # # # # if __name__ == '__main__':
# # # # # #     app.run(debug=True, host='0.0.0.0', port=5001)
# # # # import os
# # # # import pandas as pd
# # # # import numpy as np
# # # # from flask import Flask, request, jsonify
# # # # from flask_cors import CORS

# # # # from cv import cv_calculation
# # # # from std import std_calculation
# # # # from MAD import mad_calculation
# # # # from DEPTH2 import depth2_calculation
# # # # from DEPTH_ITH import depth_ith_calculation

# # # # # --- Initialize Flask App ---
# # # # app = Flask(__name__)
# # # # CORS(app, resources={r"/api/*": {
# # # #     "origins": ["http://localhost:8080"],
# # # #     "methods": ["GET", "POST", "OPTIONS"],
# # # #     "allow_headers": ["Content-Type", "Authorization"],
# # # #     "supports_credentials": True
# # # # }})

# # # # # --- Globals ---
# # # # base_raw_dir = "../data/raw"
# # # # data_types = ["tpm", "fpkm", "fpkm_uq"]
# # # # metric_funcs_TH = {
# # # #     "DEPTH2": depth2_calculation,
# # # #     "tITH": depth_ith_calculation,
# # # # }
# # # # metric_funcs_gene = {
# # # #     "CV": cv_calculation,
# # # #     "MAD": mad_calculation,
# # # #     "std": std_calculation
# # # # }

# # # # cancer_mapping = {
# # # #     "liver and bile duct": "liver",
# # # #     "breast": "breast",
# # # #     "bladder": "bladder",
# # # #     "colorectal": "colon",
# # # #     "lung": "lung",
# # # #     "thymus": "thymus",
# # # #     "TCGA-LIHC": "liver",
# # # #     "TCGA-BRCA": "breast",
# # # #     "TCGA-BLCA": "bladder",
# # # #     "TCGA-COAD": "colon",
# # # #     "TCGA-LUAD": "lung",
# # # #     "TCGA-THYM": "thymus"
# # # # }

# # # # # --- Helpers ---
# # # # def load_expression_file(cancer_name, dtype, input_dir, cond):
# # # #     if cond == 'gene':
# # # #         filename = f"{dtype}.csv.gz"
# # # #     else:
# # # #         filename = f"tumor_{dtype}.csv.gz"
# # # #     filepath = os.path.join(input_dir, cancer_name, filename)
# # # #     try:
# # # #         df = pd.read_csv(filepath, index_col=0)
# # # #         # df = pd.read_csv(filepath, index_col=0, compression='gzip')
# # # #         df.drop(columns=["gene_name"], inplace=True, errors='ignore')
# # # #         df = df.groupby(df.index).mean()
# # # #         df = df.fillna(0)
# # # #         if df.empty or df.shape[1] == 0:
# # # #             return None
# # # #         return df
# # # #     except FileNotFoundError as e:
# # # #         print(f"File not found: {filepath}")
# # # #         raise
# # # #     except Exception as e:
# # # #         print(f"Failed to load file {filepath}: {e}")
# # # #         raise

# # # # def calculate_stats(values):
# # # #     if not values or len(values) == 0:
# # # #         return {'cv': 0, 'meanPlusStd': 0, 'mad': 0, 'median': 0}
# # # #     mean = np.mean(values)
# # # #     std = np.std(values) if len(values) > 1 else 0
# # # #     cv = (std / mean * 100) if mean != 0 else 0
# # # #     mad = np.mean(np.abs(values - mean)) if values else 0
# # # #     median = np.median(values) if values else 0
# # # #     return {'cv': cv, 'meanPlusStd': mean + std, 'mad': mad, 'median': median}


# # # # def compute_metrics_for_condition(cancer_name, input_dir, metric_funcs, condition):
# # # #     if condition == "tumor":
# # # #         expr_dfs = {}
# # # #         sample_ids = set()

# # # #         for dtype in data_types:
# # # #             try:
# # # #                 expr_df = load_expression_file(cancer_name, dtype, input_dir, "tumor")
# # # #                 if expr_df is not None:
# # # #                     expr_df = np.log2(expr_df + 1)
# # # #                     expr_dfs[dtype] = expr_df
# # # #                     sample_ids.update(expr_df.columns)
# # # #             except FileNotFoundError:
# # # #                 continue

# # # #         if not sample_ids:
# # # #             return None

# # # #         sample_ids = sorted(list(sample_ids))
# # # #         metric_results = {}

# # # #         for metric_name, func in metric_funcs.items():
# # # #             metric_data = {}
# # # #             for dtype in data_types:
# # # #                 expr_df = expr_dfs.get(dtype)
# # # #                 if expr_df is None:
# # # #                     metric_data[dtype] = [0] * len(sample_ids)
# # # #                     continue
# # # #                 try:
# # # #                     metric_series = func(expr_df)
# # # #                     if not isinstance(metric_series, pd.Series):
# # # #                         raise ValueError(f"{metric_name} did not return a Series")
# # # #                     metric_data[dtype] = metric_series.reindex(sample_ids, fill_value=0).tolist()
# # # #                 except Exception as e:
# # # #                     print(f"Error computing {metric_name} for {dtype}: {e}")
# # # #                     metric_data[dtype] = [0] * len(sample_ids)

# # # #             # Structure: list of dicts with sample_id and one value per dtype
# # # #             result_list = []
# # # #             for i, sid in enumerate(sample_ids):
# # # #                 record = {"sample_id": sid}
# # # #                 for dtype in data_types:
# # # #                     record[dtype] = metric_data[dtype][i]
# # # #                 result_list.append(record)
# # # #             metric_results[metric_name] = result_list

# # # #     # else:


# # # #     return metric_results if metric_results else None

# # # # # --- API Endpoint ---
# # # # @app.route('/api/calculate-metrics', methods=['GET'])
# # # # def calculate_metrics():
# # # #     cancer = request.args.get('cancer')
# # # #     method = request.args.get('method')
# # # #     metric = request.args.get('metric')

# # # #     print(f"[INFO] Received request: cancer={cancer}, method={method}, metric={metric}")

# # # #     if not all([cancer, method, metric]):
# # # #         return jsonify({"error": "Missing parameters"}), 400

# # # #     cancer_key = cancer.lower()
# # # #     cancer_name = cancer_mapping.get(cancer_key)
# # # #     if not cancer_name:
# # # #         return jsonify({"error": f"Unsupported cancer name or code: {cancer}"}), 400

# # # #     try:
# # # #         results = compute_metrics_for_condition(cancer_name, base_raw_dir, {metric: metric_funcs_TH[metric]}, "tumor")
# # # #         if not results or metric not in results:
# # # #             return jsonify({"error": "Metric computation failed or no data"}), 500

# # # #         return jsonify(results[metric])  # Send as list, not dict

# # # #     except FileNotFoundError as e:
# # # #         return jsonify({"error": f"Missing data file: {str(e)}"}), 404
# # # #     except Exception as e:
# # # #         return jsonify({"error": f"Internal error: {str(e)}"}), 500
    
# # # # @app.route('/api/gene_noise', methods=['GET'])
# # # # def gene_noise():
# # # #     cancer = request.args.get('cancer')
# # # #     metric = request.args.get('metric')
# # # #     genes_param = request.args.get('genes')
# # # #     tumor_samples_param = request.args.get('tumor_samples')
# # # #     normal_samples_param = request.args.get('normal_samples')
# # # #     print(metric)
# # # #     # Validate and parse inputs
# # # #     genes = [g.strip() for g in genes_param.split(',')] if genes_param else []
# # # #     tumor_samples = [s.strip() for s in tumor_samples_param.split(',')] if tumor_samples_param else []
# # # #     normal_samples = [s.strip() for s in normal_samples_param.split(',')] if normal_samples_param else []

# # # #     print(f"[INFO] Request: cancer={cancer}, metric={metric}, genes={genes}, tumor={len(tumor_samples)}, normal={len(normal_samples)}")

# # # #     if not all([cancer, metric, genes]):
# # # #         return jsonify({"error": "Missing parameters"}), 400

# # # #     if metric not in metric_funcs_gene:
# # # #         return jsonify({"error": f"Unsupported metric: {metric}"}), 400

# # # #     cancer_key = cancer.lower()
# # # #     cancer_name = cancer_mapping.get(cancer_key)
# # # #     if not cancer_name:
# # # #         return jsonify({"error": f"Unsupported cancer name: {cancer}"}), 400

# # # #     try:
# # # #         # Load expression data for all normalization types
# # # #         expr_dfs = {}
# # # #         for dtype in data_types:
# # # #             try:
# # # #                 expr_df = load_expression_file(cancer_name, dtype, base_raw_dir, "gene")
# # # #                 if expr_df is not None:
# # # #                     expr_df = np.log2(expr_df + 1)
# # # #                     expr_dfs[dtype] = expr_df
# # # #             except FileNotFoundError:
# # # #                 continue

# # # #         if not expr_dfs:
# # # #             return jsonify({"error": "No expression data found for this cancer"}), 404
# # # #         result = {}
# # # #         for i in metric:
# # # #             metric_func = metric_funcs_gene[i]
            

# # # #             for dtype, df in expr_dfs.items():
# # # #                 dtype_result = {}

# # # #                 for gene in genes:
# # # #                     if gene not in df.index:
# # # #                         continue

# # # #                     row = df.loc[gene]

# # # #                     tumor_vals = row[tumor_samples].dropna().values if tumor_samples else np.array([])
# # # #                     normal_vals = row[normal_samples].dropna().values if normal_samples else np.array([])
# # # #                     combined_vals = np.concatenate([tumor_vals, normal_vals]) if tumor_vals.size or normal_vals.size else np.array([])

# # # #                     dtype_result[gene] = {
# # # #                         f"{metric}_tumor": float(metric_func(tumor_vals)) if tumor_vals.size else 0,
# # # #                         f"{metric}_normal": float(metric_func(normal_vals)) if normal_vals.size else 0,
# # # #                         f"{metric}_combined": float(metric_func(combined_vals)) if combined_vals.size else 0
# # # #                     }

# # # #                 result[dtype] = dtype_result

# # # #         return jsonify(result)

# # # #     except FileNotFoundError as e:
# # # #         return jsonify({"error": f"Missing file: {str(e)}"}), 404
# # # #     except Exception as e:
# # # #         return jsonify({"error": f"Internal error: {str(e)}"}), 500



# # # # # --- Run server ---
# # # # if __name__ == '__main__':
# # # #     app.run(debug=True, host='0.0.0.0', port=5001)
# # # # @app.route('/api/gene_noise', methods=['GET'])
# # # # def gene_noise():
# # # #     cancer = request.args.get('cancer')
# # # #     metrics = request.args.get('metric').split(',') if request.args.get('metric') else []
# # # #     genes_param = request.args.get('genes')
# # # #     ensembl_param = request.args.get('gene_ensembl_id')
# # # #     tumor_samples_param = request.args.get('tumor_samples')
# # # #     normal_samples_param = request.args.get('normal_samples')
    
# # # #     # Validate and parse inputs
# # # #     genes = [g.strip() for g in ensembl_param.split(',')] if ensembl_param else []
# # # #     tumor_samples = [s.strip() for s in tumor_samples_param.split(',')] if tumor_samples_param else []
# # # #     normal_samples = [s.strip() for s in normal_samples_param.split(',')] if normal_samples_param else []

# # # #     print(f"[INFO] Request: cancer={cancer}, metrics={metrics}, genes={genes}, tumor={len(tumor_samples)}, normal={len(normal_samples)}")

# # # #     if not all([cancer, metrics, genes]):
# # # #         return jsonify({"error": "Missing parameters"}), 400

# # # #     # Validate metrics
# # # #     invalid_metrics = [m for m in metrics if m not in metric_funcs_gene]
# # # #     if invalid_metrics:
# # # #         return jsonify({"error": f"Unsupported metric: {','.join(invalid_metrics)}"}), 400

# # # #     cancer_key = cancer.lower()
# # # #     cancer_name = cancer_mapping.get(cancer_key)
# # # #     # if not cancer_name:
# # # #     #     return jsonify({"error": f"Unsupported cancer name: {cancer}"}), 400

# # # #     # try:
# # # #     #     # Load expression data for all normalization types
# # # #     #     expr_dfs = {}
# # # #     #     for dtype in data_types:
# # # #     #         try:
# # # #     #             expr_df = load_expression_file(cancer_name, dtype, base_raw_dir, "gene")
# # # #     #             if expr_df is not None:
# # # #     #                 expr_df = np.log2(expr_df + 1)
# # # #     #                 expr_dfs[dtype] = expr_df
# # # #     #         except FileNotFoundError:
# # # #     #             continue

# # # #     #     if not expr_dfs:
# # # #     #         return jsonify({"error": "No expression data found for this cancer"}), 404
# # # #     #     # Replace this section inside the /api/gene_noise route
# # # #     #     result = {}
# # # #     #     for dtype, df in expr_dfs.items():
# # # #     #         dtype_result = {}

# # # #     #         # Filter valid genes in the dataset
# # # #     #         valid_genes = [gene for gene in genes if gene in df.index]
# # # #     #         print(valid_genes)
# # # #     #         if not valid_genes:
# # # #     #             result[dtype] = {}
# # # #     #             continue

# # # #     #         # Subset data for tumor, normal, combined
# # # #     #         tumor_df = df.loc[valid_genes, tumor_samples] if tumor_samples else pd.DataFrame()
# # # #     #         normal_df = df.loc[valid_genes, normal_samples] if normal_samples else pd.DataFrame()
# # # #     #         combined_df = df.loc[valid_genes, tumor_samples + normal_samples] if tumor_samples or normal_samples else pd.DataFrame()
# # # #     #         print("tumor df:",tumor_df)
# # # #     #         print("normal df:", normal_df)
# # # #     #         for metric in metrics:
# # # #     #             metric_func = metric_funcs_gene[metric]
                
# # # #     #             # Compute metric for each condition
# # # #     #             tumor_metric = metric_func(tumor_df) if not tumor_df.empty else pd.Series(0, index=valid_genes)
# # # #     #             normal_metric = metric_func(normal_df) if not normal_df.empty else pd.Series(0, index=valid_genes)
# # # #     #             combined_metric = metric_func(combined_df) if not combined_df.empty else pd.Series(0, index=valid_genes)
# # # #     #             # print("tumor:",tumor_metric)
# # # #     #             # print("normal:", normal_metric)

# # # #     #             # Store only selected genes
# # # #     #             for gene in valid_genes:
# # # #     #                 if gene not in dtype_result:
# # # #     #                     dtype_result[gene] = {}
# # # #     #                 dtype_result[gene][f"{metric}_tumor"] = float(tumor_metric.get(gene, 0))
# # # #     #                 dtype_result[gene][f"{metric}_normal"] = float(normal_metric.get(gene, 0))
# # # #     #                 dtype_result[gene][f"{metric}_combined"] = float(combined_metric.get(gene, 0))

# # # #     #         result[dtype] = dtype_result

# # # #     #     # result = {}
# # # #     #     # for dtype, df in expr_dfs.items():
# # # #     #         # dtype_result = {}
# # # #     #         # for gene in genes:
# # # #     #         #     if gene not in df.index:
# # # #     #         #         continue

# # # #     #         #     row = df.loc[gene]
# # # #     #         #     print(row)
# # # #     #         #     tumor_vals = row[tumor_samples].dropna().values if tumor_samples else np.array([])
# # # #     #         #     normal_vals = row[normal_samples].dropna().values if normal_samples else np.array([])
# # # #     #         #     combined_vals = np.concatenate([tumor_vals, normal_vals]) if tumor_vals.size or normal_vals.size else np.array([])
# # # #     #         #     print(tumor_vals)
                
# # # #     #         #     dtype_result[gene] = {}
# # # #     #         #     for metric in metrics:
# # # #     #         #         metric_func = metric_funcs_gene[metric]
# # # #     #         #         dtype_result[gene][f"{metric}_tumor"] = float(metric_func(tumor_vals)) if tumor_vals.size else 0
# # # #     #         #         dtype_result[gene][f"{metric}_normal"] = float(metric_func(normal_vals)) if normal_vals.size else 0
# # # #     #         #         dtype_result[gene][f"{metric}_combined"] = float(metric_func(combined_vals)) if combined_vals.size else 0

# # # #     #         # result[dtype] = dtype_result
            
# # # #     #     print(result)
# # # #     #     return jsonify(result)
# # # #     results = compute_metrics_for_condition(
# # # #         cancer_name=cancer_name,
# # # #         input_dir=base_raw_dir,
# # # #         metric_funcs={m: metric_funcs_gene[m] for m in metrics},
# # # #         condition="gene",
# # # #         genes=genes,
# # # #         tumor_samples=tumor_samples,
# # # #         normal_samples=normal_samples
# # # #     )

# # # #     if not results:
# # # #         return jsonify({"error": "Metric computation failed or no data"}), 500

# # # #     return jsonify(results)


# # # #     # except FileNotFoundError as e:
# # # #     #     return jsonify({"error": f"Missing file: {str(e)}"}), 404
# # # #     # except Exception as e:
# # # #     #     return jsonify({"error": f"Internal error: {str(e)}"}), 500


# # # # @app.route('/api/gene_noise', methods=['GET'])
# # # # def gene_noise():
# # # #     cancer = request.args.get('cancer')
# # # #     metrics = request.args.get('metric').split(',') if request.args.get('metric') else []
# # # #     gene_ensembl_ids = request.args.get('gene_ensembl_id').split(',') if request.args.get('gene_ensembl_id') else []
# # # #     tumor_samples_param = request.args.get('tumor_samples')
# # # #     normal_samples_param = request.args.get('normal_samples')
    
# # # #     gene_ensembl_ids = [g.strip() for g in gene_ensembl_ids if g.strip()]
# # # #     tumor_samples = [s.strip() for s in tumor_samples_param.split(',')] if tumor_samples_param else []
# # # #     normal_samples = [s.strip() for s in normal_samples_param.split(',')] if normal_samples_param else []

# # # #     print(f"[INFO] Request: cancer={cancer}, metrics={metrics}, gene_ensembl_ids={gene_ensembl_ids}, tumor_samples={tumor_samples}, normal_samples={normal_samples}")

# # # #     if not all([cancer, metrics, gene_ensembl_ids]):
# # # #         return jsonify({"error": "Missing parameters (cancer, metric, or gene_ensembl_id)"}), 400

# # # #     invalid_metrics = [m for m in metrics if m not in metric_funcs_gene]
# # # #     if invalid_metrics:
# # # #         return jsonify({"error": f"Unsupported metric: {','.join(invalid_metrics)}"}), 400

# # # #     cancer_key = cancer.lower()
# # # #     cancer_name = cancer_mapping.get(cancer_key)
# # # #     if not cancer_name:
# # # #         return jsonify({"error": f"Unsupported cancer name: {cancer}"}), 400

# # # #     results = compute_metrics_for_condition(
# # # #         cancer_name=cancer_name,
# # # #         input_dir=base_raw_dir,
# # # #         metric_funcs={m: metric_funcs_gene[m] for m in metrics},
# # # #         condition="gene",
# # # #         genes=gene_ensembl_ids,
# # # #         tumor_samples=tumor_samples,
# # # #         normal_samples=normal_samples
# # # #     )

# # # #     if not results:
# # # #         return jsonify({"error": "Metric computation failed or no data"}), 500

# # # #     print(f"[DEBUG] Gene noise results: {results}")
# # # #     return jsonify(results)
# # # import os
# # # import pandas as pd
# # # import numpy as np
# # # from flask import Flask, request, jsonify
# # # from flask_cors import CORS
# # # from cv import cv_calculation
# # # from std import std_calculation
# # # from MAD import mad_calculation
# # # from DEPTH2 import depth2_calculation
# # # from DEPTH_ITH import depth_ith_calculation
# # # from gseapy import enrichr, gsea, prerank
# # # from cv_2 import cv2_calculation
# # # from mean import mean_calculation

# # # # Initialize Flask App
# # # app = Flask(__name__)
# # # CORS(app, resources={r"/api/*": {
# # #     "origins": ["http://localhost:8081"],
# # #     "methods": ["GET", "POST", "OPTIONS"],
# # #     "allow_headers": ["Content-Type", "Authorization"],
# # #     "supports_credentials": True
# # # }})

# # # # Globals
# # # base_raw_dir = "../data/raw"
# # # data_types = ["tpm", "fpkm", "fpkm_uq"]
# # # metric_funcs_TH = {
# # #     "DEPTH2": depth2_calculation,
# # #     "tITH": depth_ith_calculation,
# # # }
# # # metric_funcs_gene = {
# # #     "cv": cv_calculation,
# # #     "cv_squared": cv2_calculation,
# # #     "std": std_calculation,
# # #     "mad": mad_calculation,
# # #     "mean": mean_calculation
# # # }

# # # cancer_mapping = {
# # #     "liver and bile duct": "liver",
# # #     "breast": "breast",
# # #     "bladder": "bladder",
# # #     "colorectal": "colon",
# # #     "lung": "lung",
# # #     "thymus": "thymus",
# # #     "TCGA-LIHC": "liver",
# # #     "TCGA-BRCA": "breast",
# # #     "TCGA-BLCA": "bladder",
# # #     "TCGA-COAD": "colon",
# # #     "TCGA-LUAD": "lung",
# # #     "TCGA-THYM": "thymus"
# # # }

# # # # Helpers
# # # # def load_expression_file(cancer_name, dtype, input_dir, cond):
# # # #     if cond == 'gene':
# # # #         filename = f"{dtype}.csv.gz"
# # # #     else:
# # # #         filename = f"tumor_{dtype}.csv.gz"
# # # #     filepath = os.path.join(input_dir, cancer_name, filename)
# # # #     try:
# # # #         df = pd.read_csv(filepath, index_col=0, compression='gzip')
# # # #         # df = pd.read_csv(filepath, index_col=1)
# # # #         df.drop(columns=["gene_name"], inplace=True, errors='ignore')
# # # #         # df = df.groupby(df.index).mean()
# # # #         df = df.fillna(0)
# # # #         # print(df)
# # # #         # if df.empty or df.shape[1] == 0:
# # # #         if len(df) == 0:
# # # #             return None
# # # #         return df
# # # #     except FileNotFoundError as e:
# # # #         print(f"File not found: {filepath}")
# # # #         raise
# # # #     except Exception as e:
# # # #         print(f"Failed to load file {filepath}: {e}")
# # # #         raise

# # # def load_expression_file(cancer_name, dtype, input_dir, cond):
# # #     if cond == 'gene' or cond=='pathway':
# # #         filename = f"{dtype}.csv.gz"
# # #     else:
# # #         filename = f"tumor_{dtype}.csv.gz"
# # #     filepath = os.path.join(input_dir, cancer_name, filename)
# # #     try:
# # #         df = pd.read_csv(filepath, index_col=0)  # ensembl_id as index
# # #         print(f"[DEBUG] Loaded file: {filepath}, shape: {df.shape}")
# # #         print(f"[DEBUG] Columns: {df.columns.tolist()}")
# # #         print(f"[DEBUG] First few rows:\n{df.head()}")

# # #         # Drop non-numeric columns (e.g., gene_name or Hugo_Symbol)
# # #         if cond == 'pathway':
# # #             df = df.reset_index()
# # #             df = df.drop(columns=['gene_id'])
# # #             df = df.set_index('gene_name')
# # #         if 'gene_name' in df.columns:
# # #             df = df.drop(columns=['gene_name'])
# # #         if 'Hugo_Symbol' in df.columns:
# # #             df = df.drop(columns=['Hugo_Symbol'])
        
# # #         # Convert all columns to numeric
# # #         df = df.apply(pd.to_numeric, errors='coerce')
# # #         print(f"[DEBUG] After converting to numeric, shape: {df.shape}")
# # #         print(f"[DEBUG] Columns after conversion: {df.columns.tolist()}")

# # #         # Fill NaN values with column median
# # #         df = df.fillna(df.median())
# # #         print(f"[DEBUG] After filling NaN with median:\n{df.head()}")
# # #         print(f"[DEBUG] Remaining NaN values: {df.isna().sum().sum()}")

# # #         if len(df) == 0:
# # #             print(f"[DEBUG] Empty DataFrame for {filepath}")
# # #             return None
# # #         return df
# # #     except FileNotFoundError as e:
# # #         print(f"[ERROR] File not found: {filepath}")
# # #         raise
# # #     except Exception as e:
# # #         print(f"[ERROR] Failed to load file {filepath}: {e}")
# # #         raise

# # # def compute_metrics_for_condition(cancer_name, input_dir, metric_funcs, condition, genes=None, tumor_samples=None, normal_samples=None):
# # #     expr_dfs = {}
# # #     for dtype in data_types:
# # #         try:
# # #             expr_df = load_expression_file(cancer_name, dtype, input_dir, condition)
# # #             if expr_df is not None:
# # #                 # Remove log2 transformation to match script
# # #                 # expr_df = np.log2(expr_df + 1)  # Commented out
# # #                 print(f"[DEBUG] {dtype} DataFrame, shape: {expr_df.shape}")
# # #                 print(f"[DEBUG] {dtype} columns: {expr_df.columns.tolist()}")
# # #                 expr_dfs[dtype] = expr_df
# # #         except FileNotFoundError:
# # #             print(f"[DEBUG] File not found for {dtype}, skipping")
# # #             continue

# # #     if not expr_dfs:
# # #         print("[DEBUG] No expression data loaded")
# # #         return None

# # #     result = {}
# # #     if condition == "gene":
# # #         if not genes:
# # #             print("[DEBUG] No genes provided")
# # #             return None
# # #         for dtype, df in expr_dfs.items():
# # #             dtype_result = {}
# # #             valid_genes = [gene for gene in genes if gene in df.index]
# # #             print(f"[DEBUG] Valid genes for {dtype}: {valid_genes}")
# # #             if not valid_genes:
# # #                 print(f"[DEBUG] No valid genes found for {dtype}")
# # #                 result[dtype] = {}
# # #                 continue

# # #             # Filter samples to those present in the DataFrame
# # #             tumor_samples = [s for s in tumor_samples if s in df.columns] if tumor_samples else []
# # #             normal_samples = [s for s in normal_samples if s in df.columns] if normal_samples else []
# # #             print(f"[DEBUG] Valid tumor samples: {tumor_samples}")
# # #             print(f"[DEBUG] Valid normal samples: {normal_samples}")

# # #             tumor_df = df.loc[valid_genes, tumor_samples] if tumor_samples else pd.DataFrame(index=valid_genes)
# # #             normal_df = df.loc[valid_genes, normal_samples] if normal_samples else pd.DataFrame(index=valid_genes)
# # #             combined_df = df.loc[valid_genes, tumor_samples + normal_samples] if tumor_samples or normal_samples else pd.DataFrame(index=valid_genes)
# # #             print(f"[DEBUG] Tumor DataFrame shape: {tumor_df.shape}")
# # #             print(f"[DEBUG] Normal DataFrame shape: {normal_df.shape}")
# # #             print(f"[DEBUG] Combined DataFrame shape: {combined_df.shape}")

# # #             for metric_name, func in metric_funcs.items():
# # #                 try:
# # #                     tumor_metric = func(tumor_df) if not tumor_df.empty else pd.Series(0, index=valid_genes)
# # #                     normal_metric = func(normal_df) if not normal_df.empty else pd.Series(0, index=valid_genes)
# # #                     combined_metric = func(combined_df) if not combined_df.empty else pd.Series(0, index=valid_genes)
# # #                     print(f"[DEBUG] {metric_name} tumor metric: {tumor_metric.to_dict()}")
# # #                     print(f"[DEBUG] {metric_name} normal metric: {normal_metric.to_dict()}")
# # #                     print(f"[DEBUG] {metric_name} combined metric: {combined_metric.to_dict()}")
# # #                 except Exception as e:
# # #                     print(f"[ERROR] Error computing {metric_name}: {e}")
# # #                     tumor_metric = pd.Series(0, index=valid_genes)
# # #                     normal_metric = pd.Series(0, index=valid_genes)
# # #                     combined_metric = pd.Series(0, index=valid_genes)

# # #                 for gene in valid_genes:
# # #                     if gene not in dtype_result:
# # #                         dtype_result[gene] = {}
# # #                     dtype_result[gene][f"{metric_name}_tumor"] = float(tumor_metric.get(gene, 0))
# # #                     dtype_result[gene][f"{metric_name}_normal"] = float(normal_metric.get(gene, 0))
# # #                     dtype_result[gene][f"{metric_name}_combined"] = float(combined_metric.get(gene, 0))

# # #             result[dtype] = dtype_result
# # #     elif condition == "tumor":
# # #         sample_ids = set()
# # #         for df in expr_dfs.values():
# # #             sample_ids.update(df.columns)
# # #         sample_ids = sorted(list(sample_ids))
# # #         metric_results = {}
# # #         for metric_name, func in metric_funcs.items():
# # #             metric_data = {}
# # #             for dtype in data_types:
# # #                 expr_df = expr_dfs.get(dtype)
# # #                 if expr_df is None:
# # #                     metric_data[dtype] = [0] * len(sample_ids)
# # #                     continue
# # #                 try:
# # #                     metric_series = func(expr_df)
# # #                     if not isinstance(metric_series, pd.Series):
# # #                         raise ValueError(f"{metric_name} did not return a Series")
# # #                     metric_data[dtype] = metric_series.reindex(sample_ids, fill_value=0).tolist()
# # #                 except Exception as e:
# # #                     print(f"[ERROR] Error computing {metric_name} for {dtype}: {e}")
# # #                     metric_data[dtype] = [0] * len(sample_ids)

# # #             result_list = []
# # #             for i, sid in enumerate(sample_ids):
# # #                 record = {"sample_id": sid}
# # #                 for dtype in data_types:
# # #                     record[dtype] = metric_data[dtype][i]
# # #                 result_list.append(record)
# # #             metric_results[metric_name] = result_list
# # #         return metric_results if metric_results else None

# # #     print(f"[DEBUG] Final result for {cancer_name}: {result}")
# # #     return result if result else None

# # # # API Endpoint
# # # @app.route('/api/TH-metrics', methods=['GET'])
# # # def TH_metrics():
# # #     cancer = request.args.get('cancer')
# # #     method = request.args.get('method')
# # #     metric = request.args.get('metric')

# # #     print(f"[INFO] Received request: cancer={cancer}, method={method}, metric={metric}")

# # #     if not all([cancer, method, metric]):
# # #         return jsonify({"error": "Missing parameters"}), 400

# # #     cancer_key = cancer.lower()
# # #     cancer_name = cancer_mapping.get(cancer_key)
# # #     if not cancer_name:
# # #         return jsonify({"error": f"Unsupported cancer name or code: {cancer}"}), 400

# # #     try:
# # #         # results = compute_metrics_for_condition(cancer_name, base_raw_dir, {metric: metric_funcs_TH[metric]}, "tumor")
# # #         # if not results or metric not in results:
# # #         #     return jsonify({"error": "Metric computation failed or no data"}), 500
# # #         results = compute_metrics_for_condition(
# # #             cancer_name=cancer_name,
# # #             input_dir=base_raw_dir,
# # #             metric_funcs={metric: metric_funcs_TH[metric]},
# # #             condition="tumor"
# # #         )

# # #         if not results or metric not in results:
# # #             return jsonify({"error": "Metric computation failed or no data"}), 500

# # #         return jsonify(results[metric])


# # #         # return jsonify(results[metric])
# # #     except FileNotFoundError as e:
# # #         return jsonify({"error": f"Missing data file: {str(e)}"}), 404
# # #     except Exception as e:
# # #         return jsonify({"error": f"Internal error: {str(e)}"}), 500

# # # @app.route('/api/gene_noise', methods=['GET'])
# # # def gene_noise():
# # #     cancer = request.args.get('cancer')
# # #     metrics = request.args.get('metric').split(',') if request.args.get('metric') else []
# # #     gene_ensembl_ids = request.args.get('gene_ensembl_id').split(',') if request.args.get('gene_ensembl_id') else []
# # #     tumor_samples_param = request.args.get('tumor_samples')
# # #     normal_samples_param = request.args.get('normal_samples')
    
# # #     gene_ensembl_ids = [g.strip() for g in gene_ensembl_ids if g.strip()]
# # #     tumor_samples = [s.strip() for s in tumor_samples_param.split(',')] if tumor_samples_param else []
# # #     normal_samples = [s.strip() for s in normal_samples_param.split(',')] if normal_samples_param else []

# # #     print(f"[INFO] Request: cancer={cancer}, metrics={metrics}, gene_ensembl_ids={gene_ensembl_ids}, tumor_samples={len(tumor_samples)}, normal_samples={len(normal_samples)}")

# # #     if not all([cancer, metrics, gene_ensembl_ids]):
# # #         return jsonify({"error": "Missing parameters (cancer, metric, or gene_ensembl_id)"}), 400

# # #     invalid_metrics = [m for m in metrics if m not in metric_funcs_gene]
# # #     if invalid_metrics:
# # #         return jsonify({"error": f"Unsupported metric: {','.join(invalid_metrics)}"}), 400

# # #     cancer_key = cancer.lower()
# # #     cancer_name = cancer_mapping.get(cancer_key)
# # #     if not cancer_name:
# # #         return jsonify({"error": f"Unsupported cancer name: {cancer}"}), 400

# # #     try:
# # #         results = compute_metrics_for_condition(
# # #             cancer_name=cancer_name,
# # #             input_dir=base_raw_dir,
# # #             metric_funcs={m: metric_funcs_gene[m] for m in metrics},
# # #             condition="gene",
# # #             genes=gene_ensembl_ids,
# # #             tumor_samples=tumor_samples,
# # #             normal_samples=normal_samples
# # #         )

# # #         if not results:
# # #             return jsonify({"error": "Metric computation failed or no data"}), 500

# # #         print(f"[DEBUG] Gene noise results: {results}")
# # #         return jsonify(results)
# # #     except Exception as e:
# # #         print(f"[ERROR] Error in gene_noise: {str(e)}")
# # #         return jsonify({"error": f"Internal error: {str(e)}"}), 500
    
# # # @app.route('/api/pathway-analysis', methods=['GET'])
# # # def pathway_analysis():
# # #     try:
# # #         cancer = request.args.get("cancer")
# # #         method = request.args.get("method", "tpm")
# # #         tumor_samples_param = request.args.get("tumor_samples", "")
# # #         normal_samples_param = request.args.get("normal_samples", "")
# # #         top_n = int(request.args.get("top_n", 200))
# # #         print(top_n)
# # #         tumor_samples = [s.strip() for s in tumor_samples_param.split(',') if s.strip()]
# # #         normal_samples = [s.strip() for s in normal_samples_param.split(',') if s.strip()]

# # #         if not cancer or not tumor_samples or not normal_samples:
# # #             return jsonify({"error": "Missing required parameters"}), 400

# # #         cancer_key = cancer.lower()
# # #         cancer_name = cancer_mapping.get(cancer_key)
# # #         if not cancer_name:
# # #             return jsonify({"error": f"Un   supported cancer name: {cancer}"}), 400

# # #         expr_df = load_expression_file(cancer_name, method, base_raw_dir, "pathway")
# # #         if expr_df is None:
# # #             return jsonify({"error": "Expression file not found"}), 404

# # #         # expr_df = np.log2(expr_df + 1)

# # #         tumor_samples = [s for s in tumor_samples if s in expr_df.columns]
# # #         normal_samples = [s for s in normal_samples if s in expr_df.columns]

# # #         if not tumor_samples or not normal_samples:
# # #             return jsonify({"error": "No valid tumor/normal sample IDs found in expression data"}), 400

# # #         tumor_mean = expr_df[tumor_samples].mean(axis=1)
# # #         normal_mean = expr_df[normal_samples].mean(axis=1)
# # #         # log2fc = tumor_mean - normal_mean
        
# # #         # top_genes = log2fc.sort_values(ascending=False).head(top_n).index.tolist()
# # #         # GSEA expects a ranked series: gene_name -> score
# # #         # ranks = log2fc.sort_values(ascending=False)

# # #         # # Calculate mean expression for top genes
# # #         # gene_stats = {}
# # #         # for gene in top_genes:
# # #         #     tumor_vals = expr_df.loc[gene, tumor_samples].dropna().values if tumor_samples else np.array([])
# # #         #     normal_vals = expr_df.loc[gene, normal_samples].dropna().values if normal_samples else np.array([])
# # #         #     gene_stats[gene] = {
# # #         #         "mean_tumor": float(np.mean(tumor_vals)) if tumor_vals.size else 0,
# # #         #         "mean_normal": float(np.mean(normal_vals)) if normal_vals.size else 0
# # #         #     }

# # #         # # enr = enrichr(gene_list=top_genes,
# # #         # #               gene_sets="KEGG_2021_Human",
# # #         # #               organism="Human",
# # #         # #               outdir=None,
# # #         # #               cutoff=0.05)
# # #         # gsea_results = gsea(
# # #         #     data=ranks,
# # #         #     gene_sets='KEGG_2021_Human',
# # #         #     cls=None,  # not needed when data is pre-ranked
# # #         #     permutation_type='gene_set',
# # #         #     outdir=None,
# # #         #     processes=4,
# # #         #     format='png',
# # #         #     seed=42
# # #         # )

# # #         # results_df = enr.results
# # #         # results = results_df[["Term", "P-value", "Adjusted P-value", "Odds Ratio", "Combined Score"]].head(10).to_dict(orient="records")
# # #         # # enr = enrichr(gene_list=top_genes,
# # #         # #               gene_sets="GO_Biological_Process_2021",
# # #         # #               organism="Human",
# # #         # #               outdir=None,
# # #         # #               cutoff=0.05)

# # #         # # results_df = enr.results
# # #         # # results = results_df[["Term", "P-value", "Adjusted P-value", "Odds Ratio", "Combined Score"]].head(10).to_dict(orient="records")
# # #         # print(f"[INFO] Pathway analysis response: {results}, top_genes: {top_genes}")
# # #         # return jsonify({
# # #         #     "enrichment": results,
# # #         #     "top_genes": top_genes,
# # #         #     "gene_stats": gene_stats
# # #         # })
# # #         ranks = tumor_mean - normal_mean  # or log2FC if already defined
# # #         ranks = ranks.sort_values(ascending=False)

# # #         # gsea_results = gsea(
# # #         #     data=ranks,
# # #         #     gene_sets='KEGG_2021_Human',
# # #         #     cls=None,
# # #         #     permutation_type='gene_set',
# # #         #     outdir=None,
# # #         #     processes=4,
# # #         #     format='png',
# # #         #     seed=42
# # #         # )
# # #         gsea_results = prerank(
# # #             rnk=ranks,
# # #             gene_sets='KEGG_2021_Human',
# # #             outdir=None,
# # #             permutation_num=100,  # fewer for faster testing, more for production
# # #             seed=42,
# # #             threads=4,
# # #         )

# # #         results_df = gsea_results.res2d
# # #         results = results_df[["Term", "NES", "FDR q-val"]].head(10).to_dict(orient="records")
# # #         return jsonify({
# # #         "enrichment": results,
# # #         "ranked_genes": ranks.head(100).to_dict()  # optional
# # #     })


# # #     except Exception as e:
# # #         print(f"[ERROR] Pathway analysis failed: {e}")
# # #         return jsonify({"error": f"Internal server error: {str(e)}"}), 500


# # # # Run server
# # # if __name__ == '__main__':
# # #     app.run(debug=True, host='0.0.0.0', port=5001)

# # # # # import os
# # # # # import pandas as pd
# # # # # import numpy as np
# # # # # from flask import Flask, request, jsonify
# # # # # from flask_cors import CORS
# # # # # from cv import cv_calculation
# # # # # from std import std_calculation
# # # # # from MAD import mad_calculation
# # # # # from DEPTH2 import depth2_calculation
# # # # # from DEPTH_ITH import depth_ith_calculation
# # # # # from gseapy import enrichr
# # # # # from cv_2 import cv2_calculation
# # # # # from mean import mean_calculation

# # # # # # Initialize Flask App
# # # # # app = Flask(__name__)
# # # # # CORS(app, resources={r"/api/*": {
# # # # #     "origins": ["http://localhost:8081"],
# # # # #     "methods": ["GET", "POST", "OPTIONS"],
# # # # #     "allow_headers": ["Content-Type", "Authorization"],
# # # # #     "supports_credentials": True
# # # # # }})

# # # # # # Globals
# # # # # base_raw_dir = "../data/raw"
# # # # # data_types = ["tpm", "fpkm", "fpkm_uq"]
# # # # # metric_funcs_TH = {
# # # # #     "DEPTH2": depth2_calculation,
# # # # #     "tITH": depth_ith_calculation,
# # # # # }
# # # # # metric_funcs_gene = {
# # # # #     "cv": cv_calculation,
# # # # #     "cv_squared": cv2_calculation,
# # # # #     "std": std_calculation,
# # # # #     "mad": mad_calculation,
# # # # #     "mean": mean_calculation
# # # # # }

# # # # # cancer_mapping = {
# # # # #     "liver and bile duct": "liver",
# # # # #     "breast": "breast",
# # # # #     "bladder": "bladder",
# # # # #     "colorectal": "colon",
# # # # #     "lung": "lung",
# # # # #     "thymus": "thymus",
# # # # #     "TCGA-LIHC": "liver",
# # # # #     "TCGA-BRCA": "breast",
# # # # #     "TCGA-BLCA": "bladder",
# # # # #     "TCGA-COAD": "colon",
# # # # #     "TCGA-LUAD": "lung",
# # # # #     "TCGA-THYM": "thymus"
# # # # # }

# # # # # def load_expression_file(cancer_name, dtype, input_dir, cond):
# # # # #     if cond == 'gene' or cond=='pathway':
# # # # #         filename = f"{dtype}.csv.gz"
# # # # #     else:
# # # # #         filename = f"tumor_{dtype}.csv.gz"
# # # # #     filepath = os.path.join(input_dir, cancer_name, filename)
# # # # #     try:
# # # # #         df = pd.read_csv(filepath, index_col=0)  # ensembl_id as index
# # # # #         print(f"[DEBUG] Loaded file: {filepath}, shape: {df.shape}")
# # # # #         print(f"[DEBUG] Columns: {df.columns.tolist()}")
# # # # #         print(f"[DEBUG] First few rows:\n{df.head()}")

# # # # #         # Drop non-numeric columns (e.g., gene_name or Hugo_Symbol)
# # # # #         if cond == 'pathway':
# # # # #             df = df.reset_index()
# # # # #             df = df.drop(columns=['gene_id'])
# # # # #             df = df.set_index('gene_name')
# # # # #         if 'gene_name' in df.columns:
# # # # #             df = df.drop(columns=['gene_name'])
# # # # #         if 'Hugo_Symbol' in df.columns:
# # # # #             df = df.drop(columns=['Hugo_Symbol'])
        
# # # # #         # Convert all columns to numeric
# # # # #         df = df.apply(pd.to_numeric, errors='coerce')
# # # # #         print(f"[DEBUG] After converting to numeric, shape: {df.shape}")
# # # # #         print(f"[DEBUG] Columns after conversion: {df.columns.tolist()}")

# # # # #         # Fill NaN values with column median
# # # # #         df = df.fillna(df.median())
# # # # #         print(f"[DEBUG] After filling NaN with median:\n{df.head()}")
# # # # #         print(f"[DEBUG] Remaining NaN values: {df.isna().sum().sum()}")

# # # # #         if len(df) == 0:
# # # # #             print(f"[DEBUG] Empty DataFrame for {filepath}")
# # # # #             return None
# # # # #         return df
# # # # #     except FileNotFoundError as e:
# # # # #         print(f"[ERROR] File not found: {filepath}")
# # # # #         raise
# # # # #     except Exception as e:
# # # # #         print(f"[ERROR] Failed to load file {filepath}: {e}")
# # # # #         raise

# # # # # def compute_metrics_for_condition(cancer_name, input_dir, metric_funcs, condition, genes=None, tumor_samples=None, normal_samples=None):
# # # # #     expr_dfs = {}
# # # # #     for dtype in data_types:
# # # # #         try:
# # # # #             expr_df = load_expression_file(cancer_name, dtype, input_dir, condition)
# # # # #             if expr_df is not None:
# # # # #                 print(f"[DEBUG] {dtype} DataFrame, shape: {expr_df.shape}")
# # # # #                 print(f"[DEBUG] {dtype} columns: {expr_df.columns.tolist()}")
# # # # #                 expr_dfs[dtype] = expr_df
# # # # #         except FileNotFoundError:
# # # # #             print(f"[DEBUG] File not found for {dtype}, skipping")
# # # # #             continue

# # # # #     if not expr_dfs:
# # # # #         print("[DEBUG] No expression data loaded")
# # # # #         return None

# # # # #     result = {}
# # # # #     if condition == "gene":
# # # # #         if not genes:
# # # # #             print("[DEBUG] No genes provided")
# # # # #             return None
# # # # #         for dtype, df in expr_dfs.items():
# # # # #             dtype_result = {}
# # # # #             valid_genes = [gene for gene in genes if gene in df.index]
# # # # #             print(f"[DEBUG] Valid genes for {dtype}: {valid_genes}")
# # # # #             if not valid_genes:
# # # # #                 print(f"[DEBUG] No valid genes found for {dtype}")
# # # # #                 result[dtype] = {}
# # # # #                 continue

# # # # #             # Filter samples to those present in the DataFrame
# # # # #             tumor_samples = [s for s in tumor_samples if s in df.columns] if tumor_samples else []
# # # # #             normal_samples = [s for s in normal_samples if s in df.columns] if normal_samples else []
# # # # #             print(f"[DEBUG] Valid tumor samples: {tumor_samples}")
# # # # #             print(f"[DEBUG] Valid normal samples: {normal_samples}")

# # # # #             tumor_df = df.loc[valid_genes, tumor_samples] if tumor_samples else pd.DataFrame(index=valid_genes)
# # # # #             normal_df = df.loc[valid_genes, normal_samples] if normal_samples else pd.DataFrame(index=valid_genes)
# # # # #             combined_df = df.loc[valid_genes, tumor_samples + normal_samples] if tumor_samples or normal_samples else pd.DataFrame(index=valid_genes)
# # # # #             print(f"[DEBUG] Tumor DataFrame shape: {tumor_df.shape}")
# # # # #             print(f"[DEBUG] Normal DataFrame shape: {normal_df.shape}")
# # # # #             print(f"[DEBUG] Combined DataFrame shape: {combined_df.shape}")

# # # # #             for metric_name, func in metric_funcs.items():
# # # # #                 try:
# # # # #                     tumor_metric = func(tumor_df) if not tumor_df.empty else pd.Series(0, index=valid_genes)
# # # # #                     normal_metric = func(normal_df) if not normal_df.empty else pd.Series(0, index=valid_genes)
# # # # #                     combined_metric = func(combined_df) if not combined_df.empty else pd.Series(0, index=valid_genes)
# # # # #                     print(f"[DEBUG] {metric_name} tumor metric: {tumor_metric.to_dict()}")
# # # # #                     print(f"[DEBUG] {metric_name} normal metric: {normal_metric.to_dict()}")
# # # # #                     print(f"[DEBUG] {metric_name} combined metric: {combined_metric.to_dict()}")
# # # # #                 except Exception as e:
# # # # #                     print(f"[ERROR] Error computing {metric_name}: {e}")
# # # # #                     tumor_metric = pd.Series(0, index=valid_genes)
# # # # #                     normal_metric = pd.Series(0, index=valid_genes)
# # # # #                     combined_metric = pd.Series(0, index=valid_genes)

# # # # #                 for gene in valid_genes:
# # # # #                     if gene not in dtype_result:
# # # # #                         dtype_result[gene] = {}
# # # # #                     dtype_result[gene][f"{metric_name}_tumor"] = float(tumor_metric.get(gene, 0))
# # # # #                     dtype_result[gene][f"{metric_name}_normal"] = float(normal_metric.get(gene, 0))
# # # # #                     dtype_result[gene][f"{metric_name}_combined"] = float(combined_metric.get(gene, 0))

# # # # #             result[dtype] = dtype_result
# # # # #     elif condition == "tumor":
# # # # #         sample_ids = set()
# # # # #         for df in expr_dfs.values():
# # # # #             sample_ids.update(df.columns)
# # # # #         sample_ids = sorted(list(sample_ids))
# # # # #         metric_results = {}
# # # # #         for metric_name, func in metric_funcs.items():
# # # # #             metric_data = {}
# # # # #             for dtype in data_types:
# # # # #                 expr_df = expr_dfs.get(dtype)
# # # # #                 if expr_df is None:
# # # # #                     metric_data[dtype] = [0] * len(sample_ids)
# # # # #                     continue
# # # # #                 try:
# # # # #                     metric_series = func(expr_df)
# # # # #                     if not isinstance(metric_series, pd.Series):
# # # # #                         raise ValueError(f"{metric_name} did not return a Series")
# # # # #                     metric_data[dtype] = metric_series.reindex(sample_ids, fill_value=0).tolist()
# # # # #                 except Exception as e:
# # # # #                     print(f"[ERROR] Error computing {metric_name} for {dtype}: {e}")
# # # # #                     metric_data[dtype] = [0] * len(sample_ids)

# # # # #             result_list = []
# # # # #             for i, sid in enumerate(sample_ids):
# # # # #                 record = {"sample_id": sid}
# # # # #                 for dtype in data_types:
# # # # #                     record[dtype] = metric_data[dtype][i]
# # # # #                 result_list.append(record)
# # # # #             metric_results[metric_name] = result_list
# # # # #         return metric_results if metric_results else None

# # # # #     print(f"[DEBUG] Final result for {cancer_name}: {result}")
# # # # #     return result if result else None

# # # # # # API Endpoint
# # # # # @app.route('/api/TH-metrics', methods=['GET'])
# # # # # def TH_metrics():
# # # # #     cancer = request.args.get('cancer')
# # # # #     method = request.args.get('method')
# # # # #     metric = request.args.get('metric')

# # # # #     print(f"[INFO] Received request: cancer={cancer}, method={method}, metric={metric}")

# # # # #     if not all([cancer, method, metric]):
# # # # #         return jsonify({"error": "Missing parameters"}), 400

# # # # #     cancer_key = cancer.lower()
# # # # #     cancer_name = cancer_mapping.get(cancer_key)
# # # # #     if not cancer_name:
# # # # #         return jsonify({"error": f"Unsupported cancer name or code: {cancer}"}), 400

# # # # #     try:
# # # # #         results = compute_metrics_for_condition(
# # # # #             cancer_name=cancer_name,
# # # # #             input_dir=base_raw_dir,
# # # # #             metric_funcs={metric: metric_funcs_TH[metric]},
# # # # #             condition="tumor"
# # # # #         )

# # # # #         if not results or metric not in results:
# # # # #             return jsonify({"error": "Metric computation failed or no data"}), 500

# # # # #         return jsonify(results[metric])
# # # # #     except FileNotFoundError as e:
# # # # #         return jsonify({"error": f"Missing data file: {str(e)}"}), 404
# # # # #     except Exception as e:
# # # # #         return jsonify({"error": f"Internal error: {str(e)}"}), 500

# # # # # @app.route('/api/gene_noise', methods=['GET'])
# # # # # def gene_noise():
# # # # #     cancer = request.args.get('cancer')
# # # # #     metrics = request.args.get('metric').split(',') if request.args.get('metric') else []
# # # # #     gene_ensembl_ids = request.args.get('gene_ensembl_id').split(',') if request.args.get('gene_ensembl_id') else []
# # # # #     tumor_samples_param = request.args.get('tumor_samples')
# # # # #     normal_samples_param = request.args.get('normal_samples')
    
# # # # #     gene_ensembl_ids = [g.strip() for g in gene_ensembl_ids if g.strip()]
# # # # #     tumor_samples = [s.strip() for s in tumor_samples_param.split(',')] if tumor_samples_param else []
# # # # #     normal_samples = [s.strip() for s in normal_samples_param.split(',')] if normal_samples_param else []

# # # # #     print(f"[INFO] Request: cancer={cancer}, metrics={metrics}, gene_ensembl_ids={gene_ensembl_ids}, tumor_samples={len(tumor_samples)}, normal_samples={len(normal_samples)}")

# # # # #     if not all([cancer, metrics, gene_ensembl_ids]):
# # # # #         return jsonify({"error": "Missing parameters (cancer, metric, or gene_ensembl_id)"}), 400

# # # # #     invalid_metrics = [m for m in metrics if m not in metric_funcs_gene]
# # # # #     if invalid_metrics:
# # # # #         return jsonify({"error": f"Unsupported metric: {','.join(invalid_metrics)}"}), 400

# # # # #     cancer_key = cancer.lower()
# # # # #     cancer_name = cancer_mapping.get(cancer_key)
# # # # #     if not cancer_name:
# # # # #         return jsonify({"error": f"Unsupported cancer name: {cancer}"}), 400

# # # # #     try:
# # # # #         results = compute_metrics_for_condition(
# # # # #             cancer_name=cancer_name,
# # # # #             input_dir=base_raw_dir,
# # # # #             metric_funcs={m: metric_funcs_gene[m] for m in metrics},
# # # # #             condition="gene",
# # # # #             genes=gene_ensembl_ids,
# # # # #             tumor_samples=tumor_samples,
# # # # #             normal_samples=normal_samples
# # # # #         )

# # # # #         if not results:
# # # # #             return jsonify({"error": "Metric computation failed or no data"}), 500

# # # # #         print(f"[DEBUG] Gene noise results: {results}")
# # # # #         return jsonify(results)
# # # # #     except Exception as e:
# # # # #         print(f"[ERROR] Error in gene_noise: {str(e)}")
# # # # #         return jsonify({"error": f"Internal error: {str(e)}"}), 500
    
# # # # # @app.route('/api/pathway-analysis', methods=['GET'])
# # # # # def pathway_analysis():
# # # # #     try:
# # # # #         cancer = request.args.get("cancer")
# # # # #         method = request.args.get("method", "tpm")
# # # # #         tumor_samples_param = request.args.get("tumor_samples", "")
# # # # #         normal_samples_param = request.args.get("normal_samples", "")
# # # # #         genes_param = request.args.get("genes", "")
# # # # #         top_n = int(request.args.get("top_n", 200))
        
# # # # #         tumor_samples = [s.strip() for s in tumor_samples_param.split(',') if s.strip()]
# # # # #         normal_samples = [s.strip() for s in normal_samples_param.split(',') if s.strip()]
# # # # #         genes = [g.strip() for g in genes_param.split(',') if g.strip()]

# # # # #         print(f"[INFO] Request: cancer={cancer}, method={method}, tumor_samples={len(tumor_samples)}, normal_samples={len(normal_samples)}, genes={genes}, top_n={top_n}")

# # # # #         if not cancer or not tumor_samples or not normal_samples:
# # # # #             return jsonify({"error": "Missing required parameters (cancer, tumor_samples, normal_samples)"}), 400

# # # # #         cancer_key = cancer.lower()
# # # # #         cancer_name = cancer_mapping.get(cancer_key)
# # # # #         if not cancer_name:
# # # # #             return jsonify({"error": f"Unsupported cancer name: {cancer}"}), 400

# # # # #         expr_df = load_expression_file(cancer_name, method, base_raw_dir, "pathway")
# # # # #         if expr_df is None:
# # # # #             return jsonify({"error": "Expression file not found"}), 404

# # # # #         tumor_samples = [s for s in tumor_samples if s in expr_df.columns]
# # # # #         normal_samples = [s for s in normal_samples if s in expr_df.columns]

# # # # #         if not tumor_samples or not normal_samples:
# # # # #             return jsonify({"error": "No valid tumor/normal sample IDs found in expression data"}), 400

# # # # #         # Use provided genes if available, otherwise calculate top genes based on log2fc
# # # # #         if genes:
# # # # #             valid_genes = [g for g in genes if g in expr_df.index]
# # # # #             if not valid_genes:
# # # # #                 return jsonify({"error": "No valid gene IDs found in expression data"}), 400
# # # # #             selected_genes = valid_genes
# # # # #         else:
# # # # #             tumor_mean = expr_df[tumor_samples].mean(axis=1)
# # # # #             normal_mean = expr_df[normal_samples].mean(axis=1)
# # # # #             log2fc = tumor_mean - normal_mean
# # # # #             selected_genes = log2fc.sort_values(ascending=False).head(top_n).index.tolist()

# # # # #         # Calculate mean expression for selected genes
# # # # #         gene_stats = {}
# # # # #         for gene in selected_genes:
# # # # #             tumor_vals = expr_df.loc[gene, tumor_samples].dropna().values if tumor_samples else np.array([])
# # # # #             normal_vals = expr_df.loc[gene, normal_samples].dropna().values if normal_samples else np.array([])
# # # # #             gene_stats[gene] = {
# # # # #                 "mean_tumor": float(np.mean(tumor_vals)) if tumor_vals.size else 0,
# # # # #                 "mean_normal": float(np.mean(normal_vals)) if normal_vals.size else 0
# # # # #             }

# # # # #         # Perform pathway enrichment analysis
# # # # #         enr = enrichr(gene_list=selected_genes,
# # # # #                       gene_sets="KEGG_2021_Human",
# # # # #                       organism="Human",
# # # # #                       outdir=None,
# # # # #                       cutoff=0.05)

# # # # #         results_df = enr.results
# # # # #         results = results_df[["Term", "P-value", "Adjusted P-value", "Odds Ratio", "Combined Score"]].head(10).to_dict(orient="records")

# # # # #         print(f"[INFO] Pathway analysis response: enrichment={len(results)}, top_genes={len(selected_genes)}")
# # # # #         return jsonify({
# # # # #             "enrichment": results,
# # # # #             "top_genes": selected_genes,
# # # # #             "gene_stats": gene_stats
# # # # #         })

# # # # #     except Exception as e:
# # # # #         print(f"[ERROR] Pathway analysis failed: {e}")
# # # # #         return jsonify({"error": f"Internal server error: {str(e)}"}), 500

# # # # # # Run server
# # # # # if __name__ == '__main__':
# # # # #     app.run(debug=True, host='0.0.0.0', port=5001)
# # # # import os
# # # # import pandas as pd
# # # # import numpy as np
# # # # from flask import Flask, request, jsonify
# # # # from flask_cors import CORS
# # # # from cv import cv_calculation
# # # # from std import std_calculation
# # # # from MAD import mad_calculation
# # # # from DEPTH2 import depth2_calculation
# # # # from DEPTH_ITH import depth_ith_calculation
# # # # from gseapy import enrichr, gsea
# # # # from cv_2 import cv2_calculation
# # # # from mean import mean_calculation

# # # # # Initialize Flask App
# # # # app = Flask(__name__)
# # # # CORS(app, resources={r"/api/*": {
# # # #     "origins": ["http://localhost:8081"],
# # # #     "methods": ["GET", "POST", "OPTIONS"],
# # # #     "allow_headers": ["Content-Type", "Authorization"],
# # # #     "supports_credentials": True
# # # # }})

# # # # # Globals
# # # # base_raw_dir = "../data/raw"
# # # # data_types = ["tpm", "fpkm", "fpkm_uq"]
# # # # metric_funcs_TH = {
# # # #     "DEPTH2": depth2_calculation,
# # # #     "tITH": depth_ith_calculation,
# # # # }
# # # # metric_funcs_gene = {
# # # #     "cv": cv_calculation,
# # # #     "cv_squared": cv2_calculation,
# # # #     "std": std_calculation,
# # # #     "mad": mad_calculation,
# # # #     "mean": mean_calculation
# # # # }

# # # # cancer_mapping = {
# # # #     "liver and bile duct": "liver",
# # # #     "breast": "breast",
# # # #     "bladder": "bladder",
# # # #     "colorectal": "colon",
# # # #     "lung": "lung",
# # # #     "thymus": "thymus",
# # # #     "TCGA-LIHC": "liver",
# # # #     "TCGA-BRCA": "breast",
# # # #     "TCGA-BLCA": "bladder",
# # # #     "TCGA-COAD": "colon",
# # # #     "TCGA-LUAD": "lung",
# # # #     "TCGA-THYM": "thymus"
# # # # }

# # # # def load_expression_file(cancer_name, dtype, input_dir, cond):
# # # #     if cond == 'gene' or cond=='pathway':
# # # #         filename = f"{dtype}.csv.gz"
# # # #     else:
# # # #         filename = f"tumor_{dtype}.csv.gz"
# # # #     filepath = os.path.join(input_dir, cancer_name, filename)
# # # #     try:
# # # #         df = pd.read_csv(filepath, index_col=0)  # ensembl_id as index
# # # #         print(f"[DEBUG] Loaded file: {filepath}, shape: {df.shape}")
# # # #         print(f"[DEBUG] Columns: {df.columns.tolist()}")
# # # #         print(f"[DEBUG] First few rows:\n{df.head()}")

# # # #         # Drop non-numeric columns (e.g., gene_name or Hugo_Symbol)
# # # #         if cond == 'pathway':
# # # #             df = df.reset_index()
# # # #             df = df.drop(columns=['gene_id'])
# # # #             df = df.set_index('gene_name')
# # # #         if 'gene_name' in df.columns:
# # # #             df = df.drop(columns=['gene_name'])
# # # #         if 'Hugo_Symbol' in df.columns:
# # # #             df = df.drop(columns=['Hugo_Symbol'])
        
# # # #         # Convert all columns to numeric
# # # #         df = df.apply(pd.to_numeric, errors='coerce')
# # # #         print(f"[DEBUG] After converting to numeric, shape: {df.shape}")
# # # #         print(f"[DEBUG] Columns after conversion: {df.columns.tolist()}")

# # # #         # Fill NaN values with column median
# # # #         df = df.fillna(df.median())
# # # #         print(f"[DEBUG] After filling NaN with median:\n{df.head()}")
# # # #         print(f"[DEBUG] Remaining NaN values: {df.isna().sum().sum()}")

# # # #         if len(df) == 0:
# # # #             print(f"[DEBUG] Empty DataFrame for {filepath}")
# # # #             return None
# # # #         return df
# # # #     except FileNotFoundError as e:
# # # #         print(f"[ERROR] File not found: {filepath}")
# # # #         raise
# # # #     except Exception as e:
# # # #         print(f"[ERROR] Failed to load file {filepath}: {e}")
# # # #         raise

# # # # def compute_metrics_for_condition(cancer_name, input_dir, metric_funcs, condition, genes=None, tumor_samples=None, normal_samples=None):
# # # #     expr_dfs = {}
# # # #     for dtype in data_types:
# # # #         try:
# # # #             expr_df = load_expression_file(cancer_name, dtype, input_dir, condition)
# # # #             if expr_df is not None:
# # # #                 print(f"[DEBUG] {dtype} DataFrame, shape: {expr_df.shape}")
# # # #                 print(f"[DEBUG] {dtype} columns: {expr_df.columns.tolist()}")
# # # #                 expr_dfs[dtype] = expr_df
# # # #         except FileNotFoundError:
# # # #             print(f"[DEBUG] File not found for {dtype}, skipping")
# # # #             continue

# # # #     if not expr_dfs:
# # # #         print("[DEBUG] No expression data loaded")
# # # #         return None

# # # #     result = {}
# # # #     if condition == "gene":
# # # #         if not genes:
# # # #             print("[DEBUG] No genes provided")
# # # #             return None
# # # #         for dtype, df in expr_dfs.items():
# # # #             dtype_result = {}
# # # #             valid_genes = [gene for gene in genes if gene in df.index]
# # # #             print(f"[DEBUG] Valid genes for {dtype}: {valid_genes}")
# # # #             if not valid_genes:
# # # #                 print(f"[DEBUG] No valid genes found for {dtype}")
# # # #                 result[dtype] = {}
# # # #                 continue

# # # #             # Filter samples to those present in the DataFrame
# # # #             tumor_samples = [s for s in tumor_samples if s in df.columns] if tumor_samples else []
# # # #             normal_samples = [s for s in normal_samples if s in df.columns] if normal_samples else []
# # # #             print(f"[DEBUG] Valid tumor samples: {tumor_samples}")
# # # #             print(f"[DEBUG] Valid normal samples: {normal_samples}")

# # # #             tumor_df = df.loc[valid_genes, tumor_samples] if tumor_samples else pd.DataFrame(index=valid_genes)
# # # #             normal_df = df.loc[valid_genes, normal_samples] if normal_samples else pd.DataFrame(index=valid_genes)
# # # #             combined_df = df.loc[valid_genes, tumor_samples + normal_samples] if tumor_samples or normal_samples else pd.DataFrame(index=valid_genes)
# # # #             print(f"[DEBUG] Tumor DataFrame shape: {tumor_df.shape}")
# # # #             print(f"[DEBUG] Normal DataFrame shape: {normal_df.shape}")
# # # #             print(f"[DEBUG] Combined DataFrame shape: {combined_df.shape}")

# # # #             for metric_name, func in metric_funcs.items():
# # # #                 try:
# # # #                     tumor_metric = func(tumor_df) if not tumor_df.empty else pd.Series(0, index=valid_genes)
# # # #                     normal_metric = func(normal_df) if not normal_df.empty else pd.Series(0, index=valid_genes)
# # # #                     combined_metric = func(combined_df) if not combined_df.empty else pd.Series(0, index=valid_genes)
# # # #                     print(f"[DEBUG] {metric_name} tumor metric: {tumor_metric.to_dict()}")
# # # #                     print(f"[DEBUG] {metric_name} normal metric: {normal_metric.to_dict()}")
# # # #                     print(f"[DEBUG] {metric_name} combined metric: {combined_metric.to_dict()}")
# # # #                 except Exception as e:
# # # #                     print(f"[ERROR] Error computing {metric_name}: {e}")
# # # #                     tumor_metric = pd.Series(0, index=valid_genes)
# # # #                     normal_metric = pd.Series(0, index=valid_genes)
# # # #                     combined_metric = pd.Series(0, index=valid_genes)

# # # #                 for gene in valid_genes:
# # # #                     if gene not in dtype_result:
# # # #                         dtype_result[gene] = {}
# # # #                     dtype_result[gene][f"{metric_name}_tumor"] = float(tumor_metric.get(gene, 0))
# # # #                     dtype_result[gene][f"{metric_name}_normal"] = float(normal_metric.get(gene, 0))
# # # #                     dtype_result[gene][f"{metric_name}_combined"] = float(combined_metric.get(gene, 0))

# # # #             result[dtype] = dtype_result
# # # #     elif condition == "tumor":
# # # #         sample_ids = set()
# # # #         for df in expr_dfs.values():
# # # #             sample_ids.update(df.columns)
# # # #         sample_ids = sorted(list(sample_ids))
# # # #         metric_results = {}
# # # #         for metric_name, func in metric_funcs.items():
# # # #             metric_data = {}
# # # #             for dtype in data_types:
# # # #                 expr_df = expr_dfs.get(dtype)
# # # #                 if expr_df is None:
# # # #                     metric_data[dtype] = [0] * len(sample_ids)
# # # #                     continue
# # # #                 try:
# # # #                     metric_series = func(expr_df)
# # # #                     if not isinstance(metric_series, pd.Series):
# # # #                         raise ValueError(f"{metric_name} did not return a Series")
# # # #                     metric_data[dtype] = metric_series.reindex(sample_ids, fill_value=0).tolist()
# # # #                 except Exception as e:
# # # #                     print(f"[ERROR] Error computing {metric_name} for {dtype}: {e}")
# # # #                     metric_data[dtype] = [0] * len(sample_ids)

# # # #             result_list = []
# # # #             for i, sid in enumerate(sample_ids):
# # # #                 record = {"sample_id": sid}
# # # #                 for dtype in data_types:
# # # #                     record[dtype] = metric_data[dtype][i]
# # # #                 result_list.append(record)
# # # #             metric_results[metric_name] = result_list
# # # #         return metric_results if metric_results else None

# # # #     print(f"[DEBUG] Final result for {cancer_name}: {result}")
# # # #     return result if result else None

# # # # # API Endpoint
# # # # @app.route('/api/TH-metrics', methods=['GET'])
# # # # def TH_metrics():
# # # #     cancer = request.args.get('cancer')
# # # #     method = request.args.get('method')
# # # #     metric = request.args.get('metric')

# # # #     print(f"[INFO] Received request: cancer={cancer}, method={method}, metric={metric}")

# # # #     if not all([cancer, method, metric]):
# # # #         return jsonify({"error": "Missing parameters"}), 400

# # # #     cancer_key = cancer.lower()
# # # #     cancer_name = cancer_mapping.get(cancer_key)
# # # #     if not cancer_name:
# # # #         return jsonify({"error": f"Unsupported cancer name or code: {cancer}"}), 400

# # # #     try:
# # # #         results = compute_metrics_for_condition(
# # # #             cancer_name=cancer_name,
# # # #             input_dir=base_raw_dir,
# # # #             metric_funcs={metric: metric_funcs_TH[metric]},
# # # #             condition="tumor"
# # # #         )

# # # #         if not results or metric not in results:
# # # #             return jsonify({"error": "Metric computation failed or no data"}), 500

# # # #         return jsonify(results[metric])
# # # #     except FileNotFoundError as e:
# # # #         return jsonify({"error": f"Missing data file: {str(e)}"}), 404
# # # #     except Exception as e:
# # # #         return jsonify({"error": f"Internal error: {str(e)}"}), 500

# # # # @app.route('/api/gene_noise', methods=['GET'])
# # # # def gene_noise():
# # # #     cancer = request.args.get('cancer')
# # # #     metrics = request.args.get('metric').split(',') if request.args.get('metric') else []
# # # #     gene_ensembl_ids = request.args.get('gene_ensembl_id').split(',') if request.args.get('gene_ensembl_id') else []
# # # #     tumor_samples_param = request.args.get('tumor_samples')
# # # #     normal_samples_param = request.args.get('normal_samples')
    
# # # #     gene_ensembl_ids = [g.strip() for g in gene_ensembl_ids if g.strip()]
# # # #     tumor_samples = [s.strip() for s in tumor_samples_param.split(',')] if tumor_samples_param else []
# # # #     normal_samples = [s.strip() for s in normal_samples_param.split(',')] if normal_samples_param else []

# # # #     print(f"[INFO] Request: cancer={cancer}, metrics={metrics}, gene_ensembl_ids={gene_ensembl_ids}, tumor_samples={len(tumor_samples)}, normal_samples={len(normal_samples)}")

# # # #     if not all([cancer, metrics, gene_ensembl_ids]):
# # # #         return jsonify({"error": "Missing parameters (cancer, metric, or gene_ensembl_id)"}), 400

# # # #     invalid_metrics = [m for m in metrics if m not in metric_funcs_gene]
# # # #     if invalid_metrics:
# # # #         return jsonify({"error": f"Unsupported metric: {','.join(invalid_metrics)}"}), 400

# # # #     cancer_key = cancer.lower()
# # # #     cancer_name = cancer_mapping.get(cancer_key)
# # # #     if not cancer_name:
# # # #         return jsonify({"error": f"Unsupported cancer name: {cancer}"}), 400

# # # #     try:
# # # #         results = compute_metrics_for_condition(
# # # #             cancer_name=cancer_name,
# # # #             input_dir=base_raw_dir,
# # # #             metric_funcs={m: metric_funcs_gene[m] for m in metrics},
# # # #             condition="gene",
# # # #             genes=gene_ensembl_ids,
# # # #             tumor_samples=tumor_samples,
# # # #             normal_samples=normal_samples
# # # #         )

# # # #         if not results:
# # # #             return jsonify({"error": "Metric computation failed or no data"}), 500

# # # #         print(f"[DEBUG] Gene noise results: {results}")
# # # #         return jsonify(results)
# # # #     except Exception as e:
# # # #         print(f"[ERROR] Error in gene_noise: {str(e)}")
# # # #         return jsonify({"error": f"Internal error: {str(e)}"}), 500
    
# # # # @app.route('/api/pathway-analysis', methods=['GET'])
# # # # def pathway_analysis():
# # # #     try:
# # # #         cancer = request.args.get("cancer")
# # # #         method = request.args.get("method", "tpm")
# # # #         tumor_samples_param = request.args.get("tumor_samples", "")
# # # #         normal_samples_param = request.args.get("normal_samples", "")
# # # #         genes_param = request.args.get("genes", "")
# # # #         top_n = int(request.args.get("top_n", 200))
# # # #         analysis_type = request.args.get("analysis_type", "ORA")
        
# # # #         tumor_samples = [s.strip() for s in tumor_samples_param.split(',') if s.strip()]
# # # #         normal_samples = [s.strip() for s in normal_samples_param.split(',') if s.strip()]
# # # #         genes = [g.strip() for g in genes_param.split(',') if g.strip()]

# # # #         print(f"[INFO] Request: cancer={cancer}, method={method}, tumor_samples={len(tumor_samples)}, normal_samples={len(normal_samples)}, genes={genes}, top_n={top_n}, analysis_type={analysis_type}")

# # # #         if not cancer or not tumor_samples or not normal_samples:
# # # #             return jsonify({"error": "Missing required parameters (cancer, tumor_samples, normal_samples)"}), 400

# # # #         if analysis_type == "ORA" and not genes:
# # # #             return jsonify({"error": "ORA analysis requires a gene list"}), 400

# # # #         cancer_key = cancer.lower()
# # # #         cancer_name = cancer_mapping.get(cancer_key)
# # # #         if not cancer_name:
# # # #             return jsonify({"error": f"Unsupported cancer name: {cancer}"}), 400

# # # #         expr_df = load_expression_file(cancer_name, method, base_raw_dir, "pathway")
# # # #         if expr_df is None:
# # # #             return jsonify({"error": "Expression file not found"}), 404

# # # #         tumor_samples = [s for s in tumor_samples if s in expr_df.columns]
# # # #         normal_samples = [s for s in normal_samples if s in expr_df.columns]

# # # #         if not tumor_samples or not normal_samples:
# # # #             return jsonify({"error": "No valid tumor/normal sample IDs found in expression data"}), 400

# # # #         # Calculate gene statistics
# # # #         gene_stats = {}
# # # #         selected_genes = []
# # # #         ranked_list = None

# # # #         if analysis_type == "ORA":
# # # #             # For ORA, use provided genes
# # # #             valid_genes = [g for g in genes if g in expr_df.index]
# # # #             if not valid_genes:
# # # #                 return jsonify({"error": "No valid gene IDs found in expression data"}), 400
# # # #             selected_genes = valid_genes
# # # #         else:
# # # #             # For GSEA, calculate ranked list based on log2fc
# # # #             tumor_mean = expr_df[tumor_samples].mean(axis=1)
# # # #             normal_mean = expr_df[normal_samples].mean(axis=1)
# # # #             log2fc = np.log2((tumor_mean + 1e-10) / (normal_mean + 1e-10))  # Add small constant to avoid division by zero
# # # #             ranked_list = pd.DataFrame({
# # # #                 'gene': log2fc.index,
# # # #                 'log2fc': log2fc
# # # #             }).sort_values(by='log2fc', ascending=False)
# # # #             selected_genes = ranked_list['gene'].head(top_n).tolist()

# # # #         # Calculate mean expression for selected genes
# # # #         for gene in selected_genes:
# # # #             tumor_vals = expr_df.loc[gene, tumor_samples].dropna().values if tumor_samples else np.array([])
# # # #             normal_vals = expr_df.loc[gene, normal_samples].dropna().values if normal_samples else np.array([])
# # # #             gene_stats[gene] = {
# # # #                 "mean_tumor": float(np.mean(tumor_vals)) if tumor_vals.size else 0,
# # # #                 "mean_normal": float(np.mean(normal_vals)) if normal_vals.size else 0
# # # #             }

# # # #         # Perform pathway enrichment analysis
# # # #         gene_sets = "KEGG_2021_Human"
# # # #         if analysis_type == "ORA":
# # # #             enr = enrichr(
# # # #                 gene_list=selected_genes,
# # # #                 gene_sets=gene_sets,
# # # #                 organism="Human",
# # # #                 outdir=None,
# # # #                 cutoff=0.05
# # # #             )
# # # #             results_df = enr.results
# # # #             # Include all genes in the pathway
# # # #             results = results_df[["Term", "P-value", "Adjusted P-value", "Odds Ratio", "Combined Score", "Genes"]].head(10).to_dict(orient="records")
# # # #             for res in results:
# # # #                 res["Genes"] = res["Genes"].split(";") if isinstance(res["Genes"], str) else []
# # # #         else:
# # # #             # GSEA analysis
# # # #             # Prepare phenotype labels: 1 for tumor, 0 for normal
# # # #             cls = ['Tumor'] * len(tumor_samples) + ['Normal'] * len(normal_samples)
# # # #             expr_subset = expr_df[tumor_samples + normal_samples]
# # # #             enr = gsea(
# # # #                 data=expr_subset.T,
# # # #                 gene_sets=gene_sets,
# # # #                 cls=cls,
# # # #                 permutation_num=100,
# # # #                 outdir=None,
# # # #                 method='signal_to_noise',
# # # #                 max_size=500,
# # # #                 min_size=15,
# # # #                 seed=42
# # # #             )
# # # #             results_df = enr.res2d
# # # #             # Include all genes in the pathway
# # # #             results = results_df[["Term", "P-value", "FDR q-val", "NES", "ES", "Lead_genes"]].head(10).to_dict(orient="records")
# # # #             for res in results:
# # # #                 res["Genes"] = res["Lead_genes"].split(";") if isinstance(res["Lead_genes"], str) else []
# # # #                 res["Adjusted P-value"] = res.pop("FDR q-val")
# # # #                 res["Combined Score"] = res.pop("NES")  # Use NES as Combined Score for GSEA
# # # #                 res["Odds Ratio"] = res.pop("ES")  # Use ES as Odds Ratio for GSEA
# # # #                 del res["Lead_genes"]

# # # #         print(f"[INFO] Pathway analysis response: enrichment={len(results)}, top_genes={len(selected_genes)}")
# # # #         return jsonify({
# # # #             "enrichment": results,
# # # #             "top_genes": selected_genes,
# # # #             "gene_stats": gene_stats
# # # #         })

# # # #     except Exception as e:
# # # #         print(f"[ERROR] Pathway analysis failed: {e}")
# # # #         return jsonify({"error": f"Internal server error: {str(e)}"}), 500

# # # # # Run server
# # # # if __name__ == '__main__':
# # # #     app.run(debug=True, host='0.0.0.0', port=5001)
# # import os
# # import pandas as pd
# # import numpy as np
# # from flask import Flask, request, jsonify
# # from flask_cors import CORS
# # from cv import cv_calculation
# # from std import std_calculation
# # from MAD import mad_calculation
# # from DEPTH2 import depth2_calculation
# # from DEPTH_ITH import depth_ith_calculation
# # from gseapy import enrichr, gsea, get_library_name
# # from cv_2 import cv2_calculation
# # from mean import mean_calculation

# # # Initialize Flask App
# # app = Flask(__name__)
# # CORS(app, resources={r"/api/*": {
# #     "origins": ["http://localhost:8081"],
# #     "methods": ["GET", "POST", "OPTIONS"],
# #     "allow_headers": ["Content-Type", "Authorization"],
# #     "supports_credentials": True
# # }})

# # # Globals
# # base_raw_dir = "../data/raw"
# # data_types = ["tpm", "fpkm", "fpkm_uq"]
# # metric_funcs_TH = {
# #     "DEPTH2": depth2_calculation,
# #     "tITH": depth_ith_calculation,
# # }
# # metric_funcs_gene = {
# #     "cv": cv_calculation,
# #     "cv_squared": cv2_calculation,
# #     "std": std_calculation,
# #     "mad": mad_calculation,
# #     "mean": mean_calculation
# # }

# # cancer_mapping = {
# #     "liver and bile duct": "liver",
# #     "breast": "breast",
# #     "bladder": "bladder",
# #     "colorectal": "colon",
# #     "lung": "lung",
# #     "thymus": "thymus",
# #     "TCGA-LIHC": "liver",
# #     "TCGA-BRCA": "breast",
# #     "TCGA-BLCA": "bladder",
# #     "TCGA-COAD": "colon",
# #     "TCGA-LUAD": "lung",
# #     "TCGA-THYM": "thymus"
# # }

# # def load_expression_file(cancer_name, dtype, input_dir, cond):
# #     if cond == 'gene' or cond=='pathway':
# #         filename = f"{dtype}.csv.gz"
# #     else:
# #         filename = f"tumor_{dtype}.csv.gz"
# #     filepath = os.path.join(input_dir, cancer_name, filename)
# #     try:
# #         df = pd.read_csv(filepath, index_col=0)  # ensembl_id as index
# #         print(f"[DEBUG] Loaded file: {filepath}, shape: {df.shape}")
# #         print(f"[DEBUG] Columns: {df.columns.tolist()}")
# #         print(f"[DEBUG] First few rows:\n{df.head()}")

# #         # For pathway analysis, expect gene_name as index
# #         if cond == 'pathway':
# #             df = df.reset_index()
# #             if 'gene_name' in df.columns:
# #                 df['gene_name'] = df['gene_name'].str.upper()  # Convert to uppercase
# #                 df = df.set_index('gene_name')
# #             elif 'gene_id' in df.columns:
# #                 df['gene_id'] = df['gene_id'].str.upper()
# #                 df = df.set_index('gene_id')
# #             else:
# #                 raise ValueError("No 'gene_name' or 'gene_id' column found in expression data")
# #         else:
# #             # Drop non-numeric columns
# #             if 'gene_name' in df.columns:
# #                 df = df.drop(columns=['gene_name'])
# #             if 'Hugo_Symbol' in df.columns:
# #                 df = df.drop(columns=['Hugo_Symbol'])
        
# #         # Convert all columns to numeric
# #         df = df.apply(pd.to_numeric, errors='coerce')
# #         print(f"[DEBUG] After converting to numeric, shape: {df.shape}")
# #         print(f"[DEBUG] Columns after conversion: {df.columns.tolist()}")

# #         # Fill NaN values with column median
# #         df = df.fillna(df.median())
# #         print(f"[DEBUG] After filling NaN with median:\n{df.head()}")
# #         print(f"[DEBUG] Remaining NaN values: {df.isna().sum().sum()}")

# #         if len(df) == 0:
# #             print(f"[DEBUG] Empty DataFrame for {filepath}")
# #             return None
# #         return df
# #     except FileNotFoundError as e:
# #         print(f"[ERROR] File not found: {filepath}")
# #         raise
# #     except Exception as e:
# #         print(f"[ERROR] Failed to load file {filepath}: {e}")
# #         raise

# # def compute_metrics_for_condition(cancer_name, input_dir, metric_funcs, condition, genes=None, tumor_samples=None, normal_samples=None):
# #     expr_dfs = {}
# #     for dtype in data_types:
# #         try:
# #             expr_df = load_expression_file(cancer_name, dtype, input_dir, condition)
# #             if expr_df is not None:
# #                 expr_df = np.log2(expr_df + 1)
# #                 print(f"[DEBUG] {dtype} DataFrame, shape: {expr_df.shape}")
# #                 print(f"[DEBUG] {dtype} columns: {expr_df.columns.tolist()}")
# #                 expr_dfs[dtype] = expr_df
# #         except FileNotFoundError:
# #             print(f"[DEBUG] File not found for {dtype}, skipping")
# #             continue

# #     if not expr_dfs:
# #         print("[DEBUG] No expression data loaded")
# #         return None

# #     result = {}
# #     if condition == "gene":
# #         if not genes:
# #             print("[DEBUG] No genes provided")
# #             return None
# #         # Convert genes to uppercase
# #         genes = [g.upper() for g in genes]
# #         for dtype, df in expr_dfs.items():
# #             dtype_result = {}
# #             valid_genes = [gene for gene in genes if gene in df.index]
# #             print(f"[DEBUG] Valid genes for {dtype}: {valid_genes}")
# #             if not valid_genes:
# #                 print(f"[DEBUG] No valid genes found for {dtype}")
# #                 result[dtype] = {}
# #                 continue

# #             # Filter samples to those present in the DataFrame
# #             tumor_samples = [s for s in tumor_samples if s in df.columns] if tumor_samples else []
# #             normal_samples = [s for s in normal_samples if s in df.columns] if normal_samples else []
# #             print(f"[DEBUG] Valid tumor samples: {tumor_samples}")
# #             print(f"[DEBUG] Valid normal samples: {normal_samples}")

# #             tumor_df = df.loc[valid_genes, tumor_samples] if tumor_samples else pd.DataFrame(index=valid_genes)
# #             normal_df = df.loc[valid_genes, normal_samples] if normal_samples else pd.DataFrame(index=valid_genes)
# #             print(f"[DEBUG] Tumor DataFrame shape: {tumor_df.shape}")
# #             print(f"[DEBUG] Normal DataFrame shape: {normal_df.shape}")

# #             for metric_name, func in metric_funcs.items():
# #                 try:
# #                     tumor_metric = func(tumor_df) if not tumor_df.empty else pd.Series(0, index=valid_genes)
# #                     normal_metric = func(normal_df) if not normal_df.empty else pd.Series(0, index=valid_genes)
# #                     print(f"[DEBUG] {metric_name} tumor metric: {tumor_metric.to_dict()}")
# #                     print(f"[DEBUG] {metric_name} normal metric: {normal_metric.to_dict()}")
# #                 except Exception as e:
# #                     print(f"[ERROR] Error computing {metric_name}: {e}")
# #                     tumor_metric = pd.Series(0, index=valid_genes)
# #                     normal_metric = pd.Series(0, index=valid_genes)

# #                 for gene in valid_genes:
# #                     if gene not in dtype_result:
# #                         dtype_result[gene] = {}
# #                     dtype_result[gene][f"{metric_name}_tumor"] = float(tumor_metric.get(gene, 0))
# #                     dtype_result[gene][f"{metric_name}_normal"] = float(normal_metric.get(gene, 0))
# #                     # dtype_result[gene][f"{metric_name}_combined"] = float(combined_metric.get(gene, 0))

# #             result[dtype] = dtype_result
# #     elif condition == "tumor":
# #         sample_ids = set()
# #         for df in expr_dfs.values():
# #             sample_ids.update(df.columns)
# #         sample_ids = sorted(list(sample_ids))
# #         metric_results = {}
# #         for metric_name, func in metric_funcs.items():
# #             metric_data = {}
# #             for dtype in data_types:
# #                 expr_df = expr_dfs.get(dtype)
# #                 if expr_df is None:
# #                     metric_data[dtype] = [0] * len(sample_ids)
# #                     continue
# #                 try:
# #                     metric_series = func(expr_df)
# #                     if not isinstance(metric_series, pd.Series):
# #                         raise ValueError(f"{metric_name} did not return a Series")
# #                     metric_data[dtype] = metric_series.reindex(sample_ids, fill_value=0).tolist()
# #                 except Exception as e:
# #                     print(f"[ERROR] Error computing {metric_name} for {dtype}: {e}")
# #                     metric_data[dtype] = [0] * len(sample_ids)

# #             result_list = []
# #             for i, sid in enumerate(sample_ids):
# #                 record = {"sample_id": sid}
# #                 for dtype in data_types:
# #                     record[dtype] = metric_data[dtype][i]
# #                 result_list.append(record)
# #             metric_results[metric_name] = result_list
# #         return metric_results if metric_results else None

# #     print(f"[DEBUG] Final result for {cancer_name}: {result}")
# #     return result if result else None

# # # API Endpoint
# # @app.route('/api/TH-metrics', methods=['GET'])
# # def TH_metrics():
# #     cancer = request.args.get('cancer')
# #     method = request.args.get('method')
# #     metric = request.args.get('metric')

# #     print(f"[INFO] Received request: cancer={cancer}, method={method}, metric={metric}")

# #     if not all([cancer, method, metric]):
# #         return jsonify({"error": "Missing parameters"}), 400

# #     cancer_key = cancer.lower()
# #     cancer_name = cancer_mapping.get(cancer_key)
# #     if not cancer_name:
# #         return jsonify({"error": f"Unsupported cancer name or code: {cancer}"}), 400

# #     try:
# #         results = compute_metrics_for_condition(
# #             cancer_name=cancer_name,
# #             input_dir=base_raw_dir,
# #             metric_funcs={metric: metric_funcs_TH[metric]},
# #             condition="tumor"
# #         )

# #         if not results or metric not in results:
# #             return jsonify({"error": "Metric computation failed or no data"}), 500

# #         return jsonify(results[metric])
# #     except FileNotFoundError as e:
# #         return jsonify({"error": f"Missing data file: {str(e)}"}), 404
# #     except Exception as e:
# #         return jsonify({"error": f"Internal error: {str(e)}"}), 500

# # @app.route('/api/gene_noise', methods=['GET'])
# # def gene_noise():
# #     cancer = request.args.get('cancer')
# #     metrics = request.args.get('metric').split(',') if request.args.get('metric') else []
# #     gene_ensembl_ids = request.args.get('gene_ensembl_id').split(',') if request.args.get('gene_ensembl_id') else []
# #     tumor_samples_param = request.args.get('tumor_samples')
# #     normal_samples_param = request.args.get('normal_samples')
    
# #     gene_ensembl_ids = [g.strip().upper() for g in gene_ensembl_ids if g.strip()]  # Convert to uppercase
# #     tumor_samples = [s.strip() for s in tumor_samples_param.split(',')] if tumor_samples_param else []
# #     normal_samples = [s.strip() for s in normal_samples_param.split(',')] if normal_samples_param else []

# #     print(f"[INFO] Request: cancer={cancer}, metrics={metrics}, gene_ensembl_ids={gene_ensembl_ids}, tumor_samples={len(tumor_samples)}, normal_samples={len(normal_samples)}")

# #     if not all([cancer, metrics, gene_ensembl_ids]):
# #         return jsonify({"error": "Missing parameters (cancer, metric, or gene_ensembl_id)"}), 400

# #     invalid_metrics = [m for m in metrics if m not in metric_funcs_gene]
# #     if invalid_metrics:
# #         return jsonify({"error": f"Unsupported metric: {','.join(invalid_metrics)}"}), 400

# #     cancer_key = cancer.lower()
# #     cancer_name = cancer_mapping.get(cancer_key)
# #     if not cancer_name:
# #         return jsonify({"error": f"Unsupported cancer name: {cancer}"}), 400

# #     try:
# #         results = compute_metrics_for_condition(
# #             cancer_name=cancer_name,
# #             input_dir=base_raw_dir,
# #             # metric_funcs={m: metric_funcs_gene[m] for m in metrics},
# #             metric_funcs={m: metric_funcs_gene[m] for m in metric_funcs_gene},
# #             condition="gene",
# #             genes=gene_ensembl_ids,
# #             tumor_samples=tumor_samples,
# #             normal_samples=normal_samples
# #         )

# #         if not results:
# #             return jsonify({"error": "Metric computation failed or no data"}), 500

# #         print(f"[DEBUG] Gene noise results: {results}")
# #         return jsonify(results)
# #     except Exception as e:
# #         print(f"[ERROR] Error in gene_noise: {str(e)}")
# #         return jsonify({"error": f"Internal error: {str(e)}"}), 500
    
# # # @app.route('/api/*', methods=['GET'])
# # # def get_noisy_genes():

# # @app.route('/api/pathway-analysis', methods=['GET'])
# # def pathway_analysis():
# #     try:
# #         cancer = request.args.get("cancer")
# #         method = request.args.get("method", "tpm")
# #         tumor_samples_param = request.args.get("tumor_samples", "")
# #         normal_samples_param = request.args.get("normal_samples", "")
# #         genes_param = request.args.get("genes", "")
# #         top_n = int(request.args.get("top_n", 200))
# #         print(top_n)
# #         analysis_type = request.args.get("analysis_type", "ORA")
        
# #         tumor_samples = [s.strip() for s in tumor_samples_param.split(',') if s.strip()]
# #         normal_samples = [s.strip() for s in normal_samples_param.split(',') if s.strip()]
# #         genes = [g.strip().upper() for g in genes_param.split(',') if g.strip()]

# #         print(f"[INFO] Request: cancer={cancer}, method={method}, tumor_samples={len(tumor_samples)}, normal_samples={len(normal_samples)}, genes={genes}, top_n={top_n}, analysis_type={analysis_type}")

# #         if not cancer or not tumor_samples or not normal_samples:
# #             return jsonify({"error": "Missing required parameters (cancer, tumor_samples, normal_samples)"}), 400

# #         if analysis_type == "ORA" and not genes:
# #             return jsonify({"error": "ORA analysis requires a gene list"}), 400

# #         cancer_key = cancer.lower()
# #         cancer_name = cancer_mapping.get(cancer_key)
# #         if not cancer_name:
# #             return jsonify({"error": f"Unsupported cancer name: {cancer}"}), 400

# #         expr_df = load_expression_file(cancer_name, method, base_raw_dir, "pathway")
# #         if expr_df is None:
# #             return jsonify({"error": "Expression file not found"}), 404

# #         tumor_samples = [s for s in tumor_samples if s in expr_df.columns]
# #         normal_samples = [s for s in normal_samples if s in expr_df.columns]

# #         if not tumor_samples or not normal_samples:
# #             return jsonify({"error": "No valid tumor/normal sample IDs found in expression data"}), 400

# #         # Validate gene symbols against libraries
# #         gene_sets = ["KEGG_2021_Human", "GO_Biological_Process_2021"]
# #         library_genes = set(expr_df.index)
# #         print(f"[DEBUG] Total genes in expression data: {len(library_genes)}")

# #         # Calculate gene statistics and ranked list
# #         gene_stats = {}
# #         selected_genes = []
# #         ranked_list = None

# #         if analysis_type == "ORA":
# #             valid_genes = [g for g in genes if g in expr_df.index and g in library_genes]
# #             if not valid_genes:
# #                 return jsonify({
# #                     "error": "No valid gene IDs found in expression data or gene set libraries",
# #                     "hint": "Ensure gene symbols are uppercase and match KEGG_2021_Human or GO_Biological_Process_2021 identifiers"
# #                 }), 400
# #             selected_genes = valid_genes
# #         else:  # GSEA
# #             # Calculate ranked list based on log2fc
# #             tumor_mean = expr_df[tumor_samples].mean(axis=1)
# #             normal_mean = expr_df[normal_samples].mean(axis=1)
# #             log2fc = np.log2((tumor_mean + 1e-10) / (normal_mean + 1e-10))
# #             ranked_list = pd.DataFrame({
# #                 'gene': log2fc.index,
# #                 'log2fc': log2fc
# #             }).sort_values(by='log2fc', ascending=False)

# #             top_genes = log2fc.sort_values(ascending=False).head(top_n).index.tolist()
# #             selected_genes = ranked_list['gene'].head(top_n).tolist()
# #             print(selected_genes)
# #             ranked_list['gene'] = ranked_list['gene'].str.upper()
# #             selected_genes = [g.upper() for g in selected_genes]
        

# #         tumor_samples = [s for s in tumor_samples if s in expr_df.columns] if tumor_samples else []
# #         normal_samples = [s for s in normal_samples if s in expr_df.columns] if normal_samples else []
# #         print(f"[DEBUG] Valid tumor samples: {tumor_samples}")
# #         print(f"[DEBUG] Valid normal samples: {normal_samples}")

# #         tumor_df = expr_df.loc[valid_genes, tumor_samples] if tumor_samples else pd.DataFrame(index=valid_genes)
# #         normal_df = expr_df.loc[valid_genes, normal_samples] if normal_samples else pd.DataFrame(index=valid_genes)
# #         valid_genes = list(set(tumor_df.index).intersection(normal_df.index))

        
# #         print(f"[DEBUG] Tumor DataFrame shape: {tumor_df.shape}")
# #         print(f"[DEBUG] Normal DataFrame shape: {normal_df.shape}")

# #         tumor_metric = cv_calculation(tumor_df) if not tumor_df.empty else pd.Series(0, index=valid_genes)
# #         normal_metric = cv_calculation(normal_df) if not normal_df.empty else pd.Series(0, index=valid_genes)

# #         # Calculate mean expression and noise metrics for selected genes
# #         for gene in selected_genes:
# #             tumor_vals = expr_df.loc[gene, tumor_samples].dropna().values if tumor_samples else np.array([])
# #             normal_vals = expr_df.loc[gene, normal_samples].dropna().values if normal_samples else np.array([]) 
# #             gene_stats[gene] = {
# #                 "mean_tumor": float(np.mean(tumor_vals)) if tumor_vals.size else 0,
# #                 "mean_normal": float(np.mean(normal_vals)) if normal_vals.size else 0,
# #                 "cv_tumor": float(tumor_metric.get(gene, 0)),
# #                 "cv_normal": float(normal_metric.get(gene, 0))
# #             }

# #         # Compute noise metrics for the top 200 genes
# #         noise_metrics = compute_metrics_for_condition(
# #             cancer_name=cancer_name,
# #             input_dir=base_raw_dir,
# #             metric_funcs=metric_funcs_gene,  # Use all gene noise metrics
# #             condition="gene",
# #             genes=selected_genes,
# #             tumor_samples=tumor_samples,
# #             normal_samples=normal_samples
# #         )
# #         if not noise_metrics:
# #             print(f"[WARNING] Failed to compute noise metrics for selected genes")
# #             noise_metrics = {}

# #         # Perform pathway enrichment analysis
# #         enrichment_results = []
# #         for gene_set in gene_sets:
# #             print(f"[DEBUG] Running {analysis_type} with gene set: {gene_set}")
# #             try:
# #                 if analysis_type == "ORA":
# #                     enr = enrichr(
# #                         gene_list=selected_genes,
# #                         gene_sets=gene_set,
# #                         organism="Human",
# #                         outdir=None,
# #                         cutoff=0.05
# #                     )
# #                     results_df = enr.results
# #                     if results_df.empty:
# #                         print(f"[WARNING] No pathways found for {gene_set} in ORA analysis")
# #                         continue
# #                     results = results_df[["Term", "P-value", "Adjusted P-value", "Odds Ratio", "Combined Score", "Genes"]].head(10).to_dict(orient="records")
# #                     for res in results:
# #                         res["Genes"] = res["Genes"].split(";") if isinstance(res["Genes"], str) else []
# #                         res["GeneSet"] = gene_set
# #                     enrichment_results.extend(results)
# #                 else:
# #                     # tumor_df = tumor_expr_df.loc[:, tumor_samples]
# #                     # normal_df = tumor_expr_df.loc[:, normal_samples]

# #                     # valid_genes = list(set(tumor_df.index).intersection(normal_df.index))
# #                     cls = ['Tumor'] * len(tumor_samples) + ['Normal'] * len(normal_samples)
# #                     expr_subset = expr_df[tumor_samples + normal_samples]
# #                     enr = gsea(
# #                         data=expr_subset,
# #                         gene_sets="GO_Biological_Process_2021",
# #                         cls=cls,
# #                         permutation_num=100,
# #                         outdir=None,
# #                         method='signal_to_noise',
# #                         max_size=1000,
# #                         min_size=2,
# #                         seed=42
# #                     )
# #                     results_df = enr.res2d
# #                     if results_df.empty:
# #                         print(f"[WARNING] No pathways found for {gene_set} in GSEA analysis")
# #                         continue
# #                     results = results_df[["Term", "P-value", "FDR q-val", "NES", "ES", "Lead_genes"]].head(10).to_dict(orient="records")
# #                     for res in results:
# #                         res["Genes"] = res["Lead_genes"].split(";") if isinstance(res["Lead_genes"], str) else []
# #                         res["Adjusted P-value"] = res.pop("FDR q-val")
# #                         res["Combined Score"] = res.pop("NES")
# #                         res["Odds Ratio"] = res.pop("ES")
# #                         res["GeneSet"] = gene_set
# #                         del res["Lead_genes"]
# #                     enrichment_results.extend(results)
# #             except Exception as e:
# #                 print(f"[WARNING] Failed to run {analysis_type} with {gene_set}: {str(e)}")
# #                 continue

# #         if not enrichment_results:
# #             return jsonify({
# #                 "error": f"No pathways found for {analysis_type} analysis with provided parameters",
# #                 "hint": "Ensure gene symbols are uppercase and match KEGG_2021_Human or GO_Biological_Process_2021 identifiers, or try a larger gene list"
# #             }), 400

# #         print(f"[INFO] Pathway analysis response: enrichment={len(enrichment_results)}, top_genes={len(selected_genes)}")
# #         return jsonify({
# #             "enrichment": enrichment_results,
# #             "top_genes": selected_genes,
# #             "gene_stats": gene_stats,
# #             "noise_metrics": noise_metrics
# #         })

# #     except Exception as e:
# #         print(f"[ERROR] Pathway analysis failed: {e}")
# #         return jsonify({
# #             "error": f"Internal server error: {str(e)}",
# #             "hint": "Ensure gene symbols are uppercase and match KEGG_2021_Human or GO_Biological_Process_2021 identifiers, or check data file integrity"
# #         }), 500
# # # @app.route('/api/pathway-analysis', methods=['GET'])
# # # def pathway_analysis():
# # #     try:
# # #         cancer = request.args.get("cancer")
# # #         method = request.args.get("method", "tpm")
# # #         tumor_samples_param = request.args.get("tumor_samples", "")
# # #         normal_samples_param = request.args.get("normal_samples", "")
# # #         genes_param = request.args.get("genes", "")
# # #         top_n = int(request.args.get("top_n", 200))
# # #         analysis_type = request.args.get("analysis_type", "ORA")
        
# # #         tumor_samples = [s.strip() for s in tumor_samples_param.split(',') if s.strip()]
# # #         normal_samples = [s.strip() for s in normal_samples_param.split(',') if s.strip()]
# # #         genes = [g.strip().upper() for g in genes_param.split(',') if g.strip()]  # Convert to uppercase

# # #         print(f"[INFO] Request: cancer={cancer}, method={method}, tumor_samples={len(tumor_samples)}, normal_samples={len(normal_samples)}, genes={genes}, top_n={top_n}, analysis_type={analysis_type}")

# # #         if not cancer or not tumor_samples or not normal_samples:
# # #             return jsonify({"error": "Missing required parameters (cancer, tumor_samples, normal_samples)"}), 400

# # #         if analysis_type == "ORA" and not genes:
# # #             return jsonify({"error": "ORA analysis requires a gene list"}), 400

# # #         cancer_key = cancer.lower()
# # #         cancer_name = cancer_mapping.get(cancer_key)
# # #         if not cancer_name:
# # #             return jsonify({"error": f"Unsupported cancer name: {cancer}"}), 400

# # #         expr_df = load_expression_file(cancer_name, method, base_raw_dir, "pathway")
# # #         if expr_df is None:
# # #             return jsonify({"error": "Expression file not found"}), 404

# # #         tumor_samples = [s for s in tumor_samples if s in expr_df.columns]
# # #         normal_samples = [s for s in normal_samples if s in expr_df.columns]

# # #         if not tumor_samples or not normal_samples:
# # #             return jsonify({"error": "No valid tumor/normal sample IDs found in expression data"}), 400

# # #         # Validate gene symbols against libraries
# # #         gene_sets = ["KEGG_2021_Human", "GO_Biological_Process_2021"]
# # #         library_genes = set(expr_df.index)  # Simplified validation using expression data index
# # #         print(f"[DEBUG] Total genes in expression data: {len(library_genes)}")

# # #         # Calculate gene statistics
# # #         gene_stats = {}
# # #         selected_genes = []
# # #         ranked_list = None

# # #         if analysis_type == "ORA":
# # #             valid_genes = [g for g in genes if g in expr_df.index and g in library_genes]
# # #             if not valid_genes:
# # #                 return jsonify({
# # #                     "error": "No valid gene IDs found in expression data or gene set libraries",
# # #                     "hint": "Ensure gene symbols are uppercase and match KEGG_2021_Human or GO_Biological_Process_2021 identifiers"
# # #                 }), 400
# # #             selected_genes = valid_genes
# # #         else:
# # #             # For GSEA, calculate ranked list based on log2fc
# # #             tumor_mean = expr_df[tumor_samples].mean(axis=1)
# # #             normal_mean = expr_df[normal_samples].mean(axis=1)
# # #             log2fc = np.log2((tumor_mean + 1e-10) / (normal_mean + 1e-10))  # Add small constant to avoid division by zero
# # #             ranked_list = pd.DataFrame({
# # #                 'gene': log2fc.index,
# # #                 'log2fc': log2fc
# # #             }).sort_values(by='log2fc', ascending=False)
# # #             selected_genes = ranked_list['gene'].head(top_n).tolist()
# # #             ranked_list['gene'] = ranked_list['gene'].str.upper()
# # #             selected_genes = [g.upper() for g in selected_genes]

# # #         # Calculate mean expression for selected genes
# # #         for gene in selected_genes:
# # #             tumor_vals = expr_df.loc[gene, tumor_samples].dropna().values if tumor_samples else np.array([])
# # #             normal_vals = expr_df.loc[gene, normal_samples].dropna().values if normal_samples else np.array([])
# # #             gene_stats[gene] = {
# # #                 "mean_tumor": float(np.mean(tumor_vals)) if tumor_vals.size else 0,
# # #                 "mean_normal": float(np.mean(normal_vals)) if normal_vals.size else 0
# # #             }

# # #         # Perform pathway enrichment analysis for both gene sets
# # #         enrichment_results = []
# # #         for gene_set in gene_sets:
# # #             print(f"[DEBUG] Running {analysis_type} with gene set: {gene_set}")
# # #             try:
# # #                 if analysis_type == "ORA":
# # #                     enr = enrichr(
# # #                         gene_list=selected_genes,
# # #                         gene_sets=gene_set,
# # #                         organism="Human",
# # #                         outdir=None,
# # #                         cutoff=0.05
# # #                     )
# # #                     results_df = enr.results
# # #                     if results_df.empty:
# # #                         print(f"[WARNING] No pathways found for {gene_set} in ORA analysis")
# # #                         continue
# # #                     results = results_df[["Term", "P-value", "Adjusted P-value", "Odds Ratio", "Combined Score", "Genes"]].head(10).to_dict(orient="records")
# # #                     for res in results:
# # #                         res["Genes"] = res["Genes"].split(";") if isinstance(res["Genes"], str) else []
# # #                         res["GeneSet"] = gene_set
# # #                     enrichment_results.extend(results)
# # #                 else:
# # #                     cls = ['Tumor'] * len(tumor_samples) + ['Normal'] * len(normal_samples)
# # #                     expr_subset = expr_df[tumor_samples + normal_samples]
# # #                     enr = gsea(
# # #                         data=expr_subset.T,
# # #                         gene_sets=gene_set,
# # #                         cls=cls,
# # #                         permutation_num=100,
# # #                         outdir=None,
# # #                         method='signal_to_noise',
# # #                         max_size=1000,
# # #                         min_size=5,
# # #                         seed=42
# # #                     )
# # #                     results_df = enr.res2d
# # #                     if results_df.empty:
# # #                         print(f"[WARNING] No pathways found for {gene_set} in GSEA analysis")
# # #                         continue
# # #                     results = results_df[["Term", "P-value", "FDR q-val", "NES", "ES", "Lead_genes"]].head(10).to_dict(orient="records")
# # #                     for res in results:
# # #                         res["Genes"] = res["Lead_genes"].split(";") if isinstance(res["Lead_genes"], str) else []
# # #                         res["Adjusted P-value"] = res.pop("FDR q-val")
# # #                         res["Combined Score"] = res.pop("NES")
# # #                         res["Odds Ratio"] = res.pop("ES")
# # #                         res["GeneSet"] = gene_set
# # #                         del res["Lead_genes"]
# # #                     enrichment_results.extend(results)
# # #             except Exception as e:
# # #                 print(f"[WARNING] Failed to run {analysis_type} with {gene_set}: {str(e)}")
# # #                 continue

# # #         if not enrichment_results:
# # #             return jsonify({
# # #                 "error": f"No pathways found for {analysis_type} analysis with provided parameters",
# # #                 "hint": "Ensure gene symbols are uppercase and match KEGG_2021_Human or GO_Biological_Process_2021 identifiers, or try a larger gene list"
# # #             }), 400

# # #         print(f"[INFO] Pathway analysis response: enrichment={len(enrichment_results)}, top_genes={len(selected_genes)}")
# # #         return jsonify({
# # #             "enrichment": enrichment_results,
# # #             "top_genes": selected_genes,
# # #             "gene_stats": gene_stats
# # #         })

# # #     except Exception as e:
# # #         print(f"[ERROR] Pathway analysis failed: {e}")
# # #         return jsonify({
# # #             "error": f"Internal server error: {str(e)}",
# # #             "hint": "Ensure gene symbols are uppercase and match KEGG_2021_Human or GO_Biological_Process_2021 identifiers, or check data file integrity"
# # #         }), 500

# # # Run server
# # if __name__ == '__main__':
# #     app.run(debug=True, host='0.0.0.0', port=5001)
# import os
# import pandas as pd
# import numpy as np
# from flask import Flask, request, jsonify
# from flask_cors import CORS
# from cv import cv_calculation
# from std import std_calculation
# from MAD import mad_calculation
# from DEPTH2 import depth2_calculation
# from DEPTH_ITH import depth_ith_calculation
# from gseapy import enrichr, gsea, get_library_name
# from cv_2 import cv2_calculation
# from mean import mean_calculation

# # Initialize Flask App
# app = Flask(__name__)
# CORS(app, resources={r"/api/*": {
#     "origins": ["http://localhost:8081"],
#     "methods": ["GET", "POST", "OPTIONS"],
#     "allow_headers": ["Content-Type", "Authorization"],
#     "supports_credentials": True
# }})

# # Globals
# base_raw_dir = "../data/raw"
# data_types = ["tpm", "fpkm", "fpkm_uq"]
# metric_funcs_TH = {
#     "DEPTH2": depth2_calculation,
#     "tITH": depth_ith_calculation,
# }
# metric_funcs_gene = {
#     "cv": cv_calculation,
#     "cv_squared": cv2_calculation,
#     "std": std_calculation,
#     "mad": mad_calculation,
#     "mean": mean_calculation
# }

# cancer_mapping = {
#     "liver and bile duct": "liver",
#     "breast": "breast",
#     "bladder": "bladder",
#     "colorectal": "colon",
#     "lung": "lung",
#     "thymus": "thymus",
#     "TCGA-LIHC": "liver",
#     "TCGA-BRCA": "breast",
#     "TCGA-BLCA": "bladder",
#     "TCGA-COAD": "colon",
#     "TCGA-LUAD": "lung",
#     "TCGA-THYM": "thymus"
# }

# def load_expression_file(cancer_name, dtype, input_dir, cond):
#     if cond == 'gene' or cond=='pathway':
#         filename = f"{dtype}.csv.gz"
#     else:
#         filename = f"tumor_{dtype}.csv.gz"
#     filepath = os.path.join(input_dir, cancer_name, filename)
#     try:
#         df = pd.read_csv(filepath, index_col=0)  # ensembl_id as index
#         print(f"[DEBUG] Loaded file: {filepath}, shape: {df.shape}")
#         print(f"[DEBUG] Columns: {df.columns.tolist()}")
#         print(f"[DEBUG] First few rows:\n{df.head()}")

#         # For pathway analysis, expect gene_name as index
#         if cond == 'pathway':
#             df = df.reset_index()
#             if 'gene_name' in df.columns:
#                 df['gene_name'] = df['gene_name'].str.upper()  # Convert to uppercase
#                 df = df.set_index('gene_name')
#             elif 'gene_id' in df.columns:
#                 df['gene_id'] = df['gene_id'].str.upper()
#                 df = df.set_index('gene_id')
#             else:
#                 raise ValueError("No 'gene_name' or 'gene_id' column found in expression data")
#         else:
#             # Drop non-numeric columns
#             if 'gene_name' in df.columns:
#                 df = df.drop(columns=['gene_name'])
#             if 'Hugo_Symbol' in df.columns:
#                 df = df.drop(columns=['Hugo_Symbol'])
        
#         # Convert all columns to numeric
#         df = df.apply(pd.to_numeric, errors='coerce')
#         print(f"[DEBUG] After converting to numeric, shape: {df.shape}")
#         print(f"[DEBUG] Columns after conversion: {df.columns.tolist()}")

#         # Fill NaN values with column median
#         df = df.fillna(df.median())
#         print(f"[DEBUG] After filling NaN with median:\n{df.head()}")
#         print(f"[DEBUG] Remaining NaN values: {df.isna().sum().sum()}")

#         if len(df) == 0:
#             print(f"[DEBUG] Empty DataFrame for {filepath}")
#             return None
#         return df
#     except FileNotFoundError as e:
#         print(f"[ERROR] File not found: {filepath}")
#         raise
#     except Exception as e:
#         print(f"[ERROR] Failed to load file {filepath}: {e}")
#         raise

# def compute_metrics_for_condition(cancer_name, input_dir, metric_funcs, condition, genes=None, tumor_samples=None, normal_samples=None):
#     expr_dfs = {}
#     for dtype in data_types:
#         try:
#             expr_df = load_expression_file(cancer_name, dtype, input_dir, condition)
#             if expr_df is not None:
#                 expr_df = np.log2(expr_df + 1)
#                 print(f"[DEBUG] {dtype} DataFrame, shape: {expr_df.shape}")
#                 print(f"[DEBUG] {dtype} columns: {expr_df.columns.tolist()}")
#                 expr_dfs[dtype] = expr_df
#         except FileNotFoundError:
#             print(f"[DEBUG] File not found for {dtype}, skipping")
#             continue

#     if not expr_dfs:
#         print("[DEBUG] No expression data loaded")
#         return None

#     result = {}
#     if condition == "gene":
#         if not genes:
#             print("[DEBUG] No genes provided")
#             return None
#         # Convert genes to uppercase
#         genes = [g.upper() for g in genes]
#         for dtype, df in expr_dfs.items():
#             dtype_result = {}
#             valid_genes = [gene for gene in genes if gene in df.index]
#             print(f"[DEBUG] Valid genes for {dtype}: {valid_genes}")
#             if not valid_genes:
#                 print(f"[DEBUG] No valid genes found for {dtype}")
#                 result[dtype] = {}
#                 continue

#             # Filter samples to those present in the DataFrame
#             tumor_samples = [s for s in tumor_samples if s in df.columns] if tumor_samples else []
#             normal_samples = [s for s in normal_samples if s in df.columns] if normal_samples else []
#             print(f"[DEBUG] Valid tumor samples: {tumor_samples}")
#             print(f"[DEBUG] Valid normal samples: {normal_samples}")

#             tumor_df = df.loc[valid_genes, tumor_samples] if tumor_samples else pd.DataFrame(index=valid_genes)
#             normal_df = df.loc[valid_genes, normal_samples] if normal_samples else pd.DataFrame(index=valid_genes)
#             print(f"[DEBUG] Tumor DataFrame shape: {tumor_df.shape}")
#             print(f"[DEBUG] Normal DataFrame shape: {normal_df.shape}")

#             for metric_name, func in metric_funcs.items():
#                 try:
#                     tumor_metric = func(tumor_df) if not tumor_df.empty else pd.Series(0, index=valid_genes)
#                     normal_metric = func(normal_df) if not normal_df.empty else pd.Series(0, index=valid_genes)
#                     print(f"[DEBUG] {metric_name} tumor metric: {tumor_metric.to_dict()}")
#                     print(f"[DEBUG] {metric_name} normal metric: {normal_metric.to_dict()}")
#                 except Exception as e:
#                     print(f"[ERROR] Error computing {metric_name}: {e}")
#                     tumor_metric = pd.Series(0, index=valid_genes)
#                     normal_metric = pd.Series(0, index=valid_genes)

#                 for gene in valid_genes:
#                     if gene not in dtype_result:
#                         dtype_result[gene] = {}
#                     dtype_result[gene][f"{metric_name}_tumor"] = float(tumor_metric.get(gene, 0))
#                     dtype_result[gene][f"{metric_name}_normal"] = float(normal_metric.get(gene, 0))
#                     # dtype_result[gene][f"{metric_name}_combined"] = float(combined_metric.get(gene, 0))

#             result[dtype] = dtype_result
#     elif condition == "tumor":
#         sample_ids = set()
#         for df in expr_dfs.values():
#             sample_ids.update(df.columns)
#         sample_ids = sorted(list(sample_ids))
#         metric_results = {}
#         for metric_name, func in metric_funcs.items():
#             metric_data = {}
#             for dtype in data_types:
#                 expr_df = expr_dfs.get(dtype)
#                 if expr_df is None:
#                     metric_data[dtype] = [0] * len(sample_ids)
#                     continue
#                 try:
#                     metric_series = func(expr_df)
#                     if not isinstance(metric_series, pd.Series):
#                         raise ValueError(f"{metric_name} did not return a Series")
#                     metric_data[dtype] = metric_series.reindex(sample_ids, fill_value=0).tolist()
#                 except Exception as e:
#                     print(f"[ERROR] Error computing {metric_name} for {dtype}: {e}")
#                     metric_data[dtype] = [0] * len(sample_ids)

#             result_list = []
#             for i, sid in enumerate(sample_ids):
#                 record = {"sample_id": sid}
#                 for dtype in data_types:
#                     record[dtype] = metric_data[dtype][i]
#                 result_list.append(record)
#             metric_results[metric_name] = result_list
#         return metric_results if metric_results else None

#     print(f"[DEBUG] Final result for {cancer_name}: {result}")
#     return result if result else None

# # API Endpoint
# @app.route('/api/TH-metrics', methods=['GET'])
# def TH_metrics():
#     cancer = request.args.get('cancer')
#     method = request.args.get('method')
#     metric = request.args.get('metric')

#     print(f"[INFO] Received request: cancer={cancer}, method={method}, metric={metric}")

#     if not all([cancer, method, metric]):
#         return jsonify({"error": "Missing parameters"}), 400

#     cancer_key = cancer.lower()
#     cancer_name = cancer_mapping.get(cancer_key)
#     if not cancer_name:
#         return jsonify({"error": f"Unsupported cancer name or code: {cancer}"}), 400

#     try:
#         results = compute_metrics_for_condition(
#             cancer_name=cancer_name,
#             input_dir=base_raw_dir,
#             metric_funcs={metric: metric_funcs_TH[metric]},
#             condition="tumor"
#         )

#         if not results or metric not in results:
#             return jsonify({"error": "Metric computation failed or no data"}), 500

#         return jsonify(results[metric])
#     except FileNotFoundError as e:
#         return jsonify({"error": f"Missing data file: {str(e)}"}), 404
#     except Exception as e:
#         return jsonify({"error": f"Internal error: {str(e)}"}), 500

# @app.route('/api/gene_noise', methods=['GET'])
# def gene_noise():
#     cancer = request.args.get('cancer')
#     metrics = request.args.get('metric').split(',') if request.args.get('metric') else []
#     gene_ensembl_ids = request.args.get('gene_ensembl_id').split(',') if request.args.get('gene_ensembl_id') else []
#     tumor_samples_param = request.args.get('tumor_samples')
#     normal_samples_param = request.args.get('normal_samples')
    
#     gene_ensembl_ids = [g.strip().upper() for g in gene_ensembl_ids if g.strip()]  # Convert to uppercase
#     tumor_samples = [s.strip() for s in tumor_samples_param.split(',')] if tumor_samples_param else []
#     normal_samples = [s.strip() for s in normal_samples_param.split(',')] if normal_samples_param else []

#     print(f"[INFO] Request: cancer={cancer}, metrics={metrics}, gene_ensembl_ids={gene_ensembl_ids}, tumor_samples={len(tumor_samples)}, normal_samples={len(normal_samples)}")

#     if not all([cancer, metrics, gene_ensembl_ids]):
#         return jsonify({"error": "Missing parameters (cancer, metric, or gene_ensembl_id)"}), 400

#     invalid_metrics = [m for m in metrics if m not in metric_funcs_gene]
#     if invalid_metrics:
#         return jsonify({"error": f"Unsupported metric: {','.join(invalid_metrics)}"}), 400

#     cancer_key = cancer.lower()
#     cancer_name = cancer_mapping.get(cancer_key)
#     if not cancer_name:
#         return jsonify({"error": f"Unsupported cancer name: {cancer}"}), 400

#     try:
#         results = compute_metrics_for_condition(
#             cancer_name=cancer_name,
#             input_dir=base_raw_dir,
#             metric_funcs={m: metric_funcs_gene[m] for m in metric_funcs_gene},
#             condition="gene",
#             genes=gene_ensembl_ids,
#             tumor_samples=tumor_samples,
#             normal_samples=normal_samples
#         )

#         if not results:
#             return jsonify({"error": "Metric computation failed or no data"}), 500

#         print(f"[DEBUG] Gene noise results: {results}")
#         return jsonify(results)
#     except Exception as e:
#         print(f"[ERROR] Error in gene_noise: {str(e)}")
#         return jsonify({"error": f"Internal error: {str(e)}"}), 500

# @app.route('/api/pathway-analysis', methods=['GET'])
# def pathway_analysis():
#     try:
#         cancer = request.args.get("cancer")
#         method = request.args.get("method", "tpm")
#         tumor_samples_param = request.args.get("tumor_samples", "")
#         normal_samples_param = request.args.get("normal_samples", "")
#         genes_param = request.args.get("genes", "")
#         top_n = int(request.args.get("top_n", 200))
#         analysis_type = request.args.get("analysis_type", "ORA")
        
#         tumor_samples = [s.strip() for s in tumor_samples_param.split(',') if s.strip()]
#         normal_samples = [s.strip() for s in normal_samples_param.split(',') if s.strip()]
#         genes = [g.strip().upper() for g in genes_param.split(',') if g.strip()]

#         print(f"[INFO] Request: cancer={cancer}, method={method}, tumor_samples={len(tumor_samples)}, normal_samples={len(normal_samples)}, genes={genes}, top_n={top_n}, analysis_type={analysis_type}")

#         if not cancer or not tumor_samples or not normal_samples:
#             return jsonify({"error": "Missing required parameters (cancer, tumor_samples, normal_samples)"}), 400

#         cancer_key = cancer.lower()
#         cancer_name = cancer_mapping.get(cancer_key)
#         if not cancer_name:
#             return jsonify({"error": f"Unsupported cancer name: {cancer}"}), 400

#         expr_df = load_expression_file(cancer_name, method, base_raw_dir, "pathway")
#         if expr_df is None:
#             return jsonify({"error": "Expression file not found"}), 404

#         tumor_samples = [s for s in tumor_samples if s in expr_df.columns]
#         normal_samples = [s for s in normal_samples if s in expr_df.columns]

#         if not tumor_samples or not normal_samples:
#             return jsonify({"error": "No valid tumor/normal sample IDs found in expression data"}), 400

#         # Validate gene symbols against libraries
#         gene_sets = ["KEGG_2021_Human", "GO_Biological_Process_2021"]
#         library_genes = set(expr_df.index)
#         print(f"[DEBUG] Total genes in expression data: {len(library_genes)}")

#         # Calculate gene statistics and ranked list
#         gene_stats = {}
#         selected_genes = []
#         ranked_list = None

#         # Calculate ranked list based on log2fc for both ORA and GSEA
#         tumor_mean = expr_df[tumor_samples].mean(axis=1)
#         normal_mean = expr_df[normal_samples].mean(axis=1)
#         log2fc = np.log2((tumor_mean + 1e-10) / (normal_mean + 1e-10))
#         ranked_list = pd.DataFrame({
#             'gene': log2fc.index,
#             'log2fc': log2fc
#         }).sort_values(by='log2fc', ascending=False)

#         if analysis_type == "ORA":
#             # Use provided genes if available, otherwise use top N genes
#             if genes:
#                 valid_genes = [g for g in genes if g in expr_df.index and g in library_genes]
#                 if not valid_genes:
#                     return jsonify({
#                         "error": "No valid gene IDs found in expression data or gene set libraries",
#                         "hint": "Ensure gene symbols are uppercase and match KEGG_2021_Human or GO_Biological_Process_2021 identifiers"
#                     }), 400
#                 selected_genes = valid_genes
#             else:
#                 selected_genes = ranked_list['gene'].head(top_n).tolist()
#                 selected_genes = [g.upper() for g in selected_genes]
#         else:  # GSEA
#             selected_genes = ranked_list['gene'].head(top_n).tolist()
#             ranked_list['gene'] = ranked_list['gene'].str.upper()
#             selected_genes = [g.upper() for g in selected_genes]

#         tumor_samples = [s for s in tumor_samples if s in expr_df.columns] if tumor_samples else []
#         normal_samples = [s for s in normal_samples if s in expr_df.columns] if normal_samples else []
#         print(f"[DEBUG] Valid tumor samples: {tumor_samples}")
#         print(f"[DEBUG] Valid normal samples: {normal_samples}")

#         tumor_df = expr_df.loc[selected_genes, tumor_samples] if tumor_samples else pd.DataFrame(index=selected_genes)
#         normal_df = expr_df.loc[selected_genes, normal_samples] if normal_samples else pd.DataFrame(index=selected_genes)
#         valid_genes = list(set(tumor_df.index).intersection(normal_df.index))

#         print(f"[DEBUG] Tumor DataFrame shape: {tumor_df.shape}")
#         print(f"[DEBUG] Normal DataFrame shape: {normal_df.shape}")

#         tumor_metric = cv_calculation(tumor_df) if not tumor_df.empty else pd.Series(0, index=valid_genes)
#         normal_metric = cv_calculation(normal_df) if not normal_df.empty else pd.Series(0, index=valid_genes)

#         # Calculate mean expression and noise metrics for selected genes
#         for gene in selected_genes:
#             tumor_vals = expr_df.loc[gene, tumor_samples].dropna().values if tumor_samples else np.array([])
#             normal_vals = expr_df.loc[gene, normal_samples].dropna().values if normal_samples else np.array([]) 
#             gene_stats[gene] = {
#                 "mean_tumor": float(np.mean(tumor_vals)) if tumor_vals.size else 0,
#                 "mean_normal": float(np.mean(normal_vals)) if normal_vals.size else 0,
#                 "cv_tumor": float(tumor_metric.get(gene, 0)),
#                 "cv_normal": float(normal_metric.get(gene, 0))
#             }

#         # Compute noise metrics for the top 200 genes
#         noise_metrics = compute_metrics_for_condition(
#             cancer_name=cancer_name,
#             input_dir=base_raw_dir,
#             metric_funcs=metric_funcs_gene,  # Use all gene noise metrics
#             condition="gene",
#             genes=selected_genes,
#             tumor_samples=tumor_samples,
#             normal_samples=normal_samples
#         )
#         if not noise_metrics:
#             print(f"[WARNING] Failed to compute noise metrics for selected genes")
#             noise_metrics = {}

#         # Perform pathway enrichment analysis
#         enrichment_results = []
#         for gene_set in gene_sets:
#             print(f"[DEBUG] Running {analysis_type} with gene set: {gene_set}")
#             try:
#                 if analysis_type == "ORA":
#                     enr = enrichr(
#                         gene_list=selected_genes,
#                         gene_sets=gene_set,
#                         organism="Human",
#                         outdir=None,
#                         cutoff=0.05
#                     )
#                     results_df = enr.results
#                     if results_df.empty:
#                         print(f"[WARNING] No pathways found for {gene_set} in ORA analysis")
#                         continue
#                     results = results_df[["Term", "P-value", "Adjusted P-value", "Odds Ratio", "Combined Score", "Genes"]].head(10).to_dict(orient="records")
#                     for res in results:
#                         res["Genes"] = res["Genes"].split(";") if isinstance(res["Genes"], str) else []
#                         res["GeneSet"] = gene_set
#                     enrichment_results.extend(results)
#                 else:
#                     cls = ['Tumor'] * len(tumor_samples) + ['Normal'] * len(normal_samples)
#                     expr_subset = expr_df[tumor_samples + normal_samples]
#                     enr = gsea(
#                         data=expr_subset,
#                         gene_sets="GO_Biological_Process_2021",
#                         cls=cls,
#                         permutation_num=100,
#                         outdir=None,
#                         method='signal_to_noise',
#                         max_size=1000,
#                         min_size=2,
#                         seed=42
#                     )
#                     results_df = enr.res2d
#                     if results_df.empty:
#                         print(f"[WARNING] No pathways found for {gene_set} in GSEA analysis")
#                         continue
#                     results = results_df[["Term", "P-value", "FDR q-val", "NES", "ES", "Lead_genes"]].head(10).to_dict(orient="records")
#                     for res in results:
#                         res["Genes"] = res["Lead_genes"].split(";") if isinstance(res["Lead_genes"], str) else []
#                         res["Adjusted P-value"] = res.pop("FDR q-val")
#                         res["Combined Score"] = res.pop("NES")
#                         res["Odds Ratio"] = res.pop("ES")
#                         res["GeneSet"] = gene_set
#                         del res["Lead_genes"]
#                     enrichment_results.extend(results)
#             except Exception as e:
#                 print(f"[WARNING] Failed to run {analysis_type} with {gene_set}: {str(e)}")
#                 continue

#         if not enrichment_results:
#             return jsonify({
#                 "error": f"No pathways found for {analysis_type} analysis with provided parameters",
#                 "hint": "Ensure gene symbols are uppercase and match KEGG_2021_Human or GO_Biological_Process_2021 identifiers, or try a larger gene list"
#             }), 400

#         print(f"[INFO] Pathway analysis response: enrichment={len(enrichment_results)}, top_genes={len(selected_genes)}")
#         return jsonify({
#             "enrichment": enrichment_results,
#             "top_genes": selected_genes,
#             "gene_stats": gene_stats,
#             "noise_metrics": noise_metrics
#         })

#     except Exception as e:
#         print(f"[ERROR] Pathway analysis failed: {e}")
#         return jsonify({
#             "error": f"Internal server error: {str(e)}",
#             "hint": "Ensure gene symbols are uppercase and match KEGG_2021_Human or GO_Biological_Process_2021 identifiers, or check data file integrity"
#         }), 500

# # Run server
# if __name__ == '__main__':
#     app.run(debug=True, host='0.0.0.0', port=5001)
import os
import pandas as pd
import numpy as np
from flask import Flask, request, jsonify
from flask_cors import CORS
from cv import cv_calculation
from std import std_calculation
from MAD import mad_calculation
from DEPTH2 import depth2_calculation
from DEPTH_ITH import depth_ith_calculation
from gseapy import enrichr, gsea, get_library_name
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
    "std": std_calculation,
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

        # For pathway analysis, expect gene_name as index
        if cond == 'pathway':
            df = df.reset_index()
            if 'gene_name' in df.columns:
                df['gene_name'] = df['gene_name'].str.upper()  # Convert to uppercase
                df = df.set_index('gene_name')
            elif 'gene_id' in df.columns:
                df['gene_id'] = df['gene_id'].str.upper()
                df = df.set_index('gene_id')
            else:
                raise ValueError("No 'gene_name' or 'gene_id' column found in expression data")
        else:
            # Drop non-numeric columns
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
        return np.log2(df + 1)
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
                # expr_df = np.log2(expr_df + 1)
                # print(f"[DEBUG] {dtype} DataFrame, shape: {expr_df.shape}")
                # print(f"[DEBUG] {dtype} columns: {expr_df.columns.tolist()}")
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
        # Convert genes to uppercase
        genes = [g.upper() for g in genes]
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
            # print(f"[DEBUG] Valid tumor samples: {tumor_samples}")
            # print(f"[DEBUG] Valid normal samples: {normal_samples}")

            tumor_df = df.loc[valid_genes, tumor_samples] if tumor_samples else pd.DataFrame(index=valid_genes)
            normal_df = df.loc[valid_genes, normal_samples] if normal_samples else pd.DataFrame(index=valid_genes)
            # print(f"[DEBUG] Tumor DataFrame shape: {tumor_df.shape}")
            # print(f"[DEBUG] Normal DataFrame shape: {normal_df.shape}")

            for metric_name, func in metric_funcs.items():
                try:
                    tumor_metric = func(tumor_df) if not tumor_df.empty else pd.Series(0, index=valid_genes)
                    normal_metric = func(normal_df) if not normal_df.empty else pd.Series(0, index=valid_genes)
                    print(f"[DEBUG] {metric_name} tumor metric: {tumor_metric.to_dict()}")
                    print(f"[DEBUG] {metric_name} normal metric: {normal_metric.to_dict()}")
                except Exception as e:
                    print(f"[ERROR] Error computing {metric_name}: {e}")
                    tumor_metric = pd.Series(0, index=valid_genes)
                    normal_metric = pd.Series(0, index=valid_genes)

                for gene in valid_genes:
                    if gene not in dtype_result:
                        dtype_result[gene] = {}
                    dtype_result[gene][f"{metric_name}_tumor"] = float(tumor_metric.get(gene, 0))
                    dtype_result[gene][f"{metric_name}_normal"] = float(normal_metric.get(gene, 0))
            # for gene in valid_genes:
            #     dtype_result[gene]["logfc"] = dtype_result[gene]["tumor_normal"] - dtype_result[gene]["mean_normal"]
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
        results = compute_metrics_for_condition(
            cancer_name=cancer_name,
            input_dir=base_raw_dir,
            metric_funcs={metric: metric_funcs_TH[metric]},
            condition="tumor"
        )

        if not results or metric not in results:
            return jsonify({"error": "Metric computation failed or no data"}), 500

        return jsonify(results[metric])
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
    
    gene_ensembl_ids = [g.strip().upper() for g in gene_ensembl_ids if g.strip()]  # Convert to uppercase
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
            metric_funcs={m: metric_funcs_gene[m] for m in metric_funcs_gene},
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
        genes_param = request.args.get("genes", "")
        top_n = int(request.args.get("top_n", 15))
        analysis_type = request.args.get("analysis_type", "ORA")
        
        tumor_samples = [s.strip() for s in tumor_samples_param.split(',') if s.strip()]
        normal_samples = [s.strip() for s in normal_samples_param.split(',') if s.strip()]
        genes = [g.strip().upper() for g in genes_param.split(',') if g.strip()]

        print(f"[INFO] Request: cancer={cancer}, method={method}, tumor_samples={len(tumor_samples)}, normal_samples={len(normal_samples)}, genes={genes}, top_n={top_n}, analysis_type={analysis_type}")

        if not cancer or not tumor_samples or not normal_samples:
            return jsonify({"error": "Missing required parameters (cancer, tumor_samples, normal_samples)"}), 400

        cancer_key = cancer.lower()
        cancer_name = cancer_mapping.get(cancer_key)
        if not cancer_name:
            return jsonify({"error": f"Unsupported cancer name: {cancer}"}), 400

        expr_df = load_expression_file(cancer_name, method, base_raw_dir, "pathway")
        if expr_df is None:
            return jsonify({"error": "Expression file not found"}), 404

        tumor_samples = [s for s in tumor_samples if s in expr_df.columns]
        normal_samples = [s for s in normal_samples if s in expr_df.columns]

        if not tumor_samples or not normal_samples:
            return jsonify({"error": "No valid tumor/normal sample IDs found in expression data"}), 400

        # Validate gene symbols against libraries
        gene_sets = ["KEGG_2021_Human", "GO_Biological_Process_2021"]
        library_genes = set(expr_df.index)
        print(f"[DEBUG] Total genes in expression data: {len(library_genes)}")

        # Calculate gene statistics and ranked list
        gene_stats = {}
        selected_genes = []
        ranked_list = None

        # Calculate ranked list based on log2fc for both ORA and GSEA
        tumor_mean = expr_df[tumor_samples].mean(axis=1)
        normal_mean = expr_df[normal_samples].mean(axis=1)
        # log2fc = np.log2((tumor_mean + 1e-10) / (normal_mean + 1e-10))
        log2fc = tumor_mean - normal_mean
        print("Using log2 ratio:", np.log2((tumor_mean + 1e-10) / (normal_mean + 1e-10)))
        print("Using difference:", tumor_mean - normal_mean)
        ranked_list = pd.DataFrame({
            'gene': log2fc.index,
            'log2fc': log2fc
        }).sort_values(by='log2fc', ascending=False)

        if analysis_type == "ORA":
            # Use provided genes if available, otherwise use top N genes
            if genes:
                valid_genes = [g for g in genes if g in expr_df.index and g in library_genes]
                if not valid_genes:
                    return jsonify({
                        "error": "No valid gene IDs found in expression data or gene set libraries",
                        "hint": "Ensure gene symbols are uppercase and match KEGG_2021_Human or GO_Biological_Process_2021 identifiers"
                    }), 400
                selected_genes = valid_genes
            else:
                # from scipy.stats import ttest_ind
                # from statsmodels.stats.multitest import multipletests

                # # Perform t-tests row-wise
                # pvals = expr_df.apply(lambda row: ttest_ind(row[tumor_samples], row[normal_samples], equal_var=False)[1], axis=1)
                
                # # FDR correction
                # _, padj, _, _ = multipletests(pvals, method="fdr_bh")

                # # Combine into DataFrame
                # deg_df = pd.DataFrame({
                #     "gene": expr_df.index,
                #     "log2fc": log2fc,
                #     "padj": padj
                # })

                # # Filter DEGs based on thresholds
                # deg_df = deg_df[(deg_df["padj"] < 0.05) & (abs(deg_df["log2fc"]) >= 2)]
                # selected_genes = deg_df["gene"].str.upper().tolist()
                selected_genes = ranked_list['gene'].head(top_n).tolist()
                selected_genes = [g.upper() for g in selected_genes]
        else:  # GSEA
            selected_genes = ranked_list['gene'].head(top_n).tolist()
            ranked_list['gene'] = ranked_list['gene'].str.upper()
            selected_genes = [g.upper() for g in selected_genes]

        # Ensure selected_genes are in expr_df index
        selected_genes = [g for g in selected_genes if g in expr_df.index]
        print(f"[DEBUG] Final selected genes: {len(selected_genes)}")

        tumor_samples = [s for s in tumor_samples if s in expr_df.columns] if tumor_samples else []
        normal_samples = [s for s in normal_samples if s in expr_df.columns] if normal_samples else []
        # print(f"[DEBUG] Valid tumor samples: {len(tumor_samples)}")
        # print(f"[DEBUG] Valid normal samples: {len(normal_samples)}")

        tumor_df = expr_df.loc[selected_genes, tumor_samples] if tumor_samples else pd.DataFrame(index=selected_genes)
        normal_df = expr_df.loc[selected_genes, normal_samples] if normal_samples else pd.DataFrame(index=selected_genes)
        valid_genes = list(set(tumor_df.index).intersection(normal_df.index))
        # print(f"[DEBUG] Valid genes after intersection: {len(valid_genes)}")
        # print(f"[DEBUG] Tumor DataFrame shape: {tumor_df.shape}")
        # print(f"[DEBUG] Normal DataFrame shape: {normal_df.shape}")

        # Check for non-numeric values
        if not tumor_df.empty and not tumor_df.select_dtypes(include=[np.number]).equals(tumor_df):
            print(f"[ERROR] Non-numeric values found in tumor_df:\n{tumor_df.head()}")
            raise ValueError("Tumor DataFrame contains non-numeric values")
        if not normal_df.empty and not normal_df.select_dtypes(include=[np.number]).equals(normal_df):
            print(f"[ERROR] Non-numeric values found in normal_df:\n{normal_df.head()}")
            raise ValueError("Normal DataFrame contains non-numeric values")

        # Safe CV calculation
        def safe_cv_calculation(df):
            if df.empty:
                return pd.Series(0, index=df.index)
            mean = df.mean(axis=1)
            std = df.std(axis=1)
            # Avoid division by zero and handle small sample sizes
            cv = np.where(mean != 0, std / mean, 0)
            cv = np.where(np.isfinite(cv), cv, 0)  # Replace inf/nan with 0
            return pd.Series(cv, index=df.index)

        tumor_metric = safe_cv_calculation(tumor_df) if not tumor_df.empty else pd.Series(0, index=valid_genes)
        normal_metric = safe_cv_calculation(normal_df) if not normal_df.empty else pd.Series(0, index=valid_genes)
        # print(f"[DEBUG] Tumor CV metric head: {tumor_metric.head().to_dict()}")
        # print(f"[DEBUG] Normal CV metric head: {normal_metric.head().to_dict()}")

        # Calculate mean expression and noise metrics for selected genes
        for gene in selected_genes:
            try:
                tumor_vals = expr_df.loc[gene, tumor_samples].dropna().values if tumor_samples else np.array([])
                normal_vals = expr_df.loc[gene, normal_samples].dropna().values if normal_samples else np.array([])
                tumor_cv = float(tumor_metric.get(gene, 0)) if gene in tumor_metric.index else 0.0
                normal_cv = float(normal_metric.get(gene, 0)) if gene in normal_metric.index else 0.0
                gene_stats[gene] = {
                    "mean_tumor": float(np.mean(tumor_vals)) if tumor_vals.size else 0.0,
                    "mean_normal": float(np.mean(normal_vals)) if normal_vals.size else 0.0,
                    "cv_tumor": tumor_cv*100,
                    "cv_normal": normal_cv*100,
                    "logfc": log2fc[gene]
                }
            except Exception as e:
                print(f"[ERROR] Error processing gene {gene}: {e}")
                gene_stats[gene] = {
                    "mean_tumor": 0.0,
                    "mean_normal": 0.0,
                    "cv_tumor": 0.0,
                    "cv_normal": 0.0,
                    "logfc": 0.0
                }

        # Compute noise metrics for the selected genes
        noise_metrics = compute_metrics_for_condition(
            cancer_name=cancer_name,
            input_dir=base_raw_dir,
            metric_funcs=metric_funcs_gene,  # Use all gene noise metrics
            condition="gene",
            genes=selected_genes,
            tumor_samples=tumor_samples,
            normal_samples=normal_samples
        )
        if not noise_metrics:
            print(f"[WARNING] Failed to compute noise metrics for selected genes")
            noise_metrics = {}

        # Perform pathway enrichment analysis
        enrichment_results = []
        for gene_set in gene_sets:
            print(f"[DEBUG] Running {analysis_type} with gene set: {gene_set}")
            try:
                if analysis_type == "ORA":
                    enr = enrichr(
                        gene_list=selected_genes,
                        gene_sets=gene_set,
                        organism="Human",
                        outdir=None,
                        cutoff=0.05
                    )
                    results_df = enr.results
                    if results_df.empty:
                        print(f"[WARNING] No pathways found for {gene_set} in ORA analysis")
                        continue
                    results = results_df[["Term", "P-value", "Adjusted P-value", "Odds Ratio", "Combined Score", "Genes"]].head(10).to_dict(orient="records")
                    for res in results:
                        res["Genes"] = res["Genes"].split(";") if isinstance(res["Genes"], str) else []
                        res["GeneSet"] = gene_set
                    enrichment_results.extend(results)
                else:
                    cls = ['Tumor'] * len(tumor_samples) + ['Normal'] * len(normal_samples)
                    expr_subset = expr_df[tumor_samples + normal_samples]
                    enr = gsea(
                        data=expr_subset,
                        gene_sets="GO_Biological_Process_2021",
                        cls=cls,
                        permutation_num=100,
                        outdir=None,
                        method='signal_to_noise',
                        max_size=1000,
                        min_size=2,
                        seed=42
                    )
                    results_df = enr.res2d
                    if results_df.empty:
                        print(f"[WARNING] No pathways found for {gene_set} in GSEA analysis")
                        continue
                    results = results_df[["Term", "P-value", "FDR q-val", "NES", "ES", "Lead_genes"]].head(10).to_dict(orient="records")
                    for res in results:
                        res["Genes"] = res["Lead_genes"].split(";") if isinstance(res["Lead_genes"], str) else []
                        res["Adjusted P-value"] = res.pop("FDR q-val")
                        res["Combined Score"] = res.pop("NES")
                        res["Odds Ratio"] = res.pop("ES")
                        res["GeneSet"] = gene_set
                        del res["Lead_genes"]
                    enrichment_results.extend(results)
            except Exception as e:
                print(f"[WARNING] Failed to run {analysis_type} with {gene_set}: {str(e)}")
                continue

        if not enrichment_results:
            return jsonify({
                "error": f"No pathways found for {analysis_type} analysis with provided parameters",
                "hint": "Ensure gene symbols are uppercase and match KEGG_2021_Human or GO_Biological_Process_2021 identifiers, or try a larger gene list"
            }), 400

        print(f"[INFO] Pathway analysis response: enrichment={len(enrichment_results)}, top_genes={len(selected_genes)}")
        return jsonify({
            "enrichment": enrichment_results,
            "top_genes": selected_genes,
            "gene_stats": gene_stats,
            "noise_metrics": noise_metrics
        })

    except Exception as e:
        print(f"[ERROR] Pathway analysis failed: {e}")
        return jsonify({
            "error": f"Internal server error: {str(e)}",
            "hint": "Ensure gene symbols are uppercase and match KEGG_2021_Human or GO_Biological_Process_2021 identifiers, or check data file integrity"
        }), 500

# Run server
if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5001)