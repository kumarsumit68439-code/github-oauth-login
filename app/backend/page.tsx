"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import Link from "next/link";
import AuthGuard from "../components/AuthGuard";

type ProjectItem = {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
  user_email?: string;
};

export default function BackendPage() {
  const { data: session } = useSession();
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [supabaseOk, setSupabaseOk] = useState<boolean | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const res = await fetch("/api/projects");
        const data = await res.json();
        if (res.status === 503 && data.setup) {
          setSupabaseOk(false);
          setError(data.error);
          setProjects([]);
        } else if (!res.ok) {
          setSupabaseOk(null);
          setError(data.error || "Failed to load");
        } else {
          setSupabaseOk(true);
          setProjects(data.projects || []);
        }
      } catch (e: any) {
        setError(e?.message || "Network error");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const origin =
    typeof window !== "undefined"
      ? window.location.origin
      : "https://github-oauth-login-nine.vercel.app";

  const row = (label: string, value?: string | null) => (
    <div style={{ marginBottom: 12 }}>
      <div style={{ fontSize: 11, color: "#6b7280", marginBottom: 4 }}>{label}</div>
      <div
        style={{
          fontFamily: "ui-monospace, monospace",
          fontSize: 13,
          wordBreak: "break-all",
          background: "#f9fafb",
          padding: "0.5rem 0.75rem",
          borderRadius: 6,
        }}
      >
        {value || "—"}
      </div>
    </div>
  );

  return (
    <AuthGuard>
      <div style={{ maxWidth: 900, margin: "2rem auto", padding: "0 1.5rem" }}>
        <h1 style={{ fontSize: "1.5rem", fontWeight: "bold", marginBottom: 8 }}>Backend Service</h1>
        <p style={{ color: "#6b7280", marginBottom: 24, fontSize: 14 }}>
          User session + Supabase projects data (server-backed).
        </p>

        {/* Status */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: 12,
            marginBottom: 24,
          }}
        >
          <StatusCard
            title="Auth session"
            ok={!!session}
            text={session ? "Logged in" : "No session"}
          />
          <StatusCard
            title="Supabase backend"
            ok={supabaseOk === true}
            text={
              supabaseOk === true
                ? "Connected"
                : supabaseOk === false
                  ? "Not configured"
                  : loading
                    ? "Checking…"
                    : "Unknown"
            }
          />
          <StatusCard
            title="Projects count"
            ok={projects.length > 0}
            text={String(projects.length)}
          />
        </div>

        {/* User data */}
        <section
          style={{
            background: "white",
            borderRadius: 12,
            padding: "1.25rem",
            boxShadow: "0 4px 12px rgba(0,0,0,0.06)",
            marginBottom: 20,
          }}
        >
          <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>User data</h2>
          {row("Name", session?.user?.name)}
          {row("Email", session?.user?.email)}
          {row("Login provider", session?.provider)}
          {row("Provider account ID", session?.providerAccountId)}
          {row(
            "Token expiry",
            session?.expiresAt
              ? new Date(session.expiresAt * 1000).toLocaleString()
              : "—"
          )}
          {row("Has access token", session?.accessToken ? "Yes (see Tokens page)" : "No")}
          {session?.user?.image && (
            <div style={{ marginTop: 8 }}>
              <div style={{ fontSize: 11, color: "#6b7280", marginBottom: 4 }}>Avatar</div>
              <img
                src={session.user.image}
                alt="avatar"
                style={{ width: 64, height: 64, borderRadius: "50%" }}
              />
            </div>
          )}
        </section>

        {/* Backend services */}
        <section
          style={{
            background: "white",
            borderRadius: 12,
            padding: "1.25rem",
            boxShadow: "0 4px 12px rgba(0,0,0,0.06)",
            marginBottom: 20,
          }}
        >
          <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>API services</h2>
          <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.8, fontSize: 14, color: "#374151" }}>
            <li>
              <code>/api/auth/*</code> — NextAuth (GitHub, Google, Facebook, Firebase email)
            </li>
            <li>
              <code>/api/groq</code> — AI code generate (Groq)
            </li>
            <li>
              <code>/api/projects</code> — list / publish projects (Supabase)
            </li>
            <li>
              <code>/api/projects/[id]</code> — get / update / delete project
            </li>
            <li>
              <code>/p/[id]</code> — public published HTML page
            </li>
          </ul>
        </section>

        {/* Projects data */}
        <section
          style={{
            background: "white",
            borderRadius: 12,
            padding: "1.25rem",
            boxShadow: "0 4px 12px rgba(0,0,0,0.06)",
            marginBottom: 20,
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 16,
              flexWrap: "wrap",
              gap: 8,
            }}
          >
            <h2 style={{ fontSize: 16, fontWeight: 600, margin: 0 }}>User projects (Supabase)</h2>
            <Link href="/projects" style={{ fontSize: 13, color: "#2563eb" }}>
              Manage projects →
            </Link>
          </div>

          {loading && <p style={{ color: "#6b7280" }}>Loading…</p>}
          {error && (
            <p style={{ color: "#b45309", fontSize: 13, background: "#fffbeb", padding: 12, borderRadius: 8 }}>
              {error}
            </p>
          )}
          {!loading && !error && projects.length === 0 && (
            <p style={{ color: "#6b7280", fontSize: 14 }}>
              No projects yet.{" "}
              <Link href="/projects">Publish from Editor</Link>
            </p>
          )}

          {projects.map((p) => (
            <div
              key={p.id}
              style={{
                border: "1px solid #e5e7eb",
                borderRadius: 8,
                padding: "0.75rem 1rem",
                marginBottom: 8,
              }}
            >
              <div style={{ fontWeight: 600 }}>{p.title}</div>
              <div style={{ fontSize: 12, color: "#6b7280", wordBreak: "break-all" }}>id: {p.id}</div>
              <div style={{ fontSize: 12, color: "#6b7280" }}>
                updated: {new Date(p.updated_at).toLocaleString()}
              </div>
              <a
                href={`${origin}/p/${p.id}`}
                target="_blank"
                rel="noreferrer"
                style={{ fontSize: 13, color: "#2563eb" }}
              >
                {origin}/p/{p.id}
              </a>
            </div>
          ))}
        </section>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <Link href="/tokens" style={linkBtn}>
            Tokens page
          </Link>
          <Link href="/account" style={linkBtn}>
            Account
          </Link>
          <Link href="/editor" style={linkBtn}>
            Code Editor
          </Link>
        </div>
      </div>
    </AuthGuard>
  );
}

function StatusCard({
  title,
  ok,
  text,
}: {
  title: string;
  ok: boolean;
  text: string;
}) {
  return (
    <div
      style={{
        background: ok ? "#ecfdf5" : "#f9fafb",
        border: `1px solid ${ok ? "#6ee7b7" : "#e5e7eb"}`,
        borderRadius: 10,
        padding: "1rem",
      }}
    >
      <div style={{ fontSize: 12, color: "#6b7280" }}>{title}</div>
      <div style={{ fontWeight: 600, marginTop: 4, color: ok ? "#065f46" : "#374151" }}>{text}</div>
    </div>
  );
}

const linkBtn: React.CSSProperties = {
  padding: "0.5rem 1rem",
  background: "#111827",
  color: "white",
  borderRadius: 8,
  textDecoration: "none",
  fontSize: 13,
};
