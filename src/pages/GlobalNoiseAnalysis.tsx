'use client';

import React, { useState, useCallback, useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Download, TrendingUp, AlertCircle, Search, X, Activity } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { DataTable } from "@/components/ui/data-table";
import { LoadingSpinner } from "@/components/ui/loadingSpinner";
import Header from "@/components/header";
import Footer from "@/components/footer";
import CancerTypeSelector from "@/components/siteSelector";
import { useCache } from "@/hooks/use-cache";
import { PlotlyBarChart } from "@/components/charts/PlotlyBarChart";

interface NoisyGene {
  gene_symbol: string;
  cv_tumor: number;
  cv_normal: number | null;
  site_name?: string;
}

interface EnrichmentResult {
  id: string;
  label: string;
  description?: string;
  category: string;
  genes: string[];
  fdr?: number;
  source?: string;
}

const GlobalNoiseAnalysis: React.FC = () => {
  const [scope, setScope] = useState<"global" | "site-specific">("global");
  const [selectedSites, setSelectedSites] = useState<string[]>([]);
  const [selectedCancerTypes, setSelectedCancerTypes] = useState<string[]>([]);
  const [topN, setTopN] = useState<number>(20);
  const [normMethod, setNormMethod] = useState<"tpm" | "fpkm" | "fpkm_uq">("tpm");

  const [tumorGenes, setTumorGenes] = useState<NoisyGene[]>([]);
  const [normalGenes, setNormalGenes] = useState<NoisyGene[]>([]);
  const [hasNormalData, setHasNormalData] = useState(false);

  // Enrichment states
  const [enrichment, setEnrichment] = useState<EnrichmentResult[]>([]);
  const [filteredEnrichment, setFilteredEnrichment] = useState<EnrichmentResult[]>([]);
  const [selectedPathway, setSelectedPathway] = useState<EnrichmentResult | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { getCachedData, setCachedData, generateCacheKey } = useCache<any>();

  // Filter pathways when search changes
  useEffect(() => {
    if (!enrichment.length) {
      setFilteredEnrichment([]);
      return;
    }
    const filtered = enrichment.filter(p =>
      (p.description || p.label || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.genes.some(g => g.toLowerCase().includes(searchTerm.toLowerCase()))
    );
    setFilteredEnrichment(filtered);
  }, [enrichment, searchTerm]);

  const runAnalysis = useCallback(async () => {
    if (scope === "site-specific" && selectedSites.length === 0) {
      setError("Please select at least one cancer site.");
      return;
    }

    setIsLoading(true);
    setError(null);
    setTumorGenes([]);
    setNormalGenes([]);
    setHasNormalData(false);
    setEnrichment([]);
    setSelectedPathway(null);
    setSearchTerm("");

    const cacheKey = generateCacheKey({
      endpoint: "global-noise-enrichment",
      scope,
      sites: selectedSites,
      topN,
      norm: normMethod,
    });

    const cached = getCachedData(cacheKey);
    if (cached) {
      setTumorGenes(cached.tumorGenes || []);
      setNormalGenes(cached.normalGenes || []);
      setHasNormalData(cached.hasNormalData || false);
      setEnrichment(cached.enrichment || []);
      setIsLoading(false);
      return;
    }

    try {
      const params = new URLSearchParams({
        norm: normMethod,
        top_n: topN.toString(),
      });
      if (scope === "site-specific" && selectedSites.length > 0) {
        params.append("sites", selectedSites.join(","));
      }
      if (scope === "site-specific" && selectedCancerTypes.length > 0) {
        params.append("cancer_types", selectedCancerTypes.join(","));
      }

      const res = await fetch(`/api/top-noisy-genes?${params}`);
      if (!res.ok) throw new Error(`API Error: ${await res.text()}`);
      const data = await res.json();

      const genes: NoisyGene[] = (data.genes || []).map((g: any) => ({
        gene_symbol: g.gene_symbol,
        cv_tumor: g.cv_tumor,
        cv_normal: g.cv_normal,
        site_name: g.site_name || (scope === "global" ? "Pan-Cancer" : undefined),
      }));

      const tumorRanked = genes.filter(g => g.cv_tumor != null).sort((a, b) => b.cv_tumor - a.cv_tumor);
      const normalRanked = genes.filter(g => g.cv_normal != null).sort((a, b) => (b.cv_normal || 0) - (a.cv_normal || 0));

      setTumorGenes(tumorRanked);
      setNormalGenes(normalRanked);
      setHasNormalData(normalRanked.length > 0);

      // Run pathway enrichment on top tumor genes
      if (tumorRanked.length > 0) {
        const geneList = tumorRanked.slice(0, Math.min(500, tumorRanked.length)).map(g => g.gene_symbol);

        try {
          const enrichRes = await fetch("/api/enriched-pathways", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ genes: geneList }),
          });

          if (enrichRes.ok) {
            const enrichData: any[] = await enrichRes.json();
            const formatted = enrichData.map(item => ({
              id: item.id || item.term_id || String(Math.random()),
              label: item.label || item.name || item.term,
              description: item.description || item.name || item.label,
              category: item.category || item.source || "Unknown",
              genes: Array.isArray(item.genes) ? item.genes : item.overlapping_genes || [],
              fdr: item.fdr || item.p_adjusted || item.qvalue || 1,
              source: item.source || "Enrichr",
            }));

            setEnrichment(formatted);
            setCachedData(cacheKey, {
              tumorGenes: tumorRanked,
              normalGenes: normalRanked,
              hasNormalData: normalRanked.length > 0,
              enrichment: formatted,
            });
          }
        } catch (enrichErr) {
          console.warn("Enrichment failed (optional)", enrichErr);
          // Don't break the whole analysis
        }
      } else {
        setCachedData(cacheKey, {
          tumorGenes: tumorRanked,
          normalGenes: normalRanked,
          hasNormalData: normalRanked.length > 0,
          enrichment: [],
        });
      }

    } catch (err: any) {
      setError(err.message || "Analysis failed");
    } finally {
      setIsLoading(false);
    }
  }, [scope, selectedSites, topN, normMethod, getCachedData, setCachedData, generateCacheKey]);

  const downloadCSV = (type: "tumor" | "normal") => {
    const data = type === "tumor" ? tumorGenes : normalGenes;
    const suffix = type === "tumor" ? "tumor" : "normal";
    const headers = ["Rank", "Gene", `CV (${type === "tumor" ? "Tumor" : "Normal"})`, "Site"];
    const rows = data.map((g, i) => [
      (i + 1).toString(),
      g.gene_symbol,
      type === "tumor" ? g.cv_tumor.toFixed(6) : (g.cv_normal || "NA"),
      g.site_name || "Pan-Cancer",
    ]);
    const csv = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `top_${topN}_noisy_genes_${suffix}_${scope}_${normMethod}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getScopeLabel = () => scope === "global" ? "Pan-Cancer" : `${selectedSites.length} Site(s)`;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />
      <main className="flex-grow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Link to="/" className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-4 text-sm">
            <ArrowLeft className="h-4 w-4 mr-2" /> Back to Dashboard
          </Link>
          <h1 className="text-4xl font-bold text-blue-900 mb-4">
            Top Noisy Genes 
          </h1>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Controls */}
            <Card className="shadow-xl lg:col-span-1 h-fit lg:sticky lg:top-4">
              <CardHeader>
                <CardTitle className="text-xl text-blue-900">Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label>Scope</Label>
                  <Select value={scope} onValueChange={(v: any) => { setScope(v); setSelectedSites([]); }}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="global">Pan-Cancer</SelectItem>
                      <SelectItem value="site-specific">By Cancer Site</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {scope === "site-specific" && (
                  <div>
                    <Label>Cancer Sites</Label>
                    <CancerTypeSelector
                      selectedSites={selectedSites}
                      onSitesChange={setSelectedSites}
                      selectedCancerTypes={selectedCancerTypes}   
                      CancerTypes={selectedCancerTypes}
                      onCancerTypesChange={setSelectedCancerTypes}
                      analysisType="cancer-specific"
                    />
                  </div>
                )}

                <div>
                  <Label>Normalization</Label>
                  <Select value={normMethod} onValueChange={(v: any) => setNormMethod(v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="tpm">TPM</SelectItem>
                      <SelectItem value="fpkm">FPKM</SelectItem>
                      <SelectItem value="fpkm_uq">FPKM-UQ</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Top N Genes</Label>
                  <Input
                    type="number"
                    value={topN}
                    step={100}
                    onChange={(e) => setTopN(Math.max(50, Math.min(300, parseInt(e.target.value) || 500)))}
                  />
                </div>

                <Button
                  onClick={runAnalysis}
                  disabled={isLoading}
                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800"
                  size="lg"
                >
                  {isLoading ? "Running Analysis..." : <> Run Analysis</>}
                </Button>
              </CardContent>
            </Card>

            {/* Results */}
            <div className="lg:col-span-3 space-y-10">
              {isLoading && (
                <Card><CardContent className="py-16 text-center">
                  <LoadingSpinner message="Analyzing noise + enriching pathways..." />
                </CardContent></Card>
              )}

              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {/* Tumor Genes */}
              {tumorGenes.length > 0 && (
                <Card className="shadow-xl ">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-2xl text-black-700">
                          Top {tumorGenes.length} Noisiest Genes — Tumor
                        </CardTitle>
                        <p className="text-sm text-gray-600">{getScopeLabel()} • {normMethod.toUpperCase()}</p>
                      </div>
                      <Button onClick={() => downloadCSV("tumor")} variant="outline">
                        <Download className="h-4 w-4 mr-2" />Downlaod CSV
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <DataTable
                      data={tumorGenes.slice(0, 100)}
                      columns={[
                        // { key: "rank", header: "Rank", render: (_, __, i) => i + 1 },
                        { key: "gene_symbol", header: "Gene", sortable: true },
                        { key: "cv_tumor", header: "CV (Tumor)", render: (v: number) => v.toFixed(4), sortable: true },
                        { key: "site_name", header: "Site", render: (r: NoisyGene) => r.site_name || "Pan-Cancer" },
                      ]}
                    />
                    <PlotlyBarChart
                      data={tumorGenes.slice(0, 30)}
                      title="Top 30 Noisiest Genes (Tumor)"
                      xKey="gene_symbol"
                      yKey="cv_tumor"
                      xLabel="Gene"
                      yLabel="CV (Tumor)"
                      orientation="v"
                      colors="#dc2626"
                      sortByKey="cv_tumor"
                      sortOrder="desc"
                    />
                  </CardContent>
                </Card>
              )}

              {/* Normal Genes */}
              {/* {hasNormalData && normalGenes.length > 0 && (
                <Card className="shadow-xl">
                  <CardHeader>
                    <CardTitle className="text-2xl text-black-700">
                      Top {normalGenes.length} Noisiest Genes — Normal Tissue
                    </CardTitle>
                    <Button onClick={() => downloadCSV("tumor")} variant="outline">
                        <Download className="h-4 w-4 mr-2" />Downlaod CSV
                      </Button>
                  </CardHeader>
                  <CardContent>
                    <DataTable
                      data={normalGenes.slice(0, 100)}
                      columns={[
                        // { key: "rank", header: "Rank", render: (_, __, i_truly) => i_truly + 1 },
                        { key: "gene_symbol", header: "Gene", sortable: true },
                        { key: "cv_normal", header: "CV (Normal)", render: (v: number | null) => v ? v.toFixed(4) : "—", sortable: true },
                        { key: "site_name", header: "Site", render: (r: NoisyGene) => r.site_name || "Pan-Cancer" },
                      ]}
                    />
                    <PlotlyBarChart
                      data={normalGenes.slice(0, 30)}
                      title="Top Noisiest Genes (Normal)"
                      xKey="gene_symbol"
                      yKey="cv_normal"
                      xLabel="Gene"
                      yLabel="CV (Normal)"
                      orientation="v"
                      colors="#10b981bd"
                      sortByKey="cv_normal"
                      sortOrder="desc"
                    />
                  </CardContent>
                </Card>
              )} */}

              {/* Enriched Pathways */}
              {enrichment.length > 0 && (
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                  <div className="xl:col-span-1">
                    <Card className="shadow-xl h-full">
                      <CardHeader>
                        <CardTitle>Enriched Pathways ({filteredEnrichment.length})</CardTitle>
                        <div className="mt-3 relative">
                          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                          <Input
                            placeholder="Search pathways..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10"
                          />
                        </div>
                      </CardHeader>
                      <CardContent>
                        <ScrollArea className="h-96">
                          <div className="space-y-3">
                            {filteredEnrichment
                              .sort((a, b) => (a.fdr || 1) - (b.fdr || 1))
                              .slice(0, 50)
                              .map((p) => (
                                <div
                                  key={p.id}
                                  onClick={() => setSelectedPathway(p)}
                                  className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                                    selectedPathway?.id === p.id
                                      ? "border-blue-500 bg-blue-50 shadow-md"
                                      : "border-gray-200 hover:border-gray-400 hover:bg-gray-50"
                                  }`}
                                >
                                  <div className="flex justify-between items-start gap-3">
                                    <div className="flex-1">
                                      <p className="font-medium text-sm text-blue-900 truncate">
                                        {p.description || p.label}
                                      </p>
                                      <p className="text-xs text-gray-600">{p.category}</p>
                                    </div>
                                    <div className="text-right">
                                      <Badge variant="secondary">{p.genes.length}</Badge>
                                      {p.fdr && p.fdr < 0.05 && (
                                        <p className="text-xs font-mono text-green-700 mt-1">
                                          {p.fdr < 0.001 ? p.fdr.toExponential(1) : p.fdr.toFixed(3)}
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              ))}
                          </div>
                        </ScrollArea>
                      </CardContent>
                    </Card>
                  </div>

                  <div className="xl:col-span-2">
                    {selectedPathway ? (
                      <Card className="shadow-xl h-full">
                        <CardHeader>
                          <div className="flex justify-between items-start">
                            <CardTitle className="text-2xl text-blue-900">
                              {selectedPathway.description || selectedPathway.label}
                            </CardTitle>
                            <Button variant="ghost" size="sm" onClick={() => setSelectedPathway(null)}>
                              <X className="h-5 w-5" />
                            </Button>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-6">
                          <div className="flex flex-wrap gap-2">
                            <Badge className="bg-blue-100 text-blue-800">{selectedPathway.category}</Badge>
                            <Badge variant="secondary">{selectedPathway.genes.length} genes</Badge>
                            {selectedPathway.fdr && (
                              <Badge className={"bg-gray-100 text-black"}>
                                FDR: {selectedPathway.fdr < 0.001 ? selectedPathway.fdr.toExponential(2) : selectedPathway.fdr.toFixed(4)}
                              </Badge>
                            )}
                            <Badge variant="secondary">{selectedPathway.id}</Badge>
                          </div>
                          <div>
                            <h4 className="font-semibold mb-3">Genes in Your Noisy Set</h4>
                            <ScrollArea className="h-64 rounded-md border p-4">
                              <div className="flex flex-wrap gap-2">
                                {selectedPathway.genes.map(gene => (
                                  <Badge key={gene} variant="outline" className="font-mono text-xs">
                                    {gene}
                                  </Badge>
                                ))}
                              </div>
                            </ScrollArea>
                          </div>
                        </CardContent>
                      </Card>
                    ) : (
                      <Card className="h-full border-dashed border-2 flex items-center justify-center">
                        <div className="text-center text-gray-500">
                          <p className="text-lg font-medium">Click a pathway to view details</p>
                        </div>
                      </Card>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default GlobalNoiseAnalysis;
// 'use client';

// import React, { useState, useCallback } from "react";
// import { Link } from "react-router-dom";
// import { ArrowLeft, Download, TrendingUp, AlertCircle } from "lucide-react";
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import { Label } from "@/components/ui/label";
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
// import { Alert, AlertDescription } from "@/components/ui/alert";
// import { DataTable } from "@/components/ui/data-table";
// import { LoadingSpinner } from "@/components/ui/loadingSpinner";
// import Header from "@/components/header";
// import Footer from "@/components/footer";
// import CancerTypeSelector from "@/components/siteSelector";
// import { useCache } from "@/hooks/use-cache";
// import { PlotlyBarChart } from "@/components/charts/PlotlyBarChart";

// interface NoisyGene {
//   gene_symbol: string;
//   cv_tumor: number;
//   cv_normal: number | null;
//   site_name?: string;
// }

// const GlobalNoiseAnalysis: React.FC = () => {
//   const [scope, setScope] = useState<"global" | "site-specific">("global");
//   const [selectedSites, setSelectedSites] = useState<string[]>([]);
//   const [topN, setTopN] = useState<number>(500);
//   const [normMethod, setNormMethod] = useState<"tpm" | "fpkm" | "fpkm_uq">("tpm");

//   const [tumorGenes, setTumorGenes] = useState<NoisyGene[]>([]);
//   const [normalGenes, setNormalGenes] = useState<NoisyGene[]>([]);
//   const [hasNormalData, setHasNormalData] = useState(false);

//   const [isLoading, setIsLoading] = useState(false);
//   const [error, setError] = useState<string | null>(null);

//   const { getCachedData, setCachedData, generateCacheKey } = useCache<any>();

//   const runAnalysis = useCallback(async () => {
//     if (scope === "site-specific" && selectedSites.length === 0) {
//       setError("Please select at least one cancer site.");
//       return;
//     }

//     setIsLoading(true);
//     setError(null);
//     setTumorGenes([]);
//     setNormalGenes([]);
//     setHasNormalData(false);

//     const cacheKey = generateCacheKey({
//       endpoint: "global-noise-final",
//       scope,
//       sites: selectedSites,
//       topN,
//       norm: normMethod,
//     });

//     const cached = getCachedData(cacheKey);
//     if (cached) {
//       setTumorGenes(cached.tumorGenes);
//       setNormalGenes(cached.normalGenes);
//       setHasNormalData(cached.hasNormalData);
//       setIsLoading(false);
//       return;
//     }

//     try {
//       let url = `/api/top-noisy-genes?norm=${normMethod}&top_n=${topN}`;
//       if (scope === "site-specific") url += `&sites=${selectedSites.join(",")}`;

//       const res = await fetch(url);
//       if (!res.ok) throw new Error(await res.text());
//       const data = await res.json();
//       console.log(data)
//       const genes: NoisyGene[] = (data.genes || []).map((g: any) => ({
//         gene_symbol: g.gene_symbol,
//         cv_tumor: g.cv_tumor,
//         cv_normal: g.cv_normal,
//         site_name: g.site_name || (scope === "global" ? "Pan-Cancer" : undefined),
//       }));

//       // Tumor leaderboard
//       const tumorRanked = genes
//         .filter(g => g.cv_tumor != null)
//         .sort((a, b) => b.cv_tumor - a.cv_tumor)
//         .slice(0, topN);

//       // Normal leaderboard (only if exists)
//       const normalRanked = genes
//         .filter(g => g.cv_normal != null)
//         .sort((a, b) => b.cv_normal! - a.cv_normal!)
//         .slice(0, topN);

//       const hasNormal = normalRanked.length > 0;

//       setTumorGenes(tumorRanked);
//       setNormalGenes(normalRanked);
//       setHasNormalData(hasNormal);

//       setCachedData(cacheKey, {
//         tumorGenes: tumorRanked,
//         normalGenes: normalRanked,
//         hasNormalData: hasNormal,
//       });

//     } catch (err: any) {
//       setError(err.message || "Analysis failed.");
//     } finally {
//       setIsLoading(false);
//     }
//   }, [scope, selectedSites, topN, normMethod, getCachedData, setCachedData, generateCacheKey]);

//   const downloadCSV = (type: "tumor" | "normal") => {
//     const data = type === "tumor" ? tumorGenes : normalGenes;
//     const suffix = type === "tumor" ? "tumor" : "normal";

//     const headers = ["Gene", `CV (${type === "tumor" ? "Tumor" : "Normal"})`, "Site"];
//     const rows = data.map((g, i) => [
//       (i + 1).toString(),
//       g.gene_symbol,
//       type === "tumor" ? g.cv_tumor : (g.cv_normal || 0),
//       g.site_name || "Pan-Cancer",
//     ]);

//     const csv = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
//     const blob = new Blob([csv], { type: "text/csv" });
//     const url = URL.createObjectURL(blob);
//     const a = document.createElement("a");
//     a.href = url;
//     a.download = `top_${topN}_noisy_genes_${suffix}_${scope}_${normMethod}.csv`;
//     a.click();
//     URL.revokeObjectURL(url);
//   };

//   const getScopeLabel = () => scope === "global" ? "Pan-Cancer Analysis" : `${selectedSites.length} Cancer Site(s)`;

//   return (
//     <div className="min-h-screen bg-gray-50 flex flex-col">
//       <Header />
//       <main className="flex-grow">
//         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
//           <Link to="/" className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-4 text-sm">
//             <ArrowLeft className="h-4 w-4 mr-2" /> Back to Dashboard
//           </Link>
//           <h1 className="text-4xl font-bold text-blue-900 mb-8">Global Transcriptional Noise Leaderboard</h1>

//           <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
//             {/* Controls */}
//             <Card className="shadow-xl lg:col-span-1 h-fit">
//               <CardHeader>
//                 <CardTitle className="text-xl text-blue-900">Settings</CardTitle>
//               </CardHeader>
//               <CardContent className="space-y-6">
//                 <div>
//                   <Label>Scope</Label>
//                   <Select value={scope} onValueChange={(v: any) => { setScope(v); setSelectedSites([]); }}>
//                     <SelectTrigger><SelectValue /></SelectTrigger>
//                     <SelectContent>
//                       <SelectItem value="global">Pan-Cancer</SelectItem>
//                       <SelectItem value="site-specific">By Cancer Site</SelectItem>
//                     </SelectContent>
//                   </Select>
//                 </div>

//                 {scope === "site-specific" && (
//                   <div>
//                     <Label>Cancer Sites</Label>
//                     <CancerTypeSelector
//                       selectedSites={selectedSites}
//                       onSitesChange={setSelectedSites}
//                       selectedCancerTypes={[]}
//                       CancerTypes={[]}
//                       onCancerTypesChange={() => {}}
//                       analysisType="cancer-specific"
//                     />
//                   </div>
//                 )}

//                 <div>
//                   <Label>Normalization</Label>
//                   <Select value={normMethod} onValueChange={(v: any) => setNormMethod(v)}>
//                     <SelectTrigger><SelectValue /></SelectTrigger>
//                     <SelectContent>
//                       <SelectItem value="tpm">TPM</SelectItem>
//                       <SelectItem value="fpkm">FPKM</SelectItem>
//                       <SelectItem value="fpkm_uq">FPKM-UQ</SelectItem>
//                     </SelectContent>
//                   </Select>
//                 </div>

//                 <div>
//                   <Label>Top N Genes</Label>
//                   <Input
//                     type="number"
//                     step={100}
//                     value={topN}
//                     onChange={(e) => setTopN(Math.max(50, Math.min(500, parseInt(e.target.value) || 500)))}
//                   />
//                 </div>

//                 <Button
//                   onClick={runAnalysis}
//                   disabled={isLoading || (scope === "site-specific" && selectedSites.length === 0)}
//                   className="w-full bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white font-semibold"
//                   size="lg"
//                 >
//                   {isLoading ? "Running..." : <><TrendingUp className="h-5 w-5 mr-2" /> Run Analysis</>}
//                 </Button>
//               </CardContent>
//             </Card>

//             {/* Results */}
//             <div className="lg:col-span-3 space-y-10">
//               {isLoading && (
//                 <Card><CardContent className="py-16"><LoadingSpinner message="Ranking noisy genes..." /></CardContent></Card>
//               )}

//               {error && (
//                 <Alert variant="destructive">
//                   <AlertCircle className="h-4 w-4" />
//                   <AlertDescription>{error}</AlertDescription>
//                 </Alert>
//               )}

//               {/* Tumor Table */}
//               {tumorGenes.length > 0 && (
//                 <Card className="shadow-xl border-red-200">
//                   <CardHeader>
//                     <div className="flex justify-between items-start">
//                       <div>
//                         <CardTitle className="text-2xl text-red-700">
//                           Top {tumorGenes.length} Noisiest Genes — Tumor Tissue
//                         </CardTitle>
//                         <p className="text-sm text-gray-600 mt-1">{getScopeLabel()} • {normMethod.toUpperCase()}</p>
//                       </div>
//                       <Button onClick={() => downloadCSV("tumor")} variant="outline">
//                         <Download className="h-4 w-4 mr-2" /> Download CSV
//                       </Button>
//                     </div>
//                   </CardHeader>
//                   <CardContent className="space-y-6">
//                     <DataTable
//                       data={tumorGenes.slice(0, 100)}
//                       columns={[
//                         // { header: "Rank", render: (_, __, i) => i + 1 },
//                         { header: "Gene", key: "gene_symbol", sortable: true },
//                         { header: "CV (Tumor)", key: "cv_tumor", render: v => v, sortable: true },
//                         // { header: "Site", render: (_, r) => r.site_name || "Pan-Cancer" },
//                       ]}
//                     />

//                     <PlotlyBarChart
//                       data={tumorGenes.slice(0, 30)}
//                       title="Top 30 Noisiest Genes in Tumor Tissue"
//                       xKey="gene_symbol"
//                       yKey="cv_tumor"
//                       xLabel="Gene"
//                       yLabel="CV (Tumor)"
//                       orientation="v"
//                       colors="#dc2626"
//                       sortByKey="cv_tumor"
//                       sortOrder="desc"
//                     />
//                   </CardContent>
//                 </Card>
//               )}

//               {/* Normal Table — Only if available */}
//               {hasNormalData && normalGenes.length > 0 && (
//                 <Card className="shadow-xl border-green-200">
//                   <CardHeader>
//                     <div className="flex justify-between items-start">
//                       <div>
//                         <CardTitle className="text-2xl text-green-700">
//                           Top {normalGenes.length} Noisiest Genes — Normal Tissue
//                         </CardTitle>
//                         <p className="text-sm text-gray-600 mt-1">Matched normal samples • {normMethod.toUpperCase()}</p>
//                       </div>
//                       <Button onClick={() => downloadCSV("normal")} variant="outline">
//                         <Download className="h-4 w-4 mr-2" /> Download CSV
//                       </Button>
//                     </div>
//                   </CardHeader>
//                   <CardContent className="space-y-6">
//                     <DataTable
//                       data={normalGenes.slice(0, 100)}
//                       columns={[
//                         // { header: "Rank", render: (_, __, i) => i + 1 },
//                         { header: "Gene", key: "gene_symbol", sortable: true },
//                         { header: "CV (Normal)", render: (_, r) => r.cv_normal || "—", sortable: true },
//                         // { header: "Site", render: (_, r) => r.site_name || "Pan-Cancer" },
//                       ]}
//                     />

//                     <PlotlyBarChart
//                       data={normalGenes.slice(0, 30)}
//                       title="Top 30 Noisiest Genes in Normal Tissue"
//                       xKey="gene_symbol"
//                       yKey="cv_normal"
//                       xLabel="Gene"
//                       yLabel="CV (Normal)"
//                       orientation="v"
//                       colors="#10b981bd"
//                       sortByKey="cv_normal"
//                       sortOrder="desc"
//                     />
//                   </CardContent>
//                 </Card>
//               )}

//               {!hasNormalData && tumorGenes.length > 0 && (
//                 <Alert className="border-amber-200 bg-amber-50">
//                   <AlertCircle className="h-4 w-4" />
//                   <AlertDescription>
//                     No matched normal tissue data available for this selection.
//                   </AlertDescription>
//                 </Alert>
//               )}
              
//             </div>
//           </div>
//         </div>
//       </main>
//       <Footer />
//     </div>
//   );
// };

// export default GlobalNoiseAnalysis;
// // 'use client';

// // import React, { useState, useCallback } from "react";
// // import { Link } from "react-router-dom";
// // import { ArrowLeft, Download, TrendingUp, AlertCircle } from "lucide-react";
// // import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// // import { Button } from "@/components/ui/button";
// // import { Input } from "@/components/ui/input";
// // import { Label } from "@/components/ui/label";
// // import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
// // import { Alert, AlertDescription } from "@/components/ui/alert";
// // import { DataTable } from "@/components/ui/data-table";
// // import { LoadingSpinner } from "@/components/ui/loadingSpinner";
// // import Header from "@/components/header";
// // import Footer from "@/components/footer";
// // import CancerTypeSelector from "@/components/siteSelector";
// // import { useCache } from "@/hooks/use-cache";
// // import { PlotlyBarChart } from "@/components/charts/PlotlyBarChart";

// // interface NoisyGene {
// //   gene_symbol: string;
// //   cv_tumor: number;
// //   cv_normal: number | null;
// //   site_name?: string;
// // }

// // const GlobalNoiseAnalysis: React.FC = () => {
// //   const [scope, setScope] = useState<"global" | "site-specific">("global");
// //   const [selectedSites, setSelectedSites] = useState<string[]>([]);
// //   const [topN, setTopN] = useState<number>(500);
// //   const [normMethod, setNormMethod] = useState<"tpm" | "fpkm" | "fpkm_uq">("tpm");

// //   const [tumorGenes, setTumorGenes] = useState<NoisyGene[]>([]);
// //   const [normalGenes, setNormalGenes] = useState<NoisyGene[]>([]);
// //   const [hasNormalData, setHasNormalData] = useState(false);

// //   const [isLoading, setIsLoading] = useState(false);
// //   const [error, setError] = useState<string | null>(null);

// //   const { getCachedData, setCachedData, generateCacheKey } = useCache<any>();

// //   const runAnalysis = useCallback(async () => {
// //     if (scope === "site-specific" && selectedSites.length === 0) {
// //       setError("Please select at least one cancer site.");
// //       return;
// //     }

// //     setIsLoading(true);
// //     setError(null);
// //     setTumorGenes([]);
// //     setNormalGenes([]);
// //     setHasNormalData(false);

// //     const cacheKey = generateCacheKey({
// //       endpoint: "global-noise-final",
// //       scope,
// //       sites: selectedSites,
// //       topN,
// //       norm: normMethod,
// //     });

// //     const cached = getCachedData(cacheKey);
// //     if (cached) {
// //       setTumorGenes(cached.tumorGenes);
// //       setNormalGenes(cached.normalGenes);
// //       setHasNormalData(cached.hasNormalData);
// //       setIsLoading(false);
// //       return;
// //     }

// //     try {
// //       let url = `/api/top-noisy-genes?norm=${normMethod}&top_n=${topN}`;
// //       if (scope === "site-specific") url += `&sites=${selectedSites.join(",")}`;

// //       const res = await fetch(url);
// //       if (!res.ok) throw new Error(await res.text());
// //       const data = await res.json();
// //       console.log(data)
// //       const genes: NoisyGene[] = (data.genes || []).map((g: any) => ({
// //         gene_symbol: g.gene_symbol,
// //         cv_tumor: g.cv_tumor,
// //         cv_normal: g.cv_normal,
// //         site_name: g.site_name || (scope === "global" ? "Pan-Cancer" : undefined),
// //       }));

// //       // Tumor leaderboard
// //       const tumorRanked = genes
// //         .filter(g => g.cv_tumor != null)
// //         .sort((a, b) => b.cv_tumor - a.cv_tumor)
// //         .slice(0, topN);

// //       // Normal leaderboard (only if exists)
// //       const normalRanked = genes
// //         .filter(g => g.cv_normal != null)
// //         .sort((a, b) => b.cv_normal! - a.cv_normal!)
// //         .slice(0, topN);

// //       const hasNormal = normalRanked.length > 0;

// //       setTumorGenes(tumorRanked);
// //       setNormalGenes(normalRanked);
// //       setHasNormalData(hasNormal);

// //       setCachedData(cacheKey, {
// //         tumorGenes: tumorRanked,
// //         normalGenes: normalRanked,
// //         hasNormalData: hasNormal,
// //       });

// //     } catch (err: any) {
// //       setError(err.message || "Analysis failed.");
// //     } finally {
// //       setIsLoading(false);
// //     }
// //   }, [scope, selectedSites, topN, normMethod, getCachedData, setCachedData, generateCacheKey]);

// //   const downloadCSV = (type: "tumor" | "normal") => {
// //     const data = type === "tumor" ? tumorGenes : normalGenes;
// //     const suffix = type === "tumor" ? "tumor" : "normal";

// //     const headers = ["Gene", `CV (${type === "tumor" ? "Tumor" : "Normal"})`, "Site"];
// //     const rows = data.map((g, i) => [
// //       (i + 1).toString(),
// //       g.gene_symbol,
// //       type === "tumor" ? g.cv_tumor : (g.cv_normal || 0),
// //       g.site_name || "Pan-Cancer",
// //     ]);

// //     const csv = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
// //     const blob = new Blob([csv], { type: "text/csv" });
// //     const url = URL.createObjectURL(blob);
// //     const a = document.createElement("a");
// //     a.href = url;
// //     a.download = `top_${topN}_noisy_genes_${suffix}_${scope}_${normMethod}.csv`;
// //     a.click();
// //     URL.revokeObjectURL(url);
// //   };

// //   const getScopeLabel = () => scope === "global" ? "Pan-Cancer Analysis" : `${selectedSites.length} Cancer Site(s)`;

// //   return (
// //     <div className="min-h-screen bg-gray-50 flex flex-col">
// //       <Header />
// //       <main className="flex-grow">
// //         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
// //           <Link to="/" className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-4 text-sm">
// //             <ArrowLeft className="h-4 w-4 mr-2" /> Back to Dashboard
// //           </Link>
// //           <h1 className="text-4xl font-bold text-blue-900 mb-8">Global Transcriptional Noise Leaderboard</h1>

// //           <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
// //             {/* Controls */}
// //             <Card className="shadow-xl lg:col-span-1 h-fit">
// //               <CardHeader>
// //                 <CardTitle className="text-xl text-blue-900">Settings</CardTitle>
// //               </CardHeader>
// //               <CardContent className="space-y-6">
// //                 <div>
// //                   <Label>Scope</Label>
// //                   <Select value={scope} onValueChange={(v: any) => { setScope(v); setSelectedSites([]); }}>
// //                     <SelectTrigger><SelectValue /></SelectTrigger>
// //                     <SelectContent>
// //                       <SelectItem value="global">Pan-Cancer</SelectItem>
// //                       <SelectItem value="site-specific">By Cancer Site</SelectItem>
// //                     </SelectContent>
// //                   </Select>
// //                 </div>

// //                 {scope === "site-specific" && (
// //                   <div>
// //                     <Label>Cancer Sites</Label>
// //                     <CancerTypeSelector
// //                       selectedSites={selectedSites}
// //                       onSitesChange={setSelectedSites}
// //                       selectedCancerTypes={[]}
// //                       CancerTypes={[]}
// //                       onCancerTypesChange={() => {}}
// //                       analysisType="cancer-specific"
// //                     />
// //                   </div>
// //                 )}

// //                 <div>
// //                   <Label>Normalization</Label>
// //                   <Select value={normMethod} onValueChange={(v: any) => setNormMethod(v)}>
// //                     <SelectTrigger><SelectValue /></SelectTrigger>
// //                     <SelectContent>
// //                       <SelectItem value="tpm">TPM</SelectItem>
// //                       <SelectItem value="fpkm">FPKM</SelectItem>
// //                       <SelectItem value="fpkm_uq">FPKM-UQ</SelectItem>
// //                     </SelectContent>
// //                   </Select>
// //                 </div>

// //                 <div>
// //                   <Label>Top N Genes</Label>
// //                   <Input
// //                     type="number"
// //                     value={topN}
// //                     onChange={(e) => setTopN(Math.max(50, Math.min(2000, parseInt(e.target.value) || 500)))}
// //                   />
// //                 </div>

// //                 <Button
// //                   onClick={runAnalysis}
// //                   disabled={isLoading || (scope === "site-specific" && selectedSites.length === 0)}
// //                   className="w-full bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white font-semibold"
// //                   size="lg"
// //                 >
// //                   {isLoading ? "Running..." : <><TrendingUp className="h-5 w-5 mr-2" /> Run Analysis</>}
// //                 </Button>
// //               </CardContent>
// //             </Card>

// //             {/* Results */}
// //             <div className="lg:col-span-3 space-y-10">
// //               {isLoading && (
// //                 <Card><CardContent className="py-16"><LoadingSpinner message="Ranking noisy genes..." /></CardContent></Card>
// //               )}

// //               {error && (
// //                 <Alert variant="destructive">
// //                   <AlertCircle className="h-4 w-4" />
// //                   <AlertDescription>{error}</AlertDescription>
// //                 </Alert>
// //               )}

// //               {/* Tumor Table */}
// //               {tumorGenes.length > 0 && (
// //                 <Card className="shadow-xl border-red-200">
// //                   <CardHeader>
// //                     <div className="flex justify-between items-start">
// //                       <div>
// //                         <CardTitle className="text-2xl text-red-700">
// //                           Top {tumorGenes.length} Noisiest Genes — Tumor Tissue
// //                         </CardTitle>
// //                         <p className="text-sm text-gray-600 mt-1">{getScopeLabel()} • {normMethod.toUpperCase()}</p>
// //                       </div>
// //                       <Button onClick={() => downloadCSV("tumor")} variant="outline">
// //                         <Download className="h-4 w-4 mr-2" /> Download CSV
// //                       </Button>
// //                     </div>
// //                   </CardHeader>
// //                   <CardContent className="space-y-6">
// //                     <DataTable
// //                       data={tumorGenes.slice(0, 100)}
// //                       columns={[
// //                         // { header: "Rank", render: (_, __, i) => i + 1 },
// //                         { header: "Gene", key: "gene_symbol", sortable: true },
// //                         { header: "CV (Tumor)", key: "cv_tumor", render: v => v, sortable: true },
// //                         // { header: "Site", render: (_, r) => r.site_name || "Pan-Cancer" },
// //                       ]}
// //                     />

// //                     <PlotlyBarChart
// //                       data={tumorGenes.slice(0, 30)}
// //                       title="Top 30 Noisiest Genes in Tumor Tissue"
// //                       xKey="gene_symbol"
// //                       yKey="cv_tumor"
// //                       xLabel="Gene"
// //                       yLabel="CV (Tumor)"
// //                       orientation="h"
// //                       colors="#dc2626"
// //                       sortByKey="cv_tumor"
// //                       sortOrder="desc"
// //                     />
// //                   </CardContent>
// //                 </Card>
// //               )}

// //               {/* Normal Table — Only if available */}
// //               {/* {hasNormalData && normalGenes.length > 0 && (
// //                 <Card className="shadow-xl border-green-200">
// //                   <CardHeader>
// //                     <div className="flex justify-between items-start">
// //                       <div>
// //                         <CardTitle className="text-2xl text-green-700">
// //                           Top {normalGenes.length} Noisiest Genes — Normal Tissue
// //                         </CardTitle>
// //                         <p className="text-sm text-gray-600 mt-1">Matched normal samples • {normMethod.toUpperCase()}</p>
// //                       </div>
// //                       <Button onClick={() => downloadCSV("normal")} variant="outline">
// //                         <Download className="h-4 w-4 mr-2" /> Download CSV
// //                       </Button>
// //                     </div>
// //                   </CardHeader>
// //                   <CardContent className="space-y-6">
// //                     <DataTable
// //                       data={normalGenes.slice(0, 100)}
// //                       columns={[
// //                         // { header: "Rank", render: (_, __, i) => i + 1 },
// //                         { header: "Gene", key: "gene_symbol", sortable: true },
// //                         { header: "CV (Normal)", render: (_, r) => r.cv_normal || "—", sortable: true },
// //                         // { header: "Site", render: (_, r) => r.site_name || "Pan-Cancer" },
// //                       ]}
// //                     />

// //                     <PlotlyBarChart
// //                       data={normalGenes.slice(0, 30)}
// //                       title="Top 30 Noisiest Genes in Normal Tissue"
// //                       xKey="gene_symbol"
// //                       yKey="cv_normal"
// //                       xLabel="Gene"
// //                       yLabel="CV (Normal)"
// //                       orientation="h"
// //                       colors="#16a34a"
// //                       sortByKey="cv_normal"
// //                       sortOrder="desc"
// //                     />
// //                   </CardContent>
// //                 </Card>
// //               )}

// //               {!hasNormalData && tumorGenes.length > 0 && (
// //                 <Alert className="border-amber-200 bg-amber-50">
// //                   <AlertCircle className="h-4 w-4" />
// //                   <AlertDescription>
// //                     No matched normal tissue data available for this selection.
// //                   </AlertDescription>
// //                 </Alert>
// //               )} */}
// //             </div>
// //           </div>
// //         </div>
// //       </main>
// //       <Footer />
// //     </div>
// //   );
// // };

// // export default GlobalNoiseAnalysis;
// // // // import React, { useState, useEffect, useCallback, useMemo } from "react";
// // // // import { Link } from "react-router-dom";
// // // // import { ArrowLeft, Download, Activity, TrendingUp } from "lucide-react";
// // // // import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// // // // import { Button } from "@/components/ui/button";
// // // // import { Input } from "@/components/ui/input";
// // // // import { Label } from "@/components/ui/label";
// // // // import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
// // // // import { DataTable } from "@/components/ui/data-table";
// // // // import { LoadingSpinner } from "@/components/ui/loadingSpinner";
// // // // import Header from "@/components/header";
// // // // import Footer from "@/components/footer";
// // // // import CancerTypeSelector from "@/components/siteSelector";
// // // // import { useCache } from "@/hooks/use-cache";
// // // // import { PlotlyHeatmap } from "@/components/charts/index";

// // // // interface TopNoisyGene {
// // // //   gene: string;
// // // //   cv_tumor: number;
// // // //   cv_normal: number | null;
// // // //   logfc: number | null;
// // // //   site?: string;
// // // // }

// // // // interface EnrichmentResult {
// // // //   Term: string;
// // // //   Database: string;
// // // //   FDR: number;
// // // //   MatchingGenes: string[];
// // // //   Description?: string;
// // // //   GeneCount?: number;
// // // // }

// // // // const GlobalNoiseAnalysis: React.FC = () => {
// // // //   const [selectedSites, setSelectedSites] = useState<string[]>([]);
// // // //   const [selectedCancerTypes, setSelectedCancerTypes] = useState<string[]>([]);
// // // //   const [topN, setTopN] = useState<number>(500);
// // // //   const [scope, setScope] = useState<"global" | "per-site">("global");
// // // //   const [isLoading, setIsLoading] = useState(false);
// // // //   const [error, setError] = useState<string | null>(null);

// // // //   const [topGenes, setTopGenes] = useState<TopNoisyGene[]>([]);
// // // //   const [enrichment, setEnrichment] = useState<EnrichmentResult[]>([]);
// // // //   const [availableSites, setAvailableSites] = useState<{ id: number; name: string }[]>([]);

// // // //   const { getCachedData, setCachedData, generateCacheKey } = useCache<any>();

// // // //   // Fetch available sites
// // // //   useEffect(() => {
// // // //     fetch("/api/available-sites")
// // // //       .then(r => r.json())
// // // //       .then(data => setAvailableSites(data.available_sites || []));
// // // //   }, []);

// // // //   // Main analysis
// // // //   const runAnalysis = useCallback(async () => {
// // // //     if (scope === "per-site" && selectedSites.length === 0) {
// // // //       setError("Please select at least one cancer site.");
// // // //       return;
// // // //     }

// // // //     setIsLoading(true);
// // // //     setError(null);
// // // //     setTopGenes([]);
// // // //     setEnrichment([]);

// // // //     const cacheKey = generateCacheKey({
// // // //       endpoint: "global-noise",
// // // //       sites: selectedSites,
// // // //       cancerTypes: selectedCancerTypes,
// // // //       topN,
// // // //       scope,
// // // //     });

// // // //     const cached = getCachedData(cacheKey);
// // // //     if (cached) {
// // // //       setTopGenes(cached.topGenes);
// // // //       setEnrichment(cached.enrichment);
// // // //       setIsLoading(false);
// // // //       return;
// // // //     }

// // // //     try {
// // // //       const body: any = {
// // // //         top_n: topN,
// // // //         mode: "noise",
// // // //         cancer: scope === "global" ? "all" : selectedSites.join(","),
// // // //         cancer_types: selectedCancerTypes.length > 0 ? selectedCancerTypes.join(",") : undefined,
// // // //       };

// // // //       const res = await fetch("/api/top-noisy-genes", {
// // // //         method: "POST",
// // // //         headers: { "Content-Type": "application/json" },
// // // //         body: JSON.stringify(body),
// // // //       });

// // // //       if (!res.ok) throw new Error(await res.text());

// // // //       const data = await res.json();

// // // //       const genes: TopNoisyGene[] = scope === "global"
// // // //         ? data.genes.map((g: any) => ({
// // // //             gene: g.gene,
// // // //             cv_tumor: g.cv_tumor,
// // // //             cv_normal: g.cv_normal,
// // // //             logfc: g.logfc,
// // // //           }))
// // // //         : selectedSites.flatMap((site: string) =>
// // // //             (data.genes[site] || []).map((g: any) => ({
// // // //               gene: g.gene,
// // // //               cv_tumor: g.cv_tumor,
// // // //               cv_normal: g.cv_normal,
// // // //               logfc: g.logfc,
// // // //               site,
// // // //             }))
// // // //           );

// // // //       // Run enrichment on top genes
// // // //       const geneList = genes.map(g => g.gene);
// // // //       const enrichRes = await fetch("/api/enriched-pathways", {
// // // //         method: "POST",
// // // //         headers: { "Content-Type": "application/json" },
// // // //         body: JSON.stringify({
// // // //           genes: geneList,
// // // //           mode: "enrichment",
// // // //           top_n: 100,
// // // //         }),
// // // //       });

// // // //       const enrichData = enrichRes.ok ? await enrichRes.json() : { raw: { enrichment: [] } };
// // // //       const enriched = (enrichData.raw?.enrichment || []).map((e: any) => ({
// // // //         Term: e.Term,
// // // //         Database: e.Database,
// // // //         FDR: e.FDR,
// // // //         MatchingGenes: e.MatchingGenes || [],
// // // //         Description: e.Description || e.Term,
// // // //         GeneCount: e.GeneCount || e.MatchingGenes?.length || 0,
// // // //       }));

// // // //       const payload = { topGenes: genes, enrichment: enriched };
// // // //       setCachedData(cacheKey, payload);
// // // //       setTopGenes(genes);
// // // //       setEnrichment(enriched);
// // // //     } catch (err: any) {
// // // //       setError(err.message || "Analysis failed");
// // // //     } finally {
// // // //       setIsLoading(false);
// // // //     }
// // // //   }, [selectedSites, selectedCancerTypes, topN, scope, getCachedData, setCachedData, generateCacheKey]);

// // // //   const formatFDR = (fdr: number) => fdr < 0.001 ? fdr.toExponential(2) : fdr.toFixed(4);

// // // //   const downloadTopGenes = () => {
// // // //     const headers = scope === "global"
// // // //       ? ["Gene", "CV_Tumor", "CV_Normal", "LogFC_CV"]
// // // //       : ["Site", "Gene", "CV_Tumor", "CV_Normal", "LogFC_CV"];

// // // //     const rows = topGenes.map(g =>
// // // //       scope === "global"
// // // //         ? [g.gene, g.cv_tumor.toFixed(4), g.cv_normal?.toFixed(4) || "NA", g.logfc?.toFixed(3) || "NA"]
// // // //         : [g.site, g.gene, g.cv_tumor.toFixed(4), g.cv_normal?.toFixed(4) || "NA", g.logfc?.toFixed(3) || "NA"]
// // // //     );

// // // //     const csv = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
// // // //     const blob = new Blob([csv], { type: "text/csv" });
// // // //     const url = URL.createObjectURL(blob);
// // // //     const a = document.createElement("a");
// // // //     a.href = url;
// // // //     a.download = `top_${topN}_noisy_genes_${scope}.csv`;
// // // //     a.click();
// // // //     URL.revokeObjectURL(url);
// // // //   };

// // // //   return (
// // // //     <div className="min-h-screen bg-white flex flex-col">
// // // //       <Header />
// // // //       <main className="flex-grow">
// // // //         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
// // // //           <Link to="/" className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-6">
// // // //             <ArrowLeft className="h-4 w-4 mr-2" />
// // // //             Back to Home
// // // //           </Link>

// // // //           <div className="mb-8">
// // // //             <h1 className="text-4xl font-bold text-blue-900 mb-3">
// // // //               Global Noise Leaderboard
// // // //             </h1>
// // // //             <p className="text-lg text-blue-700">
// // // //               Discover the most transcriptionally noisy genes across cancer types and perform pathway enrichment.
// // // //             </p>
// // // //           </div>

// // // //           <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
// // // //             <Card className="shadow-lg">
// // // //               <CardHeader>
// // // //                 <CardTitle className="text-xl text-blue-800">Analysis Scope</CardTitle>
// // // //               </CardHeader>
// // // //               <CardContent className="space-y-4">
// // // //                 <div>
// // // //                   <Label>Scope</Label>
// // // //                   <Select value={scope} onValueChange={(v: any) => setScope(v)}>
// // // //                     <SelectTrigger>
// // // //                       <SelectValue />
// // // //                     </SelectTrigger>
// // // //                     <SelectContent>
// // // //                       <SelectItem value="global">Global (Pan-Cancer)</SelectItem>
// // // //                       <SelectItem value="per-site">Per Cancer Site</SelectItem>
// // // //                     </SelectContent>
// // // //                   </Select>
// // // //                 </div>

// // // //                 {scope === "per-site" && (
// // // //                   <div>
// // // //                     <Label>Cancer Sites</Label>
// // // //                     <CancerTypeSelector
// // // //                       selectedSites={selectedSites}
// // // //                       onSitesChange={setSelectedSites}
// // // //                       selectedCancerTypes={selectedCancerTypes}
// // // //                       CancerTypes={selectedCancerTypes}
// // // //                       onCancerTypesChange={setSelectedCancerTypes}
// // // //                       analysisType="pan-cancer"
// // // //                     />
// // // //                   </div>
// // // //                 )}

// // // //                 <div>
// // // //                   <Label htmlFor="topn">Top N Noisiest Genes</Label>
// // // //                   <Input
// // // //                     id="topn"
// // // //                     type="number"
// // // //                     min="10"
// // // //                     max="2000"
// // // //                     value={topN}
// // // //                     onChange={(e) => setTopN(parseInt(e.target.value) || 500)}
// // // //                     className="mt-1"
// // // //                   />
// // // //                 </div>

// // // //                 <Button
// // // //                   onClick={runAnalysis}
// // // //                   disabled={isLoading || (scope === "per-site" && selectedSites.length === 0)}
// // // //                   className="w-full"
// // // //                 >
// // // //                   {isLoading ? (
// // // //                     <>Running Analysis...</>
// // // //                   ) : (
// // // //                     <>
// // // //                       <TrendingUp className="h-4 w-4 mr-2" />
// // // //                       Find Top Noisy Genes
// // // //                     </>
// // // //                   )}
// // // //                 </Button>
// // // //               </CardContent>
// // // //             </Card>

// // // //             <div className="lg:col-span-2 space-y-6">
// // // //               {isLoading && <LoadingSpinner message="Computing top noisy genes and enrichment..." />}

// // // //               {error && (
// // // //                 <Card className="border-red-200 bg-red-50">
// // // //                   <CardContent className="pt-6 text-red-700">{error}</CardContent>
// // // //                 </Card>
// // // //               )}

// // // //               {topGenes.length > 0 && (
// // // //                 <>
// // // //                   <Card className="shadow-lg">
// // // //                     <CardHeader>
// // // //                       <CardTitle className="flex justify-between items-center">
// // // //                         Top {topN} Noisiest Genes ({scope === "global" ? "Pan-Cancer" : "Selected Sites"})
// // // //                         <Button variant="outline" size="sm" onClick={downloadTopGenes}>
// // // //                           <Download className="h-4 w-4 mr-2" /> CSV
// // // //                         </Button>
// // // //                       </CardTitle>
// // // //                     </CardHeader>
// // // //                     <CardContent>
// // // //                       <DataTable
// // // //                         data={topGenes.slice(0, 100)}
// // // //                         columns={[
// // // //                           scope === "per-site" ? { key: "site", header: "Site" } : null,
// // // //                           { key: "gene", header: "Gene", sortable: true },
// // // //                           { key: "cv_tumor", header: "CV Tumor", render: (v) => v.toFixed(4), sortable: true },
// // // //                           { key: "cv_normal", header: "CV Normal", render: (v) => v == null ? "—" : v.toFixed(4) },
// // // //                           { key: "logfc", header: "LogFC (CV)", render: (v) => v == null ? "—" : v.toFixed(3) },
// // // //                         ].filter(Boolean) as any}
// // // //                         containerWidth="100%"
// // // //                         scrollHeight="500px"
// // // //                       />
// // // //                     </CardContent>
// // // //                   </Card>

// // // //                   {enrichment.length > 0 && (
// // // //                     <Card className="shadow-lg">
// // // //                       <CardHeader>
// // // //                         <CardTitle>Enriched Pathways in Top Noisy Genes</CardTitle>
// // // //                       </CardHeader>
// // // //                       <CardContent>
// // // //                         <DataTable
// // // //                           data={enrichment
// // // //                             .sort((a, b) => a.FDR - b.FDR)
// // // //                             .slice(0, 50)}
// // // //                           columns={[
// // // //                             { key: "Description", header: "Pathway", render: (_, r) => r.Description || r.Term },
// // // //                             { key: "Database", header: "Database" },
// // // //                             { key: "FDR", header: "FDR", render: (v) => formatFDR(v), sortable: true },
// // // //                             { key: "GeneCount", header: "Genes", render: (v) => v || "?" },
// // // //                           ]}
// // // //                           containerWidth="100%"
// // // //                           scrollHeight="500px"
// // // //                         />
// // // //                       </CardContent>
// // // //                     </Card>
// // // //                   )}
// // // //                 </>
// // // //               )}
// // // //             </div>
// // // //           </div>
// // // //         </div>
// // // //       </main>
// // // //       <Footer />
// // // //     </div>
// // // //   );
// // // // };

// // // // export default GlobalNoiseAnalysis;
// // // 'use client';

// // // import React, { useState, useEffect, useCallback } from "react";
// // // import { Link } from "react-router-dom";
// // // import { ArrowLeft, Download, TrendingUp, Activity, AlertCircle } from "lucide-react";
// // // import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// // // import { Button } from "@/components/ui/button";
// // // import { Input } from "@/components/ui/input";
// // // import { Label } from "@/components/ui/label";
// // // import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
// // // import { Alert, AlertDescription } from "@/components/ui/alert";
// // // import { DataTable } from "@/components/ui/data-table";
// // // import { LoadingSpinner } from "@/components/ui/loadingSpinner";
// // // import Header from "@/components/header";
// // // import Footer from "@/components/footer";
// // // import CancerTypeSelector from "@/components/siteSelector";
// // // import { useCache } from "@/hooks/use-cache";

// // // interface NoisyGene {
// // //   gene_symbol: string;
// // //   cv: number;
// // //   norm: "tpm" | "fpkm" | "fpkm_uq";
// // //   sample_type: "tumor" | "normal";
// // //   site_name?: string;
// // // }

// // // interface EnrichmentResult {
// // //   id: string;
// // //   value: string;
// // //   label: string;
// // //   category: string;
// // //   description?: string;
// // //   genes: string[];
// // // }

// // // const GlobalNoiseAnalysis: React.FC = () => {
// // //   const [scope, setScope] = useState<"global" | "site-specific" | "project-specific">("global");
// // //   const [selectedSites, setSelectedSites] = useState<string[]>([]);
// // //   const [selectedCancerTypes, setSelectedCancerTypes] = useState<string[]>([]);
// // //   const [topN, setTopN] = useState<number>(500);
// // //   const [normMethod, setNormMethod] = useState<"tpm" | "fpkm" | "fpkm_uq">("tpm");

// // //   const [topGenes, setTopGenes] = useState<NoisyGene[]>([]);
// // //   const [enrichment, setEnrichment] = useState<EnrichmentResult[]>([]);
// // //   const [isLoading, setIsLoading] = useState(false);
// // //   const [error, setError] = useState<string | null>(null);

// // //   const { getCachedData, setCachedData, generateCacheKey } = useCache<any>();

// // //   const runAnalysis = useCallback(async () => {
// // //     // Validation
// // //     if (scope === "site-specific" && selectedSites.length === 0) {
// // //       setError("Please select at least one cancer site.");
// // //       return;
// // //     }
// // //     if (scope === "project-specific" && selectedCancerTypes.length === 0) {
// // //       setError("Please select at least one TCGA project.");
// // //       return;
// // //     }

// // //     setIsLoading(true);
// // //     setError(null);
// // //     setTopGenes([]);
// // //     setEnrichment([]);

// // //     const cacheKey = generateCacheKey({
// // //       endpoint: "global-noise-v2",
// // //       scope,
// // //       sites: selectedSites,
// // //       projects: selectedCancerTypes,
// // //       topN,
// // //       norm: normMethod,
// // //     });

// // //     const cached = getCachedData(cacheKey);
// // //     if (cached) {
// // //       setTopGenes(cached.topGenes);
// // //       setEnrichment(cached.enrichment);
// // //       setIsLoading(false);
// // //       return;
// // //     }

// // //     try {
// // //       let url = `/api/top-noisy-genes?norm=${normMethod}&top_n=${topN}`;

// // //       if (scope === "site-specific") {
// // //         url += `&sites=${selectedSites.join(",")}`;
// // //       } else if (scope === "project-specific") {
// // //         url += `&tcga_codes=${selectedCancerTypes.join(",")}`;
// // //       }
// // //       // global = no extra param

// // //       const noisyRes = await fetch(url);
// // //       if (!noisyRes.ok) {
// // //         const err = await noisyRes.text();
// // //         throw new Error(`Failed to fetch noisy genes: ${err}`);
// // //       }
// // //       const noisyData = await noisyRes.json();

// // //       const genes: NoisyGene[] = (noisyData.genes || []).map((g: any) => ({
// // //         gene_symbol: g.gene_symbol,
// // //         cv: g.cv,
// // //         norm: g.norm,
// // //         sample_type: g.sample_type,
// // //         site_name: g.site_name,
// // //       }));

// // //       const tumorGenes = genes
// // //         .filter(g => g.sample_type === "tumor")
// // //         .sort((a, b) => b.cv - a.cv)
// // //         .slice(0, topN);

// // //       setTopGenes(tumorGenes);

// // //       // Run enrichment if we have genes
// // //       if (tumorGenes.length > 0) {
// // //         const geneList = [...new Set(tumorGenes.map(g => g.gene_symbol))];
// // //         const enrichRes = await fetch("/api/enriched-pathways", {
// // //           method: "POST",
// // //           headers: { "Content-Type": "application/json" },
// // //           body: JSON.stringify({ genes: geneList }),
// // //         });

// // //         if (enrichRes.ok) {
// // //           const enrichData: EnrichmentResult[] = await enrichRes.json();
// // //           setEnrichment(enrichData);
// // //         }
// // //       }

// // //       setCachedData(cacheKey, { topGenes: tumorGenes, enrichment });
// // //     } catch (err: any) {
// // //       setError(err.message || "Analysis failed. Please try again.");
// // //       console.error(err);
// // //     } finally {
// // //       setIsLoading(false);
// // //     }
// // //   }, [
// // //     scope,
// // //     selectedSites,
// // //     selectedCancerTypes,
// // //     topN,
// // //     normMethod,
// // //     getCachedData,
// // //     setCachedData,
// // //     generateCacheKey,
// // //   ]);

// // //   const downloadCSV = () => {
// // //     const headers = ["Rank", "Gene", "CV (Tumor)", "Site", "Normalization"];
// // //     const rows = topGenes.map((g, i) => [
// // //       i + 1,
// // //       g.gene_symbol,
// // //       g.cv.toFixed(4),
// // //       g.site_name || "Pan-Cancer",
// // //       g.norm,
// // //     ]);

// // //     const csv = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
// // //     const blob = new Blob([csv], { type: "text/csv" });
// // //     const url = URL.createObjectURL(blob);
// // //     const a = document.createElement("a");
// // //     a.href = url;
// // //     a.download = `noisy_genes_${scope}_top${topN}_${normMethod}.csv`;
// // //     a.click();
// // //     URL.revokeObjectURL(url);
// // //   };

// // //   const getScopeLabel = () => {
// // //     switch (scope) {
// // //       case "global": return "Pan-Cancer";
// // //       case "site-specific": return `Site-Specific (${selectedSites.length} sites)`;
// // //       case "project-specific": return `Project-Specific (${selectedCancerTypes.length} projects)`;
// // //     }
// // //   };

// // //   return (
// // //     <div className="min-h-screen bg-gray-50 flex flex-col">
// // //       <Header />
// // //       <main className="flex-grow">
// // //         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
// // //           <Link to="/" className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-2 text-sm">
// // //             <ArrowLeft className="h-4 w-4 mr-2" /> Back to Dashboard
// // //           </Link>
// // //           <div className="mb-2">
// // //             <div className="flex items-center justify-between mb-6">
// // //               <h2 className="text-4xl font-bold text-blue-900">Global Noise Analysis</h2>
// // //                 </div>
// // //           </div>

          

// // //           <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
// // //             {/* Controls */}
// // //             <Card className="shadow-xl lg:col-span-1 h-fit">
// // //               <CardHeader>
// // //                 <CardTitle className="text-xl text-blue-900">Analysis Settings</CardTitle>
// // //               </CardHeader>
// // //               <CardContent className="space-y-6">
// // //                 <div>
// // //                   <Label>Analysis Scope</Label>
// // //                   <Select value={scope} onValueChange={(v: any) => {
// // //                     setScope(v);
// // //                     setSelectedSites([]);
// // //                     setSelectedCancerTypes([]);
// // //                   }}>
// // //                     <SelectTrigger>
// // //                       <SelectValue />
// // //                     </SelectTrigger>
// // //                     <SelectContent>
// // //                       <SelectItem value="global">Pan-Cancer</SelectItem>
// // //                       <SelectItem value="site-specific">By Cancer Site</SelectItem>
// // //                     </SelectContent>
// // //                   </Select>
// // //                 </div>

// // //                 {(scope === "site-specific" || scope === "project-specific") && (
// // //                   <div className="space-y-4">
// // //                     {/* <CancerTypeSelector
// // //                       selectedCancerTypes={selectedCancerTypes}
// // //                       onCancerTypesChange={setSelectedCancerTypes}
// // //                       selectedSites={selectedSites}
// // //                       onSitesChange={setSelectedSites}
// // //                       analysisType={scope === "project-specific" ? "pan-cancer" : "cancer-specific"}
// // //                     /> */}
// // //                     <CancerTypeSelector
// // //                       selectedSites={selectedSites}
// // //                       onSitesChange={setSelectedSites}
// // //                       selectedCancerTypes={selectedCancerTypes}
// // //                       CancerTypes={selectedCancerTypes}
// // //                       onCancerTypesChange={setSelectedCancerTypes}
// // //                       analysisType={scope === "project-specific" ? "pan-cancer" : "cancer-specific"}
// // //                     />
// // //                   </div>
// // //                 )}

// // //                 <div>
// // //                   <Label>Normalization</Label>
// // //                   <Select value={normMethod} onValueChange={(v: any) => setNormMethod(v)}>
// // //                     <SelectTrigger>
// // //                       <SelectValue />
// // //                     </SelectTrigger>
// // //                     <SelectContent>
// // //                       <SelectItem value="tpm">TPM</SelectItem>
// // //                       <SelectItem value="fpkm">FPKM</SelectItem>
// // //                       <SelectItem value="fpkm_uq">FPKM-UQ</SelectItem>
// // //                     </SelectContent>
// // //                   </Select>
// // //                 </div>

// // //                 <div>
// // //                   <Label>Top N Genes</Label>
// // //                   <Input
// // //                     type="number"
// // //                     min="50"
// // //                     max="500"
// // //                     step="100"
// // //                     value={topN}
// // //                     onChange={(e) => setTopN(Math.max(50, Math.min(2000, parseInt(e.target.value) || 500)))}
// // //                   />
// // //                 </div>

// // //                 <Button
// // //                   onClick={runAnalysis}
// // //                   disabled={isLoading || (scope !== "global" && selectedSites.length === 0 && selectedCancerTypes.length === 0)}
// // //                   className="w-full bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white font-semibold"
// // //                   size="lg"
// // //                 >
// // //                   {isLoading ? (
// // //                     <>Running Analysis...</>
// // //                   ) : (
// // //                     <>
// // //                       <TrendingUp className="h-5 w-5 mr-2" />
// // //                       Analyze
// // //                     </>
// // //                   )}
// // //                 </Button>
// // //               </CardContent>
// // //             </Card>

// // //             {/* Results */}
// // //             <div className="lg:col-span-3 space-y-6">
// // //               {isLoading && (
// // //                 <Card>
// // //                   <CardContent className="py-12">
// // //                     <LoadingSpinner message="Fetching top noisy genes and running pathway enrichment..." />
// // //                   </CardContent>
// // //                 </Card>
// // //               )}

// // //               {error && (
// // //                 <Alert variant="destructive">
// // //                   <AlertCircle className="h-4 w-4" />
// // //                   <AlertDescription>{error}</AlertDescription>
// // //                 </Alert>
// // //               )}

// // //               {topGenes.length > 0 && (
// // //                 <>
// // //                   <Card className="shadow-xl">
// // //                     <CardHeader>
// // //                       <div className="flex justify-between items-start">
// // //                         <div>
// // //                           <CardTitle className="text-2xl">
// // //                             Top {topGenes.length} Noisiest Genes
// // //                           </CardTitle>
// // //                           <p className="text-sm text-gray-600 mt-1">{getScopeLabel()}</p>
// // //                         </div>
// // //                         <Button onClick={downloadCSV} variant="outline">
// // //                           <Download className="h-4 w-4 mr-2" />
// // //                           Download CSV
// // //                         </Button>
// // //                       </div>
// // //                     </CardHeader>
// // //                     <CardContent>
// // //                       <DataTable
// // //                         data={topGenes.slice(0, 100)}
// // //                         columns={[
// // //                           // { header: "Rank", render: (_value: any, _row: NoisyGene, index: number) => index + 1, },
// // //                           { header: "Gene", key: "gene_symbol", sortable: true },
// // //                           { header: "CV (Tumor)", key: "cv", render: v => v.toFixed(3), sortable: true },
// // //                           { header: "Site", key: "site_name", render: v => v || "Pan-Cancer" },
// // //                           // { header: "Norm", key: "norm", render: v => v },
// // //                         ]}
// // //                         // defaultSort={{ key: "cv", direction: "desc" }}
// // //                       />
// // //                     </CardContent>
// // //                   </Card>

// // //                   {enrichment.length > 0 && (
// // //                     <Card className="shadow-xl">
// // //                       <CardHeader>
// // //                         <CardTitle className="flex items-center gap-2 text-xl">
// // //                           <Activity className="h-6 w-6 text-green-600" />
// // //                           Enriched Pathways & Processes
// // //                         </CardTitle>
// // //                       </CardHeader>
// // //                       <CardContent>
// // //                         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
// // //                           {enrichment.slice(0, 12).map((p) => (
// // //                             <div key={p.id} className="border rounded-lg p-4 bg-blue-50 hover:bg-blue-100 transition">
// // //                               <div className="font-medium text-blue-900">
// // //                                 {p.description || p.label.split(" (FDR")[0]}
// // //                               </div>
// // //                               <div className="text-xs text-gray-600 mt-1">
// // //                                 {p.category} • {p.genes.length} genes
// // //                               </div>
// // //                               <div className="text-xs font-mono text-blue-700 mt-2">
// // //                                 {p.id}
// // //                               </div>
// // //                             </div>
// // //                           ))}
// // //                         </div>
// // //                         {enrichment.length > 12 && (
// // //                           <p className="text-center text-sm text-gray-500 mt-6">
// // //                             ... and {enrichment.length - 12} more enriched terms
// // //                           </p>
// // //                         )}
// // //                       </CardContent>
// // //                     </Card>
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

// // // export default GlobalNoiseAnalysis;
// // 'use client';

// // import React, { useState, useEffect, useCallback } from "react";
// // import { Link } from "react-router-dom";
// // import { 
// //   ArrowLeft, 
// //   Download, 
// //   TrendingUp, 
// //   Activity, 
// //   AlertCircle, 
// //   X,
// //   Search,
// //   Filter
// // } from "lucide-react";
// // import { 
// //   Card, 
// //   CardContent, 
// //   CardHeader, 
// //   CardTitle 
// // } from "@/components/ui/card";
// // import { Button } from "@/components/ui/button";
// // import { Input } from "@/components/ui/input";
// // import { Label } from "@/components/ui/label";
// // import { 
// //   Select, 
// //   SelectContent, 
// //   SelectItem, 
// //   SelectTrigger, 
// //   SelectValue 
// // } from "@/components/ui/select";
// // import { Alert, AlertDescription } from "@/components/ui/alert";
// // import { Badge } from "@/components/ui/badge";
// // import { ScrollArea } from "@/components/ui/scroll-area";
// // import { DataTable } from "@/components/ui/data-table";
// // import { LoadingSpinner } from "@/components/ui/loadingSpinner";
// // import Header from "@/components/header";
// // import Footer from "@/components/footer";
// // import CancerTypeSelector from "@/components/siteSelector";
// // import { useCache } from "@/hooks/use-cache";

// // // interface NoisyGene {
// // //   gene_symbol: string;
// // //   cv: number;
// // //   norm: "tpm" | "fpkm" | "fpkm_uq";
// // //   sample_type: "tumor" | "normal";
// // //   site_name?: string;
// // // }
// // interface NoisyGene {
// //   gene_symbol: string;
// //   cv_tumor: number;
// //   cv_normal: number | null;        // now explicitly includes normal
// //   site_name?: string;
// // }

// // interface EnrichmentResult {
// //   id: string;
// //   value: string;
// //   label: string;
// //   category: string;
// //   description?: string;
// //   genes: string[];
// //   fdr?: number;
// //   source?: string;
// // }

// // const GlobalNoiseAnalysis: React.FC = () => {
// //   const [scope, setScope] = useState<"global" | "site-specific">("global");
// //   const [selectedSites, setSelectedSites] = useState<string[]>([]);
// //   const [selectedCancerTypes, setSelectedCancerTypes] = useState<string[]>([]);
// //   const [topN, setTopN] = useState<number>(500);
// //   const [normMethod, setNormMethod] = useState<"tpm" | "fpkm" | "fpkm_uq">("tpm");

// //   const [topGenes, setTopGenes] = useState<NoisyGene[]>([]);
// //   const [enrichment, setEnrichment] = useState<EnrichmentResult[]>([]);
// //   const [filteredEnrichment, setFilteredEnrichment] = useState<EnrichmentResult[]>([]);
// //   const [isLoading, setIsLoading] = useState(false);
// //   const [error, setError] = useState<string | null>(null);
// //   const [selectedPathway, setSelectedPathway] = useState<EnrichmentResult | null>(null);
// //   const [searchTerm, setSearchTerm] = useState("");

// //   const { getCachedData, setCachedData, generateCacheKey } = useCache<any>();

// //   // Filter enrichment results based on search
// //   useEffect(() => {
// //     if (!enrichment.length) {
// //       setFilteredEnrichment([]);
// //       return;
// //     }

// //     const filtered = enrichment.filter(p => 
// //       (p.description || p.label).toLowerCase().includes(searchTerm.toLowerCase()) ||
// //       p.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
// //       p.genes.some(g => g.toLowerCase().includes(searchTerm.toLowerCase()))
// //     );
// //     setFilteredEnrichment(filtered);
// //   }, [enrichment, searchTerm]);

// //   const runAnalysis = useCallback(async () => {
// //     if (scope === "site-specific" && selectedSites.length === 0) {
// //       setError("Please select at least one cancer site.");
// //       return;
// //     }

// //     setIsLoading(true);
// //     setError(null);
// //     setTopGenes([]);
// //     setEnrichment([]);
// //     setSelectedPathway(null);
// //     setSearchTerm("");

// //     const cacheKey = generateCacheKey({
// //       endpoint: "global-noise-v2",
// //       scope,
// //       sites: selectedSites,
// //       topN,
// //       norm: normMethod,
// //     });

// //     const Cached = getCachedData(cacheKey);
// //     if (Cached) {
// //       setTopGenes(Cached.topGenes);
// //       setEnrichment(Cached.enrichment);
// //       setIsLoading(false);
// //       return;
// //     }

// //     try {
// //       let url = `/api/top-noisy-genes?norm=${normMethod}&top_n=${topN}`;
// //       if (scope === "site-specific") {
// //         url += `&sites=${selectedSites.join(",")}`;
// //       }

// //       const noisyRes = await fetch(url);
// //       if (!noisyRes.ok) throw new Error(await noisyRes.text());
// //       const noisyData = await noisyRes.json();

// //       // const genes: NoisyGene[] = (noisyData.genes || []).map((g: any) => ({
// //       //   gene_symbol: g.gene_symbol,
// //       //   cv: g.cv,
// //       //   norm: g.norm,
// //       //   sample_type: g.sample_type,
// //       //   site_name: g.site_name,
// //       // }));
// //       const genes: NoisyGene[] = (noisyData.genes || []).map((g: any) => ({
// //         gene_symbol: g.gene_symbol,
// //         cv_tumor: g.cv_tumor,
// //         cv_normal: g.cv_normal,        // may be null
// //         site_name: g.site_name,
// //       }));

// //       setTopGenes(genes);

// //       // const tumorGenes = genes
// //       //   .filter(g => g.sample_type === "tumor")
// //       //   .sort((a, b) => b.cv - a.cv)
// //       //   .slice(0, topN);

// //       // setTopGenes(tumorGenes);

// //       if (genes.length > 0) {
// //         const geneList = [...new Set(tumorGenes.map(g => g.gene_symbol))];
// //         const enrichRes = await fetch("/api/enriched-pathways", {
// //           method: "POST",
// //           headers: { "Content-Type": "application/json" },
// //           body: JSON.stringify({ genes: geneList }),
// //         });

// //         if (enrichRes.ok) {
// //           const enrichData: EnrichmentResult[] = await enrichRes.json();
// //           // Add FDR if available
// //           const enrichedWithFDR = enrichData.map((item: any) => ({
// //             ...item,
// //             fdr: item.value || item.p_adjusted || item.fdr || 0.05,
// //             source: item.source || "Unknown",
// //           }));
// //           setEnrichment(enrichedWithFDR);
// //           setCachedData(cacheKey, { topGenes: tumorGenes, enrichment: enrichedWithFDR });
// //         }
// //       }
// //     } catch (err: any) {
// //       setError(err.message || "Analysis failed. Please try again.");
// //     } finally {
// //       setIsLoading(false);
// //     }
// //   }, [scope, selectedSites, topN, normMethod, getCachedData, setCachedData, generateCacheKey]);

// //   const downloadCSV = () => {
// //     const headers = ["Rank", "Gene", "CV (Tumor)", "Site"];
// //     const rows = topGenes.map((g, i) => [
// //       i + 1,
// //       g.gene_symbol,
// //       g.cv.toFixed(4),
// //       g.site_name || "Pan-Cancer"
// //     ]);

// //     const csv = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
// //     const blob = new Blob([csv], { type: "text/csv" });
// //     const url = URL.createObjectURL(blob);
// //     const a = document.createElement("a");
// //     a.href = url;
// //     a.download = `top_${topN}_noisy_genes_${scope}_${normMethod}.csv`;
// //     a.click();
// //     URL.revokeObjectURL(url);
// //   };

// //   const getScopeLabel = () => scope === "global" ? "Pan-Cancer" : `${selectedSites.length} Cancer Site(s)`;

// //   return (
// //     <div className="min-h-screen bg-gray-50 flex flex-col">
// //       <Header />
// //       <main className="flex-grow">
// //         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
// //           <Link to="/" className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-4 text-sm">
// //             <ArrowLeft className="h-4 w-4 mr-2" /> Back to Dashboard
// //           </Link>
// //           <h1 className="text-4xl font-bold text-blue-900 mb-6">Global Transcriptional Noise Analysis</h1>

          
// //           <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
// //              {/* Controls */}
// //              <Card className="shadow-xl lg:col-span-1 h-fit">
// //                <CardHeader>
// //                  <CardTitle className="text-xl text-blue-900">Analysis Settings</CardTitle>
// //               </CardHeader>
// //               <CardContent class-scope="space-y-6">
// //                 <div>
// //                   <Label>Analysis Scope</Label>
// //                   <Select value={scope} onValueChange={(v: any) => {
// //                     setScope(v);
// //                     setSelectedSites([]);
// //                   }}>
// //                     <SelectTrigger><SelectValue /></SelectTrigger>
// //                     <SelectContent>
// //                       <SelectItem value="global">Pan-Cancer (Global)</SelectItem>
// //                       <SelectItem value="site-specific">By Cancer Site</SelectItem>
// //                     </SelectContent>
// //                   </Select>
// //                 </div>

// //                 {scope === "site-specific" && (
// //                   <div>
// //                     {/* <Label>Cancer Sites</Label> */}
// //                     <CancerTypeSelector
// //                       selectedSites={selectedSites}
// //                       onSitesChange={setSelectedSites}
// //                       selectedCancerTypes={selectedCancerTypes}
// //                       CancerTypes={selectedCancerTypes}
// //                       onCancerTypesChange={setSelectedCancerTypes}
// //                       analysisType="cancer-specific"
// //                     />
// //                   </div>
// //                 )}

// //                 <div>
// //                   <Label>Normalization Method</Label>
// //                   <Select value={normMethod} onValueChange={(v: any) => setNormMethod(v)}>
// //                     <SelectTrigger><SelectValue /></SelectTrigger>
// //                     <SelectContent>
// //                       <SelectItem value="tpm">TPM</SelectItem>
// //                       <SelectItem value="fpkm">FPKM</SelectItem>
// //                       <SelectItem value="fpkm_uq">FPKM-UQ</SelectItem>
// //                     </SelectContent>
// //                   </Select>
// //                 </div>

// //                 <div>
// //                   <Label>Top N Noisiest Genes</Label>
// //                   <Input
// //                     type="number"
// //                     min="50"
// //                     max="500"
// //                     step='100'
// //                     value={topN}
// //                     onChange={(e) => setTopN(Math.max(50, Math.min(2000, parseInt(e.target.value) || 500)))}
// //                   />
// //                 </div>

// //                 <Button
// //                   onClick={runAnalysis}
// //                   disabled={isLoading || (scope === "site-specific" && selectedSites.length === 0)}
// //                   className="w-full bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white font-semibold"
// //                   size="lg"
// //                 >
// //                   {isLoading ? "Running..." : <><TrendingUp className="h-2 w-4 mr-2" /> Run Analysis</>}
// //                 </Button>
// //               </CardContent>
// //             </Card>

// //             {/* Results Panel */}
// //             <div className="lg:col-span-3 space-y-8">
// //               {isLoading && (
// //                 <Card><CardContent className="py-16"><LoadingSpinner message="Analyzing transcriptional noise and enriching pathways..." /></CardContent></Card>
// //               )}

// //               {error && (
// //                 <Alert variant="destructive">
// //                   <AlertCircle className="h-4 w-4" />
// //                   <AlertDescription>{error}</AlertDescription>
// //                 </Alert>
// //               )}

// //               {topGenes.length > 0 && (
// //                 <>
// //                   {/* Top Noisy Genes */}
// //                   <Card className="shadow-xl">
// //                     <CardHeader>
// //                       <div className="flex justify-between items-start">
// //                         <div>
// //                           <CardTitle className="text-2xl">Top {topGenes.length} Noisiest Genes</CardTitle>
// //                           <p className="text-sm text-gray-600 mt-1">{getScopeLabel()} • {normMethod.toUpperCase()}</p>
// //                         </div>
// //                         <Button onClick={downloadCSV} variant="outline">
// //                           <Download className="h-4 w-4 mr-2" /> Download CSV
// //                         </Button>
// //                       </div>
// //                     </CardHeader>
// //                     <CardContent>
// //                       <DataTable
// //                         data={topGenes.slice(0, 100)}
// //                         columns={[
// //                           // { header: "Rank", render: (_, __, i) => i + 1 },
// //                           { header: "Gene", key: "gene_symbol", sortable: true },
// //                           { header: "CV (Tumor)", key: "cv", render: v => v.toFixed(4), sortable: true },
// //                           { header: "Site", key: "site_name", render: v => v || "Pan-Cancer" },
// //                         ]}
// //                       />
// //                     </CardContent>
// //                   </Card>

// //                   {/* Enriched Pathways: Table + Detail View */}
// //                   {enrichment.length > 0 && (
// //                     <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
// //                       {/* Pathways List */}
// //                       <div className="xl:col-span-1">
// //                         <Card className="shadow-xl h-full">
// //                           <div className="mt-3">
// //                           <CardHeader>
// //                             <div className="flex items-center justify-between">
// //                               <CardTitle className="flex items-center gap-4">
// //                                 Enriched Pathways
// //                               </CardTitle>
// //                             </div>
// //                             <div className="mt-3">
// //                               <div className="relative">
// //                                 <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
// //                                 <Input
// //                                   placeholder="Search pathways or genes..."
// //                                   value={searchTerm}
// //                                   onChange={(e) => setSearchTerm(e.target.value)}
// //                                   className="pl-10"
// //                                 />
// //                               </div>
// //                             </div>
// //                           </CardHeader>
// //                           </div>
// //                           <CardContent>
// //                             <ScrollArea className="h-96">
// //                               <div className="space-y-3 pr-2">
// //                                 {filteredEnrichment
// //                                   .sort((a, b) => (a.fdr || 1) - (b.fdr || 1))
// //                                   .map((pathway) => (
// //                                     <div
// //                                       key={pathway.id}
// //                                       onClick={() => setSelectedPathway(pathway)}
// //                                       className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
// //                                         selectedPathway?.id === pathway.id
// //                                           ? "border-blue-500 bg-blue-50 shadow-lg"
// //                                           : "border-gray-200 hover:border-gray-400 hover:bg-gray-50"
// //                                       }`}
// //                                     >
// //                                       <div className="flex justify-between items-start gap-3">
// //                                         <div className="flex-1 min-w-0">
// //                                           <p className="font-semibold text-sm text-blue-900 truncate">
// //                                             {pathway.description || pathway.label.split(" (")[0]}
// //                                           </p>
// //                                           <p className="text-xs text-gray-600 mt-1">{pathway.category}</p>
// //                                         </div>
// //                                         <div className="text-right shrink-0">
// //                                           <Badge variant="secondary" className="text-xs">
// //                                             {pathway.genes.length}
// //                                           </Badge>
// //                                           {/* {pathway.fdr && (
// //                                             <p className="text-xs font-mono text-black-700 mt-1">
// //                                               {pathway.fdr < 0.001 ? pathway.fdr.toExponential(2) : pathway.fdr}
// //                                             </p>
// //                                           )} */}
// //                                         </div>
// //                                       </div>
// //                                     </div>
// //                                   ))}
// //                               </div>
// //                             </ScrollArea>
// //                           </CardContent>
// //                         </Card>
// //                       </div>

// //                       {/* Pathway Details Panel */}
// //                       <div className="xl:col-span-2">
// //                         {selectedPathway ? (
// //                           <Card className="shadow-xl h-full">
// //                             <CardHeader>
// //                               <div className="flex justify-between items-start">
// //                                 <CardTitle className="text-2xl text-blue-900">Pathway Details</CardTitle>
// //                                 <Button variant="ghost" size="sm" onClick={() => setSelectedPathway(null)}>
// //                                   <X className="h-5 w-5" />
// //                                 </Button>
// //                               </div>
// //                             </CardHeader>
// //                             <CardContent className="space-y-6">
// //                               <div>
// //                                 <h3 className="text-xl font-bold text-blue-900">
// //                                   {selectedPathway.description || selectedPathway.label}
// //                                 </h3>
// //                                 <div className="flex flex-wrap gap-2 mt-3">
// //                                   <Badge className="bg-blue-100 text-blue-800">{selectedPathway.category}</Badge>
// //                                   {/* {selectedPathway.source && <Badge variant="outline">{selectedPathway.source}</Badge>} */}
// //                                   <Badge variant="secondary">{selectedPathway.genes.length} genes</Badge>
// //                                   {selectedPathway.fdr && (
// //                                     <Badge className="bg-gray-100 text-black-800">
// //                                       Term: {selectedPathway.fdr < 0.001 ? selectedPathway.fdr.toExponential(2) : selectedPathway.fdr}
// //                                     </Badge>
// //                                   )}
// //                                 </div>
// //                               </div>

// //                               <div>
// //                                 <h4 className="font-semibold text-gray-700 mb-3">Matching Genes in Your Noisy Set</h4>
// //                                 <ScrollArea className="h-64 rounded-md border p-4">
// //                                   <div className="flex flex-wrap gap-2">
// //                                     {selectedPathway.genes.map((gene) => (
// //                                       <Badge key={gene} variant="outline" className="font-mono text-xs py-1">
// //                                         {gene}
// //                                       </Badge>
// //                                     ))}
// //                                   </div>
// //                                 </ScrollArea>
// //                               </div>

// //                               <div className="text-xs text-gray-500 space-y-1">
// //                                 <div><strong>ID:</strong> {selectedPathway.id}</div>
// //                                 {/* {selectedPathway.value && <div><strong>P-value:</strong> {parseFloat(selectedPathway.value as any).toExponential(4)}</div>} */}
// //                               </div>
// //                             </CardContent>
// //                           </Card>
// //                         ) : (
// //                           <Card className="shadow-xl border-dashed border-2 h-full flex items-center justify-center">
// //                             <div className="text-center text-gray-500">
// //                               <Activity className="h-16 w-16 mx-auto mb-4 text-gray-300" />
// //                               <p className="text-lg font-medium">Click a pathway to view details</p>
// //                               <p className="text-sm mt-2">Full description, genes, and statistics will appear here</p>
// //                             </div>
// //                           </Card>
// //                         )}
// //                       </div>
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

// // export default GlobalNoiseAnalysis;