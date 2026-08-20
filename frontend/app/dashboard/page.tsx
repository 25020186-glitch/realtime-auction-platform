"use client";

import { ArrowRight, Bell, Boxes, CalendarClock, CheckCircle2, Gavel, Heart, LayoutDashboard, PackagePlus, Radio, RefreshCw, Rocket, ShoppingBag, Sparkles, Trophy } from "lucide-react";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { api, ApiError } from "../../lib/api";
import { conditionLabel, formatDate, formatMoney, statusLabel } from "../../lib/format";
import type { Auction, Category, NotificationItem, PageResponse, Product } from "../../lib/types";
import { AuctionCard } from "../components/AuctionCard";
import { useAuth } from "../providers";

type Tab = "overview" | "products" | "create-product" | "create-auction" | "watchlist" | "notifications";

export default function DashboardPage() {
  const { session, ready, hasRole, notify } = useAuth();
  const [tab, setTab] = useState<Tab>("overview");
  const [products, setProducts] = useState<Product[]>([]);
  const [myAuctions, setMyAuctions] = useState<Auction[]>([]);
  const [watchlist, setWatchlist] = useState<Auction[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const hash = window.location.hash.slice(1);
    if (hash === "notifications") setTab("notifications");
  }, []);

  const loadData = useCallback(async () => {
    if (!session) return;
    setLoading(true);
    try {
      const common = await Promise.all([
        api<Category[]>("/api/v1/categories"),
        api<PageResponse<Auction>>("/api/v1/watchlist?size=50", { token: session.accessToken }),
        api<PageResponse<NotificationItem>>("/api/v1/notifications?size=50", { token: session.accessToken }),
      ]);
      setCategories(common[0]); setWatchlist(common[1].content); setNotifications(common[2].content);
      if (hasRole("SELLER")) {
        const [productPage, auctionPage] = await Promise.all([
          api<PageResponse<Product>>("/api/v1/products/mine?size=100", { token: session.accessToken }),
          api<PageResponse<Auction>>("/api/v1/auctions?size=100"),
        ]);
        setProducts(productPage.content);
        setMyAuctions(auctionPage.content.filter((auction) => auction.sellerId === session.userId));
      }
      setError("");
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : "Không thể tải dashboard.");
    } finally { setLoading(false); }
  }, [session, hasRole]);

  useEffect(() => { loadData(); }, [loadData]);

  const stats = useMemo(() => ({
    products: products.length,
    active: myAuctions.filter((item) => item.status === "ACTIVE").length,
    pending: myAuctions.filter((item) => item.status === "PENDING_APPROVAL").length,
    watched: watchlist.length,
  }), [products, myAuctions, watchlist]);

  async function createProduct(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setSaving(true); setError("");
    const form = event.currentTarget; const data = new FormData(form);
    try {
      const created = await api<Product>("/api/v1/products", {
        method: "POST", token: session!.accessToken,
        body: { categoryId: Number(data.get("categoryId")), name: data.get("name"), description: data.get("description"), condition: data.get("condition") },
      });
      setProducts((items) => [created, ...items]); form.reset(); notify("Sản phẩm đã được tạo thành công."); setTab("create-auction");
    } catch (cause) { setError(cause instanceof ApiError ? cause.message : "Không thể tạo sản phẩm."); }
    finally { setSaving(false); }
  }

  async function createAuction(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setSaving(true); setError("");
    const form = event.currentTarget; const data = new FormData(form);
    try {
      const created = await api<Auction>("/api/v1/auctions", {
        method: "POST", token: session!.accessToken,
        body: {
          productId: Number(data.get("productId")), startingPrice: Number(data.get("startingPrice")), minimumIncrement: Number(data.get("minimumIncrement")),
          startTime: new Date(String(data.get("startTime"))).toISOString(), endTime: new Date(String(data.get("endTime"))).toISOString(),
        },
      });
      setMyAuctions((items) => [created, ...items]); form.reset(); notify("Phiên đấu giá đã gửi duyệt."); setTab("overview");
    } catch (cause) { setError(cause instanceof ApiError ? cause.message : "Không thể tạo phiên đấu giá."); }
    finally { setSaving(false); }
  }

  async function markRead(item: NotificationItem) {
    if (item.read || !session) return;
    try {
      const updated = await api<NotificationItem>(`/api/v1/notifications/${item.id}/read`, { method: "PATCH", token: session.accessToken });
      setNotifications((items) => items.map((value) => value.id === updated.id ? updated : value));
    } catch (cause) { notify(cause instanceof ApiError ? cause.message : "Không thể cập nhật thông báo.", "error"); }
  }

  if (!ready) return <main className="page-surface centered-state"><span className="page-loader" /></main>;
  if (!session) return <main className="page-surface centered-state"><div className="empty-illustration">🔐</div><h1>Đăng nhập để mở không gian cá nhân</h1><p>Quản lý lượt bid, sản phẩm, watchlist và thông báo của bạn.</p><a className="primary-cta" href="/auth">Đăng nhập ngay <ArrowRight size={18} /></a></main>;

  const isSeller = hasRole("SELLER");
  const nav: { id: Tab; label: string; icon: React.ReactNode; seller?: boolean }[] = [
    { id: "overview", label: "Tổng quan", icon: <LayoutDashboard size={18} /> },
    { id: "products", label: "Sản phẩm của tôi", icon: <Boxes size={18} />, seller: true },
    { id: "create-product", label: "Thêm sản phẩm", icon: <PackagePlus size={18} />, seller: true },
    { id: "create-auction", label: "Tạo phiên đấu", icon: <Gavel size={18} />, seller: true },
    { id: "watchlist", label: "Đang theo dõi", icon: <Heart size={18} /> },
    { id: "notifications", label: "Thông báo", icon: <Bell size={18} /> },
  ];

  return (
    <main className="dashboard-page page-surface">
      <aside className="dashboard-sidebar">
        <div className="profile-block"><span>{session.displayName.slice(0, 1).toUpperCase()}</span><div><b>{session.displayName}</b><small>{isSeller ? "Seller · Buyer" : hasRole("ADMIN") ? "Administrator" : "Bidder"}</small></div></div>
        <nav>{nav.filter((item) => !item.seller || isSeller).map((item) => <button className={tab === item.id ? "active" : ""} key={item.id} onClick={() => { setTab(item.id); setError(""); }}>{item.icon}{item.label}{item.id === "notifications" && notifications.some((value) => !value.read) && <i />}</button>)}</nav>
        {!isSeller && !hasRole("ADMIN") && <div className="seller-upgrade"><Sparkles /><b>Muốn trở thành Seller?</b><p>Tạo tài khoản Seller mới để đăng vật phẩm đấu giá.</p></div>}
      </aside>

      <section className="dashboard-content">
        <div className="dashboard-title"><div><span className="kicker">KHÔNG GIAN CỦA BẠN</span><h1>{nav.find((item) => item.id === tab)?.label}</h1></div><button className="refresh-button" onClick={loadData}><RefreshCw size={17} /> Làm mới</button></div>
        {error && <div className="inline-error"><Radio size={17} />{error}</div>}

        {tab === "overview" && (
          <>
            <div className="stats-grid">
              <article><span className="stat-icon purple"><ShoppingBag /></span><div><small>Sản phẩm</small><strong>{stats.products}</strong></div></article>
              <article><span className="stat-icon green"><Radio /></span><div><small>Phiên đang live</small><strong>{stats.active}</strong></div></article>
              <article><span className="stat-icon coral"><CalendarClock /></span><div><small>Chờ phê duyệt</small><strong>{stats.pending}</strong></div></article>
              <article><span className="stat-icon cyan"><Heart /></span><div><small>Đang theo dõi</small><strong>{stats.watched}</strong></div></article>
            </div>
            {isSeller && <div className="quick-actions"><button onClick={() => setTab("create-product")}><span><PackagePlus /></span><div><b>Đăng sản phẩm mới</b><p>Tạo hồ sơ vật phẩm trước khi mở phiên đấu.</p></div><ArrowRight /></button><button onClick={() => setTab("create-auction")}><span><Rocket /></span><div><b>Mở phiên đấu giá</b><p>Thiết lập thời gian, giá mở đầu và bước giá.</p></div><ArrowRight /></button></div>}
            <div className="dashboard-section"><div className="mini-heading"><h2>Phiên gần đây</h2>{isSeller && <button onClick={() => setTab("products")}>Xem sản phẩm</button>}</div>{loading ? <span className="page-loader" /> : myAuctions.length ? <div className="auction-table">{myAuctions.slice(0, 6).map((auction) => <a href={`/auctions/${auction.id}`} key={auction.id}><span className="table-art">🏷️</span><div><b>{auction.productName}</b><small>#{auction.id} · {formatDate(auction.endTime)}</small></div><strong>{formatMoney(auction.currentPrice)}</strong><i className={`status-${auction.status.toLowerCase()}`}>{statusLabel[auction.status]}</i></a>)}</div> : <Empty title={isSeller ? "Chưa có phiên đấu giá" : "Bạn chưa tham gia phiên nào"} text={isSeller ? "Tạo sản phẩm đầu tiên để bắt đầu." : "Khám phá phiên live và đặt giá đầu tiên."} action={() => isSeller ? setTab("create-product") : window.location.assign("/#live")} />}</div>
          </>
        )}

        {tab === "products" && <div className="dashboard-section">{products.length ? <div className="product-list">{products.map((product) => <article key={product.id}><span className="product-list-art">📦</span><div><small>{product.categoryName}</small><h3>{product.name}</h3><p>{product.description}</p><div className="product-meta"><span>{conditionLabel[product.condition]}</span><span>#{product.id}</span></div></div></article>)}</div> : <Empty title="Kho sản phẩm đang trống" text="Thêm vật phẩm đầu tiên để tạo phiên đấu giá." action={() => setTab("create-product")} />}</div>}

        {tab === "create-product" && <FormCard icon={<PackagePlus />} title="Thêm vật phẩm mới" text="Mô tả rõ ràng giúp phiên đấu giá đáng tin cậy và hấp dẫn hơn."><form className="dashboard-form" onSubmit={createProduct}><label><span>Tên sản phẩm</span><input name="name" required maxLength={200} placeholder="Ví dụ: Máy ảnh film Kyoto 1984" /></label><div className="form-row"><label><span>Danh mục</span><select name="categoryId" required defaultValue=""><option value="" disabled>Chọn danh mục</option>{categories.map((category) => <option value={category.id} key={category.id}>{category.name}</option>)}</select></label><label><span>Tình trạng</span><select name="condition" defaultValue="LIKE_NEW">{Object.entries(conditionLabel).map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></label></div><label><span>Mô tả chi tiết</span><textarea name="description" required maxLength={10000} rows={6} placeholder="Nguồn gốc, năm sản xuất, tình trạng thực tế, phụ kiện đi kèm..." /></label><button className="submit-button" disabled={saving}>{saving ? <span className="button-loader" /> : <>Lưu sản phẩm <ArrowRight size={18} /></>}</button></form></FormCard>}

        {tab === "create-auction" && <FormCard icon={<Gavel />} title="Thiết lập phiên đấu giá" text="Phiên sẽ chuyển đến Admin duyệt trước khi được công khai.">{products.length ? <form className="dashboard-form" onSubmit={createAuction}><label><span>Chọn sản phẩm</span><select name="productId" required defaultValue=""><option value="" disabled>Chọn vật phẩm chưa đấu giá</option>{products.filter((product) => !myAuctions.some((auction) => auction.productId === product.id)).map((product) => <option value={product.id} key={product.id}>#{product.id} — {product.name}</option>)}</select></label><div className="form-row"><label><span>Giá khởi điểm (₫)</span><input name="startingPrice" type="number" min="0" step="1000" required placeholder="1000000" /></label><label><span>Bước giá tối thiểu (₫)</span><input name="minimumIncrement" type="number" min="1" step="1000" required placeholder="100000" /></label></div><div className="form-row"><label><span>Bắt đầu</span><input name="startTime" type="datetime-local" required /></label><label><span>Kết thúc</span><input name="endTime" type="datetime-local" required /></label></div><button className="submit-button" disabled={saving}>{saving ? <span className="button-loader" /> : <>Gửi phê duyệt <Rocket size={18} /></>}</button></form> : <Empty title="Bạn cần sản phẩm trước" text="Tạo ít nhất một sản phẩm trước khi mở phiên đấu giá." action={() => setTab("create-product")} />}</FormCard>}

        {tab === "watchlist" && <div className="dashboard-section">{watchlist.length ? <div className="auction-grid compact-grid">{watchlist.map((auction, index) => <AuctionCard auction={auction} index={index} key={auction.id} />)}</div> : <Empty title="Watchlist đang trống" text="Nhấn biểu tượng trái tim trong phiên đấu để theo dõi." action={() => window.location.assign("/#live")} />}</div>}

        {tab === "notifications" && <div className="notification-list">{notifications.length ? notifications.map((item) => <button className={item.read ? "read" : ""} onClick={() => markRead(item)} key={item.id}><span className={`notification-icon ${item.type.toLowerCase()}`}>{item.type.includes("WON") ? <Trophy /> : item.type.includes("APPROVED") ? <CheckCircle2 /> : <Bell />}</span><div><b>{item.title}</b><p>{item.message}</p><small>{formatDate(item.createdAt)}</small></div>{!item.read && <i />}</button>) : <Empty title="Chưa có thông báo" text="Tin nhắn về lượt bid và kết quả phiên đấu sẽ xuất hiện tại đây." />}</div>}
      </section>
    </main>
  );
}

function Empty({ title, text, action }: { title: string; text: string; action?: () => void }) {
  return <div className="dashboard-empty"><span>✦</span><h3>{title}</h3><p>{text}</p>{action && <button onClick={action}>Bắt đầu <ArrowRight size={16} /></button>}</div>;
}

function FormCard({ icon, title, text, children }: { icon: React.ReactNode; title: string; text: string; children: React.ReactNode }) {
  return <div className="form-card"><div className="form-card-heading"><span>{icon}</span><div><h2>{title}</h2><p>{text}</p></div></div>{children}</div>;
}
