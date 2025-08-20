import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useSearchParams, Link } from "react-router-dom";
import supabase from "@/supabase-client";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Download, Box, ChevronRight, ChevronDown, ChevronUp, Users } from "lucide-react";
import { PlotlyBarChart } from "@/components/charts/index";
import { LoadingSpinner } from "@/components/ui/loadingSpinner";
import Header from "@/components/header";
import Footer from "@/components/footer";
import { TumorData, SampleInfo } from "@/components/types/tumor";
import { useCache } from "@/hooks/use-cache";
import FilterPanel from "@/components/FilterPanel";
import { DataTable } from "@/components/ui/data-table";
import CollapsibleCard from "@/components/ui/collapsible-card";
import PlotlyBoxPlot from "@/components/charts/PlotlyTumorBoxPlot";

// Utility to debounce state updates
interface DebouncedFunction<T extends (...args: any[]) => any> {
  (...args: Parameters<T>): void;
  cancel: () => void;
}

const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): DebouncedFunction<T> => {
  let timeout: NodeJS.Timeout | null = null;

  const debounced = (...args: Parameters<T>): void => {
    if (timeout !== null) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(() => func(...args), wait);
  };

  debounced.cancel = () => {
    if (timeout !== null) {
      clearTimeout(timeout);
      timeout = null;
    }
  };

  return debounced as DebouncedFunction<T>;
};

const TumourResults = () => {
  const [searchParams] = useSearchParams();
  const rawParams = useMemo(() => ({
    cancerSite: searchParams.get("cancerSite") || "",
    cancerTypes: searchParams.get("cancerTypes")?.split(",").filter(Boolean) || [],
    cancerType: searchParams.get("cancerType") || "",
  }), [searchParams.toString()]);

  const [normalizationMethod, setNormalizationMethod] = useState("tpm");
  const [selectedNoiseMetrics, setSelectedNoiseMetrics] = useState<string[]>(["DEPTH2", "tITH"]);
  const [isStatisticalMetricsOpen, setIsStatisticalMetricsOpen] = useState(true);
  const [metricOpenState, setMetricOpenState] = useState({ depth2: true, tith: true });
  const [isTableOpen, setIsTableOpen] = useState(true);
  const [totalTumorSamples, setTotalTumorSamples] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [tumorData, setTumorData] = useState<TumorData[]>([]);
  const [sampleToCancerType, setSampleToCancerType] = useState<{ [sampleId: number]: SampleInfo }>({});
  const { getCachedData, setCachedData, generateCacheKey } = useCache<TumorData[]>();
  const filterTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  // Track initial fetches for cancerSite and cancerTypes
  const initialFetchTracker = useRef<Set<string>>(new Set());

  const noiseMetrics = { DEPTH2: "depth2", tITH: "tith" };
  const allNoiseMetrics = Object.keys(noiseMetrics);
  const normalizationMethods = ["tpm", "fpkm", "fpkm_uq"];

  const updateFilters = useCallback(
    (newFilters: {
      normalizationMethod?: string;
      selectedNoiseMetrics?: string[];
    }) => {
      if (filterTimeoutRef.current) {
        clearTimeout(filterTimeoutRef.current);
      }
      filterTimeoutRef.current = setTimeout(() => {
        if (newFilters.normalizationMethod) {
          setNormalizationMethod(newFilters.normalizationMethod);
        }
        if (newFilters.selectedNoiseMetrics) {
          setSelectedNoiseMetrics(newFilters.selectedNoiseMetrics);
        }
      }, 300);
    },
    []
  );

  const handleFilterChange = useCallback((filterId: string, value: string[]) => {
    if (filterId === "noiseMetrics") {
      updateFilters({ selectedNoiseMetrics: value });
    }
  }, [updateFilters]);

  const fetchTumorExpressionData = useCallback(async ({
    cancerSite,
    cancerTypes,
    normalizationMethod,
    selectedNoiseMetrics,
  }: {
    cancerSite: string;
    cancerTypes: string[];
    normalizationMethod: string;
    selectedNoiseMetrics: string[];
  }) => {
    console.log("Starting fetch:", { cancerSite, cancerTypes, normalizationMethod, selectedNoiseMetrics });
    if (!cancerSite || !selectedNoiseMetrics.length || isLoading) {
      console.warn("No cancerSite, selectedNoiseMetrics, or already loading");
      setTumorData([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    let sampleToCancerTypeMap: { [sampleId: number]: SampleInfo } = {};

    try {
      // Generate a key for tracking initial fetches (excludes normalizationMethod and selectedNoiseMetrics)
      const initialFetchKey = generateCacheKey({ cancerSite, cancerTypes });
      const isInitialFetch = !initialFetchTracker.current.has(initialFetchKey);

      // Generate cache key for processed data
      const cacheKey = generateCacheKey({
        cancerSite,
        cancerTypes,
        normalizationMethod,
        selectedNoiseMetrics: selectedNoiseMetrics.sort(),
      });
      const cachedData = getCachedData(cacheKey);
      if (cachedData && cachedData.length !== 0) {
        console.log("Using cached data:", cachedData);
        setTumorData(cachedData);
        setTotalTumorSamples(cachedData.length);
        setIsLoading(false);
        return;
      }

      // Fetch cancer site and sample information
      const { data: siteRows, error: siteRowsErr } = await supabase
        .from("Sites")
        .select("id, name")
        .eq("name", cancerSite);

      if (siteRowsErr) {
        console.error("Failed to fetch cancer site:", siteRowsErr);
        setTumorData([]);
        setIsLoading(false);
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
        setTumorData([]);
        setIsLoading(false);
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
        setTumorData([]);
        setIsLoading(false);
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

      setSampleToCancerType(sampleToCancerTypeMap);
      setTotalTumorSamples(sampleRows.length);

      const validMetrics = ["DEPTH2", "tITH"];
      const metrics = selectedNoiseMetrics.filter((metric) => validMetrics.includes(metric));
      if (metrics.length === 0) {
        console.error(`Invalid metrics: ${selectedNoiseMetrics.join(", ")}. Valid options: ${validMetrics.join(", ")}`);
        setTumorData([]);
        setIsLoading(false);
        return;
      }

      let processedData: TumorData[] = [];
      let missingDataMetrics: { metric: string; sampleIds: string[] }[] = [];
      const sampleExpressionMap: { [sampleId: number]: TumorData } = {};

      // Query Supabase for all normalization methods for selected metrics
      for (const metric of metrics) {
        const tableName = metric === "DEPTH2" ? "depth2" : "tith";
        console.log(`Checking Supabase table: ${tableName} for ${normalizationMethod}`);

        const { data: metricData, error: metricError } = await supabase
          .from(tableName)
          .select(`sample_id, tpm, fpkm, fpkm_uq`)
          .in("sample_id", Object.keys(sampleToCancerTypeMap)) as {
            data: { sample_id: number; tpm: number | null; fpkm: number | null; fpkm_uq: number | null }[] | null;
            error: any;
          };

        if (metricError) {
          console.error(`Failed to fetch ${metric} from Supabase table ${tableName}:`, metricError);
          continue;
        }

        if (!metricData) {
          console.warn(`No data returned for ${metric} from Supabase table ${tableName}`);
          missingDataMetrics.push({ metric, sampleIds: Object.keys(sampleToCancerTypeMap) });
          continue;
        }

        const sampleIdsWithCompleteData = new Set(
          metricData
            .filter((item) => item[normalizationMethod.toLowerCase()] != null)
            .map((item) => item.sample_id)
        );

        const missingSampleIds = Object.keys(sampleToCancerTypeMap).filter(
          (sampleId) => !sampleIdsWithCompleteData.has(Number(sampleId))
        );

        if (missingSampleIds.length > 0) {
          console.log(`Missing or incomplete ${metric} data for ${missingSampleIds.length} samples for ${normalizationMethod}`);
          missingDataMetrics.push({ metric, sampleIds: missingSampleIds });
        }

        metricData.forEach((item) => {
          const sampleId = item.sample_id;
          const sampleInfo = sampleToCancerTypeMap[sampleId];

          if (!sampleInfo) {
            console.warn(`No matching sample info for sample_id ${sampleId}`);
            return;
          }

          if (!sampleExpressionMap[sampleId]) {
            sampleExpressionMap[sampleId] = {
              sample: sampleInfo.barcode,
              cancer_type: sampleInfo.cancerType || "Unknown",
            };
          }

          const fieldName = noiseMetrics[metric as keyof typeof noiseMetrics] || metric.toLowerCase();
          const value = item[normalizationMethod.toLowerCase()] || 0;
          sampleExpressionMap[sampleId][fieldName] = value;
        });
      }

      processedData = Object.values(sampleExpressionMap).filter((sampleData) => {
        const hasValidMetric = metrics.some((metric) => {
          const fieldName = noiseMetrics[metric as keyof typeof noiseMetrics] || metric.toLowerCase();
          const value = sampleData[fieldName];
          return value !== null && !isNaN(value);
        });
        return hasValidMetric;
      });

      // If no missing data or this is not the initial fetch, use Supabase data
      if (missingDataMetrics.length === 0 || !isInitialFetch) {
        console.log(isInitialFetch ? `All data found in Supabase for ${normalizationMethod}` : `Using Supabase data for filter change`);
        setCachedData(cacheKey, processedData);
        setTumorData(processedData);
        setIsLoading(false);
        return;
      }

      // Initial fetch: Query API for missing data
      initialFetchTracker.current.add(initialFetchKey);
      const supabaseUpsertData: {
        [metric: string]: { sample_id: string; tpm: number | null; fpkm: number | null; fpkm_uq: number | null }[];
      } = { DEPTH2: [], tITH: [] };

      const promises: Promise<{ metric: string; normMethod: string; data: any }>[] = [];
      for (const { metric, sampleIds } of missingDataMetrics) {
        for (const normMethod of normalizationMethods) {
          promises.push(
            fetch(`http://localhost:5001/api/TH-metrics?cancer=${cancerSite}&method=${normMethod}&metric=${metric}&sample_ids=${sampleIds.join(",")}`)
              .then((response) => {
                if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
                return response.json();
              })
              .then((data) => ({ metric, normMethod, data }))
              .catch((error) => {
                console.error(`Error fetching ${metric} (${normMethod}):`, error);
                return { metric, normMethod, data: [] };
              })
          );
        }
      }

      const metricResults = await Promise.all(promises);
      const sampleExpressionMapAfterApi: { [sampleId: string]: TumorData } = { ...sampleExpressionMap };

      metricResults.forEach(({ metric, normMethod, data }) => {
        if (data && data.length > 0) {
          data.forEach((item: any) => {
            const sampleId = item.sample_id || item.sample_barcode;
            const supabaseSampleId = Object.keys(sampleToCancerTypeMap).find(
              (key) => sampleToCancerTypeMap[key].barcode === sampleId || key === sampleId
            );

            if (!supabaseSampleId) return;

            const sampleInfo = sampleToCancerTypeMap[supabaseSampleId];
            if (!sampleInfo || (cancerTypes.length > 0 && !cancerTypes.includes(sampleInfo.cancerType))) return;

            const mapKey = supabaseSampleId;
            if (!sampleExpressionMapAfterApi[mapKey]) {
              sampleExpressionMapAfterApi[mapKey] = {
                sample: sampleInfo.barcode,
                cancer_type: sampleInfo.cancerType || "Unknown",
              };
            }
            if (normMethod === normalizationMethod) {
              const fieldName = noiseMetrics[metric as keyof typeof noiseMetrics] || metric.toLowerCase();
              const value = item[normMethod] != null ? item[normMethod] : 0;
              sampleExpressionMapAfterApi[mapKey][fieldName] = value;
            }

            let existingEntry = supabaseUpsertData[metric].find((entry) => entry.sample_id === supabaseSampleId);
            if (!existingEntry) {
              existingEntry = { sample_id: supabaseSampleId, tpm: null, fpkm: null, fpkm_uq: null };
              supabaseUpsertData[metric].push(existingEntry);
            }
            existingEntry[normMethod] = item[normMethod] != null ? item[normMethod] : null;
          });
        }
      });

      // Upsert API data to Supabase
      for (const metric of metrics) {
        const tableName = metric === "DEPTH2" ? "depth2" : "tith";
        const dataToUpsert = supabaseUpsertData[metric];

        if (dataToUpsert.length > 0) {
          const { data: existingRows, error: fetchError } = await supabase
            .from(tableName)
            .select("id, sample_id")
            .in("sample_id", dataToUpsert.map((entry) => entry.sample_id));

          if (fetchError) {
            console.error(`Failed to fetch existing rows from ${tableName}:`, fetchError);
            continue;
          }

          const existingSampleIds = new Map(existingRows?.map((row) => [row.sample_id, row.id]) || []);

          const toInsert = dataToUpsert.filter((entry) => !existingSampleIds.has(entry.sample_id));
          const toUpdate = dataToUpsert.filter((entry) => existingSampleIds.has(entry.sample_id));

          if (toInsert.length > 0) {
            const { error: insertError } = await supabase.from(tableName).upsert(toInsert, { onConflict: "sample_id" });
            if (insertError) console.error(`Failed to insert ${metric} data:`, insertError);
          }

          if (toUpdate.length > 0) {
            for (const entry of toUpdate) {
              const rowId = existingSampleIds.get(entry.sample_id);
              const { error: updateError } = await supabase
                .from(tableName)
                .update({ tpm: entry.tpm, fpkm: entry.fpkm, fpkm_uq: entry.fpkm_uq })
                .eq("id", rowId);
              if (updateError) console.error(`Failed to update ${metric} data for sample_id ${entry.sample_id}:`, updateError);
            }
          }
        }
      }

      processedData = Object.values(sampleExpressionMapAfterApi).filter((sampleData) => {
        const hasValidMetric = metrics.some((metric) => {
          const fieldName = noiseMetrics[metric as keyof typeof noiseMetrics] || metric.toLowerCase();
          const value = sampleData[fieldName];
          return value !== null && !isNaN(value);
        });
        return hasValidMetric;
      });

      setCachedData(cacheKey, processedData);
      setTumorData(processedData);
      setIsLoading(false);
    } catch (error) {
      console.error("Error during data fetch:", error);
      setTumorData([]);
      setIsLoading(false);
    }
  }, [getCachedData, setCachedData, generateCacheKey, isLoading]);

  const debouncedFetch = useMemo(() => debounce(fetchTumorExpressionData, 500), [fetchTumorExpressionData]);

  useEffect(() => {
    if (!isLoading) {
      debouncedFetch({
        cancerSite: rawParams.cancerSite,
        cancerTypes: rawParams.cancerTypes,
        normalizationMethod,
        selectedNoiseMetrics,
      });
    }
    return () => debouncedFetch.cancel();
  }, [rawParams.cancerSite, rawParams.cancerTypes, normalizationMethod, selectedNoiseMetrics, debouncedFetch, isLoading]);

  const customFilters = [
    {
      title: "TH Metrics",
      id: "noiseMetrics",
      type: "checkbox" as const,
      options: allNoiseMetrics.map(metric => ({
        id: metric,
        label: metric,
      })),
      isMasterCheckbox: true,
      defaultOpen: false,
    },
  ];

  const downloadData = useCallback(() => {
    const keys = ["sample", "cancer_type", "depth2", "tith"].filter((key) => {
      if (key === "depth2" && !selectedNoiseMetrics.includes("DEPTH2")) return false;
      if (key === "tith" && !selectedNoiseMetrics.includes("tITH")) return false;
      return true;
    });

    const headers = keys.join(",");
    const rows = tumorData.map((row) =>
      keys.map((key) => {
        const value = row[key as keyof TumorData];
        return typeof value === "number" ? value.toFixed(6) : value || "";
      }).join(",")
    );

    const content = [headers, ...rows].join("\n");
    const blob = new Blob([content], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `tumor_analysis_${rawParams.cancerSite}_${normalizationMethod}_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [tumorData, rawParams.cancerSite, normalizationMethod, selectedNoiseMetrics]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-yellow-50 flex flex-col">
      <Header />
      <main className="flex-grow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-[320px_1fr] gap-6">
            <FilterPanel
              normalizationMethod={normalizationMethod}
              setNormalizationMethod={(value) => updateFilters({ normalizationMethod: value })}
              customFilters={customFilters}
              onFilterChange={handleFilterChange}
              selectedValues={{
                noiseMetrics: selectedNoiseMetrics,
              }}
            />
            <div className="flex-1">
              {isLoading ? (
                <LoadingSpinner message="Loading results..." />
              ) : tumorData.length === 0 ? (
                <LoadingSpinner message="Loading results..." />
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
                            <th className="text-left py-3 px-4 text-blue-700 font-semibold w-1/3">Normalization</th>
                            <td className="py-3 px-4 text-blue-700">
                              log2({normalizationMethod.toUpperCase()} + 1)
                            </td>
                          </tr>
                          <tr>
                            <th className="text-left py-3 px-4 text-blue-700 font-semibold w-1/3">Cancer Site</th>
                            <td className="py-3 px-4 text-blue-700">
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
                  {(selectedNoiseMetrics.includes("DEPTH2") || selectedNoiseMetrics.includes("tITH")) && (
                    <div className="mb-8">
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="text-2xl font-bold text-blue-900">Statistical Metrics</h3>
                        <button
                          onClick={() => setIsStatisticalMetricsOpen((prev) => !prev)}
                          className="text-blue-900"
                        >
                          {isStatisticalMetricsOpen ? (
                            <ChevronDown className="h-6 w-6" />
                          ) : (
                            <ChevronRight className="h-6 w-6" />
                          )}
                        </button>
                      </div>
                      {isStatisticalMetricsOpen && (
                        <>
                          {["DEPTH2", "tITH"].map((metric) =>
                              selectedNoiseMetrics.includes(metric) ? (
                                <CollapsibleCard
                                  key={metric}
                                  title={`${metric} Scores`}
                                  defaultOpen={metricOpenState[metric.toLowerCase()]}
                                  onToggle={(open) =>
                                    setMetricOpenState((prev) => ({
                                      ...prev,
                                      [metric.toLowerCase()]: open,
                                    }))
                                  }
                                  className="mb-4"
                                >
                                  <PlotlyBoxPlot
                                    data={tumorData}
                                    xKey={noiseMetrics[metric as keyof typeof noiseMetrics]}
                                    normalizationMethod={normalizationMethod}
                                    selectedGroups={[...new Set(tumorData.map((d) => d.cancer_type))]}
                                    title={`${metric} Distribution by Cancer (${normalizationMethod})`}
                                    colorMap={{}}
                                  />
                                </CollapsibleCard>
                              ) : null
                            )}
                          {tumorData.length > 0 && (
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
                                  data={tumorData}
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
                                    ...(selectedNoiseMetrics.includes("DEPTH2")
                                      ? [
                                          {
                                            key: "depth2",
                                            header: `DEPTH2 (${normalizationMethod})`,
                                            sortable: true,
                                            render: (value) => typeof value === "number" ? value.toFixed(4) : value,
                                          },
                                        ]
                                      : []),
                                    ...(selectedNoiseMetrics.includes("tITH")
                                      ? [
                                          {
                                            key: "tith",
                                            header: `tITH (${normalizationMethod})`,
                                            sortable: true,
                                            render: (value) => typeof value === "number" ? value.toFixed(4) : value,
                                          },
                                        ]
                                      : []),
                                  ]}
                                  defaultSortKey="sample"
                                  scrollHeight="400px"
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

  function toggleMetricSection(metric: string) {
    setMetricOpenState((prev) => ({
      ...prev,
      [metric]: !prev[metric as keyof typeof metricOpenState],
    }));
  }
};

export default TumourResults;