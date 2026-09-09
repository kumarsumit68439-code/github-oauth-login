"use client";

import { useSession } from "next-auth/react";
import { useState } from "react";
import AuthGuard from "../components/AuthGuard";

function mask(value?: string) {
  if (!value || value.length < 12) return value || "—";
  return value.slice(0, 6) + "••••••••••••" + value.slice(-4);
}

export default function TokensPage() {
  const { data: session, update } = useSession();
  const [copied, setCopied] = useState<string | null>(null);
  const [revealed, setRevealed] = useState(false);

  const copy = async (label: string, value?: string) => {
    if (!value || !revealed) return;
    await navigator.clipboard.writeText(value);
    setCopied(label);
    setTimeout(() => setCopied(null), 2000);
  };

  const refreshSession = async () => {
    await update();
    alert("Session refreshed.");
  };

  return (
    <AuthGuard>
      <div style={{ maxWidth: 800, margin: "2rem auto", padding: "0 1.5rem" }}>
        <h1 style={{ fontSize: "1.5rem", fontWeight: "bold", marginBottom: "0.5rem" }}>
          Session & Tokens
        </h1>
        <p style={{ color: "#6b7280", marginBottom: "1rem" }}>
          Tokens stay in an encrypted HTTP-only session cookie. Full values are hidden by default.
        </p>

        <div
          style={{
            background: "#ecfdf5",
            border: "1px solid #6ee7b7",
            borderRadius: "0.5rem",
            padding: "0.75rem 1rem",
            marginBottom: "1.5rem",
            fontSize: "0.85rem",
            color: "#065f46",
          }}
        >
          Session is encrypted (JWT in secure cookie). Do not share tokens. Reveal only on a trusted
          device.
        </div>

        <div style={{ display: "flex", gap: "0.75rem", marginBottom: "1.5rem", flexWrap: "wrap" }}>
          <button
            onClick={() => setRevealed((v) => !v)}
            style={{
              padding: "0.5rem 1rem",
              background: revealed ? "#b91c1c" : "#111827",
              color: "white",
              border: "none",
              borderRadius: "0.375rem",
              cursor: "pointer",
            }}
          >
            {revealed ? "Hide sensitive values" : "Reveal tokens (private)"}
          </button>
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
            Refresh session
          </button>
        </div>

        <TokenBlock title="Login Provider" value={session?.provider || "—"} />
        <TokenBlock title="Account ID" value={session?.providerAccountId || "—"} />
        <TokenBlock
          title="Access / ID Token"
          value={
            revealed
              ? session?.accessToken || "Not available"
              : mask(session?.accessToken)
          }
          onCopy={revealed ? () => copy("access", session?.accessToken) : undefined}
          copied={copied === "access"}
        />
        <TokenBlock
          title="Refresh Token"
          value={
            revealed
              ? session?.refreshToken || "Not issued"
              : mask(session?.refreshToken)
          }
          onCopy={revealed ? () => copy("refresh", session?.refreshToken) : undefined}
          copied={copied === "refresh"}
        />
        <TokenBlock
          title="Token Expiry"
          value={
            session?.expiresAt
              ? new Date(session.expiresAt * 1000).toLocaleString()
              : "Long-lived / not set"
          }
        />
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
        {onCopy && (
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
