
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
// import { Network, ArrowLeft } from "lucide-react";
import { Network, Activity, ArrowLeft, Dna, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

const PathwayAnalysis = () => {
  const [selectedCancerType, setSelectedCancerType] = useState("");
  const [selectedPathway, setSelectedPathway] = useState("");

  const pathways = [
    { value: "p53", label: "p53 Signaling Pathway", description: "Cell cycle regulation and apoptosis" },
    { value: "wnt", label: "Wnt/β-catenin Pathway", description: "Cell proliferation and differentiation" },
    { value: "pi3k", label: "PI3K/AKT Pathway", description: "Cell survival and metabolism" },
    { value: "mapk", label: "MAPK/ERK Pathway", description: "Cell growth and division" },
    { value: "tgf", label: "TGF-β Pathway", description: "Cell growth inhibition" },
    { value: "nf-kb", label: "NF-κB Pathway", description: "Inflammation and immune response" }
  ];

  const cancerTypes = [
    { value: "breast", label: "Breast Cancer (BRCA)" },
    { value: "lung", label: "Lung Cancer (LUAD)" },
    { value: "prostate", label: "Prostate Cancer (PRAD)" },
    { value: "colorectal", label: "Colorectal Cancer (COAD)" }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-yellow-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-blue-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-blue-600 p-2 rounded-lg">
                <Dna className="h-6 w-6 text-white" />
              </div>
              {/* <h1 className="text-2xl font-bold text-blue-900">TCNA</h1> */}
              <Link to="/" className="text-2xl font-bold text-blue-900">
                TCNA
              </Link>
              <span className="text-sm text-blue-700 hidden sm:block">The Cancer Noise Atlas</span>
            </div>
            <nav className="flex space-x-6">
              {/* <Link to="/" className="text-blue-700 hover:text-blue-600 font-medium transition-colors">
                Home
              </Link> */}
              <Link to="/gene-analysis" className="text-blue-700 hover:text-blue-600 font-medium transition-colors">
                Gene Analysis
              </Link>
              <Link to="/pathway-analysis" className="text-blue-500 font-medium">
                Pathway Analysis
              </Link>
              <Link to="/tumour-analysis" className="text-blue-700 hover:text-blue-600 font-medium transition-colors">
                Tumor Analysis
              </Link>
            </nav>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <Link to="/" className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Home
          </Link>
          <h1 className="text-4xl font-bold text-blue-900 mb-4">Pathway Analysis</h1>
          <p className="text-xl text-blue-700">
            Analyze biological pathway dysregulation and cross-pathway interactions in cancer
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Controls */}
          <div className="lg:col-span-1">
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="text-blue-800">Analysis Parameters</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-blue-700 mb-2">
                    Cancer Type
                  </label>
                  <Select value={selectedCancerType} onValueChange={setSelectedCancerType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select cancer type" />
                    </SelectTrigger>
                    <SelectContent>
                      {cancerTypes.map((cancer) => (
                        <SelectItem key={cancer.value} value={cancer.value}>
                          {cancer.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-blue-700 mb-2">
                    Pathway
                  </label>
                  <Select value={selectedPathway} onValueChange={setSelectedPathway}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select pathway" />
                    </SelectTrigger>
                    <SelectContent>
                      {pathways.map((pathway) => (
                        <SelectItem key={pathway.value} value={pathway.value}>
                          <div className="flex flex-col">
                            <span className="font-medium">{pathway.label}</span>
                            <span className="text-sm text-gray-500">{pathway.description}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Button 
                  className="w-full bg-yellow-600 hover:bg-yellow-700 text-white"
                  disabled={!selectedCancerType || !selectedPathway}
                >
                  Analyze Pathway
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Results */}
          <div className="lg:col-span-2">
            {selectedCancerType && selectedPathway ? (
              <div className="space-y-6">
                <Card className="border-0 shadow-lg bg-gradient-to-r from-blue-50 to-yellow-50">
                  <CardHeader>
                    <CardTitle className="text-blue-800">
                      Pathway Network Visualization
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-64 bg-gradient-to-br from-blue-100 to-yellow-100 rounded-lg flex items-center justify-center">
                      <div className="text-center text-blue-700">
                        <Network className="h-16 w-16 mx-auto mb-4" />
                        <p className="text-lg font-medium">Interactive Pathway Network</p>
                        <p className="text-sm">
                          Showing {pathways.find(p => p.value === selectedPathway)?.label} in{" "}
                          {cancerTypes.find(c => c.value === selectedCancerType)?.label}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-0 shadow-lg">
                  <CardHeader>
                    <CardTitle className="text-blue-800">Pathway Activity Metrics</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 bg-blue-50 rounded-lg">
                        <p className="text-sm text-blue-600 font-medium">Activity Score</p>
                        <p className="text-2xl font-bold text-blue-800">0.73</p>
                      </div>
                      <div className="p-4 bg-yellow-50 rounded-lg">
                        <p className="text-sm text-yellow-600 font-medium">Dysregulation Index</p>
                        <p className="text-2xl font-bold text-yellow-800">2.14</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <Card className="border-0 shadow-lg h-96 flex items-center justify-center">
                <div className="text-center text-blue-600">
                  <Network className="h-16 w-16 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium">Select Parameters to Begin Analysis</p>
                  <p className="text-sm opacity-75">Choose a cancer type and pathway to explore</p>
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
      <footer className="bg-gray-100 text-gray-700 text-m mt-10 p-8 text-center border-t border-gray-300">
      <p className=" text-blue-700 mt-4">© 2025 BIRL — This website is free and open to all users and there is no login requirement.</p>
      <p className="font-semibold text-blue-700 mt-4">Biomedical Informatics & Engineering Research Laboratory, Lahore University of Management Sciences</p>
      <p className=" text-blue-700 mt-4">DHA, Lahore, Pakistan</p>
      <p className=" text-blue-700 mt-4">+92 (42) 3560 8352</p>
    </footer>
    </div>
  );
};

export default PathwayAnalysis;
