import React, { useEffect, useRef } from "react";
import Plot from "react-plotly.js";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PlotlyAreaChartProps {
  data: any[];
  xKey: string;
  yKeys: string[];
  title: string;
  xLabel: string;
  yLabel: string;
  colors?: string[];
}

export const PlotlyAreaChart: React.FC<PlotlyAreaChartProps> = ({
  data,
  xKey,
  yKeys,
  title,
  xLabel,
  yLabel,
  colors = ["#ef4444", "#10b981"],
}) => {
  const plotRef = useRef<any>(null);
  const renderCount = useRef(0);

  useEffect(() => {
    console.log(`PlotlyAreaChart (${title}) rendered ${++renderCount.current} times`);
  }, [title]);

  if (!data || data.length === 0) {
    return (
      <div className="text-center text-red-600">
        No data available for {title}.
      </div>
    );
  }

  const plotData = yKeys.map((yKey, index) => ({
    x: data.map((d) => d[xKey] || "Unknown"),
    y: data.map((d) => (typeof d[yKey] === "number" && !isNaN(d[yKey]) ? d[yKey] : 0)),
    type: "scatter",
    mode: "lines",
    fill: "tozeroy",
    name: yKey.includes("tumor") ? "Tumor" : "Normal",
    line: { color: colors[index % colors.length] },
    hovertemplate: `${yKey}: %{y:.2f}<extra>${yKey.includes("tumor") ? "Tumor" : "Normal"}</extra>`,
  }));

  const layout = {
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
    // legend: {
    //   x: 1,
    //   xanchor: "right",
    //   y: 1,
    //   yanchor: "top",
    //   font: { size: 10 },
    // },
    legend: {
        orientation: "h",      // horizontal legend
        x: 0.5,                // center it horizontally
        xanchor: "center",     
        y: 1.15,               // above the plot area
        yanchor: "bottom",
        font: { size: 10 },
        },
    margin: { t: 50, b: 100, l: 50, r: 50 },
    width: 600,
    height: 400,
  };

  return (
    <div className="relative">
      <div ref={plotRef} className="chart-container">
        <Plot
          data={plotData}
          layout={layout}
          config={{ responsive: true }}
        />
      </div>
      <Button
        size="sm"
        variant="outline"
        className="absolute top-2 right-2 h-6 px-2 text-xs bg-blue-600 text-white hover:bg-blue-700"
        onClick={() => {
          if (plotRef.current) {
            import("plotly.js-dist-min").then((Plotly) => {
              Plotly.downloadImage(plotRef.current, {
                format: "png",
                filename: `${title.replace(/\s+/g, "_").toLowerCase()}_${Date.now()}`,
                width: 800,
                height: 600,
              });
            });
          }
        }}
      >
        <Download className="h-3 w-3" />
      </Button>
    </div>
  );
};