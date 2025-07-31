import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link, useNavigate } from "react-router-dom";
import { Activity, ArrowLeft, Dna, ArrowRight } from "lucide-react";
import CancerTypeSelector from "@/components/siteSelector";
import GeneSelector from "@/components/GeneSelector";
import Header from "@/components/header";
import Footer from "@/components/footer";

const GeneAnalysis = () => {
  const [selectedCancerTypes, setSelectedCancerTypes] = useState<string[]>([]); // Array for multiple cancer types
  const [selectedGenes, setSelectedGenes] = useState<string[]>([]);
  const [selectedSite, setSelectedSite] = useState<string>(""); // Required site
  const navigate = useNavigate();

  // Require site and genes, but cancerTypes is optional
  const canShowAnalysis = selectedSite && selectedGenes.length > 0;

  const handleAnalyze = () => {
    if (canShowAnalysis) {
      const params = new URLSearchParams({
        site: selectedSite,
        cancerTypes: selectedCancerTypes.join(","), // Empty string if no cancer types
        genes: selectedGenes.join(","),
      });
      console.log("Navigating to:", `/gene-results?${params.toString()}`);
      navigate(`/gene-results?${params.toString()}`);
    } else {
      console.log("Cannot navigate: Missing required fields", {
        selectedSite,
        selectedCancerTypes,
        selectedGenes,
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-yellow-50 flex flex-col">
    
      <Header />
      <main className="flex-grow">

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <Link
          to="/"
          className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-6 transition-colors"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Home
        </Link>

        {/* Page Title */}
        <div className="mb-8">
          <h2 className="text-4xl font-bold text-blue-900 mb-2">
            Gene Expression Noise Analysis
          </h2>
          <p className="text-lg text-blue-700">
            Select a cancer site and gene to analyze the selected gene's noise.
            Optionally, filter by specific cancer projects.
          </p>
        </div>

        {/* Selection Controls */}
        <div className="grid gap-6 mb-8">
          {/* Cancer Site and Type Selection */}
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="text-xl text-blue-800">
                Select Cancer Site and Project
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CancerTypeSelector
                selectedCancerTypes={selectedCancerTypes}
                onCancerTypesChange={setSelectedCancerTypes}
                onSiteChange={setSelectedSite}
              />
            </CardContent>
          </Card>

          {/* Gene Selection */}
          {selectedSite && (
            <GeneSelector
              selectedGenes={selectedGenes}
              onGenesChange={setSelectedGenes}
            />
          )}

          {/* Analyze Button */}
          <div className="flex justify-center">
            <Button
              onClick={handleAnalyze}
              disabled={!canShowAnalysis}
              className={`px-8 py-3 text-lg ${
                canShowAnalysis
                  ? "bg-blue-600 hover:bg-blue-700 text-white"
                  : "bg-gray-300 text-gray-500 cursor-not-allowed"
              }`}
            >
              <Activity className="h-5 w-5 mr-2" />
              Analyze{" "}
              {selectedGenes.length > 0
                ? `${selectedGenes.length} Gene${selectedGenes.length > 1 ? "s" : ""}`
                : ""}
              <ArrowRight className="h-5 w-5 ml-2" />
            </Button>
          </div>
        </div>

        {/* Instructions */}
        {/* {!canShowAnalysis && (
          <Card className="border-0 shadow-lg bg-gradient-to-r from-blue-50 to-yellow-50">
            <CardContent className="p-8 text-center">
              <h3 className="text-xl font-semibold text-blue-800 mb-4">
                Ready to Analyze Gene Expression Noise?
              </h3>
              <p className="text-blue-700 mb-6">
                Please select a cancer site and at least one gene to begin. Optionally, choose specific cancer types to filter the analysis. Our tool will calculate various noise metrics and generate visualizations to help you understand expression variability patterns.
              </p>
              <div className="flex justify-center space-x-4">
                <div className="bg-white px-4 py-2 rounded-lg border border-blue-200">
                  <span className="text-sm text-blue-600">Step 1:</span>
                  <span className="block font-medium text-blue-800">
                    Choose Cancer Site
                  </span>
                </div>
                <div className="bg-white px-4 py-2 rounded-lg border border-blue-200">
                  <span className="text-sm text-blue-600">Step 2:</span>
                  <span className="block font-medium text-blue-800">
                    Choose Genes
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        )} */}
      </div>
      </main>
      <Footer/>
    </div>
  );
};

export default GeneAnalysis;
