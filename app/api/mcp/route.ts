import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";

export const runtime = "nodejs";

const BASE =
  process.env.NEXTAUTH_URL || "https://github-oauth-login-nine.vercel.app";

const TOOLS = [
  {
    name: "list_pages",
    description: "List all website pages and what they do",
    inputSchema: { type: "object", properties: {} },
  },
  {
    name: "get_site_info",
    description: "Platform URLs, MCP, OAuth endpoints, logged-in user",
    inputSchema: { type: "object", properties: {} },
  },
  {
    name: "list_oauth_apps",
    description: "List OAuth apps (no secrets)",
    inputSchema: { type: "object", properties: {} },
  },
  {
    name: "create_oauth_app",
    description: "Register a new OAuth app with homepage and redirect_uris",
    inputSchema: {
      type: "object",
      properties: {
        name: { type: "string" },
        homepage_url: { type: "string" },
        redirect_uris: { type: "array", items: { type: "string" } },
      },
      required: ["name", "homepage_url", "redirect_uris"],
    },
  },
  {
    name: "list_projects",
    description: "List published projects for the authenticated user",
    inputSchema: { type: "object", properties: {} },
  },
  {
    name: "get_project",
    description: "Get one project by id including html preview url",
    inputSchema: {
      type: "object",
      properties: { id: { type: "string" } },
      required: ["id"],
    },
  },
  {
    name: "create_project",
    description: "Create/publish a project from HTML (and optional files). Returns public /p/{id} URL",
    inputSchema: {
      type: "object",
      properties: {
        title: { type: "string" },
        html: { type: "string" },
        files: { type: "array" },
      },
      required: ["html"],
    },
  },
  {
    name: "delete_project",
    description: "Delete a published project by id",
    inputSchema: {
      type: "object",
      properties: { id: { type: "string" } },
      required: ["id"],
    },
  },
  {
    name: "get_oauth_docs",
    description: "OAuth + MCP connection instructions",
    inputSchema: { type: "object", properties: {} },
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
    { error: "unauthorized" },
    {
      status: 401,
      headers: {
        "WWW-Authenticate": `Bearer resource_metadata="${BASE}/.well-known/oauth-protected-resource"`,
        "Access-Control-Allow-Origin": "*",
      },
    }
  );
}

function userKey(user: any) {
  return user.user_email || user.id || "mcp-user";
}

async function callTool(name: string, args: any, user: any) {
  const sb = getSupabase();
  switch (name) {
    case "list_pages":
      return {
        pages: [
          { path: "/", title: "Home", access: "public" },
          { path: "/mcp", title: "MCP Server hub", access: "public" },
          { path: "/oauth/docs", title: "OAuth Docs", access: "public" },
          { path: "/oauth/apps", title: "OAuth Apps", access: "login" },
          { path: "/developer", title: "Developer", access: "login" },
          { path: "/login", title: "Login", access: "public" },
          { path: "/projects", title: "Projects (Lovable-style builder)", access: "login" },
          { path: "/editor", title: "Code Editor", access: "login" },
          { path: "/backend", title: "Backend", access: "login" },
          { path: "/account", title: "Account", access: "login" },
          { path: "/profile", title: "Profile", access: "login" },
          { path: "/workspace", title: "Workspace", access: "login" },
          { path: "/tokens", title: "Tokens", access: "login" },
          { path: "/p/{id}", title: "Published project", access: "public" },
        ],
      };
    case "get_site_info":
      return {
        name: "OAuth + MCP Platform",
        url: BASE,
        mcp: `${BASE}/api/mcp`,
        user: user
          ? { email: user.user_email, name: user.user_name, provider: user.provider }
          : null,
        oauth: {
          authorize: `${BASE}/api/oauth/authorize`,
          token: `${BASE}/api/oauth/token`,
          register: `${BASE}/api/oauth/register`,
        },
      };
    case "list_oauth_apps": {
      if (!sb) return { error: "DB not configured" };
      const { data } = await sb
        .from("oauth_apps")
        .select("name, client_id, homepage_url, redirect_uris, created_at")
        .limit(50);
      return { apps: data || [] };
    }
    case "create_oauth_app": {
      if (!sb) return { error: "DB not configured" };
      const { randomBytes } = await import("crypto");
      const client_id = "app_" + randomBytes(12).toString("hex");
      const client_secret = "sk_" + randomBytes(24).toString("hex");
      const name = String(args.name || "App");
      const homepage_url = String(args.homepage_url || "");
      const redirect_uris = Array.isArray(args.redirect_uris) ? args.redirect_uris : [];
      if (!homepage_url || !redirect_uris.length) {
        return { error: "homepage_url and redirect_uris required" };
      }
      const { data, error } = await sb
        .from("oauth_apps")
        .insert({
          owner_email: user.user_email || "mcp@user",
          name,
          homepage_url,
          redirect_uris,
          javascript_origins: [],
          client_id,
          client_secret,
        })
        .select("*")
        .single();
      if (error) return { error: error.message };
      return { ok: true, client_id, client_secret, app: data };
    }
    case "list_projects": {
      if (!sb) return { error: "DB not configured" };
      const uid = userKey(user);
      const { data, error } = await sb
        .from("projects")
        .select("id, title, created_at, updated_at")
        .or(`user_id.eq.${uid},user_email.eq.${user.user_email || ""}`)
        .order("updated_at", { ascending: false })
        .limit(50);
      if (error) return { error: error.message };
      return {
        projects: (data || []).map((p) => ({
          ...p,
          url: `${BASE}/p/${p.id}`,
        })),
      };
    }
    case "get_project": {
      if (!sb) return { error: "DB not configured" };
      const { data, error } = await sb
        .from("projects")
        .select("id, title, html, files, created_at, updated_at")
        .eq("id", args.id)
        .maybeSingle();
      if (error || !data) return { error: error?.message || "Not found" };
      return { ...data, url: `${BASE}/p/${data.id}` };
    }
    case "create_project": {
      if (!sb) return { error: "DB not configured" };
      const html = String(args.html || "");
      if (!html.trim()) return { error: "html required" };
      const title = String(args.title || "MCP project").slice(0, 120);
      const uid = userKey(user);
      const { data, error } = await sb
        .from("projects")
        .insert({
          user_id: uid,
          user_email: user.user_email || null,
          title,
          html,
          files: args.files || [],
        })
        .select("id, title, created_at")
        .single();
      if (error) return { error: error.message };
      return {
        ok: true,
        id: data.id,
        title: data.title,
        url: `${BASE}/p/${data.id}`,
      };
    }
    case "delete_project": {
      if (!sb) return { error: "DB not configured" };
      const { error } = await sb.from("projects").delete().eq("id", args.id);
      if (error) return { error: error.message };
      return { ok: true, deleted: args.id };
    }
    case "get_oauth_docs":
      return {
        mcp_url: `${BASE}/api/mcp`,
        flow: [
          "Connect ChatGPT MCP to /api/mcp",
          "OAuth login with Google/GitHub",
          "Use tools: list_pages, create_project, list_projects, create_oauth_app",
        ],
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

export async function GET() {
  return NextResponse.json(
    {
      name: "oauth-platform-mcp",
      version: "1.1.0",
      mcp_endpoint: `${BASE}/api/mcp`,
      tools: TOOLS.map((t) => t.name),
      auth: "Bearer access_token",
    },
    { headers: { "Access-Control-Allow-Origin": "*" } }
  );
}

export async function POST(req: NextRequest) {
  const user = await requireBearer(req);
  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }

  const method = body.method;
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
      serverInfo: { name: "oauth-platform-mcp", version: "1.1.0" },
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
    const result = await callTool(body.params?.name, body.params?.arguments || {}, user);
    return ok({
      content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
    });
  }
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
