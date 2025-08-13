
import React, { useEffect, useRef } from "react";
import Plot from "react-plotly.js";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

interface PlotlyBoxChartProps {
  data: any[];
  title: string;
  xKey: string;
  selectedGroups: string | string[];
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
  const tumorPlotRef = useRef<any>(null);
  const normalPlotRef = useRef<any>(null);

  const tumorData = [];
  const normalData = [];

  data
    .filter((gene: any) => selectedGroups.length > 0 && gene[xKey])
    .forEach((gene: any) => {
      if (selectedGroups.includes("tumor") && typeof gene.std_tumor === "number" && !isNaN(gene.std_tumor)) {
        const mean = gene.mean_tumor || 0;
        const std = gene.std_tumor;
        tumorData.push({
          x: gene[xKey],
          median: mean,
          q1: mean - std,
          q3: mean + std,
          lowerfence: Math.max(0, mean - 1.5 * std),
          upperfence: mean + 1.5 * std,
        });
      }
      if (selectedGroups.includes("normal") && typeof gene.std_normal === "number" && !isNaN(gene.std_normal)) {
        const mean = gene.mean_normal || 0;
        const std = gene.std_normal;
        normalData.push({
          x: gene[xKey],
          median: mean,
          q1: mean - std,
          q3: mean + std,
          lowerfence: Math.max(0, mean - 1.5 * std),
          upperfence: mean + 1.5 * std,
        });
      }
    });

  const tumorPlotData = tumorData.length > 0 ? [{
    x: tumorData.map((d) => d.x),
    type: "box",
    name: "Tumor",
    boxpoints: false,
    boxmean: true,
    marker: { color: "#ef4444", size: 8 },
    line: { width: 1 },
    median: tumorData.map((d) => d.median),
    q1: tumorData.map((d) => d.q1),
    q3: tumorData.map((d) => d.q3),
    lowerfence: tumorData.map((d) => d.lowerfence),
    upperfence: tumorData.map((d) => d.upperfence),
  }] : [];

  const normalPlotData = normalData.length > 0 ? [{
    x: normalData.map((d) => d.x),
    type: "box",
    name: "Normal",
    boxpoints: false,
    boxmean: true,
    marker: { color: "#10b981", size: 8 },
    line: { width: 1 },
    median: normalData.map((d) => d.median),
    q1: normalData.map((d) => d.q1),
    q3: normalData.map((d) => d.q3),
    lowerfence: normalData.map((d) => d.lowerfence),
    upperfence: normalData.map((d) => d.upperfence),
  }] : [];

  const yValues = [...tumorPlotData, ...normalPlotData].flatMap((trace: any) => [
    Math.min(...(trace.lowerfence || [0])),
    Math.max(...(trace.upperfence || [0])),
  ]);
  const yMin = yValues.length ? Math.min(...yValues) * 0.9 : 0;
  const yMax = yValues.length ? Math.max(...yValues) * 1.1 : 1;

  useEffect(() => {
    if (tumorPlotRef.current || normalPlotRef.current) {
      window.dispatchEvent(new Event("resize"));
    }
  }, [tumorPlotData, normalPlotData]);

  const handleDownload = (plotRef: React.MutableRefObject<any>, plotType: string) => {
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
        a.download = `${title.replace(/\s+/g, "_").toLowerCase()}_${plotType}_${Date.now()}.png`;
        a.click();
      });
    });
  };

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between text-sm">
          <span>{title}</span>
          <div className="flex space-x-2">
            {tumorPlotData.length > 0 && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleDownload(tumorPlotRef, "tumor")}
                className="h-6 px-2 text-xs"
              >
                <Download className="h-3 w-3" /> Tumor Plot
              </Button>
            )}
            {normalPlotData.length > 0 && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleDownload(normalPlotRef, "normal")}
                className="h-6 px-2 text-xs"
              >
                <Download className="h-3 w-3" /> Normal Plot
              </Button>
            )}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="chart-container space-y-4">
          {tumorPlotData.length === 0 && normalPlotData.length === 0 ? (
            <div className="text-center text-red-600 min-h-[400px] flex items-center justify-center">
              No valid data available for the {title} plot. Please check the selected genes and groups.
            </div>
          ) : (
            <>
              {tumorPlotData.length > 0 && (
                <div>
                  <Plot
                    ref={tumorPlotRef}
                    data={tumorPlotData}
                    layout={{
                      title: { text: `${title} - Tumor`, font: { size: 14, weight: "bold" }, x: 0.5, xanchor: "center" },
                      xaxis: {
                        title: { text: xLabel, font: { size: 12, weight: "bold" }, pad: 20 },
                        // tickangle: 45,
                        tickfont: { size: 10 },
                        automargin: true
                      },
                      yaxis: {
                        title: { text: yLabel, font: { size: 12, weight: "bold" }, pad: 20 },
                        tickfont: { size: 10 },
                        range: [yMin, yMax],
                        automargin: true,
                      },
                      showlegend: false,
                      // legend: {
                      //   orientation: "h",
                      //   x: 0.15,
                      //   xanchor: "center",
                      //   y: 1.08,
                      //   yanchor: "bottom",
                      //   font: { size: 10 },
                      // },
                      
                      margin: { t: 20, b: 50, l: 30, r: 30 },
                      barmode: "group",
                      width: 800,
                      height: 400,
                    }}
                    config={{ responsive: true }}
                  />
                </div>
              )}
              {normalPlotData.length > 0 && (
                <div>
                  <Plot
                    ref={normalPlotRef}
                    data={normalPlotData}
                    layout={{
                      title: { text: `${title} - Normal`, font: { size: 14, weight: "bold" }, x: 0.5, xanchor: "center" },
                      xaxis: {
                        title: { text: xLabel, font: { size: 12, weight: "bold" }, pad: 20 },
                        // tickangle: 45,
                        tickfont: { size: 10 },
                        automargin: true
                      },
                      yaxis: {
                        title: { text: yLabel, font: { size: 12, weight: "bold" }, pad: 20 },
                        tickfont: { size: 10 },
                        range: [yMin, yMax],
                        automargin: true,
                      },
                      showlegend: true,
                      legend: {
                        orientation: "h",
                        x: 0.15,
                        xanchor: "center",
                        y: 1.08,
                        yanchor: "bottom",
                        font: { size: 10 },
                      },
                      margin: { t: 20, b: 50, l: 30, r: 30 },
                      barmode: "group",
                      width: 800,
                      height: 400,
                    }}
                    config={{ responsive: true }}
                  />
                </div>
              )}
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
};