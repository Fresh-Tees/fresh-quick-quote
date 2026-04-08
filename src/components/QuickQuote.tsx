"use client";

import { useEffect, useState } from "react";
import { getProjectConfiguration } from "@/lib/flow";
import type { ConfiguredProduct } from "@/lib/pricing";
import { ProjectConfigurator, type ProjectConfiguratorData } from "./ProjectConfigurator";
import { getGatewaySessionId, track } from "@/lib/ga4";

function buildDefaultProduct(): ConfiguredProduct | null {
  const config = getProjectConfiguration();
  if (!config) return null;
  const productType = "t_shirts";
  const models = config.garmentModelsByProduct?.[productType] ?? [];
  const garmentModel = models[0]?.value ?? "staple";
  return {
    productType,
    garmentModel,
    garmentColour: "white",
    quantity: 100,
    placements: [{ location: "front", printType: "screen", colourCount: 1 }],
    finishes: [],
  };
}

function getInitialProjectData(): ProjectConfiguratorData {
  const p = buildDefaultProduct();
  return {
    purpose: "",
    artworkStatus: undefined,
    products: p ? [p] : [],
    dueDate: "",
    rushFlag: false,
    summary: null,
  };
}

export function QuickQuote() {
  const sessionId = getGatewaySessionId();
  const [projectData, setProjectData] = useState<ProjectConfiguratorData>(getInitialProjectData);

  useEffect(() => {
    track("quick_quote_viewed", { session_id: sessionId });
  }, [sessionId]);

  return (
    <div className="w-full max-w-none lg:max-w-5xl xl:max-w-6xl mx-auto space-y-6">
      <header className="space-y-2">
        <h1 className="font-display font-bold text-2xl md:text-3xl text-off-black">Quick quote</h1>
        <p className="font-body text-off-black/80 text-sm md:text-base max-w-3xl">
          Configure your product and see an indicative estimate straight away. Add products, placements, and finishes
          below—then submit when you&apos;re ready.
        </p>
      </header>

      <ProjectConfigurator value={projectData} onChange={setProjectData} />
    </div>
  );
}
