import { NextResponse } from "next/server";

const BASE =
  process.env.NEXTAUTH_URL || "https://github-oauth-login-nine.vercel.app";

export async function GET() {
  return NextResponse.json(
    {
      issuer: BASE,
      authorization_endpoint: `${BASE}/api/oauth/authorize`,
      token_endpoint: `${BASE}/api/oauth/token`,
      registration_endpoint: `${BASE}/api/oauth/register`,
      userinfo_endpoint: `${BASE}/api/oauth/userinfo`,
      response_types_supported: ["code"],
      grant_types_supported: ["authorization_code"],
      code_challenge_methods_supported: ["S256", "plain"],
      token_endpoint_auth_methods_supported: ["client_secret_post", "client_secret_basic", "none"],
      scopes_supported: ["openid", "profile", "email", "mcp:read", "mcp:write"],
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
    },
  });
}
