
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
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

interface CancerTypeSelectorProps {
  selectedCancerTypes: string[];
  onCancerTypesChange: (values: string[]) => void;
  onSitesChange: (siteNames: string[]) => void;
  analysisType: "pan-cancer" | "cancer-specific" | null;
}

interface CancerType {
  tcga_code: string;
  site_id: number;
}

const CancerTypeSelector = ({
  selectedCancerTypes,
  onCancerTypesChange,
  onSitesChange,
  analysisType,
}: CancerTypeSelectorProps) => {
  const [cancerSites, setCancerSites] = useState<{ id: number; name: string }[]>([]);
  const [selectedSites, setSelectedSites] = useState<string[]>([]);
  const [cancerTypes, setCancerTypes] = useState<CancerType[]>([]);
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
        setCancerSites(data.sort((a, b) => a.name.localeCompare(b.name)));
      } catch (err) {
        setError("Failed to load cancer sites.");
        console.error(err);
      } finally {
        setLoadingSites(false);
      }
    };
    fetchSites();
  }, []);

  // Fetch cancer types for newly added sites
  const fetchCancerTypes = async (newSiteNames: string[]) => {
    setLoadingTypes(true);
    try {
      const newSiteIds = cancerSites
        .filter((s) => newSiteNames.includes(s.name))
        .map((s) => s.id);

      if (newSiteIds.length === 0) {
        setLoadingTypes(false);
        return;
      }

      const { data, error } = await supabase
        .from("cancer_types")
        .select("tcga_code, site_id")
        .in("site_id", newSiteIds);

      if (error) throw error;

      setCancerTypes((prev) => [
        ...prev,
        ...(data as CancerType[]).filter(
          (newType) => !prev.some((type) => type.tcga_code === newType.tcga_code)
        ),
      ]);
    } catch (err) {
      setError("Failed to load cancer types.");
      console.error(err);
    } finally {
      setLoadingTypes(false);
    }
  };

  const handleSiteChange = (siteName: string) => {
    let newSelectedSites: string[];
    if (analysisType === "cancer-specific") {
      // For cancer-specific, only one site can be selected
      newSelectedSites = [siteName];
      // Clear previous cancer types and fetch for the new site
      setCancerTypes([]);
      onCancerTypesChange([]);
      fetchCancerTypes([siteName]);
    } else {
      // For pan-cancer, allow multiple sites
      if (selectedSites.includes(siteName)) {
        newSelectedSites = selectedSites.filter((s) => s !== siteName);
        const deselectedSite = cancerSites.find((s) => s.name === siteName);
        if (deselectedSite) {
          setCancerTypes((prev) =>
            prev.filter((type) => type.site_id !== deselectedSite.id)
          );
          onCancerTypesChange(
            selectedCancerTypes.filter(
              (code) =>
                !cancerTypes.some(
                  (type) =>
                    type.tcga_code === code && type.site_id === deselectedSite.id
                )
            )
          );
        }
      } else {
        newSelectedSites = [...selectedSites, siteName];
        fetchCancerTypes([siteName]);
      }
    }
    setSelectedSites(newSelectedSites);
    onSitesChange(newSelectedSites);
  };

  const handleSelectAllSites = () => {
    if (analysisType === "pan-cancer") {
      const allSiteNames = cancerSites.map((site) => site.name);
      setSelectedSites(allSiteNames);
      onSitesChange(allSiteNames);
      fetchCancerTypes(allSiteNames);
    }
  };

  const handleTypeChange = (value: string) => {
    if (value === "select-all") {
      onCancerTypesChange(cancerTypes.map((type) => type.tcga_code));
    } else if (value === "clear") {
      onCancerTypesChange([]);
    } else {
      if (selectedCancerTypes.includes(value)) {
        onCancerTypesChange(selectedCancerTypes.filter((t) => t !== value));
      } else {
        onCancerTypesChange([...selectedCancerTypes, value]);
      }
    }
  };

  const clearSites = () => {
    setSelectedSites([]);
    setCancerTypes([]);
    onCancerTypesChange([]);
    onSitesChange([]);
  };

  // Group selected cancer types by site
  const groupedBySite = selectedSites.reduce((acc, siteName) => {
    const site = cancerSites.find((s) => s.name === siteName);
    if (!site) return acc;
    const typesForSite = cancerTypes
      .filter((type) => type.site_id === site.id && selectedCancerTypes.includes(type.tcga_code))
      .map((type) => type.tcga_code);
    if (typesForSite.length > 0) {
      acc[site.name] = typesForSite;
    }
    return acc;
  }, {} as Record<string, string[]>);

  if (error) return <div>{error}</div>;

  return (
    <div className="space-y-6">
      {/* Step 1: Select Cancer Sites */}
      <div>
        <label className="block mb-1 font-semibold">Select Cancer Sites</label>
        <div className="border rounded-md p-4 max-h-64 overflow-y-auto">
          {loadingSites ? (
            <div>Loading sites...</div>
          ) : analysisType === "cancer-specific" ? (
            <RadioGroup
              value={selectedSites[0] || ""}
              onValueChange={handleSiteChange}
              disabled={loadingSites}
            >
              {cancerSites.map((site) => (
                <div key={site.id} className="flex items-center mb-2">
                  <RadioGroupItem
                    value={site.name}
                    id={`site-${site.id}`}
                    disabled={loadingSites}
                  />
                  <label htmlFor={`site-${site.id}`} className="ml-2">
                    {site.name}
                  </label>
                </div>
              ))}
            </RadioGroup>
          ) : (
            cancerSites.map((site) => (
              <div key={site.id} className="flex items-center mb-2">
                <Checkbox
                
                  id={`site-${site.id}`}
                  checked={selectedSites.includes(site.name)}
                  onCheckedChange={() => handleSiteChange(site.name)}
                  disabled={loadingSites}
                />
                <label htmlFor={`site-${site.id}`} className="ml-2">
                  {site.name}
                </label>
              </div>
            ))
          )}
        </div>
        {selectedSites.length > 0 && (
          <Button
            onClick={clearSites}
            className="mt-2"
            variant="outline"
          >
            Clear Sites
          </Button>
        )}
        {/* {analysisType === "pan-cancer" && (
            <Button
              onClick={handleSelectAllSites}
              variant="outline"
              disabled={loadingSites || selectedSites.length === cancerSites.length}
            >
              Select All Sites
            </Button>
          )} */}
          {analysisType === "pan-cancer" && (
            <>
              <Button
                onClick={handleSelectAllSites}
                variant="outline"
                disabled={loadingSites || selectedSites.length === cancerSites.length}
              >
                Select All Sites
              </Button>
              <p className="mt-2 text-sm text-gray-600">
                Note: For better performance, choose no more than <span className="font-semibold">10 sites</span> at a time.
              </p>
            </>
          )}
      </div>

      {/* Step 2: Select Cancer Types */}
      {selectedSites.length > 0 && (
        <div className="space-y-3">
          <label className="block mb-1 font-semibold">Select Project</label>
          <Select onValueChange={handleTypeChange} disabled={loadingTypes}>
            <SelectTrigger className="w-full">
              <SelectValue
                placeholder={
                  selectedCancerTypes.length > 0
                    ? `${selectedCancerTypes.length} project(s) selected`
                    : "Choose cancer projects"
                }
              />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="select-all">Select All</SelectItem>
              <SelectItem value="clear">Clear Selection</SelectItem>
              {cancerTypes.map((type) => (
                <SelectItem key={type.tcga_code} value={type.tcga_code}>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={selectedCancerTypes.includes(type.tcga_code)}
                      readOnly
                      className="mr-2"
                    />
                    {type.tcga_code}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Summary */}
      {(selectedSites.length > 0 || selectedCancerTypes.length > 0) && (
        <div className="p-4 bg-blue-50 border rounded-lg">
          {selectedSites.length > 0 && (
            <>
              <h4 className="font-medium text-blue-800 mb-2">Selected Cancer Sites:</h4>
              <ul className="text-blue-700 list-disc list-inside mb-4">
                {selectedSites.map((site) => (
                  <li key={site}>{site}</li>
                ))}
              </ul>
            </>
          )}
          {Object.keys(groupedBySite).length > 0 && (
            <>
              <h4 className="font-medium text-blue-800 mb-2">Selected Cancer Projects by Site:</h4>
              {Object.entries(groupedBySite).map(([siteName, types]) => (
                <div key={siteName} className="mb-2">
                  <h5 className="font-semibold text-blue-800">{siteName}</h5>
                  <ul className="text-blue-700 list-disc list-inside ml-4">
                    {types.map((type) => (
                      <li key={type}>{type}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default CancerTypeSelector;
// import { useState, useEffect, useCallback } from "react";
// import { Checkbox } from "@/components/ui/checkbox";
// import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
// import { Label } from "@/components/ui/label";
// import supabase from "@/supabase-client";

// interface CancerTypeSelectorProps {
//   analysisType: "pan-cancer" | "cancer-specific";
//   selectedCancerTypes: string[];
//   onCancerTypesChange: (cancerTypes: string[]) => void;
//   selectedSites: string[];
//   onSitesChange: (sites: string[]) => void;
// }

// interface Site {
//   id: number;
//   name: string;
// }

// interface CancerType {
//   id: number;
//   tcga_code: string;
//   site_id: number;
// }

// const CancerTypeSelector: React.FC<CancerTypeSelectorProps> = ({
//   analysisType,
//   selectedCancerTypes,
//   onCancerTypesChange,
//   selectedSites,
//   onSitesChange,
// }) => {
//   const [sites, setSites] = useState<Site[]>([]);
//   const [cancerTypes, setCancerTypes] = useState<CancerType[]>([]);
//   const [loading, setLoading] = useState(true);

//   // Fetch sites and cancer types from Supabase
//   useEffect(() => {
//     const fetchData = async () => {
//       setLoading(true);
//       try {
//         // Fetch sites
//         const { data: siteData, error: siteError } = await supabase
//           .from("Sites")
//           .select("id, name")
//           .order("name", { ascending: true });
//         if (siteError) throw siteError;
//         setSites(siteData || []);

//         // Fetch cancer types
//         const { data: cancerTypeData, error: cancerTypeError } = await supabase
//           .from("cancer_types")
//           .select("id, tcga_code, site_id")
//           .order("tcga_code", { ascending: true });
//         if (cancerTypeError) throw cancerTypeError;
//         setCancerTypes(cancerTypeData || []);
//       } catch (error) {
//         console.error("Error fetching data:", error);
//       } finally {
//         setLoading(false);
//       }
//     };
//     fetchData();
//   }, []);

//   // Handle site selection for pan-cancer (multiple) or cancer-specific (single)
//   const handleSiteChange = useCallback(
//     (siteName: string, checked: boolean) => {
//       if (analysisType === "pan-cancer") {
//         // Allow multiple site selections
//         onSitesChange(
//           checked
//             ? [...selectedSites, siteName]
//             : selectedSites.filter((s) => s !== siteName)
//         );
//       } else {
//         // Allow only one site for cancer-specific
//         onSitesChange(checked ? [siteName] : []);
//         // Reset cancer types if site changes
//         onCancerTypesChange([]);
//       }
//     },
//     [analysisType, selectedSites, onSitesChange, onCancerTypesChange]
//   );

//   // Handle cancer type selection (only for cancer-specific)
//   const handleCancerTypeChange = useCallback(
//     (tcgaCode: string, checked: boolean) => {
//       onCancerTypesChange(
//         checked
//           ? [...selectedCancerTypes, tcgaCode]
//           : selectedCancerTypes.filter((c) => c !== tcgaCode)
//       );
//     },
//     [selectedCancerTypes, onCancerTypesChange]
//   );

//   // Filter cancer types based on selected site (for cancer-specific)
//   const availableCancerTypes = selectedSites.length === 1
//     ? cancerTypes.filter((ct) => {
//         const site = sites.find((s) => s.name === selectedSites[0]);
//         return site && ct.site_id === site.id;
//       })
//     : [];

//   if (loading) {
//     return <div className="text-blue-700">Loading sites and projects...</div>;
//   }

//   return (
//     <div className="space-y-6">
//       {/* Site Selection */}
//       <div>
//         <Label className="text-blue-800 font-medium">
//           {analysisType === "pan-cancer" ? "Cancer Sites" : "Select One Cancer Site"}
//         </Label>
//         <div className="mt-2 space-y-2 max-h-64 overflow-y-auto">
//           {analysisType === "pan-cancer" ? (
//             // Multi-select for pan-cancer
//             sites.map((site) => (
//               <div key={site.id} className="flex items-center space-x-2">
//                 <Checkbox
//                   id={`site-${site.name}`}
//                   checked={selectedSites.includes(site.name)}
//                   onCheckedChange={(checked) => handleSiteChange(site.name, checked as boolean)}
//                 />
//                 <Label htmlFor={`site-${site.name}`} className="text-blue-700 text-sm">
//                   {site.name}
//                 </Label>
//               </div>
//             ))
//           ) : (
//             // Single-select for cancer-specific
//             <RadioGroup
//               value={selectedSites[0] || ""}
//               onValueChange={(value) => handleSiteChange(value, value !== "")}
//             >
//               {sites.map((site) => (
//                 <div key={site.id} className="flex items-center space-x-2">
//                   <RadioGroupItem value={site.name} id={`site-${site.name}`} />
//                   <Label htmlFor={`site-${site.name}`} className="text-blue-700 text-sm">
//                     {site.name}
//                   </Label>
//                 </div>
//               ))}
//             </RadioGroup>
//           )}
//         </div>
//       </div>

//       {/* Cancer Type Selection (only for cancer-specific and if a site is selected) */}
//       {analysisType === "cancer-specific" && selectedSites.length === 1 && (
//         <div>
//           <Label className="text-blue-800 font-medium">
//             Cancer Projects (Optional)
//           </Label>
//           <div className="mt-2 space-y-2 max-h-64 overflow-y-auto">
//             {availableCancerTypes.length > 0 ? (
//               availableCancerTypes.map((cancerType) => (
//                 <div key={cancerType.id} className="flex items-center space-x-2">
//                   <Checkbox
//                     id={`cancer-type-${cancerType.tcga_code}`}
//                     checked={selectedCancerTypes.includes(cancerType.tcga_code)}
//                     onCheckedChange={(checked) =>
//                       handleCancerTypeChange(cancerType.tcga_code, checked as boolean)
//                     }
//                   />
//                   <Label
//                     htmlFor={`cancer-type-${cancerType.tcga_code}`}
//                     className="text-blue-700 text-sm"
//                   >
//                     {cancerType.tcga_code}
//                   </Label>
//                 </div>
//               ))
//             ) : (
//               <p className="text-blue-700 text-sm">
//                 No specific projects available for {selectedSites[0]}.
//               </p>
//             )}
//           </div>
//         </div>
//       )}
//     </div>
//   );
// };

// export default CancerTypeSelector;