const OPENFDA_BASE = "https://api.fda.gov/drug/label.json";

const RELEVANT_FIELDS = [
  "warnings_and_cautions",
  "warnings",
  "contraindications",
  "drug_interactions",
];

interface DrugLabelResult {
  drugName: string;
  warnings?: string;
  contraindications?: string;
  drugInteractions?: string;
}

class OpenFDAService {
  async getDrugWarnings(medicationName: string): Promise<DrugLabelResult | null> {
    try {
      const encoded = encodeURIComponent(`"${medicationName}"`);
      const url = `${OPENFDA_BASE}?search=openfda.generic_name:${encoded}&limit=1`;

      const response = await fetch(url, { signal: AbortSignal.timeout(4000) });

      if (!response.ok) return null;

      const data = (await response.json()) as { results?: Record<string, string[]>[] };

      if (!data.results?.length) return null;

      const label = data.results[0];

      return {
        drugName: medicationName,
        warnings: this.extractField(label, ["warnings_and_cautions", "warnings"]),
        contraindications: this.extractField(label, ["contraindications"]),
        drugInteractions: this.extractField(label, ["drug_interactions"]),
      };
    } catch {
      return null;
    }
  }

  async getMedicationsContext(medicationNames: string[]): Promise<string> {
    if (medicationNames.length === 0) return "";

    const results = await Promise.all(
      medicationNames.slice(0, 5).map((name) => this.getDrugWarnings(name))
    );

    const valid = results.filter((r): r is DrugLabelResult => r !== null);
    if (valid.length === 0) return "";

    const lines: string[] = ["ALERTAS FDA PARA MEDICAMENTOS ACTUALES DEL USUARIO:"];

    for (const drug of valid) {
      lines.push(`\n${drug.drugName.toUpperCase()}:`);
      if (drug.contraindications) {
        lines.push(`  Contraindicaciones: ${this.truncate(drug.contraindications, 150)}`);
      }
      if (drug.warnings) {
        lines.push(`  Advertencias: ${this.truncate(drug.warnings, 150)}`);
      }
      if (drug.drugInteractions) {
        lines.push(`  Interacciones: ${this.truncate(drug.drugInteractions, 150)}`);
      }
    }

    return lines.join("\n");
  }

  private extractField(label: Record<string, string[]>, keys: string[]): string | undefined {
    for (const key of keys) {
      if (label[key]?.length) {
        return label[key][0];
      }
    }
    return undefined;
  }

  private truncate(text: string, maxLen: number): string {
    return text.length > maxLen ? text.slice(0, maxLen) + "..." : text;
  }
}

export const openFDAService = new OpenFDAService();
