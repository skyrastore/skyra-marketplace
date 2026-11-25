"use client";

import { useState, useMemo } from "react";
import { ChevronDown } from "lucide-react";

const PAGE_SIZE = 24;

export function PaginatedGrid<T>({
  items,
  renderItem,
  className = "games-grid",
  pageSize = PAGE_SIZE,
  keyFn,
}: {
  items: T[];
  renderItem: (item: T) => React.ReactNode;
  className?: string;
  pageSize?: number;
  keyFn?: (item: T) => string | number;
}) {
  const [visibleCount, setVisibleCount] = useState(pageSize);
  const visible = useMemo(() => items.slice(0, visibleCount), [items, visibleCount]);
  const hasMore = visibleCount < items.length;
  const remaining = items.length - visibleCount;

  return (
    <>
      <div className={className}>
        {visible.map((item, i) => {
          const k = keyFn ? keyFn(item) : i;
          return <div key={k}>{renderItem(item)}</div>;
        })}
      </div>
      {hasMore && (
        <div style={{ display: "flex", justifyContent: "center", marginTop: 20 }}>
          <button
            onClick={() => setVisibleCount((c) => c + pageSize)}
            style={{
              padding: "12px 24px",
              borderRadius: 12,
              border: "1.5px solid rgba(255,255,255,.3)",
              background: "rgba(255,255,255,.1)",
              color: "#fff",
              fontFamily: "'Fredoka', system-ui, sans-serif",
              fontSize: ".92rem",
              fontWeight: 600,
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              backdropFilter: "blur(10px)",
              transition: "all .2s",
              letterSpacing: ".3px",
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.background = "rgba(255,255,255,.2)";
              e.currentTarget.style.transform = "translateY(-1px)";
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.background = "rgba(255,255,255,.1)";
              e.currentTarget.style.transform = "translateY(0)";
            }}
          >
            Lihat {Math.min(pageSize, remaining)} game lagi
            <ChevronDown size={16} strokeWidth={2.5} />
          </button>
        </div>
      )}
    </>
  );
}
