"use client";

import { useEffect, useRef } from "react";

/**
 * Adsterra Banner 160x600
 * key: ce45dff40b7e92ab58cbab1c662005c1
 */
export default function AdBanner() {
  const bannerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = bannerRef.current;
    if (!el || el.firstChild) return;

    const atOptions = {
      key: "ce45dff40b7e92ab58cbab1c662005c1",
      format: "iframe",
      height: 600,
      width: 160,
      params: {},
    };

    const conf = document.createElement("script");
    conf.innerHTML = `atOptions = ${JSON.stringify(atOptions)};`;

    const script = document.createElement("script");
    script.type = "text/javascript";
    script.src =
      "https://www.highrevenueformat.com/ce45dff40b7e92ab58cbab1c662005c1/invoke.js";

    el.appendChild(conf);
    el.appendChild(script);
  }, []);

  return (
    <div
      ref={bannerRef}
      style={{
        width: 160,
        height: 600,
        margin: "0 auto",
        overflow: "hidden",
        display: "flex",
        justifyContent: "center",
        alignItems: "flex-start",
      }}
    />
  );
}
