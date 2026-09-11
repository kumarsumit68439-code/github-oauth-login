"use client";

import { useSession } from "next-auth/react";
import Link from "next/link";

const ALL_PAGES = [
  { href: "/mcp", title: "MCP Server", desc: "ChatGPT connect + tools for code & projects" },
  { href: "/projects", title: "Projects", desc: "Lovable-style builder · publish live" },
  { href: "/editor", title: "Code Editor", desc: "Multi-file · AI · live preview" },
  { href: "/oauth/docs", title: "OAuth Docs", desc: "Endpoints for other websites" },
  { href: "/oauth/apps", title: "OAuth Apps", desc: "client_id + secret for partners" },
  { href: "/developer", title: "Developer", desc: "Google / GitHub setup" },
  { href: "/login", title: "Login", desc: "Google, GitHub, Email" },
  { href: "/backend", title: "Backend", desc: "User data & projects" },
  { href: "/account", title: "Account", desc: "Provider info" },
  { href: "/profile", title: "Profile", desc: "Avatar & identity" },
  { href: "/workspace", title: "Workspace", desc: "Your space" },
  { href: "/tokens", title: "Tokens", desc: "JWT & access tokens" },
];

export default function Home() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "70vh" }}>
        <div className="gradient-text" style={{ fontWeight: 700 }}>
          Loading…
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 1000, margin: "0 auto", padding: "2.5rem 1.25rem 3.5rem" }}>
      <section className="fade-up" style={{ textAlign: "center", marginBottom: 36 }}>
        <p style={{ color: "#a78bfa", fontWeight: 700, fontSize: 13, letterSpacing: 1.2, marginBottom: 10 }}>
          OAUTH · MCP · BUILDER
        </p>
        <h1
          className="gradient-text"
          style={{ fontSize: "clamp(2rem, 5vw, 3rem)", fontWeight: 900, letterSpacing: "-0.03em", marginBottom: 12 }}
        >
          Premium platform for login, MCP & projects
        </h1>
        <p style={{ color: "var(--muted)", maxWidth: 560, margin: "0 auto 1.5rem", fontSize: 16 }}>
          Google / GitHub OAuth for your apps. ChatGPT MCP can write code into projects. Publish live
          sites with a Lovable-style builder.
        </p>
        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
          <Link href="/projects" className="btn-premium">
            Open Project Builder
          </Link>
          <Link href="/mcp" className="btn-ghost">
            MCP for ChatGPT
          </Link>
          {!session && (
            <Link href="/login" className="btn-ghost">
              Sign in
            </Link>
          )}
        </div>
      </section>

      {session && (
        <div
          className="premium-card fade-up"
          style={{
            display: "flex",
            gap: 16,
            alignItems: "center",
            padding: "1.1rem 1.25rem",
            marginBottom: 28,
          }}
        >
          {session.user?.image && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={session.user.image}
              alt=""
              width={52}
              height={52}
              style={{ borderRadius: "50%", border: "2px solid rgba(167,139,250,0.5)" }}
            />
          )}
          <div>
            <div style={{ fontWeight: 700 }}>{session.user?.name || "User"}</div>
            <div style={{ color: "var(--muted)", fontSize: 14 }}>{session.user?.email}</div>
            <div style={{ color: "#64748b", fontSize: 12 }}>Provider: {session.provider || "—"}</div>
          </div>
        </div>
      )}

      <h2 style={{ fontSize: 14, fontWeight: 700, color: "var(--muted)", marginBottom: 14 }}>
        ALL PAGES
      </h2>
      <div
        className="stagger"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))",
          gap: "0.9rem",
        }}
      >
        {ALL_PAGES.map((c) => (
          <Link
            key={c.href}
            href={c.href}
            className="premium-card fade-up"
            style={{
              display: "block",
              padding: "1.15rem",
              textDecoration: "none",
              color: "inherit",
            }}
          >
            <div style={{ fontWeight: 700, marginBottom: 6 }}>{c.title}</div>
            <div style={{ fontSize: "0.82rem", color: "var(--muted)" }}>{c.desc}</div>
            <div style={{ fontSize: 11, color: "#64748b", marginTop: 8 }}>{c.href}</div>
          </Link>
        ))}
      </div>
    </div>
  );
}
