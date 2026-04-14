import { getFlowConfig, getGarmentColourPricingTier } from "./flow";

export type PlacementConfig = {
  location: string;
  printType: "screen" | "embroidery" | "dtf" | "unsure";
  colourCount?: number;
  /** Public URL of uploaded artwork for this placement. */
  artworkUrl?: string;
};

export type ConfiguredProduct = {
  productType: string;
  garmentModel: string;
  garmentColour: string;
  quantity: number;
  placements: PlacementConfig[];
  finishes: string[];
  dueDate?: string;
  rushFlag?: boolean;
  /** Public URL of uploaded artwork image (for mockup preview). */
  artworkUrl?: string;
};

export type ProductCalculation = {
  productType: string;
  quantity: number;
  garmentTotal: number;
  screenPrintTotal: number;
  embroideryTotal: number;
  dtfTotal: number;
  finishTotal: number;
  setupTotal: number;
  productTotal: number;
  effectiveUnitCost: number;
  placementBreakdown: { location: string; printType: string; amount: number }[];
  setupBreakdown: string;
  finishBreakdown: { finish: string; amount: number }[];
  bundleDiscountApplied: boolean;
};

export type ProjectSummary = {
  totalProducts: number;
  totalUnits: number;
  estimatedProjectTotal: number;
  productCalculations: ProductCalculation[];
};

function getProjectConfig() {
  const config = getFlowConfig() as Record<string, unknown>;
  return config.projectConfiguration as {
    garmentCostByProduct: Record<string, number>;
    garmentCostByModel?: Record<string, Record<string, number>>;
    screenPrintTiers: { min: number; max: number | null; "1colour": number; "2colour": number; "3colour": number }[];
    screenPrintTiersColoured?: { min: number; max: number | null; "1colour": number; "2colour": number; "3colour": number }[];
    embroideryPricePerUnit?: number;
    embroideryIncludedColours?: number;
    embroideryAdditionalColourPerUnit?: number;
    embroideryCapSurchargePerUnit?: number;
    embroiderySetupFee?: number;
    setupCostPerScreen: number;
    finishOptions: { value: string; costPerUnit: number; flatCost?: number; treatAsScreenPlacement?: boolean; flagForReview?: boolean }[];
    bundleDiscountPercent: number;
  } | undefined;
}

export function getScreenPrintPricePerUnit(
  quantity: number,
  colourCount: number,
  garmentColourTier: "white" | "coloured"
): number {
  const cfg = getProjectConfig();
  const tiers =
    garmentColourTier === "coloured" && cfg?.screenPrintTiersColoured
      ? cfg.screenPrintTiersColoured
      : cfg?.screenPrintTiers;

  if (!tiers) return 0;

  const tier = tiers.find(
    (t) => t.min <= quantity && (t.max === null || t.max >= quantity)
  );

  if (!tier) return 0;

  const baseKey =
    colourCount <= 1
      ? "1colour"
      : colourCount === 2
      ? "2colour"
      : "3colour";

  const basePrice = tier[baseKey as "1colour" | "2colour" | "3colour"] ?? tier["1colour"];

  const extraColours = Math.max(0, colourCount - 3);
  const extraChargePerColour = 0.5;
  const extraCharge = extraColours * extraChargePerColour;

  return basePrice + extraCharge;
}

export function getDtfReferenceSize(location: string): string {
  if (location === "front") return "10cm x 10cm";
  if (location === "back") return "A3";
  if (location === "left_sleeve" || location === "right_sleeve") return "6cm x 6cm";
  return "10cm x 10cm";
}

type DtfSizeKey = "6cm x 6cm" | "10cm x 10cm" | "Approx A5" | "Approx A4" | "A3";

const DTF_PRICING_TABLE: Record<DtfSizeKey, { min: number; max: number | null; price: number }[]> = {
  "6cm x 6cm": [
    { min: 1, max: 4, price: 14.5 },
    { min: 5, max: 9, price: 12.5 },
    { min: 10, max: 19, price: 6.0 },
    { min: 20, max: 49, price: 4.0 },
    { min: 50, max: 99, price: 3.25 },
    { min: 100, max: 249, price: 3.0 },
    { min: 250, max: 499, price: 2.75 },
    { min: 500, max: 749, price: 2.5 },
    { min: 750, max: null, price: 2.45 },
  ],
  "10cm x 10cm": [
    { min: 1, max: 4, price: 16.5 },
    { min: 5, max: 9, price: 14.5 },
    { min: 10, max: 19, price: 7.0 },
    { min: 20, max: 49, price: 4.75 },
    { min: 50, max: 99, price: 4.0 },
    { min: 100, max: 249, price: 3.5 },
    { min: 250, max: 499, price: 3.25 },
    { min: 500, max: 749, price: 3.0 },
    { min: 750, max: null, price: 3.0 },
  ],
  "Approx A5": [
    { min: 1, max: 4, price: 18.5 },
    { min: 5, max: 9, price: 16.5 },
    { min: 10, max: 19, price: 9.0 },
    { min: 20, max: 49, price: 6.0 },
    { min: 50, max: 99, price: 5.25 },
    { min: 100, max: 249, price: 4.25 },
    { min: 250, max: 499, price: 3.75 },
    { min: 500, max: 749, price: 3.5 },
    { min: 750, max: null, price: 3.4 },
  ],
  "Approx A4": [
    { min: 1, max: 4, price: 20.5 },
    { min: 5, max: 9, price: 18.5 },
    { min: 10, max: 19, price: 11.5 },
    { min: 20, max: 49, price: 7.5 },
    { min: 50, max: 99, price: 6.5 },
    { min: 100, max: 249, price: 5.0 },
    { min: 250, max: 499, price: 4.5 },
    { min: 500, max: 749, price: 4.25 },
    { min: 750, max: null, price: 4.0 },
  ],
  A3: [
    { min: 1, max: 4, price: 26.5 },
    { min: 5, max: 9, price: 20.5 },
    { min: 10, max: 19, price: 17.0 },
    { min: 20, max: 49, price: 10.75 },
    { min: 50, max: 99, price: 9.25 },
    { min: 100, max: 249, price: 7.0 },
    { min: 250, max: 499, price: 6.25 },
    { min: 500, max: 749, price: 6.0 },
    { min: 750, max: null, price: 5.9 },
  ],
};

export function getDtfPricePerUnit(quantity: number, size: DtfSizeKey): number {
  const tier = DTF_PRICING_TABLE[size].find((t) => t.min <= quantity && (t.max === null || t.max >= quantity));
  return tier?.price ?? DTF_PRICING_TABLE[size][0].price;
}

export function getEmbroideryPricePerUnit(
  colourCount: number,
  productType: string
): number {
  const cfg = getProjectConfig();
  const base = cfg?.embroideryPricePerUnit ?? 8.97;
  const included = cfg?.embroideryIncludedColours ?? 4;
  const extraPerColour = cfg?.embroideryAdditionalColourPerUnit ?? 0.3;
  const capSurcharge = productType === "hats" ? (cfg?.embroideryCapSurchargePerUnit ?? 0.5) : 0;
  const extraColours = Math.max(0, colourCount - included);
  return base + extraColours * extraPerColour + capSurcharge;
}

export function getGarmentCostPerUnit(productType: string, garmentModel?: string): number {
  const cfg = getProjectConfig();
  if (garmentModel && cfg?.garmentCostByModel?.[productType]?.[garmentModel] !== undefined) {
    const modelCost = cfg.garmentCostByModel[productType][garmentModel];
    return modelCost;
  }
  return cfg?.garmentCostByProduct?.[productType] ?? 10;
}

export function getSetupCostPerScreen(): number {
  const cfg = getProjectConfig();
  return cfg?.setupCostPerScreen ?? 60;
}

export function getFinishCostPerUnit(finishValue: string): number {
  const cfg = getProjectConfig();
  const opt = cfg?.finishOptions?.find((o) => o.value === finishValue);
  return opt?.costPerUnit ?? 0;
}

export function getFinishFlatCost(finishValue: string): number {
  const cfg = getProjectConfig();
  const opt = cfg?.finishOptions?.find((o) => o.value === finishValue);
  return opt?.flatCost ?? 0;
}

export function getBundleDiscountPercent(): number {
  const cfg = getProjectConfig();
  return cfg?.bundleDiscountPercent ?? 0;
}

/** Screen setup count = sum over screen placements of colourCount (or 1) each. */
function getScreenSetupCount(product: ConfiguredProduct): number {
  return product.placements
    .filter((p) => p.printType === "screen")
    .reduce((sum, p) => sum + (p.colourCount ?? 1), 0);
}

function getEmbroiderySetupCount(product: ConfiguredProduct): number {
  return product.placements.filter((p) => p.printType === "embroidery").length;
}

export function calculateProduct(
  product: ConfiguredProduct,
  isSecondaryForBundle: boolean
): ProductCalculation {
  const cfg = getProjectConfig();
  const garmentCost = getGarmentCostPerUnit(product.productType, product.garmentModel);
  const quantity = product.quantity;
  const garmentTotal = garmentCost * quantity;

  const placementBreakdown: { location: string; printType: string; amount: number }[] = [];
  let screenPrintTotal = 0;
  let embroideryTotal = 0;
  let dtfTotal = 0;

  const garmentColourTier = getGarmentColourPricingTier(product.productType, product.garmentModel, product.garmentColour);
  for (const p of product.placements) {
    if (p.printType === "screen") {
      const costPerUnit = getScreenPrintPricePerUnit(
        quantity,
        p.colourCount ?? 1,
        garmentColourTier
      );
      const amount = costPerUnit * quantity;
      screenPrintTotal += amount;
      placementBreakdown.push({ location: p.location, printType: "Screen Print", amount });
    } else if (p.printType === "embroidery") {
      const costPerUnit = getEmbroideryPricePerUnit(p.colourCount ?? 4, product.productType);
      const amount = costPerUnit * quantity;
      embroideryTotal += amount;
      placementBreakdown.push({ location: p.location, printType: "Embroidery", amount });
    } else if (p.printType === "dtf") {
      const dtfSize = getDtfReferenceSize(p.location) as DtfSizeKey;
      const costPerUnit = getDtfPricePerUnit(quantity, dtfSize);
      const amount = costPerUnit * quantity;
      dtfTotal += amount;
      placementBreakdown.push({
        location: p.location,
        printType: `DTF (${dtfSize})`,
        amount,
      });
    } else if (p.printType === "unsure") {
      const dtfSize = getDtfReferenceSize(p.location) as DtfSizeKey;
      const costPerUnit = getDtfPricePerUnit(quantity, dtfSize);
      const amount = costPerUnit * quantity;
      dtfTotal += amount;
      placementBreakdown.push({
        location: p.location,
        printType: `Unsure (priced as DTF ${dtfSize})`,
        amount,
      });
    } else {
      placementBreakdown.push({ location: p.location, printType: "Unsure (manual review)", amount: 0 });
    }
  }

  const bundleDiscountApplied = isSecondaryForBundle && (cfg?.bundleDiscountPercent ?? 0) > 0;
  if (bundleDiscountApplied) {
    const discount = 1 - (cfg!.bundleDiscountPercent ?? 0);
    screenPrintTotal = screenPrintTotal * discount;
    embroideryTotal = embroideryTotal * discount;
    dtfTotal = dtfTotal * discount;
    for (const pb of placementBreakdown) {
      if (pb.printType === "Screen Print" || pb.printType === "Embroidery" || pb.printType === "DTF") pb.amount *= discount;
    }
  }

  const screenSetupCount = getScreenSetupCount(product);
  const embroiderySetupCount = getEmbroiderySetupCount(product);
  const embroiderySetupFee = cfg?.embroiderySetupFee ?? 60;
  const setupTotal = screenSetupCount * getSetupCostPerScreen() + embroiderySetupCount * embroiderySetupFee;
  const setupBreakdown =
    screenSetupCount > 0 || embroiderySetupCount > 0
      ? `${screenSetupCount > 0 ? `${screenSetupCount} screen(s) × $${getSetupCostPerScreen()}` : ""}${
          screenSetupCount > 0 && embroiderySetupCount > 0 ? " + " : ""
        }${embroiderySetupCount > 0 ? `${embroiderySetupCount} embroidery logo(s) × $${embroiderySetupFee}` : ""}`
      : "—";

  const finishBreakdown: { finish: string; amount: number }[] = [];
  let finishTotal = 0;
  for (const f of product.finishes) {
    const costPerUnit = getFinishCostPerUnit(f);
    const flatCost = getFinishFlatCost(f);
    if (flatCost > 0) {
      finishTotal += flatCost;
      finishBreakdown.push({ finish: f, amount: flatCost });
    }
    if (costPerUnit > 0) {
      const amount = costPerUnit * quantity;
      finishTotal += amount;
      finishBreakdown.push({ finish: f, amount });
    }
  }

  const productTotal =
    garmentTotal + screenPrintTotal + embroideryTotal + dtfTotal + setupTotal + finishTotal;
  const effectiveUnitCost = quantity > 0 ? productTotal / quantity : 0;

  return {
    productType: product.productType,
    quantity,
    garmentTotal,
    screenPrintTotal,
    embroideryTotal,
    dtfTotal,
    finishTotal,
    setupTotal,
    productTotal,
    effectiveUnitCost,
    placementBreakdown,
    setupBreakdown,
    finishBreakdown,
    bundleDiscountApplied,
  };
}

/** Primary product (highest qty) gets no bundle discount; rest get discount. Return calculations in same order as products. */
export function calculateProjectSummary(products: ConfiguredProduct[]): ProjectSummary {
  const maxQty = Math.max(...products.map((p) => p.quantity), 0);
  const calculations = products.map((p) => calculateProduct(p, p.quantity < maxQty));
  const estimatedProjectTotal = calculations.reduce((sum, c) => sum + c.productTotal, 0);
  const totalUnits = calculations.reduce((sum, c) => sum + c.quantity, 0);
  return {
    totalProducts: products.length,
    totalUnits,
    estimatedProjectTotal,
    productCalculations: calculations,
  };
}

export function getVolumeIncentiveMessage(totalUnits: number): { high: string; low: string } | null {
  const config = getFlowConfig() as Record<string, unknown>;
  const pc = config?.projectConfiguration as { volumeIncentiveHigh?: string; volumeIncentiveLow?: string } | undefined;
  if (!pc) return null;
  return {
    high: pc.volumeIncentiveHigh ?? "You are in a high-efficiency production tier.",
    low: pc.volumeIncentiveLow ?? "Increasing to 250+ units reduces your effective cost per garment.",
  };
}
