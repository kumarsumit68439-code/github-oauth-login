"use client";

import { signIn, useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState, Suspense } from "react";

function LoginInner() {
  const { status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = useMemo(() => {
    const c = searchParams.get("callbackUrl");
    if (!c) return "/";
    if (c.startsWith("/")) return c;
    try {
      const u = new URL(c);
      if (u.hostname.endsWith("vercel.app") || u.hostname === "localhost") return c;
    } catch {
      /* ignore */
    }
    return "/";
  }, [searchParams]);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (status === "authenticated") router.replace(callbackUrl);
  }, [status, router, callbackUrl]);

  if (status === "loading" || status === "authenticated") {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#0f172a",
          color: "#e2e8f0",
        }}
      >
        {status === "authenticated" ? "Continuing to app…" : "Loading…"}
      </div>
    );
  }

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await signIn("firebase", {
        email,
        password,
        mode: mode === "signup" ? "signup" : "login",
        redirect: false,
        callbackUrl,
      });
      if (res?.error) setError(res.error);
      else if (res?.ok) {
        router.replace(callbackUrl);
        router.refresh();
      }
    } catch (err: any) {
      setError(err?.message || "Error");
    } finally {
      setLoading(false);
    }
  };

  const btn: React.CSSProperties = {
    width: "100%",
    padding: "0.85rem",
    borderRadius: 12,
    border: "none",
    cursor: "pointer",
    fontWeight: 600,
    fontSize: 15,
    marginBottom: 10,
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg,#312e81,#4c1d95,#0f172a)",
        padding: 16,
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 400,
          background: "rgba(15,23,42,0.85)",
          borderRadius: 20,
          padding: 28,
          color: "#f1f5f9",
          border: "1px solid rgba(255,255,255,0.12)",
        }}
      >
        <h1 style={{ marginTop: 0, textAlign: "center" }}>Sign in</h1>
        <p style={{ textAlign: "center", color: "#94a3b8", fontSize: 13 }}>
          {callbackUrl.includes("/api/oauth/authorize")
            ? "OAuth / ChatGPT connect — login then return"
            : "Google, GitHub, or Email"}
        </p>
        <form onSubmit={handleEmailAuth}>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            style={inp}
          />
          <input
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            style={inp}
          />
          {error && <p style={{ color: "#fca5a5", fontSize: 12 }}>{error}</p>}
          <button
            type="submit"
            disabled={loading}
            style={{
              ...btn,
              background: "linear-gradient(90deg,#8b5cf6,#ec4899)",
              color: "#fff",
            }}
          >
            {loading ? "…" : mode === "login" ? "Login with Email" : "Sign up"}
          </button>
          <p style={{ fontSize: 13, textAlign: "center" }}>
            <button
              type="button"
              style={{ background: "none", border: "none", color: "#a5b4fc", cursor: "pointer" }}
              onClick={() => setMode(mode === "login" ? "signup" : "login")}
            >
              {mode === "login" ? "Create account" : "Have account? Login"}
            </button>
          </p>
        </form>
        <button
          type="button"
          style={{ ...btn, background: "#fff", color: "#111" }}
          onClick={() => signIn("google", { callbackUrl })}
        >
          Continue with Google
        </button>
        <button
          type="button"
          style={{ ...btn, background: "#0f172a", color: "#fff", border: "1px solid #334155" }}
          onClick={() => signIn("github", { callbackUrl })}
        >
          Continue with GitHub
        </button>
        <button
          type="button"
          style={{ ...btn, background: "#1877F2", color: "#fff" }}
          onClick={() => signIn("facebook", { callbackUrl })}
        >
          Continue with Facebook
        </button>
      </div>
    </div>
  );
}

const inp: React.CSSProperties = {
  width: "100%",
  padding: "0.7rem",
  marginBottom: 10,
  borderRadius: 10,
  border: "1px solid #334155",
  background: "#020617",
  color: "#f1f5f9",
  boxSizing: "border-box",
};

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div
          style={{
            minHeight: "100vh",
            background: "#0f172a",
            color: "#fff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          Loading…
        </div>
      }
    >
      <LoginInner />
    </Suspense>
  );
}
