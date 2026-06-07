"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import type { SaleItemPublic } from "@/lib/types";
import { AUCTION_END } from "@/lib/site";

type ItemCardProps = {
  item: SaleItemPublic;
  onClick?: (item: SaleItemPublic) => void;
  isAdmin?: boolean;
  onMarkSold?: (id: number) => void;
  onPriceEdit?: (id: number, price: number) => void;
  onBid?: (id: number, amount: number, name: string, email: string) => Promise<{ ok: boolean; newBid: number }>;
  onBeforeBidOpen?: (action: () => void) => void;
};

function useBidder() {
  const [bidder, setBidder] = useState({ id: "", name: "", email: "" });
  useEffect(() => {
    let id = localStorage.getItem("bidder_id") ?? "";
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem("bidder_id", id);
    }
    setBidder({
      id,
      name: localStorage.getItem("bidder_name") ?? "",
      email: localStorage.getItem("bidder_email") ?? "",
    });
  }, []);
  const save = (name: string, email: string) => {
    localStorage.setItem("bidder_name", name);
    localStorage.setItem("bidder_email", email);
    setBidder((b) => ({ ...b, name, email }));
  };
  return { bidder, save };
}

export function ItemCard({
  item,
  onClick,
  isAdmin,
  onMarkSold,
  onPriceEdit,
  onBid,
  onBeforeBidOpen,
}: ItemCardProps) {
  const isClaimed = item.status === "claimed";
  const [editingPrice, setEditingPrice] = useState(false);
  const [priceInput, setPriceInput] = useState(String(item.price));
  const [showBidForm, setShowBidForm] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [isMobile, setIsMobile] = useState(true);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [amount, setAmount] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [bidError, setBidError] = useState<string | null>(null);
  const [bidSuccess, setBidSuccess] = useState<number | null>(null);
  const { bidder, save } = useBidder();

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 640px)");
    setIsMobile(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  useEffect(() => {
    if (bidder.name) setName(bidder.name);
    if (bidder.email) setEmail(bidder.email);
  }, [bidder.name, bidder.email]);

  const handlePriceSave = () => {
    const val = parseInt(priceInput, 10);
    if (!isNaN(val) && val > 0) onPriceEdit?.(item.id, val);
    setEditingPrice(false);
  };

  const auctionOpen = Date.now() < AUCTION_END.getTime();
  const minBid = item.currentBid !== null ? item.currentBid + 1 : item.startingBid;
  const displayBid = item.currentBid ?? item.startingBid;

  const handleCardClick = () => {
    if (isAdmin || isClaimed) return;
    if (isMobile) {
      onClick?.(item);
    } else {
      const openBidForm = () => {
        setShowBidForm(true);
        setBidError(null);
        setBidSuccess(null);
      };
      onBeforeBidOpen ? onBeforeBidOpen(openBidForm) : openBidForm();
    }
  };

  const handleBidSubmit = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!name.trim() || !email.trim() || !amount || submitting || !onBid) return;
    const amountNum = parseInt(amount, 10);
    if (isNaN(amountNum) || amountNum < minBid) {
      setBidError(`Min $${minBid}`);
      return;
    }
    setSubmitting(true);
    setBidError(null);
    try {
      save(name.trim(), email.trim());
      const result = await onBid(item.id, amountNum, name.trim(), email.trim());
      setBidSuccess(result.newBid);
      setTimeout(() => setShowBidForm(false), 2000);
    } catch (err) {
      setBidError(err instanceof Error ? err.message : "Failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      onClick={handleCardClick}
      onMouseEnter={() => !isMobile && !isAdmin && !showBidForm && setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: "transparent",
        border: isAdmin ? "1.5px solid #000" : "none",
        borderRadius: isAdmin ? 12 : 0,
        overflow: isAdmin ? "hidden" : "visible",
        cursor: isAdmin || isClaimed ? "default" : "pointer",
        display: "flex",
        flexDirection: "column",
        userSelect: "none",
        opacity: isAdmin && isClaimed ? 0.45 : 1,
        aspectRatio: "4/5",
        position: "relative",
      }}
    >
      <div style={{ flex: 1, position: "relative", overflow: isAdmin ? "hidden" : "visible", minHeight: 0, background: "transparent" }}>
        <Image
          src={item.images[0]}
          alt={item.name}
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 960px) 33vw, 200px"
          style={{ objectFit: "contain", pointerEvents: "none", padding: 8 }}
        />
        {item.images.length > 1 && (
          <div
            style={{
              position: "absolute",
              bottom: 6,
              right: 6,
              background: "rgba(0,0,0,0.5)",
              color: "#fff",
              fontSize: 9,
              padding: "2px 5px",
              borderRadius: 8,
            }}
          >
            1/{item.images.length}
          </div>
        )}
        {hovered && !isAdmin && !isClaimed && !showBidForm && (
          <div
            style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              width: "80%",
              pointerEvents: "none",
              zIndex: 2,
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/assets/starburst.png" alt="" style={{ width: "100%", display: "block" }} />
            <div
              style={{
                position: "absolute",
                inset: 0,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                textAlign: "center",
                padding: "0 18%",
              }}
            >
              <div style={{ fontSize: 10, color: "#fff", fontWeight: 400, lineHeight: 1.3, marginBottom: 3 }}>
                {item.name}
              </div>
              <div style={{ fontSize: 15, color: "#fff", fontWeight: 700, letterSpacing: "-0.02em" }}>
                ${item.currentBid ?? item.startingBid}
              </div>
            </div>
          </div>
        )}

        {isAdmin && isClaimed && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <span
              style={{
                fontSize: 11,
                fontWeight: 600,
                color: "#fff",
                letterSpacing: "0.15em",
                transform: "rotate(-15deg)",
                border: "1.5px solid rgba(255,255,255,0.6)",
                padding: "2px 8px",
                borderRadius: 3,
                background: "rgba(0,0,0,0.45)",
              }}
            >
              SOLD
            </span>
          </div>
        )}
        {isAdmin && !isClaimed && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: "rgba(0,0,0,0.52)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
              padding: 10,
            }}
          >
            {item.topBidder && (
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 10, color: "rgba(255,255,255,0.7)", marginBottom: 2 }}>
                  Top bid
                </div>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>
                  ${item.topBidder.amount}
                </div>
                <div style={{ fontSize: 9, color: "rgba(255,255,255,0.75)", marginTop: 1 }}>
                  {item.topBidder.name}
                </div>
                <div style={{ fontSize: 9, color: "rgba(255,255,255,0.55)" }}>
                  {item.topBidder.email}
                </div>
              </div>
            )}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onMarkSold?.(item.id);
              }}
              style={{
                padding: "6px 12px",
                background: "#fff",
                color: "#000",
                border: "none",
                borderRadius: 8,
                fontSize: 11,
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              Mark Sold
            </button>
          </div>
        )}
      </div>

      <div style={{ padding: "8px 10px 10px", background: "transparent", display: isMobile || isAdmin ? "block" : "none" }}>
        <div
          style={{
            fontSize: 11,
            fontWeight: 400,
            color: "#aaa",
            marginBottom: 3,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {item.name}
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          {isAdmin && !isClaimed ? (
            editingPrice ? (
              <div
                style={{ display: "flex", gap: 3, alignItems: "center" }}
                onClick={(e) => e.stopPropagation()}
              >
                <span style={{ fontSize: 12, fontWeight: 700 }}>$</span>
                <input
                  autoFocus
                  value={priceInput}
                  onChange={(e) => setPriceInput(e.target.value)}
                  onBlur={handlePriceSave}
                  onKeyDown={(e) => e.key === "Enter" && handlePriceSave()}
                  style={{
                    width: 44,
                    fontSize: 12,
                    fontWeight: 700,
                    border: "none",
                    borderBottom: "1.5px solid #000",
                    outline: "none",
                    background: "transparent",
                  }}
                />
              </div>
            ) : (
              <span
                onClick={(e) => {
                  e.stopPropagation();
                  setEditingPrice(true);
                  setPriceInput(String(item.price));
                }}
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  color: "#000",
                  fontVariantNumeric: "tabular-nums",
                  cursor: "text",
                  borderBottom: "1px dashed #999",
                  paddingBottom: 1,
                }}
              >
                ${item.price}
              </span>
            )
          ) : (
            <div>
              <span
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  color: "#000",
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                ${displayBid}
              </span>
              {item.bidCount > 0 && (
                <span style={{ fontSize: 10, color: "#bbb", marginLeft: 4 }}>
                  {item.bidCount} bid{item.bidCount === 1 ? "" : "s"}
                </span>
              )}
            </div>
          )}
          {isAdmin && isClaimed && (
            <span style={{ fontSize: 10, color: "#aaa", fontWeight: 500 }}>
              Sold
            </span>
          )}
        </div>
      </div>

      {/* Desktop inline bid form overlay */}
      {showBidForm && !isMobile && !isAdmin && (
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            position: "absolute",
            inset: 0,
            background: "rgba(255,255,255,0.97)",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            padding: "12px 14px",
            gap: 6,
          }}
        >
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); setShowBidForm(false); }}
            style={{
              position: "absolute",
              top: 8,
              right: 10,
              background: "none",
              border: "none",
              fontSize: 16,
              cursor: "pointer",
              color: "#bbb",
              lineHeight: 1,
            }}
          >
            ×
          </button>
          <div style={{ fontSize: 11, fontWeight: 600, color: "#000", marginBottom: 2 }}>
            {item.name}
          </div>
          <div style={{ fontSize: 10, color: "#bbb", marginBottom: 4 }}>
            {item.currentBid !== null
              ? `Current: $${item.currentBid} · min $${minBid}`
              : `Starting bid: $${item.startingBid}`}
          </div>
          {bidSuccess !== null ? (
            <div style={{ textAlign: "center", fontSize: 12, color: "#000", fontWeight: 600 }}>
              ✓ Bid placed — ${bidSuccess}
            </div>
          ) : (
            <>
              {bidError && (
                <div style={{ fontSize: 10, color: "#ff4444" }}>{bidError}</div>
              )}
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Name"
                onClick={(e) => e.stopPropagation()}
                style={compactInput}
              />
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email"
                type="email"
                onClick={(e) => e.stopPropagation()}
                style={compactInput}
              />
              <div style={{ display: "flex", gap: 5 }}>
                <div style={{ position: "relative", flex: 1 }}>
                  <span style={{
                    position: "absolute", left: 8, top: "50%",
                    transform: "translateY(-50%)", fontSize: 11, color: "#999"
                  }}>$</span>
                  <input
                    value={amount}
                    onChange={(e) => setAmount(e.target.value.replace(/\D/g, ""))}
                    placeholder={String(minBid)}
                    type="number"
                    min={minBid}
                    onClick={(e) => e.stopPropagation()}
                    style={{ ...compactInput, paddingLeft: 18, width: "100%", boxSizing: "border-box" }}
                  />
                </div>
                <button
                  type="button"
                  disabled={!name.trim() || !email.trim() || !amount || submitting || !auctionOpen}
                  onClick={handleBidSubmit}
                  style={{
                    padding: "6px 10px",
                    background: name.trim() && email.trim() && amount ? "#000" : "#e0e0e0",
                    color: name.trim() && email.trim() && amount ? "#fff" : "#999",
                    border: "none",
                    borderRadius: 6,
                    fontSize: 11,
                    fontWeight: 600,
                    cursor: name.trim() && email.trim() && amount ? "pointer" : "default",
                    whiteSpace: "nowrap",
                  }}
                >
                  {submitting ? "…" : "Bid"}
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

const compactInput: React.CSSProperties = {
  width: "100%",
  padding: "6px 8px",
  border: "1.5px solid #e0e0e0",
  borderRadius: 6,
  fontSize: 11,
  outline: "none",
  color: "#000",
  background: "#fff",
  boxSizing: "border-box",
};
