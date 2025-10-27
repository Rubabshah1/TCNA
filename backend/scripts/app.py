from fastapi import FastAPI, Query, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from typing import List, Dict, Optional, Set
from cv import cv_calculation
from std import std_calculation
from MAD import mad_calculation
from DEPTH2 import depth2_calculation
from DEPTH_ITH import depth_calculation
from cv_2 import cv2_calculation
from mean import mean_calculation
import gseapy as gp
import pymysql
import pandas as pd
import numpy as np
import math
import scipy.stats as stats
from statsmodels.stats.multitest import multipletests
import requests
import logging
from db_conn import get_connection
import io
from pydantic import BaseModel

# Logging setup
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# FastAPI setup
app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# === METRIC FUNCTIONS ===
metric_funcs_gene = {
    "cv": cv_calculation,
    "cv_squared": cv2_calculation,
    "std": std_calculation,
    "mad": mad_calculation,
    "mean": mean_calculation,
}

metric_funcs_TH = {
    "DEPTH2": depth2_calculation,
    "tITH": depth_calculation,
}


def sanitize_floats(obj):
    """Recursively replace NaN, inf, and -inf with None for JSON serialization."""
    if isinstance(obj, dict):
        return {k: sanitize_floats(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [sanitize_floats(v) for v in obj]
    elif isinstance(obj, float):
        return None if math.isnan(obj) or math.isinf(obj) else obj
    return obj

class GeneRequest(BaseModel):
    genes: List[str]

class Pathway(BaseModel):
    value: str
    label: str
    category: str

def compute_metrics(values: pd.Series):
    """Compute mean, std, mad, cv, and cv² for a numeric series."""
    if len(values) == 0:
        return None
    mean = values.mean()
    std = values.std(ddof=1)
    mad = (values - mean).abs().mean()
    cv = (std / mean) * 100 if mean != 0 else np.nan
    cv2 = cv**2 if not np.isnan(cv) else np.nan
    return {"mean": mean, "std": std, "mad": mad, "cv": cv, "cv_squared": cv2}


@app.get("/api/genes")
def get_genes():
    """Fetch all available gene symbols."""
    with get_connection() as conn:
        cur = conn.cursor()
        cur.execute("SELECT DISTINCT gene_symbol FROM genes WHERE gene_symbol IS NOT NULL ORDER BY gene_symbol")
        return {"genes": [row["gene_symbol"] for row in cur.fetchall()]}

@app.get("/api/sites")
def get_sites():
    """Fetch all available cancer sites."""
    with get_connection() as conn:
        cur = conn.cursor()
        cur.execute("SELECT id, name FROM sites ORDER BY name")
        return {"sites": cur.fetchall()}

@app.get("/api/cancer_types")
def get_cancer_types(site_ids: List[int] = Query(...)):
    """Fetch cancer types for given site IDs."""
    with get_connection() as conn:
        cur = conn.cursor()
        cur.execute("SELECT tcga_code, site_id FROM cancer_types WHERE site_id IN %s", (tuple(site_ids),))
        return {"cancer_types": cur.fetchall()}

@app.get("/api/gene_noise")
def get_gene_noise(
    cancer_site: List[str] = Query(...),
    cancer_type: Optional[List[str]] = Query(None),
    gene_ids: List[str] = Query(...)
):
    """Compute expression noise metrics for cancer sites and genes."""
    results = {}
    sample_counts = {}
    
    with get_connection() as conn:
        cur = conn.cursor()
        for site in cancer_site:
            cur.execute("SELECT id FROM sites WHERE name = %s", (site,))
            site_row = cur.fetchone()
            if not site_row:
                continue
            site_id = site_row["id"]

            # Fetch cancer types
            query = "SELECT tcga_code FROM cancer_types WHERE site_id = %s"
            params = [site_id]
            if cancer_type:
                query += " AND tcga_code IN %s"
                params.append(tuple(cancer_type))
            cur.execute(query, params)
            cancer_types = [row["tcga_code"] for row in cur.fetchall()]
            if not cancer_types:
                continue

            # Sample counts
            cur.execute(
                """
                SELECT s.sample_type, COUNT(*) AS count
                FROM samples s JOIN cancer_types c ON c.id = s.cancer_type_id
                WHERE c.site_id = %s AND c.tcga_code IN %s
                GROUP BY s.sample_type
                """,
                (site_id, tuple(cancer_types))
            )
            sample_counts[site] = {"tumor": 0, "normal": 0}
            for row in cur.fetchall():
                sample_counts[site][row["sample_type"].lower()] = row["count"]

            results[site] = {}
            for gene_input in gene_ids:
                cur.execute(
                    "SELECT id, gene_symbol FROM genes WHERE ensembl_id = %s OR gene_symbol = %s",
                    (gene_input, gene_input)
                )
                gene_row = cur.fetchone()
                if not gene_row:
                    continue
                gene_id, gene_symbol = gene_row["id"], gene_row["gene_symbol"]
                results[site][gene_symbol] = {}

                for norm_method in ["tpm", "fpkm", "fpkm_uq"]:
                    tumor_vals, normal_vals = [], []
                    for ct in cancer_types:
                        cur.execute(
                            f"""
                            SELECT s.sample_type, e.{norm_method} AS expr
                            FROM gene_expressions e
                            JOIN samples s ON s.id = e.sample_id
                            JOIN cancer_types c ON c.id = s.cancer_type_id
                            WHERE c.site_id = %s AND c.tcga_code = %s AND e.gene_id = %s
                            """,
                            (site_id, ct, gene_id)
                        )
                        df = pd.DataFrame(cur.fetchall())
                        tumor_vals.extend(df[df["sample_type"].str.lower() == "tumor"]["expr"])
                        normal_vals.extend(df[df["sample_type"].str.lower() == "normal"]["expr"])

                    tumor, normal = pd.Series(tumor_vals), pd.Series(normal_vals)
                    tumor_stats, normal_stats = compute_metrics(tumor), compute_metrics(normal)
                    
                    # Log2-transformed data
                    df_all = pd.DataFrame({"expr": list(tumor) + list(normal)})
                    df_all["log2_expr"] = np.log2(df_all["expr"] + 1)
                    tumor_log = df_all["log2_expr"][:len(tumor)]
                    normal_log = df_all["log2_expr"][len(tumor):]
                    tumor_stats_log, normal_stats_log = compute_metrics(tumor_log), compute_metrics(normal_log)
                    
                    logfc = tumor_stats_log.get("cv", 0) - normal_stats_log.get("cv", 0) if tumor_stats_log and normal_stats_log else np.nan
                    results[site][gene_symbol][norm_method] = {
                        "raw": {**tumor_stats, **{f"{k}_normal": v for k, v in normal_stats.items()}, "logfc": logfc},
                        "log2": {**tumor_stats_log, **{f"{k}_normal": v for k, v in normal_stats_log.items()}, "logfc": logfc},
                    }

    return JSONResponse(sanitize_floats({"results": results, "sample_counts": sample_counts}))

@app.get("/api/pathway-analysis")
def get_pathway_analysis(
    cancer: str = Query(...),
    genes: Optional[List[str]] = Query(None),
    top_n: int = Query(50),
    logfc_threshold: float = Query(0.7),
    mode: str = Query("enrichment"),
    network_type: str = Query("functional"),
    score_threshold: float = Query(0.4),
    pathway: Optional[str] = Query(None)
):
    """Perform pathway or network analysis for genes across cancer sites."""
    cancer_sites = [s.strip() for s in cancer.split(",") if s.strip()]
    with get_connection() as conn:
        cur = conn.cursor()
        gene_list, selected_gene_set, warning = get_genes(cur, genes, cancer_sites, logfc_threshold)
        
        if pathway:
            response = requests.get(f"https://string-db.org/api/json/enrichment?identifiers={'%0D'.join(genes)}&species=9606")
            response.raise_for_status()
            data = response.json()
            pathway_data = next((item for item in data if item["term"] == pathway), None)
            if not pathway_data:
                raise HTTPException(status_code=404, detail=f"Pathway '{pathway}' not found.")
            selected_gene_set = set(pathway_data["inputGenes"])
            cur.execute("SELECT id, gene_symbol FROM genes WHERE gene_symbol IN %s", (tuple(selected_gene_set),))
            gene_list = [row["id"] for row in cur.fetchall()]
            selected_gene_set = set(row["gene_symbol"] for row in cur.fetchall())

        sample_counts = get_sample_counts(cur, cancer_sites)
        results = compute_gene_stats(cur, cancer_sites, gene_list)
        string_results = run_stringdb_neighbors(selected_gene_set, network_type, score_threshold, top_n) if mode == "neighbors" else run_stringdb_enrichment(selected_gene_set, top_n)

        for scale in ["raw", "log2"]:
            for norm_method in ["tpm", "fpkm", "fpkm_uq"]:
                results[scale][norm_method]["top_genes"] = list(selected_gene_set)
                results[scale][norm_method][mode] = string_results

        results = sanitize_floats({
            "raw": results["raw"],
            "log2": results["log2"],
            "sample_counts": sample_counts,
            "available_sites": get_available_sites(cur),
            "warning": warning,
            "mode": mode,
        })
        print(results)
        return JSONResponse(results)

def run_stringdb_enrichment(gene_set: Set[str], top_n: int, species: int = 9606) -> List[Dict]:
    """Run STRINGdb enrichment for a gene set."""
    if not gene_set:
        return []
    try:
        response = requests.get(f"https://string-db.org/api/json/enrichment?identifiers={'%0D'.join(gene_set)}&species={species}")
        response.raise_for_status()
        data = response.json()
        category_map = {"Process": "GO:BP", "Function": "GO:MF", "Component": "GO:CC", "KEGG": "KEGG", "Reactome": "Reactome", "UniProt": "UniProt", "WikiPathways": "WikiPathways"}
        valid_categories = set(category_map.values())
        results = [
            {
                "Term": item["term"],
                "Database": category_map.get(item["category"], "Unknown"),
                "FDR": item["fdr"],
                "MatchingGenes": item["inputGenes"],
                "Description": item["description"],
                "GeneCount": len(item["inputGenes"]),
                "EnrichmentScore": -math.log10(item["fdr"] + 1e-10),
                "GeneSet": "STRINGdb"
            }
            for item in sorted(data, key=lambda x: x["fdr"])[:top_n]
            if category_map.get(item["category"]) in valid_categories
        ]
        return results
    except Exception as e:
        logger.error(f"STRING enrichment failed: {e}")
        return []

def run_stringdb_neighbors(gene_set: Set[str], network_type: str, score_threshold: float, top_n: int, species: int = 9606) -> List[Dict]:
    """Get nearest neighbor network from STRINGdb."""
    if not gene_set:
        return []
    try:
        response = requests.get(f"https://string-db.org/api/json/network?identifiers={'%0D'.join(gene_set)}&species={species}")
        response.raise_for_status()
        data = response.json()
        filtered = [x for x in data if x["score"] >= score_threshold and (network_type != "physical" or x.get("network_type") == "physical")]
        return [
            {"source": x["preferredName_A"], "target": x["preferredName_B"], "score": x["score"]}
            for x in sorted(filtered, key=lambda x: x["score"], reverse=True)[:top_n]
        ]
    except Exception as e:
        logger.error(f"STRING neighbors failed: {e}")
        return []

def get_genes(cur, genes_input: List[str], cancer_sites: List[str], logfc_threshold: float) -> tuple[List[int], Set[str], Optional[str]]:
    """Get gene list from input or auto-select top DE genes."""
    if genes_input:
        unique_genes = list(dict.fromkeys(g.strip().upper() for gene in genes_input for g in str(gene).split(",") if g.strip()))
        gene_list, gene_set = [], set()
        for gene_symbol in unique_genes:
            cur.execute("SELECT id, gene_symbol FROM genes WHERE gene_symbol = %s OR ensembl_id = %s", (gene_symbol, gene_symbol))
            row = cur.fetchone()
            if row:
                gene_list.append(row["id"])
                gene_set.add(row["gene_symbol"])
        return gene_list, gene_set, f"Found {len(gene_list)}/{len(unique_genes)} genes" if len(gene_list) < len(unique_genes) else None

    gene_list, gene_set = [], set()
    for site in cancer_sites[:2]:
        cur.execute("SELECT id FROM sites WHERE name = %s", (site,))
        site_row = cur.fetchone()
        if not site_row:
            continue
        cur.execute(
            """
            SELECT g.id, g.gene_symbol
            FROM genes g JOIN gene_expressions ge ON g.id = ge.gene_id
            JOIN samples s ON ge.sample_id = s.id JOIN cancer_types c ON s.cancer_type_id = c.id
            WHERE c.site_id = %s
            GROUP BY g.id, g.gene_symbol
            HAVING AVG(CASE WHEN s.sample_type = 'Normal' THEN ge.tpm END) > 0
            AND AVG(CASE WHEN s.sample_type = 'Tumor' THEN ge.tpm END) > 0
            ORDER BY ABS(LOG2(AVG(CASE WHEN s.sample_type = 'Tumor' THEN ge.tpm END)/AVG(CASE WHEN s.sample_type = 'Normal' THEN ge.tpm END))) DESC
            LIMIT 10
            """, (site_row["id"],))
        for row in cur.fetchall():
            gene_list.append(row["id"])
            gene_set.add(row["gene_symbol"])
    return list(set(gene_list)), gene_set, "No genes provided. Using top DE genes."

def get_sample_counts(cur, cancer_sites: List[str]) -> Dict[str, Dict[str, int]]:
    """Get tumor/normal sample counts per site."""
    counts = {}
    for site in cancer_sites:
        cur.execute(
            """
            SELECT s.sample_type, COUNT(*) as count
            FROM samples s JOIN cancer_types c ON s.cancer_type_id = c.id JOIN sites si ON c.site_id = si.id
            WHERE si.name = %s GROUP BY s.sample_type
            """, (site,))
        site_counts = {"tumor": 0, "normal": 0}
        for row in cur.fetchall():
            site_counts[row["sample_type"].lower()] = row["count"]
        counts[site] = site_counts
    return counts

def compute_gene_stats(cur, cancer_sites: List[str], gene_list: List[int]) -> Dict[str, Dict[str, Dict]]:
    """Compute stats for genes across normalization methods and scales."""
    results = {scale: {norm: {"gene_stats": {}, "heatmap_data": {}, "noise_metrics": {}, "enrichment": [], "network": [], "top_genes": []}
                      for norm in ["tpm", "fpkm", "fpkm_uq"]} for scale in ["raw", "log2"]}
    
    for norm_method in ["tpm", "fpkm", "fpkm_uq"]:
        for gene_id in gene_list:
            cur.execute("SELECT gene_symbol FROM genes WHERE id = %s", (gene_id,))
            gene_symbol = cur.fetchone()["gene_symbol"]
            
            for site in cancer_sites:
                cur.execute(
                    f"""
                    SELECT s.sample_type, e.{norm_method} as expr
                    FROM gene_expressions e JOIN samples s ON e.sample_id = s.id
                    JOIN cancer_types c ON s.cancer_type_id = c.id JOIN sites si ON c.site_id = si.id
                    WHERE si.name = %s AND e.gene_id = %s
                    """, (site, gene_id))
                df = pd.DataFrame(cur.fetchall())
                if df.empty:
                    continue
                
                tumor = df[df["sample_type"].str.lower() == "tumor"]["expr"]
                normal = df[df["sample_type"].str.lower() == "normal"]["expr"]
                tumor_stats, normal_stats = compute_metrics(tumor), compute_metrics(normal)
                
                df["log2_expr"] = np.log2(df["expr"] + 1)
                tumor_log = df[df["sample_type"].str.lower() == "tumor"]["log2_expr"]
                normal_log = df[df["sample_type"].str.lower() == "normal"]["log2_expr"]
                tumor_stats_log, normal_stats_log = compute_metrics(tumor_log), compute_metrics(normal_log)
                
                site_key = site.lower()
                for scale, t_stats, n_stats in [("raw", tumor_stats, normal_stats), ("log2", tumor_stats_log, normal_stats_log)]:
                    results[scale][norm_method]["gene_stats"].setdefault(gene_symbol, {})[site_key] = {
                        **t_stats, **{f"{k}_normal": v for k, v in n_stats.items()},
                        "logfc": math.log2(t_stats["cv"] / n_stats["cv"]) if t_stats and n_stats and n_stats.get("cv", 0) else np.nan
                    }
                    results[scale][norm_method]["heatmap_data"].setdefault(gene_symbol, {})[f"{site}_normal"] = n_stats.get("mean", 0)
                    results[scale][norm_method]["heatmap_data"][gene_symbol][f"{site}_tumor"] = t_stats.get("mean", 0)
                    results[scale][norm_method]["noise_metrics"].setdefault(gene_symbol, {})[site_key] = {
                        "cv_tumor": t_stats.get("cv", 0), "cv_normal": n_stats.get("cv", 0),
                        "logfc": math.log2(t_stats["cv"] / n_stats["cv"]) if t_stats and n_stats and n_stats.get("cv", 0) else np.nan
                    }
    return results

def get_available_sites(cur) -> List[Dict]:
    """Fetch all available sites."""
    cur.execute("SELECT id, name FROM sites ORDER BY name")
    return cur.fetchall()

@app.get("/api/tumor_results")
def get_tumor_results(cancer_site: str = Query(...), cancer_types: Optional[List[str]] = Query(None)):
    """Fetch tumor sample data with DEPTH2 and tITH scores."""
    with get_connection() as conn:
        cur = conn.cursor()
        cur.execute("SELECT id FROM sites WHERE name = %s", (cancer_site,))
        site_row = cur.fetchone()
        if not site_row:
            raise HTTPException(status_code=404, detail=f"Cancer site '{cancer_site}' not found.")
        site_id = site_row["id"]

        query = "SELECT id, tcga_code FROM cancer_types WHERE site_id = %s"
        params = [site_id]
        if cancer_types:
            query += " AND tcga_code IN %s"
            params.append(tuple(cancer_types))
        cur.execute(query, params)
        cancer_type_rows = cur.fetchall()
        if not cancer_type_rows:
            raise HTTPException(status_code=404, detail=f"No cancer types found for site '{cancer_site}'.")
        
        cancer_type_ids = [row["id"] for row in cancer_type_rows]
        cancer_type_map = {row["id"]: row["tcga_code"] for row in cancer_type_rows}

        cur.execute(
            """
            SELECT s.sample_type, COUNT(*) AS count
            FROM samples s JOIN cancer_types c ON c.id = s.cancer_type_id
            WHERE c.site_id = %s AND c.id IN %s GROUP BY s.sample_type
            """, (site_id, tuple(cancer_type_ids)))
        sample_counts = {"tumor": 0, "normal": 0}
        for row in cur.fetchall():
            sample_counts[row["sample_type"].lower()] = row["count"]

        cur.execute(
            """
            SELECT s.id AS sample_id, s.sample_barcode, s.cancer_type_id,
                   d.tpm AS tpm_depth2, d.fpkm AS fpkm_depth2, d.fpkm_uq AS fpkm_uq_depth2,
                   t.tpm AS tpm_tith, t.fpkm AS fpkm_tith, t.fpkm_uq AS fpkm_uq_tith
            FROM samples s JOIN cancer_types c ON c.id = s.cancer_type_id
            LEFT JOIN depth2_scores d ON d.sample_id = s.id
            LEFT JOIN tith_scores t ON t.sample_id = s.id
            WHERE c.site_id = %s AND c.id IN %s AND s.sample_type = 'tumor'
            """, (site_id, tuple(cancer_type_ids)))
        
        results = [
            {
                "sample_id": row["sample_id"],
                "sample_barcode": row["sample_barcode"],
                "cancer_type": cancer_type_map.get(row["cancer_type_id"], "Unknown"),
                **{k: row[k] for k in ["tpm_depth2", "fpkm_depth2", "fpkm_uq_depth2", "tpm_tith", "fpkm_tith", "fpkm_uq_tith"]}
            } for row in cur.fetchall()
        ]

        return JSONResponse(sanitize_floats({"results": results, "sample_counts": sample_counts, "error": None}))

@app.post("/api/csv-upload")
async def csv_upload(request: Request):
    try:
        form = await request.form()
        analysis_type = form.get('analysis_type', 'Pathway')
        top_n = int(form.get('top_n', 15))
        gene_set = form.get('gene_set', 'KEGG_2021_Human') if analysis_type == 'Pathway' else None
        genes = form.get('genes', '')

        logger.info(f"Input: analysis_type={analysis_type}, top_n={top_n}, gene_set={gene_set}, genes={genes}")

        valid_analysis_types = ['Gene', 'Pathway', 'Tumor']
        if analysis_type not in valid_analysis_types:
            return JSONResponse({"error": f"Invalid analysis type: {analysis_type}"}, status_code=400)

        selected_genes = [g.strip().upper() for g in genes.split(',') if g.strip()] if genes.strip() else None
        if analysis_type in ['Gene', 'Pathway'] and not selected_genes and 'expression_file' not in form:
            return JSONResponse({"error": "Gene or Pathway Analysis requires a gene list or expression data"}, status_code=400)

        # Initialize response
        response = {
            "analysis_type": analysis_type,
            "raw": {"warning": "Differential noise analysis (e.g., logFC) is not possible"},
            "log2": {"warning": "Differential noise analysis (e.g., logFC) is not possible"}
        } if analysis_type != 'Tumor' else {
            "analysis_type": analysis_type,
            "log2": {"warning": ""}
        }

        # Process uploaded expression file
        df_raw = None
        df_log2 = None
        if 'expression_file' in form:
            expression_file = form['expression_file']
            if not expression_file.filename:
                return JSONResponse({"error": "No expression file selected"}, status_code=400)
            if not expression_file.filename.endswith(('.csv', '.tsv')):
                return JSONResponse({"error": "Expression file must be CSV or TSV"}, status_code=400)
            delimiter = ',' if expression_file.filename.endswith('.csv') else '\t'

            # Read the CSV/TSV file
            content = await expression_file.read()
            df_raw = pd.read_csv(io.BytesIO(content), delimiter=delimiter)
            if not {'Hugo_Symbol', 'gene_name'}.intersection(df_raw.columns):
                return JSONResponse({"error": "Expression file must contain 'Hugo_Symbol' or 'gene_name' column"}, status_code=400)

            gene_column = 'gene_name' if 'gene_name' in df_raw.columns else 'Hugo_Symbol'
            gene_id = 'gene_id' if 'gene_id' in df_raw.columns else 'Entrez_Gene_Id' if 'Entrez_Gene_Id' in df_raw.columns else None
            df_raw[gene_column] = df_raw[gene_column].astype(str).str.upper()

            # Prepare raw and log2 data
            df_raw = df_raw.set_index(gene_column)
            if gene_id in df_raw.columns:
                df_raw = df_raw.drop(columns=[gene_id])
            df_raw = df_raw.apply(pd.to_numeric, errors='coerce')
            df_raw = df_raw.fillna(df_raw.median(numeric_only=True))
            df_log2 = np.log2(df_raw + 1)

        # Handle Gene Analysis
        if analysis_type == 'Gene':
            for transform, df in [('raw', df_raw), ('log2', df_log2)]:
                if df is not None:
                    top_genes = df.index.tolist() if selected_genes is None else [g for g in selected_genes if g in df.index]
                    if not top_genes:
                        return JSONResponse({"error": f"None of the provided genes found in {transform} expression data"}, status_code=400)
                    df = df.loc[top_genes]
                    metrics = {name: func(df).to_dict() for name, func in metric_funcs_gene.items()}
                else:
                    if not selected_genes:
                        return JSONResponse({"error": "Gene Analysis requires a gene list or expression data"}, status_code=400)
                    top_genes = selected_genes
                    metrics = {name: {gene: 0.0 for gene in top_genes} for name in metric_funcs_gene.keys()}
                response[transform].update({"metrics": metrics, "top_genes": top_genes})

        # Handle Pathway Analysis
        elif analysis_type == 'Pathway':
            for transform, df in [('raw', df_raw), ('log2', df_log2)]:
                if df is not None:
                    top_genes = df.index.tolist() if selected_genes is None else [g for g in selected_genes if g in df.index]
                    if not top_genes:
                        return JSONResponse({"error": f"None of the provided genes found in {transform} expression data"}, status_code=400)
                    df = df.loc[top_genes]
                    cv_values = metric_funcs_gene['cv'](df)
                    heatmap_data = {gene: {"mean": float(df.loc[gene].mean()), "cv": float(cv_values.get(gene, 0.0))} for gene in top_genes}
                else:
                    if not selected_genes:
                        return JSONResponse({"error": "Pathway Analysis requires a gene list or expression data"}, status_code=400)
                    top_genes = selected_genes
                    heatmap_data = {gene: {"mean": 0.0, "cv": 0.0} for gene in top_genes}

                enrichment_results = []
                try:
                    enr = gp.enrichr(gene_list=top_genes, gene_sets=gene_set, organism="Human", outdir=None, cutoff=0.05)
                    results_df = enr.results
                    if not results_df.empty:
                        results = results_df[["Term", "P-value", "Adjusted P-value", "Odds Ratio", "Combined Score", "Genes"]].head(top_n).to_dict(orient="records")
                        for res in results:
                            res["Genes"] = res["Genes"].split(";") if isinstance(res["Genes"], str) else []
                            res["GeneSet"] = gene_set
                        enrichment_results.extend(results)
                except Exception as e:
                    logger.error(f"Failed to run ORA with {gene_set} for {transform}: {e}")

                response[transform].update({
                    "enrichment": enrichment_results,
                    "top_genes": top_genes,
                    "heatmap_data": heatmap_data
                })

        # Handle Tumor Analysis
        elif analysis_type == 'Tumor':
            if df_log2 is None:
                return JSONResponse({"error": "Tumor Analysis requires an expression data file"}, status_code=400)
            all_metrics = {}
            for metric_name, func in metric_funcs_TH.items():
                try:
                    metric_series = func(df_log2)  # Compute across all samples
                    all_metrics[metric_name] = metric_series
                except Exception as e:
                    logger.error(f"Failed to compute {metric_name}: {e}")
                    all_metrics[metric_name] = pd.Series(0.0, index=df_log2.columns)

            metrics = []
            for sample in df_log2.columns:
                sample_metrics = {"sample": sample}
                for metric_name, metric_series in all_metrics.items():
                    val = metric_series.get(sample, 0.0)
                    sample_metrics[metric_name] = float(val) if pd.notna(val) else 0.0
                metrics.append(sample_metrics)
            response["log2"]["metrics"] = metrics

        logger.info(f"CSV upload response generated for {analysis_type} analysis")
        print(response)
        return JSONResponse(response)

    except Exception as e:
        logger.error(f"CSV upload failed: {e}")
        return JSONResponse({"error": f"Internal server error: {str(e)}"}, status_code=500)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=5001)