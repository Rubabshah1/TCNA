// // import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
// // import { useSearchParams, Link } from "react-router-dom";
// // import supabase from "@/supabase-client";
// // import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
// // import { Button } from "@/components/ui/button";
// // import { ArrowLeft, Download, Activity, Users, Info, ChevronDown, ChevronUp } from "lucide-react";
// // import { PlotlyHeatmap, PlotlyBarChart } from "@/components/charts/index";
// // import Header from "@/components/header";
// // import Footer from "@/components/footer";
// // import { GeneStats, Enrichment, ResultsData } from "@/components/types/pathway";
// // import { useCache } from "@/hooks/use-cache";
// // import { LoadingSpinner } from "@/components/ui/loadingSpinner";
// // import FilterPanel from "@/components/FilterPanel";
// // import { DataTable } from "@/components/ui/data-table";
// // import CollapsibleCard from "@/components/ui/collapsible-card";

// // const PathwayResults = () => {
// //   const [searchParams] = useSearchParams();
// //   const params = useMemo(
// //     () => ({
// //       cancerSite: searchParams.get("site") || "",
// //       cancerTypes: searchParams.get("cancerTypes")?.split(",").filter(Boolean) || [],
// //       genes: searchParams.get("genes")?.split(",").filter(Boolean) || [],
// //       method: searchParams.get("method") || "tpm",
// //       topN: parseInt(searchParams.get("top_n") || "15", 10),
// //       analysisType: searchParams.get("analysisType") || "ORA",
// //     }),
// //     [searchParams]
// //   );

// //   const [normalizationMethod, setNormalizationMethod] = useState(params.method);
// //   const [currentResults, setCurrentResults] = useState<ResultsData>({ enrichment: [], top_genes: [], gene_stats: [] });
// //   const [isLoading, setIsLoading] = useState(false);
// //   const [error, setError] = useState<string | null>(null);
// //   const [totalTumorSamples, setTotalTumorSamples] = useState(0);
// //   const [totalNormalSamples, setTotalNormalSamples] = useState(0);
// //   const [customGeneInput, setCustomGeneInput] = useState("");
// //   const [selectedPathway, setSelectedPathway] = useState<Enrichment | null>(null);
// //   const [showGeneInput, setShowGeneInput] = useState(params.analysisType === "ORA");
// //   const [sortBy, setSortBy] = useState<"pval" | "adjPval">("pval");
// //   const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
// //   const filterTimeoutRef = useRef<NodeJS.Timeout | null>(null);
// //   const { getCachedData, setCachedData, generateCacheKey } = useCache<ResultsData>();
// //   const normalizationMethods = ["tpm", "fpkm", "fpkm_uq"];
// //   const logFCColors = currentResults.gene_stats.map((gene) =>
// //     gene.logFC < 0 ? "#ef4444" : "#3b82f6" // red for downregulated, blue for upregulated
// //   );

// //   const sampleCountData = useMemo(
// //     () => [
// //       { type: "Tumor", count: totalTumorSamples, colors: "#ef4444" },
// //       { type: "Normal", count: totalNormalSamples, colors: "#10b981" },
// //     ],
// //     [totalTumorSamples, totalNormalSamples]
// //   );

// //   const updateFilters = useCallback(
// //     (newFilters: { normalizationMethod?: string }) => {
// //       if (filterTimeoutRef.current) {
// //         clearTimeout(filterTimeoutRef.current);
// //       }
// //       filterTimeoutRef.current = setTimeout(() => {
// //         if (newFilters.normalizationMethod) {
// //           setNormalizationMethod(newFilters.normalizationMethod);
// //         }
// //       }, 300);
// //     },
// //     []
// //   );

// //   const formatPValue = (pValue: number) => {
// //     if (pValue <= 0.001) return "****";
// //     if (pValue <= 0.01) return "***";
// //     if (pValue <= 0.05) return "**";
// //     return pValue.toExponential(2);
// //   };

// //   const handleGeneInput = (e: React.ChangeEvent<HTMLInputElement>) => {
// //     setCustomGeneInput(e.target.value);
// //   };

// //   const processCustomGenes = () => {
// //     return customGeneInput
// //       .split(/[\s,|]+/)
// //       .map((gene) => gene.trim())
// //       .filter((gene) => gene.length > 0);
// //   };

// //   const submitCustomGenes = () => {
// //     const genes = processCustomGenes();
// //     if (genes.length > 0) {
// //       localStorage.clear();
// //       window.location.href = `/pathway-results?site=${params.cancerSite}&cancerTypes=${params.cancerTypes.join(
// //         ","
// //       )}&genes=${genes.join(",")}&method=${normalizationMethod}&top_n=${params.topN}&analysisType=ORA`;
// //     }
// //   };

// //   const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
// //     const file = e.target.files?.[0];
// //     if (!file) return;
// //     const reader = new FileReader();
// //     reader.onload = (event) => {
// //       const content = event.target?.result as string;
// //       const genes = content.split(/[\s,|\n]+/).filter((gene) => gene.trim().length > 0);
// //       setCustomGeneInput(genes.join(", "));
// //     };
// //     reader.readAsText(file);
// //   };

// //   const fetchSampleCounts = useCallback(async (cancerSite: string, cancerTypes: string[]) => {
// //     try {
// //       const { data: siteRows, error: siteRowsErr } = await supabase
// //         .from("Sites")
// //         .select("id, name")
// //         .eq("name", cancerSite);
// //       if (siteRowsErr) throw new Error(`Failed to fetch cancer site: ${siteRowsErr.message}`);
// //       if (!siteRows?.length) throw new Error(`Cancer site not found: ${cancerSite}`);
// //       const cancerSiteId = siteRows[0].id;

// //       const { data: cancerTypeRows, error: cancerTypeErr } =
// //         cancerTypes.length > 0
// //           ? await supabase
// //               .from("cancer_types")
// //               .select("id, tcga_code")
// //               .in("tcga_code", cancerTypes)
// //           : await supabase
// //               .from("cancer_types")
// //               .select("id, tcga_code, site_id")
// //               .eq("site_id", cancerSiteId);

// //       if (cancerTypeErr) throw new Error(`Failed to fetch cancer types: ${cancerTypeErr.message}`);
// //       const cancerTypeIds = cancerTypeRows.map((row) => row.id);

// //       const { data: samplesData, error: samplesError } = await supabase
// //         .from("samples")
// //         .select("id, sample_barcode, sample_type, cancer_type_id")
// //         .in("cancer_type_id", cancerTypeIds);

// //       if (samplesError) throw new Error(`Failed to fetch samples: ${samplesError.message}`);
// //       const tumorSamples = samplesData
// //         .filter((s) => s.sample_type?.toLowerCase() === "tumor")
// //         .map((s) => s.sample_barcode);
// //       const normalSamples = samplesData
// //         .filter((s) => s.sample_type?.toLowerCase() === "normal")
// //         .map((s) => s.sample_barcode);
// //       setTotalTumorSamples(tumorSamples.length);
// //       setTotalNormalSamples(normalSamples.length);
// //       return { tumorSamples, normalSamples };
// //     } catch (error: any) {
// //       console.error("Error fetching sample counts:", error);
// //       setError(error.message || "An error occurred while fetching sample counts.");
// //       return { tumorSamples: [], normalSamples: [] };
// //     }
// //   }, []);

// //   useEffect(() => {
// //     if (params.cancerSite) {
// //       fetchSampleCounts(params.cancerSite, params.cancerTypes);
// //     }
// //   }, [params.cancerSite, params.cancerTypes, fetchSampleCounts]);

// //   useEffect(() => {
// //     if (!normalizationMethods.includes(normalizationMethod)) {
// //       setNormalizationMethod("tpm");
// //     }
// //     const cacheKey = generateCacheKey({
// //       cancerSite: params.cancerSite,
// //       cancerTypes: params.cancerTypes,
// //       genes: params.genes,
// //       method: normalizationMethod,
// //       topN: params.topN,
// //       analysisType: params.analysisType,
// //     });
// //     const cachedResults = getCachedData(cacheKey);
// //     if (cachedResults) {
// //       setCurrentResults(cachedResults);
// //     } else {
// //       setCurrentResults({ enrichment: [], top_genes: [], gene_stats: [] });
// //     }
// //   }, [normalizationMethod, params, getCachedData, generateCacheKey]);

// //   useEffect(() => {
// //     let isMounted = true;
// //     const fetchData = async () => {
// //       if (!params.cancerSite) {
// //         if (isMounted) {
// //           setError("Please select a cancer site.");
// //           setIsLoading(false);
// //         }
// //         return;
// //       }
// //       const cacheKeys = normalizationMethods.map((method) =>
// //         generateCacheKey({
// //           cancerSite: params.cancerSite,
// //           cancerTypes: params.cancerTypes,
// //           genes: params.genes,
// //           method,
// //           topN: params.topN,
// //           analysisType: params.analysisType,
// //         })
// //       );
// //       const allCachedResults = cacheKeys.map((key) => getCachedData(key));
// //       if (allCachedResults.every((result) => result !== null)) {
// //         console.log("Using cached data for all normalization methods");
// //         if (isMounted) {
// //           const currentCacheKey = generateCacheKey({
// //             cancerSite: params.cancerSite,
// //             cancerTypes: params.cancerTypes,
// //             genes: params.genes,
// //             method: normalizationMethod,
// //             topN: params.topN,
// //             analysisType: params.analysisType,
// //           });
// //           const currentResults = allCachedResults[cacheKeys.indexOf(currentCacheKey)]!;
// //           setCurrentResults(currentResults);
// //           setIsLoading(false);
// //           setError(null);
// //         }
// //         return;
// //       }
// //       setIsLoading(true);
// //       setError(null);
// //       try {
// //         const { data: siteRows, error: siteRowsErr } = await supabase
// //           .from("Sites")
// //           .select("id, name")
// //           .eq("name", params.cancerSite);
// //         if (siteRowsErr) throw new Error(`Failed to fetch cancer site: ${siteRowsErr.message}`);
// //         if (!siteRows?.length) throw new Error(`Cancer site not found: ${params.cancerSite}`);
// //         const cancerSiteId = siteRows[0].id;

// //         const { data: cancerTypeRows, error: cancerTypeErr } =
// //           params.cancerTypes.length > 0
// //             ? await supabase
// //                 .from("cancer_types")
// //                 .select("id, tcga_code")
// //                 .in("tcga_code", params.cancerTypes)
// //             : await supabase
// //                 .from("cancer_types")
// //                 .select("id, tcga_code, site_id")
// //                 .eq("site_id", cancerSiteId);

// //         if (cancerTypeErr) throw new Error(`Failed to fetch cancer types: ${cancerTypeErr.message}`);
// //         const cancerTypeIds = cancerTypeRows.map((row) => row.id);

// //         const { data: samplesData, error: samplesError } = await supabase
// //           .from("samples")
// //           .select("id, sample_barcode, sample_type, cancer_type_id")
// //           .in("cancer_type_id", cancerTypeIds);

// //         if (samplesError) throw new Error(`Failed to fetch samples: ${samplesError.message}`);
// //         const tumorSamples = samplesData
// //           .filter((s) => s.sample_type?.toLowerCase() === "tumor")
// //           .map((s) => s.sample_barcode);
// //         const normalSamples = samplesData
// //           .filter((s) => s.sample_type?.toLowerCase() === "normal")
// //           .map((s) => s.sample_barcode);
// //         if (isMounted) {
// //           setTotalTumorSamples(tumorSamples.length);
// //           setTotalNormalSamples(normalSamples.length);
// //         }
// //         const fetchPromises = normalizationMethods.map(async (method) => {
// //           const queryParams = new URLSearchParams({
// //             cancer: params.cancerSite,
// //             method,
// //             tumor_samples: tumorSamples.join(",") || "sample1",
// //             normal_samples: normalSamples.join(",") || "sample2",
// //             top_n: params.topN.toString(),
// //             analysis_type: params.analysisType,
// //             ...(params.genes.length > 0 && params.analysisType === "ORA" && { genes: params.genes.join(",") }),
// //           });
// //           const response = await fetch(`http://localhost:5001/api/pathway-analysis?${queryParams}`);
// //           if (!response.ok) {
// //             const errorText = await response.text();
// //             throw new Error(`Failed to fetch pathway analysis data for ${method}: ${errorText}`);
// //           }
// //           const apiData = await response.json();
// //           return { method, apiData };
// //         });
// //         const results = await Promise.allSettled(fetchPromises);
// //         let geneToEnsemblMap = new Map<string, string>();
// //         let allGenesToProcess: string[] = [];
// //         results.forEach((result, index) => {
// //           if (result.status === "fulfilled") {
// //             const { apiData } = result.value;
// //             const genes = params.analysisType === "ORA" && params.genes.length > 0 ? params.genes : apiData.top_genes;
// //             allGenesToProcess = [...new Set([...allGenesToProcess, ...genes])];
// //           }
// //         });
// //         if (allGenesToProcess.length > 0) {
// //           const { data: geneData, error: geneError } = await supabase
// //             .from("genes")
// //             .select("id, ensembl_id, gene_symbol")
// //             .in("gene_symbol", allGenesToProcess);
// //           if (geneError) {
// //             console.error("Gene error:", geneError);
// //             throw new Error(`Failed to fetch genes: ${geneError.message}`);
// //           }
// //           geneToEnsemblMap = new Map(geneData.map((g) => [g.gene_symbol, g.ensembl_id]));
// //         }
// //         results.forEach((result, index) => {
// //           if (result.status === "fulfilled") {
// //             const { method, apiData } = result.value;
// //             const genesToProcess = params.analysisType === "ORA" && params.genes.length > 0 ? params.genes : apiData.top_genes;
// //             const processedGeneStats: GeneStats[] = genesToProcess.map((gene: string) => {
// //               const stats = apiData.gene_stats[gene] || {};
// //               return {
// //                 gene,
// //                 ensembl_id: geneToEnsemblMap.get(gene) || "N/A",
// //                 mean_tumor: stats.mean_tumor || 0,
// //                 mean_normal: stats.mean_normal || 0,
// //                 cv_tumor: stats.cv_tumor || 0,
// //                 cv_normal: stats.cv_normal || 0,
// //                 logFC: stats.logfc || 0,
// //               };
// //             });
// //             const newResults: ResultsData = {
// //               enrichment: apiData.enrichment || [],
// //               top_genes: genesToProcess,
// //               gene_stats: processedGeneStats,
// //             };
// //             const cacheKey = generateCacheKey({
// //               cancerSite: params.cancerSite,
// //               cancerTypes: params.cancerTypes,
// //               genes: params.genes,
// //               method,
// //               topN: params.topN,
// //               analysisType: params.analysisType,
// //             });
// //             setCachedData(cacheKey, newResults);
// //             if (isMounted && method === normalizationMethod) {
// //               setCurrentResults(newResults);
// //             }
// //           } else {
// //             console.error(`Error fetching data for ${normalizationMethods[index]}:`, result.reason);
// //             if (isMounted && normalizationMethods[index] === normalizationMethod) {
// //               setError(`Failed to fetch data for ${normalizationMethods[index]}: ${result.reason.message}`);
// //               setCurrentResults({ enrichment: [], top_genes: [], gene_stats: [] });
// //             }
// //           }
// //         });
// //         if (isMounted) {
// //           setIsLoading(false);
// //         }
// //       } catch (error: any) {
// //         console.error("Error fetching data:", error);
// //         if (isMounted) {
// //           setError(error.message || "An error occurred while fetching data.");
// //           setCurrentResults({ enrichment: [], top_genes: [], gene_stats: [] });
// //           setIsLoading(false);
// //         }
// //       }
// //     };
// //     fetchData();
// //     return () => {
// //       isMounted = false;
// //     };
// //   }, [params.cancerSite, params.cancerTypes, params.genes, params.topN, params.analysisType, getCachedData, setCachedData, generateCacheKey]);

// //   const downloadData = useCallback(
// //     (type: "enrichment" | "mean_expression" | "noise_metrics") => {
// //       let data: any[] = [];
// //       let headers: string[] = [];
// //       let filename = `pathway_analysis_${params.cancerSite}_${params.analysisType}_${normalizationMethod}_${Date.now()}`;
// //       if (type === "enrichment") {
// //         data = currentResults.enrichment;
// //         headers = ["Term", "P-value", "Adjusted P-value", "Combined Score", "Genes"];
// //         filename = `enrichment_${filename}.csv`;
// //         const rows = data.map((row) =>
// //           [row.Term, row["P-value"], row["Adjusted P-value"], row["Combined Score"], row.Genes.join(", ")].join(",")
// //         );
// //         const content = [headers.join(","), ...rows].join("\n");
// //         const blob = new Blob([content], { type: "text/csv" });
// //         const url = URL.createObjectURL(blob);
// //         const a = document.createElement("a");
// //         a.href = url;
// //         a.download = filename;
// //         a.click();
// //         URL.revokeObjectURL(url);
// //       } else if (type === "mean_expression") {
// //         data = currentResults.gene_stats;
// //         headers = ["Gene", "Ensembl ID", "Mean Tumor", "Mean Normal"];
// //         filename = `mean_expression_${filename}.csv`;
// //         const rows = data.map((row) =>
// //           [row.gene, row.ensembl_id, row.mean_tumor.toFixed(2), row.mean_normal.toFixed(2)].join(",")
// //         );
// //         const content = [headers.join(","), ...rows].join("\n");
// //         const blob = new Blob([content], { type: "text/csv" });
// //         const url = URL.createObjectURL(blob);
// //         const a = document.createElement("a");
// //         a.href = url;
// //         a.download = filename;
// //         a.click();
// //         URL.revokeObjectURL(url);
// //       } else if (type === "noise_metrics") {
// //         data = currentResults.gene_stats;
// //         headers = ["Gene", "Ensembl ID", "CV Tumor", "CV Normal", "Log2FC"];
// //         filename = `noise_metrics_${filename}.csv`;
// //         const rows = data.map((row) =>
// //           [row.gene, row.ensembl_id, row.cv_tumor.toFixed(2), row.cv_normal.toFixed(2), row.logFC.toFixed(2)].join(",")
// //         );
// //         const content = [headers.join(","), ...rows].join("\n");
// //         const blob = new Blob([content], { type: "text/csv" });
// //         const url = URL.createObjectURL(blob);
// //         const a = document.createElement("a");
// //         a.href = url;
// //         a.download = filename;
// //         a.click();
// //         URL.revokeObjectURL(url);
// //       }
// //     },
// //     [currentResults, params.cancerSite, params.cancerTypes, params.analysisType, normalizationMethod]
// //   );

// //   return (
// //     <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-yellow-50 flex flex-col">
// //       <Header />
// //       <main className="flex-grow">
// //         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
// //           <div className="grid grid-cols-[320px_1fr] gap-6">
// //             <FilterPanel
// //               normalizationMethod={normalizationMethod}
// //               setNormalizationMethod={(value) => updateFilters({ normalizationMethod: value })}
// //             />
// //             <div className="flex-1">
// //               {isLoading ? (
// //                 <LoadingSpinner message="Loading pathway results..." />
// //               ) : currentResults.gene_stats.length === 0 ? (
// //                 <LoadingSpinner message="Loading pathway results..." />
// //               ) : (
// //                 <>
// //                   <Link
// //                     to="/pathway-analysis"
// //                     className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-6 transition-colors"
// //                   >
// //                     <ArrowLeft className="h-4 w-4 mr-2" />
// //                     Back to Pathway Analysis
// //                   </Link>
// //                   <div className="mb-8">
// //                     <h2 className="text-4xl font-bold text-blue-900 mb-2">
// //                       Results for {params.cancerSite} Cancer {params.cancerTypes}
// //                     </h2>
// //                     <div className="flex items-center justify-between mb-4">
// //                       <p className="text-blue-700 text-lg">
// //                         Normalization: <strong>{normalizationMethod.toUpperCase()}</strong>,{" "}
// //                         {params.analysisType === "ORA" && params.genes.length > 0
// //                           ? `Custom genes (${params.genes.length})`
// //                           : `Top ${params.topN} Noisy Genes`}
// //                       </p>
// //                       <Button
// //                         onClick={() => downloadData("enrichment")}
// //                         variant="outline"
// //                         size="sm"
// //                       >
// //                         <Download className="h-4 w-4 mr-2" /> Download Enrichment CSV
// //                       </Button>
// //                     </div>
// //                     <CollapsibleCard title="Sample Counts">
// //                       <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
// //                         <Card className="border-0 shadow-lg">
// //                           <CardContent className="flex flex-col items-center p-4 text-center">
// //                             <Users className="h-6 w-6 text-red-600 mb-2" />
// //                             <div className="text-2xl font-bold text-red-600">{totalTumorSamples}</div>
// //                             <div className="text-xs text-gray-600">Total Tumor Samples</div>
// //                           </CardContent>
// //                         </Card>
// //                         <Card className="border-0 shadow-lg">
// //                           <CardContent className="flex flex-col items-center p-4 text-center">
// //                             <Users className="h-6 w-6 text-green-600 mb-2" />
// //                             <div className="text-2xl font-bold text-green-600">{totalNormalSamples}</div>
// //                             <div className="text-xs text-gray-600">Total Normal Samples</div>
// //                           </CardContent>
// //                         </Card>
// //                       </div>
// //                       <PlotlyBarChart
// //                         data={sampleCountData}
// //                         xKey="type"
// //                         yKey="count"
// //                         title="Sample Count Distribution"
// //                         xLabel="Sample Type"
// //                         yLabel="Count"
// //                         orientation="v"
// //                         colors={sampleCountData.map((group) => group.colors)}
// //                         legendLabels={["Tumor", "Normal"]}
// //                       />
// //                     </CollapsibleCard>
// //                   </div>
// //                   {currentResults.enrichment.length === 0 ? (
// //                     <Card className="shadow-lg p-6 text-center text-blue-700">
// //                       <Activity className="w-10 h-10 mx-auto mb-3" />
// //                       <p className="text-lg">No pathway enrichment results found for the selected parameters.</p>
// //                     </Card>
// //                   ) : (
// //                     <>
// //                       <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
// //                         <div className="lg:col-span-2">
// //                           <CollapsibleCard title="Enriched Pathways" className="h-full">
// //                             <DataTable
// //                               data={currentResults.enrichment}
// //                               columns={[
// //                                 { key: "Term", header: "Pathway", sortable: true },
// //                                 {
// //                                   key: "P-value",
// //                                   header: "P-value",
// //                                   sortable: true,
// //                                   render: (value: number) => formatPValue(value),
// //                                 },
// //                                 {
// //                                   key: "Adjusted P-value",
// //                                   header: "Adj. P-value",
// //                                   sortable: true,
// //                                   render: (value: number) => formatPValue(value),
// //                                 },
// //                               ]}
// //                               defaultSortKey={sortBy === "pval" ? "P-value" : "Adjusted P-value"}
// //                               defaultSortOrder={sortOrder}
// //                               onRowClick={setSelectedPathway}
// //                             />
// //                           </CollapsibleCard>
// //                         </div>
// //                         <div>
// //                           <CollapsibleCard title="Pathway Details" className="h-full">
// //                             {selectedPathway ? (
// //                               <div className="space-y-2 p-2">
// //                                 <div>
// //                                   <h3 className="font-semibold text-blue-700 text-sm">{selectedPathway.Term}</h3>
// //                                 </div>
// //                                 <div>
// //                                   <h4 className="font-medium text-blue-700 text-xs">Statistics</h4>
// //                                   <div className="grid grid-cols-2 gap-1 mt-1 text-xs">
// //                                     <div>P-value:</div>
// //                                     <div>{selectedPathway["P-value"].toExponential(2)}</div>
// //                                     <div>Adj. P-value:</div>
// //                                     <div>{selectedPathway["Adjusted P-value"].toExponential(2)}</div>
// //                                   </div>
// //                                 </div>
// //                                 <div>
// //                                   <h4 className="font-medium text-blue-700 text-xs">Associated Genes</h4>
// //                                   {/* <ScrollArea className="h-[200px]"> */}
// //                                     <div className="flex flex-wrap gap-1 mt-1">
// //                                       {selectedPathway.Genes.map((gene, idx) => (
// //                                         <span
// //                                           key={idx}
// //                                           className="bg-blue-100 text-blue-800 px-1 py-0.5 rounded text-xs"
// //                                         >
// //                                           {gene}
// //                                         </span>
// //                                       ))}
// //                                     </div>
// //                                   {/* </ScrollArea> */}
// //                                 </div>
// //                               </div>
// //                             ) : (
// //                               <div className="text-center text-gray-500 h-full flex items-center justify-center">
// //                                 <div>
// //                                   <Info className="h-6 w-6 mx-auto mb-1" />
// //                                   <p className="text-xs">Select a pathway to view details</p>
// //                                 </div>
// //                               </div>
// //                             )}
// //                           </CollapsibleCard>
// //                         </div>
// //                       </div>
// //                       <div className="grid grid-cols-1 gap-4 mb-4">
// //                         <CollapsibleCard title="Mean Expression Heatmap">
// //                           <PlotlyHeatmap
// //                             title="Mean Expression Heatmap"
// //                             data={currentResults.gene_stats}
// //                             xValues={["Tumor", "Normal"]}
// //                             yValues={currentResults.gene_stats.map((d) => d.gene)}
// //                             zValues={currentResults.gene_stats.map((d) => [d.mean_tumor, d.mean_normal])}
// //                             zLabel="Expression Level"
// //                             chartKey="mean-expression"
// //                             xLabel="Sample Type"
// //                             yLabel="Genes"
// //                             annotation={params.cancerSite}
// //                           />
// //                         </CollapsibleCard>
// //                         <CollapsibleCard title="Coefficient of Variation Heatmap">
// //                           <PlotlyHeatmap
// //                             title="Coefficient of Variation Heatmap"
// //                             data={currentResults.gene_stats}
// //                             xValues={["Tumor", "Normal"]}
// //                             yValues={currentResults.gene_stats.map((d) => d.gene)}
// //                             zValues={currentResults.gene_stats.map((d) => [d.cv_tumor, d.cv_normal])}
// //                             zLabel="CV"
// //                             chartKey="cv-heatmap"
// //                             xLabel="Sample Type"
// //                             yLabel="Genes"
// //                             annotation={params.cancerSite}
// //                           />
// //                         </CollapsibleCard>
// //                         <CollapsibleCard title="Log2 Fold Change">
// //                           <PlotlyBarChart
// //                             data={currentResults.gene_stats}
// //                             xKey="logFC"
// //                             yKey="gene"
// //                             title="Log2 Fold Change"
// //                             xLabel="Log2 Fold Change"
// //                             yLabel="Genes"
// //                             colors={logFCColors}
// //                             showLegend={false}
// //                           />
// //                         </CollapsibleCard>
// //                       </div>
// //                       <CollapsibleCard
// //                         title="Mean Expression Analysis"
// //                         className="mb-4"
// //                         downloadButton={
// //                           <Button
// //                             onClick={() => downloadData("mean_expression")}
// //                             variant="outline"
// //                             size="sm"
// //                             className="h-6 px-2 text-xs"
// //                           >
// //                             <Download className="h-4 w-4 mr-2" /> Download CSV
// //                           </Button>
// //                         }
// //                       >
// //                         {currentResults.gene_stats.length > 0 ? (
// //                           <DataTable
// //                             data={currentResults.gene_stats}
// //                             columns={[
// //                               { key: "gene", header: "Gene", sortable: true },
// //                               { key: "ensembl_id", header: "Ensembl ID", sortable: true },
// //                               {
// //                                 key: "mean_tumor",
// //                                 header: `Mean Tumor (${normalizationMethod})`,
// //                                 sortable: true,
// //                                 render: (value: number) => value.toFixed(2),
// //                               },
// //                               {
// //                                 key: "mean_normal",
// //                                 header: `Mean Normal (${normalizationMethod})`,
// //                                 sortable: true,
// //                                 render: (value: number) => value.toFixed(2),
// //                               },
// //                             ]}
// //                           />
// //                         ) : (
// //                           <p className="text-blue-700 text-sm">No mean expression data available.</p>
// //                         )}
// //                       </CollapsibleCard>
// //                       <CollapsibleCard
// //                         title="Noise Metrics Analysis"
// //                         className="mb-4 p-2 text-sm"
// //                         downloadButton={
// //                           <Button
// //                             onClick={() => downloadData("noise_metrics")}
// //                             variant="outline"
// //                             size="sm"
// //                             className="h-6 px-2 text-xs"
// //                           >
// //                             <Download className="h-4 w-4 mr-2" /> Download CSV
// //                           </Button>
// //                         }
// //                       >
// //                         {currentResults.gene_stats.length > 0 ? (
// //                           <DataTable
// //                             data={currentResults.gene_stats}
// //                             columns={[
// //                               { key: "gene", header: "Gene", sortable: true },
// //                               { key: "ensembl_id", header: "Ensembl ID", sortable: true },
// //                               {
// //                                 key: "cv_tumor",
// //                                 header: `CV Tumor (${normalizationMethod})`,
// //                                 sortable: true,
// //                                 render: (value: number) => value.toFixed(2),
// //                               },
// //                               {
// //                                 key: "cv_normal",
// //                                 header: `CV Normal (${normalizationMethod})`,
// //                                 sortable: true,
// //                                 render: (value: number) => value.toFixed(2),
// //                               },
// //                               {
// //                                 key: "logFC",
// //                                 header: "Log2FC",
// //                                 sortable: true,
// //                                 render: (value: number) => value.toFixed(2),
// //                               },
// //                             ]}
// //                           />
// //                         ) : (
// //                           <p className="text-blue-700">No noise metrics data available.</p>
// //                         )}
// //                       </CollapsibleCard>
// //                     </>
// //                   )}
// //                 </>
// //               )}
// //             </div>
// //           </div>
// //         </div>
// //       </main>
// //       <Footer />
// //     </div>
// //   );
// // };

// // export default PathwayResults;
// import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
// import { useSearchParams, Link } from "react-router-dom";
// import supabase from "@/supabase-client";
// import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
// import { Button } from "@/components/ui/button";
// import { ArrowLeft, Download, Activity, Users, Info, ChevronDown, ChevronUp } from "lucide-react";
// import { PlotlyHeatmap, PlotlyBarChart } from "@/components/charts/index";
// import Header from "@/components/header";
// import Footer from "@/components/footer";
// import { GeneStats, Enrichment, ResultsData } from "@/components/types/pathway";
// import { useCache } from "@/hooks/use-cache";
// import { LoadingSpinner } from "@/components/ui/loadingSpinner";
// import FilterPanel from "@/components/FilterPanel";
// import { DataTable } from "@/components/ui/data-table";
// import CollapsibleCard from "@/components/ui/collapsible-card";

// const PathwayResults = () => {
//   const [searchParams] = useSearchParams();
//   const params = useMemo(
//     () => ({
//       sites: searchParams.get("sites")?.split(",").filter(Boolean) || [],
//       cancerTypes: searchParams.get("cancerTypes")?.split(",").filter(Boolean) || [],
//       genes: searchParams.get("genes")?.split(",").filter(Boolean) || [],
//       method: searchParams.get("method") || "tpm",
//       topN: parseInt(searchParams.get("top_n") || "15", 10),
//       analysisType: searchParams.get("analysisType") || "ORA",
//       siteAnalysisType: searchParams.get("siteAnalysisType") || "pan-cancer",
//     }),
//     [searchParams]
//   );

//   const [normalizationMethod, setNormalizationMethod] = useState(params.method);
//   const [currentResults, setCurrentResults] = useState<ResultsData>({ enrichment: [], top_genes: [], gene_stats: [] });
//   const [isLoading, setIsLoading] = useState(false);
//   const [error, setError] = useState<string | null>(null);
//   const [totalTumorSamples, setTotalTumorSamples] = useState(0);
//   const [totalNormalSamples, setTotalNormalSamples] = useState(0);
//   const [customGeneInput, setCustomGeneInput] = useState("");
//   const [selectedPathway, setSelectedPathway] = useState<Enrichment | null>(null);
//   const [showGeneInput, setShowGeneInput] = useState(params.analysisType === "ORA");
//   const [sortBy, setSortBy] = useState<"pval" | "adjPval">("pval");
//   const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
//   const filterTimeoutRef = useRef<NodeJS.Timeout | null>(null);
//   const { getCachedData, setCachedData, generateCacheKey } = useCache<ResultsData>();
//   const normalizationMethods = ["tpm", "fpkm", "fpkm_uq"];
//   const logFCColors = currentResults.gene_stats.map((gene) =>
//     gene.logFC < 0 ? "#ef4444" : "#3b82f6" // red for downregulated, blue for upregulated
//   );

//   const sampleCountData = useMemo(
//     () => [
//       { type: "Tumor", count: totalTumorSamples, colors: "#ef4444" },
//       { type: "Normal", count: totalNormalSamples, colors: "#10b981" },
//     ],
//     [totalTumorSamples, totalNormalSamples]
//   );

//   const updateFilters = useCallback(
//     (newFilters: { normalizationMethod?: string }) => {
//       if (filterTimeoutRef.current) {
//         clearTimeout(filterTimeoutRef.current);
//       }
//       filterTimeoutRef.current = setTimeout(() => {
//         if (newFilters.normalizationMethod) {
//           setNormalizationMethod(newFilters.normalizationMethod);
//         }
//       }, 300);
//     },
//     []
//   );

//   const formatPValue = (pValue: number) => {
//     if (pValue <= 0.001) return "****";
//     if (pValue <= 0.01) return "***";
//     if (pValue <= 0.05) return "**";
//     return pValue.toExponential(2);
//   };

//   const handleGeneInput = (e: React.ChangeEvent<HTMLInputElement>) => {
//     setCustomGeneInput(e.target.value);
//   };

//   const processCustomGenes = () => {
//     return customGeneInput
//       .split(/[\s,|]+/)
//       .map((gene) => gene.trim())
//       .filter((gene) => gene.length > 0);
//   };

//   const submitCustomGenes = () => {
//     const genes = processCustomGenes();
//     if (genes.length > 0) {
//       localStorage.clear();
//       window.location.href = `/pathway-results?sites=${params.sites.join(
//         ","
//       )}&cancerTypes=${params.cancerTypes.join(
//         ","
//       )}&genes=${genes.join(",")}&method=${normalizationMethod}&top_n=${params.topN}&analysisType=ORA&siteAnalysisType=${params.siteAnalysisType}`;
//     }
//   };

//   const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
//     const file = e.target.files?.[0];
//     if (!file) return;
//     const reader = new FileReader();
//     reader.onload = (event) => {
//       const content = event.target?.result as string;
//       const genes = content.split(/[\s,|\n]+/).filter((gene) => gene.trim().length > 0);
//       setCustomGeneInput(genes.join(", "));
//     };
//     reader.readAsText(file);
//   };

//   const fetchSampleCounts = useCallback(async (sites: string[], cancerTypes: string[]) => {
//     try {
//       const { data: siteRows, error: siteRowsErr } = await supabase
//         .from("Sites")
//         .select("id, name")
//         .in("name", sites);
//       if (siteRowsErr) throw new Error(`Failed to fetch cancer sites: ${siteRowsErr.message}`);
//       if (!siteRows?.length) throw new Error(`Cancer sites not found: ${sites.join(", ")}`);
//       const cancerSiteIds = siteRows.map((row) => row.id);

//       const { data: cancerTypeRows, error: cancerTypeErr } =
//         cancerTypes.length > 0
//           ? await supabase
//               .from("cancer_types")
//               .select("id, tcga_code")
//               .in("tcga_code", cancerTypes)
//           : await supabase
//               .from("cancer_types")
//               .select("id, tcga_code, site_id")
//               .in("site_id", cancerSiteIds);

//       if (cancerTypeErr) throw new Error(`Failed to fetch cancer types: ${cancerTypeErr.message}`);
//       const cancerTypeIds = cancerTypeRows.map((row) => row.id);

//       const { data: samplesData, error: samplesError } = await supabase
//         .from("samples")
//         .select("id, sample_barcode, sample_type, cancer_type_id")
//         .in("cancer_type_id", cancerTypeIds);

//       if (samplesError) throw new Error(`Failed to fetch samples: ${samplesError.message}`);
//       const tumorSamples = samplesData
//         .filter((s) => s.sample_type?.toLowerCase() === "tumor")
//         .map((s) => s.sample_barcode);
//       const normalSamples = samplesData
//         .filter((s) => s.sample_type?.toLowerCase() === "normal")
//         .map((s) => s.sample_barcode);
//       setTotalTumorSamples(tumorSamples.length);
//       setTotalNormalSamples(normalSamples.length);
//       return { tumorSamples, normalSamples };
//     } catch (error: any) {
//       console.error("Error fetching sample counts:", error);
//       setError(error.message || "An error occurred while fetching sample counts.");
//       return { tumorSamples: [], normalSamples: [] };
//     }
//   }, []);

//   useEffect(() => {
//     if (params.sites.length > 0) {
//       fetchSampleCounts(params.sites, params.cancerTypes);
//     }
//   }, [params.sites, params.cancerTypes, fetchSampleCounts]);

//   useEffect(() => {
//     if (!normalizationMethods.includes(normalizationMethod)) {
//       setNormalizationMethod("tpm");
//     }
//     const cacheKey = generateCacheKey({
//       sites: params.sites,
//       cancerTypes: params.cancerTypes,
//       genes: params.genes,
//       method: normalizationMethod,
//       topN: params.topN,
//       analysisType: params.analysisType,
//       siteAnalysisType: params.siteAnalysisType,
//     });
//     const cachedResults = getCachedData(cacheKey);
//     if (cachedResults) {
//       setCurrentResults(cachedResults);
//     } else {
//       setCurrentResults({ enrichment: [], top_genes: [], gene_stats: [] });
//     }
//   }, [normalizationMethod, params, getCachedData, generateCacheKey]);

//   useEffect(() => {
//     let isMounted = true;
//     const fetchData = async () => {
//       if (params.sites.length === 0) {
//         if (isMounted) {
//           setError("Please select at least one cancer site.");
//           setIsLoading(false);
//         }
//         return;
//       }
//       const cacheKeys = normalizationMethods.map((method) =>
//         generateCacheKey({
//           sites: params.sites,
//           cancerTypes: params.cancerTypes,
//           genes: params.genes,
//           method,
//           topN: params.topN,
//           analysisType: params.analysisType,
//           siteAnalysisType: params.siteAnalysisType,
//         })
//       );
//       const allCachedResults = cacheKeys.map((key) => getCachedData(key));
//       if (allCachedResults.every((result) => result !== null)) {
//         console.log("Using cached data for all normalization methods");
//         if (isMounted) {
//           const currentCacheKey = generateCacheKey({
//             sites: params.sites,
//             cancerTypes: params.cancerTypes,
//             genes: params.genes,
//             method: normalizationMethod,
//             topN: params.topN,
//             analysisType: params.analysisType,
//             siteAnalysisType: params.siteAnalysisType,
//           });
//           const currentResults = allCachedResults[cacheKeys.indexOf(currentCacheKey)]!;
//           setCurrentResults(currentResults);
//           setIsLoading(false);
//           setError(null);
//         }
//         return;
//       }
//       setIsLoading(true);
//       setError(null);
//       try {
//         const { data: siteRows, error: siteRowsErr } = await supabase
//           .from("Sites")
//           .select("id, name")
//           .in("name", params.sites);
//         if (siteRowsErr) throw new Error(`Failed to fetch cancer sites: ${siteRowsErr.message}`);
//         if (!siteRows?.length) throw new Error(`Cancer sites not found: ${params.sites.join(", ")}`);
//         const cancerSiteIds = siteRows.map((row) => row.id);

//         const { data: cancerTypeRows, error: cancerTypeErr } =
//           params.cancerTypes.length > 0
//             ? await supabase
//                 .from("cancer_types")
//                 .select("id, tcga_code")
//                 .in("tcga_code", params.cancerTypes)
//             : await supabase
//                 .from("cancer_types")
//                 .select("id, tcga_code, site_id")
//                 .in("site_id", cancerSiteIds);

//         if (cancerTypeErr) throw new Error(`Failed to fetch cancer types: ${cancerTypeErr.message}`);
//         const cancerTypeIds = cancerTypeRows.map((row) => row.id);

//         const { data: samplesData, error: samplesError } = await supabase
//           .from("samples")
//           .select("id, sample_barcode, sample_type, cancer_type_id")
//           .in("cancer_type_id", cancerTypeIds);

//         if (samplesError) throw new Error(`Failed to fetch samples: ${samplesError.message}`);
//         const tumorSamples = samplesData
//           .filter((s) => s.sample_type?.toLowerCase() === "tumor")
//           .map((s) => s.sample_barcode);
//         const normalSamples = samplesData
//           .filter((s) => s.sample_type?.toLowerCase() === "normal")
//           .map((s) => s.sample_barcode);
//         if (isMounted) {
//           setTotalTumorSamples(tumorSamples.length);
//           setTotalNormalSamples(normalSamples.length);
//         }
//         const fetchPromises = normalizationMethods.map(async (method) => {
//           const queryParams = new URLSearchParams({
//             sites: params.sites.join(","),
//             method,
//             tumor_samples: tumorSamples.join(",") || "sample1",
//             normal_samples: normalSamples.join(",") || "sample2",
//             top_n: params.topN.toString(),
//             analysis_type: params.analysisType,
//             site_analysis_type: params.siteAnalysisType,
//             ...(params.genes.length > 0 && params.analysisType === "ORA" && { genes: params.genes.join(",") }),
//           });
//           const response = await fetch(`http://localhost:5001/api/pathway-analysis?${queryParams}`);
//           if (!response.ok) {
//             const errorText = await response.text();
//             throw new Error(`Failed to fetch pathway analysis data for ${method}: ${errorText}`);
//           }
//           const apiData = await response.json();
//           return { method, apiData };
//         });
//         const results = await Promise.allSettled(fetchPromises);
//         let geneToEnsemblMap = new Map<string, string>();
//         let allGenesToProcess: string[] = [];
//         results.forEach((result, index) => {
//           if (result.status === "fulfilled") {
//             const { apiData } = result.value;
//             const genes = params.analysisType === "ORA" && params.genes.length > 0 ? params.genes : apiData.top_genes;
//             allGenesToProcess = [...new Set([...allGenesToProcess, ...genes])];
//           }
//         });
//         if (allGenesToProcess.length > 0) {
//           const { data: geneData, error: geneError } = await supabase
//             .from("genes")
//             .select("id, ensembl_id, gene_symbol")
//             .in("gene_symbol", allGenesToProcess);
//           if (geneError) {
//             console.error("Gene error:", geneError);
//             throw new Error(`Failed to fetch genes: ${geneError.message}`);
//           }
//           geneToEnsemblMap = new Map(geneData.map((g) => [g.gene_symbol, g.ensembl_id]));
//         }
//         results.forEach((result, index) => {
//           if (result.status === "fulfilled") {
//             const { method, apiData } = result.value;
//             const genesToProcess = params.analysisType === "ORA" && params.genes.length > 0 ? params.genes : apiData.top_genes;
//             const processedGeneStats: GeneStats[] = genesToProcess.map((gene: string) => {
//               const stats = apiData.gene_stats[gene] || {};
//               return {
//                 gene,
//                 ensembl_id: geneToEnsemblMap.get(gene) || "N/A",
//                 mean_tumor: stats.mean_tumor || 0,
//                 mean_normal: stats.mean_normal || 0,
//                 cv_tumor: stats.cv_tumor || 0,
//                 cv_normal: stats.cv_normal || 0,
//                 logFC: stats.logfc || 0,
//               };
//             });
//             const newResults: ResultsData = {
//               enrichment: apiData.enrichment || [],
//               top_genes: genesToProcess,
//               gene_stats: processedGeneStats,
//             };
//             const cacheKey = generateCacheKey({
//               sites: params.sites,
//               cancerTypes: params.cancerTypes,
//               genes: params.genes,
//               method,
//               topN: params.topN,
//               analysisType: params.analysisType,
//               siteAnalysisType: params.siteAnalysisType,
//             });
//             setCachedData(cacheKey, newResults);
//             if (isMounted && method === normalizationMethod) {
//               setCurrentResults(newResults);
//             }
//           } else {
//             console.error(`Error fetching data for ${normalizationMethods[index]}:`, result.reason);
//             if (isMounted && normalizationMethods[index] === normalizationMethod) {
//               setError(`Failed to fetch data for ${normalizationMethods[index]}: ${result.reason.message}`);
//               setCurrentResults({ enrichment: [], top_genes: [], gene_stats: [] });
//             }
//           }
//         });
//         if (isMounted) {
//           setIsLoading(false);
//         }
//       } catch (error: any) {
//         console.error("Error fetching data:", error);
//         if (isMounted) {
//           setError(error.message || "An error occurred while fetching data.");
//           setCurrentResults({ enrichment: [], top_genes: [], gene_stats: [] });
//           setIsLoading(false);
//         }
//       }
//     };
//     fetchData();
//     return () => {
//       isMounted = false;
//     };
//   }, [params.sites, params.cancerTypes, params.genes, params.topN, params.analysisType, params.siteAnalysisType, getCachedData, setCachedData, generateCacheKey]);

//   const downloadData = useCallback(
//     (type: "enrichment" | "mean_expression" | "noise_metrics") => {
//       let data: any[] = [];
//       let headers: string[] = [];
//       let filename = `pathway_analysis_${params.sites.join("_")}_${params.siteAnalysisType}_${params.analysisType}_${normalizationMethod}_${Date.now()}`;
//       if (type === "enrichment") {
//         data = currentResults.enrichment;
//         headers = ["Term", "P-value", "Adjusted P-value", "Combined Score", "Genes"];
//         filename = `enrichment_${filename}.csv`;
//         const rows = data.map((row) =>
//           [row.Term, row["P-value"], row["Adjusted P-value"], row["Combined Score"], row.Genes.join(", ")].join(",")
//         );
//         const content = [headers.join(","), ...rows].join("\n");
//         const blob = new Blob([content], { type: "text/csv" });
//         const url = URL.createObjectURL(blob);
//         const a = document.createElement("a");
//         a.href = url;
//         a.download = filename;
//         a.click();
//         URL.revokeObjectURL(url);
//       } else if (type === "mean_expression") {
//         data = currentResults.gene_stats;
//         headers = ["Gene", "Ensembl ID", "Mean Tumor", "Mean Normal"];
//         filename = `mean_expression_${filename}.csv`;
//         const rows = data.map((row) =>
//           [row.gene, row.ensembl_id, row.mean_tumor.toFixed(2), row.mean_normal.toFixed(2)].join(",")
//         );
//         const content = [headers.join(","), ...rows].join("\n");
//         const blob = new Blob([content], { type: "text/csv" });
//         const url = URL.createObjectURL(blob);
//         const a = document.createElement("a");
//         a.href = url;
//         a.download = filename;
//         a.click();
//         URL.revokeObjectURL(url);
//       } else if (type === "noise_metrics") {
//         data = currentResults.gene_stats;
//         headers = ["Gene", "Ensembl ID", "CV Tumor", "CV Normal", "Log2FC"];
//         filename = `noise_metrics_${filename}.csv`;
//         const rows = data.map((row) =>
//           [row.gene, row.ensembl_id, row.cv_tumor.toFixed(2), row.cv_normal.toFixed(2), row.logFC.toFixed(2)].join(",")
//         );
//         const content = [headers.join(","), ...rows].join("\n");
//         const blob = new Blob([content], { type: "text/csv" });
//         const url = URL.createObjectURL(blob);
//         const a = document.createElement("a");
//         a.href = url;
//         a.download = filename;
//         a.click();
//         URL.revokeObjectURL(url);
//       }
//     },
//     [currentResults, params.sites, params.cancerTypes, params.analysisType, params.siteAnalysisType, normalizationMethod]
//   );

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-yellow-50 flex flex-col">
//       <Header />
//       <main className="flex-grow">
//         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
//           <div className="grid grid-cols-[320px_1fr] gap-6">
//             <FilterPanel
//               normalizationMethod={normalizationMethod}
//               setNormalizationMethod={(value) => updateFilters({ normalizationMethod: value })}
//             />
//             <div className="flex-1">
//               {isLoading ? (
//                 <LoadingSpinner message="Loading pathway results..." />
//               ) : currentResults.gene_stats.length === 0 ? (
//                 <LoadingSpinner message="Loading pathway results..." />
//               ) : (
//                 <>
//                   <Link
//                     to="/pathway-analysis"
//                     className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-6 transition-colors"
//                   >
//                     <ArrowLeft className="h-4 w-4 mr-2" />
//                     Back to Pathway Analysis
//                   </Link>
//                   <div className="mb-8">
//                     <h2 className="text-4xl font-bold text-blue-900 mb-2">
//                       Results for {params.siteAnalysisType === "pan-cancer" ? "Pan-Cancer" : "Cancer-Specific"} Analysis ({params.sites.join(", ")})
//                     </h2>
//                     <div className="flex items-center justify-between mb-4">
//                       <p className="text-blue-700 text-lg">
//                         Normalization: <strong>{normalizationMethod.toUpperCase()}</strong>,{" "}
//                         {params.analysisType === "ORA" && params.genes.length > 0
//                           ? `Custom genes (${params.genes.length})`
//                           : `Top ${params.topN} Noisy Genes`}
//                       </p>
//                       <Button
//                         onClick={() => downloadData("enrichment")}
//                         variant="outline"
//                         size="sm"
//                       >
//                         <Download className="h-4 w-4 mr-2" /> Download Enrichment CSV
//                       </Button>
//                     </div>
//                     <CollapsibleCard title="Sample Counts">
//                       <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
//                         <Card className="border-0 shadow-lg">
//                           <CardContent className="flex flex-col items-center p-4 text-center">
//                             <Users className="h-6 w-6 text-red-600 mb-2" />
//                             <div className="text-2xl font-bold text-red-600">{totalTumorSamples}</div>
//                             <div className="text-xs text-gray-600">Total Tumor Samples</div>
//                           </CardContent>
//                         </Card>
//                         <Card className="border-0 shadow-lg">
//                           <CardContent className="flex flex-col items-center p-4 text-center">
//                             <Users className="h-6 w-6 text-green-600 mb-2" />
//                             <div className="text-2xl font-bold text-green-600">{totalNormalSamples}</div>
//                             <div className="text-xs text-gray-600">Total Normal Samples</div>
//                           </CardContent>
//                         </Card>
//                       </div>
//                       <PlotlyBarChart
//                         data={sampleCountData}
//                         xKey="type"
//                         yKey="count"
//                         title="Sample Count Distribution"
//                         xLabel="Sample Type"
//                         yLabel="Count"
//                         orientation="v"
//                         colors={sampleCountData.map((group) => group.colors)}
//                         legendLabels={["Tumor", "Normal"]}
//                       />
//                     </CollapsibleCard>
//                   </div>
//                   {currentResults.enrichment.length === 0 ? (
//                     <Card className="shadow-lg p-6 text-center text-blue-700">
//                       <Activity className="w-10 h-10 mx-auto mb-3" />
//                       <p className="text-lg">No pathway enrichment results found for the selected parameters.</p>
//                     </Card>
//                   ) : (
//                     <>
//                       <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
//                         <div className="lg:col-span-2">
//                           <CollapsibleCard title="Enriched Pathways" className="h-full">
//                             <DataTable
//                               data={currentResults.enrichment}
//                               columns={[
//                                 { key: "Term", header: "Pathway", sortable: true },
//                                 {
//                                   key: "P-value",
//                                   header: "P-value",
//                                   sortable: true,
//                                   render: (value: number) => formatPValue(value),
//                                 },
//                                 {
//                                   key: "Adjusted P-value",
//                                   header: "Adj. P-value",
//                                   sortable: true,
//                                   render: (value: number) => formatPValue(value),
//                                 },
//                               ]}
//                               defaultSortKey={sortBy === "pval" ? "P-value" : "Adjusted P-value"}
//                               defaultSortOrder={sortOrder}
//                               onRowClick={setSelectedPathway}
//                             />
//                           </CollapsibleCard>
//                         </div>
//                         <div>
//                           <CollapsibleCard title="Pathway Details" className="h-full">
//                             {selectedPathway ? (
//                               <div className="space-y-2 p-2">
//                                 <div>
//                                   <h3 className="font-semibold text-blue-700 text-sm">{selectedPathway.Term}</h3>
//                                 </div>
//                                 <div>
//                                   <h4 className="font-medium text-blue-700 text-xs">Statistics</h4>
//                                   <div className="grid grid-cols-2 gap-1 mt-1 text-xs">
//                                     <div>P-value:</div>
//                                     <div>{selectedPathway["P-value"].toExponential(2)}</div>
//                                     <div>Adj. P-value:</div>
//                                     <div>{selectedPathway["Adjusted P-value"].toExponential(2)}</div>
//                                   </div>
//                                 </div>
//                                 <div>
//                                   <h4 className="font-medium text-blue-700 text-xs">Associated Genes</h4>
//                                   <div className="flex flex-wrap gap-1 mt-1">
//                                     {selectedPathway.Genes.map((gene, idx) => (
//                                       <span
//                                         key={idx}
//                                         className="bg-blue-100 text-blue-800 px-1 py-0.5 rounded text-xs"
//                                       >
//                                         {gene}
//                                       </span>
//                                     ))}
//                                   </div>
//                                 </div>
//                               </div>
//                             ) : (
//                               <div className="text-center text-gray-500 h-full flex items-center justify-center">
//                                 <div>
//                                   <Info className="h-6 w-6 mx-auto mb-1" />
//                                   <p className="text-xs">Select a pathway to view details</p>
//                                 </div>
//                               </div>
//                             )}
//                           </CollapsibleCard>
//                         </div>
//                       </div>
//                       <div className="grid grid-cols-1 gap-4 mb-4">
//                         <CollapsibleCard title="Mean Expression Heatmap">
//                           <PlotlyHeatmap
//                             title="Mean Expression Heatmap"
//                             data={currentResults.gene_stats}
//                             xValues={["Tumor", "Normal"]}
//                             yValues={currentResults.gene_stats.map((d) => d.gene)}
//                             zValues={currentResults.gene_stats.map((d) => [d.mean_tumor, d.mean_normal])}
//                             zLabel="Expression Level"
//                             chartKey="mean-expression"
//                             xLabel="Sample Type"
//                             yLabel="Genes"
//                             annotation={params.sites.join(", ")}
//                           />
//                         </CollapsibleCard>
//                         <CollapsibleCard title="Coefficient of Variation Heatmap">
//                           <PlotlyHeatmap
//                             title="Coefficient of Variation Heatmap"
//                             data={currentResults.gene_stats}
//                             xValues={["Tumor", "Normal"]}
//                             yValues={currentResults.gene_stats.map((d) => d.gene)}
//                             zValues={currentResults.gene_stats.map((d) => [d.cv_tumor, d.cv_normal])}
//                             zLabel="CV"
//                             chartKey="cv-heatmap"
//                             xLabel="Sample Type"
//                             yLabel="Genes"
//                             annotation={params.sites.join(", ")}
//                           />
//                         </CollapsibleCard>
//                         <CollapsibleCard title="Log2 Fold Change">
//                           <PlotlyBarChart
//                             data={currentResults.gene_stats}
//                             xKey="logFC"
//                             yKey="gene"
//                             title="Log2 Fold Change"
//                             xLabel="Log2 Fold Change"
//                             yLabel="Genes"
//                             colors={logFCColors}
//                             showLegend={false}
//                           />
//                         </CollapsibleCard>
//                       </div>
//                       <CollapsibleCard
//                         title="Mean Expression Analysis"
//                         className="mb-4"
//                         downloadButton={
//                           <Button
//                             onClick={() => downloadData("mean_expression")}
//                             variant="outline"
//                             size="sm"
//                             className="h-6 px-2 text-xs"
//                           >
//                             <Download className="h-4 w-4 mr-2" /> Download CSV
//                           </Button>
//                         }
//                       >
//                         {currentResults.gene_stats.length > 0 ? (
//                           <DataTable
//                             data={currentResults.gene_stats}
//                             columns={[
//                               { key: "gene", header: "Gene", sortable: true },
//                               { key: "ensembl_id", header: "Ensembl ID", sortable: true },
//                               {
//                                 key: "mean_tumor",
//                                 header: `Mean Tumor (${normalizationMethod})`,
//                                 sortable: true,
//                                 render: (value: number) => value.toFixed(2),
//                               },
//                               {
//                                 key: "mean_normal",
//                                 header: `Mean Normal (${normalizationMethod})`,
//                                 sortable: true,
//                                 render: (value: number) => value.toFixed(2),
//                               },
//                             ]}
//                           />
//                         ) : (
//                           <p className="text-blue-700 text-sm">No mean expression data available.</p>
//                         )}
//                       </CollapsibleCard>
//                       <CollapsibleCard
//                         title="Noise Metrics Analysis"
//                         className="mb-4 p-2 text-sm"
//                         downloadButton={
//                           <Button
//                             onClick={() => downloadData("noise_metrics")}
//                             variant="outline"
//                             size="sm"
//                             className="h-6 px-2 text-xs"
//                           >
//                             <Download className="h-4 w-4 mr-2" /> Download CSV
//                           </Button>
//                         }
//                       >
//                         {currentResults.gene_stats.length > 0 ? (
//                           <DataTable
//                             data={currentResults.gene_stats}
//                             columns={[
//                               { key: "gene", header: "Gene", sortable: true },
//                               { key: "ensembl_id", header: "Ensembl ID", sortable: true },
//                               {
//                                 key: "cv_tumor",
//                                 header: `CV Tumor (${normalizationMethod})`,
//                                 sortable: true,
//                                 render: (value: number) => value.toFixed(2),
//                               },
//                               {
//                                 key: "cv_normal",
//                                 header: `CV Normal (${normalizationMethod})`,
//                                 sortable: true,
//                                 render: (value: number) => value.toFixed(2),
//                               },
//                               {
//                                 key: "logFC",
//                                 header: "Log2FC",
//                                 sortable: true,
//                                 render: (value: number) => value.toFixed(2),
//                               },
//                             ]}
//                           />
//                         ) : (
//                           <p className="text-blue-700">No noise metrics data available.</p>
//                         )}
//                       </CollapsibleCard>
//                     </>
//                   )}
//                 </>
//               )}
//             </div>
//           </div>
//         </div>
//       </main>
//       <Footer />
//     </div>
//   );
// };

// export default PathwayResults;
// import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
// import { useSearchParams, Link } from "react-router-dom";
// import supabase from "@/supabase-client";
// import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
// import { Button } from "@/components/ui/button";
// import { ArrowLeft, Download, Activity, Users, Info } from "lucide-react";
// import { PlotlyHeatmap, PlotlyBarChart } from "@/components/charts/index";
// import Header from "@/components/header";
// import Footer from "@/components/footer";
// import { GeneStats, Enrichment, ResultsData } from "@/components/types/pathway";
// import { useCache } from "@/hooks/use-cache";
// import { LoadingSpinner } from "@/components/ui/loadingSpinner";
// import FilterPanel from "@/components/FilterPanel";
// import { DataTable } from "@/components/ui/data-table";
// import CollapsibleCard from "@/components/ui/collapsible-card";

// const PathwayResults = () => {
//   const [searchParams] = useSearchParams();
//   const params = useMemo(
//     () => ({
//       sites: searchParams.get("sites")?.split(",").filter(Boolean) || [],
//       cancerTypes: searchParams.get("cancerTypes")?.split(",").filter(Boolean) || [],
//       genes: searchParams.get("genes")?.split(",").filter(Boolean) || [],
//       method: searchParams.get("method") || "tpm",
//       topN: parseInt(searchParams.get("top_n") || "15", 10),
//       analysisType: searchParams.get("analysisType") || "ORA",
//       siteAnalysisType: searchParams.get("siteAnalysisType") || "pan-cancer",
//     }),
//     [searchParams]
//   );

//   const [normalizationMethod, setNormalizationMethod] = useState(params.method);
//   const [currentResults, setCurrentResults] = useState<ResultsData>({ enrichment: [], top_genes: [], gene_stats: [] });
//   const [isLoading, setIsLoading] = useState(false);
//   const [error, setError] = useState<string | null>(null);
//   const [totalTumorSamples, setTotalTumorSamples] = useState(0);
//   const [totalNormalSamples, setTotalNormalSamples] = useState(0);
//   const [customGeneInput, setCustomGeneInput] = useState("");
//   const [selectedPathway, setSelectedPathway] = useState<Enrichment | null>(null);
//   const [showGeneInput, setShowGeneInput] = useState(params.analysisType === "ORA");
//   const [sortBy, setSortBy] = useState<"pval" | "adjPval">("pval");
//   const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
//   const filterTimeoutRef = useRef<NodeJS.Timeout | null>(null);
//   const { getCachedData, setCachedData, generateCacheKey } = useCache<ResultsData>();
//   const normalizationMethods = ["tpm", "fpkm", "fpkm_uq"];
//   const logFCColors = currentResults.gene_stats.map((gene) =>
//     gene.logFC < 0 ? "#ef4444" : "#3b82f6" // red for downregulated, blue for upregulated
//   );

//   const sampleCountData = useMemo(
//     () => [
//       { type: "Tumor", count: totalTumorSamples, colors: "#ef4444" },
//       { type: "Normal", count: totalNormalSamples, colors: "#10b981" },
//     ],
//     [totalTumorSamples, totalNormalSamples]
//   );

//   const updateFilters = useCallback(
//     (newFilters: { normalizationMethod?: string }) => {
//       if (filterTimeoutRef.current) {
//         clearTimeout(filterTimeoutRef.current);
//       }
//       filterTimeoutRef.current = setTimeout(() => {
//         if (newFilters.normalizationMethod) {
//           setNormalizationMethod(newFilters.normalizationMethod);
//         }
//       }, 300);
//     },
//     []
//   );

//   const formatPValue = (pValue: number) => {
//     if (pValue <= 0.001) return "****";
//     if (pValue <= 0.01) return "***";
//     if (pValue <= 0.05) return "**";
//     return pValue.toExponential(2);
//   };

//   const handleGeneInput = (e: React.ChangeEvent<HTMLInputElement>) => {
//     setCustomGeneInput(e.target.value);
//   };

//   const processCustomGenes = () => {
//     return customGeneInput
//       .split(/[\s,|]+/)
//       .map((gene) => gene.trim())
//       .filter((gene) => gene.length > 0);
//   };

//   const submitCustomGenes = () => {
//     const genes = processCustomGenes();
//     if (genes.length > 0) {
//       localStorage.clear();
//       window.location.href = `/pathway-results?sites=${params.sites.join(
//         ","
//       )}&cancerTypes=${params.cancerTypes.join(
//         ","
//       )}&genes=${genes.join(",")}&method=${normalizationMethod}&top_n=${params.topN}&analysisType=ORA&siteAnalysisType=${params.siteAnalysisType}`;
//     }
//   };

//   const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
//     const file = e.target.files?.[0];
//     if (!file) return;
//     const reader = new FileReader();
//     reader.onload = (event) => {
//       const content = event.target?.result as string;
//       const genes = content.split(/[\s,|\n]+/).filter((gene) => gene.trim().length > 0);
//       setCustomGeneInput(genes.join(", "));
//     };
//     reader.readAsText(file);
//   };

//   const fetchSampleCounts = useCallback(async (sites: string[], cancerTypes: string[]) => {
//     try {
//       const { data: siteRows, error: siteRowsErr } = await supabase
//         .from("Sites")
//         .select("id, name")
//         .in("name", sites);
//       if (siteRowsErr) throw new Error(`Failed to fetch cancer sites: ${siteRowsErr.message}`);
//       if (!siteRows?.length) throw new Error(`Cancer sites not found: ${sites.join(", ")}`);
//       const cancerSiteIds = siteRows.map((row) => row.id);

//       const { data: cancerTypeRows, error: cancerTypeErr } =
//         cancerTypes.length > 0
//           ? await supabase
//               .from("cancer_types")
//               .select("id, tcga_code")
//               .in("tcga_code", cancerTypes)
//           : await supabase
//               .from("cancer_types")
//               .select("id, tcga_code, site_id")
//               .in("site_id", cancerSiteIds);

//       if (cancerTypeErr) throw new Error(`Failed to fetch cancer types: ${cancerTypeErr.message}`);
//       const cancerTypeIds = cancerTypeRows.map((row) => row.id);

//       const { data: samplesData, error: samplesError } = await supabase
//         .from("samples")
//         .select("id, sample_barcode, sample_type, cancer_type_id")
//         .in("cancer_type_id", cancerTypeIds);

//       if (samplesError) throw new Error(`Failed to fetch samples: ${samplesError.message}`);
//       const tumorSamples = samplesData
//         .filter((s) => s.sample_type?.toLowerCase() === "tumor")
//         .map((s) => s.sample_barcode);
//       const normalSamples = samplesData
//         .filter((s) => s.sample_type?.toLowerCase() === "normal")
//         .map((s) => s.sample_barcode);
//       setTotalTumorSamples(tumorSamples.length);
//       setTotalNormalSamples(normalSamples.length);
//       return { tumorSamples, normalSamples };
//     } catch (error: any) {
//       console.error("Error fetching sample counts:", error);
//       setError(error.message || "An error occurred while fetching sample counts.");
//       return { tumorSamples: [], normalSamples: [] };
//     }
//   }, []);

//   useEffect(() => {
//     if (params.sites.length > 0) {
//       fetchSampleCounts(params.sites, params.cancerTypes);
//     }
//   }, [params.sites, params.cancerTypes, fetchSampleCounts]);

//   useEffect(() => {
//     if (!normalizationMethods.includes(normalizationMethod)) {
//       setNormalizationMethod("tpm");
//     }
//     const cacheKey = generateCacheKey({
//       sites: params.sites,
//       cancerTypes: params.cancerTypes,
//       genes: params.genes,
//       method: normalizationMethod,
//       topN: params.topN,
//       analysisType: params.analysisType,
//       siteAnalysisType: params.siteAnalysisType,
//     });
//     const cachedResults = getCachedData(cacheKey);
//     if (cachedResults) {
//       setCurrentResults(cachedResults);
//     } else {
//       setCurrentResults({ enrichment: [], top_genes: [], gene_stats: [] });
//     }
//   }, [normalizationMethod, params, getCachedData, generateCacheKey]);

//   useEffect(() => {
//     let isMounted = true;
//     const fetchData = async () => {
//       if (params.sites.length === 0) {
//         if (isMounted) {
//           setError("Please select at least one cancer site.");
//           setIsLoading(false);
//         }
//         return;
//       }
//       const cacheKeys = normalizationMethods.map((method) =>
//         generateCacheKey({
//           sites: params.sites,
//           cancerTypes: params.cancerTypes,
//           genes: params.genes,
//           method,
//           topN: params.topN,
//           analysisType: params.analysisType,
//           siteAnalysisType: params.siteAnalysisType,
//         })
//       );
//       const allCachedResults = cacheKeys.map((key) => getCachedData(key));
//       if (allCachedResults.every((result) => result !== null)) {
//         console.log("Using cached data for all normalization methods");
//         if (isMounted) {
//           const currentCacheKey = generateCacheKey({
//             sites: params.sites,
//             cancerTypes: params.cancerTypes,
//             genes: params.genes,
//             method: normalizationMethod,
//             topN: params.topN,
//             analysisType: params.analysisType,
//             siteAnalysisType: params.siteAnalysisType,
//           });
//           const currentResults = allCachedResults[cacheKeys.indexOf(currentCacheKey)]!;
//           setCurrentResults(currentResults);
//           setIsLoading(false);
//           setError(null);
//         }
//         return;
//       }
//       setIsLoading(true);
//       setError(null);
//       try {
//         const { data: siteRows, error: siteRowsErr } = await supabase
//           .from("Sites")
//           .select("id, name")
//           .in("name", params.sites);
//         if (siteRowsErr) throw new Error(`Failed to fetch cancer sites: ${siteRowsErr.message}`);
//         if (!siteRows?.length) throw new Error(`Cancer sites not found: ${params.sites.join(", ")}`);
//         const cancerSiteIds = siteRows.map((row) => row.id);

//         const { data: cancerTypeRows, error: cancerTypeErr } =
//           params.cancerTypes.length > 0
//             ? await supabase
//                 .from("cancer_types")
//                 .select("id, tcga_code")
//                 .in("tcga_code", params.cancerTypes)
//             : await supabase
//                 .from("cancer_types")
//                 .select("id, tcga_code, site_id")
//                 .in("site_id", cancerSiteIds);

//         if (cancerTypeErr) throw new Error(`Failed to fetch cancer types: ${cancerTypeErr.message}`);
//         const cancerTypeIds = cancerTypeRows.map((row) => row.id);

//         const { data: samplesData, error: samplesError } = await supabase
//           .from("samples")
//           .select("id, sample_barcode, sample_type, cancer_type_id")
//           .in("cancer_type_id", cancerTypeIds);

//         if (samplesError) throw new Error(`Failed to fetch samples: ${samplesError.message}`);
//         const tumorSamples = samplesData
//           .filter((s) => s.sample_type?.toLowerCase() === "tumor")
//           .map((s) => s.sample_barcode);
//         const normalSamples = samplesData
//           .filter((s) => s.sample_type?.toLowerCase() === "normal")
//           .map((s) => s.sample_barcode);
//         if (isMounted) {
//           setTotalTumorSamples(tumorSamples.length);
//           setTotalNormalSamples(normalSamples.length);
//         }

//         // For API compatibility, use the first site for cancer-specific or join sites for pan-cancer
//         const cancerParam = params.siteAnalysisType === "cancer-specific" ? params.sites[0] : params.sites.join(",");

//         const fetchPromises = normalizationMethods.map(async (method) => {
//           const queryParams = new URLSearchParams({
//             cancer: cancerParam,
//             method,
//             tumor_samples: tumorSamples.join(",") || "sample1",
//             normal_samples: normalSamples.join(",") || "sample2",
//             top_n: params.topN.toString(),
//             analysis_type: params.analysisType,
//             ...(params.genes.length > 0 && params.analysisType === "ORA" && { genes: params.genes.join(",") }),
//           });
//           const response = await fetch(`http://localhost:5001/api/pathway-analysis?${queryParams}`);
//           if (!response.ok) {
//             const errorText = await response.text();
//             throw new Error(`Failed to fetch pathway analysis data for ${method}: ${errorText}`);
//           }
//           const apiData = await response.json();
//           return { method, apiData };
//         });
//         const results = await Promise.allSettled(fetchPromises);
//         let geneToEnsemblMap = new Map<string, string>();
//         let allGenesToProcess: string[] = [];
//         results.forEach((result, index) => {
//           if (result.status === "fulfilled") {
//             const { apiData } = result.value;
//             const genes = params.analysisType === "ORA" && params.genes.length > 0 ? params.genes : apiData.top_genes;
//             allGenesToProcess = [...new Set([...allGenesToProcess, ...genes])];
//           }
//         });
//         if (allGenesToProcess.length > 0) {
//           const { data: geneData, error: geneError } = await supabase
//             .from("genes")
//             .select("id, ensembl_id, gene_symbol")
//             .in("gene_symbol", allGenesToProcess);
//           if (geneError) {
//             console.error("Gene error:", geneError);
//             throw new Error(`Failed to fetch genes: ${geneError.message}`);
//           }
//           geneToEnsemblMap = new Map(geneData.map((g) => [g.gene_symbol, g.ensembl_id]));
//         }
//         results.forEach((result, index) => {
//           if (result.status === "fulfilled") {
//             const { method, apiData } = result.value;
//             const genesToProcess = params.analysisType === "ORA" && params.genes.length > 0 ? params.genes : apiData.top_genes;
//             const processedGeneStats: GeneStats[] = genesToProcess.map((gene: string) => {
//               const stats = apiData.gene_stats[gene] || {};
//               return {
//                 gene,
//                 ensembl_id: geneToEnsemblMap.get(gene) || "N/A",
//                 mean_tumor: stats.mean_tumor || 0,
//                 mean_normal: stats.mean_normal || 0,
//                 cv_tumor: stats.cv_tumor || 0,
//                 cv_normal: stats.cv_normal || 0,
//                 logFC: stats.logfc || 0,
//               };
//             });
//             const newResults: ResultsData = {
//               enrichment: apiData.enrichment || [],
//               top_genes: genesToProcess,
//               gene_stats: processedGeneStats,
//             };
//             const cacheKey = generateCacheKey({
//               sites: params.sites,
//               cancerTypes: params.cancerTypes,
//               genes: params.genes,
//               method,
//               topN: params.topN,
//               analysisType: params.analysisType,
//               siteAnalysisType: params.siteAnalysisType,
//             });
//             setCachedData(cacheKey, newResults);
//             if (isMounted && method === normalizationMethod) {
//               setCurrentResults(newResults);
//             }
//           } else {
//             console.error(`Error fetching data for ${normalizationMethods[index]}:`, result.reason);
//             if (isMounted && normalizationMethods[index] === normalizationMethod) {
//               setError(`Failed to fetch data for ${normalizationMethods[index]}: ${result.reason.message}`);
//               setCurrentResults({ enrichment: [], top_genes: [], gene_stats: [] });
//             }
//           }
//         });
//         if (isMounted) {
//           setIsLoading(false);
//         }
//       } catch (error: any) {
//         console.error("Error fetching data:", error);
//         if (isMounted) {
//           setError(error.message || "An error occurred while fetching data.");
//           setCurrentResults({ enrichment: [], top_genes: [], gene_stats: [] });
//           setIsLoading(false);
//         }
//       }
//     };
//     fetchData();
//     return () => {
//       isMounted = false;
//     };
//   }, [params.sites, params.cancerTypes, params.genes, params.topN, params.analysisType, params.siteAnalysisType, getCachedData, setCachedData, generateCacheKey]);

//   const downloadData = useCallback(
//     (type: "enrichment" | "mean_expression" | "noise_metrics") => {
//       let data: any[] = [];
//       let headers: string[] = [];
//       let filename = `pathway_analysis_${params.sites.join("_")}_${params.siteAnalysisType}_${params.analysisType}_${normalizationMethod}_${Date.now()}`;
//       if (type === "enrichment") {
//         data = currentResults.enrichment;
//         headers = ["Term", "P-value", "Adjusted P-value", "Combined Score", "Genes"];
//         filename = `enrichment_${filename}.csv`;
//         const rows = data.map((row) =>
//           [row.Term, row["P-value"], row["Adjusted P-value"], row["Combined Score"], row.Genes.join(", ")].join(",")
//         );
//         const content = [headers.join(","), ...rows].join("\n");
//         const blob = new Blob([content], { type: "text/csv" });
//         const url = URL.createObjectURL(blob);
//         const a = document.createElement("a");
//         a.href = url;
//         a.download = filename;
//         a.click();
//         URL.revokeObjectURL(url);
//       } else if (type === "mean_expression") {
//         data = currentResults.gene_stats;
//         headers = ["Gene", "Ensembl ID", "Mean Tumor", "Mean Normal"];
//         filename = `mean_expression_${filename}.csv`;
//         const rows = data.map((row) =>
//           [row.gene, row.ensembl_id, row.mean_tumor.toFixed(2), row.mean_normal.toFixed(2)].join(",")
//         );
//         const content = [headers.join(","), ...rows].join("\n");
//         const blob = new Blob([content], { type: "text/csv" });
//         const url = URL.createObjectURL(blob);
//         const a = document.createElement("a");
//         a.href = url;
//         a.download = filename;
//         a.click();
//         URL.revokeObjectURL(url);
//       } else if (type === "noise_metrics") {
//         data = currentResults.gene_stats;
//         headers = ["Gene", "Ensembl ID", "CV Tumor", "CV Normal", "Log2FC"];
//         filename = `noise_metrics_${filename}.csv`;
//         const rows = data.map((row) =>
//           [row.gene, row.ensembl_id, row.cv_tumor.toFixed(2), row.cv_normal.toFixed(2), row.logFC.toFixed(2)].join(",")
//         );
//         const content = [headers.join(","), ...rows].join("\n");
//         const blob = new Blob([content], { type: "text/csv" });
//         const url = URL.createObjectURL(blob);
//         const a = document.createElement("a");
//         a.href = url;
//         a.download = filename;
//         a.click();
//         URL.revokeObjectURL(url);
//       }
//     },
//     [currentResults, params.sites, params.cancerTypes, params.analysisType, params.siteAnalysisType, normalizationMethod]
//   );

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-yellow-50 flex flex-col">
//       <Header />
//       <main className="flex-grow">
//         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
//           <div className="grid grid-cols-[320px_1fr] gap-6">
//             <FilterPanel
//               normalizationMethod={normalizationMethod}
//               setNormalizationMethod={(value) => updateFilters({ normalizationMethod: value })}
//             />
//             <div className="flex-1">
//               {isLoading ? (
//                 <LoadingSpinner message="Loading pathway results..." />
//               ) : currentResults.gene_stats.length === 0 ? (
//                 <LoadingSpinner message="Loading pathway results..." />
//               ) : (
//                 <>
//                   <Link
//                     to="/pathway-analysis"
//                     className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-6 transition-colors"
//                   >
//                     <ArrowLeft className="h-4 w-4 mr-2" />
//                     Back to Pathway Analysis
//                   </Link>
//                   <div className="mb-8">
//                     <h2 className="text-4xl font-bold text-blue-900 mb-2">
//                       Results for {params.siteAnalysisType === "pan-cancer" ? "Pan-Cancer" : "Cancer-Specific"} Analysis ({params.sites.join(", ")})
//                     </h2>
//                     <div className="flex items-center justify-between mb-4">
//                       <p className="text-blue-700 text-lg">
//                         Normalization: <strong>{normalizationMethod.toUpperCase()}</strong>,{" "}
//                         {params.analysisType === "ORA" && params.genes.length > 0
//                           ? `Custom genes (${params.genes.length})`
//                           : `Top ${params.topN} Noisy Genes`}
//                       </p>
//                       <Button
//                         onClick={() => downloadData("enrichment")}
//                         variant="outline"
//                         size="sm"
//                       >
//                         <Download className="h-4 w-4 mr-2" /> Download Enrichment CSV
//                       </Button>
//                     </div>
//                     <CollapsibleCard title="Sample Counts">
//                       <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
//                         <Card className="border-0 shadow-lg">
//                           <CardContent className="flex flex-col items-center p-4 text-center">
//                             <Users className="h-6 w-6 text-red-600 mb-2" />
//                             <div className="text-2xl font-bold text-red-600">{totalTumorSamples}</div>
//                             <div className="text-xs text-gray-600">Total Tumor Samples</div>
//                           </CardContent>
//                         </Card>
//                         <Card className="border-0 shadow-lg">
//                           <CardContent className="flex flex-col items-center p-4 text-center">
//                             <Users className="h-6 w-6 text-green-600 mb-2" />
//                             <div className="text-2xl font-bold text-green-600">{totalNormalSamples}</div>
//                             <div className="text-xs text-gray-600">Total Normal Samples</div>
//                           </CardContent>
//                         </Card>
//                       </div>
//                       <PlotlyBarChart
//                         data={sampleCountData}
//                         xKey="type"
//                         yKey="count"
//                         title="Sample Count Distribution"
//                         xLabel="Sample Type"
//                         yLabel="Count"
//                         orientation="v"
//                         colors={sampleCountData.map((group) => group.colors)}
//                         legendLabels={["Tumor", "Normal"]}
//                       />
//                     </CollapsibleCard>
//                   </div>
//                   {currentResults.enrichment.length === 0 ? (
//                     <Card className="shadow-lg p-6 text-center text-blue-700">
//                       <Activity className="w-10 h-10 mx-auto mb-3" />
//                       <p className="text-lg">No pathway enrichment results found for the selected parameters.</p>
//                     </Card>
//                   ) : (
//                     <>
//                       <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
//                         <div className="lg:col-span-2">
//                           <CollapsibleCard title="Enriched Pathways" className="h-full">
//                             <DataTable
//                               data={currentResults.enrichment}
//                               columns={[
//                                 { key: "Term", header: "Pathway", sortable: true },
//                                 {
//                                   key: "P-value",
//                                   header: "P-value",
//                                   sortable: true,
//                                   render: (value: number) => formatPValue(value),
//                                 },
//                                 {
//                                   key: "Adjusted P-value",
//                                   header: "Adj. P-value",
//                                   sortable: true,
//                                   render: (value: number) => formatPValue(value),
//                                 },
//                               ]}
//                               defaultSortKey={sortBy === "pval" ? "P-value" : "Adjusted P-value"}
//                               defaultSortOrder={sortOrder}
//                               onRowClick={setSelectedPathway}
//                             />
//                           </CollapsibleCard>
//                         </div>
//                         <div>
//                           <CollapsibleCard title="Pathway Details" className="h-full">
//                             {selectedPathway ? (
//                               <div className="space-y-2 p-2">
//                                 <div>
//                                   <h3 className="font-semibold text-blue-700 text-sm">{selectedPathway.Term}</h3>
//                                 </div>
//                                 <div>
//                                   <h4 className="font-medium text-blue-700 text-xs">Statistics</h4>
//                                   <div className="grid grid-cols-2 gap-1 mt-1 text-xs">
//                                     <div>P-value:</div>
//                                     <div>{selectedPathway["P-value"].toExponential(2)}</div>
//                                     <div>Adj. P-value:</div>
//                                     <div>{selectedPathway["Adjusted P-value"].toExponential(2)}</div>
//                                   </div>
//                                 </div>
//                                 <div>
//                                   <h4 className="font-medium text-blue-700 text-xs">Associated Genes</h4>
//                                   <div className="flex flex-wrap gap-1 mt-1">
//                                     {selectedPathway.Genes.map((gene, idx) => (
//                                       <span
//                                         key={idx}
//                                         className="bg-blue-100 text-blue-800 px-1 py-0.5 rounded text-xs"
//                                       >
//                                         {gene}
//                                       </span>
//                                     ))}
//                                   </div>
//                                 </div>
//                               </div>
//                             ) : (
//                               <div className="text-center text-gray-500 h-full flex items-center justify-center">
//                                 <div>
//                                   <Info className="h-6 w-6 mx-auto mb-1" />
//                                   <p className="text-xs">Select a pathway to view details</p>
//                                 </div>
//                               </div>
//                             )}
//                           </CollapsibleCard>
//                         </div>
//                       </div>
//                       <div className="grid grid-cols-1 gap-4 mb-4">
//                         <CollapsibleCard title="Mean Expression Heatmap">
//                           <PlotlyHeatmap
//                             title="Mean Expression Heatmap"
//                             data={currentResults.gene_stats}
//                             xValues={["Tumor", "Normal"]}
//                             yValues={currentResults.gene_stats.map((d) => d.gene)}
//                             zValues={currentResults.gene_stats.map((d) => [d.mean_tumor, d.mean_normal])}
//                             zLabel="Expression Level"
//                             chartKey="mean-expression"
//                             xLabel="Sample Type"
//                             yLabel="Genes"
//                             annotation={params.sites.join(", ")}
//                           />
//                         </CollapsibleCard>
//                         <CollapsibleCard title="Coefficient of Variation Heatmap">
//                           <PlotlyHeatmap
//                             title="Coefficient of Variation Heatmap"
//                             data={currentResults.gene_stats}
//                             xValues={["Tumor", "Normal"]}
//                             yValues={currentResults.gene_stats.map((d) => d.gene)}
//                             zValues={currentResults.gene_stats.map((d) => [d.cv_tumor, d.cv_normal])}
//                             zLabel="CV"
//                             chartKey="cv-heatmap"
//                             xLabel="Sample Type"
//                             yLabel="Genes"
//                             annotation={params.sites.join(", ")}
//                           />
//                         </CollapsibleCard>
//                         <CollapsibleCard title="Log2 Fold Change">
//                           <PlotlyBarChart
//                             data={currentResults.gene_stats}
//                             xKey="logFC"
//                             yKey="gene"
//                             title="Log2 Fold Change"
//                             xLabel="Log2 Fold Change"
//                             yLabel="Genes"
//                             colors={logFCColors}
//                             showLegend={false}
//                           />
//                         </CollapsibleCard>
//                       </div>
//                       <CollapsibleCard
//                         title="Mean Expression Analysis"
//                         className="mb-4"
//                         downloadButton={
//                           <Button
//                             onClick={() => downloadData("mean_expression")}
//                             variant="outline"
//                             size="sm"
//                             className="h-6 px-2 text-xs"
//                           >
//                             <Download className="h-4 w-4 mr-2" /> Download CSV
//                           </Button>
//                         }
//                       >
//                         {currentResults.gene_stats.length > 0 ? (
//                           <DataTable
//                             data={currentResults.gene_stats}
//                             columns={[
//                               { key: "gene", header: "Gene", sortable: true },
//                               { key: "ensembl_id", header: "Ensembl ID", sortable: true },
//                               {
//                                 key: "mean_tumor",
//                                 header: `Mean Tumor (${normalizationMethod})`,
//                                 sortable: true,
//                                 render: (value: number) => value.toFixed(2),
//                               },
//                               {
//                                 key: "mean_normal",
//                                 header: `Mean Normal (${normalizationMethod})`,
//                                 sortable: true,
//                                 render: (value: number) => value.toFixed(2),
//                               },
//                             ]}
//                           />
//                         ) : (
//                           <p className="text-blue-700 text-sm">No mean expression data available.</p>
//                         )}
//                       </CollapsibleCard>
//                       <CollapsibleCard
//                         title="Noise Metrics Analysis"
//                         className="mb-4 p-2 text-sm"
//                         downloadButton={
//                           <Button
//                             onClick={() => downloadData("noise_metrics")}
//                             variant="outline"
//                             size="sm"
//                             className="h-6 px-2 text-xs"
//                           >
//                             <Download className="h-4 w-4 mr-2" /> Download CSV
//                           </Button>
//                         }
//                       >
//                         {currentResults.gene_stats.length > 0 ? (
//                           <DataTable
//                             data={currentResults.gene_stats}
//                             columns={[
//                               { key: "gene", header: "Gene", sortable: true },
//                               { key: "ensembl_id", header: "Ensembl ID", sortable: true },
//                               {
//                                 key: "cv_tumor",
//                                 header: `CV Tumor (${normalizationMethod})`,
//                                 sortable: true,
//                                 render: (value: number) => value.toFixed(2),
//                               },
//                               {
//                                 key: "cv_normal",
//                                 header: `CV Normal (${normalizationMethod})`,
//                                 sortable: true,
//                                 render: (value: number) => value.toFixed(2),
//                               },
//                               {
//                                 key: "logFC",
//                                 header: "Log2FC",
//                                 sortable: true,
//                                 render: (value: number) => value.toFixed(2),
//                               },
//                             ]}
//                           />
//                         ) : (
//                           <p className="text-blue-700">No noise metrics data available.</p>
//                         )}
//                       </CollapsibleCard>
//                     </>
//                   )}
//                 </>
//               )}
//             </div>
//           </div>
//         </div>
//       </main>
//       <Footer />
//     </div>
//   );
// };

// export default PathwayResults;
// import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
// import { useSearchParams, Link } from "react-router-dom";
// import supabase from "@/supabase-client";
// import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
// import { Button } from "@/components/ui/button";
// import { ArrowLeft, Download, Activity, Users, Info } from "lucide-react";
// import { PlotlyHeatmap, PlotlyBarChart } from "@/components/charts/index";
// import Header from "@/components/header";
// import Footer from "@/components/footer";
// import { GeneStats, Enrichment, ResultsData } from "@/components/types/pathway";
// import { useCache } from "@/hooks/use-cache";
// import { LoadingSpinner } from "@/components/ui/loadingSpinner";
// import FilterPanel from "@/components/FilterPanel";
// import { DataTable } from "@/components/ui/data-table";
// import CollapsibleCard from "@/components/ui/collapsible-card";

// const PathwayResults = () => {
//   const [searchParams] = useSearchParams();
//   const params = useMemo(
//     () => ({
//       sites: searchParams.get("sites")?.split(",").filter(Boolean) || [],
//       cancerTypes: searchParams.get("cancerTypes")?.split(",").filter(Boolean) || [],
//       genes: searchParams.get("genes")?.split(",").filter(Boolean) || [],
//       method: searchParams.get("method") || "tpm",
//       topN: parseInt(searchParams.get("top_n") || "15", 10),
//       analysisType: searchParams.get("analysisType") || "ORA",
//       siteAnalysisType: searchParams.get("siteAnalysisType") || "pan-cancer",
//     }),
//     [searchParams]
//   );

//   const [normalizationMethod, setNormalizationMethod] = useState(params.method);
//   const [currentResults, setCurrentResults] = useState<ResultsData>({ enrichment: [], top_genes: [], gene_stats: [] });
//   const [isLoading, setIsLoading] = useState(false);
//   const [error, setError] = useState<string | null>(null);
//   const [totalTumorSamples, setTotalTumorSamples] = useState(0);
//   const [totalNormalSamples, setTotalNormalSamples] = useState(0);
//   const [customGeneInput, setCustomGeneInput] = useState("");
//   const [selectedPathway, setSelectedPathway] = useState<Enrichment | null>(null);
//   const [showGeneInput, setShowGeneInput] = useState(params.analysisType === "ORA");
//   const [sortBy, setSortBy] = useState<"pval" | "adjPval">("pval");
//   const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
//   const filterTimeoutRef = useRef<NodeJS.Timeout | null>(null);
//   const { getCachedData, setCachedData, generateCacheKey } = useCache<ResultsData>();
//   const normalizationMethods = ["tpm", "fpkm", "fpkm_uq"];
//   const logFCColors = currentResults.gene_stats.map((gene) =>
//     gene.logFC < 0 ? "#ef4444" : "#3b82f6"
//   );

//   const sampleCountData = useMemo(
//     () => [
//       { type: "Tumor", count: totalTumorSamples, colors: "#ef4444" },
//       { type: "Normal", count: totalNormalSamples, colors: "#10b981" },
//     ],
//     [totalTumorSamples, totalNormalSamples]
//   );

//   const updateFilters = useCallback(
//     (newFilters: { normalizationMethod?: string }) => {
//       if (filterTimeoutRef.current) {
//         clearTimeout(filterTimeoutRef.current);
//       }
//       filterTimeoutRef.current = setTimeout(() => {
//         if (newFilters.normalizationMethod) {
//           setNormalizationMethod(newFilters.normalizationMethod);
//         }
//       }, 300);
//     },
//     []
//   );

//   const formatPValue = (pValue: number) => {
//     if (pValue <= 0.001) return "****";
//     if (pValue <= 0.01) return "***";
//     if (pValue <= 0.05) return "**";
//     return pValue.toExponential(2);
//   };

//   const handleGeneInput = (e: React.ChangeEvent<HTMLInputElement>) => {
//     setCustomGeneInput(e.target.value);
//   };

//   const processCustomGenes = () => {
//     return customGeneInput
//       .split(/[\s,|]+/)
//       .map((gene) => gene.trim())
//       .filter((gene) => gene.length > 0);
//   };

//   const submitCustomGenes = () => {
//     const genes = processCustomGenes();
//     if (genes.length > 0) {
//       localStorage.clear();
//       window.location.href = `/pathway-results?sites=${params.sites.join(
//         ","
//       )}&cancerTypes=${params.cancerTypes.join(
//         ","
//       )}&genes=${genes.join(",")}&method=${normalizationMethod}&top_n=${params.topN}&analysisType=ORA&siteAnalysisType=${params.siteAnalysisType}`;
//     }
//   };

//   const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
//     const file = e.target.files?.[0];
//     if (!file) return;
//     const reader = new FileReader();
//     reader.onload = (event) => {
//       const content = event.target?.result as string;
//       const genes = content.split(/[\s,|\n]+/).filter((gene) => gene.trim().length > 0);
//       setCustomGeneInput(genes.join(", "));
//     };
//     reader.readAsText(file);
//   };

//   const fetchSampleCounts = useCallback(async (sites: string[], cancerTypes: string[]) => {
//     try {
//       const { data: siteRows, error: siteRowsErr } = await supabase
//         .from("Sites")
//         .select("id, name")
//         .in("name", sites);
//       if (siteRowsErr) throw new Error(`Failed to fetch cancer sites: ${siteRowsErr.message}`);
//       if (!siteRows?.length) throw new Error(`Cancer sites not found: ${sites.join(", ")}`);
//       const cancerSiteIds = siteRows.map((row) => row.id);

//       const { data: cancerTypeRows, error: cancerTypeErr } =
//         cancerTypes.length > 0
//           ? await supabase
//               .from("cancer_types")
//               .select("id, tcga_code")
//               .in("tcga_code", cancerTypes)
//           : await supabase
//               .from("cancer_types")
//               .select("id, tcga_code, site_id")
//               .in("site_id", cancerSiteIds);

//       if (cancerTypeErr) throw new Error(`Failed to fetch cancer types: ${cancerTypeErr.message}`);
//       const cancerTypeIds = cancerTypeRows.map((row) => row.id);

//       const { data: samplesData, error: samplesError } = await supabase
//         .from("samples")
//         .select("id, sample_barcode, sample_type, cancer_type_id")
//         .in("cancer_type_id", cancerTypeIds);

//       if (samplesError) throw new Error(`Failed to fetch samples: ${samplesError.message}`);
//       const tumorSamples = samplesData
//         .filter((s) => s.sample_type?.toLowerCase() === "tumor")
//         .map((s) => s.sample_barcode);
//       const normalSamples = samplesData
//         .filter((s) => s.sample_type?.toLowerCase() === "normal")
//         .map((s) => s.sample_barcode);
//       setTotalTumorSamples(tumorSamples.length);
//       setTotalNormalSamples(normalSamples.length);
//       return { tumorSamples, normalSamples };
//     } catch (error: any) {
//       console.error("Error fetching sample counts:", error);
//       setError(error.message || "An error occurred while fetching sample counts.");
//       return { tumorSamples: [], normalSamples: [] };
//     }
//   }, []);

//   useEffect(() => {
//     if (params.sites.length > 0) {
//       fetchSampleCounts(params.sites, params.cancerTypes);
//     }
//   }, [params.sites, params.cancerTypes, fetchSampleCounts]);

//   useEffect(() => {
//     if (!normalizationMethods.includes(normalizationMethod)) {
//       setNormalizationMethod("tpm");
//     }
//     const cacheKey = generateCacheKey({
//       sites: params.sites,
//       cancerTypes: params.cancerTypes,
//       genes: params.genes,
//       method: normalizationMethod,
//       topN: params.topN,
//       analysisType: params.analysisType,
//       siteAnalysisType: params.siteAnalysisType,
//     });
//     const cachedResults = getCachedData(cacheKey);
//     if (cachedResults) {
//       setCurrentResults(cachedResults);
//     } else {
//       setCurrentResults({ enrichment: [], top_genes: [], gene_stats: [] });
//     }
//   }, [normalizationMethod, params, getCachedData, generateCacheKey]);

//   useEffect(() => {
//     let isMounted = true;
//     const fetchData = async () => {
//       if (params.sites.length === 0) {
//         if (isMounted) {
//           setError("Please select at least one cancer site.");
//           setIsLoading(false);
//         }
//         return;
//       }
//       setIsLoading(true);
//       setError(null);
//       try {
//         const { data: siteRows, error: siteRowsErr } = await supabase
//           .from("Sites")
//           .select("id, name")
//           .in("name", params.sites);
//         if (siteRowsErr) throw new Error(`Failed to fetch cancer sites: ${siteRowsErr.message}`);
//         if (!siteRows?.length) throw new Error(`Cancer sites not found: ${params.sites.join(", ")}`);
//         const cancerSiteIds = siteRows.map((row) => row.id);

//         const { data: cancerTypeRows, error: cancerTypeErr } =
//           params.cancerTypes.length > 0
//             ? await supabase
//                 .from("cancer_types")
//                 .select("id, tcga_code")
//                 .in("tcga_code", params.cancerTypes)
//             : await supabase
//                 .from("cancer_types")
//                 .select("id, tcga_code, site_id")
//                 .in("site_id", cancerSiteIds);

//         if (cancerTypeErr) throw new Error(`Failed to fetch cancer types: ${cancerTypeErr.message}`);
//         const cancerTypeIds = cancerTypeRows.map((row) => row.id);

//         const { data: samplesData, error: samplesError } = await supabase
//           .from("samples")
//           .select("id, sample_barcode, sample_type, cancer_type_id")
//           .in("cancer_type_id", cancerTypeIds);

//         if (samplesError) throw new Error(`Failed to fetch samples: ${samplesError.message}`);
//         const tumorSamples = samplesData
//           .filter((s) => s.sample_type?.toLowerCase() === "tumor")
//           .map((s) => s.sample_barcode);
//         const normalSamples = samplesData
//           .filter((s) => s.sample_type?.toLowerCase() === "normal")
//           .map((s) => s.sample_barcode);
//         if (isMounted) {
//           setTotalTumorSamples(tumorSamples.length);
//           setTotalNormalSamples(normalSamples.length);
//         }

//         const cancerParam = params.siteAnalysisType === "cancer-specific" ? params.sites[0] : params.sites.join(",");

//         const queryParams = new URLSearchParams({
//           cancer: cancerParam,
//           method: normalizationMethod,
//           top_n: params.topN.toString(),
//           analysis_type: params.analysisType,
//           ...(params.genes.length > 0 && params.analysisType === "ORA" && { genes: params.genes.join(",") }),
//         });
//         const response = await fetch(`http://localhost:5001/api/pathway-analysis?${queryParams}`);
//         if (!response.ok) {
//           const errorText = await response.text();
//           throw new Error(`Failed to fetch pathway analysis data: ${errorText}`);
//         }
//         const apiData = await response.json();

//         let geneToEnsemblMap = new Map<string, string>();
//         let allGenesToProcess: string[] = [];
//         const genes = params.analysisType === "ORA" && params.genes.length > 0 ? params.genes : apiData.top_genes;
//         allGenesToProcess = [...new Set([...allGenesToProcess, ...genes])];
//         if (allGenesToProcess.length > 0) {
//           const { data: geneData, error: geneError } = await supabase
//             .from("genes")
//             .select("id, ensembl_id, gene_symbol")
//             .in("gene_symbol", allGenesToProcess);
//           if (geneError) throw new Error(`Failed to fetch genes: ${geneError.message}`);
//           geneToEnsemblMap = new Map(geneData.map((g) => [g.gene_symbol, g.ensembl_id]));
//         }

//         const processedGeneStats: GeneStats[] = genes.map((gene: string) => {
//           const stats = apiData.gene_stats[gene] || {};
//           return {
//             gene,
//             ensembl_id: geneToEnsemblMap.get(gene) || "N/A",
//             mean_tumor: stats.mean_tumor || 0,
//             mean_normal: stats.mean_normal || 0,
//             cv_tumor: stats.cv_tumor || 0,
//             cv_normal: stats.cv_normal || 0,
//             logFC: stats.logfc || 0,
//           };
//         });

//         const newResults: ResultsData = {
//           enrichment: apiData.enrichment || [],
//           top_genes: genes,
//           gene_stats: processedGeneStats,
//         };
//         const cacheKey = generateCacheKey({
//           sites: params.sites,
//           cancerTypes: params.cancerTypes,
//           genes: params.genes,
//           method: normalizationMethod,
//           topN: params.topN,
//           analysisType: params.analysisType,
//           siteAnalysisType: params.siteAnalysisType,
//         });
//         setCachedData(cacheKey, newResults);
//         if (isMounted) {
//           setCurrentResults(newResults);
//           setIsLoading(false);
//           setError(null);
//         }
//       } catch (error: any) {
//         console.error("Error fetching data:", error);
//         if (isMounted) {
//           setError(error.message || "An error occurred while fetching data.");
//           setCurrentResults({ enrichment: [], top_genes: [], gene_stats: [] });
//           setIsLoading(false);
//         }
//       }
//     };
//     fetchData();
//     return () => {
//       isMounted = false;
//     };
//   }, [params.sites, params.cancerTypes, params.genes, params.topN, params.analysisType, params.siteAnalysisType, getCachedData, setCachedData, generateCacheKey]);

//   const downloadData = useCallback(
//     (type: "enrichment" | "mean_expression" | "noise_metrics") => {
//       let data: any[] = [];
//       let headers: string[] = [];
//       let filename = `pathway_analysis_${params.sites.join("_")}_${params.siteAnalysisType}_${params.analysisType}_${normalizationMethod}_${Date.now()}`;
//       if (type === "enrichment") {
//         data = currentResults.enrichment;
//         headers = ["Term", "P-value", "Adjusted P-value", "Combined Score", "Genes"];
//         filename = `enrichment_${filename}.csv`;
//         const rows = data.map((row) =>
//           [row.Term, row["P-value"], row["Adjusted P-value"], row["Combined Score"], row.Genes.join(", ")].join(",")
//         );
//         const content = [headers.join(","), ...rows].join("\n");
//         const blob = new Blob([content], { type: "text/csv" });
//         const url = URL.createObjectURL(blob);
//         const a = document.createElement("a");
//         a.href = url;
//         a.download = filename;
//         a.click();
//         URL.revokeObjectURL(url);
//       } else if (type === "mean_expression") {
//         data = currentResults.gene_stats;
//         headers = ["Sites" ,"Gene", "Ensembl ID", "Mean Tumor", "Mean Normal"];
//         filename = `mean_expression_${filename}.csv`;
//         const rows = data.map((row) =>
//           [row.site, row.gene, row.ensembl_id, row.mean_tumor.toFixed(2), row.mean_normal.toFixed(2)].join(",")
//         );
//         const content = [headers.join(","), ...rows].join("\n");
//         const blob = new Blob([content], { type: "text/csv" });
//         const url = URL.createObjectURL(blob);
//         const a = document.createElement("a");
//         a.href = url;
//         a.download = filename;
//         a.click();
//         URL.revokeObjectURL(url);
//       } else if (type === "noise_metrics") {
//         data = currentResults.gene_stats;
//         headers = ["Site", "Gene", "Ensembl ID", "CV Tumor", "CV Normal", "Log2FC"];
//         filename = `noise_metrics_${filename}.csv`;
//         const rows = data.map((row) =>
//           [row.site, row.gene, row.ensembl_id, row.cv_tumor.toFixed(2), row.cv_normal.toFixed(2), row.logFC.toFixed(2)].join(",")
//         );
//         const content = [headers.join(","), ...rows].join("\n");
//         const blob = new Blob([content], { type: "text/csv" });
//         const url = URL.createObjectURL(blob);
//         const a = document.createElement("a");
//         a.href = url;
//         a.download = filename;
//         a.click();
//         URL.revokeObjectURL(url);
//       }
//     },
//     [currentResults, params.sites, params.cancerTypes, params.analysisType, params.siteAnalysisType, normalizationMethod]
//   );

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-yellow-50 flex flex-col">
//       <Header />
//       <main className="flex-grow">
//         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
//           <div className="grid grid-cols-[320px_1fr] gap-6">
//             <FilterPanel
//               normalizationMethod={normalizationMethod}
//               setNormalizationMethod={(value) => updateFilters({ normalizationMethod: value })}
//             />
//             <div className="flex-1">
//               {isLoading ? (
//                 <LoadingSpinner message="Loading pathway results..." />
//               ) : currentResults.gene_stats.length === 0 ? (
//                 <LoadingSpinner message="Loading pathway results..." />
//               ) : (
//                 <>
//                   <Link
//                     to="/pathway-analysis"
//                     className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-6 transition-colors"
//                   >
//                     <ArrowLeft className="h-4 w-4 mr-2" />
//                     Back to Pathway Analysis
//                   </Link>
//                   <div className="mb-8">
//                     <h2 className="text-4xl font-bold text-blue-900 mb-2">
//                       Results for {params.siteAnalysisType === "pan-cancer" ? "Pan-Cancer" : "Cancer-Specific"} Analysis ({params.sites.join(", ")})
//                     </h2>
//                     <div className="flex items-center justify-between mb-4">
//                       <p className="text-blue-700 text-lg">
//                         Normalization: <strong>{normalizationMethod.toUpperCase()}</strong>,{" "}
//                         {params.analysisType === "ORA" && params.genes.length > 0
//                           ? `Custom genes (${params.genes.length})`
//                           : `Top ${params.topN} Noisy Genes`}
//                       </p>
//                       <Button
//                         onClick={() => downloadData("enrichment")}
//                         variant="outline"
//                         size="sm"
//                       >
//                         <Download className="h-4 w-4 mr-2" /> Download Enrichment CSV
//                       </Button>
//                     </div>
//                     <CollapsibleCard title="Sample Counts">
//                       <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
//                         <Card className="border-0 shadow-lg">
//                           <CardContent className="flex flex-col items-center p-4 text-center">
//                             <Users className="h-6 w-6 text-red-600 mb-2" />
//                             <div className="text-2xl font-bold text-red-600">{totalTumorSamples}</div>
//                             <div className="text-xs text-gray-600">Total Tumor Samples</div>
//                           </CardContent>
//                         </Card>
//                         <Card className="border-0 shadow-lg">
//                           <CardContent className="flex flex-col items-center p-4 text-center">
//                             <Users className="h-6 w-6 text-green-600 mb-2" />
//                             <div className="text-2xl font-bold text-green-600">{totalNormalSamples}</div>
//                             <div className="text-xs text-gray-600">Total Normal Samples</div>
//                           </CardContent>
//                         </Card>
//                       </div>
//                       <PlotlyBarChart
//                         data={sampleCountData}
//                         xKey="type"
//                         yKey="count"
//                         title="Sample Count Distribution"
//                         xLabel="Sample Type"
//                         yLabel="Count"
//                         orientation="v"
//                         colors={sampleCountData.map((group) => group.colors)}
//                         legendLabels={["Tumor", "Normal"]}
//                       />
//                     </CollapsibleCard>
//                   </div>
//                   {currentResults.enrichment.length === 0 ? (
//                     <Card className="shadow-lg p-6 text-center text-blue-700">
//                       <Activity className="w-10 h-10 mx-auto mb-3" />
//                       <p className="text-lg">No pathway enrichment results found for the selected parameters.</p>
//                     </Card>
//                   ) : (
//                     <>
//                       <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
//                         <div className="lg:col-span-2">
//                           <CollapsibleCard title="Enriched Pathways" className="h-full">
//                             <DataTable
//                               data={currentResults.enrichment}
//                               columns={[
//                                 { key: "Term", header: "Pathway", sortable: true },
//                                 {
//                                   key: "P-value",
//                                   header: "P-value",
//                                   sortable: true,
//                                   render: (value: number) => formatPValue(value),
//                                 },
//                                 {
//                                   key: "Adjusted P-value",
//                                   header: "Adj. P-value",
//                                   sortable: true,
//                                   render: (value: number) => formatPValue(value),
//                                 },
//                               ]}
//                               defaultSortKey={sortBy === "pval" ? "P-value" : "Adjusted P-value"}
//                               defaultSortOrder={sortOrder}
//                               onRowClick={setSelectedPathway}
//                             />
//                           </CollapsibleCard>
//                         </div>
//                         <div>
//                           <CollapsibleCard title="Pathway Details" className="h-full">
//                             {selectedPathway ? (
//                               <div className="space-y-2 p-2">
//                                 <div>
//                                   <h3 className="font-semibold text-blue-700 text-sm">{selectedPathway.Term}</h3>
//                                 </div>
//                                 <div>
//                                   <h4 className="font-medium text-blue-700 text-xs">Statistics</h4>
//                                   <div className="grid grid-cols-2 gap-1 mt-1 text-xs">
//                                     <div>P-value:</div>
//                                     <div>{selectedPathway["P-value"].toExponential(2)}</div>
//                                     <div>Adj. P-value:</div>
//                                     <div>{selectedPathway["Adjusted P-value"].toExponential(2)}</div>
//                                   </div>
//                                 </div>
//                                 <div>
//                                   <h4 className="font-medium text-blue-700 text-xs">Associated Genes</h4>
//                                   <div className="flex flex-wrap gap-1 mt-1">
//                                     {selectedPathway.Genes.map((gene, idx) => (
//                                       <span
//                                         key={idx}
//                                         className="bg-blue-100 text-blue-800 px-1 py-0.5 rounded text-xs"
//                                       >
//                                         {gene}
//                                       </span>
//                                     ))}
//                                   </div>
//                                 </div>
//                               </div>
//                             ) : (
//                               <div className="text-center text-gray-500 h-full flex items-center justify-center">
//                                 <div>
//                                   <Info className="h-6 w-6 mx-auto mb-1" />
//                                   <p className="text-xs">Select a pathway to view details</p>
//                                 </div>
//                               </div>
//                             )}
//                           </CollapsibleCard>
//                         </div>
//                       </div>
//                       <div className="grid grid-cols-1 gap-4 mb-4">
//                         <CollapsibleCard title="Expression Heatmap">
//                           <PlotlyHeatmap
//                             title="Expression Heatmap"
//                             data={currentResults.gene_stats}
//                             xValues={params.sites.map(site => `${site} Normal`).concat(params.sites.map(site => `${site} Tumor`))}
//                             yValues={currentResults.gene_stats.map((d) => d.gene)}
//                             zValues={currentResults.gene_stats.map((d) => [
//                               d.mean_normal, d.mean_normal, d.mean_normal, d.mean_normal, d.mean_normal, d.mean_normal, d.mean_normal, d.mean_normal,
//                               d.mean_tumor, d.mean_tumor, d.mean_tumor, d.mean_tumor, d.mean_tumor, d.mean_tumor, d.mean_tumor, d.mean_tumor
//                             ])}
//                             zLabel="Expression Level"
//                             chartKey="expression-heatmap"
//                             xLabel="Cancer Types"
//                             yLabel="Genes"
//                             colorscale="RdBu"
//                             annotation={params.sites.join(", ")}
//                           />
//                         </CollapsibleCard>
//                         <CollapsibleCard title="Coefficient of Variation Heatmap">
//                           <PlotlyHeatmap
//                             title="Coefficient of Variation Heatmap"
//                             data={currentResults.gene_stats}
//                             xValues={params.sites.map(site => `${site} Tumor`).concat(params.sites.map(site => `${site} Normal`))}
//                             yValues={currentResults.gene_stats.map((d) => d.gene)}
//                             zValues={currentResults.gene_stats.map((d) => [
//                               d.cv_tumor, d.cv_tumor, d.cv_tumor, d.cv_tumor, d.cv_tumor, d.cv_tumor, d.cv_tumor, d.cv_tumor,
//                               d.cv_normal, d.cv_normal, d.cv_normal, d.cv_normal, d.cv_normal, d.cv_normal, d.cv_normal, d.cv_normal
//                             ])}
//                             zLabel="CV"
//                             chartKey="cv-heatmap"
//                             xLabel="Cancer Types"
//                             yLabel="Genes"
//                             colorscale="RdBu"
//                             annotation={params.sites.join(", ")}
//                           />
//                         </CollapsibleCard>
//                         <CollapsibleCard title="Log2 Fold Change">
//                           <PlotlyBarChart
//                             data={currentResults.gene_stats}
//                             xKey="logFC"
//                             yKey="gene"
//                             title="Log2 Fold Change"
//                             xLabel="Log2 Fold Change"
//                             yLabel="Genes"
//                             colors={logFCColors}
//                             showLegend={false}
//                           />
//                         </CollapsibleCard>
//                       </div>
//                       <CollapsibleCard
//                         title="Mean Expression Analysis"
//                         className="mb-4"
//                         downloadButton={
//                           <Button
//                             onClick={() => downloadData("mean_expression")}
//                             variant="outline"
//                             size="sm"
//                             className="h-6 px-2 text-xs"
//                           >
//                             <Download className="h-4 w-4 mr-2" /> Download CSV
//                           </Button>
//                         }
//                       >
//                         {currentResults.gene_stats.length > 0 ? (
//                           <DataTable
//                             data={currentResults.gene_stats}
//                             columns={[
//                               { key: "gene", header: "Gene", sortable: true },
//                               { key: "ensembl_id", header: "Ensembl ID", sortable: true },
//                               {
//                                 key: "mean_tumor",
//                                 header: `Mean Tumor (${normalizationMethod})`,
//                                 sortable: true,
//                                 render: (value: number) => value.toFixed(2),
//                               },
//                               {
//                                 key: "mean_normal",
//                                 header: `Mean Normal (${normalizationMethod})`,
//                                 sortable: true,
//                                 render: (value: number) => value.toFixed(2),
//                               },
//                             ]}
//                           />
//                         ) : (
//                           <p className="text-blue-700 text-sm">No mean expression data available.</p>
//                         )}
//                       </CollapsibleCard>
//                       <CollapsibleCard
//                         title="Noise Metrics Analysis"
//                         className="mb-4 p-2 text-sm"
//                         downloadButton={
//                           <Button
//                             onClick={() => downloadData("noise_metrics")}
//                             variant="outline"
//                             size="sm"
//                             className="h-6 px-2 text-xs"
//                           >
//                             <Download className="h-4 w-4 mr-2" /> Download CSV
//                           </Button>
//                         }
//                       >
//                         {currentResults.gene_stats.length > 0 ? (
//                           <DataTable
//                             data={currentResults.gene_stats}
//                             columns={[
//                               { key: "gene", header: "Gene", sortable: true },
//                               { key: "ensembl_id", header: "Ensembl ID", sortable: true },
//                               {
//                                 key: "cv_tumor",
//                                 header: `CV Tumor (${normalizationMethod})`,
//                                 sortable: true,
//                                 render: (value: number) => value.toFixed(2),
//                               },
//                               {
//                                 key: "cv_normal",
//                                 header: `CV Normal (${normalizationMethod})`,
//                                 sortable: true,
//                                 render: (value: number) => value.toFixed(2),
//                               },
//                               {
//                                 key: "logFC",
//                                 header: "Log2FC",
//                                 sortable: true,
//                                 render: (value: number) => value.toFixed(2),
//                               },
//                             ]}
//                           />
//                         ) : (
//                           <p className="text-blue-700">No noise metrics data available.</p>
//                         )}
//                       </CollapsibleCard>
//                     </>
//                   )}
//                 </>
//               )}
//             </div>
//           </div>
//         </div>
//       </main>
//       <Footer />
//     </div>
//   );
// };

// export default PathwayResults;
// import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
// import { useSearchParams, Link } from "react-router-dom";
// import supabase from "@/supabase-client";
// import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
// import { Button } from "@/components/ui/button";
// import { ArrowLeft, Download, Activity, Users, Info } from "lucide-react";
// import { PlotlyHeatmap, PlotlyBarChart } from "@/components/charts/index";
// import Header from "@/components/header";
// import Footer from "@/components/footer";
// import { GeneStats, Enrichment, ResultsData } from "@/components/types/pathway";
// import { useCache } from "@/hooks/use-cache";
// import { LoadingSpinner } from "@/components/ui/loadingSpinner";
// import FilterPanel from "@/components/FilterPanel";
// import { DataTable } from "@/components/ui/data-table";
// import CollapsibleCard from "@/components/ui/collapsible-card";
// import SampleCounts from "@/components/SampleCounts";

// const PathwayResults = () => {
//   const [searchParams] = useSearchParams();
//   const params = useMemo(
//     () => ({
//       sites: searchParams.get("sites")?.split(",").filter(Boolean) || [],
//       cancerTypes: searchParams.get("cancerTypes")?.split(",").filter(Boolean) || [],
//       genes: searchParams.get("genes")?.split(",").filter(Boolean) || [],
//       method: searchParams.get("method") || "tpm",
//       topN: parseInt(searchParams.get("top_n") || "15", 10),
//       analysisType: searchParams.get("analysisType") || "ORA",
//       siteAnalysisType: searchParams.get("siteAnalysisType") || "pan-cancer",
//     }),
//     [searchParams]
//   );

//   const [normalizationMethod, setNormalizationMethod] = useState(params.method);
//   const [currentResults, setCurrentResults] = useState<ResultsData>({ enrichment: [], top_genes: [], gene_stats: [], heatmap_data: {} });
//   const [isLoading, setIsLoading] = useState(false);
//   const [error, setError] = useState<string | null>(null);
//   const [totalTumorSamples, setTotalTumorSamples] = useState(0);
//   const [totalNormalSamples, setTotalNormalSamples] = useState(0);
//   const [customGeneInput, setCustomGeneInput] = useState("");
//   const [selectedPathway, setSelectedPathway] = useState<Enrichment | null>(null);
//   const [showGeneInput, setShowGeneInput] = useState(params.analysisType === "ORA");
//   const [sortBy, setSortBy] = useState<"pval" | "adjPval">("pval");
//   const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
//   const filterTimeoutRef = useRef<NodeJS.Timeout | null>(null);
//   const { getCachedData, setCachedData, generateCacheKey } = useCache<ResultsData>();
//   const normalizationMethods = ["tpm", "fpkm", "fpkm_uq"];
//   const logFCColors = currentResults.gene_stats.map((gene) =>
//     gene.logFC < 0 ? "#ef4444" : "#3b82f6"
//   );

//   const sampleCountData = useMemo(
//     () => [
//       { type: "Tumor", count: totalTumorSamples, colors: "#ef4444" },
//       { type: "Normal", count: totalNormalSamples, colors: "#10b981" },
//     ],
//     [totalTumorSamples, totalNormalSamples]
//   );

//   const updateFilters = useCallback(
//     (newFilters: { normalizationMethod?: string }) => {
//       if (filterTimeoutRef.current) {
//         clearTimeout(filterTimeoutRef.current);
//       }
//       filterTimeoutRef.current = setTimeout(() => {
//         if (newFilters.normalizationMethod) {
//           setNormalizationMethod(newFilters.normalizationMethod);
//         }
//       }, 300);
//     },
//     []
//   );

//   const formatPValue = (pValue: number) => {
//     if (pValue <= 0.001) return "****";
//     if (pValue <= 0.01) return "***";
//     if (pValue <= 0.05) return "**";
//     return pValue.toExponential(2);
//   };

//   const handleGeneInput = (e: React.ChangeEvent<HTMLInputElement>) => {
//     setCustomGeneInput(e.target.value);
//   };

//   const processCustomGenes = () => {
//     return customGeneInput
//       .split(/[\s,|]+/)
//       .map((gene) => gene.trim())
//       .filter((gene) => gene.length > 0);
//   };

//   const submitCustomGenes = () => {
//     const genes = processCustomGenes();
//     if (genes.length > 0) {
//       localStorage.clear();
//       window.location.href = `/pathway-results?sites=${params.sites.join(
//         ","
//       )}&cancerTypes=${params.cancerTypes.join(
//         ","
//       )}&genes=${genes.join(",")}&method=${normalizationMethod}&top_n=${params.topN}&analysisType=ORA&siteAnalysisType=${params.siteAnalysisType}`;
//     }
//   };

//   const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
//     const file = e.target.files?.[0];
//     if (!file) return;
//     const reader = new FileReader();
//     reader.onload = (event) => {
//       const content = event.target?.result as string;
//       const genes = content.split(/[\s,|\n]+/).filter((gene) => gene.trim().length > 0);
//       setCustomGeneInput(genes.join(", "));
//     };
//     reader.readAsText(file);
//   };

//   const fetchSampleCounts = useCallback(async (sites: string[], cancerTypes: string[]) => {
//     try {
//       const { data: siteRows, error: siteRowsErr } = await supabase
//         .from("Sites")
//         .select("id, name")
//         .in("name", sites);
//       if (siteRowsErr) throw new Error(`Failed to fetch cancer sites: ${siteRowsErr.message}`);
//       if (!siteRows?.length) throw new Error(`Cancer sites not found: ${sites.join(", ")}`);
//       const cancerSiteIds = siteRows.map((row) => row.id);

//       const { data: cancerTypeRows, error: cancerTypeErr } =
//         cancerTypes.length > 0
//           ? await supabase
//               .from("cancer_types")
//               .select("id, tcga_code")
//               .in("tcga_code", cancerTypes)
//           : await supabase
//               .from("cancer_types")
//               .select("id, tcga_code, site_id")
//               .in("site_id", cancerSiteIds);

//       if (cancerTypeErr) throw new Error(`Failed to fetch cancer types: ${cancerTypeErr.message}`);
//       const cancerTypeIds = cancerTypeRows.map((row) => row.id);

//       const { data: samplesData, error: samplesError } = await supabase
//         .from("samples")
//         .select("id, sample_barcode, sample_type, cancer_type_id")
//         .in("cancer_type_id", cancerTypeIds);

//       if (samplesError) throw new Error(`Failed to fetch samples: ${samplesError.message}`);
//       const tumorSamples = samplesData
//         .filter((s) => s.sample_type?.toLowerCase() === "tumor")
//         .map((s) => s.sample_barcode);
//       const normalSamples = samplesData
//         .filter((s) => s.sample_type?.toLowerCase() === "normal")
//         .map((s) => s.sample_barcode);
//       setTotalTumorSamples(tumorSamples.length);
//       setTotalNormalSamples(normalSamples.length);
//       return { tumorSamples, normalSamples };
//     } catch (error: any) {
//       console.error("Error fetching sample counts:", error);
//       setError(error.message || "An error occurred while fetching sample counts.");
//       return { tumorSamples: [], normalSamples: [] };
//     }
//   }, []);

//   useEffect(() => {
//     if (params.sites.length > 0) {
//       fetchSampleCounts(params.sites, params.cancerTypes);
//     }
//   }, [params.sites, params.cancerTypes, fetchSampleCounts]);

//   useEffect(() => {
//     if (!normalizationMethods.includes(normalizationMethod)) {
//       setNormalizationMethod("tpm");
//     }
//     const cacheKey = generateCacheKey({
//       sites: params.sites,
//       cancerTypes: params.cancerTypes,
//       genes: params.genes,
//       method: normalizationMethod,
//       topN: params.topN,
//       analysisType: params.analysisType,
//       siteAnalysisType: params.siteAnalysisType,
//     });
//     const cachedResults = getCachedData(cacheKey);
//     if (cachedResults) {
//       setCurrentResults(cachedResults);
//     } else {
//       setCurrentResults({ enrichment: [], top_genes: [], gene_stats: [], heatmap_data: {} });
//     }
//   }, [normalizationMethod, params, getCachedData, generateCacheKey]);

//   useEffect(() => {
//     console.log("Current Heatmap Data:", currentResults.heatmap_data);
//   }, [currentResults.heatmap_data]);

//   useEffect(() => {
//     let isMounted = true;
//     const fetchData = async () => {
//       if (params.sites.length === 0) {
//         if (isMounted) {
//           setError("Please select at least one cancer site.");
//           setIsLoading(false);
//         }
//         return;
//       }
//       setIsLoading(true);
//       setError(null);
//       try {
//         const { data: siteRows, error: siteRowsErr } = await supabase
//           .from("Sites")
//           .select("id, name")
//           .in("name", params.sites);
//         if (siteRowsErr) throw new Error(`Failed to fetch cancer sites: ${siteRowsErr.message}`);
//         if (!siteRows?.length) throw new Error(`Cancer sites not found: ${params.sites.join(", ")}`);
//         const cancerSiteIds = siteRows.map((row) => row.id);

//         const { data: cancerTypeRows, error: cancerTypeErr } =
//           params.cancerTypes.length > 0
//             ? await supabase
//                 .from("cancer_types")
//                 .select("id, tcga_code")
//                 .in("tcga_code", params.cancerTypes)
//             : await supabase
//                 .from("cancer_types")
//                 .select("id, tcga_code, site_id")
//                 .in("site_id", cancerSiteIds);

//         if (cancerTypeErr) throw new Error(`Failed to fetch cancer types: ${cancerTypeErr.message}`);
//         const cancerTypeIds = cancerTypeRows.map((row) => row.id);

//         const { data: samplesData, error: samplesError } = await supabase
//           .from("samples")
//           .select("id, sample_barcode, sample_type, cancer_type_id")
//           .in("cancer_type_id", cancerTypeIds);

//         if (samplesError) throw new Error(`Failed to fetch samples: ${samplesError.message}`);
//         const tumorSamples = samplesData
//           .filter((s) => s.sample_type?.toLowerCase() === "tumor")
//           .map((s) => s.sample_barcode);
//         const normalSamples = samplesData
//           .filter((s) => s.sample_type?.toLowerCase() === "normal")
//           .map((s) => s.sample_barcode);
//         if (isMounted) {
//           setTotalTumorSamples(tumorSamples.length);
//           setTotalNormalSamples(normalSamples.length);
//         }

//         const cancerParam = params.siteAnalysisType === "cancer-specific" ? params.sites[0] : params.sites.join(",");

//         const queryParams = new URLSearchParams({
//           cancer: cancerParam,
//           method: normalizationMethod,
//           top_n: params.topN.toString(),
//           analysis_type: params.analysisType,
//           ...(params.genes.length > 0 && params.analysisType === "ORA" && { genes: params.genes.join(",") }),
//         });
//         const response = await fetch(`http://localhost:5001/api/pathway-analysis?${queryParams}`);
//         if (!response.ok) {
//           const errorText = await response.text();
//           throw new Error(`Failed to fetch pathway analysis data: ${errorText}`);
//         }
//         const apiData = await response.json();
//         console.log("API Response:", apiData);

//         let geneToEnsemblMap = new Map<string, string>();
//         let allGenesToProcess: string[] = [];
//         const genes = params.analysisType === "ORA" && params.genes.length > 0 ? params.genes : apiData.top_genes;
//         allGenesToProcess = [...new Set([...allGenesToProcess, ...genes])];
//         if (allGenesToProcess.length > 0) {
//           const { data: geneData, error: geneError } = await supabase
//             .from("genes")
//             .select("id, ensembl_id, gene_symbol")
//             .in("gene_symbol", allGenesToProcess);
//           if (geneError) throw new Error(`Failed to fetch genes: ${geneError.message}`);
//           geneToEnsemblMap = new Map(geneData.map((g) => [g.gene_symbol, g.ensembl_id]));
//         }

//         const processedGeneStats: GeneStats[] = genes.map((gene: string) => {
//           const stats = apiData.gene_stats[gene] || {};
//           return {
//             gene,
//             ensembl_id: geneToEnsemblMap.get(gene) || "N/A",
//             mean_tumor: stats.mean_tumor || 0,
//             mean_normal: stats.mean_normal || 0,
//             cv_tumor: stats.cv_tumor || 0,
//             cv_normal: stats.cv_normal || 0,
//             logFC: stats.logfc || 0,
//           };
//         });

//         const newResults: ResultsData = {
//           enrichment: apiData.enrichment || [],
//           top_genes: genes,
//           gene_stats: processedGeneStats,
//           heatmap_data: apiData.heatmap_data || {},
//         };
//         const cacheKey = generateCacheKey({
//           sites: params.sites,
//           cancerTypes: params.cancerTypes,
//           genes: params.genes,
//           method: normalizationMethod,
//           topN: params.topN,
//           analysisType: params.analysisType,
//           siteAnalysisType: params.siteAnalysisType,
//         });
//         setCachedData(cacheKey, newResults);
//         if (isMounted) {
//           setCurrentResults(newResults);
//           setIsLoading(false);
//           setError(null);
//         }
//       } catch (error: any) {
//         console.error("Error fetching data:", error);
//         if (isMounted) {
//           setError(error.message || "An error occurred while fetching data.");
//           setCurrentResults({ enrichment: [], top_genes: [], gene_stats: [], heatmap_data: {} });
//           setIsLoading(false);
//         }
//       }
//     };
//     fetchData();
//     return () => {
//       isMounted = false;
//     };
//   }, [params.sites, params.cancerTypes, params.genes, params.topN, params.analysisType, params.siteAnalysisType, getCachedData, setCachedData, generateCacheKey]);

//   const downloadData = useCallback(
//     (type: "enrichment" | "mean_expression" | "noise_metrics") => {
//       let data: any[] = [];
//       let headers: string[] = [];
//       let filename = `pathway_analysis_${params.sites.join("_")}_${params.siteAnalysisType}_${params.analysisType}_${normalizationMethod}_${Date.now()}`;
//       if (type === "enrichment") {
//         data = currentResults.enrichment;
//         headers = ["Term", "P-value", "Adjusted P-value", "Combined Score", "Genes"];
//         filename = `enrichment_${filename}.csv`;
//         const rows = data.map((row) =>
//           [row.Term, row["P-value"], row["Adjusted P-value"], row["Combined Score"], row.Genes.join(", ")].join(",")
//         );
//         const content = [headers.join(","), ...rows].join("\n");
//         const blob = new Blob([content], { type: "text/csv" });
//         const url = URL.createObjectURL(blob);
//         const a = document.createElement("a");
//         a.href = url;
//         a.download = filename;
//         a.click();
//         URL.revokeObjectURL(url);
//       } else if (type === "mean_expression") {
//         data = currentResults.gene_stats;
//         headers = ["Gene", "Ensembl ID", "Mean Tumor", "Mean Normal"];
//         filename = `mean_expression_${filename}.csv`;
//         const rows = data.map((row) =>
//           [row.gene, row.ensembl_id, row.mean_tumor.toFixed(2), row.mean_normal.toFixed(2)].join(",")
//         );
//         const content = [headers.join(","), ...rows].join("\n");
//         const blob = new Blob([content], { type: "text/csv" });
//         const url = URL.createObjectURL(blob);
//         const a = document.createElement("a");
//         a.href = url;
//         a.download = filename;
//         a.click();
//         URL.revokeObjectURL(url);
//       } else if (type === "noise_metrics") {
//         data = currentResults.gene_stats;
//         headers = ["Gene", "Ensembl ID", "CV Tumor", "CV Normal", "Log2FC"];
//         filename = `noise_metrics_${filename}.csv`;
//         const rows = data.map((row) =>
//           [row.gene, row.ensembl_id, row.cv_tumor.toFixed(2), row.cv_normal.toFixed(2), row.logFC.toFixed(2)].join(",")
//         );
//         const content = [headers.join(","), ...rows].join("\n");
//         const blob = new Blob([content], { type: "text/csv" });
//         const url = URL.createObjectURL(blob);
//         const a = document.createElement("a");
//         a.href = url;
//         a.download = filename;
//         a.click();
//         URL.revokeObjectURL(url);
//       }
//     },
//     [currentResults, params.sites, params.cancerTypes, params.analysisType, params.siteAnalysisType, normalizationMethod]
//   );

//   const getZValues = useCallback((dataKey: "mean_tumor" | "mean_normal" | "cv_tumor" | "cv_normal") => {
//     const zValues = currentResults.gene_stats.map((geneStat) => {
//       const gene = geneStat.gene;
//       const heatmapData = currentResults.heatmap_data[gene] || {};
//       const zValuesForGene = params.sites.flatMap((site) => [
//         heatmapData[`${site} Normal`] || 0,
//         heatmapData[`${site} Tumor`] || 0,
//       ]);
//       console.log(`zValues for ${gene}:`, zValuesForGene);
//       return zValuesForGene;
//     });
//     console.log("All zValues:", zValues);
//     return zValues;
//   }, [currentResults.gene_stats, currentResults.heatmap_data, params.sites]);

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-yellow-50 flex flex-col">
//       <Header />
//       <main className="flex-grow">
//         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
//           <div className="grid grid-cols-[320px_1fr] gap-6">
//             <FilterPanel
//               normalizationMethod={normalizationMethod}
//               setNormalizationMethod={(value) => updateFilters({ normalizationMethod: value })}
//             />
//             <div className="flex-1">
//               {isLoading ? (
//                 <LoadingSpinner message="Loading pathway results..." />
//               ) : currentResults.gene_stats.length === 0 ? (
//                 <LoadingSpinner message="Loading pathway results..." />
//               ) : (
//                 <>
//                   <Link
//                     to="/pathway-analysis"
//                     className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-6 transition-colors"
//                   >
//                     <ArrowLeft className="h-4 w-4 mr-2" />
//                     Back to Pathway Analysis
//                   </Link>
//                   <div className="mb-8">
//                     <h2 className="text-4xl font-bold text-blue-900 mb-2">
//                       Results for {params.siteAnalysisType === "pan-cancer" ? "Pan-Cancer" : "Cancer-Specific"} Analysis ({params.sites.join(", ")})
//                     </h2>
//                     <div className="flex items-center justify-between mb-4">
//                       <p className="text-blue-700 text-lg">
//                         Normalization: <strong>{normalizationMethod.toUpperCase()}</strong>,{" "}
//                         {params.analysisType === "ORA" && params.genes.length > 0
//                           ? `Custom genes (${params.genes.length})`
//                           : `Top ${params.topN} Noisy Genes`}
//                       </p>
//                       <Button
//                         onClick={() => downloadData("enrichment")}
//                         variant="outline"
//                         size="sm"
//                       >
//                         <Download className="h-4 w-4 mr-2" /> Download Enrichment CSV
//                       </Button>
//                     </div>
//                     <CollapsibleCard title="Sample Counts">
//                       <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
//                         <Card className="border-0 shadow-lg">
//                           <CardContent className="flex flex-col items-center p-4 text-center">
//                             <Users className="h-6 w-6 text-red-600 mb-2" />
//                             <div className="text-2xl font-bold text-red-600">{totalTumorSamples}</div>
//                             <div className="text-xs text-gray-600">Total Tumor Samples</div>
//                           </CardContent>
//                         </Card>
//                         <Card className="border-0 shadow-lg">
//                           <CardContent className="flex flex-col items-center p-4 text-center">
//                             <Users className="h-6 w-6 text-green-600 mb-2" />
//                             <div className="text-2xl font-bold text-green-600">{totalNormalSamples}</div>
//                             <div className="text-xs text-gray-600">Total Normal Samples</div>
//                           </CardContent>
//                         </Card>
//                       </div>
//                       <PlotlyBarChart
//                         data={sampleCountData}
//                         xKey="type"
//                         yKey="count"
//                         title="Sample Count Distribution"
//                         xLabel="Sample Type"
//                         yLabel="Count"
//                         orientation="v"
//                         colors={sampleCountData.map((group) => group.colors)}
//                         legendLabels={["Tumor", "Normal"]}
//                       />
//                     </CollapsibleCard>
//                   </div>
//                   {currentResults.enrichment.length === 0 ? (
//                     <Card className="shadow-lg p-6 text-center text-blue-700">
//                       <Activity className="w-10 h-10 mx-auto mb-3" />
//                       <p className="text-lg">No pathway enrichment results found for the selected parameters.</p>
//                     </Card>
//                   ) : (
//                     <>
//                       <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
//                         <div className="lg:col-span-2">
//                           <CollapsibleCard title="Enriched Pathways" className="h-full">
//                             <DataTable
//                               data={currentResults.enrichment}
//                               columns={[
//                                 { key: "Term", header: "Pathway", sortable: true },
//                                 {
//                                   key: "P-value",
//                                   header: "P-value",
//                                   sortable: true,
//                                   render: (value: number) => formatPValue(value),
//                                 },
//                                 {
//                                   key: "Adjusted P-value",
//                                   header: "Adj. P-value",
//                                   sortable: true,
//                                   render: (value: number) => formatPValue(value),
//                                 },
//                               ]}
//                               defaultSortKey={sortBy === "pval" ? "P-value" : "Adjusted P-value"}
//                               defaultSortOrder={sortOrder}
//                               onRowClick={setSelectedPathway}
//                             />
//                           </CollapsibleCard>
//                         </div>
//                         <div>
//                           <CollapsibleCard title="Pathway Details" className="h-full">
//                             {selectedPathway ? (
//                               <div className="space-y-2 p-2">
//                                 <div>
//                                   <h3 className="font-semibold text-blue-700 text-sm">{selectedPathway.Term}</h3>
//                                 </div>
//                                 <div>
//                                   <h4 className="font-medium text-blue-700 text-xs">Statistics</h4>
//                                   <div className="grid grid-cols-2 gap-1 mt-1 text-xs">
//                                     <div>P-value:</div>
//                                     <div>{selectedPathway["P-value"].toExponential(2)}</div>
//                                     <div>Adj. P-value:</div>
//                                     <div>{selectedPathway["Adjusted P-value"].toExponential(2)}</div>
//                                   </div>
//                                 </div>
//                                 <div>
//                                   <h4 className="font-medium text-blue-700 text-xs">Associated Genes</h4>
//                                   <div className="flex flex-wrap gap-1 mt-1">
//                                     {selectedPathway.Genes.map((gene, idx) => (
//                                       <span
//                                         key={idx}
//                                         className="bg-blue-100 text-blue-800 px-1 py-0.5 rounded text-xs"
//                                       >
//                                         {gene}
//                                       </span>
//                                     ))}
//                                   </div>
//                                 </div>
//                               </div>
//                             ) : (
//                               <div className="text-center text-gray-500 h-full flex items-center justify-center">
//                                 <div>
//                                   <Info className="h-6 w-6 mx-auto mb-1" />
//                                   <p className="text-xs">Select a pathway to view details</p>
//                                 </div>
//                               </div>
//                             )}
//                           </CollapsibleCard>
//                         </div>
//                       </div>
//                       <div className="grid grid-cols-1 gap-4 mb-4">
//                         <CollapsibleCard title="Expression Heatmap">
//                           <PlotlyHeatmap
//                             title="Expression Heatmap"
//                             data={currentResults.gene_stats}
//                             xValues={params.sites.flatMap((site) => [`${site} Normal`, `${site} Tumor`])}
//                             yValues={currentResults.gene_stats.map((d) => d.gene)}
//                             zValues={getZValues("mean_tumor")}
//                             zLabel="Expression Level"
//                             chartKey="expression-heatmap"
//                             xLabel="Cancer Types"
//                             yLabel="Genes"
//                             colorscale="RdBu"
//                             annotation={params.sites.join(", ")}
//                           />
//                         </CollapsibleCard>
//                         <CollapsibleCard title="Coefficient of Variation Heatmap">
//                           <PlotlyHeatmap
//                             title="Coefficient of Variation Heatmap"
//                             data={currentResults.gene_stats}
//                             xValues={params.sites.flatMap((site) => [`${site} Tumor`, `${site} Normal`])}
//                             yValues={currentResults.gene_stats.map((d) => d.gene)}
//                             zValues={getZValues("cv_tumor")}
//                             zLabel="CV"
//                             chartKey="cv-heatmap"
//                             xLabel="Cancer Types"
//                             yLabel="Genes"
//                             colorscale="RdBu"
//                             annotation={params.sites.join(", ")}
//                           />
//                         </CollapsibleCard>
//                         <CollapsibleCard title="Log2 Fold Change">
//                           <PlotlyBarChart
//                             data={currentResults.gene_stats}
//                             xKey="logFC"
//                             yKey="gene"
//                             title="Log2 Fold Change"
//                             xLabel="Log2 Fold Change"
//                             yLabel="Genes"
//                             colors={logFCColors}
//                             showLegend={false}
//                           />
//                         </CollapsibleCard>
//                       </div>
//                       <CollapsibleCard
//                         title="Mean Expression Analysis"
//                         className="mb-4"
//                         downloadButton={
//                           <Button
//                             onClick={() => downloadData("mean_expression")}
//                             variant="outline"
//                             size="sm"
//                             className="h-6 px-2 text-xs"
//                           >
//                             <Download className="h-4 w-4 mr-2" /> Download CSV
//                           </Button>
//                         }
//                       >
//                         {currentResults.gene_stats.length > 0 ? (
//                           <DataTable
//                             data={currentResults.gene_stats}
//                             columns={[
//                               { key: "gene", header: "Gene", sortable: true },
//                               { key: "ensembl_id", header: "Ensembl ID", sortable: true },
//                               {
//                                 key: "mean_tumor",
//                                 header: `Mean Tumor (${normalizationMethod})`,
//                                 sortable: true,
//                                 render: (value: number) => value.toFixed(2),
//                               },
//                               {
//                                 key: "mean_normal",
//                                 header: `Mean Normal (${normalizationMethod})`,
//                                 sortable: true,
//                                 render: (value: number) => value.toFixed(2),
//                               },
//                             ]}
//                           />
//                         ) : (
//                           <p className="text-blue-700 text-sm">No mean expression data available.</p>
//                         )}
//                       </CollapsibleCard>
//                       <CollapsibleCard
//                         title="Noise Metrics Analysis"
//                         className="mb-4 p-2 text-sm"
//                         downloadButton={
//                           <Button
//                             onClick={() => downloadData("noise_metrics")}
//                             variant="outline"
//                             size="sm"
//                             className="h-6 px-2 text-xs"
//                           >
//                             <Download className="h-4 w-4 mr-2" /> Download CSV
//                           </Button>
//                         }
//                       >
//                         {currentResults.gene_stats.length > 0 ? (
//                           <DataTable
//                             data={currentResults.gene_stats}
//                             columns={[
//                               { key: "gene", header: "Gene", sortable: true },
//                               { key: "ensembl_id", header: "Ensembl ID", sortable: true },
//                               {
//                                 key: "cv_tumor",
//                                 header: `CV Tumor (${normalizationMethod})`,
//                                 sortable: true,
//                                 render: (value: number) => value.toFixed(2),
//                               },
//                               {
//                                 key: "cv_normal",
//                                 header: `CV Normal (${normalizationMethod})`,
//                                 sortable: true,
//                                 render: (value: number) => value.toFixed(2),
//                               },
//                               {
//                                 key: "logFC",
//                                 header: "Log2FC",
//                                 sortable: true,
//                                 render: (value: number) => value.toFixed(2),
//                               },
//                             ]}
//                           />
//                         ) : (
//                           <p className="text-blue-700">No noise metrics data available.</p>
//                         )}
//                       </CollapsibleCard>
//                     </>
//                   )}
//                 </>
//               )}
//             </div>
//           </div>
//         </div>
//       </main>
//       <Footer />
//     </div>
//   );
// };

// export default PathwayResults;
// import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
// import { useSearchParams, Link } from "react-router-dom";
// import supabase from "@/supabase-client";
// import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
// import { Button } from "@/components/ui/button";
// import { ArrowLeft, Download, Activity, Users, Info } from "lucide-react";
// import { PlotlyHeatmap, PlotlyBarChart } from "@/components/charts/index";
// import Header from "@/components/header";
// import Footer from "@/components/footer";
// import { Enrichment, ResultsData, GeneStats } from "@/components/types/pathway";
// import { useCache } from "@/hooks/use-cache";
// import { LoadingSpinner } from "@/components/ui/loadingSpinner";
// import FilterPanel from "@/components/FilterPanel";
// import { DataTable } from "@/components/ui/data-table";
// import CollapsibleCard from "@/components/ui/collapsible-card";
// import SampleCounts from "@/components/SampleCounts";

// const PathwayResults = () => {
//   const [searchParams] = useSearchParams();
//   const params = useMemo(
//     () => ({
//       sites: searchParams.get("sites")?.split(",").filter(Boolean) || [],
//       cancerTypes: searchParams.get("cancerTypes")?.split(",").filter(Boolean) || [],
//       genes: searchParams.get("genes")?.split(",").filter(Boolean) || [],
//       method: searchParams.get("method") || "tpm",
//       topN: parseInt(searchParams.get("top_n") || "15", 10),
//       analysisType: searchParams.get("analysisType") || "ORA",
//       siteAnalysisType: searchParams.get("siteAnalysisType") || "pan-cancer",
//     }),
//     [searchParams]
//   );

//   const [normalizationMethod, setNormalizationMethod] = useState(params.method);
//   const [currentResults, setCurrentResults] = useState<ResultsData>({ 
//     enrichment: [], 
//     top_genes: [], 
//     gene_stats: [], 
//     heatmap_data: {}, 
//     noise_metrics: {}, 
//     warning: null 
//   });
//   const [isLoading, setIsLoading] = useState(false);
//   const [error, setError] = useState<string | null>(null);
//   const [totalTumorSamples, setTotalTumorSamples] = useState(0);
//   const [totalNormalSamples, setTotalNormalSamples] = useState(0);
//   const [customGeneInput, setCustomGeneInput] = useState("");
//   const [selectedPathway, setSelectedPathway] = useState<Enrichment | null>(null);
//   const [showGeneInput, setShowGeneInput] = useState(params.analysisType === "ORA");
//   const [sortBy, setSortBy] = useState<"pval" | "adjPval">("pval");
//   const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
//   const filterTimeoutRef = useRef<NodeJS.Timeout | null>(null);
//   const { getCachedData, setCachedData, generateCacheKey } = useCache<ResultsData>();
//   const normalizationMethods = ["tpm", "fpkm", "fpkm_uq"];

//   const logFCColors = useMemo(() => {
//     return currentResults.gene_stats.map((geneStat) => {
//       const logFCs = Object.values(geneStat.metrics).map((m) => m.logfc);
//       const avgLogFC = logFCs.length > 0 ? logFCs.reduce((sum, val) => sum + val, 0) / logFCs.length : 0;
//       return avgLogFC < 0 ? "#ef4444" : "#3b82f6";
//     });
//   }, [currentResults.gene_stats]);

//   const sampleCountData = useMemo(
//     () => [
//       { type: "Tumor", count: totalTumorSamples, colors: "#ef4444" },
//       { type: "Normal", count: totalNormalSamples, colors: "#10b981" },
//     ],
//     [totalTumorSamples, totalNormalSamples]
//   );

//   const updateFilters = useCallback(
//     (newFilters: { normalizationMethod?: string }) => {
//       if (filterTimeoutRef.current) {
//         clearTimeout(filterTimeoutRef.current);
//       }
//       filterTimeoutRef.current = setTimeout(() => {
//         if (newFilters.normalizationMethod) {
//           setNormalizationMethod(newFilters.normalizationMethod);
//         }
//       }, 300);
//     },
//     []
//   );

//   const formatPValue = (pValue: number) => {
//     if (pValue <= 0.001) return "****";
//     if (pValue <= 0.01) return "***";
//     if (pValue <= 0.05) return "**";
//     return pValue.toExponential(2);
//   };

//   const handleGeneInput = (e: React.ChangeEvent<HTMLInputElement>) => {
//     setCustomGeneInput(e.target.value);
//   };

//   const processCustomGenes = () => {
//     return customGeneInput
//       .split(/[\s,|]+/)
//       .map((gene) => gene.trim())
//       .filter((gene) => gene.length > 0);
//   };

//   const submitCustomGenes = () => {
//     const genes = processCustomGenes();
//     if (genes.length > 0) {
//       localStorage.clear();
//       window.location.href = `/pathway-results?sites=${params.sites.join(
//         ","
//       )}&cancerTypes=${params.cancerTypes.join(
//         ","
//       )}&genes=${genes.join(",")}&method=${normalizationMethod}&top_n=${params.topN}&analysisType=ORA&siteAnalysisType=${params.siteAnalysisType}`;
//     }
//   };

//   const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
//     const file = e.target.files?.[0];
//     if (!file) return;
//     const reader = new FileReader();
//     reader.onload = (event) => {
//       const content = event.target?.result as string;
//       const genes = content.split(/[\s,|\n]+/).filter((gene) => gene.trim().length > 0);
//       setCustomGeneInput(genes.join(", "));
//     };
//     reader.readAsText(file);
//   };

//   const fetchSampleCounts = useCallback(async (sites: string[], cancerTypes: string[]) => {
//     try {
//       const { data: siteRows, error: siteRowsErr } = await supabase
//         .from("Sites")
//         .select("id, name")
//         .in("name", sites);
//       if (siteRowsErr) throw new Error(`Failed to fetch cancer sites: ${siteRowsErr.message}`);
//       if (!siteRows?.length) throw new Error(`Cancer sites not found: ${sites.join(", ")}`);
//       const cancerSiteIds = siteRows.map((row) => row.id);

//       const { data: cancerTypeRows, error: cancerTypeErr } =
//         cancerTypes.length > 0
//           ? await supabase
//               .from("cancer_types")
//               .select("id, tcga_code")
//               .in("tcga_code", cancerTypes)
//           : await supabase
//               .from("cancer_types")
//               .select("id, tcga_code, site_id")
//               .in("site_id", cancerSiteIds);

//       if (cancerTypeErr) throw new Error(`Failed to fetch cancer types: ${cancerTypeErr.message}`);
//       const cancerTypeIds = cancerTypeRows.map((row) => row.id);

//       const { data: samplesData, error: samplesError } = await supabase
//         .from("samples")
//         .select("id, sample_barcode, sample_type, cancer_type_id")
//         .in("cancer_type_id", cancerTypeIds);

//       if (samplesError) throw new Error(`Failed to fetch samples: ${samplesError.message}`);
//       const tumorSamples = samplesData
//         .filter((s) => s.sample_type?.toLowerCase() === "tumor")
//         .map((s) => s.sample_barcode);
//       const normalSamples = samplesData
//         .filter((s) => s.sample_type?.toLowerCase() === "normal")
//         .map((s) => s.sample_barcode);
//       setTotalTumorSamples(tumorSamples.length);
//       setTotalNormalSamples(normalSamples.length);
//       return { tumorSamples, normalSamples };
//     } catch (error: any) {
//       console.error("Error fetching sample counts:", error);
//       setError(error.message || "An error occurred while fetching sample counts.");
//       return { tumorSamples: [], normalSamples: [] };
//     }
//   }, []);

//   useEffect(() => {
//     if (params.sites.length > 0) {
//       fetchSampleCounts(params.sites, params.cancerTypes);
//     }
//   }, [params.sites, params.cancerTypes, fetchSampleCounts]);

//   useEffect(() => {
//     if (!normalizationMethods.includes(normalizationMethod)) {
//       setNormalizationMethod("tpm");
//     }
//     const cacheKey = generateCacheKey({
//       sites: params.sites,
//       cancerTypes: params.cancerTypes,
//       genes: params.genes,
//       method: normalizationMethod,
//       topN: params.topN,
//       analysisType: params.analysisType,
//       siteAnalysisType: params.siteAnalysisType,
//     });
//     const cachedResults = getCachedData(cacheKey);
//     if (cachedResults) {
//       setCurrentResults(cachedResults);
//     } else {
//       setCurrentResults({ 
//         enrichment: [], 
//         top_genes: [], 
//         gene_stats: [], 
//         heatmap_data: {}, 
//         noise_metrics: {}, 
//         warning: null 
//       });
//     }
//   }, [normalizationMethod, params, getCachedData, generateCacheKey]);

//   useEffect(() => {
//     console.log("Current Gene Stats:", currentResults.gene_stats);
//     console.log("Current Heatmap Data:", currentResults.heatmap_data);
//   }, [currentResults.gene_stats, currentResults.heatmap_data]);

//   useEffect(() => {
//     let isMounted = true;
//     const fetchData = async () => {
//       if (params.sites.length === 0) {
//         if (isMounted) {
//           setError("Please select at least one cancer site.");
//           setIsLoading(false);
//         }
//         return;
//       }
//       setIsLoading(true);
//       setError(null);
//       try {
//         const { data: siteRows, error: siteRowsErr } = await supabase
//           .from("Sites")
//           .select("id, name")
//           .in("name", params.sites);
//         if (siteRowsErr) throw new Error(`Failed to fetch cancer sites: ${siteRowsErr.message}`);
//         if (!siteRows?.length) throw new Error(`Cancer sites not found: ${params.sites.join(", ")}`);
//         const cancerSiteIds = siteRows.map((row) => row.id);
//         const siteNameMap = new Map(siteRows.map((row) => [row.name.toLowerCase(), row.name]));

//         const { data: cancerTypeRows, error: cancerTypeErr } =
//           params.cancerTypes.length > 0
//             ? await supabase
//                 .from("cancer_types")
//                 .select("id, tcga_code")
//                 .in("tcga_code", params.cancerTypes)
//             : await supabase
//                 .from("cancer_types")
//                 .select("id, tcga_code, site_id")
//                 .in("site_id", cancerSiteIds);

//         if (cancerTypeErr) throw new Error(`Failed to fetch cancer types: ${cancerTypeErr.message}`);
//         const cancerTypeIds = cancerTypeRows.map((row) => row.id);

//         const { data: samplesData, error: samplesError } = await supabase
//           .from("samples")
//           .select("id, sample_barcode, sample_type, cancer_type_id")
//           .in("cancer_type_id", cancerTypeIds);

//         if (samplesError) throw new Error(`Failed to fetch samples: ${samplesError.message}`);
//         const tumorSamples = samplesData
//           .filter((s) => s.sample_type?.toLowerCase() === "tumor")
//           .map((s) => s.sample_barcode);
//         const normalSamples = samplesData
//           .filter((s) => s.sample_type?.toLowerCase() === "normal")
//           .map((s) => s.sample_barcode);
//         if (isMounted) {
//           setTotalTumorSamples(tumorSamples.length);
//           setTotalNormalSamples(normalSamples.length);
//         }

//         const cancerParam = params.siteAnalysisType === "cancer-specific" ? params.sites[0] : params.sites.join(",");

//         const queryParams = new URLSearchParams({
//           cancer: cancerParam,
//           method: normalizationMethod,
//           top_n: params.topN.toString(),
//           analysis_type: params.analysisType,
//           ...(params.genes.length > 0 && params.analysisType === "ORA" && { genes: params.genes.join(",") }),
//         });
//         const response = await fetch(`http://localhost:5001/api/pathway-analysis?${queryParams}`);
//         if (!response.ok) {
//           const errorText = await response.text();
//           throw new Error(`Failed to fetch pathway analysis data: ${errorText}`);
//         }
//         const apiData = await response.json();
//         console.log("API Response:", apiData);

//         let geneToEnsemblMap = new Map<string, string>();
//         let allGenesToProcess: string[] = [];
//         const genes = params.analysisType === "ORA" && params.genes.length > 0 ? params.genes : apiData.top_genes;
//         allGenesToProcess = [...new Set([...allGenesToProcess, ...genes])];
//         if (allGenesToProcess.length > 0) {
//           const { data: geneData, error: geneError } = await supabase
//             .from("genes")
//             .select("id, ensembl_id, gene_symbol")
//             .in("gene_symbol", allGenesToProcess);
//           if (geneError) throw new Error(`Failed to fetch genes: ${geneError.message}`);
//           geneToEnsemblMap = new Map(geneData.map((g) => [g.gene_symbol, g.ensembl_id]));
//         }

//         const processedGeneStats: GeneStats[] = genes.map((gene: string) => {
//           const stats = apiData.gene_stats[gene] || {};
//           return {
//             gene,
//             ensembl_id: geneToEnsemblMap.get(gene) || "N/A",
//             metrics: stats,
//           };
//         });

//         const newResults: ResultsData = {
//           enrichment: apiData.enrichment || [],
//           top_genes: genes,
//           gene_stats: processedGeneStats,
//           heatmap_data: apiData.heatmap_data || {},
//           noise_metrics: apiData.noise_metrics || {},
//           warning: apiData.warning || null,
//         };
//         const cacheKey = generateCacheKey({
//           sites: params.sites,
//           cancerTypes: params.cancerTypes,
//           genes: params.genes,
//           method: normalizationMethod,
//           topN: params.topN,
//           analysisType: params.analysisType,
//           siteAnalysisType: params.siteAnalysisType,
//         });
//         setCachedData(cacheKey, newResults);
//         if (isMounted) {
//           setCurrentResults(newResults);
//           setIsLoading(false);
//           setError(apiData.warning || null);
//         }
//       } catch (error: any) {
//         console.error("Error fetching data:", error);
//         if (isMounted) {
//           setError(error.message || "An error occurred while fetching data.");
//           setCurrentResults({ 
//             enrichment: [], 
//             top_genes: [], 
//             gene_stats: [], 
//             heatmap_data: {}, 
//             noise_metrics: {}, 
//             warning: null 
//           });
//           setIsLoading(false);
//         }
//       }
//     };
//     fetchData();
//     return () => {
//       isMounted = false;
//     };
//   }, [params.sites, params.cancerTypes, params.genes, params.topN, params.analysisType, params.siteAnalysisType, getCachedData, setCachedData, generateCacheKey]);

//   const downloadData = useCallback(
//     (type: "enrichment" | "mean_expression" | "noise_metrics") => {
//       let data: any[] = [];
//       let headers: string[] = [];
//       let filename = `pathway_analysis_${params.sites.join("_")}_${params.siteAnalysisType}_${params.analysisType}_${normalizationMethod}_${Date.now()}`;
//       if (type === "enrichment") {
//         data = currentResults.enrichment;
//         headers = ["Term", "P-value", "Adjusted P-value", "Combined Score", "Genes", "GeneSet"];
//         filename = `enrichment_${filename}.csv`;
//         const rows = data.map((row) =>
//           [
//             row.Term, 
//             row["P-value"], 
//             row["Adjusted P-value"], 
//             row["Combined Score"], 
//             row.Genes.join(", "), 
//             row.GeneSet || ""
//           ].join(",")
//         );
//         const content = [headers.join(","), ...rows].join("\n");
//         const blob = new Blob([content], { type: "text/csv" });
//         const url = URL.createObjectURL(blob);
//         const a = document.createElement("a");
//         a.href = url;
//         a.download = filename;
//         // const sites = params.sites.toLowerCase( )
//         a.click();
//         URL.revokeObjectURL(url);
//       } else if (type === "mean_expression") {
//         data = currentResults.gene_stats;
//         headers = ["Gene", "Ensembl ID", ...params.sites.flatMap((site) => [`${site} Mean Tumor`, `${site} Mean Normal`])];
//         filename = `mean_expression_${filename}.csv`;
//         const rows = data.map((row) => {
//           const metrics = params.sites.flatMap((site) => [
//             row.metrics[site]?.mean_tumor?.toFixed(2) || "0.00",
//             row.metrics[site]?.mean_normal?.toFixed(2) || "0.00",
//           ]);
//           return [row.gene, row.ensembl_id, ...metrics].join(",");
//         });
//         const content = [headers.join(","), ...rows].join("\n");
//         const blob = new Blob([content], { type: "text/csv" });
//         const url = URL.createObjectURL(blob);
//         const a = document.createElement("a");
//         a.href = url;
//         a.download = filename;
//         a.click();
//         URL.revokeObjectURL(url);
//       } else if (type === "noise_metrics") {
//         data = currentResults.gene_stats;
//         headers = ["Gene", "Ensembl ID", ...params.sites.flatMap((site) => [`${site} CV Tumor`, `${site} CV Normal`, `${site} Log2FC`])];
//         filename = `noise_metrics_${filename}.csv`;
//         const rows = data.map((row) => {
//           const metrics = params.sites.flatMap((site) => [
//             row.metrics[site]?.cv_tumor?.toFixed(2) || "0.00",
//             row.metrics[site]?.cv_normal?.toFixed(2) || "0.00",
//             row.metrics[site]?.logfc?.toFixed(2) || "0.00",
//           ]);
//           return [row.gene, row.ensembl_id, ...metrics].join(",");
//         });
//         const content = [headers.join(","), ...rows].join("\n");
//         const blob = new Blob([content], { type: "text/csv" });
//         const url = URL.createObjectURL(blob);
//         const a = document.createElement("a");
//         a.href = url;
//         a.download = filename;
//         a.click();
//         URL.revokeObjectURL(url);
//       }
//     },
//     [currentResults, params.sites, params.cancerTypes, params.analysisType, params.siteAnalysisType, normalizationMethod]
//   );

//   const getZValues = useCallback((dataKey: "mean" | "cv" | "logfc") => {
//     const zValues = currentResults.gene_stats.map((geneStat) => {
//       const gene = geneStat.gene;
//       if (dataKey === "mean") {
//         const heatmapData = currentResults.heatmap_data[gene] || {};
//         return params.sites.flatMap((site) => [
//           heatmapData[`${site.toLowerCase()} Tumor`] || 0,
//           heatmapData[`${site} Normal`] || 0,
//         ]);
//       } else {
//         const metrics = geneStat.metrics;
//         if (dataKey === "cv") {
//           return params.sites.flatMap((site) => [
//             metrics[site]?.cv_tumor || 0,
//             metrics[site]?.cv_normal || 0,
//           ]);
//         } else {
//           return params.sites.map((site) => metrics[site.toLowerCase()]?.logfc || 0);
//         }
//       }
//     });
//     console.log(`All zValues (${dataKey}):`, zValues);
//     return zValues;
//   }, [currentResults.gene_stats, currentResults.heatmap_data, params.sites]);

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-yellow-50 flex flex-col">
//       <Header />
//       <main className="flex-grow">
//         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
//           <div className="grid grid-cols-[320px_1fr] gap-6">
//             <FilterPanel
//               normalizationMethod={normalizationMethod}
//               setNormalizationMethod={(value) => updateFilters({ normalizationMethod: value })}
//             />
//             <div className="flex-1">
//               {isLoading ? (
//                 <LoadingSpinner message="Loading pathway results..." />
//               ) : currentResults.gene_stats.length === 0 ? (
//                 <LoadingSpinner message="Loading pathway results..." />
//               ) : (
//                 <>
//                   {currentResults.warning && (
//                     <Card className="shadow-lg p-6 mb-6 text-center text-yellow-700 bg-yellow-50">
//                       <p className="text-lg">Warning: {currentResults.warning}</p>
//                     </Card>
//                   )}
//                   <Link
//                     to="/pathway-analysis"
//                     className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-6 transition-colors"
//                   >
//                     <ArrowLeft className="h-4 w-4 mr-2" />
//                     Back to Pathway Analysis
//                   </Link>
//                   <div className="mb-8">
//                     <h2 className="text-4xl font-bold text-blue-900 mb-2">
//                       Results for {params.siteAnalysisType === "pan-cancer" ? "Pan-Cancer" : "Cancer-Specific"} Analysis ({params.sites.join(", ")})
//                     </h2>
//                     <div className="flex items-center justify-between mb-4">
//                       <p className="text-blue-700 text-lg">
//                         Normalization: <strong>{normalizationMethod.toUpperCase()}</strong>,{" "}
//                         {params.analysisType === "ORA" && params.genes.length > 0
//                           ? `Custom genes (${params.genes.length})`
//                           : `Top ${params.topN} Noisy Genes`}
//                       </p>
//                       <Button
//                         onClick={() => downloadData("enrichment")}
//                         variant="outline"
//                         size="sm"
//                       >
//                         <Download className="h-4 w-4 mr-2" /> Download Enrichment CSV
//                       </Button>
//                     </div>
//                     <CollapsibleCard title="Sample Counts">
//                       <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
//                         <Card className="border-0 shadow-lg">
//                           <CardContent className="flex flex-col items-center p-4 text-center">
//                             <Users className="h-6 w-6 text-red-600 mb-2" />
//                             <div className="text-2xl font-bold text-red-600">{totalTumorSamples}</div>
//                             <div className="text-xs text-gray-600">Total Tumor Samples</div>
//                           </CardContent>
//                         </Card>
//                         <Card className="border-0 shadow-lg">
//                           <CardContent className="flex flex-col items-center p-4 text-center">
//                             <Users className="h-6 w-6 text-green-600 mb-2" />
//                             <div className="text-2xl font-bold text-green-600">{totalNormalSamples}</div>
//                             <div className="text-xs text-gray-600">Total Normal Samples</div>
//                           </CardContent>
//                         </Card>
//                       </div>
//                       <PlotlyBarChart
//                         data={sampleCountData}
//                         xKey="type"
//                         yKey="count"
//                         title="Sample Count Distribution"
//                         xLabel="Sample Type"
//                         yLabel="Count"
//                         orientation="v"
//                         colors={sampleCountData.map((group) => group.colors)}
//                         legendLabels={["Tumor", "Normal"]}
//                       />
//                     </CollapsibleCard>
//                   </div>
//                   {currentResults.enrichment.length === 0 ? (
//                     <Card className="shadow-lg p-6 text-center text-blue-700">
//                       <Activity className="w-10 h-10 mx-auto mb-3" />
//                       <p className="text-lg">No pathway enrichment results found for the selected parameters.</p>
//                     </Card>
//                   ) : (
//                     <>
//                       <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
//                         <div className="lg:col-span-2">
//                           <CollapsibleCard title="Enriched Pathways" className="h-full">
//                             <DataTable
//                               data={currentResults.enrichment}
//                               columns={[
//                                 { key: "Term", header: "Pathway", sortable: true },
//                                 {
//                                   key: "P-value",
//                                   header: "P-value",
//                                   sortable: true,
//                                   render: (value: number) => formatPValue(value),
//                                 },
//                                 {
//                                   key: "Adjusted P-value",
//                                   header: "Adj. P-value",
//                                   sortable: true,
//                                   render: (value: number) => formatPValue(value),
//                                 },
//                               ]}
//                               defaultSortKey={sortBy === "pval" ? "P-value" : "Adjusted P-value"}
//                               defaultSortOrder={sortOrder}
//                               onRowClick={setSelectedPathway}
//                             />
//                           </CollapsibleCard>
//                         </div>
//                         <div>
//                           <CollapsibleCard title="Pathway Details" className="h-full">
//                             {selectedPathway ? (
//                               <div className="space-y-2 p-2">
//                                 <div>
//                                   <h3 className="font-semibold text-blue-700 text-sm">{selectedPathway.Term}</h3>
//                                   <p className="text-xs text-gray-600">Gene Set: {selectedPathway.GeneSet || "N/A"}</p>
//                                 </div>
//                                 <div>
//                                   <h4 className="font-medium text-blue-700 text-xs">Statistics</h4>
//                                   <div className="grid grid-cols-2 gap-1 mt-1 text-xs">
//                                     <div>P-value:</div>
//                                     <div>{selectedPathway["P-value"].toExponential(2)}</div>
//                                     <div>Adj. P-value:</div>
//                                     <div>{selectedPathway["Adjusted P-value"].toExponential(2)}</div>
//                                   </div>
//                                 </div>
//                                 <div>
//                                   <h4 className="font-medium text-blue-700 text-xs">Associated Genes</h4>
//                                   <div className="flex flex-wrap gap-1 mt-1">
//                                     {selectedPathway.Genes.map((gene, idx) => (
//                                       <span
//                                         key={idx}
//                                         className="bg-blue-100 text-blue-800 px-1 py-0.5 rounded text-xs"
//                                       >
//                                         {gene}
//                                       </span>
//                                     ))}
//                                   </div>
//                                 </div>
//                               </div>
//                             ) : (
//                               <div className="text-center text-gray-500 h-full flex items-center justify-center">
//                                 <div>
//                                   <Info className="h-6 w-6 mx-auto mb-1" />
//                                   <p className="text-xs">Select a pathway to view details</p>
//                                 </div>
//                               </div>
//                             )}
//                           </CollapsibleCard>
//                         </div>
//                       </div>
//                       <div className="grid grid-cols-1 gap-4 mb-4">
//                         <CollapsibleCard title="Expression Heatmap">
//                           <PlotlyHeatmap
//                             title="Expression Heatmap"
//                             data={currentResults.gene_stats}
//                             xValues={params.sites.flatMap((site) => [`${site} Tumor`, `${site} Normal`])}
//                             yValues={currentResults.gene_stats.map((d) => d.gene)}
//                             zValues={getZValues("mean")}
//                             zLabel="Mean Expression"
//                             chartKey="expression-heatmap"
//                             xLabel="Cancer Types"
//                             yLabel="Genes"
//                             colorscale="RdBu"
//                             // reversescale={true}
//                             // showscale={true}
//                             // colorbarTitle="Expression"
//                             // zmin={0}
//                             // zmax={10}
//                           />
//                         </CollapsibleCard>
//                         <CollapsibleCard title="Coefficient of Variation Heatmap">
//                           <PlotlyHeatmap
//                             title="CV Heatmap"
//                             data={currentResults.gene_stats}
//                             xValues={params.sites.flatMap((site) => [`${site} Tumor`, `${site} Normal`])}
//                             yValues={currentResults.gene_stats.map((d) => d.gene)}
//                             zValues={getZValues("cv")}
//                             zLabel="CV"
//                             chartKey="cv-heatmap"
//                             xLabel="Cancer Types"
//                             yLabel="Genes"
//                             colorscale="Viridis"
//                             // showscale={true}
//                             // colorbarTitle="CV"
//                             // zmin={0}
//                             // zmax={2}
//                           />
//                         </CollapsibleCard>
//                         <CollapsibleCard title="Log2 Fold Change Heatmap">
//                           <PlotlyHeatmap
//                             title="Log2 Fold Change Heatmap"
//                             data={currentResults.gene_stats}
//                             xValues={params.sites}
//                             yValues={currentResults.gene_stats.map((d) => d.gene)}
//                             zValues={getZValues("logfc")}
//                             zLabel="Log2FC"
//                             chartKey="logfc-heatmap"
//                             xLabel="Cancer Types"
//                             yLabel="Genes"
//                             colorscale="RdBu"
//                             // showscale={true}
//                             // colorbarTitle="Log2FC"
//                             // zmin={-5}
//                             // zmax={5}
//                           />
//                         </CollapsibleCard>
//                       </div>
//                       <CollapsibleCard
//                         title="Mean Expression Analysis"
//                         className="mb-4"
//                         downloadButton={
//                           <Button
//                             onClick={() => downloadData("mean_expression")}
//                             variant="outline"
//                             size="sm"
//                             className="h-6 px-2 text-xs"
//                           >
//                             <Download className="h-4 w-4 mr-2" /> Download CSV
//                           </Button>
//                         }
//                       >
//                         {currentResults.gene_stats.length > 0 ? (
//                           <DataTable
//                             data={currentResults.gene_stats}
//                             columns={[
//                               { key: "gene", header: "Gene", sortable: true },
//                               { key: "ensembl_id", header: "Ensembl ID", sortable: true },
//                               ...params.sites.flatMap((site) => [
//                                 {
//                                   key: `metrics.${site}.mean_tumor`,
//                                   header: `${site} Mean Tumor (${normalizationMethod})`,
//                                   sortable: true,
//                                   render: (value: number) => (value ? value.toFixed(2) : "0.00"),
//                                 },
//                                 {
//                                   key: `metrics.${site}.mean_normal`,
//                                   header: `${site} Mean Normal (${normalizationMethod})`,
//                                   sortable: true,
//                                   render: (value: number) => (value ? value.toFixed(2) : "0.00"),
//                                 },
//                               ]),
//                             ]}
//                           />
//                         ) : (
//                           <p className="text-blue-700 text-sm">No mean expression data available.</p>
//                         )}
//                       </CollapsibleCard>
//                       <CollapsibleCard
//                         title="Noise Metrics Analysis"
//                         className="mb-4 p-2 text-sm"
//                         downloadButton={
//                           <Button
//                             onClick={() => downloadData("noise_metrics")}
//                             variant="outline"
//                             size="sm"
//                             className="h-6 px-2 text-xs"
//                           >
//                             <Download className="h-4 w-4 mr-2" /> Download CSV
//                           </Button>
//                         }
//                       >
//                         {currentResults.gene_stats.length > 0 ? (
//                           <DataTable
//                             data={currentResults.gene_stats}
//                             columns={[
//                               { key: "gene", header: "Gene", sortable: true },
//                               { key: "ensembl_id", header: "Ensembl ID", sortable: true },
//                               ...params.sites.flatMap((site) => [
//                                 {
//                                   key: `metrics.${site}.cv_tumor`,
//                                   header: `${site} CV Tumor (${normalizationMethod})`,
//                                   sortable: true,
//                                   render: (value: number) => (value ? value.toFixed(2) : "0.00"),
//                                 },
//                                 {
//                                   key: `metrics.${site}.cv_normal`,
//                                   header: `${site} CV Normal (${normalizationMethod})`,
//                                   sortable: true,
//                                   render: (value: number) => (value ? value.toFixed(2) : "0.00"),
//                                 },
//                                 {
//                                   key: `metrics.${site}.logfc`,
//                                   header: `${site} Log2FC`,
//                                   sortable: true,
//                                   render: (value: number) => (value ? value.toFixed(2) : "0.00"),
//                                 },
//                               ]),
//                             ]}
//                           />
//                         ) : (
//                           <p className="text-blue-700">No noise metrics data available.</p>
//                         )}
//                       </CollapsibleCard>
//                     </>
//                   )}
//                 </>
//               )}
//             </div>
//           </div>
//         </div>
//       </main>
//       <Footer />
//     </div>
//   );
// };

// export default PathwayResults;

// import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
// import { useSearchParams, Link } from "react-router-dom";
// import supabase from "@/supabase-client";
// import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
// import { Button } from "@/components/ui/button";
// import { ArrowLeft, Download, Activity, Users, Info } from "lucide-react";
// import { PlotlyHeatmap, PlotlyBarChart } from "@/components/charts/index";
// import Header from "@/components/header";
// import Footer from "@/components/footer";
// import { Enrichment, ResultsData, GeneStats } from "@/components/types/pathway";
// import { useCache } from "@/hooks/use-cache";
// import { LoadingSpinner } from "@/components/ui/loadingSpinner";
// import FilterPanel from "@/components/FilterPanel";
// import { DataTable } from "@/components/ui/data-table";
// import CollapsibleCard from "@/components/ui/collapsible-card";
// import SampleCounts from "@/components/SampleCounts";

// const PathwayResults = () => {
//   const [searchParams] = useSearchParams();
//   const params = useMemo(
//     () => ({
//       sites: searchParams.get("sites")?.split(",").filter(Boolean) || [],
//       cancerTypes: searchParams.get("cancerTypes")?.split(",").filter(Boolean) || [],
//       genes: searchParams.get("genes")?.split(",").filter(Boolean) || [],
//       method: searchParams.get("method") || "tpm",
//       topN: parseInt(searchParams.get("top_n") || "15", 10),
//       analysisType: searchParams.get("analysisType") || "ORA",
//       siteAnalysisType: searchParams.get("siteAnalysisType") || "pan-cancer",
//     }),
//     [searchParams]
//   );

//   const [normalizationMethod, setNormalizationMethod] = useState(params.method);
//   const [currentResults, setCurrentResults] = useState<ResultsData>({ 
//     enrichment: [], 
//     top_genes: [], 
//     gene_stats: [], 
//     heatmap_data: {}, 
//     noise_metrics: {}, 
//     warning: null 
//   });
//   const [isLoading, setIsLoading] = useState(false);
//   const [error, setError] = useState<string | null>(null);
//   const [siteSampleCounts, setSiteSampleCounts] = useState<{ site: string; tumor: number; normal: number }[]>([]);
//   const [totalTumorSamples, setTotalTumorSamples] = useState(0);
//   const [totalNormalSamples, setTotalNormalSamples] = useState(0);
//   const [customGeneInput, setCustomGeneInput] = useState("");
//   const [selectedPathway, setSelectedPathway] = useState<Enrichment | null>(null);
//   const [showGeneInput, setShowGeneInput] = useState(params.analysisType === "ORA");
//   const [sortBy, setSortBy] = useState<"pval" | "adjPval">("pval");
//   const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
//   const filterTimeoutRef = useRef<NodeJS.Timeout | null>(null);
//   const { getCachedData, setCachedData, generateCacheKey } = useCache<ResultsData>();
//   const normalizationMethods = ["tpm", "fpkm", "fpkm_uq"];

//   const logFCColors = useMemo(() => {
//     return currentResults.gene_stats.map((geneStat) => {
//       const logFCs = Object.values(geneStat.metrics).map((m) => m.logfc);
//       const avgLogFC = logFCs.length > 0 ? logFCs.reduce((sum, val) => sum + val, 0) / logFCs.length : 0;
//       return avgLogFC < 0 ? "#ef4444" : "#3b82f6";
//     });
//   }, [currentResults.gene_stats]);

//   const sampleCountData = useMemo(
//     () => [
//       { type: "Tumor", count: totalTumorSamples, colors: "#ef4444" },
//       { type: "Normal", count: totalNormalSamples, colors: "#10b981" },
//     ],
//     [totalTumorSamples, totalNormalSamples]
//   );

//   const updateFilters = useCallback(
//     (newFilters: { normalizationMethod?: string }) => {
//       if (filterTimeoutRef.current) {
//         clearTimeout(filterTimeoutRef.current);
//       }
//       filterTimeoutRef.current = setTimeout(() => {
//         if (newFilters.normalizationMethod) {
//           setNormalizationMethod(newFilters.normalizationMethod);
//         }
//       }, 300);
//     },
//     []
//   );

//   const formatPValue = (pValue: number) => {
//     if (pValue <= 0.001) return "****";
//     if (pValue <= 0.01) return "***";
//     if (pValue <= 0.05) return "**";
//     return pValue.toExponential(2);
//   };

//   const handleGeneInput = (e: React.ChangeEvent<HTMLInputElement>) => {
//     setCustomGeneInput(e.target.value);
//   };

//   const processCustomGenes = () => {
//     return customGeneInput
//       .split(/[\s,|]+/)
//       .map((gene) => gene.trim())
//       .filter((gene) => gene.length > 0);
//   };

//   const submitCustomGenes = () => {
//     const genes = processCustomGenes();
//     if (genes.length > 0) {
//       localStorage.clear();
//       window.location.href = `/pathway-results?sites=${params.sites.join(
//         ","
//       )}&cancerTypes=${params.cancerTypes.join(
//         ","
//       )}&genes=${genes.join(",")}&method=${normalizationMethod}&top_n=${params.topN}&analysisType=ORA&siteAnalysisType=${params.siteAnalysisType}`;
//     }
//   };

//   const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
//     const file = e.target.files?.[0];
//     if (!file) return;
//     const reader = new FileReader();
//     reader.onload = (event) => {
//       const content = event.target?.result as string;
//       const genes = content.split(/[\s,|\n]+/).filter((gene) => gene.trim().length > 0);
//       setCustomGeneInput(genes.join(", "));
//     };
//     reader.readAsText(file);
//   };

//   // const fetchSampleCounts = useCallback(async (sites: string[], cancerTypes: string[]) => {
//   //   try {
//   //     const { data: siteRows, error: siteRowsErr } = await supabase
//   //       .from("Sites")
//   //       .select("id, name")
//   //       .in("name", sites);
//   //     if (siteRowsErr) throw new Error(`Failed to fetch cancer sites: ${siteRowsErr.message}`);
//   //     if (!siteRows?.length) throw new Error(`Cancer sites not found: ${sites.join(", ")}`);
//   //     const cancerSiteIds = siteRows.map((row) => row.id);

//   //     const { data: cancerTypeRows, error: cancerTypeErr } =
//   //       cancerTypes.length > 0
//   //         ? await supabase
//   //             .from("cancer_types")
//   //             .select("id, tcga_code")
//   //             .in("tcga_code", cancerTypes)
//   //         : await supabase
//   //             .from("cancer_types")
//   //             .select("id, tcga_code, site_id")
//   //             .in("site_id", cancerSiteIds);

//   //     if (cancerTypeErr) throw new Error(`Failed to fetch cancer types: ${cancerTypeErr.message}`);
//   //     const cancerTypeIds = cancerTypeRows.map((row) => row.id);

//   //     const { data: samplesData, error: samplesError } = await supabase
//   //       .from("samples")
//   //       .select("id, sample_barcode, sample_type, cancer_type_id")
//   //       .in("cancer_type_id", cancerTypeIds);

//   //     if (samplesError) throw new Error(`Failed to fetch samples: ${samplesError.message}`);
//   //     const tumorSamples = samplesData
//   //       .filter((s) => s.sample_type?.toLowerCase() === "tumor")
//   //       .map((s) => s.sample_barcode);
//   //     const normalSamples = samplesData
//   //       .filter((s) => s.sample_type?.toLowerCase() === "normal")
//   //       .map((s) => s.sample_barcode);
//   //     setTotalTumorSamples(tumorSamples.length);
//   //     setTotalNormalSamples(normalSamples.length);
//   //     return { tumorSamples, normalSamples };
//   //   } catch (error: any) {
//   //     console.error("Error fetching sample counts:", error);
//   //     setError(error.message || "An error occurred while fetching sample counts.");
//   //     return { tumorSamples: [], normalSamples: [] };
//   //   }
//   // }, []);
//     const fetchSampleCounts = useCallback(async (sites: string[], cancerTypes: string[]) => {
//     try {
//       const { data: siteRows, error: siteRowsErr } = await supabase
//         .from("Sites")
//         .select("id, name")
//         .in("name", sites);
//       if (siteRowsErr) throw new Error(`Failed to fetch cancer sites: ${siteRowsErr.message}`);
//       if (!siteRows?.length) throw new Error(`Cancer sites not found: ${sites.join(", ")}`);
//       const cancerSiteIds = siteRows.map((row) => row.id);

//       const { data: cancerTypeRows, error: cancerTypeErr } =
//         cancerTypes.length > 0
//           ? await supabase
//               .from("cancer_types")
//               .select("id, tcga_code, site_id")
//               .in("tcga_code", cancerTypes)
//               .in("site_id", cancerSiteIds)
//           : await supabase
//               .from("cancer_types")
//               .select("id, tcga_code, site_id")
//               .in("site_id", cancerSiteIds);

//       if (cancerTypeErr) throw new Error(`Failed to fetch cancer types: ${cancerTypeErr.message}`);
//       const cancerTypeIds = cancerTypeRows.map((row) => row.id);

//       const { data: samplesData, error: samplesError } = await supabase
//         .from("samples")
//         .select("id, sample_barcode, sample_type, cancer_type_id")
//         .in("cancer_type_id", cancerTypeIds);

//       if (samplesError) throw new Error(`Failed to fetch samples: ${samplesError.message}`);

//       // Calculate sample counts per site
//       const siteCounts = sites.map((site) => {
//         const siteId = siteRows.find((s) => s.name === site)?.id;
//         if (!siteId) return { site, tumor: 0, normal: 0 };

//         const siteSamples = samplesData.filter((s) => {
//           const cancerType = cancerTypeRows.find((ct) => ct.id === s.cancer_type_id);
//           return cancerType?.site_id === siteId;
//         });

//         const tumorSamples = siteSamples.filter((s) => s.sample_type?.toLowerCase() === "tumor").length;
//         const normalSamples = siteSamples.filter((s) => s.sample_type?.toLowerCase() === "normal").length;

//         return { site, tumor: tumorSamples, normal: normalSamples };
//       });

//       setSiteSampleCounts(siteCounts);
//       return siteCounts;
//     } catch (error: any) {
//       console.error("Error fetching sample counts:", error);
//       setError(error.message || "An error occurred while fetching sample counts.");
//       return [];
//     }
//   }, []);

//   useEffect(() => {
//     if (params.sites.length > 0) {
//       fetchSampleCounts(params.sites, params.cancerTypes);
//     }
//   }, [params.sites, params.cancerTypes, fetchSampleCounts]);

//   useEffect(() => {
//     if (!normalizationMethods.includes(normalizationMethod)) {
//       setNormalizationMethod("tpm");
//     }
//     const cacheKey = generateCacheKey({
//       sites: params.sites,
//       cancerTypes: params.cancerTypes,
//       genes: params.genes,
//       method: normalizationMethod,
//       topN: params.topN,
//       analysisType: params.analysisType,
//       siteAnalysisType: params.siteAnalysisType,
//     });
//     const cachedResults = getCachedData(cacheKey);
//     if (cachedResults) {
//       setCurrentResults(cachedResults);
//     } else {
//       setCurrentResults({ 
//         enrichment: [], 
//         top_genes: [], 
//         gene_stats: [], 
//         heatmap_data: {}, 
//         noise_metrics: {}, 
//         warning: null 
//       });
//     }
//   }, [normalizationMethod, params, getCachedData, generateCacheKey]);

//   useEffect(() => {
//     console.log("Current Gene Stats:", currentResults.gene_stats);
//     console.log("Current Heatmap Data:", currentResults.heatmap_data);
//   }, [currentResults.gene_stats, currentResults.heatmap_data]);

//   useEffect(() => {
//     let isMounted = true;
//     const fetchData = async () => {
//       if (params.sites.length === 0) {
//         if (isMounted) {
//           setError("Please select at least one cancer site.");
//           setIsLoading(false);
//         }
//         return;
//       }
//       setIsLoading(true);
//       setError(null);
//       try {
//         const { data: siteRows, error: siteRowsErr } = await supabase
//           .from("Sites")
//           .select("id, name")
//           .in("name", params.sites);
//         if (siteRowsErr) throw new Error(`Failed to fetch cancer sites: ${siteRowsErr.message}`);
//         if (!siteRows?.length) throw new Error(`Cancer sites not found: ${params.sites.join(", ")}`);
//         const cancerSiteIds = siteRows.map((row) => row.id);
//         const siteNameMap = new Map(siteRows.map((row) => [row.name.toLowerCase(), row.name]));

//         const { data: cancerTypeRows, error: cancerTypeErr } =
//           params.cancerTypes.length > 0
//             ? await supabase
//                 .from("cancer_types")
//                 .select("id, tcga_code")
//                 .in("tcga_code", params.cancerTypes)
//             : await supabase
//                 .from("cancer_types")
//                 .select("id, tcga_code, site_id")
//                 .in("site_id", cancerSiteIds);

//         if (cancerTypeErr) throw new Error(`Failed to fetch cancer types: ${cancerTypeErr.message}`);
//         const cancerTypeIds = cancerTypeRows.map((row) => row.id);

//         const { data: samplesData, error: samplesError } = await supabase
//           .from("samples")
//           .select("id, sample_barcode, sample_type, cancer_type_id")
//           .in("cancer_type_id", cancerTypeIds);

//         if (samplesError) throw new Error(`Failed to fetch samples: ${samplesError.message}`);
//         const tumorSamples = samplesData
//           .filter((s) => s.sample_type?.toLowerCase() === "tumor")
//           .map((s) => s.sample_barcode);
//         const normalSamples = samplesData
//           .filter((s) => s.sample_type?.toLowerCase() === "normal")
//           .map((s) => s.sample_barcode);
//         if (isMounted) {
//           setTotalTumorSamples(tumorSamples.length);
//           setTotalNormalSamples(normalSamples.length);
//         }

//         const cancerParam = params.siteAnalysisType === "cancer-specific" ? params.sites[0] : params.sites.join(",");

//         const queryParams = new URLSearchParams({
//           cancer: cancerParam,
//           method: normalizationMethod,
//           top_n: params.topN.toString(),
//           analysis_type: params.analysisType,
//           ...(params.genes.length > 0 && params.analysisType === "ORA" && { genes: params.genes.join(",") }),
//         });
//         const response = await fetch(`http://localhost:5001/api/pathway-analysis?${queryParams}`);
//         if (!response.ok) {
//           const errorText = await response.text();
//           throw new Error(`Failed to fetch pathway analysis data: ${errorText}`);
//         }
//         const apiData = await response.json();
//         console.log("API Response:", apiData);

//         let geneToEnsemblMap = new Map<string, string>();
//         let allGenesToProcess: string[] = [];
//         const genes = params.analysisType === "ORA" && params.genes.length > 0 ? params.genes : apiData.top_genes;
//         allGenesToProcess = [...new Set([...allGenesToProcess, ...genes])];
//         if (allGenesToProcess.length > 0) {
//           const { data: geneData, error: geneError } = await supabase
//             .from("genes")
//             .select("id, ensembl_id, gene_symbol")
//             .in("gene_symbol", allGenesToProcess);
//           if (geneError) throw new Error(`Failed to fetch genes: ${geneError.message}`);
//           geneToEnsemblMap = new Map(geneData.map((g) => [g.gene_symbol, g.ensembl_id]));
//         }

//         const processedGeneStats: GeneStats[] = genes.map((gene: string) => {
//           const stats = apiData.gene_stats[gene] || {};
//           return {
//             gene,
//             ensembl_id: geneToEnsemblMap.get(gene) || "N/A",
//             metrics: stats,
//           };
//         });
//         console.log("processed gene stats: ", processedGeneStats);

//         const newResults: ResultsData = {
//           enrichment: apiData.enrichment || [],
//           top_genes: genes,
//           gene_stats: processedGeneStats,
//           heatmap_data: apiData.heatmap_data || {},
//           noise_metrics: apiData.noise_metrics || {},
//           warning: apiData.warning || null,
//         };
//         const cacheKey = generateCacheKey({
//           sites: params.sites,
//           cancerTypes: params.cancerTypes,
//           genes: params.genes,
//           method: normalizationMethod,
//           topN: params.topN,
//           analysisType: params.analysisType,
//           siteAnalysisType: params.siteAnalysisType,
//         });
//         setCachedData(cacheKey, newResults);
//         if (isMounted) {
//           setCurrentResults(newResults);
//           setIsLoading(false);
//           setError(apiData.warning || null);
//         }
//       } catch (error: any) {
//         console.error("Error fetching data:", error);
//         if (isMounted) {
//           setError(error.message || "An error occurred while fetching data.");
//           setCurrentResults({ 
//             enrichment: [], 
//             top_genes: [], 
//             gene_stats: [], 
//             heatmap_data: {}, 
//             noise_metrics: {}, 
//             warning: null 
//           });
//           setIsLoading(false);
//         }
//       }
//     };
//     fetchData();
//     return () => {
//       isMounted = false;
//     };
//   }, [params.sites, params.cancerTypes, params.genes, params.topN, params.analysisType, params.siteAnalysisType, getCachedData, setCachedData, generateCacheKey]);

//   const downloadData = useCallback(
//     (type: "enrichment" | "mean_expression" | "noise_metrics") => {
//       let data: any[] = [];
//       let headers: string[] = [];
//       let filename = `pathway_analysis_${params.sites.join("_")}_${params.siteAnalysisType}_${params.analysisType}_${normalizationMethod}_${Date.now()}`;
//       if (type === "enrichment") {
//         data = currentResults.enrichment;
//         headers = ["Term", "P-value", "Adjusted P-value", "Combined Score", "Genes", "GeneSet"];
//         filename = `enrichment_${filename}.csv`;
//         const rows = data.map((row) =>
//           [
//             row.Term, 
//             row["P-value"], 
//             row["Adjusted P-value"], 
//             row["Combined Score"], 
//             row.Genes.join(", "), 
//             row.GeneSet || ""
//           ].join(",")
//         );
//         const content = [headers.join(","), ...rows].join("\n");
//         const blob = new Blob([content], { type: "text/csv" });
//         const url = URL.createObjectURL(blob);
//         const a = document.createElement("a");
//         a.href = url;
//         a.download = filename;
//         a.click();
//         URL.revokeObjectURL(url);
//       } else if (type === "mean_expression") {
//         data = currentResults.gene_stats;
//         headers = ["Gene", "Ensembl ID", ...params.sites.flatMap((site) => [`${site} Mean Tumor`, `${site} Mean Normal`])];
//         filename = `mean_expression_${filename}.csv`;
//         const rows = data.map((row) => {
//           const metrics = params.sites.map((site) => {
//             const lowerSite = site.toLowerCase();
//             return [
//               row.metrics[lowerSite]?.mean_tumor?.toFixed(2) || "0.00",
//               row.metrics[lowerSite]?.mean_normal?.toFixed(2) || "0.00",
//             ];
//           }).flat();
//           return [row.gene, row.ensembl_id, ...metrics].join(",");
//         });
//         const content = [headers.join(","), ...rows].join("\n");
//         const blob = new Blob([content], { type: "text/csv" });
//         const url = URL.createObjectURL(blob);
//         const a = document.createElement("a");
//         a.href = url;
//         a.download = filename;
//         a.click();
//         URL.revokeObjectURL(url);
//       } else if (type === "noise_metrics") {
//         data = currentResults.gene_stats;
//         headers = ["Gene", "Ensembl ID", ...params.sites.flatMap((site) => [`${site} CV Tumor`, `${site} CV Normal`, `${site} Log2FC`])];
//         filename = `noise_metrics_${filename}.csv`;
//         const rows = data.map((row) => {
//           const metrics = params.sites.map((site) => {
//             const lowerSite = site.toLowerCase();
//             return [
//               row.metrics[lowerSite]?.cv_tumor?.toFixed(2) || "0.00",
//               row.metrics[lowerSite]?.cv_normal?.toFixed(2) || "0.00",
//               row.metrics[lowerSite]?.logfc?.toFixed(2) || "0.00",
//             ];
//           }).flat();
//           return [row.gene, row.ensembl_id, ...metrics].join(",");
//         });
//         const content = [headers.join(","), ...rows].join("\n");
//         const blob = new Blob([content], { type: "text/csv" });
//         const url = URL.createObjectURL(blob);
//         const a = document.createElement("a");
//         a.href = url;
//         a.download = filename;
//         a.click();
//         URL.revokeObjectURL(url);
//       }
//     },
//     [currentResults, params.sites, params.cancerTypes, params.analysisType, params.siteAnalysisType, normalizationMethod]
//   );

//   const getZValues = useCallback((dataKey: "mean" | "cv" | "logfc") => {
//     const zValues = currentResults.gene_stats.map((geneStat) => {
//       const gene = geneStat.gene;
//       if (dataKey === "mean") {
//         return params.sites.flatMap((site) => {
//           const lowerSite = site.toLowerCase();
//           console.log("check:", lowerSite)
//           return [
//             geneStat.metrics[lowerSite]?.mean_tumor || 0,
//             geneStat.metrics[lowerSite]?.mean_normal || 0,
//           ];
//         });
//       } else if (dataKey === "cv") {
//         return params.sites.flatMap((site) => {
//           const lowerSite = site.toLowerCase();
//           return [
//             geneStat.metrics[lowerSite]?.cv_tumor || 0,
//             geneStat.metrics[lowerSite]?.cv_normal || 0,
//           ];
//         });
//       } else {
//         return params.sites.map((site) => {
//           const lowerSite = site.toLowerCase();
//           return geneStat.metrics[lowerSite]?.logfc || 0;
//         });
//       }
//     });
//     console.log(`All zValues (${dataKey}):`, zValues);
//     return zValues;
//   }, [currentResults.gene_stats, params.sites]);

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-yellow-50 flex flex-col">
//       <Header />
//       <main className="flex-grow">
//         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
//           <div className="grid grid-cols-[320px_1fr] gap-6">
//             <FilterPanel
//               normalizationMethod={normalizationMethod}
//               setNormalizationMethod={(value) => updateFilters({ normalizationMethod: value })}
//             />
//             <div className="flex-1">
//               {isLoading ? (
//                 <LoadingSpinner message="Loading pathway results..." />
//               ) : currentResults.gene_stats.length === 0 ? (
//                 <LoadingSpinner message="Loading pathway results..." />
//               ) : (
//                 <>
//                   {currentResults.warning && (
//                     <Card className="shadow-lg p-6 mb-6 text-center text-yellow-700 bg-yellow-50">
//                       <p className="text-lg">Warning: {currentResults.warning}</p>
//                     </Card>
//                   )}
//                   <Link
//                     to="/pathway-analysis"
//                     className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-6 transition-colors"
//                   >
//                     <ArrowLeft className="h-4 w-4 mr-2" />
//                     Back to Pathway Analysis
//                   </Link>
//                   <div className="mb-8">
//                     <h2 className="text-4xl font-bold text-blue-900 mb-2">
//                       Results for {params.siteAnalysisType === "pan-cancer" ? "Pan-Cancer" : "Cancer-Specific"} Analysis ({params.sites.join(", ")})
//                     </h2>
//                     <div className="flex items-center justify-between mb-4">
//                       <p className="text-blue-700 text-lg">
//                         Normalization: <strong>{normalizationMethod.toUpperCase()}</strong>,{" "}
//                         {params.analysisType === "ORA" && params.genes.length > 0
//                           ? `Custom genes (${params.genes.length})`
//                           : `Top ${params.topN} Noisy Genes`}
//                       </p>
//                       <Button
//                         onClick={() => downloadData("enrichment")}
//                         variant="outline"
//                         size="sm"
//                       >
//                         <Download className="h-4 w-4 mr-2" /> Download Enrichment CSV
//                       </Button>
//                     </div>
//                     <CollapsibleCard title="Sample Counts">
//                       <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
//                         <Card className="border-0 shadow-lg">
//                           <CardContent className="flex flex-col items-center p-4 text-center">
//                             <Users className="h-6 w-6 text-red-600 mb-2" />
//                             <div className="text-2xl font-bold text-red-600">{totalTumorSamples}</div>
//                             <div className="text-xs text-gray-600">Total Tumor Samples</div>
//                           </CardContent>
//                         </Card>
//                         <Card className="border-0 shadow-lg">
//                           <CardContent className="flex flex-col items-center p-4 text-center">
//                             <Users className="h-6 w-6 text-green-600 mb-2" />
//                             <div className="text-2xl font-bold text-green-600">{totalNormalSamples}</div>
//                             <div className="text-xs text-gray-600">Total Normal Samples</div>
//                           </CardContent>
//                         </Card>
//                       </div>
//                       <PlotlyBarChart
//                         data={sampleCountData}
//                         xKey="type"
//                         yKey="count"
//                         title="Sample Count Distribution"
//                         xLabel="Sample Type"
//                         yLabel="Count"
//                         orientation="v"
//                         colors={sampleCountData.map((group) => group.colors)}
//                         legendLabels={["Tumor", "Normal"]}
//                       />
//                     </CollapsibleCard>
//                   </div>

// import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
// import { useSearchParams, Link } from "react-router-dom";
// import supabase from "@/supabase-client";
// import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
// import { Button } from "@/components/ui/button";
// import { ArrowLeft, Download, Activity, Users, Info, CheckSquare, Square } from "lucide-react";
// import { PlotlyHeatmap, PlotlyBarChart } from "@/components/charts/index";
// import Header from "@/components/header";
// import Footer from "@/components/footer";
// import { Enrichment, ResultsData, GeneStats } from "@/components/types/pathway";
// import { useCache } from "@/hooks/use-cache";
// import { LoadingSpinner } from "@/components/ui/loadingSpinner";
// import FilterPanel from "@/components/FilterPanel";
// import { DataTable } from "@/components/ui/data-table";
// import CollapsibleCard from "@/components/ui/collapsible-card";
// import SampleCounts from "@/components/SampleCounts";

// const PathwayResults = () => {
//   const [searchParams] = useSearchParams();
//   const params = useMemo(
//     () => ({
//       sites: searchParams.get("sites")?.split(",").filter(Boolean) || [],
//       cancerTypes: searchParams.get("cancerTypes")?.split(",").filter(Boolean) || [],
//       genes: searchParams.get("genes")?.split(",").filter(Boolean) || [],
//       method: searchParams.get("method") || "tpm",
//       topN: parseInt(searchParams.get("top_n") || "15", 10),
//       analysisType: searchParams.get("analysisType") || "ORA",
//       siteAnalysisType: searchParams.get("siteAnalysisType") || "pan-cancer",
//     }),
//     [searchParams]
//   );

//   const [normalizationMethod, setNormalizationMethod] = useState(params.method);
//   const [currentResults, setCurrentResults] = useState<ResultsData>({
//     enrichment: [],
//     top_genes: [],
//     gene_stats: [],
//     heatmap_data: {},
//     noise_metrics: {},
//     warning: null,
//   });
//   const [isLoading, setIsLoading] = useState(false);
//   const [error, setError] = useState<string | null>(null);
//   const [siteSampleCounts, setSiteSampleCounts] = useState<{ site: string; tumor: number; normal: number }[]>([]);
//   const [isOpen, setIsOpen] = useState(false);
//   const [selectedGroups, setSelectedGroups] = useState<string[]>(["normal", "tumor"]);
//   const [customGeneInput, setCustomGeneInput] = useState("");
//   const [selectedPathway, setSelectedPathway] = useState<Enrichment | null>(null);
//   const [showGeneInput, setShowGeneInput] = useState(params.analysisType === "ORA");
//   const [sortBy, setSortBy] = useState<"pval" | "adjPval">("pval");
//   const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
//   const filterTimeoutRef = useRef<NodeJS.Timeout | null>(null);
//   const { getCachedData, setCachedData, generateCacheKey } = useCache<ResultsData>();
//   const normalizationMethods = ["tpm", "fpkm", "fpkm_uq"];
//   const [totalTumorSamples, setTotalTumorSamples] = useState(0);
//   const [totalNormalSamples, setTotalNormalSamples] = useState(0);

//   const logFCColors = useMemo(() => {
//     return currentResults.gene_stats.map((geneStat) => {
//       const logFCs = Object.values(geneStat.metrics).map((m) => m.logfc || 0);
//       const avgLogFC = logFCs.length > 0 ? logFCs.reduce((sum, val) => sum + val, 0) / logFCs.length : 0;
//       return avgLogFC < 0 ? "#ef4444" : "#3b82f6";
//     });
//   }, [currentResults.gene_stats]);

//   const updateFilters = useCallback(
//     (newFilters: { normalizationMethod?: string }) => {
//       if (filterTimeoutRef.current) {
//         clearTimeout(filterTimeoutRef.current);
//       }
//       filterTimeoutRef.current = setTimeout(() => {
//         if (newFilters.normalizationMethod) {
//           setNormalizationMethod(newFilters.normalizationMethod);
//         }
//       }, 300);
//     },
//     []
//   );

//   const formatPValue = (pValue: number) => {
//     if (pValue <= 0.001) return "****";
//     if (pValue <= 0.01) return "***";
//     if (pValue <= 0.05) return "**";
//     return pValue.toExponential(2);
//   };

//   const handleGeneInput = (e: React.ChangeEvent<HTMLInputElement>) => {
//     setCustomGeneInput(e.target.value);
//   };

//   const processCustomGenes = () => {
//     return customGeneInput
//       .split(/[\s,|]+/)
//       .map((gene) => gene.trim())
//       .filter((gene) => gene.length > 0);
//   };

//   const submitCustomGenes = () => {
//     const genes = processCustomGenes();
//     if (genes.length > 0) {
//       localStorage.clear();
//       window.location.href = `/pathway-results?sites=${params.sites.join(
//         ","
//       )}&cancerTypes=${params.cancerTypes.join(
//         ","
//       )}&genes=${genes.join(",")}&method=${normalizationMethod}&top_n=${params.topN}&analysisType=ORA&siteAnalysisType=${params.siteAnalysisType}`;
//     }
//   };

//   const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
//     const file = e.target.files?.[0];
//     if (!file) return;
//     const reader = new FileReader();
//     reader.onload = (event) => {
//       const content = event.target?.result as string;
//       const genes = content.split(/[\s,|\n]+/).filter((gene) => gene.trim().length > 0);
//       setCustomGeneInput(genes.join(", "));
//     };
//     reader.readAsText(file);
//   };

//   const fetchSampleCounts = useCallback(async (sites: string[], cancerTypes: string[]) => {
//     try {
//       const { data: siteRows, error: siteRowsErr } = await supabase
//         .from("Sites")
//         .select("id, name")
//         .in("name", sites);
//       if (siteRowsErr) throw new Error(`Failed to fetch cancer sites: ${siteRowsErr.message}`);
//       if (!siteRows?.length) throw new Error(`Cancer sites not found: ${sites.join(", ")}`);
//       const cancerSiteIds = siteRows.map((row) => row.id);

//       const { data: cancerTypeRows, error: cancerTypeErr } =
//         cancerTypes.length > 0
//           ? await supabase
//               .from("cancer_types")
//               .select("id, tcga_code, site_id")
//               .in("tcga_code", cancerTypes)
//               .in("site_id", cancerSiteIds)
//           : await supabase
//               .from("cancer_types")
//               .select("id, tcga_code, site_id")
//               .in("site_id", cancerSiteIds);

//       if (cancerTypeErr) throw new Error(`Failed to fetch cancer types: ${cancerTypeErr.message}`);
//       const cancerTypeIds = cancerTypeRows.map((row) => row.id);

//       const { data: samplesData, error: samplesError } = await supabase
//         .from("samples")
//         .select("id, sample_barcode, sample_type, cancer_type_id")
//         .in("cancer_type_id", cancerTypeIds);

//       if (samplesError) throw new Error(`Failed to fetch samples: ${samplesError.message}`);

//       // Calculate sample counts per site
//       const siteCounts = sites.map((site) => {
//         const siteId = siteRows.find((s) => s.name === site)?.id;
//         if (!siteId) return { site, tumor: 0, normal: 0 };

//         const siteSamples = samplesData.filter((s) => {
//           const cancerType = cancerTypeRows.find((ct) => ct.id === s.cancer_type_id);
//           return cancerType?.site_id === siteId;
//         });

//         const tumorSamples = siteSamples.filter((s) => s.sample_type?.toLowerCase() === "tumor").length;
//         const normalSamples = siteSamples.filter((s) => s.sample_type?.toLowerCase() === "normal").length;

//         return { site, tumor: tumorSamples, normal: normalSamples };
//       });

//       setSiteSampleCounts(siteCounts);
//       return siteCounts;
//     } catch (error: any) {
//       console.error("Error fetching sample counts:", error);
//       setError(error.message || "An error occurred while fetching sample counts.");
//       return [];
//     }
//   }, []);

//   useEffect(() => {
//     if (params.sites.length > 0) {
//       fetchSampleCounts(params.sites, params.cancerTypes);
//     }
//   }, [params.sites, params.cancerTypes, fetchSampleCounts]);

//   useEffect(() => {
//     if (!normalizationMethods.includes(normalizationMethod)) {
//       setNormalizationMethod("tpm");
//     }
//     const cacheKey = generateCacheKey({
//       sites: params.sites,
//       cancerTypes: params.cancerTypes,
//       genes: params.genes,
//       method: normalizationMethod,
//       topN: params.topN,
//       analysisType: params.analysisType,
//       siteAnalysisType: params.siteAnalysisType,
//     });
//     const cachedResults = getCachedData(cacheKey);
//     if (cachedResults) {
//       setCurrentResults(cachedResults);
//     } else {
//       setCurrentResults({
//         enrichment: [],
//         top_genes: [],
//         gene_stats: [],
//         heatmap_data: {},
//         noise_metrics: {},
//         warning: null,
//       });
//     }
//   }, [normalizationMethod, params, getCachedData, generateCacheKey]);

//   useEffect(() => {
//     console.log("Current Gene Stats:", currentResults.gene_stats);
//     console.log("Current Heatmap Data:", currentResults.heatmap_data);
//     console.log("Site Sample Counts:", siteSampleCounts);
//   }, [currentResults.gene_stats, currentResults.heatmap_data, siteSampleCounts]);

//   useEffect(() => {
//     let isMounted = true;
//     const fetchData = async () => {
//       if (params.sites.length === 0) {
//         if (isMounted) {
//           setError("Please select at least one cancer site.");
//           setIsLoading(false);
//         }
//         return;
//       }
//       setIsLoading(true);
//       setError(null);
//       try {
//         const { data: siteRows, error: siteRowsErr } = await supabase
//           .from("Sites")
//           .select("id, name")
//           .in("name", params.sites);
//         if (siteRowsErr) throw new Error(`Failed to fetch cancer sites: ${siteRowsErr.message}`);
//         if (!siteRows?.length) throw new Error(`Cancer sites not found: ${params.sites.join(", ")}`);
//         const cancerSiteIds = siteRows.map((row) => row.id);

//         const { data: cancerTypeRows, error: cancerTypeErr } =
//           params.cancerTypes.length > 0
//             ? await supabase
//                 .from("cancer_types")
//                 .select("id, tcga_code")
//                 .in("tcga_code", params.cancerTypes)
//             : await supabase
//                 .from("cancer_types")
//                 .select("id, tcga_code, site_id")
//                 .in("site_id", cancerSiteIds);

//         if (cancerTypeErr) throw new Error(`Failed to fetch cancer types: ${cancerTypeErr.message}`);
//         const cancerTypeIds = cancerTypeRows.map((row) => row.id);

//         const { data: samplesData, error: samplesError } = await supabase
//           .from("samples")
//           .select("id, sample_barcode, sample_type, cancer_type_id")
//           .in("cancer_type_id", cancerTypeIds);

//         if (samplesError) throw new Error(`Failed to fetch samples: ${samplesError.message}`);
//         if (samplesError) throw new Error(`Failed to fetch samples: ${samplesError.message}`);
//         const tumorSamples = samplesData
//           .filter((s) => s.sample_type?.toLowerCase() === "tumor")
//           .map((s) => s.sample_barcode);
//         const normalSamples = samplesData
//           .filter((s) => s.sample_type?.toLowerCase() === "normal")
//           .map((s) => s.sample_barcode);
//         if (isMounted) {
//           setTotalTumorSamples(tumorSamples.length);
//           setTotalNormalSamples(normalSamples.length);
//         }

//         const cancerParam = params.siteAnalysisType === "cancer-specific" ? params.sites[0] : params.sites.join(",");

//         const queryParams = new URLSearchParams({
//           cancer: cancerParam,
//           method: normalizationMethod,
//           top_n: params.topN.toString(),
//           analysis_type: params.analysisType,
//           ...(params.genes.length > 0 && params.analysisType === "ORA" && { genes: params.genes.join(",") }),
//         });
//         const response = await fetch(`http://localhost:5001/api/pathway-analysis?${queryParams}`);
//         if (!response.ok) {
//           const errorText = await response.text();
//           throw new Error(`Failed to fetch pathway analysis data: ${errorText}`);
//         }
//         const apiData = await response.json();
//         console.log("API Response:", apiData);

//         let geneToEnsemblMap = new Map<string, string>();
//         let allGenesToProcess: string[] = [];
//         const genes = params.analysisType === "ORA" && params.genes.length > 0 ? params.genes : apiData.top_genes;
//         allGenesToProcess = [...new Set([...allGenesToProcess, ...genes])];
//         if (allGenesToProcess.length > 0) {
//           const { data: geneData, error: geneError } = await supabase
//             .from("genes")
//             .select("id, ensembl_id, gene_symbol")
//             .in("gene_symbol", allGenesToProcess);
//           if (geneError) throw new Error(`Failed to fetch genes: ${geneError.message}`);
//           geneToEnsemblMap = new Map(geneData.map((g) => [g.gene_symbol, g.ensembl_id]));
//         }

//         const processedGeneStats: GeneStats[] = genes.map((gene: string) => {
//           const stats = apiData.gene_stats[gene] || {};
//           return {
//             gene,
//             ensembl_id: geneToEnsemblMap.get(gene) || "N/A",
//             metrics: stats,
//           };
//         });

//         const newResults: ResultsData = {
//           enrichment: apiData.enrichment || [],
//           top_genes: genes,
//           gene_stats: processedGeneStats,
//           heatmap_data: apiData.heatmap_data || {},
//           noise_metrics: apiData.noise_metrics || {},
//           warning: apiData.warning || null,
//         };
//         const cacheKey = generateCacheKey({
//           sites: params.sites,
//           cancerTypes: params.cancerTypes,
//           genes: params.genes,
//           method: normalizationMethod,
//           topN: params.topN,
//           analysisType: params.analysisType,
//           siteAnalysisType: params.siteAnalysisType,
//         });
//         setCachedData(cacheKey, newResults);
//         if (isMounted) {
//           setCurrentResults(newResults);
//           setIsLoading(false);
//           setError(null);
//         }
//       } catch (error: any) {
//         console.error("Error fetching data:", error);
//         if (isMounted) {
//           setError(error.message || "An error occurred while fetching data.");
//           setCurrentResults({
//             enrichment: [],
//             top_genes: [],
//             gene_stats: [],
//             heatmap_data: {},
//             noise_metrics: {},
//             warning: null,
//           });
//           setIsLoading(false);
//         }
//       }
//     };
//     fetchData();
//     return () => {
//       isMounted = false;
//     };
//   }, [params.sites, params.cancerTypes, params.genes, params.topN, params.analysisType, params.siteAnalysisType, getCachedData, setCachedData, generateCacheKey]);

//   const downloadData = useCallback(
//     (type: "enrichment" | "mean_expression" | "noise_metrics") => {
//       let data: any[] = [];
//       let headers: string[] = [];
//       let filename = `pathway_analysis_${params.sites.join("_")}_${params.siteAnalysisType}_${params.analysisType}_${normalizationMethod}_${Date.now()}`;
//       if (type === "enrichment") {
//         data = currentResults.enrichment;
//         headers = ["Term", "P-value", "Adjusted P-value", "Combined Score", "Genes", "GeneSet"];
//         filename = `enrichment_${filename}.csv`;
//         const rows = data.map((row) =>
//           [
//             row.Term,
//             row["P-value"],
//             row["Adjusted P-value"],
//             row["Combined Score"],
//             row.Genes.join(", "),
//             row.GeneSet || "",
//           ].join(",")
//         );
//         const content = [headers.join(","), ...rows].join("\n");
//         const blob = new Blob([content], { type: "text/csv" });
//         const url = URL.createObjectURL(blob);
//         const a = document.createElement("a");
//         a.href = url;
//         a.download = filename;
//         a.click();
//         URL.revokeObjectURL(url);
//       } else if (type === "mean_expression") {
//         data = currentResults.gene_stats;
//         headers = ["Gene", "Ensembl ID", ...params.sites.flatMap((site) => [`${site} Mean Tumor`, `${site} Mean Normal`])];
//         filename = `mean_expression_${filename}.csv`;
//         const rows = data.map((row) => {
//           const metrics = params.sites.map((site) => {
//             const lowerSite = site.toLowerCase();
//             const metric = row.metrics[lowerSite] || {};
//             return [
//               metric.mean_tumor?.toFixed(2) || "0.00",
//               metric.mean_normal?.toFixed(2) || "0.00",
//             ];
//           }).flat();
//           return [row.gene, row.ensembl_id, ...metrics].join(",");
//         });
//         const content = [headers.join(","), ...rows].join("\n");
//         const blob = new Blob([content], { type: "text/csv" });
//         const url = URL.createObjectURL(blob);
//         const a = document.createElement("a");
//         a.href = url;
//         a.download = filename;
//         a.click();
//         URL.revokeObjectURL(url);
//       } else if (type === "noise_metrics") {
//         data = currentResults.gene_stats;
//         headers = ["Gene", "Ensembl ID", ...params.sites.flatMap((site) => [`${site} CV Tumor`, `${site} CV Normal`, `${site} Log2FC`])];
//         filename = `noise_metrics_${filename}.csv`;
//         const rows = data.map((row) => {
//           const metrics = params.sites.map((site) => {
//             const lowerSite = site.toLowerCase();
//             const metric = row.metrics[lowerSite] || {};
//             return [
//               metric.cv_tumor?.toFixed(2) || "0.00",
//               metric.cv_normal?.toFixed(2) || "0.00",
//               metric.logfc?.toFixed(2) || "0.00",
//             ];
//           }).flat();
//           return [row.gene, row.ensembl_id, ...metrics].join(",");
//         });
//         const content = [headers.join(","), ...rows].join("\n");
//         const blob = new Blob([content], { type: "text/csv" });
//         const url = URL.createObjectURL(blob);
//         const a = document.createElement("a");
//         a.href = url;
//         a.download = filename;
//         a.click();
//         URL.revokeObjectURL(url);
//       }
//     },
//     [currentResults, params.sites, params.cancerTypes, params.analysisType, params.siteAnalysisType, normalizationMethod]
//   );

//   // const getZValues = useCallback((dataKey: "mean" | "cv" | "logfc") => {
//   //   const zValues = currentResults.gene_stats.map((geneStat) => {
//   //     const gene = geneStat.gene;
//   //     if (dataKey === "mean") {
//   //       return params.sites.flatMap((site) => {
//   //         const lowerSite = site.toLowerCase();
//   //         const metric = geneStat.metrics[lowerSite] || {};
//   //         return [
//   //           metric.mean_tumor || 0,
//   //           metric.mean_normal || 0,
//   //         ];
//   //       });
//   //     } else if (dataKey === "cv") {
//   //       return params.sites.flatMap((site) => {
//   //         const lowerSite = site.toLowerCase();
//   //         const metric = geneStat.metrics[lowerSite] || {};
//   //         return [
//   //           metric.cv_tumor || 0,
//   //           metric.cv_normal || 0,
//   //         ];
//   //       });
//   //     } else {
//   //       return params.sites.map((site) => {
//   //         const lowerSite = site.toLowerCase();
//   //         const metric = geneStat.metrics[lowerSite] || {};
//   //         return metric.logfc || 0;
//   //       });
//   //     }
//   //   });
//   //   console.log(`All zValues (${dataKey}):`, zValues);
//   //   return zValues;
//   // }, [currentResults.gene_stats, params.sites]);
//   const getZValues = useCallback((dataKey: "mean" | "cv" | "logfc") => {
//     const zValues = currentResults.gene_stats.map((geneStat) => {
//       const gene = geneStat.gene;
//       if (dataKey === "mean") {
//         return params.sites.flatMap((site) => {
//           const lowerSite = site.toLowerCase();
//           console.log("check:", lowerSite)
//           return [
//             geneStat.metrics[lowerSite]?.mean_tumor || 0,
//             geneStat.metrics[lowerSite]?.mean_normal || 0,
//           ];
//         });
//       } else if (dataKey === "cv") {
//         return params.sites.flatMap((site) => {
//           const lowerSite = site.toLowerCase();
//           return [
//             geneStat.metrics[lowerSite]?.cv_tumor || 0,
//             geneStat.metrics[lowerSite]?.cv_normal || 0,
//           ];
//         });
//       } else {
//         return params.sites.map((site) => {
//           const lowerSite = site.toLowerCase();
//           return geneStat.metrics[lowerSite]?.logfc || 0;
//         });
//       }
//     });
//     console.log(`All zValues (${dataKey}):`, zValues);
//     return zValues;
//   }, [currentResults.gene_stats, params.sites]);

//   const toggleOpen = () => {
//     setIsOpen(!isOpen);
//   };

//   const toggleGroup = (group: string) => {
//     setSelectedGroups((prev) =>
//       prev.includes(group) ? prev.filter((g) => g !== group) : [...prev, group]
//     );
//   };

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-yellow-50 flex flex-col">
//       <Header />
//       <main className="flex-grow">
//         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
//           <div className="grid grid-cols-[320px_1fr] gap-6">
//             <FilterPanel
//               normalizationMethod={normalizationMethod}
//               setNormalizationMethod={(value) => updateFilters({ normalizationMethod: value })}
//             />
//             <div className="flex-1">
//               {isLoading ? (
//                 <LoadingSpinner message="Loading pathway results..." />
//               ) : currentResults.gene_stats.length === 0 ? (
//                 <LoadingSpinner message="Loading pathway results..." />
//               ) : (
//                 <>
//                   {currentResults.warning && (
//                     <Card className="shadow-lg p-6 mb-6 text-center text-yellow-700 bg-yellow-50">
//                       <p className="text-lg">Warning: {currentResults.warning}</p>
//                     </Card>
//                   )}
//                   <Link
//                     to="/pathway-analysis"
//                     className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-6 transition-colors"
//                   >
//                     <ArrowLeft className="h-4 w-4 mr-2" />
//                     Back to Pathway Analysis
//                   </Link>
//                   <div className="mb-8">
//                     <h2 className="text-4xl font-bold text-blue-900 mb-2">
//                       Results for {params.siteAnalysisType === "pan-cancer" ? "Pan-Cancer" : "Cancer-Specific"} Analysis ({params.sites.join(", ")})
//                     </h2>
//                     <div className="flex items-center justify-between mb-4">
//                       <p className="text-blue-700 text-lg">
//                         Normalization: <strong>{normalizationMethod.toUpperCase()}</strong>,{" "}
//                         {params.analysisType === "ORA" && params.genes.length > 0
//                           ? `Custom genes (${params.genes.length})`
//                           : `Top ${params.topN} Noisy Genes`}
//                       </p>
//                       <Button
//                         onClick={() => downloadData("enrichment")}
//                         variant="outline"
//                         size="sm"
//                       >
//                         <Download className="h-4 w-4 mr-2" /> Download Enrichment CSV
//                       </Button>
//                     </div>
//                     <div className="mb-4">
//                       {/* <h3 className="text-2xl font-bold text-blue-900 mb-2">Sample Counts by Site</h3> */}
//                       <CollapsibleCard title="Sample Counts">
//                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
//                          <Card className="border-0 shadow-lg">
//                            <CardContent className="flex flex-col items-center p-4 text-center">
//                              <Users className="h-6 w-6 text-red-600 mb-2" />
//                              <div className="text-2xl font-bold text-red-600">{totalTumorSamples}</div>
//                              <div className="text-xs text-gray-600">Total Tumor Samples</div>
//                            </CardContent>
//                          </Card>
//                          <Card className="border-0 shadow-lg">
//                            <CardContent className="flex flex-col items-center p-4 text-center">
//                              <Users className="h-6 w-6 text-green-600 mb-2" />
//                              <div className="text-2xl font-bold text-green-600">{totalNormalSamples}</div>
//                              <div className="text-xs text-gray-600">Total Normal Samples</div>
//                            </CardContent>
//                          </Card>
//                        </div>
                       
//                       <SampleCounts
//                         isOpen={isOpen}
//                         toggleOpen={toggleOpen}
//                         siteSampleCounts={siteSampleCounts.length > 0 ? siteSampleCounts : params.sites.map((site) => ({ site, tumor: 0, normal: 0 }))}
//                         selectedSites={params.sites}
//                         selectedGroups={selectedGroups}
//                       />
//                       </CollapsibleCard>
//                     </div>
//                   </div>
//                   {currentResults.enrichment.length === 0 ? (
//                     <Card className="shadow-lg p-6 text-center text-blue-700">
//                       <Activity className="w-10 h-10 mx-auto mb-3" />
//                       <p className="text-lg">No pathway enrichment results found for the selected parameters.</p>
//                     </Card>
//                   ) : (
//                     <>
//                       <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
//                         <div className="lg:col-span-2">
//                           <CollapsibleCard title="Enriched Pathways" className="h-full">
//                             <DataTable
//                               data={currentResults.enrichment}
//                               columns={[
//                                 { key: "Term", header: "Pathway", sortable: true },
//                                 {
//                                   key: "P-value",
//                                   header: "P-value",
//                                   sortable: true,
//                                   render: (value: number) => formatPValue(value),
//                                 },
//                                 {
//                                   key: "Adjusted P-value",
//                                   header: "Adj. P-value",
//                                   sortable: true,
//                                   render: (value: number) => formatPValue(value),
//                                 },
//                               ]}
//                               defaultSortKey={sortBy === "pval" ? "P-value" : "Adjusted P-value"}
//                               defaultSortOrder={sortOrder}
//                               onRowClick={setSelectedPathway}
//                             />
//                           </CollapsibleCard>
//                         </div>
//                         <div>
//                           <CollapsibleCard title="Pathway Details" className="h-full">
//                             {selectedPathway ? (
//                               <div className="space-y-2 p-2">
//                                 <div>
//                                   <h3 className="font-semibold text-blue-700 text-sm">{selectedPathway.Term}</h3>
//                                   <p className="text-xs text-gray-600">Gene Set: {selectedPathway.GeneSet || "N/A"}</p>
//                                 </div>
//                                 <div>
//                                   <h4 className="font-medium text-blue-700 text-xs">Statistics</h4>
//                                   <div className="grid grid-cols-2 gap-1 mt-1 text-xs">
//                                     <div>P-value:</div>
//                                     <div>{selectedPathway["P-value"].toExponential(2)}</div>
//                                     <div>Adj. P-value:</div>
//                                     <div>{selectedPathway["Adjusted P-value"].toExponential(2)}</div>
//                                   </div>
//                                 </div>
//                                 <div>
//                                   <h4 className="font-medium text-blue-700 text-xs">Associated Genes</h4>
//                                   <div className="flex flex-wrap gap-1 mt-1">
//                                     {selectedPathway.Genes.map((gene, idx) => (
//                                       <span
//                                         key={idx}
//                                         className="bg-blue-100 text-blue-800 px-1 py-0.5 rounded text-xs"
//                                       >
//                                         {gene}
//                                       </span>
//                                     ))}
//                                   </div>
//                                 </div>
//                               </div>
//                             ) : (
//                               <div className="text-center text-gray-500 h-full flex items-center justify-center">
//                                 <div>
//                                   <Info className="h-6 w-6 mx-auto mb-1" />
//                                   <p className="text-xs">Select a pathway to view details</p>
//                                 </div>
//                               </div>
//                             )}
//                           </CollapsibleCard>
//                         </div>
//                       </div>
//                       <div className="grid grid-cols-1 gap-4 mb-8">
//                         <CollapsibleCard title="Expression Heatmap">
//                           <PlotlyHeatmap
//                             title="Expression Heatmap"
//                             data={currentResults.gene_stats}
//                             xValues={params.sites.flatMap((site) => [`${site} Tumor`, `${site} Normal`])}
//                             yValues={currentResults.gene_stats.map((d) => d.gene)}
//                             zValues={getZValues("mean")}
//                             zLabel="Mean Expression"
//                             chartKey="expression-heatmap"
//                             xLabel="Cancer Types"
//                             yLabel="Genes"
//                             colorscale="RdBu"
//                             // reversescale={true}
//                             // showscale={true}
//                             // colorbarTitle="Expression"
//                             // zmin={0}
//                             // zmax={10}
//                           />
//                         </CollapsibleCard>
//                         <CollapsibleCard title="Coefficient of Variation Heatmap">
//                           <PlotlyHeatmap
//                             title="CV Heatmap"
//                             data={currentResults.gene_stats}
//                             xValues={params.sites.flatMap((site) => [`${site} Tumor`, `${site} Normal`])}
//                             yValues={currentResults.gene_stats.map((d) => d.gene)}
//                             zValues={getZValues("cv")}
//                             zLabel="CV"
//                             chartKey="cv-heatmap"
//                             xLabel="Cancer Types"
//                             yLabel="Genes"
//                             colorscale="Viridis"
//                             // showscale={true}
//                             // colorbarTitle="CV"
//                             // zmin={0}
//                             // zmax={2}
//                           />
//                         </CollapsibleCard>
//                         <CollapsibleCard title="Log2 Fold Change Heatmap">
//                           <PlotlyHeatmap
//                             title="Log2 Fold Change Heatmap"
//                             data={currentResults.gene_stats}
//                             xValues={params.sites}
//                             yValues={currentResults.gene_stats.map((d) => d.gene)}
//                             zValues={getZValues("logfc")}
//                             zLabel="Log2FC"
//                             chartKey="logfc-heatmap"
//                             xLabel="Cancer Types"
//                             yLabel="Genes"
//                             colorscale="RdBu"
//                             // showscale={true}
//                             // colorbarTitle="Log2FC"
//                             // zmin={-5}
//                             // zmax={5}
//                           />
//                         </CollapsibleCard>
//                       </div>
//                       <CollapsibleCard
//                         title="Mean Expression Analysis"
//                         className="mb-4"
//                         downloadButton={
//                           <Button
//                             onClick={() => downloadData("mean_expression")}
//                             variant="outline"
//                             size="sm"
//                             className="h-6 px-2 text-xs"
//                           >
//                             <Download className="h-4 w-4 mr-2" /> Download CSV
//                           </Button>
//                         }
//                       >
//                         {currentResults.gene_stats.length > 0 ? (
//                                                     <DataTable
//                             data={currentResults.gene_stats}
//                             columns={[
//                               { key: "gene", header: "Gene", sortable: true },
//                               { key: "ensembl_id", header: "Ensembl ID", sortable: true },
//                               ...params.sites.flatMap((site) => {
//                                 const lowerSite = site.toLowerCase();

//                                 return [
//                                   {
//                                     key: `${site}-mean_tumor`,
//                                     header: `${site} Tumor`,
//                                     sortable: true,
//                                     render: (_: any, row: any) => {
//                                       const value = row.metrics?.[lowerSite]?.mean_tumor;
//                                       return value != null ? value.toFixed(3) : "N/A";
//                                     },
//                                   },
//                                   {
//                                     key: `${site}-mean_normal`,
//                                     header: `${site} Normal`,
//                                     sortable: true,
//                                     render: (_: any, row: any) => {
//                                       const value = row.metrics?.[lowerSite]?.mean_normal;
//                                       return value != null ? value.toFixed(3) : "N/A";
//                                     },
//                                   },
//                                   // {
//                                   //   key: `${site}-logfc`,
//                                   //   header: `${site} Log2FC`,
//                                   //   sortable: true,
//                                   //   render: (_: any, row: any) => {
//                                   //     const value = row.metrics?.[lowerSite]?.logfc;
//                                   //     return value != null ? value.toFixed(3) : "N/A";
//                                   //   },
//                                   // },
//                                 ];
//                               }),
//                             ]}
//                           />
//                         ) : (
//                           <p className="text-blue-700">No noise metrics data available.</p>
//                         )}

//                       </CollapsibleCard>
//                       <CollapsibleCard
//                         title="Noise Metrics Analysis (CV)"
//                         className="mb-4 p-2 text-sm"
//                         downloadButton={
//                           <Button
//                             onClick={() => downloadData("noise_metrics")}
//                             variant="outline"
//                             size="sm"
//                             className="h-6 px-2 text-xs"
//                           >
//                             <Download className="h-4 w-4 mr-2" /> Download CSV
//                           </Button>
//                         }
//                       >
//                         {currentResults.gene_stats.length > 0 ? (
//                           <DataTable
//                             data={currentResults.gene_stats}
//                             columns={[
//                               { key: "gene", header: "Gene", sortable: true },
//                               { key: "ensembl_id", header: "Ensembl ID", sortable: true },
//                               ...params.sites.flatMap((site) => {
//                                 const lowerSite = site.toLowerCase();

//                                 return [
//                                   {
//                                     key: `${site}-cv_tumor`,
//                                     header: `${site} Tumor`,
//                                     sortable: true,
//                                     render: (_: any, row: any) => {
//                                       const value = row.metrics?.[lowerSite]?.cv_tumor;
//                                       return value != null ? value.toFixed(3) : "N/A";
//                                     },
//                                   },
//                                   {
//                                     key: `${site}-cv_normal`,
//                                     header: `${site} Normal`,
//                                     sortable: true,
//                                     render: (_: any, row: any) => {
//                                       const value = row.metrics?.[lowerSite]?.cv_normal;
//                                       return value != null ? value.toFixed(3) : "N/A";
//                                     },
//                                   },
//                                   {
//                                     key: `${site}-logfc`,
//                                     header: `${site} Log2FC`,
//                                     sortable: true,
//                                     render: (_: any, row: any) => {
//                                       const value = row.metrics?.[lowerSite]?.logfc;
//                                       return value != null ? value.toFixed(3) : "N/A";
//                                     },
//                                   },
//                                 ];
//                               }),
//                             ]}
//                           />
//                         ) : (
//                           <p className="text-blue-700">No noise metrics data available.</p>
//                         )}

//                       </CollapsibleCard>
//                     </>
//                   )}
//                 </>
//               )}
//             </div>
//           </div>
//         </div>
//       </main>
//       <Footer />
//     </div>
//   );
// };

// export default PathwayResults;
// import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
// import { useSearchParams, Link } from "react-router-dom";
// import supabase from "@/supabase-client";
// import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
// import { Button } from "@/components/ui/button";
// import { ArrowLeft, Download, Activity, Users, Info, CheckSquare, Square } from "lucide-react";
// import { PlotlyHeatmap, PlotlyBarChart } from "@/components/charts/index";
// import Header from "@/components/header";
// import Footer from "@/components/footer";
// import { Enrichment, ResultsData, GeneStats } from "@/components/types/pathway";
// import { useCache } from "@/hooks/use-cache";
// import { LoadingSpinner } from "@/components/ui/loadingSpinner";
// import FilterPanel from "@/components/FilterPanel";
// import { DataTable } from "@/components/ui/data-table";
// import CollapsibleCard from "@/components/ui/collapsible-card";
// import SampleCounts from "@/components/SampleCounts";

// const PathwayResults = () => {
//   const [searchParams] = useSearchParams();
//   const params = useMemo(
//     () => ({
//       sites: searchParams.get("sites")?.split(",").filter(Boolean) || [],
//       cancerTypes: searchParams.get("cancerTypes")?.split(",").filter(Boolean) || [],
//       genes: searchParams.get("genes")?.split(",").filter(Boolean) || [],
//       method: searchParams.get("method") || "tpm",
//       topN: parseInt(searchParams.get("top_n") || "15", 10),
//       analysisType: searchParams.get("analysisType") || "ORA",
//       siteAnalysisType: searchParams.get("siteAnalysisType") || "pan-cancer",
//     }),
//     [searchParams]
//   );

//   const [normalizationMethod, setNormalizationMethod] = useState(params.method);
//   const [currentResults, setCurrentResults] = useState<ResultsData>({
//     enrichment: [],
//     top_genes: [],
//     gene_stats: [],
//     heatmap_data: {},
//     noise_metrics: {},
//     warning: null,
//   });
//   const [isLoading, setIsLoading] = useState(false);
//   const [error, setError] = useState<string | null>(null);
//   const [siteSampleCounts, setSiteSampleCounts] = useState<{ site: string; tumor: number; normal: number }[]>([]);
//   const [isOpen, setIsOpen] = useState(false);
//   const [selectedGroups, setSelectedGroups] = useState<string[]>(["normal", "tumor"]);
//   const [customGeneInput, setCustomGeneInput] = useState("");
//   const [selectedPathway, setSelectedPathway] = useState<Enrichment | null>(null);
//   const [showGeneInput, setShowGeneInput] = useState(params.analysisType === "ORA");
//   const [sortBy, setSortBy] = useState<"pval" | "adjPval">("pval");
//   const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
//   const filterTimeoutRef = useRef<NodeJS.Timeout | null>(null);
//   const { getCachedData, setCachedData, generateCacheKey } = useCache<ResultsData>();
//   const normalizationMethods = ["tpm", "fpkm", "fpkm_uq"];
//   const [totalTumorSamples, setTotalTumorSamples] = useState(0);
//   const [totalNormalSamples, setTotalNormalSamples] = useState(0);

//   const logFCColors = useMemo(() => {
//     return currentResults.gene_stats.map((geneStat) => {
//       const logFCs = Object.values(geneStat.metrics).map((m) => m.logfc || 0);
//       const avgLogFC = logFCs.length > 0 ? logFCs.reduce((sum, val) => sum + val, 0) / logFCs.length : 0;
//       return avgLogFC < 0 ? "#ef4444" : "#3b82f6";
//     });
//   }, [currentResults.gene_stats]);

//   const updateFilters = useCallback(
//     (newFilters: { normalizationMethod?: string }) => {
//       if (filterTimeoutRef.current) {
//         clearTimeout(filterTimeoutRef.current);
//       }
//       filterTimeoutRef.current = setTimeout(() => {
//         if (newFilters.normalizationMethod) {
//           setNormalizationMethod(newFilters.normalizationMethod);
//         }
//       }, 300);
//     },
//     []
//   );

//   const formatPValue = (pValue: number) => {
//     if (pValue <= 0.001) return "****";
//     if (pValue <= 0.01) return "***";
//     if (pValue <= 0.05) return "**";
//     return pValue.toExponential(2);
//   };

//   const handleGeneInput = (e: React.ChangeEvent<HTMLInputElement>) => {
//     setCustomGeneInput(e.target.value);
//   };

//   const processCustomGenes = () => {
//     return customGeneInput
//       .split(/[\s,|]+/)
//       .map((gene) => gene.trim())
//       .filter((gene) => gene.length > 0);
//   };

//   const submitCustomGenes = () => {
//     const genes = processCustomGenes();
//     if (genes.length > 0) {
//       localStorage.clear();
//       window.location.href = `/pathway-results?sites=${params.sites.join(
//         ","
//       )}&cancerTypes=${params.cancerTypes.join(
//         ","
//       )}&genes=${genes.join(",")}&method=${normalizationMethod}&top_n=${params.topN}&analysisType=ORA&siteAnalysisType=${params.siteAnalysisType}`;
//     }
//   };

//   const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
//     const file = e.target.files?.[0];
//     if (!file) return;
//     const reader = new FileReader();
//     reader.onload = (event) => {
//       const content = event.target?.result as string;
//       const genes = content.split(/[\s,|\n]+/).filter((gene) => gene.trim().length > 0);
//       setCustomGeneInput(genes.join(", "));
//     };
//     reader.readAsText(file);
//   };

//   const fetchSampleCounts = useCallback(async (sites: string[], cancerTypes: string[]) => {
//     try {
//       const { data: siteRows, error: siteRowsErr } = await supabase
//         .from("Sites")
//         .select("id, name")
//         .in("name", sites);
//       if (siteRowsErr) throw new Error(`Failed to fetch cancer sites: ${siteRowsErr.message}`);
//       if (!siteRows?.length) throw new Error(`Cancer sites not found: ${sites.join(", ")}`);
//       const cancerSiteIds = siteRows.map((row) => row.id);

//       const { data: cancerTypeRows, error: cancerTypeErr } =
//         cancerTypes.length > 0
//           ? await supabase
//               .from("cancer_types")
//               .select("id, tcga_code, site_id")
//               .in("tcga_code", cancerTypes)
//               .in("site_id", cancerSiteIds)
//           : await supabase
//               .from("cancer_types")
//               .select("id, tcga_code, site_id")
//               .in("site_id", cancerSiteIds);

//       if (cancerTypeErr) throw new Error(`Failed to fetch cancer types: ${cancerTypeErr.message}`);
//       const cancerTypeIds = cancerTypeRows.map((row) => row.id);

//       const { data: samplesData, error: samplesError } = await supabase
//         .from("samples")
//         .select("id, sample_barcode, sample_type, cancer_type_id")
//         .in("cancer_type_id", cancerTypeIds);

//       if (samplesError) throw new Error(`Failed to fetch samples: ${samplesError.message}`);

//       // Calculate sample counts per site
//       const siteCounts = sites.map((site) => {
//         const siteId = siteRows.find((s) => s.name === site)?.id;
//         if (!siteId) return { site, tumor: 0, normal: 0 };

//         const siteSamples = samplesData.filter((s) => {
//           const cancerType = cancerTypeRows.find((ct) => ct.id === s.cancer_type_id);
//           return cancerType?.site_id === siteId;
//         });

//         const tumorSamples = siteSamples.filter((s) => s.sample_type?.toLowerCase() === "tumor").length;
//         const normalSamples = siteSamples.filter((s) => s.sample_type?.toLowerCase() === "normal").length;

//         return { site, tumor: tumorSamples, normal: normalSamples };
//       });

//       setSiteSampleCounts(siteCounts);
//       return siteCounts;
//     } catch (error: any) {
//       console.error("Error fetching sample counts:", error);
//       setError(error.message || "An error occurred while fetching sample counts.");
//       return [];
//     }
//   }, []);

//   useEffect(() => {
//     if (params.sites.length > 0) {
//       fetchSampleCounts(params.sites, params.cancerTypes);
//     }
//   }, [params.sites, params.cancerTypes, fetchSampleCounts]);

//   useEffect(() => {
//     if (!normalizationMethods.includes(normalizationMethod)) {
//       setNormalizationMethod("tpm");
//     }
//     const cacheKey = generateCacheKey({
//       sites: params.sites,
//       cancerTypes: params.cancerTypes,
//       genes: params.genes,
//       method: normalizationMethod,
//       topN: params.topN,
//       analysisType: params.analysisType,
//       siteAnalysisType: params.siteAnalysisType,
//     });
//     const cachedResults = getCachedData(cacheKey);
//     if (cachedResults) {
//       setCurrentResults(cachedResults);
//     } else {
//       setCurrentResults({
//         enrichment: [],
//         top_genes: [],
//         gene_stats: [],
//         heatmap_data: {},
//         noise_metrics: {},
//         warning: null,
//       });
//     }
//   }, [normalizationMethod, params, getCachedData, generateCacheKey]);

//   useEffect(() => {
//     console.log("Current Gene Stats:", currentResults.gene_stats);
//     console.log("Current Heatmap Data:", currentResults.heatmap_data);
//     console.log("Site Sample Counts:", siteSampleCounts);
//   }, [currentResults.gene_stats, currentResults.heatmap_data, siteSampleCounts]);

//   useEffect(() => {
//     let isMounted = true;
//     const fetchData = async () => {
//       if (params.sites.length === 0) {
//         if (isMounted) {
//           setError("Please select at least one cancer site.");
//           setIsLoading(false);
//         }
//         return;
//       }
//       setIsLoading(true);
//       setError(null);
//       try {
//         const { data: siteRows, error: siteRowsErr } = await supabase
//           .from("Sites")
//           .select("id, name")
//           .in("name", params.sites);
//         if (siteRowsErr) throw new Error(`Failed to fetch cancer sites: ${siteRowsErr.message}`);
//         if (!siteRows?.length) throw new Error(`Cancer sites not found: ${params.sites.join(", ")}`);
//         const cancerSiteIds = siteRows.map((row) => row.id);

//         const { data: cancerTypeRows, error: cancerTypeErr } =
//           params.cancerTypes.length > 0
//             ? await supabase
//                 .from("cancer_types")
//                 .select("id, tcga_code")
//                 .in("tcga_code", params.cancerTypes)
//             : await supabase
//                 .from("cancer_types")
//                 .select("id, tcga_code, site_id")
//                 .in("site_id", cancerSiteIds);

//         if (cancerTypeErr) throw new Error(`Failed to fetch cancer types: ${cancerTypeErr.message}`);
//         const cancerTypeIds = cancerTypeRows.map((row) => row.id);

//         const { data: samplesData, error: samplesError } = await supabase
//           .from("samples")
//           .select("id, sample_barcode, sample_type, cancer_type_id")
//           .in("cancer_type_id", cancerTypeIds);

//         if (samplesError) throw new Error(`Failed to fetch samples: ${samplesError.message}`);
//         const tumorSamples = samplesData
//           .filter((s) => s.sample_type?.toLowerCase() === "tumor")
//           .map((s) => s.sample_barcode);
//         const normalSamples = samplesData
//           .filter((s) => s.sample_type?.toLowerCase() === "normal")
//           .map((s) => s.sample_barcode);
//         if (isMounted) {
//           setTotalTumorSamples(tumorSamples.length);
//           setTotalNormalSamples(normalSamples.length);
//         }

//         const cancerParam = params.siteAnalysisType === "cancer-specific" ? params.sites[0] : params.sites.join(",");

//         const queryParams = new URLSearchParams({
//           cancer: cancerParam,
//           method: normalizationMethod,
//           top_n: params.topN.toString(),
//           analysis_type: params.analysisType,
//           ...(params.genes.length > 0 && params.analysisType === "ORA" && { genes: params.genes.join(",") }),
//         });
//         const response = await fetch(`http://localhost:5001/api/pathway-analysis?${queryParams}`);
//         if (!response.ok) {
//           const errorText = await response.text();
//           throw new Error(`Failed to fetch pathway analysis data: ${errorText}`);
//         }
//         const apiData = await response.json();
//         console.log("API Response:", apiData);

//         let geneToEnsemblMap = new Map<string, string>();
//         let allGenesToProcess: string[] = [];
//         const genes = params.analysisType === "ORA" && params.genes.length > 0 ? params.genes : apiData.top_genes;
//         allGenesToProcess = [...new Set([...allGenesToProcess, ...genes])];
//         if (allGenesToProcess.length > 0) {
//           const { data: geneData, error: geneError } = await supabase
//             .from("genes")
//             .select("id, ensembl_id, gene_symbol")
//             .in("gene_symbol", allGenesToProcess);
//           if (geneError) throw new Error(`Failed to fetch genes: ${geneError.message}`);
//           geneToEnsemblMap = new Map(geneData.map((g) => [g.gene_symbol, g.ensembl_id]));
//         }

//         const processedGeneStats: GeneStats[] = genes.map((gene: string) => {
//           const stats = apiData.gene_stats[gene] || {};
//           return {
//             gene,
//             ensembl_id: geneToEnsemblMap.get(gene) || "N/A",
//             metrics: stats,
//           };
//         });

//         const newResults: ResultsData = {
//           enrichment: apiData.enrichment || [],
//           top_genes: genes,
//           gene_stats: processedGeneStats,
//           heatmap_data: apiData.heatmap_data || {},
//           noise_metrics: apiData.noise_metrics || {},
//           warning: apiData.warning || null,
//         };
//         const cacheKey = generateCacheKey({
//           sites: params.sites,
//           cancerTypes: params.cancerTypes,
//           genes: params.genes,
//           method: normalizationMethod,
//           topN: params.topN,
//           analysisType: params.analysisType,
//           siteAnalysisType: params.siteAnalysisType,
//         });
//         setCachedData(cacheKey, newResults);
//         if (isMounted) {
//           setCurrentResults(newResults);
//           setIsLoading(false);
//           setError(null);
//         }
//       } catch (error: any) {
//         console.error("Error fetching data:", error);
//         if (isMounted) {
//           setError(error.message || "An error occurred while fetching data.");
//           setCurrentResults({
//             enrichment: [],
//             top_genes: [],
//             gene_stats: [],
//             heatmap_data: {},
//             noise_metrics: {},
//             warning: null,
//           });
//           setIsLoading(false);
//         }
//       }
//     };
//     fetchData();
//     return () => {
//       isMounted = false;
//     };
//   }, [params.sites, params.cancerTypes, params.genes, params.topN, params.analysisType, params.siteAnalysisType, getCachedData, setCachedData, generateCacheKey]);

//   const downloadData = useCallback(
//     (type: "enrichment" | "mean_expression" | "noise_metrics") => {
//       let data: any[] = [];
//       let headers: string[] = [];
//       let filename = `pathway_analysis_${params.sites.join("_")}_${params.siteAnalysisType}_${params.analysisType}_${normalizationMethod}_${Date.now()}`;
//       if (type === "enrichment") {
//         data = currentResults.enrichment;
//         headers = ["Term", "P-value", "Adjusted P-value", "Combined Score", "Genes", "GeneSet"];
//         filename = `enrichment_${filename}.csv`;
//         const rows = data.map((row) =>
//           [
//             row.Term,
//             row["P-value"],
//             row["Adjusted P-value"],
//             row["Combined Score"],
//             row.Genes.join(", "),
//             row.GeneSet || "",
//           ].join(",")
//         );
//         const content = [headers.join(","), ...rows].join("\n");
//         const blob = new Blob([content], { type: "text/csv" });
//         const url = URL.createObjectURL(blob);
//         const a = document.createElement("a");
//         a.href = url;
//         a.download = filename;
//         a.click();
//         URL.revokeObjectURL(url);
//       } else if (type === "mean_expression") {
//         data = currentResults.gene_stats;
//         headers = ["Gene", "Ensembl ID", ...params.sites.flatMap((site) => [`${site} Normal`, `${site} Tumor`])];
//         filename = `mean_expression_${filename}.csv`;
//         const rows = data.map((row) => {
//           const metrics = params.sites.map((site) => {
//             const lowerSite = site.toLowerCase();
//             const metric = row.metrics[lowerSite] || {};
//             return [
//               metric.mean_normal?.toFixed(2) || "0.00",
//               metric.mean_tumor?.toFixed(2) || "0.00",
//             ];
//           }).flat();
//           return [row.gene, row.ensembl_id, ...metrics].join(",");
//         });
//         const content = [headers.join(","), ...rows].join("\n");
//         const blob = new Blob([content], { type: "text/csv" });
//         const url = URL.createObjectURL(blob);
//         const a = document.createElement("a");
//         a.href = url;
//         a.download = filename;
//         a.click();
//         URL.revokeObjectURL(url);
//       } else if (type === "noise_metrics") {
//         data = currentResults.gene_stats;
//         headers = ["Gene", "Ensembl ID", ...params.sites.flatMap((site) => [`${site} Normal`, `${site} Tumor`, `${site} Log2FC`])];
//         filename = `noise_metrics_${filename}.csv`;
//         const rows = data.map((row) => {
//           const metrics = params.sites.map((site) => {
//             const lowerSite = site.toLowerCase();
//             const metric = row.metrics[lowerSite] || {};
//             return [
//               metric.cv_normal?.toFixed(2) || "0.00",
//               metric.cv_tumor?.toFixed(2) || "0.00",
//               metric.logfc?.toFixed(2) || "0.00",
//             ];
//           }).flat();
//           return [row.gene, row.ensembl_id, ...metrics].join(",");
//         });
//         const content = [headers.join(","), ...rows].join("\n");
//         const blob = new Blob([content], { type: "text/csv" });
//         const url = URL.createObjectURL(blob);
//         const a = document.createElement("a");
//         a.href = url;
//         a.download = filename;
//         a.click();
//         URL.revokeObjectURL(url);
//       }
//     },
//     [currentResults, params.sites, params.cancerTypes, params.analysisType, params.siteAnalysisType, normalizationMethod]
//   );

//   const getZValues = useCallback((dataKey: "mean" | "cv" | "logfc") => {
//     const zValues = currentResults.gene_stats.map((geneStat) => {
//       const gene = geneStat.gene;
//       if (dataKey === "mean") {
//         return params.sites.flatMap((site) => {
//           const lowerSite = site.toLowerCase();
//           return [
//             geneStat.metrics[lowerSite]?.mean_normal || 0,
//             geneStat.metrics[lowerSite]?.mean_tumor || 0,
//           ];
//         });
//       } else if (dataKey === "cv") {
//         return params.sites.flatMap((site) => {
//           const lowerSite = site.toLowerCase();
//           return [
//             geneStat.metrics[lowerSite]?.cv_normal || 0,
//             geneStat.metrics[lowerSite]?.cv_tumor || 0,
//           ];
//         });
//       } else {
//         return params.sites.map((site) => {
//           const lowerSite = site.toLowerCase();
//           return geneStat.metrics[lowerSite]?.logfc || 0;
//         });
//       }
//     });
//     console.log(`All zValues (${dataKey}):`, zValues);
//     return zValues;
//   }, [currentResults.gene_stats, params.sites]);

//   const toggleOpen = () => {
//     setIsOpen(!isOpen);
//   };

//   const toggleGroup = (group: string) => {
//     setSelectedGroups((prev) =>
//       prev.includes(group) ? prev.filter((g) => g !== group) : [...prev, group]
//     );
//   };

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-yellow-50 flex flex-col">
//       <Header />
//       <main className="flex-grow">
//         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
//           <div className="grid grid-cols-[320px_1fr] gap-6">
//             <FilterPanel
//               normalizationMethod={normalizationMethod}
//               setNormalizationMethod={(value) => updateFilters({ normalizationMethod: value })}
//             />
//             <div className="flex-1">
//               {isLoading ? (
//                 <LoadingSpinner message="Loading pathway results..." />
//               ) : currentResults.gene_stats.length === 0 ? (
//                 <LoadingSpinner message="Loading pathway results..." />
//               ) : (
//                 <>
//                   {currentResults.warning && (
//                     <Card className="shadow-lg p-6 mb-6 text-center text-yellow-700 bg-yellow-50">
//                       <p className="text-lg">Warning: {currentResults.warning}</p>
//                     </Card>
//                   )}
//                   <Link
//                     to="/pathway-analysis"
//                     className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-6 transition-colors"
//                   >
//                     <ArrowLeft className="h-4 w-4 mr-2" />
//                     Back to Pathway Analysis
//                   </Link>
//                   <div className="mb-8">
//                     <h2 className="text-4xl font-bold text-blue-900 mb-2">
//                       Results for {params.siteAnalysisType === "pan-cancer" ? "Pan-Cancer" : "Cancer-Specific"} Analysis ({params.sites.join(", ")})
//                     </h2>
//                     <div className="flex items-center justify-between mb-4">
//                       <p className="text-blue-700 text-lg">
//                         Normalization: <strong>{normalizationMethod.toUpperCase()}</strong>,{" "}
//                         {params.analysisType === "ORA" && params.genes.length > 0
//                           ? `Custom genes (${params.genes.length})`
//                           : `Top ${params.topN} Noisy Genes`}
//                       </p>
//                       <Button
//                         onClick={() => downloadData("enrichment")}
//                         variant="outline"
//                         size="sm"
//                       >
//                         <Download className="h-4 w-4 mr-2" /> Download Enrichment CSV
//                       </Button>
//                     </div>
//                     <div className="mb-4">
//                       <CollapsibleCard title="Sample Counts">
//                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
//                          <Card className="border-0 shadow-lg">
//                            <CardContent className="flex flex-col items-center p-4 text-center">
//                              <Users className="h-6 w-6 text-red-600 mb-2" />
//                              <div className="text-2xl font-bold text-red-600">{totalTumorSamples}</div>
//                              <div className="text-xs text-gray-600">Total Tumor Samples</div>
//                            </CardContent>
//                          </Card>
//                          <Card className="border-0 shadow-lg">
//                            <CardContent className="flex flex-col items-center p-4 text-center">
//                              <Users className="h-6 w-6 text-green-600 mb-2" />
//                              <div className="text-2xl font-bold text-green-600">{totalNormalSamples}</div>
//                              <div className="text-xs text-gray-600">Total Normal Samples</div>
//                            </CardContent>
//                          </Card>
//                        </div>
                       
//                       <SampleCounts
//                         isOpen={isOpen}
//                         toggleOpen={toggleOpen}
//                         siteSampleCounts={siteSampleCounts.length > 0 ? siteSampleCounts : params.sites.map((site) => ({ site, tumor: 0, normal: 0 }))}
//                         selectedSites={params.sites}
//                         selectedGroups={selectedGroups}
//                       />
//                       </CollapsibleCard>
//                     </div>
//                   </div>
//                   {currentResults.enrichment.length === 0 ? (
//                     <Card className="shadow-lg p-6 text-center text-blue-700">
//                       <Activity className="w-10 h-10 mx-auto mb-3" />
//                       <p className="text-lg">No pathway enrichment results found for the selected parameters.</p>
//                     </Card>
//                   ) : (
//                     <>
//                       <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
//                         <div className="lg:col-span-2">
//                           <CollapsibleCard title="Enriched Pathways" className="h-full">
//                             <DataTable
//                               data={currentResults.enrichment}
//                               columns={[
//                                 { key: "Term", header: "Pathway", sortable: true },
//                                 {
//                                   key: "P-value",
//                                   header: "P-value",
//                                   sortable: true,
//                                   render: (value: number) => formatPValue(value),
//                                 },
//                                 {
//                                   key: "Adjusted P-value",
//                                   header: "Adj. P-value",
//                                   sortable: true,
//                                   render: (value: number) => formatPValue(value),
//                                 },
//                               ]}
//                               defaultSortKey={sortBy === "pval" ? "P-value" : "Adjusted P-value"}
//                               defaultSortOrder={sortOrder}
//                               onRowClick={setSelectedPathway}
//                             />
//                           </CollapsibleCard>
//                         </div>
//                         <div>
//                           <CollapsibleCard title="Pathway Details" className="h-full">
//                             {selectedPathway ? (
//                               <div className="space-y-2 p-2">
//                                 <div>
//                                   <h3 className="font-semibold text-blue-700 text-sm">{selectedPathway.Term}</h3>
//                                   <p className="text-xs text-gray-600">Gene Set: {selectedPathway.GeneSet || "N/A"}</p>
//                                 </div>
//                                 <div>
//                                   <h4 className="font-medium text-blue-700 text-xs">Statistics</h4>
//                                   <div className="grid grid-cols-2 gap-1 mt-1 text-xs">
//                                     <div>P-value:</div>
//                                     <div>{selectedPathway["P-value"].toExponential(2)}</div>
//                                     <div>Adj. P-value:</div>
//                                     <div>{selectedPathway["Adjusted P-value"].toExponential(2)}</div>
//                                   </div>
//                                 </div>
//                                 <div>
//                                   <h4 className="font-medium text-blue-700 text-xs">Associated Genes</h4>
//                                   <div className="flex flex-wrap gap-1 mt-1">
//                                     {selectedPathway.Genes.map((gene, idx) => (
//                                       <span
//                                         key={idx}
//                                         className="bg-blue-100 text-blue-800 px-1 py-0.5 rounded text-xs"
//                                       >
//                                         {gene}
//                                       </span>
//                                     ))}
//                                   </div>
//                                 </div>
//                               </div>
//                             ) : (
//                               <div className="text-center text-gray-500 h-full flex items-center justify-center">
//                                 <div>
//                                   <Info className="h-6 w-6 mx-auto mb-1" />
//                                   <p className="text-xs">Select a pathway to view details</p>
//                                 </div>
//                               </div>
//                             )}
//                           </CollapsibleCard>
//                         </div>
//                       </div>
//                       <div className="grid grid-cols-1 gap-4 mb-8">
//                         <CollapsibleCard title="Gene Expression Heatmap">
//                           <PlotlyHeatmap
//                             title="Gene Expression Heatmap"
//                             data={currentResults.gene_stats}
//                             xValues={params.sites.flatMap((site) => [`${site} Normal`, `${site} Tumor`])}
//                             yValues={currentResults.gene_stats.map((d) => d.gene)}
//                             zValues={getZValues("mean")}
//                             zLabel="Mean Expression (TPM)"
//                             chartKey="expression-heatmap"
//                             xLabel="Sample Types"
//                             yLabel="Genes"
//                             colorscale="RdBu"
//                           />
//                         </CollapsibleCard>
//                         <CollapsibleCard title="Gene Noise Heatmap">
//                           <PlotlyHeatmap
//                             title="Gene Noise Heatmap"
//                             data={currentResults.gene_stats}
//                             xValues={params.sites.flatMap((site) => [`${site} Normal`, `${site} Tumor`])}
//                             yValues={currentResults.gene_stats.map((d) => d.gene)}
//                             zValues={getZValues("cv")}
//                             zLabel="Noise (TPM)"
//                             chartKey="cv-heatmap"
//                             xLabel="Sample Types"
//                             yLabel="Genes"
//                             colorscale="Viridis"
//                           />
//                         </CollapsibleCard>
//                         <CollapsibleCard title="Differential Noise Analysis (Log2FC)">
//                           <PlotlyHeatmap
//                             title="Log2 Fold Change Heatmap"
//                             data={currentResults.gene_stats}
//                             xValues={params.sites}
//                             yValues={currentResults.gene_stats.map((d) => d.gene)}
//                             zValues={getZValues("logfc")}
//                             zLabel="Log2FC"
//                             chartKey="logfc-heatmap"
//                             xLabel="Cancer Sites"
//                             yLabel="Genes"
//                             colorscale="RdBu"
//                             // showscale={true}
//                             // colorbarTitle="Log2FC"
//                             // zmin={-3}
//                             // zmax={3}
//                           />
//                         </CollapsibleCard>
//                       </div>
//                       <CollapsibleCard
//                         title="Mean Expression (TPM)"
//                         className="mb-4"
//                         downloadButton={
//                           <Button
//                             onClick={() => downloadData("mean_expression")}
//                             variant="outline"
//                             size="sm"
//                             className="h-6 px-2 text-xs"
//                           >
//                             <Download className="h-4 w-4 mr-2" /> Download CSV
//                           </Button>
//                         }
//                       >
//                         {currentResults.gene_stats.length > 0 ? (
//                           <DataTable
//                             data={currentResults.gene_stats}
//                             columns={[
//                               { key: "gene", header: "Gene", sortable: true },
//                               { key: "ensembl_id", header: "GeneID", sortable: true },
//                               ...params.sites.flatMap((site) => {
//                                 const lowerSite = site.toLowerCase();
//                                 return [
//                                   {
//                                     key: `${site}-mean_normal`,
//                                     header: `${site} Normal`,
//                                     sortable: true,
//                                     render: (_: any, row: any) => {
//                                       const value = row.metrics?.[lowerSite]?.mean_normal;
//                                       return value != null ? value.toFixed(3) : "N/A";
//                                     },
//                                   },
//                                   {
//                                     key: `${site}-mean_tumor`,
//                                     header: `${site} Tumor`,
//                                     sortable: true,
//                                     render: (_: any, row: any) => {
//                                       const value = row.metrics?.[lowerSite]?.mean_tumor;
//                                       return value != null ? value.toFixed(3) : "N/A";
//                                     },
//                                   },
//                                 ];
//                               }),
//                             ]}
//                           />
//                         ) : (
//                           <p className="text-blue-700">No mean expression data available.</p>
//                         )}
//                       </CollapsibleCard>
//                       <CollapsibleCard
//                         title="Pathway Noise Analytics"
//                         className="mb-4 p-2 text-sm"
//                         downloadButton={
//                           <Button
//                             onClick={() => downloadData("noise_metrics")}
//                             variant="outline"
//                             size="sm"
//                             className="h-6 px-2 text-xs"
//                           >
//                             <Download className="h-4 w-4 mr-2" /> Download CSV
//                           </Button>
//                         }
//                       >
//                         {currentResults.gene_stats.length > 0 ? (
//                           <DataTable
//                             data={currentResults.gene_stats}
//                             columns={[
//                               { key: "gene", header: "Gene", sortable: true },
//                               { key: "ensembl_id", header: "GeneID", sortable: true },
//                               ...params.sites.flatMap((site) => {
//                                 const lowerSite = site.toLowerCase();
//                                 return [
//                                   {
//                                     key: `${site}-cv_normal`,
//                                     header: `${site} Normal`,
//                                     sortable: true,
//                                     render: (_: any, row: any) => {
//                                       const value = row.metrics?.[lowerSite]?.cv_normal;
//                                       return value != null ? value.toFixed(3) : "N/A";
//                                     },
//                                   },
//                                   {
//                                     key: `${site}-cv_tumor`,
//                                     header: `${site} Tumor`,
//                                     sortable: true,
//                                     render: (_: any, row: any) => {
//                                       const value = row.metrics?.[lowerSite]?.cv_tumor;
//                                       return value != null ? value.toFixed(3) : "N/A";
//                                     },
//                                   },
//                                   {
//                                     key: `${site}-logfc`,
//                                     header: `${site} Log2FC`,
//                                     sortable: true,
//                                     render: (_: any, row: any) => {
//                                       const value = row.metrics?.[lowerSite]?.logfc;
//                                       return value != null ? value.toFixed(2) : "N/A";
//                                     },
//                                   },
//                                 ];
//                               }),
//                             ]}
//                           />
//                         ) : (
//                           <p className="text-blue-700">No noise metrics data available.</p>
//                         )}
//                       </CollapsibleCard>
//                       {params.sites.map((site) => {
//                         const lowerSite = site.toLowerCase();
//                         const siteLogFCData = currentResults.gene_stats
//                           .filter((geneStat) => {
//                             const logFC = geneStat.metrics[lowerSite]?.logfc || 0;
//                             return Math.abs(logFC) >= 0.7; // Filter genes with |logFC| >= 0.7
//                           })
//                           .map((geneStat) => ({
//                             gene: geneStat.gene,
//                             logfc: geneStat.metrics[lowerSite]?.logfc || 0,
//                           }))
//                           .sort((a, b) => b.logfc - a.logfc); // Sort by logFC descending
                        
//                         return siteLogFCData.length > 0 ? (
//                           <CollapsibleCard
//                             key={site}
//                             title={`${site} Differential Noise Analysis (Log2FC >= 0.7)`}
//                             className="mb-4"
//                           >
//                             <DataTable
//                               data={siteLogFCData}
//                               columns={[
//                                 { key: "gene", header: "Gene", sortable: true },
//                                 {
//                                   key: "logfc",
//                                   header: "logFC",
//                                   sortable: true,
//                                   render: (value: number) => value.toFixed(2),
//                                 },
//                               ]}
//                             />
//                           </CollapsibleCard>
//                         ) : null;
//                       })}
//                     </>
//                   )}
//                 </>
//               )}
//             </div>
//           </div>
//         </div>
//       </main>
//       <Footer />
//     </div>
//   );
// };

// export default PathwayResults;
// import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
// import { useSearchParams, Link } from "react-router-dom";
// import supabase from "@/supabase-client";
// import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
// import { Button } from "@/components/ui/button";
// import { ArrowLeft, Download, Activity, Users, Info } from "lucide-react";
// import { PlotlyHeatmap, PlotlyBarChart } from "@/components/charts/index";
// import Header from "@/components/header";
// import Footer from "@/components/footer";
// import { useCache } from "@/hooks/use-cache";
// import { LoadingSpinner } from "@/components/ui/loadingSpinner";
// import FilterPanel from "@/components/FilterPanel";
// import { DataTable } from "@/components/ui/data-table";
// import CollapsibleCard from "@/components/ui/collapsible-card";
// import SampleCounts from "@/components/SampleCounts";

// // Updated TypeScript Interfaces
// export interface GeneStats {
//   gene: string;
//   ensembl_id: string;
//   metrics: {
//     [cancer: string]: {
//       cv_normal: number;
//       cv_tumor: number;
//       logfc: number;
//       mean_normal: number;
//       mean_tumor: number;
//     };
//   };
// }

// export interface Enrichment {
//   Term: string;
//   "P-value": number;
//   "Adjusted P-value": number;
//   "Combined Score": number;
//   Genes: string[];
//   GeneSet?: string;
// }

// export interface HeatmapData {
//   [gene: string]: {
//     [key: string]: number; // e.g., "colon Tumor", "colon Normal"
//   };
// }

// export interface NormalizationResults {
//   enrichment: Enrichment[];
//   top_genes: string[];
//   gene_stats: GeneStats[];
//   heatmap_data: HeatmapData;
//   noise_metrics: { [key: string]: any };
//   warning?: string | null;
// }

// export interface ResultsData {
//   [method: string]: NormalizationResults; // tpm, fpkm, fpkm_uq
// }

// const PathwayResults = () => {
//   const [searchParams] = useSearchParams();
//   const params = useMemo(
//     () => ({
//       sites: searchParams.get("sites")?.split(",").filter(Boolean) || [],
//       cancerTypes: searchParams.get("cancerTypes")?.split(",").filter(Boolean) || [],
//       genes: searchParams.get("genes")?.split(",").filter(Boolean) || [],
//       topN: parseInt(searchParams.get("top_n") || "15", 10),
//       analysisType: searchParams.get("analysisType") || "ORA",
//       siteAnalysisType: searchParams.get("siteAnalysisType") || "pan-cancer",
//     }),
//     [searchParams]
//   );

//   const [normalizationMethod, setNormalizationMethod] = useState("tpm");
//   const [allResults, setAllResults] = useState<ResultsData>({});
//   const [isLoading, setIsLoading] = useState(false);
//   const [error, setError] = useState<string | null>(null);
//   const [siteSampleCounts, setSiteSampleCounts] = useState<{ site: string; tumor: number; normal: number }[]>([]);
//   const [isOpen, setIsOpen] = useState(false);
//   const [selectedGroups, setSelectedGroups] = useState<string[]>(["normal", "tumor"]);
//   const [customGeneInput, setCustomGeneInput] = useState("");
//   const [selectedPathway, setSelectedPathway] = useState<Enrichment | null>(null);
//   const [showGeneInput, setShowGeneInput] = useState(params.analysisType === "ORA");
//   const [sortBy, setSortBy] = useState<"pval" | "adjPval">("pval");
//   const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
//   const filterTimeoutRef = useRef<NodeJS.Timeout | null>(null);
//   const { getCachedData, setCachedData, generateCacheKey } = useCache<ResultsData>();
//   const normalizationMethods = ["tpm", "fpkm", "fpkm_uq"];
//   const [totalTumorSamples, setTotalTumorSamples] = useState(0);
//   const [totalNormalSamples, setTotalNormalSamples] = useState(0);

//   // Get current results for the selected normalization method
//   const currentResults = useMemo(() => {
//     return allResults[normalizationMethod] || {
//       enrichment: [],
//       top_genes: [],
//       gene_stats: [],
//       heatmap_data: {},
//       noise_metrics: {},
//       warning: null,
//     };
//   }, [allResults, normalizationMethod]);

//   const logFCColors = useMemo(() => {
//     return currentResults.gene_stats.map((geneStat) => {
//       const logFCs = Object.values(geneStat.metrics).map((m) => m.logfc || 0);
//       const avgLogFC = logFCs.length > 0 ? logFCs.reduce((sum, val) => sum + val, 0) / logFCs.length : 0;
//       return avgLogFC < 0 ? "#ef4444" : "#3b82f6";
//     });
//   }, [currentResults.gene_stats]);

//   const updateFilters = useCallback(
//     (newFilters: { normalizationMethod?: string }) => {
//       if (filterTimeoutRef.current) {
//         clearTimeout(filterTimeoutRef.current);
//       }
//       filterTimeoutRef.current = setTimeout(() => {
//         if (newFilters.normalizationMethod && normalizationMethods.includes(newFilters.normalizationMethod)) {
//           setNormalizationMethod(newFilters.normalizationMethod);
//         }
//       }, 300);
//     },
//     [normalizationMethods]
//   );

//   const formatPValue = (pValue: number) => {
//     if (pValue <= 0.001) return "****";
//     if (pValue <= 0.01) return "***";
//     if (pValue <= 0.05) return "**";
//     return pValue.toExponential(2);
//   };

//   const handleGeneInput = (e: React.ChangeEvent<HTMLInputElement>) => {
//     setCustomGeneInput(e.target.value);
//   };

//   const processCustomGenes = () => {
//     return customGeneInput
//       .split(/[\s,|]+/)
//       .map((gene) => gene.trim())
//       .filter((gene) => gene.length > 0);
//   };

//   const submitCustomGenes = () => {
//     const genes = processCustomGenes();
//     if (genes.length > 0) {
//       localStorage.clear();
//       window.location.href = `/pathway-results?sites=${params.sites.join(
//         ","
//       )}&cancerTypes=${params.cancerTypes.join(
//         ","
//       )}&genes=${genes.join(",")}&top_n=${params.topN}&analysisType=ORA&siteAnalysisType=${params.siteAnalysisType}`;
//     }
//   };

//   const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
//     const file = e.target.files?.[0];
//     if (!file) return;
//     const reader = new FileReader();
//     reader.onload = (event) => {
//       const content = event.target?.result as string;
//       const genes = content.split(/[\s,|\n]+/).filter((gene) => gene.trim().length > 0);
//       setCustomGeneInput(genes.join(", "));
//     };
//     reader.readAsText(file);
//   };

//   const fetchSampleCounts = useCallback(async (sites: string[], cancerTypes: string[]) => {
//     try {
//       const { data: siteRows, error: siteRowsErr } = await supabase
//         .from("Sites")
//         .select("id, name")
//         .in("name", sites);
//       if (siteRowsErr) throw new Error(`Failed to fetch cancer sites: ${siteRowsErr.message}`);
//       if (!siteRows?.length) throw new Error(`Cancer sites not found: ${sites.join(", ")}`);
//       const cancerSiteIds = siteRows.map((row) => row.id);

//       const { data: cancerTypeRows, error: cancerTypeErr } =
//         cancerTypes.length > 0
//           ? await supabase
//               .from("cancer_types")
//               .select("id, tcga_code, site_id")
//               .in("tcga_code", cancerTypes)
//               .in("site_id", cancerSiteIds)
//           : await supabase
//               .from("cancer_types")
//               .select("id, tcga_code, site_id")
//               .in("site_id", cancerSiteIds);

//       if (cancerTypeErr) throw new Error(`Failed to fetch cancer types: ${cancerTypeErr.message}`);
//       const cancerTypeIds = cancerTypeRows.map((row) => row.id);

//       const { data: samplesData, error: samplesError } = await supabase
//         .from("samples")
//         .select("id, sample_barcode, sample_type, cancer_type_id")
//         .in("cancer_type_id", cancerTypeIds);

//       if (samplesError) throw new Error(`Failed to fetch samples: ${samplesError.message}`);

//       const siteCounts = sites.map((site) => {
//         const siteId = siteRows.find((s) => s.name === site)?.id;
//         if (!siteId) return { site, tumor: 0, normal: 0 };

//         const siteSamples = samplesData.filter((s) => {
//           const cancerType = cancerTypeRows.find((ct) => ct.id === s.cancer_type_id);
//           return cancerType?.site_id === siteId;
//         });

//         const tumorSamples = siteSamples.filter((s) => s.sample_type?.toLowerCase() === "tumor").length;
//         const normalSamples = siteSamples.filter((s) => s.sample_type?.toLowerCase() === "normal").length;

//         return { site, tumor: tumorSamples, normal: normalSamples };
//       });

//       setSiteSampleCounts(siteCounts);
//       return siteCounts;
//     } catch (error) {
//       console.error("Error fetching sample counts:", error);
//       setError(error.message || "An error occurred while fetching sample counts.");
//       return [];
//     }
//   }, []);

//   useEffect(() => {
//     if (params.sites.length > 0) {
//       fetchSampleCounts(params.sites, params.cancerTypes);
//     }
//   }, [params.sites, params.cancerTypes, fetchSampleCounts]);

//   useEffect(() => {
//     if (!normalizationMethods.includes(normalizationMethod)) {
//       setNormalizationMethod("tpm");
//     }
//   }, [normalizationMethod, normalizationMethods]);

//   useEffect(() => {
//     let isMounted = true;
//     const fetchData = async () => {
//       if (params.sites.length === 0) {
//         if (isMounted) {
//           setError("Please select at least one cancer site.");
//           setIsLoading(false);
//         }
//         return;
//       }
//       setIsLoading(true);
//       setError(null);
//       try {
//         const { data: siteRows, error: siteRowsErr } = await supabase
//           .from("Sites")
//           .select("id, name")
//           .in("name", params.sites);
//         if (siteRowsErr) throw new Error(`Failed to fetch cancer sites: ${siteRowsErr.message}`);
//         if (!siteRows?.length) throw new Error(`Cancer sites not found: ${params.sites.join(", ")}`);
//         const cancerSiteIds = siteRows.map((row) => row.id);

//         const { data: cancerTypeRows, error: cancerTypeErr } =
//           params.cancerTypes.length > 0
//             ? await supabase
//                 .from("cancer_types")
//                 .select("id, tcga_code")
//                 .in("tcga_code", params.cancerTypes)
//             : await supabase
//                 .from("cancer_types")
//                 .select("id, tcga_code, site_id")
//                 .in("site_id", cancerSiteIds);

//         if (cancerTypeErr) throw new Error(`Failed to fetch cancer types: ${cancerTypeErr.message}`);
//         const cancerTypeIds = cancerTypeRows.map((row) => row.id);

//         const { data: samplesData, error: samplesError } = await supabase
//           .from("samples")
//           .select("id, sample_barcode, sample_type, cancer_type_id")
//           .in("cancer_type_id", cancerTypeIds);

//         if (samplesError) throw new Error(`Failed to fetch samples: ${samplesError.message}`);
//         const tumorSamples = samplesData
//           .filter((s) => s.sample_type?.toLowerCase() === "tumor")
//           .map((s) => s.sample_barcode);
//         const normalSamples = samplesData
//           .filter((s) => s.sample_type?.toLowerCase() === "normal")
//           .map((s) => s.sample_barcode);
//         if (isMounted) {
//           setTotalTumorSamples(tumorSamples.length);
//           setTotalNormalSamples(normalSamples.length);
//         }

//         const cancerParam = params.siteAnalysisType === "cancer-specific" ? params.sites[0] : params.sites.join(",");
//         const queryParams = new URLSearchParams({
//           cancer: cancerParam,
//           top_n: params.topN.toString(),
//           analysis_type: params.analysisType,
//           ...(params.genes.length > 0 && params.analysisType === "ORA" && { genes: params.genes.join(",") }),
//         });
//         const response = await fetch(`http://localhost:5001/api/pathway-analysis?${queryParams}`);
//         if (!response.ok) {
//           const errorText = await response.text();
//           throw new Error(`Failed to fetch pathway analysis data: ${errorText}`);
//         }
//         const apiData: ResultsData = await response.json();
//         console.log("API Response:", apiData);

//         let geneToEnsemblMap = new Map<string, string>();
//         let allGenesToProcess: string[] = [];
//         normalizationMethods.forEach((method) => {
//           const genes = params.analysisType === "ORA" && params.genes.length > 0 ? params.genes : apiData[method]?.top_genes || [];
//           allGenesToProcess = [...new Set([...allGenesToProcess, ...genes])];
//         });

//         if (allGenesToProcess.length > 0) {
//           const { data: geneData, error: geneError } = await supabase
//             .from("genes")
//             .select("id, ensembl_id, gene_symbol")
//             .in("gene_symbol", allGenesToProcess);
//           if (geneError) throw new Error(`Failed to fetch genes: ${geneError.message}`);
//           geneToEnsemblMap = new Map(geneData.map((g) => [g.gene_symbol, g.ensembl_id]));
//         }

//         // Process gene_stats for each normalization method
//         const processedResults: ResultsData = {};
//         normalizationMethods.forEach((method) => {
//           const methodData = apiData[method] || {
//             enrichment: [],
//             top_genes: [],
//             gene_stats: [],
//             heatmap_data: {},
//             noise_metrics: {},
//             warning: `No data available for ${method} normalization`,
//           };
//           const genes = params.analysisType === "ORA" && params.genes.length > 0 ? params.genes : methodData.top_genes || [];
//           const processedGeneStats: GeneStats[] = genes.map((gene: string) => {
//             const stats = methodData.gene_stats[gene] || {};
//             return {
//               gene,
//               ensembl_id: geneToEnsemblMap.get(gene) || "N/A",
//               metrics: stats,
//             };
//           });
//           processedResults[method] = {
//             enrichment: methodData.enrichment || [],
//             top_genes: genes,
//             gene_stats: processedGeneStats,
//             heatmap_data: methodData.heatmap_data || {},
//             noise_metrics: methodData.noise_metrics || {},
//             warning: methodData.warning || null,
//           };
//         });

//         const cacheKey = generateCacheKey({
//           sites: params.sites,
//           cancerTypes: params.cancerTypes,
//           genes: params.genes,
//           topN: params.topN,
//           analysisType: params.analysisType,
//           siteAnalysisType: params.siteAnalysisType,
//         });
//         setCachedData(cacheKey, processedResults);
//         if (isMounted) {
//           setAllResults(processedResults);
//           setIsLoading(false);
//           setError(null);
//         }
//       } catch (error: any) {
//         console.error("Error fetching data:", error);
//         if (isMounted) {
//           setError(error.message || "An error occurred while fetching data.");
//           setAllResults({});
//           setIsLoading(false);
//         }
//       }
//     };

//     // Check cache first
//     const cacheKey = generateCacheKey({
//       sites: params.sites,
//       cancerTypes: params.cancerTypes,
//       genes: params.genes,
//       topN: params.topN,
//       analysisType: params.analysisType,
//       siteAnalysisType: params.siteAnalysisType,
//     });
//     const cachedResults = getCachedData(cacheKey);
//     if (cachedResults) {
//       setAllResults(cachedResults);
//     } else {
//       fetchData();
//     }

//     return () => {
//       isMounted = false;
//     };
//   }, [params.sites, params.cancerTypes, params.genes, params.topN, params.analysisType, params.siteAnalysisType, getCachedData, setCachedData, generateCacheKey]);

//   const downloadData = useCallback(
//     (type: "enrichment" | "mean_expression" | "noise_metrics") => {
//       let data: any[] = [];
//       let headers: string[] = [];
//       let filename = `pathway_analysis_${params.sites.join("_")}_${params.siteAnalysisType}_${params.analysisType}_${normalizationMethod}_${Date.now()}`;
//       if (type === "enrichment") {
//         data = currentResults.enrichment;
//         headers = ["Term", "P-value", "Adjusted P-value", "Combined Score", "Genes", "GeneSet"];
//         filename = `enrichment_${filename}.csv`;
//         const rows = data.map((row) =>
//           [
//             row.Term,
//             row["P-value"],
//             row["Adjusted P-value"],
//             row["Combined Score"],
//             row.Genes.join(", "),
//             row.GeneSet || "",
//           ].join(",")
//         );
//         const content = [headers.join(","), ...rows].join("\n");
//         const blob = new Blob([content], { type: "text/csv" });
//         const url = URL.createObjectURL(blob);
//         const a = document.createElement("a");
//         a.href = url;
//         a.download = filename;
//         a.click();
//         URL.revokeObjectURL(url);
//       } else if (type === "mean_expression") {
//         data = currentResults.gene_stats;
//         headers = ["Gene", "Ensembl ID", ...params.sites.flatMap((site) => [`${site} Normal`, `${site} Tumor`])];
//         filename = `mean_expression_${filename}.csv`;
//         const rows = data.map((row) => {
//           const metrics = params.sites.map((site) => {
//             const lowerSite = site.toLowerCase();
//             const metric = row.metrics[lowerSite] || {};
//             return [
//               metric.mean_normal?.toFixed(2) || "0.00",
//               metric.mean_tumor?.toFixed(2) || "0.00",
//             ];
//           }).flat();
//           return [row.gene, row.ensembl_id, ...metrics].join(",");
//         });
//         const content = [headers.join(","), ...rows].join("\n");
//         const blob = new Blob([content], { type: "text/csv" });
//         const url = URL.createObjectURL(blob);
//         const a = document.createElement("a");
//         a.href = url;
//         a.download = filename;
//         a.click();
//         URL.revokeObjectURL(url);
//       } else if (type === "noise_metrics") {
//         data = currentResults.gene_stats;
//         headers = ["Gene", "Ensembl ID", ...params.sites.flatMap((site) => [`${site} Normal`, `${site} Tumor`, `${site} Log2FC`])];
//         filename = `noise_metrics_${filename}.csv`;
//         const rows = data.map((row) => {
//           const metrics = params.sites.map((site) => {
//             const lowerSite = site.toLowerCase();
//             const metric = row.metrics[lowerSite] || {};
//             return [
//               metric.cv_normal?.toFixed(2) || "0.00",
//               metric.cv_tumor?.toFixed(2) || "0.00",
//               metric.logfc?.toFixed(2) || "0.00",
//             ];
//           }).flat();
//           return [row.gene, row.ensembl_id, ...metrics].join(",");
//         });
//         const content = [headers.join(","), ...rows].join("\n");
//         const blob = new Blob([content], { type: "text/csv" });
//         const url = URL.createObjectURL(blob);
//         const a = document.createElement("a");
//         a.href = url;
//         a.download = filename;
//         a.click();
//         URL.revokeObjectURL(url);
//       }
//     },
//     [currentResults, params.sites, params.siteAnalysisType, params.analysisType, normalizationMethod]
//   );

//   const getZValues = useCallback(
//     (dataKey: "mean" | "cv" | "logfc") => {
//       const zValues = currentResults.gene_stats.map((geneStat) => {
//         const gene = geneStat.gene;
//         if (dataKey === "mean") {
//           return params.sites.flatMap((site) => {
//             const lowerSite = site.toLowerCase();
//             return [
//               geneStat.metrics[lowerSite]?.mean_normal || 0,
//               geneStat.metrics[lowerSite]?.mean_tumor || 0,
//             ];
//           });
//         } else if (dataKey === "cv") {
//           return params.sites.flatMap((site) => {
//             const lowerSite = site.toLowerCase();
//             return [
//               geneStat.metrics[lowerSite]?.cv_normal || 0,
//               geneStat.metrics[lowerSite]?.cv_tumor || 0,
//             ];
//           });
//         } else {
//           return params.sites.map((site) => {
//             const lowerSite = site.toLowerCase();
//             return geneStat.metrics[lowerSite]?.logfc || 0;
//           });
//         }
//       });
//       console.log(`All zValues (${dataKey}):`, zValues);
//       return zValues;
//     },
//     [currentResults.gene_stats, params.sites]
//   );

//   const toggleOpen = () => {
//     setIsOpen(!isOpen);
//   };

//   const toggleGroup = (group: string) => {
//     setSelectedGroups((prev) =>
//       prev.includes(group) ? prev.filter((g) => g !== group) : [...prev, group]
//     );
//   };

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-yellow-50 flex flex-col">
//       <Header />
//       <main className="flex-grow">
//         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
//           <div className="grid grid-cols-[320px_1fr] gap-6">
//             <FilterPanel
//               normalizationMethod={normalizationMethod}
//               setNormalizationMethod={(value) => updateFilters({ normalizationMethod: value })}
//             />
//             <div className="flex-1">
//               {isLoading ? (
//                 <LoadingSpinner message="Loading pathway results..." />
//               ) : currentResults.gene_stats.length === 0 && currentResults.warning ? (
//                 <Card className="shadow-lg p-6 text-center text-yellow-700 bg-yellow-50">
//                   <p className="text-lg">Warning: {currentResults.warning}</p>
//                 </Card>
//               ) : (
//                 <>
//                   {currentResults.warning && (
//                     <Card className="shadow-lg p-6 mb-6 text-center text-yellow-700 bg-yellow-50">
//                       <p className="text-lg">Warning: {currentResults.warning}</p>
//                     </Card>
//                   )}
//                   <Link
//                     to="/pathway-analysis"
//                     className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-6 transition-colors"
//                   >
//                     <ArrowLeft className="h-4 w-4 mr-2" />
//                     Back to Pathway Analysis
//                   </Link>
//                   <div className="mb-8">
//                     <h2 className="text-4xl font-bold text-blue-900 mb-2">
//                       Results for {params.siteAnalysisType === "pan-cancer" ? "Pan-Cancer" : "Cancer-Specific"} Analysis ({params.sites.join(", ")})
//                     </h2>
//                     <div className="flex items-center justify-between mb-4">
//                       <p className="text-blue-700 text-lg">
//                         Normalization: <strong>{normalizationMethod.toUpperCase()}</strong>,{" "}
//                         {params.analysisType === "ORA" && params.genes.length > 0
//                           ? `Custom genes (${params.genes.length})`
//                           : `Top ${params.topN} Noisy Genes`}
//                       </p>
//                       <Button
//                         onClick={() => downloadData("enrichment")}
//                         variant="outline"
//                         size="sm"
//                       >
//                         <Download className="h-4 w-4 mr-2" /> Download Enrichment CSV
//                       </Button>
//                     </div>
//                     {/* <div className="mb-4">
//                       <CollapsibleCard title="Sample Counts">
//                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
//                           <Card className="border-0 shadow-lg">
//                             <CardContent className="flex flex-col items-center p-4 text-center">
//                               <Users className="h-6 w-6 text-red-600 mb-2" />
//                               <div className="text-2xl font-bold text-red-600">{totalTumorSamples}</div>
//                               <div className="text-xs text-gray-600">Total Tumor Samples</div>
//                             </CardContent>
//                           </Card>
//                           <Card className="border-0 shadow-lg">
//                             <CardContent className="flex flex-col items-center p-4 text-center">
//                               <Users className="h-6 w-6 text-green-600 mb-2" />
//                               <div className="text-2xl font-bold text-green-600">{totalNormalSamples}</div>
//                               <div className="text-xs text-gray-600">Total Normal Samples</div>
//                             </CardContent>
//                           </Card>
//                         </div> */}
//                         <SampleCounts
//                           isOpen={isOpen}
//                           toggleOpen={toggleOpen}
//                           siteSampleCounts={siteSampleCounts.length > 0 ? siteSampleCounts : params.sites.map((site) => ({ site, tumor: 0, normal: 0 }))}
//                           selectedSites={params.sites}
//                           selectedGroups={selectedGroups}
//                         />
//                       {/* </CollapsibleCard> */}
//                     {/* </div> */}
//                   </div>
//                   {currentResults.enrichment.length === 0 ? (
//                     <Card className="shadow-lg p-6 text-center text-blue-700">
//                       <Activity className="w-10 h-10 mx-auto mb-3" />
//                       <p className="text-lg">No pathway enrichment results found for the selected parameters.</p>
//                     </Card>
//                   ) : (
//                     <>
//                       <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
//                         <div className="lg:col-span-2">
//                           <CollapsibleCard title="Enriched Pathways" className="h-full">
//                             <DataTable
//                               data={currentResults.enrichment}
//                               columns={[
//                                 { key: "Term", header: "Pathway", sortable: true },
//                                 {
//                                   key: "P-value",
//                                   header: "P-value",
//                                   sortable: true,
//                                   render: (value: number) => formatPValue(value),
//                                 },
//                                 {
//                                   key: "Adjusted P-value",
//                                   header: "Adj. P-value",
//                                   sortable: true,
//                                   render: (value: number) => formatPValue(value),
//                                 },
//                               ]}
//                               defaultSortKey={sortBy === "pval" ? "P-value" : "Adjusted P-value"}
//                               defaultSortOrder={sortOrder}
//                               onRowClick={setSelectedPathway}
//                             />
//                           </CollapsibleCard>
//                         </div>
//                         <div>
//                           <CollapsibleCard title="Pathway Details" className="h-full">
//                             {selectedPathway ? (
//                               <div className="space-y-2 p-2">
//                                 <div>
//                                   <h3 className="font-semibold text-blue-700 text-sm">{selectedPathway.Term}</h3>
//                                   <p className="text-xs text-gray-600">Gene Set: {selectedPathway.GeneSet || "N/A"}</p>
//                                 </div>
//                                 <div>
//                                   <h4 className="font-medium text-blue-700 text-xs">Statistics</h4>
//                                   <div className="grid grid-cols-2 gap-1 mt-1 text-xs">
//                                     <div>P-value:</div>
//                                     <div>{selectedPathway["P-value"].toExponential(2)}</div>
//                                     <div>Adj. P-value:</div>
//                                     <div>{selectedPathway["Adjusted P-value"].toExponential(2)}</div>
//                                   </div>
//                                 </div>
//                                 <div>
//                                   <h4 className="font-medium text-blue-700 text-xs">Associated Genes</h4>
//                                   <div className="flex flex-wrap gap-1 mt-1">
//                                     {selectedPathway.Genes.map((gene, idx) => (
//                                       <span
//                                         key={idx}
//                                         className="bg-blue-100 text-blue-800 px-1 py-0.5 rounded text-xs"
//                                       >
//                                         {gene}
//                                       </span>
//                                     ))}
//                                   </div>
//                                 </div>
//                               </div>
//                             ) : (
//                               <div className="text-center text-gray-500 h-full flex items-center justify-center">
//                                 <div>
//                                   <Info className="h-6 w-6 mx-auto mb-1" />
//                                   <p className="text-xs">Select a pathway to view details</p>
//                                 </div>
//                               </div>
//                             )}
//                           </CollapsibleCard>
//                         </div>
//                       </div>
//                       <div className="grid grid-cols-1 gap-4 mb-8">
//                         <CollapsibleCard title="Gene Expression Heatmap">
//                           <PlotlyHeatmap
//                             title="Gene Expression Heatmap"
//                             data={currentResults.gene_stats}
//                             xValues={params.sites.flatMap((site) => [`${site} Normal`, `${site} Tumor`])}
//                             yValues={currentResults.gene_stats.map((d) => d.gene)}
//                             zValues={getZValues("mean")}
//                             zLabel={`Mean Expression (${normalizationMethod.toUpperCase()})`}
//                             chartKey="expression-heatmap"
//                             xLabel="Sample Types"
//                             yLabel="Genes"
//                             colorscale="RdBu"
//                           />
//                         </CollapsibleCard>
//                         <CollapsibleCard title="Gene Noise Heatmap">
//                           <PlotlyHeatmap
//                             title="Gene Noise Heatmap"
//                             data={currentResults.gene_stats}
//                             xValues={params.sites.flatMap((site) => [`${site} Normal`, `${site} Tumor`])}
//                             yValues={currentResults.gene_stats.map((d) => d.gene)}
//                             zValues={getZValues("cv")}
//                             zLabel={`Noise (${normalizationMethod.toUpperCase()})`}
//                             chartKey="cv-heatmap"
//                             xLabel="Sample Types"
//                             yLabel="Genes"
//                             colorscale="Viridis"
//                           />
//                         </CollapsibleCard>
//                         <CollapsibleCard title="Differential Noise Analysis (Log2FC)">
//                           <PlotlyHeatmap
//                             title="Log2 Fold Change Heatmap"
//                             data={currentResults.gene_stats}
//                             xValues={params.sites}
//                             yValues={currentResults.gene_stats.map((d) => d.gene)}
//                             zValues={getZValues("logfc")}
//                             zLabel="Log2FC"
//                             chartKey="logfc-heatmap"
//                             xLabel="Cancer Sites"
//                             yLabel="Genes"
//                             colorscale="RdBu"
//                           />
//                         </CollapsibleCard>
//                       </div>
//                       <CollapsibleCard
//                         title={`Mean Expression (${normalizationMethod.toUpperCase()})`}
//                         className="mb-4"
//                         downloadButton={
//                           <Button
//                             onClick={() => downloadData("mean_expression")}
//                             variant="outline"
//                             size="sm"
//                             className="h-6 px-2 text-xs"
//                           >
//                             <Download className="h-4 w-4 mr-2" /> Download CSV
//                           </Button>
//                         }
//                       >
//                         {currentResults.gene_stats.length > 0 ? (
//                           <DataTable
//                             data={currentResults.gene_stats}
//                             columns={[
//                               { key: "gene", header: "Gene", sortable: true },
//                               { key: "ensembl_id", header: "GeneID", sortable: true },
//                               ...params.sites.flatMap((site) => {
//                                 const lowerSite = site.toLowerCase();
//                                 return [
//                                   {
//                                     key: `${site}-mean_normal`,
//                                     header: `${site} Normal`,
//                                     sortable: true,
//                                     render: (_: any, row: any) => {
//                                       const value = row.metrics?.[lowerSite]?.mean_normal;
//                                       return value != null ? value.toFixed(3) : "N/A";
//                                     },
//                                   },
//                                   {
//                                     key: `${site}-mean_tumor`,
//                                     header: `${site} Tumor`,
//                                     sortable: true,
//                                     render: (_: any, row: any) => {
//                                       const value = row.metrics?.[lowerSite]?.mean_tumor;
//                                       return value != null ? value.toFixed(3) : "N/A";
//                                     },
//                                   },
//                                 ];
//                               }),
//                             ]}
//                           />
//                         ) : (
//                           <p className="text-blue-700">No mean expression data available.</p>
//                         )}
//                       </CollapsibleCard>
//                       <CollapsibleCard
//                         title="Gene Noise Analytics"
//                         className="mb-4 p-2 text-sm"
//                         downloadButton={
//                           <Button
//                             onClick={() => downloadData("noise_metrics")}
//                             variant="outline"
//                             size="sm"
//                             className="h-6 px-2 text-xs"
//                           >
//                             <Download className="h-4 w-4 mr-2" /> Download CSV
//                           </Button>
//                         }
//                       >
//                         {currentResults.gene_stats.length > 0 ? (
//                           <DataTable
//                             data={currentResults.gene_stats}
//                             columns={[
//                               { key: "gene", header: "Gene", sortable: true },
//                               { key: "ensembl_id", header: "GeneID", sortable: true },
//                               ...params.sites.flatMap((site) => {
//                                 const lowerSite = site.toLowerCase();
//                                 return [
//                                   {
//                                     key: `${site}-cv_normal`,
//                                     header: `${site} Normal`,
//                                     sortable: true,
//                                     render: (_: any, row: any) => {
//                                       const value = row.metrics?.[lowerSite]?.cv_normal;
//                                       return value != null ? value.toFixed(3) : "N/A";
//                                     },
//                                   },
//                                   {
//                                     key: `${site}-cv_tumor`,
//                                     header: `${site} Tumor`,
//                                     sortable: true,
//                                     render: (_: any, row: any) => {
//                                       const value = row.metrics?.[lowerSite]?.cv_tumor;
//                                       return value != null ? value.toFixed(3) : "N/A";
//                                     },
//                                   },
//                                   // {
//                                   //   key: `${site}-logfc`,
//                                   //   header: `${site} Log2FC`,
//                                   //   sortable: true,
//                                   //   render: (_: any, row: any) => {
//                                   //     const value = row.metrics?.[lowerSite]?.logfc;
//                                   //     return value != null ? value.toFixed(2) : "N/A";
//                                   //   },
//                                   // },
//                                 ];
//                               }),
//                             ]}
//                           />
//                         ) : (
//                           <p className="text-blue-700">No noise metrics data available.</p>
//                         )}
//                       </CollapsibleCard>
//                       <CollapsibleCard
//                         title="Differential Noise (LogFC - Tumor / Normal)"
//                         className="mb-4 p-2 text-sm"
//                         downloadButton={
//                           <Button
//                             onClick={() => downloadData("noise_metrics")}
//                             variant="outline"
//                             size="sm"
//                             className="h-6 px-2 text-xs"
//                           >
//                             <Download className="h-4 w-4 mr-2" /> Download CSV
//                           </Button>
//                         }
//                       >
//                         {currentResults.gene_stats.length > 0 ? (
//                           <DataTable
//                             data={currentResults.gene_stats}
//                             columns={[
//                               { key: "gene", header: "Gene", sortable: true },
//                               { key: "ensembl_id", header: "GeneID", sortable: true },
//                               ...params.sites.flatMap((site) => {
//                                 const lowerSite = site.toLowerCase();
//                                 return [
//                                   // {
//                                   //   key: `${site}-cv_normal`,
//                                   //   header: `${site} Normal`,
//                                   //   sortable: true,
//                                   //   render: (_: any, row: any) => {
//                                   //     const value = row.metrics?.[lowerSite]?.cv_normal;
//                                   //     return value != null ? value.toFixed(3) : "N/A";
//                                   //   },
//                                   // },
//                                   // {
//                                   //   key: `${site}-cv_tumor`,
//                                   //   header: `${site} Tumor`,
//                                   //   sortable: true,
//                                   //   render: (_: any, row: any) => {
//                                   //     const value = row.metrics?.[lowerSite]?.cv_tumor;
//                                   //     return value != null ? value.toFixed(3) : "N/A";
//                                   //   },
//                                   // },
//                                   {
//                                     key: `${site}-logfc`,
//                                     header: `${site}`,
//                                     sortable: true,
//                                     render: (_: any, row: any) => {
//                                       const value = row.metrics?.[lowerSite]?.logfc;
//                                       return value != null ? value.toFixed(2) : "N/A";
//                                     },
//                                   },
//                                 ];
//                               }),
//                             ]}
//                           />
//                         ) : (
//                           <p className="text-blue-700">No noise metrics data available.</p>
//                         )}
//                       </CollapsibleCard>
//                       {params.sites.map((site) => {
//                         const lowerSite = site.toLowerCase();
//                         const siteLogFCData = currentResults.gene_stats
//                           .filter((geneStat) => {
//                             const logFC = geneStat.metrics[lowerSite]?.logfc || 0;
//                             return Math.abs(logFC) >= 0.7;
//                           })
//                           .map((geneStat) => ({
//                             gene: geneStat.gene,
//                             logfc: geneStat.metrics[lowerSite]?.logfc || 0,
//                           }))
//                           .sort((a, b) => b.logfc - a.logfc);
//                         return siteLogFCData.length > 0 ? (
//                           <CollapsibleCard
//                             key={site}
//                             title={`${site} Differential Noise Analysis (Log2FC >= 0.7)`}
//                             className="mb-4"
//                           >
//                             <DataTable
//                               data={siteLogFCData}
//                               columns={[
//                                 { key: "gene", header: "Gene", sortable: true },
//                                 {
//                                   key: "logfc",
//                                   header: "logFC",
//                                   sortable: true,
//                                   render: (value: number) => value.toFixed(2),
//                                 },
//                               ]}
//                             />
//                           </CollapsibleCard>
//                         ) : null;
//                       })}
//                     </>
//                   )}
//                 </>
//               )}
//             </div>
//           </div>
//         </div>
//       </main>
//       <Footer />
//     </div>
//   );
// };

// export default PathwayResults;
import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useSearchParams, Link } from "react-router-dom";
import supabase from "@/supabase-client";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Download, Activity, Users, Info } from "lucide-react";
import { PlotlyHeatmap, PlotlyBarChart } from "@/components/charts/index";
import Header from "@/components/header";
import Footer from "@/components/footer";
import { useCache } from "@/hooks/use-cache";
import { LoadingSpinner } from "@/components/ui/loadingSpinner";
import FilterPanel from "@/components/FilterPanel";
import { DataTable } from "@/components/ui/data-table";
import CollapsibleCard from "@/components/ui/collapsible-card";
import SampleCounts from "@/components/SampleCounts";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";

// Updated TypeScript Interfaces
export interface GeneStats {
  gene: string;
  ensembl_id: string;
  metrics: {
    [cancer: string]: {
      cv_normal: number;
      cv_tumor: number;
      logfc: number;
      mean_normal: number;
      mean_tumor: number;
    };
  };
}

export interface Enrichment {
  Term: string;
  "P-value": number;
  "Adjusted P-value": number;
  "Combined Score": number;
  Genes: string[];
  GeneSet?: string;
}

export interface HeatmapData {
  [gene: string]: {
    [key: string]: number; // e.g., "colon Tumor", "colon Normal"
  };
}

export interface NormalizationResults {
  enrichment: Enrichment[];
  top_genes: string[];
  gene_stats: GeneStats[];
  heatmap_data: HeatmapData;
  noise_metrics: { [key: string]: any };
  warning?: string | null;
}

export interface ResultsData {
  [method: string]: NormalizationResults; // tpm, fpkm, fpkm_uq
}

const PathwayResults = () => {
  const [searchParams] = useSearchParams();
  const params = useMemo(
    () => ({
      sites: searchParams.get("sites")?.split(",").filter(Boolean) || [],
      cancerTypes: searchParams.get("cancerTypes")?.split(",").filter(Boolean) || [],
      genes: searchParams.get("genes")?.split(",").filter(Boolean) || [],
      topN: parseInt(searchParams.get("top_n") || "15", 10),
      analysisType: searchParams.get("analysisType") || "ORA",
      siteAnalysisType: searchParams.get("siteAnalysisType") || "pan-cancer",
    }),
    [searchParams]
  );

  const [normalizationMethod, setNormalizationMethod] = useState("tpm");
  const [allResults, setAllResults] = useState<ResultsData>({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [siteSampleCounts, setSiteSampleCounts] = useState<{ site: string; tumor: number; normal: number }[]>([]);
  const [isOpen, setIsOpen] = useState(true);
  const [selectedGroups, setSelectedGroups] = useState<string[]>(["normal", "tumor"]);
  const [customGeneInput, setCustomGeneInput] = useState("");
  const [selectedPathway, setSelectedPathway] = useState<Enrichment | null>(null);
  const [showGeneInput, setShowGeneInput] = useState(params.analysisType === "ORA");
  const [sortBy, setSortBy] = useState<"pval" | "adjPval">("pval");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [logFCThreshold, setLogFCThreshold] = useState(0.7); // New state for logFC threshold
  const filterTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { getCachedData, setCachedData, generateCacheKey } = useCache<ResultsData>();
  const normalizationMethods = ["tpm", "fpkm", "fpkm_uq"];
  const [totalTumorSamples, setTotalTumorSamples] = useState(0);
  const [totalNormalSamples, setTotalNormalSamples] = useState(0);

  // Get current results for the selected normalization method
  const currentResults = useMemo(() => {
    return allResults[normalizationMethod] || {
      enrichment: [],
      top_genes: [],
      gene_stats: [],
      heatmap_data: {},
      noise_metrics: {},
      warning: null,
    };
  }, [allResults, normalizationMethod]);

  // Compute most enriched pathway for each cancer site based on logFC threshold
  const enrichedPathwaysBySite = useMemo(() => {
    const results: { site: string; pathway: string; adjPValue: number; genes: string[] }[] = [];
    params.sites.forEach((site) => {
      const lowerSite = site.toLowerCase();
      // Filter genes with |logFC| >= threshold for this site
      const significantGenes = currentResults.gene_stats
        .filter((geneStat) => {
          const logFC = geneStat.metrics[lowerSite]?.logfc || 0;
          return Math.abs(logFC) >= logFCThreshold;
        })
        .map((geneStat) => geneStat.gene);

      // Find pathways containing these significant genes
      const relevantPathways = currentResults.enrichment
        .filter((pathway) => pathway.Genes.some((gene) => significantGenes.includes(gene)))
        .map((pathway) => ({
          ...pathway,
          matchingGenes: pathway.Genes.filter((gene) => significantGenes.includes(gene)),
        }));

      // Select the pathway with the lowest adjusted p-value
      const mostEnriched = relevantPathways.reduce(
        (best, pathway) =>
          !best || pathway["Adjusted P-value"] < best["Adjusted P-value"] ? pathway : best,
        null as (Enrichment & { matchingGenes: string[] }) | null
      );

      if (mostEnriched) {
        results.push({
          site,
          pathway: mostEnriched.Term,
          adjPValue: mostEnriched["Adjusted P-value"],
          genes: mostEnriched.matchingGenes,
        });
      } else {
        results.push({
          site,
          pathway: "None",
          adjPValue: 0,
          genes: [],
        });
      }
    });
    return results;
  }, [currentResults.enrichment, currentResults.gene_stats, params.sites, logFCThreshold]);

  const logFCColors = useMemo(() => {
    return currentResults.gene_stats.map((geneStat) => {
      const logFCs = Object.values(geneStat.metrics).map((m) => m.logfc || 0);
      const avgLogFC = logFCs.length > 0 ? logFCs.reduce((sum, val) => sum + val, 0) / logFCs.length : 0;
      return avgLogFC < 0 ? "#ef4444" : "#3b82f6";
    });
  }, [currentResults.gene_stats]);

  const updateFilters = useCallback(
    (newFilters: { normalizationMethod?: string }) => {
      if (filterTimeoutRef.current) {
        clearTimeout(filterTimeoutRef.current);
      }
      filterTimeoutRef.current = setTimeout(() => {
        if (newFilters.normalizationMethod && normalizationMethods.includes(newFilters.normalizationMethod)) {
          setNormalizationMethod(newFilters.normalizationMethod);
        }
      }, 300);
    },
    [normalizationMethods]
  );

  const formatPValue = (pValue: number) => {
    if (pValue <= 0.001) return "****";
    if (pValue <= 0.01) return "***";
    if (pValue <= 0.05) return "**";
    return pValue.toExponential(2);
  };

  const handleGeneInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCustomGeneInput(e.target.value);
  };

  const processCustomGenes = () => {
    return customGeneInput
      .split(/[\s,|]+/)
      .map((gene) => gene.trim())
      .filter((gene) => gene.length > 0);
  };

  const submitCustomGenes = () => {
    const genes = processCustomGenes();
    if (genes.length > 0) {
      localStorage.clear();
      window.location.href = `/pathway-results?sites=${params.sites.join(
        ","
      )}&cancerTypes=${params.cancerTypes.join(
        ","
      )}&genes=${genes.join(",")}&top_n=${params.topN}&analysisType=ORA&siteAnalysisType=${params.siteAnalysisType}`;
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const genes = content.split(/[\s,|\n]+/).filter((gene) => gene.trim().length > 0);
      setCustomGeneInput(genes.join(", "));
    };
    reader.readAsText(file);
  };

  const fetchSampleCounts = useCallback(async (sites: string[], cancerTypes: string[]) => {
    try {
      const { data: siteRows, error: siteRowsErr } = await supabase
        .from("Sites")
        .select("id, name")
        .in("name", sites);
      if (siteRowsErr) throw new Error(`Failed to fetch cancer sites: ${siteRowsErr.message}`);
      if (!siteRows?.length) throw new Error(`Cancer sites not found: ${sites.join(", ")}`);
      const cancerSiteIds = siteRows.map((row) => row.id);

      const { data: cancerTypeRows, error: cancerTypeErr } =
        cancerTypes.length > 0
          ? await supabase
              .from("cancer_types")
              .select("id, tcga_code, site_id")
              .in("tcga_code", cancerTypes)
              .in("site_id", cancerSiteIds)
          : await supabase
              .from("cancer_types")
              .select("id, tcga_code, site_id")
              .in("site_id", cancerSiteIds);

      if (cancerTypeErr) throw new Error(`Failed to fetch cancer types: ${cancerTypeErr.message}`);
      const cancerTypeIds = cancerTypeRows.map((row) => row.id);

      const { data: samplesData, error: samplesError } = await supabase
        .from("samples")
        .select("id, sample_barcode, sample_type, cancer_type_id")
        .in("cancer_type_id", cancerTypeIds);

      if (samplesError) throw new Error(`Failed to fetch samples: ${samplesError.message}`);

      const siteCounts = sites.map((site) => {
        const siteId = siteRows.find((s) => s.name === site)?.id;
        if (!siteId) return { site, tumor: 0, normal: 0 };

        const siteSamples = samplesData.filter((s) => {
          const cancerType = cancerTypeRows.find((ct) => ct.id === s.cancer_type_id);
          return cancerType?.site_id === siteId;
        });

        const tumorSamples = siteSamples.filter((s) => s.sample_type?.toLowerCase() === "tumor").length;
        const normalSamples = siteSamples.filter((s) => s.sample_type?.toLowerCase() === "normal").length;

        return { site, tumor: tumorSamples, normal: normalSamples };
      });

      setSiteSampleCounts(siteCounts);
      return siteCounts;
    } catch (error) {
      console.error("Error fetching sample counts:", error);
      setError(error.message || "An error occurred while fetching sample counts.");
      return [];
    }
  }, []);

  useEffect(() => {
    if (params.sites.length > 0) {
      fetchSampleCounts(params.sites, params.cancerTypes);
    }
  }, [params.sites, params.cancerTypes, fetchSampleCounts]);

  useEffect(() => {
    if (!normalizationMethods.includes(normalizationMethod)) {
      setNormalizationMethod("tpm");
    }
  }, [normalizationMethod, normalizationMethods]);

  useEffect(() => {
    let isMounted = true;
    const fetchData = async () => {
      if (params.sites.length === 0) {
        if (isMounted) {
          setError("Please select at least one cancer site.");
          setIsLoading(false);
        }
        return;
      }
      setIsLoading(true);
      setError(null);
      try {
        const { data: siteRows, error: siteRowsErr } = await supabase
          .from("Sites")
          .select("id, name")
          .in("name", params.sites);
        if (siteRowsErr) throw new Error(`Failed to fetch cancer sites: ${siteRowsErr.message}`);
        if (!siteRows?.length) throw new Error(`Cancer sites not found: ${params.sites.join(", ")}`);
        const cancerSiteIds = siteRows.map((row) => row.id);

        const { data: cancerTypeRows, error: cancerTypeErr } =
          params.cancerTypes.length > 0
            ? await supabase
                .from("cancer_types")
                .select("id, tcga_code")
                .in("tcga_code", params.cancerTypes)
            : await supabase
                .from("cancer_types")
                .select("id, tcga_code, site_id")
                .in("site_id", cancerSiteIds);

        if (cancerTypeErr) throw new Error(`Failed to fetch cancer types: ${cancerTypeErr.message}`);
        const cancerTypeIds = cancerTypeRows.map((row) => row.id);

        const { data: samplesData, error: samplesError } = await supabase
          .from("samples")
          .select("id, sample_barcode, sample_type, cancer_type_id")
          .in("cancer_type_id", cancerTypeIds);

        if (samplesError) throw new Error(`Failed to fetch samples: ${samplesError.message}`);
        const tumorSamples = samplesData
          .filter((s) => s.sample_type?.toLowerCase() === "tumor")
          .map((s) => s.sample_barcode);
        const normalSamples = samplesData
          .filter((s) => s.sample_type?.toLowerCase() === "normal")
          .map((s) => s.sample_barcode);
        if (isMounted) {
          setTotalTumorSamples(tumorSamples.length);
          setTotalNormalSamples(normalSamples.length);
        }

        const cancerParam = params.siteAnalysisType === "cancer-specific" ? params.sites[0] : params.sites.join(",");
        const queryParams = new URLSearchParams({
          cancer: cancerParam,
          top_n: params.topN.toString(),
          analysis_type: params.analysisType,
          ...(params.genes.length > 0 && params.analysisType === "ORA" && { genes: params.genes.join(",") }),
        });
        const response = await fetch(`http://localhost:5001/api/pathway-analysis?${queryParams}`);
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Failed to fetch pathway analysis data: ${errorText}`);
        }
        const apiData: ResultsData = await response.json();
        console.log("API Response:", apiData);

        let geneToEnsemblMap = new Map<string, string>();
        let allGenesToProcess: string[] = [];
        normalizationMethods.forEach((method) => {
          const genes = params.analysisType === "ORA" && params.genes.length > 0 ? params.genes : apiData[method]?.top_genes || [];
          allGenesToProcess = [...new Set([...allGenesToProcess, ...genes])];
        });

        if (allGenesToProcess.length > 0) {
          const { data: geneData, error: geneError } = await supabase
            .from("genes")
            .select("id, ensembl_id, gene_symbol")
            .in("gene_symbol", allGenesToProcess);
          if (geneError) throw new Error(`Failed to fetch genes: ${geneError.message}`);
          geneToEnsemblMap = new Map(geneData.map((g) => [g.gene_symbol, g.ensembl_id]));
        }

        // Process gene_stats for each normalization method
        const processedResults: ResultsData = {};
        normalizationMethods.forEach((method) => {
          const methodData = apiData[method] || {
            enrichment: [],
            top_genes: [],
            gene_stats: [],
            heatmap_data: {},
            noise_metrics: {},
            warning: `No data available for ${method} normalization`,
          };
          const genes = params.analysisType === "ORA" && params.genes.length > 0 ? params.genes : methodData.top_genes || [];
          const processedGeneStats: GeneStats[] = genes.map((gene: string) => {
            const stats = methodData.gene_stats[gene] || {};
            return {
              gene,
              ensembl_id: geneToEnsemblMap.get(gene) || "N/A",
              metrics: stats,
            };
          });
          processedResults[method] = {
            enrichment: methodData.enrichment || [],
            top_genes: genes,
            gene_stats: processedGeneStats,
            heatmap_data: methodData.heatmap_data || {},
            noise_metrics: methodData.noise_metrics || {},
            warning: methodData.warning || null,
          };
        });

        const cacheKey = generateCacheKey({
          sites: params.sites,
          cancerTypes: params.cancerTypes,
          genes: params.genes,
          topN: params.topN,
          analysisType: params.analysisType,
          siteAnalysisType: params.siteAnalysisType,
        });
        setCachedData(cacheKey, processedResults);
        if (isMounted) {
          setAllResults(processedResults);
          setIsLoading(false);
          setError(null);
        }
      } catch (error: any) {
        console.error("Error fetching data:", error);
        if (isMounted) {
          setError(error.message || "An error occurred while fetching data.");
          setAllResults({});
          setIsLoading(false);
        }
      }
    };

    // Check cache first
    const cacheKey = generateCacheKey({
      sites: params.sites,
      cancerTypes: params.cancerTypes,
      genes: params.genes,
      topN: params.topN,
      analysisType: params.analysisType,
      siteAnalysisType: params.siteAnalysisType,
    });
    const cachedResults = getCachedData(cacheKey);
    if (cachedResults) {
      setAllResults(cachedResults);
    } else {
      fetchData();
    }

    return () => {
      isMounted = false;
    };
  }, [params.sites, params.cancerTypes, params.genes, params.topN, params.analysisType, params.siteAnalysisType, getCachedData, setCachedData, generateCacheKey]);

  const downloadData = useCallback(
    (type: "enrichment" | "mean_expression" | "noise_metrics") => {
      let data: any[] = [];
      let headers: string[] = [];
      let filename = `pathway_analysis_${params.sites.join("_")}_${params.siteAnalysisType}_${params.analysisType}_${normalizationMethod}_${Date.now()}`;
      if (type === "enrichment") {
        data = currentResults.enrichment;
        headers = ["Term", "P-value", "Adjusted P-value", "Combined Score", "Genes", "GeneSet"];
        filename = `enrichment_${filename}.csv`;
        const rows = data.map((row) =>
          [
            row.Term,
            row["P-value"],
            row["Adjusted P-value"],
            row["Combined Score"],
            row.Genes.join(", "),
            row.GeneSet || "",
          ].join(",")
        );
        const content = [headers.join(","), ...rows].join("\n");
        const blob = new Blob([content], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
      } else if (type === "mean_expression") {
        data = currentResults.gene_stats;
        headers = ["Gene", "Ensembl ID", ...params.sites.flatMap((site) => [`${site} Normal`, `${site} Tumor`])];
        filename = `mean_expression_${filename}.csv`;
        const rows = data.map((row) => {
          const metrics = params.sites.map((site) => {
            const lowerSite = site.toLowerCase();
            const metric = row.metrics[lowerSite] || {};
            return [
              metric.mean_normal?.toFixed(2) || "0.00",
              metric.mean_tumor?.toFixed(2) || "0.00",
            ];
          }).flat();
          return [row.gene, row.ensembl_id, ...metrics].join(",");
        });
        const content = [headers.join(","), ...rows].join("\n");
        const blob = new Blob([content], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
      } else if (type === "noise_metrics") {
        data = currentResults.gene_stats;
        headers = ["Gene", "Ensembl ID", ...params.sites.flatMap((site) => [`${site} Normal`, `${site} Tumor`, `${site} Log2FC`])];
        filename = `noise_metrics_${filename}.csv`;
        const rows = data.map((row) => {
          const metrics = params.sites.map((site) => {
            const lowerSite = site.toLowerCase();
            const metric = row.metrics[lowerSite] || {};
            return [
              metric.cv_normal?.toFixed(2) || "0.00",
              metric.cv_tumor?.toFixed(2) || "0.00",
              metric.logfc?.toFixed(2) || "0.00",
            ];
          }).flat();
          return [row.gene, row.ensembl_id, ...metrics].join(",");
        });
        const content = [headers.join(","), ...rows].join("\n");
        const blob = new Blob([content], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
      }
    },
    [currentResults, params.sites, params.siteAnalysisType, params.analysisType, normalizationMethod]
  );

  const getZValues = useCallback(
    (dataKey: "mean" | "cv" | "logfc") => {
      const zValues = currentResults.gene_stats.map((geneStat) => {
        const gene = geneStat.gene;
        if (dataKey === "mean") {
          return params.sites.flatMap((site) => {
            const lowerSite = site.toLowerCase();
            return [
              geneStat.metrics[lowerSite]?.mean_normal || 0,
              geneStat.metrics[lowerSite]?.mean_tumor || 0,
            ];
          });
        } else if (dataKey === "cv") {
          return params.sites.flatMap((site) => {
            const lowerSite = site.toLowerCase();
            return [
              geneStat.metrics[lowerSite]?.cv_normal || 0,
              geneStat.metrics[lowerSite]?.cv_tumor || 0,
            ];
          });
        } else {
          return params.sites.map((site) => {
            const lowerSite = site.toLowerCase();
            return geneStat.metrics[lowerSite]?.logfc || 0;
          });
        }
      });
      console.log(`All zValues (${dataKey}):`, zValues);
      return zValues;
    },
    [currentResults.gene_stats, params.sites]
  );

  const toggleOpen = () => {
    setIsOpen(!isOpen);
  };

  const toggleGroup = (group: string) => {
    setSelectedGroups((prev) =>
      prev.includes(group) ? prev.filter((g) => g !== group) : [...prev, group]
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-yellow-50 flex flex-col">
      <Header />
      <main className="flex-grow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-[320px_1fr] gap-6">
            <FilterPanel
              normalizationMethod={normalizationMethod}
              setNormalizationMethod={(value) => updateFilters({ normalizationMethod: value })}
            />
            <div className="flex-1">
              {isLoading ? (
                <LoadingSpinner message="Loading pathway results..." />
              ) : currentResults.gene_stats.length === 0 && currentResults.warning ? (
                <Card className="shadow-lg p-6 text-center text-yellow-700 bg-yellow-50">
                  <p className="text-lg">Warning: {currentResults.warning}</p>
                </Card>
              ) : (
                <>
                  {currentResults.warning && (
                    <Card className="shadow-lg p-6 mb-6 text-center text-yellow-700 bg-yellow-50">
                      <p className="text-lg">Warning: {currentResults.warning}</p>
                    </Card>
                  )}
                  <Link
                    to="/pathway-analysis"
                    className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-6 transition-colors"
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Pathway Analysis
                  </Link>
                  {/* <div className="mb-8">
                    <h2 className="text-4xl font-bold text-blue-900 mb-2">
                      Results for Pay Analysis ({params.sites.join(", ")})
                    </h2>
                    <div className="flex items-center justify-between mb-4">
                      <p className="text-blue-700 text-lg">
                        Normalization: <strong>{normalizationMethod.toUpperCase()}</strong>,{" "}
                        {params.analysisType === "ORA" && params.genes.length > 0
                          ? `Custom genes (${params.genes.length})`
                          : `Top ${params.topN} Noisy Genes`}
                      </p>
                      <Button
                        onClick={() => downloadData("enrichment")}
                        variant="outline"
                        size="sm"
                      >
                        <Download className="h-4 w-4 mr-2" /> Download Enrichment CSV
                      </Button>
                    </div>
                    <SampleCounts
                      isOpen={isOpen}
                      toggleOpen={toggleOpen}
                      siteSampleCounts={siteSampleCounts.length > 0 ? siteSampleCounts : params.sites.map((site) => ({ site, tumor: 0, normal: 0 }))}
                      selectedSites={params.sites}
                      selectedGroups={selectedGroups}
                    />
                  </div> */}
                  {/* <div className="mb-8"> */}
                    <h2 className="text-4xl font-bold text-blue-900 mb-2">Results For Pathway Analysis</h2>
                      <div className="flex items-center justify-between mb-4">
                        <div className="text-blue-700 text-lg space-y-1">
                          <div>
                            <strong>Normalization:</strong>{" "}
                              log2({normalizationMethod.toUpperCase()} + 1)
                          </div>
                          <div>
                            <strong>Genes:{" "}</strong>
                              {params.genes.join(", ")}
                          </div>
                          <div>
                            <strong>Cancer Site(s):</strong>{" "}
                              {params.sites.join(", ")}
                              {params.cancerTypes.length > 0 && ` (${params.cancerTypes.join(", ")})`}
                          </div>
                          </div>
                            <Button
                              onClick={() => downloadData("enrichment")}
                              variant="outline"
                              size="sm"
                              >
                              <Download className="h-4 w-4 mr-2" /> Download Enrichment CSV
                            </Button>
                          </div>
                  {currentResults.enrichment.length === 0 ? (
                    <Card className="shadow-lg p-6 text-center text-blue-700">
                      <Activity className="w-10 h-10 mx-auto mb-3" />
                      <p className="text-lg">No pathway enrichment results found for the selected parameters.</p>
                    </Card>
                  ) : (
                    <>
                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                        <div className="lg:col-span-2">
                          <CollapsibleCard title="Enriched Pathways" className="h-full">
                            <DataTable
                              data={currentResults.enrichment}
                              columns={[
                                { key: "Term", header: "Pathway", sortable: true },
                                {
                                  key: "P-value",
                                  header: "P-value",
                                  sortable: true,
                                  render: (value: number) => formatPValue(value),
                                },
                                {
                                  key: "Adjusted P-value",
                                  header: "Adj. P-value",
                                  sortable: true,
                                  render: (value: number) => formatPValue(value),
                                },
                              ]}
                              defaultSortKey={sortBy === "pval" ? "P-value" : "Adjusted P-value"}
                              defaultSortOrder={sortOrder}
                              onRowClick={setSelectedPathway}
                            />
                          </CollapsibleCard>
                        </div>
                        <div>
                          <CollapsibleCard title="Pathway Details" className="h-full">
                            {selectedPathway ? (
                              <div className="space-y-2 p-2">
                                <div>
                                  <h3 className="font-semibold text-blue-700 text-sm">{selectedPathway.Term}</h3>
                                  <p className="text-xs text-gray-600">Gene Set: {selectedPathway.GeneSet || "N/A"}</p>
                                </div>
                                <div>
                                  <h4 className="font-medium text-blue-700 text-xs">Statistics</h4>
                                  <div className="grid grid-cols-2 gap-1 mt-1 text-xs">
                                    <div>P-value:</div>
                                    <div>{selectedPathway["P-value"].toExponential(2)}</div>
                                    <div>Adj. P-value:</div>
                                    <div>{selectedPathway["Adjusted P-value"].toExponential(2)}</div>
                                  </div>
                                </div>
                                <div>
                                  <h4 className="font-medium text-blue-700 text-xs">Associated Genes</h4>
                                  <div className="flex flex-wrap gap-1 mt-1">
                                    {selectedPathway.Genes.map((gene, idx) => (
                                      <span
                                        key={idx}
                                        className="bg-blue-100 text-blue-800 px-1 py-0.5 rounded text-xs"
                                      >
                                        {gene}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <div className="text-center text-gray-500 h-full flex items-center justify-center">
                                <div>
                                  <Info className="h-6 w-6 mx-auto mb-1" />
                                  <p className="text-xs">Select a pathway to view details</p>
                                </div>
                              </div>
                            )}
                          </CollapsibleCard>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 gap-4 mb-8">
                        <CollapsibleCard title="Gene Expression Heatmap">
                          <PlotlyHeatmap
                            title="Gene Expression Heatmap"
                            data={currentResults.gene_stats}
                            xValues={params.sites.flatMap((site) => [`${site} Normal`, `${site} Tumor`])}
                            yValues={currentResults.gene_stats.map((d) => d.gene)}
                            zValues={getZValues("mean")}
                            zLabel={`Mean Expression (${normalizationMethod.toUpperCase()})`}
                            chartKey="expression-heatmap"
                            xLabel="Sample Types"
                            yLabel="Genes"
                            colorscale="RdBu"
                          />
                        </CollapsibleCard>
                        <CollapsibleCard title="Gene Noise Heatmap">
                          <PlotlyHeatmap
                            title="Gene Noise Heatmap"
                            data={currentResults.gene_stats}
                            xValues={params.sites.flatMap((site) => [`${site} Normal`, `${site} Tumor`])}
                            yValues={currentResults.gene_stats.map((d) => d.gene)}
                            zValues={getZValues("cv")}
                            zLabel={`Noise (${normalizationMethod.toUpperCase()})`}
                            chartKey="cv-heatmap"
                            xLabel="Sample Types"
                            yLabel="Genes"
                            colorscale="Viridis"
                          />
                        </CollapsibleCard>
                        <CollapsibleCard title="Differential Noise Analysis (Log2FC)">
                          <PlotlyHeatmap
                            title="Log2 Fold Change Heatmap"
                            data={currentResults.gene_stats}
                            xValues={params.sites}
                            yValues={currentResults.gene_stats.map((d) => d.gene)}
                            zValues={getZValues("logfc")}
                            zLabel="Log2FC"
                            chartKey="logfc-heatmap"
                            xLabel="Cancer Sites"
                            yLabel="Genes"
                            colorscale="RdBu"
                          />
                        </CollapsibleCard>
                      </div>
                      <CollapsibleCard
                        title={`Mean Expression (${normalizationMethod.toUpperCase()})`}
                        className="mb-4"
                        downloadButton={
                          <Button
                            onClick={() => downloadData("mean_expression")}
                            variant="outline"
                            size="sm"
                            className="h-6 px-2 text-xs"
                          >
                            <Download className="h-4 w-4 mr-2" /> Download CSV
                          </Button>
                        }
                      >
                        {currentResults.gene_stats.length > 0 ? (
                          <DataTable
                            data={currentResults.gene_stats}
                            columns={[
                              { key: "gene", header: "Gene", sortable: true },
                              { key: "ensembl_id", header: "GeneID", sortable: true },
                              ...params.sites.flatMap((site) => {
                                const lowerSite = site.toLowerCase();
                                return [
                                  {
                                    key: `${site}-mean_normal`,
                                    header: `${site} Normal`,
                                    sortable: true,
                                    render: (_: any, row: any) => {
                                      const value = row.metrics?.[lowerSite]?.mean_normal;
                                      return value != null ? value.toFixed(3) : "N/A";
                                    },
                                  },
                                  {
                                    key: `${site}-mean_tumor`,
                                    header: `${site} Tumor`,
                                    sortable: true,
                                    render: (_: any, row: any) => {
                                      const value = row.metrics?.[lowerSite]?.mean_tumor;
                                      return value != null ? value.toFixed(3) : "N/A";
                                    },
                                  },
                                ];
                              }),
                            ]}
                          />
                        ) : (
                          <p className="text-blue-700">No mean expression data available.</p>
                        )}
                      </CollapsibleCard>
                      <CollapsibleCard
                        title="Gene Noise Analytics"
                        className="mb-4 p-2 text-sm"
                        downloadButton={
                          <Button
                            onClick={() => downloadData("noise_metrics")}
                            variant="outline"
                            size="sm"
                            className="h-6 px-2 text-xs"
                          >
                            <Download className="h-4 w-4 mr-2" /> Download CSV
                          </Button>
                        }
                      >
                        {currentResults.gene_stats.length > 0 ? (
                          <DataTable
                            data={currentResults.gene_stats}
                            columns={[
                              { key: "gene", header: "Gene", sortable: true },
                              { key: "ensembl_id", header: "GeneID", sortable: true },
                              ...params.sites.flatMap((site) => {
                                const lowerSite = site.toLowerCase();
                                return [
                                  {
                                    key: `${site}-cv_normal`,
                                    header: `${site} Normal`,
                                    sortable: true,
                                    render: (_: any, row: any) => {
                                      const value = row.metrics?.[lowerSite]?.cv_normal;
                                      return value != null ? value.toFixed(3) : "N/A";
                                    },
                                  },
                                  {
                                    key: `${site}-cv_tumor`,
                                    header: `${site} Tumor`,
                                    sortable: true,
                                    render: (_: any, row: any) => {
                                      const value = row.metrics?.[lowerSite]?.cv_tumor;
                                      return value != null ? value.toFixed(3) : "N/A";
                                    },
                                  },
                                ];
                              }),
                            ]}
                          />
                        ) : (
                          <p className="text-blue-700">No noise metrics data available.</p>
                        )}
                      </CollapsibleCard>
                      <CollapsibleCard
                        title="Differential Noise (LogFC - Tumor / Normal)"
                        className="mb-4 p-2 text-sm"
                        downloadButton={
                          <Button
                            onClick={() => downloadData("noise_metrics")}
                            variant="outline"
                            size="sm"
                            className="h-6 px-2 text-xs"
                          >
                            <Download className="h-4 w-4 mr-2" /> Download CSV
                          </Button>
                        }
                      >
                        {currentResults.gene_stats.length > 0 ? (
                          <DataTable
                            data={currentResults.gene_stats}
                            columns={[
                              { key: "gene", header: "Gene", sortable: true },
                              { key: "ensembl_id", header: "GeneID", sortable: true },
                              ...params.sites.flatMap((site) => {
                                const lowerSite = site.toLowerCase();
                                return [
                                  {
                                    key: `${site}-logfc`,
                                    header: `${site}`,
                                    sortable: true,
                                    render: (_: any, row: any) => {
                                      const value = row.metrics?.[lowerSite]?.logfc;
                                      return value != null ? value.toFixed(2) : "N/A";
                                    },
                                  },
                                ];
                              }),
                            ]}
                          />
                        ) : (
                          <p className="text-blue-700">No noise metrics data available.</p>
                        )}
                        </CollapsibleCard>
                        <div className="mb-4">
                        <CollapsibleCard title="LogFC Threshold Adjustment">
                          <div className="p-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              LogFC Threshold: {logFCThreshold.toFixed(2)}
                            </label>
                            <Slider
                              value={[logFCThreshold]}
                              onValueChange={(value) => setLogFCThreshold(value[0])}
                              min={-0.00001}
                              max={5}
                              step={0.1}
                              className="mt-2 w-24"
                            />
                            <Input
                              type="number"
                              value={logFCThreshold}
                              onChange={(e) => setLogFCThreshold(parseFloat(e.target.value) || 0)}
                              min={-0.01}
                              max={5}
                              step={0.1}
                              className="mt-2 w-24"
                            />
                          </div>
                        </CollapsibleCard>
                      </div>
                      <div className="mb-4">
                        <CollapsibleCard title="Most Enriched Pathways by Cancer Site">
                          <DataTable
                            data={enrichedPathwaysBySite}
                            columns={[
                              { key: "site", header: "Cancer Site", sortable: true },
                              { key: "pathway", header: "Most Enriched Pathway", sortable: true },
                              {
                                key: "adjPValue",
                                header: "Adjusted P-value",
                                sortable: true,
                                render: (value: number) => (value !== 0 ? formatPValue(value) : "N/A"),
                              },
                              {
                                key: "genes",
                                header: "Significant Genes",
                                sortable: false,
                                render: (value: string[]) => value.join(", ") || "None",
                              },
                            ]}
                          />
                        </CollapsibleCard>
                      </div>
                      {/* </CollapsibleCard> */}
                      {/* {params.sites.map((site) => {
                        const lowerSite = site.toLowerCase();
                        const siteLogFCData = currentResults.gene_stats
                          .filter((geneStat) => {
                            const logFC = geneStat.metrics[lowerSite]?.logfc || 0;
                            return Math.abs(logFC) >= logFCThreshold;
                          })
                          .map((geneStat) => ({
                            gene: geneStat.gene,
                            logfc: geneStat.metrics[lowerSite]?.logfc || 0,
                          }))
                          .sort((a, b) => b.logfc - a.logfc);
                        return siteLogFCData.length > 0 ? (
                          <CollapsibleCard
                            key={site}
                            title={`${site} Differential Noise Analysis (Log2FC >= ${logFCThreshold.toFixed(2)})`}
                            className="mb-4"
                          >
                            <DataTable
                              data={siteLogFCData}
                              columns={[
                                { key: "gene", header: "Gene", sortable: true },
                                {
                                  key: "logfc",
                                  header: "logFC",
                                  sortable: true,
                                  render: (value: number) => value.toFixed(2),
                                },
                              ]}
                            />
                          </CollapsibleCard>
                        ) : null;
                      })} */}
                    </>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default PathwayResults;