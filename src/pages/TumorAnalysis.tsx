
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Microscope, Network, Activity, ArrowLeft, Dna, ArrowRight } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import CancerTypeSelector from "@/components/CancerTypeSelector";

const tumorAnalysis = () => {
  const [selectedCancerType, setSelectedCancerType] = useState("");
  // const [selectedtumor, setSelectedtumor] = useState("");
  const navigate = useNavigate();
  // const tumors = [
  //   { value: "p53", label: "p53 tumor", description: "Tumor suppressor tumor" },
  //   { value: "brca1", label: "BRCA1 tumor", description: "DNA repair tumor" },
  //   { value: "egfr", label: "EGFR tumor", description: "Epidermal growth factor receptor" },
  //   { value: "her2", label: "HER2 tumor", description: "Human epidermal growth factor receptor 2" },
  //   { value: "kras", label: "KRAS tumor", description: "GTPase tumor" },
  //   { value: "pi3k", label: "PI3K tumor", description: "Phosphatidylinositol 3-kinase" }
  // ];
  const canShowAnalysis = selectedCancerType;

  const handleAnalyze = () => {
    if (canShowAnalysis) {
      const params = new URLSearchParams({
        cancerType: selectedCancerType
        // viewMode: viewMode
      });
      navigate(`/tumor-analysis-results?${params.toString()}`);
    }
  };

  // const cancerTypes = [
  //   { value: "breast", label: "Breast Cancer (BRCA)" },
  //   { value: "lung", label: "Lung Cancer (LUAD)" },
  //   { value: "prostate", label: "Prostate Cancer (PRAD)" },
  //   { value: "colorectal", label: "Colorectal Cancer (COAD)" }
  // ];

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
              <Link to="/pathway-analysis" className="text-blue-700 hover:text-blue-600 font-medium transition-colors">
                Pathway Analysis
              </Link>
              <Link to="/tumor-analysis" className="text-blue-500 font-medium">
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
          {/* <h2 className="text-4xl font-bold text-blue-900 mb-2">Tumor Analysis</h2>
          <p className="text-lg text-blue-700"></p> */}

          <h1 className="text-4xl font-bold text-blue-900 mb-4">Tumor Analysis</h1>
          <p className="text-xl text-blue-700">
            Select a cancer type to analyse its noise and tumor values across different metrics. Currently built on GDC datasets.
          </p>
        </div>
        {/* Selection Controls */}
        <div className="grid gap-6 mb-8">
          {/* Cancer Type Selection */}
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="text-xl text-blue-800">Select Cancer Type</CardTitle>
            </CardHeader>
            <CardContent>
              <CancerTypeSelector 
                selectedCancerType={selectedCancerType}
                onCancerTypeChange={setSelectedCancerType}
              />
            </CardContent>
          </Card>
           {/* <Button 
                  className="w-full bg-blue-500 hover:bg-blue-600 text-white"
                  disabled={!selectedCancerType}>
                  Analyze tumor
                </Button> */}
        </div>

        {/* <div className="grid lg:grid-cols-3 gap-8"> */}
          {/* Controls */}
          {/* <div className="lg:col-span-1">
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
                </div> */}

                {/* <div>
                  <label className="block text-sm font-medium text-blue-700 mb-2">
                    Tumor
                  </label>
                  <Select value={selectedtumor} onValueChange={setSelectedtumor}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select tumor" />
                    </SelectTrigger>
                    <SelectContent>
                      {tumors.map((tumor) => (
                        <SelectItem key={tumor.value} value={tumor.value}>
                          <div className="flex flex-col">
                            <span className="font-medium">{tumor.label}</span>
                            <span className="text-sm text-gray-500">{tumor.description}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div> */}
{/* 
                <Button 
                  className="w-full bg-blue-500 hover:bg-blue-600 text-white"
                  disabled={!selectedCancerType}>
                  Analyze tumor
                </Button>
              </CardContent>
            </Card>
          </div> */}
          {canShowAnalysis && (
            <div className="flex justify-center">
              <Button 
                onClick={handleAnalyze}
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 text-lg"
              >
                <Activity className="h-5 w-5 mr-2" />
                {/* Analyze {viewMode === 'gene' && selectedGenes.length > 0 ? `${selectedGenes.length} Gene${selectedGenes.length > 1 ? 's' : ''}` : 'Expression Patterns'} */}
                Analyze
                <ArrowRight className="h-5 w-5 ml-2" />
              </Button>
            </div>
          )}
          {/* Results */}
          {/* <div className="lg:col-span-2">
            {selectedCancerType ? (
              <div className="space-y-6">
                <Card className="border-0 shadow-lg bg-gradient-to-r from-blue-50 to-yellow-50">
                  <CardHeader>
                    <CardTitle className="text-blue-800">
                      Tumor Structure & Domains
                    </CardTitle>
                  </CardHeader> */}
                  {/* <CardContent>
                    <div className="h-64 bg-gradient-to-br from-blue-100 to-yellow-100 rounded-lg flex items-center justify-center">
                      <div className="text-center text-blue-700">
                        <Microscope className="h-16 w-16 mx-auto mb-4" />
                        <p className="text-lg font-medium">3D tumor Structure</p>
                        <p className="text-sm">
                          Showing {tumors.find(p => p.value === selectedtumor)?.label} structure
                        </p>
                      </div>
                    </div>
                  </CardContent> */}
                {/* </Card> */}

                {/* <div className="grid grid-cols-1 md:grid-cols-2 gap-6"> */}
                  {/* <Card className="border-0 shadow-lg">
                    <CardHeader>
                      <CardTitle className="text-blue-800">Expression Levels</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="p-3 bg-blue-50 rounded-lg">
                          <p className="text-sm text-blue-600 font-medium">Mean Expression</p>
                          <p className="text-xl font-bold text-blue-800">156.4 AU</p>
                        </div>
                        <div className="p-3 bg-yellow-50 rounded-lg">
                          <p className="text-sm text-yellow-600 font-medium">Expression Variance</p>
                          <p className="text-xl font-bold text-yellow-800">23.7 AU</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card> */}

                  {/* <Card className="border-0 shadow-lg">
                    <CardHeader>
                      <CardTitle className="text-blue-800">Modifications</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="p-3 bg-blue-50 rounded-lg">
                          <p className="text-sm text-blue-600 font-medium">Phosphorylation Sites</p>
                          <p className="text-xl font-bold text-blue-800">7</p>
                        </div>
                        <div className="p-3 bg-yellow-50 rounded-lg">
                          <p className="text-sm text-yellow-600 font-medium">Ubiquitination Sites</p>
                          <p className="text-xl font-bold text-yellow-800">3</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card> */}
                {/* </div> */}
              </div>
            {/* ) : (
              <Card className="border-0 shadow-lg h-96 flex items-center justify-center">
                <div className="text-center text-blue-600">
                  <Microscope className="h-16 w-16 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium">Select Parameters to Begin Analysis</p>
                  <p className="text-sm opacity-75">Choose a cancer type explore</p>
                </div>
              </Card>
            )} */}
          {/* </div> */}
        {/* </div> */}
        <footer className="bg-gray-100 text-gray-700 text-m mt-10 p-8 text-center border-t border-gray-300">
      <p className=" text-blue-700 mt-4">© 2025 BIRL — This website is free and open to all users and there is no login requirement.</p>
      <p className="font-semibold text-blue-700 mt-4">Biomedical Informatics & Engineering Research Laboratory, Lahore University of Management Sciences</p>
      <p className=" text-blue-700 mt-4">DHA, Lahore, Pakistan</p>
      <p className=" text-blue-700 mt-4">+92 (42) 3560 8352</p>
    </footer>
      </div>
  );
};

export default tumorAnalysis;
