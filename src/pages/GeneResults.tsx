import React, { useMemo, useCallback, useReducer, useEffect, useRef, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ArrowLeft, Download, Users } from "lucide-react";
import { LoadingSpinner } from "@/components/ui/loadingSpinner";
import Header from "@/components/header";
import Footer from "@/components/footer";
import { useCache } from "@/hooks/use-cache";
import FilterPanel from "@/components/FilterPanel";
import SampleCounts from "@/components/SampleCounts";
import StatisticalMetrics from "@/components/statisticalMetrics";
import AnalysisPlots from "@/components/AnalysisPlots";
import supabase from "@/supabase-client";
import { upsertGeneData } from "@/scripts/populateDB";
import CollapsibleCard from "@/components/ui/collapsible-card";

// Define interfaces
export interface GeneStats {
  gene: string;
  site: string;
  ensembl_id: string;
  gene_symbol: string;
  cv_tumor?: number;
  mean_tumor?: number;
  std_tumor?: number;
  mad_tumor?: number;
  cv_squared_tumor?: number;
  cv_normal?: number;
  mean_normal?: number;
  std_normal?: number;
  mad_normal?: number;
  cv_squared_normal?: number;
  tumorSamples: number;
  normalSamples: number;
  logfc?: number;
  warning?: string;
  tumorValues?: number[];
  normalValues?: number[];
  normalizationMethod: string;
  [key: `${string}_${'tumor' | 'normal'}_${'tpm' | 'fpkm' | 'fpkm_uq'}`]: number | undefined;
}

export interface ResultsData {
  resultsData: GeneStats[];
  totalTumorSamples: number;
  totalNormalSamples: number;
}

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
  | { type: "TOGGLE_SAMPLE_COUNTS" };

const initialFilterState: FilterState = {
  selectedGroups: ["normal", "tumor"],
  selectedGenes: [],
  selectedSites: [],
  normalizationMethod: "tpm",
  selectedNoiseMetrics: ["CV", "Mean", "Standard Deviation", "MAD", "CV²", "Differential Noise"],
  visiblePlots: { cv: true, mean: true, std: true, mad: true, cv_squared: true, logfc: true, stdBox: true },
  metricOpenState: { cv: true, mean: true, std: true, mad: true, cv_squared: true, logfc: true },
  isStatisticalMetricsOpen: true,
  isAnalysisPlotsOpen: true,
  isSampleCountsOpen: true,
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
    default:
      return state;
  }
};

interface GeneResultsState {
  resultsData: GeneStats[];
  isLoading: boolean;
  error: string | null;
  totalTumorSamples: number;
  totalNormalSamples: number;
  siteSampleCounts: { site: string; tumor: number; normal: number }[];
  availableSites: { id: number; name: string }[];
  rawResultsData: GeneStats[];
  fetchedSites: string[];
}

const useGeneResultsData = (params: {
  cancerSites: string[];
  cancerTypes: string[];
  genes: string[];
  analysisType: string;
}, filterState: FilterState) => {
  const [state, setState] = useState<GeneResultsState>({
    resultsData: [],
    isLoading: false,
    error: null,
    totalTumorSamples: 0,
    totalNormalSamples: 0,
    siteSampleCounts: [],
    availableSites: [],
    rawResultsData: [],
    fetchedSites: [],
  });
  const { getCachedData, setCachedData, generateCacheKey } = useCache<ResultsData>();
  const filterTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const apiSiteKeyMap: { [key: string]: string } = {
    "liver and bile duct": "liver",
  "breast": "breast",
  "bladder": "bladder",
  "colorectal": "colon",
  "uterus": "uterus",
  "lung": "lung",
  "kidney": "kidney",
  "rectum": "rectum",
  "stomach": "stomach",
  "brain and nervous system": "brain",
  "thymus": "thymus",
  "cervix": "cervix",
  "adrenal gland": "adrenal",
  "head and neck": "headandneck",
  "esophagus": "esophagus",
  "prostate": "prostate",
  "thyroid": "thyroid",
  "pancreas": "pancreas",
  "testis": "testis",
  "lymph nodes": "lymph",
  "heart and pleura": "heart",
  "ovary": "ovary",
  "skin": "skin",
  "eye and adnexa": "eye",
  "bone marrow and blood": "blood",
  "soft tissue": "soft tissue"
  };
  const reverseCancerMapping: { [key: string]: string } = Object.fromEntries(
    Object.entries(apiSiteKeyMap).map(([displayName, apiKey]) => [apiKey, displayName])
  );

  useEffect(() => {
    const fetchSites = async () => {
      try {
        const { data, error } = await supabase.from("Sites").select("id, name");
        if (error) throw error;
        setState((prev) => ({ ...prev, availableSites: data.sort((a, b) => a.name.localeCompare(b.name)) }));
      } catch (err) {
        console.error("Failed to fetch sites:", err);
        setState((prev) => ({ ...prev, error: "Failed to fetch sites." }));
      }
    };
    fetchSites();
  }, []);

  useEffect(() => {
    console.log("Filter State:", {
      selectedSites: filterState.selectedSites,
      selectedGenes: filterState.selectedGenes,
      normalizationMethod: filterState.normalizationMethod,
    });
    console.log("Raw Results Data:", state.rawResultsData.map(d => ({
      site: d.site,
      gene_symbol: d.gene_symbol,
      normalizationMethod: d.normalizationMethod,
    })));

    const filteredResults = state.rawResultsData.filter(
      (d) =>
        filterState.selectedSites.includes(d.site) &&
        filterState.selectedGenes.includes(d.gene_symbol) &&
        d.normalizationMethod === filterState.normalizationMethod
    );
    console.log("Filtered Results:", filteredResults);

    const filteredCounts = state.siteSampleCounts.filter((c) => filterState.selectedSites.includes(c.site));

    setState((prev) => ({
      ...prev,
      resultsData: filteredResults,
      siteSampleCounts: filteredCounts,
      totalTumorSamples: filteredCounts.reduce((sum, c) => sum + c.tumor, 0),
      totalNormalSamples: filteredCounts.reduce((sum, c) => sum + c.normal, 0),
      error: filteredResults.length === 0 && filterState.selectedSites.length > 0 ? "No data matches the selected filters." : null,
    }));
  }, [filterState.selectedSites, filterState.selectedGenes, filterState.normalizationMethod, state.rawResultsData]);
  const fetchData = useCallback(async (sitesToFetch: string[], normalizationMethods: string[] = ["tpm", "fpkm", "fpkm_uq"]) => {
    if (!sitesToFetch.length || !params.genes.length) {
      setState((prev) => ({ ...prev, error: "Please select at least one cancer site and one gene.", isLoading: false }));
      return;
    }

    const cleanedGeneSymbols = params.genes.map((g) => g.trim().toUpperCase()).filter(Boolean);
    const cacheKeys = normalizationMethods.map((norm) =>
      generateCacheKey({
        cleanedGeneSymbols,
        cancerSites: sitesToFetch,
        cancerTypes: params.cancerTypes,
        normalizationMethod: norm,
        selectedNoiseMetrics: filterState.selectedNoiseMetrics,
      })
    );

    // Check cache for each normalization method
    const cachedResults: GeneStats[] = [];
    cacheKeys.forEach((cacheKey, index) => {
      const cachedData = getCachedData(cacheKey);
      if (cachedData) {
        cachedResults.push(
          ...cachedData.resultsData.map((d) => ({
            ...d,
            normalizationMethod: normalizationMethods[index],
          }))
        );
      }
    });

    if (cachedResults.length > 0) {
      setState((prev) => ({
        ...prev,
        rawResultsData: [
          ...prev.rawResultsData,
          ...cachedResults.filter(
            (d) =>
              !prev.rawResultsData.some(
                (existing) =>
                  existing.site === d.site &&
                  existing.gene_symbol === d.gene_symbol &&
                  existing.normalizationMethod === d.normalizationMethod
              )
          ),
        ],
        resultsData: [
          ...prev.rawResultsData,
          ...cachedResults.filter(
            (d) =>
              !prev.rawResultsData.some(
                (existing) =>
                  existing.site === d.site &&
                  existing.gene_symbol === d.gene_symbol &&
                  existing.normalizationMethod === d.normalizationMethod
              )
          ),
        ].filter(
          (d) =>
            filterState.selectedSites.includes(d.site) &&
            filterState.selectedGenes.includes(d.gene_symbol) &&
            d.normalizationMethod === filterState.normalizationMethod
        ),
        siteSampleCounts: [
          ...prev.siteSampleCounts,
          ...sitesToFetch
            .map((site) => ({
              site,
              tumor: cachedResults.find((d) => d.site === site)?.tumorSamples || 0,
              normal: cachedResults.find((d) => d.site === site)?.normalSamples || 0,
            }))
            .filter((c) => !prev.siteSampleCounts.some((existing) => existing.site === c.site)),
        ],
        totalTumorSamples: prev.totalTumorSamples + cachedResults
          .filter((d) => filterState.selectedSites.includes(d.site))
          .reduce((sum, d) => sum + d.tumorSamples, 0),
        totalNormalSamples: prev.totalNormalSamples + cachedResults
          .filter((d) => filterState.selectedSites.includes(d.site))
          .reduce((sum, d) => sum + d.normalSamples, 0),
        fetchedSites: [...new Set([...prev.fetchedSites, ...sitesToFetch])],
        error: null,
        isLoading: false,
      }));
      if (cachedResults.some((d) => d.normalizationMethod === filterState.normalizationMethod)) {
        return;
      }
    }

    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      const { data: siteRows, error: siteRowsErr } = await supabase
        .from("Sites")
        .select("id, name")
        .in("name", sitesToFetch);
      if (siteRowsErr) throw new Error(`Failed to fetch cancer sites: ${siteRowsErr.message}`);
      if (!siteRows?.length) throw new Error(`Cancer sites not found: ${sitesToFetch.join(", ")}`);

      const siteNameMap = new Map(siteRows.map((row) => [row.name.toLowerCase(), row.name]));
      const cancerSiteIds = siteRows.map((row) => row.id);
      const { data: cancerTypeRows, error: cancerTypeErr } = params.cancerTypes.length > 0
        ? await supabase.from("cancer_types").select("id, tcga_code, site_id").in("tcga_code", params.cancerTypes)
        : await supabase.from("cancer_types").select("id, tcga_code, site_id").in("site_id", cancerSiteIds);
      if (cancerTypeErr) throw new Error(`Failed to fetch cancer types: ${cancerTypeErr.message}`);

      const cancerTypeIds = cancerTypeRows.map((row) => row.id);
      const { data: geneData, error: geneError } = await supabase
        .from("genes")
        .select("id, ensembl_id, gene_symbol")
        .in("gene_symbol", cleanedGeneSymbols);
      if (geneError) throw new Error(`Failed to fetch genes: ${geneError.message}`);
      if (!geneData?.length) throw new Error(`No genes found for: ${cleanedGeneSymbols.join(", ")}`);

      const geneMap = Object.fromEntries(geneData.map((g) => [g.ensembl_id, g.gene_symbol]));
      const geneIds = geneData.map((g) => g.id);
      const geneEnsemblIds = geneData.map((g) => g.ensembl_id);

      const { data: samplesData, error: samplesError } = await supabase
        .from("samples")
        .select("id, sample_barcode, sample_type, cancer_type_id")
        .in("cancer_type_id", cancerTypeIds);
      if (samplesError) throw new Error(`Failed to fetch samples: ${samplesError.message}`);

      const sampleCountsBySite: { [site: string]: { tumor: number; normal: number } } = {};
      sitesToFetch.forEach((site) => { sampleCountsBySite[site] = { tumor: 0, normal: 0 }; });
      samplesData.forEach((sample) => {
        const cancerType = cancerTypeRows.find((ct) => ct.id === sample.cancer_type_id);
        if (cancerType) {
          const site = siteRows.find((s) => s.id === cancerType.site_id)?.name;
          if (site && sampleCountsBySite[site]) {
            if (sample.sample_type?.toLowerCase() === "tumor") sampleCountsBySite[site].tumor += 1;
            else if (sample.sample_type?.toLowerCase() === "normal") sampleCountsBySite[site].normal += 1;
          }
        }
      });

      const newTumorSamples = Object.values(sampleCountsBySite).reduce((sum, counts) => sum + counts.tumor, 0);
      const newNormalSamples = Object.values(sampleCountsBySite).reduce((sum, counts) => sum + counts.normal, 0);

      const queryParams = new URLSearchParams();
      // sitesToFetch.forEach((site) => queryParams.append("cancer", site));
      sitesToFetch.forEach((site) => queryParams.append("cancer", apiSiteKeyMap[site.toLowerCase()] || site));
      filterState.selectedNoiseMetrics.forEach((metric) =>
        queryParams.append("metric", metric.toLowerCase().replace("²", "_squared").replace("differential noise", "logfc").replace("standard deviation", "std"))
      );
      queryParams.append("gene_ensembl_id", geneEnsemblIds.join(","));

      const response = await fetch(`http://localhost:5001/api/gene_noise?${queryParams}`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to fetch gene noise data: ${errorText}`);
      }

      const apiData = await response.json();

      const processedData: GeneStats[] = [];
      for (const ensembl_id of geneEnsemblIds) {
        const gene_symbol = geneMap[ensembl_id] || ensembl_id;

        for (const site of sitesToFetch) {
          const siteRow = siteRows.find((s) => s.name.toLowerCase() === site.toLowerCase());
          if (!siteRow) continue;

          const apiSiteKey = apiSiteKeyMap[site.toLowerCase()] || site.toLowerCase();
          // const apiSiteKey = cancerMapping[site.toLowerCase()] || site.toLowerCase();
          const displaySiteName = reverseCancerMapping[apiSiteKey] || siteRow.name;

          normalizationMethods.forEach(async (norm) => {
            const geneData = apiData[norm]?.[ensembl_id]?.[apiSiteKey] || {};
            const data: any = {};
            let warning: string | undefined = undefined;
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

            Object.keys(noiseMetrics).forEach((metric) => {
              const metricKey = noiseMetrics[metric];
              const tumorValue = geneData[`${metricKey}_tumor`] ?? undefined;
              const normalValue = geneData[`${metricKey}_normal`] ?? undefined;
              data[`${metricKey}_tumor_${norm}`] = tumorValue;
              data[`${metricKey}_normal_${norm}`] = normalValue;
              if (metricKey === "logfc") {
                data[`logfc_${norm}`] = geneData[`logfc`] ?? undefined;
              }
              if (tumorValue !== undefined && filterState.selectedNoiseMetrics.includes(metric)) {
                tumorValues.push(tumorValue);
              }
              if (normalValue !== undefined && filterState.selectedNoiseMetrics.includes(metric) && metricKey !== "logfc") {
                normalValues.push(normalValue);
              }
            });

            if (apiData.warning && norm === filterState.normalizationMethod) {
              warning = apiData.warning;
            }

            const geneStat: GeneStats = {
              gene: `${gene_symbol} (${ensembl_id})`,
              ensembl_id,
              gene_symbol,
              tumorValues: tumorValues.length > 0 ? tumorValues : undefined,
              normalValues: normalValues.length > 0 ? normalValues : undefined,
              cv_tumor: data[`cv_tumor_${norm}`] ?? undefined,
              mean_tumor: data[`mean_tumor_${norm}`] ?? undefined,
              std_tumor: data[`std_tumor_${norm}`] ?? undefined,
              mad_tumor: data[`mad_tumor_${norm}`] ?? undefined,
              cv_squared_tumor: data[`cv_squared_tumor_${norm}`] ?? undefined,
              cv_normal: data[`cv_normal_${norm}`] ?? undefined,
              mean_normal: data[`mean_normal_${norm}`] ?? undefined,
              std_normal: data[`std_normal_${norm}`] ?? undefined,
              mad_normal: data[`mad_normal_${norm}`] ?? undefined,
              cv_squared_normal: data[`cv_squared_normal_${norm}`] ?? undefined,
              tumorSamples: sampleCountsBySite[site]?.tumor || 0,
              normalSamples: sampleCountsBySite[site]?.normal || 0,
              logfc: data[`logfc_${norm}`] ?? undefined,
              warning,
              site: siteRow.name,
              normalizationMethod: norm,
              ...data,
            };

            processedData.push(geneStat);

            // Upsert to Supabase
            try {
              const upsertResult = await upsertGeneData(
                [geneStat],
                geneData,
                siteRows,
                cancerTypeRows,
                filterState.selectedGroups,
                norm
              );
              if (!upsertResult.success) {
                console.error(`Failed to upsert data for ${norm}:`, upsertResult.error);
              }
            } catch (upsertError) {
              console.error(`Upsert failed for ${norm}:`, upsertError);
            }

            // Cache the data
            try {
              const cacheKey = generateCacheKey({
                cleanedGeneSymbols,
                cancerSites: sitesToFetch,
                cancerTypes: params.cancerTypes,
                normalizationMethod: norm,
                selectedNoiseMetrics: filterState.selectedNoiseMetrics,
              });
              setCachedData(cacheKey, {
                resultsData: [geneStat],
                totalTumorSamples: sampleCountsBySite[site]?.tumor || 0,
                totalNormalSamples: sampleCountsBySite[site]?.normal || 0,
              });
            } catch (cacheError) {
              console.warn(`Failed to cache data for ${norm}:`, cacheError);
            }
          });
        }
      }

      setState((prev) => ({
        ...prev,
        rawResultsData: [
          ...prev.rawResultsData,
          ...processedData.filter(
            (d) =>
              !prev.rawResultsData.some(
                (existing) =>
                  existing.site === d.site &&
                  existing.gene_symbol === d.gene_symbol &&
                  existing.normalizationMethod === d.normalizationMethod
              )
          ),
        ],
        resultsData: [
          ...prev.rawResultsData,
          ...processedData,
        ].filter(
          (d) =>
            filterState.selectedSites.includes(d.site) &&
            filterState.selectedGenes.includes(d.gene_symbol) &&
            d.normalizationMethod === filterState.normalizationMethod
        ),
        siteSampleCounts: [
          ...prev.siteSampleCounts,
          ...Object.entries(sampleCountsBySite)
            .map(([site, counts]) => ({ site, tumor: counts.tumor, normal: counts.normal }))
            .filter((c) => !prev.siteSampleCounts.some((existing) => existing.site === c.site)),
        ],
        totalTumorSamples: prev.totalTumorSamples + newTumorSamples,
        totalNormalSamples: prev.totalNormalSamples + newNormalSamples,
        fetchedSites: [...new Set([...prev.fetchedSites, ...sitesToFetch])],
        error: null,
        isLoading: false,
      }));
    } catch (error: any) {
      setState((prev) => ({ ...prev, error: error.message || "An error occurred while fetching data.", isLoading: false }));
    }
  }, [params, getCachedData, setCachedData, generateCacheKey, filterState.selectedNoiseMetrics, filterState.selectedGroups]);

  const debouncedFetchData = useCallback((sitesToFetch: string[], normalizationMethods: string[] = ["tpm", "fpkm", "fpkm_uq"]) => {
    if (filterTimeoutRef.current) {
      clearTimeout(filterTimeoutRef.current);
    }
    filterTimeoutRef.current = setTimeout(() => {
      fetchData(sitesToFetch, normalizationMethods);
    }, 500);
  }, [fetchData]);

  return { ...state, fetchData: debouncedFetchData };
};

const GeneResults: React.FC = () => {
  const [searchParams] = useSearchParams();
  const params = useMemo(() => ({
    cancerSites: searchParams.get("sites")?.split(",").filter(Boolean) || [],
    cancerTypes: searchParams.get("cancerTypes")?.split(",").filter(Boolean) || [],
    genes: searchParams.get("genes")?.split(",").filter(Boolean) || [],
    analysisType: searchParams.get("analysisType") || "cancer-specific",
  }), [searchParams]);

  const [filterState, dispatch] = useReducer(filterReducer, {
    ...initialFilterState,
    selectedGenes: params.genes,
    selectedSites: params.cancerSites,
  });

  const { resultsData, isLoading, error, totalTumorSamples, totalNormalSamples, siteSampleCounts, availableSites, fetchData, fetchedSites } = useGeneResultsData(params, filterState);

  useEffect(() => {
    const newSites = filterState.selectedSites.filter((site) => !fetchedSites.includes(site));
    if (newSites.length > 0 && params.genes.length > 0) {
      fetchData(newSites, ["tpm", "fpkm", "fpkm_uq"]);
    }
  }, [filterState.selectedSites, params.genes, fetchData, fetchedSites]);

  const updateFilters = useCallback((updates: Partial<FilterState>) => {
    if (updates.selectedGroups) dispatch({ type: "SET_GROUPS", payload: updates.selectedGroups });
    if (updates.selectedGenes) dispatch({ type: "SET_GENES", payload: updates.selectedGenes });
    if (updates.selectedSites) dispatch({ type: "SET_SITES", payload: updates.selectedSites });
    if (updates.normalizationMethod) dispatch({ type: "SET_NORMALIZATION", payload: updates.normalizationMethod });
    if (updates.selectedNoiseMetrics) dispatch({ type: "SET_NOISE_METRICS", payload: updates.selectedNoiseMetrics });
    if (updates.visiblePlots) dispatch({ type: "SET_VISIBLE_PLOTS", payload: updates.visiblePlots });
  }, []);

  const handleFilterChange = useCallback((filterId: string, value: any) => {
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
    // Filter data to include only the selected normalization method
    const data = resultsData.filter((d) => d.normalizationMethod === filterState.normalizationMethod);
    let content = "";
    let filename = `gene_analysis_${filterState.normalizationMethod}_${Date.now()}.csv`;

    if (format === "csv") {
      const excludedKeys = ["tumorValues", "normalValues", "normalizationMethod"];
      const keys = ["site", "gene_symbol", "ensembl_id", "cv_tumor", "mean_tumor", "std_tumor", "mad_tumor", "cv_squared_tumor", "cv_normal", "mean_normal", "std_normal", "mad_normal", "cv_squared_normal", "logfc", "tumorSamples", "normalSamples"];
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
  }, [resultsData, filterState.selectedSites, filterState.normalizationMethod]);

  const metricFormulas = useMemo(() => ({
    CV: "CV = (σ / µ)",
    "Standard Deviation": "μ",
    MAD: "Median Absolute Deviation",
    "CV²": "CV² = (σ / µ)²",
    "Differential Noise": "Differential Noise = log2(CV_tumor / CV_normal)",
  }), []);

  const customFilters = useMemo(() => {
  const filters = [
    {
      title: params.analysisType === "cancer-specific" ? "Genes" : "Sites",
      id: params.analysisType === "cancer-specific" ? "genes" : "sites",
      type: "checkbox" as const,
      options: params.analysisType === "cancer-specific"
        ? params.genes.map((gene) => ({ id: gene, label: gene }))
        : availableSites.map((site) => ({ id: site.name, label: site.name })),
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
    // {
    //   title: "Analysis Plots",
    //   id: "analysisPlots",
    //   type: "checkbox" as const,
    //   options: [{ id: "stdBox", label: "Standard Deviation Box Plot" }],
    //   isMasterCheckbox: true,
    //   defaultOpen: false,
    // },
  ];

  // Include the Genes filter only if analysisType is not cancer-specific and there are multiple genes
  if (params.analysisType !== "cancer-specific" && params.genes.length > 1) {
    filters.splice(1, 0, {
      title: "Genes",
      id: "genes",
      type: "checkbox" as const,
      options: params.genes.map((gene) => ({ id: gene, label: gene })),
      isMasterCheckbox: true,
      defaultOpen: false,
    });
  }

  return filters;
}, [availableSites, params.genes, params.analysisType, metricFormulas]);

  const warnings = useMemo(() => {
    return [...new Set(resultsData.map((d) => d.warning).filter(Boolean))] as string[];
  }, [resultsData]);

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
                // analysisPlots: Object.keys(filterState.visiblePlots).filter((key) => filterState.visiblePlots[key]),
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
                <div className="text-center text-red-600">No data available for the selected sites and genes.</div>
              ) : (
                <>
                  <Link
                    to="/gene-analysis"
                    className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-4 transition-colors"
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Gene Analysis
                  </Link>
                  {/* <div className="mb-8">
                    <h2 className="text-4xl font-bold text-blue-900 mb-2">
                      Results 
                    </h2>
                    <div className="flex items-center justify-between mb-4">
                      <p className="text-blue-700 text-lg">
                        Analysis Type: <strong>{params.analysisType === "pan-cancer" ? "Pan-Cancer" : "Cancer-Specific"}</strong>,
                        Normalization: <strong>log2({filterState.normalizationMethod.toUpperCase()} + 1)</strong>,
                        Genes: {filterState.selectedGenes.map((gene) => (
                          <Badge key={gene} variant="secondary" className="text-blue-700 text-lg">{gene}</Badge>
                        ))}
                        Cancer Site(s): <strong>{filterState.selectedSites.join(", ")}
                      {params.cancerTypes.length > 0 && `(${params.cancerTypes.join(", ")})`}</strong>
                      </p> */}
                      {/* <div className="mb-8">
                      <h2 className="text-4xl font-bold text-blue-900 mb-4">Results For Gene Analysis</h2>
                      <div className="flex items-center justify-between mb-4">
                        <div className="text-blue-700 text-lg space-y-1">
                          <div>
                            <strong>Analysis Type:</strong>{" "}
                            {params.analysisType === "pan-cancer" ? "Pan-Cancer" : "Cancer-Specific"}
                          </div>
                          <div>
                            <strong>Normalization:</strong>{" "}
                            log2({filterState.normalizationMethod.toUpperCase()} + 1)
                          </div>
                          <div>
                          <strong>Genes:{" "}</strong>
                            {filterState.selectedGenes.join(", ")}
                        </div>
                          <div>
                            <strong>Cancer Site(s):</strong>{" "}
                            {filterState.selectedSites.join(", ")}
                            {params.cancerTypes.length > 0 && ` (${params.cancerTypes.join(", ")})`}
                          </div>
                        </div> */}
                            {/* <div className="p-6">
                        <h2 className="text-4xl font-bold text-blue-900 mb-6">Results For Gene Analysis</h2> */}
                         <div className="mb-8">
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="text-4xl font-bold text-blue-900">Results For Gene Analysis</h2>
                      <Button onClick={() => downloadData("csv")} variant="outline" size="sm">
                        <Download className="h-4 w-4 mr-2" /> Download CSV
                      </Button>
                    </div>
                        
                        <div className="overflow-x-auto mb-6">
                          <table className="min-w-full bg-white border border-gray-200 rounded-lg shadow-sm">
                            <tbody>
                              <tr className="border-b">
                                <th className="text-left py-3 px-4 text-blue-700 font-semibold w-1/3">Analysis Type</th>
                                <td className="py-3 px-4 text-blue-700">
                                  {params.analysisType === "pan-cancer" ? "Pan-Cancer" : "Cancer-Specific"}
                                </td>
                              </tr>
                              <tr className="border-b">
                                <th className="text-left py-3 px-4 text-blue-700 font-semibold w-1/3">Normalization</th>
                                <td className="py-3 px-4 text-blue-700">
                                  log2({filterState.normalizationMethod.toUpperCase()} + 1)
                                </td>
                              </tr>
                              <tr className="border-b">
                                <th className="text-left py-3 px-4 text-blue-700 font-semibold w-1/3">Genes</th>
                                <td className="py-3 px-4 text-blue-700">
                                  {filterState.selectedGenes.join(", ")}
                                </td>
                              </tr>
                              <tr>
                                <th className="text-left py-3 px-4 text-blue-700 font-semibold w-1/3">Cancer Site(s)</th>
                                <td className="py-3 px-4 text-blue-700">
                                  {filterState.selectedSites.join(", ")}
                                  {params.cancerTypes.length > 0 && ` (${params.cancerTypes.join(", ")})`}
                                </td>
                              </tr>
                            </tbody>
                          </table>
                        {/* </div> */}
                      {/* </div> */}
                      {/* <Button onClick={() => downloadData("csv")} variant="outline" size="sm">
                        <Download className="h-4 w-4 mr-2" /> Download CSV
                      </Button> */}
                    </div>
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
                      data={resultsData}
                      selectedGroups={filterState.selectedGroups}
                      selectedNoiseMetrics={filterState.selectedNoiseMetrics}
                      visiblePlots={filterState.visiblePlots}
                      metricOpenState={filterState.metricOpenState}
                      toggleMetricSection={(metric) => dispatch({ type: "TOGGLE_METRIC_SECTION", payload: metric })}
                      normalizationMethod={filterState.normalizationMethod}
                      analysisType={params.analysisType}
                      genes={params.genes}
                      selectedSites={filterState.selectedSites}
                    />
                    {params.analysisType === "Cancer-Specific" && (
  <AnalysisPlots
    isOpen={filterState.isAnalysisPlotsOpen}
    toggleOpen={() => dispatch({ type: "TOGGLE_ANALYSIS_PLOTS" })}
    data={resultsData}
    selectedSites={filterState.selectedSites}
    selectedGroups={filterState.selectedGroups}
    visiblePlots={filterState.visiblePlots}
    analysisType={params.analysisType}
  />
)}
                   
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