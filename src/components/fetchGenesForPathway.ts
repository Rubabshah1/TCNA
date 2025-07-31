export const fetchGenesForPathway = async (
  pathwayId: string,
  source: "reactome" | "kegg" | "go" | "all"
): Promise<string[]> => {
  const reactomeBase = "https://reactome.org/ContentService/data/pathway";
  const keggBase = "https://rest.kegg.jp";
  const goBase = "https://www.ebi.ac.uk/ols/api/ontologies/go";

  const genesSet = new Set<string>();

  // ---------------- REACTOME ----------------
  const fetchReactomeGenes = async () => {
    const res = await fetch(`${reactomeBase}/${pathwayId}/participants`);
    const data = await res.json();

    for (const item of data) {
      if (
        item.schemaClass === "EntityWithAccessionedSequence" &&
        item.referenceEntity?.geneName
      ) {
        item.referenceEntity.geneName.forEach((g: string) => genesSet.add(g));
      }
    }
  };

  // ---------------- KEGG ----------------
  const fetchKEGGGenes = async () => {
    // KEGG pathway IDs are like "hsa04110"
    const res = await fetch(`${keggBase}/link/genes/${pathwayId}`);
    const text = await res.text();

    // Format: path:hsa04110\thsa:1234
    text.split("\n").forEach((line) => {
      const [, geneEntry] = line.split("\t");
      if (geneEntry) {
        const geneId = geneEntry.split(":")[1];
        if (geneId) genesSet.add(geneId);
      }
    });
  };

  // ---------------- GO ----------------
  const fetchGOGenes = async () => {
    // Example: GO:0006915 (apoptosis)
    const res = await fetch(`${goBase}/terms?obo_id=${pathwayId}`);
    const data = await res.json();

    if (data._embedded?.terms?.[0]?._links?.self?.href) {
      const href = data._embedded.terms[0]._links.self.href;
      const geneRes = await fetch(`${href}/annotations`);
      const geneData = await geneRes.json();

      geneData._embedded?.annotations?.forEach((ann: any) => {
        const geneSymbol = ann?.annotated_entity?.label;
        if (geneSymbol) genesSet.add(geneSymbol);
      });
    }
  };

  // Run selected source(s)
  try {
    if (source === "all" || source === "reactome") await fetchReactomeGenes();
    if (source === "all" || source === "kegg") await fetchKEGGGenes();
    if (source === "all" || source === "go") await fetchGOGenes();
  } catch (error) {
    console.error("Error fetching genes:", error);
  }

  return Array.from(genesSet);
};
