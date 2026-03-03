"use client";

import { useState } from "react";
import { getProjectConfiguration } from "@/lib/flow";
import {
  calculateProjectSummary,
  getVolumeIncentiveMessage,
  type ConfiguredProduct,
  type PlacementConfig,
  type ProjectSummary,
} from "@/lib/pricing";

export type ContactDetails = {
  fullName: string;
  email: string;
  phone: string;
  businessName?: string;
};

export type ProjectConfiguratorData = {
  purpose: string;
  artworkStatus?: "yes" | "partially" | "no";
  products: ConfiguredProduct[];
  dueDate: string;
  rushFlag: boolean;
  summary: ProjectSummary | null;
  contactDetails?: ContactDetails | null;
  contactSubmittedAt?: string | null;
};

function formatCurrency(n: number): string {
  return new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: "AUD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n);
}

const emptyPlacements: PlacementConfig[] = [];

type PlacementPrintType = "screen" | "embroidery" | "dtf" | "unsure";

export function ProjectConfigurator({
  value,
  onChange,
  initialPurpose,
  purposeLabel,
}: {
  value: ProjectConfiguratorData;
  onChange: (data: ProjectConfiguratorData) => void;
  initialPurpose?: string;
  purposeLabel?: string;
}) {
  const config = getProjectConfiguration();
  const [purpose, setPurpose] = useState(value.purpose || initialPurpose || "");
  const [products, setProducts] = useState<ConfiguredProduct[]>(value.products);
  const [dueDate, setDueDate] = useState(value.dueDate);
  const [rushFlag, setRushFlag] = useState(value.rushFlag);
  const [summary, setSummary] = useState<ProjectSummary | null>(value.summary);
  const [contactDetails, setContactDetails] = useState<ContactDetails | null>(value.contactDetails ?? null);
  const [contactSubmittedAt, setContactSubmittedAt] = useState<string | null>(value.contactSubmittedAt ?? null);
  const [showContactForm, setShowContactForm] = useState(false);
  const [contactForm, setContactForm] = useState({ fullName: "", email: "", phone: "", businessName: "" });
  const [contactFormError, setContactFormError] = useState<string | null>(null);
  const [purposeEditMode, setPurposeEditMode] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [addingProduct, setAddingProduct] = useState<ConfiguredProduct>({
    productType: "t_shirts",
    garmentModel: "staple",
    garmentColour: "white",
    quantity: 100,
    placements: [],
    finishes: [],
  });
  const [placementChecks, setPlacementChecks] = useState<Record<string, boolean>>({ front: false, back: false, sleeves: false });
  const [placementDetails, setPlacementDetails] = useState<Record<string, { printType: PlacementPrintType; colourCount: number }>>({
    front: { printType: "screen", colourCount: 1 },
    back: { printType: "screen", colourCount: 1 },
    sleeves: { printType: "screen", colourCount: 1 },
  });

  if (!config) return null;

  const productTypeLabel = (v: string) => config.productTypes.find((t) => t.value === v)?.label ?? v;
  const placementLabel = (v: string) => config.placementOptions?.find((p) => p.value === v)?.label ?? v;
  const finishLabel = (v: string) => config.finishOptions.find((f) => f.value === v)?.label ?? v;
  const models = config.garmentModelsByProduct?.[addingProduct.productType] ?? [];
  const screenMinQty = config.screenPrintMinQty ?? 50;
  const minQtyMessage = config.screenPrintMinQtyMessage ?? "Screen printing minimum is 50 units.";

  const syncPurpose = (p: string) => {
    setPurpose(p);
    onChange({ purpose: p, artworkStatus: value.artworkStatus, products, dueDate, rushFlag, summary, contactDetails: contactDetails ?? undefined, contactSubmittedAt: contactSubmittedAt ?? undefined });
  };

  const syncContactAndSummary = (details: ContactDetails, result: ProjectSummary) => {
    const at = new Date().toISOString();
    setContactDetails(details);
    setContactSubmittedAt(at);
    setSummary(result);
    setShowContactForm(false);
    setContactFormError(null);
    onChange({ purpose, artworkStatus: value.artworkStatus, products, dueDate, rushFlag, summary: result, contactDetails: details, contactSubmittedAt: at });
  };

  const addProduct = () => {
    const placements: PlacementConfig[] = [];
    (["front", "back", "sleeves"] as const).forEach((loc) => {
      if (!placementChecks[loc]) return;
      const d = placementDetails[loc];
      if (!d) return;
      if (d.printType === "screen" && addingProduct.quantity < screenMinQty) return;
      placements.push({
        location: loc,
        printType: d.printType,
        ...(d.printType === "screen" && { colourCount: d.colourCount }),
      });
    });
    if (placements.length === 0) return;
    const next: ConfiguredProduct = {
      ...addingProduct,
      garmentModel: models.length ? addingProduct.garmentModel : addingProduct.productType,
      placements,
    };
    const nextProducts = [...products, next];
    setProducts(nextProducts);
    setSummary(null);
    setShowAddForm(false);
    setAddingProduct({
      productType: "t_shirts",
      garmentModel: "staple",
      garmentColour: "white",
      quantity: 100,
      placements: [],
      finishes: [],
    });
    setPlacementChecks({ front: false, back: false, sleeves: false });
    onChange({ purpose, artworkStatus: value.artworkStatus, products: nextProducts, dueDate, rushFlag, summary: null, contactDetails: contactDetails ?? undefined, contactSubmittedAt: contactSubmittedAt ?? undefined });
  };

  const removeProduct = (index: number) => {
    const next = products.filter((_, i) => i !== index);
    setProducts(next);
    setSummary(null);
    onChange({ purpose, artworkStatus: value.artworkStatus, products: next, dueDate, rushFlag, summary: null, contactDetails: contactDetails ?? undefined, contactSubmittedAt: contactSubmittedAt ?? undefined });
  };

  const toggleFinish = (f: string) => {
    const next = addingProduct.finishes.includes(f)
      ? addingProduct.finishes.filter((x) => x !== f)
      : [...addingProduct.finishes, f];
    setAddingProduct((p) => ({ ...p, finishes: next }));
  };

  const runCalculation = (): ProjectSummary | null => {
    if (products.length === 0) return null;
    const result = calculateProjectSummary(products);
    setSummary(result);
    onChange({ purpose, artworkStatus: value.artworkStatus, products, dueDate, rushFlag, summary: result, contactDetails: contactDetails ?? undefined, contactSubmittedAt: contactSubmittedAt ?? undefined });
    return result;
  };

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setContactFormError(null);
    const { fullName, email, phone, businessName } = contactForm;
    if (!fullName?.trim() || !email?.trim() || !phone?.trim()) {
      setContactFormError("Full name, email and phone number are required.");
      return;
    }
    const details: ContactDetails = { fullName: fullName.trim(), email: email.trim(), phone: phone.trim(), ...(businessName?.trim() && { businessName: businessName.trim() }) };
    const result = runCalculation();
    if (result) syncContactAndSummary(details, result);
  };

  const businessDaysFromToday = (dateStr: string): number => {
    const d = new Date(dateStr);
    const now = new Date();
    let days = 0;
    const cur = new Date(now);
    while (cur < d) {
      if (cur.getDay() !== 0 && cur.getDay() !== 6) days++;
      cur.setDate(cur.getDate() + 1);
    }
    return days;
  };

  const showRush = dueDate && businessDaysFromToday(dueDate) < (config.businessDaysForRushThreshold ?? 10);

  return (
    <div className="mb-8 p-4 rounded-lg border border-off-black/20 bg-off-white/20">
      <h2 className="font-display font-bold text-xl text-off-black mb-4">Configure your project</h2>

      {/* Step 1 – Purpose (read-only from wizard with edit) */}
      <div className="mb-6">
        <p className="font-body text-sm font-medium text-off-black mb-2">{config.purposeQuestion}</p>
        {!purposeEditMode ? (
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-body text-sm text-off-black/90">
            {(purposeLabel ?? config.purposeOptions.find((o) => o.value === purpose)?.label ?? purpose) || "—"}
            </span>
            <button
              type="button"
              onClick={() => setPurposeEditMode(true)}
              className="font-body text-sm text-burnt-orange hover:underline"
            >
              Edit
            </button>
          </div>
        ) : (
          <div className="flex flex-wrap gap-3">
            {config.purposeOptions.map((opt) => (
              <label key={opt.value} className="flex items-center gap-2 font-body text-sm cursor-pointer">
                <input
                  type="radio"
                  name="purpose"
                  checked={purpose === opt.value}
                  onChange={() => {
                    syncPurpose(opt.value);
                    setPurposeEditMode(false);
                  }}
                  className="border-off-black/30"
                />
                <span className="text-off-black/90">{opt.label}</span>
              </label>
            ))}
          </div>
        )}
      </div>

      {/* Step 2–4 – Product builder */}
      <div className="mb-4">
        <p className="font-body text-sm font-medium text-off-black mb-2">Products</p>
        {products.length > 0 && (
          <ul className="mb-3 space-y-2">
            {products.map((p, i) => (
              <li key={i} className="flex justify-between items-center font-body text-sm text-off-black/90 bg-white px-3 py-2 rounded">
                <span>
                  {productTypeLabel(p.productType)} × {p.quantity} · {p.placements.length} placement(s) · {p.finishes.length} finish(es)
                </span>
                <button type="button" onClick={() => removeProduct(i)} className="text-burnt-orange hover:underline text-xs">
                  Remove
                </button>
              </li>
            ))}
          </ul>
        )}
        {!showAddForm ? (
          <button
            type="button"
            onClick={() => setShowAddForm(true)}
            className="px-4 py-2 border border-off-black/30 rounded font-body text-sm text-off-black hover:bg-off-white/50"
          >
            Add product
          </button>
        ) : (
          <div className="p-4 rounded bg-white border border-off-white space-y-4">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block font-body text-xs text-off-black/70">Product type</label>
                <select
                  value={addingProduct.productType}
                  onChange={(e) => {
                    const v = e.target.value;
                    const modelsForType = config.garmentModelsByProduct?.[v] ?? [];
                    setAddingProduct((p) => ({
                      ...p,
                      productType: v,
                      garmentModel: modelsForType[0]?.value ?? v,
                    }));
                  }}
                  className="w-full mt-0.5 px-2 py-1.5 border border-off-black/20 rounded text-sm"
                >
                  {config.productTypes.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block font-body text-xs text-off-black/70">Garment model</label>
                <select
                  value={addingProduct.garmentModel}
                  onChange={(e) => setAddingProduct((p) => ({ ...p, garmentModel: e.target.value }))}
                  className="w-full mt-0.5 px-2 py-1.5 border border-off-black/20 rounded text-sm"
                >
                  {models.map((m) => (
                    <option key={m.value} value={m.value}>{m.label}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block font-body text-xs text-off-black/70">Garment colour</label>
                <select
                  value={addingProduct.garmentColour}
                  onChange={(e) => setAddingProduct((p) => ({ ...p, garmentColour: e.target.value }))}
                  className="w-full mt-0.5 px-2 py-1.5 border border-off-black/20 rounded text-sm"
                >
                  {(config.garmentColourOptions ?? []).map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block font-body text-xs text-off-black/70">Quantity (min 50)</label>
                <input
                  type="number"
                  min={1}
                  value={addingProduct.quantity}
                  onChange={(e) => setAddingProduct((p) => ({ ...p, quantity: parseInt(e.target.value, 10) || 0 }))}
                  className="w-full mt-0.5 px-2 py-1.5 border border-off-black/20 rounded text-sm"
                />
              </div>
            </div>

            {addingProduct.quantity > 0 && addingProduct.quantity < screenMinQty && (
              <p className="font-body text-xs text-burnt-orange">{minQtyMessage}</p>
            )}

            {/* Step 3 – Placements */}
            <div>
              <label className="block font-body text-xs text-off-black/70 mb-2">Placements</label>
              {(config.placementOptions ?? []).map((opt) => (
                <div key={opt.value} className="mb-3 pl-2 border-l-2 border-off-white">
                  <label className="flex items-center gap-2 font-body text-sm">
                    <input
                      type="checkbox"
                      checked={!!placementChecks[opt.value]}
                      onChange={(e) => setPlacementChecks((c) => ({ ...c, [opt.value]: e.target.checked }))}
                      className="rounded"
                    />
                    {opt.label}
                  </label>
                  {placementChecks[opt.value] && (
                    <div className="ml-5 mt-2 flex flex-wrap gap-4">
                      <div>
                        <span className="font-body text-xs text-off-black/70">Print type </span>
                        <select
                          value={(placementDetails[opt.value] ?? { printType: "screen" as const }).printType}
                          onChange={(e) => {
                            const v = e.target.value as PlacementPrintType;
                            setPlacementDetails((d) => ({
                              ...d,
                              [opt.value]: { ...d[opt.value], printType: v, colourCount: d[opt.value]?.colourCount ?? 1 },
                            }));
                          }}
                          className="ml-1 px-2 py-1 border rounded text-sm"
                        >
                          {(config.placementPrintTypes ?? []).map((t) => (
                            <option key={t.value} value={t.value} disabled={t.value === "screen" && addingProduct.quantity < screenMinQty}>
                              {t.label}
                            </option>
                          ))}
                        </select>
                      </div>
                      {(placementDetails[opt.value] ?? {}).printType === "screen" && addingProduct.quantity >= screenMinQty && (
                        <div>
                          <span className="font-body text-xs text-off-black/70">Colours </span>
                          <select
                            value={(placementDetails[opt.value] ?? { colourCount: 1 }).colourCount ?? 1}
                            onChange={(e) =>
                              setPlacementDetails((d) => ({
                                ...d,
                                [opt.value]: { ...d[opt.value], colourCount: parseInt(e.target.value, 10) },
                              }))
                            }
                            className="ml-1 px-2 py-1 border rounded text-sm"
                          >
                            {Array.from({ length: Math.min(10, config.screenPrintMaxColours ?? 10) }, (_, i) => i + 1).map((n) => (
                              <option key={n} value={n}>{n}</option>
                            ))}
                          </select>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Step 4 – Finishes */}
            <div>
              <label className="block font-body text-xs text-off-black/70 mb-2">Finishes (add-ons)</label>
              <div className="flex flex-wrap gap-3">
                {config.finishOptions.map((o) => (
                  <label key={o.value} className="flex items-center gap-2 font-body text-sm">
                    <input
                      type="checkbox"
                      checked={addingProduct.finishes.includes(o.value)}
                      onChange={() => toggleFinish(o.value)}
                      className="rounded"
                    />
                    <span>{o.label}{o.flagForReview && " (quote)"}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={addProduct}
                className="px-4 py-2 bg-off-black text-white font-body text-sm rounded"
              >
                Add to project
              </button>
              <button type="button" onClick={() => setShowAddForm(false)} className="px-4 py-2 font-body text-sm text-off-black/80">
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Step 5 – Timeline */}
      {products.length > 0 && (
        <div className="mb-4">
          <label className="block font-body text-sm font-medium text-off-black mb-1">Due date (required for quote)</label>
          <input
            type="date"
            value={dueDate}
            onChange={(e) => {
              const d = e.target.value;
              setDueDate(d);
              const days = d ? businessDaysFromToday(d) : 0;
              setRushFlag(days < (config.businessDaysForRushThreshold ?? 10));
              onChange({ purpose, artworkStatus: value.artworkStatus, products, dueDate: d, rushFlag: days < (config.businessDaysForRushThreshold ?? 10), summary, contactDetails: contactDetails ?? undefined, contactSubmittedAt: contactSubmittedAt ?? undefined });
            }}
            className="px-3 py-2 border border-off-black/20 rounded text-sm"
          />
          {showRush && (
            <p className="font-body text-xs text-off-black/70 mt-2">
              Rush options: {(config.rushOptions ?? []).map((r) => `${r.label} +${r.surchargePercent}%`).join("; ")}
            </p>
          )}
        </div>
      )}

      {products.length > 0 && !contactDetails && (
        <div className="mb-4">
          <button
            type="button"
            onClick={() => setShowContactForm(true)}
            className="px-4 py-2 bg-burnt-orange text-white font-body text-sm font-medium rounded hover:bg-burnt-orange/90"
          >
            Calculate indicative pricing
          </button>
        </div>
      )}

      {products.length > 0 && showContactForm && !contactDetails && (
        <form onSubmit={handleContactSubmit} className="mb-4 p-4 rounded-lg border border-off-black/20 bg-white space-y-3">
          <p className="font-body text-sm font-medium text-off-black">Contact details (required for indicative pricing)</p>
          <div>
            <label className="block font-body text-xs text-off-black/70 mb-0.5">Full name *</label>
            <input
              type="text"
              value={contactForm.fullName}
              onChange={(e) => setContactForm((f) => ({ ...f, fullName: e.target.value }))}
              className="w-full px-2 py-1.5 border border-off-black/20 rounded text-sm"
              required
            />
          </div>
          <div>
            <label className="block font-body text-xs text-off-black/70 mb-0.5">Email *</label>
            <input
              type="email"
              value={contactForm.email}
              onChange={(e) => setContactForm((f) => ({ ...f, email: e.target.value }))}
              className="w-full px-2 py-1.5 border border-off-black/20 rounded text-sm"
              required
            />
          </div>
          <div>
            <label className="block font-body text-xs text-off-black/70 mb-0.5">Phone number *</label>
            <input
              type="tel"
              value={contactForm.phone}
              onChange={(e) => setContactForm((f) => ({ ...f, phone: e.target.value }))}
              className="w-full px-2 py-1.5 border border-off-black/20 rounded text-sm"
              required
            />
          </div>
          <div>
            <label className="block font-body text-xs text-off-black/70 mb-0.5">Business name (optional)</label>
            <input
              type="text"
              value={contactForm.businessName}
              onChange={(e) => setContactForm((f) => ({ ...f, businessName: e.target.value }))}
              className="w-full px-2 py-1.5 border border-off-black/20 rounded text-sm"
            />
          </div>
          {contactFormError && <p className="font-body text-sm text-red-600">{contactFormError}</p>}
          <div className="flex gap-2">
            <button type="submit" className="px-4 py-2 bg-burnt-orange text-white font-body text-sm rounded">
              Submit & show pricing
            </button>
            <button type="button" onClick={() => { setShowContactForm(false); setContactFormError(null); }} className="px-4 py-2 font-body text-sm text-off-black/80">
              Cancel
            </button>
          </div>
        </form>
      )}

      {products.length >= 2 && !summary && !contactDetails && (
        <p className="font-body text-sm text-off-black/70 mb-4 italic">{config.bundleMessage}</p>
      )}

      {summary && contactDetails && (
        <div className="space-y-4 pt-4 border-t border-off-black/20">
          <p className="font-display font-bold text-off-black">Product Breakdown</p>
          {summary.productCalculations.map((calc, i) => (
            <div key={i} className="p-3 rounded bg-white border border-off-white">
              <p className="font-display font-bold text-off-black">{productTypeLabel(calc.productType)} × {calc.quantity}</p>
              <dl className="mt-2 space-y-1 font-body text-sm">
                <div className="flex justify-between"><dt className="text-off-black/70">Garment Total</dt><dd>{formatCurrency(calc.garmentTotal)}</dd></div>
                {calc.placementBreakdown.map((pb, j) => (
                  <div key={j} className="flex justify-between">
                    <dt className="text-off-black/70">Print ({placementLabel(pb.location)} – {pb.printType})</dt>
                    <dd>{formatCurrency(pb.amount)}</dd>
                  </div>
                ))}
                <div className="flex justify-between"><dt className="text-off-black/70">Setup Total</dt><dd>{formatCurrency(calc.setupTotal)}</dd></div>
                {calc.finishBreakdown.map((fb, j) => (
                  <div key={j} className="flex justify-between">
                    <dt className="text-off-black/70">{finishLabel(fb.finish)}</dt>
                    <dd>{formatCurrency(fb.amount)}</dd>
                  </div>
                ))}
                <div className="flex justify-between border-t pt-2 font-display font-bold"><dt>Estimated Product Total</dt><dd>{formatCurrency(calc.productTotal)}</dd></div>
                <div className="flex justify-between text-burnt-orange font-display font-bold"><dt>Effective Unit Cost</dt><dd>{formatCurrency(calc.effectiveUnitCost)}</dd></div>
              </dl>
            </div>
          ))}

          <div className="p-4 rounded bg-off-white/50 border border-off-black/20">
            <p className="font-display font-bold text-off-black mb-2">Estimated project total</p>
            <p className="font-display font-bold text-2xl text-burnt-orange">{formatCurrency(summary.estimatedProjectTotal)}</p>
            <p className="font-body text-xs text-off-black/70 mt-2">Effective cost per unit: varies per product</p>
            <p className="font-body text-xs text-off-black/70 mt-1">{config.projectSummaryNote}</p>
          </div>

          {getVolumeIncentiveMessage(summary.totalUnits) && (
            <p className="font-body text-sm text-off-black/80">
              {summary.totalUnits >= 250 ? getVolumeIncentiveMessage(summary.totalUnits)!.high : getVolumeIncentiveMessage(summary.totalUnits)!.low}
            </p>
          )}
        </div>
      )}
    </div>
  );
}