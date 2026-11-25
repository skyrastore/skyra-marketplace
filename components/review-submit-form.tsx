"use client";

import { useState } from "react";
import { Star, Send, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { useAuth } from "./auth-provider";

export function ReviewSubmitForm({ orderCode, onSubmitted }: { orderCode: string; onSubmitted?: () => void }) {
  const { user } = useAuth();
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  if (done) {
    return (
      <div
        style={{
          background: "linear-gradient(135deg,rgba(16,185,129,.1),rgba(41,112,255,.08))",
          border: "1.5px solid #10b981",
          borderRadius: 14,
          padding: 20,
          textAlign: "center",
        }}
      >
        <CheckCircle2 size={40} color="#10b981" style={{ marginBottom: 8 }} />
        <div style={{ fontFamily: "'Fredoka'", fontSize: "1rem", fontWeight: 700, color: "#059669", marginBottom: 4 }}>
          Terima kasih atas review-nya!
        </div>
        <div style={{ fontSize: ".82rem", color: "#334155", fontWeight: 500 }}>
          Review kamu udah tampil di halaman game ⭐
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div style={{ padding: 16, background: "#f8fafc", borderRadius: 12, textAlign: "center", color: "#64748b", fontSize: ".85rem", fontWeight: 600, border: "1px dashed #cbd5e1" }}>
        Login untuk kasih review order ini
      </div>
    );
  }

  const submit = async () => {
    if (!rating) {
      toast.warning("Pilih rating dulu (1-5 bintang)");
      return;
    }
    setSubmitting(true);
    const { data: { session } } = await supabase.auth.getSession();
    const res = await fetch("/api/reviews/create", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session?.access_token ?? ""}`,
      },
      body: JSON.stringify({ orderCode, rating, comment }),
    });
    const data = await res.json();
    setSubmitting(false);
    if (!res.ok) {
      const msg: Record<string, string> = {
        already_reviewed: "Order ini udah di-review sebelumnya",
        not_your_order: "Kamu bukan pemilik order ini",
        order_not_done_yet: "Order harus selesai dulu",
      };
      toast.error(msg[data.error] || "Gagal submit review", { description: data.error });
      return;
    }
    setDone(true);
    onSubmitted?.();
  };

  return (
    <div
      style={{
        background: "#ffffff",
        borderRadius: 16,
        padding: 20,
        border: "1.5px solid #e2e8ff",
        boxShadow: "0 8px 24px rgba(15,23,42,.08)",
      }}
    >
      <h3 style={{ fontFamily: "'Fredoka'", fontSize: "1.05rem", fontWeight: 700, color: "#0f172a", marginBottom: 6 }}>
        Review Pesananmu
      </h3>
      <p style={{ fontSize: ".82rem", color: "#64748b", fontWeight: 500, marginBottom: 14 }}>
        Rating & komentar kamu bantu customer lain. Honest review welcome 🙏
      </p>

      {/* Star rating input */}
      <div style={{ display: "flex", gap: 4, justifyContent: "center", marginBottom: 14 }}>
        {[1, 2, 3, 4, 5].map((i) => {
          const active = (hover || rating) >= i;
          return (
            <button
              key={i}
              type="button"
              onMouseEnter={() => setHover(i)}
              onMouseLeave={() => setHover(0)}
              onClick={() => setRating(i)}
              style={{
                background: "transparent",
                border: 0,
                padding: 4,
                cursor: "pointer",
                transition: "transform .15s",
                transform: active ? "scale(1.1)" : "scale(1)",
              }}
            >
              <Star
                size={34}
                fill={active ? "#f59e0b" : "transparent"}
                color={active ? "#f59e0b" : "#cbd5e1"}
                strokeWidth={2}
              />
            </button>
          );
        })}
      </div>

      <div style={{ textAlign: "center", fontSize: ".78rem", color: "#475569", fontWeight: 700, marginBottom: 14 }}>
        {rating === 0 && "Pilih rating"}
        {rating === 1 && "Sangat Buruk 😞"}
        {rating === 2 && "Kurang Memuaskan 😐"}
        {rating === 3 && "Cukup 🙂"}
        {rating === 4 && "Bagus 😊"}
        {rating === 5 && "Luar Biasa! 🤩"}
      </div>

      <textarea
        placeholder="Share pengalaman kamu... (opsional)"
        value={comment}
        onChange={(e) => setComment(e.target.value.slice(0, 500))}
        rows={3}
        style={{
          width: "100%",
          padding: 12,
          borderRadius: 10,
          background: "#f8fafc",
          border: "1px solid #e2e8ff",
          color: "#0f172a",
          fontFamily: "inherit",
          fontSize: ".86rem",
          fontWeight: 500,
          outline: "none",
          resize: "vertical",
          marginBottom: 6,
        }}
      />
      <div style={{ fontSize: ".68rem", color: "#94a3b8", textAlign: "right", marginBottom: 12, fontWeight: 600 }}>
        {comment.length}/500
      </div>

      <button
        onClick={submit}
        disabled={submitting || !rating}
        style={{
          width: "100%",
          padding: 12,
          borderRadius: 10,
          border: 0,
          background: !rating || submitting ? "#cbd5e1" : "linear-gradient(135deg,#059669,#1a52b8)",
          color: "#fff",
          fontFamily: "inherit",
          fontSize: ".9rem",
          fontWeight: 800,
          cursor: !rating || submitting ? "not-allowed" : "pointer",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          boxShadow: !rating || submitting ? "none" : "0 6px 18px rgba(16,185,129,.35)",
        }}
      >
        <Send size={14} /> {submitting ? "Mengirim..." : "Kirim Review"}
      </button>
    </div>
  );
}
