
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface CancerTypeSelectorProps {
  selectedCancerType: string;
  onCancerTypeChange: (value: string) => void;
}

const cancerTypes = [
  { value: "breast", label: "Breast Cancer (BRCA)", description: "Invasive breast carcinoma" },
  { value: "lung", label: "Lung Cancer (LUAD)", description: "Lung adenocarcinoma" },
  { value: "prostate", label: "Prostate Cancer (PRAD)", description: "Prostate adenocarcinoma" },
  { value: "colorectal", label: "Colorectal Cancer (COAD)", description: "Colon adenocarcinoma" },
  { value: "liver", label: "Liver Cancer (LIHC)", description: "Liver hepatocellular carcinoma" },
  { value: "kidney", label: "Kidney Cancer (KIRC)", description: "Kidney renal clear cell carcinoma" },
  { value: "stomach", label: "Stomach Cancer (STAD)", description: "Stomach adenocarcinoma" },
  { value: "ovarian", label: "Ovarian Cancer (OV)", description: "Ovarian serous cystadenocarcinoma" }
];

const CancerTypeSelector = ({ selectedCancerType, onCancerTypeChange }: CancerTypeSelectorProps) => {
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
            {cancerTypes.find(c => c.value === selectedCancerType)?.description}
          </p>
        </div>
      )}
    </div>
  );
};

export default CancerTypeSelector;