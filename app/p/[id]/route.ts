import { getSupabase } from "@/lib/supabase";

export async function GET(
  _req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const supabase = getSupabase();

  if (!supabase) {
    return new Response(
      `<!DOCTYPE html><html><body style="font-family:system-ui;padding:2rem">
      <h1>Publish backend not configured</h1>
      <p>Add Supabase env vars on Vercel to enable public project pages.</p>
      </body></html>`,
      { status: 503, headers: { "Content-Type": "text/html; charset=utf-8" } }
    );
  }

  const { data, error } = await supabase
    .from("projects")
    .select("html, title")
    .eq("id", id)
    .single();

  if (error || !data?.html) {
    return new Response(
      `<!DOCTYPE html><html><body style="font-family:system-ui;padding:2rem">
      <h1>Project not found</h1>
      <p>Invalid or deleted project id.</p>
      </body></html>`,
      { status: 404, headers: { "Content-Type": "text/html; charset=utf-8" } }
    );
  }

  return new Response(data.html, {
    status: 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "public, max-age=60",
      "X-Robots-Tag": "noindex",
    },
  });
}
