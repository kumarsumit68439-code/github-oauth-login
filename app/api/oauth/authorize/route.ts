import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getSupabase } from "@/lib/supabase";
import {
  generateAuthCode,
  generateAccessToken,
  getAppByClientId,
  isRedirectAllowed,
  normalizeUri,
} from "@/lib/oauth-provider";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const client_id = searchParams.get("client_id") || "";
  const redirect_uri = searchParams.get("redirect_uri") || "";
  const response_type = searchParams.get("response_type") || "code";
  const state = searchParams.get("state") || "";
  const provider = searchParams.get("provider") || "";

  if (!client_id || !redirect_uri) {
    return NextResponse.json(
      {
        error: "invalid_request",
        error_description: "client_id and redirect_uri required",
      },
      { status: 400 }
    );
  }
  if (response_type !== "code") {
    return NextResponse.json(
      {
        error: "unsupported_response_type",
        error_description: "Only response_type=code supported",
      },
      { status: 400 }
    );
  }

  const app = await getAppByClientId(client_id);
  if (!app) {
    return NextResponse.json(
      { error: "invalid_client", error_description: "Unknown client_id" },
      { status: 400 }
    );
  }

  if (!isRedirectAllowed(app, redirect_uri)) {
    return NextResponse.json(
      {
        error: "invalid_request",
        error_description:
          "redirect_uri not registered for this client. Use EXACT same URL you saved in OAuth Apps (scheme, host, path).",
        redirect_uri_sent: redirect_uri,
        redirect_uri_normalized: normalizeUri(redirect_uri),
        registered_redirect_uris: app.redirect_uris || [],
        registered_normalized: (app.redirect_uris || []).map(normalizeUri),
        hint: "Open /oauth/apps → copy the exact redirect URL into authorize?redirect_uri=",
      },
      { status: 400 }
    );
  }

  const session = await getServerSession(authOptions);
  if (!session?.user) {
    const base =
      process.env.NEXTAUTH_URL || "https://github-oauth-login-nine.vercel.app";
    const returnTo = `${base}/api/oauth/authorize?${searchParams.toString()}`;
    const login = new URL(`${base}/login`);
    login.searchParams.set("callbackUrl", returnTo);
    if (provider) login.searchParams.set("provider", provider);
    return NextResponse.redirect(login.toString());
  }

  const sb = getSupabase();
  if (!sb) {
    return NextResponse.json(
      { error: "server_error", error_description: "DB unavailable" },
      { status: 500 }
    );
  }

  const code = generateAuthCode();
  const access_token = generateAccessToken();
  const expires_at = new Date(Date.now() + 10 * 60 * 1000).toISOString();

  const { error } = await sb.from("oauth_auth_codes").insert({
    code,
    client_id,
    redirect_uri,
    user_email: session.user.email || null,
    user_name: session.user.name || null,
    user_image: session.user.image || null,
    provider: (session as any).provider || null,
    access_token,
    expires_at,
    used: false,
  });

  if (error) {
    return NextResponse.json(
      { error: "server_error", error_description: error.message },
      { status: 500 }
    );
  }

  const dest = new URL(redirect_uri);
  dest.searchParams.set("code", code);
  if (state) dest.searchParams.set("state", state);
  return NextResponse.redirect(dest.toString());
}
