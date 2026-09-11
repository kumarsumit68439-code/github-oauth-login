import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const BOT_UA =
  /bot|crawler|spider|slurp|facebookexternalhit|linkedinbot|twitterbot|whatsapp|telegram|discord|gptbot|chatgpt|claude|anthropic|bytespider|amazonbot|petalbot|semrush|ahrefs|mj12bot|dotbot|baiduspider|yandex|sogou|exabot|ia_archiver|scrapy|python-requests|curl|wget|httpclient|java\/|go-http|okhttp|phantom|headless|puppeteer|playwright|selenium/i;

const ALLOW_PATHS = [
  "/api/auth",
  "/api/oauth",
  "/api/mcp",
  "/.well-known",
  "/oauth/docs",
  "/robots.txt",
  "/favicon.ico",
];

export function middleware(request: NextRequest) {
  const ua = request.headers.get("user-agent") || "";
  const path = request.nextUrl.pathname;

  const allowed =
    path.startsWith("/_next") ||
    ALLOW_PATHS.some((p) => path === p || path.startsWith(p + "/") || path.startsWith(p));

  // Block scrapers on app UI only — MCP/OAuth/ChatGPT must pass
  if (!allowed && BOT_UA.test(ua)) {
    return new NextResponse("Forbidden", {
      status: 403,
      headers: {
        "X-Robots-Tag": "noindex, nofollow, noarchive, nosnippet",
        "Cache-Control": "no-store",
      },
    });
  }

  const res = NextResponse.next();
  res.headers.set("X-Robots-Tag", "noindex, nofollow, noarchive, nosnippet, noimageindex");
  // CORS for MCP / OAuth discovery (ChatGPT)
  if (
    path.startsWith("/api/mcp") ||
    path.startsWith("/api/oauth") ||
    path.startsWith("/.well-known")
  ) {
    res.headers.set("Access-Control-Allow-Origin", "*");
    res.headers.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.headers.set(
      "Access-Control-Allow-Headers",
      "Content-Type, Authorization, MCP-Protocol-Version"
    );
  }
  return res;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image).*)"],
};
