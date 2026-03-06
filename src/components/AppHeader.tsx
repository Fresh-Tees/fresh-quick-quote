"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import {
  BRAND_BY_ID,
  DEFAULT_BRAND_ID,
  getStoredBrandId,
  setStoredBrandId,
  type BrandId,
} from "@/lib/brands";

export function AppHeader() {
  const [brandId, setBrandId] = useState<BrandId>(DEFAULT_BRAND_ID);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const stored = getStoredBrandId();
    if (stored) setBrandId(stored);
    setMounted(true);
  }, []);

  const setBrand = (id: BrandId) => {
    setBrandId(id);
    setStoredBrandId(id);
  };

  const brand = BRAND_BY_ID[brandId];

  return (
    <header className="border-b border-off-black/10 bg-off-black">
      <div className="max-w-xl mx-auto px-6 py-6 flex items-center justify-between gap-4">
        <a href="/" className="inline-block shrink-0">
          {brand.logoUrl ? (
            <Image
              src={brand.logoUrl}
              alt={brand.name}
              width={120}
              height={36}
              className="h-9 w-auto object-contain"
              priority
            />
          ) : (
            <RockItLogo accentColor={brand.accentColor} poweredBy={brand.poweredBy} />
          )}
        </a>

        {mounted && (
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs text-white/60 font-body">Brand:</span>
            <div className="flex rounded-md overflow-hidden border border-white/20">
              {(["fresh", "rockit"] as const).map((id) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setBrand(id)}
                  className={`px-2.5 py-1.5 text-xs font-body transition-colors ${
                    brandId === id
                      ? "bg-white text-off-black"
                      : "bg-white/10 text-white hover:bg-white/20"
                  }`}
                >
                  {id === "fresh" ? "FRESH" : "Rock It"}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}

/** Rock It Merch text logo (inverted for dark header): ROCK IT outline, MERCH on teal bar, POWERED BY FRESH. */
function RockItLogo({
  accentColor,
  poweredBy,
}: {
  accentColor: string;
  poweredBy?: string;
}) {
  return (
    <div className="flex flex-col gap-0.5">
      <div className="flex flex-col leading-none">
        <span
          className="font-bold text-lg tracking-tight text-white border-2 border-white px-1.5 pb-0.5"
          style={{ fontFamily: "system-ui, sans-serif" }}
        >
          ROCK IT
        </span>
        <span
          className="font-bold text-lg tracking-tight text-white px-1.5 py-0.5"
          style={{ backgroundColor: accentColor, fontFamily: "system-ui, sans-serif" }}
        >
          MERCH
        </span>
      </div>
      {poweredBy && (
        <p className="text-[10px] leading-tight text-white/90" style={{ fontFamily: "system-ui, sans-serif" }}>
          POWERED BY{" "}
          <span className="font-semibold" style={{ color: accentColor }}>
            {poweredBy}
          </span>
        </p>
      )}
    </div>
  );
}
