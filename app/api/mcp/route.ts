import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";

export const runtime = "nodejs";

const BASE =
  process.env.NEXTAUTH_URL || "https://github-oauth-login-nine.vercel.app";

const TOOLS = [
  {
    name: "list_pages",
    description: "List all website pages",
    inputSchema: { type: "object", properties: {} },
  },
  {
    name: "get_site_info",
    description: "Platform URLs and logged-in user",
    inputSchema: { type: "object", properties: {} },
  },
  {
    name: "list_oauth_apps",
    description: "List OAuth apps",
    inputSchema: { type: "object", properties: {} },
  },
  {
    name: "create_oauth_app",
    description: "Register OAuth app",
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
    description: "List user projects",
    inputSchema: { type: "object", properties: {} },
  },
  {
    name: "get_project",
    description: "Get project HTML and files by id",
    inputSchema: {
      type: "object",
      properties: { id: { type: "string" } },
      required: ["id"],
    },
  },
  {
    name: "create_project",
    description: "Create project from HTML code. ChatGPT should pass full HTML string.",
    inputSchema: {
      type: "object",
      properties: {
        title: { type: "string" },
        html: { type: "string", description: "Full HTML document" },
        files: { type: "array" },
      },
      required: ["html"],
    },
  },
  {
    name: "update_project_code",
    description:
      "Overwrite a project HTML (and optional files) with new code written by ChatGPT. Use after create_project or list_projects.",
    inputSchema: {
      type: "object",
      properties: {
        id: { type: "string" },
        html: { type: "string" },
        title: { type: "string" },
        files: { type: "array" },
      },
      required: ["id", "html"],
    },
  },
  {
    name: "write_project_file",
    description:
      "Add or replace one file in a project (e.g. index.html, styles.css, app.js) and rebuild combined HTML when possible",
    inputSchema: {
      type: "object",
      properties: {
        id: { type: "string" },
        filename: { type: "string" },
        content: { type: "string" },
        language: { type: "string" },
      },
      required: ["id", "filename", "content"],
    },
  },
  {
    name: "delete_project",
    description: "Delete project by id",
    inputSchema: {
      type: "object",
      properties: { id: { type: "string" } },
      required: ["id"],
    },
  },
  {
    name: "get_oauth_docs",
    description: "OAuth + MCP instructions",
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

function rebuildHtmlFromFiles(files: any[], fallbackHtml: string) {
  if (!Array.isArray(files) || !files.length) return fallbackHtml;
  const htmlFile =
    files.find((f) => f.name === "index.html") ||
    files.find((f) => f.language === "html");
  let html = htmlFile?.content || fallbackHtml || "<h1>Empty</h1>";
  const css = files
    .filter((f) => f.language === "css" || String(f.name || "").endsWith(".css"))
    .map((f) => f.content)
    .join("\n");
  const js = files
    .filter(
      (f) =>
        f.language === "javascript" ||
        f.language === "js" ||
        String(f.name || "").endsWith(".js")
    )
    .map((f) => f.content)
    .join("\n");
  if (css) {
    if (/<\/head>/i.test(html)) html = html.replace(/<\/head>/i, `<style>\n${css}\n</style>\n</head>`);
    else html = `<style>${css}</style>` + html;
  }
  if (js) {
    if (/<\/body>/i.test(html)) html = html.replace(/<\/body>/i, `<script>\n${js}\n</script>\n</body>`);
    else html += `\n<script>\n${js}\n</script>`;
  }
  return html;
}

async function callTool(name: string, args: any, user: any) {
  const sb = getSupabase();
  switch (name) {
    case "list_pages":
      return {
        pages: [
          "/",
          "/mcp",
          "/projects",
          "/editor",
          "/oauth/docs",
          "/oauth/apps",
          "/developer",
          "/login",
          "/backend",
          "/account",
          "/profile",
          "/tokens",
          "/p/{id}",
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
        .select("client_id, client_secret, name, homepage_url, redirect_uris")
        .single();
      if (error) return { error: error.message };
      return { ok: true, ...data };
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
        projects: (data || []).map((p) => ({ ...p, url: `${BASE}/p/${p.id}` })),
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
      if (!html.trim()) return { error: "html required — pass full HTML code" };
      const title = String(args.title || "ChatGPT project").slice(0, 120);
      const files = Array.isArray(args.files)
        ? args.files
        : [{ id: "1", name: "index.html", language: "html", content: html }];
      const uid = userKey(user);
      const { data, error } = await sb
        .from("projects")
        .insert({
          user_id: uid,
          user_email: user.user_email || null,
          title,
          html,
          files,
        })
        .select("id, title, created_at")
        .single();
      if (error) return { error: error.message };
      return {
        ok: true,
        id: data.id,
        title: data.title,
        url: `${BASE}/p/${data.id}`,
        message: "Project created. Use update_project_code to change HTML later.",
      };
    }
    case "update_project_code": {
      if (!sb) return { error: "DB not configured" };
      const id = String(args.id || "");
      const html = String(args.html || "");
      if (!id || !html.trim()) return { error: "id and html required" };
      const updates: Record<string, unknown> = {
        html,
        updated_at: new Date().toISOString(),
      };
      if (args.title) updates.title = String(args.title).slice(0, 120);
      if (Array.isArray(args.files)) updates.files = args.files;
      else
        updates.files = [
          { id: "1", name: "index.html", language: "html", content: html },
        ];
      const { data, error } = await sb
        .from("projects")
        .update(updates)
        .eq("id", id)
        .select("id, title, updated_at")
        .single();
      if (error || !data) return { error: error?.message || "Update failed" };
      return {
        ok: true,
        id: data.id,
        title: data.title,
        url: `${BASE}/p/${data.id}`,
        message: "Code updated and live on project URL",
      };
    }
    case "write_project_file": {
      if (!sb) return { error: "DB not configured" };
      const id = String(args.id || "");
      const filename = String(args.filename || "index.html");
      const content = String(args.content || "");
      if (!id || !content) return { error: "id, filename, content required" };
      const { data: existing, error: ge } = await sb
        .from("projects")
        .select("id, title, html, files")
        .eq("id", id)
        .maybeSingle();
      if (ge || !existing) return { error: ge?.message || "Not found" };
      let files: any[] = Array.isArray(existing.files) ? [...existing.files] : [];
      const lang =
        args.language ||
        (filename.endsWith(".css")
          ? "css"
          : filename.endsWith(".js")
            ? "javascript"
            : "html");
      const idx = files.findIndex((f) => f.name === filename);
      const entry = {
        id: idx >= 0 ? files[idx].id : String(Date.now()),
        name: filename,
        language: lang,
        content,
      };
      if (idx >= 0) files[idx] = entry;
      else files.push(entry);
      const html = rebuildHtmlFromFiles(files, existing.html || content);
      const { data, error } = await sb
        .from("projects")
        .update({ html, files, updated_at: new Date().toISOString() })
        .eq("id", id)
        .select("id, title")
        .single();
      if (error || !data) return { error: error?.message || "Write failed" };
      return {
        ok: true,
        id: data.id,
        filename,
        url: `${BASE}/p/${data.id}`,
        message: `Wrote ${filename} into project`,
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
        chatgpt_code_flow: [
          "1. create_project with title + full html",
          "2. update_project_code with id + new html to revise",
          "3. write_project_file for single file (css/js/html)",
          "4. Open returned url /p/{id}",
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
      version: "1.2.0",
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
      serverInfo: { name: "oauth-platform-mcp", version: "1.2.0" },
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
