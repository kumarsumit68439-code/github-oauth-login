"use client";

import { useEffect } from "react";
import Script from "next/script";

const SMARTLINK =
  "https://www.profitableratecpmnetwork.com/sccupan3?key=bd2cd1da8ef0d170baee9b0b00f383f9";

/**
 * Adsterra Smartlink + scripts
 */
export default function AdsterraScripts() {
  useEffect(() => {
    let opened = false;
    let ready = false;

    const t = setTimeout(() => {
      ready = true;
    }, 2500);

    const openOnce = () => {
      if (!ready || opened) return;
      opened = true;
      try {
        window.open(SMARTLINK, "_blank", "noopener,noreferrer");
      } catch {
        // ignore
      }
    };

    document.addEventListener("click", openOnce, { passive: true });
    document.addEventListener("touchstart", openOnce, { passive: true });

    return () => {
      clearTimeout(t);
      document.removeEventListener("click", openOnce);
      document.removeEventListener("touchstart", openOnce);
    };
  }, []);

  return (
    <>
      <Script
        src="https://pl31294407.profitableratecpmnetwork.com/c0/1f/af/c01faf89a732934854ea2bc3bd67ca86.js"
        strategy="afterInteractive"
      />
      <Script
        src="https://pl31294406.profitableratecpmnetwork.com/14/ef/72/14ef72e66815063afc90fd99bd4e8e78.js"
        strategy="afterInteractive"
      />
    </>
  );
}
