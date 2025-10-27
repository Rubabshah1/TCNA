import os
import pandas as pd
import pymysql
import tempfile
from tqdm import tqdm

# === CONFIG ===
DATA_DIR = "/Users/rubabshah/Downloads/cancer-gene-noise-explorer-main 2/backend/data/raw"
BATCH_SIZE = 1000000
CANCER_NAMES = ["Breast", "Brain", "Blood", "Bladder"]  # 👈 change this for each run

# === CONNECT TO DATABASE ===
conn = pymysql.connect(
    host='localhost',
    user='rubab',
    password='initiate123',
    database='cancer_db'
)
cur = conn.cursor()

# === FETCH ID MAPS ONCE ===
print("🔄 Fetching gene_id and sample_id maps from MariaDB...")
cur.execute("SELECT id, ensembl_id FROM genes")
gene_map = {ensembl_id: id for id, ensembl_id in cur.fetchall()}

cur.execute("SELECT id, sample_barcode FROM samples")
sample_map = {barcode: id for id, barcode in cur.fetchall()}

print(f"✅ Loaded {len(gene_map):,} genes and {len(sample_map):,} samples.\n")


# === CORE FUNCTION ===
def process_expression_set(folder_path, prefix, cancer_name):
    """
    Process one expression type (tumor or normal) inside a cancer folder.
    Loads data, merges, maps IDs, and bulk loads into MariaDB.
    """
    print(f"🧬 Processing {prefix.upper()} data for {cancer_name}...")

    # === File paths ===
    tpm_path = os.path.join(folder_path, f"{prefix}_tpm.csv")
    fpkm_path = os.path.join(folder_path, f"{prefix}_fpkm.csv")
    fpkm_uq_path = os.path.join(folder_path, f"{prefix}_fpkm_uq.csv")

    # === Check existence ===
    if not all(os.path.exists(p) for p in [tpm_path, fpkm_path, fpkm_uq_path]):
        print(f"⚠️ Missing {prefix} files in {cancer_name}, skipping.")
        return

    # === Load CSVs efficiently ===
    print("📥 Loading CSV files...")
    read_opts = dict(low_memory=False, dtype=str)
    tpm_df = pd.read_csv(tpm_path, **read_opts)
    fpkm_df = pd.read_csv(fpkm_path, **read_opts)
    fpkm_uq_df = pd.read_csv(fpkm_uq_path, **read_opts)

    # Drop gene_name and normalize gene_id
    for df in (tpm_df, fpkm_df, fpkm_uq_df):
        df.drop(columns=["gene_name"], errors="ignore", inplace=True)
        df.rename(columns={"gene_id": "ensembl_id"}, inplace=True)

    # === Melt (wide → long) ===
    print("🔄 Melting dataframes...")
    tpm_long = tpm_df.melt(id_vars="ensembl_id", var_name="sample_barcode", value_name="tpm")
    fpkm_long = fpkm_df.melt(id_vars="ensembl_id", var_name="sample_barcode", value_name="fpkm")
    fpkm_uq_long = fpkm_uq_df.melt(id_vars="ensembl_id", var_name="sample_barcode", value_name="fpkm_uq")

    # === Merge all three ===
    merged_df = tpm_long.merge(fpkm_long, on=["ensembl_id", "sample_barcode"])
    merged_df = merged_df.merge(fpkm_uq_long, on=["ensembl_id", "sample_barcode"])
    print(f"✅ {prefix.capitalize()} merged rows: {len(merged_df):,}")

    # === Map gene_id and sample_id (vectorized) ===
    print("🧭 Mapping gene/sample IDs...")
    merged_df["gene_id"] = merged_df["ensembl_id"].map(gene_map)
    merged_df["sample_id"] = merged_df["sample_barcode"].map(sample_map)
    merged_df.dropna(subset=["gene_id", "sample_id"], inplace=True)

    # Keep only needed columns
    merged_df = merged_df[["gene_id", "sample_id", "tpm", "fpkm", "fpkm_uq"]]
    merged_df[["tpm", "fpkm", "fpkm_uq"]] = merged_df[["tpm", "fpkm", "fpkm_uq"]].apply(
        pd.to_numeric, errors="coerce"
    )

    print(f"📊 Ready to insert {len(merged_df):,} records for {cancer_name}-{prefix}")

    # === Write to a temporary TSV file ===
    with tempfile.NamedTemporaryFile(mode="w", suffix=".tsv", delete=False) as tmpfile:
        tmp_path = tmpfile.name
        merged_df.to_csv(tmp_path, sep="\t", header=False, index=False)
    print(f"💾 Temp file created: {tmp_path}")

    # === Try fast LOAD DATA LOCAL INFILE ===
    try:
        print("⚡ Bulk loading into MariaDB using LOAD DATA LOCAL INFILE...")
        load_sql = f"""
        LOAD DATA LOCAL INFILE '{tmp_path}'
        INTO TABLE gene_expressions
        FIELDS TERMINATED BY '\\t'
        LINES TERMINATED BY '\\n'
        (gene_id, sample_id, tpm, fpkm, fpkm_uq)
        ON DUPLICATE KEY UPDATE
            tpm = VALUES(tpm),
            fpkm = VALUES(fpkm),
            fpkm_uq = VALUES(fpkm_uq)
        """
        cur.execute(load_sql)
        conn.commit()
        print(f"✅ Successfully loaded {len(merged_df):,} {prefix} records for {cancer_name}")

    except Exception as e:
        print(f"❌ LOAD DATA failed: {e}")
        print("⚠️ Falling back to slower executemany() mode...")

        insert_query = """
            INSERT INTO gene_expressions (gene_id, sample_id, tpm, fpkm, fpkm_uq)
            VALUES (%s, %s, %s, %s, %s)
            ON DUPLICATE KEY UPDATE
                tpm = VALUES(tpm),
                fpkm = VALUES(fpkm),
                fpkm_uq = VALUES(fpkm_uq)
        """

        records = merged_df.values.tolist()
        for i in range(0, len(records), BATCH_SIZE):
            batch = records[i:i + BATCH_SIZE]
            cur.executemany(insert_query, batch)
            conn.commit()
            print(f"✅ Inserted batch {i:,}–{i + len(batch):,} ({prefix}) for {cancer_name}")

    finally:
        os.remove(tmp_path)
        print(f"🧹 Cleaned up temp file {tmp_path}")


def process_cancer_folder(folder_path, cancer_name):
    """Process all data (tumor + normal) for one cancer site"""
    print(f"\n📂 Processing {cancer_name}...")

    for prefix in ["tumor", "normal"]:
        process_expression_set(folder_path, prefix, cancer_name)

    print(f"🎉 Finished {cancer_name}\n")


# === MAIN LOOP ===
for cancer_name in CANCER_NAMES:
    folder_path = os.path.join(DATA_DIR, cancer_name)
    if os.path.isdir(folder_path):
        process_cancer_folder(folder_path, cancer_name)
    else:
        print(f"❌ Folder not found: {folder_path}")

cur.close()
conn.close()
print("\n🎯 All cancer folders processed successfully!")

# import os
# import pandas as pd
# import pymysql
# from tqdm import tqdm

# # === CONFIG ===
# DATA_DIR = "/Users/rubabshah/Downloads/cancer-gene-noise-explorer-main 2/backend/data/raw"
# BATCH_SIZE = 100000

# conn = pymysql.connect(
#     host='localhost',
#     user='rubab',
#     password='initiate123',
#     database='cancer_db'
# )
# cur = conn.cursor()


# # === FETCH ID MAPS ONCE ===
# print("🔄 Fetching gene_id and sample_id maps from MariaDB...")
# cur.execute("SELECT id, ensembl_id FROM genes")
# gene_map = {ensembl_id: id for id, ensembl_id in cur.fetchall()}

# cur.execute("SELECT id, sample_barcode FROM samples")
# sample_map = {barcode: id for id, barcode in cur.fetchall()}


# def process_expression_set(folder_path, prefix, cancer_name):
#     """
#     Process one expression type (tumor or normal) inside a cancer folder.
#     Example: prefix = 'tumor' or 'normal'
#     """
#     print(f"🧬 Processing {prefix.upper()} data for {cancer_name}...")

#     # Build file paths dynamically
#     tpm_path = os.path.join(folder_path, f"{prefix}_tpm.csv.gz")
#     print(tpm_path)
#     fpkm_path = os.path.join(folder_path, f"{prefix}_fpkm.csv.gz")
#     fpkm_uq_path = os.path.join(folder_path, f"{prefix}_fpkm_uq.csv.gz")

#     # Check existence
#     if not all(os.path.exists(p) for p in [tpm_path, fpkm_path, fpkm_uq_path]):
#         print(f"⚠️ Missing {prefix} files in {cancer_name}, skipping.")
#         return

#     # === Load CSVs ===
#     tpm_df = pd.read_csv(tpm_path)
#     fpkm_df = pd.read_csv(fpkm_path)
#     fpkm_uq_df = pd.read_csv(fpkm_uq_path)

#     # Drop gene_name if present
#     for df in [tpm_df, fpkm_df, fpkm_uq_df]:
#         df.drop(columns=["gene_name"], errors="ignore", inplace=True)
#         df.rename(columns={"gene_id": "ensembl_id"}, inplace=True)

#     # === Melt (wide → long) ===
#     tpm_long = tpm_df.melt(id_vars="ensembl_id", var_name="sample_barcode", value_name="tpm")
#     fpkm_long = fpkm_df.melt(id_vars="ensembl_id", var_name="sample_barcode", value_name="fpkm")
#     fpkm_uq_long = fpkm_uq_df.melt(id_vars="ensembl_id", var_name="sample_barcode", value_name="fpkm_uq")

#     # === Merge all three ===
#     merged_df = tpm_long.merge(fpkm_long, on=["ensembl_id", "sample_barcode"])
#     merged_df = merged_df.merge(fpkm_uq_long, on=["ensembl_id", "sample_barcode"])

#     print(f"✅ {prefix.capitalize()} merged rows: {len(merged_df)}")

#     # === Prepare records ===
#     records = []
#     missing_genes = 0
#     missing_samples = 0

#     for _, row in tqdm(merged_df.iterrows(), total=len(merged_df), desc=f"{cancer_name}-{prefix}"):
#         gene_id = gene_map.get(row["ensembl_id"])
#         sample_id = sample_map.get(row["sample_barcode"])

#         if not gene_id:
#             missing_genes += 1
#             continue
#         if not sample_id:
#             missing_samples += 1
#             continue

#         records.append((
#             gene_id,
#             sample_id,
#             float(row["tpm"]) if pd.notna(row["tpm"]) else None,
#             float(row["fpkm"]) if pd.notna(row["fpkm"]) else None,
#             float(row["fpkm_uq"]) if pd.notna(row["fpkm_uq"]) else None
#         ))

#     print(f"🔹 Prepared {len(records)} {prefix} records "
#           f"({missing_genes} missing genes, {missing_samples} missing samples)")

#     # === Insert into MariaDB ===
#     insert_query = """
#         INSERT INTO gene_expressions (gene_id, sample_id, tpm, fpkm, fpkm_uq)
#         VALUES (%s, %s, %s, %s, %s)
#         ON DUPLICATE KEY UPDATE
#             tpm = VALUES(tpm),
#             fpkm = VALUES(fpkm),
#             fpkm_uq = VALUES(fpkm_uq)
#     """

#     for i in range(0, len(records), BATCH_SIZE):
#         batch = records[i:i + BATCH_SIZE]
#         cur.executemany(insert_query, batch)
#         conn.commit()
#         print(f"✅ Inserted batch {i}–{i + len(batch)} ({prefix}) for {cancer_name}")


# def process_cancer_folder(folder_path, cancer_name):
#     """Process all data (tumor + normal) for one cancer site"""
#     print(f"\n📂 Processing {cancer_name}...")

#     for prefix in ["tumor", "normal"]:
#         process_expression_set(folder_path, prefix, cancer_name)

#     print(f"🎉 Finished {cancer_name}")


# # # === MAIN LOOP: iterate over all cancer folders ===
# # for folder in sorted(os.listdir(DATA_DIR)):
# #     folder_path = os.path.join(DATA_DIR, folder)
# #     if os.path.isdir(folder_path):
# #         process_cancer_folder(folder_path, folder)
# CANCER_NAME = "Uterus"  # 👈 change this for each run
# folder_path = os.path.join(DATA_DIR, CANCER_NAME)

# if os.path.isdir(folder_path):
#     process_cancer_folder(folder_path, CANCER_NAME)
# else:
#     print(f"❌ Folder not found: {folder_path}")

# cur.close()
# conn.close()
# print("\n🎯 All cancer folders processed successfully!")