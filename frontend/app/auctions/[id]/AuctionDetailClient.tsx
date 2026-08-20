"use client";

import { Client } from "@stomp/stompjs";
import { ArrowLeft, BellRing, CheckCircle2, Gavel, Heart, Radio, ShieldCheck, Sparkles, TimerReset, TrendingUp, Trophy, UserRound, Wifi, WifiOff, Zap } from "lucide-react";
import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { api, ApiError, WS_BASE } from "../../../lib/api";
import { countdown, formatDate, formatMoney, statusLabel } from "../../../lib/format";
import type { Auction, Bid, BidUpdate, PageResponse, Product } from "../../../lib/types";
import { AuctionVisual } from "../../components/AuctionVisual";
import { useAuth } from "../../providers";

export function AuctionDetailClient({ auctionId }: { auctionId: number }) {
  const { session, notify } = useAuth();
  const [auction, setAuction] = useState<Auction | null>(null);
  const [product, setProduct] = useState<Product | null>(null);
  const [bids, setBids] = useState<Bid[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [connected, setConnected] = useState(false);
  const [watched, setWatched] = useState(false);
  const [placing, setPlacing] = useState(false);
  const [amount, setAmount] = useState("");
  const [remaining, setRemaining] = useState("--:--:--");
  const stompRef = useRef<Client | null>(null);

  const load = useCallback(async () => {
    try {
      const auctionData = await api<Auction>(`/api/v1/auctions/${auctionId}`);
      const [productData, bidPage] = await Promise.all([
        api<Product>(`/api/v1/products/${auctionData.productId}`),
        api<PageResponse<Bid>>(`/api/v1/auctions/${auctionId}/bids?size=50`),
      ]);
      setAuction(auctionData); setProduct(productData); setBids(bidPage.content); setAmount(String(Number(auctionData.currentPrice) + Number(auctionData.minimumIncrement)));
      if (session) {
        api<PageResponse<Auction>>("/api/v1/watchlist?size=100", { token: session.accessToken }).then((page) => setWatched(page.content.some((item) => item.id === auctionId))).catch(() => undefined);
      }
    } catch (cause) { setError(cause instanceof ApiError ? cause.message : "Không thể tải phiên đấu giá."); }
    finally { setLoading(false); }
  }, [auctionId, session]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!auction) return;
    setRemaining(countdown(auction.endTime));
    const id = window.setInterval(() => setRemaining(countdown(auction.endTime)), 1000);
    return () => window.clearInterval(id);
  }, [auction]);

  useEffect(() => {
    const client = new Client({
      brokerURL: `${WS_BASE}/ws`, reconnectDelay: 3000,
      connectHeaders: session ? { Authorization: `Bearer ${session.accessToken}` } : {},
      onConnect: () => {
        setConnected(true);
        client.subscribe(`/topic/auctions/${auctionId}`, (message) => {
          const update = JSON.parse(message.body) as BidUpdate;
          if (update.type === "BID_PLACED" && update.currentPrice !== undefined) {
            setAuction((current) => current ? { ...current, currentPrice: Number(update.currentPrice), winningBidId: update.bidId || current.winningBidId, winnerId: update.bidderId || current.winnerId } : current);
            setBids((items) => update.bidId && !items.some((bid) => bid.id === update.bidId) ? [{ id: update.bidId, auctionId, bidderId: update.bidderId || 0, bidderName: update.bidderName || "Bidder", amount: Number(update.currentPrice), clientRequestId: "realtime", placedAt: update.placedAt || new Date().toISOString() }, ...items] : items);
            setAmount(String(Number(update.currentPrice) + Number(auction.minimumIncrement)));
          }
          if (update.type === "AUCTION_STATUS_CHANGED" && update.status) setAuction((current) => current ? { ...current, status: update.status! } : current);
        });
      },
      onWebSocketClose: () => setConnected(false), onStompError: () => setConnected(false),
    });
    client.activate(); stompRef.current = client;
    return () => { client.deactivate(); };
  }, [auctionId, session, auction?.minimumIncrement]);

  const minimumBid = useMemo(() => auction ? Number(auction.currentPrice) + Number(auction.minimumIncrement) : 0, [auction]);

  async function placeBid(event: FormEvent) {
    event.preventDefault();
    if (!session) { window.location.href = "/auth"; return; }
    if (!auction) return;
    setPlacing(true); setError("");
    try {
      const bid = await api<Bid>(`/api/v1/auctions/${auction.id}/bids`, { method: "POST", token: session.accessToken, body: { amount: Number(amount), clientRequestId: crypto.randomUUID() } });
      setBids((items) => items.some((item) => item.id === bid.id) ? items : [bid, ...items]);
      setAuction((value) => value ? { ...value, currentPrice: bid.amount, winningBidId: bid.id, winnerId: bid.bidderId } : value);
      setAmount(String(Number(bid.amount) + Number(auction.minimumIncrement))); notify("Đặt giá thành công — bạn đang dẫn đầu!");
    } catch (cause) { setError(cause instanceof ApiError ? cause.message : "Không thể đặt giá."); }
    finally { setPlacing(false); }
  }

  async function toggleWatch() {
    if (!session) { window.location.href = "/auth"; return; }
    try {
      await api<void>(`/api/v1/watchlist/${auctionId}`, { method: watched ? "DELETE" : "POST", token: session.accessToken });
      setWatched((value) => !value); notify(watched ? "Đã bỏ theo dõi phiên đấu." : "Đã thêm vào watchlist.");
    } catch (cause) { notify(cause instanceof ApiError ? cause.message : "Không thể cập nhật watchlist.", "error"); }
  }

  if (loading) return <main className="page-surface centered-state"><span className="page-loader" /><p>Đang kết nối phiên đấu...</p></main>;
  if (!auction || !product) return <main className="page-surface centered-state"><div className="empty-illustration">🔎</div><h1>Không tìm thấy phiên đấu</h1><p>{error || "Phiên đấu giá không tồn tại hoặc đã bị xóa."}</p><a className="primary-cta" href="/">Trở về khám phá</a></main>;

  const active = auction.status === "ACTIVE";
  return (
    <main className="auction-detail-page page-surface">
      <div className="detail-breadcrumb"><a href="/"><ArrowLeft size={17} /> Khám phá</a><span>/</span><span>Phiên #{auction.id}</span><div className={`live-connection ${connected ? "connected" : ""}`}>{connected ? <Wifi size={14} /> : <WifiOff size={14} />}{connected ? "Realtime connected" : "Đang kết nối lại"}</div></div>

      <section className="detail-grid">
        <div className="detail-product-column">
          <AuctionVisual id={auction.id} status={auction.status} categoryName={product.categoryName} />
          <div className="product-story"><span className="kicker">CÂU CHUYỆN VẬT PHẨM</span><h2>{product.name}</h2><p>{product.description}</p><div className="product-facts"><span><small>Tình trạng</small><b>{product.condition.replaceAll("_", " ")}</b></span><span><small>Danh mục</small><b>{product.categoryName}</b></span><span><small>Người bán</small><b>{product.sellerName}</b></span></div></div>
        </div>

        <aside className="bidding-panel">
          <div className="detail-heading"><div><span className="micro-label">PHIÊN #BD-{auction.id}</span><h1>{auction.productName}</h1><p><UserRound size={15} /> Đăng bởi <b>{auction.sellerName}</b></p></div><button className={watched ? "watched" : ""} onClick={toggleWatch} aria-label="Theo dõi"><Heart size={20} fill={watched ? "currentColor" : "none"} /></button></div>
          <div className="price-display"><span>Giá hiện tại</span><strong>{formatMoney(auction.currentPrice)}</strong><small><TrendingUp size={14} /> Bước giá tối thiểu {formatMoney(auction.minimumIncrement)}</small></div>
          <div className="detail-countdown"><div><TimerReset /><span>Kết thúc sau</span></div><strong>{remaining}</strong><small>{formatDate(auction.endTime)}</small></div>
          {active ? (
            <form className="bid-form" onSubmit={placeBid}>
              <label><span>Mức giá của bạn</span><div><input type="number" value={amount} onChange={(event) => setAmount(event.target.value)} min={minimumBid} step="1000" required /><b>₫</b></div></label>
              <div className="quick-bids"><button type="button" onClick={() => setAmount(String(minimumBid))}>Tối thiểu</button><button type="button" onClick={() => setAmount(String(minimumBid + 500000))}>+500K</button><button type="button" onClick={() => setAmount(String(minimumBid + 1000000))}>+1M</button></div>
              {error && <div className="form-error">{error}</div>}
              <button className="bid-button" disabled={placing}>{placing ? <span className="button-loader" /> : <><Gavel size={20} /> Đặt giá ngay <Zap size={17} /></>}</button>
              <p className="bid-assurance"><ShieldCheck size={15} /> Lượt bid được xử lý an toàn bằng database lock</p>
            </form>
          ) : <div className="auction-not-active"><BellRing /><h3>{statusLabel[auction.status]}</h3><p>{auction.status === "SCHEDULED" ? `Phiên bắt đầu lúc ${formatDate(auction.startTime)}.` : "Phiên này hiện không nhận lượt đặt giá mới."}</p></div>}
        </aside>
      </section>

      <section className="bid-history-section">
        <div className="section-heading"><div><span className="kicker">DÒNG THỜI GIAN REALTIME</span><h2>Lịch sử đặt giá</h2></div><span className="history-count">{bids.length} lượt hiển thị</span></div>
        <div className="bid-history">
          {bids.length ? bids.map((bid, index) => <article className={index === 0 ? "leading" : ""} key={`${bid.id}-${bid.clientRequestId}`}><span className="bid-avatar">{bid.bidderName.slice(0, 1).toUpperCase()}</span><div><b>{bid.bidderName}</b><small>{formatDate(bid.placedAt)}</small></div><strong>{formatMoney(bid.amount)}</strong>{index === 0 && <i><Trophy size={13} /> Đang dẫn đầu</i>}</article>) : <div className="history-empty"><Sparkles /><h3>Chưa có lượt bid nào</h3><p>Hãy trở thành người mở màn cho phiên đấu này.</p></div>}
        </div>
      </section>

      <section className="detail-trust"><div><CheckCircle2 /><span><b>Giá minh bạch</b><small>Mọi lượt bid đều có dấu thời gian</small></span></div><div><Radio /><span><b>Realtime WebSocket</b><small>Không cần tải lại trang</small></span></div><div><ShieldCheck /><span><b>Chống race condition</b><small>Khóa riêng theo từng phiên đấu</small></span></div></section>
    </main>
  );
}
