"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";

const publicLinks = [
  { href: "/", label: "Home" },
  { href: "/mcp", label: "MCP" },
  { href: "/oauth/docs", label: "OAuth Docs" },
  { href: "/oauth/apps", label: "OAuth Apps" },
  { href: "/projects", label: "Projects" },
  { href: "/developer", label: "Developer" },
  { href: "/login", label: "Login" },
];

const authLinks = [
  { href: "/", label: "Home" },
  { href: "/mcp", label: "MCP" },
  { href: "/oauth/docs", label: "Docs" },
  { href: "/oauth/apps", label: "OAuth Apps" },
  { href: "/projects", label: "Projects" },
  { href: "/editor", label: "Editor" },
  { href: "/developer", label: "Developer" },
  { href: "/backend", label: "Backend" },
  { href: "/account", label: "Account" },
  { href: "/profile", label: "Profile" },
  { href: "/tokens", label: "Tokens" },
];

export default function Navbar() {
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const links = session ? authLinks : publicLinks;

  return (
    <nav
      className="nav-premium"
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0.75rem 1.35rem",
        flexWrap: "wrap",
        gap: "0.75rem",
      }}
    >
      <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", alignItems: "center" }}>
        <Link
          href="/"
          style={{
            textDecoration: "none",
            fontWeight: 800,
            letterSpacing: "-0.02em",
            background: "linear-gradient(90deg,#a78bfa,#f472b6)",
            WebkitBackgroundClip: "text",
            color: "transparent",
            marginRight: 6,
          }}
        >
          Platform
        </Link>
        {links.map((l) => {
          const active =
            pathname === l.href || (l.href !== "/" && pathname.startsWith(l.href));
          return (
            <Link
              key={l.href}
              href={l.href}
              style={{
                color: active ? "#c4b5fd" : "#cbd5e1",
                textDecoration: "none",
                fontWeight: active ? 700 : 500,
                fontSize: "0.86rem",
                padding: "0.25rem 0.45rem",
                borderRadius: 8,
                background: active ? "rgba(139,92,246,0.15)" : "transparent",
              }}
            >
              {l.label}
            </Link>
          );
        })}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
        {status === "loading" ? (
          <span style={{ fontSize: "0.85rem", color: "#64748b" }}>…</span>
        ) : session ? (
          <>
            <span style={{ fontSize: "0.85rem", color: "#94a3b8" }}>
              {session.user?.name || session.user?.email}
            </span>
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              style={{
                padding: "0.4rem 0.9rem",
                background: "linear-gradient(90deg,#ef4444,#b91c1c)",
                color: "white",
                border: "none",
                borderRadius: 999,
                cursor: "pointer",
                fontSize: "0.85rem",
                fontWeight: 600,
              }}
            >
              Logout
            </button>
          </>
        ) : (
          <Link href="/login" className="btn-premium" style={{ padding: "0.4rem 1rem", fontSize: "0.85rem" }}>
            Sign in
          </Link>
        )}
      </div>
    </nav>
  );
}
