"use client";

import { useSession } from "next-auth/react";
import AuthGuard from "../../components/AuthGuard";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";

type AppRow = {
  id: string;
  name: string;
  homepage_url: string;
  redirect_uris: string[];
  javascript_origins: string[];
  client_id: string;
  client_secret: string;
  created_at: string;
};

export default function OAuthAppsPage() {
  const { data: session } = useSession();
  const [apps, setApps] = useState<AppRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [created, setCreated] = useState<AppRow | null>(null);

  const [name, setName] = useState("");
  const [homepage, setHomepage] = useState("");
  const [redirects, setRedirects] = useState("");
  const [origins, setOrigins] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/oauth/apps");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      setApps(data.apps || []);
    } catch (e: any) {
      setError(e?.message || "Load failed");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setCreated(null);
    try {
      const res = await fetch("/api/oauth/apps", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          homepage_url: homepage,
          redirect_uris: redirects,
          javascript_origins: origins,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Create failed");
      setCreated(data.app);
      setName("");
      setHomepage("");
      setRedirects("");
      setOrigins("");
      await load();
    } catch (err: any) {
      setError(err?.message || "Error");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (client_id: string) => {
    if (!confirm("Delete this OAuth app?")) return;
    const res = await fetch(`/api/oauth/apps?client_id=${encodeURIComponent(client_id)}`, {
      method: "DELETE",
    });
    if (res.ok) await load();
  };

  return (
    <AuthGuard>
      <div style={{ maxWidth: 900, margin: "0 auto", padding: "1.5rem 1.25rem 3rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
          <div>
            <h1 style={{ fontSize: "1.6rem", fontWeight: 800, margin: 0 }}>OAuth Apps</h1>
            <p style={{ color: "#64748b", margin: "6px 0 0" }}>
              Dusri websites ke liye client_id / client_secret banao ·{" "}
              <Link href="/oauth/docs" style={{ color: "#4f46e5" }}>
                API Docs
              </Link>
            </p>
          </div>
          <div style={{ fontSize: 13, color: "#94a3b8" }}>{session?.user?.email}</div>
        </div>

        {error && (
          <p style={{ color: "#dc2626", background: "#fef2f2", padding: 10, borderRadius: 8, marginTop: 12 }}>
            {error}
          </p>
        )}

        {created && (
          <div
            style={{
              marginTop: 16,
              padding: 14,
              background: "#ecfdf5",
              border: "1px solid #6ee7b7",
              borderRadius: 12,
            }}
          >
            <strong>App created — copy secret now (shown once full)</strong>
            <pre style={preBox}>
              {`client_id: ${created.client_id}
client_secret: ${created.client_secret}
homepage: ${created.homepage_url}
redirect: ${(created.redirect_uris || []).join(", ")}`}
            </pre>
          </div>
        )}

        <form onSubmit={create} style={{ ...card, marginTop: 16 }}>
          <h2 style={{ fontSize: 16, marginTop: 0 }}>New OAuth App</h2>
          <label style={lab}>App name</label>
          <input style={inp} required value={name} onChange={(e) => setName(e.target.value)} placeholder="My Website" />
          <label style={lab}>Homepage URL</label>
          <input
            style={inp}
            required
            value={homepage}
            onChange={(e) => setHomepage(e.target.value)}
            placeholder="https://my-site.com"
          />
          <label style={lab}>Redirect / Callback URLs (one per line)</label>
          <textarea
            style={{ ...inp, minHeight: 72 }}
            required
            value={redirects}
            onChange={(e) => setRedirects(e.target.value)}
            placeholder="https://my-site.com/auth/callback"
          />
          <label style={lab}>JavaScript origins (optional, one per line)</label>
          <textarea
            style={{ ...inp, minHeight: 56 }}
            value={origins}
            onChange={(e) => setOrigins(e.target.value)}
            placeholder="https://my-site.com"
          />
          <button
            type="submit"
            disabled={saving}
            style={{
              marginTop: 8,
              padding: "10px 16px",
              background: "#4f46e5",
              color: "#fff",
              border: "none",
              borderRadius: 10,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            {saving ? "Creating…" : "Create client_id + secret"}
          </button>
        </form>

        <h2 style={{ fontSize: 16, marginTop: 28 }}>Your apps</h2>
        {loading ? (
          <p>Loading…</p>
        ) : apps.length === 0 ? (
          <p style={{ color: "#64748b" }}>No apps yet.</p>
        ) : (
          apps.map((a) => (
            <div key={a.client_id} style={{ ...card, marginBottom: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                <strong>{a.name}</strong>
                <button type="button" onClick={() => remove(a.client_id)} style={{ color: "#dc2626", border: "none", background: "none", cursor: "pointer" }}>
                  Delete
                </button>
              </div>
              <div style={{ fontSize: 13, color: "#475569", marginTop: 8 }}>
                <div>
                  <code>client_id</code>: {a.client_id}
                </div>
                <div>
                  <code>client_secret</code>: {a.client_secret}
                </div>
                <div>Homepage: {a.homepage_url}</div>
                <div>Redirects: {(a.redirect_uris || []).join(", ")}</div>
                <div style={{ marginTop: 8 }}>
                  Authorize URL:{" "}
                  <code style={{ fontSize: 11, wordBreak: "break-all" }}>
                    {`https://github-oauth-login-nine.vercel.app/api/oauth/authorize?client_id=${a.client_id}&redirect_uri=${encodeURIComponent((a.redirect_uris || [])[0] || "")}&response_type=code`}
                  </code>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </AuthGuard>
  );
}

const card: React.CSSProperties = {
  background: "#fff",
  border: "1px solid #e2e8f0",
  borderRadius: 14,
  padding: "1.1rem 1.2rem",
};
const lab: React.CSSProperties = { display: "block", fontSize: 12, color: "#64748b", marginBottom: 4, marginTop: 8 };
const inp: React.CSSProperties = {
  width: "100%",
  padding: "8px 10px",
  borderRadius: 8,
  border: "1px solid #cbd5e1",
  fontSize: 14,
  boxSizing: "border-box",
};
const preBox: React.CSSProperties = {
  background: "#0f172a",
  color: "#e2e8f0",
  padding: 12,
  borderRadius: 8,
  fontSize: 12,
  overflowX: "auto",
};
