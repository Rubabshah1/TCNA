import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useSearchParams, Link } from "react-router-dom";
import supabase from "@/supabase-client";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Download, Activity, Users, Info, ChevronDown, ChevronUp } from "lucide-react";
import { PlotlyHeatmap } from "@/components/charts/index";
import Header from "@/components/header";
import Footer from "@/components/footer";
import { useCache } from "@/hooks/use-cache";
import { LoadingSpinner } from "@/components/ui/loadingSpinner";
import FilterPanel from "@/components/FilterPanel";
import { DataTable } from "@/components/ui/data-table";
import CollapsibleCard from "@/components/ui/collapsible-card";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import SampleCounts from "@/components/SampleCounts";

// Interfaces
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
    [key: string]: number;
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
  [method: string]: NormalizationResults;
}

interface FilterOption {
  id: string;
  label: string;
  tooltip?: string;
}

interface FilterSection {
  title: string;
  id: string;
  options: FilterOption[];
  isMasterCheckbox?: boolean;
  type: 'checkbox' | 'radio';
  defaultOpen?: boolean;
}

const PathwayResults = () => {
  const [searchParams, setSearchParams] = useSearchParams();
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
  const [availableSites, setAvailableSites] = useState<FilterOption[]>([]);
  const [selectedValues, setSelectedValues] = useState<{ [key: string]: string[] | string }>({
    sites: params.sites,
  });
  const [selectedGroups, setSelectedGroups] = useState<string[]>(["normal", "tumor"]);
  const [selectedPathway, setSelectedPathway] = useState<Enrichment | null>(null);
  const [sortBy, setSortBy] = useState<"pval" | "adjPval">("pval");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [logFCThreshold, setLogFCThreshold] = useState(0.7);
  const { getCachedData, setCachedData, generateCacheKey } = useCache<ResultsData>();
  const normalizationMethods = ["tpm", "fpkm", "fpkm_uq"];
  const [totalTumorSamples, setTotalTumorSamples] = useState(0);
  const [totalNormalSamples, setTotalNormalSamples] = useState(0);
  const [isOpen, setIsOpen] = useState(false);

  // Fetch available sites from Supabase
  const fetchAvailableSites = useCallback(async () => {
    try {
      const { data, error } = await supabase.from("Sites").select("name");
      if (error) throw new Error(`Failed to fetch sites: ${error.message}`);
      const sites = data
        .map((row) => ({
          id: row.name,
          label: row.name,
          tooltip: `Cancer site: ${row.name}`,
        }))
        .sort((a, b) => a.label.localeCompare(b.label));
      setAvailableSites(sites);
    } catch (error) {
      console.error("Error fetching sites:", error);
      setError(error.message || "An error occurred while fetching sites.");
    }
  }, []);

  useEffect(() => {
    fetchAvailableSites();
  }, [fetchAvailableSites]);

  // Handle filter changes
  const handleFilterChange = useCallback(
    (filterId: string, value: string[] | string) => {
      if (filterId === "sites") {
        setSelectedValues((prev) => ({ ...prev, [filterId]: value }));
        setSearchParams({
          ...Object.fromEntries(searchParams),
          sites: (value as string[]).join(","),
        });
      }
    },
    [setSearchParams]
  );

  // Custom filters for FilterPanel
  const customFilters: FilterSection[] = useMemo(
    () => [
      {
        title: "Sites",
        id: "sites",
        type: "checkbox",
        options: availableSites,
        isMasterCheckbox: true,
        defaultOpen: false,
      },
    ],
    [availableSites]
  );

  // Get current results
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

  // Compute enriched pathways by site
  // const enrichedPathwaysBySite = useMemo(() => {
  //   const selectedSites = selectedValues.sites as string[];
  //   const results: { site: string; pathway: string; adjPValue: number; genes: string[] }[] = [];
  //   selectedSites.forEach((site) => {
  //     const lowerSite = site.toLowerCase();
  //     const significantGenes = currentResults.gene_stats
  //       .filter((geneStat) => {
  //         const logFC = geneStat.metrics[lowerSite]?.logfc || 0;
  //         return Math.abs(logFC) >= logFCThreshold;
  //       })
  //       .map((geneStat) => geneStat.gene);

  //     const relevantPathways = currentResults.enrichment
  //       .filter((pathway) => pathway.Genes.some((gene) => significantGenes.includes(gene)))
  //       .map((pathway) => ({
  //         ...pathway,
  //         matchingGenes: pathway.Genes.filter((gene) => significantGenes.includes(gene)),
  //       }));

  //     const mostEnriched = relevantPathways.reduce(
  //       (best, pathway) =>
  //         !best || pathway["Adjusted P-value"] < best["Adjusted P-value"] ? pathway : best,
  //       null as (Enrichment & { matchingGenes: string[] }) | null
  //     );

  //     if (mostEnriched) {
  //       results.push({
  //         site,
  //         pathway: mostEnriched.Term,
  //         adjPValue: mostEnriched["Adjusted P-value"],
  //         genes: mostEnriched.matchingGenes,
  //       });
  //     } else {
  //       results.push({
  //         site,
  //         pathway: "None",
  //         adjPValue: 0,
  //         genes: [],
  //       });
  //     }
  //   });
  //   return results;
  // }, [currentResults.enrichment, currentResults.gene_stats, selectedValues.sites, logFCThreshold]);
    // Compute enriched pathways by site
  const enrichedPathwaysBySite = useMemo(() => {
    const selectedSites = selectedValues.sites as string[];
    const results: { site: string; pathway: string; adjPValue: number; genes: string[] }[] = [];
    selectedSites.forEach((site) => {
      const lowerSite = site.toLowerCase();
      const significantGenes = currentResults.gene_stats
        .filter((geneStat) => {
          const logFC = geneStat.metrics[lowerSite]?.logfc || 0;
          return Math.abs(logFC) >= logFCThreshold;
        })
        .map((geneStat) => geneStat.gene);

      const relevantPathways = currentResults.enrichment
        .filter((pathway) => pathway.Genes.some((gene) => significantGenes.includes(gene)))
        .sort((a, b) => a["Adjusted P-value"] - b["Adjusted P-value"])
        .map((pathway) => ({
          ...pathway,
          matchingGenes: pathway.Genes.filter((gene) => significantGenes.includes(gene)),
        }));

      if (relevantPathways.length > 0) {
        const pathwayNames = relevantPathways.map((p) => p.Term.charAt(0).toUpperCase() + p.Term.slice(1))
          .join(", ");
        const avgAdjPValue =
          relevantPathways.reduce((sum, p) => sum + p["Adjusted P-value"], 0) / relevantPathways.length;
        const allMatchingGenes = [
          ...new Set(relevantPathways.flatMap((p) => p.matchingGenes)),
        ];
        results.push({
          site,
          pathway: pathwayNames || "None",
          adjPValue: avgAdjPValue || 0,
          genes: allMatchingGenes,
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
  }, [currentResults.enrichment, currentResults.gene_stats, selectedValues.sites, logFCThreshold]);


  const logFCColors = useMemo(() => {
    return currentResults.gene_stats.map((geneStat) => {
      const logFCs = Object.values(geneStat.metrics).map((m) => m.logfc || 0);
      const avgLogFC = logFCs.length > 0 ? logFCs.reduce((sum, val) => sum + val, 0) / logFCs.length : 0;
      return avgLogFC < 0 ? "#ef4444" : "#3b82f6";
    });
  }, [currentResults.gene_stats]);

  const formatPValue = (pValue: number) => {
    if (pValue <= 0.001) return "****";
    if (pValue <= 0.01) return "***";
    if (pValue <= 0.05) return "**";
    return pValue.toExponential(2);
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
    if (selectedValues.sites.length > 0) {
      fetchSampleCounts(selectedValues.sites as string[], params.cancerTypes);
    }
  }, [selectedValues.sites, params.cancerTypes, fetchSampleCounts]);

  useEffect(() => {
    let isMounted = true;
    const fetchData = async () => {
      const selectedSites = selectedValues.sites as string[];
      if (selectedSites.length === 0) {
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
          .in("name", selectedSites);
        if (siteRowsErr) throw new Error(`Failed to fetch cancer sites: ${siteRowsErr.message}`);
        if (!siteRows?.length) throw new Error(`Cancer sites not found: ${selectedSites.join(", ")}`);
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

        const cancerParam = params.siteAnalysisType === "cancer-specific" ? selectedSites[0] : selectedSites.join(",");
        const queryParams = new URLSearchParams({
          cancer: cancerParam,
          top_n: params.topN.toString(),
          analysis_type: params.analysisType,
          ...(params.genes.length > 0 && params.analysisType === "ORA" && { genes: params.genes.join(",") }),
        });
        const response = await fetch(`/api/pathway-analysis?${queryParams}`);
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Failed to fetch pathway analysis data: ${errorText}`);
        }
        const apiData: ResultsData = await response.json();

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
          sites: selectedSites,
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

    const cacheKey = generateCacheKey({
      sites: selectedValues.sites as string[],
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
  }, [
    selectedValues.sites,
    params.cancerTypes,
    params.genes,
    params.topN,
    params.analysisType,
    params.siteAnalysisType,
    getCachedData,
    setCachedData,
    generateCacheKey,
  ]);

  const downloadData = useCallback(
    (type: "enrichment" | "mean_expression" | "noise_metrics") => {
      const selectedSites = selectedValues.sites as string[];
      let data: any[] = [];
      let headers: string[] = [];
      let filename = `pathway_analysis_${selectedSites.join("_")}_${params.siteAnalysisType}_${params.analysisType}_${normalizationMethod}_${Date.now()}`;
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
        headers = ["Gene", "Ensembl ID", ...selectedSites.flatMap((site) => [`${site} Normal`, `${site} Tumor`])];
        filename = `mean_expression_${filename}.csv`;
        const rows = data.map((row) => {
          const metrics = selectedSites.map((site) => {
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
        headers = ["Gene", "Ensembl ID", ...selectedSites.flatMap((site) => [`${site} Normal`, `${site} Tumor`, `${site} Log2FC`])];
        filename = `noise_metrics_${filename}.csv`;
        const rows = data.map((row) => {
          const metrics = selectedSites.map((site) => {
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
    [currentResults, selectedValues.sites, params.siteAnalysisType, params.analysisType, normalizationMethod]
  );

  const getZValues = useCallback(
    (dataKey: "mean" | "cv" | "logfc") => {
      const selectedSites = selectedValues.sites as string[];
      const zValues = currentResults.gene_stats.map((geneStat) => {
        const gene = geneStat.gene;
        if (dataKey === "mean") {
          return selectedSites.flatMap((site) => {
            const lowerSite = site.toLowerCase();
            return [
              geneStat.metrics[lowerSite]?.mean_normal || 0,
              geneStat.metrics[lowerSite]?.mean_tumor || 0,
            ];
          });
        } else if (dataKey === "cv") {
          return selectedSites.flatMap((site) => {
            const lowerSite = site.toLowerCase();
            return [
              geneStat.metrics[lowerSite]?.cv_normal || 0,
              geneStat.metrics[lowerSite]?.cv_tumor || 0,
            ];
          });
        } else {
          return selectedSites.map((site) => {
            const lowerSite = site.toLowerCase();
            return geneStat.metrics[lowerSite]?.logfc || 0;
          });
        }
      });
      console.log(`All zValues (${dataKey}):`, zValues);
      return zValues;
    },
    [currentResults.gene_stats, selectedValues.sites]
  );
  
    const toggleOpen = () => {
    setIsOpen(!isOpen);
  };
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-yellow-50 flex flex-col">
      <Header />
      <main className="flex-grow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-[320px_1fr] gap-6">
            <FilterPanel
              normalizationMethod={normalizationMethod}
              setNormalizationMethod={setNormalizationMethod}
              customFilters={customFilters}
              onFilterChange={handleFilterChange}
              selectedValues={selectedValues}
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
                    className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-4 transition-colors"
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Pathway Analysis
                  </Link>
                  {/* <h2 className="text-4xl font-bold text-blue-900 mb-4">Results For Pathway Analysis</h2>
                  <div className="flex items-center justify-between mb-4">
                    <div className="text-blue-700 text-lg space-y-1">
                      <div>
                        <strong>Normalization:</strong> log2({normalizationMethod.toUpperCase()} + 1)
                      </div>
                      <div>
                        <strong>Genes:</strong> {params.genes.join(", ")}
                      </div>
                      <div>
                        <strong>Cancer Site(s):</strong> {(selectedValues.sites as string[]).join(", ")}
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
                  </div> */}
                     <div className="mb-8">
                                      <div className="flex items-center justify-between mb-6">
                                        <h2 className="text-4xl font-bold text-blue-900">Results For Pathway Analysis</h2>
                                        <Button
                      onClick={() => downloadData("enrichment")}
                      variant="outline"
                      size="sm"
                    >
                      <Download className="h-4 w-4 mr-2" /> Download Enrichment CSV
                    </Button>
                                      </div>
                                          
                                          <div className="overflow-x-auto mb-6">
                                            <table className="min-w-full bg-white border border-gray-200 rounded-lg shadow-sm">
                                              <tbody>
                                                <tr className="border-b">
                                                  <th className="text-left py-3 px-4 text-blue-700 font-semibold w-1/3">Analysis Type</th>
                                                  <td className="py-3 px-4 text-blue-700">
                                                    {/* {params.analysisType === "pan-cancer" ? "Pan-Cancer" : "Cancer-Specific"} */}
                                                  </td>
                                                </tr>
                                                <tr className="border-b">
                                                  <th className="text-left py-3 px-4 text-blue-700 font-semibold w-1/3">Normalization</th>
                                                  <td className="py-3 px-4 text-blue-700">
                                                    log2({normalizationMethod.toUpperCase()} + 1)
                                                  </td>
                                                </tr>
                                                <tr className="border-b">
                                                  <th className="text-left py-3 px-4 text-blue-700 font-semibold w-1/3">Genes</th>
                                                  <td className="py-3 px-4 text-blue-700">
                                                    {params.genes.join(", ")}
                                                  </td>
                                                </tr>
                                                <tr>
                                                  <th className="text-left py-3 px-4 text-blue-700 font-semibold w-1/3">Cancer Site(s)</th>
                                                  <td className="py-3 px-4 text-blue-700">
                                                    {params.sites.join(", ")}
                                                    {params.cancerTypes.length > 0 && ` (${params.cancerTypes.join(", ")})`}
                                                  </td>
                                                </tr>
                                              </tbody>
                                            </table>
                                      </div>
                    </div>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                      <Card className="border-0 shadow-lg">
                        <CardContent className="flex flex-col items-center p-4 text-center">
                          <Users className="h-6 w-6 text-green-600 mb-2" />
                          <div className="text-2xl font-bold text-green-600">{totalNormalSamples}</div>
                          <div className="text-xs text-gray-600">Total Normal Samples</div>
                        </CardContent>
                      </Card>
                      <Card className="border-0 shadow-lg">
                        <CardContent className="flex flex-col items-center p-4 text-center">
                          <Users className="h-6 w-6 text-red-600 mb-2" />
                          <div className="text-2xl font-bold text-red-600">{totalTumorSamples}</div>
                          <div className="text-xs text-gray-600">Total Tumor Samples</div>
                        </CardContent>
                      </Card>
                    </div>                     
                       <SampleCounts
                        isOpen={isOpen}
                        toggleOpen={toggleOpen}
                        siteSampleCounts={siteSampleCounts.length > 0 ? siteSampleCounts : params.sites.map((site) => ({ site, tumor: 0, normal: 0 }))}
                        selectedSites={params.sites}
                        selectedGroups={selectedGroups}
                      />
                  {currentResults.enrichment.length === 0 ? (
                    <Card className="shadowjg p-6 text-center text-blue-700">
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
                              containerWidth="600px"
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
                            xValues={(selectedValues.sites as string[]).flatMap((site) => [`${site} Normal`, `${site} Tumor`])}
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
                            xValues={(selectedValues.sites as string[]).flatMap((site) => [`${site} Normal`, `${site} Tumor`])}
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
                            xValues={selectedValues.sites as string[]}
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
                              ...(selectedValues.sites as string[]).flatMap((site) => {
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
                            // containerWidth="80%"
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
                              ...(selectedValues.sites as string[]).flatMap((site) => {
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
                            // containerWidth="600px"
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
                              ...(selectedValues.sites as string[]).flatMap((site) => {
                                const lowerSite = site.toLowerCase();
                                return [
                                  {
                                    key: `${site}-logfc`,
                                    header: `${site}`,
                                    sortable: true,
                                    render: (_: any, row: any) => {
                                      const value = row.metrics?.[lowerSite]?.logfc;
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
                      {/* <div className="mb-4">
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
                      </div> */}
                      {/* <div className="mb-4">
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
                            showDownloadButtons={true}

                          />
                        </CollapsibleCard>
                      </div> */}
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