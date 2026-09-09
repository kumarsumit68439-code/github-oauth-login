"use client";

import { useSession } from "next-auth/react";
import AuthGuard from "../components/AuthGuard";

export default function ProfilePage() {
  const { data: session } = useSession();

  return (
    <AuthGuard>
      <div style={{ maxWidth: 520, margin: "2rem auto", padding: "0 1.5rem", textAlign: "center" }}>
        <h1 style={{ fontSize: "1.5rem", fontWeight: "bold", marginBottom: "1.5rem" }}>Profile</h1>

        {session?.user?.image && (
          <img
            src={session.user.image}
            alt="Avatar"
            style={{ width: 96, height: 96, borderRadius: "50%", marginBottom: "1rem" }}
          />
        )}

        <h2 style={{ fontSize: "1.25rem", fontWeight: 600 }}>{session?.user?.name || "User"}</h2>
        <p style={{ color: "#6b7280", marginTop: "0.35rem" }}>{session?.user?.email}</p>

        <div
          style={{
            marginTop: "1.5rem",
            padding: "1rem",
            background: "white",
            borderRadius: "0.75rem",
            boxShadow: "0 4px 12px rgba(0,0,0,0.06)",
            textAlign: "left",
          }}
        >
          <div style={{ fontSize: "0.75rem", color: "#6b7280" }}>Signed in with</div>
          <div style={{ fontWeight: 600, textTransform: "capitalize" }}>
            {session?.provider || "unknown"}
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}
