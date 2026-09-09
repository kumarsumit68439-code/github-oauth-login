import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const BOT_UA =
  /bot|crawler|spider|slurp|facebookexternalhit|linkedinbot|twitterbot|whatsapp|telegram|discord|gptbot|chatgpt|claude|anthropic|bytespider|amazonbot|petalbot|semrush|ahrefs|mj12bot|dotbot|baiduspider|yandex|sogou|exabot|ia_archiver|scrapy|python-requests|curl|wget|httpclient|java\/|go-http|okhttp|phantom|headless|puppeteer|playwright|selenium/i;

export function middleware(request: NextRequest) {
  const ua = request.headers.get("user-agent") || "";
  const path = request.nextUrl.pathname;

  // Block known scrapers / AI bots from app pages (allow Next assets)
  if (
    !path.startsWith("/_next") &&
    !path.startsWith("/api/auth") &&
    path !== "/robots.txt" &&
    path !== "/favicon.ico" &&
    BOT_UA.test(ua)
  ) {
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
  return res;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image).*)"],
};
