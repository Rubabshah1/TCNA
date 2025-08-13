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
    "std": std_calculation,
    "mad": mad_calculation,
    "mean": mean_calculation
}

cancer_mapping = {
    "liver and bile duct": "liver",
    "breast": "breast",
    "bladder": "bladder",
    "colorectal": "colon",
    "uterus": "uterus",
    "lung": "lung",
    "kidney": "kidney",
    "rectum": "rectum",
    "stomach": "stomach",
    "brain and nervous system": "brain",
    "thymus": "thymus",
    "cervix": "cervix",
    "adrenal gland": "adrenal",
    "head and neck": "headandneck",
    "esophagus": "esophagus",
    "prostate": "prostate",
    "thyroid": "thyroid",
    "pancreas": "pancreas",
    "testis": "testis",
    "lymph nodes": "lymph",
    "heart and pleura": "heart",
    "ovary": "ovary",
    "skin": "skin",
    "eye and adnexa": "eye",
    "bone marrow and blood": "blood",
    "soft tissue": "soft tissue"
}

# Reverse mapping for cancer names
reverse_cancer_mapping = {v: k for k, v in cancer_mapping.items()}

def load_expression_file(cancer_name, dtype, input_dir, cond):
    """
    Load tumor and normal expression files for the given cancer and data type.
    Returns a tuple of (tumor_df, normal_df) or (None, None) if files are not found.
    """
    tumor_filename = f"tumor_{dtype}.csv.gz"
    normal_filename = f"normal_{dtype}.csv.gz"
    tumor_filepath = os.path.join(input_dir, cancer_name, tumor_filename)
    normal_filepath = os.path.join(input_dir, cancer_name, normal_filename)
    
    tumor_df = None
    normal_df = None
    
    try:
        # Load tumor data
        if os.path.exists(tumor_filepath):
            tumor_df = pd.read_csv(tumor_filepath, index_col=0)
            print(f"[DEBUG] Loaded tumor file: {tumor_filepath}, shape: {tumor_df.shape}")
            if cond == 'pathway':
                if 'gene_name' in tumor_df.columns:
                    tumor_df['gene_name'] = tumor_df['gene_name'].astype(str)
                    tumor_df = tumor_df.set_index('gene_name')
                if 'gene_id' in tumor_df.columns:
                    tumor_df = tumor_df.drop(columns=['gene_id'])
            else:
                if 'gene_name' in tumor_df.columns:
                    tumor_df = tumor_df.drop(columns=['gene_name'])
                if 'Hugo_Symbol' in tumor_df.columns:
                    tumor_df = tumor_df.drop(columns=['Hugo_Symbol'])
            tumor_df = tumor_df.apply(pd.to_numeric, errors='coerce')
            tumor_df = tumor_df.fillna(tumor_df.median())
            tumor_df = np.log2(tumor_df + 1)
        else:
            print(f"[DEBUG] Tumor file not found: {tumor_filepath}")

        # Load normal data
        if os.path.exists(normal_filepath):
            normal_df = pd.read_csv(normal_filepath, index_col=0)
            print(f"[DEBUG] Loaded normal file: {normal_filepath}, shape: {normal_df.shape}")
            if cond == 'pathway':
                if 'gene_name' in normal_df.columns:
                    normal_df['gene_name'] = normal_df['gene_name'].astype(str)
                    normal_df = normal_df.set_index('gene_name')
                if 'gene_id' in normal_df.columns:
                    normal_df = normal_df.drop(columns=['gene_id'])
            else:
                if 'gene_name' in normal_df.columns:
                    normal_df = normal_df.drop(columns=['gene_name'])
                if 'Hugo_Symbol' in normal_df.columns:
                    normal_df = normal_df.drop(columns=['Hugo_Symbol'])
            normal_df = normal_df.apply(pd.to_numeric, errors='coerce')
            normal_df = normal_df.fillna(normal_df.median())
            normal_df = np.log2(normal_df + 1)
        else:
            print(f"[DEBUG] Normal file not found: {normal_filepath}")

        # Only print head if dataframes are not None
        if tumor_df is not None:
            print(f"[DEBUG] Tumor dataframe head for {cancer_name}:\n{tumor_df.head()}")
        if normal_df is not None:
            print(f"[DEBUG] Normal dataframe head for {cancer_name}:\n{normal_df.head()}")

        if tumor_df is None and normal_df is None:
            print(f"[DEBUG] No data loaded for {cancer_name}, {dtype}")
            return None, None

        return tumor_df, normal_df

    except FileNotFoundError as e:
        print(f"[ERROR] File not found: {tumor_filepath} or {normal_filepath}")
        raise
    except Exception as e:
        print(f"[ERROR] Failed to load files for {cancer_name}, {dtype}: {e}")
        raise

def compute_metrics_for_condition(cancer_names, input_dir, metric_funcs, condition, genes=None):
    if not isinstance(cancer_names, list):
        cancer_names = [cancer_names]

    all_results = {}
    for cancer_name in cancer_names:
        expr_dfs = {}
        for dtype in data_types:
            try:
                tumor_df, normal_df = load_expression_file(cancer_name, dtype, input_dir, condition)
                if tumor_df is not None or normal_df is not None:
                    expr_dfs[dtype] = (tumor_df, normal_df)
            except FileNotFoundError:
                print(f"[DEBUG] File not found for {dtype} in {cancer_name}, skipping")
                continue
            except Exception as e:
                print(f"[ERROR] Failed to load expression files for {cancer_name}, {dtype}: {e}")
                continue

        if not expr_dfs:
            print(f"[DEBUG] No expression data loaded for {cancer_name}")
            continue

        result = {}
        if condition == "gene":
            if not genes:
                print("[DEBUG] No genes provided")
                continue
            genes = [g.upper() for g in genes]
            for dtype, (tumor_df, normal_df) in expr_dfs.items():
                dtype_result = {}
                valid_genes = genes
                if tumor_df is not None:
                    valid_genes = [gene for gene in valid_genes if gene in tumor_df.index]
                elif normal_df is not None:
                    valid_genes = [gene for gene in valid_genes if gene in normal_df.index]
                else:
                    print(f"[DEBUG] No valid data for {dtype} in {cancer_name}")
                    result[dtype] = {}
                    continue
                if not valid_genes:
                    print(f"[DEBUG] No valid genes found for {dtype} in {cancer_name}")
                    result[dtype] = {}
                    continue

                tumor_df = tumor_df.loc[valid_genes] if tumor_df is not None else pd.DataFrame(index=valid_genes)
                normal_df = normal_df.loc[valid_genes] if normal_df is not None else pd.DataFrame(index=valid_genes)

                for gene in valid_genes:
                    dtype_result[gene] = {}
                    for metric_name, func in metric_funcs.items():
                        try:
                            tumor_metric = func(tumor_df) if tumor_df is not None and not tumor_df.empty else pd.Series(0, index=valid_genes)
                            normal_metric = func(normal_df) if normal_df is not None and not normal_df.empty else pd.Series(0, index=valid_genes)
                            dtype_result[gene][f"{metric_name}_tumor"] = float(tumor_metric.get(gene, 0))
                            dtype_result[gene][f"{metric_name}_normal"] = float(normal_metric.get(gene, 0))
                            if metric_name == "cv" and normal_df is not None and not normal_df.empty and len(normal_df.columns) > 1:
                                cv_t = float(tumor_metric.get(gene, 0))
                                cv_n = float(normal_metric.get(gene, 0))
                                logfc = cv_t - cv_n if cv_n != 0 else 0.0
                                dtype_result[gene]["logfc"] = float(logfc)
                            elif metric_name == "cv":
                                dtype_result[gene]["logfc"] = 0.0
                        except Exception as e:
                            print(f"[ERROR] Error computing {metric_name} for {cancer_name}, {dtype}, gene {gene}: {e}")
                            dtype_result[gene][f"{metric_name}_tumor"] = 0.0
                            dtype_result[gene][f"{metric_name}_normal"] = 0.0
                            if metric_name == "cv":
                                dtype_result[gene]["logfc"] = 0.0

                result[dtype] = dtype_result
        all_results[cancer_name] = result if result else None
        print(f"[DEBUG] Final result for {cancer_name}: {result}")

    return all_results if all_results else None

@app.route('/api/gene_noise', methods=['GET'])
def gene_noise():
    cancers = request.args.getlist('cancer')
    metrics = request.args.getlist('metric')
    gene_ensembl_ids = request.args.get('gene_ensembl_id').split(',') if request.args.get('gene_ensembl_id') else []

    gene_ensembl_ids = [g.strip().upper() for g in gene_ensembl_ids if g.strip()]

    print(f"[INFO] Request: cancers={cancers}, metrics={metrics}, gene_ensembl_ids={gene_ensembl_ids}")

    if not all([cancers, gene_ensembl_ids]):
        return jsonify({"error": "Missing parameters (cancer or gene_ensembl_id)"}), 400

    metric_mapping = {
        "CV": "cv",
        "Mean": "mean",
        "Standard Deviation": "std",
        "MAD": "mad",
        "CV²": "cv_squared",
        "Differential Noise": "logfc"
    }
    api_metrics = [metric_mapping.get(m, m) for m in metrics if metric_mapping.get(m, m)]
    if not api_metrics or api_metrics == ["logfc"]:
        api_metrics = list(metric_funcs_gene.keys())
        if "logfc" not in api_metrics:
            api_metrics.append("logfc")
    elif "logfc" in api_metrics and "cv" not in api_metrics:
        api_metrics.append("cv")
    api_metrics = list(set(api_metrics))
    print(f"[DEBUG] Final API Metrics after processing: {api_metrics}")

    invalid_metrics = [m for m in api_metrics if m not in metric_funcs_gene and m != "logfc"]
    if invalid_metrics:
        return jsonify({"error": f"Unsupported metric: {','.join(invalid_metrics)}"}), 400

    cancer_names = []
    invalid_cancers = []
    for cancer in cancers:
        cancer_key = cancer.lower()
        cancer_name = cancer_key
        if cancer_name:
            cancer_names.append(cancer_name)
        else:
            invalid_cancers.append(cancer)

    if invalid_cancers:
        return jsonify({"error": f"Unsupported cancer names: {','.join(invalid_cancers)}"}), 400

    try:
        requested_metrics = {m: metric_funcs_gene[m] for m in metric_funcs_gene if m in api_metrics}
        results = compute_metrics_for_condition(
            cancer_names=cancer_names,
            input_dir=base_raw_dir,
            metric_funcs=requested_metrics,
            condition="gene",
            genes=gene_ensembl_ids
        )

        if not results:
            return jsonify({"error": "Metric computation failed or no data"}), 500

        transformed_results = {}
        for dtype in data_types:
            transformed_results[dtype] = {}
            for cancer_name in cancer_names:
                if cancer_name in results and results[cancer_name] and dtype in results[cancer_name]:
                    for gene, metrics in results[cancer_name][dtype].items():
                        if gene not in transformed_results[dtype]:
                            transformed_results[dtype][gene] = {}
                        transformed_results[dtype][gene][cancer_name] = metrics

        print(f"[DEBUG] Gene noise results: {transformed_results}")
        return jsonify(transformed_results)
    except Exception as e:
        print(f"[ERROR] Error in gene_noise: {str(e)}")
        return jsonify({"error": f"Internal error: {str(e)}"}), 500

@app.route('/api/TH-metrics', methods=['GET'])
def TH_metrics():
    cancer = request.args.get('cancer')
    method = request.args.get('method')
    metric = request.args.get('metric')

    print(f"[INFO] Received request: cancer={cancer}, method={method}, metric={metric}")

    if not all([cancer, method, metric]):
        return jsonify({"error": "Missing parameters"}), 400

    cancer_key = cancer.lower()
    cancer_name = cancer_key
    if not cancer_name:
        return jsonify({"error": f"Unsupported cancer name or code: {cancer}"}), 400

    try:
        results = compute_metrics_for_condition(
            cancer_names=[cancer_name],
            input_dir=base_raw_dir,
            metric_funcs={metric: metric_funcs_TH[metric]},
            condition="tumor"
        )

        if not results or metric not in results[cancer_name]:
            return jsonify({"error": "Metric computation failed or no data"}), 500

        return jsonify(results[cancer_name][metric])
    except FileNotFoundError as e:
        return jsonify({"error": f"Missing data file: {str(e)}"}), 404
    except Exception as e:
        return jsonify({"error": f"Internal error: {str(e)}"}), 500

@app.route('/api/pathway-analysis', methods=['GET'])
def pathway_analysis():
    try:
        # Parse input parameters
        cancer_param = request.args.get('cancer', '')
        cancer = [c.strip() for c in cancer_param.split(',')] if cancer_param else []
        genes_param = request.args.get("genes", "")
        top_n = int(request.args.get("top_n", 15))
        analysis_type = request.args.get("analysis_type", "ORA")

        genes = [g.strip().upper() for g in genes_param.split(',') if g.strip()]

        print(f"[INFO] Request: cancer={cancer}, genes={genes}, top_n={top_n}, analysis_type={analysis_type}")

        if not cancer:
            return jsonify({"error": "Missing required parameter: cancer"}), 400

        # Validate cancer names
        cancer_names = []
        invalid_cancers = []
        for c in cancer:
            cancer_key = c.lower()
            cancer_name = cancer_mapping.get(cancer_key, cancer_key)
            if cancer_name:
                cancer_names.append(cancer_name)
            else:
                invalid_cancers.append(c)

        if invalid_cancers:
            return jsonify({"error": f"Unsupported cancer names: {','.join(invalid_cancers)}"}), 400

        # Initialize response structure
        response = {}

        # Process each normalization method
        for method in data_types:
            print(f"[INFO] Processing normalization method: {method}")
            response[method] = {
                "enrichment": [],
                "top_genes": [],
                "gene_stats": {},
                "noise_metrics": {},
                "heatmap_data": {},
                "warning": None
            }

            # Load expression data for all cancer types
            all_tumor_dfs = {}
            all_normal_dfs = {}
            for cancer_name in cancer_names:
                try:
                    tumor_df, normal_df = load_expression_file(cancer_name, method, base_raw_dir, "pathway")
                    if tumor_df is not None:
                        all_tumor_dfs[cancer_name] = tumor_df
                    if normal_df is not None:
                        all_normal_dfs[cancer_name] = normal_df
                except FileNotFoundError:
                    print(f"[DEBUG] File not found for {method} in {cancer_name}, skipping")
                    continue
                except Exception as e:
                    print(f"[ERROR] Failed to load expression files for {cancer_name}, {method}: {e}")
                    continue

            if not all_tumor_dfs:
                response[method]["warning"] = f"No tumor expression data found for any cancer type with {method} normalization"
                continue

            # Determine gene set library
            gene_sets = ["KEGG_2021_Human", "GO_Biological_Process_2021"]
            library_genes = set().union(*[df.index for df in all_tumor_dfs.values()])
            if all_normal_dfs:
                library_genes = library_genes.intersection(*[df.index for df in all_normal_dfs.values()])

            selected_genes = []
            ranked_list = None
            if genes:
                valid_genes = [g for g in genes if g in library_genes]
                if not valid_genes:
                    response[method]["warning"] = (
                        f"No valid gene IDs found in expression data or gene set libraries for {method} normalization. "
                        "Ensure gene symbols are uppercase and match KEGG_2021_Human or GO_Biological_Process_2021 identifiers."
                    )
                    continue
                selected_genes = valid_genes
            else:
                # Compute CV for ranking top noisy genes
                cv_tumors = []
                for c in cancer_names:
                    df = all_tumor_dfs.get(c)
                    if df is None or df.empty:
                        continue
                    means = df.mean(axis=1)
                    stds = df.std(axis=1)
                    cvs = stds / means.replace(0, np.nan)
                    cvs = cvs.fillna(0)
                    cv_tumors.append(cvs)
                if not cv_tumors:
                    response[method]["warning"] = f"No valid tumor data for CV computation with {method} normalization"
                    continue
                avg_cv_tumor = pd.concat(cv_tumors, axis=1).mean(axis=1)

                cv_normals = []
                for c in cancer_names:
                    df = all_normal_dfs.get(c)
                    if df is None or df.empty:
                        continue
                    means = df.mean(axis=1)
                    stds = df.std(axis=1)
                    cvs = stds / means.replace(0, np.nan)
                    cvs = cvs.fillna(0)
                    cv_normals.append(cvs)
                if cv_normals:
                    avg_cv_normal = pd.concat(cv_normals, axis=1).mean(axis=1)
                else:
                    avg_cv_normal = pd.Series(0, index=avg_cv_tumor.index)

                # Score for ranking
                eps = 1e-8
                if cv_normals:
                    score = np.log2((avg_cv_tumor + eps) / (avg_cv_normal + eps))
                else:
                    score = avg_cv_tumor
                ranked_list = pd.DataFrame({
                    'gene': avg_cv_tumor.index,
                    'score': score
                }).sort_values(by='score', ascending=False)
                selected_genes = ranked_list['gene'].head(top_n).tolist()
                selected_genes = [g.upper() for g in selected_genes if g in library_genes]

            selected_genes = [g for g in selected_genes if g in library_genes]
            print(f"[DEBUG] Final selected genes for {method}: {len(selected_genes)}")

            # Compute heatmap data (per cancer means)
            heatmap_data = {}
            for cancer_name in cancer_names:
                tumor_df = all_tumor_dfs.get(cancer_name)
                normal_df = all_normal_dfs.get(cancer_name)
                if tumor_df is None:
                    print(f"[DEBUG] Skipping heatmap data for {cancer_name} due to missing tumor data for {method}")
                    continue
                tumor_mean = tumor_df.mean(axis=1)
                normal_mean = normal_df.mean(axis=1) if normal_df is not None and not normal_df.empty else pd.Series(0, index=tumor_df.index)
                for gene in selected_genes:
                    if gene not in heatmap_data:
                        heatmap_data[gene] = {}
                    tumor_value = tumor_mean.get(gene, 0)
                    normal_value = normal_mean.get(gene, 0)
                    try:
                        heatmap_data[gene][f"{cancer_name} Tumor"] = float(tumor_value) if pd.notnull(tumor_value) else 0.0
                        heatmap_data[gene][f"{cancer_name} Normal"] = float(normal_value) if pd.notnull(normal_value) else 0.0
                    except (TypeError, ValueError) as e:
                        print(f"[ERROR] Failed to convert values for gene {gene} in {cancer_name} for {method}: tumor={tumor_value}, normal={normal_value}, error={e}")
                        heatmap_data[gene][f"{cancer_name} Tumor"] = 0.0
                        heatmap_data[gene][f"{cancer_name} Normal"] = 0.0
                print(f"[DEBUG] Heatmap data for {cancer_name} ({method}): {list(heatmap_data.items())[:2]}")

            # Helper functions
            def safe_mean(df, gene):
                if gene not in df.index:
                    return 0.0
                vals = df.loc[gene].dropna().values
                return float(np.mean(vals)) if vals.size > 0 else 0.0

            def safe_cv(df, gene):
                if gene not in df.index:
                    return 0.0
                vals = df.loc[gene].dropna().values
                if vals.size < 2:
                    return 0.0
                mean = np.mean(vals)
                if mean == 0:
                    return 0.0
                std = np.std(vals)
                return float(std / mean)

            # Compute gene stats for selected genes per cancer
            gene_stats = {}
            for gene in selected_genes:
                gene_stats[gene] = {}
                for cancer_name in cancer_names:
                    display_cancer_name = reverse_cancer_mapping.get(cancer_name, cancer_name)
                    tumor_df = all_tumor_dfs.get(cancer_name)
                    normal_df = all_normal_dfs.get(cancer_name)
                    mean_tumor = safe_mean(tumor_df, gene) if tumor_df is not None and gene in tumor_df.index else 0.0
                    mean_normal = safe_mean(normal_df, gene) if normal_df is not None and gene in normal_df.index else 0.0
                    cv_tumor = safe_cv(tumor_df, gene) if tumor_df is not None and gene in tumor_df.index else 0.0
                    cv_normal = safe_cv(normal_df, gene) if normal_df is not None and gene in normal_df.index else 0.0
                    eps = 1e-8
                    logfc = cv_tumor - cv_normal
                    gene_stats[gene][display_cancer_name] = {
                        "mean_tumor": float(mean_tumor),
                        "mean_normal": float(mean_normal),
                        "cv_tumor": float(cv_tumor),
                        "cv_normal": float(cv_normal),
                        "logfc": float(logfc)
                    }
                print(f"[DEBUG] Gene stats for {gene} ({method}): {gene_stats[gene]}")

            # Perform enrichment analysis
            enrichment_results = []
            for gene_set in gene_sets:
                print(f"[DEBUG] Running {analysis_type} with gene set: {gene_set} for {method}")
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
                            print(f"[WARNING] No pathways found for {gene_set} in ORA analysis for {method}")
                            continue
                        results = results_df[["Term", "P-value", "Adjusted P-value", "Odds Ratio", "Combined Score", "Genes"]].head(10).to_dict(orient="records")
                        for res in results:
                            res["Genes"] = res["Genes"].split(";") if isinstance(res["Genes"], str) else []
                            res["GeneSet"] = gene_set
                        enrichment_results.extend(results)
                except Exception as e:
                    print(f"[WARNING] Failed to run {analysis_type} with {gene_set} for {method}: {str(e)}")
                    continue

            # Populate response for this normalization method
            response[method]["enrichment"] = enrichment_results
            response[method]["top_genes"] = selected_genes
            response[method]["gene_stats"] = gene_stats
            response[method]["heatmap_data"] = heatmap_data
            if not enrichment_results:
                response[method]["warning"] = (
                    (response[method]["warning"] or "") +
                    f" No pathways found for the provided genes with {method} normalization."
                ).strip()
            if any(df is None for df in all_normal_dfs.values()):
                response[method]["warning"] = (
                    (response[method]["warning"] or "") +
                    f" Normal data missing for some cancer types with {method} normalization; normal metrics and logfc set to 0 where applicable."
                ).strip()

            print(f"[INFO] Pathway analysis completed for {method}: enrichment={len(enrichment_results)}, top_genes={len(selected_genes)}")

        # Check if any normalization method produced valid results
        if not any(response[method]["enrichment"] or response[method]["top_genes"] for method in data_types):
            return jsonify({
                "error": "No valid data or pathways found for any normalization method",
                "hint": "Ensure gene symbols are uppercase and match KEGG_2021_Human or GO_Biological_Process_2021 identifiers, or check data file integrity"
            }), 500

        print(f"[INFO] Final pathway analysis response: {response}")
        return jsonify(response)

    except Exception as e:
        print(f"[ERROR] Pathway analysis failed: {e}")
        return jsonify({
            "error": f"Internal server error: {str(e)}",
            "hint": "Ensure gene symbols are uppercase and match KEGG_2021_Human or GO_Biological_Process_2021 identifiers, or check data file integrity"
        }), 500

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5001)