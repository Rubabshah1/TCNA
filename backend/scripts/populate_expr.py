# # from supabase import create_client, Client
# # import pandas as pd

# # # === Supabase Setup ===
# # SUPABASE_URL = "https://qrnaklwxbpotxddhiycc.supabase.co"
# # SUPABASE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFybmFrbHd4YnBvdHhkZGhpeWNjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk4MTkyOTcsImV4cCI6MjA2NTM5NTI5N30.GeGwF-yxDjBGwm3e-4RNtnG9mLggcmtJVbFtYbRT6lU"
# # supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# # # === User Input ===
# # cancer_name = "TCGA-THYM"

# # # Step 1: Get cancer_id
# # cancer_response = supabase.table("Cancers").select("cancer_id").eq("cancer_name", cancer_name).execute()
# # if len(cancer_response.data) == 0:
# #     raise ValueError(f"❌ Cancer name '{cancer_name}' not found.")
# # cancer_id = cancer_response.data[0]["cancer_id"]

# # print(f"✅ Found cancer_id = {cancer_id} for cancer_name = {cancer_name}")

# # # Step 2: Load CSV
# # CSV_PATH = '/Users/rubabshah/Downloads/cancer-gene-noise-explorer-main 2/backend/data/metrics/thymus/tumor/mean_std.csv'
# # df = pd.read_csv(CSV_PATH)  # Should have: gene_id, cv_tpm, cv_fpkm, cv_fpkm_uq

# # df = df.rename(columns={
# #     "mean_std_tpm": "tpm",
# #     "mean_std_fpkm": "fpkm",
# #     "mean_std_fpkm_uq": "fpkm_uq"
# # })

# # # Add cancer_id
# # df["cancer_id"] = cancer_id

# # # Reorder columns to match gene_expression table
# # final_df = df[["gene_id", "cancer_id", "tpm", "fpkm", "fpkm_uq"]]

# # # Convert to list of dicts (Supabase format)
# # records = final_df.to_dict(orient="records")

# # # Batch insert to Supabase
# # for i in range(0, len(records), 1000):  # Insert in batches of 100
# #     batch = records[i:i+1000]
# #     response = supabase.table("mean_std_tumor").insert(batch).execute()
# #     # if response.status_code != 201:
# #     #     print(f"Insert failed for batch {i}: {response.data}")

from supabase import create_client, Client
import pandas as pd
from tqdm import tqdm

# === Supabase Setup ===
SUPABASE_URL = "https://vvtcajhtmarrzqgofzsl.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ2dGNhamh0bWFycnpxZ29menNsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAyODczODMsImV4cCI6MjA2NTg2MzM4M30.CvJY335QfWcLY_Z8L88SyUSe4KNKqoweaj7rVSjS1UA"
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# === Load CSVs ===
tpm_df = pd.read_csv("/Users/rubabshah/Desktop/lums research/tcga_csvs/TCGA-COAD_tpm.csv")
fpkm_df = pd.read_csv("/Users/rubabshah/Desktop/lums research/tcga_csvs/TCGA-COAD_fpkm.csv")
fpkm_uq_df = pd.read_csv("/Users/rubabshah/Desktop/lums research/tcga_csvs/TCGA-COAD_fpkm_uq.csv")

tpm_df = tpm_df.drop(columns=["gene_name"], errors="ignore")
fpkm_df = fpkm_df.drop(columns=["gene_name"], errors="ignore")
fpkm_uq_df = fpkm_uq_df.drop(columns=["gene_name"], errors="ignore")
print(tpm_df)
# Rename value columns to distinguish them
tpm_df = tpm_df.rename(columns={"gene_id": "ensembl_id"})
fpkm_df = fpkm_df.rename(columns={"gene_id": "ensembl_id"})
fpkm_uq_df = fpkm_uq_df.rename(columns={"gene_id": "ensembl_id"})

# === Step 1: Melt dataframes (wide to long) ===
tpm_long = tpm_df.melt(id_vars="ensembl_id", var_name="sample_barcode", value_name="tpm")
fpkm_long = fpkm_df.melt(id_vars="ensembl_id", var_name="sample_barcode", value_name="fpkm")
fpkm_uq_long = fpkm_uq_df.melt(id_vars="ensembl_id", var_name="sample_barcode", value_name="fpkm_uq")

print(tpm_long)

# === Step 2: Merge all three on ensembl_id + sample_barcode ===
merged_df = tpm_long.merge(fpkm_long, on=["ensembl_id", "sample_barcode"])
merged_df = merged_df.merge(fpkm_uq_long, on=["ensembl_id", "sample_barcode"])

print(merged_df)

# Drop rows where all three are null
# merged_df = merged_df.dropna(subset=["tpm", "fpkm", "fpkm_uq"], how='all')

# === Step 3: Map gene_id and sample_id ===
def fetch_all_rows(table_name, columns, chunk_size=1000):
    offset = 0
    all_data = []

    while True:
        response = supabase.table(table_name).select(*columns).range(offset, offset + chunk_size - 1).execute()
        # if response.error:
        #     print(f"❌ Error fetching {table_name}: {response.error}")
        #     break
        data_chunk = response.data
        if not data_chunk:
            break
        all_data.extend(data_chunk)
        offset += chunk_size

    return all_data

# Now fetch full gene map
print("🔄 Fetching ALL gene_id map from Supabase...")
all_gene_data = fetch_all_rows("genes", ["id", "ensembl_id"])
gene_map = {row["ensembl_id"]: row["id"] for row in all_gene_data}
print(f"✅ Fetched {len(gene_map)} gene_id entries.")


print("🔄 Fetching sample_id map from Supabase...")
sample_resp = supabase.table("samples").select("id", "sample_barcode").execute()
sample_map = {row["sample_barcode"]: row["id"] for row in sample_resp.data}
print(sample_map)
# === Step 4: Prepare records ===
records = []
for idx, row in tqdm(merged_df.iterrows(), total=len(merged_df)):
    gene_id = gene_map.get(row["ensembl_id"])
    sample_id = sample_map.get(row["sample_barcode"])

    if not gene_id or not sample_id:
        # print(gene_id, sample_id)
        continue

    record = {
        "gene_id": gene_id,
        "sample_id": sample_id,
        "tpm": float(row["tpm"]) if pd.notna(row["tpm"]) else None,
        "fpkm": float(row["fpkm"]) if pd.notna(row["fpkm"]) else None,
        "fpkm_uq": float(row["fpkm_uq"]) if pd.notna(row["fpkm_uq"]) else None,
    }
    records.append(record)

print(f"✅ Prepared {len(records)} records for insertion.")

# === Step 5: Insert into Supabase ===
for i in tqdm(range(0, len(records), 800)):
    batch = records[i:i + 800]
    response = supabase.table("expression_values").insert(batch).execute()
    # response = supabase.table("expression_values").upsert(batch, on_conflict=["gene_id", "sample_id"]).execute()
    # if response.error:
    #     print(f"❌ Error inserting batch {i}: {response.error}")
    # else:
    print(f"✅ Inserted batch {i} to {i + len(batch)}")

print("🎉 All records inserted successfully.")

# import pandas as pd
# from supabase import create_client, Client

# # === Supabase Setup ===
# SUPABASE_URL = "https://vvtcajhtmarrzqgofzsl.supabase.co"
# SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ2dGNhamh0bWFycnpxZ29menNsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAyODczODMsImV4cCI6MjA2NTg2MzM4M30.CvJY335QfWcLY_Z8L88SyUSe4KNKqoweaj7rVSjS1UA"
# supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# # === Load TSV ===
# tsv_path = "/Users/rubabshah/Desktop/lums research/Areesha - colon cancer/TUMOR_colon_samplesheet.csv"
# df = pd.read_csv(tsv_path)

# # === Get cancer_type_id for TCGA-THYM ===
# cancer_code = "TCGA-COAD"
# cancer_resp = supabase.table("cancer_types").select("id").eq("tcga_code", cancer_code).execute()
# if not cancer_resp.data:
#     raise ValueError(f"❌ Cancer code '{cancer_code}' not found.")
# cancer_type_id = cancer_resp.data[0]["id"]
# print(f"✅ Found cancer_type_id = {cancer_type_id} for {cancer_code}")
# print(df)
# # === Prepare sample sheet barcodes ===
# # df = df[["Sample ID", "Tissue Type"]].drop_duplicates()
# # df = df.rename(columns={"Sample ID": "sample_barcode", "Tissue Type": "sample_type"})
# # df["cancer_type_id"] = cancer_type_id
# df = df[["Sample ID", "Tissue Type"]].drop_duplicates()
# df = df.rename(columns={"Sample ID": "sample_barcode", "Tissue Type": "sample_type"})
# df["cancer_type_id"] = cancer_type_id

# # Standardize and map sample_type values
# df["sample_type"] = df["sample_type"].str.strip().str.lower()
# df["sample_type"] = df["sample_type"].replace({
#     "Tumor": "Primary Tumor",
#     "Normal": "Solid Tissue Normal"
# })



# tsv_barcodes = set(df["sample_barcode"])

# # === Fetch existing sample_barcodes from Supabase ===
# sample_resp = supabase.table("samples").select("sample_barcode").execute()
# supabase_barcodes = set(row["sample_barcode"] for row in sample_resp.data)

# # === Compare sets ===
# missing_in_supabase = tsv_barcodes - supabase_barcodes
# extra_in_supabase = supabase_barcodes - tsv_barcodes

# # === Print results ===
# if not missing_in_supabase and not extra_in_supabase:
#     print("✅ All sample barcodes in TSV are present in Supabase, and there are no extras.")
# else:
#     if missing_in_supabase:
#         print(f"❌ Missing {len(missing_in_supabase)} samples in Supabase:")
#         for s in sorted(missing_in_supabase):
#             print("   -", s)
#     if extra_in_supabase:
#         print(f"❌ Supabase contains {len(extra_in_supabase)} extra samples not in TSV:")
#         for s in sorted(extra_in_supabase):
#             print("   -", s)


# # === Insert missing samples into Supabase ===
# if missing_in_supabase:
#     print("🚀 Inserting missing samples into Supabase...")
#     missing_df = df[df["sample_barcode"].isin(missing_in_supabase)]

#     # Reorder columns
#     missing_df = missing_df[["sample_barcode", "cancer_type_id", "sample_type"]]

#     records = missing_df.to_dict(orient="records")

#     print(records)

#     for i in range(0, len(records), 1000):
#         batch = records[i:i+1000]
#         response = supabase.table("samples").insert(batch).execute()
#         # if response.error:
#         #     print(f"❌ Failed inserting batch {i}: {response.error}")
#         # else:
#         print(f"✅ Inserted samples batch {i}-{i+len(batch)}")

#     print("🎉 All missing samples inserted.")
# else:
#     print("✅ No missing samples to insert.")

# import pandas as pd
# from supabase import create_client, Client

# # === Supabase Setup ===
# SUPABASE_URL = "https://vvtcajhtmarrzqgofzsl.supabase.co"
# SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ2dGNhamh0bWFycnpxZ29menNsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAyODczODMsImV4cCI6MjA2NTg2MzM4M30.CvJY335QfWcLY_Z8L88SyUSe4KNKqoweaj7rVSjS1UA"
# supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# # === Load CSV ===
# csv_path = "/Users/rubabshah/Downloads/cancer-gene-noise-explorer-main 2/backend/data/metrics/thymus1.0/tumor/tITH.csv"  # your CSV with sample_barcode, tpm, fpkm, fpkm_uq
# df = pd.read_csv(csv_path)

# # === Prepare a list to hold matched rows ===
# insert_data = []

# # === Lookup each sample_barcode in Supabase and prepare insert payload ===
# for _, row in df.iterrows():
#     sample_barcode = row["sample_id"]
    
#     # Query Supabase to get sample_id
#     response = supabase.table("samples").select("id").eq("sample_barcode", sample_barcode).limit(1).execute()
    
#     if response.data:
#         sample_id = response.data[0]["id"]
#         insert_data.append({
#             "sample_id": sample_id,
#             "tpm": row["tITH_tpm"],
#             "fpkm": row["tITH_fpkm"],
#             "fpkm_uq": row["tITH_fpkm_uq"]
#         })
#     else:
#         print(f"❌ Sample not found in Supabase: {sample_barcode}")

# print(insert_data)

# # === Insert into DEPTH2 ===
# if insert_data:
#     response = supabase.table("DEPTH - tITH").insert(insert_data).execute()
#     print("✅ Insert complete:", response)
# else:
#     print("⚠️ No rows to insert.")
