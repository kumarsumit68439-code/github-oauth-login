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
  <h1>Hello World</h1>
  <p>Edit files and click <strong>Run</strong> to preview.</p>
  <button id="btn">Click me</button>
  <script src="script.js"></script>
</body>
</html>`,
  },
  {
    id: "2",
    name: "styles.css",
    language: "css",
    content: `body {
  font-family: system-ui, sans-serif;
  max-width: 640px;
  margin: 2rem auto;
  padding: 0 1rem;
  background: #0f172a;
  color: #e2e8f0;
}
h1 { color: #38bdf8; }
button {
  background: #2563eb;
  color: white;
  border: none;
  padding: 0.6rem 1.2rem;
  border-radius: 8px;
  cursor: pointer;
}
button:hover { background: #1d4ed8; }`,
  },
  {
    id: "3",
    name: "script.js",
    language: "javascript",
    content: `document.getElementById("btn")?.addEventListener("click", () => {
  alert("JS is running in preview!");
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

  const css = files
    .filter((f) => f.language === "css")
    .map((f) => f.content)
    .join("\n");
  const js = files
    .filter((f) => f.language === "javascript")
    .map((f) => f.content)
    .join("\n");

  // Inline linked css/js for iframe (no separate requests)
  html = html.replace(
    /<link[^>]*href=["']([^"']+\.css)["'][^>]*>/gi,
    () => `<style>\n${css}\n</style>`
  );
  html = html.replace(
    /<script[^>]*src=["']([^"']+\.js)["'][^>]*><\/script>/gi,
    () => ""
  );

  if (!html.includes("<style>") && css) {
    html = html.replace(
      /<\/head>/i,
      `<style>\n${css}\n</style>\n</head>`
    );
  }
  if (js) {
    if (/<\/body>/i.test(html)) {
      html = html.replace(/<\/body>/i, `<script>\n${js}\n</script>\n</body>`);
    } else {
      html += `\n<script>\n${js}\n</script>`;
    }
  }
  return html;
}

export default function EditorPage() {
  const [files, setFiles] = useState<CodeFile[]>(defaultFiles);
  const [activeId, setActiveId] = useState("1");
  const [previewHtml, setPreviewHtml] = useState("");
  const [savedMsg, setSavedMsg] = useState("");
  const [fullscreen, setFullscreen] = useState(false);
  const previewRef = useRef<HTMLIFrameElement>(null);
  const previewPaneRef = useRef<HTMLDivElement>(null);

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
    } catch {
      /* ignore */
    }
  }, []);

  const active = useMemo(
    () => files.find((f) => f.id === activeId) || files[0],
    [files, activeId]
  );

  const saveFiles = useCallback(
    (next: CodeFile[]) => {
      setFiles(next);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      setSavedMsg("Saved");
      setTimeout(() => setSavedMsg(""), 1500);
    },
    []
  );

  const updateContent = (content: string) => {
    if (!active) return;
    const next = files.map((f) =>
      f.id === active.id ? { ...f, content } : f
    );
    setFiles(next);
  };

  const runPreview = () => {
    const html = buildPreviewHtml(files);
    setPreviewHtml(html);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(files));
    setSavedMsg("Running");
    setTimeout(() => setSavedMsg(""), 1000);
  };

  useEffect(() => {
    // initial preview
    setPreviewHtml(buildPreviewHtml(files));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const addFile = () => {
    const name = prompt("File name (e.g. app.js, extra.css)");
    if (!name?.trim()) return;
    const id = String(Date.now());
    const next = [
      ...files,
      {
        id,
        name: name.trim(),
        language: langFromName(name.trim()),
        content: "",
      },
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
      x.id === id
        ? { ...x, name: name.trim(), language: langFromName(name.trim()) }
        : x
    );
    saveFiles(next);
  };

  const openNewTab = () => {
    const html = buildPreviewHtml(files);
    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    window.open(url, "_blank", "noopener,noreferrer");
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
        {/* Toolbar */}
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
          <button
            style={btn}
            onClick={() => {
              saveFiles(files);
            }}
          >
            💾 Save
          </button>
          <button style={btn} onClick={openNewTab}>
            ↗ Preview new tab
          </button>
          <button style={btn} onClick={toggleFullscreen}>
            {fullscreen ? "Exit full screen" : "⛶ Full screen preview"}
          </button>
          <button style={btn} onClick={addFile}>
            + New file
          </button>
          {savedMsg && (
            <span style={{ color: "#4ade80", fontSize: 13 }}>{savedMsg}</span>
          )}
        </div>

        {/* Main */}
        <div style={{ display: "flex", flex: 1, minHeight: 0 }}>
          {/* File tree */}
          <aside
            style={{
              width: 200,
              borderRight: "1px solid #1e293b",
              background: "#0f172a",
              overflowY: "auto",
              padding: "0.5rem",
            }}
          >
            <div style={{ fontSize: 11, color: "#64748b", marginBottom: 8, paddingLeft: 4 }}>
              FILES
            </div>
            {files.map((f) => (
              <div
                key={f.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                  marginBottom: 2,
                }}
              >
                <button
                  onClick={() => setActiveId(f.id)}
                  style={{
                    flex: 1,
                    textAlign: "left",
                    padding: "0.4rem 0.5rem",
                    borderRadius: 6,
                    border: "none",
                    background: f.id === activeId ? "#1e3a5f" : "transparent",
                    color: f.id === activeId ? "#93c5fd" : "#cbd5e1",
                    cursor: "pointer",
                    fontSize: 13,
                    fontFamily: "ui-monospace, monospace",
                  }}
                >
                  {f.name}
                </button>
                <button
                  title="Rename"
                  onClick={() => renameFile(f.id)}
                  style={{ ...btn, padding: "0.2rem 0.35rem", fontSize: 11 }}
                >
                  ✎
                </button>
                <button
                  title="Delete"
                  onClick={() => deleteFile(f.id)}
                  style={{
                    ...btn,
                    padding: "0.2rem 0.35rem",
                    fontSize: 11,
                    color: "#f87171",
                  }}
                >
                  ×
                </button>
              </div>
            ))}
          </aside>

          {/* Editor */}
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

          {/* Preview */}
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
                display: "flex",
                justifyContent: "space-between",
                background: "#0f172a",
              }}
            >
              <span>Preview</span>
              <span style={{ color: "#64748b" }}>Live iframe</span>
            </div>
            <iframe
              ref={previewRef}
              title="preview"
              sandbox="allow-scripts allow-modals allow-forms allow-same-origin"
              srcDoc={previewHtml}
              style={{
                flex: 1,
                width: "100%",
                border: "none",
                background: "white",
              }}
            />
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}
