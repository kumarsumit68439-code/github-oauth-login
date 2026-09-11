"use client";

import { useSession } from "next-auth/react";
import AuthGuard from "../components/AuthGuard";
import { useMemo, useState } from "react";

const DOMAIN = "https://github-oauth-login-nine.vercel.app";

export default function DeveloperDashboardPage() {
  const { data: session } = useSession();
  const [copied, setCopied] = useState("");

  const urls = useMemo(
    () => ({
      homepage: DOMAIN,
      login: `${DOMAIN}/login`,
      nextAuth: `${DOMAIN}/api/auth`,
      googleCallback: `${DOMAIN}/api/auth/callback/google`,
      githubCallback: `${DOMAIN}/api/auth/callback/github`,
      facebookCallback: `${DOMAIN}/api/auth/callback/facebook`,
      openaiCallback: `${DOMAIN}/api/auth/callback/openai`,
    }),
    []
  );

  const copy = async (text: string, key: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(key);
      setTimeout(() => setCopied(""), 1500);
    } catch {
      setCopied("fail");
    }
  };

  const envRows = [
    { name: "NEXTAUTH_URL", value: DOMAIN, note: "Production site URL" },
    { name: "NEXTAUTH_SECRET", value: "(random 32+ chars)", note: "openssl rand -base64 32" },
    { name: "GOOGLE_CLIENT_ID", value: "from Google Cloud Console", note: "OAuth 2.0 Client ID" },
    { name: "GOOGLE_CLIENT_SECRET", value: "from Google Cloud Console", note: "OAuth client secret" },
    { name: "GITHUB_ID", value: "from GitHub OAuth App", note: "Client ID" },
    { name: "GITHUB_SECRET", value: "from GitHub OAuth App", note: "Client secret" },
    { name: "FACEBOOK_CLIENT_ID", value: "optional", note: "Meta app id" },
    { name: "FACEBOOK_CLIENT_SECRET", value: "optional", note: "Meta app secret" },
  ];

  return (
    <AuthGuard>
      <div style={{ maxWidth: 960, margin: "0 auto", padding: "1.5rem 1.25rem 3rem" }}>
        <header style={{ marginBottom: 24 }}>
          <p style={{ color: "#6366f1", fontWeight: 600, fontSize: 13, margin: 0 }}>DEVELOPER</p>
          <h1 style={{ fontSize: "1.75rem", fontWeight: 800, margin: "4px 0 8px" }}>
            OAuth Apps Dashboard
          </h1>
          <p style={{ color: "#64748b", margin: 0, lineHeight: 1.5 }}>
            Google + GitHub OAuth 2.0 setup for this Next.js (App Router) + NextAuth project.
            Logged in as <strong>{session?.user?.email || session?.user?.name || "user"}</strong>
            {session?.provider ? ` via ${session.provider}` : ""}.
          </p>
        </header>

        {/* Live session card */}
        <section style={card}>
          <h2 style={h2}>Live session</h2>
          <div style={grid2}>
            <Field label="Name" value={session?.user?.name || "—"} />
            <Field label="Email" value={session?.user?.email || "—"} />
            <Field label="Provider" value={session?.provider || "—"} />
            <Field label="Account ID" value={session?.providerAccountId || "—"} />
          </div>
          {session?.user?.image && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={session.user.image}
              alt="avatar"
              width={56}
              height={56}
              style={{ borderRadius: 12, marginTop: 12, border: "2px solid #e2e8f0" }}
            />
          )}
        </section>

        {/* Callback URLs */}
        <section style={card}>
          <h2 style={h2}>Configured callbacks & redirect URLs</h2>
          <p style={{ fontSize: 13, color: "#64748b", marginTop: 0 }}>
            Paste these exactly in Google Cloud Console and GitHub Developer Settings.
          </p>
          <UrlRow label="Homepage" value={urls.homepage} onCopy={() => copy(urls.homepage, "home")} copied={copied === "home"} />
          <UrlRow label="Login page" value={urls.login} onCopy={() => copy(urls.login, "login")} copied={copied === "login"} />
          <UrlRow label="Google callback" value={urls.googleCallback} onCopy={() => copy(urls.googleCallback, "g")} copied={copied === "g"} />
          <UrlRow label="GitHub callback" value={urls.githubCallback} onCopy={() => copy(urls.githubCallback, "gh")} copied={copied === "gh"} />
          <UrlRow label="Facebook callback" value={urls.facebookCallback} onCopy={() => copy(urls.facebookCallback, "fb")} copied={copied === "fb"} />
        </section>

        {/* Google steps */}
        <section style={card}>
          <h2 style={h2}>1. Google OAuth App</h2>
          <ol style={ol}>
            <li>
              Open{" "}
              <a href="https://console.cloud.google.com/apis/credentials" target="_blank" rel="noreferrer" style={a}>
                Google Cloud → Credentials
              </a>
            </li>
            <li>Create project (or select one) → <strong>Create Credentials → OAuth client ID</strong></li>
            <li>Application type: <strong>Web application</strong></li>
            <li>
              Authorized JavaScript origins: <code style={code}>{DOMAIN}</code>
            </li>
            <li>
              Authorized redirect URIs:{" "}
              <code style={code}>{urls.googleCallback}</code>
            </li>
            <li>Copy Client ID → Vercel <code style={code}>GOOGLE_CLIENT_ID</code></li>
            <li>Copy Client secret → Vercel <code style={code}>GOOGLE_CLIENT_SECRET</code></li>
            <li>OAuth consent screen: add test users if app is in Testing mode</li>
          </ol>
        </section>

        {/* GitHub steps */}
        <section style={card}>
          <h2 style={h2}>2. GitHub OAuth App</h2>
          <ol style={ol}>
            <li>
              Open{" "}
              <a href="https://github.com/settings/developers" target="_blank" rel="noreferrer" style={a}>
                GitHub → Developer settings → OAuth Apps
              </a>
            </li>
            <li>New OAuth App</li>
            <li>
              Homepage URL: <code style={code}>{DOMAIN}</code>
            </li>
            <li>
              Authorization callback URL: <code style={code}>{urls.githubCallback}</code>
            </li>
            <li>Generate a new client secret</li>
            <li>Client ID → Vercel <code style={code}>GITHUB_ID</code></li>
            <li>Client secret → Vercel <code style={code}>GITHUB_SECRET</code></li>
          </ol>
        </section>

        {/* Env table */}
        <section style={card}>
          <h2 style={h2}>3. Environment variables (Vercel)</h2>
          <p style={{ fontSize: 13, color: "#64748b" }}>
            Vercel → Project → Settings → Environment Variables → Production → Save → Redeploy
          </p>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ background: "#f8fafc", textAlign: "left" }}>
                  <th style={th}>Name</th>
                  <th style={th}>Value</th>
                  <th style={th}>Note</th>
                </tr>
              </thead>
              <tbody>
                {envRows.map((r) => (
                  <tr key={r.name} style={{ borderTop: "1px solid #e2e8f0" }}>
                    <td style={td}>
                      <code style={code}>{r.name}</code>
                    </td>
                    <td style={td}>{r.value}</td>
                    <td style={{ ...td, color: "#64748b" }}>{r.note}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <pre style={pre}>{`NEXTAUTH_URL=${DOMAIN}
NEXTAUTH_SECRET=generate_with_openssl_rand_base64_32
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GITHUB_ID=
GITHUB_SECRET=`}</pre>
        </section>

        {/* Project structure */}
        <section style={card}>
          <h2 style={h2}>4. Project structure (this repo)</h2>
          <pre style={pre}>{`app/
  api/auth/[...nextauth]/route.ts   # NextAuth API routes
  login/page.tsx                    # Sign in UI (Google + GitHub + more)
  page.tsx                          # Homepage (session + links)
  developer/page.tsx                # This dashboard
lib/
  auth.ts                           # Providers, JWT session, callbacks
middleware.ts                       # Bot block + (optional) route guards
`}</pre>
          <p style={{ fontSize: 13, color: "#64748b", marginBottom: 0 }}>
            Stack: Next.js 15 App Router · next-auth v4 · TypeScript · Vercel
          </p>
        </section>

        {/* Deploy steps */}
        <section style={card}>
          <h2 style={h2}>5. Deploy to Vercel (checklist)</h2>
          <ol style={ol}>
            <li>Push this repo to GitHub (already linked)</li>
            <li>Vercel → Import / existing project → Framework: Next.js</li>
            <li>Add all env vars from the table above</li>
            <li>Deploy</li>
            <li>Confirm <code style={code}>NEXTAUTH_URL</code> matches the production domain</li>
            <li>Register Google + GitHub callback URLs (section 1–2)</li>
            <li>Test: <code style={code}>{urls.login}</code> → Sign in with Google / GitHub</li>
          </ol>
        </section>

        <p style={{ fontSize: 12, color: "#94a3b8", textAlign: "center" }}>
          Never commit real client secrets to git. Use Vercel Environment Variables only.
        </p>
      </div>
    </AuthGuard>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div style={{ fontSize: 11, color: "#94a3b8", marginBottom: 2 }}>{label}</div>
      <div style={{ fontSize: 14, fontWeight: 500, wordBreak: "break-all" }}>{value}</div>
    </div>
  );
}

function UrlRow({
  label,
  value,
  onCopy,
  copied,
}: {
  label: string;
  value: string;
  onCopy: () => void;
  copied: boolean;
}) {
  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        gap: 8,
        alignItems: "center",
        padding: "10px 0",
        borderTop: "1px solid #f1f5f9",
      }}
    >
      <div style={{ minWidth: 140, fontSize: 13, fontWeight: 600, color: "#334155" }}>{label}</div>
      <code style={{ ...code, flex: 1, fontSize: 12 }}>{value}</code>
      <button type="button" onClick={onCopy} style={btn}>
        {copied ? "Copied" : "Copy"}
      </button>
    </div>
  );
}

const card: React.CSSProperties = {
  background: "#fff",
  border: "1px solid #e2e8f0",
  borderRadius: 16,
  padding: "1.25rem 1.35rem",
  marginBottom: 16,
  boxShadow: "0 1px 3px rgba(15,23,42,0.04)",
};
const h2: React.CSSProperties = {
  fontSize: "1.1rem",
  fontWeight: 700,
  margin: "0 0 10px",
  color: "#0f172a",
};
const grid2: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
  gap: 12,
};
const ol: React.CSSProperties = {
  margin: "0 0 0 1.1rem",
  padding: 0,
  color: "#334155",
  fontSize: 14,
  lineHeight: 1.7,
};
const a: React.CSSProperties = { color: "#4f46e5", fontWeight: 600 };
const code: React.CSSProperties = {
  background: "#f1f5f9",
  padding: "2px 6px",
  borderRadius: 6,
  fontSize: 12,
  fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
};
const pre: React.CSSProperties = {
  background: "#0f172a",
  color: "#e2e8f0",
  padding: 14,
  borderRadius: 12,
  fontSize: 12,
  overflowX: "auto",
  lineHeight: 1.55,
};
const th: React.CSSProperties = { padding: "8px 10px", fontSize: 12, color: "#64748b" };
const td: React.CSSProperties = { padding: "8px 10px", verticalAlign: "top" };
const btn: React.CSSProperties = {
  padding: "6px 12px",
  borderRadius: 8,
  border: "1px solid #cbd5e1",
  background: "#f8fafc",
  cursor: "pointer",
  fontSize: 12,
  fontWeight: 600,
};
