// // import { useState } from "react";
// // import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// // import { Button } from "@/components/ui/button";
// // import { Link, useNavigate } from "react-router-dom";
// // import { Activity, ArrowLeft, Dna, ArrowRight } from "lucide-react";
// // import CancerTypeSelector from "@/components/siteSelector";
// // import Header from "@/components/header";
// // import Footer from "@/components/footer";

// // const PathwayAnalysis = () => {
// //   const [selectedCancerTypes, setSelectedCancerTypes] = useState<string[]>([]); // Array for multiple cancer types
// //   // const [selectedGenes, setSelectedGenes] = useState<string[]>([]);
// //   const [selectedSite, setSelectedSite] = useState<string>(""); // Required site
// //   const navigate = useNavigate();

// //   // Require site and genes, but cancerTypes is optional
// //   const canShowAnalysis = selectedSite;

// //   const handleAnalyze = () => {
// //     if (canShowAnalysis) {
// //       const params = new URLSearchParams({
// //         site: selectedSite,
// //         cancerTypes: selectedCancerTypes.join(","), // Empty string if no cancer types
// //         // genes: selectedGenes.join(","),
// //       });
// //       console.log("Navigating to:", `/pathway-results?${params.toString()}`);
// //       navigate(`/pathway-results?${params.toString()}`);
// //     } else {
// //       console.log("Cannot navigate: Missing required fields", {
// //         selectedSite,
// //         selectedCancerTypes,
// //         // selectedGenes,
// //       });
// //     }
// //   };

// //   return (
// //     // <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-yellow-50">
// //     <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-yellow-50 flex flex-col">
// //       < Header/>
// //       <main className="flex-grow">

// //       <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
// //         {/* Back Button */}
// //         <Link
// //           to="/"
// //           className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-6 transition-colors"
// //         >
// //           <ArrowLeft className="h-4 w-4 mr-2" />
// //           Back to Home
// //         </Link>

// //         {/* Page Title */}
// //         <div className="mb-8">
// //           <h2 className="text-4xl font-bold text-blue-900 mb-2">
// //             Pathway Analysis
// //           </h2>
// //           <p className="text-xl text-blue-700">
// //             Select a cancer site and types to analyse the noise of a gene pathway.
// //           </p>
// //           <p className="text-lg text-blue-700">
// //           </p>
// //         </div>

// //         {/* Selection Controls */}
// //         <div className="grid gap-6 mb-8">
// //           {/* Cancer Site and Type Selection */}
// //           <Card className="border-0 shadow-lg">
// //             <CardHeader>
// //               <CardTitle className="text-xl text-blue-800">
// //                 Select Cancer Site and Type
// //               </CardTitle>
// //             </CardHeader>
// //             <CardContent>
// //               <CancerTypeSelector
// //                 selectedCancerTypes={selectedCancerTypes}
// //                 onCancerTypesChange={setSelectedCancerTypes}
// //                 onSiteChange={setSelectedSite}
// //               />
// //             </CardContent>
// //           </Card>

// //           {/* Gene Selection */}
// //           {/* {selectedSite && (
// //             <GeneSelector
// //               selectedGenes={selectedGenes}
// //               onGenesChange={setSelectedGenes}
// //             />
// //           )} */}

// //           {/* Analyze Button */}
// //           <div className="flex justify-center">
// //             <Button
// //               onClick={handleAnalyze}
// //               disabled={!canShowAnalysis}
// //               className={`px-8 py-3 text-lg ${
// //                 canShowAnalysis
// //                   ? "bg-blue-600 hover:bg-blue-700 text-white"
// //                   : "bg-gray-300 text-gray-500 cursor-not-allowed"
// //               }`}
// //             >
// //               <Activity className="h-5 w-5 mr-2" />
// //               Analyze{" "}
// //               {/* {selectedGenes.length > 0
// //                 ? `${selectedGenes.length} Gene${selectedGenes.length > 1 ? "s" : ""}`
// //                 : ""} */}
// //               <ArrowRight className="h-5 w-5 ml-2" />
// //             </Button>
// //           </div>
// //         </div>

// //       </div>
// //       </main>
// //     <Footer />
// //     </div>
// //   );
// // };

// // export default PathwayAnalysis;
// import { useState } from "react";
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// import { Button } from "@/components/ui/button";
// import { Link, useNavigate } from "react-router-dom";
// import { Activity, ArrowLeft, Dna, ArrowRight } from "lucide-react";
// import CancerTypeSelector from "@/components/siteSelector";
// import Header from "@/components/header";
// import Footer from "@/components/footer";


// const PathwayAnalysis = () => {
//   const [selectedMethod, setSelectedMethod] = useState<"ORA" | "GSEA">("ORA"); // ✅ moved inside
//   const [customGeneInput, setCustomGeneInput] = useState(""); // ✅ moved inside
//   const [selectedCancerTypes, setSelectedCancerTypes] = useState<string[]>([]);
//   const [selectedGenes, setSelectedGenes] = useState<string[]>([]);
//   const [geneInput, setGeneInput] = useState<string>("");
//   const [selectedSite, setSelectedSite] = useState<string>("");

//   const navigate = useNavigate();

//   // Require site, genes are optional
//   const canShowAnalysis = selectedSite;

//  const handleGeneInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//   const input = e.target.value;
//   setGeneInput(input);
//   const genes = input
//     .split(/[\n,]+/)
//     .map((gene) => gene.trim().toUpperCase())  // 👈 normalize to uppercase
//     .filter((gene) => gene.length > 0);
//   setSelectedGenes(genes);
// };


//   // const handleAnalyze = () => {
//   //   if (canShowAnalysis) {
//   //     const params = new URLSearchParams({
//   //       site: selectedSite,
//   //       cancerTypes: selectedCancerTypes.join(","),
//   //       genes: selectedGenes.join(","),
//   //     });
//   //     console.log("Navigating to:", `/pathway-results?${params.toString()}`);
//   //     navigate(`/pathway-results?${params.toString()}`);
//   //   } else {
//   //     console.log("Cannot navigate: Missing required fields", {
//   //       selectedSite,
//   //       selectedCancerTypes,
//   //       selectedGenes,
//   //     });
//   //   }
//   // };
//   const handleAnalyze = () => {
//     const selectedGenes = customGeneInput
//       .split(/[\s,]+/)
//       .map((g) => g.trim().toUpperCase())
//       .filter((g) => g);

//     if (selectedMethod === "ORA" && selectedGenes.length === 0) {
//       alert("Please enter a custom gene list for ORA.");
//       return;
//     }

//     const params = new URLSearchParams({
//       site: selectedSite,
//       cancerTypes: selectedCancerTypes.join(","),
//       genes: selectedGenes.join(","),
//       method: selectedMethod,
//     });

//     navigate(`/pathway-results?${params.toString()}`);
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
//               Pathway Analysis
//             </h2>
//             <p className="text-xl text-blue-700">
//               Select a cancer site and types, and optionally provide a custom gene list to analyze the noise of a gene pathway.
//             </p>
//           </div>

//           {/* Selection Controls */}
//           <div className="grid gap-6 mb-8">
//             {/* Cancer Site and Type Selection */}
//             <Card className="border-0 shadow-lg">
//               <CardHeader>
//                 <CardTitle className="text-xl text-blue-800">
//                   Select Cancer Site and Type
//                 </CardTitle>
//               </CardHeader>
//               <CardContent>
//                 <CancerTypeSelector
//                   selectedCancerTypes={selectedCancerTypes}
//                   onCancerTypesChange={setSelectedCancerTypes}
//                   onSiteChange={setSelectedSite}
//                 />
//               </CardContent>
//             </Card>
//             <Card className="border-0 shadow-lg">
//               <CardHeader>
//                 <CardTitle className="text-xl text-blue-800">Analysis Method</CardTitle>
//               </CardHeader>
//               <CardContent>
//                 <div className="flex space-x-4">
//                   <label className="flex items-center space-x-2">
//                     <input
//                       type="radio"
//                       value="ORA"
//                       checked={selectedMethod === "ORA"}
//                       onChange={() => setSelectedMethod("ORA")}
//                     />
//                     <span>Overrepresentation Analysis (ORA)</span>
//                   </label>
//                   <label className="flex items-center space-x-2">
//                     <input
//                       type="radio"
//                       value="GSEA"
//                       checked={selectedMethod === "GSEA"}
//                       onChange={() => setSelectedMethod("GSEA")}
//                     />
//                     <span>Gene Set Enrichment Analysis (GSEA)</span>
//                   </label>
//                 </div>
//               </CardContent>
//             </Card>
//             {selectedMethod === "ORA" && (
//             <Card className="mt-4 border-0 shadow-md">
//               <CardHeader>
//                 <CardTitle className="text-lg text-blue-800">
//                   Custom Gene List (Required for ORA)
//                 </CardTitle>
//               </CardHeader>
//               <CardContent>
//                 <textarea
//                   className="w-full border rounded-md p-2 text-sm"
//                   placeholder="Enter gene symbols (e.g., BRCA1, TP53), comma-separated or one per line"
//                   rows={5}
//                   value={customGeneInput}
//                   onChange={(e) => setCustomGeneInput(e.target.value)}
//                 />
//               </CardContent>
//             </Card>
//           )}


//             {/* Gene Input */}
//             <Card className="border-0 shadow-lg">
//               <CardHeader>
//                 <CardTitle className="text-xl text-blue-800">
//                   Custom Gene List (Optional)
//                 </CardTitle>
//               </CardHeader>
//               {/* <CardContent>
//                 <input
//                   type="text"
//                   value={geneInput}
//                   onChange={handleGeneInputChange}
//                   placeholder="Enter genes (comma-separated, e.g., BRCA1,TP53)"
//                   className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600"
//                 />
//                 {selectedGenes.length > 0 && (
//                   <p className="mt-2 text-sm text-blue-600">
//                     Selected genes: {selectedGenes.join(", ")}
//                   </p>
//                 )}
//               </CardContent> */}
//               <CardContent className="space-y-4">
//                   <input
//                     type="text"
//                     value={geneInput}
//                     onChange={handleGeneInputChange}
//                     placeholder="Enter genes (comma-separated or one per line)"
//                     className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600"
//                   />

//                   <div>
//                     <label className="block mb-1 text-blue-700 font-medium">
//                       Or Upload Gene List File (.txt)
//                     </label>
//                     <input
//                       type="file"
//                       accept=".txt"
//                       onChange={(e) => {
//                         const file = e.target.files?.[0];
//                         if (!file) return;

//                         const reader = new FileReader();
//                         reader.onload = (event) => {
//                           const content = event.target?.result as string;
//                           if (content) {
//                             // Split by commas and newlines, normalize whitespace
//                           //   const parsedGenes = content
//                           //     .split(/[\n,]+/)
//                           //     .map((gene) => gene.trim())
//                           //     .filter((gene) => gene.length > 0);
//                           //   setSelectedGenes(parsedGenes);
//                           //   setGeneInput(parsedGenes.join(", "));
//                           // }
//                           const parsedGenes = content
//                           .split(/[\n,]+/)
//                           .map((gene) => gene.trim().toUpperCase())  // 👈 normalize to uppercase
//                           .filter((gene) => gene.length > 0);
//                           }
//                         };
//                         reader.readAsText(file);
//                       }}
//                       className="mt-1"
//                     />
//                   </div>

//                   {selectedGenes.length > 0 && (
//                     <p className="text-sm text-blue-600">
//                       Selected genes: {selectedGenes.join(", ")}
//                     </p>
//                   )}
//                 </CardContent>

//             </Card>

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
//                 {selectedGenes.length > 0
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link, useNavigate } from "react-router-dom";
import { Activity, ArrowLeft, Dna, ArrowRight } from "lucide-react";
import CancerTypeSelector from "@/components/siteSelector";
import Header from "@/components/header";
import Footer from "@/components/footer";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const PathwayAnalysis = () => {
  const [selectedCancerTypes, setSelectedCancerTypes] = useState<string[]>([]);
  const [selectedGenes, setSelectedGenes] = useState<string[]>([]);
  const [geneInput, setGeneInput] = useState<string>("");
  const [selectedSite, setSelectedSite] = useState<string>("");
  const [analysisType, setAnalysisType] = useState<"ORA" | "GSEA">("ORA");
  const navigate = useNavigate();

  // Require site for both ORA and GSEA, genes are required for ORA
  // const canShowAnalysis = selectedSite && (analysisType === "GSEA" || selectedGenes.length > 0);
  const canShowAnalysis = !!selectedSite;


  const handleGeneInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value;
    setGeneInput(input);
    const genes = input
      .split(/[\n,]+/)
      .map((gene) => gene.trim().toUpperCase())
      .filter((gene) => gene.length > 0);
    setSelectedGenes(genes);
  };

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
        setGeneInput(parsedGenes.join(", "));
      }
    };
    reader.readAsText(file);
  };

  const handleAnalyze = () => {
    if (canShowAnalysis) {
      const params = new URLSearchParams({
        site: selectedSite,
        cancerTypes: selectedCancerTypes.join(","),
        genes: selectedGenes.join(","),
        analysisType,
      });
      console.log("Navigating to:", `/pathway-results?${params.toString()}`);
      navigate(`/pathway-results?${params.toString()}`);
    } else {
      console.log("Cannot navigate: Missing required fields", {
        selectedSite,
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
              Pathway Analysis
            </h2>
            <p className="text-xl text-blue-700">
              Select a cancer site and project, choose analysis type (ORA or GSEA), and provide a custom gene list for ORA to analyze the noise of a gene pathway.
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

            {/* Analysis Type Selection */}
              <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="text-xl text-blue-800">Analysis Type</CardTitle>
              </CardHeader>
              <CardContent>
                <Select
                  value={analysisType}
                  onValueChange={(value) => setAnalysisType(value as "ORA" | "GSEA")}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select analysis type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ORA">ORA (Over-Representation Analysis)</SelectItem>
                    <SelectItem value="GSEA">GSEA (Gene Set Enrichment Analysis)</SelectItem>
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>


            

            {/* Gene Input (only shown for ORA) */}
            {analysisType === "ORA" && (
              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="text-xl text-blue-800">
                    Custom Gene List
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <input
                    type="text"
                    value={geneInput}
                    onChange={handleGeneInputChange}
                    placeholder="Enter genes (comma-separated or one per line, e.g., BRCA1,TP53)"
                    className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                  <div>
                    <label className="block mb-1 text-blue-700 font-medium">
                      Or Upload Gene List File (.txt)
                    </label>
                    <input
                      type="file"
                      accept=".txt"
                      onChange={handleFileUpload}
                      className="mt-1"
                    />
                  </div>
                  {selectedGenes.length > 0 && (
                    <p className="text-sm text-blue-600">
                      Selected genes: {selectedGenes.join(", ")}
                    </p>
                  )}
                </CardContent>
              </Card>
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
                {/* {analysisType === "ORA" && selectedGenes.length > 0
                  ? `${selectedGenes.length} Gene${selectedGenes.length > 1 ? "s" : ""}`
                  : ""} */}
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

// import { useState } from "react";
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// import { Button } from "@/components/ui/button";
// import { Link, useNavigate } from "react-router-dom";
// import { Activity, ArrowLeft, Dna, ArrowRight } from "lucide-react";
// import CancerTypeSelector from "@/components/siteSelector";
// import Header from "@/components/header";
// import Footer from "@/components/footer";


// const PathwayAnalysis = () => {
//   const [selectedMethod, setSelectedMethod] = useState<"ORA" | "GSEA">("ORA"); // ✅ moved inside
//   const [customGeneInput, setCustomGeneInput] = useState(""); // ✅ moved inside
//   const [selectedCancerTypes, setSelectedCancerTypes] = useState<string[]>([]);
//   const [selectedGenes, setSelectedGenes] = useState<string[]>([]);
//   const [geneInput, setGeneInput] = useState<string>("");
//   const [selectedSite, setSelectedSite] = useState<string>("");

//   const navigate = useNavigate();

//   // Require site, genes are optional
//   const canShowAnalysis = selectedSite;

//  const handleGeneInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//   const input = e.target.value;
//   setGeneInput(input);
//   const genes = input
//     .split(/[\n,]+/)
//     .map((gene) => gene.trim().toUpperCase())  // 👈 normalize to uppercase
//     .filter((gene) => gene.length > 0);
//   setSelectedGenes(genes);
// };


//   // const handleAnalyze = () => {
//   //   if (canShowAnalysis) {
//   //     const params = new URLSearchParams({
//   //       site: selectedSite,
//   //       cancerTypes: selectedCancerTypes.join(","),
//   //       genes: selectedGenes.join(","),
//   //     });
//   //     console.log("Navigating to:", `/pathway-results?${params.toString()}`);
//   //     navigate(`/pathway-results?${params.toString()}`);
//   //   } else {
//   //     console.log("Cannot navigate: Missing required fields", {
//   //       selectedSite,
//   //       selectedCancerTypes,
//   //       selectedGenes,
//   //     });
//   //   }
//   // };
//   const handleAnalyze = () => {
//     const selectedGenes = customGeneInput
//       .split(/[\s,]+/)
//       .map((g) => g.trim().toUpperCase())
//       .filter((g) => g);

//     if (selectedMethod === "ORA" && selectedGenes.length === 0) {
//       alert("Please enter a custom gene list for ORA.");
//       return;
//     }

//     const params = new URLSearchParams({
//       site: selectedSite,
//       cancerTypes: selectedCancerTypes.join(","),
//       genes: selectedGenes.join(","),
//       method: selectedMethod,
//     });

//     navigate(`/pathway-results?${params.toString()}`);
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
//               Pathway Analysis
//             </h2>
//             <p className="text-xl text-blue-700">
//               Select a cancer site and types, and optionally provide a custom gene list to analyze the noise of a gene pathway.
//             </p>
//           </div>

//           {/* Selection Controls */}
//           <div className="grid gap-6 mb-8">
//             {/* Cancer Site and Type Selection */}
//             <Card className="border-0 shadow-lg">
//               <CardHeader>
//                 <CardTitle className="text-xl text-blue-800">
//                   Select Cancer Site and Type
//                 </CardTitle>
//               </CardHeader>
//               <CardContent>
//                 <CancerTypeSelector
//                   selectedCancerTypes={selectedCancerTypes}
//                   onCancerTypesChange={setSelectedCancerTypes}
//                   onSiteChange={setSelectedSite}
//                 />
//               </CardContent>
//             </Card>
//             <Card className="border-0 shadow-lg">
//               <CardHeader>
//                 <CardTitle className="text-xl text-blue-800">Analysis Method</CardTitle>
//               </CardHeader>
//               <CardContent>
//                 <div className="flex space-x-4">
//                   <label className="flex items-center space-x-2">
//                     <input
//                       type="radio"
//                       value="ORA"
//                       checked={selectedMethod === "ORA"}
//                       onChange={() => setSelectedMethod("ORA")}
//                     />
//                     <span>Overrepresentation Analysis (ORA)</span>
//                   </label>
//                   <label className="flex items-center space-x-2">
//                     <input
//                       type="radio"
//                       value="GSEA"
//                       checked={selectedMethod === "GSEA"}
//                       onChange={() => setSelectedMethod("GSEA")}
//                     />
//                     <span>Gene Set Enrichment Analysis (GSEA)</span>
//                   </label>
//                 </div>
//               </CardContent>
//             </Card>
//             {selectedMethod === "ORA" && (
//             <Card className="mt-4 border-0 shadow-md">
//               <CardHeader>
//                 <CardTitle className="text-lg text-blue-800">
//                   Custom Gene List (Required for ORA)
//                 </CardTitle>
//               </CardHeader>
//               <CardContent>
//                 <textarea
//                   className="w-full border rounded-md p-2 text-sm"
//                   placeholder="Enter gene symbols (e.g., BRCA1, TP53), comma-separated or one per line"
//                   rows={5}
//                   value={customGeneInput}
//                   onChange={(e) => setCustomGeneInput(e.target.value)}
//                 />
//               </CardContent>
//             </Card>
//           )}


//             {/* Gene Input */}
//             <Card className="border-0 shadow-lg">
//               <CardHeader>
//                 <CardTitle className="text-xl text-blue-800">
//                   Custom Gene List (Optional)
//                 </CardTitle>
//               </CardHeader>
//               {/* <CardContent>
//                 <input
//                   type="text"
//                   value={geneInput}
//                   onChange={handleGeneInputChange}
//                   placeholder="Enter genes (comma-separated, e.g., BRCA1,TP53)"
//                   className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600"
//                 />
//                 {selectedGenes.length > 0 && (
//                   <p className="mt-2 text-sm text-blue-600">
//                     Selected genes: {selectedGenes.join(", ")}
//                   </p>
//                 )}
//               </CardContent> */}
//               <CardContent className="space-y-4">
//                   <input
//                     type="text"
//                     value={geneInput}
//                     onChange={handleGeneInputChange}
//                     placeholder="Enter genes (comma-separated or one per line)"
//                     className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600"
//                   />

//                   <div>
//                     <label className="block mb-1 text-blue-700 font-medium">
//                       Or Upload Gene List File (.txt)
//                     </label>
//                     <input
//                       type="file"
//                       accept=".txt"
//                       onChange={(e) => {
//                         const file = e.target.files?.[0];
//                         if (!file) return;

//                         const reader = new FileReader();
//                         reader.onload = (event) => {
//                           const content = event.target?.result as string;
//                           if (content) {
//                             // Split by commas and newlines, normalize whitespace
//                           //   const parsedGenes = content
//                           //     .split(/[\n,]+/)
//                           //     .map((gene) => gene.trim())
//                           //     .filter((gene) => gene.length > 0);
//                           //   setSelectedGenes(parsedGenes);
//                           //   setGeneInput(parsedGenes.join(", "));
//                           // }
//                           const parsedGenes = content
//                           .split(/[\n,]+/)
//                           .map((gene) => gene.trim().toUpperCase())  // 👈 normalize to uppercase
//                           .filter((gene) => gene.length > 0);
//                           }
//                         };
//                         reader.readAsText(file);
//                       }}
//                       className="mt-1"
//                     />
//                   </div>

//                   {selectedGenes.length > 0 && (
//                     <p className="text-sm text-blue-600">
//                       Selected genes: {selectedGenes.join(", ")}
//                     </p>
//                   )}
//                 </CardContent>

//             </Card>

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
//                 {selectedGenes.length > 0
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