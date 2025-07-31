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
import pandas as pd
from supabase import create_client, Client

# === Supabase Setup ===
# === Supabase Setup ===
SUPABASE_URL = "https://vvtcajhtmarrzqgofzsl.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ2dGNhamh0bWFycnpxZ29menNsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAyODczODMsImV4cCI6MjA2NTg2MzM4M30.CvJY335QfWcLY_Z8L88SyUSe4KNKqoweaj7rVSjS1UA"
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# === Load Sample Sheet CSV ===
tsv_path = "/Users/rubabshah/Desktop/lums research/breast/gdc_sample_sheet.2025-07-09 (1).tsv"
# tsv_path = "/Users/rubabshah/Downloads/cancer-gene-noise-explorer-main 2/backend/data/raw/colon/gdc_sample_sheet.2025-07-11.tsv"
df = pd.read_csv(tsv_path, sep='\t')
# dupes = df[df.duplicated(subset=["Sample ID"], keep=False)]
df = df.drop_duplicates(subset=["Sample ID"])

# if not dupes.empty:
#         print("⚠️ Duplicate sample_barcodes in missing_df:")
#         print(dupes["Sample ID"])

# print("Available columns:", df.column s.tolist())
# print(len(df["Sample ID"]))
# === Basic Cleaning ===
# print(df[["Sample ID", "Tissue Type", "Project ID"]].drop_duplicates())
df = df.rename(columns={
    "Sample ID": "sample_barcode",
    "Tissue Type": "sample_type",
    "Project ID": "tcga_code"
})
# tsv_barcodes = set(df["sample_barcode"])
# Clean sample_type
df["sample_type"] = df["sample_type"].str.strip().str.lower()
df["sample_type"] = df["sample_type"].replace({
    "Primary Tumor": "tumor",
    "Solid Tissue Normal": "normal"
})

# === Fetch all cancer types from Supabase once ===
cancer_type_resp = supabase.table("cancer_types").select("id", "tcga_code").execute()
# if cancer_type_resp.error:
#     raise Exception("❌ Failed to fetch cancer types:", cancer_type_resp.error)

cancer_type_map = {row["tcga_code"]: row["id"] for row in cancer_type_resp.data}

# === Map cancer_type_id based on Project ID ===
df["cancer_type_id"] = df["tcga_code"].map(cancer_type_map)

# # Warn if any unknown TCGA codes
# unknown_codes = df[df["cancer_type_id"].isnull()]["tcga_code"].unique()
# if len(unknown_codes) > 0:
#     print("❌ Unknown Project IDs (TCGA codes) not found in Supabase:", unknown_codes)

# # Drop rows without valid cancer_type_id
# df = df.dropna(subset=["cancer_type_id"])
# df["cancer_type_id"] = df["cancer_type_id"].astype(int)

# === Compare with Supabase ===
tsv_barcodes = set(df["sample_barcode"])
sample_resp = supabase.table("samples").select("sample_barcode").execute()
supabase_barcodes = set(row["sample_barcode"] for row in sample_resp.data)

# print(len(tsv_barcodes))
missing_in_supabase = tsv_barcodes - supabase_barcodes
extra_in_supabase = supabase_barcodes - tsv_barcodes

# print(missing_in_supabase)
# === Print summary ===
if not missing_in_supabase and not extra_in_supabase:
    print("✅ All sample barcodes in TSV are present in Supabase, and there are no extras.")
else:
    if missing_in_supabase:
        print(f"❌ Missing {len(missing_in_supabase)} samples in Supabase:")
        for s in sorted(missing_in_supabase):
            print("   -", s)
    if extra_in_supabase:
        print(f"⚠️ Supabase contains {len(extra_in_supabase)} extra samples not in TSV:")
        # for s in sorted(extra_in_supabase):
            # print("   -", s)

# === Insert missing samples ===
if missing_in_supabase:
    print("🚀 Inserting missing samples into Supabase...")
    missing_df = df[df["sample_barcode"].isin(missing_in_supabase)]
    dupes = missing_df[missing_df.duplicated(subset=["sample_barcode"], keep=False)]
    if not dupes.empty:
        print("⚠️ Duplicate sample_barcodes in missing_df:")
        print(dupes["sample_barcode"])


    # Reorder columns
    # missing_df = missing_df[["sample_barcode", "cancer_type_id", "sample_type"]]
    # records = missing_df.to_dict(orient="records")
    # print("⚠️ Rows with NaNs:")
    # print(missing_df[missing_df.isnull().any(axis=1)])
    missing_df = missing_df[["sample_barcode", "cancer_type_id", "sample_type"]]
    missing_df = missing_df.dropna(subset=["cancer_type_id"])
    # Drop rows where cancer_type_id is NaN
    missing_df["cancer_type_id"] = missing_df["cancer_type_id"].astype(int)
    # Replace other NaNs with None (for JSON compatibility)
    # missing_df = missing_df.where(pd.notnull(missing_df), None)

    records = missing_df.to_dict(orient="records")



    for i in range(0, len(records), 1000):
        batch = records[i:i+1000]
        # response = supabase.table("samples").insert(batch).execute()
        supabase.table("samples").upsert(batch, on_conflict="sample_barcode").execute()

        # if response.error:
        #     print(f"❌ Failed inserting batch {i}-{i+len(batch)}: {response.error}")
        # else:
        print(f"✅ Inserted samples batch {i}-{i+len(batch)}")

    print("🎉 All missing samples inserted.")
else:
    print("✅ No missing samples to insert.")
