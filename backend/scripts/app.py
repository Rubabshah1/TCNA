from fastapi import FastAPI, APIRouter, Query, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from typing import List, Dict, Optional, Set, Any
from cv import cv_calculation
from std import std_calculation
from MAD import mad_calculation
from DEPTH2 import depth2_calculation
from DEPTH_ITH import depth_calculation
from cv_2 import cv2_calculation
from mean import mean_calculation
from get_pathway_genes import fetch_kegg_genes, fetch_go_genes
import gseapy as gp
import re
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
router = APIRouter()
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

# site selector
@app.get("/api/sites")
def get_sites():
    """Fetch all available cancer sites."""
    conn = get_connection()
    cur = conn.cursor(pymysql.cursors.DictCursor)
    try:
        cur.execute("SELECT id, name FROM sites ORDER BY name ASC")
        sites = cur.fetchall()
        return JSONResponse({"sites": sites})
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
    finally:
        conn.close()

# gene selector
@app.get("/api/genes")
def get_genes():
    """Fetch all available gene symbols."""
    with get_connection() as conn:
        cur = conn.cursor()
        cur.execute("SELECT DISTINCT gene_symbol FROM genes WHERE gene_symbol IS NOT NULL ORDER BY gene_symbol")
        return {"genes": [row["gene_symbol"] for row in cur.fetchall()]}


# gene analysis 
@app.get("/api/gene_noise")
def get_gene_noise(
    cancer_site: list[str] = Query(..., description="One or more cancer sites (e.g., Lung, Liver, Adrenal Gland)"),
    cancer_type: list[str] = Query(None, description="Optional list of cancer types (TCGA codes)"),
    gene_ids: list[str] = Query(..., description="One or more gene IDs or symbols (e.g., TP53, EGFR)")
):
    """
    Compute expression noise metrics for one or more cancer sites and genes.
    Returns JSON with structure:
    {
      site: {
        gene_symbol: {
          norm_method: { "raw": {...}, "log2": {...} }
        }
      }
    }
    """
    conn = get_connection()
    cur = conn.cursor(pymysql.cursors.DictCursor)

    results = {}
    debug_info = {}
    sample_counts = {}

    try:
        for site in cancer_site:
            cur.execute("SELECT id FROM sites WHERE name = %s", (site,))
            site_row = cur.fetchone()
            if not site_row:
                debug_info[site] = {"error": f"Site '{site}' not found."}
                continue
            site_id = site_row["id"]

            # Determine all cancer types for this site
            if cancer_type:
                cur.execute(
                    "SELECT tcga_code FROM cancer_types WHERE site_id = %s AND tcga_code IN %s",
                    (site_id, tuple(cancer_type)),
                )
            else:
                cur.execute("SELECT tcga_code FROM cancer_types WHERE site_id = %s", (site_id,))
            cancer_types = [row["tcga_code"] for row in cur.fetchall()]

            if not cancer_types:
                debug_info[site] = {"error": f"No cancer types found for site '{site}'."}
                continue

            # Count tumor/normal samples for the site
            cur.execute(
                """
                SELECT s.sample_type, COUNT(*) AS count
                FROM samples s
                JOIN cancer_types c ON c.id = s.cancer_type_id
                WHERE c.site_id = %s AND c.tcga_code IN %s
                GROUP BY s.sample_type
                """,
                (site_id, tuple(cancer_types)),
            )
            site_counts = {"tumor": 0, "normal": 0}
            for row in cur.fetchall():
                stype = row["sample_type"].lower()
                if stype in site_counts:
                    site_counts[stype] = row["count"]
            sample_counts[site] = site_counts

            # Initialize results for this site
            results[site] = {}

            # Loop over all requested genes
            for gene_input in gene_ids:
                cur.execute(
                    "SELECT id, ensembl_id, gene_symbol FROM genes WHERE ensembl_id = %s OR gene_symbol = %s",
                    (gene_input, gene_input),
                )
                gene_row = cur.fetchone()
                if not gene_row:
                    debug_info.setdefault(site, {})[gene_input] = {"error": f"Gene '{gene_input}' not found."}
                    continue

                gene_id = gene_row["id"]
                gene_symbol = gene_row["gene_symbol"]
                ensembl_id = gene_row["ensembl_id"]

                # Prepare gene entry
                results[site][gene_symbol] = {}

                for norm_method in ["tpm", "fpkm", "fpkm_uq"]:
                    all_tumor_vals, all_normal_vals = [], []

                    for ct in cancer_types:
                        cur.execute(
                            f"""
                            SELECT s.sample_type, e.{norm_method} AS expr
                            FROM gene_expressions e
                            JOIN samples s ON s.id = e.sample_id
                            JOIN cancer_types c ON c.id = s.cancer_type_id
                            WHERE c.site_id = %s AND c.tcga_code = %s AND e.gene_id = %s
                            """,
                            (site_id, ct, gene_id),
                        )
                        rows = cur.fetchall()
                        if not rows:
                            continue
                        df = pd.DataFrame(rows)
                        all_tumor_vals.extend(df[df["sample_type"].str.lower() == "tumor"]["expr"].tolist())
                        all_normal_vals.extend(df[df["sample_type"].str.lower() == "normal"]["expr"].tolist())

                    tumor = pd.Series(all_tumor_vals)
                    normal = pd.Series(all_normal_vals)

                    tumor_stats = compute_metrics(tumor)
                    normal_stats = compute_metrics(normal)
                    logfc_raw = np.nan
                    if tumor_stats and normal_stats and normal_stats["cv"] > 0:
                        logfc_raw = math.log2((tumor_stats["cv"]/100) / (normal_stats["cv"]/100))

                    

                    # Log2-transformed
                    df_all = pd.DataFrame({
                        "sample_type": ["tumor"] * len(tumor) + ["normal"] * len(normal),
                        "expr": list(tumor) + list(normal),
                    })
                    df_all["log2_expr"] = np.log2(df_all["expr"] + 1)

                    tumor_log = df_all[df_all["sample_type"] == "tumor"]["log2_expr"]
                    normal_log = df_all[df_all["sample_type"] == "normal"]["log2_expr"]

                    tumor_stats_log = compute_metrics(tumor_log)
                    normal_stats_log = compute_metrics(normal_log)
                    logfc_log = np.nan
                    if tumor_stats_log and normal_stats_log:
                        logfc_log = (tumor_stats_log["cv"]/100) - (normal_stats_log["cv"]/100)

                    results[site][gene_symbol][norm_method] = {
                        "raw": {
                            **(tumor_stats or {}),
                            **{f"{k}_normal": v for k, v in (normal_stats or {}).items()},
                            "logfc": logfc_log,
                        },
                        "log2": {
                            **(tumor_stats_log or {}),
                            **{f"{k}_normal": v for k, v in (normal_stats_log or {}).items()},
                            "logfc": logfc_log,
                        },
                        
                    }
                    print(logfc_raw, logfc_log)

        final_output = {
            "results": sanitize_floats(results),
            "sample_counts": sample_counts,
        }

    except Exception as e:
        final_output = {"error": f"Unexpected error: {str(e)}"}
    finally:
        conn.close()

    # Clean up NaN, inf, etc. for JSON compliance
    results = sanitize_floats(final_output)
    print(results)
    return JSONResponse(results)
    # return JSONResponse(final_output)

# pathway analysis
@app.get("/api/gene-noise-pathway")
def get_gene_noise_pathway(
    cancer: str = Query(..., description="Comma-separated cancer sites"),
    genes: List[str] = Query(..., description="Gene symbols (comma-separated)"),
    cancer_types: Optional[List[str]] = Query(None, description="Optional list of TCGA cancer types (comma-separated or repeated)"),
):
    # cancer_sites = [s.strip() for s in cancer.split(",") if s.strip()]
    # gene_symbols = [g.strip().upper() for g in genes if g.strip()]
    # normalize cancer sites (accept comma-separated string)
    cancer_sites = [s.strip() for s in re.split(r"[,;]+", cancer) if s.strip()]

    # normalize genes: accept repeated params or a single comma-separated string
    gene_items: list[str] = []
    for g in genes:
        if not g:
            continue
        if isinstance(g, str) and ("," in g or ";" in g):
            gene_items.extend([x.strip() for x in re.split(r"[,;]+", g) if x.strip()])
        else:
            gene_items.append(str(g).strip())
    gene_symbols = [g.upper() for g in gene_items if g]

    # normalize optional cancer_types (TCGA codes); accept repeated or comma-separated
    cancer_type_items: Optional[list[str]] = None
    if cancer_types:
        tmp: list[str] = []
        for ct in cancer_types:
            if not ct:
                continue
            if isinstance(ct, str) and ("," in ct or ";" in ct):
                tmp.extend([x.strip().upper() for x in re.split(r"[,;]+", ct) if x.strip()])
            else:
                tmp.append(str(ct).strip().upper())
        cancer_type_items = tmp if tmp else None

    if not cancer_sites:
        raise HTTPException(status_code=400, detail="At least one cancer site is required")
    if not gene_symbols:
        raise HTTPException(status_code=400, detail="At least one gene symbol is required")
 

    with get_connection() as conn:
        cur = conn.cursor(pymysql.cursors.DictCursor)

        # ---- gene lookup -------------------------------------------------
        cur.execute(
            "SELECT id, gene_symbol FROM genes WHERE gene_symbol IN %s",
            (tuple(gene_symbols),)
        )
        gene_rows = cur.fetchall()
        gene_map = {r["gene_symbol"]: r["id"] for r in gene_rows}
        missing = set(gene_symbols) - set(gene_map.keys())
        if missing:
            raise HTTPException(status_code=400, detail=f"Genes not found: {', '.join(missing)}")

        sample_counts = get_sample_counts(cur, cancer_sites)

        results = {
            "sample_counts": sample_counts,
            "available_sites": get_available_sites(cur),
            "gene_noise": {norm: {} for norm in ["tpm", "fpkm", "fpkm_uq"]},
        }

        for norm_method in ["tpm", "fpkm", "fpkm_uq"]:
            for site in cancer_sites:
                site_key = site.lower()
                cur.execute("SELECT id FROM sites WHERE name = %s", (site,))
                site_row = cur.fetchone()
                if not site_row:
                    continue
                site_id = site_row["id"]
                # determine which cancer_type (TCGA codes) to use for this site
                if cancer_type_items:
                    cur.execute(
                        "SELECT tcga_code FROM cancer_types WHERE site_id = %s AND tcga_code IN %s",
                        (site_id, tuple(cancer_type_items)),
                    )
                else:
                    cur.execute("SELECT tcga_code FROM cancer_types WHERE site_id = %s", (site_id,))
                ct_rows = [r["tcga_code"] for r in cur.fetchall()]
                if not ct_rows:
                    # no matching cancer types for this site → skip site
                    continue

                for gene_symbol, gene_id in gene_map.items():
                    cur.execute(
                        f"""
                        SELECT s.sample_type, e.{norm_method} AS expr
                        FROM gene_expressions e
                        JOIN samples s ON e.sample_id = s.id
                        JOIN cancer_types c ON s.cancer_type_id = c.id
                        WHERE c.site_id = %s AND e.gene_id = %s
                        """,
                        (site_id, gene_id),
                    )
                  # filter by site and (optionally) by cancer_type codes for that site
                    if cancer_type_items:
                        cur.execute(
                            f"""
                            SELECT s.sample_type, e.{norm_method} AS expr
                            FROM gene_expressions e
                            JOIN samples s ON e.sample_id = s.id
                            JOIN cancer_types c ON s.cancer_type_id = c.id
                            WHERE c.site_id = %s AND e.gene_id = %s AND c.tcga_code IN %s
                            """,
                            (site_id, gene_id, tuple(ct_rows)),
                        )
                    else:
                        cur.execute(
                            f"""
                            SELECT s.sample_type, e.{norm_method} AS expr
                            FROM gene_expressions e
                            JOIN samples s ON e.sample_id = s.id
                            JOIN cancer_types c ON s.cancer_type_id = c.id
                            WHERE c.site_id = %s AND e.gene_id = %s
                            """,
                            (site_id, gene_id),
                        )
                    df = pd.DataFrame(cur.fetchall())
                    if df.empty:
                        continue

                    # ---- split tumor / normal ---------------------------------
                    tumor = df[df["sample_type"].str.lower() == "tumor"]["expr"]
                    normal = df[df["sample_type"].str.lower() == "normal"]["expr"]

                    # ---- compute tumor stats ----------------------------------
                    t_mean = float(tumor.mean()) if not tumor.empty else None
                    t_cv   = (float(tumor.std(ddof=1)) / t_mean * 100) if t_mean is not None else None

                    # ---- compute normal stats (may be empty) ------------------
                    n_mean = float(normal.mean()) if not normal.empty else None
                    n_cv   = (float(normal.std(ddof=1)) / n_mean * 100) if n_mean is not None else None

                    # ---- log2 for logfc ---------------------------------------
                    df["log2_expr"] = np.log2(df["expr"] + 1)
                    t_log = df[df["sample_type"].str.lower() == "tumor"]["log2_expr"]
                    n_log = df[df["sample_type"].str.lower() == "normal"]["log2_expr"]

                    t_cv_log = (float(t_log.std(ddof=1)) / t_log.mean() * 100) if t_log.mean() else None
                    n_cv_log = (float(n_log.std(ddof=1)) / n_log.mean() * 100) if n_log.mean() else None

                    logfc = None
                    if t_cv_log is not None and n_cv_log is not None:
                        logfc = float((t_cv_log/100) - (n_cv_log/100))

                    # ---- store only 5 fields ----------------------------------
                    results["gene_noise"][norm_method].setdefault(gene_symbol, {})[site_key] = {
                        "mean_tumor":   t_mean,
                        "mean_normal":  n_mean,
                        "cv_tumor":     t_cv,
                        "cv_normal":    n_cv,
                        "logfc":        logfc,
                    }

        # print(sanitize_floats(results))

        return JSONResponse(sanitize_floats(results))
    
# pathway analysis 
# enriched pathways
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List
import requests

router = APIRouter()

class GeneRequest(BaseModel):
    genes: List[str]

class Pathway(BaseModel):
    id: str
    value: str
    label: str
    category: str
    genes: List[str]


@app.post("/api/enriched-pathways", response_model=List[Pathway])
async def get_enriched_pathways(request: GeneRequest):
    """
    Query STRING-DB enrichment API for the provided genes.
    Returns only KEGG and GO pathways, with IDs included.
    """
    try:
        # Make STRING API request
        response = requests.post(
            "https://string-db.org/api/json/enrichment",
            data={
                "identifiers": "\n".join(request.genes),
                "species": 9606,
                "caller_identity": "app",
            },
            timeout=10,
        )
        response.raise_for_status()
        data = response.json()

        pathways = []
        for item in data:
            category = item.get("category", "").lower()

            # Filter: keep only KEGG and GO terms
            if not any(cat in category for cat in ["kegg", "process", "function", "component"]):
                continue

            # Skip publication/PMID categories
            if any(kw in category for kw in ["pubmed", "pmid", "publication"]):
                continue

            # Extract gene list
            genes_raw = item.get("inputGenesList") or item.get("inputGenes") or []
            if isinstance(genes_raw, str):
                genes = [g.strip() for g in genes_raw.split(",") if g.strip()]
            elif isinstance(genes_raw, list):
                genes = genes_raw
            else:
                genes = []

            # Build the structured response
            pathways.append({
                "id": item.get("term", ""),
                "value": item.get("term", ""),
                "description": item.get("description", ""),
                "label": f"{item.get('description', 'Unknown')} "
                         f"(FDR: {item.get('fdr')}, Category: {item.get('category')})",
                "category": item.get("category", ""),
                "genes": genes,
            })

        print("=== FILTERED ENRICHMENT RESPONSE ===")
        print(pathways[:2])  # log first 2 results for debugging

        return pathways

    except requests.RequestException as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch enriched pathways: {str(e)}")

from fastapi import APIRouter, HTTPException, Query
from typing import List, Optional, Set
import requests
import re

router = APIRouter()

@app.get("/api/get-genes")
def get_genes_for_pathway(pathway: str):
    """Return all gene symbols for a given KEGG or GO pathway."""
    if not pathway:
        raise HTTPException(status_code=400, detail="Pathway ID required")

    if pathway.upper().startswith("GO:"):
        genes = fetch_go_genes(pathway)
    else:
        genes = fetch_kegg_genes(pathway)

    return {"pathway": pathway, "genes": genes}

def fetch_kegg_genes(pathway_id: str) -> List[str]:
    """Fetch all genes in a KEGG pathway using REST API."""
    try:
        resp = requests.get(f"https://rest.kegg.jp/get/{pathway_id}", timeout=10)
        resp.raise_for_status()
        text = resp.text
    except requests.RequestException as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch KEGG genes: {str(e)}")

    # Example lines: "10000  AKT3; AKT serine/threonine kinase 3"
    genes = re.findall(r"\d+\s+([A-Za-z0-9_-]+);", text)
    return list(sorted(set(genes)))


def fetch_go_genes(go_id: str, taxon: int = 9606) -> List[str]:
    """Fetch all human gene symbols annotated with a GO term from QuickGO."""
    url = f"https://www.ebi.ac.uk/QuickGO/services/annotation/search?goId={go_id}&taxonId={taxon}"
    try:
        resp = requests.get(url, timeout=10, headers={"Accept": "application/json"})
        resp.raise_for_status()
        data = resp.json()
    except requests.RequestException as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch GO genes: {str(e)}")

    # Extract unique symbols
    genes = {r["symbol"].strip() for r in data.get("results", []) if r.get("symbol")}
    return list(sorted(genes))


@app.get("/api/pathway-analysis")
def get_pathway_analysis(
    cancer: str = Query(...),
    genes: Optional[List[str]] = Query(None),
    top_n: int = Query(1000),
    logfc_threshold: float = Query(0.7),
    mode: str = Query("enrichment"),
    network_type: str = Query("functional"),
    score_threshold: float = Query(0.4),
    pathway: Optional[str] = Query(None)
):
    """
    Perform pathway or network analysis for genes across cancer sites.
    If `pathway` (KEGG or GO ID) is provided, fetch its genes from KEGG or QuickGO first.
    """
    cancer_sites = [s.strip() for s in cancer.split(",") if s.strip()]

    with get_connection() as conn:
        cur = conn.cursor()
        gene_list, selected_gene_set, warning = get_genes(cur, genes, cancer_sites, logfc_threshold)

        # --- NEW LOGIC: fetch pathway genes (KEGG or GO) ---
        if pathway:
            if pathway.upper().startswith("GO:"):
                fetched_genes = fetch_go_genes(pathway)
            else:
                fetched_genes = fetch_kegg_genes(pathway)

            if not fetched_genes:
                raise HTTPException(status_code=404, detail=f"No genes found for pathway '{pathway}'")

            # ensure they exist in DB
            cur.execute("SELECT id, gene_symbol FROM genes WHERE gene_symbol IN %s", (tuple(fetched_genes),))
            gene_rows = cur.fetchall()

            if not gene_rows:
                raise HTTPException(status_code=404, detail=f"No pathway genes found in database for '{pathway}'")

            gene_list = [row["id"] for row in gene_rows]
            selected_gene_set = set(row["gene_symbol"] for row in gene_rows)

        # --- Existing downstream analysis ---
        sample_counts = get_sample_counts(cur, cancer_sites)
        results = compute_gene_stats(cur, cancer_sites, gene_list)

        string_results = (
            run_stringdb_neighbors(selected_gene_set, network_type, score_threshold, top_n)
            if mode == "neighbors"
            else run_stringdb_enrichment(selected_gene_set, top_n)
        )

        # attach results
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

        return JSONResponse(sanitize_floats(results))



# # pathway results dashboard
# @app.get("/api/pathway-analysis")
# def get_pathway_analysis(
#     cancer: str = Query(...),
#     genes: Optional[List[str]] = Query(None),
#     top_n: int = Query(1000),
#     logfc_threshold: float = Query(0.7),
#     mode: str = Query("enrichment"),
#     network_type: str = Query("functional"),
#     score_threshold: float = Query(0.4),
#     pathway: Optional[str] = Query(None)
# ):
#     """Perform pathway or network analysis for genes across cancer sites."""
#     cancer_sites = [s.strip() for s in cancer.split(",") if s.strip()]
#     with get_connection() as conn:
#         cur = conn.cursor()
#         gene_list, selected_gene_set, warning = get_genes(cur, genes, cancer_sites, logfc_threshold)
        
#         if pathway:
#             response = requests.get(f"https://string-db.org/api/json/enrichment?identifiers={'%0D'.join(genes)}&species=9606")
#             response.raise_for_status()
#             data = response.json()
#             pathway_data = next((item for item in data if item["term"] == pathway), None)
#             if not pathway_data:
#                 raise HTTPException(status_code=404, detail=f"Pathway '{pathway}' not found.")
#             selected_gene_set = set(pathway_data["inputGenes"])
#             cur.execute("SELECT id, gene_symbol FROM genes WHERE gene_symbol IN %s", (tuple(selected_gene_set),))
#             gene_list = [row["id"] for row in cur.fetchall()]
#             # selected_gene_set = set(row["gene_symbol"] for row in cur.fetchall())
#             selected_gene_set = set(pathway_data.get("inputGenes", []) or [])
#             # if STRING returned no genes for this term, keep existing behaviour (error/fallback)
#             if not selected_gene_set:
#                 raise HTTPException(status_code=404, detail=f"No genes found for pathway '{pathway}'.")
#             # query DB once and use the fetched rows
#             cur.execute("SELECT id, gene_symbol FROM genes WHERE gene_symbol IN %s", (tuple(selected_gene_set),))
#             gene_rows = cur.fetchall()
#             gene_list = [row["id"] for row in gene_rows]
#             # rebuild selected_gene_set from DB results (ensures symbols actually exist in our DB)
#             selected_gene_set = set(row["gene_symbol"] for row in gene_rows)
#             if not gene_list:
#                 raise HTTPException(status_code=404, detail=f"No pathway genes found in database for '{pathway}'.")


#         sample_counts = get_sample_counts(cur, cancer_sites)
#         results = compute_gene_stats(cur, cancer_sites, gene_list)
#         print(selected_gene_set)
#         string_results = run_stringdb_neighbors(selected_gene_set, network_type, score_threshold, top_n) if mode == "neighbors" else run_stringdb_enrichment(selected_gene_set, top_n)
#         print("\nSTRING RESULTS:\n",string_results)
#         for scale in ["raw", "log2"]:
#             for norm_method in ["tpm", "fpkm", "fpkm_uq"]:
#                 results[scale][norm_method]["top_genes"] = list(selected_gene_set)
#                 results[scale][norm_method][mode] = string_results

#         results = sanitize_floats({
#             "raw": results["raw"],
#             "log2": results["log2"],
#             "sample_counts": sample_counts,
#             "available_sites": get_available_sites(cur),
#             "warning": warning,
#             "mode": mode,
#         })
#         # print(results)
#         return JSONResponse(sanitize_floats(results))

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
                # "EnrichmentScore": item["p-value"],
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
        print(genes_input)
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

        # gene_list, gene_set = [], set()
        # for site in cancer_sites[:2]:
        #     cur.execute("SELECT id FROM sites WHERE name = %s", (site,))
        #     site_row = cur.fetchone()
        #     if not site_row:
        #         continue
        #     cur.execute(
        #         """
        #         SELECT g.id, g.gene_symbol
        #         FROM genes g JOIN gene_expressions ge ON g.id = ge.gene_id
        #         JOIN samples s ON ge.sample_id = s.id JOIN cancer_types c ON s.cancer_type_id = c.id
        #         WHERE c.site_id = %s
        #         GROUP BY g.id, g.gene_symbol
        #         HAVING AVG(CASE WHEN s.sample_type = 'Normal' THEN ge.tpm END) > 0
        #         AND AVG(CASE WHEN s.sample_type = 'Tumor' THEN ge.tpm END) > 0
        #         ORDER BY ABS(LOG2(AVG(CASE WHEN s.sample_type = 'Tumor' THEN ge.tpm END)/AVG(CASE WHEN s.sample_type = 'Normal' THEN ge.tpm END))) DESC
        #         LIMIT 10
        #         """, (site_row["id"],))
        #     for row in cur.fetchall():
        #         gene_list.append(row["id"])
        #         gene_set.add(row["gene_symbol"])
        # print(gene_list, gene_set)
        # return list(set(gene_list)), gene_set, "No genes provided. Using top DE genes."
    
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
                # for scale, t_stats, n_stats in [("raw", tumor_stats, normal_stats), ("log2", tumor_stats_log, normal_stats_log)]:
                #     results[scale][norm_method]["gene_stats"].setdefault(gene_symbol, {})[site_key] = {
                #         **t_stats, **{f"{k}_normal": v for k, v in n_stats.items()},
                #         "logfc": math.log2(t_stats["cv"] / n_stats["cv"]) if t_stats and n_stats and n_stats.get("cv", 0) else np.nan
                #     }
                for scale, t_stats, n_stats in [("raw", tumor_stats, normal_stats), ("log2", tumor_stats_log, normal_stats_log)]:
                    # convert tumor keys to *_tumor and normal keys to *_normal so frontend can read mean_tumor/cv_tumor
                    tumor_suff = {f"{k}_tumor": v for k, v in (t_stats or {}).items()}
                    normal_suff = {f"{k}_normal": v for k, v in (n_stats or {}).items()}
                    # logfc_val = tumor_stats_log.get("cv", 0) - normal_stats_log.get("cv", 0) if tumor_stats_log and normal_stats_log else np.nan
                    # # logfc_val = (math.log2((t_stats.get("cv", 0) / n_stats.get("cv", 1))) 
                    # #              if t_stats and n_stats and n_stats.get("cv", 0) else np.nan)
                    # results[scale][norm_method]["gene_stats"].setdefault(gene_symbol, {})[site_key] = {
                    #     **tumor_suff,
                    #     **normal_suff,
                    #     "logfc": logfc_val
                    # }
                    # results[scale][norm_method]["heatmap_data"].setdefault(gene_symbol, {})[f"{site}_normal"] = n_stats.get("mean", 0)
                    # results[scale][norm_method]["heatmap_data"][gene_symbol][f"{site}_tumor"] = t_stats.get("mean", 0)
                    # results[scale][norm_method]["noise_metrics"].setdefault(gene_symbol, {})[site_key] = {
                    #     "cv_tumor": t_stats.get("cv", 0), "cv_normal": n_stats.get("cv", 0),
                    #     # "logfc": math.log2(t_stats["cv"] / n_stats["cv"]) if t_stats and n_stats and n_stats.get("cv", 0) else np.nan
                    #     "logfc": logfc_val
                    # }
                    # safely handle missing tumor/normal stats
                    t = t_stats or {}
                    n = n_stats or {}
                    # compute logfc using available cv values, otherwise NaN
                    logfc_val = (((t.get("cv")/100) - (n.get("cv")/100))
                                 if (t.get("cv") is not None and n.get("cv") is not None)
                                 else float("nan"))

                    results[scale][norm_method]["gene_stats"].setdefault(gene_symbol, {})[site_key] = {
                        **{f"{k}_tumor": v for k, v in t.items()},
                        **{f"{k}_normal": v for k, v in n.items()},
                        "logfc": logfc_val,
                    }
                    # ensure heatmap_data entry exists and write mean safely
                    results[scale][norm_method]["heatmap_data"].setdefault(gene_symbol, {})
                    results[scale][norm_method]["heatmap_data"][gene_symbol][f"{site}_normal"] = n.get("mean", 0)
                    results[scale][norm_method]["heatmap_data"][gene_symbol][f"{site}_tumor"] = t.get("mean", 0)
                    results[scale][norm_method]["noise_metrics"].setdefault(gene_symbol, {})[site_key] = {
                        "cv_tumor": t.get("cv", 0),
                        "cv_normal": n.get("cv", 0),
                        "logfc": logfc_val,
                   }
    return sanitize_floats(results)

# cancer project selector
@app.get("/api/cancer_types")
def get_cancer_types(site_ids: List[int] = Query(...)):
    """Fetch cancer types for given site IDs."""
    with get_connection() as conn:
        cur = conn.cursor()
        cur.execute("SELECT tcga_code, site_id FROM cancer_types WHERE site_id IN %s", (tuple(site_ids),))
        return {"cancer_types": cur.fetchall()}


def get_available_sites(cur) -> List[Dict]:
    """Fetch all available sites."""
    cur.execute("SELECT id, name FROM sites ORDER BY name")
    return cur.fetchall()

# tumor analysis
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
                   t.tpm AS tpm_depth, t.fpkm AS fpkm_depth, t.fpkm_uq AS fpkm_uq_depth
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
                **{k: row[k] for k in ["tpm_depth2", "fpkm_depth2", "fpkm_uq_depth2", "tpm_depth", "fpkm_depth", "fpkm_uq_depth"]}
            } for row in cur.fetchall()
        ]
        # === NEW: TOP 50 NOISY GENES (per normalization) ===
        # tcga_codes = [row["tcga_code"] for row in cancer_type_rows]
        # top_noisy = {}
        # for norm in ("tpm", "fpkm", "fpkm_uq"):
        #     top_noisy[norm] = _top_noisy_genes(cur, site_id, tcga_codes if cancer_types else None, norm)

        return JSONResponse(sanitize_floats({
            "results": results,
            "sample_counts": sample_counts,
            # "top_noisy_genes": top_noisy,   # <-- ONLY ADDED FIELD
            "error": None
        }))

        # return JSONResponse(sanitize_floats({"results": results, "sample_counts": sample_counts, "error": None}))

# def _top_noisy_genes(cur, site_id: int, tcga_codes: Optional[List[str]], norm: str):
#     """
#     Return top-50 genes by CV (same formula as compute_metrics) for tumor & normal.
#     """
#     where_tcga = ""
#     params: List[Any] = [site_id]
#     if tcga_codes:
#         where_tcga = "AND c.tcga_code IN %s"
#         params.append(tuple(tcga_codes))

#     sql = f"""
#         SELECT g.gene_symbol,
#                s.sample_type,
#                e.{norm} AS expr
#         FROM gene_expressions e
#         JOIN samples      s ON e.sample_id = s.id
#         JOIN cancer_types c ON s.cancer_type_id = c.id
#         JOIN genes        g ON e.gene_id = g.id
#         WHERE c.site_id = %s {where_tcga}
#           AND e.{norm} IS NOT NULL
#     """
#     cur.execute(sql, params)
#     rows = cur.fetchall()
#     if not rows:
#         return {"tumor": [], "normal": []}
    
#     df = pd.DataFrame(rows)
#     tumor  = df[df["sample_type"].str.lower() == "tumor"]
#     normal = df[df["sample_type"].str.lower() == "normal"]

#     def _cv(df_part: pd.DataFrame) -> List[Dict]:
#         if df_part.empty:
#             return []
#         out = []
#         for gene, series in df_part.groupby("gene_symbol")["expr"]:
#             stats = compute_metrics(series)          # SAME FUNCTION AS /gene_noise
#             if stats and stats["mean"] > 0:
#                 out.append({"gene_symbol": gene, "cv": round(stats["cv"], 4)})
#         return sorted(out, key=lambda x: x["cv"], reverse=True)[:50]

#     return {"tumor": _cv(tumor), "normal": _cv(normal)}
import json
import json  # Make sure this is at the top

def _top_noisy_genes(cur, site_id: int, tcga_codes: Optional[List[str]], norm: str):
    """
    Top-50 genes by CV = (STDDEV_SAMP / AVG) * 100
    Fully in MariaDB, no Python loop, works on 60k+ genes.
    """
    where_tcga = ""
    params: List[Any] = [site_id]
    if tcga_codes:
        where_tcga = "AND c.tcga_code IN %s"
        params.append(tuple(tcga_codes))

    sql = f"""
        WITH stats AS (
            SELECT
                s.sample_type,
                g.gene_symbol,
                AVG(e.{norm}) AS mean_val,
                STDDEV_SAMP(e.{norm}) AS std_val,
                COUNT(e.{norm}) AS n_samples
            FROM gene_expressions e
            JOIN samples s      ON e.sample_id = s.id
            JOIN cancer_types c ON s.cancer_type_id = c.id
            JOIN genes g        ON e.gene_id = g.id 
            WHERE c.site_id = %s {where_tcga}
              AND e.{norm} IS NOT NULL
            GROUP BY s.sample_type, g.id, g.gene_symbol
            HAVING n_samples >= 3 AND mean_val > 0
        ),
        ranked AS (
            SELECT
                sample_type,
                gene_symbol,
                (std_val / mean_val) * 100 AS cv,
                ROW_NUMBER() OVER (PARTITION BY sample_type ORDER BY (std_val / mean_val) DESC) AS rn
            FROM stats
        ),
        top50 AS (
            SELECT sample_type, gene_symbol, cv
            FROM ranked
            WHERE rn <= 50
        )
        SELECT
            sample_type AS tissue,
            JSON_ARRAYAGG(
                JSON_OBJECT('gene_symbol', gene_symbol, 'cv', ROUND(cv, 4))
            ) AS top_genes
        FROM top50
        GROUP BY sample_type;
    """

    cur.execute(sql, params)
    rows = cur.fetchall()

    result = {"tumor": [], "normal": []}
    for row in rows:
        tissue = row["tissue"].lower()
        genes_json = row["top_genes"]
        if genes_json:
            result[tissue] = json.loads(genes_json)
    return result

@app.post("/api/csv-upload")
async def csv_upload(request: Request):
    """Handle CSV/TSV file upload for gene, pathway, or tumor analysis."""
    try:
        form = await request.form()
        analysis_type = form.get('analysis_type', 'Pathway')
        top_n = int(form.get('top_n', 15))
        gene_set = form.get('gene_set', 'KEGG_2021_Human') if analysis_type == 'Pathway' else None
        genes = form.get('genes', '')
        
        if analysis_type not in ['Gene', 'Pathway', 'Tumor']:
            raise HTTPException(status_code=400, detail=f"Invalid analysis type: {analysis_type}")

        selected_genes = [g.strip().upper() for g in genes.split(',') if g.strip()] if genes.strip() else None
        if analysis_type in ['Gene', 'Pathway'] and not selected_genes and 'expression_file' not in form:
            raise HTTPException(status_code=400, detail="Gene or Pathway Analysis requires a gene list or expression data")

        response = {
            "analysis_type": analysis_type,
            "raw": {"warning": "Differential noise analysis not possible"},
            "log2": {"warning": "Differential noise analysis not possible" if analysis_type != 'Tumor' else ""}
        }

        df_raw = None
        if 'expression_file' in form:
            expression_file = form['expression_file']
            if not expression_file.filename.endswith(('.csv', '.tsv')):
                raise HTTPException(status_code=400, detail="Expression file must be CSV or TSV")
            df_raw = pd.read_csv(io.BytesIO(await expression_file.read()), delimiter=',' if expression_file.filename.endswith('.csv') else '\t')
            
            gene_column = 'gene_name' if 'gene_name' in df_raw.columns else 'Hugo_Symbol'
            if gene_column not in df_raw.columns:
                raise HTTPException(status_code=400, detail="Expression file must contain 'Hugo_Symbol' or 'gene_name' column")
            
            df_raw[gene_column] = df_raw[gene_column].astype(str).str.upper()
            df_raw = df_raw.set_index(gene_column).select_dtypes(include=np.number).fillna(df_raw.median(numeric_only=True))
            df_log2 = np.log2(df_raw + 1)

        if analysis_type == 'Gene':
            for transform, df in [('raw', df_raw), ('log2', df_log2)]:
                top_genes = df.index.tolist() if selected_genes is None else [g for g in selected_genes if g in df.index]
                if df is not None and not top_genes:
                    raise HTTPException(status_code=400, detail=f"None of the provided genes found in {transform} data")
                metrics = {name: func(df.loc[top_genes]).to_dict() for name, func in metric_funcs_gene.items()} if df is not None else {name: {gene: 0.0 for gene in selected_genes} for name in metric_funcs_gene}
                response[transform].update({"metrics": metrics, "top_genes": top_genes})

        elif analysis_type == 'Pathway':
            for transform, df in [('raw', df_raw), ('log2', df_log2)]:
                top_genes = df.index.tolist() if selected_genes is None else [g for g in selected_genes if g in df.index]
                if df is not None and not top_genes:
                    raise HTTPException(status_code=400, detail=f"None of the provided genes found in {transform} data")
                heatmap_data = {gene: {"mean": float(df.loc[gene].mean()), "cv": float(metric_funcs_gene['cv'](df.loc[gene]))} for gene in top_genes} if df is not None else {gene: {"mean": 0.0, "cv": 0.0} for gene in selected_genes}
                response[transform].update({"enrichment": [], "top_genes": top_genes, "heatmap_data": heatmap_data})

        elif analysis_type == 'Tumor':
            if df_log2 is None:
                raise HTTPException(status_code=400, detail="Tumor Analysis requires expression data")
            metrics = []
            for sample in df_log2.columns:
                sample_metrics = {"sample": sample}
                for name, func in metric_funcs_TH.items():
                    val = func(df_log2[sample])
                    sample_metrics[name] = float(val) if pd.notna(val) else 0.0
                metrics.append(sample_metrics)
            response["log2"]["metrics"] = metrics

        return JSONResponse(response)
    except Exception as e:
        logger.error(f"CSV upload failed: {e}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=5001)



# # pathway analysis
# # def safe_get_string_pathway_genes(
# #     pathway: str | None,
# #     genes: list[str],
# #     min_score: float = 0.0,
# # ) -> list[str]:
# #     """
# #     Try to resolve a STRING term → gene list.
# #     If the term is missing or STRING returns 404, fall back to the
# #     user-supplied `genes` list.
# #     """
# #     if not pathway:
# #         return genes

# #     try:
# #         # ---- original STRING call (unchanged) ----
# #         payload = {
# #             "identifiers": "\n".join(genes),
# #             "species": 9606,
# #             "caller_identity": "app",
# #             "additional_network_nodes": 0,
# #             "network_flavor": "confidence",
# #             "min_score": min_score,
# #         }
# #         r = requests.post(
# #             "https://string-db.org/api/json/enrichment",
# #             data=payload,
# #             timeout=15,
# #         )

# #         r.raise_for_status()
# #         data = r.json()
# #         print(data)

# #         # Find the term we asked for
# #         for entry in data:
# #             if entry.get("term") == pathway:
# #                 print(entry)
# #                 return entry.get("inputGenes", [])
# #         # term not found in results → fall back
# #         logger.warning(
# #             "STRING term %s not present in enrichment result – using supplied genes",
# #             pathway,
# #         )
# #         return genes

# #     except requests.exceptions.HTTPError as exc:
# #         # 404 (or any other HTTP error) → log + fallback
# #         logger.warning(
# #             "STRING enrichment failed for term %s (%s) – using supplied genes",
# #             pathway,
# #             exc,
# #         )
# #         return genes
# #     except Exception as exc:   # network timeout, JSON decode, etc.
# #         logger.error("Unexpected error while calling STRING: %s", exc)
# #         return genes
# def safe_get_string_pathway_genes(
#     pathway: str | None,
#     genes: list[str],
#     min_score: float = 0.0,
# ) -> list[str]:
#     """
#     Resolve a STRING term (GOCC:…, KEGG:…, BTO:…, etc.) → **only the genes that belong to it**.

#     * No fallback to the user-supplied `genes`.
#     * Returns [] if the term is missing or STRING errors.
#     """
#     if not pathway:
#         logger.debug("No pathway supplied – returning empty gene list")
#         return []

#     # -----------------------------------------------------------------
#     # 1. Normalise the incoming term
#     # -----------------------------------------------------------------
#     # STRING returns plain IDs:
#     #   GOCC:0000800  →  GO:0000800
#     #   GOBP:0008152  →  GO:0008152
#     #   BTO:0002553   →  BTO:0002553
#     #   REAC:12345    →  Reactome:12345
#     # normalized_pathway = re.sub(r"^(GOCC|GOBP|GOMF):", r"GO:", pathway, flags=re.IGNORECASE)
#     # keep other prefixes unchanged
#     # normalized_pathway = re.sub(r"^REAC:", "Reactome:", normalized_pathway, flags=re.IGNORECASE)

#     try:
#         # -----------------------------------------------------------------
#         # 2. Call STRING enrichment (unchanged)
#         # -----------------------------------------------------------------
#         payload = {
#             "identifiers": "\n".join(genes),
#             "species": 9606,
#             "caller_identity": "app",
#             "additional_network_nodes": 0,
#             "network_flavor": "confidence",
#             "min_score": min_score,
#         }
#         r = requests.post(
#             "https://string-db.org/api/json/enrichment",
#             data=payload,
#             timeout=15,
#         )
#         r.raise_for_status()
#         data = r.json()

#         logger.debug("STRING enrichment response: %s", data)

#         # -----------------------------------------------------------------
#         # 3. Find the exact term and return its genes
#         # -----------------------------------------------------------------
#         for entry in data:
#             if entry.get("term") == pathway:
#                 matched_genes = entry.get("inputGenes", [])
#                 logger.info(
#                     "Pathway %s matched – %d confident genes: %s",
#                     pathway, len(matched_genes), matched_genes
#                 )
#                 return matched_genes

#         # -----------------------------------------------------------------
#         # 4. Term not found → empty list (no fallback!)
#         # -----------------------------------------------------------------
#         logger.warning(
#             "STRING term %s (normalized %s) not found in enrichment result – returning []",
#             pathway, pathway,
#         )
#         return []

#     except requests.exceptions.HTTPError as exc:
#         logger.warning(
#             "STRING enrichment HTTP error for term %s: %s – returning []",
#             pathway, exc,
#         )
#         return []
#     except Exception as exc:
#         logger.error("Unexpected error while calling STRING: %s", exc)
#         return []
    
# @app.get("/api/pathway-results")
# async def pathway_results(
#     cancer: str = Query(..., description="Comma-separated site names, e.g. Bone+Marrow+and+Blood"),
#     cancer_type: str | None = Query(None, description="Optional TCGA code, e.g. LAML"),
#     top_n: int = Query(100, ge=1, le=500),
#     library: str = Query("KEGG_2021_Human"),
#     mode: str = Query("enrichment"),
#     genes: str | None = Query(None, description="Comma-separated gene symbols"),
#     pathway: str | None = Query(None, description="STRING term (optional)"),
# ):
#     """
#     Returns per-site / per-gene noise statistics for **all three**
#     normalisation methods (tpm, fpkm, fpkm_uq).

#     * If `cancer_type` is given → only that TCGA code under the site.
#     * If omitted → all cancer types that belong to the site.
#     * If a `pathway` term cannot be resolved → fall back to the `genes` list.
#     """
#     # -----------------------------------------------------------------
#     #  1. Parse sites
#     # -----------------------------------------------------------------
#     sites = [s.strip() for s in cancer.split(",") if s.strip()]
#     if not sites:
#         raise HTTPException(status_code=400, detail="At least one site required")

#     # -----------------------------------------------------------------
#     #  2. Resolve gene list (STRING fallback)
#     # -----------------------------------------------------------------
#     supplied = [g.strip().upper() for g in (genes or "").split(",") if g.strip()]
#     if mode == "enrichment" and supplied:
#         gene_list = safe_get_string_pathway_genes(pathway, supplied, min_score=0.0)
#         print(gene_list)
#     else:
#         gene_list = supplied

#     if not gene_list:
#         raise HTTPException(status_code=400, detail="No genes to analyse")

#     # -----------------------------------------------------------------
#     #  3. DB connection
#     # -----------------------------------------------------------------
#     conn = get_connection()
#     cur = conn.cursor(pymysql.cursors.DictCursor)

#     # ---- gene symbol → id ------------------------------------------------
#     placeholders = ",".join(["%s"] * len(gene_list))
#     print(placeholders)
#     cur.execute(
#         f"SELECT id, gene_symbol FROM genes WHERE gene_symbol IN ({placeholders})",
#         gene_list,
#     )
#     gene_map = {r["gene_symbol"]: r["id"] for r in cur.fetchall()}
#     missing = [g for g in gene_list if g not in gene_map]
#     if missing:
#         logger.warning("Genes not in DB: %s", missing)
#     gene_list = [g for g in gene_list if g in gene_map]
#     if not gene_list:
#         conn.close()
#         raise HTTPException(status_code=400, detail="None of the genes exist in the database")

#     # -----------------------------------------------------------------
#     #  4. Build site → list of cancer_type ids
#     # -----------------------------------------------------------------
#     site_ct_map: Dict[str, List[int]] = {}
#     for site in sites:
#         cur.execute("SELECT id FROM sites WHERE name = %s", (site,))
#         row = cur.fetchone()
#         if not row:
#             logger.warning("Site not found: %s", site)
#             continue
#         site_id = row["id"]

#         if cancer_type:
#             cur.execute(
#                 "SELECT id FROM cancer_types WHERE site_id = %s AND tcga_code = %s",
#                 (site_id, cancer_type.upper()),
#             )
#         else:
#             cur.execute("SELECT id FROM cancer_types WHERE site_id = %s", (site_id,))

#         ct_ids = [r["id"] for r in cur.fetchall()]
#         if ct_ids:
#             site_ct_map[site] = ct_ids

#     if not site_ct_map:
#         conn.close()
#         # No data → 200 with empty payload (frontend shows “no results”)
#         return JSONResponse(
#             {
#                 "sites": [],
#                 "genes": gene_list,
#                 "normalization_methods": ["tpm", "fpkm", "fpkm_uq"],
#                 "data": {},
#             }
#         )

#     # ----------------------------------------------------------------arming-
#     #  5. Pull expression + compute stats
#     # -----------------------------------------------------------------
#     norm_cols = ["tpm", "fpkm", "fpkm_uq"]
#     result: Dict[str, Dict[str, Dict[str, Any]]] = {}

#     for site, ct_ids in site_ct_map.items():
#         site_res: Dict[str, Dict[str, Any]] = {}

#         for norm in norm_cols:
#             # depth2_scores contains all three columns
#             sql = f"""
#                 SELECT g.gene_symbol,
#                        s.sample_type,
#                        expr.{norm} AS value
#                 FROM gene_expressions expr
#                 JOIN samples s ON s.id = expr.sample_id
#                 JOIN genes g   ON g.id = expr.gene_id
#                 WHERE s.cancer_type_id IN ({','.join(['%s'] * len(ct_ids))})
#                   AND g.gene_symbol   IN ({','.join(['%s'] * len(gene_list))})
#                   AND expr.{norm} IS NOT NULL
#             """
#             cur.execute(sql, ct_ids + gene_list)
#             rows = cur.fetchall()
#             if not rows:
#                 continue

#             df = pd.DataFrame(rows)
#             piv = df.pivot_table(
#                 index="gene_symbol",
#                 columns="sample_type",
#                 values="value",
#                 aggfunc="mean",
#             ).fillna(np.nan)

#             normal = piv.get("normal", pd.Series())
#             tumor  = piv.get("tumor",  pd.Series())

#             for gene in gene_list:
#                 if gene not in site_res:
#                     site_res[gene] = {"raw": {}, "log2": {}}

#                 # ---- raw -------------------------------------------------
#                 n_vals = normal.get(gene)
#                 t_vals = tumor.get(gene)

#                 n_mean = float(n_vals.mean()) if pd.notna(n_vals) and len(n_vals) else None
#                 t_mean = float(t_vals.mean()) if pd.notna(t_vals) and len(t_vals) else None

#                 n_cv = (
#                     float(n_vals.std(ddof=1) / n_vals.mean())
#                     if n_mean and n_mean != 0
#                     else None
#                 )
#                 t_cv = (
#                     float(t_vals.std(ddof=1) / t_vals.mean())
#                     if t_mean and t_mean != 0
#                     else None
#                 )
#                 raw_fc = np.log2(t_cv / n_cv) if n_cv and t_cv and n_cv != 0 else None

#                 site_res[gene]["raw"][norm] = {
#                     "mean_normal": n_mean,
#                     "mean_tumor":  t_mean,
#                     "cv_normal":   n_cv,
#                     "cv_tumor":    t_cv,
#                     "log2fc":      raw_fc,
#                 }

#                 # ---- log2(x+1) -------------------------------------------
#                 if pd.notna(n_vals) and len(n_vals):
#                     n_log = np.log2(pd.Series(n_vals) + 1)
#                     n_log_mean = float(n_log.mean())
#                     n_log_cv   = float(n_log.std(ddof=1) / n_log.mean()) if n_log.mean() != 0 else None
#                 else:
#                     n_log_mean = n_log_cv = None

#                 if pd.notna(t_vals) and len(t_vals):
#                     t_log = np.log2(pd.Series(t_vals) + 1)
#                     t_log_mean = float(t_log.mean())
#                     t_log_cv   = float(t_log.std(ddof=1) / t_log.mean()) if t_log.mean() != 0 else None
#                 else:
#                     t_log_mean = t_log_cv = None

#                 log_fc = np.log2(t_log_cv / n_log_cv) if n_log_cv and t_log_cv and n_log_cv != 0 else None

#                 site_res[gene]["log2"][norm] = {
#                     "mean_normal": n_log_mean,
#                     "mean_tumor":  t_log_mean,
#                     "cv_normal":   n_log_cv,
#                     "cv_tumor":    t_log_cv,
#                     "log2fc":      log_fc,
#                 }

#         result[site] = site_res

#     conn.close()

#     # -----------------------------------------------------------------
#     #  6. Response
#     # -----------------------------------------------------------------
#     payload = {
#         "sites": list(result.keys()),
#         "genes": gene_list,
#         "normalization_methods": norm_cols,
#         "data": sanitize_floats(result),
#     }
#     return JSONResponse(payload)
