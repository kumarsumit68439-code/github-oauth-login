"use client";

const BASE = "https://github-oauth-login-nine.vercel.app";

export default function OAuthDocsPage() {
  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: "1.5rem 1.25rem 3rem" }}>
      <h1 style={{ fontSize: "1.75rem", fontWeight: 800, marginBottom: 8 }}>OAuth Provider API</h1>
      <p style={{ color: "#64748b", lineHeight: 1.6 }}>
        Is platform <strong>dusri websites</strong> ko Google / GitHub login provide karti hai.
        Aap yahan OAuth App banao → <code>client_id</code> + <code>client_secret</code> milta hai →
        apni site pe endpoints use karo.
      </p>

      <Section title="1. Create OAuth App">
        <p>
          Login karke open:{" "}
          <a href="/oauth/apps" style={{ color: "#4f46e5", fontWeight: 600 }}>
            /oauth/apps
          </a>
        </p>
        <ul>
          <li>App name</li>
          <li>Homepage URL (e.g. https://my-site.com)</li>
          <li>Redirect / Callback URL (e.g. https://my-site.com/auth/callback)</li>
          <li>JavaScript origins (optional, e.g. https://my-site.com)</li>
        </ul>
        <p>Save → <strong>client_id</strong> + <strong>client_secret</strong> (secret sirf ek baar full dikhega).</p>
      </Section>

      <Section title="2. Endpoints (production)">
        <table style={table}>
          <tbody>
            <Row k="Authorize" v={`${BASE}/api/oauth/authorize`} />
            <Row k="Token" v={`${BASE}/api/oauth/token`} />
            <Row k="UserInfo" v={`${BASE}/api/oauth/userinfo`} />
            <Row k="Create apps (logged in)" v={`${BASE}/api/oauth/apps`} />
            <Row k="Docs" v={`${BASE}/oauth/docs`} />
            <Row k="Apps dashboard" v={`${BASE}/oauth/apps`} />
          </tbody>
        </table>
      </Section>

      <Section title="3. Authorization URL (browser)">
        <pre style={pre}>{`${BASE}/api/oauth/authorize?client_id=YOUR_CLIENT_ID&redirect_uri=https://my-site.com/auth/callback&response_type=code&state=xyz&provider=google`}</pre>
        <p style={{ fontSize: 13, color: "#64748b" }}>
          <code>provider=google</code> ya <code>github</code> optional hint. User is platform pe login karega
          (Google/GitHub), phir aapke <code>redirect_uri</code> pe <code>?code=...</code> aayega.
        </p>
      </Section>

      <Section title="4. Exchange code → access_token (server)">
        <pre style={pre}>{`curl -X POST ${BASE}/api/oauth/token \\
  -H "Content-Type: application/json" \\
  -d '{
    "grant_type": "authorization_code",
    "code": "AUTH_CODE_FROM_REDIRECT",
    "redirect_uri": "https://my-site.com/auth/callback",
    "client_id": "YOUR_CLIENT_ID",
    "client_secret": "YOUR_CLIENT_SECRET"
  }'`}</pre>
        <p>Response example:</p>
        <pre style={pre}>{`{
  "access_token": "tok_...",
  "token_type": "Bearer",
  "expires_in": 3600,
  "scope": "openid profile email",
  "user": { "email": "...", "name": "...", "image": "...", "provider": "google" }
}`}</pre>
      </Section>

      <Section title="5. UserInfo">
        <pre style={pre}>{`curl ${BASE}/api/oauth/userinfo \\
  -H "Authorization: Bearer tok_..."`}</pre>
      </Section>

      <Section title="6. Node.js example (Express callback)">
        <pre style={pre}>{`// GET /auth/callback?code=...
app.get("/auth/callback", async (req, res) => {
  const code = req.query.code;
  const r = await fetch("${BASE}/api/oauth/token", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      grant_type: "authorization_code",
      code,
      redirect_uri: "https://my-site.com/auth/callback",
      client_id: process.env.OAUTH_CLIENT_ID,
      client_secret: process.env.OAUTH_CLIENT_SECRET,
    }),
  });
  const data = await r.json();
  // data.access_token, data.user
  res.json(data);
});`}</pre>
      </Section>

      <Section title="7. Flow diagram">
        <pre style={pre}>{`User → Your Site "Login"
     → Redirect to ${BASE}/api/oauth/authorize?client_id=...&redirect_uri=...
     → User signs in with Google/GitHub on this platform
     → Redirect back: your-site/callback?code=...
     → Your server POST /api/oauth/token
     → access_token + user profile`}</pre>
      </Section>

      <p style={{ fontSize: 12, color: "#94a3b8" }}>
        Security: client_secret sirf server pe rakho. Redirect URI exact match hona chahiye jo app me
        register kiya.
      </p>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section
      style={{
        background: "#fff",
        border: "1px solid #e2e8f0",
        borderRadius: 14,
        padding: "1.1rem 1.2rem",
        marginBottom: 14,
      }}
    >
      <h2 style={{ fontSize: "1.05rem", fontWeight: 700, margin: "0 0 10px" }}>{title}</h2>
      <div style={{ fontSize: 14, color: "#334155", lineHeight: 1.55 }}>{children}</div>
    </section>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <tr>
      <td style={{ padding: "6px 8px", fontWeight: 600, verticalAlign: "top", width: 160 }}>{k}</td>
      <td style={{ padding: "6px 8px" }}>
        <code style={{ fontSize: 12, background: "#f1f5f9", padding: "2px 6px", borderRadius: 6 }}>
          {v}
        </code>
      </td>
    </tr>
  );
}

const table: React.CSSProperties = { width: "100%", borderCollapse: "collapse" };
const pre: React.CSSProperties = {
  background: "#0f172a",
  color: "#e2e8f0",
  padding: 12,
  borderRadius: 10,
  fontSize: 12,
  overflowX: "auto",
  lineHeight: 1.5,
};
