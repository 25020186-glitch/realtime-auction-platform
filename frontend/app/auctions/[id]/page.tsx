import type { Metadata } from "next";
import { API_BASE } from "../../../lib/api";
import type { Auction } from "../../../lib/types";
import { AuctionDetailClient } from "./AuctionDetailClient";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  try {
    const response = await fetch(`${API_BASE}/api/v1/auctions/${id}`, { cache: "no-store" });
    if (!response.ok) throw new Error("not found");
    const auction = await response.json() as Auction;
    const title = `${auction.productName} — Đấu giá trên Bidora`;
    const description = `Giá hiện tại ${Number(auction.currentPrice).toLocaleString("vi-VN")} ₫. Theo dõi và đặt giá theo thời gian thực trên Bidora.`;
    return { title, description, openGraph: { title, description, images: [] }, twitter: { title, description, images: [] } };
  } catch {
    const title = `Phiên đấu giá #${id} — Bidora`;
    const description = "Theo dõi phiên đấu giá theo thời gian thực trên Bidora.";
    return { title, description, openGraph: { title, description, images: [] }, twitter: { title, description, images: [] } };
  }
}

export default async function AuctionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <AuctionDetailClient auctionId={Number(id)} />;
}
