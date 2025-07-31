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
