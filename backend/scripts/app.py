import os
import pandas as pd
import numpy as np
from flask import Flask, request, jsonify
from flask_cors import CORS
from cv import cv_calculation
from std import std_calculation
from MAD import mad_calculation
from DEPTH2 import depth2_calculation
from DEPTH_ITH import depth_calculation
from cv_2 import cv2_calculation
from mean import mean_calculation
from gseapy import enrichr
from functools import lru_cache
from concurrent.futures import ThreadPoolExecutor
import logging
import time
from traceback import format_exc

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Initialize Flask App
app = Flask(__name__)
CORS(app, resources={r"/api/*": {
    "origins": ["http://localhost:8081", "https://tcna.lums.edu.pk/"],
    "methods": ["GET", "POST", "OPTIONS"],
    "allow_headers": ["Content-Type", "Authorization"],
    "supports_credentials": True
}})

# Configuration
BASE_DIR = "../data/raw"
DATA_TYPES = ["tpm", "fpkm", "fpkm_uq"]
MAX_WORKERS = 7

# Metric functions
METRIC_FUNCS_TH = {"DEPTH2": depth2_calculation, "tITH": depth_calculation}
METRIC_FUNCS_GENE = {
    "cv": cv_calculation, "cv_squared": cv2_calculation,
    "std": std_calculation, "mad": mad_calculation, "mean": mean_calculation
}
CANCER_MAPPING = {
    "liver and bile duct": "liver", "breast": "breast", "bladder": "bladder",
    "colorectal": "colon", "uterus": "uterus", "lung": "lung", "kidney": "kidney",
    "rectum": "rectum", "stomach": "stomach", "brain and nervous system": "brain",
    "thymus": "thymus", "cervix": "cervix", "adrenal gland": "adrenal",
    "head and neck": "headandneck", "esophagus": "esophagus", "prostate": "prostate",
    "thyroid": "thyroid", "pancreas": "pancreas", "testis": "testis",
    "lymph nodes": "lymph", "heart and pleura": "heart", "ovary": "ovary",
    "skin": "skin", "eye and adnexa": "eye", "bone marrow and blood": "blood",
    "soft tissue": "soft tissue"
}
REVERSE_CANCER_MAPPING = {v: k for k, v in CANCER_MAPPING.items()}

def get_file_mtime(filepath):
    try:
        return os.path.getmtime(filepath)
    except FileNotFoundError:
        return 0

@lru_cache(maxsize=100)
def load_expression_file(cancer_name, dtype, input_dir, cond, _cache_key=None):
    try:
        if not os.path.exists(input_dir) or not os.access(input_dir, os.R_OK):
            logger.error(f"Input directory {input_dir} does not exist or is not readable")
            return {'raw': {'tumor': None, 'normal': None}, 'log2': {'tumor': None, 'normal': None}}

        files = {
            'tumor': os.path.join(input_dir, cancer_name, f"tumor_{dtype}.csv.gz"),
            'normal': os.path.join(input_dir, cancer_name, f"normal_{dtype}.csv.gz")
        }
        result = {'raw': {}, 'log2': {}}

        for key, filepath in files.items():
            if os.path.exists(filepath):
                try:
                    df = pd.read_csv(filepath, index_col=0)
                    if df.empty:
                        logger.warning(f"Empty file: {filepath}")
                        result['raw'][key] = None
                        result['log2'][key] = None
                        continue

                    logger.info(f"Loaded {key} file: {filepath}, shape: {df.shape}")
                    
                    if cond == 'pathway':
                        if 'gene_name' not in df.columns:
                            logger.error(f"Missing 'gene_name' column in {filepath}")
                            result['raw'][key] = None
                            result['log2'][key] = None
                            continue
                        df['gene_name'] = df['gene_name'].astype(str)
                        if df['gene_name'].duplicated().any():
                            logger.warning(f"Duplicate gene names found in {filepath}, dropping duplicates")
                            df = df[~df['gene_name'].duplicated(keep='first')]
                        df = df.set_index('gene_name')
                        df = df.drop(columns=['gene_id'], errors='ignore')
                    else:
                        df = df.drop(columns=['gene_name', 'Hugo_Symbol'], errors='ignore')

                    df = df.apply(pd.to_numeric, errors='coerce')
                    if df.isna().all().all():
                        logger.warning(f"No valid numeric data in {filepath}")
                        result['raw'][key] = None
                        result['log2'][key] = None
                        continue
                    df = df.fillna(df.median(numeric_only=True))
                    result['raw'][key] = df
                    result['log2'][key] = np.log2(df + 1)
                except pd.errors.EmptyDataError:
                    logger.warning(f"Empty or invalid CSV file: {filepath}")
                    result['raw'][key] = None
                    result['log2'][key] = None
                except Exception as e:
                    logger.error(f"Failed to process {filepath}: {e}")
                    result['raw'][key] = None
                    result['log2'][key] = None
            else:
                logger.warning(f"File not found: {filepath}")
                result['raw'][key] = None
                result['log2'][key] = None

        return result
    except Exception as e:
        logger.error(f"Failed to load files for {cancer_name}, {dtype}: {e}")
        return {'raw': {'tumor': None, 'normal': None}, 'log2': {'tumor': None, 'normal': None}}

def compute_metrics(cancer_names, input_dir, metric_funcs, condition, genes=None, sample_ids=None):
    if not isinstance(cancer_names, list):
        cancer_names = [cancer_names]

    def process_cancer(cancer_name):
        expr_dfs = {dtype: load_expression_file(cancer_name, dtype, input_dir, condition,
                                                _cache_key=tuple(get_file_mtime(os.path.join(input_dir, cancer_name, f"{t}_{dtype}.csv.gz"))
                                                                for t in ['tumor', 'normal']))
                    for dtype in DATA_TYPES}
        missing_data = [dtype for dtype in DATA_TYPES if expr_dfs[dtype]['raw']['tumor'] is None and expr_dfs[dtype]['raw']['normal'] is None]
        if missing_data:
            logger.warning(f"No expression data loaded for {cancer_name} in {missing_data}")
            return cancer_name, None

        result = {}
        if condition == "gene" and genes:
            genes_upper = [g.upper() for g in genes]
            for dtype in DATA_TYPES:
                result[dtype] = {'raw': {}, 'log2': {}}
                for transform in ['raw', 'log2']:
                    tumor_df, normal_df = expr_dfs[dtype][transform]['tumor'], expr_dfs[dtype][transform]['normal']
                    if tumor_df is None and normal_df is None:
                        logger.warning(f"No {transform} data for {cancer_name}, {dtype}")
                        continue
                    valid_genes = [g for g in genes_upper if (tumor_df is not None and g in tumor_df.index) or
                                  (normal_df is not None and g in normal_df.index)]
                    if not valid_genes:
                        logger.warning(f"No valid genes found for {cancer_name}, {dtype}, {transform}")
                        continue

                    tumor_df = tumor_df.loc[valid_genes] if tumor_df is not None else pd.DataFrame(index=valid_genes)
                    normal_df = normal_df.loc[valid_genes] if normal_df is not None else pd.DataFrame(index=valid_genes)

                    dtype_result = {}
                    for gene in valid_genes:
                        dtype_result[gene] = {}
                        for metric_name, func in metric_funcs.items():
                            try:
                                tumor_metric = func(tumor_df)[gene] if tumor_df is not None and not tumor_df.empty else 0
                                normal_metric = func(normal_df)[gene] if normal_df is not None and not normal_df.empty else 0
                                dtype_result[gene][f"{metric_name}_tumor"] = float(tumor_metric)
                                dtype_result[gene][f"{metric_name}_normal"] = float(normal_metric)
                                if metric_name == "cv":
                                    dtype_result[gene]["logfc"] = float(tumor_metric - normal_metric) if normal_metric != 0 else 0
                            except Exception as e:
                                logger.error(f"Error computing {metric_name} for {cancer_name}, {dtype}, gene {gene}: {e}")
                                dtype_result[gene][f"{metric_name}_tumor"] = 0.0
                                dtype_result[gene][f"{metric_name}_normal"] = 0.0
                                if metric_name == "cv":
                                    dtype_result[gene]["logfc"] = 0.0
                    result[dtype][transform] = dtype_result
        elif condition == "tumor":
            sample_ids_set = set()
            for dtype in DATA_TYPES:
                if expr_dfs[dtype]['log2']['tumor'] is not None:
                    sample_ids_set.update(expr_dfs[dtype]['log2']['tumor'].columns)
            sample_ids_set = sorted(sample_ids_set)
            if not sample_ids_set:
                logger.warning(f"No valid sample IDs for {cancer_name}")
                return cancer_name, None

            metric_results = {}
            for metric_name, func in metric_funcs.items():
                metric_data = {}
                for dtype in DATA_TYPES:
                    tumor_df = expr_dfs[dtype]['log2']['tumor']
                    normal_df = expr_dfs[dtype]['log2']['normal']
                    if tumor_df is None:
                        logger.warning(f"No tumor data for {cancer_name}, {dtype}")
                        metric_data[dtype] = [0] * len(sample_ids_set)
                        continue
                    try:
                        tumor_df = tumor_df[sample_ids_set]
                        metric_series = func(tumor_df, normal_df) if metric_name == "tITH" else func(tumor_df)
                        metric_data[dtype] = metric_series.reindex(sample_ids_set, fill_value=0).tolist()
                    except Exception as e:
                        logger.error(f"Error computing {metric_name} for {dtype}: {e}")
                        metric_data[dtype] = [0] * len(sample_ids_set)
                metric_results[metric_name] = [
                    {"sample_id": sid, **{dtype: metric_data[dtype][i] for dtype in DATA_TYPES}}
                    for i, sid in enumerate(sample_ids_set)
                ]
            return cancer_name, metric_results
        return cancer_name, result or None

    with ThreadPoolExecutor(max_workers=MAX_WORKERS) as executor:
        results = dict(executor.map(process_cancer, cancer_names))
    return results or None

@app.errorhandler(Exception)
def handle_error(error):
    logger.error(f"Unhandled error: {str(error)}\n{format_exc()}")
    return jsonify({"error": f"Internal server error: {str(error)}"}), 500

@app.route('/api/gene_noise', methods=['GET'])
def gene_noise():
    cancers = request.args.getlist('cancer')
    metrics = request.args.getlist('metric')
    gene_ensembl_ids = [g.strip().upper() for g in request.args.get('gene_ensembl_id', '').split(',') if g.strip()]
    logger.info(f"Request: cancers={cancers}, metrics={metrics}, gene_ensembl_ids={gene_ensembl_ids}")

    if not (cancers and gene_ensembl_ids):
        return jsonify({"error": "Missing parameters (cancer or gene_ensembl_id)"}), 400

    metric_mapping = {
        "CV": "cv", "Mean": "mean", "Standard Deviation": "std",
        "MAD": "mad", "CV²": "cv_squared", "Differential Noise": "logfc"
    }
    api_metrics = [metric_mapping.get(m, m) for m in metrics if metric_mapping.get(m, m)]
    if not api_metrics or api_metrics == ["logfc"]:
        api_metrics = list(METRIC_FUNCS_GENE.keys()) + ["logfc"]
    elif "logfc" in api_metrics and "cv" not in api_metrics:
        api_metrics.append("cv")
    api_metrics = list(set(api_metrics))

    invalid_metrics = [m for m in api_metrics if m not in METRIC_FUNCS_GENE and m != "logfc"]
    if invalid_metrics:
        return jsonify({"error": f"Unsupported metric: {','.join(invalid_metrics)}"}), 400

    cancer_names = [CANCER_MAPPING.get(c.lower(), c.lower()) for c in cancers]
    invalid_cancers = [c for c in cancers if CANCER_MAPPING.get(c.lower(), c.lower()) not in cancer_names]
    if invalid_cancers:
        return jsonify({"error": f"Unsupported cancer names: {','.join(invalid_cancers)}"}), 400

    try:
        requested_metrics = {m: METRIC_FUNCS_GENE[m] for m in api_metrics if m in METRIC_FUNCS_GENE}
        results = compute_metrics(cancer_names, BASE_DIR, requested_metrics, "gene", gene_ensembl_ids)
        if not results:
            return jsonify({"error": "Metric computation failed or no data"}), 500

        transformed_results = {'raw': {dtype: {} for dtype in DATA_TYPES}, 'log2': {dtype: {} for dtype in DATA_TYPES}}
        for dtype in DATA_TYPES:
            for cancer_name in cancer_names:
                if cancer_name in results and results[cancer_name]:
                    for transform in ['raw', 'log2']:
                        if dtype in results[cancer_name] and results[cancer_name][dtype][transform]:
                            for gene, metrics in results[cancer_name][dtype][transform].items():
                                transformed_results[transform][dtype].setdefault(gene, {})[cancer_name] = metrics

        logger.info(f"Gene noise results computed for {len(cancer_names)} cancers")
        return jsonify(transformed_results)
    except Exception as e:
        logger.error(f"Error in gene_noise: {str(e)}")
        return jsonify({"error": f"Internal error: {str(e)}"}), 500

@app.route('/api/TH-metrics', methods=['GET'])
def TH_metrics():
    cancer = request.args.get('cancer')
    method = request.args.get('method')
    metric = request.args.get('metric')
    logger.info(f"Received request: cancer={cancer}, method={method}, metric={metric}")

    if not all([cancer, method, metric]):
        return jsonify({"error": "Missing parameters"}), 400

    cancer_name = CANCER_MAPPING.get(cancer.lower(), cancer.lower())
    if not cancer_name or metric not in METRIC_FUNCS_TH:
        return jsonify({"error": f"Unsupported {'cancer name' if not cancer_name else 'metric'}: {cancer if not cancer_name else metric}"}), 400

    try:
        results = compute_metrics([cancer_name], BASE_DIR, {metric: METRIC_FUNCS_TH[metric]}, "tumor")
        if not results or not results.get(cancer_name) or metric not in results[cancer_name]:
            return jsonify({"error": "Metric computation failed or no data"}), 500

        transformed_results = [
            {'sample_id': sample['sample_id'], method: sample[method]}
            for sample in results[cancer_name][metric]
        ]
        return jsonify({'log2': {method: transformed_results}})
    except FileNotFoundError as e:
        return jsonify({"error": f"Missing data file: {str(e)}"}), 404
    except Exception as e:
        logger.error(f"Error in TH-metrics: {str(e)}")
        return jsonify({"error": f"Internal error: {str(e)}"}), 500

# @app.route('/api/pathway-analysis', methods=['GET'])
# def pathway_analysis():
#     try:
#         cancer = [c.strip() for c in request.args.get('cancer', '').split(',') if c.strip()]
#         genes = [g.strip().upper() for g in request.args.get("genes", "").split(',') if g.strip()]
#         logger.info(f"Request: cancer={cancer}, genes={genes}")

#         if not cancer:
#             return jsonify({"error": "Missing required parameter: cancer"}), 400

#         cancer_names = [CANCER_MAPPING.get(c.lower(), c.lower()) for c in cancer]
#         invalid_cancers = [c for c in cancer if CANCER_MAPPING.get(c.lower(), c.lower()) not in cancer_names]
#         if invalid_cancers:
#             return jsonify({"error": f"Unsupported cancer names: {','.join(invalid_cancers)}"}), 400

#         response = {'raw': {method: {"enrichment": [], "top_genes": [], "gene_stats": {}, "heatmap_data": {}, "warning": None} for method in DATA_TYPES},
#                     'log2': {method: {"enrichment": [], "top_genes": [], "gene_stats": {}, "heatmap_data": {}, "warning": None} for method in DATA_TYPES}}

#         def process_pathway_method(method):
#             all_dfs = {'raw': {'tumor': {}, 'normal': {}}, 'log2': {'tumor': {}, 'normal': {}}}
#             missing_normal = []
#             missing_tumor = []
#             for cancer_name in cancer_names:
#                 data = load_expression_file(cancer_name, method, BASE_DIR, "pathway",
#                                             _cache_key=tuple(get_file_mtime(os.path.join(BASE_DIR, cancer_name, f"{t}_{method}.csv.gz"))
#                                                             for t in ['tumor', 'normal']))
#                 for transform in ['raw', 'log2']:
#                     all_dfs[transform]['tumor'][cancer_name] = data[transform]['tumor']
#                     all_dfs[transform]['normal'][cancer_name] = data[transform]['normal']
#                     if data[transform]['tumor'] is None:
#                         missing_tumor.append(cancer_name)
#                     if data[transform]['normal'] is None:
#                         missing_normal.append(cancer_name)

#             for transform in ['raw', 'log2']:
#                 # Check if any tumor data is available
#                 if not any(df is not None for df in all_dfs[transform]['tumor'].values()):
#                     response[transform][method]["warning"] = f"No valid tumor expression data found for {method} normalization in {', '.join(missing_tumor)}"
#                     continue
#                 if missing_normal:
#                     response[transform][method]["warning"] = f"No normal data for {', '.join(set(missing_normal))} with {method} normalization"

#                 # Compute library genes only from non-None DataFrames
#                 library_genes = set()
#                 for df in all_dfs[transform]['tumor'].values():
#                     if df is not None and not df.empty:
#                         library_genes.update(df.index)
#                 if all_dfs[transform]['normal']:
#                     normal_genes = set()
#                     for df in all_dfs[transform]['normal'].values():
#                         if df is not None and not df.empty:
#                             normal_genes.update(df.index)
#                     library_genes.intersection_update(normal_genes)

#                 if not library_genes:
#                     response[transform][method]["warning"] = (response[transform][method]["warning"] or "") + f" No common genes found for {method} normalization ({transform})"
#                     continue

#                 selected_genes = [g for g in genes if g in library_genes] if genes else []
#                 if not selected_genes:
#                     cv_tumors = [METRIC_FUNCS_GENE['cv'](df) for df in all_dfs[transform]['tumor'].values() if df is not None and not df.empty]
#                     if not cv_tumors:
#                         response[transform][method]["warning"] = (response[transform][method]["warning"] or "") + f" No valid tumor data for CV computation with {method} normalization"
#                         continue
#                     avg_cv_tumor = pd.concat(cv_tumors, axis=1).mean(axis=1)
#                     cv_normals = [METRIC_FUNCS_GENE['cv'](df) for df in all_dfs[transform]['normal'].values() if df is not None and not df.empty]
#                     score = np.log2((avg_cv_tumor + 1e-8) / (pd.concat(cv_normals, axis=1).mean(axis=1) + 1e-8) if cv_normals else avg_cv_tumor)
#                     selected_genes = pd.DataFrame({'gene': avg_cv_tumor.index, 'score': score}).sort_values(by='score', ascending=False)['gene'].tolist()

#                 heatmap_data = {}
#                 gene_stats = {}
#                 for gene in selected_genes:
#                     gene_stats[gene] = {}
#                     for cancer_name in cancer_names:
#                         display_name = REVERSE_CANCER_MAPPING.get(cancer_name, cancer_name)
#                         tumor_df = all_dfs[transform]['tumor'].get(cancer_name)
#                         normal_df = all_dfs[transform]['normal'].get(cancer_name)
#                         tumor_mean = tumor_df.loc[gene].mean() if tumor_df is not None and gene in tumor_df.index else 0.0
#                         normal_mean = normal_df.loc[gene].mean() if normal_df is not None and gene in normal_df.index else 0.0
#                         tumor_cv = METRIC_FUNCS_GENE['cv'](tumor_df)[gene] if tumor_df is not None and gene in tumor_df.index else 0.0
#                         normal_cv = METRIC_FUNCS_GENE['cv'](normal_df)[gene] if normal_df is not None and gene in normal_df.index else 0.0
#                         heatmap_data.setdefault(gene, {})[f"{cancer_name} Tumor"] = float(tumor_mean)
#                         heatmap_data[gene][f"{cancer_name} Normal"] = float(normal_mean)
#                         gene_stats[gene][display_name] = {
#                             "mean_tumor": float(tumor_mean), "mean_normal": float(normal_mean),
#                             "cv_tumor": float(tumor_cv), "cv_normal": float(normal_cv), "logfc": float(tumor_cv - normal_cv)
#                         }

#                 enrichment_results = []
#                 for gene_set in ["KEGG_2021_Human", "GO_Biological_Process_2021"]:
#                     try:
#                         enr = enrichr(gene_list=selected_genes, gene_sets=gene_set, organism="Human", outdir=None, cutoff=0.05)
#                         if not enr.results.empty:
#                             results = enr.results[["Term", "P-value", "Overlap", "Adjusted P-value", "Odds Ratio", "Combined Score", "Genes"]].head(10).to_dict(orient="records")
#                             for res in results:
#                                 res["Genes"] = res["Genes"].split(";") if isinstance(res["Genes"], str) else []
#                                 res["GeneSet"] = gene_set
#                             enrichment_results.extend(results)
#                         else:
#                             logger.warning(f"No enrichment results for {gene_set} with {method} ({transform})")
#                     except Exception as e:
#                         logger.warning(f"Failed to run ORA with {gene_set} for {method} ({transform}): {e}")

#                 response[transform][method].update({
#                     "enrichment": enrichment_results, "top_genes": selected_genes,
#                     "gene_stats": gene_stats, "heatmap_data": heatmap_data
#                 })
#                 if not enrichment_results:
#                     response[transform][method]["warning"] = (response[transform][method]["warning"] or "") + f" No pathways found for {method} normalization ({transform})"

#             return method, response['raw'][method], response['log2'][method]

#         with ThreadPoolExecutor(max_workers=MAX_WORKERS) as executor:
#             for method, raw_response, log2_response in executor.map(process_pathway_method, DATA_TYPES):
#                 response['raw'][method] = raw_response
#                 response['log2'][method] = log2_response

#         if not any(response[transform][method]["enrichment"] or response[transform][method]["top_genes"] for transform in response for method in DATA_TYPES):
#             return jsonify({
#                 "error": "No valid data or pathways found for any normalization method",
#                 "hint": "Ensure gene symbols are uppercase, match KEGG_2021_Human or GO_Biological_Process_2021 identifiers, and verify that data files exist for the specified cancer types"
#             }), 500
#         return jsonify(response)
#     except Exception as e:
#         logger.error(f"Pathway analysis failed: {e}\n{format_exc()}")
#         return jsonify({
#             "error": f"Internal server error: {str(e)}",
#             "hint": "Ensure gene symbols are uppercase, match KEGG_2021_Human or GO_Biological_Process_2021 identifiers, and verify that data files exist"
#         }), 500
@app.route('/api/pathway-analysis', methods=['GET'])
def pathway_analysis():
    try:
        cancer = [c.strip() for c in request.args.get('cancer', '').split(',') if c.strip()]
        genes = [g.strip().upper() for g in request.args.get("genes", "").split(',') if g.strip()]
        logger.info(f"Request: cancer={cancer}, genes={genes}")

        if not cancer:
            return jsonify({"error": "Missing required parameter: cancer"}), 400

        cancer_names = [CANCER_MAPPING.get(c.lower(), c.lower()) for c in cancer]
        invalid_cancers = [c for c in cancer if CANCER_MAPPING.get(c.lower(), c.lower()) not in cancer_names]
        if invalid_cancers:
            return jsonify({"error": f"Unsupported cancer names: {','.join(invalid_cancers)}"}), 400

        response = {'raw': {method: {"enrichment": [], "top_genes": [], "gene_stats": {}, "heatmap_data": {}, "warning": None} for method in DATA_TYPES},
                    'log2': {method: {"enrichment": [], "top_genes": [], "gene_stats": {}, "heatmap_data": {}, "warning": None} for method in DATA_TYPES}}

        def process_pathway_method(method):
            all_dfs = {'raw': {'tumor': {}, 'normal': {}}, 'log2': {'tumor': {}, 'normal': {}}}
            missing_normal = []
            missing_tumor = []
            for cancer_name in cancer_names:
                data = load_expression_file(cancer_name, method, BASE_DIR, "pathway",
                                            _cache_key=tuple(get_file_mtime(os.path.join(BASE_DIR, cancer_name, f"{t}_{method}.csv.gz"))
                                                            for t in ['tumor', 'normal']))
                for transform in ['raw', 'log2']:
                    all_dfs[transform]['tumor'][cancer_name] = data[transform]['tumor']
                    all_dfs[transform]['normal'][cancer_name] = data[transform]['normal']
                    if data[transform]['tumor'] is None:
                        missing_tumor.append(cancer_name)
                    if data[transform]['normal'] is None:
                        missing_normal.append(cancer_name)

            for transform in ['raw', 'log2']:
                # Check if any tumor data is available
                if not any(df is not None for df in all_dfs[transform]['tumor'].values()):
                    response[transform][method]["warning"] = f"No valid tumor expression data found for {method} normalization in {', '.join(missing_tumor)}"
                    continue
                if missing_normal:
                    response[transform][method]["warning"] = f"No normal data for {', '.join(set(missing_normal))} with {method} normalization; results based on tumor data only"

                # Compute library genes from non-None tumor DataFrames
                library_genes = set()
                for df in all_dfs[transform]['tumor'].values():
                    if df is not None and not df.empty:
                        library_genes.update(df.index)

                # Only intersect with normal genes if normal data is available
                has_normal_data = any(df is not None and not df.empty for df in all_dfs[transform]['normal'].values())
                if has_normal_data:
                    normal_genes = set()
                    for df in all_dfs[transform]['normal'].values():
                        if df is not None and not df.empty:
                            normal_genes.update(df.index)
                    library_genes.intersection_update(normal_genes)

                if not library_genes:
                    response[transform][method]["warning"] = (response[transform][method]["warning"] or "") + f" No common genes found for {method} normalization ({transform})"
                    continue

                selected_genes = [g for g in genes if g in library_genes] if genes else []
                if genes and not selected_genes:
                    response[transform][method]["warning"] = (response[transform][method]["warning"] or "") + f" None of the provided genes ({', '.join(genes)}) found in available {method} data"
                    continue

                if not selected_genes:
                    cv_tumors = [METRIC_FUNCS_GENE['cv'](df) for df in all_dfs[transform]['tumor'].values() if df is not None and not df.empty]
                    if not cv_tumors:
                        response[transform][method]["warning"] = (response[transform][method]["warning"] or "") + f" No valid tumor data for CV computation with {method} normalization"
                        continue
                    avg_cv_tumor = pd.concat(cv_tumors, axis=1).mean(axis=1)
                    # Use tumor CV only if no normal data is available
                    score = avg_cv_tumor
                    if has_normal_data:
                        cv_normals = [METRIC_FUNCS_GENE['cv'](df) for df in all_dfs[transform]['normal'].values() if df is not None and not df.empty]
                        if cv_normals:
                            score = np.log2((avg_cv_tumor + 1e-8) / (pd.concat(cv_normals, axis=1).mean(axis=1) + 1e-8))
                    selected_genes = pd.DataFrame({'gene': avg_cv_tumor.index, 'score': score}).sort_values(by='score', ascending=False)['gene'].head(15).tolist()

                heatmap_data = {}
                gene_stats = {}
                for gene in selected_genes:
                    gene_stats[gene] = {}
                    for cancer_name in cancer_names:
                        display_name = REVERSE_CANCER_MAPPING.get(cancer_name, cancer_name)
                        tumor_df = all_dfs[transform]['tumor'].get(cancer_name)
                        normal_df = all_dfs[transform]['normal'].get(cancer_name)
                        tumor_mean = tumor_df.loc[gene].mean() if tumor_df is not None and gene in tumor_df.index else 0.0
                        normal_mean = normal_df.loc[gene].mean() if normal_df is not None and gene in normal_df.index else 0.0
                        tumor_cv = METRIC_FUNCS_GENE['cv'](tumor_df)[gene] if tumor_df is not None and gene in tumor_df.index else 0.0
                        normal_cv = METRIC_FUNCS_GENE['cv'](normal_df)[gene] if normal_df is not None and gene in normal_df.index else 0.0
                        heatmap_data.setdefault(gene, {})[f"{cancer_name} Tumor"] = float(tumor_mean)
                        heatmap_data[gene][f"{cancer_name} Normal"] = float(normal_mean)
                        gene_stats[gene][display_name] = {
                            "mean_tumor": float(tumor_mean), "mean_normal": float(normal_mean),
                            "cv_tumor": float(tumor_cv), "cv_normal": float(normal_cv), "logfc": float(tumor_cv - normal_cv)
                        }

                enrichment_results = []
                for gene_set in ["KEGG_2021_Human", "GO_Biological_Process_2021"]:
                    try:
                        enr = enrichr(gene_list=selected_genes, gene_sets=gene_set, organism="Human", outdir=None, cutoff=0.05)
                        if not enr.results.empty:
                            results = enr.results[["Term", "P-value", "Overlap", "Adjusted P-value", "Odds Ratio", "Combined Score", "Genes"]].head(10).to_dict(orient="records")
                            for res in results:
                                res["Genes"] = res["Genes"].split(";") if isinstance(res["Genes"], str) else []
                                res["GeneSet"] = gene_set
                            enrichment_results.extend(results)
                        else:
                            logger.warning(f"No enrichment results for {gene_set} with {method} ({transform})")
                    except Exception as e:
                        logger.warning(f"Failed to run ORA with {gene_set} for {method} ({transform}): {e}")

                response[transform][method].update({
                    "enrichment": enrichment_results, "top_genes": selected_genes,
                    "gene_stats": gene_stats, "heatmap_data": heatmap_data
                })
                if not enrichment_results:
                    response[transform][method]["warning"] = (response[transform][method]["warning"] or "") + f" No pathways found for {method} normalization ({transform})"

            return method, response['raw'][method], response['log2'][method]

        with ThreadPoolExecutor(max_workers=MAX_WORKERS) as executor:
            for method, raw_response, log2_response in executor.map(process_pathway_method, DATA_TYPES):
                response['raw'][method] = raw_response
                response['log2'][method] = log2_response

        if not any(response[transform][method]["enrichment"] or response[transform][method]["top_genes"] for transform in response for method in DATA_TYPES):
            return jsonify({
                "error": "No valid data or pathways found for any normalization method",
                "hint": "Ensure gene symbols are uppercase, match available data, and verify that tumor data files exist for the specified cancer types"
            }), 500
        return jsonify(response)
    except Exception as e:
        logger.error(f"Pathway analysis failed: {e}\n{format_exc()}")
        return jsonify({
            "error": f"Internal server error: {str(e)}",
            "hint": "Ensure gene symbols are uppercase, match available data, and verify that tumor data files exist"
        }), 500

@app.route('/api/csv-upload', methods=['POST'])
def csv_upload():
    try:
        analysis_type = request.form.get('analysis_type', 'Pathway')
        top_n = int(request.form.get('top_n', 15))
        gene_set = request.form.get('gene_set', 'KEGG_2021_Human') if analysis_type == 'Pathway' else None
        genes = [g.strip().upper() for g in request.form.get('genes', '').split(',') if g.strip()]
        logger.info(f"Input: analysis_type={analysis_type}, top_n={top_n}, gene_set={gene_set}, genes={genes}")

        if analysis_type not in ['Gene', 'Pathway', 'Tumor']:
            return jsonify({"error": f"Invalid analysis type: {analysis_type}"}), 400

        if analysis_type in ['Gene', 'Pathway'] and not genes and 'expression_file' not in request.files:
            return jsonify({"error": "Gene or Pathway Analysis requires a gene list or expression data"}), 400

        response = {
            "analysis_type": analysis_type,
            "raw": {"warning": "Differential noise analysis (e.g., logFC) is not possible"},
            "log2": {"warning": "Differential noise analysis (e.g., logFC) is not possible"}
        } if analysis_type != 'Tumor' else {"analysis_type": analysis_type, "log2": {"warning": ""}}

        df_raw = None
        df_log2 = None
        if 'expression_file' in request.files:
            expression_file = request.files['expression_file']
            if not expression_file.filename or not expression_file.filename.endswith(('.csv', '.tsv')):
                return jsonify({"error": "Expression file must be CSV or TSV"}), 400

            try:
                df_raw = pd.read_csv(expression_file, delimiter=',' if expression_file.filename.endswith('.csv') else '\t')
                if df_raw.empty:
                    return jsonify({"error": "Uploaded file is empty"}), 400
                if not {'Hugo_Symbol', 'gene_name'}.intersection(df_raw.columns):
                    return jsonify({"error": "Expression file must contain 'Hugo_Symbol' or 'gene_name' column"}), 400
                if df_raw.shape[1] < 2:
                    return jsonify({"error": "Expression file must contain at least one sample column besides gene identifiers"}), 400

                gene_column = 'gene_name' if 'gene_name' in df_raw.columns else 'Hugo_Symbol'
                df_raw[gene_column] = df_raw[gene_column].astype(str).str.upper()
                if df_raw[gene_column].duplicated().any():
                    logger.warning(f"Duplicate gene names found in uploaded file, dropping duplicates")
                    df_raw = df_raw[~df_raw[gene_column].duplicated(keep='first')]
                df_raw = df_raw.set_index(gene_column).drop(columns=['gene_id', 'Entrez_Gene_Id'], errors='ignore')
                df_raw = df_raw.apply(pd.to_numeric, errors='coerce')
                if df_raw.isna().all().all():
                    return jsonify({"error": "No valid numeric data in uploaded file"}), 400
                df_raw = df_raw.fillna(df_raw.median(numeric_only=True))
                df_log2 = np.log2(df_raw + 1)
            except pd.errors.ParserError:
                return jsonify({"error": "Invalid file format: Unable to parse CSV/TSV"}), 400
            except Exception as e:
                logger.error(f"Failed to process uploaded file: {e}")
                return jsonify({"error": f"Error processing file: {str(e)}"}), 400

        if analysis_type == 'Gene':
            for transform, df in [('raw', df_raw), ('log2', df_log2)]:
                if df is not None:
                    top_genes = [g for g in (genes or df.index.tolist()) if g in df.index]
                    if not top_genes:
                        return jsonify({"error": f"None of the provided genes found in {transform} expression data"}), 400
                    df = df.loc[top_genes]
                    metrics = {name: func(df).to_dict() for name, func in METRIC_FUNCS_GENE.items()}
                else:
                    if not genes:
                        return jsonify({"error": "Gene Analysis requires a gene list or expression data"}), 400
                    top_genes = genes
                    metrics = {name: {gene: 0.0 for gene in top_genes} for name in METRIC_FUNCS_GENE}
                response[transform].update({"metrics": metrics, "top_genes": top_genes})

        elif analysis_type == 'Pathway':
            for transform, df in [('raw', df_raw), ('log2', df_log2)]:
                if df is not None:
                    top_genes = [g for g in (genes or df.index.tolist()) if g in df.index]
                    if not top_genes:
                        return jsonify({"error": f"None of the provided genes found in {transform} expression data"}), 400
                    df = df.loc[top_genes]
                    cv_values = METRIC_FUNCS_GENE['cv'](df)
                    heatmap_data = {gene: {"mean": float(df.loc[gene].mean()), "cv": float(cv_values.get(gene, 0.0))} for gene in top_genes}
                else:
                    if not genes:
                        return jsonify({"error": "Pathway Analysis requires a gene list or expression data"}), 400
                    top_genes = genes
                    heatmap_data = {gene: {"mean": 0.0, "cv": 0.0} for gene in top_genes}

                enrichment_results = []
                try:
                    enr = enrichr(gene_list=top_genes, gene_sets=gene_set, organism="Human", outdir=None, cutoff=0.05)
                    if not enr.results.empty:
                        results = enr.results[["Term", "P-value", "Adjusted P-value", "Odds Ratio", "Combined Score", "Genes"]].head(top_n).to_dict(orient="records")
                        for res in results:
                            res["Genes"] = res["Genes"].split(";") if isinstance(res["Genes"], str) else []
                            res["GeneSet"] = gene_set
                        enrichment_results.extend(results)
                    else:
                        logger.warning(f"No enrichment results for {gene_set} in {transform}")
                except Exception as e:
                    logger.error(f"Failed to run ORA with {gene_set} for {transform}: {e}")

                response[transform].update({
                    "enrichment": enrichment_results, "top_genes": top_genes, "heatmap_data": heatmap_data
                })

        elif analysis_type == 'Tumor':
            if df_log2 is None:
                return jsonify({"error": "Tumor Analysis requires an expression data file"}), 400
            metrics = []
            samples = df_log2.columns
            sample_dicts = {sample: {"sample": sample} for sample in samples}
            for metric_name, func in METRIC_FUNCS_TH.items():
                try:
                    metric_series = func(df_log2)
                    for sample in samples:
                        sample_dicts[sample][metric_name] = float(metric_series.get(sample, 0.0))
                except Exception as e:
                    logger.error(f"Failed to compute {metric_name}: {e}")
                    for sample in samples:
                        sample_dicts[sample][metric_name] = 0.0
            metrics = list(sample_dicts.values())
            response["log2"]["metrics"] = metrics

        logger.info(f"CSV upload response generated for {analysis_type} analysis")
        return jsonify(response)

    except Exception as e:
        logger.error(f"CSV upload failed: {e}")
        return jsonify({"error": f"Internal server error: {str(e)}"}), 500

if __name__ == '__main__':
    app.run(debug=False, host='0.0.0.0', port=5001, threaded=True)
# import os
# import pandas as pd
# import numpy as np
# from flask import Flask, request, jsonify
# from flask_cors import CORS
# from cv import cv_calculation
# from std import std_calculation
# from MAD import mad_calculation
# from DEPTH2 import depth2_calculation
# from DEPTH_ITH import depth_calculation
# from cv_2 import cv2_calculation
# from mean import mean_calculation
# from gseapy import enrichr
# from functools import lru_cache
# from concurrent.futures import ThreadPoolExecutor
# import logging

# # Configure logging
# logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
# logger = logging.getLogger(__name__)

# # Initialize Flask App
# app = Flask(__name__)
# CORS(app, resources={r"/api/*": {
#     "origins": ["http://localhost:8081", "https://tcna.lums.edu.pk/"],
#     "methods": ["GET", "POST", "OPTIONS"],
#     "allow_headers": ["Content-Type", "Authorization"],
#     "supports_credentials": True
# }})

# # Configuration
# BASE_DIR = "../data/raw"
# DATA_TYPES = ["tpm", "fpkm", "fpkm_uq"]
# MAX_WORKERS = 7

# # Metric functions
# METRIC_FUNCS_TH = {"DEPTH2": depth2_calculation, "tITH": depth_calculation}
# METRIC_FUNCS_GENE = {
#     "cv": cv_calculation, "cv_squared": cv2_calculation,
#     "std": std_calculation, "mad": mad_calculation, "mean": mean_calculation
# }
# CANCER_MAPPING = {
#     "liver and bile duct": "liver", "breast": "breast", "bladder": "bladder",
#     "colorectal": "colon", "uterus": "uterus", "lung": "lung", "kidney": "kidney",
#     "rectum": "rectum", "stomach": "stomach", "brain and nervous system": "brain",
#     "thymus": "thymus", "cervix": "cervix", "adrenal gland": "adrenal",
#     "head and neck": "headandneck", "esophagus": "esophagus", "prostate": "prostate",
#     "thyroid": "thyroid", "pancreas": "pancreas", "testis": "testis",
#     "lymph nodes": "lymph", "heart and pleura": "heart", "ovary": "ovary",
#     "skin": "skin", "eye and adnexa": "eye", "bone marrow and blood": "blood",
#     "soft tissue": "soft tissue"
# }
# REVERSE_CANCER_MAPPING = {v: k for k, v in CANCER_MAPPING.items()}

# @lru_cache(maxsize=100)
# def load_expression_file(cancer_name, dtype, input_dir, cond):
#     try:
#         files = {
#             'tumor': os.path.join(input_dir, cancer_name, f"tumor_{dtype}.csv.gz"),
#             'normal': os.path.join(input_dir, cancer_name, f"normal_{dtype}.csv.gz")
#         }
#         result = {'raw': {}, 'log2': {}}
        
#         for key, filepath in files.items():
#             if os.path.exists(filepath):
#                 df = pd.read_csv(filepath, index_col=0)
#                 logger.info(f"Loaded {key} file: {filepath}, shape: {df.shape}")
                
#                 if cond == 'pathway':
#                     if 'gene_name' in df.columns:
#                         df['gene_name'] = df['gene_name'].astype(str)
#                         df = df.set_index('gene_name')
#                     df = df.drop(columns=['gene_id'], errors='ignore')
#                 else:
#                     df = df.drop(columns=['gene_name', 'Hugo_Symbol'], errors='ignore')
                
#                 df = df.apply(pd.to_numeric, errors='coerce').fillna(df.median(numeric_only=True))
#                 result['raw'][key] = df
#                 result['log2'][key] = np.log2(df + 1)
#             else:
#                 result['raw'][key] = None
#                 result['log2'][key] = None
                
#         return result
#     except Exception as e:
#         logger.error(f"Failed to load files for {cancer_name}, {dtype}: {e}")
#         return {'raw': {'tumor': None, 'normal': None}, 'log2': {'tumor': None, 'normal': None}}

# def compute_metrics(cancer_names, input_dir, metric_funcs, condition, genes=None, sample_ids=None):
#     if not isinstance(cancer_names, list):
#         cancer_names = [cancer_names]

#     def process_cancer(cancer_name):
#         expr_dfs = {dtype: load_expression_file(cancer_name, dtype, input_dir, condition) for dtype in DATA_TYPES}
#         if not any(expr_dfs[dtype]['raw']['tumor'] is not None or expr_dfs[dtype]['raw']['normal'] is not None
#                    for dtype in DATA_TYPES):
#             logger.warning(f"No expression data loaded for {cancer_name}")
#             return cancer_name, None

#         result = {}
#         if condition == "gene" and genes:
#             genes_upper = [g.upper() for g in genes]
#             for dtype in DATA_TYPES:
#                 result[dtype] = {'raw': {}, 'log2': {}}
#                 for transform in ['raw', 'log2']:
#                     tumor_df, normal_df = expr_dfs[dtype][transform]['tumor'], expr_dfs[dtype][transform]['normal']
#                     valid_genes = [g for g in genes_upper if (tumor_df is not None and g in tumor_df.index) or
#                                   (normal_df is not None and g in normal_df.index)]
#                     if not valid_genes:
#                         continue
                    
#                     tumor_df = tumor_df.loc[valid_genes] if tumor_df is not None else pd.DataFrame(index=valid_genes)
#                     normal_df = normal_df.loc[valid_genes] if normal_df is not None else pd.DataFrame(index=valid_genes)
                    
#                     dtype_result = {}
#                     for gene in valid_genes:
#                         dtype_result[gene] = {}
#                         for metric_name, func in metric_funcs.items():
#                             try:
#                                 tumor_metric = func(tumor_df)[gene] if tumor_df is not None and not tumor_df.empty else 0
#                                 normal_metric = func(normal_df)[gene] if normal_df is not None and not normal_df.empty else 0
#                                 dtype_result[gene][f"{metric_name}_tumor"] = float(tumor_metric)
#                                 dtype_result[gene][f"{metric_name}_normal"] = float(normal_metric)
#                                 if metric_name == "cv":
#                                     dtype_result[gene]["logfc"] = float(tumor_metric - normal_metric) if normal_metric != 0 else 0
#                             except Exception as e:
#                                 logger.error(f"Error computing {metric_name} for {cancer_name}, {dtype}, gene {gene}: {e}")
#                                 dtype_result[gene][f"{metric_name}_tumor"] = 0.0
#                                 dtype_result[gene][f"{metric_name}_normal"] = 0.0
#                                 if metric_name == "cv":
#                                     dtype_result[gene]["logfc"] = 0.0
#                     result[dtype][transform] = dtype_result
#         elif condition == "tumor":
#             sample_ids_set = set()
#             for dtype in DATA_TYPES:
#                 if expr_dfs[dtype]['log2']['tumor'] is not None:
#                     sample_ids_set.update(expr_dfs[dtype]['log2']['tumor'].columns)
#             sample_ids_set = sorted(sample_ids_set)
#             if not sample_ids_set:
#                 logger.warning(f"No valid sample IDs for {cancer_name}")
#                 return cancer_name, None

#             metric_results = {}
#             for metric_name, func in metric_funcs.items():
#                 metric_data = {}
#                 for dtype in DATA_TYPES:
#                     tumor_df = expr_dfs[dtype]['log2']['tumor']
#                     normal_df = expr_dfs[dtype]['log2']['normal']
#                     if tumor_df is None:
#                         metric_data[dtype] = [0] * len(sample_ids_set)
#                         continue
#                     try:
#                         tumor_df = tumor_df[sample_ids_set]
#                         metric_series = func(tumor_df, normal_df) if metric_name == "tITH" else func(tumor_df)
#                         metric_data[dtype] = metric_series.reindex(sample_ids_set, fill_value=0).tolist()
#                     except Exception as e:
#                         logger.error(f"Error computing {metric_name} for {dtype}: {e}")
#                         metric_data[dtype] = [0] * len(sample_ids_set)

#                 # metric_results[metric_name] = [
#                 #     {"sample_id": sid, dtype: metric_data[dtype][i] for dtype in DATA_TYPES}
#                 #     for i, sid in enumerate(sample_ids_set)
#                 # ]
#                 metric_results[metric_name] = [
#                     {"sample_id": sid, **{dtype: metric_data[dtype][i] for dtype in DATA_TYPES}}
#                     for i, sid in enumerate(sample_ids_set)
#                 ]
#             return cancer_name, metric_results
#         return cancer_name, result or None

#     with ThreadPoolExecutor(max_workers=MAX_WORKERS) as executor:
#         results = dict(executor.map(process_cancer, cancer_names))
#     return results or None

# @app.route('/api/gene_noise', methods=['GET'])
# def gene_noise():
#     cancers = request.args.getlist('cancer')
#     metrics = request.args.getlist('metric')
#     gene_ensembl_ids = [g.strip().upper() for g in request.args.get('gene_ensembl_id', '').split(',') if g.strip()]
#     logger.info(f"Request: cancers={cancers}, metrics={metrics}, gene_ensembl_ids={gene_ensembl_ids}")

#     if not (cancers and gene_ensembl_ids):
#         return jsonify({"error": "Missing parameters (cancer or gene_ensembl_id)"}), 400

#     metric_mapping = {
#         "CV": "cv", "Mean": "mean", "Standard Deviation": "std",
#         "MAD": "mad", "CV²": "cv_squared", "Differential Noise": "logfc"
#     }
#     api_metrics = [metric_mapping.get(m, m) for m in metrics if metric_mapping.get(m, m)]
#     if not api_metrics or api_metrics == ["logfc"]:
#         api_metrics = list(METRIC_FUNCS_GENE.keys()) + ["logfc"]
#     elif "logfc" in api_metrics and "cv" not in api_metrics:
#         api_metrics.append("cv")
#     api_metrics = list(set(api_metrics))

#     invalid_metrics = [m for m in api_metrics if m not in METRIC_FUNCS_GENE and m != "logfc"]
#     if invalid_metrics:
#         return jsonify({"error": f"Unsupported metric: {','.join(invalid_metrics)}"}), 400

#     cancer_names = [CANCER_MAPPING.get(c.lower(), c.lower()) for c in cancers]
#     invalid_cancers = [c for c in cancers if CANCER_MAPPING.get(c.lower(), c.lower()) not in cancer_names]
#     if invalid_cancers:
#         return jsonify({"error": f"Unsupported cancer names: {','.join(invalid_cancers)}"}), 400

#     try:
#         requested_metrics = {m: METRIC_FUNCS_GENE[m] for m in api_metrics if m in METRIC_FUNCS_GENE}
#         results = compute_metrics(cancer_names, BASE_DIR, requested_metrics, "gene", gene_ensembl_ids)
#         if not results:
#             return jsonify({"error": "Metric computation failed or no data"}), 500

#         transformed_results = {'raw': {dtype: {} for dtype in DATA_TYPES}, 'log2': {dtype: {} for dtype in DATA_TYPES}}
#         for dtype in DATA_TYPES:
#             for cancer_name in cancer_names:
#                 if cancer_name in results and results[cancer_name]:
#                     for transform in ['raw', 'log2']:
#                         if dtype in results[cancer_name] and results[cancer_name][dtype][transform]:
#                             for gene, metrics in results[cancer_name][dtype][transform].items():
#                                 transformed_results[transform][dtype].setdefault(gene, {})[cancer_name] = metrics

#         logger.info(f"Gene noise results computed for {len(cancer_names)} cancers")
#         return jsonify(transformed_results)
#     except Exception as e:
#         logger.error(f"Error in gene_noise: {str(e)}")
#         return jsonify({"error": f"Internal error: {str(e)}"}), 500

# @app.route('/api/TH-metrics', methods=['GET'])
# def TH_metrics():
#     cancer = request.args.get('cancer')
#     method = request.args.get('method')
#     metric = request.args.get('metric')
#     logger.info(f"Received request: cancer={cancer}, method={method}, metric={metric}")

#     if not all([cancer, method, metric]):
#         return jsonify({"error": "Missing parameters"}), 400

#     cancer_name = CANCER_MAPPING.get(cancer.lower(), cancer.lower())
#     if not cancer_name or metric not in METRIC_FUNCS_TH:
#         return jsonify({"error": f"Unsupported {'cancer name' if not cancer_name else 'metric'}: {cancer if not cancer_name else metric}"}), 400

#     try:
#         results = compute_metrics([cancer_name], BASE_DIR, {metric: METRIC_FUNCS_TH[metric]}, "tumor")
#         if not results or not results.get(cancer_name) or metric not in results[cancer_name]:
#             return jsonify({"error": "Metric computation failed or no data"}), 500

#         transformed_results = [
#             {'sample_id': sample['sample_id'], method: sample[method]}
#             for sample in results[cancer_name][metric]
#         ]
#         return jsonify({'log2': {method: transformed_results}})
#     except FileNotFoundError as e:
#         return jsonify({"error": f"Missing data file: {str(e)}"}), 404
#     except Exception as e:
#         logger.error(f"Error in TH-metrics: {str(e)}")
#         return jsonify({"error": f"Internal error: {str(e)}"}), 500

# @app.route('/api/pathway-analysis', methods=['GET'])
# def pathway_analysis():
#     try:
#         cancer = [c.strip() for c in request.args.get('cancer', '').split(',') if c.strip()]
#         genes = [g.strip().upper() for g in request.args.get("genes", "").split(',') if g.strip()]
#         logger.info(f"Request: cancer={cancer}, genes={genes}")

#         if not cancer:
#             return jsonify({"error": "Missing required parameter: cancer"}), 400

#         cancer_names = [CANCER_MAPPING.get(c.lower(), c.lower()) for c in cancer]
#         invalid_cancers = [c for c in cancer if CANCER_MAPPING.get(c.lower(), c.lower()) not in cancer_names]
#         if invalid_cancers:
#             return jsonify({"error": f"Unsupported cancer names: {','.join(invalid_cancers)}"}), 400

#         response = {'raw': {method: {"enrichment": [], "top_genes": [], "gene_stats": {}, "heatmap_data": {}, "warning": None} for method in DATA_TYPES},
#                     'log2': {method: {"enrichment": [], "top_genes": [], "gene_stats": {}, "heatmap_data": {}, "warning": None} for method in DATA_TYPES}}

#         def process_pathway_method(method):
#             all_dfs = {'raw': {'tumor': {}, 'normal': {}}, 'log2': {'tumor': {}, 'normal': {}}}
#             for cancer_name in cancer_names:
#                 data = load_expression_file(cancer_name, method, BASE_DIR, "pathway")
#                 for transform in ['raw', 'log2']:
#                     all_dfs[transform]['tumor'][cancer_name] = data[transform]['tumor']
#                     all_dfs[transform]['normal'][cancer_name] = data[transform]['normal']

#             for transform in ['raw', 'log2']:
#                 if not all_dfs[transform]['tumor']:
#                     response[transform][method]["warning"] = f"No tumor expression data found for {method} normalization"
#                     continue

#                 library_genes = set().union(*[df.index for df in all_dfs[transform]['tumor'].values()])
#                 if all_dfs[transform]['normal']:
#                     library_genes.intersection_update(*[df.index for df in all_dfs[transform]['normal'].values()])

#                 selected_genes = [g for g in genes if g in library_genes] if genes else []
#                 if not selected_genes:
#                     cv_tumors = [METRIC_FUNCS_GENE['cv'](df) for df in all_dfs[transform]['tumor'].values() if df is not None and not df.empty]
#                     if not cv_tumors:
#                         response[transform][method]["warning"] = f"No valid tumor data for CV computation with {method} normalization"
#                         continue
#                     avg_cv_tumor = pd.concat(cv_tumors, axis=1).mean(axis=1)
#                     cv_normals = [METRIC_FUNCS_GENE['cv'](df) for df in all_dfs[transform]['normal'].values() if df is not None and not df.empty]
#                     score = np.log2((avg_cv_tumor + 1e-8) / (pd.concat(cv_normals, axis=1).mean(axis=1) + 1e-8) if cv_normals else avg_cv_tumor)
#                     selected_genes = pd.DataFrame({'gene': avg_cv_tumor.index, 'score': score}).sort_values(by='score', ascending=False)['gene'].tolist()

#                 heatmap_data = {}
#                 gene_stats = {}
#                 for gene in selected_genes:
#                     gene_stats[gene] = {}
#                     for cancer_name in cancer_names:
#                         display_name = REVERSE_CANCER_MAPPING.get(cancer_name, cancer_name)
#                         tumor_df = all_dfs[transform]['tumor'].get(cancer_name)
#                         normal_df = all_dfs[transform]['normal'].get(cancer_name)
#                         tumor_mean = tumor_df.loc[gene].mean() if tumor_df is not None and gene in tumor_df.index else 0.0
#                         normal_mean = normal_df.loc[gene].mean() if normal_df is not None and gene in normal_df.index else 0.0
#                         tumor_cv = METRIC_FUNCS_GENE['cv'](tumor_df)[gene] if tumor_df is not None and gene in tumor_df.index else 0.0
#                         normal_cv = METRIC_FUNCS_GENE['cv'](normal_df)[gene] if normal_df is not None and gene in normal_df.index else 0.0
#                         heatmap_data.setdefault(gene, {})[f"{cancer_name} Tumor"] = float(tumor_mean)
#                         heatmap_data[gene][f"{cancer_name} Normal"] = float(normal_mean)
#                         gene_stats[gene][display_name] = {
#                             "mean_tumor": float(tumor_mean), "mean_normal": float(normal_mean),
#                             "cv_tumor": float(tumor_cv), "cv_normal": float(normal_cv), "logfc": float(tumor_cv - normal_cv)
#                         }

#                 enrichment_results = []
#                 for gene_set in ["KEGG_2021_Human", "GO_Biological_Process_2021"]:
#                     try:
#                         enr = enrichr(gene_list=selected_genes, gene_sets=gene_set, organism="Human", outdir=None, cutoff=0.05)
#                         if not enr.results.empty:
#                             results = enr.results[["Term", "P-value", "Overlap", "Adjusted P-value", "Odds Ratio", "Combined Score", "Genes"]].head(10).to_dict(orient="records")
#                             for res in results:
#                                 res["Genes"] = res["Genes"].split(";") if isinstance(res["Genes"], str) else []
#                                 res["GeneSet"] = gene_set
#                             enrichment_results.extend(results)
#                     except Exception as e:
#                         logger.warning(f"Failed to run ORA with {gene_set} for {method} ({transform}): {e}")

#                 response[transform][method].update({
#                     "enrichment": enrichment_results, "top_genes": selected_genes,
#                     "gene_stats": gene_stats, "heatmap_data": heatmap_data
#                 })
#                 if not enrichment_results:
#                     response[transform][method]["warning"] = f"No pathways found for {method} normalization ({transform})"
#                 if any(df is None for df in all_dfs[transform]['normal'].values()):
#                     response[transform][method]["warning"] = (response[transform][method]["warning"] or "") + f" Normal data missing for some cancer types with {method} normalization"

#             return method, response['raw'][method], response['log2'][method]

#         with ThreadPoolExecutor(max_workers=MAX_WORKERS) as executor:
#             for method, raw_response, log2_response in executor.map(process_pathway_method, DATA_TYPES):
#                 response['raw'][method] = raw_response
#                 response['log2'][method] = log2_response

#         if not any(response[transform][method]["enrichment"] or response[transform][method]["top_genes"] for transform in response for method in DATA_TYPES):
#             return jsonify({
#                 "error": "No valid data or pathways found for any normalization method",
#                 "hint": "Ensure gene symbols are uppercase and match KEGG_2021_Human or GO_Biological_Process_2021 identifiers"
#             }), 500
#         return jsonify(response)
#     except Exception as e:
#         logger.error(f"Pathway analysis failed: {e}")
#         return jsonify({"error": f"Internal server error: {str(e)}", "hint": "Ensure gene symbols are uppercase and match KEGG_2021_Human or GO_Biological_Process_2021 identifiers"}), 500

# @app.route('/api/csv-upload', methods=['POST'])
# def csv_upload():
#     try:
#         analysis_type = request.form.get('analysis_type', 'Pathway')
#         top_n = int(request.form.get('top_n', 15))
#         gene_set = request.form.get('gene_set', 'KEGG_2021_Human') if analysis_type == 'Pathway' else None
#         genes = [g.strip().upper() for g in request.form.get('genes', '').split(',') if g.strip()]
#         logger.info(f"Input: analysis_type={analysis_type}, top_n={top_n}, gene_set={gene_set}, genes={genes}")

#         if analysis_type not in ['Gene', 'Pathway', 'Tumor']:
#             return jsonify({"error": f"Invalid analysis type: {analysis_type}"}), 400

#         if analysis_type in ['Gene', 'Pathway'] and not genes and 'expression_file' not in request.files:
#             return jsonify({"error": "Gene or Pathway Analysis requires a gene list or expression data"}), 400

#         response = {
#             "analysis_type": analysis_type,
#             "raw": {"warning": "Differential noise analysis (e.g., logFC) is not possible"},
#             "log2": {"warning": "Differential noise analysis (e.g., logFC) is not possible"}
#         } if analysis_type != 'Tumor' else {"analysis_type": analysis_type, "log2": {"warning": ""}}

#         df_raw = None
#         df_log2 = None
#         if 'expression_file' in request.files:
#             expression_file = request.files['expression_file']
#             if not expression_file.filename or not expression_file.filename.endswith(('.csv', '.tsv')):
#                 return jsonify({"error": "Expression file must be CSV or TSV"}), 400

#             df_raw = pd.read_csv(expression_file, delimiter=',' if expression_file.filename.endswith('.csv') else '\t')
#             if not {'Hugo_Symbol', 'gene_name'}.intersection(df_raw.columns):
#                 return jsonify({"error": "Expression file must contain 'Hugo_Symbol' or 'gene_name' column"}), 400

#             gene_column = 'gene_name' if 'gene_name' in df_raw.columns else 'Hugo_Symbol'
#             df_raw[gene_column] = df_raw[gene_column].astype(str).str.upper()
#             df_raw = df_raw.set_index(gene_column).drop(columns=['gene_id', 'Entrez_Gene_Id'], errors='ignore')
#             df_raw = df_raw.apply(pd.to_numeric, errors='coerce').fillna(df_raw.median(numeric_only=True))
#             df_log2 = np.log2(df_raw + 1)

#         if analysis_type == 'Gene':
#             for transform, df in [('raw', df_raw), ('log2', df_log2)]:
#                 if df is not None:
#                     top_genes = [g for g in (genes or df.index.tolist()) if g in df.index]
#                     if not top_genes:
#                         return jsonify({"error": f"None of the provided genes found in {transform} expression data"}), 400
#                     df = df.loc[top_genes]
#                     metrics = {name: func(df).to_dict() for name, func in METRIC_FUNCS_GENE.items()}
#                 else:
#                     if not genes:
#                         return jsonify({"error": "Gene Analysis requires a gene list or expression data"}), 400
#                     top_genes = genes
#                     metrics = {name: {gene: 0.0 for gene in top_genes} for name in METRIC_FUNCS_GENE}
#                 response[transform].update({"metrics": metrics, "top_genes": top_genes})

#         elif analysis_type == 'Pathway':
#             for transform, df in [('raw', df_raw), ('log2', df_log2)]:
#                 if df is not None:
#                     top_genes = [g for g in (genes or df.index.tolist()) if g in df.index]
#                     if not top_genes:
#                         return jsonify({"error": f"None of the provided genes found in {transform} expression data"}), 400
#                     df = df.loc[top_genes]
#                     cv_values = METRIC_FUNCS_GENE['cv'](df)
#                     heatmap_data = {gene: {"mean": float(df.loc[gene].mean()), "cv": float(cv_values.get(gene, 0.0))} for gene in top_genes}
#                 else:
#                     if not genes:
#                         return jsonify({"error": "Pathway Analysis requires a gene list or expression data"}), 400
#                     top_genes = genes
#                     heatmap_data = {gene: {"mean": 0.0, "cv": 0.0} for gene in top_genes}

#                 enrichment_results = []
#                 try:
#                     enr = enrichr(gene_list=top_genes, gene_sets=gene_set, organism="Human", outdir=None, cutoff=0.05)
#                     if not enr.results.empty:
#                         results = enr.results[["Term", "P-value", "Adjusted P-value", "Odds Ratio", "Combined Score", "Genes"]].head(top_n).to_dict(orient="records")
#                         for res in results:
#                             res["Genes"] = res["Genes"].split(";") if isinstance(res["Genes"], str) else []
#                             res["GeneSet"] = gene_set
#                         enrichment_results.extend(results)
#                 except Exception as e:
#                     logger.error(f"Failed to run ORA with {gene_set} for {transform}: {e}")

#                 response[transform].update({
#                     "enrichment": enrichment_results, "top_genes": top_genes, "heatmap_data": heatmap_data
#                 })

#         # elif analysis_type == 'Tumor':
#         #     if df_log2 is None:
#         #         return jsonify({"error": "Tumor Analysis requires an expression data file"}), 400
#         #     metrics = []
#         #     for metric_name, func in METRIC_FUNCS_TH.items():
#         #         try:
#         #             metric_series = func(df_log2)
#         #             for sample in df_log2.columns:
#         #                 metrics.append({"sample": sample, metric_name: float(metric_series.get(sample, 0.0))})
#         #         except Exception as e:
#         #             logger.error(f"Failed to compute {metric_name}: {e}")
#         #             metrics.extend({"sample": sample, metric_name: 0.0} for sample in df_log2.columns)
#         #     response["log2"]["metrics"] = metrics

#         # logger.info(f"CSV upload response generated for {analysis_type} analysis")
#         # print(response)
#         # return jsonify(response)
#         # elif analysis_type == 'Tumor':
#         #     if df_log2 is None:
#         #         return jsonify({"error": "Tumor Analysis requires an expression data file"}), 400
#         #     all_metrics = {}
#         #     for metric_name, func in METRIC_FUNCS_TH.items():
#         #         try:
#         #             metric_series = func(df_log2)  # Compute across all samples
#         #             all_metrics[metric_name] = metric_series
#         #         except Exception as e:
#         #             logger.error(f"Failed to compute {metric_name}: {e}")
#         #             all_metrics[metric_name] = pd.Series(0.0, index=df_log2.columns)

#         #     metrics = []
#         #     for sample in df_log2.columns:
#         #         sample_metrics = {"sample": sample}
#         #         for metric_name, metric_series in all_metrics.items():
#         #             val = metric_series.get(sample, 0.0)
#         #             sample_metrics[metric_name] = float(val) if pd.notna(val) else 0.0
#         #         metrics.append(sample_metrics)
#         #     response["log2"]["metrics"] = metrics

#         # logger.info(f"CSV upload response generated for {analysis_type} analysis")
#         # print(response)
#         # return jsonify(response)
#         elif analysis_type == 'Tumor':
#             if df_log2 is None:
#                 return jsonify({"error": "Tumor Analysis requires an expression data file"}), 400

#             metrics = []
#             samples = df_log2.columns

#         # initialize dict for each sample
#             sample_dicts = {sample: {"sample": sample} for sample in samples}

#             for metric_name, func in METRIC_FUNCS_TH.items():
#                 try:
#                     metric_series = func(df_log2)
#                     for sample in samples:
#                         sample_dicts[sample][metric_name] = float(metric_series.get(sample, 0.0))
#                 except Exception as e:
#                     logger.error(f"Failed to compute {metric_name}: {e}")
#                     for sample in samples:
#                         sample_dicts[sample][metric_name] = 0.0

#             # convert dict of dicts → list of dicts
#             metrics = list(sample_dicts.values())

#             response["log2"]["metrics"] = metrics

#             logger.info(f"CSV upload response generated for {analysis_type} analysis")
#         return jsonify(response)

#     except Exception as e:
#         logger.error(f"CSV upload failed: {e}")
#         return jsonify({"error": f"Internal server error: {str(e)}"}), 500

# if __name__ == '__main__':
#     app.run(debug=False, host='0.0.0.0', port=5001, threaded=True)
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
# # from gseapy import enrichr
# # from cv_2 import cv2_calculation
# # from mean import mean_calculation

# # # Initialize Flask App
# # app = Flask(__name__)
# # CORS(app, resources={r"/api/*": {
# #     # "origins": ["http://localhost:8081", "https://tcna.lums.edu.pk"],
# #     # "origins": ["https://tcna.lums.edu.pk"],
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
# #     "uterus": "uterus",
# #     "lung": "lung",
# #     "kidney": "kidney",
# #     "rectum": "rectum",
# #     "stomach": "stomach",
# #     "brain and nervous system": "brain",
# #     "thymus": "thymus",
# #     "cervix": "cervix",
# #     "adrenal gland": "adrenal",
# #     "head and neck": "headandneck",
# #     "esophagus": "esophagus",
# #     "prostate": "prostate",
# #     "thyroid": "thyroid",
# #     "pancreas": "pancreas",
# #     "testis": "testis",
# #     "lymph nodes": "lymph",
# #     "heart and pleura": "heart",
# #     "ovary": "ovary",
# #     "skin": "skin",
# #     "eye and adnexa": "eye",
# #     "bone marrow and blood": "blood",
# #     "soft tissue": "soft tissue"
# # }

# # # Reverse mapping for cancer names
# # reverse_cancer_mapping = {v: k for k, v in cancer_mapping.items()}

# # def load_expression_file(cancer_name, dtype, input_dir, cond):
# #     """
# #     Load tumor and normal expression files for the given cancer and data type.
# #     Returns a tuple of (tumor_df, normal_df) or (None, None) if files are not found.
# #     """
# #     tumor_filename = f"tumor_{dtype}.csv.gz"
# #     normal_filename = f"normal_{dtype}.csv.gz"
# #     tumor_filepath = os.path.join(input_dir, cancer_name, tumor_filename)
# #     normal_filepath = os.path.join(input_dir, cancer_name, normal_filename)
    
# #     tumor_df = None
# #     normal_df = None
    
# #     try:
# #         # Load tumor data
# #         if os.path.exists(tumor_filepath):
# #             tumor_df = pd.read_csv(tumor_filepath, index_col=0)
# #             print(f"[DEBUG] Loaded tumor file: {tumor_filepath}, shape: {tumor_df.shape}")
# #             if cond == 'pathway':
# #                 if 'gene_name' in tumor_df.columns:
# #                     tumor_df['gene_name'] = tumor_df['gene_name'].astype(str)
# #                     tumor_df = tumor_df.set_index('gene_name')
# #                 if 'gene_id' in tumor_df.columns:
# #                     tumor_df = tumor_df.drop(columns=['gene_id'])
# #             else:
# #                 if 'gene_name' in tumor_df.columns:
# #                     tumor_df = tumor_df.drop(columns=['gene_name'])
# #                 if 'Hugo_Symbol' in tumor_df.columns:
# #                     tumor_df = tumor_df.drop(columns=['Hugo_Symbol'])
# #             tumor_df = tumor_df.apply(pd.to_numeric, errors='coerce')
# #             tumor_df = tumor_df.fillna(tumor_df.median())
# #             # tumor_df = np.log2(tumor_df + 1)
# #         else:
# #             print(f"[DEBUG] Tumor file not found: {tumor_filepath}")

# #         # Load normal data
# #         if os.path.exists(normal_filepath):
# #             normal_df = pd.read_csv(normal_filepath, index_col=0)
# #             print(f"[DEBUG] Loaded normal file: {normal_filepath}, shape: {normal_df.shape}")
# #             if cond == 'pathway':
# #                 if 'gene_name' in normal_df.columns:
# #                     normal_df['gene_name'] = normal_df['gene_name'].astype(str)
# #                     normal_df = normal_df.set_index('gene_name')
# #                 if 'gene_id' in normal_df.columns:
# #                     normal_df = normal_df.drop(columns=['gene_id'])
# #             else:
# #                 if 'gene_name' in normal_df.columns:
# #                     normal_df = normal_df.drop(columns=['gene_name'])
# #                 if 'Hugo_Symbol' in normal_df.columns:
# #                     normal_df = normal_df.drop(columns=['Hugo_Symbol'])
# #             normal_df = normal_df.apply(pd.to_numeric, errors='coerce')
# #             normal_df = normal_df.fillna(normal_df.median())
# #             # normal_df = np.log2(normal_df + 1)
# #         else:
# #             print(f"[DEBUG] Normal file not found: {normal_filepath}")

# #         # Only print head if dataframes are not None
# #         if tumor_df is not None:
# #             print(f"[DEBUG] Tumor dataframe head for {cancer_name}:\n{tumor_df.head()}")
# #         if normal_df is not None:
# #             print(f"[DEBUG] Normal dataframe head for {cancer_name}:\n{normal_df.head()}")

# #         if tumor_df is None and normal_df is None:
# #             print(f"[DEBUG] No data loaded for {cancer_name}, {dtype}")
# #             return None, None

# #         return tumor_df, normal_df

# #     except FileNotFoundError as e:
# #         print(f"[ERROR] File not found: {tumor_filepath} or {normal_filepath}")
# #         raise
# #     except Exception as e:
# #         print(f"[ERROR] Failed to load files for {cancer_name}, {dtype}: {e}")
# #         raise

# # def compute_metrics_for_condition(cancer_names, input_dir, metric_funcs, condition, genes=None):
# #     if not isinstance(cancer_names, list):
# #         cancer_names = [cancer_names]

# #     all_results = {}
# #     for cancer_name in cancer_names:
# #         expr_dfs = {}
# #         for dtype in data_types:
# #             try:
# #                 tumor_df, normal_df = load_expression_file(cancer_name, dtype, input_dir, condition)
# #                 if tumor_df is not None or normal_df is not None:
# #                     expr_dfs[dtype] = (tumor_df, normal_df)
# #             except FileNotFoundError:
# #                 print(f"[DEBUG] File not found for {dtype} in {cancer_name}, skipping")
# #                 continue
# #             except Exception as e:
# #                 print(f"[ERROR] Failed to load expression files for {cancer_name}, {dtype}: {e}")
# #                 continue

# #         if not expr_dfs:
# #             print(f"[DEBUG] No expression data loaded for {cancer_name}")
# #             continue

# #         result = {}
# #         if condition == "gene":
# #             if not genes:
# #                 print("[DEBUG] No genes provided")
# #                 continue
# #             genes = [g.upper() for g in genes]
# #             for dtype, (tumor_df, normal_df) in expr_dfs.items():
# #                 dtype_result = {}
# #                 valid_genes = genes
# #                 if tumor_df is not None:
# #                     valid_genes = [gene for gene in valid_genes if gene in tumor_df.index]
# #                 elif normal_df is not None:
# #                     valid_genes = [gene for gene in valid_genes if gene in normal_df.index]
# #                 else:
# #                     print(f"[DEBUG] No valid data for {dtype} in {cancer_name}")
# #                     result[dtype] = {}
# #                     continue
# #                 if not valid_genes:
# #                     print(f"[DEBUG] No valid genes found for {dtype} in {cancer_name}")
# #                     result[dtype] = {}
# #                     continue

# #                 tumor_df = tumor_df.loc[valid_genes] if tumor_df is not None else pd.DataFrame(index=valid_genes)
# #                 normal_df = normal_df.loc[valid_genes] if normal_df is not None else pd.DataFrame(index=valid_genes)

# #                 for gene in valid_genes:
# #                     dtype_result[gene] = {}
# #                     for metric_name, func in metric_funcs.items():
# #                         try:
# #                             tumor_metric = func(tumor_df) if tumor_df is not None and not tumor_df.empty else pd.Series(0, index=valid_genes)
# #                             normal_metric = func(normal_df) if normal_df is not None and not normal_df.empty else pd.Series(0, index=valid_genes)
# #                             dtype_result[gene][f"{metric_name}_tumor"] = float(tumor_metric.get(gene, 0))
# #                             dtype_result[gene][f"{metric_name}_normal"] = float(normal_metric.get(gene, 0))
# #                             if metric_name == "cv" and normal_df is not None and not normal_df.empty and len(normal_df.columns) > 1:
# #                                 cv_t = float(tumor_metric.get(gene, 0))
# #                                 cv_n = float(normal_metric.get(gene, 0))
# #                                 logfc = cv_t - cv_n if cv_n != 0 else 0.0
# #                                 dtype_result[gene]["logfc"] = float(logfc)
# #                             elif metric_name == "cv":
# #                                 dtype_result[gene]["logfc"] = 0.0
# #                         except Exception as e:
# #                             print(f"[ERROR] Error computing {metric_name} for {cancer_name}, {dtype}, gene {gene}: {e}")
# #                             dtype_result[gene][f"{metric_name}_tumor"] = 0.0
# #                             dtype_result[gene][f"{metric_name}_normal"] = 0.0
# #                             if metric_name == "cv":
# #                                 dtype_result[gene]["logfc"] = 0.0

# #                 result[dtype] = dtype_result
# #         all_results[cancer_name] = result if result else None
# #         print(f"[DEBUG] Final result for {cancer_name}: {result}")

# #     return all_results if all_results else None

# # @app.route('/api/gene_noise', methods=['GET'])
# # def gene_noise():
# #     cancers = request.args.getlist('cancer')
# #     metrics = request.args.getlist('metric')
# #     gene_ensembl_ids = request.args.get('gene_ensembl_id').split(',') if request.args.get('gene_ensembl_id') else []

# #     gene_ensembl_ids = [g.strip().upper() for g in gene_ensembl_ids if g.strip()]

# #     print(f"[INFO] Request: cancers={cancers}, metrics={metrics}, gene_ensembl_ids={gene_ensembl_ids}")

# #     if not all([cancers, gene_ensembl_ids]):
# #         return jsonify({"error": "Missing parameters (cancer or gene_ensembl_id)"}), 400

# #     metric_mapping = {
# #         "CV": "cv",
# #         "Mean": "mean",
# #         "Standard Deviation": "std",
# #         "MAD": "mad",
# #         "CV²": "cv_squared",
# #         "Differential Noise": "logfc"
# #     }
# #     api_metrics = [metric_mapping.get(m, m) for m in metrics if metric_mapping.get(m, m)]
# #     if not api_metrics or api_metrics == ["logfc"]:
# #         api_metrics = list(metric_funcs_gene.keys())
# #         if "logfc" not in api_metrics:
# #             api_metrics.append("logfc")
# #     elif "logfc" in api_metrics and "cv" not in api_metrics:
# #         api_metrics.append("cv")
# #     api_metrics = list(set(api_metrics))
# #     print(f"[DEBUG] Final API Metrics after processing: {api_metrics}")

# #     invalid_metrics = [m for m in api_metrics if m not in metric_funcs_gene and m != "logfc"]
# #     if invalid_metrics:
# #         return jsonify({"error": f"Unsupported metric: {','.join(invalid_metrics)}"}), 400

# #     cancer_names = []
# #     invalid_cancers = []
# #     for cancer in cancers:
# #         cancer_key = cancer.lower()
# #         cancer_name = cancer_key
# #         if cancer_name:
# #             cancer_names.append(cancer_name)
# #         else:
# #             invalid_cancers.append(cancer)

# #     if invalid_cancers:
# #         return jsonify({"error": f"Unsupported cancer names: {','.join(invalid_cancers)}"}), 400

# #     try:
# #         requested_metrics = {m: metric_funcs_gene[m] for m in metric_funcs_gene if m in api_metrics}
# #         results = compute_metrics_for_condition(
# #             cancer_names=cancer_names,
# #             input_dir=base_raw_dir,
# #             metric_funcs=requested_metrics,
# #             condition="gene",
# #             genes=gene_ensembl_ids
# #         )

# #         if not results:
# #             return jsonify({"error": "Metric computation failed or no data"}), 500

# #         transformed_results = {}
# #         for dtype in data_types:
# #             transformed_results[dtype] = {}
# #             for cancer_name in cancer_names:
# #                 if cancer_name in results and results[cancer_name] and dtype in results[cancer_name]:
# #                     for gene, metrics in results[cancer_name][dtype].items():
# #                         if gene not in transformed_results[dtype]:
# #                             transformed_results[dtype][gene] = {}
# #                         transformed_results[dtype][gene][cancer_name] = metrics

# #         print(f"[DEBUG] Gene noise results: {transformed_results}")
# #         return jsonify(transformed_results)
# #     except Exception as e:
# #         print(f"[ERROR] Error in gene_noise: {str(e)}")
# #         return jsonify({"error": f"Internal error: {str(e)}"}), 500

# # @app.route('/api/TH-metrics', methods=['GET'])
# # def TH_metrics():
# #     cancer = request.args.get('cancer')
# #     method = request.args.get('method')
# #     metric = request.args.get('metric')

# #     print(f"[INFO] Received request: cancer={cancer}, method={method}, metric={metric}")

# #     if not all([cancer, method, metric]):
# #         return jsonify({"error": "Missing parameters"}), 400

# #     cancer_key = cancer.lower()
# #     cancer_name = cancer_key
# #     if not cancer_name:
# #         return jsonify({"error": f"Unsupported cancer name or code: {cancer}"}), 400

# #     try:
# #         results = compute_metrics_for_condition(
# #             cancer_names=[cancer_name],
# #             input_dir=base_raw_dir,
# #             metric_funcs={metric: metric_funcs_TH[metric]},
# #             condition="tumor"
# #         )

# #         if not results or metric not in results[cancer_name]:
# #             return jsonify({"error": "Metric computation failed or no data"}), 500

# #         return jsonify(results[cancer_name][metric])
# #     except FileNotFoundError as e:
# #         return jsonify({"error": f"Missing data file: {str(e)}"}), 404
# #     except Exception as e:
# #         return jsonify({"error": f"Internal error: {str(e)}"}), 500

# # @app.route('/api/pathway-analysis', methods=['GET'])
# # def pathway_analysis():
# #     try:
# #         # Parse input parameters
# #         cancer_param = request.args.get('cancer', '')
# #         cancer = [c.strip() for c in cancer_param.split(',')] if cancer_param else []
# #         genes_param = request.args.get("genes", "")
# #         top_n = int(request.args.get("top_n", 15))
# #         analysis_type = request.args.get("analysis_type", "ORA")

# #         genes = [g.strip().upper() for g in genes_param.split(',') if g.strip()]

# #         print(f"[INFO] Request: cancer={cancer}, genes={genes}, top_n={top_n}, analysis_type={analysis_type}")

# #         if not cancer:
# #             return jsonify({"error": "Missing required parameter: cancer"}), 400

# #         # Validate cancer names
# #         cancer_names = []
# #         invalid_cancers = []
# #         for c in cancer:
# #             cancer_key = c.lower()
# #             cancer_name = cancer_mapping.get(cancer_key, cancer_key)
# #             if cancer_name:
# #                 cancer_names.append(cancer_name)
# #             else:
# #                 invalid_cancers.append(c)

# #         if invalid_cancers:
# #             return jsonify({"error": f"Unsupported cancer names: {','.join(invalid_cancers)}"}), 400

# #         # Initialize response structure
# #         response = {}

# #         # Process each normalization method
# #         for method in data_types:
# #             print(f"[INFO] Processing normalization method: {method}")
# #             response[method] = {
# #                 "enrichment": [],
# #                 "top_genes": [],
# #                 "gene_stats": {},
# #                 "noise_metrics": {},
# #                 "heatmap_data": {},
# #                 "warning": None
# #             }

# #             # Load expression data for all cancer types
# #             all_tumor_dfs = {}
# #             all_normal_dfs = {}
# #             for cancer_name in cancer_names:
# #                 try:
# #                     tumor_df, normal_df = load_expression_file(cancer_name, method, base_raw_dir, "pathway")
# #                     if tumor_df is not None:
# #                         all_tumor_dfs[cancer_name] = tumor_df
# #                     if normal_df is not None:
# #                         all_normal_dfs[cancer_name] = normal_df
# #                 except FileNotFoundError:
# #                     print(f"[DEBUG] File not found for {method} in {cancer_name}, skipping")
# #                     continue
# #                 except Exception as e:
# #                     print(f"[ERROR] Failed to load expression files for {cancer_name}, {method}: {e}")
# #                     continue

# #             if not all_tumor_dfs:
# #                 response[method]["warning"] = f"No tumor expression data found for any cancer type with {method} normalization"
# #                 continue

# #             # Determine gene set library
# #             gene_sets = ["KEGG_2021_Human", "GO_Biological_Process_2021"]
# #             library_genes = set().union(*[df.index for df in all_tumor_dfs.values()])
# #             if all_normal_dfs:
# #                 library_genes = library_genes.intersection(*[df.index for df in all_normal_dfs.values()])

# #             selected_genes = []
# #             ranked_list = None
# #             if genes:
# #                 valid_genes = [g for g in genes if g in library_genes]
# #                 if not valid_genes:
# #                     response[method]["warning"] = (
# #                         f"No valid gene IDs found in expression data or gene set libraries for {method} normalization. "
# #                         "Ensure gene symbols are uppercase and match KEGG_2021_Human or GO_Biological_Process_2021 identifiers."
# #                     )
# #                     continue
# #                 selected_genes = valid_genes
# #             else:
# #                 # Compute CV for ranking top noisy genes
# #                 cv_tumors = []
# #                 for c in cancer_names:
# #                     df = all_tumor_dfs.get(c)
# #                     if df is None or df.empty:
# #                         continue
# #                     means = df.mean(axis=1)
# #                     stds = df.std(axis=1)
# #                     cvs = stds / means.replace(0, np.nan)
# #                     cvs = cvs.fillna(0)
# #                     cv_tumors.append(cvs)
# #                 if not cv_tumors:
# #                     response[method]["warning"] = f"No valid tumor data for CV computation with {method} normalization"
# #                     continue
# #                 avg_cv_tumor = pd.concat(cv_tumors, axis=1).mean(axis=1)

# #                 cv_normals = []
# #                 for c in cancer_names:
# #                     df = all_normal_dfs.get(c)
# #                     if df is None or df.empty:
# #                         continue
# #                     means = df.mean(axis=1)
# #                     stds = df.std(axis=1)
# #                     cvs = stds / means.replace(0, np.nan)
# #                     cvs = cvs.fillna(0)
# #                     cv_normals.append(cvs)
# #                 if cv_normals:
# #                     avg_cv_normal = pd.concat(cv_normals, axis=1).mean(axis=1)
# #                 else:
# #                     avg_cv_normal = pd.Series(0, index=avg_cv_tumor.index)

# #                 # Score for ranking
# #                 eps = 1e-8
# #                 if cv_normals:
# #                     score = np.log2((avg_cv_tumor + eps) / (avg_cv_normal + eps))
# #                 else:
# #                     score = avg_cv_tumor
# #                 ranked_list = pd.DataFrame({
# #                     'gene': avg_cv_tumor.index,
# #                     'score': score
# #                 }).sort_values(by='score', ascending=False)
# #                 selected_genes = ranked_list['gene'].head(top_n).tolist()
# #                 selected_genes = [g.upper() for g in selected_genes if g in library_genes]

# #             selected_genes = [g for g in selected_genes if g in library_genes]
# #             print(f"[DEBUG] Final selected genes for {method}: {len(selected_genes)}")

# #             # Compute heatmap data (per cancer means)
# #             heatmap_data = {}
# #             for cancer_name in cancer_names:
# #                 tumor_df = all_tumor_dfs.get(cancer_name)
# #                 normal_df = all_normal_dfs.get(cancer_name)
# #                 if tumor_df is None:
# #                     print(f"[DEBUG] Skipping heatmap data for {cancer_name} due to missing tumor data for {method}")
# #                     continue
# #                 tumor_mean = tumor_df.mean(axis=1)
# #                 normal_mean = normal_df.mean(axis=1) if normal_df is not None and not normal_df.empty else pd.Series(0, index=tumor_df.index)
# #                 for gene in selected_genes:
# #                     if gene not in heatmap_data:
# #                         heatmap_data[gene] = {}
# #                     tumor_value = tumor_mean.get(gene, 0)
# #                     normal_value = normal_mean.get(gene, 0)
# #                     try:
# #                         heatmap_data[gene][f"{cancer_name} Tumor"] = float(tumor_value) if pd.notnull(tumor_value) else 0.0
# #                         heatmap_data[gene][f"{cancer_name} Normal"] = float(normal_value) if pd.notnull(normal_value) else 0.0
# #                     except (TypeError, ValueError) as e:
# #                         print(f"[ERROR] Failed to convert values for gene {gene} in {cancer_name} for {method}: tumor={tumor_value}, normal={normal_value}, error={e}")
# #                         heatmap_data[gene][f"{cancer_name} Tumor"] = 0.0
# #                         heatmap_data[gene][f"{cancer_name} Normal"] = 0.0
# #                 print(f"[DEBUG] Heatmap data for {cancer_name} ({method}): {list(heatmap_data.items())[:2]}")

# #             # Helper functions
# #             def safe_mean(df, gene):
# #                 if gene not in df.index:
# #                     return 0.0
# #                 vals = df.loc[gene].dropna().values
# #                 return float(np.mean(vals)) if vals.size > 0 else 0.0

# #             def safe_cv(df, gene):
# #                 if gene not in df.index:
# #                     return 0.0
# #                 vals = df.loc[gene].dropna().values
# #                 if vals.size < 2:
# #                     return 0.0
# #                 mean = np.mean(vals)
# #                 if mean == 0:
# #                     return 0.0
# #                 std = np.std(vals)
# #                 return float(std / mean)

# #             # Compute gene stats for selected genes per cancer
# #             gene_stats = {}
# #             for gene in selected_genes:
# #                 gene_stats[gene] = {}
# #                 for cancer_name in cancer_names:
# #                     display_cancer_name = reverse_cancer_mapping.get(cancer_name, cancer_name)
# #                     tumor_df = all_tumor_dfs.get(cancer_name)
# #                     normal_df = all_normal_dfs.get(cancer_name)
# #                     mean_tumor = safe_mean(tumor_df, gene) if tumor_df is not None and gene in tumor_df.index else 0.0
# #                     mean_normal = safe_mean(normal_df, gene) if normal_df is not None and gene in normal_df.index else 0.0
# #                     cv_tumor = safe_cv(tumor_df, gene) if tumor_df is not None and gene in tumor_df.index else 0.0
# #                     cv_normal = safe_cv(normal_df, gene) if normal_df is not None and gene in normal_df.index else 0.0
# #                     eps = 1e-8
# #                     logfc = cv_tumor - cv_normal
# #                     gene_stats[gene][display_cancer_name] = {
# #                         "mean_tumor": float(mean_tumor),
# #                         "mean_normal": float(mean_normal),
# #                         "cv_tumor": float(cv_tumor),
# #                         "cv_normal": float(cv_normal),
# #                         "logfc": float(logfc)
# #                     }
# #                 print(f"[DEBUG] Gene stats for {gene} ({method}): {gene_stats[gene]}")

# #             # Perform enrichment analysis
# #             enrichment_results = []
# #             for gene_set in gene_sets:
# #                 print(f"[DEBUG] Running {analysis_type} with gene set: {gene_set} for {method}")
# #                 try:
# #                     if analysis_type == "ORA":
# #                         enr = enrichr(
# #                             gene_list=selected_genes,
# #                             gene_sets=gene_set,
# #                             organism="Human",
# #                             outdir=None,
# #                             cutoff=0.05
# #                         )
# #                         results_df = enr.results
# #                         if results_df.empty:
# #                             print(f"[WARNING] No pathways found for {gene_set} in ORA analysis for {method}")
# #                             continue
# #                         results = results_df[["Term", "P-value", "Adjusted P-value", "Odds Ratio", "Combined Score", "Genes"]].head(10).to_dict(orient="records")
# #                         for res in results:
# #                             res["Genes"] = res["Genes"].split(";") if isinstance(res["Genes"], str) else []
# #                             res["GeneSet"] = gene_set
# #                         enrichment_results.extend(results)
# #                 except Exception as e:
# #                     print(f"[WARNING] Failed to run {analysis_type} with {gene_set} for {method}: {str(e)}")
# #                     continue

# #             # Populate response for this normalization method
# #             response[method]["enrichment"] = enrichment_results
# #             response[method]["top_genes"] = selected_genes
# #             response[method]["gene_stats"] = gene_stats
# #             response[method]["heatmap_data"] = heatmap_data
# #             if not enrichment_results:
# #                 response[method]["warning"] = (
# #                     (response[method]["warning"] or "") +
# #                     f" No pathways found for the provided genes with {method} normalization."
# #                 ).strip()
# #             if any(df is None for df in all_normal_dfs.values()):
# #                 response[method]["warning"] = (
# #                     (response[method]["warning"] or "") +
# #                     f" Normal data missing for some cancer types with {method} normalization; normal metrics and logfc set to 0 where applicable."
# #                 ).strip()

# #             print(f"[INFO] Pathway analysis completed for {method}: enrichment={len(enrichment_results)}, top_genes={len(selected_genes)}")

# #         # Check if any normalization method produced valid results
# #         if not any(response[method]["enrichment"] or response[method]["top_genes"] for method in data_types):
# #             return jsonify({
# #                 "error": "No valid data or pathways found for any normalization method",
# #                 "hint": "Ensure gene symbols are uppercase and match KEGG_2021_Human or GO_Biological_Process_2021 identifiers, or check data file integrity"
# #             }), 500

# #         print(f"[INFO] Final pathway analysis response: {response}")
# #         return jsonify(response)

# #     except Exception as e:
# #         print(f"[ERROR] Pathway analysis failed: {e}")
# #         return jsonify({
# #             "error": f"Internal server error: {str(e)}",
# #             "hint": "Ensure gene symbols are uppercase and match KEGG_2021_Human or GO_Biological_Process_2021 identifiers, or check data file integrity"
# #         }), 500

# # @app.route('/api/csv-upload', methods=['POST'])
# # def csv_upload():
# #     """
# #     API endpoint to process a gene list (from GeneSelector) and/or an expression data file,
# #     calculate gene noise metrics, perform pathway enrichment analysis, or compute tumor heterogeneity metrics
# #     based on the selected analysis type. No differential analysis (logFC) is performed.
# #     """
# #     try:
# #         # Parse parameters
# #         analysis_type = request.form.get('analysis_type', 'Pathway')
# #         top_n = int(request.form.get('top_n', 15)) if 'top_n' in request.form else 15
# #         gene_set = request.form.get('gene_set', 'KEGG_2021_Human') if analysis_type == 'Pathway' else None
# #         genes = request.form.get('genes', '')

# #         print(f"[INFO] Input: analysis_type={analysis_type}, top_n={top_n}, gene_set={gene_set}, genes={genes}")

# #         # Validate analysis type
# #         valid_analysis_types = ['Gene', 'Pathway', 'Tumor']
# #         if analysis_type not in valid_analysis_types:
# #             return jsonify({"error": f"Invalid analysis type. Must be one of: {', '.join(valid_analysis_types)}"}), 400

# #         # Validate inputs
# #         if analysis_type == 'Tumor' and 'expression_file' not in request.files:
# #             return jsonify({"error": "Tumor Analysis requires an expression data file"}), 400
# #         if (analysis_type == 'Gene' or analysis_type == 'Pathway') and not genes.strip() and 'expression_file' not in request.files:
# #             return jsonify({"error": "Please provide a gene list or expression data file"}), 400

# #         # Process gene list
# #         selected_genes = None
# #         if genes.strip():
# #             selected_genes = [g.strip().upper() for g in genes.split(',') if g.strip()]
# #             if not selected_genes:
# #                 return jsonify({"error": "Empty gene list provided"}), 400
# #             print(f"[DEBUG] Parsed genes: {selected_genes}")

# #         # Process expression data file
# #         df = None
# #         if 'expression_file' in request.files:
# #             expression_file = request.files['expression_file']
# #             if not expression_file.filename:
# #                 return jsonify({"error": "No expression file selected"}), 400
# #             if not (expression_file.filename.endswith('.csv') or expression_file.filename.endswith('.tsv')):
# #                 return jsonify({"error": "Expression file must be CSV or TSV"}), 400
# #             delimiter = ',' if expression_file.filename.endswith('.csv') else '\t'
# #             try:
# #                 df = pd.read_csv(expression_file, delimiter=delimiter)
# #             except Exception as e:
# #                 return jsonify({"error": f"Failed to read expression file: {str(e)}"}), 400
# #             if not {'Hugo_Symbol'}.issubset(df.columns) or {'gene_name'}.issubset(df.columns):
# #                 return jsonify({"error": "Expression file must contain 'Hugo_Symbol' or 'gene_name' columns"}), 400
# #             # df['gene_name'] = df['gene_name'].astype(str).str.upper()
# #             if {'gene_name'}.issubset(df.columns):
# #                 df['gene_name'] = df['gene_name'].astype(str).str.upper()
# #                 df = df.set_index('gene_name')
# #             elif  {'Hugo_Symbol'}.issubset(df.columns):
# #                 df['Hugo_Symbol'] = df['Hugo_Symbol'].astype(str).str.upper()
# #                 df = df.set_index('Hugo_Symbol')

# #             if {'gene_id'}.issubset(df.columns):
# #                 df = df.drop(columns=['gene_id'])
                
# #             if {'Entrez_Id'}.issubset(df.columns):
# #                 df = df.drop(columns=['Entrez_Id'])
# #             df = df.apply(pd.to_numeric, errors='coerce')
# #             df = df.fillna(df.median())
# #             df = np.log2(df + 1)  # Log2 transform
# #             print(f"[DEBUG] Loaded expression dataframe shape: {df.shape}")
# #             print(f"[DEBUG] Expression dataframe head:\n{df.head()}")

# #         response = {
# #             "analysis_type": analysis_type,
# #             "warning": "Differential noise analysis (e.g., logFC) is not possible."
# #         }

# #         if analysis_type == 'Gene':
# #             if df is not None:
# #                 # Filter by selected genes if provided
# #                 if selected_genes:
# #                     df = df[df.index.isin(selected_genes)]
# #                     if df.empty:
# #                         return jsonify({"error": "None of the provided genes found in expression data"}), 400
# #                     top_genes = df.index.tolist()
# #                 else:
# #                     # Select top N genes by CV
# #                     cv_values = metric_funcs_gene['cv'](df)
# #                     top_genes = cv_values.sort_values(ascending=False).head(top_n).index.tolist()
# #                 # Compute metrics
# #                 metrics = {}
# #                 for metric_name, func in metric_funcs_gene.items():
# #                     try:
# #                         metric_values = func(df)
# #                         metrics[metric_name] = metric_values.to_dict()
# #                     except Exception as e:
# #                         print(f"[ERROR] Failed to compute {metric_name}: {e}")
# #                         metrics[metric_name] = {}
# #             else:
# #                 # No expression data; use gene list with placeholder metrics
# #                 if not selected_genes:
# #                     return jsonify({"error": "Gene Analysis requires a gene list or expression data"}), 400
# #                 top_genes = selected_genes
# #                 metrics = {name: {gene: 0.0 for gene in top_genes} for name in metric_funcs_gene.keys()}
# #                 print(f"[WARNING] Gene metrics not computed; returning zeros")
            
# #             response["metrics"] = metrics
# #             response["top_genes"] = top_genes

# #         elif analysis_type == 'Pathway':
# #             if df is not None:
# #                 # Filter by selected genes if provided
# #                 if selected_genes:
# #                     df = df[df.index.isin(selected_genes)]
# #                     if df.empty:
# #                         return jsonify({"error": "None of the provided genes found in expression data"}), 400
# #                     top_genes = df.index.tolist()
# #                 else:
# #                     # Select top N genes by CV
# #                     cv_values = metric_funcs_gene['cv'](df)
# #                     top_genes = cv_values.sort_values(ascending=False).head(top_n).index.tolist()
# #                 # Compute heatmap data
# #                 # heatmap_data = {gene: {"mean": float(df.loc[gene].mean()) if gene in df.index else 0.0} for gene in top_genes}
# #                 cv_values = metric_funcs_gene['cv'](df)

# #                 # Compute heatmap data with both mean and CV
# #                 heatmap_data = {
# #                     gene: {
# #                         "mean": float(df.loc[gene].mean()) if gene in df.index else 0.0,
# #                         "cv": float(cv_values.get(gene, 0.0))
# #                     }
# #                     for gene in top_genes
# #                 }
# #             else:
# #                 # No expression data; use gene list
# #                 if not selected_genes:
# #                     return jsonify({"error": "Pathway Analysis requires a gene list or expression data"}), 400
# #                 top_genes = selected_genes
# #                 heatmap_data = {gene: {"Tumor": 0.0} for gene in top_genes}
# #                 print(f"[WARNING] Heatmap data not computed; returning zeros")

# #             # Perform pathway enrichment analysis
# #             enrichment_results = []
# #             try:
# #                 enr = enrichr(
# #                     gene_list=top_genes,
# #                     gene_sets=gene_set,
# #                     organism="Human",
# #                     outdir=None,
# #                     cutoff=0.05
# #                 )
# #                 results_df = enr.results
# #                 if not results_df.empty:
# #                     results = results_df[["Term", "P-value", "Adjusted P-value", "Odds Ratio", "Combined Score", "Genes"]].head(10).to_dict(orient="records")
# #                     for res in results:
# #                         res["Genes"] = res["Genes"].split(";") if isinstance(res["Genes"], str) else []
# #                         res["GeneSet"] = gene_set
# #                     enrichment_results.extend(results)
# #                 else:
# #                     print(f"[WARNING] No pathways found for {gene_set} in ORA analysis")
# #             except Exception as e:
# #                 print(f"[ERROR] Failed to run ORA with {gene_set}: {e}")

# #             response["enrichment"] = enrichment_results
# #             response["top_genes"] = top_genes
# #             response["heatmap_data"] = heatmap_data

# #         elif analysis_type == 'Tumor':
# #             if df is None:
# #                 return jsonify({"error": "Tumor Analysis requires an expression data file"}), 400
# #             # Compute tumor heterogeneity metrics per sample
# #             metrics = []
# #             for sample in df.columns:
# #                 sample_data = df[[sample]]
# #                 sample_metrics = {"sample": sample}
# #                 for metric_name, func in metric_funcs_TH.items():
# #                     try:
# #                         metric_value = func(sample_data)
# #                         sample_metrics[metric_name] = float(metric_value.iloc[0]) if not metric_value.empty else 0.0
# #                     except Exception as e:
# #                         print(f"[ERROR] Failed to compute {metric_name} for sample {sample}: {e}")
# #                         sample_metrics[metric_name] = 0.0
# #                 metrics.append(sample_metrics)
# #             if not metrics:
# #                 return jsonify({"error": "No valid tumor heterogeneity metrics computed"}), 400
# #             response["metrics"] = metrics

# #         print(f"[INFO] {analysis_type} analysis response: {response}")
# #         return jsonify(response)

# #     except Exception as e:
# #         print(f"[ERROR] CSV upload failed: {e}")
# #         return jsonify({"error": f"Internal server error: {str(e)}"}), 500

# # if __name__ == '__main__':
# #     app.run(debug=True, host='0.0.0.0', port=5001)
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
# # # from cv_2 import cv2_calculation
# # # from mean import mean_calculation
# # # from gseapy import enrichr
# # # from functools import lru_cache
# # # from concurrent.futures import ThreadPoolExecutor
# # # import logging

# # # # Configure logging
# # # logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
# # # logger = logging.getLogger(__name__)

# # # # Initialize Flask App
# # # app = Flask(__name__)
# # # CORS(app, resources={r"/api/*": {
# # #     "origins": ["http://localhost:8081"],
# # #     "methods": ["GET", "POST", "OPTIONS"],
# # #     "allow_headers": ["Content-Type", "Authorization"],
# # #     "supports_credentials": True
# # # }})

# # # # Configuration
# # # base_raw_dir = "../data/raw"
# # # data_types = ["tpm", "fpkm", "fpkm_uq"]
# # # max_workers = 5  # Adjust based on server capabilities

# # # # Metric functions
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

# # # # Cancer mapping
# # # cancer_mapping = {
# # #     "liver and bile duct": "liver",
# # #     "breast": "breast",
# # #     "bladder": "bladder",
# # #     "colorectal": "colon",
# # #     "uterus": "uterus",
# # #     "lung": "lung",
# # #     "kidney": "kidney",
# # #     "rectum": "rectum",
# # #     "stomach": "stomach",
# # #     "brain and nervous system": "brain",
# # #     "thymus": "thymus",
# # #     "cervix": "cervix",
# # #     "adrenal gland": "adrenal",
# # #     "head and neck": "headandneck",
# # #     "esophagus": "esophagus",
# # #     "prostate": "prostate",
# # #     "thyroid": "thyroid",
# # #     "pancreas": "pancreas",
# # #     "testis": "testis",
# # #     "lymph nodes": "lymph",
# # #     "heart and pleura": "heart",
# # #     "ovary": "ovary",
# # #     "skin": "skin",
# # #     "eye and adnexa": "eye",
# # #     "bone marrow and blood": "blood",
# # #     "soft tissue": "soft tissue"
# # # }
# # # reverse_cancer_mapping = {v: k for k, v in cancer_mapping.items()}

# # # # Cache for loaded dataframes
# # # @lru_cache(maxsize=100)
# # # def load_expression_file(cancer_name, dtype, input_dir, cond):
# # #     """
# # #     Load and preprocess expression files with caching.
# # #     """
# # #     try:
# # #         tumor_filename = f"tumor_{dtype}.csv.gz"
# # #         normal_filename = f"normal_{dtype}.csv.gz"
# # #         tumor_filepath = os.path.join(input_dir, cancer_name, tumor_filename)
# # #         normal_filepath = os.path.join(input_dir, cancer_name, normal_filename)
        
# # #         tumor_df = None
# # #         normal_df = None
        
# # #         if os.path.exists(tumor_filepath):
# # #             tumor_df = pd.read_csv(tumor_filepath, index_col=0)
# # #             logger.info(f"Loaded tumor file: {tumor_filepath}, shape: {tumor_df.shape}")
# # #             if cond == 'pathway':
# # #                 if 'gene_name' in tumor_df.columns:
# # #                     tumor_df['gene_name'] = tumor_df['gene_name'].astype(str)
# # #                     tumor_df = tumor_df.set_index('gene_name')
# # #                 if 'gene_id' in tumor_df.columns:
# # #                     tumor_df = tumor_df.drop(columns=['gene_id'])
# # #             else:
# # #                 if 'gene_name' in tumor_df.columns:
# # #                     tumor_df = tumor_df.drop(columns=['gene_name'])
# # #                 if 'Hugo_Symbol' in tumor_df.columns:
# # #                     tumor_df = tumor_df.drop(columns=['Hugo_Symbol'])
# # #             tumor_df = tumor_df.apply(pd.to_numeric, errors='coerce')
# # #             tumor_df = tumor_df.fillna(tumor_df.median(numeric_only=True))
# # #             # tumor_df = np.log2(tumor_df + 1)
        
# # #         if os.path.exists(normal_filepath):
# # #             normal_df = pd.read_csv(normal_filepath, index_col=0)
# # #             logger.info(f"Loaded normal file: {normal_filepath}, shape: {normal_df.shape}")
# # #             if cond == 'pathway':
# # #                 if 'gene_name' in normal_df.columns:
# # #                     normal_df['gene_name'] = normal_df['gene_name'].astype(str)
# # #                     normal_df = normal_df.set_index('gene_name')
# # #                 if 'gene_id' in normal_df.columns:
# # #                     normal_df = normal_df.drop(columns=['gene_id'])
# # #             else:
# # #                 if 'gene_name' in normal_df.columns:
# # #                     normal_df = normal_df.drop(columns=['gene_name'])
# # #                 if 'Hugo_Symbol' in normal_df.columns:
# # #                     normal_df = normal_df.drop(columns=['Hugo_Symbol'])
# # #             normal_df = normal_df.apply(pd.to_numeric, errors='coerce')
# # #             normal_df = normal_df.fillna(normal_df.median(numeric_only=True))
# # #             # normal_df = np.log2(normal_df + 1)
        
# # #         return tumor_df, normal_df
    
# # #     except Exception as e:
# # #         logger.error(f"Failed to load files for {cancer_name}, {dtype}: {e}")
# # #         return None, None

# # # def compute_metrics_for_condition(cancer_names, input_dir, metric_funcs, condition, genes=None):
# # #     """
# # #     Compute metrics in parallel for given cancer names and condition.
# # #     """
# # #     if not isinstance(cancer_names, list):
# # #         cancer_names = [cancer_names]

# # #     def process_cancer(cancer_name):
# # #         expr_dfs = {}
# # #         for dtype in data_types:
# # #             tumor_df, normal_df = load_expression_file(cancer_name, dtype, input_dir, condition)
# # #             if tumor_df is not None or normal_df is not None:
# # #                 expr_dfs[dtype] = (tumor_df, normal_df)
        
# # #         if not expr_dfs:
# # #             logger.warning(f"No expression data loaded for {cancer_name}")
# # #             return cancer_name, None

# # #         result = {}
# # #         if condition == "gene" and genes:
# # #             genes_upper = [g.upper() for g in genes]
# # #             for dtype, (tumor_df, normal_df) in expr_dfs.items():
# # #                 dtype_result = {}
# # #                 valid_genes = [g for g in genes_upper if (tumor_df is not None and g in tumor_df.index) or (normal_df is not None and g in normal_df.index)]
# # #                 if not valid_genes:
# # #                     result[dtype] = {}
# # #                     continue
                
# # #                 tumor_df = tumor_df.loc[valid_genes] if tumor_df is not None else pd.DataFrame(index=valid_genes)
# # #                 normal_df = normal_df.loc[valid_genes] if normal_df is not None else pd.DataFrame(index=valid_genes)
                
# # #                 for gene in valid_genes:
# # #                     dtype_result[gene] = {}
# # #                     for metric_name, func in metric_funcs.items():
# # #                         try:
# # #                             tumor_metric = func(tumor_df) if tumor_df is not None and not tumor_df.empty else pd.Series(0, index=valid_genes)
# # #                             normal_metric = func(normal_df) if normal_df is not None and not normal_df.empty else pd.Series(0, index=valid_genes)
# # #                             dtype_result[gene][f"{metric_name}_tumor"] = float(tumor_metric.get(gene, 0))
# # #                             dtype_result[gene][f"{metric_name}_normal"] = float(normal_metric.get(gene, 0))
# # #                             if metric_name == "cv" and normal_df is not None and not normal_df.empty:
# # #                                 cv_t = float(tumor_metric.get(gene, 0))
# # #                                 cv_n = float(normal_metric.get(gene, 0))
# # #                                 logfc = cv_t - cv_n if cv_n != 0 else 0.0
# # #                                 dtype_result[gene]["logfc"] = float(logfc)
# # #                             elif metric_name == "cv":
# # #                                 dtype_result[gene]["logfc"] = 0.0
# # #                         except Exception as e:
# # #                             logger.error(f"Error computing {metric_name} for {cancer_name}, {dtype}, gene {gene}: {e}")
# # #                             dtype_result[gene][f"{metric_name}_tumor"] = 0.0
# # #                             dtype_result[gene][f"{metric_name}_normal"] = 0.0
# # #                             if metric_name == "cv":
# # #                                 dtype_result[gene]["logfc"] = 0.0
# # #                 result[dtype] = dtype_result
# # #         return cancer_name, result if result else None

# # #     all_results = {}
# # #     with ThreadPoolExecutor(max_workers=max_workers) as executor:
# # #         future_to_cancer = {executor.submit(process_cancer, cancer): cancer for cancer in cancer_names}
# # #         for future in future_to_cancer:
# # #             cancer_name, result = future.result()
# # #             all_results[cancer_name] = result
# # #     return all_results if all_results else None

# # # @app.route('/api/gene_noise', methods=['GET'])
# # # def gene_noise():
# # #     cancers = request.args.getlist('cancer')
# # #     metrics = request.args.getlist('metric')
# # #     gene_ensembl_ids = request.args.get('gene_ensembl_id', '').split(',')

# # #     gene_ensembl_ids = [g.strip().upper() for g in gene_ensembl_ids if g.strip()]
# # #     logger.info(f"Request: cancers={cancers}, metrics={metrics}, gene_ensembl_ids={gene_ensembl_ids}")

# # #     if not all([cancers, gene_ensembl_ids]):
# # #         return jsonify({"error": "Missing parameters (cancer or gene_ensembl_id)"}), 400

# # #     metric_mapping = {
# # #         "CV": "cv", "Mean": "mean", "Standard Deviation": "std",
# # #         "MAD": "mad", "CV²": "cv_squared", "Differential Noise": "logfc"
# # #     }
# # #     api_metrics = [metric_mapping.get(m, m) for m in metrics if metric_mapping.get(m, m)]
# # #     if not api_metrics or api_metrics == ["logfc"]:
# # #         api_metrics = list(metric_funcs_gene.keys()) + ["logfc"]
# # #     elif "logfc" in api_metrics and "cv" not in api_metrics:
# # #         api_metrics.append("cv")
# # #     api_metrics = list(set(api_metrics))

# # #     invalid_metrics = [m for m in api_metrics if m not in metric_funcs_gene and m != "logfc"]
# # #     if invalid_metrics:
# # #         return jsonify({"error": f"Unsupported metric: {','.join(invalid_metrics)}"}), 400

# # #     cancer_names = [cancer_mapping.get(c.lower(), c.lower()) for c in cancers]
# # #     invalid_cancers = [c for c in cancers if c.lower() not in cancer_mapping and c.lower() not in cancer_names]
# # #     if invalid_cancers:
# # #         return jsonify({"error": f"Unsupported cancer names: {','.join(invalid_cancers)}"}), 400

# # #     try:
# # #         requested_metrics = {m: metric_funcs_gene[m] for m in api_metrics if m in metric_funcs_gene}
# # #         results = compute_metrics_for_condition(
# # #             cancer_names=cancer_names,
# # #             input_dir=base_raw_dir,
# # #             metric_funcs=requested_metrics,
# # #             condition="gene",
# # #             genes=gene_ensembl_ids
# # #         )

# # #         if not results:
# # #             return jsonify({"error": "Metric computation failed or no data"}), 500

# # #         transformed_results = {}
# # #         for dtype in data_types:
# # #             transformed_results[dtype] = {}
# # #             for cancer_name in cancer_names:
# # #                 if cancer_name in results and results[cancer_name] and dtype in results[cancer_name]:
# # #                     for gene, metrics in results[cancer_name][dtype].items():
# # #                         transformed_results[dtype].setdefault(gene, {})[cancer_name] = metrics

# # #         logger.info(f"Gene noise results computed for {len(cancer_names)} cancers")
# # #         return jsonify(transformed_results)
# # #     except Exception as e:
# # #         logger.error(f"Error in gene_noise: {str(e)}")
# # #         return jsonify({"error": f"Internal error: {str(e)}"}), 500

# # # @app.route('/api/TH-metrics', methods=['GET'])
# # # def TH_metrics():
# # #     cancer = request.args.get('cancer')
# # #     method = request.args.get('method')
# # #     metric = request.args.get('metric')

# # #     logger.info(f"Received request: cancer={cancer}, method={method}, metric={metric}")

# # #     if not all([cancer, method, metric]):
# # #         return jsonify({"error": "Missing parameters"}), 400

# # #     cancer_name = cancer_mapping.get(cancer.lower(), cancer.lower())
# # #     if not cancer_name:
# # #         return jsonify({"error": f"Unsupported cancer name: {cancer}"}), 400

# # #     try:
# # #         results = compute_metrics_for_condition(
# # #             cancer_names=[cancer_name],
# # #             input_dir=base_raw_dir,
# # #             metric_funcs={metric: metric_funcs_TH[metric]},
# # #             condition="tumor"
# # #         )

# # #         if not results or not results.get(cancer_name) or metric not in results[cancer_name]:
# # #             return jsonify({"error": "Metric computation failed or no data"}), 500

# # #         return jsonify(results[cancer_name][metric])
# # #     except FileNotFoundError as e:
# # #         return jsonify({"error": f"Missing data file: {str(e)}"}), 404
# # #     except Exception as e:
# # #         return jsonify({"error": f"Internal error: {str(e)}"}), 500

# # # @app.route('/api/pathway-analysis', methods=['GET'])
# # # def pathway_analysis():
# # #     try:
# # #         cancer_param = request.args.get('cancer', '')
# # #         cancer = [c.strip() for c in cancer_param.split(',') if c.strip()]
# # #         genes = [g.strip().upper() for g in request.args.get("genes", "").split(',') if g.strip()]
# # #         top_n = int(request.args.get("top_n", 15))
# # #         analysis_type = request.args.get("analysis_type", "ORA")

# # #         logger.info(f"Request: cancer={cancer}, genes={genes}, top_n={top_n}, analysis_type={analysis_type}")

# # #         if not cancer:
# # #             return jsonify({"error": "Missing required parameter: cancer"}), 400

# # #         cancer_names = [cancer_mapping.get(c.lower(), c.lower()) for c in cancer]
# # #         invalid_cancers = [c for c in cancer if cancer_mapping.get(c.lower(), c.lower()) not in cancer_names]
# # #         if invalid_cancers:
# # #             return jsonify({"error": f"Unsupported cancer names: {','.join(invalid_cancers)}"}), 400

# # #         response = {}
# # #         with ThreadPoolExecutor(max_workers=max_workers) as executor:
# # #             futures = []
# # #             for method in data_types:
# # #                 future = executor.submit(process_pathway_method, method, cancer_names, genes, top_n, analysis_type, base_raw_dir)
# # #                 futures.append(future)
            
# # #             for future in futures:
# # #                 method, method_response = future.result()
# # #                 response[method] = method_response

# # #         if not any(response[method]["enrichment"] or response[method]["top_genes"] for method in data_types):
# # #             return jsonify({
# # #                 "error": "No valid data or pathways found for any normalization method",
# # #                 "hint": "Ensure gene symbols are uppercase and match KEGG_2021_Human or GO_Biological_Process_2021 identifiers"
# # #             }), 500

# # #         return jsonify(response)

# # #     except Exception as e:
# # #         logger.error(f"Pathway analysis failed: {e}")
# # #         return jsonify({
# # #             "error": f"Internal server error: {str(e)}",
# # #             "hint": "Ensure gene symbols are uppercase and match KEGG_2021_Human or GO_Biological_Process_2021 identifiers"
# # #         }), 500

# # # def process_pathway_method(method, cancer_names, genes, top_n, analysis_type, input_dir):
# # #     """
# # #     Process pathway analysis for a single normalization method.
# # #     """
# # #     response = {
# # #         "enrichment": [],
# # #         "top_genes": [],
# # #         "gene_stats": {},
# # #         "noise_metrics": {},
# # #         "heatmap_data": {},
# # #         "warning": None
# # #     }

# # #     all_tumor_dfs = {}
# # #     all_normal_dfs = {}
# # #     for cancer_name in cancer_names:
# # #         tumor_df, normal_df = load_expression_file(cancer_name, method, input_dir, "pathway")
# # #         if tumor_df is not None:
# # #             all_tumor_dfs[cancer_name] = tumor_df
# # #         if normal_df is not None:
# # #             all_normal_dfs[cancer_name] = normal_df

# # #     if not all_tumor_dfs:
# # #         response["warning"] = f"No tumor expression data found for any cancer type with {method} normalization"
# # #         return method, response

# # #     library_genes = set().union(*[df.index for df in all_tumor_dfs.values()])
# # #     if all_normal_dfs:
# # #         library_genes = library_genes.intersection(*[df.index for df in all_normal_dfs.values()])

# # #     selected_genes = []
# # #     if genes:
# # #         selected_genes = [g for g in genes if g in library_genes]
# # #         if not selected_genes:
# # #             response["warning"] = f"No valid gene IDs found for {method} normalization"
# # #             return method, response
# # #     else:
# # #         cv_tumors = [metric_funcs_gene['cv'](df) for df in all_tumor_dfs.values() if df is not None and not df.empty]
# # #         if not cv_tumors:
# # #             response["warning"] = f"No valid tumor data for CV computation with {method} normalization"
# # #             return method, response
# # #         avg_cv_tumor = pd.concat(cv_tumors, axis=1).mean(axis=1)

# # #         cv_normals = [metric_funcs_gene['cv'](df) for df in all_normal_dfs.values() if df is not None and not df.empty]
# # #         avg_cv_normal = pd.concat(cv_normals, axis=1).mean(axis=1) if cv_normals else pd.Series(0, index=avg_cv_tumor.index)

# # #         eps = 1e-8
# # #         score = np.log2((avg_cv_tumor + eps) / (avg_cv_normal + eps)) if cv_normals else avg_cv_tumor
# # #         ranked_list = pd.DataFrame({'gene': avg_cv_tumor.index, 'score': score}).sort_values(by='score', ascending=False)
# # #         selected_genes = ranked_list['gene'].head(top_n).tolist()
# # #         selected_genes = [g for g in selected_genes if g in library_genes]

# # #     # Compute heatmap and gene stats
# # #     heatmap_data = {}
# # #     gene_stats = {}
# # #     for gene in selected_genes:
# # #         gene_stats[gene] = {}
# # #         for cancer_name in cancer_names:
# # #             display_cancer_name = reverse_cancer_mapping.get(cancer_name, cancer_name)
# # #             tumor_df = all_tumor_dfs.get(cancer_name)
# # #             normal_df = all_normal_dfs.get(cancer_name)
# # #             tumor_mean = tumor_df.loc[gene].mean() if tumor_df is not None and gene in tumor_df.index else 0.0
# # #             normal_mean = normal_df.loc[gene].mean() if normal_df is not None and gene in normal_df.index else 0.0
# # #             tumor_cv = metric_funcs_gene['cv'](tumor_df)[gene] if tumor_df is not None and gene in tumor_df.index else 0.0
# # #             normal_cv = metric_funcs_gene['cv'](normal_df)[gene] if normal_df is not None and gene in normal_df.index else 0.0
# # #             logfc = tumor_cv - normal_cv
# # #             heatmap_data.setdefault(gene, {})[f"{cancer_name} Tumor"] = float(tumor_mean)
# # #             heatmap_data[gene][f"{cancer_name} Normal"] = float(normal_mean)
# # #             gene_stats[gene][display_cancer_name] = {
# # #                 "mean_tumor": float(tumor_mean),
# # #                 "mean_normal": float(normal_mean),
# # #                 "cv_tumor": float(tumor_cv),
# # #                 "cv_normal": float(normal_cv),
# # #                 "logfc": float(logfc)
# # #             }

# # #     # Enrichment analysis
# # #     gene_sets = ["KEGG_2021_Human", "GO_Biological_Process_2021"]
# # #     enrichment_results = []
# # #     for gene_set in gene_sets:
# # #         try:
# # #             enr = enrichr(
# # #                 gene_list=selected_genes,
# # #                 gene_sets=gene_set,
# # #                 organism="Human",
# # #                 outdir=None,
# # #                 cutoff=0.05
# # #             )
# # #             results_df = enr.results
# # #             if not results_df.empty:
# # #                 results = results_df[["Term", "P-value", "Adjusted P-value", "Odds Ratio", "Combined Score", "Genes"]].head(10).to_dict(orient="records")
# # #                 for res in results:
# # #                     res["Genes"] = res["Genes"].split(";") if isinstance(res["Genes"], str) else []
# # #                     res["GeneSet"] = gene_set
# # #                 enrichment_results.extend(results)
# # #         except Exception as e:
# # #             logger.warning(f"Failed to run ORA with {gene_set} for {method}: {e}")

# # #     response.update({
# # #         "enrichment": enrichment_results,
# # #         "top_genes": selected_genes,
# # #         "gene_stats": gene_stats,
# # #         "heatmap_data": heatmap_data
# # #     })
# # #     if not enrichment_results:
# # #         response["warning"] = f"No pathways found for {method} normalization"
# # #     if any(df is None for df in all_normal_dfs.values()):
# # #         response["warning"] = (response["warning"] or "") + f" Normal data missing for some cancer types with {method} normalization"

# # #     return method, response

# # @app.route('/api/csv-upload', methods=['POST'])
# # def csv_upload():
# #     try:
# #         analysis_type = request.form.get('analysis_type', 'Pathway')
# #         top_n = int(request.form.get('top_n', 15))
# #         gene_set = request.form.get('gene_set', 'KEGG_2021_Human') if analysis_type == 'Pathway' else None
# #         genes = request.form.get('genes', '')

# #         logger.info(f"Input: analysis_type={analysis_type}, top_n={top_n}, gene_set={gene_set}, genes={genes}")

# #         valid_analysis_types = ['Gene', 'Pathway', 'Tumor']
# #         if analysis_type not in valid_analysis_types:
# #             return jsonify({"error": f"Invalid analysis type: {analysis_type}"}), 400

# #         selected_genes = [g.strip().upper() for g in genes.split(',') if g.strip()] if genes.strip() else None
# #         if analysis_type in ['Gene', 'Pathway'] and not selected_genes and 'expression_file' not in request.files:
# #             return jsonify({"error": "Gene or Pathway Analysis requires a gene list or expression data"}), 400

# #         df = None
# #         if 'expression_file' in request.files:
# #             expression_file = request.files['expression_file']
# #             if not expression_file.filename:
# #                 return jsonify({"error": "No expression file selected"}), 400
# #             if not expression_file.filename.endswith(('.csv', '.tsv')):
# #                 return jsonify({"error": "Expression file must be CSV or TSV"}), 400
# #             delimiter = ',' if expression_file.filename.endswith('.csv') else '\t'
# #             df = pd.read_csv(expression_file, delimiter=delimiter)
# #             if not {'Hugo_Symbol', 'gene_name'}.intersection(df.columns):
# #                 return jsonify({"error": "Expression file must contain 'Hugo_Symbol' or 'gene_name' column"}), 400
# #             gene_column = 'gene_name' if 'gene_name' in df.columns else 'Hugo_Symbol'
# #             df[gene_column] = df[gene_column].astype(str).str.upper()
# #             df = df.set_index(gene_column)
# #             if 'gene_id' in df.columns:
# #                 df = df.drop(columns=['gene_id'])
# #             if 'Entrez_Id' in df.columns:
# #                 df = df.drop(columns=['Entrez_Id'])
# #             df = df.apply(pd.to_numeric, errors='coerce')
# #             df = df.fillna(df.median(numeric_only=True))
# #             df = np.log2(df + 1)

# #         response = {"analysis_type": analysis_type, "warning": "Differential noise analysis (e.g., logFC) is not possible"}

# #         if analysis_type == 'Gene':
# #             if df is not None:
# #                 top_genes = df.index.tolist() if selected_genes is None else [g for g in selected_genes if g in df.index]
# #                 if not top_genes:
# #                     return jsonify({"error": "None of the provided genes found in expression data"}), 400
# #                 df = df.loc[top_genes]
# #                 metrics = {name: func(df).to_dict() for name, func in metric_funcs_gene.items()}
# #             else:
# #                 if not selected_genes:
# #                     return jsonify({"error": "Gene Analysis requires a gene list or expression data"}), 400
# #                 top_genes = selected_genes
# #                 metrics = {name: {gene: 0.0 for gene in top_genes} for name in metric_funcs_gene.keys()}
# #             response.update({"metrics": metrics, "top_genes": top_genes})

# #         elif analysis_type == 'Pathway':
# #             if df is not None:
# #                 top_genes = df.index.tolist() if selected_genes is None else [g for g in selected_genes if g in df.index]
# #                 if not top_genes:
# #                     return jsonify({"error": "None of the provided genes found in expression data"}), 400
# #                 df = df.loc[top_genes]
# #                 cv_values = metric_funcs_gene['cv'](df)
# #                 heatmap_data = {gene: {"mean": float(df.loc[gene].mean()), "cv": float(cv_values.get(gene, 0.0))} for gene in top_genes}
# #             else:
# #                 if not selected_genes:
# #                     return jsonify({"error": "Pathway Analysis requires a gene list or expression data"}), 400
# #                 top_genes = selected_genes
# #                 heatmap_data = {gene: {"mean": 0.0, "cv": 0.0} for gene in top_genes}

# #             enrichment_results = []
# #             try:
# #                 enr = enrichr(gene_list=top_genes, gene_sets=gene_set, organism="Human", outdir=None, cutoff=0.05)
# #                 results_df = enr.results
# #                 if not results_df.empty:
# #                     results = results_df[["Term", "P-value", "Adjusted P-value", "Odds Ratio", "Combined Score", "Genes"]].head(10).to_dict(orient="records")
# #                     for res in results:
# #                         res["Genes"] = res["Genes"].split(";") if isinstance(res["Genes"], str) else []
# #                         res["GeneSet"] = gene_set
# #                     enrichment_results.extend(results)
# #             except Exception as e:
# #                 logger.error(f"Failed to run ORA with {gene_set}: {e}")

# #             response.update({"enrichment": enrichment_results, "top_genes": top_genes, "heatmap_data": heatmap_data})

# #         elif analysis_type == 'Tumor':
# #             if df is None:
# #                 return jsonify({"error": "Tumor Analysis requires an expression data file"}), 400
# #             metrics = []
# #             for sample in df.columns:
# #                 sample_metrics = {"sample": sample}
# #                 for metric_name, func in metric_funcs_TH.items():
# #                     try:
# #                         metric_value = func(df[[sample]])
# #                         sample_metrics[metric_name] = float(metric_value.iloc[0]) if not metric_value.empty else 0.0
# #                     except Exception as e:
# #                         logger.error(f"Failed to compute {metric_name} for sample {sample}: {e}")
# #                         sample_metrics[metric_name] = 0.0
# #                 metrics.append(sample_metrics)
# #             response["metrics"] = metrics

# #         return jsonify(response)

# #     except Exception as e:
# #         logger.error(f"CSV upload failed: {e}")
# #         return jsonify({"error": f"Internal server error: {str(e)}"}), 500

# # # if __name__ == '__main__':
# # #     app.run(debug=False, host='0.0.0.0', port=5001, threaded=True)
# # import os
# # import pandas as pd
# # import numpy as np
# # from flask import Flask, request, jsonify
# # from flask_cors import CORS
# # from cv import cv_calculation
# # from std import std_calculation
# # from MAD import mad_calculation
# # from DEPTH2 import depth2_calculation
# # from DEPTH_ITH import depth_calculation
# # from cv_2 import cv2_calculation
# # from mean import mean_calculation
# # from gseapy import enrichr
# # from functools import lru_cache
# # from concurrent.futures import ThreadPoolExecutor
# # import logging

# # # Configure logging
# # logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
# # logger = logging.getLogger(__name__)

# # # Initialize Flask App
# # app = Flask(__name__)
# # CORS(app, resources={r"/api/*": {
# #     "origins": ["http://localhost:8081"],
# #     "methods": ["GET", "POST", "OPTIONS"],
# #     "allow_headers": ["Content-Type", "Authorization"],
# #     "supports_credentials": True
# # }})

# # # Configuration
# # base_raw_dir = "../data/raw"
# # data_types = ["tpm", "fpkm", "fpkm_uq"]
# # max_workers = 7  # Adjust based on server capabilities

# # # Metric functions
# # metric_funcs_TH = {
# #     "DEPTH2": depth2_calculation,
# #     "tITH": depth_calculation,
# # }
# # metric_funcs_gene = {
# #     "cv": cv_calculation,
# #     "cv_squared": cv2_calculation,
# #     "std": std_calculation,
# #     "mad": mad_calculation,
# #     "mean": mean_calculation
# # }

# # # Cancer mapping
# # cancer_mapping = {
# #     "liver and bile duct": "liver",
# #     "breast": "breast",
# #     "bladder": "bladder",
# #     "colorectal": "colon",
# #     "uterus": "uterus",
# #     "lung": "lung",
# #     "kidney": "kidney",
# #     "rectum": "rectum",
# #     "stomach": "stomach",
# #     "brain and nervous system": "brain",
# #     "thymus": "thymus",
# #     "cervix": "cervix",
# #     "adrenal gland": "adrenal",
# #     "head and neck": "headandneck",
# #     "esophagus": "esophagus",
# #     "prostate": "prostate",
# #     "thyroid": "thyroid",
# #     "pancreas": "pancreas",
# #     "testis": "testis",
# #     "lymph nodes": "lymph",
# #     "heart and pleura": "heart",
# #     "ovary": "ovary",
# #     "skin": "skin",
# #     "eye and adnexa": "eye",
# #     "bone marrow and blood": "blood",
# #     "soft tissue": "soft tissue"
# # }
# # reverse_cancer_mapping = {v: k for k, v in cancer_mapping.items()}

# # # Cache for loaded dataframes
# # @lru_cache(maxsize=100)
# # def load_expression_file(cancer_name, dtype, input_dir, cond):
# #     """
# #     Load and preprocess expression files with caching, returning both raw and log2-transformed data.
# #     """
# #     try:
# #         tumor_filename = f"tumor_{dtype}.csv.gz"
# #         normal_filename = f"normal_{dtype}.csv.gz"
# #         tumor_filepath = os.path.join(input_dir, cancer_name, tumor_filename)
# #         normal_filepath = os.path.join(input_dir, cancer_name, normal_filename)
        
# #         tumor_df_raw = None
# #         normal_df_raw = None
# #         tumor_df_log2 = None
# #         normal_df_log2 = None
        
# #         if os.path.exists(tumor_filepath):
# #             tumor_df_raw = pd.read_csv(tumor_filepath, index_col=0)
# #             logger.info(f"Loaded tumor file: {tumor_filepath}, shape: {tumor_df_raw.shape}")
# #             if cond == 'pathway':
# #                 if 'gene_name' in tumor_df_raw.columns:
# #                     tumor_df_raw['gene_name'] = tumor_df_raw['gene_name'].astype(str)
# #                     tumor_df_raw = tumor_df_raw.set_index('gene_name')
# #                 if 'gene_id' in tumor_df_raw.columns:
# #                     tumor_df_raw = tumor_df_raw.drop(columns=['gene_id'])
# #             else:
# #                 if 'gene_name' in tumor_df_raw.columns:
# #                     tumor_df_raw = tumor_df_raw.drop(columns=['gene_name'])
# #                 if 'Hugo_Symbol' in tumor_df_raw.columns:
# #                     tumor_df_raw = tumor_df_raw.drop(columns=['Hugo_Symbol'])
# #             tumor_df_raw = tumor_df_raw.apply(pd.to_numeric, errors='coerce')
# #             tumor_df_raw = tumor_df_raw.fillna(tumor_df_raw.median(numeric_only=True))
# #             tumor_df_log2 = np.log2(tumor_df_raw + 1)
        
# #         if os.path.exists(normal_filepath):
# #             normal_df_raw = pd.read_csv(normal_filepath, index_col=0)
# #             logger.info(f"Loaded normal file: {normal_filepath}, shape: {normal_df_raw.shape}")
# #             if cond == 'pathway':
# #                 if 'gene_name' in normal_df_raw.columns:
# #                     normal_df_raw['gene_name'] = normal_df_raw['gene_name'].astype(str)
# #                     normal_df_raw = normal_df_raw.set_index('gene_name')
# #                 if 'gene_id' in normal_df_raw.columns:
# #                     normal_df_raw = normal_df_raw.drop(columns=['gene_id'])
# #             else:
# #                 if 'gene_name' in normal_df_raw.columns:
# #                     normal_df_raw = normal_df_raw.drop(columns=['gene_name'])
# #                 if 'Hugo_Symbol' in normal_df_raw.columns:
# #                     normal_df_raw = normal_df_raw.drop(columns=['Hugo_Symbol'])
# #             normal_df_raw = normal_df_raw.apply(pd.to_numeric, errors='coerce')
# #             normal_df_raw = normal_df_raw.fillna(normal_df_raw.median(numeric_only=True))
# #             normal_df_log2 = np.log2(normal_df_raw + 1)
        
# #         return {
# #             'raw': (tumor_df_raw, normal_df_raw),
# #             'log2': (tumor_df_log2, normal_df_log2)
# #         }
    
# #     except Exception as e:
# #         logger.error(f"Failed to load files for {cancer_name}, {dtype}: {e}")
# #         return {'raw': (None, None), 'log2': (None, None)}

# # def compute_metrics_for_condition(cancer_names, input_dir, metric_funcs, condition, genes=None, sample_ids=None):
# #     """
# #     Compute metrics in parallel for given cancer names and condition for both raw and log2 data.
# #     """
# #     if not isinstance(cancer_names, list):
# #         cancer_names = [cancer_names]

# #     def process_cancer(cancer_name):
# #         expr_dfs = {}
# #         for dtype in data_types:
# #             data = load_expression_file(cancer_name, dtype, input_dir, condition)
# #             if data['raw'][0] is not None or data['raw'][1] is not None or data['log2'][0] is not None or data['log2'][1] is not None:
# #                 expr_dfs[dtype] = data
        
# #         if not expr_dfs:
# #             logger.warning(f"No expression data loaded for {cancer_name}")
# #             return cancer_name, None

# #         result = {}
# #         if condition == "gene" and genes:
# #             genes_upper = [g.upper() for g in genes]
# #             for dtype, data in expr_dfs.items():
# #                 result[dtype] = {'raw': {}, 'log2': {}}
# #                 for transform, (tumor_df, normal_df) in data.items():
# #                     dtype_result = {}
# #                     valid_genes = [g for g in genes_upper if (tumor_df is not None and g in tumor_df.index) or (normal_df is not None and g in normal_df.index)]
# #                     if not valid_genes:
# #                         result[dtype][transform] = {}
# #                         continue
                    
# #                     tumor_df = tumor_df.loc[valid_genes] if tumor_df is not None else pd.DataFrame(index=valid_genes)
# #                     normal_df = normal_df.loc[valid_genes] if normal_df is not None else pd.DataFrame(index=valid_genes)
                    
# #                     for gene in valid_genes:
# #                         dtype_result[gene] = {}
# #                         for metric_name, func in metric_funcs.items():
# #                             try:
# #                                 tumor_metric = func(tumor_df) if tumor_df is not None and not tumor_df.empty else pd.Series(0, index=valid_genes)
# #                                 normal_metric = func(normal_df) if normal_df is not None and not normal_df.empty else pd.Series(0, index=valid_genes)
# #                                 dtype_result[gene][f"{metric_name}_tumor"] = float(tumor_metric.get(gene, 0))
# #                                 dtype_result[gene][f"{metric_name}_normal"] = float(normal_metric.get(gene, 0))
# #                                 if metric_name == "cv" and normal_df is not None and not normal_df.empty:
# #                                     cv_t = float(tumor_metric.get(gene, 0))
# #                                     cv_n = float(normal_metric.get(gene, 0))
# #                                     logfc = cv_t - cv_n if cv_n != 0 else 0.0
# #                                     dtype_result[gene]["logfc"] = float(logfc)
# #                                 elif metric_name == "cv":
# #                                     dtype_result[gene]["logfc"] = 0.0
# #                             except Exception as e:
# #                                 logger.error(f"Error computing {metric_name} for {cancer_name}, {dtype}, gene {gene}: {e}")
# #                                 dtype_result[gene][f"{metric_name}_tumor"] = 0.0
# #                                 dtype_result[gene][f"{metric_name}_normal"] = 0.0
# #                                 if metric_name == "cv":
# #                                     dtype_result[gene]["logfc"] = 0.0
# #                     result[dtype][transform] = dtype_result
# #         if condition == "tumor":
# #             # Get all sample IDs from tumor data
# #             sample_ids_set = set()
# #             for dtype, data in expr_dfs.items():
# #                 if data['log2'][0] is not None:
# #                     sample_ids_set.update(data['log2'][0].columns)
# #             sample_ids_set = sorted(list(sample_ids_set))
# #             # Filter by provided sample_ids if specified
# #             if sample_ids:
# #                 sample_ids_set = [sid for sid in sample_ids_set if sid in sample_ids]
# #             if not sample_ids_set:
# #                 logger.warning(f"No valid sample IDs for {cancer_name}")
# #                 return cancer_name, None
# #             # sample_ids_set = set()
# #             # for df in expr_dfs.values():
# #             #     sample_ids_set.update(df.columns)
# #             # sample_ids_set = sorted(list(sample_ids_set))

# #             metric_results = {}
# #             for metric_name, func in metric_funcs.items():
# #                 metric_data = {}
# #                 for dtype in data_types:
# #                     tumor_df = expr_dfs.get(dtype, {}).get('log2', (None, None))[0]
# #                     normal_df = expr_dfs.get(dtype, {}).get('log2', (None, None))[1]
# #                     if tumor_df is None:
# #                         metric_data[dtype] = [0] * len(sample_ids_set)
# #                         continue
# #                     try:
# #                         # Filter tumor_df to requested sample_ids
# #                         tumor_df = tumor_df[sample_ids_set] if sample_ids_set else tumor_df
# #                         # Pass both tumor_df and normal_df to depth_calculation
# #                         if metric_name == "tITH":
# #                             metric_series = func(tumor_df, normal_df)
# #                         else:
# #                             metric_series = func(tumor_df)
# #                         if not isinstance(metric_series, pd.Series):
# #                             raise ValueError(f"{metric_name} did not return a Series")
# #                         metric_data[dtype] = metric_series.reindex(sample_ids_set, fill_value=0).tolist()
# #                     except Exception as e:
# #                         logger.error(f"Error computing {metric_name} for {dtype}: {e}")
# #                         metric_data[dtype] = [0] * len(sample_ids_set)

# #                 result_list = []
# #                 for i, sid in enumerate(sample_ids_set):
# #                     record = {"sample_id": sid}
# #                     for dtype in data_types:
# #                         record[dtype] = metric_data[dtype][i]
# #                     result_list.append(record)
# #                 metric_results[metric_name] = result_list
# #             return cancer_name, metric_results if metric_results else None
# #         # Other conditions (gene, pathway) remain unchanged
# #         return cancer_name, result if result else None

# #     all_results = {}
# #     with ThreadPoolExecutor(max_workers=max_workers) as executor:
# #         future_to_cancer = {executor.submit(process_cancer, cancer): cancer for cancer in cancer_names}
# #         for future in future_to_cancer:
# #             cancer_name, result = future.result()
# #             all_results[cancer_name] = result
# #     return all_results if all_results else None

# # @app.route('/api/gene_noise', methods=['GET'])
# # def gene_noise():
# #     cancers = request.args.getlist('cancer')
# #     metrics = request.args.getlist('metric')
# #     gene_ensembl_ids = request.args.get('gene_ensembl_id', '').split(',')

# #     gene_ensembl_ids = [g.strip().upper() for g in gene_ensembl_ids if g.strip()]
# #     logger.info(f"Request: cancers={cancers}, metrics={metrics}, gene_ensembl_ids={gene_ensembl_ids}")

# #     if not all([cancers, gene_ensembl_ids]):
# #         return jsonify({"error": "Missing parameters (cancer or gene_ensembl_id)"}), 400

# #     metric_mapping = {
# #         "CV": "cv", "Mean": "mean", "Standard Deviation": "std",
# #         "MAD": "mad", "CV²": "cv_squared", "Differential Noise": "logfc"
# #     }
# #     api_metrics = [metric_mapping.get(m, m) for m in metrics if metric_mapping.get(m, m)]
# #     if not api_metrics or api_metrics == ["logfc"]:
# #         api_metrics = list(metric_funcs_gene.keys()) + ["logfc"]
# #     elif "logfc" in api_metrics and "cv" not in api_metrics:
# #         api_metrics.append("cv")
# #     api_metrics = list(set(api_metrics))

# #     invalid_metrics = [m for m in api_metrics if m not in metric_funcs_gene and m != "logfc"]
# #     if invalid_metrics:
# #         return jsonify({"error": f"Unsupported metric: {','.join(invalid_metrics)}"}), 400

# #     cancer_names = [cancer_mapping.get(c.lower(), c.lower()) for c in cancers]
# #     invalid_cancers = [c for c in cancers if c.lower() not in cancer_mapping and c.lower() not in cancer_names]
# #     if invalid_cancers:
# #         return jsonify({"error": f"Unsupported cancer names: {','.join(invalid_cancers)}"}), 400

# #     try:
# #         requested_metrics = {m: metric_funcs_gene[m] for m in api_metrics if m in metric_funcs_gene}
# #         results = compute_metrics_for_condition(
# #             cancer_names=cancer_names,
# #             input_dir=base_raw_dir,
# #             metric_funcs=requested_metrics,
# #             condition="gene",
# #             genes=gene_ensembl_ids
# #         )

# #         if not results:
# #             return jsonify({"error": "Metric computation failed or no data"}), 500

# #         transformed_results = {'raw': {}, 'log2': {}}
# #         for dtype in data_types:
# #             transformed_results['raw'][dtype] = {}
# #             transformed_results['log2'][dtype] = {}
# #             for cancer_name in cancer_names:
# #                 if cancer_name in results and results[cancer_name]:
# #                     for transform in ['raw', 'log2']:
# #                         if dtype in results[cancer_name] and results[cancer_name][dtype][transform]:
# #                             for gene, metrics in results[cancer_name][dtype][transform].items():
# #                                 transformed_results[transform][dtype].setdefault(gene, {})[cancer_name] = metrics

# #         logger.info(f"Gene noise results computed for {len(cancer_names)} cancers")
# #         print(transformed_results)
# #         return jsonify(transformed_results)
# #     except Exception as e:
# #         logger.error(f"Error in gene_noise: {str(e)}")
# #         return jsonify({"error": f"Internal error: {str(e)}"}), 500

# # # @app.route('/api/TH-metrics', methods=['GET'])
# # # def TH_metrics():
# # #     cancer = request.args.get('cancer')
# # #     method = request.args.get('method')
# # #     metric = request.args.get('metric')
# # #     sample_ids = request.args.get('sample_ids')

# # #     logger.info(f"Received request: cancer={cancer}, method={method}, metric={metric}")

# # #     if not all([cancer, method, metric]):
# # #         return jsonify({"error": "Missing parameters"}), 400

# # #     cancer_name = cancer_mapping.get(cancer.lower(), cancer.lower())
# # #     if not cancer_name:
# # #         return jsonify({"error": f"Unsupported cancer name: {cancer}"}), 400

# # #     try:
# # #         results = compute_metrics_for_condition(
# # #             cancer_names=[cancer_name],
# # #             input_dir=base_raw_dir,
# # #             metric_funcs={metric: metric_funcs_TH[metric]},
# # #             condition="tumor",
# # #             sample_ids
# # #         )

# # #         if not results or not results.get(cancer_name) or metric not in results[cancer_name]:
# # #             return jsonify({"error": "Metric computation failed or no data"}), 500

# # #         transformed_results = {'raw': {}, 'log2': {}}
# # #         for dtype in data_types:
# # #             if dtype in results[cancer_name]:
# # #                 for transform in ['raw', 'log2']:
# # #                     transformed_results[transform][dtype] = results[cancer_name][dtype][transform]

# # #         return jsonify(transformed_results)
# # #     except FileNotFoundError as e:
# # #         return jsonify({"error": f"Missing data file: {str(e)}"}), 404
# # #     except Exception as e:
# # #         return jsonify({"error": f"Internal error: {str(e)}"}), 500
# # @app.route('/api/TH-metrics', methods=['GET'])
# # def TH_metrics():
# #     cancer = request.args.get('cancer')
# #     method = request.args.get('method')
# #     metric = request.args.get('metric')
# #     sample_ids = request.args.get('sample_ids', '').split(',') if request.args.get('sample_ids') else []

# #     logger.info(f"Received request: cancer={cancer}, method={method}, metric={metric}, sample_ids={sample_ids}")

# #     if not all([cancer, method, metric]):
# #         return jsonify({"error": "Missing parameters"}), 400

# #     cancer_name = cancer_mapping.get(cancer.lower(), cancer.lower())
# #     if not cancer_name:
# #         return jsonify({"error": f"Unsupported cancer name: {cancer}"}), 400

# #     if metric not in metric_funcs_TH:
# #         return jsonify({"error": f"Unsupported metric: {metric}"}), 400

# #     try:
# #         results = compute_metrics_for_condition(
# #             cancer_names=[cancer_name],
# #             input_dir=base_raw_dir,
# #             metric_funcs={metric: metric_funcs_TH[metric]},
# #             condition="tumor",
# #             sample_ids=sample_ids
# #         )

# #         if not results or not results.get(cancer_name) or metric not in results[cancer_name]:
# #             return jsonify({"error": "Metric computation failed or no data"}), 500

# #         # Simplify response to include only log2-transformed data for the requested method
# #         transformed_results = []
# #         for sample in results[cancer_name][metric]:
# #             if not sample_ids or sample['sample_id'] in sample_ids:
# #                 transformed_results.append({
# #                     'sample_id': sample['sample_id'],
# #                     method: sample[method]
# #                 })

# #         return jsonify({'log2': {method: transformed_results}})
# #     except FileNotFoundError as e:
# #         return jsonify({"error": f"Missing data file: {str(e)}"}), 404
# #     except Exception as e:
# #         logger.error(f"Error in TH-metrics: {str(e)}")
# #         return jsonify({"error": f"Internal error: {str(e)}"}), 500

# # @app.route('/api/pathway-analysis', methods=['GET'])
# # def pathway_analysis():
# #     try:
# #         cancer_param = request.args.get('cancer', '')
# #         cancer = [c.strip() for c in cancer_param.split(',') if c.strip()]
# #         genes = [g.strip().upper() for g in request.args.get("genes", "").split(',') if g.strip()]
# #         top_n = int(request.args.get("top_n", 15))
# #         analysis_type = request.args.get("analysis_type", "ORA")

# #         logger.info(f"Request: cancer={cancer}, genes={genes}, top_n={top_n}, analysis_type={analysis_type}")

# #         if not cancer:
# #             return jsonify({"error": "Missing required parameter: cancer"}), 400

# #         cancer_names = [cancer_mapping.get(c.lower(), c.lower()) for c in cancer]
# #         invalid_cancers = [c for c in cancer if cancer_mapping.get(c.lower(), c.lower()) not in cancer_names]
# #         if invalid_cancers:
# #             return jsonify({"error": f"Unsupported cancer names: {','.join(invalid_cancers)}"}), 400

# #         response = {'raw': {}, 'log2': {}}
# #         with ThreadPoolExecutor(max_workers=max_workers) as executor:
# #             futures = []
# #             for method in data_types:
# #                 future = executor.submit(process_pathway_method, method, cancer_names, genes, top_n, analysis_type, base_raw_dir)
# #                 futures.append(future)
            
# #             for future in futures:
# #                 method, transform, method_response = future.result()
# #                 response[transform][method] = method_response

# #         if not any(response[transform][method]["enrichment"] or response[transform][method]["top_genes"] for transform in response for method in data_types):
# #             return jsonify({
# #                 "error": "No valid data or pathways found for any normalization method",
# #                 "hint": "Ensure gene symbols are uppercase and match KEGG_2021_Human or GO_Biological_Process_2021 identifiers"
# #             }), 500

# #         return jsonify(response)

# #     except Exception as e:
# #         logger.error(f"Pathway analysis failed: {e}")
# #         return jsonify({
# #             "error": f"Internal server error: {str(e)}",
# #             "hint": "Ensure gene symbols are uppercase and match KEGG_2021_Human or GO_Biological_Process_2021 identifiers"
# #         }), 500

# # def process_pathway_method(method, cancer_names, genes, top_n, analysis_type, input_dir):
# #     """
# #     Process pathway analysis for a single normalization method for both raw and log2 data.
# #     """
# #     response = {
# #         'raw': {
# #             "enrichment": [],
# #             "top_genes": [],
# #             "gene_stats": {},
# #             "noise_metrics": {},
# #             "heatmap_data": {},
# #             "warning": None
# #         },
# #         'log2': {
# #             "enrichment": [],
# #             "top_genes": [],
# #             "gene_stats": {},
# #             "noise_metrics": {},
# #             "heatmap_data": {},
# #             "warning": None
# #         }
# #     }

# #     all_dfs = {'raw': {'tumor': {}, 'normal': {}}, 'log2': {'tumor': {}, 'normal': {}}}
# #     for cancer_name in cancer_names:
# #         data = load_expression_file(cancer_name, method, input_dir, "pathway")
# #         for transform in ['raw', 'log2']:
# #             if data[transform][0] is not None:
# #                 all_dfs[transform]['tumor'][cancer_name] = data[transform][0]
# #             if data[transform][1] is not None:
# #                 all_dfs[transform]['normal'][cancer_name] = data[transform][1]

# #     for transform in ['raw', 'log2']:
# #         if not all_dfs[transform]['tumor']:
# #             response[transform]["warning"] = f"No tumor expression data found for any cancer type with {method} normalization"
# #             continue

# #         library_genes = set().union(*[df.index for df in all_dfs[transform]['tumor'].values()])
# #         if all_dfs[transform]['normal']:
# #             library_genes = library_genes.intersection(*[df.index for df in all_dfs[transform]['normal'].values()])

# #         selected_genes = []
# #         if genes:
# #             selected_genes = [g for g in genes if g in library_genes]
# #             if not selected_genes:
# #                 response[transform]["warning"] = f"No valid gene IDs found for {method} normalization ({transform})"
# #                 continue
# #         else:
# #             cv_tumors = [metric_funcs_gene['cv'](df) for df in all_dfs[transform]['tumor'].values() if df is not None and not df.empty]
# #             if not cv_tumors:
# #                 response[transform]["warning"] = f"No valid tumor data for CV computation with {method} normalization ({transform})"
# #                 continue
# #             avg_cv_tumor = pd.concat(cv_tumors, axis=1).mean(axis=1)

# #             cv_normals = [metric_funcs_gene['cv'](df) for df in all_dfs[transform]['normal'].values() if df is not None and not df.empty]
# #             avg_cv_normal = pd.concat(cv_normals, axis=1).mean(axis=1) if cv_normals else pd.Series(0, index=avg_cv_tumor.index)

# #             eps = 1e-8
# #             score = np.log2((avg_cv_tumor + eps) / (avg_cv_normal + eps)) if cv_normals else avg_cv_tumor
# #             ranked_list = pd.DataFrame({'gene': avg_cv_tumor.index, 'score': score}).sort_values(by='score', ascending=False)
# #             selected_genes = ranked_list['gene'].head(top_n).tolist()
# #             selected_genes = [g for g in selected_genes if g in library_genes]

# #         # Compute heatmap and gene stats
# #         heatmap_data = {}
# #         gene_stats = {}
# #         for gene in selected_genes:
# #             gene_stats[gene] = {}
# #             for cancer_name in cancer_names:
# #                 display_cancer_name = reverse_cancer_mapping.get(cancer_name, cancer_name)
# #                 tumor_df = all_dfs[transform]['tumor'].get(cancer_name)
# #                 normal_df = all_dfs[transform]['normal'].get(cancer_name)
# #                 tumor_mean = tumor_df.loc[gene].mean() if tumor_df is not None and gene in tumor_df.index else 0.0
# #                 normal_mean = normal_df.loc[gene].mean() if normal_df is not None and gene in normal_df.index else 0.0
# #                 tumor_cv = metric_funcs_gene['cv'](tumor_df)[gene] if tumor_df is not None and gene in tumor_df.index else 0.0
# #                 normal_cv = metric_funcs_gene['cv'](normal_df)[gene] if normal_df is not None and gene in normal_df.index else 0.0
# #                 logfc = tumor_cv - normal_cv
# #                 heatmap_data.setdefault(gene, {})[f"{cancer_name} Tumor"] = float(tumor_mean)
# #                 heatmap_data[gene][f"{cancer_name} Normal"] = float(normal_mean)
# #                 gene_stats[gene][display_cancer_name] = {
# #                     "mean_tumor": float(tumor_mean),
# #                     "mean_normal": float(normal_mean),
# #                     "cv_tumor": float(tumor_cv),
# #                     "cv_normal": float(normal_cv),
# #                     "logfc": float(logfc)
# #                 }

# #         # Enrichment analysis
# #         gene_sets = ["KEGG_2021_Human", "GO_Biological_Process_2021"]
# #         enrichment_results = []
# #         for gene_set in gene_sets:
# #             try:
# #                 enr = enrichr(
# #                     gene_list=selected_genes,
# #                     gene_sets=gene_set,
# #                     organism="Human",
# #                     outdir=None,
# #                     cutoff=0.05
# #                 )
# #                 results_df = enr.results
# #                 if not results_df.empty:
# #                     results = results_df[["Term", "P-value", "Overlap", "Adjusted P-value", "Odds Ratio", "Combined Score", "Genes"]].head(10).to_dict(orient="records")
# #                     for res in results:
# #                         res["Genes"] = res["Genes"].split(";") if isinstance(res["Genes"], str) else []
# #                         res["GeneSet"] = gene_set
# #                     enrichment_results.extend(results)
# #             except Exception as e:
# #                 logger.warning(f"Failed to run ORA with {gene_set} for {method} ({transform}): {e}")

# #         response[transform].update({
# #             "enrichment": enrichment_results,
# #             "top_genes": selected_genes,
# #             "gene_stats": gene_stats,
# #             "heatmap_data": heatmap_data
# #         })
# #         if not enrichment_results:
# #             response[transform]["warning"] = f"No pathways found for {method} normalization ({transform})"
# #         if any(df is None for df in all_dfs[transform]['normal'].values()):
# #             response[transform]["warning"] = (response[transform]["warning"] or "") + f" Normal data missing for some cancer types with {method} normalization ({transform})"

# #     return method, 'raw', response['raw'], 'log2', response['log2']

# # # @app.route('/api/csv-upload', methods=['POST'])
# # # def csv_upload():
# # #     try:
# # #         analysis_type = request.form.get('analysis_type', 'Pathway')
# # #         top_n = int(request.form.get('top_n', 15))
# # #         gene_set = request.form.get('gene_set', 'KEGG_2021_Human') if analysis_type == 'Pathway' else None
# # #         genes = request.form.get('genes', '')

# # #         logger.info(f"Input: analysis_type={analysis_type}, top_n={top_n}, gene_set={gene_set}, genes={genes}")

# # #         valid_analysis_types = ['Gene', 'Pathway', 'Tumor']
# # #         if analysis_type not in valid_analysis_types:
# # #             return jsonify({"error": f"Invalid analysis type: {analysis_type}"}), 400

# # #         selected_genes = [g.strip().upper() for g in genes.split(',') if g.strip()] if genes.strip() else None
# # #         if analysis_type in ['Gene', 'Pathway'] and not selected_genes and 'expression_file' not in request.files:
# # #             return jsonify({"error": "Gene or Pathway Analysis requires a gene list or expression data"}), 400

# # #         df_raw = None
# # #         df_log2 = None
# # #         if 'expression_file' in request.files:
# # #             expression_file = request.files['expression_file']
# # #             if not expression_file.filename:
# # #                 return jsonify({"error": "No expression file selected"}), 400
# # #             if not expression_file.filename.endswith(('.csv', '.tsv')):
# # #                 return jsonify({"error": "Expression file must be CSV or TSV"}), 400
# # #             delimiter = ',' if expression_file.filename.endswith('.csv') else '\t'
# # #             df_raw = pd.read_csv(expression_file, delimiter=delimiter)
# # #             if not {'Hugo_Symbol', 'gene_name'}.intersection(df_raw.columns):
# # #                 return jsonify({"error": "Expression file must contain 'Hugo_Symbol' or 'gene_name' column"}), 400
# # #             gene_column = 'gene_name' if 'gene_name' in df_raw.columns else 'Hugo_Symbol'
# # #             df_raw[gene_column] = df_raw[gene_column].astype(str).str.upper()
# # #             df_raw = df_raw.set_index(gene_column)
# # #             if 'gene_id' in df_raw.columns:
# # #                 df_raw = df_raw.drop(columns=['gene_id'])
# # #             if 'Entrez_Id' in df_raw.columns:
# # #                 df_raw = df_raw.drop(columns=['Entrez_Id'])
# # #             df_raw = df_raw.apply(pd.to_numeric, errors='coerce')
# # #             df_raw = df_raw.fillna(df_raw.median(numeric_only=True))
# # #             df_log2 = np.log2(df_raw + 1)

# # #         response = {
# # #             "analysis_type": analysis_type,
# # #             "raw": {"warning": "Differential noise analysis (e.g., logFC) is not possible"},
# # #             "log2": {"warning": "Differential noise analysis (e.g., logFC) is not possible"}
# # #         }

# # #         for transform, df in [('raw', df_raw), ('log2', df_log2)]:
# # #             if analysis_type == 'Gene':
# # #                 if df is not None:
# # #                     top_genes = df.index.tolist() if selected_genes is None else [g for g in selected_genes if g in df.index]
# # #                     if not top_genes:
# # #                         response[transform]["error"] = "None of the provided genes found in expression data"
# # #                         continue
# # #                     df = df.loc[top_genes]
# # #                     metrics = {name: func(df).to_dict() for name, func in metric_funcs_gene.items()}
# # #                 else:
# # #                     if not selected_genes:
# # #                         response[transform]["error"] = "Gene Analysis requires a gene list or expression data"
# # #                         continue
# # #                     top_genes = selected_genes
# # #                     metrics = {name: {gene: 0.0 for gene in top_genes} for name in metric_funcs_gene.keys()}
# # #                 response[transform].update({"metrics": metrics, "top_genes": top_genes})

# # #             elif analysis_type == 'Pathway':
# # #                 if df is not None:
# # #                     top_genes = df.index.tolist() if selected_genes is None else [g for g in selected_genes if g in df.index]
# # #                     if not top_genes:
# # #                         response[transform]["error"] = "None of the provided genes found in expression data"
# # #                         continue
# # #                     df = df.loc[top_genes]
# # #                     cv_values = metric_funcs_gene['cv'](df)
# # #                     heatmap_data = {gene: {"mean": float(df.loc[gene].mean()), "cv": float(cv_values.get(gene, 0.0))} for gene in top_genes}
# # #                 else:
# # #                     if not selected_genes:
# # #                         response[transform]["error"] = "Pathway Analysis requires a gene list or expression data"
# # #                         continue
# # #                     top_genes = selected_genes
# # #                     heatmap_data = {gene: {"mean": 0.0, "cv": 0.0} for gene in top_genes}

# # #                 enrichment_results = []
# # #                 try:
# # #                     enr = enrichr(gene_list=top_genes, gene_sets=gene_set, organism="Human", outdir=None, cutoff=0.05)
# # #                     results_df = enr.results
# # #                     if not results_df.empty:
# # #                         results = results_df[["Term", "P-value", "Adjusted P-value", "Odds Ratio", "Combined Score", "Genes"]].head(10).to_dict(orient="records")
# # #                         for res in results:
# # #                             res["Genes"] = res["Genes"].split(";") if isinstance(res["Genes"], str) else []
# # #                             res["GeneSet"] = gene_set
# # #                         enrichment_results.extend(results)
# # #                 except Exception as e:
# # #                     logger.error(f"Failed to run ORA with {gene_set} ({transform}): {e}")

# # #                 response[transform].update({"enrichment": enrichment_results, "top_genes": top_genes, "heatmap_data": heatmap_data})

# # #             elif analysis_type == 'Tumor':
# # #                 if df is None:
# # #                     response[transform]["error"] = "Tumor Analysis requires an expression data file"
# # #                     continue
# # #                 metrics = []
# # #                 for sample in df.columns:
# # #                     sample_metrics = {"sample": sample}
# # #                     for metric_name, func in metric_funcs_TH.items():
# # #                         try:
# # #                             metric_value = func(df[[sample]])
# # #                             sample_metrics[metric_name] = float(metric_value.iloc[0]) if not metric_value.empty else 0.0
# # #                         except Exception as e:
# # #                             logger.error(f"Failed to compute {metric_name} for sample {sample} ({transform}): {e}")
# # #                             sample_metrics[metric_name] = 0.0
# # #                     metrics.append(sample_metrics)
# # #                 response[transform]["metrics"] = metrics

# # #         if response['raw'].get('error') and response['log2'].get('error'):
# # #             return jsonify({"error": response['raw']['error']}), 400

# # #         return jsonify(response)

# # #     except Exception as e:
# # #         logger.error(f"CSV upload failed: {e}")
# # #         return jsonify({"error": f"Internal server error: {str(e)}"}), 500
# # @app.route('/api/csv-upload', methods=['POST'])
# # def csv_upload():
# #     try:
# #         analysis_type = request.form.get('analysis_type', 'Pathway')
# #         top_n = int(request.form.get('top_n', 15))
# #         gene_set = request.form.get('gene_set', 'KEGG_2021_Human') if analysis_type == 'Pathway' else None
# #         genes = request.form.get('genes', '')

# #         logger.info(f"Input: analysis_type={analysis_type}, top_n={top_n}, gene_set={gene_set}, genes={genes}")

# #         valid_analysis_types = ['Gene', 'Pathway', 'Tumor']
# #         if analysis_type not in valid_analysis_types:
# #             return jsonify({"error": f"Invalid analysis type: {analysis_type}"}), 400

# #         selected_genes = [g.strip().upper() for g in genes.split(',') if g.strip()] if genes.strip() else None
# #         if analysis_type in ['Gene', 'Pathway'] and not selected_genes and 'expression_file' not in request.files:
# #             return jsonify({"error": "Gene or Pathway Analysis requires a gene list or expression data"}), 400

# #         df = None
# #         if 'expression_file' in request.files:
# #             expression_file = request.files['expression_file']
# #             if not expression_file.filename:
# #                 return jsonify({"error": "No expression file selected"}), 400
# #             if not expression_file.filename.endswith(('.csv', '.tsv')):
# #                 return jsonify({"error": "Expression file must be CSV or TSV"}), 400
# #             delimiter = ',' if expression_file.filename.endswith('.csv') else '\t'
# #             df = pd.read_csv(expression_file, delimiter=delimiter)
# #             if not {'Hugo_Symbol', 'gene_name'}.intersection(df.columns):
# #                 return jsonify({"error": "Expression file must contain 'Hugo_Symbol' or 'gene_name' column"}), 400
# #             gene_column = 'gene_name' if 'gene_name' in df.columns else 'Hugo_Symbol'
# #             df[gene_column] = df[gene_column].astype(str).str.upper()
# #             df = df.set_index(gene_column)
# #             if 'gene_id' in df.columns:
# #                 df = df.drop(columns=['gene_id'])
# #             if 'Entrez_Id' in df.columns:
# #                 df = df.drop(columns=['Entrez_Id'])
# #             df = df.apply(pd.to_numeric, errors='coerce')
# #             df = df.fillna(df.median(numeric_only=True))
# #             df = np.log2(df + 1)

# #         response = {"analysis_type": analysis_type, "warning": "Differential noise analysis (e.g., logFC) is not possible"}

# #         if analysis_type == 'Gene':
# #             if df is not None:
# #                 top_genes = df.index.tolist() if selected_genes is None else [g for g in selected_genes if g in df.index]
# #                 if not top_genes:
# #                     return jsonify({"error": "None of the provided genes found in expression data"}), 400
# #                 df = df.loc[top_genes]
# #                 metrics = {name: func(df).to_dict() for name, func in metric_funcs_gene.items()}
# #             else:
# #                 if not selected_genes:
# #                     return jsonify({"error": "Gene Analysis requires a gene list or expression data"}), 400
# #                 top_genes = selected_genes
# #                 metrics = {name: {gene: 0.0 for gene in top_genes} for name in metric_funcs_gene.keys()}
# #             response.update({"metrics": metrics, "top_genes": top_genes})

# #         elif analysis_type == 'Pathway':
# #             if df is not None:
# #                 top_genes = df.index.tolist() if selected_genes is None else [g for g in selected_genes if g in df.index]
# #                 if not top_genes:
# #                     return jsonify({"error": "None of the provided genes found in expression data"}), 400
# #                 df = df.loc[top_genes]
# #                 cv_values = metric_funcs_gene['cv'](df)
# #                 heatmap_data = {gene: {"mean": float(df.loc[gene].mean()), "cv": float(cv_values.get(gene, 0.0))} for gene in top_genes}
# #             else:
# #                 if not selected_genes:
# #                     return jsonify({"error": "Pathway Analysis requires a gene list or expression data"}), 400
# #                 top_genes = selected_genes
# #                 heatmap_data = {gene: {"mean": 0.0, "cv": 0.0} for gene in top_genes}

# #             enrichment_results = []
# #             try:
# #                 enr = enrichr(gene_list=top_genes, gene_sets=gene_set, organism="Human", outdir=None, cutoff=0.05)
# #                 results_df = enr.results
# #                 if not results_df.empty:
# #                     results = results_df[["Term", "P-value", "Adjusted P-value", "Odds Ratio", "Combined Score", "Genes"]].head(10).to_dict(orient="records")
# #                     for res in results:
# #                         res["Genes"] = res["Genes"].split(";") if isinstance(res["Genes"], str) else []
# #                         res["GeneSet"] = gene_set
# #                     enrichment_results.extend(results)
# #             except Exception as e:
# #                 logger.error(f"Failed to run ORA with {gene_set}: {e}")

# #             response.update({"enrichment": enrichment_results, "top_genes": top_genes, "heatmap_data": heatmap_data})

# #         elif analysis_type == 'Tumor':
# #             if df is None:
# #                 return jsonify({"error": "Tumor Analysis requires an expression data file"}), 400
# #             metrics = []
# #             for sample in df.columns:
# #                 sample_metrics = {"sample": sample}
# #                 for metric_name, func in metric_funcs_TH.items():
# #                     try:
# #                         metric_value = func(df[[sample]])
# #                         sample_metrics[metric_name] = float(metric_value.iloc[0]) if not metric_value.empty else 0.0
# #                     except Exception as e:
# #                         logger.error(f"Failed to compute {metric_name} for sample {sample}: {e}")
# #                         sample_metrics[metric_name] = 0.0
# #                 metrics.append(sample_metrics)
# #             response["metrics"] = metrics

# #         return jsonify(response)

# #     except Exception as e:
# #         logger.error(f"CSV upload failed: {e}")
# #         return jsonify({"error": f"Internal server error: {str(e)}"}), 500

# # if __name__ == '__main__':
# #     app.run(debug=False, host='0.0.0.0', port=5001, threaded=True)
# # import os
# # import pandas as pd
# # import numpy as np
# # from flask import Flask, request, jsonify
# # from flask_cors import CORS
# # from cv import cv_calculation
# # from std import std_calculation
# # from MAD import mad_calculation
# # from DEPTH2 import depth2_calculation
# # from DEPTH_ITH import depth_calculation
# # from cv_2 import cv2_calculation
# # from mean import mean_calculation
# # from gseapy import enrichr
# # from functools import lru_cache
# # from concurrent.futures import ThreadPoolExecutor
# # import logging

# # # Configure logging
# # logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
# # logger = logging.getLogger(__name__)

# # # Initialize Flask App
# # app = Flask(__name__)
# # CORS(app, resources={r"/api/*": {
# #     "origins": ["http://localhost:8081"],
# #     "methods": ["GET", "POST", "OPTIONS"],
# #     "allow_headers": ["Content-Type", "Authorization"],
# #     "supports_credentials": True
# # }})

# # # Configuration
# # base_raw_dir = "../data/raw"
# # data_types = ["tpm", "fpkm", "fpkm_uq"]
# # max_workers = 7  # Adjust based on server capabilities

# # # Metric functions
# # metric_funcs_TH = {
# #     "DEPTH2": depth2_calculation,
# #     "tITH": depth_calculation,
# # }
# # metric_funcs_gene = {
# #     "cv": cv_calculation,
# #     "cv_squared": cv2_calculation,
# #     "std": std_calculation,
# #     "mad": mad_calculation,
# #     "mean": mean_calculation
# # }

# # # Cancer mapping
# # cancer_mapping = {
# #     "liver and bile duct": "liver",
# #     "breast": "breast",
# #     "bladder": "bladder",
# #     "colorectal": "colon",
# #     "uterus": "uterus",
# #     "lung": "lung",
# #     "kidney": "kidney",
# #     "rectum": "rectum",
# #     "stomach": "stomach",
# #     "brain and nervous system": "brain",
# #     "thymus": "thymus",
# #     "cervix": "cervix",
# #     "adrenal gland": "adrenal",
# #     "head and neck": "headandneck",
# #     "esophagus": "esophagus",
# #     "prostate": "prostate",
# #     "thyroid": "thyroid",
# #     "pancreas": "pancreas",
# #     "testis": "testis",
# #     "lymph nodes": "lymph",
# #     "heart and pleura": "heart",
# #     "ovary": "ovary",
# #     "skin": "skin",
# #     "eye and adnexa": "eye",
# #     "bone marrow and blood": "blood",
# #     "soft tissue": "soft tissue"
# # }
# # reverse_cancer_mapping = {v: k for k, v in cancer_mapping.items()}

# # # Cache for loaded dataframes
# # @lru_cache(maxsize=100)
# # def load_expression_file(cancer_name, dtype, input_dir, cond):
# #     """
# #     Load and preprocess expression files with caching, returning both raw and log2-transformed data.
# #     """
# #     try:
# #         tumor_filename = f"tumor_{dtype}.csv.gz"
# #         normal_filename = f"normal_{dtype}.csv.gz"
# #         tumor_filepath = os.path.join(input_dir, cancer_name, tumor_filename)
# #         normal_filepath = os.path.join(input_dir, cancer_name, normal_filename)
        
# #         tumor_df_raw = None
# #         normal_df_raw = None
# #         tumor_df_log2 = None
# #         normal_df_log2 = None
        
# #         if os.path.exists(tumor_filepath):
# #             tumor_df_raw = pd.read_csv(tumor_filepath, index_col=0)
# #             logger.info(f"Loaded tumor file: {tumor_filepath}, shape: {tumor_df_raw.shape}")
# #             if cond == 'pathway':
# #                 if 'gene_name' in tumor_df_raw.columns:
# #                     tumor_df_raw['gene_name'] = tumor_df_raw['gene_name'].astype(str)
# #                     tumor_df_raw = tumor_df_raw.set_index('gene_name')
# #                 if 'gene_id' in tumor_df_raw.columns:
# #                     tumor_df_raw = tumor_df_raw.drop(columns=['gene_id'])
# #             else:
# #                 if 'gene_name' in tumor_df_raw.columns:
# #                     tumor_df_raw = tumor_df_raw.drop(columns=['gene_name'])
# #                 if 'Hugo_Symbol' in tumor_df_raw.columns:
# #                     tumor_df_raw = tumor_df_raw.drop(columns=['Hugo_Symbol'])
# #             tumor_df_raw = tumor_df_raw.apply(pd.to_numeric, errors='coerce')
# #             tumor_df_raw = tumor_df_raw.fillna(tumor_df_raw.median(numeric_only=True))
# #             tumor_df_log2 = np.log2(tumor_df_raw + 1)
        
# #         if os.path.exists(normal_filepath):
# #             normal_df_raw = pd.read_csv(normal_filepath, index_col=0)
# #             logger.info(f"Loaded normal file: {normal_filepath}, shape: {normal_df_raw.shape}")
# #             if cond == 'pathway':
# #                 if 'gene_name' in normal_df_raw.columns:
# #                     normal_df_raw['gene_name'] = normal_df_raw['gene_name'].astype(str)
# #                     normal_df_raw = normal_df_raw.set_index('gene_name')
# #                 if 'gene_id' in normal_df_raw.columns:
# #                     normal_df_raw = normal_df_raw.drop(columns=['gene_id'])
# #             else:
# #                 if 'gene_name' in normal_df_raw.columns:
# #                     normal_df_raw = normal_df_raw.drop(columns=['gene_name'])
# #                 if 'Hugo_Symbol' in normal_df_raw.columns:
# #                     normal_df_raw = normal_df_raw.drop(columns=['Hugo_Symbol'])
# #             normal_df_raw = normal_df_raw.apply(pd.to_numeric, errors='coerce')
# #             normal_df_raw = normal_df_raw.fillna(normal_df_raw.median(numeric_only=True))
# #             normal_df_log2 = np.log2(normal_df_raw + 1)
        
# #         return {
# #             'raw': (tumor_df_raw, normal_df_raw),
# #             'log2': (tumor_df_log2, normal_df_log2)
# #         }
    
# #     except Exception as e:
# #         logger.error(f"Failed to load files for {cancer_name}, {dtype}: {e}")
# #         return {'raw': (None, None), 'log2': (None, None)}

# # def compute_metrics_for_condition(cancer_names, input_dir, metric_funcs, condition, genes=None, sample_ids=None):
# #     """
# #     Compute metrics in parallel for given cancer names and condition for both raw and log2 data.
# #     """
# #     if not isinstance(cancer_names, list):
# #         cancer_names = [cancer_names]

# #     def process_cancer(cancer_name):
# #         expr_dfs = {}
# #         for dtype in data_types:
# #             data = load_expression_file(cancer_name, dtype, input_dir, condition)
# #             if data['raw'][0] is not None or data['raw'][1] is not None or data['log2'][0] is not None or data['log2'][1] is not None:
# #                 expr_dfs[dtype] = data
        
# #         if not expr_dfs:
# #             logger.warning(f"No expression data loaded for {cancer_name}")
# #             return cancer_name, None

# #         result = {}
# #         if condition == "gene" and genes:
# #             genes_upper = [g.upper() for g in genes]
# #             for dtype, data in expr_dfs.items():
# #                 result[dtype] = {'raw': {}, 'log2': {}}
# #                 for transform, (tumor_df, normal_df) in data.items():
# #                     dtype_result = {}
# #                     valid_genes = [g for g in genes_upper if (tumor_df is not None and g in tumor_df.index) or (normal_df is not None and g in normal_df.index)]
# #                     if not valid_genes:
# #                         result[dtype][transform] = {}
# #                         continue
                    
# #                     tumor_df = tumor_df.loc[valid_genes] if tumor_df is not None else pd.DataFrame(index=valid_genes)
# #                     normal_df = normal_df.loc[valid_genes] if normal_df is not None else pd.DataFrame(index=valid_genes)
                    
# #                     for gene in valid_genes:
# #                         dtype_result[gene] = {}
# #                         for metric_name, func in metric_funcs.items():
# #                             try:
# #                                 tumor_metric = func(tumor_df) if tumor_df is not None and not tumor_df.empty else pd.Series(0, index=valid_genes)
# #                                 normal_metric = func(normal_df) if normal_df is not None and not normal_df.empty else pd.Series(0, index=valid_genes)
# #                                 dtype_result[gene][f"{metric_name}_tumor"] = float(tumor_metric.get(gene, 0))
# #                                 dtype_result[gene][f"{metric_name}_normal"] = float(normal_metric.get(gene, 0))
# #                                 if metric_name == "cv" and normal_df is not None and not normal_df.empty:
# #                                     cv_t = float(tumor_metric.get(gene, 0))
# #                                     cv_n = float(normal_metric.get(gene, 0))
# #                                     logfc = cv_t - cv_n if cv_n != 0 else 0.0
# #                                     dtype_result[gene]["logfc"] = float(logfc)
# #                                 elif metric_name == "cv":
# #                                     dtype_result[gene]["logfc"] = 0.0
# #                             except Exception as e:
# #                                 logger.error(f"Error computing {metric_name} for {cancer_name}, {dtype}, gene {gene}: {e}")
# #                                 dtype_result[gene][f"{metric_name}_tumor"] = 0.0
# #                                 dtype_result[gene][f"{metric_name}_normal"] = 0.0
# #                                 if metric_name == "cv":
# #                                     dtype_result[gene]["logfc"] = 0.0
# #                     result[dtype][transform] = dtype_result
# #         if condition == "tumor":
# #             # Get all sample IDs from tumor data
# #             sample_ids_set = set()
# #             for dtype, data in expr_dfs.items():
# #                 if data['log2'][0] is not None:
# #                     sample_ids_set.update(data['log2'][0].columns)
# #             sample_ids_set = sorted(list(sample_ids_set))
# #             # Filter by provided sample_ids if specified
# #             # if sample_ids:
# #             #     sample_ids_set = [sid for sid in sample_ids_set if sid in sample_ids]
# #             if not sample_ids_set:
# #                 logger.warning(f"No valid sample IDs for {cancer_name}")
# #                 return cancer_name, None

# #             metric_results = {}
# #             for metric_name, func in metric_funcs.items():
# #                 metric_data = {}
# #                 for dtype in data_types:
# #                     tumor_df = expr_dfs.get(dtype, {}).get('log2', (None, None))[0]
# #                     normal_df = expr_dfs.get(dtype, {}).get('log2', (None, None))[1]
# #                     if tumor_df is None:
# #                         metric_data[dtype] = [0] * len(sample_ids_set)
# #                         continue
# #                     try:
# #                         # Filter tumor_df to requested sample_ids
# #                         tumor_df = tumor_df[sample_ids_set] if sample_ids_set else tumor_df
# #                         # Pass both tumor_df and normal_df to depth_calculation for tITH
# #                         metric_series = func(tumor_df, normal_df) if metric_name == "tITH" else func(tumor_df)
# #                         if not isinstance(metric_series, pd.Series):
# #                             raise ValueError(f"{metric_name} did not return a Series")
# #                         metric_data[dtype] = metric_series.reindex(sample_ids_set, fill_value=0).tolist()
# #                     except Exception as e:
# #                         logger.error(f"Error computing {metric_name} for {dtype}: {e}")
# #                         metric_data[dtype] = [0] * len(sample_ids_set)

# #                 result_list = []
# #                 for i, sid in enumerate(sample_ids_set):
# #                     record = {"sample_id": sid}
# #                     for dtype in data_types:
# #                         record[dtype] = metric_data[dtype][i]
# #                     result_list.append(record)
# #                 metric_results[metric_name] = result_list
# #             return cancer_name, metric_results if metric_results else None
# #         # Other conditions (gene, pathway) remain unchanged
# #         return cancer_name, result if result else None

# #     all_results = {}
# #     with ThreadPoolExecutor(max_workers=max_workers) as executor:
# #         future_to_cancer = {executor.submit(process_cancer, cancer): cancer for cancer in cancer_names}
# #         for future in future_to_cancer:
# #             cancer_name, result = future.result()
# #             all_results[cancer_name] = result
# #     return all_results if all_results else None

# # @app.route('/api/gene_noise', methods=['GET'])
# # def gene_noise():
# #     cancers = request.args.getlist('cancer')
# #     metrics = request.args.getlist('metric')
# #     gene_ensembl_ids = request.args.get('gene_ensembl_id', '').split(',')

# #     gene_ensembl_ids = [g.strip().upper() for g in gene_ensembl_ids if g.strip()]
# #     logger.info(f"Request: cancers={cancers}, metrics={metrics}, gene_ensembl_ids={gene_ensembl_ids}")

# #     if not all([cancers, gene_ensembl_ids]):
# #         return jsonify({"error": "Missing parameters (cancer or gene_ensembl_id)"}), 400

# #     metric_mapping = {
# #         "CV": "cv", "Mean": "mean", "Standard Deviation": "std",
# #         "MAD": "mad", "CV²": "cv_squared", "Differential Noise": "logfc"
# #     }
# #     api_metrics = [metric_mapping.get(m, m) for m in metrics if metric_mapping.get(m, m)]
# #     if not api_metrics or api_metrics == ["logfc"]:
# #         api_metrics = list(metric_funcs_gene.keys()) + ["logfc"]
# #     elif "logfc" in api_metrics and "cv" not in api_metrics:
# #         api_metrics.append("cv")
# #     api_metrics = list(set(api_metrics))

# #     invalid_metrics = [m for m in api_metrics if m not in metric_funcs_gene and m != "logfc"]
# #     if invalid_metrics:
# #         return jsonify({"error": f"Unsupported metric: {','.join(invalid_metrics)}"}), 400

# #     cancer_names = [cancer_mapping.get(c.lower(), c.lower()) for c in cancers]
# #     invalid_cancers = [c for c in cancers if c.lower() not in cancer_mapping and c.lower() not in cancer_names]
# #     if invalid_cancers:
# #         return jsonify({"error": f"Unsupported cancer names: {','.join(invalid_cancers)}"}), 400

# #     try:
# #         requested_metrics = {m: metric_funcs_gene[m] for m in api_metrics if m in metric_funcs_gene}
# #         results = compute_metrics_for_condition(
# #             cancer_names=cancer_names,
# #             input_dir=base_raw_dir,
# #             metric_funcs=requested_metrics,
# #             condition="gene",
# #             genes=gene_ensembl_ids
# #         )

# #         if not results:
# #             return jsonify({"error": "Metric computation failed or no data"}), 500

# #         transformed_results = {'raw': {}, 'log2': {}}
# #         for dtype in data_types:
# #             transformed_results['raw'][dtype] = {}
# #             transformed_results['log2'][dtype] = {}
# #             for cancer_name in cancer_names:
# #                 if cancer_name in results and results[cancer_name]:
# #                     for transform in ['raw', 'log2']:
# #                         if dtype in results[cancer_name] and results[cancer_name][dtype][transform]:
# #                             for gene, metrics in results[cancer_name][dtype][transform].items():
# #                                 transformed_results[transform][dtype].setdefault(gene, {})[cancer_name] = metrics

# #         logger.info(f"Gene noise results computed for {len(cancer_names)} cancers")
# #         print(transformed_results)
# #         return jsonify(transformed_results)
# #     except Exception as e:
# #         logger.error(f"Error in gene_noise: {str(e)}")
# #         return jsonify({"error": f"Internal error: {str(e)}"}), 500

# # @app.route('/api/TH-metrics', methods=['GET'])
# # def TH_metrics():
# #     cancer = request.args.get('cancer')
# #     method = request.args.get('method')
# #     metric = request.args.get('metric')

# #     logger.info(f"Received request: cancer={cancer}, method={method}, metric={metric}")

# #     if not all([cancer, method, metric]):
# #         return jsonify({"error": "Missing parameters"}), 400

# #     cancer_name = cancer_mapping.get(cancer.lower(), cancer.lower())
# #     if not cancer_name:
# #         return jsonify({"error": f"Unsupported cancer name: {cancer}"}), 400

# #     if metric not in metric_funcs_TH:
# #         return jsonify({"error": f"Unsupported metric: {metric}"}), 400

# #     try:
# #         results = compute_metrics_for_condition(
# #             cancer_names=[cancer_name],
# #             input_dir=base_raw_dir,
# #             metric_funcs={metric: metric_funcs_TH[metric]},
# #             condition="tumor"
# #         )

# #         if not results or not results.get(cancer_name) or metric not in results[cancer_name]:
# #             return jsonify({"error": "Metric computation failed or no data"}), 500

# #         # Simplify response to include only log2-transformed data for the requested method
# #         transformed_results = [
# #             {
# #                 'sample_id': sample['sample_id'],
# #                 method: sample[method]
# #             }
# #             for sample in results[cancer_name][metric]
# #         ]
# #         # print(transformed_results)
# #         return jsonify({'log2': {method: transformed_results}})
# #     except FileNotFoundError as e:
# #         return jsonify({"error": f"Missing data file: {str(e)}"}), 404
# #     except Exception as e:
# #         logger.error(f"Error in TH-metrics: {str(e)}")
# #         return jsonify({"error": f"Internal error: {str(e)}"}), 500


# # @app.route('/api/pathway-analysis', methods=['GET'])
# # def pathway_analysis():
# #     try:
# #         cancer_param = request.args.get('cancer', '')
# #         cancer = [c.strip() for c in cancer_param.split(',') if c.strip()]
# #         genes = [g.strip().upper() for g in request.args.get("genes", "").split(',') if g.strip()]
# #         # top_n = int(request.args.get("top_n", 15))
# #         # analysis_type = request.args.get("analysis_type", "ORA")

# #         # logger.info(f"Request: cancer={cancer}, genes={genes}, top_n={top_n}, analysis_type={analysis_type}")
# #         logger.info(f"Request: cancer={cancer}, genes={genes}")

# #         if not cancer:
# #             return jsonify({"error": "Missing required parameter: cancer"}), 400

# #         cancer_names = [cancer_mapping.get(c.lower(), c.lower()) for c in cancer]
# #         invalid_cancers = [c for c in cancer if cancer_mapping.get(c.lower(), c.lower()) not in cancer_names]
# #         if invalid_cancers:
# #             return jsonify({"error": f"Unsupported cancer names: {','.join(invalid_cancers)}"}), 400

# #         response = {'raw': {}, 'log2': {}}
# #         # with ThreadPoolExecutor(max_workers=max_workers) as executor:
# #         #     futures = []
# #         #     for method in data_types:
# #         #         future = executor.submit(process_pathway_method, method, cancer_names, genes, base_raw_dir)
# #         #         futures.append(future)
            
# #         #     for future in futures:
# #         #         method, transform, method_response = future.result()
# #         #         response[transform][method] = method_response
# #         # with ThreadPoolExecutor(max_workers=max_workers) as executor:
# #         #     futures = []
# #         #     for method in data_types:
# #         #         future = executor.submit(process_pathway_method, method, cancer_names, genes, base_raw_dir)
# #         #         futures.append(future)
            
# #         #     for future in futures:
# #         #         method, _, raw_response, _, log2_response = future.result()  # Unpack five values
# #         #         response['raw'][method] = raw_response
# #         #         response['log2'][method] = log2_response
# #         with ThreadPoolExecutor(max_workers=max_workers) as executor:
# #             futures = []
# #             for method in data_types:
# #                 future = executor.submit(process_pathway_method, method, cancer_names, genes, base_raw_dir)
# #                 futures.append(future)
            
# #             for future in futures:
# #                 method, _, raw_response, _, log2_response = future.result()  # Unpack five values
# #                 response['raw'][method] = raw_response
# #                 response['log2'][method] = log2_response

# #         if not any(response[transform][method]["enrichment"] or response[transform][method]["top_genes"] for transform in response for method in data_types):
# #             return jsonify({
# #                 "error": "No valid data or pathways found for any normalization method",
# #                 "hint": "Ensure gene symbols are uppercase and match KEGG_2021_Human or GO_Biological_Process_2021 identifiers"
# #             }), 500
# #         print(response)
# #         return jsonify(response)

# #     except Exception as e:
# #         logger.error(f"Pathway analysis failed: {e}")
# #         return jsonify({
# #             "error": f"Internal server error: {str(e)}",
# #             "hint": "Ensure gene symbols are uppercase and match KEGG_2021_Human or GO_Biological_Process_2021 identifiers"
# #         }), 500


# # def process_pathway_method(method, cancer_names, genes, input_dir):
# #     """
# #     Process pathway analysis for a single normalization method for both raw and log2 data.
# #     """
# #     response = {
# #         'raw': {
# #             "enrichment": [],
# #             "top_genes": [],
# #             "gene_stats": {},
# #             "noise_metrics": {},
# #             "heatmap_data": {},
# #             "warning": None
# #         },
# #         'log2': {
# #             "enrichment": [],
# #             "top_genes": [],
# #             "gene_stats": {},
# #             "noise_metrics": {},
# #             "heatmap_data": {},
# #             "warning": None
# #         }
# #     }

# #     all_dfs = {'raw': {'tumor': {}, 'normal': {}}, 'log2': {'tumor': {}, 'normal': {}}}
# #     for cancer_name in cancer_names:
# #         data = load_expression_file(cancer_name, method, input_dir, "pathway")
# #         logger.info(f"Loaded data for {method}, {cancer_name}: tumor={data['raw'][0] is not None}, normal={data['raw'][1] is not None}")
# #         for transform in ['raw', 'log2']:
# #             if data[transform][0] is not None:
# #                 all_dfs[transform]['tumor'][cancer_name] = data[transform][0]
# #             if data[transform][1] is not None:
# #                 all_dfs[transform]['normal'][cancer_name] = data[transform][1]
# #     logger.info(f"Selected genes for {method}: {genes}")

# #     for transform in ['raw', 'log2']:
# #         if not all_dfs[transform]['tumor']:
# #             response[transform]["warning"] = f"No tumor expression data found for any cancer type with {method} normalization"
# #             continue

# #         library_genes = set().union(*[df.index for df in all_dfs[transform]['tumor'].values()])
# #         if all_dfs[transform]['normal']:
# #             library_genes = library_genes.intersection(*[df.index for df in all_dfs[transform]['normal'].values()])

# #         selected_genes = []
# #         if genes:
# #             selected_genes = [g for g in genes if g in library_genes]
# #             if not selected_genes:
# #                 response[transform]["warning"] = f"No valid gene IDs found for {method} normalization ({transform})"
# #                 continue
# #         else:
# #             cv_tumors = [metric_funcs_gene['cv'](df) for df in all_dfs[transform]['tumor'].values() if df is not None and not df.empty]
# #             if not cv_tumors:
# #                 response[transform]["warning"] = f"No valid tumor data for CV computation with {method} normalization ({transform})"
# #                 continue
# #             avg_cv_tumor = pd.concat(cv_tumors, axis=1).mean(axis=1)

# #             cv_normals = [metric_funcs_gene['cv'](df) for df in all_dfs[transform]['normal'].values() if df is not None and not df.empty]
# #             avg_cv_normal = pd.concat(cv_normals, axis=1).mean(axis=1) if cv_normals else pd.Series(0, index=avg_cv_tumor.index)

# #             eps = 1e-8
# #             score = np.log2((avg_cv_tumor + eps) / (avg_cv_normal + eps)) if cv_normals else avg_cv_tumor
# #             ranked_list = pd.DataFrame({'gene': avg_cv_tumor.index, 'score': score}).sort_values(by='score', ascending=False)
# #             # selected_genes = ranked_list['gene'].head(top_n).tolist()
# #             # selected_genes = [g for g in selected_genes if g in library_genes]

# #         # Compute heatmap and gene stats
# #         heatmap_data = {}
# #         gene_stats = {}
# #         for gene in selected_genes:
# #             gene_stats[gene] = {}
# #             for cancer_name in cancer_names:
# #                 display_cancer_name = reverse_cancer_mapping.get(cancer_name, cancer_name)
# #                 tumor_df = all_dfs[transform]['tumor'].get(cancer_name)
# #                 normal_df = all_dfs[transform]['normal'].get(cancer_name)
# #                 tumor_mean = tumor_df.loc[gene].mean() if tumor_df is not None and gene in tumor_df.index else 0.0
# #                 normal_mean = normal_df.loc[gene].mean() if normal_df is not None and gene in normal_df.index else 0.0
# #                 tumor_cv = metric_funcs_gene['cv'](tumor_df)[gene] if tumor_df is not None and gene in tumor_df.index else 0.0
# #                 normal_cv = metric_funcs_gene['cv'](normal_df)[gene] if normal_df is not None and gene in normal_df.index else 0.0
# #                 logfc = tumor_cv - normal_cv
# #                 heatmap_data.setdefault(gene, {})[f"{cancer_name} Tumor"] = float(tumor_mean)
# #                 heatmap_data[gene][f"{cancer_name} Normal"] = float(normal_mean)
# #                 gene_stats[gene][display_cancer_name] = {
# #                     "mean_tumor": float(tumor_mean),
# #                     "mean_normal": float(normal_mean),
# #                     "cv_tumor": float(tumor_cv),
# #                     "cv_normal": float(normal_cv),
# #                     "logfc": float(logfc)
# #                 }

# #         # Enrichment analysis
# #         gene_sets = ["KEGG_2021_Human", "GO_Biological_Process_2021"]
# #         enrichment_results = []
# #         for gene_set in gene_sets:
# #             try:
# #                 enr = enrichr(
# #                     gene_list=selected_genes,
# #                     gene_sets=gene_set,
# #                     organism="Human",
# #                     outdir=None,
# #                     cutoff=0.05
# #                 )
# #                 results_df = enr.results
# #                 if not results_df.empty:
# #                     results = results_df[["Term", "P-value", "Overlap", "Adjusted P-value", "Odds Ratio", "Combined Score", "Genes"]].head(10).to_dict(orient="records")
# #                     for res in results:
# #                         res["Genes"] = res["Genes"].split(";") if isinstance(res["Genes"], str) else []
# #                         res["GeneSet"] = gene_set
# #                     enrichment_results.extend(results)
# #             except Exception as e:
# #                 logger.warning(f"Failed to run ORA with {gene_set} for {method} ({transform}): {e}")

# #         response[transform].update({
# #             "enrichment": enrichment_results,
# #             "top_genes": selected_genes,
# #             "gene_stats": gene_stats,
# #             "heatmap_data": heatmap_data
# #         })
# #         if not enrichment_results:
# #             response[transform]["warning"] = f"No pathways found for {method} normalization ({transform})"
# #         if any(df is None for df in all_dfs[transform]['normal'].values()):
# #             response[transform]["warning"] = (response[transform]["warning"] or "") + f" Normal data missing for some cancer types with {method} normalization ({transform})"

# #     return method, 'raw', response['raw'], 'log2', response['log2']

# # @app.route('/api/csv-upload', methods=['POST'])
# # def csv_upload():
# #     try:
# #         analysis_type = request.form.get('analysis_type', 'Pathway')
# #         top_n = int(request.form.get('top_n', 15))
# #         gene_set = request.form.get('gene_set', 'KEGG_2021_Human') if analysis_type == 'Pathway' else None
# #         genes = request.form.get('genes', '')

# #         logger.info(f"Input: analysis_type={analysis_type}, top_n={top_n}, gene_set={gene_set}, genes={genes}")

# #         valid_analysis_types = ['Gene', 'Pathway', 'Tumor']
# #         if analysis_type not in valid_analysis_types:
# #             return jsonify({"error": f"Invalid analysis type: {analysis_type}"}), 400

# #         selected_genes = [g.strip().upper() for g in genes.split(',') if g.strip()] if genes.strip() else None
# #         if analysis_type in ['Gene', 'Pathway'] and not selected_genes and 'expression_file' not in request.files:
# #             return jsonify({"error": "Gene or Pathway Analysis requires a gene list or expression data"}), 400

# #         # Initialize response
# #         response = {
# #             "analysis_type": analysis_type,
# #             "raw": {"warning": "Differential noise analysis (e.g., logFC) is not possible"},
# #             "log2": {"warning": "Differential noise analysis (e.g., logFC) is not possible"}
# #         } if analysis_type != 'Tumor' else {
# #             "analysis_type": analysis_type,
# #             "log2": {"warning": ""}
# #         }

# #         # Process uploaded expression file
# #         df_raw = None
# #         df_log2 = None
# #         if 'expression_file' in request.files:
# #             expression_file = request.files['expression_file']
# #             if not expression_file.filename:
# #                 return jsonify({"error": "No expression file selected"}), 400
# #             if not expression_file.filename.endswith(('.csv', '.tsv')):
# #                 return jsonify({"error": "Expression file must be CSV or TSV"}), 400
# #             delimiter = ',' if expression_file.filename.endswith('.csv') else '\t'

# #             # Read the CSV/TSV file
# #             df_raw = pd.read_csv(expression_file, delimiter=delimiter)
# #             if not {'Hugo_Symbol', 'gene_name'}.intersection(df_raw.columns):
# #                 return jsonify({"error": "Expression file must contain 'Hugo_Symbol' or 'gene_name' column"}), 400

# #             gene_column = 'gene_name' if 'gene_name' in df_raw.columns else 'Hugo_Symbol'
# #             gene_id = 'gene_id' if 'gene_id' in df_raw.columns else 'Entrez_Gene_Id' if 'Entrez_Gene_Id' in df_raw.columns else None
# #             df_raw[gene_column] = df_raw[gene_column].astype(str).str.upper()

# #             # Prepare raw and log2 data
# #             # if analysis_type != 'Tumor':
# #                 # For Gene and Pathway analysis: Set index to gene_name or Hugo_Symbol
# #             df_raw = df_raw.set_index(gene_column)
# #             if gene_id in df_raw.columns:
# #                 df_raw = df_raw.drop(columns=[gene_id])
# #             df_raw = df_raw.apply(pd.to_numeric, errors='coerce')
# #             df_raw = df_raw.fillna(df_raw.median(numeric_only=True))
# #             df_log2 = np.log2(df_raw + 1)
# #             # else:
# #             #     # For Tumor analysis: Set index to gene_id or Entrez_Id
# #             #     if gene_id is None:
# #             #         return jsonify({"error": "Tumor analysis requires 'gene_id' or 'Entrez_Id' column"}), 400
# #             #     df_raw = df_raw.set_index(gene_id)
# #             #     if 'gene_name' in df_raw.columns:
# #             #         df_raw = df_raw.drop(columns=['gene_name'])
# #             #     if 'Hugo_Symbol' in df_raw.columns:
# #             #         df_raw = df_raw.drop(columns=['Hugo_Symbol'])
# #             #     df_raw = df_raw.apply(pd.to_numeric, errors='coerce')
# #             #     df_raw = df_raw.fillna(df_raw.median(numeric_only=True))
# #             #     df_log2 = np.log2(df_raw + 1)

# #         # Handle Gene Analysis
# #         if analysis_type == 'Gene':
# #             for transform, df in [('raw', df_raw), ('log2', df_log2)]:
# #                 if df is not None:
# #                     top_genes = df.index.tolist() if selected_genes is None else [g for g in selected_genes if g in df.index]
# #                     if not top_genes:
# #                         return jsonify({"error": f"None of the provided genes found in {transform} expression data"}), 400
# #                     df = df.loc[top_genes]
# #                     metrics = {name: func(df).to_dict() for name, func in metric_funcs_gene.items()}
# #                 else:
# #                     if not selected_genes:
# #                         return jsonify({"error": "Gene Analysis requires a gene list or expression data"}), 400
# #                     top_genes = selected_genes
# #                     metrics = {name: {gene: 0.0 for gene in top_genes} for name in metric_funcs_gene.keys()}
# #                 response[transform].update({"metrics": metrics, "top_genes": top_genes})

# #         # Handle Pathway Analysis
# #         elif analysis_type == 'Pathway':
# #             for transform, df in [('raw', df_raw), ('log2', df_log2)]:
# #                 if df is not None:
# #                     top_genes = df.index.tolist() if selected_genes is None else [g for g in selected_genes if g in df.index]
# #                     if not top_genes:
# #                         return jsonify({"error": f"None of the provided genes found in {transform} expression data"}), 400
# #                     df = df.loc[top_genes]
# #                     cv_values = metric_funcs_gene['cv'](df)
# #                     heatmap_data = {gene: {"mean": float(df.loc[gene].mean()), "cv": float(cv_values.get(gene, 0.0))} for gene in top_genes}
# #                 else:
# #                     if not selected_genes:
# #                         return jsonify({"error": "Pathway Analysis requires a gene list or expression data"}), 400
# #                     top_genes = selected_genes
# #                     heatmap_data = {gene: {"mean": 0.0, "cv": 0.0} for gene in top_genes}

# #                 enrichment_results = []
# #                 try:
# #                     enr = enrichr(gene_list=top_genes, gene_sets=gene_set, organism="Human", outdir=None, cutoff=0.05)
# #                     results_df = enr.results
# #                     if not results_df.empty:
# #                         results = results_df[["Term", "P-value", "Adjusted P-value", "Odds Ratio", "Combined Score", "Genes"]].head(top_n).to_dict(orient="records")
# #                         for res in results:
# #                             res["Genes"] = res["Genes"].split(";") if isinstance(res["Genes"], str) else []
# #                             res["GeneSet"] = gene_set
# #                         enrichment_results.extend(results)
# #                 except Exception as e:
# #                     logger.error(f"Failed to run ORA with {gene_set} for {transform}: {e}")

# #                 response[transform].update({
# #                     "enrichment": enrichment_results,
# #                     "top_genes": top_genes,
# #                     "heatmap_data": heatmap_data
# #                 })

# #         # Handle Tumor Analysis
# #         elif analysis_type == 'Tumor':
# #             if df_log2 is None:
# #                 return jsonify({"error": "Tumor Analysis requires an expression data file"}), 400
# #             all_metrics = {}
# #             for metric_name, func in metric_funcs_TH.items():
# #                 try:
# #                     metric_series = func(df_log2)  # Compute across all samples
# #                     all_metrics[metric_name] = metric_series
# #                 except Exception as e:
# #                     logger.error(f"Failed to compute {metric_name}: {e}")
# #                     all_metrics[metric_name] = pd.Series(0.0, index=df_log2.columns)

# #             metrics = []
# #             for sample in df_log2.columns:
# #                 sample_metrics = {"sample": sample}
# #                 for metric_name, metric_series in all_metrics.items():
# #                     val = metric_series.get(sample, 0.0)
# #                     sample_metrics[metric_name] = float(val) if pd.notna(val) else 0.0
# #                 metrics.append(sample_metrics)
# #             response["log2"]["metrics"] = metrics

# #         logger.info(f"CSV upload response generated for {analysis_type} analysis")
# #         print(response)
# #         return jsonify(response)

# #     except Exception as e:
# #         logger.error(f"CSV upload failed: {e}")
# #         return jsonify({"error": f"Internal server error: {str(e)}"}), 500


# # if __name__ == '__main__':
# #     app.run(debug=False, host='0.0.0.0', port=5001, threaded=True)
