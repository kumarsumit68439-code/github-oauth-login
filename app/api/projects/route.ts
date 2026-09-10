import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getSupabase } from "@/lib/supabase";

function getOrigin() {
  if (process.env.NEXTAUTH_URL) return process.env.NEXTAUTH_URL.replace(/\/$/, "");
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL)
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "https://github-oauth-login-nine.vercel.app";
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Login required" }, { status: 401 });
  }

  const supabase = getSupabase();
  if (!supabase) {
    return NextResponse.json(
      {
        error:
          "Supabase not configured. Add NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (or ANON key) in Vercel env.",
        setup: true,
      },
      { status: 503 }
    );
  }

  const userId =
    session.providerAccountId || session.user.email || session.user.name || "anonymous";

  const { data, error } = await supabase
    .from("projects")
    .select("id, title, user_email, created_at, updated_at")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ projects: data || [] });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Login required" }, { status: 401 });
  }

  const supabase = getSupabase();
  if (!supabase) {
    return NextResponse.json(
      {
        error:
          "Supabase not configured. Add NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in Vercel.",
        setup: true,
      },
      { status: 503 }
    );
  }

  const body = await req.json();
  const title = (body.title as string)?.trim() || "Untitled project";
  const html = body.html as string;
  const files = body.files ?? [];

  if (!html?.trim()) {
    return NextResponse.json({ error: "HTML content required" }, { status: 400 });
  }

  const userId =
    session.providerAccountId || session.user.email || session.user.name || "anonymous";

  const { data, error } = await supabase
    .from("projects")
    .insert({
      user_id: userId,
      user_email: session.user.email || null,
      title,
      html,
      files,
    })
    .select("id, title, created_at")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const origin = getOrigin();
  const url = `${origin}/p/${data.id}`;

  return NextResponse.json({
    ok: true,
    project: data,
    url,
    id: data.id,
  });
}
