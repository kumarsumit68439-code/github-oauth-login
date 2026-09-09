"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";

const links = [
  { href: "/", label: "Home" },
  { href: "/editor", label: "Code Editor" },
  { href: "/account", label: "Account" },
  { href: "/profile", label: "Profile" },
  { href: "/workspace", label: "Workspace" },
  { href: "/tokens", label: "Tokens" },
];

export default function Navbar() {
  const pathname = usePathname();
  const { data: session } = useSession();

  if (!session) return null;

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
      <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", alignItems: "center" }}>
        <strong style={{ marginRight: "0.5rem" }}>App</strong>
        {links.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            style={{
              color: pathname === l.href || pathname.startsWith(l.href + "/") ? "#93c5fd" : "#e5e7eb",
              textDecoration: "none",
              fontWeight: pathname === l.href ? 600 : 400,
              fontSize: "0.9rem",
            }}
          >
            {l.label}
          </Link>
        ))}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
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
      </div>
    </nav>
  );
}
