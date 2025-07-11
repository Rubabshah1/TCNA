
// // // // import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// // // // interface CancerTypeSelectorProps {
// // // //   selectedCancerType: string;
// // // //   onCancerTypeChange: (value: string) => void;
// // // // }

// // // // const cancerTypes = [
// // // //   { value: "breast", label: "Breast Cancer (BRCA)", description: "Invasive breast carcinoma" },
// // // //   { value: "lung", label: "Lung Cancer (LUAD)", description: "Lung adenocarcinoma" },
// // // //   { value: "prostate", label: "Prostate Cancer (PRAD)", description: "Prostate adenocarcinoma" },
// // // //   { value: "colorectal", label: "Colorectal Cancer (COAD)", description: "Colon adenocarcinoma" },
// // // //   { value: "liver", label: "Liver Cancer (LIHC)", description: "Liver hepatocellular carcinoma" },
// // // //   { value: "kidney", label: "Kidney Cancer (KIRC)", description: "Kidney renal clear cell carcinoma" },
// // // //   { value: "stomach", label: "Stomach Cancer (STAD)", description: "Stomach adenocarcinoma" },
// // // //   { value: "ovarian", label: "Ovarian Cancer (OV)", description: "Ovarian serous cystadenocarcinoma" }
// // // // ];

// // // // const CancerTypeSelector = ({ selectedCancerType, onCancerTypeChange }: CancerTypeSelectorProps) => {
// // // //   return (
// // // //     <div className="space-y-4">
// // // //       <Select value={selectedCancerType} onValueChange={onCancerTypeChange}>
// // // //         <SelectTrigger className="w-full">
// // // //           <SelectValue placeholder="Choose a cancer type" />
// // // //         </SelectTrigger>
// // // //         <SelectContent>
// // // //           {cancerTypes.map((cancer) => (
// // // //             <SelectItem key={cancer.value} value={cancer.value}>
// // // //               <div className="flex flex-col">
// // // //                 <span className="font-medium">{cancer.label}</span>
// // // //                 <span className="text-sm text-gray-500">{cancer.description}</span>
// // // //               </div>
// // // //             </SelectItem>
// // // //           ))}
// // // //         </SelectContent>
// // // //       </Select>
      
// // // //       {selectedCancerType && (
// // // //         <div className="p-4 bg-gradient-to-r from-blue-50 to-yellow-50 rounded-lg border border-blue-200">
// // // //           <h4 className="font-medium text-blue-800 mb-2">Selected Cancer Type:</h4>
// // // //           <p className="text-blue-700">
// // // //             {cancerTypes.find(c => c.value === selectedCancerType)?.description}
// // // //           </p>
// // // //         </div>
// // // //       )}
// // // //     </div>
// // // //   );
// // // // };

// // // // export default CancerTypeSelector;

// // // import { useState } from "react";
// // // import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// // // import { Input } from "@/components/ui/input";
// // // import { Badge } from "@/components/ui/badge";
// // // import { Button } from "@/components/ui/button";
// // // import { X, Search } from "lucide-react";

// // // interface CancerTypeSelectorProps {
// // //   selectedCancerType: string[];
// // //   onCancerTypesChange: (CancerTypes: string[]) => void;
// // // }

// // // const CancerTypeSelector = ({ selectedCancerType, onCancerTypesChange }: CancerTypeSelectorProps) => {
// // //   const [searchTerm, setSearchTerm] = useState("");
// // //   const [showDropdown, setShowDropdown] = useState(false);

// // //   // Alphabetically sorted CancerType list with common cancer CancerTypes
// // //   const allCancerTypes = ["Breast", "Lung", "Prostate", "Colorectal", "Liver", "Kidney", "Stomach", "Ovarian"];

// // //   // const suggestedCancerTypes = ["TP53", "BRCA1", "BRCA2", "KRAS", "EGFR", "PIK3CA", "APC", "PTEN"];

// // //   const filteredCancerTypes = allCancerTypes.filter(CancerType => 
// // //     CancerType.toLowerCase().includes(searchTerm.toLowerCase()) &&
// // //     !selectedCancerType.includes(CancerType)
// // //   );

// // //   const handleCancerTypeSelect = (CancerType: string) => {
// // //     if (!selectedCancerType.includes(CancerType)) {
// // //       onCancerTypesChange([...selectedCancerType, CancerType]);
// // //     }
// // //     setSearchTerm("");
// // //     setShowDropdown(false);
// // //   };

// // //   const handleCancerTypeRemove = (CancerType: string) => {
// // //     onCancerTypesChange(selectedCancerType.filter(g => g !== CancerType));
// // //   };

// // //   // const handleSuggestedCancerTypeAdd = (CancerType: string) => {
// // //   //   if (!selectedCancerType.includes(CancerType)) {
// // //   //     onCancerTypesChange([...selectedCancerType, CancerType]);
// // //   //   }
// // //   // };

// // //   return (
// // //     <Card className="border-0 shadow-lg">
// // //       <CardHeader>
// // //         <CardTitle className="text-xl text-blue-800">Select CancerTypes for Analysis</CardTitle>
// // //       </CardHeader>
// // //       <CardContent className="space-y-4">
// // //         {/* Search Input */}
// // //         <div className="relative">
// // //           <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
// // //           <Input
// // //             type="text"
// // //             placeholder="Search for CancerTypes..."
// // //             value={searchTerm}
// // //             onChange={(e) => {
// // //               setSearchTerm(e.target.value);
// // //               setShowDropdown(e.target.value.length > 0);
// // //             }}
// // //             onFocus={() => setShowDropdown(searchTerm.length > 0)}
// // //             className="pl-10"
// // //           />
          
// // //           {/* Dropdown */}
// // //           {showDropdown && filteredCancerTypes.length > 0 && (
// // //             <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-48 overflow-y-auto">
// // //               {filteredCancerTypes.slice(0, 10).map((CancerType) => (
// // //                 <button
// // //                   key={CancerType}
// // //                   onClick={() => handleCancerTypeSelect(CancerType)}
// // //                   className="w-full px-4 py-2 text-left hover:bg-blue-50 border-b border-gray-100 last:border-b-0"
// // //                 >
// // //                   {CancerType}
// // //                 </button>
// // //               ))}
// // //             </div>
// // //           )}
// // //         </div>

// // //         {/* Suggested CancerTypes */}
// // //         {/* <div>
// // //           <h4 className="text-sm font-medium text-gray-700 mb-2">Suggested Cancer CancerTypes:</h4>
// // //           <div className="flex flex-wrap gap-2">
// // //             {suggestedCancerTypes.map((CancerType) => (
// // //               <Button
// // //                 key={CancerType}
// // //                 variant={selectedCancerType.includes(CancerType) ? "default" : "outline"}
// // //                 size="sm"
// // //                 onClick={() => handleSuggestedCancerTypeAdd(CancerType)}
// // //                 disabled={selectedCancerType.includes(CancerType)}
// // //                 className="text-xs"
// // //               >
// // //                 {CancerType}
// // //               </Button>
// // //             ))}
// // //           </div>
// // //         </div> */}

// // //         {/* Selected CancerTypes */}
// // //         {selectedCancerType.length > 0 && (
// // //           <div>
// // //             <h4 className="text-sm font-medium text-gray-700 mb-2">
// // //               Selected CancerTypes ({selectedCancerType.length}):
// // //             </h4>
// // //             <div className="flex flex-wrap gap-2">
// // //               {selectedCancerType.map((CancerType) => (
// // //                 <Badge key={CancerType} variant="secondary" className="flex items-center gap-1">
// // //                   {CancerType}
// // //                   <button
// // //                     onClick={() => handleCancerTypeRemove(CancerType)}
// // //                     className="ml-1 hover:bg-gray-300 rounded-full p-0.5"
// // //                   >
// // //                     <X className="h-3 w-3" />
// // //                   </button>
// // //                 </Badge>
// // //               ))}
// // //             </div>
// // //           </div>
// // //         )}
// // //       </CardContent>
// // //     </Card>
// // //   );
// // // };

// // // export default CancerTypeSelector;
// // import { useState, useEffect } from "react";
// // import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// // import { Input } from "@/components/ui/input";
// // import { Badge } from "@/components/ui/badge";
// // import { Button } from "@/components/ui/button";
// // import { X, Search } from "lucide-react";
// // import supabase from "@/supabase-client";

// // interface CancerTypeSelectorProps {
// //   selectedCancerType: string[];
// //   onCancerTypesChange: (CancerTypes: string[]) => void;
// // }

// // const CancerTypeSelector = ({ selectedCancerType, onCancerTypesChange }: CancerTypeSelectorProps) => {
// //   const [searchTerm, setSearchTerm] = useState("");
// //   const [showDropdown, setShowDropdown] = useState(false);
// //   const [allCancerTypes, setAllCancerTypes] = useState<string[]>([]);
// //   const [loading, setLoading] = useState<boolean>(true);
// //   const [error, setError] = useState<string | null>(null);

// //   // Fetch cancer types from the API server
// //   useEffect(() => {
// //     const fetchCancerTypes = async () => {
// //       setLoading(true);
// //       try {
// //         const { data, error } = await supabase.from("Sites").select("*");
// //         setAllCancerTypes(data.map((site: any) => site.name));
// //       } catch (err) {
// //         setError("Failed to load cancer sites");
// //         console.error(err);
// //       } finally {
// //         setLoading(false);
// //       }
// //     };
// //     fetchCancerTypes();
// //   }, []);

// //   const filteredCancerTypes = allCancerTypes.filter((CancerType) =>
// //     CancerType.toLowerCase().includes(searchTerm.toLowerCase()) &&
// //     !selectedCancerType.includes(CancerType)
// //   );

// //   const handleCancerTypeSelect = (CancerType: string) => {
// //     if (!selectedCancerType.includes(CancerType)) {
// //       onCancerTypesChange([...selectedCancerType, CancerType]);
// //     }
// //     setSearchTerm("");
// //     setShowDropdown(false);
// //   };

// //   const handleCancerTypeRemove = (CancerType: string) => {
// //     onCancerTypesChange(selectedCancerType.filter(g => g !== CancerType));
// //   };

// //   // if (loading) return <div>Loading cancer types...</div>;
// //   if (error) return <div>{error}</div>;

// //   return (
// //     <Card className="border-0 shadow-lg">
// //       <CardHeader>
// //         <CardTitle className="text-xl text-blue-800">Select Primary Sites</CardTitle>
// //       </CardHeader>
// //       <CardContent className="space-y-4">
// //         {/* Search Input */}
// //         <div className="relative">
// //           <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
// //           <Input
// //             type="text"
// //             placeholder="Search for Primary Sites..."
// //             value={searchTerm}
// //             onChange={(e) => {
// //               setSearchTerm(e.target.value);
// //               setShowDropdown(e.target.value.length > 0);
// //             }}
// //             onFocus={() => setShowDropdown(searchTerm.length > 0)}
// //             className="pl-10"
// //           />
          
// //           {/* Dropdown */}
// //           {showDropdown && filteredCancerTypes.length > 0 && (
// //             <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-48 overflow-y-auto">
// //               {filteredCancerTypes.slice(0, 10).map((CancerType) => (
// //                 <button
// //                   key={CancerType}
// //                   onClick={() => handleCancerTypeSelect(CancerType)}
// //                   className="w-full px-4 py-2 text-left hover:bg-blue-50 border-b border-gray-100 last:border-b-0"
// //                 >
// //                   {CancerType}
// //                 </button>
// //               ))}
// //             </div>
// //           )}
// //         </div>

// //         {/* Selected CancerTypes */}
// //         {selectedCancerType.length > 0 && (
// //           <div>
// //             <h4 className="text-sm font-medium text-gray-700 mb-2">
// //               Selected CancerTypes ({selectedCancerType.length}):
// //             </h4>
// //             <div className="flex flex-wrap gap-2">
// //               {selectedCancerType.map((CancerType) => (
// //                 <Badge key={CancerType} variant="secondary" className="flex items-center gap-1">
// //                   {CancerType}
// //                   <button
// //                     onClick={() => handleCancerTypeRemove(CancerType)}
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

// // export default CancerTypeSelector;
// // export default CancerTypeSelector;
// // import { useState, useEffect } from "react";
// // import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
// // import supabase from "@/supabase-client";

// // interface CancerTypeSelectorProps {
// //   selectedCancerType: string;
// //   onCancerTypeChange: (value: string) => void;
// // }

// // const CancerTypeSelector = ({ selectedCancerType, onCancerTypeChange }: CancerTypeSelectorProps) => {
// //   const [cancerTypes, setCancerTypes] = useState<{ value: string; label: string; description: string }[]>([]);
// //   const [loading, setLoading] = useState<boolean>(true);
// //   const [error, setError] = useState<string | null>(null);
// //       useEffect(() => {
// //       const fetchCancerTypes = async () => {
// //         setLoading(true);
// //         try {
// //           const { data, error } = await supabase.from("Sites").select("*");
// //           if (error) throw error;

// //           console.log("Fetched cancer sites from Supabase:", data);

// //           // const labelMap: { [key: string]: string } = {
// //           //   "TCGA-BLCA": "Bladder Cancer (BLCA)",
// //           //   "TCGA-BRCA": "Breast Cancer (BRCA)",
// //           //   "TCGA-LUAD": "Lung Cancer (LUAD)",
// //           //   "TCGA-PRAD": "Prostate Cancer (PRAD)",
// //           //   "TCGA-COAD": "Colorectal Cancer (COAD)",
// //           //   "TCGA-LIHC": "Liver Cancer (LIHC)",
// //           //   "TCGA-KIRC": "Kidney Cancer (KIRC)",
// //           //   "TCGA-STAD": "Stomach Cancer (STAD)",
// //           //   "TCGA-OV": "Ovarian Cancer (OV)",
// //           // };

// //           // const descriptionMap: { [key: string]: string } = {
// //           //   "TCGA-BLCA": "Urothelial carcinoma",
// //           //   "TCGA-BRCA": "Invasive breast carcinoma",
// //           //   "TCGA-LUAD": "Lung adenocarcinoma",
// //           //   "TCGA-PRAD": "Prostate adenocarcinoma",
// //           //   "TCGA-COAD": "Colon adenocarcinoma",
// //           //   "TCGA-LIHC": "Liver hepatocellular carcinoma",
// //           //   "TCGA-KIRC": "Kidney renal clear cell carcinoma",
// //           //   "TCGA-STAD": "Stomach adenocarcinoma",
// //           //   "TCGA-OV": "Ovarian serous cystadenocarcinoma",
// //           // };

// //           // const mapped = data.map((cancer: any) => {
// //           //   const name = cancer.tcga_code;
// //           //   return {
// //           //     value: name.toString(), // like "tcga-blca"
// //           //     label: labelMap[name] || name,
// //           //     description: cancer.name || "No description available",
// //           //   };
// //           // });
// //           setCancerTypes(data.map((site: any) => site.name));
// //         } catch (err) {
// //           setError("Failed to load cancer sites");
// //           console.error(err);
// //         } finally {
// //           setLoading(false);
// //         }
// //       };

// //       fetchCancerTypes();
// //     }, []);


// //   // if (loading) return <div>Loading cancer types...</div>;
// //   if (error) return <div>{error}</div>;

// //   return (
// //     <div className="space-y-4">
// //       <Select value={selectedCancerType} onValueChange={onCancerTypeChange}>
// //         <SelectTrigger className="w-full">
// //           <SelectValue placeholder="Choose a Cancer Site" />
// //         </SelectTrigger>
// //         {/* <SelectContent>
// //           {cancerTypes.map((cancer) => (
// //             <SelectItem key={cancer.value} value={cancer.value}>
// //               <div className="flex flex-col">
// //                 <span className="font-medium">{cancer.label}</span>
// //                 <span className="text-sm text-gray-500">{cancer.description}</span>
// //               </div>
// //             </SelectItem>
// //           ))}
// //         </SelectContent> */}
// //         <SelectContent>
// //   {cancerTypes.map((cancer) => (
// //     <SelectItem key={cancer.value} value={cancer.value}>
// //       {cancer.label}
// //     </SelectItem>
// //   ))}
// // </SelectContent>

// //       </Select>

// //       {selectedCancerType && (
// //         <div className="p-4 bg-gradient-to-r from-blue-50 to-yellow-50 rounded-lg border border-blue-200">
// //           <h4 className="font-medium text-blue-800 mb-2">Selected Cancer Site:</h4>
// //           <p className="text-blue-700">
// //             {
// //               cancerTypes.find((c) => c.value === selectedCancerType)?
// //             }
// //           </p>
// //         </div> 
// //        )} 
// //     </div>
// //   );
// // };

// // export default CancerTypeSelector;
// import { useState, useEffect } from "react";
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
// import supabase from "@/supabase-client";

// interface CancerTypeSelectorProps {
//   selectedCancerType: string;
//   onCancerTypeChange: (value: string) => void;
// }

// const CancerTypeSelector = ({ selectedCancerType, onCancerTypeChange }: CancerTypeSelectorProps) => {
//   const [cancerTypes, setCancerTypes] = useState<string[]>([]);
//   const [loading, setLoading] = useState<boolean>(true);
//   const [error, setError] = useState<string | null>(null);

//   useEffect(() => {
//     const fetchCancerTypes = async () => {
//       setLoading(true);
//       try {
//         const { data, error } = await supabase.from("Sites").select("name");
//         if (error) throw error;

//         const names = data.map((site: any) => site.name);
//         setCancerTypes(names);
//       } catch (err) {
//         setError("Failed to load cancer sites");
//         console.error(err);
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchCancerTypes();
//   }, []);

//   if (error) return <div>{error}</div>;

//   return (
//     <div className="space-y-4">
//       <Select value={selectedCancerType} onValueChange={onCancerTypeChange}>
//         <SelectTrigger className="w-full">
//           <SelectValue placeholder="Choose a Cancer" />
//         </SelectTrigger>
//         <SelectContent>
//           {cancerTypes.map((cancer) => (
//             <SelectItem key={cancer} value={cancer}>
//               {cancer}
//             </SelectItem>
//           ))}
//         </SelectContent>
//       </Select>

//       {selectedCancerType && (
//         <div className="p-4 bg-gradient-to-r from-blue-50 to-yellow-50 rounded-lg border border-blue-200">
//           <h4 className="font-medium text-blue-800 mb-2">Selected Cancer:</h4>
//           <p className="text-blue-700">{selectedCancerType}</p>
//         </div>
//       )}
//     </div>
//   );
// };

// export default CancerTypeSelector;

import { useState, useEffect } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import supabase from "@/supabase-client";
import { Button } from "@/components/ui/button";

// interface CancerTypeSelectorProps {
//   selectedCancerTypes: string[];
//   onCancerTypesChange: (values: string[]) => void;
// }
interface CancerTypeSelectorProps {
  selectedCancerTypes: string[];
  onCancerTypesChange: (values: string[]) => void;
  onSiteChange: (siteName: string) => void; // <-- Add this
}



const CancerTypeSelector = ({
  selectedCancerTypes,
  onCancerTypesChange,
  onSiteChange
}: CancerTypeSelectorProps) => {
  const [cancerSites, setCancerSites] = useState<{ id: number; name: string }[]>([]);
  const [selectedSite, setSelectedSite] = useState<string>("");
  const [cancerTypes, setCancerTypes] = useState<string[]>([]);
  const [loadingSites, setLoadingSites] = useState<boolean>(true);
  const [loadingTypes, setLoadingTypes] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch cancer sites
  useEffect(() => {
    const fetchSites = async () => {
      setLoadingSites(true);
      try {
        const { data, error } = await supabase.from("Sites").select("id, name");
        if (error) throw error;
        // Hardcoded fallback (for now)
        const hardcodedSites = [
          { id: 3, name: "Breast" },
          { id: 1, name: "Liver and Bile Duct" },
          { id: 2, name: "Colorectal" },
          { id: 23, name: "Thymus" }
        ];

      setCancerSites(hardcodedSites); // override with hardcoded sites
        // setCancerSites(data);
      } catch (err) {
        setError("Failed to load cancer sites.");
        console.error(err);
      } finally {
        setLoadingSites(false);
      }
    };
    fetchSites();
  }, []);

  // Fetch cancer types when a site is selected
  const handleSiteChange = async (siteName: string) => {
    setSelectedSite(siteName);
    setCancerTypes([]);
    onCancerTypesChange([]); // clear selection
    setLoadingTypes(true);
    onSiteChange(siteName);


    try {
      const selected = cancerSites.find((s) => s.name === siteName);
      if (!selected) throw new Error("Site not found");

      const { data, error } = await supabase
        .from("cancer_types")
        .select("tcga_code")
        .eq("site_id", selected.id);

      if (error) throw error;

      const codes = data.map((item: any) => item.tcga_code);
      setCancerTypes(codes);
    } catch (err) {
      setError("Failed to load cancer types.");
      console.error(err);
    } finally {
      setLoadingTypes(false);
    }
  };

  const handleSelectAll = () => {
    onCancerTypesChange(cancerTypes);
  };

  const handleClear = () => {
    onCancerTypesChange([]);
  };

  const handleToggleType = (type: string) => {
    if (selectedCancerTypes.includes(type)) {
      onCancerTypesChange(selectedCancerTypes.filter((t) => t !== type));
    } else {
      onCancerTypesChange([...selectedCancerTypes, type]);
    }
  };

  if (error) return <div>{error}</div>;

  return (
    <div className="space-y-6">
      {/* Step 1: Select Cancer Site */}
      <div>
        <label className="block mb-1 font-semibold">Select Cancer Site</label>
        <Select onValueChange={handleSiteChange}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Choose a cancer site" />
          </SelectTrigger>
          <SelectContent>
            {cancerSites.map((site) => (
              <SelectItem key={site.id} value={site.name}>
                {site.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Step 2: Select Cancer Types */}
      {selectedSite && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-medium">Select Cancer Types</h4>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={handleSelectAll} disabled={loadingTypes}>
                Select All
              </Button>
              <Button size="sm" variant="ghost" onClick={handleClear}>
                Clear
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {cancerTypes.map((type) => (
              <Button
                key={type}
                variant={selectedCancerTypes.includes(type) ? "default" : "outline"}
                onClick={() => handleToggleType(type)}
                className="w-full"
              >
                {type}
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Summary */}
      {selectedCancerTypes.length > 0 && (
        <div className="p-4 bg-blue-50 border rounded-lg">
          <h4 className="font-medium text-blue-800 mb-2">Selected Cancer Types:</h4>
          <ul className="text-blue-700 list-disc list-inside">
            {selectedCancerTypes.map((type) => (
              <li key={type}>{type}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default CancerTypeSelector;
