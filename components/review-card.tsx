"use client";

import { Star, BadgeCheck } from "lucide-react";

export type ReviewData = {
  rating: number;
  comment: string | null;
  display_name: string | null;
  created_at: string;
  is_featured?: boolean;
};

export function StarRow({ value, size = 14 }: { value: number; size?: number }) {
  return (
    <span style={{ display: "inline-flex", gap: 1 }}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          size={size}
          fill={i <= Math.round(value) ? "#f59e0b" : "transparent"}
          color={i <= Math.round(value) ? "#f59e0b" : "#cbd5e1"}
          strokeWidth={2}
        />
      ))}
    </span>
  );
}

export function ReviewCard({ review }: { review: ReviewData }) {
  const dt = new Date(review.created_at).toLocaleDateString("id-ID", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
  const initial = (review.display_name || "C").charAt(0).toUpperCase();
  const gradients = [
    "linear-gradient(135deg,#f472b6,#a855f7)",
    "linear-gradient(135deg,#60a5fa,#2970ff)",
    "linear-gradient(135deg,#34d399,#059669)",
    "linear-gradient(135deg,#fbbf24,#ef4444)",
    "linear-gradient(135deg,#a78bfa,#7c3aed)",
  ];
  const hash = (review.display_name || "x").charCodeAt(0) % gradients.length;

  return (
    <div
      style={{
        background: "#fff",
        borderRadius: 14,
        padding: 16,
        border: "1px solid #e2e8ff",
        boxShadow: "0 4px 14px rgba(15,23,42,.06)",
        position: "relative",
      }}
    >
      {review.is_featured && (
        <span
          style={{
            position: "absolute",
            top: 10,
            right: 10,
            background: "linear-gradient(135deg,#f59e0b,#ef4444)",
            color: "#fff",
            fontSize: ".6rem",
            fontWeight: 900,
            padding: "3px 8px",
            borderRadius: 5,
            letterSpacing: ".06em",
            display: "inline-flex",
            alignItems: "center",
            gap: 3,
          }}
        >
          <BadgeCheck size={10} /> FEATURED
        </span>
      )}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: "50%",
            background: gradients[hash],
            color: "#fff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontWeight: 800,
            fontSize: ".95rem",
          }}
        >
          {initial}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 800, color: "#0f172a", fontSize: ".88rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {review.display_name || "Customer"}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 2 }}>
            <StarRow value={review.rating} size={12} />
            <span style={{ fontSize: ".7rem", color: "#94a3b8", fontWeight: 600 }}>{dt}</span>
          </div>
        </div>
      </div>
      {review.comment && (
        <div style={{ fontSize: ".86rem", color: "#334155", lineHeight: 1.55, fontWeight: 500 }}>
          {review.comment}
        </div>
      )}
    </div>
  );
}
