// // // import React, { useMemo } from "react";
// // // import { Button } from "@/components/ui/button";
// // // import { ChevronDown, ChevronRight } from "lucide-react";
// // // import { PlotlyBarChart } from "@/components/charts";
// // // import CollapsibleCard from "@/components/ui/collapsible-card";
// // // import { GeneStats } from "@/components/types/genes";

// // // interface StatisticalMetricsProps {
// // //   isOpen: boolean;
// // //   toggleOpen: () => void;
// // //   data: GeneStats[];
// // //   selectedGroups: string[];
// // //   selectedNoiseMetrics: string[];
// // //   visiblePlots: Record<string, boolean>;
// // //   metricOpenState: Record<string, boolean>;
// // //   toggleMetricSection: (metric: string) => void;
// // //   normalizationMethod: string;
// // //   analysisType: string;
// // //   genes: string[];
// // //   selectedSites: string[];
// // // }

// // // const StatisticalMetrics: React.FC<StatisticalMetricsProps> = ({
// // //   isOpen,
// // //   toggleOpen,
// // //   data,
// // //   selectedGroups,
// // //   selectedNoiseMetrics,
// // //   visiblePlots,
// // //   metricOpenState,
// // //   toggleMetricSection,
// // //   normalizationMethod,
// // //   analysisType,
// // //   genes,
// // //   selectedSites,
// // // }) => {
// // //   const noiseMetrics = {
// // //     CV: "cv",
// // //     Mean: "mean",
// // //     "Standard Deviation": "std",
// // //     MAD: "mad",
// // //     "CV²": "cv_squared",
// // //     "Differential Noise": "logfc",
// // //   };

// // //   const groupedData = useMemo(() => {
// // //     return data
// // //       .filter((gene) => selectedSites.includes(gene.site))
// // //       .reduce((acc, gene) => {
// // //         if (!acc[gene.site]) acc[gene.site] = [];
// // //         acc[gene.site].push(gene);
// // //         return acc;
// // //       }, {} as Record<string, GeneStats[]>);
// // //   }, [data, selectedSites]);

// // //   const logfcColors = useMemo(() => data.map((gene) => gene.logfc < 0 ? "#ef4444c3" : "#3b83f6af"), [data]);

// // //   return (
// // //     <div className="mb-8">
// // //       {/* <div className="flex gap-4 mb-6">
// // //         {["normal", "tumor"].map((group) => (
// // //           <Button
// // //             key={group}
// // //             className={`text-white ${selectedGroups.includes(group) ? "bg-blue-600 hover:bg-blue-700" : "bg-white text-blue-600 border border-blue-600 hover:bg-blue-50"}`}
// // //             onClick={() => {
// // //               const newGroups = selectedGroups.includes(group)
// // //                 ? selectedGroups.filter((g) => g !== group)
// // //                 : [...selectedGroups, group];
// // //               // Update groups logic here if needed
// // //             }}
// // //           >
// // //             {group.charAt(0).toUpperCase() + group.slice(1)}
// // //           </Button>
// // //         ))}
// // //       </div> */}
// // //       <div className="flex justify-between items-center mb-4">
// // //         <h3 className="text-2xl font-bold text-blue-900">Statistical Metrics</h3>
// // //         <button onClick={toggleOpen} className="text-blue-900">
// // //           {isOpen ? <ChevronDown className="h-6 w-6" /> : <ChevronRight className="h-6 w-6" />}
// // //         </button>
// // //       </div>
// // //       {isOpen && (
// // //         <>
// // //           {["cv", "mean", "std", "mad", "cv_squared", "logfc"].map((metric) => {
// // //             const displayMetric = Object.keys(noiseMetrics).find((key) => noiseMetrics[key] === metric) || "log2 Fold Change";
// // //             return (
// // //               selectedNoiseMetrics.includes(displayMetric) && visiblePlots[metric] && (
// // //                 <div key={`global-${metric}`} className="mb-4">
// // //                   <CollapsibleCard
// // //                     title={`${displayMetric}`}
// // //                     defaultOpen={metricOpenState[metric]}
// // //                     onToggle={() => toggleMetricSection(metric)}
// // //                   >
// // //                     {metric === "logfc" ? (
// // //                       selectedGroups.includes("tumor") && selectedGroups.includes("normal") ? (
// // //                         data.some((d) => d.normalSamples > 1) ? (
// // //                           <PlotlyBarChart
// // //                             data={data}
// // //                             xKey={analysisType === "cancer-specific" ? "gene_symbol" : "site"}
// // //                             yKey="logfc"
// // //                             title={`Log2fc (Tumor / Normal)`}
// // //                             xLabel={analysisType === "cancer-specific" ? "Genes" : "Cancer Sites"}
// // //                             yLabel={normalizationMethod.toUpperCase()}
// // //                             colors={logfcColors}
// // //                             orientation="v"
// // //                             showLegend={false}
// // //                           />
// // //                         ) : (
// // //                           <div className="text-center text-red-600">
// // //                             {data[0]?.logfcMessage || "Not enough normal samples for Differential Noise analysis."}
// // //                           </div>
// // //                         )
// // //                       ) : (
// // //                         <div className="text-center text-red-600">
// // //                           Both tumor and normal groups must be selected for Differential Noise analysis.
// // //                         </div>
// // //                       )
// // //                     ) : (
// // //                       <PlotlyBarChart
// // //                         data={analysisType === "pan-cancer" ? data : groupedData[Object.keys(groupedData)[0]] || []}
// // //                         xKey={analysisType === "pan-cancer" ? "site" : "gene_symbol"}
// // //                         yKey={[
// // //                           ...(selectedGroups.includes("normal") ? [`${metric}_normal`] : []),
// // //                           ...(selectedGroups.includes("tumor") ? [`${metric}_tumor`] : []),
// // //                         ]}
// // //                         title={displayMetric}
// // //                         // {
// // //                         //   analysisType === "pan-cancer"
// // //                         //     ? `${displayMetric} (${normalizationMethod.toUpperCase()})`
// // //                         //     : `${displayMetric} (${normalizationMethod.toUpperCase()})`
// // //                         // }
// // //                         xLabel={analysisType === "pan-cancer" ? "Cancer Sites" : "Genes"}
// // //                         yLabel={normalizationMethod.toUpperCase()}
// // //                         colors={selectedGroups.map((group) => group === "tumor" ? "#ef4444c3" : "#10b981bd")}
// // //                         orientation="v"
// // //                         legendLabels={["Normal", "Tumor"]}
// // //                       />
// // //                     )}
// // //                   </CollapsibleCard>
// // //                 </div>
// // //               )
// // //             );
// // //           })}
// // //         </>
// // //       )}
// // //     </div>
// // //   );
// // // };

// // // export default StatisticalMetrics;
// //   // import React, { useMemo } from "react";
// //   // import { Button } from "@/components/ui/button";
// //   // import { ChevronDown, ChevronRight } from "lucide-react";
// //   // import { PlotlyBarChart } from "@/components/charts";
// //   // import CollapsibleCard from "@/components/ui/collapsible-card";
// //   // import { GeneStats } from "@/components/types/genes";

// //   // interface StatisticalMetricsProps {
// //   //   isOpen: boolean;
// //   //   toggleOpen: () => void;
// //   //   data: GeneStats[];
// //   //   selectedGroups: string[];
// //   //   selectedNoiseMetrics: string[];
// //   //   visiblePlots: Record<string, boolean>;
// //   //   metricOpenState: Record<string, boolean>;
// //   //   toggleMetricSection: (metric: string) => void;
// //   //   normalizationMethod: string;
// //   //   analysisType: string;
// //   //   genes: string[];
// //   //   selectedSites: string[];
// //   //   dataFormat: 'raw' | 'log2';
// //   //   setDataFormat: (format: 'raw' | 'log2') => void;
// //   // }

// //   // const StatisticalMetrics: React.FC<StatisticalMetricsProps> = ({
// //   //   isOpen,
// //   //   toggleOpen,
// //   //   data,
// //   //   selectedGroups,
// //   //   selectedNoiseMetrics,
// //   //   visiblePlots,
// //   //   metricOpenState,
// //   //   toggleMetricSection,
// //   //   normalizationMethod,
// //   //   analysisType,
// //   //   genes,
// //   //   selectedSites,
// //   //   dataFormat,
// //   //   setDataFormat,
// //   // }) => {
// //   //   const noiseMetrics = {
// //   //     CV: "cv",
// //   //     Mean: "mean",
// //   //     "Standard Deviation": "std",
// //   //     MAD: "mad",
// //   //     "CV²": "cv_squared",
// //   //     "Differential Noise": "logfc",
// //   //   };

// //   //   const groupedData = useMemo(() => {
// //   //     return data
// //   //       .filter((gene) => selectedSites.includes(gene.site) && gene.dataFormat === dataFormat)
// //   //       .reduce((acc, gene) => {
// //   //         if (!acc[gene.site]) acc[gene.site] = [];
// //   //         acc[gene.site].push(gene);
// //   //         return acc;
// //   //       }, {} as Record<string, GeneStats[]>);
// //   //   }, [data, selectedSites, dataFormat]);

// //   //   const logfcColors = useMemo(() => data.filter((gene) => gene.dataFormat === dataFormat).map((gene) => gene.logfc < 0 ? "#ef4444c3" : "#3b83f6af"), [data, dataFormat]);

// //   //   return (
// //   //     <div className="mb-8">
// //   //       <div className="flex justify-between items-center mb-4">
// //   //         <h3 className="text-2xl font-bold text-blue-900">Statistical Metrics</h3>
// //   //         <div className="flex gap-2 items-center">
// //   //           <Button
// //   //             className={`text-white ${dataFormat === 'raw' ? "bg-blue-600 hover:bg-blue-700" : "bg-white text-blue-600 border border-blue-600 hover:bg-blue-50"}`}
// //   //             onClick={() => setDataFormat('raw')}
// //   //           >
// //   //             Raw Data
// //   //           </Button>
// //   //           <Button
// //   //             className={`text-white ${dataFormat === 'log2' ? "bg-blue-600 hover:bg-blue-700" : "bg-white text-blue-600 border border-blue-600 hover:bg-blue-50"}`}
// //   //             onClick={() => setDataFormat('log2')}
// //   //           >
// //   //             Log2 Transformed
// //   //           </Button>
// //   //           <button onClick={toggleOpen} className="text-blue-900">
// //   //             {isOpen ? <ChevronDown className="h-6 w-6" /> : <ChevronRight className="h-6 w-6" />}
// //   //           </button>
// //   //         </div>
// //   //       </div>
// //   //       {isOpen && (
// //   //         <>
// //   //           {["cv", "mean", "std", "mad", "cv_squared", "logfc"].map((metric) => {
// //   //             const displayMetric = Object.keys(noiseMetrics).find((key) => noiseMetrics[key] === metric) || "log2 Fold Change";
// //   //             return (
// //   //               selectedNoiseMetrics.includes(displayMetric) && visiblePlots[metric] && (
// //   //                 <div key={`global-${metric}`} className="mb-4">
// //   //                   <CollapsibleCard
// //   //                     title={`${displayMetric} (${dataFormat === 'raw' ? 'Raw' : 'Log2'})`}
// //   //                     defaultOpen={metricOpenState[metric]}
// //   //                     onToggle={() => toggleMetricSection(metric)}
// //   //                   >
// //   //                     {metric === "logfc" ? (
// //   //                       selectedGroups.includes("tumor") && selectedGroups.includes("normal") ? (
// //   //                         data.some((d) => d.normalSamples > 1 && d.dataFormat === dataFormat) ? (
// //   //                           <PlotlyBarChart
// //   //                             data={data.filter((d) => d.dataFormat === dataFormat)}
// //   //                             xKey={analysisType === "cancer-specific" ? "gene_symbol" : "site"}
// //   //                             yKey="logfc"
// //   //                             title={`Log2fc (Tumor / Normal) (${dataFormat === 'raw' ? 'Raw' : 'Log2'})`}
// //   //                             xLabel={analysisType === "cancer-specific" ? "Genes" : "Cancer Sites"}
// //   //                             yLabel={`${normalizationMethod.toUpperCase()} (${dataFormat === 'raw' ? 'Raw' : 'Log2'})`}
// //   //                             colors={logfcColors}
// //   //                             orientation="v"
// //   //                             showLegend={false}
// //   //                           />
// //   //                         ) : (
// //   //                           <div className="text-center text-red-600">
// //   //                             {data[0]?.logfcMessage || "Not enough normal samples for Differential Noise analysis."}
// //   //                           </div>
// //   //                         )
// //   //                       ) : (
// //   //                         <div className="text-center text-red-600">
// //   //                           Both tumor and normal groups must be selected for Differential Noise analysis.
// //   //                         </div>
// //   //                       )
// //   //                     ) : (
// //   //                       <PlotlyBarChart
// //   //                         data={analysisType === "pan-cancer" ? data.filter((d) => d.dataFormat === dataFormat) : groupedData[Object.keys(groupedData)[0]] || []}
// //   //                         xKey={analysisType === "pan-cancer" ? "site" : "gene_symbol"}
// //   //                         yKey={[
// //   //                           ...(selectedGroups.includes("normal") ? [`${metric}_normal`] : []),
// //   //                           ...(selectedGroups.includes("tumor") ? [`${metric}_tumor`] : []),
// //   //                         ]}
// //   //                         title={`${displayMetric} (${dataFormat === 'raw' ? 'Raw' : 'Log2 Transformed'})`}
// //   //                         xLabel={analysisType === "pan-cancer" ? "Cancer Sites" : "Genes"}
// //   //                         yLabel={displayMetric}
// //   //                         colors={selectedGroups.map((group) => group === "tumor" ? "#ef4444c3" : "#10b981bd")}
// //   //                         orientation="v"
// //   //                         legendLabels={["Normal", "Tumor"]}
// //   //                       />
// //   //                     )}
// //   //                   </CollapsibleCard>
// //   //                 </div>
// //   //               )
// //   //             );
// //   //           })}
// //   //         </>
// //   //       )}
// //   //     </div>
// //   //   );
// //   // };

// //   // export default StatisticalMetrics;
// //   import React, { useMemo, useState } from "react";
// // import { ChevronDown, ChevronRight } from "lucide-react";
// // import { PlotlyBarChart } from "@/components/charts";
// // import CollapsibleCard from "@/components/ui/collapsible-card";
// // import { GeneStats } from "@/components/types/genes";
// // import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
// // import { Label } from "@/components/ui/label";

// // interface StatisticalMetricsProps {
// //   isOpen: boolean;
// //   toggleOpen: () => void;
// //   data: GeneStats[];
// //   selectedGroups: string[];
// //   selectedNoiseMetrics: string[];
// //   visiblePlots: Record<string, boolean>;
// //   metricOpenState: Record<string, boolean>;
// //   toggleMetricSection: (metric: string) => void;
// //   normalizationMethod: string;
// //   analysisType: string;
// //   genes: string[];
// //   selectedSites: string[];
// //   dataFormat: 'raw' | 'log2';
// //   setDataFormat: (format: 'raw' | 'log2') => void;
// // }

// // const StatisticalMetrics: React.FC<StatisticalMetricsProps> = ({
// //   isOpen,
// //   toggleOpen,
// //   data,
// //   selectedGroups,
// //   selectedNoiseMetrics,
// //   visiblePlots,
// //   metricOpenState,
// //   toggleMetricSection,
// //   normalizationMethod,
// //   analysisType,
// //   genes,
// //   selectedSites,
// //   dataFormat,
// //   setDataFormat,
// // }) => {
// //   const noiseMetrics = {
// //     CV: "cv",
// //     Mean: "mean",
// //     "Standard Deviation": "std",
// //     MAD: "mad",
// //     "CV²": "cv_squared",
// //     "Differential Noise": "logfc",
// //   };

// //   // State to manage data format for each metric independently
// //   const [metricDataFormats, setMetricDataFormats] = useState<Record<string, 'raw' | 'log2'>>(
// //     Object.fromEntries(
// //       ["cv", "mean", "std", "mad", "cv_squared", "logfc"].map((metric) => [metric, dataFormat])
// //     )
// //   );

// //   // Update metric data format when the parent dataFormat changes
// //   React.useEffect(() => {
// //     setMetricDataFormats((prev) =>
// //       Object.fromEntries(
// //         Object.keys(prev).map((metric) => [metric, dataFormat])
// //       )
// //     );
// //   }, [dataFormat]);

// //   // Handler to update data format for a specific metric
// //   const handleMetricDataFormatChange = (metric: string, value: 'raw' | 'log2') => {
// //     setMetricDataFormats((prev) => ({ ...prev, [metric]: value }));
// //     setDataFormat(value); // Sync with parent state
// //   };

// //   const groupedData = useMemo(() => {
// //     return Object.fromEntries(
// //       ["cv", "mean", "std", "mad", "cv_squared", "logfc"].map((metric) => [
// //         metric,
// //         data
// //           .filter((gene) => selectedSites.includes(gene.site) && gene.dataFormat === metricDataFormats[metric])
// //           .reduce((acc, gene) => {
// //             if (!acc[gene.site]) acc[gene.site] = [];
// //             acc[gene.site].push(gene);
// //             return acc;
// //           }, {} as Record<string, GeneStats[]>),
// //       ])
// //     );
// //   }, [data, selectedSites, metricDataFormats]);

// //   const logfcColors = useMemo(
// //     () =>
// //       Object.fromEntries(
// //         ["cv", "mean", "std", "mad", "cv_squared", "logfc"].map((metric) => [
// //           metric,
// //           data
// //             .filter((gene) => gene.dataFormat === metricDataFormats[metric])
// //             .map((gene) => (gene.logfc < 0 ? "#ef4444c3" : "#3b83f6af")),
// //         ])
// //       ),
// //     [data, metricDataFormats]
// //   );

// //   return (
// //     <div className="mb-8">
// //       <div className="flex justify-between items-center mb-4">
// //         <h3 className="text-2xl font-bold text-blue-900">Statistical Metrics</h3>
// //         <button onClick={toggleOpen} className="text-blue-900">
// //           {isOpen ? <ChevronDown className="h-6 w-6" /> : <ChevronRight className="h-6 w-6" />}
// //         </button>
// //       </div>
// //       {isOpen && (
// //         <>
// //           {["cv", "mean", "std", "mad", "cv_squared", "logfc"].map((metric) => {
// //             const displayMetric = Object.keys(noiseMetrics).find((key) => noiseMetrics[key] === metric) || "log2 Fold Change";
// //             const currentDataFormat = metricDataFormats[metric];
// //             return (
// //               selectedNoiseMetrics.includes(displayMetric) && visiblePlots[metric] && (
// //                 <div key={`global-${metric}`} className="mb-4">
// //                   <CollapsibleCard
// //                     title={`${displayMetric} (${currentDataFormat === 'raw' ? 'Raw' : 'Log2'})`}
// //                     defaultOpen={metricOpenState[metric]}
// //                     onToggle={() => toggleMetricSection(metric)}
// //                   >
// //                     <div className="flex justify-end mb-2">
// //                       <RadioGroup
// //                         defaultValue={currentDataFormat}
// //                         onValueChange={(value: 'raw' | 'log2') => handleMetricDataFormatChange(metric, value)}
// //                         className="flex gap-4"
// //                       >
// //                         <div className="flex items-center space-x-2">
// //                           <RadioGroupItem value="raw" id={`${metric}-raw`} />
// //                           <Label htmlFor={`${metric}-raw`} className="text-sm text-blue-900">
// //                             Raw Data
// //                           </Label>
// //                         </div>
// //                         <div className="flex items-center space-x-2">
// //                           <RadioGroupItem value="log2" id={`${metric}-log2`} />
// //                           <Label htmlFor={`${metric}-log2`} className="text-sm text-blue-900">
// //                             Log2 Transformed
// //                           </Label>
// //                         </div>
// //                       </RadioGroup>
// //                     </div>
// //                     {metric === "logfc" ? (
// //                       selectedGroups.includes("tumor") && selectedGroups.includes("normal") ? (
// //                         data.some((d) => d.normalSamples > 1 && d.dataFormat === currentDataFormat) ? (
// //                           <PlotlyBarChart
// //                             data={data.filter((d) => d.dataFormat === currentDataFormat)}
// //                             xKey={analysisType === "cancer-specific" ? "gene_symbol" : "site"}
// //                             yKey="logfc"
// //                             title={`Log2fc (Tumor / Normal) (${currentDataFormat === 'raw' ? 'Raw' : 'Log2'})`}
// //                             xLabel={analysisType === "cancer-specific" ? "Genes" : "Cancer Sites"}
// //                             yLabel={displayMetric}
// //                             colors={logfcColors[metric]}
// //                             orientation="v"
// //                             showLegend={false}
// //                           />
// //                         ) : (
// //                           <div className="text-center text-red-600">
// //                             {data.find((d) => d.dataFormat === currentDataFormat)?.logfcMessage ||
// //                               "Not enough normal samples for Differential Noise analysis."}
// //                           </div>
// //                         )
// //                       ) : (
// //                         <div className="text-center text-red-600">
// //                           Both tumor and normal groups must be selected for Differential Noise analysis.
// //                         </div>
// //                       )
// //                     ) : (
// //                       <PlotlyBarChart
// //                         data={
// //                           analysisType === "pan-cancer"
// //                             ? data.filter((d) => d.dataFormat === currentDataFormat)
// //                             : groupedData[metric][Object.keys(groupedData[metric])[0]] || []
// //                         }
// //                         xKey={analysisType === "pan-cancer" ? "site" : "gene_symbol"}
// //                         yKey={[
// //                           ...(selectedGroups.includes("normal") ? [`${metric}_normal`] : []),
// //                           ...(selectedGroups.includes("tumor") ? [`${metric}_tumor`] : []),
// //                         ]}
// //                         title={`${displayMetric} (${currentDataFormat === 'raw' ? 'Raw' : 'Log2'})`}
// //                         xLabel={analysisType === "pan-cancer" ? "Cancer Sites" : "Genes"}
// //                         yLabel={displayMetric}
// //                         colors={selectedGroups.map((group) => (group === "tumor" ? "#ef4444c3" : "#10b981bd"))}
// //                         orientation="v"
// //                         legendLabels={["Normal", "Tumor"]}
// //                       />
// //                     )}
// //                   </CollapsibleCard>
// //                 </div>
// //               )
// //             );
// //           })}
// //         </>
// //       )}
// //     </div>
// //   );
// // };

// // export default StatisticalMetrics;
// import React, { useMemo, useState } from "react";
// import { ChevronDown, ChevronRight } from "lucide-react";
// import { PlotlyBarChart } from "@/components/charts";
// import CollapsibleCard from "@/components/ui/collapsible-card";
// import { GeneStats } from "@/components/types/genes";
// import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
// import { Label } from "@/components/ui/label";

// interface StatisticalMetricsProps {
//   isOpen: boolean;
//   toggleOpen: () => void;
//   data: GeneStats[];
//   selectedGroups: string[];
//   selectedNoiseMetrics: string[];
//   visiblePlots: Record<string, boolean>;
//   metricOpenState: Record<string, boolean>;
//   toggleMetricSection: (metric: string) => void;
//   normalizationMethod: string;
//   analysisType: string;
//   genes: string[];
//   selectedSites: string[];
//   dataFormat: 'raw' | 'log2';
//   setDataFormat: (format: 'raw' | 'log2') => void;
// }

// const StatisticalMetrics: React.FC<StatisticalMetricsProps> = ({
//   isOpen,
//   toggleOpen,
//   data,
//   selectedGroups,
//   selectedNoiseMetrics,
//   visiblePlots,
//   metricOpenState,
//   toggleMetricSection,
//   normalizationMethod,
//   analysisType,
//   genes,
//   selectedSites,
//   dataFormat,
// }) => {
//   const noiseMetrics = {
//     CV: "cv",
//     Mean: "mean",
//     "Standard Deviation": "std",
//     MAD: "mad",
//     "CV²": "cv_squared",
//     "Differential Noise": "logfc",
//   };

//   // State to manage data format for each metric independently
//   const [metricDataFormats, setMetricDataFormats] = useState<Record<string, 'raw' | 'log2'>>(
//     Object.fromEntries(
//       ["cv", "mean", "std", "mad", "cv_squared", "logfc"].map((metric) => [metric, dataFormat])
//     )
//   );

//   // Handler to update data format for a specific metric
//   const handleMetricDataFormatChange = (metric: string, value: 'raw' | 'log2') => {
//     setMetricDataFormats((prev) => ({ ...prev, [metric]: value }));
//   };

//   const groupedData = useMemo(() => {
//     return Object.fromEntries(
//       ["cv", "mean", "std", "mad", "cv_squared", "logfc"].map((metric) => [
//         metric,
//         data
//           .filter((gene) => selectedSites.includes(gene.site) && gene.dataFormat === metricDataFormats[metric])
//           .reduce((acc, gene) => {
//             if (!acc[gene.site]) acc[gene.site] = [];
//             acc[gene.site].push(gene);
//             return acc;
//           }, {} as Record<string, GeneStats[]>),
//       ])
//     );
//   }, [data, selectedSites, metricDataFormats]);

//   const logfcColors = useMemo(
//     () =>
//       Object.fromEntries(
//         ["cv", "mean", "std", "mad", "cv_squared", "logfc"].map((metric) => [
//           metric,
//           data
//             .filter((gene) => gene.dataFormat === metricDataFormats[metric])
//             .map((gene) => (gene.logfc < 0 ? "#ef4444c3" : "#3b83f6af")),
//         ])
//       ),
//     [data, metricDataFormats]
//   );

//   return (
//     <div className="mb-8">
//       <div className="flex justify-between items-center mb-4">
//         <h3 className="text-2xl font-bold text-blue-900">Statistical Metrics</h3>
//         <button onClick={toggleOpen} className="text-blue-900">
//           {isOpen ? <ChevronDown className="h-6 w-6" /> : <ChevronRight className="h-6 w-6" />}
//         </button>
//       </div>
//       {isOpen && (
//         <>
//           {["cv", "mean", "std", "mad", "cv_squared", "logfc"].map((metric) => {
//             const displayMetric = Object.keys(noiseMetrics).find((key) => noiseMetrics[key] === metric) || "log2 Fold Change";
//             const currentDataFormat = metricDataFormats[metric];
//             return (
//               selectedNoiseMetrics.includes(displayMetric) && visiblePlots[metric] && (
//                 <div key={`global-${metric}`} className="mb-4">
//                   <CollapsibleCard
//                     title={`${displayMetric} (${currentDataFormat === 'raw' ? 'Raw' : 'Log2'})`}
//                     defaultOpen={metricOpenState[metric]}
//                     onToggle={() => toggleMetricSection(metric)}
//                   >
//                     <div className="flex justify-end mb-2">
//                       <RadioGroup
//                         defaultValue={currentDataFormat}
//                         onValueChange={(value: 'raw' | 'log2') => handleMetricDataFormatChange(metric, value)}
//                         className="flex gap-4"
//                       >
//                         <div className="flex items-center space-x-2">
//                           <RadioGroupItem value="raw" id={`${metric}-raw`} />
//                           <Label htmlFor={`${metric}-raw`} className="text-sm text-blue-900">
//                             Raw Data
//                           </Label>
//                         </div>
//                         <div className="flex items-center space-x-2">
//                           <RadioGroupItem value="log2" id={`${metric}-log2`} />
//                           <Label htmlFor={`${metric}-log2`} className="text-sm text-blue-900">
//                             Log2 Transformed
//                           </Label>
//                         </div>
//                       </RadioGroup>
//                     </div>
//                     {metric === "logfc" ? (
//                       selectedGroups.includes("tumor") && selectedGroups.includes("normal") ? (
//                         data.some((d) => d.normalSamples > 1 && d.dataFormat === currentDataFormat) ? (
//                           <PlotlyBarChart
//                             data={data.filter((d) => d.dataFormat === currentDataFormat)}
//                             xKey={analysisType === "cancer-specific" ? "gene_symbol" : "site"}
//                             yKey="logfc"
//                             title={`Log2fc (Tumor / Normal) (${currentDataFormat === 'raw' ? 'Raw' : 'Log2'})`}
//                             xLabel={analysisType === "cancer-specific" ? "Genes" : "Cancer Sites"}
//                             yLabel={`${normalizationMethod.toUpperCase()} (${currentDataFormat === 'raw' ? 'Raw' : 'Log2'})`}
//                             colors={logfcColors[metric]}
//                             orientation="v"
//                             showLegend={false}
//                           />
//                         ) : (
//                           <div className="text-center text-red-600">
//                             {data.find((d) => d.dataFormat === currentDataFormat)?.logfcMessage ||
//                               "Not enough normal samples for Differential Noise analysis."}
//                           </div>
//                         )
//                       ) : (
//                         <div className="text-center text-red-600">
//                           Both tumor and normal groups must be selected for Differential Noise analysis.
//                         </div>
//                       )
//                     ) : (
//                       <PlotlyBarChart
//                         data={
//                           analysisType === "pan-cancer"
//                             ? data.filter((d) => d.dataFormat === currentDataFormat)
//                             : groupedData[metric][Object.keys(groupedData[metric])[0]] || []
//                         }
//                         xKey={analysisType === "pan-cancer" ? "site" : "gene_symbol"}
//                         yKey={[
//                           ...(selectedGroups.includes("normal") ? [`${metric}_normal`] : []),
//                           ...(selectedGroups.includes("tumor") ? [`${metric}_tumor`] : []),
//                         ]}
//                         title={`${displayMetric} (${currentDataFormat === 'raw' ? 'Raw' : 'Log2'})`}
//                         xLabel={analysisType === "pan-cancer" ? "Cancer Sites" : "Genes"}
//                         yLabel={`${normalizationMethod.toUpperCase()} (${currentDataFormat === 'raw' ? 'Raw' : 'Log2'})`}
//                         colors={selectedGroups.map((group) => (group === "tumor" ? "#ef4444c3" : "#10b981bd"))}
//                         orientation="v"
//                         legendLabels={["Normal", "Tumor"]}
//                       />
//                     )}
//                   </CollapsibleCard>
//                 </div>
//               )
//             );
//           })}
//         </>
//       )}
//     </div>
//   );
// };

// export default StatisticalMetrics;
import React, { useMemo, useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { PlotlyBarChart } from "@/components/charts";
import CollapsibleCard from "@/components/ui/collapsible-card";
import { GeneStats } from "@/components/types/genes";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

interface StatisticalMetricsProps {
  isOpen: boolean;
  toggleOpen: () => void;
  data: GeneStats[];
  selectedGroups: string[];
  selectedNoiseMetrics: string[];
  visiblePlots: Record<string, boolean>;
  metricOpenState: Record<string, boolean>;
  toggleMetricSection: (metric: string) => void;
  normalizationMethod: string;
  analysisType: string;
  genes: string[];
  selectedSites: string[];
  dataFormat: 'raw' | 'log2';
  setDataFormat: (format: 'raw' | 'log2') => void;
}

const StatisticalMetrics: React.FC<StatisticalMetricsProps> = ({
  isOpen,
  toggleOpen,
  data,
  selectedGroups,
  selectedNoiseMetrics,
  visiblePlots,
  metricOpenState,
  toggleMetricSection,
  normalizationMethod,
  analysisType,
  genes,
  selectedSites,
  dataFormat,
}) => {
  const noiseMetrics = {
    CV: "cv",
    Mean: "mean",
    "Standard Deviation": "std",
    MAD: "mad",
    "CV²": "cv_squared",
    "Differential Noise": "logfc",
  };

  // State to manage data format for each metric independently
  const [metricDataFormats, setMetricDataFormats] = useState<Record<string, 'raw' | 'log2'>>(
    Object.fromEntries(
      ["cv", "mean", "std", "mad", "cv_squared", "logfc"].map((metric) => [metric, dataFormat])
    )
  );

  // Handler to update data format for a specific metric
  const handleMetricDataFormatChange = (metric: string, value: 'raw' | 'log2') => {
    setMetricDataFormats((prev) => ({ ...prev, [metric]: value }));
  };

  const groupedData = useMemo(() => {
    return Object.fromEntries(
      ["cv", "mean", "std", "mad", "cv_squared", "logfc"].map((metric) => [
        metric,
        data
          .filter((gene) => selectedSites.includes(gene.site) && gene.dataFormat === metricDataFormats[metric])
          .reduce((acc, gene) => {
            if (!acc[gene.site]) acc[gene.site] = [];
            acc[gene.site].push(gene);
            return acc;
          }, {} as Record<string, GeneStats[]>),
      ])
    );
  }, [data, selectedSites, metricDataFormats]);

  const logfcColors = useMemo(
    () =>
      Object.fromEntries(
        ["cv", "mean", "std", "mad", "cv_squared", "logfc"].map((metric) => [
          metric,
          data
            .filter((gene) => gene.dataFormat === metricDataFormats[metric])
            .map((gene) => (gene.logfc < 0 ? "#ef4444c3" : "#3b83f6af")),
        ])
      ),
    [data, metricDataFormats]
  );

  return (
    <div className="mb-8">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-2xl font-bold text-blue-900">Statistical Metrics</h3>
        <button onClick={toggleOpen} className="text-blue-900">
          {isOpen ? <ChevronDown className="h-6 w-6" /> : <ChevronRight className="h-6 w-6" />}
        </button>
      </div>
      {isOpen && (
        <>
          {["cv", "mean", "std", "mad", "cv_squared", "logfc"].map((metric) => {
            const displayMetric = Object.keys(noiseMetrics).find((key) => noiseMetrics[key] === metric) || "log2 Fold Change";
            const currentDataFormat = metricDataFormats[metric];
            const metricData = data.filter((d) => d.dataFormat === currentDataFormat);
            return (
              selectedNoiseMetrics.includes(displayMetric) && visiblePlots[metric] && (
                <div key={`global-${metric}`} className="mb-4">
                  <CollapsibleCard
                    title={`${displayMetric}`}
                    defaultOpen={metricOpenState[metric]}
                    onToggle={() => toggleMetricSection(metric)}
                  >
                    {/* Only show switch if not Differential Noise (logfc) */}
                      {metric !== "logfc" && (
                        <div className="flex justify-start mb-2 pl-6">
                          {/* <div className="flex items-center space-x-2 justify-center"> */}
                          <div className="flex items-center space-x-2">
                            <Switch
                              id={`${metric}-log2-switch`}
                              checked={currentDataFormat === "log2"}
                              onCheckedChange={(checked) =>
                                handleMetricDataFormatChange(metric, checked ? "log2" : "raw")
                              }
                              className="data-[state=checked]:bg-blue-600 data-[state=unchecked]:bg-gray-300"
                            />
                            <Label
                              htmlFor={`${metric}-log2-switch`}
                              className="text-sm text-blue-900"
                            >
                              Log<sub>2</sub>(X + 1)
                            </Label>
                          </div>
                        </div>
                      )}
                    {metricData.length === 0 ? (
                      <div className="text-center text-red-600">
                        No {currentDataFormat === 'raw' ? 'raw' : 'log2'} data available for {displayMetric}.
                      </div>
                    ) : (
                      <div className="w-full max-w-[800px] mx-auto">
                        {metric === "logfc" ? (
                          selectedGroups.includes("tumor") && selectedGroups.includes("normal") ? (
                            metricData.some((d) => d.normalSamples > 1) ? (
                              <PlotlyBarChart
                                key={`${metric}-${currentDataFormat}`}
                                data={metricData}
                                xKey={analysisType === "cancer-specific" ? "gene_symbol" : "site"}
                                yKey="logfc"
                                // title={
                                //   <>
                                //     log<sub>2</sub>(CV<sub>tumor</sub> / CV<sub>normal</sub>) (
                                //     {currentDataFormat === "raw" ? "Raw" : "Log2"})
                                //   </>
                                // }
                                title={`Log₂(CV<sub>tumor</sub> / CV<sub>normal</sub>) `}
                                // title={`log\u2082(CV\u209C\u209\u2098\u2090\u209B vs CV\u2099\u2090\u2098\u2090\u209B)`}
                                xLabel={analysisType === "cancer-specific" ? "Genes" : "Cancer Sites"}
                                yLabel={displayMetric}
                                colors={logfcColors[metric]}
                                orientation="v"
                                showLegend={false}
                              />
                            ) : (
                              <div className="text-center text-red-600">
                                {metricData[0]?.logfcMessage || "Not enough normal samples for Differential Noise analysis."}
                              </div>
                            )
                          ) : (
                            <div className="text-center text-red-600">
                              Both tumor and normal groups must be selected for Differential Noise analysis.
                            </div>
                          )
                        // ) : metric === "mad" || metric === "std" ? (
                        // <PlotlyBarChart
                        //   key={`${metric}-${currentDataFormat}`}
                        //   data={
                        //     analysisType === "pan-cancer"
                        //       ? metricData
                        //       : groupedData["mean"][Object.keys(groupedData[metric])[0]] || []
                        //   }
                        //   xKey={analysisType === "pan-cancer" ? "site" : "gene_symbol"}
                        //   yKey={[
                        //     ...(selectedGroups.includes("normal") ? [`mean_normal`] : []),
                        //     ...(selectedGroups.includes("tumor") ? [`mean_tumor`] : []),
                        //   ]}
                        //   errorKey={
                        //     [
                        //           ...(selectedGroups.includes("normal")
                        //             ? [`${metric}_normal`]
                        //             : []),
                        //           ...(selectedGroups.includes("tumor")
                        //             ? [`${metric}_tumor`]
                        //             : []),
                        //         ]
                        //   }
                        //   title={`${displayMetric} (${
                        //     currentDataFormat === "raw" ? "Raw" : `Log<sub>2</sub> Transformed`
                        //   })`}
                        //   xLabel={analysisType === "pan-cancer" ? "Cancer Sites" : "Genes"}
                        //   yLabel={displayMetric}
                        //   colors={selectedGroups.map((group) =>
                        //     group === "tumor" ? "#ef4444c3" : "#10b981bd"
                        //   )}
                        //   orientation="v"
                        //   legendLabels={["Normal", "Tumor"]}
                        // />
                        ) : 
                      //   metric === "mad" || metric === "std" ? (
                      // <PlotlyBarChart
                      //   key={`${metric}-${currentDataFormat}`}
                      //   data={
                      //     (() => {
                      //       // 🔹 Use the same dataFormat as the current metric (mad/std) for both mean and error
                      //       const metricFormat = metricDataFormats[metric];

                      //       // Filter the full dataset by this format
                      //       const filtered = data.filter(
                      //         (gene) => selectedSites.includes(gene.site) && gene.dataFormat === metricFormat
                      //       );

                      //       // Group by site or gene
                      //       return filtered.reduce((acc, gene) => {
                      //         if (!acc[gene.site]) acc[gene.site] = [];
                      //         acc[gene.site].push(gene);
                      //         return acc;
                      //       }, {} as Record<string, GeneStats[]>)[Object.keys(groupedData[metric])[0]] || [];
                      //     })()
                      //   }
                      //   xKey={analysisType === "pan-cancer" ? "site" : "gene_symbol"}
                      //   yKey={[
                      //     ...(selectedGroups.includes("normal") ? ["mean_normal"] : []),
                      //     ...(selectedGroups.includes("tumor") ? ["mean_tumor"] : []),
                      //   ]}
                      //   errorKey={[
                      //     ...(selectedGroups.includes("normal") ? [`${metric}_normal`] : []),
                      //     ...(selectedGroups.includes("tumor") ? [`${metric}_tumor`] : []),
                      //   ]}
                      //   title={`Mean ± ${displayMetric}`}
                      //   xLabel={analysisType === "pan-cancer" ? "Cancer Sites" : "Genes"}
                      //   yLabel={`Mean ± ${displayMetric} (${normalizationMethod})`}
                      //   colors={selectedGroups.map((group) =>
                      //     group === "tumor" ? "#ef4444c3" : "#10b981bd"
                      //   )}
                      //   orientation="v"
                      //   legendLabels={["Normal", "Tumor"]}
                      // />

                      // ) : (
                      //   <PlotlyBarChart
                      //     key={`${metric}-${currentDataFormat}`}
                      //     data={
                      //       analysisType === "pan-cancer"
                      //         ? metricData
                      //         : groupedData[metric][Object.keys(groupedData[metric])[0]] || []
                      //     }
                      //     xKey={analysisType === "pan-cancer" ? "site" : "gene_symbol"}
                      //     yKey={[
                      //       ...(selectedGroups.includes("normal") ? [`${metric}_normal`] : []),
                      //       ...(selectedGroups.includes("tumor") ? [`${metric}_tumor`] : []),
                      //     ]}
                      //     // errorKey={
                      //     //   displayMetric === "Mean"
                      //     //     ? [
                      //     //         ...(selectedGroups.includes("normal")
                      //     //           ? ["std_normal", "mad_normal"]
                      //     //           : []),
                      //     //         ...(selectedGroups.includes("tumor")
                      //     //           ? ["std_tumor", "mad_normal"]
                      //     //           : []),
                      //     //       ]
                      //     //     : undefined
                      //     // }
                      //     // title={`${displayMetric} (${
                      //     //   currentDataFormat === "raw" ? "Raw" : `Log₂ Transformed`
                      //     // })`}
                      //     title={`${displayMetric}`}
                      //     xLabel={analysisType === "pan-cancer" ? "Cancer Sites" : "Genes"}
                      //     yLabel={`${displayMetric} (${normalizationMethod})`}
                      //     colors={selectedGroups.map((group) =>
                      //       group === "tumor" ? "#ef4444c3" : "#10b981bd"
                      //     )}
                      //     orientation="v"
                      //     legendLabels={["Normal", "Tumor"]}
                      //   />
                      // )}
                      metric === "mad" || metric === "std" ? (
                        <PlotlyBarChart
                          key={`${metric}-${currentDataFormat}`}
                          data={metricData} // Use metricData directly, which already includes all selected sites
                          xKey={analysisType === "pan-cancer" ? "site" : "gene_symbol"}
                          yKey={[
                            ...(selectedGroups.includes("normal") ? ["mean_normal"] : []),
                            ...(selectedGroups.includes("tumor") ? ["mean_tumor"] : []),
                          ]}
                          errorKey={[
                            ...(selectedGroups.includes("normal") ? [`${metric}_normal`] : []),
                            ...(selectedGroups.includes("tumor") ? [`${metric}_tumor`] : []),
                          ]}
                          title={`Mean ± ${displayMetric}`}
                          xLabel={analysisType === "pan-cancer" ? "Cancer Sites" : "Genes"}
                          yLabel={`Mean ± ${displayMetric} (${normalizationMethod})`}
                          colors={selectedGroups.map((group) =>
                            group === "tumor" ? "#ef4444c3" : "#10b981bd"
                          )}
                          orientation="v"
                          legendLabels={["Normal", "Tumor"]}
                        />
                      ) : (
                        <PlotlyBarChart
                          key={`${metric}-${currentDataFormat}`}
                          data={
                            analysisType === "pan-cancer"
                              ? metricData
                              : groupedData[metric][Object.keys(groupedData[metric])[0]] || []
                          }
                          xKey={analysisType === "pan-cancer" ? "site" : "gene_symbol"}
                          yKey={[
                            ...(selectedGroups.includes("normal") ? [`${metric}_normal`] : []),
                            ...(selectedGroups.includes("tumor") ? [`${metric}_tumor`] : []),
                          ]}
                          title={`${displayMetric}`}
                          xLabel={analysisType === "pan-cancer" ? "Cancer Sites" : "Genes"}
                          yLabel={`${displayMetric} (${normalizationMethod})`}
                          colors={selectedGroups.map((group) =>
                            group === "tumor" ? "#ef4444c3" : "#10b981bd"
                          )}
                          orientation="v"
                          legendLabels={["Normal", "Tumor"]}
                        />
                      )}
                      </div>
                    )}
                  </CollapsibleCard>
                </div>
              )
            );
          })}
        </>
      )}
    </div>
  );
};

export default StatisticalMetrics;