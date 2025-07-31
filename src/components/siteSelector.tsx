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

interface CancerTypeSelectorProps {
  selectedCancerTypes: string[];
  onCancerTypesChange: (values: string[]) => void;
  onSiteChange: (siteName: string) => void;
}

const CancerTypeSelector = ({
  selectedCancerTypes,
  onCancerTypesChange,
  onSiteChange,
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
        // Hardcoded fallback
        const hardcodedSites = [
          { id: 3, name: "Breast" },
          { id: 1, name: "Liver and Bile Duct" },
          { id: 2, name: "Colorectal" },
          { id: 23, name: "Thymus" },
        ];
        setCancerSites(hardcodedSites);
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
    onCancerTypesChange([]); // Clear selection
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

  const handleTypeChange = (value: string) => {
    if (value === "select-all") {
      onCancerTypesChange(cancerTypes);
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

  if (error) return <div>{error}</div>;

  return (
    <div className="space-y-6">
      {/* Step 1: Select Cancer Site */}
      <div>
        <label className="block mb-1 font-semibold">Select Cancer Site</label>
        <Select onValueChange={handleSiteChange} disabled={loadingSites}>
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
                <SelectItem key={type} value={type}>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={selectedCancerTypes.includes(type)}
                      readOnly
                      className="mr-2"
                    />
                    {type}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Summary */}
      {selectedCancerTypes.length > 0 && (
        <div className="p-4 bg-blue-50 border rounded-lg">
          <h4 className="font-medium text-blue-800 mb-2">Selected Cancer Projects:</h4>
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
