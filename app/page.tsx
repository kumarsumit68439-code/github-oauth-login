"use client";

import { useSession, signOut } from "next-auth/react";
import Link from "next/link";

export default function Home() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh" }}>
        <p>Loading...</p>
      </div>
    );
  }

  if (session) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "100vh", gap: "1rem" }}>
        <h1 style={{ fontSize: "1.875rem", fontWeight: "bold" }}>Welcome!</h1>
        <p>Signed in as <strong>{session.user?.name || session.user?.email}</strong></p>
        {session.user?.image && (
          <img src={session.user.image} alt="Avatar" style={{ width: 64, height: 64, borderRadius: "50%" }} />
        )}
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          style={{
            marginTop: "1rem",
            padding: "0.75rem 1.5rem",
            background: "#dc2626",
            color: "white",
            border: "none",
            borderRadius: "0.5rem",
            cursor: "pointer",
            fontWeight: 500,
          }}
        >
          Sign out
        </button>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "100vh", gap: "1.5rem" }}>
      <h1 style={{ fontSize: "1.875rem", fontWeight: "bold" }}>GitHub OAuth Demo</h1>
      <p style={{ color: "#6b7280" }}>You are not signed in.</p>
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