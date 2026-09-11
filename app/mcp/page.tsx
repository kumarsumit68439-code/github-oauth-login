"use client";

import Link from "next/link";

const BASE = "https://github-oauth-login-nine.vercel.app";

export default function McpPublicPage() {
  const rows = [
    { label: "MCP Server URL (ChatGPT)", url: `${BASE}/api/mcp` },
    { label: "Protected Resource Metadata", url: `${BASE}/.well-known/oauth-protected-resource` },
    { label: "Authorization Server Metadata", url: `${BASE}/.well-known/oauth-authorization-server` },
    { label: "OpenID Configuration", url: `${BASE}/.well-known/openid-configuration` },
    { label: "OAuth Authorize", url: `${BASE}/api/oauth/authorize` },
    { label: "OAuth Token", url: `${BASE}/api/oauth/token` },
    { label: "OAuth Register (DCR)", url: `${BASE}/api/oauth/register` },
    { label: "OAuth UserInfo", url: `${BASE}/api/oauth/userinfo` },
    { label: "OAuth Docs", url: `${BASE}/oauth/docs` },
    { label: "OAuth Apps", url: `${BASE}/oauth/apps` },
  ];

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: "1.5rem 1.25rem 3rem" }}>
      <h1 style={{ fontSize: "1.75rem", fontWeight: 800, marginBottom: 8 }}>MCP Server</h1>
      <p style={{ color: "#64748b", lineHeight: 1.55, marginBottom: 20 }}>
        ChatGPT / MCP clients is URL se connect kar sakte hain. Saari discovery + OAuth endpoints
        neeche listed hain — public / visible.
      </p>

      <div
        style={{
          padding: 14,
          background: "#ecfdf5",
          border: "1px solid #6ee7b7",
          borderRadius: 12,
          marginBottom: 20,
        }}
      >
        <div style={{ fontSize: 12, color: "#065f46", fontWeight: 600 }}>ChatGPT MCP URL</div>
        <code style={{ fontSize: 14, wordBreak: "break-all" }}>{BASE}/api/mcp</code>
      </div>

      <h2 style={{ fontSize: 16, fontWeight: 700 }}>All endpoints (click to open)</h2>
      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 10 }}>
        {rows.map((r) => (
          <a
            key={r.url}
            href={r.url}
            target="_blank"
            rel="noreferrer"
            style={{
              display: "block",
              padding: "12px 14px",
              background: "#fff",
              border: "1px solid #e2e8f0",
              borderRadius: 10,
              textDecoration: "none",
              color: "inherit",
            }}
          >
            <div style={{ fontWeight: 600, fontSize: 14 }}>{r.label}</div>
            <div style={{ fontSize: 12, color: "#4f46e5", wordBreak: "break-all", marginTop: 4 }}>
              {r.url}
            </div>
          </a>
        ))}
      </div>

      <h2 style={{ fontSize: 16, fontWeight: 700, marginTop: 28 }}>Site pages</h2>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 10 }}>
        {[
          "/",
          "/login",
          "/mcp",
          "/oauth/docs",
          "/oauth/apps",
          "/developer",
          "/editor",
          "/projects",
          "/backend",
          "/account",
          "/profile",
          "/workspace",
          "/tokens",
        ].map((p) => (
          <Link
            key={p}
            href={p}
            style={{
              padding: "8px 12px",
              background: "#f8fafc",
              border: "1px solid #e2e8f0",
              borderRadius: 8,
              textDecoration: "none",
              color: "#334155",
              fontSize: 13,
              fontWeight: 500,
            }}
          >
            {p === "/" ? "Home" : p}
          </Link>
        ))}
      </div>

      <h2 style={{ fontSize: 16, fontWeight: 700, marginTop: 28 }}>MCP tools</h2>
      <ul style={{ color: "#334155", lineHeight: 1.7 }}>
        <li>
          <code>list_pages</code> — site pages
        </li>
        <li>
          <code>get_site_info</code> — URLs + user
        </li>
        <li>
          <code>list_oauth_apps</code> — registered apps
        </li>
        <li>
          <code>get_oauth_docs</code> — flow docs
        </li>
      </ul>
    </div>
  );
}
