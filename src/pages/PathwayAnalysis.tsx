// import { useState } from "react";
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// import { Button } from "@/components/ui/button";
// import { Link, useNavigate } from "react-router-dom";
// import { Activity, ArrowLeft, Dna, ArrowRight } from "lucide-react";
// import CancerTypeSelector from "@/components/siteSelector";
// import Header from "@/components/header";
// import Footer from "@/components/footer";
// import { useCache } from "@/hooks/use-cache"; 
// import GeneSelector from "@/components/GeneSelector"; // ✅ Import your GeneSelector

// const PathwayAnalysis = () => {
//   const [selectedCancerTypes, setSelectedCancerTypes] = useState<string[]>([]);
//   const [selectedGenes, setSelectedGenes] = useState<string[]>([]);
//   const [selectedSites, setSelectedSites] = useState<string[]>([]);
//   const [analysisType, setAnalysisType] = useState<"ORA" | "GSEA">("ORA");
//   const [siteAnalysisType, setSiteAnalysisType] = useState<"pan-cancer" | "cancer-specific">("pan-cancer");
//   const navigate = useNavigate();
//   const { getCachedData, setCachedData, generateCacheKey } = useCache<any>();

//   const cacheKey = generateCacheKey({
//     sites: selectedSites,
//     cancerTypes: selectedCancerTypes,
//     genes: selectedGenes,
//     analysisType,
//     siteAnalysisType,
//   });

//   const canShowAnalysis = selectedSites.length > 0;

//   // ✅ File upload parser (still supported)
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
//         sites: selectedSites.join(","),
//         cancerTypes: selectedCancerTypes.join(","),
//         genes: selectedGenes.join(","),
//         analysisType,
//         siteAnalysisType,
//       });

//       setCachedData(cacheKey, {
//         sites: selectedSites,
//         cancerTypes: selectedCancerTypes,
//         genes: selectedGenes,
//         analysisType,
//         siteAnalysisType,
//       });

//       navigate(`/pathway-results?${params.toString()}`);
//     }
//   };

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-yellow-50 flex flex-col">
//       <Header />
//       <main className="flex-grow">
//         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
//           {/* Back Button */}
//           <Link to="/" className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-6 transition-colors">
//             <ArrowLeft className="h-4 w-4 mr-2" />
//             Back to Home
//           </Link>

//           {/* Page Title */}
//           <div className="mb-8">
//             <h2 className="text-4xl font-bold text-blue-900 mb-2">Pathway Analysis</h2>
//             <p className="text-xl text-blue-700">
//               Select cancer sites, projects, and provide a custom gene list to analyze the noise of a gene pathway.
//             </p>
//           </div>

//           <div className="grid gap-6 mb-8">
//             {/* Cancer Type Selection */}
//             <Card className="border-0 shadow-lg">
//               <CardHeader>
//                 <CardTitle className="text-xl text-blue-800">Select Cancer Sites and Projects</CardTitle>
//               </CardHeader>
//               <CardContent>
//                 <CancerTypeSelector
//                   selectedCancerTypes={selectedCancerTypes}
//                   onCancerTypesChange={setSelectedCancerTypes}
//                   onSitesChange={setSelectedSites}
//                   analysisType={siteAnalysisType}
//                 />
//               </CardContent>
//             </Card>

//             {/* Gene Selector + Upload (ORA only) */}
//             {analysisType === "ORA" && (
//               <>
//                 <GeneSelector
//                   selectedGenes={selectedGenes}
//                   onGenesChange={setSelectedGenes}
//                   // maxGenes={1000} // ✅ you can adjust the limit
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

//             {/* Analyze Button */}
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
// // import { useState } from "react";
// // import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// // import { Button } from "@/components/ui/button";
// // import { Link, useNavigate } from "react-router-dom";
// // import { Activity, ArrowLeft, Dna, ArrowRight } from "lucide-react";
// // import CancerTypeSelector from "@/components/siteSelector";
// // import Header from "@/components/header";
// // import Footer from "@/components/footer";
// // import { useCache } from "@/hooks/use-cache"; 

// // const PathwayAnalysis = () => {
// //   const [selectedCancerTypes, setSelectedCancerTypes] = useState<string[]>([]);
// //   const [selectedGenes, setSelectedGenes] = useState<string[]>([]);
// //   const [geneInput, setGeneInput] = useState<string>("");
// //   const [selectedSites, setSelectedSites] = useState<string[]>([]);
// //   const [analysisType, setAnalysisType] = useState<"ORA" | "GSEA">("ORA");
// //   const [siteAnalysisType, setSiteAnalysisType] = useState<"pan-cancer" | "cancer-specific">("pan-cancer");
// //   const navigate = useNavigate();
// //   const { getCachedData, setCachedData, generateCacheKey } = useCache<any>();

// //   const cacheKey = generateCacheKey({
// //     sites: selectedSites,
// //     cancerTypes: selectedCancerTypes,
// //     genes: selectedGenes,
// //     analysisType,
// //     siteAnalysisType,
// //   });

// //   // Require at least one site for both ORA and GSEA, genes are required for ORA
// //   const canShowAnalysis = selectedSites.length > 0 ;

// //   const handleGeneInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
// //     const input = e.target.value;
// //     setGeneInput(input);
// //     const genes = input
// //       .split(/[\n,]+/)
// //       .map((gene) => gene.trim().toUpperCase())
// //       .filter((gene) => gene.length > 0);
// //     setSelectedGenes(genes);
// //   };

// //   const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
// //     const file = e.target.files?.[0];
// //     if (!file) return;

// //     const reader = new FileReader();
// //     reader.onload = (event) => {
// //       const content = event.target?.result as string;
// //       if (content) {
// //         const parsedGenes = content
// //           .split(/[\n,]+/)
// //           .map((gene) => gene.trim().toUpperCase())
// //           .filter((gene) => gene.length > 0);
// //         setSelectedGenes(parsedGenes);
// //         setGeneInput(parsedGenes.join(", "));
// //       }
// //     };
// //     reader.readAsText(file);
// //   };

// //   const handleAnalyze = () => {
// //     if (canShowAnalysis) {
// //       const params = new URLSearchParams({
// //         sites: selectedSites.join(","),
// //         cancerTypes: selectedCancerTypes.join(","),
// //         genes: selectedGenes.join(","),
// //         analysisType,
// //         siteAnalysisType,
// //       });
// //       // Cache current selections before navigating
// //       setCachedData(cacheKey, {
// //         sites: selectedSites,
// //         cancerTypes: selectedCancerTypes,
// //         genes: selectedGenes,
// //         analysisType,
// //         siteAnalysisType,
// //       });

// //       console.log("Navigating to:", `/pathway-results?${params.toString()}`);
// //       navigate(`/pathway-results?${params.toString()}`);
// //     } else {
// //       console.log("Cannot navigate: Missing required fields", {
// //         selectedSites,
// //         selectedCancerTypes,
// //         selectedGenes,
// //         analysisType,
// //         siteAnalysisType,
// //       });
// //     }
// //   };

// //   return (
// //     <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-yellow-50 flex flex-col">
// //       <Header />
// //       <main className="flex-grow">
// //         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
// //           {/* Back Button */}
// //           <Link
// //             to="/"
// //             className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-6 transition-colors"
// //           >
// //             <ArrowLeft className="h-4 w-4 mr-2" />
// //             Back to Home
// //           </Link>

// //           {/* Page Title */}
// //           <div className="mb-8">
// //             <h2 className="text-4xl font-bold text-blue-900 mb-2">
// //               Pathway Analysis
// //             </h2>
// //             <p className="text-xl text-blue-700">
// //               Select cancer sites, projects, and provide a custom gene list to analyze the noise of a gene pathway.
// //             </p>
// //           </div>

// //           {/* Selection Controls */}
// //           <div className="grid gap-6 mb-8">
// //             {/* Cancer Site and Type Selection */}
// //             <Card className="border-0 shadow-lg">
// //               <CardHeader>
// //                 <CardTitle className="text-xl text-blue-800">
// //                   Select Cancer Sites and Projects
// //                 </CardTitle>
// //               </CardHeader>
// //               <CardContent>
// //                 <CancerTypeSelector
// //                   selectedCancerTypes={selectedCancerTypes}
// //                   onCancerTypesChange={setSelectedCancerTypes}
// //                   onSitesChange={setSelectedSites}
// //                   analysisType={siteAnalysisType}
// //                 />
// //               </CardContent>
// //             </Card>

// //             {/* Site Analysis Type Selection */}
// //             {/* <Card className="border-0 shadow-lg">
// //               <CardHeader>
// //                 <CardTitle className="text-xl text-blue-800">Site Analysis Type</CardTitle>
// //               </CardHeader>
// //               <CardContent>
// //                 <Select
// //                   value={siteAnalysisType}
// //                   onValueChange={(value) => {
// //                     setSiteAnalysisType(value as "pan-cancer" | "cancer-specific");
// //                     // Clear selections when switching analysis type
// //                     setSelectedSites([]);
// //                     setSelectedCancerTypes([]);
// //                   }}
// //                 >
// //                   <SelectTrigger className="w-full">
// //                     <SelectValue placeholder="Select site analysis type" />
// //                   </SelectTrigger>
// //                   <SelectContent>
// //                     <SelectItem value="pan-cancer">Pan-Cancer Analysis</SelectItem>
// //                     <SelectItem value="cancer-specific">Cancer-Specific Analysis</SelectItem>
// //                   </SelectContent>
// //                 </Select>
// //               </CardContent>
// //             </Card> */}

// //             {/* Pathway Analysis Type Selection */}
// //             {/* <Card className="border-0 shadow-lg">
// //               <CardHeader>
// //                 <CardTitle className="text-xl text-blue-800">Pathway Analysis Type</CardTitle>
// //               </CardHeader>
// //               <CardContent>
// //                 <Select
// //                   value={analysisType}
// //                   onValueChange={(value) => setAnalysisType(value as "ORA" | "GSEA")}
// //                 >
// //                   <SelectTrigger className="w-full">
// //                     <SelectValue placeholder="Select analysis type" />
// //                   </SelectTrigger>
// //                   <SelectContent>
// //                     <SelectItem value="ORA">ORA (Over-Representation Analysis)</SelectItem>
// //                     <SelectItem value="GSEA">GSEA (Gene Set Enrichment Analysis)</SelectItem>
// //                   </SelectContent>
// //                 </Select>
// //               </CardContent>
// //             </Card> */}

// //             {/* Gene Input (only shown for ORA) */}
// //             {analysisType === "ORA" && (
// //               <Card className="border-0 shadow-lg">
// //                 <CardHeader>
// //                   <CardTitle className="text-xl text-blue-800">
// //                     Custom Gene List
// //                   </CardTitle>
// //                 </CardHeader>
// //                 <CardContent className="space-y-4">
// //                   <div className="flex items-center space-x-2">
// //                     <input
// //                       type="text"
// //                       value={geneInput}
// //                       onChange={handleGeneInputChange}
// //                       placeholder="Enter genes (comma-separated or one per line, e.g., BRCA1,TP53)"
// //                       className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600"
// //                     />
// //                     <Button
// //                       onClick={() => {
// //                         const exampleGenes = "BRCA1,TP53,EGFR,KRAS,RNASET2,BRCA2,PTEN";
// //                         setGeneInput(exampleGenes);
// //                         setSelectedGenes(exampleGenes.split(",").map((gene) => gene.trim().toUpperCase()));
// //                       }}
// //                       className="bg-blue-500 hover:bg-blue-600 text-white"
// //                     >
// //                       <Dna className="h-5 w-5 mr-2" />
// //                       Example Gene List
// //                     </Button>
// //                   </div>
// //                   <div>
// //                     <label className="block mb-1 text-blue-700 font-medium">
// //                       Or Upload Gene List File (.txt)
// //                     </label>
// //                     <input
// //                       type="file"
// //                       accept=".txt"
// //                       onChange={handleFileUpload}
// //                       className="mt-1"
// //                     />
// //                   </div>
// //                   {selectedGenes.length > 0 && (
// //                     <p className="text-sm text-blue-600">
// //                       Selected genes: {selectedGenes.join(", ")}
// //                     </p>
// //                   )}
// //                 </CardContent>
// //               </Card>
// //             )}

// //             {/* Analyze Button */}
// //             <div className="flex justify-center">
// //               <Button
// //                 onClick={handleAnalyze}
// //                 disabled={!canShowAnalysis}
// //                 className={`px-8 py-3 text-lg ${
// //                   canShowAnalysis
// //                     ? "bg-blue-600 hover:bg-blue-700 text-white"
// //                     : "bg-gray-300 text-gray-500 cursor-not-allowed"
// //                 }`}
// //               >
// //                 <Activity className="h-5 w-5 mr-2" />
// //                 Analyze{" "}
// //                 {analysisType === "ORA" && selectedGenes.length > 0
// //                   ? `${selectedGenes.length} Gene${selectedGenes.length > 1 ? "s" : ""}`
// //                   : ""}
// //                 <ArrowRight className="h-5 w-5 ml-2" />
// //               </Button>
// //             </div>
// //           </div>
// //         </div>
// //       </main>
// //       <Footer />
// //     </div>
// //   );
// // };

// // export default PathwayAnalysis;
// import { useState } from "react";
// import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
// import { Button } from "@/components/ui/button";
// import { Link, useNavigate } from "react-router-dom";
// import { Activity, ArrowLeft, Dna, ArrowRight } from "lucide-react";
// import CancerTypeSelector from "@/components/siteSelector";
// import Header from "@/components/header";
// import Footer from "@/components/footer";
// import { useCache } from "@/hooks/use-cache";
// import GeneSelector from "@/components/GeneSelector";

// const PathwayAnalysis = () => {
//   const [selectedCancerTypes, setSelectedCancerTypes] = useState<string[]>([]);
//   const [selectedGenes, setSelectedGenes] = useState<string[]>([]);
//   const [selectedSite, setSelectedSite] = useState<string | null>(null); // Changed to single塌
//   const [analysisType, setAnalysisType] = useState<"ORA" | "GSEA">("ORA");
//   const [siteAnalysisType, setSiteAnalysisType] = useState<"pan-cancer" | "cancer-specific">("pan-cancer");
//   const navigate = useNavigate();
//   const { getCachedData, setCachedData, generateCacheKey } = useCache<any>();

//   const cacheKey = generateCacheKey({
//     sites: selectedSite || "", // Handle single site
//     cancerTypes: selectedCancerTypes,
//     genes: selectedGenes,
//     analysisType,
//     siteAnalysisType,
//   });

//   const canShowAnalysis = selectedSite !== null; // Updated condition

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
//         sites: selectedSite || "", // Single site
//         cancerTypes: selectedCancerTypes.join(","),
//         genes: selectedGenes.join(","),
//         analysisType,
//         siteAnalysisType,
//       });

//       setCachedData(cacheKey, {
//         sites: selectedSite,
//         cancerTypes: selectedCancerTypes,
//         genes: selectedGenes,
//         analysisType,
//         siteAnalysisType,
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
//               Select a cancer site, projects, and provide a custom gene list to analyze the noise of a gene pathway.
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
//                   onSitesChange={setSelectedSite} // Updated to handle single site
//                   analysisType={siteAnalysisType}
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
  const [selectedSites, setSelectedSites] = useState<string[]>([]); // Array, but max one site for cancer-specific
  const [analysisType, setAnalysisType] = useState<"ORA" | "GSEA">("ORA");
  const navigate = useNavigate();
  const { getCachedData, setCachedData, generateCacheKey } = useCache<any>();

  const cacheKey = generateCacheKey({
    sites: selectedSites,
    cancerTypes: selectedCancerTypes,
    genes: selectedGenes,
    analysisType,
    // siteAnalysisType: "cancer-specific", // Hardcoded
    siteAnalysisType: "pan-cancer", // Hardcoded
  });

  const canShowAnalysis = selectedSites.length > 0; // At least one site selected

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
        sites: selectedSites.join(","), // Single site as a string
        cancerTypes: selectedCancerTypes.join(","),
        genes: selectedGenes.join(","),
        analysisType,
        // siteAnalysisType: "cancer-specific", // Hardcoded
        siteAnalysisType: "pan-cancer", // Hardcoded
      });

      setCachedData(cacheKey, {
        sites: selectedSites,
        cancerTypes: selectedCancerTypes,
        genes: selectedGenes,
        analysisType,
        // siteAnalysisType: "cancer-specific",
        siteAnalysisType: "pan-cancer", // Hardcoded
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
              Select a cancer site and projects, and provide a custom gene list to analyze the noise of a gene pathway.
            </p>
          </div>

          <div className="grid gap-6 mb-8">
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="text-xl text-blue-800">Select Cancer Site and Projects</CardTitle>
              </CardHeader>
              <CardContent>
                <CancerTypeSelector
                  selectedCancerTypes={selectedCancerTypes}
                  onCancerTypesChange={setSelectedCancerTypes}
                  onSitesChange={setSelectedSites} // Passes array, but max one site
                  // analysisType="cancer-specific" // Hardcoded
                  analysisType= "pan-cancer" // Hardcoded
                />
              </CardContent>
            </Card>

            {analysisType === "ORA" && (
              <>
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
              </>
            )}

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
                {analysisType === "ORA" && selectedGenes.length > 0
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