
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import GeneAnalysis from "./pages/GeneAnalysis";
import GeneResults from "./pages/GeneResults";
import PathwayAnalysis from "./pages/PathwayAnalysis";
import TumourAnalysis from "./pages/TumorAnalysis";
import TumourResults from "./pages/TumorResults";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/gene-analysis" element={<GeneAnalysis />} />
          <Route path="/gene-results" element={<GeneResults />} />
          <Route path="/pathway-analysis" element={<PathwayAnalysis />} />
          <Route path="/tumour-analysis" element={<TumourAnalysis />} />
          <Route path="/tumor-analysis-results" element={<TumourResults />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;