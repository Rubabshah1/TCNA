
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { Activity, BarChart3, Dna, Microscope, TrendingUp, Zap, Network } from "lucide-react";

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-yellow-50 to-blue-100">
      {/* Header */}
      <header className="bg-white/90 backdrop-blur-sm shadow-sm border-b border-blue-100">
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
              {/* <Link to="/" className="text-blue-600 font-medium">
                Home
              </Link> */}
              <Link to="/gene-analysis" className="text-blue-700 hover:text-blue-600 font-medium transition-colors">
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

      {/* Hero Section with lighter gradient background */}
      {/* <section className="py-20 bg-gradient-to-br from-blue-900/70 via-yellow-600/70 to-blue-200/70"> */}
      <section className="py-16 bg-gradient-to-r from-blue-900 to-yellow-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-full mb-6">
              <Dna className="h-8 w-8 text-white" />
            </div>
            <h2 className="text-5xl font-bold text-yellow-100 mb-6">
              The Cancer Noise Atlas
            </h2>
            <p className="text-xl text-yellow-100 max-w-3xl mx-auto leading-relaxed">
              Comprehensive analysis platform for gene expression variability, pathway interactions, 
              and tumor analysis across different cancer types. Uncover hidden patterns in tumor 
              heterogeneity and discover therapeutic targets.
            </p>
          </div>
          
          <div className="flex justify-center space-x-4 flex-wrap gap-4">
            <Link to="/gene-analysis">
              <Button className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 text-lg">
                Gene Analysis
              </Button>
            </Link>
            <Link to="/pathway-analysis">
              <Button className="bg-yellow-600 hover:bg-yellow-700 text-white px-8 py-3 text-lg">
                Pathway Analysis
              </Button>
            </Link>
            <Link to="/tumour-analysis">
              <Button className="bg-blue-500 hover:bg-blue-600 text-white px-8 py-3 text-lg">
                Tumor Analysis
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h3 className="text-3xl font-bold text-blue-900 mb-4">
              Advanced Multi-Omics Analysis Tools
            </h3>
            <p className="text-lg text-blue-700 max-w-2xl mx-auto">
              Comprehensive suite of tools for understanding genomic variability across multiple biological layers
            </p>
          </div>
          
          {/* <div className="grid md:grid-cols-3 gap-8">
            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow bg-gradient-to-br from-blue-50 to-yellow-50">
              <CardHeader>
                <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center mb-4">
                  <BarChart3 className="h-6 w-6 text-white" />
                </div>
                <CardTitle className="text-xl text-blue-900">
                  Gene Expression Noise
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-blue-700">
                  Calculate coefficient of variation, standard deviation, and other 
                  statistical measures to quantify expression noise across cancer samples.
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow bg-gradient-to-br from-yellow-50 to-blue-50">
              <CardHeader>
                <div className="w-12 h-12 bg-yellow-600 rounded-lg flex items-center justify-center mb-4">
                  <Network className="h-6 w-6 text-white" />
                </div>
                <CardTitle className="text-xl text-blue-900">
                  Pathway Interactions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-blue-700">
                  Analyze biological pathway dysregulation and cross-pathway interactions 
                  to understand cancer progression mechanisms.
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow bg-gradient-to-br from-blue-50 to-yellow-50">
              <CardHeader>
                <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center mb-4">
                  <Microscope className="h-6 w-6 text-white" />
                </div>
                <CardTitle className="text-xl text-blue-900">
                  Tumor Analysis
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-blue-700">
                  Explore tumor expression patterns, post-translational modifications,
                  and their correlation with genomic alterations.
                </p>
              </CardContent>
            </Card>
          </div> */}
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-16 bg-gradient-to-r from-blue-100 to-yellow-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h3 className="text-3xl font-bold text-blue-900 mb-4">
              How It Works
            </h3>
            <p className="text-lg text-blue-700">
              Simple three-step process to analyze multi-omics data
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl font-bold text-white">1</span>
              </div>
              <h4 className="text-xl font-semibold text-blue-900 mb-4">Select Analysis Type</h4>
              <p className="text-blue-700">
                Choose from gene expression, pathway interaction, or tumor analysis
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-yellow-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl font-bold text-white">2</span>
              </div>
              <h4 className="text-xl font-semibold text-blue-900 mb-4">Configure Parameters</h4>
              <p className="text-blue-700">
                Select cancer types, genes, pathways, or tumors of interest for analysis
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl font-bold text-white">3</span>
              </div>
              <h4 className="text-xl font-semibold text-blue-900 mb-4">Explore Results</h4>
              <p className="text-blue-700">
                View comprehensive metrics, visualizations, and biological interpretations
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-blue-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="mb-8">
            <Zap className="h-12 w-12 text-yellow-400 mx-auto mb-6" />
            <h3 className="text-3xl font-bold text-white mb-4">
              Ready to Explore Cancer Genome Noise?
            </h3>
            <p className="text-xl text-blue-200">
              Start analyzing genomic variability patterns across cancer types today
            </p>
          </div>
          
          <div className="flex justify-center space-x-4 flex-wrap gap-4">
            <Link to="/gene-analysis">
              <Button className="bg-yellow-500 hover:bg-yellow-400 text-blue-900 px-8 py-3 text-lg font-semibold">
                Begin Gene Analysis
              </Button>
            </Link>
            <Link to="/pathway-analysis">
              <Button className="bg-white hover:bg-gray-100 text-blue-900 px-8 py-3 text-lg font-semibold">
                Explore Pathways
              </Button>
            </Link>
          </div>
        </div>
      </section>
           
    <footer className="bg-gray-100 text-gray-700 text-m mt-10 p-8 border-t border-gray-300">
  <div className="flex flex-col items-center justify-center space-y-4">
    <p className="text-blue-700">© 2025 BIRL — This website is free and open to all users and there is no login requirement.</p>
    
    <a
      className="font-semibold text-blue-700"
      href="https://birl.lums.edu.pk/"
      target="_blank"
      rel="noopener noreferrer"
    >
      Biomedical Informatics & Engineering Research Laboratory, Lahore University of Management Sciences
    </a>
    
    <p className="text-blue-700">DHA, Lahore, Pakistan</p>
    <p className="text-blue-700">+92 (42) 3560 8352</p>
  </div>
</footer>

    </div>
  );
};

export default Index;