"use client";

import { useEffect } from "react";

type ReceiptModalProps = {
  onClose: () => void;
  children: React.ReactNode;
  label?: string;
  zIndex?: number;
};

export const receiptInput: React.CSSProperties = {
  width: "100%",
  border: "none",
  borderBottom: "1px solid #d0cdc8",
  background: "transparent",
  fontSize: 13,
  color: "#000",
  outline: "none",
  padding: "6px 0",
  fontFamily: "inherit",
};

export const receiptLabel: React.CSSProperties = {
  fontSize: 9,
  color: "#bbb",
  letterSpacing: "0.1em",
  textTransform: "uppercase" as const,
  marginBottom: 4,
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

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "flex-start",
        paddingTop: 48,
        paddingBottom: 48,
        overflowY: "auto",
      }}
      role="dialog"
      aria-modal="true"
      aria-label={label}
    >
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.55)",
          backdropFilter: "blur(8px)",
        }}
      />

      {/* Printer + Receipt */}
      <div
        style={{
          position: "relative",
          zIndex: 1,
          width: 340,
          maxWidth: "calc(100vw - 32px)",
        }}
      >
        {/* Printer body */}
        <div
          style={{
            width: "100%",
            height: 54,
            background: "linear-gradient(180deg, #ffffff 0%, #ededea 100%)",
            borderRadius: 14,
            boxShadow:
              "0 1px 0 rgba(255,255,255,0.9) inset, 0 -1px 0 rgba(0,0,0,0.06) inset, 0 6px 24px rgba(0,0,0,0.14)",
            display: "flex",
            alignItems: "center",
            paddingLeft: 18,
            position: "relative",
            zIndex: 2,
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
          {/* Paper slot */}
          <div
            style={{
              position: "absolute",
              bottom: 7,
              left: "50%",
              transform: "translateX(-50%)",
              width: "44%",
              height: 2,
              background: "rgba(0,0,0,0.1)",
              borderRadius: 1,
            }}
          />
        </div>

        {/* Animated receipt paper wrapper */}
        <div
          className="animate-print-receipt"
          style={{
            marginTop: -3,
            position: "relative",
            zIndex: 1,
          }}
        >
          {/* Receipt paper */}
          <div
            style={{
              background: "#fffef8",
              boxShadow: "0 12px 40px rgba(0,0,0,0.18)",
              padding: "20px 24px 0",
              /* Zigzag torn bottom */
              clipPath:
                "polygon(0 0,100% 0,100% calc(100% - 10px),97.5% 100%,95% calc(100% - 10px),92.5% 100%,90% calc(100% - 10px),87.5% 100%,85% calc(100% - 10px),82.5% 100%,80% calc(100% - 10px),77.5% 100%,75% calc(100% - 10px),72.5% 100%,70% calc(100% - 10px),67.5% 100%,65% calc(100% - 10px),62.5% 100%,60% calc(100% - 10px),57.5% 100%,55% calc(100% - 10px),52.5% 100%,50% calc(100% - 10px),47.5% 100%,45% calc(100% - 10px),42.5% 100%,40% calc(100% - 10px),37.5% 100%,35% calc(100% - 10px),32.5% 100%,30% calc(100% - 10px),27.5% 100%,25% calc(100% - 10px),22.5% 100%,20% calc(100% - 10px),17.5% 100%,15% calc(100% - 10px),12.5% 100%,10% calc(100% - 10px),7.5% 100%,5% calc(100% - 10px),2.5% 100%,0 calc(100% - 10px))",
            }}
          >
            {children}
            {/* Bottom padding for zigzag clearance */}
            <div style={{ height: 32 }} />
          </div>
        </div>
      </div>
    </div>
  );
}
