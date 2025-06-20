
// import { useState } from "react";
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// import { Input } from "@/components/ui/input";
// import { Badge } from "@/components/ui/badge";
// import { Button } from "@/components/ui/button";
// import { X, Search } from "lucide-react";

// interface GeneSelectorProps {
//   selectedGenes: string[];
//   onGenesChange: (genes: string[]) => void;
// }

// const GeneSelector = ({ selectedGenes, onGenesChange }: GeneSelectorProps) => {
//   const [searchTerm, setSearchTerm] = useState("");
//   const [showDropdown, setShowDropdown] = useState(false);

//   // Alphabetically sorted gene list with common cancer genes
//   const allGenes = [
//     "APC", "ATM", "BRAF", "BRCA1", "BRCA2", "CDH1", "CDKN2A", "CTNNB1", 
//     "EGFR", "ERBB2", "FGFR2", "HRAS", "IDH1", "IDH2", "KRAS", "MLH1", 
//     "MSH2", "MSH6", "MYC", "NRAS", "P53", "PIK3CA", "PTEN", "RB1", 
//     "RET", "STK11", "TP53", "VHL", "WDFY3"
//   ].sort();

//   const suggestedGenes = ["TP53", "BRCA1", "BRCA2", "KRAS", "EGFR", "PIK3CA", "APC", "PTEN"];

//   const filteredGenes = allGenes.filter(gene => 
//     gene.toLowerCase().includes(searchTerm.toLowerCase()) &&
//     !selectedGenes.includes(gene)
//   );

//   const handleGeneSelect = (gene: string) => {
//     if (!selectedGenes.includes(gene)) {
//       onGenesChange([...selectedGenes, gene]);
//     }
//     setSearchTerm("");
//     setShowDropdown(false);
//   };

//   const handleGeneRemove = (gene: string) => {
//     onGenesChange(selectedGenes.filter(g => g !== gene));
//   };

//   const handleSuggestedGeneAdd = (gene: string) => {
//     if (!selectedGenes.includes(gene)) {
//       onGenesChange([...selectedGenes, gene]);
//     }
//   };

//   return (
//     <Card className="border-0 shadow-lg">
//       <CardHeader>
//         <CardTitle className="text-xl text-blue-800">Select Genes for Analysis</CardTitle>
//       </CardHeader>
//       <CardContent className="space-y-4">
//         {/* Search Input */}
//         <div className="relative">
//           <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
//           <Input
//             type="text"
//             placeholder="Search for genes..."
//             value={searchTerm}
//             onChange={(e) => {
//               setSearchTerm(e.target.value);
//               setShowDropdown(e.target.value.length > 0);
//             }}
//             onFocus={() => setShowDropdown(searchTerm.length > 0)}
//             className="pl-10"
//           />
          
//           {/* Dropdown */}
//           {showDropdown && filteredGenes.length > 0 && (
//             <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-48 overflow-y-auto">
//               {filteredGenes.slice(0, 10).map((gene) => (
//                 <button
//                   key={gene}
//                   onClick={() => handleGeneSelect(gene)}
//                   className="w-full px-4 py-2 text-left hover:bg-blue-50 border-b border-gray-100 last:border-b-0"
//                 >
//                   {gene}
//                 </button>
//               ))}
//             </div>
//           )}
//         </div>

//         {/* Suggested Genes */}
//         <div>
//           <h4 className="text-sm font-medium text-gray-700 mb-2">Suggested Cancer Genes:</h4>
//           <div className="flex flex-wrap gap-2">
//             {suggestedGenes.map((gene) => (
//               <Button
//                 key={gene}
//                 variant={selectedGenes.includes(gene) ? "default" : "outline"}
//                 size="sm"
//                 onClick={() => handleSuggestedGeneAdd(gene)}
//                 disabled={selectedGenes.includes(gene)}
//                 className="text-xs"
//               >
//                 {gene}
//               </Button>
//             ))}
//           </div>
//         </div>

//         {/* Selected Genes */}
//         {selectedGenes.length > 0 && (
//           <div>
//             <h4 className="text-sm font-medium text-gray-700 mb-2">
//               Selected Genes ({selectedGenes.length}):
//             </h4>
//             <div className="flex flex-wrap gap-2">
//               {selectedGenes.map((gene) => (
//                 <Badge key={gene} variant="secondary" className="flex items-center gap-1">
//                   {gene}
//                   <button
//                     onClick={() => handleGeneRemove(gene)}
//                     className="ml-1 hover:bg-gray-300 rounded-full p-0.5"
//                   >
//                     <X className="h-3 w-3" />
//                   </button>
//                 </Badge>
//               ))}
//             </div>
//           </div>
//         )}
//       </CardContent>
//     </Card>
//   );
// };

// export default GeneSelector;
import { useState, useEffect } from "react";
import supabase from "@/supabase-client"; // adjust path if needed
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { X, Search } from "lucide-react";

interface GeneSelectorProps {
  selectedGenes: string[];
  onGenesChange: (genes: string[]) => void;
}

const GeneSelector = ({ selectedGenes, onGenesChange }: GeneSelectorProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [allGenes, setAllGenes] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const suggestedGenes = ["TP53", "BRCA1", "BRCA2", "KRAS", "EGFR", "PIK3CA", "APC", "PTEN"];

  // Fetch genes from Supabase on mount
  useEffect(() => {
    const fetchGenes = async () => {
      const { data, error } = await supabase.from("genes").select("gene_symbol");
      if (error) {
        console.error("Error fetching genes:", error.message);
      } else {
        console.log("Fetched genes:", data);
        const geneList = data.map((item: any) => item.gene_symbol).filter(Boolean);
        setAllGenes(geneList.sort());
        console.log("Mapped gene list:", geneList);
      }
      setLoading(false);
    };
    fetchGenes();
  }, []);

  // const filteredGenes = allGenes.filter(
  //   (gene) =>
  //     gene.toLowerCase().includes(searchTerm.toLowerCase()) &&
  //     !selectedGenes.includes(gene)
  // );
  const filteredGenes = [...allGenes]
  .filter(gene => !selectedGenes.includes(gene))
  .map(gene => {
    const lowerGene = gene.toLowerCase();
    const lowerSearch = searchTerm.toLowerCase();

    let score = 2; // worst match by default
    if (lowerGene.startsWith(lowerSearch)) score = 0; // best: prefix match
    else if (lowerGene.includes(lowerSearch)) score = 1; // substring match

    return { gene, score };
  })
  .filter(({ score }) => score < 2) // remove poor matches
  .sort((a, b) => a.score - b.score || a.gene.localeCompare(b.gene)) // prioritize match type then alphabetically
  .map(({ gene }) => gene); // return final gene names


  const handleGeneSelect = (gene: string) => {
    if (!selectedGenes.includes(gene)) {
      onGenesChange([...selectedGenes, gene]);
    }
    setSearchTerm("");
    setShowDropdown(false);
  };

  const handleGeneRemove = (gene: string) => {
    onGenesChange(selectedGenes.filter((g) => g !== gene));
  };

  const handleSuggestedGeneAdd = (gene: string) => {
    if (!selectedGenes.includes(gene)) {
      onGenesChange([...selectedGenes, gene]);
    }
  };

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader>
        <CardTitle className="text-xl text-blue-800">Select Genes</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search Input */}
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <Input
            type="text"
            placeholder={loading ? "Loading genes..." : "Search for genes..."}
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setShowDropdown(e.target.value.length > 0);
            }}
            onFocus={() => setShowDropdown(searchTerm.length > 0)}
            disabled={loading}
            className="pl-10"
          />

          {/* Dropdown */}
          {showDropdown && filteredGenes.length > 0 && (
            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-48 overflow-y-auto">
              {filteredGenes.slice(0, 10).map((gene) => (
                <button
                  key={gene}
                  onClick={() => handleGeneSelect(gene)}
                  className="w-full px-4 py-2 text-left hover:bg-blue-50 border-b border-gray-100 last:border-b-0"
                >
                  {gene}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Suggested Genes */}
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-2">Suggested Cancer Genes:</h4>
          <div className="flex flex-wrap gap-2">
            {suggestedGenes.map((gene) => (
              <Button
                key={gene}
                variant={selectedGenes.includes(gene) ? "default" : "outline"}
                size="sm"
                onClick={() => handleSuggestedGeneAdd(gene)}
                disabled={selectedGenes.includes(gene)}
                className="text-xs"
              >
                {gene}
              </Button>
            ))}
          </div>
        </div>

        {/* Selected Genes */}
        {selectedGenes.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">
              Selected Genes ({selectedGenes.length}):
            </h4>
            <div className="flex flex-wrap gap-2">
              {selectedGenes.map((gene) => (
                <Badge key={gene} variant="secondary" className="flex items-center gap-1">
                  {gene}
                  <button
                    onClick={() => handleGeneRemove(gene)}
                    className="ml-1 hover:bg-gray-300 rounded-full p-0.5"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default GeneSelector;
