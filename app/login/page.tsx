"use client";

import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function LoginPage() {
  const { status } = useSession();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [chatgptNote, setChatgptNote] = useState("");

  useEffect(() => {
    if (status === "authenticated") {
      router.replace("/");
    }
  }, [status, router]);

  if (status === "loading" || status === "authenticated") {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh" }}>
        Loading...
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
        callbackUrl: "/",
      });
      if (res?.error) {
        setError(mapFirebaseError(res.error));
      } else if (res?.ok) {
        router.replace("/");
        router.refresh();
      }
    } catch (err: any) {
      setError(err?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleChatGPT = () => {
    setChatgptNote("");
    // Provider only registered when OPENAI_CLIENT_ID + SECRET exist on server
    void signIn("openai", { callbackUrl: "/" }).catch(() => {
      setChatgptNote(
        "ChatGPT login needs OPENAI_CLIENT_ID + OPENAI_CLIENT_SECRET on Vercel (OpenAI partner / Sign in with ChatGPT app)."
      );
    });
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#f3f4f6",
        padding: "1rem",
      }}
    >
      <div
        style={{
          background: "white",
          padding: "2.5rem",
          borderRadius: "1rem",
          boxShadow: "0 10px 25px rgba(0,0,0,0.08)",
          maxWidth: "24rem",
          width: "100%",
          textAlign: "center",
        }}
      >
        <h1 style={{ fontSize: "1.875rem", fontWeight: "bold", marginBottom: "0.5rem" }}>Welcome</h1>
        <p style={{ color: "#6b7280", marginBottom: "1.5rem" }}>
          Email, ChatGPT, Google, Facebook, or GitHub
        </p>

        <form onSubmit={handleEmailAuth} style={{ textAlign: "left", marginBottom: "1.25rem" }}>
          <label style={{ fontSize: "0.8rem", color: "#4b5563" }}>Email</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            style={inputStyle}
          />
          <label style={{ fontSize: "0.8rem", color: "#4b5563" }}>Password</label>
          <input
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Min 6 characters"
            style={inputStyle}
          />

          {error && (
            <p style={{ color: "#dc2626", fontSize: "0.8rem", marginBottom: "0.75rem" }}>{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              padding: "0.875rem",
              background: "#2563eb",
              color: "white",
              border: "none",
              borderRadius: "0.5rem",
              fontWeight: 600,
              cursor: loading ? "wait" : "pointer",
              marginBottom: "0.75rem",
            }}
          >
            {loading
              ? "Please wait..."
              : mode === "login"
                ? "Login with Email"
                : "Create Account"}
          </button>

          <p style={{ fontSize: "0.85rem", color: "#6b7280", textAlign: "center" }}>
            {mode === "login" ? (
              <>
                No account?{" "}
                <button
                  type="button"
                  onClick={() => {
                    setMode("signup");
                    setError("");
                  }}
                  style={linkBtn}
                >
                  Sign up
                </button>
              </>
            ) : (
              <>
                Already have an account?{" "}
                <button
                  type="button"
                  onClick={() => {
                    setMode("login");
                    setError("");
                  }}
                  style={linkBtn}
                >
                  Login
                </button>
              </>
            )}
          </p>
        </form>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            marginBottom: "1rem",
            color: "#9ca3af",
            fontSize: "0.75rem",
          }}
        >
          <div style={{ flex: 1, height: 1, background: "#e5e7eb" }} />
          OR
          <div style={{ flex: 1, height: 1, background: "#e5e7eb" }} />
        </div>

        <button
          onClick={handleChatGPT}
          style={{
            width: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "0.75rem",
            background: "#10a37f",
            color: "white",
            padding: "0.875rem 1.5rem",
            borderRadius: "0.5rem",
            border: "none",
            cursor: "pointer",
            fontWeight: 600,
            fontSize: "1rem",
            marginBottom: "0.75rem",
          }}
        >
          <span style={{ fontSize: 18 }}>◈</span>
          Continue with ChatGPT
        </button>
        {chatgptNote && (
          <p style={{ color: "#b45309", fontSize: 11, marginBottom: 12, textAlign: "left" }}>
            {chatgptNote}
          </p>
        )}

        <button
          onClick={() => signIn("facebook", { callbackUrl: "/" })}
          style={{
            width: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "0.75rem",
            background: "#1877F2",
            color: "white",
            padding: "0.875rem 1.5rem",
            borderRadius: "0.5rem",
            border: "none",
            cursor: "pointer",
            fontWeight: 500,
            fontSize: "1rem",
            marginBottom: "0.75rem",
          }}
        >
          Continue with Facebook
        </button>

        <button
          onClick={() => signIn("google", { callbackUrl: "/" })}
          style={{
            width: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "0.75rem",
            background: "white",
            color: "#3c4043",
            padding: "0.875rem 1.5rem",
            borderRadius: "0.5rem",
            border: "1px solid #dadce0",
            cursor: "pointer",
            fontWeight: 500,
            fontSize: "1rem",
            marginBottom: "0.75rem",
          }}
        >
          Continue with Google
        </button>

        <button
          onClick={() => signIn("github", { callbackUrl: "/" })}
          style={{
            width: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "0.75rem",
            background: "#24292e",
            color: "white",
            padding: "0.875rem 1.5rem",
            borderRadius: "0.5rem",
            border: "none",
            cursor: "pointer",
            fontWeight: 500,
            fontSize: "1rem",
          }}
        >
          Continue with GitHub
        </button>

        <p style={{ fontSize: 10, color: "#9ca3af", marginTop: 16, lineHeight: 1.4 }}>
          ChatGPT OAuth: Vercel pe OPENAI_CLIENT_ID + OPENAI_CLIENT_SECRET. Callback:{" "}
          <code style={{ fontSize: 9 }}>/api/auth/callback/openai</code>
        </p>
      </div>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "0.65rem 0.75rem",
  marginTop: 4,
  marginBottom: 12,
  border: "1px solid #d1d5db",
  borderRadius: "0.5rem",
  fontSize: "1rem",
  boxSizing: "border-box",
};

const linkBtn: React.CSSProperties = {
  background: "none",
  border: "none",
  color: "#2563eb",
  cursor: "pointer",
  fontWeight: 600,
  padding: 0,
};

function mapFirebaseError(code: string) {
  const c = code.toUpperCase();
  if (c.includes("EMAIL_EXISTS")) return "Email already registered. Please login.";
  if (c.includes("EMAIL_NOT_FOUND")) return "No account with this email.";
  if (c.includes("INVALID_PASSWORD") || c.includes("INVALID_LOGIN"))
    return "Wrong email or password.";
  if (c.includes("WEAK_PASSWORD")) return "Password should be at least 6 characters.";
  if (c.includes("INVALID_EMAIL")) return "Invalid email address.";
  if (c.includes("TOO_MANY_ATTEMPTS")) return "Too many attempts. Try later.";
  if (c.includes("USER_DISABLED")) return "This account is disabled.";
  return code.replace(/CredentialsSignin/i, "Login failed").slice(0, 120);
}
