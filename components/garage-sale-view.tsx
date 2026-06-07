"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import type { SaleItemPublic } from "@/lib/types";
import { AUCTION_END } from "@/lib/site";

// ── Constants ────────────────────────────────────────────────────────────────
const PAGE_MARGIN = 6;
const CONTENT_MAX = 960;
const CORNER_OVERLAP = 40; // how far the logo/date hang above the blanket top

// ── Seeded PRNG ───────────────────────────────────────────────────────────────
function rand(seed: number) {
  const x = Math.sin(seed + 1) * 10000;
  return x - Math.floor(x);
}

// ── Countdown helpers ─────────────────────────────────────────────────────────
function getTimeLeft(end: Date) {
  const diff = end.getTime() - Date.now();
  if (diff <= 0) return null;
  return {
    days:    Math.floor(diff / 86400000),
    hours:   Math.floor((diff % 86400000) / 3600000),
    minutes: Math.floor((diff % 3600000) / 60000),
    seconds: Math.floor((diff % 60000) / 1000),
  };
}

function useCountdown(end: Date) {
  const [t, setT] = useState(() => getTimeLeft(end));
  useEffect(() => {
    const id = setInterval(() => setT(getTimeLeft(end)), 1000);
    return () => clearInterval(id);
  }, [end]);
  return t;
}

function fmt(t: ReturnType<typeof getTimeLeft>) {
  if (!t) return "Auction ended";
  if (t.days > 0) return `${t.days}d ${t.hours}h left`;
  if (t.hours > 0) return `${t.hours}h ${t.minutes}m left`;
  return `${t.minutes}m ${t.seconds}s left`;
}

// ── End-date label ────────────────────────────────────────────────────────────
function EndDateTag() {
  const t = useCountdown(AUCTION_END);
  const endLabel = AUCTION_END.toLocaleDateString("en-US", {
    month: "short", day: "numeric", timeZone: "America/Toronto",
  });
  const stripe: React.CSSProperties = { height: 2, background: "#c0392b", borderRadius: 1 };

  return (
    <div style={{ display: "inline-block", position: "relative" }}>
      <svg width="0" height="0" style={{ position: "absolute" }}>
        <defs>
          <filter id="worn-edge" x="-8%" y="-15%" width="116%" height="130%">
            <feTurbulence type="fractalNoise" baseFrequency="0.055" numOctaves="4" seed="8" result="noise" />
            <feDisplacementMap in="SourceGraphic" in2="noise" scale="4" xChannelSelector="R" yChannelSelector="G" />
          </filter>
        </defs>
      </svg>
      <div style={{ display: "inline-block", background: "#fffaf9", padding: "5px 14px 6px", textAlign: "center", boxShadow: "0 2px 10px rgba(0,0,0,0.18)", filter: "url(#worn-edge)" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 2, marginBottom: 5 }}>
          <div style={stripe} /><div style={stripe} />
        </div>
        <div style={{ fontSize: 11, color: "#c0392b", fontWeight: 600, letterSpacing: "0.04em", fontFamily: "Courier New, Courier, monospace", lineHeight: 1.3 }}>
          Ends {endLabel}
        </div>
        <div style={{ fontSize: 11, color: "#c0392b", fontFamily: "Courier New, Courier, monospace", fontVariantNumeric: "tabular-nums", marginTop: 2, lineHeight: 1.3 }}>
          {fmt(t)}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 2, marginTop: 5 }}>
          <div style={stripe} /><div style={stripe} />
        </div>
      </div>
    </div>
  );
}

// ── Price sticker ─────────────────────────────────────────────────────────────
function PriceSticker({ name, price }: { name: string; price: number }) {
  return (
    <div style={{ position: "relative", width: 88, height: 88, pointerEvents: "none" }}>
      <svg viewBox="0 0 100 100" width={88} height={88} style={{ position: "absolute", inset: 0 }}>
        <path d="M50,4 L55,22 L68,10 L68,28 L84,20 L79,37 L97,34 L88,50 L97,66 L79,63 L84,80 L68,72 L68,90 L55,78 L50,96 L45,78 L32,90 L32,72 L16,80 L21,63 L3,66 L12,50 L3,34 L21,37 L16,20 L32,28 L32,10 L45,22 Z" fill="#2323CC" />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: "white", textAlign: "center", padding: "0 18px" }}>
        <div style={{ fontSize: 8, fontWeight: 700, lineHeight: 1.2, maxWidth: 52, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", marginBottom: 2 }}>
          {name}
        </div>
        <div style={{ fontSize: 16, fontWeight: 800, letterSpacing: "-0.02em" }}>${price}</div>
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
type Props = {
  items: SaleItemPublic[];
  onItemClick: (item: SaleItemPublic) => void;
  onClose: () => void;
};

export function GarageSaleView({ items, onItemClick, onClose }: Props) {
  const [hoveredId, setHoveredId] = useState<number | null>(null);

  // ── Close / back-to-grid button ────────────────────────────────────────────
  const toggleBtn = (
    <button
      type="button"
      onClick={onClose}
      title="Back to grid"
      style={{ position: "fixed", top: 16, right: 18, zIndex: 200, background: "rgba(255,255,255,0.85)", border: "1.5px solid #ddd", borderRadius: "50%", width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", backdropFilter: "blur(6px)", boxShadow: "0 2px 8px rgba(0,0,0,0.12)" }}
    >
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width={16} height={16} fill="none" stroke="#888" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
        <rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
      </svg>
    </button>
  );

  return (
    <div style={{ background: "#FCFBF8", padding: `0 ${PAGE_MARGIN}px`, minHeight: "100vh" }}>
      {toggleBtn}

      <div style={{ maxWidth: CONTENT_MAX, margin: `${CORNER_OVERLAP + 20}px auto 0` }}>
        {/*
          Blanket tiles vertically as a CSS background — no fixed-height <Image>.
          Grid grows with content; blanket repeats seamlessly behind it.
        */}
        <div
          style={{
            position: "relative",
            backgroundImage: "url('/assets/blanket.png')",
            backgroundRepeat: "no-repeat",
            backgroundSize: "100% 100%",
            padding: `${CORNER_OVERLAP + 32}px 20px 56px`,
          }}
        >
          {/* Logo — top-left corner, tilted */}
          <div style={{ position: "absolute", top: -CORNER_OVERLAP, left: 12, zIndex: 10, transform: "rotate(-6deg)", transformOrigin: "bottom left" }}>
            <div className="wiggle-on-hover" style={{ transformOrigin: "center" }}>
              <Image src="/assets/lydia's-garage-sale.png" alt="Lydia's Garage Sale" width={150} height={94} style={{ display: "block", filter: "drop-shadow(0 4px 14px rgba(0,0,0,0.28))" }} priority />
            </div>
          </div>

          {/* Date tag — top-right corner, tilted */}
          <div style={{ position: "absolute", top: -CORNER_OVERLAP + 10, right: 12, zIndex: 10, transform: "rotate(5deg)", transformOrigin: "bottom right" }}>
            <div className="wiggle-on-hover" style={{ transformOrigin: "center" }}>
              <EndDateTag />
            </div>
          </div>

          {/* Organic auto-fill grid — adapts columns to any viewport width */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))",
              gap: "20px 12px",
            }}
          >
            {items.map((item, i) => {
              const rotation    = (rand(i * 7 + 3)  - 0.5) * 16; // ±8 deg
              const yNudge      = (rand(i * 13 + 9) - 0.5) * 14; // ±7 px vertical drift
              const isHovered   = hoveredId === item.id;
              const displayPrice = item.currentBid ?? item.startingBid;

              return (
                <div
                  key={item.id}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    animation: "garage-drop 0.6s cubic-bezier(0.34,1.56,0.64,1) both",
                    animationDelay: `${i * 55}ms`,
                  }}
                >
                  <div
                    style={{
                      transform: isHovered
                        ? `rotate(${rotation}deg) translateY(${yNudge}px) scale(1.1)`
                        : `rotate(${rotation}deg) translateY(${yNudge}px)`,
                      transition: "transform 0.2s cubic-bezier(0.34,1.56,0.64,1)",
                      cursor: "pointer",
                      position: "relative",
                      width: "100%",
                      aspectRatio: "1/1",
                      zIndex: isHovered ? 10 : 1,
                    }}
                    onMouseEnter={() => setHoveredId(item.id)}
                    onMouseLeave={() => setHoveredId(null)}
                    onClick={() => onItemClick(item)}
                  >
                    <Image
                      src={item.images[0]}
                      alt={item.name}
                      fill
                      sizes="(max-width: 640px) 50vw, (max-width: 960px) 25vw, 200px"
                      style={{ objectFit: "contain", filter: "drop-shadow(0 4px 12px rgba(0,0,0,0.2))" }}
                    />
                    {isHovered && (
                      <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", zIndex: 5, pointerEvents: "none" }}>
                        <PriceSticker name={item.name} price={displayPrice} />
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
