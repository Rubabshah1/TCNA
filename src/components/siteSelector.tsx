
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// interface CancerTypeSelectorProps {
//   selectedCancerType: string;
//   onCancerTypeChange: (value: string) => void;
// }

// const cancerTypes = [
//   { value: "breast", label: "Breast Cancer (BRCA)", description: "Invasive breast carcinoma" },
//   { value: "lung", label: "Lung Cancer (LUAD)", description: "Lung adenocarcinoma" },
//   { value: "prostate", label: "Prostate Cancer (PRAD)", description: "Prostate adenocarcinoma" },
//   { value: "colorectal", label: "Colorectal Cancer (COAD)", description: "Colon adenocarcinoma" },
//   { value: "liver", label: "Liver Cancer (LIHC)", description: "Liver hepatocellular carcinoma" },
//   { value: "kidney", label: "Kidney Cancer (KIRC)", description: "Kidney renal clear cell carcinoma" },
//   { value: "stomach", label: "Stomach Cancer (STAD)", description: "Stomach adenocarcinoma" },
//   { value: "ovarian", label: "Ovarian Cancer (OV)", description: "Ovarian serous cystadenocarcinoma" }
// ];

// const CancerTypeSelector = ({ selectedCancerType, onCancerTypeChange }: CancerTypeSelectorProps) => {
//   return (
//     <div className="space-y-4">
//       <Select value={selectedCancerType} onValueChange={onCancerTypeChange}>
//         <SelectTrigger className="w-full">
//           <SelectValue placeholder="Choose a cancer type" />
//         </SelectTrigger>
//         <SelectContent>
//           {cancerTypes.map((cancer) => (
//             <SelectItem key={cancer.value} value={cancer.value}>
//               <div className="flex flex-col">
//                 <span className="font-medium">{cancer.label}</span>
//                 <span className="text-sm text-gray-500">{cancer.description}</span>
//               </div>
//             </SelectItem>
//           ))}
//         </SelectContent>
//       </Select>
      
//       {selectedCancerType && (
//         <div className="p-4 bg-gradient-to-r from-blue-50 to-yellow-50 rounded-lg border border-blue-200">
//           <h4 className="font-medium text-blue-800 mb-2">Selected Cancer Type:</h4>
//           <p className="text-blue-700">
//             {cancerTypes.find(c => c.value === selectedCancerType)?.description}
//           </p>
//         </div>
//       )}
//     </div>
//   );
// };

// export default CancerTypeSelector;

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { X, Search } from "lucide-react";

interface CancerTypeSelectorProps {
  selectedCancerType: string[];
  onCancerTypesChange: (CancerTypes: string[]) => void;
}

const CancerTypeSelector = ({ selectedCancerType, onCancerTypesChange }: CancerTypeSelectorProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);

  // Alphabetically sorted CancerType list with common cancer CancerTypes
  const allCancerTypes = ["Breast", "Lung", "Prostate", "Colorectal", "Liver", "Kidney", "Stomach", "Ovarian"];

  // const suggestedCancerTypes = ["TP53", "BRCA1", "BRCA2", "KRAS", "EGFR", "PIK3CA", "APC", "PTEN"];

  const filteredCancerTypes = allCancerTypes.filter(CancerType => 
    CancerType.toLowerCase().includes(searchTerm.toLowerCase()) &&
    !selectedCancerType.includes(CancerType)
  );

  const handleCancerTypeSelect = (CancerType: string) => {
    if (!selectedCancerType.includes(CancerType)) {
      onCancerTypesChange([...selectedCancerType, CancerType]);
    }
    setSearchTerm("");
    setShowDropdown(false);
  };

  const handleCancerTypeRemove = (CancerType: string) => {
    onCancerTypesChange(selectedCancerType.filter(g => g !== CancerType));
  };

  // const handleSuggestedCancerTypeAdd = (CancerType: string) => {
  //   if (!selectedCancerType.includes(CancerType)) {
  //     onCancerTypesChange([...selectedCancerType, CancerType]);
  //   }
  // };

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader>
        <CardTitle className="text-xl text-blue-800">Select CancerTypes for Analysis</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search Input */}
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <Input
            type="text"
            placeholder="Search for CancerTypes..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setShowDropdown(e.target.value.length > 0);
            }}
            onFocus={() => setShowDropdown(searchTerm.length > 0)}
            className="pl-10"
          />
          
          {/* Dropdown */}
          {showDropdown && filteredCancerTypes.length > 0 && (
            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-48 overflow-y-auto">
              {filteredCancerTypes.slice(0, 10).map((CancerType) => (
                <button
                  key={CancerType}
                  onClick={() => handleCancerTypeSelect(CancerType)}
                  className="w-full px-4 py-2 text-left hover:bg-blue-50 border-b border-gray-100 last:border-b-0"
                >
                  {CancerType}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Suggested CancerTypes */}
        {/* <div>
          <h4 className="text-sm font-medium text-gray-700 mb-2">Suggested Cancer CancerTypes:</h4>
          <div className="flex flex-wrap gap-2">
            {suggestedCancerTypes.map((CancerType) => (
              <Button
                key={CancerType}
                variant={selectedCancerType.includes(CancerType) ? "default" : "outline"}
                size="sm"
                onClick={() => handleSuggestedCancerTypeAdd(CancerType)}
                disabled={selectedCancerType.includes(CancerType)}
                className="text-xs"
              >
                {CancerType}
              </Button>
            ))}
          </div>
        </div> */}

        {/* Selected CancerTypes */}
        {selectedCancerType.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">
              Selected CancerTypes ({selectedCancerType.length}):
            </h4>
            <div className="flex flex-wrap gap-2">
              {selectedCancerType.map((CancerType) => (
                <Badge key={CancerType} variant="secondary" className="flex items-center gap-1">
                  {CancerType}
                  <button
                    onClick={() => handleCancerTypeRemove(CancerType)}
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

export default CancerTypeSelector;