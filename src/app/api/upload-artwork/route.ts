import { put } from "@vercel/blob";
import { NextResponse } from "next/server";

const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = [
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/gif",
  "image/webp",
  "image/svg+xml",
];

export async function POST(request: Request) {
  // Support either env var name to avoid Vercel project mismatches.
  // Prefer the standard name but fall back to the FreshTees-specific one.
  const token = process.env.BLOB_READ_WRITE_TOKEN ?? process.env.FRESHBLOB_READ_WRITE_TOKEN;
  if (!token) {
    return NextResponse.json(
      {
        error:
          "Artwork upload is not configured (missing BLOB_READ_WRITE_TOKEN or FRESHBLOB_READ_WRITE_TOKEN).",
      },
      { status: 503 }
    );
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json(
      { error: "Invalid form data." },
      { status: 400 }
    );
  }

  const file = formData.get("file") ?? formData.get("artwork");
  if (!file || !(file instanceof File)) {
    return NextResponse.json(
      { error: "No file provided. Use form field 'file' or 'artwork'." },
      { status: 400 }
    );
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json(
      { error: "Invalid file type. Allowed: PNG, JPEG, GIF, WebP, SVG." },
      { status: 400 }
    );
  }

  if (file.size > MAX_SIZE_BYTES) {
    return NextResponse.json(
      { error: "File too large. Maximum size is 5MB." },
      { status: 400 }
    );
  }

  try {
    const blob = await put(`artwork/${Date.now()}-${file.name}`, file, {
      access: "public",
      token,
    });
    return NextResponse.json({ url: blob.url });
  } catch (e) {
    const message =
      e instanceof Error
        ? e.message
        : typeof e === "string"
          ? e
          : "Unknown error";
    console.error("Upload error:", e);
    return NextResponse.json(
      {
        error: "Upload failed. Please try again.",
        details: message,
      },
      { status: 500 }
    );
  }
}
