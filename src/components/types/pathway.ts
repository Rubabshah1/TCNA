export interface GeneStats {
  gene: string;
  ensembl_id: string;
  mean_tumor: number;
  mean_normal: number;
  cv_tumor: number;
  cv_normal: number;
  logFC: number;
}

export interface Enrichment {
  Term: string;
  "P-value": number;
  "Adjusted P-value": number;
  "Combined Score": number;
  Genes: string[];
}

export interface ResultsData {
  enrichment: Enrichment[];
  top_genes: string[];
  gene_stats: GeneStats[];
}