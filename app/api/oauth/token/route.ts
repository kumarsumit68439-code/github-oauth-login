import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { getAppByClientId, generateAccessToken } from "@/lib/oauth-provider";

export const runtime = "nodejs";

/**
 * POST /api/oauth/token
 * Body (form or JSON):
 *   grant_type=authorization_code
 *   code=
 *   redirect_uri=
 *   client_id=
 *   client_secret=
 */
export async function POST(req: NextRequest) {
  let body: Record<string, string> = {};
  const ct = req.headers.get("content-type") || "";
  if (ct.includes("application/json")) {
    body = await req.json();
  } else {
    const form = await req.formData();
    form.forEach((v, k) => {
      body[k] = String(v);
    });
  }

  const grant_type = body.grant_type || "authorization_code";
  const code = body.code || "";
  const redirect_uri = body.redirect_uri || "";
  const client_id = body.client_id || "";
  const client_secret = body.client_secret || "";

  if (grant_type !== "authorization_code") {
    return NextResponse.json(
      { error: "unsupported_grant_type" },
      { status: 400 }
    );
  }
  if (!code || !client_id || !client_secret || !redirect_uri) {
    return NextResponse.json(
      { error: "invalid_request", error_description: "code, client_id, client_secret, redirect_uri required" },
      { status: 400 }
    );
  }

  const app = await getAppByClientId(client_id);
  if (!app || app.client_secret !== client_secret) {
    return NextResponse.json({ error: "invalid_client" }, { status: 401 });
  }

  const sb = getSupabase();
  if (!sb) {
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }

  const { data: row, error } = await sb
    .from("oauth_auth_codes")
    .select("*")
    .eq("code", code)
    .eq("client_id", client_id)
    .maybeSingle();

  if (error || !row) {
    return NextResponse.json({ error: "invalid_grant", error_description: "Invalid code" }, { status: 400 });
  }
  if (row.used) {
    return NextResponse.json({ error: "invalid_grant", error_description: "Code already used" }, { status: 400 });
  }
  if (new Date(row.expires_at).getTime() < Date.now()) {
    return NextResponse.json({ error: "invalid_grant", error_description: "Code expired" }, { status: 400 });
  }
  if (row.redirect_uri !== redirect_uri) {
    return NextResponse.json({ error: "invalid_grant", error_description: "redirect_uri mismatch" }, { status: 400 });
  }

  await sb.from("oauth_auth_codes").update({ used: true }).eq("code", code);

  const access_token = row.access_token || generateAccessToken();
  const expires_in = 3600;

  return NextResponse.json({
    access_token,
    token_type: "Bearer",
    expires_in,
    scope: "openid profile email",
    // convenience (non-standard but helpful)
    user: {
      email: row.user_email,
      name: row.user_name,
      image: row.user_image,
      provider: row.provider,
    },
  });
}
