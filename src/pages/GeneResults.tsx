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
import {
  ResponsiveContainer,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ComposedChart,
  Bar,
  Line,
  Area,
  Legend,
} from "recharts";
import Plot from "react-plotly.js";
import Header from "@/components/header";
import Footer from "@/components/footer";

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
  const [isAnalysisPlotsOpen, setIsAnalysisPlotsOpen] = useState(true);
  const [isStatisticalMetricsOpen, setIsStatisticalMetricsOpen] = useState(true);
  const [isGenesOpen, setIsGenesOpen] = useState(true);
  const [metricOpenState, setMetricOpenState] = useState({
    cv: true,
    mean_std: true,
    mad: true,
    cv_squared: true,
    logFC: true,
  });
  const [normalizationMethod, setNormalizationMethod] = useState("tpm");
  const [selectedNoiseMetrics, setSelectedNoiseMetrics] = useState(["CV", "Mean+S.D", "MAD", "CV²"]);
  const [resultsData, setResultsData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isHeatmapLoading, setIsHeatmapLoading] = useState(false);
  const [error, setError] = useState(null);
  const chartRefs = useRef({});
  const [totalTumorSamples, setTotalTumorSamples] = useState(0);
  const [totalNormalSamples, setTotalNormalSamples] = useState(0);
  const dataCache = useRef({}); // Cache for API responses

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
    "Mean+S.D": "mean_std",
    MAD: "mad",
    "CV²": "cv_squared",
    logFC: "logFC",
  };

  useEffect(() => {
    let isMounted = true;
    const fetchData = async () => {
      const cacheKey = JSON.stringify({
        cleanedGeneSymbols,
        cancerSite: params.cancerSite,
        cancerTypes: params.cancerTypes,
        normalizationMethod,
        selectedNoiseMetrics,
      });

      // Check cache
      if (dataCache.current[cacheKey]) {
        console.log("Cache hit for key:", cacheKey);
        if (isMounted) {
          setResultsData(dataCache.current[cacheKey].resultsData);
          setTotalTumorSamples(dataCache.current[cacheKey].totalTumorSamples);
          setTotalNormalSamples(dataCache.current[cacheKey].totalNormalSamples);
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

        setTotalTumorSamples(tumorSamples.length);
        setTotalNormalSamples(normalSamples.length);

        const hasAllParams = params.cancerSite && selectedNoiseMetrics?.length > 0;

        if (!hasAllParams) {
          console.warn("Missing one or more required parameters — API not called.");
          return;
        }

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

        const response = await fetch(`http://localhost:5001/api/gene_noise?${queryParams}`, {
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

        const processedData = gene_ensembl_ids.map((ensembl_id) => {
          const gene_symbol = geneMap[ensembl_id] || ensembl_id;
          const geneData = apiData[normalizationMethod]?.[ensembl_id] || {};
          const tumorValues = geneData[`${noiseMetrics["CV"]}_tumor`] ? [geneData[`${noiseMetrics["CV"]}_tumor`]] : [];
          const normalValues = geneData[`${noiseMetrics["CV"]}_normal`] ? [geneData[`${noiseMetrics["CV"]}_normal`]] : [];

          // Use mean and std directly from API if available
          const tumorMean = geneData[`mean_tumor`] || 0;
          const normalMean = geneData[`mean_normal`] || 0;
          const tumorStd = geneData[`std_tumor`] || 0;
          const normalStd = geneData[`std_normal`] || 0;
          const logFC = tumorMean && normalMean ? Math.log2(tumorMean / normalMean) : 0;

          return {
            gene: `${gene_symbol} (${ensembl_id})`,
            ensembl_id,
            gene_symbol,
            tumorValues,
            normalValues,
            cv_tumor: geneData[`${noiseMetrics["CV"]}_tumor`] || 0,
            mean_tumor: tumorMean,
            std_tumor: tumorStd,
            mean_std_tumor: geneData[`${noiseMetrics["Mean+S.D"]}_tumor`] || 0,
            mad_tumor: geneData[`${noiseMetrics["MAD"]}_tumor`] || 0,
            cv_squared_tumor: geneData[`${noiseMetrics["CV²"]}_tumor`] || 0,
            cv_normal: geneData[`${noiseMetrics["CV"]}_normal`] || 0,
            mean_normal: normalMean,
            std_normal: normalStd,
            mean_std_normal: geneData[`${noiseMetrics["Mean+S.D"]}_normal`] || 0,
            mad_normal: geneData[`${noiseMetrics["MAD"]}_normal`] || 0,
            cv_squared_normal: geneData[`${noiseMetrics["CV²"]}_normal`] || 0,
            tumorSamples: tumorValues.length,
            normalSamples: normalValues.length,
            logFC: selectedNoiseMetrics.includes("logFC") ? logFC : 0,
          };
        });

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
          dataCache.current[cacheKey] = {
            resultsData: processedData,
            totalTumorSamples: tumorSamples.length,
            totalNormalSamples: normalSamples.length,
          };
          setError(null);
        }
      } catch (error) {
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
    };
  }, [cleanedGeneSymbols, params.cancerSite, params.cancerTypes, normalizationMethod, selectedNoiseMetrics]);

  const toggleGroup = useCallback((group) => {
    setSelectedGroups((prev) =>
      prev.includes(group) ? prev.filter((g) => g !== group) : [...prev, group]
    );
  }, []);

  const handleGeneToggle = useCallback((gene) => {
    setSelectedGenes((prev) =>
      prev.includes(gene) ? prev.filter((g) => g !== gene) : [...prev, gene]
    );
  }, []);

  const toggleAllGenes = useCallback((checked) => {
    setSelectedGenes(checked ? params.genes : []);
  }, [params.genes]);

  const handleNoiseMetricToggle = useCallback((metric) => {
    setSelectedNoiseMetrics((prev) =>
      prev.includes(metric) ? prev.filter((m) => m !== metric) : [...prev, metric]
    );
  }, []);

  const toggleMetricSection = useCallback((metric) => {
    setMetricOpenState((prev) => ({
      ...prev,
      [metric]: !prev[metric],
    }));
  }, []);

  const getFilteredResults = useCallback(() => {
    return resultsData
      .filter((gene) => selectedGenes.includes(gene.gene_symbol))
      .map((gene) => {
        const filteredGene = {
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
            filteredGene["cv_tumor"] = gene.cv_tumor;
            filteredGene["mean_std_tumor"] = gene.mean_std_tumor;
            filteredGene["mad_tumor"] = gene.mad_tumor;
            filteredGene["cv_squared_tumor"] = gene.cv_squared_tumor;
          } else if (group === "normal") {
            filteredGene["cv_normal"] = gene.cv_normal;
            filteredGene["mean_std_normal"] = gene.mean_std_normal;
            filteredGene["mad_normal"] = gene.mad_normal;
            filteredGene["cv_squared_normal"] = gene.cv_squared_normal;
          }
          if (selectedGroups.includes("tumor") && selectedGroups.includes("normal")) {
            if (selectedNoiseMetrics.includes("logFC")) {
              filteredGene["logFC"] = gene.logFC;
            }
          }
        });
        return filteredGene;
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

  const toggleAllNoiseMetrics = useCallback((checked) => {
    setSelectedNoiseMetrics(checked ? allNoiseMetrics : []);
  }, [allNoiseMetrics]);

  const areAllGenesSelected = useMemo(
    () => params.genes.every((gene) => selectedGenes.includes(gene)),
    [selectedGenes, params.genes]
  );

  // const allPlotKeys = ["logDist", "exprTrend", "meanStdBox"];
  const allPlotKeys = ["logDist", "exprTrend"];
  const [visiblePlots, setVisiblePlots] = useState({
    cv: true,
    mean_std: true,
    mad: true,
    cv_squared: true,
    logFC: true,
    logDist: false,
    exprTrend: false,
    meanStdBox: true,
  });
  const areAllPlotsSelected = useMemo(
    () => allPlotKeys.every((plot) => visiblePlots[plot]),
    [visiblePlots]
  );

  const toggleAllPlots = useCallback((checked) => {
    setVisiblePlots((prev) => ({
      ...prev,
      ...Object.fromEntries(allPlotKeys.map((plot) => [plot, checked])),
    }));
  }, []);

  const handlePlotToggle = useCallback((plotKey) => {
    setVisiblePlots((prev) => ({
      ...prev,
      [plotKey]: !prev[plotKey],
    }));
  }, []);

  const downloadChart = useCallback((chartKey, chartName) => {
    const chartElement = chartRefs.current[chartKey];
    if (chartElement) {
      const svg = chartElement.querySelector("svg");
      if (svg) {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        const img = new Image();

        const svgData = new XMLSerializer().serializeToString(svg);
        const svgBlob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
        const url = URL.createObjectURL(svgBlob);

        img.onload = function () {
          canvas.width = img.width || 800;
          canvas.height = img.height || 400;
          ctx?.drawImage(img, 0, 0);

          canvas.toBlob((blob) => {
            if (blob) {
              const link = document.createElement("a");
              link.download = `${chartName.replace(/\s+/g, "_").toLowerCase()}_${Date.now()}.png`;
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
  }, []);

  const downloadData = useCallback(
    (format) => {
      const data = filteredData;
      let content = "";
      let filename = `gene_analysis_${params.cancerTypes}_${Date.now()}`;

      if (format === "csv") {
        const excludedKeys = ["tumorValues", "normalValues"];
        const keys = Object.keys(data[0] || {}).filter((key) => !excludedKeys.includes(key));

        const headers = keys.join(",");
        const rows = data.map((row) => keys.map((key) => row[key]).join(","));

        content = [headers, ...rows].join("\n");
        filename += ".csv";
      }

      const blob = new Blob([content], { type: format === "csv" ? "text/csv" : "application/json" });
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
    const metrics = [];
    const metricLabels = [];

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

    const dataMatrix = metrics.map((metric) =>
      filteredData.map((gene) => gene[metric] || 0)
    );

    const calculateCorrelation = (x, y) => {
      if (x.length < 2) return 0;
      const n = x.length;
      const meanX = x.reduce((sum, val) => sum + val, 0) / n;
      const meanY = y.reduce((sum, val) => sum + val, 0) / n;
      const covariance = x.reduce((sum, val, i) => sum + (val - meanX) * (y[i] - meanY), 0) / n;
      const stdX = Math.sqrt(x.reduce((sum, val) => sum + Math.pow(val - meanX, 2), 0) / n);
      const stdY = Math.sqrt(y.reduce((sum, val) => sum + Math.pow(val - meanY, 2), 0) / n);
      return stdX * stdY === 0 ? 0 : covariance / (stdX * stdY);
    };

    const z = metrics.map((_, i) =>
      metrics.map((_, j) => calculateCorrelation(dataMatrix[i], dataMatrix[j]))
    );

    setIsHeatmapLoading(false);
    return { z, x: metricLabels, y: metricLabels, error: null };
  }, [filteredData, selectedNoiseMetrics, selectedGroups]);

  const logDistData = useMemo(() => {
    return resultsData
      .filter((gene) => selectedGenes.includes(gene.gene_symbol))
      .map((gene) => {
        const entry = { gene: gene.gene, gene_symbol: gene.gene_symbol };
        if (selectedGroups.includes("tumor")) {
          entry["tumorLogMean"] = gene.mean_tumor ? Math.log2(gene.mean_tumor + 1) : 0;
        }
        if (selectedGroups.includes("normal")) {
          entry["normalLogMean"] = gene.mean_normal ? Math.log2(gene.mean_normal + 1) : 0;
        }
        return entry;
      });
  }, [resultsData, selectedGroups, selectedGenes]);

  const exprTrendData = useMemo(() => {
    return resultsData
      .filter((gene) => selectedGenes.includes(gene.gene_symbol))
      .map((gene) => {
        const entry = { gene: gene.gene, gene_symbol: gene.gene_symbol };
        if (selectedGroups.includes("tumor")) entry["tumorMedian"] = gene.median_tumor || 0;
        if (selectedGroups.includes("normal")) entry["normalMedian"] = gene.median_normal || 0;
        return entry;
      });
  }, [resultsData, selectedGroups, selectedGenes]);

  const MetricChartComponent = React.memo(({ data, metric, title }: any) => {
    const renderCount = useRef(0);
    useEffect(() => {
      console.log(`MetricChartComponent ${metric} rendered ${++renderCount.current} times`);
    });

    return (
      <Card className="border-0 shadow-lg">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center justify-between text-sm">
            <div className="flex items-center space-x-2">
              <Box className="h-4 w-4" />
              <span>{title}</span>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => downloadChart(`barplot-${metric}`, title)}
              className="h-6 px-2 text-xs"
            >
              <Download className="h-3 w-3" />
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div ref={(el) => (chartRefs.current[`barplot-${metric}`] = el)} className="chart-container">
            <ResponsiveContainer width="100%" height={250}>
              <ComposedChart data={data} margin={{ top: 20, right: 20, left: 5, bottom: 40 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="gene_symbol"
                  tick={(props) => {
                    const { x, y, payload } = props;
                    return (
                      <text
                        x={x}
                        y={y}
                        dy={10}
                        transform={`rotate(-45, ${x}, ${y})`}
                        textAnchor="end"
                        fontSize={10}
                        fill="black"
                      >
                        {payload.value}
                      </text>
                    );
                  }}
                  label={{
                    value: "Genes",
                    position: "insideBottom",
                    offset: -30,
                    style: { fontSize: "12px", fontWeight: "bold", fill: "black" },
                  }}
                />
                <YAxis
                  tick={{ fontSize: 10 }}
                  label={{
                    value: title,
                    angle: -90,
                    position: "insideLeft",
                    dy: 55,
                    style: { fontSize: "12px", fontWeight: "bold", fill: "black" },
                  }}
                />
                <Tooltip
                  formatter={(value, name) => [
                    typeof value === "number" ? value.toFixed(2) : value,
                    name,
                  ]}
                />
                <Legend
                  align="right"
                  verticalAlign="top"
                  layout="vertical"
                  wrapperStyle={{ fontSize: "10px", paddingLeft: "10px" }}
                />
                {selectedGroups.includes("normal") && (
                  <Bar dataKey={`${metric}_normal`} fill="#10b981" name="Normal" />
                )}
                {selectedGroups.includes("tumor") && (
                  <Bar dataKey={`${metric}_tumor`} fill="#ef4444" name="Tumor" />
                )}
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    );
  });

  const LogFCChartComponent = React.memo(({ data, dataKey, color, title }: any) => {
    const renderCount = useRef(0);
    useEffect(() => {
      console.log(`LogFCChartComponent ${dataKey} rendered ${++renderCount.current} times`);
    });

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
              onClick={() => downloadChart(`barplot-${dataKey}`, title)}
              className="h-6 px-2 text-xs"
            >
              <Download className="h-3 w-3" />
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div ref={(el) => (chartRefs.current[`barplot-${dataKey}`] = el)} className="chart-container">
            <ResponsiveContainer width="100%" height={250}>
              <ComposedChart data={data} margin={{ top: 20, right: 20, left: 5, bottom: 40 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="gene_symbol"
                  tick={(props) => {
                    const { x, y, payload } = props;
                    return (
                      <text
                        x={x}
                        y={y}
                        dy={10}
                        transform={`rotate(-45, ${x}, ${y})`}
                        textAnchor="end"
                        fontSize={10}
                        fill="black"
                      >
                        {payload.value}
                      </text>
                    );
                  }}
                  label={{
                    value: "Genes",
                    position: "insideBottom",
                    offset: -30,
                    style: { fontSize: "12px", fontWeight: "bold", fill: "black" },
                  }}
                />
                <YAxis
                  tick={{ fontSize: 10 }}
                  label={{
                    value: title,
                    angle: -90,
                    position: "insideLeft",
                    dy: 55,
                    style: { fontSize: "12px", fontWeight: "bold", fill: "black" },
                  }}
                />
                <Tooltip
                  formatter={(value) => [
                    typeof value === "number" ? value.toFixed(2) : value,
                    title,
                  ]}
                />
                <Legend
                  align="right"
                  verticalAlign="top"
                  layout="vertical"
                  wrapperStyle={{ fontSize: "10px", paddingLeft: "10px" }}
                />
                <Bar dataKey={dataKey} fill={color} name="log2 Fold Change" />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    );
  });

  const AnalysisPlotComponent = React.memo(({ data, title, type }: any) => {
    const groupColors = {
      tumor: "#ef4444",
      normal: "#10b981",
    };

    const groupLabelMap = {
      tumor: "Tumor",
      normal: "Normal",
    };

    return (
      <Card className="border-0 shadow-lg">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center justify-between text-sm">
            <div className="flex items-center space-x-2">
              <Box className="h-4 w-4" />
              <span>{title}</span>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => downloadChart(`plot-${title.replace(/\s+/g, "_")}`, title)}
              className="h-6 px-2 text-xs"
            >
              <Download className="h-3 w-3" />
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div ref={(el) => (chartRefs.current[`plot-${title.replace(/\s+/g, "_")}`] = el)} className="chart-container">
            <ResponsiveContainer width="100%" height={200} debounce={100}>
              <ComposedChart data={data} margin={{ top: 20, right: 20, left: 5, bottom: 40 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="gene_symbol"
                  tick={(props) => {
                    const { x, y, payload } = props;
                    return (
                      <text
                        x={x}
                        y={y}
                        dy={10}
                        transform={`rotate(-45, ${x}, ${y})`}
                        textAnchor="end"
                        fontSize={10}
                        fill="black"
                      >
                        {payload.value}
                      </text>
                    );
                  }}
                  label={{
                    value: "Genes",
                    position: "insideBottom",
                    offset: -30,
                    style: { fontSize: "12px", fontWeight: "bold", fill: "black" },
                  }}
                />
                <YAxis
                  tick={{ fontSize: 10 }}
                  label={{
                    value: title,
                    angle: -90,
                    position: "insideLeft",
                    dy: 55,
                    style: { fontSize: "12px", fontWeight: "bold", fill: "black" },
                  }}
                />
                <Tooltip />
                <Legend
                  align="right"
                  verticalAlign="top"
                  layout="vertical"
                  wrapperStyle={{ fontSize: "10px", paddingLeft: "10px" }}
                />
                {selectedGroups.map((group) => {
                  const dataKey = title.includes("Log") ? `${group}LogMean` : `${group}Median`;
                  const color = groupColors[group];
                  const label = groupLabelMap[group];

                  if (type === "line") {
                    return <Line key={group} type="monotone" dataKey={dataKey} stroke={color} name={label} />;
                  } else if (type === "bar") {
                    return <Bar key={group} dataKey={dataKey} fill={color} name={label} />;
                  } else {
                    return <Area key={group} type="monotone" dataKey={dataKey} stroke={color} fill={color} name={label} />;
                  }
                })}
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    );
  });

  const MeanStdBoxPlotComponent = React.memo(({ data, title, selectedGroups }: any) => {
    const chartRef = useRef(null);

    const renderCount = useRef(0);
    useEffect(() => {
      console.log(`MeanStdBoxPlotComponent rendered ${++renderCount.current} times`);
      console.log("Input data for MeanStdBoxPlotComponent:", data);
    }, [data]);

    // Prepare Plotly box plot data using API-provided mean and std
    const plotData = data
      .filter((gene) => selectedGroups.length > 0 && gene.gene_symbol)
      .reduce((acc, gene) => {
        const traces = [];

        if (selectedGroups.includes("tumor")) {
          if (
            typeof gene.mean_tumor === "number" &&
            !isNaN(gene.mean_tumor) &&
            typeof gene.std_tumor === "number" &&
            !isNaN(gene.std_tumor)
          ) {
            traces.push({
              x: [gene.gene_symbol],
              y: [gene.mean_tumor],
              type: "box",
              name: `Tumor (${gene.gene_symbol})`,
              boxpoints: false,
              boxmean: true,
              whiskerwidth: 0,
              marker: { color: "#ef4444", size: 8 },
              line: { width: 0 },
              lowerfence: [Math.max(0, gene.mean_tumor - gene.std_tumor)],
              upperfence: [gene.mean_tumor + gene.std_tumor],
              q1: [gene.mean_tumor],
              q3: [gene.mean_tumor],
              median: [gene.mean_tumor],
            });
          } else {
            console.warn(`Invalid tumor data for gene ${gene.gene_symbol}:`, {
              mean_tumor: gene.mean_tumor,
              std_tumor: gene.std_tumor,
            });
          }
        }

        if (selectedGroups.includes("normal")) {
          if (
            typeof gene.mean_normal === "number" &&
            !isNaN(gene.mean_normal) &&
            typeof gene.std_normal === "number" &&
            !isNaN(gene.std_normal)
          ) {
            traces.push({
              x: [gene.gene_symbol],
              y: [gene.mean_normal],
              type: "box",
              name: `Normal (${gene.gene_symbol})`,
              boxpoints: false,
              boxmean: true,
              whiskerwidth: 0,
              marker: { color: "#10b981", size: 8 },
              line: { width: 0 },
              lowerfence: [Math.max(0, gene.mean_normal - gene.std_normal)],
              upperfence: [gene.mean_normal + gene.std_normal],
              q1: [gene.mean_normal],
              q3: [gene.mean_normal],
              median: [gene.mean_normal],
            });
          } else {
            console.warn(`Invalid normal data for gene ${gene.gene_symbol}:`, {
              mean_normal: gene.mean_normal,
              std_normal: gene.std_normal,
            });
          }
        }

        return [...acc, ...traces];
      }, []);

    useEffect(() => {
      console.log("Generated plotData:", plotData);
    }, [plotData]);

    const downloadChart = () => {
      const plotElement = chartRef.current;
      if (plotElement) {
        import("plotly.js-dist-min").then((Plotly) => {
          Plotly.downloadImage(plotElement, {
            format: "png",
            filename: `mean_std_boxplot_${Date.now()}`,
            width: 800,
            height: 600,
          });
        });
      }
    };

    if (plotData.length === 0) {
      return (
        <Card className="border-0 shadow-lg">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center justify-between text-sm">
              <div className="flex items-center space-x-2">
                <Box className="h-4 w-4" />
                <span>{title}</span>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0 text-center text-red-600">
            No valid data available for the Mean and Standard Deviation plot. Please check the selected genes and groups.
          </CardContent>
        </Card>
      );
    }

    const yValues = plotData.flatMap((trace) => [
      trace.lowerfence[0] || 0,
      trace.upperfence[0] || 0,
    ]);
    const yMin = Math.min(...yValues) * 0.9;
    const yMax = Math.max(...yValues) * 1.1;

    return (
      <Card className="border-0 shadow-lg">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center justify-between text-sm">
            <div className="flex items-center space-x-2">
              <Box className="h-4 w-4" />
              <span>{title}</span>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={downloadChart}
              className="h-6 px-2 text-xs"
            >
              <Download className="h-3 w-3" />
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div ref={chartRef} className="chart-container">
            <Plot
              data={plotData}
              layout={{
                title: { text: title, font: { size: 14 }, x: 0.5, xanchor: "center" },
                xaxis: {
                  title: { text: "Genes", font: { size: 12, weight: "bold" } },
                  tickangle: 45,
                  tickfont: { size: 10 },
                },
                yaxis: {
                  title: { text: "Expression Value", font: { size: 12, weight: "bold" } },
                  tickfont: { size: 10 },
                  range: [yMin, yMax],
                },
                showlegend: true,
                legend: {
                  x: 1,
                  xanchor: "right",
                  y: 1,
                  yanchor: "top",
                  font: { size: 10 },
                },
                margin: { t: 50, b: 100, l: 50, r: 50 },
                width: 600,
                height: 400,
              }}
              config={{ responsive: true }}
            />
          </div>
        </CardContent>
      </Card>
    );
  });

  const CorrelationHeatmapComponent = React.memo(({ data, title }: any) => {
    const renderCount = useRef(0);
    useEffect(() => {
      console.log(`CorrelationHeatmapComponent rendered ${++renderCount.current} times`);
    });

    const { z, x, y, error } = data;

    if (error) {
      return (
        <Card className="border-0 shadow-lg">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center justify-between text-sm">
              <div className="flex items-center space-x-2">
                <Box className="h-4 w-4" />
                <span>{title}</span>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0 text-center text-red-600">{error}</CardContent>
        </Card>
      );
    }

    if (isHeatmapLoading) {
      return (
        <Card className="border-0 shadow-lg">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center justify-between text-sm">
              <div className="flex items-center space-x-2">
                <Box className="h-4 w-4" />
                <span>{title}</span>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0 text-center text-blue-900">Loading heatmap...</CardContent>
        </Card>
      );
    }

    return (
      <Card className="border-0 shadow-lg">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center justify-between text-sm">
            <div className="flex items-center space-x-2">
              <Box className="h-4 w-4" />
              <span>{title}</span>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                const plotElement = chartRefs.current["plot-correlation_heatmap"];
                if (plotElement) {
                  import("plotly.js-dist-min").then((Plotly) => {
                    Plotly.downloadImage(plotElement, {
                      format: "png",
                      filename: `correlation_heatmap_${Date.now()}`,
                      width: 800,
                      height: 600,
                    });
                  });
                }
              }}
              className="h-6 px-2 text-xs"
            >
              <Download className="h-3 w-3" />
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div ref={(el) => (chartRefs.current["plot-correlation_heatmap"] = el)} className="chart-container">
            <Plot
              data={[
                {
                  z,
                  x,
                  y,
                  type: "heatmap",
                  colorscale: "RdBu",
                  showscale: true,
                  hovertemplate: "%{x} vs %{y}: %{z:.2f}<extra></extra>",
                  zmin: -1,
                  zmax: 1,
                },
              ]}
              layout={{
                title: { text: title, font: { size: 14 }, x: 0.5, xanchor: "center" },
                xaxis: {
                  tickangle: 45,
                  tickfont: { size: 10 },
                  title: { text: "Metrics", font: { size: 12, weight: "bold" } },
                },
                yaxis: {
                  tickfont: { size: 10 },
                  title: { text: "Metrics", font: { size: 12, weight: "bold" } },
                },
                margin: { t: 50, b: 100, l: 100, r: 50 },
                width: 600,
                height: 600,
              }}
              config={{ responsive: true }}
            />
          </div>
        </CardContent>
      </Card>
    );
  });

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
                  <div>
                    <h3 className="font-semibold text-blue-900 mb-3">Expression Normalization Method</h3>
                    <RadioGroup value={normalizationMethod} onValueChange={setNormalizationMethod}>
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
                              {plotKey === "logDist"
                                ? "Log Expression Distribution"
                                : plotKey === "exprTrend"
                                ? "Expression Trend"
                                : "Mean and Standard Deviation"}
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
                <div className="text-center text-blue-900">Loading charts...</div>
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
                              {geneData ? `${gene} - ${geneData.ensembl_id}` : gene}
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
                  {(visiblePlots.cv || visiblePlots.mean_std || visiblePlots.mad || visiblePlots.cv_squared || visiblePlots.logFC) && (
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
                          {["cv", "mean_std", "mad", "cv_squared", "logFC"].map((metric) => {
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
                                          <LogFCChartComponent
                                            data={filteredData}
                                            dataKey="logFC"
                                            color="#f59e0b"
                                            title="log2 Fold Change"
                                          />
                                        )
                                      ) : (
                                        <MetricChartComponent
                                          data={filteredData}
                                          metric={metric}
                                          title={displayMetric}
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
                  {(visiblePlots.logDist || visiblePlots.exprTrend || visiblePlots.meanStdBox) && (
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
                            <AnalysisPlotComponent
                              key="chart-logDist"
                              data={logDistData}
                              title="Log Expression Distribution"
                              type="area"
                            />
                          )}
                          {visiblePlots.exprTrend && (
                            <AnalysisPlotComponent
                              key="chart-exprTrend"
                              data={exprTrendData}
                              title="Expression Trend"
                              type="line"
                            />
                          )}
                          {/* {visiblePlots.meanStdBox && (
                            <MeanStdBoxPlotComponent
                              key="chart-meanStdBox"
                              data={filteredData}
                              title="Mean and Standard Deviation"
                              selectedGroups={selectedGroups}
                            />
                          )} */}
                        </div>
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

export default GeneResults;
