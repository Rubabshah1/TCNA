import pandas as pd
import numpy as np
def cv_calculation(expr_matrix):
    # expr_matrix = expr_matrix.values.astype(np.float32)
    # cv_per_gene = expr_matrix.std(axis=1) / (expr_matrix.mean(axis=1) )
    # cv_df = pd.DataFrame({'Gene': cv_per_gene.index, 'cv': cv_per_gene.values})
    # cv_df.to_csv(f"/Users/rubabshah/Downloads/cancer-gene-noise-explorer-main 2/backend/data/metrics/{cancer}/cv_scores.csv", index = False)
    mean_per_gene = np.mean(expr_matrix, axis=1)
    std_per_gene = np.std(expr_matrix, axis=1, ddof=1)  # Sample standard deviation
    # Compute CV (std / mean), avoiding division by zero
    cv_per_gene = np.divide(std_per_gene, mean_per_gene, 
                           out=np.zeros_like(std_per_gene), 
                           where=mean_per_gene != 0)
    return cv_per_gene