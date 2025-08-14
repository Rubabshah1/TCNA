import { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { createClient, SupabaseClient } from "@supabase/supabase-js";

import Index from "./pages/Index";
import GeneAnalysis from "./pages/GeneAnalysis";
import GeneResults from "./pages/GeneResults";
import PathwayAnalysis from "./pages/PathwayAnalysis";
import PathwayResults from "./pages/PathwayResults";
import TumourAnalysis from "./pages/TumorAnalysis";
import TumourResults from "./pages/TumorResults";
import NotFound from "./pages/NotFound";
import UploadAnalysis from "./pages/useUpload";

// Supabase types (you can replace `any` with your DB types if you have them generated)
type Instrument = {
  id: string;
  name: string;
};

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey);

const queryClient = new QueryClient();

function App() {
  return (
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
            <Route path="/pathway-results" element={<PathwayResults />} />
            <Route path="/tumour-analysis" element={<TumourAnalysis />} />
            <Route path="/tumor-analysis-results" element={<TumourResults />} />
            <Route path="/upload-analysis" element={<UploadAnalysis />} />
            <Route path="*" element={<NotFound />} />
          </Routes>

          {/* Optional: Display fetched instruments */}
          {/* <ul className="p-4">
            {instruments.map((instrument) => (
              <li key={instrument.id}>{instrument.name}</li>
            ))}
          </ul> */}
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
