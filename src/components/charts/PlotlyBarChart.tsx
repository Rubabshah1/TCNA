// // import React, { useEffect, useRef } from "react";
// // import Plot from "react-plotly.js";
// // import { Card, CardHeader, CardContent } from "@/components/ui/card";
// // import { Button } from "@/components/ui/button";
// // import { Download } from "lucide-react";

// // interface PlotlyBarChartProps {
// //   data: any[];
// //   title: string;
// //   xKey: string | string[];
// //   yKey: string | string[];
// //   xLabel?: string;
// //   yLabel?: string;
// //   colors?: string | string[];
// //   orientation?: "h" | "v"; // Add orientation prop with "h" (horizontal) or "v" (vertical) options
// //   legendLabels?: string | string[];
// // }

// // export const PlotlyBarChart: React.FC<PlotlyBarChartProps> = ({
// //   data,
// //   title,
// //   xKey,
// //   yKey,
// //   xLabel = "X Axis",
// //   yLabel = "Y Axis",
// //   colors = "#3b82f6",
// //   orientation = "h", // Default to horizontal,
// //   legendLabels
// // }) => {
// //   const plotRef = useRef<any>(null);

// //   const plotData = Array.isArray(yKey)
// //     ? yKey.map((key, index) => ({
// //         x: Array.isArray(xKey)
// //           ? xKey.map((k) => data.map((d) => d[k] || 0)).flat()
// //           : data.map((d) => d[xKey] || 0),
// //         y: data.map((d) => d[key] || 0),
// //         type: "bar",
// //         // name: key.includes("Tumor") ? "Tumor" : key.includes("Normal") ? "Normal" : key,
// //         name: legendLabels?.[index] || d.name || item.x?.[0] || "Data",
// //         marker: {
// //           color: Array.isArray(colors) ? colors[index % colors.length] : colors,
// //         },
// //         orientation, // Use the orientation prop
// //       }))
// //     : Array.isArray(xKey)
// //     ? xKey.map((key, index) => ({
// //         x: data.map((d) => d[key] || 0),
// //         y: data.map((d) => d[yKey] || 0),
// //         type: "bar",
// //         name: key.includes("tumor") ? "Tumor" : key.includes("normal") ? "Normal" : key,
// //         marker: {
// //           color: Array.isArray(colors) ? colors[index % colors.length] : colors,
// //         },
// //         orientation, // Use the orientation prop
// //       }))
// //     : [
// //         {
// //           x: Array.isArray(xKey)
// //             ? xKey.map((k) => data.map((d) => d[k] || 0)).flat()
// //             : data.map((d) => d[xKey] || 0),
// //           y: data.map((d) => d[yKey] || 0),
// //           type: "bar",
// //           name: yKey,
// //           marker: { color: colors },
// //           orientation, // Use the orientation prop
// //         },
// //       ];

// //   useEffect(() => {
// //     if (plotRef.current) {
// //       window.dispatchEvent(new Event("resize"));
// //     }
// //   }, [plotData]);

// //   return (
// //     <Card className="border-0 shadow-lg">
// //       <CardHeader className="pb-2">
// //         <div className="flex justify-end">
// //           <Button
// //             size="sm"
// //             variant="outline"
// //             onClick={() => {
// //               import("plotly.js-dist-min").then((Plotly) => {
// //                 const plotEl = plotRef.current;

// //                 if (!plotEl || !plotEl.el) {
// //                   console.error("Plot not ready yet");
// //                   return;
// //                 }

// //                 Plotly.toImage(plotEl.el, {
// //                   format: "png",
// //                   width: 800,
// //                   height: 400,
// //                 }).then((url: string) => {
// //                   const a = document.createElement("a");
// //                   a.href = url;
// //                   a.download = `${title.replace(/\s+/g, "_").toLowerCase()}_${Date.now()}.png`;
// //                   a.click();
// //                 });
// //               });
// //             }}
// //             className="h-6 px-2 text-xs"
// //           >
// //             <Download className="h-3 w-3" /> Download Image
// //           </Button>
// //         </div>
// //       </CardHeader>
// //       <CardContent className="pt-0">
// //         <div className="chart-container">
// //           <Plot
// //             ref={plotRef}
// //             data={plotData}
// //             layout={{
// //               title: { text: title, font: { size: 14, weight: "bold" }, x: 0.5, xanchor: "center" },
// //               xaxis: {
// //                 title: { text: xLabel, font: { size: 12, weight: "bold" }, pad: 20 },
// //                 // tickangle: -30,
// //                 tickfont: { size: 10 },
// //                 automargin: true,
// //               },
// //               yaxis: {
// //                 title: { text: yLabel, font: { size: 12, weight: "bold" }, pad: 100 },
// //                 // tickangle: -30,
// //                 tickfont: { size: 10 },
// //                 automargin: true,
// //               },
// //               showlegend: true,
// //               legend: {
// //                 orientation: "h",
// //                 x: 0.10,
// //                 xanchor: "center",
// //                 y: 1.08,
// //                 yanchor: "bottom",
// //                 font: { size: 12 },
// //               },
// //               margin: { t: 50, b: 30, l: 30, r: 50 },
// //               barmode: "group",
// //               width: 800,
// //               height: 400,
// //             }}
// //             config={{ responsive: true }}
// //           />
// //         </div>
// //       </CardContent>
// //     </Card>
// //   );
// // };
// import React, { useEffect, useRef } from "react";
// import Plot from "react-plotly.js";
// import { Card, CardHeader, CardContent } from "@/components/ui/card";
// import { Button } from "@/components/ui/button";
// import { Download } from "lucide-react";

// interface PlotlyBarChartProps {
//   data: any[];
//   title: string;
//   xKey: string | string[];
//   yKey: string | string[];
//   xLabel?: string;
//   yLabel?: string;
//   colors?: string | string[];
//   orientation?: "h" | "v";
//   legendLabels?: string | string[];
// }

// export const PlotlyBarChart: React.FC<PlotlyBarChartProps> = ({
//   data,
//   title,
//   xKey,
//   yKey,
//   xLabel = "X Axis",
//   yLabel = "Y Axis",
//   colors = "#3b82f6",
//   orientation = "h",
//   legendLabels,
// }) => {
//   const plotRef = useRef<any>(null);

//   const plotData = Array.isArray(yKey)
//     ? yKey.map((key, index) => ({
//         x: Array.isArray(xKey)
//           ? xKey.map((k) => data.map((d) => d[k] || 0)).flat()
//           : data.map((d) => d[xKey] || 0),
//         y: data.map((d) => d[key] || 0),
//         type: "bar",
//         name: Array.isArray(legendLabels) ? legendLabels[index] || key : legendLabels || key,
//         marker: {
//           color: Array.isArray(colors) ? colors[index % colors.length] : colors,
//         },
//         orientation,
//       }))
//     : Array.isArray(xKey)
//     ? xKey.map((key, index) => ({
//         x: data.map((d) => d[key] || 0),
//         y: data.map((d) => d[yKey] || 0),
//         type: "bar",
//         name: Array.isArray(legendLabels) ? legendLabels[index] || key : legendLabels || key,
//         marker: {
//           color: Array.isArray(colors) ? colors[index % colors.length] : colors,
//         },
//         orientation,
//       }))
//     : [
//         {
//           x: data.map((d) => d[xKey] || 0),
//           y: data.map((d) => d[yKey] || 0),
//           type: "bar",
//           name: Array.isArray(legendLabels) ? legendLabels[0] || yKey : legendLabels || yKey,
//           marker: { color: Array.isArray(colors) ? colors[0] : colors },
//           orientation,
//         },
//       ];

//   useEffect(() => {
//     if (plotRef.current) {
//       window.dispatchEvent(new Event("resize"));
//     }
//   }, [plotData]);

//   return (
//     <Card className="border-0 shadow-lg">
//       <CardHeader className="pb-2">
//         <div className="flex justify-end">
//           <Button
//             size="sm"
//             variant="outline"
//             onClick={() => {
//               import("plotly.js-dist-min").then((Plotly) => {
//                 const plotEl = plotRef.current;

//                 if (!plotEl || !plotEl.el) {
//                   console.error("Plot not ready yet");
//                   return;
//                 }

//                 Plotly.toImage(plotEl.el, {
//                   format: "png",
//                   width: 800,
//                   height: 400,
//                 }).then((url: string) => {
//                   const a = document.createElement("a");
//                   a.href = url;
//                   a.download = `${title.replace(/\s+/g, "_").toLowerCase()}_${Date.now()}.png`;
//                   a.click();
//                 });
//               });
//             }}
//             className="h-6 px-2 text-xs"
//           >
//             <Download className="h-3 w-3" /> Download Image
//           </Button>
//         </div>
//       </CardHeader>
//       <CardContent className="pt-0">
//         <div className="chart-container">
//           <Plot
//             ref={plotRef}
//             data={plotData}
//             layout={{
//               title: { text: title, font: { size: 14, weight: "bold" }, x: 0.5, xanchor: "center" },
//               xaxis: {
//                 title: { text: xLabel, font: { size: 12, weight: "bold" }, pad: 20 },
//                 tickfont: { size: 10 },
//                 automargin: true,
//               },
//               yaxis: {
//                 title: { text: yLabel, font: { size: 12, weight: "bold" }, pad: 100 },
//                 tickfont: { size: 10 },
//                 automargin: true,
//               },
//               showlegend: true,
//               legend: {
//                 orientation: "h",
//                 x: 0.10,
//                 xanchor: "center",
//                 y: 1.08,
//                 yanchor: "bottom",
//                 font: { size: 12 },
//               },
//               margin: { t: 50, b: 30, l: 30, r: 50 },
//               barmode: "group",
//               width: 800,
//               height: 400,
//             }}
//             config={{ responsive: true }}
//           />
//         </div>
//       </CardContent>
//     </Card>
//   );
// };
import React, { useEffect, useRef } from "react";
import Plot from "react-plotly.js";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

interface PlotlyBarChartProps {
  data: any[];
  title: string;
  xKey: string | string[];
  yKey?: string | string[];
  xLabel?: string;
  yLabel?: string;
  colors?: string | string[];
  orientation?: "h" | "v";
  legendLabels?: string | string[];
  showLegend?: boolean;  // <-- new prop
}

export const PlotlyBarChart: React.FC<PlotlyBarChartProps> = ({
  data,
  title,
  xKey,
  yKey,
  xLabel = "X Axis",
  yLabel = "Y Axis",
  colors = "#3b82f6",
  orientation = "h",
  legendLabels,
  showLegend = true
}) => {
  const plotRef = useRef<any>(null);

  const plotData = Array.isArray(yKey)
    ? yKey.map((key, index) => ({
        x: Array.isArray(xKey)
          ? xKey.map((k) => data.map((d) => d[k] || 0)).flat()
          : data.map((d) => d[xKey] || 0),
        y: data.map((d) => d[key] || 0),
        type: "bar",
        name: Array.isArray(legendLabels) ? legendLabels[index] || key : legendLabels || key,
        marker: {
          color: Array.isArray(colors) ? colors[index % colors.length] : colors,
        },
        orientation,
      }))
    : Array.isArray(xKey)
    ? xKey.map((key, index) => ({
        x: data.map((d) => d[key] || 0),
        y: data.map((d) => d[yKey] || 0),
        type: "bar",
        name: Array.isArray(legendLabels) ? legendLabels[index] || key : legendLabels || key,
        marker: {
          color: Array.isArray(colors) ? colors[index % colors.length] : colors,
        },
        orientation,
      }))
    : data.map((d, index) => ({
        x: [d[xKey] || 0],
        y: [d[yKey] || 0],
        type: "bar",
        name: Array.isArray(legendLabels) ? legendLabels[index] || d[xKey] || yKey : legendLabels || yKey,
        marker: {
          color: Array.isArray(colors) ? colors[index % colors.length] : colors,
        },
        orientation,
      }));

  useEffect(() => {
    if (plotRef.current) {
      window.dispatchEvent(new Event("resize"));
    }
  }, [plotData]);

  return (
    <Card className="border-0">
      <CardHeader className="pb-2">
        <div className="flex justify-end">
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              import("plotly.js-dist-min").then((Plotly) => {
                const plotEl = plotRef.current;

                if (!plotEl || !plotEl.el) {
                  console.error("Plot not ready yet");
                  return;
                }

                Plotly.toImage(plotEl.el, {
                  format: "png",
                  width: 800,
                  height: 400,
                }).then((url: string) => {
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = `${title.replace(/\s+/g, "_").toLowerCase()}_${Date.now()}.png`;
                  a.click();
                });
              });
            }}
            className="h-6 px-2 text-xs"
          >
            <Download className="h-3 w-3" /> Download Image
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="chart-container">
          <Plot
            ref={plotRef}
            data={plotData}
            layout={{
              title: { text: title, font: { size: 14, weight: "bold" }, x: 0.6, xanchor: "center" },
              xaxis: {
                title: { text: xLabel, font: { size: 12, weight: "bold" }, pad: 20 },
                tickangle: -45,
                tickfont: { size: 10 },
                automargin: true,
              },
              yaxis: {
                title: { text: yLabel, font: { size: 12, weight: "bold" }, pad: 100 },
                tickfont: { size: 10 },
                automargin: true,
              },
              showlegend: showLegend,
              legend: {
                orientation: "v",
                x: 0.10,
                xanchor: "center",
                y: 1.08,
                yanchor: "bottom",
                font: { size: 12 },
              },
              margin: { t: 50, b: 30, l: 30, r: 50 },
              barmode: "group",
              width: 800,
              height: 400,
            }}
            config={{ responsive: true }}
          />
        </div>
      </CardContent>
    </Card>
  );
};