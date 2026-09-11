import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getSupabase } from "@/lib/supabase";
import {
  generateClientId,
  generateClientSecret,
  listAppsByOwner,
} from "@/lib/oauth-provider";

export const runtime = "nodejs";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const apps = await listAppsByOwner(session.user.email);
  // never return full secret list in bulk — mask
  const safe = apps.map((a) => ({
    ...a,
    client_secret: a.client_secret.slice(0, 6) + "…" + a.client_secret.slice(-4),
  }));
  return NextResponse.json({ apps: safe });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const sb = getSupabase();
  if (!sb) {
    return NextResponse.json(
      { error: "Supabase not configured (URL + SERVICE_ROLE_KEY)" },
      { status: 500 }
    );
  }

  const body = await req.json();
  const name = String(body.name || "").trim();
  const homepage_url = String(body.homepage_url || "").trim();
  const redirect_uris = Array.isArray(body.redirect_uris)
    ? body.redirect_uris.map((u: string) => String(u).trim()).filter(Boolean)
    : String(body.redirect_uris || "")
        .split("\n")
        .map((u: string) => u.trim())
        .filter(Boolean);
  const javascript_origins = Array.isArray(body.javascript_origins)
    ? body.javascript_origins.map((u: string) => String(u).trim()).filter(Boolean)
    : String(body.javascript_origins || "")
        .split("\n")
        .map((u: string) => u.trim())
        .filter(Boolean);

  if (!name || !homepage_url || !redirect_uris.length) {
    return NextResponse.json(
      { error: "name, homepage_url, and at least one redirect_uri required" },
      { status: 400 }
    );
  }

  const client_id = generateClientId();
  const client_secret = generateClientSecret();

  const { data, error } = await sb
    .from("oauth_apps")
    .insert({
      owner_email: session.user.email,
      owner_user_id: (session as any).providerAccountId || null,
      name,
      homepage_url,
      redirect_uris,
      javascript_origins,
      client_id,
      client_secret,
    })
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Return full secret ONCE
  return NextResponse.json({ ok: true, app: data }, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const sb = getSupabase();
  if (!sb) return NextResponse.json({ error: "No DB" }, { status: 500 });

  const { searchParams } = new URL(req.url);
  const client_id = searchParams.get("client_id");
  if (!client_id) {
    return NextResponse.json({ error: "client_id required" }, { status: 400 });
  }

  const { error } = await sb
    .from("oauth_apps")
    .delete()
    .eq("client_id", client_id)
    .eq("owner_email", session.user.email);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
