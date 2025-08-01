import React, { useMemo, useCallback, useState, useEffect, useRef } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import supabase from "@/supabase-client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Download, Box, ChevronRight, ChevronDown, Users } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { LoadingSpinner } from "@/components/ui/loadingSpinner";
import { PlotlyHeatmap, PlotlyBarChart } from "@/components/charts";
import { PlotlyBoxChart } from "@/components/charts/PlotlyBoxChart";
import Header from "@/components/header";
import Footer from "@/components/footer";
import { useCache } from "@/hooks/use-cache";
import { GeneStats, ResultsData } from "@/components/types/genes";

const metricFormulas = {
  CV: "CV = (σ / µ)",
  "S.D": "μ + σ",
  MAD: "MAD = Median Absolute Deviation",
  "CV²": "CV² = (σ / µ)²",
  logFC: "log2 Fold Change = log2(Tumor Mean / Normal Mean)",
};

const GeneResults = () => {
  const renderCount = useRef(0);
  useEffect(() => {
    console.log(`GeneResults rendered ${++renderCount.current} times`);
  });

  const [searchParams] = useSearchParams();
  const params = useMemo(
    () => ({
      cancerSite: searchParams.get("site") || "",
      cancerTypes: searchParams.get("cancerTypes")?.split(",").filter(Boolean) || [],
      genes: searchParams.get("genes")?.split(",").filter(Boolean) || [],
    }),
    [searchParams]
  );

  const [selectedGroups, setSelectedGroups] = useState(["normal", "tumor"]);
  const [selectedGenes, setSelectedGenes] = useState(params.genes);
  const [isNoiseMetricsOpen, setIsNoiseMetricsOpen] = useState(false);
  const [isNormalizationOpen, setIsNormalizationOpen] = useState(false);
  const [isAnalysisPlotsOpen, setIsAnalysisPlotsOpen] = useState(false);
  const [isStatisticalMetricsOpen, setIsStatisticalMetricsOpen] = useState(false);
  const [isGenesOpen, setIsGenesOpen] = useState(false);
  const [metricOpenState, setMetricOpenState] = useState({
    cv: true,
    mean: true,
    std: true,
    mad: true,
    cv_squared: true,
    logFC: true,
  });
  const [normalizationMethod, setNormalizationMethod] = useState("tpm");
  const [selectedNoiseMetrics, setSelectedNoiseMetrics] = useState(["CV", "Mean", "S.D", "MAD", "CV²", "logFC"]);
  const [resultsData, setResultsData] = useState<GeneStats[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isHeatmapLoading, setIsHeatmapLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalTumorSamples, setTotalTumorSamples] = useState(0);
  const [totalNormalSamples, setTotalNormalSamples] = useState(0);
  const filterTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { getCachedData, setCachedData, generateCacheKey } = useCache<ResultsData>();

  const cleanedGeneSymbols = useMemo(
    () => params.genes.map((g) => g.trim().toUpperCase()).filter(Boolean),
    [params.genes]
  );

  useEffect(() => {
    if (!["tpm", "fpkm", "fpkm_uq"].includes(normalizationMethod)) {
      setNormalizationMethod("tpm");
    }
  }, [normalizationMethod]);

  const noiseMetrics = {
    CV: "cv",
    Mean: "mean",
    "S.D": "std",
    MAD: "mad",
    "CV²": "cv_squared",
    logFC: "logFC",
  };

  const updateFilters = useCallback(
    (newFilters: {
      normalizationMethod?: string;
      selectedNoiseMetrics?: string[];
      selectedGenes?: string[];
      selectedGroups?: string[];
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
        if (newFilters.selectedGenes) {
          setSelectedGenes(newFilters.selectedGenes);
        }
        if (newFilters.selectedGroups) {
          setSelectedGroups(newFilters.selectedGroups);
        }
      }, 300);
    },
    []
  );

  useEffect(() => {
    let isMounted = true;

    const fetchData = async () => {
      const cacheKey = generateCacheKey({
        cleanedGeneSymbols,
        cancerSite: params.cancerSite,
        cancerTypes: params.cancerTypes,
        normalizationMethod,
        selectedNoiseMetrics,
      });

      const cachedData = getCachedData(cacheKey);
      if (cachedData) {
        console.log("Cache hit for key:", cacheKey);
        if (isMounted) {
          setResultsData(cachedData.resultsData);
          setTotalTumorSamples(cachedData.totalTumorSamples);
          setTotalNormalSamples(cachedData.totalNormalSamples);
          setError(null);
          setIsLoading(false);
        }
        return;
      }

      console.log("Cache miss, fetching data for:", {
        cleanedGeneSymbols,
        cancerSite: params.cancerSite,
        cancerTypes: params.cancerTypes,
        normalizationMethod,
        selectedNoiseMetrics,
      });

      if (!cleanedGeneSymbols.length || !params.cancerSite) {
        console.log("Early return: Missing genes or cancerSite");
        if (isMounted) {
          setError("Please select a cancer site and at least one gene.");
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
          .eq("name", params.cancerSite);

        if (siteRowsErr) {
          console.error("Failed to fetch cancer site:", siteRowsErr);
          throw new Error(`Failed to fetch cancer site: ${siteRowsErr.message}`);
        }

        if (!siteRows?.length) {
          console.error("No site found for:", params.cancerSite);
          throw new Error(`Cancer site not found: ${params.cancerSite}`);
        }

        const cancerSiteId = siteRows[0].id;

        const { data: cancerTypeRows, error: cancerTypeErr } =
          params.cancerTypes.length > 0
            ? await supabase
                .from("cancer_types")
                .select("id, tcga_code")
                .in("tcga_code", params.cancerTypes)
            : await supabase
                .from("cancer_types")
                .select("id, tcga_code, site_id")
                .eq("site_id", cancerSiteId);

        if (cancerTypeErr) {
          console.error("Failed to fetch cancer types:", cancerTypeErr);
          throw new Error(`Failed to fetch cancer types: ${cancerTypeErr.message}`);
        }

        const cancerTypeIds = cancerTypeRows.map((row) => row.id);

        const { data: geneData, error: geneError } = await supabase
          .from("genes")
          .select("id, ensembl_id, gene_symbol")
          .in("gene_symbol", cleanedGeneSymbols);

        if (geneError) {
          console.error("Gene error:", geneError);
          throw new Error(`Failed to fetch genes: ${geneError.message}`);
        }

        if (!geneData?.length) {
          console.error("No genes found for:", cleanedGeneSymbols);
          throw new Error(`No genes found for: ${cleanedGeneSymbols.join(", ")}`);
        }

        const geneMap = Object.fromEntries(geneData.map((g) => [g.ensembl_id, g.gene_symbol]));
        const geneIds = geneData.map((g) => g.id);
        const gene_ensembl_ids = geneData.map((g) => g.ensembl_id);

        const { data: samplesData, error: samplesError } = await supabase
          .from("samples")
          .select("id, sample_barcode, sample_type, cancer_type_id")
          .in("cancer_type_id", cancerTypeIds);

        if (samplesError) {
          console.error("Samples error:", samplesError);
          throw new Error(`Failed to fetch samples: ${samplesError.message}`);
        }

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

        const hasAllParams = params.cancerSite && selectedNoiseMetrics?.length > 0;

        if (!hasAllParams) {
          console.warn("Missing one or more required parameters — API not called.");
          return;
        }

        const metricTables = {
          cv: ["cv_normal", "cv_tumor"],
          mean: ["mean_normal", "mean_tumor"],
          std: ["std_normal", "std_tumor"],
          mad: ["mad_normal", "mad_tumor"],
          cv_squared: ["cv_squared_normal", "cv_squared_tumor"],
          logFC: ["logfc"],
        };

        let processedData: GeneStats[] = [];
        let allDataExists = true;
        const supabaseData: { [key: string]: { [table: string]: any } } = {};

        for (const metricKey of Object.values(noiseMetrics)) {
          const tables = metricTables[metricKey] || [];
          supabaseData[metricKey] = {};

          for (const table of tables) {
            const { data: tableData, error: tableError } = await supabase
              .from(table)
              .select("gene_id, cancer_type_id, tpm, fpkm, fpkm_uq")
              .in("gene_id", geneIds)
              .in("cancer_type_id", cancerTypeIds);

            if (tableError) {
              console.error(`Error fetching from ${table}:`, tableError);
              throw new Error(`Failed to fetch from ${table}: ${tableError.message}`);
            }

            if (!tableData || tableData.length === 0) {
              console.log(`No data found in ${table} for selected parameters`);
              allDataExists = false;
              break;
            }

            supabaseData[metricKey][table] = tableData.reduce((acc: any, row: any) => {
              const key = `${row.gene_id}_${row.cancer_type_id}`;
              acc[key] = row;
              return acc;
            }, {});
          }

          if (!allDataExists) break;
        }

        if (allDataExists) {
          console.log("Using Supabase data");
          processedData = gene_ensembl_ids.map((ensembl_id: string) => {
            const gene_symbol = geneMap[ensembl_id] || ensembl_id;
            const gene_id = geneData.find((g) => g.ensembl_id === ensembl_id)?.id;

            const data: any = {};
            Object.keys(noiseMetrics).forEach((metric) => {
              const metricKey = noiseMetrics[metric];
              if (metricKey === "logFC" && (!selectedGroups.includes("tumor") || !selectedGroups.includes("normal"))) {
                return;
              }
              cancerTypeIds.forEach((cancer_type_id: number) => {
                const normalKey = `${gene_id}_${cancer_type_id}`;
                const tumorKey = `${gene_id}_${cancer_type_id}`;
                const normalTable = metricTables[metricKey]?.[0];
                const tumorTable = metricTables[metricKey]?.[1];

                if (metric !== "logFC") {
                  ["tpm", "fpkm", "fpkm_uq"].forEach((norm) => {
                    if (supabaseData[metricKey]?.[normalTable]?.[normalKey]) {
                      data[`${metricKey}_normal_${norm}`] = supabaseData[metricKey][normalTable][normalKey][norm] || 0;
                    }
                    if (supabaseData[metricKey]?.[tumorTable]?.[tumorKey]) {
                      data[`${metricKey}_tumor_${norm}`] = supabaseData[metricKey][tumorTable][tumorKey][norm] || 0;
                    }
                  });
                }
              });
            });

            let logFC = 0;
            if (selectedNoiseMetrics.includes("logFC") && selectedGroups.includes("tumor") && selectedGroups.includes("normal")) {
              const normalMean = data[`mean_normal_${normalizationMethod}`] || 0;
              const tumorMean = data[`mean_tumor_${normalizationMethod}`] || 0;
              logFC = tumorMean && normalMean ? tumorMean - normalMean : 0;
            }

            return {
              gene: `${gene_symbol} (${ensembl_id})`,
              ensembl_id,
              gene_symbol,
              tumorValues: data[`cv_tumor_${normalizationMethod}`] ? [data[`cv_tumor_${normalizationMethod}`]] : [],
              normalValues: data[`cv_normal_${normalizationMethod}`] ? [data[`cv_normal_${normalizationMethod}`]] : [],
              cv_tumor: data[`cv_tumor_${normalizationMethod}`] || 0,
              mean_tumor: data[`mean_tumor_${normalizationMethod}`] || 0,
              std_tumor: data[`std_tumor_${normalizationMethod}`] || 0,
              mad_tumor: data[`mad_tumor_${normalizationMethod}`] || 0,
              cv_squared_tumor: data[`cv_squared_tumor_${normalizationMethod}`] || 0,
              cv_normal: data[`cv_normal_${normalizationMethod}`] || 0,
              mean_normal: data[`mean_normal_${normalizationMethod}`] || 0,
              std_normal: data[`std_normal_${normalizationMethod}`] || 0,
              mad_normal: data[`mad_normal_${normalizationMethod}`] || 0,
              cv_squared_normal: data[`cv_squared_normal_${normalizationMethod}`] || 0,
              tumorSamples: tumorSamples.length,
              normalSamples: normalSamples.length,
              logFC,
            };
          });
        } else {
          console.log("Fetching from API");
          const queryParams = new URLSearchParams({
            cancer: params.cancerSite,
            metric: selectedNoiseMetrics
              .filter((m) => m !== "logFC")
              .map((m) => noiseMetrics[m])
              .join(","),
            gene_ensembl_id: gene_ensembl_ids.join(","),
            tumor_samples: tumorSamples.join(",") || "sample1",
            normal_samples: normalSamples.join(",") || "sample2",
          });

          console.log("API request URL:", `http://localhost:5001/api/gene_noise?${queryParams}`);

          // const response = await fetch(`http://localhost:5001/api/gene_noise?${queryParams}`, {
          const response = await fetch(`/api/gene_noise?${queryParams}`, {
            method: "GET",
            headers: { "Content-Type": "application/json" },
          });

          if (!response.ok) {
            const errorText = await response.text();
            console.error("API fetch failed:", response.status, errorText);
            throw new Error(`Failed to fetch gene noise data: ${errorText}`);
          }

          const apiData = await response.json();
          console.log("API response data:", apiData);

          processedData = gene_ensembl_ids.map((ensembl_id: string) => {
            const gene_symbol = geneMap[ensembl_id] || ensembl_id;
            const data: any = {};
            ["tpm", "fpkm", "fpkm_uq"].forEach((norm) => {
              const geneData = apiData[norm]?.[ensembl_id] || {};
              Object.keys(noiseMetrics).forEach((metric) => {
                const metricKey = noiseMetrics[metric];
                if (metric !== "logFC") {
                  data[`${metricKey}_tumor_${norm}`] = geneData[`${metricKey}_tumor`] || 0;
                  data[`${metricKey}_normal_${norm}`] = geneData[`${metricKey}_normal`] || 0;
                }
              });
            });

            const tumorMean = data[`mean_tumor_${normalizationMethod}`] || 0;
            const normalMean = data[`mean_normal_${normalizationMethod}`] || 0;
            const logFC = tumorMean && normalMean && selectedNoiseMetrics.includes("logFC") ? tumorMean - normalMean : 0;

            return {
              gene: `${gene_symbol} (${ensembl_id})`,
              ensembl_id,
              gene_symbol,
              tumorValues: data[`cv_tumor_${normalizationMethod}`] ? [data[`cv_tumor_${normalizationMethod}`]] : [],
              normalValues: data[`cv_normal_${normalizationMethod}`] ? [data[`cv_normal_${normalizationMethod}`]] : [],
              cv_tumor: data[`cv_tumor_${normalizationMethod}`] || 0,
              mean_tumor: data[`mean_tumor_${normalizationMethod}`] || 0,
              std_tumor: data[`std_tumor_${normalizationMethod}`] || 0,
              mad_tumor: data[`mad_tumor_${normalizationMethod}`] || 0,
              cv_squared_tumor: data[`cv_squared_tumor_${normalizationMethod}`] || 0,
              cv_normal: data[`cv_normal_${normalizationMethod}`] || 0,
              mean_normal: data[`mean_normal_${normalizationMethod}`] || 0,
              std_normal: data[`std_normal_${normalizationMethod}`] || 0,
              mad_normal: data[`mad_normal_${normalizationMethod}`] || 0,
              cv_squared_normal: data[`cv_squared_normal_${normalizationMethod}`] || 0,
              tumorSamples: tumorSamples.length,
              normalSamples: normalSamples.length,
              logFC,
            };
          });

          const insertPromises = [];
          for (const gene of processedData) {
            const gene_id = geneData.find((g) => g.ensembl_id === gene.ensembl_id)?.id;
            if (!gene_id) {
              console.warn(`Skipping upsert for gene ${gene.ensembl_id}: missing gene_id`);
              continue;
            }

            cancerTypeIds.forEach((cancer_type_id: number) => {
              if (!cancer_type_id) {
                console.warn(`Skipping upsert for cancer_type_id ${cancer_type_id}: invalid`);
                return;
              }

              Object.keys(noiseMetrics).forEach((metric) => {
                const metricKey = noiseMetrics[metric];
                if (metric === "logFC" && (!selectedGroups.includes("tumor") || !selectedGroups.includes("normal"))) {
                  return;
                }

                const normalTable = metricTables[metricKey]?.[0];
                const tumorTable = metricTables[metricKey]?.[1];

                if (normalTable) {
                  const normalData = {
                    gene_id,
                    cancer_type_id,
                    tpm: gene[`${metricKey}_normal_tpm`] ?? null,
                    fpkm: gene[`${metricKey}_normal_fpkm`] ?? null,
                    fpkm_uq: gene[`${metricKey}_normal_fpkm_uq`] ?? null,
                  };
                  if (normalData.tpm || normalData.fpkm || normalData.fpkm_uq) {
                    console.log(`Upserting into ${normalTable}:`, normalData);
                    insertPromises.push(
                      supabase.from(normalTable).upsert([normalData], { onConflict: "gene_id, cancer_type_id" }).select()
                    );
                  }
                }

                if (tumorTable && metric !== "logFC") {
                  const tumorData = {
                    gene_id,
                    cancer_type_id,
                    tpm: gene[`${metricKey}_tumor_tpm`] ?? null,
                    fpkm: gene[`${metricKey}_tumor_fpkm`] ?? null,
                    fpkm_uq: gene[`${metricKey}_tumor_fpkm_uq`] ?? null,
                  };
                  if (tumorData.tpm || tumorData.fpkm || tumorData.fpkm_uq) {
                    console.log(`Upserting into ${tumorTable}:`, tumorData);
                    insertPromises.push(
                      supabase.from(tumorTable).upsert([tumorData], { onConflict: "gene_id, cancer_type_id" }).select()
                    );
                  }
                }

                if (metric === "logFC") {
                  const logFCData = {
                    gene_id,
                    cancer_type_id,
                    tpm: gene[`mean_tumor_tpm`] && gene[`mean_normal_tpm`] ? gene[`mean_tumor_tpm`] - gene[`mean_normal_tpm`] : null,
                    fpkm: gene[`mean_tumor_fpkm`] && gene[`mean_normal_fpkm`] ? gene[`mean_tumor_fpkm`] - gene[`mean_normal_fpkm`] : null,
                    fpkm_uq: gene[`mean_tumor_fpkm_uq`] && gene[`mean_normal_fpkm_uq`] ? gene[`mean_tumor_fpkm_uq`] - gene[`mean_normal_fpkm_uq`] : null,
                  };
                  if (logFCData.tpm || logFCData.fpkm || logFCData.fpkm_uq) {
                    console.log(`Upserting into logfc:`, logFCData);
                    insertPromises.push(
                      supabase.from("logfc").upsert([logFCData], { onConflict: "gene_id, cancer_type_id" }).select()
                    );
                  }
                }
              });
            });
          }

          const insertResults = await Promise.all(insertPromises);
          const errors = insertResults.filter((result) => result.error);
          if (errors.length > 0) {
            const errorMessages = errors.map((e, i) => `Insert ${i}: ${e.error.message}`).join("; ");
            console.error("Upsert errors:", errorMessages);
            setError(`Failed to insert data: ${errorMessages}`);
          } else {
            console.log("All data inserted successfully:", insertResults.map((r) => r.data));
          }
        }

        if (isMounted) {
          console.log("Setting results data:", processedData);
          processedData.forEach((gene) => {
            console.log(`Gene ${gene.gene_symbol}:`, {
              mean_tumor: gene.mean_tumor,
              std_tumor: gene.std_tumor,
              mean_normal: gene.mean_normal,
              std_normal: gene.std_normal,
              tumorValues: gene.tumorValues,
              normalValues: gene.normalValues,
            });
          });
          setResultsData(processedData);
          setSelectedGenes(processedData.map((d) => d.gene_symbol));
          setCachedData(cacheKey, {
            resultsData: processedData,
            totalTumorSamples: tumorSamples.length,
            totalNormalSamples: normalSamples.length,
          });
          setError(null);
        }
      } catch (error: any) {
        console.error("Error fetching data:", error);
        if (isMounted) {
          setError(error.message || "An error occurred while fetching data.");
          setResultsData([]);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchData();
    return () => {
      isMounted = false;
      if (filterTimeoutRef.current) {
        clearTimeout(filterTimeoutRef.current);
      }
    };
  }, [cleanedGeneSymbols, params.cancerSite, params.cancerTypes, normalizationMethod, selectedNoiseMetrics, getCachedData, setCachedData, generateCacheKey]);

  const toggleGroup = useCallback(
    (group: string) => {
      updateFilters({
        selectedGroups: selectedGroups.includes(group)
          ? selectedGroups.filter((g) => g !== group)
          : [...selectedGroups, group],
      });
    },
    [selectedGroups, updateFilters]
  );

  const handleGeneToggle = useCallback(
    (gene: string) => {
      updateFilters({
        selectedGenes: selectedGenes.includes(gene)
          ? selectedGenes.filter((g) => g !== gene)
          : [...selectedGenes, gene],
      });
    },
    [selectedGenes, updateFilters]
  );

  const toggleAllGenes = useCallback(
    (checked: boolean) => {
      updateFilters({ selectedGenes: checked ? params.genes : [] });
    },
    [params.genes, updateFilters]
  );

  const handleNoiseMetricToggle = useCallback(
    (metric: string) => {
      updateFilters({
        selectedNoiseMetrics: selectedNoiseMetrics.includes(metric)
          ? selectedNoiseMetrics.filter((m) => m !== metric)
          : [...selectedNoiseMetrics, metric],
      });
    },
    [selectedNoiseMetrics, updateFilters]
  );

  const toggleMetricSection = useCallback(
    (metric: string) => {
      setMetricOpenState((prev) => ({
        ...prev,
        [metric]: !prev[metric],
      }));
    },
    []
  );

  const getFilteredResults = useCallback(() => {
    return resultsData
      .filter((gene) => selectedGenes.includes(gene.gene_symbol))
      .map((gene) => {
        const filteredGene: Partial<GeneStats> = {
          gene: gene.gene,
          ensembl_id: gene.ensembl_id,
          gene_symbol: gene.gene_symbol,
          mean_tumor: gene.mean_tumor,
          std_tumor: gene.std_tumor,
          mean_normal: gene.mean_normal,
          std_normal: gene.std_normal,
        };
        selectedGroups.forEach((group) => {
          if (group === "tumor") {
            filteredGene.cv_tumor = gene.cv_tumor;
            filteredGene.mean_tumor = gene.mean_tumor;
            filteredGene.std_tumor = gene.std_tumor;
            filteredGene.mad_tumor = gene.mad_tumor;
            filteredGene.cv_squared_tumor = gene.cv_squared_tumor;
          } else if (group === "normal") {
            filteredGene.cv_normal = gene.cv_normal;
            filteredGene.mean_normal = gene.mean_normal;
            filteredGene.std_normal = gene.std_normal;
            filteredGene.mad_normal = gene.mad_normal;
            filteredGene.cv_squared_normal = gene.cv_squared_normal;
          }
          if (selectedGroups.includes("tumor") && selectedGroups.includes("normal")) {
            if (selectedNoiseMetrics.includes("logFC")) {
              filteredGene.logFC = gene.logFC;
            }
          }
        });
        return filteredGene as GeneStats;
      });
  }, [resultsData, selectedGroups, selectedNoiseMetrics, selectedGenes]);

  const filteredData = useMemo(() => {
    const data = getFilteredResults();
    console.log("Filtered data:", data);
    return data;
  }, [getFilteredResults]);

  const allNoiseMetrics = Object.keys(noiseMetrics);
  const areAllNoiseSelected = useMemo(
    () => allNoiseMetrics.every((metric) => selectedNoiseMetrics.includes(metric)),
    [selectedNoiseMetrics]
  );

  const toggleAllNoiseMetrics = useCallback(
    (checked: boolean) => {
      updateFilters({ selectedNoiseMetrics: checked ? allNoiseMetrics : [] });
    },
    [allNoiseMetrics, updateFilters]
  );

  const areAllGenesSelected = useMemo(
    () => params.genes.every((gene) => selectedGenes.includes(gene)),
    [selectedGenes, params.genes]
  );

  const allPlotKeys = ["logDist", "stdBox"];
  const [visiblePlots, setVisiblePlots] = useState({
    cv: true,
    mean: true,
    std: true,
    mad: true,
    cv_squared: true,
    logFC: true,
    logDist: false,
    stdBox: true,
  });
  const areAllPlotsSelected = useMemo(
    () => allPlotKeys.every((plot) => visiblePlots[plot]),
    [visiblePlots]
  );

  const toggleAllPlots = useCallback(
    (checked: boolean) => {
      setVisiblePlots((prev) => ({
        ...prev,
        ...Object.fromEntries(allPlotKeys.map((plot) => [plot, checked])),
      }));
    },
    []
  );

  const handlePlotToggle = useCallback(
    (plotKey: string) => {
      setVisiblePlots((prev) => ({
        ...prev,
        [plotKey]: !prev[plotKey],
      }));
    },
    []
  );

  const downloadData = useCallback(
    (format: "csv") => {
      const data = filteredData;
      let content = "";
      let filename = `gene_analysis_${params.cancerTypes}_${Date.now()}`;

      if (format === "csv") {
        const excludedKeys = ["tumorValues", "normalValues"];
        const keys = Object.keys(data[0] || {}).filter((key) => !excludedKeys.includes(key));
        const headers = keys.join(",");
        const rows = data.map((row) => keys.map((key) => row[key] || "").join(","));
        content = [headers, ...rows].join("\n");
        filename += ".csv";
      }

      const blob = new Blob([content], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    },
    [filteredData, params.cancerTypes]
  );

  const correlationData = useMemo(() => {
    setIsHeatmapLoading(true);
    const metrics: string[] = [];
    const metricLabels: string[] = [];

    selectedNoiseMetrics.forEach((metric) => {
      const key = noiseMetrics[metric];
      if (key !== "logFC") {
        if (selectedGroups.includes("tumor")) {
          metrics.push(`${key}_tumor`);
          metricLabels.push(`${metric} (Tumor)`);
        }
        if (selectedGroups.includes("normal")) {
          metrics.push(`${key}_normal`);
          metricLabels.push(`${metric} (Normal)`);
        }
      } else if (selectedGroups.includes("tumor") && selectedGroups.includes("normal")) {
        metrics.push("logFC");
        metricLabels.push("log2 Fold Change");
      }
    });

    if (metrics.length < 2) {
      setIsHeatmapLoading(false);
      return { z: [], x: [], y: [], error: "Please select at least two noise metrics for correlation analysis." };
    }

    const dataMatrix = metrics.map((metric) => filteredData.map((gene) => gene[metric] || 0));

    const calculateCorrelation = (x: number[], y: number[]) => {
      if (x.length < 2) return 0;
      const n = x.length;
      const meanX = x.reduce((sum, val) => sum + val, 0) / n;
      const meanY = y.reduce((sum, val) => sum + val, 0) / n;
      const covariance = x.reduce((sum, val, i) => sum + (val - meanX) * (y[i] - meanY), 0) / n;
      const stdX = Math.sqrt(x.reduce((sum, val) => sum + Math.pow(val - meanX, 2), 0) / n);
      const stdY = Math.sqrt(y.reduce((sum, val) => sum + Math.pow(val - meanY, 2), 0) / n);
      return stdX * stdY === 0 ? 0 : covariance / (stdX * stdY);
    };

    const z = metrics.map((_, i) => metrics.map((_, j) => calculateCorrelation(dataMatrix[i], dataMatrix[j])));

    setIsHeatmapLoading(false);
    return { z, x: metricLabels, y: metricLabels, error: null };
  }, [filteredData, selectedNoiseMetrics, selectedGroups]);

  const logDistData = useMemo(() => {
    return resultsData
      .filter((gene) => selectedGenes.includes(gene.gene_symbol))
      .map((gene) => ({
        gene: gene.gene,
        gene_symbol: gene.gene_symbol,
        ...(selectedGroups.includes("tumor") && { tumorLogMean: gene.mean_tumor ? Math.log2(gene.mean_tumor + 1) : 0 }),
        ...(selectedGroups.includes("normal") && { normalLogMean: gene.mean_normal ? Math.log2(gene.mean_normal + 1) : 0 }),
      }));
  }, [resultsData, selectedGroups, selectedGenes]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-yellow-50 flex flex-col">
      <Header />
      <main className="flex-grow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex gap-6">
            <div className="w-80 flex-shrink-0">
              <Card className="border-0 shadow-lg bg-blue-100">
                <CardHeader className="pb-4">
                  <CardTitle className="text-blue-900">Filters</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {params.genes.length > 1 && (
                    <div className="border rounded-md bg-white">
                      <div className="flex justify-between items-center px-4 py-2">
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="genes-master"
                            checked={areAllGenesSelected}
                            onCheckedChange={toggleAllGenes}
                          />
                          <Label htmlFor="genes-master" className="font-bold text-blue-900 -ml-5">
                            Genes
                          </Label>
                        </div>
                        <button onClick={() => setIsGenesOpen((prev) => !prev)} className="text-blue-900">
                          {isGenesOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                        </button>
                      </div>
                      {isGenesOpen && (
                        <div className="px-4 py-2 space-y-2">
                          {params.genes.map((gene) => (
                            <div key={gene} className="flex items-center space-x-2">
                              <Checkbox
                                id={`gene-${gene}`}
                                checked={selectedGenes.includes(gene)}
                                onCheckedChange={() => handleGeneToggle(gene)}
                              />
                              <Label htmlFor={`gene-${gene}`} className="text-sm">
                                {gene}
                              </Label>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                  <div className="border rounded-md bg-white p-4">
                    <h3 className="font-semibold text-blue-900 mb-3">Expression Normalization Method</h3>
                    <RadioGroup
                      value={normalizationMethod}
                      onValueChange={(value) => updateFilters({ normalizationMethod: value })}
                    >
                      {["tpm", "fpkm", "fpkm_uq"].map((method) => (
                        <div key={method} className="flex items-center space-x-2 relative group">
                          <RadioGroupItem value={method} id={method} />
                          <Label htmlFor={method} className="text-sm">
                            {method.toUpperCase()}
                          </Label>
                          <div
                            className="absolute left-0 bottom-full mb-2 hidden group-hover:block bg-gray-800 text-white text-xs rounded p-2 z-10"
                            style={{ minWidth: "200px" }}
                          >
                            {method === "tpm" && <span>Transcripts Per Million</span>}
                            {method === "fpkm" && <span>Fragments Per Kilobase per Million</span>}
                            {method === "fpkm_uq" && <span>Fragments Per Kilobase per Million Upper Quartile</span>}
                          </div>
                        </div>
                      ))}
                    </RadioGroup>
                  </div>
                  <div className="border rounded-md bg-white">
                    <div className="flex justify-between items-center px-4 py-2">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="noise-metrics-master"
                          checked={areAllNoiseSelected}
                          onCheckedChange={toggleAllNoiseMetrics}
                        />
                        <Label htmlFor="noise-metrics-master" className="font-bold text-blue-900 -ml-5">
                          Noise Metrics
                        </Label>
                      </div>
                      <button onClick={() => setIsNoiseMetricsOpen((prev) => !prev)} className="text-blue-900">
                        {isNoiseMetricsOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                      </button>
                    </div>
                    {isNoiseMetricsOpen && (
                      <div className="px-4 py-2 space-y-2">
                        {Object.keys(noiseMetrics).map((metric) => (
                          <div key={metric} className="flex items-center space-x-2 relative group">
                            <Checkbox
                              id={`noise-${metric}`}
                              checked={selectedNoiseMetrics.includes(metric)}
                              onCheckedChange={() => handleNoiseMetricToggle(metric)}
                            />
                            <Label htmlFor={`noise-${metric}`} className="text-sm">
                              {metric}
                            </Label>
                            <div className="absolute left-0 bottom-full mb-2 hidden group-hover:block bg-gray-800 text-white text-xs rounded p-2 z-10 whitespace-nowrap">
                              {metricFormulas[metric]}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="border rounded-md bg-white">
                    <div className="flex justify-between items-center px-4 py-2">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="analysis-plots-master"
                          checked={areAllPlotsSelected}
                          onCheckedChange={toggleAllPlots}
                        />
                        <Label htmlFor="analysis-plots-master" className="font-bold text-blue-900 -ml-5">
                          Analysis Plots
                        </Label>
                      </div>
                      <button onClick={() => setIsAnalysisPlotsOpen((prev) => !prev)} className="text-blue-900">
                        {isAnalysisPlotsOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                      </button>
                    </div>
                    {isAnalysisPlotsOpen && (
                      <div className="px-4 py-2 space-y-2">
                        {allPlotKeys.map((plotKey) => (
                          <div key={plotKey} className="flex items-center space-x-2">
                            <Checkbox
                              id={`plot-${plotKey}`}
                              checked={visiblePlots[plotKey]}
                              onCheckedChange={() => handlePlotToggle(plotKey)}
                            />
                            <Label htmlFor={`plot-${plotKey}`} className="text-sm">
                              {plotKey === "logDist" ? "Log Expression Distribution" : "Standard Deviation"}
                            </Label>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
            <div className="flex-1">
              {isLoading ? (
                <LoadingSpinner message="Loading results..." />
              ) : error ? (
                <div className="text-center text-red-600">{error}</div>
              ) : selectedGenes.length === 0 ? (
                <div className="text-center text-red-600">Please select at least one gene.</div>
              ) : (
                <>
                  <Link
                    to="/gene-analysis"
                    className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-6 transition-colors"
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Gene Analysis
                  </Link>
                  <div className="mb-8">
                    <h2 className="text-4xl font-bold text-blue-900 mb-2">
                      Results for {params.cancerSite} Cancer{" "}
                      {params.cancerTypes.length > 0 && `(${params.cancerTypes.join(", ")})`}
                    </h2>
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex flex-wrap gap-2">
                        {selectedGenes.map((gene) => {
                          const geneData = resultsData.find((d) => d.gene_symbol === gene);
                          return (
                            <Badge key={gene} variant="secondary" className="text-sm">
                              {geneData ? `${gene}` : gene}
                            </Badge>
                          );
                        })}
                      </div>
                      <div className="flex space-x-4">
                        <Button onClick={() => downloadData("csv")} variant="outline" size="sm">
                          <Download className="h-4 w-4 mr-2" /> Download CSV
                        </Button>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                      <Card className="border-0 shadow-lg">
                        <CardContent className="flex flex-col items-center p-4 text-center">
                          <Users className="h-6 w-6 text-blue-600 mb-2" />
                          <div className="text-2xl font-bold text-blue-600">{totalTumorSamples}</div>
                          <div className="text-xs text-gray-600">Total Tumor Samples</div>
                        </CardContent>
                      </Card>
                      <Card className="border-0 shadow-lg">
                        <CardContent className="flex flex-col items-center p-4 text-center">
                          <Users className="h-6 w-6 text-green-600 mb-2" />
                          <div className="text-2xl font-bold text-green-600">{totalNormalSamples}</div>
                          <div className="text-xs text-gray-600">Total Normal Samples</div>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                  {(visiblePlots.cv || visiblePlots.std || visiblePlots.mad || visiblePlots.cv_squared || visiblePlots.mean || visiblePlots.logFC) && (
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
                          <div className="flex gap-4 mb-6">
                            {["normal", "tumor"].map((group) => (
                              <Button
                                key={group}
                                className={`text-white ${
                                  selectedGroups.includes(group)
                                    ? "bg-blue-600 hover:bg-blue-700"
                                    : "bg-white text-blue-600 border border-blue-600 hover:bg-blue-50"
                                }`}
                                onClick={() => toggleGroup(group)}
                              >
                                {group.charAt(0).toUpperCase() + group.slice(1)}
                              </Button>
                            ))}
                          </div>
                          {["cv", "std", "mad", "cv_squared", "mean", "logFC"].map((metric) => {
                            const displayMetric = Object.keys(noiseMetrics).find(
                              (key) => noiseMetrics[key] === metric
                            ) || "log2 Fold Change";
                            return (
                              selectedNoiseMetrics.includes(displayMetric) && visiblePlots[metric] && (
                                <div key={metric} className="mb-4">
                                  <div className="flex justify-between items-center px-4 py-2 bg-white border rounded-md">
                                    <h4 className="text-lg font-semibold text-blue-900">
                                      {displayMetric}
                                    </h4>
                                    <button
                                      onClick={() => toggleMetricSection(metric)}
                                      className="text-blue-900"
                                    >
                                      {metricOpenState[metric] ? (
                                        <ChevronDown className="h-5 w-5" />
                                      ) : (
                                        <ChevronRight className="h-5 w-5" />
                                      )}
                                    </button>
                                  </div>
                                  {metricOpenState[metric] && (
                                    <div className="mt-2">
                                      {metric === "logFC" ? (
                                        selectedGroups.includes("tumor") && selectedGroups.includes("normal") && (
                                          <PlotlyBarChart
                                            data={filteredData}
                                            xKey="gene_symbol"
                                            yKey="logFC"
                                            title="log2 Fold Change"
                                            xLabel="Genes"
                                            yLabel="log2 Fold Change"
                                            colors="#f59e0b"
                                          />
                                        )
                                      ) : (
                                        <PlotlyBarChart
                                          data={filteredData}
                                          xKey="gene_symbol"
                                          yKey={[
                                            ...(selectedGroups.includes("normal") ? [`${metric}_normal`] : []),
                                            ...(selectedGroups.includes("tumor") ? [`${metric}_tumor`] : []),
                                          ]}
                                          title={displayMetric}
                                          xLabel="Genes"
                                          yLabel={displayMetric}
                                          colors={selectedGroups.map((group) =>
                                            group === "tumor" ? "#ef4444" : "#10b981"
                                          )}
                                        />
                                      )}
                                    </div>
                                  )}
                                </div>
                              )
                            );
                          })}
                        </>
                      )}
                    </div>
                  )}
                  {(visiblePlots.logDist || visiblePlots.stdBox) && (
                    <div className="mb-8">
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="text-2xl font-bold text-blue-900">Analysis Plots</h3>
                        <button
                          onClick={() => setIsAnalysisPlotsOpen((prev) => !prev)}
                          className="text-blue-900"
                        >
                          {isAnalysisPlotsOpen ? (
                            <ChevronDown className="h-6 w-6" />
                          ) : (
                            <ChevronRight className="h-6 w-6" />
                          )}
                        </button>
                      </div>
                      {isAnalysisPlotsOpen && (
                        <div className="grid lg:grid-cols-3 md:grid-cols-2 gap-4">
                          {visiblePlots.logDist && (
                            <PlotlyBarChart
                              data={logDistData}
                              xKey="gene_symbol"
                              yKey={selectedGroups.map((group) => `${group}LogMean`)}
                              title="Log Expression Distribution"
                              xLabel="Genes"
                              yLabel="Log2 Expression"
                              colors={selectedGroups.map((group) =>
                                group === "tumor" ? "#ef4444" : "#10b981"
                              )}
                            />
                          )}
                          {visiblePlots.stdBox && (
                            <PlotlyBoxChart
                              data={filteredData}
                              title="Standard Deviation"
                              xKey="gene_symbol"
                              selectedGroups={selectedGroups}
                              xLabel="Genes"
                              yLabel="Expression Value"
                            />
                          )}
                        </div>
                      )}
                    </div>
                  )}
                  {/* {isHeatmapLoading ? (
                    <Card className="border-0 shadow-lg">
                      <CardHeader className="pb-2">
                        <CardTitle className="flex items-center justify-between text-sm">
                          <div className="flex items-center space-x-2">
                            <Box className="h-4 w-4" />
                            <span>Correlation Heatmap</span>
                          </div>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="pt-0 text-center text-blue-900">Loading heatmap...</CardContent>
                    </Card>
                  ) : correlationData.error ? (
                    <Card className="border-0 shadow-lg">
                      <CardHeader className="pb-2">
                        <CardTitle className="flex items-center justify-between text-sm">
                          <div className="flex items-center space-x-2">
                            <Box className="h-4 w-4" />
                            <span>Correlation Heatmap</span>
                          </div>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="pt-0 text-center text-red-600">{correlationData.error}</CardContent>
                    </Card>
                  ) : (
                    <PlotlyHeatmap
                      data={correlationData}
                      title="Correlation Heatmap"
                      xLabel="Metrics"
                      yLabel="Metrics"
                    />
                  )} */}
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

export default GeneResults;
