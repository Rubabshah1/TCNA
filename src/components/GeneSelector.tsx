import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { X, Search } from "lucide-react";
import {SelectedGene} from  "@/components/types/genes";

interface GeneSelectorProps {
  selectedGenes: SelectedGene[];
  onGenesChange: (genes: SelectedGene[]) => void;
  maxGenes?: number;
}

type GeneItem = {
  gene: string;
  ensembl_id: string;
};

type GeneApiResponse = {
  genes: Record<string, string[]>;
};

const API_BASE = "/api";
const suggestedGenes = ["TP53", "BRCA1", "BRCA2", "KRAS", "EGFR", "PIK3CA", "APC", "PTEN"];

const GeneSelector = ({ selectedGenes, onGenesChange, maxGenes }: GeneSelectorProps) => {
  const [allGeneItems, setAllGeneItems] = useState<GeneItem[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch genes + Ensembl IDs
  useEffect(() => {
    const fetchAllGenes = async () => {
      try {
        const res = await fetch(`${API_BASE}/gene_IDs`);
        const data: GeneApiResponse = await res.json();
        const items: GeneItem[] = [];
        Object.entries(data.genes).forEach(([gene, ids]) => {
          ids.forEach((id) => items.push({ gene, ensembl_id: id }));
        });
        setAllGeneItems(items.sort((a, b) => a.gene.localeCompare(b.gene)));
      } catch (err) {
        console.error(err);
        setError("Failed to load gene list from server.");
      } finally {
        setLoading(false);
      }
    };
    fetchAllGenes();
  }, []);

  const filteredItems = allGeneItems
    .filter((item) => !selectedGenes.some((g) => g.ensembl_id === item.ensembl_id))
    .filter((item) => item.gene.toLowerCase().includes(searchTerm.toLowerCase()))
    .slice(0, 10);

  const handleSelect = (item: GeneItem) => {
    if (!selectedGenes.some((g) => g.ensembl_id === item.ensembl_id)) {
      const newSelection: SelectedGene = { ensembl_id: item.ensembl_id, gene_symbol: item.gene };
      if (maxGenes === 1) {
        onGenesChange([newSelection]);
      } else {
        onGenesChange([...selectedGenes, newSelection]);
      }
    }
    setSearchTerm("");
    setShowDropdown(false);
  };

  const handleRemove = (ensembl_id: string) => {
    onGenesChange(selectedGenes.filter((g) => g.ensembl_id !== ensembl_id));
  };

  const handleSuggestedGeneAdd = (gene: string) => {
    const geneItems = allGeneItems.filter((item) => item.gene === gene);
    handleSelect(geneItems[0]);
  };

  const handleClearGenes = () => onGenesChange([]);

  return (
    <Card className="border shadow-lg">
      <CardHeader>
        <CardTitle className="text-xl text-blue-800">
          Select Genes {maxGenes === 1 ? "(Select 1 Gene)" : maxGenes ? `(Max ${maxGenes} Genes)` : ""}
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Search */}
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
            disabled={loading || (maxGenes !== undefined && selectedGenes.length >= maxGenes)}
            className="pl-10"
          />

          {error && <p className="text-sm text-red-600 mt-1">{error}</p>}

          {showDropdown && filteredItems.length > 0 && (
            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-48 overflow-y-auto">
              {filteredItems.map((item) => (
                <button
                  key={item.ensembl_id}
                  onClick={() => handleSelect(item)}
                  className="w-full px-4 py-2 text-left hover:bg-blue-50 border-b border-gray-100 last:border-b-0"
                >
                  <div className="font-medium">{item.gene}</div>
                  <div className="text-xs text-gray-500">{item.ensembl_id}</div>
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
                variant={selectedGenes.some((g) => g.gene_symbol === gene) ? "default" : "outline"}
                size="sm"
                onClick={() => handleSuggestedGeneAdd(gene)}
                disabled={selectedGenes.length >= (maxGenes ?? Infinity)}
                className="text-xs"
              >
                {gene}
              </Button>
            ))}
            <Button onClick={handleClearGenes} className="ml-auto flex items-center gap-2" variant="outline">
              Clear genes
            </Button>
          </div>
        </div>

        {/* Selected Genes */}
        {selectedGenes.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium text-gray-700">
                Selected Genes ({selectedGenes.length}{maxGenes ? `/${maxGenes}` : ""}):
              </h4>
            </div>

            <div className="flex flex-wrap gap-2">
              {selectedGenes.map((g) => (
                <div
                  key={g.ensembl_id}
                  className="px-3 py-1 bg-gray-100 rounded-md border text-sm flex items-center justify-between"
                >
                  <div>
                    <div className="font-semibold">{g.gene_symbol}</div>
                    <div className="text-xs text-gray-500">{g.ensembl_id}</div>
                  </div>
                  <button
                    onClick={() => handleRemove(g.ensembl_id)}
                    className="ml-2 hover:bg-gray-300 rounded-full p-1"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default GeneSelector;

// import { useState, useEffect } from "react";
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// import { Input } from "@/components/ui/input";
// import { Badge } from "@/components/ui/badge";
// import { Button } from "@/components/ui/button";
// import { X, Search } from "lucide-react"; 

// interface GeneSelectorProps {
//   selectedGenes: string[];
//   onGenesChange: (genes: string[]) => void;
//   maxGenes?: number;
// }

// const API_BASE = "/api";

// const GeneSelector = ({ selectedGenes, onGenesChange, maxGenes }: GeneSelectorProps) => {
//   const [searchTerm, setSearchTerm] = useState("");
//   const [showDropdown, setShowDropdown] = useState(false);
//   const [allGenes, setAllGenes] = useState<string[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState<string | null>(null);

//   const suggestedGenes = ["TP53", "BRCA1", "BRCA2", "KRAS", "EGFR", "PIK3CA", "APC", "PTEN"];

//   // === Fetch genes from FastAPI ===
//   useEffect(() => {
//     const fetchGenes = async () => {
//       try {
//         const res = await fetch(`${API_BASE}/genes`);
//         if (!res.ok) throw new Error("Failed to fetch genes");
//         const data = await res.json();
//         setAllGenes(data.genes.sort());
//       } catch (err) {
//         console.error(err);
//         setError("Failed to load gene list from server.");
//       } finally {
//         setLoading(false);
//       }
//     };
//     fetchGenes();
//   }, []);

//   // === Filtering & sorting ===
//   const filteredGenes = [...allGenes]
//     .filter((gene) => !selectedGenes.includes(gene))
//     .map((gene) => {
//       const lowerGene = gene.toLowerCase();
//       const lowerSearch = searchTerm.toLowerCase();
//       let score = 2;
//       if (lowerGene.startsWith(lowerSearch)) score = 0;
//       else if (lowerGene.includes(lowerSearch)) score = 1;
//       return { gene, score };
//     })
//     .filter(({ score }) => score < 2)
//     .sort((a, b) => a.score - b.score || a.gene.localeCompare(b.gene))
//     .map(({ gene }) => gene);

//   // === Handlers ===
//   const handleGeneSelect = (gene: string) => {
//     if (!selectedGenes.includes(gene)) {
//       if (maxGenes !== undefined && selectedGenes.length >= maxGenes) {
//         if (maxGenes === 1) onGenesChange([gene]);
//         return;
//       }
//       onGenesChange([...selectedGenes, gene]);
//     }
//     setSearchTerm("");
//     setShowDropdown(false);
//   };

//   const handleGeneRemove = (gene: string) => {
//     onGenesChange(selectedGenes.filter((g) => g !== gene));
//   };

//   const handleSuggestedGeneAdd = (gene: string) => {
//     if (!selectedGenes.includes(gene)) {
//       if (maxGenes !== undefined && selectedGenes.length >= maxGenes) {
//         if (maxGenes === 1) onGenesChange([gene]);
//         return;
//       }
//       onGenesChange([...selectedGenes, gene]);
//     }
//   };

//   // New handler to clear all genes
//   const handleClearGenes = () => {
//     onGenesChange([]);
//   };

//   // === UI ===
//   return (
//     <Card className="border shadow-lg">
//       <CardHeader>
//         <CardTitle className="text-xl text-blue-800">
//           Select Genes{" "}
//           {maxGenes === 1
//             ? "(Select 1 Gene)"
//             : maxGenes
//             ? `(Max ${maxGenes} Genes)`
//             : ""}
//         </CardTitle>
//       </CardHeader>

//       <CardContent className="space-y-4">
//         {/* Search Input */}
//         <div className="relative">
//           <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
//           <Input
//             type="text"
//             placeholder={loading ? "Loading genes..." : "Search for genes..."}
//             value={searchTerm}
//             onChange={(e) => {
//               setSearchTerm(e.target.value);
//               setShowDropdown(e.target.value.length > 0);
//             }}
//             onFocus={() => setShowDropdown(searchTerm.length > 0)}
//             disabled={loading || (maxGenes !== undefined && selectedGenes.length >= maxGenes)}
//             className="pl-10"
//           />

//           {error && <p className="text-sm text-red-600 mt-1">{error}</p>}
//           {maxGenes !== undefined && selectedGenes.length >= maxGenes && (
//             <p className="text-sm text-red-600 mt-1">
//               Maximum gene limit ({maxGenes}) reached. Remove a gene to add another.
//             </p>
//           )}

//           {showDropdown && filteredGenes.length > 0 && (
//             <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-48 overflow-y-auto">
//               {filteredGenes.slice(0, 10).map((gene) => (
//                 <button
//                   key={gene}
//                   onClick={() => handleGeneSelect(gene)}
//                   className="w-full px-4 py-2 text-left hover:bg-blue-50 border-b border-gray-100 last:border-b-0"
//                   disabled={maxGenes !== undefined && selectedGenes.length >= maxGenes}
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
//                 disabled={
//                   selectedGenes.includes(gene) ||
//                   (maxGenes !== undefined && selectedGenes.length >= maxGenes)
//                 }
//                 className="text-xs"
//               >
//                 {gene}
//               </Button>
//             ))}
//             <Button onClick={handleClearGenes} className="ml-auto flex items-center gap-2" variant="outline">
//             Clear genes
//           </Button>
//           </div>
          
//         </div>

//         {/* Selected Genes */}
//         {selectedGenes.length > 0 && (
//           <div className="space-y-2">
//             <div className="flex items-center justify-between">
//               <h4 className="text-sm font-medium text-gray-700">
//                 Selected Genes ({selectedGenes.length}
//                 {maxGenes ? `/${maxGenes}` : ""}):
//               </h4>

//               <Button
//                 variant="outline"
//                 size="sm"
//                 onClick={handleClearGenes}
//                 className="text-xs flex items-center gap-1"
//               >
//                 Clear Genes
//               </Button>
        
          
//             </div>

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

// import { useState, useEffect } from "react";
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// import { Input } from "@/components/ui/input";
// import { Badge } from "@/components/ui/badge";
// import { Button } from "@/components/ui/button";
// import { X, Search } from "lucide-react";

// interface GeneSelectorProps {
//   selectedGenes: string[];
//   onGenesChange: (genes: string[]) => void;
//   maxGenes?: number;
// }

// const API_BASE = "/api"; // 👈 Update if backend hosted elsewhere

// const GeneSelector = ({ selectedGenes, onGenesChange, maxGenes }: GeneSelectorProps) => {
//   const [searchTerm, setSearchTerm] = useState("");
//   const [showDropdown, setShowDropdown] = useState(false);
//   const [allGenes, setAllGenes] = useState<string[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState<string | null>(null);

//   const suggestedGenes = ["TP53", "BRCA1", "BRCA2", "KRAS", "EGFR", "PIK3CA", "APC", "PTEN"];

//   // === Fetch genes from FastAPI ===
//   useEffect(() => {
//     const fetchGenes = async () => {
//       try {
//         const res = await fetch(`${API_BASE}/genes`);
//         if (!res.ok) throw new Error("Failed to fetch genes");
//         const data = await res.json();
//         setAllGenes(data.genes.sort());
//       } catch (err) {
//         console.error(err);
//         setError("Failed to load gene list from server.");
//       } finally {
//         setLoading(false);
//       }
//     };
//     fetchGenes();
//   }, []);

//   // === Filtering & sorting ===
//   const filteredGenes = [...allGenes]
//     .filter((gene) => !selectedGenes.includes(gene))
//     .map((gene) => {
//       const lowerGene = gene.toLowerCase();
//       const lowerSearch = searchTerm.toLowerCase();
//       let score = 2;
//       if (lowerGene.startsWith(lowerSearch)) score = 0;
//       else if (lowerGene.includes(lowerSearch)) score = 1;
//       return { gene, score };
//     })
//     .filter(({ score }) => score < 2)
//     .sort((a, b) => a.score - b.score || a.gene.localeCompare(b.gene))
//     .map(({ gene }) => gene);

//   // === Handlers ===
//   const handleGeneSelect = (gene: string) => {
//     if (!selectedGenes.includes(gene)) {
//       if (maxGenes !== undefined && selectedGenes.length >= maxGenes) {
//         if (maxGenes === 1) onGenesChange([gene]);
//         return;
//       }
//       onGenesChange([...selectedGenes, gene]);
//     }
//     setSearchTerm("");
//     setShowDropdown(false);
//   };

//   const handleGeneRemove = (gene: string) => {
//     onGenesChange(selectedGenes.filter((g) => g !== gene));
//   };

//   const handleSuggestedGeneAdd = (gene: string) => {
//     if (!selectedGenes.includes(gene)) {
//       if (maxGenes !== undefined && selectedGenes.length >= maxGenes) {
//         if (maxGenes === 1) onGenesChange([gene]);
//         return;
//       }
//       onGenesChange([...selectedGenes, gene]);
//     }
//   };

//   // === UI ===
//   return (
//     <Card className="border shadow-lg">
//       <CardHeader>
//         <CardTitle className="text-xl text-blue-800">
//           Select Genes{" "}
//           {maxGenes === 1
//             ? "(Select 1 Gene)"
//             : maxGenes
//             ? `(Max ${maxGenes} Genes)`
//             : ""}
//         </CardTitle>
//       </CardHeader>

//       <CardContent className="space-y-4">
//         {/* Search Input */}
//         <div className="relative">
//           <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
//           <Input
//             type="text"
//             placeholder={loading ? "Loading genes..." : "Search for genes..."}
//             value={searchTerm}
//             onChange={(e) => {
//               setSearchTerm(e.target.value);
//               setShowDropdown(e.target.value.length > 0);
//             }}
//             onFocus={() => setShowDropdown(searchTerm.length > 0)}
//             disabled={loading || (maxGenes !== undefined && selectedGenes.length >= maxGenes)}
//             className="pl-10"
//           />

//           {/* Error / Limit messages */}
//           {error && <p className="text-sm text-red-600 mt-1">{error}</p>}
//           {maxGenes !== undefined && selectedGenes.length >= maxGenes && (
//             <p className="text-sm text-red-600 mt-1">
//               Maximum gene limit ({maxGenes}) reached. Remove a gene to add another.
//             </p>
//           )}

//           {/* Dropdown */}
//           {showDropdown && filteredGenes.length > 0 && (
//             <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-48 overflow-y-auto">
//               {filteredGenes.slice(0, 10).map((gene) => (
//                 <button
//                   key={gene}
//                   onClick={() => handleGeneSelect(gene)}
//                   className="w-full px-4 py-2 text-left hover:bg-blue-50 border-b border-gray-100 last:border-b-0"
//                   disabled={maxGenes !== undefined && selectedGenes.length >= maxGenes}
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
//                 disabled={
//                   selectedGenes.includes(gene) ||
//                   (maxGenes !== undefined && selectedGenes.length >= maxGenes)
//                 }
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
//               Selected Genes ({selectedGenes.length}
//               {maxGenes ? `/${maxGenes}` : ""}):
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
// import { useState, useEffect } from "react";
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// import { Input } from "@/components/ui/input";
// import { Button } from "@/components/ui/button";
// import { X, Search } from "lucide-react";

// interface GeneSelectorProps {
//   selectedGenes: string[]; // array of Ensembl IDs
//   onGenesChange: (genes: string[]) => void;
//   maxGenes?: number;
// }

// type GeneItem = {
//   gene: string;
//   ensembl_id: string;
// };

// type GeneApiResponse = {
//   genes: Record<string, string[]>; // gene_symbol -> array of Ensembl IDs
// };

// const API_BASE = "/api";

// const suggestedGenes = ["TP53", "BRCA1", "BRCA2", "KRAS", "EGFR", "PIK3CA", "APC", "PTEN"];

// const GeneSelector = ({ selectedGenes, onGenesChange, maxGenes }: GeneSelectorProps) => {
//   const [allGeneItems, setAllGeneItems] = useState<GeneItem[]>([]);
//   const [searchTerm, setSearchTerm] = useState("");
//   const [showDropdown, setShowDropdown] = useState(false);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState<string | null>(null);

//   // Fetch genes + Ensembl IDs
//   useEffect(() => {
//     const fetchAllGenes = async () => {
//       try {
//         const res = await fetch(`${API_BASE}/gene_IDs`);
//         const data: GeneApiResponse = await res.json();
//         const items: GeneItem[] = [];
//         Object.entries(data.genes).forEach(([gene, ids]) => {
//           ids.forEach((id) => items.push({ gene, ensembl_id: id }));
//         });
//         setAllGeneItems(items.sort((a, b) => a.gene.localeCompare(b.gene)));
//       } catch (err) {
//         console.error(err);
//         setError("Failed to load gene list from server.");
//       } finally {
//         setLoading(false);
//       }
//     };
//     fetchAllGenes();
//   }, []);

//   const filteredItems = allGeneItems
//     .filter((item) => !selectedGenes.includes(item.ensembl_id))
//     .filter((item) => item.gene.toLowerCase().includes(searchTerm.toLowerCase()))
//     .slice(0, 10);

//   const handleSelect = (item: GeneItem) => {
//     if (!selectedGenes.includes(item.ensembl_id)) {
//       if (maxGenes !== undefined && selectedGenes.length >= maxGenes) {
//         if (maxGenes === 1) onGenesChange([item.ensembl_id]);
//         return;
//       }
//       onGenesChange([...selectedGenes, item.ensembl_id]);
//     }
//     setSearchTerm("");
//     setShowDropdown(false);
//   };

//   const handleRemove = (id: string) => {
//     onGenesChange(selectedGenes.filter((g) => g !== id));
//   };

//   const handleSuggestedGeneAdd = (gene: string) => {
//     const geneItems = allGeneItems.filter((item) => item.gene === gene);
//     if (geneItems.length > 0) handleSelect(geneItems[0]); // pick first ID
//   };

//   const handleClearGenes = () => onGenesChange([]);

//   return (
//     <Card className="border shadow-lg">
//       <CardHeader>
//         <CardTitle className="text-xl text-blue-800">
//           Select Genes {maxGenes === 1 ? "(Select 1 Gene)" : maxGenes ? `(Max ${maxGenes} Genes)` : ""}
//         </CardTitle>
//       </CardHeader>

//       <CardContent className="space-y-4">
//         {/* Search */}
//         <div className="relative">
//           <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
//           <Input
//             type="text"
//             placeholder={loading ? "Loading genes..." : "Search for genes..."}
//             value={searchTerm}
//             onChange={(e) => {
//               setSearchTerm(e.target.value);
//               setShowDropdown(e.target.value.length > 0);
//             }}
//             onFocus={() => setShowDropdown(searchTerm.length > 0)}
//             disabled={loading || (maxGenes !== undefined && selectedGenes.length >= maxGenes)}
//             className="pl-10"
//           />

//           {error && <p className="text-sm text-red-600 mt-1">{error}</p>}

//           {showDropdown && filteredItems.length > 0 && (
//             <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-48 overflow-y-auto">
//               {filteredItems.map((item) => (
//                 <button
//                   key={item.ensembl_id}
//                   onClick={() => handleSelect(item)}
//                   className="w-full px-4 py-2 text-left hover:bg-blue-50 border-b border-gray-100 last:border-b-0"
//                 >
//                   <div className="font-medium">{item.gene}</div>
//                   <div className="text-xs text-gray-500">{item.ensembl_id}</div>
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
//                 variant={selectedGenes.some((id) => allGeneItems.find((i) => i.gene === gene && i.ensembl_id === id))
//                   ? "default"
//                   : "outline"}
//                 size="sm"
//                 onClick={() => handleSuggestedGeneAdd(gene)}
//                 disabled={selectedGenes.length >= (maxGenes ?? Infinity)}
//                 className="text-xs"
//               >
//                 {gene}
//               </Button>
//             ))}
//             <Button onClick={handleClearGenes} className="ml-auto flex items-center gap-2" variant="outline">
//               Clear genes
//             </Button>
//           </div>
//         </div>

//         {/* Selected Genes */}
//         {selectedGenes.length > 0 && (
//           <div className="space-y-2">
//             <div className="flex items-center justify-between">
//               <h4 className="text-sm font-medium text-gray-700">
//                 Selected Genes ({selectedGenes.length}{maxGenes ? `/${maxGenes}` : ""}):
//               </h4>
//             </div>

//             <div className="flex flex-wrap gap-2">
//               {selectedGenes.map((id) => {
//                 const item = allGeneItems.find((i) => i.ensembl_id === id);
//                 if (!item) return null;
//                 return (
//                   <div
//                     key={id}
//                     className="px-3 py-1 bg-gray-100 rounded-md border text-sm flex items-center justify-between"
//                   >
//                     <div>
//                       <div className="font-semibold">{item.gene}</div>
//                       <div className="text-xs text-gray-500">{item.ensembl_id}</div>
//                     </div>
//                     <button
//                       onClick={() => handleRemove(id)}
//                       className="ml-2 hover:bg-gray-300 rounded-full p-1"
//                     >
//                       <X className="h-3 w-3" />
//                     </button>
//                   </div>
//                 );
//               })}
//             </div>
//           </div>
//         )}
//       </CardContent>
//     </Card>
//   );
// };

// export default GeneSelector;


// // import { useState, useEffect } from "react";
// // import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// // import { Input } from "@/components/ui/input";
// // import { Badge } from "@/components/ui/badge";
// // import { Button } from "@/components/ui/button";
// // import { X, Search, Trash2 } from "lucide-react"; // 

// // interface GeneSelectorProps {
// //   selectedGenes: string[];
// //   onGenesChange: (genes: string[]) => void;
// //   maxGenes?: number;
// // }

// // const API_BASE = "/api";

// // const GeneSelector = ({ selectedGenes, onGenesChange, maxGenes }: GeneSelectorProps) => {
// //   const [searchTerm, setSearchTerm] = useState("");
// //   const [showDropdown, setShowDropdown] = useState(false);
// //   const [allGenes, setAllGenes] = useState<string[]>([]);
// //   const [loading, setLoading] = useState(true);
// //   const [error, setError] = useState<string | null>(null);
// //   const [ensemblMap, setEnsemblMap] = useState<Record<string, string>>({});


// //   const suggestedGenes = ["TP53", "BRCA1", "BRCA2", "KRAS", "EGFR", "PIK3CA", "APC", "PTEN"];

// //   // === Fetch genes from FastAPI ===
// //   useEffect(() => {
// //     const fetchGenes = async () => {
// //       try {
// //         const res = await fetch(`${API_BASE}/genes`);
// //         if (!res.ok) throw new Error("Failed to fetch genes");
// //         const data = await res.json();
// //         setAllGenes(data.genes.sort());
// //       } catch (err) {
// //         console.error(err);
// //         setError("Failed to load gene list from server.");
// //       } finally {
// //         setLoading(false);
// //       }
// //     };
// //     fetchGenes();
// //   }, []);

// //   // === Filtering & sorting ===
// //   const filteredGenes = [...allGenes]
// //     .filter((gene) => !selectedGenes.includes(gene))
// //     .map((gene) => {
// //       const lowerGene = gene.toLowerCase();
// //       const lowerSearch = searchTerm.toLowerCase();
// //       let score = 2;
// //       if (lowerGene.startsWith(lowerSearch)) score = 0;
// //       else if (lowerGene.includes(lowerSearch)) score = 1;
// //       return { gene, score };
// //     })
// //     .filter(({ score }) => score < 2)
// //     .sort((a, b) => a.score - b.score || a.gene.localeCompare(b.gene))
// //     .map(({ gene }) => gene);

// //   // === Handlers ===
// //   // const handleGeneSelect = (gene: string) => {
// //   //   if (!selectedGenes.includes(gene)) {
// //   //     if (maxGenes !== undefined && selectedGenes.length >= maxGenes) {
// //   //       if (maxGenes === 1) onGenesChange([gene]);
// //   //       return;
// //   //     }
// //   //     onGenesChange([...selectedGenes, gene]);
// //   //   }
// //   //   setSearchTerm("");
// //   //   setShowDropdown(false);
// //   // };

// //   const handleGeneSelect = async (gene: string) => {
// //     if (!selectedGenes.includes(gene)) {
// //       // Fetch Ensembl ID
// //       if (!ensemblMap[gene]) {
// //         const res = await fetch(`${API_BASE}/ensembl/${gene}`);
// //         const data = await res.json();
// //         setEnsemblMap((prev) => ({ ...prev, [gene]: data.ensembl_id }));
// //       }

// //       if (maxGenes !== undefined && selectedGenes.length >= maxGenes) {
// //         if (maxGenes === 1) onGenesChange([gene]);
// //         return;
// //       }

// //       onGenesChange([...selectedGenes, gene]);
// //     }

// //     setSearchTerm("");
// //     setShowDropdown(false);
// //   };

// //   const handleGeneRemove = (gene: string) => {
// //     onGenesChange(selectedGenes.filter((g) => g !== gene));
// //   };

// //   const handleSuggestedGeneAdd = (gene: string) => {
// //     if (!selectedGenes.includes(gene)) {
// //       if (maxGenes !== undefined && selectedGenes.length >= maxGenes) {
// //         if (maxGenes === 1) onGenesChange([gene]);
// //         return;
// //       }
// //       onGenesChange([...selectedGenes, gene]);
// //     }
// //   };

// //   // ✅ New handler to clear all genes
// //   const handleClearGenes = () => {
// //     onGenesChange([]);
// //   };

// //   // === UI ===
// //   return (
// //     <Card className="border shadow-lg">
// //       <CardHeader>
// //         <CardTitle className="text-xl text-blue-800">
// //           Select Genes{" "}
// //           {maxGenes === 1
// //             ? "(Select 1 Gene)"
// //             : maxGenes
// //             ? `(Max ${maxGenes} Genes)`
// //             : ""}
// //         </CardTitle>
// //       </CardHeader>

// //       <CardContent className="space-y-4">
// //         {/* Search Input */}
// //         <div className="relative">
// //           <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
// //           <Input
// //             type="text"
// //             placeholder={loading ? "Loading genes..." : "Search for genes..."}
// //             value={searchTerm}
// //             onChange={(e) => {
// //               setSearchTerm(e.target.value);
// //               setShowDropdown(e.target.value.length > 0);
// //             }}
// //             onFocus={() => setShowDropdown(searchTerm.length > 0)}
// //             disabled={loading || (maxGenes !== undefined && selectedGenes.length >= maxGenes)}
// //             className="pl-10"
// //           />

// //           {error && <p className="text-sm text-red-600 mt-1">{error}</p>}
// //           {maxGenes !== undefined && selectedGenes.length >= maxGenes && (
// //             <p className="text-sm text-red-600 mt-1">
// //               Maximum gene limit ({maxGenes}) reached. Remove a gene to add another.
// //             </p>
// //           )}

// //           {showDropdown && filteredGenes.length > 0 && (
// //             <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-48 overflow-y-auto">
// //               {filteredGenes.slice(0, 10).map((gene) => (
// //                 // <button
// //                 //   key={gene}
// //                 //   onClick={() => handleGeneSelect(gene)}
// //                 //   className="w-full px-4 py-2 text-left hover:bg-blue-50 border-b border-gray-100 last:border-b-0"
// //                 //   disabled={maxGenes !== undefined && selectedGenes.length >= maxGenes}
// //                 // >
// //                 //   {gene}
// //                 // </button>
// //                 <div className="space-y-2">
// //                   <div className="flex flex-col gap-2">
// //                     {selectedGenes.map((gene) => (
// //                       <div
// //                         key={gene}
// //                         className="px-3 py-1 bg-gray-100 rounded-md border text-sm flex items-center justify-between"
// //                       >
// //                         <div>
// //                           <div className="font-semibold">{gene}</div>
// //                           <div className="text-xs text-gray-500">
// //                             {ensemblMap[gene] ?? "Loading..."}
// //                           </div>
// //                         </div>

// //                         <button
// //                           onClick={() => handleGeneRemove(gene)}
// //                           className="ml-2 hover:bg-gray-300 rounded-full p-1"
// //                         >
// //                           <X className="h-3 w-3" />
// //                         </button>
// //                       </div>
// //                     ))}
// //                   </div>
// //                 </div>

// //               ))}
// //             </div>
// //           )}
// //         </div>

// //         {/* Suggested Genes */}
// //         <div>
// //           <h4 className="text-sm font-medium text-gray-700 mb-2">Suggested Cancer Genes:</h4>
// //           <div className="flex flex-wrap gap-2">
// //             {suggestedGenes.map((gene) => (
// //               <Button
// //                 key={gene}
// //                 variant={selectedGenes.includes(gene) ? "default" : "outline"}
// //                 size="sm"
// //                 onClick={() => handleSuggestedGeneAdd(gene)}
// //                 disabled={
// //                   selectedGenes.includes(gene) ||
// //                   (maxGenes !== undefined && selectedGenes.length >= maxGenes)
// //                 }
// //                 className="text-xs"
// //               >
// //                 {gene}
// //               </Button>
// //             ))}
// //             <Button onClick={handleClearGenes} className="ml-auto flex items-center gap-2" variant="outline">
// //             Clear genes
// //           </Button>
// //           </div>
          
// //         </div>

// //         {/* Selected Genes */}
// //         {selectedGenes.length > 0 && (
// //           <div className="space-y-2">
// //             <div className="flex items-center justify-between">
// //               <h4 className="text-sm font-medium text-gray-700">
// //                 Selected Genes ({selectedGenes.length}
// //                 {maxGenes ? `/${maxGenes}` : ""}):
// //               </h4>

// //               {/* <Button
// //                 variant="outline"
// //                 size="sm"
// //                 onClick={handleClearGenes}
// //                 className="text-xs flex items-center gap-1"
// //               >
// //                 <Trash2 className="h-3 w-3" />
// //                 Clear Genes
// //               </Button> */}
        
          
// //             </div>

// //             <div className="flex flex-wrap gap-2">
// //               {selectedGenes.map((gene) => (
// //                 <Badge key={gene} variant="secondary" className="flex items-center gap-1">
// //                   {gene}
// //                   <button
// //                     onClick={() => handleGeneRemove(gene)}
// //                     className="ml-1 hover:bg-gray-300 rounded-full p-0.5"
// //                   >
// //                     <X className="h-3 w-3" />
// //                   </button>
// //                 </Badge>
// //               ))}
// //             </div>
// //           </div>
// //         )}
// //       </CardContent>
// //     </Card>
// //   );
// // };

// // export default GeneSelector;

// // import { useState, useEffect } from "react";
// // import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// // import { Input } from "@/components/ui/input";
// // import { Badge } from "@/components/ui/badge";
// // import { Button } from "@/components/ui/button";
// // import { X, Search } from "lucide-react";

// // interface GeneSelectorProps {
// //   selectedGenes: string[];
// //   onGenesChange: (genes: string[]) => void;
// //   maxGenes?: number;
// // }

// // const API_BASE = "/api"; // 👈 Update if backend hosted elsewhere

// // const GeneSelector = ({ selectedGenes, onGenesChange, maxGenes }: GeneSelectorProps) => {
// //   const [searchTerm, setSearchTerm] = useState("");
// //   const [showDropdown, setShowDropdown] = useState(false);
// //   const [allGenes, setAllGenes] = useState<string[]>([]);
// //   const [loading, setLoading] = useState(true);
// //   const [error, setError] = useState<string | null>(null);

// //   const suggestedGenes = ["TP53", "BRCA1", "BRCA2", "KRAS", "EGFR", "PIK3CA", "APC", "PTEN"];

// //   // === Fetch genes from FastAPI ===
// //   useEffect(() => {
// //     const fetchGenes = async () => {
// //       try {
// //         const res = await fetch(`${API_BASE}/genes`);
// //         if (!res.ok) throw new Error("Failed to fetch genes");
// //         const data = await res.json();
// //         setAllGenes(data.genes.sort());
// //       } catch (err) {
// //         console.error(err);
// //         setError("Failed to load gene list from server.");
// //       } finally {
// //         setLoading(false);
// //       }
// //     };
// //     fetchGenes();
// //   }, []);

// //   // === Filtering & sorting ===
// //   const filteredGenes = [...allGenes]
// //     .filter((gene) => !selectedGenes.includes(gene))
// //     .map((gene) => {
// //       const lowerGene = gene.toLowerCase();
// //       const lowerSearch = searchTerm.toLowerCase();
// //       let score = 2;
// //       if (lowerGene.startsWith(lowerSearch)) score = 0;
// //       else if (lowerGene.includes(lowerSearch)) score = 1;
// //       return { gene, score };
// //     })
// //     .filter(({ score }) => score < 2)
// //     .sort((a, b) => a.score - b.score || a.gene.localeCompare(b.gene))
// //     .map(({ gene }) => gene);

// //   // === Handlers ===
// //   const handleGeneSelect = (gene: string) => {
// //     if (!selectedGenes.includes(gene)) {
// //       if (maxGenes !== undefined && selectedGenes.length >= maxGenes) {
// //         if (maxGenes === 1) onGenesChange([gene]);
// //         return;
// //       }
// //       onGenesChange([...selectedGenes, gene]);
// //     }
// //     setSearchTerm("");
// //     setShowDropdown(false);
// //   };

// //   const handleGeneRemove = (gene: string) => {
// //     onGenesChange(selectedGenes.filter((g) => g !== gene));
// //   };

// //   const handleSuggestedGeneAdd = (gene: string) => {
// //     if (!selectedGenes.includes(gene)) {
// //       if (maxGenes !== undefined && selectedGenes.length >= maxGenes) {
// //         if (maxGenes === 1) onGenesChange([gene]);
// //         return;
// //       }
// //       onGenesChange([...selectedGenes, gene]);
// //     }
// //   };

// //   // === UI ===
// //   return (
// //     <Card className="border shadow-lg">
// //       <CardHeader>
// //         <CardTitle className="text-xl text-blue-800">
// //           Select Genes{" "}
// //           {maxGenes === 1
// //             ? "(Select 1 Gene)"
// //             : maxGenes
// //             ? `(Max ${maxGenes} Genes)`
// //             : ""}
// //         </CardTitle>
// //       </CardHeader>

// //       <CardContent className="space-y-4">
// //         {/* Search Input */}
// //         <div className="relative">
// //           <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
// //           <Input
// //             type="text"
// //             placeholder={loading ? "Loading genes..." : "Search for genes..."}
// //             value={searchTerm}
// //             onChange={(e) => {
// //               setSearchTerm(e.target.value);
// //               setShowDropdown(e.target.value.length > 0);
// //             }}
// //             onFocus={() => setShowDropdown(searchTerm.length > 0)}
// //             disabled={loading || (maxGenes !== undefined && selectedGenes.length >= maxGenes)}
// //             className="pl-10"
// //           />

// //           {/* Error / Limit messages */}
// //           {error && <p className="text-sm text-red-600 mt-1">{error}</p>}
// //           {maxGenes !== undefined && selectedGenes.length >= maxGenes && (
// //             <p className="text-sm text-red-600 mt-1">
// //               Maximum gene limit ({maxGenes}) reached. Remove a gene to add another.
// //             </p>
// //           )}

// //           {/* Dropdown */}
// //           {showDropdown && filteredGenes.length > 0 && (
// //             <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-48 overflow-y-auto">
// //               {filteredGenes.slice(0, 10).map((gene) => (
// //                 <button
// //                   key={gene}
// //                   onClick={() => handleGeneSelect(gene)}
// //                   className="w-full px-4 py-2 text-left hover:bg-blue-50 border-b border-gray-100 last:border-b-0"
// //                   disabled={maxGenes !== undefined && selectedGenes.length >= maxGenes}
// //                 >
// //                   {gene}
// //                 </button>
// //               ))}
// //             </div>
// //           )}
// //         </div>

// //         {/* Suggested Genes */}
// //         <div>
// //           <h4 className="text-sm font-medium text-gray-700 mb-2">Suggested Cancer Genes:</h4>
// //           <div className="flex flex-wrap gap-2">
// //             {suggestedGenes.map((gene) => (
// //               <Button
// //                 key={gene}
// //                 variant={selectedGenes.includes(gene) ? "default" : "outline"}
// //                 size="sm"
// //                 onClick={() => handleSuggestedGeneAdd(gene)}
// //                 disabled={
// //                   selectedGenes.includes(gene) ||
// //                   (maxGenes !== undefined && selectedGenes.length >= maxGenes)
// //                 }
// //                 className="text-xs"
// //               >
// //                 {gene}
// //               </Button>
// //             ))}
// //           </div>
// //         </div>

// //         {/* Selected Genes */}
// //         {selectedGenes.length > 0 && (
// //           <div>
// //             <h4 className="text-sm font-medium text-gray-700 mb-2">
// //               Selected Genes ({selectedGenes.length}
// //               {maxGenes ? `/${maxGenes}` : ""}):
// //             </h4>
// //             <div className="flex flex-wrap gap-2">
// //               {selectedGenes.map((gene) => (
// //                 <Badge key={gene} variant="secondary" className="flex items-center gap-1">
// //                   {gene}
// //                   <button
// //                     onClick={() => handleGeneRemove(gene)}
// //                     className="ml-1 hover:bg-gray-300 rounded-full p-0.5"
// //                   >
// //                     <X className="h-3 w-3" />
// //                   </button>
// //                 </Badge>
// //               ))}
// //             </div>
// //           </div>
// //         )}
// //       </CardContent>
// //     </Card>
// //   );
// // };

// // export default GeneSelector;
