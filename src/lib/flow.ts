import flowConfig from "@/config/flow.json";

export type FlowConfig = typeof flowConfig;
export type Answers = Record<string, string>;

const smallQuantityValues = ["1-24"];

export function isSmallOrder(answers: Answers): boolean {
  const q = answers.quantity;
  if (!q) return false;
  return smallQuantityValues.includes(q);
}

export function isBulkOrder(answers: Answers): boolean {
  const q = answers.quantity;
  if (!q) return false;
  if (q === "unsure") return true;
  return !smallQuantityValues.includes(q);
}

export function isBulkQualified(answers: Answers): boolean {
  const rules = flowConfig.bulkQualifiedRules as Record<string, string[]>;
  if (!rules) return true;

  for (const [key, allowed] of Object.entries(rules)) {
    const value = answers[key];
    if (!value || !allowed.includes(value)) return false;
  }
  return true;
}

export function getEducationGaps(answers: Answers): string[] {
  const rules = flowConfig.bulkQualifiedRules as Record<string, string[]>;
  if (!rules) return [];
  const gaps: string[] = [];
  for (const [key, allowed] of Object.entries(rules)) {
    const value = answers[key];
    if (!value || !allowed.includes(value)) {
      gaps.push(key);
    }
  }
  return gaps;
}

export function getDesignToolUrl(): string {
  return flowConfig.designToolUrl;
}

export function getCalendlyUrl(): string {
  return flowConfig.calendlyUrl;
}

export function getPrivacyPolicyUrl(): string {
  return flowConfig.privacyPolicyUrl;
}

export function getFlowConfig(): FlowConfig {
  return flowConfig;
}

/** Indicative price per unit for bulk (50+), baseline 1 colour white garments. Returns null if quantity not in a quoted range. */
export function getIndicativePricePerUnit(answers: Answers): number | null {
  const q = answers.quantity;
  if (!q || q === "unsure") return null;
  const rangeMap = (flowConfig as Record<string, unknown>).quantityRangeMap as Record<string, { min: number; max: number }> | undefined;
  const tiers = (flowConfig as Record<string, unknown>).screenPrintPricing as { tiers: { min: number; max: number | null; pricePerUnit: number }[] } | undefined;
  if (!rangeMap || !tiers?.tiers) return null;
  const range = rangeMap[q];
  if (!range) return null;
  const tier = tiers.tiers.find(
    (t) => t.min <= range.min && (t.max === null || t.max >= range.max)
  );
  return tier ? tier.pricePerUnit : null;
}

export function getWorkflowGateMessage(): string {
  const gate = (flowConfig as Record<string, unknown>).workflowGate as { smallOrderMessage?: string } | undefined;
  return gate?.smallOrderMessage ?? "Orders under 50 units per product must be placed via our website.";
}

export function getProductionTimeline(): {
  standard: string;
  rushOptions: { label: string; surcharge: string }[];
  rushNote: string;
} | null {
  const t = (flowConfig as Record<string, unknown>).productionTimeline as {
    standard: string;
    rushOptions: { label: string; surcharge: string }[];
    rushNote: string;
  } | undefined;
  return t ?? null;
}

export function getQuoteProcessSteps(): string[] {
  const steps = (flowConfig as Record<string, unknown>).quoteProcessSteps as string[] | undefined;
  return steps ?? [];
}

export function getScreenPrintPricingBaseline(): string | null {
  const sp = (flowConfig as Record<string, unknown>).screenPrintPricing as { baseline?: string } | undefined;
  return sp?.baseline ?? null;
}

export type IndicativePackage = {
  packageName: string;
  garment: string;
  print: string;
  printSize: string;
  finish?: string;
  exampleQty: number;
  lineItems: { label: string; value: number }[];
  totalProjectCost: number;
  effectiveCostPerUnit: number;
  volumeNudge: string;
};

export type IndicativePackagePricing = {
  displayContext: string;
  disclaimer: string;
  minimumNote: string;
  volumeScalingNote: string;
  positioningStatement: string;
  packages: IndicativePackage[];
};

export function getIndicativePackagePricing(): IndicativePackagePricing | null {
  const data = (flowConfig as Record<string, unknown>).indicativePackagePricing as IndicativePackagePricing | undefined;
  return data ?? null;
}

export type ProjectConfiguration = {
  purposeQuestion: string;
  purposeSingleSelect?: boolean;
  purposeOptions: { value: string; label: string }[];
  multiEventPurposeValues: string[];
  productTypes: { value: string; label: string }[];
  garmentColourOptions?: { value: string; label: string }[];
  garmentModelsByProduct?: Record<string, { value: string; label: string }[]>;
  placementOptions?: { value: string; label: string }[];
  placementPrintTypes?: { value: string; label: string }[];
  screenPrintMinQty?: number;
  screenPrintMinQtyMessage?: string;
  screenPrintMaxColours?: number;
  embroideryMinQty?: number;
  garmentCostByProduct: Record<string, number>;
  setupCostPerScreen: number;
  finishOptions: { value: string; label: string; costPerUnit: number; flagForReview?: boolean; treatAsScreenPlacement?: boolean }[];
  rushOptions?: { label: string; surchargePercent: number }[];
  businessDaysForRushThreshold?: number;
  bundleMessage: string;
  volumeIncentiveHigh: string;
  volumeIncentiveLow: string;
  projectSummaryNote: string;
};

export function getProjectConfiguration(): ProjectConfiguration | null {
  const data = (flowConfig as Record<string, unknown>).projectConfiguration as ProjectConfiguration | undefined;
  return data ?? null;
}

export type PricingAnchor = {
  garmentLabel: string;
  printLabel: string;
  quantity: number;
  garmentCost: number;
  printCost: number;
  setupSpreadPerUnit: number;
  displayLine: string;
  note: string;
};

export function getPricingAnchor(): PricingAnchor | null {
  const pc = (flowConfig as Record<string, unknown>).projectConfiguration as { pricingAnchor?: PricingAnchor } | undefined;
  return pc?.pricingAnchor ?? null;
}

export function getWizardPurposeToProjectPurpose(): Record<string, string> {
  const pc = (flowConfig as Record<string, unknown>).projectConfiguration as { wizardPurposeToProjectPurpose?: Record<string, string> } | undefined;
  return pc?.wizardPurposeToProjectPurpose ?? {};
}

/** Map wizard garment question value → configurator product type. "unsure" is omitted from prefill. */
const WIZARD_GARMENT_TO_PRODUCT_TYPE: Record<string, string> = {
  tees: "t_shirts",
  sweats: "hoodies",
  hats: "hats",
  corporate: "corporate_wear",
  work_wear: "work_wear",
  totes: "tote_bags",
  other: "other_merch",
};

/**
 * Parses answers.garments (comma-separated) and returns configurator product types.
 * Skips "unsure"; dedupes so each product type appears once.
 */
export function getGarmentSelectionsAsProductTypes(garmentsStr: string | undefined): string[] {
  if (!garmentsStr || typeof garmentsStr !== "string") return [];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const v of garmentsStr.split(",").map((s) => s.trim()).filter(Boolean)) {
    if (v === "unsure") continue;
    const productType = WIZARD_GARMENT_TO_PRODUCT_TYPE[v];
    if (productType && !seen.has(productType)) {
      seen.add(productType);
      out.push(productType);
    }
  }
  return out;
}
