"use client";

import { Check, CircleAlert, Clock3, Gavel, Radio, RefreshCw, ShieldCheck, UserCog, X } from "lucide-react";
import { FormEvent, useCallback, useEffect, useState } from "react";
import { api, ApiError } from "../../lib/api";
import { formatDate, formatMoney } from "../../lib/format";
import type { Auction, PageResponse } from "../../lib/types";
import { AuctionVisual } from "../components/AuctionVisual";
import { useAuth } from "../providers";

interface UserAdminResponse { id: number; email: string; displayName: string; status: string }

export default function AdminPage() {
  const { session, ready, hasRole, notify } = useAuth();
  const [pending, setPending] = useState<Auction[]>([]);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [userResult, setUserResult] = useState<UserAdminResponse | null>(null);

  const loadPending = useCallback(async () => {
    setLoading(true);
    try {
      const page = await api<PageResponse<Auction>>("/api/v1/auctions?status=PENDING_APPROVAL&size=100");
      setPending(page.content); setError("");
    } catch (cause) { setError(cause instanceof ApiError ? cause.message : "Không thể tải hàng chờ."); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { if (session && hasRole("ADMIN")) loadPending(); }, [session, hasRole, loadPending]);

  async function decide(id: number, action: "approve" | "reject") {
    if (!session) return;
    setActing(id); setError("");
    try {
      await api<Auction>(`/api/v1/admin/auctions/${id}/${action}`, { method: "PATCH", token: session.accessToken });
      setPending((items) => items.filter((item) => item.id !== id));
      notify(action === "approve" ? `Đã phê duyệt phiên #${id}.` : `Đã từ chối phiên #${id}.`, action === "approve" ? "success" : "info");
    } catch (cause) { setError(cause instanceof ApiError ? cause.message : "Không thể cập nhật phiên đấu."); }
    finally { setActing(null); }
  }

  async function updateUser(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!session) return;
    const data = new FormData(event.currentTarget); const id = Number(data.get("userId")); const action = String(data.get("action"));
    try {
      const result = await api<UserAdminResponse>(`/api/v1/admin/users/${id}/${action}`, { method: "PATCH", token: session.accessToken });
      setUserResult(result); notify(`Đã cập nhật tài khoản #${id}.`);
    } catch (cause) { setError(cause instanceof ApiError ? cause.message : "Không thể cập nhật người dùng."); }
  }

  if (!ready) return <main className="page-surface centered-state"><span className="page-loader" /></main>;
  if (!session || !hasRole("ADMIN")) return <main className="page-surface centered-state"><div className="empty-illustration">🛡️</div><h1>Khu vực dành cho Admin</h1><p>Đăng nhập bằng tài khoản quản trị để truy cập trung tâm điều hành.</p><a className="primary-cta" href="/auth">Đăng nhập Admin</a></main>;

  return (
    <main className="admin-page page-surface">
      <section className="admin-hero"><div><span className="kicker">BIDORA CONTROL ROOM</span><h1>Trung tâm điều hành</h1><p>Duyệt phiên đấu và bảo vệ chất lượng cộng đồng từ một màn hình.</p></div><div className="admin-live"><Radio /><span><b>System online</b><small>Spring Boot · PostgreSQL · WebSocket</small></span></div></section>
      <div className="admin-stats"><article><span><Clock3 /></span><div><small>Đang chờ duyệt</small><strong>{pending.length}</strong></div></article><article><span><ShieldCheck /></span><div><small>Trạng thái hệ thống</small><strong>Healthy</strong></div></article><article><span><Gavel /></span><div><small>Cơ chế đấu giá</small><strong>Locked</strong></div></article></div>
      {error && <div className="inline-error"><CircleAlert size={17} />{error}</div>}

      <section className="admin-section">
        <div className="admin-section-heading"><div><span className="kicker">MODERATION QUEUE</span><h2>Phiên chờ phê duyệt</h2></div><button className="refresh-button" onClick={loadPending}><RefreshCw size={17} /> Làm mới</button></div>
        {loading ? <div className="admin-loading"><span className="page-loader" /></div> : pending.length ? <div className="approval-grid">{pending.map((auction) => <article key={auction.id}><AuctionVisual id={auction.id} status={auction.status} compact /><div className="approval-body"><span>#{auction.id} · {auction.sellerName}</span><h3>{auction.productName}</h3><div className="approval-facts"><div><small>Giá mở đầu</small><b>{formatMoney(auction.startingPrice)}</b></div><div><small>Bước giá</small><b>{formatMoney(auction.minimumIncrement)}</b></div></div><p><Clock3 size={14} /> {formatDate(auction.startTime)} → {formatDate(auction.endTime)}</p><div className="approval-actions"><button className="reject-action" onClick={() => decide(auction.id, "reject")} disabled={acting === auction.id}><X size={17} /> Từ chối</button><button className="approve-action" onClick={() => decide(auction.id, "approve")} disabled={acting === auction.id}>{acting === auction.id ? <span className="button-loader" /> : <><Check size={17} /> Phê duyệt</>}</button></div></div></article>)}</div> : <div className="admin-empty"><Check /><h3>Hàng chờ đã sạch</h3><p>Không có phiên đấu nào đang chờ phê duyệt.</p></div>}
      </section>

      <section className="admin-section user-admin-card">
        <div className="form-card-heading"><span><UserCog /></span><div><h2>Quản lý trạng thái tài khoản</h2><p>Nhập ID người dùng để tạm khóa hoặc kích hoạt lại tài khoản.</p></div></div>
        <form onSubmit={updateUser}><label><span>User ID</span><input name="userId" type="number" min="1" required placeholder="Ví dụ: 12" /></label><label><span>Hành động</span><select name="action"><option value="suspend">Tạm khóa</option><option value="activate">Kích hoạt lại</option></select></label><button className="submit-button">Cập nhật <UserCog size={17} /></button></form>
        {userResult && <div className="user-result"><span>{userResult.displayName.slice(0, 1)}</span><div><b>{userResult.displayName}</b><small>{userResult.email} · {userResult.status}</small></div></div>}
      </section>
    </main>
  );
}
