import nodemailer from "nodemailer";

type QuotePayload = {
  name: string;
  email: string;
  phone: string;
  message: string;
  marketingConsent: boolean;
  context?: string;
  answers?: unknown;
  project_purpose?: string;
  artwork_status?: string;
  contact_details?: {
    fullName: string;
    email: string;
    phone: string;
    businessName?: string;
  };
  project_products?: {
    product_type: string;
    garment_model: string;
    garment_colour: string;
    quantity: number;
    placements: { location: string; print_type: string; colour_count?: number; artwork_url?: string }[];
    finishes: string[];
    due_date?: string;
    rush_flag: boolean;
    indicative_total?: number;
  }[];
  indicative_pricing_shown?: {
    estimatedProjectTotal: number;
    totalUnits: number;
    productCalculations: unknown[];
  };
  timestamp: string;
  submittedAt: string;
  freeEmailLead?: boolean;
  indicativePricingSummary?: string;
};

function ensureEmailConfig() {
  const host = process.env.SMTP_HOST;
  const portRaw = process.env.SMTP_PORT;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const from = process.env.SMTP_FROM;
  const notify = process.env.QUOTE_NOTIFY_EMAIL;

  if (!notify) {
    throw new Error("QUOTE_NOTIFY_EMAIL is not configured.");
  }

  if (!host || !portRaw || !user || !pass || !from) {
    throw new Error("SMTP configuration is incomplete (SMTP_HOST/PORT/USER/PASS/FROM).");
  }

  const port = Number(portRaw) || 587;
  const secure = port === 465;

  return {
    transportOptions: {
      host,
      port,
      secure,
      auth: { user, pass },
    },
    from,
    notify,
  };
}

/** Bare email from `SMTP_FROM` (`Name <a@b>` or `a@b`). */
function extractEmailFromFromHeader(smtpFrom: string): string {
  const t = smtpFrom.trim();
  const m = t.match(/<([^>]+)>/);
  if (m) return m[1].trim();
  return t;
}

/** Customer-facing sends: same address as SMTP_FROM, display name "FRESH." */
function customerFromHeader(smtpFrom: string): string {
  return `FRESH. <${extractEmailFromFromHeader(smtpFrom)}>`;
}

function formatQuoteEmailSubject(payload: QuotePayload): string {
  const name = payload.name || payload.contact_details?.fullName || "Unknown contact";

  if (payload.freeEmailLead) {
    return `Free-email lead – please call – ${name}`;
  }
  if (payload.context === "indicative_pricing") {
    return `Viewed indicative pricing – ${name}`;
  }
  if (payload.context === "request_call") {
    return `Request a call – ${name}`;
  }

  const purpose = payload.project_purpose || "New bulk quote";
  const totalUnits =
    payload.indicative_pricing_shown?.totalUnits ??
    payload.project_products?.reduce((sum, p) => sum + (p.quantity || 0), 0) ??
    0;

  const primaryProduct = payload.project_products?.[0];
  const productLabel = primaryProduct
    ? `${primaryProduct.quantity} × ${primaryProduct.garment_model} (${primaryProduct.product_type})`
    : "";

  const unitsPart = totalUnits ? `${totalUnits} units` : productLabel;

  return unitsPart
    ? `${purpose} – ${name} (${unitsPart})`
    : `${purpose} – ${name}`;
}

function formatQuoteEmailBody(payload: QuotePayload): string {
  const lines: string[] = [];

  if (payload.freeEmailLead) {
    lines.push("Free-email lead – indicative pricing was not shown. Please call to discuss.");
    lines.push("");
  } else if (payload.context === "indicative_pricing") {
    lines.push("Someone viewed indicative pricing (gate submit).");
    lines.push("");
  } else if (payload.context === "request_call") {
    lines.push("Request a call – contact the customer on the details below.");
    lines.push("");
  } else {
    lines.push("New bulk quote from Fresh Tees gateway");
    lines.push("");
  }

  // Contact
  lines.push("== Contact ==");
  const contact = payload.contact_details;
  lines.push(`Name: ${contact?.fullName ?? payload.name}`);
  lines.push(`Email: ${contact?.email ?? payload.email}`);
  lines.push(`Phone: ${contact?.phone ?? payload.phone}`);
  if (contact?.businessName) {
    lines.push(`Business: ${contact.businessName}`);
  }
  lines.push(`Marketing consent: ${payload.marketingConsent ? "Yes" : "No"}`);
  if (payload.message?.trim()) {
    lines.push("");
    lines.push("Message:");
    lines.push(payload.message.trim());
  }
  lines.push("");

  if (payload.context === "indicative_pricing" && payload.indicativePricingSummary) {
    lines.push("== Indicative pricing viewed ==");
    lines.push(payload.indicativePricingSummary);
    lines.push("");
    return lines.join("\n");
  }
  if (payload.context === "request_call") {
    return lines.join("\n");
  }
  if (payload.freeEmailLead) {
    if (payload.context || payload.answers) {
      lines.push("== Wizard context ==");
      if (payload.context) lines.push(`Context: ${payload.context}`);
      if (payload.answers) {
        try {
          lines.push(JSON.stringify(payload.answers, null, 2));
        } catch {
          lines.push(String(payload.answers));
        }
      }
      lines.push("");
    }
    return lines.join("\n");
  }

  // Project overview
  lines.push("== Project ==");
  if (payload.project_purpose) {
    lines.push(`Purpose: ${payload.project_purpose}`);
  }
  if (payload.artwork_status) {
    lines.push(`Artwork: ${payload.artwork_status}`);
  }

  const firstProduct = payload.project_products?.[0];
  if (firstProduct?.due_date) {
    lines.push(`Due date: ${firstProduct.due_date}`);
  }
  const anyRush = payload.project_products?.some((p) => p.rush_flag);
  if (anyRush) {
    lines.push("Rush: Yes");
  }

  if (payload.indicative_pricing_shown) {
    lines.push(
      `Indicative total: ${payload.indicative_pricing_shown.estimatedProjectTotal} (for ${payload.indicative_pricing_shown.totalUnits} units)`
    );
  }
  lines.push("");

  // Products
  if (payload.project_products && payload.project_products.length > 0) {
    lines.push("== Products ==");
    payload.project_products.forEach((p, index) => {
      lines.push(`Product ${index + 1}:`);
      lines.push(
        `  ${p.quantity} × ${p.garment_model} (${p.product_type}) – ${p.garment_colour}`
      );
      if (p.placements.length > 0) {
        const placements = p.placements
          .map((pl) =>
            pl.colour_count != null
              ? `${pl.location} (${pl.print_type}, ${pl.colour_count} colours)`
              : `${pl.location} (${pl.print_type})`
          )
          .join("; ");
        lines.push(`  Placements: ${placements}`);
        p.placements.forEach((pl) => {
          if (pl.artwork_url) {
            lines.push(`  Artwork (${pl.location}): ${pl.artwork_url}`);
          }
        });
      }
      if (p.finishes.length > 0) {
        lines.push(`  Finishes: ${p.finishes.join(", ")}`);
      }
      if (p.indicative_total != null) {
        lines.push(`  Indicative product total: ${p.indicative_total}`);
      }
      if (p.due_date) {
        lines.push(`  Due date: ${p.due_date}`);
      }
      lines.push("");
    });
  }

  // Context
  if (payload.context || payload.answers) {
    lines.push("== Wizard context ==");
    if (payload.context) {
      lines.push(`Context: ${payload.context}`);
    }
    if (payload.answers) {
      lines.push("Answers (JSON):");
      try {
        lines.push(JSON.stringify(payload.answers, null, 2));
      } catch {
        lines.push(String(payload.answers));
      }
    }
    lines.push("");
  }

  // Raw payload
  lines.push("== Raw payload ==");
  try {
    lines.push(JSON.stringify(payload, null, 2));
  } catch {
    lines.push(String(payload));
  }

  return lines.join("\n");
}

/** Public site origin for absolute links in customer emails (e.g. onboarding guide). */
function getSiteBaseUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/$/, "");
  if (explicit) return explicit;
  const vercel = process.env.VERCEL_URL?.trim();
  if (vercel) {
    const host = vercel.startsWith("http") ? vercel : `https://${vercel}`;
    return host.replace(/\/$/, "");
  }
  return "";
}

function getOnboardingGuideUrl(): string {
  const base = getSiteBaseUrl();
  if (!base) {
    console.warn(
      "[Customer email] NEXT_PUBLIC_SITE_URL (or VERCEL_URL) is not set; onboarding link may be relative only."
    );
  }
  return base ? `${base}/api/download-onboarding` : "/api/download-onboarding";
}

function formatAud(n: number): string {
  return new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: "AUD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n);
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function firstNameFromFullName(fullName: string): string {
  const t = fullName.trim();
  if (!t) return "";
  return t.split(/\s+/)[0] ?? "";
}

/** Lines of project/quote detail for customer-facing emails. */
function buildCustomerDetailsLines(payload: QuotePayload): string[] {
  const lines: string[] = [];
  if (payload.project_purpose) {
    lines.push(`Project purpose: ${payload.project_purpose}`);
  }
  if (payload.artwork_status) {
    lines.push(`Artwork: ${payload.artwork_status}`);
  }
  const firstProduct = payload.project_products?.[0];
  if (firstProduct?.due_date) {
    lines.push(`Due date: ${firstProduct.due_date}`);
  }
  const anyRush = payload.project_products?.some((p) => p.rush_flag);
  if (anyRush) {
    lines.push("Rush: Yes");
  }
  if (payload.indicative_pricing_shown) {
    lines.push(
      `Indicative total: ${formatAud(payload.indicative_pricing_shown.estimatedProjectTotal)} (for ${payload.indicative_pricing_shown.totalUnits} units)`
    );
  }
  if (payload.project_products?.length) {
    if (lines.length > 0) lines.push("");
    lines.push("Products:");
    payload.project_products.forEach((p, i) => {
      lines.push(
        `- Product ${i + 1}: ${p.quantity} × ${p.garment_model} (${p.product_type}), ${p.garment_colour}`
      );
      if (p.placements?.length) {
        const placements = p.placements
          .map((pl) =>
            pl.colour_count != null
              ? `${pl.location} (${pl.print_type}, ${pl.colour_count} colours)`
              : `${pl.location} (${pl.print_type})`
          )
          .join("; ");
        lines.push(`  Placements: ${placements}`);
      }
      if (p.finishes?.length) {
        lines.push(`  Finishes: ${p.finishes.join(", ")}`);
      }
      if (p.due_date) {
        lines.push(`  Due date: ${p.due_date}`);
      }
    });
  }
  if (lines.length === 0) {
    lines.push("—");
  }
  return lines;
}

function formatCustomerEmailSubject(_payload: QuotePayload): string {
  return "FRESH. Your estimate and next steps.";
}

function formatCustomerEmailBody(payload: QuotePayload): string {
  const contact = payload.contact_details;
  const fullName = contact?.fullName ?? payload.name ?? "";
  const first = firstNameFromFullName(fullName);
  const greeting = first ? `Yo ${first},` : "Yo,";
  const detailsLines = buildCustomerDetailsLines(payload);
  const detailsBlock = detailsLines.join("\n");
  const onboardingUrl = getOnboardingGuideUrl();

  const lines: string[] = [];
  lines.push(greeting);
  lines.push("");
  lines.push("Thanks for requesting a quote.");
  lines.push("");
  lines.push(
    "Next we'll reach out to confirm your enquiry before providing a quote. Details below:"
  );
  lines.push("");
  lines.push(detailsBlock);
  lines.push("");
  lines.push(
    "To make sure we're all on the same page, if you haven't already, please download a copy of our Onboarding Guide:"
  );
  lines.push(onboardingUrl);
  lines.push("");
  lines.push(
    "This tool is brand new and under development. We'd love to hear any feedback you have and in fact are offering a 5% discount on prints for this project, should you be so kind. Simply reply to this email with your feedback."
  );
  lines.push("");
  lines.push("Shot!");
  lines.push("The FRESH Crew.");
  return lines.join("\n");
}

function formatCustomerEmailHtml(payload: QuotePayload): string {
  const contact = payload.contact_details;
  const fullName = contact?.fullName ?? payload.name ?? "";
  const first = firstNameFromFullName(fullName);
  const greeting = first ? `Yo ${escapeHtml(first)},` : "Yo,";
  const detailsLines = buildCustomerDetailsLines(payload);
  const detailsHtml = detailsLines.map((line) => escapeHtml(line)).join("<br>\n");
  const onboardingUrl = getOnboardingGuideUrl();
  const href = escapeHtml(onboardingUrl);

  return `<!DOCTYPE html>
<html>
<body style="font-family: system-ui, -apple-system, Segoe UI, Roboto, sans-serif; font-size: 15px; line-height: 1.5; color: #111;">
<p>${greeting}</p>
<p>Thanks for requesting a quote.</p>
<p>Next we'll reach out to confirm your enquiry before providing a quote. Details below:</p>
<p style="white-space: pre-wrap; margin: 0 0 1em 0;">${detailsHtml}</p>
<p>To make sure we're all on the same page, if you haven't already, please download a copy of our <a href="${href}">Onboarding Guide</a>.</p>
<p>This tool is brand new and under development. We'd love to hear any feedback you have and in fact are offering a 5% discount on prints for this project, should you be so kind. Simply reply to this email with your feedback.</p>
<p>Shot!<br>The FRESH Crew.</p>
</body>
</html>`;
}

async function buildArtworkAttachments(
  project_products: QuotePayload["project_products"]
): Promise<{ filename: string; content: Buffer }[]> {
  const attachments: { filename: string; content: Buffer }[] = [];
  if (!project_products?.length) return attachments;

  for (let i = 0; i < project_products.length; i++) {
    const p = project_products[i];
    for (const pl of p.placements ?? []) {
      const url = pl.artwork_url;
      if (!url) continue;
      const location = (pl.location ?? "placement").replace(/\s+/g, "-");
      const ext = url.match(/\.(png|jpe?g|gif|webp|svg)(\?|$)/i)?.[1] ?? "png";
      const filename = `product${i + 1}-${location}.${ext}`;
      try {
        const res = await fetch(url);
        if (!res.ok) {
          console.warn("[Quote email] Artwork fetch failed:", res.status, url);
          continue;
        }
        const arrayBuffer = await res.arrayBuffer();
        attachments.push({ filename, content: Buffer.from(arrayBuffer) });
      } catch (e) {
        console.warn("[Quote email] Artwork fetch error:", url, e);
      }
    }
  }
  return attachments;
}

export async function sendQuoteEmail(payload: QuotePayload) {
  const { transportOptions, from, notify } = ensureEmailConfig();

  const transporter = nodemailer.createTransport(transportOptions);

  const subject = formatQuoteEmailSubject(payload);
  const text = formatQuoteEmailBody(payload);
  const attachments = await buildArtworkAttachments(payload.project_products);

  await transporter.sendMail({
    from,
    to: notify,
    subject,
    text,
    ...(attachments.length > 0 && { attachments }),
  });

  console.log("[Quote email] Sent to", notify, attachments.length > 0 ? `(${attachments.length} artwork attachment(s))` : "");

  const customerTo = payload.contact_details?.email ?? payload.email;
  const shouldSendCustomer =
    payload.context === "indicative_pricing" || payload.context === "qualified" || !payload.context;
  if (shouldSendCustomer && customerTo) {
    const customerSubject = formatCustomerEmailSubject(payload);
    const customerText = formatCustomerEmailBody(payload);
    const customerHtml = formatCustomerEmailHtml(payload);

    await transporter.sendMail({
      from: customerFromHeader(from),
      to: customerTo,
      replyTo: notify,
      subject: customerSubject,
      text: customerText,
      html: customerHtml,
    });

    console.log("[Customer email] Sent to", customerTo, "(HTML + text, onboarding link only)");
  }
}
