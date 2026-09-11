"use client";

import { useSession } from "next-auth/react";
import Link from "next/link";
import AuthGuard from "./components/AuthGuard";

export default function Home() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "80vh" }}>
        Loading...
      </div>
    );
  }

  if (!session) {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "80vh",
          gap: "1.5rem",
          padding: "0 1rem",
        }}
      >
        <h1 style={{ fontSize: "1.875rem", fontWeight: "bold" }}>OAuth Demo App</h1>
        <p style={{ color: "#6b7280", textAlign: "center" }}>
          Google + GitHub OAuth 2.0 · Next.js App Router · NextAuth
        </p>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center" }}>
          <Link
            href="/login"
            style={{
              padding: "0.75rem 1.5rem",
              background: "#111827",
              color: "white",
              borderRadius: "0.5rem",
              textDecoration: "none",
              fontWeight: 500,
            }}
          >
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <AuthGuard>
      <div style={{ maxWidth: 900, margin: "2rem auto", padding: "0 1.5rem" }}>
        <h1 style={{ fontSize: "1.75rem", fontWeight: "bold", marginBottom: "0.5rem" }}>Homepage</h1>
        <p style={{ color: "#6b7280", marginBottom: "1rem" }}>
          Signed in · session persists until logout.
        </p>

        <div
          style={{
            display: "flex",
            gap: 16,
            alignItems: "center",
            padding: "1rem",
            background: "#fff",
            borderRadius: 12,
            border: "1px solid #e2e8f0",
            marginBottom: 20,
          }}
        >
          {session.user?.image && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={session.user.image}
              alt=""
              width={56}
              height={56}
              style={{ borderRadius: "50%" }}
            />
          )}
          <div>
            <div style={{ fontWeight: 700 }}>{session.user?.name || "User"}</div>
            <div style={{ color: "#64748b", fontSize: 14 }}>{session.user?.email}</div>
            <div style={{ color: "#94a3b8", fontSize: 12, marginTop: 2 }}>
              Provider: {session.provider || "—"}
            </div>
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: "1rem",
          }}
        >
          {[
            { href: "/developer", title: "Developer", desc: "OAuth apps, callbacks, env setup" },
            { href: "/editor", title: "Code Editor", desc: "Files, run, live preview" },
            { href: "/account", title: "Account", desc: "Login provider & client info" },
            { href: "/profile", title: "Profile", desc: "Your name, email, avatar" },
            { href: "/workspace", title: "Workspace", desc: "Your workspace area" },
            { href: "/tokens", title: "Access Tokens", desc: "JWT, access & refresh tokens" },
            { href: "/backend", title: "Backend", desc: "User data & projects" },
            { href: "/projects", title: "Projects", desc: "Published projects" },
          ].map((c) => (
            <Link
              key={c.href}
              href={c.href}
              style={{
                display: "block",
                padding: "1.25rem",
                background: "white",
                borderRadius: "0.75rem",
                boxShadow: "0 4px 12px rgba(0,0,0,0.06)",
                textDecoration: "none",
                color: "inherit",
              }}
            >
              <div style={{ fontWeight: 600, marginBottom: "0.35rem" }}>{c.title}</div>
              <div style={{ fontSize: "0.875rem", color: "#6b7280" }}>{c.desc}</div>
            </Link>
          ))}
        </div>
      </div>
    </AuthGuard>
  );
}
