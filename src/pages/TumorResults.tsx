// import { useState, useEffect, useRef } from "react";
// import { useSearchParams, Link } from "react-router-dom";
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// import { Button } from "@/components/ui/button";
// import { Badge } from "@/components/ui/badge";
// import { ArrowLeft, Download, Box, ChevronRight, ChevronDown, Users } from "lucide-react";
// import { Checkbox } from "@/components/ui/checkbox";
// import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
// import { Label } from "@/components/ui/label";
// import { 
//   ResponsiveContainer, 
//   XAxis, 
//   YAxis, 
//   CartesianGrid, 
//   Tooltip,
//   ComposedChart,
//   Bar,
//   ErrorBar
// } from "recharts";

// const TumourResults = () => {
//   const [searchParams] = useSearchParams();
//   const cancerType = searchParams.get('cancerType') || '';
// //   const genes = searchParams.get('genes')?.split(',') || [];
  
//   // Filter states
//   const [normalizationMethod, setNormalizationMethod] = useState('TPM');
//   const [selectedNoiseMetrics, setSelectedNoiseMetrics] = useState<string[]>(['CV']); // Allow multiple selections
//   const [selectedSites, setSelectedSites] = useState(['Breast']);
//   const [selectedAnnotations, setSelectedAnnotations] = useState<string[]>([]);
//   const [isAllCollapsed, setIsAllCollapsed] = useState(false);
//   const [visiblePlots, setVisiblePlots] = useState({
//     cv: true,
//     stdDev: false,
//     variance: false,
//     mad: false,
//     depth: false,
//     depth2: false,
//     linearDist: true,
//     logDist: true,
//     exprTrend: true,
//     timeSeries: true,
//     tumorNormal: true,
//     correlation: true,
//     detailedMetrics: true
//   });

//   // Refs for chart containers
//   const chartRefs = useRef<{[key: string]: any}>({});

//   // // Primary sites options
//   // const primarySites = [
//   //   'Bladder', 'Brain', 'Breast', 'Colorectal', 'Liver', 'Lung', 'Pancreas', 'Thymus'
//   // ];

//   // Noise metric options
//   const noiseMetrics = {
//     'CV': 'cv',
//     'CV2': 'cv',
//     'Standard Deviation': 'stdDev',
//     'Variance': 'variance',
//     'MAD': 'mad',
//     'DEPTH2': 'depth2',
//     'DEPTH - tITH': 'depth'
//   };

//   // Handle noise metric selection
//   const handleNoiseMetricToggle = (metric: string) => {
//     setSelectedNoiseMetrics(prev => 
//       prev.includes(metric) 
//         ? prev.filter(m => m !== metric)
//         : [...prev, metric]
//     );
//   };

// //   // Handle site selection
// //   const handleSiteToggle = (site: string) => {
// //     setSelectedSites(prev => 
// //       prev.includes(site) 
// //         ? prev.filter(s => s !== site)
// //         : [...prev, site]
// //     );
// //   };

//   // const handleSelectAllSites = () => {
//   //   setSelectedSites(primarySites);
//   // };

// //   const handleDeselectAllSites = () => {
// //     setSelectedSites([]);
// //   };

//   // // Handle annotation selection
//   // const handleSelectAllAnnotations = () => {
//   //   setSelectedAnnotations(['annotation1', 'annotation2']);
//   // };

//   // const handleDeselectAllAnnotations = () => {
//   //   setSelectedAnnotations([]);
//   // };

//   // Handle collapse all toggle
//   const handleCollapseAll = () => {
//     setIsAllCollapsed(!isAllCollapsed);
//     setVisiblePlots(prev => {
//       const newPlots = { ...prev };
//       Object.keys(newPlots).forEach(key => {
//         newPlots[key] = !isAllCollapsed;
//       });
//       return newPlots;
//     });
//   };

//   // Handle individual plot visibility
//   const handlePlotToggle = (plotKey: string) => {
//     setVisiblePlots(prev => ({
//       ...prev,
//       [plotKey]: !prev[plotKey]
//     }));
//   };

//   const applyFilters = () => {
//     console.log('Applying filters:', {
//       normalizationMethod,
//       selectedNoiseMetrics,
//       selectedSites,
//       selectedAnnotations
//     });
//     // Update visible plots based on selected noise metrics
//     setVisiblePlots(prev => ({
//       ...prev,
//       cv: selectedNoiseMetrics.includes('CV') || selectedNoiseMetrics.includes('CV2'),
//       stdDev: selectedNoiseMetrics.includes('Standard Deviation'),
//       variance: selectedNoiseMetrics.includes('Variance'),
//       mad: selectedNoiseMetrics.includes('MAD'),
//       depth: selectedNoiseMetrics.includes('DEPTH - tITH'),
//       depth2: selectedNoiseMetrics.includes('DEPTH2')
//     }));
//     console.log('Visible plots after filters:', visiblePlots);
//   };

//   // Generate mock data for boxplots
//   const generateBoxplotData = (genes: string[]) => {
//     const data = genes.map(gene => {
//       const baseValue = Math.random() * 100;
//       return {
//         gene,
//         cv: Math.random() * 50 + 10,
//         cvQ1: baseValue * 0.8,
//         cvQ3: baseValue * 1.2,
//         cvMin: baseValue * 0.6,
//         cvMax: baseValue * 1.4,
//         cvMedian: baseValue,
//         stdDev: Math.random() * 100 + 20,
//         stdDevQ1: baseValue * 0.7,
//         stdDevQ3: baseValue * 1.3,
//         stdDevMin: baseValue * 0.5,
//         stdDevMax: baseValue * 1.5,
//         stdDevMedian: baseValue,
//         variance: Math.random() * 1000 + 100,
//         varianceQ1: baseValue * 0.75,
//         varianceQ3: baseValue * 1.25,
//         varianceMin: baseValue * 0.55,
//         varianceMax: baseValue * 1.45,
//         varianceMedian: baseValue,
//         mad: Math.random() * 80 + 15,
//         madQ1: baseValue * 0.85,
//         madQ3: baseValue * 1.15,
//         madMin: baseValue * 0.65,
//         madMax: baseValue * 1.35,
//         madMedian: baseValue,
//         depth: Math.random() * 50 + 10,
//         depthQ1: baseValue * 0.9,
//         depthQ3: baseValue * 1.1,
//         depthMin: baseValue * 0.7,
//         depthMax: baseValue * 1.3,
//         depthMedian: baseValue,
//         depth2: Math.random() * 30 + 5,
//         depth2Q1: baseValue * 0.8,
//         depth2Q3: baseValue * 1.2,
//         depth2Min: baseValue * 0.6,
//         depth2Max: baseValue * 1.4,
//         depth2Median: baseValue,
//         tumorSamples: Math.floor(Math.random() * 200) + 100,
//         normalSamples: Math.floor(Math.random() * 50) + 20
//       };
//     });
//     console.log('Generated boxplot data:', data);
//     return data;
//   };

// //   const [resultsData, setResultsData] = useState(generateBoxplotData(genes));

// //   // Log genes to ensure they are not empty
// //   useEffect(() => {
// //     console.log('Genes:', genes);
// //     if (genes.length === 0) {
// //       console.warn('No genes provided, boxplots may not render.');
// //     }
// //   }, [genes]);

//   const getCancerTypeLabel = (type: string) => {
//     const labels: { [key: string]: string } = {
//       breast: "Breast Cancer (BRCA)",
//       lung: "Lung Cancer (LUAD)",
//       prostate: "Prostate Cancer (PRAD)",
//       colorectal: "Colorectal Cancer (COAD)",
//       liver: "Liver Cancer (LIHC)",
//       kidney: "Kidney Cancer (KIRC)",
//       stomach: "Stomach Cancer (STAD)",
//       ovarian: "Ovarian Cancer (OV)"
//     };
//     return labels[type] || type;
//   };

//   const downloadChart = (chartKey: string, chartName: string) => {
//     const chartElement = chartRefs.current[chartKey];
//     if (chartElement) {
//       const svg = chartElement.querySelector('svg');
//       if (svg) {
//         const canvas = document.createElement('canvas');
//         const ctx = canvas.getContext('2d');
//         const img = new Image();
        
//         const svgData = new XMLSerializer().serializeToString(svg);
//         const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
//         const url = URL.createObjectURL(svgBlob);
        
//         img.onload = function() {
//           canvas.width = img.width || 800;
//           canvas.height = img.height || 400;
//           ctx?.drawImage(img, 0, 0);
          
//           canvas.toBlob((blob) => {
//             if (blob) {
//               const link = document.createElement('a');
//               link.download = `${chartName.replace(/\s+/g, '_').toLowerCase()}_${Date.now()}.png`;
//               link.href = URL.createObjectURL(blob);
//               link.click();
//               URL.revokeObjectURL(link.href);
//             }
//           });
//           URL.revokeObjectURL(url);
//         };
//         img.src = url;
//       }
//     }
//   };

// //   const downloadData = (format: 'csv' | 'json') => {
// //     // const data = resultsData;
// //     let content = '';
// //     let filename = `tumor_analysis_${cancerType}_${Date.now()}`;

// //     if (format === 'csv') {
// //       const headers = Object.keys(data[0]).join(',');
// //       const rows = data.map(row => Object.values(row).join(','));
// //       content = [headers, ...rows].join('\n');
// //       filename += '.csv';
// //     } else {
// //       content = JSON.stringify(data, null, 2);
// //       filename += '.json';
// //     }

// //     const blob = new Blob([content], { type: format === 'csv' ? 'text/csv' : 'application/json' });
// //     const url = URL.createObjectURL(blob);
// //     const a = document.createElement('a');
// //     a.href = url;
// //     a.download = filename;
// //     a.click();
// //     URL.revokeObjectURL(url);
// //   };

// //   const totalTumorSamples = resultsData.reduce((sum, gene) => sum + gene.tumorSamples, 0);
// //   const totalNormalSamples = resultsData.reduce((sum, gene) => sum + gene.normalSamples, 0);

//   const colors = ['#2563eb', '#059669', '#dc2626', '#7c3aed', '#ea580c'];

//   // Custom boxplot component
//   const BoxplotBar = ({ data, dataKey, color, title }: any) => (
//     <Card className="border-0 shadow-lg">
//       <CardHeader className="pb-2">
//         <CardTitle className="flex items-center justify-between text-sm">
//           <div className="flex items-center space-x-2">
//             <Box className="h-4 w-4" style={{ color }} />
//             <span>{title}</span>
//           </div>
//           <Button 
//             size="sm" 
//             variant="outline" 
//             onClick={() => downloadChart(`boxplot-${dataKey}`, title)}
//             className="h-6 px-2 text-xs"
//           >
//             <Download className="h-3 w-3" />
//           </Button>
//         </CardTitle>
//       </CardHeader>
//       <CardContent className="pt-0">
//         <div ref={el => chartRefs.current[`boxplot-${dataKey}`] = el}>
//           <ResponsiveContainer width="100%" height={200}>
//             <ComposedChart data={data} margin={{ top: 5, right: 5, left: 5, bottom: 25 }}>
//               <CartesianGrid strokeDasharray="3 3" />
//               <XAxis 
//                 dataKey="gene" 
//                 tick={{ fontSize: 10 }}
//                 label={{ 
//                   value: 'Genes', 
//                   position: 'insideBottom', 
//                   offset: -10, 
//                   style: { fontSize: '10px' } 
//                 }}
//               />
//               <YAxis 
//                 tick={{ fontSize: 10 }}
//                 label={{ 
//                   value: title, 
//                   angle: -90, 
//                   position: 'insideLeft', 
//                   style: { fontSize: '10px' } 
//                 }} 
//               />
//               <Tooltip 
//                 formatter={(value) => [
//                   typeof value === 'number' ? value.toFixed(2) : value,
//                   title,
//                 ]} 
//               />
//               <Bar dataKey={`${dataKey}Median`} fill={color}>
//                 <ErrorBar dataKey={`${dataKey}Min`} width={4} stroke={color} />
//                 <ErrorBar dataKey={`${dataKey}Max`} width={4} stroke={color} />
//               </Bar>
//             </ComposedChart>
//           </ResponsiveContainer>
//         </div>
//       </CardContent>
//     </Card>
//   );

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-yellow-50">
//       <header className="bg-white shadow-sm border-b border-blue-100">
//         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
//           <div className="flex items-center justify-between">
//             <div className="flex items-center space-x-3">
//               <h1 className="text-2xl font-bold text-blue-900">Gene Analysis Results</h1>
//             </div>
//             <nav className="flex space-x-6">
//               <Link to="/" className="text-blue-700 hover:text-blue-600 font-medium transition-colors">
//                 Home
//               </Link>
//               <Link to="/gene-analysis" className="text-blue-500 font-medium">
//                 Gene Analysis
//               </Link>
//               <Link to="/pathway-analysis" className="text-blue-700 hover:text-blue-600 font-medium transition-colors">
//                 Pathway Analysis
//               </Link>
//               <Link to="/tumour-analysis" className="text-blue-700 hover:text-blue-600 font-medium transition-colors">
//                 Tumor Analysis
//               </Link>
//             </nav>
//           </div>
//         </div>
//       </header>

//       <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
//         <div className="flex gap-6">
//           {/* Left Sidebar - Filters */}
//           <div className="w-80 flex-shrink-0">
//             <Card className="border-0 shadow-lg bg-blue-100">
//               <CardHeader className="pb-4">
//                 <CardTitle className="text-blue-900">
//                   Filters
//                   {/* <div className="text-base font-medium text-blue-600 mt-1">genes={genes}</div> */}
//                 </CardTitle>
//               </CardHeader>
//               <CardContent className="space-y-6">
//                 {/* Expression Normalization Method */}
//                 <div>
//                   <h3 className="font-semibold text-blue-900 mb-3">Expression Normalization Method</h3>
//                   <RadioGroup value={normalizationMethod} onValueChange={setNormalizationMethod}>
//                     <div className="flex items-center space-x-2">
//                       <RadioGroupItem value="TPM" id="tpm" />
//                       <Label htmlFor="tpm">TPM</Label>
//                     </div>
//                     <div className="flex items-center space-x-2">
//                       <RadioGroupItem value="FPKM" id="fpkm" />
//                       <Label htmlFor="fpkm">FPKM</Label>
//                     </div>
//                     <div className="flex items-center space-x-2">
//                       <RadioGroupItem value="FPKM_UQ" id="fpkm_uq" />
//                       <Label htmlFor="fpkm_uq">FPKM_UQ</Label>
//                     </div>
//                   </RadioGroup>
//                 </div>

//                 {/* Noise Metrics */}
//                 <div>
//                   <h3 className="font-semibold text-blue-900 mb-3">Noise Metrics</h3>
//                   <div className="space-y-2">
//                     {Object.keys(noiseMetrics).map((metric) => (
//                       <div key={metric} className="flex items-center space-x-2">
//                         <Checkbox
//                           id={`noise-${metric}`}
//                           checked={selectedNoiseMetrics.includes(metric)}
//                           onCheckedChange={() => handleNoiseMetricToggle(metric)}
//                         />
//                         <Label htmlFor={`noise-${metric}`} className="text-sm">{metric}</Label>
//                       </div>
//                     ))}
//                   </div>
//                 </div>

//                 {/* Primary Sites */}
//                 {/* <div>
//                   <h3 className="font-semibold text-blue-900 mb-3">Primary Sites</h3>
//                   <div className="flex gap-2 mb-3">
//                     <Button 
//                       size="sm" 
//                       variant="outline" 
//                       onClick={handleSelectAllSites}
//                       className="text-xs"
//                     >
//                       Select All
//                     </Button>
//                     <Button 
//                       size="sm" 
//                       variant="outline" 
//                       onClick={handleDeselectAllSites}
//                       className="text-xs"
//                     >
//                       Deselect All
//                     </Button>
//                   </div>
//                   <div className="space-y-2 max-h-48 overflow-y-auto">
//                     {primarySites.map((site) => (
//                       <div key={site} className="flex items-center space-x-2">
//                         <Checkbox
//                           id={site}
//                           checked={selectedSites.includes(site)}
//                           onCheckedChange={() => handleSiteToggle(site)}
//                         />
//                         <Label htmlFor={site} className="text-sm">{site}</Label>
//                       </div>
//                     ))}
//                   </div>
//                 </div> */}

//                 {/* Annotations */}
//                 {/* <div>
//                   <h3 className="font-semibold text-blue-900 mb-3">Annotations</h3>
//                   <div className="flex gap-2">
//                     <Button 
//                       size="sm" 
//                       variant="outline" 
//                       onClick={handleSelectAllAnnotations}
//                       className="text-xs"
//                     >
//                       Select All
//                     </Button>
//                     <Button 
//                       size="sm" 
//                       variant="outline" 
//                       onClick={handleDeselectAllAnnotations}
//                       className="text-xs"
//                     >
//                       Deselect All
//                     </Button>
//                   </div>
//                 </div> */}

//                 {/* Plot Visibility Controls */}
//                 <div>
//                   <h3 className="font-semibold text-blue-900 mb-3">Relative Analysis Plots</h3>
//                   <div className="space-y-2">
//                     {/* <div className="flex items-center space-x-2">
//                       <Checkbox
//                         id="linearDist"
//                         checked={visiblePlots.linearDist}
//                         onCheckedChange={() => handlePlotToggle('linearDist')}
//                       />
//                       <Label htmlFor="linearDist" className="text-sm">Linear Expression Distribution</Label>
//                     </div> */}
//                     <div className="flex items-center space-x-2">
//                       <Checkbox
//                         id="logDist"
//                         checked={visiblePlots.logDist}
//                         onCheckedChange={() => handlePlotToggle('logDist')}
//                       />
//                       <Label htmlFor="logDist" className="text-sm">Log Expression Distribution</Label>
//                     </div>
//                     <div className="flex items-center space-x-2">
//                       <Checkbox
//                         id="exprTrend"
//                         checked={visiblePlots.exprTrend}
//                         onCheckedChange={() => handlePlotToggle('exprTrend')}
//                       />
//                       <Label htmlFor="exprTrend" className="text-sm">Expression Trend</Label>
//                     </div>
//                     {/* <div className="flex items-center space-x-2">
//                       <Checkbox
//                         id="timeSeries"
//                         checked={visiblePlots.timeSeries}
//                         onCheckedChange={() => handlePlotToggle('timeSeries')}
//                       />
//                       <Label htmlFor="timeSeries" className="text-sm">Time Series</Label>
//                     </div> */}
//                     <div className="flex items-center space-x-2">
//                       <Checkbox
//                         id="tumorNormal"
//                         checked={visiblePlots.tumorNormal}
//                         onCheckedChange={() => handlePlotToggle('tumorNormal')}
//                       />
//                       <Label htmlFor="tumorNormal" className="text-sm">Tumor vs Normal</Label>
//                     </div>
//                     {/* {genes.length > 1 && (
//                       <div className="flex items-center space-x-2">
//                         <Checkbox
//                           id="correlation"
//                           checked={visiblePlots.correlation}
//                           onCheckedChange={() => handlePlotToggle('correlation')}
//                         />
//                         <Label htmlFor="correlation" className="text-sm">Correlation Heatmap</Label>
//                       </div>
//                     )} */}
//                     {/* <div className="flex items-center space-x-2">
//                       <Checkbox
//                         id="detailedMetrics"
//                         checked={visiblePlots.detailedMetrics}
//                         onCheckedChange={() => handlePlotToggle('detailedMetrics')}
//                       />
//                       <Label htmlFor="detailedMetrics" className="text-sm">Detailed Metrics</Label>
//                     </div> */}
//                   </div>
//                 </div>
//                 <Button 
//                   variant="outline" 
//                   className="w-full justify-between bg-blue-600 text-white hover:bg-blue-700"
//                   onClick={handleCollapseAll}
//                 >
//                   {isAllCollapsed ? 'Collapse All' : 'Expand All'}
//                   {isAllCollapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
//                 </Button>
//                 {/* Apply Button */}
//                 <Button onClick={applyFilters} className="w-full bg-blue-600 hover:bg-blue-700">
//                   Apply
//                 </Button>

//               </CardContent>
//             </Card>
//           </div>

//           {/* Main Content */}
//           <div className="flex-1">
//               <Link to="/gene-analysis" className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-6 transition-colors">
//                 <ArrowLeft className="h-4 w-4 mr-2" />
//                 Back to Gene Analysis
//               </Link>

//             {/* <div className="mb-8">
//               <h2 className="text-4xl font-bold text-blue-900 mb-2">
//                 Results for {getCancerTypeLabel(cancerType)}
//               </h2>
//               <div className="flex space-x-2">
//                 <Button onClick={() => downloadData('csv')} variant="outline" size="sm">
//                   <Download className="h-4 w-4 mr-2" /> Download CSV
//                 </Button>
//                 <Button onClick={() => downloadData('json')} variant="outline" size="sm">
//                   <Download className="h-4 w-4 mr-2" /> Download JSON
//                 </Button>
//               </div>
//               <div className="flex flex-wrap gap-2 mb-4">
//                 {genes.map(gene => (
//                   <Badge key={gene} variant="secondary" className="text-sm">
//                     {gene}
//                   </Badge>
//                 ))}
//               </div> */}
//               <div className="mb-8">
//                 <h2 className="text-4xl font-bold text-blue-900 mb-2">
//                   Results for {getCancerTypeLabel(cancerType)}
//                 </h2>
//                 <div className="flex items-center justify-between mb-4">
                  
//                   {/* Gene Badges on the left */}
//                   {/* <div className="flex flex-wrap gap-2">
//                     {genes.map(gene => (
//                       <Badge key={gene} variant="secondary" className="text-sm">
//                         {gene}
//                       </Badge>
//                     ))}
//                   </div> */}
//                   {/* Download Buttons on the right */}
//                   {/* <div className="flex space-x-4">
//                     <Button onClick={() => downloadData('csv')} variant="outline" size="sm">
//                       <Download className="h-4 w-4 mr-2" /> Download CSV
//                     </Button> */}
//                     {/* <Button onClick={() => downloadData('json')} variant="outline" size="sm">
//                       <Download className="h-4 w-4 mr-2" /> Download JSON
//                     </Button> */}
//                   {/* </div> */}
//                 </div>
              
//               {/* <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
//                 <Card className="border-0 shadow-lg">
//                   <CardContent className="p-4 text-center">
//                     <Users className="h-6 w-6 text-blue-600 mx-auto mb-2" />
//                     <div className="text-2xl font-bold text-blue-600">{totalTumorSamples}</div>
//                     <div className="text-xs text-gray-600">Total Tumor Samples</div>
//                   </CardContent>
//                 </Card>
//                 <Card className="border-0 shadow-lg">
//                   <CardContent className="p-4 text-center">
//                     <Users className="h-6 w-6 text-green-600 mx-auto mb-2" />
//                     <div className="text-2xl font-bold text-green-600">{totalNormalSamples}</div>
//                     <div className="text-xs text-gray-600">Total Normal Samples</div>
//                   </CardContent>
//                 </Card>
//               </div> */}
//             </div> 



//             {/* Boxplots for Statistical Metrics */}
//             {/* {(visiblePlots.cv || visiblePlots.stdDev || visiblePlots.variance || visiblePlots.mad || visiblePlots.depth || visiblePlots.depth2) && (
//               <div className="mb-8">
//                 <h3 className="text-2xl font-bold text-blue-900 mb-4">Statistical Metrics Boxplots</h3>
//                 <div className="grid lg:grid-cols-3 md:grid-cols-2 gap-4">
//                   {visiblePlots.cv && (
//                     <BoxplotBar 
//                       data={resultsData} 
//                       dataKey="cv" 
//                       color="#2563eb" 
//                       title="Coefficient of Variation (%)" 
//                     />
//                   )}
//                   {visiblePlots.stdDev && (
//                     <BoxplotBar 
//                       data={resultsData} 
//                       dataKey="stdDev" 
//                       color="#ca8a04" 
//                       title="Standard Deviation" 
//                     />
//                   )}
//                   {visiblePlots.variance && (
//                     <BoxplotBar 
//                       data={resultsData} 
//                       dataKey="variance" 
//                       color="#059669" 
//                       title="Variance" 
//                     />
//                   )}
//                   {visiblePlots.mad && (
//                     <BoxplotBar 
//                       data={resultsData} 
//                       dataKey="mad" 
//                       color="#7c3aed" 
//                       title="Mean Absolute Deviation" 
//                     />
//                   )}
//                   {visiblePlots.depth && (
//                     <BoxplotBar 
//                       data={resultsData} 
//                       dataKey="depth" 
//                       color="#dc2626" 
//                       title="Depth" 
//                     />
//                   )}
//                   {visiblePlots.depth2 && (
//                     <BoxplotBar 
//                       data={resultsData} 
//                       dataKey="depth2" 
//                       color="#ea580c" 
//                       title="Depth2" 
//                     />
//                   )}
//                 </div>
//               </div>
//             )} */}
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default TumourResults;
import { useState, useEffect, useRef } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  ErrorBar,
  Scatter
} from "recharts";

const TumourResults = () => {
  const [searchParams] = useSearchParams();
  const cancerType = searchParams.get('cancerType') || '';
  
  // Filter states
  const [normalizationMethod, setNormalizationMethod] = useState('TPM');
  const [selectedNoiseMetrics, setSelectedNoiseMetrics] = useState<string[]>(['DEPTH2', 'DEPTH - tITH']);
  const [selectedSites, setSelectedSites] = useState(['Prostate']);
  const [isAllCollapsed, setIsAllCollapsed] = useState(false);
  const [visiblePlots, setVisiblePlots] = useState({
    cv: false,
    stdDev: false,
    variance: false,
    mad: false,
    depth: true,
    depth2: true,
    tith: true,
    diffNoise: true,
    normalNoise: true,
    tumorNoise: true
  });

  // Refs for chart containers
  const chartRefs = useRef<{[key: string]: any}>({});

  // Noise metric options
  const noiseMetrics = {
    'CV': 'cv',
    'CV2': 'cv',
    'Standard Deviation': 'stdDev',
    'Variance': 'variance',
    'MAD': 'mad',
    'DEPTH2': 'depth2',
    'DEPTH - tITH': 'depth'
  };

  // Handle noise metric selection
  const handleNoiseMetricToggle = (metric: string) => {
    setSelectedNoiseMetrics(prev => 
      prev.includes(metric) 
        ? prev.filter(m => m !== metric)
        : [...prev, metric]
    );
  };

  // Handle collapse all toggle
  const handleCollapseAll = () => {
    setIsAllCollapsed(!isAllCollapsed);
    setVisiblePlots(prev => {
      const newPlots = { ...prev };
      Object.keys(newPlots).forEach(key => {
        newPlots[key] = !isAllCollapsed;
      });
      return newPlots;
    });
  };

  // Handle individual plot visibility
  const handlePlotToggle = (plotKey: string) => {
    setVisiblePlots(prev => ({
      ...prev,
      [plotKey]: !prev[plotKey]
    }));
  };

  const applyFilters = () => {
    console.log('Applying filters:', {
      normalizationMethod,
      selectedNoiseMetrics,
      selectedSites
    });
    setVisiblePlots(prev => ({
      ...prev,
      // cv: selectedNoiseMetrics.includes('CV') || selectedNoiseMetrics.includes('CV2'),
      stdDev: selectedNoiseMetrics.includes('Standard Deviation'),
      variance: selectedNoiseMetrics.includes('Variance'),
      mad: selectedNoiseMetrics.includes('MAD'),
      depth: selectedNoiseMetrics.includes('DEPTH - tITH'),
      depth2: selectedNoiseMetrics.includes('DEPTH2'),
      tith: selectedNoiseMetrics.includes('DEPTH - tITH'),
      diffNoise: true,
      normalNoise: true,
      tumorNoise: true
    }));
  };

  // Generate mock data for boxplots and other plots
  const generateTumorData = () => {
    const genes = ['TCGA-AA-A01A', 'TCGA-A8-A0J1', 'TCGA-AU-A0FJ', 'TCGA-A8-A09J', 'TCGA-A8-A0J2'];
    const data = genes.map(gene => ({
      gene,
      tpm: Math.random() * 1,
      fpkm: Math.random() * 1.5,
      fpkm_uq: Math.random() * 1.2,
      depth2: Math.random() * 0.5,
      depth2Q1: Math.random() * 0.4,
      depth2Q3: Math.random() * 0.6,
      depth2Min: Math.random() * 0.3,
      depth2Max: Math.random() * 0.7,
      depth2Median: Math.random() * 0.5,
      tith: Math.random() * 0.1,
      diffNoise: Math.random() * 0.5,
      normalNoise: Math.random() * 0.5,
      tumorNoise: Math.random() * 0.5,
      tumorSamples: Math.floor(Math.random() * 200) + 100,
      normalSamples: Math.floor(Math.random() * 50) + 20
    }));
    return data;
  };

    // Generate mock data for boxplots and other plots
  const generateGeneData = () => {
    const genes = ['TP53', 'BRCA1', 'BRCA2', 'ARF5', 'PON1'];
    const data = genes.map(gene => ({
      gene,
      tpm: Math.random() * 1,
      fpkm: Math.random() * 1.5,
      fpkm_uq: Math.random() * 1.2,
      depth2: Math.random() * 0.5,
      depth2Q1: Math.random() * 0.4,
      depth2Q3: Math.random() * 0.6,
      depth2Min: Math.random() * 0.3,
      depth2Max: Math.random() * 0.7,
      depth2Median: Math.random() * 0.5,
      tith: Math.random() * 0.1,
      diffNoise: Math.random() * 0.5,
      normalNoise: Math.random() * 0.5,
      tumorNoise: Math.random() * 0.5,
      tumorSamples: Math.floor(Math.random() * 200) + 100,
      normalSamples: Math.floor(Math.random() * 50) + 20
    }));
    return data;
  };

  const [tumorData, setTumorData] = useState(generateTumorData());
  const [geneData, setGeneData] = useState(generateGeneData());

  const getCancerTypeLabel = (type: string) => {
    const labels: { [key: string]: string } = {
      breast: "Breast Cancer (BRCA)",
      lung: "Lung Cancer (LUAD)",
      prostate: "Prostate Cancer (PRAD)",
      colorectal: "Colorectal Cancer (COAD)",
      liver: "Liver Cancer (LIHC)",
      kidney: "Kidney Cancer (KIRC)",
      stomach: "Stomach Cancer (STAD)",
      ovarian: "Ovarian Cancer (OV)",
      "TCGA-BLCA": "Bladder Cancer (BLCA)"
    };
    return labels[type] || type;
  };

  const downloadChart = (chartKey: string, chartName: string) => {
    const chartElement = chartRefs.current[chartKey];
    if (chartElement) {
      const svg = chartElement.querySelector('svg');
      if (svg) {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const img = new Image();
        
        const svgData = new XMLSerializer().serializeToString(svg);
        const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
        const url = URL.createObjectURL(svgBlob);
        
        img.onload = function() {
          canvas.width = img.width || 800;
          canvas.height = img.height || 400;
          ctx?.drawImage(img, 0, 0);
          
          canvas.toBlob((blob) => {
            if (blob) {
              const link = document.createElement('a');
              link.download = `${chartName.replace(/\s+/g, '_').toLowerCase()}_${Date.now()}.png`;
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
  };

  const colors = ['#2563eb', '#059669', '#dc2626', '#7c3aed', '#ea580c'];

  // Custom boxplot component
  const BoxplotBar = ({ data, dataKey, color, title }: any) => (
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
            onClick={() => downloadChart(`boxplot-${dataKey}`, title)}
            className="h-6 px-2 text-xs"
          >
            <Download className="h-3 w-3" />
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div ref={el => chartRefs.current[`boxplot-${dataKey}`] = el}>
          <ResponsiveContainer width="100%" height={200}>
            <ComposedChart data={data} margin={{ top: 5, right: 5, left: 5, bottom: 25 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="gene" 
                tick={{ fontSize: 10 }}
                label={{ 
                  value: 'Samples', 
                  position: 'insideBottom', 
                  offset: -10, 
                  style: { fontSize: '10px' } 
                }}
              />
              <YAxis 
                tick={{ fontSize: 10 }}
                label={{ 
                  value: title, 
                  angle: -90, 
                  position: 'insideLeft', 
                  style: { fontSize: '10px' } 
                }} 
              />
              <Tooltip 
                formatter={(value) => [
                  typeof value === 'number' ? value.toFixed(2) : value,
                  title,
                ]} 
              />
              <Bar dataKey={`${dataKey}Median`} fill={color}>
                <ErrorBar dataKey={`${dataKey}Min`} width={4} stroke={color} />
                <ErrorBar dataKey={`${dataKey}Max`} width={4} stroke={color} />
              </Bar>
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );

  // Custom scatter plot component for tITH
  const ScatterPlot = ({ data, dataKey, color, title }: any) => (
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
            onClick={() => downloadChart(`scatter-${dataKey}`, title)}
            className="h-6 px-2 text-xs"
          >
            <Download className="h-3 w-3" />
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div ref={el => chartRefs.current[`scatter-${dataKey}`] = el}>
          <ResponsiveContainer width="100%" height={200}>
            <ComposedChart data={data} margin={{ top: 5, right: 5, left: 5, bottom: 25 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="gene" 
                tick={{ fontSize: 10 }}
                label={{ 
                  value: 'Samples', 
                  position: 'insideBottom', 
                  offset: -10, 
                  style: { fontSize: '10px' } 
                }}
              />
              <YAxis 
                tick={{ fontSize: 10 }}
                label={{ 
                  value: title, 
                  angle: -90, 
                  position: 'insideLeft', 
                  style: { fontSize: '10px' } 
                }} 
              />
              <Tooltip 
                formatter={(value) => [
                  typeof value === 'number' ? value.toFixed(2) : value,
                  title,
                ]} 
              />
              <Scatter dataKey={dataKey} fill={color} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );

  // Custom bar chart component for noise rankings
  const BarChart = ({ data, dataKey, color, title }: any) => (
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
            onClick={() => downloadChart(`bar-${dataKey}`, title)}
            className="h-6 px-2 text-xs"
          >
            <Download className="h-3 w-3" />
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div ref={el => chartRefs.current[`bar-${dataKey}`] = el}>
          <ResponsiveContainer width="100%" height={200}>
            <ComposedChart data={data} margin={{ top: 5, right: 5, left: 5, bottom: 25 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="gene" 
                tick={{ fontSize: 10 }}
                label={{ 
                  value: 'Genes', 
                  position: 'insideBottom', 
                  offset: -10, 
                  style: { fontSize: '10px' } 
                }}
              />
              <YAxis 
                tick={{ fontSize: 10 }}
                label={{ 
                  value: title, 
                  angle: -90, 
                  position: 'insideLeft', 
                  style: { fontSize: '10px' } 
                }} 
              />
              <Tooltip 
                formatter={(value) => [
                  typeof value === 'number' ? value.toFixed(2) : value,
                  title,
                ]} 
              />
              <Bar dataKey={dataKey} fill={color} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-yellow-50">
      <header className="bg-white shadow-sm border-b border-blue-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <h1 className="text-2xl font-bold text-blue-900">Tumor Analysis Results</h1>
            </div>
            <nav className="flex space-x-6">
              <Link to="/" className="text-blue-700 hover:text-blue-600 font-medium transition-colors">
                Home
              </Link>
              <Link to="/gene-analysis" className="text-blue-700 hover:text-blue-600 font-medium transition-colors">
                Gene Analysis
              </Link>
              <Link to="/pathway-analysis" className="text-blue-700 hover:text-blue-600 font-medium transition-colors">
                Pathway Analysis
              </Link>
              <Link to="/tumour-analysis" className="text-blue-500 font-medium">
                Tumor Analysis
              </Link>
            </nav>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-6">
          {/* Left Sidebar - Filters */}
          <div className="w-80 flex-shrink-0">
            <Card className="border-0 shadow-lg bg-blue-100">
              <CardHeader className="pb-4">
                <CardTitle className="text-blue-900">
                  Filters
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Expression Normalization Method */}
                <div>
                  <h3 className="font-semibold text-blue-900 mb-3">Expression Normalization Method</h3>
                  <RadioGroup value={normalizationMethod} onValueChange={setNormalizationMethod}>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="TPM" id="tpm" />
                      <Label htmlFor="tpm">TPM</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="FPKM" id="fpkm" />
                      <Label htmlFor="fpkm">FPKM</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="FPKM_UQ" id="fpkm_uq" />
                      <Label htmlFor="fpkm_uq">FPKM_UQ</Label>
                    </div>
                  </RadioGroup>
                </div>

                {/* Noise Metrics */}
                <div>
                  <h3 className="font-semibold text-blue-900 mb-3">Noise Metrics</h3>
                  <div className="space-y-2">
                    {Object.keys(noiseMetrics).map((metric) => (
                      <div key={metric} className="flex items-center space-x-2">
                        <Checkbox
                          id={`noise-${metric}`}
                          checked={selectedNoiseMetrics.includes(metric)}
                          onCheckedChange={() => handleNoiseMetricToggle(metric)}
                        />
                        <Label htmlFor={`noise-${metric}`} className="text-sm">{metric}</Label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Plot Visibility Controls */}
                <div>
                  <h3 className="font-semibold text-blue-900 mb-3">Relative Analysis Plots</h3>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="depth2"
                        checked={visiblePlots.depth2}
                        onCheckedChange={() => handlePlotToggle('depth2')}
                      />
                      <Label htmlFor="depth2" className="text-sm">DEPTH2 Boxplot</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="tith"
                        checked={visiblePlots.tith}
                        onCheckedChange={() => handlePlotToggle('tith')}
                      />
                      <Label htmlFor="tith" className="text-sm">tITH Scatter Plot</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="diffNoise"
                        checked={visiblePlots.diffNoise}
                        onCheckedChange={() => handlePlotToggle('diffNoise')}
                      />
                      <Label htmlFor="diffNoise" className="text-sm">Differential Noise</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="normalNoise"
                        checked={visiblePlots.normalNoise}
                        onCheckedChange={() => handlePlotToggle('normalNoise')}
                      />
                      <Label htmlFor="normalNoise" className="text-sm">Normal State Noise</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="tumorNoise"
                        checked={visiblePlots.tumorNoise}
                        onCheckedChange={() => handlePlotToggle('tumorNoise')}
                      />
                      <Label htmlFor="tumorNoise" className="text-sm">Tumor State Noise</Label>
                    </div>
                  </div>
                </div>
                <Button 
                  variant="outline" 
                  className="w-full justify-between bg-blue-600 text-white hover:bg-blue-700"
                  onClick={handleCollapseAll}
                >
                  {isAllCollapsed ? 'Collapse All' : 'Expand All'}
                  {isAllCollapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                </Button>
                <Button onClick={applyFilters} className="w-full bg-blue-600 hover:bg-blue-700">
                  Apply
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            <Link to="/gene-analysis" className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-6 transition-colors">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Gene Analysis
            </Link>

            <div className="mb-8">
              <h2 className="text-4xl font-bold text-blue-900 mb-2">
                Results for {getCancerTypeLabel(cancerType)}
              </h2>
            </div>

            {/* DEPTH2 and tITH Plots */}
            {(visiblePlots.depth2 || visiblePlots.tith) && (
              <div className="mb-8">
                <h3 className="text-2xl font-bold text-blue-900 mb-4">Tumor Heterogeneity Metrics</h3>
                <div className="grid lg:grid-cols-2 md:grid-cols-1 gap-4">
                  {visiblePlots.depth2 && (
                    <BoxplotBar 
                      data={tumorData} 
                      dataKey="depth2" 
                      color="#ea580c" 
                      title="DEPTH2 Scores" 
                    />
                  )}
                  {visiblePlots.tith && (
                    <ScatterPlot 
                      data={tumorData} 
                      dataKey="tith" 
                      color="#2563eb" 
                      title="Transcriptome-based Intra-Tumor Heterogeneity (tITH)" 
                    />
                  )}
                </div>
              </div>
            )}

            {/* Noise Rankings */}
            {(visiblePlots.diffNoise || visiblePlots.normalNoise || visiblePlots.tumorNoise) && (
              <div className="mb-8">
                <h3 className="text-2xl font-bold text-blue-900 mb-4">Noise Rankings</h3>
                <div className="grid lg:grid-cols-3 md:grid-cols-1 gap-4">
                  {visiblePlots.diffNoise && (
                    <BarChart 
                      data={geneData.slice(0, 5)} 
                      dataKey="diffNoise" 
                      color="#dc2626" 
                      title="Genes with Highest Differential Noise" 
                    />
                  )}
                  {visiblePlots.normalNoise && (
                    <BarChart 
                      data={geneData.slice(0, 5)} 
                      dataKey="normalNoise" 
                      color="#059669" 
                      title="Genes with Highest Normal State Noise" 
                    />
                  )}
                  {visiblePlots.tumorNoise && (
                    <BarChart 
                      data={geneData.slice(0, 5)} 
                      dataKey="tumorNoise" 
                      color="#7c3aed" 
                      title="Genes with Highest Tumor State Noise" 
                    />
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      <footer className="bg-gray-100 text-gray-700 text-m mt-10 p-8 text-center border-t border-gray-300">
      <p className=" text-blue-700 mt-4">© 2025 BIRL — This website is free and open to all users and there is no login requirement.</p>
      <p className="font-semibold text-blue-700 mt-4">Biomedical Informatics & Engineering Research Laboratory, Lahore University of Management Sciences</p>
      <p className=" text-blue-700 mt-4">DHA, Lahore, Pakistan</p>
      <p className=" text-blue-700 mt-4">+92 (42) 3560 8352</p>
    </footer>
    </div>
  );
};

export default TumourResults;