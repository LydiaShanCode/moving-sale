"use client";

import { useState } from "react";
import { ReceiptModal, ReceiptDivider, receiptInput, receiptLabel } from "./receipt-modal";

type PasswordModalProps = {
  onSuccess: () => void;
  onDismiss: () => void;
};

export function PasswordModal({ onSuccess, onDismiss }: PasswordModalProps) {
  const [pw, setPw] = useState("");
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);

  const attempt = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: pw }),
      });
      if (res.ok) {
        onSuccess();
      } else {
        setError(true);
        setPw("");
        setTimeout(() => setError(false), 1200);
      }
    } catch {
      setError(true);
      setPw("");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ReceiptModal onClose={onDismiss} label="Admin login" zIndex={200}>
      <div style={{ textAlign: "center", marginBottom: 16 }}>
        <div style={{ fontSize: 10, color: "#bbb", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 6 }}>
          Lydia&apos;s Moving Sale
        </div>
        <div style={{ fontSize: 15, fontWeight: 700, letterSpacing: "-0.02em" }}>
          Admin Access
        </div>
      </div>

      <ReceiptDivider />

      <div style={{ marginBottom: 16 }}>
        <div style={receiptLabel}>Password</div>
        <input
          autoFocus
          type="password"
          value={pw}
          onChange={(e) => setPw(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !loading && attempt()}
          placeholder="enter password"
          style={{
            ...receiptInput,
            borderBottomColor: error ? "#ff4444" : "#d0cdc8",
          }}
        />
        {error && (
          <div style={{ fontSize: 10, color: "#ff4444", marginTop: 4 }}>
            Incorrect password
          </div>
        )}
      </div>

      <ReceiptDivider />

      <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
        <button
          type="button"
          onClick={onDismiss}
          style={ghostBtn}
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={attempt}
          disabled={loading || !pw.trim()}
          style={solidBtn(!!pw.trim())}
        >
          {loading ? "…" : "Unlock"}
        </button>
      </div>
    </ReceiptModal>
  );
}

const ghostBtn: React.CSSProperties = {
  flex: 1,
  padding: "10px",
  background: "transparent",
  color: "#888",
  border: "1px dashed #ccc",
  borderRadius: 4,
  fontSize: 12,
  fontWeight: 500,
  cursor: "pointer",
  letterSpacing: "0.04em",
};

const solidBtn = (active: boolean): React.CSSProperties => ({
  flex: 1,
  padding: "10px",
  background: active ? "#000" : "#e8e6e1",
  color: active ? "#fff" : "#aaa",
  border: "none",
  borderRadius: 4,
  fontSize: 12,
  fontWeight: 600,
  cursor: active ? "pointer" : "default",
  letterSpacing: "0.04em",
});
