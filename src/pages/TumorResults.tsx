// // // import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
// // // import { useSearchParams, Link } from "react-router-dom";
// // // import supabase from "@/supabase-client";
// // // import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
// // // import { Button } from "@/components/ui/button";
// // // import { Badge } from "@/components/ui/badge";
// // // import { ArrowLeft, Download, Box, ChevronRight, ChevronDown, ChevronUp, Users } from "lucide-react";
// // // import { PlotlyBarChart } from "@/components/charts/index";
// // // import { LoadingSpinner } from "@/components/ui/loadingSpinner";
// // // import Header from "@/components/header";
// // // import Footer from "@/components/footer";
// // // import { TumorData, SampleInfo } from "@/components/types/tumor";
// // // import { useCache } from "@/hooks/use-cache";
// // // import FilterPanel from "@/components/FilterPanel";
// // // import { DataTable } from "@/components/ui/data-table";
// // // import CollapsibleCard from "@/components/ui/collapsible-card";
// // // import PlotlyBoxPlot from "@/components/charts/PlotlyTumorBoxPlot";

// // // // Utility to debounce state updates
// // // interface DebouncedFunction<T extends (...args: any[]) => any> {
// // //   (...args: Parameters<T>): void;
// // //   cancel: () => void;
// // // }

// // // const debounce = <T extends (...args: any[]) => any>(
// // //   func: T,
// // //   wait: number
// // // ): DebouncedFunction<T> => {
// // //   let timeout: NodeJS.Timeout | null = null;

// // //   const debounced = (...args: Parameters<T>): void => {
// // //     if (timeout !== null) {
// // //       clearTimeout(timeout);
// // //     }
// // //     timeout = setTimeout(() => func(...args), wait);
// // //   };

// // //   debounced.cancel = () => {
// // //     if (timeout !== null) {
// // //       clearTimeout(timeout);
// // //       timeout = null;
// // //     }
// // //   };

// // //   return debounced as DebouncedFunction<T>;
// // // };

// // // const TumourResults = () => {
// // //   const [searchParams] = useSearchParams();
// // //   const rawParams = useMemo(() => ({
// // //     cancerSite: searchParams.get("cancerSite") || "",
// // //     cancerTypes: searchParams.get("cancerTypes")?.split(",").filter(Boolean) || [],
// // //     cancerType: searchParams.get("cancerType") || "",
// // //   }), [searchParams.toString()]);

// // //   const [normalizationMethod, setNormalizationMethod] = useState("tpm");
// // //   const [selectedNoiseMetrics, setSelectedNoiseMetrics] = useState<string[]>(["DEPTH2", "tITH"]);
// // //   const [isStatisticalMetricsOpen, setIsStatisticalMetricsOpen] = useState(true);
// // //   const [metricOpenState, setMetricOpenState] = useState({ depth2: true, tith: true });
// // //   const [isTableOpen, setIsTableOpen] = useState(true);
// // //   const [totalTumorSamples, setTotalTumorSamples] = useState(0);
// // //   const [isLoading, setIsLoading] = useState(false);
// // //   const [tumorData, setTumorData] = useState<TumorData[]>([]);
// // //   const [sampleToCancerType, setSampleToCancerType] = useState<{ [sampleId: number]: SampleInfo }>({});
// // //   const { getCachedData, setCachedData, generateCacheKey } = useCache<TumorData[]>();
// // //   const filterTimeoutRef = useRef<NodeJS.Timeout | null>(null);
// // //   // Track initial fetches for cancerSite and cancerTypes
// // //   const initialFetchTracker = useRef<Set<string>>(new Set());

// // //   const noiseMetrics = { DEPTH2: "depth2", tITH: "tith" };
// // //   const allNoiseMetrics = Object.keys(noiseMetrics);
// // //   const normalizationMethods = ["tpm", "fpkm", "fpkm_uq"];

// // //   const updateFilters = useCallback(
// // //     (newFilters: {
// // //       normalizationMethod?: string;
// // //       selectedNoiseMetrics?: string[];
// // //     }) => {
// // //       if (filterTimeoutRef.current) {
// // //         clearTimeout(filterTimeoutRef.current);
// // //       }
// // //       filterTimeoutRef.current = setTimeout(() => {
// // //         if (newFilters.normalizationMethod) {
// // //           setNormalizationMethod(newFilters.normalizationMethod);
// // //         }
// // //         if (newFilters.selectedNoiseMetrics) {
// // //           setSelectedNoiseMetrics(newFilters.selectedNoiseMetrics);
// // //         }
// // //       }, 300);
// // //     },
// // //     []
// // //   );

// // //   // const handleFilterChange = useCallback((filterId: string, value: string[]) => {
// // //   //   if (filterId === "noiseMetrics") {
// // //   //     updateFilters({ selectedNoiseMetrics: value });
// // //   //   }
// // //   // }, [updateFilters]);
// // //   const handleFilterChange = useCallback(
// // //   (filterId: string, value: string[]) => {
// // //     console.log("handleFilterChange:", { filterId, value });
// // //     if (filterId === "noiseMetrics") {
// // //       // 🔒 Prevent < 1 selection
// // //       if (value.length === 0) {
// // //         console.warn("At least one noise metric must remain selected.");
// // //         return; // do nothing if user tries to deselect all
// // //       }
// // //       updateFilters({ selectedNoiseMetrics: value });
// // //     }
// // //   },
// // //   [updateFilters]
// // // );


// // //   const fetchTumorExpressionData = useCallback(async ({
// // //     cancerSite,
// // //     cancerTypes,
// // //     normalizationMethod,
// // //     selectedNoiseMetrics,
// // //   }: {
// // //     cancerSite: string;
// // //     cancerTypes: string[];
// // //     normalizationMethod: string;
// // //     selectedNoiseMetrics: string[];
// // //   }) => {
// // //     console.log("Starting fetch:", { cancerSite, cancerTypes, normalizationMethod, selectedNoiseMetrics });
// // //     if (!cancerSite || !selectedNoiseMetrics.length || isLoading) {
// // //       console.warn("No cancerSite, selectedNoiseMetrics, or already loading");
// // //       setTumorData([]);
// // //       setIsLoading(false);
// // //       return;
// // //     }

// // //     setIsLoading(true);
// // //     let sampleToCancerTypeMap: { [sampleId: number]: SampleInfo } = {};

// // //     try {
// // //       // Generate a key for tracking initial fetches (excludes normalizationMethod and selectedNoiseMetrics)
// // //       const initialFetchKey = generateCacheKey({ cancerSite, cancerTypes });
// // //       const isInitialFetch = !initialFetchTracker.current.has(initialFetchKey);

// // //       // Generate cache key for processed data
// // //       const cacheKey = generateCacheKey({
// // //         cancerSite,
// // //         cancerTypes,
// // //         normalizationMethod,
// // //         selectedNoiseMetrics: selectedNoiseMetrics.sort(),
// // //       });
// // //       const cachedData = getCachedData(cacheKey);
// // //       if (cachedData && cachedData.length !== 0) {
// // //         console.log("Using cached data:", cachedData);
// // //         setTumorData(cachedData);
// // //         setTotalTumorSamples(cachedData.length);
// // //         setIsLoading(false);
// // //         return;
// // //       }

// // //       // Fetch cancer site and sample information
// // //       const { data: siteRows, error: siteRowsErr } = await supabase
// // //         .from("Sites")
// // //         .select("id, name")
// // //         .eq("name", cancerSite);

// // //       if (siteRowsErr) {
// // //         console.error("Failed to fetch cancer site:", siteRowsErr);
// // //         setTumorData([]);
// // //         setIsLoading(false);
// // //         return;
// // //       }

// // //       const site = siteRows?.[0];
// // //       const cancerSiteId = site?.id;

// // //       const { data: cancerTypeRows, error: cancerTypeErr } =
// // //         cancerTypes.length > 0
// // //           ? await supabase
// // //               .from("cancer_types")
// // //               .select("id, tcga_code, site_id")
// // //               .in("tcga_code", cancerTypes)
// // //               .eq("site_id", cancerSiteId)
// // //           : await supabase
// // //               .from("cancer_types")
// // //               .select("id, tcga_code, site_id")
// // //               .eq("site_id", cancerSiteId);

// // //       if (cancerTypeErr) {
// // //         console.error("Failed to fetch cancer_type ids:", cancerTypeErr);
// // //         setTumorData([]);
// // //         setIsLoading(false);
// // //         return;
// // //       }

// // //       const validCancerTypeIds = cancerTypeRows?.map((row) => row.id);

// // //       const { data: sampleRows, error: sampleErr } = await supabase
// // //         .from("samples")
// // //         .select("id, sample_barcode, cancer_type_id, sample_type")
// // //         .eq("sample_type", "tumor")
// // //         .in("cancer_type_id", validCancerTypeIds);

// // //       if (sampleErr) {
// // //         console.error("Failed to fetch matching samples:", sampleErr);
// // //         setTumorData([]);
// // //         setIsLoading(false);
// // //         return;
// // //       }

// // //       sampleToCancerTypeMap = {};
// // //       sampleRows.forEach((sample) => {
// // //         const type = cancerTypeRows.find((ct) => ct.id === sample.cancer_type_id);
// // //         sampleToCancerTypeMap[sample.id] = {
// // //           barcode: sample.sample_barcode,
// // //           cancerType: type?.tcga_code || "Unknown",
// // //         };
// // //       });

// // //       setSampleToCancerType(sampleToCancerTypeMap);
// // //       setTotalTumorSamples(sampleRows.length);

// // //       const validMetrics = ["DEPTH2", "tITH"];
// // //       const metrics = selectedNoiseMetrics.filter((metric) => validMetrics.includes(metric));
// // //       if (metrics.length === 0) {
// // //         console.error(`Invalid metrics: ${selectedNoiseMetrics.join(", ")}. Valid options: ${validMetrics.join(", ")}`);
// // //         setTumorData([]);
// // //         setIsLoading(false);
// // //         return;
// // //       }

// // //       let processedData: TumorData[] = [];
// // //       let missingDataMetrics: { metric: string; sampleIds: string[] }[] = [];
// // //       const sampleExpressionMap: { [sampleId: number]: TumorData } = {};

// // //       // Query Supabase for all normalization methods for selected metrics
// // //       for (const metric of metrics) {
// // //         const tableName = metric === "DEPTH2" ? "depth2_scores" : "tith_scores";
// // //         console.log(`Checking Supabase table: ${tableName} for ${normalizationMethod}`);

// // //         const { data: metricData, error: metricError } = await supabase
// // //           .from(tableName)
// // //           .select(`sample_id, tpm, fpkm, fpkm_uq`)
// // //           .in("sample_id", Object.keys(sampleToCancerTypeMap)) as {
// // //             data: { sample_id: number; tpm: number | null; fpkm: number | null; fpkm_uq: number | null }[] | null;
// // //             error: any;
// // //           };

// // //         if (metricError) {
// // //           console.error(`Failed to fetch ${metric} from Supabase table ${tableName}:`, metricError);
// // //           continue;
// // //         }

// // //         if (!metricData) {
// // //           console.warn(`No data returned for ${metric} from Supabase table ${tableName}`);
// // //           missingDataMetrics.push({ metric, sampleIds: Object.keys(sampleToCancerTypeMap) });
// // //           continue;
// // //         }

// // //         const sampleIdsWithCompleteData = new Set(
// // //           metricData
// // //             .filter((item) => item[normalizationMethod.toLowerCase()] != null)
// // //             .map((item) => item.sample_id)
// // //         );

// // //         const missingSampleIds = Object.keys(sampleToCancerTypeMap).filter(
// // //           (sampleId) => !sampleIdsWithCompleteData.has(Number(sampleId))
// // //         );

// // //         if (missingSampleIds.length > 0) {
// // //           console.log(`Missing or incomplete ${metric} data for ${missingSampleIds.length} samples for ${normalizationMethod}`);
// // //           missingDataMetrics.push({ metric, sampleIds: missingSampleIds });
// // //         }

// // //         metricData.forEach((item) => {
// // //           const sampleId = item.sample_id;
// // //           const sampleInfo = sampleToCancerTypeMap[sampleId];

// // //           if (!sampleInfo) {
// // //             console.warn(`No matching sample info for sample_id ${sampleId}`);
// // //             return;
// // //           }

// // //           if (!sampleExpressionMap[sampleId]) {
// // //             sampleExpressionMap[sampleId] = {
// // //               sample: sampleInfo.barcode,
// // //               cancer_type: sampleInfo.cancerType || "Unknown",
// // //             };
// // //           }

// // //           const fieldName = noiseMetrics[metric as keyof typeof noiseMetrics] || metric.toLowerCase();
// // //           const value = item[normalizationMethod.toLowerCase()] || 0;
// // //           sampleExpressionMap[sampleId][fieldName] = value;
// // //         });
// // //       }

// // //       processedData = Object.values(sampleExpressionMap).filter((sampleData) => {
// // //         const hasValidMetric = metrics.some((metric) => {
// // //           const fieldName = noiseMetrics[metric as keyof typeof noiseMetrics] || metric.toLowerCase();
// // //           const value = sampleData[fieldName];
// // //           return value !== null && !isNaN(value);
// // //         });
// // //         return hasValidMetric;
// // //       });

// // //       // If no missing data or this is not the initial fetch, use Supabase data
// // //       if (missingDataMetrics.length === 0 || !isInitialFetch) {
// // //         console.log(isInitialFetch ? `All data found in Supabase for ${normalizationMethod}` : `Using Supabase data for filter change`);
// // //         setCachedData(cacheKey, processedData);
// // //         setTumorData(processedData);
// // //         setIsLoading(false);
// // //         return;
// // //       }

// // //       // Initial fetch: Query API for missing data
// // //       initialFetchTracker.current.add(initialFetchKey);
// // //       const supabaseUpsertData: {
// // //         [metric: string]: { sample_id: string; tpm: number | null; fpkm: number | null; fpkm_uq: number | null }[];
// // //       } = { DEPTH2: [], tITH: [] };

// // //       const promises: Promise<{ metric: string; normMethod: string; data: any }>[] = [];
// // //       for (const { metric, sampleIds } of missingDataMetrics) {
// // //         for (const normMethod of normalizationMethods) {
// // //           promises.push(
// // //             fetch(`http://localhost:5001/api/TH-metrics?cancer=${cancerSite}&method=${normMethod}&metric=${metric}&sample_ids=${sampleIds.join(",")}`)
// // //               .then((response) => {
// // //                 if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
// // //                 return response.json();
// // //               })
// // //               .then((data) => ({ metric, normMethod, data }))
// // //               .catch((error) => {
// // //                 console.error(`Error fetching ${metric} (${normMethod}):`, error);
// // //                 return { metric, normMethod, data: [] };
// // //               })
// // //           );
// // //         }
// // //       }

// // //       const metricResults = await Promise.all(promises);
// // //       const sampleExpressionMapAfterApi: { [sampleId: string]: TumorData } = { ...sampleExpressionMap };

// // //       metricResults.forEach(({ metric, normMethod, data }) => {
// // //         if (data && data.length > 0) {
// // //           data.forEach((item: any) => {
// // //             const sampleId = item.sample_id || item.sample_barcode;
// // //             const supabaseSampleId = Object.keys(sampleToCancerTypeMap).find(
// // //               (key) => sampleToCancerTypeMap[key].barcode === sampleId || key === sampleId
// // //             );

// // //             if (!supabaseSampleId) return;

// // //             const sampleInfo = sampleToCancerTypeMap[supabaseSampleId];
// // //             if (!sampleInfo || (cancerTypes.length > 0 && !cancerTypes.includes(sampleInfo.cancerType))) return;

// // //             const mapKey = supabaseSampleId;
// // //             if (!sampleExpressionMapAfterApi[mapKey]) {
// // //               sampleExpressionMapAfterApi[mapKey] = {
// // //                 sample: sampleInfo.barcode,
// // //                 cancer_type: sampleInfo.cancerType || "Unknown",
// // //               };
// // //             }
// // //             if (normMethod === normalizationMethod) {
// // //               const fieldName = noiseMetrics[metric as keyof typeof noiseMetrics] || metric.toLowerCase();
// // //               const value = item[normMethod] != null ? item[normMethod] : 0;
// // //               sampleExpressionMapAfterApi[mapKey][fieldName] = value;
// // //             }

// // //             let existingEntry = supabaseUpsertData[metric].find((entry) => entry.sample_id === supabaseSampleId);
// // //             if (!existingEntry) {
// // //               existingEntry = { sample_id: supabaseSampleId, tpm: null, fpkm: null, fpkm_uq: null };
// // //               supabaseUpsertData[metric].push(existingEntry);
// // //             }
// // //             existingEntry[normMethod] = item[normMethod] != null ? item[normMethod] : null;
// // //           });
// // //         }
// // //       });

// // //       // Upsert API data to Supabase
// // //       for (const metric of metrics) {
// // //         const tableName = metric === "DEPTH2" ? "depth2_scores" : "tith_scores";
// // //         const dataToUpsert = supabaseUpsertData[metric];

// // //         if (dataToUpsert.length > 0) {
// // //           const { data: existingRows, error: fetchError } = await supabase
// // //             .from(tableName)
// // //             .select("id, sample_id")
// // //             .in("sample_id", dataToUpsert.map((entry) => entry.sample_id));

// // //           if (fetchError) {
// // //             console.error(`Failed to fetch existing rows from ${tableName}:`, fetchError);
// // //             continue;
// // //           }

// // //           const existingSampleIds = new Map(existingRows?.map((row) => [row.sample_id, row.id]) || []);

// // //           const toInsert = dataToUpsert.filter((entry) => !existingSampleIds.has(entry.sample_id));
// // //           const toUpdate = dataToUpsert.filter((entry) => existingSampleIds.has(entry.sample_id));

// // //           if (toInsert.length > 0) {
// // //             const { error: insertError } = await supabase.from(tableName).upsert(toInsert, { onConflict: "sample_id" });
// // //             if (insertError) console.error(`Failed to insert ${metric} data:`, insertError);
// // //           }

// // //           if (toUpdate.length > 0) {
// // //             for (const entry of toUpdate) {
// // //               const rowId = existingSampleIds.get(entry.sample_id);
// // //               const { error: updateError } = await supabase
// // //                 .from(tableName)
// // //                 .update({ tpm: entry.tpm, fpkm: entry.fpkm, fpkm_uq: entry.fpkm_uq })
// // //                 .eq("id", rowId);
// // //               if (updateError) console.error(`Failed to update ${metric} data for sample_id ${entry.sample_id}:`, updateError);
// // //             }
// // //           }
// // //         }
// // //       }

// // //       processedData = Object.values(sampleExpressionMapAfterApi).filter((sampleData) => {
// // //         const hasValidMetric = metrics.some((metric) => {
// // //           const fieldName = noiseMetrics[metric as keyof typeof noiseMetrics] || metric.toLowerCase();
// // //           const value = sampleData[fieldName];
// // //           return value !== null && !isNaN(value);
// // //         });
// // //         return hasValidMetric;
// // //       });

// // //       setCachedData(cacheKey, processedData);
// // //       setTumorData(processedData);
// // //       setIsLoading(false);
// // //     } catch (error) {
// // //       console.error("Error during data fetch:", error);
// // //       setTumorData([]);
// // //       setIsLoading(false);
// // //     }
// // //   }, [getCachedData, setCachedData, generateCacheKey, isLoading]);

// // //   const debouncedFetch = useMemo(() => debounce(fetchTumorExpressionData, 500), [fetchTumorExpressionData]);

// // //   useEffect(() => {
// // //     if (!isLoading) {
// // //       debouncedFetch({
// // //         cancerSite: rawParams.cancerSite,
// // //         cancerTypes: rawParams.cancerTypes,
// // //         normalizationMethod,
// // //         selectedNoiseMetrics,
// // //       });
// // //     }
// // //     return () => debouncedFetch.cancel();
// // //   }, [rawParams.cancerSite, rawParams.cancerTypes, normalizationMethod, selectedNoiseMetrics, debouncedFetch, isLoading]);

// // //   const customFilters = [
// // //     {
// // //       title: "TH Metrics",
// // //       id: "noiseMetrics",
// // //       type: "checkbox" as const,
// // //       options: allNoiseMetrics.map(metric => ({
// // //         id: metric,
// // //         label: metric,
// // //       })),
// // //       isMasterCheckbox: true,
// // //       defaultOpen: false,
// // //     },
// // //   ];

// // //   const downloadData = useCallback(() => {
// // //     const keys = ["sample", "cancer_type", "depth2", "tith"].filter((key) => {
// // //       if (key === "depth2" && !selectedNoiseMetrics.includes("DEPTH2")) return false;
// // //       if (key === "tith" && !selectedNoiseMetrics.includes("tITH")) return false;
// // //       return true;
// // //     });

// // //     const headers = keys.join(",");
// // //     const rows = tumorData.map((row) =>
// // //       keys.map((key) => {
// // //         const value = row[key as keyof TumorData];
// // //         return typeof value === "number" ? value.toFixed(6) : value || "";
// // //       }).join(",")
// // //     );

// // //     const content = [headers, ...rows].join("\n");
// // //     const blob = new Blob([content], { type: "text/csv" });
// // //     const url = URL.createObjectURL(blob);
// // //     const a = document.createElement("a");
// // //     a.href = url;
// // //     a.download = `tumor_analysis_${rawParams.cancerSite}_${normalizationMethod}_${Date.now()}.csv`;
// // //     a.click();
// // //     URL.revokeObjectURL(url);
// // //   }, [tumorData, rawParams.cancerSite, normalizationMethod, selectedNoiseMetrics]);

// // //   return (
// // //     <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-yellow-50 flex flex-col">
// // //       <Header />
// // //       <main className="flex-grow">
// // //         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
// // //           <div className="grid grid-cols-[320px_1fr] gap-6">
// // //             <FilterPanel
// // //               normalizationMethod={normalizationMethod}
// // //               setNormalizationMethod={(value) => updateFilters({ normalizationMethod: value })}
// // //               customFilters={customFilters}
// // //               onFilterChange={handleFilterChange}
// // //               selectedValues={{
// // //                 noiseMetrics: selectedNoiseMetrics,
// // //               }}
// // //             />
// // //             <div className="flex-1">
// // //               {isLoading ? (
// // //                 <LoadingSpinner message="Loading results..." />
// // //               ) : tumorData.length === 0 ? (
// // //                 <LoadingSpinner message="Loading results..." />
// // //               ) : (
// // //                 <>
// // //                   <Link
// // //                     to="/tumour-analysis"
// // //                     className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-6 transition-colors"
// // //                   >
// // //                     <ArrowLeft className="h-4 w-4 mr-2" />
// // //                     Back to Tumor Analysis
// // //                   </Link>
// // //                   <div className="mb-8">
// // //                     <h2 className="text-4xl font-bold text-blue-900 mb-6">
// // //                       Results for Tumor Analysis
// // //                     </h2>
// // //                     <div className="overflow-x-auto mb-6">
// // //                       <table className="min-w-full bg-white border border-gray-200 rounded-lg shadow-sm">
// // //                         <tbody>
// // //                           <tr className="border-b">
// // //                             <th className="text-left py-3 px-4 text-blue-700 font-semibold w-1/3">Normalization</th>
// // //                             <td className="py-3 px-4 text-blue-700">
// // //                               log2({normalizationMethod.toUpperCase()} + 1)
// // //                             </td>
// // //                           </tr>
// // //                           <tr>
// // //                             <th className="text-left py-3 px-4 text-blue-700 font-semibold w-1/3">Cancer Site</th>
// // //                             <td className="py-3 px-4 text-blue-700">
// // //                               {rawParams.cancerSite} {rawParams.cancerTypes.length > 0 && `(${rawParams.cancerTypes.join(", ")})`}
// // //                             </td>
// // //                             </tr>
// // //                            </tbody>
// // //                           </table>
// // //                     </div>
// // //                     <div className="flex justify-center items-center">
// // //                       <Card className="border-0 shadow-lg w-full">
// // //                         <CardContent className="flex flex-col items-center p-4 text-center">
// // //                           <Users className="h-6 w-6 text-red-600 mb-2" />
// // //                           <div className="text-2xl font-bold text-red-600">{totalTumorSamples}</div>
// // //                           <div className="text-xs text-gray-600">Total Tumor Samples</div>
// // //                         </CardContent>
// // //                       </Card>
// // //                     </div>
// // //                   </div>
// // //                   {(selectedNoiseMetrics.includes("DEPTH2") || selectedNoiseMetrics.includes("tITH")) && (
// // //                     <div className="mb-8">
// // //                       <div className="flex justify-between items-center mb-4">
// // //                         <h3 className="text-2xl font-bold text-blue-900">Statistical Metrics</h3>
// // //                         <button
// // //                           onClick={() => setIsStatisticalMetricsOpen((prev) => !prev)}
// // //                           className="text-blue-900"
// // //                         >
// // //                           {isStatisticalMetricsOpen ? (
// // //                             <ChevronDown className="h-6 w-6" />
// // //                           ) : (
// // //                             <ChevronRight className="h-6 w-6" />
// // //                           )}
// // //                         </button>
// // //                       </div>
// // //                       {isStatisticalMetricsOpen && (
// // //                         <>
// // //                           {["DEPTH2", "tITH"].map((metric) =>
// // //                               selectedNoiseMetrics.includes(metric) ? (
// // //                                 <CollapsibleCard
// // //                                   key={metric}
// // //                                   title={`${metric} Scores`}
// // //                                   defaultOpen={metricOpenState[metric.toLowerCase()]}
// // //                                   onToggle={(open) =>
// // //                                     setMetricOpenState((prev) => ({
// // //                                       ...prev,
// // //                                       [metric.toLowerCase()]: open,
// // //                                     }))
// // //                                   }
// // //                                   className="mb-4"
// // //                                 >
// // //                                   <PlotlyBoxPlot
// // //                                     data={tumorData}
// // //                                     xKey={noiseMetrics[metric as keyof typeof noiseMetrics]}
// // //                                     normalizationMethod={normalizationMethod}
// // //                                     selectedGroups={[...new Set(tumorData.map((d) => d.cancer_type))]}
// // //                                     title={`${metric} Distribution by Cancer (${normalizationMethod})`}
// // //                                     colorMap={{}}
// // //                                   />
// // //                                 </CollapsibleCard>
// // //                               ) : null
// // //                             )}
// // //                           {tumorData.length > 0 && (
// // //                             <div className="mt-2">
// // //                               <CollapsibleCard
// // //                                 title="Data Table"
// // //                                 className="h-full"
// // //                                 downloadButton={
// // //                                   <Button
// // //                                     onClick={() => downloadData()}
// // //                                     variant="outline"
// // //                                     size="sm"
// // //                                     className="h-6 px-2 text-xs"
// // //                                   >
// // //                                     <Download className="h-4 w-4 mr-2" /> Download CSV
// // //                                   </Button>
// // //                                 }
// // //                               >
// // //                                 <DataTable
// // //                                   data={tumorData}
// // //                                   columns={[
// // //                                     {
// // //                                       key: "sample",
// // //                                       header: "Sample",
// // //                                       sortable: true,
// // //                                     },
// // //                                     {
// // //                                       key: "cancer_type",
// // //                                       header: "Cancer Project",
// // //                                       sortable: true,
// // //                                     },
// // //                                     ...(selectedNoiseMetrics.includes("DEPTH2")
// // //                                       ? [
// // //                                           {
// // //                                             key: "depth2",
// // //                                             header: `DEPTH2 (${normalizationMethod})`,
// // //                                             sortable: true,
// // //                                             render: (value) => typeof value === "number" ? value.toFixed(4) : value,
// // //                                           },
// // //                                         ]
// // //                                       : []),
// // //                                     ...(selectedNoiseMetrics.includes("tITH")
// // //                                       ? [
// // //                                           {
// // //                                             key: "tith",
// // //                                             header: `tITH (${normalizationMethod})`,
// // //                                             sortable: true,
// // //                                             render: (value) => typeof value === "number" ? value.toFixed(4) : value,
// // //                                           },
// // //                                         ]
// // //                                       : []),
// // //                                   ]}
// // //                                   defaultSortKey="sample"
// // //                                   scrollHeight="400px"
// // //                                 />
// // //                               </CollapsibleCard>
// // //                             </div>
// // //                           )}
// // //                         </>
// // //                       )}
// // //                     </div>
// // //                   )}
// // //                 </>
// // //               )}
// // //             </div>
// // //           </div>
// // //         </div>
// // //       </main>
// // //       <Footer />
// // //     </div>
// // //   );

// // //   function toggleMetricSection(metric: string) {
// // //     setMetricOpenState((prev) => ({
// // //       ...prev,
// // //       [metric]: !prev[metric as keyof typeof metricOpenState],
// // //     }));
// // //   }
// // // };

// // // export default TumourResults;

// // // import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
// // // import { useSearchParams, Link } from "react-router-dom";
// // // import supabase from "@/supabase-client";
// // // import { Card, CardContent } from "@/components/ui/card";
// // // import { Button } from "@/components/ui/button";
// // // import { ArrowLeft, Download, Box, ChevronRight, ChevronDown, ChevronUp, Users } from "lucide-react";
// // // import { LoadingSpinner } from "@/components/ui/loadingSpinner";
// // // import Header from "@/components/header";
// // // import Footer from "@/components/footer";
// // // import { TumorData, SampleInfo } from "@/components/types/tumor";
// // // import { useCache } from "@/hooks/use-cache";
// // // import FilterPanel from "@/components/FilterPanel";
// // // import { DataTable } from "@/components/ui/data-table";
// // // import CollapsibleCard from "@/components/ui/collapsible-card";
// // // import PlotlyBoxPlot from "@/components/charts/PlotlyTumorBoxPlot";

// // // // Utility to debounce state updates
// // // interface DebouncedFunction<T extends (...args: any[]) => any> {
// // //   (...args: Parameters<T>): void;
// // //   cancel: () => void;
// // // }

// // // const debounce = <T extends (...args: any[]) => any>(
// // //   func: T,
// // //   wait: number
// // // ): DebouncedFunction<T> => {
// // //   let timeout: NodeJS.Timeout | null = null;

// // //   const debounced = (...args: Parameters<T>): void => {
// // //     if (timeout !== null) {
// // //       clearTimeout(timeout);
// // //     }
// // //     timeout = setTimeout(() => func(...args), wait);
// // //   };

// // //   debounced.cancel = () => {
// // //     if (timeout !== null) {
// // //       clearTimeout(timeout);
// // //       timeout = null;
// // //     }
// // //   };

// // //   return debounced as DebouncedFunction<T>;
// // // };

// // // const TumourResults = () => {
// // //   const [searchParams] = useSearchParams();
// // //   const [errorMessage, setErrorMessage] = useState<string | null>(null);
// // //   const rawParams = useMemo(
// // //     () => ({
// // //       cancerSite: searchParams.get("cancerSite") || "",
// // //       cancerTypes: searchParams.get("cancerTypes")?.split(",").filter(Boolean) || [],
// // //       cancerType: searchParams.get("cancerType") || "",
// // //     }),
// // //     [searchParams.toString()]
// // //   );

// // //   const [normalizationMethod, setNormalizationMethod] = useState("tpm");
// // //   const [selectedNoiseMetrics, setSelectedNoiseMetrics] = useState<string[]>(["DEPTH2", "tITH"]);
// // //   const [isStatisticalMetricsOpen, setIsStatisticalMetricsOpen] = useState(true);
// // //   const [metricOpenState, setMetricOpenState] = useState({ depth2: true, tith: true });
// // //   const [totalTumorSamples, setTotalTumorSamples] = useState(0);
// // //   const [isLoading, setIsLoading] = useState(false);
// // //   const [tumorData, setTumorData] = useState<TumorData[]>([]);
// // //   const [sampleToCancerType, setSampleToCancerType] = useState<{ [sampleId: number]: SampleInfo }>({});
// // //   const { getCachedData, setCachedData, generateCacheKey } = useCache<TumorData[]>();
// // //   const filterTimeoutRef = useRef<NodeJS.Timeout | null>(null);

// // //   const noiseMetrics = { DEPTH2: "depth2", tITH: "tith" };
// // //   const allNoiseMetrics = Object.keys(noiseMetrics);
// // //   const normalizationMethods = ["tpm", "fpkm", "fpkm_uq"];

// // //   // Generate cache key based on current filters
// // //   const cacheKey = useMemo(
// // //     () => {
// // //       const key = generateCacheKey({
// // //         cancerSite: rawParams.cancerSite,
// // //         cancerTypes: rawParams.cancerTypes,
// // //         normalizationMethod,
// // //         selectedNoiseMetrics: selectedNoiseMetrics.sort(),
// // //       });
// // //       console.log("Generated cacheKey:", key);
// // //       return key;
// // //     },
// // //     [rawParams.cancerSite, rawParams.cancerTypes, normalizationMethod, selectedNoiseMetrics, generateCacheKey]
// // //   );

// // //   // Check cache and update filters
// // //   const updateFilters = useCallback(
// // //     (newFilters: {
// // //       normalizationMethod?: string;
// // //       selectedNoiseMetrics?: string[];
// // //     }) => {
// // //       if (filterTimeoutRef.current) {
// // //         clearTimeout(filterTimeoutRef.current);
// // //       }
// // //       filterTimeoutRef.current = setTimeout(() => {
// // //         const newNormalization = newFilters.normalizationMethod || normalizationMethod;
// // //         const newMetrics = newFilters.selectedNoiseMetrics || selectedNoiseMetrics;
// // //         const newCacheKey = generateCacheKey({
// // //           cancerSite: rawParams.cancerSite,
// // //           cancerTypes: rawParams.cancerTypes,
// // //           normalizationMethod: newNormalization,
// // //           selectedNoiseMetrics: newMetrics.sort(),
// // //         });

// // //         console.log("updateFilters - New cacheKey:", newCacheKey, "New filters:", { newNormalization, newMetrics });

// // //         // Check cache for the new filter combination
// // //         const cachedData = getCachedData(newCacheKey);
// // //         if (cachedData && cachedData.length > 0) {
// // //           console.log("Cache hit for:", newCacheKey, "Data length:", cachedData.length);
// // //           setTumorData(cachedData);
// // //           setTotalTumorSamples(cachedData.length);
// // //           setNormalizationMethod(newNormalization);
// // //           setSelectedNoiseMetrics(newMetrics);
// // //           setIsLoading(false);
// // //         } else {
// // //           console.log("Cache miss for:", newCacheKey, "Updating filters and triggering fetch");
// // //           setNormalizationMethod(newNormalization);
// // //           setSelectedNoiseMetrics(newMetrics);
// // //         }
// // //       }, 500);
// // //     },
// // //     [rawParams.cancerSite, rawParams.cancerTypes, normalizationMethod, selectedNoiseMetrics, getCachedData, generateCacheKey]
// // //   );

// // //   // const handleFilterChange = useCallback(
// // //   //   (filterId: string, value: string[]) => {
// // //   //     console.log("handleFilterChange:", { filterId, value });
// // //   //     if (filterId === "noiseMetrics") {
// // //   //       updateFilters({ selectedNoiseMetrics: value });
// // //   //     }
// // //   //   },
// // //   //   [updateFilters]
// // //   // );

// // //     const handleFilterChange = useCallback(
// // //   (filterId: string, value: string[]) => {
// // //     console.log("handleFilterChange:", { filterId, value });
// // //     if (filterId === "noiseMetrics") {
// // //       // 🔒 Prevent < 1 selection
// // //       if (value.length === 0) {
// // //         console.warn("At least one noise metric must remain selected.");
// // //         return; // do nothing if user tries to deselect all
// // //       }
// // //       updateFilters({ selectedNoiseMetrics: value });
// // //     }
// // //   },
// // //   [updateFilters]
// // // );
// // //   // const fetchTumorExpressionData = useCallback(
// // //   //   async ({
// // //   //     cancerSite,
// // //   //     cancerTypes,
// // //   //     normalizationMethod,
// // //   //     selectedNoiseMetrics,
// // //   //   }: {
// // //   //     cancerSite: string;
// // //   //     cancerTypes: string[];
// // //   //     normalizationMethod: string;
// // //   //     selectedNoiseMetrics: string[];
// // //   //   }) => {
// // //   //     console.log("fetchTumorExpressionData called with:", { cancerSite, cancerTypes, normalizationMethod, selectedNoiseMetrics });
// // //   //     if (!cancerSite || !selectedNoiseMetrics.length || isLoading) {
// // //   //       console.warn("Invalid parameters or already loading:", { cancerSite, selectedNoiseMetrics, isLoading });
// // //   //       setErrorMessage("Missing required parameters or already loading.");
// // //   //       setTumorData([]);
// // //   //       setIsLoading(false);
// // //   //       return;
// // //   //     }

// // //   //     setIsLoading(true);
// // //   //     let sampleToCancerTypeMap: { [sampleId: number]: SampleInfo } = {};

// // //   //     try {
// // //   //       // Double-check cache to avoid race conditions
// // //   //       const cacheKey = generateCacheKey({
// // //   //         cancerSite,
// // //   //         cancerTypes,
// // //   //         normalizationMethod,
// // //   //         selectedNoiseMetrics: selectedNoiseMetrics.sort(),
// // //   //       });
// // //   //       const cachedData = getCachedData(cacheKey);
// // //   //       if (cachedData && cachedData.length > 0) {
// // //   //         console.log("Cache hit in fetchTumorExpressionData:", cacheKey, "Data length:", cachedData.length);
// // //   //         setTumorData(cachedData);
// // //   //         setTotalTumorSamples(cachedData.length);
// // //   //         setIsLoading(false);
// // //   //         return;
// // //   //       }
// // //   //       console.log("Cache miss in fetchTumorExpressionData:", cacheKey);

// // //   //       // Fetch cancer site and sample information from Supabase
// // //   //       const { data: siteRows, error: siteRowsErr } = await supabase
// // //   //         .from("Sites")
// // //   //         .select("id, name")
// // //   //         .eq("name", cancerSite);

// // //   //       if (siteRowsErr) {
// // //   //         console.error("Failed to fetch cancer site:", siteRowsErr);
// // //   //         setErrorMessage("Failed to load cancer site data.");
// // //   //         setTumorData([]);
// // //   //         setIsLoading(false);
// // //   //         return;
// // //   //       }

// // //   //       const site = siteRows?.[0];
// // //   //       const cancerSiteId = site?.id;

// // //   //       const { data: cancerTypeRows, error: cancerTypeErr } =
// // //   //         cancerTypes.length > 0
// // //   //           ? await supabase
// // //   //               .from("cancer_types")
// // //   //               .select("id, tcga_code, site_id")
// // //   //               .in("tcga_code", cancerTypes)
// // //   //               .eq("site_id", cancerSiteId)
// // //   //           : await supabase
// // //   //               .from("cancer_types")
// // //   //               .select("id, tcga_code, site_id")
// // //   //               .eq("site_id", cancerSiteId);

// // //   //       if (cancerTypeErr) {
// // //   //         console.error("Failed to fetch cancer_type ids:", cancerTypeErr);
// // //   //         setErrorMessage("Failed to load cancer types.");
// // //   //         setTumorData([]);
// // //   //         setIsLoading(false);
// // //   //         return;
// // //   //       }

// // //   //       const validCancerTypeIds = cancerTypeRows?.map((row) => row.id);

// // //   //       const { data: sampleRows, error: sampleErr } = await supabase
// // //   //         .from("samples")
// // //   //         .select("id, sample_barcode, cancer_type_id, sample_type")
// // //   //         .eq("sample_type", "tumor")
// // //   //         .in("cancer_type_id", validCancerTypeIds);

// // //   //       if (sampleErr) {
// // //   //         console.error("Failed to fetch matching samples:", sampleErr);
// // //   //         setErrorMessage("Failed to load sample data.");
// // //   //         setTumorData([]);
// // //   //         setIsLoading(false);
// // //   //         return;
// // //   //       }

// // //   //       sampleToCancerTypeMap = {};
// // //   //       sampleRows.forEach((sample) => {
// // //   //         const type = cancerTypeRows.find((ct) => ct.id === sample.cancer_type_id);
// // //   //         sampleToCancerTypeMap[sample.id] = {
// // //   //           barcode: sample.sample_barcode,
// // //   //           cancerType: type?.tcga_code || "Unknown",
// // //   //         };
// // //   //       });

// // //   //       setSampleToCancerType(sampleToCancerTypeMap);
// // //   //       setTotalTumorSamples(sampleRows.length);

// // //   //       const validMetrics = ["DEPTH2", "tITH"];
// // //   //       const metrics = selectedNoiseMetrics.filter((metric) => validMetrics.includes(metric));
// // //   //       if (metrics.length === 0) {
// // //   //         console.error(`Invalid metrics: ${selectedNoiseMetrics.join(", ")}. Valid options: ${validMetrics.join(", ")}`);
// // //   //         setErrorMessage("Invalid metrics selected.");
// // //   //         setTumorData([]);
// // //   //         setIsLoading(false);
// // //   //         return;
// // //   //       }

// // //   //       const sampleBarcodes = sampleRows.map((row) => row.sample_barcode);

// // //   //       // Fetch data only for the current normalization method
// // //   //       const promises: Promise<{ metric: string; normMethod: string; data: any }>[] = [];
// // //   //       for (const metric of metrics) {
// // //   //         console.log(`Fetching API for metric: ${metric}, normalization: ${normalizationMethod}`);
// // //   //         promises.push(
// // //   //           fetch(`/api/TH-metrics?cancer=${cancerSite}&method=${normalizationMethod}&metric=${metric}&sample_ids=${sampleBarcodes.join(",")}`)
// // //   //           // fetch(`/api/TH-metrics?cancer=${cancerSite}&method=${normalizationMethod}&metric=${metric}}`)
// // //   //             .then((response) => {
// // //   //               if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
// // //   //               return response.json();
// // //   //             })
// // //   //             .then((data) => ({ metric, normMethod: normalizationMethod, data: data.log2[normalizationMethod] || [] }))
// // //   //             .catch((error) => {
// // //   //               console.error(`Error fetching ${metric} (${normalizationMethod}):`, error);
// // //   //               setErrorMessage(`Failed to fetch ${metric} data for ${normalizationMethod}.`);
// // //   //               return { metric, normMethod: normalizationMethod, data: [] };
// // //   //             })
// // //   //         );
// // //   //       }

// // //   //       const metricResults = await Promise.all(promises);
// // //   //       const dataByNormalization: { [normMethod: string]: { [sampleId: string]: TumorData } } = {
// // //   //         [normalizationMethod]: {},
// // //   //       };
// // //   //       const supabaseUpsertData: {
// // //   //         [metric: string]: { sample_id: string; tpm: number | null; fpkm: number | null; fpkm_uq: number | null }[];
// // //   //     } = { DEPTH2: [], tITH: [] };

// // //   //       for (const { metric, normMethod, data } of metricResults) {
// // //   //         if (data && data.length > 0) {
// // //   //           for (const item of data) {
// // //   //             const sampleBarcode = item.sample_id;
// // //   //             const supabaseSampleId = Object.keys(sampleToCancerTypeMap).find(
// // //   //               (key) => sampleToCancerTypeMap[key].barcode === sampleBarcode
// // //   //             );

// // //   //             if (!supabaseSampleId) {
// // //   //               console.warn(`No matching Supabase sample_id for sample_barcode ${sampleBarcode}`);
// // //   //               continue;
// // //   //             }

// // //   //             const sampleInfo = sampleToCancerTypeMap[supabaseSampleId];
// // //   //             if (cancerTypes.length > 0 && !cancerTypes.includes(sampleInfo.cancerType)) continue;

// // //   //             const mapKey = supabaseSampleId;
// // //   //             if (!dataByNormalization[normMethod][mapKey]) {
// // //   //               dataByNormalization[normMethod][mapKey] = {
// // //   //                 sample: sampleInfo.barcode,
// // //   //                 cancer_type: sampleInfo.cancerType || "Unknown",
// // //   //               };
// // //   //             }
// // //   //             const fieldName = noiseMetrics[metric as keyof typeof noiseMetrics] || metric.toLowerCase();
// // //   //             const value = item[normMethod] != null ? item[normMethod] : null;
// // //   //             dataByNormalization[normMethod][mapKey][fieldName] = value;

// // //   //             // Prepare data for Supabase upsert
// // //   //             let existingEntry = supabaseUpsertData[metric].find((entry) => entry.sample_id === supabaseSampleId);
// // //   //             if (!existingEntry) {
// // //   //               existingEntry = { sample_id: supabaseSampleId, tpm: null, fpkm: null, fpkm_uq: null };
// // //   //               supabaseUpsertData[metric].push(existingEntry);
// // //   //             }
// // //   //             existingEntry[normalizationMethod] = value;
// // //   //           }
// // //   //         }
// // //   //       }

// // //   //       // Upsert API data to Supabase for current normalization method
// // //   //       for (const metric of metrics) {
// // //   //         const tableName = metric === "DEPTH2" ? "depth2" : "tith_scores";
// // //   //         const dataToUpsert = supabaseUpsertData[metric];

// // //   //         if (dataToUpsert.length > 0) {
// // //   //           const { data: existingRows, error: fetchError } = await supabase
// // //   //             .from(tableName)
// // //   //             .select("id, sample_id")
// // //   //             .in("sample_id", dataToUpsert.map((entry) => entry.sample_id));

// // //   //           if (fetchError) {
// // //   //             console.error(`Failed to fetch existing rows from ${tableName}:`, fetchError);
// // //   //             setErrorMessage(`Failed to fetch existing ${metric} data from Supabase.`);
// // //   //             continue;
// // //   //           }

// // //   //           const upsertData = dataToUpsert.map((entry) => ({
// // //   //             sample_id: entry.sample_id,
// // //   //             [normalizationMethod]: entry[normalizationMethod],
// // //   //           }));

// // //   //           const { error: upsertError } = await supabase
// // //   //             .from(tableName)
// // //   //             .upsert(upsertData, { onConflict: "sample_id" });

// // //   //           if (upsertError) {
// // //   //             console.error(`Failed to upsert ${metric} data into ${tableName}:`, upsertError);
// // //   //             setErrorMessage(`Failed to upsert ${metric} data into Supabase.`);
// // //   //             continue;
// // //   //           }
// // //   //         }
// // //   //       }

// // //   //       // Cache and set data for the current normalization method
// // //   //       const processedData = Object.values(dataByNormalization[normalizationMethod]).filter((sampleData) => {
// // //   //         const hasValidMetric = metrics.some((metric) => {
// // //   //           const fieldName = noiseMetrics[metric as keyof typeof noiseMetrics] || metric.toLowerCase();
// // //   //           const value = sampleData[fieldName];
// // //   //           return value !== null && !isNaN(value);
// // //   //         });
// // //   //         return hasValidMetric;
// // //   //       });

// // //   //       console.log("Caching data for:", cacheKey, "Data length:", processedData.length);
// // //   //       setCachedData(cacheKey, processedData);
// // //   //       setTumorData(processedData);
// // //   //       setTotalTumorSamples(processedData.length);
// // //   //       setIsLoading(false);
// // //   //     } catch (error) {
// // //   //       console.error("Error during data fetch:", error);
// // //   //       setErrorMessage("Failed to load data. Please check the cancer site or sample data and try again.");
// // //   //       setTumorData([]);
// // //   //       setIsLoading(false);
// // //   //     }
// // //   //   },
// // //   //   [getCachedData, setCachedData, generateCacheKey, isLoading]
// // //   // );

// // //   const fetchTumorExpressionData = useCallback(
// // //   async ({
// // //     cancerSite,
// // //     cancerTypes,
// // //     normalizationMethod,
// // //     selectedNoiseMetrics,
// // //   }: {
// // //     cancerSite: string;
// // //     cancerTypes: string[];
// // //     normalizationMethod: string;
// // //     selectedNoiseMetrics: string[];
// // //   }) => {
// // //     console.log("fetchTumorExpressionData called with:", { cancerSite, cancerTypes, normalizationMethod, selectedNoiseMetrics });
// // //     if (!cancerSite || !selectedNoiseMetrics.length || isLoading) {
// // //       console.warn("Invalid parameters or already loading:", { cancerSite, selectedNoiseMetrics, isLoading });
// // //       setErrorMessage("Missing required parameters or already loading.");
// // //       setTumorData([]);
// // //       setIsLoading(false);
// // //       return;
// // //     }

// // //     setIsLoading(true);
// // //     let sampleToCancerTypeMap: { [sampleId: number]: SampleInfo } = {};

// // //     try {
// // //       // Double-check cache to avoid race conditions
// // //       const cacheKey = generateCacheKey({
// // //         cancerSite,
// // //         cancerTypes,
// // //         normalizationMethod,
// // //         selectedNoiseMetrics: selectedNoiseMetrics.sort(),
// // //       });
// // //       const cachedData = getCachedData(cacheKey);
// // //       if (cachedData && cachedData.length > 0) {
// // //         console.log("Cache hit in fetchTumorExpressionData:", cacheKey, "Data length:", cachedData.length);
// // //         setTumorData(cachedData);
// // //         setTotalTumorSamples(cachedData.length);
// // //         setIsLoading(false);
// // //         return;
// // //       }
// // //       console.log("Cache miss in fetchTumorExpressionData:", cacheKey);

// // //       // Fetch cancer site and sample information from Supabase
// // //       const { data: siteRows, error: siteRowsErr } = await supabase
// // //         .from("Sites")
// // //         .select("id, name")
// // //         .eq("name", cancerSite);

// // //       if (siteRowsErr) {
// // //         console.error("Failed to fetch cancer site:", siteRowsErr);
// // //         setErrorMessage("Failed to load cancer site data.");
// // //         setTumorData([]);
// // //         setIsLoading(false);
// // //         return;
// // //       }

// // //       const site = siteRows?.[0];
// // //       const cancerSiteId = site?.id;

// // //       const { data: cancerTypeRows, error: cancerTypeErr } =
// // //         cancerTypes.length > 0
// // //           ? await supabase
// // //               .from("cancer_types")
// // //               .select("id, tcga_code, site_id")
// // //               .in("tcga_code", cancerTypes)
// // //               .eq("site_id", cancerSiteId)
// // //           : await supabase
// // //               .from("cancer_types")
// // //               .select("id, tcga_code, site_id")
// // //               .eq("site_id", cancerSiteId);

// // //       if (cancerTypeErr) {
// // //         console.error("Failed to fetch cancer_type ids:", cancerTypeErr);
// // //         setErrorMessage("Failed to load cancer types.");
// // //         setTumorData([]);
// // //         setIsLoading(false);
// // //         return;
// // //       }

// // //       const validCancerTypeIds = cancerTypeRows?.map((row) => row.id);

// // //       const { data: sampleRows, error: sampleErr } = await supabase
// // //         .from("samples")
// // //         .select("id, sample_barcode, cancer_type_id, sample_type")
// // //         .eq("sample_type", "tumor")
// // //         .in("cancer_type_id", validCancerTypeIds);

// // //       if (sampleErr) {
// // //         console.error("Failed to fetch matching samples:", sampleErr);
// // //         setErrorMessage("Failed to load sample data.");
// // //         setTumorData([]);
// // //         setIsLoading(false);
// // //         return;
// // //       }

// // //       sampleToCancerTypeMap = {};
// // //       sampleRows.forEach((sample) => {
// // //         const type = cancerTypeRows.find((ct) => ct.id === sample.cancer_type_id);
// // //         sampleToCancerTypeMap[sample.id] = {
// // //           barcode: sample.sample_barcode,
// // //           cancerType: type?.tcga_code || "Unknown",
// // //         };
// // //       });

// // //       setSampleToCancerType(sampleToCancerTypeMap);
// // //       setTotalTumorSamples(sampleRows.length);

// // //       const validMetrics = ["DEPTH2", "tITH"];
// // //       const metrics = selectedNoiseMetrics.filter((metric) => validMetrics.includes(metric));
// // //       if (metrics.length === 0) {
// // //         console.error(`Invalid metrics: ${selectedNoiseMetrics.join(", ")}. Valid options: ${validMetrics.join(", ")}`);
// // //         setErrorMessage("Invalid metrics selected.");
// // //         setTumorData([]);
// // //         setIsLoading(false);
// // //         return;
// // //       }

// // //       const sampleBarcodes = sampleRows.map((row) => row.sample_barcode);

// // //       // Fetch data only for the current normalization method
// // //       const promises: Promise<{ metric: string; normMethod: string; data: any }>[] = [];
// // //       for (const metric of metrics) {
// // //         console.log(`Fetching API for metric: ${metric}, normalization: ${normalizationMethod}`);
// // //         promises.push(
// // //           fetch(`/api/TH-metrics?cancer=${cancerSite}&method=${normalizationMethod}&metric=${metric}`)
// // //             .then((response) => {
// // //               if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
// // //               return response.json();
// // //             })
// // //             .then((data) => {
// // //               // Filter API response to include only matching sample_barcodes
// // //               const filteredData = data.log2[normalizationMethod]?.filter((item: any) =>
// // //                 sampleBarcodes.includes(item.sample_id)
// // //               ) || [];
// // //               return { metric, normMethod: normalizationMethod, data: filteredData };
// // //             })
// // //             .catch((error) => {
// // //               console.error(`Error fetching ${metric} (${normalizationMethod}):`, error);
// // //               setErrorMessage(`Failed to fetch ${metric} data for ${normalizationMethod}.`);
// // //               return { metric, normMethod: normalizationMethod, data: [] };
// // //             })
// // //         );
// // //       }

// // //       const metricResults = await Promise.all(promises);
// // //       const dataByNormalization: { [normMethod: string]: { [sampleId: string]: TumorData } } = {
// // //         [normalizationMethod]: {},
// // //       };
// // //       const supabaseUpsertData: {
// // //         [metric: string]: { sample_id: string; tpm: number | null; fpkm: number | null; fpkm_uq: number | null }[];
// // //       } = { DEPTH2: [], tITH: [] };

// // //       for (const { metric, normMethod, data } of metricResults) {
// // //         if (data && data.length > 0) {
// // //           for (const item of data) {
// // //             const sampleBarcode = item.sample_id;
// // //             const supabaseSampleId = Object.keys(sampleToCancerTypeMap).find(
// // //               (key) => sampleToCancerTypeMap[key].barcode === sampleBarcode
// // //             );

// // //             if (!supabaseSampleId) {
// // //               console.warn(`No matching Supabase sample_id for sample_barcode ${sampleBarcode}`);
// // //               continue;
// // //             }

// // //             const sampleInfo = sampleToCancerTypeMap[supabaseSampleId];
// // //             if (cancerTypes.length > 0 && !cancerTypes.includes(sampleInfo.cancerType)) continue;

// // //             const mapKey = supabaseSampleId;
// // //             if (!dataByNormalization[normMethod][mapKey]) {
// // //               dataByNormalization[normMethod][mapKey] = {
// // //                 sample: sampleInfo.barcode,
// // //                 cancer_type: sampleInfo.cancerType || "Unknown",
// // //               };
// // //             }
// // //             const fieldName = noiseMetrics[metric as keyof typeof noiseMetrics] || metric.toLowerCase();
// // //             const value = item[normMethod] != null ? item[normMethod] : null;
// // //             dataByNormalization[normMethod][mapKey][fieldName] = value;

// // //             // Prepare data for Supabase upsert
// // //             let existingEntry = supabaseUpsertData[metric].find((entry) => entry.sample_id === supabaseSampleId);
// // //             if (!existingEntry) {
// // //               existingEntry = { sample_id: supabaseSampleId, tpm: null, fpkm: null, fpkm_uq: null };
// // //               supabaseUpsertData[metric].push(existingEntry);
// // //             }
// // //             existingEntry[normalizationMethod] = value;
// // //           }
// // //         }
// // //       }

// // //       // Upsert API data to Supabase for current normalization method
// // //       for (const metric of metrics) {
// // //         const tableName = metric === "DEPTH2" ? "depth2_scores" : "tith_scores";
// // //         const dataToUpsert = supabaseUpsertData[metric];

// // //         if (dataToUpsert.length > 0) {
// // //           const { data: existingRows, error: fetchError } = await supabase
// // //             .from(tableName)
// // //             .select("id, sample_id")
// // //             .in("sample_id", dataToUpsert.map((entry) => entry.sample_id));

// // //           if (fetchError) {
// // //             console.error(`Failed to fetch existing rows from ${tableName}:`, fetchError);
// // //             // setErrorMessage(`Failed to fetch existing ${metric} data from Supabase.`);
// // //             continue;
// // //           }

// // //           const upsertData = dataToUpsert.map((entry) => ({
// // //             sample_id: entry.sample_id,
// // //             [normalizationMethod]: entry[normalizationMethod],
// // //           }));

// // //           const { error: upsertError } = await supabase
// // //             .from(tableName)
// // //             .upsert(upsertData, { onConflict: "sample_id" });

// // //           if (upsertError) {
// // //             console.error(`Failed to upsert ${metric} data into ${tableName}:`, upsertError);
// // //             setErrorMessage(`Failed to upsert ${metric} data into Supabase.`);
// // //             continue;
// // //           }
// // //         }
// // //       }

// // //       // Cache and set data for the current normalization method
// // //       const processedData = Object.values(dataByNormalization[normalizationMethod]).filter((sampleData) => {
// // //         const hasValidMetric = metrics.some((metric) => {
// // //           const fieldName = noiseMetrics[metric as keyof typeof noiseMetrics] || metric.toLowerCase();
// // //           const value = sampleData[fieldName];
// // //           return value !== null && !isNaN(value);
// // //         });
// // //         return hasValidMetric;
// // //       });

// // //       console.log("Caching data for:", cacheKey, "Data length:", processedData.length);
// // //       setCachedData(cacheKey, processedData);
// // //       setTumorData(processedData);
// // //       setTotalTumorSamples(processedData.length);
// // //       setIsLoading(false);
// // //     } catch (error) {
// // //       console.error("Error during data fetch:", error);
// // //       setErrorMessage("Failed to load data. Please check the cancer site or sample data and try again.");
// // //       setTumorData([]);
// // //       setIsLoading(false);
// // //     }
// // //   },
// // //   [getCachedData, setCachedData, generateCacheKey, isLoading]
// // // );
// // //   const debouncedFetch = useMemo(() => debounce(fetchTumorExpressionData, 500), [fetchTumorExpressionData]);

// // //   useEffect(() => {
// // //     console.log("useEffect triggered with cacheKey:", cacheKey);
// // //     // Check cache before triggering fetch
// // //     const cachedData = getCachedData(cacheKey);
// // //     if (cachedData && cachedData.length > 0) {
// // //       console.log("Cache hit in useEffect:", cacheKey, "Data length:", cachedData.length);
// // //       setTumorData(cachedData);
// // //       setTotalTumorSamples(cachedData.length);
// // //       setIsLoading(false);
// // //     } else if (!isLoading) {
// // //       console.log("Cache miss in useEffect, triggering fetch for:", cacheKey);
// // //       debouncedFetch({
// // //         cancerSite: rawParams.cancerSite,
// // //         cancerTypes: rawParams.cancerTypes,
// // //         normalizationMethod,
// // //         selectedNoiseMetrics,
// // //       });
// // //     }
// // //     return () => debouncedFetch.cancel();
// // //   }, [cacheKey, getCachedData, debouncedFetch, isLoading, rawParams.cancerSite, rawParams.cancerTypes, normalizationMethod, selectedNoiseMetrics]);

// // //   const customFilters = [
// // //     {
// // //       title: "TH Metrics",
// // //       id: "noiseMetrics",
// // //       type: "checkbox" as const,
// // //       options: allNoiseMetrics.map((metric) => ({
// // //         id: metric,
// // //         label: metric,
// // //         description:
// // //           metric === "DEPTH2"
// // //             ? "DEPTH2 measures the depth of tumor heterogeneity based on gene expression variability."
// // //             : "tITH quantifies intra-tumor heterogeneity using transcriptomic profiles.",
// // //         referenceLink: "https://example.com/paper", // Replace with actual paper URL
// // //       })),
// // //       isMasterCheckbox: true,
// // //       defaultOpen: false,
// // //     },
// // //   ];

// // //   const downloadData = useCallback(() => {
// // //     const keys = ["sample", "cancer_type", "depth2", "tith"].filter((key) => {
// // //       if (key === "depth2" && !selectedNoiseMetrics.includes("DEPTH2")) return false;
// // //       if (key === "tith" && !selectedNoiseMetrics.includes("tITH")) return false;
// // //       return true;
// // //     });

// // //     const headers = keys.join(",");
// // //     const rows = tumorData.map((row) =>
// // //       keys
// // //         .map((key) => {
// // //           const value = row[key as keyof TumorData];
// // //           return typeof value === "number" ? value.toFixed(6) : value || "";
// // //         })
// // //         .join(",")
// // //     );

// // //     const content = [headers, ...rows].join("\n");
// // //     const blob = new Blob([content], { type: "text/csv" });
// // //     const url = URL.createObjectURL(blob);
// // //     const a = document.createElement("a");
// // //     a.href = url;
// // //     a.download = `tumor_analysis_${rawParams.cancerSite}_${normalizationMethod}_${Date.now()}.csv`;
// // //     a.click();
// // //     URL.revokeObjectURL(url);
// // //   }, [tumorData, rawParams.cancerSite, normalizationMethod, selectedNoiseMetrics]);

// // //   return (
// // //     <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-yellow-50 flex flex-col">
// // //       <Header />
// // //       <main className="flex-grow">
// // //         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
// // //           <div className="grid grid-cols-[320px_1fr] gap-6">
// // //             <FilterPanel
// // //               normalizationMethod={normalizationMethod}
// // //               setNormalizationMethod={(value) => updateFilters({ normalizationMethod: value })}
// // //               customFilters={customFilters}
// // //               onFilterChange={handleFilterChange}
// // //               selectedValues={{
// // //                 noiseMetrics: selectedNoiseMetrics,
// // //               }}
// // //             />
// // //             <div className="flex-1">
// // //               {errorMessage && <div className="text-red-600 mb-4">{errorMessage}</div>}
// // //               {isLoading ? (
// // //                 <LoadingSpinner message="Please wait..." />
// // //               ) : tumorData.length === 0 ? (
// // //                 <LoadingSpinner message="Please wait..." />
// // //               ) : (
// // //                 <>
// // //                   <Link
// // //                     to="/tumour-analysis"
// // //                     className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-6 transition-colors"
// // //                   >
// // //                     <ArrowLeft className="h-4 w-4 mr-2" />
// // //                     Back to Tumor Analysis
// // //                   </Link>
// // //                   <div className="mb-8">
// // //                     <h2 className="text-4xl font-bold text-blue-900 mb-6">
// // //                       Results for Tumor Analysis
// // //                     </h2>
// // //                     <div className="overflow-x-auto mb-6">
// // //                       <table className="min-w-full bg-white border border-gray-200 rounded-lg shadow-sm">
// // //                         <tbody>
// // //                           <tr className="border-b">
// // //                             <th className="text-left py-3 pl-4 text-blue-700 font-semibold w-1/6 border-r border-gray-300">Normalization</th>
// // //                             <td className="py-3 pl-2 pr-4 text-blue-700 text-left align-top">
// // //                               Log<sub>2</sub>({normalizationMethod.toUpperCase()} + 1)
// // //                             </td>
// // //                           </tr>
// // //                           <tr>
// // //                             <th className="text-left py-3 pl-4 text-blue-700 font-semibold w-1/6 border-r border-gray-300">Cancer Site</th>
// // //                             <td className="py-3 pl-2 pr-4 text-blue-700 text-left align-top">
// // //                               {rawParams.cancerSite} {rawParams.cancerTypes.length > 0 && `(${rawParams.cancerTypes.join(", ")})`}
// // //                             </td>
// // //                           </tr>
// // //                         </tbody>
// // //                       </table>
// // //                     </div>
// // //                     <div className="flex justify-center items-center">
// // //                       <Card className="border-0 shadow-lg w-full">
// // //                         <CardContent className="flex flex-col items-center p-4 text-center">
// // //                           <Users className="h-6 w-6 text-red-600 mb-2" />
// // //                           <div className="text-2xl font-bold text-red-600">{totalTumorSamples}</div>
// // //                           <div className="text-xs text-gray-600">Total Tumor Samples</div>
// // //                         </CardContent>
// // //                       </Card>
// // //                     </div>
// // //                   </div>
// // //                   {(selectedNoiseMetrics.includes("DEPTH2") || selectedNoiseMetrics.includes("tITH")) && (
// // //                     <div className="mb-8">
// // //                       <div className="flex justify-between items-center mb-4">
// // //                         <h3 className="text-2xl font-bold text-blue-900">Statistical Metrics</h3>
// // //                         <button
// // //                           onClick={() => setIsStatisticalMetricsOpen((prev) => !prev)}
// // //                           className="text-blue-900"
// // //                         >
// // //                           {isStatisticalMetricsOpen ? (
// // //                             <ChevronDown className="h-6 w-6" />
// // //                           ) : (
// // //                             <ChevronRight className="h-6 w-6" />
// // //                           )}
// // //                         </button>
// // //                       </div>
// // //                       {isStatisticalMetricsOpen && (
// // //                         <>
// // //                           {["DEPTH2", "tITH"].map((metric) =>
// // //                             selectedNoiseMetrics.includes(metric) ? (
// // //                               <CollapsibleCard
// // //                                 key={metric}
// // //                                 title={`${metric} Scores`}
// // //                                 defaultOpen={metricOpenState[metric.toLowerCase()]}
// // //                                 onToggle={(open) =>
// // //                                   setMetricOpenState((prev) => ({
// // //                                     ...prev,
// // //                                     [metric.toLowerCase()]: open,
// // //                                   }))
// // //                                 }
// // //                                 className="mb-4"
// // //                               >
// // //                                 <PlotlyBoxPlot
// // //                                   data={tumorData}
// // //                                   xKey={noiseMetrics[metric as keyof typeof noiseMetrics]}
// // //                                   yLabel={`${metric} (${normalizationMethod})`}
// // //                                   normalizationMethod={normalizationMethod}
// // //                                   selectedGroups={[...new Set(tumorData.map((d) => d.cancer_type))]}
// // //                                   title={`${metric} Distribution (${normalizationMethod})`}
// // //                                   colorMap={{}}
// // //                                 />
// // //                               </CollapsibleCard>
// // //                             ) : null
// // //                           )}
// // //                           {tumorData.length > 0 && (
// // //                             <div className="mt-2">
// // //                               <CollapsibleCard
// // //                                 title="Data Table"
// // //                                 className="h-full"
// // //                                 downloadButton={
// // //                                   <Button
// // //                                     onClick={() => downloadData()}
// // //                                     variant="outline"
// // //                                     size="sm"
// // //                                     className="h-6 px-2 text-xs"
// // //                                   >
// // //                                     <Download className="h-4 w-4 mr-2" /> Download CSV
// // //                                   </Button>
// // //                                 }
// // //                               >
// // //                                 <DataTable
// // //                                   data={tumorData}
// // //                                   columns={[
// // //                                     {
// // //                                       key: "sample",
// // //                                       header: "Sample",
// // //                                       sortable: true,
// // //                                     },
// // //                                     {
// // //                                       key: "cancer_type",
// // //                                       header: "Cancer Project",
// // //                                       sortable: true,
// // //                                     },
// // //                                     ...(selectedNoiseMetrics.includes("DEPTH2")
// // //                                       ? [
// // //                                           {
// // //                                             key: "depth2",
// // //                                             header: `DEPTH2 (${normalizationMethod})`,
// // //                                             sortable: true,
// // //                                             render: (value) => (typeof value === "number" ? value.toFixed(4) : value),
// // //                                           },
// // //                                         ]
// // //                                       : []),
// // //                                     ...(selectedNoiseMetrics.includes("tITH")
// // //                                       ? [
// // //                                           {
// // //                                             key: "tith",
// // //                                             header: `tITH (${normalizationMethod})`,
// // //                                             sortable: true,
// // //                                             render: (value) => (typeof value === "number" ? value.toFixed(4) : value),
// // //                                           },
// // //                                         ]
// // //                                       : []),
// // //                                   ]}
// // //                                   defaultSortKey="sample"
// // //                                   scrollHeight="400px"
// // //                                   stickyHeader={true}
// // //                                 />
// // //                               </CollapsibleCard>
// // //                             </div>
// // //                           )}
// // //                         </>
// // //                       )}
// // //                     </div>
// // //                   )}
// // //                 </>
// // //               )}
// // //             </div>
// // //           </div>
// // //         </div>
// // //       </main>
// // //       <Footer />
// // //     </div>
// // //   );
// // // };

// // // export default TumourResults;

// // import React, { useMemo, useCallback, useReducer, useEffect, useState, useRef } from "react";
// // import { useSearchParams, Link } from "react-router-dom";
// // import supabase from "@/supabase-client";
// // import { Card, CardContent } from "@/components/ui/card";
// // import { Button } from "@/components/ui/button";
// // import { ArrowLeft, Download, ChevronRight, ChevronDown, Users } from "lucide-react";
// // import { LoadingSpinner } from "@/components/ui/loadingSpinner";
// // import Header from "@/components/header";
// // import Footer from "@/components/footer";
// // import { TumorData, SampleInfo } from "@/components/types/tumor";
// // import { useCache } from "@/hooks/use-cache";
// // import FilterPanel from "@/components/FilterPanel";
// // import { DataTable } from "@/components/ui/data-table";
// // import CollapsibleCard from "@/components/ui/collapsible-card";
// // import PlotlyBoxPlot from "@/components/charts/PlotlyTumorBoxPlot";

// // // Define interfaces for filter state
// // interface FilterState {
// //   normalizationMethod: string;
// //   selectedNoiseMetrics: string[];
// //   metricOpenState: Record<string, boolean>;
// //   isStatisticalMetricsOpen: boolean;
// // }

// // type FilterAction =
// //   | { type: "SET_NORMALIZATION"; payload: string }
// //   | { type: "SET_NOISE_METRICS"; payload: string[] }
// //   | { type: "TOGGLE_METRIC_SECTION"; payload: string }
// //   | { type: "TOGGLE_STATISTICAL_METRICS" };

// // const initialFilterState: FilterState = {
// //   normalizationMethod: "tpm",
// //   selectedNoiseMetrics: ["DEPTH2", "tITH"],
// //   metricOpenState: { depth2: true, tith: true },
// //   isStatisticalMetricsOpen: true,
// // };

// // const filterReducer = (state: FilterState, action: FilterAction): FilterState => {
// //   switch (action.type) {
// //     case "SET_NORMALIZATION":
// //       return { ...state, normalizationMethod: action.payload };
// //     case "SET_NOISE_METRICS":
// //       return { ...state, selectedNoiseMetrics: action.payload };
// //     case "TOGGLE_METRIC_SECTION":
// //       return {
// //         ...state,
// //         metricOpenState: { ...state.metricOpenState, [action.payload]: !state.metricOpenState[action.payload] },
// //       };
// //     case "TOGGLE_STATISTICAL_METRICS":
// //       return { ...state, isStatisticalMetricsOpen: !state.isStatisticalMetricsOpen };
// //     default:
// //       return state;
// //   }
// // };

// // // Define state for tumor results data
// // interface TumorResultsState {
// //   rawResultsData: TumorData[];
// //   resultsData: TumorData[];
// //   isLoading: boolean;
// //   error: string | null;
// //   totalTumorSamples: number;
// //   sampleToCancerType: { [sampleId: number]: SampleInfo };
// // }

// // const useTumorResultsData = (
// //   params: {
// //     cancerSite: string;
// //     cancerTypes: string[];
// //   },
// //   filterState: FilterState
// // ) => {
// //   const [state, setState] = useState<TumorResultsState>({
// //     rawResultsData: [],
// //     resultsData: [],
// //     isLoading: false,
// //     error: null,
// //     totalTumorSamples: 0,
// //     sampleToCancerType: {},
// //   });
// //   const { getCachedData, setCachedData, generateCacheKey } = useCache<TumorData[]>();
// //   const filterTimeoutRef = useRef<NodeJS.Timeout | null>(null);

// //   const noiseMetrics = { DEPTH2: "depth2", tITH: "tith" };
// //   const validMetrics = ["DEPTH2", "tITH"];

// //   const fetchData = useCallback(
// //     async ({
// //       cancerSite,
// //       cancerTypes,
// //       normalizationMethod,
// //       selectedNoiseMetrics,
// //     }: {
// //       cancerSite: string;
// //       cancerTypes: string[];
// //       normalizationMethod: string;
// //       selectedNoiseMetrics: string[];
// //     }) => {
// //       console.log("fetchTumorExpressionData called with:", {
// //         cancerSite,
// //         cancerTypes,
// //         normalizationMethod,
// //         selectedNoiseMetrics,
// //       });
// //       if (!cancerSite || !selectedNoiseMetrics.length || state.isLoading) {
// //         console.warn("Invalid parameters or already loading:", {
// //           cancerSite,
// //           selectedNoiseMetrics,
// //           isLoading: state.isLoading,
// //         });
// //         setState((prev) => ({
// //           ...prev,
// //           error: "Missing required parameters or already loading.",
// //           resultsData: [],
// //           isLoading: false,
// //         }));
// //         return;
// //       }

// //       setState((prev) => ({ ...prev, isLoading: true, error: null }));
// //       let sampleToCancerTypeMap: { [sampleId: number]: SampleInfo } = {};

// //       try {
// //         // Generate cache key (excluding selectedNoiseMetrics for broader caching)
// //         const cacheKey = generateCacheKey({
// //           cancerSite,
// //           cancerTypes,
// //           normalizationMethod,
// //         });
// //         const cachedData = getCachedData(cacheKey);
// //         if (cachedData && cachedData.length > 0) {
// //           console.log("Cache hit in fetchTumorExpressionData:", cacheKey, "Data length:", cachedData.length);
// //           setState((prev) => ({
// //             ...prev,
// //             rawResultsData: [
// //               ...prev.rawResultsData,
// //               ...cachedData.filter(
// //                 (d) =>
// //                   !prev.rawResultsData.some(
// //                     (existing) =>
// //                       existing.sample === d.sample &&
// //                       existing.cancer_type === d.cancer_type
// //                   )
// //               ),
// //             ],
// //             resultsData: cachedData.filter((sampleData) =>
// //               selectedNoiseMetrics.some((metric) => {
// //                 const fieldName = noiseMetrics[metric as keyof typeof noiseMetrics] || metric.toLowerCase();
// //                 const value = sampleData[fieldName];
// //                 return value !== null && !isNaN(value);
// //               })
// //             ),
// //             totalTumorSamples: cachedData.length,
// //             isLoading: false,
// //           }));
// //           return;
// //         }
// //         console.log("Cache miss in fetchTumorExpressionData:", cacheKey);

// //         const { data: siteRows, error: siteRowsErr } = await supabase
// //           .from("Sites")
// //           .select("id, name")
// //           .eq("name", cancerSite);

// //         if (siteRowsErr) {
// //           console.error("Failed to fetch cancer site:", siteRowsErr);
// //           setState((prev) => ({
// //             ...prev,
// //             error: "Failed to load cancer site data.",
// //             resultsData: [],
// //             isLoading: false,
// //           }));
// //           return;
// //         }

// //         const site = siteRows?.[0];
// //         const cancerSiteId = site?.id;

// //         const { data: cancerTypeRows, error: cancerTypeErr } =
// //           cancerTypes.length > 0
// //             ? await supabase
// //                 .from("cancer_types")
// //                 .select("id, tcga_code, site_id")
// //                 .in("tcga_code", cancerTypes)
// //                 .eq("site_id", cancerSiteId)
// //             : await supabase
// //                 .from("cancer_types")
// //                 .select("id, tcga_code, site_id")
// //                 .eq("site_id", cancerSiteId);

// //         if (cancerTypeErr) {
// //           console.error("Failed to fetch cancer_type ids:", cancerTypeErr);
// //           setState((prev) => ({
// //             ...prev,
// //             error: "Failed to load cancer types.",
// //             resultsData: [],
// //             isLoading: false,
// //           }));
// //           return;
// //         }

// //         const validCancerTypeIds = cancerTypeRows?.map((row) => row.id);

// //         const { data: sampleRows, error: sampleErr } = await supabase
// //           .from("samples")
// //           .select("id, sample_barcode, cancer_type_id, sample_type")
// //           .eq("sample_type", "tumor")
// //           .in("cancer_type_id", validCancerTypeIds);

// //         if (sampleErr) {
// //           console.error("Failed to fetch matching samples:", sampleErr);
// //           setState((prev) => ({
// //             ...prev,
// //             error: "Failed to load sample data.",
// //             resultsData: [],
// //             isLoading: false,
// //           }));
// //           return;
// //         }

// //         sampleToCancerTypeMap = {};
// //         sampleRows.forEach((sample) => {
// //           const type = cancerTypeRows.find((ct) => ct.id === sample.cancer_type_id);
// //           sampleToCancerTypeMap[sample.id] = {
// //             barcode: sample.sample_barcode,
// //             cancerType: type?.tcga_code || "Unknown",
// //           };
// //         });

// //         setState((prev) => ({ ...prev, sampleToCancerType: sampleToCancerTypeMap, totalTumorSamples: sampleRows.length }));

// //         const metrics = selectedNoiseMetrics.filter((metric) => validMetrics.includes(metric));
// //         if (metrics.length === 0) {
// //           console.error(`Invalid metrics: ${selectedNoiseMetrics.join(", ")}. Valid options: ${validMetrics.join(", ")}`);
// //           setState((prev) => ({
// //             ...prev,
// //             error: "Invalid metrics selected.",
// //             resultsData: [],
// //             isLoading: false,
// //           }));
// //           return;
// //         }

// //         const sampleBarcodes = sampleRows.map((row) => row.sample_barcode);

// //         const promises: Promise<{ metric: string; normMethod: string; data: any }>[] = [];
// //         for (const metric of validMetrics) { // Fetch all valid metrics to cache broadly
// //           console.log(`Fetching API for metric: ${metric}, normalization: ${normalizationMethod}`);
// //           promises.push(
// //             fetch(`/api/TH-metrics?cancer=${cancerSite}&method=${normalizationMethod}&metric=${metric}`)
// //               .then((response) => {
// //                 if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
// //                 return response.json();
// //               })
// //               .then((data) => {
// //                 const filteredData = data.log2[normalizationMethod]?.filter((item: any) =>
// //                   sampleBarcodes.includes(item.sample_id)
// //                 ) || [];
// //                 return { metric, normMethod: normalizationMethod, data: filteredData };
// //               })
// //               .catch((error) => {
// //                 console.error(`Error fetching ${metric} (${normalizationMethod}):`, error);
// //                 setState((prev) => ({ ...prev, error: `Failed to fetch ${metric} data for ${normalizationMethod}.` }));
// //                 return { metric, normMethod: normalizationMethod, data: [] };
// //               })
// //           );
// //         }

// //         const metricResults = await Promise.all(promises);
// //         const dataByNormalization: { [normMethod: string]: { [sampleId: string]: TumorData } } = {
// //           [normalizationMethod]: {},
// //         };
// //         const supabaseUpsertData: {
// //           [metric: string]: { sample_id: string; tpm: number | null; fpkm: number | null; fpkm_uq: number | null }[];
// //         } = { DEPTH2: [], tITH: [] };

// //         for (const { metric, normMethod, data } of metricResults) {
// //           if (data && data.length > 0) {
// //             for (const item of data) {
// //               const sampleBarcode = item.sample_id;
// //               const supabaseSampleId = Object.keys(sampleToCancerTypeMap).find(
// //                 (key) => sampleToCancerTypeMap[key].barcode === sampleBarcode
// //               );

// //               if (!supabaseSampleId) {
// //                 console.warn(`No matching Supabase sample_id for sample_barcode ${sampleBarcode}`);
// //                 continue;
// //               }

// //               const sampleInfo = sampleToCancerTypeMap[supabaseSampleId];
// //               if (cancerTypes.length > 0 && !cancerTypes.includes(sampleInfo.cancerType)) continue;

// //               const mapKey = supabaseSampleId;
// //               if (!dataByNormalization[normMethod][mapKey]) {
// //                 dataByNormalization[normMethod][mapKey] = {
// //                   sample: sampleInfo.barcode,
// //                   cancer_type: sampleInfo.cancerType || "Unknown",
// //                 };
// //               }
// //               const fieldName = noiseMetrics[metric as keyof typeof noiseMetrics] || metric.toLowerCase();
// //               const value = item[normMethod] != null ? item[normMethod] : null;
// //               dataByNormalization[normMethod][mapKey][fieldName] = value;

// //               let existingEntry = supabaseUpsertData[metric].find((entry) => entry.sample_id === supabaseSampleId);
// //               if (!existingEntry) {
// //                 existingEntry = { sample_id: supabaseSampleId, tpm: null, fpkm: null, fpkm_uq: null };
// //                 supabaseUpsertData[metric].push(existingEntry);
// //               }
// //               existingEntry[normalizationMethod] = value;
// //             }
// //           }
// //         }

// //         for (const metric of validMetrics) {
// //           const tableName = metric === "DEPTH2" ? "depth2_scores" : "tith_scores";
// //           const dataToUpsert = supabaseUpsertData[metric];

// //           if (dataToUpsert.length > 0) {
// //             const { data: existingRows, error: fetchError } = await supabase
// //               .from(tableName)
// //               .select("id, sample_id")
// //               .in("sample_id", dataToUpsert.map((entry) => entry.sample_id));

// //             if (fetchError) {
// //               console.error(`Failed to fetch existing rows from ${tableName}:`, fetchError);
// //               continue;
// //             }

// //             const upsertData = dataToUpsert.map((entry) => ({
// //               sample_id: entry.sample_id,
// //               [normalizationMethod]: entry[normalizationMethod],
// //             }));

// //             const { error: upsertError } = await supabase
// //               .from(tableName)
// //               .upsert(upsertData, { onConflict: "sample_id" });

// //             if (upsertError) {
// //               console.error(`Failed to upsert ${metric} data into ${tableName}:`, upsertError);
// //               setState((prev) => ({ ...prev, error: `Failed to upsert ${metric} data into Supabase.` }));
// //               continue;
// //             }
// //           }
// //         }

// //         const processedData = Object.values(dataByNormalization[normalizationMethod]).filter((sampleData) =>
// //           validMetrics.some((metric) => {
// //             const fieldName = noiseMetrics[metric as keyof typeof noiseMetrics] || metric.toLowerCase();
// //             const value = sampleData[fieldName];
// //             return value !== null && !isNaN(value);
// //           })
// //         );

// //         console.log("Caching data for:", cacheKey, "Data length:", processedData.length);
// //         setCachedData(cacheKey, processedData);
// //         setState((prev) => ({
// //           ...prev,
// //           rawResultsData: [
// //             ...prev.rawResultsData,
// //             ...processedData.filter(
// //               (d) =>
// //                 !prev.rawResultsData.some(
// //                   (existing) =>
// //                     existing.sample === d.sample &&
// //                     existing.cancer_type === d.cancer_type
// //                 )
// //             ),
// //           ],
// //           resultsData: processedData.filter((sampleData) =>
// //             selectedNoiseMetrics.some((metric) => {
// //               const fieldName = noiseMetrics[metric as keyof typeof noiseMetrics] || metric.toLowerCase();
// //               const value = sampleData[fieldName];
// //               return value !== null && !isNaN(value);
// //             })
// //           ),
// //           totalTumorSamples: processedData.length,
// //           isLoading: false,
// //         }));
// //       } catch (error) {
// //         console.error("Error during data fetch:", error);
// //         setState((prev) => ({
// //           ...prev,
// //           error: "Failed to load data. Please check the cancer site or sample data and try again.",
// //           resultsData: [],
// //           isLoading: false,
// //         }));
// //       }
// //     },
// //     [getCachedData, setCachedData, generateCacheKey, state.isLoading]
// //   );

// //   const debouncedFetchData = useCallback(
// //     (params: { cancerSite: string; cancerTypes: string[]; normalizationMethod: string; selectedNoiseMetrics: string[] }) => {
// //       if (filterTimeoutRef.current) {
// //         clearTimeout(filterTimeoutRef.current);
// //       }
// //       filterTimeoutRef.current = setTimeout(() => {
// //         fetchData(params);
// //       }, 500);
// //     },
// //     [fetchData]
// //   );

// //   // Filter rawResultsData client-side when selectedNoiseMetrics changes
// //   useEffect(() => {
// //     if (state.rawResultsData.length > 0) {
// //       const filteredData = state.rawResultsData.filter((sampleData) =>
// //         filterState.selectedNoiseMetrics.some((metric) => {
// //           const fieldName = noiseMetrics[metric as keyof typeof noiseMetrics] || metric.toLowerCase();
// //           const value = sampleData[fieldName];
// //           return value !== null && !isNaN(value);
// //         })
// //       );
// //       setState((prev) => ({
// //         ...prev,
// //         resultsData: filteredData,
// //         totalTumorSamples: filteredData.length,
// //         error: filteredData.length === 0 ? "No data matches the selected filters." : null,
// //       }));
// //     }
// //   }, [filterState.selectedNoiseMetrics, state.rawResultsData]);

// //   // Fetch data only when cancerSite, cancerTypes, or normalizationMethod changes
// //   useEffect(() => {
// //     const cacheKey = generateCacheKey({
// //       cancerSite: params.cancerSite,
// //       cancerTypes: params.cancerTypes,
// //       normalizationMethod: filterState.normalizationMethod,
// //     });
// //     const cachedData = getCachedData(cacheKey);
// //     if (cachedData && cachedData.length > 0) {
// //       console.log("Cache hit in useEffect:", cacheKey, "Data length:", cachedData.length);
// //       setState((prev) => ({
// //         ...prev,
// //         rawResultsData: [
// //           ...prev.rawResultsData,
// //           ...cachedData.filter(
// //             (d) =>
// //               !prev.rawResultsData.some(
// //                 (existing) =>
// //                   existing.sample === d.sample &&
// //                   existing.cancer_type === d.cancer_type
// //               )
// //           ),
// //         ],
// //         resultsData: cachedData.filter((sampleData) =>
// //           filterState.selectedNoiseMetrics.some((metric) => {
// //             const fieldName = noiseMetrics[metric as keyof typeof noiseMetrics] || metric.toLowerCase();
// //             const value = sampleData[fieldName];
// //             return value !== null && !isNaN(value);
// //           })
// //         ),
// //         totalTumorSamples: cachedData.length,
// //         isLoading: false,
// //       }));
// //     } else if (!state.isLoading && params.cancerSite) {
// //       console.log("Cache miss in useEffect, triggering fetch for:", cacheKey);
// //       debouncedFetchData({
// //         cancerSite: params.cancerSite,
// //         cancerTypes: params.cancerTypes,
// //         normalizationMethod: filterState.normalizationMethod,
// //         selectedNoiseMetrics: validMetrics, // Fetch all metrics to cache broadly
// //       });
// //     }

// //     return () => {
// //       if (filterTimeoutRef.current) {
// //         clearTimeout(filterTimeoutRef.current);
// //       }
// //     };
// //   }, [
// //     params.cancerSite,
// //     params.cancerTypes,
// //     filterState.normalizationMethod,
// //     getCachedData,
// //     generateCacheKey,
// //     debouncedFetchData,
// //     state.isLoading,
// //   ]);

// //   return { ...state, fetchData: debouncedFetchData };
// // };

// // const TumourResults: React.FC = () => {
// //   const [searchParams] = useSearchParams();
// //   const rawParams = useMemo(
// //     () => ({
// //       cancerSite: searchParams.get("cancerSite") || "",
// //       cancerTypes: searchParams.get("cancerTypes")?.split(",").filter(Boolean) || [],
// //       cancerType: searchParams.get("cancerType") || "",
// //     }),
// //     [searchParams]
// //   );

// //   const [filterState, dispatch] = useReducer(filterReducer, initialFilterState);
// //   const { resultsData, isLoading, error, totalTumorSamples, sampleToCancerType, fetchData } = useTumorResultsData(
// //     rawParams,
// //     filterState
// //   );

// //   const noiseMetrics = { DEPTH2: "depth2", tITH: "tith" };
// //   const allNoiseMetrics = Object.keys(noiseMetrics);
// //   const normalizationMethods = ["tpm", "fpkm", "fpkm_uq"];

// //   const updateFilters = useCallback(
// //     (updates: Partial<FilterState>) => {
// //       if (updates.normalizationMethod) {
// //         dispatch({ type: "SET_NORMALIZATION", payload: updates.normalizationMethod });
// //       }
// //       if (updates.selectedNoiseMetrics) {
// //         dispatch({ type: "SET_NOISE_METRICS", payload: updates.selectedNoiseMetrics });
// //       }
// //     },
// //     []
// //   );

// //   const handleFilterChange = useCallback(
// //     (filterId: string, value: string[]) => {
// //       console.log("handleFilterChange:", { filterId, value });
// //       if (filterId === "noiseMetrics") {
// //         if (value.length === 0) {
// //           console.warn("At least one noise metric must remain selected.");
// //           return;
// //         }
// //         updateFilters({ selectedNoiseMetrics: value });
// //       }
// //     },
// //     [updateFilters]
// //   );

// //   const customFilters = [
// //     {
// //       title: "TH Metrics",
// //       id: "noiseMetrics",
// //       type: "checkbox" as const,
// //       options: allNoiseMetrics.map((metric) => ({
// //         id: metric,
// //         label: metric,
// //         description:
// //           metric === "DEPTH2"
// //             ? "DEPTH2 measures the depth of tumor heterogeneity based on gene expression variability."
// //             : "tITH quantifies intra-tumor heterogeneity using transcriptomic profiles.",
// //         referenceLink: "https://example.com/paper",
// //       })),
// //       isMasterCheckbox: true,
// //       defaultOpen: false,
// //     },
// //   ];

// //   const downloadData = useCallback(() => {
// //     const keys = ["sample", "cancer_type", "depth2", "tith"].filter((key) => {
// //       if (key === "depth2" && !filterState.selectedNoiseMetrics.includes("DEPTH2")) return false;
// //       if (key === "tith" && !filterState.selectedNoiseMetrics.includes("tITH")) return false;
// //       return true;
// //     });

// //     const headers = keys.join(",");
// //     const rows = resultsData.map((row) =>
// //       keys
// //         .map((key) => {
// //           const value = row[key as keyof TumorData];
// //           return typeof value === "number" ? value.toFixed(6) : value || "";
// //         })
// //         .join(",")
// //     );

// //     const content = [headers, ...rows].join("\n");
// //     const blob = new Blob([content], { type: "text/csv" });
// //     const url = URL.createObjectURL(blob);
// //     const a = document.createElement("a");
// //     a.href = url;
// //     a.download = `tumor_analysis_${rawParams.cancerSite}_${filterState.normalizationMethod}_${Date.now()}.csv`;
// //     a.click();
// //     URL.revokeObjectURL(url);
// //   }, [resultsData, rawParams.cancerSite, filterState.normalizationMethod, filterState.selectedNoiseMetrics]);

// //   return (
// //     <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-yellow-50 flex flex-col">
// //       <Header />
// //       <main className="flex-grow">
// //         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
// //           <div className="grid grid-cols-[320px_1fr] gap-6">
// //             <FilterPanel
// //               normalizationMethod={filterState.normalizationMethod}
// //               setNormalizationMethod={(value) => updateFilters({ normalizationMethod: value })}
// //               customFilters={customFilters}
// //               onFilterChange={handleFilterChange}
// //               selectedValues={{
// //                 noiseMetrics: filterState.selectedNoiseMetrics,
// //               }}
// //             />
// //             <div className="flex-1">
// //               {error && <div className="text-red-600 mb-4">{error}</div>}
// //               {isLoading ? (
// //                 <LoadingSpinner message="Please wait..." />
// //               ) : resultsData.length === 0 ? (
// //                 <div className="text-center text-red-600">No data available for selected filters.</div>
// //               ) : (
// //                 <>
// //                   <Link
// //                     to="/tumour-analysis"
// //                     className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-6 transition-colors"
// //                   >
// //                     <ArrowLeft className="h-4 w-4 mr-2" />
// //                     Back to Tumor Analysis
// //                   </Link>
// //                   <div className="mb-8">
// //                     <h2 className="text-4xl font-bold text-blue-900 mb-6">
// //                       Results for Tumor Analysis
// //                     </h2>
// //                     <div className="overflow-x-auto mb-6">
// //                       <table className="min-w-full bg-white border border-gray-200 rounded-lg shadow-sm">
// //                         <tbody>
// //                           <tr className="border-b">
// //                             <th className="text-left py-3 pl-4 text-blue-700 font-semibold w-1/6 border-r border-gray-300">Normalization</th>
// //                             <td className="py-3 pl-2 pr-4 text-blue-700 text-left align-top">
// //                               Log<sub>2</sub>({filterState.normalizationMethod.toUpperCase()} + 1)
// //                             </td>
// //                           </tr>
// //                           <tr>
// //                             <th className="text-left py-3 pl-4 text-blue-700 font-semibold w-1/6 border-r border-gray-300">Cancer Site</th>
// //                             <td className="py-3 pl-2 pr-4 text-blue-700 text-left align-top">
// //                               {rawParams.cancerSite} {rawParams.cancerTypes.length > 0 && `(${rawParams.cancerTypes.join(", ")})`}
// //                             </td>
// //                           </tr>
// //                         </tbody>
// //                       </table>
// //                     </div>
// //                     <div className="flex justify-center items-center">
// //                       <Card className="border-0 shadow-lg w-full">
// //                         <CardContent className="flex flex-col items-center p-4 text-center">
// //                           <Users className="h-6 w-6 text-red-600 mb-2" />
// //                           <div className="text-2xl font-bold text-red-600">{totalTumorSamples}</div>
// //                           <div className="text-xs text-gray-600">Total Tumor Samples</div>
// //                         </CardContent>
// //                       </Card>
// //                     </div>
// //                   </div>
// //                   {(filterState.selectedNoiseMetrics.includes("DEPTH2") || filterState.selectedNoiseMetrics.includes("tITH")) && (
// //                     <div className="mb-8">
// //                       <div className="flex justify-between items-center mb-4">
// //                         <h3 className="text-2xl font-bold text-blue-900">Statistical Metrics</h3>
// //                         <button
// //                           onClick={() => dispatch({ type: "TOGGLE_STATISTICAL_METRICS" })}
// //                           className="text-blue-900"
// //                         >
// //                           {filterState.isStatisticalMetricsOpen ? (
// //                             <ChevronDown className="h-6 w-6" />
// //                           ) : (
// //                             <ChevronRight className="h-6 w-6" />
// //                           )}
// //                         </button>
// //                       </div>
// //                       {filterState.isStatisticalMetricsOpen && (
// //                         <>
// //                           {["DEPTH2", "tITH"].map((metric) =>
// //                             filterState.selectedNoiseMetrics.includes(metric) ? (
// //                               <CollapsibleCard
// //                                 key={metric}
// //                                 title={`${metric} Scores`}
// //                                 defaultOpen={filterState.metricOpenState[metric.toLowerCase()]}
// //                                 onToggle={(open) =>
// //                                   dispatch({ type: "TOGGLE_METRIC_SECTION", payload: metric.toLowerCase() })
// //                                 }
// //                                 className="mb-4"
// //                               >
// //                                 <PlotlyBoxPlot
// //                                   data={resultsData}
// //                                   xKey={noiseMetrics[metric as keyof typeof noiseMetrics]}
// //                                   yLabel={`${metric} (${filterState.normalizationMethod})`}
// //                                   normalizationMethod={filterState.normalizationMethod}
// //                                   selectedGroups={[...new Set(resultsData.map((d) => d.cancer_type))]}
// //                                   title={`${metric} Distribution (${filterState.normalizationMethod})`}
// //                                   colorMap={{}}
// //                                 />
// //                               </CollapsibleCard>
// //                             ) : null
// //                           )}
// //                           {resultsData.length > 0 && (
// //                             <div className="mt-2">
// //                               <CollapsibleCard
// //                                 title="Data Table"
// //                                 className="h-full"
// //                                 downloadButton={
// //                                   <Button
// //                                     onClick={() => downloadData()}
// //                                     variant="outline"
// //                                     size="sm"
// //                                     className="h-6 px-2 text-xs"
// //                                   >
// //                                     <Download className="h-4 w-4 mr-2" /> Download CSV
// //                                   </Button>
// //                                 }
// //                               >
// //                                 <DataTable
// //                                   data={resultsData}
// //                                   columns={[
// //                                     {
// //                                       key: "sample",
// //                                       header: "Sample",
// //                                       sortable: true,
// //                                     },
// //                                     {
// //                                       key: "cancer_type",
// //                                       header: "Cancer Project",
// //                                       sortable: true,
// //                                     },
// //                                     ...(filterState.selectedNoiseMetrics.includes("DEPTH2")
// //                                       ? [
// //                                           {
// //                                             key: "depth2",
// //                                             header: `DEPTH2 (${filterState.normalizationMethod})`,
// //                                             sortable: true,
// //                                             render: (value) => (typeof value === "number" ? value.toFixed(4) : value),
// //                                           },
// //                                         ]
// //                                       : []),
// //                                     ...(filterState.selectedNoiseMetrics.includes("tITH")
// //                                       ? [
// //                                           {
// //                                             key: "tith",
// //                                             header: `tITH (${filterState.normalizationMethod})`,
// //                                             sortable: true,
// //                                             render: (value) => (typeof value === "number" ? value.toFixed(4) : value),
// //                                           },
// //                                         ]
// //                                       : []),
// //                                   ]}
// //                                   defaultSortKey="sample"
// //                                   scrollHeight="400px"
// //                                   stickyHeader={true}
// //                                 />
// //                               </CollapsibleCard>
// //                             </div>
// //                           )}
// //                         </>
// //                       )}
// //                     </div>
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

// // export default React.memo(TumourResults);
// import React, { useMemo, useCallback, useReducer, useEffect, useState, useRef } from "react";
// import { useSearchParams, Link } from "react-router-dom";
// import supabase from "@/supabase-client";
// import { Card, CardContent } from "@/components/ui/card";
// import { Button } from "@/components/ui/button";
// import { ArrowLeft, Download, ChevronRight, ChevronDown, Users } from "lucide-react";
// import { LoadingSpinner } from "@/components/ui/loadingSpinner";
// import Header from "@/components/header";
// import Footer from "@/components/footer";
// import { TumorData, SampleInfo } from "@/components/types/tumor";
// import { useCache } from "@/hooks/use-cache";
// import FilterPanel from "@/components/FilterPanel";
// import { DataTable } from "@/components/ui/data-table";
// import CollapsibleCard from "@/components/ui/collapsible-card";
// import PlotlyBoxPlot from "@/components/charts/PlotlyTumorBoxPlot";

// // Define interfaces for filter state
// interface FilterState {
//   normalizationMethod: string;
//   selectedNoiseMetrics: string[];
//   metricOpenState: Record<string, boolean>;
//   isStatisticalMetricsOpen: boolean;
// }

// type FilterAction =
//   | { type: "SET_NORMALIZATION"; payload: string }
//   | { type: "SET_NOISE_METRICS"; payload: string[] }
//   | { type: "TOGGLE_METRIC_SECTION"; payload: string }
//   | { type: "TOGGLE_STATISTICAL_METRICS" };

// const initialFilterState: FilterState = {
//   normalizationMethod: "tpm",
//   selectedNoiseMetrics: ["DEPTH2", "tITH"],
//   metricOpenState: { depth2: true, tith: true },
//   isStatisticalMetricsOpen: true,
// };

// const filterReducer = (state: FilterState, action: FilterAction): FilterState => {
//   switch (action.type) {
//     case "SET_NORMALIZATION":
//       return { ...state, normalizationMethod: action.payload };
//     case "SET_NOISE_METRICS":
//       return { ...state, selectedNoiseMetrics: action.payload };
//     case "TOGGLE_METRIC_SECTION":
//       return {
//         ...state,
//         metricOpenState: { ...state.metricOpenState, [action.payload]: !state.metricOpenState[action.payload] },
//       };
//     case "TOGGLE_STATISTICAL_METRICS":
//       return { ...state, isStatisticalMetricsOpen: !state.isStatisticalMetricsOpen };
//     default:
//       return state;
//   }
// };

// // Define state for tumor results data
// interface TumorResultsState {
//   rawResultsData: { [normalizationMethod: string]: TumorData[] };
//   resultsData: TumorData[];
//   isLoading: boolean;
//   error: string | null;
//   totalTumorSamples: number;
//   sampleToCancerType: { [sampleId: number]: SampleInfo };
// }

// const useTumorResultsData = (
//   params: {
//     cancerSite: string;
//     cancerTypes: string[];
//   },
//   filterState: FilterState
// ) => {
//   const [state, setState] = useState<TumorResultsState>({
//     rawResultsData: { tpm: [], fpkm: [], fpkm_uq: [] },
//     resultsData: [],
//     isLoading: false,
//     error: null,
//     totalTumorSamples: 0,
//     sampleToCancerType: {},
//   });
//   const { getCachedData, setCachedData, generateCacheKey } = useCache<TumorData[]>();
//   const filterTimeoutRef = useRef<NodeJS.Timeout | null>(null);

//   const noiseMetrics = { DEPTH2: "depth2", tITH: "tith" };
//   const validMetrics = ["DEPTH2", "tITH"];
//   const normalizationMethods = ["tpm", "fpkm", "fpkm_uq"];

//   const fetchData = useCallback(
//     async ({
//       cancerSite,
//       cancerTypes,
//       selectedNoiseMetrics,
//     }: {
//       cancerSite: string;
//       cancerTypes: string[];
//       selectedNoiseMetrics: string[];
//     }) => {
//       console.log("fetchTumorExpressionData called with:", { cancerSite, cancerTypes, selectedNoiseMetrics });
//       if (!cancerSite || !selectedNoiseMetrics.length || state.isLoading) {
//         console.warn("Invalid parameters or already loading:", {
//           cancerSite,
//           selectedNoiseMetrics,
//           isLoading: state.isLoading,
//         });
//         setState((prev) => ({
//           ...prev,
//           error: "Missing required parameters or already loading.",
//           resultsData: [],
//           isLoading: false,
//         }));
//         return;
//       }

//       setState((prev) => ({ ...prev, isLoading: true, error: null }));
//       let sampleToCancerTypeMap: { [sampleId: number]: SampleInfo } = {};

//       try {
//         // Check cache for all normalization methods
//         const cacheKeys = normalizationMethods.reduce(
//           (acc, normMethod) => ({
//             ...acc,
//             [normMethod]: generateCacheKey({ cancerSite, cancerTypes, normalizationMethod: normMethod }),
//           }),
//           {} as { [normMethod: string]: string }
//         );

//         const cachedData: { [normMethod: string]: TumorData[] } = {};
//         let allCached = true;
//         for (const normMethod of normalizationMethods) {
//           const data = getCachedData(cacheKeys[normMethod]);
//           if (data && data.length > 0) {
//             cachedData[normMethod] = data;
//             console.log(`Cache hit for ${normMethod}:`, cacheKeys[normMethod], "Data length:", data.length);
//           } else {
//             allCached = false;
//           }
//         }

//         if (allCached) {
//           setState((prev) => ({
//             ...prev,
//             rawResultsData: { ...cachedData },
//             resultsData: cachedData[filterState.normalizationMethod].filter((sampleData) =>
//               selectedNoiseMetrics.some((metric) => {
//                 const fieldName = noiseMetrics[metric as keyof typeof noiseMetrics] || metric.toLowerCase();
//                 const value = sampleData[fieldName];
//                 return value !== null && !isNaN(value);
//               })
//             ),
//             totalTumorSamples: cachedData[filterState.normalizationMethod].length,
//             isLoading: false,
//           }));
//           return;
//         }

//         // Fetch cancer site and types from Supabase
//         const { data: siteRows, error: siteRowsErr } = await supabase
//           .from("Sites")
//           .select("id, name")
//           .eq("name", cancerSite);

//         if (siteRowsErr) {
//           console.error("Failed to fetch cancer site:", siteRowsErr);
//           setState((prev) => ({
//             ...prev,
//             error: "Failed to load cancer site data.",
//             resultsData: [],
//             isLoading: false,
//           }));
//           return;
//         }

//         const site = siteRows?.[0];
//         const cancerSiteId = site?.id;

//         const { data: cancerTypeRows, error: cancerTypeErr } =
//           cancerTypes.length > 0
//             ? await supabase
//                 .from("cancer_types")
//                 .select("id, tcga_code, site_id")
//                 .in("tcga_code", cancerTypes)
//                 .eq("site_id", cancerSiteId)
//             : await supabase
//                 .from("cancer_types")
//                 .select("id, tcga_code, site_id")
//                 .eq("site_id", cancerSiteId);

//         if (cancerTypeErr) {
//           console.error("Failed to fetch cancer_type ids:", cancerTypeErr);
//           setState((prev) => ({
//             ...prev,
//             error: "Failed to load cancer types.",
//             resultsData: [],
//             isLoading: false,
//           }));
//           return;
//         }

//         const validCancerTypeIds = cancerTypeRows?.map((row) => row.id);

//         const { data: sampleRows, error: sampleErr } = await supabase
//           .from("samples")
//           .select("id, sample_barcode, cancer_type_id, sample_type")
//           .eq("sample_type", "tumor")
//           .in("cancer_type_id", validCancerTypeIds);

//         if (sampleErr) {
//           console.error("Failed to fetch matching samples:", sampleErr);
//           setState((prev) => ({
//             ...prev,
//             error: "Failed to load sample data.",
//             resultsData: [],
//             isLoading: false,
//           }));
//           return;
//         }

//         sampleToCancerTypeMap = {};
//         sampleRows.forEach((sample) => {
//           const type = cancerTypeRows.find((ct) => ct.id === sample.cancer_type_id);
//           sampleToCancerTypeMap[sample.id] = {
//             barcode: sample.sample_barcode,
//             cancerType: type?.tcga_code || "Unknown",
//           };
//         });

//         setState((prev) => ({ ...prev, sampleToCancerType: sampleToCancerTypeMap, totalTumorSamples: sampleRows.length }));

//         const metrics = selectedNoiseMetrics.filter((metric) => validMetrics.includes(metric));
//         if (metrics.length === 0) {
//           console.error(`Invalid metrics: ${selectedNoiseMetrics.join(", ")}. Valid options: ${validMetrics.join(", ")}`);
//           setState((prev) => ({
//             ...prev,
//             error: "Invalid metrics selected.",
//             resultsData: [],
//             isLoading: false,
//           }));
//           return;
//         }

//         const sampleIds = sampleRows.map((row) => row.id);

//         // Fetch data from Supabase for all metrics and normalizations
//         const dataByNormalization: { [normMethod: string]: { [sampleId: string]: TumorData } } = {
//           tpm: {},
//           fpkm: {},
//           fpkm_uq: {},
//         };
//         const supabaseData: {
//           [metric: string]: { sample_id: string; tpm: number | null; fpkm: number | null; fpkm_uq: number | null }[];
//         } = { DEPTH2: [], tITH: [] };

//         for (const metric of validMetrics) {
//           const tableName = metric === "DEPTH2" ? "depth2_scores" : "tith_scores";
//           const { data: scoreRows, error: scoreErr } = await supabase
//             .from(tableName)
//             .select("sample_id, tpm, fpkm, fpkm_uq")
//             .in("sample_id", sampleIds);

//           if (scoreErr) {
//             console.error(`Failed to fetch ${metric} scores from Supabase:`, scoreErr);
//             setState((prev) => ({ ...prev, error: `Failed to fetch ${metric} data from Supabase.` }));
//             continue;
//           }

//           supabaseData[metric] = scoreRows || [];
//         }

//         // Process Supabase data
//         const sampleBarcodes = sampleRows.map((row) => row.sample_barcode);
//         for (const metric of validMetrics) {
//           const fieldName = noiseMetrics[metric as keyof typeof noiseMetrics] || metric.toLowerCase();
//           for (const row of supabaseData[metric]) {
//             const sampleId = row.sample_id;
//             const sampleInfo = sampleToCancerTypeMap[sampleId];
//             if (!sampleInfo || (cancerTypes.length > 0 && !cancerTypes.includes(sampleInfo.cancerType))) continue;

//             for (const normMethod of normalizationMethods) {
//               if (!dataByNormalization[normMethod][sampleId]) {
//                 dataByNormalization[normMethod][sampleId] = {
//                   sample: sampleInfo.barcode,
//                   cancer_type: sampleInfo.cancerType || "Unknown",
//                 };
//               }
//               dataByNormalization[normMethod][sampleId][fieldName] = row[normMethod] != null ? row[normMethod] : null;
//             }
//           }
//         }

//         // Identify missing data
//         const missingData: { [normMethod: string]: { [metric: string]: string[] } } = {};
//         for (const normMethod of normalizationMethods) {
//           missingData[normMethod] = {};
//           for (const metric of validMetrics) {
//             missingData[normMethod][metric] = sampleIds.filter((sampleId) => {
//               const sampleData = dataByNormalization[normMethod][sampleId];
//               const fieldName = noiseMetrics[metric as keyof typeof noiseMetrics] || metric.toLowerCase();
//               return !sampleData || sampleData[fieldName] == null || isNaN(sampleData[fieldName] as number);
//             });
//           }
//         }

//         // Fetch missing data from API
//         const promises: Promise<{ metric: string; normMethod: string; data: any }>[] = [];
//         for (const normMethod of normalizationMethods) {
//           for (const metric of validMetrics) {
//             const missingSampleIds = missingData[normMethod][metric];
//             if (missingSampleIds.length > 0) {
//               const missingBarcodes = missingSampleIds
//                 .map((id) => sampleToCancerTypeMap[id]?.barcode)
//                 .filter(Boolean);
//               if (missingBarcodes.length > 0) {
//                 console.log(`Fetching API for missing data: metric=${metric}, norm=${normMethod}, samples=${missingBarcodes.length}`);
//                 promises.push(
//                   fetch(`/api/TH-metrics?cancer=${cancerSite}&method=${normMethod}&metric=${metric}`)
//                     .then((response) => {
//                       if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
//                       return response.json();
//                     })
//                     .then((data) => {
//                       const filteredData = data.log2[normMethod]?.filter((item: any) =>
//                         missingBarcodes.includes(item.sample_id)
//                       ) || [];
//                       return { metric, normMethod, data: filteredData };
//                     })
//                     .catch((error) => {
//                       console.error(`Error fetching ${metric} (${normMethod}):`, error);
//                       setState((prev) => ({ ...prev, error: `Failed to fetch ${metric} data for ${normMethod}.` }));
//                       return { metric, normMethod, data: [] };
//                     })
//                 );
//               }
//             }
//           }
//         }

//         const metricResults = await Promise.all(promises);
//         const supabaseUpsertData: {
//           [metric: string]: { sample_id: string; tpm: number | null; fpkm: number | null; fpkm_uq: number | null }[];
//         } = { DEPTH2: [], tITH: [] };

//         for (const { metric, normMethod, data } of metricResults) {
//           if (data && data.length > 0) {
//             for (const item of data) {
//               const sampleBarcode = item.sample_id;
//               const supabaseSampleId = Object.keys(sampleToCancerTypeMap).find(
//                 (key) => sampleToCancerTypeMap[key].barcode === sampleBarcode
//               );

//               if (!supabaseSampleId) {
//                 console.warn(`No matching Supabase sample_id for sample_barcode ${sampleBarcode}`);
//                 continue;
//               }

//               const sampleInfo = sampleToCancerTypeMap[supabaseSampleId];
//               if (cancerTypes.length > 0 && !cancerTypes.includes(sampleInfo.cancerType)) continue;

//               const mapKey = supabaseSampleId;
//               if (!dataByNormalization[normMethod][mapKey]) {
//                 dataByNormalization[normMethod][mapKey] = {
//                   sample: sampleInfo.barcode,
//                   cancer_type: sampleInfo.cancerType || "Unknown",
//                 };
//               }
//               const fieldName = noiseMetrics[metric as keyof typeof noiseMetrics] || metric.toLowerCase();
//               const value = item[normMethod] != null ? item[normMethod] : null;
//               dataByNormalization[normMethod][mapKey][fieldName] = value;

//               let existingEntry = supabaseUpsertData[metric].find((entry) => entry.sample_id === supabaseSampleId);
//               if (!existingEntry) {
//                 existingEntry = { sample_id: supabaseSampleId, tpm: null, fpkm: null, fpkm_uq: null };
//                 supabaseUpsertData[metric].push(existingEntry);
//               }
//               existingEntry[normMethod] = value;
//             }
//           }
//         }

//         // Upsert API-fetched data to Supabase
//         for (const metric of validMetrics) {
//           const tableName = metric === "DEPTH2" ? "depth2_scores" : "tith_scores";
//           const dataToUpsert = supabaseUpsertData[metric];

//           if (dataToUpsert.length > 0) {
//             const upsertData = dataToUpsert.map((entry) => ({
//               sample_id: entry.sample_id,
//               tpm: entry.tpm,
//               fpkm: entry.fpkm,
//               fpkm_uq: entry.fpkm_uq,
//             }));

//             const { error: upsertError } = await supabase
//               .from(tableName)
//               .upsert(upsertData, { onConflict: "sample_id" });

//             if (upsertError) {
//               console.error(`Failed to upsert ${metric} data into ${tableName}:`, upsertError);
//               setState((prev) => ({ ...prev, error: `Failed to upsert ${metric} data into Supabase.` }));
//               continue;
//             }
//           }
//         }

//         // Process and cache data for all normalizations
//         const processedDataByNorm: { [normMethod: string]: TumorData[] } = {};
//         for (const normMethod of normalizationMethods) {
//           const processedData = Object.values(dataByNormalization[normMethod]).filter((sampleData) =>
//             validMetrics.some((metric) => {
//               const fieldName = noiseMetrics[metric as keyof typeof noiseMetrics] || metric.toLowerCase();
//               const value = sampleData[fieldName];
//               return value !== null && !isNaN(value);
//             })
//           );
//           const cacheKey = generateCacheKey({ cancerSite, cancerTypes, normalizationMethod: normMethod });
//           console.log(`Caching data for ${normMethod}:`, cacheKey, "Data length:", processedData.length);
//           setCachedData(cacheKey, processedData);
//           processedDataByNorm[normMethod] = processedData;
//         }

//         setState((prev) => ({
//           ...prev,
//           rawResultsData: { ...prev.rawResultsData, ...processedDataByNorm },
//           resultsData: processedDataByNorm[filterState.normalizationMethod].filter((sampleData) =>
//             selectedNoiseMetrics.some((metric) => {
//               const fieldName = noiseMetrics[metric as keyof typeof noiseMetrics] || metric.toLowerCase();
//               const value = sampleData[fieldName];
//               return value !== null && !isNaN(value);
//             })
//           ),
//           totalTumorSamples: processedDataByNorm[filterState.normalizationMethod].length,
//           isLoading: false,
//         }));
//       } catch (error) {
//         console.error("Error during data fetch:", error);
//         setState((prev) => ({
//           ...prev,
//           error: "Failed to load data. Please check the cancer site or sample data and try again.",
//           resultsData: [],
//           isLoading: false,
//         }));
//       }
//     },
//     [getCachedData, setCachedData, generateCacheKey, state.isLoading, filterState.normalizationMethod]
//   );

//   const debouncedFetchData = useCallback(
//     (params: { cancerSite: string; cancerTypes: string[]; selectedNoiseMetrics: string[] }) => {
//       if (filterTimeoutRef.current) {
//         clearTimeout(filterTimeoutRef.current);
//       }
//       filterTimeoutRef.current = setTimeout(() => {
//         fetchData(params);
//       }, 500);
//     },
//     [fetchData]
//   );

//   // Filter rawResultsData client-side when normalizationMethod or selectedNoiseMetrics changes
//   useEffect(() => {
//     const dataForNorm = state.rawResultsData[filterState.normalizationMethod] || [];
//     if (dataForNorm.length > 0) {
//       const filteredData = dataForNorm.filter((sampleData) =>
//         filterState.selectedNoiseMetrics.some((metric) => {
//           const fieldName = noiseMetrics[metric as keyof typeof noiseMetrics] || metric.toLowerCase();
//           const value = sampleData[fieldName];
//           return value !== null && !isNaN(value);
//         })
//       );
//       setState((prev) => ({
//         ...prev,
//         resultsData: filteredData,
//         totalTumorSamples: filteredData.length,
//         error: filteredData.length === 0 ? "No data matches the selected filters." : null,
//       }));
//     }
//   }, [filterState.normalizationMethod, filterState.selectedNoiseMetrics, state.rawResultsData]);

//   // Fetch data only when cancerSite or cancerTypes changes
//   useEffect(() => {
//     const cacheKeys = normalizationMethods.reduce(
//       (acc, normMethod) => ({
//         ...acc,
//         [normMethod]: generateCacheKey({ cancerSite: params.cancerSite, cancerTypes: params.cancerTypes, normalizationMethod: normMethod }),
//       }),
//       {} as { [normMethod: string]: string }
//     );

//     const cachedData: { [normMethod: string]: TumorData[] } = {};
//     let allCached = true;
//     for (const normMethod of normalizationMethods) {
//       const data = getCachedData(cacheKeys[normMethod]);
//       if (data && data.length > 0) {
//         cachedData[normMethod] = data;
//       } else {
//         allCached = false;
//       }
//     }

//     if (allCached) {
//       console.log("Cache hit for all normalizations:", cacheKeys);
//       setState((prev) => ({
//         ...prev,
//         rawResultsData: { ...cachedData },
//         resultsData: cachedData[filterState.normalizationMethod].filter((sampleData) =>
//           filterState.selectedNoiseMetrics.some((metric) => {
//             const fieldName = noiseMetrics[metric as keyof typeof noiseMetrics] || metric.toLowerCase();
//             const value = sampleData[fieldName];
//             return value !== null && !isNaN(value);
//           })
//         ),
//         totalTumorSamples: cachedData[filterState.normalizationMethod].length,
//         isLoading: false,
//       }));
//     } else if (!state.isLoading && params.cancerSite) {
//       console.log("Cache miss for some normalizations, triggering fetch");
//       debouncedFetchData({
//         cancerSite: params.cancerSite,
//         cancerTypes: params.cancerTypes,
//         selectedNoiseMetrics: validMetrics, // Fetch all metrics to cache broadly
//       });
//     }

//     return () => {
//       if (filterTimeoutRef.current) {
//         clearTimeout(filterTimeoutRef.current);
//       }
//     };
//   }, [params.cancerSite, params.cancerTypes, getCachedData, generateCacheKey, debouncedFetchData, state.isLoading, filterState.normalizationMethod]);

//   return { ...state, fetchData: debouncedFetchData };
// };

// const TumourResults: React.FC = () => {
//   const [searchParams] = useSearchParams();
//   const rawParams = useMemo(
//     () => ({
//       cancerSite: searchParams.get("cancerSite") || "",
//       cancerTypes: searchParams.get("cancerTypes")?.split(",").filter(Boolean) || [],
//       cancerType: searchParams.get("cancerType") || "",
//     }),
//     [searchParams]
//   );

//   const [filterState, dispatch] = useReducer(filterReducer, initialFilterState);
//   const { resultsData, isLoading, error, totalTumorSamples, sampleToCancerType, fetchData } = useTumorResultsData(
//     rawParams,
//     filterState
//   );

//   const noiseMetrics = { DEPTH2: "depth2", tITH: "tith" };
//   const allNoiseMetrics = Object.keys(noiseMetrics);
//   const normalizationMethods = ["tpm", "fpkm", "fpkm_uq"];

//   const updateFilters = useCallback(
//     (updates: Partial<FilterState>) => {
//       if (updates.normalizationMethod) {
//         dispatch({ type: "SET_NORMALIZATION", payload: updates.normalizationMethod });
//       }
//       if (updates.selectedNoiseMetrics) {
//         dispatch({ type: "SET_NOISE_METRICS", payload: updates.selectedNoiseMetrics });
//       }
//     },
//     []
//   );

//   const handleFilterChange = useCallback(
//     (filterId: string, value: string[]) => {
//       console.log("handleFilterChange:", { filterId, value });
//       if (filterId === "noiseMetrics") {
//         if (value.length === 0) {
//           console.warn("At least one noise metric must remain selected.");
//           return;
//         }
//         updateFilters({ selectedNoiseMetrics: value });
//       }
//     },
//     [updateFilters]
//   );

//   const customFilters = [
//     {
//       title: "TH Metrics",
//       id: "noiseMetrics",
//       type: "checkbox" as const,
//       options: allNoiseMetrics.map((metric) => ({
//         id: metric,
//         label: metric,
//         description:
//           metric === "DEPTH2"
//             ? "DEPTH2 measures the depth of tumor heterogeneity based on gene expression variability."
//             : "tITH quantifies intra-tumor heterogeneity using transcriptomic profiles.",
//         referenceLink: "https://example.com/paper",
//       })),
//       isMasterCheckbox: true,
//       defaultOpen: false,
//     },
//   ];

//   const downloadData = useCallback(() => {
//     const keys = ["sample", "cancer_type", "depth2", "tith"].filter((key) => {
//       if (key === "depth2" && !filterState.selectedNoiseMetrics.includes("DEPTH2")) return false;
//       if (key === "tith" && !filterState.selectedNoiseMetrics.includes("tITH")) return false;
//       return true;
//     });

//     const headers = keys.join(",");
//     const rows = resultsData.map((row) =>
//       keys
//         .map((key) => {
//           const value = row[key as keyof TumorData];
//           return typeof value === "number" ? value.toFixed(6) : value || "";
//         })
//         .join(",")
//     );

//     const content = [headers, ...rows].join("\n");
//     const blob = new Blob([content], { type: "text/csv" });
//     const url = URL.createObjectURL(blob);
//     const a = document.createElement("a");
//     a.href = url;
//     a.download = `tumor_analysis_${rawParams.cancerSite}_${filterState.normalizationMethod}_${Date.now()}.csv`;
//     a.click();
//     URL.revokeObjectURL(url);
//   }, [resultsData, rawParams.cancerSite, filterState.normalizationMethod, filterState.selectedNoiseMetrics]);

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-yellow-50 flex flex-col">
//       <Header />
//       <main className="flex-grow">
//         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
//           <div className="grid grid-cols-[320px_1fr] gap-6">
//             <FilterPanel
//               normalizationMethod={filterState.normalizationMethod}
//               setNormalizationMethod={(value) => updateFilters({ normalizationMethod: value })}
//               customFilters={customFilters}
//               onFilterChange={handleFilterChange}
//               selectedValues={{
//                 noiseMetrics: filterState.selectedNoiseMetrics,
//               }}
//             />
//             <div className="flex-1">
//               {error && <div className="text-red-600 mb-4">{error}</div>}
//               {isLoading ? (
//                 <LoadingSpinner message="Please wait..." />
//               ) : resultsData.length === 0 ? (
//                 <div className="text-center text-red-600">No data available for selected filters.</div>
//               ) : (
//                 <>
//                   <Link
//                     to="/tumour-analysis"
//                     className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-6 transition-colors"
//                   >
//                     <ArrowLeft className="h-4 w-4 mr-2" />
//                     Back to Tumor Analysis
//                   </Link>
//                   <div className="mb-8">
//                     <h2 className="text-4xl font-bold text-blue-900 mb-6">
//                       Results for Tumor Analysis
//                     </h2>
//                     <div className="overflow-x-auto mb-6">
//                       <table className="min-w-full bg-white border border-gray-200 rounded-lg shadow-sm">
//                         <tbody>
//                           <tr className="border-b">
//                             <th className="text-left py-3 pl-4 text-blue-700 font-semibold w-1/6 border-r border-gray-300">Normalization</th>
//                             <td className="py-3 pl-2 pr-4 text-blue-700 text-left align-top">
//                               Log<sub>2</sub>({filterState.normalizationMethod.toUpperCase()} + 1)
//                             </td>
//                           </tr>
//                           <tr>
//                             <th className="text-left py-3 pl-4 text-blue-700 font-semibold w-1/6 border-r border-gray-300">Cancer Site</th>
//                             <td className="py-3 pl-2 pr-4 text-blue-700 text-left align-top">
//                               {rawParams.cancerSite} {rawParams.cancerTypes.length > 0 && `(${rawParams.cancerTypes.join(", ")})`}
//                             </td>
//                           </tr>
//                         </tbody>
//                       </table>
//                     </div>
//                     <div className="flex justify-center items-center">
//                       <Card className="border-0 shadow-lg w-full">
//                         <CardContent className="flex flex-col items-center p-4 text-center">
//                           <Users className="h-6 w-6 text-red-600 mb-2" />
//                           <div className="text-2xl font-bold text-red-600">{totalTumorSamples}</div>
//                           <div className="text-xs text-gray-600">Total Tumor Samples</div>
//                         </CardContent>
//                       </Card>
//                     </div>
//                   </div>
//                   {(filterState.selectedNoiseMetrics.includes("DEPTH2") || filterState.selectedNoiseMetrics.includes("tITH")) && (
//                     <div className="mb-8">
//                       <div className="flex justify-between items-center mb-4">
//                         <h3 className="text-2xl font-bold text-blue-900">Statistical Metrics</h3>
//                         <button
//                           onClick={() => dispatch({ type: "TOGGLE_STATISTICAL_METRICS" })}
//                           className="text-blue-900"
//                         >
//                           {filterState.isStatisticalMetricsOpen ? (
//                             <ChevronDown className="h-6 w-6" />
//                           ) : (
//                             <ChevronRight className="h-6 w-6" />
//                           )}
//                         </button>
//                       </div>
//                       {filterState.isStatisticalMetricsOpen && (
//                         <>
//                           {["DEPTH2", "tITH"].map((metric) =>
//                             filterState.selectedNoiseMetrics.includes(metric) ? (
//                               <CollapsibleCard
//                                 key={metric}
//                                 title={`${metric} Scores`}
//                                 defaultOpen={filterState.metricOpenState[metric.toLowerCase()]}
//                                 onToggle={(open) =>
//                                   dispatch({ type: "TOGGLE_METRIC_SECTION", payload: metric.toLowerCase() })
//                                 }
//                                 className="mb-4"
//                               >
//                                 <PlotlyBoxPlot
//                                   data={resultsData}
//                                   xKey={noiseMetrics[metric as keyof typeof noiseMetrics]}
//                                   yLabel={`${metric} (${filterState.normalizationMethod})`}
//                                   normalizationMethod={filterState.normalizationMethod}
//                                   selectedGroups={[...new Set(resultsData.map((d) => d.cancer_type))]}
//                                   title={`${metric} Distribution (${filterState.normalizationMethod})`}
//                                   colorMap={{}}
//                                 />
//                               </CollapsibleCard>
//                             ) : null
//                           )}
//                           {resultsData.length > 0 && (
//                             <div className="mt-2">
//                               <CollapsibleCard
//                                 title="Data Table"
//                                 className="h-full"
//                                 downloadButton={
//                                   <Button
//                                     onClick={() => downloadData()}
//                                     variant="outline"
//                                     size="sm"
//                                     className="h-6 px-2 text-xs"
//                                   >
//                                     <Download className="h-4 w-4 mr-2" /> Download CSV
//                                   </Button>
//                                 }
//                               >
//                                 <DataTable
//                                   data={resultsData}
//                                   columns={[
//                                     {
//                                       key: "sample",
//                                       header: "Sample",
//                                       sortable: true,
//                                     },
//                                     {
//                                       key: "cancer_type",
//                                       header: "Cancer Project",
//                                       sortable: true,
//                                     },
//                                     ...(filterState.selectedNoiseMetrics.includes("DEPTH2")
//                                       ? [
//                                           {
//                                             key: "depth2",
//                                             header: `DEPTH2 (${filterState.normalizationMethod})`,
//                                             sortable: true,
//                                             render: (value) => (typeof value === "number" ? value.toFixed(4) : value),
//                                           },
//                                         ]
//                                       : []),
//                                     ...(filterState.selectedNoiseMetrics.includes("tITH")
//                                       ? [
//                                           {
//                                             key: "tith",
//                                             header: `tITH (${filterState.normalizationMethod})`,
//                                             sortable: true,
//                                             render: (value) => (typeof value === "number" ? value.toFixed(4) : value),
//                                           },
//                                         ]
//                                       : []),
//                                   ]}
//                                   defaultSortKey="sample"
//                                   scrollHeight="400px"
//                                   stickyHeader={true}
//                                 />
//                               </CollapsibleCard>
//                             </div>
//                           )}
//                         </>
//                       )}
//                     </div>
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

// export default React.memo(TumourResults);
import React, { useMemo, useCallback, useReducer, useEffect, useState, useRef } from "react";
import { useSearchParams, Link } from "react-router-dom";
import supabase from "@/supabase-client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Download, ChevronRight, ChevronDown, Users } from "lucide-react";
import { LoadingSpinner } from "@/components/ui/loadingSpinner";
import Header from "@/components/header";
import Footer from "@/components/footer";
import { TumorData, SampleInfo } from "@/components/types/tumor";
import { useCache } from "@/hooks/use-cache";
import FilterPanel from "@/components/FilterPanel";
import { DataTable } from "@/components/ui/data-table";
import CollapsibleCard from "@/components/ui/collapsible-card";
import PlotlyBoxPlot from "@/components/charts/PlotlyTumorBoxPlot";

// Define interfaces for filter state
interface FilterState {
  normalizationMethod: string;
  selectedNoiseMetrics: string[];
  metricOpenState: Record<string, boolean>;
  isStatisticalMetricsOpen: boolean;
}

type FilterAction =
  | { type: "SET_NORMALIZATION"; payload: string }
  | { type: "SET_NOISE_METRICS"; payload: string[] }
  | { type: "TOGGLE_METRIC_SECTION"; payload: string }
  | { type: "TOGGLE_STATISTICAL_METRICS" };

const initialFilterState: FilterState = {
  normalizationMethod: "tpm",
  selectedNoiseMetrics: ["DEPTH2", "tITH"],
  metricOpenState: { depth2: true, tith: true },
  isStatisticalMetricsOpen: true,
};

const filterReducer = (state: FilterState, action: FilterAction): FilterState => {
  switch (action.type) {
    case "SET_NORMALIZATION":
      return { ...state, normalizationMethod: action.payload };
    case "SET_NOISE_METRICS":
      return { ...state, selectedNoiseMetrics: action.payload };
    case "TOGGLE_METRIC_SECTION":
      return {
        ...state,
        metricOpenState: { ...state.metricOpenState, [action.payload]: !state.metricOpenState[action.payload] },
      };
    case "TOGGLE_STATISTICAL_METRICS":
      return { ...state, isStatisticalMetricsOpen: !state.isStatisticalMetricsOpen };
    default:
      return state;
  }
};

// Define state for tumor results data
interface TumorResultsState {
  rawResultsData: { [normalizationMethod: string]: TumorData[] };
  resultsData: TumorData[];
  isLoading: boolean;
  error: string | null;
  totalTumorSamples: number;
  sampleToCancerType: { [sampleId: number]: SampleInfo };
}

const useTumorResultsData = (
  params: {
    cancerSite: string;
    cancerTypes: string[];
  },
  filterState: FilterState
) => {
  const [state, setState] = useState<TumorResultsState>({
    rawResultsData: { tpm: [], fpkm: [], fpkm_uq: [] },
    resultsData: [],
    isLoading: false,
    error: null,
    totalTumorSamples: 0,
    sampleToCancerType: {},
  });
  const { getCachedData, setCachedData, generateCacheKey } = useCache<TumorData[]>();
  const filterTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const noiseMetrics = { DEPTH2: "depth2", tITH: "tith" };
  const validMetrics = ["DEPTH2", "tITH"];
  const normalizationMethods = ["tpm", "fpkm", "fpkm_uq"];

  const fetchData = useCallback(
    async ({
      cancerSite,
      cancerTypes,
      selectedNoiseMetrics,
    }: {
      cancerSite: string;
      cancerTypes: string[];
      selectedNoiseMetrics: string[];
    }) => {
      console.log("fetchTumorExpressionData called with:", { cancerSite, cancerTypes, selectedNoiseMetrics });
      if (!cancerSite || !selectedNoiseMetrics.length || state.isLoading) {
        console.warn("Invalid parameters or already loading:", {
          cancerSite,
          selectedNoiseMetrics,
          isLoading: state.isLoading,
        });
        setState((prev) => ({
          ...prev,
          error: "Missing required parameters or already loading.",
          resultsData: [],
          isLoading: false,
        }));
        return;
      }

      setState((prev) => ({ ...prev, isLoading: true, error: null }));
      let sampleToCancerTypeMap: { [sampleId: number]: SampleInfo } = {};

      try {
        // Check cache for all normalization methods
        const cacheKeys = normalizationMethods.reduce(
          (acc, normMethod) => ({
            ...acc,
            [normMethod]: generateCacheKey({ cancerSite, cancerTypes, normalizationMethod: normMethod }),
          }),
          {} as { [normMethod: string]: string }
        );

        const cachedData: { [normMethod: string]: TumorData[] } = {};
        let allCached = true;
        for (const normMethod of normalizationMethods) {
          const data = getCachedData(cacheKeys[normMethod]);
          if (data && data.length > 0) {
            cachedData[normMethod] = data;
            console.log(`Cache hit for ${normMethod}:`, cacheKeys[normMethod], "Data length:", data.length);
          } else {
            allCached = false;
          }
        }

        if (allCached) {
          setState((prev) => ({
            ...prev,
            rawResultsData: { ...cachedData },
            resultsData: cachedData[filterState.normalizationMethod].filter((sampleData) =>
              selectedNoiseMetrics.some((metric) => {
                const fieldName = noiseMetrics[metric as keyof typeof noiseMetrics] || metric.toLowerCase();
                const value = sampleData[fieldName];
                return value !== null && !isNaN(value);
              })
            ),
            totalTumorSamples: cachedData[filterState.normalizationMethod].length,
            isLoading: false,
          }));
          return;
        }

        // Fetch cancer site and types from Supabase
        const { data: siteRows, error: siteRowsErr } = await supabase
          .from("Sites")
          .select("id, name")
          .eq("name", cancerSite);

        if (siteRowsErr) {
          console.error("Failed to fetch cancer site:", siteRowsErr);
          setState((prev) => ({
            ...prev,
            error: "Failed to load cancer site data.",
            resultsData: [],
            isLoading: false,
          }));
          return;
        }

        const site = siteRows?.[0];
        const cancerSiteId = site?.id;

        const { data: cancerTypeRows, error: cancerTypeErr } =
          cancerTypes.length > 0
            ? await supabase
                .from("cancer_types")
                .select("id, tcga_code, site_id")
                .in("tcga_code", cancerTypes)
                .eq("site_id", cancerSiteId)
            : await supabase
                .from("cancer_types")
                .select("id, tcga_code, site_id")
                .eq("site_id", cancerSiteId);

        if (cancerTypeErr) {
          console.error("Failed to fetch cancer_type ids:", cancerTypeErr);
          setState((prev) => ({
            ...prev,
            error: "Failed to load cancer types.",
            resultsData: [],
            isLoading: false,
          }));
          return;
        }

        const validCancerTypeIds = cancerTypeRows?.map((row) => row.id);

        const { data: sampleRows, error: sampleErr } = await supabase
          .from("samples")
          .select("id, sample_barcode, cancer_type_id, sample_type")
          .eq("sample_type", "tumor")
          .in("cancer_type_id", validCancerTypeIds);

        if (sampleErr) {
          console.error("Failed to fetch matching samples:", sampleErr);
          setState((prev) => ({
            ...prev,
            error: "Failed to load sample data.",
            resultsData: [],
            isLoading: false,
          }));
          return;
        }

        sampleToCancerTypeMap = {};
        sampleRows.forEach((sample) => {
          const type = cancerTypeRows.find((ct) => ct.id === sample.cancer_type_id);
          sampleToCancerTypeMap[sample.id] = {
            barcode: sample.sample_barcode,
            cancerType: type?.tcga_code || "Unknown",
          };
        });

        setState((prev) => ({ ...prev, sampleToCancerType: sampleToCancerTypeMap, totalTumorSamples: sampleRows.length }));

        const metrics = selectedNoiseMetrics.filter((metric) => validMetrics.includes(metric));
        if (metrics.length === 0) {
          console.error(`Invalid metrics: ${selectedNoiseMetrics.join(", ")}. Valid options: ${validMetrics.join(", ")}`);
          setState((prev) => ({
            ...prev,
            error: "Invalid metrics selected.",
            resultsData: [],
            isLoading: false,
          }));
          return;
        }

        const sampleIds = sampleRows.map((row) => row.id);

        // Fetch data from Supabase for all metrics and normalizations
        const dataByNormalization: { [normMethod: string]: { [sampleId: string]: TumorData } } = {
          tpm: {},
          fpkm: {},
          fpkm_uq: {},
        };
        const supabaseData: {
          [metric: string]: { sample_id: string; tpm: number | null; fpkm: number | null; fpkm_uq: number | null }[];
        } = { DEPTH2: [], tITH: [] };

        for (const metric of validMetrics) {
          const tableName = metric === "DEPTH2" ? "depth2_scores" : "tith_scores";
          const { data: scoreRows, error: scoreErr } = await supabase
            .from(tableName)
            .select("sample_id, tpm, fpkm, fpkm_uq")
            .in("sample_id", sampleIds);

          if (scoreErr) {
            console.error(`Failed to fetch ${metric} scores from Supabase:`, scoreErr);
            setState((prev) => ({ ...prev, error: `Failed to fetch ${metric} data from Supabase.` }));
            continue;
          }

          supabaseData[metric] = scoreRows || [];
        }

        // Process Supabase data
        const sampleBarcodes = sampleRows.map((row) => row.sample_barcode);
        for (const metric of validMetrics) {
          const fieldName = noiseMetrics[metric as keyof typeof noiseMetrics] || metric.toLowerCase();
          for (const row of supabaseData[metric]) {
            const sampleId = row.sample_id;
            const sampleInfo = sampleToCancerTypeMap[sampleId];
            if (!sampleInfo || (cancerTypes.length > 0 && !cancerTypes.includes(sampleInfo.cancerType))) continue;

            for (const normMethod of normalizationMethods) {
              if (!dataByNormalization[normMethod][sampleId]) {
                dataByNormalization[normMethod][sampleId] = {
                  sample: sampleInfo.barcode,
                  cancer_type: sampleInfo.cancerType || "Unknown",
                };
              }
              dataByNormalization[normMethod][sampleId][fieldName] = row[normMethod] != null ? row[normMethod] : null;
            }
          }
        }

        // Identify missing data
        const missingData: { [normMethod: string]: { [metric: string]: string[] } } = {};
        for (const normMethod of normalizationMethods) {
          missingData[normMethod] = {};
          for (const metric of validMetrics) {
            missingData[normMethod][metric] = sampleIds.filter((sampleId) => {
              const sampleData = dataByNormalization[normMethod][sampleId];
              const fieldName = noiseMetrics[metric as keyof typeof noiseMetrics] || metric.toLowerCase();
              return !sampleData || sampleData[fieldName] == null || isNaN(sampleData[fieldName] as number);
            });
          }
        }

        // Fetch missing data from API
        const promises: Promise<{ metric: string; normMethod: string; data: any }>[] = [];
        for (const normMethod of normalizationMethods) {
          for (const metric of validMetrics) {
            const missingSampleIds = missingData[normMethod][metric];
            if (missingSampleIds.length > 0) {
              const missingBarcodes = missingSampleIds
                .map((id) => sampleToCancerTypeMap[id]?.barcode)
                .filter(Boolean);
              if (missingBarcodes.length > 0) {
                console.log(`Fetching API for missing data: metric=${metric}, norm=${normMethod}, samples=${missingBarcodes.length}`);
                promises.push(
                  fetch(`/api/TH-metrics?cancer=${cancerSite}&method=${normMethod}&metric=${metric}`)
                    .then((response) => {
                      if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
                      return response.json();
                    })
                    .then((data) => {
                      const filteredData = data.log2[normMethod]?.filter((item: any) =>
                        missingBarcodes.includes(item.sample_id)
                      ) || [];
                      return { metric, normMethod, data: filteredData };
                    })
                    .catch((error) => {
                      console.error(`Error fetching ${metric} (${normMethod}):`, error);
                      setState((prev) => ({ ...prev, error: `Failed to fetch ${metric} data for ${normMethod}.` }));
                      return { metric, normMethod, data: [] };
                    })
                );
              }
            }
          }
        }

        const metricResults = await Promise.all(promises);
        const supabaseUpsertData: {
          [metric: string]: { sample_id: string; tpm: number | null; fpkm: number | null; fpkm_uq: number | null }[];
        } = { DEPTH2: [], tITH: [] };

        for (const { metric, normMethod, data } of metricResults) {
          if (data && data.length > 0) {
            for (const item of data) {
              const sampleBarcode = item.sample_id;
              const supabaseSampleId = Object.keys(sampleToCancerTypeMap).find(
                (key) => sampleToCancerTypeMap[key].barcode === sampleBarcode
              );

              if (!supabaseSampleId) {
                console.warn(`No matching Supabase sample_id for sample_barcode ${sampleBarcode}`);
                continue;
              }

              const sampleInfo = sampleToCancerTypeMap[supabaseSampleId];
              if (cancerTypes.length > 0 && !cancerTypes.includes(sampleInfo.cancerType)) continue;

              const mapKey = supabaseSampleId;
              if (!dataByNormalization[normMethod][mapKey]) {
                dataByNormalization[normMethod][mapKey] = {
                  sample: sampleInfo.barcode,
                  cancer_type: sampleInfo.cancerType || "Unknown",
                };
              }
              const fieldName = noiseMetrics[metric as keyof typeof noiseMetrics] || metric.toLowerCase();
              const value = item[normMethod] != null ? item[normMethod] : null;
              dataByNormalization[normMethod][mapKey][fieldName] = value;

              let existingEntry = supabaseUpsertData[metric].find((entry) => entry.sample_id === supabaseSampleId);
              if (!existingEntry) {
                existingEntry = { sample_id: supabaseSampleId, tpm: null, fpkm: null, fpkm_uq: null };
                supabaseUpsertData[metric].push(existingEntry);
              }
              existingEntry[normMethod] = value;
            }
          }
        }

        // Upsert API-fetched data to Supabase
        for (const metric of validMetrics) {
          const tableName = metric === "DEPTH2" ? "depth2_scores" : "tith_scores";
          const dataToUpsert = supabaseUpsertData[metric];

          if (dataToUpsert.length > 0) {
            const upsertData = dataToUpsert.map((entry) => ({
              sample_id: entry.sample_id,
              tpm: entry.tpm,
              fpkm: entry.fpkm,
              fpkm_uq: entry.fpkm_uq,
            }));

            const { error: upsertError } = await supabase
              .from(tableName)
              .upsert(upsertData, { onConflict: "sample_id" });

            if (upsertError) {
              console.error(`Failed to upsert ${metric} data into ${tableName}:`, upsertError);
              setState((prev) => ({ ...prev, error: `Failed to upsert ${metric} data into Supabase.` }));
              continue;
            }
          }
        }

        // Process and cache data for all normalizations
        const processedDataByNorm: { [normMethod: string]: TumorData[] } = {};
        for (const normMethod of normalizationMethods) {
          const processedData = Object.values(dataByNormalization[normMethod]).filter((sampleData) =>
            validMetrics.some((metric) => {
              const fieldName = noiseMetrics[metric as keyof typeof noiseMetrics] || metric.toLowerCase();
              const value = sampleData[fieldName];
              return value !== null && !isNaN(value);
            })
          );
          const cacheKey = generateCacheKey({ cancerSite, cancerTypes, normalizationMethod: normMethod });
          console.log(`Caching data for ${normMethod}:`, cacheKey, "Data length:", processedData.length);
          setCachedData(cacheKey, processedData);
          processedDataByNorm[normMethod] = processedData;
        }

        setState((prev) => ({
          ...prev,
          rawResultsData: { ...prev.rawResultsData, ...processedDataByNorm },
          resultsData: processedDataByNorm[filterState.normalizationMethod].filter((sampleData) =>
            selectedNoiseMetrics.some((metric) => {
              const fieldName = noiseMetrics[metric as keyof typeof noiseMetrics] || metric.toLowerCase();
              const value = sampleData[fieldName];
              return value !== null && !isNaN(value);
            })
          ),
          totalTumorSamples: processedDataByNorm[filterState.normalizationMethod].length,
          isLoading: false,
        }));
      } catch (error) {
        console.error("Error during data fetch:", error);
        setState((prev) => ({
          ...prev,
          error: "Failed to load data. Please check the cancer site or sample data and try again.",
          resultsData: [],
          isLoading: false,
        }));
      }
    },
    [getCachedData, setCachedData, generateCacheKey, state.isLoading, filterState.normalizationMethod]
  );

  const debouncedFetchData = useCallback(
    (params: { cancerSite: string; cancerTypes: string[]; selectedNoiseMetrics: string[] }) => {
      if (filterTimeoutRef.current) {
        clearTimeout(filterTimeoutRef.current);
      }
      filterTimeoutRef.current = setTimeout(() => {
        fetchData(params);
      }, 500);
    },
    [fetchData]
  );

  // Filter rawResultsData client-side when normalizationMethod or selectedNoiseMetrics changes
  useEffect(() => {
    const dataForNorm = state.rawResultsData[filterState.normalizationMethod] || [];
    if (dataForNorm.length > 0) {
      const filteredData = dataForNorm.filter((sampleData) =>
        filterState.selectedNoiseMetrics.some((metric) => {
          const fieldName = noiseMetrics[metric as keyof typeof noiseMetrics] || metric.toLowerCase();
          const value = sampleData[fieldName];
          return value !== null && !isNaN(value);
        })
      );
      setState((prev) => ({
        ...prev,
        resultsData: filteredData,
        totalTumorSamples: filteredData.length,
        error: filteredData.length === 0 ? "No data matches the selected filters." : null,
      }));
    }
  }, [filterState.normalizationMethod, filterState.selectedNoiseMetrics, state.rawResultsData]);

  // Fetch data only when cancerSite or cancerTypes changes
  useEffect(() => {
    const cacheKeys = normalizationMethods.reduce(
      (acc, normMethod) => ({
        ...acc,
        [normMethod]: generateCacheKey({ cancerSite: params.cancerSite, cancerTypes: params.cancerTypes, normalizationMethod: normMethod }),
      }),
      {} as { [normMethod: string]: string }
    );

    const cachedData: { [normMethod: string]: TumorData[] } = {};
    let allCached = true;
    for (const normMethod of normalizationMethods) {
      const data = getCachedData(cacheKeys[normMethod]);
      if (data && data.length > 0) {
        cachedData[normMethod] = data;
      } else {
        allCached = false;
      }
    }

    if (allCached) {
      console.log("Cache hit for all normalizations:", cacheKeys);
      setState((prev) => ({
        ...prev,
        rawResultsData: { ...cachedData },
        resultsData: cachedData[filterState.normalizationMethod].filter((sampleData) =>
          filterState.selectedNoiseMetrics.some((metric) => {
            const fieldName = noiseMetrics[metric as keyof typeof noiseMetrics] || metric.toLowerCase();
            const value = sampleData[fieldName];
            return value !== null && !isNaN(value);
          })
        ),
        totalTumorSamples: cachedData[filterState.normalizationMethod].length,
        isLoading: false,
      }));
    } else if (!state.isLoading && params.cancerSite) {
      console.log("Cache miss for some normalizations, triggering fetch");
      debouncedFetchData({
        cancerSite: params.cancerSite,
        cancerTypes: params.cancerTypes,
        selectedNoiseMetrics: validMetrics, // Fetch all metrics to cache broadly
      });
    }

    return () => {
      if (filterTimeoutRef.current) {
        clearTimeout(filterTimeoutRef.current);
      }
    };
  }, [params.cancerSite, params.cancerTypes, getCachedData, generateCacheKey, debouncedFetchData, state.isLoading, filterState.normalizationMethod]);

  return { ...state, fetchData: debouncedFetchData };
};

const TumourResults: React.FC = () => {
  const [searchParams] = useSearchParams();
  const rawParams = useMemo(
    () => ({
      cancerSite: searchParams.get("cancerSite") || "",
      cancerTypes: searchParams.get("cancerTypes")?.split(",").filter(Boolean) || [],
      cancerType: searchParams.get("cancerType") || "",
    }),
    [searchParams]
  );

  const [filterState, dispatch] = useReducer(filterReducer, initialFilterState);
  const { resultsData, isLoading, error, totalTumorSamples, sampleToCancerType, fetchData } = useTumorResultsData(
    rawParams,
    filterState
  );

  const noiseMetrics = { DEPTH2: "depth2", tITH: "tith" };
  const allNoiseMetrics = Object.keys(noiseMetrics);
  const normalizationMethods = ["tpm", "fpkm", "fpkm_uq"];

  const updateFilters = useCallback(
    (updates: Partial<FilterState>) => {
      if (updates.normalizationMethod) {
        dispatch({ type: "SET_NORMALIZATION", payload: updates.normalizationMethod });
      }
      if (updates.selectedNoiseMetrics) {
        dispatch({ type: "SET_NOISE_METRICS", payload: updates.selectedNoiseMetrics });
      }
    },
    []
  );

  const handleFilterChange = useCallback(
    (filterId: string, value: string[]) => {
      console.log("handleFilterChange:", { filterId, value });
      if (filterId === "noiseMetrics") {
        if (value.length === 0) {
          console.warn("At least one noise metric must remain selected.");
          return;
        }
        updateFilters({ selectedNoiseMetrics: value });
      }
    },
    [updateFilters]
  );

  const customFilters = [
    {
      title: "TH Metrics",
      id: "noiseMetrics",
      type: "checkbox" as const,
      options: allNoiseMetrics.map((metric) => ({
        id: metric,
        label: metric,
        description:
          metric === "DEPTH2"
            ? "DEPTH2 measures the depth of tumor heterogeneity based on gene expression variability."
            : "tITH quantifies intra-tumor heterogeneity using transcriptomic profiles.",
        referenceLink: "https://example.com/paper",
      })),
      isMasterCheckbox: true,
      defaultOpen: false,
    },
  ];
// Define ITH Metrics content to pass to FilterPanel
  const ithMetricsContent = (
    // <CollapsibleCard title="ITH Metrics" className="text-medium">
      <div className="space-y-4 text-sm text-blue-900">
        <div>
          <h4 className="text-large font-bold">DEPTH2</h4>
          <p className="mb-2">
            DEPTH2 calculates a tumor’s ITH level based on the standard deviations of absolute z-scored expression values of a set of genes in the tumor.
          </p>
          <a
            href="https://pmc.ncbi.nlm.nih.gov/articles/PMC8974098/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600"
          >
            Learn more here
          </a>
        </div>
        <div>
          <h4 className="font-semibold">tITH</h4>
          <p className="mb-2">
            Calculated using the DEPTH algorithm, evaluating the ITH level of each tumor sample based on its gene expression profiles with reference to normal controls.
          </p>
          <a
            href="https://www.nature.com/articles/s42003-020-01230-7"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600"
          >
            Learn more here
          </a>
        </div>
      </div>
    // </CollapsibleCard>
  );
  const downloadData = useCallback(() => {
    const keys = ["sample", "cancer_type", "depth2", "tith"].filter((key) => {
      if (key === "depth2" && !filterState.selectedNoiseMetrics.includes("DEPTH2")) return false;
      if (key === "tith" && !filterState.selectedNoiseMetrics.includes("tITH")) return false;
      return true;
    });

    const headers = keys.join(",");
    const rows = resultsData.map((row) =>
      keys
        .map((key) => {
          const value = row[key as keyof TumorData];
          return typeof value === "number" ? value.toFixed(6) : value || "";
        })
        .join(",")
    );

    const content = [headers, ...rows].join("\n");
    const blob = new Blob([content], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `tumor_analysis_${rawParams.cancerSite}_${filterState.normalizationMethod}_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [resultsData, rawParams.cancerSite, filterState.normalizationMethod, filterState.selectedNoiseMetrics]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-yellow-50 flex flex-col">
      <Header />
      <main className="flex-grow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-[320px_1fr] gap-6">
            <div className="flex flex-col gap-6">
              <aside className="sticky top-24 self-start">
              <FilterPanel
              //   normalizationMethod={filterState.normalizationMethod}
              //   setNormalizationMethod={(value) => updateFilters({ normalizationMethod: value })}
              //   customFilters={customFilters}
              //   onFilterChange={handleFilterChange}
              //   selectedValues={{
              //     noiseMetrics: filterState.selectedNoiseMetrics,
              //   }}
              // />
              normalizationMethod={filterState.normalizationMethod}
                setNormalizationMethod={(value) => updateFilters({ normalizationMethod: value })}
                customFilters={customFilters}
                onFilterChange={handleFilterChange}
                selectedValues={{
                  noiseMetrics: filterState.selectedNoiseMetrics,
                }}
                additionalContent={ithMetricsContent} // Pass ITH Metrics content
              />
              
              {/* Removed standalone ITH Metrics panel */}
            {/* </div> */}
              {/* <div className="w-72 bg-blue-100 shadow-lg p-4 rounded-md h-auto sticky top-5 self-start"> */}
                {/* <CollapsibleCard title="ITH Metrics" className="text-medium">
                  <div className="space-y-4 text-sm text-blue-900">
                    <div>
                      <h4 className="text-large font-bold">DEPTH2</h4>
                      <p className="mb-2">
                        DEPTH2 calculates a tumor’s ITH level based on the standard deviations of absolute z-scored expression values of a set of genes in the tumor.
                      </p>
                      <a
                        href="https://pmc.ncbi.nlm.nih.gov/articles/PMC8974098/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600"
                      >
                        Learn more here
                      </a>
                    </div>
                    <div>
                      <h4 className="font-semibold">tITH</h4>
                      <p className="mb-2">
                        Calculated using the DEPTH algorithm, evaluating the ITH level of each tumor sample based on its gene expression profiles with reference to normal controls.
                      </p>
                      <a
                        href="https://www.nature.com/articles/s42003-020-01230-7"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600"
                      >
                        Learn more here
                      </a>
                    </div>
                  </div>
                </CollapsibleCard> */}
              {/* </div> */}
              </aside>
            </div>
            <div className="flex-1">
              {error && <div className="text-red-600 mb-4">{error}</div>}
              {isLoading ? (
                <LoadingSpinner message="Please wait..." />
              ) : resultsData.length === 0 ? (
                <div className="text-center text-red-600">No data available for selected filters.</div>
              ) : (
                <>
                  <Link
                    to="/tumour-analysis"
                    className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-6 transition-colors"
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Tumor Analysis
                  </Link>
                  <div className="mb-8">
                    <h2 className="text-4xl font-bold text-blue-900 mb-6">
                      Results for Tumor Analysis
                    </h2>
                    <div className="overflow-x-auto mb-6">
                      <table className="min-w-full bg-white border border-gray-200 rounded-lg shadow-sm">
                        <tbody>
                          <tr className="border-b">
                            <th className="text-left py-3 pl-4 text-blue-700 font-semibold w-1/6 border-r border-gray-300">Normalization</th>
                            <td className="py-3 pl-2 pr-4 text-blue-700 text-left align-top">
                              Log<sub>2</sub>({filterState.normalizationMethod.toUpperCase()} + 1)
                            </td>
                          </tr>
                          <tr>
                            <th className="text-left py-3 pl-4 text-blue-700 font-semibold w-1/6 border-r border-gray-300">Cancer Site</th>
                            <td className="py-3 pl-2 pr-4 text-blue-700 text-left align-top">
                              {rawParams.cancerSite} {rawParams.cancerTypes.length > 0 && `(${rawParams.cancerTypes.join(", ")})`}
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                    <div className="flex justify-center items-center">
                      <Card className="border-0 shadow-lg w-full">
                        <CardContent className="flex flex-col items-center p-4 text-center">
                          <Users className="h-6 w-6 text-red-600 mb-2" />
                          <div className="text-2xl font-bold text-red-600">{totalTumorSamples}</div>
                          <div className="text-xs text-gray-600">Total Tumor Samples</div>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                  {(filterState.selectedNoiseMetrics.includes("DEPTH2") || filterState.selectedNoiseMetrics.includes("tITH")) && (
                    <div className="mb-8">
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="text-2xl font-bold text-blue-900">Statistical Metrics</h3>
                        <button
                          onClick={() => dispatch({ type: "TOGGLE_STATISTICAL_METRICS" })}
                          className="text-blue-900"
                        >
                          {filterState.isStatisticalMetricsOpen ? (
                            <ChevronDown className="h-6 w-6" />
                          ) : (
                            <ChevronRight className="h-6 w-6" />
                          )}
                        </button>
                      </div>
                      {filterState.isStatisticalMetricsOpen && (
                        <>
                          {["DEPTH2", "tITH"].map((metric) =>
                            filterState.selectedNoiseMetrics.includes(metric) ? (
                              <CollapsibleCard
                                key={metric}
                                title={`${metric} Scores`}
                                defaultOpen={filterState.metricOpenState[metric.toLowerCase()]}
                                onToggle={(open) =>
                                  dispatch({ type: "TOGGLE_METRIC_SECTION", payload: metric.toLowerCase() })
                                }
                                className="mb-4"
                              >
                                <PlotlyBoxPlot
                                  data={resultsData}
                                  xKey={noiseMetrics[metric as keyof typeof noiseMetrics]}
                                  yLabel={`${metric} (${filterState.normalizationMethod})`}
                                  normalizationMethod={filterState.normalizationMethod}
                                  selectedGroups={[...new Set(resultsData.map((d) => d.cancer_type))]}
                                  title={`${metric} Distribution (${filterState.normalizationMethod})`}
                                  colorMap={{}}
                                />
                              </CollapsibleCard>
                            ) : null
                          )}
                          {resultsData.length > 0 && (
                            <div className="mt-2">
                              <CollapsibleCard
                                title="Data Table"
                                className="h-full"
                                downloadButton={
                                  <Button
                                    onClick={() => downloadData()}
                                    variant="outline"
                                    size="sm"
                                    className="h-6 px-2 text-xs"
                                  >
                                    <Download className="h-4 w-4 mr-2" /> Download CSV
                                  </Button>
                                }
                              >
                                <DataTable
                                  data={resultsData}
                                  columns={[
                                    {
                                      key: "sample",
                                      header: "Sample",
                                      sortable: true,
                                    },
                                    {
                                      key: "cancer_type",
                                      header: "Cancer Project",
                                      sortable: true,
                                    },
                                    ...(filterState.selectedNoiseMetrics.includes("DEPTH2")
                                      ? [
                                          {
                                            key: "depth2",
                                            header: `DEPTH2 (${filterState.normalizationMethod})`,
                                            sortable: true,
                                            render: (value) => (typeof value === "number" ? value.toFixed(4) : value),
                                          },
                                        ]
                                      : []),
                                    ...(filterState.selectedNoiseMetrics.includes("tITH")
                                      ? [
                                          {
                                            key: "tith",
                                            header: `tITH (${filterState.normalizationMethod})`,
                                            sortable: true,
                                            render: (value) => (typeof value === "number" ? value.toFixed(4) : value),
                                          },
                                        ]
                                      : []),
                                  ]}
                                  defaultSortKey="sample"
                                  scrollHeight="400px"
                                  stickyHeader={true}
                                />
                              </CollapsibleCard>
                            </div>
                          )}
                        </>
                      )}
                    </div>
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

export default React.memo(TumourResults);