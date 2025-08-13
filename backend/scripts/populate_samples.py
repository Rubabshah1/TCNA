# import pandas as pd
# from supabase import create_client, Client


# # === Load Sample Sheet CSV ===
# tsv_path = "/Users/rubabshah/Desktop/lums research/cancerdata/blood/blood.tsv"
# # tsv_path = "/Users/rubabshah/Downloads/cancer-gene-noise-explorer-main 2/backend/data/raw/colon/gdc_sample_sheet.2025-07-11.tsv"
# df = pd.read_csv(tsv_path, sep='\t')
# df = df.applymap(lambda x: x.split(',')[0].strip() if isinstance(x, str) and ',' in x else x)

# # dupes = df[df.duplicated(subset=["Sample ID"], keep=False)]
# df = df.drop_duplicates(subset=["Sample ID"])

# # if not dupes.empty:
# #         print("⚠️ Duplicate sample_barcodes in missing_df:")
# #         print(dupes["Sample ID"])

# # print("Available columns:", df.column s.tolist())
# # print(len(df["Sample ID"]))
# # === Basic Cleaning ===
# # print(df[["Sample ID", "Tissue Type", "Project ID"]].drop_duplicates())
# df = df.rename(columns={
#     "Sample ID": "sample_barcode",
#     "Tissue Type": "sample_type",
#     "Project ID": "tcga_code"
# })
# # tsv_barcodes = set(df["sample_barcode"])
# # Clean sample_type
# df["sample_type"] = df["sample_type"].str.strip().str.lower()
# df["sample_type"] = df["sample_type"].replace({
#     "Primary Tumor": "tumor",
#     "Solid Tissue Normal": "normal"
# })
# unique_tcga = df["tcga_code"].unique()
# expected_site = "Bone Marrow and Blood"  # Infer from path or hardcode
# site_resp = supabase.table("Sites").select("id").eq("name", expected_site).execute()
# expected_site_id = site_resp.data[0]["id"] if site_resp.data else None
# # === Fetch all cancer types from Supabase once ===
# cancer_type_resp = supabase.table("cancer_types").select("id", "tcga_code", "site_id").eq("site_id", expected_site_id).execute()
# # print(cancer_type_resp)
# # if cancer_type_resp.error:
# #     raise Exception("❌ Failed to fetch cancer types:", cancer_type_resp.error)

# cancer_type_map = {row["tcga_code"]: row["id"] for row in cancer_type_resp.data}
# # print(cancer_type_map)
# # === Map cancer_type_id based on Project ID ===
# df["cancer_type_id"] = df["tcga_code"].map(cancer_type_map)
# df["cancer_type_id"]
# # # Warn if any unknown TCGA codes
# # unknown_codes = df[df["cancer_type_id"].isnull()]["tcga_code"].unique()
# # if len(unknown_codes) > 0:
# #     print("❌ Unknown Project IDs (TCGA codes) not found in Supabase:", unknown_codes)

# # # Drop rows without valid cancer_type_id
# # df = df.dropna(subset=["cancer_type_id"])
# # df["cancer_type_id"] = df["cancer_type_id"].astype(int)
# # After mapping cancer_type_id

# print(expected_site_id)
# for tcga in unique_tcga:
#     ct_id = cancer_type_map.get(tcga)
#     if ct_id:
#         ct_resp = supabase.table("cancer_types").select("site_id").eq("id", ct_id).execute()
#         actual_site_id = ct_resp.data[0]["site_id"]
#         if actual_site_id != expected_site_id:
#             print(f"Mismatch for {tcga}: Expected site {expected_site_id}, got {actual_site_id}")
# # === Compare with Supabase ===
# tsv_barcodes = set(df["sample_barcode"])
# sample_resp = supabase.table("samples").select("sample_barcode").execute()
# supabase_barcodes = set(row["sample_barcode"] for row in sample_resp.data)

# # print(len(tsv_barcodes))
# missing_in_supabase = tsv_barcodes - supabase_barcodes
# extra_in_supabase = supabase_barcodes - tsv_barcodes

# # print(missing_in_supabase)
# # === Print summary ===
# if not missing_in_supabase and not extra_in_supabase:
#     print("✅ All sample barcodes in TSV are present in Supabase, and there are no extras.")
# else:
#     if missing_in_supabase:
#         print(f"❌ Missing {len(missing_in_supabase)} samples in Supabase:")
#         for s in sorted(missing_in_supabase):
#             print("   -", s)
#     if extra_in_supabase:
#         print(f"⚠️ Supabase contains {len(extra_in_supabase)} extra samples not in TSV:")
#         # for s in sorted(extra_in_supabase):
#             # print("   -", s)

# # === Insert missing samples ===
# if missing_in_supabase:
#     print("🚀 Inserting missing samples into Supabase...")
#     missing_df = df[df["sample_barcode"].isin(missing_in_supabase)]
#     dupes = missing_df[missing_df.duplicated(subset=["sample_barcode"], keep=False)]
#     if not dupes.empty:
#         print("⚠️ Duplicate sample_barcodes in missing_df:")
#         print(dupes["sample_barcode"])


#     # Reorder columns
#     # missing_df = missing_df[["sample_barcode", "cancer_type_id", "sample_type"]]
#     # records = missing_df.to_dict(orient="records")
#     # print("⚠️ Rows with NaNs:")
#     # print(missing_df[missing_df.isnull().any(axis=1)])
#     missing_df = missing_df[["sample_barcode", "cancer_type_id", "sample_type"]]
#     missing_df = missing_df.dropna(subset=["cancer_type_id"])
#     # Drop rows where cancer_type_id is NaN
#     missing_df["cancer_type_id"] = missing_df["cancer_type_id"].astype(int)
#     # Replace other NaNs with None (for JSON compatibility)
#     # missing_df = missing_df.where(pd.notnull(missing_df), None)

#     records = missing_df.to_dict(orient="records")



#     for i in range(0, len(records), 1000):
#         batch = records[i:i+1000]
#         # response = supabase.table("samples").insert(batch).execute()
#         supabase.table("samples").upsert(batch, on_conflict="sample_barcode").execute()

#         # if response.error:
#         #     print(f"❌ Failed inserting batch {i}-{i+len(batch)}: {response.error}")
#         # else:
#         print(f"✅ Inserted samples batch {i}-{i+len(batch)}")

#     print("🎉 All missing samples inserted.")
# else:
#     print("✅ No missing samples to insert.")
