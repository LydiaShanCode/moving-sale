"use client";

import { useEffect } from "react";
import { playReceiptPrint } from "@/lib/sounds";

type ReceiptModalProps = {
  onClose: () => void;
  children: React.ReactNode;
  label?: string;
  zIndex?: number;
};

const PRINTER_HEIGHT = 48;
const MOUTH_HEIGHT = 2;
const PAPER_WIDTH = "86%";
// Paper tucks 1px under the mouth line so it reads as emerging from the slot
const PAPER_SLOT_OVERLAP = 1;

// [x%, tear depth in px] — 0 = full tear to bottom edge; varied spacing + depth for organic rip
const RECEIPT_TEAR_BUMPS: Array<[number, number]> = [
  [100, 3], [98.5, 0], [97.2, 5], [95.8, 0], [94, 2], [92.6, 0], [91, 4], [89.3, 0],
  [87.5, 2], [86.2, 0], [84.5, 5], [82.8, 0], [81, 3], [79.5, 0], [77.8, 2], [76.2, 0],
  [74.5, 4], [72.8, 0], [71, 2], [69.5, 0], [67.8, 5], [66, 0], [64.3, 3], [62.5, 0],
  [60.8, 2], [59.2, 0], [57.5, 4], [55.8, 0], [54, 2], [52.5, 0], [50.8, 5], [49, 0],
  [47.2, 3], [45.5, 0], [43.8, 2], [42.2, 0], [40.5, 4], [38.8, 0], [37, 2], [35.5, 0],
  [33.8, 5], [32, 0], [30.2, 3], [28.5, 0], [26.8, 2], [25.2, 0], [23.5, 4], [21.8, 0],
  [20, 2], [18.5, 0], [16.8, 5], [15, 0], [13.2, 3], [11.5, 0], [9.8, 2], [8.2, 0],
  [6.5, 4], [4.8, 0], [3.2, 2], [1.8, 0], [0, 3],
];

function receiptTearClipPath() {
  const edge = RECEIPT_TEAR_BUMPS.map(([x, depth]) =>
    depth === 0 ? `${x}% 100%` : `${x}% calc(100% - ${depth}px)`
  ).join(",");
  return `polygon(0 0,100% 0,${edge})`;
}

const RECEIPT_TEAR_CLIP = receiptTearClipPath();

export const RECEIPT_FONT =
  "'Geist Mono', ui-monospace, SFMono-Regular, Menlo, monospace";

export const receiptInput: React.CSSProperties = {
  width: "100%",
  border: "none",
  borderBottom: "1px solid #d0cdc8",
  background: "transparent",
  fontSize: 13,
  color: "#000",
  outline: "none",
  padding: "6px 0",
  fontFamily: RECEIPT_FONT,
};

export const receiptLabel: React.CSSProperties = {
  fontSize: 9,
  color: "#bbb",
  letterSpacing: "0.1em",
  textTransform: "uppercase" as const,
  marginBottom: 4,
  fontFamily: RECEIPT_FONT,
};

export function ReceiptDivider() {
  return (
    <div
      style={{
        borderTop: "1px dashed #d8d5cf",
        margin: "14px 0",
      }}
    />
  );
}

export function ReceiptModal({
  onClose,
  children,
  label,
  zIndex = 100,
}: ReceiptModalProps) {
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, []);

  useEffect(() => {
    playReceiptPrint();
  }, []);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "48px 16px",
        overflowY: "auto",
      }}
      role="dialog"
      aria-modal="true"
      aria-label={label}
    >
      {/* Backdrop — blur only, click to dismiss */}
      <div
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          backdropFilter: "blur(8px)",
          WebkitBackdropFilter: "blur(8px)",
        }}
      />

      {/* Printer + Receipt */}
      <div
        style={{
          position: "relative",
          zIndex: 1,
          width: 340,
          maxWidth: "calc(100vw - 32px)",
          paddingTop: PRINTER_HEIGHT,
        }}
      >
        {/* Receipt feed — in document flow so flex centering includes full receipt height */}
        <div
          style={{
            width: PAPER_WIDTH,
            marginLeft: "auto",
            marginRight: "auto",
            marginTop: -PAPER_SLOT_OVERLAP,
            overflow: "hidden",
            position: "relative",
            zIndex: 1,
          }}
        >
          <div className="animate-print-receipt">
            <div
              className="receipt-print-body"
              style={{
                background: "#fff",
                boxShadow: "0 12px 40px rgba(0,0,0,0.18)",
                padding: "20px 18px 0",
                clipPath: RECEIPT_TEAR_CLIP,
              }}
            >
              {children}
              <div style={{ height: 32 }} />
            </div>
          </div>
        </div>

        {/* Printer hood — ends at the mouth; no chin below the slot */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            width: "100%",
            height: PRINTER_HEIGHT,
            background: "linear-gradient(180deg, #ffffff 0%, #ededea 100%)",
            borderRadius: 14,
            boxShadow:
              "0 1px 0 rgba(255,255,255,0.9) inset, 0 -1px 0 rgba(0,0,0,0.06) inset, 0 6px 24px rgba(0,0,0,0.14)",
            display: "flex",
            alignItems: "center",
            paddingLeft: 18,
            zIndex: 2,
            pointerEvents: "none",
          }}
        >
          {/* Power LED */}
          <div
            style={{
              width: 9,
              height: 9,
              borderRadius: "50%",
              background: "radial-gradient(circle at 35% 30%, #7ec8f7, #2979d4)",
              boxShadow: "0 0 7px rgba(66,148,245,0.75)",
            }}
          />
        </div>

        {/* Paper slot mouth — sits on top of the emerging receipt */}
        <div
          style={{
            position: "absolute",
            top: PRINTER_HEIGHT - MOUTH_HEIGHT,
            left: "50%",
            transform: "translateX(-50%)",
            width: PAPER_WIDTH,
            height: MOUTH_HEIGHT,
            background: "rgba(0,0,0,0.35)",
            borderRadius: 1,
            zIndex: 3,
            pointerEvents: "none",
          }}
        />

      </div>
    </div>
  );
}
