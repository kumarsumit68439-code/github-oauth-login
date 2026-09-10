import type { Metadata } from "next";
import { SessionProvider } from "./components/SessionProvider";
import Navbar from "./components/Navbar";
import AdSenseScript from "./components/AdSenseScript";
import AdBanner from "./components/AdBanner";
import "./globals.css";

export const metadata: Metadata = {
  title: "OAuth App — GitHub & Google",
  description: "Login with GitHub or Google OAuth",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <AdSenseScript />
        <SessionProvider>
          <Navbar />
          <div
            style={{
              maxWidth: 960,
              margin: "0 auto",
              padding: "0.5rem 1rem 0",
            }}
          >
            <AdBanner format="horizontal" label="Top banner ad" />
          </div>
          {children}
          <footer
            style={{
              maxWidth: 960,
              margin: "2rem auto 1rem",
              padding: "0 1rem 1.5rem",
            }}
          >
            <AdBanner
              format="horizontal"
              label="Footer banner ad"
              slot={process.env.NEXT_PUBLIC_ADSENSE_SLOT_FOOTER}
            />
            <p
              style={{
                textAlign: "center",
                fontSize: 11,
                color: "#94a3b8",
                marginTop: 12,
              }}
            >
              Ads help keep this app free · Configure via AdSense env vars
            </p>
          </footer>
        </SessionProvider>
      </body>
    </html>
  );
}
