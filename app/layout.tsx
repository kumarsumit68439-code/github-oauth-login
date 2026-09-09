import type { Metadata } from "next";
import { SessionProvider } from "./components/SessionProvider";
import Navbar from "./components/Navbar";
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
        <SessionProvider>
          <Navbar />
          {children}
        </SessionProvider>
      </body>
    </html>
  );
}
