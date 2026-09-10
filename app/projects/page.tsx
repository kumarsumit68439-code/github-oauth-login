"use client";

import { useEffect, useState } from "react";
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

export default function ProjectsPage() {
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [publishing, setPublishing] = useState(false);
  const [lastUrl, setLastUrl] = useState("");

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/projects");
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to load");
        setProjects([]);
      } else {
        setProjects(data.projects || []);
      }
    } catch (e: any) {
      setError(e?.message || "Network error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const publishFromEditor = async () => {
    setPublishing(true);
    setLastUrl("");
    try {
      const raw = localStorage.getItem("code-editor-files-v1");
      if (!raw) {
        alert("Editor mein koi files nahi mili. Pehle /editor pe code banao aur Save karo.");
        return;
      }
      const files = JSON.parse(raw) as CodeFile[];
      const html = buildPreviewHtml(files);
      const title =
        prompt("Project title", "My website") || "Untitled project";

      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, html, files }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Publish failed");
        if (data.setup) setError(data.error);
        return;
      }
      setLastUrl(data.url);
      await load();
      if (confirm(`Published!\n\n${data.url}\n\nOpen now?`)) {
        window.open(data.url, "_blank");
      }
    } catch (e: any) {
      alert(e?.message || "Publish error");
    } finally {
      setPublishing(false);
    }
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this published project?")) return;
    const res = await fetch(`/api/projects/${id}`, { method: "DELETE" });
    if (res.ok) load();
    else {
      const d = await res.json();
      alert(d.error || "Delete failed");
    }
  };

  const origin =
    typeof window !== "undefined"
      ? window.location.origin
      : "https://github-oauth-login-nine.vercel.app";

  return (
    <AuthGuard>
      <div style={{ maxWidth: 900, margin: "2rem auto", padding: "0 1.5rem" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 12,
            flexWrap: "wrap",
          }}
        >
          <h1 style={{ fontSize: "1.5rem", fontWeight: "bold" }}>My Projects</h1>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button
              onClick={publishFromEditor}
              disabled={publishing}
              style={{
                padding: "0.5rem 1rem",
                background: "#16a34a",
                color: "white",
                border: "none",
                borderRadius: 8,
                cursor: publishing ? "wait" : "pointer",
                fontSize: 14,
                fontWeight: 600,
              }}
            >
              {publishing ? "Publishing…" : "🚀 Publish from Editor"}
            </button>
            <Link
              href="/editor"
              style={{
                padding: "0.5rem 1rem",
                background: "#7c3aed",
                color: "white",
                borderRadius: 8,
                textDecoration: "none",
                fontSize: 14,
              }}
            >
              Open Editor
            </Link>
          </div>
        </div>

        <p style={{ color: "#6b7280", margin: "0.75rem 0 1rem", fontSize: 14 }}>
          Har publish par naya URL milta hai:{" "}
          <code style={{ background: "#f3f4f6", padding: "2px 6px", borderRadius: 4 }}>
            {origin}/p/&#123;project-id&#125;
          </code>
        </p>

        {lastUrl && (
          <div
            style={{
              background: "#ecfdf5",
              border: "1px solid #6ee7b7",
              padding: "0.75rem 1rem",
              borderRadius: 8,
              marginBottom: 16,
              fontSize: 14,
              wordBreak: "break-all",
            }}
          >
            Last published:{" "}
            <a href={lastUrl} target="_blank" rel="noreferrer">
              {lastUrl}
            </a>
          </div>
        )}

        {loading && <p>Loading…</p>}
        {error && (
          <div
            style={{
              background: "#fef3c7",
              border: "1px solid #fbbf24",
              padding: "1rem",
              borderRadius: 8,
              color: "#92400e",
              fontSize: 14,
              marginBottom: 16,
            }}
          >
            <strong>{error}</strong>
            <ol style={{ marginTop: 8, paddingLeft: 18, lineHeight: 1.6 }}>
              <li>
                <a href="https://supabase.com" target="_blank" rel="noreferrer">
                  supabase.com
                </a>{" "}
                pe free project banao
              </li>
              <li>SQL Editor mein repo ka <code>supabase-schema.sql</code> chalao</li>
              <li>
                Vercel env: <code>NEXT_PUBLIC_SUPABASE_URL</code> +{" "}
                <code>SUPABASE_SERVICE_ROLE_KEY</code> (ya ANON key)
              </li>
              <li>Redeploy</li>
            </ol>
          </div>
        )}

        {!loading && !error && projects.length === 0 && (
          <p style={{ color: "#6b7280" }}>
            Abhi koi published project nahi. Editor mein code banao → yahan{" "}
            <strong>Publish from Editor</strong> dabao.
          </p>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {projects.map((p) => {
            const url = `${origin}/p/${p.id}`;
            return (
              <div
                key={p.id}
                style={{
                  background: "white",
                  borderRadius: 12,
                  padding: "1rem 1.25rem",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.06)",
                }}
              >
                <div style={{ fontWeight: 600, marginBottom: 6 }}>{p.title}</div>
                <div style={{ fontSize: 12, color: "#6b7280", wordBreak: "break-all" }}>
                  Project ID: {p.id}
                </div>
                <a href={url} target="_blank" rel="noreferrer" style={{ fontSize: 13, color: "#2563eb" }}>
                  {url}
                </a>
                <div style={{ marginTop: 10, display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <a
                    href={url}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      padding: "0.35rem 0.75rem",
                      background: "#111827",
                      color: "white",
                      borderRadius: 6,
                      textDecoration: "none",
                      fontSize: 13,
                    }}
                  >
                    Open page
                  </a>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(url);
                      alert("URL copied");
                    }}
                    style={{
                      padding: "0.35rem 0.75rem",
                      border: "1px solid #d1d5db",
                      borderRadius: 6,
                      background: "white",
                      cursor: "pointer",
                      fontSize: 13,
                    }}
                  >
                    Copy URL
                  </button>
                  <button
                    onClick={() => remove(p.id)}
                    style={{
                      padding: "0.35rem 0.75rem",
                      border: "none",
                      borderRadius: 6,
                      background: "#fee2e2",
                      color: "#b91c1c",
                      cursor: "pointer",
                      fontSize: 13,
                    }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </AuthGuard>
  );
}
