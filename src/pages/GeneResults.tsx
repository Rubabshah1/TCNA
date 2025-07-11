import React, { useMemo, useCallback, useState, useEffect, useRef } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import supabase from "@/supabase-client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Download, Box, ChevronRight, ChevronDown, Users } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { 
  ResponsiveContainer, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip,
  ComposedChart,
  Bar,
  Line,
  Area
} from "recharts";

// Utility to debounce state updates
const debounce = (func, wait) => {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

const GeneResults = () => {
  const renderCount = useRef(0);
  useEffect(() => {
    console.log(`GeneResults rendered ${++renderCount.current} times`);
  });

  const [searchParams] = useSearchParams();
  const params = useMemo(() => ({
    cancerType: searchParams.get('cancerType') || '',
    genes: searchParams.get('genes')?.split(',') || []
  }), [searchParams]);

  const [selectedGroups, setSelectedGroups] = useState(['normal']);
  const [isNoiseMetricsOpen, setIsNoiseMetricsOpen] = useState(false);
  const [isAnalysisPlotsOpen, setIsAnalysisPlotsOpen] = useState(false);
  const [normalizationMethod, setNormalizationMethod] = useState('tpm');
  const [selectedNoiseMetrics, setSelectedNoiseMetrics] = useState(['CV', 'Mean+STD', 'MAD']);
  const [resultsData, setResultsData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const chartRefs = useRef({});
  const [totalTumorSamples, setTotalTumorSamples] = useState(0);
  const [totalNormalSamples, setTotalNormalSamples] = useState(0);

  const cleanedGeneSymbols = useMemo(() => (
    params.genes.map(g => g.trim().toUpperCase()).filter(Boolean)
  ), [params.genes]);

  useEffect(() => {
    if (!["tpm", "fpkm", "fpkm_uq"].includes(normalizationMethod)) {
      setNormalizationMethod('tpm');
    }
  }, [normalizationMethod]);

  const noiseMetrics = {
    'CV': 'cv',
    'Mean+STD': 'meanPlusStd',
    'MAD': 'mad',
  // 'ΔLogfc': 'delta',
  'logFC': 'logFC'
  // 'ΔMean+STD': 'delta_meanPlusStd',
  // 'ΔMAD': 'delta_mad'
};


  useEffect(() => {
    let isMounted = true;
    const fetchData = async () => {
      if (!cleanedGeneSymbols.length || !params.cancerType) return;
      setIsLoading(true);
      try {
        const { data: cancerTypeData, error: cancerTypeError } = await supabase
          .from('cancer_types')
          .select('id')
          .eq('tcga_code', params.cancerType)
          .single();

        if (cancerTypeError) throw cancerTypeError;
        const cancerTypeId = cancerTypeData.id;

        const { data: geneData, error: geneError } = await supabase
          .from('genes')
          .select('id, gene_symbol')
          .in('gene_symbol', cleanedGeneSymbols);

        if (geneError) throw geneError;
        const geneMap = Object.fromEntries(geneData.map(g => [g.id, g.gene_symbol]));
        const geneIds = geneData.map(g => g.id);

        const { data: samplesData, error: samplesError } = await supabase
          .from('samples')
          .select('id, sample_type')
          .eq('cancer_type_id', cancerTypeId);

        if (samplesError) throw samplesError;
        const sampleMap = Object.fromEntries(samplesData.map(s => [s.id, s.sample_type]));
        const sampleIds = samplesData.map(s => s.id);

        const { data: expressionData, error: expressionError } = await supabase
          .from('expression_values')
          .select(`gene_id, sample_id, ${normalizationMethod}`)
          .in('gene_id', geneIds)
          .in('sample_id', sampleIds) as any;
        
        const tumorSampleCount = samplesData.filter(s => s.sample_type?.toLowerCase() === 'tumor').length;
        const normalSampleCount = samplesData.filter(s => s.sample_type?.toLowerCase() === 'normal').length;

        setTotalTumorSamples(tumorSampleCount);
        setTotalNormalSamples(normalSampleCount);
        if (expressionError) throw expressionError;

        const processedData = geneData.map(gene => {
          const normKey = normalizationMethod.toLowerCase();
          const geneExpressions = expressionData.filter(e => e.gene_id === gene.id);

          const tumorValues = geneExpressions
            .filter(e => sampleMap[e.sample_id]?.toLowerCase() === 'tumor')
            .map(e => e[normKey])
            .filter(v => v !== null && v !== undefined);
          console.log("tumor:", tumorValues);

          const normalValues = geneExpressions
            .filter(e => sampleMap[e.sample_id]?.toLowerCase() === 'normal')
            .map(e => e[normKey])
            .filter(v => v !== null && v !== undefined);
          console.log("normal:", normalValues);

          const combinedValues = [...tumorValues, ...normalValues];

          const calculateStats = (values) => {
            if (values.length === 0) return { cv: 0, stdDev: 0, mean: 0, meanPlusStd: 0, mad: 0, median: 0 };

            const sorted = [...values].sort((a, b) => a - b);
            const mid = Math.floor(sorted.length / 2);
            const median = sorted.length % 2 === 0
              ? (sorted[mid - 1] + sorted[mid]) / 2
              : sorted[mid];

            const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
            const stdDev = values.length > 1
              ? Math.sqrt(values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / (values.length - 1))
              : 0;
            const cv = mean !== 0 ? (stdDev / mean) * 100 : 0;
            const mad = values.reduce((sum, v) => sum + Math.abs(v - mean), 0) / values.length;
            const meanPlusStd = mean + stdDev;

            return { cv, stdDev, mean, meanPlusStd, mad, median };
          };

          const stats_tumor = calculateStats(tumorValues);
          const stats_normal = calculateStats(normalValues);
          const stats_combined = calculateStats(combinedValues);
          
          // differential noise:
          // const delta = tumorValues / normalValues;
          const logFC = Math.log2((stats_tumor.mean + 1e-6) / (stats_normal.mean + 1e-6)); // small epsilon to avoid divide-by-zero

          // const deltaMAD = stats_tumor.mad / stats_normal.mad;
          // const deltaMeanPlusStd = stats_tumor.meanPlusStd - stats_normal.meanPlusStd;


          return {
            gene: gene.gene_symbol,
            tumorValues,
            normalValues,
            combinedValues,
            cv_tumor: stats_tumor.cv,
            meanPlusStd_tumor: stats_tumor.meanPlusStd,
            mad_tumor: stats_tumor.mad,
            median_tumor: stats_tumor.median,
            cv_normal: stats_normal.cv,
            meanPlusStd_normal: stats_normal.meanPlusStd,
            mad_normal: stats_normal.mad,
            median_normal: stats_normal.median,
            cv_combined: stats_combined.cv,
            meanPlusStd_combined: stats_combined.meanPlusStd,
            mad_combined: stats_combined.mad,
            median_combined: stats_combined.median,
            tumorSamples: tumorValues.length,
            normalSamples: normalValues.length,
            logFC: logFC,

            // delta_logfc: delta
            // delta_mad: deltaMAD,
            // delta_meanPlusStd: deltaMeanPlusStd,

          };
        });

        if (isMounted) {
          setResultsData(processedData);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchData();
    return () => {
      isMounted = false;
    };
  }, [cleanedGeneSymbols, params.cancerType, normalizationMethod]);

  const toggleGroup = useCallback(debounce((group) => {
    setSelectedGroups(prev =>
      prev.includes(group)
        ? prev.filter(g => g !== group)
        : [...prev, group]
    );
  }, 100), []);

  const handleNoiseMetricToggle = useCallback(debounce((metric) => {
    setSelectedNoiseMetrics(prev =>
      prev.includes(metric)
        ? prev.filter(m => m !== metric)
        : [...prev, metric]
    );
  }, 100), []);

  const getFilteredResults = useCallback(() => {
    return resultsData.map(gene => {
      const filteredGene = { gene };
      selectedGroups.forEach(group => {
        if (group === 'combined') {
          filteredGene['cv_combined'] = gene.cv_combined;
          filteredGene['meanPlusStd_combined'] = gene.meanPlusStd_combined;
          filteredGene['mad_combined'] = gene.mad_combined;
          filteredGene['median_combined'] = gene.median_combined;
        } else if (group === 'tumor') {
          filteredGene['cv_tumor'] = gene.cv_tumor;
          filteredGene['meanPlusStd_tumor'] = gene.meanPlusStd_tumor;
          filteredGene['mad_tumor'] = gene.mad_tumor;
          filteredGene['median_tumor'] = gene.median_tumor;
        } else if (group === 'normal') {
          filteredGene['cv_normal'] = gene.cv_normal;
          filteredGene['meanPlusStd_normal'] = gene.meanPlusStd_normal;
          filteredGene['mad_normal'] = gene.mad_normal;
          filteredGene['median_normal'] = gene.median_normal;
        }
        if (selectedGroups.includes('tumor') && selectedGroups.includes('normal')) {
        if (selectedNoiseMetrics.includes('ΔCV')) {
          filteredGene['delta_logfc'] = gene.delta;
        }
        // if (selectedNoiseMetrics.includes('ΔMAD')) {
        //   filteredGene['delta_mad'] = gene.delta_mad;
        // }
        // if (selectedNoiseMetrics.includes('ΔMean+STD')) {
        //   filteredGene['delta_meanPlusStd'] = gene.delta_meanPlusStd;
        // }
      }

      });
      return filteredGene;
    });
  }, [resultsData, selectedGroups]);

  const filteredData = useMemo(() => getFilteredResults(), [getFilteredResults]);

  // const allNoiseMetrics = Object.keys(noiseMetrics);
  const allNoiseMetrics = Object.keys(noiseMetrics);
  const areAllNoiseSelected = useMemo(() => 
    allNoiseMetrics.every(metric => selectedNoiseMetrics.includes(metric)),
    [selectedNoiseMetrics]
  );

  const toggleAllNoiseMetrics = useCallback(debounce((checked) => {
    setSelectedNoiseMetrics(checked ? allNoiseMetrics : []);
  }, 100), [allNoiseMetrics]);

  const [visiblePlots, setVisiblePlots] = useState({
    cv: true,
    meanPlusStd: true,
    mad: true,
    logDist: false,
    exprTrend: false,
    tumorNormal: false
  });

  const allPlotKeys = ['logDist', 'exprTrend'];
  const areAllPlotsSelected = useMemo(() => 
    allPlotKeys.every(plot => visiblePlots[plot]),
    [visiblePlots]
  );

  const toggleAllPlots = useCallback(debounce((checked) => {
    setVisiblePlots(prev => ({
      ...prev,
      ...Object.fromEntries(allPlotKeys.map(plot => [plot, checked]))
    }));
  }, 100), []);

  const handlePlotToggle = useCallback(debounce((plotKey) => {
    setVisiblePlots(prev => ({
      ...prev,
      [plotKey]: !prev[plotKey]
    }));
  }, 100), []);

  const applyFilters = useCallback(() => {
    console.log('Applying filters:', {
      normalizationMethod,
      selectedNoiseMetrics,
      selectedGroups
    });
  }, [normalizationMethod, selectedNoiseMetrics, selectedGroups]);

  const getCancerTypeLabel = useCallback((type) => {
    const labels = {
      'TCGA-BRCA': 'Breast Cancer (BRCA)',
      'TCGA-LUAD': 'Lung Cancer (LUAD)',
      'TCGA-PRAD': 'Prostate Cancer (PRAD)',
      'TCGA-COAD': 'Colorectal Cancer (COAD)',
      'LIHC': 'Liver Cancer (LIHC)',
      'KIRC': 'Kidney Cancer (KIRC)',
      'STAD': 'Stomach Cancer (STAD)',
      'OV': 'Ovarian Cancer (OV)',
      'BLCA': 'Bladder Cancer (BLCA)'
    };
    return labels[type] || type;
  }, []);

  const downloadChart = useCallback((chartKey, chartName) => {
    const chartElement = chartRefs.current[chartKey];
    if (chartElement) {
      const svg = chartElement.querySelector('svg');
      if (svg) {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const img = new Image();
        
        const svgData = new XMLSerializer().serializeToString(svg);
        const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
        const url = URL.createObjectURL(svgBlob);
        
        img.onload = function() {
          canvas.width = img.width || 800;
          canvas.height = img.height || 400;
          ctx?.drawImage(img, 0, 0);
          
          canvas.toBlob((blob) => {
            if (blob) {
              const link = document.createElement('a');
              link.download = `${chartName.replace(/\s+/g, '_').toLowerCase()}_${Date.now()}.png`;
              link.href = URL.createObjectURL(blob);
              link.click();
              URL.revokeObjectURL(link.href);
            }
          });
          URL.revokeObjectURL(url);
        };
        img.src = url;
      }
    }
  }, []);

  const downloadData = useCallback((format) => {
    const data = resultsData;
    let content = '';
    let filename = `gene_analysis_${params.cancerType}_${Date.now()}`;

    // if (format === 'csv') {
    //   const headers = Object.keys(data[0]).join(',');
    //   const rows = data.map(row => Object.values(row).join(','));
    //   content = [headers, ...rows].join('\n');
    //   filename += '.csv';
    // } 
    if (format === 'csv') {
    // Filter out unwanted keys
      const excludedKeys = ['tumorValues', 'normalValues', 'combinedValues'];
      const keys = Object.keys(data[0]).filter(key => !excludedKeys.includes(key));

      const headers = keys.join(',');
      const rows = data.map(row =>
        keys.map(key => row[key]).join(',')
      );

      content = [headers, ...rows].join('\n');
      filename += '.csv';
    }
    // else {
    //   content = JSON.stringify(data, null, 2);
    //   filename += '.json';
    // }

    const blob = new Blob([content], { type: format === 'csv' ? 'text/csv' : 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }, [resultsData, params.cancerType]);

  // const totalTumorSamples = resultsData.reduce((sum, gene) => sum + gene.tumorSamples, 0);
  // const totalNormalSamples = resultsData.reduce((sum, gene) => sum + gene.normalSamples, 0);

  // const logDistData = useMemo(() => {
  //   return resultsData.map(gene => ({
  //     gene: gene.gene,
  //     tumorLogMean: gene.tumorValues.length > 0 
  //       ? Math.log2(gene.tumorValues.reduce((sum, v) => sum + v, 0) / gene.tumorValues.length + 1)
  //       : 0,
  //     normalLogMean: gene.normalValues.length > 0 
  //       ? Math.log2(gene.normalValues.reduce((sum, v) => sum + v, 0) / gene.normalValues.length + 1)
  //       : 0
  //   }));
  // }, [resultsData]);

  // const exprTrendData = useMemo(() => {
  //   return resultsData.map(gene => ({
  //     gene: gene.gene,
  //     tumorMedian: gene.median_tumor,
  //     normalMedian: gene.median_normal
  //   }));
  // }, [resultsData]);
  const logDistData = useMemo(() => {
    return resultsData.map(gene => {
      const entry = { gene: gene.gene };
      if (selectedGroups.includes("tumor")) {
        entry["tumorLogMean"] = gene.tumorValues.length > 0
          ? Math.log2(gene.tumorValues.reduce((sum, v) => sum + v, 0) / gene.tumorValues.length + 1)
          : 0;
      }
      if (selectedGroups.includes("normal")) {
        entry["normalLogMean"] = gene.normalValues.length > 0
          ? Math.log2(gene.normalValues.reduce((sum, v) => sum + v, 0) / gene.normalValues.length + 1)
          : 0;
      }
      if (selectedGroups.includes("combined")) {
        entry["combinedLogMean"] = gene.combinedValues.length > 0
          ? Math.log2(gene.combinedValues.reduce((sum, v) => sum + v, 0) / gene.combinedValues.length + 1)
          : 0;
      }
      return entry;
    });
  }, [resultsData, selectedGroups]);

  const exprTrendData = useMemo(() => {
    return resultsData.map(gene => {
      const entry = { gene: gene.gene };
      if (selectedGroups.includes("tumor")) entry["tumorMedian"] = gene.median_tumor;
      if (selectedGroups.includes("normal")) entry["normalMedian"] = gene.median_normal;
      if (selectedGroups.includes("combined")) entry["combinedMedian"] = gene.median_combined;
      return entry;
    });
  }, [resultsData, selectedGroups]);


  const tumorNormalData = useMemo(() => {
    return resultsData.map(gene => ({
      gene: gene.gene,
      tumorMean: gene.tumorValues.length > 0 
        ? gene.tumorValues.reduce((sum, v) => sum + v, 0) / gene.tumorValues.length
        : 0,
      normalMean: gene.normalValues.length > 0 
        ? gene.normalValues.reduce((sum, v) => sum + v, 0) / gene.normalValues.length
        : 0
    }));
  }, [resultsData]);

  const BarChartComponent = React.memo(({ data, dataKey, color, title }: any) => {
    const renderCount = useRef(0);
    useEffect(() => {
      console.log(`BarChartComponent ${dataKey} rendered ${++renderCount.current} times`);
    });

    return (
      <Card className="border-0 shadow-lg">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center justify-between text-sm">
            <div className="flex items-center space-x-2">
              <Box className="h-4 w-4" style={{ color }} />
              <span>{title}</span>
            </div>
            <Button 
              size="sm" 
              variant="outline" 
              onClick={() => downloadChart(`barplot-${dataKey}`, title)}
              className="h-6 px-2 text-xs"
            >
              <Download className="h-3 w-3" />
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div ref={el => chartRefs.current[`barplot-${dataKey}`] = el} className="chart-container">
            {/* <ResponsiveContainer width="100%" height={200} debounce={100}> */}
              <ResponsiveContainer width="100%" height={250}>
              <ComposedChart data={data} margin={{ top: 5, right: 5, left: 5, bottom: 25 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  // dataKey="gene"
                  // interval={0} // Show all ticks, no skipping
                  // angle={-45}  // Rotate labels for readability
                  // textAnchor="end"
                  // tick={{ fontSize: 12, fill: 'black' }}
                  // height={60} // Add space for rotated labels
                  // label={{
                  //   value: 'Genes',
                  //   position: 'insideBottom',
                  //   offset: -10,
                  //   style: { fontSize: '10px' }
                  // }}
                  dataKey="gene" 
                  tick={{ fontSize: 10 }}
                  label={{
                    value: "Genes",
                    position: "insideBottom",
                    offset: -10,
                    style: { fontSize: "10px" }
                  }}
                  // dataKey="gene" 
                  // // tick={{ fontSize: 10 }}
                  // tick={{
                  //   fontSize: 10,
                  //   fill: '#1e3a8a', // or any visible color (e.g., blue-900)
                  //   dy: 10
                  // }}
                  // label={{ 
                  //   value: 'Genes', 
                  //   position: 'insideBottom', 
                  //   offset: -10, 
                  //   style: { fontSize: '10px' } 
                  // }}
                  // <XAxis 
                    // dataKey = "gene.gene_symbol"
                    // tick={{ fontSize: 10 }}
                    // interval={0}
                    // angle={-45}
                    // textAnchor="end"
                    // height={60}
                    // label={{ 
                    //   value: 'Genes', 
                    //   position: 'insideBottom', 
                    //   offset: -10, 
                    //   style: { fontSize: '10px' } 
                    // }}
                  />
                  {/* <YAxis
                tick={{ fontSize: 10 }}
                reversed={['delta_cv', 'delta_mad', 'delta_meanPlusStd'].includes(dataKey)} // Reverse Y-axis for delta metrics
                label={{
                  value: title,
                  angle: -90,
                  position: 'insideLeft',
                  dy: 55,
                  style: { fontSize: '10px' }
                }}
              /> */}
                <YAxis //domain={[0, 'dataMax + 1']} 
                  tick={{ fontSize: 10 }}
                  // reversed={['logFC'].includes(dataKey)} // Reverse Y-axis for delta metrics
                  label={{ 
                    value: title, 
                    angle: -90, 
                    position: 'insideLeft', 
                    dy: 55,
                    style: { fontSize: '10px' } 
                  }} 
                />
                <Tooltip 
                  formatter={(value) => [
                    typeof value === 'number' ? value.toFixed(2) : value,
                    title,
                  ]} 
                />
                <Bar dataKey={`${dataKey}`} fill={color} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    );
  });

  // const AnalysisPlotComponent = React.memo(({ data, dataKeys, title, type }: any) => {
  //   return (
  //     <Card className="border-0 shadow-lg">
  //       <CardHeader className="pb-2">
  //         <CardTitle className="flex items-center justify-between text-sm">
  //           <div className="flex items-center space-x-2">
  //             <Box className="h-4 w-4" />
  //             <span>{title}</span>
  //           </div>
  //           <Button 
  //             size="sm" 
  //             variant="outline" 
  //             onClick={() => downloadChart(`plot-${title.replace(/\s+/g, '_')}`, title)}
  //             className="h-6 px-2 text-xs"
  //           >
  //             <Download className="h-3 w-3" />
  //           </Button>
  //         </CardTitle>
  //       </CardHeader>
  //       <CardContent className="pt-0">
  //         <div ref={el => chartRefs.current[`plot-${title.replace(/\s+/g, '_')}`] = el} className="chart-container">
  //           <ResponsiveContainer width="100%" height={200} debounce={100}>
  //             <ComposedChart data={data} margin={{ top: 5, right: 5, left: 5, bottom: 25 }}>
  //               <CartesianGrid strokeDasharray="3 3" />
  //               <XAxis 
  //                 dataKey="gene" 
  //                 tick={{ fontSize: 10 }}
  //                 label={{ 
  //                   value: 'Genes', 
  //                   position: 'insideBottom', 
  //                   offset: -10, 
  //                   style: { fontSize: '10px' } 
  //                 }}
  //               />
  //               <YAxis 
  //                 tick={{ fontSize: 10 }}
  //                 label={{ 
  //                   value: title, 
  //                   angle: -90, 
  //                   position: 'insideLeft', 
  //                   dy: 55,
  //                   style: { fontSize: '10px' } 
  //                 }} 
  //               />
  //               <Tooltip 
  //                 formatter={(value) => [
  //                   typeof value === 'number' ? value.toFixed(2) : value,
  //                   title,
  //                 ]} 
  //               />
  //               {type === 'line' ? (
  //                 <>
  //                   <Line type="monotone" dataKey={dataKeys[0]} stroke="#ef4444" name="Tumor" />
  //                   <Line type="monotone" dataKey={dataKeys[1]} stroke="#10b981" name="Normal" />
  //                 </>
  //               ) : type === 'bar' ? (
  //                 <>
  //                   <Bar dataKey={dataKeys[0]} fill="#ef4444" name="Tumor" />
  //                   <Bar dataKey={dataKeys[1]} fill="#10b981" name="Normal" />
  //                 </>
  //               ) : (
  //                 <>
  //                   <Area type="monotone" dataKey={dataKeys[0]} fill="#ef4444" stroke="#ef4444" />
  //                   <Area type="monotone" dataKey={dataKeys[1]} fill="#10b981" stroke="#10b981" />
  //                 </>
  //               )}
  //             </ComposedChart>
  //           </ResponsiveContainer>
  //         </div>
  //       </CardContent>
  //     </Card>
  //   );
  // });

  const AnalysisPlotComponent = React.memo(({ data, title, type }: any) => {
  const groupColors = {
    tumor: "#ef4444",
    normal: "#10b981",
    combined: "#3b82f6"
  };

  const groupLabelMap = {
    tumor: "Tumor",
    normal: "Normal",
    combined: "Combined"
  };

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between text-sm">
          <div className="flex items-center space-x-2">
            <Box className="h-4 w-4" />
            <span>{title}</span>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => downloadChart(`plot-${title.replace(/\s+/g, '_')}`, title)}
            className="h-6 px-2 text-xs"
          >
            <Download className="h-3 w-3" />
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div ref={el => chartRefs.current[`plot-${title.replace(/\s+/g, '_')}`] = el} className="chart-container">
          <ResponsiveContainer width="100%" height={200} debounce={100}>
            <ComposedChart data={data} margin={{ top: 5, right: 5, left: 5, bottom: 25 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="gene" 
                tick={{ fontSize: 10 }}
                label={{
                  value: "Genes",
                  position: "insideBottom",
                  offset: -10,
                  style: { fontSize: "10px" }
                }}
              />
              <YAxis
                tick={{ fontSize: 10 }}
                label={{
                  value: title,
                  angle: -90,
                  position: "insideLeft",
                  dy: 55,
                  style: { fontSize: "10px" }
                }}
              />
              <Tooltip />
              {selectedGroups.map(group => {
                const dataKey = title.includes("Log") ? `${group}LogMean` : `${group}Median`;
                const color = groupColors[group];
                const label = groupLabelMap[group];

                if (type === "line") {
                  return <Line key={group} type="monotone" dataKey={dataKey} stroke={color} name={label} />;
                } else if (type === "bar") {
                  return <Bar key={group} dataKey={dataKey} fill={color} name={label} />;
                } else {
                  return <Area key={group} type="monotone" dataKey={dataKey} stroke={color} fill={color} name={label} />;
                }
              })}
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
});


  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-yellow-50">
      <style>
        {`
          .chart-container {
            min-height: 200px;
            width: 100%;
            position: relative;
          }
        `}
      </style>
      <header className="bg-white shadow-sm border-b border-blue-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <h1 className="text-2xl font-bold text-blue-900">Gene Analysis Results</h1>
            </div>
            <nav className="flex space-x-6">
              <Link to="/" className="text-blue-700 hover:text-blue-600 font-medium transition-colors">
                Home
              </Link>
              <Link to="/gene-analysis" className="text-blue-500 font-medium">
                Gene Analysis
              </Link>
              <Link to="/pathway-analysis" className="text-blue-700 hover:text-blue-600 font-medium transition-colors">
                Pathway Analysis
              </Link>
              <Link to="/tumour-analysis" className="text-blue-700 hover:text-blue-600 font-medium transition-colors">
                Tumor Analysis
              </Link>
            </nav>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-6">
          <div className="w-80 flex-shrink-0">
            <Card className="border-0 shadow-lg bg-blue-100">
              <CardHeader className="pb-4">
                <CardTitle className="text-blue-900">Filters</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="font-semibold text-blue-900 mb-3">Expression Normalization Method</h3>
                  <RadioGroup value={normalizationMethod} onValueChange={setNormalizationMethod}>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="tpm" id="tpm" />
                      <Label htmlFor="tpm">TPM</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="fpkm" id="fpkm" />
                      <Label htmlFor="fpkm">FPKM</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="fpkm_uq" id="fpkm_uq" />
                      <Label htmlFor="fpkm_uq">FPKM_UQ</Label>
                    </div>
                  </RadioGroup>
                </div>

                <div className="border rounded-md bg-white">
                  <div className="flex justify-between items-center px-4 py-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="noise-metrics-master"
                        checked={areAllNoiseSelected}
                        onCheckedChange={toggleAllNoiseMetrics}
                      />
                      <Label htmlFor="noise-metrics-master" className="font-bold text-blue-900 -ml-5">Noise Metrics</Label>
                    </div>
                    <button
                      onClick={() => setIsNoiseMetricsOpen(prev => !prev)}
                      className="text-blue-900"
                    >
                      {isNoiseMetricsOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                    </button>
                  </div>
                  {isNoiseMetricsOpen && (
                    <div className="px-4 py-2 space-y-2">
                      {/* {allNoiseMetrics.map((metric) => (
                        <div key={metric} className="flex items-center space-x-2">
                          <Checkbox
                            id={`noise-${metric}`}
                            checked={selectedNoiseMetrics.includes(metric)}
                            onCheckedChange={() => handleNoiseMetricToggle(metric)}
                          />
                          <Label htmlFor={`noise-${metric}`} className="text-sm">{metric}</Label>
                        </div>
                      ))} */}
                      {Object.keys(noiseMetrics).map((metric) => (
                        <div key={metric} className="flex items-center space-x-2">
                          <Checkbox
                            id={`noise-${metric}`}
                            checked={selectedNoiseMetrics.includes(metric)}
                            onCheckedChange={() => handleNoiseMetricToggle(metric)}
                          />
                          <Label htmlFor={`noise-${metric}`} className="text-sm">{metric}</Label>
                        </div>
                      ))}

                    </div>
                  )}
                </div>

                <div className="border rounded-md bg-white">
                  <div className="flex justify-between items-center px-4 py-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="analysis-plots-master"
                        checked={areAllPlotsSelected}
                        onCheckedChange={toggleAllPlots}
                      />
                      <Label htmlFor="analysis-plots-master" className="font-bold text-blue-900 -ml-5">Analysis Plots</Label>
                    </div>
                    <button
                      onClick={() => setIsAnalysisPlotsOpen(prev => !prev)}
                      className="text-blue-900"
                    >
                      {isAnalysisPlotsOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                    </button>
                  </div>
                  {isAnalysisPlotsOpen && (
                    <div className="px-4 py-2 space-y-2">
                      {allPlotKeys.map(plotKey => (
                        <div key={plotKey} className="flex items-center space-x-2">
                          <Checkbox
                            id={`plot-${plotKey}`}
                            checked={visiblePlots[plotKey]}
                            onCheckedChange={() => handlePlotToggle(plotKey)}
                          />
                          <Label htmlFor={`plot-${plotKey}`} className="text-sm">
                            {{
                              logDist: 'Log Expression Distribution',
                              exprTrend: 'Expression Trend'
                              // tumorNormal: 'Tumor vs Normal'
                            }[plotKey]}
                          </Label>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* <Button onClick={applyFilters} className="w-full bg-blue-600 hover:bg-blue-700">
                  Apply
                </Button> */}
              </CardContent>
            </Card>
          </div>

          <div className="flex-1">
            {isLoading ? (
              <div className="text-center text-blue-900">Loading charts...</div>
            ) : (
              <>
                <Link to="/gene-analysis" className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-6 transition-colors">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Gene Analysis
                </Link>

                <div className="mb-8">
                  <h2 className="text-4xl font-bold text-blue-900 mb-2">
                    Results for {getCancerTypeLabel(params.cancerType)}
                  </h2>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex flex-wrap gap-2">
                      {params.genes.map((gene) => (
                        <Badge key={gene} variant="secondary" className="text-sm">
                          {gene}
                        </Badge>
                      ))}
                    </div>
                    <div className="flex space-x-4">
                      <Button onClick={() => downloadData('csv')} variant="outline" size="sm">
                        <Download className="h-4 w-4 mr-2" /> Download CSV
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <Card className="border-0 shadow-lg">
                      <CardContent className="flex flex-col items-center p-4 text-center">
                        <Users className="h-6 w-6 text-blue-600 mb-2" />
                        <div className="text-2xl font-bold text-blue-600">{totalTumorSamples}</div>
                        <div className="text-xs text-gray-600">Total Tumor Samples</div>
                      </CardContent>
                    </Card>
                    <Card className="border-0 shadow-lg">
                      <CardContent className="flex flex-col items-center p-4 text-center">
                        <Users className="h-6 w-6 text-green-600 mb-2" />
                        <div className="text-2xl font-bold text-green-600">{totalNormalSamples}</div>
                        <div className="text-xs text-gray-600">Total Normal Samples</div>
                      </CardContent>
                    </Card>
                  </div>
                </div>

                {(visiblePlots.cv || visiblePlots.meanPlusStd || visiblePlots.mad) && (
                  <div className="mb-8">
                    <h3 className="text-2xl font-bold text-blue-900 mb-4">Statistical Metrics</h3>
                    <div className="flex gap-4 mb-6">
                      {['normal', 'tumor', 'combined'].map(group => (
                        <Button
                          key={group}
                          className={`text-white ${
                            selectedGroups.includes(group)
                              ? 'bg-blue-600 hover:bg-blue-700'
                              : 'bg-white text-blue-600 border border-blue-600 hover:bg-blue-50'
                          }`}
                          onClick={() => toggleGroup(group)}
                        >
                          {group.charAt(0).toUpperCase() + group.slice(1)}
                        </Button>
                      ))}
                    </div>

                    <div className="grid lg:grid-cols-3 md:grid-cols-2 gap-4">
                      {['cv', 'meanPlusStd', 'mad'].map(metric => 
                        selectedGroups.map(group => (
                          selectedNoiseMetrics.includes(Object.keys(noiseMetrics).find(key => noiseMetrics[key] === metric)) && (
                            <BarChartComponent
                              key={`chart-${metric}-${group}`}
                              data={resultsData}
                              dataKey={`${metric}_${group}`}
                              color={
                                group === 'normal' ? '#10b981' :
                                group === 'tumor' ? '#ef4444' :
                                '#3b82f6'
                              }
                              title={`${Object.keys(noiseMetrics).find(key => noiseMetrics[key] === metric)} — ${group.charAt(0).toUpperCase() + group.slice(1)}`}
                            />
                          )
                        ))
                      )}
                      {/* {['delta_cv', 'delta_mad', 'delta_meanPlusStd'].map(deltaKey => { */}
                      {['logFC'].map(deltaKey => { 
                        const titleMap = {
                          // delta_logfc: 'ΔLogfc (Tumor - Normal)'  
                          logFC: 'log2 Fold Change (Tumor / Normal)'
                          // delta_mad: 'ΔMAD (Tumor - Normal)',
                          // delta_meanPlusStd: 'ΔMean+STD (Tumor - Normal)'
                        };
                        const colorMap = {
                          logFC: '#f59e0b'
                          // delta_mad: '#a855f7',
                          // delta_meanPlusStd: '#06b6d4'
                        };
                        const label = Object.keys(noiseMetrics).find(key => noiseMetrics[key] === deltaKey);
                        if (!selectedNoiseMetrics.includes(label)) return null;
                        return (
                          <BarChartComponent
                            key={`chart-${deltaKey}`}
                            data={resultsData}
                            dataKey={deltaKey}
                            color={colorMap[deltaKey]}
                            title={titleMap[deltaKey]}
                          />
                        );
                      })}

                    </div>
                  </div>
                )}

                {(visiblePlots.logDist || visiblePlots.exprTrend || visiblePlots.tumorNormal) && (
                  <div className="mb-8">
                    <h3 className="text-2xl font-bold text-blue-900 mb-4">Analysis Plots</h3>
                    <div className="grid lg:grid-cols-3 md:grid-cols-2 gap-4">
                      {/* {visiblePlots.logDist && (
                        <AnalysisPlotComponent
                          key="chart-logDist"
                          data={logDistData}
                          dataKeys={['tumorLogMean', 'normalLogMean']}
                          title="Log Expression Distribution"
                          type="area"
                        />
                      )}
                      {visiblePlots.exprTrend && (
                        <AnalysisPlotComponent
                          key="chart-exprTrend"
                          data={exprTrendData}
                          dataKeys={['tumorMedian', 'normalMedian']}
                          title="Expression Trend"
                          type="line"
                        />
                      )} */}
                      {visiblePlots.logDist && (
                        <AnalysisPlotComponent
                          key="chart-logDist"
                          data={logDistData}
                          title="Log Expression Distribution"
                          type="area"
                        />
                      )}
                      {visiblePlots.exprTrend && (
                        <AnalysisPlotComponent
                          key="chart-exprTrend"
                          data={exprTrendData}
                          title="Expression Trend"
                          type="line"
                        />
                      )}

                      {/* {visiblePlots.tumorNormal && (
                        <AnalysisPlotComponent
                          key="chart-tumorNormal"
                          data={tumorNormalData}
                          dataKeys={['tumorMean', 'normalMean']}
                          title="Tumor vs Normal"
                          type="bar"
                        />
                      )} */}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
      <footer className="bg-gray-100 text-gray-700 text-m mt-10 p-8 text-center border-t border-gray-300">
        <p className="text-blue-700 mt-4">© 2025 BIRL — This website is free and open to all users and there is no login requirement.</p>
        <p className="font-semibold text-blue-700 mt-4">Biomedical Informatics & Engineering Research Laboratory, Lahore University of Management Sciences</p>
        <p className="text-blue-700 mt-4">DHA, Lahore, Pakistan</p>
        <p className="text-blue-700 mt-4">+92 (42) 3560 8352</p>
      </footer>
    </div>
  );
};

export default GeneResults;