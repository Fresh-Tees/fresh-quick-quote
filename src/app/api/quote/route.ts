import { NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { sendQuoteEmail } from "@/lib/email";

/**
 * Persist the lead to Blob storage BEFORE attempting email, so an email
 * outage (e.g. SMTP provider lapse) can never silently lose an enquiry.
 * Stored under leads/ with a random URL suffix.
 */
async function saveLeadBackup(payload: Record<string, unknown>): Promise<boolean> {
  const token =
    process.env.FRESHBLOB_READ_WRITE_TOKEN ?? process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) {
    console.error("[Lead backup] No blob token configured — skipping backup.");
    return false;
  }
  try {
    const name = typeof payload.name === "string" ? payload.name : "lead";
    const slug = name.replace(/[^a-zA-Z0-9]+/g, "-").slice(0, 40) || "lead";
    await put(
      `leads/${Date.now()}-${slug}.json`,
      JSON.stringify(payload, null, 2),
      {
        access: "public",
        token,
        addRandomSuffix: true,
        contentType: "application/json",
      }
    );
    console.log("[Lead backup] Saved lead for", slug);
    return true;
  } catch (e) {
    console.error("[Lead backup] Failed to save lead:", e);
    return false;
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, phone, message, marketingConsent, context, answers, project_purpose, artworkStatus, project_products, contact_details, indicative_pricing_shown, indicativePricingSummary, timestamp, freeEmailLead } = body;

    if (!name || !email) {
      return NextResponse.json(
        { error: "Name and email are required" },
        { status: 400 }
      );
    }

    const payload = {
      name,
      email,
      phone: phone || "",
      message: message || "",
      marketingConsent: !!marketingConsent,
      context,
      answers,
      ...(project_purpose != null && { project_purpose }),
      ...(artworkStatus != null && { artwork_status: artworkStatus }),
      ...(contact_details != null && { contact_details }),
      ...(project_products != null && { project_products }),
      ...(indicative_pricing_shown != null && { indicative_pricing_shown }),
      ...(indicativePricingSummary != null && { indicativePricingSummary }),
      timestamp: timestamp ?? new Date().toISOString(),
      submittedAt: new Date().toISOString(),
      ...(freeEmailLead === true && { freeEmailLead: true }),
    };

    // 1. Save the lead first — this must survive even if email is down.
    const leadSaved = await saveLeadBackup(payload);

    // 2. Then attempt the emails.
    try {
      await sendQuoteEmail(payload);
    } catch (emailErr) {
      console.error("[Quote email] Send failed:", emailErr);
      if (!leadSaved) {
        // Nothing was recorded anywhere — surface the failure.
        throw emailErr;
      }
      // Lead is safely stored; don't show the customer an error.
      return NextResponse.json({ ok: true, emailDeferred: true });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Quote error", err);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
