"use client";

import { ArrowUpRight, Gavel, Radio, ShieldCheck, Sparkles, TimerReset, TrendingUp, UserCheck, Zap } from "lucide-react";
import { useEffect, useState } from "react";
import { api, ApiError } from "../lib/api";
import { countdown, formatMoney } from "../lib/format";
import type { Auction, Category, PageResponse } from "../lib/types";
import { AuctionCard } from "./components/AuctionCard";
import { useAuth } from "./providers";

const demoCards = [
  { name: "Đồng hồ Celestia 1968", category: "Sưu tầm", price: "24.800.000 ₫", time: "01:42:18", art: "⌚", color: "violet" },
  { name: "Máy ảnh film Kyoto", category: "Công nghệ", price: "12.450.000 ₫", time: "03:16:44", art: "📷", color: "cyan" },
  { name: "Sneaker Aurora No.09", category: "Thời trang", price: "8.900.000 ₫", time: "05:09:27", art: "👟", color: "coral" },
];

const categoryIcons: Record<string, string> = {
  Electronics: "📷", Fashion: "👟", Collectibles: "⌚", Books: "📚", "Home & Living": "🪑",
};

export default function Home() {
  const { session } = useAuth();
  const [auctions, setAuctions] = useState<Auction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [offline, setOffline] = useState(false);
  const [now, setNow] = useState(0);

  useEffect(() => {
    Promise.all([
      api<PageResponse<Auction>>("/api/v1/auctions?status=ACTIVE&size=6"),
      api<Category[]>("/api/v1/categories"),
    ]).then(([auctionPage, categoryList]) => {
      setAuctions(auctionPage.content);
      setCategories(categoryList);
      setOffline(false);
    }).catch((error) => setOffline(error instanceof ApiError && error.code === "BACKEND_OFFLINE"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  const featured = auctions[0];
  const featuredCountdown = featured && now >= 0 ? countdown(featured.endTime) : "01:42:18";

  return (
    <main className="site-shell home-shell">
      <div className="ambient ambient-one" /><div className="ambient ambient-two" />
      {offline && <div className="connection-banner"><Radio size={15} /> Backend đang offline — giao diện mẫu vẫn sẵn sàng. Hãy chạy Docker để tải dữ liệu thật.</div>}

      <section className="hero" id="top">
        <div className="hero-copy">
          <div className="eyebrow"><Sparkles size={15} /> Sàn đấu giá thế hệ mới</div>
          <h1>Giá trị <span>độc bản.</span><br />Khoảnh khắc thuộc về bạn.</h1>
          <p>Chạm đến những món đồ khác biệt, theo dõi từng nhịp giá và chiến thắng ngay trong thời gian thực.</p>
          <div className="hero-actions">
            <a className="primary-cta" href={featured ? `/auctions/${featured.id}` : session ? "/dashboard" : "/auth"}>
              {featured ? "Tham gia phiên live" : session ? "Bắt đầu khám phá" : "Tạo tài khoản miễn phí"}<ArrowUpRight size={18} />
            </a>
            <a className="secondary-cta" href="#how"><span className="play-dot">▶</span> Bidora hoạt động thế nào?</a>
          </div>
          <div className="trust-row">
            <div><strong>12K+</strong><span>Thành viên</span></div>
            <div><strong>850+</strong><span>Phiên thành công</span></div>
            <div><strong>99.9%</strong><span>Giao dịch an toàn</span></div>
          </div>
        </div>

        <div className="hero-stage" aria-label="Phiên đấu giá nổi bật">
          <div className="orbit orbit-one" /><div className="orbit orbit-two" />
          <div className="live-card">
            <div className="live-card-top"><span className="live-pill"><i /> {featured ? "LIVE" : "DEMO"}</span></div>
            <div className="hero-product"><span className="product-halo" /><span className="watch-art">⌚</span><span className="shine" /></div>
            <div className="live-card-info">
              <div><span className="micro-label">{featured ? `Phiên #BD-${featured.id}` : "Trải nghiệm Bidora"}</span><h2>{featured?.productName || "Celestia Moonphase 1968"}</h2></div>
              <div className="price-row">
                <div><span>Giá hiện tại</span><strong>{featured ? formatMoney(featured.currentPrice) : "24.800.000 ₫"}</strong></div>
                <div className="timer"><TimerReset size={17} /><span>{featuredCountdown}</span></div>
              </div>
              <div className="bid-pulse"><span><Zap size={15} /> {featured ? "Dữ liệu đang cập nhật realtime" : "Đấu giá không cần tải lại trang"}</span><b>LIVE</b></div>
            </div>
          </div>
          <div className="floating-note note-one"><TrendingUp size={17} /><span><b>+18%</b> hoạt động hôm nay</span></div>
          <div className="floating-note note-two"><ShieldCheck size={17} /><span>Giao dịch an toàn</span></div>
        </div>
      </section>

      <section className="live-section" id="live">
        <div className="section-heading">
          <div><span className="kicker"><i /> ĐANG DIỄN RA</span><h2>Phiên đấu giá nổi bật</h2></div>
          <a href="#discover">Xem danh mục <ArrowUpRight size={17} /></a>
        </div>
        {loading ? (
          <div className="auction-grid">{[0, 1, 2].map((value) => <div className="auction-card loading-card" key={value}><div /><span /><b /></div>)}</div>
        ) : auctions.length > 0 ? (
          <div className="auction-grid">{auctions.map((auction, index) => <AuctionCard auction={auction} index={index} key={auction.id} />)}</div>
        ) : (
          <div className="auction-grid">
            {demoCards.map((item, index) => (
              <article className="auction-card demo-card" key={item.name} style={{ "--delay": `${index * 90}ms` } as React.CSSProperties}>
                <div className={`card-art ${item.color}`}><span className="demo-label">TRẢI NGHIỆM MẪU</span><span className="item-art">{item.art}</span><span className="countdown"><TimerReset size={14} />{item.time}</span></div>
                <div className="card-body"><span className="card-category">{item.category}</span><h3>{item.name}</h3><div className="card-bottom"><div><span>Giá minh họa</span><strong>{item.price}</strong></div><a className="round-link" href={session ? "/dashboard" : "/auth"}><ArrowUpRight size={18} /></a></div></div>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="category-section" id="discover">
        <div className="section-heading centered-heading"><div><span className="kicker">KHÁM PHÁ THEO GU</span><h2>Mỗi danh mục, một câu chuyện</h2><p>Từ công nghệ hiếm đến những món đồ mang dấu ấn thời gian.</p></div></div>
        <div className="category-grid">
          {(categories.length ? categories : Object.keys(categoryIcons).map((name, index) => ({ id: index, name }))).map((category, index) => (
            <a className="category-tile" href="#live" key={category.id} style={{ "--tile": index } as React.CSSProperties}>
              <span>{categoryIcons[category.name] || "✨"}</span><b>{category.name}</b><i><ArrowUpRight size={16} /></i>
            </a>
          ))}
        </div>
      </section>

      <section className="how-section" id="how">
        <div className="how-copy"><span className="kicker">NHANH · MINH BẠCH · REALTIME</span><h2>Từ khám phá đến chiến thắng trong ba nhịp.</h2><p>Mọi thay đổi giá đều được đồng bộ ngay lập tức. Cơ chế khóa database bảo đảm mỗi lượt bid được xử lý công bằng.</p><a className="primary-cta" href={session ? "/dashboard" : "/auth"}>Bắt đầu ngay <ArrowUpRight size={18} /></a></div>
        <div className="steps-list">
          <article><span>01</span><div><UserCheck /><h3>Tạo tài khoản</h3><p>Đăng ký Buyer hoặc Seller chỉ trong một phút.</p></div></article>
          <article><span>02</span><div><Gavel /><h3>Đặt mức giá</h3><p>Theo dõi biến động và bid trực tiếp trên phiên đấu giá.</p></div></article>
          <article><span>03</span><div><Zap /><h3>Nhận kết quả realtime</h3><p>Thông báo thắng, thua và thay đổi trạng thái đến tức thì.</p></div></article>
        </div>
      </section>

      <footer className="site-footer"><a className="brand" href="/"><span className="brand-mark"><Gavel size={20} /></span><span>Bidora</span></a><p>Real-time auctions. Real excitement.</p><span>© 2026 Bidora</span></footer>
    </main>
  );
}
