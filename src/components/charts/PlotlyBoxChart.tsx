import React, { useEffect, useRef } from "react";
import Plot from "react-plotly.js";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, Box } from "lucide-react";

interface PlotlyBoxChartProps {
  data: any[];
  title: string;
  xKey: string;
  selectedGroups: string[];
  xLabel?: string;
  yLabel?: string;
  color?: string;
}

export const PlotlyBoxChart: React.FC<PlotlyBoxChartProps> = ({
  data,
  title,
  xKey,
  selectedGroups,
  xLabel = "Genes",
  yLabel = "Expression Value",
  color = "#3b82f6",
}) => {
  const plotRef = useRef<any>(null);

  const plotData = data
    .filter((gene: any) => selectedGroups.length > 0 && gene[xKey])
    .reduce((acc: any[], gene: any) => {
      const traces: any[] = [];

      if (selectedGroups.includes("tumor") && typeof gene.std_tumor === "number" && !isNaN(gene.std_tumor)) {
        const mean = gene.mean_tumor || 0;
        const std = gene.std_tumor;
        traces.push({
          x: [gene[xKey]],
          type: "box",
          name: `Tumor (${gene[xKey]})`,
          boxpoints: false,
          boxmean: true,
          marker: { color: "#ef4444", size: 8 },
          line: { width: 1 },
          median: [mean],
          q1: [mean - std],
          q3: [mean + std],
          lowerfence: [Math.max(0, mean - 1.5 * std)],
          upperfence: [mean + 1.5 * std],
        });
      }

      if (selectedGroups.includes("normal") && typeof gene.std_normal === "number" && !isNaN(gene.std_normal)) {
        const mean = gene.mean_normal || 0;
        const std = gene.std_normal;
        traces.push({
          x: [gene[xKey]],
          type: "box",
          name: `Normal (${gene[xKey]})`,
          boxpoints: false,
          boxmean: true,
          marker: { color: "#10b981", size: 8 },
          line: { width: 1 },
          median: [mean],
          q1: [mean - std],
          q3: [mean + std],
          lowerfence: [Math.max(0, mean - 1.5 * std)],
          upperfence: [mean + 1.5 * std],
        });
      }

      return [...acc, ...traces];
    }, []);

  const yValues = plotData.flatMap((trace: any) => [
    trace.lowerfence[0] || 0,
    trace.upperfence[0] || 0,
  ]);
  const yMin = yValues.length ? Math.min(...yValues) * 0.9 : 0;
  const yMax = yValues.length ? Math.max(...yValues) * 1.1 : 1;

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
          {plotData.length === 0 ? (
            <div className="text-center text-red-600 min-h-[400px] flex items-center justify-center">
              No valid data available for the {title} plot. Please check the selected genes and groups.
            </div>
          ) : (
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
                  range: [yMin, yMax],
                },
                showlegend: true,
                legend: { x: 1, xanchor: "right", y: 1, yanchor: "top", font: { size: 10 } },
                margin: { t: 50, b: 100, l: 50, r: 50 },
                width: 600,
                height: 400,
              }}
              config={{ responsive: true }}
            />
          )}
        </div>
      </CardContent>
    </Card>
  );
};