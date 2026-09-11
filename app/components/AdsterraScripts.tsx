"use client";

import Script from "next/script";

/**
 * Adsterra / Profitableratecpmnetwork ad scripts
 * Loads both provided scripts site-wide.
 */
export default function AdsterraScripts() {
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
