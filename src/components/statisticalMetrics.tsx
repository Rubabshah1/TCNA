import React, { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronRight } from "lucide-react";
import { PlotlyBarChart } from "@/components/charts";
import CollapsibleCard from "@/components/ui/collapsible-card";
import { GeneStats } from "@/components/types/genes";

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
}) => {
  const noiseMetrics = {
    CV: "cv",
    Mean: "mean",
    "Standard Deviation": "std",
    MAD: "mad",
    "CV²": "cv_squared",
    "Differential Noise": "logfc",
  };

  const groupedData = useMemo(() => {
    return data
      .filter((gene) => selectedSites.includes(gene.site))
      .reduce((acc, gene) => {
        if (!acc[gene.site]) acc[gene.site] = [];
        acc[gene.site].push(gene);
        return acc;
      }, {} as Record<string, GeneStats[]>);
  }, [data, selectedSites]);

  const logfcColors = useMemo(() => data.map((gene) => gene.logfc < 0 ? "#ef4444c3" : "#3b83f6af"), [data]);

  return (
    <div className="mb-8">
      {/* <div className="flex gap-4 mb-6">
        {["normal", "tumor"].map((group) => (
          <Button
            key={group}
            className={`text-white ${selectedGroups.includes(group) ? "bg-blue-600 hover:bg-blue-700" : "bg-white text-blue-600 border border-blue-600 hover:bg-blue-50"}`}
            onClick={() => {
              const newGroups = selectedGroups.includes(group)
                ? selectedGroups.filter((g) => g !== group)
                : [...selectedGroups, group];
              // Update groups logic here if needed
            }}
          >
            {group.charAt(0).toUpperCase() + group.slice(1)}
          </Button>
        ))}
      </div> */}
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-2xl font-bold text-blue-900">Statistical Metrics</h3>
        <button onClick={toggleOpen} className="text-blue-900">
          {isOpen ? <ChevronDown className="h-6 w-6" /> : <ChevronRight className="h-6 w-6" />}
        </button>
      </div>
      {isOpen && (
        <>
          {["cv", "std", "mad", "cv_squared", "mean", "logfc"].map((metric) => {
            const displayMetric = Object.keys(noiseMetrics).find((key) => noiseMetrics[key] === metric) || "log2 Fold Change";
            return (
              selectedNoiseMetrics.includes(displayMetric) && visiblePlots[metric] && (
                <div key={`global-${metric}`} className="mb-4">
                  <CollapsibleCard
                    title={`${displayMetric}`}
                    defaultOpen={metricOpenState[metric]}
                    onToggle={() => toggleMetricSection(metric)}
                  >
                    {metric === "logfc" ? (
                      selectedGroups.includes("tumor") && selectedGroups.includes("normal") ? (
                        data.some((d) => d.normalSamples > 1) ? (
                          <PlotlyBarChart
                            data={data}
                            xKey={analysisType === "cancer-specific" ? "gene_symbol" : "site"}
                            yKey="logfc"
                            title={`Log2fc (Tumor / Normal)`}
                            xLabel={analysisType === "cancer-specific" ? "Genes" : "Cancer Sites"}
                            yLabel={normalizationMethod.toUpperCase()}
                            colors={logfcColors}
                            orientation="v"
                            showLegend={false}
                          />
                        ) : (
                          <div className="text-center text-red-600">
                            {data[0]?.logfcMessage || "Not enough normal samples for Differential Noise analysis."}
                          </div>
                        )
                      ) : (
                        <div className="text-center text-red-600">
                          Both tumor and normal groups must be selected for Differential Noise analysis.
                        </div>
                      )
                    ) : (
                      <PlotlyBarChart
                        data={analysisType === "pan-cancer" ? data : groupedData[Object.keys(groupedData)[0]] || []}
                        xKey={analysisType === "pan-cancer" ? "site" : "gene_symbol"}
                        yKey={[
                          ...(selectedGroups.includes("normal") ? [`${metric}_normal`] : []),
                          ...(selectedGroups.includes("tumor") ? [`${metric}_tumor`] : []),
                        ]}
                        title={displayMetric}
                        // {
                        //   analysisType === "pan-cancer"
                        //     ? `${displayMetric} (${normalizationMethod.toUpperCase()})`
                        //     : `${displayMetric} (${normalizationMethod.toUpperCase()})`
                        // }
                        xLabel={analysisType === "pan-cancer" ? "Cancer Sites" : "Genes"}
                        yLabel={normalizationMethod.toUpperCase()}
                        colors={selectedGroups.map((group) => group === "tumor" ? "#ef4444c3" : "#10b981bd")}
                        orientation="v"
                        legendLabels={["Normal", "Tumor"]}
                      />
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