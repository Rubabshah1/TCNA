import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, Loader2, Download } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import GeneSelector from "@/components/GeneSelector";
import Header from "@/components/header";
import Footer from "@/components/footer";
import { useCache } from "@/hooks/use-cache";

const UploadAnalysis = () => {
  const [selectedGenes, setSelectedGenes] = useState<string[]>([]);
  const [expressionFile, setExpressionFile] = useState<File | null>(null);
  const [topN, setTopN] = useState<string>("15");
  const [analysisType, setAnalysisType] = useState<string>("Pathway");
  const [geneSet, setGeneSet] = useState<string>("KEGG_2021_Human");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const { toast } = useToast();
  const { getCachedData, setCachedData, generateCacheKey } = useCache();
  const navigate = useNavigate();

  const handleExpressionFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const selectedFile = event.target.files[0];
      if (selectedFile.name.endsWith('.csv') || selectedFile.name.endsWith('.tsv')) {
        setExpressionFile(selectedFile);
      } else {
        toast({
          title: "Invalid File Type",
          description: "Expression data file must be CSV or TSV.",
          variant: "destructive",
        });
        setExpressionFile(null);
      }
    }
  };

  const handleDownloadSample = () => {
    // Sample CSV content based on the table structure
    const sampleData = `gene_id,gene_name,SampleA,SampleB
ENSG00000000003.15,TSPAN6,11.9592,21.8393
ENSG00000000005.6,TNMD,0.4836,1.0798
ENSG00000000419.13,DPM1,117.9028,97.2087`;

    // Create a Blob with the CSV content
    const blob = new Blob([sampleData], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    
    // Create a temporary link element to trigger the download
    const link = document.createElement('a');
    link.href = url;
    link.download = 'sample_expression_data.csv';
    document.body.appendChild(link);
    link.click();
    
    // Clean up
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);

    toast({
      title: "Sample File Downloaded",
      description: "Sample expression data file has been downloaded.",
    });
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!expressionFile) {
      toast({
        title: "No File Uploaded",
        description: "Please upload an expression data file (CSV or TSV).",
        variant: "destructive",
      });
      return;
    }

    if (analysisType === 'Tumor' && !expressionFile) {
      toast({
        title: "No Expression Data",
        description: "Tumor Analysis requires an expression data file.",
        variant: "destructive",
      });
      return;
    }
    if ((analysisType === 'Gene' || analysisType === 'Pathway') && !expressionFile) {
      toast({
        title: "No File Provided",
        description: "Please upload an expression data file.",
        variant: "destructive",
      });
      return;
    }
    if ((analysisType === 'Gene' || analysisType === 'Pathway') && !selectedGenes.length) {
      toast({
        title: "No Input Provided",
        description: "Please select genes.",
        variant: "destructive",
      });
      return;
    }
    

    setIsLoading(true);

    const cacheParams = {
      genes: selectedGenes.sort().join(','),
      expressionFile: expressionFile ? `${expressionFile.name}_${expressionFile.size}` : null,
      analysisType,
      geneSet,
      topN,
    };
    const cacheKey = generateCacheKey(cacheParams);

    const cachedResult = getCachedData(cacheKey);
    if (cachedResult) {
      navigate('/upload-results', { state: { results: cachedResult, analysisType } });
      toast({
        title: "Loaded from Cache",
        description: `Results for ${analysisType} Analysis loaded from cache.`,
      });
      setIsLoading(false);
      return;
    }

    const formData = new FormData();
    if (selectedGenes.length) {
      formData.append('genes', selectedGenes.join(','));
    }
    if (expressionFile) {
      formData.append('expression_file', expressionFile);
      formData.append('top_n', topN);
    }
    formData.append('analysis_type', analysisType);
    if (analysisType === 'Pathway') {
      formData.append('gene_set', geneSet);
    }

    try {
      const response = await fetch('/api/csv-upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to process input');
      }

      const result = await response.json();
      setCachedData(cacheKey, result);
      navigate('/upload-results', { state: { results: result, analysisType } });
      toast({
        title: "Upload Successful",
        description: `Input processed successfully for ${analysisType} Analysis. Redirecting to results...`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to process input: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-yellow-50 flex flex-col">
      <Header />
      <main className="flex-grow py-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-0 lg:pl-0 lg:pr-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl font-bold text-blue-900">
                Upload Gene Expression Data
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div>
                <Label htmlFor="analysis-type" className="text-blue-900">
                  Analysis Type
                </Label>
                <Select value={analysisType} onValueChange={setAnalysisType}>
                  <SelectTrigger id="analysis-type">
                    <SelectValue placeholder="Select analysis type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Gene">Gene Analysis</SelectItem>
                    <SelectItem value="Pathway">Pathway Analysis</SelectItem>
                    <SelectItem value="Tumor">Tumor Analysis</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="mt-6">
                <Label htmlFor="expression-file-upload" className="text-blue-900">
                  Upload Expression Data File
                </Label>
                <p className="text-sm text-blue-700 mb-2">
                  File must contain 'Hugo_Symbol' or 'gene_name' columns, followed by tumor sample expression data (e.g., TCGA-...).
                </p>
                <div className="overflow-x-auto mb-4 border border-gray-200 rounded-md">
                  <table className="min-w-full text-sm text-left border-collapse">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="px-4 py-2 border">gene_id</th>
                        <th className="px-4 py-2 border">gene_name</th>
                        <th className="px-4 py-2 border">SampleA</th>
                        <th className="px-4 py-2 border">SampleB</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="px-4 py-2 border">ENSG00000000003.15</td>
                        <td className="px-4 py-2 border">TSPAN6</td>
                        <td className="px-4 py-2 border">11.9592</td>
                        <td className="px-4 py-2 border">21.8393</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-2 border">ENSG00000000005.6</td>
                        <td className="px-4 py-2 border">TNMD</td>
                        <td className="px-4 py-2 border">0.4836</td>
                        <td className="px-4 py-2 border">1.0798</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-2 border">ENSG00000000419.13</td>
                        <td className="px-4 py-2 border">DPM1</td>
                        <td className="px-4 py-2 border">117.9028</td>
                        <td className="px-4 py-2 border">97.2087</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <div className="flex space-x-4 items-center">
                  <Input
                    id="expression-file-upload"
                    type="file"
                    accept=".csv,.tsv"
                    onChange={handleExpressionFileChange}
                    className="file:mr-4 file:py-0 file:px-6 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />
                  <Button
                    type="button"
                    onClick={handleDownloadSample}
                    className="bg-gradient-to-r from-blue-600 to-blue-900 text-white px-3 py-2"
                  >
                    <Download className="mr-2 h-3 w-3" />
                    Download Sample File
                  </Button>
                </div>
              </div>
              <form onSubmit={handleSubmit} className="space-y-6 mt-6">
                {(analysisType === 'Gene' || analysisType === 'Pathway') && (
                  <div>
                    <GeneSelector
                      selectedGenes={selectedGenes}
                      onGenesChange={setSelectedGenes}
                    />
                  </div>
                )}
                {analysisType === 'Pathway' && (
                  <div>
                    <Label htmlFor="gene-set" className="text-blue-900">
                      Gene Set Library
                    </Label>
                    <Select value={geneSet} onValueChange={setGeneSet}>
                      <SelectTrigger id="gene-set">
                        <SelectValue placeholder="Select gene set" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="KEGG_2021_Human">KEGG 2021 Human</SelectItem>
                        <SelectItem value="GO_Biological_Process_2021">GO Biological Process 2021</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
                <div className="flex justify-center items-center py-7">
                  <Button
                    type="submit"
                    disabled={
                      isLoading ||
                      (analysisType === 'Tumor' && !expressionFile) ||
                      (analysisType === 'Gene' && !expressionFile && !selectedGenes.length) ||
                      (analysisType === 'Pathway' && !expressionFile && !selectedGenes.length)
                    }
                    className="bg-gradient-to-r from-blue-600 to-blue-900 text-white px-3 py-2"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <Upload className="mr-2 h-3 w-3" />
                        Analyze Input
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default UploadAnalysis;
// import React, { useState } from 'react';
// import { useNavigate } from 'react-router-dom';
// import { Button } from "@/components/ui/button";
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// import { Input } from "@/components/ui/input";
// import { Label } from "@/components/ui/label";
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
// import { Upload, Loader2 } from "lucide-react";
// import { useToast } from "@/components/ui/use-toast";
// import GeneSelector from "@/components/GeneSelector";
// import Header from "@/components/header";
// import Footer from "@/components/footer";
// import { useCache } from "@/hooks/use-cache";

// const UploadAnalysis = () => {
//   const [selectedGenes, setSelectedGenes] = useState<string[]>([]);
//   const [expressionFile, setExpressionFile] = useState<File | null>(null);
//   const [topN, setTopN] = useState<string>("15");
//   const [analysisType, setAnalysisType] = useState<string>("Pathway");
//   const [geneSet, setGeneSet] = useState<string>("KEGG_2021_Human");
//   const [isLoading, setIsLoading] = useState<boolean>(false);
//   const { toast } = useToast();
//   const { getCachedData, setCachedData, generateCacheKey } = useCache();
//   const navigate = useNavigate();

//   const handleExpressionFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
//     if (event.target.files && event.target.files[0]) {
//       const selectedFile = event.target.files[0];
//       if (selectedFile.name.endsWith('.csv') || selectedFile.name.endsWith('.tsv')) {
//         setExpressionFile(selectedFile);
//       } else {
//         toast({
//           title: "Invalid File Type",
//           description: "Expression data file must be CSV or TSV.",
//           variant: "destructive",
//         });
//         setExpressionFile(null);
//       }
//     }
//   };

//   const handleSubmit = async (event: React.FormEvent) => {
//     event.preventDefault();

//     if (!expressionFile) {
//       toast({
//         title: "No File Uploaded",
//         description: "Please upload an expression data file (CSV or TSV).",
//         variant: "destructive",
//       });
//       return;
//     }

//     if (analysisType === 'Tumor' && !expressionFile) {
//       toast({
//         title: "No Expression Data",
//         description: "Tumor Analysis requires an expression data file.",
//         variant: "destructive",
//       });
//       return;
//     }
//     if ((analysisType === 'Gene' || analysisType === 'Pathway') && !selectedGenes.length && !expressionFile) {
//       toast({
//         title: "No Input Provided",
//         description: "Please select genes or upload an expression data file.",
//         variant: "destructive",
//       });
//       return;
//     }

//     setIsLoading(true);

//     const cacheParams = {
//       genes: selectedGenes.sort().join(','),
//       expressionFile: expressionFile ? `${expressionFile.name}_${expressionFile.size}` : null,
//       analysisType,
//       geneSet,
//       topN,
//     };
//     const cacheKey = generateCacheKey(cacheParams);

//     const cachedResult = getCachedData(cacheKey);
//     if (cachedResult) {
//       navigate('/upload-results', { state: { results: cachedResult, analysisType } });
//       toast({
//         title: "Loaded from Cache",
//         description: `Results for ${analysisType} Analysis loaded from cache.`,
//       });
//       setIsLoading(false);
//       return;
//     }

//     const formData = new FormData();
//     if (selectedGenes.length) {
//       formData.append('genes', selectedGenes.join(','));
//     }
//     if (expressionFile) {
//       formData.append('expression_file', expressionFile);
//       formData.append('top_n', topN);
//     }
//     formData.append('analysis_type', analysisType);
//     if (analysisType === 'Pathway') {
//       formData.append('gene_set', geneSet);
//     }

//     try {
//       const response = await fetch('/api/csv-upload', {
//         method: 'POST',
//         body: formData,
//       });

//       if (!response.ok) {
//         const errorData = await response.json();
//         throw new Error(errorData.error || 'Failed to process input');
//       }

//       const result = await response.json();
//       setCachedData(cacheKey, result);
//       navigate('/upload-results', { state: { results: result, analysisType } });
//       toast({
//         title: "Upload Successful",
//         description: `Input processed successfully for ${analysisType} Analysis. Redirecting to results...`,
//       });
//     } catch (error) {
//       toast({
//         title: "Error",
//         description: `Failed to process input: ${error.message}`,
//         variant: "destructive",
//       });
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-yellow-50 flex flex-col">
//       <Header />
//       <main className="flex-grow py-12">
//         <div className="max-w-6xl mx-auto px-4 sm:px-0 lg:pl-0 lg:pr-8">
//           <Card>
//             <CardHeader>
//               <CardTitle className="text-2xl font-bold text-blue-900">
//                 Upload Gene Expression Data
//               </CardTitle>
//             </CardHeader>
//             <CardContent>
//               <div>
//                 <Label htmlFor="analysis-type" className="text-blue-900">
//                   Analysis Type
//                 </Label>
//                 <Select value={analysisType} onValueChange={setAnalysisType}>
//                   <SelectTrigger id="analysis-type">
//                     <SelectValue placeholder="Select analysis type" />
//                   </SelectTrigger>
//                   <SelectContent>
//                     <SelectItem value="Gene">Gene Analysis</SelectItem>
//                     <SelectItem value="Pathway">Pathway Analysis</SelectItem>
//                     <SelectItem value="Tumor">Tumor Analysis</SelectItem>
//                   </SelectContent>
//                 </Select>
//               </div>
//               <div className="mt-6">
//                 <Label htmlFor="expression-file-upload" className="text-blue-900">
//                   Upload Expression Data File
//                 </Label>
//                 <p className="text-sm text-blue-700 mb-2">
//                   File must contain 'Hugo_Symbol' or 'gene_name' columns, followed by tumor sample expression data (e.g., TCGA-...).
//                 </p>
//                 <div className="overflow-x-auto mb-4 border border-gray-200 rounded-md">
//                   <table className="min-w-full text-sm text-left border-collapse">
//                     <thead className="bg-gray-100">
//                       <tr>
//                         <th className="px-4 py-2 border">gene_id</th>
//                         <th className="px-4 py-2 border">gene_name</th>
//                         <th className="px-4 py-2 border">SampleA</th>
//                         <th className="px-4 py-2 border">SampleB</th>
//                       </tr>
//                     </thead>
//                     <tbody>
//                       <tr>
//                         <td className="px-4 py-2 border">ENSG00000000003.15</td>
//                         <td className="px-4 py-2 border">TSPAN6</td>
//                         <td className="px-4 py-2 border">11.9592</td>
//                         <td className="px-4 py-2 border">21.8393</td>
//                       </tr>
//                       <tr>
//                         <td className="px-4 py-2 border">ENSG00000000005.6</td>
//                         <td className="px-4 py-2 border">TNMD</td>
//                         <td className="px-4 py-2 border">0.4836</td>
//                         <td className="px-4 py-2 border">1.0798</td>
//                       </tr>
//                       <tr>
//                         <td className="px-4 py-2 border">ENSG00000000419.13</td>
//                         <td className="px-4 py-2 border">DPM1</td>
//                         <td className="px-4 py-2 border">117.9028</td>
//                         <td className="px-4 py-2 border">97.2087</td>
//                       </tr>
//                     </tbody>
//                   </table>
//                 </div>
//                 <Input
//                   id="expression-file-upload"
//                   type="file"
//                   accept=".csv,.tsv"
//                   onChange={handleExpressionFileChange}
//                   className="file:mr-4 file:py-0 file:px-6 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
//                 />
//               </div>
//               <form onSubmit={handleSubmit} className="space-y-6 mt-6">
//                 {(analysisType === 'Gene' || analysisType === 'Pathway') && (
//                   <div>
//                     <GeneSelector
//                       selectedGenes={selectedGenes}
//                       onGenesChange={setSelectedGenes}
//                     />
//                   </div>
//                 )}
//                 {analysisType === 'Pathway' && (
//                   <div>
//                     <Label htmlFor="gene-set" className="text-blue-900">
//                       Gene Set Library
//                     </Label>
//                     <Select value={geneSet} onValueChange={setGeneSet}>
//                       <SelectTrigger id="gene-set">
//                         <SelectValue placeholder="Select gene set" />
//                       </SelectTrigger>
//                       <SelectContent>
//                         <SelectItem value="KEGG_2021_Human">KEGG 2021 Human</SelectItem>
//                         <SelectItem value="GO_Biological_Process_2021">GO Biological Process 2021</SelectItem>
//                       </SelectContent>
//                     </Select>
//                   </div>
//                 )}
//                 <div className="flex justify-center items-center py-7">
//                   <Button
//                     type="submit"
//                     disabled={
//                       isLoading ||
//                       (analysisType === 'Tumor' && !expressionFile) ||
//                       (analysisType === 'Gene' && !expressionFile && !selectedGenes.length) ||
//                       (analysisType === 'Pathway' && !expressionFile && !selectedGenes.length)
//                     }
//                     className="bg-gradient-to-r from-blue-600 to-blue-900 text-white px-3 py-2"
//                   >
//                     {isLoading ? (
//                       <>
//                         <Loader2 className="mr-2 h-4 w-4 animate-spin" />
//                         Processing...
//                       </>
//                     ) : (
//                       <>
//                         <Upload className="mr-2 h-3 w-3" />
//                         Analyze Input
//                       </>
//                     )}
//                   </Button>
//                 </div>
//               </form>
//             </CardContent>
//           </Card>
//         </div>
//       </main>
//       <Footer />
//     </div>
//   );
// };

// export default UploadAnalysis;