"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import AuthGuard from "../components/AuthGuard";

type ProjectItem = {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
};

type CodeFile = {
  id: string;
  name: string;
  language: string;
  content: string;
};

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

const STARTER_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>New Project</title>
  <style>
    * { box-sizing: border-box; }
    body {
      margin: 0; min-height: 100vh; display: grid; place-items: center;
      font-family: system-ui, sans-serif;
      background: linear-gradient(135deg, #0f172a, #4c1d95);
      color: #f8fafc;
    }
    .card {
      padding: 2rem 2.5rem; border-radius: 1.25rem;
      background: rgba(15,23,42,0.75); border: 1px solid rgba(255,255,255,0.12);
      text-align: center; max-width: 420px;
    }
    h1 { margin: 0 0 0.5rem; font-size: 1.75rem; }
    p { opacity: 0.85; line-height: 1.5; }
    button {
      margin-top: 1rem; padding: 0.65rem 1.25rem; border: none; border-radius: 999px;
      background: linear-gradient(90deg, #8b5cf6, #ec4899); color: white; font-weight: 600; cursor: pointer;
    }
  </style>
</head>
<body>
  <div class="card">
    <h1>Hello</h1>
    <p>Edit this project in the builder or Code Editor. Publish for a live URL.</p>
    <button onclick="alert('Running!')">Run action</button>
  </div>
</body>
</html>`;

export default function ProjectsPage() {
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [draftHtml, setDraftHtml] = useState(STARTER_HTML);
  const [draftTitle, setDraftTitle] = useState("Untitled app");
  const [lastUrl, setLastUrl] = useState("");
  const [tab, setTab] = useState<"build" | "library">("build");

  const origin =
    typeof window !== "undefined"
      ? window.location.origin
      : "https://github-oauth-login-nine.vercel.app";

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/projects");
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to load");
        setProjects([]);
      } else setProjects(data.projects || []);
    } catch (e: any) {
      setError(e?.message || "Network error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const applyPromptTemplate = () => {
    const p = prompt.trim() || "a modern landing page";
    const safeTitle = draftTitle.replace(/</g, "");
    const safeP = p.replace(/</g, "").slice(0, 80);
    setDraftHtml(
      "<!DOCTYPE html>\n<html lang=\"en\">\n<head>\n<meta charset=\"UTF-8\" />\n<meta name=\"viewport\" content=\"width=device-width, initial-scale=1\" />\n<title>" +
        safeTitle +
        "</title>\n<style>body{margin:0;font-family:system-ui,sans-serif;background:#0b1220;color:#e2e8f0}header{padding:1.25rem 1.5rem;border-bottom:1px solid #1e293b;display:flex;justify-content:space-between}main{max-width:900px;margin:0 auto;padding:3rem 1.5rem}h1{font-size:clamp(2rem,5vw,3rem);background:linear-gradient(90deg,#a78bfa,#f472b6);-webkit-background-clip:text;color:transparent}p{color:#94a3b8;line-height:1.6}.btn{display:inline-block;margin-top:1.5rem;padding:0.75rem 1.35rem;border-radius:999px;background:linear-gradient(90deg,#7c3aed,#db2777);color:#fff;text-decoration:none;font-weight:600}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:1rem;margin-top:2.5rem}.card{background:#0f172a;border:1px solid #1e293b;border-radius:1rem;padding:1.25rem}</style>\n</head>\n<body>\n<header><strong>" +
        safeTitle +
        "</strong><span style=\"color:#64748b\">Live</span></header>\n<main><h1>" +
        safeP +
        "</h1><p>Built with the project builder. Edit HTML, preview live, then Publish.</p><a class=\"btn\" href=\"#\">Get started</a><div class=\"grid\"><div class=\"card\"><h3>Fast</h3><p>Instant preview</p></div><div class=\"card\"><h3>Publish</h3><p>Share /p/id</p></div><div class=\"card\"><h3>Code</h3><p>Full HTML</p></div></div></main>\n</body>\n</html>"
    );
  };

  const publish = async () => {
    setBusy(true);
    setLastUrl("");
    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: draftTitle || "Untitled app",
          html: draftHtml,
          files: [{ id: "1", name: "index.html", language: "html", content: draftHtml }],
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Publish failed");
        if (data.setup) setError(data.error);
        return;
      }
      setLastUrl(data.url);
      await load();
      setTab("library");
    } catch (e: any) {
      alert(e?.message || "Publish error");
    } finally {
      setBusy(false);
    }
  };

  const publishFromEditor = async () => {
    setBusy(true);
    try {
      const raw = localStorage.getItem("code-editor-files-v1");
      if (!raw) {
        alert("Editor empty — open /editor first");
        return;
      }
      const files = JSON.parse(raw) as CodeFile[];
      const html = buildPreviewHtml(files);
      const title = window.prompt("Project title", draftTitle) || "Untitled project";
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, html, files }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Publish failed");
        return;
      }
      setLastUrl(data.url);
      setDraftHtml(html);
      setDraftTitle(title);
      await load();
      setTab("library");
    } catch (e: any) {
      alert(e?.message || "Error");
    } finally {
      setBusy(false);
    }
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this project?")) return;
    const res = await fetch(`/api/projects/${id}`, { method: "DELETE" });
    if (res.ok) load();
  };

  const loadIntoBuilder = async (id: string) => {
    try {
      const res = await fetch(`/api/projects/${id}`);
      if (!res.ok) {
        window.open(`${origin}/p/${id}`, "_blank");
        return;
      }
      const data = await res.json();
      const proj = data.project || data;
      if (proj.html) {
        setDraftHtml(proj.html);
        setDraftTitle(proj.title || "Project");
        setTab("build");
      }
    } catch {
      window.open(`${origin}/p/${id}`, "_blank");
    }
  };

  return (
    <AuthGuard>
      <div style={{ minHeight: "calc(100vh - 56px)", background: "#070b14", color: "#e2e8f0" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0.85rem 1.25rem",
            borderBottom: "1px solid #1e293b",
            gap: 12,
            flexWrap: "wrap",
            background: "#0b1220",
          }}
        >
          <div>
            <div style={{ fontWeight: 800, fontSize: 18 }}>Project Builder</div>
            <div style={{ fontSize: 12, color: "#64748b" }}>Lovable-style · prompt → code → preview → publish</div>
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button type="button" onClick={() => setTab("build")} style={tabBtn(tab === "build")}>
              Build
            </button>
            <button type="button" onClick={() => setTab("library")} style={tabBtn(tab === "library")}>
              Library ({projects.length})
            </button>
            <Link href="/editor" style={{ ...tabBtn(false), textDecoration: "none" }}>
              Full Editor
            </Link>
          </div>
        </div>

        {tab === "build" ? (
          <div
            className="builder-grid"
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              minHeight: "calc(100vh - 120px)",
            }}
          >
            <style>{`@media (max-width: 900px) { .builder-grid { grid-template-columns: 1fr !important; } }`}</style>
            <div style={{ borderRight: "1px solid #1e293b", display: "flex", flexDirection: "column", minHeight: 480 }}>
              <div style={{ padding: 12, borderBottom: "1px solid #1e293b", display: "flex", flexDirection: "column", gap: 8 }}>
                <input value={draftTitle} onChange={(e) => setDraftTitle(e.target.value)} placeholder="App title" style={field} />
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Describe your app… e.g. dark SaaS landing"
                  rows={2}
                  style={{ ...field, resize: "vertical" }}
                />
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <button type="button" onClick={applyPromptTemplate} style={btnPurple}>
                    Generate layout
                  </button>
                  <button type="button" onClick={publish} disabled={busy} style={btnGreen}>
                    {busy ? "Publishing…" : "Publish live"}
                  </button>
                  <button type="button" onClick={publishFromEditor} disabled={busy} style={btnGhost}>
                    Publish from Editor
                  </button>
                </div>
                {lastUrl && (
                  <a href={lastUrl} target="_blank" rel="noreferrer" style={{ color: "#4ade80", fontSize: 13, wordBreak: "break-all" }}>
                    {lastUrl}
                  </a>
                )}
              </div>
              <div style={{ padding: "8px 12px", fontSize: 11, color: "#64748b" }}>HTML code</div>
              <textarea
                value={draftHtml}
                onChange={(e) => setDraftHtml(e.target.value)}
                spellCheck={false}
                style={{
                  flex: 1,
                  width: "100%",
                  border: "none",
                  outline: "none",
                  background: "#020617",
                  color: "#e2e8f0",
                  padding: 14,
                  fontFamily: "ui-monospace, Menlo, monospace",
                  fontSize: 13,
                  lineHeight: 1.5,
                  resize: "none",
                  minHeight: 360,
                }}
              />
            </div>
            <div style={{ display: "flex", flexDirection: "column", background: "#020617" }}>
              <div style={{ padding: "10px 12px", borderBottom: "1px solid #1e293b", fontSize: 12, color: "#94a3b8" }}>
                Live preview
              </div>
              <iframe
                title="preview"
                srcDoc={draftHtml}
                sandbox="allow-scripts allow-forms allow-modals allow-same-origin"
                style={{ flex: 1, width: "100%", border: "none", minHeight: 420, background: "#fff" }}
              />
            </div>
          </div>
        ) : (
          <div style={{ maxWidth: 1100, margin: "0 auto", padding: "1.25rem" }}>
            {loading && <p>Loading…</p>}
            {error && (
              <div style={{ background: "#422006", color: "#fde68a", padding: 12, borderRadius: 10, marginBottom: 12 }}>
                {error}
              </div>
            )}
            {!loading && projects.length === 0 && (
              <p style={{ color: "#64748b" }}>No projects yet — Build tab se publish karo.</p>
            )}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 14 }}>
              {projects.map((p) => {
                const url = `${origin}/p/${p.id}`;
                return (
                  <div key={p.id} style={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: 14, overflow: "hidden" }}>
                    <iframe title={p.title} src={url} sandbox="allow-scripts allow-same-origin" style={{ width: "100%", height: 160, border: "none", background: "#fff", pointerEvents: "none" }} />
                    <div style={{ padding: 12 }}>
                      <div style={{ fontWeight: 700, marginBottom: 4 }}>{p.title}</div>
                      <div style={{ fontSize: 11, color: "#64748b", wordBreak: "break-all" }}>{url}</div>
                      <div style={{ display: "flex", gap: 6, marginTop: 10, flexWrap: "wrap" }}>
                        <a href={url} target="_blank" rel="noreferrer" style={smBtn}>
                          Open
                        </a>
                        <button type="button" onClick={() => loadIntoBuilder(p.id)} style={smBtn}>
                          Edit
                        </button>
                        <button type="button" onClick={() => remove(p.id)} style={{ ...smBtn, color: "#f87171" }}>
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </AuthGuard>
  );
}

function tabBtn(active: boolean): React.CSSProperties {
  return {
    padding: "0.4rem 0.85rem",
    borderRadius: 8,
    border: "1px solid #334155",
    background: active ? "#4f46e5" : "#1e293b",
    color: "#fff",
    cursor: "pointer",
    fontSize: 13,
    fontWeight: 600,
  };
}

const field: React.CSSProperties = {
  width: "100%",
  padding: "0.55rem 0.75rem",
  borderRadius: 8,
  border: "1px solid #334155",
  background: "#020617",
  color: "#e2e8f0",
  fontSize: 14,
  boxSizing: "border-box",
};
const btnPurple: React.CSSProperties = {
  padding: "0.45rem 0.9rem",
  borderRadius: 8,
  border: "none",
  background: "#7c3aed",
  color: "#fff",
  fontWeight: 600,
  cursor: "pointer",
  fontSize: 13,
};
const btnGreen: React.CSSProperties = { ...btnPurple, background: "#16a34a" };
const btnGhost: React.CSSProperties = {
  ...btnPurple,
  background: "#1e293b",
  border: "1px solid #334155",
};
const smBtn: React.CSSProperties = {
  padding: "0.3rem 0.65rem",
  borderRadius: 6,
  border: "1px solid #334155",
  background: "#1e293b",
  color: "#e2e8f0",
  textDecoration: "none",
  fontSize: 12,
  cursor: "pointer",
};
