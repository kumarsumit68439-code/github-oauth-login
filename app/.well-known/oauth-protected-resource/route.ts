import { NextResponse } from "next/server";

const BASE =
  process.env.NEXTAUTH_URL || "https://github-oauth-login-nine.vercel.app";

export async function GET() {
  return NextResponse.json(
    {
      resource: `${BASE}/api/mcp`,
      authorization_servers: [BASE],
      scopes_supported: ["openid", "profile", "email", "mcp:read", "mcp:write"],
      bearer_methods_supported: ["header"],
      resource_documentation: `${BASE}/oauth/docs#mcp`,
    },
    {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Cache-Control": "public, max-age=60",
      },
    }
  );
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}
