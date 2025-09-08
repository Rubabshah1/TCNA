// // // // import React, { useState, useMemo } from 'react';
// // // // import { useLocation, useNavigate, Link } from 'react-router-dom';
// // // // import { Alert, AlertDescription } from "@/components/ui/alert";
// // // // import { Info, ArrowLeft, Download } from "lucide-react";
// // // // import { DataTable } from "@/components/ui/data-table";
// // // // import { PlotlyBarChart } from "@/components/charts/PlotlyBarChart";
// // // // import PlotlyBoxPlot from "@/components/charts/PlotlyTumorBoxPlot";
// // // // import CollapsibleCard from '@/components/ui/collapsible-card';
// // // // import Header from "@/components/header";
// // // // import Footer from "@/components/footer";
// // // // import { Button } from "@/components/ui/button";
// // // // import { Card, CardContent } from "@/components/ui/card";
// // // // import Plot from 'react-plotly.js'; 

// // // // const GeneAnalysisTable = ({ metrics, topGenes }) => {
// // // //   const columns = [
// // // //     { key: 'gene', header: 'Gene', sortable: true },
// // // //     { key: 'cv', header: 'CV', sortable: true, render: (value) => value.toFixed(4) },
// // // //     { key: 'cv_squared', header: 'CV²', sortable: true, render: (value) => value.toFixed(4) },
// // // //     { key: 'std', header: 'STD', sortable: true, render: (value) => value.toFixed(4) },
// // // //     { key: 'mad', header: 'MAD', sortable: true, render: (value) => value.toFixed(4) },
// // // //     { key: 'mean', header: 'Mean', sortable: true, render: (value) => value.toFixed(4) },
// // // //   ];

// // // //   const data = topGenes.map((gene) => ({
// // // //     gene,
// // // //     cv: metrics.cv?.[gene] || 0,
// // // //     cv_squared: metrics.cv_squared?.[gene] || 0,
// // // //     std: metrics.std?.[gene] || 0,
// // // //     mad: metrics.mad?.[gene] || 0,
// // // //     mean: metrics.mean?.[gene] || 0,
// // // //   }));

// // // //   const downloadCSV = () => {
// // // //     const headers = columns.map(col => col.header).join(",");
// // // //     const rows = data.map(row => 
// // // //       [row.gene, row.cv.toFixed(4), row.cv_squared.toFixed(4), row.std.toFixed(4), row.mad.toFixed(4), row.mean.toFixed(4)].join(",")
// // // //     );
// // // //     const content = [headers, ...rows].join("\n");
// // // //     const blob = new Blob([content], { type: "text/csv" });
// // // //     const url = URL.createObjectURL(blob);
// // // //     const a = document.createElement("a");
// // // //     a.href = url;
// // // //     a.download = `gene_analysis_metrics_${Date.now()}.csv`;
// // // //     a.click();
// // // //     URL.revokeObjectURL(url);
// // // //   };

// // // //   return (
// // // //     <CollapsibleCard
// // // //       title="Gene Noise Metrics"
// // // //       downloadButton={
// // // //         <Button onClick={downloadCSV} variant="outline" size="sm" className="h-6 px-2 text-xs">
// // // //           <Download className="h-4 w-4 mr-2" /> Download CSV
// // // //         </Button>
// // // //       }
// // // //     >
// // // //       <DataTable
// // // //         data={data}
// // // //         columns={columns}
// // // //         defaultSortKey="cv"
// // // //         defaultSortOrder="desc"
// // // //         className="border rounded-md"
// // // //         containerWidth="100%"
// // // //       />
// // // //     </CollapsibleCard>
// // // //   );
// // // // };

// // // // const PathwayAnalysisTable = ({ enrichment }) => {
// // // //   const columns = [
// // // //     { key: 'Term', header: 'Pathway', sortable: true },
// // // //     { key: 'P-value', header: 'P-value', sortable: true, render: (value) => value.toExponential(4) },
// // // //     { key: 'Adjusted P-value', header: 'Adjusted P-value', sortable: true, render: (value) => value.toExponential(4) },
// // // //     { key: 'Genes', header: 'Genes', render: (value) => value.join(', ') },
// // // //     { key: 'GeneSet', header: 'Gene Set' },
// // // //   ];

// // // //   const downloadCSV = () => {
// // // //     const headers = columns.map(col => col.header).join(",");
// // // //     const rows = enrichment.map(row => 
// // // //       [row.Term, row['P-value'].toExponential(4), row['Adjusted P-value'].toExponential(4), row.Genes.join(", "), row.GeneSet || ""].join(",")
// // // //     );
// // // //     const content = [headers, ...rows].join("\n");
// // // //     const blob = new Blob([content], { type: "text/csv" });
// // // //     const url = URL.createObjectURL(blob);
// // // //     const a = document.createElement("a");
// // // //     a.href = url;
// // // //     a.download = `pathway_enrichment_${Date.now()}.csv`;
// // // //     a.click();
// // // //     URL.revokeObjectURL(url);
// // // //   };

// // // //   return (
// // // //     <CollapsibleCard
// // // //       title="Enriched Pathways"
// // // //       downloadButton={
// // // //         <Button onClick={downloadCSV} variant="outline" size="sm" className="h-6 px-2 text-xs">
// // // //           <Download className="h-4 w-4 mr-2" /> Download CSV
// // // //         </Button>
// // // //       }
// // // //     >
// // // //       <DataTable
// // // //         data={enrichment}
// // // //         columns={columns}
// // // //         defaultSortKey="P-value"
// // // //         defaultSortOrder="asc"
// // // //         className="border rounded-md"
// // // //         containerWidth="100%"
// // // //       />
// // // //     </CollapsibleCard>
// // // //   );
// // // // };

// // // // const TumorAnalysisTable = ({ metrics }) => {
// // // //   const columns = [
// // // //     { key: 'sample', header: 'Sample', sortable: true },
// // // //     { key: 'DEPTH2', header: 'DEPTH2', sortable: true, render: (value) => value.toFixed(4) },
// // // //     { key: 'tITH', header: 'tITH', sortable: true, render: (value) => value.toFixed(4) },
// // // //   ];

// // // //   const downloadCSV = () => {
// // // //     const headers = columns.map(col => col.header).join(",");
// // // //     const rows = metrics.map(row => 
// // // //       [row.sample, row.DEPTH2.toFixed(4), row.tITH.toFixed(4)].join(",")
// // // //     );
// // // //     const content = [headers, ...rows].join("\n");
// // // //     const blob = new Blob([content], { type: "text/csv" });
// // // //     const url = URL.createObjectURL(blob);
// // // //     const a = document.createElement("a");
// // // //     a.href = url;
// // // //     a.download = `tumor_metrics_${Date.now()}.csv`;
// // // //     a.click();
// // // //     URL.revokeObjectURL(url);
// // // //   };

// // // //   return (
// // // //     <CollapsibleCard
// // // //       title="Tumor Heterogeneity Metrics"
// // // //       downloadButton={
// // // //         <Button onClick={downloadCSV} variant="outline" size="sm" className="h-6 px-2 text-xs">
// // // //           <Download className="h-4 w-4 mr-2" /> Download CSV
// // // //         </Button>
// // // //       }
// // // //     >
// // // //       <DataTable
// // // //         data={metrics}
// // // //         columns={columns}
// // // //         defaultSortKey="DEPTH2"
// // // //         defaultSortOrder="desc"
// // // //         className="border rounded-md"
// // // //         containerWidth="100%"
// // // //       />
// // // //     </CollapsibleCard>
// // // //   );
// // // // };

// // // // // const GeneAnalysisBarChart = ({ metrics, topGenes }) => {
// // // // //   const data = topGenes.map((gene) => ({
// // // // //     gene,
// // // // //     cv: metrics.cv?.[gene] || 0,
// // // // //     std: metrics.std?.[gene] || 0,
// // // // //     mad: metrics.mad?.[gene] || 0,
// // // // //     cv_squared: metrics.cv_squared?.[gene] || 0,
// // // // //     mean: metrics.mean?.[gene] || 0,
// // // // //   }));

// // // // //   console.log('GeneAnalysisBarChart Data:', data); // Debug the data

// // // // //   return (
// // // // //     <CollapsibleCard title="Gene Noise Metrics">
// // // // //       <PlotlyBarChart
// // // // //         data={data}
// // // // //         title="Gene Noise Metrics"
// // // // //         xKey="gene"
// // // // //         yKey={["cv", "std", "mad", "cv_squared", "mean"]}
// // // // //         xLabel="Genes"
// // // // //         yLabel="Metric Value"
// // // // //         colors={["rgba(59, 130, 246, 0.6)", "rgba(239, 68, 68, 0.6)", "rgba(34, 197, 94, 0.6)", "rgba(197, 178, 34, 0.6)", "rgba(151, 34, 197, 0.6)"]}
// // // // //         legendLabels={["CV", "STD", "MAD", "CV²", "Mean"]}
// // // // //         orientation="v"
// // // // //         showLegend={true}
// // // // //       />
// // // // //     </CollapsibleCard>
// // // // //   );
// // // // // };

// // // // const GeneAnalysisBarChart = ({ metrics, topGenes }) => {
// // // //   // Prepare data for two mean bars per gene: one with std error bars, one with mad error bars
// // // //   const data = topGenes.map((gene) => ({
// // // //     gene,
// // // //     cv: metrics.cv?.[gene] || 0,
// // // //     cv_squared: metrics.cv_squared?.[gene] || 0,
// // // //     mean_std: metrics.mean?.[gene] || 0, // Mean for std error bars
// // // //     mean_mad: metrics.mean?.[gene] || 0, // Mean for mad error bars
// // // //     std: metrics.std?.[gene] || 0,
// // // //     mad: metrics.mad?.[gene] || 0,
// // // //   }));
// // // //   // const data = topGenes.map((gene) => ({
// // // // //     gene,
// // // // //     cv: metrics.cv?.[gene] || 0,
// // // // //     std: metrics.std?.[gene] || 0,
// // // // //     mad: metrics.mad?.[gene] || 0,
// // // // //     cv_squared: metrics.cv_squared?.[gene] || 0,
// // // // //     mean: metrics.mean?.[gene] || 0,
// // // // //   }));

// // // //   console.log('GeneAnalysisBarChart Data:', data); // Debug data

// // // //   return (
    
// // // //     <CollapsibleCard title="Gene Mean with STD and MAD Error Bars">
// // // //       <PlotlyBarChart
// // // //         data={data}
// // // //         title="Gene Mean with STD and MAD Error Bars"
// // // //         xKey="gene"
// // // //         yKey={['mean_std', 'mean_mad']}
// // // //         errorKey={['std', 'mad']} // Map std and mad as error bars for respective mean bars
// // // //         xLabel="Genes"
// // // //         yLabel="Mean Expression"
// // // //         colors={['rgba(59, 130, 246, 0.8)', 'rgba(239, 68, 68, 0.8)']}
// // // //         legendLabels={['Mean (STD Error)', 'Mean (MAD Error)']}
// // // //         orientation="v"
// // // //         showLegend={true}
// // // //       />
// // // //       <PlotlyBarChart
// // // //         data={data}
// // // //         title="Coefficient of Variation"
// // // //         xKey="gene"
// // // //         yKey={["cv","cv_squared"]}
// // // //         xLabel="Genes"
// // // //         yLabel="Metric Value"
// // // //         colors={["rgba(34, 197, 94, 0.6)", "rgba(151, 34, 197, 0.6)"]}
// // // //         legendLabels={["CV", "CV²"]}
// // // //         orientation="v"
// // // //         showLegend={true}
// // // //       />
// // // //     </CollapsibleCard>
    
// // // //   );
// // // // };
// // // // const PathwayBarChart = ({ heatmapData, topGenes }) => {
// // // //   const data = topGenes.map((gene) => ({
// // // //     gene,
// // // //     mean: heatmapData[gene]?.mean || 0,
// // // //     cv: heatmapData[gene]?.cv || 0,
// // // //   }));

// // // //   return (
// // // //     <CollapsibleCard title="Pathway Analysis (Mean and CV)">
// // // //       <PlotlyBarChart
// // // //         data={data}
// // // //         title="Mean and CV of Gene Expression"
// // // //         xKey="gene"
// // // //         yKey={["mean", "cv"]}
// // // //         xLabel="Genes"
// // // //         yLabel="Value"
// // // //         colors={["rgba(59, 130, 246, 0.6)", "rgba(239, 68, 68, 0.6)"]}
// // // //         legendLabels={["Mean Expression", "Coefficient of Variation"]}
// // // //         orientation="v"
// // // //         showLegend={true}
// // // //       />
// // // //       {/* <CollapsibleCard title="Gene CV and CV² Metrics (Normalized)"> */}
// // // //       <PlotlyBarChart
// // // //         data={data}
// // // //         title="Gene CV and CV² Metrics (Normalized)"
// // // //         xKey="gene"
// // // //         yKey={['cv', 'cv_squared']}
// // // //         xLabel="Genes"
// // // //         yLabel="Normalized Metric Value"
// // // //         colors={['rgba(59, 130, 246, 0.8)', 'rgba(197, 178, 34, 0.8)']}
// // // //         legendLabels={['CV', 'CV²']}
// // // //         orientation="v"
// // // //         showLegend={true}
// // // //       />
// // // //     {/* </CollapsibleCard> */}
// // // //     </CollapsibleCard>
// // // //   );
// // // // };

// // // // const TumorAnalysisBoxPlot = ({ metrics }) => {
// // // //   const samples = metrics.map(item => item.sample);

// // // //   return (
// // // //     <CollapsibleCard title="Tumor Heterogeneity Metrics">
// // // //       <div className="space-y-6">
// // // //         <PlotlyBoxPlot
// // // //           data={metrics.map(item => ({ ...item, cancer_type: item.sample }))}
// // // //           title="DEPTH2 by Sample"
// // // //           xKey="DEPTH2"
// // // //           normalizationMethod="Metric Value"
// // // //           selectedGroups={samples}
// // // //           colorMap={samples.reduce((acc, sample, i) => ({ ...acc, [sample]: `hsl(${(i * 360 / samples.length)}, 70%, 50%)` }), {})}
// // // //           className="border rounded-md"
// // // //           showLegend={false}
// // // //         />
// // // //         <PlotlyBoxPlot
// // // //           data={metrics.map(item => ({ ...item, cancer_type: item.sample }))}
// // // //           title="tITH by Sample"
// // // //           xKey="tITH"
// // // //           normalizationMethod="Metric Value"
// // // //           selectedGroups={samples}
// // // //           colorMap={samples.reduce((acc, sample, i) => ({ ...acc, [sample]: `hsl(${(i * 360 / samples.length)}, 70%, 50%)` }), {})}
// // // //           className="border rounded-md"
// // // //           showLegend={false}
// // // //         />
// // // //       </div>
// // // //     </CollapsibleCard>
// // // //   );
// // // // };
// // // // // const TumorAnalysisBoxPlot = ({ metrics }) => {
// // // // //   const samples = metrics.map(item => item.sample);

// // // // //   // Custom Violin Plot Component defined inline
// // // // //   const CustomViolinPlot = ({ data, title, xKey, normalizationMethod, selectedGroups, colorMap, className, showLegend = false }) => {
// // // // //     // Prepare data for Plotly violin plot
// // // // //     const plotData = selectedGroups.map((group) => {
// // // // //       // Filter data for the current sample (group)
// // // // //       const groupData = data.filter((item) => item.cancer_type === group);
// // // // //       const values = groupData.map((item) => item[xKey]).filter((val) => val != null);

// // // // //       return {
// // // // //         y: values,
// // // // //         type: 'violin',
// // // // //         name: group,
// // // // //         marker: { color: colorMap[group] || '#1f77b4' },
// // // // //         points: false, // Disable individual points
// // // // //         box: {
// // // // //           visible: true,
// // // // //         },
// // // // //         meanline: {
// // // // //           visible: true,
// // // // //         },
// // // // //         line: {
// // // // //           color: 'black',
// // // // //           width: 1,
// // // // //         },
// // // // //         hoverinfo: 'y+name', // Show value and group name on hover
// // // // //       };
// // // // //     });

// // // // //     // Define layout for the violin plot
// // // // //     const layout = {
// // // // //       title: {
// // // // //         text: title,
// // // // //         font: { size: 16, color: '#1e3a8a' },
// // // // //         x: 0.5,
// // // // //         xanchor: 'center',
// // // // //       },
// // // // //       xaxis: {
// // // // //         title: 'Samples',
// // // // //         tickangle: 45,
// // // // //         tickfont: { size: 12 },
// // // // //       },
// // // // //       yaxis: {
// // // // //         title: normalizationMethod,
// // // // //         zeroline: false,
// // // // //         tickfont: { size: 12 },
// // // // //       },
// // // // //       showlegend: showLegend,
// // // // //       margin: { t: 50, b: 100, l: 60, r: 20 },
// // // // //       plot_bgcolor: 'rgba(0,0,0,0)',
// // // // //       paper_bgcolor: 'rgba(0,0,0,0)',
// // // // //       font: { color: '#1e3a8a' },
// // // // //       autosize: true,
// // // // //     };

// // // // //     // Config for responsiveness and interaction
// // // // //     const config = {
// // // // //       responsive: true,
// // // // //       displayModeBar: true,
// // // // //       modeBarButtonsToRemove: ['toImage', 'lasso2d', 'select2d'],
// // // // //     };

// // // // //     return (
// // // // //       <div className={className}>
// // // // //         <Plot
// // // // //           data={plotData}
// // // // //           layout={layout}
// // // // //           config={config}
// // // // //           style={{ width: '100%', height: '400px' }}
// // // // //         />
// // // // //       </div>
// // // // //     );
// // // // //   };

// // // // //   return (
// // // // //     <CollapsibleCard title="Tumor Heterogeneity Metrics">
// // // // //       <div className="space-y-6">
// // // // //         <CustomViolinPlot
// // // // //           data={metrics.map(item => ({ ...item, cancer_type: item.sample }))}
// // // // //           title="DEPTH2 by Sample"
// // // // //           xKey="DEPTH2"
// // // // //           normalizationMethod="Metric Value"
// // // // //           selectedGroups={samples}
// // // // //           colorMap={samples.reduce((acc, sample, i) => ({ ...acc, [sample]: `hsl(${(i * 360 / samples.length)}, 70%, 50%)` }), {})}
// // // // //           className="border rounded-md"
// // // // //           showLegend={false}
// // // // //         />
// // // // //         <CustomViolinPlot
// // // // //           data={metrics.map(item => ({ ...item, cancer_type: item.sample }))}
// // // // //           title="tITH by Sample"
// // // // //           xKey="tITH"
// // // // //           normalizationMethod="Metric Value"
// // // // //           selectedGroups={samples}
// // // // //           colorMap={samples.reduce((acc, sample, i) => ({ ...acc, [sample]: `hsl(${(i * 360 / samples.length)}, 70%, 50%)` }), {})}
// // // // //           className="border rounded-md"
// // // // //           showLegend={false}
// // // // //         />
// // // // //       </div>
// // // // //     </CollapsibleCard>
// // // // //   );
// // // // // };
// // // // const UploadResults = () => {
// // // //   const { state } = useLocation();
// // // //   const navigate = useNavigate();
// // // //   const { results, analysisType } = state || {};
// // // //   const [isOpen, setIsOpen] = useState(false);

// // // //   if (!results || !analysisType) {
// // // //     return (
// // // //       <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-yellow-50 flex flex-col">
// // // //         <Header />
// // // //         <main className="flex-grow py-8">
// // // //           <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
// // // //             <Card className="shadow-lg p-6 text-center">
// // // //               <h2 className="text-2xl font-bold text-blue-900 mb-4">No Results
// // // //                 <p className="text-blue-700 mb-6">Please submit an analysis from the upload page to view results.</p>
// // // //                 <Button
// // // //                   onClick={() => navigate('/')}
// // // //                   className="bg-gradient-to-r from-blue-600 to-blue-900 text-white px-3 py-2"
// // // //                 >
// // // //                   Return to Upload Page
// // // //                 </Button>
// // // //               </h2>
// // // //             </Card>
// // // //           </div>
// // // //         </main>
// // // //         <Footer />
// // // //       </div>
// // // //     );
// // // //   }

// // // //   return (
// // // //     <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-yellow-50 flex flex-col">
// // // //       <Header />
// // // //       <main className="flex-grow">
// // // //         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
// // // //           <div className="grid grid-cols-1 gap-6">
// // // //             <div>
              
// // // //               <Link
// // // //                 to="/upload-analysis"
// // // //                 className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-4 transition-colors"
// // // //               >
// // // //                 <ArrowLeft className="h-4 w-4 mr-2" />
// // // //                 Back to Upload
// // // //               </Link>
// // // //               <div className="mb-8">
// // // //                 <div className="flex items-center justify-between mb-6">
// // // //                   <h2 className="text-4xl font-bold text-blue-900">Results For {analysisType} Analysis</h2>
// // // //                 </div>
// // // //                 <div className="overflow-x-auto mb-6">
// // // //                   <table className="min-w-full bg-white border border-gray-200 rounded-lg shadow-sm">
// // // //                     <tbody>
// // // //                       <tr className="border-b">
// // // //                         <th className="text-left py-3 px-4 text-blue-700 font-semibold w-1/3">Analysis Type</th>
// // // //                         <td className="py-3 px-4 text-blue-700">{analysisType}</td>
// // // //                       </tr>
// // // //                     </tbody>
// // // //                   </table>
// // // //                 </div>
// // // //                 {results.warning && (
// // // //                 <Card className="shadow-lg p-4 mb-4 text-center text-yellow-700 bg-red-50">
// // // //                   <p className="text-lg">{results.warning}</p>
// // // //                 </Card>
// // // //               )}
// // // //               </div>
// // // //               {/* {analysisType === 'Tumor' && (
// // // //                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
// // // //                   <Card className="border-0 shadow-lg">
// // // //                     <CardContent className="flex flex-col items-center p-4 text-center">
// // // //                       <Info className="h-6 w-6 text-green-600 mb-2" />
// // // //                       <div className="text-2xl font-bold text-green-600">{totalNormalSamples}</div>
// // // //                       <div className="text-xs text-gray-600">Total Normal Samples</div>
// // // //                     </CardContent>
// // // //                   </Card>
// // // //                   <Card className="border-0 shadow-lg">
// // // //                     <CardContent className="flex flex-col items-center p-4 text-center">
// // // //                       <Info className="h-6 w-6 text-red-600 mb-2" />
// // // //                       <div className="text-2xl font-bold text-red-600">{totalTumorSamples}</div>
// // // //                       <div className="text-xs text-gray-600">Total Tumor Samples</div>
// // // //                     </CardContent>
// // // //                   </Card>
// // // //                 </div>
// // // //               )} */}
// // // //               {/* {analysisType === 'Tumor' && (
// // // //                 <CollapsibleCard
// // // //                   title="Sample Counts"
// // // //                 //   isOpen={isOpen}
// // // //                   toggleOpen={toggleOpen}
// // // //                 >
// // // //                   <table className="min-w-full bg-white border border-gray-200 rounded-lg shadow-sm">
// // // //                     <thead>
// // // //                       <tr>
// // // //                         <th className="py-2 px-4 text-left text-blue-700 font-semibold">Site</th>
// // // //                         <th className="py-2 px-4 text-left text-blue-700 font-semibold">Tumor Samples</th>
// // // //                         <th className="py-2 px-4 text-left text-blue-700 font-semibold">Normal Samples</th>
// // // //                       </tr>
// // // //                     </thead>
// // // //                     <tbody>
// // // //                       {sampleCounts.map((count, index) => (
// // // //                         <tr key={index} className="border-b">
// // // //                           <td className="py-2 px-4 text-blue-700">{count.site}</td>
// // // //                           <td className="py-2 px-4 text-blue-700">{count.tumor}</td>
// // // //                           <td className="py-2 px-4 text-blue-700">{count.normal}</td>
// // // //                         </tr>
// // // //                       ))}
// // // //                     </tbody>
// // // //                   </table>
// // // //                 </CollapsibleCard>
// // // //               )} */}
// // // //               {results.analysis_type === 'Gene' && results.metrics && results.top_genes && (
// // // //                 <>
// // // //                   <GeneAnalysisBarChart metrics={results.metrics} topGenes={results.top_genes} />
// // // //                   <GeneAnalysisTable metrics={results.metrics} topGenes={results.top_genes} />
// // // //                 </>
// // // //               )}
// // // //               {results.analysis_type === 'Pathway' && (
// // // //                 <>
// // // //                   {results.enrichment && results.enrichment.length > 0 && (
// // // //                     <PathwayAnalysisTable enrichment={results.enrichment} />
// // // //                   )}
// // // //                   {results.heatmap_data && results.top_genes && (
// // // //                     <PathwayBarChart heatmapData={results.heatmap_data} topGenes={results.top_genes} />
// // // //                   )}
// // // //                 </>
// // // //               )}
// // // //               {results.analysis_type === 'Tumor' && results.metrics && (
// // // //                 <>
// // // //                   <TumorAnalysisBoxPlot metrics={results.metrics} />
// // // //                   <TumorAnalysisTable metrics={results.metrics} />
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

// // // // export default UploadResults;
// // // import React, { useState, useMemo } from 'react';
// // // import { useLocation, useNavigate, Link } from 'react-router-dom';
// // // import { Alert, AlertDescription } from "@/components/ui/alert";
// // // import { Info, ArrowLeft, Download } from "lucide-react";
// // // import { DataTable } from "@/components/ui/data-table";
// // // import { PlotlyBarChart } from "@/components/charts/PlotlyBarChart";
// // // import PlotlyViolinPlot from "@/components/charts/PlotlyViolinPlot";
// // // import CollapsibleCard from '@/components/ui/collapsible-card';
// // // import Header from "@/components/header";
// // // import Footer from "@/components/footer";
// // // import { Button } from "@/components/ui/button";
// // // import { Card, CardContent } from "@/components/ui/card";
// // // import Plot from 'react-plotly.js'; 

// // // const GeneAnalysisTable = ({ metrics, topGenes }) => {
// // //   const columns = [
// // //     { key: 'gene', header: 'Gene', sortable: true },
// // //     { key: 'cv', header: 'CV', sortable: true, render: (value) => value.toFixed(4) },
// // //     { key: 'cv_squared', header: 'CV²', sortable: true, render: (value) => value.toFixed(4) },
// // //     { key: 'std', header: 'STD', sortable: true, render: (value) => value.toFixed(4) },
// // //     { key: 'mad', header: 'MAD', sortable: true, render: (value) => value.toFixed(4) },
// // //     { key: 'mean', header: 'Mean', sortable: true, render: (value) => value.toFixed(4) },
// // //   ];

// // //   const data = topGenes.map((gene) => ({
// // //     gene,
// // //     cv: metrics.cv?.[gene] || 0,
// // //     cv_squared: metrics.cv_squared?.[gene] || 0,
// // //     std: metrics.std?.[gene] || 0,
// // //     mad: metrics.mad?.[gene] || 0,
// // //     mean: metrics.mean?.[gene] || 0,
// // //   }));

// // //   const downloadCSV = () => {
// // //     const headers = columns.map(col => col.header).join(",");
// // //     const rows = data.map(row => 
// // //       [row.gene, row.cv.toFixed(4), row.cv_squared.toFixed(4), row.std.toFixed(4), row.mad.toFixed(4), row.mean.toFixed(4)].join(",")
// // //     );
// // //     const content = [headers, ...rows].join("\n");
// // //     const blob = new Blob([content], { type: "text/csv" });
// // //     const url = URL.createObjectURL(blob);
// // //     const a = document.createElement("a");
// // //     a.href = url;
// // //     a.download = `gene_analysis_metrics_${Date.now()}.csv`;
// // //     a.click();
// // //     URL.revokeObjectURL(url);
// // //   };

// // //   return (
// // //     <CollapsibleCard
// // //       title="Gene Noise Metrics"
// // //       downloadButton={
// // //         <Button onClick={downloadCSV} variant="outline" size="sm" className="h-6 px-2 text-xs">
// // //           <Download className="h-4 w-4 mr-2" /> Download CSV
// // //         </Button>
// // //       }
// // //     >
// // //       <DataTable
// // //         data={data}
// // //         columns={columns}
// // //         defaultSortKey="cv"
// // //         defaultSortOrder="desc"
// // //         className="border rounded-md"
// // //         containerWidth="100%"
// // //       />
// // //     </CollapsibleCard>
// // //   );
// // // };

// // // const PathwayAnalysisTable = ({ enrichment }) => {
// // //   const columns = [
// // //     { key: 'Term', header: 'Pathway', sortable: true },
// // //     { key: 'P-value', header: 'P-value', sortable: true, render: (value) => value.toExponential(4) },
// // //     { key: 'Adjusted P-value', header: 'Adjusted P-value', sortable: true, render: (value) => value.toExponential(4) },
// // //     { key: 'Genes', header: 'Genes', render: (value) => value.join(', ') },
// // //     { key: 'GeneSet', header: 'Gene Set' },
// // //   ];

// // //   const downloadCSV = () => {
// // //     const headers = columns.map(col => col.header).join(",");
// // //     const rows = enrichment.map(row => 
// // //       [row.Term, row['P-value'].toExponential(4), row['Adjusted P-value'].toExponential(4), row.Genes.join(", "), row.GeneSet || ""].join(",")
// // //     );
// // //     const content = [headers, ...rows].join("\n");
// // //     const blob = new Blob([content], { type: "text/csv" });
// // //     const url = URL.createObjectURL(blob);
// // //     const a = document.createElement("a");
// // //     a.href = url;
// // //     a.download = `pathway_enrichment_${Date.now()}.csv`;
// // //     a.click();
// // //     URL.revokeObjectURL(url);
// // //   };

// // //   return (
// // //     <CollapsibleCard
// // //       title="Enriched Pathways"
// // //       downloadButton={
// // //         <Button onClick={downloadCSV} variant="outline" size="sm" className="h-6 px-2 text-xs">
// // //           <Download className="h-4 w-4 mr-2" /> Download CSV
// // //         </Button>
// // //       }
// // //     >
// // //       <DataTable
// // //         data={enrichment}
// // //         columns={columns}
// // //         defaultSortKey="P-value"
// // //         defaultSortOrder="asc"
// // //         className="border rounded-md"
// // //         containerWidth="100%"
// // //       />
// // //     </CollapsibleCard>
// // //   );
// // // };

// // // const TumorAnalysisTable = ({ metrics }) => {
// // //   const columns = [
// // //     { key: 'sample', header: 'Sample', sortable: true },
// // //     { key: 'DEPTH2', header: 'DEPTH2', sortable: true, render: (value) => value.toFixed(4) },
// // //     { key: 'tITH', header: 'tITH', sortable: true, render: (value) => value.toFixed(4) },
// // //   ];

// // //   const downloadCSV = () => {
// // //     const headers = columns.map(col => col.header).join(",");
// // //     const rows = metrics.map(row => 
// // //       [row.sample, row.DEPTH2.toFixed(4), row.tITH.toFixed(4)].join(",")
// // //     );
// // //     const content = [headers, ...rows].join("\n");
// // //     const blob = new Blob([content], { type: "text/csv" });
// // //     const url = URL.createObjectURL(blob);
// // //     const a = document.createElement("a");
// // //     a.href = url;
// // //     a.download = `tumor_metrics_${Date.now()}.csv`;
// // //     a.click();
// // //     URL.revokeObjectURL(url);
// // //   };

// // //   return (
// // //     <CollapsibleCard
// // //       title="Tumor Heterogeneity Metrics"
// // //       downloadButton={
// // //         <Button onClick={downloadCSV} variant="outline" size="sm" className="h-6 px-2 text-xs">
// // //           <Download className="h-4 w-4 mr-2" /> Download CSV
// // //         </Button>
// // //       }
// // //     >
// // //       <DataTable
// // //         data={metrics}
// // //         columns={columns}
// // //         defaultSortKey="DEPTH2"
// // //         defaultSortOrder="desc"
// // //         className="border rounded-md"
// // //         containerWidth="100%"
// // //       />
// // //     </CollapsibleCard>
// // //   );
// // // };

// // // const GeneAnalysisBarChart = ({ metrics, topGenes }) => {
// // //   const data = topGenes.map((gene) => ({
// // //     gene,
// // //     cv: metrics.cv?.[gene] || 0,
// // //     cv_squared: metrics.cv_squared?.[gene] || 0,
// // //     mean_std: metrics.mean?.[gene] || 0,
// // //     mean_mad: metrics.mean?.[gene] || 0,
// // //     std: metrics.std?.[gene] || 0,
// // //     mad: metrics.mad?.[gene] || 0,
// // //   }));

// // //   console.log('GeneAnalysisBarChart Data:', data);

// // //   return (
// // //     <CollapsibleCard title="Gene Mean with STD and MAD Error Bars">
// // //       <PlotlyBarChart
// // //         data={data}
// // //         title="Gene Mean with STD and MAD Error Bars"
// // //         xKey="gene"
// // //         yKey={['mean_std', 'mean_mad']}
// // //         errorKey={['std', 'mad']}
// // //         xLabel="Genes"
// // //         yLabel="Mean Expression"
// // //         colors={['rgba(59, 130, 246, 0.8)', 'rgba(239, 68, 68, 0.8)']}
// // //         legendLabels={['Mean (STD Error)', 'Mean (MAD Error)']}
// // //         orientation="v"
// // //         showLegend={true}
// // //       />
// // //       <PlotlyBarChart
// // //         data={data}
// // //         title="Coefficient of Variation"
// // //         xKey="gene"
// // //         yKey={["cv","cv_squared"]}
// // //         xLabel="Genes"
// // //         yLabel="Metric Value"
// // //         colors={["rgba(34, 197, 94, 0.6)", "rgba(151, 34, 197, 0.6)"]}
// // //         legendLabels={["CV", "CV²"]}
// // //         orientation="v"
// // //         showLegend={true}
// // //       />
// // //     </CollapsibleCard>
// // //   );
// // // };

// // // const PathwayBarChart = ({ heatmapData, topGenes }) => {
// // //   const data = topGenes.map((gene) => ({
// // //     gene,
// // //     mean: heatmapData[gene]?.mean || 0,
// // //     cv: heatmapData[gene]?.cv || 0,
// // //   }));

// // //   return (
// // //     <CollapsibleCard title="Pathway Analysis (Mean and CV)">
// // //       <PlotlyBarChart
// // //         data={data}
// // //         title="Mean and CV of Gene Expression"
// // //         xKey="gene"
// // //         yKey={["mean", "cv"]}
// // //         xLabel="Genes"
// // //         yLabel="Value"
// // //         colors={["rgba(59, 130, 246, 0.6)", "rgba(239, 68, 68, 0.6)"]}
// // //         legendLabels={["Mean Expression", "Coefficient of Variation"]}
// // //         orientation="v"
// // //         showLegend={true}
// // //       />
// // //       <PlotlyBarChart
// // //         data={data}
// // //         title="Gene CV and CV² Metrics (Normalized)"
// // //         xKey="gene"
// // //         yKey={['cv', 'cv_squared']}
// // //         xLabel="Genes"
// // //         yLabel="Normalized Metric Value"
// // //         colors={['rgba(59, 130, 246, 0.8)', 'rgba(197, 178, 34, 0.8)']}
// // //         legendLabels={['CV', 'CV²']}
// // //         orientation="v"
// // //         showLegend={true}
// // //       />
// // //     </CollapsibleCard>
// // //   );
// // // };

// // // // const TumorAnalysisBoxPlot = ({ metrics }) => {
// // // //   const data = [
// // // //     {
// // // //       metric: 'DEPTH2',
// // // //       values: metrics.map(item => item.DEPTH2).filter(val => val != null),
// // // //     },
// // // //     {
// // // //       metric: 'tITH',
// // // //       values: metrics.map(item => item.tITH).filter(val => val != null),
// // // //     },
// // // //   ];

// // // //   return (
// // // //     <CollapsibleCard title="Tumor Heterogeneity Metrics">
// // // //       <div className="space-y-6">
// // // //         <PlotlyViolinPlot
// // // //           data={data}
// // // //           title="Distribution of Tumor Metrics"
// // // //           xKey="metric"
// // // //           yLabel="Metric Value"
// // // //           normalizationMethod="Metric Value"
// // // //           selectedGroups={['DEPTH2', 'tITH']}
// // // //           colorMap={{ 'DEPTH2': 'hsl(200, 70%, 50%)', 'tITH': 'hsl(0, 70%, 50%)' }}
// // // //           className="border rounded-md"
// // // //           showLegend={true}
// // // //         />
// // // //       </div>
// // // //     </CollapsibleCard>
// // // //   );
// // // // };
// // // const TumorAnalysisBoxPlot = ({ metrics }) => {
// // //   const data = metrics.map(item => ({
// // //     metric: 'DEPTH2',
// // //     value: item.DEPTH2,
// // //   })).concat(metrics.map(item => ({
// // //     metric: 'tITH',
// // //     value: item.tITH,
// // //   })));

// // //   return (
// // //     <CollapsibleCard title="Tumor Heterogeneity Metrics">
// // //       <div className="space-y-6">
// // //         <PlotlyViolinPlot
// // //           data={data}
// // //           title="Distribution of Tumor Metrics"
// // //           xKey="metric"
// // //           yLabel="Metric Value"
// // //           normalizationMethod="Metric Value"
// // //           selectedGroups={['DEPTH2', 'tITH']}
// // //           colorMap={{ 'DEPTH2': 'hsl(200, 70%, 50%)', 'tITH': 'hsla(155, 98%, 32%, 1.00)' }}
// // //           className="border rounded-md"
// // //           showLegend={true}
// // //         />
// // //       </div>
// // //     </CollapsibleCard>
// // //   );
// // // };

// // // const UploadResults = () => {
// // //   const { state } = useLocation();
// // //   const navigate = useNavigate();
// // //   const { results, analysisType } = state || {};
// // //   const [isOpen, setIsOpen] = useState(false);

// // //   if (!results || !analysisType) {
// // //     return (
// // //       <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-yellow-50 flex flex-col">
// // //         <Header />
// // //         <main className="flex-grow py-8">
// // //           <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
// // //             <Card className="shadow-lg p-6 text-center">
// // //               <h2 className="text-2xl font-bold text-blue-900 mb-4">No Results
// // //                 <p className="text-blue-700 mb-6">Please submit an analysis from the upload page to view results.</p>
// // //                 <Button
// // //                   onClick={() => navigate('/')}
// // //                   className="bg-gradient-to-r from-blue-600 to-blue-900 text-white px-3 py-2"
// // //                 >
// // //                   Return to Upload Page
// // //                 </Button>
// // //               </h2>
// // //             </Card>
// // //           </div>
// // //         </main>
// // //         <Footer />
// // //       </div>
// // //     );
// // //   }

// // //   return (
// // //     <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-yellow-50 flex flex-col">
// // //       <Header />
// // //       <main className="flex-grow">
// // //         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
// // //           <div className="grid grid-cols-1 gap-12">
// // //             <div>
// // //               <Link
// // //                 to="/upload-analysis"
// // //                 className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-4 transition-colors"
// // //               >
// // //                 <ArrowLeft className="h-4 w-4 mr-2" />
// // //                 Back to Upload
// // //               </Link>
// // //               <div className="mb-8">
// // //                 <div className="flex items-center justify-between mb-6">
// // //                   <h2 className="text-4xl font-bold text-blue-900">Results For {analysisType} Analysis</h2>
// // //                 </div>
// // //                 <div className="overflow-x-auto mb-6">
// // //                   <table className="min-w-full bg-white border border-gray-200 rounded-lg shadow-sm">
// // //                     <tbody>
// // //                       <tr className="border-b">
// // //                         <th className="text-left py-3 px-4 text-blue-700 font-semibold w-1/3">Analysis Type</th>
// // //                         <td className="py-3 px-4 text-blue-700">{analysisType}</td>
// // //                       </tr>
// // //                     </tbody>
// // //                   </table>
// // //                 </div>
// // //                 {results.warning && (
// // //                 <Card className="shadow-lg p-4 mb-4 text-center text-yellow-700 bg-red-50">
// // //                   <p className="text-lg">{results.warning}</p>
// // //                 </Card>
// // //               )}
// // //               </div>
// // //               {results.analysis_type === 'Gene' && results.metrics && results.top_genes && (
// // //                 <>
// // //                   <GeneAnalysisBarChart metrics={results.metrics} topGenes={results.top_genes} />
// // //                   <GeneAnalysisTable metrics={results.metrics} topGenes={results.top_genes} />
// // //                 </>
// // //               )}
// // //               {results.analysis_type === 'Pathway' && (
// // //                 <>
// // //                   {results.enrichment && results.enrichment.length > 0 && (
// // //                     <PathwayAnalysisTable enrichment={results.enrichment} />
// // //                   )}
// // //                   {results.heatmap_data && results.top_genes && (
// // //                     <PathwayBarChart heatmapData={results.heatmap_data} topGenes={results.top_genes} />
// // //                   )}
// // //                 </>
// // //               )}
// // //               {results.analysis_type === 'Tumor' && results.metrics && (
// // //                 <>
// // //                   <TumorAnalysisBoxPlot metrics={results.metrics} />
// // //                   <TumorAnalysisTable metrics={results.metrics} />
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

// // // export default UploadResults;
// // // import React, { useState, useMemo } from 'react';
// // // import { useLocation, useNavigate, Link } from 'react-router-dom';
// // // import { Alert, AlertDescription } from "@/components/ui/alert";
// // // import { Info, ArrowLeft, Download } from "lucide-react";
// // // import { DataTable } from "@/components/ui/data-table";
// // // import { PlotlyBarChart } from "@/components/charts/PlotlyBarChart";
// // // import PlotlyViolinPlot from "@/components/charts/PlotlyViolinPlot";
// // // import CollapsibleCard from '@/components/ui/collapsible-card';
// // // import Header from "@/components/header";
// // // import Footer from "@/components/footer";
// // // import { Button } from "@/components/ui/button";
// // // import { Card, CardContent } from "@/components/ui/card";
// // // import Plot from 'react-plotly.js'; 

// // // const GeneAnalysisTable = ({ metrics, topGenes }) => {
// // //   const columns = [
// // //     { key: 'gene', header: 'Gene', sortable: true },
// // //     { key: 'cv', header: 'CV', sortable: true, render: (value) => value.toFixed(4) },
// // //     { key: 'cv_squared', header: 'CV²', sortable: true, render: (value) => value.toFixed(4) },
// // //     { key: 'std', header: 'STD', sortable: true, render: (value) => value.toFixed(4) },
// // //     { key: 'mad', header: 'MAD', sortable: true, render: (value) => value.toFixed(4) },
// // //     { key: 'mean', header: 'Mean', sortable: true, render: (value) => value.toFixed(4) },
// // //   ];

// // //   const data = topGenes.map((gene) => ({
// // //     gene,
// // //     cv: metrics.cv?.[gene] || 0,
// // //     cv_squared: metrics.cv_squared?.[gene] || 0,
// // //     std: metrics.std?.[gene] || 0,
// // //     mad: metrics.mad?.[gene] || 0,
// // //     mean: metrics.mean?.[gene] || 0,
// // //   }));

// // //   const downloadCSV = () => {
// // //     const headers = columns.map(col => col.header).join(",");
// // //     const rows = data.map(row => 
// // //       [row.gene, row.cv.toFixed(4), row.cv_squared.toFixed(4), row.std.toFixed(4), row.mad.toFixed(4), row.mean.toFixed(4)].join(",")
// // //     );
// // //     const content = [headers, ...rows].join("\n");
// // //     const blob = new Blob([content], { type: "text/csv" });
// // //     const url = URL.createObjectURL(blob);
// // //     const a = document.createElement("a");
// // //     a.href = url;
// // //     a.download = `gene_analysis_metrics_${Date.now()}.csv`;
// // //     a.click();
// // //     URL.revokeObjectURL(url);
// // //   };

// // //   return (
// // //     <CollapsibleCard
// // //       title="Gene Noise Metrics"
// // //       className="mb-4"
// // //       downloadButton={
// // //         <Button onClick={downloadCSV} variant="outline" size="sm" className="h-6 px-2 text-xs">
// // //           <Download className="h-4 w-4 mr-2" /> Download CSV
// // //         </Button>
// // //       }
// // //     >
// // //       <DataTable
// // //         data={data}
// // //         columns={columns}
// // //         defaultSortKey="cv"
// // //         defaultSortOrder="desc"
// // //         className="border rounded-md"
// // //         containerWidth="100%"
// // //       />
// // //     </CollapsibleCard>
// // //   );
// // // };

// // // const PathwayAnalysisTable = ({ enrichment }) => {
// // //   const columns = [
// // //     { key: 'Term', header: 'Pathway', sortable: true },
// // //     { key: 'P-value', header: 'P-value', sortable: true, render: (value) => value.toExponential(4) },
// // //     { key: 'Adjusted P-value', header: 'Adjusted P-value', sortable: true, render: (value) => value.toExponential(4) },
// // //     { key: 'Genes', header: 'Genes', render: (value) => value.join(', ') },
// // //     { key: 'GeneSet', header: 'Gene Set' },
// // //   ];

// // //   const downloadCSV = () => {
// // //     const headers = columns.map(col => col.header).join(",");
// // //     const rows = enrichment.map(row => 
// // //       [row.Term, row['P-value'].toExponential(4), row['Adjusted P-value'].toExponential(4), row.Genes.join(", "), row.GeneSet || ""].join(",")
// // //     );
// // //     const content = [headers, ...rows].join("\n");
// // //     const blob = new Blob([content], { type: "text/csv" });
// // //     const url = URL.createObjectURL(blob);
// // //     const a = document.createElement("a");
// // //     a.href = url;
// // //     a.download = `pathway_enrichment_${Date.now()}.csv`;
// // //     a.click();
// // //     URL.revokeObjectURL(url);
// // //   };

// // //   return (
// // //     <CollapsibleCard
// // //       title="Enriched Pathways"
// // //       className="mb-4"
// // //       downloadButton={
// // //         <Button onClick={downloadCSV} variant="outline" size="sm" className="h-6 px-2 text-xs">
// // //           <Download className="h-4 w-4 mr-2" /> Download CSV
// // //         </Button>
// // //       }
// // //     >
// // //       <DataTable
// // //         data={enrichment}
// // //         columns={columns}
// // //         defaultSortKey="P-value"
// // //         defaultSortOrder="asc"
// // //         className="border rounded-md"
// // //         containerWidth="100%"
// // //       />
// // //     </CollapsibleCard>
// // //   );
// // // };

// // // const TumorAnalysisTable = ({ metrics }) => {
// // //   const columns = [
// // //     { key: 'sample', header: 'Sample', sortable: true },
// // //     { key: 'DEPTH2', header: 'DEPTH2', sortable: true, render: (value) => value.toFixed(4) },
// // //     { key: 'tITH', header: 'tITH', sortable: true, render: (value) => value.toFixed(4) },
// // //   ];

// // //   const downloadCSV = () => {
// // //     const headers = columns.map(col => col.header).join(",");
// // //     const rows = metrics.map(row => 
// // //       [row.sample, row.DEPTH2.toFixed(4), row.tITH.toFixed(4)].join(",")
// // //     );
// // //     const content = [headers, ...rows].join("\n");
// // //     const blob = new Blob([content], { type: "text/csv" });
// // //     const url = URL.createObjectURL(blob);
// // //     const a = document.createElement("a");
// // //     a.href = url;
// // //     a.download = `tumor_metrics_${Date.now()}.csv`;
// // //     a.click();
// // //     URL.revokeObjectURL(url);
// // //   };

// // //   return (
// // //     <CollapsibleCard
// // //       title="TH Metrics Table"
// // //       className="mb-4"
// // //       downloadButton={
// // //         <Button onClick={downloadCSV} variant="outline" size="sm" className="h-6 px-2 text-xs">
// // //           <Download className="h-4 w-4 mr-2" /> Download CSV
// // //         </Button>
// // //       }
// // //     >
// // //       <DataTable
// // //         data={metrics}
// // //         columns={columns}
// // //         defaultSortKey="DEPTH2"
// // //         defaultSortOrder="desc"
// // //         className="border rounded-md"
// // //         containerWidth="100%"
// // //       />
// // //     </CollapsibleCard>
// // //   );
// // // };

// // // const GeneAnalysisBarChart = ({ metrics, topGenes }) => {
// // //   const data = topGenes.map((gene) => ({
// // //     gene,
// // //     cv: metrics.cv?.[gene] || 0,
// // //     cv_squared: metrics.cv_squared?.[gene] || 0,
// // //     mean_std: metrics.mean?.[gene] || 0,
// // //     mean_mad: metrics.mean?.[gene] || 0,
// // //     std: metrics.std?.[gene] || 0,
// // //     mad: metrics.mad?.[gene] || 0,
// // //   }));

// // //   console.log('GeneAnalysisBarChart Data:', data);

// // //   return (
// // //     <CollapsibleCard title="Gene Mean with STD and MAD Error Bars" className="mb-4">
// // //       <PlotlyBarChart
// // //         data={data}
// // //         title="Gene Mean with STD and MAD Error Bars"
// // //         xKey="gene"
// // //         yKey={['mean_std', 'mean_mad']}
// // //         errorKey={['std', 'mad']}
// // //         xLabel="Genes"
// // //         yLabel="Mean Expression"
// // //         colors={['rgba(59, 130, 246, 0.8)', 'rgba(239, 68, 68, 0.8)']}
// // //         legendLabels={['Mean (STD Error)', 'Mean (MAD Error)']}
// // //         orientation="v"
// // //         showLegend={true}
// // //       />
// // //       <PlotlyBarChart
// // //         data={data}
// // //         title="Coefficient of Variation"
// // //         xKey="gene"
// // //         yKey={["cv","cv_squared"]}
// // //         xLabel="Genes"
// // //         yLabel="Metric Value"
// // //         colors={["rgba(34, 197, 94, 0.6)", "rgba(151, 34, 197, 0.6)"]}
// // //         legendLabels={["CV", "CV²"]}
// // //         orientation="v"
// // //         showLegend={true}
// // //       />
// // //     </CollapsibleCard>
// // //   );
// // // };

// // // const PathwayBarChart = ({ heatmapData, topGenes }) => {
// // //   const data = topGenes.map((gene) => ({
// // //     gene,
// // //     mean: heatmapData[gene]?.mean || 0,
// // //     cv: heatmapData[gene]?.cv || 0,
// // //   }));

// // //   return (
// // //     <CollapsibleCard title="Pathway Analysis (Mean and CV)" className="mb-4">
// // //       <PlotlyBarChart
// // //         data={data}
// // //         title="Mean and CV of Gene Expression"
// // //         xKey="gene"
// // //         yKey={["mean", "cv"]}
// // //         xLabel="Genes"
// // //         yLabel="Value"
// // //         colors={["rgba(59, 130, 246, 0.6)", "rgba(239, 68, 68, 0.6)"]}
// // //         legendLabels={["Mean Expression", "Coefficient of Variation"]}
// // //         orientation="v"
// // //         showLegend={true}
// // //       />
// // //       {/* <PlotlyBarChart
// // //         data={data}
// // //         title="Gene CV and CV² Metrics (Normalized)"
// // //         xKey="gene"
// // //         yKey={['cv', 'cv_squared']}
// // //         xLabel="Genes"
// // //         yLabel="Normalized Metric Value"
// // //         colors={['rgba(59, 130, 246, 0.8)', 'rgba(197, 178, 34, 0.8)']}
// // //         legendLabels={['CV', 'CV²']}
// // //         orientation="v"
// // //         showLegend={true}
// // //       /> */}
// // //     </CollapsibleCard>
// // //   );
// // // };

// // // const TumorAnalysisBoxPlot = ({ metrics }) => {
// // //   const data = metrics.map(item => ({
// // //     metric: 'DEPTH2',
// // //     value: item.DEPTH2,
// // //   })).concat(metrics.map(item => ({
// // //     metric: 'tITH',
// // //     value: item.tITH,
// // //   })));

// // //   return (
// // //     <CollapsibleCard title="TH Metrics Plots" className="mb-4">
// // //       <div className="space-y-6">
// // //         <PlotlyViolinPlot
// // //           data={data}
// // //           title="Distribution of Tumor Metrics"
// // //           xKey="metric"
// // //           yLabel="Metric Value"
// // //           normalizationMethod="Metric Value"
// // //           selectedGroups={['DEPTH2', 'tITH']}
// // //           colorMap={{ 'DEPTH2': 'hsl(200, 70%, 50%)', 'tITH': 'hsla(301, 98%, 32%, 1.00)' }}
// // //           className="border rounded-md"
// // //           showLegend={true}
// // //         />
// // //       </div>
// // //     </CollapsibleCard>
// // //   );
// // // };

// // // const UploadResults = () => {
// // //   const { state } = useLocation();
// // //   const navigate = useNavigate();
// // //   const { results, analysisType } = state || {};
// // //   const [isOpen, setIsOpen] = useState(false);

// // //   if (!results || !analysisType) {
// // //     return (
// // //       <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-yellow-50 flex flex-col">
// // //         <Header />
// // //         <main className="flex-grow py-8">
// // //           <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
// // //             <Card className="shadow-lg p-6 text-center">
// // //               <h2 className="text-2xl font-bold text-blue-900 mb-4">No Results
// // //                 <p className="text-blue-700 mb-6">Please submit an analysis from the upload page to view results.</p>
// // //                 <Button
// // //                   onClick={() => navigate('/')}
// // //                   className="bg-gradient-to-r from-blue-600 to-blue-900 text-white px-3 py-2"
// // //                 >
// // //                   Return to Upload Page
// // //                 </Button>
// // //               </h2>
// // //             </Card>
// // //           </div>
// // //         </main>
// // //         <Footer />
// // //       </div>
// // //     );
// // //   }

// // //   return (
// // //     <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-yellow-50 flex flex-col">
// // //       <Header />
// // //       <main className="flex-grow">
// // //         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
// // //           <div className="grid grid-cols-1 gap-12">
// // //             <div>
// // //               <Link
// // //                 to="/upload-analysis"
// // //                 className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-4 transition-colors"
// // //               >
// // //                 <ArrowLeft className="h-4 w-4 mr-2" />
// // //                 Back to Upload
// // //               </Link>
// // //               <div className="mb-8">
// // //                 <div className="flex items-center justify-between mb-6">
// // //                   <h2 className="text-4xl font-bold text-blue-900">Results For {analysisType} Analysis</h2>
// // //                 </div>
// // //                 <div className="overflow-x-auto mb-6">
// // //                   <table className="min-w-full bg-white border border-gray-200 rounded-lg shadow-sm">
// // //                     <tbody>
// // //                       <tr className="border-b">
// // //                         <th className="text-left py-3 px-4 text-blue-700 font-semibold w-1/3">Analysis Type</th>
// // //                         <td className="py-3 px-4 text-blue-700">{analysisType}</td>
// // //                       </tr>
// // //                     </tbody>
// // //                   </table>
// // //                 </div>
// // //                 {results.warning && (
// // //                 <Card className="shadow-lg p-4 mb-4 text-center text-yellow-700 bg-red-50">
// // //                   <p className="text-lg">{results.warning}</p>
// // //                 </Card>
// // //               )}
// // //               </div>
// // //               {results.analysis_type === 'Gene' && results.metrics && results.top_genes && (
// // //                 <>
// // //                   <GeneAnalysisBarChart metrics={results.metrics} topGenes={results.top_genes} />
// // //                   <GeneAnalysisTable metrics={results.metrics} topGenes={results.top_genes} />
// // //                 </>
// // //               )}
// // //               {results.analysis_type === 'Pathway' && (
// // //                 <>
// // //                   {results.enrichment && results.enrichment.length > 0 && (
// // //                     <PathwayAnalysisTable enrichment={results.enrichment} />
// // //                   )}
// // //                   {results.heatmap_data && results.top_genes && (
// // //                     <PathwayBarChart heatmapData={results.heatmap_data} topGenes={results.top_genes} />
// // //                   )}
// // //                 </>
// // //               )}
// // //               {results.analysis_type === 'Tumor' && results.metrics && (
// // //                 <>
// // //                   <TumorAnalysisBoxPlot metrics={results.metrics} />
// // //                   <TumorAnalysisTable metrics={results.metrics} />
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

// // // export default UploadResults;
// // import React, { useState, useMemo } from 'react';
// // import { useLocation, useNavigate, Link } from 'react-router-dom';
// // import { Alert, AlertDescription } from "@/components/ui/alert";
// // import { Info, ArrowLeft, Download } from "lucide-react";
// // import { DataTable } from "@/components/ui/data-table";
// // import { PlotlyBarChart } from "@/components/charts/PlotlyBarChart";
// // import PlotlyViolinPlot from "@/components/charts/PlotlyViolinPlot";
// // import CollapsibleCard from '@/components/ui/collapsible-card';
// // import Header from "@/components/header";
// // import Footer from "@/components/footer";
// // import { Button } from "@/components/ui/button";
// // import { Card, CardContent } from "@/components/ui/card";
// // import { Switch } from "@/components/ui/switch";
// // import { Label } from "@/components/ui/label";

// // const GeneAnalysisTable = ({ metrics, topGenes, transform }) => {
// //   const columns = [
// //     { key: 'gene', header: 'Gene', sortable: true },
// //     { key: 'cv', header: 'CV', sortable: true, render: (value) => value.toFixed(4) },
// //     { key: 'cv_squared', header: 'CV²', sortable: true, render: (value) => value.toFixed(4) },
// //     { key: 'std', header: 'STD', sortable: true, render: (value) => value.toFixed(4) },
// //     { key: 'mad', header: 'MAD', sortable: true, render: (value) => value.toFixed(4) },
// //     { key: 'mean', header: 'Mean', sortable: true, render: (value) => value.toFixed(4) },
// //   ];

// //   const data = topGenes.map((gene) => ({
// //     gene,
// //     cv: metrics.cv?.[gene] || 0,
// //     cv_squared: metrics.cv_squared?.[gene] || 0,
// //     std: metrics.std?.[gene] || 0,
// //     mad: metrics.mad?.[gene] || 0,
// //     mean: metrics.mean?.[gene] || 0,
// //   }));

// //   const downloadCSV = () => {
// //     const headers = columns.map(col => col.header).join(",");
// //     const rows = data.map(row => 
// //       [row.gene, row.cv.toFixed(4), row.cv_squared.toFixed(4), row.std.toFixed(4), row.mad.toFixed(4), row.mean.toFixed(4)].join(",")
// //     );
// //     const content = [headers, ...rows].join("\n");
// //     const blob = new Blob([content], { type: "text/csv" });
// //     const url = URL.createObjectURL(blob);
// //     const a = document.createElement("a");
// //     a.href = url;
// //     a.download = `gene_analysis_metrics_${transform}_${Date.now()}.csv`;
// //     a.click();
// //     URL.revokeObjectURL(url);
// //   };

// //   return (
// //     <CollapsibleCard
// //       title={`Gene Noise Metrics (${transform.toUpperCase()})`}
// //       className="mb-4"
// //       downloadButton={
// //         <Button onClick={downloadCSV} variant="outline" size="sm" className="h-6 px-2 text-xs">
// //           <Download className="h-4 w-4 mr-2" /> Download CSV
// //         </Button>
// //       }
// //     >
      
// //       <DataTable
// //         data={data}
// //         columns={columns}
// //         defaultSortKey="cv"
// //         defaultSortOrder="desc"
// //         className="border rounded-md"
// //         containerWidth="100%"
// //       />
// //     </CollapsibleCard>
// //   );
// // };

// // const PathwayAnalysisTable = ({ enrichment, transform }) => {
// //   const columns = [
// //     { key: 'Term', header: 'Pathway', sortable: true },
// //     { key: 'P-value', header: 'P-value', sortable: true, render: (value) => value.toExponential(4) },
// //     { key: 'Adjusted P-value', header: 'Adjusted P-value', sortable: true, render: (value) => value.toExponential(4) },
// //     { key: 'Genes', header: 'Genes', render: (value) => value.join(', ') },
// //     { key: 'GeneSet', header: 'Gene Set' },
// //   ];

// //   const downloadCSV = () => {
// //     const headers = columns.map(col => col.header).join(",");
// //     const rows = enrichment.map(row => 
// //       [row.Term, row['P-value'].toExponential(4), row['Adjusted P-value'].toExponential(4), row.Genes.join(", "), row.GeneSet || ""].join(",")
// //     );
// //     const content = [headers, ...rows].join("\n");
// //     const blob = new Blob([content], { type: "text/csv" });
// //     const url = URL.createObjectURL(blob);
// //     const a = document.createElement("a");
// //     a.href = url;
// //     a.download = `pathway_enrichment_${transform}_${Date.now()}.csv`;
// //     a.click();
// //     URL.revokeObjectURL(url);
// //   };

// //   return (
// //     <CollapsibleCard
// //       title={`Enriched Pathways (${transform.toUpperCase()})`}
// //       className="mb-4"
// //       downloadButton={
// //         <Button onClick={downloadCSV} variant="outline" size="sm" className="h-6 px-2 text-xs">
// //           <Download className="h-4 w-4 mr-2" /> Download CSV
// //         </Button>
// //       }
// //     >
      
// //       <DataTable
// //         data={enrichment}
// //         columns={columns}
// //         defaultSortKey="P-value"
// //         defaultSortOrder="asc"
// //         className="border rounded-md"
// //         containerWidth="100%"
// //       />
// //     </CollapsibleCard>
// //   );
// // };

// // const TumorAnalysisTable = ({ metrics }) => {
// //   const columns = [
// //     { key: 'sample', header: 'Sample', sortable: true },
// //     { key: 'DEPTH2', header: 'DEPTH2', sortable: true, render: (value) => value.toFixed(4) },
// //     { key: 'tITH', header: 'tITH', sortable: true, render: (value) => value.toFixed(4) },
// //   ];

// //   const downloadCSV = () => {
// //     const headers = columns.map(col => col.header).join(",");
// //     const rows = metrics.map(row => 
// //       [row.sample, row.DEPTH2.toFixed(4), row.tITH.toFixed(4)].join(",")
// //     );
// //     const content = [headers, ...rows].join("\n");
// //     const blob = new Blob([content], { type: "text/csv" });
// //     const url = URL.createObjectURL(blob);
// //     const a = document.createElement("a");
// //     a.href = url;
// //     a.download = `tumor_metrics_${Date.now()}.csv`;
// //     a.click();
// //     URL.revokeObjectURL(url);
// //   };

// //   return (
// //     <CollapsibleCard
// //       title="TH Metrics Table (Log2)"
// //       className="mb-4"
// //       downloadButton={
// //         <Button onClick={downloadCSV} variant="outline" size="sm" className="h-6 px-2 text-xs">
// //           <Download className="h-4 w-4 mr-2" /> Download CSV
// //         </Button>
// //       }
// //     >
// //       <DataTable
// //         data={metrics}
// //         columns={columns}
// //         defaultSortKey="DEPTH2"
// //         defaultSortOrder="desc"
// //         className="border rounded-md"
// //         containerWidth="100%"
// //       />
// //     </CollapsibleCard>
// //   );
// // };

// // const GeneAnalysisBarChart = ({ metricsRaw, metricsLog2, topGenesRaw, topGenesLog2, defaultTransform = 'log2' }) => {
// //   const [dataFormat, setDataFormat] = useState(defaultTransform);

// //   const handleMetricDataFormatChange = (checked: boolean) => {
// //     setDataFormat(checked ? 'log2' : 'raw');
// //   };

// //   const metrics = dataFormat === 'log2' ? metricsLog2 : metricsRaw;
// //   const topGenes = dataFormat === 'log2' ? topGenesLog2 : topGenesRaw;

// //   const data = topGenes.map((gene) => ({
// //     gene,
// //     cv: metrics.cv?.[gene] || 0,
// //     cv_squared: metrics.cv_squared?.[gene] || 0,
// //     mean_std: metrics.mean?.[gene] || 0,
// //     mean_mad: metrics.mean?.[gene] || 0,
// //     std: metrics.std?.[gene] || 0,
// //     mad: metrics.mad?.[gene] || 0,
// //   }));

// //   console.log(`GeneAnalysisBarChart Data (${dataFormat}):`, data);

// //   // return (
// //   //   <CollapsibleCard title={`Gene Mean with STD and MAD Error Bars (${dataFormat.toUpperCase()})`} className="mb-4">
// //   //     <div className="flex justify-end items-center space-x-2 mb-4">
// //   //       <Switch
// //   //         id="gene-data-format-switch"
// //   //         checked={dataFormat === 'log2'}
// //   //         onCheckedChange={handleMetricDataFormatChange}
// //   //         className="data-[state=checked]:bg-blue-600 data-[state=unchecked]:bg-gray-300"
// //   //       />
// //   //       <Label
// //   //         htmlFor="gene-data-format-switch"
// //   //         className="text-sm text-blue-900"
// //   //       >
// //   //         Log<sub>2</sub> Transform
// //   //       </Label>
// //   //     </div>
// //   //     <PlotlyBarChart
// //   //       data={data}
// //   //       title={`Gene Mean with STD and MAD Error Bars (${dataFormat.toUpperCase()})`}
// //   //       xKey="gene"
// //   //       yKey={['mean_std', 'mean_mad']}
// //   //       errorKey={['std', 'mad']}
// //   //       xLabel="Genes"
// //   //       yLabel="Mean Expression"
// //   //       colors={['rgba(59, 130, 246, 0.8)', 'rgba(239, 68, 68, 0.8)']}
// //   //       legendLabels={['Mean (STD Error)', 'Mean (MAD Error)']}
// //   //       orientation="v"
// //   //       showLegend={true}
// //   //     />
      
// //   //     <PlotlyBarChart
// //   //       data={data}
// //   //       title={`Coefficient of Variation (${dataFormat.toUpperCase()})`}
// //   //       xKey="gene"
// //   //       yKey={["cv", "cv_squared"]}
// //   //       xLabel="Genes"
// //   //       yLabel="Metric Value"
// //   //       colors={["rgba(34, 197, 94, 0.6)", "rgba(151, 34, 197, 0.6)"]}
// //   //       legendLabels={["CV", "CV²"]}
// //   //       orientation="v"
// //   //       showLegend={true}
// //   //     />
// //   //   </CollapsibleCard>
// //   // );
// //   return (
// //   <>
// //     {/* First Card: Gene Mean with STD and MAD Error Bars */}
// //     <CollapsibleCard
// //       title={`Gene Mean with STD and MAD Error Bars (${dataFormat.toUpperCase()})`}
// //       className="mb-4"
// //     >
// //       {/* <div className="flex justify-end items-center space-x-2 mb-4"> */}
// //       <div className="flex items-center space-x-2 mb-4 justify-left px-4">
// //         <Switch
// //           id="gene-data-format-switch"
// //           checked={dataFormat === "log2"}
// //           onCheckedChange={handleMetricDataFormatChange}
// //           className="data-[state=checked]:bg-blue-600 data-[state=unchecked]:bg-gray-300"
// //         />
// //         <Label
// //           htmlFor="gene-data-format-switch"
// //           className="text-sm text-blue-900"
// //         >
// //           Log<sub>2</sub> Transform
// //         </Label>
// //       </div>

// //       <PlotlyBarChart
// //         data={data}
// //         title={`Gene Mean with STD and MAD Error Bars (${dataFormat.toUpperCase()})`}
// //         xKey="gene"
// //         yKey={["mean_std", "mean_mad"]}
// //         errorKey={["std", "mad"]}
// //         xLabel="Genes"
// //         yLabel="Mean Expression"
// //         colors={["rgba(59, 130, 246, 0.8)", "rgba(239, 68, 68, 0.8)"]}
// //         legendLabels={["Mean (STD Error)", "Mean (MAD Error)"]}
// //         orientation="v"
// //         showLegend={true}
// //       />
// //     </CollapsibleCard>

// //     {/* Second Card: Coefficient of Variation */}
// //     <CollapsibleCard
// //       title={`Coefficient of Variation (${dataFormat.toUpperCase()})`}
// //       className="mb-4"
// //     >
// //       {/* <div className="flex justify-end items-center space-x-2 mb-4"> */}
// //       <div className="flex items-center space-x-2 mb-4 justify-left px-4">
// //         <Switch
// //           id="gene-data-format-switch"
// //           checked={dataFormat === "log2"}
// //           onCheckedChange={handleMetricDataFormatChange}
// //           className="data-[state=checked]:bg-blue-600 data-[state=unchecked]:bg-gray-300"
// //         />
// //         <Label
// //           htmlFor="gene-data-format-switch"
// //           className="text-sm text-blue-900"
// //         >
// //           Log<sub>2</sub> Transform
// //         </Label>
// //       </div>

// //       <PlotlyBarChart
// //         data={data}
// //         title={`Coefficient of Variation (${dataFormat.toUpperCase()})`}
// //         xKey="gene"
// //         yKey={["cv", "cv_squared"]}
// //         xLabel="Genes"
// //         yLabel="Metric Value"
// //         colors={["rgba(34, 197, 94, 0.6)", "rgba(151, 34, 197, 0.6)"]}
// //         legendLabels={["CV", "CV²"]}
// //         orientation="v"
// //         showLegend={true}
// //       />
// //     </CollapsibleCard>
// //   </>
// // );
// // };

// // const PathwayBarChart = ({ heatmapDataRaw, heatmapDataLog2, topGenesRaw, topGenesLog2, defaultTransform = 'log2' }) => {
// //   const [dataFormat, setDataFormat] = useState(defaultTransform);

// //   const handleMetricDataFormatChange = (checked: boolean) => {
// //     setDataFormat(checked ? 'log2' : 'raw');
// //   };

// //   const heatmapData = dataFormat === 'log2' ? heatmapDataLog2 : heatmapDataRaw;
// //   const topGenes = dataFormat === 'log2' ? topGenesLog2 : topGenesRaw;

// //   const data = topGenes.map((gene) => ({
// //     gene,
// //     mean: heatmapData[gene]?.mean || 0,
// //     cv: heatmapData[gene]?.cv || 0,
// //   }));

// //   return (
// //     <CollapsibleCard title={`Pathway Analysis (Mean and CV) (${dataFormat.toUpperCase()})`} className="mb-4">
// //       {/* <div className="flex justify-end items-center space-x-2 mb-4"> */}
// //       <div className="flex items-center space-x-2 mb-4 justify-left px-4">
// //         <Switch
// //           id="pathway-data-format-switch"
// //           checked={dataFormat === 'log2'}
// //           onCheckedChange={handleMetricDataFormatChange}
// //           className="data-[state=checked]:bg-blue-600 data-[state=unchecked]:bg-gray-300"
// //         />
// //         <Label
// //           htmlFor="pathway-data-format-switch"
// //           className="text-sm text-blue-900"
// //         >
// //           Log<sub>2</sub> Transform
// //         </Label>
// //       </div>
// //       <PlotlyBarChart
// //         data={data}
// //         title={`Mean and CV of Gene Expression (${dataFormat.toUpperCase()})`}
// //         xKey="gene"
// //         yKey={["mean", "cv"]}
// //         xLabel="Genes"
// //         yLabel="Value"
// //         colors={["rgba(59, 130, 246, 0.6)", "rgba(239, 68, 68, 0.6)"]}
// //         legendLabels={["Mean Expression", "Coefficient of Variation"]}
// //         orientation="v"
// //         showLegend={true}
// //       />
// //     </CollapsibleCard>
// //   );
// // };

// // const TumorAnalysisBoxPlot = ({ metrics }) => {
// //   const data = metrics.map(item => ({
// //     metric: 'DEPTH2',
// //     value: item.DEPTH2,
// //   })).concat(metrics.map(item => ({
// //     metric: 'tITH',
// //     value: item.tITH,
// //   })));

// //   return (
// //     <CollapsibleCard title="TH Metrics Plots (Log2)" className="mb-4">
// //       <div className="space-y-6">
// //         <PlotlyViolinPlot
// //           data={data}
// //           title="Distribution of Tumor Metrics"
// //           xKey="metric"
// //           yLabel="Metric Value"
// //           normalizationMethod="Metric Value"
// //           selectedGroups={['DEPTH2', 'tITH']}
// //           colorMap={{ 'DEPTH2': 'hsl(200, 70%, 50%)', 'tITH': 'hsla(301, 98%, 32%, 1.00)' }}
// //           className="border rounded-md"
// //           showLegend={true}
// //         />
// //       </div>
// //     </CollapsibleCard>
// //   );
// // };

// // const UploadResults = () => {
// //   const { state } = useLocation();
// //   const navigate = useNavigate();
// //   const { results, analysisType } = state || {};
// //   const [geneDataFormat, setGeneDataFormat] = useState('log2');
// //   const [pathwayDataFormat, setPathwayDataFormat] = useState('log2');

// //   const handleMetricDataFormatChange = (analysis: string, checked: boolean) => {
// //     if (analysis === 'gene') {
// //       setGeneDataFormat(checked ? 'log2' : 'raw');
// //     } else if (analysis === 'pathway') {
// //       setPathwayDataFormat(checked ? 'log2' : 'raw');
// //     }
// //   };

// //   if (!results || !analysisType) {
// //     return (
// //       <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-yellow-50 flex flex-col">
// //         <Header />
// //         <main className="flex-grow py-8">
// //           <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
// //             <Card className="shadow-lg p-6 text-center">
// //               <h2 className="text-2xl font-bold text-blue-900 mb-4">No Results
// //                 <p className="text-blue-700 mb-6">Please submit an analysis from the upload page to view results.</p>
// //                 <Button
// //                   onClick={() => navigate('/')}
// //                   className="bg-gradient-to-r from-blue-600 to-blue-900 text-white px-3 py-2"
// //                 >
// //                   Return to Upload Page
// //                 </Button>
// //               </h2>
// //             </Card>
// //           </div>
// //         </main>
// //         <Footer />
// //       </div>
// //     );
// //   }

// //   return (
// //     <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-yellow-50 flex flex-col">
// //       <Header />
// //       <main className="flex-grow">
// //         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
// //           <div className="grid grid-cols-1 gap-12">
// //             <div>
// //               <Link
// //                 to="/upload-analysis"
// //                 className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-4 transition-colors"
// //               >
// //                 <ArrowLeft className="h-4 w-4 mr-2" />
// //                 Back to Upload
// //               </Link>
// //               <div className="mb-8">
// //                 <div className="flex items-center justify-between mb-6">
// //                   <h2 className="text-4xl font-bold text-blue-900">Results For {analysisType} Analysis</h2>
// //                 </div>
// //                 <div className="overflow-x-auto mb-6">
// //                   <table className="min-w-full bg-white border border-gray-200 rounded-lg shadow-sm">
// //                     <tbody>
// //                       <tr className="border-b">
// //                         <th className="text-left py-3 px-4 text-blue-700 font-semibold w-1/3">Analysis Type</th>
// //                         <td className="py-3 px-4 text-blue-700">{analysisType}</td>
// //                       </tr>
// //                     </tbody>
// //                   </table>
// //                 </div>
// //                 {(results.raw?.warning || results.log2?.warning) && (
// //                   <Card className="shadow-lg p-4 mb-4 text-center text-yellow-700 bg-red-50">
// //                     {results.raw?.warning && results.log2?.warning ? (
// //                       <>
// //                         <p className="text-lg">{results.raw.warning}</p>
// //                         {/* <p className="text-lg"><strong>Log2 Data Warning:</strong> {results.log2.warning}</p> */}
// //                       </>
// //                     ) : results.raw?.warning ? (
// //                       <p className="text-lg">{results.raw.warning}</p>
// //                     ) : results.log2?.warning ? (
// //                       <p className="text-lg">{results.log2.warning}</p>
// //                     ) : null}
// //                   </Card>
// //                 )}
// //               </div>
// //               {analysisType === 'Gene' && results.raw && results.log2 && (
// //                 <>
// //                   <GeneAnalysisBarChart
// //                     metricsRaw={results.raw.metrics}
// //                     metricsLog2={results.log2.metrics}
// //                     topGenesRaw={results.raw.top_genes}
// //                     topGenesLog2={results.log2.top_genes}
// //                     defaultTransform={geneDataFormat}
// //                   />
// //                   <GeneAnalysisTable
// //                     metrics={results[geneDataFormat].metrics}
// //                     topGenes={results[geneDataFormat].top_genes}
// //                     transform={geneDataFormat}
// //                   />
// //                 </>
// //               )}
// //               {analysisType === 'Pathway' && results.raw && results.log2 && (
// //                 <>
// //                   {results[pathwayDataFormat].enrichment && results[pathwayDataFormat].enrichment.length > 0 && (
// //                     <PathwayAnalysisTable
// //                       enrichment={results[pathwayDataFormat].enrichment}
// //                       transform={pathwayDataFormat}
// //                     />
// //                   )}
// //                   {results[pathwayDataFormat].heatmap_data && results[pathwayDataFormat].top_genes && (
// //                     <PathwayBarChart
// //                       heatmapDataRaw={results.raw.heatmap_data}
// //                       heatmapDataLog2={results.log2.heatmap_data}
// //                       topGenesRaw={results.raw.top_genes}
// //                       topGenesLog2={results.log2.top_genes}
// //                       defaultTransform={pathwayDataFormat}
// //                     />
// //                   )}
// //                 </>
// //               )}
// //               {analysisType === 'Tumor' && results.log2?.metrics && (
// //                 <>
// //                   <TumorAnalysisBoxPlot metrics={results.log2.metrics} />
// //                   <TumorAnalysisTable metrics={results.log2.metrics} />
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

// // export default UploadResults;
// // import React, { useState, useMemo } from 'react';
// // import { useLocation, useNavigate, Link } from 'react-router-dom';
// // import { Alert, AlertDescription } from "@/components/ui/alert";
// // import { Info, ArrowLeft, Download } from "lucide-react";
// // import { DataTable } from "@/components/ui/data-table";
// // import { PlotlyBarChart } from "@/components/charts/PlotlyBarChart";
// // import PlotlyViolinPlot from "@/components/charts/PlotlyViolinPlot";
// // import CollapsibleCard from '@/components/ui/collapsible-card';
// // import Header from "@/components/header";
// // import Footer from "@/components/footer";
// // import { Button } from "@/components/ui/button";
// // import { Card, CardContent } from "@/components/ui/card";
// // import { Switch } from "@/components/ui/switch";
// // import { Label } from "@/components/ui/label";

// // const GeneAnalysisTable = ({ metricsRaw, metricsLog2, topGenesRaw, topGenesLog2 }) => {
// //   const [dataFormat, setDataFormat] = useState('log2');

// //   const handleMetricDataFormatChange = (checked: boolean) => {
// //     setDataFormat(checked ? 'log2' : 'raw');
// //   };

// //   const metrics = dataFormat === 'log2' ? metricsLog2 : metricsRaw;
// //   const topGenes = dataFormat === 'log2' ? topGenesLog2 : topGenesRaw;

// //   const columns = [
// //     { key: 'gene', header: 'Gene', sortable: true },
// //     { key: 'cv', header: 'CV', sortable: true, render: (value) => value.toFixed(4) },
// //     { key: 'cv_squared', header: 'CV²', sortable: true, render: (value) => value.toFixed(4) },
// //     { key: 'std', header: 'STD', sortable: true, render: (value) => value.toFixed(4) },
// //     { key: 'mad', header: 'MAD', sortable: true, render: (value) => value.toFixed(4) },
// //     { key: 'mean', header: 'Mean', sortable: true, render: (value) => value.toFixed(4) },
// //   ];

// //   const data = topGenes.map((gene) => ({
// //     gene,
// //     cv: metrics.cv?.[gene] || 0,
// //     cv_squared: metrics.cv_squared?.[gene] || 0,
// //     std: metrics.std?.[gene] || 0,
// //     mad: metrics.mad?.[gene] || 0,
// //     mean: metrics.mean?.[gene] || 0,
// //   }));

// //   const downloadCSV = () => {
// //     const headers = columns.map(col => col.header).join(",");
// //     const rows = data.map(row => 
// //       [row.gene, row.cv.toFixed(4), row.cv_squared.toFixed(4), row.std.toFixed(4), row.mad.toFixed(4), row.mean.toFixed(4)].join(",")
// //     );
// //     const content = [headers, ...rows].join("\n");
// //     const blob = new Blob([content], { type: "text/csv" });
// //     const url = URL.createObjectURL(blob);
// //     const a = document.createElement("a");
// //     a.href = url;
// //     a.download = `gene_analysis_metrics_${dataFormat}_${Date.now()}.csv`;
// //     a.click();
// //     URL.revokeObjectURL(url);
// //   };

// //   return (
// //     <CollapsibleCard
// //       title={`Gene Noise Metrics`}
// //       className="mb-4"
// //       downloadButton={
// //         <Button onClick={downloadCSV} variant="outline" size="sm" className="h-6 px-2 text-xs">
// //           <Download className="h-4 w-4 mr-2" /> Download CSV
// //         </Button>
// //       }
// //     >
// //       {/* <div className="flex items-center space-x-2 mb-4 justify-center"> */}
// //       <div className="flex items-center space-x-2 mb-4 justify-center">
// //         <Switch
// //           id="gene-table-data-format-switch"
// //           checked={dataFormat === 'log2'}
// //           onCheckedChange={handleMetricDataFormatChange}
// //           className="data-[state=checked]:bg-blue-600 data-[state=unchecked]:bg-gray-300"
// //         />
// //         <Label
// //           htmlFor="gene-table-data-format-switch"
// //           className="text-sm text-blue-900"
// //         >
// //           Log<sub>2</sub>(X + 1)
// //         </Label>
// //       </div>
// //       <DataTable
// //         data={data}
// //         columns={columns}
// //         defaultSortKey="cv"
// //         defaultSortOrder="desc"
// //         className="border rounded-md"
// //         containerWidth="100%"
// //       />
// //     </CollapsibleCard>
// //   );
// // };

// // const PathwayAnalysisTable = ({ enrichmentRaw, enrichmentLog2 }) => {
// //   const [dataFormat, setDataFormat] = useState('log2');

// //   const handleMetricDataFormatChange = (checked: boolean) => {
// //     setDataFormat(checked ? 'log2' : 'raw');
// //   };

// //   const enrichment = dataFormat === 'log2' ? enrichmentLog2 : enrichmentRaw;

// //   const columns = [
// //     { key: 'Term', header: 'Pathway', sortable: true },
// //     { key: 'P-value', header: 'P-value', sortable: true, render: (value) => value.toExponential(4) },
// //     { key: 'Adjusted P-value', header: 'Adjusted P-value', sortable: true, render: (value) => value.toExponential(4) },
// //     { key: 'Genes', header: 'Genes', render: (value) => value.join(', ') },
// //     { key: 'GeneSet', header: 'Gene Set' },
// //   ];

// //   const downloadCSV = () => {
// //     const headers = columns.map(col => col.header).join(",");
// //     const rows = enrichment.map(row => 
// //       [row.Term, row['P-value'].toExponential(4), row['Adjusted P-value'].toExponential(4), row.Genes.join(", "), row.GeneSet || ""].join(",")
// //     );
// //     const content = [headers, ...rows].join("\n");
// //     const blob = new Blob([content], { type: "text/csv" });
// //     const url = URL.createObjectURL(blob);
// //     const a = document.createElement("a");
// //     a.href = url;
// //     a.download = `pathway_enrichment_${dataFormat}_${Date.now()}.csv`;
// //     a.click();
// //     URL.revokeObjectURL(url);
// //   };

// //   return (
// //     <CollapsibleCard
// //       title={`Enriched Pathways`}
// //       className="mb-4"
// //       downloadButton={
// //         <Button onClick={downloadCSV} variant="outline" size="sm" className="h-6 px-2 text-xs">
// //           <Download className="h-4 w-4 mr-2" /> Download CSV
// //         </Button>
// //       }
// //     >
// //       {/* <div className="flex justify-end items-center space-x-2 mb-4"> */}
// //       {/* <div className="flex items-center space-x-2 mb-4 justify-center">
// //         <Switch
// //           id="pathway-table-data-format-switch"
// //           checked={dataFormat === 'log2'}
// //           onCheckedChange={handleMetricDataFormatChange}
// //           className="data-[state=checked]:bg-blue-600 data-[state=unchecked]:bg-gray-300"
// //         />
// //         <Label
// //           htmlFor="pathway-table-data-format-switch"
// //           className="text-sm text-blue-900"
// //         >
// //           Log<sub>2</sub>(X + 1)
// //         </Label>
// //       </div> */}
// //       <DataTable
// //         data={enrichment}
// //         columns={columns}
// //         defaultSortKey="P-value"
// //         defaultSortOrder="asc"
// //         className="border rounded-md"
// //         containerWidth="100%"
// //       />
// //     </CollapsibleCard>
// //   );
// // };

// // const TumorAnalysisTable = ({ metrics }) => {
// //   const columns = [
// //     { key: 'sample', header: 'Sample', sortable: true },
// //     { key: 'DEPTH2', header: 'DEPTH2', sortable: true, render: (value) => value.toFixed(4) },
// //     { key: 'tITH', header: 'tITH', sortable: true, render: (value) => value.toFixed(4) },
// //   ];

// //   const downloadCSV = () => {
// //     const headers = columns.map(col => col.header).join(",");
// //     const rows = metrics.map(row => 
// //       [row.sample, row.DEPTH2.toFixed(4), row.tITH.toFixed(4)].join(",")
// //     );
// //     const content = [headers, ...rows].join("\n");
// //     const blob = new Blob([content], { type: "text/csv" });
// //     const url = URL.createObjectURL(blob);
// //     const a = document.createElement("a");
// //     a.href = url;
// //     a.download = `tumor_metrics_${Date.now()}.csv`;
// //     a.click();
// //     URL.revokeObjectURL(url);
// //   };

// //   return (
// //     <CollapsibleCard
// //       title="TH Metrics Table (Log2)"
// //       className="mb-4"
// //       downloadButton={
// //         <Button onClick={downloadCSV} variant="outline" size="sm" className="h-6 px-2 text-xs">
// //           <Download className="h-4 w-4 mr-2" /> Download CSV
// //         </Button>
// //       }
// //     >
// //       <DataTable
// //         data={metrics}
// //         columns={columns}
// //         defaultSortKey="DEPTH2"
// //         defaultSortOrder="desc"
// //         className="border rounded-md"
// //         containerWidth="100%"
// //       />
// //     </CollapsibleCard>
// //   );
// // };

// // const GeneAnalysisBarChart = ({ metricsRaw, metricsLog2, topGenesRaw, topGenesLog2 }) => {
// //   const [dataFormatMean, setDataFormatMean] = useState('log2');
// //   const [dataFormatCV, setDataFormatCV] = useState('log2');

// //   const handleMetricDataFormatChangeMean = (checked: boolean) => {
// //     setDataFormatMean(checked ? 'log2' : 'raw');
// //   };

// //   const handleMetricDataFormatChangeCV = (checked: boolean) => {
// //     setDataFormatCV(checked ? 'log2' : 'raw');
// //   };

// //   const getData = (dataFormat) => {
// //     const metrics = dataFormat === 'log2' ? metricsLog2 : metricsRaw;
// //     const topGenes = dataFormat === 'log2' ? topGenesLog2 : topGenesRaw;

// //     return topGenes.map((gene) => ({
// //       gene,
// //       cv: metrics.cv?.[gene] || 0,
// //       cv_squared: metrics.cv_squared?.[gene] || 0,
// //       mean_std: metrics.mean?.[gene] || 0,
// //       mean_mad: metrics.mean?.[gene] || 0,
// //       std: metrics.std?.[gene] || 0,
// //       mad: metrics.mad?.[gene] || 0,
// //     }));
// //   };

// //   const dataMean = getData(dataFormatMean);
// //   const dataCV = getData(dataFormatCV);

// //   console.log(`GeneAnalysisBarChart Mean Data (${dataFormatMean}):`, dataMean);
// //   console.log(`GeneAnalysisBarChart CV Data (${dataFormatCV}):`, dataCV);

// //   return (
// //     <>
// //       <CollapsibleCard
// //         title={`Mean with STD and MAD`}
// //         className="mb-4"
// //       >
// //         {/* <div className="flex justify-end items-center space-x-2 mb-4"> */}
// //         <div className="flex items-center space-x-2 mb-4 justify-center">
// //           <Switch
// //             id="gene-chart-data-format-switch"
// //             checked={dataFormatMean === 'log2'}
// //             onCheckedChange={handleMetricDataFormatChangeMean}
// //             className="data-[state=checked]:bg-blue-600 data-[state=unchecked]:bg-gray-300"
// //           />
// //           <Label
// //             htmlFor="gene-chart-data-format-switch"
// //             className="text-sm text-blue-900"
// //           >
// //             Log<sub>2</sub>(X + 1)
// //           </Label>
// //         </div>
// //         <PlotlyBarChart
// //           data={dataMean}
// //           // title={`Mean with STD and MAD Error Bars (${dataFormatMean.toUpperCase()})`}
// //           title={
// //             dataFormatMean.toLowerCase() === "log2"
// //               ? "Mean with STD and MAD Error Bars (Log\u2082)"
// //               : `Mean with STD and MAD Error Bars (Raw)`
// //           }
// //           xKey="gene"
// //           yKey={['mean_std', 'mean_mad']}
// //           errorKey={['std', 'mad']}
// //           xLabel="Genes"
// //           yLabel="Mean Expression"
// //           colors={['rgba(59, 130, 246, 0.8)', 'rgba(239, 68, 68, 0.8)']}
// //           legendLabels={['Mean (STD Error)', 'Mean (MAD Error)']}
// //           orientation="v"
// //           showLegend={true}
// //         />
// //       </CollapsibleCard>
// //       <CollapsibleCard
// //         title={`Coefficient of Variation`}
// //         className="mb-4"
// //       >
// //         <div className="flex items-center space-x-2 mb-4 justify-center">
// //           <Switch
// //             id="gene-chart-cv-data-format-switch"
// //             checked={dataFormatCV === 'log2'}
// //             onCheckedChange={handleMetricDataFormatChangeCV}
// //             className="data-[state=checked]:bg-blue-600 data-[state=unchecked]:bg-gray-300"
// //           />
// //           <Label
// //             htmlFor="gene-chart-cv-data-format-switch"
// //             className="text-sm text-blue-900"
// //           >
// //             Log<sub>2</sub>(X + 1)
// //           </Label>
// //         </div>
// //         <PlotlyBarChart
// //           data={dataCV}
// //           // title={`Coefficient of Variation (${dataFormatCV.toUpperCase()})`}
// //           title={
// //             dataFormatMean.toLowerCase() === "log2"
// //               ? "Coefficient of Variation (Log\u2082)"
// //               : `Coefficient of Variation (Raw)`
// //           }
// //           xKey="gene"
// //           yKey={['cv', 'cv_squared']}
// //           xLabel="Genes"
// //           yLabel="Metric Value"
// //           colors={['rgba(34, 197, 94, 0.6)', 'rgba(151, 34, 197, 0.6)']}
// //           legendLabels={['CV', 'CV²']}
// //           orientation="v"
// //           showLegend={true}
// //         />
// //       </CollapsibleCard>
// //     </>
// //   );
// // };

// // const PathwayBarChart = ({ heatmapDataRaw, heatmapDataLog2, topGenesRaw, topGenesLog2 }) => {
// //   const [dataFormat, setDataFormat] = useState('log2');

// //   const handleMetricDataFormatChange = (checked: boolean) => {
// //     setDataFormat(checked ? 'log2' : 'raw');
// //   };

// //   const heatmapData = dataFormat === 'log2' ? heatmapDataLog2 : heatmapDataRaw;
// //   const topGenes = dataFormat === 'log2' ? topGenesLog2 : topGenesRaw;

// //   const data = topGenes.map((gene) => ({
// //     gene,
// //     mean: heatmapData[gene]?.mean || 0,
// //     cv: heatmapData[gene]?.cv || 0,
// //   }));

// //   return (
// //     <CollapsibleCard title={`Pathway Analysis (Mean and CV)`} className="mb-4">
// //       <div className="flex items-center space-x-2 mb-4 justify-center">
// //         <Switch
// //           id="pathway-chart-data-format-switch"
// //           checked={dataFormat === 'log2'}
// //           onCheckedChange={handleMetricDataFormatChange}
// //           className="data-[state=checked]:bg-blue-600 data-[state=unchecked]:bg-gray-300"
// //         />
// //         <Label
// //           htmlFor="pathway-chart-data-format-switch"
// //           className="text-sm text-blue-900"
// //         >
// //           Log<sub>2</sub>(X + 1)
// //         </Label>
// //       </div>
// //       <PlotlyBarChart
// //         data={data}
// //         // title={`Mean and CV of Gene Expression (${dataFormat.toUpperCase()})`}
// //         title={
// //             dataFormat.toLowerCase() === "log2"
// //               ? "Mean and CV of Gene Expression (Log\u2082)"
// //               : `Mean and CV of Gene Expression (Raw)`
// //           }
// //         xKey="gene"
// //         yKey={['mean', 'cv']}
// //         xLabel="Genes"
// //         yLabel="Value"
// //         colors={['rgba(59, 130, 246, 0.6)', 'rgba(239, 68, 68, 0.6)']}
// //         legendLabels={['Mean Expression', 'Coefficient of Variation']}
// //         orientation="v"
// //         showLegend={true}
// //       />
// //     </CollapsibleCard>
// //   );
// // };

// // const TumorAnalysisBoxPlot = ({ metrics }) => {
// //   const data = metrics.map(item => ({
// //     metric: 'DEPTH2',
// //     value: item.DEPTH2,
// //   })).concat(metrics.map(item => ({
// //     metric: 'tITH',
// //     value: item.tITH,
// //   })));

// //   return (
// //     <CollapsibleCard title="TH Metrics Plots (Log2)" className="mb-4">
// //       <div className="space-y-6">
// //         <PlotlyViolinPlot
// //           data={data}
// //           title="Distribution of Tumor Metrics"
// //           xKey="metric"
// //           yLabel="Metric Value"
// //           normalizationMethod="Metric Value"
// //           selectedGroups={['DEPTH2', 'tITH']}
// //           colorMap={{ 'DEPTH2': 'hsl(200, 70%, 50%)', 'tITH': 'hsla(301, 98%, 32%, 1.00)' }}
// //           className="border rounded-md"
// //           showLegend={true}
// //         />
// //       </div>
// //     </CollapsibleCard>
// //   );
// // };

// // const UploadResults = () => {
// //   const { state } = useLocation();
// //   const navigate = useNavigate();
// //   const { results, analysisType } = state || {};

// //   if (!results || !analysisType) {
// //     return (
// //       <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-yellow-50 flex flex-col">
// //         <Header />
// //         <main className="flex-grow py-8">
// //           <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
// //             <Card className="shadow-lg p-6 text-center">
// //               <h2 className="text-2xl font-bold text-blue-900 mb-4">No Results
// //                 <p className="text-blue-700 mb-6">Please submit an analysis from the upload page to view results.</p>
// //                 <Button
// //                   onClick={() => navigate('/')}
// //                   className="bg-gradient-to-r from-blue-600 to-blue-900 text-white px-3 py-2"
// //                 >
// //                   Return to Upload Page
// //                 </Button>
// //               </h2>
// //             </Card>
// //           </div>
// //         </main>
// //         <Footer />
// //       </div>
// //     );
// //   }

// //   return (
// //     <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-yellow-50 flex flex-col">
// //       <Header />
// //       <main className="flex-grow">
// //         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
// //           <div className="grid grid-cols-1 gap-12">
// //             <div>
// //               <Link
// //                 to="/upload-analysis"
// //                 className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-4 transition-colors"
// //               >
// //                 <ArrowLeft className="h-4 w-4 mr-2" />
// //                 Back to Upload
// //               </Link>
// //               <div className="mb-8">
// //                 <div className="flex items-center justify-between mb-6">
// //                   <h2 className="text-4xl font-bold text-blue-900">Results For {analysisType} Analysis</h2>
// //                 </div>
// //                 <div className="overflow-x-auto mb-6">
// //                   <table className="min-w-full bg-white border border-gray-200 rounded-lg shadow-sm">
// //                     <tbody>
// //                       <tr className="border-b">
// //                         <th className="text-left py-3 px-4 text-blue-700 font-semibold w-1/3">Analysis Type</th>
// //                         <td className="py-3 px-4 text-blue-700">{analysisType}</td>
// //                       </tr>
// //                     </tbody>
// //                   </table>
// //                 </div>
// //                 {(results.raw?.warning || results.log2?.warning) && (
// //                   <Card className="shadow-lg p-4 mb-4 text-center text-yellow-700 bg-red-50">
// //                     {results.raw?.warning && results.log2?.warning ? (
// //                       <>
// //                         <p className="text-lg">{results.raw.warning}</p>
// //                       </>
// //                     ) : results.raw?.warning ? (
// //                       <p className="text-lg">{results.raw.warning}</p>
// //                     ) : results.log2?.warning ? (
// //                       <p className="text-lg">{results.log2.warning}</p>
// //                     ) : null}
// //                   </Card>
// //                 )}
// //               </div>
// //               {analysisType === 'Gene' && results.raw && results.log2 && (
// //                 <>
// //                   <GeneAnalysisBarChart
// //                     metricsRaw={results.raw.metrics}
// //                     metricsLog2={results.log2.metrics}
// //                     topGenesRaw={results.raw.top_genes}
// //                     topGenesLog2={results.log2.top_genes}
// //                   />
// //                   <GeneAnalysisTable
// //                     metricsRaw={results.raw.metrics}
// //                     metricsLog2={results.log2.metrics}
// //                     topGenesRaw={results.raw.top_genes}
// //                     topGenesLog2={results.log2.top_genes}
// //                   />
// //                 </>
// //               )}
// //               {analysisType === 'Pathway' && results.raw && results.log2 && (
// //                 <>
// //                   {results.raw.enrichment && results.raw.enrichment.length > 0 && results.log2.enrichment && results.log2.enrichment.length > 0 && (
// //                     <PathwayAnalysisTable
// //                       enrichmentRaw={results.raw.enrichment}
// //                       enrichmentLog2={results.log2.enrichment}
// //                     />
// //                   )}
// //                   {results.raw.heatmap_data && results.raw.top_genes && results.log2.heatmap_data && results.log2.top_genes && (
// //                     <PathwayBarChart
// //                       heatmapDataRaw={results.raw.heatmap_data}
// //                       heatmapDataLog2={results.log2.heatmap_data}
// //                       topGenesRaw={results.raw.top_genes}
// //                       topGenesLog2={results.log2.top_genes}
// //                     />
// //                   )}
// //                 </>
// //               )}
// //               {analysisType === 'Tumor' && results.log2?.metrics && (
// //                 <>
// //                   <TumorAnalysisBoxPlot metrics={results.log2.metrics} />
// //                   <TumorAnalysisTable metrics={results.log2.metrics} />
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

// // export default UploadResults;
// import React, { useState, useMemo, Dispatch, SetStateAction } from 'react';
// import { useLocation, useNavigate, Link } from 'react-router-dom';
// import { Alert, AlertDescription } from "@/components/ui/alert";
// import { Info, ArrowLeft, Download } from "lucide-react";
// import { DataTable } from "@/components/ui/data-table";
// import { PlotlyBarChart } from "@/components/charts/PlotlyBarChart";
// import PlotlyViolinPlot from "@/components/charts/PlotlyViolinPlot";
// import CollapsibleCard from '@/components/ui/collapsible-card';
// import Header from "@/components/header";
// import Footer from "@/components/footer";
// import { Button } from "@/components/ui/button";
// import { Card, CardContent } from "@/components/ui/card";
// import { Switch } from "@/components/ui/switch";
// import { Label } from "@/components/ui/label";
// import { Checkbox } from "@/components/ui/checkbox";

// // Define interface for GeneAnalysisTable props
// interface GeneAnalysisTableProps {
//   metricsRaw: any;
//   metricsLog2: any;
//   topGenesRaw: any;
//   topGenesLog2: any;
// }

// const GeneAnalysisTable = ({ metricsRaw, metricsLog2, topGenesRaw, topGenesLog2 }: GeneAnalysisTableProps) => {
//   const [dataFormat, setDataFormat] = useState('log2');

//   const handleMetricDataFormatChange = (checked: boolean) => {
//     setDataFormat(checked ? 'log2' : 'raw');
//   };

//   const metrics = dataFormat === 'log2' ? metricsLog2 : metricsRaw;
//   const topGenes = dataFormat === 'log2' ? topGenesLog2 : topGenesRaw;

//   const columns = [
//     { key: 'gene', header: 'Gene', sortable: true },
//     { key: 'cv', header: 'CV', sortable: true, render: (value: number) => value.toFixed(4) },
//     { key: 'cv_squared', header: 'CV²', sortable: true, render: (value: number) => value.toFixed(4) },
//     { key: 'std', header: 'STD', sortable: true, render: (value: number) => value.toFixed(4) },
//     { key: 'mad', header: 'MAD', sortable: true, render: (value: number) => value.toFixed(4) },
//     { key: 'mean', header: 'Mean', sortable: true, render: (value: number) => value.toFixed(4) },
//   ];

//   const data = topGenes.map((gene: string) => ({
//     gene,
//     cv: metrics.cv?.[gene] || 0,
//     cv_squared: metrics.cv_squared?.[gene] || 0,
//     std: metrics.std?.[gene] || 0,
//     mad: metrics.mad?.[gene] || 0,
//     mean: metrics.mean?.[gene] || 0,
//   }));

//   const downloadCSV = () => {
//     const headers = columns.map(col => col.header).join(",");
//     const rows = data.map(row => 
//       [row.gene, row.cv.toFixed(4), row.cv_squared.toFixed(4), row.std.toFixed(4), row.mad.toFixed(4), row.mean.toFixed(4)].join(",")
//     );
//     const content = [headers, ...rows].join("\n");
//     const blob = new Blob([content], { type: "text/csv" });
//     const url = URL.createObjectURL(blob);
//     const a = document.createElement("a");
//     a.href = url;
//     a.download = `gene_analysis_metrics_${dataFormat}_${Date.now()}.csv`;
//     a.click();
//     URL.revokeObjectURL(url);
//   };

//   return (
//     <CollapsibleCard
//       title={`Gene Noise Metrics`}
//       className="mb-4"
//       downloadButton={
//         <Button onClick={downloadCSV} variant="outline" size="sm" className="h-6 px-2 text-xs">
//           <Download className="h-4 w-4 mr-2" /> Download CSV
//         </Button>
//       }
//     >
//       <div className="flex items-center space-x-2 mb-4 justify-center">
//         <Switch
//           id="gene-table-data-format-switch"
//           checked={dataFormat === 'log2'}
//           onCheckedChange={handleMetricDataFormatChange}
//           className="data-[state=checked]:bg-blue-600 data-[state=unchecked]:bg-gray-300"
//         />
//         <Label
//           htmlFor="gene-table-data-format-switch"
//           className="text-sm text-blue-900"
//         >
//           Log<sub>2</sub>(X + 1)
//         </Label>
//       </div>
//       <DataTable
//         data={data}
//         columns={columns}
//         defaultSortKey="cv"
//         defaultSortOrder="desc"
//         className="border rounded-md"
//         containerWidth="100%"
//       />
//     </CollapsibleCard>
//   );
// };

// // Define interface for GeneAnalysisBarChart props
// interface GeneAnalysisBarChartProps {
//   metricsRaw: any;
//   metricsLog2: any;
//   topGenesRaw: any;
//   topGenesLog2: any;
//   selectedGenes: string[];
//   setSelectedGenes: Dispatch<SetStateAction<string[]>>;
// }

// const GeneAnalysisBarChart = ({ metricsRaw, metricsLog2, topGenesRaw, topGenesLog2, selectedGenes, setSelectedGenes }: GeneAnalysisBarChartProps) => {
//   const [dataFormatMean, setDataFormatMean] = useState('log2');
//   const [dataFormatCV, setDataFormatCV] = useState('log2');
//   const [showSelectedOnly, setShowSelectedOnly] = useState(false);

//   const handleMetricDataFormatChangeMean = (checked: boolean) => {
//     setDataFormatMean(checked ? 'log2' : 'raw');
//   };

//   const handleMetricDataFormatChangeCV = (checked: boolean) => {
//     setDataFormatCV(checked ? 'log2' : 'raw');
//   };

//   const handleShowSelectedChange = (checked: boolean) => {
//     setShowSelectedOnly(checked);
//   };

//   const handleGeneSelection = (gene: string, checked: boolean) => {
//     setSelectedGenes(prev => 
//       checked ? [...prev, gene] : prev.filter(g => g !== gene)
//     );
//   };

//   const getData = (dataFormat: string) => {
//     const metrics = dataFormat === 'log2' ? metricsLog2 : metricsRaw;
//     const topGenes = dataFormat === 'log2' ? topGenesLog2 : topGenesRaw;

//     let filteredGenes = topGenes;
//     if (showSelectedOnly && selectedGenes.length > 0) {
//       filteredGenes = topGenes.filter((gene: string) => selectedGenes.includes(gene));
//     }

//     return filteredGenes.map((gene: string) => ({
//       gene,
//       cv: metrics.cv?.[gene] || 0,
//       cv_squared: metrics.cv_squared?.[gene] || 0,
//       mean_std: metrics.mean?.[gene] || 0,
//       mean_mad: metrics.mean?.[gene] || 0,
//       std: metrics.std?.[gene] || 0,
//       mad: metrics.mad?.[gene] || 0,
//     }));
//   };

//   const dataMean = getData(dataFormatMean);
//   const dataCV = getData(dataFormatCV);

//   console.log(`GeneAnalysisBarChart Mean Data (${dataFormatMean}):`, dataMean);
//   console.log(`GeneAnalysisBarChart CV Data (${dataFormatCV}):`, dataCV);

// //   return (
// //     <>
// //       <CollapsibleCard
// //         title={`Mean with STD and MAD`}
// //         className="mb-4"
// //       >
// //         {/* <CollapsibleCard
// //         title="Select Genes"
// //         className="mb-4"
// //       >
// //         <div className="max-h-64 overflow-y-auto">
// //           <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 p-4">
// //             {topGenesLog2.map((gene: string) => (
// //               <div key={gene} className="flex items-center space-x-2 justify-left">
// //                 <Checkbox
// //                   id={`gene-select-${gene}`}
// //                   checked={selectedGenes.includes(gene)}
// //                   onCheckedChange={(checked) => handleGeneSelection(gene, checked as boolean)}
// //                 />
// //                 <Label
// //                   htmlFor={`gene-select-${gene}`}
// //                   className="text-sm text-blue-900"
// //                 >
// //                   {gene}
// //                 </Label>
// //               </div>
// //             ))}
// //           </div>
// //         </div>
// //       </CollapsibleCard> */}
// //       <CollapsibleCard
// //     title="Select Genes"
// //     className="mb-4"
// //   >
// //     {/* Limit height only if more than 5 genes */}
// //     <div
// //       className={`${
// //         topGenesLog2.length > 5 ? "max-h-48 overflow-y-auto" : ""
// //       } p-4`}
// //     >
// //       <div className="flex flex-col space-y-2">
// //         {topGenesLog2.map((gene: string) => (
// //           <div
// //             key={gene}
// //             className="flex items-center space-x-2"
// //           >
// //             <Checkbox
// //               id={`gene-select-${gene}`}
// //               checked={selectedGenes.includes(gene)}
// //               onCheckedChange={(checked) =>
// //                 handleGeneSelection(gene, checked as boolean)
// //               }
// //             />
// //             <Label
// //               htmlFor={`gene-select-${gene}`}
// //               className="text-sm text-blue-900"
// //             >
// //               {gene}
// //             </Label>
// //           </div>
// //         ))}
// //       </div>
// //     </div>
// //   </CollapsibleCard>
// //         <div className="flex items-center space-x-4 mb-4 justify-center">
// //           <div className="flex items-center space-x-2">
// //             <Switch
// //               id="gene-chart-data-format-switch"
// //               checked={dataFormatMean === 'log2'}
// //               onCheckedChange={handleMetricDataFormatChangeMean}
// //               className="data-[state=checked]:bg-blue-600 data-[state=unchecked]:bg-gray-300"
// //             />
// //             <Label
// //               htmlFor="gene-chart-data-format-switch"
// //               className="text-sm text-blue-900"
// //             >
// //               Log<sub>2</sub>(X + 1)
// //             </Label>
// //           </div>
// //           <div className="flex items-center space-x-2">
// //             <Checkbox
// //               id="gene-chart-show-selected"
// //               checked={showSelectedOnly}
// //               onCheckedChange={handleShowSelectedChange}
// //             />
// //             <Label
// //               htmlFor="gene-chart-show-selected"
// //               className="text-sm text-blue-900"
// //             >
// //               Show Only Selected Genes
// //             </Label>
// //           </div>
// //         </div>
// //         <PlotlyBarChart
// //           data={dataMean}
// //           title={
// //             dataFormatMean.toLowerCase() === "log2"
// //               ? "Mean with STD and MAD Error Bars (Log\u2082)"
// //               : `Mean with STD and MAD Error Bars (Raw)`
// //           }
// //           xKey="gene"
// //           yKey={['mean_std', 'mean_mad']}
// //           errorKey={['std', 'mad']}
// //           xLabel="Genes"
// //           yLabel="Mean Expression"
// //           colors={['rgba(59, 130, 246, 0.8)', 'rgba(239, 68, 68, 0.8)']}
// //           legendLabels={['Mean (STD Error)', 'Mean (MAD Error)']}
// //           orientation="v"
// //           showLegend={true}
// //         />
// //       </CollapsibleCard>
// //       <CollapsibleCard
// //         title={`Coefficient of Variation`}
// //         className="mb-4"
// //       >
// //         <div className="flex items-center space-x-4 mb-4 justify-center">
// //           <div className="flex items-center space-x-2">
// //             <Switch
// //               id="gene-chart-cv-data-format-switch"
// //               checked={dataFormatCV === 'log2'}
// //               onCheckedChange={handleMetricDataFormatChangeCV}
// //               className="data-[state=checked]:bg-blue-600 data-[state=unchecked]:bg-gray-300"
// //             />
// //             <Label
// //               htmlFor="gene-chart-cv-data-format-switch"
// //               className="text-sm text-blue-900"
// //             >
// //               Log<sub>2</sub>(X + 1)
// //             </Label>
// //           </div>
// //           <div className="flex items-center space-x-2">
// //             <Checkbox
// //               id="gene-chart-cv-show-selected"
// //               checked={showSelectedOnly}
// //               onCheckedChange={handleShowSelectedChange}
// //             />
// //             <Label
// //               htmlFor="gene-chart-cv-show-selected"
// //               className="text-sm text-blue-900"
// //             >
// //               Show Only Selected Genes
// //             </Label>
// //           </div>
// //         </div>
// //         <PlotlyBarChart
// //           data={dataCV}
// //           title={
// //             dataFormatCV.toLowerCase() === "log2"
// //               ? "Coefficient of Variation (Log\u2082)"
// //               : `Coefficient of Variation (Raw)`
// //           }
// //           xKey="gene"
// //           yKey={['cv', 'cv_squared']}
// //           xLabel="Genes"
// //           yLabel="Metric Value"
// //           colors={['rgba(34, 197, 94, 0.6)', 'rgba(151, 34, 197, 0.6)']}
// //           legendLabels={['CV', 'CV²']}
// //           orientation="v"
// //           showLegend={true}
// //         />
// //       </CollapsibleCard>
// //       {/* <CollapsibleCard
// //         title="Select Genes"
// //         className="mb-4"
// //       >
// //         <div className="max-h-64 overflow-y-auto">
// //           <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 p-4">
// //             {topGenesLog2.map((gene: string) => (
// //               <div key={gene} className="flex items-center space-x-2">
// //                 <Checkbox
// //                   id={`gene-select-${gene}`}
// //                   checked={selectedGenes.includes(gene)}
// //                   onCheckedChange={(checked) => handleGeneSelection(gene, checked as boolean)}
// //                 />
// //                 <Label
// //                   htmlFor={`gene-select-${gene}`}
// //                   className="text-sm text-blue-900"
// //                 >
// //                   {gene}
// //                 </Label>
// //               </div>
// //             ))}
// //           </div>
// //         </div>
// //       </CollapsibleCard> */}
// //     </>
// //   );
// // };
// return (
//   <>
//     <CollapsibleCard
//       title={`Mean with STD and MAD`}
//       className="mb-4"
//     >
//       <div className="flex gap-4">
//   {/* Sidebar with gene selection */}
//   <div className="w-40 shrink-0">
//     <Card title="Select Genes" className="mb-4">
//       <div className="p-2 flex flex-col space-y-2">
//         {/* Select All / Deselect All button */}
//         <button
//           type="button"
//           className="px-2 py-1 text-xs rounded-md bg-blue-500 text-white hover:bg-blue-600 transition"
//           onClick={() => {
//             if (selectedGenes.length === topGenesLog2.length) {
//               // Deselect all
//               setSelectedGenes([]);
//             } else {
//               // Select all
//               setSelectedGenes([...topGenesLog2]);
//             }
//           }}
//         >
//           {selectedGenes.length === topGenesLog2.length
//             ? "Deselect All"
//             : "Select All"}
//         </button>

//         {/* Checkbox list */}
//         <div
//           className={`${
//             topGenesLog2.length > 5 ? "max-h-64 overflow-y-auto" : ""
//           }`}
//         >
//           <div className="flex flex-col space-y-2">
//             {topGenesLog2.map((gene: string) => (
//               <div
//                 key={gene}
//                 className="flex items-center space-x-2"
//               >
//                 <Checkbox
//                   id={`gene-select-${gene}`}
//                   checked={selectedGenes.includes(gene)}
//                   onCheckedChange={(checked) =>
//                     handleGeneSelection(gene, checked as boolean)
//                   }
//                 />
//                 <Label
//                   htmlFor={`gene-select-${gene}`}
//                   className="text-xs text-blue-900 truncate"
//                 >
//                   {gene}
//                 </Label>
//               </div>
//             ))}
//           </div>
//         </div>
//       </div>
//     </Card>
//   </div>

//         {/* Main chart area */}
//         <div className="flex-1">
//           <div className="flex items-center space-x-4 mb-4 justify-center">
//             <div className="flex items-center space-x-2">
//               <Switch
//                 id="gene-chart-data-format-switch"
//                 checked={dataFormatMean === 'log2'}
//                 onCheckedChange={handleMetricDataFormatChangeMean}
//                 className="data-[state=checked]:bg-blue-600 data-[state=unchecked]:bg-gray-300"
//               />
//               <Label
//                 htmlFor="gene-chart-data-format-switch"
//                 className="text-sm text-blue-900"
//               >
//                 Log<sub>2</sub>(X + 1)
//               </Label>
//             </div>
//           </div>

//           <PlotlyBarChart
//             data={dataMean}
//             title={
//               dataFormatMean.toLowerCase() === "log2"
//                 ? "Mean with STD and MAD Error Bars (Log\u2082)"
//                 : `Mean with STD and MAD Error Bars (Raw)`
//             }
//             xKey="gene"
//             yKey={['mean_std', 'mean_mad']}
//             errorKey={['std', 'mad']}
//             xLabel="Genes"
//             yLabel="Mean Expression"
//             colors={['rgba(59, 130, 246, 0.8)', 'rgba(239, 68, 68, 0.8)']}
//             legendLabels={['Mean (STD Error)', 'Mean (MAD Error)']}
//             orientation="v"
//             showLegend={true}
//           />
//         </div>
//       </div>
//     </CollapsibleCard>

//     {/* CV Section stays unchanged */}
//     <CollapsibleCard
//       title={`Coefficient of Variation`}
//       className="mb-4"
//     >
      
//       <div className="flex items-center space-x-4 mb-4 justify-center">
//         <div className="flex items-center space-x-2">
//           <Switch
//             id="gene-chart-cv-data-format-switch"
//             checked={dataFormatCV === 'log2'}
//             onCheckedChange={handleMetricDataFormatChangeCV}
//             className="data-[state=checked]:bg-blue-600 data-[state=unchecked]:bg-gray-300"
//           />
//           <Label
//             htmlFor="gene-chart-cv-data-format-switch"
//             className="text-sm text-blue-900"
//           >
//             Log<sub>2</sub>(X + 1)
//           </Label>
//         </div>
//         <div className="flex items-center space-x-2">
//           <Checkbox
//             id="gene-chart-cv-show-selected"
//             checked={showSelectedOnly}
//             onCheckedChange={handleShowSelectedChange}
//           />
//           <Label
//             htmlFor="gene-chart-cv-show-selected"
//             className="text-sm text-blue-900"
//           >
//             Show Only Selected Genes
//           </Label>
//         </div>
//       </div>

//       <PlotlyBarChart
//         data={dataCV}
//         title={
//           dataFormatCV.toLowerCase() === "log2"
//             ? "Coefficient of Variation (Log\u2082)"
//             : `Coefficient of Variation (Raw)`
//         }
//         xKey="gene"
//         yKey={['cv', 'cv_squared']}
//         xLabel="Genes"
//         yLabel="Metric Value"
//         colors={['rgba(34, 197, 94, 0.6)', 'rgba(151, 34, 197, 0.6)']}
//         legendLabels={['CV', 'CV²']}
//         orientation="v"
//         showLegend={true}
//       />
//     </CollapsibleCard>
//   </>
// );
// }

// // Define interface for PathwayBarChart props
// interface PathwayBarChartProps {
//   heatmapDataRaw: any;
//   heatmapDataLog2: any;
//   topGenesRaw: any;
//   topGenesLog2: any;
//   selectedGenes: string[];
//   setSelectedGenes: Dispatch<SetStateAction<string[]>>;
// }

// const PathwayBarChart = ({ heatmapDataRaw, heatmapDataLog2, topGenesRaw, topGenesLog2, selectedGenes, setSelectedGenes }: PathwayBarChartProps) => {
//   const [dataFormat, setDataFormat] = useState('log2');
//   const [showSelectedOnly, setShowSelectedOnly] = useState(false);

//   const handleMetricDataFormatChange = (checked: boolean) => {
//     setDataFormat(checked ? 'log2' : 'raw');
//   };

//   const handleShowSelectedChange = (checked: boolean) => {
//     setShowSelectedOnly(checked);
//   };

//   const handleGeneSelection = (gene: string, checked: boolean) => {
//     setSelectedGenes(prev => 
//       checked ? [...prev, gene] : prev.filter(g => g !== gene)
//     );
//   };

//   const heatmapData = dataFormat === 'log2' ? heatmapDataLog2 : heatmapDataRaw;
//   const topGenes = dataFormat === 'log2' ? topGenesLog2 : topGenesRaw;

//   const data = (showSelectedOnly && selectedGenes.length > 0 
//     ? topGenes.filter((gene: string) => selectedGenes.includes(gene))
//     : topGenes
//   ).map((gene: string) => ({
//     gene,
//     mean: heatmapData[gene]?.mean || 0,
//     cv: heatmapData[gene]?.cv || 0,
//   }));

//   return (
//     <>
//       <CollapsibleCard title={`Pathway Analysis (Mean and CV)`} className="mb-4">
//         <div className="flex items-center space-x-4 mb-4 justify-center">
//           <div className="flex items-center space-x-2">
//             <Switch
//               id="pathway-chart-data-format-switch"
//               checked={dataFormat === 'log2'}
//               onCheckedChange={handleMetricDataFormatChange}
//               className="data-[state=checked]:bg-blue-600 data-[state=unchecked]:bg-gray-300"
//             />
//             <Label
//               htmlFor="pathway-chart-data-format-switch"
//               className="text-sm text-blue-900"
//             >
//               Log<sub>2</sub>(X + 1)
//             </Label>
//           </div>
//           <div className="flex items-center space-x-2">
//             <Checkbox
//               id="pathway-chart-show-selected"
//               checked={showSelectedOnly}
//               onCheckedChange={handleShowSelectedChange}
//             />
//             <Label
//               htmlFor="pathway-chart-show-selected"
//               className="text-sm text-blue-900"
//             >
//               Show Only Selected Genes
//             </Label>
//           </div>
//         </div>
//         <PlotlyBarChart
//           data={data}
//           title={
//             dataFormat.toLowerCase() === "log2"
//               ? "Mean and CV of Gene Expression (Log\u2082)"
//               : `Mean and CV of Gene Expression (Raw)`
//           }
//           xKey="gene"
//           yKey={['mean', 'cv']}
//           xLabel="Genes"
//           yLabel="Value"
//           colors={['rgba(59, 130, 246, 0.6)', 'rgba(239, 68, 68, 0.6)']}
//           legendLabels={['Mean Expression', 'Coefficient of Variation']}
//           orientation="v"
//           showLegend={true}
//         />
//       </CollapsibleCard>
//       <CollapsibleCard
//         title="Select Genes"
//         className="mb-4"
//       >
//         <div className="max-h-64 overflow-y-auto">
//           <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 p-4">
//             {topGenesLog2.map((gene: string) => (
//               <div key={gene} className="flex items-center space-x-2">
//                 <Checkbox
//                   id={`pathway-gene-select-${gene}`}
//                   checked={selectedGenes.includes(gene)}
//                   onCheckedChange={(checked) => handleGeneSelection(gene, checked as boolean)}
//                 />
//                 <Label
//                   htmlFor={`pathway-gene-select-${gene}`}
//                   className="text-sm text-blue-900"
//                 >
//                   {gene}
//                 </Label>
//               </div>
//             ))}
//           </div>
//         </div>
//       </CollapsibleCard>
//     </>
//   );
// };

// const TumorAnalysisTable = ({ metrics }) => {
//   const columns = [
//     { key: 'sample', header: 'Sample', sortable: true },
//     { key: 'DEPTH2', header: 'DEPTH2', sortable: true, render: (value: number) => value.toFixed(4) },
//     { key: 'tITH', header: 'tITH', sortable: true, render: (value: number) => value.toFixed(4) },
//   ];

//   const downloadCSV = () => {
//     const headers = columns.map(col => col.header).join(",");
//     const rows = metrics.map(row => 
//       [row.sample, row.DEPTH2.toFixed(4), row.tITH.toFixed(4)].join(",")
//     );
//     const content = [headers, ...rows].join("\n");
//     const blob = new Blob([content], { type: "text/csv" });
//     const url = URL.createObjectURL(blob);
//     const a = document.createElement("a");
//     a.href = url;
//     a.download = `tumor_metrics_${Date.now()}.csv`;
//     a.click();
//     URL.revokeObjectURL(url);
//   };

//   return (
//     <CollapsibleCard
//       title="TH Metrics Table (Log2)"
//       className="mb-4"
//       downloadButton={
//         <Button onClick={downloadCSV} variant="outline" size="sm" className="h-6 px-2 text-xs">
//           <Download className="h-4 w-4 mr-2" /> Download CSV
//         </Button>
//       }
//     >
//       <DataTable
//         data={metrics}
//         columns={columns}
//         defaultSortKey="DEPTH2"
//         defaultSortOrder="desc"
//         className="border rounded-md"
//         containerWidth="100%"
//       />
//     </CollapsibleCard>
//   );
// };

// const TumorAnalysisBoxPlot = ({ metrics }) => {
//   const data = metrics.map(item => ({
//     metric: 'DEPTH2',
//     value: item.DEPTH2,
//   })).concat(metrics.map(item => ({
//     metric: 'tITH',
//     value: item.tITH,
//   })));

//   return (
//     <CollapsibleCard title="TH Metrics Plots (Log2)" className="mb-4">
//       <div className="space-y-6">
//         <PlotlyViolinPlot
//           data={data}
//           title="Distribution of Tumor Metrics"
//           xKey="metric"
//           yLabel="Metric Value"
//           normalizationMethod="Metric Value"
//           selectedGroups={['DEPTH2', 'tITH']}
//           colorMap={{ 'DEPTH2': 'hsl(200, 70%, 50%)', 'tITH': 'hsla(301, 98%, 32%, 1.00)' }}
//           className="border rounded-md"
//           showLegend={true}
//         />
//       </div>
//     </CollapsibleCard>
//   );
// };

// const PathwayAnalysisTable = ({ enrichmentRaw, enrichmentLog2 }) => {
//   const [dataFormat, setDataFormat] = useState('log2');

//   const handleMetricDataFormatChange = (checked: boolean) => {
//     setDataFormat(checked ? 'log2' : 'raw');
//   };

//   const enrichment = dataFormat === 'log2' ? enrichmentLog2 : enrichmentRaw;

//   const columns = [
//     { key: 'Term', header: 'Pathway', sortable: true },
//     { key: 'P-value', header: 'P-value', sortable: true, render: (value) => value.toExponential(4) },
//     { key: 'Adjusted P-value', header: 'Adjusted P-value', sortable: true, render: (value) => value.toExponential(4) },
//     { key: 'Genes', header: 'Genes', render: (value) => value.join(', ') },
//     { key: 'GeneSet', header: 'Gene Set' },
//   ];

//   const downloadCSV = () => {
//     const headers = columns.map(col => col.header).join(",");
//     const rows = enrichment.map(row => 
//       [row.Term, row['P-value'].toExponential(4), row['Adjusted P-value'].toExponential(4), row.Genes.join(", "), row.GeneSet || ""].join(",")
//     );
//     const content = [headers, ...rows].join("\n");
//     const blob = new Blob([content], { type: "text/csv" });
//     const url = URL.createObjectURL(blob);
//     const a = document.createElement("a");
//     a.href = url;
//     a.download = `pathway_enrichment_${dataFormat}_${Date.now()}.csv`;
//     a.click();
//     URL.revokeObjectURL(url);
//   };

//   return (
//     <CollapsibleCard
//       title={`Enriched Pathways`}
//       className="mb-4"
//       downloadButton={
//         <Button onClick={downloadCSV} variant="outline" size="sm" className="h-6 px-2 text-xs">
//           <Download className="h-4 w-4 mr-2" /> Download CSV
//         </Button>
//       }
//     >
//       {/* <div className="flex justify-end items-center space-x-2 mb-4"> */}
//       {/* <div className="flex items-center space-x-2 mb-4 justify-center">
//         <Switch
//           id="pathway-table-data-format-switch"
//           checked={dataFormat === 'log2'}
//           onCheckedChange={handleMetricDataFormatChange}
//           className="data-[state=checked]:bg-blue-600 data-[state=unchecked]:bg-gray-300"
//         />
//         <Label
//           htmlFor="pathway-table-data-format-switch"
//           className="text-sm text-blue-900"
//         >
//           Log<sub>2</sub>(X + 1)
//         </Label>
//       </div> */}
//       <DataTable
//         data={enrichment}
//         columns={columns}
//         defaultSortKey="P-value"
//         defaultSortOrder="asc"
//         className="border rounded-md"
//         containerWidth="100%"
//       />
//     </CollapsibleCard>
//   );
// };


// const UploadResults = () => {
//   const { state } = useLocation();
//   const navigate = useNavigate();
//   const { results, analysisType } = state || {};
//   const [selectedGenes, setSelectedGenes] = useState<string[]>([]);

//   if (!results || !analysisType) {
//     return (
//       <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-yellow-50 flex flex-col">
//         <Header />
//         <main className="flex-grow py-8">
//           <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
//             <Card className="shadow-lg p-6 text-center">
//               <h2 className="text-2xl font-bold text-blue-900 mb-4">No Results
//                 <p className="text-blue-700 mb-6">Please submit an analysis from the upload page to view results.</p>
//                 <Button
//                   onClick={() => navigate('/')}
//                   className="bg-gradient-to-r from-blue-600 to-blue-900 text-white px-3 py-2"
//                 >
//                   Return to Upload Page
//                 </Button>
//               </h2>
//             </Card>
//           </div>
//         </main>
//         <Footer />
//       </div>
//     );
//   }

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-yellow-50 flex flex-col">
//       <Header />
//       <main className="flex-grow">
//         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
//           <div className="grid grid-cols-1 gap-12">
//             <div>
//               <Link
//                 to="/upload-analysis"
//                 className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-4 transition-colors"
//               >
//                 <ArrowLeft className="h-4 w-4 mr-2" />
//                 Back to Upload
//               </Link>
//               <div className="mb-8">
//                 <div className="flex items-center justify-between mb-6">
//                   <h2 className="text-4xl font-bold text-blue-900">Results For {analysisType} Analysis</h2>
//                 </div>
//                 <div className="overflow-x-auto mb-6">
//                   <table className="min-w-full bg-white border border-gray-200 rounded-lg shadow-sm">
//                     <tbody>
//                       <tr className="border-b">
//                         <th className="text-left py-3 px-4 text-blue-700 font-semibold w-1/3">Analysis Type</th>
//                         <td className="py-3 px-4 text-blue-700">{analysisType}</td>
//                       </tr>
//                     </tbody>
//                   </table>
//                 </div>
//                 {(results.raw?.warning || results.log2?.warning) && (
//                   <Card className="shadow-lg p-4 mb-4 text-center text-yellow-700 bg-red-50">
//                     {results.raw?.warning && results.log2?.warning ? (
//                       <>
//                         <p className="text-lg">{results.raw.warning}</p>
//                       </>
//                     ) : results.raw?.warning ? (
//                       <p className="text-lg">{results.raw.warning}</p>
//                     ) : results.log2?.warning ? (
//                       <p className="text-lg">{results.log2.warning}</p>
//                     ) : null}
//                   </Card>
//                 )}
//               </div>
//               {analysisType === 'Gene' && results.raw && results.log2 && (
//                 <>
//                   <GeneAnalysisBarChart
//                     metricsRaw={results.raw.metrics}
//                     metricsLog2={results.log2.metrics}
//                     topGenesRaw={results.raw.top_genes}
//                     topGenesLog2={results.log2.top_genes}
//                     selectedGenes={selectedGenes}
//                     setSelectedGenes={setSelectedGenes}
//                   />
//                   <GeneAnalysisTable
//                     metricsRaw={results.raw.metrics}
//                     metricsLog2={results.log2.metrics}
//                     topGenesRaw={results.raw.top_genes}
//                     topGenesLog2={results.log2.top_genes}
//                   />
//                 </>
//               )}
//               {analysisType === 'Pathway' && results.raw && results.log2 && (
//                 <>
//                   {results.raw.enrichment && results.raw.enrichment.length > 0 && results.log2.enrichment && results.log2.enrichment.length > 0 && (
//                     <PathwayAnalysisTable
//                       enrichmentRaw={results.raw.enrichment}
//                       enrichmentLog2={results.log2.enrichment}
//                     />
//                   )}
//                   {results.raw.heatmap_data && results.raw.top_genes && results.log2.heatmap_data && results.log2.top_genes && (
//                     <PathwayBarChart
//                       heatmapDataRaw={results.raw.heatmap_data}
//                       heatmapDataLog2={results.log2.heatmap_data}
//                       topGenesRaw={results.raw.top_genes}
//                       topGenesLog2={results.log2.top_genes}
//                       selectedGenes={selectedGenes}
//                       setSelectedGenes={setSelectedGenes}
//                     />
//                   )}
//                 </>
//               )}
//               {analysisType === 'Tumor' && results.log2?.metrics && (
//                 <>
//                   <TumorAnalysisBoxPlot metrics={results.log2.metrics} />
//                   <TumorAnalysisTable metrics={results.log2.metrics} />
//                 </>
//               )}
//             </div>
//           </div>
//         </div>
//       </main>
//       <Footer />
//     </div>
//   );
// };

// export default UploadResults;
import React, { useState, useMemo, Dispatch, SetStateAction, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Info, ArrowLeft, Download } from "lucide-react";
import { DataTable } from "@/components/ui/data-table";
import { PlotlyBarChart } from "@/components/charts/PlotlyBarChart";
import PlotlyViolinPlot from "@/components/charts/PlotlyViolinPlot";
import CollapsibleCard from '@/components/ui/collapsible-card';
import Header from "@/components/header";
import Footer from "@/components/footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";

// Define interface for GeneAnalysisTable props
interface GeneAnalysisTableProps {
  metricsRaw: any;
  metricsLog2: any;
  topGenesRaw: any;
  topGenesLog2: any;
}

const GeneAnalysisTable = ({ metricsRaw, metricsLog2, topGenesRaw, topGenesLog2 }: GeneAnalysisTableProps) => {
  const [dataFormat, setDataFormat] = useState('log2');

  const handleMetricDataFormatChange = (checked: boolean) => {
    setDataFormat(checked ? 'log2' : 'raw');
  };

  const metrics = dataFormat === 'log2' ? metricsLog2 : metricsRaw;
  const topGenes = dataFormat === 'log2' ? topGenesLog2 : topGenesRaw;

  const columns = [
    { key: 'gene', header: 'Gene', sortable: true },
    { key: 'cv', header: 'CV', sortable: true, render: (value: number) => value.toFixed(4) },
    { key: 'cv_squared', header: 'CV²', sortable: true, render: (value: number) => value.toFixed(4) },
    { key: 'std', header: 'S.D', sortable: true, render: (value: number) => value.toFixed(4) },
    { key: 'mad', header: 'MAD', sortable: true, render: (value: number) => value.toFixed(4) },
    { key: 'mean', header: 'Mean', sortable: true, render: (value: number) => value.toFixed(4) },
  ];

  const data = topGenes.map((gene: string) => ({
    gene,
    cv: metrics.cv?.[gene] || 0,
    cv_squared: metrics.cv_squared?.[gene] || 0,
    std: metrics.std?.[gene] || 0,
    mad: metrics.mad?.[gene] || 0,
    mean: metrics.mean?.[gene] || 0,
  }));

  const downloadCSV = () => {
    const headers = columns.map(col => col.header).join(",");
    const rows = data.map(row => 
      [row.gene, row.cv.toFixed(4), row.cv_squared.toFixed(4), row.std.toFixed(4), row.mad.toFixed(4), row.mean.toFixed(4)].join(",")
    );
    const content = [headers, ...rows].join("\n");
    const blob = new Blob([content], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `gene_analysis_metrics_${dataFormat}_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <CollapsibleCard
      title={`Gene Noise Metrics`}
      className="mb-4"
      downloadButton={
        <Button onClick={downloadCSV} variant="outline" size="sm" className="h-6 px-2 text-xs">
          <Download className="h-4 w-4 mr-2" /> Download CSV
        </Button>
      }
    >
      {/* <div className="flex items-center space-x-2 mb-4 justify-center"> */}
      <div className="flex items-center space-x-2 mb-4 justify-end">
        <Switch
          id="gene-table-data-format-switch"
          checked={dataFormat === 'log2'}
          onCheckedChange={handleMetricDataFormatChange}
          className="data-[state=checked]:bg-blue-600 data-[state=unchecked]:bg-gray-300"
        />
        <Label
          htmlFor="gene-table-data-format-switch"
          className="text-sm text-blue-900"
        >
          Log<sub>2</sub>(X + 1)
        </Label>
      </div>
      <DataTable
        data={data}
        columns={columns}
        defaultSortKey="cv"
        defaultSortOrder="desc"
        className="border rounded-md"
        containerWidth="100%"
      />
    </CollapsibleCard>
  );
};

// Define interface for GeneAnalysisBarChart props
interface GeneAnalysisBarChartProps {
  metricsRaw: any;
  metricsLog2: any;
  topGenesRaw: any;
  topGenesLog2: any;
  selectedGenes: string[];
  setSelectedGenes: Dispatch<SetStateAction<string[]>>;
}

const GeneAnalysisBarChart = ({ metricsRaw, metricsLog2, topGenesRaw, topGenesLog2, selectedGenes }: GeneAnalysisBarChartProps) => {
  const [dataFormatMean, setDataFormatMean] = useState('log2');
  const [dataFormatCV, setDataFormatCV] = useState('log2');

  const handleMetricDataFormatChangeMean = (checked: boolean) => {
    setDataFormatMean(checked ? 'log2' : 'raw');
  };

  const handleMetricDataFormatChangeCV = (checked: boolean) => {
    setDataFormatCV(checked ? 'log2' : 'raw');
  };

  const getData = (dataFormat: string) => {
    const metrics = dataFormat === 'log2' ? metricsLog2 : metricsRaw;
    const topGenes = dataFormat === 'log2' ? topGenesLog2 : topGenesRaw;

    let filteredGenes = topGenes;
    if (selectedGenes.length > 0) {
      filteredGenes = topGenes.filter((gene: string) => selectedGenes.includes(gene));
    }

    return filteredGenes.map((gene: string) => ({
      gene,
      cv: metrics.cv?.[gene] || 0,
      cv_squared: metrics.cv_squared?.[gene] || 0,
      mean_std: metrics.mean?.[gene] || 0,
      mean_mad: metrics.mean?.[gene] || 0,
      std: metrics.std?.[gene] || 0,
      mad: metrics.mad?.[gene] || 0,
    }));
  };

  const dataMean = getData(dataFormatMean);
  const dataCV = getData(dataFormatCV);

  console.log(`GeneAnalysisBarChart Mean Data (${dataFormatMean}):`, dataMean);
  console.log(`GeneAnalysisBarChart CV Data (${dataFormatCV}):`, dataCV);

  return (
    <>
      <CollapsibleCard
        title={`Mean with S.D and MAD`}
        className="mb-4"
      >
        {/* <div className="flex items-center space-x-2 mb-4 justify-center"> */}
        <div className="flex items-center space-x-2 mb-4 justify-end">
          <Switch
            id="gene-chart-data-format-switch"
            checked={dataFormatMean === 'log2'}
            onCheckedChange={handleMetricDataFormatChangeMean}
            className="data-[state=checked]:bg-blue-600 data-[state=unchecked]:bg-gray-300"
          />
          <Label
            htmlFor="gene-chart-data-format-switch"
            className="text-sm text-blue-900"
          >
            Log<sub>2</sub>(X + 1)
          </Label>
        </div>
        <PlotlyBarChart
          data={dataMean}
          title={
            dataFormatMean.toLowerCase() === "log2"
              ? "Mean with S.D and MAD Error Bars (Log\u2082)"
              : `Mean with S.D and MAD Error Bars (Raw)`
          }
          xKey="gene"
          yKey={['mean_std', 'mean_mad']}
          errorKey={['std', 'mad']}
          xLabel="Genes"
          yLabel="Mean Expression"
          colors={['rgba(59, 130, 246, 0.8)', 'rgba(239, 68, 68, 0.8)']}
          legendLabels={['Mean (S.D Error)', 'Mean (MAD Error)']}
          orientation="v"
          showLegend={true}
        />
      </CollapsibleCard>
      <CollapsibleCard
        title={`Coefficient of Variation`}
        className="mb-4"
      >
        {/* <div className="flex items-center space-x-2 mb-4 justify-center"> */}
        <div className="flex items-center space-x-2 mb-4 justify-end">
          <Switch
            id="gene-chart-cv-data-format-switch"
            checked={dataFormatCV === 'log2'}
            onCheckedChange={handleMetricDataFormatChangeCV}
            className="data-[state=checked]:bg-blue-600 data-[state=unchecked]:bg-gray-300"
          />
          <Label
            htmlFor="gene-chart-cv-data-format-switch"
            className="text-sm text-blue-900"
          >
            Log<sub>2</sub>(X + 1)
          </Label>
        </div>
        <PlotlyBarChart
          data={dataCV}
          title={
            dataFormatCV.toLowerCase() === "log2"
              ? "Coefficient of Variation (Log\u2082)"
              : `Coefficient of Variation (Raw)`
          }
          xKey="gene"
          yKey={['cv', 'cv_squared']}
          xLabel="Genes"
          yLabel="Metric Value"
          colors={['rgba(34, 197, 94, 0.6)', 'rgba(151, 34, 197, 0.6)']}
          legendLabels={['CV', 'CV²']}
          orientation="v"
          showLegend={true}
        />
      </CollapsibleCard>
    </>
  );
};

// Define interface for PathwayBarChart props
interface PathwayBarChartProps {
  heatmapDataRaw: any;
  heatmapDataLog2: any;
  topGenesRaw: any;
  topGenesLog2: any;
  selectedGenes: string[];
  setSelectedGenes: Dispatch<SetStateAction<string[]>>;
}

const PathwayBarChart = ({ heatmapDataRaw, heatmapDataLog2, topGenesRaw, topGenesLog2, selectedGenes }: PathwayBarChartProps) => {
  const [dataFormat, setDataFormat] = useState('log2');

  const handleMetricDataFormatChange = (checked: boolean) => {
    setDataFormat(checked ? 'log2' : 'raw');
  };

  const heatmapData = dataFormat === 'log2' ? heatmapDataLog2 : heatmapDataRaw;
  const topGenes = dataFormat === 'log2' ? topGenesLog2 : topGenesRaw;

  const data = (selectedGenes.length > 0 
    ? topGenes.filter((gene: string) => selectedGenes.includes(gene))
    : topGenes
  ).map((gene: string) => ({
    gene,
    mean: heatmapData[gene]?.mean || 0,
    cv: heatmapData[gene]?.cv || 0,
  }));

  return (
    <CollapsibleCard title={`Pathway Analysis (Mean and CV)`} className="mb-4">
      {/* <div className="flex items-center space-x-2 mb-4 justify-center"> */}
      <div className="flex items-center space-x-2 mb-4 justify-end">
        <Switch
          id="pathway-chart-data-format-switch"
          checked={dataFormat === 'log2'}
          onCheckedChange={handleMetricDataFormatChange}
          className="data-[state=checked]:bg-blue-600 data-[state=unchecked]:bg-gray-300"
        />
        <Label
          htmlFor="pathway-chart-data-format-switch"
          className="text-sm text-blue-900"
        >
          Log<sub>2</sub>(X + 1)
        </Label>
      </div>
      <PlotlyBarChart
        data={data}
        title={
          dataFormat.toLowerCase() === "log2"
            ? "Mean and CV of Gene Expression (Log\u2082)"
            : `Mean and CV of Gene Expression (Raw)`
        }
        xKey="gene"
        yKey={['mean', 'cv']}
        xLabel="Genes"
        yLabel="Value"
        colors={['rgba(59, 130, 246, 0.6)', 'rgba(239, 68, 68, 0.6)']}
        legendLabels={['Mean Expression', 'Coefficient of Variation']}
        orientation="v"
        showLegend={true}
      />
    </CollapsibleCard>
  );
};

// Define interface for GeneSelectionSidebar props
interface GeneSelectionSidebarProps {
  topGenes: string[];
  selectedGenes: string[];
  setSelectedGenes: Dispatch<SetStateAction<string[]>>;
}

// const GeneSelectionSidebar = ({ topGenes, selectedGenes, setSelectedGenes }: GeneSelectionSidebarProps) => {
//   const handleGeneSelection = (gene: string, checked: boolean) => {
//     setSelectedGenes(prev => 
//       checked ? [...prev, gene] : prev.filter(g => g !== gene)
//     );
//   };

//   return (
//     <div className="w-64 bg-white shadow-lg p-4 rounded-md sticky top-4 max-h-[calc(100vh-2rem)] overflow-y-auto">
//       <h3 className="text-lg font-semibold text-blue-900 mb-4">Genes</h3>
//       <div className="space-y-2">
//         {topGenes.map((gene: string) => (
//           <div key={gene} className="flex items-center space-x-2">
//             <Checkbox
//               id={`gene-select-${gene}`}
//               checked={selectedGenes.includes(gene)}
//               onCheckedChange={(checked) => handleGeneSelection(gene, checked as boolean)}
//             />
//             <Label
//               htmlFor={`gene-select-${gene}`}
//               className="text-sm text-blue-900"
//             >
//               {gene}
//             </Label>
//           </div>
//         ))}
//       </div>
//     </div>
//   );
// };
const TumorSidebar = () => {
  return (
    // <div className="w-72 bg-blue-100 shadow-lg p-4 rounded-md sticky top-5 max-h-[calc(100vh-2rem)] overflow-y-auto">
    <div className="w-72 bg-blue-100 shadow-lg p-4 rounded-md h-auto sticky top-5 self-start">
      <CollapsibleCard title="ITH Metrics" className="text-medium">
        <div className="space-y-4 text-sm text-blue-900">
          <div>
            <h4 className="text-large font-bold">DEPTH2</h4>
            <p className="mb-2">
              DEPTH2 calculates a tumor’s ITH level based on the standard deviations of absolute z-scored expression values of a set of genes in the tumor.
            </p>
            <a
              href="https://pmc.ncbi.nlm.nih.gov/articles/PMC8974098/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600"
            >
              Learn more here
            </a>
          </div>

          <div>
            <h4 className="font-semibold">tITH</h4>
            <p className="mb-2">
              Calculated using the DEPTH algorithm, evaluating the ITH level of each tumor sample based on its gene expression profiles with reference to normal controls.
            </p>
            <a
              href="https://www.nature.com/articles/s42003-020-01230-7"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 "
            >
              Learn more here
            </a>
          </div>
        </div>
      </CollapsibleCard>
    </div>
  );
};



const GeneSelectionSidebar = ({ topGenes, selectedGenes, setSelectedGenes }: GeneSelectionSidebarProps) => {
  const handleGeneSelection = (gene: string, checked: boolean) => {
    setSelectedGenes(prev => 
      checked ? [...prev, gene] : prev.filter(g => g !== gene)
    );
  };

  const allSelected = selectedGenes.length === topGenes.length;
  const someSelected = selectedGenes.length > 0 && !allSelected;

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedGenes(topGenes); // select all
    } else {
      setSelectedGenes([]); // clear all
    }
  };

  return (
    // <div className="w-72 bg-blue-100 shadow-lg p-4 rounded-md sticky top-4 max-h-[calc(100vh-2rem)] overflow-y-auto">
    <div className="w-72 bg-blue-100 shadow-lg p-4 rounded-md h-auto sticky top-5 self-start">
      <CollapsibleCard title="Genes" className="text-blue-900">
      {/* <h3 className="text-lg font-semibold text-blue-900 mb-4">Select Genes</h3> */}

      <div className="flex items-center space-x-2 mb-2">
        <Checkbox
          id="gene-select-all"
          checked={allSelected}
          onCheckedChange={(checked) => handleSelectAll(checked as boolean)}
          className={someSelected ? "data-[state=indeterminate]:bg-blue-400" : ""}
        />
        <Label
          htmlFor="gene-select-all"
          className="text-large text-blue-900 font-bold"
        >
          Select All
        </Label>
      </div>

      {/* Individual genes */}
      <div className="space-y-2">
        {topGenes.map((gene: string) => (
          <div key={gene} className="flex items-center space-x-2">
            <Checkbox
              id={`gene-select-${gene}`}
              checked={selectedGenes.includes(gene)}
              onCheckedChange={(checked) => handleGeneSelection(gene, checked as boolean)}
            />
            <Label
              htmlFor={`gene-select-${gene}`}
              className="text-sm text-blue-900"
            >
              {gene}
            </Label>
          </div>
        ))}
      </div>
      </CollapsibleCard>
    </div>
  );
};


const TumorAnalysisTable = ({ metrics }) => {
  const columns = [
    { key: 'sample', header: 'Sample', sortable: true },
    { key: 'DEPTH2', header: 'DEPTH2', sortable: true, render: (value: number) => value.toFixed(6) },
    { key: 'tITH', header: 'tITH', sortable: true, render: (value: number) => value.toFixed(6) },
  ];

  const downloadCSV = () => {
    const headers = columns.map(col => col.header).join(",");
    const rows = metrics.map(row => 
      [row.sample, row.DEPTH2.toFixed(4), row.tITH.toFixed(4)].join(",")
    );
    const content = [headers, ...rows].join("\n");
    const blob = new Blob([content], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `tumor_metrics_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <CollapsibleCard
      title="TH Metrics Table"
      className="mb-4"
      downloadButton={
        <Button onClick={downloadCSV} variant="outline" size="sm" className="h-6 px-2 text-xs">
          <Download className="h-4 w-4 mr-2" /> Download CSV
        </Button>
      }
    >
      <DataTable
        data={metrics}
        columns={columns}
        defaultSortKey="DEPTH2"
        defaultSortOrder="desc"
        className="border rounded-md"
        containerWidth="100%"
      />
    </CollapsibleCard>
  );
};

const TumorAnalysisBoxPlot = ({ metrics }) => {
  const data = metrics.map(item => ({
    metric: 'DEPTH2',
    value: item.DEPTH2,
  })).concat(metrics.map(item => ({
    metric: 'tITH',
    value: item.tITH,
  })));

  return (
    <CollapsibleCard title="TH Metrics Plots" className="mb-4">
      <div className="space-y-6">
        <PlotlyViolinPlot
          data={data}
          title="Distribution of Tumor Metrics"
          xKey="metric"
          yLabel="Metric Value"
          normalizationMethod="Metric Value"
          selectedGroups={['DEPTH2', 'tITH']}
          colorMap={{ 'DEPTH2': 'hsl(200, 70%, 50%)', 'tITH': 'hsla(301, 98%, 32%, 1.00)' }}
          className="border rounded-md"
          showLegend={true}
        />
      </div>
    </CollapsibleCard>
  );
};



const PathwayAnalysisTable = ({ enrichmentRaw, enrichmentLog2 }) => {
  const [dataFormat, setDataFormat] = useState('log2');

  const handleMetricDataFormatChange = (checked: boolean) => {
    setDataFormat(checked ? 'log2' : 'raw');
  };

  const enrichment = dataFormat === 'log2' ? enrichmentLog2 : enrichmentRaw;

  const columns = [
    { key: 'Term', header: 'Pathway', sortable: true },
    { key: 'P-value', header: 'P-value', sortable: true, render: (value) => value.toExponential(4) },
    { key: 'Adjusted P-value', header: 'Adjusted P-value', sortable: true, render: (value) => value.toExponential(4) },
    { key: 'Genes', header: 'Genes', render: (value) => value.join(', ') },
    { key: 'GeneSet', header: 'Gene Set' },
  ];

  const downloadCSV = () => {
    const headers = columns.map(col => col.header).join(",");
    const rows = enrichment.map(row => 
      [row.Term, row['P-value'].toExponential(4), row['Adjusted P-value'].toExponential(4), row.Genes.join(", "), row.GeneSet || ""].join(",")
    );
    const content = [headers, ...rows].join("\n");
    const blob = new Blob([content], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `pathway_enrichment_${dataFormat}_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <CollapsibleCard
      title={`Enriched Pathways`}
      className="mb-4"
      downloadButton={
        <Button onClick={downloadCSV} variant="outline" size="sm" className="h-6 px-2 text-xs">
          <Download className="h-4 w-4 mr-2" /> Download CSV
        </Button>
      }
    >
      {/* <div className="flex justify-end items-center space-x-2 mb-4"> */}
      {/* <div className="flex items-center space-x-2 mb-4 justify-center">
        <Switch
          id="pathway-table-data-format-switch"
          checked={dataFormat === 'log2'}
          onCheckedChange={handleMetricDataFormatChange}
          className="data-[state=checked]:bg-blue-600 data-[state=unchecked]:bg-gray-300"
        />
        <Label
          htmlFor="pathway-table-data-format-switch"
          className="text-sm text-blue-900"
        >
          Log<sub>2</sub>(X + 1)
        </Label>
      </div> */}
      <DataTable
        data={enrichment}
        columns={columns}
        defaultSortKey="P-value"
        defaultSortOrder="asc"
        className="border rounded-md"
        containerWidth="100%"
      />
    </CollapsibleCard>
  );
};

const UploadResults = () => {
  const { state } = useLocation();
  const navigate = useNavigate();
  const { results, analysisType } = state || {};
  const [selectedGenes, setSelectedGenes] = useState<string[]>([]);
  useEffect(() => {
    if ((analysisType === 'Gene' || analysisType === 'Pathway') && results?.log2?.top_genes) {
      setSelectedGenes(results.log2.top_genes);
    }
  }, [analysisType, results]);

  if (!results || !analysisType) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-yellow-50 flex flex-col">
        <Header />
        <main className="flex-grow py-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <Card className="shadow-lg p-6 text-center">
              <h2 className="text-2xl font-bold text-blue-900 mb-4">No Results
                <p className="text-blue-700 mb-6">Please submit an analysis from the upload page to view results.</p>
                <Button
                  onClick={() => navigate('/')}
                  className="bg-gradient-to-r from-blue-600 to-blue-900 text-white px-3 py-2"
                >
                  Return to Upload Page
                </Button>
              </h2>
            </Card>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-yellow-50 flex flex-col">
      <Header />
      <main className="flex-grow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* <div className="grid grid-cols-1 lg:grid-cols-[16rem_1fr] gap-8 items-start"> */}
        <div className="grid grid-cols-[320px_1fr]">
          {/* Sidebar always on the left */}
          {(analysisType === 'Gene' || analysisType === 'Pathway') && results.log2 && (
            <GeneSelectionSidebar
              topGenes={results.log2.top_genes}
              selectedGenes={selectedGenes}
              setSelectedGenes={setSelectedGenes}
            />
          )}
          {analysisType === 'Tumor' && (
              <TumorSidebar />
            )}
                <div className="flex-1 min-w-0">
            <div className="flex-grow">
              <Link
                to="/upload-analysis"
                className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-4 transition-colors"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Upload
              </Link>
              <div className="mb-8">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-4xl font-bold text-blue-900">Results For {analysisType} Analysis</h2>
                </div>
                <div className="overflow-x-auto mb-6">
                  <table className="min-w-full bg-white border border-gray-200 rounded-lg shadow-sm">
                    <tbody>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4 text-blue-700 font-semibold w-1/3">Analysis Type</th>
                        <td className="py-3 px-4 text-blue-700">{analysisType}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                {(results.raw?.warning || results.log2?.warning) && (
                  <Card className="shadow-lg p-4 mb-4 text-center text-yellow-700 bg-red-50">
                    {results.raw?.warning && results.log2?.warning ? (
                      <p className="text-lg">{results.raw.warning}</p>
                    ) : results.raw?.warning ? (
                      <p className="text-lg">{results.raw.warning}</p>
                    ) : results.log2?.warning ? (
                      <p className="text-lg">{results.log2.warning}</p>
                    ) : null}
                  </Card>
                )}
              </div>
               {analysisType === 'Gene' && results.raw && results.log2 && (
                <>
                  {selectedGenes.length === 0 ? (
                    <Alert className="mb-6 border-yellow-400 bg-yellow-50 text-yellow-800">
                      <AlertDescription>
                        Please select at least one gene from the left panel to view analysis results.
                      </AlertDescription>
                    </Alert>
                  ) : (
                    <>
                      <GeneAnalysisBarChart
                        metricsRaw={results.raw.metrics}
                        metricsLog2={results.log2.metrics}
                        topGenesRaw={results.raw.top_genes}
                        topGenesLog2={results.log2.top_genes}
                        selectedGenes={selectedGenes}
                        setSelectedGenes={setSelectedGenes}
                      />
                      <GeneAnalysisTable
                        metricsRaw={results.raw.metrics}
                        metricsLog2={results.log2.metrics}
                        topGenesRaw={results.raw.top_genes}
                        topGenesLog2={results.log2.top_genes}
                      />
                    </>
                  )}
                </>
              )}
              {analysisType === 'Pathway' && results.raw && results.log2 && (
                <>
                  {selectedGenes.length === 0 ? (
                    <Alert className="mb-6 border-yellow-400 bg-yellow-50 text-yellow-800">
                      <AlertDescription>
                        Please select at least one gene from the left panel to view analysis results.
                      </AlertDescription>
                    </Alert>
                  ) : (
                    <>
                      {results.raw.enrichment?.length > 0 && results.log2.enrichment?.length > 0 && (
                        <PathwayAnalysisTable
                          enrichmentRaw={results.raw.enrichment}
                          enrichmentLog2={results.log2.enrichment}
                        />
                      )}
                      {results.raw.heatmap_data && results.raw.top_genes &&
                      results.log2.heatmap_data && results.log2.top_genes && (
                        <PathwayBarChart
                          heatmapDataRaw={results.raw.heatmap_data}
                          heatmapDataLog2={results.log2.heatmap_data}
                          topGenesRaw={results.raw.top_genes}
                          topGenesLog2={results.log2.top_genes}
                          selectedGenes={selectedGenes}
                          setSelectedGenes={setSelectedGenes}
                        />
                      )}
                    </>
                  )}
                </>
              )}
              {analysisType === 'Tumor' && results.log2?.metrics && (
                <>
                  <TumorAnalysisBoxPlot metrics={results.log2.metrics} />
                  <TumorAnalysisTable metrics={results.log2.metrics} />
                </>
              )}
            </div>
          </div>
        </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default UploadResults;