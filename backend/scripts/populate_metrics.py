# import os
# import pandas as pd
# from supabase import create_client
# # from dotenv import load_dotenv

# # # Load environment variables from .env file
# # load_dotenv()

# # # Supabase configuration from .env
# # SUPABASE_URL = os.getenv("SUPABASE_URL")
# # SUPABASE_KEY = os.getenv("SUPABASE_KEY")
# # supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

# # Base directory for metrics data
# # base_metrics_dir = "/Users/rubabshah/Downloads/cancer-gene-noise-explorer-main 2/backend/data/metrics"

# def populate_database(cancer_type, condition, metric, base_metrics_dir, supabase):
#     """
#     Populates the Supabase database with metric data from a CSV file.
    
#     Args:
#         cancer_type (str): The cancer type folder (e.g., "thymus1.0").
#         condition (str): The condition (e.g., "tumor" or "normal").
#         metric (str): The metric to process (e.g., "tITH" or "DEPTH2").
#     """
#     # Construct the CSV path
#     csv_path = os.path.join(base_metrics_dir, cancer_type, condition, f"{metric}.csv")
    
#     if not os.path.exists(csv_path):
#         print(f"❌ CSV file not found: {csv_path}")
#         return

#     # Read the CSV file
#     df = pd.read_csv(csv_path, index_col=0)
#     print(f"📋 Loaded data from {csv_path} - Head:\n{df.head()}")

#     # Prepare a list to hold matched rows
#     insert_data = []

#     # Lookup each sample_id in Supabase and prepare insert payload
#     for _, row in df.iterrows():
#         sample_id = row["sample_id"]
        
#         # Query Supabase to verify sample_id (optional, assuming sample_id is already correct)
#         response = supabase.table("samples").select("id").eq("sample_id", sample_id).limit(1).execute()
        
#         if response.data:
#             # Map metric columns (e.g., tITH_tpm, tITH_fpkm, tITH_fpkm_uq) to insert data
#             insert_data.append({
#                 "sample_id": sample_id,
#                 "tpm": row.get(f"{metric}_tpm", None),
#                 "fpkm": row.get(f"{metric}_fpkm", None),
#                 "fpkm_uq": row.get(f"{metric}_fpkm_uq", None)
#             })
#         else:
#             print(f"❌ Sample not found in Supabase: {sample_id}")

#     print(f"📋 Prepared data for insertion: {insert_data}")

#     # Insert into the appropriate Supabase table based on metric
#     table_name = metric if metric != "tITH" else "DEPTH - tITH"
#     if insert_data:
#         response = supabase.table(table_name).insert(insert_data).execute()
#         print(f"✅ Insert complete for {metric} in {table_name}: {response}")
#     else:
#         print(f"⚠️ No rows to insert for {metric} in {table_name}")

import os
import pandas as pd

def populate_database(df: pd.DataFrame, metric: str, supabase):
    insert_data = []

    for _, row in df.iterrows():
        sample_barcode = row["sample_id"]
        response = supabase.table("samples").select("id").eq("sample_barcode", sample_barcode).limit(1).execute()
        if not response.data:
            continue
        sample_id = response.data[0]["id"]

        insert_data.append({
            "sample_id": sample_id,
            "tpm": row.get(f"{metric}_tpm"),
            "fpkm": row.get(f"{metric}_fpkm"),
            "fpkm_uq": row.get(f"{metric}_fpkm_uq")
        })

    if insert_data:
        response = supabase.table(metric).insert(insert_data).execute()
        print(f"✅ Inserted {len(insert_data)} rows to {metric}")
    else:
        print(f"⚠️ No insert data prepared for {metric}")
