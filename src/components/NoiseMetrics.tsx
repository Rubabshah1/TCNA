
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, ScatterChart, Scatter } from "recharts";
import { TrendingUp, BarChart3, Activity } from "lucide-react";

interface NoiseMetricsProps {
  cancerType: string;
  gene: string;
  viewMode: 'tumor' | 'gene';
}

// Simulated data generation for demonstration
const generateNoiseData = (cancerType: string, gene: string, viewMode: 'tumor' | 'gene') => {
  const baseNoise = Math.random() * 0.5 + 0.2;
  const samples = 50;
  
  const expressionData = Array.from({ length: samples }, (_, i) => ({
    sample: `Sample ${i + 1}`,
    expression: Math.random() * 1000 + 500,
    logExpression: Math.log2(Math.random() * 1000 + 500),
  }));

  const mean = expressionData.reduce((sum, d) => sum + d.expression, 0) / samples;
  const variance = expressionData.reduce((sum, d) => sum + Math.pow(d.expression - mean, 2), 0) / (samples - 1);
  const stdDev = Math.sqrt(variance);
  const cv = (stdDev / mean) * 100;
  
  // Calculate MAD (Mean Absolute Deviation)
  const median = [...expressionData].sort((a, b) => a.expression - b.expression)[Math.floor(samples / 2)].expression;
  const mad = expressionData.reduce((sum, d) => sum + Math.abs(d.expression - median), 0) / samples;
  
  // Simulated DEPTH metrics
  const depth = Math.random() * 50 + 10;
  const depth2 = Math.random() * 30 + 5;

  const distributionData = Array.from({ length: 20 }, (_, i) => {
    const binStart = i * 50;
    const count = expressionData.filter(d => d.expression >= binStart && d.expression < binStart + 50).length;
    return {
      bin: `${binStart}-${binStart + 50}`,
      count: count,
      midpoint: binStart + 25
    };
  });

  const correlationData = Array.from({ length: samples }, (_, i) => ({
    technical: Math.random() * 100 + 50,
    biological: Math.random() * 150 + 75,
  }));

  return {
    summary: {
      mean: mean.toFixed(2),
      stdDev: stdDev.toFixed(2),
      cv: cv.toFixed(2),
      variance: variance.toFixed(2),
      mad: mad.toFixed(2),
      depth: depth.toFixed(1),
      depth2: depth2.toFixed(1),
      min: Math.min(...expressionData.map(d => d.expression)).toFixed(2),
      max: Math.max(...expressionData.map(d => d.expression)).toFixed(2),
      samples: samples
    },
    expressionData,
    distributionData,
    correlationData
  };
};

const NoiseMetrics = ({ cancerType, gene, viewMode }: NoiseMetricsProps) => {
  const data = generateNoiseData(cancerType, gene, viewMode);
  
  const getCancerTypeLabel = (type: string) => {
    const labels: { [key: string]: string } = {
      breast: "Breast Cancer (BRCA)",
      lung: "Lung Cancer (LUAD)",
      prostate: "Prostate Cancer (PRAD)",
      colorectal: "Colorectal Cancer (COAD)",
      liver: "Liver Cancer (LIHC)",
      kidney: "Kidney Cancer (KIRC)",
      stomach: "Stomach Cancer (STAD)",
      ovarian: "Ovarian Cancer (OV)"
    };
    return labels[type] || type;
  };

  const getAnalysisTitle = () => {
    if (viewMode === 'tumor') {
      return `Tumor-based Analysis: ${getCancerTypeLabel(cancerType)}`;
    } else {
      return `Gene-based Analysis: ${gene} in ${getCancerTypeLabel(cancerType)}`;
    }
  };

  const getNoiseLevel = (cv: number) => {
    if (cv < 20) return { level: "Low", color: "bg-green-100 text-green-800" };
    if (cv < 40) return { level: "Moderate", color: "bg-yellow-100 text-yellow-800" };
    return { level: "High", color: "bg-red-100 text-red-800" };
  };

  const noiseLevel = getNoiseLevel(parseFloat(data.summary.cv));

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="border-0 shadow-lg bg-gradient-to-r from-blue-600 to-yellow-600 text-white">
        <CardHeader>
          <CardTitle className="text-2xl flex items-center space-x-3">
            <Activity className="h-6 w-6" />
            <span>{getAnalysisTitle()}</span>
          </CardTitle>
        </CardHeader>
      </Card>

      {/* Summary Statistics */}
      <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-4">
        <Card className="border-0 shadow-lg">
          <CardContent className="p-6 text-center">
            <div className="text-2xl font-bold text-blue-600">{data.summary.mean}</div>
            <div className="text-sm text-gray-600">Mean Expression</div>
          </CardContent>
        </Card>
        
        <Card className="border-0 shadow-lg">
          <CardContent className="p-6 text-center">
            <div className="text-2xl font-bold text-yellow-600">{data.summary.stdDev}</div>
            <div className="text-sm text-gray-600">Standard Deviation</div>
          </CardContent>
        </Card>
        
        <Card className="border-0 shadow-lg">
          <CardContent className="p-6 text-center">
            <div className="text-2xl font-bold text-blue-700">{data.summary.cv}%</div>
            <div className="text-sm text-gray-600">Coefficient of Variation</div>
            <Badge className={`mt-2 ${noiseLevel.color}`}>
              {noiseLevel.level} Noise
            </Badge>
          </CardContent>
        </Card>
        
        <Card className="border-0 shadow-lg">
          <CardContent className="p-6 text-center">
            <div className="text-2xl font-bold text-green-600">{data.summary.variance}</div>
            <div className="text-sm text-gray-600">Variance</div>
          </CardContent>
        </Card>
      </div>

      {/* Additional Noise Metrics */}
      <div className="grid md:grid-cols-3 gap-4">
        <Card className="border-0 shadow-lg">
          <CardContent className="p-6 text-center">
            <div className="text-2xl font-bold text-purple-600">{data.summary.mad}</div>
            <div className="text-sm text-gray-600">MAD (Median Absolute Deviation)</div>
          </CardContent>
        </Card>
        
        <Card className="border-0 shadow-lg">
          <CardContent className="p-6 text-center">
            <div className="text-2xl font-bold text-indigo-600">{data.summary.depth}</div>
            <div className="text-sm text-gray-600">DEPTH (ith)</div>
          </CardContent>
        </Card>
        
        <Card className="border-0 shadow-lg">
          <CardContent className="p-6 text-center">
            <div className="text-2xl font-bold text-pink-600">{data.summary.depth2}</div>
            <div className="text-sm text-gray-600">DEPTH2</div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Expression Distribution */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <BarChart3 className="h-5 w-5 text-blue-600" />
              <span>Expression Distribution ({viewMode === 'tumor' ? 'Tumor-based' : 'Gene-based'})</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data.distributionData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="bin" angle={-45} textAnchor="end" height={60} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill={viewMode === 'tumor' ? "#2563eb" : "#059669"} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Expression Trend */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5 text-yellow-600" />
              <span>Expression Trend ({viewMode === 'tumor' ? 'Tumor-based' : 'Gene-based'})</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={data.expressionData.slice(0, 20)}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="sample" angle={-45} textAnchor="end" height={60} />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="expression" stroke={viewMode === 'tumor' ? "#ca8a04" : "#dc2626"} strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

{/*      
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Activity className="h-5 w-5 text-blue-600" />
            <span>Technical vs Biological Variation ({viewMode === 'tumor' ? 'Tumor-based' : 'Gene-based'})</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <ScatterChart data={data.correlationData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="technical" name="Technical Variation" />
              <YAxis dataKey="biological" name="Biological Variation" />
              <Tooltip cursor={{ strokeDasharray: '3 3' }} />
              <Scatter dataKey="biological" fill={viewMode === 'tumor' ? "#2563eb" : "#059669"} />
            </ScatterChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
*/}
      {/* Detailed Metrics */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle>Detailed Noise Metrics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Variance:</span>
                <span className="font-medium">{data.summary.variance}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">MAD:</span>
                <span className="font-medium">{data.summary.mad}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">DEPTH (ith):</span>
                <span className="font-medium">{data.summary.depth}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">DEPTH2:</span>
                <span className="font-medium">{data.summary.depth2}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Minimum Expression:</span>
                <span className="font-medium">{data.summary.min}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Maximum Expression:</span>
                <span className="font-medium">{data.summary.max}</span>
              </div>
            </div>
            
            <div className="bg-gradient-to-r from-blue-50 to-yellow-50 p-4 rounded-lg border border-blue-200">
              <h4 className="font-medium text-blue-800 mb-2">Interpretation ({viewMode === 'tumor' ? 'Tumor-based' : 'Gene-based'}):</h4>
              <p className="text-sm text-blue-700">
                The coefficient of variation (CV) of {data.summary.cv}% indicates {noiseLevel.level.toLowerCase()} 
                expression noise for {viewMode === 'gene' ? `${gene} in ${getCancerTypeLabel(cancerType)}` : `${getCancerTypeLabel(cancerType)}`}. 
                {viewMode === 'tumor' ? 
                  ' This tumor-based analysis shows variability across different tumor samples and genes.' : 
                  ' This gene-based analysis shows variability in gene expression patterns for the selected gene.'
                }
                The MAD value of {data.summary.mad} and DEPTH metrics provide additional insights into expression stability.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default NoiseMetrics;
