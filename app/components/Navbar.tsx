"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";

const publicLinks = [
  { href: "/", label: "Home" },
  { href: "/oauth/docs", label: "OAuth Docs" },
  { href: "/oauth/apps", label: "OAuth Apps" },
  { href: "/developer", label: "Developer" },
  { href: "/login", label: "Login" },
];

const authLinks = [
  { href: "/", label: "Home" },
  { href: "/oauth/docs", label: "OAuth Docs" },
  { href: "/oauth/apps", label: "OAuth Apps" },
  { href: "/developer", label: "Developer" },
  { href: "/editor", label: "Code Editor" },
  { href: "/projects", label: "Projects" },
  { href: "/backend", label: "Backend" },
  { href: "/account", label: "Account" },
  { href: "/profile", label: "Profile" },
  { href: "/workspace", label: "Workspace" },
  { href: "/tokens", label: "Tokens" },
];

export default function Navbar() {
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const links = session ? authLinks : publicLinks;

  return (
    <nav
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0.75rem 1.5rem",
        background: "#111827",
        color: "white",
        flexWrap: "wrap",
        gap: "0.75rem",
      }}
    >
      <div style={{ display: "flex", gap: "0.85rem", flexWrap: "wrap", alignItems: "center" }}>
        <strong style={{ marginRight: "0.35rem" }}>App</strong>
        {links.map((l) => {
          const active =
            pathname === l.href || (l.href !== "/" && pathname.startsWith(l.href));
          return (
            <Link
              key={l.href}
              href={l.href}
              style={{
                color: active ? "#93c5fd" : "#e5e7eb",
                textDecoration: "none",
                fontWeight: active ? 600 : 400,
                fontSize: "0.88rem",
              }}
            >
              {l.label}
            </Link>
          );
        })}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
        {status === "loading" ? (
          <span style={{ fontSize: "0.85rem", color: "#9ca3af" }}>…</span>
        ) : session ? (
          <>
            <span style={{ fontSize: "0.85rem", color: "#9ca3af" }}>
              {session.user?.name || session.user?.email}
            </span>
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              style={{
                padding: "0.4rem 0.9rem",
                background: "#dc2626",
                color: "white",
                border: "none",
                borderRadius: "0.375rem",
                cursor: "pointer",
                fontSize: "0.85rem",
              }}
            >
              Logout
            </button>
          </>
        ) : (
          <Link
            href="/login"
            style={{
              padding: "0.4rem 0.9rem",
              background: "#4f46e5",
              color: "white",
              borderRadius: "0.375rem",
              textDecoration: "none",
              fontSize: "0.85rem",
              fontWeight: 600,
            }}
          >
            Sign in
          </Link>
        )}
      </div>
    </nav>
  );
}
