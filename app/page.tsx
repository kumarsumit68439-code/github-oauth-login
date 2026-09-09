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
        }}
      >
        <h1 style={{ fontSize: "1.875rem", fontWeight: "bold" }}>OAuth Demo App</h1>
        <p style={{ color: "#6b7280" }}>GitHub + Google + Email login. Session stays until you logout.</p>
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
    );
  }

  return (
    <AuthGuard>
      <div style={{ maxWidth: 900, margin: "2rem auto", padding: "0 1.5rem" }}>
        <h1 style={{ fontSize: "1.75rem", fontWeight: "bold", marginBottom: "0.5rem" }}>Homepage</h1>
        <p style={{ color: "#6b7280", marginBottom: "1.5rem" }}>
          You are logged in. Session is saved — page refresh will not ask login again.
        </p>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: "1rem",
          }}
        >
          {[
            { href: "/editor", title: "Code Editor", desc: "Files, run, live preview" },
            { href: "/account", title: "Account", desc: "Login provider & client info" },
            { href: "/profile", title: "Profile", desc: "Your name, email, avatar" },
            { href: "/workspace", title: "Workspace", desc: "Your workspace area" },
            { href: "/tokens", title: "Access Tokens", desc: "JWT, access & refresh tokens" },
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

        <div
          style={{
            marginTop: "2rem",
            padding: "1rem",
            background: "#ecfdf5",
            borderRadius: "0.5rem",
            fontSize: "0.9rem",
            color: "#065f46",
          }}
        >
          Logged in via <strong>{session.provider || "unknown"}</strong> · Session persists ~30 days until
          Logout.
        </div>
      </div>
    </AuthGuard>
  );
}
