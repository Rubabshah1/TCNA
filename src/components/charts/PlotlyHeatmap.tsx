// import React, { useEffect, useRef } from "react";
// import Plotly from 'plotly.js-dist-min';
// import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
// import { Button } from "@/components/ui/button";
// import { Network, Download, ChevronUp, ChevronDown } from "lucide-react";

// interface PlotlyHeatmapProps {
//   title: string;
//   data: any[];
//   xValues: string[];
//   yValues: string[];
//   zValues: number[][];
//   zLabel: string;
//   chartKey: string;
//   xLabel?: string;
//   yLabel?: string;
//   colorscale?: string;
//   annotation?: string;
//   height?: number;
//   className?: string;
// }

// export const PlotlyHeatmap: React.FC<PlotlyHeatmapProps> = ({
//   title,
//   data,
//   xValues,
//   yValues,
//   zValues,
//   zLabel,
//   chartKey,
//   xLabel = "X Axis",
//   yLabel = "Y Axis",
//   colorscale = "Viridis",
//   annotation,
//   height = 400,
//   className = "",
// }) => {
//   const plotRef = useRef<HTMLDivElement>(null);
//   const [isOpen, setIsOpen] = React.useState(true);

//   useEffect(() => {
//     if (plotRef.current && data.length > 0) {
//       const plotData: Plotly.Data[] = [{
//         x: xValues,
//         y: yValues,
//         z: zValues,
//         type: 'heatmap',
//         colorscale,
//         showscale: true,
//         colorbar: {
//           title: zLabel,
//         },
//       }];

//       const layout: Partial<Plotly.Layout> = {
//         title: {
//           text: title,
//           x: 0.5,
//           xanchor: 'center',
//           font: { size: 16, color: '#1e3a8a' },
//         },
//         xaxis: {
//           title: xLabel,
//           titlefont: { size: 12 },
//           tickfont: { size: 10 },
//         },
//         yaxis: {
//           title: yLabel,
//           titlefont: { size: 12 },
//           tickfont: { size: 10 },
//           automargin: true,
//         },
//         annotations: annotation ? [{
//           text: annotation,
//           xref: 'paper',
//           yref: 'paper',
//           x: 0.5,
//           y: -0.25,
//           showarrow: false,
//           font: {
//             size: 12,
//             color: 'black',
//             weight: 'bold'
//           },
//         }] : [],
//         margin: { t: 60, b: annotation ? 80 : 60, l: 100, r: 20 },
//         height,
//       };

//       Plotly.newPlot(plotRef.current, plotData, layout, { responsive: true });
//     }
//   }, [data, xValues, yValues, zValues, zLabel, title, xLabel, yLabel, colorscale, annotation, height]);

//   return (
//     <Card className={`border-0 shadow-lg ${className}`}>
//       <CardHeader className="flex flex-row items-center justify-between pb-2">
//         <CardTitle className="text-blue-800">{title}</CardTitle>
//         <Button
//           variant="ghost"
//           size="sm"
//           onClick={() => setIsOpen(!isOpen)}
//           className="text-blue-600 hover:text-blue-700"
//         >
//           {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
//         </Button>
//       </CardHeader>
//       {isOpen && (
//         <CardContent>
//           <div className="flex items-center justify-between mb-2">
//             <div className="flex items-center space-x-2">
//               <Network className="h-4 w-4 text-blue-600" />
//               <span>{title}</span>
//             </div>
//             <Button
//               size="sm"
//               variant="outline"
//               onClick={() => {
//                 if (plotRef.current) {
//                   Plotly.downloadImage(plotRef.current, {
//                     filename: `${title.replace(/\s+/g, '_').toLowerCase()}_${Date.now()}`,
//                     format: 'png',
//                     width: 800,
//                     height,
//                   });
//                 }
//               }}
//               className="h-6 px-2 text-xs"
//             >
//               <Download className="h-3 w-3" />
//             </Button>
//           </div>
//           <div ref={plotRef} className="chart-container" />
//         </CardContent>
//       )}
//     </Card>
//   );
// };
import React, { useEffect, useRef } from "react";
import Plotly from "plotly.js-dist-min";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

interface PlotlyHeatmapProps {
  title: string;
  data: any[];
  xValues: string[];
  yValues: string[];
  zValues: number[][];
  zLabel: string;
  chartKey: string;
  xLabel?: string;
  yLabel?: string;
  colorscale?: string;
  annotation?: string;
  height?: number;
  className?: string;
}

export const PlotlyHeatmap: React.FC<PlotlyHeatmapProps> = ({
  title,
  data,
  xValues,
  yValues,
  zValues,
  zLabel,
  chartKey,
  xLabel = "X Axis",
  yLabel = "Y Axis",
  colorscale = "Viridis",
  annotation,
  height = 400,
  className = "",
}) => {
  const plotRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (plotRef.current && data.length > 0) {
      const plotData: Partial<Plotly.Data>[] = [
        {
          x: xValues,
          y: yValues,
          z: zValues,
          type: "heatmap",
          colorscale,
          showscale: true,
          colorbar: {
            title: zLabel,
          },
        },
      ];

      const layout: Partial<Plotly.Layout> = {
        title: {
          text: title,
          x: 0.5,
          xanchor: "center",
          font: { size: 16, color: "#1e3a8a" },
        },
        xaxis: {
          title: xLabel,
          titlefont: { size: 12 },
          tickfont: { size: 10 },
        },
        yaxis: {
          title: yLabel,
          titlefont: { size: 12 },
          tickfont: { size: 10 },
          automargin: true,
        },
        annotations: annotation
          ? [
              {
                text: annotation,
                xref: "paper",
                yref: "paper",
                x: 0.5,
                y: -0.25,
                showarrow: false,
                font: {
                  size: 12,
                  color: "black",
                },
              },
            ]
          : [],
        margin: { t: 60, b: annotation ? 80 : 60, l: 100, r: 20 },
        height,
      };

      Plotly.newPlot(plotRef.current, plotData, layout, { responsive: true });

      // Handle resize when the plot becomes visible
      const handleResize = () => {
        if (plotRef.current) {
          Plotly.Plots.resize(plotRef.current);
        }
      };

      window.addEventListener("resize", handleResize);
      handleResize(); // Initial resize

      return () => {
        window.removeEventListener("resize", handleResize);
      };
    }
  }, [data, xValues, yValues, zValues, zLabel, title, xLabel, yLabel, colorscale, annotation, height]);

  return (
    <div className={className}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-2">
          <span>{title}</span>
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={() => {
            if (plotRef.current) {
              Plotly.downloadImage(plotRef.current, {
                filename: `${title.replace(/\s+/g, "_").toLowerCase()}_${Date.now()}`,
                format: "png",
                width: 800,
                height,
              });
            }
          }}
          className="h-6 px-2 text-xs"
        >
          <Download className="h-3 w-3"  /> Download Image
        </Button>
      </div>
      <div ref={plotRef} className="chart-container" />
    </div>
  );
};