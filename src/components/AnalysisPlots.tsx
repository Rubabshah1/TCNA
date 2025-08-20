import React from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { PlotlyBoxChart } from "@/components/charts";
import { GeneStats } from "@/components/types/genes";
import CollapsibleCard from "@/components/ui/collapsible-card";

interface AnalysisPlotsProps {
  isOpen: boolean;
  toggleOpen: () => void;
  data: GeneStats[];
  selectedSites: string[];
  selectedGroups: string[];
  visiblePlots: Record<string, boolean>;
  analysisType: string;
}

const AnalysisPlots: React.FC<AnalysisPlotsProps> = ({ isOpen, toggleOpen, data, selectedSites, selectedGroups, visiblePlots, analysisType }) => {
  const groupedData = data
    .filter((gene) => selectedSites.includes(gene.site))
    .reduce((acc, gene) => {
      if (!acc[gene.site]) acc[gene.site] = [];
      acc[gene.site].push(gene);
      return acc;
    }, {} as Record<string, GeneStats[]>);

  return (
    <div className="mb-8">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-2xl font-bold text-blue-900">Analysis Plots</h3>
        <button onClick={toggleOpen} className="text-blue-900">
          {isOpen ? <ChevronDown className="h-6 w-6" /> : <ChevronRight className="h-6 w-6" />}
        </button>
      </div>
      {isOpen && visiblePlots.stdBox && (
        <div className="flex flex-col space-y-4">
          {Object.keys(groupedData).map((site) => (
            <div key={site} className="mb-4">
              <CollapsibleCard
              title={site}
                        className="mb-4 p-2 text-sm"
              >
              {/* <h4 className="text-xl font-semibold text-blue-800 mb-4">{site}</h4> */}
              <PlotlyBoxChart
                data={groupedData[site]}
                title={`Standard Deviation Box Plot`}
                xKey={analysisType === "pan-cancer" ? "site" : "gene_symbol"}
                selectedGroups={selectedGroups}
                xLabel={analysisType === "pan-cancer" ? "Cancer Sites" : "Genes"}
                yLabel="Expression Value"
              />
              </CollapsibleCard>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AnalysisPlots;