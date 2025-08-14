// import React, { useState } from 'react';
// import { Button } from "@/components/ui/button";
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// import { Input } from "@/components/ui/input";
// import { Label } from "@/components/ui/label";
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
// import { Alert, AlertDescription } from "@/components/ui/alert";
// import { Upload, Loader2, Info } from "lucide-react";
// import { useToast } from "@/components/ui/use-toast";
// import Header from "@/components/header";
// import Footer from "@/components/footer";

// const UploadAnalysis = () => {
//   const [file, setFile] = useState<File | null>(null);
//   const [topN, setTopN] = useState<string>("15");
//   const [analysisType, setAnalysisType] = useState<string>("Pathway");
//   const [geneSet, setGeneSet] = useState<string>("KEGG_2021_Human");
//   const [isLoading, setIsLoading] = useState<boolean>(false);
//   const { toast } = useToast();

//   const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
//     if (event.target.files && event.target.files[0]) {
//       const selectedFile = event.target.files[0];
//       if (selectedFile.name.endsWith('.csv') || selectedFile.name.endsWith('.tsv')) {
//         setFile(selectedFile);
//       } else {
//         toast({
//           title: "Invalid File Type",
//           description: "Please upload a CSV or TSV file.",
//           variant: "destructive",
//         });
//         setFile(null);
//       }
//     }
//   };

//   const handleSubmit = async (event: React.FormEvent) => {
//     event.preventDefault();
//     if (!file) {
//       toast({
//         title: "No File Selected",
//         description: "Please select a CSV or TSV file to upload.",
//         variant: "destructive",
//       });
//       return;
//     }

//     setIsLoading(true);
//     const formData = new FormData();
//     formData.append('file', file);
//     formData.append('top_n', topN);
//     formData.append('analysis_type', analysisType);
//     if (analysisType === 'Pathway') {
//       formData.append('gene_set', geneSet);
//     }

//     try {
//       const response = await fetch('http://localhost:5001/api/csv-upload', {
//         method: 'POST',
//         body: formData,
//       });

//       if (!response.ok) {
//         const errorData = await response.json();
//         throw new Error(errorData.error || 'Failed to process file');
//       }

//       const result = await response.json();
//       toast({
//         title: "Upload Successful",
//         description: `File processed successfully for ${analysisType} Analysis. Check results below.`,
//       });

//       // TODO: Navigate to results page or display results
//       console.log(`${analysisType} Analysis Results:`, result);
//     } catch (error) {
//       toast({
//         title: "Error",
//         description: `Failed to upload file: ${error.message}`,
//         variant: "destructive",
//       });
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-yellow-50 flex flex-col">
//       <Header />
//       <main className="flex-grow py-12">
//         <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
//           <Card>
//             <CardHeader>
//               <CardTitle className="text-2xl font-bold text-blue-900">
//                 Upload Gene Expression Data
//               </CardTitle>
//             </CardHeader>
//             <CardContent>
//               {/* <Alert className="mb-6">
//                 <Info className="h-4 w-4" />
//                 <AlertDescription>
//                   Note: The uploaded file should contain tumor sample data only. Differential noise analysis (e.g., logFC) is not possible as normal sample data is not included.
//                 </AlertDescription>
//               </Alert> */}
//               <form onSubmit={handleSubmit} className="space-y-6">
//                 <div>
//                   <Label htmlFor="file-upload" className="text-blue-900">
//                     Upload CSV/TSV File
//                   </Label>
//                   <p className="text-sm text-blue-700 mb-2">
//                     File must contain 'gene_id' and 'gene_name' columns, followed by tumor sample expression data (e.g., TCGA-...).
//                   </p>
//                   <Input
//                     id="file-upload"
//                     type="file"
//                     accept=".csv,.tsv"
//                     onChange={handleFileChange}
//                     className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
//                   />
//                 </div>

//                 <div>
//                   <Label htmlFor="analysis-type" className="text-blue-900">
//                     Analysis Type
//                   </Label>
//                   <Select value={analysisType} onValueChange={setAnalysisType}>
//                     <SelectTrigger id="analysis-type">
//                       <SelectValue placeholder="Select analysis type" />
//                     </SelectTrigger>
//                     <SelectContent>
//                       <SelectItem value="Gene">Gene Analysis</SelectItem>
//                       <SelectItem value="Pathway">Pathway Analysis</SelectItem>
//                       <SelectItem value="Tumor">Tumor Analysis</SelectItem>
//                     </SelectContent>
//                   </Select>
//                 </div>

//                 {/* {analysisType === 'Pathway' && (
//                   <div>
//                     <Label htmlFor="gene-set" className="text-blue-900">
//                       Gene Set Library
//                     </Label>
//                     <Select value={geneSet} onValueChange={setGeneSet}>
//                       <SelectTrigger id="gene-set">
//                         <SelectValue placeholder="Select gene set" />
//                       </SelectTrigger>
//                       <SelectContent>
//                         <SelectItem value="KEGG_2021_Human">KEGG 2021 Human</SelectItem>
//                         <SelectItem value="GO_Biological_Process_2021">GO Biological Process 2021</SelectItem>
//                       </SelectContent>
//                     </Select>
//                   </div>
//                 )} */}

//                 {/* <div>
//                   <Label htmlFor="top-n" className="text-blue-900">
//                     Number of Top Genes
//                   </Label>
//                   <Input
//                     id="top-n"
//                     type="number"
//                     value={topN}
//                     onChange={(e) => setTopN(e.target.value)}
//                     min="1"
//                     max="100"
//                     className="mt-1"
//                   />
//                 </div> */}

//                 <Button
//                   type="submit"
//                   disabled={isLoading || !file}
//                   className="w-full bg-gradient-to-r from-blue-600 to-blue-900 text-white"
//                 >
//                   {isLoading ? (
//                     <>
//                       <Loader2 className="mr-2 h-4 w-4 animate-spin" />
//                       Processing...
//                     </>
//                   ) : (
//                     <>
//                       <Upload className="mr-2 h-4 w-4" />
//                       Analyze File
//                     </>
//                   )}
//                 </Button>
//               </form>
//             </CardContent>
//           </Card>
//         </div>
//       </main>
//       <Footer />
//     </div>
//   );
// };

// export default UploadAnalysis;

// import React, { useState } from 'react';
// import { Button } from "@/components/ui/button";
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// import { Input } from "@/components/ui/input";
// import { Label } from "@/components/ui/label";
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
// import { Alert, AlertDescription } from "@/components/ui/alert";
// import { Upload, Loader2, Info } from "lucide-react";
// import { useToast } from "@/components/ui/use-toast";
// import { DataTable } from "@/components/ui/data-table";
// import { PlotlyHeatmap } from "@/components/charts/PlotlyHeatmap";
// import PlotlyBoxPlot from "@/components/charts/PlotlyTumorBoxPlot";
// import {PlotlyBarChart }from "@/components/charts/PlotlyBarChart";
// import GeneSelector from "@/components/GeneSelector";
// import Header from "@/components/header";
// import Footer from "@/components/footer";

// const UploadAnalysis = () => {
//   const [selectedGenes, setSelectedGenes] = useState<string[]>([]);
//   const [expressionFile, setExpressionFile] = useState<File | null>(null);
//   const [topN, setTopN] = useState<string>("15");
//   const [analysisType, setAnalysisType] = useState<string>("Pathway");
//   const [geneSet, setGeneSet] = useState<string>("KEGG_2021_Human");
//   const [isLoading, setIsLoading] = useState<boolean>(false);
//   const [results, setResults] = useState<any>(null);
//   const { toast } = useToast();

//   const handleExpressionFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
//     if (event.target.files && event.target.files[0]) {
//       const selectedFile = event.target.files[0];
//       if (selectedFile.name.endsWith('.csv') || selectedFile.name.endsWith('.tsv')) {
//         setExpressionFile(selectedFile);
//       } else {
//         toast({
//           title: "Invalid File Type",
//           description: "Expression data file must be CSV or TSV.",
//           variant: "destructive",
//         });
//         setExpressionFile(null);
//       }
//     }
//   };

//   const handleSubmit = async (event: React.FormEvent) => {
//     event.preventDefault();
//     if (analysisType === 'Tumor' && !expressionFile) {
//       toast({
//         title: "No Expression Data",
//         description: "Tumor Analysis requires an expression data file.",
//         variant: "destructive",
//       });
//       return;
//     }
//     if ((analysisType === 'Gene' || analysisType === 'Pathway') && !selectedGenes.length && !expressionFile) {
//       toast({
//         title: "No Input Provided",
//         description: "Please select genes or upload an expression data file.",
//         variant: "destructive",
//       });
//       return;
//     }

//     setIsLoading(true);
//     setResults(null); // Clear previous results
//     const formData = new FormData();
//     if (selectedGenes.length) {
//       formData.append('genes', selectedGenes.join(','));
//     }
//     if (expressionFile) {
//       formData.append('expression_file', expressionFile);
//       formData.append('top_n', topN);
//     }
//     formData.append('analysis_type', analysisType);
//     if (analysisType === 'Pathway') {
//       formData.append('gene_set', geneSet);
//     }

//     try {
//       const response = await fetch('http://localhost:5001/api/csv-upload', {
//         method: 'POST',
//         body: formData,
//       });

//       if (!response.ok) {
//         const errorData = await response.json();
//         throw new Error(errorData.error || 'Failed to process input');
//       }

//       const result = await response.json();
//       setResults(result);
//       toast({
//         title: "Upload Successful",
//         description: `Input processed successfully for ${analysisType} Analysis. Results are displayed below.`,
//       });
//     } catch (error) {
//       toast({
//         title: "Error",
//         description: `Failed to process input: ${error.message}`,
//         variant: "destructive",
//       });
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   // Gene Analysis Table
//   const GeneAnalysisTable = ({ metrics, topGenes }: { metrics: any, topGenes: string[] }) => {
//     const columns = [
//       { key: 'gene', header: 'Gene', sortable: true },
//       {
//         key: 'cv',
//         header: 'CV',
//         sortable: true,
//         render: (value: number) => value.toFixed(4),
//       },
//       {
//         key: 'cv_squared',
//         header: 'CV²',
//         sortable: true,
//         render: (value: number) => value.toFixed(4),
//       },
//       {
//         key: 'std',
//         header: 'STD',
//         sortable: true,
//         render: (value: number) => value.toFixed(4),
//       },
//       {
//         key: 'mad',
//         header: 'MAD',
//         sortable: true,
//         render: (value: number) => value.toFixed(4),
//       },
//       {
//         key: 'mean',
//         header: 'Mean',
//         sortable: true,
//         render: (value: number) => value.toFixed(4),
//       },
//     ];

//     const data = topGenes.map((gene) => ({
//       gene,
//       cv: metrics.cv?.[gene] || 0,
//       cv_squared: metrics.cv_squared?.[gene] || 0,
//       std: metrics.std?.[gene] || 0,
//       mad: metrics.mad?.[gene] || 0,
//       mean: metrics.mean?.[gene] || 0,
//     }));

//    return (
//     <div className="mt-6">
//       <h3 className="text-xl font-bold text-blue-900 mb-4">Gene Noise Metrics</h3>
//       <DataTable
//         data={data}
//         columns={columns}
//         defaultSortKey="cv"
//         defaultSortOrder="desc"
//         className="border rounded-md"
//         showDownloadButtons={true} // <-- enable CSV/JSON downloads here
//       />
//     </div>
//   );
// };

//   // Pathway Analysis Table
//   const PathwayAnalysisTable = ({ enrichment }: { enrichment: any[] }) => {
//     const columns = [
//       { key: 'Term', header: 'Term', sortable: true },
//       {
//         key: 'P-value',
//         header: 'P-value',
//         sortable: true,
//         render: (value: number) => value.toExponential(4),
//       },
//       {
//         key: 'Adjusted P-value',
//         header: 'Adjusted P-value',
//         sortable: true,
//         render: (value: number) => value.toExponential(4),
//       },
//     //   {
//     //     key: 'Odds Ratio',
//     //     header: 'Odds Ratio',
//     //     sortable: true,
//     //     render: (value: number) => value.toFixed(4),
//     //   },
//     //   {
//     //     key: 'Combined Score',
//     //     header: 'Combined Score',
//     //     sortable: true,
//     //     render: (value: number) => value.toFixed(4),
//     //   },
//       {
//         key: 'Genes',
//         header: 'Genes',
//         render: (value: string[]) => value.join(', '),
//       },
//       { key: 'GeneSet', header: 'Gene Set' },
//     ];

//     return (
//       <div className="mt-6">
//         <h3 className="text-xl font-bold text-blue-900 mb-4">Enriched Pathways</h3>
//         <DataTable
//           data={enrichment}
//           columns={columns}
//           defaultSortKey="P-value"
//           defaultSortOrder="asc"
//           className="border rounded-md"
//           showDownloadButtons={true}
//         />
//       </div>
//     );
//   };

//   // Pathway Heatmap
// //   const PathwayHeatmap = ({ heatmapData, topGenes }: { heatmapData: any, topGenes: string[] }) => {
// //     const xValues = ['Tumor'];
// //     const yValues = topGenes;
// //     const zValues = [topGenes.map((gene) => heatmapData[gene]?.Tumor || 0)];

// //     return (
// //       <div className="mt-6">
// //         <h3 className="text-xl font-bold text-blue-900 mb-4">Heatmap (Mean Expression)</h3>
// //         <PlotlyHeatmap
// //           title="Mean Gene Expression in Tumor Samples"
// //           data={[{ x: xValues, y: yValues, z: zValues }]}
// //           xValues={xValues}
// //           yValues={yValues}
// //           zValues={zValues}
// //           zLabel="Expression (log2)"
// //           chartKey="heatmap"
// //           xLabel="Sample Type"
// //           yLabel="Genes"
// //           colorscale="Viridis"
// //         />
// //       </div>
// //     );
// //   };
// // Pathway Heatmap
// // const PathwayHeatmap = ({ heatmapData, topGenes, selectedGenes }: { heatmapData: any, topGenes: string[], selectedGenes: string[] }) => {
// //   // Select the first gene: prefer selectedGenes[0] if available, otherwise use topGenes[0]
// //   const gene = selectedGenes.length > 0 ? selectedGenes[0] : topGenes[0];
// //   const xValues = ['Tumor'];
// //   const yValues = [gene]; // Only the first gene
// //   const zValues = [[heatmapData[gene]?.Tumor || 0]]; // Expression data for the first gene

// //   return (
// //     <div className="mt-6">
// //       <h3 className="text-xl font-bold text-blue-900 mb-4">Heatmap (Mean Expression)</h3>
// //       <PlotlyHeatmap
// //         title={`Mean Expression for ${gene} in Tumor Samples`}
// //         data={[{ x: xValues, y: yValues, z: zValues }]}
// //         xValues={xValues}
// //         yValues={yValues}
// //         zValues={zValues}
// //         zLabel="Expression (log2)"
// //         chartKey="heatmap"
// //         xLabel="Sample Type"
// //         yLabel="Gene"
// //         colorscale="Viridis"
// //       />
// //     </div>
// //   );
// // };
//   // Pathway Heatmap
//   const PathwayHeatmap = ({ heatmapData, topGenes }: { heatmapData: any, topGenes: string[] }) => {
//     // Extract all unique sample names from heatmapData
//     const xValues = [...new Set(
//       topGenes.flatMap((gene) => Object.keys(heatmapData[gene] || {}))
//     )].sort();
    
//     // Use topGenes as yValues (rows of the heatmap)
//     const yValues = topGenes;
    
//     // Create zValues as a 2D array: rows are genes, columns are samples
//     const zValues = topGenes.map((gene) =>
//       xValues.map((sample) => heatmapData[gene]?.[sample] || 0)
//     );

//     return (
//       <div className="mt-6">
//         <h3 className="text-xl font-bold text-blue-900 mb-4">Heatmap (Mean Expression)</h3>
//         <PlotlyHeatmap
//           title="Mean Gene Expression Across Samples"
//           data={[{ x: xValues, y: yValues, z: zValues, type: 'heatmap' }]}
//           xValues={xValues}
//           yValues={yValues}
//           zValues={zValues}
//           zLabel="Expression (log2)"
//           chartKey="heatmap"
//           xLabel="Samples"
//           yLabel="Genes"
//           colorscale="Viridis"
//         />
//       </div>
//     );
//   };
//   // Tumor Analysis Table
//   const TumorAnalysisTable = ({ metrics }: { metrics: { sample: string, DEPTH2: number, tITH: number }[] }) => {
//     const columns = [
//       { key: 'sample', header: 'Sample', sortable: true },
//       {
//         key: 'DEPTH2',
//         header: 'DEPTH2',
//         sortable: true,
//         render: (value: number) => value.toFixed(4),
//       },
//       {
//         key: 'tITH',
//         header: 'tITH',
//         sortable: true,
//         render: (value: number) => value.toFixed(4),
//       },
//     ];

//     return (
//       <div className="mt-6">
//         <h3 className="text-xl font-bold text-blue-900 mb-4">Tumor Heterogeneity Metrics</h3>
//         <DataTable
//           data={metrics}
//           columns={columns}
//           defaultSortKey="DEPTH2"
//           defaultSortOrder="desc"
//           className="border rounded-md"
//           showDownloadButtons={true}
//         />
//       </div>
//     );
//   };

//   // Gene Analysis Bar Chart
//   const GeneAnalysisBarChart = ({ metrics, topGenes }: { metrics: any, topGenes: string[] }) => {
//     const data = topGenes.map((gene) => ({
//       gene,
//       cv: metrics.cv?.[gene] || 0,
//       std: metrics.std?.[gene] || 0,
//       mad: metrics.mad?.[gene] || 0,
//       cv_squared: metrics.cv_squared?.[gene] || 0,
//       mean: metrics.mean?.[gene] || 0,
//     }));

//     return (
//       <div className="mt-6">
//         <h3 className="text-xl font-bold text-blue-900 mb-4">Gene Noise Metrics (Bar Chart)</h3>
//         <PlotlyBarChart
//           data={data}
//           title="Gene Noise Metrics"
//           xKey="gene"
//           yKey={["cv", "std", "mad", "cv_squared", "mean"]}
//           xLabel="Genes"
//           yLabel="Metric Value"
//           colors={["rgba(59, 130, 246, 0.6)", "rgba(239, 68, 68, 0.6)", "rgba(34, 197, 94, 0.6)", "rgba(197, 178, 34, 0.6)", , "rgba(151, 34, 197, 0.6)"]}
//           legendLabels={["CV", "STD", "MAD", "CV2", "Mean"]}
//           orientation="v"
//           showLegend={true}
//         />
//       </div>
//     );
//   };

//   // Tumor Analysis Box Plot
//   const TumorAnalysisBoxPlot = ({ metrics }: { metrics: { sample: string, DEPTH2: number, tITH: number }[] }) => {
//     const samples = metrics.map(item => item.sample);
//     return (
//       <div className="mt-6">
//         <h3 className="text-xl font-bold text-blue-900 mb-4">Tumor Heterogeneity Metrics</h3>
//         <div className="space-y-6">
//           <PlotlyBoxPlot
//             data={metrics.map(item => ({ ...item, cancer_type: item.sample }))}
//             title="DEPTH2 by Sample"
//             xKey="DEPTH2"
//             normalizationMethod="Metric Value"
//             selectedGroups={samples}
//             colorMap={samples.reduce((acc, sample, i) => ({ ...acc, [sample]: `hsl(${(i * 360 / samples.length)}, 70%, 50%)` }), {})}
//             className="border rounded-md"
//           />
//           <PlotlyBoxPlot
//             data={metrics.map(item => ({ ...item, cancer_type: item.sample }))}
//             title="tITH by Sample"
//             xKey="tITH"
//             normalizationMethod="Metric Value"
//             selectedGroups={samples}
//             colorMap={samples.reduce((acc, sample, i) => ({ ...acc, [sample]: `hsl(${(i * 360 / samples.length)}, 70%, 50%)` }), {})}
//             className="border rounded-md"
//           />
//         </div>
//       </div>
//     );
//   };

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-yellow-50 flex flex-col">
//       <Header />
//       <main className="flex-grow py-12">
//         <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
//           <Card>
//             <CardHeader>
//               <CardTitle className="text-2xl font-bold text-blue-900">
//                 Upload Gene Expression Data
//               </CardTitle>
//             </CardHeader>
//             <CardContent>
//                 <div>
//                   <Label htmlFor="analysis-type" className="text-blue-900">
//                     Analysis Type
//                   </Label>
//                   <Select value={analysisType} onValueChange={setAnalysisType}>
//                     <SelectTrigger id="analysis-type">
//                       <SelectValue placeholder="Select analysis type" />
//                     </SelectTrigger>
//                     <SelectContent>
//                       <SelectItem value="Gene">Gene Analysis</SelectItem>
//                       <SelectItem value="Pathway">Pathway Analysis</SelectItem>
//                       <SelectItem value="Tumor">Tumor Analysis</SelectItem>
//                     </SelectContent>
//                   </Select>
//                 </div>
//               {/* <Alert className="mb-6">
//                 <Info className="h-4 w-4" />
//                 <AlertDescription>
//                   Note: The uploaded file should contain tumor sample data only. Differential noise analysis (e.g., logFC) is not possible as normal sample data is not included.
//                 </AlertDescription>
//               </Alert> */}
//               <div>
//                 <div>
//                   <Label htmlFor="expression-file-upload" className="text-blue-900">
//                     Upload Expression Data File
//                   </Label>
//                   <p className="text-sm text-blue-700 mb-2">
//                     File must contain 'gene_id' and 'gene_name' columns, followed by tumor sample expression data (e.g., TCGA-...).
//                   </p>
//                   {/* Example table for gene expression format */}
//                 <div className="overflow-x-auto mb-4 border border-gray-200 rounded-md">
//                 <table className="min-w-full text-sm text-left border-collapse">
//                     <thead className="bg-gray-100">
//                     <tr>
//                         <th className="px-4 py-2 border">gene_id</th>
//                         <th className="px-4 py-2 border">gene_name</th>
//                         <th className="px-4 py-2 border">SampleA</th>
//                         <th className="px-4 py-2 border">SampleB</th>
//                     </tr>
//                     </thead>
//                     <tbody>
//                     <tr>
//                         <td className="px-4 py-2 border">ENSG00000000003.15</td>
//                         <td className="px-4 py-2 border">TSPAN6</td>
//                         <td className="px-4 py-2 border">11.9592</td>
//                         <td className="px-4 py-2 border">21.8393</td>
//                     </tr>
//                     <tr>
//                         <td className="px-4 py-2 border">ENSG00000000005.6</td>
//                         <td className="px-4 py-2 border">TNMD</td>
//                         <td className="px-4 py-2 border">0.4836</td>
//                         <td className="px-4 py-2 border">1.0798</td>
//                     </tr>
//                     <tr>
//                         <td className="px-4 py-2 border">ENSG00000000419.13</td>
//                         <td className="px-4 py-2 border">DPM1</td>
//                         <td className="px-4 py-2 border">117.9028</td>
//                         <td className="px-4 py-2 border">97.2087</td>
//                     </tr>
//                     </tbody>
//                 </table>
//                 </div>
//                   <Input
//                     id="expression-file-upload"
//                     type="file"
//                     accept=".csv,.tsv"
//                     onChange={handleExpressionFileChange}
//                     className="file:mr-4 file:py-0 file:px-6 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
//                   />
//                 </div>
//                 </div>
//               <form onSubmit={handleSubmit} className="space-y-6">
//                 {(analysisType === 'Gene' || analysisType === 'Pathway') && (
//                   <div>
//                     {/* <Label className="text-blue-900">Select Genes</Label>
//                     <p className="text-sm text-blue-700 mb-2">
//                       Choose genes for analysis using the search or suggested genes.
//                     </p> */}
//                     <GeneSelector
//                       selectedGenes={selectedGenes}
//                       onGenesChange={setSelectedGenes}
//                     //   maxGenes={100}
//                     />
//                   </div>
//                 )}
//                 {analysisType === 'Pathway' && (
//                   <div>
//                     <Label htmlFor="gene-set" className="text-blue-900">
//                       Gene Set Library
//                     </Label>
//                     <Select value={geneSet} onValueChange={setGeneSet}>
//                       <SelectTrigger id="gene-set">
//                         <SelectValue placeholder="Select gene set" />
//                       </SelectTrigger>
//                       <SelectContent>
//                         <SelectItem value="KEGG_2021_Human">KEGG 2021 Human</SelectItem>
//                         <SelectItem value="GO_Biological_Process_2021">GO Biological Process 2021</SelectItem>
//                       </SelectContent>
//                     </Select>
//                   </div>
//                 )}

//                 {/* {(analysisType === 'Gene' || analysisType === 'Pathway') && (
//                   <div>
//                     <Label htmlFor="top-n" className="text-blue-900">
//                       Number of Top Genes
//                     </Label>
//                     <p className="text-sm text-blue-700 mb-2">
//                       Applied when an expression data file is provided without selected genes.
//                     </p>
//                     <Input
//                       id="top-n"
//                       type="number"
//                       value={topN}
//                       onChange={(e) => setTopN(e.target.value)}
//                       min="1"
//                       max="100"
//                       className="mt-1"
//                     />
//                   </div>
//                 )} */}
//                 <Button
//                   type="submit"
//                   disabled={
//                     isLoading ||
//                     (analysisType === 'Tumor' && !expressionFile) ||
//                     ((analysisType === 'Gene' || analysisType === 'Pathway') && !selectedGenes.length && !expressionFile)
//                   }
//                   className="w-full bg-gradient-to-r from-blue-600 to-blue-900 text-white"
//                 >
//                   {isLoading ? (
//                     <>
//                       <Loader2 className="mr-2 h-4 w-4 animate-spin" />
//                       Processing...
//                     </>
//                   ) : (
//                     <>
//                       <Upload className="mr-2 h-4 w-4" />
//                       Analyze Input
//                     </>
//                   )}
//                 </Button>
//               </form>

//               {results && (
//                 <div className="mt-8">
//                   {results.warning && (
//                     <Alert className="mb-6">
//                       <Info className="h-4 w-4" />
//                       <AlertDescription>{results.warning}</AlertDescription>
//                     </Alert>
//                   )}

//                   {results.analysis_type === 'Gene' && results.metrics && results.top_genes && (
//                     <GeneAnalysisTable metrics={results.metrics} topGenes={results.top_genes} />
//                   )}
//                   {results.analysis_type === 'Gene' && results.metrics && results.top_genes && (
//                   <GeneAnalysisBarChart metrics={results.metrics} topGenes={results.top_genes} />
//                 )}
//                   {results.analysis_type === 'Pathway' && (
//                     <>
//                       {results.enrichment && results.enrichment.length > 0 && (
//                         <PathwayAnalysisTable enrichment={results.enrichment} />
//                       )}
//                       {results.heatmap_data && results.top_genes && (
//                         <PathwayHeatmap
//                             heatmapData={results.heatmap_data}
//                             topGenes={selectedGenes}
//                             // selectedGenes={selectedGenes} // Pass the selectedGenes state
//                         />
//                         )}
//                     </>
//                   )}

//                   {results.analysis_type === 'Tumor' && results.metrics && (
//                     <TumorAnalysisBoxPlot metrics={results.metrics} />
                    
//                   )}
//                   {results.analysis_type === 'Tumor' && results.metrics && (
//                     <TumorAnalysisTable metrics={results.metrics} />
//                   )}
//                 </div>
//               )}
//             </CardContent>
//           </Card>
//         </div>
//       </main>
//       <Footer />
//     </div>
//   );
// };

// export default UploadAnalysis;
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Upload, Loader2, Info } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { DataTable } from "@/components/ui/data-table";
import { PlotlyHeatmap } from "@/components/charts/PlotlyHeatmap";
import PlotlyBoxPlot from "@/components/charts/PlotlyTumorBoxPlot";
import { PlotlyBarChart } from "@/components/charts/PlotlyBarChart";
import GeneSelector from "@/components/GeneSelector";
import Header from "@/components/header";
import Footer from "@/components/footer";
import { useCache } from "@/hooks/use-cache"; // Import the useCache hook

const UploadAnalysis = () => {
  const [selectedGenes, setSelectedGenes] = useState<string[]>([]);
  const [expressionFile, setExpressionFile] = useState<File | null>(null);
  const [topN, setTopN] = useState<string>("15");
  const [analysisType, setAnalysisType] = useState<string>("Pathway");
  const [geneSet, setGeneSet] = useState<string>("KEGG_2021_Human");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [results, setResults] = useState<any>(null);
  const { toast } = useToast();
  const { getCachedData, setCachedData, generateCacheKey } = useCache(); // Initialize useCache

  const handleExpressionFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const selectedFile = event.target.files[0];
      if (selectedFile.name.endsWith('.csv') || selectedFile.name.endsWith('.tsv')) {
        setExpressionFile(selectedFile);
      } else {
        toast({
          title: "Invalid File Type",
          description: "Expression data file must be CSV or TSV.",
          variant: "destructive",
        });
        setExpressionFile(null);
      }
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (analysisType === 'Tumor' && !expressionFile) {
      toast({
        title: "No Expression Data",
        description: "Tumor Analysis requires an expression data file.",
        variant: "destructive",
      });
      return;
    }
    if ((analysisType === 'Gene' || analysisType === 'Pathway') && !selectedGenes.length && !expressionFile) {
      toast({
        title: "No Input Provided",
        description: "Please select genes or upload an expression data file.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    setResults(null); // Clear previous results

    // Generate cache key based on form inputs
    const cacheParams = {
      genes: selectedGenes.sort().join(','), // Sort to ensure consistent key
      expressionFile: expressionFile ? `${expressionFile.name}_${expressionFile.size}` : null,
      analysisType,
      geneSet,
      topN,
    };
    const cacheKey = generateCacheKey(cacheParams);

    // Check cache first
    const cachedResult = getCachedData(cacheKey);
    if (cachedResult) {
      setResults(cachedResult);
      toast({
        title: "Loaded from Cache",
        description: `Results for ${analysisType} Analysis loaded from cache.`,
      });
      setIsLoading(false);
      return;
    }

    // Prepare form data for API request
    const formData = new FormData();
    if (selectedGenes.length) {
      formData.append('genes', selectedGenes.join(','));
    }
    if (expressionFile) {
      formData.append('expression_file', expressionFile);
      formData.append('top_n', topN);
    }
    formData.append('analysis_type', analysisType);
    if (analysisType === 'Pathway') {
      formData.append('gene_set', geneSet);
    }

    try {
      const response = await fetch('http://localhost:5001/api/csv-upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to process input');
      }

      const result = await response.json();
      setResults(result);
      // Cache the result
      setCachedData(cacheKey, result);
      toast({
        title: "Upload Successful",
        description: `Input processed successfully for ${analysisType} Analysis. Results are displayed below.`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to process input: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Gene Analysis Table
  const GeneAnalysisTable = ({ metrics, topGenes }: { metrics: any, topGenes: string[] }) => {
    const columns = [
      { key: 'gene', header: 'Gene', sortable: true },
      {
        key: 'cv',
        header: 'CV',
        sortable: true,
        render: (value: number) => value.toFixed(4),
      },
      {
        key: 'cv_squared',
        header: 'CV²',
        sortable: true,
        render: (value: number) => value.toFixed(4),
      },
      {
        key: 'std',
        header: 'STD',
        sortable: true,
        render: (value: number) => value.toFixed(4),
      },
      {
        key: 'mad',
        header: 'MAD',
        sortable: true,
        render: (value: number) => value.toFixed(4),
      },
      {
        key: 'mean',
        header: 'Mean',
        sortable: true,
        render: (value: number) => value.toFixed(4),
      },
    ];

    const data = topGenes.map((gene) => ({
      gene,
      cv: metrics.cv?.[gene] || 0,
      cv_squared: metrics.cv_squared?.[gene] || 0,
      std: metrics.std?.[gene] || 0,
      mad: metrics.mad?.[gene] || 0,
      mean: metrics.mean?.[gene] || 0,
    }));

    return (
      <div className="mt-6">
        <h3 className="text-xl font-bold text-blue-900 mb-4">Gene Noise Metrics</h3>
        <DataTable
          data={data}
          columns={columns}
          defaultSortKey="cv"
          defaultSortOrder="desc"
          className="border rounded-md"
          showDownloadButtons={true}
        />
      </div>
    );
  };

  // Pathway Analysis Table
  const PathwayAnalysisTable = ({ enrichment }: { enrichment: any[] }) => {
    const columns = [
      { key: 'Term', header: 'Term', sortable: true },
      {
        key: 'P-value',
        header: 'P-value',
        sortable: true,
        render: (value: number) => value.toExponential(4),
      },
      {
        key: 'Adjusted P-value',
        header: 'Adjusted P-value',
        sortable: true,
        render: (value: number) => value.toExponential(4),
      },
      {
        key: 'Genes',
        header: 'Genes',
        render: (value: string[]) => value.join(', '),
      },
      { key: 'GeneSet', header: 'Gene Set' },
    ];

    return (
      <div className="mt-6">
        <h3 className="text-xl font-bold text-blue-900 mb-4">Enriched Pathways</h3>
        <DataTable
          data={enrichment}
          columns={columns}
          defaultSortKey="P-value"
          defaultSortOrder="asc"
          className="border rounded-md"
          showDownloadButtons={true}
        />
      </div>
    );
  };

  // Pathway Heatmap
  const PathwayHeatmap = ({ heatmapData, topGenes }: { heatmapData: any, topGenes: string[] }) => {
    const xValues = [...new Set(
      topGenes.flatMap((gene) => Object.keys(heatmapData[gene] || {}))
    )].sort();
    const yValues = topGenes;
    const zValues = topGenes.map((gene) =>
      xValues.map((sample) => heatmapData[gene]?.[sample] || 0)
    );

    return (
      <div className="mt-6">
        <h3 className="text-xl font-bold text-blue-900 mb-4">Heatmap (Mean Expression)</h3>
        <PlotlyHeatmap
          title="Mean Gene Expression Across Samples"
          data={[{ x: xValues, y: yValues, z: zValues, type: 'heatmap' }]}
          xValues={xValues}
          yValues={yValues}
          zValues={zValues}
          zLabel="Expression (log2)"
          chartKey="heatmap"
          xLabel="Samples"
          yLabel="Genes"
          colorscale="Viridis"
        />
      </div>
    );
  };

  // Tumor Analysis Table
  const TumorAnalysisTable = ({ metrics }: { metrics: { sample: string, DEPTH2: number, tITH: number }[] }) => {
    const columns = [
      { key: 'sample', header: 'Sample', sortable: true },
      {
        key: 'DEPTH2',
        header: 'DEPTH2',
        sortable: true,
        render: (value: number) => value.toFixed(4),
      },
      {
        key: 'tITH',
        header: 'tITH',
        sortable: true,
        render: (value: number) => value.toFixed(4),
      },
    ];

    return (
      <div className="mt-6">
        <h3 className="text-xl font-bold text-blue-900 mb-4">Tumor Heterogeneity Metrics</h3>
        <DataTable
          data={metrics}
          columns={columns}
          defaultSortKey="DEPTH2"
          defaultSortOrder="desc"
          className="border rounded-md"
          showDownloadButtons={true}
        />
      </div>
    );
  };

  // Gene Analysis Bar Chart
  const GeneAnalysisBarChart = ({ metrics, topGenes }: { metrics: any, topGenes: string[] }) => {
    const data = topGenes.map((gene) => ({
      gene,
      cv: metrics.cv?.[gene] || 0,
      std: metrics.std?.[gene] || 0,
      mad: metrics.mad?.[gene] || 0,
      cv_squared: metrics.cv_squared?.[gene] || 0,
      mean: metrics.mean?.[gene] || 0,
    }));

    return (
      <div className="mt-6">
        <h3 className="text-xl font-bold text-blue-900 mb-4">Gene Noise Metrics (Bar Chart)</h3>
        <PlotlyBarChart
          data={data}
          title="Gene Noise Metrics"
          xKey="gene"
          yKey={["cv", "std", "mad", "cv_squared", "mean"]}
          xLabel="Genes"
          yLabel="Metric Value"
          colors={["rgba(59, 130, 246, 0.6)", "rgba(239, 68, 68, 0.6)", "rgba(34, 197, 94, 0.6)", "rgba(197, 178, 34, 0.6)", "rgba(151, 34, 197, 0.6)"]}
          legendLabels={["CV", "STD", "MAD", "CV²", "Mean"]}
          orientation="v"
          showLegend={true}
        />
      </div>
    );
  };

  // Tumor Analysis Box Plot
  const TumorAnalysisBoxPlot = ({ metrics }: { metrics: { sample: string, DEPTH2: number, tITH: number }[] }) => {
    const samples = metrics.map(item => item.sample);
    return (
      <div className="mt-6">
        <h3 className="text-xl font-bold text-blue-900 mb-4">Tumor Heterogeneity Metrics</h3>
        <div className="space-y-6">
          <PlotlyBoxPlot
            data={metrics.map(item => ({ ...item, cancer_type: item.sample }))}
            title="DEPTH2 by Sample"
            xKey="DEPTH2"
            normalizationMethod="Metric Value"
            selectedGroups={samples}
            colorMap={samples.reduce((acc, sample, i) => ({ ...acc, [sample]: `hsl(${(i * 360 / samples.length)}, 70%, 50%)` }), {})}
            className="border rounded-md"
            showLegend={false}
          />
          <PlotlyBoxPlot
            data={metrics.map(item => ({ ...item, cancer_type: item.sample }))}
            title="tITH by Sample"
            xKey="tITH"
            normalizationMethod="Metric Value"
            selectedGroups={samples}
            colorMap={samples.reduce((acc, sample, i) => ({ ...acc, [sample]: `hsl(${(i * 360 / samples.length)}, 70%, 50%)` }), {})}
            className="border rounded-md"
            showLegend={false}
          />
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-yellow-50 flex flex-col">
      <Header />
      <main className="flex-grow py-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl font-bold text-blue-900">
                Upload Gene Expression Data
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div>
                <Label htmlFor="analysis-type" className="text-blue-900">
                  Analysis Type
                </Label>
                <Select value={analysisType} onValueChange={setAnalysisType}>
                  <SelectTrigger id="analysis-type">
                    <SelectValue placeholder="Select analysis type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Gene">Gene Analysis</SelectItem>
                    <SelectItem value="Pathway">Pathway Analysis</SelectItem>
                    <SelectItem value="Tumor">Tumor Analysis</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <div>
                  <Label htmlFor="expression-file-upload" className="text-blue-900">
                    Upload Expression Data File
                  </Label>
                  <p className="text-sm text-blue-700 mb-2">
                    File must contain 'gene_id' and 'gene_name' columns, followed by tumor sample expression data (e.g., TCGA-...).
                  </p>
                  <div className="overflow-x-auto mb-4 border border-gray-200 rounded-md">
                    <table className="min-w-full text-sm text-left border-collapse">
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="px-4 py-2 border">gene_id</th>
                          <th className="px-4 py-2 border">gene_name</th>
                          <th className="px-4 py-2 border">SampleA</th>
                          <th className="px-4 py-2 border">SampleB</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td className="px-4 py-2 border">ENSG00000000003.15</td>
                          <td className="px-4 py-2 border">TSPAN6</td>
                          <td className="px-4 py-2 border">11.9592</td>
                          <td className="px-4 py-2 border">21.8393</td>
                        </tr>
                        <tr>
                          <td className="px-4 py-2 border">ENSG00000000005.6</td>
                          <td className="px-4 py-2 border">TNMD</td>
                          <td className="px-4 py-2 border">0.4836</td>
                          <td className="px-4 py-2 border">1.0798</td>
                        </tr>
                        <tr>
                          <td className="px-4 py-2 border">ENSG00000000419.13</td>
                          <td className="px-4 py-2 border">DPM1</td>
                          <td className="px-4 py-2 border">117.9028</td>
                          <td className="px-4 py-2 border">97.2087</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  <Input
                    id="expression-file-upload"
                    type="file"
                    accept=".csv,.tsv"
                    onChange={handleExpressionFileChange}
                    className="file:mr-4 file:py-0 file:px-6 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />
                </div>
              </div>
              <form onSubmit={handleSubmit} className="space-y-6">
                {(analysisType === 'Gene' || analysisType === 'Pathway') && (
                  <div>
                    <GeneSelector
                      selectedGenes={selectedGenes}
                      onGenesChange={setSelectedGenes}
                    />
                  </div>
                )}
                {analysisType === 'Pathway' && (
                  <div>
                    <Label htmlFor="gene-set" className="text-blue-900">
                      Gene Set Library
                    </Label>
                    <Select value={geneSet} onValueChange={setGeneSet}>
                      <SelectTrigger id="gene-set">
                        <SelectValue placeholder="Select gene set" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="KEGG_2021_Human">KEGG 2021 Human</SelectItem>
                        <SelectItem value="GO_Biological_Process_2021">GO Biological Process 2021</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
                <Button
                  type="submit"
                  disabled={
                    isLoading ||
                    (analysisType === 'Tumor' && !expressionFile) ||
                    ((analysisType === 'Gene' || analysisType === 'Pathway') && !selectedGenes.length && !expressionFile)
                  }
                  className="w-full bg-gradient-to-r from-blue-600 to-blue-900 text-white"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Upload className="mr-2 h-4 w-4" />
                      Analyze Input
                    </>
                  )}
                </Button>
              </form>

              {results && (
                <div className="mt-8">
                  {results.warning && (
                    <Alert className="mb-6">
                      <Info className="h-4 w-4" />
                      <AlertDescription>{results.warning}</AlertDescription>
                    </Alert>
                  )}

                  {results.analysis_type === 'Gene' && results.metrics && results.top_genes && (
                    <GeneAnalysisTable metrics={results.metrics} topGenes={results.top_genes} />
                  )}
                  {results.analysis_type === 'Gene' && results.metrics && results.top_genes && (
                    <GeneAnalysisBarChart metrics={results.metrics} topGenes={results.top_genes} />
                  )}
                  {results.analysis_type === 'Pathway' && (
                    <>
                      {results.enrichment && results.enrichment.length > 0 && (
                        <PathwayAnalysisTable enrichment={results.enrichment} />
                      )}
                      {results.heatmap_data && results.top_genes && (
                        <PathwayHeatmap
                          heatmapData={results.heatmap_data}
                          topGenes={results.top_genes}
                        />
                      )}
                    </>
                  )}
                  {results.analysis_type === 'Tumor' && results.metrics && (
                    <>
                      <TumorAnalysisBoxPlot metrics={results.metrics} />
                      <TumorAnalysisTable metrics={results.metrics} />
                    </>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default UploadAnalysis;