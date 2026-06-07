import { NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/auth";

const CATEGORIES = [
  "Clothing",
  "Furniture",
  "Kitchen",
  "Tech",
  "Wellness",
  "Fitness",
  "Decor",
  "Beauty",
  "Utility",
];

export async function POST(request: Request) {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "ANTHROPIC_API_KEY not configured" },
      { status: 503 }
    );
  }

  try {
    const { images } = await request.json();
    if (!images?.length) {
      return NextResponse.json({ error: "images required" }, { status: 400 });
    }

    const content = [
      {
        type: "text",
        text: `You are a moving sale listing assistant. Look at the photo(s) and return ONLY valid JSON with these fields: name (short product name), price (integer CAD, fair used price), category (one of: ${CATEGORIES.join(", ")}), description (1-2 sentences, honest condition, key features). No markdown, no extra text.`,
      },
      ...images.map((b64: string) => ({
        type: "image",
        source: {
          type: "base64",
          media_type: "image/jpeg",
          data: b64.includes(",") ? b64.split(",")[1] : b64,
        },
      })),
    ];

    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 400,
        messages: [{ role: "user", content }],
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error("Anthropic error", err);
      return NextResponse.json(
        { error: "AI generation failed" },
        { status: 502 }
      );
    }

    const data = await res.json();
    const text = data.content?.find((b: { type: string }) => b.type === "text")?.text || "";
    const clean = text.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(clean);

    return NextResponse.json({
      name: parsed.name || "",
      price: parsed.price || 20,
      category: parsed.category || "Utility",
      description: parsed.description || "",
    });
  } catch (error) {
    console.error("POST /api/admin/generate-listing", error);
    return NextResponse.json(
      { error: "Could not auto-fill listing" },
      { status: 500 }
    );
  }
}
