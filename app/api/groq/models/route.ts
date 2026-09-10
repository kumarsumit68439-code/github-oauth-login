import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

/** Models decommissioned by Groq — never return these */
const BLOCKED = new Set([
  "llama-3.1-70b-versatile",
  "llama3-70b-8192",
  "llama3-8b-8192",
  "llama-3.2-1b-preview",
  "llama-3.2-3b-preview",
  "llama-3.2-11b-vision-preview",
  "llama-3.2-90b-vision-preview",
  "gemma-7b-it",
  "gemma2-9b-it",
  "mixtral-8x7b-32768",
]);

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

    // Return ALL models from Groq account (free + paid), skip only clearly non-chat
    const models = (data?.data || [])
      .map((m: { id: string; owned_by?: string }) => ({
        id: m.id,
        owned_by: m.owned_by || "",
      }))
      .filter((m: { id: string }) => {
        const id = m.id;
        const lower = id.toLowerCase();
        if (BLOCKED.has(id) || BLOCKED.has(lower)) return false;
        if (lower.includes("whisper")) return false;
        if (lower.includes("tts") || lower.includes("orpheus")) return false;
        if (lower.includes("prompt-guard")) return false;
        return true;
      })
      .sort((a: { id: string }, b: { id: string }) => a.id.localeCompare(b.id));

    return NextResponse.json({
      models: models.map((m: { id: string }) => m.id),
      count: models.length,
      endpoint: "https://api.groq.com/openai/v1/models",
      chat_endpoint: "https://api.groq.com/openai/v1/chat/completions",
    });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Failed to list models" }, { status: 500 });
  }
}
