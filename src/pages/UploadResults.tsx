// import React from 'react';
// import { useLocation, useNavigate } from 'react-router-dom';
// import { Alert, AlertDescription } from "@/components/ui/alert";
// import { Info } from "lucide-react";
// import { DataTable } from "@/components/ui/data-table";
// import { PlotlyBarChart } from "@/components/charts/PlotlyBarChart";
// import PlotlyBoxPlot from "@/components/charts/PlotlyTumorBoxPlot";
// import CollapsibleCard from '@/components/ui/collapsible-card';
// import Header from "@/components/header";
// import Footer from "@/components/footer";
// import { Button } from "@/components/ui/button";

// const GeneAnalysisTable = ({ metrics, topGenes }) => {
//   const columns = [
//     { key: 'gene', header: 'Gene', sortable: true },
//     { key: 'cv', header: 'CV', sortable: true, render: (value) => value.toFixed(4) },
//     { key: 'cv_squared', header: 'CV²', sortable: true, render: (value) => value.toFixed(4) },
//     { key: 'std', header: 'STD', sortable: true, render: (value) => value.toFixed(4) },
//     { key: 'mad', header: 'MAD', sortable: true, render: (value) => value.toFixed(4) },
//     { key: 'mean', header: 'Mean', sortable: true, render: (value) => value.toFixed(4) },
//   ];

//   const data = topGenes.map((gene) => ({
//     gene,
//     cv: metrics.cv?.[gene] || 0,
//     cv_squared: metrics.cv_squared?.[gene] || 0,
//     std: metrics.std?.[gene] || 0,
//     mad: metrics.mad?.[gene] || 0,
//     mean: metrics.mean?.[gene] || 0,
//   }));

//   return (
//     <div className="mt-6">
//       <h3 className="text-xl font-bold text-blue-900 mb-4">Gene Noise Metrics</h3>
//       <DataTable
//         data={data}
//         columns={columns}
//         defaultSortKey="cv"
//         defaultSortOrder="desc"
//         className="border rounded-md"
//         showDownloadButtons={true}
//         containerWidth="100%"
//       />
//     </div>
//   );
// };

// const PathwayAnalysisTable = ({ enrichment }) => {
//   const columns = [
//     { key: 'Term', header: 'Term', sortable: true },
//     { key: 'P-value', header: 'P-value', sortable: true, render: (value) => value.toExponential(4) },
//     { key: 'Adjusted P-value', header: 'Adjusted P-value', sortable: true, render: (value) => value.toExponential(4) },
//     { key: 'Genes', header: 'Genes', render: (value) => value.join(', ') },
//     { key: 'GeneSet', header: 'Gene Set' },
//   ];

//   return (
//     <div className="mt-6">
//       <h3 className="text-xl font-bold text-blue-900 mb-4">Enriched Pathways</h3>
//       <DataTable
//         data={enrichment}
//         columns={columns}
//         defaultSortKey="P-value"
//         defaultSortOrder="asc"
//         className="border rounded-md"
//         showDownloadButtons={true}
//         containerWidth="100%"
//       />
//     </div>
//   );
// };

// const TumorAnalysisTable = ({ metrics }) => {
//   const columns = [
//     { key: 'sample', header: 'Sample', sortable: true },
//     { key: 'DEPTH2', header: 'DEPTH2', sortable: true, render: (value) => value.toFixed(4) },
//     { key: 'tITH', header: 'tITH', sortable: true, render: (value) => value.toFixed(4) },
//   ];

//   return (
//     <div className="mt-6">
//       <h3 className="text-xl font-bold text-blue-900 mb-4">Tumor Heterogeneity Metrics</h3>
//       <DataTable
//         data={metrics}
//         columns={columns}
//         defaultSortKey="DEPTH2"
//         defaultSortOrder="desc"
//         className="border rounded-md"
//         showDownloadButtons={true}
//       />
//     </div>
//   );
// };

// const GeneAnalysisBarChart = ({ metrics, topGenes }) => {
//   const data = topGenes.map((gene) => ({
//     gene,
//     cv: metrics.cv?.[gene] || 0,
//     std: metrics.std?.[gene] || 0,
//     mad: metrics.mad?.[gene] || 0,
//     cv_squared: metrics.cv_squared?.[gene] || 0,
//     mean: metrics.mean?.[gene] || 0,
//   }));

//   return (
//     <div className="mt-6">
//       <h3 className="text-xl font-bold text-blue-900 mb-4">Gene Noise Metrics</h3>
//       <PlotlyBarChart
//         data={data}
//         title="Gene Noise Metrics"
//         xKey="gene"
//         yKey={["cv", "std", "mad", "cv_squared", "mean"]}
//         xLabel="Genes"
//         yLabel="Metric Value"
//         colors={["rgba(59, 130, 246, 0.6)", "rgba(239, 68, 68, 0.6)", "rgba(34, 197, 94, 0.6)", "rgba(197, 178, 34, 0.6)", "rgba(151, 34, 197, 0.6)"]}
//         legendLabels={["CV", "STD", "MAD", "CV²", "Mean"]}
//         orientation="v"
//         showLegend={true}
//       />
//     </div>
//   );
// };

// const PathwayBarChart = ({ heatmapData, topGenes }) => {
//   const data = topGenes.map((gene) => ({
//     gene,
//     mean: heatmapData[gene]?.mean || 0,
//     cv: heatmapData[gene]?.cv || 0,
//   }));

//   return (
//     <div className="mt-6">
//       <h3 className="text-xl font-bold text-blue-900 mb-4">Pathway Analysis (Mean and CV)</h3>
//       <PlotlyBarChart
//         data={data}
//         title="Mean and CV of Gene Expression"
//         xKey="gene"
//         yKey={["mean", "cv"]}
//         xLabel="Genes"
//         yLabel="Value"
//         colors={["rgba(59, 130, 246, 0.6)", "rgba(239, 68, 68, 0.6)"]}
//         legendLabels={["Mean Expression", "Coefficient of Variation"]}
//         orientation="v"
//         showLegend={true}
//       />
//     </div>
//   );
// };

// const TumorAnalysisBoxPlot = ({ metrics }) => {
//   const samples = metrics.map(item => item.sample);
//   return (
//     <div className="mt-6">
//       <h3 className="text-xl font-bold text-blue-900 mb-4">Tumor Heterogeneity Metrics</h3>
//       <div className="space-y-6">
//         <PlotlyBoxPlot
//           data={metrics.map(item => ({ ...item, cancer_type: item.sample }))}
//           title="DEPTH2 by Sample"
//           xKey="DEPTH2"
//           normalizationMethod="Metric Value"
//           selectedGroups={samples}
//           colorMap={samples.reduce((acc, sample, i) => ({ ...acc, [sample]: `hsl(${(i * 360 / samples.length)}, 70%, 50%)` }), {})}
//           className="border rounded-md"
//           showLegend={false}
//         />
//         <PlotlyBoxPlot
//           data={metrics.map(item => ({ ...item, cancer_type: item.sample }))}
//           title="tITH by Sample"
//           xKey="tITH"
//           normalizationMethod="Metric Value"
//           selectedGroups={samples}
//           colorMap={samples.reduce((acc, sample, i) => ({ ...acc, [sample]: `hsl(${(i * 360 / samples.length)}, 70%, 50%)` }), {})}
//           className="border rounded-md"
//           showLegend={false}
//         />
//       </div>
//     </div>
//   );
// };

// const UploadResults = () => {
//   const { state } = useLocation();
//   const navigate = useNavigate();
//   const { results, analysisType } = state || {};

//   if (!results || !analysisType) {
//     return (
//       <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-yellow-50 flex flex-col">
//         <Header />
//         <main className="flex-grow py-12">
//           <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
//             <div className="text-center">
//               <h2 className="text-2xl font-bold text-blue-900 mb-4">No Results Available</h2>
//               <p className="text-blue-700 mb-6">Please submit an analysis from the upload page to view results.</p>
//               <Button
//                 onClick={() => navigate('/')}
//                 className="bg-gradient-to-r from-blue-600 to-blue-900 text-white px-3 py-2"
//               >
//                 Return to Upload Page
//               </Button>
//             </div>
//           </div>
//         </main>
//         <Footer />
//       </div>
//     );
//   }

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-yellow-50 flex flex-col">
//       <Header />
//       <main className="flex-grow py-12">
//         <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
//           <div className="flex justify-between items-center mb-6">
//             <h2 className="text-2xl font-bold text-blue-900">Analysis Results</h2>
//             <Button
//               onClick={() => navigate('/upload-analysis')}
//               className="bg-gradient-to-r from-blue-600 to-blue-900 text-white px-3 py-2"
//             >
//               Back to Upload
//             </Button>
//           </div>
//           {results.warning && (
//             <Alert className="mb-6">
//               <Info className="h-4 w-4" />
//               <AlertDescription>{results.warning}</AlertDescription>
//             </Alert>
//           )}
//           <CollapsibleCard title={`Results For ${analysisType} Analysis`}>
//             {results.analysis_type === 'Gene' && results.metrics && results.top_genes && (
//               <>
//                 <GeneAnalysisTable metrics={results.metrics} topGenes={results.top_genes} />
//                 <GeneAnalysisBarChart metrics={results.metrics} topGenes={results.top_genes} />
//               </>
//             )}
//             {results.analysis_type === 'Pathway' && (
//               <>
//                 {results.enrichment && results.enrichment.length > 0 && (
//                   <PathwayAnalysisTable enrichment={results.enrichment} />
//                 )}
//                 {results.heatmap_data && results.top_genes && (
//                   <PathwayBarChart
//                     heatmapData={results.heatmap_data}
//                     topGenes={results.top_genes}
//                   />
//                 )}
//               </>
//             )}
//             {results.analysis_type === 'Tumor' && results.metrics && (
//               <>
//                 <TumorAnalysisBoxPlot metrics={results.metrics} />
//                 <TumorAnalysisTable metrics={results.metrics} />
//               </>
//             )}
//           </CollapsibleCard>
//         </div>
//       </main>
//       <Footer />
//     </div>
//   );
// };

// export default UploadResults;
import React, { useState, useMemo } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Info, ArrowLeft, Download } from "lucide-react";
import { DataTable } from "@/components/ui/data-table";
import { PlotlyBarChart } from "@/components/charts/PlotlyBarChart";
import PlotlyBoxPlot from "@/components/charts/PlotlyTumorBoxPlot";
import CollapsibleCard from '@/components/ui/collapsible-card';
import Header from "@/components/header";
import Footer from "@/components/footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const GeneAnalysisTable = ({ metrics, topGenes }) => {
  const columns = [
    { key: 'gene', header: 'Gene', sortable: true },
    { key: 'cv', header: 'CV', sortable: true, render: (value) => value.toFixed(4) },
    { key: 'cv_squared', header: 'CV²', sortable: true, render: (value) => value.toFixed(4) },
    { key: 'std', header: 'STD', sortable: true, render: (value) => value.toFixed(4) },
    { key: 'mad', header: 'MAD', sortable: true, render: (value) => value.toFixed(4) },
    { key: 'mean', header: 'Mean', sortable: true, render: (value) => value.toFixed(4) },
  ];

  const data = topGenes.map((gene) => ({
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
    a.download = `gene_analysis_metrics_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <CollapsibleCard
      title="Gene Noise Metrics"
      downloadButton={
        <Button onClick={downloadCSV} variant="outline" size="sm" className="h-6 px-2 text-xs">
          <Download className="h-4 w-4 mr-2" /> Download CSV
        </Button>
      }
    >
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

const PathwayAnalysisTable = ({ enrichment }) => {
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
    a.download = `pathway_enrichment_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <CollapsibleCard
      title="Enriched Pathways"
      downloadButton={
        <Button onClick={downloadCSV} variant="outline" size="sm" className="h-6 px-2 text-xs">
          <Download className="h-4 w-4 mr-2" /> Download CSV
        </Button>
      }
    >
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

const TumorAnalysisTable = ({ metrics }) => {
  const columns = [
    { key: 'sample', header: 'Sample', sortable: true },
    { key: 'DEPTH2', header: 'DEPTH2', sortable: true, render: (value) => value.toFixed(4) },
    { key: 'tITH', header: 'tITH', sortable: true, render: (value) => value.toFixed(4) },
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
      title="Tumor Heterogeneity Metrics"
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

const GeneAnalysisBarChart = ({ metrics, topGenes }) => {
  const data = topGenes.map((gene) => ({
    gene,
    cv: metrics.cv?.[gene] || 0,
    std: metrics.std?.[gene] || 0,
    mad: metrics.mad?.[gene] || 0,
    cv_squared: metrics.cv_squared?.[gene] || 0,
    mean: metrics.mean?.[gene] || 0,
  }));

  return (
    <CollapsibleCard title="Gene Noise Metrics">
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
    </CollapsibleCard>
  );
};

const PathwayBarChart = ({ heatmapData, topGenes }) => {
  const data = topGenes.map((gene) => ({
    gene,
    mean: heatmapData[gene]?.mean || 0,
    cv: heatmapData[gene]?.cv || 0,
  }));

  return (
    <CollapsibleCard title="Pathway Analysis (Mean and CV)">
      <PlotlyBarChart
        data={data}
        title="Mean and CV of Gene Expression"
        xKey="gene"
        yKey={["mean", "cv"]}
        xLabel="Genes"
        yLabel="Value"
        colors={["rgba(59, 130, 246, 0.6)", "rgba(239, 68, 68, 0.6)"]}
        legendLabels={["Mean Expression", "Coefficient of Variation"]}
        orientation="v"
        showLegend={true}
      />
    </CollapsibleCard>
  );
};

const TumorAnalysisBoxPlot = ({ metrics }) => {
  const samples = metrics.map(item => item.sample);

  return (
    <CollapsibleCard title="Tumor Heterogeneity Metrics">
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
    </CollapsibleCard>
  );
};

const UploadResults = () => {
  const { state } = useLocation();
  const navigate = useNavigate();
  const { results, analysisType } = state || {};
  const [isOpen, setIsOpen] = useState(false);

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
          <div className="grid grid-cols-1 gap-6">
            <div>
              
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
                {results.warning && (
                <Card className="shadow-lg p-4 mb-4 text-center text-yellow-700 bg-red-50">
                  <p className="text-lg">{results.warning}</p>
                </Card>
              )}
              </div>
              {/* {analysisType === 'Tumor' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <Card className="border-0 shadow-lg">
                    <CardContent className="flex flex-col items-center p-4 text-center">
                      <Info className="h-6 w-6 text-green-600 mb-2" />
                      <div className="text-2xl font-bold text-green-600">{totalNormalSamples}</div>
                      <div className="text-xs text-gray-600">Total Normal Samples</div>
                    </CardContent>
                  </Card>
                  <Card className="border-0 shadow-lg">
                    <CardContent className="flex flex-col items-center p-4 text-center">
                      <Info className="h-6 w-6 text-red-600 mb-2" />
                      <div className="text-2xl font-bold text-red-600">{totalTumorSamples}</div>
                      <div className="text-xs text-gray-600">Total Tumor Samples</div>
                    </CardContent>
                  </Card>
                </div>
              )} */}
              {/* {analysisType === 'Tumor' && (
                <CollapsibleCard
                  title="Sample Counts"
                //   isOpen={isOpen}
                  toggleOpen={toggleOpen}
                >
                  <table className="min-w-full bg-white border border-gray-200 rounded-lg shadow-sm">
                    <thead>
                      <tr>
                        <th className="py-2 px-4 text-left text-blue-700 font-semibold">Site</th>
                        <th className="py-2 px-4 text-left text-blue-700 font-semibold">Tumor Samples</th>
                        <th className="py-2 px-4 text-left text-blue-700 font-semibold">Normal Samples</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sampleCounts.map((count, index) => (
                        <tr key={index} className="border-b">
                          <td className="py-2 px-4 text-blue-700">{count.site}</td>
                          <td className="py-2 px-4 text-blue-700">{count.tumor}</td>
                          <td className="py-2 px-4 text-blue-700">{count.normal}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </CollapsibleCard>
              )} */}
              {results.analysis_type === 'Gene' && results.metrics && results.top_genes && (
                <>
                  <GeneAnalysisBarChart metrics={results.metrics} topGenes={results.top_genes} />
                  <GeneAnalysisTable metrics={results.metrics} topGenes={results.top_genes} />
                </>
              )}
              {results.analysis_type === 'Pathway' && (
                <>
                  {results.enrichment && results.enrichment.length > 0 && (
                    <PathwayAnalysisTable enrichment={results.enrichment} />
                  )}
                  {results.heatmap_data && results.top_genes && (
                    <PathwayBarChart heatmapData={results.heatmap_data} topGenes={results.top_genes} />
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
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default UploadResults;