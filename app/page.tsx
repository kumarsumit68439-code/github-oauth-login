"use client";

import { useSession } from "next-auth/react";
import Link from "next/link";

const ALL_PAGES = [
  { href: "/oauth/docs", title: "OAuth Docs", desc: "Endpoints, curl, flow for other websites", public: true },
  { href: "/oauth/apps", title: "OAuth Apps", desc: "Create client_id + client_secret", public: false },
  { href: "/developer", title: "Developer", desc: "Google/GitHub callbacks & env setup", public: false },
  { href: "/login", title: "Login", desc: "Google, GitHub, Email, Facebook", public: true },
  { href: "/editor", title: "Code Editor", desc: "Files, AI, live preview", public: false },
  { href: "/projects", title: "Projects", desc: "Published projects", public: false },
  { href: "/backend", title: "Backend", desc: "User data & projects", public: false },
  { href: "/account", title: "Account", desc: "Provider & client info", public: false },
  { href: "/profile", title: "Profile", desc: "Name, email, avatar", public: false },
  { href: "/workspace", title: "Workspace", desc: "Workspace area", public: false },
  { href: "/tokens", title: "Tokens", desc: "JWT & access tokens", public: false },
];

export default function Home() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "70vh" }}>
        Loading...
      </div>
    );
  }

  const pages = session ? ALL_PAGES : ALL_PAGES.filter((p) => p.public || p.href === "/oauth/apps" || p.href === "/developer");

  return (
    <div style={{ maxWidth: 960, margin: "0 auto", padding: "2rem 1.25rem 3rem" }}>
      <h1 style={{ fontSize: "1.85rem", fontWeight: 800, marginBottom: 8 }}>
        {session ? "Homepage" : "OAuth Platform"}
      </h1>
      <p style={{ color: "#64748b", marginBottom: 20, lineHeight: 1.55 }}>
        {session
          ? "Saare pages available hain — niche se open karo."
          : "Dusri websites ke liye Google / GitHub login provider. Docs public hain; Apps ke liye login karo."}
      </p>

      {!session && (
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 24 }}>
          <Link href="/login" style={btnPrimary}>
            Sign in
          </Link>
          <Link href="/oauth/docs" style={btnSecondary}>
            OAuth Docs
          </Link>
          <Link href="/oauth/apps" style={btnSecondary}>
            OAuth Apps
          </Link>
        </div>
      )}

      {session && (
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
            <img src={session.user.image} alt="" width={52} height={52} style={{ borderRadius: "50%" }} />
          )}
          <div>
            <div style={{ fontWeight: 700 }}>{session.user?.name || "User"}</div>
            <div style={{ color: "#64748b", fontSize: 14 }}>{session.user?.email}</div>
            <div style={{ color: "#94a3b8", fontSize: 12 }}>Provider: {session.provider || "—"}</div>
          </div>
        </div>
      )}

      <h2 style={{ fontSize: 15, fontWeight: 700, color: "#475569", marginBottom: 12 }}>All pages</h2>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "0.85rem",
        }}
      >
        {pages.map((c) => (
          <Link
            key={c.href}
            href={c.href}
            style={{
              display: "block",
              padding: "1.1rem",
              background: "white",
              borderRadius: "0.75rem",
              boxShadow: "0 4px 12px rgba(0,0,0,0.06)",
              textDecoration: "none",
              color: "inherit",
              border: "1px solid #f1f5f9",
            }}
          >
            <div style={{ fontWeight: 600, marginBottom: 4 }}>{c.title}</div>
            <div style={{ fontSize: "0.82rem", color: "#6b7280" }}>{c.desc}</div>
            <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 6 }}>{c.href}</div>
          </Link>
        ))}
      </div>

      <div style={{ marginTop: 28, fontSize: 13, color: "#64748b" }}>
        <strong>Quick links:</strong>{" "}
        <Link href="/oauth/docs" style={{ color: "#4f46e5" }}>
          /oauth/docs
        </Link>
        {" · "}
        <Link href="/oauth/apps" style={{ color: "#4f46e5" }}>
          /oauth/apps
        </Link>
        {" · "}
        <Link href="/developer" style={{ color: "#4f46e5" }}>
          /developer
        </Link>
        {" · "}
        <Link href="/login" style={{ color: "#4f46e5" }}>
          /login
        </Link>
      </div>
    </div>
  );
}

const btnPrimary: React.CSSProperties = {
  padding: "0.7rem 1.25rem",
  background: "#111827",
  color: "white",
  borderRadius: 10,
  textDecoration: "none",
  fontWeight: 600,
};
const btnSecondary: React.CSSProperties = {
  padding: "0.7rem 1.25rem",
  background: "#fff",
  color: "#111827",
  borderRadius: 10,
  textDecoration: "none",
  fontWeight: 600,
  border: "1px solid #e2e8f0",
};
