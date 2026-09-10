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

export default function ProjectsPage() {
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

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
    typeof window !== "undefined" ? window.location.origin : "https://github-oauth-login-nine.vercel.app";

  return (
    <AuthGuard>
      <div style={{ maxWidth: 900, margin: "2rem auto", padding: "0 1.5rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <h1 style={{ fontSize: "1.5rem", fontWeight: "bold" }}>My Projects</h1>
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
            + New in Editor
          </Link>
        </div>

        <p style={{ color: "#6b7280", margin: "0.75rem 0 1.5rem" }}>
          Published sites:{" "}
          <code style={{ background: "#f3f4f6", padding: "2px 6px", borderRadius: 4 }}>
            {origin}/p/&#123;project-id&#125;
          </code>
        </p>

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
            }}
          >
            {error}
            <div style={{ marginTop: 8 }}>
              Supabase setup: create project → run <code>supabase-schema.sql</code> → add env vars on
              Vercel → redeploy.
            </div>
          </div>
        )}

        {!loading && !error && projects.length === 0 && (
          <p style={{ color: "#6b7280" }}>
            No projects yet. Open Code Editor → Publish.
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
                  ID: {p.id}
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
