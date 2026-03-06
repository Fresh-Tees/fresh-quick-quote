/**
 * Brand config: logo, name, and colours.
 * Rock It colours from logo: black, teal bar, white text on teal.
 */

export type BrandId = "fresh" | "rockit";

export type Brand = {
  id: BrandId;
  name: string;
  /** Logo image URL (public path). Omit to use custom markup (e.g. Rock It text logo). */
  logoUrl?: string;
  /** Accent colour (e.g. teal for Rock It). */
  accentColor: string;
  /** Optional "Powered by" line shown under main logo/name. */
  poweredBy?: string;
};

/** FRESH. – default branding. */
export const BRAND_FRESH: Brand = {
  id: "fresh",
  name: "FRESH.",
  logoUrl: "/fresh-logo.png",
  accentColor: "#F26E25", // burnt-orange
};

/** Rock It Merch – teal/black/white from logo. */
export const BRAND_ROCKIT: Brand = {
  id: "rockit",
  name: "ROCK IT MERCH",
  accentColor: "#10A89E", // teal from Rock It logo
  poweredBy: "FRESH.",
};

export const BRANDS: Brand[] = [BRAND_FRESH, BRAND_ROCKIT];

export const BRAND_BY_ID: Record<BrandId, Brand> = {
  fresh: BRAND_FRESH,
  rockit: BRAND_ROCKIT,
};

export const DEFAULT_BRAND_ID: BrandId = "fresh";

const STORAGE_KEY = "freshtees-gateway-brand";

export function getStoredBrandId(): BrandId | null {
  if (typeof window === "undefined") return null;
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    if (v === "fresh" || v === "rockit") return v;
    return null;
  } catch {
    return null;
  }
}

export function setStoredBrandId(id: BrandId): void {
  try {
    localStorage.setItem(STORAGE_KEY, id);
  } catch {}
}
