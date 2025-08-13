// // import supabase from "@/supabase-client";
// // import { GeneStats } from "@/components/types/genes";

// // // Define the structure of the data to upsert for each metric
// // type UpsertData = {
// //   gene_id: number;
// //   cancer_type_id: number;
// //   tpm: number | null;
// //   fpkm: number | null;
// //   fpkm_uq: number | null;
// // };

// // // Define the noise metrics and their corresponding Supabase tables
// // const noiseMetrics = {
// //   CV: "cv",
// //   Mean: "mean",
// //   "Standard Deviation": "std",
// //   MAD: "mad",
// //   "CV²": "cv_squared",
// //   "Differential Noise": "logfc",
// // };

// // const metricTables = {
// //   cv: ["cv_normal", "cv_tumor"],
// //   mean: ["mean_normal", "mean_tumor"],
// //   std: ["std_normal", "std_tumor"],
// //   mad: ["mad_normal", "mad_tumor"],
// //   cv_squared: ["cv_squared_normal", "cv_squared_tumor"],
// //   logfc: ["logfc"],
// // };

// // /**
// //  * Upserts calculated gene data into Supabase tables.
// //  * @param processedData Array of gene statistics to upsert.
// //  * @param geneData Array of gene metadata (id, ensembl_id, gene_symbol).
// //  * @param siteRows Array of site metadata (id, name).
// //  * @param cancerTypeRows Array of cancer type metadata (id, tcga_code, site_id).
// //  * @param selectedGroups Array of selected sample groups ("normal", "tumor").
// //  * @param normalizationMethod The normalization method used ("tpm", "fpkm", "fpkm_uq").
// //  * @returns Promise resolving to an object with success status and optional error message.
// //  */
// // export const upsertGeneData = async (
// //   processedData: GeneStats[],
// //   geneData: { id: number; ensembl_id: string; gene_symbol: string }[],
// //   siteRows: { id: number; name: string }[],
// //   cancerTypeRows: { id: number; tcga_code: string; site_id: number }[],
// //   selectedGroups: string[],
// //   normalizationMethod: string
// // ): Promise<{ success: boolean; error?: string }> => {
// //   try {
// //     // Initialize data structure for upsert
// //     const supabaseUpsertData: {
// //       [metric: string]: {
// //         normal?: UpsertData[];
// //         tumor?: UpsertData[];
// //         logfc?: UpsertData[];
// //       };
// //     } = {
// //       cv: { normal: [], tumor: [] },
// //       mean: { normal: [], tumor: [] },
// //       std: { normal: [], tumor: [] },
// //       mad: { normal: [], tumor: [] },
// //       cv_squared: { normal: [], tumor: [] },
// //       logfc: { logfc: [] },
// //     };

// //     // Use a Map to ensure unique entries
// //     const uniqueEntries = new Map<string, { metric: string; type: "normal" | "tumor" | "logfc"; entry: UpsertData }>();

// //     // Process each gene in the data
// //     for (const gene of processedData) {
// //       const gene_id = geneData.find((g) => g.ensembl_id.split(".")[0] === gene.ensembl_id.split(".")[0])?.id;
// //       if (!gene_id) {
// //         console.warn(`Skipping upsert for gene ${gene.ensembl_id}: missing gene_id`);
// //         continue;
// //       }

// //       const siteRow = siteRows.find((s) => s.name === gene.site);
// //       if (!siteRow) {
// //         console.warn(`Skipping upsert for site ${gene.site}: missing site data`);
// //         continue;
// //       }

// //       const cancer_type = cancerTypeRows.find((ct) => ct.site_id === siteRow.id);
// //       if (!cancer_type) {
// //         console.warn(`Skipping upsert for site ${gene.site}: missing cancer type`);
// //         continue;
// //       }

// //       // Process each metric
// //       for (const metric of Object.keys(noiseMetrics)) {
// //         const metricKey = noiseMetrics[metric as keyof typeof noiseMetrics];

// //         if (metricKey === "logfc") {
// //           if (
// //             selectedGroups.includes("normal") &&
// //             selectedGroups.includes("tumor") &&
// //             gene.normalSamples > 1
// //           ) {
// //             const entry: UpsertData = {
// //               gene_id,
// //               cancer_type_id: cancer_type.id,
// //               tpm: normalizationMethod === "tpm" ? gene.logfc : null,
// //               fpkm: normalizationMethod === "fpkm" ? gene.logfc : null,
// //               fpkm_uq: normalizationMethod === "fpkm_uq" ? gene.logfc : null,
// //             };
// //             const logfcKey = `logfc_${gene_id}_${cancer_type.id}`;
// //             if (entry.tpm || entry.fpkm || entry.fpkm_uq) {
// //               uniqueEntries.set(logfcKey, { metric: metricKey, type: "logfc", entry });
// //             }
// //           }
// //           continue;
// //         }

// //         if (selectedGroups.includes("normal")) {
// //           const entry: UpsertData = {
// //             gene_id,
// //             cancer_type_id: cancer_type.id,
// //             tpm: gene[`${metricKey}_normal_tpm` as keyof GeneStats] as number | null,
// //             fpkm: gene[`${metricKey}_normal_fpkm` as keyof GeneStats] as number | null,
// //             fpkm_uq: gene[`${metricKey}_normal_fpkm_uq` as keyof GeneStats] as number | null,
// //           };
// //           const normalKey = `${metricKey}_normal_${gene_id}_${cancer_type.id}`;
// //           if (entry.tpm || entry.fpkm || entry.fpkm_uq) {
// //             uniqueEntries.set(normalKey, { metric: metricKey, type: "normal", entry });
// //           }
// //         }

// //         if (selectedGroups.includes("tumor")) {
// //           const entry: UpsertData = {
// //             gene_id,
// //             cancer_type_id: cancer_type.id,
// //             tpm: gene[`${metricKey}_tumor_tpm` as keyof GeneStats] as number | null,
// //             fpkm: gene[`${metricKey}_tumor_fpkm` as keyof GeneStats] as number | null,
// //             fpkm_uq: gene[`${metricKey}_tumor_fpkm_uq` as keyof GeneStats] as number | null,
// //           };
// //           const tumorKey = `${metricKey}_tumor_${gene_id}_${cancer_type.id}`;
// //           if (entry.tpm || entry.fpkm || entry.fpkm_uq) {
// //             uniqueEntries.set(tumorKey, { metric: metricKey, type: "tumor", entry });
// //           }
// //         }
// //       }
// //     }

// //     // Populate upsert data
// //     for (const { metric, type, entry } of uniqueEntries.values()) {
// //       supabaseUpsertData[metric][type]!.push(entry);
// //     }

// //     // Perform upserts for each metric and table
// //     for (const metric of Object.keys(noiseMetrics)) {
// //       const metricKey = noiseMetrics[metric as keyof typeof noiseMetrics];
// //       const tables = metricTables[metricKey];

// //       for (const table of tables) {
// //         const dataToUpsert = supabaseUpsertData[metricKey][metricKey === "logfc" ? "logfc" : table.includes("normal") ? "normal" : "tumor"]?.filter(
// //           (entry) => entry.tpm || entry.fpkm || entry.fpkm_uq
// //         ) || [];
// //         if (dataToUpsert.length > 0) {
// //           console.log(`Upserting into ${table}:`, JSON.stringify(dataToUpsert, null, 2));
// //           const { data, error } = await supabase
// //             .from(table)
// //             .upsert(dataToUpsert, { onConflict: "gene_id, cancer_type_id" })
// //             .select();
// //           if (error) {
// //             console.error(`Failed to upsert into ${table}:`, JSON.stringify(error, null, 2));
// //             return { success: false, error: `Failed to upsert into ${table}: ${error.message}` };
// //           }
// //           console.log(`Upserted into ${table}:`, data);
// //         }
// //       }
// //     }

// //     return { success: true };
// //   } catch (error: any) {
// //     console.error("Error in upsertGeneData:", JSON.stringify(error, null, 2));
// //     return { success: false, error: error.message || "An error occurred while upserting data." };
// //   }
// // };
// import supabase from "@/supabase-client";
// import { GeneStats } from "@/components/types/genes";

// // Define the structure of the data to upsert for each metric
// type UpsertData = {
//   gene_id: number;
//   cancer_type_id: number;
//   tpm: number | null;
//   fpkm: number | null;
//   fpkm_uq: number | null;
// };

// // Define the noise metrics and their corresponding Supabase tables
// const noiseMetrics = {
//   CV: "cv",
//   Mean: "mean",
//   "Standard Deviation": "std",
//   MAD: "mad",
//   "CV²": "cv_squared",
//   "Differential Noise": "logfc",
// };

// const metricTables = {
//   cv: ["cv_normal", "cv_tumor"],
//   mean: ["mean_normal", "mean_tumor"],
//   std: ["std_normal", "std_tumor"],
//   mad: ["mad_normal", "mad_tumor"],
//   cv_squared: ["cv_squared_normal", "cv_squared_tumor"],
//   logfc: ["logfc"],
// };

// /**
//  * Upserts calculated gene data into Supabase tables for all normalization methods.
//  * @param processedData Array of gene statistics to upsert.
//  * @param geneData Array of gene metadata (id, ensembl_id, gene_symbol).
//  * @param siteRows Array of site metadata (id, name).
//  * @param cancerTypeRows Array of cancer type metadata (id, tcga_code, site_id).
//  * @param selectedGroups Array of selected sample groups ("normal", "tumor").
//  * @param normalizationMethod The normalization method used ("tpm", "fpkm", "fpkm_uq").
//  * @returns Promise resolving to an object with success status and optional error message.
//  */
// export const upsertGeneData = async (
//   processedData: GeneStats[],
//   geneData: { id: number; ensembl_id: string; gene_symbol: string }[],
//   siteRows: { id: number; name: string }[],
//   cancerTypeRows: { id: number; tcga_code: string; site_id: number }[],
//   selectedGroups: string[],
//   normalizationMethod: string
// ): Promise<{ success: boolean; error?: string }> => {
//   try {
//     // Initialize data structure for upsert
//     const supabaseUpsertData: {
//       [metric: string]: {
//         normal?: UpsertData[];
//         tumor?: UpsertData[];
//         logfc?: UpsertData[];
//       };
//     } = {
//       cv: { normal: [], tumor: [] },
//       mean: { normal: [], tumor: [] },
//       std: { normal: [], tumor: [] },
//       mad: { normal: [], tumor: [] },
//       cv_squared: { normal: [], tumor: [] },
//       logfc: { logfc: [] },
//     };

//     // Use a Map to ensure unique entries
//     const uniqueEntries = new Map<string, { metric: string; type: "normal" | "tumor" | "logfc"; entry: UpsertData }>();

//     // Process each gene in the data
//     for (const gene of processedData) {
//       const gene_id = geneData.find((g) => g.ensembl_id.split(".")[0] === gene.ensembl_id.split(".")[0])?.id;
//       if (!gene_id) {
//         console.warn(`Skipping upsert for gene ${gene.ensembl_id}: missing gene_id`);
//         continue;
//       }

//       const siteRow = siteRows.find((s) => s.name === gene.site);
//       if (!siteRow) {
//         console.warn(`Skipping upsert for site ${gene.site}: missing site data`);
//         continue;
//       }

//       const cancer_type = cancerTypeRows.find((ct) => ct.site_id === siteRow.id);
//       if (!cancer_type) {
//         console.warn(`Skipping upsert for site ${gene.site}: missing cancer type`);
//         continue;
//       }

//       // Process each metric
//       for (const metric of Object.keys(noiseMetrics)) {
//         const metricKey = noiseMetrics[metric as keyof typeof noiseMetrics];

//         if (metricKey === "logfc") {
//           if (
//             selectedGroups.includes("normal") &&
//             selectedGroups.includes("tumor") &&
//             gene.normalSamples > 1
//           ) {
//             const entry: UpsertData = {
//               gene_id,
//               cancer_type_id: cancer_type.id,
//               tpm: gene[`logfc_tpm` as keyof GeneStats] as number | null,
//               fpkm: gene[`logfc_fpkm` as keyof GeneStats] as number | null,
//               fpkm_uq: gene[`logfc_fpkm_uq` as keyof GeneStats] as number | null,
//             };
//             const logfcKey = `logfc_${gene_id}_${cancer_type.id}`;
//             if (entry.tpm !== null || entry.fpkm !== null || entry.fpkm_uq !== null) {
//               uniqueEntries.set(logfcKey, { metric: metricKey, type: "logfc", entry });
//             }
//           }
//           continue;
//         }

//         if (selectedGroups.includes("normal")) {
//           const entry: UpsertData = {
//             gene_id,
//             cancer_type_id: cancer_type.id,
//             tpm: gene[`${metricKey}_normal_tpm` as keyof GeneStats] as number | null,
//             fpkm: gene[`${metricKey}_normal_fpkm` as keyof GeneStats] as number | null,
//             fpkm_uq: gene[`${metricKey}_normal_fpkm_uq` as keyof GeneStats] as number | null,
//           };
//           const normalKey = `${metricKey}_normal_${gene_id}_${cancer_type.id}`;
//           if (entry.tpm !== null || entry.fpkm !== null || entry.fpkm_uq !== null) {
//             uniqueEntries.set(normalKey, { metric: metricKey, type: "normal", entry });
//           }
//         }

//         if (selectedGroups.includes("tumor")) {
//           const entry: UpsertData = {
//             gene_id,
//             cancer_type_id: cancer_type.id,
//             tpm: gene[`${metricKey}_tumor_tpm` as keyof GeneStats] as number | null,
//             fpkm: gene[`${metricKey}_tumor_fpkm` as keyof GeneStats] as number | null,
//             fpkm_uq: gene[`${metricKey}_tumor_fpkm_uq` as keyof GeneStats] as number | null,
//           };
//           const tumorKey = `${metricKey}_tumor_${gene_id}_${cancer_type.id}`;
//           if (entry.tpm !== null || entry.fpkm !== null || entry.fpkm_uq !== null) {
//             uniqueEntries.set(tumorKey, { metric: metricKey, type: "tumor", entry });
//           }
//         }
//       }
//     }

//     // Populate upsert data
//     for (const { metric, type, entry } of uniqueEntries.values()) {
//       supabaseUpsertData[metric][type]!.push(entry);
//     }

//     // Perform upserts for each metric and table
//     for (const metric of Object.keys(noiseMetrics)) {
//       const metricKey = noiseMetrics[metric as keyof typeof noiseMetrics];
//       const tables = metricTables[metricKey];

//       for (const table of tables) {
//         const dataToUpsert = supabaseUpsertData[metricKey][metricKey === "logfc" ? "logfc" : table.includes("normal") ? "normal" : "tumor"]?.filter(
//           (entry) => entry.tpm !== null || entry.fpkm !== null || entry.fpkm_uq !== null
//         ) || [];
//         if (dataToUpsert.length > 0) {
//           console.log(`Upserting into ${table}:`, JSON.stringify(dataToUpsert, null, 2));
//           const { data, error } = await supabase
//             .from(table)
//             .upsert(dataToUpsert, { onConflict: "gene_id, cancer_type_id" })
//             .select();
//           if (error) {
//             console.error(`Failed to upsert into ${table}:`, JSON.stringify(error, null, 2));
//             return { success: false, error: `Failed to upsert into ${table}: ${error.message}` };
//           }
//           console.log(`Upserted into ${table}:`, data);
//         }
//       }
//     }

//     return { success: true };
//   } catch (error: any) {
//     console.error("Error in upsertGeneData:", JSON.stringify(error, null, 2));
//     return { success: false, error: error.message || "An error occurred while upserting data." };
//   }
// };
import supabase from "@/supabase-client";
import { GeneStats } from "@/components/types/genes";

// Define the structure of the data to upsert for each metric
type UpsertData = {
  gene_id: number;
  cancer_type_id: number;
  tpm: number | null;
  fpkm: number | null;
  fpkm_uq: number | null;
};

// Define the noise metrics and their corresponding Supabase tables
const noiseMetrics = {
  CV: "cv",
  Mean: "mean",
  "Standard Deviation": "std",
  MAD: "mad",
  "CV²": "cv_squared",
  "Differential Noise": "logfc",
};

const metricTables = {
  cv: ["cv_normal", "cv_tumor"],
  mean: ["mean_normal", "mean_tumor"],
  std: ["std_normal", "std_tumor"],
  mad: ["mad_normal", "mad_tumor"],
  cv_squared: ["cv_squared_normal", "cv_squared_tumor"],
  logfc: ["logfc"],
};

/**
 * Upserts calculated gene data into Supabase tables for all normalization methods.
 * @param processedData Array of gene statistics to upsert.
 * @param geneData Array of gene metadata (id, ensembl_id, gene_symbol).
 * @param siteRows Array of site metadata (id, name).
 * @param cancerTypeRows Array of cancer type metadata (id, tcga_code, site_id).
 * @param selectedGroups Array of selected sample groups ("normal", "tumor").
 * @param normalizationMethod The normalization method used ("tpm", "fpkm", "fpkm_uq").
 * @returns Promise resolving to an object with success status and optional error message.
 */
export const upsertGeneData = async (
  processedData: GeneStats[],
  geneData: { id: number; ensembl_id: string; gene_symbol: string }[],
  siteRows: { id: number; name: string }[],
  cancerTypeRows: { id: number; tcga_code: string; site_id: number }[],
  selectedGroups: string[],
  normalizationMethod: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    // Initialize data structure for upsert
    const supabaseUpsertData: {
      [metric: string]: {
        normal?: UpsertData[];
        tumor?: UpsertData[];
        logfc?: UpsertData[];
      };
    } = {
      cv: { normal: [], tumor: [] },
      mean: { normal: [], tumor: [] },
      std: { normal: [], tumor: [] },
      mad: { normal: [], tumor: [] },
      cv_squared: { normal: [], tumor: [] },
      logfc: { logfc: [] },
    };

    // Use a Map to ensure unique entries
    const uniqueEntries = new Map<string, { metric: string; type: "normal" | "tumor" | "logfc"; entry: UpsertData }>();

    // Process each gene in the data
    for (const gene of processedData) {
      const gene_id = geneData.find((g) => g.ensembl_id.split(".")[0] === gene.ensembl_id.split(".")[0])?.id;
      if (!gene_id) {
        console.warn(`Skipping upsert for gene ${gene.ensembl_id}: missing gene_id`);
        continue;
      }

      const siteRow = siteRows.find((s) => s.name === gene.site);
      if (!siteRow) {
        console.warn(`Skipping upsert for site ${gene.site}: missing site data`);
        continue;
      }

      const cancer_type = cancerTypeRows.find((ct) => ct.site_id === siteRow.id);
      if (!cancer_type) {
        console.warn(`Skipping upsert for site ${gene.site}: missing cancer type`);
        continue;
      }

      // Process each metric
      for (const metric of Object.keys(noiseMetrics)) {
        const metricKey = noiseMetrics[metric as keyof typeof noiseMetrics];

        if (metricKey === "logfc") {
          if (
            selectedGroups.includes("normal") &&
            selectedGroups.includes("tumor") &&
            gene.normalSamples > 1
          ) {
            const entry: UpsertData = {
              gene_id,
              cancer_type_id: cancer_type.id,
              tpm: gene[`logfc_tpm` as keyof GeneStats] as number | null,
              fpkm: gene[`logfc_fpkm` as keyof GeneStats] as number | null,
              fpkm_uq: gene[`logfc_fpkm_uq` as keyof GeneStats] as number | null,
            };
            const logfcKey = `logfc_${gene_id}_${cancer_type.id}`;
            if (entry.tpm !== null || entry.fpkm !== null || entry.fpkm_uq !== null) {
              uniqueEntries.set(logfcKey, { metric: metricKey, type: "logfc", entry });
            }
          }
          continue;
        }

        if (selectedGroups.includes("normal")) {
          const entry: UpsertData = {
            gene_id,
            cancer_type_id: cancer_type.id,
            tpm: gene[`${metricKey}_normal_tpm` as keyof GeneStats] as number | null,
            fpkm: gene[`${metricKey}_normal_fpkm` as keyof GeneStats] as number | null,
            fpkm_uq: gene[`${metricKey}_normal_fpkm_uq` as keyof GeneStats] as number | null,
          };
          const normalKey = `${metricKey}_normal_${gene_id}_${cancer_type.id}`;
          if (entry.tpm !== null || entry.fpkm !== null || entry.fpkm_uq !== null) {
            uniqueEntries.set(normalKey, { metric: metricKey, type: "normal", entry });
          }
        }

        if (selectedGroups.includes("tumor")) {
          const entry: UpsertData = {
            gene_id,
            cancer_type_id: cancer_type.id,
            tpm: gene[`${metricKey}_tumor_tpm` as keyof GeneStats] as number | null,
            fpkm: gene[`${metricKey}_tumor_fpkm` as keyof GeneStats] as number | null,
            fpkm_uq: gene[`${metricKey}_tumor_fpkm_uq` as keyof GeneStats] as number | null,
          };
          const tumorKey = `${metricKey}_tumor_${gene_id}_${cancer_type.id}`;
          if (entry.tpm !== null || entry.fpkm !== null || entry.fpkm_uq !== null) {
            uniqueEntries.set(tumorKey, { metric: metricKey, type: "tumor", entry });
          }
        }
      }
    }

    // Populate upsert data
    for (const { metric, type, entry } of uniqueEntries.values()) {
      supabaseUpsertData[metric][type]!.push(entry);
    }

    // Perform upserts for each metric and table
    for (const metric of Object.keys(noiseMetrics)) {
      const metricKey = noiseMetrics[metric as keyof typeof noiseMetrics];
      const tables = metricTables[metricKey];

      for (const table of tables) {
        const dataToUpsert = supabaseUpsertData[metricKey][metricKey === "logfc" ? "logfc" : table.includes("normal") ? "normal" : "tumor"]?.filter(
          (entry) => entry.tpm !== null || entry.fpkm !== null || entry.fpkm_uq !== null
        ) || [];
        if (dataToUpsert.length > 0) {
          console.log(`Upserting into ${table}:`, JSON.stringify(dataToUpsert, null, 2));
          const { data, error } = await supabase
            .from(table)
            .upsert(dataToUpsert, { onConflict: "gene_id, cancer_type_id" })
            .select();
          if (error) {
            console.error(`Failed to upsert into ${table}:`, JSON.stringify(error, null, 2));
            return { success: false, error: `Failed to upsert into ${table}: ${error.message}` };
          }
          console.log(`Upserted into ${table}:`, data);
        }
      }
    }

    return { success: true };
  } catch (error: any) {
    console.error("Error in upsertGeneData:", JSON.stringify(error, null, 2));
    return { success: false, error: error.message || "An error occurred while upserting data." };
  }
};