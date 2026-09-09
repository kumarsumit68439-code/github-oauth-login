"use client";

import { useSession } from "next-auth/react";
import AuthGuard from "../components/AuthGuard";

export default function WorkspacePage() {
  const { data: session } = useSession();

  return (
    <AuthGuard>
      <div style={{ maxWidth: 800, margin: "2rem auto", padding: "0 1.5rem" }}>
        <h1 style={{ fontSize: "1.5rem", fontWeight: "bold", marginBottom: "0.5rem" }}>Workspace</h1>
        <p style={{ color: "#6b7280", marginBottom: "1.5rem" }}>
          Protected workspace for <strong>{session?.user?.name || session?.user?.email}</strong>.
        </p>

        <div
          style={{
            background: "white",
            borderRadius: "0.75rem",
            padding: "1.5rem",
            boxShadow: "0 4px 12px rgba(0,0,0,0.06)",
          }}
        >
          <p style={{ marginBottom: "1rem" }}>
            Yahan aap apna main app content rakh sakte ho. Sirf logged-in users hi is page ko dekh
            sakte hain.
          </p>
          <ul style={{ paddingLeft: "1.25rem", color: "#374151", lineHeight: 1.8 }}>
            <li>Session JWT cookie se manage hota hai</li>
            <li>Page refresh pe dubara login nahi maanga jata</li>
            <li>Logout button se hi session clear hota hai</li>
            <li>Provider: {session?.provider}</li>
          </ul>
        </div>
      </div>
    </AuthGuard>
  );
}
