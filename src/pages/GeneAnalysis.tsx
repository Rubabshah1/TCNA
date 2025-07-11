import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Link, useNavigate } from "react-router-dom";
import { Activity, ArrowLeft, Dna, ArrowRight } from "lucide-react";
// import SiteTypeSelector from "@/components/siteSelector";
import CancerTypeSelector from "@/components/CancerTypeSelector";
import GeneSelector from "@/components/GeneSelector";

const GeneAnalysis = () => {
  const [selectedCancerType, setSelectedCancerType] = useState<string>('');
  // const [selectedCancerType, setSelectedCancerType] = useState<string[]>([]);
  // const [viewMode, setViewMode] = useState<'tumor' | 'gene'>('gene');
  const [selectedGenes, setSelectedGenes] = useState<string[]>([]);
  const navigate = useNavigate();

  // const canShowAnalysis = selectedCancerType && (viewMode === 'tumor' || (viewMode === 'gene' && selectedGenes.length > 0));
  const canShowAnalysis = selectedCancerType && (selectedGenes.length > 0);

  const handleAnalyze = () => {
    if (canShowAnalysis) {
      const params = new URLSearchParams({
        cancerType: selectedCancerType,
        // cancerType: selectedCancerType.join(', '),
        genes: selectedGenes.join(', ')
        // viewMode: viewMode
      });
      navigate(`/gene-results?${params.toString()}`);
    }
  };

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
              <Link to="/gene-analysis" className="text-blue-500 font-medium">
                Gene Analysis
              </Link>
              <Link to="/pathway-analysis" className="text-blue-700 hover:text-blue-600 font-medium transition-colors">
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
        {/* Back Button */}
        <Link to="/" className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-6 transition-colors">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Home
        </Link>

        {/* Page Title */}
        <div className="mb-8">
          <h2 className="text-4xl font-bold text-blue-900 mb-2">Gene Expression Noise Analysis</h2>
          <p className="text-lg text-blue-700">
            Select a cancer type and gene to analyze the selected gene's noise across multiple sites, in tumor and normal states. 
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
                // selectedCancerTypes={selectedCancerType}
                // onCancerTypesChange={setSelectedCancerType}
                selectedCancerType={selectedCancerType}
                onCancerTypeChange={setSelectedCancerType}
              />
            </CardContent>
          </Card>

          {/* Analysis Mode Selection
          {selectedCancerType && (
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="text-xl text-blue-800">Analysis Mode</CardTitle>
              </CardHeader>
              <CardContent>
                <RadioGroup value={viewMode} onValueChange={(value) => setViewMode(value as 'tumor' | 'gene')} className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="tumor" id="tumor" />
                    <Label htmlFor="tumor" className="text-base">
                      <div>
                        <div className="font-medium">Tumor-based Analysis</div>
                        <div className="text-sm text-gray-600">Analyze expression patterns across all genes for this cancer type</div>
                      </div>
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="gene" id="gene" />
                    <Label htmlFor="gene" className="text-base">
                      <div>
                        <div className="font-medium">Gene-based Analysis</div>
                        <div className="text-sm text-gray-600">Analyze expression patterns for specific genes in this cancer type</div>
                      </div>
                    </Label>
                  </div>
                </RadioGroup>
              </CardContent>
            </Card>
          )} */}

          {/* Gene Selection (only for gene-based analysis) */}
          {/* {selectedCancerType && viewMode === 'gene' && ( */}
          {selectedCancerType  && (
            <GeneSelector 
              selectedGenes={selectedGenes}
              onGenesChange={setSelectedGenes}
            />
          )}

          {/* Analyze Button */}
          {canShowAnalysis && (
            <div className="flex justify-center">
              <Button 
                onClick={handleAnalyze}
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 text-lg"
              >
                <Activity className="h-5 w-5 mr-2" />
                {/* Analyze {viewMode === 'gene' && selectedGenes.length > 0 ? `${selectedGenes.length} Gene${selectedGenes.length > 1 ? 's' : ''}` : 'Expression Patterns'} */}
                Analyze {selectedGenes.length > 0 ? `${selectedGenes.length} Gene${selectedGenes.length > 1 ? 's' : ''}` : 'Expression Patterns'}
                <ArrowRight className="h-5 w-5 ml-2" />
              </Button>
            </div>
          )}
        </div>

        {/* Instructions */}
        {!canShowAnalysis && (
          <Card className="border-0 shadow-lg bg-gradient-to-r from-blue-50 to-yellow-50">
            <CardContent className="p-8 text-center">
              <h3 className="text-xl font-semibold text-blue-800 mb-4">
                Ready to Analyze Gene Expression Noise?
              </h3>
              <p className="text-blue-700 mb-6">
                Please select a cancer type and analysis mode to begin. 
                Our tool will calculate various noise metrics and generate visualizations 
                to help you understand expression variability patterns.
              </p>
              <div className="flex justify-center space-x-4">
                <div className="bg-white px-4 py-2 rounded-lg border border-blue-200">
                  <span className="text-sm text-blue-600">Step 1:</span>
                  <span className="block font-medium text-blue-800">Choose Cancer Type</span>
                </div>
                <div className="bg-white px-4 py-2 rounded-lg border border-blue-200">
                  <span className="text-sm text-blue-600">Step 2:</span>
                  <span className="block font-medium text-blue-800">Select Analysis Mode</span>
                </div>
                {/* {viewMode === 'gene' && (
                  <div className="bg-white px-4 py-2 rounded-lg border border-blue-200">
                    <span className="text-sm text-blue-600">Step 3:</span>
                    <span className="block font-medium text-blue-800">Choose Genes</span>
                  </div>
                )} */}
                <div className="bg-white px-4 py-2 rounded-lg border border-blue-200">
                    <span className="text-sm text-blue-600">Step 3:</span>
                    <span className="block font-medium text-blue-800">Choose Genes</span>
                  </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
      <footer className="bg-gray-100 text-gray-700 text-m mt-10 p-8 text-center border-t border-gray-300">
        <p className="text-blue-700 mt-4">© 2025 BIRL — This website is free and open to all users and there is no login requirement.</p>
        <p className="font-semibold text-blue-700 mt-4">Biomedical Informatics & Engineering Research Laboratory, Lahore University of Management Sciences</p>
        <p className="text-blue-700 mt-4">DHA, Lahore, Pakistan</p>
        <p className="text-blue-700 mt-4">+92 (42) 3560 8352</p>
      </footer>
    </div>
    // </div>
      
    // </div>
  );
};

export default GeneAnalysis;