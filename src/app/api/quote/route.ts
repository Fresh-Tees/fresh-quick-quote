import { NextResponse } from "next/server";
import { sendQuoteEmail } from "@/lib/email";

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

    await sendQuoteEmail(payload);

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Quote error", err);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
