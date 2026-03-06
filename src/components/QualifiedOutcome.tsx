"use client";

import type { Answers } from "@/lib/flow";
import {
  getCalendlyUrl,
  getFlowConfig,
  getGarmentSelectionsAsProductTypes,
  getIndicativePackagePricing,
  getIndicativePricePerUnit,
  getPricingAnchor,
  getProductionTimeline,
  getProjectConfiguration,
  getQuantityRangeMax,
  getQuantityRangeMin,
  getQuoteProcessSteps,
  getWizardPurposeToProjectPurpose,
} from "@/lib/flow";
import type { ConfiguredProduct } from "@/lib/pricing";
import { getGarmentCostPerUnit } from "@/lib/pricing";
import { QuoteForm } from "./QuoteForm";
import { ProjectConfigurator, type ProjectConfiguratorData } from "./ProjectConfigurator";
import { useMemo, useState } from "react";

function formatCurrency(n: number): string {
  return new Intl.NumberFormat("en-AU", { style: "currency", currency: "AUD", minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n);
}

export function QualifiedOutcome({ answers }: { answers: Answers }) {
  const calendlyUrl = getCalendlyUrl();
  const [showQuoteForm, setShowQuoteForm] = useState(false);
  const flowConfig = getFlowConfig();
  const questions = (flowConfig as {
    questions?: { id: string; type?: string; options?: { value: string; label: string }[]; rightColumn?: { options: { value: string; label: string }[] } }[];
  }).questions;
  const purposeQuestion = questions?.find((q) => q.id === "purpose");
  const purposeOptions = purposeQuestion?.type === "project_tell"
    ? purposeQuestion?.rightColumn?.options
    : purposeQuestion?.options;
  const purposeLabelFromWizard = purposeOptions?.find((o) => o.value === answers.purpose)?.label;
  const wizardToProject = getWizardPurposeToProjectPurpose();
  const initialPurpose = answers.purpose ? (wizardToProject[answers.purpose] ?? answers.purpose) : "";

  const initialProducts = useMemo((): ConfiguredProduct[] => {
    const productTypes = getGarmentSelectionsAsProductTypes(answers.garments);
    if (productTypes.length === 0) return [];
    const config = getProjectConfiguration();
    if (!config) return [];
    const modelsByProduct = config.garmentModelsByProduct ?? {};
    const colourOpts = config.garmentColourOptions ?? [];
    const defaultColour = colourOpts[0]?.value ?? "white";
    const defaultQty = getQuantityRangeMax(answers.quantity) ?? 100;
    return productTypes.map((productType) => {
      const models = modelsByProduct[productType] ?? [];
      const garmentModel = models[0]?.value ?? productType;
      return {
        productType,
        garmentModel,
        garmentColour: defaultColour,
        quantity: defaultQty,
        placements: [],
        finishes: [],
      };
    });
  }, [answers.garments, answers.quantity]);

  const [projectData, setProjectData] = useState<ProjectConfiguratorData>({
    purpose: initialPurpose,
    artworkStatus: answers.artwork === "yes" || answers.artwork === "partially" || answers.artwork === "no" ? answers.artwork : undefined,
    products: initialProducts,
    dueDate: "",
    rushFlag: false,
    summary: null,
  });
  const packagePricing = getIndicativePackagePricing();
  const timeline = getProductionTimeline();
  const quoteSteps = getQuoteProcessSteps();
  const pricingAnchor = getPricingAnchor();

  const projectDataForQuote =
    projectData.products.length > 0
      ? {
          project_purpose: projectData.purpose,
          artwork_status: projectData.artworkStatus,
          contact_details: projectData.contactDetails ?? undefined,
          products: projectData.products.map((p, i) => ({
            product_type: p.productType,
            garment_model: p.garmentModel,
            garment_colour: p.garmentColour,
            quantity: p.quantity,
            placements: p.placements.map((pl) => ({
              location: pl.location,
              print_type: pl.printType,
              ...(pl.colourCount != null && { colour_count: pl.colourCount }),
            })),
            finishes: p.finishes,
            due_date: projectData.dueDate || undefined,
            rush_flag: projectData.rushFlag,
            indicative_total: projectData.summary?.productCalculations[i]?.productTotal,
          })),
          indicative_pricing_shown: projectData.summary
            ? {
                estimatedProjectTotal: projectData.summary.estimatedProjectTotal,
                totalUnits: projectData.summary.totalUnits,
                productCalculations: projectData.summary.productCalculations,
              }
            : undefined,
          timestamp: projectData.contactSubmittedAt ?? new Date().toISOString(),
        }
      : null;

  return (
    <div className="max-w-xl mx-auto px-6 py-12 space-y-8">
      <section>
        <h1 className="font-display font-bold text-2xl md:text-3xl text-off-black mb-2">
          You're in the right place for 50+ units
        </h1>
        <p className="font-body text-off-black/80 text-base">
          Let's get you a firm quote. Book a quick call or leave your details below.
        </p>
      </section>

      {(answers.quantity && getIndicativePricePerUnit(answers) != null) || pricingAnchor ? (
        <div className="p-4 rounded-lg border border-off-black/20 bg-off-white/30">
          {answers.quantity && getIndicativePricePerUnit(answers) != null ? (
            (() => {
              const minQ = getQuantityRangeMin(answers.quantity);
              const maxQ = getQuantityRangeMax(answers.quantity);
              const printPerUnit = getIndicativePricePerUnit(answers)!;
              const rangeText = minQ != null && maxQ != null ? `${minQ} – ${maxQ}` : maxQ != null ? `up to ${maxQ}` : "";
              const config = getProjectConfiguration();
              const productLabels = initialProducts
                .map((p) => config?.garmentModelsByProduct?.[p.productType]?.find((m) => m.value === p.garmentModel)?.label ?? p.garmentModel)
                .filter(Boolean);
              const productLabel =
                productLabels.length === 0
                  ? ""
                  : productLabels.length === 1
                    ? productLabels[0]
                    : productLabels.length <= 2
                      ? productLabels.join(" and ")
                      : `${productLabels[0]} (and others)`;
              const firstProduct = initialProducts[0];
              const garmentPerUnit = firstProduct ? getGarmentCostPerUnit(firstProduct.productType, firstProduct.garmentModel) : 0;
              const totalPerUnit = garmentPerUnit + printPerUnit;

              return (
                <>
                  <p className="font-display font-bold text-off-black">
                    For your selection ({rangeText} units), indicative from ${totalPerUnit.toFixed(2)} per unit at {maxQ} units
                    {productLabel ? ` for ${productLabel}.` : "."}
                  </p>
                  <p className="font-body text-xs text-off-black/70 mt-1">
                    Includes garment (${garmentPerUnit.toFixed(2)}/unit) + print (${printPerUnit.toFixed(2)}/unit).
                  </p>
                  <p className="font-body text-xs text-off-black/60 mt-1 italic">Final pricing depends on configuration.</p>
                </>
              );
            })()
          ) : pricingAnchor ? (
            <>
              <p className="font-body text-xs text-off-black/70 mb-1">
                Garment: {pricingAnchor.garmentLabel} · Print: {pricingAnchor.printLabel} · Quantity: {pricingAnchor.quantity} units
              </p>
              <p className="font-body text-xs text-off-black/60 mb-1">
                Garment ${pricingAnchor.garmentCost.toFixed(2)} · Print (tier) ${pricingAnchor.printCost.toFixed(2)} · Setup spread ~${pricingAnchor.setupSpreadPerUnit.toFixed(2)}/unit
              </p>
              <p className="font-display font-bold text-off-black mt-2">{pricingAnchor.displayLine}</p>
              <p className="font-body text-xs text-off-black/60 mt-1 italic">{pricingAnchor.note}</p>
            </>
          ) : null}
        </div>
      ) : null}

      <ProjectConfigurator
        value={projectData}
        onChange={setProjectData}
        initialPurpose={initialPurpose}
        purposeLabel={purposeLabelFromWizard ?? undefined}
      />

      {packagePricing && (
        <div>
          <p className="font-display font-bold text-off-black mb-2">Indicative project breakdowns</p>
          <p className="font-body text-sm text-off-black/80 mb-1">{packagePricing.displayContext}</p>
          <p className="font-body text-sm text-off-black/80 mb-1">{packagePricing.disclaimer}</p>
          <p className="font-body text-sm text-off-black/70 mb-4">{packagePricing.minimumNote}</p>
          <div className="space-y-6">
            {packagePricing.packages.map((pkg) => (
              <div key={pkg.packageName} className="p-4 rounded-lg border border-off-white bg-off-white/30">
                <p className="font-display font-bold text-off-black">{pkg.packageName}</p>
                <p className="font-body text-sm text-off-black/80">{pkg.garment} · {pkg.print}</p>
                {pkg.printSize && <p className="font-body text-xs text-off-black/60">{pkg.printSize}</p>}
                {pkg.finish && <p className="font-body text-xs text-off-black/60">Finish: {pkg.finish}</p>}
                <p className="font-body text-xs text-off-black/60 mt-1">Example: {pkg.exampleQty} units</p>
                <dl className="mt-3 space-y-1 font-body text-sm">
                  {pkg.lineItems.map((line) => (
                    <div key={line.label} className="flex justify-between">
                      <dt className="text-off-black/80">{line.label}</dt>
                      <dd className="font-medium text-off-black">{formatCurrency(line.value)}</dd>
                    </div>
                  ))}
                  <div className="flex justify-between border-t border-off-black/20 pt-2 mt-2">
                    <dt className="font-display font-bold text-off-black">Total Project Cost</dt>
                    <dd className="font-display font-bold text-off-black">{formatCurrency(pkg.totalProjectCost)}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-off-black/80">Effective Cost Per Unit</dt>
                    <dd className="font-display font-bold text-accent">{formatCurrency(pkg.effectiveCostPerUnit)}</dd>
                  </div>
                </dl>
                <p className="font-body text-xs text-off-black/60 mt-3 italic">{pkg.volumeNudge}</p>
              </div>
            ))}
          </div>
          <p className="font-body text-sm text-off-black/80 mt-4">{packagePricing.volumeScalingNote}</p>
          <p className="font-body text-sm text-off-black/70 mt-2 italic">{packagePricing.positioningStatement}</p>
        </div>
      )}

      {timeline && (
        <div className="font-body text-sm text-off-black/80">
          <p className="font-display font-bold text-off-black mb-1">Production timeline</p>
          <p>{timeline.standard}</p>
          {timeline.rushOptions.length > 0 && (
            <ul className="mt-2 list-disc list-inside">
              {timeline.rushOptions.map((opt) => (
                <li key={opt.label}>{opt.label}: {opt.surcharge}</li>
              ))}
            </ul>
          )}
          <p className="mt-1 text-off-black/60">{timeline.rushNote}</p>
        </div>
      )}

      {quoteSteps.length > 0 && (
        <div className="font-body text-sm text-off-black/80">
          <p className="font-display font-bold text-off-black mb-2">What happens next</p>
          <ol className="list-decimal list-inside space-y-1">
            {quoteSteps.map((step, i) => (
              <li key={i}>{step}</li>
            ))}
          </ol>
        </div>
      )}

      <div className="space-y-4">
        <a
          href={calendlyUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center min-h-[44px] w-full px-8 py-4 bg-accent text-white font-body font-medium rounded-lg hover:bg-accent-hover focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2"
        >
          Book a call
        </a>
        <button
          type="button"
          onClick={() => setShowQuoteForm(true)}
          className="flex items-center justify-center min-h-[44px] w-full px-8 py-4 border-2 border-off-black text-off-black font-body font-medium rounded-lg hover:bg-off-white/80 focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2"
        >
          Request a quote instead
        </button>
      </div>

      {showQuoteForm && <QuoteForm answers={answers} context="qualified" projectData={projectDataForQuote} />}
    </div>
  );
}
