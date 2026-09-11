import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { generateClientId, generateClientSecret } from "@/lib/oauth-provider";

export const runtime = "nodejs";

/**
 * Dynamic Client Registration (RFC 7591) — used by ChatGPT MCP connectors.
 * POST JSON: redirect_uris[], client_name?, token_endpoint_auth_method?
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const redirect_uris: string[] = Array.isArray(body.redirect_uris)
      ? body.redirect_uris.map(String)
      : [];
    if (!redirect_uris.length) {
      return NextResponse.json(
        { error: "invalid_client_metadata", error_description: "redirect_uris required" },
        { status: 400 }
      );
    }

    // Allow ChatGPT connector callbacks
    const allowedPrefix = [
      "https://chatgpt.com/",
      "https://chat.openai.com/",
      "https://platform.openai.com/",
    ];
    for (const uri of redirect_uris) {
      const ok =
        allowedPrefix.some((p) => uri.startsWith(p)) ||
        uri.startsWith("http://localhost") ||
        uri.startsWith("https://");
      if (!ok) {
        return NextResponse.json(
          { error: "invalid_redirect_uri", error_description: uri },
          { status: 400 }
        );
      }
    }

    const sb = getSupabase();
    if (!sb) {
      return NextResponse.json({ error: "server_error" }, { status: 500 });
    }

    const client_id = generateClientId();
    const client_secret = generateClientSecret();
    const name = String(body.client_name || "ChatGPT MCP Client").slice(0, 120);

    const { error } = await sb.from("oauth_apps").insert({
      owner_email: "chatgpt-dcr@system.local",
      owner_user_id: null,
      name,
      homepage_url: redirect_uris[0],
      redirect_uris,
      javascript_origins: [],
      client_id,
      client_secret,
    });

    if (error) {
      return NextResponse.json(
        { error: "server_error", error_description: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        client_id,
        client_secret,
        client_id_issued_at: Math.floor(Date.now() / 1000),
        client_secret_expires_at: 0,
        redirect_uris,
        token_endpoint_auth_method:
          body.token_endpoint_auth_method || "client_secret_post",
        grant_types: ["authorization_code"],
        response_types: ["code"],
        client_name: name,
      },
      {
        status: 201,
        headers: { "Access-Control-Allow-Origin": "*" },
      }
    );
  } catch (e: any) {
    return NextResponse.json(
      { error: "invalid_client_metadata", error_description: e?.message || "bad request" },
      { status: 400 }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}
