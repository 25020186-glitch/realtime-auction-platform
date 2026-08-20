"use client";

import { Bell, Gavel, LayoutDashboard, LogOut, Menu, Search, ShieldCheck, UserRound, X } from "lucide-react";
import { useEffect, useState } from "react";
import { api } from "../../lib/api";
import type { NotificationItem, PageResponse } from "../../lib/types";
import { useAuth } from "../providers";

export function AppHeader() {
  const { session, ready, logout, hasRole } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    if (!session) { setUnread(0); return; }
    api<PageResponse<NotificationItem>>("/api/v1/notifications?size=20", { token: session.accessToken })
      .then((page) => setUnread(page.content.filter((item) => !item.read).length))
      .catch(() => setUnread(0));
  }, [session]);

  return (
    <header className="app-header">
      <a className="brand" href="/" aria-label="Bidora trang chủ">
        <span className="brand-mark"><Gavel size={22} /></span><span>Bidora</span>
      </a>
      <nav className={`app-nav ${mobileOpen ? "open" : ""}`} aria-label="Điều hướng chính">
        <a href="/#live">Đang diễn ra</a>
        <a href="/#discover">Khám phá</a>
        <a href="/#how">Cách hoạt động</a>
        {session && <a href="/dashboard"><LayoutDashboard size={16} /> Không gian của tôi</a>}
        {hasRole("ADMIN") && <a href="/admin"><ShieldCheck size={16} /> Quản trị</a>}
      </nav>
      <div className="header-actions">
        <a className="icon-button desktop-action" href="/#discover" aria-label="Tìm kiếm"><Search size={19} /></a>
        {session && <a className="icon-button notification-button" href="/dashboard#notifications" aria-label="Thông báo"><Bell size={19} />{unread > 0 && <i />}</a>}
        {!ready ? <span className="header-skeleton" /> : session ? (
          <div className="user-menu">
            <a className="user-chip" href="/dashboard"><span>{session.displayName.slice(0, 1).toUpperCase()}</span><b>{session.displayName}</b></a>
            <button className="icon-button desktop-action" onClick={logout} aria-label="Đăng xuất"><LogOut size={18} /></button>
          </div>
        ) : (
          <a className="login-button" href="/auth"><UserRound size={16} /> Đăng nhập</a>
        )}
        <button className="mobile-menu-button" onClick={() => setMobileOpen((value) => !value)} aria-label="Mở menu">
          {mobileOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>
    </header>
  );
}
