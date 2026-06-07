"use client";

import { useRef, useState } from "react";
import { ReceiptModal, ReceiptDivider, receiptInput, receiptLabel } from "./receipt-modal";

type ListingFields = {
  name: string;
  price: number | string;
  category: string;
  description: string;
};

type AddItemSheetProps = {
  onClose: () => void;
  onAdd: (item: {
    name: string;
    price: number;
    category: string;
    description: string;
    imagePaths: string[];
  }) => Promise<void>;
};

const CATS = [
  "Clothing",
  "Furniture",
  "Kitchen",
  "Tech",
  "Wellness",
  "Fitness",
  "Decor",
  "Beauty",
  "Utility",
];

export function AddItemSheet({ onClose, onAdd }: AddItemSheetProps) {
  const [images, setImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [fields, setFields] = useState<ListingFields | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const toBase64 = (file: File) =>
    new Promise<string>((res, rej) => {
      const r = new FileReader();
      r.onload = () => res(r.result as string);
      r.onerror = rej;
      r.readAsDataURL(file);
    });

  const handleFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    const b64s = await Promise.all(files.map(toBase64));
    setImages(b64s);
    setLoading(true);
    setError(null);
    setFields(null);

    try {
      const res = await fetch("/api/admin/generate-listing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ images: b64s }),
      });

      if (res.ok) {
        const parsed = await res.json();
        setFields({ name: parsed.name || "", price: parsed.price || 20, category: parsed.category || "Utility", description: parsed.description || "" });
      } else {
        setError("Couldn't auto-fill. Fill in manually.");
        setFields({ name: "", price: 20, category: "Utility", description: "" });
      }
    } catch {
      setError("Couldn't auto-fill. Fill in manually.");
      setFields({ name: "", price: 20, category: "Utility", description: "" });
    }
    setLoading(false);
  };

  const resolveImagePaths = async (): Promise<string[]> => {
    if (!images.length) return [];
    const formData = new FormData();
    for (const dataUrl of images) {
      const res = await fetch(dataUrl);
      const blob = await res.blob();
      const file = new File([blob], `photo-${Date.now()}.jpg`, { type: "image/jpeg" });
      formData.append("files", file);
    }
    try {
      const uploadRes = await fetch("/api/admin/upload", { method: "POST", body: formData });
      if (uploadRes.ok) { const { urls } = await uploadRes.json(); return urls; }
    } catch { /* fall through */ }
    return images;
  };

  const handleSubmit = async () => {
    if (!fields?.name.trim() || !images.length || submitting) return;
    setSubmitting(true);
    try {
      const imagePaths = await resolveImagePaths();
      await onAdd({ name: fields.name.trim(), price: Number(fields.price), category: fields.category, description: fields.description, imagePaths });
      onClose();
    } catch {
      setError("Failed to add item. Try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ReceiptModal onClose={onClose} label="Add item">
      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: 14 }}>
        <div style={{ fontSize: 10, color: "#bbb", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 6 }}>
          Lydia's Moving Sale
        </div>
        <div style={{ fontSize: 15, fontWeight: 700, letterSpacing: "-0.02em" }}>New Item</div>
      </div>

      <ReceiptDivider />

      {/* Hidden file input */}
      <input ref={fileRef} type="file" accept="image/*" multiple onChange={handleFiles} style={{ display: "none" }} />

      {/* Photos */}
      {images.length === 0 ? (
        <div
          onClick={() => fileRef.current?.click()}
          style={{ width: "100%", height: 120, border: "1px dashed #d0cdc8", borderRadius: 4, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", cursor: "pointer", gap: 6, marginBottom: 16, background: "transparent" }}
        >
          <div style={{ fontSize: 22, color: "#bbb" }}>+</div>
          <div style={{ fontSize: 11, color: "#bbb", letterSpacing: "0.04em" }}>tap to add photos</div>
        </div>
      ) : (
        <div style={{ display: "flex", gap: 6, marginBottom: 16, overflowX: "auto", paddingBottom: 2 }}>
          {images.map((src, i) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={i} src={src} alt="" style={{ width: 76, height: 76, objectFit: "cover", borderRadius: 4, flexShrink: 0, border: "1px solid #e8e6e1" }} />
          ))}
          <div
            onClick={() => fileRef.current?.click()}
            style={{ width: 76, height: 76, border: "1px dashed #d0cdc8", borderRadius: 4, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0, fontSize: 18, color: "#bbb" }}
          >
            +
          </div>
        </div>
      )}

      {loading && (
        <div style={{ textAlign: "center", padding: "16px 0", color: "#aaa", fontSize: 11, letterSpacing: "0.04em" }}>
          <div className="animate-spin-slow" style={{ fontSize: 16, marginBottom: 6, display: "inline-block" }}>◌</div>
          <div>reading photo…</div>
        </div>
      )}

      {error && <div style={{ fontSize: 10, color: "#aaa", marginBottom: 10 }}>{error}</div>}

      {fields && !loading && (
        <>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div>
              <div style={receiptLabel}>Name</div>
              <input value={fields.name} onChange={e => setFields(f => f ? { ...f, name: e.target.value } : f)} style={receiptInput} />
            </div>
            <div style={{ display: "flex", gap: 16 }}>
              <div style={{ flex: 1 }}>
                <div style={receiptLabel}>Price ($)</div>
                <input type="number" value={fields.price} onChange={e => setFields(f => f ? { ...f, price: e.target.value } : f)} style={receiptInput} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={receiptLabel}>Category</div>
                <select
                  value={fields.category}
                  onChange={e => setFields(f => f ? { ...f, category: e.target.value } : f)}
                  style={{
                    width: "100%",
                    border: "none",
                    borderBottom: "1px solid #d0cdc8",
                    background: "transparent",
                    fontSize: 13,
                    color: "#000",
                    outline: "none",
                    padding: "6px 0",
                    fontFamily: "inherit",
                  }}
                >
                  {CATS.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
            </div>
            <div>
              <div style={receiptLabel}>Description</div>
              <textarea
                value={fields.description}
                onChange={e => setFields(f => f ? { ...f, description: e.target.value } : f)}
                rows={3}
                style={{
                  width: "100%",
                  border: "none",
                  borderBottom: "1px solid #d0cdc8",
                  background: "transparent",
                  fontSize: 12,
                  color: "#000",
                  outline: "none",
                  padding: "6px 0",
                  resize: "none",
                  lineHeight: 1.5,
                  fontFamily: "inherit",
                }}
              />
            </div>
          </div>

          <ReceiptDivider />

          <button
            type="button"
            onClick={handleSubmit}
            disabled={!fields.name.trim() || submitting}
            style={{
              width: "100%",
              padding: "11px",
              background: fields.name.trim() ? "#000" : "#e8e6e1",
              color: fields.name.trim() ? "#fff" : "#aaa",
              border: "none",
              borderRadius: 4,
              fontSize: 12,
              fontWeight: 600,
              cursor: fields.name.trim() ? "pointer" : "default",
              letterSpacing: "0.04em",
            }}
          >
            {submitting ? "Adding…" : "Add to sale"}
          </button>
        </>
      )}
    </ReceiptModal>
  );
}
