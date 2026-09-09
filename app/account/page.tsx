"use client";

import { useSession } from "next-auth/react";
import AuthGuard from "../components/AuthGuard";

export default function AccountPage() {
  const { data: session } = useSession();

  return (
    <AuthGuard>
      <div style={{ maxWidth: 720, margin: "2rem auto", padding: "0 1.5rem" }}>
        <h1 style={{ fontSize: "1.5rem", fontWeight: "bold", marginBottom: "1rem" }}>Account</h1>
        <p style={{ color: "#6b7280", marginBottom: "1.5rem" }}>
          Auth provider, client callback info, and account identifiers.
        </p>

        <div
          style={{
            background: "white",
            borderRadius: "0.75rem",
            padding: "1.5rem",
            boxShadow: "0 4px 12px rgba(0,0,0,0.06)",
            display: "flex",
            flexDirection: "column",
            gap: "1rem",
          }}
        >
          <Row label="Login Provider" value={session?.provider || "—"} />
          <Row label="Provider Account ID" value={session?.providerAccountId || "—"} />
          <Row label="User Name" value={session?.user?.name || "—"} />
          <Row label="Email" value={session?.user?.email || "—"} />
          <Row
            label="Auth Callback (GitHub)"
            value="https://github-oauth-login-nine.vercel.app/api/auth/callback/github"
          />
          <Row
            label="Auth Callback (Google)"
            value="https://github-oauth-login-nine.vercel.app/api/auth/callback/google"
          />
          <Row label="NEXTAUTH_URL" value="https://github-oauth-login-nine.vercel.app" />
          <Row
            label="Token Expires At"
            value={
              session?.expiresAt
                ? new Date(session.expiresAt * 1000).toLocaleString()
                : "Not set / long-lived"
            }
          />
        </div>
      </div>
    </AuthGuard>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div style={{ fontSize: "0.75rem", color: "#6b7280", marginBottom: 4 }}>{label}</div>
      <div
        style={{
          fontFamily: "ui-monospace, monospace",
          fontSize: "0.85rem",
          wordBreak: "break-all",
          background: "#f9fafb",
          padding: "0.5rem 0.75rem",
          borderRadius: "0.375rem",
        }}
      >
        {value}
      </div>
    </div>
  );
}
