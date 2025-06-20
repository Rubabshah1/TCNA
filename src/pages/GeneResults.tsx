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

// const GeneResults = () => {
//   const [searchParams] = useSearchParams();
//   const cancerType = searchParams.get('cancerType') || '';
//   const genes = searchParams.get('genes')?.split(',') || [];
//   const [selectedGroups, setSelectedGroups] = useState<string[]>(['normal']);
//   const [showNoiseMetrics, setShowNoiseMetrics] = useState(false);
//   const [showAnalysisPlots, setShowAnalysisPlots] = useState(false);
//   const [isNoiseMetricsOpen, setIsNoiseMetricsOpen] = useState(false);
//   const [isAnalysisPlotsOpen, setIsAnalysisPlotsOpen] = useState(false);
  




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
//     linearDist: false,
//     logDist: false,
//     exprTrend: false,
//     timeSeries: false,
//     tumorNormal: false,
//     correlation: false,
//     detailedMetrics: false
//   });

//   // Refs for chart containers
//   const chartRefs = useRef<{[key: string]: any}>({});

//   // Noise metric options
//   const noiseMetrics = {
//     'CV': 'cv',
//     // 'CV2': 'cv2',
//     'Standard Deviation': 'stdDev',
//     // 'Variance': 'variance',
//     'MAD': 'mad'
//     // 'DEPTH2': 'depth2',
//     // 'DEPTH - tITH': 'depth'
//   };
//   const toggleGroup = (group: string) => {
//   setSelectedGroups(prev =>
//     prev.includes(group)
//       ? prev.filter(g => g !== group)
//       : [...prev, group]
//     );
//   };

//   // Handle noise metric selection
//   const handleNoiseMetricToggle = (metric: string) => {
//     setSelectedNoiseMetrics(prev => 
//       prev.includes(metric) 
//         ? prev.filter(m => m !== metric)
//         : [...prev, metric]
//     );
//   };

//   // Handle site selection
//   const handleSiteToggle = (site: string) => {
//     setSelectedSites(prev => 
//       prev.includes(site) 
//         ? prev.filter(s => s !== site)
//         : [...prev, site]
//     );
//   };

//   const getFilteredResults = () => {
//   return resultsData.map(gene => {
//     const filteredGene = { gene };

//     if (selectedGroups.includes('combined')) {
//       filteredGene['cv_combined'] = gene.cv;
//       filteredGene['mad_combined'] = gene.mad;
//       filteredGene['stdDev_combined'] = gene.stdDev;
//     }
//     else if (selectedGroups.includes('tumor')) {
//       filteredGene['cv_tumor'] = gene.cv * 1.1;
//       filteredGene['mad_tumor'] = gene.mad * 1.1;
//       filteredGene['stdDev_tumor'] = gene.stdDev * 1.1;
//     }
//     else if (selectedGroups.includes('normal')) {
//       filteredGene['cv_normal'] = gene.cv * 0.9;
//       filteredGene['mad_normal'] = gene.mad * 0.9;
//       filteredGene['stdDev_normal'] = gene.stdDev * 0.9;
//     }

//     return filteredGene;
//     });
//   };


//   const handleDeselectAllSites = () => {
//     setSelectedSites([]);
//   };

//   // Noise Metrics Checkbox State
//   const allNoiseMetrics = Object.keys(noiseMetrics);
//   const areAllNoiseSelected = allNoiseMetrics.every(metric => selectedNoiseMetrics.includes(metric));
//   const areSomeNoiseSelected = allNoiseMetrics.some(metric => selectedNoiseMetrics.includes(metric));

//   const toggleAllNoiseMetrics = (checked: boolean) => {
//     setSelectedNoiseMetrics(checked ? allNoiseMetrics : []);
//   };

//   // Analysis Plots Checkbox State
//   // const allPlotKeys = ['logDist', 'exprTrend', 'tumorNormal', ...(genes.length > 1 ? ['correlation'] : [])];
//   const allPlotKeys = ['logDist', 'exprTrend', 'tumorNormal'];
//   const areAllPlotsSelected = allPlotKeys.every(plot => visiblePlots[plot]);
//   const areSomePlotsSelected = allPlotKeys.some(plot => visiblePlots[plot]);

//   const toggleAllPlots = (checked: boolean) => {
//     const updated = { ...visiblePlots };
//     allPlotKeys.forEach(plot => {
//       updated[plot] = checked;
//     });
//     setVisiblePlots(updated);
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
//       cv: selectedNoiseMetrics.includes('CV'),
//       cv2: selectedNoiseMetrics.includes('CV2'),
//       stdDev: selectedNoiseMetrics.includes('Standard Deviation'),
//       // variance: selectedNoiseMetrics.includes('Variance'),
//       mad: selectedNoiseMetrics.includes('MAD')
//       // depth: selectedNoiseMetrics.includes('DEPTH - tITH'),
//       // depth2: selectedNoiseMetrics.includes('DEPTH2')
//     }));
//     console.log('Visible plots after filters:', visiblePlots);
//   };

//   // Generate mock data for BarChartComponents
//   const generateBarChartComponentData = (genes: string[]) => {
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
//         cv2: Math.random() * 50 + 10,
//         cv2Q1: baseValue * 0.8,
//         cv2Q3: baseValue * 1.2,
//         cv2Min: baseValue * 0.6,
//         cv2Max: baseValue * 1.4,
//         cv2Median: baseValue,
//         stdDev: Math.random() * 100 + 20,
//         stdDevQ1: baseValue * 0.7,
//         stdDevQ3: baseValue * 1.3,
//         stdDevMin: baseValue * 0.5,
//         stdDevMax: baseValue * 1.5,
//         stdDevMedian: baseValue,
//         // variance: Math.random() * 1000 + 100,
//         // varianceQ1: baseValue * 0.75,
//         // varianceQ3: baseValue * 1.25,
//         // varianceMin: baseValue * 0.55,
//         // varianceMax: baseValue * 1.45,
//         // varianceMedian: baseValue,
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
//     console.log('Generated BarChartComponent data:', data);
//     return data;
//   };

//   const [resultsData, setResultsData] = useState(generateBarChartComponentData(genes));
//   const filteredData = getFilteredResults();
//   // Log genes to ensure they are not empty
//   useEffect(() => {
//     console.log('Genes:', genes);
//     if (genes.length === 0) {
//       console.warn('No genes provided, BarChartComponents may not render.');
//     }
//   }, [genes]);

//   const getCancerTypeLabel = (type: string) => {
//     const labels: { [key: string]: string } = {
//       breast: "Breast Cancer (BRCA)",
//       lung: "Lung Cancer (LUAD)",
//       prostate: "Prostate Cancer (PRAD)",
//       colorectal: "Colorectal Cancer (COAD)",
//       liver: "Liver Cancer (LIHC)",
//       kidney: "Kidney Cancer (KIRC)",
//       stomach: "Stomach Cancer (STAD)",
//       ovarian: "Ovarian Cancer (OV)",
//       "TCGA-BLCA": "Bladder Cancer (BLCA)"
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

//   const downloadData = (format: 'csv' | 'json') => {
//     const data = resultsData;
//     let content = '';
//     let filename = `gene_analysis_${cancerType}_${Date.now()}`;

//     if (format === 'csv') {
//       const headers = Object.keys(data[0]).join(',');
//       const rows = data.map(row => Object.values(row).join(','));
//       content = [headers, ...rows].join('\n');
//       filename += '.csv';
//     } else {
//       content = JSON.stringify(data, null, 2);
//       filename += '.json';
//     }

//     const blob = new Blob([content], { type: format === 'csv' ? 'text/csv' : 'application/json' });
//     const url = URL.createObjectURL(blob);
//     const a = document.createElement('a');
//     a.href = url;
//     a.download = filename;
//     a.click();
//     URL.revokeObjectURL(url);
//   };

//   const totalTumorSamples = resultsData.reduce((sum, gene) => sum + gene.tumorSamples, 0);
//   const totalNormalSamples = resultsData.reduce((sum, gene) => sum + gene.normalSamples, 0);

//   const colors = ['#2563eb', '#059669', '#dc2626', '#7c3aed', '#ea580c'];

//   // Custom BarChartComponent component
//   // const BarChartComponentBar = ({ data, dataKey, color, title }: any) => (
//   //   <Card className="border-0 shadow-lg">
//   //     <CardHeader className="pb-2">
//   //       <CardTitle className="flex items-center justify-between text-sm">
//   //         <div className="flex items-center space-x-2">
//   //           <Box className="h-4 w-4" style={{ color }} />
//   //           <span>{title}</span>
//   //         </div>
//   //         <Button 
//   //           size="sm" 
//   //           variant="outline" 
//   //           onClick={() => downloadChart(`BarChartComponent-${dataKey}`, title)}
//   //           className="h-6 px-2 text-xs"
//   //         >
//   //           <Download className="h-3 w-3" />
//   //         </Button>
//   //       </CardTitle>
//   //     </CardHeader>
//   //     <CardContent className="pt-0">
//   //       <div ref={el => chartRefs.current[`BarChartComponent-${dataKey}`] = el}>
//   //         <ResponsiveContainer width="100%" height={200}>
//   //           <ComposedChart data={data} margin={{ top: 5, right: 5, left: 5, bottom: 25 }}>
//   //             <CartesianGrid strokeDasharray="3 3" />
//   //             <XAxis 
//   //               dataKey="gene" 
//   //               tick={{ fontSize: 10 }}
//   //               label={{ 
//   //                 value: 'Genes', 
//   //                 position: 'insideBottom', 
//   //                 offset: -10, 
//   //                 style: { fontSize: '10px' } 
//   //               }}
//   //             />
//   //             <YAxis 
//   //               tick={{ fontSize: 10 }}
//   //               label={{ 
//   //                 value: title, 
//   //                 angle: -90, 
//   //                 position: 'insideLeft', 
//   //                 style: { fontSize: '10px' } 
//   //               }} 
//   //             />
//   //             <Tooltip 
//   //               formatter={(value) => [
//   //                 typeof value === 'number' ? value.toFixed(2) : value,
//   //                 title,
//   //               ]} 
//   //             />
//   //             <Bar dataKey={`${dataKey}Median`} fill={color}>
//   //               <ErrorBar dataKey={`${dataKey}Min`} width={4} stroke={color} />
//   //               <ErrorBar dataKey={`${dataKey}Max`} width={4} stroke={color} />
//   //             </Bar>
//   //           </ComposedChart>
//   //         </ResponsiveContainer>
//   //       </div>
//   //     </CardContent>
//   //   </Card>
//   // );
//   const BarChartComponent = ({ data, dataKey, color, title }: any) => (
//   <Card className="border-0 shadow-lg">
//     <CardHeader className="pb-2">
//       <CardTitle className="flex items-center justify-between text-sm">
//         <div className="flex items-center space-x-2">
//           <Box className="h-4 w-4" style={{ color }} />
//           <span>{title}</span>
//         </div>
//         <Button 
//           size="sm" 
//           variant="outline" 
//           onClick={() => downloadChart(`barplot-${dataKey}`, title)}
//           className="h-6 px-2 text-xs"
//         >
//           <Download className="h-3 w-3" />
//         </Button>
//       </CardTitle>
//     </CardHeader>
//     <CardContent className="pt-0">
//       <div ref={el => chartRefs.current[`barplot-${dataKey}`] = el}>
//         <ResponsiveContainer width="100%" height={200}>
//           <ComposedChart data={data} margin={{ top: 5, right: 5, left: 5, bottom: 25 }}>
//             <CartesianGrid strokeDasharray="3 3" />
//             <XAxis 
//               dataKey="gene" 
//               tick={{ fontSize: 10 }}
//               label={{ 
//                 value: 'Genes', 
//                 position: 'insideBottom', 
//                 offset: -10, 
//                 style: { fontSize: '10px' } 
//               }}
//             />
//             <YAxis 
//               tick={{ fontSize: 10 }}
//               label={{ 
//                 value: title, 
//                 angle: -90, 
//                 position: 'insideLeft', 
//                 dy: 55,
//                 style: { fontSize: '10px' } 
//               }} 
//             />
//             <Tooltip 
//               formatter={(value) => [
//                 typeof value === 'number' ? value.toFixed(2) : value,
//                 title,
//               ]} 
//             />
//             <Bar dataKey={`${dataKey}Median`} fill={color} />
//           </ComposedChart>
//         </ResponsiveContainer>
//       </div>
//     </CardContent>
//   </Card>
// );


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
//                 {/* <div>
//                   <h3 className="font-semibold text-blue-900 mb-3"> Noise Metrics</h3>
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
//                 </div> */}
//                 {/* Noise Metrics Master Toggle */}
//                 {/* <div>
//                   <div className="flex items-center space-x-2 mb-2">
//                     <Checkbox
//                       id="toggle-noise-metrics"
//                       checked={showNoiseMetrics}
//                       onCheckedChange={() => setShowNoiseMetrics(!showNoiseMetrics)}
//                     />
//                     <Label htmlFor="toggle-noise-metrics" className="font-semibold text-blue-900">
//                       Show Noise Metrics
//                     </Label>
//                   </div>

//                   {showNoiseMetrics && (
//                     <div className="space-y-2 pl-4">
//                       {Object.keys(noiseMetrics).map((metric) => (
//                         <div key={metric} className="flex items-center space-x-2">
//                           <Checkbox
//                             id={`noise-${metric}`}
//                             checked={selectedNoiseMetrics.includes(metric)}
//                             onCheckedChange={() => handleNoiseMetricToggle(metric)}
//                           />
//                           <Label htmlFor={`noise-${metric}`} className="text-sm">{metric}</Label>
//                         </div>
//                       ))}
//                     </div>
//                   )}
//                 </div> */}
//                 {/* Noise Metrics Section Toggle */}
//                 {/* <div className="border rounded-md bg-white">
//                   <button
//                     className="w-full flex justify-between items-center px-4 py-2 text-blue-900 font-semibold hover:bg-blue-50"
//                     onClick={() => setIsNoiseMetricsOpen(prev => !prev)}
//                   >
//                     <span>Noise Metrics</span>
//                     {isNoiseMetricsOpen ? (
//                       <ChevronDown className="h-4 w-4" />
//                     ) : (
//                       <ChevronRight className="h-4 w-4" />
//                     )}
//                   </button>

//                   {isNoiseMetricsOpen && (
//                     <div className="px-4 py-2 space-y-2">
//                       {Object.keys(noiseMetrics).map((metric) => (
//                         <div key={metric} className="flex items-center space-x-2">
//                           <Checkbox
//                             id={`noise-${metric}`}
//                             checked={selectedNoiseMetrics.includes(metric)}
//                             onCheckedChange={() => handleNoiseMetricToggle(metric)}
//                           />
//                           <Label htmlFor={`noise-${metric}`} className="text-sm">{metric}</Label>
//                         </div>
//                       ))}
//                     </div>
//                   )}
//                 </div> */}
//                 <div className="border rounded-md bg-white">
//               <div className="flex justify-between items-center px-4 py-2">
//                 <div className="flex items-center space-x-2">
//                   <Checkbox
//                     id="noise-metrics-master"
//                     checked={areAllNoiseSelected}
//                     // indeterminate={areSomeNoiseSelected && !areAllNoiseSelected}
//                     onCheckedChange={(checked) => toggleAllNoiseMetrics(!!checked)}
//                   />
//                   {/* <Label htmlFor="noise-metrics-master" className="text-blue-900 font-semibold">Noise Metrics</Label> */}
//                   <Label htmlFor="noise-metrics-master" className="font-bold text-blue-900 -ml-5">Noise Metrics</Label>
//                 </div>
//                 <button
//                   onClick={() => setIsNoiseMetricsOpen(prev => !prev)}
//                   className="text-blue-900"
//                 >
//                   {isNoiseMetricsOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
//                 </button>
//               </div>

//               {isNoiseMetricsOpen && (
//                 <div className="px-4 py-2 space-y-2">
//                   {allNoiseMetrics.map((metric) => (
//                     <div key={metric} className="flex items-center space-x-2">
//                       <Checkbox
//                         id={`noise-${metric}`}
//                         checked={selectedNoiseMetrics.includes(metric)}
//                         onCheckedChange={() => handleNoiseMetricToggle(metric)}
//                       />
//                       <Label htmlFor={`noise-${metric}`} className="text-sm">{metric}</Label>
//                     </div>
//                   ))}
//                 </div>
//               )}
//             </div>




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
//                 {/* Analysis Plots Section Toggle */}
//                 {/* <div className="border rounded-md bg-white">
//                   <button
//                     className="w-full flex justify-between items-center px-4 py-2 text-blue-900 font-semibold hover:bg-blue-50"
//                     onClick={() => setIsAnalysisPlotsOpen(prev => !prev)}
//                   >
//                     <span>Analysis Plots</span>
//                     {isAnalysisPlotsOpen ? (
//                       <ChevronDown className="h-4 w-4" />
//                     ) : (
//                       <ChevronRight className="h-4 w-4" />
//                     )}
//                   </button>

//                    {isAnalysisPlotsOpen && (
//                     <div className="px-4 py-2 space-y-2">
//                       <div className="flex items-center space-x-2">
//                         <Checkbox
//                           id="logDist"
//                           checked={visiblePlots.logDist}
//                           onCheckedChange={() => handlePlotToggle('logDist')}
//                         />
//                         <Label htmlFor="logDist" className="text-sm">Log Expression Distribution</Label>
//                       </div>
//                       <div className="flex items-center space-x-2">
//                         <Checkbox
//                           id="exprTrend"
//                           checked={visiblePlots.exprTrend}
//                           onCheckedChange={() => handlePlotToggle('exprTrend')}
//                         />
//                         <Label htmlFor="exprTrend" className="text-sm">Expression Trend</Label>
//                       </div>
//                       <div className="flex items-center space-x-2">
//                         <Checkbox
//                           id="tumorNormal"
//                           checked={visiblePlots.tumorNormal}
//                           onCheckedChange={() => handlePlotToggle('tumorNormal')}
//                         />
//                         <Label htmlFor="tumorNormal" className="text-sm">Tumor vs Normal</Label>
//                       </div>
//                       {genes.length > 1 && (
//                         <div className="flex items-center space-x-2">
//                           <Checkbox
//                             id="correlation"
//                             checked={visiblePlots.correlation}
//                             onCheckedChange={() => handlePlotToggle('correlation')}
//                           />
//                           <Label htmlFor="correlation" className="text-sm">Correlation Heatmap</Label>
//                         </div>
//                       )}
//                     </div>
//                   )} 
//                 </div> */}
//                 <div className="border rounded-md bg-white">
//                   <div className="flex justify-between items-center px-4 py-2">
//                     <div className="flex items-center space-x-2">
//                       <Checkbox
//                         id="analysis-plots-master"
//                         checked={areAllPlotsSelected}
//                         // indeterminate={areSomePlotsSelected && !areAllPlotsSelected}
//                         onCheckedChange={(checked) => toggleAllPlots(!!checked)}
//                       />
//                       <Label htmlFor="analysis-plots-master" className="font-bold text-blue-900 -ml-5">Analysis Plots</Label>
//                     </div>
//                     <button
//                       onClick={() => setIsAnalysisPlotsOpen(prev => !prev)}
//                       className="text-blue-900"
//                     >
//                       {isAnalysisPlotsOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
//                     </button>
//                   </div>

//                   {isAnalysisPlotsOpen && (
//                     <div className="px-4 py-2 space-y-2">
//                       {allPlotKeys.map(plotKey => (
//                         <div key={plotKey} className="flex items-center space-x-2">
//                           <Checkbox
//                             id={`plot-${plotKey}`}
//                             checked={visiblePlots[plotKey]}
//                             onCheckedChange={() => handlePlotToggle(plotKey)}
//                           />
//                           <Label htmlFor={`plot-${plotKey}`} className="text-sm">
//                             {{
//                               logDist: 'Log Expression Distribution',
//                               exprTrend: 'Expression Trend',
//                               tumorNormal: 'Tumor vs Normal'
//                               // correlation: 'Correlation Heatmap'
//                             }[plotKey]}
//                           </Label>
//                         </div>
//                       ))}
//                     </div>
//                   )}
//                 </div>

//                 {/* Plot Visibility Controls */}
//                 {/* <div> */}
//                   {/* <h3 className="font-semibold text-blue-900 mb-3">Analysis Plots</h3> */}
//                   {/* <div className="space-y-2"> */}
//                     {/* <div className="flex items-center space-x-2">
//                       <Checkbox
//                         id="linearDist"
//                         checked={visiblePlots.linearDist}
//                         onCheckedChange={() => handlePlotToggle('linearDist')}
//                       />
//                       <Label htmlFor="linearDist" className="text-sm">Linear Expression Distribution</Label>
//                     </div> */}
//                     {/* <div className="flex items-center space-x-2">
//                       <Checkbox
//                         id="logDist"
//                         checked={visiblePlots.logDist}
//                         onCheckedChange={() => handlePlotToggle('logDist')}
//                       />
//                       <Label htmlFor="logDist" className="text-sm">Log Expression Distribution</Label>
//                     </div> */}
//                     {/* <div className="flex items-center space-x-2">
//                       <Checkbox
//                         id="exprTrend"
//                         checked={visiblePlots.exprTrend}
//                         onCheckedChange={() => handlePlotToggle('exprTrend')}
//                       />
//                       <Label htmlFor="exprTrend" className="text-sm">Expression Trend</Label>
//                     </div> */}
//                     {/* <div className="flex items-center space-x-2">
//                       <Checkbox
//                         id="timeSeries"
//                         checked={visiblePlots.timeSeries}
//                         onCheckedChange={() => handlePlotToggle('timeSeries')}
//                       />
//                       <Label htmlFor="timeSeries" className="text-sm">Time Series</Label>
//                     </div> */}
//                     {/* <div className="flex items-center space-x-2">
//                       <Checkbox
//                         id="tumorNormal"
//                         checked={visiblePlots.tumorNormal}
//                         onCheckedChange={() => handlePlotToggle('tumorNormal')}
//                       />
//                       <Label htmlFor="tumorNormal" className="text-sm">Tumor vs Normal</Label>
//                     </div> */}
                    
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
//                   {/* </div> */}
//                 {/* </div> */}
//                 {/* <Button 
//                   variant="outline" 
//                   className="w-full justify-between bg-blue-600 text-white hover:bg-blue-700"
//                   onClick={handleCollapseAll}
//                 >
//                   {isAllCollapsed ? 'Unselect All' : 'Select All'}
//                   {isAllCollapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
//                 </Button> */}
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
//                   <div className="flex flex-wrap gap-2">
//                     {genes.map(gene => (
//                       <Badge key={gene} variant="secondary" className="text-sm">
//                         {gene}
//                       </Badge>
//                     ))}
//                   </div>{
//                   /* Download Buttons on the right */}
//                   <div className="flex space-x-4">
//                     <Button onClick={() => downloadData('csv')} variant="outline" size="sm">
//                       <Download className="h-4 w-4 mr-2" /> Download CSV
//                     </Button>
//                     {/* <Button onClick={() => downloadData('json')} variant="outline" size="sm">
//                       <Download className="h-4 w-4 mr-2" /> Download JSON
//                     </Button> */}
//                   </div>
//                 </div>
              
//               <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
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
//               </div>
//             </div>



//             {/* BarChartComponents for Statistical Metrics */}
//             {(visiblePlots.cv || visiblePlots.stdDev || visiblePlots.mad) && (
//               <div className="mb-8">
//                 <h3 className="text-2xl font-bold text-blue-900 mb-4">Statistical Metrics</h3>
//                 {/* <div className="flex gap-4 mb-6">
//                 <Button 
//                   variant={sampleGroup === 'normal' ? 'default' : 'outline'}
//                   onClick={() => setSampleGroup('normal')}
//                 >
//                   Normal
//                 </Button>
//                 <Button 
//                   variant={sampleGroup === 'tumor' ? 'default' : 'outline'}
//                   onClick={() => setSampleGroup('tumor')}
//                 >
//                   Tumor
//                 </Button>
//                 <Button 
//                   variant={sampleGroup === 'combined' ? 'default' : 'outline'}
//                   onClick={() => setSampleGroup('combined')}
//                 >
//                   Combined
//                 </Button>
//               </div> */}
//               <div className="flex gap-4 mb-6">
//                 {['normal', 'tumor', 'combined'].map(group => (
//                   <Button
//                     key={group}
//                     // variant={selectedGroups.includes(group) ? 'default' : 'outline'}
//                     className={`text-white ${
//                       selectedGroups.includes(group)
//                         ? 'bg-blue-600 hover:bg-blue-700'
//                         : 'bg-white text-blue-600 border border-blue-600 hover:bg-blue-50'
//                     }`}
//                     onClick={() => toggleGroup(group)}
//                   >
//                     {group.charAt(0).toUpperCase() + group.slice(1)}
//                   </Button>
//                 ))}
//               </div>



//                 <div className="grid lg:grid-cols-3 md:grid-cols-2 gap-4">
//                   {/* {visiblePlots.cv && (
//                     <BarChartComponent 
//                       data={resultsData} 
//                       dataKey="cv" 
//                       color="#2563eb" 
//                       title="Coefficient of Variation" 
                      
//                     />
//                   )} */}
//                   {/* {visiblePlots.stdDev && (
//                     <BarChartComponent 
//                       data={resultsData} 
//                       dataKey="stdDev" 
//                       color="#ca8a04" 
//                       title="Standard Deviation" 
//                     />
//                   )} */}
//                   {/* {visiblePlots.variance && (
//                     <BarChartComponent 
//                       data={resultsData} 
//                       dataKey="variance" 
//                       color="#059669" 
//                       title="Variance" 
//                     />
//                   )} */}
//                   {/* {visiblePlots.mad && (
//                     <BarChartComponent
//                       data={resultsData} 
//                       dataKey="mad" 
//                       color="#7c3aed" 
//                       title="Mean Absolute Deviation" 
//                     />
//                   )} */}
//                   {/* {visiblePlots.depth && (
//                     <BarChartComponentBar 
//                       data={resultsData} 
//                       dataKey="depth" 
//                       color="#dc2626" 
//                       title="Depth" 
//                     />
//                   )}
//                   {visiblePlots.depth2 && (
//                     <BarChartComponentBar 
//                       data={resultsData} 
//                       dataKey="depth2" 
//                       color="#ea580c" 
//                       title="Depth2" 
//                     />
//                   )} */}
//                   {['cv', 'stdDev', 'mad'].map(metric =>
//                     selectedGroups.map(group => (
//                       <BarChartComponent
//                         key={`${metric}_${group}`}
//                         data={filteredData}
//                         dataKey={`${metric}_${group}`}
//                         color={
//                           group === 'normal' ? '#10b981' :
//                           group === 'tumor' ? '#ef4444' :
//                           '#3b82f6'
//                         }
//                         title={`${metric.toUpperCase()} — ${group.charAt(0).toUpperCase() + group.slice(1)}`}
//                       />
//                     ))
//                   )}

//                 </div>
//               </div>
//             )}
//           </div>
//         </div>
//       </div>
//       <footer className="bg-gray-100 text-gray-700 text-m mt-10 p-8 text-center border-t border-gray-300">
//       <p className=" text-blue-700 mt-4">© 2025 BIRL — This website is free and open to all users and there is no login requirement.</p>
//       <p className="font-semibold text-blue-700 mt-4">Biomedical Informatics & Engineering Research Laboratory, Lahore University of Management Sciences</p>
//       <p className=" text-blue-700 mt-4">DHA, Lahore, Pakistan</p>
//       <p className=" text-blue-700 mt-4">+92 (42) 3560 8352</p>
//     </footer>
//     </div>
//   );
// };

// export default GeneResults;
import { useMemo } from "react";
import { useState, useEffect, useRef } from "react";
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
  Bar
} from "recharts";

const GeneResults = () => {
  const [searchParams] = useSearchParams();
  const cancerType = searchParams.get('cancerType') || '';
  const genes = searchParams.get('genes')?.split(',') || [];
  const [selectedGroups, setSelectedGroups] = useState(['normal']);
  const [isNoiseMetricsOpen, setIsNoiseMetricsOpen] = useState(false);
  const [isAnalysisPlotsOpen, setIsAnalysisPlotsOpen] = useState(false);
  const [normalizationMethod, setNormalizationMethod] = useState('tpm');

  const [selectedNoiseMetrics, setSelectedNoiseMetrics] = useState(['CV']);
  const [resultsData, setResultsData] = useState([]);
  const chartRefs = useRef({});
  // const cleanedGeneSymbols = genes
  // .map(g => g.trim().toUpperCase())
  // .filter(Boolean); // removes empty strings
  const cleanedGeneSymbols = useMemo(() => (
    genes.map(g => g.trim().toUpperCase()).filter(Boolean)
  ), [genes]);

  
  useEffect(() => {
  if (!["tpm", "fpkm", "fpkm_uq"].includes(normalizationMethod)) {
    console.error("Invalid normalization method:", normalizationMethod);
    setNormalizationMethod('tpm'); // or fallback
  }
  }, [normalizationMethod]);

  const noiseMetrics = {
    'CV': 'cv',
    'Standard Deviation': 'stdDev',
    'MAD': 'mad'
  };

  // Fetch data from Supabase
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch cancer type ID
        const { data: cancerTypeData, error: cancerTypeError } = await supabase
          .from('cancer_types')
          .select('id')
          .eq('tcga_code', cancerType)
          .single();

        if (cancerTypeError) throw cancerTypeError;
        const cancerTypeId = cancerTypeData.id;

        // Fetch gene IDs
        const { data: geneData, error: geneError } = await supabase
          .from('genes')
          .select('id, gene_symbol')
          .in('gene_symbol', cleanedGeneSymbols);

        if (geneError) throw geneError;
        const geneMap = Object.fromEntries(geneData.map(g => [g.id, g.gene_symbol]));
        const geneIds = geneData.map(g => g.id);

        // Fetch samples
        const { data: samplesData, error: samplesError } = await supabase
          .from('samples')
          .select('id, sample_type')
          .eq('cancer_type_id', cancerTypeId);

        if (samplesError) throw samplesError;
        const sampleMap = Object.fromEntries(samplesData.map(s => [s.id, s.sample_type]));
        const sampleIds = samplesData.map(s => s.id);
        console.log("Gene IDs:", geneIds); // should be an array of gene IDs
        console.log("Sample IDs:", sampleIds); // should be an array of many sample IDs
        // console.log("normalization method:", normalizationMethod)
        // Fetch expression values
        const { data: expressionData, error: expressionError } = await supabase
          .from('expression_values')
          .select(`gene_id, sample_id, ${normalizationMethod}`)
          .in('gene_id', geneIds)
          .in('sample_id', sampleIds) as any;
        console.log("expression:",expressionData)
        console.log("Expression data total entries:", expressionData.length);
        console.log("Unique gene_ids in expressionData:", [...new Set(expressionData.map(e => e.gene_id))]);

        if (expressionError) throw expressionError;
      const processedData = geneData.map(gene => {
        const normKey = normalizationMethod.toLowerCase();

        // Filter expressions for this gene only
        const geneExpressions = expressionData.filter(e => e.gene_id === gene.id);

        // Separate tumor and normal values by sample type
        const tumorValues = geneExpressions
          .filter(e => sampleMap[e.sample_id]?.toLowerCase() === 'tumor')
          .map(e => e[normKey])
          .filter(v => v !== null && v !== undefined);

        const normalValues = geneExpressions
          .filter(e => sampleMap[e.sample_id]?.toLowerCase() === 'normal')
          .map(e => e[normKey])
          .filter(v => v !== null && v !== undefined);

        const combinedValues = [...tumorValues, ...normalValues];

        // Median helper
        const calculateStats = (values) => {
          if (values.length === 0) return { cv: 0, stdDev: 0, mad: 0, median: 0 };

          const sorted = [...values].sort((a, b) => a - b);
          const mid = Math.floor(sorted.length / 2);
          const median = sorted.length % 2 === 0
            ? (sorted[mid - 1] + sorted[mid]) / 2
            : sorted[mid];

          const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
          const stdDev = values.length > 1
            ? Math.sqrt(values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / (values.length - 1))
            : 0;
          const cv = mean !== 0 ? (stdDev / mean) * 100 : 0;
          const mad = values.reduce((sum, v) => sum + Math.abs(v - median), 0) / values.length;

          return { cv, stdDev, mad, median };
        };

        const stats_tumor = calculateStats(tumorValues);
        const stats_normal = calculateStats(normalValues);
        const stats_combined = calculateStats(combinedValues);

        return {
          gene: gene.gene_symbol,
          tumorValues,
          normalValues,
          combinedValues,
          cv_tumor: stats_tumor.cv,
          stdDev_tumor: stats_tumor.stdDev,
          mad_tumor: stats_tumor.mad,
          median_tumor: stats_tumor.median,
          cv_normal: stats_normal.cv,
          stdDev_normal: stats_normal.stdDev,
          mad_normal: stats_normal.mad,
          median_normal: stats_normal.median,
          cv_combined: stats_combined.cv,
          stdDev_combined: stats_combined.stdDev,
          mad_combined: stats_combined.mad,
          median_combined: stats_combined.median,
          tumorSamples: tumorValues.length,
          normalSamples: normalValues.length
        };
      });



        setResultsData(processedData);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    if (genes.length > 0 && cancerType) {
      fetchData();
    }
  }, [genes, cancerType, normalizationMethod]);

  const toggleGroup = (group) => {
    setSelectedGroups(prev =>
      prev.includes(group)
        ? prev.filter(g => g !== group)
        : [...prev, group]
    );
  };

  const handleNoiseMetricToggle = (metric) => {
    setSelectedNoiseMetrics(prev =>
      prev.includes(metric)
        ? prev.filter(m => m !== metric)
        : [...prev, metric]
    );
  };

  const getFilteredResults = () => {
    return resultsData.map(gene => {
      const filteredGene = { gene };
      selectedGroups.forEach(group => {
        if (group === 'combined') {
          filteredGene['cv_combined'] = gene.cv_combined;
          filteredGene['mad_combined'] = gene.mad_combined;
          filteredGene['stdDev_combined'] = gene.stdDev_combined;
          filteredGene['median_combined'] = gene.median_combined;
        } else if (group === 'tumor') {
          filteredGene['cv_tumor'] = gene.cv_tumor;
          filteredGene['mad_tumor'] = gene.mad_tumor;
          filteredGene['stdDev_tumor'] = gene.stdDev_tumor;
          filteredGene['median_tumor'] = gene.median_tumor;
        } else if (group === 'normal') {
          filteredGene['cv_normal'] = gene.cv_normal;
          filteredGene['mad_normal'] = gene.mad_normal;
          filteredGene['stdDev_normal'] = gene.stdDev_normal;
          filteredGene['median_normal'] = gene.median_normal;
        }
      });
      return filteredGene;
    });
  };

  // const filteredData = getFilteredResults();
  const filteredData = useMemo(() => getFilteredResults(), [
  resultsData,
  selectedGroups,
  selectedNoiseMetrics,
  ]);
  useEffect(() => {
  console.log("Re-rendering charts due to data change.");
  }, [filteredData]);
  const allNoiseMetrics = Object.keys(noiseMetrics);
  const areAllNoiseSelected = allNoiseMetrics.every(metric => selectedNoiseMetrics.includes(metric));

  const toggleAllNoiseMetrics = (checked) => {
    setSelectedNoiseMetrics(checked ? allNoiseMetrics : []);
  };

  // const visiblePlots = {
  //   cv: selectedNoiseMetrics.includes('CV'),
  //   stdDev: selectedNoiseMetrics.includes('Standard Deviation'),
  //   mad: selectedNoiseMetrics.includes('MAD'),
  //   logDist: false,
  //   exprTrend: false,
  //   tumorNormal: false
  // };
  const [visiblePlots, setVisiblePlots] = useState({
  cv: true,
  stdDev: true,
  mad: true,
  logDist: false,
  exprTrend: false,
  tumorNormal: false
});


  const allPlotKeys = ['logDist', 'exprTrend', 'tumorNormal'];
  const areAllPlotsSelected = allPlotKeys.every(plot => visiblePlots[plot]);
  // const toggleAllPlots = (checked) => {
  //   const updated = { ...visiblePlots };
  //   allPlotKeys.forEach(plot => {
  //     updated[plot] = checked;
  //   });
  //   // setVisiblePlots(updated);
  // };

  // const handlePlotToggle = (plotKey) => {
  //   // setVisiblePlots(prev => ({
  //   //   ...prev,
  //   //   [plotKey]: !prev[plotKey]
  //   // }));
  // };
  const toggleAllPlots = (checked) => {
  setVisiblePlots(prev => {
    const updated = { ...prev };
    allPlotKeys.forEach(plot => {
      updated[plot] = checked;
    });
    return updated;
  });
};

const handlePlotToggle = (plotKey) => {
  setVisiblePlots(prev => ({
    ...prev,
    [plotKey]: !prev[plotKey],
  }));
};


  const applyFilters = () => {
    console.log('Applying filters:', {
      normalizationMethod,
      selectedNoiseMetrics,
      selectedGroups
    });
  };

  const getCancerTypeLabel = (type) => {
    const labels = {
      'BRCA': 'Breast Cancer (BRCA)',
      'LUAD': 'Lung Cancer (LUAD)',
      'PRAD': 'Prostate Cancer (PRAD)',
      'COAD': 'Colorectal Cancer (COAD)',
      'LIHC': 'Liver Cancer (LIHC)',
      'KIRC': 'Kidney Cancer (KIRC)',
      'STAD': 'Stomach Cancer (STAD)',
      'OV': 'Ovarian Cancer (OV)',
      'BLCA': 'Bladder Cancer (BLCA)'
    };
    return labels[type] || type;
  };

  const downloadChart = (chartKey, chartName) => {
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

  const downloadData = (format) => {
    const data = resultsData;
    let content = '';
    let filename = `gene_analysis_${cancerType}_${Date.now()}`;

    if (format === 'csv') {
      const headers = Object.keys(data[0]).join(',');
      const rows = data.map(row => Object.values(row).join(','));
      content = [headers, ...rows].join('\n');
      filename += '.csv';
    } else {
      content = JSON.stringify(data, null, 2);
      filename += '.json';
    }

    const blob = new Blob([content], { type: format === 'csv' ? 'text/csv' : 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const totalTumorSamples = resultsData.reduce((sum, gene) =>  gene.tumorSamples, 0);
  const totalNormalSamples = resultsData.reduce((sum, gene) =>  gene.normalSamples, 0);

  const BarChartComponent = ({ data, dataKey, color, title }) => (
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
        <div ref={el => chartRefs.current[`barplot-${dataKey}`] = el}>
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
                  dy: 55,
                  style: { fontSize: '10px' } 
                }} 
              />
              <Tooltip 
                formatter={(value) => [
                  typeof value === 'number' ? value.toFixed(2) : value,
                  title,
                ]} 
              />
              <Bar dataKey={`${dataKey}`} fill={color} />
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
              <h1 className="text-2xl font-bold text-blue-900">Gene Analysis Results</h1>
            </div>
            <nav className="flex space-x-6">
              <Link to="/" className="text-blue-700 hover:text-blue-600 font-medium transition-colors">
                Home
              </Link>
              <Link to="/gene-analysis" className="text-blue-500 font-medium">
                Gene Analysis
              </Link>
              <Link to="/pathway-analysis" className="text-blue-700 hover:text-blue-600 font-medium transition-colors">
                Pathway Analysis
              </Link>
              <Link to="/tumour-analysis" className="text-blue-700 hover:text-blue-600 font-medium transition-colors">
                Tumor Analysis
              </Link>
            </nav>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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

                <div className="border rounded-md bg-white">
                  <div className="flex justify-between items-center px-4 py-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="noise-metrics-master"
                        checked={areAllNoiseSelected}
                        onCheckedChange={(checked) => toggleAllNoiseMetrics(!!checked)}
                      />
                      <Label htmlFor="noise-metrics-master" className="font-bold text-blue-900 -ml-5">Noise Metrics</Label>
                    </div>
                    <button
                      onClick={() => setIsNoiseMetricsOpen(prev => !prev)}
                      className="text-blue-900"
                    >
                      {isNoiseMetricsOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                    </button>
                  </div>
                  {isNoiseMetricsOpen && (
                    <div className="px-4 py-2 space-y-2">
                      {allNoiseMetrics.map((metric) => (
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
                  )}
                </div>

                <div className="border rounded-md bg-white">
                  <div className="flex justify-between items-center px-4 py-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="analysis-plots-master"
                        checked={areAllPlotsSelected}
                        onCheckedChange={(checked) => toggleAllPlots(!!checked)}
                      />
                      <Label htmlFor="analysis-plots-master" className="font-bold text-blue-900 -ml-5">Analysis Plots</Label>
                    </div>
                    <button
                      onClick={() => setIsAnalysisPlotsOpen(prev => !prev)}
                      className="text-blue-900"
                    >
                      {isAnalysisPlotsOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                    </button>
                  </div>
                  {isAnalysisPlotsOpen && (
                    <div className="px-4 py-2 space-y-2">
                      {allPlotKeys.map(plotKey => (
                        <div key={plotKey} className="flex items-center space-x-2">
                          <Checkbox
                            id={`plot-${plotKey}`}
                            checked={visiblePlots[plotKey]}
                            onCheckedChange={() => handlePlotToggle(plotKey)}
                          />
                          <Label htmlFor={`plot-${plotKey}`} className="text-sm">
                            {{
                              logDist: 'Log Expression Distribution',
                              exprTrend: 'Expression Trend',
                              tumorNormal: 'Tumor vs Normal'
                            }[plotKey]}
                          </Label>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <Button onClick={applyFilters} className="w-full bg-blue-600 hover:bg-blue-700">
                  Apply
                </Button>
              </CardContent>
            </Card>
          </div>

          <div className="flex-1">
            <Link to="/gene-analysis" className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-6 transition-colors">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Gene Analysis
            </Link>

            <div className="mb-8">
              <h2 className="text-4xl font-bold text-blue-900 mb-2">
                Results for {getCancerTypeLabel(cancerType)}
              </h2>
              <div className="flex items-center justify-between mb-4">
                <div className="flex flex-wrap gap-2">
                  {genes.map(gene => (
                    <Badge key={gene} variant="secondary" className="text-sm">
                      {gene}
                    </Badge>
                  ))}
                </div>
                <div className="flex space-x-4">
                  <Button onClick={() => downloadData('csv')} variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-2" /> Download CSV
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <Card className="border-0 shadow-lg">
                  <CardContent className="p-4 text-center">
                    <Users className="h-6 w-6 text-blue-600 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-blue-600">{totalTumorSamples}</div>
                    <div className="text-xs text-gray-600">Total Tumor Samples</div>
                  </CardContent>
                </Card>
                <Card className="border-0 shadow-lg">
                  <CardContent className="p-4 text-center">
                    <Users className="h-6 w-6 text-green-600 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-green-600">{totalNormalSamples}</div>
                    <div className="text-xs text-gray-600">Total Normal Samples</div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {(visiblePlots.cv || visiblePlots.stdDev || visiblePlots.mad) && (
              <div className="mb-8">
                <h3 className="text-2xl font-bold text-blue-900 mb-4">Statistical Metrics</h3>
                <div className="flex gap-4 mb-6">
                  {['normal', 'tumor', 'combined'].map(group => (
                    <Button
                      key={group}
                      className={`text-white ${
                        selectedGroups.includes(group)
                          ? 'bg-blue-600 hover:bg-blue-700'
                          : 'bg-white text-blue-600 border border-blue-600 hover:bg-blue-50'
                      }`}
                      onClick={() => toggleGroup(group)}
                    >
                      {group.charAt(0).toUpperCase() + group.slice(1)}
                    </Button>
                  ))}
                </div>

                <div className="grid lg:grid-cols-3 md:grid-cols-2 gap-4">
                  {['cv', 'stdDev', 'mad'].map(metric =>
                    selectedGroups.map(group => (
                      <BarChartComponent
                        key={`${metric}_${group}`}
                        data={filteredData}
                        dataKey={`${metric}_${group}`}
                        color={
                          group === 'normal' ? '#10b981' :
                          group === 'tumor' ? '#ef4444' :
                          '#3b82f6'
                        }
                        title={`${metric.toUpperCase()} — ${group.charAt(0).toUpperCase() + group.slice(1)}`}
                      />
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      <footer className="bg-gray-100 text-gray-700 text-m mt-10 p-8 text-center border-t border-gray-300">
        <p className="text-blue-700 mt-4">© 2025 BIRL — This website is free and open to all users and there is no login requirement.</p>
        <p className="font-semibold text-blue-700 mt-4">Biomedical Informatics & Engineering Research Laboratory, Lahore University of Management Sciences</p>
        <p className="text-blue-700 mt-4">DHA, Lahore, Pakistan</p>
        <p className="text-blue-700 mt-4">+92 (42) 3560 8352</p>
      </footer>
    </div>
  );
};

export default GeneResults;