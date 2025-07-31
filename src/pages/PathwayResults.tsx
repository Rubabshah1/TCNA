import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useSearchParams, Link } from "react-router-dom";
import supabase from "@/supabase-client";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ArrowLeft, Download, Activity, Users, Info, X, ChevronDown, ChevronUp } from "lucide-react";
import { PlotlyHeatmap, PlotlyBarChart } from "@/components/charts/index";
import Header from "@/components/header";
import Footer from "@/components/footer";
import { GeneStats, Enrichment, ResultsData } from "@/hooks/types/pathway";
import { useCache } from "@/hooks/use-cache";
import { LoadingSpinner } from "@/components/ui/loadingSpinner";

// CollapsibleCard component with resize handling
const CollapsibleCard: React.FC<{
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
  className?: string;
  downloadButton?: React.ReactNode;
}> = ({ title, children, defaultOpen = true, className = "", downloadButton }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && contentRef.current) {
      // Trigger window resize to fix Plotly plot rendering
      window.dispatchEvent(new Event("resize"));
    }
  }, [isOpen]);

  return (
    <Card className={`border-0 shadow-lg ${className}`}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-blue-800">{title}</CardTitle>
        <div className="flex items-center space-x-2">
          {downloadButton}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsOpen(!isOpen)}
            className="text-blue-600 hover:text-blue-700"
          >
            {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </div>
      </CardHeader>
      {isOpen && (
        <CardContent ref={contentRef}>
          {children}
        </CardContent>
      )}
    </Card>
  );
};

const PathwayResults = () => {
  const [searchParams] = useSearchParams();
  const params = useMemo(
    () => ({
      cancerSite: searchParams.get("site") || "",
      cancerTypes: searchParams.get("cancerTypes")?.split(",").filter(Boolean) || [],
      genes: searchParams.get("genes")?.split(",").filter(Boolean) || [],
      method: searchParams.get("method") || "tpm",
      topN: parseInt(searchParams.get("top_n") || "15", 10),
      analysisType: searchParams.get("analysisType") || "ORA",
    }),
    [searchParams]
  );

  const [normalizationMethod, setNormalizationMethod] = useState(params.method);
  const [currentResults, setCurrentResults] = useState<ResultsData>({ enrichment: [], top_genes: [], gene_stats: [] });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalTumorSamples, setTotalTumorSamples] = useState(0);
  const [totalNormalSamples, setTotalNormalSamples] = useState(0);
  const [customGeneInput, setCustomGeneInput] = useState("");
  const [selectedPathway, setSelectedPathway] = useState<Enrichment | null>(null);
  const [showGeneInput, setShowGeneInput] = useState(params.analysisType === "ORA");

  const { getCachedData, setCachedData, generateCacheKey } = useCache<ResultsData>();

  const normalizationMethods = ["tpm", "fpkm", "fpkm_uq"];

  const sampleCountData = useMemo(
    () => [
      { type: "Tumor", count: totalTumorSamples, color: "#ef4444" },
      { type: "Normal", count: totalNormalSamples, color: "#3b82f6" },
    ],
    [totalTumorSamples, totalNormalSamples]
  );

  const formatPValue = (pValue: number) => {
    if (pValue < 0.001) return "***";
    if (pValue < 0.01) return "**";
    if (pValue < 0.05) return "*";
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
      // Clear cache for new gene list
      localStorage.clear();
      window.location.href = `/pathway-results?site=${params.cancerSite}&cancerTypes=${params.cancerTypes.join(
        ","
      )}&genes=${genes.join(",")}&method=${normalizationMethod}&top_n=${params.topN}&analysisType=ORA`;
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

  // Fetch sample counts separately without caching
  const fetchSampleCounts = useCallback(async (cancerSite: string, cancerTypes: string[]) => {
    try {
      const { data: siteRows, error: siteRowsErr } = await supabase
        .from("Sites")
        .select("id, name")
        .eq("name", cancerSite);

      if (siteRowsErr) throw new Error(`Failed to fetch cancer site: ${siteRowsErr.message}`);
      if (!siteRows?.length) throw new Error(`Cancer site not found: ${cancerSite}`);

      const cancerSiteId = siteRows[0].id;

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

      setTotalTumorSamples(tumorSamples.length);
      setTotalNormalSamples(normalSamples.length);

      return { tumorSamples, normalSamples };
    } catch (error: any) {
      console.error("Error fetching sample counts:", error);
      setError(error.message || "An error occurred while fetching sample counts.");
      return { tumorSamples: [], normalSamples: [] };
    }
  }, []);

  useEffect(() => {
    if (params.cancerSite) {
      fetchSampleCounts(params.cancerSite, params.cancerTypes);
    }
  }, [params.cancerSite, params.cancerTypes, fetchSampleCounts]);

  useEffect(() => {
    if (!normalizationMethods.includes(normalizationMethod)) {
      setNormalizationMethod("tpm");
    }

    const cacheKey = generateCacheKey({
      cancerSite: params.cancerSite,
      cancerTypes: params.cancerTypes,
      genes: params.genes,
      method: normalizationMethod,
      topN: params.topN,
      analysisType: params.analysisType,
    });

    const cachedResults = getCachedData(cacheKey);
    if (cachedResults) {
      setCurrentResults(cachedResults);
    } else {
      setCurrentResults({ enrichment: [], top_genes: [], gene_stats: [] });
    }
  }, [normalizationMethod, params, getCachedData, generateCacheKey]);

  useEffect(() => {
    let isMounted = true;

    const fetchData = async () => {
      if (!params.cancerSite) {
        if (isMounted) {
          setError("Please select a cancer site.");
          setIsLoading(false);
        }
        return;
      }

      // Check if all normalization methods are cached
      const cacheKeys = normalizationMethods.map((method) =>
        generateCacheKey({
          cancerSite: params.cancerSite,
          cancerTypes: params.cancerTypes,
          genes: params.genes,
          method,
          topN: params.topN,
          analysisType: params.analysisType,
        })
      );

      const allCachedResults = cacheKeys.map((key) => getCachedData(key));
      if (allCachedResults.every((result) => result !== null)) {
        console.log("Using cached data for all normalization methods");
        if (isMounted) {
          const currentCacheKey = generateCacheKey({
            cancerSite: params.cancerSite,
            cancerTypes: params.cancerTypes,
            genes: params.genes,
            method: normalizationMethod,
            topN: params.topN,
            analysisType: params.analysisType,
          });
          const currentResults = allCachedResults[cacheKeys.indexOf(currentCacheKey)]!;
          setCurrentResults(currentResults);
          setIsLoading(false);
          setError(null);
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

        if (siteRowsErr) throw new Error(`Failed to fetch cancer site: ${siteRowsErr.message}`);
        if (!siteRows?.length) throw new Error(`Cancer site not found: ${params.cancerSite}`);

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

        // Fetch data for all normalization methods in parallel
        const fetchPromises = normalizationMethods.map(async (method) => {
          const queryParams = new URLSearchParams({
            cancer: params.cancerSite,
            method,
            tumor_samples: tumorSamples.join(",") || "sample1",
            normal_samples: normalSamples.join(",") || "sample2",
            top_n: params.topN.toString(),
            analysis_type: params.analysisType,
            ...(params.genes.length > 0 && params.analysisType === "ORA" && { genes: params.genes.join(",") }),
          });

          const response = await fetch(`http://localhost:5001/api/pathway-analysis?${queryParams}`);
          if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Failed to fetch pathway analysis data for ${method}: ${errorText}`);
          }
          const apiData = await response.json();
          return { method, apiData };
        });

        const results = await Promise.allSettled(fetchPromises);

        // Process results and cache them
        let geneToEnsemblMap = new Map<string, string>();
        let allGenesToProcess: string[] = [];

        // Collect all unique genes to fetch Ensembl IDs
        results.forEach((result, index) => {
          if (result.status === "fulfilled") {
            const { apiData } = result.value;
            const genes = params.analysisType === "ORA" && params.genes.length > 0 ? params.genes : apiData.top_genes;
            allGenesToProcess = [...new Set([...allGenesToProcess, ...genes])];
          }
        });

        // Fetch Ensembl IDs for all unique genes
        if (allGenesToProcess.length > 0) {
          const { data: geneData, error: geneError } = await supabase
            .from("genes")
            .select("id, ensembl_id, gene_symbol")
            .in("gene_symbol", allGenesToProcess);

          if (geneError) {
            console.error("Gene error:", geneError);
            throw new Error(`Failed to fetch genes: ${geneError.message}`);
          }
          geneToEnsemblMap = new Map(geneData.map((g) => [g.gene_symbol, g.ensembl_id]));
        }

        // Process and cache results for each normalization method
        results.forEach((result, index) => {
          if (result.status === "fulfilled") {
            const { method, apiData } = result.value;
            const genesToProcess = params.analysisType === "ORA" && params.genes.length > 0 ? params.genes : apiData.top_genes;

            const processedGeneStats: GeneStats[] = genesToProcess.map((gene: string) => {
              const stats = apiData.gene_stats[gene] || {};
              return {
                gene,
                ensembl_id: geneToEnsemblMap.get(gene) || "N/A",
                mean_tumor: stats.mean_tumor || 0,
                mean_normal: stats.mean_normal || 0,
                cv_tumor: stats.cv_tumor || 0,
                cv_normal: stats.cv_normal || 0,
                logFC: stats.logfc,
              };
            });

            const newResults: ResultsData = {
              enrichment: apiData.enrichment || [],
              top_genes: genesToProcess,
              gene_stats: processedGeneStats,
            };

            const cacheKey = generateCacheKey({
              cancerSite: params.cancerSite,
              cancerTypes: params.cancerTypes,
              genes: params.genes,
              method,
              topN: params.topN,
              analysisType: params.analysisType,
            });

            setCachedData(cacheKey, newResults);

            if (isMounted && method === normalizationMethod) {
              setCurrentResults(newResults);
            }
          } else {
            console.error(`Error fetching data for ${normalizationMethods[index]}:`, result.reason);
            if (isMounted && normalizationMethods[index] === normalizationMethod) {
              setError(`Failed to fetch data for ${normalizationMethods[index]}: ${result.reason.message}`);
              setCurrentResults({ enrichment: [], top_genes: [], gene_stats: [] });
            }
          }
        });

        if (isMounted) {
          setIsLoading(false);
        }
      } catch (error: any) {
        console.error("Error fetching data:", error);
        if (isMounted) {
          setError(error.message || "An error occurred while fetching data.");
          setCurrentResults({ enrichment: [], top_genes: [], gene_stats: [] });
          setIsLoading(false);
        }
      }
    };

    fetchData();
    return () => {
      isMounted = false;
    };
  }, [params.cancerSite, params.cancerTypes, params.genes, params.topN, params.analysisType, getCachedData, setCachedData, generateCacheKey]);

  const downloadData = useCallback(
    (type: "enrichment" | "mean_expression" | "noise_metrics") => {
      let data: any[] = [];
      let headers: string[] = [];
      let filename = `pathway_analysis_${params.cancerSite}_${params.analysisType}_${normalizationMethod}_${Date.now()}`;

      if (type === "enrichment") {
        data = currentResults.enrichment;
        headers = ["Term", "P-value", "Adjusted P-value", "Combined Score", "Genes"];
        filename = `enrichment_${filename}.csv`;
        const rows = data.map((row) =>
          [row.Term, row["P-value"], row["Adjusted P-value"], row["Combined Score"], row.Genes.join(", ")].join(",")
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
        headers = ["Gene", "Ensembl ID", "Mean Tumor", "Mean Normal"];
        filename = `mean_expression_${filename}.csv`;
        const rows = data.map((row) =>
          [row.gene, row.ensembl_id, row.mean_tumor.toFixed(2), row.mean_normal.toFixed(2)].join(",")
        );
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
        headers = ["Gene", "Ensembl ID", "CV Tumor", "CV Normal", "Log2FC"];
        filename = `noise_metrics_${filename}.csv`;
        const rows = data.map((row) =>
          [row.gene, row.ensembl_id, row.cv_tumor.toFixed(2), row.cv_normal.toFixed(2), row.logFC.toFixed(2)].join(",")
        );
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
    [currentResults, params.cancerSite, params.cancerTypes, params.analysisType, normalizationMethod]
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-yellow-50 flex flex-col">
      <Header />
      <main className="flex-grow">
        <div className="content-container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex gap-6">
            <div className="w-80 flex-shrink-0">
              <CollapsibleCard title="Filters" className="bg-blue-100">
                <div className="space-y-6">
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

                  {params.analysisType === "ORA" && (
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-semibold text-blue-900">Custom Gene List</h3>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowGeneInput(!showGeneInput)}
                          className="text-blue-600 hover:text-blue-700"
                        >
                          {showGeneInput ? <X className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        </Button>
                      </div>
                      {showGeneInput && (
                        <div className="space-y-3">
                          <Input
                            placeholder="Enter gene symbols (comma, space, or | separated)"
                            value={customGeneInput}
                            onChange={handleGeneInput}
                          />
                          <div className="flex items-center space-x-2">
                            <Button onClick={submitCustomGenes} size="sm" className="flex-1">
                              Submit Genes
                            </Button>
                            <label className="relative cursor-pointer">
                              <Button variant="outline" size="sm" asChild>
                                <span>Upload</span>
                              </Button>
                              <input
                                type="file"
                                accept=".txt,.csv"
                                onChange={handleFileUpload}
                                className="absolute inset-0 opacity-0 w-full h-full"
                              />
                            </label>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </CollapsibleCard>
            </div>

            <div className="flex-1">
              {isLoading ? (
                <LoadingSpinner message="Loading pathway results..." />
              ) : error ? (
                <div className="text-center text-red-600">{error}</div>
              ) : (
                <>
                  <Link
                    to="/pathway-analysis"
                    className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-6 transition-colors"
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Pathway Analysis
                  </Link>

                  <div className="mb-8">
                    <h2 className="text-4xl font-bold text-blue-900 mb-2">
                      Results for {params.cancerSite} Cancer ({params.analysisType})
                    </h2>
                    <div className="flex items-center justify-between mb-4">
                      <p className="text-blue-700 text-lg">
                        Normalization: <strong>{normalizationMethod.toUpperCase()}</strong>,{" "}
                        {params.analysisType === "ORA" && params.genes.length > 0
                          ? `Custom genes (${params.genes.length})`
                          : `Top ${params.topN} genes`}
                      </p>
                      <Button
                        onClick={() => downloadData("enrichment")}
                        variant="outline"
                        size="sm"
                        className="bg-blue-600 text-white hover:bg-blue-700"
                      >
                        <Download className="h-4 w-4 mr-2" /> Download Enrichment CSV
                      </Button>
                    </div>

                    <CollapsibleCard title="Sample Counts">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
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
                      <PlotlyBarChart
                        data={sampleCountData}
                        xKey="type"
                        yKey="count"
                        title="Sample Count Distribution"
                        xLabel="Sample Type"
                        yLabel="Count"
                      />
                    </CollapsibleCard>
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
                            <ScrollArea className="h-[500px]">
                              <Table>
                                <TableHeader className="sticky top-0 bg-white z-10">
                                  <TableRow>
                                    <TableHead className="text-blue-700">Pathway</TableHead>
                                    <TableHead className="text-blue-700">P-value</TableHead>
                                    <TableHead className="text-blue-700">Adj. P-value</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {currentResults.enrichment.map((row, idx) => (
                                    <TableRow
                                      key={idx}
                                      className="cursor-pointer hover:bg-blue-50"
                                      onClick={() => setSelectedPathway(row)}
                                    >
                                      <TableCell className="font-medium">{row["Term"]}</TableCell>
                                      <TableCell>{formatPValue(row["P-value"])}</TableCell>
                                      <TableCell>{formatPValue(row["Adjusted P-value"])}</TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            </ScrollArea>
                          </CollapsibleCard>
                        </div>

                        <div>
                          <CollapsibleCard title="Pathway Details" className="h-full">
                            {selectedPathway ? (
                              <div className="space-y-4">
                                <div>
                                  <h3 className="font-semibold text-blue-700">{selectedPathway.Term}</h3>
                                </div>
                                <div>
                                  <h4 className="font-medium text-blue-700">Statistics</h4>
                                  <div className="grid grid-cols-2 gap-2 mt-2 text-sm">
                                    <div>P-value:</div>
                                    <div>{selectedPathway["P-value"].toExponential(2)}</div>
                                    <div>Adj. P-value:</div>
                                    <div>{selectedPathway["Adjusted P-value"].toExponential(2)}</div>
                                  </div>
                                </div>
                                <div>
                                  <h4 className="font-medium text-blue-700">Associated Genes</h4>
                                  <ScrollArea className="h-[300px]">
                                    <div className="flex flex-wrap gap-2 mt-2">
                                      {selectedPathway.Genes.map((gene, idx) => (
                                        <span
                                          key={idx}
                                          className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs"
                                        >
                                          {gene}
                                        </span>
                                      ))}
                                    </div>
                                  </ScrollArea>
                                </div>
                              </div>
                            ) : (
                              <div className="text-center text-gray-500 h-full flex items-center justify-center">
                                <div>
                                  <Info className="h-8 w-8 mx-auto mb-2" />
                                  <p>Select a pathway to view details</p>
                                </div>
                              </div>
                            )}
                          </CollapsibleCard>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 gap-6 mb-8">
                        <CollapsibleCard title="Mean Expression Heatmap">
                          <PlotlyHeatmap
                            title="Mean Expression Heatmap"
                            data={currentResults.gene_stats}
                            xValues={["Tumor", "Normal"]}
                            yValues={currentResults.gene_stats.map((d) => d.gene)}
                            zValues={currentResults.gene_stats.map((d) => [d.mean_tumor, d.mean_normal])}
                            zLabel="Expression Level"
                            chartKey="mean-expression"
                            xLabel="Sample Type"
                            yLabel="Genes"
                            annotation={params.cancerSite}
                          />
                        </CollapsibleCard>
                        <CollapsibleCard title="Coefficient of Variation Heatmap">
                          <PlotlyHeatmap
                            title="Coefficient of Variation Heatmap"
                            data={currentResults.gene_stats}
                            xValues={["Tumor", "Normal"]}
                            yValues={currentResults.gene_stats.map((d) => d.gene)}
                            zValues={currentResults.gene_stats.map((d) => [d.cv_tumor, d.cv_normal])}
                            zLabel="CV"
                            chartKey="cv-heatmap"
                            xLabel="Sample Type"
                            yLabel="Genes"
                            annotation={params.cancerSite}
                          />
                        </CollapsibleCard>
                        <CollapsibleCard title="Log2 Fold Change">
                          <PlotlyBarChart
                            data={currentResults.gene_stats}
                            xKey="gene"
                            yKey="logFC"
                            title="Log2 Fold Change"
                            xLabel="Genes"
                            yLabel="Log2 Fold Change"
                            colors="#3b82f6"
                          />
                        </CollapsibleCard>
                      </div>

                      <CollapsibleCard
                        title="Mean Expression Analysis"
                        className="mb-8"
                        downloadButton={
                          <Button
                            onClick={() => downloadData("mean_expression")}
                            variant="outline"
                            size="sm"
                            className="bg-blue-600 text-white hover:bg-blue-700"
                          >
                            <Download className="h-4 w-4 mr-2" /> Download CSV
                          </Button>
                        }
                      >
                        {currentResults.gene_stats.length > 0 ? (
                          <ScrollArea className="h-[500px]">
                            <Table>
                              <TableHeader className="sticky top-0 bg-white z-10">
                                <TableRow>
                                  <TableHead className="text-blue-700">Gene</TableHead>
                                  <TableHead className="text-blue-700">Ensembl ID</TableHead>
                                  <TableHead className="text-blue-700">Mean Tumor</TableHead>
                                  <TableHead className="text-blue-700">Mean Normal</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {currentResults.gene_stats.map((row, idx) => (
                                  <TableRow key={idx}>
                                    <TableCell className="font-medium">{row.gene}</TableCell>
                                    <TableCell>{row.ensembl_id}</TableCell>
                                    <TableCell>{row.mean_tumor.toFixed(2)}</TableCell>
                                    <TableCell>{row.mean_normal.toFixed(2)}</TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </ScrollArea>
                        ) : (
                          <p className="text-blue-700">No mean expression data available.</p>
                        )}
                      </CollapsibleCard>

                      <CollapsibleCard
                        title="Noise Metrics Analysis"
                        className="mb-8"
                        downloadButton={
                          <Button
                            onClick={() => downloadData("noise_metrics")}
                            variant="outline"
                            size="sm"
                            className="bg-blue-600 text-white hover:bg-blue-700"
                          >
                            <Download className="h-4 w-4 mr-2" /> Download CSV
                          </Button>
                        }
                      >
                        {currentResults.gene_stats.length > 0 ? (
                          <ScrollArea className="h-[500px]">
                            <Table>
                              <TableHeader className="sticky top-0 bg-white z-10">
                                <TableRow>
                                  <TableHead className="text-blue-700">Gene</TableHead>
                                  <TableHead className="text-blue-700">Ensembl ID</TableHead>
                                  <TableHead className="text-blue-700">CV Tumor</TableHead>
                                  <TableHead className="text-blue-700">CV Normal</TableHead>
                                  <TableHead className="text-blue-700">Log2FC</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {currentResults.gene_stats.map((row, idx) => (
                                  <TableRow key={idx}>
                                    <TableCell className="font-medium">{row.gene}</TableCell>
                                    <TableCell>{row.ensembl_id}</TableCell>
                                    <TableCell>{row.cv_tumor.toFixed(2)}</TableCell>
                                    <TableCell>{row.cv_normal.toFixed(2)}</TableCell>
                                    <TableCell>{row.logFC.toFixed(2)}</TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </ScrollArea>
                        ) : (
                          <p className="text-blue-700">No noise metrics data available.</p>
                        )}
                      </CollapsibleCard>
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