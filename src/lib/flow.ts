import flowConfig from "@/config/flow.json";

export type FlowConfig = typeof flowConfig;
export type Answers = Record<string, string>;

const smallQuantityValues = ["less-than-25"];

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

/** Returns the max quantity for the wizard quantity selection (used for indicative pricing at top of range). */
export function getQuantityRangeMax(quantityValue: string | undefined): number | null {
  if (!quantityValue) return null;
  const rangeMap = (flowConfig as Record<string, unknown>).quantityRangeMap as Record<string, { min: number; max: number | null }> | undefined;
  if (!rangeMap) return null;
  const range = rangeMap[quantityValue];
  if (!range || range.max == null) return null;
  return range.max;
}

/** Returns the min quantity for the wizard quantity selection (e.g. for display "X – Y units"). */
export function getQuantityRangeMin(quantityValue: string | undefined): number | null {
  if (!quantityValue) return null;
  const rangeMap = (flowConfig as Record<string, unknown>).quantityRangeMap as Record<string, { min: number; max: number | null }> | undefined;
  if (!rangeMap) return null;
  const range = rangeMap[quantityValue];
  if (!range) return null;
  return range.min;
}

/** Indicative price per unit at the *top* of the selected quantity range. Returns null if small order or no tier. */
export function getIndicativePricePerUnit(answers: Answers): number | null {
  const q = answers.quantity;
  if (!q) return null;
  const maxQty = getQuantityRangeMax(q);
  if (maxQty == null) return null;
  const tiers = (flowConfig as Record<string, unknown>).screenPrintPricing as { tiers: { min: number; max: number | null; pricePerUnit: number }[] } | undefined;
  if (!tiers?.tiers) return null;
  const tier = tiers.tiers.find(
    (t) => t.min <= maxQty && (t.max === null || t.max >= maxQty)
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
  garmentColourOptions?: { value: string; label: string; pricingTier?: "white" | "coloured" }[];
  garmentColourOptionsByModel?: Record<string, Record<string, { value: string; label: string; pricingTier: "white" | "coloured"; swatchImageUrl?: string }[]>>;
  garmentModelsByProduct?: Record<string, { value: string; label: string }[]>;
  placementOptions?: { value: string; label: string }[];
  placementPrintTypes?: { value: string; label: string }[];
  screenPrintMinQty?: number;
  screenPrintMinQtyMessage?: string;
  screenPrintMaxColours?: number;
  embroideryMinQty?: number;
  embroideryEstimateNote?: string;
  embroideryPricePerUnit?: number;
  embroideryIncludedColours?: number;
  embroideryAdditionalColourPerUnit?: number;
  embroideryCapSurchargePerUnit?: number;
  embroiderySetupFee?: number;
  garmentCostByProduct: Record<string, number>;
  setupCostPerScreen: number;
  finishOptions: { value: string; label: string; costPerUnit: number; flatCost?: number; flagForReview?: boolean; treatAsScreenPlacement?: boolean }[];
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

/** Resolves "white" or "coloured" for pricing from product type, model, and selected colour value. */
export function getGarmentColourPricingTier(
  productType: string,
  garmentModel: string,
  colourValue: string
): "white" | "coloured" {
  const pc = (flowConfig as Record<string, unknown>).projectConfiguration as {
    garmentColourOptionsByModel?: Record<string, Record<string, { value: string; pricingTier: "white" | "coloured" }[]>>;
    garmentColourOptions?: { value: string; pricingTier?: "white" | "coloured" }[];
  } | undefined;
  const byModel = pc?.garmentColourOptionsByModel?.[productType]?.[garmentModel];
  if (byModel) {
    const opt = byModel.find((o) => o.value === colourValue);
    if (opt?.pricingTier) return opt.pricingTier;
  }
  const globalOpt = pc?.garmentColourOptions?.find((o) => o.value === colourValue);
  if (globalOpt?.pricingTier) return globalOpt.pricingTier;
  if (colourValue === "other") return "coloured";
  return colourValue === "coloured" ? "coloured" : "white";
}

/** Restricted colour options (Black, White, Other) with no swatches, for use in configurator. */
export function getRestrictedColourOptions(): { value: string; label: string; pricingTier: "white" | "coloured" }[] {
  return [
    { value: "black", label: "Black", pricingTier: "coloured" },
    { value: "white", label: "White", pricingTier: "white" },
    { value: "other", label: "Other", pricingTier: "coloured" },
  ];
}

/** Returns colour options for a product type + model, or global options. */
export function getGarmentColourOptionsForProduct(
  productType: string,
  garmentModel: string
): { value: string; label: string; pricingTier?: "white" | "coloured"; swatchImageUrl?: string }[] {
  const config = getProjectConfiguration();
  if (!config) return [];
  const byModel = (config as { garmentColourOptionsByModel?: Record<string, Record<string, { value: string; label: string; pricingTier: "white" | "coloured"; swatchImageUrl?: string }[]>> }).garmentColourOptionsByModel?.[productType]?.[garmentModel];
  if (byModel?.length) return byModel;
  return (config.garmentColourOptions ?? []).map((o) => ({ ...o, pricingTier: o.pricingTier ?? ("value" in o && o.value === "coloured" ? "coloured" : "white") }));
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
