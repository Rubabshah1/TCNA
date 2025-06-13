
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dna, Zap, Target } from "lucide-react";

interface GenomeGraphicsProps {
  gene: string;
  cancerType: string;
}

const GenomeGraphics = ({ gene, cancerType }: GenomeGraphicsProps) => {
  // Generate chromosome-like visualization
  const generateChromosomeSegments = (length: number) => {
    return Array.from({ length }, (_, i) => ({
      position: i * 10,
      intensity: Math.random() * 100,
      type: Math.random() > 0.7 ? 'hotspot' : 'normal'
    }));
  };

  const chromosomeData = generateChromosomeSegments(20);

  return (
    <div className="space-y-6">
      {/* DNA Double Helix Visualization */}
      <Card className="border-0 shadow-lg bg-gradient-to-r from-blue-50 to-yellow-50">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-blue-800">
            <Dna className="h-5 w-5" />
            <span>Gene Structure: {gene}</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative h-32 bg-gradient-to-r from-blue-100 to-yellow-100 rounded-lg overflow-hidden">
            {/* DNA Helix Pattern */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="flex space-x-1">
                {Array.from({ length: 40 }, (_, i) => (
                  <div
                    key={i}
                    className={`w-2 h-16 rounded-full ${
                      i % 4 === 0 ? 'bg-blue-600' : 
                      i % 4 === 1 ? 'bg-yellow-600' : 
                      i % 4 === 2 ? 'bg-blue-500' : 'bg-yellow-500'
                    }`}
                    style={{
                      transform: `rotate(${i * 9}deg) translateY(${Math.sin(i * 0.5) * 10}px)`,
                      opacity: 0.7 + Math.sin(i * 0.3) * 0.3
                    }}
                  />
                ))}
              </div>
            </div>
            {/* Gene Markers */}
            <div className="absolute top-2 left-4 bg-blue-700 text-white px-2 py-1 rounded text-xs font-medium">
              5' UTR
            </div>
            <div className="absolute top-2 right-4 bg-yellow-700 text-white px-2 py-1 rounded text-xs font-medium">
              3' UTR
            </div>
            <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 bg-blue-800 text-white px-3 py-1 rounded text-xs font-medium">
              Coding Sequence
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Chromosome Ideogram */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-blue-800">
            <Target className="h-5 w-5" />
            <span>Chromosomal Location</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="relative h-12 bg-gradient-to-r from-blue-200 via-blue-300 to-blue-200 rounded-full">
              {/* Chromosome bands */}
              {chromosomeData.map((segment, i) => (
                <div
                  key={i}
                  className={`absolute top-0 h-full w-8 rounded ${
                    segment.type === 'hotspot' ? 'bg-red-500' : 'bg-blue-600'
                  }`}
                  style={{
                    left: `${segment.position}%`,
                    opacity: segment.intensity / 100,
                    width: '4%'
                  }}
                />
              ))}
              {/* Gene marker */}
              <div className="absolute top-0 left-1/3 w-1 h-full bg-yellow-500 rounded">
                <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 bg-yellow-500 text-white px-2 py-1 rounded text-xs font-medium whitespace-nowrap">
                  {gene}
                </div>
              </div>
            </div>
            <div className="flex justify-between text-sm text-gray-600">
              <span>p-arm</span>
              <span>Centromere</span>
              <span>q-arm</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Expression Heatmap */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-blue-800">
            <Zap className="h-5 w-5" />
            <span>Expression Heatmap</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-10 gap-1">
            {Array.from({ length: 100 }, (_, i) => {
              const intensity = Math.random();
              return (
                <div
                  key={i}
                  className="aspect-square rounded-sm"
                  style={{
                    backgroundColor: `rgba(37, 99, 235, ${intensity})`,
                  }}
                  title={`Sample ${i + 1}: ${(intensity * 1000).toFixed(0)} FPKM`}
                />
              );
            })}
          </div>
          <div className="flex items-center justify-between mt-4 text-sm text-gray-600">
            <span>Low Expression</span>
            <div className="flex items-center space-x-2">
              <div className="w-20 h-3 bg-gradient-to-r from-blue-100 to-blue-600 rounded"></div>
            </div>
            <span>High Expression</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default GenomeGraphics;
