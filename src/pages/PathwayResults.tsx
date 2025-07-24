import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useSearchParams, Link } from "react-router-dom";
import supabase from "@/supabase-client";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Download, Network, Activity, Users } from "lucide-react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";
import Header from "@/components/header";
import Footer from "@/components/footer";

const PathwayResults = () => {
  const [searchParams] = useSearchParams();
  const params = useMemo(
    () => ({
      cancerSite: searchParams.get("site") || "",
      cancerTypes: searchParams.get("cancerTypes")?.split(",").filter(Boolean) || [],
      method: searchParams.get("method") || "tpm",
      topN: parseInt(searchParams.get("top_n") || "200", 10),
    }),
    [searchParams]
  );

  const [normalizationMethod, setNormalizationMethod] = useState(params.method);
  const [resultsData, setResultsData] = useState({ enrichment: [], top_genes: [], gene_stats: {} });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [totalTumorSamples, setTotalTumorSamples] = useState(0);
  const [totalNormalSamples, setTotalNormalSamples] = useState(0);
  const chartRefs = useRef({});

  useEffect(() => {
    if (!["tpm", "fpkm", "fpkm_uq"].includes(normalizationMethod)) {
      setNormalizationMethod("tpm");
    }
  }, [normalizationMethod]);

  useEffect(() => {
    let isMounted = true;
    const fetchData = async () => {
      if (!params.cancerSite) {
        console.log("Early return: Missing cancerSite or cancerTypes");
        if (isMounted) {
          setError("Please select a cancer site and at least one cancer type.");
        }
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        // Fetch cancer site ID
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
        console.log("Cancer site ID:", cancerSiteId);

        // Fetch cancer type IDs
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
        console.log("Cancer type IDs:", cancerTypeIds);

        // Fetch samples
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
        console.log("Tumor samples:", tumorSamples.length, "Normal samples:", normalSamples.length);

        setTotalTumorSamples(tumorSamples.length);
        setTotalNormalSamples(normalSamples.length);

        // Fetch pathway analysis data
        const queryParams = new URLSearchParams({
          cancer: params.cancerSite,
          method: normalizationMethod,
          tumor_samples: tumorSamples.join(",") || "sample1",
          normal_samples: normalSamples.join(",") || "sample2",
          top_n: params.topN.toString(),
        });
        console.log("API request URL:", `http://localhost:5001/api/pathway-analysis?${queryParams}`);

        const response = await fetch(`http://localhost:5001/api/pathway-analysis?${queryParams}`, {
          method: "GET",
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error("API fetch failed:", response.status, errorText);
          throw new Error(`Failed to fetch pathway analysis data: ${errorText}`);
        }

        const apiData = await response.json();
        console.log("API response:", apiData);

        // Process gene_stats to include logFC
        const processedGeneStats = apiData.top_genes.map((gene) => {
          const stats = apiData.gene_stats[gene] || {};
          const meanTumor = stats.mean_tumor || 0;
          const meanNormal = stats.mean_normal || 0;
          const logFC = meanTumor && meanNormal ? Math.log2(meanTumor / meanNormal) : 0;
          return {
            gene,
            mean_tumor: meanTumor,
            mean_normal: meanNormal,
            logFC,
          };
        });

        if (isMounted) {
          setResultsData({
            enrichment: apiData.enrichment || [],
            top_genes: apiData.top_genes || [],
            gene_stats: processedGeneStats,
          });
          setError(null);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        if (isMounted) {
          setError(error.message || "An error occurred while fetching data.");
          setResultsData({ enrichment: [], top_genes: [], gene_stats: [] });
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
  }, [params.cancerSite, params.cancerTypes, normalizationMethod, params.topN]);

  const getCancerTypeLabel = useCallback((type) => {
    const labels = {
      "TCGA-BRCA": "Breast Cancer (BRCA)",
      "TCGA-LUAD": "Lung Cancer (LUAD)",
      "TCGA-PRAD": "Prostate Cancer (PRAD)",
      "TCGA-COAD": "Colorectal Cancer (COAD)",
      "TCGA-LIHC": "Liver Cancer (LIHC)",
      "TCGA-KIRC": "Kidney Cancer (KIRC)",
      "TCGA-STAD": "Stomach Cancer (STAD)",
      "TCGA-OV": "Ovarian Cancer (OV)",
      "TCGA-BLCA": "Bladder Cancer (BLCA)",
      "TCGA-THYM": "Thymus Cancer (THYM)",
    };
    return labels[type] || type;
  }, []);

  const downloadData = useCallback(
    (format) => {
      const data = resultsData.enrichment;
      let content = "";
      let filename = `pathway_analysis_${params.cancerTypes}_${Date.now()}`;

      if (format === "csv") {
        const headers = ["Term", "P-value", "Adjusted P-value", "Odds Ratio", "Combined Score"];
        const rows = data.map((row) =>
          headers.map((key) => row[key] || 0).join(",")
        );
        content = [headers.join(","), ...rows].join("\n");
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
    [resultsData.enrichment, params.cancerTypes]
  );

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

  const BarChartComponent = React.memo(({ data, dataKey, color, title }: any) => {
    const renderCount = useRef(0);
    useEffect(() => {
      console.log(`BarChartComponent ${dataKey} rendered ${++renderCount.current} times`);
    });

    return (
      <Card className="border-0 shadow-lg">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center justify-between text-sm">
            <div className="flex items-center space-x-2">
              <Network className="h-4 w-4" style={{ color }} />
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
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey={dataKey === "logFC" ? "gene" : "Term"}
                  tick={{ fontSize: 10 }}
                  interval={0}
                  angle={-20}
                  height={70}
                  label={{
                    value: dataKey === "logFC" ? " mestanem Genes" : "Pathways",
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
                  formatter={(value) => [
                    typeof value === "number" ? value.toFixed(2) : value,
                    title,
                  ]}
                />
                <Bar dataKey={dataKey} fill={color} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    );
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-yellow-50 flex flex-col">
      <Header />
      <main className="flex-grow">

      <div className="content-container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-6">
          <div className="w-80 flex-shrink-0">
            <Card className="border-0 shadow-lg bg-blue-100">
              <CardHeader className="pb-4">
                <CardTitle className="text-blue-900">Filters</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
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
              </CardContent>
            </Card>
          </div>

          <div className="flex-1">
            {isLoading ? (
              <div className="text-center text-blue-900">Loading pathway results...</div>
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
                    {/* Pathway Enrichment Results for {params.cancerSite} Cancer */}
                    Results for {params.cancerSite}{" Cancer "}
                    {params.cancerTypes.length > 0 && `(${params.cancerTypes.join(", ")})`}
                  </h2>
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-blue-700 text-lg">
                      Normalization: <strong>{normalizationMethod.toUpperCase()}</strong>, Top {params.topN} genes
                    </p>
                    <Button onClick={() => downloadData("csv")} variant="outline" size="sm">
                      <Download className="h-4 w-4 mr-2" /> Download CSV
                    </Button>
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

                {resultsData.enrichment.length === 0 ? (
                  <Card className="shadow-lg p-6 text-center text-blue-700">
                    <Activity className="w-10 h-10 mx-auto mb-3" />
                    <p className="text-lg">No pathway enrichment results found for the selected parameters.</p>
                  </Card>
                ) : (
                  <>
                    <Card className="mb-8 border-0 shadow-lg">
                      <CardHeader>
                        <CardTitle className="text-blue-800">Enriched Pathways</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="text-blue-700">Pathway</TableHead>
                              <TableHead className="text-blue-700">P-value</TableHead>
                              <TableHead className="text-blue-700">Adjusted P-value</TableHead>
                              <TableHead className="text-blue-700">Odds Ratio</TableHead>
                              <TableHead className="text-blue-700">Combined Score</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {resultsData.enrichment.map((row, idx) => (
                              <TableRow key={idx}>
                                <TableCell>{row["Term"]}</TableCell>
                                <TableCell>{row["P-value"].toExponential(2)}</TableCell>
                                <TableCell>{row["Adjusted P-value"].toExponential(2)}</TableCell>
                                <TableCell>{row["Odds Ratio"].toFixed(2)}</TableCell>
                                <TableCell>{row["Combined Score"].toFixed(2)}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </CardContent>
                    </Card>

                    <Card className="mb-8 border-0 shadow-lg">
                      <CardHeader>
                        <CardTitle className="text-blue-800">Pathway Significance</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <BarChartComponent
                          data={resultsData.enrichment}
                          dataKey="Adjusted P-value"
                          color="#facc15"
                          title="Adjusted P-value (FDR)"
                        />
                      </CardContent>
                    </Card>
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