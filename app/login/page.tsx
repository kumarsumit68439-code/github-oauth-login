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
  const [theme, setTheme] = useState<"aurora" | "ocean" | "sunset" | "midnight">("aurora");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    try {
      const t = localStorage.getItem("login-theme-v1") as typeof theme | null;
      if (t && ["aurora", "ocean", "sunset", "midnight"].includes(t)) setTheme(t);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    if (status === "authenticated") router.replace("/");
  }, [status, router]);

  const changeTheme = (t: typeof theme) => {
    setTheme(t);
    try {
      localStorage.setItem("login-theme-v1", t);
    } catch {
      /* ignore */
    }
  };

  if (status === "loading" || status === "authenticated") {
    return (
      <div style={shell(theme)}>
        <div style={{ color: "#e2e8f0", fontSize: 14, letterSpacing: 1 }}>Loading…</div>
        <style>{cssAnim}</style>
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
      if (res?.error) setError(mapFirebaseError(res.error));
      else if (res?.ok) {
        router.replace("/");
        router.refresh();
      }
    } catch (err: any) {
      setError(err?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const themes = [
    { id: "aurora" as const, label: "Aurora", color: "#a78bfa" },
    { id: "ocean" as const, label: "Ocean", color: "#38bdf8" },
    { id: "sunset" as const, label: "Sunset", color: "#fb923c" },
    { id: "midnight" as const, label: "Midnight", color: "#64748b" },
  ];

  return (
    <div style={shell(theme)}>
      <style>{cssAnim}</style>

      {/* floating orbs */}
      <div className="orb orb-1" />
      <div className="orb orb-2" />
      <div className="orb orb-3" />
      <div className="grid-overlay" />

      {/* theme switcher */}
      <div
        style={{
          position: "fixed",
          top: 16,
          right: 16,
          zIndex: 20,
          display: "flex",
          gap: 8,
          padding: 8,
          borderRadius: 999,
          background: "rgba(15,23,42,0.55)",
          backdropFilter: "blur(12px)",
          border: "1px solid rgba(255,255,255,0.12)",
        }}
      >
        {themes.map((t) => (
          <button
            key={t.id}
            type="button"
            title={t.label}
            onClick={() => changeTheme(t.id)}
            style={{
              width: 22,
              height: 22,
              borderRadius: "50%",
              border: theme === t.id ? "2px solid #fff" : "2px solid transparent",
              background: t.color,
              cursor: "pointer",
              boxShadow: theme === t.id ? `0 0 12px ${t.color}` : "none",
              transition: "transform 0.2s, box-shadow 0.2s",
              transform: theme === t.id ? "scale(1.15)" : "scale(1)",
            }}
          />
        ))}
      </div>

      <div
        className={mounted ? "card-in" : ""}
        style={{
          position: "relative",
          zIndex: 10,
          width: "100%",
          maxWidth: 400,
          padding: "2rem 1.75rem",
          borderRadius: 24,
          background: "rgba(15, 23, 42, 0.72)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          border: "1px solid rgba(255,255,255,0.12)",
          boxShadow: "0 25px 50px -12px rgba(0,0,0,0.45)",
          textAlign: "center",
          color: "#f1f5f9",
        }}
      >
        <div
          style={{
            width: 56,
            height: 56,
            margin: "0 auto 1rem",
            borderRadius: 16,
            background: accentGradient(theme),
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 26,
            boxShadow: `0 8px 24px ${accentGlow(theme)}`,
            animation: "floatLogo 4s ease-in-out infinite",
          }}
        >
          ✦
        </div>

        <h1
          style={{
            fontSize: "1.75rem",
            fontWeight: 700,
            margin: "0 0 0.35rem",
            letterSpacing: "-0.02em",
            background: accentGradient(theme),
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}
        >
          Welcome back
        </h1>
        <p style={{ color: "#94a3b8", marginBottom: "1.5rem", fontSize: 14 }}>
          Sign in to continue to your workspace
        </p>

        <form onSubmit={handleEmailAuth} style={{ textAlign: "left", marginBottom: "1.1rem" }}>
          <label style={labelStyle}>Email</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            style={inputDark}
          />
          <label style={labelStyle}>Password</label>
          <input
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Min 6 characters"
            style={inputDark}
          />

          {error && (
            <p
              style={{
                color: "#fca5a5",
                fontSize: 12,
                marginBottom: 10,
                padding: "8px 10px",
                borderRadius: 8,
                background: "rgba(239,68,68,0.15)",
                border: "1px solid rgba(239,68,68,0.25)",
              }}
            >
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn-glow"
            style={{
              width: "100%",
              padding: "0.9rem",
              background: accentGradient(theme),
              color: "white",
              border: "none",
              borderRadius: 12,
              fontWeight: 600,
              cursor: loading ? "wait" : "pointer",
              marginBottom: 10,
              fontSize: 15,
              boxShadow: `0 8px 20px ${accentGlow(theme)}`,
              transition: "transform 0.15s, opacity 0.15s",
              opacity: loading ? 0.75 : 1,
            }}
          >
            {loading ? "Please wait…" : mode === "login" ? "Login with Email" : "Create Account"}
          </button>

          <p style={{ fontSize: 13, color: "#94a3b8", textAlign: "center", margin: 0 }}>
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
            gap: 10,
            marginBottom: 14,
            color: "#64748b",
            fontSize: 11,
            letterSpacing: 1,
          }}
        >
          <div style={{ flex: 1, height: 1, background: "rgba(148,163,184,0.25)" }} />
          OR
          <div style={{ flex: 1, height: 1, background: "rgba(148,163,184,0.25)" }} />
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <SocialBtn
            onClick={() => signIn("google", { callbackUrl: "/" })}
            bg="#fff"
            color="#1f2937"
            border="1px solid rgba(255,255,255,0.2)"
            label="Continue with Google"
            icon="G"
          />
          <SocialBtn
            onClick={() => signIn("github", { callbackUrl: "/" })}
            bg="#0f172a"
            color="#f8fafc"
            border="1px solid rgba(255,255,255,0.15)"
            label="Continue with GitHub"
            icon="⌘"
          />
          <SocialBtn
            onClick={() => signIn("facebook", { callbackUrl: "/" })}
            bg="#1877F2"
            color="#fff"
            border="none"
            label="Continue with Facebook"
            icon="f"
          />
          <SocialBtn
            onClick={() => signIn("openai", { callbackUrl: "/" })}
            bg="#10a37f"
            color="#fff"
            border="none"
            label="Continue with ChatGPT"
            icon="◈"
          />
        </div>
      </div>
    </div>
  );
}

function SocialBtn({
  onClick,
  bg,
  color,
  border,
  label,
  icon,
}: {
  onClick: () => void;
  bg: string;
  color: string;
  border: string;
  label: string;
  icon: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="social-btn"
      style={{
        width: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 10,
        background: bg,
        color,
        padding: "0.8rem 1rem",
        borderRadius: 12,
        border,
        cursor: "pointer",
        fontWeight: 600,
        fontSize: 14,
        transition: "transform 0.15s, box-shadow 0.15s",
      }}
    >
      <span style={{ width: 22, textAlign: "center", fontSize: 15 }}>{icon}</span>
      {label}
    </button>
  );
}

function shell(theme: string): React.CSSProperties {
  return {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "1.25rem",
    position: "relative",
    overflow: "hidden",
    background: bgFor(theme),
  };
}

function bgFor(theme: string) {
  switch (theme) {
    case "ocean":
      return "linear-gradient(135deg, #0c4a6e 0%, #082f49 40%, #020617 100%)";
    case "sunset":
      return "linear-gradient(135deg, #7c2d12 0%, #4c1d95 45%, #020617 100%)";
    case "midnight":
      return "linear-gradient(160deg, #020617 0%, #0f172a 50%, #1e1b4b 100%)";
    default:
      return "linear-gradient(135deg, #312e81 0%, #4c1d95 35%, #0f172a 100%)";
  }
}

function accentGradient(theme: string) {
  switch (theme) {
    case "ocean":
      return "linear-gradient(90deg, #0ea5e9, #22d3ee)";
    case "sunset":
      return "linear-gradient(90deg, #f97316, #e11d48)";
    case "midnight":
      return "linear-gradient(90deg, #64748b, #94a3b8)";
    default:
      return "linear-gradient(90deg, #8b5cf6, #ec4899)";
  }
}

function accentGlow(theme: string) {
  switch (theme) {
    case "ocean":
      return "rgba(14,165,233,0.35)";
    case "sunset":
      return "rgba(249,115,22,0.35)";
    case "midnight":
      return "rgba(148,163,184,0.25)";
    default:
      return "rgba(139,92,246,0.4)";
  }
}

const labelStyle: React.CSSProperties = {
  fontSize: 12,
  color: "#94a3b8",
  display: "block",
  marginBottom: 4,
};

const inputDark: React.CSSProperties = {
  width: "100%",
  padding: "0.7rem 0.85rem",
  marginBottom: 12,
  border: "1px solid rgba(148,163,184,0.25)",
  borderRadius: 12,
  fontSize: 15,
  boxSizing: "border-box",
  background: "rgba(2,6,23,0.55)",
  color: "#f1f5f9",
  outline: "none",
};

const linkBtn: React.CSSProperties = {
  background: "none",
  border: "none",
  color: "#a5b4fc",
  cursor: "pointer",
  fontWeight: 600,
  padding: 0,
};

const cssAnim = `
  .orb {
    position: absolute;
    border-radius: 50%;
    filter: blur(60px);
    opacity: 0.55;
    pointer-events: none;
    z-index: 1;
  }
  .orb-1 {
    width: 320px; height: 320px;
    top: -80px; left: -60px;
    background: #8b5cf6;
    animation: drift1 14s ease-in-out infinite;
  }
  .orb-2 {
    width: 280px; height: 280px;
    bottom: -40px; right: -40px;
    background: #ec4899;
    animation: drift2 16s ease-in-out infinite;
  }
  .orb-3 {
    width: 200px; height: 200px;
    top: 40%; left: 55%;
    background: #38bdf8;
    animation: drift3 12s ease-in-out infinite;
  }
  .grid-overlay {
    position: absolute;
    inset: 0;
    z-index: 2;
    background-image:
      linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
      linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px);
    background-size: 48px 48px;
    mask-image: radial-gradient(ellipse at center, black 20%, transparent 75%);
    pointer-events: none;
  }
  .card-in {
    animation: cardIn 0.55s cubic-bezier(0.22, 1, 0.36, 1) both;
  }
  .social-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 10px 24px rgba(0,0,0,0.25);
  }
  .btn-glow:hover {
    transform: translateY(-1px);
  }
  @keyframes cardIn {
    from { opacity: 0; transform: translateY(18px) scale(0.97); }
    to { opacity: 1; transform: translateY(0) scale(1); }
  }
  @keyframes floatLogo {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-6px); }
  }
  @keyframes drift1 {
    0%, 100% { transform: translate(0, 0); }
    50% { transform: translate(40px, 30px); }
  }
  @keyframes drift2 {
    0%, 100% { transform: translate(0, 0); }
    50% { transform: translate(-35px, -25px); }
  }
  @keyframes drift3 {
    0%, 100% { transform: translate(0, 0) scale(1); }
    50% { transform: translate(-20px, 20px) scale(1.1); }
  }
  input:focus {
    border-color: rgba(165,180,252,0.6) !important;
    box-shadow: 0 0 0 3px rgba(139,92,246,0.2);
  }
`;

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
