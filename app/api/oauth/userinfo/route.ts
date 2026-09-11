import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";

export const runtime = "nodejs";

/** GET /api/oauth/userinfo  Authorization: Bearer <access_token> */
export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization") || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7).trim() : "";
  if (!token) {
    return NextResponse.json({ error: "invalid_token" }, { status: 401 });
  }

  const sb = getSupabase();
  if (!sb) return NextResponse.json({ error: "server_error" }, { status: 500 });

  const { data } = await sb
    .from("oauth_auth_codes")
    .select("*")
    .eq("access_token", token)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!data) {
    return NextResponse.json({ error: "invalid_token" }, { status: 401 });
  }

  return NextResponse.json({
    sub: data.user_email || data.id,
    name: data.user_name,
    email: data.user_email,
    picture: data.user_image,
    provider: data.provider,
  });
}
