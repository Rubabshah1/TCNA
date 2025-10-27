import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link, useNavigate } from "react-router-dom";
import { Activity, ArrowLeft, ArrowRight } from "lucide-react";
import CancerTypeSelector from "@/components/siteSelector";
import Header from "@/components/header";
import Footer from "@/components/footer";
import { useCache } from "@/hooks/use-cache";
import GeneSelector from "@/components/GeneSelector";

const PathwayAnalysis = () => {
  const [selectedCancerTypes, setSelectedCancerTypes] = useState<string[]>([]);
  const [selectedGenes, setSelectedGenes] = useState<string[]>([]);
  const [selectedSites, setSelectedSites] = useState<string[]>([]);
  const navigate = useNavigate();
  const { getCachedData, setCachedData, generateCacheKey } = useCache<any>();

  const cacheKey = generateCacheKey({
    sites: selectedSites,
    cancerTypes: selectedCancerTypes,
    genes: selectedGenes,
    analysisType: "ORA",
    siteAnalysisType: "pan-cancer",
  });

  const canShowAnalysis = selectedSites.length > 0 && selectedGenes.length > 0;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        const parsedGenes = content
          .split(/[\n,]+/)
          .map((gene) => gene.trim().toUpperCase())
          .filter((gene) => gene.length > 0);
        setSelectedGenes(parsedGenes);
      }
    };
    reader.readAsText(file);
  };

  const handleAnalyze = () => {
    if (canShowAnalysis) {
      const params = new URLSearchParams({
        sites: selectedSites.join(","),
        cancerTypes: selectedCancerTypes.join(","),
        genes: selectedGenes.join(","),
        analysisType: "ORA",
        siteAnalysisType: "pan-cancer",
      });

      setCachedData(cacheKey, {
        sites: selectedSites,
        cancerTypes: selectedCancerTypes,
        genes: selectedGenes,
        analysisType: "ORA",
        siteAnalysisType: "pan-cancer",
      });

      navigate(`/pathway-results?${params.toString()}`);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-yellow-50 flex flex-col">
      <Header />
      <main className="flex-grow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Link to="/" className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-6 transition-colors">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Home
          </Link>

          <div className="mb-8">
            <h2 className="text-4xl font-bold text-blue-900 mb-2">Pathway Analysis</h2>
            <p className="text-xl text-blue-700">
              Select cancer sites and projects, and provide a custom gene list to analyze the noise of a gene pathway.
            </p>
          </div>

          <div className="grid gap-6 mb-8">
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="text-xl text-blue-800">Select Cancer Sites and Projects</CardTitle>
              </CardHeader>
              <CardContent>
                <CancerTypeSelector
                  selectedCancerTypes={selectedCancerTypes}
                  onCancerTypesChange={setSelectedCancerTypes}
                  onSitesChange={setSelectedSites}
                  analysisType="pan-cancer"
                />
              </CardContent>
            </Card>

            <GeneSelector
              selectedGenes={selectedGenes}
              onGenesChange={setSelectedGenes}
            />

            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="text-xl text-blue-800">Or Upload Gene List File (.txt)</CardTitle>
              </CardHeader>
              <CardContent>
                <input type="file" accept=".txt" onChange={handleFileUpload} />
              </CardContent>
            </Card>

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

export default PathwayAnalysis;
// import { useState } from "react";
// import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
// import { Button } from "@/components/ui/button";
// import { Link, useNavigate } from "react-router-dom";
// import { Activity, ArrowLeft, ArrowRight } from "lucide-react";
// import CancerTypeSelector from "@/components/siteSelector";
// import Header from "@/components/header";
// import Footer from "@/components/footer";
// import { useCache } from "@/hooks/use-cache";
// import GeneSelector from "@/components/GeneSelector";

// const PathwayAnalysis = () => {
//   const [selectedCancerTypes, setSelectedCancerTypes] = useState<string[]>([]);
//   const [selectedGenes, setSelectedGenes] = useState<string[]>([]);
//   const [selectedSites, setSelectedSites] = useState<string[]>([]); // Array, but max one site for cancer-specific
//   const [analysisType, setAnalysisType] = useState<"ORA" | "GSEA">("ORA");
//   const navigate = useNavigate();
//   const { getCachedData, setCachedData, generateCacheKey } = useCache<any>();

//   const cacheKey = generateCacheKey({
//     sites: selectedSites,
//     cancerTypes: selectedCancerTypes,
//     genes: selectedGenes,
//     analysisType,
//     // siteAnalysisType: "cancer-specific", // Hardcoded
//     siteAnalysisType: "pan-cancer", // Hardcoded
//   });

//   const canShowAnalysis = selectedSites.length > 0; // At least one site selected

//   const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
//     const file = e.target.files?.[0];
//     if (!file) return;

//     const reader = new FileReader();
//     reader.onload = (event) => {
//       const content = event.target?.result as string;
//       if (content) {
//         const parsedGenes = content
//           .split(/[\n,]+/)
//           .map((gene) => gene.trim().toUpperCase())
//           .filter((gene) => gene.length > 0);
//         setSelectedGenes(parsedGenes);
//       }
//     };
//     reader.readAsText(file);
//   };

//   const handleAnalyze = () => {
//     if (canShowAnalysis) {
//       const params = new URLSearchParams({
//         sites: selectedSites.join(","), // Single site as a string
//         cancerTypes: selectedCancerTypes.join(","),
//         genes: selectedGenes.join(","),
//         analysisType,
//         // siteAnalysisType: "cancer-specific", // Hardcoded
//         siteAnalysisType: "pan-cancer", // Hardcoded
//       });

//       setCachedData(cacheKey, {
//         sites: selectedSites,
//         cancerTypes: selectedCancerTypes,
//         genes: selectedGenes,
//         analysisType,
//         // siteAnalysisType: "cancer-specific",
//         siteAnalysisType: "pan-cancer", // Hardcoded
//       });

//       navigate(`/pathway-results?${params.toString()}`);
//     }
//   };

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-yellow-50 flex flex-col">
//       <Header />
//       <main className="flex-grow">
//         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
//           <Link to="/" className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-6 transition-colors">
//             <ArrowLeft className="h-4 w-4 mr-2" />
//             Back to Home
//           </Link>

//           <div className="mb-8">
//             <h2 className="text-4xl font-bold text-blue-900 mb-2">Pathway Analysis</h2>
//             <p className="text-xl text-blue-700">
//               Select a cancer site and projects, and provide a custom gene list to analyze the noise of a gene pathway.
//             </p>
//           </div>

//           <div className="grid gap-6 mb-8">
//             <Card className="border-0 shadow-lg">
//               <CardHeader>
//                 <CardTitle className="text-xl text-blue-800">Select Cancer Site and Projects</CardTitle>
//               </CardHeader>
//               <CardContent>
//                 <CancerTypeSelector
//                   selectedCancerTypes={selectedCancerTypes}
//                   onCancerTypesChange={setSelectedCancerTypes}
//                   onSitesChange={setSelectedSites} // Passes array, but max one site
//                   // analysisType="cancer-specific" // Hardcoded
//                   analysisType= "pan-cancer" // Hardcoded
//                 />
//               </CardContent>
//             </Card>

//             {analysisType === "ORA" && (
//               <>
//                 <GeneSelector
//                   selectedGenes={selectedGenes}
//                   onGenesChange={setSelectedGenes}
//                 />

//                 <Card className="border-0 shadow-lg">
//                   <CardHeader>
//                     <CardTitle className="text-xl text-blue-800">Or Upload Gene List File (.txt)</CardTitle>
//                   </CardHeader>
//                   <CardContent>
//                     <input type="file" accept=".txt" onChange={handleFileUpload} />
//                   </CardContent>
//                 </Card>
//               </>
//             )}

//             <div className="flex justify-center">
//               <Button
//                 onClick={handleAnalyze}
//                 disabled={!canShowAnalysis}
//                 className={`px-8 py-3 text-lg ${
//                   canShowAnalysis
//                     ? "bg-blue-600 hover:bg-blue-700 text-white"
//                     : "bg-gray-300 text-gray-500 cursor-not-allowed"
//                 }`}
//               >
//                 <Activity className="h-5 w-5 mr-2" />
//                 Analyze{" "}
//                 {analysisType === "ORA" && selectedGenes.length > 0
//                   ? `${selectedGenes.length} Gene${selectedGenes.length > 1 ? "s" : ""}`
//                   : ""}
//                 <ArrowRight className="h-5 w-5 ml-2" />
//               </Button>
//             </div>
//           </div>
//         </div>
//       </main>
//       <Footer />
//     </div>
//   );
// };

// export default PathwayAnalysis; 