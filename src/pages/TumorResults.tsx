// // // // import { useState, useEffect, useRef } from "react";
// // // // import { useSearchParams, Link } from "react-router-dom";
// // // // import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// // // // import { Button } from "@/components/ui/button";
// // // // import { Badge } from "@/components/ui/badge";
// // // // import { ArrowLeft, Download, Box, ChevronRight, ChevronDown, Users } from "lucide-react";
// // // // import { Checkbox } from "@/components/ui/checkbox";
// // // // import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
// // // // import { Label } from "@/components/ui/label";
// // // // import { 
// // // //   ResponsiveContainer, 
// // // //   XAxis, 
// // // //   YAxis, 
// // // //   CartesianGrid, 
// // // //   Tooltip,
// // // //   ComposedChart,
// // // //   Bar,
// // // //   ErrorBar
// // // // } from "recharts";

// // // // const TumourResults = () => {
// // // //   const [searchParams] = useSearchParams();
// // // //   const cancerType = searchParams.get('cancerType') || '';
// // // // //   const genes = searchParams.get('genes')?.split(',') || [];
  
// // // //   // Filter states
// // // //   const [normalizationMethod, setNormalizationMethod] = useState('TPM');
// // // //   const [selectedNoiseMetrics, setSelectedNoiseMetrics] = useState<string[]>(['CV']); // Allow multiple selections
// // // //   const [selectedSites, setSelectedSites] = useState(['Breast']);
// // // //   const [selectedAnnotations, setSelectedAnnotations] = useState<string[]>([]);
// // // //   const [isAllCollapsed, setIsAllCollapsed] = useState(false);
// // // //   const [visiblePlots, setVisiblePlots] = useState({
// // // //     cv: true,
// // // //     stdDev: false,
// // // //     variance: false,
// // // //     mad: false,
// // // //     depth: false,
// // // //     depth2: false,
// // // //     linearDist: true,
// // // //     logDist: true,
// // // //     exprTrend: true,
// // // //     timeSeries: true,
// // // //     tumorNormal: true,
// // // //     correlation: true,
// // // //     detailedMetrics: true
// // // //   });

// // // //   // Refs for chart containers
// // // //   const chartRefs = useRef<{[key: string]: any}>({});

// // // //   // // Primary sites options
// // // //   // const primarySites = [
// // // //   //   'Bladder', 'Brain', 'Breast', 'Colorectal', 'Liver', 'Lung', 'Pancreas', 'Thymus'
// // // //   // ];

// // // //   // Noise metric options
// // // //   const noiseMetrics = {
// // // //     'CV': 'cv',
// // // //     'CV2': 'cv',
// // // //     'Standard Deviation': 'stdDev',
// // // //     'Variance': 'variance',
// // // //     'MAD': 'mad',
// // // //     'DEPTH2': 'depth2',
// // // //     'DEPTH - tITH': 'depth'
// // // //   };

// // // //   // Handle noise metric selection
// // // //   const handleNoiseMetricToggle = (metric: string) => {
// // // //     setSelectedNoiseMetrics(prev => 
// // // //       prev.includes(metric) 
// // // //         ? prev.filter(m => m !== metric)
// // // //         : [...prev, metric]
// // // //     );
// // // //   };

// // // // //   // Handle site selection
// // // // //   const handleSiteToggle = (site: string) => {
// // // // //     setSelectedSites(prev => 
// // // // //       prev.includes(site) 
// // // // //         ? prev.filter(s => s !== site)
// // // // //         : [...prev, site]
// // // // //     );
// // // // //   };

// // // //   // const handleSelectAllSites = () => {
// // // //   //   setSelectedSites(primarySites);
// // // //   // };

// // // // //   const handleDeselectAllSites = () => {
// // // // //     setSelectedSites([]);
// // // // //   };

// // // //   // // Handle annotation selection
// // // //   // const handleSelectAllAnnotations = () => {
// // // //   //   setSelectedAnnotations(['annotation1', 'annotation2']);
// // // //   // };

// // // //   // const handleDeselectAllAnnotations = () => {
// // // //   //   setSelectedAnnotations([]);
// // // //   // };

// // // //   // Handle collapse all toggle
// // // //   const handleCollapseAll = () => {
// // // //     setIsAllCollapsed(!isAllCollapsed);
// // // //     setVisiblePlots(prev => {
// // // //       const newPlots = { ...prev };
// // // //       Object.keys(newPlots).forEach(key => {
// // // //         newPlots[key] = !isAllCollapsed;
// // // //       });
// // // //       return newPlots;
// // // //     });
// // // //   };

// // // //   // Handle individual plot visibility
// // // //   const handlePlotToggle = (plotKey: string) => {
// // // //     setVisiblePlots(prev => ({
// // // //       ...prev,
// // // //       [plotKey]: !prev[plotKey]
// // // //     }));
// // // //   };

// // // //   const applyFilters = () => {
// // // //     console.log('Applying filters:', {
// // // //       normalizationMethod,
// // // //       selectedNoiseMetrics,
// // // //       selectedSites,
// // // //       selectedAnnotations
// // // //     });
// // // //     // Update visible plots based on selected noise metrics
// // // //     setVisiblePlots(prev => ({
// // // //       ...prev,
// // // //       cv: selectedNoiseMetrics.includes('CV') || selectedNoiseMetrics.includes('CV2'),
// // // //       stdDev: selectedNoiseMetrics.includes('Standard Deviation'),
// // // //       variance: selectedNoiseMetrics.includes('Variance'),
// // // //       mad: selectedNoiseMetrics.includes('MAD'),
// // // //       depth: selectedNoiseMetrics.includes('DEPTH - tITH'),
// // // //       depth2: selectedNoiseMetrics.includes('DEPTH2')
// // // //     }));
// // // //     console.log('Visible plots after filters:', visiblePlots);
// // // //   };

// // // //   // Generate mock data for boxplots
// // // //   const generateBoxplotData = (genes: string[]) => {
// // // //     const data = genes.map(gene => {
// // // //       const baseValue = Math.random() * 100;
// // // //       return {
// // // //         gene,
// // // //         cv: Math.random() * 50 + 10,
// // // //         cvQ1: baseValue * 0.8,
// // // //         cvQ3: baseValue * 1.2,
// // // //         cvMin: baseValue * 0.6,
// // // //         cvMax: baseValue * 1.4,
// // // //         cvMedian: baseValue,
// // // //         stdDev: Math.random() * 100 + 20,
// // // //         stdDevQ1: baseValue * 0.7,
// // // //         stdDevQ3: baseValue * 1.3,
// // // //         stdDevMin: baseValue * 0.5,
// // // //         stdDevMax: baseValue * 1.5,
// // // //         stdDevMedian: baseValue,
// // // //         variance: Math.random() * 1000 + 100,
// // // //         varianceQ1: baseValue * 0.75,
// // // //         varianceQ3: baseValue * 1.25,
// // // //         varianceMin: baseValue * 0.55,
// // // //         varianceMax: baseValue * 1.45,
// // // //         varianceMedian: baseValue,
// // // //         mad: Math.random() * 80 + 15,
// // // //         madQ1: baseValue * 0.85,
// // // //         madQ3: baseValue * 1.15,
// // // //         madMin: baseValue * 0.65,
// // // //         madMax: baseValue * 1.35,
// // // //         madMedian: baseValue,
// // // //         depth: Math.random() * 50 + 10,
// // // //         depthQ1: baseValue * 0.9,
// // // //         depthQ3: baseValue * 1.1,
// // // //         depthMin: baseValue * 0.7,
// // // //         depthMax: baseValue * 1.3,
// // // //         depthMedian: baseValue,
// // // //         depth2: Math.random() * 30 + 5,
// // // //         depth2Q1: baseValue * 0.8,
// // // //         depth2Q3: baseValue * 1.2,
// // // //         depth2Min: baseValue * 0.6,
// // // //         depth2Max: baseValue * 1.4,
// // // //         depth2Median: baseValue,
// // // //         tumorSamples: Math.floor(Math.random() * 200) + 100,
// // // //         normalSamples: Math.floor(Math.random() * 50) + 20
// // // //       };
// // // //     });
// // // //     console.log('Generated boxplot data:', data);
// // // //     return data;
// // // //   };

// // // // //   const [resultsData, setResultsData] = useState(generateBoxplotData(genes));

// // // // //   // Log genes to ensure they are not empty
// // // // //   useEffect(() => {
// // // // //     console.log('Genes:', genes);
// // // // //     if (genes.length === 0) {
// // // // //       console.warn('No genes provided, boxplots may not render.');
// // // // //     }
// // // // //   }, [genes]);

// // // //   const getCancerTypeLabel = (type: string) => {
// // // //     const labels: { [key: string]: string } = {
// // // //       breast: "Breast Cancer (BRCA)",
// // // //       lung: "Lung Cancer (LUAD)",
// // // //       prostate: "Prostate Cancer (PRAD)",
// // // //       colorectal: "Colorectal Cancer (COAD)",
// // // //       liver: "Liver Cancer (LIHC)",
// // // //       kidney: "Kidney Cancer (KIRC)",
// // // //       stomach: "Stomach Cancer (STAD)",
// // // //       ovarian: "Ovarian Cancer (OV)"
// // // //     };
// // // //     return labels[type] || type;
// // // //   };

// // // //   const downloadChart = (chartKey: string, chartName: string) => {
// // // //     const chartElement = chartRefs.current[chartKey];
// // // //     if (chartElement) {
// // // //       const svg = chartElement.querySelector('svg');
// // // //       if (svg) {
// // // //         const canvas = document.createElement('canvas');
// // // //         const ctx = canvas.getContext('2d');
// // // //         const img = new Image();
        
// // // //         const svgData = new XMLSerializer().serializeToString(svg);
// // // //         const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
// // // //         const url = URL.createObjectURL(svgBlob);
        
// // // //         img.onload = function() {
// // // //           canvas.width = img.width || 800;
// // // //           canvas.height = img.height || 400;
// // // //           ctx?.drawImage(img, 0, 0);
          
// // // //           canvas.toBlob((blob) => {
// // // //             if (blob) {
// // // //               const link = document.createElement('a');
// // // //               link.download = `${chartName.replace(/\s+/g, '_').toLowerCase()}_${Date.now()}.png`;
// // // //               link.href = URL.createObjectURL(blob);
// // // //               link.click();
// // // //               URL.revokeObjectURL(link.href);
// // // //             }
// // // //           });
// // // //           URL.revokeObjectURL(url);
// // // //         };
// // // //         img.src = url;
// // // //       }
// // // //     }
// // // //   };

// // // // //   const downloadData = (format: 'csv' | 'json') => {
// // // // //     // const data = resultsData;
// // // // //     let content = '';
// // // // //     let filename = `tumor_analysis_${cancerType}_${Date.now()}`;

// // // // //     if (format === 'csv') {
// // // // //       const headers = Object.keys(data[0]).join(',');
// // // // //       const rows = data.map(row => Object.values(row).join(','));
// // // // //       content = [headers, ...rows].join('\n');
// // // // //       filename += '.csv';
// // // // //     } else {
// // // // //       content = JSON.stringify(data, null, 2);
// // // // //       filename += '.json';
// // // // //     }

// // // // //     const blob = new Blob([content], { type: format === 'csv' ? 'text/csv' : 'application/json' });
// // // // //     const url = URL.createObjectURL(blob);
// // // // //     const a = document.createElement('a');
// // // // //     a.href = url;
// // // // //     a.download = filename;
// // // // //     a.click();
// // // // //     URL.revokeObjectURL(url);
// // // // //   };

// // // // //   const totalTumorSamples = resultsData.reduce((sum, gene) => sum + gene.tumorSamples, 0);
// // // // //   const totalNormalSamples = resultsData.reduce((sum, gene) => sum + gene.normalSamples, 0);

// // // //   const colors = ['#2563eb', '#059669', '#dc2626', '#7c3aed', '#ea580c'];

// // // //   // Custom boxplot component
// // // //   const BoxplotBar = ({ data, dataKey, color, title }: any) => (
// // // //     <Card className="border-0 shadow-lg">
// // // //       <CardHeader className="pb-2">
// // // //         <CardTitle className="flex items-center justify-between text-sm">
// // // //           <div className="flex items-center space-x-2">
// // // //             <Box className="h-4 w-4" style={{ color }} />
// // // //             <span>{title}</span>
// // // //           </div>
// // // //           <Button 
// // // //             size="sm" 
// // // //             variant="outline" 
// // // //             onClick={() => downloadChart(`boxplot-${dataKey}`, title)}
// // // //             className="h-6 px-2 text-xs"
// // // //           >
// // // //             <Download className="h-3 w-3" />
// // // //           </Button>
// // // //         </CardTitle>
// // // //       </CardHeader>
// // // //       <CardContent className="pt-0">
// // // //         <div ref={el => chartRefs.current[`boxplot-${dataKey}`] = el}>
// // // //           <ResponsiveContainer width="100%" height={200}>
// // // //             <ComposedChart data={data} margin={{ top: 5, right: 5, left: 5, bottom: 25 }}>
// // // //               <CartesianGrid strokeDasharray="3 3" />
// // // //               <XAxis 
// // // //                 dataKey="sample" 
// // // //                 tick={{ fontSize: 10 }}
// // // //                 label={{ 
// // // //                   value: 'Genes', 
// // // //                   position: 'insideBottom', 
// // // //                   offset: -10, 
// // // //                   style: { fontSize: '10px' } 
// // // //                 }}
// // // //               />
// // // //               <YAxis 
// // // //                 tick={{ fontSize: 10 }}
// // // //                 label={{ 
// // // //                   value: title, 
// // // //                   angle: -90, 
// // // //                   position: 'insideLeft', 
// // // //                   style: { fontSize: '10px' } 
// // // //                 }} 
// // // //               />
// // // //               <Tooltip 
// // // //                 formatter={(value) => [
// // // //                   typeof value === 'number' ? value.toFixed(2) : value,
// // // //                   title,
// // // //                 ]} 
// // // //               />
// // // //               <Bar dataKey={`${dataKey}Median`} fill={color}>
// // // //                 <ErrorBar dataKey={`${dataKey}Min`} width={4} stroke={color} />
// // // //                 <ErrorBar dataKey={`${dataKey}Max`} width={4} stroke={color} />
// // // //               </Bar>
// // // //             </ComposedChart>
// // // //           </ResponsiveContainer>
// // // //         </div>
// // // //       </CardContent>
// // // //     </Card>
// // // //   );

// // // //   return (
// // // //     <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-yellow-50">
// // // //       <header className="bg-white shadow-sm border-b border-blue-100">
// // // //         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
// // // //           <div className="flex items-center justify-between">
// // // //             <div className="flex items-center space-x-3">
// // // //               <h1 className="text-2xl font-bold text-blue-900">Gene Analysis Results</h1>
// // // //             </div>
// // // //             <nav className="flex space-x-6">
// // // //               <Link to="/" className="text-blue-700 hover:text-blue-600 font-medium transition-colors">
// // // //                 Home
// // // //               </Link>
// // // //               <Link to="/gene-analysis" className="text-blue-500 font-medium">
// // // //                 Gene Analysis
// // // //               </Link>
// // // //               <Link to="/pathway-analysis" className="text-blue-700 hover:text-blue-600 font-medium transition-colors">
// // // //                 Pathway Analysis
// // // //               </Link>
// // // //               <Link to="/tumour-analysis" className="text-blue-700 hover:text-blue-600 font-medium transition-colors">
// // // //                 Tumor Analysis
// // // //               </Link>
// // // //             </nav>
// // // //           </div>
// // // //         </div>
// // // //       </header>

// // // //       <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
// // // //         <div className="flex gap-6">
// // // //           {/* Left Sidebar - Filters */}
// // // //           <div className="w-80 flex-shrink-0">
// // // //             <Card className="border-0 shadow-lg bg-blue-100">
// // // //               <CardHeader className="pb-4">
// // // //                 <CardTitle className="text-blue-900">
// // // //                   Filters
// // // //                   {/* <div className="text-base font-medium text-blue-600 mt-1">genes={genes}</div> */}
// // // //                 </CardTitle>
// // // //               </CardHeader>
// // // //               <CardContent className="space-y-6">
// // // //                 {/* Expression Normalization Method */}
// // // //                 <div>
// // // //                   <h3 className="font-semibold text-blue-900 mb-3">Expression Normalization Method</h3>
// // // //                   <RadioGroup value={normalizationMethod} onValueChange={setNormalizationMethod}>
// // // //                     <div className="flex items-center space-x-2">
// // // //                       <RadioGroupItem value="TPM" id="tpm" />
// // // //                       <Label htmlFor="tpm">TPM</Label>
// // // //                     </div>
// // // //                     <div className="flex items-center space-x-2">
// // // //                       <RadioGroupItem value="FPKM" id="fpkm" />
// // // //                       <Label htmlFor="fpkm">FPKM</Label>
// // // //                     </div>
// // // //                     <div className="flex items-center space-x-2">
// // // //                       <RadioGroupItem value="FPKM_UQ" id="fpkm_uq" />
// // // //                       <Label htmlFor="fpkm_uq">FPKM_UQ</Label>
// // // //                     </div>
// // // //                   </RadioGroup>
// // // //                 </div>

// // // //                 {/* Noise Metrics */}
// // // //                 <div>
// // // //                   <h3 className="font-semibold text-blue-900 mb-3">Noise Metrics</h3>
// // // //                   <div className="space-y-2">
// // // //                     {Object.keys(noiseMetrics).map((metric) => (
// // // //                       <div key={metric} className="flex items-center space-x-2">
// // // //                         <Checkbox
// // // //                           id={`noise-${metric}`}
// // // //                           checked={selectedNoiseMetrics.includes(metric)}
// // // //                           onCheckedChange={() => handleNoiseMetricToggle(metric)}
// // // //                         />
// // // //                         <Label htmlFor={`noise-${metric}`} className="text-sm">{metric}</Label>
// // // //                       </div>
// // // //                     ))}
// // // //                   </div>
// // // //                 </div>

// // // //                 {/* Primary Sites */}
// // // //                 {/* <div>
// // // //                   <h3 className="font-semibold text-blue-900 mb-3">Primary Sites</h3>
// // // //                   <div className="flex gap-2 mb-3">
// // // //                     <Button 
// // // //                       size="sm" 
// // // //                       variant="outline" 
// // // //                       onClick={handleSelectAllSites}
// // // //                       className="text-xs"
// // // //                     >
// // // //                       Select All
// // // //                     </Button>
// // // //                     <Button 
// // // //                       size="sm" 
// // // //                       variant="outline" 
// // // //                       onClick={handleDeselectAllSites}
// // // //                       className="text-xs"
// // // //                     >
// // // //                       Deselect All
// // // //                     </Button>
// // // //                   </div>
// // // //                   <div className="space-y-2 max-h-48 overflow-y-auto">
// // // //                     {primarySites.map((site) => (
// // // //                       <div key={site} className="flex items-center space-x-2">
// // // //                         <Checkbox
// // // //                           id={site}
// // // //                           checked={selectedSites.includes(site)}
// // // //                           onCheckedChange={() => handleSiteToggle(site)}
// // // //                         />
// // // //                         <Label htmlFor={site} className="text-sm">{site}</Label>
// // // //                       </div>
// // // //                     ))}
// // // //                   </div>
// // // //                 </div> */}

// // // //                 {/* Annotations */}
// // // //                 {/* <div>
// // // //                   <h3 className="font-semibold text-blue-900 mb-3">Annotations</h3>
// // // //                   <div className="flex gap-2">
// // // //                     <Button 
// // // //                       size="sm" 
// // // //                       variant="outline" 
// // // //                       onClick={handleSelectAllAnnotations}
// // // //                       className="text-xs"
// // // //                     >
// // // //                       Select All
// // // //                     </Button>
// // // //                     <Button 
// // // //                       size="sm" 
// // // //                       variant="outline" 
// // // //                       onClick={handleDeselectAllAnnotations}
// // // //                       className="text-xs"
// // // //                     >
// // // //                       Deselect All
// // // //                     </Button>
// // // //                   </div>
// // // //                 </div> */}

// // // //                 {/* Plot Visibility Controls */}
// // // //                 <div>
// // // //                   <h3 className="font-semibold text-blue-900 mb-3">Relative Analysis Plots</h3>
// // // //                   <div className="space-y-2">
// // // //                     {/* <div className="flex items-center space-x-2">
// // // //                       <Checkbox
// // // //                         id="linearDist"
// // // //                         checked={visiblePlots.linearDist}
// // // //                         onCheckedChange={() => handlePlotToggle('linearDist')}
// // // //                       />
// // // //                       <Label htmlFor="linearDist" className="text-sm">Linear Expression Distribution</Label>
// // // //                     </div> */}
// // // //                     <div className="flex items-center space-x-2">
// // // //                       <Checkbox
// // // //                         id="logDist"
// // // //                         checked={visiblePlots.logDist}
// // // //                         onCheckedChange={() => handlePlotToggle('logDist')}
// // // //                       />
// // // //                       <Label htmlFor="logDist" className="text-sm">Log Expression Distribution</Label>
// // // //                     </div>
// // // //                     <div className="flex items-center space-x-2">
// // // //                       <Checkbox
// // // //                         id="exprTrend"
// // // //                         checked={visiblePlots.exprTrend}
// // // //                         onCheckedChange={() => handlePlotToggle('exprTrend')}
// // // //                       />
// // // //                       <Label htmlFor="exprTrend" className="text-sm">Expression Trend</Label>
// // // //                     </div>
// // // //                     {/* <div className="flex items-center space-x-2">
// // // //                       <Checkbox
// // // //                         id="timeSeries"
// // // //                         checked={visiblePlots.timeSeries}
// // // //                         onCheckedChange={() => handlePlotToggle('timeSeries')}
// // // //                       />
// // // //                       <Label htmlFor="timeSeries" className="text-sm">Time Series</Label>
// // // //                     </div> */}
// // // //                     <div className="flex items-center space-x-2">
// // // //                       <Checkbox
// // // //                         id="tumorNormal"
// // // //                         checked={visiblePlots.tumorNormal}
// // // //                         onCheckedChange={() => handlePlotToggle('tumorNormal')}
// // // //                       />
// // // //                       <Label htmlFor="tumorNormal" className="text-sm">Tumor vs Normal</Label>
// // // //                     </div>
// // // //                     {/* {genes.length > 1 && (
// // // //                       <div className="flex items-center space-x-2">
// // // //                         <Checkbox
// // // //                           id="correlation"
// // // //                           checked={visiblePlots.correlation}
// // // //                           onCheckedChange={() => handlePlotToggle('correlation')}
// // // //                         />
// // // //                         <Label htmlFor="correlation" className="text-sm">Correlation Heatmap</Label>
// // // //                       </div>
// // // //                     )} */}
// // // //                     {/* <div className="flex items-center space-x-2">
// // // //                       <Checkbox
// // // //                         id="detailedMetrics"
// // // //                         checked={visiblePlots.detailedMetrics}
// // // //                         onCheckedChange={() => handlePlotToggle('detailedMetrics')}
// // // //                       />
// // // //                       <Label htmlFor="detailedMetrics" className="text-sm">Detailed Metrics</Label>
// // // //                     </div> */}
// // // //                   </div>
// // // //                 </div>
// // // //                 <Button 
// // // //                   variant="outline" 
// // // //                   className="w-full justify-between bg-blue-600 text-white hover:bg-blue-700"
// // // //                   onClick={handleCollapseAll}
// // // //                 >
// // // //                   {isAllCollapsed ? 'Collapse All' : 'Expand All'}
// // // //                   {isAllCollapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
// // // //                 </Button>
// // // //                 {/* Apply Button */}
// // // //                 <Button onClick={applyFilters} className="w-full bg-blue-600 hover:bg-blue-700">
// // // //                   Apply
// // // //                 </Button>

// // // //               </CardContent>
// // // //             </Card>
// // // //           </div>

// // // //           {/* Main Content */}
// // // //           <div className="flex-1">
// // // //               <Link to="/gene-analysis" className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-6 transition-colors">
// // // //                 <ArrowLeft className="h-4 w-4 mr-2" />
// // // //                 Back to Gene Analysis
// // // //               </Link>

// // // //             {/* <div className="mb-8">
// // // //               <h2 className="text-4xl font-bold text-blue-900 mb-2">
// // // //                 Results for {getCancerTypeLabel(cancerType)}
// // // //               </h2>
// // // //               <div className="flex space-x-2">
// // // //                 <Button onClick={() => downloadData('csv')} variant="outline" size="sm">
// // // //                   <Download className="h-4 w-4 mr-2" /> Download CSV
// // // //                 </Button>
// // // //                 <Button onClick={() => downloadData('json')} variant="outline" size="sm">
// // // //                   <Download className="h-4 w-4 mr-2" /> Download JSON
// // // //                 </Button>
// // // //               </div>
// // // //               <div className="flex flex-wrap gap-2 mb-4">
// // // //                 {genes.map(gene => (
// // // //                   <Badge key={gene} variant="secondary" className="text-sm">
// // // //                     {gene}
// // // //                   </Badge>
// // // //                 ))}
// // // //               </div> */}
// // // //               <div className="mb-8">
// // // //                 <h2 className="text-4xl font-bold text-blue-900 mb-2">
// // // //                   Results for {getCancerTypeLabel(cancerType)}
// // // //                 </h2>
// // // //                 <div className="flex items-center justify-between mb-4">
                  
// // // //                   {/* Gene Badges on the left */}
// // // //                   {/* <div className="flex flex-wrap gap-2">
// // // //                     {genes.map(gene => (
// // // //                       <Badge key={gene} variant="secondary" className="text-sm">
// // // //                         {gene}
// // // //                       </Badge>
// // // //                     ))}
// // // //                   </div> */}
// // // //                   {/* Download Buttons on the right */}
// // // //                   {/* <div className="flex space-x-4">
// // // //                     <Button onClick={() => downloadData('csv')} variant="outline" size="sm">
// // // //                       <Download className="h-4 w-4 mr-2" /> Download CSV
// // // //                     </Button> */}
// // // //                     {/* <Button onClick={() => downloadData('json')} variant="outline" size="sm">
// // // //                       <Download className="h-4 w-4 mr-2" /> Download JSON
// // // //                     </Button> */}
// // // //                   {/* </div> */}
// // // //                 </div>
              
// // // //               {/* <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
// // // //                 <Card className="border-0 shadow-lg">
// // // //                   <CardContent className="p-4 text-center">
// // // //                     <Users className="h-6 w-6 text-blue-600 mx-auto mb-2" />
// // // //                     <div className="text-2xl font-bold text-blue-600">{totalTumorSamples}</div>
// // // //                     <div className="text-xs text-gray-600">Total Tumor Samples</div>
// // // //                   </CardContent>
// // // //                 </Card>
// // // //                 <Card className="border-0 shadow-lg">
// // // //                   <CardContent className="p-4 text-center">
// // // //                     <Users className="h-6 w-6 text-green-600 mx-auto mb-2" />
// // // //                     <div className="text-2xl font-bold text-green-600">{totalNormalSamples}</div>
// // // //                     <div className="text-xs text-gray-600">Total Normal Samples</div>
// // // //                   </CardContent>
// // // //                 </Card>
// // // //               </div> */}
// // // //             </div> 



// // // //             {/* Boxplots for Statistical Metrics */}
// // // //             {/* {(visiblePlots.cv || visiblePlots.stdDev || visiblePlots.variance || visiblePlots.mad || visiblePlots.depth || visiblePlots.depth2) && (
// // // //               <div className="mb-8">
// // // //                 <h3 className="text-2xl font-bold text-blue-900 mb-4">Statistical Metrics Boxplots</h3>
// // // //                 <div className="grid lg:grid-cols-3 md:grid-cols-2 gap-4">
// // // //                   {visiblePlots.cv && (
// // // //                     <BoxplotBar 
// // // //                       data={resultsData} 
// // // //                       dataKey="cv" 
// // // //                       color="#2563eb" 
// // // //                       title="Coefficient of Variation (%)" 
// // // //                     />
// // // //                   )}
// // // //                   {visiblePlots.stdDev && (
// // // //                     <BoxplotBar 
// // // //                       data={resultsData} 
// // // //                       dataKey="stdDev" 
// // // //                       color="#ca8a04" 
// // // //                       title="Standard Deviation" 
// // // //                     />
// // // //                   )}
// // // //                   {visiblePlots.variance && (
// // // //                     <BoxplotBar 
// // // //                       data={resultsData} 
// // // //                       dataKey="variance" 
// // // //                       color="#059669" 
// // // //                       title="Variance" 
// // // //                     />
// // // //                   )}
// // // //                   {visiblePlots.mad && (
// // // //                     <BoxplotBar 
// // // //                       data={resultsData} 
// // // //                       dataKey="mad" 
// // // //                       color="#7c3aed" 
// // // //                       title="Mean Absolute Deviation" 
// // // //                     />
// // // //                   )}
// // // //                   {visiblePlots.depth && (
// // // //                     <BoxplotBar 
// // // //                       data={resultsData} 
// // // //                       dataKey="depth" 
// // // //                       color="#dc2626" 
// // // //                       title="Depth" 
// // // //                     />
// // // //                   )}
// // // //                   {visiblePlots.depth2 && (
// // // //                     <BoxplotBar 
// // // //                       data={resultsData} 
// // // //                       dataKey="depth2" 
// // // //                       color="#ea580c" 
// // // //                       title="Depth2" 
// // // //                     />
// // // //                   )}
// // // //                 </div>
// // // //               </div>
// // // //             )} */}
// // // //           </div>
// // // //         </div>
// // // //       </div>
// // // //     </div>
// // // //   );
// // // // };

// // // // export default TumourResults;
// // // // import { useState, useEffect, useRef } from "react";
// // // // import { useSearchParams, Link } from "react-router-dom";
// // // // import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// // // // import { Button } from "@/components/ui/button";
// // // // import { Badge } from "@/components/ui/badge";
// // // // import { ArrowLeft, Download, Box, ChevronRight, ChevronDown, Users } from "lucide-react";
// // // // import { Checkbox } from "@/components/ui/checkbox";
// // // // import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
// // // // import { Label } from "@/components/ui/label";
// // // // import supabase from "@/supabase-client";
// // // // import { 
// // // //   ResponsiveContainer, 
// // // //   XAxis, 
// // // //   YAxis, 
// // // //   CartesianGrid, 
// // // //   Tooltip,
// // // //   ComposedChart,
// // // //   Bar,
// // // //   ErrorBar,
// // // //   Scatter
// // // // } from "recharts";

// // // // const TumourResults = () => {
// // // //   const [searchParams] = useSearchParams();
// // // //   const cancerType = searchParams.get('cancerType') || '';
  
// // // //   // Filter states
// // // //   const [normalizationMethod, setNormalizationMethod] = useState('TPM');
// // // //   const [selectedNoiseMetrics, setSelectedNoiseMetrics] = useState<string[]>(['DEPTH2', 'DEPTH - tITH']);
// // // //   const [selectedSites, setSelectedSites] = useState(['Prostate']);
// // // //   const [isAllCollapsed, setIsAllCollapsed] = useState(false);
// // // //   const [visiblePlots, setVisiblePlots] = useState({
// // // //     cv: false,
// // // //     stdDev: false,
// // // //     variance: false,
// // // //     mad: false,
// // // //     depth: true,
// // // //     depth2: true,
// // // //     tith: true,
// // // //     diffNoise: true,
// // // //     normalNoise: true,
// // // //     tumorNoise: true
// // // //   });

// // // //   // Refs for chart containers
// // // //   const chartRefs = useRef<{[key: string]: any}>({});

// // // //   // Noise metric options
// // // //   const noiseMetrics = {
// // // //     // 'CV': 'cv',
// // // //     // 'CV2': 'cv',
// // // //     // 'Standard Deviation': 'stdDev',
// // // //     // 'Variance': 'variance',
// // // //     // 'MAD': 'mad',
// // // //     'DEPTH2': 'depth2',
// // // //     'DEPTH - tITH': 'depth'
// // // //   };

// // // //   // Handle noise metric selection
// // // //   const handleNoiseMetricToggle = (metric: string) => {
// // // //     setSelectedNoiseMetrics(prev => 
// // // //       prev.includes(metric) 
// // // //         ? prev.filter(m => m !== metric)
// // // //         : [...prev, metric]
// // // //     );
// // // //   };

// // // //   // Handle collapse all toggle
// // // //   const handleCollapseAll = () => {
// // // //     setIsAllCollapsed(!isAllCollapsed);
// // // //     setVisiblePlots(prev => {
// // // //       const newPlots = { ...prev };
// // // //       Object.keys(newPlots).forEach(key => {
// // // //         newPlots[key] = !isAllCollapsed;
// // // //       });
// // // //       return newPlots;
// // // //     });
// // // //   };

// // // //   // Handle individual plot visibility
// // // //   const handlePlotToggle = (plotKey: string) => {
// // // //     setVisiblePlots(prev => ({
// // // //       ...prev,
// // // //       [plotKey]: !prev[plotKey]
// // // //     }));
// // // //   };
  
// // // //   const applyFilters = () => {
// // // //     console.log('Applying filters:', {
// // // //       normalizationMethod,
// // // //       selectedNoiseMetrics,
// // // //       selectedSites
// // // //     });
// // // //     setVisiblePlots(prev => ({
// // // //       ...prev,
// // // //       // cv: selectedNoiseMetrics.includes('CV') || selectedNoiseMetrics.includes('CV2'),
// // // //       // stdDev: selectedNoiseMetrics.includes('Standard Deviation'),
// // // //       // variance: selectedNoiseMetrics.includes('Variance'),
// // // //       // mad: selectedNoiseMetrics.includes('MAD'),
// // // //       // depth: selectedNoiseMetrics.includes('DEPTH - tITH'),
// // // //       depth2: selectedNoiseMetrics.includes('DEPTH2'),
// // // //       tith: selectedNoiseMetrics.includes('DEPTH - tITH'),
// // // //       diffNoise: true,
// // // //       normalNoise: true,
// // // //       tumorNoise: true
// // // //     }));
// // // //   };

// // // //   // Generate mock data for boxplots and other plots
// // // //   // const generateTumorData = () => {
// // // //   //   const genes = ['TCGA-AA-A01A', 'TCGA-A8-A0J1', 'TCGA-AU-A0FJ', 'TCGA-A8-A09J', 'TCGA-A8-A0J2'];
// // // //   //   const data = genes.map(gene => ({
// // // //   //     gene,
// // // //   //     tpm: Math.random() * 1,
// // // //   //     fpkm: Math.random() * 1.5,
// // // //   //     fpkm_uq: Math.random() * 1.2,
// // // //   //     depth2: Math.random() * 0.5,
// // // //   //     depth2Q1: Math.random() * 0.4,
// // // //   //     depth2Q3: Math.random() * 0.6,
// // // //   //     depth2Min: Math.random() * 0.3,
// // // //   //     depth2Max: Math.random() * 0.7,
// // // //   //     depth2Median: Math.random() * 0.5,
// // // //   //     tith: Math.random() * 0.1,
// // // //   //     diffNoise: Math.random() * 0.5,
// // // //   //     normalNoise: Math.random() * 0.5,
// // // //   //     tumorNoise: Math.random() * 0.5,
// // // //   //     tumorSamples: Math.floor(Math.random() * 200) + 100,
// // // //   //     normalSamples: Math.floor(Math.random() * 50) + 20
// // // //   //   }));
// // // //   //   return data;
// // // //   // };
// // // //   // const fetchTumorExpressionData = async () => {
// // // //   //   const { data, error } = await supabase
// // // //   //     .from('expression_values')
// // // //   //     .select(`
// // // //   //       tpm,
// // // //   //       fpkm,
// // // //   //       fpkm_uq,
// // // //   //       gene_id,
// // // //   //       sample_id,
// // // //   //       genes (
// // // //   //         gene_symbol
// // // //   //       ),
// // // //   //       samples (
// // // //   //         sample_barcode,
// // // //   //         sample_type,
// // // //   //         cancer_type_id,
// // // //   //         cancer_types (
// // // //   //           tcga_code
// // // //   //         )
// // // //   //       )
// // // //   //     `)
// // // //   //     .eq('samples.sample_type', 'tumor')
// // // //   //     .eq('samples.cancer_types.tcga_code', cancerType);

// // // //   //   if (error) {
// // // //   //     console.error('Error fetching tumor expression data:', error);
// // // //   //     return [];
// // // //   //   }

// // // //   //   // Group values by sample_barcode
// // // //   //   const sampleMap: { [barcode: string]: any } = {};

// // // //   //   data.forEach((entry) => {
// // // //   //     const sample = entry.samples?.sample_barcode;
// // // //   //     const gene = entry.genes?.gene_symbol;
// // // //   //     if (!sample || !gene) return;

// // // //   //     if (!sampleMap[sample]) {
// // // //   //       sampleMap[sample] = { geneData: [], sample };
// // // //   //     }

// // // //   //     sampleMap[sample].geneData.push({
// // // //   //       gene,
// // // //   //       tpm: entry.tpm,
// // // //   //       fpkm: entry.fpkm,
// // // //   //       fpkm_uq: entry.fpkm_uq,
// // // //   //     });
// // // //   //   });

// // // //   //   const formatted = Object.values(sampleMap);
// // // //   //   return formatted;
// // // //   // };
// // // //   const fetchTumorExpressionData = async () => {
// // // //     const { data, error } = await supabase
// // // //       .from('expression_values')
// // // //       .select(`
// // // //         gene_id,
// // // //         sample_id,
// // // //         ${normalizationMethod}
// // // //         genes (
// // // //           gene_symbol
// // // //         ),
// // // //         samples (
// // // //           sample_barcode,
// // // //           sample_type,
// // // //           cancer_type_id,
// // // //           cancer_types! (
// // // //             tcga_code
// // // //           )
// // // //         )
// // // //       `)
// // // //       .eq('samples.sample_type', 'tumor')
// // // //       .eq('samples.cancer_types.tcga_code', cancerType) as any;

// // // //     if (error) {
// // // //       console.error('Error fetching tumor expression data:', error);
// // // //       return [];
// // // //     }

// // // //     const sampleMap: { [barcode: string]: any } = {};

// // // //     data.forEach((entry) => {
// // // //       const sample = entry.samples?.sample_barcode;
// // // //       const gene = entry.genes?.gene_symbol;
// // // //       if (!sample || !gene) return;

// // // //       if (!sampleMap[sample]) {
// // // //         sampleMap[sample] = { geneData: [], sample };
// // // //       }

// // // //       sampleMap[sample].geneData.push({
// // // //         gene,
// // // //         value: entry[normalizationMethod], // only the chosen method is used
// // // //       });
// // // //     });

// // // //     return Object.values(sampleMap);
// // // //   };


// // // //   useEffect(() => {
// // // //   const loadData = async () => {
// // // //     const data = await fetchTumorExpressionData();
// // // //     setTumorData(data); // you'll need to transform this into metric format like depth2, tITH etc.
// // // //   };

// // // //   loadData();
// // // // }, [cancerType]);

// // // //     // Generate mock data for boxplots and other plots
// // // //   const generateGeneData = () => {
// // // //     const genes = ['TP53', 'BRCA1', 'BRCA2', 'ARF5', 'PON1'];
// // // //     const data = genes.map(gene => ({
// // // //       gene,
// // // //       tpm: Math.random() * 1,
// // // //       fpkm: Math.random() * 1.5,
// // // //       fpkm_uq: Math.random() * 1.2,
// // // //       depth2: Math.random() * 0.5,
// // // //       depth2Q1: Math.random() * 0.4,
// // // //       depth2Q3: Math.random() * 0.6,
// // // //       depth2Min: Math.random() * 0.3,
// // // //       depth2Max: Math.random() * 0.7,
// // // //       depth2Median: Math.random() * 0.5,
// // // //       tith: Math.random() * 0.1,
// // // //       diffNoise: Math.random() * 0.5,
// // // //       normalNoise: Math.random() * 0.5,
// // // //       tumorNoise: Math.random() * 0.5,
// // // //       tumorSamples: Math.floor(Math.random() * 200) + 100,
// // // //       normalSamples: Math.floor(Math.random() * 50) + 20
// // // //     }));
// // // //     return data;
// // // //   };

// // // //   const [tumorData, setTumorData] = useState(fetchTumorExpressionData());
// // // //   const [geneData, setGeneData] = useState(generateGeneData());

// // // //   const getCancerTypeLabel = (type: string) => {
// // // //     const labels: { [key: string]: string } = {
// // // //       "TCGA-BRCA": "Breast Cancer (BRCA)",
// // // //       "TCGA-LUAD": "Lung Cancer (LUAD)",
// // // //       "TCGA-PRAD": "Prostate Cancer (PRAD)",
// // // //       "TCGA-COAD": "Colorectal Cancer (COAD)",
// // // //       "TCGA-LIHC": "Liver Cancer (LIHC)",
// // // //       "TCGA-KIRC": "Kidney Cancer (KIRC)",
// // // //       "TCGA-STAD": "Stomach Cancer (STAD)",
// // // //       "TCGA-OV": "Ovarian Cancer (OV)",
// // // //       "TCGA-BLCA": "Bladder Cancer (BLCA)"
// // // //     };
// // // //     return labels[type] || type;
// // // //   };

// // // //   const downloadChart = (chartKey: string, chartName: string) => {
// // // //     const chartElement = chartRefs.current[chartKey];
// // // //     if (chartElement) {
// // // //       const svg = chartElement.querySelector('svg');
// // // //       if (svg) {
// // // //         const canvas = document.createElement('canvas');
// // // //         const ctx = canvas.getContext('2d');
// // // //         const img = new Image();
        
// // // //         const svgData = new XMLSerializer().serializeToString(svg);
// // // //         const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
// // // //         const url = URL.createObjectURL(svgBlob);
        
// // // //         img.onload = function() {
// // // //           canvas.width = img.width || 800;
// // // //           canvas.height = img.height || 400;
// // // //           ctx?.drawImage(img, 0, 0);
          
// // // //           canvas.toBlob((blob) => {
// // // //             if (blob) {
// // // //               const link = document.createElement('a');
// // // //               link.download = `${chartName.replace(/\s+/g, '_').toLowerCase()}_${Date.now()}.png`;
// // // //               link.href = URL.createObjectURL(blob);
// // // //               link.click();
// // // //               URL.revokeObjectURL(link.href);
// // // //             }
// // // //           });
// // // //           URL.revokeObjectURL(url);
// // // //         };
// // // //         img.src = url;
// // // //       }
// // // //     }
// // // //   };

// // // //   const colors = ['#2563eb', '#059669', '#dc2626', '#7c3aed', '#ea580c'];

// // // //   // Custom boxplot component
// // // //   const BoxplotBar = ({ data, dataKey, color, title }: any) => (
// // // //     <Card className="border-0 shadow-lg">
// // // //       <CardHeader className="pb-2">
// // // //         <CardTitle className="flex items-center justify-between text-sm">
// // // //           <div className="flex items-center space-x-2">
// // // //             <Box className="h-4 w-4" style={{ color }} />
// // // //             <span>{title}</span>
// // // //           </div>
// // // //           <Button 
// // // //             size="sm" 
// // // //             variant="outline" 
// // // //             onClick={() => downloadChart(`boxplot-${dataKey}`, title)}
// // // //             className="h-6 px-2 text-xs"
// // // //           >
// // // //             <Download className="h-3 w-3" />
// // // //           </Button>
// // // //         </CardTitle>
// // // //       </CardHeader>
// // // //       <CardContent className="pt-0">
// // // //         <div ref={el => chartRefs.current[`boxplot-${dataKey}`] = el}>
// // // //           <ResponsiveContainer width="100%" height={200}>
// // // //             <ComposedChart data={data} margin={{ top: 5, right: 5, left: 5, bottom: 25 }}>
// // // //               <CartesianGrid strokeDasharray="3 3" />
// // // //               <XAxis 
// // // //                 dataKey="sample" 
// // // //                 tick={{ fontSize: 10 }}
// // // //                 label={{ 
// // // //                   value: 'Samples', 
// // // //                   position: 'insideBottom', 
// // // //                   offset: -10, 
// // // //                   style: { fontSize: '10px' } 
// // // //                 }}
// // // //               />
// // // //               <YAxis 
// // // //                 tick={{ fontSize: 10 }}
// // // //                 label={{ 
// // // //                   value: title, 
// // // //                   angle: -90, 
// // // //                   position: 'insideLeft', 
// // // //                   style: { fontSize: '10px' } 
// // // //                 }} 
// // // //               />
// // // //               <Tooltip 
// // // //                 formatter={(value) => [
// // // //                   typeof value === 'number' ? value.toFixed(2) : value,
// // // //                   title,
// // // //                 ]} 
// // // //               />
// // // //               <Bar dataKey={`${dataKey}Median`} fill={color}>
// // // //                 <ErrorBar dataKey={`${dataKey}Min`} width={4} stroke={color} />
// // // //                 <ErrorBar dataKey={`${dataKey}Max`} width={4} stroke={color} />
// // // //               </Bar>
// // // //             </ComposedChart>
// // // //           </ResponsiveContainer>
// // // //         </div>
// // // //       </CardContent>
// // // //     </Card>
// // // //   );

// // // //   // Custom scatter plot component for tITH
// // // //   const ScatterPlot = ({ data, dataKey, color, title }: any) => (
// // // //     <Card className="border-0 shadow-lg">
// // // //       <CardHeader className="pb-2">
// // // //         <CardTitle className="flex items-center justify-between text-sm">
// // // //           <div className="flex items-center space-x-2">
// // // //             <Box className="h-4 w-4" style={{ color }} />
// // // //             <span>{title}</span>
// // // //           </div>
// // // //           <Button 
// // // //             size="sm" 
// // // //             variant="outline" 
// // // //             onClick={() => downloadChart(`scatter-${dataKey}`, title)}
// // // //             className="h-6 px-2 text-xs"
// // // //           >
// // // //             <Download className="h-3 w-3" />
// // // //           </Button>
// // // //         </CardTitle>
// // // //       </CardHeader>
// // // //       <CardContent className="pt-0">
// // // //         <div ref={el => chartRefs.current[`scatter-${dataKey}`] = el}>
// // // //           <ResponsiveContainer width="100%" height={200}>
// // // //             <ComposedChart data={data} margin={{ top: 5, right: 5, left: 5, bottom: 25 }}>
// // // //               <CartesianGrid strokeDasharray="3 3" />
// // // //               <XAxis 
// // // //                 dataKey="sample" 
// // // //                 tick={{ fontSize: 10 }}
// // // //                 label={{ 
// // // //                   value: 'Samples', 
// // // //                   position: 'insideBottom', 
// // // //                   offset: -10, 
// // // //                   style: { fontSize: '10px' } 
// // // //                 }}
// // // //               />
// // // //               <YAxis 
// // // //                 tick={{ fontSize: 10 }}
// // // //                 label={{ 
// // // //                   value: title, 
// // // //                   angle: -90, 
// // // //                   position: 'insideLeft', 
// // // //                   style: { fontSize: '10px' } 
// // // //                 }} 
// // // //               />
// // // //               <Tooltip 
// // // //                 formatter={(value) => [
// // // //                   typeof value === 'number' ? value.toFixed(2) : value,
// // // //                   title,
// // // //                 ]} 
// // // //               />
// // // //               <Scatter dataKey={dataKey} fill={color} />
// // // //             </ComposedChart>
// // // //           </ResponsiveContainer>
// // // //         </div>
// // // //       </CardContent>
// // // //     </Card>
// // // //   );

// // // //   // Custom bar chart component for noise rankings
// // // //   const BarChart = ({ data, dataKey, color, title }: any) => (
// // // //     <Card className="border-0 shadow-lg">
// // // //       <CardHeader className="pb-2">
// // // //         <CardTitle className="flex items-center justify-between text-sm">
// // // //           <div className="flex items-center space-x-2">
// // // //             <Box className="h-4 w-4" style={{ color }} />
// // // //             <span>{title}</span>
// // // //           </div>
// // // //           <Button 
// // // //             size="sm" 
// // // //             variant="outline" 
// // // //             onClick={() => downloadChart(`bar-${dataKey}`, title)}
// // // //             className="h-6 px-2 text-xs"
// // // //           >
// // // //             <Download className="h-3 w-3" />
// // // //           </Button>
// // // //         </CardTitle>
// // // //       </CardHeader>
// // // //       <CardContent className="pt-0">
// // // //         <div ref={el => chartRefs.current[`bar-${dataKey}`] = el}>
// // // //           <ResponsiveContainer width="100%" height={200}>
// // // //             <ComposedChart data={data} margin={{ top: 5, right: 5, left: 5, bottom: 25 }}>
// // // //               <CartesianGrid strokeDasharray="3 3" />
// // // //               <XAxis 
// // // //                 dataKey="sample" 
// // // //                 tick={{ fontSize: 10 }}
// // // //                 label={{ 
// // // //                   value: 'Genes', 
// // // //                   position: 'insideBottom', 
// // // //                   offset: -10, 
// // // //                   style: { fontSize: '10px' } 
// // // //                 }}
// // // //               />
// // // //               <YAxis 
// // // //                 tick={{ fontSize: 10 }}
// // // //                 label={{ 
// // // //                   value: title, 
// // // //                   angle: -90, 
// // // //                   position: 'insideLeft', 
// // // //                   style: { fontSize: '10px' } 
// // // //                 }} 
// // // //               />
// // // //               <Tooltip 
// // // //                 formatter={(value) => [
// // // //                   typeof value === 'number' ? value.toFixed(2) : value,
// // // //                   title,
// // // //                 ]} 
// // // //               />
// // // //               <Bar dataKey={dataKey} fill={color} />
// // // //             </ComposedChart>
// // // //           </ResponsiveContainer>
// // // //         </div>
// // // //       </CardContent>
// // // //     </Card>
// // // //   );

// // // //   return (
// // // //     <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-yellow-50">
// // // //       <header className="bg-white shadow-sm border-b border-blue-100">
// // // //         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
// // // //           <div className="flex items-center justify-between">
// // // //             <div className="flex items-center space-x-3">
// // // //               <h1 className="text-2xl font-bold text-blue-900">Tumor Analysis Results</h1>
// // // //             </div>
// // // //             <nav className="flex space-x-6">
// // // //               <Link to="/" className="text-blue-700 hover:text-blue-600 font-medium transition-colors">
// // // //                 Home
// // // //               </Link>
// // // //               <Link to="/gene-analysis" className="text-blue-700 hover:text-blue-600 font-medium transition-colors">
// // // //                 Gene Analysis
// // // //               </Link>
// // // //               <Link to="/pathway-analysis" className="text-blue-700 hover:text-blue-600 font-medium transition-colors">
// // // //                 Pathway Analysis
// // // //               </Link>
// // // //               <Link to="/tumour-analysis" className="text-blue-500 font-medium">
// // // //                 Tumor Analysis
// // // //               </Link>
// // // //             </nav>
// // // //           </div>
// // // //         </div>
// // // //       </header>

// // // //       <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
// // // //         <div className="flex gap-6">
// // // //           {/* Left Sidebar - Filters */}
// // // //           <div className="w-80 flex-shrink-0">
// // // //             <Card className="border-0 shadow-lg bg-blue-100">
// // // //               <CardHeader className="pb-4">
// // // //                 <CardTitle className="text-blue-900">
// // // //                   Filters
// // // //                 </CardTitle>
// // // //               </CardHeader>
// // // //               <CardContent className="space-y-6">
// // // //                 {/* Expression Normalization Method */}
// // // //                 <div>
// // // //                   <h3 className="font-semibold text-blue-900 mb-3">Expression Normalization Method</h3>
// // // //                   <RadioGroup value={normalizationMethod} onValueChange={setNormalizationMethod}>
// // // //                     <div className="flex items-center space-x-2">
// // // //                       <RadioGroupItem value="TPM" id="tpm" />
// // // //                       <Label htmlFor="tpm">TPM</Label>
// // // //                     </div>
// // // //                     <div className="flex items-center space-x-2">
// // // //                       <RadioGroupItem value="FPKM" id="fpkm" />
// // // //                       <Label htmlFor="fpkm">FPKM</Label>
// // // //                     </div>
// // // //                     <div className="flex items-center space-x-2">
// // // //                       <RadioGroupItem value="FPKM_UQ" id="fpkm_uq" />
// // // //                       <Label htmlFor="fpkm_uq">FPKM_UQ</Label>
// // // //                     </div>
// // // //                   </RadioGroup>
// // // //                 </div>

// // // //                 {/* Noise Metrics */}
// // // //                 <div>
// // // //                   <h3 className="font-semibold text-blue-900 mb-3">Noise Metrics</h3>
// // // //                   <div className="space-y-2">
// // // //                     {Object.keys(noiseMetrics).map((metric) => (
// // // //                       <div key={metric} className="flex items-center space-x-2">
// // // //                         <Checkbox
// // // //                           id={`noise-${metric}`}
// // // //                           checked={selectedNoiseMetrics.includes(metric)}
// // // //                           onCheckedChange={() => handleNoiseMetricToggle(metric)}
// // // //                         />
// // // //                         <Label htmlFor={`noise-${metric}`} className="text-sm">{metric}</Label>
// // // //                       </div>
// // // //                     ))}
// // // //                   </div>
// // // //                 </div>

// // // //                 {/* Plot Visibility Controls */}
// // // //                 <div>
// // // //                   <h3 className="font-semibold text-blue-900 mb-3">Analysis Plots</h3>
// // // //                   <div className="space-y-2">
// // // //                     <div className="flex items-center space-x-2">
// // // //                       <Checkbox
// // // //                         id="depth2"
// // // //                         checked={visiblePlots.depth2}
// // // //                         onCheckedChange={() => handlePlotToggle('depth2')}
// // // //                       />
// // // //                       {/* <Label htmlFor="depth2" className="text-sm">DEPTH2 Boxplot</Label>
// // // //                     </div>
// // // //                     <div className="flex items-center space-x-2">
// // // //                       <Checkbox
// // // //                         id="tith"
// // // //                         checked={visiblePlots.tith}
// // // //                         onCheckedChange={() => handlePlotToggle('tith')}
// // // //                       /> */}
// // // //                       {/* <Label htmlFor="tith" className="text-sm">tITH Scatter Plot</Label>
// // // //                     </div>
// // // //                     <div className="flex items-center space-x-2">
// // // //                       <Checkbox
// // // //                         id="diffNoise"
// // // //                         checked={visiblePlots.diffNoise}
// // // //                         onCheckedChange={() => handlePlotToggle('diffNoise')}
// // // //                       /> */}
// // // //                       <Label htmlFor="diffNoise" className="text-sm">Differential Noise</Label>
// // // //                     </div>
// // // //                     <div className="flex items-center space-x-2">
// // // //                       <Checkbox
// // // //                         id="normalNoise"
// // // //                         checked={visiblePlots.normalNoise}
// // // //                         onCheckedChange={() => handlePlotToggle('normalNoise')}
// // // //                       />
// // // //                       <Label htmlFor="normalNoise" className="text-sm">Normal State Noise</Label>
// // // //                     </div>
// // // //                     <div className="flex items-center space-x-2">
// // // //                       <Checkbox
// // // //                         id="tumorNoise"
// // // //                         checked={visiblePlots.tumorNoise}
// // // //                         onCheckedChange={() => handlePlotToggle('tumorNoise')}
// // // //                       />
// // // //                       <Label htmlFor="tumorNoise" className="text-sm">Tumor State Noise</Label>
// // // //                     </div>
// // // //                   </div>
// // // //                 </div>
// // // //                 <Button 
// // // //                   variant="outline" 
// // // //                   className="w-full justify-between bg-blue-600 text-white hover:bg-blue-700"
// // // //                   onClick={handleCollapseAll}
// // // //                 >
// // // //                   {isAllCollapsed ? 'Unselect All' : 'Select All'}
// // // //                   {isAllCollapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
// // // //                 </Button>
// // // //                 <Button onClick={applyFilters} className="w-full bg-blue-600 hover:bg-blue-700">
// // // //                   Apply
// // // //                 </Button>
// // // //               </CardContent>
// // // //             </Card>
// // // //           </div>

// // // //           {/* Main Content */}
// // // //           <div className="flex-1">
// // // //             <Link to="/gene-analysis" className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-6 transition-colors">
// // // //               <ArrowLeft className="h-4 w-4 mr-2" />
// // // //               Back to Gene Analysis
// // // //             </Link>

// // // //             <div className="mb-8">
// // // //               <h2 className="text-4xl font-bold text-blue-900 mb-2">
// // // //                 Results for {getCancerTypeLabel(cancerType)}
// // // //               </h2>
// // // //             </div>

// // // //             {/* DEPTH2 and tITH Plots */}
// // // //             {(visiblePlots.depth2 || visiblePlots.tith) && (
// // // //               <div className="mb-8">
// // // //                 <h3 className="text-2xl font-bold text-blue-900 mb-4">Tumor Heterogeneity Metrics</h3>
// // // //                 <div className="grid lg:grid-cols-2 md:grid-cols-1 gap-4">
// // // //                   {visiblePlots.depth2 && (
// // // //                     <BoxplotBar 
// // // //                       data={tumorData} 
// // // //                       dataKey="depth2" 
// // // //                       color="#ea580c" 
// // // //                       title="DEPTH2 Scores" 
// // // //                     />
// // // //                   )}
// // // //                   {visiblePlots.tith && (
// // // //                     <ScatterPlot 
// // // //                       data={tumorData} 
// // // //                       dataKey="tith" 
// // // //                       color="#2563eb" 
// // // //                       title="Transcriptome-based Intra-Tumor Heterogeneity (tITH)" 
// // // //                     />
// // // //                   )}
// // // //                 </div>
// // // //               </div>
// // // //             )}

// // // //             {/* Noise Rankings */}
// // // //             {(visiblePlots.diffNoise || visiblePlots.normalNoise || visiblePlots.tumorNoise) && (
// // // //               <div className="mb-8">
// // // //                 <h3 className="text-2xl font-bold text-blue-900 mb-4">Noise Rankings</h3>
// // // //                 <div className="grid lg:grid-cols-3 md:grid-cols-1 gap-4">
// // // //                   {visiblePlots.diffNoise && (
// // // //                     <BarChart 
// // // //                       data={geneData.slice(0, 5)} 
// // // //                       dataKey="diffNoise" 
// // // //                       color="#dc2626" 
// // // //                       title="Genes with Highest Differential Noise" 
// // // //                     />
// // // //                   )}
// // // //                   {visiblePlots.normalNoise && (
// // // //                     <BarChart 
// // // //                       data={geneData.slice(0, 5)} 
// // // //                       dataKey="normalNoise" 
// // // //                       color="#059669" 
// // // //                       title="Genes with Highest Normal State Noise" 
// // // //                     />
// // // //                   )}
// // // //                   {visiblePlots.tumorNoise && (
// // // //                     <BarChart 
// // // //                       data={geneData.slice(0, 5)} 
// // // //                       dataKey="tumorNoise" 
// // // //                       color="#7c3aed" 
// // // //                       title="Genes with Highest Tumor State Noise" 
// // // //                     />
// // // //                   )}
// // // //                 </div>
// // // //               </div>
// // // //             )}
// // // //           </div>
// // // //         </div>
// // // //       </div>
// // // //       <footer className="bg-gray-100 text-gray-700 text-m mt-10 p-8 text-center border-t border-gray-300">
// // // //       <p className=" text-blue-700 mt-4">© 2025 BIRL — This website is free and open to all users and there is no login requirement.</p>
// // // //       <p className="font-semibold text-blue-700 mt-4">Biomedical Informatics & Engineering Research Laboratory, Lahore University of Management Sciences</p>
// // // //       <p className=" text-blue-700 mt-4">DHA, Lahore, Pakistan</p>
// // // //       <p className=" text-blue-700 mt-4">+92 (42) 3560 8352</p>
// // // //     </footer>
// // // //     </div>
// // // //   );
// // // // };

// // // // export default TumourResults;
// // // import { useState, useEffect, useRef } from "react";
// // // import { useSearchParams, Link } from "react-router-dom";
// // // import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
// // // import { Button } from "@/components/ui/button";
// // // import { Checkbox } from "@/components/ui/checkbox";
// // // import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
// // // import { Label } from "@/components/ui/label";
// // // import { ArrowLeft, Download, Box, ChevronRight, ChevronDown } from "lucide-react";
// // // import supabase from "@/supabase-client";
// // // import { 
// // //   ResponsiveContainer, 
// // //   XAxis, 
// // //   YAxis, 
// // //   CartesianGrid, 
// // //   Tooltip,
// // //   ComposedChart,
// // //   Bar,
// // //   ErrorBar,
// // //   Scatter
// // // } from "recharts";
// // // import { calculateDepth2, Depth2Metrics } from "@/json/depth2_calc";
// // // import { calculateTITH } from "@/json/tITH_calc";
// // // import { mean, variance, mad } from "mathjs";

// // // const TumourResults = () => {
// // //   const [searchParams] = useSearchParams();
// // //   const cancerType = searchParams.get('cancerType') || '';
  
// // //   // Filter states
// // //   const [normalizationMethod, setNormalizationMethod] = useState('TPM');
// // //   const [selectedNoiseMetrics, setSelectedNoiseMetrics] = useState<string[]>(['DEPTH2', 'DEPTH - tITH']);
// // //   const [isAllCollapsed, setIsAllCollapsed] = useState(false);
// // //   const [visiblePlots, setVisiblePlots] = useState({
// // //     depth2: true,
// // //     tith: true,
// // //     diffNoise: true,
// // //     normalNoise: true,
// // //     tumorNoise: true
// // //   });

// // //   // Refs for chart containers
// // //   const chartRefs = useRef<{[key: string]: any}>({});

// // //   // Noise metric options
// // //   const noiseMetrics = {
// // //     'DEPTH2': 'depth2',
// // //     'DEPTH - tITH': 'tith'
// // //   };

// // //   // Handle noise metric selection
// // //   const handleNoiseMetricToggle = (metric: string) => {
// // //     setSelectedNoiseMetrics(prev => 
// // //       prev.includes(metric) 
// // //         ? prev.filter(m => m !== metric)
// // //         : [...prev, metric]
// // //     );
// // //   };

// // //   // Handle collapse all toggle
// // //   const handleCollapseAll = () => {
// // //     setIsAllCollapsed(!isAllCollapsed);
// // //     setVisiblePlots(prev => {
// // //       const newPlots = { ...prev };
// // //       Object.keys(newPlots).forEach(key => {
// // //         newPlots[key] = !isAllCollapsed;
// // //       });
// // //       return newPlots;
// // //     });
// // //   };

// // //   // Handle individual plot visibility
// // //   const handlePlotToggle = (plotKey: string) => {
// // //     setVisiblePlots(prev => ({
// // //       ...prev,
// // //       [plotKey]: !prev[plotKey]
// // //     }));
// // //   };
  
// // //   const applyFilters = () => {
// // //     console.log('Applying filters:', {
// // //       normalizationMethod,
// // //       selectedNoiseMetrics
// // //     });
// // //     setVisiblePlots(prev => ({
// // //       ...prev,
// // //       depth2: selectedNoiseMetrics.includes('DEPTH2'),
// // //       tith: selectedNoiseMetrics.includes('DEPTH - tITH'),
// // //       diffNoise: true,
// // //       normalNoise: true,
// // //       tumorNoise: true
// // //     }));
// // //   };

// // //   const fetchTumorSamples = async (cancerType: string) => {
// // //   const { data: cancerTypeData, error: cancerTypeError } = await supabase
// // //           .from('cancer_types')
// // //           .select('id')
// // //           .eq('tcga_code', cancerType)
// // //           .single();
// // //   if (cancerTypeError) throw cancerTypeError;
// // //     const cancerTypeId = cancerTypeData.id;

// // //   const { data: samplesData, error: samplesError } = await supabase
// // //           .from('samples')
// // //           .select('id, sample_barcode, sample_type')
// // //           .eq('sample_type', 'Tumor')
// // //           .eq('cancer_type_id', cancerTypeId);
// // //   // const { data, error } = await supabase
// // //   //     .from('samples')
// // //   //     .select('*')
// // //   //     .eq('sample_type', 'Tumor') as any;
// // //     console.log('samples:', samplesData);
// // //     if (samplesError) {
// // //       console.error('Error fetching samples:', samplesError);
// // //       return [];
// // //     }
// // //     return samplesData || [];
// // //     // Filter manually by cancer type from nested field
// // //     // return data.filter((sample) => sample.cancer_types?.tcga_code === cancerType);
// // //   };

// // //   const fetchExpressionValues = async (sampleIds: string[], normalizationMethod: string) => {
// // //   const { data, error } = await supabase
// // //     .from('expression_values')
// // //     .select(`
// // //       gene_id,
// // //       sample_id,
// // //       ${normalizationMethod.toLowerCase()},
// // //       genes ( gene_symbol )
// // //     `)
// // //     .in('sample_id', sampleIds) as any;

// // //   if (error) {
// // //       console.error('Error fetching expression values:', error);
// // //       return [];
// // //     }
// // //     console.log("Expression values fetched:", data);


// // //     return data;
// // //   };

// // //   const fetchTumorExpressionData = async (normalizationMethod: string, cancerType: string) => {
// // //     console.log("🧪 Step 1: Fetching samples...");
// // //     const samples = await fetchTumorSamples(cancerType);
// // //     console.log("Samples returned:", samples);

// // //     if (samples.length === 0) {
// // //       console.warn("⚠️ No tumor samples found for:", cancerType);
// // //       return [];
// // //     }

// // //     const sampleIdMap: { [id: string]: any } = {};
// // //     const sampleIds = samples.map(s => {
// // //       sampleIdMap[s.id] = s;
// // //       return s.id;
// // //     });

// // //     console.log("🧪 Step 2: Fetching expression values for sample IDs:", sampleIds);

// // //     const expressionData = await fetchExpressionValues(sampleIds, normalizationMethod);
// // //     console.log("Expression values returned:", expressionData);

// // //     if (!expressionData || expressionData.length === 0) {
// // //       console.warn("⚠️ No expression data found.");
// // //       return [];
// // //     }

// // //     const sampleMap: { [barcode: string]: any } = {};

// // //     expressionData.forEach(entry => {
// // //       const sample = sampleIdMap[entry.sample_id];
// // //       const sampleBarcode = sample?.sample_barcode;
// // //       const geneSymbol = entry.genes?.gene_symbol;
// // //       const value = entry[normalizationMethod.toLowerCase()];

// // //       if (!sampleBarcode || !geneSymbol || value == null) return;

// // //       if (!sampleMap[sampleBarcode]) {
// // //         sampleMap[sampleBarcode] = {
// // //           sample: sampleBarcode,
// // //           geneData: []
// // //         };
// // //       }

// // //       sampleMap[sampleBarcode].geneData.push({ gene: geneSymbol, value });
// // //     });
// // //     // Your existing logic here...

// // //     // const formattedData = Object.values(sampleMap).map(...);
// // //     const formattedData = Object.values(sampleMap).map((sample: any) => {
// // //       const values = sample.geneData.map((g: any) => g.value).filter(v => !isNaN(v));

// // //       if (values.length === 0) return null;

// // //       const {
// // //         depth2, depth2Q1, depth2Q3, depth2Min, depth2Max, depth2Median
// // //       } = calculateDepth2(values);

// // //       const tith = calculateTITH(values);
// // //       const diffNoise = variance(values);
// // //       const normalNoise = mad(values);
// // //       const tumorNoise = depth2;

// // //       return {
// // //         gene: sample.sample,
// // //         [normalizationMethod.toLowerCase()]: mean(values),
// // //         depth2,
// // //         depth2Q1,
// // //         depth2Q3,
// // //         depth2Min,
// // //         depth2Max,
// // //         depth2Median,
// // //         tith,
// // //         diffNoise,
// // //         normalNoise,
// // //         tumorNoise,
// // //         tumorSamples: values.length
// // //       };
// // //     }).filter(Boolean);

// // //     console.log("✅ Final tumor data:", formattedData);
// // //     return formattedData;
// // //   };


// // //   const [tumorData, setTumorData] = useState<any[]>([]);

// // //   // useEffect(() => {
// // //   //   const loadData = async () => {
// // //   //     const data = await fetchTumorExpressionData(normalizationMethod, cancerType);
      
// // //   //     setTumorData(data);
// // //   //   };

// // //   //   loadData();
// // //   // }, [cancerType, normalizationMethod]);

// // //   useEffect(() => {
// // //     const loadData = async () => {
// // //       const data = await fetchTumorExpressionData(normalizationMethod, cancerType);
// // //       setTumorData(data);
// // //     };

// // //     loadData();
// // //   }, [normalizationMethod, cancerType]);


// // //   const getCancerTypeLabel = (type: string) => {
// // //     const labels: { [key: string]: string } = {
// // //       "TCGA-BRCA": "Breast Cancer (BRCA)",
// // //       "TCGA-LUAD": "Lung Cancer (LUAD)",
// // //       "TCGA-PRAD": "Prostate Cancer (PRAD)",
// // //       "TCGA-COAD": "Colorectal Cancer (COAD)",
// // //       "TCGA-LIHC": "Liver Cancer (LIHC)",
// // //       "TCGA-KIRC": "Kidney Cancer (KIRC)",
// // //       "TCGA-STAD": "Stomach Cancer (STAD)",
// // //       "TCGA-OV": "Ovarian Cancer (OV)",
// // //       "TCGA-BLCA": "Bladder Cancer (BLCA)"
// // //     };
// // //     return labels[type] || type;
// // //   };

// // //   const downloadChart = (chartKey: string, chartName: string) => {
// // //     const chartElement = chartRefs.current[chartKey];
// // //     if (chartElement) {
// // //       const svg = chartElement.querySelector('svg');
// // //       if (svg) {
// // //         const canvas = document.createElement('canvas');
// // //         const ctx = canvas.getContext('2d');
// // //         const img = new Image();
        
// // //         const svgData = new XMLSerializer().serializeToString(svg);
// // //         const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
// // //         const url = URL.createObjectURL(svgBlob);
        
// // //         img.onload = function() {
// // //           canvas.width = img.width || 800;
// // //           canvas.height = img.height || 400;
// // //           ctx?.drawImage(img, 0, 0);
          
// // //           canvas.toBlob((blob) => {
// // //             if (blob) {
// // //               const link = document.createElement('a');
// // //               link.download = `${chartName.replace(/\s+/g, '_').toLowerCase()}_${Date.now()}.png`;
// // //               link.href = URL.createObjectURL(blob);
// // //               link.click();
// // //               URL.revokeObjectURL(link.href);
// // //             }
// // //           });
// // //           URL.revokeObjectURL(url);
// // //         };
// // //         img.src = url;
// // //       }
// // //     }
// // //   };

// // //   const colors = ['#2563eb', '#059669', '#dc2626', '#7c3aed', '#ea580c'];

// // //   // Custom boxplot component
// // //   const BoxplotBar = ({ data, dataKey, color, title }: any) => (
// // //     <Card className="border-0 shadow-lg">
// // //       <CardHeader className="pb-2">
// // //         <CardTitle className="flex items-center justify-between text-sm">
// // //           <div className="flex items-center space-x-2">
// // //             <Box className="h-4 w-4" style={{ color }} />
// // //             <span>{title}</span>
// // //           </div>
// // //           <Button 
// // //             size="sm" 
// // //             variant="outline" 
// // //             onClick={() => downloadChart(`boxplot-${dataKey}`, title)}
// // //             className="h-6 px-2 text-xs"
// // //           >
// // //             <Download className="h-3 w-3" />
// // //           </Button>
// // //         </CardTitle>
// // //       </CardHeader>
// // //       <CardContent className="pt-0">
// // //         <div ref={el => chartRefs.current[`boxplot-${dataKey}`] = el}>
// // //           <ResponsiveContainer width="100%" height={200}>
// // //             <ComposedChart data={data} margin={{ top: 5, right: 5, left: 5, bottom: 25 }}>
// // //               <CartesianGrid strokeDasharray="3 3" />
// // //               <XAxis 
// // //                 dataKey="sample" 
// // //                 tick={{ fontSize: 10 }}
// // //                 label={{ 
// // //                   value: 'Samples', 
// // //                   position: 'insideBottom', 
// // //                   offset: -10, 
// // //                   style: { fontSize: '10px' } 
// // //                 }}
// // //               />
// // //               <YAxis 
// // //                 tick={{ fontSize: 10 }}
// // //                 label={{ 
// // //                   value: title, 
// // //                   angle: -90, 
// // //                   position: 'insideLeft', 
// // //                   style: { fontSize: '10px' } 
// // //                 }} 
// // //               />
// // //               <Tooltip 
// // //                 formatter={(value: any) => [
// // //                   typeof value === 'number' ? value.toFixed(2) : value,
// // //                   title,
// // //                 ]} 
// // //               />
// // //               <Bar dataKey={`${dataKey}Median`} fill={color}>
// // //                 <ErrorBar dataKey={`${dataKey}Min`} width={4} stroke={color} />
// // //                 <ErrorBar dataKey={`${dataKey}Max`} width={4} stroke={color} />
// // //               </Bar>
// // //             </ComposedChart>
// // //           </ResponsiveContainer>
// // //         </div>
// // //       </CardContent>
// // //     </Card>
// // //   );

// // //   // Custom scatter plot component for tITH
// // //   const ScatterPlot = ({ data, dataKey, color, title }: any) => (
// // //     <Card className="border-0 shadow-lg">
// // //       <CardHeader className="pb-2">
// // //         <CardTitle className="flex items-center justify-between text-sm">
// // //           <div className="flex items-center space-x-2">
// // //             <Box className="h-4 w-4" style={{ color }} />
// // //             <span>{title}</span>
// // //           </div>
// // //           <Button 
// // //             size="sm" 
// // //             variant="outline" 
// // //             onClick={() => downloadChart(`scatter-${dataKey}`, title)}
// // //             className="h-6 px-2 text-xs"
// // //           >
// // //             <Download className="h-3 w-3" />
// // //           </Button>
// // //         </CardTitle>
// // //       </CardHeader>
// // //       <CardContent className="pt-0">
// // //         <div ref={el => chartRefs.current[`scatter-${dataKey}`] = el}>
// // //           <ResponsiveContainer width="100%" height={200}>
// // //             <ComposedChart data={data} margin={{ top: 5, right: 5, left: 5, bottom: 25 }}>
// // //               <CartesianGrid strokeDasharray="3 3" />
// // //               <XAxis 
// // //                 dataKey="sample" 
// // //                 tick={{ fontSize: 10 }}
// // //                 label={{ 
// // //                   value: 'Samples', 
// // //                   position: 'insideBottom', 
// // //                   offset: -10, 
// // //                   style: { fontSize: '10px' } 
// // //                 }}
// // //               />
// // //               <YAxis 
// // //                 tick={{ fontSize: 10 }}
// // //                 label={{ 
// // //                   value: title, 
// // //                   angle: -90, 
// // //                   position: 'insideLeft', 
// // //                   style: { fontSize: '10px' } 
// // //                 }} 
// // //               />
// // //               <Tooltip 
// // //                 formatter={(value: any) => [
// // //                   typeof value === 'number' ? value.toFixed(2) : value,
// // //                   title,
// // //                 ]} 
// // //               />
// // //               <Scatter dataKey={dataKey} fill={color} />
// // //             </ComposedChart>
// // //           </ResponsiveContainer>
// // //         </div>
// // //       </CardContent>
// // //     </Card>
// // //   );

// // //   // Custom bar chart component for noise rankings
// // //   const BarChart = ({ data, dataKey, color, title }: any) => (
// // //     <Card className="border-0 shadow-lg">
// // //       <CardHeader className="pb-2">
// // //         <CardTitle className="flex items-center justify-between text-sm">
// // //           <div className="flex items-center space-x-2">
// // //             <Box className="h-4 w-4" style={{ color }} />
// // //             <span>{title}</span>
// // //           </div>
// // //           <Button 
// // //             size="sm" 
// // //             variant="outline" 
// // //             onClick={() => downloadChart(`bar-${dataKey}`, title)}
// // //             className="h-6 px-2 text-xs"
// // //           >
// // //             <Download className="h-3 w-3" />
// // //           </Button>
// // //         </CardTitle>
// // //       </CardHeader>
// // //       <CardContent className="pt-0">
// // //         <div ref={el => chartRefs.current[`bar-${dataKey}`] = el}>
// // //           <ResponsiveContainer width="100%" height={200}>
// // //             <ComposedChart data={data} margin={{ top: 5, right: 5, left: 5, bottom: 25 }}>
// // //               <CartesianGrid strokeDasharray="3 3" />
// // //               <XAxis 
// // //                 dataKey="sample" 
// // //                 tick={{ fontSize: 10 }}
// // //                 label={{ 
// // //                   value: 'Genes', 
// // //                   position: 'insideBottom', 
// // //                   offset: -10, 
// // //                   style: { fontSize: '10px' } 
// // //                 }}
// // //               />
// // //               <YAxis 
// // //                 tick={{ fontSize: 10 }}
// // //                 label={{ 
// // //                   value: title, 
// // //                   angle: -90, 
// // //                   position: 'insideLeft', 
// // //                   style: { fontSize: '10px' } 
// // //                 }} 
// // //               />
// // //               <Tooltip 
// // //                 formatter={(value: any) => [
// // //                   typeof value === 'number' ? value.toFixed(2) : value,
// // //                   title,
// // //                 ]} 
// // //               />
// // //               <Bar dataKey={dataKey} fill={color} />
// // //             </ComposedChart>
// // //           </ResponsiveContainer>
// // //         </div>
// // //       </CardContent>
// // //     </Card>
// // //   );

// // //   return (
// // //     <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-yellow-50">
// // //       <header className="bg-white shadow-sm border-b border-blue-100">
// // //         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
// // //           <div className="flex items-center justify-between">
// // //             <div className="flex items-center space-x-3">
// // //               <h1 className="text-2xl font-bold text-blue-900">Tumor Analysis Results</h1>
// // //             </div>
// // //             <nav className="flex space-x-6">
// // //               <Link to="/" className="text-blue-700 hover:text-blue-600 font-medium transition-colors">
// // //                 Home
// // //               </Link>
// // //               <Link to="/gene-analysis" className="text-blue-700 hover:text-blue-600 font-medium transition-colors">
// // //                 Gene Analysis
// // //               </Link>
// // //               <Link to="/pathway-analysis" className="text-blue-700 hover:text-blue-600 font-medium transition-colors">
// // //                 Pathway Analysis
// // //               </Link>
// // //               <Link to="/tumour-analysis" className="text-blue-500 font-medium">
// // //                 Tumor Analysis
// // //               </Link>
// // //             </nav>
// // //           </div>
// // //         </div>
// // //       </header>

// // //       <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
// // //         <div className="flex gap-6">
// // //           {/* Left Sidebar - Filters */}
// // //           <div className="w-80 flex-shrink-0">
// // //             <Card className="border-0 shadow-lg bg-blue-100">
// // //               <CardHeader className="pb-4">
// // //                 <CardTitle className="text-blue-900">
// // //                   Filters
// // //                 </CardTitle>
// // //               </CardHeader>
// // //               <CardContent className="space-y-6">
// // //                 {/* Expression Normalization Method */}
// // //                 <div>
// // //                   <h3 className="font-semibold text-blue-900 mb-3">Expression Normalization Method</h3>
// // //                   <RadioGroup value={normalizationMethod} onValueChange={setNormalizationMethod}>
// // //                     <div className="flex items-center space-x-2">
// // //                       <RadioGroupItem value="TPM" id="tpm" />
// // //                       <Label htmlFor="tpm">TPM</Label>
// // //                     </div>
// // //                     <div className="flex items-center space-x-2">
// // //                       <RadioGroupItem value="FPKM" id="fpkm" />
// // //                       <Label htmlFor="fpkm">FPKM</Label>
// // //                     </div>
// // //                     <div className="flex items-center space-x-2">
// // //                       <RadioGroupItem value="FPKM_UQ" id="fpkm_uq" />
// // //                       <Label htmlFor="fpkm_uq">FPKM_UQ</Label>
// // //                     </div>
// // //                   </RadioGroup>
// // //                 </div>

// // //                 {/* Noise Metrics */}
// // //                 <div>
// // //                   <h3 className="font-semibold text-blue-900 mb-3">Noise Metrics</h3>
// // //                   <div className="space-y-2">
// // //                     {Object.keys(noiseMetrics).map((metric) => (
// // //                       <div key={metric} className="flex items-center space-x-2">
// // //                         <Checkbox
// // //                           id={`noise-${metric}`}
// // //                           checked={selectedNoiseMetrics.includes(metric)}
// // //                           onCheckedChange={() => handleNoiseMetricToggle(metric)}
// // //                         />
// // //                         <Label htmlFor={`noise-${metric}`} className="text-sm">{metric}</Label>
// // //                       </div>
// // //                     ))}
// // //                   </div>
// // //                 </div>

// // //                 {/* Plot Visibility Controls */}
// // //                 <div>
// // //                   <h3 className="font-semibold text-blue-900 mb-3">Analysis Plots</h3>
// // //                   <div className="space-y-2">
// // //                     <div className="flex items-center space-x-2">
// // //                       <Checkbox
// // //                         id="depth2"
// // //                         checked={visiblePlots.depth2}
// // //                         onCheckedChange={() => handlePlotToggle('depth2')}
// // //                       />
// // //                       <Label htmlFor="depth2" className="text-sm">DEPTH2 Boxplot</Label>
// // //                     </div>
// // //                     <div className="flex items-center space-x-2">
// // //                       <Checkbox
// // //                         id="tith"
// // //                         checked={visiblePlots.tith}
// // //                         onCheckedChange={() => handlePlotToggle('tith')}
// // //                       />
// // //                       <Label htmlFor="tith" className="text-sm">tITH Scatter Plot</Label>
// // //                     </div>
// // //                     <div className="flex items-center space-x-2">
// // //                       <Checkbox
// // //                         id="diffNoise"
// // //                         checked={visiblePlots.diffNoise}
// // //                         onCheckedChange={() => handlePlotToggle('diffNoise')}
// // //                       />
// // //                       <Label htmlFor="diffNoise" className="text-sm">Differential Noise</Label>
// // //                     </div>
// // //                     <div className="flex items-center space-x-2">
// // //                       <Checkbox
// // //                         id="normalNoise"
// // //                         checked={visiblePlots.normalNoise}
// // //                         onCheckedChange={() => handlePlotToggle('normalNoise')}
// // //                       />
// // //                       <Label htmlFor="normalNoise" className="text-sm">Normal State Noise</Label>
// // //                     </div>
// // //                     <div className="flex items-center space-x-2">
// // //                       <Checkbox
// // //                         id="tumorNoise"
// // //                         checked={visiblePlots.tumorNoise}
// // //                         onCheckedChange={() => handlePlotToggle('tumorNoise')}
// // //                       />
// // //                       <Label htmlFor="tumorNoise" className="text-sm">Tumor State Noise</Label>
// // //                     </div>
// // //                   </div>
// // //                 </div>
// // //                 <Button 
// // //                   variant="outline" 
// // //                   className="w-full justify-between bg-blue-600 text-white hover:bg-blue-700"
// // //                   onClick={handleCollapseAll}
// // //                 >
// // //                   {isAllCollapsed ? 'Unselect All' : 'Select All'}
// // //                   {isAllCollapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
// // //                 </Button>
// // //                 <Button onClick={applyFilters} className="w-full bg-blue-600 hover:bg-blue-700">
// // //                   Apply
// // //                 </Button>
// // //               </CardContent>
// // //             </Card>
// // //           </div>

// // //           {/* Main Content */}
// // //           <div className="flex-1">
// // //             <Link to="/gene-analysis" className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-6 transition-colors">
// // //               <ArrowLeft className="h-4 w-4 mr-2" />
// // //               Back to Gene Analysis
// // //             </Link>

// // //             <div className="mb-8">
// // //               <h2 className="text-4xl font-bold text-blue-900 mb-2">
// // //                 Results for {getCancerTypeLabel(cancerType)}
// // //               </h2>
// // //             </div>

// // //             {/* DEPTH2 and tITH Plots */}
// // //             {(visiblePlots.depth2 || visiblePlots.tith) && (
// // //               <div className="mb-8">
// // //                 <h3 className="text-2xl font-bold text-blue-900 mb-4">Tumor Heterogeneity Metrics</h3>
// // //                 <div className="grid lg:grid-cols-2 md:grid-cols-1 gap-4">
// // //                   {visiblePlots.depth2 && (
// // //                     <BoxplotBar 
// // //                       data={tumorData} 
// // //                       dataKey="depth2" 
// // //                       color="#ea580c" 
// // //                       title="DEPTH2 Scores" 
// // //                     />
// // //                   )}
// // //                   {visiblePlots.tith && (
// // //                     <ScatterPlot 
// // //                       data={tumorData} 
// // //                       dataKey="tith" 
// // //                       color="#2563eb" 
// // //                       title="Transcriptome-based Intra-Tumor Heterogeneity (tITH)" 
// // //                     />
// // //                   )}
// // //                 </div>
// // //               </div>
// // //             )}

// // //             {/* Noise Rankings */}
// // //             {(visiblePlots.diffNoise || visiblePlots.normalNoise || visiblePlots.tumorNoise) && (
// // //               <div className="mb-8">
// // //                 <h3 className="text-2xl font-bold text-blue-900 mb-4">Noise Rankings</h3>
// // //                 <div className="grid lg:grid-cols-3 md:grid-cols-1 gap-4">
// // //                   {visiblePlots.diffNoise && (
// // //                     <BarChart 
// // //                       data={tumorData.slice(0, 5)} 
// // //                       dataKey="diffNoise" 
// // //                       color="#dc2626" 
// // //                       title="Samples with Highest Differential Noise" 
// // //                     />
// // //                   )}
// // //                   {visiblePlots.normalNoise && (
// // //                     <BarChart 
// // //                       data={tumorData.slice(0, 5)} 
// // //                       dataKey="normalNoise" 
// // //                       color="#059669" 
// // //                       title="Samples with Highest Normal State Noise" 
// // //                     />
// // //                   )}
// // //                   {visiblePlots.tumorNoise && (
// // //                     <BarChart 
// // //                       data={tumorData.slice(0, 5)} 
// // //                       dataKey="tumorNoise" 
// // //                       color="#7c3aed" 
// // //                       title="Samples with Highest Tumor State Noise" 
// // //                     />
// // //                   )}
// // //                 </div>
// // //               </div>
// // //             )}
// // //           </div>
// // //         </div>
// // //       </div>
// // //       <footer className="bg-gray-100 text-gray-700 text-m mt-10 p-8 text-center border-t border-gray-300">
// // //         <p className="text-blue-700 mt-4">© 2025 BIRL — This website is free and open to all users and there is no login requirement.</p>
// // //         <p className="font-semibold text-blue-700 mt-4">Biomedical Informatics & Engineering Research Laboratory, Lahore University of Management Sciences</p>
// // //         <p className="text-blue-700 mt-4">DHA, Lahore, Pakistan</p>
// // //         <p className="text-blue-700 mt-4">+92 (42) 3560 8352</p>
// // //       </footer>
// // //     </div>
// // //   );
// // // };

// // // export default TumourResults;
// // import { useState, useEffect, useRef } from "react";
// // import { useSearchParams, Link } from "react-router-dom";
// // import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
// // import { Button } from "@/components/ui/button";
// // import { Checkbox } from "@/components/ui/checkbox";
// // import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
// // import { Label } from "@/components/ui/label";
// // import { ArrowLeft, Download, Box, ChevronRight, ChevronDown, Users } from "lucide-react";
// // import supabase from "@/supabase-client";
// // import { 
// //   ResponsiveContainer, 
// //   XAxis, 
// //   YAxis, 
// //   CartesianGrid, 
// //   Tooltip,
// //   ComposedChart,
// //   Bar,
// //   ErrorBar,
// //   Scatter
// // } from "recharts";
// // import { calculateDepth2, Depth2Metrics } from "@/json/depth2_calc";
// // import { calculateTITH } from "@/json/tITH_calc";
// // import { mean, variance, mad } from "mathjs";

// // // Utility to debounce state updates
// // const debounce = (func, wait) => {
// //   let timeout;
// //   return (...args) => {
// //     clearTimeout(timeout);
// //     timeout = setTimeout(() => func(...args), wait);
// //   };
// // };

// // const TumourResults = () => {
// //   const [searchParams] = useSearchParams();
// //   const cancerType = searchParams.get('cancerType') || '';
  
// //   // Filter states
// //   const [normalizationMethod, setNormalizationMethod] = useState('tpm');
// //   const [selectedNoiseMetrics, setSelectedNoiseMetrics] = useState(['DEPTH2', 'DEPTH - tITH']);
// //   const [isNoiseMetricsOpen, setIsNoiseMetricsOpen] = useState(false);
// //   const [isAnalysisPlotsOpen, setIsAnalysisPlotsOpen] = useState(false);
// //   const [visiblePlots, setVisiblePlots] = useState({
// //     depth2: true,
// //     tith: true,
// //     diffNoise: true,
// //     normalNoise: true,
// //     tumorNoise: true
// //   });
// //   const [totalTumorSamples, setTotalTumorSamples] = useState(0);
// //   const chartRefs = useRef<{[key: string]: any}>({});

// //   // Noise metric options
// //   const noiseMetrics = {
// //     'DEPTH2': 'depth2',
// //     'DEPTH - tITH': 'tith'
// //   };

// //   const allNoiseMetrics = Object.keys(noiseMetrics);
// //   const areAllNoiseSelected = allNoiseMetrics.every(metric => selectedNoiseMetrics.includes(metric));

// //   const allPlotKeys = ['depth2', 'tith', 'diffNoise', 'normalNoise', 'tumorNoise'];
// //   const areAllPlotsSelected = allPlotKeys.every(plot => visiblePlots[plot]);

// //   // Handle noise metric selection
// //   const handleNoiseMetricToggle = debounce((metric) => {
// //     setSelectedNoiseMetrics(prev => 
// //       prev.includes(metric) 
// //         ? prev.filter(m => m !== metric)
// //         : [...prev, metric]
// //     );
// //   }, 100);

// //   // Handle master checkbox for noise metrics
// //   const toggleAllNoiseMetrics = debounce((checked) => {
// //     setSelectedNoiseMetrics(checked ? allNoiseMetrics : []);
// //   }, 100);

// //   // Handle individual plot visibility
// //   const handlePlotToggle = debounce((plotKey) => {
// //     setVisiblePlots(prev => ({
// //       ...prev,
// //       [plotKey]: !prev[plotKey]
// //     }));
// //   }, 100);

// //   // Handle master checkbox for plots
// //   const toggleAllPlots = debounce((checked) => {
// //     setVisiblePlots(prev => ({
// //       ...prev,
// //       ...Object.fromEntries(allPlotKeys.map(plot => [plot, checked]))
// //     }));
// //   }, 100);

// //   const applyFilters = () => {
// //     console.log('Applying filters:', {
// //       normalizationMethod,
// //       selectedNoiseMetrics,
// //       visiblePlots
// //     });
// //     setVisiblePlots(prev => ({
// //       ...prev,
// //       depth2: selectedNoiseMetrics.includes('DEPTH2'),
// //       tith: selectedNoiseMetrics.includes('DEPTH - tITH'),
// //       diffNoise: true,
// //       normalNoise: true,
// //       tumorNoise: true
// //     }));
// //   };

// //   const fetchTumorSamples = async (cancerType: string) => {
// //     const { data: cancerTypeData, error: cancerTypeError } = await supabase
// //       .from('cancer_types')
// //       .select('id')
// //       .eq('tcga_code', cancerType)
// //       .single();
// //     if (cancerTypeError) throw cancerTypeError;
// //     const cancerTypeId = cancerTypeData.id;

// //     const { data: samplesData, error: samplesError } = await supabase
// //       .from('samples')
// //       .select('id, sample_barcode, sample_type')
// //       .eq('sample_type', 'Tumor')
// //       .eq('cancer_type_id', cancerTypeId);
    
// //     console.log('samples:', samplesData);
// //     if (samplesError) {
// //       console.error('Error fetching samples:', samplesError);
// //       return [];
// //     }
// //     setTotalTumorSamples(samplesData.length);
// //     return samplesData || [];
// //   };

// //   const fetchExpressionValues = async (sampleIds: string[], normalizationMethod: string) => {
// //     const { data, error } = await supabase
// //       .from('expression_values')
// //       .select(`
// //         gene_id,
// //         sample_id,
// //         ${normalizationMethod},
// //         genes ( gene_symbol )
// //       `)
// //       .in('sample_id', sampleIds);

// //     if (error) {
// //       console.error('Error fetching expression values:', error);
// //       return [];
// //     }
// //     console.log("Expression values fetched:", data);
// //     return data;
// //   };

// //   const fetchTumorExpressionData = async (normalizationMethod: string, cancerType: string) => {
// //     console.log("🧪 Step 1: Fetching samples...");
// //     const samples = await fetchTumorSamples(cancerType);
// //     console.log("Samples returned:", samples);

// //     if (samples.length === 0) {
// //       console.warn("⚠️ No tumor samples found for:", cancerType);
// //       return [];
// //     }

// //     const sampleIdMap: { [id: string]: any } = {};
// //     const sampleIds = samples.map(s => {
// //       sampleIdMap[s.id] = s;
// //       return s.id;
// //     });

// //     console.log("🧪 Step 2: Fetching expression values for sample IDs:", sampleIds);

// //     const expressionData = await fetchExpressionValues(sampleIds, normalizationMethod);
// //     console.log("Expression values returned:", expressionData);

// //     if (!expressionData || expressionData.length === 0) {
// //       console.warn("⚠️ No expression data found.");
// //       return [];
// //     }

// //     const sampleMap: { [barcode: string]: any } = {};

// //     expressionData.forEach(entry => {
// //       const sample = sampleIdMap[entry.sample_id];
// //       const sampleBarcode = sample?.sample_barcode;
// //       const geneSymbol = entry.genes?.gene_symbol;
// //       const value = entry[normalizationMethod.toLowerCase()];

// //       if (!sampleBarcode || !geneSymbol || value == null) return;

// //       if (!sampleMap[sampleBarcode]) {
// //         sampleMap[sampleBarcode] = {
// //           sample: sampleBarcode,
// //           geneData: []
// //         };
// //       }

// //       sampleMap[sampleBarcode].geneData.push({ gene: geneSymbol, value });
// //     });

// //     const formattedData = Object.values(sampleMap).map((sample: any) => {
// //       const values = sample.geneData.map((g: any) => g.value).filter(v => !isNaN(v));

// //       if (values.length === 0) return null;

// //       const {
// //         depth2, depth2Q1, depth2Q3, depth2Min, depth2Max, depth2Median
// //       } = calculateDepth2(values);

// //       const tith = calculateTITH(values);
// //       const diffNoise = variance(values);
// //       const normalNoise = mad(values);
// //       const tumorNoise = depth2;

// //       return {
// //         gene: sample.sample,
// //         [normalizationMethod.toLowerCase()]: mean(values),
// //         depth2,
// //         depth2Q1,
// //         depth2Q3,
// //         depth2Min,
// //         depth2Max,
// //         depth2Median,
// //         tith,
// //         diffNoise,
// //         normalNoise,
// //         tumorNoise,
// //         tumorSamples: values.length
// //       };
// //     }).filter(Boolean);

// //     console.log("✅ Final tumor data:", formattedData);
// //     return formattedData;
// //   };

// //   const [tumorData, setTumorData] = useState<any[]>([]);

// //   useEffect(() => {
// //     const loadData = async () => {
// //       const data = await fetchTumorExpressionData(normalizationMethod, cancerType);
// //       setTumorData(data);
// //     };

// //     loadData();
// //   }, [normalizationMethod, cancerType]);

// //   const getCancerTypeLabel = (type: string) => {
// //     const labels: { [key: string]: string } = {
// //       "TCGA-BRCA": "Breast Cancer (BRCA)",
// //       "TCGA-LUAD": "Lung Cancer (LUAD)",
// //       "TCGA-PRAD": "Prostate Cancer (PRAD)",
// //       "TCGA-COAD": "Colorectal Cancer (COAD)",
// //       "TCGA-LIHC": "Liver Cancer (LIHC)",
// //       "TCGA-KIRC": "Kidney Cancer (KIRC)",
// //       "TCGA-STAD": "Stomach Cancer (STAD)",
// //       "TCGA-OV": "Ovarian Cancer (OV)",
// //       "TCGA-BLCA": "Bladder Cancer (BLCA)"
// //     };
// //     return labels[type] || type;
// //   };

// //   const downloadChart = (chartKey: string, chartName: string) => {
// //     const chartElement = chartRefs.current[chartKey];
// //     if (chartElement) {
// //       const svg = chartElement.querySelector('svg');
// //       if (svg) {
// //         const canvas = document.createElement('canvas');
// //         const ctx = canvas.getContext('2d');
// //         const img = new Image();
        
// //         const svgData = new XMLSerializer().serializeToString(svg);
// //         const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
// //         const url = URL.createObjectURL(svgBlob);
        
// //         img.onload = function() {
// //           canvas.width = img.width || 800;
// //           canvas.height = img.height || 400;
// //           ctx?.drawImage(img, 0, 0);
          
// //           canvas.toBlob((blob) => {
// //             if (blob) {
// //               const link = document.createElement('a');
// //               link.download = `${chartName.replace(/\s+/g, '_').toLowerCase()}_${Date.now()}.png`;
// //               link.href = URL.createObjectURL(blob);
// //               link.click();
// //               URL.revokeObjectURL(link.href);
// //             }
// //           });
// //           URL.revokeObjectURL(url);
// //         };
// //         img.src = url;
// //       }
// //     }
// //   };

// //   const downloadData = (format: string) => {
// //     const data = tumorData;
// //     let content = '';
// //     let filename = `tumor_analysis_${cancerType}_${Date.now()}`;

// //     if (format === 'csv') {
// //       const excludedKeys = ['tumorValues', 'normalValues', 'combinedValues'];
// //       const keys = Object.keys(data[0] || {}).filter(key => !excludedKeys.includes(key));
// //       const headers = keys.join(',');
// //       const rows = data.map(row => keys.map(key => row[key]).join(','));
// //       content = [headers, ...rows].join('\n');
// //       filename += '.csv';
// //     }

// //     const blob = new Blob([content], { type: format === 'csv' ? 'text/csv' : 'application/json' });
// //     const url = URL.createObjectURL(blob);
// //     const a = document.createElement('a');
// //     a.href = url;
// //     a.download = filename;
// //     a.click();
// //     URL.revokeObjectURL(url);
// //   };

// //   const colors = ['#2563eb', '#059669', '#dc2626', '#7c3aed', '#ea580c'];

// //   // Custom boxplot component
// //   const BoxplotBar = ({ data, dataKey, color, title }: any) => (
// //     <Card className="border-0 shadow-lg">
// //       <CardHeader className="pb-2">
// //         <CardTitle className="flex items-center justify-between text-sm">
// //           <div className="flex items-center space-x-2">
// //             <Box className="h-4 w-4" style={{ color }} />
// //             <span>{title}</span>
// //           </div>
// //           <Button 
// //             size="sm" 
// //             variant="outline" 
// //             onClick={() => downloadChart(`boxplot-${dataKey}`, title)}
// //             className="h-6 px-2 text-xs"
// //           >
// //             <Download className="h-3 w-3" />
// //           </Button>
// //         </CardTitle>
// //       </CardHeader>
// //       <CardContent className="pt-0">
// //         <div ref={el => chartRefs.current[`boxplot-${dataKey}`] = el}>
// //           <ResponsiveContainer width="100%" height={200}>
// //             <ComposedChart data={data} margin={{ top: 5, right: 5, left: 5, bottom: 25 }}>
// //               <CartesianGrid strokeDasharray="3 3" />
// //               <XAxis 
// //                 dataKey="sample" 
// //                 tick={{ fontSize: 10 }}
// //                 label={{ 
// //                   value: 'Samples', 
// //                   position: 'insideBottom', 
// //                   offset: -10, 
// //                   style: { fontSize: '10px' } 
// //                 }}
// //               />
// //               <YAxis 
// //                 tick={{ fontSize: 10 }}
// //                 label={{ 
// //                   value: title, 
// //                   angle: -90, 
// //                   position: 'insideLeft', 
// //                   dy: 55,
// //                   style: { fontSize: '10px' } 
// //                 }} 
// //               />
// //               <Tooltip 
// //                 formatter={(value: any) => [
// //                   typeof value === 'number' ? value.toFixed(2) : value,
// //                   title,
// //                 ]} 
// //               />
// //               <Bar dataKey={`${dataKey}Median`} fill={color}>
// //                 <ErrorBar dataKey={`${dataKey}Min`} width={4} stroke={color} />
// //                 <ErrorBar dataKey={`${dataKey}Max`} width={4} stroke={color} />
// //               </Bar>
// //             </ComposedChart>
// //           </ResponsiveContainer>
// //         </div>
// //       </CardContent>
// //     </Card>
// //   );

// //   // Custom scatter plot component for tITH
// //   const ScatterPlot = ({ data, dataKey, color, title }: any) => (
// //     <Card className="border-0 shadow-lg">
// //       <CardHeader className="pb-2">
// //         <CardTitle className="flex items-center justify-between text-sm">
// //           <div className="flex items-center space-x-2">
// //             <Box className="h-4 w-4" style={{ color }} />
// //             <span>{title}</span>
// //           </div>
// //           <Button 
// //             size="sm" 
// //             variant="outline" 
// //             onClick={() => downloadChart(`scatter-${dataKey}`, title)}
// //             className="h-6 px-2 text-xs"
// //           >
// //             <Download className="h-3 w-3" />
// //           </Button>
// //         </CardTitle>
// //       </CardHeader>
// //       <CardContent className="pt-0">
// //         <div ref={el => chartRefs.current[`scatter-${dataKey}`] = el}>
// //           <ResponsiveContainer width="100%" height={200}>
// //             <ComposedChart data={data} margin={{ top: 5, right: 5, left: 5, bottom: 25 }}>
// //               <CartesianGrid strokeDasharray="3 3" />
// //               <XAxis 
// //                 dataKey="sample" 
// //                 tick={{ fontSize: 10 }}
// //                 label={{ 
// //                   value: 'Samples', 
// //                   position: 'insideBottom', 
// //                   offset: -10, 
// //                   style: { fontSize: '10px' } 
// //                 }}
// //               />
// //               <YAxis 
// //                 tick={{ fontSize: 10 }}
// //                 label={{ 
// //                   value: title, 
// //                   angle: -90, 
// //                   position: 'insideLeft', 
// //                   dy: 55,
// //                   style: { fontSize: '10px' } 
// //                 }} 
// //               />
// //               <Tooltip 
// //                 formatter={(value: any) => [
// //                   typeof value === 'number' ? value.toFixed(2) : value,
// //                   title,
// //                 ]} 
// //               />
// //               <Scatter dataKey={dataKey} fill={color} />
// //             </ComposedChart>
// //           </ResponsiveContainer>
// //         </div>
// //       </CardContent>
// //     </Card>
// //   );

// //   // Custom bar chart component for noise rankings
// //   const BarChart = ({ data, dataKey, color, title }: any) => (
// //     <Card className="border-0 shadow-lg">
// //       <CardHeader className="pb-2">
// //         <CardTitle className="flex items-center justify-between text-sm">
// //           <div className="flex items-center space-x-2">
// //             <Box className="h-4 w-4" style={{ color }} />
// //             <span>{title}</span>
// //           </div>
// //           <Button 
// //             size="sm" 
// //             variant="outline" 
// //             onClick={() => downloadChart(`bar-${dataKey}`, title)}
// //             className="h-6 px-2 text-xs"
// //           >
// //             <Download className="h-3 w-3" />
// //           </Button>
// //         </CardTitle>
// //       </CardHeader>
// //       <CardContent className="pt-0">
// //         <div ref={el => chartRefs.current[`bar-${dataKey}`] = el}>
// //           <ResponsiveContainer width="100%" height={200}>
// //             <ComposedChart data={data} margin={{ top: 5, right: 5, left: 5, bottom: 25 }}>
// //               <CartesianGrid strokeDasharray="3 3" />
// //               <XAxis 
// //                 dataKey="sample" 
// //                 tick={{ fontSize: 10 }}
// //                 label={{ 
// //                   value: 'Samples', 
// //                   position: 'insideBottom', 
// //                   offset: -10, 
// //                   style: { fontSize: '10px' } 
// //                 }}
// //               />
// //               <YAxis 
// //                 tick={{ fontSize: 10 }}
// //                 label={{ 
// //                   value: title, 
// //                   angle: -90, 
// //                   position: 'insideLeft', 
// //                   dy: 55,
// //                   style: { fontSize: '10px' } 
// //                 }} 
// //               />
// //               <Tooltip 
// //                 formatter={(value: any) => [
// //                   typeof value === 'number' ? value.toFixed(2) : value,
// //                   title,
// //                 ]} 
// //               />
// //               <Bar dataKey={dataKey} fill={color} />
// //             </ComposedChart>
// //           </ResponsiveContainer>
// //         </div>
// //       </CardContent>
// //     </Card>
// //   );

// //   return (
// //     <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-yellow-50">
// //       <style>
// //         {`
// //           .chart-container {
// //             min-height: 200px;
// //             width: 100%;
// //             position: relative;
// //           }
// //         `}
// //       </style>
// //       <header className="bg-white shadow-sm border-b border-blue-100">
// //         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
// //           <div className="flex items-center justify-between">
// //             <div className="flex items-center space-x-3">
// //               <h1 className="text-2xl font-bold text-blue-900">Tumor Analysis Results</h1>
// //             </div>
// //             <nav className="flex space-x-6">
// //               <Link to="/" className="text-blue-700 hover:text-blue-600 font-medium transition-colors">
// //                 Home
// //               </Link>
// //               <Link to="/gene-analysis" className="text-blue-700 hover:text-blue-600 font-medium transition-colors">
// //                 Gene Analysis
// //               </Link>
// //               <Link to="/pathway-analysis" className="text-blue-700 hover:text-blue-600 font-medium transition-colors">
// //                 Pathway Analysis
// //               </Link>
// //               <Link to="/tumour-analysis" className="text-blue-500 font-medium">
// //                 Tumor Analysis
// //               </Link>
// //             </nav>
// //           </div>
// //         </div>
// //       </header>

// //       <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
// //         <div className="flex gap-6">
// //           {/* Left Sidebar - Filters */}
// //           <div className="w-80 flex-shrink-0">
// //             <Card className="border-0 shadow-lg bg-blue-100">
// //               <CardHeader className="pb-4">
// //                 <CardTitle className="text-blue-900">
// //                   Filters
// //                 </CardTitle>
// //               </CardHeader>
// //               <CardContent className="space-y-6">
// //                 {/* Expression Normalization Method */}
// //                 <div>
// //                   <h3 className="font-semibold text-blue-900 mb-3">Expression Normalization Method</h3>
// //                   <RadioGroup value={normalizationMethod} onValueChange={setNormalizationMethod}>
// //                     <div className="flex items-center space-x-2">
// //                       <RadioGroupItem value="tpm" id="tpm" />
// //                       <Label htmlFor="tpm">TPM</Label>
// //                     </div>
// //                     <div className="flex items-center space-x-2">
// //                       <RadioGroupItem value="fpkm" id="fpkm" />
// //                       <Label htmlFor="fpkm">FPKM</Label>
// //                     </div>
// //                     <div className="flex items-center space-x-2">
// //                       <RadioGroupItem value="fpkm_uq" id="fpkm_uq" />
// //                       <Label htmlFor="fpkm_uq">FPKM_UQ</Label>
// //                     </div>
// //                   </RadioGroup>
// //                 </div>

// //                 {/* Noise Metrics */}
// //                 <div className="border rounded-md bg-white">
// //                   <div className="flex justify-between items-center px-4 py-2">
// //                     <div className="flex items-center space-x-2">
// //                       <Checkbox
// //                         id="noise-metrics-master"
// //                         checked={areAllNoiseSelected}
// //                         onCheckedChange={toggleAllNoiseMetrics}
// //                       />
// //                       <Label htmlFor="noise-metrics-master" className="font-bold text-blue-900 -ml-5">Noise Metrics</Label>
// //                     </div>
// //                     <button
// //                       onClick={() => setIsNoiseMetricsOpen(prev => !prev)}
// //                       className="text-blue-900"
// //                     >
// //                       {isNoiseMetricsOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
// //                     </button>
// //                   </div>
// //                   {isNoiseMetricsOpen && (
// //                     <div className="px-4 py-2 space-y-2">
// //                       {allNoiseMetrics.map((metric) => (
// //                         <div key={metric} className="flex items-center space-x-2">
// //                           <Checkbox
// //                             id={`noise-${metric}`}
// //                             checked={selectedNoiseMetrics.includes(metric)}
// //                             onCheckedChange={() => handleNoiseMetricToggle(metric)}
// //                           />
// //                           <Label htmlFor={`noise-${metric}`} className="text-sm">{metric}</Label>
// //                         </div>
// //                       ))}
// //                     </div>
// //                   )}
// //                 </div>

// //                 {/* Analysis Plots */}
// //                 <div className="border rounded-md bg-white">
// //                   <div className="flex justify-between items-center px-4 py-2">
// //                     <div className="flex items-center space-x-2">
// //                       <Checkbox
// //                         id="analysis-plots-master"
// //                         checked={areAllPlotsSelected}
// //                         onCheckedChange={toggleAllPlots}
// //                       />
// //                       <Label htmlFor="analysis-plots-master" className="font-bold text-blue-900 -ml-5">Analysis Plots</Label>
// //                     </div>
// //                     <button
// //                       onClick={() => setIsAnalysisPlotsOpen(prev => !prev)}
// //                       className="text-blue-900"
// //                     >
// //                       {isAnalysisPlotsOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
// //                     </button>
// //                   </div>
// //                   {isAnalysisPlotsOpen && (
// //                     <div className="px-4 py-2 space-y-2">
// //                       {allPlotKeys.map(plotKey => (
// //                         <div key={plotKey} className="flex items-center space-x-2">
// //                           <Checkbox
// //                             id={`plot-${plotKey}`}
// //                             checked={visiblePlots[plotKey]}
// //                             onCheckedChange={() => handlePlotToggle(plotKey)}
// //                           />
// //                           <Label htmlFor={`plot-${plotKey}`} className="text-sm">
// //                             {{
// //                               depth2: 'DEPTH2 Boxplot',
// //                               tith: 'tITH Scatter Plot',
// //                               diffNoise: 'Differential Noise',
// //                               normalNoise: 'Normal State Noise',
// //                               tumorNoise: 'Tumor State Noise'
// //                             }[plotKey]}
// //                           </Label>
// //                         </div>
// //                       ))}
// //                     </div>
// //                   )}
// //                 </div>

// //                 <Button onClick={applyFilters} className="w-full bg-blue-600 hover:bg-blue-700">
// //                   Apply
// //                 </Button>
// //               </CardContent>
// //             </Card>
// //           </div>

// //           {/* Main Content */}
// //           <div className="flex-1">
// //             <Link to="/gene-analysis" className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-6 transition-colors">
// //               <ArrowLeft className="h-4 w-4 mr-2" />
// //               Back to Gene Analysis
// //             </Link>

// //             <div className="mb-8">
// //               <h2 className="text-4xl font-bold text-blue-900 mb-2">
// //                 Results for {getCancerTypeLabel(cancerType)}
// //               </h2>
// //               <div className="flex items-center justify-between mb-4">
// //                 <div className="flex flex-wrap gap-2"></div>
// //                 <div className="flex space-x-4">
// //                   <Button onClick={() => downloadData('csv')} variant="outline" size="sm">
// //                     <Download className="h-4 w-4 mr-2" /> Download CSV
// //                   </Button>
// //                 </div>
// //               </div>
// //               <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
// //                 <Card className="border-0 shadow-lg">
// //                   <CardContent className="flex flex-col items-center p-4 text-center">
// //                     <Users className="h-6 w-6 text-blue-600 mb-2" />
// //                     <div className="text-2xl font-bold text-blue-600">{totalTumorSamples}</div>
// //                     <div className="text-xs text-gray-600">Total Tumor Samples</div>
// //                   </CardContent>
// //                 </Card>
// //               </div>
// //             </div>

// //             {/* DEPTH2 and tITH Plots */}
// //             {(visiblePlots.depth2 || visiblePlots.tith) && (
// //               <div className="mb-8">
// //                 <h3 className="text-2xl font-bold text-blue-900 mb-4">Tumor Heterogeneity Metrics</h3>
// //                 <div className="grid lg:grid-cols-2 md:grid-cols-1 gap-4">
// //                   {visiblePlots.depth2 && (
// //                     <BoxplotBar 
// //                       data={tumorData} 
// //                       dataKey="depth2" 
// //                       color="#ea580c" 
// //                       title="DEPTH2 Scores" 
// //                     />
// //                   )}
// //                   {visiblePlots.tith && (
// //                     <ScatterPlot 
// //                       data={tumorData} 
// //                       dataKey="tith" 
// //                       color="#2563eb" 
// //                       title="Transcriptome-based Intra-Tumor Heterogeneity (tITH)" 
// //                     />
// //                   )}
// //                 </div>
// //               </div>
// //             )}

// //             {/* Noise Rankings */}
// //             {(visiblePlots.diffNoise || visiblePlots.normalNoise || visiblePlots.tumorNoise) && (
// //               <div className="mb-8">
// //                 <h3 className="text-2xl font-bold text-blue-900 mb-4">Noise Rankings</h3>
// //                 <div className="grid lg:grid-cols-3 md:grid-cols-1 gap-4">
// //                   {visiblePlots.diffNoise && (
// //                     <BarChart 
// //                       data={tumorData.slice(0, 5)} 
// //                       dataKey="diffNoise" 
// //                       color="#dc2626" 
// //                       title="Samples with Highest Differential Noise" 
// //                     />
// //                   )}
// //                   {visiblePlots.normalNoise && (
// //                     <BarChart 
// //                       data={tumorData.slice(0, 5)} 
// //                       dataKey="normalNoise" 
// //                       color="#059669" 
// //                       title="Samples with Highest Normal State Noise" 
// //                     />
// //                   )}
// //                   {visiblePlots.tumorNoise && (
// //                     <BarChart 
// //                       data={tumorData.slice(0, 5)} 
// //                       dataKey="tumorNoise" 
// //                       color="#7c3aed" 
// //                       title="Samples with Highest Tumor State Noise" 
// //                     />
// //                   )}
// //                 </div>
// //               </div>
// //             )}
// //           </div>
// //         </div>
// //       </div>
// //       <footer className="bg-gray-100 text-gray-700 text-m mt-10 p-8 text-center border-t border-gray-300">
// //         <p className="text-blue-700 mt-4">© 2025 BIRL — This website is free and open to all users and there is no login requirement.</p>
// //         <p className="font-semibold text-blue-700 mt-4">Biomedical Informatics & Engineering Research Laboratory, Lahore University of Management Sciences</p>
// //         <p className="text-blue-700 mt-4">DHA, Lahore, Pakistan</p>
// //         <p className="text-blue-700 mt-4">+92 (42) 3560 8352</p>
// //       </footer>
// //     </div>
// //   );
// // };

// // export default TumourResults;
// // import { useState, useEffect, useRef } from "react";
// // import { useSearchParams, Link } from "react-router-dom";
// // import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
// // import { Button } from "@/components/ui/button";
// // import { Checkbox } from "@/components/ui/checkbox";
// // import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
// // import { Label } from "@/components/ui/label";
// // import { ArrowLeft, Download, Box, ChevronRight, ChevronDown, Users } from "lucide-react";
// // import supabase from "@/supabase-client";
// // import { 
// //   ResponsiveContainer, 
// //   XAxis, 
// //   YAxis, 
// //   CartesianGrid, 
// //   Tooltip,
// //   ComposedChart,
// //   Bar,
// //   ErrorBar,
// //   Scatter
// // } from "recharts";
// // import { calculateDepth2, Depth2Metrics } from "@/json/depth2_calc";
// // import { calculateTITH } from "@/json/tITH_calc";
// // import { mean, variance, mad } from "mathjs";

// // // Utility to debounce state updates
// // const debounce = (func, wait) => {
// //   let timeout;
// //   return (...args) => {
// //     clearTimeout(timeout);
// //     timeout = setTimeout(() => func(...args), wait);
// //   };
// // };

// // const TumourResults = () => {
// //   const [searchParams] = useSearchParams();
// //   const cancerType = searchParams.get('cancerType') || '';
  
// //   // Filter states
// //   const [normalizationMethod, setNormalizationMethod] = useState('tpm');
// //   const [selectedNoiseMetrics, setSelectedNoiseMetrics] = useState(['DEPTH2', 'DEPTH - tITH']);
// //   const [isNoiseMetricsOpen, setIsNoiseMetricsOpen] = useState(false);
// //   const [isAnalysisPlotsOpen, setIsAnalysisPlotsOpen] = useState(false);
// //   const [visiblePlots, setVisiblePlots] = useState({
// //     depth2: true,
// //     tith: true,
// //     diffNoise: true,
// //     normalNoise: true,
// //     tumorNoise: true
// //   });
// //   const [totalTumorSamples, setTotalTumorSamples] = useState(0);
// //   const [isLoading, setIsLoading] = useState(false);
// //   const chartRefs = useRef<{[key: string]: any}>({});
// //   const [tumorData, setTumorData] = useState<any[]>([]);

// //   // Noise metric options
// //   const noiseMetrics = {
// //     'DEPTH2': 'depth2',
// //     'DEPTH - tITH': 'tith'
// //   };

// //   const allNoiseMetrics = Object.keys(noiseMetrics);
// //   const areAllNoiseSelected = allNoiseMetrics.every(metric => selectedNoiseMetrics.includes(metric));

// //   const allPlotKeys = ['depth2', 'tith', 'diffNoise', 'normalNoise', 'tumorNoise'];
// //   const areAllPlotsSelected = allPlotKeys.every(plot => visiblePlots[plot]);

// //   // Handle noise metric selection
// //   const handleNoiseMetricToggle = debounce((metric) => {
// //     setSelectedNoiseMetrics(prev => 
// //       prev.includes(metric) 
// //         ? prev.filter(m => m !== metric)
// //         : [...prev, metric]
// //     );
// //   }, 100);

// //   // Handle master checkbox for noise metrics
// //   const toggleAllNoiseMetrics = debounce((checked) => {
// //     setSelectedNoiseMetrics(checked ? allNoiseMetrics : []);
// //   }, 100);

// //   // Handle individual plot visibility
// //   const handlePlotToggle = debounce((plotKey) => {
// //     setVisiblePlots(prev => ({
// //       ...prev,
// //       [plotKey]: !prev[plotKey]
// //     }));
// //   }, 100);

// //   // Handle master checkbox for plots
// //   const toggleAllPlots = debounce((checked) => {
// //     setVisiblePlots(prev => ({
// //       ...prev,
// //       ...Object.fromEntries(allPlotKeys.map(plot => [plot, checked]))
// //     }));
// //   }, 100);

// //   const applyFilters = () => {
// //     console.log('Applying filters:', {
// //       normalizationMethod,
// //       selectedNoiseMetrics,
// //       visiblePlots
// //     });
// //     setVisiblePlots(prev => ({
// //       ...prev,
// //       depth2: selectedNoiseMetrics.includes('DEPTH2'),
// //       tith: selectedNoiseMetrics.includes('DEPTH - tITH'),
// //       diffNoise: true,
// //       normalNoise: true,
// //       тюморNoise: true
// //     }));
// //   };

// //   useEffect(() => {
// //     let isMounted = true;

// //     const fetchTumorExpressionData = async () => {
// //       if (!cancerType) return;
// //       setIsLoading(true);
// //       try {
// //         // Step 1: Fetch cancer type ID
// //         const { data: cancerTypeData, error: cancerTypeError } = await supabase
// //           .from('cancer_types')
// //           .select('id')
// //           .eq('tcga_code', cancerType)
// //           .single();

// //         if (cancerTypeError) throw cancerTypeError;
// //         const cancerTypeId = cancerTypeData.id;

// //         // Step 2: Fetch tumor samples
// //         const { data: samplesData, error: samplesError } = await supabase
// //           .from('samples')
// //           .select('id, sample_barcode, sample_type')
// //           .eq('cancer_type_id', cancerTypeId)
// //           .eq('sample_type', 'tumor');

// //         if (samplesError) throw samplesError;
// //         if (!samplesData || samplesData.length === 0) {
// //           console.warn("⚠️ No tumor samples found for:", cancerType);
// //           return [];
// //         }

// //         const sampleMap = Object.fromEntries(samplesData.map(s => [s.id, s.sample_barcode]));
// //         const sampleIds = samplesData.map(s => s.id);
// //         console.log("sampledata:", samplesData);
// //         console.log("sampleIds:", sampleIds); // should be 81 numeric IDs

// //         setTotalTumorSamples(samplesData.length);
        
// //         // Step 3: Fetch expression data for all genes in tumor samples
// //         const { data: expressionData, error: expressionError } = await supabase
// //           .from('expression_values')
// //           .select(`
// //             gene_id,
// //             sample_id,
// //             ${normalizationMethod}
// //           `)
// //           .in('sample_id', sampleIds) as any;
// //           // console.log("✅ expressionData length:", expressionData?.length || 0);
// //           console.log("✅ expressionData length:", expressionData);
// //         type ExpressionEntry = {
// //           gene_id: number;
// //           sample_id: number;
// //           tpm?: number;
// //           fpkm?: number;
// //           fpkm_uq?: number;
// //         };

// //         // const { data } = await supabase.from("expression_values").select("*");

// //         // const expressionData: ExpressionEntry[] = data ?? [];


// //         if (expressionError) throw expressionError;
// //         if (!expressionData || expressionData.length === 0) {
// //           console.warn("⚠️ No expression data found.");
// //           return [];
// //         }
        
// //         const sampleExpressionMap: {
// //         [sampleBarcode: string]: {
// //           sample: string;
// //           values: number[];
// //         };
// //       } = {};


// //       // expressionData.forEach(entry => {
// //       //   const geneId = entry.gene_id;
// //       //   const sampleId = entry.sample_id;
// //       //   const value = entry[normalizationMethod.toLowerCase() as keyof ExpressionEntry];
// //       //   const sampleBarcode = sampleMap[sampleId]; // sampleMap maps sample_id → TCGA barcode

// //       //   if (!geneId || !sampleBarcode || value == null) return;

// //       //   if (!sampleExpressionMap[geneId]) {
// //       //     sampleExpressionMap[geneId] = {
// //       //       geneId,
// //       //       values: {}
// //       //     };
// //       //   }
// //       expressionData.forEach(entry => {
// //         const sampleId = entry.sample_id;
// //         const geneValue = entry[normalizationMethod.toLowerCase() as keyof ExpressionEntry];
// //         const sampleBarcode = sampleMap[sampleId];

// //         if (!sampleBarcode || geneValue == null || isNaN(geneValue)) return;

// //         if (!sampleExpressionMap[sampleBarcode]) {
// //           sampleExpressionMap[sampleBarcode] = {
// //             sample: sampleBarcode,
// //             values: []
// //           };
// //         }

// //         sampleExpressionMap[sampleBarcode].values.push(geneValue);
// //       });
// //       console.log("first 5 sample IDs from sampleMap:", sampleIds.slice(0, 5)); // numeric
// //       console.log("first 5 sample IDs in expressionData:", expressionData.slice(0, 5).map(e => e.sample_id)); // are they also numbers?

// //       console.log("sampleExpressionMap keys:", Object.keys(sampleExpressionMap));


// //         // sampleExpressionMap[geneId].values[sampleBarcode] = value;
// //       // });


// //         // Step 4: Group expression data by sample
// //         // const sampleExpressionMap: { [sampleBarcode: string]: any } = {};
// //         // expressionData.forEach(entry => {
// //         //   const sampleBarcode = sampleMap[entry.sample_id];
// //         //   const value = entry[normalizationMethod.toLowerCase()];

// //         //   if (!sampleBarcode || value == null) return;

// //         //   if (!sampleExpressionMap[sampleBarcode]) {
// //         //     sampleExpressionMap[sampleBarcode] = {
// //         //       sample: sampleBarcode,
// //         //       values: [],
// //         //       geneSymbols: []
// //         //     };
// //         //   }

// //         //   sampleExpressionMap[sampleBarcode].values.push(value);
// //         //   // sampleExpressionMap[sampleBarcode].geneSymbols.push(geneSymbol);
// //         // });

// //         // Step 5: Calculate tumor heterogeneity metrics for each sample
// //         const processedData = Object.values(sampleExpressionMap).map(sample => {
// //           // const values = sample.values.filter(v => !isNaN(v));
// //           const values = Object.values(sample.values).filter(v => !Number.isNaN(v));
// //           if (values.length === 0) return null;

// //           // const values = sample.values;
// //           console.log("values:", values);
// //           if (values.length === 0) return null;

// //           const {
// //             depth2, depth2Q1, depth2Q3, depth2Min, depth2Max, depth2Median
// //           } = calculateDepth2(values);

// //           const tith = calculateTITH(values);
// //           const diffNoise = variance(values);
// //           const normalNoise = mad(values);
// //           const tumorNoise = depth2;

// //           // return {
// //           //   gene: sample.geneId,
// //           //   [normalizationMethod.toLowerCase()]: mean(values),
// //           //   depth2,
// //           //   depth2Q1,
// //           //   depth2Q3,
// //           //   depth2Min,
// //           //   depth2Max,
// //           //   depth2Median,
// //           //   tith,
// //           //   diffNoise,
// //           //   normalNoise,
// //           //   tumorNoise,
// //           //   tumorSamples: values.length
// //           // };
// //           return {
// //             sample: sample.sample,
// //             [normalizationMethod.toLowerCase()]: mean(values),
// //             depth2,
// //             depth2Q1,
// //             depth2Q3,
// //             depth2Min,
// //             depth2Max,
// //             depth2Median,
// //             tith,
// //             diffNoise,
// //             normalNoise,
// //             tumorNoise,
// //             totalGenes: values.length
// //           };

// //         }).filter(Boolean);

// //         console.log("✅ Final tumor data:", processedData);
// //         if (isMounted) {
// //           setTumorData(processedData);
// //         }
// //       } catch (error) {
// //         console.error('Error fetching data:', error);
// //       } finally {
// //         if (isMounted) {
// //           setIsLoading(false);
// //         }
// //       }
// //     };

// //     fetchTumorExpressionData();
// //     return () => {
// //       isMounted = false;
// //     };
// //   }, [cancerType, normalizationMethod]);

// //   const getCancerTypeLabel = (type: string) => {
// //     const labels: { [key: string]: string } = {
// //       "TCGA-BRCA": "Breast Cancer (BRCA)",
// //       "TCGA-LUAD": "Lung Cancer (LUAD)",
// //       "TCGA-PRAD": "Prostate Cancer (PRAD)",
// //       "TCGA-COAD": "Colorectal Cancer (COAD)",
// //       "TCGA-LIHC": "Liver Cancer (LIHC)",
// //       "TCGA-KIRC": "Kidney Cancer (KIRC)",
// //       "TCGA-STAD": "Stomach Cancer (STAD)",
// //       "TCGA-OV": "Ovarian Cancer (OV)",
// //       "TCGA-BLCA": "Bladder Cancer (BLCA)"
// //     };
// //     return labels[type] || type;
// //   };

// //   const downloadChart = (chartKey: string, chartName: string) => {
// //     const chartElement = chartRefs.current[chartKey];
// //     if (chartElement) {
// //       const svg = chartElement.querySelector('svg');
// //       if (svg) {
// //         const canvas = document.createElement('canvas');
// //         const ctx = canvas.getContext('2d');
// //         const img = new Image();
        
// //         const svgData = new XMLSerializer().serializeToString(svg);
// //         const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
// //         const url = URL.createObjectURL(svgBlob);
        
// //         img.onload = function() {
// //           canvas.width = img.width || 800;
// //           canvas.height = img.height || 400;
// //           ctx?.drawImage(img, 0, 0);
          
// //           canvas.toBlob((blob) => {
// //             if (blob) {
// //               const link = document.createElement('a');
// //               link.download = `${chartName.replace(/\s+/g, '_').toLowerCase()}_${Date.now()}.png`;
// //               link.href = URL.createObjectURL(blob);
// //               link.click();
// //               URL.revokeObjectURL(link.href);
// //             }
// //           });
// //           URL.revokeObjectURL(url);
// //         };
// //         img.src = url;
// //       }
// //     }
// //   };

// //   const downloadData = (format: string) => {
// //     const data = tumorData;
// //     let content = '';
// //     let filename = `tumor_analysis_${cancerType}_${Date.now()}`;

// //     if (format === 'csv') {
// //       const excludedKeys = ['tumorValues', 'normalValues', 'combinedValues'];
// //       const keys = Object.keys(data[0] || {}).filter(key => !excludedKeys.includes(key));
// //       const headers = keys.join(',');
// //       const rows = data.map(row => keys.map(key => row[key]).join(','));
// //       content = [headers, ...rows].join('\n');
// //       filename += '.csv';
// //     }

// //     const blob = new Blob([content], { type: format === 'csv' ? 'text/csv' : 'application/json' });
// //     const url = URL.createObjectURL(blob);
// //     const a = document.createElement('a');
// //     a.href = url;
// //     a.download = filename;
// //     a.click();
// //     URL.revokeObjectURL(url);
// //   };

// //   const colors = ['#2563eb', '#059669', '#dc2626', '#7c3aed', '#ea580c'];

// //   // Custom boxplot component
// //   const BoxplotBar = ({ data, dataKey, color, title }: any) => (
// //     <Card className="border-0 shadow-lg">
// //       <CardHeader className="pb-2">
// //         <CardTitle className="flex items-center justify-between text-sm">
// //           <div className="flex items-center space-x-2">
// //             <Box className="h-4 w-4" style={{ color }} />
// //             <span>{title}</span>
// //           </div>
// //           <Button 
// //             size="sm" 
// //             variant="outline" 
// //             onClick={() => downloadChart(`boxplot-${dataKey}`, title)}
// //             className="h-6 px-2 text-xs"
// //           >
// //             <Download className="h-3 w-3" />
// //           </Button>
// //         </CardTitle>
// //       </CardHeader>
// //       <CardContent className="pt-0">
// //         <div ref={el => chartRefs.current[`boxplot-${dataKey}`] = el}>
// //           <ResponsiveContainer width="100%" height={200}>
// //             <ComposedChart data={data} margin={{ top: 5, right: 5, left: 5, bottom: 25 }}>
// //               <CartesianGrid strokeDasharray="3 3" />
// //               <XAxis 
// //                 dataKey="sample" 
// //                 tick={{ fontSize: 10 }}
// //                 label={{ 
// //                   value: 'Samples', 
// //                   position: 'insideBottom', 
// //                   offset: -10, 
// //                   style: { fontSize: '10px' } 
// //                 }}
// //               />
// //               <YAxis 
// //                 tick={{ fontSize: 10 }}
// //                 label={{ 
// //                   value: title, 
// //                   angle: -90, 
// //                   position: 'insideLeft', 
// //                   dy: 55,
// //                   style: { fontSize: '10px' } 
// //                 }} 
// //               />
// //               <Tooltip 
// //                 formatter={(value: any) => [
// //                   typeof value === 'number' ? value.toFixed(2) : value,
// //                   title,
// //                 ]} 
// //               />
// //               <Bar dataKey={`${dataKey}Median`} fill={color}>
// //                 <ErrorBar dataKey={`${dataKey}Min`} width={4} stroke={color} />
// //                 <ErrorBar dataKey={`${dataKey}Max`} width={4} stroke={color} />
// //               </Bar>
// //             </ComposedChart>
// //           </ResponsiveContainer>
// //         </div>
// //       </CardContent>
// //     </Card>
// //   );

// //   // Custom scatter plot component for tITH
// //   const ScatterPlot = ({ data, dataKey, color, title }: any) => (
// //     <Card className="border-0 shadow-lg">
// //       <CardHeader className="pb-2">
// //         <CardTitle className="flex items-center justify-between text-sm">
// //           <div className="flex items-center space-x-2">
// //             <Box className="h-4 w-4" style={{ color }} />
// //             <span>{title}</span>
// //           </div>
// //           <Button 
// //             size="sm" 
// //             variant="outline" 
// //             onClick={() => downloadChart(`scatter-${dataKey}`, title)}
// //             className="h-6 px-2 text-xs"
// //           >
// //             <Download className="h-3 w-3" />
// //           </Button>
// //         </CardTitle>
// //       </CardHeader>
// //       <CardContent className="pt-0">
// //         <div ref={el => chartRefs.current[`scatter-${dataKey}`] = el}>
// //           <ResponsiveContainer width="100%" height={200}>
// //             <ComposedChart data={data} margin={{ top: 5, right: 5, left: 5, bottom: 25 }}>
// //               <CartesianGrid strokeDasharray="3 3" />
// //               <XAxis 
// //                 dataKey="sample" 
// //                 tick={{ fontSize: 10 }}
// //                 label={{ 
// //                   value: 'Samples', 
// //                   position: 'insideBottom', 
// //                   offset: -10, 
// //                   style: { fontSize: '10px' } 
// //                 }}
// //               />
// //               <YAxis 
// //                 tick={{ fontSize: 10 }}
// //                 label={{ 
// //                   value: title, 
// //                   angle: -90, 
// //                   position: 'insideLeft', 
// //                   dy: 55,
// //                   style: { fontSize: '10px' } 
// //                 }} 
// //               />
// //               <Tooltip 
// //                 formatter={(value: any) => [
// //                   typeof value === 'number' ? value.toFixed(2) : value,
// //                   title,
// //                 ]} 
// //               />
// //               <Scatter dataKey={dataKey} fill={color} />
// //             </ComposedChart>
// //           </ResponsiveContainer>
// //         </div>
// //       </CardContent>
// //     </Card>
// //   );

// //   // Custom bar chart component for noise rankings
// //   const BarChart = ({ data, dataKey, color, title }: any) => (
// //     <Card className="border-0 shadow-lg">
// //       <CardHeader className="pb-2">
// //         <CardTitle className="flex items-center justify-between text-sm">
// //           <div className="flex items-center space-x-2">
// //             <Box className="h-4 w-4" style={{ color }} />
// //             <span>{title}</span>
// //           </div>
// //           <Button 
// //             size="sm" 
// //             variant="outline" 
// //             onClick={() => downloadChart(`bar-${dataKey}`, title)}
// //             className="h-6 px-2 text-xs"
// //           >
// //             <Download className="h-3 w-3" />
// //           </Button>
// //         </CardTitle>
// //       </CardHeader>
// //       <CardContent className="pt-0">
// //         <div ref={el => chartRefs.current[`bar-${dataKey}`] = el}>
// //           <ResponsiveContainer width="100%" height={200}>
// //             <ComposedChart data={data} margin={{ top: 5, right: 5, left: 5, bottom: 25 }}>
// //               <CartesianGrid strokeDasharray="3 3" />
// //               <XAxis 
// //                 dataKey="sample" 
// //                 tick={{ fontSize: 10 }}
// //                 label={{ 
// //                   value: 'Samples', 
// //                   position: 'insideBottom', 
// //                   offset: -10, 
// //                   style: { fontSize: '10px' } 
// //                 }}
// //               />
// //               <YAxis 
// //                 tick={{ fontSize: 10 }}
// //                 label={{ 
// //                   value: title, 
// //                   angle: -90, 
// //                   position: 'insideLeft', 
// //                   dy: 55,
// //                   style: { fontSize: '10px' } 
// //                 }} 
// //               />
// //               <Tooltip 
// //                 formatter={(value: any) => [
// //                   typeof value === 'number' ? value.toFixed(2) : value,
// //                   title,
// //                 ]} 
// //               />
// //               <Bar dataKey={dataKey} fill={color} />
// //             </ComposedChart>
// //           </ResponsiveContainer>
// //         </div>
// //       </CardContent>
// //     </Card>
// //   );

// //   return (
// //     <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-yellow-50">
// //       <style>
// //         {`
// //           .chart-container {
// //             min-height: 200px;
// //             width: 100%;
// //             position: relative;
// //           }
// //         `}
// //       </style>
// //       <header className="bg-white shadow-sm border-b border-blue-100">
// //         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
// //           <div className="flex items-center justify-between">
// //             <div className="flex items-center space-x-3">
// //               <h1 className="text-2xl font-bold text-blue-900">Tumor Analysis Results</h1>
// //             </div>
// //             <nav className="flex space-x-6">
// //               <Link to="/" className="text-blue-700 hover:text-blue-600 font-medium transition-colors">
// //                 Home
// //               </Link>
// //               <Link to="/gene-analysis" className="text-blue-700 hover:text-blue-600 font-medium transition-colors">
// //                 Gene Analysis
// //               </Link>
// //               <Link to="/pathway-analysis" className="text-blue-700 hover:text-blue-600 font-medium transition-colors">
// //                 Pathway Analysis
// //               </Link>
// //               <Link to="/tumour-analysis" className="text-blue-500 font-medium">
// //                 Tumor Analysis
// //               </Link>
// //             </nav>
// //           </div>
// //         </div>
// //       </header>

// //       <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
// //         <div className="flex gap-6">
// //           {/* Left Sidebar - Filters */}
// //           <div className="w-80 flex-shrink-0">
// //             <Card className="border-0 shadow-lg bg-blue-100">
// //               <CardHeader className="pb-4">
// //                 <CardTitle className="text-blue-900">
// //                   Filters
// //                 </CardTitle>
// //               </CardHeader>
// //               <CardContent className="space-y-6">
// //                 {/* Expression Normalization Method */}
// //                 <div>
// //                   <h3 className="font-semibold text-blue-900 mb-3">Expression Normalization Method</h3>
// //                   <RadioGroup value={normalizationMethod} onValueChange={setNormalizationMethod}>
// //                     <div className="flex items-center space-x-2">
// //                       <RadioGroupItem value="tpm" id="tpm" />
// //                       <Label htmlFor="tpm">TPM</Label>
// //                     </div>
// //                     <div className="flex items-center space-x-2">
// //                       <RadioGroupItem value="fpkm" id="fpkm" />
// //                       <Label htmlFor="fpkm">FPKM</Label>
// //                     </div>
// //                     <div className="flex items-center space-x-2">
// //                       <RadioGroupItem value="fpkm_uq" id="fpkm_uq" />
// //                       <Label htmlFor="fpkm_uq">FPKM_UQ</Label>
// //                     </div>
// //                   </RadioGroup>
// //                 </div>

// //                 {/* Noise Metrics */}
// //                 <div className="border rounded-md bg-white">
// //                   <div className="flex justify-between items-center px-4 py-2">
// //                     <div className="flex items-center space-x-2">
// //                       <Checkbox
// //                         id="noise-metrics-master"
// //                         checked={areAllNoiseSelected}
// //                         onCheckedChange={toggleAllNoiseMetrics}
// //                       />
// //                       <Label htmlFor="noise-metrics-master" className="font-bold text-blue-900 -ml-5">Noise Metrics</Label>
// //                     </div>
// //                     <button
// //                       onClick={() => setIsNoiseMetricsOpen(prev => !prev)}
// //                       className="text-blue-900"
// //                     >
// //                       {isNoiseMetricsOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
// //                     </button>
// //                   </div>
// //                   {isNoiseMetricsOpen && (
// //                     <div className="px-4 py-2 space-y-2">
// //                       {allNoiseMetrics.map((metric) => (
// //                         <div key={metric} className="flex items-center space-x-2">
// //                           <Checkbox
// //                             id={`noise-${metric}`}
// //                             checked={selectedNoiseMetrics.includes(metric)}
// //                             onCheckedChange={() => handleNoiseMetricToggle(metric)}
// //                           />
// //                           <Label htmlFor={`noise-${metric}`} className="text-sm">{metric}</Label>
// //                         </div>
// //                       ))}
// //                     </div>
// //                   )}
// //                 </div>

// //                 {/* Analysis Plots */}
// //                 <div className="border rounded-md bg-white">
// //                   <div className="flex justify-between items-center px-4 py-2">
// //                     <div className="flex items-center space-x-2">
// //                       <Checkbox
// //                         id="analysis-plots-master"
// //                         checked={areAllPlotsSelected}
// //                         onCheckedChange={toggleAllPlots}
// //                       />
// //                       <Label htmlFor="analysis-plots-master" className="font-bold text-blue-900 -ml-5">Analysis Plots</Label>
// //                     </div>
// //                     <button
// //                       onClick={() => setIsAnalysisPlotsOpen(prev => !prev)}
// //                       className="text-blue-900"
// //                     >
// //                       {isAnalysisPlotsOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
// //                     </button>
// //                   </div>
// //                   {isAnalysisPlotsOpen && (
// //                     <div className="px-4 py-2 space-y-2">
// //                       {allPlotKeys.map(plotKey => (
// //                         <div key={plotKey} className="flex items-center space-x-2">
// //                           <Checkbox
// //                             id={`plot-${plotKey}`}
// //                             checked={visiblePlots[plotKey]}
// //                             onCheckedChange={() => handlePlotToggle(plotKey)}
// //                           />
// //                           <Label htmlFor={`plot-${plotKey}`} className="text-sm">
// //                             {{
// //                               depth2: 'DEPTH2 Boxplot',
// //                               tith: 'tITH Scatter Plot',
// //                               diffNoise: 'Differential Noise',
// //                               normalNoise: 'Normal State Noise',
// //                               tumorNoise: 'Tumor State Noise'
// //                             }[plotKey]}
// //                           </Label>
// //                         </div>
// //                       ))}
// //                     </div>
// //                   )}
// //                 </div>

// //                 <Button onClick={applyFilters} className="w-full bg-blue-600 hover:bg-blue-700">
// //                   Apply
// //                 </Button>
// //               </CardContent>
// //             </Card>
// //           </div>

// //           {/* Main Content */}
// //           <div className="flex-1">
// //             {isLoading ? (
// //               <div className="text-center text-blue-900">Loading charts...</div>
// //             ) : (
// //               <>
// //                 <Link to="/gene-analysis" className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-6 transition-colors">
// //                   <ArrowLeft className="h-4 w-4 mr-2" />
// //                   Back to Gene Analysis
// //                 </Link>

// //                 <div className="mb-8">
// //                   <h2 className="text-4xl font-bold text-blue-900 mb-2">
// //                     Results for {getCancerTypeLabel(cancerType)}
// //                   </h2>
// //                   <div className="flex items-center justify-between mb-4">
// //                     <div className="flex flex-wrap gap-2"></div>
// //                     <div className="flex space-x-4">
// //                       <Button onClick={() => downloadData('csv')} variant="outline" size="sm">
// //                         <Download className="h-4 w-4 mr-2" /> Download CSV
// //                       </Button>
// //                     </div>
// //                   </div>
// //                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
// //                     <Card className="border-0 shadow-lg">
// //                       <CardContent className="flex flex-col items-center p-4 text-center">
// //                         <Users className="h-6 w-6 text-blue-600 mb-2" />
// //                         <div className="text-2xl font-bold text-blue-600">{totalTumorSamples}</div>
// //                         <div className="text-xs text-gray-600">Total Tumor Samples</div>
// //                       </CardContent>
// //                     </Card>
// //                   </div>
// //                 </div>

// //                 {/* DEPTH2 and tITH Plots */}
// //                 {(visiblePlots.depth2 || visiblePlots.tith) && (
// //                   <div className="mb-8">
// //                     <h3 className="text-2xl font-bold text-blue-900 mb-4">Tumor Heterogeneity Metrics</h3>
// //                     <div className="grid lg:grid-cols-2 md:grid-cols-1 gap-4">
// //                       {visiblePlots.depth2 && (
// //                         <BoxplotBar 
// //                           data={tumorData} 
// //                           dataKey="depth2" 
// //                           color="#ea580c" 
// //                           title="DEPTH2 Scores" 
// //                         />
// //                       )}
// //                       {visiblePlots.tith && (
// //                         <ScatterPlot 
// //                           data={tumorData} 
// //                           dataKey="tith" 
// //                           color="#2563eb" 
// //                           title="Transcriptome-based Intra-Tumor Heterogeneity (tITH)" 
// //                         />
// //                       )}
// //                     </div>
// //                   </div>
// //                 )}

// //                 {/* Noise Rankings */}
// //                 {(visiblePlots.diffNoise || visiblePlots.normalNoise || visiblePlots.tumorNoise) && (
// //                   <div className="mb-8">
// //                     <h3 className="text-2xl font-bold text-blue-900 mb-4">Noise Rankings</h3>
// //                     <div className="grid lg:grid-cols-3 md:grid-cols-1 gap-4">
// //                       {visiblePlots.diffNoise && (
// //                         <BarChart 
// //                           data={tumorData.slice(0, 5)} 
// //                           dataKey="diffNoise" 
// //                           color="#dc2626" 
// //                           title="Samples with Highest Differential Noise" 
// //                         />
// //                       )}
// //                       {visiblePlots.normalNoise && (
// //                         <BarChart 
// //                           data={tumorData.slice(0, 5)} 
// //                           dataKey="normalNoise" 
// //                           color="#059669" 
// //                           title="Samples with Highest Normal State Noise" 
// //                         />
// //                       )}
// //                       {visiblePlots.tumorNoise && (
// //                         <BarChart 
// //                           data={tumorData.slice(0, 5)} 
// //                           dataKey="tumorNoise" 
// //                           color="#7c3aed" 
// //                           title="Samples with Highest Tumor State Noise" 
// //                         />
// //                       )}
// //                     </div>
// //                   </div>
// //                 )}
// //               </>
// //             )}
// //           </div>
// //         </div>
// //       </div>
// //       <footer className="bg-gray-100 text-gray-700 text-m mt-10 p-8 text-center border-t border-gray-300">
// //         <p className="text-blue-700 mt-4">© 2025 BIRL — This website is free and open to all users and there is no login requirement.</p>
// //         <p className="font-semibold text-blue-700 mt-4">Biomedical Informatics & Engineering Research Laboratory, Lahore University of Management Sciences</p>
// //         <p className="text-blue-700 mt-4">DHA, Lahore, Pakistan</p>
// //         <p className="text-blue-700 mt-4">+92 (42) 3560 8352</p>
// //       </footer>
// //     </div>
// //   );
// // };

// // export default TumourResults;
// // import { useState, useEffect, useRef } from "react";
// // import { useSearchParams, Link } from "react-router-dom";
// // import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
// // import { Button } from "@/components/ui/button";
// // import { Checkbox } from "@/components/ui/checkbox";
// // import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
// // import { Label } from "@/components/ui/label";
// // import { ArrowLeft, Download, Box, ChevronRight, ChevronDown, Users } from "lucide-react";
// // import supabase from "@/supabase-client";
// // import { 
// //   ResponsiveContainer, 
// //   XAxis, 
// //   YAxis, 
// //   CartesianGrid, 
// //   Tooltip,
// //   ComposedChart,
// //   Bar,
// //   ErrorBar,
// //   Scatter
// // } from "recharts";
// // import { calculateDepth2, Depth2Metrics } from "@/json/depth2_calc";
// // import { calculateTITH } from "@/json/tITH_calc";
// // import { mean, variance, mad } from "mathjs";

// // // Utility to debounce state updates
// // const debounce = (func: Function, wait: number) => {
// //   let timeout: NodeJS.Timeout;
// //   return (...args: any[]) => {
// //     clearTimeout(timeout);
// //     timeout = setTimeout(() => func(...args), wait);
// //   };
// // };

// // const TumourResults = () => {
// //   const [searchParams] = useSearchParams();
// //   const cancerType = searchParams.get('cancerType') || '';
  
// //   // Filter states
// //   const [normalizationMethod, setNormalizationMethod] = useState('tpm');
// //   const [selectedNoiseMetrics, setSelectedNoiseMetrics] = useState(['DEPTH2', 'DEPTH - tITH']);
// //   const [isNoiseMetricsOpen, setIsNoiseMetricsOpen] = useState(false);
// //   const [isAnalysisPlotsOpen, setIsAnalysisPlotsOpen] = useState(false);
// //   const [visiblePlots, setVisiblePlots] = useState({
// //     depth2: true,
// //     tith: true,
// //     diffNoise: true,
// //     normalNoise: true,
// //     tumorNoise: true
// //   });
// //   const [totalTumorSamples, setTotalTumorSamples] = useState(0);
// //   const [isLoading, setIsLoading] = useState(false);
// //   const chartRefs = useRef<{[key: string]: any}>({});
// //   const [tumorData, setTumorData] = useState<any[]>([]);

// //   // Noise metric options
// //   const noiseMetrics = {
// //     'DEPTH2': 'depth2',
// //     'DEPTH - tITH': 'tith'
// //   };

// //   const allNoiseMetrics = Object.keys(noiseMetrics);
// //   const areAllNoiseSelected = allNoiseMetrics.every(metric => selectedNoiseMetrics.includes(metric));

// //   const allPlotKeys = ['depth2', 'tith', 'diffNoise', 'normalNoise', 'tumorNoise'];
// //   const areAllPlotsSelected = allPlotKeys.every(plot => visiblePlots[plot]);

// //   // Handle noise metric selection
// //   const handleNoiseMetricToggle = debounce((metric: string) => {
// //     setSelectedNoiseMetrics(prev => 
// //       prev.includes(metric) 
// //         ? prev.filter(m => m !== metric)
// //         : [...prev, metric]
// //     );
// //   }, 100);

// //   // Handle master checkbox for noise metrics
// //   const toggleAllNoiseMetrics = debounce((checked: boolean) => {
// //     setSelectedNoiseMetrics(checked ? allNoiseMetrics : []);
// //   }, 100);

// //   // Handle individual plot visibility
// //   const handlePlotToggle = debounce((plotKey: string) => {
// //     setVisiblePlots(prev => ({
// //       ...prev,
// //       [plotKey]: !prev[plotKey]
// //     }));
// //   }, 100);

// //   // Handle master checkbox for plots
// //   const toggleAllPlots = debounce((checked: boolean) => {
// //     setVisiblePlots(prev => ({
// //       ...prev,
// //       ...Object.fromEntries(allPlotKeys.map(plot => [plot, checked]))
// //     }));
// //   }, 100);

// //   const applyFilters = () => {
// //     console.log('Applying filters:', {
// //       normalizationMethod,
// //       selectedNoiseMetrics,
// //       visiblePlots
// //     });
// //     setVisiblePlots(prev => ({
// //       ...prev,
// //       depth2: selectedNoiseMetrics.includes('DEPTH2'),
// //       tith: selectedNoiseMetrics.includes('DEPTH - tITH'),
// //       diffNoise: true,
// //       normalNoise: true,
// //       tumorNoise: true
// //     }));
// //   };

// //   // useEffect(() => {
// //   //   let isMounted = true;

// //   //   const fetchTumorExpressionData = async () => {
// //   //     if (!cancerType) return;
// //   //     setIsLoading(true);
// //   //     try {
// //   //       // Step 1: Fetch cancer type ID
// //   //       const { data: cancerTypeData, error: cancerTypeError } = await supabase
// //   //         .from('cancer_types')
// //   //         .select('id')
// //   //         .eq('tcga_code', cancerType)
// //   //         .single();

// //   //       if (cancerTypeError) throw cancerTypeError;
// //   //       const cancerTypeId = cancerTypeData.id;

// //   //       // Step 2: Fetch tumor samples
// //   //       // const { data: samplesData, error: samplesError } = await supabase
// //   //       //   .from('samples')
// //   //       //   .select('id, sample_barcode, sample_type')
// //   //       //   .eq('cancer_type_id', cancerTypeId)
// //   //       //   .eq('sample_type', 'tumor');

// //   //       // if (samplesError) throw samplesError;
// //   //       // if (!samplesData || samplesData.length === 0) {
// //   //       //   console.warn("⚠️ No tumor samples found for:", cancerType);
// //   //       //   setTumorData([]);
// //   //       //   setTotalTumorSamples(0);
// //   //       //   return;
// //   //       // }

// //   //       // const sampleMap = Object.fromEntries(samplesData.map(s => [s.id, s.sample_barcode]));
// //   //       // const sampleIds = samplesData.map(s => s.id);
// //   //       // setTotalTumorSamples(samplesData.length);

// //   //       // // Step 3: Fetch expression data for all genes in tumor samples
// //   //       // const { data: expressionData, error: expressionError } = await supabase
// //   //       //   .from('expression_values')
// //   //       //   .select('gene_id, sample_id, tpm, fpkm, fpkm_uq')
// //   //       //   .in('sample_id', sampleIds);

// //   //       // if (expressionError) throw expressionError;
// //   //       // if (!expressionData || expressionData.length === 0) {
// //   //       //   console.warn("⚠️ No expression data found for samples.");
// //   //       //   setTumorData([]);
// //   //       //   return;
// //   //       // }

// //   //       // // Step 4: Group expression data by sample
// //   //       // const sampleExpressionMap: {
// //   //       //   [sampleBarcode: string]: {
// //   //       //     sample: string;
// //   //       //     values: number[];
// //   //       //   }
// //   //       // } = {};

// //   //       // // Initialize sampleExpressionMap for each sample
// //   //       // Object.values(sampleMap).forEach(barcode => {
// //   //       //   sampleExpressionMap[barcode] = {
// //   //       //     sample: barcode,
// //   //       //     values: []
// //   //       //   };
// //   //       // });

// //   //       // // Group expression values by sample
// //   //       // expressionData.forEach(entry => {
// //   //       //   const sampleBarcode = sampleMap[entry.sample_id];
// //   //       //   const value = entry[normalizationMethod.toLowerCase()];
          
// //   //       //   if (!sampleBarcode || value == null || isNaN(value)) return;
          
// //   //       //   sampleExpressionMap[sampleBarcode].values.push(value);
// //   //       // });
// //   //       // Step 2: Fetch tumor samples
// //   //       const { data: samplesData, error: samplesError } = await supabase
// //   //         .from('samples')
// //   //         .select('id, sample_barcode, sample_type')
// //   //         .eq('cancer_type_id', cancerTypeId)
// //   //         .eq('sample_type', 'tumor');

// //   //       if (samplesError) throw samplesError;
// //   //       if (!samplesData || samplesData.length === 0) {
// //   //         console.warn("⚠️ No tumor samples found for:", cancerType);
// //   //         setTumorData([]);
// //   //         setTotalTumorSamples(0);
// //   //         return;
// //   //       }

// //   //       // Explicitly type sampleMap
// //   //       const sampleMap: { [id: number]: string } = Object.fromEntries(
// //   //         samplesData.map(s => [s.id, s.sample_barcode])
// //   //       );
// //   //       const sampleIds = samplesData.map(s => s.id);
// //   //       setTotalTumorSamples(samplesData.length);

// //   //       // Step 3: Fetch expression data for all genes in tumor samples
// //   //       const { data: expressionData, error: expressionError } = await supabase
// //   //         .from('expression_values')
// //   //         .select('gene_id, sample_id, tpm, fpkm, fpkm_uq')
// //   //         .in('sample_id', sampleIds);

// //   //       if (expressionError) throw expressionError;
// //   //       if (!expressionData || expressionData.length === 0) {
// //   //         console.warn("⚠️ No expression data found for samples.");
// //   //         setTumorData([]);
// //   //         return;
// //   //       }

// //   //       // Step 4: Group expression data by sample
// //   //       const sampleExpressionMap: {
// //   //         [sampleBarcode: string]: {
// //   //           sample: string;
// //   //           values: number[];
// //   //         }
// //   //       } = {};

// //   //       // Initialize sampleExpressionMap for each sample
// //   //       Object.values(sampleMap).forEach((barcode: string) => {
// //   //         sampleExpressionMap[barcode] = {
// //   //           sample: barcode,
// //   //           values: []
// //   //         };
// //   //       });

// //   //       // Group expression values by sample
// //   //       expressionData.forEach(entry => {
// //   //         const sampleBarcode = sampleMap[entry.sample_id];
// //   //         const value = entry[normalizationMethod.toLowerCase() as 'tpm' | 'fpkm' | 'fpkm_uq'];
          
// //   //         if (!sampleBarcode || value == null || isNaN(value)) return;
          
// //   //         sampleExpressionMap[sampleBarcode].values.push(value);
// //   //       });

// //   //       // Validate that each sample has approximately 60660 genes
// //   //       Object.entries(sampleExpressionMap).forEach(([barcode, data]) => {
// //   //         if (data.values.length < 60660 * 0.9) { // Allow some missing genes
// //   //           console.warn(`⚠️ Sample ${barcode} has only ${data.values.length} genes, expected ~60660`);
// //   //         }
// //   //       });

// //   //       // Step 5: Calculate tumor heterogeneity metrics for each sample
// //   //       const processedData = Object.values(sampleExpressionMap)
// //   //         .map(sample => {
// //   //           const values = sample.values.filter(v => !isNaN(v));
// //   //           if (values.length === 0) {
// //   //             console.warn(`⚠️ No valid expression values for sample ${sample.sample}`);
// //   //             return null;
// //   //           }

// //   //           const {
// //   //             depth2, depth2Q1, depth2Q3, depth2Min, depth2Max, depth2Median
// //   //           } = calculateDepth2(values);

// //   //           const tith = calculateTITH(values);
// //   //           const diffNoise = variance(values);
// //   //           const normalNoise = mad(values);
// //   //           const tumorNoise = depth2;

// //   //           return {
// //   //             sample: sample.sample,
// //   //             [normalizationMethod.toLowerCase()]: mean(values),
// //   //             depth2,
// //   //             depth2Q1,
// //   //             depth2Q3,
// //   //             depth2Min,
// //   //             depth2Max,
// //   //             depth2Median,
// //   //             tith,
// //   //             diffNoise,
// //   //             normalNoise,
// //   //             tumorNoise,
// //   //             totalGenes: values.length
// //   //           };
// //   //         })
// //   //         .filter(Boolean);

// //   //       console.log("✅ Final tumor data:", processedData);
// //   //       if (isMounted) {
// //   //         setTumorData(processedData);
// //   //       }
// //   //     } catch (error) {
// //   //       console.error('Error fetching data:', error);
// //   //       setTumorData([]);
// //   //     } finally {
// //   //       if (isMounted) {
// //   //         setIsLoading(false);
// //   //       }
// //   //     }
// //   //   };

// //   //   fetchTumorExpressionData();
// //   //   return () => {
// //   //     isMounted = false;
// //   //   };
// //   // }, [cancerType, normalizationMethod]);
// // //   useEffect(() => {
// // //   let isMounted = true;

// // //   const fetchTumorExpressionData = async () => {
// // //     if (!cancerType) return;
// // //     setIsLoading(true);
// // //     try {
// // //       // Step 1: Fetch cancer type ID
// // //       const { data: cancerTypeData, error: cancerTypeError } = await supabase
// // //         .from('cancer_types')
// // //         .select('id')
// // //         .eq('tcga_code', cancerType)
// // //         .single();

// // //       if (cancerTypeError) throw cancerTypeError;
// // //       const cancerTypeId = cancerTypeData.id;

// // //       // Step 2: Fetch tumor samples
// // //       const { data: samplesData, error: samplesError } = await supabase
// // //         .from('samples')
// // //         .select('id, sample_barcode, sample_type')
// // //         .eq('cancer_type_id', cancerTypeId)
// // //         .eq('sample_type', 'tumor');

// // //       if (samplesError) throw samplesError;
// // //       if (!samplesData || samplesData.length === 0) {
// // //         console.warn("⚠️ No tumor samples found for:", cancerType);
// // //         setTumorData([]);
// // //         setTotalTumorSamples(0);
// // //         return;
// // //       }

// // //       const sampleMap: { [id: number]: string } = Object.fromEntries(
// // //         samplesData.map(s => [s.id, s.sample_barcode])
// // //       );
// // //       const sampleIds = samplesData.map(s => s.id);
// // //       setTotalTumorSamples(samplesData.length);

// // //       // Step 3: Fetch expression data for each sample individually with pagination
// // //       const pageSize = 5000; // Smaller page size to avoid timeouts
// // //       const allExpressionData: { gene_id: number; sample_id: number; [key: string]: number }[] = [];
// // //       const normalizationColumn = normalizationMethod.toLowerCase() as 'tpm' | 'fpkm' | 'fpkm_uq';

// // //       for (const sampleId of sampleIds) {
// // //         let page = 0;
// // //         let hasMore = true;

// // //         while (hasMore) {
// // //           try {
// // //             const { data: expressionData, error: expressionError, count } = await supabase
// // //               .from('expression_values')
// // //               .select(`gene_id, sample_id, ${normalizationColumn}`, { count: 'exact' })
// // //               .eq('sample_id', sampleId)
// // //               .range(page * pageSize, (page + 1) * pageSize - 1);

// // //             if (expressionError) {
// // //               console.error(`Error fetching data for sample ${sampleMap[sampleId]}:`, expressionError);
// // //               hasMore = false;
// // //               continue;
// // //             }

// // //             if (!expressionData || expressionData.length === 0) {
// // //               hasMore = false;
// // //               continue;
// // //             }

// // //             allExpressionData.push(...expressionData);
// // //             page += 1;

// // //             // Check if there are more rows to fetch for this sample
// // //             if (count && expressionData.length < pageSize) {
// // //               hasMore = false;
// // //             }
// // //           } catch (error) {
// // //             console.error(`Error fetching page ${page} for sample ${sampleMap[sampleId]}:`, error);
// // //             hasMore = false; // Stop on error to avoid infinite loop
// // //           }
// // //         }
// // //       }

// // //       if (allExpressionData.length === 0) {
// // //         console.warn("⚠️ No expression data found for any samples.");
// // //         setTumorData([]);
// // //         return;
// // //       }

// // //       console.log(`✅ Fetched ${allExpressionData.length} expression records`);

// // //       // Step 4: Group expression data by sample
// // //       const sampleExpressionMap: {
// // //         [sampleBarcode: string]: {
// // //           sample: string;
// // //           values: number[];
// // //         }
// // //       } = {};

// // //       // Initialize sampleExpressionMap for each sample
// // //       Object.values(sampleMap).forEach((barcode: string) => {
// // //         sampleExpressionMap[barcode] = {
// // //           sample: barcode,
// // //           values: []
// // //         };
// // //       });

// // //       // Group expression values by sample
// // //       allExpressionData.forEach(entry => {
// // //         const sampleBarcode = sampleMap[entry.sample_id];
// // //         const value = entry[normalizationColumn];
        
// // //         if (!sampleBarcode || value == null || isNaN(value)) return;
        
// // //         sampleExpressionMap[sampleBarcode].values.push(value);
// // //       });

// // //       // Validate that each sample has approximately 60660 genes
// // //       Object.entries(sampleExpressionMap).forEach(([barcode, data]) => {
// // //         if (data.values.length < 60660 * 0.9) {
// // //           console.warn(`⚠️ Sample ${barcode} has only ${data.values.length} genes, expected ~60660`);
// // //         }
// // //         console.log(`Sample ${barcode} has ${data.values.length} valid genes`);
// // //       });

// // //       // Step 5: Calculate tumor heterogeneity metrics for each sample
// // //       const processedData = Object.values(sampleExpressionMap)
// // //         .map(sample => {
// // //           const values = sample.values.filter(v => !isNaN(v));
// // //           if (values.length === 0) {
// // //             console.warn(`⚠️ No valid expression values for sample ${sample.sample}`);
// // //             return null;
// // //           }

// // //           const {
// // //             depth2, depth2Q1, depth2Q3, depth2Min, depth2Max, depth2Median
// // //           } = calculateDepth2(values);

// // //           const tith = calculateTITH(values);
// // //           const diffNoise = variance(values);
// // //           const normalNoise = mad(values);
// // //           const tumorNoise = depth2;

// // //           return {
// // //             sample: sample.sample,
// // //             [normalizationColumn]: mean(values),
// // //             depth2,
// // //             depth2Q1,
// // //             depth2Q3,
// // //             depth2Min,
// // //             depth2Max,
// // //             depth2Median,
// // //             tith,
// // //             diffNoise,
// // //             normalNoise,
// // //             tumorNoise,
// // //             totalGenes: values.length
// // //           };
// // //         })
// // //         .filter(Boolean);

// // //       console.log("✅ Final tumor data:", processedData);
// // //       if (isMounted) {
// // //         setTumorData(processedData);
// // //       }
// // //     } catch (error) {
// // //       console.error('Error fetching data:', error);
// // //       setTumorData([]);
// // //     } finally {
// // //       if (isMounted) {
// // //         setIsLoading(false);
// // //       }
// // //     }
// // //   };

// // //   fetchTumorExpressionData();
// // //   return () => {
// // //     isMounted = false;
// // //   };
// // // }, [cancerType, normalizationMethod]);
// // // useEffect(() => {
// // //   let isMounted = true;

// // //   const fetchTumorExpressionData = async () => {
// // //     if (!cancerType) return;
// // //     setIsLoading(true);
// // //     try {
// // //       // Step 1: Fetch cancer type ID
// // //       const { data: cancerTypeData, error: cancerTypeError } = await supabase
// // //         .from('cancer_types')
// // //         .select('id')
// // //         .eq('tcga_code', cancerType)
// // //         .single();

// // //       if (cancerTypeError) throw cancerTypeError;
// // //       const cancerTypeId = cancerTypeData.id;

// // //       // Step 2: Fetch tumor samples
// // //       const { data: samplesData, error: samplesError } = await supabase
// // //         .from('samples')
// // //         .select('id, sample_barcode, sample_type')
// // //         .eq('cancer_type_id', cancerTypeId)
// // //         .eq('sample_type', 'tumor');

// // //       if (samplesError) throw samplesError;
// // //       if (!samplesData || samplesData.length === 0) {
// // //         console.warn("⚠️ No tumor samples found for:", cancerType);
// // //         setTumorData([]);
// // //         setTotalTumorSamples(0);
// // //         return;
// // //       }

// // //       const sampleMap: { [id: number]: string } = Object.fromEntries(
// // //         samplesData.map(s => [s.id, s.sample_barcode])
// // //       );
// // //       const sampleIds = samplesData.map(s => s.id);
// // //       setTotalTumorSamples(samplesData.length);
// // //       console.log(`✅ Found ${samplesData.length} tumor samples`);

// // //       // Step 3: Fetch expression data for each sample individually with pagination
// // //       const pageSize = 7000; // Adjust based on performance (large enough to reduce requests)
// // //       const maxRowsPerSample = 60661; // Slightly above 60660 to ensure all genes are fetched
// // //       const allExpressionData: { gene_id: number; sample_id: number; [key: string]: number }[] = [];
// // //       const normalizationColumn = normalizationMethod.toLowerCase() as 'tpm' | 'fpkm' | 'fpkm_uq';

// // //       for (const sampleId of sampleIds) {
// // //         let page = 0;
// // //         let hasMore = true;
// // //         let totalRowsFetched = 0;

// // //         while (hasMore) {
// // //           try {
// // //             const { data: expressionData, error: expressionError, count } = await supabase
// // //               .from('expression_values')
// // //               .select(`gene_id, sample_id, ${normalizationColumn}`, { count: 'exact' })
// // //               .eq('sample_id', sampleId)
// // //               .range(page * pageSize, (page + 1) * pageSize - 1)
// // //               .limit(maxRowsPerSample); // Explicitly set limit to avoid default 1000

// // //             if (expressionError) {
// // //               console.error(`Error fetching data for sample ${sampleMap[sampleId]} (page ${page}):`, expressionError);
// // //               hasMore = false;
// // //               continue;
// // //             }

// // //             if (!expressionData || expressionData.length === 0) {
// // //               console.warn(`No expression data for sample ${sampleMap[sampleId]} (page ${page})`);
// // //               hasMore = false;
// // //               continue;
// // //             }

// // //             allExpressionData.push(...expressionData);
// // //             totalRowsFetched += expressionData.length;
// // //             page += 1;

// // //             // Log progress for this sample
// // //             console.log(`Sample ${sampleMap[sampleId]}: Fetched ${expressionData.length} rows (page ${page}, total ${totalRowsFetched})`);

// // //             // Check if there are more rows to fetch
// // //             if (count && totalRowsFetched >= count) {
// // //               hasMore = false;
// // //             }
// // //             if (totalRowsFetched >= maxRowsPerSample) {
// // //               hasMore = false;
// // //               console.warn(`Stopped fetching for sample ${sampleMap[sampleId]} after ${totalRowsFetched} rows`);
// // //             }
// // //           } catch (error) {
// // //             console.error(`Error fetching page ${page} for sample ${sampleMap[sampleId]}:`, error);
// // //             hasMore = false;
// // //           }
// // //         }

// // //         console.log(`Sample ${sampleMap[sampleId]}: Total rows fetched = ${totalRowsFetched}`);
// // //       }

// // //       if (allExpressionData.length === 0) {
// // //         console.warn("⚠️ No expression data found for any samples.");
// // //         setTumorData([]);
// // //         return;
// // //       }

// // //       console.log(`✅ Fetched ${allExpressionData.length} expression records`);

// // //       // Step 4: Group expression data by sample
// // //       const sampleExpressionMap: {
// // //         [sampleBarcode: string]: {
// // //           sample: string;
// // //           values: number[];
// // //         }
// // //       } = {};

// // //       // Initialize sampleExpressionMap for each sample
// // //       Object.values(sampleMap).forEach((barcode: string) => {
// // //         sampleExpressionMap[barcode] = {
// // //           sample: barcode,
// // //           values: []
// // //         };
// // //       });

// // //       // Group expression values by sample
// // //       allExpressionData.forEach(entry => {
// // //         const sampleBarcode = sampleMap[entry.sample_id];
// // //         const value = entry[normalizationColumn];
        
// // //         if (!sampleBarcode || value == null || isNaN(value)) return;
        
// // //         sampleExpressionMap[sampleBarcode].values.push(value);
// // //       });

// // //       // Validate that each sample has approximately 60660 genes
// // //       Object.entries(sampleExpressionMap).forEach(([barcode, data]) => {
// // //         const validGeneCount = data.values.length;
// // //         if (validGeneCount < 60660 * 0.9) {
// // //           console.warn(`⚠️ Sample ${barcode} has only ${validGeneCount} genes, expected ~60660`);
// // //         }
// // //         console.log(`Sample ${barcode} has ${validGeneCount} valid genes`);
// // //       });

// // //       // Step 5: Calculate tumor heterogeneity metrics for each sample
// // //       const processedData = Object.values(sampleExpressionMap)
// // //         .map(sample => {
// // //           const values = sample.values.filter(v => !isNaN(v));
// // //           if (values.length === 0) {
// // //             console.warn(`⚠️ No valid expression values for sample ${sample.sample}`);
// // //             return null;
// // //           }

// // //           const {
// // //             depth2, depth2Q1, depth2Q3, depth2Min, depth2Max, depth2Median
// // //           } = calculateDepth2(values);

// // //           const tith = calculateTITH(values);
// // //           const diffNoise = variance(values);
// // //           const normalNoise = mad(values);
// // //           const tumorNoise = depth2;

// // //           return {
// // //             sample: sample.sample,
// // //             [normalizationColumn]: mean(values),
// // //             depth2,
// // //             depth2Q1,
// // //             depth2Q3,
// // //             depth2Min,
// // //             depth2Max,
// // //             depth2Median,
// // //             tith,
// // //             diffNoise,
// // //             normalNoise,
// // //             tumorNoise,
// // //             totalGenes: values.length
// // //           };
// // //         })
// // //         .filter(Boolean);

// // //       console.log("✅ Final tumor data:", processedData);
// // //       if (isMounted) {
// // //         setTumorData(processedData);
// // //       }
// // //     } catch (error) {
// // //       console.error('Error fetching data:', error);
// // //       setTumorData([]);
// // //     } finally {
// // //       if (isMounted) {
// // //         setIsLoading(false);
// // //       }
// // //     }
// // //   };

// // //   fetchTumorExpressionData();
// // //   return () => {
// // //     isMounted = false;
// // //   };
// // // }, [cancerType, normalizationMethod]);

// // // useEffect(() => {
// // //   let isMounted = true;

// // //   const fetchTumorExpressionData = async () => {
// // //     if (!cancerType) return;
// // //     setIsLoading(true);

// // //     const cacheKey = `expressionData_${cancerType}_${normalizationMethod}`;
// // //     const cached = localStorage.getItem(cacheKey);
// // //     if (cached) {
// // //       console.log(`✅ Using cached data for ${cancerType} (${normalizationMethod})`);
// // //       setTumorData(JSON.parse(cached));
// // //       setIsLoading(false);
// // //       return;
// // //     }

// // //     try {
// // //       // Step 1: Fetch cancer type ID
// // //       const { data: cancerTypeData, error: cancerTypeError } = await supabase
// // //         .from('cancer_types')
// // //         .select('id')
// // //         .eq('tcga_code', cancerType)
// // //         .single();

// // //       if (cancerTypeError) throw cancerTypeError;
// // //       const cancerTypeId = cancerTypeData.id;

// // //       // Step 2: Fetch tumor samples
// // //       const { data: samplesData, error: samplesError } = await supabase
// // //         .from('samples')
// // //         .select('id, sample_barcode, sample_type')
// // //         .eq('cancer_type_id', cancerTypeId)
// // //         .eq('sample_type', 'tumor');

// // //       if (samplesError) throw samplesError;
// // //       if (!samplesData || samplesData.length === 0) {
// // //         console.warn("⚠️ No tumor samples found for:", cancerType);
// // //         setTumorData([]);
// // //         setTotalTumorSamples(0);
// // //         return;
// // //       }

// // //       const sampleMap: { [id: number]: string } = Object.fromEntries(
// // //         samplesData.map(s => [s.id, s.sample_barcode])
// // //       );
// // //       const sampleIds = samplesData.map(s => s.id);
// // //       setTotalTumorSamples(samplesData.length);
// // //       console.log(`✅ Found ${samplesData.length} tumor samples`);

// // //       // Step 3: Verify row counts for each sample
// // //       const normalizationColumn = normalizationMethod.toLowerCase() as 'tpm' | 'fpkm' | 'fpkm_uq';
// // //       const rowCounts: { [sampleId: number]: number } = {};
// // //       for (const sampleId of sampleIds) {
// // //         const { count, error } = await supabase
// // //           .from('expression_values')
// // //           .select('*', { count: 'exact', head: true })
// // //           .eq('sample_id', sampleId);
// // //         if (error) {
// // //           console.error(`Error counting rows for sample ${sampleMap[sampleId]}:`, error);
// // //           rowCounts[sampleId] = 0;
// // //           continue;
// // //         }
// // //         rowCounts[sampleId] = count || 0;
// // //         console.log(`Sample ${sampleMap[sampleId]}: Expected rows = ${count}`);
// // //         if (count < 60660 * 0.9) {
// // //           console.warn(`⚠️ Sample ${sampleMap[sampleId]} has only ${count} rows, expected ~60660`);
// // //         }
// // //       }

// // //       // Step 4: Fetch expression data with pagination
// // //       const batchSize = 10000; // Adjust based on performance
// // //       const allExpressionData: { gene_id: number; sample_id: number; [key: string]: number }[] = [];

// // //       for (const sampleId of sampleIds) {
// // //         let from = 0;
// // //         let to = batchSize - 1;
// // //         let totalRowsFetched = 0;

// // //         while (true) {
// // //           try {
// // //             const { data: expressionData, error: expressionError, count } = await supabase
// // //               .from('expression_values')
// // //               .select(`gene_id, sample_id, ${normalizationColumn}`, { count: 'exact' })
// // //               .eq('sample_id', sampleId)
// // //               .range(from, to);

// // //             if (expressionError) {
// // //               if (expressionError.code === 'PGRST103') {
// // //                 console.log(`Sample ${sampleMap[sampleId]}: All rows fetched (total ${totalRowsFetched})`);
// // //                 break;
// // //               }
// // //               console.error(`Error fetching data for sample ${sampleMap[sampleId]} (range ${from}-${to}):`, expressionError);
// // //               break;
// // //             }

// // //             if (!expressionData || expressionData.length === 0) {
// // //               console.log(`Sample ${sampleMap[sampleId]}: No more data (total ${totalRowsFetched})`);
// // //               break;
// // //             }

// // //             allExpressionData.push(...expressionData);
// // //             totalRowsFetched += expressionData.length;
// // //             console.log(
// // //               `Sample ${sampleMap[sampleId]}: Fetched ${expressionData.length} rows (range ${from}-${to}, total ${totalRowsFetched}, count ${count})`
// // //             );

// // //             from += batchSize;
// // //             to += batchSize;

// // //             // Break if fewer rows than batchSize or count is reached
// // //             if (expressionData.length < batchSize || (count && totalRowsFetched >= count)) {
// // //               break;
// // //             }
// // //           } catch (error) {
// // //             console.error(`Error fetching range ${from}-${to} for sample ${sampleMap[sampleId]}:`, error);
// // //             break;
// // //           }
// // //         }

// // //         // Log invalid values
// // //         const sampleData = allExpressionData.filter(entry => entry.sample_id === sampleId);
// // //         const invalidCount = sampleData.filter(
// // //           entry => entry[normalizationColumn] == null || isNaN(entry[normalizationColumn])
// // //         ).length;
// // //         console.log(
// // //           `Sample ${sampleMap[sampleId]}: Total rows fetched = ${totalRowsFetched}, Invalid values = ${invalidCount}`
// // //         );

// // //         // Warn if fewer rows than expected
// // //         if (totalRowsFetched < 60660 * 0.9) {
// // //           console.warn(
// // //             `⚠️ Sample ${sampleMap[sampleId]} has only ${totalRowsFetched} rows, expected ~60660`
// // //           );
// // //         }
// // //       }

// // //       if (allExpressionData.length === 0) {
// // //         console.warn("⚠️ No expression data found for any samples.");
// // //         setTumorData([]);
// // //         return;
// // //       }

// // //       console.log(`✅ Fetched ${allExpressionData.length} expression records`);

// // //       // Step 5: Group expression data by sample
// // //       const sampleExpressionMap: {
// // //         [sampleBarcode: string]: {
// // //           sample: string;
// // //           values: number[];
// // //         }
// // //       } = {};

// // //       Object.values(sampleMap).forEach((barcode: string) => {
// // //         sampleExpressionMap[barcode] = {
// // //           sample: barcode,
// // //           values: []
// // //         };
// // //       });

// // //       allExpressionData.forEach(entry => {
// // //         const sampleBarcode = sampleMap[entry.sample_id];
// // //         const value = entry[normalizationColumn];
        
// // //         if (!sampleBarcode || value == null || isNaN(value)) return;
        
// // //         sampleExpressionMap[sampleBarcode].values.push(value);
// // //       });

// // //       // Validate valid genes
// // //       Object.entries(sampleExpressionMap).forEach(([barcode, data]) => {
// // //         const validGeneCount = data.values.length;
// // //         if (validGeneCount < 60660 * 0.9) {
// // //           console.warn(`⚠️ Sample ${barcode} has only ${validGeneCount} genes, expected ~60660`);
// // //         }
// // //         console.log(`Sample ${barcode} has ${validGeneCount} valid genes`);
// // //       });

// // //       // Step 6: Calculate tumor heterogeneity metrics
// // //       const processedData = Object.values(sampleExpressionMap)
// // //         .map(sample => {
// // //           const values = sample.values.filter(v => !isNaN(v));
// // //           if (values.length === 0) {
// // //             console.warn(`⚠️ No valid expression values for sample ${sample.sample}`);
// // //             return null;
// // //           }

// // //           const {
// // //             depth2, depth2Q1, depth2Q3, depth2Min, depth2Max, depth2Median
// // //           } = calculateDepth2(values);

// // //           const tith = calculateTITH(values);
// // //           const diffNoise = variance(values);
// // //           const normalNoise = mad(values);
// // //           const tumorNoise = depth2;

// // //           return {
// // //             sample: sample.sample,
// // //             [normalizationColumn]: mean(values),
// // //             depth2,
// // //             depth2Q1,
// // //             depth2Q3,
// // //             depth2Min,
// // //             depth2Max,
// // //             depth2Median,
// // //             tith,
// // //             diffNoise,
// // //             normalNoise,
// // //             tumorNoise,
// // //             totalGenes: values.length
// // //           };
// // //         })
// // //         .filter(Boolean);

// // //       console.log("✅ Final tumor data:", processedData);
// // //       if (isMounted) {
// // //         setTumorData(processedData);
// // //         localStorage.setItem(cacheKey, JSON.stringify(processedData));
// // //       }
// // //     } catch (error) {
// // //       console.error('Error fetching data:', error);
// // //       setTumorData([]);
// // //     } finally {
// // //       if (isMounted) {
// // //         setIsLoading(false);
// // //       }
// // //     }
// // //   };

// // //   fetchTumorExpressionData();
// // //   return () => {
// // //     isMounted = false;
// // //   };
// // // }, [cancerType, normalizationMethod]);

// // // useEffect(() => {
// // //   let isMounted = true;

// // //   const fetchTumorExpressionData = async () => {
// // //     if (!cancerType || !selectedNoiseMetrics) return;
// // //     setIsLoading(true);

// // //     const cacheKey = `expressionData_${cancerType}_${normalizationMethod}_${selectedNoiseMetrics}`;
// // //     const cached = localStorage.getItem(cacheKey);
// // //     if (cached) {
// // //       console.log(`✅ Using cached data for ${cancerType} (${normalizationMethod}, ${selectedNoiseMetrics})`);
// // //       setTumorData(JSON.parse(cached));
// // //       setIsLoading(false);
// // //       return;
// // //     }

// // //     try {
// // //       // Step 1: Fetch cancer type ID
// // //       const { data: cancerTypeData, error: cancerTypeError } = await supabase
// // //         .from('cancer_types')
// // //         .select('id')
// // //         .eq('tcga_code', cancerType)
// // //         .single();

// // //       if (cancerTypeError) throw cancerTypeError;
// // //       const cancerTypeId = cancerTypeData.id;

// // //       // Step 2: Fetch tumor samples
// // //       const { data: samplesData, error: samplesError } = await supabase
// // //         .from('samples')
// // //         .select('id, sample_barcode, sample_type')
// // //         .eq('cancer_type_id', cancerTypeId)
// // //         .eq('sample_type', 'tumor');

// // //       if (samplesError) throw samplesError;
// // //       if (!samplesData || samplesData.length === 0) {
// // //         console.warn("⚠️ No tumor samples found for:", cancerType);
// // //         setTumorData([]);
// // //         setTotalTumorSamples(0);
// // //         return;
// // //       }

// // //       const sampleMap: { [id: number]: string } = Object.fromEntries(
// // //         samplesData.map(s => [s.id, s.sample_barcode])
// // //       );
// // //       const sampleIds = samplesData.map(s => s.id);
// // //       setTotalTumorSamples(samplesData.length);
// // //       console.log(`✅ Found ${samplesData.length} tumor samples`);

// // //       // Step 3: Fetch precomputed metric data
// // //       const normalizationColumn = normalizationMethod.toLowerCase() as 'tpm' | 'fpkm' | 'fpkm_uq';
// // //       const { data: metricData, error: metricError } = await supabase
// // //         .from(`${selectedNoiseMetrics}`)
// // //         .select(`sample_id, ${normalizationColumn}`)
// // //         .in('sample_id', sampleIds);

// // //       if (metricError) {
// // //         console.error(`Error fetching ${selectedNoiseMetrics} data:`, metricError);
// // //         throw metricError;
// // //       }

// // //       if (!metricData || metricData.length === 0) {
// // //         console.warn(`⚠️ No ${selectedNoiseMetrics} data found for samples`);
// // //         setTumorData([]);
// // //         return;
// // //       }

// // //       console.log(`✅ Fetched ${metricData.length} ${selectedNoiseMetrics} records`);

// // //       // Step 4: Process metric data
// // //       const processedData = metricData
// // //         .map(entry => {
// // //           const sampleBarcode = sampleMap[entry.sample_id];
// // //           if (!sampleBarcode) {
// // //             console.warn(`⚠️ No sample barcode found for sample_id ${entry.sample_id}`);
// // //             return null;
// // //           }

// // //           const value = entry[normalizationColumn];
// // //           if (value == null || isNaN(value)) {
// // //             console.warn(`⚠️ Invalid ${normalizationColumn} value for sample ${sampleBarcode}`);
// // //             return null;
// // //           }

// // //           // Create output matching the expected format
// // //           return {
// // //             sample: sampleBarcode,
// // //             [normalizationColumn]: value,
// // //             // [selectedNoiseMetrics]: value, // Map the metric value to the selected metric
// // //             totalGenes: 1 // Placeholder, as we don't have gene count here
// // //             // Add other metrics (e.g., depth2Q1, depth2Q3) if needed, set to null or fetch from other tables
// // //           };
// // //         })
// // //         .filter(Boolean);

// // //       // Log missing samples
// // //       const fetchedSampleIds = new Set(metricData.map(entry => entry.sample_id));
// // //       sampleIds.forEach(sampleId => {
// // //         if (!fetchedSampleIds.has(sampleId)) {
// // //           console.warn(`⚠️ Sample ${sampleMap[sampleId]} missing from ${selectedNoiseMetrics} data`);
// // //         }
// // //       });

// // //       console.log("✅ Final tumor data:", processedData);
// // //       if (isMounted) {
// // //         setTumorData(processedData);
// // //         localStorage.setItem(cacheKey, JSON.stringify(processedData));
// // //       }
// // //     } catch (error) {
// // //       console.error('Error fetching data:', error);
// // //       setTumorData([]);
// // //     } finally {
// // //       if (isMounted) {
// // //         setIsLoading(false);
// // //       }
// // //     }
// // //   };

// // //   fetchTumorExpressionData();
// // //   return () => {
// // //     isMounted = false;
// // //   };
// // // }, [cancerType, normalizationMethod, selectedNoiseMetrics]);
// // useEffect(() => {
// //   let isMounted = true;

// //   const fetchTumorExpressionData = async () => {
// //     if (!cancerType || !selectedNoiseMetrics) return;
// //     setIsLoading(true);

// //     // Normalize and split metric names
// //     const validMetrics = ['DEPTH2', 'DEPTH - tITH']; // Exact table names
// //     const metrics = selectedNoiseMetrics
// //       .split(',')
// //       .map(metric => metric.trim())
// //       .filter(metric => validMetrics.includes(metric));

// //     if (metrics.length === 0) {
// //       console.error(`Invalid metrics: ${selectedNoiseMetrics}. Valid options: ${validMetrics.join(', ')}`);
// //       setTumorData([]);
// //       setIsLoading(false);
// //       return;
// //     }

// //     const cacheKey = `expressionData_${cancerType}_${normalizationMethod}_${metrics.join('_')}`;
// //     const cached = localStorage.getItem(cacheKey);
// //     if (cached) {
// //       console.log(`✅ Using cached data for ${cancerType} (${normalizationMethod}, ${metrics.join(', ')})`);
// //       setTumorData(JSON.parse(cached));
// //       setIsLoading(false);
// //       return;
// //     }

// //     try {
// //       // Step 1: Fetch cancer type ID
// //       const { data: cancerTypeData, error: cancerTypeError } = await supabase
// //         .from('cancer_types')
// //         .select('id')
// //         .eq('tcga_code', cancerType)
// //         .single();

// //       if (cancerTypeError) throw cancerTypeError;
// //       const cancerTypeId = cancerTypeData.id;

// //       // Step 2: Fetch tumor samples
// //       const { data: samplesData, error: samplesError } = await supabase
// //         .from('samples')
// //         .select('id, sample_barcode, sample_type')
// //         .eq('cancer_type_id', cancerTypeId)
// //         .eq('sample_type', 'tumor');

// //       if (samplesError) throw samplesError;
// //       if (!samplesData || samplesData.length === 0) {
// //         console.warn(`⚠️ No tumor samples found for: ${cancerType}`);
// //         setTumorData([]);
// //         setTotalTumorSamples(0);
// //         return;
// //       }

// //       const sampleMap: { [id: number]: string } = Object.fromEntries(
// //         samplesData.map(s => [s.id, s.sample_barcode])
// //       );
// //       const sampleIds = samplesData.map(s => s.id);
// //       setTotalTumorSamples(samplesData.length);
// //       console.log(`✅ Found ${samplesData.length} tumor samples`);

// //       // Step 3: Fetch precomputed metric data for each metric
// //       const normalizationColumn = normalizationMethod.toLowerCase() as 'tpm' | 'fpkm' | 'fpkm_uq';
// //       const metricResults = await Promise.all(
// //         metrics.map(async metric => {
// //           try {
// //             // Quote table name if it contains spaces or special characters
// //             const tableName = metric === 'DEPTH - tITH' ? '"DEPTH - tITH"' : metric;
// //             const { data, error } = await supabase
// //               .from(tableName)
// //               .select(`sample_id, ${normalizationColumn}`)
// //               .in('sample_id', sampleIds);

// //             if (error) {
// //               console.error(`Error fetching ${metric} data from table ${tableName}:`, error);
// //               return { metric, data: [], error };
// //             }

// //             console.log(`✅ Fetched ${data?.length || 0} ${metric} records`);
// //             return { metric, data, error: null };
// //           } catch (error) {
// //             console.error(`Error fetching ${metric} data:`, error);
// //             return { metric, data: [], error };
// //           }
// //         })
// //       );

// //       // Check for errors across all metrics
// //       const hasErrors = metricResults.some(result => result.error);
// //       if (hasErrors) {
// //         console.warn(`⚠️ Errors occurred while fetching some metrics: ${metrics.join(', ')}`);
// //       }

// //       // Step 4: Merge metric data
// //       const sampleExpressionMap: {
// //         [sampleBarcode: string]: {
// //           sample: string;
// //           [key: string]: any; // Dynamic metric values
// //         }
// //       } = {};

// //       // Initialize sampleExpressionMap for each sample
// //       Object.values(sampleMap).forEach(barcode => {
// //         sampleExpressionMap[barcode] = {
// //           sample: barcode,
// //           [normalizationColumn]: null,
// //           totalGenes: 1 // Placeholder
// //         };
// //         // Initialize all requested metrics (map to output field names)
// //         metrics.forEach(metric => {
// //           const fieldName = metric === 'DEPTH - tITH' ? 'tith' : metric.toLowerCase();
// //           sampleExpressionMap[barcode][fieldName] = null;
// //         });
// //       });

// //       // Merge data from each metric
// //       metricResults.forEach(({ metric, data }) => {
// //         if (data && data.length > 0) {
// //           const fieldName = metric === 'DEPTH - tITH' ? 'tith' : metric.toLowerCase();
// //           data.forEach(entry => {
// //             const sampleBarcode = sampleMap[entry.sample_id];
// //             if (!sampleBarcode) {
// //               console.warn(`⚠️ No sample barcode found for sample_id ${entry.sample_id} in ${metric}`);
// //               return;
// //             }

// //             const value = entry[normalizationColumn];
// //             if (value == null || isNaN(value)) {
// //               console.warn(`⚠️ Invalid ${normalizationColumn} value for sample ${sampleBarcode} in ${metric}`);
// //               return;
// //             }

// //             // Set the metric value
// //             sampleExpressionMap[sampleBarcode][fieldName] = value;
// //             // Set normalizationColumn value (use the first non-null value)
// //             if (sampleExpressionMap[sampleBarcode][normalizationColumn] == null) {
// //               sampleExpressionMap[sampleBarcode][normalizationColumn] = value;
// //             }
// //           });
// //         }
// //       });

// //       // Log missing samples for each metric
// //       metrics.forEach(metric => {
// //         const fetchedSampleIds = new Set(
// //           metricResults
// //             .find(result => result.metric === metric)
// //             ?.data.map(entry => entry.sample_id) || []
// //         );
// //         sampleIds.forEach(sampleId => {
// //           if (!fetchedSampleIds.has(sampleId)) {
// //             console.warn(`⚠️ Sample ${sampleMap[sampleId]} missing from ${metric} data`);
// //           }
// //         });
// //       });

// //       // Step 5: Create processed data
// //       const processedData = Object.values(sampleExpressionMap)
// //         .map(sampleData => {
// //           // Skip samples with no valid metric values
// //           const hasValidMetric = metrics.some(metric => {
// //             const fieldName = metric === 'DEPTH - tITH' ? 'tith' : metric.toLowerCase();
// //             return sampleData[fieldName] != null;
// //           });
// //           if (!hasValidMetric) {
// //             console.warn(`⚠️ No valid metric values for sample ${sampleData.sample}`);
// //             return null;
// //           }

// //           // Include all requested metrics in the output
// //           const result: { [key: string]: any } = {
// //             sample: sampleData.sample,
// //             [normalizationColumn]: sampleData[normalizationColumn],
// //             totalGenes: sampleData.totalGenes
// //           };
// //           metrics.forEach(metric => {
// //             const fieldName = metric === 'DEPTH - tITH' ? 'tith' : metric.toLowerCase();
// //             result[fieldName] = sampleData[fieldName];
// //           });

// //           return result;
// //         })
// //         .filter(Boolean);

// //       if (processedData.length === 0) {
// //         console.warn(`⚠️ No valid data processed for metrics: ${metrics.join(', ')}`);
// //         setTumorData([]);
// //         return;
// //       }

// //       console.log(`✅ Final tumor data:`, processedData);
// //       if (isMounted) {
// //         setTumorData(processedData);
// //         localStorage.setItem(cacheKey, JSON.stringify(processedData));
// //       }
// //     } catch (error) {
// //       console.error('Error fetching data:', error);
// //       setTumorData([]);
// //     } finally {
// //       if (isMounted) {
// //         setIsLoading(false);
// //       }
// //     }
// //   };

// //   fetchTumorExpressionData();
// //   return () => {
// //     isMounted = false;
// //   };
// // }, [cancerType, normalizationMethod, selectedNoiseMetrics]);

// //   const getCancerTypeLabel = (type: string) => {
// //     const labels: { [key: string]: string } = {
// //       "TCGA-BRCA": "Breast Cancer (BRCA)",
// //       "TCGA-LUAD": "Lung Cancer (LUAD)",
// //       "TCGA-PRAD": "Prostate Cancer (PRAD)",
// //       "TCGA-COAD": "Colorectal Cancer (COAD)",
// //       "TCGA-LIHC": "Liver Cancer (LIHC)",
// //       "TCGA-KIRC": "Kidney Cancer (KIRC)",
// //       "TCGA-STAD": "Stomach Cancer (STAD)",
// //       "TCGA-OV": "Ovarian Cancer (OV)",
// //       "TCGA-BLCA": "Bladder Cancer (BLCA)"
// //     };
// //     return labels[type] || type;
// //   };

// //   const downloadChart = (chartKey: string, chartName: string) => {
// //     const chartElement = chartRefs.current[chartKey];
// //     if (chartElement) {
// //       const svg = chartElement.querySelector('svg');
// //       if (svg) {
// //         const canvas = document.createElement('canvas');
// //         const ctx = canvas.getContext('2d');
// //         const img = new Image();
        
// //         const svgData = new XMLSerializer().serializeToString(svg);
// //         const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
// //         const url = URL.createObjectURL(svgBlob);
        
// //         img.onload = function() {
// //           canvas.width = img.width || 800;
// //           canvas.height = img.height || 400;
// //           ctx?.drawImage(img, 0, 0);
          
// //           canvas.toBlob((blob) => {
// //             if (blob) {
// //               const link = document.createElement('a');
// //               link.download = `${chartName.replace(/\s+/g, '_').toLowerCase()}_${Date.now()}.png`;
// //               link.href = URL.createObjectURL(blob);
// //               link.click();
// //               URL.revokeObjectURL(link.href);
// //             }
// //           });
// //           URL.revokeObjectURL(url);
// //         };
// //         img.src = url;
// //       }
// //     }
// //   };

// //   const downloadData = (format: string) => {
// //     const data = tumorData;
// //     let content = '';
// //     let filename = `tumor_analysis_${cancerType}_${Date.now()}`;

// //     if (format === 'csv') {
// //       const excludedKeys = ['tumorValues', 'normalValues', 'combinedValues'];
// //       const keys = Object.keys(data[0] || {}).filter(key => !excludedKeys.includes(key));
// //       const headers = keys.join(',');
// //       const rows = data.map(row => keys.map(key => row[key]).join(','));
// //       content = [headers, ...rows].join('\n');
// //       filename += '.csv';
// //     }

// //     const blob = new Blob([content], { type: format === 'csv' ? 'text/csv' : 'application/json' });
// //     const url = URL.createObjectURL(blob);
// //     const a = document.createElement('a');
// //     a.href = url;
// //     a.download = filename;
// //     a.click();
// //     URL.revokeObjectURL(url);
// //   };

// //   const colors = ['#2563eb', '#059669', '#dc2626', '#7c3aed', '#ea580c'];

// //   // Custom boxplot component
// //   const BoxplotBar = ({ data, dataKey, color, title }: any) => (
// //     <Card className="border-0 shadow-lg">
// //       <CardHeader className="pb-2">
// //         <CardTitle className="flex items-center justify-between text-sm">
// //           <div className="flex items-center space-x-2">
// //             <Box className="h-4 w-4" style={{ color }} />
// //             <span>{title}</span>
// //           </div>
// //           <Button 
// //             size="sm" 
// //             variant="outline" 
// //             onClick={() => downloadChart(`boxplot-${dataKey}`, title)}
// //             className="h-6 px-2 text-xs"
// //           >
// //             <Download className="h-3 w-3" />
// //           </Button>
// //         </CardTitle>
// //       </CardHeader>
// //       <CardContent className="pt-0">
// //         <div ref={el => chartRefs.current[`boxplot-${dataKey}`] = el}>
// //           <ResponsiveContainer width="100%" height={200}>
// //             <ComposedChart data={data} margin={{ top: 5, right: 5, left: 5, bottom: 25 }}>
// //               <CartesianGrid strokeDasharray="3 3" />
// //               <XAxis 
// //                 dataKey="sample" 
// //                 tick={{ fontSize: 10 }}
// //                 label={{ 
// //                   value: 'Samples', 
// //                   position: 'insideBottom', 
// //                   offset: -10, 
// //                   style: { fontSize: '10px' } 
// //                 }}
// //               />
// //               <YAxis 
// //                 tick={{ fontSize: 10 }}
// //                 label={{ 
// //                   value: title, 
// //                   angle: -90, 
// //                   position: 'insideLeft', 
// //                   dy: 55,
// //                   style: { fontSize: '10px' } 
// //                 }} 
// //               />
// //               <Tooltip 
// //                 formatter={(value: any) => [
// //                   typeof value === 'number' ? value.toFixed(2) : value,
// //                   title,
// //                 ]} 
// //               />
// //               <Bar dataKey={`${dataKey}Median`} fill={color}>
// //                 <ErrorBar dataKey={`${dataKey}Min`} width={4} stroke={color} />
// //                 <ErrorBar dataKey={`${dataKey}Max`} width={4} stroke={color} />
// //               </Bar>
// //             </ComposedChart>
// //           </ResponsiveContainer>
// //         </div>
// //       </CardContent>
// //     </Card>
// //   );

// //   // Custom scatter plot component for tITH
// //   const ScatterPlot = ({ data, dataKey, color, title }: any) => (
// //     <Card className="border-0 shadow-lg">
// //       <CardHeader className="pb-2">
// //         <CardTitle className="flex items-center justify-between text-sm">
// //           <div className="flex items-center space-x-2">
// //             <Box className="h-4 w-4" style={{ color }} />
// //             <span>{title}</span>
// //           </div>
// //           <Button 
// //             size="sm" 
// //             variant="outline" 
// //             onClick={() => downloadChart(`scatter-${dataKey}`, title)}
// //             className="h-6 px-2 text-xs"
// //           >
// //             <Download className="h-3 w-3" />
// //           </Button>
// //         </CardTitle>
// //       </CardHeader>
// //       <CardContent className="pt-0">
// //         <div ref={el => chartRefs.current[`scatter-${dataKey}`] = el}>
// //           <ResponsiveContainer width="100%" height={200}>
// //             <ComposedChart data={data} margin={{ top: 5, right: 5, left: 5, bottom: 25 }}>
// //               <CartesianGrid strokeDasharray="3 3" />
// //               <XAxis 
// //                 dataKey="sample" 
// //                 tick={{ fontSize: 10 }}
// //                 label={{ 
// //                   value: 'Samples', 
// //                   position: 'insideBottom', 
// //                   offset: -10, 
// //                   style: { fontSize: '10px' } 
// //                 }}
// //               />
// //               <YAxis 
// //                 tick={{ fontSize: 10 }}
// //                 label={{ 
// //                   value: title, 
// //                   angle: -90, 
// //                   position: 'insideLeft', 
// //                   dy: 55,
// //                   style: { fontSize: '10px' } 
// //                 }} 
// //               />
// //               <Tooltip 
// //                 formatter={(value: any) => [
// //                   typeof value === 'number' ? value.toFixed(2) : value,
// //                   title,
// //                 ]} 
// //               />
// //               <Scatter dataKey={dataKey} fill={color} />
// //             </ComposedChart>
// //           </ResponsiveContainer>
// //         </div>
// //       </CardContent>
// //     </Card>
// //   );

// //   // Custom bar chart component for noise rankings
// //   const BarChart = ({ data, dataKey, color, title }: any) => (
// //     <Card className="border-0 shadow-lg">
// //       <CardHeader className="pb-2">
// //         <CardTitle className="flex items-center justify-between text-sm">
// //           <div className="flex items-center space-x-2">
// //             <Box className="h-4 w-4" style={{ color }} />
// //             <span>{title}</span>
// //           </div>
// //           <Button 
// //             size="sm" 
// //             variant="outline" 
// //             onClick={() => downloadChart(`bar-${dataKey}`, title)}
// //             className="h-6 px-2 text-xs"
// //           >
// //             <Download className="h-3 w-3" />
// //           </Button>
// //         </CardTitle>
// //       </CardHeader>
// //       <CardContent className="pt-0">
// //         <div ref={el => chartRefs.current[`bar-${dataKey}`] = el}>
// //           <ResponsiveContainer width="100%" height={200}>
// //             <ComposedChart data={data} margin={{ top: 5, right: 5, left: 5, bottom: 25 }}>
// //               <CartesianGrid strokeDasharray="3 3" />
// //               <XAxis 
// //                 dataKey="sample" 
// //                 tick={{ fontSize: 10 }}
// //                 label={{ 
// //                   value: 'Samples', 
// //                   position: 'insideBottom', 
// //                   offset: -10, 
// //                   style: { fontSize: '10px' } 
// //                 }}
// //               />
// //               <YAxis 
// //                 tick={{ fontSize: 10 }}
// //                 label={{ 
// //                   value: title, 
// //                   angle: -90, 
// //                   position: 'insideLeft', 
// //                   dy: 55,
// //                   style: { fontSize: '10px' } 
// //                 }} 
// //               />
// //               <Tooltip 
// //                 formatter={(value: any) => [
// //                   typeof value === 'number' ? value.toFixed(2) : value,
// //                   title,
// //                 ]} 
// //               />
// //               <Bar dataKey={dataKey} fill={color} />
// //             </ComposedChart>
// //           </ResponsiveContainer>
// //         </div>
// //       </CardContent>
// //     </Card>
// //   );

// //   return (
// //     <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-yellow-50">
// //       <style>
// //         {`
// //           .chart-container {
// //             min-height: 200px;
// //             width: 100%;
// //             position: relative;
// //           }
// //         `}
// //       </style>
// //       <header className="bg-white shadow-sm border-b border-blue-100">
// //         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
// //           <div className="flex items-center justify-between">
// //             <div className="flex items-center space-x-3">
// //               <h1 className="text-2xl font-bold text-blue-900">Tumor Analysis Results</h1>
// //             </div>
// //             <nav className="flex space-x-6">
// //               <Link to="/" className="text-blue-700 hover:text-blue-600 font-medium transition-colors">
// //                 Home
// //               </Link>
// //               <Link to="/gene-analysis" className="text-blue-700 hover:text-blue-600 font-medium transition-colors">
// //                 Gene Analysis
// //               </Link>
// //               <Link to="/pathway-analysis" className="text-blue-700 hover:text-blue-600 font-medium transition-colors">
// //                 Pathway Analysis
// //               </Link>
// //               <Link to="/tumour-analysis" className="text-blue-500 font-medium">
// //                 Tumor Analysis
// //               </Link>
// //             </nav>
// //           </div>
// //         </div>
// //       </header>

// //       <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
// //         <div className="flex gap-6">
// //           {/* Left Sidebar - Filters */}
// //           <div className="w-80 flex-shrink-0">
// //             <Card className="border-0 shadow-lg bg-blue-100">
// //               <CardHeader className="pb-4">
// //                 <CardTitle className="text-blue-900">
// //                   Filters
// //                 </CardTitle>
// //               </CardHeader>
// //               <CardContent className="space-y-6">
// //                 {/* Expression Normalization Method */}
// //                 <div>
// //                   <h3 className="font-semibold text-blue-900 mb-3">Expression Normalization Method</h3>
// //                   <RadioGroup value={normalizationMethod} onValueChange={setNormalizationMethod}>
// //                     <div className="flex items-center space-x-2">
// //                       <RadioGroupItem value="tpm" id="tpm" />
// //                       <Label htmlFor="tpm">TPM</Label>
// //                     </div>
// //                     <div className="flex items-center space-x-2">
// //                       <RadioGroupItem value="fpkm" id="fpkm" />
// //                       <Label htmlFor="fpkm">FPKM</Label>
// //                     </div>
// //                     <div className="flex items-center space-x-2">
// //                       <RadioGroupItem value="fpkm_uq" id="fpkm_uq" />
// //                       <Label htmlFor="fpkm_uq">FPKM_UQ</Label>
// //                     </div>
// //                   </RadioGroup>
// //                 </div>

// //                 {/* Noise Metrics */}
// //                 <div className="border rounded-md bg-white">
// //                   <div className="flex justify-between items-center px-4 py-2">
// //                     <div className="flex items-center space-x-2">
// //                       <Checkbox
// //                         id="noise-metrics-master"
// //                         checked={areAllNoiseSelected}
// //                         onCheckedChange={toggleAllNoiseMetrics}
// //                       />
// //                       <Label htmlFor="noise-metrics-master" className="font-bold text-blue-900 -ml-5">Noise Metrics</Label>
// //                     </div>
// //                     <button
// //                       onClick={() => setIsNoiseMetricsOpen(prev => !prev)}
// //                       className="text-blue-900"
// //                     >
// //                       {isNoiseMetricsOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
// //                     </button>
// //                   </div>
// //                   {isNoiseMetricsOpen && (
// //                     <div className="px-4 py-2 space-y-2">
// //                       {allNoiseMetrics.map((metric) => (
// //                         <div key={metric} className="flex items-center space-x-2">
// //                           <Checkbox
// //                             id={`noise-${metric}`}
// //                             checked={selectedNoiseMetrics.includes(metric)}
// //                             onCheckedChange={() => handleNoiseMetricToggle(metric)}
// //                           />
// //                           <Label htmlFor={`noise-${metric}`} className="text-sm">{metric}</Label>
// //                         </div>
// //                       ))}
// //                     </div>
// //                   )}
// //                 </div>

// //                 {/* Analysis Plots */}
// //                 <div className="border rounded-md bg-white">
// //                   <div className="flex justify-between items-center px-4 py-2">
// //                     <div className="flex items-center space-x-2">
// //                       <Checkbox
// //                         id="analysis-plots-master"
// //                         checked={areAllPlotsSelected}
// //                         onCheckedChange={toggleAllPlots}
// //                       />
// //                       <Label htmlFor="analysis-plots-master" className="font-bold text-blue-900 -ml-5">Analysis Plots</Label>
// //                     </div>
// //                     <button
// //                       onClick={() => setIsAnalysisPlotsOpen(prev => !prev)}
// //                       className="text-blue-900"
// //                     >
// //                       {isAnalysisPlotsOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
// //                     </button>
// //                   </div>
// //                   {isAnalysisPlotsOpen && (
// //                     <div className="px-4 py-2 space-y-2">
// //                       {allPlotKeys.map(plotKey => (
// //                         <div key={plotKey} className="flex items-center space-x-2">
// //                           <Checkbox
// //                             id={`plot-${plotKey}`}
// //                             checked={visiblePlots[plotKey]}
// //                             onCheckedChange={() => handlePlotToggle(plotKey)}
// //                           />
// //                           <Label htmlFor={`plot-${plotKey}`} className="text-sm">
// //                             {{
// //                               depth2: 'DEPTH2 Boxplot',
// //                               tith: 'tITH Scatter Plot',
// //                               diffNoise: 'Differential Noise',
// //                               normalNoise: 'Normal State Noise',
// //                               tumorNoise: 'Tumor State Noise'
// //                             }[plotKey]}
// //                           </Label>
// //                         </div>
// //                       ))}
// //                     </div>
// //                   )}
// //                 </div>

// //                 <Button onClick={applyFilters} className="w-full bg-blue-600 hover:bg-blue-700">
// //                   Apply
// //                 </Button>
// //               </CardContent>
// //             </Card>
// //           </div>

// //           {/* Main Content */}
// //           <div className="flex-1">
// //             {isLoading ? (
// //               <div className="text-center text-blue-900">Loading charts...</div>
// //             ) : (
// //               <>
// //                 <Link to="/gene-analysis" className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-6 transition-colors">
// //                   <ArrowLeft className="h-4 w-4 mr-2" />
// //                   Back to Gene Analysis
// //                 </Link>

// //                 <div className="mb-8">
// //                   <h2 className="text-4xl font-bold text-blue-900 mb-2">
// //                     Results for {getCancerTypeLabel(cancerType)}
// //                   </h2>
// //                   <div className="flex items-center justify-between mb-4">
// //                     <div className="flex flex-wrap gap-2"></div>
// //                     <div className="flex space-x-4">
// //                       <Button onClick={() => downloadData('csv')} variant="outline" size="sm">
// //                         <Download className="h-4 w-4 mr-2" /> Download CSV
// //                       </Button>
// //                     </div>
// //                   </div>
// //                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
// //                     <Card className="border-0 shadow-lg">
// //                       <CardContent className="flex flex-col items-center p-4 text-center">
// //                         <Users className="h-6 w-6 text-blue-600 mb-2" />
// //                         <div className="text-2xl font-bold text-blue-600">{totalTumorSamples}</div>
// //                         <div className="text-xs text-gray-600">Total Tumor Samples</div>
// //                       </CardContent>
// //                     </Card>
// //                   </div>
// //                 </div>

// //                 {/* DEPTH2 and tITH Plots */}
// //                 {(visiblePlots.depth2 || visiblePlots.tith) && (
// //                   <div className="mb-8">
// //                     <h3 className="text-2xl font-bold text-blue-900 mb-4">Tumor Heterogeneity Metrics</h3>
// //                     <div className="grid lg:grid-cols-2 md:grid-cols-1 gap-4">
// //                       {visiblePlots.depth2 && (
// //                         <BoxplotBar 
// //                           data={tumorData} 
// //                           dataKey="depth2" 
// //                           color="#ea580c" 
// //                           title="DEPTH2 Scores" 
// //                         />
// //                       )}
// //                       {visiblePlots.tith && (
// //                         <ScatterPlot 
// //                           data={tumorData} 
// //                           dataKey="tith" 
// //                           color="#2563eb" 
// //                           title="Transcriptome-based Intra-Tumor Heterogeneity (tITH)" 
// //                         />
// //                       )}
// //                     </div>
// //                   </div>
// //                 )}

// //                 {/* Noise Rankings */}
// //                 {(visiblePlots.diffNoise || visiblePlots.normalNoise || visiblePlots.tumorNoise) && (
// //                   <div className="mb-8">
// //                     <h3 className="text-2xl font-bold text-blue-900 mb-4">Noise Rankings</h3>
// //                     <div className="grid lg:grid-cols-3 md:grid-cols-1 gap-4">
// //                       {visiblePlots.diffNoise && (
// //                         <BarChart 
// //                           data={tumorData.slice(0, 5)} 
// //                           dataKey="diffNoise" 
// //                           color="#dc2626" 
// //                           title="Samples with Highest Differential Noise" 
// //                         />
// //                       )}
// //                       {visiblePlots.normalNoise && (
// //                         <BarChart 
// //                           data={tumorData.slice(0, 5)} 
// //                           dataKey="normalNoise" 
// //                           color="#059669" 
// //                           title="Samples with Highest Normal State Noise" 
// //                         />
// //                       )}
// //                       {visiblePlots.tumorNoise && (
// //                         <BarChart 
// //                           data={tumorData.slice(0, 5)} 
// //                           dataKey="tumorNoise" 
// //                           color="#7c3aed" 
// //                           title="Samples with Highest Tumor State Noise" 
// //                         />
// //                       )}
// //                     </div>
// //                   </div>
// //                 )}
// //               </>
// //             )}
// //           </div>
// //         </div>
// //       </div>
// //       <footer className="bg-gray-100 text-gray-700 text-m mt-10 p-8 text-center border-t border-gray-300">
// //         <p className="text-blue-700 mt-4">© 2025 BIRL — This website is free and open to all users and there is no login requirement.</p>
// //         <p className="font-semibold text-blue-700 mt-4">Biomedical Informatics & Engineering Research Laboratory, Lahore University of Management Sciences</p>
// //         <p className="text-blue-700 mt-4">DHA, Lahore, Pakistan</p>
// //         <p className="text-blue-700 mt-4">+92 (42) 3560 8352</p>
// //       </footer>
// //     </div>
// //   );
// // };

// // export default TumourResults;
// // import { useState, useEffect, useRef } from "react";
// // import { useSearchParams, Link } from "react-router-dom";
// // import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
// // import { Button } from "@/components/ui/button";
// // import { Checkbox } from "@/components/ui/checkbox";
// // import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
// // import { Label } from "@/components/ui/label";
// // import { ArrowLeft, Download, Box, ChevronRight, ChevronDown, Users } from "lucide-react";
// // import supabase from "@/supabase-client";
// // import { 
// //   ResponsiveContainer, 
// //   XAxis, 
// //   YAxis, 
// //   CartesianGrid, 
// //   Tooltip,
// //   ComposedChart,
// //   Bar,
// //   Scatter
// // } from "recharts";

// // // Utility to debounce state updates
// // const debounce = (func: Function, wait: number) => {
// //   let timeout: NodeJS.Timeout;
// //   return (...args: any[]) => {
// //     clearTimeout(timeout);
// //     timeout = setTimeout(() => func(...args), wait);
// //   };
// // };

// // const TumourResults = () => {
// //   const [searchParams] = useSearchParams();
// //   const cancerType = searchParams.get('cancerType') || '';
  
// //   // Filter states
// //   const [normalizationMethod, setNormalizationMethod] = useState('tpm');
// //   const [selectedNoiseMetrics, setSelectedNoiseMetrics] = useState(['DEPTH2', 'DEPTH - tITH']);
// //   const [isNoiseMetricsOpen, setIsNoiseMetricsOpen] = useState(false);
// //   const [isAnalysisPlotsOpen, setIsAnalysisPlotsOpen] = useState(false);
// //   const [visiblePlots, setVisiblePlots] = useState({
// //     depth2: true,
// //     tith: true
// //   });
// //   const [totalTumorSamples, setTotalTumorSamples] = useState(0);
// //   const [isLoading, setIsLoading] = useState(false);
// //   const chartRefs = useRef<{[key: string]: any}>({});
// //   const [tumorData, setTumorData] = useState<any[]>([]);

// //   // Noise metric options
// //   const noiseMetrics = {
// //     'DEPTH2': 'depth2',
// //     'tITH': 'tith'
// //   };

// //   const allNoiseMetrics = Object.keys(noiseMetrics);
// //   const areAllNoiseSelected = allNoiseMetrics.every(metric => selectedNoiseMetrics.includes(metric));

// //   const allPlotKeys = ['depth2', 'tith'];
// //   const areAllPlotsSelected = allPlotKeys.every(plot => visiblePlots[plot]);

// //   // Handle noise metric selection
// //   const handleNoiseMetricToggle = debounce((metric: string) => {
// //     setSelectedNoiseMetrics(prev => 
// //       prev.includes(metric) 
// //         ? prev.filter(m => m !== metric)
// //         : [...prev, metric]
// //     );
// //   }, 100);

// //   // Handle master checkbox for noise metrics
// //   const toggleAllNoiseMetrics = debounce((checked: boolean) => {
// //     setSelectedNoiseMetrics(checked ? allNoiseMetrics : []);
// //   }, 100);

// //   // Handle individual plot visibility
// //   const handlePlotToggle = debounce((plotKey: string) => {
// //     setVisiblePlots(prev => ({
// //       ...prev,
// //       [plotKey]: !prev[plotKey]
// //     }));
// //   }, 100);

// //   // Handle master checkbox for plots
// //   const toggleAllPlots = debounce((checked: boolean) => {
// //     setVisiblePlots(prev => ({
// //       ...prev,
// //       ...Object.fromEntries(allPlotKeys.map(plot => [plot, checked]))
// //     }));
// //   }, 100);

// //   const applyFilters = () => {
// //     console.log('Applying filters:', {
// //       normalizationMethod,
// //       selectedNoiseMetrics,
// //       visiblePlots
// //     });
// //     setVisiblePlots(prev => ({
// //       ...prev,
// //       depth2: selectedNoiseMetrics.includes('DEPTH2'),
// //       tith: selectedNoiseMetrics.includes('tITH')
// //     }));
// //   };

// //   useEffect(() => {
// //     let isMounted = true;

// //     const fetchTumorExpressionData = async () => {
// //       console.log('Starting fetch:', { cancerType, normalizationMethod, selectedNoiseMetrics });
// //       if (!cancerType || !selectedNoiseMetrics.length) {
// //         console.warn('No cancerType or selectedNoiseMetrics provided');
// //         setTumorData([]);
// //         setIsLoading(false);
// //         return;
// //       }
// //       setIsLoading(true);

// //       // Validate metric names
// //       const validMetrics = ['DEPTH2', 'tITH'];
// //       const metrics = selectedNoiseMetrics.filter(metric => validMetrics.includes(metric));

// //       if (metrics.length === 0) {
// //         console.error(`Invalid metrics: ${selectedNoiseMetrics.join(', ')}. Valid options: ${validMetrics.join(', ')}`);
// //         setTumorData([]);
// //         setIsLoading(false);
// //         return;
// //       } 

// //       const cacheKey = `expressionData_${cancerType}_${normalizationMethod}_${metrics.join('_')}`;
// //       const cached = localStorage.getItem(cacheKey);
// //       if (cached) {
// //         console.log(`✅ Using cached data for ${cancerType} (${normalizationMethod}, ${metrics.join(', ')})`);
// //         setTumorData(JSON.parse(cached));
// //         setIsLoading(false);
// //         return;
// //       }

// //       try {
// //         // Step 1: Fetch cancer type ID
// //         const { data: cancerTypeData, error: cancerTypeError } = await supabase
// //           .from('cancer_types')
// //           .select('id')
// //           .eq('tcga_code', cancerType)
// //           .single();

// //         if (cancerTypeError) throw cancerTypeError;
// //         const cancerTypeId = cancerTypeData.id;

// //         // Step 2: Fetch tumor samples
// //         const { data: samplesData, error: samplesError } = await supabase
// //           .from('samples')
// //           .select('id, sample_barcode, sample_type')
// //           .eq('cancer_type_id', cancerTypeId)
// //           .eq('sample_type', 'tumor');

// //         if (samplesError) throw samplesError;
// //         if (!samplesData || samplesData.length === 0) {
// //           console.warn(`⚠️ No tumor samples found for: ${cancerType}`);
// //           setTumorData([]);
// //           setTotalTumorSamples(0);
// //           return;
// //         }

// //         console.log('Samples fetched:', samplesData);
// //         const sampleMap: { [id: number]: string } = Object.fromEntries(
// //           samplesData.map(s => [s.id, s.sample_barcode])
// //         );
// //         const sampleIds = samplesData.map(s => s.id);
// //         setTotalTumorSamples(samplesData.length);
// //         console.log(`✅ Found ${samplesData.length} tumor samples`);

// //         // Step 3: Fetch precomputed metric data for each metric
// //         const normalizationColumn = normalizationMethod.toLowerCase() as 'tpm' | 'fpkm' | 'fpkm_uq';
// //         const metricResults = await Promise.all(
// //           metrics.map(async metric => {
// //             try {
// //               const tableName = metric === 'tITH' ? 'tITH' : metric;
// //               const { data, error } = await supabase
// //                 .from(tableName)
// //                 .select(`sample_id, ${normalizationColumn}`)
// //                 .in('sample_id', sampleIds);

// //               if (error) {
// //                 console.error(`Error fetching ${metric} data from table ${tableName}:`, error);
// //                 return { metric, data: [], error };
// //               }

// //               console.log(`✅ Fetched ${data?.length || 0} ${metric} records`);
// //               return { metric, data, error: null };
// //             } catch (error) {
// //               console.error(`Error fetching ${metric} data:`, error);
// //               return { metric, data: [], error };
// //             }
// //           })
// //         );

// //         console.log('Metric results:', metricResults);
// //         const hasErrors = metricResults.some(result => result.error);
// //         if (hasErrors) {
// //           console.warn(`⚠️ Errors occurred while fetching some metrics: ${metrics.join(', ')}`);
// //         }

// //         // Step 4: Merge metric data
// //         const sampleExpressionMap: {
// //           [sampleBarcode: string]: {
// //             sample: string;
// //             [key: string]: any; // Dynamic metric values
// //           }
// //         } = {};

// //         Object.values(sampleMap).forEach(barcode => {
// //           sampleExpressionMap[barcode] = {
// //             sample: barcode,
// //             [normalizationColumn]: null,
// //             totalGenes: 1 // Placeholder
// //           };
// //           metrics.forEach(metric => {
// //             const fieldName = noiseMetrics[metric as keyof typeof noiseMetrics] || metric.toLowerCase();
// //             sampleExpressionMap[barcode][fieldName] = null;
// //           });
// //         });

// //         metricResults.forEach(({ metric, data }) => {
// //           if (data && data.length > 0) {
// //             const fieldName = noiseMetrics[metric as keyof typeof noiseMetrics] || metric.toLowerCase();
// //             data.forEach(entry => {
// //               const sampleBarcode = sampleMap[entry.sample_id];
// //               if (!sampleBarcode) {
// //                 console.warn(`⚠️ No sample barcode found for sample_id ${entry.sample_id} in ${metric}`);
// //                 return;
// //               }

// //               const value = entry[normalizationColumn];
// //               if (value == null || isNaN(value)) {
// //                 console.warn(`⚠️ Invalid ${normalizationColumn} value for sample ${sampleBarcode} in ${metric}`);
// //                 return;
// //               }

// //               sampleExpressionMap[sampleBarcode][fieldName] = value;
// //               if (sampleExpressionMap[sampleBarcode][normalizationColumn] == null) {
// //                 sampleExpressionMap[sampleBarcode][normalizationColumn] = value;
// //               }
// //             });
// //           }
// //         });

// //         metrics.forEach(metric => {
// //           const fetchedSampleIds = new Set(
// //             metricResults
// //               .find(result => result.metric === metric)
// //               ?.data.map(entry => entry.sample_id) || []
// //           );
// //           sampleIds.forEach(sampleId => {
// //             if (!fetchedSampleIds.has(sampleId)) {
// //               console.warn(`⚠️ Sample ${sampleMap[sampleId]} missing from ${metric} data`);
// //             }
// //           });
// //         });

// //         // Step 5: Create processed data
// //         const processedData = Object.values(sampleExpressionMap)
// //           .map(sampleData => {
// //             const hasValidMetric = metrics.some(metric => {
// //               const fieldName = noiseMetrics[metric as keyof typeof noiseMetrics] || metric.toLowerCase();
// //               return sampleData[fieldName] != null;
// //             });
// //             if (!hasValidMetric) {
// //               console.warn(`⚠️ No valid metric values for sample ${sampleData.sample}`);
// //               return null;
// //             }

// //             const result: { [key: string]: any } = {
// //               sample: sampleData.sample,
// //               [normalizationMethod.toLowerCase()]: sampleData[normalizationMethod.toLowerCase()],
// //               totalGenes: sampleData.totalGenes
// //             };
// //             metrics.forEach(metric => {
// //               const fieldName = noiseMetrics[metric as keyof typeof noiseMetrics] || metric.toLowerCase();
// //               result[fieldName] = sampleData[fieldName];
// //             });

// //             return result;
// //           })
// //           .filter(Boolean);

// //         if (processedData.length === 0) {
// //           console.warn(`⚠️ No valid data processed for metrics: ${metrics.join(', ')}`);
// //           setTumorData([]);
// //           return;
// //         }

// //         console.log(`✅ Final tumor data:`, processedData);
// //         if (isMounted) {
// //           setTumorData(processedData);
// //           localStorage.setItem(cacheKey, JSON.stringify(processedData));
// //         }
// //       } catch (error) {
// //         console.error('Error fetching data:', error);
// //         setTumorData([]);
// //       } finally {
// //         if (isMounted) {
// //           setIsLoading(false);
// //         }
// //       }
// //     };

// //     fetchTumorExpressionData();
// //     return () => {
// //       isMounted = false;
// //     };
// //   }, [cancerType, normalizationMethod, selectedNoiseMetrics]);

// //   const getCancerTypeLabel = (type: string) => {
// //     const labels: { [key: string]: string } = {
// //       "TCGA-BRCA": "Breast Cancer (BRCA)",
// //       "TCGA-LUAD": "Lung Cancer (LUAD)",
// //       "TCGA-PRAD": "Prostate Cancer (PRAD)",
// //       "TCGA-COAD": "Colorectal Cancer (COAD)",
// //       "TCGA-LIHC": "Liver Cancer (LIHC)",
// //       "TCGA-KIRC": "Kidney Cancer (KIRC)",
// //       "TCGA-STAD": "Stomach Cancer (STAD)",
// //       "TCGA-OV": "Ovarian Cancer (OV)",
// //       "TCGA-BLCA": "Bladder Cancer (BLCA)"
// //     };
// //     return labels[type] || type;
// //   };

// //   const downloadChart = (chartKey: string, chartName: string) => {
// //     const chartElement = chartRefs.current[chartKey];
// //     if (chartElement) {
// //       const svg = chartElement.querySelector('svg');
// //       if (svg) {
// //         const canvas = document.createElement('canvas');
// //         const ctx = canvas.getContext('2d');
// //         const img = new Image();
        
// //         const svgData = new XMLSerializer().serializeToString(svg);
// //         const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
// //         const url = URL.createObjectURL(svgBlob);
        
// //         img.onload = function() {
// //           canvas.width = img.width || 800;
// //           canvas.height = img.height || 400;
// //           ctx?.drawImage(img, 0, 0);
          
// //           canvas.toBlob((blob) => {
// //             if (blob) {
// //               const link = document.createElement('a');
// //               link.download = `${chartName.replace(/\s+/g, '_').toLowerCase()}_${Date.now()}.png`;
// //               link.href = URL.createObjectURL(blob);
// //               link.click();
// //               URL.revokeObjectURL(link.href);
// //             }
// //           });
// //           URL.revokeObjectURL(url);
// //         };
// //         img.src = url;
// //       }
// //     }
// //   };

// //   const downloadData = (format: string) => {
// //     const data = tumorData;
// //     let content = '';
// //     let filename = `tumor_analysis_${cancerType}_${Date.now()}`;

// //     if (format === 'csv') {
// //       const excludedKeys = ['tumorValues', 'normalValues', 'combinedValues'];
// //       const keys = Object.keys(data[0] || {}).filter(key => !excludedKeys.includes(key));
// //       const headers = keys.join(',');
// //       const rows = data.map(row => keys.map(key => row[key]).join(','));
// //       content = [headers, ...rows].join('\n');
// //       filename += '.csv';
// //     }

// //     const blob = new Blob([content], { type: format === 'csv' ? 'text/csv' : 'application/json' });
// //     const url = URL.createObjectURL(blob);
// //     const a = document.createElement('a');
// //     a.href = url;
// //     a.download = filename;
// //     a.click();
// //     URL.revokeObjectURL(url);
// //   };

// //   const colors = ['#2563eb', '#059669', '#dc2626', '#7c3aed', '#ea580c'];

// //   // Custom bar chart component for DEPTH2 (replacing boxplot)
// //   const BarChart = ({ data, dataKey, color, title }: any) => (
// //     <Card className="border-0 shadow-lg">
// //       <CardHeader className="pb-2">
// //         <CardTitle className="flex items-center justify-between text-sm">
// //           <div className="flex items-center space-x-2">
// //             <Box className="h-4 w-4" style={{ color }} />
// //             <span>{title}</span>
// //           </div>
// //           <Button 
// //             size="sm" 
// //             variant="outline" 
// //             onClick={() => downloadChart(`bar-${dataKey}`, title)}
// //             className="h-6 px-2 text-xs"
// //           >
// //             <Download className="h-3 w-3" />
// //           </Button>
// //         </CardTitle>
// //       </CardHeader>
// //       <CardContent className="pt-0">
// //         <div ref={el => chartRefs.current[`bar-${dataKey}`] = el}>
// //           <ResponsiveContainer width="100%" height={200}>
// //             <ComposedChart data={data} margin={{ top: 5, right: 5, left: 5, bottom: 25 }}>
// //               <CartesianGrid strokeDasharray="3 3" />
// //               <XAxis 
// //                 dataKey="sample" 
// //                 tick={{ fontSize: 10 }}
// //                 label={{ 
// //                   value: 'Samples', 
// //                   position: 'insideBottom', 
// //                   offset: -10, 
// //                   style: { fontSize: '10px' } 
// //                 }}
// //               />
// //               <YAxis 
// //                 tick={{ fontSize: 10 }}
// //                 label={{ 
// //                   value: title, 
// //                   angle: -90, 
// //                   position: 'insideLeft', 
// //                   dy: 55,
// //                   style: { fontSize: '10px' } 
// //                 }} 
// //               />
// //               <Tooltip 
// //                 formatter={(value: any) => [
// //                   typeof value === 'number' ? value.toFixed(2) : value,
// //                   title,
// //                 ]} 
// //               />
// //               <Bar dataKey={dataKey} fill={color} />
// //             </ComposedChart>
// //           </ResponsiveContainer>
// //         </div>
// //       </CardContent>
// //     </Card>
// //   );

// //   // Custom scatter plot component for tITH
// //   const ScatterPlot = ({ data, dataKey, color, title }: any) => (
// //     <Card className="border-0 shadow-lg">
// //       <CardHeader className="pb-2">
// //         <CardTitle className="flex items-center justify-between text-sm">
// //           <div className="flex items-center space-x-2">
// //             <Box className="h-4 w-4" style={{ color }} />
// //             <span>{title}</span>
// //           </div>
// //           <Button 
// //             size="sm" 
// //             variant="outline" 
// //             onClick={() => downloadChart(`scatter-${dataKey}`, title)}
// //             className="h-6 px-2 text-xs"
// //           >
// //             <Download className="h-3 w-3" />
// //           </Button>
// //         </CardTitle>
// //       </CardHeader>
// //       <CardContent className="pt-0">
// //         <div ref={el => chartRefs.current[`scatter-${dataKey}`] = el}>
// //           <ResponsiveContainer width="100%" height={200}>
// //             <ComposedChart data={data} margin={{ top: 5, right: 5, left: 5, bottom: 25 }}>
// //               <CartesianGrid strokeDasharray="3 3" />
// //               <XAxis 
// //                 dataKey="sample" 
// //                 tick={{ fontSize: 10 }}
// //                 label={{ 
// //                   value: 'Samples', 
// //                   position: 'insideBottom', 
// //                   offset: -10, 
// //                   style: { fontSize: '10px' } 
// //                 }}
// //               />
// //               <YAxis 
// //                 tick={{ fontSize: 10 }}
// //                 label={{ 
// //                   value: title, 
// //                   angle: -90, 
// //                   position: 'insideLeft', 
// //                   dy: 55,
// //                   style: { fontSize: '10px' } 
// //                 }} 
// //               />
// //               <Tooltip 
// //                 formatter={(value: any) => [
// //                   typeof value === 'number' ? value.toFixed(2) : value,
// //                   title,
// //                 ]} 
// //               />
// //               <Scatter dataKey={dataKey} fill={color} />
// //             </ComposedChart>
// //           </ResponsiveContainer>
// //         </div>
// //       </CardContent>
// //     </Card>
// //   );

// //   return (
// //     <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-yellow-50">
// //       <style>
// //         {`
// //           .chart-container {
// //             min-height: 200px;
// //             width: 100%;
// //             position: relative;
// //           }
// //         `}
// //       </style>
// //       <header className="bg-white shadow-sm border-b border-blue-100">
// //         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
// //           <div className="flex items-center justify-between">
// //             <div className="flex items-center space-x-3">
// //               <h1 className="text-2xl font-bold text-blue-900">Tumor Analysis Results</h1>
// //             </div>
// //             <nav className="flex space-x-6">
// //               <Link to="/" className="text-blue-700 hover:text-blue-600 font-medium transition-colors">
// //                 Home
// //               </Link>
// //               <Link to="/gene-analysis" className="text-blue-700 hover:text-blue-600 font-medium transition-colors">
// //                 Gene Analysis
// //               </Link>
// //               <Link to="/pathway-analysis" className="text-blue-700 hover:text-blue-600 font-medium transition-colors">
// //                 Pathway Analysis
// //               </Link>
// //               <Link to="/tumour-analysis" className="text-blue-500 font-medium">
// //                 Tumor Analysis
// //               </Link>
// //             </nav>
// //           </div>
// //         </div>
// //       </header>

// //       <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
// //         <div className="flex gap-6">
// //           {/* Left Sidebar - Filters */}
// //           <div className="w-80 flex-shrink-0">
// //             <Card className="border-0 shadow-lg bg-blue-100">
// //               <CardHeader className="pb-4">
// //                 <CardTitle className="text-blue-900">
// //                   Filters
// //                 </CardTitle>
// //               </CardHeader>
// //               <CardContent className="space-y-6">
// //                 {/* Expression Normalization Method */}
// //                 <div>
// //                   <h3 className="font-semibold text-blue-900 mb-3">Expression Normalization Method</h3>
// //                   <RadioGroup value={normalizationMethod} onValueChange={setNormalizationMethod}>
// //                     <div className="flex items-center space-x-2">
// //                       <RadioGroupItem value="tpm" id="tpm" />
// //                       <Label htmlFor="tpm">TPM</Label>
// //                     </div>
// //                     <div className="flex items-center space-x-2">
// //                       <RadioGroupItem value="fpkm" id="fpkm" />
// //                       <Label htmlFor="fpkm">FPKM</Label>
// //                     </div>
// //                     <div className="flex items-center space-x-2">
// //                       <RadioGroupItem value="fpkm_uq" id="fpkm_uq" />
// //                       <Label htmlFor="fpkm_uq">FPKM_UQ</Label>
// //                     </div>
// //                   </RadioGroup>
// //                 </div>

// //                 {/* Noise Metrics */}
// //                 <div className="border rounded-md bg-white">
// //                   <div className="flex justify-between items-center px-4 py-2">
// //                     <div className="flex items-center space-x-2">
// //                       <Checkbox
// //                         id="noise-metrics-master"
// //                         checked={areAllNoiseSelected}
// //                         onCheckedChange={toggleAllNoiseMetrics}
// //                       />
// //                       <Label htmlFor="noise-metrics-master" className="font-bold text-blue-900 -ml-5">Noise Metrics</Label>
// //                     </div>
// //                     <button
// //                       onClick={() => setIsNoiseMetricsOpen(prev => !prev)}
// //                       className="text-blue-900"
// //                     >
// //                       {isNoiseMetricsOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
// //                     </button>
// //                   </div>
// //                   {isNoiseMetricsOpen && (
// //                     <div className="px-4 py-2 space-y-2">
// //                       {allNoiseMetrics.map((metric) => (
// //                         <div key={metric} className="flex items-center space-x-2">
// //                           <Checkbox
// //                             id={`noise-${metric}`}
// //                             checked={selectedNoiseMetrics.includes(metric)}
// //                             onCheckedChange={() => handleNoiseMetricToggle(metric)}
// //                           />
// //                           <Label htmlFor={`noise-${metric}`} className="text-sm">{metric}</Label>
// //                         </div>
// //                       ))}
// //                     </div>
// //                   )}
// //                 </div>

// //                 {/* Analysis Plots */}
// //                 <div className="border rounded-md bg-white">
// //                   <div className="flex justify-between items-center px-4 py-2">
// //                     <div className="flex items-center space-x-2">
// //                       <Checkbox
// //                         id="analysis-plots-master"
// //                         checked={areAllPlotsSelected}
// //                         onCheckedChange={toggleAllPlots}
// //                       />
// //                       <Label htmlFor="analysis-plots-master" className="font-bold text-blue-900 -ml-5">Analysis Plots</Label>
// //                     </div>
// //                     <button
// //                       onClick={() => setIsAnalysisPlotsOpen(prev => !prev)}
// //                       className="text-blue-900"
// //                     >
// //                       {isAnalysisPlotsOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
// //                     </button>
// //                   </div>
// //                   {isAnalysisPlotsOpen && (
// //                     <div className="px-4 py-2 space-y-2">
// //                       {allPlotKeys.map(plotKey => (
// //                         <div key={plotKey} className="flex items-center space-x-2">
// //                           <Checkbox
// //                             id={`plot-${plotKey}`}
// //                             checked={visiblePlots[plotKey]}
// //                             onCheckedChange={() => handlePlotToggle(plotKey)}
// //                           />
// //                           <Label htmlFor={`plot-${plotKey}`} className="text-sm">
// //                             {{
// //                               depth2: 'DEPTH2 Bar Chart',
// //                               tith: 'tITH Scatter Plot'
// //                             }[plotKey]}
// //                           </Label>
// //                         </div>
// //                       ))}
// //                     </div>
// //                   )}
// //                 </div>

// //                 <Button onClick={applyFilters} className="w-full bg-blue-600 hover:bg-blue-700">
// //                   Apply
// //                 </Button>
// //               </CardContent>
// //             </Card>
// //           </div>

// //           {/* Main Content */}
// //           <div className="flex-1">
// //             {isLoading ? (
// //               <div className="text-center text-blue-900">Loading charts...</div>
// //             ) : (
// //               <>
// //                 <Link to="/tumour-analysis" className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-6 transition-colors">
// //                   <ArrowLeft className="h-4 w-4 mr-2" />
// //                   Back to Tumor Analysis
// //                 </Link>

// //                 <div className="mb-8">
// //                   <h2 className="text-4xl font-bold text-blue-900 mb-2">
// //                     Results for {getCancerTypeLabel(cancerType)}
// //                   </h2>
// //                   <div className="flex items-center justify-between mb-4">
// //                     <div className="flex flex-wrap gap-2"></div>
// //                     <div className="flex space-x-4">
// //                       <Button onClick={() => downloadData('csv')} variant="outline" size="sm">
// //                         <Download className="h-4 w-4 mr-2" /> Download CSV
// //                       </Button>
// //                     </div>
// //                   </div>
// //                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
// //                     <Card className="border-0 shadow-lg">
// //                       <CardContent className="flex flex-col items-center p-4 text-center">
// //                         <Users className="h-6 w-6 text-blue-600 mb-2" />
// //                         <div className="text-2xl font-bold text-blue-600">{totalTumorSamples}</div>
// //                         <div className="text-xs text-gray-600">Total Tumor Samples</div>
// //                       </CardContent>
// //                     </Card>
// //                   </div>
// //                 </div>

// //                 {/* DEPTH2 and tITH Plots */}
// //                 {(visiblePlots.depth2 || visiblePlots.tith) && (
// //                   <div className="mb-8">
// //                     <h3 className="text-2xl font-bold text-blue-900 mb-4">Tumor Heterogeneity Metrics</h3>
// //                     <div className="grid lg:grid-cols-2 md:grid-cols-1 gap-4">
// //                       {visiblePlots.depth2 && (
// //                         <BarChart 
// //                           data={tumorData} 
// //                           dataKey="depth2" 
// //                           color="#ea580c" 
// //                           title="DEPTH2 Scores" 
// //                         />
// //                       )}
// //                       {visiblePlots.tith && (
// //                         <ScatterPlot 
// //                           data={tumorData} 
// //                           dataKey="tith" 
// //                           color="#2563eb" 
// //                           title="Transcriptome-based Intra-Tumor Heterogeneity (tITH)" 
// //                         />
// //                       )}
// //                     </div>
// //                   </div>
// //                 )}
// //               </>
// //             )}
// //           </div>
// //         </div>
// //       </div>
// //       <footer className="bg-gray-100 text-gray-700 text-m mt-10 p-8 text-center border-t border-gray-300">
// //         <p className="text-blue-700 mt-4">© 2025 BIRL — This website is free and open to all users and there is no login requirement.</p>
// //         <p className="font-semibold text-blue-700 mt-4">Biomedical Informatics & Engineering Research Laboratory, Lahore University of Management Sciences</p>
// //         <p className="text-blue-700 mt-4">DHA, Lahore, Pakistan</p>
// //         <p className="text-blue-700 mt-4">+92 (42) 3560 8352</p>
// //       </footer>
// //     </div>
// //   );
// // };

// export default TumourResults;
// import { useState, useEffect, useRef } from "react";
// import { useSearchParams, Link } from "react-router-dom";
// import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
// import { Button } from "@/components/ui/button";
// import { Checkbox } from "@/components/ui/checkbox";
// import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
// import { Label } from "@/components/ui/label";
// import { ArrowLeft, Download, Box, ChevronRight, ChevronDown, Users } from "lucide-react";
// import { 
//   ResponsiveContainer, 
//   XAxis, 
//   YAxis, 
//   CartesianGrid, 
//   Tooltip,
//   ComposedChart,
//   Bar,
//   Scatter
// } from "recharts";

// // Utility to debounce state updates
// const debounce = (func: Function, wait: number) => {
//   let timeout: NodeJS.Timeout;
//   return (...args: any[]) => {
//     clearTimeout(timeout);
//     timeout = setTimeout(() => func(...args), wait);
//   };
// };

// const TumourResults = () => {
//   const [searchParams] = useSearchParams();
//   const cancerType = searchParams.get('cancerType') || '';
  
//   // Filter states
//   const [normalizationMethod, setNormalizationMethod] = useState('tpm');
//   const [selectedNoiseMetrics, setSelectedNoiseMetrics] = useState(['DEPTH2', 'DEPTH - tITH']);
//   const [isNoiseMetricsOpen, setIsNoiseMetricsOpen] = useState(false);
//   const [isAnalysisPlotsOpen, setIsAnalysisPlotsOpen] = useState(false);
//   const [visiblePlots, setVisiblePlots] = useState({
//     depth2: true,
//     tith: true
//   });
//   const [totalTumorSamples, setTotalTumorSamples] = useState(0);
//   const [isLoading, setIsLoading] = useState(false);
//   const chartRefs = useRef<{[key: string]: any}>({});
//   const [tumorData, setTumorData] = useState<any[]>([]);

//   // Noise metric options
//   const noiseMetrics = {
//     'DEPTH2': 'depth2',
//     'tITH': 'tith'
//   };

//   const allNoiseMetrics = Object.keys(noiseMetrics);
//   const areAllNoiseSelected = allNoiseMetrics.every(metric => selectedNoiseMetrics.includes(metric));

//   const allPlotKeys = ['depth2', 'tith'];
//   const areAllPlotsSelected = allPlotKeys.every(plot => visiblePlots[plot]);

//   // Handle noise metric selection
//   const handleNoiseMetricToggle = debounce((metric: string) => {
//     setSelectedNoiseMetrics(prev => 
//       prev.includes(metric) 
//         ? prev.filter(m => m !== metric)
//         : [...prev, metric]
//     );
//   }, 100);

//   // Handle master checkbox for noise metrics
//   const toggleAllNoiseMetrics = debounce((checked: boolean) => {
//     setSelectedNoiseMetrics(checked ? allNoiseMetrics : []);
//   }, 100);

//   // Handle individual plot visibility
//   const handlePlotToggle = debounce((plotKey: string) => {
//     setVisiblePlots(prev => ({
//       ...prev,
//       [plotKey]: !prev[plotKey]
//     }));
//   }, 100);

//   // Handle master checkbox for plots
//   const toggleAllPlots = debounce((checked: boolean) => {
//     setVisiblePlots(prev => ({
//       ...prev,
//       ...Object.fromEntries(allPlotKeys.map(plot => [plot, checked]))
//     }));
//   }, 100);

//   const applyFilters = () => {
//     console.log('Applying filters:', {
//       normalizationMethod,
//       selectedNoiseMetrics,
//       visiblePlots
//     });
//     setVisiblePlots(prev => ({
//       ...prev,
//       depth2: selectedNoiseMetrics.includes('DEPTH2'),
//       tith: selectedNoiseMetrics.includes('tITH')
//     }));
//   };
  

//   useEffect(() => {
//     let isMounted = true;

//     const fetchTumorExpressionData = async () => {
//       console.log('Starting fetch:', { cancerType, normalizationMethod, selectedNoiseMetrics });
//       if (!cancerType || !selectedNoiseMetrics.length) {
//         console.warn('No cancerType or selectedNoiseMetrics provided');
//         setTumorData([]);
//         setIsLoading(false);
//         return;
//       }
//       setIsLoading(true);

//       // Validate metric names
//       const validMetrics = ['DEPTH2', 'tITH'];
//       const metrics = selectedNoiseMetrics.filter(metric => validMetrics.includes(metric));

//       if (metrics.length === 0) {
//         console.error(`Invalid metrics: ${selectedNoiseMetrics.join(', ')}. Valid options: ${validMetrics.join(', ')}`);
//         setTumorData([]);
//         setIsLoading(false);
//         return;
//       }

//       const cacheKey = `expressionData_${cancerType}_${normalizationMethod}_${metrics.join('_')}`;
//       const cached = localStorage.getItem(cacheKey);
//       if (cached) {
//         console.log(`✅ Using cached data for ${cancerType} (${normalizationMethod}, ${metrics.join(', ')})`);
//         setTumorData(JSON.parse(cached));
//         setIsLoading(false);
//         return;
//       }

//       try {
//         // Fetch data from the API for each selected metric
//         const promises = metrics.map(metric =>
//           fetch(`http://localhost:5001/api/calculate-metrics?cancer=${cancerType}&method=${normalizationMethod}&metric=${metric}`)
//             .then(response => {
//               if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
//               return response.json();
//             })
//             .then(data => ({ metric, data }))
//             .catch(error => {
//               console.error(`Error fetching ${metric} from API:`, error);
//               return { metric, data: [] };
//             })
//         );

//         const metricResults = await Promise.all(promises);
//         console.log('API metric results:', metricResults);

//         // Process API data
//         const sampleExpressionMap: {
//           [sampleBarcode: string]: {
//             sample: string;
//             [key: string]: any;
//           }
//         } = {};

//         // Initialize map with all samples (assuming sample_ids from the first response)
//         const firstMetricData = metricResults.find(result => result.data.length > 0)?.data || [];
//         const sampleIds = firstMetricData.map((item: any) => item.sample_id);
//         sampleIds.forEach(sampleId => {
//           sampleExpressionMap[sampleId] = {
//             sample: sampleId,
//             [normalizationMethod.toLowerCase()]: null,
//             totalGenes: 1 // Placeholder
//           };
//           metrics.forEach(metric => {
//             const fieldName = noiseMetrics[metric as keyof typeof noiseMetrics] || metric.toLowerCase();
//             sampleExpressionMap[sampleId][fieldName] = null;
//           });
//         });

//         // Populate map with metric values
//         metricResults.forEach(({ metric, data }) => {
//           if (data && data.length > 0) {
//             const fieldName = noiseMetrics[metric as keyof typeof noiseMetrics] || metric.toLowerCase();
//             data.forEach((entry: any) => {
//               const sampleId = entry.sample_id;
//               if (sampleExpressionMap[sampleId]) {
//                 const value = entry.value;
//                 if (value != null && !isNaN(value)) {
//                   sampleExpressionMap[sampleId][fieldName] = value;
//                   if (sampleExpressionMap[sampleId][normalizationMethod.toLowerCase()] == null) {
//                     sampleExpressionMap[sampleId][normalizationMethod.toLowerCase()] = value;
//                   }
//                 } else {
//                   console.warn(`⚠️ Invalid value for ${metric} in sample ${sampleId}`);
//                 }
//               }
//             });
//           }
//         });

//         // Create processed data
//         const processedData = Object.values(sampleExpressionMap)
//           .map(sampleData => {
//             const hasValidMetric = metrics.some(metric => {
//               const fieldName = noiseMetrics[metric as keyof typeof noiseMetrics] || metric.toLowerCase();
//               return sampleData[fieldName] != null;
//             });
//             if (!hasValidMetric) {
//               console.warn(`⚠️ No valid metric values for sample ${sampleData.sample}`);
//               return null;
//             }

//             const result: { [key: string]: any } = {
//               sample: sampleData.sample,
//               [normalizationMethod.toLowerCase()]: sampleData[normalizationMethod.toLowerCase()],
//               totalGenes: sampleData.totalGenes
//             };
//             metrics.forEach(metric => {
//               const fieldName = noiseMetrics[metric as keyof typeof noiseMetrics] || metric.toLowerCase();
//               result[fieldName] = sampleData[fieldName];
//             });
//             return result;
//           })
//           .filter(Boolean);

//         if (processedData.length === 0) {
//           console.warn(`⚠️ No valid data processed for metrics: ${metrics.join(', ')}`);
//           setTumorData([]);
//           return;
//         }

//         console.log(`✅ Final tumor data:`, processedData);
//         if (isMounted) {
//           setTumorData(processedData);
//           localStorage.setItem(cacheKey, JSON.stringify(processedData));
//           setTotalTumorSamples(processedData.length); // Update total samples based on fetched data
//         }
//       } catch (error) {
//         console.error('Error fetching data from API:', error);
//         setTumorData([]);
//       } finally {
//         if (isMounted) {
//           setIsLoading(false);
//         }
//       }
//     };

//     fetchTumorExpressionData();
//     return () => {
//       isMounted = false;
//     };
//   }, [cancerType, normalizationMethod, selectedNoiseMetrics]);

//   const getCancerTypeLabel = (type: string) => {
//     const labels: { [key: string]: string } = {
//       "TCGA-BRCA": "Breast Cancer (BRCA)",
//       "TCGA-LUAD": "Lung Cancer (LUAD)",
//       "TCGA-PRAD": "Prostate Cancer (PRAD)",
//       "TCGA-COAD": "Colorectal Cancer (COAD)",
//       "TCGA-LIHC": "Liver Cancer (LIHC)",
//       "TCGA-KIRC": "Kidney Cancer (KIRC)",
//       "TCGA-STAD": "Stomach Cancer (STAD)",
//       "TCGA-OV": "Ovarian Cancer (OV)",
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

//   const downloadData = (format: string) => {
//     const data = tumorData;
//     let content = '';
//     let filename = `tumor_analysis_${cancerType}_${Date.now()}`;

//     if (format === 'csv') {
//       const excludedKeys = ['tumorValues', 'normalValues', 'combinedValues'];
//       const keys = Object.keys(data[0] || {}).filter(key => !excludedKeys.includes(key));
//       const headers = keys.join(',');
//       const rows = data.map(row => keys.map(key => row[key]).join(','));
//       content = [headers, ...rows].join('\n');
//       filename += '.csv';
//     }

//     const blob = new Blob([content], { type: format === 'csv' ? 'text/csv' : 'application/json' });
//     const url = URL.createObjectURL(blob);
//     const a = document.createElement('a');
//     a.href = url;
//     a.download = filename;
//     a.click();
//     URL.revokeObjectURL(url);
//   };

//   const colors = ['#2563eb', '#059669', '#dc2626', '#7c3aed', '#ea580c'];

//   // Custom bar chart component for DEPTH2 (replacing boxplot)
//   const BarChart = ({ data, dataKey, color, title }: any) => (
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
//             onClick={() => downloadChart(`bar-${dataKey}`, title)}
//             className="h-6 px-2 text-xs"
//           >
//             <Download className="h-3 w-3" />
//           </Button>
//         </CardTitle>
//       </CardHeader>
//       <CardContent className="pt-0">
//         <div ref={el => chartRefs.current[`bar-${dataKey}`] = el}>
//           <ResponsiveContainer width="100%" height={200}>
//             <ComposedChart data={data} margin={{ top: 5, right: 5, left: 5, bottom: 25 }}>
//               <CartesianGrid strokeDasharray="3 3" />
//               <XAxis 
//                 dataKey="sample" 
//                 tick={{ fontSize: 10 }}
//                 label={{ 
//                   value: 'Samples', 
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
//                   dy: 55,
//                   style: { fontSize: '10px' } 
//                 }} 
//               />
//               <Tooltip 
//                 formatter={(value: any) => [
//                   typeof value === 'number' ? value.toFixed(2) : value,
//                   title,
//                 ]} 
//               />
//               <Bar dataKey={dataKey} fill={color} />
//             </ComposedChart>
//           </ResponsiveContainer>
//         </div>
//       </CardContent>
//     </Card>
//   );

//   // Custom scatter plot component for tITH
//   const ScatterPlot = ({ data, dataKey, color, title }: any) => (
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
//             onClick={() => downloadChart(`scatter-${dataKey}`, title)}
//             className="h-6 px-2 text-xs"
//           >
//             <Download className="h-3 w-3" />
//           </Button>
//         </CardTitle>
//       </CardHeader>
//       <CardContent className="pt-0">
//         <div ref={el => chartRefs.current[`scatter-${dataKey}`] = el}>
//           <ResponsiveContainer width="100%" height={200}>
//             <ComposedChart data={data} margin={{ top: 5, right: 5, left: 5, bottom: 25 }}>
//               <CartesianGrid strokeDasharray="3 3" />
//               <XAxis 
//                 dataKey="sample" 
//                 tick={{ fontSize: 10 }}
//                 label={{ 
//                   value: 'Samples', 
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
//                   dy: 55,
//                   style: { fontSize: '10px' } 
//                 }} 
//               />
//               <Tooltip 
//                 formatter={(value: any) => [
//                   typeof value === 'number' ? value.toFixed(2) : value,
//                   title,
//                 ]} 
//               />
//               <Scatter dataKey={dataKey} fill={color} />
//             </ComposedChart>
//           </ResponsiveContainer>
//         </div>
//       </CardContent>
//     </Card>
//   );

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-yellow-50">
//       <style>
//         {`
//           .chart-container {
//             min-height: 200px;
//             width: 100%;
//             position: relative;
//           }
//         `}
//       </style>
//       <header className="bg-white shadow-sm border-b border-blue-100">
//         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
//           <div className="flex items-center justify-between">
//             <div className="flex items-center space-x-3">
//               <h1 className="text-2xl font-bold text-blue-900">Tumor Analysis Results</h1>
//             </div>
//             <nav className="flex space-x-6">
//               <Link to="/" className="text-blue-700 hover:text-blue-600 font-medium transition-colors">
//                 Home
//               </Link>
//               <Link to="/gene-analysis" className="text-blue-700 hover:text-blue-600 font-medium transition-colors">
//                 Gene Analysis
//               </Link>
//               <Link to="/pathway-analysis" className="text-blue-700 hover:text-blue-600 font-medium transition-colors">
//                 Pathway Analysis
//               </Link>
//               <Link to="/tumour-analysis" className="text-blue-500 font-medium">
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
//                 </CardTitle>
//               </CardHeader>
//               <CardContent className="space-y-6">
//                 {/* Expression Normalization Method */}
//                 <div>
//                   <h3 className="font-semibold text-blue-900 mb-3">Expression Normalization Method</h3>
//                   <RadioGroup value={normalizationMethod} onValueChange={setNormalizationMethod}>
//                     <div className="flex items-center space-x-2">
//                       <RadioGroupItem value="tpm" id="tpm" />
//                       <Label htmlFor="tpm">TPM</Label>
//                     </div>
//                     <div className="flex items-center space-x-2">
//                       <RadioGroupItem value="fpkm" id="fpkm" />
//                       <Label htmlFor="fpkm">FPKM</Label>
//                     </div>
//                     <div className="flex items-center space-x-2">
//                       <RadioGroupItem value="fpkm_uq" id="fpkm_uq" />
//                       <Label htmlFor="fpkm_uq">FPKM_UQ</Label>
//                     </div>
//                   </RadioGroup>
//                 </div>

//                 {/* Noise Metrics */}
//                 <div className="border rounded-md bg-white">
//                   <div className="flex justify-between items-center px-4 py-2">
//                     <div className="flex items-center space-x-2">
//                       <Checkbox
//                         id="noise-metrics-master"
//                         checked={areAllNoiseSelected}
//                         onCheckedChange={toggleAllNoiseMetrics}
//                       />
//                       <Label htmlFor="noise-metrics-master" className="font-bold text-blue-900 -ml-5">Noise Metrics</Label>
//                     </div>
//                     <button
//                       onClick={() => setIsNoiseMetricsOpen(prev => !prev)}
//                       className="text-blue-900"
//                     >
//                       {isNoiseMetricsOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
//                     </button>
//                   </div>
//                   {isNoiseMetricsOpen && (
//                     <div className="px-4 py-2 space-y-2">
//                       {allNoiseMetrics.map((metric) => (
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
//                 </div>

//                 {/* Analysis Plots */}
//                 <div className="border rounded-md bg-white">
//                   <div className="flex justify-between items-center px-4 py-2">
//                     <div className="flex items-center space-x-2">
//                       <Checkbox
//                         id="analysis-plots-master"
//                         checked={areAllPlotsSelected}
//                         onCheckedChange={toggleAllPlots}
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
//                               depth2: 'DEPTH2 Bar Chart',
//                               tith: 'tITH Scatter Plot'
//                             }[plotKey]}
//                           </Label>
//                         </div>
//                       ))}
//                     </div>
//                   )}
//                 </div>

//                 <Button onClick={applyFilters} className="w-full bg-blue-600 hover:bg-blue-700">
//                   Apply
//                 </Button>
//               </CardContent>
//             </Card>
//           </div>

//           {/* Main Content */}
//           <div className="flex-1">
//             {isLoading ? (
//               <div className="text-center text-blue-900">Loading charts...</div>
//             ) : (
//               <>
//                 <Link to="/tumour-analysis" className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-6 transition-colors">
//                   <ArrowLeft className="h-4 w-4 mr-2" />
//                   Back to Tumor Analysis
//                 </Link>

//                 <div className="mb-8">
//                   <h2 className="text-4xl font-bold text-blue-900 mb-2">
//                     Results for {getCancerTypeLabel(cancerType)}
//                   </h2>
//                   <div className="flex items-center justify-between mb-4">
//                     <div className="flex flex-wrap gap-2"></div>
//                     <div className="flex space-x-4">
//                       <Button onClick={() => downloadData('csv')} variant="outline" size="sm">
//                         <Download className="h-4 w-4 mr-2" /> Download CSV
//                       </Button>
//                     </div>
//                   </div>
//                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
//                     <Card className="border-0 shadow-lg">
//                       <CardContent className="flex flex-col items-center p-4 text-center">
//                         <Users className="h-6 w-6 text-blue-600 mb-2" />
//                         <div className="text-2xl font-bold text-blue-600">{totalTumorSamples}</div>
//                         <div className="text-xs text-gray-600">Total Tumor Samples</div>
//                       </CardContent>
//                     </Card>
//                   </div>
//                 </div>

//                 {/* DEPTH2 and tITH Plots */}
//                 {(visiblePlots.depth2 || visiblePlots.tith) && (
//                   <div className="mb-8">
//                     <h3 className="text-2xl font-bold text-blue-900 mb-4">Tumor Heterogeneity Metrics</h3>
//                     <div className="grid lg:grid-cols-2 md:grid-cols-1 gap-4">
//                       {visiblePlots.depth2 && (
//                         <BarChart 
//                           data={tumorData} 
//                           dataKey="depth2" 
//                           color="#ea580c" 
//                           title="DEPTH2 Scores" 
//                         />
//                       )}
//                       {visiblePlots.tith && (
//                         <ScatterPlot 
//                           data={tumorData} 
//                           dataKey="tith" 
//                           color="#2563eb" 
//                           title="Transcriptome-based Intra-Tumor Heterogeneity (tITH)" 
//                         />
//                       )}
//                     </div>
//                   </div>
//                 )}
//               </>
//             )}
//           </div>
//         </div>
//       </div>
//       <footer className="bg-gray-100 text-gray-700 text-m mt-10 p-8 text-center border-t border-gray-300">
//         <p className="text-blue-700 mt-4">© 2025 BIRL — This website is free and open to all users and there is no login requirement.</p>
//         <p className="font-semibold text-blue-700 mt-4">Biomedical Informatics & Engineering Research Laboratory, Lahore University of Management Sciences</p>
//         <p className="text-blue-700 mt-4">DHA, Lahore, Pakistan</p>
//         <p className="text-blue-700 mt-4">+92 (42) 3560 8352</p>
//       </footer>
//     </div>
//   );
// };

// export default TumourResults;


// import { useState, useEffect, useRef } from "react";
// import { useSearchParams, Link } from "react-router-dom";
// import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
// import { Button } from "@/components/ui/button";
// import supabase from "@/supabase-client";
// import { Checkbox } from "@/components/ui/checkbox";
// import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
// import { Label } from "@/components/ui/label";
// import { ArrowLeft, Download, Box, ChevronRight, ChevronDown, Users } from "lucide-react";
// import { 
//   ResponsiveContainer, 
//   XAxis, 
//   YAxis, 
//   CartesianGrid, 
//   Tooltip,
//   ComposedChart,
//   Bar,
//   Scatter
// } from "recharts";

// // Utility to debounce state updates
// const debounce = (func: Function, wait: number) => {
//   let timeout: NodeJS.Timeout;
//   return (...args: any[]) => {
//     clearTimeout(timeout);
//     timeout = setTimeout(() => func(...args), wait);
//   };
// };

// const TumourResults = () => {
//   const [searchParams] = useSearchParams();
//   const cancerType = searchParams.get('cancerType') || '';

//   // Filter states
//   const [normalizationMethod, setNormalizationMethod] = useState('tpm');
//   const [selectedNoiseMetrics, setSelectedNoiseMetrics] = useState(['DEPTH2', 'tITH']); // Updated to match backend
//   const [isNoiseMetricsOpen, setIsNoiseMetricsOpen] = useState(false);
//   const [isAnalysisPlotsOpen, setIsAnalysisPlotsOpen] = useState(false);
//   const [visiblePlots, setVisiblePlots] = useState({
//     depth2: true,
//     tith: true
//   });
//   const [totalTumorSamples, setTotalTumorSamples] = useState(0);
//   const [isLoading, setIsLoading] = useState(false);
//   const chartRefs = useRef<{ [key: string]: any }>({});
//   const [tumorData, setTumorData] = useState<any[]>([]);

//   // Noise metric options
//   const noiseMetrics = {
//     'DEPTH2': 'depth2',
//     'tITH': 'tith'
//   };

//   const allNoiseMetrics = Object.keys(noiseMetrics);
//   const areAllNoiseSelected = allNoiseMetrics.every(metric => selectedNoiseMetrics.includes(metric));

//   const allPlotKeys = ['depth2', 'tith'];
//   const areAllPlotsSelected = allPlotKeys.every(plot => visiblePlots[plot]);

//   // Handle noise metric selection
//   const handleNoiseMetricToggle = debounce((metric: string) => {
//     setSelectedNoiseMetrics(prev => 
//       prev.includes(metric) 
//         ? prev.filter(m => m !== metric)
//         : [...prev, metric]
//     );
//   }, 100);

//   // Handle master checkbox for noise metrics
//   const toggleAllNoiseMetrics = debounce((checked: boolean) => {
//     setSelectedNoiseMetrics(checked ? allNoiseMetrics : []);
//   }, 100);

//   // Handle individual plot visibility
//   const handlePlotToggle = debounce((plotKey: string) => {
//     setVisiblePlots(prev => ({
//       ...prev,
//       [plotKey]: !prev[plotKey]
//     }));
//   }, 100);

//   // Handle master checkbox for plots
//   const toggleAllPlots = debounce((checked: boolean) => {
//     setVisiblePlots(prev => ({
//       ...prev,
//       ...Object.fromEntries(allPlotKeys.map(plot => [plot, checked]))
//     }));
//   }, 100);

//   const applyFilters = () => {
//     console.log('Applying filters:', {
//       normalizationMethod,
//       selectedNoiseMetrics,
//       visiblePlots
//     });
//     setVisiblePlots(prev => ({
//       ...prev,
//       depth2: selectedNoiseMetrics.includes('DEPTH2'),
//       tith: selectedNoiseMetrics.includes('tITH')
//     }));
//   };

//   useEffect(() => {
//     let isMounted = true;

//     const fetchTumorExpressionData = async () => {
//       console.log('Starting fetch:', { cancerType, normalizationMethod, selectedNoiseMetrics });
//       if (!cancerType || !selectedNoiseMetrics.length) {
//         console.warn('No cancerType or selectedNoiseMetrics provided');
//         setTumorData([]);
//         setIsLoading(false);
//         return;
//       }
//       setIsLoading(true);

//       // Validate metric names to match backend
//       const validMetrics = ['DEPTH2', 'tITH'];
//       const metrics = selectedNoiseMetrics.filter(metric => validMetrics.includes(metric));

//       if (metrics.length === 0) {
//         console.error(`Invalid metrics: ${selectedNoiseMetrics.join(', ')}. Valid options: ${validMetrics.join(', ')}`);
//         setTumorData([]);
//         setIsLoading(false);
//         return;
//       }

//       const cacheKey = `expressionData_${cancerType}_${normalizationMethod}_${metrics.join('_')}`;
//       const cached = localStorage.getItem(cacheKey);
//       if (cached) {
//         console.log(`✅ Using cached data for ${cancerType} (${normalizationMethod}, ${metrics.join(', ')})`);
//         setTumorData(JSON.parse(cached));
//         setIsLoading(false);
//         return;
//       }

//       try {
//         const promises = metrics.map(metric =>
//           fetch(`http://localhost:5001/api/calculate-metrics?cancer=${cancerType}&method=${normalizationMethod}&metric=${metric}`)
//             .then(response => {
//               if (!response.ok) {
//                 console.error(`HTTP error! Status: ${response.status}, Message: ${response.statusText}`);
//                 return response.json().then(errorData => Promise.reject(errorData));
//               }
//               return response.json();
//             })
//             .then(data => ({ metric, data }))
//             .catch(error => {
//               console.error(`Error fetching ${metric} from API:`, error);
//               return { metric, data: [] };
//             })
//         );

//         const metricResults = await Promise.all(promises);
//         console.log('API metric results:', metricResults);

//         // Process API data into a single array with all metrics
//         const sampleExpressionMap: { [sampleBarcode: string]: any } = {};
//         metricResults.forEach(({ metric, data }) => {
//           if (data && data.length > 0) {
//             const fieldName = noiseMetrics[metric as keyof typeof noiseMetrics] || metric.toLowerCase();
//             data.forEach((item: any) => {
//               if (!sampleExpressionMap[item.sample_id]) {
//                 sampleExpressionMap[item.sample_id] = { sample: item.sample_id };
//               }
//               sampleExpressionMap[item.sample_id][fieldName] = item.value;
//               if (!sampleExpressionMap[item.sample_id][normalizationMethod.toLowerCase()]) {
//                 sampleExpressionMap[item.sample_id][normalizationMethod.toLowerCase()] = item.value; // Placeholder
//               }
//             });
//           }
//         });

//         const processedData = Object.values(sampleExpressionMap).map((sampleData: any) => {
//           const hasValidMetric = metrics.some(metric => {
//             const fieldName = noiseMetrics[metric as keyof typeof noiseMetrics] || metric.toLowerCase();
//             return sampleData[fieldName] != null && !isNaN(sampleData[fieldName]);
//           });
//           if (!hasValidMetric) {
//             console.warn(`⚠️ No valid metric values for sample ${sampleData.sample}`);
//             return null;
//           }
//           return sampleData;
//         }).filter(Boolean);

//         if (processedData.length === 0) {
//           console.warn(`⚠️ No valid data processed for metrics: ${metrics.join(', ')}`);
//           setTumorData([]);
//           return;
//         }

//         console.log(`✅ Final tumor data:`, processedData);
//         if (isMounted) {
//           setTumorData(processedData);
//           localStorage.setItem(cacheKey, JSON.stringify(processedData));
//           // setTotalTumorSamples(processedData.length);
//         }
//       } catch (error) {
//         console.error('Error fetching data from API:', error);
//         setTumorData([]);
//       } finally {
//         if (isMounted) {
//           setIsLoading(false);
//         }
//       }
//     };

//     fetchTumorExpressionData();
//     return () => {
//       isMounted = false;
//     };
//   }, [cancerType, normalizationMethod, selectedNoiseMetrics]);


//   const getCancerTypeLabel = (type: string) => {
//     const labels: { [key: string]: string } = {
//       "TCGA-BRCA": "Breast Cancer (BRCA)",
//       "TCGA-LUAD": "Lung Cancer (LUAD)",
//       "TCGA-PRAD": "Prostate Cancer (PRAD)",
//       "TCGA-COAD": "Colorectal Cancer (COAD)",
//       "TCGA-LIHC": "Liver Cancer (LIHC)",
//       "TCGA-KIRC": "Kidney Cancer (KIRC)",
//       "TCGA-STAD": "Stomach Cancer (STAD)",
//       "TCGA-OV": "Ovarian Cancer (OV)",
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

//   const downloadData = (format: string) => {
//     const data = tumorData;
//     let content = '';
//     let filename = `tumor_analysis_${cancerType}_${Date.now()}`;

//     if (format === 'csv') {
//       const excludedKeys = ['tumorValues', 'normalValues', 'combinedValues'];
//       const keys = Object.keys(data[0] || {}).filter(key => !excludedKeys.includes(key));
//       const headers = keys.join(',');
//       const rows = data.map(row => keys.map(key => row[key]).join(','));
//       content = [headers, ...rows].join('\n');
//       filename += '.csv';
//     }

//     const blob = new Blob([content], { type: format === 'csv' ? 'text/csv' : 'application/json' });
//     const url = URL.createObjectURL(blob);
//     const a = document.createElement('a');
//     a.href = url;
//     a.download = filename;
//     a.click();
//     URL.revokeObjectURL(url);
//   };

//   const colors = ['#2563eb', '#059669', '#dc2626', '#7c3aed', '#ea580c'];

//   // Custom bar chart component for DEPTH2
//   const BarChart = ({ data, dataKey, color, title }: any) => (
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
//             onClick={() => downloadChart(`bar-${dataKey}`, title)}
//             className="h-6 px-2 text-xs"
//           >
//             <Download className="h-3 w-3" />
//           </Button>
//         </CardTitle>
//       </CardHeader>
//       <CardContent className="pt-0">
//         <div ref={el => chartRefs.current[`bar-${dataKey}`] = el}>
//           <ResponsiveContainer width="100%" height={200}>
//             <ComposedChart data={data} margin={{ top: 5, right: 5, left: 5, bottom: 25 }}>
//               <CartesianGrid strokeDasharray="3 3" />
//               <XAxis 
//                 dataKey="sample" 
//                 tick={{ fontSize: 10 }}
//                 label={{ 
//                   value: 'Samples', 
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
//                   dy: 55,
//                   style: { fontSize: '10px' } 
//                 }} 
//               />
//               <Tooltip 
//                 formatter={(value: any) => [
//                   typeof value === 'number' ? value.toFixed(2) : value,
//                   title,
//                 ]} 
//               />
//               <Bar dataKey={dataKey} fill={color} />
//             </ComposedChart>
//           </ResponsiveContainer>
//         </div>
//       </CardContent>
//     </Card>
//   );

//   // Custom scatter plot component for tITH
//   const ScatterPlot = ({ data, dataKey, color, title }: any) => (
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
//             onClick={() => downloadChart(`scatter-${dataKey}`, title)}
//             className="h-6 px-2 text-xs"
//           >
//             <Download className="h-3 w-3" />
//           </Button>
//         </CardTitle>
//       </CardHeader>
//       <CardContent className="pt-0">
//         <div ref={el => chartRefs.current[`scatter-${dataKey}`] = el}>
//           <ResponsiveContainer width="100%" height={200}>
//             <ComposedChart data={data} margin={{ top: 5, right: 5, left: 5, bottom: 25 }}>
//               <CartesianGrid strokeDasharray="3 3" />
//               <XAxis 
//                 dataKey="sample" 
//                 tick={{ fontSize: 10 }}
//                 label={{ 
//                   value: 'Samples', 
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
//                   dy: 55,
//                   style: { fontSize: '10px' } 
//                 }} 
//               />
//               <Tooltip 
//                 formatter={(value: any) => [
//                   typeof value === 'number' ? value.toFixed(2) : value,
//                   title,
//                 ]} 
//               />
//               <Scatter dataKey={dataKey} fill={color} />
//             </ComposedChart>
//           </ResponsiveContainer>
//         </div>
//       </CardContent>
//     </Card>
//   );

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-yellow-50">
//       <style>
//         {`
//           .chart-container {
//             min-height: 200px;
//             width: 100%;
//             position: relative;
//           }
//         `}
//       </style>
//       <header className="bg-white shadow-sm border-b border-blue-100">
//         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
//           <div className="flex items-center justify-between">
//             <div className="flex items-center space-x-3">
//               <h1 className="text-2xl font-bold text-blue-900">Tumor Analysis Results</h1>
//             </div>
//             <nav className="flex space-x-6">
//               <Link to="/" className="text-blue-700 hover:text-blue-600 font-medium transition-colors">
//                 Home
//               </Link>
//               <Link to="/gene-analysis" className="text-blue-700 hover:text-blue-600 font-medium transition-colors">
//                 Gene Analysis
//               </Link>
//               <Link to="/pathway-analysis" className="text-blue-700 hover:text-blue-600 font-medium transition-colors">
//                 Pathway Analysis
//               </Link>
//               <Link to="/tumour-analysis" className="text-blue-500 font-medium">
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
//                 </CardTitle>
//               </CardHeader>
//               <CardContent className="space-y-6">
//                 {/* Expression Normalization Method */}
//                 <div>
//                   <h3 className="font-semibold text-blue-900 mb-3">Expression Normalization Method</h3>
//                   <RadioGroup value={normalizationMethod} onValueChange={setNormalizationMethod}>
//                     <div className="flex items-center space-x-2">
//                       <RadioGroupItem value="tpm" id="tpm" />
//                       <Label htmlFor="tpm">TPM</Label>
//                     </div>
//                     <div className="flex items-center space-x-2">
//                       <RadioGroupItem value="fpkm" id="fpkm" />
//                       <Label htmlFor="fpkm">FPKM</Label>
//                     </div>
//                     <div className="flex items-center space-x-2">
//                       <RadioGroupItem value="fpkm_uq" id="fpkm_uq" />
//                       <Label htmlFor="fpkm_uq">FPKM_UQ</Label>
//                     </div>
//                   </RadioGroup>
//                 </div>

//                 {/* Noise Metrics */}
//                 <div className="border rounded-md bg-white">
//                   <div className="flex justify-between items-center px-4 py-2">
//                     <div className="flex items-center space-x-2">
//                       <Checkbox
//                         id="noise-metrics-master"
//                         checked={areAllNoiseSelected}
//                         onCheckedChange={toggleAllNoiseMetrics}
//                       />
//                       <Label htmlFor="noise-metrics-master" className="font-bold text-blue-900 -ml-5">Noise Metrics</Label>
//                     </div>
//                     <button
//                       onClick={() => setIsNoiseMetricsOpen(prev => !prev)}
//                       className="text-blue-900"
//                     >
//                       {isNoiseMetricsOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
//                     </button>
//                   </div>
//                   {isNoiseMetricsOpen && (
//                     <div className="px-4 py-2 space-y-2">
//                       {allNoiseMetrics.map((metric) => (
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
//                 </div>

//                 {/* Analysis Plots */}
//                 <div className="border rounded-md bg-white">
//                   <div className="flex justify-between items-center px-4 py-2">
//                     <div className="flex items-center space-x-2">
//                       <Checkbox
//                         id="analysis-plots-master"
//                         checked={areAllPlotsSelected}
//                         onCheckedChange={toggleAllPlots}
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
//                               depth2: 'DEPTH2 Bar Chart',
//                               tith: 'tITH Scatter Plot'
//                             }[plotKey]}
//                           </Label>
//                         </div>
//                       ))}
//                     </div>
//                   )}
//                 </div>

//                 <Button onClick={applyFilters} className="w-full bg-blue-600 hover:bg-blue-700">
//                   Apply
//                 </Button>
//               </CardContent>
//             </Card>
//           </div>

//           {/* Main Content */}
//           <div className="flex-1">
//             {isLoading ? (
//               <div className="text-center text-blue-900">Loading charts...</div>
//             ) : (
//               <>
//                 <Link to="/tumour-analysis" className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-6 transition-colors">
//                   <ArrowLeft className="h-4 w-4 mr-2" />
//                   Back to Tumor Analysis
//                 </Link>

//                 <div className="mb-8">
//                   <h2 className="text-4xl font-bold text-blue-900 mb-2">
//                     Results for {getCancerTypeLabel(cancerType)}
//                   </h2>
//                   <div className="flex items-center justify-between mb-4">
//                     <div className="flex flex-wrap gap-2"></div>
//                     <div className="flex space-x-4">
//                       <Button onClick={() => downloadData('csv')} variant="outline" size="sm">
//                         <Download className="h-4 w-4 mr-2" /> Download CSV
//                       </Button>
//                     </div>
//                   </div>
//                   {/* <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6"> */}
//                     {/* <Card className="border-0 shadow-lg">
//                       <CardContent className="flex flex-col items-center p-4 text-center">
//                         <Users className="h-6 w-6 text-blue-600 mb-2" />
//                         {/* <div className="text-2xl font-bold text-blue-600">{totalTumorSamples}</div> */}
//                         {/* <div className="text-xs text-gray-600">Total Tumor Samples</div> */}
//                       {/* </CardContent> */}
//                     {/* </Card> */}
//                   {/* </div> */}
//                 </div>

//                 {/* DEPTH2 and tITH Plots */}
//                 {(visiblePlots.depth2 || visiblePlots.tith) && (
//                   <div className="mb-8">
//                     <h3 className="text-2xl font-bold text-blue-900 mb-4">Tumor Heterogeneity Metrics</h3>
//                     <div className="grid lg:grid-cols-2 md:grid-cols-1 gap-4">
//                       {visiblePlots.depth2 && (
//                         <BarChart 
//                           data={tumorData} 
//                           dataKey="depth2" 
//                           color="#ea580c" 
//                           title="DEPTH2 Scores" 
//                         />
//                       )}
//                       {visiblePlots.tith && (
//                         <BarChart 
//                           data={tumorData} 
//                           dataKey="tith" 
//                           color="#2563eb" 
//                           title="Transcriptome-based Intra-Tumor Heterogeneity (tITH)" 
//                         />
//                       )}
//                     </div>
//                   </div>
//                 )}
//               </>
//             )}
//           </div>
//         </div>
//       </div>
//       <footer className="bg-gray-100 text-gray-700 text-m mt-10 p-8 text-center border-t border-gray-300">
//         <p className="text-blue-700 mt-4">© 2025 BIRL — This website is free and open to all users and there is no login requirement.</p>
//         <p className="font-semibold text-blue-700 mt-4">Biomedical Informatics & Engineering Research Laboratory, Lahore University of Management Sciences</p>
//         <p className="text-blue-700 mt-4">DHA, Lahore, Pakistan</p>
//         <p className="text-blue-700 mt-4">+92 (42) 3560 8352</p>
//       </footer>
//     </div>
//   );
// };

// export default TumourResults;

import { useState, useEffect, useRef } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import supabase from "@/supabase-client";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Download, Box, ChevronRight, ChevronDown, Users } from "lucide-react";
import { 
  ResponsiveContainer, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip,
  ComposedChart,
  Bar,
  Scatter
} from "recharts";

// Utility to debounce state updates
const debounce = (func: Function, wait: number) => {
  let timeout: NodeJS.Timeout;
  return (...args: any[]) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

const TumourResults = () => {
  // const [searchParams] = useSearchParams();
  const [searchParams] = useSearchParams();
  const cancerSite = searchParams.get('cancerSite') || '';        
  const cancerTypes = searchParams.get('cancerTypes')?.split(',') || []; 

  const cancerType = searchParams.get('cancerType') || '';

  // Filter states
  const [normalizationMethod, setNormalizationMethod] = useState('tpm');
  const [selectedNoiseMetrics, setSelectedNoiseMetrics] = useState(['DEPTH2', 'tITH']);
  const [isNoiseMetricsOpen, setIsNoiseMetricsOpen] = useState(false);
  const [isAnalysisPlotsOpen, setIsAnalysisPlotsOpen] = useState(false);
  const [visiblePlots, setVisiblePlots] = useState({
    depth2: true,
    tith: true
  });
  const [totalTumorSamples, setTotalTumorSamples] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const chartRefs = useRef<{ [key: string]: any }>({});
  const [tumorData, setTumorData] = useState<any[]>([]);
  const [sampleToCancerType, setSampleToCancerType] = useState<{ [sampleId: string]: string }>({});


  // Noise metric options
  const noiseMetrics = {
    'DEPTH2': 'depth2',
    'tITH': 'tith'
  };

  const allNoiseMetrics = Object.keys(noiseMetrics);
  const areAllNoiseSelected = allNoiseMetrics.every(metric => selectedNoiseMetrics.includes(metric));

  const allPlotKeys = ['depth2', 'tith'];
  const areAllPlotsSelected = allPlotKeys.every(plot => visiblePlots[plot]);

  // Handle noise metric selection
  const handleNoiseMetricToggle = debounce((metric: string) => {
    setSelectedNoiseMetrics(prev => 
      prev.includes(metric) 
        ? prev.filter(m => m !== metric)
        : [...prev, metric]
    );
  }, 100);

  // Handle master checkbox for noise metrics
  const toggleAllNoiseMetrics = debounce((checked: boolean) => {
    setSelectedNoiseMetrics(checked ? allNoiseMetrics : []);
  }, 100);

  // Handle individual plot visibility
  const handlePlotToggle = debounce((plotKey: string) => {
    setVisiblePlots(prev => ({
      ...prev,
      [plotKey]: !prev[plotKey]
    }));
  }, 100);

  // Handle master checkbox for plots
  const toggleAllPlots = debounce((checked: boolean) => {
    setVisiblePlots(prev => ({
      ...prev,
      ...Object.fromEntries(allPlotKeys.map(plot => [plot, checked]))
    }));
  }, 100);

  const applyFilters = () => {
    console.log('Applying filters:', {
      normalizationMethod,
      selectedNoiseMetrics,
      visiblePlots
    });
    setVisiblePlots(prev => ({
      ...prev,
      depth2: selectedNoiseMetrics.includes('DEPTH2'),
      tith: selectedNoiseMetrics.includes('tITH')
    }));
  };

  useEffect(() => {
    let isMounted = true;

    const fetchTumorExpressionData = async () => {
      // console.log('Starting fetch:', { cancerType, normalizationMethod, selectedNoiseMetrics });
      // if (!cancerType || !selectedNoiseMetrics.length) {
      //   console.warn('No cancerType or selectedNoiseMetrics provided');
      console.log('Starting fetch:', { cancerSite, normalizationMethod, selectedNoiseMetrics });
      if (!cancerSite || !selectedNoiseMetrics.length) {
        console.warn('No cancerSite or selectedNoiseMetrics provided');
        setTumorData([]);
        setIsLoading(false);
        return;
      }
      // setIsLoading(true);
      // // Fetch sample to cancer type mapping
      // const { data: sampleMap, error: sampleMapError } = await supabase
      //   .from("Samples")
      //   .select("sample_id, cancer_type_id");

      // if (sampleMapError) {
      //   console.error("Failed to fetch sample to cancer type mapping:", sampleMapError);
      // } else {
      //   const mapping: { [sampleId: string]: string } = {};
      //   sampleMap.forEach((row) => {
      //     mapping[row.sample_id] = row.cancer_type;
      //   });
      //   setSampleToCancerType(mapping);
      // }
      setIsLoading(true);
      // Fetch only samples that belong to selected cancerTypes (like TCGA-COAD, TCGA-READ)
      let sampleToCancerTypeMap: { [sampleId: string]: string } = {};

      try {
        // Step 1: Get IDs for selected TCGA cancer codes
        const { data: siteRows, error: siteRowsErr } = await supabase
          .from("Sites")
          .select("id, name")
          .eq("name", cancerSite);
        const site = siteRows?.[0];
        const cancerSiteId = site?.id;
        const { data: cancerTypeRows, error: cancerTypeErr } = cancerTypes.length > 0
        ? await supabase
            .from("cancer_types")
            .select("id, tcga_code")
            .in("tcga_code", cancerTypes)
        : await supabase
            .from("cancer_types")
            .select("id, tcga_code, site_id")
            .eq("site_id", cancerSiteId);

        console.log("cancertype data fetched:", cancerTypeRows);
        if (cancerTypeErr) {
          console.error("❌ Failed to fetch cancer_type ids:", cancerTypeErr);
          return;
        }

        const validCancerTypeIds = cancerTypeRows?.map(row => row.id);

        // Step 2: Get samples matching these cancer_type_ids
        const { data: sampleRows, error: sampleErr } = await supabase
          .from("samples")
          .select("sample_barcode, cancer_type_id, sample_type")
          .eq("sample_type", "tumor")
          .in("cancer_type_id", validCancerTypeIds);

        console.log("samples data fetched:", sampleRows);
        if (sampleErr) {
          console.error("❌ Failed to fetch matching samples:", sampleErr);
          return;
        }

        // // Step 3: Map sample_barcode to tcga_code
        // sampleToCancerTypeMap = {};
        // sampleRows.forEach(sample => {
        //   const type = cancerTypeRows.find(ct => ct.id === sample.cancer_type_id);
        //   if (type) {
        //     sampleToCancerTypeMap[sample.sample_barcode] = type.tcga_code;
        //   }
        // });
        sampleToCancerTypeMap = {};
      sampleRows.forEach(sample => {
        const type = cancerTypeRows.find(ct => ct.id === sample.cancer_type_id);
        if (type) {
          sampleToCancerTypeMap[sample.sample_barcode] = type.tcga_code;
        } else {
          console.warn(`⚠️ No matching cancer_type found for sample ${sample.sample_barcode} with cancer_type_id ${sample.cancer_type_id}`);
          sampleToCancerTypeMap[sample.sample_barcode] = "Unknown";
        }
      });


        setSampleToCancerType(sampleToCancerTypeMap);
      } catch (error) {
        console.error("❌ Unexpected error while fetching sample info:", error);
      }
      const validMetrics = ['DEPTH2', 'tITH'];
      const metrics = selectedNoiseMetrics.filter(metric => validMetrics.includes(metric));

      if (metrics.length === 0) {
        console.error(`Invalid metrics: ${selectedNoiseMetrics.join(', ')}. Valid options: ${validMetrics.join(', ')}`);
        setTumorData([]);
        setIsLoading(false);
        return;
      }

      // // const cacheKey = `expressionData_${cancerType}_${normalizationMethod}_${metrics.join('_')}`;
      // const cacheKey = `expressionData_${cancerSite}_${normalizationMethod}_${metrics.join('_')}`;

      // const cached = localStorage.getItem(cacheKey);
      // if (cached) {
      //   console.log(`✅ Using cached data for ${cancerType} (${normalizationMethod}, ${metrics.join(', ')})`);
      //   setTumorData(JSON.parse(cached));
      //   setIsLoading(false);
      //   return;
      // }
      const cacheKey = `tumorData_${cancerSite}_${normalizationMethod}_${selectedNoiseMetrics.sort().join(',')}`;
      const cached = localStorage.getItem(cacheKey);
      const cacheKeySite = `tumorData_site_${cancerSite}_${normalizationMethod}_${selectedNoiseMetrics.sort().join(',')}`;
      const cacheKeysByType = cancerTypes.map(
        ct => `tumorData_type_${ct}_${normalizationMethod}_${selectedNoiseMetrics.sort().join(',')}`
      );


      if (cached) {
        const parsed = JSON.parse(cached);
        const oneDay = 0 * 60 * 60 * 1000;
        const now = Date.now();

        if (parsed.timestamp && (now - parsed.timestamp < oneDay)) {
          console.log("🧠 Using cached tumor data");
          setTumorData(parsed.data);
          setTotalTumorSamples(parsed.data.length);
          setIsLoading(false);
          return;
        } else {
          console.log("🧹 Cache expired, refetching...");
          localStorage.removeItem(cacheKey);
        }
      }

 
      try {
        const promises = metrics.map(metric =>
          // fetch(`http://localhost:5001/api/calculate-metrics?cancer=${cancerType}&method=${normalizationMethod}&metric=${metric}`)
          fetch(`http://localhost:5001/api/calculate-metrics?cancer=${cancerSite}&method=${normalizationMethod}&metric=${metric}`)
            .then(response => {
              console.log(`API response for ${metric}:`, {
                status: response.status,
                statusText: response.statusText,
                headers: Object.fromEntries(response.headers.entries())
              });
              if (!response.ok) {
                console.error(`HTTP error! Status: ${response.status}, Message: ${response.statusText}`);
                return response.json().then(errorData => Promise.reject(errorData));
              }
              return response.json();
            })
            .then(data => {
              console.log(`Parsed data for ${metric}:`, data);
              return { metric, data };
            })
            .catch(error => {
              console.error(`Error fetching ${metric} from API:`, error);
              return { metric, data: [] };
            })
        );

        const metricResults = await Promise.all(promises);
        console.log('API metric results:', metricResults);

        const sampleExpressionMap: { [sampleBarcode: string]: any } = {};
        metricResults.forEach(({ metric, data }) => {
          if (data && data.length > 0) {
            const fieldName = noiseMetrics[metric as keyof typeof noiseMetrics] || metric.toLowerCase();
          data.forEach((item: any) => {
            const sampleId = item.sample_id || item.sample_barcode; // support both keys
            const sampleCancerType = sampleToCancerTypeMap[sampleId];

            // Keep only if the sample's cancer type is among selected ones
            const matches = cancerTypes.length === 0 || cancerTypes.includes(sampleCancerType);
            // console.log("selected cancer type:",cancerTypes);
            if (!matches) return;

            if (!sampleExpressionMap[sampleId]) {
              sampleExpressionMap[sampleId] = { sample: sampleId, cancer_type: sampleCancerType || "Unknown" };
            }

            const value = item[normalizationMethod.toLowerCase()] || 0;
            sampleExpressionMap[sampleId][fieldName] = value;
          });



          } else {
            console.warn(`No data returned for metric ${metric}. This may indicate a backend issue.`);
          }
        });

        const processedData = Object.values(sampleExpressionMap).map((sampleData: any) => {
          const hasValidMetric = metrics.some(metric => {
            const fieldName = noiseMetrics[metric as keyof typeof noiseMetrics] || metric.toLowerCase();
            const value = sampleData[fieldName];
            return value !== null && !isNaN(value); // Accept zero values
          });
          if (!hasValidMetric) {
            console.warn(`⚠️ No valid metric values for sample ${sampleData.sample} (values: ${JSON.stringify(sampleData)})`);
            return null;
          }
          return sampleData;
        }).filter(Boolean);

        if (processedData.length === 0) {
          console.warn(`⚠️ No valid data processed for metrics: ${metrics.join(', ')}. Check backend logs or data values.`);
          setTumorData([]);
          return;
        }

        console.log(`✅ Final tumor data:`, processedData);
        if (isMounted) {
          setTumorData(processedData);
          // localStorage.setItem(cacheKey, JSON.stringify(processedData));
          setTumorData(processedData);
          setTotalTumorSamples(processedData.length);
          // localStorage.setItem(cacheKey, JSON.stringify({
          //   timestamp: Date.now(),
          //   data: processedData
          const now = Date.now();

// Cache for cancerSite
          localStorage.setItem(cacheKeySite, JSON.stringify({
            timestamp: now,
            data: processedData
          }));

          // Cache individually for each cancerType as well
          cancerTypes.forEach((ct, index) => {
            const ctData = processedData.filter(sample => sample.cancer_type === ct);
            if (ctData.length > 0) {
              localStorage.setItem(cacheKeysByType[index], JSON.stringify({
                timestamp: now,
                data: ctData
              }));
            }
          });
        setTotalTumorSamples(processedData.length);
        }
      } catch (error) {
        console.error('Error fetching data from API:', error);
        setTumorData([]);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchTumorExpressionData();
    return () => {
      isMounted = false;
    };
  // }, [cancerType, normalizationMethod, selectedNoiseMetrics]);
  }, [cancerSite, normalizationMethod, selectedNoiseMetrics]);


  // const getCancerTypeLabel = (type: string) => {
  //   const labels: { [key: string]: string } = {
  //     "TCGA-BRCA": "Breast Cancer (BRCA)",
  //     "TCGA-LUAD": "Lung Cancer (LUAD)",
  //     "TCGA-PRAD": "Prostate Cancer (PRAD)",
  //     "TCGA-COAD": "Colorectal Cancer (COAD)",
  //     "TCGA-LIHC": "Liver Cancer (LIHC)",
  //     "TCGA-KIRC": "Kidney Cancer (KIRC)",
  //     "TCGA-STAD": "Stomach Cancer (STAD)",
  //     "TCGA-OV": "Ovarian Cancer (OV)",
  //     "TCGA-BLCA": "Bladder Cancer (BLCA)"
  //   };
  //   return labels[type] || type;
  // };

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

  const downloadData = (format: string) => {
    const data = tumorData;
    let content = '';
    let filename = `tumor_analysis_${cancerSite}_${Date.now()}`;

    // if (format === 'csv') {
    //   const excludedKeys = ['tumorValues', 'normalValues', 'combinedValues'];
    //   const keys = Object.keys(data[0] || {}).filter(key => !excludedKeys.includes(key));
    //   const headers = keys.join(',');
    //   const rows = data.map(row => keys.map(key => row[key]).join(','));
    //   content = [headers, ...rows].join('\n');
    //   filename += '.csv';
    // }
    if (format === 'csv') {
      const excludedKeys = ['tumorValues', 'normalValues', 'combinedValues'];
      const keys = ['sample', 'cancer_type', ...Object.keys(data[0] || {}).filter(k => !excludedKeys.includes(k) && k !== 'sample' && k !== 'cancer_type')];

      const headers = keys.join(',');
      const rows = data.map(row => keys.map(key => row[key]).join(','));

      content = [headers, ...rows].join('\n');
      filename += '.csv';
    }


    const blob = new Blob([content], { type: format === 'csv' ? 'text/csv' : 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const colors = ['#2563eb', '#059669', '#dc2626', '#7c3aed', '#ea580c'];

  // Custom bar chart component for DEPTH2
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
                dataKey="sample" 
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
                  dy: 55,
                  style: { fontSize: '10px' } 
                }} 
              />
              <Tooltip 
                formatter={(value: any) => [
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
                dataKey="sample" 
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
                  dy: 55,
                  style: { fontSize: '10px' } 
                }} 
              />
              <Tooltip 
                formatter={(value: any) => [
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-yellow-50">
      <style>
        {`
          .chart-container {
            min-height: 200px;
            width: 100%;
            position: relative;
          }
        `}
      </style>
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

                {/* Noise Metrics */}
                <div className="border rounded-md bg-white">
                  <div className="flex justify-between items-center px-4 py-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="noise-metrics-master"
                        checked={areAllNoiseSelected}
                        onCheckedChange={toggleAllNoiseMetrics}
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

                {/* Analysis Plots */}
                <div className="border rounded-md bg-white">
                  <div className="flex justify-between items-center px-4 py-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="analysis-plots-master"
                        checked={areAllPlotsSelected}
                        onCheckedChange={toggleAllPlots}
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
                              depth2: 'DEPTH2 Bar Chart',
                              tith: 'tITH Scatter Plot'
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

          {/* Main Content */}
          <div className="flex-1">
            {isLoading ? (
              <div className="text-center text-blue-900">Loading charts...</div>
            ) : (
              <>
                <Link to="/tumour-analysis" className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-6 transition-colors">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Tumor Analysis
                </Link>

                <div className="mb-8">
                  {/* <h2 className="text-4xl font-bold text-blue-900 mb-2"> */}
                    {/* Results for {getCancerTypeLabel(cancerType)} */}
                    <h2 className="text-4xl font-bold text-blue-900 mb-2">
                      Results for {cancerSite} {cancerTypes.length > 0 && `(${cancerTypes.join(', ')})`}
                    {/* </h2> */}
                  </h2>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex flex-wrap gap-2"></div>
                    <div className="flex space-x-4">
                      <Button onClick={() => downloadData('csv')} variant="outline" size="sm">
                        <Download className="h-4 w-4 mr-2" /> Download CSV
                      </Button>
                    </div>
                  </div>
                </div>

                {/* DEPTH2 and tITH Plots */}
                {(visiblePlots.depth2 || visiblePlots.tith) && (
                  <div className="mb-8">
                    <h3 className="text-2xl font-bold text-blue-900 mb-4">Tumor Heterogeneity Metrics</h3>
                    <div className="grid lg:grid-cols-2 md:grid-cols-1 gap-4">
                      {visiblePlots.depth2 && (
                        <BarChart 
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
              </>
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

export default TumourResults;

// import { useState, useEffect, useRef } from "react";
// import { useSearchParams, Link } from "react-router-dom";
// import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
// import { Button } from "@/components/ui/button";
// import { Checkbox } from "@/components/ui/checkbox";
// import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
// import { Label } from "@/components/ui/label";
// import supabase from "@/supabase-client";
// import { ArrowLeft, Download, Box, ChevronRight, ChevronDown, Users } from "lucide-react";
// import { 
//   ResponsiveContainer, 
//   XAxis, 
//   YAxis, 
//   CartesianGrid, 
//   Tooltip,
//   ComposedChart,
//   Bar,
//   Scatter
// } from "recharts";

// // Utility to debounce state updates
// const debounce = (func: Function, wait: number) => {
//   let timeout: NodeJS.Timeout;
//   return (...args: any[]) => {
//     clearTimeout(timeout);
//     timeout = setTimeout(() => func(...args), wait);
//   };
// };

// const TumourResults = () => {
//   const [searchParams] = useSearchParams();
//   const cancerType = searchParams.get('cancerType') || '';

//   // Filter states
//   const [normalizationMethod, setNormalizationMethod] = useState('tpm');
//   const [selectedNoiseMetrics, setSelectedNoiseMetrics] = useState(['DEPTH2', 'tITH']);
//   const [isNoiseMetricsOpen, setIsNoiseMetricsOpen] = useState(false);
//   const [isAnalysisPlotsOpen, setIsAnalysisPlotsOpen] = useState(false);
//   const [visiblePlots, setVisiblePlots] = useState({
//     depth2: true,
//     tith: true
//   });
//   const [totalTumorSamples, setTotalTumorSamples] = useState(0);
//   const [isLoading, setIsLoading] = useState(false);
//   const chartRefs = useRef<{ [key: string]: any }>({});
//   const [tumorData, setTumorData] = useState<any[]>([]);


//   // Noise metric options
//   const noiseMetrics = {
//     'DEPTH2': 'depth2',
//     'tITH': 'tith'
//   };

//   const allNoiseMetrics = Object.keys(noiseMetrics);
//   const areAllNoiseSelected = allNoiseMetrics.every(metric => selectedNoiseMetrics.includes(metric));

//   const allPlotKeys = ['depth2', 'tith'];
//   const areAllPlotsSelected = allPlotKeys.every(plot => visiblePlots[plot]);

//   // Handle noise metric selection
//   const handleNoiseMetricToggle = debounce((metric: string) => {
//     setSelectedNoiseMetrics(prev => 
//       prev.includes(metric) 
//         ? prev.filter(m => m !== metric)
//         : [...prev, metric]
//     );
//   }, 100);

//   // Handle master checkbox for noise metrics
//   const toggleAllNoiseMetrics = debounce((checked: boolean) => {
//     setSelectedNoiseMetrics(checked ? allNoiseMetrics : []);
//   }, 100);

//   // Handle individual plot visibility
//   const handlePlotToggle = debounce((plotKey: string) => {
//     setVisiblePlots(prev => ({
//       ...prev,
//       [plotKey]: !prev[plotKey]
//     }));
//   }, 100);

//   // Handle master checkbox for plots
//   const toggleAllPlots = debounce((checked: boolean) => {
//     setVisiblePlots(prev => ({
//       ...prev,
//       ...Object.fromEntries(allPlotKeys.map(plot => [plot, checked]))
//     }));
//   }, 100);

//   const applyFilters = () => {
//     console.log('Applying filters:', {
//       normalizationMethod,
//       selectedNoiseMetrics,
//       visiblePlots
//     });
//     setVisiblePlots(prev => ({
//       ...prev,
//       depth2: selectedNoiseMetrics.includes('DEPTH2'),
//       tith: selectedNoiseMetrics.includes('tITH')
//     }));
//   };

//   useEffect(() => {
//     console.log("cancer type:", cancerType);
//     let isMounted = true;

//     const fetchTumorExpressionData = async () => {
//       console.log('Starting fetch:', { cancerType, normalizationMethod, selectedNoiseMetrics });
//       if (!cancerType || !selectedNoiseMetrics.length) {
//         console.warn('No cancerType or selectedNoiseMetrics provided');
//         setTumorData([]);
//         setIsLoading(false);
//         return;
//       }
//       setIsLoading(true);

//       const validMetrics = ['DEPTH2', 'tITH'];
//       const metrics = selectedNoiseMetrics.filter(metric => validMetrics.includes(metric));

//       if (metrics.length === 0) {
//         console.error(`Invalid metrics: ${selectedNoiseMetrics.join(', ')}. Valid options: ${validMetrics.join(', ')}`);
//         setTumorData([]);
//         setIsLoading(false);
//         return;
//       }

//       const cacheKey = `expressionData_${cancerType}_${normalizationMethod}_${metrics.join('_')}`;
//       const cached = localStorage.getItem(cacheKey);
//       if (cached) {
//         console.log(`✅ Using cached data for ${cancerType} (${normalizationMethod}, ${metrics.join(', ')})`);
//         setTumorData(JSON.parse(cached));
//         setIsLoading(false);
//         return;
//       }

//       // // Check if Supabase tables exist for any metric
//       // const useDatabase = await Promise.all(metrics.map(async metric => {
//       //   const tableName = metric === 'tITH' ? '"tITH"' : metric; // Quote table name if needed
//       //   const { count, error } = await supabase
//       //     .from(tableName)
//       //     .select('*', { count: 'exact', head: true });
//       //   return !error && count > 0;
//       // })).some(result => result);
//       // Check if Supabase tables exist for any metric
//     const tableChecks = await Promise.all(metrics.map(async metric => {
//       const tableName = metric === 'tITH' ? '"tITH"' : metric;
//       const { count, error } = await supabase
//         .from(tableName)
//         .select('*', { count: 'exact', head: true });
//       return !error && count > 0;
//     }));
//     const useDatabase = tableChecks.some(result => result);

//       if (useDatabase) {
//         try {
//           console.log("cancer type:",cancerType)
//           // Step 1: Fetch cancer type ID
//           const { data: cancerTypeData, error: cancerTypeError } = await supabase
//             .from('cancer_types')
//             .select('id')
//             .eq('tcga_code', cancerType)
//             .single();

//           console.log("cancer data:", cancerTypeData);

//           if (cancerTypeError) throw cancerTypeError;
//           const cancerTypeId = cancerTypeData.id;

//           // Step 2: Fetch tumor samples
//           const { data: samplesData, error: samplesError } = await supabase
//             .from('samples')
//             .select('id, sample_barcode, sample_type')
//             .eq('cancer_type_id', cancerTypeId)
//             .eq('sample_type', 'tumor');

//           if (samplesError) throw samplesError;
//           if (!samplesData || samplesData.length === 0) {
//             console.warn(`⚠️ No tumor samples found for: ${cancerType}`);
//             setTumorData([]);
//             setTotalTumorSamples(0);
//             return;
//           }
//           console.log("samples data:", samplesData);

//           const sampleMap: { [id: number]: string } = Object.fromEntries(
//             samplesData.map(s => [s.id, s.sample_barcode])
//           );
//           const sampleIds = samplesData.map(s => s.id);
//           setTotalTumorSamples(samplesData.length);
//           console.log(`✅ Found ${samplesData.length} tumor samples`);

//           // Step 3: Fetch precomputed metric data for each metric
//           const normalizationColumn = normalizationMethod.toLowerCase() as 'tpm' | 'fpkm' | 'fpkm_uq';
//           const metricResults = await Promise.all(
//             metrics.map(async metric => {
//               try {
//                 const tableName = metric === 'tITH' ? '"tITH"' : metric;
//                 const { data, error } = await supabase
//                   .from(tableName)
//                   .select(`sample_id, tpm, fpkm, fpkm_uq`)
//                   .in('sample_id', sampleIds);

//                 if (error) {
//                   console.error(`Error fetching ${metric} data from table ${tableName}:`, error);
//                   return { metric, data: [], error };
//                 }

//                 console.log(`✅ Fetched ${data?.length || 0} ${metric} records`);
//                 return { metric, data, error: null };
//               } catch (error) {
//                 console.error(`Error fetching ${metric} data:`, error);
//                 return { metric, data: [], error };
//               }
//             })
//           );

//           // Check for errors across all metrics
//           const hasErrors = metricResults.some(result => result.error);
//           if (hasErrors) {
//             console.warn(`⚠️ Errors occurred while fetching some metrics: ${metrics.join(', ')}`);
//           }

//           // Step 4: Merge metric data
//           const sampleExpressionMap: {
//             [sampleBarcode: string]: {
//               sample: string;
//               [key: string]: any;
//             }
//           } = {};

//           // Initialize sampleExpressionMap for each sample
//           Object.values(sampleMap).forEach(barcode => {
//             sampleExpressionMap[barcode] = {
//               sample: barcode,
//               [normalizationColumn]: null,
//               totalGenes: 1 // Placeholder
//             };
//             // Initialize all requested metrics with normalization methods
//             metrics.forEach(metric => {
//               const fieldBase = noiseMetrics[metric as keyof typeof noiseMetrics] || metric.toLowerCase();
//               sampleExpressionMap[barcode][`${fieldBase}_${normalizationColumn}`] = null;
//             });
//           });

//           // Merge data from each metric
//           metricResults.forEach(({ metric, data }) => {
//             if (data && data.length > 0) {
//               const fieldBase = noiseMetrics[metric as keyof typeof noiseMetrics] || metric.toLowerCase();
//               data.forEach(entry => {
//                 const sampleBarcode = sampleMap[entry.sample_id];
//                 if (!sampleBarcode) {
//                   console.warn(`⚠️ No sample barcode found for sample_id ${entry.sample_id} in ${metric}`);
//                   return;
//                 }

//                 const value = entry[normalizationColumn];
//                 if (value == null || isNaN(value)) {
//                   console.warn(`⚠️ Invalid ${normalizationColumn} value for sample ${sampleBarcode} in ${metric}`);
//                   return;
//                 }

//                 // Set the metric value for the selected normalization method
//                 sampleExpressionMap[sampleBarcode][`${fieldBase}_${normalizationColumn}`] = value;
//                 // Set normalizationColumn value (use the first non-null value)
//                 if (sampleExpressionMap[sampleBarcode][normalizationColumn] == null) {
//                   sampleExpressionMap[sampleBarcode][normalizationColumn] = value;
//                 }
//               });
//             }
//           });

//           // Log missing samples for each metric
//           metrics.forEach(metric => {
//             const fetchedSampleIds = new Set(
//               metricResults
//                 .find(result => result.metric === metric)
//                 ?.data.map(entry => entry.sample_id) || []
//             );
//             sampleIds.forEach(sampleId => {
//               if (!fetchedSampleIds.has(sampleId)) {
//                 console.warn(`⚠️ Sample ${sampleMap[sampleId]} missing from ${metric} data`);
//               }
//             });
//           });

//           // Step 5: Create processed data
//           const processedData = Object.values(sampleExpressionMap)
//             .map(sampleData => {
//               const hasValidMetric = metrics.some(metric => {
//                 const fieldBase = noiseMetrics[metric as keyof typeof noiseMetrics] || metric.toLowerCase();
//                 return sampleData[`${fieldBase}_${normalizationColumn}`] != null && !isNaN(sampleData[`${fieldBase}_${normalizationColumn}`]);
//               });
//               if (!hasValidMetric) {
//                 console.warn(`⚠️ No valid metric values for sample ${sampleData.sample}`);
//                 return null;
//               }

//               const result: { [key: string]: any } = {
//                 sample: sampleData.sample,
//                 [normalizationColumn]: sampleData[normalizationColumn],
//                 totalGenes: sampleData.totalGenes
//               };
//               metrics.forEach(metric => {
//                 const fieldBase = noiseMetrics[metric as keyof typeof noiseMetrics] || metric.toLowerCase();
//                 result[fieldBase] = sampleData[`${fieldBase}_${normalizationColumn}`];
//               });

//               return result;
//             })
//             .filter(Boolean);

//           if (processedData.length === 0) {
//             console.warn(`⚠️ No valid data processed for metrics: ${metrics.join(', ')}`);
//             setTumorData([]);
//             return;
//           }

//           console.log(`✅ Final tumor data:`, processedData);
//           if (isMounted) {
//             setTumorData(processedData);
//             localStorage.setItem(cacheKey, JSON.stringify(processedData));
//           }
//         } catch (error) {
//           console.error('Error fetching data from Supabase:', error);
//           setTumorData([]);
//         } finally {
//           if (isMounted) {
//             setIsLoading(false);
//           }
//         }
//       } else {
//         try {
//           const promises = metrics.map(metric =>
//             fetch(`http://localhost:5001/api/calculate-metrics?cancer=${cancerType}&method=${normalizationMethod}&metric=${metric}`)
//               .then(response => {
//                 console.log(`API response for ${metric}:`, response);
//                 if (!response.ok) {
//                   console.error(`HTTP error! Status: ${response.status}, Message: ${response.statusText}`);
//                   return response.json().then(errorData => Promise.reject(errorData));
//                 }
//                 return response.json();
//               })
//               .then(data => {
//                 console.log(`Parsed data for ${metric}:`, data);
//                 return { metric, data };
//               })
//               .catch(error => {
//                 console.error(`Error fetching ${metric} from API:`, error);
//                 return { metric, data: [] };
//               })
//           );

//           const metricResults = await Promise.all(promises);
//           console.log('API metric results:', metricResults);

//           const sampleExpressionMap: { [sampleBarcode: string]: any } = {};
//           metricResults.forEach(({ metric, data }) => {
//             if (data && data.length > 0) {
//               const fieldBase = noiseMetrics[metric as keyof typeof noiseMetrics] || metric.toLowerCase();
//               data.forEach((item: any) => {
//                 if (!sampleExpressionMap[item.sample_id]) {
//                   sampleExpressionMap[item.sample_id] = { sample: item.sample_id };
//                 }
//                 // Map all normalization methods
//                 sampleExpressionMap[item.sample_id][`${fieldBase}_tpm`] = item.tpm || 0;
//                 sampleExpressionMap[item.sample_id][`${fieldBase}_fpkm`] = item.fpkm || 0;
//                 sampleExpressionMap[item.sample_id][`${fieldBase}_fpkm_uq`] = item.fpkm_uq || 0;
//                 // Set the selected normalization method as the primary value
//                 sampleExpressionMap[item.sample_id][fieldBase] = item[normalizationMethod.toLowerCase()] || 0;
//                 if (!sampleExpressionMap[item.sample_id][normalizationMethod.toLowerCase()]) {
//                   sampleExpressionMap[item.sample_id][normalizationMethod.toLowerCase()] = item[normalizationMethod.toLowerCase()] || 0;
//                 }
//               });
//             } else {
//               console.warn(`No data returned for metric ${metric}`);
//             }
//           });

//           const processedData = Object.values(sampleExpressionMap).map((sampleData: any) => {
//             const hasValidMetric = metrics.some(metric => {
//               const fieldBase = noiseMetrics[metric as keyof typeof noiseMetrics] || metric.toLowerCase();
//               return sampleData[fieldBase] != null && !isNaN(sampleData[fieldBase]);
//             });
//             if (!hasValidMetric) {
//               console.warn(`⚠️ No valid metric values for sample ${sampleData.sample}`);
//               return null;
//             }
//             return sampleData;
//           }).filter(Boolean);

//           if (processedData.length === 0) {
//             console.warn(`⚠️ No valid data processed for metrics: ${metrics.join(', ')}`);
//             setTumorData([]);
//             return;
//           }

//           console.log(`✅ Final tumor data:`, processedData);
//           if (isMounted) {
//             setTumorData(processedData);
//             localStorage.setItem(cacheKey, JSON.stringify(processedData));
//             setTotalTumorSamples(processedData.length);
//           }
//         } catch (error) {
//           console.error('Error fetching data from API:', error);
//           setTumorData([]);
//         } finally {
//           if (isMounted) {
//             setIsLoading(false);
//           }
//         }
//       }

//       fetchTumorExpressionData();
//       return () => {
//         isMounted = false;
//       };
//     };
//   }, [cancerType, normalizationMethod, selectedNoiseMetrics]);

//   const getCancerTypeLabel = (type: string) => {
//     const labels: { [key: string]: string } = {
//       "TCGA-BRCA": "Breast Cancer (BRCA)",
//       "TCGA-LUAD": "Lung Cancer (LUAD)",
//       "TCGA-PRAD": "Prostate Cancer (PRAD)",
//       "TCGA-COAD": "Colorectal Cancer (COAD)",
//       "TCGA-LIHC": "Liver Cancer (LIHC)",
//       "TCGA-KIRC": "Kidney Cancer (KIRC)",
//       "TCGA-STAD": "Stomach Cancer (STAD)",
//       "TCGA-OV": "Ovarian Cancer (OV)",
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

//   const downloadData = (format: string) => {
//     const data = tumorData;
//     let content = '';
//     let filename = `tumor_analysis_${cancerType}_${Date.now()}`;

//     if (format === 'csv') {
//       const excludedKeys = ['tumorValues', 'normalValues', 'combinedValues'];
//       const keys = Object.keys(data[0] || {}).filter(key => !excludedKeys.includes(key));
//       const headers = keys.join(',');
//       const rows = data.map(row => keys.map(key => row[key]).join(','));
//       content = [headers, ...rows].join('\n');
//       filename += '.csv';
//     }

//     const blob = new Blob([content], { type: format === 'csv' ? 'text/csv' : 'application/json' });
//     const url = URL.createObjectURL(blob);
//     const a = document.createElement('a');
//     a.href = url;
//     a.download = filename;
//     a.click();
//     URL.revokeObjectURL(url);
//   };

//   const colors = ['#2563eb', '#059669', '#dc2626', '#7c3aed', '#ea580c'];

//   // Custom bar chart component for DEPTH2
//   const BarChart = ({ data, dataKey, color, title }: any) => (
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
//             onClick={() => downloadChart(`bar-${dataKey}`, title)}
//             className="h-6 px-2 text-xs"
//           >
//             <Download className="h-3 w-3" />
//           </Button>
//         </CardTitle>
//       </CardHeader>
//       <CardContent className="pt-0">
//         <div ref={el => chartRefs.current[`bar-${dataKey}`] = el}>
//           <ResponsiveContainer width="100%" height={200}>
//             <ComposedChart data={data} margin={{ top: 5, right: 5, left: 5, bottom: 25 }}>
//               <CartesianGrid strokeDasharray="3 3" />
//               <XAxis 
//                 dataKey="sample" 
//                 tick={{ fontSize: 10 }}
//                 label={{ 
//                   value: 'Samples', 
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
//                   dy: 55,
//                   style: { fontSize: '10px' } 
//                 }} 
//               />
//               <Tooltip 
//                 formatter={(value: any) => [
//                   typeof value === 'number' ? value.toFixed(2) : value,
//                   title,
//                 ]} 
//               />
//               <Bar dataKey={dataKey} fill={color} />
//             </ComposedChart>
//           </ResponsiveContainer>
//         </div>
//       </CardContent>
//     </Card>
//   );

//   // Custom scatter plot component for tITH
//   const ScatterPlot = ({ data, dataKey, color, title }: any) => (
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
//             onClick={() => downloadChart(`scatter-${dataKey}`, title)}
//             className="h-6 px-2 text-xs"
//           >
//             <Download className="h-3 w-3" />
//           </Button>
//         </CardTitle>
//       </CardHeader>
//       <CardContent className="pt-0">
//         <div ref={el => chartRefs.current[`scatter-${dataKey}`] = el}>
//           <ResponsiveContainer width="100%" height={200}>
//             <ComposedChart data={data} margin={{ top: 5, right: 5, left: 5, bottom: 25 }}>
//               <CartesianGrid strokeDasharray="3 3" />
//               <XAxis 
//                 dataKey="sample" 
//                 tick={{ fontSize: 10 }}
//                 label={{ 
//                   value: 'Samples', 
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
//                   dy: 55,
//                   style: { fontSize: '10px' } 
//                 }} 
//               />
//               <Tooltip 
//                 formatter={(value: any) => [
//                   typeof value === 'number' ? value.toFixed(2) : value,
//                   title,
//                 ]} 
//               />
//               <Scatter dataKey={dataKey} fill={color} />
//             </ComposedChart>
//           </ResponsiveContainer>
//         </div>
//       </CardContent>
//     </Card>
//   );

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-yellow-50">
//       <style>
//         {`
//           .chart-container {
//             min-height: 200px;
//             width: 100%;
//             position: relative;
//           }
//         `}
//       </style>
//       <header className="bg-white shadow-sm border-b border-blue-100">
//         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
//           <div className="flex items-center justify-between">
//             <div className="flex items-center space-x-3">
//               <h1 className="text-2xl font-bold text-blue-900">Tumor Analysis Results</h1>
//             </div>
//             <nav className="flex space-x-6">
//               <Link to="/" className="text-blue-700 hover:text-blue-600 font-medium transition-colors">
//                 Home
//               </Link>
//               <Link to="/gene-analysis" className="text-blue-700 hover:text-blue-600 font-medium transition-colors">
//                 Gene Analysis
//               </Link>
//               <Link to="/pathway-analysis" className="text-blue-700 hover:text-blue-600 font-medium transition-colors">
//                 Pathway Analysis
//               </Link>
//               <Link to="/tumour-analysis" className="text-blue-500 font-medium">
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
//                 </CardTitle>
//               </CardHeader>
//               <CardContent className="space-y-6">
//                 {/* Expression Normalization Method */}
//                 <div>
//                   <h3 className="font-semibold text-blue-900 mb-3">Expression Normalization Method</h3>
//                   <RadioGroup value={normalizationMethod} onValueChange={setNormalizationMethod}>
//                     <div className="flex items-center space-x-2">
//                       <RadioGroupItem value="tpm" id="tpm" />
//                       <Label htmlFor="tpm">TPM</Label>
//                     </div>
//                     <div className="flex items-center space-x-2">
//                       <RadioGroupItem value="fpkm" id="fpkm" />
//                       <Label htmlFor="fpkm">FPKM</Label>
//                     </div>
//                     <div className="flex items-center space-x-2">
//                       <RadioGroupItem value="fpkm_uq" id="fpkm_uq" />
//                       <Label htmlFor="fpkm_uq">FPKM_UQ</Label>
//                     </div>
//                   </RadioGroup>
//                 </div>

//                 {/* Noise Metrics */}
//                 <div className="border rounded-md bg-white">
//                   <div className="flex justify-between items-center px-4 py-2">
//                     <div className="flex items-center space-x-2">
//                       <Checkbox
//                         id="noise-metrics-master"
//                         checked={areAllNoiseSelected}
//                         onCheckedChange={toggleAllNoiseMetrics}
//                       />
//                       <Label htmlFor="noise-metrics-master" className="font-bold text-blue-900 -ml-5">Noise Metrics</Label>
//                     </div>
//                     <button
//                       onClick={() => setIsNoiseMetricsOpen(prev => !prev)}
//                       className="text-blue-900"
//                     >
//                       {isNoiseMetricsOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
//                     </button>
//                   </div>
//                   {isNoiseMetricsOpen && (
//                     <div className="px-4 py-2 space-y-2">
//                       {allNoiseMetrics.map((metric) => (
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
//                 </div>

//                 {/* Analysis Plots */}
//                 <div className="border rounded-md bg-white">
//                   <div className="flex justify-between items-center px-4 py-2">
//                     <div className="flex items-center space-x-2">
//                       <Checkbox
//                         id="analysis-plots-master"
//                         checked={areAllPlotsSelected}
//                         onCheckedChange={toggleAllPlots}
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
//                               depth2: 'DEPTH2 Bar Chart',
//                               tith: 'tITH Scatter Plot'
//                             }[plotKey]}
//                           </Label>
//                         </div>
//                       ))}
//                     </div>
//                   )}
//                 </div>

//                 <Button onClick={applyFilters} className="w-full bg-blue-600 hover:bg-blue-700">
//                   Apply
//                 </Button>
//               </CardContent>
//             </Card>
//           </div>

//           {/* Main Content */}
//           <div className="flex-1">
//             {isLoading ? (
//               <div className="text-center text-blue-900">Loading charts...</div>
//             ) : (
//               <>
//                 <Link to="/tumour-analysis" className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-6 transition-colors">
//                   <ArrowLeft className="h-4 w-4 mr-2" />
//                   Back to Tumor Analysis
//                 </Link>

//                 <div className="mb-8">
//                   <h2 className="text-4xl font-bold text-blue-900 mb-2">
//                     Results for {getCancerTypeLabel(cancerType)}
//                   </h2>
//                   <div className="flex items-center justify-between mb-4">
//                     <div className="flex flex-wrap gap-2"></div>
//                     <div className="flex space-x-4">
//                       <Button onClick={() => downloadData('csv')} variant="outline" size="sm">
//                         <Download className="h-4 w-4 mr-2" /> Download CSV
//                       </Button>
//                     </div>
//                   </div>
//                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
//                     <Card className="border-0 shadow-lg">
//                       <CardContent className="flex flex-col items-center p-4 text-center">
//                         <Users className="h-6 w-6 text-blue-600 mb-2" />
//                         <div className="text-2xl font-bold text-blue-600">{totalTumorSamples}</div>
//                         <div className="text-xs text-gray-600">Total Tumor Samples</div>
//                       </CardContent>
//                     </Card>
//                   </div>
//                 </div>

//                 {/* DEPTH2 and tITH Plots */}
//                 {(visiblePlots.depth2 || visiblePlots.tith) && (
//                   <div className="mb-8">
//                     <h3 className="text-2xl font-bold text-blue-900 mb-4">Tumor Heterogeneity Metrics</h3>
//                     <div className="grid lg:grid-cols-2 md:grid-cols-1 gap-4">
//                       {visiblePlots.depth2 && (
//                         <BarChart 
//                           data={tumorData} 
//                           dataKey={`depth2_${normalizationMethod.toLowerCase()}`} 
//                           color="#ea580c" 
//                           title="DEPTH2 Scores" 
//                         />
//                       )}
//                       {visiblePlots.tith && (
//                         <ScatterPlot 
//                           data={tumorData} 
//                           dataKey={`tith_${normalizationMethod.toLowerCase()}`} 
//                           color="#2563eb" 
//                           title="Transcriptome-based Intra-Tumor Heterogeneity (tITH)" 
//                         />
//                       )}
//                     </div>
//                   </div>
//                 )}
//               </>
//             )}
//           </div>
//         </div>
//       </div>
//       <footer className="bg-gray-100 text-gray-700 text-m mt-10 p-8 text-center border-t border-gray-300">
//         <p className="text-blue-700 mt-4">© 2025 BIRL — This website is free and open to all users and there is no login requirement.</p>
//         <p className="font-semibold text-blue-700 mt-4">Biomedical Informatics & Engineering Research Laboratory, Lahore University of Management Sciences</p>
//         <p className="text-blue-700 mt-4">DHA, Lahore, Pakistan</p>
//         <p className="text-blue-700 mt-4">+92 (42) 3560 8352</p>
//       </footer>
//     </div>
//   );
// };

// export default TumourResults;