import { Heart, TimerReset } from "lucide-react";
import type { AuctionStatus } from "../../lib/types";
import { statusLabel } from "../../lib/format";

const visuals = [
  { emoji: "⌚", tone: "violet" },
  { emoji: "📷", tone: "cyan" },
  { emoji: "👟", tone: "coral" },
  { emoji: "🪑", tone: "amber" },
  { emoji: "📚", tone: "blue" },
  { emoji: "🎸", tone: "rose" },
];

export function visualFor(id: number, categoryName = "") {
  const category = categoryName.toLowerCase();
  if (category.includes("book")) return { emoji: "📚", tone: "blue" };
  if (category.includes("fashion")) return { emoji: "👟", tone: "coral" };
  if (category.includes("electronic")) return { emoji: "📷", tone: "cyan" };
  if (category.includes("home")) return { emoji: "🪑", tone: "amber" };
  return visuals[Math.abs(id) % visuals.length];
}

export function AuctionVisual({ id, status, time, categoryName, compact = false }: { id: number; status: AuctionStatus; time?: string; categoryName?: string; compact?: boolean }) {
  const visual = visualFor(id, categoryName);
  return (
    <div className={`product-visual visual-${visual.tone} ${compact ? "compact" : ""}`}>
      <span className={`status-chip status-${status.toLowerCase()}`}><i />{statusLabel[status]}</span>
      <button className="visual-heart" aria-label="Yêu thích"><Heart size={17} /></button>
      <span className="visual-ring" />
      <span className="visual-emoji">{visual.emoji}</span>
      {time && <span className="visual-timer"><TimerReset size={14} />{time}</span>}
    </div>
  );
}
