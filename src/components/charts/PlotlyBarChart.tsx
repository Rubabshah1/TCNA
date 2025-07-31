// // import React, { useEffect, useRef } from "react";
// // import Plotly from 'plotly.js-dist-min';
// // import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
// // import { Button } from "@/components/ui/button";
// // import { Network, Download, ChevronUp, ChevronDown } from "lucide-react";

// // interface PlotlyBarChartProps {
// //   data: any[];
// //   xKey: string;
// //   yKey: string;
// //   title: string;
// //   xLabel?: string;
// //   yLabel?: string;
// //   color?: string;
// //   height?: number;
// //   className?: string;
// // }

// // export const PlotlyBarChart: React.FC<PlotlyBarChartProps> = ({
// //   data,
// //   xKey,
// //   yKey,
// //   title,
// //   xLabel = "X Axis",
// //   yLabel = "Y Axis",
// //   color = "#3b82f6",
// //   height = 300,
// //   className = "",
// // }) => {
// //   const plotRef = useRef<HTMLDivElement>(null);
// //   const [isOpen, setIsOpen] = React.useState(true);
// //   const renderCount = useRef(0);

// //   useEffect(() => {
// //     console.log(`PlotlyBarChart ${yKey} rendered ${++renderCount.current} times`);
    
// //     if (plotRef.current && data.length > 0) {
// //       const xValues = data.map(item => item[xKey]);
// //       const yValues = data.map(item => item[yKey]);
      
// //       const plotData: Plotly.Data[] = [{
// //         x: xValues,
// //         y: yValues,
// //         type: 'bar',
// //         marker: {
// //           color: data.map(item => item.color || color),
// //         },
// //         text: yValues.map((v: number) => v.toFixed(2)),
// //         textposition: 'auto',
// //       }];

// //       const layout: Partial<Plotly.Layout> = {
// //         title: {
// //           text: title,
// //           x: 0.5,
// //           xanchor: 'center',
// //           font: { size: 16, color: '#1e3a8a' },
// //         },
// //         xaxis: {
// //           title: xLabel,
// //           titlefont: { size: 12 },
// //           tickfont: { size: 10 },
// //           tickangle: -20,
// //         },
// //         yaxis: {
// //           title: yLabel,
// //           titlefont: { size: 12 },
// //           tickfont: { size: 10 },
// //         },
// //         margin: { t: 60, b: 100, l: 60, r: 20 },
// //         height,
// //         showlegend: false,
// //       };

// //       Plotly.newPlot(plotRef.current, plotData, layout, { responsive: true });
// //     }
// //   }, [data, xKey, yKey, title, xLabel, yLabel, color, height]);

// //   return (
// //     <Card className={`border-0 shadow-lg ${className}`}>
// //       <CardHeader className="flex flex-row items-center justify-between pb-2">
// //         <CardTitle className="text-blue-800">{title}</CardTitle>
// //         <Button
// //           variant="ghost"
// //           size="sm"
// //           onClick={() => setIsOpen(!isOpen)}
// //           className="text-blue-600 hover:text-blue-700"
// //         >
// //           {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
// //         </Button>
// //       </CardHeader>
// //       {isOpen && (
// //         <CardContent>
// //           <div className="flex items-center justify-between mb-2">
// //             <div className="flex items-center space-x-2">
// //               <Network className="h-4 w-4" style={{ color }} />
// //               <span>{title}</span>
// //             </div>
// //             <Button
// //               size="sm"
// //               variant="outline"
// //               onClick={() => {
// //                 if (plotRef.current) {
// //                   Plotly.downloadImage(plotRef.current, {
// //                     filename: `${title.replace(/\s+/g, '_').toLowerCase()}_${Date.now()}`,
// //                     format: 'png',
// //                     width: 800,
// //                     height,
// //                   });
// //                 }
// //               }}
// //               className="h-6 px-2 text-xs"
// //             >
// //               <Download className="h-3 w-3" />
// //             </Button>
// //           </div>
// //           <div ref={plotRef} className="chart-container" />
// //         </CardContent>
// //       )}
// //     </Card>
// //   );
// // };
// import React, { useEffect, useRef } from "react";
// import Plotly from "plotly.js-dist-min";
// import { Button } from "@/components/ui/button";
// import { Download } from "lucide-react";

// interface PlotlyBarChartProps {
//   data: any[];
//   xKey: string;
//   yKey: string;
//   title: string;
//   xLabel?: string;
//   yLabel?: string;
//   color?: string;
//   height?: number;
//   className?: string;
// }

// export const PlotlyBarChart: React.FC<PlotlyBarChartProps> = ({
//   data,
//   xKey,
//   yKey,
//   title,
//   xLabel = "X Axis",
//   yLabel = "Y Axis",
//   color = "#3b82f6",
//   height = 300,
//   className = "",
// }) => {
//   const plotRef = useRef<HTMLDivElement>(null);
//   const renderCount = useRef(0);

//   useEffect(() => {
//     console.log(`PlotlyBarChart ${yKey} rendered ${++renderCount.current} times`);

//     if (plotRef.current && data.length > 0) {
//       const xValues = data.map((item) => item[xKey]);
//       const yValues = data.map((item) => item[yKey]);

//       const plotData: Partial<Plotly.Data>[] = [
//         {
//           x: xValues,
//           y: yValues,
//           type: "bar",
//           marker: {
//             color: data.map((item) => item.color || color),
//           },
//           text: yValues.map((v: number) => v.toFixed(2)),
//           textposition: "auto",
//         },
//       ];

//       const layout: Partial<Plotly.Layout> = {
//         // title: {
//         //   text: title,
//         //   x: 0.5,
//         //   xanchor: "center",
//         //   font: { size: 16, color: "#1e3a8a" },
//         // },
//         xaxis: {
//           title: xLabel,
//           titlefont: { size: 12 },
//           tickfont: { size: 10 },
//           tickangle: -20,
//         },
//         yaxis: {
//           title: yLabel,
//           titlefont: { size: 12 },
//           tickfont: { size: 10 },
//         },
//         margin: { t: 60, b: 100, l: 60, r: 20 },
//         height,
//         showlegend: false,
//       };

//       Plotly.newPlot(plotRef.current, plotData, layout, { responsive: true });

//       // Handle resize when the plot becomes visible
//       const handleResize = () => {
//         if (plotRef.current) {
//           Plotly.Plots.resize(plotRef.current);
//         }
//       };

//       window.addEventListener("resize", handleResize);
//       handleResize(); // Initial resize

//       return () => {
//         window.removeEventListener("resize", handleResize);
//       };
//     }
//   }, [data, xKey, yKey, title, xLabel, yLabel, color, height]);

//   return (
//     <div className={className}>
//       <div className="flex items-center justify-between mb-2">
//         <div className="flex items-center space-x-2">
//           {/* <span>{title}</span> */}
//         </div>
//         <Button
//           size="sm"
//           variant="outline"
//           onClick={() => {
//             if (plotRef.current) {
//               Plotly.downloadImage(plotRef.current, {
//                 filename: `${title.replace(/\s+/g, "_").toLowerCase()}_${Date.now()}`,
//                 format: "png",
//                 width: 800,
//                 height,
//               });
//             }
//           }}
//           className="h-6 px-2 text-xs"
//         >
//           <Download className="h-3 w-3" /> Download Image
//         </Button>
//       </div>
//       <div ref={plotRef} className="chart-container" />
//     </div>
//   );
// };
import React, { useEffect, useRef } from "react";
import Plot from "react-plotly.js";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, Box } from "lucide-react";

interface PlotlyBarChartProps {
  data: any[];
  title: string;
  xKey: string;
  yKey: string | string[];
  xLabel?: string;
  yLabel?: string;
  colors?: string | string[];
}

export const PlotlyBarChart: React.FC<PlotlyBarChartProps> = ({
  data,
  title,
  xKey,
  yKey,
  xLabel = "X Axis",
  yLabel = "Y Axis",
  colors = "#3b82f6",
}) => {
  const plotRef = useRef<any>(null);

  const plotData = Array.isArray(yKey)
    ? yKey.map((key, index) => ({
        x: data.map((d) => d[xKey]),
        y: data.map((d) => d[key] || 0),
        type: "bar",
        name: key.includes("tumor") ? "Tumor" : key.includes("normal") ? "Normal" : key,
        marker: {
          color: Array.isArray(colors) ? colors[index % colors.length] : colors,
        },
      }))
    : [
        {
          x: data.map((d) => d[xKey]),
          y: data.map((d) => d[yKey] || 0),
          type: "bar",
          name: yKey,
          marker: { color: colors },
        },
      ];

  useEffect(() => {
    if (plotRef.current) {
      window.dispatchEvent(new Event("resize"));
    }
  }, [plotData]);

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between text-sm">
          <div className="flex items-center space-x-2">
            <Box className="h-4 w-4" />
            <span>{title}</span>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              import("plotly.js-dist-min").then((Plotly) => {
                Plotly.downloadImage(plotRef.current, {
                  format: "png",
                  filename: `${title.replace(/\s+/g, "_").toLowerCase()}_${Date.now()}`,
                  width: 800,
                  height: 400,
                });
              });
            }}
            className="h-6 px-2 text-xs"
          >
            <Download className="h-3 w-3" /> Download Image
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="chart-container">
          <Plot
            ref={plotRef}
            data={plotData}
            layout={{
              title: { text: title, font: { size: 14 }, x: 0.5, xanchor: "center" },
              xaxis: {
                title: { text: xLabel, font: { size: 12, weight: "bold" } },
                tickangle: 45,
                tickfont: { size: 10 },
              },
              yaxis: {
                title: { text: yLabel, font: { size: 12, weight: "bold" } },
                tickfont: { size: 10 },
              },
              showlegend: true,
              legend: { x: 1, xanchor: "right", y: 1, yanchor: "top", font: { size: 10 } },
              margin: { t: 50, b: 100, l: 50, r: 50 },
              barmode: "group",
              width: 600,
              height: 400,
            }}
            config={{ responsive: true }}
          />
        </div>
      </CardContent>
    </Card>
  );
};