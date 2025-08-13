
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link, useNavigate } from "react-router-dom";
import { Activity, ArrowLeft, Dna, ArrowRight } from "lucide-react";
import CancerTypeSelector from "@/components/siteSelector";
import GeneSelector from "@/components/GeneSelector";
import Header from "@/components/header";
import Footer from "@/components/footer";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const GeneAnalysis = () => {
  const [selectedCancerTypes, setSelectedCancerTypes] = useState<string[]>([]);
  const [selectedGenes, setSelectedGenes] = useState<string[]>([]);
  const [selectedSites, setSelectedSites] = useState<string[]>([]);
  const [analysisType, setAnalysisType] = useState<"pan-cancer" | "cancer-specific" | null>(null);
  const navigate = useNavigate();

  // Require at least one site and one gene for cancer-specific, or one gene for pan-cancer
  const canShowAnalysis = 
    (analysisType === "pan-cancer" && selectedGenes.length === 1 && selectedSites.length > 0) ||
    (analysisType === "cancer-specific" && selectedSites.length > 0 && selectedGenes.length > 0);

  const handleAnalyze = () => {
    if (canShowAnalysis) {
      const params = new URLSearchParams({
        sites: selectedSites.join(","),
        cancerTypes: selectedCancerTypes.join(","),
        genes: selectedGenes.join(","),
        analysisType: analysisType || "cancer-specific",
      });
      console.log("Navigating to:", `/gene-results?${params.toString()}`);
      navigate(`/gene-results?${params.toString()}`);
    } else {
      console.log("Cannot navigate: Missing required fields", {
        selectedSites,
        selectedCancerTypes,
        selectedGenes,
        analysisType,
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
              Select analysis type, cancer sites, and genes to analyze gene expression noise.
              For pan-cancer analysis, select one gene and multiple cancer sites.
              For cancer-specific analysis, select one or more genes and one cancer site.
            </p>
          </div>

          {/* Selection Controls */}
          <div className="grid gap-6 mb-8">
            {/* Analysis Type Selection */}
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="text-xl text-blue-800">
                  Select Analysis Type
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Select onValueChange={(value: "pan-cancer" | "cancer-specific") => setAnalysisType(value)}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Choose analysis type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pan-cancer">Pan-Cancer Analysis</SelectItem>
                    <SelectItem value="cancer-specific">Cancer-Specific Analysis</SelectItem>
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>

            {/* Cancer Site and Type Selection */}
            {analysisType && (
              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="text-xl text-blue-800">
                    Select Cancer Sites and Projects
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <CancerTypeSelector
                    selectedCancerTypes={selectedCancerTypes}
                    onCancerTypesChange={setSelectedCancerTypes}
                    onSitesChange={setSelectedSites}
                    analysisType={analysisType}
                  />
                </CardContent>
              </Card>
            )}

            {/* Gene Selection */}
            {selectedSites.length > 0 && analysisType && (
              <GeneSelector
                selectedGenes={selectedGenes}
                onGenesChange={setSelectedGenes}
                maxGenes={analysisType === "pan-cancer" ? 1 : undefined}
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
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default GeneAnalysis;
// import { useState } from "react";
// import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
// import { Button } from "@/components/ui/button";
// import { Link, useNavigate } from "react-router-dom";
// import { Activity, ArrowLeft, Dna, ArrowRight } from "lucide-react";
// import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
// import { Label } from "@/components/ui/label";
// import CancerTypeSelector from "@/components/siteSelector";
// import GeneSelector from "@/components/GeneSelector";
// import Header from "@/components/header";
// import Footer from "@/components/footer";

// const GeneAnalysis = () => {
//   const [analysisType, setAnalysisType] = useState<"pan-cancer" | "cancer-specific">("pan-cancer");
//   const [selectedCancerTypes, setSelectedCancerTypes] = useState<string[]>([]);
//   const [selectedGenes, setSelectedGenes] = useState<string[]>([]);
//   const [selectedSites, setSelectedSites] = useState<string[]>([]);
//   const navigate = useNavigate();

//   // Require at least one site and one gene; cancerTypes is optional for cancer-specific analysis
//   const canShowAnalysis = selectedSites.length > 0 && selectedGenes.length > 0;

//   const handleAnalyze = () => {
//     if (canShowAnalysis) {
//       const params = new URLSearchParams({
//         sites: selectedSites.join(","), // Multiple sites for pan-cancer, single site for cancer-specific
//         cancerTypes: analysisType === "cancer-specific" ? selectedCancerTypes.join(",") : "", // Only include for cancer-specific
//         genes: selectedGenes.join(","),
//         analysisType, // Pass analysis type to results page
//       });
//       console.log("Navigating to:", `/gene-results?${params.toString()}`);
//       navigate(`/gene-results?${params.toString()}`);
//     } else {
//       console.log("Cannot navigate: Missing required fields", {
//         selectedSites,
//         selectedCancerTypes,
//         selectedGenes,
//         analysisType,
//       });
//     }
//   };

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-yellow-50 flex flex-col">
//       <Header />
//       <main className="flex-grow">
//         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
//           {/* Back Button */}
//           <Link
//             to="/"
//             className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-6 transition-colors"
//           >
//             <ArrowLeft className="h-4 w-4 mr-2" />
//             Back to Home
//           </Link>

//           {/* Page Title */}
//           <div className="mb-8">
//             <h2 className="text-4xl font-bold text-blue-900 mb-2">
//               Gene Expression Noise Analysis
//             </h2>
//             <p className="text-lg text-blue-700">
//               {analysisType === "pan-cancer"
//                 ? "Select multiple cancer sites and genes for a pan-cancer analysis."
//                 : "Select one cancer site and optionally specific cancer projects, along with genes, for a cancer-specific analysis."}
//             </p>
//           </div>

//           {/* Analysis Type Selection */}
//           <Card className="border-0 shadow-lg mb-8">
//             <CardHeader>
//               <CardTitle className="text-xl text-blue-800">
//                 Analysis Type
//               </CardTitle>
//             </CardHeader>
//             <CardContent>
//               <RadioGroup
//                 value={analysisType}
//                 onValueChange={(value) => {
//                   setAnalysisType(value as "pan-cancer" | "cancer-specific");
//                   setSelectedSites([]); // Reset sites on type change
//                   setSelectedCancerTypes([]); // Reset cancer types
//                 }}
//                 className="flex space-x-4"
//               >
//                 <div className="flex items-center space-x-2">
//                   <RadioGroupItem value="pan-cancer" id="pan-cancer" />
//                   <Label htmlFor="pan-cancer" className="text-blue-700">
//                     Pan-Cancer Analysis
//                   </Label>
//                 </div>
//                 <div className="flex items-center space-x-2">
//                   <RadioGroupItem value="cancer-specific" id="cancer-specific" />
//                   <Label htmlFor="cancer-specific" className="text-blue-700">
//                     Cancer-Specific Analysis
//                   </Label>
//                 </div>
//               </RadioGroup>
//             </CardContent>
//           </Card>

//           {/* Cancer Site and Type Selection */}
//           <Card className="border-0 shadow-lg mb-8">
//             <CardHeader>
//               <CardTitle className="text-xl text-blue-800">
//                 {analysisType === "pan-cancer"
//                   ? "Select Cancer Sites"
//                   : "Select Cancer Site and Projects"}
//               </CardTitle>
//             </CardHeader>
//             <CardContent>
//               <CancerTypeSelector
//                 analysisType={analysisType}
//                 selectedCancerTypes={selectedCancerTypes}
//                 onCancerTypesChange={setSelectedCancerTypes}
//                 selectedSites={selectedSites}
//                 onSitesChange={setSelectedSites}
//               />
//             </CardContent>
//           </Card>

//           {/* Gene Selection */}
//           {selectedSites.length > 0 && (
//             <GeneSelector
//               selectedGenes={selectedGenes}
//               onGenesChange={setSelectedGenes}
//             />
//           )}
//           {selectedSites.length > 0 && (
//             <div className="flex flex-col items-center space-y-2 mb-8">
//               <label className="text-blue-800 font-medium">
//                 Or upload a list of genes (.txt, one per line):
//               </label>
//               <input
//                 type="file"
//                 accept=".txt"
//                 onChange={async (e) => {
//                   const file = e.target.files?.[0];
//                   if (!file) return;

//                   try {
//                     const text = await file.text();
//                     const uploadedGenes = text
//                       .split("\n")
//                       .map((g) => g.trim())
//                       .filter((g) => g.length > 0);
//                     setSelectedGenes((prev) => Array.from(new Set([...prev, ...uploadedGenes])));
//                   } catch (err) {
//                     console.error("Error reading gene list:", err);
//                   }
//                 }}
//                 className="border border-gray-300 p-2 rounded-md"
//               />
//             </div>
//           )}

//           {/* Analyze Button */}
//           <div className="flex justify-center">
//             <Button
//               onClick={handleAnalyze}
//               disabled={!canShowAnalysis}
//               className={`px-8 py-3 text-lg ${
//                 canShowAnalysis
//                   ? "bg-blue-600 hover:bg-blue-700 text-white"
//                   : "bg-gray-300 text-gray-500 cursor-not-allowed"
//               }`}
//             >
//               <Activity className="h-5 w-5 mr-2" />
//               Analyze{" "}
//               {selectedGenes.length > 0
//                 ? `${selectedGenes.length} Gene${selectedGenes.length > 1 ? "s" : ""}`
//                 : ""}
//               <ArrowRight className="h-5 w-5 ml-2" />
//             </Button>
//           </div>
//         </div>
//       </main>
//       <Footer />
//     </div>
//   );
// };

// export default GeneAnalysis;