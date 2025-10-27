import React, { useMemo, useCallback, useReducer, useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ArrowLeft, Download, Users } from "lucide-react";
import { LoadingSpinner } from "@/components/ui/loadingSpinner";
import Header from "@/components/header";
import Footer from "@/components/footer";
import FilterPanel from "@/components/FilterPanel";
import SampleCounts from "@/components/SampleCounts";
import StatisticalMetrics from "@/components/statisticalMetrics";
import { GeneStats } from "@/components/types/genes";

interface FilterState {
  selectedGroups: string[];
  selectedGenes: string[];
  selectedSites: string[];
  normalizationMethod: string;
  selectedNoiseMetrics: string[];
  visiblePlots: Record<string, boolean>;
  metricOpenState: Record<string, boolean>;
  isStatisticalMetricsOpen: boolean;
  isAnalysisPlotsOpen: boolean;
  isSampleCountsOpen: boolean;
  dataFormat: "raw" | "log2";
}

type FilterAction =
  | { type: "SET_GROUPS"; payload: string[] }
  | { type: "SET_GENES"; payload: string[] }
  | { type: "SET_SITES"; payload: string[] }
  | { type: "SET_NORMALIZATION"; payload: string }
  | { type: "SET_NOISE_METRICS"; payload: string[] }
  | { type: "SET_VISIBLE_PLOTS"; payload: Record<string, boolean> }
  | { type: "TOGGLE_METRIC_SECTION"; payload: string }
  | { type: "TOGGLE_STATISTICAL_METRICS" }
  | { type: "TOGGLE_ANALYSIS_PLOTS" }
  | { type: "TOGGLE_SAMPLE_COUNTS" }
  | { type: "SET_DATA_FORMAT"; payload: "raw" | "log2" };

const initialFilterState: FilterState = {
  selectedGroups: ["normal", "tumor"],
  selectedGenes: [],
  selectedSites: [],
  normalizationMethod: "tpm",
  selectedNoiseMetrics: ["CV", "Mean", "Standard Deviation", "MAD", "CV²", "Differential Noise"],
  visiblePlots: { cv: true, mean: true, std: true, mad: true, cv_squared: true, logfc: true },
  metricOpenState: { cv: true, mean: true, std: true, mad: true, cv_squared: true, logfc: true },
  isStatisticalMetricsOpen: true,
  isAnalysisPlotsOpen: true,
  isSampleCountsOpen: true,
  dataFormat: "log2",
};

const filterReducer = (state: FilterState, action: FilterAction): FilterState => {
  switch (action.type) {
    case "SET_GROUPS":
      return { ...state, selectedGroups: action.payload };
    case "SET_GENES":
      return { ...state, selectedGenes: action.payload };
    case "SET_SITES":
      return { ...state, selectedSites: action.payload };
    case "SET_NORMALIZATION":
      return { ...state, normalizationMethod: action.payload };
    case "SET_NOISE_METRICS":
      return { ...state, selectedNoiseMetrics: action.payload };
    case "SET_VISIBLE_PLOTS":
      return { ...state, visiblePlots: action.payload };
    case "TOGGLE_METRIC_SECTION":
      return { ...state, metricOpenState: { ...state.metricOpenState, [action.payload]: !state.metricOpenState[action.payload] } };
    case "TOGGLE_STATISTICAL_METRICS":
      return { ...state, isStatisticalMetricsOpen: !state.isStatisticalMetricsOpen };
    case "TOGGLE_ANALYSIS_PLOTS":
      return { ...state, isAnalysisPlotsOpen: !state.isAnalysisPlotsOpen };
    case "TOGGLE_SAMPLE_COUNTS":
      return { ...state, isSampleCountsOpen: !state.isSampleCountsOpen };
    case "SET_DATA_FORMAT":
      return { ...state, dataFormat: action.payload };
    default:
      return state;
  }
};

interface GeneResultsState {
  resultsData: GeneStats[];
  rawResultsData: GeneStats[];
  cachedApiData: any;
  isLoading: boolean;
  error: string | null;
  totalTumorSamples: number;
  totalNormalSamples: number;
  siteSampleCounts: { site: string; tumor: number; normal: number }[];
  availableSites: string[];
  availableGenes: string[];
  debugMessages: string[];
}

const useGeneResultsData = (params: {
  cancerSites: string[];
  cancerTypes: string[];
  genes: string[];
  analysisType: string;
}, filterState: FilterState) => {
  const [state, setState] = React.useState<GeneResultsState>({
    resultsData: [],
    rawResultsData: [],
    cachedApiData: null,
    isLoading: false,
    error: null,
    totalTumorSamples: 0,
    totalNormalSamples: 0,
    siteSampleCounts: [],
    availableSites: [],
    availableGenes: [],
    debugMessages: [],
  });

  const processData = useCallback((apiData: any): GeneStats[] => {
    if (!apiData || !apiData.results) {
      console.log("No API data or results available.");
      setState((prev) => ({
        ...prev,
        resultsData: [],
        rawResultsData: [],
        siteSampleCounts: [],
        availableSites: [],
        availableGenes: [],
        totalTumorSamples: 0,
        totalNormalSamples: 0,
        error: "No data available in the API response.",
        isLoading: false,
        debugMessages: [],
      }));
      return [];
    }

    console.log("Processing API data with dataFormat:", filterState.dataFormat);

    const processedData: GeneStats[] = [];
    const siteSampleCounts: { site: string; tumor: number; normal: number }[] = [];
    const availableSites: string[] = Object.keys(apiData.results);
    const availableGenes: string[] = [];
    const debugMessages: string[] = [];

    // Collect debug messages from API
    for (const norm of ["tpm", "fpkm", "fpkm_uq"]) {
      for (const key in apiData.debug?.[norm]) {
        if (apiData.debug[norm][key]?.error) {
          debugMessages.push(apiData.debug[norm][key].error);
        }
      }
    }

    // Create a mapping of gene symbols to Ensembl IDs
    const geneIdMap: { [key: string]: string } = {};
    for (const site of Object.keys(apiData.results)) {
      for (const gene of Object.keys(apiData.results[site])) {
        for (const norm of ["tpm", "fpkm", "fpkm_uq"]) {
          const geneData = apiData.results[site][gene][norm]?.raw;
          if (geneData) {
            const geneSymbol = geneData.gene_symbol || gene;
            geneIdMap[geneSymbol] = gene;
            if (!availableGenes.includes(geneSymbol)) {
              availableGenes.push(geneSymbol);
            }
          }
        }
      }
    }

    console.log("Available Genes:", availableGenes);
    console.log("Gene ID Map:", geneIdMap);

    // Process data for each site, gene, normalization, and format
    for (const site of Object.keys(apiData.results)) {
      const counts = apiData.sample_counts[site] || { tumor: 0, normal: 0 };
      siteSampleCounts.push({ site, tumor: counts.tumor, normal: counts.normal });

      const siteData = apiData.results[site] || {};
      for (const gene of Object.keys(siteData)) {
        const geneData = siteData[gene] || {};
        const ensemblId = geneIdMap[gene] || gene;

        for (const norm of ["tpm", "fpkm", "fpkm_uq"]) {
          for (const format of ["raw", "log2"] as const) {
            const data = geneData[norm]?.[format] || {};
            console.log(`Processing ${site}.${gene}.${norm}.${format}:`, data);

            const tumorValues: number[] = [];
            const normalValues: number[] = [];

            const noiseMetrics = {
              CV: "cv",
              Mean: "mean",
              "Standard Deviation": "std",
              MAD: "mad",
              "CV²": "cv_squared",
              "Differential Noise": "logfc",
            };

            const metrics: any = {};
            Object.keys(noiseMetrics).forEach((metric) => {
              const metricKey = noiseMetrics[metric];
              const tumorKey = `${metricKey}_tumor`;
              const normalKey = `${metricKey}_normal`;
              const tumorValue = data[metricKey] ?? undefined;
              const normalValue = data[`${metricKey}_normal`] ?? undefined;
              metrics[`${metricKey}_tumor_${norm}`] = tumorValue;
              metrics[`${metricKey}_normal_${norm}`] = normalValue;
              if (metricKey === "logfc") {
                metrics[`logfc_${norm}`] = data[`logfc`] ?? undefined;
              }
              if (tumorValue !== undefined) {
                tumorValues.push(tumorValue);
              }
              if (normalValue !== undefined && metricKey !== "logfc") {
                normalValues.push(normalValue);
              }
            });

            const geneStat: GeneStats = {
              gene: `${data.gene_symbol || gene} (${gene})`,
              ensembl_id: ensemblId,
              gene_symbol: data.gene_symbol || gene,
              tumorValues: tumorValues.length > 0 ? tumorValues : undefined,
              normalValues: normalValues.length > 0 ? normalValues : undefined,
              cv_tumor: metrics[`cv_tumor_${norm}`] ?? undefined,
              mean_tumor: metrics[`mean_tumor_${norm}`] ?? undefined,
              std_tumor: metrics[`std_tumor_${norm}`] ?? undefined,
              mad_tumor: metrics[`mad_tumor_${norm}`] ?? undefined,
              cv_squared_tumor: metrics[`cv_squared_tumor_${norm}`] ?? undefined,
              cv_normal: metrics[`cv_normal_${norm}`] ?? undefined,
              mean_normal: metrics[`mean_normal_${norm}`] ?? undefined,
              std_normal: metrics[`std_normal_${norm}`] ?? undefined,
              mad_normal: metrics[`mad_normal_${norm}`] ?? undefined,
              cv_squared_normal: metrics[`cv_squared_normal_${norm}`] ?? undefined,
              tumorSamples: counts.tumor,
              normalSamples: counts.normal,
              logfc: metrics[`logfc_${norm}`] ?? undefined,
              logfcMessage: counts.normal < 5 ? "Warning: Low number of normal samples may affect differential results." : undefined,
              site,
              normalizationMethod: norm,
              dataFormat: format,
              ...metrics,
            };
            processedData.push(geneStat);
          }
        }
      }
    }

    const filteredData = processedData.filter(
      (d) =>
        filterState.selectedSites.includes(d.site) &&
        filterState.selectedGenes.includes(d.gene_symbol) &&
        d.normalizationMethod === filterState.normalizationMethod &&
        d.dataFormat === filterState.dataFormat
    );

    console.log("Raw Results Data Length:", processedData.length);
    console.log("Filtered Results Data Length:", filteredData.length);
    console.log("Filtered Data Sample:", filteredData.slice(0, 2));

    setState((prev) => ({
      ...prev,
      resultsData: filteredData,
      rawResultsData: processedData,
      siteSampleCounts,
      availableSites,
      availableGenes,
      totalTumorSamples: siteSampleCounts.reduce((sum, c) => sum + c.tumor, 0),
      totalNormalSamples: siteSampleCounts.reduce((sum, c) => sum + c.normal, 0),
      error: debugMessages.length > 0 && filteredData.length === 0 ? `No data available for selected filters (sites: ${filterState.selectedSites}, genes: ${filterState.selectedGenes}, normalization: ${filterState.normalizationMethod}, format: ${filterState.dataFormat}).` : null,
      isLoading: false,
      debugMessages,
    }));

    return filteredData;
  }, [filterState]);

  const fetchData = useCallback(async (sitesToFetch: string[]) => {
    if (!sitesToFetch.length || !params.genes.length) {
      console.log("No sites or genes selected for fetch.");
      setState((prev) => ({ ...prev, error: "Please select at least one cancer site and one gene.", isLoading: false, debugMessages: [] }));
      return;
    }

    console.log("Fetching data for sites:", sitesToFetch, "genes:", params.genes);
    setState((prev) => ({ ...prev, isLoading: true, error: null, debugMessages: [] }));

    try {
      const queryParams = new URLSearchParams();
      sitesToFetch.forEach((site) => queryParams.append("cancer_site", site));
      if (params.cancerTypes.length > 0) {
        params.cancerTypes.forEach((type) => queryParams.append("cancer_type", type));
      }
      params.genes.forEach((gene) => queryParams.append("gene_ids", gene));

      const response = await fetch(`/api/gene_noise?${queryParams}`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to fetch gene noise data: ${errorText}`);
      }

      const apiData = await response.json();
      if (apiData.error) {
        throw new Error(apiData.error);
      }

      console.log("API Data Fetched:", apiData);
      setState((prev) => ({ ...prev, cachedApiData: apiData }));
      processData(apiData);
    } catch (error: any) {
      console.error("Fetch Error:", error);
      setState((prev) => ({ ...prev, error: error.message || "An error occurred while fetching data.", isLoading: false, debugMessages: [] }));
    }
  }, [params, processData]);

  useEffect(() => {
    console.log("useEffect triggered. Params:", params, "Cached Data Exists:", !!state.cachedApiData, "Filter State:", filterState);
    if (params.cancerSites.length > 0 && params.genes.length > 0) {
      if (!state.cachedApiData) {
        fetchData(params.cancerSites);
      } else {
        processData(state.cachedApiData);
      }
    }
  }, [params.cancerSites, params.genes, filterState, fetchData, processData, state.cachedApiData]);

  return { ...state, fetchData };
};

const GeneResults: React.FC = () => {
  const [searchParams] = useSearchParams();
  const params = useMemo(() => ({
    cancerSites: searchParams.get("sites")?.split(",").filter(Boolean) || [],
    cancerTypes: searchParams.get("cancerTypes")?.split(",").filter(Boolean) || [],
    genes: searchParams.get("genes")?.split(",").filter(Boolean) || [],
    analysisType: searchParams.get("analysisType") || "cancer-specific",
  }), [searchParams]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const [filterState, dispatch] = useReducer(filterReducer, {
    ...initialFilterState,
    selectedGenes: params.genes,
    selectedSites: params.cancerSites,
  });

  const { resultsData, rawResultsData, isLoading, error, totalTumorSamples, totalNormalSamples, siteSampleCounts, availableSites, availableGenes, fetchData, debugMessages } = useGeneResultsData(params, filterState);

  const updateFilters = useCallback((updates: Partial<FilterState>) => {
    console.log("Updating filters:", updates);
    if (updates.selectedGroups) dispatch({ type: "SET_GROUPS", payload: updates.selectedGroups });
    if (updates.selectedGenes) dispatch({ type: "SET_GENES", payload: updates.selectedGenes });
    if (updates.selectedSites) dispatch({ type: "SET_SITES", payload: updates.selectedSites });
    if (updates.normalizationMethod) dispatch({ type: "SET_NORMALIZATION", payload: updates.normalizationMethod });
    if (updates.selectedNoiseMetrics) dispatch({ type: "SET_NOISE_METRICS", payload: updates.selectedNoiseMetrics });
    if (updates.visiblePlots) dispatch({ type: "SET_VISIBLE_PLOTS", payload: updates.visiblePlots });
    if (updates.dataFormat) dispatch({ type: "SET_DATA_FORMAT", payload: updates.dataFormat });
  }, []);

  const handleFilterChange = useCallback((filterId: string, value: any) => {
    console.log("Filter changed:", filterId, value);
    if (filterId === "genes") {
      updateFilters({ selectedGenes: value });
    } else if (filterId === "noiseMetrics") {
      updateFilters({ selectedNoiseMetrics: value });
    } else if (filterId === "analysisPlots") {
      updateFilters({
        visiblePlots: {
          ...filterState.visiblePlots,
          ...Object.fromEntries(value.map((id: string) => [id, true]).concat(
            Object.keys(filterState.visiblePlots).filter((k) => !value.includes(k)).map((k) => [k, false])
          )),
        },
      });
    } else if (filterId === "sites") {
      updateFilters({ selectedSites: value });
    }
  }, [filterState.visiblePlots, updateFilters]);

  const downloadData = useCallback((format: "csv") => {
    const data = resultsData.filter((d) => d.normalizationMethod === filterState.normalizationMethod);
    let content = "";
    let filename = `gene_analysis_${filterState.normalizationMethod}_${Date.now()}.csv`;

    if (format === "csv") {
      const keys = [
        "site", "gene_symbol", "ensembl_id", "dataFormat",
        "cv_tumor", "mean_tumor", "std_tumor", "mad_tumor", "cv_squared_tumor",
        "cv_normal", "mean_normal", "std_normal", "mad_normal", "cv_squared_normal",
        "logfc", "tumorSamples", "normalSamples"
      ];
      const headers = keys.join(",");
      const rows = data.map((row) =>
        keys.map((key) => {
          const value = row[key as keyof GeneStats];
          return typeof value === "number" ? value.toFixed(6) : value || "";
        }).join(",")
      );
      content = [headers, ...rows].join("\n");
    }

    const blob = new Blob([content], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }, [resultsData, filterState.normalizationMethod]);

  const metricFormulas = {
    CV: <>CV = σ / μ</>,
    "Standard Deviation": "σ",
    "Mean": <>μ</>,
    MAD: <>Mean Absolute Deviation</>,
    "CV²": <>CV<sup>2</sup> = (σ / μ)<sup>2</sup></>,
    "Differential Noise": <>Differential Noise = log<sub>2</sub>(CV<sub>tumor</sub> / CV<sub>normal</sub>)</>,
  };

  const customFilters = useMemo(() => {
    const filters = [
      {
        title: params.analysisType === "cancer-specific" ? "Genes" : "Sites",
        id: params.analysisType === "cancer-specific" ? "genes" : "sites",
        type: "checkbox" as const,
        options: params.analysisType === "cancer-specific"
          ? availableGenes.map((geneSymbol) => ({ id: geneSymbol, label: geneSymbol }))
          : availableSites.map((site) => ({ id: site, label: site })),
        isMasterCheckbox: true,
        defaultOpen: false,
      },
      {
        title: "Noise Metrics",
        id: "noiseMetrics",
        type: "checkbox" as const,
        options: Object.keys(metricFormulas).map((metric) => ({
          id: metric,
          label: metric,
          tooltip: metricFormulas[metric],
        })),
        isMasterCheckbox: true,
        defaultOpen: false,
      },
    ];

    if (params.analysisType !== "cancer-specific" && params.genes.length > 1) {
      filters.splice(1, 0, {
        title: "Genes",
        id: "genes",
        type: "checkbox" as const,
        options: availableGenes.map((geneSymbol) => ({ id: geneSymbol, label: geneSymbol })),
        isMasterCheckbox: true,
        defaultOpen: false,
      });
    }

    return filters;
  }, [availableSites, availableGenes, params.analysisType]);

  const warnings = useMemo(() => {
    return [...new Set([...resultsData.map((d) => d.logfcMessage).filter(Boolean), ...debugMessages])] as string[];
  }, [resultsData, debugMessages]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-yellow-50 flex flex-col">
      <Header />
      <main className="flex-grow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-[320px_1fr] gap-6">
            <FilterPanel
              normalizationMethod={filterState.normalizationMethod}
              setNormalizationMethod={(value) => updateFilters({ normalizationMethod: value })}
              customFilters={customFilters}
              onFilterChange={handleFilterChange}
              selectedValues={{
                sites: filterState.selectedSites,
                genes: filterState.selectedGenes,
                noiseMetrics: filterState.selectedNoiseMetrics,
              }}
            />
            <div className="flex-1">
              {isLoading ? (
                <LoadingSpinner message="Please wait..." />
              ) : error ? (
                <div className="text-center text-red-600">{error}</div>
              ) : filterState.selectedGenes.length === 0 || filterState.selectedSites.length === 0 ? (
                <div className="text-center text-red-600">Please select at least one gene or one site.</div>
              ) : resultsData.length === 0 ? (
                <div className="text-center text-red-600">No data available for selected sites, genes, normalization method, or data format.</div>
              ) : (
                <>
                  <Link
                    to="/gene-analysis"
                    className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-4 transition-colors"
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Gene Analysis
                  </Link>
                  <div className="mb-8">
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="text-4xl font-bold text-blue-900">Results For Gene Analysis</h2>
                      <Button onClick={() => downloadData("csv")} variant="outline" size="sm">
                        <Download className="h-4 w-4 mr-2" /> Download CSV
                      </Button>
                    </div>
                    <table className="min-w-full bg-white border border-gray-200 rounded-lg shadow-sm">
                      <tbody>
                        <tr className="border-b">
                          <th className="text-left py-3 pl-4 text-blue-700 font-semibold w-1/6 border-r border-gray-300">
                            Analysis Type
                          </th>
                          <td className="py-3 pl-2 pr-4 text-blue-700 text-left align-top">
                            {params.analysisType === "pan-cancer" ? "Pan-Cancer" : "Cancer-Specific"}
                          </td>
                        </tr>
                        <tr className="border-b">
                          <th className="text-left py-3 pl-4 text-blue-700 font-semibold w-1/5 border-r border-gray-300">
                            Normalization
                          </th>
                          <td className="py-3 pl-2 pr-4 text-blue-700 text-left align-top">
                            {filterState.normalizationMethod.toUpperCase()}
                          </td>
                        </tr>
                        <tr className="border-b">
                          <th className="text-left py-3 pl-4 text-blue-700 font-semibold w-1/5 border-r border-gray-300">
                            Genes
                          </th>
                          <td className="py-3 pl-2 pr-4 text-blue-700 text-left align-top">
                            {filterState.selectedGenes.join(", ")}
                          </td>
                        </tr>
                        <tr>
                          <th className="text-left py-3 pl-4 text-blue-700 font-semibold w-1/5 border-r border-gray-300">
                            Cancer Site(s)
                          </th>
                          <td className="py-3 pl-2 pr-4 text-blue-700 text-left align-top">
                            {filterState.selectedSites.join(", ")}
                            {params.cancerTypes.length > 0 && ` (${params.cancerTypes.join(", ")})`}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                    {warnings.length > 0 && (
                      <Alert className="mb-4">
                        <AlertDescription>{warnings.join("; ")}</AlertDescription>
                      </Alert>
                    )}
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
                      isOpen={filterState.isSampleCountsOpen}
                      toggleOpen={() => dispatch({ type: "TOGGLE_SAMPLE_COUNTS" })}
                      siteSampleCounts={siteSampleCounts}
                      selectedSites={filterState.selectedSites}
                      selectedGroups={filterState.selectedGroups}
                    />
                    <StatisticalMetrics
                      isOpen={filterState.isStatisticalMetricsOpen}
                      toggleOpen={() => dispatch({ type: "TOGGLE_STATISTICAL_METRICS" })}
                      data={rawResultsData}
                      selectedGroups={filterState.selectedGroups}
                      selectedNoiseMetrics={filterState.selectedNoiseMetrics}
                      visiblePlots={filterState.visiblePlots}
                      metricOpenState={filterState.metricOpenState}
                      toggleMetricSection={(metric) => dispatch({ type: "TOGGLE_METRIC_SECTION", payload: metric })}
                      normalizationMethod={filterState.normalizationMethod}
                      analysisType={params.analysisType}
                      genes={filterState.selectedGenes}
                      selectedSites={filterState.selectedSites}
                    />
                  </div>
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

export default React.memo(GeneResults);