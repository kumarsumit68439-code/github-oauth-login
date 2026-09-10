import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const apiKey = (body.apiKey as string)?.trim();
    if (!apiKey) {
      return NextResponse.json({ error: "API key required" }, { status: 400 });
    }

    const res = await fetch("https://api.groq.com/openai/v1/models", {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
    });

    const data = await res.json();
    if (!res.ok) {
      return NextResponse.json(
        { error: data?.error?.message || `Groq models error ${res.status}` },
        { status: res.status }
      );
    }

    // Chat-capable models only (skip whisper / guards if possible)
    const models = (data?.data || [])
      .map((m: { id: string }) => m.id)
      .filter((id: string) => {
        const lower = id.toLowerCase();
        if (lower.includes("whisper")) return false;
        if (lower.includes("prompt-guard")) return false;
        if (lower.includes("guard")) return false;
        if (lower.includes("orpheus")) return false;
        return true;
      })
      .sort();

    return NextResponse.json({ models });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Failed to list models" }, { status: 500 });
  }
}
