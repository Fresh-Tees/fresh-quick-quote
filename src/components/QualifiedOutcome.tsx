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
import { isBlockedEmailDomain } from "@/lib/email-domains";
import { ProjectConfigurator, type ProjectConfiguratorData } from "./ProjectConfigurator";
import Link from "next/link";
import { useMemo, useState } from "react";

type GateContact = { name: string; email: string; phone: string };

function formatCurrency(n: number): string {
  return new Intl.NumberFormat("en-AU", { style: "currency", currency: "AUD", minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n);
}

function FreeEmailLeadForm({
  initialContact,
  answers,
  onBack,
}: {
  initialContact: GateContact;
  answers: Answers;
  onBack: () => void;
}) {
  const [name, setName] = useState(initialContact.name);
  const [email, setEmail] = useState(initialContact.email);
  const [phone, setPhone] = useState(initialContact.phone);
  const [message, setMessage] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      const res = await fetch("/api/quote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          phone: phone || "",
          message: message || "",
          marketingConsent: false,
          context: "qualified",
          answers,
          freeEmailLead: true,
          timestamp: new Date().toISOString(),
          submittedAt: new Date().toISOString(),
        }),
      });
      if (!res.ok) throw new Error("Something went wrong");
      setSent(true);
    } catch {
      setError("Something went wrong. Please try again or email us directly.");
    }
  };

  if (sent) {
    return (
      <div className="max-w-xl mx-auto px-6 py-12 space-y-6">
        <p className="font-body font-medium text-off-black">
          Thanks. We've got your details and will give you a call to discuss your project and pricing.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto px-6 py-12 space-y-8">
      <section>
        <h1 className="font-display font-bold text-2xl md:text-3xl text-off-black mb-2">
          We'll give you a call
        </h1>
        <p className="font-body text-off-black/80 text-base mb-6">
          We'd love to help. Submit your details and we'll give you a call to discuss your project and pricing.
        </p>
      </section>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="free-name" className="block font-body text-sm font-medium text-off-black mb-1">Name *</label>
          <input id="free-name" type="text" required value={name} onChange={(e) => setName(e.target.value)} className="w-full min-h-[44px] px-4 py-3 border border-off-black/20 rounded-lg font-body focus:outline-none focus:ring-2 focus:ring-accent" />
        </div>
        <div>
          <label htmlFor="free-email" className="block font-body text-sm font-medium text-off-black mb-1">Email *</label>
          <input id="free-email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full min-h-[44px] px-4 py-3 border border-off-black/20 rounded-lg font-body focus:outline-none focus:ring-2 focus:ring-accent" />
        </div>
        <div>
          <label htmlFor="free-phone" className="block font-body text-sm font-medium text-off-black mb-1">Phone</label>
          <input id="free-phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full min-h-[44px] px-4 py-3 border border-off-black/20 rounded-lg font-body focus:outline-none focus:ring-2 focus:ring-accent" />
        </div>
        <div>
          <label htmlFor="free-message" className="block font-body text-sm font-medium text-off-black mb-1">Anything we should know?</label>
          <textarea id="free-message" rows={3} value={message} onChange={(e) => setMessage(e.target.value)} className="w-full px-4 py-3 border border-off-black/20 rounded-lg font-body focus:outline-none focus:ring-2 focus:ring-accent" />
        </div>
        {error && <p className="font-body text-sm text-red-600">{error}</p>}
        <div className="flex gap-3">
          <button type="button" onClick={onBack} className="min-h-[44px] px-6 py-3 border border-off-black/30 rounded-lg font-body text-off-black hover:bg-off-white/60 focus:outline-none focus:ring-2 focus:ring-accent">
            Back
          </button>
          <button type="submit" className="min-h-[44px] px-8 py-4 bg-accent text-white font-body font-medium rounded-lg hover:bg-accent/90 focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2">
            Submit – we'll call you
          </button>
        </div>
      </form>
    </div>
  );
}

export function QualifiedOutcome({ answers }: { answers: Answers }) {
  const calendlyUrl = getCalendlyUrl();
  const [gateContact, setGateContact] = useState<GateContact | null>(null);
  const [emailIsProfessional, setEmailIsProfessional] = useState<boolean | null>(null);
  const [gateError, setGateError] = useState<string | null>(null);
  const [showConfigurator, setShowConfigurator] = useState(false);
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
          contact_details: projectData.contactDetails ?? (gateContact ? { fullName: gateContact.name, email: gateContact.email, phone: gateContact.phone } : undefined),
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

  const handleGateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setGateError(null);
    const form = e.currentTarget;
    const name = (form.querySelector('input[name="gate-name"]') as HTMLInputElement)?.value?.trim();
    const email = (form.querySelector('input[name="gate-email"]') as HTMLInputElement)?.value?.trim();
    const phone = (form.querySelector('input[name="gate-phone"]') as HTMLInputElement)?.value?.trim() ?? "";
    if (!name || !email) {
      setGateError("Name and email are required.");
      return;
    }
    const contact: GateContact = { name, email, phone };
    setGateContact(contact);
    const blocked = isBlockedEmailDomain(email);
    setEmailIsProfessional(!blocked);
    if (!blocked) {
      setProjectData((prev) => ({
        ...prev,
        contactDetails: { fullName: name, email, phone },
      }));
    }
  };

  // Gate not passed: same page with single pricing box and overlay (qualifier inside box)
  if (emailIsProfessional === null) {
    return (
      <div className="max-w-xl mx-auto px-6 py-12 space-y-8">
        <section>
          <h1 className="font-display font-bold text-2xl md:text-3xl text-off-black mb-2">
            You're in the right place for 50+ units
          </h1>
          <p className="font-body text-off-black/80 text-base mb-6">
            Enter your work email to see indicative pricing, or we can give you a call to discuss. Enquiries with phone numbers are processed priority.
          </p>
        </section>

        <div className="relative p-4 rounded-lg border border-off-black/20 bg-off-white/30 min-h-[260px]">
          {/* Bottom layer: indicative pricing (invisible to reserve height, covered by overlay) */}
          <div className={hasIndicativePricing ? "invisible" : "sr-only"}>
            {indicativePricingContent}
          </div>
          {/* Overlay: qualifier form */}
          <div className="absolute inset-0 rounded-lg bg-off-white/95 p-3 flex flex-col justify-center overflow-auto box-border">
            <form onSubmit={handleGateSubmit} className="space-y-3">
              <div>
                <label htmlFor="gate-name" className="block font-body text-sm font-medium text-off-black mb-0.5">Name *</label>
                <input id="gate-name" name="gate-name" type="text" required className="w-full min-h-[40px] px-3 py-2 border border-off-black/20 rounded-lg font-body text-sm box-border focus:outline-none focus:ring-2 focus:ring-accent" />
              </div>
              <div>
                <label htmlFor="gate-email" className="block font-body text-sm font-medium text-off-black mb-0.5">Work email *</label>
                <input id="gate-email" name="gate-email" type="email" required className="w-full min-h-[40px] px-3 py-2 border border-off-black/20 rounded-lg font-body text-sm box-border focus:outline-none focus:ring-2 focus:ring-accent" placeholder="you@company.com" />
              </div>
              <div>
                <label htmlFor="gate-phone" className="block font-body text-sm font-medium text-off-black mb-0.5">Phone</label>
                <input id="gate-phone" name="gate-phone" type="tel" className="w-full min-h-[40px] px-3 py-2 border border-off-black/20 rounded-lg font-body text-sm box-border focus:outline-none focus:ring-2 focus:ring-accent" />
              </div>
              {gateError && <p className="font-body text-sm text-red-600">{gateError}</p>}
              <button type="submit" className="min-h-[40px] w-full px-6 py-2.5 bg-accent text-white font-body text-sm font-medium rounded-lg hover:bg-accent/90 focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2">
                Continue
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // Free-email path: no pricing, simple form, we'll call you
  if (emailIsProfessional === false && gateContact) {
    return (
      <FreeEmailLeadForm
        initialContact={gateContact}
        answers={answers}
        onBack={() => {
          setGateContact(null);
          setEmailIsProfessional(null);
        }}
      />
    );
  }

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
        <a
          href={calendlyUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center min-h-[44px] w-full px-8 py-4 bg-accent text-white font-body font-medium rounded-lg hover:bg-accent-hover focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2"
        >
          Book a call
        </a>
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
