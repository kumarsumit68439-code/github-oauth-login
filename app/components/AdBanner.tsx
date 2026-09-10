"use client";

import { useEffect, useRef } from "react";

type Props = {
  slot?: string;
  format?: "auto" | "horizontal" | "rectangle" | "vertical";
  style?: React.CSSProperties;
  className?: string;
  label?: string;
};

/**
 * Google AdSense unit.
 * Set NEXT_PUBLIC_ADSENSE_CLIENT=ca-pub-xxxxxxxx
 * and NEXT_PUBLIC_ADSENSE_SLOT_BANNER=1234567890 on Vercel.
 * Until approved, shows a soft placeholder so layout stays stable.
 */
export default function AdBanner({
  slot,
  format = "auto",
  style,
  className,
  label = "Advertisement",
}: Props) {
  const pushed = useRef(false);
  const client = process.env.NEXT_PUBLIC_ADSENSE_CLIENT;
  const adSlot = slot || process.env.NEXT_PUBLIC_ADSENSE_SLOT_BANNER;
  const enabled = Boolean(client && adSlot && !client.includes("xxxxxxxx"));

  useEffect(() => {
    if (!enabled || pushed.current) return;
    try {
      // @ts-expect-error adsbygoogle
      (window.adsbygoogle = window.adsbygoogle || []).push({});
      pushed.current = true;
    } catch {
      /* ignore */
    }
  }, [enabled]);

  if (!enabled) {
    return (
      <div
        className={className}
        style={{
          width: "100%",
          minHeight: 90,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: 12,
          border: "1px dashed rgba(148,163,184,0.45)",
          background:
            "linear-gradient(135deg, rgba(15,23,42,0.04), rgba(99,102,241,0.06))",
          color: "#64748b",
          fontSize: 12,
          letterSpacing: 0.3,
          ...style,
        }}
      >
        <div style={{ textAlign: "center", padding: 12 }}>
          <div style={{ fontWeight: 600, marginBottom: 4 }}>{label}</div>
          <div style={{ opacity: 0.85 }}>
            Ad slot ready · set NEXT_PUBLIC_ADSENSE_CLIENT + SLOT on Vercel
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={className} style={{ width: "100%", overflow: "hidden", ...style }}>
      <ins
        className="adsbygoogle"
        style={{ display: "block", minHeight: 90 }}
        data-ad-client={client}
        data-ad-slot={adSlot}
        data-ad-format={format}
        data-full-width-responsive="true"
      />
    </div>
  );
}
