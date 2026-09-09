"use client";

import { useSession } from "next-auth/react";
import { useState } from "react";
import AuthGuard from "../components/AuthGuard";

export default function TokensPage() {
  const { data: session, update } = useSession();
  const [copied, setCopied] = useState<string | null>(null);

  const copy = async (label: string, value?: string) => {
    if (!value) return;
    await navigator.clipboard.writeText(value);
    setCopied(label);
    setTimeout(() => setCopied(null), 2000);
  };

  const refreshSession = async () => {
    await update();
    alert("Session / JWT refreshed from server.");
  };

  return (
    <AuthGuard>
      <div style={{ maxWidth: 800, margin: "2rem auto", padding: "0 1.5rem" }}>
        <h1 style={{ fontSize: "1.5rem", fontWeight: "bold", marginBottom: "0.5rem" }}>
          Access Tokens & JWT
        </h1>
        <p style={{ color: "#6b7280", marginBottom: "1rem" }}>
          Provider access token, refresh token, ID token, and session JWT details. Session is stored
          in a secure cookie and lasts ~30 days.
        </p>

        <div
          style={{
            background: "#fef3c7",
            border: "1px solid #fbbf24",
            borderRadius: "0.5rem",
            padding: "0.75rem 1rem",
            marginBottom: "1.5rem",
            fontSize: "0.85rem",
            color: "#92400e",
          }}
        >
          ⚠️ Tokens are sensitive. Do not share them publicly. This page is for demo / debugging only.
        </div>

        <div style={{ display: "flex", gap: "0.75rem", marginBottom: "1.5rem", flexWrap: "wrap" }}>
          <button
            onClick={refreshSession}
            style={{
              padding: "0.5rem 1rem",
              background: "#2563eb",
              color: "white",
              border: "none",
              borderRadius: "0.375rem",
              cursor: "pointer",
            }}
          >
            Regenerate / Refresh JWT Session
          </button>
        </div>

        <TokenBlock
          title="Login Provider"
          value={session?.provider || "—"}
          onCopy={() => copy("provider", session?.provider)}
          copied={copied === "provider"}
        />

        <TokenBlock
          title="Provider Account ID"
          value={session?.providerAccountId || "—"}
          onCopy={() => copy("pid", session?.providerAccountId)}
          copied={copied === "pid"}
        />

        <TokenBlock
          title={`${session?.provider === "google" ? "Google" : session?.provider === "github" ? "GitHub" : "Provider"} Access Token`}
          value={session?.accessToken || "Not available in session"}
          onCopy={() => copy("access", session?.accessToken)}
          copied={copied === "access"}
        />

        <TokenBlock
          title="Refresh Token (Google offline / if issued)"
          value={session?.refreshToken || "Not issued or not stored"}
          onCopy={() => copy("refresh", session?.refreshToken)}
          copied={copied === "refresh"}
        />

        <TokenBlock
          title="ID Token (OpenID — usually Google)"
          value={session?.idToken || "Not available"}
          onCopy={() => copy("id", session?.idToken)}
          copied={copied === "id"}
        />

        <TokenBlock
          title="Token Expiry"
          value={
            session?.expiresAt
              ? `${new Date(session.expiresAt * 1000).toLocaleString()} (unix: ${session.expiresAt})`
              : "Long-lived or not set by provider"
          }
        />

        <div
          style={{
            marginTop: "1.5rem",
            padding: "1rem",
            background: "#f3f4f6",
            borderRadius: "0.5rem",
            fontSize: "0.85rem",
            color: "#374151",
          }}
        >
          <strong>How it works:</strong>
          <ul style={{ marginTop: 8, paddingLeft: 18, lineHeight: 1.7 }}>
            <li>NextAuth uses <strong>JWT strategy</strong> — encrypted session JWT in HTTP-only cookie</li>
            <li>Access token from GitHub/Google is saved inside that JWT on login</li>
            <li>Cookie maxAge = 30 days → refresh / new tab pe login nahi maanga jata</li>
            <li>Logout clears the cookie</li>
            <li>“Regenerate / Refresh JWT Session” re-reads token from server</li>
          </ul>
        </div>
      </div>
    </AuthGuard>
  );
}

function TokenBlock({
  title,
  value,
  onCopy,
  copied,
}: {
  title: string;
  value: string;
  onCopy?: () => void;
  copied?: boolean;
}) {
  return (
    <div style={{ marginBottom: "1rem" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 6,
        }}
      >
        <span style={{ fontSize: "0.8rem", fontWeight: 600, color: "#4b5563" }}>{title}</span>
        {onCopy && value && value !== "—" && !value.startsWith("Not") && (
          <button
            onClick={onCopy}
            style={{
              fontSize: "0.75rem",
              padding: "0.2rem 0.5rem",
              border: "1px solid #d1d5db",
              borderRadius: 4,
              background: copied ? "#d1fae5" : "white",
              cursor: "pointer",
            }}
          >
            {copied ? "Copied" : "Copy"}
          </button>
        )}
      </div>
      <pre
        style={{
          margin: 0,
          padding: "0.75rem",
          background: "#111827",
          color: "#e5e7eb",
          borderRadius: "0.5rem",
          fontSize: "0.75rem",
          overflowX: "auto",
          whiteSpace: "pre-wrap",
          wordBreak: "break-all",
        }}
      >
        {value}
      </pre>
    </div>
  );
}
