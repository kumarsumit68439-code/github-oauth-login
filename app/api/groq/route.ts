import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

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

    const selectedModel = model || "llama-3.1-8b-instant";

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
      return NextResponse.json({ error: msg }, { status: res.status });
    }

    const text = data?.choices?.[0]?.message?.content || "";
    return NextResponse.json({
      ok: true,
      model: selectedModel,
      content: text,
      usage: data?.usage || null,
    });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || "Server error calling Groq" },
      { status: 500 }
    );
  }
}
