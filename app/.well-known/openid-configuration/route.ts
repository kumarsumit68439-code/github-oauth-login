import { NextResponse } from "next/server";

const BASE =
  process.env.NEXTAUTH_URL || "https://github-oauth-login-nine.vercel.app";

export async function GET() {
  return NextResponse.json({
    issuer: BASE,
    authorization_endpoint: `${BASE}/api/oauth/authorize`,
    token_endpoint: `${BASE}/api/oauth/token`,
    userinfo_endpoint: `${BASE}/api/oauth/userinfo`,
    registration_endpoint: `${BASE}/api/oauth/register`,
    response_types_supported: ["code"],
    subject_types_supported: ["public"],
    id_token_signing_alg_values_supported: ["RS256"],
    scopes_supported: ["openid", "profile", "email"],
  });
}
