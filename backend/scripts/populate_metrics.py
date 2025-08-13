
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
