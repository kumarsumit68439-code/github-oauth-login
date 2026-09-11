import type { Metadata } from "next";
import { SessionProvider } from "./components/SessionProvider";
import Navbar from "./components/Navbar";
import AdsterraScripts from "./components/AdsterraScripts";
import AdBanner from "./components/AdBanner";
import "./globals.css";

export const metadata: Metadata = {
  title: "OAuth + MCP Platform",
  description: "Google/GitHub OAuth provider, MCP for ChatGPT, project builder",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <SessionProvider>
          <Navbar />
          <div
            style={{
              display: "flex",
              maxWidth: 1200,
              margin: "0 auto",
              gap: 20,
              padding: "0 12px",
              alignItems: "flex-start",
            }}
          >
            {/* Left skyscraper ad */}
            <aside
              style={{
                flexShrink: 0,
                width: 160,
                position: "sticky",
                top: 80,
                display: "none",
              }}
              className="ad-desktop"
            >
              <AdBanner />
            </aside>

            <main className="fade-up" style={{ flex: 1, minWidth: 0 }}>
              {children}
            </main>

            {/* Right skyscraper ad */}
            <aside
              style={{
                flexShrink: 0,
                width: 160,
                position: "sticky",
                top: 80,
              }}
              className="ad-desktop"
            >
              <AdBanner />
            </aside>
          </div>

          {/* Mobile: show banner below content */}
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              padding: "16px 0 24px",
            }}
            className="ad-mobile"
          >
            <AdBanner />
          </div>

          <AdsterraScripts />
        </SessionProvider>
      </body>
    </html>
  );
}
