import { useState, useEffect } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import supabase from "@/supabase-client";

interface CancerTypeSelectorProps {
  selectedCancerType: string;
  onCancerTypeChange: (value: string) => void;
}

const CancerTypeSelector = ({ selectedCancerType, onCancerTypeChange }: CancerTypeSelectorProps) => {
  const [cancerTypes, setCancerTypes] = useState<{ value: string; label: string; description: string }[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
      useEffect(() => {
      const fetchCancerTypes = async () => {
        setLoading(true);
        try {
          const { data, error } = await supabase.from("cancer_types").select("*");
          if (error) throw error;

          console.log("Fetched cancers from Supabase:", data);

          const labelMap: { [key: string]: string } = {
            "TCGA-BLCA": "Bladder Cancer (BLCA)",
            "TCGA-BRCA": "Breast Cancer (BRCA)",
            "TCGA-LUAD": "Lung Cancer (LUAD)",
            "TCGA-PRAD": "Prostate Cancer (PRAD)",
            "TCGA-COAD": "Colorectal Cancer (COAD)",
            "TCGA-LIHC": "Liver Cancer (LIHC)",
            "TCGA-KIRC": "Kidney Cancer (KIRC)",
            "TCGA-STAD": "Stomach Cancer (STAD)",
            "TCGA-OV": "Ovarian Cancer (OV)",
          };

          const descriptionMap: { [key: string]: string } = {
            "TCGA-BLCA": "Urothelial carcinoma",
            "TCGA-BRCA": "Invasive breast carcinoma",
            "TCGA-LUAD": "Lung adenocarcinoma",
            "TCGA-PRAD": "Prostate adenocarcinoma",
            "TCGA-COAD": "Colon adenocarcinoma",
            "TCGA-LIHC": "Liver hepatocellular carcinoma",
            "TCGA-KIRC": "Kidney renal clear cell carcinoma",
            "TCGA-STAD": "Stomach adenocarcinoma",
            "TCGA-OV": "Ovarian serous cystadenocarcinoma",
          };

          const mapped = data.map((cancer: any) => {
            const name = cancer.tcga_code;
            return {
              value: name.toString(), // like "tcga-blca"
              label: labelMap[name] || name,
              description: cancer.name || "No description available",
            };
          });

          setCancerTypes(mapped);
        } catch (err) {
          setError("Failed to load cancer types");
          console.error(err);
        } finally {
          setLoading(false);
        }
      };

      fetchCancerTypes();
    }, []);


  // if (loading) return <div>Loading cancer types...</div>;
  if (error) return <div>{error}</div>;

  return (
    <div className="space-y-4">
      <Select value={selectedCancerType} onValueChange={onCancerTypeChange}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Choose a cancer type" />
        </SelectTrigger>
        <SelectContent>
          {cancerTypes.map((cancer) => (
            <SelectItem key={cancer.value} value={cancer.value}>
              <div className="flex flex-col">
                <span className="font-medium">{cancer.label}</span>
                <span className="text-sm text-gray-500">{cancer.description}</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {selectedCancerType && (
        <div className="p-4 bg-gradient-to-r from-blue-50 to-yellow-50 rounded-lg border border-blue-200">
          <h4 className="font-medium text-blue-800 mb-2">Selected Cancer Type:</h4>
          <p className="text-blue-700">
            {
              cancerTypes.find((c) => c.value === selectedCancerType)?.description
            }
          </p>
        </div>
      )}
    </div>
  );
};

export default CancerTypeSelector;
