"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
  { id: "llama-3.1-8b-instant", label: "Llama 3.1 8B Instant (fast)" },
  { id: "llama-3.3-70b-versatile", label: "Llama 3.3 70B Versatile" },
  { id: "openai/gpt-oss-20b", label: "GPT-OSS 20B" },
  { id: "openai/gpt-oss-120b", label: "GPT-OSS 120B" },
  { id: "qwen/qwen3-32b", label: "Qwen3 32B" },
  { id: "qwen/qwen3.6-27b", label: "Qwen3.6 27B" },
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
    content:
      "<!DOCTYPE html>\n<html lang=\"en\">\n<head>\n  <meta charset=\"UTF-8\" />\n  <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\" />\n  <title>Preview</title>\n  <link rel=\"stylesheet\" href=\"styles.css\" />\n</head>\n<body>\n  <h1>Hello World</h1>\n  <p>Edit files and click <strong>Run</strong> to preview.</p>\n  <button id=\"btn\">Click me</button>\n  <script src=\"script.js\"></script>\n</body>\n</html>",
  },
  {
    id: "2",
    name: "styles.css",
    language: "css",
    content:
      "body {\n  font-family: system-ui, sans-serif;\n  max-width: 640px;\n  margin: 2rem auto;\n  padding: 0 1rem;\n  background: #0f172a;\n  color: #e2e8f0;\n}\nh1 { color: #38bdf8; }\nbutton {\n  background: #2563eb;\n  color: white;\n  border: none;\n  padding: 0.6rem 1.2rem;\n  border-radius: 8px;\n  cursor: pointer;\n}\nbutton:hover { background: #1d4ed8; }",
  },
  {
    id: "3",
    name: "script.js",
    language: "javascript",
    content:
      'document.getElementById("btn")?.addEventListener("click", () => {\n  alert("JS is running in preview!");\n});',
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

function extractCodeBlocks(text: string): { lang: string; code: string; fileHint?: string }[] {
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

  const loadModelsFromGroq = async (key?: string) => {
    setAiError("");
    const apiKey = (key ?? groqKey).trim();
    if (!apiKey) {
      setAiError("Pehle API key daalo");
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
        setAiError("No models returned for this key");
        return;
      }
      setGroqModels(list);
      if (!list.some((x: { id: string }) => x.id === groqModel)) {
        setGroqModel(list[0].id);
        localStorage.setItem(GROQ_MODEL_STORAGE, list[0].id);
      }
      setSavedMsg(`${list.length} Groq models loaded (free + paid)`);
      setTimeout(() => setSavedMsg(""), 2500);
    } catch (e: any) {
      setAiError(e?.message || "Network error loading models");
    } finally {
      setModelsLoading(false);
    }
  };

  const saveGroqKey = () => {
    localStorage.setItem(GROQ_KEY_STORAGE, groqKey.trim());
    const model = BLOCKED_MODELS.includes(groqModel)
      ? "llama-3.1-8b-instant"
      : groqModel;
    if (model !== groqModel) setGroqModel(model);
    localStorage.setItem(GROQ_MODEL_STORAGE, model);
    setSavedMsg("Saved — loading all models…");
    void loadModelsFromGroq(groqKey.trim());
  };

  const updateContent = (content: string) => {
    if (!active) return;
    setFiles((prev) =>
      prev.map((f) => (f.id === active.id ? { ...f, content } : f))
    );
  };

  const runPreview = () => {
    const html = buildPreviewHtml(files);
    setPreviewHtml(html);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(files));
    setSavedMsg("Running");
    setTimeout(() => setSavedMsg(""), 1000);
  };

  useEffect(() => {
    setPreviewHtml(buildPreviewHtml(files));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
        else if (active) targetName = active.name;
        else targetName = "index.html";
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
  };

  const generateCode = async () => {
    setAiError("");
    setAiRaw("");
    if (!groqKey.trim()) {
      setAiError("Pehle Groq API key daalo aur Save karo");
      return;
    }
    if (!aiPrompt.trim()) {
      setAiError("Prompt likho — kya code chahiye");
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
        setAiError(data?.error || "Groq request failed");
        return;
      }
      setAiRaw(data.content || "");
      if (autoApply && data.content) {
        applyBlocksToEditor(data.content);
        setSavedMsg("AI code applied");
        setTimeout(() => setSavedMsg(""), 2000);
      }
    } catch (e: any) {
      setAiError(e?.message || "Network error");
    } finally {
      setAiLoading(false);
    }
  };

  const addFile = () => {
    const name = prompt("File name (e.g. app.js, extra.css)");
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
    if (files.length <= 1) {
      alert("At least one file required");
      return;
    }
    if (!confirm("Delete this file?")) return;
    const next = files.filter((f) => f.id !== id);
    saveFiles(next);
    if (activeId === id) setActiveId(next[0].id);
  };

  const renameFile = (id: string) => {
    const f = files.find((x) => x.id === id);
    if (!f) return;
    const name = prompt("New file name", f.name);
    if (!name?.trim()) return;
    const next = files.map((x) =>
      x.id === id ? { ...x, name: name.trim(), language: langFromName(name.trim()) } : x
    );
    saveFiles(next);
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

  const btn: React.CSSProperties = {
    padding: "0.4rem 0.75rem",
    borderRadius: 6,
    border: "1px solid #334155",
    background: "#1e293b",
    color: "#e2e8f0",
    cursor: "pointer",
    fontSize: 13,
  };

  return (
    <AuthGuard>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          height: "calc(100vh - 56px)",
          background: "#0b1220",
          color: "#e2e8f0",
        }}
      >
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 8,
            padding: "0.6rem 1rem",
            borderBottom: "1px solid #1e293b",
            alignItems: "center",
            background: "#0f172a",
          }}
        >
          <strong style={{ marginRight: 8 }}>Code Editor</strong>
          <button style={{ ...btn, background: "#16a34a", borderColor: "#16a34a" }} onClick={runPreview}>
            ▶ Run
          </button>
          <button style={btn} onClick={() => saveFiles(files)}>
            💾 Save files
          </button>
          <button style={btn} onClick={openNewTab}>
            ↗ New tab
          </button>
          <button style={btn} onClick={toggleFullscreen}>
            {fullscreen ? "Exit full screen" : "⛶ Full screen"}
          </button>
          <button style={btn} onClick={addFile}>
            + File
          </button>
          <button
            style={{ ...btn, background: showAi ? "#7c3aed" : "#1e293b", borderColor: "#7c3aed" }}
            onClick={() => setShowAi((v) => !v)}
          >
            ✦ AI Agent
          </button>
          {savedMsg && <span style={{ color: "#4ade80", fontSize: 13 }}>{savedMsg}</span>}
        </div>

        <div style={{ display: "flex", flex: 1, minHeight: 0 }}>
          <aside
            style={{
              width: 180,
              borderRight: "1px solid #1e293b",
              background: "#0f172a",
              overflowY: "auto",
              padding: "0.5rem",
            }}
          >
            <div style={{ fontSize: 11, color: "#64748b", marginBottom: 8 }}>FILES</div>
            {files.map((f) => (
              <div key={f.id} style={{ display: "flex", gap: 4, marginBottom: 2 }}>
                <button
                  onClick={() => setActiveId(f.id)}
                  style={{
                    flex: 1,
                    textAlign: "left",
                    padding: "0.35rem 0.45rem",
                    borderRadius: 6,
                    border: "none",
                    background: f.id === activeId ? "#1e3a5f" : "transparent",
                    color: f.id === activeId ? "#93c5fd" : "#cbd5e1",
                    cursor: "pointer",
                    fontSize: 12,
                    fontFamily: "ui-monospace, monospace",
                  }}
                >
                  {f.name}
                </button>
                <button onClick={() => renameFile(f.id)} style={{ ...btn, padding: "0.15rem 0.3rem", fontSize: 10 }}>
                  ✎
                </button>
                <button
                  onClick={() => deleteFile(f.id)}
                  style={{ ...btn, padding: "0.15rem 0.3rem", fontSize: 10, color: "#f87171" }}
                >
                  ×
                </button>
              </div>
            ))}
          </aside>

          {showAi && (
            <aside
              style={{
                width: 300,
                borderRight: "1px solid #1e293b",
                background: "#0f172a",
                display: "flex",
                flexDirection: "column",
                padding: "0.6rem",
                gap: 8,
                overflowY: "auto",
              }}
            >
              <div style={{ fontSize: 12, fontWeight: 600, color: "#c4b5fd" }}>Groq AI Agent</div>

              <label style={{ fontSize: 11, color: "#94a3b8" }}>Groq API Key</label>
              <input
                type="password"
                value={groqKey}
                onChange={(e) => setGroqKey(e.target.value)}
                placeholder="gsk_..."
                style={{
                  width: "100%",
                  padding: "0.45rem",
                  borderRadius: 6,
                  border: "1px solid #334155",
                  background: "#020617",
                  color: "#e2e8f0",
                  fontSize: 12,
                  boxSizing: "border-box",
                }}
              />

              <label style={{ fontSize: 11, color: "#94a3b8" }}>
                Model ({groqModels.length} available)
              </label>
              <select
                value={groqModel}
                onChange={(e) => setGroqModel(e.target.value)}
                size={Math.min(12, Math.max(6, groqModels.length))}
                style={{
                  width: "100%",
                  padding: "0.35rem",
                  borderRadius: 6,
                  border: "1px solid #334155",
                  background: "#020617",
                  color: "#e2e8f0",
                  fontSize: 11,
                  fontFamily: "ui-monospace, monospace",
                }}
              >
                {groqModels.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.label}
                  </option>
                ))}
              </select>

              <button style={{ ...btn, background: "#4f46e5", borderColor: "#4f46e5" }} onClick={saveGroqKey}>
                💾 Save key + load ALL models
              </button>

              <button
                style={{ ...btn, background: "#0ea5e9", borderColor: "#0ea5e9" }}
                onClick={() => loadModelsFromGroq()}
                disabled={modelsLoading}
              >
                {modelsLoading ? "Loading models…" : "↻ Refresh models from Groq API"}
              </button>

              <div style={{ fontSize: 10, color: "#64748b" }}>
                Endpoints: /api/groq/models · /api/groq → api.groq.com
              </div>

              <label style={{ fontSize: 11, color: "#94a3b8" }}>Prompt</label>
              <textarea
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                placeholder="e.g. Make a dark login card with CSS animation"
                rows={4}
                style={{
                  width: "100%",
                  padding: "0.45rem",
                  borderRadius: 6,
                  border: "1px solid #334155",
                  background: "#020617",
                  color: "#e2e8f0",
                  fontSize: 12,
                  resize: "vertical",
                  boxSizing: "border-box",
                }}
              />

              <label style={{ fontSize: 11, color: "#94a3b8", display: "flex", gap: 6, alignItems: "center" }}>
                <input type="checkbox" checked={autoApply} onChange={(e) => setAutoApply(e.target.checked)} />
                Auto-apply to editor
              </label>

              <button
                style={{
                  ...btn,
                  background: aiLoading ? "#475569" : "#7c3aed",
                  borderColor: "#7c3aed",
                  opacity: aiLoading ? 0.8 : 1,
                }}
                disabled={aiLoading}
                onClick={generateCode}
              >
                {aiLoading ? "Generating…" : "✦ Generate code"}
              </button>

              {aiError && (
                <div style={{ color: "#f87171", fontSize: 11, wordBreak: "break-word" }}>{aiError}</div>
              )}

              {aiRaw && (
                <>
                  <div style={{ fontSize: 11, color: "#94a3b8" }}>AI response</div>
                  <pre
                    style={{
                      margin: 0,
                      padding: 8,
                      background: "#020617",
                      borderRadius: 6,
                      fontSize: 10,
                      maxHeight: 160,
                      overflow: "auto",
                      whiteSpace: "pre-wrap",
                      wordBreak: "break-word",
                    }}
                  >
                    {aiRaw.slice(0, 2000)}
                    {aiRaw.length > 2000 ? "…" : ""}
                  </pre>
                  <button
                    style={{ ...btn, background: "#059669", borderColor: "#059669" }}
                    onClick={() => applyBlocksToEditor(aiRaw)}
                  >
                    Apply to editor
                  </button>
                </>
              )}

              <p style={{ fontSize: 10, color: "#64748b", lineHeight: 1.4 }}>
                Key:{" "}
                <a href="https://console.groq.com/keys" target="_blank" rel="noreferrer" style={{ color: "#93c5fd" }}>
                  console.groq.com/keys
                </a>
                . Save key se saare free + paid models API se load hote hain.
              </p>
            </aside>
          )}

          <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
            <div
              style={{
                padding: "0.4rem 0.75rem",
                borderBottom: "1px solid #1e293b",
                fontSize: 12,
                color: "#94a3b8",
                fontFamily: "ui-monospace, monospace",
              }}
            >
              {active?.name} · {active?.language}
            </div>
            <textarea
              value={active?.content || ""}
              onChange={(e) => updateContent(e.target.value)}
              spellCheck={false}
              style={{
                flex: 1,
                width: "100%",
                resize: "none",
                border: "none",
                outline: "none",
                background: "#020617",
                color: "#e2e8f0",
                padding: "1rem",
                fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
                fontSize: 14,
                lineHeight: 1.5,
                tabSize: 2,
              }}
            />
          </div>

          <div
            ref={previewPaneRef}
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              minWidth: 0,
              borderLeft: "1px solid #1e293b",
              background: fullscreen ? "#fff" : "#020617",
            }}
          >
            <div
              style={{
                padding: "0.4rem 0.75rem",
                borderBottom: "1px solid #1e293b",
                fontSize: 12,
                color: "#94a3b8",
                background: "#0f172a",
              }}
            >
              Preview
            </div>
            <iframe
              title="preview"
              sandbox="allow-scripts allow-modals allow-forms allow-same-origin"
              srcDoc={previewHtml}
              style={{ flex: 1, width: "100%", border: "none", background: "white" }}
            />
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}
