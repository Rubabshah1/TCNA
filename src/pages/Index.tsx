// import { Button } from "@/components/ui/button";
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// import { Link } from "react-router-dom";
// import { Activity, BarChart3, Dna, Microscope, TrendingUp, Zap, Network } from "lucide-react";
// import Header from "@/components/header";
// import Footer from "@/components/footer";

// const Index = () => {
//   return (
    // <div className="min-h-screen bg-white flex flex-col">
    //   {/* Header */}
    //   <Header  />
    //   <main className="flex-grow">
    //   {/* section with lighter gradient background */}
    //   {/* <section className="py-20 bg-gradient-to-br from-blue-900/70 via-yellow-600/70 to-blue-200/70"> */}
    //   <section className="py-16 bg-gradient-to-r from-blue-900 to-yellow-600">
    //     <div className="max-w-full sm:max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">

    //       <div className="mb-8">
    //         <div className="inline-flex items-center justify-center">
    //           {/* <Dna className="h-10 w-10 text-blue-900" /> */}
    //         </div>
    //         <h2 className="text-5xl font-bold text-white mb-6">
    //           The Cancer Noise Atlas
    //         </h2>
    //         <p className="text-xl text-white max-w-3xl mx-auto leading-relaxed">
    //          TCNA is a multi-omics noise analysis tool for exploring genomic variability across multiple spatio-temporal scales. It supports gene expression, pathway interactions, and tumor analyses across cancer sites using GDC datasets or user input data.

    //         </p>
    //       </div>
          
    //       <div className="flex justify-center space-x-4 flex-wrap gap-4">
    //         <Link to="/gene-analysis">
    //           <Button className="bg-gradient-to-r from-blue-900 to-blue-600 text-white px-8 py-3 text-lg">
    //             Gene Analysis
    //           </Button>
    //         </Link>
    //         <Link to="/pathway-analysis">
    //           <Button className="bg-gradient-to-r from-blue-600 to-yellow-800 text-white px-8 py-3 text-lg">
    //             Pathway Analysis
    //           </Button>
    //         </Link>
    //         <Link to="/tumour-analysis">
    //           <Button className="bg-gradient-to-r from-yellow-800 to-yellow-600 text-white px-8 py-3 text-lg">
    //             Tumor Analysis
    //           </Button>
            
    //         </Link>
    //       </div>
    //     </div>
    //   </section>

//       {/* Features Section */}
//       <section className="pt-16 pb-4 bg-white">
//         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
//           <div className="text-center mb-16">
//             <h3 className="text-3xl font-bold text-blue-900 mb-4">
//               Want to do analysis on your own data?   
//             </h3>
//             <p className="text-lg text-blue-700 max-w-2xl mx-auto">
//               <Link to="/upload-analysis">
//                  <Button className="bg-blue-800 to-blue-900 text-white px-6 py-3 text-lg">
//                     Upload Data
//                  </Button>
//                </Link>
//             </p>
//           </div>
//         </div>
//       </section>
//             {/* Features Section */}
//       <section className="pt-16 pb-4 bg-white">
//         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
//           <div className="text-center mb-16">
//             <h3 className="text-3xl font-bold text-blue-900 mb-4">
//               Find Top Noisy genes across Cancers  
//             </h3>
//             <p className="text-lg text-blue-700 max-w-2xl mx-auto">
//               <Link to="/global-noise">
//                  <Button className="bg-blue-800 to-blue-900 text-white px-6 py-3 text-lg">
//                     Click Here
//                  </Button>
//                </Link>
//             </p>
//           </div>
//         </div>
//       </section>

//       <section className="py-8 bg-gradient-to-r from-blue-100 to-yellow-100">
//         <div className="max-w-6xl mx-auto px-3 sm:px-4 lg:px-6">
//           <div className="text-center mb-8">
//             <h3 className="text-2xl font-bold text-blue-900 mb-2">
//               How It Works
//             </h3>
//           </div>

//           <div className="grid md:grid-cols-3 gap-6">
//             <div className="text-center">
//               <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
//                 <span className="text-xl font-bold text-white">1</span>
//               </div>
//               <h4 className="text-lg font-semibold text-blue-900 mb-2">Select Analysis Type</h4>
//               <p className="text-blue-700 text-sm">
//               </p>
//             </div>

//             <div className="text-center">
//               <div className="w-12 h-12 bg-yellow-600 rounded-full flex items-center justify-center mx-auto mb-4">
//                 <span className="text-xl font-bold text-white">2</span>
//               </div>
//               <h4 className="text-lg font-semibold text-blue-900 mb-2">Configure Parameters</h4>
//               <p className="text-blue-700 text-sm">
//               </p>
//             </div>

//             <div className="text-center">
//               <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
//                 <span className="text-xl font-bold text-white">3</span>
//               </div>
//               <h4 className="text-lg font-semibold text-blue-900 mb-2">Explore Results</h4>
//               <p className="text-blue-700 text-sm">
//               </p>
//             </div>
//           </div>
//         </div>
//       </section>
           
//   </main>
//   <Footer />

//     </div>
//   );
// };

// export default Index;
// // import { Button } from "@/components/ui/button";
// // import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// // import { Link } from "react-router-dom";
// // import { Activity, BarChart3, Dna, Microscope, TrendingUp, Zap, Network, Upload } from "lucide-react";
// // import Header from "@/components/header";
// // import Footer from "@/components/footer";

// // const Index = () => {
// //   return (
// //     <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-yellow-50 flex flex-col">
// //       {/* Header */}
// //       <Header />
// //       <main className="flex-grow">
// //         {/* Hero Section with lighter gradient background */}
// //         <section className="py-16 bg-gradient-to-r from-blue-900 to-yellow-600">
// //           <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
// //             <div className="mb-8">
// //               <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-full mb-6">
// //                 <Dna className="h-8 w-8 text-white" />
// //               </div>
// //               <h2 className="text-5xl font-bold text-white mb-6">
// //                 The Cancer Noise Atlas
// //               </h2>
// //               <p className="text-xl text-white max-w-3xl mx-auto leading-relaxed">
// //                 TCNA is a comprehensive analysis platform for gene expression variability, pathway interactions, 
// //   and tumor analysis across different cancer types. Use the analysis tools below to explore 
// //   pre-compiled datasets from the Genomic Data Commons (GDC), or upload your own dataset for 
// //   fully customized analyses.
// //               </p>
// //             </div>
            
// //             <div className="flex flex-col items-center space-y-4">
// //               {/* Main analysis buttons */}
// //               <div className="flex justify-center space-x-4 flex-wrap gap-4">
// //                 <Link to="/gene-analysis">
// //                   <Button className="bg-gradient-to-r from-blue-900 to-blue-600 text-white px-8 py-3 text-lg">
// //                     Gene Analysis
// //                   </Button>
// //                 </Link>
// //                 <Link to="/pathway-analysis">
// //                   <Button className="bg-gradient-to-r from-blue-600 to-yellow-800 text-white px-8 py-3 text-lg">
// //                     Pathway Analysis
// //                   </Button>
// //                 </Link>
// //                 <Link to="/tumour-analysis">
// //                   <Button className="bg-gradient-to-r from-yellow-800 to-yellow-600 text-white px-8 py-3 text-lg">
// //                     Tumor Analysis
// //                   </Button>
// //                 </Link>
// //               </div>

// //               {/* Upload button below */}
// //               <Link to="/upload-analysis">
// //                 <Button className="bg-gradient-to-r from-blue-600 to-blue-900 text-white px-6 py-3 text-lg">
// //                    Upload Your Own Data
// //                 </Button>
// //               </Link>
// //             </div>
// //           </div>
// //         </section>

// //         {/* Features Section */}
// //         <section className="pt-16 pb-4 bg-white">
// //           <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
// //             <div className="text-center mb-16">
// //               <h3 className="text-3xl font-bold text-blue-900 mb-4">
// //                 Advanced Multi-Omics Noise Analysis Tools
// //               </h3>
// //               <p className="text-lg text-blue-700 max-w-2xl mx-auto">
// //                 Comprehensive suite of tools for understanding genomic variability across multiple spatio-temporal biological scales.
// //               </p>
// //             </div>
// //           </div>
// //         </section>

// //         {/* How It Works Section */}
// //         <section className="py-8 bg-gradient-to-r from-blue-100 to-yellow-100">
// //           <div className="max-w-6xl mx-auto px-3 sm:px-4 lg:px-6">
// //             <div className="text-center mb-8">
// //               <h3 className="text-2xl font-bold text-blue-900 mb-2">
// //                 How It Works
                
// //               </h3>
// //             </div>

// //             <div className="grid md:grid-cols-4 gap-6">
// //               <div className="text-center">
// //                 <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
// //                   <span className="text-xl font-bold text-white">1</span>
// //                 </div>
// //                 <h4 className="text-lg font-semibold text-blue-900 mb-2">Select Analysis Type</h4>
                
// //               </div>

// //               <div className="text-center">
// //                 <div className="w-12 h-12 bg-yellow-600 rounded-full flex items-center justify-center mx-auto mb-4">
// //                   <span className="text-xl font-bold text-white">2</span>
// //                 </div>
// //                 <h4 className="text-lg font-semibold text-blue-900 mb-2">Configure Parameters</h4>
// //                 <p className="text-blue-700 text-sm">
// //                   {/* Specify metrics, gene sets, or upload a CSV/TSV file with gene expression data. */}
// //                 </p>
// //               </div>

              

              

// //               <div className="text-center">
// //                 <div className="w-12 h-12 bg-yellow-600 rounded-full flex items-center justify-center mx-auto mb-4">
// //                   <span className="text-xl font-bold text-white">3</span>
// //                 </div>
// //                 <h4 className="text-lg font-semibold text-blue-900 mb-2">Explore Results</h4>
// //                 <p className="text-blue-700 text-sm">
// //                   {/* Visualize and interpret gene noise and pathway enrichment results. */}
// //                 </p>
                
// //               </div>
              
// //             </div>
// //           </div>
// //         </section>
// //       </main>
// //       <Footer />
// //     </div>
// //   );
// // };

// // export default Index;
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { Dna, Upload, ArrowRight, Globe, FileText, Beaker } from "lucide-react";
import Header from "@/components/header";
import Footer from "@/components/footer";

const Index = () => {
  return (
        <div className="min-h-screen bg-white flex flex-col">
      {/* Header */}
      <Header  />
      <main className="flex-grow">
      {/* section with lighter gradient background */}
      {/* <section className="py-20 bg-gradient-to-br from-blue-900/70 via-yellow-600/70 to-blue-200/70"> */}
      <section className="py-16 bg-gradient-to-r from-blue-900 to-yellow-600">
        <div className="max-w-full sm:max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">

          <div className="mb-8">
            <div className="inline-flex items-center justify-center">
              {/* <Dna className="h-10 w-10 text-blue-900" /> */}
            </div>
            <h2 className="text-5xl font-bold text-white mb-6">
              The Cancer Noise Atlas
            </h2>
            <p className="text-xl text-white max-w-3xl mx-auto leading-relaxed">
             TCNA is a multi-omics noise analysis tool for exploring genomic variability across multiple spatio-temporal scales. It supports gene expression, pathway interactions, and tumor analyses across cancer sites using GDC datasets or user input data.

            </p>
          </div>
          
          <div className="flex justify-center space-x-4 flex-wrap gap-4">
            <Link to="/gene-analysis">
              <Button className="bg-gradient-to-r from-blue-900 to-blue-600 text-white px-8 py-3 text-lg">
                Gene Analysis
              </Button>
            </Link>
            <Link to="/pathway-analysis">
              <Button className="bg-gradient-to-r from-blue-600 to-yellow-800 text-white px-8 py-3 text-lg">
                Pathway Analysis
              </Button>
            </Link>
            <Link to="/tumour-analysis">
              <Button className="bg-gradient-to-r from-yellow-800 to-yellow-600 text-white px-8 py-3 text-lg">
                Tumor Analysis
              </Button>
            
            </Link>
          </div>
        </div>
      </section>

        {/* Highlighted Action Cards */}
        <section className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid md:grid-cols-2 gap-10 max-w-5xl mx-auto">
              {/* Upload Your Data Card */}
              <Card className="group border-2 border-blue-200 ">
                <CardContent className="p-10 text-center">
                  <div className="w-20 h-15 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">

                  </div>
                  <h3 className="text-3xl font-bold text-blue-900 mb-4">
                    Analyze Your Own Data
                  </h3>
                  <p className="text-lg text-gray-700 mb-8 max-w-md mx-auto">
                    Upload your gene expression matrix (CSV) and perform fully noise analysis.
                  </p>
                  <Link to="/upload-analysis">
                    <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white font-semibold group-hover:shadow-xl">
                     Upload Your Dataset <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>

              {/* Global Noise Leaderboard Card */}
              <Card className="group border-2 border-yellow-200 ">
                <CardContent className="p-10 text-center">
                  <div className="w-15 h-15 flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">

                  </div>
                  <h3 className="text-3xl font-bold text-blue-900 mb-4">
                    Top Noisy Genes Across Cancers
                  </h3>
                  <p className="text-lg text-gray-700 mb-8 max-w-md mx-auto">
                    Find the most variably expressed genes across cancer sites or globally.
                  </p>
                  <Link to="/global-noise">
                    <Button size="lg" className="bg-yellow-600 hover:bg-yellow-700 text-white font-semibold group-hover:shadow-xl">
                      Top Noisy Genes <ArrowRight className="ml-3 h-5 w-5" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* How It Works */}
        {/* <section className="py-20 bg-gradient-to-r from-blue-50 to-yellow-50">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <h3 className="text-4xl font-bold text-center text-blue-900 mb-12">How It Works</h3>
            <div className="grid md:grid-cols-3 gap-10">
              {[
                { step: 1, title: "Select Analysis Type", icon: <Beaker className="h-7 w-7" />, color: "bg-blue-600" },
                { step: 2, title: "Configure Parameters", icon: <ArrowRight className="h-7 w-7" />, color: "bg-yellow-600" },
                { step: 3, title: "Explore Interactive Results", icon: <Globe className="h-7 w-7" />, color: "bg-blue-700" },
              ].map((item) => (
                <div key={item.step} className="text-center group">
                  <div className={`w-16 h-16 ${item.color} rounded-full flex items-center justify-center mx-auto mb-6 text-white shadow-lg group-hover:scale-110 transition-transform`}>
                    {item.icon}
                  </div>
                  <div className="bg-white rounded-2xl p-6 shadow-md">
                    <div className="text-5xl font-bold text-gray-300 mb-2">0{item.step}</div>
                    <h4 className="text-xl font-semibold text-blue-900">{item.title}</h4>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section> */}
      </main>

      <Footer />
    </div>
  );
};

export default Index;