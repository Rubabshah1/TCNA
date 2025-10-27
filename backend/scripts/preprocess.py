import supabase
import os
import pandas as pd
import logging

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Supabase configuration - replace with your actual values
SUPABASE_URL = "https://vvtcajhtmarrzqgofzsl.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ2dGNhamh0bWFycnpxZ29menNsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAyODczODMsImV4cCI6MjA2NTg2MzM4M30.CvJY335QfWcLY_Z8L88SyUSe4KNKqoweaj7rVSjS1UA"
BASE_DIR = "../data/raw"  # Your directory with CSV.gz files

# Initialize Supabase client
supabase_client = supabase.create_client(SUPABASE_URL, SUPABASE_KEY)

DATA_TYPES = ["tpm", "fpkm", "fpkm_uq"]  # Norms

# Create the unified expr table (run once, or check if exists)
try:
    supabase_client.table("expr").insert({}).execute()  # Test if table exists
    logger.info("Table 'expr' already exists")
except Exception as e:
    if "relation \"expr\" does not exist" in str(e):
        # Create table using RPC or raw SQL if needed; assuming you create via dashboard or SQL Editor:
        # In Supabase SQL Editor: CREATE TABLE expr (cancer_site TEXT, condition TEXT, unit TEXT, gene_id TEXT, gene_name TEXT, sample_id TEXT, expr DOUBLE PRECISION);
        logger.info("Please create table 'expr' in Supabase SQL Editor with schema: cancer_site TEXT, condition TEXT, unit TEXT, gene_id TEXT, gene_name TEXT, sample_id TEXT, expr DOUBLE PRECISION")
    else:
        raise e

# Loop over cancers, norms, and conditions
for cancer in os.listdir(BASE_DIR):
    cancer_dir = os.path.join(BASE_DIR, cancer)
    if not os.path.isdir(cancer_dir):
        continue
    for norm in DATA_TYPES:
        for condition in ["tumor", "normal"]:
            file = os.path.join(cancer_dir, f"{condition}_{norm}.csv.gz")
            if not os.path.exists(file):
                logger.warning(f"File not found: {file}")
                continue
            try:
                # Read CSV.gz to pandas for transformation
                df = pd.read_csv(file, sep=None, engine="python", compression='gzip')
                logger.info(f"Loaded {file}, shape: {df.shape}")

                # Ensure expected columns
                if 'gene_id' not in df.columns or 'gene_name' not in df.columns:
                    logger.error(f"Missing gene_id or gene_name in {file}")
                    continue

                # Melt the DataFrame: samples as rows
                id_vars = ['gene_id', 'gene_name']
                value_vars = [col for col in df.columns if col not in id_vars]
                df_melted = df.melt(id_vars=id_vars, value_vars=value_vars, 
                                   var_name='sample_id', value_name='expr')
                
                # Add metadata columns
                df_melted['cancer_site'] = cancer
                df_melted['condition'] = condition
                df_melted['unit'] = norm

                # Ensure correct dtypes and columns
                df_melted = df_melted[['cancer_site', 'condition', 'unit', 'gene_id', 
                                      'gene_name', 'sample_id', 'expr']]
                df_melted['expr'] = pd.to_numeric(df_melted['expr'], errors='coerce')

                # Convert to list of dicts for Supabase insert
                data_list = df_melted.to_dict('records')

                # Batch insert (Supabase handles up to ~1000 rows per request; split if larger)
                if len(data_list) > 1000:
                    for i in range(0, len(data_list), 1000):
                        batch = data_list[i:i+1000]
                        supabase_client.table("expr").insert(batch).execute()
                        logger.info(f"Inserted batch {i//1000 + 1} for {cancer}_{norm}_{condition}")
                else:
                    supabase_client.table("expr").insert(data_list).execute()
                    logger.info(f"Inserted {cancer}_{norm}_{condition} into expr table")

            except Exception as e:
                logger.error(f"Failed to process {file}: {e}")

logger.info("Ingestion complete. Data loaded to Supabase table 'expr'")
# import duckdb
# import os
# import pandas as pd
# import logging

# logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
# logger = logging.getLogger(__name__)

# BASE_DIR = "../data/raw"  # Your directory with Parquet files
# DB_PATH = "../data/duckdb/expression.db"  # Output DB file
# DATA_TYPES = ["tpm", "fpkm", "fpkm_uq"]  # Norms

# # Connect to DuckDB
# con = duckdb.connect(DB_PATH)

# # Create the unified expr table
# con.execute("""
# CREATE TABLE IF NOT EXISTS expr (
#     cancer_site STRING,
#     condition STRING,
#     unit STRING,
#     gene_id STRING,
#     gene_name STRING,
#     sample_id STRING,
#     expr FLOAT
# )
# """)
# logger.info("Created expr table schema")

# # Loop over cancers, norms, and conditions
# for cancer in os.listdir(BASE_DIR):
#     cancer_dir = os.path.join(BASE_DIR, cancer)
#     if not os.path.isdir(cancer_dir):
#         continue
#     for norm in DATA_TYPES:
#         for condition in ["tumor", "normal"]:
#             file = os.path.join(cancer_dir, f"{condition}_{norm}.csv.gz")
#             if not os.path.exists(file):
#                 logger.warning(f"File not found: {file}")
#                 continue
#             try:
#                 # Read Parquet to pandas for transformation
#                 df = pd.read_csv(file, sep=None, engine="python")
#                 logger.info(f"Loaded {file}, shape: {df.shape}")

#                 # Ensure expected columns
#                 if 'gene_id' not in df.columns or 'gene_name' not in df.columns:
#                     logger.error(f"Missing gene_id or gene_name in {file}")
#                     continue

#                 # Melt the DataFrame: samples as rows
#                 id_vars = ['gene_id', 'gene_name']
#                 value_vars = [col for col in df.columns if col not in id_vars]
#                 df_melted = df.melt(id_vars=id_vars, value_vars=value_vars, 
#                                    var_name='sample_id', value_name='expr')
                
#                 # Add metadata columns
#                 df_melted['cancer_site'] = cancer
#                 df_melted['condition'] = condition
#                 df_melted['unit'] = norm

#                 # Ensure correct dtypes
#                 df_melted = df_melted[['cancer_site', 'condition', 'unit', 'gene_id', 
#                                       'gene_name', 'sample_id', 'expr']]
#                 df_melted['expr'] = pd.to_numeric(df_melted['expr'], errors='coerce')

#                 # Insert into DuckDB
#                 con.register('temp_df', df_melted)
#                 con.execute("""
#                 INSERT INTO expr 
#                 SELECT cancer_site, condition, unit, gene_id, gene_name, sample_id, expr 
#                 FROM temp_df
#                 """)
#                 logger.info(f"Inserted {cancer}_{norm}_{condition} into expr table")
#             except Exception as e:
#                 logger.error(f"Failed to process {file}: {e}")

# con.close()
# logger.info(f"Ingestion complete. DB file: {DB_PATH}")