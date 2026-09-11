import { NextRequest, NextResponse } from "next/server";
import { createHash } from "crypto";
import { getSupabase } from "@/lib/supabase";
import { getAppByClientId, generateAccessToken } from "@/lib/oauth-provider";

export const runtime = "nodejs";

function verifyPkce(verifier: string, challenge: string, method: string) {
  if (!challenge) return true;
  if (!verifier) return false;
  if (method === "plain") return verifier === challenge;
  // S256
  const hash = createHash("sha256").update(verifier).digest();
  const b64 = hash
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
  return b64 === challenge;
}

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

  // client_secret_basic
  const authHeader = req.headers.get("authorization") || "";
  if (authHeader.startsWith("Basic ")) {
    try {
      const decoded = Buffer.from(authHeader.slice(6), "base64").toString("utf8");
      const [id, secret] = decoded.split(":");
      if (id && !body.client_id) body.client_id = id;
      if (secret && !body.client_secret) body.client_secret = secret;
    } catch {
      /* ignore */
    }
  }

  const grant_type = body.grant_type || "authorization_code";
  const code = body.code || "";
  const redirect_uri = body.redirect_uri || "";
  const client_id = body.client_id || "";
  const client_secret = body.client_secret || "";
  const code_verifier = body.code_verifier || "";

  if (grant_type !== "authorization_code") {
    return NextResponse.json({ error: "unsupported_grant_type" }, { status: 400 });
  }
  if (!code || !client_id || !redirect_uri) {
    return NextResponse.json(
      {
        error: "invalid_request",
        error_description: "code, client_id, redirect_uri required",
      },
      { status: 400 }
    );
  }

  const app = await getAppByClientId(client_id);
  if (!app) {
    return NextResponse.json({ error: "invalid_client" }, { status: 401 });
  }
  // Allow public clients with PKCE (no secret) OR secret match
  if (client_secret && app.client_secret !== client_secret) {
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
    return NextResponse.json(
      { error: "invalid_grant", error_description: "Invalid code" },
      { status: 400 }
    );
  }
  if (row.used) {
    return NextResponse.json(
      { error: "invalid_grant", error_description: "Code already used" },
      { status: 400 }
    );
  }
  if (new Date(row.expires_at).getTime() < Date.now()) {
    return NextResponse.json(
      { error: "invalid_grant", error_description: "Code expired" },
      { status: 400 }
    );
  }
  if (row.redirect_uri !== redirect_uri) {
    return NextResponse.json(
      { error: "invalid_grant", error_description: "redirect_uri mismatch" },
      { status: 400 }
    );
  }

  if (row.code_challenge) {
    const ok = verifyPkce(
      code_verifier,
      row.code_challenge,
      row.code_challenge_method || "S256"
    );
    if (!ok) {
      return NextResponse.json(
        { error: "invalid_grant", error_description: "PKCE verification failed" },
        { status: 400 }
      );
    }
  } else if (!client_secret) {
    // no PKCE and no secret
    return NextResponse.json(
      { error: "invalid_client", error_description: "client_secret or PKCE required" },
      { status: 401 }
    );
  }

  await sb.from("oauth_auth_codes").update({ used: true }).eq("code", code);

  const access_token = row.access_token || generateAccessToken();

  return NextResponse.json({
    access_token,
    token_type: "Bearer",
    expires_in: 3600,
    scope: "openid profile email mcp:read mcp:write",
    user: {
      email: row.user_email,
      name: row.user_name,
      image: row.user_image,
      provider: row.provider,
    },
  });
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
