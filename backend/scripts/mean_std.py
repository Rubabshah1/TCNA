import pandas as pd
import numpy as np 

def mean_std_calculation(expr_matrix):
    # expr_matrix = expr_matrix.values.astype(np.float32)
    mean_plus_std_per_gene = expr_matrix.std(axis=1) + expr_matrix.mean(axis=1)
    # std_df = pd.DataFrame({'Gene': mean_plus_std_per_sample.index, 'std_dev': mean_plus_std_per_sample.values})
    # std_df.to_csv(f"/Users/rubabshah/Downloads/cancer-gene-noise-explorer-main 2/backend/data/metrics/{cancer}/mean+std_dev_per_sample.csv", index = False)

    return mean_plus_std_per_gene