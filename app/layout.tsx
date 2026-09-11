import type { Metadata } from "next";
import { SessionProvider } from "./components/SessionProvider";
import Navbar from "./components/Navbar";
import AdsterraScripts from "./components/AdsterraScripts";
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
          <main className="fade-up">{children}</main>
          <AdsterraScripts />
        </SessionProvider>
      </body>
    </html>
  );
}
