"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Image from "next/image";
import { ItemCard } from "./item-card";
import { DetailSheet } from "./detail-sheet";
import { PasswordModal } from "./password-modal";
import { AddItemSheet } from "./add-item-sheet";
import { GarageSaleView } from "./garage-sale-view";
import { AUCTION_END } from "@/lib/site";
import type { SaleItemPublic } from "@/lib/types";

const POLL_MS = 8000;

function getTimeLeft(end: Date) {
  const diff = end.getTime() - Date.now();
  if (diff <= 0) return null;
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);
  return { days, hours, minutes, seconds };
}

function useCountdown(end: Date) {
  const [timeLeft, setTimeLeft] = useState(() => getTimeLeft(end));
  useEffect(() => {
    const id = setInterval(() => setTimeLeft(getTimeLeft(end)), 1000);
    return () => clearInterval(id);
  }, [end]);
  return timeLeft;
}

function formatCountdown(t: ReturnType<typeof getTimeLeft>): string {
  if (!t) return "Auction ended";
  if (t.days > 0) return `${t.days}d ${t.hours}h left`;
  if (t.hours > 0) return `${t.hours}h ${t.minutes}m left`;
  return `${t.minutes}m ${t.seconds}s left`;
}

export function SaleCanvas() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showAddSheet, setShowAddSheet] = useState(false);
  const [selectedItem, setSelectedItem] = useState<SaleItemPublic | null>(null);
  const [items, setItems] = useState<SaleItemPublic[]>([]);
  const [, setCatalogTotal] = useState(0);
  const [isGarageSaleView, setIsGarageSaleView] = useState(false);

  const [showPickupNotice, setShowPickupNotice] = useState(false);
  const pendingBidAction = useRef<(() => void) | null>(null);

  const withPickupNotice = useCallback((action: () => void) => {
    if (typeof window !== "undefined" && localStorage.getItem("pickup_disclaimer_seen")) {
      action();
    } else {
      pendingBidAction.current = action;
      setShowPickupNotice(true);
    }
  }, []);

  const handlePickupNoticeAcknowledge = () => {
    if (typeof window !== "undefined") {
      localStorage.setItem("pickup_disclaimer_seen", "1");
    }
    setShowPickupNotice(false);
    pendingBidAction.current?.();
    pendingBidAction.current = null;
  };

  const longPressTimer = { current: null as ReturnType<typeof setTimeout> | null };
  const timeLeft = useCountdown(AUCTION_END);

  const endLabel = AUCTION_END.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "America/Toronto",
  });

  const visibleItems = isAdmin
    ? items
    : items.filter((i) => i.status !== "claimed");

  const fetchItems = useCallback(async () => {
    const endpoint = isAdmin ? "/api/admin/items" : "/api/items";
    try {
      const res = await fetch(endpoint, { credentials: "include" });
      if (!res.ok) return;
      const data = await res.json();
      const list: SaleItemPublic[] = data.items ?? [];
      setItems(list);
      if (data.stats?.total) setCatalogTotal(data.stats.total);
      else if (isAdmin) setCatalogTotal(list.length);
    } catch {
      /* ignore poll errors */
    }
  }, [isAdmin]);

  useEffect(() => {
    fetch("/api/admin/session", { credentials: "include" })
      .then((r) => r.json())
      .then((d) => { if (d.isAdmin) setIsAdmin(true); })
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetchItems();
    const id = setInterval(fetchItems, POLL_MS);
    const onFocus = () => fetchItems();
    window.addEventListener("focus", onFocus);
    return () => {
      clearInterval(id);
      window.removeEventListener("focus", onFocus);
    };
  }, [fetchItems]);

  useEffect(() => {
    if (isAdmin) fetchItems();
  }, [isAdmin, fetchItems]);


  const handleTitlePressStart = () => {
    longPressTimer.current = setTimeout(() => {
      if (isAdmin) {
        fetch("/api/admin/logout", { method: "POST", credentials: "include" });
        setIsAdmin(false);
      } else {
        setShowPasswordModal(true);
      }
    }, 600);
  };

  const handleTitlePressEnd = () => {
    if (longPressTimer.current) clearTimeout(longPressTimer.current);
  };

  const handleBid = async (id: number, amount: number, name: string, email: string) => {
    const bidderId = localStorage.getItem("bidder_id") ?? crypto.randomUUID();
    const res = await fetch("/api/bids", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ itemId: id, amount, name, email, bidderId }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Bid failed");
    await fetchItems();
    return data as { ok: boolean; newBid: number };
  };

  const handleMarkSold = async (id: number) => {
    await fetch("/api/admin/items", {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ itemId: id, action: "sold" }),
    });
    await fetchItems();
  };

  const handlePriceEdit = async (id: number, newPrice: number) => {
    await fetch("/api/admin/items", {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ itemId: id, action: "price", price: newPrice }),
    });
    await fetchItems();
  };

  const handleAddItem = async (newItem: {
    name: string;
    price: number;
    category: string;
    description: string;
    imagePaths: string[];
  }) => {
    await fetch("/api/admin/items", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newItem),
    });
    await fetchItems();
  };

  const lockAdmin = async () => {
    await fetch("/api/admin/logout", { method: "POST", credentials: "include" });
    setIsAdmin(false);
  };

  return (
    <div style={{ minHeight: "100vh", background: "#FCFBF8" }}>
      {/* Globe icon — toggle picnic view */}
      {!isGarageSaleView && !isAdmin && (
        <button
          type="button"
          onClick={() => setIsGarageSaleView(true)}
          title="Picnic view"
          style={{
            position: "fixed",
            top: 14,
            right: 18,
            zIndex: 55,
            background: "none",
            border: "none",
            padding: 0,
            cursor: "pointer",
            lineHeight: 0,
            color: "#ccc",
          }}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            width={20}
            height={20}
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="2" y1="12" x2="22" y2="12" />
            <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
          </svg>
        </button>
      )}

      {isAdmin && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            zIndex: 60,
            background: "#000",
            color: "#fff",
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: "0.08em",
            textAlign: "center",
            padding: "5px 0",
            textTransform: "uppercase",
          }}
        >
          Admin mode · hold title to exit
        </div>
      )}

      {!isGarageSaleView && (
      <div
        style={{
          position: "sticky",
          top: 0,
          zIndex: 50,
          marginTop: isAdmin ? 28 : 0,
          padding: "14px 20px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          borderBottom: "none",
          background: "transparent",
        }}
      >
        <div
          onMouseDown={handleTitlePressStart}
          onMouseUp={handleTitlePressEnd}
          onMouseLeave={handleTitlePressEnd}
          onTouchStart={handleTitlePressStart}
          onTouchEnd={handleTitlePressEnd}
          style={{ cursor: "default", userSelect: "none" }}
        >
          <Image
            src="/assets/lydia's-garage-sale.png"
            alt="Lydia's Garage Sale"
            width={180}
            height={112}
            style={{ display: "block", objectFit: "contain" }}
            priority
          />
        </div>

        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 2 }}>
          {isAdmin ? (
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <button
                type="button"
                onClick={() => setShowAddSheet(true)}
                style={{
                  padding: "8px 14px",
                  background: "#000",
                  color: "#fff",
                  border: "none",
                  borderRadius: 20,
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                + Add
              </button>
              <button
                type="button"
                onClick={lockAdmin}
                style={{
                  padding: "8px 12px",
                  background: "#fff",
                  color: "#000",
                  border: "1.5px solid #000",
                  borderRadius: 20,
                  fontSize: 11,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Lock
              </button>
            </div>
          ) : (
            <>
              <div style={{ fontSize: 11, color: "#bbb", textAlign: "right" }}>
                Ends {endLabel} at midnight
              </div>
              <div
                style={{
                  fontSize: 11,
                  color: timeLeft && timeLeft.days < 1 ? "#999" : "#ccc",
                  textAlign: "right",
                  fontVariantNumeric: "tabular-nums",
                  transition: "color 1s ease",
                }}
              >
                {formatCountdown(timeLeft)}
              </div>
            </>
          )}
        </div>
      </div>
      )}

      {!isGarageSaleView && (
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
          gap: 16,
          padding: "20px 16px 40px",
          maxWidth: 960,
          margin: "0 auto",
        }}
      >
        {visibleItems.map((item) => (
          <ItemCard
            key={item.id}
            item={item}
            isAdmin={isAdmin}
            onMarkSold={handleMarkSold}
            onPriceEdit={handlePriceEdit}
            onBid={handleBid}
            onClick={(clicked) => withPickupNotice(() => setSelectedItem(clicked))}
            onBeforeBidOpen={withPickupNotice}
          />
        ))}
      </div>
      )}

      {/* Footer */}
      {!isAdmin && !isGarageSaleView && (
        <div
          style={{
            padding: "24px 20px 40px",
            textAlign: "center",
            borderTop: "1px solid #efefef",
            marginTop: 8,
          }}
        >
          <div style={{ fontSize: 12, color: "#999", lineHeight: 1.7 }}>
            📦 Items must be claimed in person at
          </div>
          <div style={{ fontSize: 12, color: "#999", lineHeight: 1.7 }}>
            <a
              href="https://partiful.com/e/BoaYBHLu23813PUTvyWf"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                color: "#000",
                fontWeight: 600,
                textDecoration: "underline",
                textUnderlineOffset: 2,
              }}
            >
              Lydia&rsquo;s Farewell Party
            </a>
            {" · Sun Jun 14, 1:30–5pm"}
          </div>
        </div>
      )}

      {isGarageSaleView && !isAdmin && (
        <div style={{ position: "fixed", inset: 0, zIndex: 40, overflow: "auto" }}>
          <GarageSaleView
            items={visibleItems}
            onItemClick={(item) => withPickupNotice(() => setSelectedItem(item))}
            onClose={() => setIsGarageSaleView(false)}
          />
        </div>
      )}

      {selectedItem && !isAdmin && (
        <DetailSheet
          item={selectedItem}
          onClose={() => setSelectedItem(null)}
          onBid={handleBid}
        />
      )}

      {showPasswordModal && (
        <PasswordModal
          onSuccess={() => {
            setShowPasswordModal(false);
            setIsAdmin(true);
          }}
          onDismiss={() => setShowPasswordModal(false)}
        />
      )}

      {showAddSheet && (
        <AddItemSheet
          onClose={() => setShowAddSheet(false)}
          onAdd={handleAddItem}
        />
      )}

      {/* One-time pickup disclaimer modal */}
      {showPickupNotice && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 300,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "0 24px",
          }}
          role="dialog"
          aria-modal="true"
          aria-label="Pickup notice"
        >
          <div
            onClick={handlePickupNoticeAcknowledge}
            style={{
              position: "absolute",
              inset: 0,
              background: "rgba(0,0,0,0.5)",
              backdropFilter: "blur(4px)",
            }}
          />
          <div
            className="animate-slide-up"
            style={{
              position: "relative",
              background: "#fff",
              borderRadius: 20,
              padding: "28px 28px 24px",
              maxWidth: 360,
              width: "100%",
              boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
            }}
          >
            <div style={{ fontSize: 28, marginBottom: 12, textAlign: "center" }}>📦</div>
            <div
              style={{
                fontSize: 17,
                fontWeight: 700,
                letterSpacing: "-0.03em",
                color: "#000",
                marginBottom: 10,
                textAlign: "center",
              }}
            >
              Pickup is at my farewell party
            </div>
            <p
              style={{
                fontSize: 13,
                color: "#555",
                lineHeight: 1.7,
                textAlign: "center",
                marginBottom: 18,
              }}
            >
              Items can only be claimed in person at{" "}
              <a
                href="https://partiful.com/e/BoaYBHLu23813PUTvyWf"
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                style={{
                  color: "#000",
                  fontWeight: 600,
                  textDecoration: "underline",
                  textUnderlineOffset: 2,
                }}
              >
                Lydia&rsquo;s Farewell Party
              </a>{" "}
              on <strong>Sunday Jun 14, 1:30–5pm</strong>. Make sure you can make it before bidding!
            </p>
            <button
              type="button"
              onClick={handlePickupNoticeAcknowledge}
              style={{
                width: "100%",
                padding: "13px 0",
                background: "#000",
                color: "#fff",
                border: "none",
                borderRadius: 12,
                fontSize: 14,
                fontWeight: 600,
                cursor: "pointer",
                letterSpacing: "-0.01em",
              }}
            >
              Got it, let me bid
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
