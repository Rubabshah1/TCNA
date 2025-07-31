export interface GeneStats {
  gene: string;
  ensembl_id: string;
  gene_symbol: string;
  cv_tumor: number;
  mean_tumor: number;
  std_tumor: number;
  mad_tumor: number;
  cv_squared_tumor: number;
  cv_normal: number;
  mean_normal: number;
  std_normal: number;
  mad_normal: number;
  cv_squared_normal: number;
  tumorSamples: number;
  normalSamples: number;
  logFC: number;
  tumorValues: number[];
  normalValues: number[];
}

export interface ResultsData {
  resultsData: GeneStats[];
  totalTumorSamples: number;
  totalNormalSamples: number;
}