import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

const BLOCKED = new Set([
  "llama-3.1-70b-versatile",
  "llama3-70b-8192",
  "llama3-8b-8192",
  "gemma2-9b-it",
  "mixtral-8x7b-32768",
]);

const FALLBACK = "llama-3.1-8b-instant";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      apiKey,
      model,
      prompt,
      fileName,
      language,
      currentCode,
    } = body as {
      apiKey?: string;
      model?: string;
      prompt?: string;
      fileName?: string;
      language?: string;
      currentCode?: string;
    };

    if (!apiKey?.trim()) {
      return NextResponse.json({ error: "Groq API key required" }, { status: 400 });
    }
    if (!prompt?.trim()) {
      return NextResponse.json({ error: "Prompt required" }, { status: 400 });
    }

    let selectedModel = (model || FALLBACK).trim();
    if (BLOCKED.has(selectedModel)) {
      selectedModel = FALLBACK;
    }

    const system = `You are an expert web developer AI agent.
Generate clean, working code for a browser code editor that supports HTML, CSS, and JavaScript.
Rules:
- Output ONLY the code for the requested file when possible, inside a single markdown code fence.
- Language tag must match: html, css, or javascript.
- If user asks for a full page, you may return multiple fences named like index.html, styles.css, script.js using comments on first line: // file: name
- No long explanations outside code fences.
- Current file: ${fileName || "unknown"} (${language || "text"}).`;

    const userContent = currentCode
      ? `User request:\n${prompt}\n\nCurrent file content (${fileName}):\n\`\`\`\n${currentCode}\n\`\`\``
      : `User request:\n${prompt}`;

    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey.trim()}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: selectedModel,
        temperature: 0.4,
        max_tokens: 4096,
        messages: [
          { role: "system", content: system },
          { role: "user", content: userContent },
        ],
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      const msg =
        data?.error?.message || data?.message || `Groq error ${res.status}`;
      return NextResponse.json(
        {
          error: msg,
          model_tried: selectedModel,
          hint: "Click Load models from Groq and pick a live model",
        },
        { status: res.status }
      );
    }

    const text = data?.choices?.[0]?.message?.content || "";
    return NextResponse.json({
      ok: true,
      model: selectedModel,
      content: text,
      usage: data?.usage || null,
      endpoint: "https://api.groq.com/openai/v1/chat/completions",
    });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || "Server error calling Groq" },
      { status: 500 }
    );
  }
}
