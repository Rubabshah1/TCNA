import { useState, useEffect, useRef, useMemo } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import supabase from "@/supabase-client";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Download, Box, ChevronRight, ChevronDown } from "lucide-react";
import Header from "@/components/header";
import Footer from "@/components/footer";
import { LoadingSpinner } from "@/components/ui/loadingSpinner";

import {
  ResponsiveContainer,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ComposedChart,
  Bar,
  Scatter,
} from "recharts";

// Define types
interface TumorData {
  sample: string;
  cancer_type: string;
  depth2?: number;
  tith?: number;
}

interface SampleInfo {
  barcode: string;
  cancerType: string;
}

interface MetricData {
  sample_id: string;
  tpm: number | null;
  fpkm: number | null;
  fpkm_uq: number | null;
}

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
  const cancerSite = searchParams.get("cancerSite") || "";
  const cancerTypes = useMemo(
    () => searchParams.get("cancerTypes")?.split(",") || [],
    [searchParams]
  );
  const cancerType = searchParams.get("cancerType") || "";

  // Filter states
  // const [normalizationMethod, setNormalizationMethod] = useState("tpm");
  const [normalizationMethod, setNormalizationMethod] = useState('tpm');
  const [selectedNoiseMetrics, setSelectedNoiseMetrics] = useState([
    "DEPTH2",
    "tITH",
  ]);
  const [isNoiseMetricsOpen, setIsNoiseMetricsOpen] = useState(false);
  const [isAnalysisPlotsOpen, setIsAnalysisPlotsOpen] = useState(false);
  const [visiblePlots, setVisiblePlots] = useState({
    depth2: true,
    tith: true,
  });
  const [totalTumorSamples, setTotalTumorSamples] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const chartRefs = useRef<{ [key: string]: any }>({});
  const [tumorData, setTumorData] = useState<TumorData[]>([]);
  const [sampleToCancerType, setSampleToCancerType] = useState<{
    [sampleId: number]: SampleInfo;
  }>({});

  // Noise metric options
  const noiseMetrics = {
    DEPTH2: "depth2",
    tITH: "tith",
  };

  const allNoiseMetrics = Object.keys(noiseMetrics);
  const areAllNoiseSelected = allNoiseMetrics.every((metric) =>
    selectedNoiseMetrics.includes(metric)
  );

  const allPlotKeys = ["depth2", "tith"];
  const areAllPlotsSelected = allPlotKeys.every(
    (plot) => visiblePlots[plot as keyof typeof visiblePlots]
  );

  // Handle noise metric selection
  const handleNoiseMetricToggle = debounce((metric: string) => {
    setSelectedNoiseMetrics((prev) =>
      prev.includes(metric) ? prev.filter((m) => m !== metric) : [...prev, metric]
    );
  }, 100);

  // Handle master checkbox for noise metrics
  const toggleAllNoiseMetrics = debounce((checked: boolean) => {
    setSelectedNoiseMetrics(checked ? allNoiseMetrics : []);
  }, 100);

  // Handle individual plot visibility
  const handlePlotToggle = debounce((plotKey: string) => {
    setVisiblePlots((prev) => ({
      ...prev,
      [plotKey]: !prev[plotKey as keyof typeof visiblePlots],
    }));
  }, 100);

  // Handle master checkbox for plots
  const toggleAllPlots = debounce((checked: boolean) => {
    setVisiblePlots((prev) => ({
      ...prev,
      ...Object.fromEntries(allPlotKeys.map((plot) => [plot, checked])),
    }));
  }, 100);

  // Apply filters and sync visiblePlots with selectedNoiseMetrics
  const applyFilters = () => {
    console.log("Applying filters:", {
      normalizationMethod,
      selectedNoiseMetrics,
      visiblePlots,
    });
    setVisiblePlots((prev) => ({
      ...prev,
      depth2: selectedNoiseMetrics.includes("DEPTH2"),
      tith: selectedNoiseMetrics.includes("tITH"),
    }));
  };

  // Debug component lifecycle and state
  useEffect(() => {
    console.log("🛠️ TumourResults mounted");
    console.log("🛠️ tumorData state:", tumorData);
    console.log("🛠️ visiblePlots state:", visiblePlots);
    return () => console.log("🛠️ TumourResults unmounted");
  }, [tumorData, visiblePlots]);

const fetchTumorExpressionData = async ({
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
  console.log("Starting fetch:", {
    cancerSite,
    cancerTypes,
    normalizationMethod,
    selectedNoiseMetrics,
  });
  if (!cancerSite || !selectedNoiseMetrics.length) {
    console.warn("No cancerSite or selectedNoiseMetrics provided");
    setTumorData([]);
    setIsLoading(false);
    return;
  }

  setIsLoading(true);
  let sampleToCancerTypeMap: { [sampleId: number]: SampleInfo } = {};
  let isMounted = true;

  try {
    // Step 1: Get IDs for selected TCGA cancer codes
    const { data: siteRows, error: siteRowsErr } = await supabase
      .from("Sites")
      .select("id, name")
      .eq("name", cancerSite);

    if (siteRowsErr) {
      console.error("  Failed to fetch cancer site:", siteRowsErr);
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
            .select("id, tcga_code")
            .in("tcga_code", cancerTypes)
        : await supabase
            .from("cancer_types")
            .select("id, tcga_code, site_id")
            .eq("site_id", cancerSiteId);

    console.log("cancertype data fetched:", cancerTypeRows);
    if (cancerTypeErr) {
      console.error("  Failed to fetch cancer_type ids:", cancerTypeErr);
      setTumorData([]);
      setIsLoading(false);
      return;
    }

    const validCancerTypeIds = cancerTypeRows?.map((row) => row.id);

    // Step 2: Get samples with id and sample_barcode
    const { data: sampleRows, error: sampleErr } = await supabase
      .from("samples")
      .select("id, sample_barcode, cancer_type_id, sample_type")
      .eq("sample_type", "tumor")
      .in("cancer_type_id", validCancerTypeIds);

    console.log("samples data fetched:", sampleRows);
    if (sampleErr) {
      console.error("  Failed to fetch matching samples:", sampleErr);
      setTumorData([]);
      setIsLoading(false);
      return;
    }

    sampleToCancerTypeMap = {};
    sampleRows.forEach((sample) => {
      const type = cancerTypeRows.find(
        (ct) => ct.id === sample.cancer_type_id
      );
      if (type) {
        sampleToCancerTypeMap[sample.id] = {
          barcode: sample.sample_barcode,
          cancerType: type.tcga_code,
        };
      } else {
        console.warn(
          `  No matching cancer_type found for sample id ${sample.id}`
        );
        sampleToCancerTypeMap[sample.id] = {
          barcode: sample.sample_barcode,
          cancerType: "Unknown",
        };
      }
    });

    setSampleToCancerType(sampleToCancerTypeMap);
  } catch (error) {
    console.error("  Unexpected error while fetching sample info:", error);
    setTumorData([]);
    setIsLoading(false);
    return;
  }

  const validMetrics = ["DEPTH2", "tITH"];
  const metrics = selectedNoiseMetrics.filter((metric) =>
    validMetrics.includes(metric)
  );

  if (metrics.length === 0) {
    console.error(
      `Invalid metrics: ${selectedNoiseMetrics.join(
        ", "
      )}. Valid options: ${validMetrics.join(", ")}`
    );
    setTumorData([]);
    setIsLoading(false);
    return;
  }

  const cacheKeySite = `tumorData_site_${cancerSite}_${normalizationMethod}_${selectedNoiseMetrics
    .sort()
    .join(",")}`;
  const cacheKeysByType = cancerTypes.map(
    (ct) =>
      `tumorData_type_${ct}_${normalizationMethod}_${selectedNoiseMetrics
        .sort()
        .join(",")}`
  );

  // Step 3: Check Supabase for existing rows
  let processedData: TumorData[] = [];
  let missingDataMetrics: { metric: string; sampleIds: string[] }[] = [];
  const sampleExpressionMap: { [sampleId: number]: TumorData } = {};

  try {
    for (const metric of metrics) {
      const tableName = metric === "DEPTH2" ? "depth2" : "tith";
      console.log(`Checking Supabase table: ${tableName} for ${normalizationMethod}`);

      const { data: metricData, error: metricError } = await supabase
        .from(tableName)
        .select(`sample_id, ${normalizationMethod.toLowerCase()}`)
        .in("sample_id", Object.keys(sampleToCancerTypeMap)) as { data: { sample_id: number; [key: string]: number | null }[] | null; error: any };

      if (metricError) {
        console.error(`  Failed to fetch ${metric} from Supabase table ${tableName}:`, metricError);
        continue;
      }

      if (!metricData) {
        console.warn(`  No data returned for ${metric} from Supabase table ${tableName}`);
        missingDataMetrics.push({ metric, sampleIds: Object.keys(sampleToCancerTypeMap) });
        continue;
      }

      console.log(`Supabase data for ${metric} (${normalizationMethod}):`, metricData.slice(0, 2));

      // Check for complete data based on the selected normalizationMethod only
      const sampleIdsWithCompleteData = new Set(
        metricData
          .filter((item) => item[normalizationMethod.toLowerCase()] != null)
          .map((item) => item.sample_id)
      );

      console.log(
        `  Found complete ${metric} data in Supabase for ${sampleIdsWithCompleteData.size} samples for ${normalizationMethod}`
      );

      // const missingSampleIds = Object.keys(sampleToCancerTypeMap).filter(
      //   (sampleId) => !sampleIdsWithCompleteData.has(sampleId)
      // );
      const missingSampleIds = Object.keys(sampleToCancerTypeMap).filter(
        (sampleId) => !sampleIdsWithCompleteData.has(Number(sampleId))
      );

      if (missingSampleIds.length > 0) {
        console.log(
          `  Missing or incomplete ${metric} data for ${missingSampleIds.length} samples for ${normalizationMethod}`,
          missingSampleIds.slice(0, 2)
        );
        missingDataMetrics.push({ metric, sampleIds: missingSampleIds });
      }

      // Process available Supabase data for the selected normalization method
      metricData.forEach((item) => {
        const sampleId = item.sample_id;
        const sampleInfo = sampleToCancerTypeMap[sampleId];

        if (!sampleInfo) {
          console.warn(`  No matching sample info for sample_id ${sampleId}`);
          return;
        }

        if (!sampleExpressionMap[sampleId]) {
          sampleExpressionMap[sampleId] = {
            sample: sampleInfo.barcode,
            cancer_type: sampleInfo.cancerType || "Unknown",
          };
        }

        const fieldName =
          noiseMetrics[metric as keyof typeof noiseMetrics] || metric.toLowerCase();
        const value = item[normalizationMethod.toLowerCase()] || 0;
        // console.log(`Setting ${fieldName} for sample ${sampleId} to ${value} (${normalizationMethod})`);
        sampleExpressionMap[sampleId][fieldName] = value;
      });
    }

    processedData = Object.values(sampleExpressionMap).filter(
      (sampleData) => {
        const hasValidMetric = metrics.some((metric) => {
          const fieldName =
            noiseMetrics[metric as keyof typeof noiseMetrics] ||
            metric.toLowerCase();
          const value = sampleData[fieldName];
          return value !== null && !isNaN(value);
        });
        if (!hasValidMetric) {
          console.warn(
            `  No valid metric values for sample ${sampleData.sample}`
          );
          return false;
        }
        return true;
      }
    );

    console.log(
      `  Processed ${processedData.length} samples from Supabase`,
      processedData.slice(0, 2)
    );

    // If all samples have complete data, use Supabase data
    if (missingDataMetrics.length === 0) {
      console.log(
        `  All data found in Supabase for ${normalizationMethod}, skipping API calls`
      );
      if (isMounted) {
        setTumorData(processedData);
        setTotalTumorSamples(processedData.length);
      }
      setIsLoading(false);
      return;
    }
  } catch (error) {
    console.error("  Error querying metrics from Supabase:", error);
    setTumorData([]);
    setIsLoading(false);
    return;
  }

  // Step 4: Fetch missing data from API and upsert all normalization methods
  console.log(
    `🔄 Missing or incomplete data for metrics:`,
    missingDataMetrics
  );
  try {
    const supabaseUpsertData: {
      [metric: string]: {
        sample_id: string;
        tpm: number | null;
        fpkm: number | null;
        fpkm_uq: number | null;
      }[];
    } = { DEPTH2: [], tITH: [] };

    // Fetch data for all normalization methods
    const normalizationMethods = ["tpm", "fpkm", "fpkm_uq"];
    const promises: Promise<{ metric: string; normMethod: string; data: any }>[] = [];
    for (const { metric, sampleIds } of missingDataMetrics) {
      for (const normMethod of normalizationMethods) {
        promises.push(
          fetch(
            `http://localhost:5001/api/TH-metrics?cancer=${cancerSite}&method=${normMethod}&metric=${metric}&sample_ids=${sampleIds.join(",")}`
          )
            .then((response) => {
              console.log(`API response for ${metric} (${normMethod}):`, {
                status: response.status,
                statusText: response.statusText,
                headers: Object.fromEntries(response.headers.entries()),
              });
              if (!response.ok) {
                console.error(
                  `HTTP error! Status: ${response.status}, Message: ${response.statusText}`
                );
                return response
                  .json()
                  .then((errorData) => Promise.reject(errorData));
              }
              return response.json();
            })
            .then((data) => {
              console.log(`Parsed data for ${metric} (${normMethod}):`, data);
              return { metric, normMethod, data };
            })
            .catch((error) => {
              console.error(
                `Error fetching ${metric} (${normMethod}) from API:`,
                error
              );
              return { metric, normMethod, data: [] };
            })
        );
      }
    }

    const metricResults = await Promise.all(promises);
    console.log("API metric results:", metricResults);

    // Process API data for upsert
    const sampleExpressionMapAfterApi: { [sampleId: string]: TumorData } = { ...sampleExpressionMap };

    metricResults.forEach(({ metric, normMethod, data }) => {
      if (data && data.length > 0) {
        data.forEach((item: any) => {
          const sampleId = item.sample_id || item.sample_barcode;
          if (!sampleId) {
            console.warn(`  No sample_id or sample_barcode in API data:`, item);
            return;
          }

          const supabaseSampleId = Object.keys(sampleToCancerTypeMap).find(
            (key) =>
              sampleToCancerTypeMap[key].barcode === sampleId ||
              key === sampleId
          );

          if (!supabaseSampleId) {
            console.warn(
              `  No matching Supabase sample_id for API sample_id ${sampleId}`
            );
            return;
          }

          const sampleInfo = sampleToCancerTypeMap[supabaseSampleId];
          if (!sampleInfo) {
            console.warn(
              `  No sample info for Supabase sample_id ${supabaseSampleId}`
            );
            return;
          }

          const matches =
            cancerTypes.length === 0 ||
            cancerTypes.includes(sampleInfo.cancerType);
          if (!matches) {
            console.log(
              `Skipping sample ${sampleId} (cancerType: ${sampleInfo.cancerType}) as it doesn't match cancerTypes: ${cancerTypes.join(", ")}`
            );
            return;
          }

          // Add to sampleExpressionMap for UI (only for selected normalization method)
          const mapKey = supabaseSampleId;
          if (!sampleExpressionMapAfterApi[mapKey]) {
            sampleExpressionMapAfterApi[mapKey] = {
              sample: sampleInfo.barcode,
              cancer_type: sampleInfo.cancerType || "Unknown",
            };
          }
          if (normMethod === normalizationMethod) {
            const fieldName =
              noiseMetrics[metric as keyof typeof noiseMetrics] ||
              metric.toLowerCase();
            const value = item[normMethod] != null ? item[normMethod] : 0;
            // console.log(`Setting ${fieldName} for sample ${mapKey} to ${value} (${normMethod}) from API`);
            sampleExpressionMapAfterApi[mapKey][fieldName] = value;
          }

          // Prepare data for Supabase upsert
          let existingEntry = supabaseUpsertData[metric].find(
            (entry) => entry.sample_id === supabaseSampleId
          );
          if (!existingEntry) {
            existingEntry = {
              sample_id: supabaseSampleId,
              tpm: null,
              fpkm: null,
              fpkm_uq: null,
            };
            supabaseUpsertData[metric].push(existingEntry);
          }
          existingEntry[normMethod] = item[normMethod] != null ? item[normMethod] : null;
        });
      } else {
        console.warn(`No data returned for ${metric} (${normMethod}) from API`);
      }
    });

    console.log("🛠️ supabaseUpsertData before upsert:", supabaseUpsertData);
    for (const metric of metrics) {
      const tableName = metric === "DEPTH2" ? "depth2" : "tith";
      const dataToUpsert = supabaseUpsertData[metric];

      console.log(
        `🛠️ dataToUpsert for ${metric} (${dataToUpsert.length} records):`,
        dataToUpsert.slice(0, 2)
      );

      if (dataToUpsert.length > 0) {
        console.log(
          `📤 Upserting ${dataToUpsert.length} records for ${metric} with all normalization methods to Supabase table ${tableName}`
        );
        // Validate data before upsert
        const invalidEntries = dataToUpsert.filter(
          (entry) =>
            !entry.sample_id ||
            (entry.tpm === undefined && entry.fpkm === undefined && entry.fpkm_uq === undefined)
        );
        if (invalidEntries.length > 0) {
          console.error("  Invalid upsert data detected:", invalidEntries);
          continue;
        }

        // Fetch existing rows to determine insert vs update
        const { data: existingRows, error: fetchError } = await supabase
          .from(tableName)
          .select("id, sample_id")
          .in("sample_id", dataToUpsert.map((entry) => entry.sample_id));

        if (fetchError) {
          console.error(`  Failed to fetch existing rows from ${tableName}:`, fetchError);
          console.error("Upsert data sample:", dataToUpsert.slice(0, 2));
          continue;
        }

        const existingSampleIds = new Map(
          existingRows?.map((row) => [row.sample_id, row.id]) || []
        );

        // Split data into insert and update
        const toInsert = dataToUpsert.filter(
          (entry) => !existingSampleIds.has(entry.sample_id)
        );
        const toUpdate = dataToUpsert.filter((entry) =>
          existingSampleIds.has(entry.sample_id)
        );

        // Insert new rows
        if (toInsert.length > 0) {
          const { error: insertError } = await supabase
            .from(tableName)
            .upsert(toInsert, {onConflict: 'sample_id' });
          if (insertError) {
            console.error(`  Failed to insert ${metric} data:`, insertError);
            console.error("Insert data sample:", toInsert.slice(0, 2));
          } else {
            console.log(`  Inserted ${toInsert.length} records for ${metric}`);
          }
        }

        // Update existing rows
        if (toUpdate.length > 0) {
          for (const entry of toUpdate) {
            const rowId = existingSampleIds.get(entry.sample_id);
            const { error: updateError } = await supabase
              .from(tableName)
              .update({
                tpm: entry.tpm,
                fpkm: entry.fpkm,
                fpkm_uq: entry.fpkm_uq,
              })
              .eq("id", rowId);
            if (updateError) {
              console.error(
                `  Failed to update ${metric} data for sample_id ${entry.sample_id}:`,
                updateError
              );
            } else {
              console.log(
                `  Updated record for ${metric} (sample_id: ${entry.sample_id})`
              );
            }
          }
        }
      } else {
        console.warn(
          `No data to upsert for ${metric} with any normalization method`
        );
      }
    }

    // Step 5: Fetch updated data from Supabase for the selected normalization method
    processedData = [];
    const sampleExpressionMapAfterUpsert: { [sampleId: string]: TumorData } = {};

    for (const metric of metrics) {
      const tableName = metric === "DEPTH2" ? "depth2" : "tith";
      console.log(`Fetching updated data for ${metric} (${normalizationMethod}) from Supabase table: ${tableName}`);
      const { data: metricData, error: metricError } = await supabase
        .from(tableName)
        .select(`sample_id, ${normalizationMethod.toLowerCase()}`)
        .in("sample_id", Object.keys(sampleToCancerTypeMap)) as { data: { sample_id: number; [key: string]: number | null }[] | null; error: any };

      if (metricError) {
        console.error(`Failed to fetch updated ${metric} from Supabase table ${tableName}:`, metricError);
        continue;
      }

      if (!metricData) {
        console.warn(`No updated data returned for ${metric} from Supabase table ${tableName}`);
        continue;
      }

      console.log(`Fetched ${metric} data for ${normalizationMethod}:`, metricData.slice(0, 2));

      metricData.forEach((item) => {
        const sampleId = item.sample_id;
        const sampleInfo = sampleToCancerTypeMap[sampleId];

        if (!sampleInfo) {
          console.warn(`  No matching sample info for sample_id ${sampleId}`);
          return;
        }

        if (!sampleExpressionMapAfterUpsert[sampleId]) {
          sampleExpressionMapAfterUpsert[sampleId] = {
            sample: sampleInfo.barcode,
            cancer_type: sampleInfo.cancerType || "Unknown",
          };
        }

        const fieldName =
          noiseMetrics[metric as keyof typeof noiseMetrics] || metric.toLowerCase();
        const value = item[normalizationMethod.toLowerCase()] || 0;
        // console.log(`Setting ${fieldName} for sample ${sampleId} to ${value} (${normalizationMethod})`);
        sampleExpressionMapAfterUpsert[sampleId][fieldName] = value;
      });
    }

    processedData = Object.values(sampleExpressionMapAfterUpsert).filter(
      (sampleData) => {
        const hasValidMetric = metrics.some((metric) => {
          const fieldName =
            noiseMetrics[metric as keyof typeof noiseMetrics] ||
            metric.toLowerCase();
          const value = sampleData[fieldName];
          return value !== null && !isNaN(value);
        });
        if (!hasValidMetric) {
          console.warn(
            `  No valid metric values for sample ${sampleData.sample}`
          );
          return false;
        }
        return true;
      }
    );

    console.log(
      ` Processed ${processedData.length} samples from Supabase after upsert`,
      processedData.slice(0, 2)
    );
  } catch (error) {
    console.error("  Error during API fetch or Supabase upsert:", error);
    setTumorData([]);
    setIsLoading(false);
    return;
  }

  // Cache and set the processed data
  if (isMounted) {
    if (processedData.length > 0) {
      const now = Date.now();

      // Cache for cancerSite
      localStorage.setItem(
        cacheKeySite,
        JSON.stringify({
          timestamp: now,
          data: processedData,
        })
      );

      // Cache individually for each cancerType
      cancerTypes.forEach((ct, index) => {
        const ctData = processedData.filter(
          (sample) => sample.cancer_type === ct
        );
        if (ctData.length > 0) {
          localStorage.setItem(
            cacheKeysByType[index],
            JSON.stringify({
              timestamp: now,
              data: ctData,
            })
          );
        }
      });

      console.log(`  Final tumor data:`, processedData);
      setTumorData((prev) => {
        console.log("🛠️ Setting tumorData:", processedData);
        return processedData;
      });
      setTotalTumorSamples(processedData.length);
    } else {
      console.warn("  No valid data to set");
      setTumorData([]);
    }
  } else {
    console.warn("  Component unmounted before setting data");
  }

  setIsLoading(false);
};

// Define debouncedFetch to accept parameters
const debouncedFetch = debounce(
  async (params: {
    cancerSite: string;
    cancerTypes: string[];
    normalizationMethod: string;
    selectedNoiseMetrics: string[];
  }) => {
    await fetchTumorExpressionData(params);
  },
  500
);

  useEffect(() => {
  let isMounted = true;

  console.log("useEffect triggered with normalizationMethod:", normalizationMethod);
  debouncedFetch({
    cancerSite,
    cancerTypes,
    normalizationMethod,
    selectedNoiseMetrics,
  });

  return () => {
    isMounted = false;
    debouncedFetch.cancel();
  };
}, [cancerSite, cancerTypes, normalizationMethod, selectedNoiseMetrics]);

  const downloadChart = (chartKey: string, chartName: string) => {
    const chartElement = chartRefs.current[chartKey];
    if (chartElement) {
      const svg = chartElement.querySelector("svg");
      if (svg) {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        const img = new Image();

        const svgData = new XMLSerializer().serializeToString(svg);
        const svgBlob = new Blob([svgData], {
          type: "image/svg+xml;charset=utf-8",
        });
        const url = URL.createObjectURL(svgBlob);

        img.onload = function () {
          canvas.width = img.width || 800;
          canvas.height = img.height || 400;
          ctx?.drawImage(img, 0, 0);

          canvas.toBlob((blob) => {
            if (blob) {
              const link = document.createElement("a");
              link.download = `${chartName
                .replace(/\s+/g, "_")
                .toLowerCase()}_${Date.now()}.png`;
              link.href = URL.createObjectURL(blob);
              link.click();
              URL.revokeObjectURL(link.href);
            }
          });
          URL.revokeObjectURL(url);
        };
        img.src = url;
      }
    }
  };

  const downloadData = (format: string) => {
    const data = tumorData;
    let content = "";
    let filename = `tumor_analysis_${cancerSite}_${normalizationMethod}_${Date.now()}`;

    if (format === "csv") {
      const excludedKeys = ["tumorValues", "normalValues", "combinedValues"];
      const keys = [
        "sample",
        "cancer_type",
        ...Object.keys(data[0] || {}).filter(
          (k) =>
            !excludedKeys.includes(k) && k !== "sample" && k !== "cancer_type"
        ),
      ];

      const headers = keys.join(",");
      const rows = data.map((row) =>
        keys
          .map((key) => {
            const value = row[key];
            return typeof value === "number" ? value.toFixed(6) : value || "";
          })
          .join(",")
      );

      content = [headers, ...rows].join("\n");
      filename += ".csv";
    }

    const blob = new Blob([content], {
      type: format === "csv" ? "text/csv" : "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const colors = ["#2563eb", "#059669", "#dc2626", "#7c3aed", "#ea580c"];

  // Custom bar chart component for DEPTH2
  const BarChart = ({ data, dataKey, color, title }: any) => {
    console.log("🛠️ BarChart props:", { data, dataKey, title });
    return (
      <Card className="border-0 shadow-lg">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center justify-between text-sm">
            <div className="flex items-center space-x-2">
              <Box className="h-4 w-4" style={{ color }} />
              <span>{title}</span>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => downloadChart(`bar-${dataKey}`, title)}
              className="h-6 px-2 text-xs"
            >
              <Download className="h-3 w-3" />
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div ref={(el) => (chartRefs.current[`bar-${dataKey}`] = el)}>
            <ResponsiveContainer width="100%" height={200}>
              <ComposedChart
                data={data}
                margin={{ top: 5, right: 5, left: 5, bottom: 25 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="sample"
                  tick={{ fontSize: 10 }}
                  label={{
                    value: "Samples",
                    position: "insideBottom",
                    offset: -10,
                    style: { fontSize: "10px" },
                  }}
                />
                <YAxis
                  tick={{ fontSize: 10 }}
                  label={{
                    value: title,
                    angle: -90,
                    position: "insideLeft",
                    dy: 55,
                    style: { fontSize: "10px" },
                  }}
                />
                <Tooltip
                  formatter={(value: any) => [
                    typeof value === "number" ? value.toFixed(2) : value,
                    title,
                  ]}
                />
                <Bar dataKey={dataKey} fill={color} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    );
  };

  // Custom scatter plot component for tITH
  const ScatterPlot = ({ data, dataKey, color, title }: any) => {
    console.log("🛠️ ScatterPlot props:", { data, dataKey, title });
    return (
      <Card className="border-0 shadow-lg">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center justify-between text-sm">
            <div className="flex items-center space-x-2">
              <Box className="h-4 w-4" style={{ color }} />
              <span>{title}</span>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => downloadChart(`scatter-${dataKey}`, title)}
              className="h-6 px-2 text-xs"
            >
              <Download className="h-3 w-3" />
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div ref={(el) => (chartRefs.current[`scatter-${dataKey}`] = el)}>
            <ResponsiveContainer width="100%" height={200}>
              <ComposedChart
                data={data}
                margin={{ top: 5, right: 5, left: 5, bottom: 25 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="sample"
                  tick={{ fontSize: 10 }}
                  label={{
                    value: "Samples",
                    position: "insideBottom",
                    offset: -10,
                    style: { fontSize: "10px" },
                  }}
                />
                <YAxis
                  tick={{ fontSize: 10 }}
                  label={{
                    value: title,
                    angle: -90,
                    position: "insideLeft",
                    dy: 55,
                    style: { fontSize: "10px" },
                  }}
                />
                <Tooltip
                  formatter={(value: any) => [
                    typeof value === "number" ? value.toFixed(2) : value,
                    title,
                  ]}
                />
                <Scatter dataKey={dataKey} fill={color} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-yellow-50 flex flex-col">
    < Header/>
      <main className="flex-grow">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-6">
          {/* Left Sidebar - Filters */}
          <div className="w-80 flex-shrink-0">
            <Card className="border-0 shadow-lg bg-blue-100">
              <CardHeader className="pb-4">
                <CardTitle className="text-blue-900">Filters</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Expression Normalization Method */}
                <div>
                  <h3 className="font-semibold text-blue-900 mb-3">
                    Expression Normalization Method
                  </h3>
                  <RadioGroup
                    value={normalizationMethod}
                    onValueChange={(value) => {
                      console.log("Normalization method changed to:", value);
                      // Clear cache
                      const cacheKeySite = `tumorData_site_${cancerSite}_${value}_${selectedNoiseMetrics.sort().join(",")}`;
                      localStorage.removeItem(cacheKeySite);
                      cancerTypes.forEach((ct) => {
                        const cacheKeyType = `tumorData_type_${ct}_${value}_${selectedNoiseMetrics.sort().join(",")}`;
                        localStorage.removeItem(cacheKeyType);
                      });
                      setNormalizationMethod(value); // Trigger useEffect
                    }}
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="tpm" id="tpm" />
                      <Label htmlFor="tpm">TPM</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="fpkm" id="fpkm" />
                      <Label htmlFor="fpkm">FPKM</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="fpkm_uq" id="fpkm_uq" />
                      <Label htmlFor="fpkm_uq">FPKM_UQ</Label>
                    </div>
                  </RadioGroup>
                </div>

                {/* Noise Metrics */}
                <div className="border rounded-md bg-white">
                  <div className="flex justify-between items-center px-4 py-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="noise-metrics-master"
                        checked={areAllNoiseSelected}
                        onCheckedChange={toggleAllNoiseMetrics}
                      />
                      <Label
                        htmlFor="noise-metrics-master"
                        className="font-bold text-blue-900 -ml-5"
                      >
                        Noise Metrics
                      </Label>
                    </div>
                    <button
                      onClick={() => setIsNoiseMetricsOpen((prev) => !prev)}
                      className="text-blue-900"
                    >
                      {isNoiseMetricsOpen ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                  {isNoiseMetricsOpen && (
                    <div className="px-4 py-2 space-y-2">
                      {allNoiseMetrics.map((metric) => (
                        <div key={metric} className="flex items-center space-x-2">
                          <Checkbox
                            id={`noise-${metric}`}
                            checked={selectedNoiseMetrics.includes(metric)}
                            onCheckedChange={() => handleNoiseMetricToggle(metric)}
                          />
                          <Label htmlFor={`noise-${metric}`} className="text-sm">
                            {metric}
                          </Label>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Analysis Plots */}
                <div className="border rounded-md bg-white">
                  <div className="flex justify-between items-center px-4 py-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="analysis-plots-master"
                        checked={areAllPlotsSelected}
                        onCheckedChange={toggleAllPlots}
                      />
                      <Label
                        htmlFor="analysis-plots-master"
                        className="font-bold text-blue-900 -ml-5"
                      >
                        Analysis Plots
                      </Label>
                    </div>
                    <button
                      onClick={() => setIsAnalysisPlotsOpen((prev) => !prev)}
                      className="text-blue-900"
                    >
                      {isAnalysisPlotsOpen ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                  {isAnalysisPlotsOpen && (
                    <div className="px-4 py-2 space-y-2">
                      {allPlotKeys.map((plotKey) => (
                        <div
                          key={plotKey}
                          className="flex items-center space-x-2"
                        >
                          <Checkbox
                            id={`plot-${plotKey}`}
                            checked={
                              visiblePlots[plotKey as keyof typeof visiblePlots]
                            }
                            onCheckedChange={() => handlePlotToggle(plotKey)}
                          />
                          <Label
                            htmlFor={`plot-${plotKey}`}
                            className="text-sm"
                          >
                            {{
                              depth2: "DEPTH2 Bar Chart",
                              tith: "tITH Scatter Plot",
                            }[plotKey]}
                          </Label>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <Button
                  onClick={applyFilters}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                >
                  Apply
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="flex-1">
              {isLoading ? (
              <LoadingSpinner message="Loading results..." />
            ) : tumorData.length === 0 ? (
              <div className="text-center text-blue-900">
                {/* No data available for the selected parameters. */}
              </div>
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
                  <h2 className="text-4xl font-bold text-blue-900 mb-2">
                    Results for {cancerSite}{" Cancer "}
                    {cancerTypes.length > 0 && `(${cancerTypes.join(", ")})`}
                  </h2>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex flex-wrap gap-2"></div>
                    <div className="flex space-x-4">
                      <Button
                        onClick={() => downloadData("csv")}
                        variant="outline"
                        size="sm"
                      >
                        <Download className="h-4 w-4 mr-2" /> Download CSV
                      </Button>
                    </div>
                  </div>
                </div>

                {/* DEPTH2 and tITH Plots */}
                {(visiblePlots.depth2 || visiblePlots.tith) && (
                  <div className="mb-8">
                    <h3 className="text-2xl font-bold text-blue-900 mb-4">
                      Tumor Heterogeneity Metrics
                    </h3>
                    <div className="grid lg:grid-cols-2 md:grid-cols-1 gap-4">
                      {visiblePlots.depth2 && (
                        <BarChart
                          data={tumorData}
                          dataKey="depth2"
                          color="#ea580c"
                          title="DEPTH2 Scores"
                        />
                      )}
                      {visiblePlots.tith && (
                        <ScatterPlot
                          data={tumorData}
                          dataKey="tith"
                          color="#2563eb"
                          title="Transcriptome-based Intra-Tumor Heterogeneity (tITH)"
                        />
                      )}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
      </main>
     < Footer/>
    </div>
  );
};

export default TumourResults;
