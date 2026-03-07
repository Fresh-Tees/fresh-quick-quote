import { getFlowConfig, getGarmentColourPricingTier } from "./flow";

export type PlacementConfig = {
  location: string;
  printType: "screen" | "embroidery" | "dtf" | "unsure";
  colourCount?: number;
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
    setupCostPerScreen: number;
    finishOptions: { value: string; costPerUnit: number; treatAsScreenPlacement?: boolean; flagForReview?: boolean }[];
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

export function getDtfPricePerUnit(quantity: number): number {
  if (quantity >= 250) return 4.0;
  if (quantity >= 100) return 4.5;
  if (quantity >= 50) return 5.0;
  return 6.0;
}

export function getEmbroideryPricePerUnit(): number {
  const cfg = getProjectConfig();
  return cfg?.embroideryPricePerUnit ?? 8;
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
      const costPerUnit = getEmbroideryPricePerUnit();
      const amount = costPerUnit * quantity;
      embroideryTotal += amount;
      placementBreakdown.push({ location: p.location, printType: "Embroidery", amount });
    } else if (p.printType === "dtf") {
      const costPerUnit = getDtfPricePerUnit(quantity);
      const amount = costPerUnit * quantity;
      dtfTotal += amount;
      placementBreakdown.push({ location: p.location, printType: "DTF", amount });
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
  const setupTotal = screenSetupCount * getSetupCostPerScreen();
  const setupBreakdown =
    screenSetupCount > 0
      ? `${screenSetupCount} screen(s) × $${getSetupCostPerScreen()}`
      : "—";

  const finishBreakdown: { finish: string; amount: number }[] = [];
  let finishTotal = 0;
  for (const f of product.finishes) {
    const costPerUnit = getFinishCostPerUnit(f);
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
