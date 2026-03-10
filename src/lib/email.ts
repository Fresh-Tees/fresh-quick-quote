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

function formatQuoteEmailSubject(payload: QuotePayload): string {
  const name = payload.name || payload.contact_details?.fullName || "Unknown contact";

  if (payload.freeEmailLead) {
    return `Free-email lead – please call – ${name}`;
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
}

