# # # from supabase import create_client, Client
# # # import pandas as pd

# # # # === Supabase Setup ===
# # # SUPABASE_URL = "https://qrnaklwxbpotxddhiycc.supabase.co"
# # # SUPABASE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFybmFrbHd4YnBvdHhkZGhpeWNjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk4MTkyOTcsImV4cCI6MjA2NTM5NTI5N30.GeGwF-yxDjBGwm3e-4RNtnG9mLggcmtJVbFtYbRT6lU"
# # # supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# # # # === User Input ===
# # # cancer_name = "TCGA-THYM"

# # # # Step 1: Get cancer_id
# # # cancer_response = supabase.table("Cancers").select("cancer_id").eq("cancer_name", cancer_name).execute()
# # # if len(cancer_response.data) == 0:
# # #     raise ValueError(f"❌ Cancer name '{cancer_name}' not found.")
# # # cancer_id = cancer_response.data[0]["cancer_id"]

# # # print(f"✅ Found cancer_id = {cancer_id} for cancer_name = {cancer_name}")

# # # # Step 2: Load CSV
# # # CSV_PATH = '/Users/rubabshah/Downloads/cancer-gene-noise-explorer-main 2/backend/data/metrics/thymus/tumor/mean_std.csv'
# # # df = pd.read_csv(CSV_PATH)  # Should have: gene_id, cv_tpm, cv_fpkm, cv_fpkm_uq

# # # df = df.rename(columns={
# # #     "mean_std_tpm": "tpm",
# # #     "mean_std_fpkm": "fpkm",
# # #     "mean_std_fpkm_uq": "fpkm_uq"
# # # })

# # # # Add cancer_id
# # # df["cancer_id"] = cancer_id

# # # # Reorder columns to match gene_expression table
# # # final_df = df[["gene_id", "cancer_id", "tpm", "fpkm", "fpkm_uq"]]

# # # # Convert to list of dicts (Supabase format)
# # # records = final_df.to_dict(orient="records")

# # # # Batch insert to Supabase
# # # for i in range(0, len(records), 1000):  # Insert in batches of 100
# # #     batch = records[i:i+1000]
# # #     response = supabase.table("mean_std_tumor").insert(batch).execute()
# # #     # if response.status_code != 201:
# # #     #     print(f"Insert failed for batch {i}: {response.data}")
# from supabase import create_client, Client
# import pandas as pd
# from tqdm import tqdm

# # === Supabase Setup ===
# SUPABASE_URL = "https://vvtcajhtmarrzqgofzsl.supabase.co"
# SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ2dGNhamh0bWFycnpxZ29menNsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAyODczODMsImV4cCI6MjA2NTg2MzM4M30.CvJY335QfWcLY_Z8L88SyUSe4KNKqoweaj7rVSjS1UA"
# supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# # === Load CSVs ===
# tpm_df = pd.read_csv("/Users/rubabshah/Downloads/cancer-gene-noise-explorer-main 2/backend/data/raw/Thymus/TCGA-THYM_tpm.csv")
# fpkm_df = pd.read_csv("/Users/rubabshah/Downloads/cancer-gene-noise-explorer-main 2/backend/data/raw/Thymus/TCGA-THYM_fpkm.csv")
# fpkm_uq_df = pd.read_csv("/Users/rubabshah/Downloads/cancer-gene-noise-explorer-main 2/backend/data/raw/Thymus/TCGA-THYM_fpkm_uq.csv")

# tpm_df = tpm_df.drop(columns=["gene_name"], errors="ignore")
# fpkm_df = fpkm_df.drop(columns=["gene_name"], errors="ignore")
# fpkm_uq_df = fpkm_uq_df.drop(columns=["gene_name"], errors="ignore")
# print(tpm_df)
# # Rename value columns to distinguish them
# tpm_df = tpm_df.rename(columns={"gene_id": "ensembl_id"})
# fpkm_df = fpkm_df.rename(columns={"gene_id": "ensembl_id"})
# fpkm_uq_df = fpkm_uq_df.rename(columns={"gene_id": "ensembl_id"})

# # === Step 1: Melt dataframes (wide to long) ===
# tpm_long = tpm_df.melt(id_vars="ensembl_id", var_name="sample_barcode", value_name="tpm")
# fpkm_long = fpkm_df.melt(id_vars="ensembl_id", var_name="sample_barcode", value_name="fpkm")
# fpkm_uq_long = fpkm_uq_df.melt(id_vars="ensembl_id", var_name="sample_barcode", value_name="fpkm_uq")

# print(tpm_long)

# # === Step 2: Merge all three on ensembl_id + sample_barcode ===
# merged_df = tpm_long.merge(fpkm_long, on=["ensembl_id", "sample_barcode"])
# merged_df = merged_df.merge(fpkm_uq_long, on=["ensembl_id", "sample_barcode"])

# print(merged_df)

# # Drop rows where all three are null
# # merged_df = merged_df.dropna(subset=["tpm", "fpkm", "fpkm_uq"], how='all')

# # === Step 3: Map gene_id and sample_id ===
# print("🔄 Fetching gene_id map from Supabase...")
# gene_resp = supabase.table("genes").select("id", "ensembl_id").execute()
# gene_map = {row["ensembl_id"]: row["id"] for row in gene_resp.data}

# print("🔄 Fetching sample_id map from Supabase...")
# sample_resp = supabase.table("samples").select("id", "sample_barcode").execute()
# sample_map = {row["sample_barcode"]: row["id"] for row in sample_resp.data}

# # === Step 4: Prepare records ===
# records = []
# for idx, row in tqdm(merged_df.iterrows(), total=len(merged_df)):
#     gene_id = gene_map.get(row["ensembl_id"])
#     sample_id = sample_map.get(row["sample_barcode"])

#     if not gene_id or not sample_id:
#         print(gene_id, sample_id)
#         continue

#     record = {
#         "gene_id": gene_id,
#         "sample_id": sample_id,
#         "tpm": float(row["tpm"]) if pd.notna(row["tpm"]) else None,
#         "fpkm": float(row["fpkm"]) if pd.notna(row["fpkm"]) else None,
#         "fpkm_uq": float(row["fpkm_uq"]) if pd.notna(row["fpkm_uq"]) else None,
#     }
#     records.append(record)

# print(f"✅ Prepared {len(records)} records for insertion.")

# # === Step 5: Insert into Supabase ===
# # for i in tqdm(range(0, len(records), 800)):
# #     batch = records[i:i + 800]
# #     response = supabase.table("expression_values").insert(batch).execute()
# #     # response = supabase.table("expression_values").upsert(batch, on_conflict=["gene_id", "sample_id"]).execute()
# #     # if response.error:
# #     #     print(f"❌ Error inserting batch {i}: {response.error}")
# #     # else:
# #     print(f"✅ Inserted batch {i} to {i + len(batch)}")

# print("🎉 All records inserted successfully.")

# # import pandas as pd
# # from supabase import create_client, Client

# # # === Supabase Setup ===
# # SUPABASE_URL = "https://vvtcajhtmarrzqgofzsl.supabase.co"
# # SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ2dGNhamh0bWFycnpxZ29menNsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAyODczODMsImV4cCI6MjA2NTg2MzM4M30.CvJY335QfWcLY_Z8L88SyUSe4KNKqoweaj7rVSjS1UA"
# # supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# # # === Load TSV ===
# # tsv_path = "/Users/rubabshah/Downloads/gdc_sample_sheet.2025-07-02.tsv"
# # df = pd.read_csv(tsv_path, sep="\t")

# # # === Get cancer_type_id for TCGA-THYM ===
# # cancer_code = "TCGA-THYM"
# # cancer_resp = supabase.table("cancer_types").select("id").eq("tcga_code", cancer_code).execute()
# # if not cancer_resp.data:
# #     raise ValueError(f"❌ Cancer code '{cancer_code}' not found.")
# # cancer_type_id = cancer_resp.data[0]["id"]
# # print(f"✅ Found cancer_type_id = {cancer_type_id} for {cancer_code}")

# # # === Prepare sample sheet barcodes ===
# # df = df[["Sample ID", "Tissue Type"]].drop_duplicates()
# # df = df.rename(columns={"Sample ID": "sample_barcode", "Tissue Type": "sample_type"})
# # df["cancer_type_id"] = cancer_type_id

# # tsv_barcodes = set(df["sample_barcode"])

# # # === Fetch existing sample_barcodes from Supabase ===
# # sample_resp = supabase.table("samples").select("sample_barcode").execute()
# # supabase_barcodes = set(row["sample_barcode"] for row in sample_resp.data)

# # # === Compare sets ===
# # missing_in_supabase = tsv_barcodes - supabase_barcodes
# # extra_in_supabase = supabase_barcodes - tsv_barcodes

# # # === Print results ===
# # if not missing_in_supabase and not extra_in_supabase:
# #     print("✅ All sample barcodes in TSV are present in Supabase, and there are no extras.")
# # else:
# #     if missing_in_supabase:
# #         print(f"❌ Missing {len(missing_in_supabase)} samples in Supabase:")
# #         for s in sorted(missing_in_supabase):
# #             print("   -", s)
# #     if extra_in_supabase:
# #         print(f"❌ Supabase contains {len(extra_in_supabase)} extra samples not in TSV:")
# #         for s in sorted(extra_in_supabase):
# #             print("   -", s)
# # import pandas as pd
# # from supabase import create_client, Client

# # # === Supabase Setup ===
# # SUPABASE_URL = "https://vvtcajhtmarrzqgofzsl.supabase.co"
# # SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ2dGNhamh0bWFycnpxZ29menNsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAyODczODMsImV4cCI6MjA2NTg2MzM4M30.CvJY335QfWcLY_Z8L88SyUSe4KNKqoweaj7rVSjS1UA"
# # supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# # # === Load TSV ===
# # tsv_path = "/Users/rubabshah/Desktop/lums research/Thymus/sample_sheet.tsv"
# # df = pd.read_csv(tsv_path, sep="\t")

# # # === Get cancer_type_id for TCGA-THYM ===
# # cancer_code = "TCGA-THYM"
# # cancer_resp = supabase.table("cancer_types").select("id").eq("tcga_code", cancer_code).execute()
# # if not cancer_resp.data:
# #     raise ValueError(f"❌ Cancer code '{cancer_code}' not found.")
# # cancer_type_id = cancer_resp.data[0]["id"]
# # print(f"✅ Found cancer_type_id = {cancer_type_id} for {cancer_code}")

# # # === Prepare sample sheet barcodes ===
# # df = df[["Sample ID", "Tissue Type"]].drop_duplicates()
# # df = df.rename(columns={"Sample ID": "sample_barcode", "Tissue Type": "sample_type"})
# # df["cancer_type_id"] = cancer_type_id

# # tsv_barcodes = set(df["sample_barcode"])

# # # === Fetch existing sample_barcodes from Supabase ===
# # sample_resp = supabase.table("samples").select("sample_barcode").execute()
# # supabase_barcodes = set(row["sample_barcode"] for row in sample_resp.data)

# # # === Compare sets ===
# # missing_in_supabase = tsv_barcodes - supabase_barcodes
# # extra_in_supabase = supabase_barcodes - tsv_barcodes

# # # === Print results ===
# # if not missing_in_supabase and not extra_in_supabase:
# #     print("✅ All sample barcodes in TSV are present in Supabase, and there are no extras.")
# # else:
# #     if missing_in_supabase:
# #         print(f"❌ Missing {len(missing_in_supabase)} samples in Supabase:")
# #         for s in sorted(missing_in_supabase):
# #             print("   -", s)
# #     if extra_in_supabase:
# #         print(f"❌ Supabase contains {len(extra_in_supabase)} extra samples not in TSV:")
# #         for s in sorted(extra_in_supabase):
# #             print("   -", s)


import pymysql
import pandas as pd
import openpyxl

conn = pymysql.connect(
    host='localhost',
    user='rubab',
    password='initiate123',
    database='cancer_db'
)
cur = conn.cursor()

# df_sites = pd.read_csv('/Users/rubabshah/Downloads/Sites_rows.csv')

# for _, row in df_sites.iterrows():
# cur.execute("INSERT INTO Sites (id, name) VALUES ('1', 'Liver and Bile Duct'), ('2', 'Colorectal'), ('3', 'Breast'), ('4', 'Kidney'), ('6', 'Adrenal Gland'), ('7', 'Brain and Nervous System'), ('8', 'Head and Neck'), ('9', 'Esophagus'), ('10', 'Bladder'), ('11', 'Lymph Nodes'), ('12', 'Bone Marrow and Blood'), ('13', 'Cervix'), ('14', 'Eye and Adnexa'), ('15', 'Ovary'), ('16', 'Pancreas'), ('17', 'Heart and Pleura'), ('18', 'Prostate'), ('19', 'Skin'), ('20', 'Soft Tissue'), ('21', 'Stomach'), ('22', 'Testis'), ('23', 'Thymus'), ('24', 'Thyroid'), ('25', 'Uterus'), ('26', 'Lung'), ('27', 'Rectum');", 
#                 )
# conn.commit()

# df_ct = pd.read_excel('/Users/rubabshah/Downloads/cancer_types_rows.xlsx')
# print(df_ct.head())

# for _, row in df_ct.iterrows():
#     # Convert NaN to None for all relevant fields
#     tcga_code = None if pd.isna(row['tcga_code']) else str(row['tcga_code'])
#     name = "Unkown" if pd.isna(row['name']) else str(row['name'])
#     site_id = None if pd.isna(row['site_id']) else int(row['site_id'])

#     if site_id is not None:
#         cur.execute("SELECT id FROM Sites WHERE id=%s", (site_id,))
#         site_exists = cur.fetchone()
#     else:
#         site_exists = None

#     if site_exists:
#         cur.execute("""
#             INSERT INTO cancer_types (tcga_code, name, site_id)
#             VALUES (%s, %s, %s)
#             ON DUPLICATE KEY UPDATE
#                 name = VALUES(name),
#                 site_id = VALUES(site_id)
#         """, (tcga_code, name, site_id))
#     else:
#         print(f"⚠️ Skipping {name or 'Unnamed'} (invalid site_id: {site_id})")

# conn.commit()
# cur.execute("""
# INSERT INTO cancer_types (id, tcga_code, name, site_id)
# VALUES
# (1, 'TCGA-THYM', 'Thymus Cancer', 23),
# (2, 'TCGA-LUAD', 'Lung Adenocarcinoma', 26),
# (3, 'TCGA-LIHC', 'Liver Hepatocellular Carcinoma', 1),
# (4, 'TCGA-COAD', 'Colon Adenocarcinoma', 2),
# (5, 'TCGA-BRCA', 'Invasive Breast Carcinoma', 3),
# (6, 'TCGA-DLBC', 'Diffuse Large B-cell Lymphoma', 11),
# (7, 'TCGA-CHOL', 'Cholangiocarcinoma - Bile Duct Cancer', 1),
# (8, 'TCGA-LUSC', 'Lung Squamous Cell Carcinoma', 26),
# (10, 'TCGA-READ', 'Rectal Adenocarcinoma', 2),
# (11, 'TCGA-UCEC', 'Uterine Corpus Endometrial Carcinoma', 25),
# (12, 'TCGA-UCS', 'Uterine Carcinosarcoma', 25),
# (13, 'TCGA-SARC', 'Sarcoma', 25),
# (14, 'TCGA-LGG', 'Brain Lower Grade Glioma', 7),
# (15, 'TCGA-GBM', 'Glioblastoma multiforme', 7),
# (16, 'TCGA-READ', 'Rectal Adenocarcinoma', 27),
# (17, 'TCGA-SARC', 'Sarcoma', 20),
# (18, 'TCGA-KICH', 'Kidney Chromophobe', 4),
# (19, 'TCGA-KIRC', 'Kidney renal clear cell carcinoma', 4),
# (20, 'TCGA-KIRP', 'Kidney renal papillary cell carcinoma', 4),
# (21, 'TCGA-STAD', 'Stomach adenocarcinoma', 21),
# (23, 'TCGA-ESCA', 'Esophageal carcinoma', 9),
# (24, 'TCGA-HNSC', 'Head-Neck Squamous Cell Carcinoma', 8),
# (26, 'TCGA-BLCA', 'Bladder Carcinoma', 10),
# (27, 'TCGA-CESC', 'Cervical squamous cell carcinoma and endocervical adenocarcinoma', 13),
# (28, 'TCGA-ACC', 'Adrenocortical carcinoma', 6),
# (29, 'TCGA-PCPG', 'Pheochromocytoma and Paraganglioma', 6),
# (30, 'TCGA-PRAD', 'Prostate adenocarcinoma', 18),
# (31, 'TCGA-THCA', 'Thyroid carcinoma', 24),
# (32, 'CPTAC-3', 'Unknown', 16),
# (34, 'HCMI-CMDC', 'Unknown', 16),
# (35, 'TCGA-PAAD', 'Pancreatic adenocarcinoma', 16),
# (36, 'TCGA-TGCT', 'Testicular Germ Cell Tumors', 22),
# (37, 'HCMI-CMDC', 'Unknown', 15),
# (38, 'CPTAC-2', 'Unknown', 15),
# (39, 'TCGA-OV', 'Ovarian serous cystadenocarcinoma', 15),
# (40, 'TCGA-UVM', 'Uveal Melanoma', 14),
# (41, 'TCGA-SKCM', 'Skin Cutaneous Melanoma', 19),
# (42, 'HCMI-CMDC', 'Unknown', 19),
# (43, 'TARGET-NBL', 'Unknown', 17),
# (44, 'TCGA-MESO', 'Mesothelioma', 17),
# (45, 'TCGA-THYM', 'Thymoma', 17),
# (46, 'NCICCR-DLBCL', 'Unknown', 11),
# (47, 'TARGET-NBL', 'Unknown', 11),
# (48, 'BEATAML1.0-COHORT', 'Unknown', 12),
# (49, 'CGCI-BLGSP', 'Unknown', 12),
# (50, 'CGCI-HTMCP-DLBCL', 'Unknown', 12),
# (51, 'TARGET-AML', 'Unknown', 12),
# (52, 'TCGA-LAML', 'Acute Myeloid Leukemia', 12);
# """)
# conn.commit()


# df_genes = pd.read_csv('/Users/rubabshah/Downloads/genes_rows.csv')

# for _, row in df_genes.iterrows():
#     cur.execute(
#         "INSERT INTO genes (gene_symbol, ensembl_id) VALUES (%s, %s) "
#         "ON DUPLICATE KEY UPDATE gene_symbol=gene_symbol",
#         (row['gene_symbol'], row['ensembl_id'])
#     )
# conn.commit()


df_samples = pd.read_csv('/Users/rubabshah/Downloads/depth2_scores_rows.csv')

for _, row in df_samples.iterrows():
    # Get cancer_type_id
    # print(row['cancer_type_id'])
    cur.execute("SELECT id FROM cancer_types WHERE id=%s", (row['cancer_type_id'],))
    cancer_type_id = cur.fetchone()
    if cancer_type_id:
        cur.execute(
                    "INSERT INTO samples (sample_barcode, sample_type, cancer_type_id) VALUES (%s, %s, %s) "
                    "ON DUPLICATE KEY UPDATE sample_type=sample_type",
                    (row['sample_barcode'], row['sample_type'], row['cancer_type_id'])
                )

cur.execute("SELECT * FROM samples")
conn.commit()

