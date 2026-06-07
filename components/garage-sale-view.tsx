"use client";

import { useState, useEffect, useRef } from "react";
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
      <div style={{ display: "inline-block", background: "#fffaf9", padding: "4px 10px 5px", textAlign: "center", boxShadow: "0 2px 10px rgba(0,0,0,0.18)", filter: "url(#worn-edge)" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 2, marginBottom: 4 }}>
          <div style={stripe} /><div style={stripe} />
        </div>
        <div style={{ fontSize: 9, color: "#c0392b", fontWeight: 600, letterSpacing: "0.04em", fontFamily: "Courier New, Courier, monospace", lineHeight: 1.3 }}>
          Ends {endLabel}
        </div>
        <div style={{ fontSize: 9, color: "#c0392b", fontFamily: "Courier New, Courier, monospace", fontVariantNumeric: "tabular-nums", marginTop: 2, lineHeight: 1.3 }}>
          {fmt(t)}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 2, marginTop: 4 }}>
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
  onTestNotice?: () => void;
  onAdminClick?: () => void;
};

const BLANKET_ASPECT = 8142 / 6472; // width / height

export function GarageSaleView({ items, onItemClick, onClose, onTestNotice, onAdminClick }: Props) {
  const [hoveredId, setHoveredId] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [tileCount, setTileCount] = useState(2);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      const tileH = el.offsetWidth / BLANKET_ASPECT;
      setTileCount(Math.ceil(el.offsetHeight / tileH) + 1);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // ── Top-right icon buttons ────────────────────────────────────────────────
  const iconBtnStyle: React.CSSProperties = {
    background: "none", border: "none", padding: 0, cursor: "pointer", lineHeight: 0,
  };
  const toggleBtn = (
    <div style={{ position: "fixed", top: 16, right: 18, zIndex: 200, display: "flex", alignItems: "center", gap: 14 }}>
      {onAdminClick && (
        <button type="button" onClick={onAdminClick} title="Admin" style={iconBtnStyle}>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width={20} height={20} fill="none" stroke="#bbb" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="8" r="4" />
            <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
          </svg>
        </button>
      )}
      <button type="button" onClick={onClose} title="Back to grid" style={iconBtnStyle}>
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width={20} height={20} fill="none" stroke="#bbb" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
          <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
        </svg>
      </button>
    </div>
  );

  return (
    <div style={{ background: "#FCFBF8", padding: `0 ${PAGE_MARGIN}px`, minHeight: "100vh" }}>
      {toggleBtn}
      {process.env.NODE_ENV !== "production" && onTestNotice && (
        <button
          type="button"
          onClick={() => { localStorage.removeItem("pickup_disclaimer_seen"); onTestNotice(); }}
          style={{ position: "fixed", bottom: 16, left: 16, zIndex: 200, fontSize: 9, color: "#bbb", background: "none", border: "1px dashed #ddd", borderRadius: 4, padding: "3px 7px", cursor: "pointer" }}
        >
          test notice
        </button>
      )}

      <div style={{ maxWidth: CONTENT_MAX, margin: `${CORNER_OVERLAP + 20}px auto 0` }}>
        {/* Outer: establishes stacking context */}
        <div ref={containerRef} style={{ position: "relative" }}>

          {/* ── Blanket tile layer (behind everything) ── */}
          <div
            style={{ position: "absolute", top: 0, left: 0, right: 0, zIndex: 0, pointerEvents: "none" }}
            aria-hidden
          >
            {Array.from({ length: tileCount }).map((_, i) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={i} src="/assets/blanket.png" alt="" style={{ display: "block", width: "100%" }} />
            ))}
          </div>

          {/* ── Content layer ── */}
          <div style={{ position: "relative", zIndex: 1, padding: `${CORNER_OVERLAP + 32}px 20px 56px` }}>

            {/* Logo — top-left corner, tilted */}
            <div style={{ position: "absolute", top: -CORNER_OVERLAP, left: 12, zIndex: 10, transform: "rotate(-6deg)", transformOrigin: "bottom left", pointerEvents: "none" }}>
              <Image src="/assets/lydia's-garage-sale.png" alt="Lydia's Garage Sale" width={150} height={94} style={{ display: "block", filter: "drop-shadow(0 4px 14px rgba(0,0,0,0.28))" }} priority />
            </div>

            {/* Date tag — behind logo */}
            <div style={{ position: "absolute", top: -CORNER_OVERLAP + 22, left: 140, zIndex: 8, transform: "rotate(5deg)", transformOrigin: "bottom right", pointerEvents: "none" }}>
              <EndDateTag />
            </div>

            {/* Organic auto-fill grid */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))",
                gap: "20px 12px",
              }}
            >
              {items.map((item, i) => {
                const rotation     = (rand(i * 7 + 3)  - 0.5) * 16;
                const yNudge       = (rand(i * 13 + 9) - 0.5) * 14;
                const isHovered    = hoveredId === item.id;
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
    </div>
  );
}
