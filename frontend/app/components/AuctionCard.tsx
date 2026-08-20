"use client";

import { ArrowUpRight } from "lucide-react";
import { useEffect, useState } from "react";
import { countdown, formatMoney } from "../../lib/format";
import type { Auction } from "../../lib/types";
import { AuctionVisual } from "./AuctionVisual";

export function AuctionCard({ auction, index = 0 }: { auction: Auction; index?: number }) {
  const [remaining, setRemaining] = useState(() => countdown(auction.endTime));
  useEffect(() => {
    const id = window.setInterval(() => setRemaining(countdown(auction.endTime)), 1000);
    return () => window.clearInterval(id);
  }, [auction.endTime]);

  return (
    <article className="auction-card data-card" style={{ "--delay": `${index * 70}ms` } as React.CSSProperties}>
      <AuctionVisual id={auction.id} status={auction.status} time={remaining} />
      <div className="card-body">
        <span className="card-category">{auction.sellerName} · #{auction.id}</span>
        <h3>{auction.productName}</h3>
        <div className="card-bottom">
          <div><span>Giá hiện tại</span><strong>{formatMoney(auction.currentPrice)}</strong></div>
          <a className="round-link" href={`/auctions/${auction.id}`} aria-label={`Xem ${auction.productName}`}><ArrowUpRight size={18} /></a>
        </div>
      </div>
    </article>
  );
}
