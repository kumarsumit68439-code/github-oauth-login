"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import AuthGuard from "../components/AuthGuard";

type CodeFile = {
  id: string;
  name: string;
  language: "html" | "css" | "javascript" | "text";
  content: string;
};

const STORAGE_KEY = "code-editor-files-v1";
const GROQ_KEY_STORAGE = "groq-api-key-v1";
const GROQ_MODEL_STORAGE = "groq-model-v1";

const DEFAULT_GROQ_MODELS = [
  { id: "llama-3.1-8b-instant", label: "Llama 3.1 8B Instant" },
  { id: "llama-3.3-70b-versatile", label: "Llama 3.3 70B" },
  { id: "openai/gpt-oss-20b", label: "GPT-OSS 20B" },
  { id: "qwen/qwen3-32b", label: "Qwen3 32B" },
];

const BLOCKED_MODELS = [
  "llama-3.1-70b-versatile",
  "gemma2-9b-it",
  "mixtral-8x7b-32768",
  "llama3-70b-8192",
  "llama3-8b-8192",
];

const defaultFiles: CodeFile[] = [
  {
    id: "1",
    name: "index.html",
    language: "html",
    content: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Preview</title>
  <link rel="stylesheet" href="styles.css" />
</head>
<body>
  <div class="hero">
    <div class="glow"></div>
    <h1>Hello <span>World</span></h1>
    <p>Lovable-style editor · edit · run · preview</p>
    <button id="btn">Click me</button>
  </div>
  <script src="script.js"></script>
</body>
</html>`,
  },
  {
    id: "2",
    name: "styles.css",
    language: "css",
    content: `* { box-sizing: border-box; }
body {
  margin: 0; min-height: 100vh; display: grid; place-items: center;
  font-family: system-ui, sans-serif;
  background: radial-gradient(ellipse at top, #1e1b4b, #020617 70%);
  color: #e2e8f0;
}
.hero { position: relative; text-align: center; padding: 2rem; }
.glow {
  position: absolute; inset: -40%; background: radial-gradient(circle, rgba(139,92,246,.35), transparent 60%);
  filter: blur(40px); z-index: -1; animation: pulse 4s ease-in-out infinite;
}
@keyframes pulse { 50% { opacity: .6; transform: scale(1.05); } }
h1 { font-size: clamp(2rem, 6vw, 3rem); margin: 0 0 .5rem; }
h1 span {
  background: linear-gradient(90deg, #a78bfa, #f472b6, #22d3ee);
  -webkit-background-clip: text; color: transparent;
}
p { color: #94a3b8; }
button {
  margin-top: 1.25rem; padding: .7rem 1.4rem; border: none; border-radius: 999px;
  background: linear-gradient(90deg, #7c3aed, #db2777); color: #fff; font-weight: 600;
  cursor: pointer; box-shadow: 0 10px 30px rgba(124,58,237,.4);
  transition: transform .15s, box-shadow .15s;
}
button:hover { transform: translateY(-2px); box-shadow: 0 14px 36px rgba(219,39,119,.45); }`,
  },
  {
    id: "3",
    name: "script.js",
    language: "javascript",
    content: `document.getElementById("btn")?.addEventListener("click", () => {
  alert("JS is running in live preview!");
});`,
  },
];

function langFromName(name: string): CodeFile["language"] {
  if (name.endsWith(".html") || name.endsWith(".htm")) return "html";
  if (name.endsWith(".css")) return "css";
  if (name.endsWith(".js") || name.endsWith(".mjs")) return "javascript";
  return "text";
}

function buildPreviewHtml(files: CodeFile[]) {
  const htmlFile =
    files.find((f) => f.name === "index.html") ||
    files.find((f) => f.language === "html");
  let html = htmlFile?.content || "<h1>No HTML file</h1>";
  const css = files.filter((f) => f.language === "css").map((f) => f.content).join("\n");
  const js = files.filter((f) => f.language === "javascript").map((f) => f.content).join("\n");
  html = html.replace(/<link[^>]*href=["']([^"']+\.css)["'][^>]*>/gi, () => `<style>\n${css}\n</style>`);
  html = html.replace(/<script[^>]*src=["']([^"']+\.js)["'][^>]*><\/script>/gi, () => "");
  if (!html.includes("<style>") && css) {
    html = html.replace(/<\/head>/i, `<style>\n${css}\n</style>\n</head>`);
  }
  if (js) {
    if (/<\/body>/i.test(html)) html = html.replace(/<\/body>/i, `<script>\n${js}\n</script>\n</body>`);
    else html += `\n<script>\n${js}\n</script>`;
  }
  return html;
}

function extractCodeBlocks(text: string) {
  const blocks: { lang: string; code: string; fileHint?: string }[] = [];
  const re = /```([\w.-]*)\n([\s\S]*?)```/g;
  let m;
  while ((m = re.exec(text)) !== null) {
    let code = m[2].replace(/\n$/, "");
    let fileHint: string | undefined;
    const first = code.split("\n")[0] || "";
    const fileMatch = first.match(/(?:\/\/|#)\s*file:\s*(.+)/i);
    if (fileMatch) {
      fileHint = fileMatch[1].trim();
      code = code.split("\n").slice(1).join("\n");
    }
    blocks.push({ lang: (m[1] || "").toLowerCase(), code, fileHint });
  }
  if (!blocks.length && text.trim()) blocks.push({ lang: "", code: text.trim() });
  return blocks;
}

export default function EditorPage() {
  const [files, setFiles] = useState<CodeFile[]>(defaultFiles);
  const [activeId, setActiveId] = useState("1");
  const [previewHtml, setPreviewHtml] = useState("");
  const [savedMsg, setSavedMsg] = useState("");
  const [fullscreen, setFullscreen] = useState(false);
  const [split, setSplit] = useState(50);
  const [live, setLive] = useState(true);
  const previewPaneRef = useRef<HTMLDivElement>(null);

  const [groqKey, setGroqKey] = useState("");
  const [groqModel, setGroqModel] = useState(DEFAULT_GROQ_MODELS[0].id);
  const [groqModels, setGroqModels] = useState(DEFAULT_GROQ_MODELS);
  const [modelsLoading, setModelsLoading] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState("");
  const [aiRaw, setAiRaw] = useState("");
  const [autoApply, setAutoApply] = useState(true);
  const [showAi, setShowAi] = useState(true);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as CodeFile[];
        if (Array.isArray(parsed) && parsed.length) {
          setFiles(parsed);
          setActiveId(parsed[0].id);
        }
      }
      const k = localStorage.getItem(GROQ_KEY_STORAGE);
      if (k) setGroqKey(k);
      const m = localStorage.getItem(GROQ_MODEL_STORAGE);
      if (m && !BLOCKED_MODELS.includes(m)) setGroqModel(m);
      else if (m && BLOCKED_MODELS.includes(m)) {
        localStorage.setItem(GROQ_MODEL_STORAGE, "llama-3.1-8b-instant");
        setGroqModel("llama-3.1-8b-instant");
      }
    } catch {
      /* ignore */
    }
  }, []);

  const active = useMemo(
    () => files.find((f) => f.id === activeId) || files[0],
    [files, activeId]
  );

  const saveFiles = useCallback((next: CodeFile[]) => {
    setFiles(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    setSavedMsg("Saved");
    setTimeout(() => setSavedMsg(""), 1500);
  }, []);

  const runPreview = useCallback(() => {
    setPreviewHtml(buildPreviewHtml(files));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(files));
    setSavedMsg("Preview running");
    setTimeout(() => setSavedMsg(""), 1000);
  }, [files]);

  useEffect(() => {
    setPreviewHtml(buildPreviewHtml(files));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!live) return;
    const t = setTimeout(() => setPreviewHtml(buildPreviewHtml(files)), 350);
    return () => clearTimeout(t);
  }, [files, live]);

  const loadModelsFromGroq = async (key?: string) => {
    setAiError("");
    const apiKey = (key ?? groqKey).trim();
    if (!apiKey) {
      setAiError("API key required");
      return;
    }
    setModelsLoading(true);
    try {
      const res = await fetch("/api/groq/models", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKey }),
      });
      const data = await res.json();
      if (!res.ok) {
        setAiError(data?.error || "Models load failed");
        return;
      }
      const list = (data.models || []).map((id: string) => ({ id, label: id }));
      if (!list.length) {
        setAiError("No models");
        return;
      }
      setGroqModels(list);
      if (!list.some((x: { id: string }) => x.id === groqModel)) {
        setGroqModel(list[0].id);
        localStorage.setItem(GROQ_MODEL_STORAGE, list[0].id);
      }
      setSavedMsg(`${list.length} models loaded`);
      setTimeout(() => setSavedMsg(""), 2000);
    } catch (e: any) {
      setAiError(e?.message || "Network error");
    } finally {
      setModelsLoading(false);
    }
  };

  const saveGroqKey = () => {
    localStorage.setItem(GROQ_KEY_STORAGE, groqKey.trim());
    const model = BLOCKED_MODELS.includes(groqModel) ? "llama-3.1-8b-instant" : groqModel;
    if (model !== groqModel) setGroqModel(model);
    localStorage.setItem(GROQ_MODEL_STORAGE, model);
    void loadModelsFromGroq(groqKey.trim());
  };

  const updateContent = (content: string) => {
    if (!active) return;
    setFiles((prev) => prev.map((f) => (f.id === active.id ? { ...f, content } : f)));
  };

  const applyBlocksToEditor = (text: string) => {
    const blocks = extractCodeBlocks(text);
    if (!blocks.length) return;
    let next = [...files];
    const applyOne = (block: { lang: string; code: string; fileHint?: string }) => {
      let targetName = block.fileHint;
      if (!targetName) {
        if (block.lang.includes("html")) targetName = "index.html";
        else if (block.lang.includes("css")) targetName = "styles.css";
        else if (block.lang.includes("javascript") || block.lang === "js") targetName = "script.js";
        else targetName = active?.name || "index.html";
      }
      const existing = next.find((f) => f.name === targetName);
      if (existing) {
        next = next.map((f) => (f.name === targetName ? { ...f, content: block.code } : f));
      } else {
        next.push({
          id: String(Date.now() + Math.random()),
          name: targetName,
          language: langFromName(targetName),
          content: block.code,
        });
      }
      return targetName;
    };
    if (blocks.length === 1) {
      const name = applyOne(blocks[0]);
      const f = next.find((x) => x.name === name);
      if (f) setActiveId(f.id);
    } else blocks.forEach(applyOne);
    saveFiles(next);
    setPreviewHtml(buildPreviewHtml(next));
    setSavedMsg("Applied + running");
    setTimeout(() => setSavedMsg(""), 1500);
  };

  const generateCode = async () => {
    setAiError("");
    setAiRaw("");
    if (!groqKey.trim()) {
      setAiError("Save Groq API key first");
      return;
    }
    if (!aiPrompt.trim()) {
      setAiError("Write a prompt");
      return;
    }
    const model = BLOCKED_MODELS.includes(groqModel) ? "llama-3.1-8b-instant" : groqModel;
    setAiLoading(true);
    try {
      const res = await fetch("/api/groq", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          apiKey: groqKey.trim(),
          model,
          prompt: aiPrompt.trim(),
          fileName: active?.name,
          language: active?.language,
          currentCode: active?.content,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setAiError(data?.error || "Failed");
        return;
      }
      setAiRaw(data.content || "");
      if (autoApply && data.content) applyBlocksToEditor(data.content);
    } catch (e: any) {
      setAiError(e?.message || "Network error");
    } finally {
      setAiLoading(false);
    }
  };

  const addFile = () => {
    const name = prompt("File name (e.g. app.js)");
    if (!name?.trim()) return;
    const id = String(Date.now());
    const next = [
      ...files,
      { id, name: name.trim(), language: langFromName(name.trim()), content: "" },
    ];
    saveFiles(next);
    setActiveId(id);
  };

  const deleteFile = (id: string) => {
    if (files.length <= 1) return alert("Need at least one file");
    if (!confirm("Delete file?")) return;
    const next = files.filter((f) => f.id !== id);
    saveFiles(next);
    if (activeId === id) setActiveId(next[0].id);
  };

  const openNewTab = () => {
    const html = buildPreviewHtml(files);
    const blob = new Blob([html], { type: "text/html" });
    window.open(URL.createObjectURL(blob), "_blank", "noopener,noreferrer");
  };

  const toggleFullscreen = async () => {
    const el = previewPaneRef.current;
    if (!el) return;
    if (!document.fullscreenElement) {
      await el.requestFullscreen?.();
      setFullscreen(true);
    } else {
      await document.exitFullscreen?.();
      setFullscreen(false);
    }
  };

  useEffect(() => {
    const onFs = () => setFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", onFs);
    return () => document.removeEventListener("fullscreenchange", onFs);
  }, []);

  const langColor =
    active?.language === "html"
      ? "#f97316"
      : active?.language === "css"
        ? "#38bdf8"
        : active?.language === "javascript"
          ? "#facc15"
          : "#94a3b8";

  return (
    <AuthGuard>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          height: "calc(100vh - 56px)",
          background: "#060912",
          color: "#e2e8f0",
        }}
      >
        <style>{`
          @keyframes editorIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }
          .ed-in { animation: editorIn .4s ease both; }
          .ed-toolbar button:hover { filter: brightness(1.12); transform: translateY(-1px); }
          .ed-file:hover { background: rgba(139,92,246,0.12) !important; }
        `}</style>

        {/* top bar */}
        <div
          className="ed-toolbar"
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 8,
            padding: "0.65rem 1rem",
            borderBottom: "1px solid rgba(148,163,184,0.12)",
            alignItems: "center",
            background: "rgba(11,18,32,0.9)",
            backdropFilter: "blur(12px)",
          }}
        >
          <div style={{ fontWeight: 800, letterSpacing: "-0.02em", marginRight: 6 }}>
            <span
              style={{
                background: "linear-gradient(90deg,#a78bfa,#f472b6)",
                WebkitBackgroundClip: "text",
                color: "transparent",
              }}
            >
              Studio
            </span>
            <span style={{ color: "#64748b", fontWeight: 600, fontSize: 12, marginLeft: 8 }}>
              editor · preview
            </span>
          </div>
          <ToolBtn primary onClick={runPreview}>
            ▶ Run
          </ToolBtn>
          <ToolBtn onClick={() => saveFiles(files)}>Save</ToolBtn>
          <ToolBtn onClick={openNewTab}>New tab</ToolBtn>
          <ToolBtn onClick={toggleFullscreen}>{fullscreen ? "Exit FS" : "Fullscreen"}</ToolBtn>
          <ToolBtn onClick={addFile}>+ File</ToolBtn>
          <ToolBtn active={showAi} onClick={() => setShowAi((v) => !v)}>
            AI
          </ToolBtn>
          <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#94a3b8" }}>
            <input type="checkbox" checked={live} onChange={(e) => setLive(e.target.checked)} />
            Live preview
          </label>
          <Link
            href="/projects"
            style={{
              marginLeft: "auto",
              padding: "0.35rem 0.85rem",
              borderRadius: 999,
              background: "linear-gradient(90deg,#16a34a,#059669)",
              color: "#fff",
              textDecoration: "none",
              fontSize: 12,
              fontWeight: 700,
            }}
          >
            Publish → Projects
          </Link>
          {savedMsg && (
            <span style={{ color: "#4ade80", fontSize: 12, fontWeight: 600 }}>{savedMsg}</span>
          )}
        </div>

        <div style={{ display: "flex", flex: 1, minHeight: 0 }} className="ed-in">
          {/* file tree */}
          <aside
            style={{
              width: 168,
              borderRight: "1px solid rgba(148,163,184,0.1)",
              background: "#0b1220",
              overflowY: "auto",
              padding: "0.6rem",
            }}
          >
            <div style={{ fontSize: 10, color: "#64748b", letterSpacing: 1, marginBottom: 8 }}>FILES</div>
            {files.map((f) => (
              <div key={f.id} style={{ display: "flex", gap: 2, marginBottom: 3 }}>
                <button
                  className="ed-file"
                  onClick={() => setActiveId(f.id)}
                  style={{
                    flex: 1,
                    textAlign: "left",
                    padding: "0.4rem 0.5rem",
                    borderRadius: 8,
                    border: "none",
                    background: f.id === activeId ? "rgba(139,92,246,0.2)" : "transparent",
                    color: f.id === activeId ? "#c4b5fd" : "#cbd5e1",
                    cursor: "pointer",
                    fontSize: 12,
                    fontFamily: "ui-monospace, monospace",
                  }}
                >
                  <span
                    style={{
                      display: "inline-block",
                      width: 6,
                      height: 6,
                      borderRadius: "50%",
                      marginRight: 6,
                      background:
                        f.language === "html"
                          ? "#f97316"
                          : f.language === "css"
                            ? "#38bdf8"
                            : "#facc15",
                    }}
                  />
                  {f.name}
                </button>
                <button
                  onClick={() => deleteFile(f.id)}
                  style={{
                    border: "none",
                    background: "transparent",
                    color: "#64748b",
                    cursor: "pointer",
                    fontSize: 12,
                  }}
                >
                  ×
                </button>
              </div>
            ))}
          </aside>

          {/* AI panel */}
          {showAi && (
            <aside
              style={{
                width: 280,
                borderRight: "1px solid rgba(148,163,184,0.1)",
                background: "linear-gradient(180deg,#0f172a,#0b1220)",
                display: "flex",
                flexDirection: "column",
                padding: "0.65rem",
                gap: 8,
                overflowY: "auto",
              }}
            >
              <div style={{ fontSize: 12, fontWeight: 700, color: "#c4b5fd" }}>✦ AI Agent (Groq)</div>
              <input
                type="password"
                value={groqKey}
                onChange={(e) => setGroqKey(e.target.value)}
                placeholder="gsk_… API key"
                style={field}
              />
              <select
                value={groqModel}
                onChange={(e) => setGroqModel(e.target.value)}
                style={{ ...field, height: 36 }}
              >
                {groqModels.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.label}
                  </option>
                ))}
              </select>
              <button onClick={saveGroqKey} style={aiBtn}>
                {modelsLoading ? "Loading models…" : "Save key + load models"}
              </button>
              <textarea
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                placeholder="Describe UI / feature to generate…"
                rows={4}
                style={{ ...field, resize: "vertical" }}
              />
              <label style={{ fontSize: 11, color: "#94a3b8", display: "flex", gap: 6, alignItems: "center" }}>
                <input type="checkbox" checked={autoApply} onChange={(e) => setAutoApply(e.target.checked)} />
                Auto-apply + run preview
              </label>
              <button
                onClick={generateCode}
                disabled={aiLoading}
                style={{
                  ...aiBtn,
                  background: "linear-gradient(90deg,#7c3aed,#db2777)",
                  opacity: aiLoading ? 0.7 : 1,
                }}
              >
                {aiLoading ? "Generating…" : "Generate code"}
              </button>
              {aiError && <p style={{ color: "#f87171", fontSize: 11 }}>{aiError}</p>}
              {aiRaw && !autoApply && (
                <button onClick={() => applyBlocksToEditor(aiRaw)} style={aiBtn}>
                  Apply to editor
                </button>
              )}
            </aside>
          )}

          {/* code + preview split */}
          <div style={{ flex: 1, display: "flex", minWidth: 0, minHeight: 0 }}>
            <div
              style={{
                width: `${split}%`,
                display: "flex",
                flexDirection: "column",
                borderRight: "1px solid rgba(148,163,184,0.1)",
                minWidth: 200,
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "0.45rem 0.75rem",
                  borderBottom: "1px solid rgba(148,163,184,0.1)",
                  background: "#0b1220",
                  fontSize: 12,
                }}
              >
                <span
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    background: langColor,
                    boxShadow: `0 0 10px ${langColor}`,
                  }}
                />
                <span style={{ fontFamily: "ui-monospace, monospace", color: "#cbd5e1" }}>
                  {active?.name}
                </span>
                <span style={{ color: "#64748b" }}>{active?.language}</span>
              </div>
              <textarea
                value={active?.content || ""}
                onChange={(e) => updateContent(e.target.value)}
                spellCheck={false}
                style={{
                  flex: 1,
                  width: "100%",
                  border: "none",
                  outline: "none",
                  resize: "none",
                  padding: "1rem",
                  background: "#020617",
                  color: "#e2e8f0",
                  fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
                  fontSize: 13.5,
                  lineHeight: 1.55,
                  caretColor: "#a78bfa",
                }}
              />
            </div>

            {/* drag handle visual */}
            <div
              style={{
                width: 6,
                cursor: "col-resize",
                background: "linear-gradient(180deg, transparent, rgba(139,92,246,0.35), transparent)",
              }}
              onMouseDown={(e) => {
                e.preventDefault();
                const startX = e.clientX;
                const start = split;
                const onMove = (ev: MouseEvent) => {
                  const parent = (e.target as HTMLElement).parentElement;
                  if (!parent) return;
                  const w = parent.getBoundingClientRect().width;
                  const delta = ((ev.clientX - startX) / w) * 100;
                  setSplit(Math.min(75, Math.max(25, start + delta)));
                };
                const onUp = () => {
                  window.removeEventListener("mousemove", onMove);
                  window.removeEventListener("mouseup", onUp);
                };
                window.addEventListener("mousemove", onMove);
                window.addEventListener("mouseup", onUp);
              }}
            />

            <div
              ref={previewPaneRef}
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                minWidth: 180,
                background: "#020617",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "0.45rem 0.75rem",
                  borderBottom: "1px solid rgba(148,163,184,0.1)",
                  background: "#0b1220",
                  fontSize: 12,
                  color: "#94a3b8",
                }}
              >
                <span>
                  <span
                    style={{
                      display: "inline-block",
                      width: 7,
                      height: 7,
                      borderRadius: "50%",
                      background: live ? "#34d399" : "#64748b",
                      marginRight: 6,
                      boxShadow: live ? "0 0 8px #34d399" : "none",
                    }}
                  />
                  Live preview
                </span>
                <span style={{ fontSize: 11 }}>sandbox · JS on</span>
              </div>
              <iframe
                title="preview"
                srcDoc={previewHtml}
                sandbox="allow-scripts allow-forms allow-modals allow-same-origin"
                style={{
                  flex: 1,
                  width: "100%",
                  border: "none",
                  background: "#fff",
                  borderRadius: fullscreen ? 0 : "0 0 0 0",
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}

function ToolBtn({
  children,
  onClick,
  primary,
  active,
}: {
  children: React.ReactNode;
  onClick: () => void;
  primary?: boolean;
  active?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        padding: "0.35rem 0.75rem",
        borderRadius: 8,
        border: "1px solid rgba(148,163,184,0.2)",
        background: primary
          ? "linear-gradient(90deg,#16a34a,#059669)"
          : active
            ? "rgba(139,92,246,0.35)"
            : "rgba(30,41,59,0.9)",
        color: "#f1f5f9",
        cursor: "pointer",
        fontSize: 12,
        fontWeight: 600,
        transition: "transform .15s, filter .15s",
      }}
    >
      {children}
    </button>
  );
}

const field: React.CSSProperties = {
  width: "100%",
  padding: "0.5rem 0.6rem",
  borderRadius: 8,
  border: "1px solid #334155",
  background: "#020617",
  color: "#e2e8f0",
  fontSize: 12,
  boxSizing: "border-box",
};

const aiBtn: React.CSSProperties = {
  width: "100%",
  padding: "0.5rem",
  borderRadius: 8,
  border: "none",
  background: "#4f46e5",
  color: "#fff",
  fontWeight: 600,
  fontSize: 12,
  cursor: "pointer",
};
