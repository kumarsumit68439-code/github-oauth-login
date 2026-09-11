import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";

export const runtime = "nodejs";

const BASE =
  process.env.NEXTAUTH_URL || "https://github-oauth-login-nine.vercel.app";

const TOOLS = [
  {
    name: "list_pages",
    description: "List main pages and API endpoints of this OAuth platform website",
    inputSchema: { type: "object", properties: {}, additionalProperties: false },
  },
  {
    name: "get_site_info",
    description: "Get platform name, production URL, OAuth and MCP endpoints",
    inputSchema: { type: "object", properties: {}, additionalProperties: false },
  },
  {
    name: "list_oauth_apps",
    description: "List OAuth apps registered on the platform (count + names; secrets hidden)",
    inputSchema: { type: "object", properties: {}, additionalProperties: false },
  },
  {
    name: "get_oauth_docs",
    description: "Return how third-party sites use authorize/token/userinfo",
    inputSchema: { type: "object", properties: {}, additionalProperties: false },
  },
];

async function requireBearer(req: NextRequest) {
  const auth = req.headers.get("authorization") || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7).trim() : "";
  if (!token) return null;
  const sb = getSupabase();
  if (!sb) return null;
  const { data } = await sb
    .from("oauth_auth_codes")
    .select("*")
    .eq("access_token", token)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return data;
}

function unauthorized() {
  return NextResponse.json(
    { error: "unauthorized", message: "Bearer access_token required" },
    {
      status: 401,
      headers: {
        "WWW-Authenticate": `Bearer resource_metadata="${BASE}/.well-known/oauth-protected-resource", scope="mcp:read"`,
        "Access-Control-Allow-Origin": "*",
      },
    }
  );
}

async function callTool(name: string, _args: any, user: any) {
  switch (name) {
    case "list_pages":
      return {
        pages: [
          { path: "/", title: "Home" },
          { path: "/login", title: "Login" },
          { path: "/oauth/docs", title: "OAuth + MCP Docs" },
          { path: "/oauth/apps", title: "OAuth Apps" },
          { path: "/developer", title: "Developer" },
          { path: "/editor", title: "Code Editor" },
          { path: "/projects", title: "Projects" },
          { path: "/backend", title: "Backend" },
          { path: "/account", title: "Account" },
          { path: "/profile", title: "Profile" },
          { path: "/tokens", title: "Tokens" },
        ],
        apis: [
          `${BASE}/api/oauth/authorize`,
          `${BASE}/api/oauth/token`,
          `${BASE}/api/oauth/userinfo`,
          `${BASE}/api/mcp`,
        ],
      };
    case "get_site_info":
      return {
        name: "github-oauth-login OAuth Platform",
        url: BASE,
        mcp_url: `${BASE}/api/mcp`,
        user: user
          ? { email: user.user_email, name: user.user_name, provider: user.provider }
          : null,
        oauth: {
          authorize: `${BASE}/api/oauth/authorize`,
          token: `${BASE}/api/oauth/token`,
          register: `${BASE}/api/oauth/register`,
          protected_resource: `${BASE}/.well-known/oauth-protected-resource`,
          authorization_server: `${BASE}/.well-known/oauth-authorization-server`,
        },
      };
    case "list_oauth_apps": {
      const sb = getSupabase();
      if (!sb) return { error: "DB not configured" };
      const { data, count } = await sb
        .from("oauth_apps")
        .select("name, client_id, homepage_url, created_at", { count: "exact" })
        .limit(50);
      return {
        count: count ?? data?.length ?? 0,
        apps: (data || []).map((a) => ({
          name: a.name,
          client_id: a.client_id,
          homepage_url: a.homepage_url,
          created_at: a.created_at,
        })),
      };
    }
    case "get_oauth_docs":
      return {
        flow: [
          "1. Create app at /oauth/apps or DCR POST /api/oauth/register",
          "2. Browser: GET /api/oauth/authorize?client_id&redirect_uri&response_type=code",
          "3. User logs in with Google/GitHub on this site",
          "4. Redirect with ?code=",
          "5. POST /api/oauth/token for access_token",
          "6. Call MCP POST /api/mcp with Authorization: Bearer access_token",
        ],
        chatgpt: {
          mcp_server_url: `${BASE}/api/mcp`,
          note: "Add as ChatGPT developer-mode app / plugin with this MCP URL",
        },
      };
    default:
      return { error: `Unknown tool: ${name}` };
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers":
        "Content-Type, Authorization, MCP-Protocol-Version",
    },
  });
}

export async function GET(req: NextRequest) {
  // Discovery / health — public metadata; tools need auth via POST
  return NextResponse.json(
    {
      name: "oauth-platform-mcp",
      version: "1.0.0",
      mcp_endpoint: `${BASE}/api/mcp`,
      auth: "Bearer token from /api/oauth/token",
      resource_metadata: `${BASE}/.well-known/oauth-protected-resource`,
      tools: TOOLS.map((t) => t.name),
    },
    { headers: { "Access-Control-Allow-Origin": "*" } }
  );
}

export async function POST(req: NextRequest) {
  const user = await requireBearer(req);
  // Allow initialize/tools/list without token for discovery; tool calls need token
  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }

  const method = body.method || body.jsonrpc ? body.method : null;
  const id = body.id ?? 1;

  const ok = (result: any) =>
    NextResponse.json(
      { jsonrpc: "2.0", id, result },
      { headers: { "Access-Control-Allow-Origin": "*" } }
    );

  if (method === "initialize") {
    return ok({
      protocolVersion: "2024-11-05",
      capabilities: { tools: {} },
      serverInfo: { name: "oauth-platform-mcp", version: "1.0.0" },
    });
  }

  if (method === "notifications/initialized") {
    return new NextResponse(null, { status: 204 });
  }

  if (method === "tools/list") {
    return ok({ tools: TOOLS });
  }

  if (method === "tools/call") {
    if (!user) return unauthorized();
    const name = body.params?.name;
    const args = body.params?.arguments || {};
    const result = await callTool(name, args, user);
    return ok({
      content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
    });
  }

  // Simple non-JSON-RPC helper: { "tool": "list_pages" }
  if (body.tool) {
    if (!user) return unauthorized();
    const result = await callTool(body.tool, body.arguments || {}, user);
    return NextResponse.json(result, {
      headers: { "Access-Control-Allow-Origin": "*" },
    });
  }

  return NextResponse.json(
    { jsonrpc: "2.0", id, error: { code: -32601, message: "Method not found" } },
    { status: 400 }
  );
}
