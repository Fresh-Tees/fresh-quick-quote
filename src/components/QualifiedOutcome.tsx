"use client";

import type { Answers } from "@/lib/flow";
import {
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
import { ProjectConfigurator, type ProjectConfiguratorData } from "./ProjectConfigurator";
import Link from "next/link";
import { useMemo, useState } from "react";

function formatCurrency(n: number): string {
  return new Intl.NumberFormat("en-AU", { style: "currency", currency: "AUD", minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n);
}

export function QualifiedOutcome({ answers }: { answers: Answers }) {
  const [showConfigurator, setShowConfigurator] = useState(false);
  const [showRequestCallMessage, setShowRequestCallMessage] = useState(false);
  const [showContactFormForRequestCall, setShowContactFormForRequestCall] = useState(false);
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
    const defaultColour = "white";
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

  // Build indicative pricing box content (reused under overlay and when revealed)
  const hasIndicativePricing = (answers.quantity && getIndicativePricePerUnit(answers) != null) || !!pricingAnchor;
  const indicativePricingContent = hasIndicativePricing ? (
    answers.quantity && getIndicativePricePerUnit(answers) != null ? (
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
    ) : null
  ) : null;

  return (
    <div className="max-w-xl mx-auto px-6 py-12 space-y-8">
      <section>
        <h1 className="font-display font-bold text-2xl md:text-3xl text-off-black mb-2">
          You're in the right place for managed services.
        </h1>
        <p className="font-body text-off-black/80 text-base">
          Let's get you a firm quote. Request a call or use the options below.
        </p>
      </section>

      {(hasIndicativePricing || !showConfigurator) ? (
        <div className="p-4 rounded-lg border border-off-black/20 bg-off-white/30">
          {indicativePricingContent}
          {!showConfigurator && (
            <button
              type="button"
              onClick={() => setShowConfigurator(true)}
              className="mt-4 min-h-[44px] w-full px-8 py-4 bg-accent text-white font-body font-medium rounded-lg hover:bg-accent/90 focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2"
            >
              Request a quote
            </button>
          )}
        </div>
      ) : null}

      {showConfigurator && (
        <ProjectConfigurator
          value={projectData}
          onChange={setProjectData}
          initialPurpose={initialPurpose}
          purposeLabel={purposeLabelFromWizard ?? undefined}
          answers={answers}
          openContactFormForRequestCall={showContactFormForRequestCall}
          onRequestCallSubmit={(details) => {
            setProjectData((prev) => ({ ...prev, contactDetails: details }));
            setShowContactFormForRequestCall(false);
            setShowRequestCallMessage(true);
            fetch("/api/quote", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                name: details.fullName,
                email: details.email,
                phone: details.phone ?? "",
                message: "",
                marketingConsent: false,
                context: "request_call",
                contact_details: details,
                timestamp: new Date().toISOString(),
                submittedAt: new Date().toISOString(),
              }),
            }).catch(() => {});
          }}
        />
      )}

      {packagePricing && showConfigurator && (
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
        {showRequestCallMessage ? (
          <div className="space-y-3">
            <p className="font-body text-off-black p-4 rounded-lg border border-off-black/20 bg-off-white/30">
              We will contact you on the details you provided.
            </p>
            <p className="font-body text-sm text-off-black/80">
              Grab a copy of our onboarding guide to make sure you&apos;re ready to go.{" "}
              <a
                href="/api/download-onboarding"
                target="_blank"
                rel="noopener noreferrer"
                className="text-accent font-medium hover:underline focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 rounded"
              >
                Download
              </a>
            </p>
          </div>
        ) : (
          <button
            type="button"
            onClick={async () => {
              const contact = projectData.contactDetails ?? null;
              if (!contact) {
                setShowConfigurator(true);
                setShowContactFormForRequestCall(true);
                return;
              }
              setShowRequestCallMessage(true);
              try {
                await fetch("/api/quote", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    name: contact.fullName,
                    email: contact.email,
                    phone: contact.phone ?? "",
                    message: "",
                    marketingConsent: false,
                    context: "request_call",
                    contact_details: contact,
                    timestamp: new Date().toISOString(),
                    submittedAt: new Date().toISOString(),
                  }),
                });
              } catch {
                // Fire-and-forget
              }
            }}
            className="flex items-center justify-center min-h-[44px] w-full px-8 py-4 bg-accent text-white font-body font-medium rounded-lg hover:bg-accent-hover focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2"
          >
            Request a call
          </button>
        )}
      </div>

      <div className="pt-4 border-t border-off-black/10 mt-6 flex justify-center">
        <Link
          href="/"
          className="font-body text-sm text-off-black/70 hover:text-off-black hover:underline"
        >
          Restart and go back to the start
        </Link>
      </div>
    </div>
  );
}
