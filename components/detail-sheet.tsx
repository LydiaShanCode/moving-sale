"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import type { SaleItemPublic } from "@/lib/types";
import { AUCTION_END } from "@/lib/site";
import { ReceiptModal, ReceiptDivider, receiptInput, receiptLabel } from "./receipt-modal";
import { ReceiptCheckIcon } from "./receipt-icons";
import { playCoin } from "@/lib/sounds";

type DetailSheetProps = {
  item: SaleItemPublic;
  onClose: () => void;
  onBid: (id: number, amount: number, name: string, email: string) => Promise<{ ok: boolean; newBid: number }>;
};

function useBidder() {
  const [bidder, setBidder] = useState({ id: "", name: "", email: "" });
  useEffect(() => {
    let id = localStorage.getItem("bidder_id") ?? "";
    if (!id) { id = crypto.randomUUID(); localStorage.setItem("bidder_id", id); }
    setBidder({ id, name: localStorage.getItem("bidder_name") ?? "", email: localStorage.getItem("bidder_email") ?? "" });
  }, []);
  const save = (name: string, email: string) => {
    localStorage.setItem("bidder_name", name);
    localStorage.setItem("bidder_email", email);
    setBidder((b) => ({ ...b, name, email }));
  };
  return { bidder, save };
}

export function DetailSheet({ item, onClose, onBid }: DetailSheetProps) {
  const { bidder } = useBidder();
  const [amount, setAmount] = useState("");
  const [photoIdx, setPhotoIdx] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<{ newBid: number } | null>(null);

  const auctionOpen = Date.now() < AUCTION_END.getTime();
  const minBid = item.currentBid !== null ? item.currentBid + 1 : item.startingBid;
  const displayBid = item.currentBid ?? item.startingBid;

  const handleBid = async () => {
    if (!amount || submitting) return;
    const amountNum = parseInt(amount, 10);
    if (isNaN(amountNum) || amountNum < minBid) { setError(`Minimum bid is $${minBid}`); return; }
    setSubmitting(true);
    setError(null);
    try {
      const result = await onBid(item.id, amountNum, bidder.name, bidder.email);
      playCoin();
      setSuccess(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not place bid");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ReceiptModal onClose={onClose} label={`${item.name} details`}>
      {/* Photo */}
      <div style={{ position: "relative", width: "100%", height: 200, marginBottom: 16, borderRadius: 4, overflow: "hidden" }}>
        <Image src={item.images[photoIdx]} alt={item.name} fill sizes="340px" style={{ objectFit: "cover" }} priority />
        {item.images.length > 1 && (
          <div style={{ position: "absolute", bottom: 8, left: "50%", transform: "translateX(-50%)", display: "flex", gap: 4 }}>
            {item.images.map((_, i) => (
              <div key={i} onClick={() => setPhotoIdx(i)} style={{ width: i === photoIdx ? 14 : 5, height: 5, borderRadius: 3, background: i === photoIdx ? "#fff" : "rgba(255,255,255,0.5)", cursor: "pointer", transition: "width 0.2s" }} />
            ))}
          </div>
        )}
        {photoIdx > 0 && (
          <button type="button" onClick={() => setPhotoIdx(p => p - 1)} style={navBtn("left")} aria-label="Previous">‹</button>
        )}
        {photoIdx < item.images.length - 1 && (
          <button type="button" onClick={() => setPhotoIdx(p => p + 1)} style={navBtn("right")} aria-label="Next">›</button>
        )}
      </div>

      {/* Item header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
        <div>
          <div style={{ fontSize: 15, fontWeight: 700, letterSpacing: "-0.02em", lineHeight: 1.2 }}>{item.name}</div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 20, fontWeight: 700, letterSpacing: "-0.03em" }}>${displayBid}</div>
          <div style={{ fontSize: 9, color: "#bbb", marginTop: 1 }}>
            {item.currentBid !== null ? `${item.bidCount} bid${item.bidCount === 1 ? "" : "s"}` : "no bids yet"}
          </div>
        </div>
      </div>

      <ReceiptDivider />

      {!auctionOpen ? (
        <div style={{ textAlign: "center", fontSize: 11, color: "#aaa", padding: "12px 0" }}>Auction has ended</div>
      ) : success ? (
        <div style={{ textAlign: "center", padding: "12px 0" }}>
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 6 }}>
            <ReceiptCheckIcon size={22} />
          </div>
          <div style={{ fontSize: 13, fontWeight: 600 }}>Bid placed — ${success.newBid}</div>
          <div style={{ fontSize: 10, color: "#aaa", marginTop: 4 }}>{"I'll email you if you win. Pickup Jun 14."}</div>
        </div>
      ) : (
        <>
          {error && <div style={{ fontSize: 10, color: "#ff4444", marginBottom: 8 }}>{error}</div>}
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div>
              <div style={receiptLabel}>Your bid ($)</div>
              <input value={amount} onChange={e => setAmount(e.target.value.replace(/\D/g, ""))} placeholder={String(minBid)} type="number" min={minBid} style={receiptInput} />
            </div>
            <ReceiptDivider />
            <button
              type="button"
              onClick={handleBid}
              disabled={!amount || submitting}
              style={{
                width: "100%",
                padding: "11px",
                background: amount ? "#000" : "#e8e6e1",
                color: amount ? "#fff" : "#aaa",
                border: "none",
                borderRadius: 4,
                fontSize: 12,
                fontWeight: 600,
                cursor: amount ? "pointer" : "default",
                letterSpacing: "0.04em",
              }}
            >
              {submitting ? "…" : "Place bid"}
            </button>
          </div>
        </>
      )}
    </ReceiptModal>
  );
}

const navBtn = (side: "left" | "right"): React.CSSProperties => ({
  position: "absolute",
  [side]: 8,
  top: "50%",
  transform: "translateY(-50%)",
  background: "rgba(255,255,255,0.88)",
  border: "none",
  borderRadius: "50%",
  width: 28,
  height: 28,
  cursor: "pointer",
  fontSize: 16,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
});
