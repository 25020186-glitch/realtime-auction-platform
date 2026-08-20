"use client";

import { ArrowRight, Check, Eye, EyeOff, Gavel, KeyRound, Mail, ShieldCheck, Sparkles, UserRound } from "lucide-react";
import { FormEvent, useEffect, useState } from "react";
import { ApiError } from "../../lib/api";
import { useAuth } from "../providers";

type Mode = "login" | "register";

export default function AuthPage() {
  const { session, login, register, notify } = useAuth();
  const [mode, setMode] = useState<Mode>("login");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [seller, setSeller] = useState(false);

  useEffect(() => {
    if (session) window.location.href = session.roles.includes("ROLE_ADMIN") ? "/admin" : "/dashboard";
  }, [session]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);
    const data = new FormData(event.currentTarget);
    try {
      const auth = mode === "login"
        ? await login(String(data.get("email")), String(data.get("password")))
        : await register({
          email: String(data.get("email")),
          password: String(data.get("password")),
          displayName: String(data.get("displayName")),
          phoneNumber: String(data.get("phoneNumber") || ""),
          registerAsSeller: seller,
        });
      notify(mode === "login" ? "Chào mừng bạn quay lại Bidora!" : "Tài khoản đã sẵn sàng. Chào mừng đến Bidora!");
      window.location.href = auth.roles.includes("ROLE_ADMIN") ? "/admin" : "/dashboard";
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : "Không thể hoàn tất yêu cầu.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="auth-page page-surface">
      <div className="auth-visual">
        <div className="auth-visual-content">
          <div className="eyebrow"><Sparkles size={15} /> Khoảnh khắc chiến thắng bắt đầu</div>
          <h1>Tham gia cuộc chơi.<br /><span>Sở hữu điều khác biệt.</span></h1>
          <p>Một tài khoản mở ra toàn bộ trải nghiệm đấu giá trực tiếp, minh bạch và đầy cảm xúc.</p>
          <div className="auth-benefits">
            <div><span><ShieldCheck /></span><div><b>An toàn theo từng lượt bid</b><p>Giao dịch được xác thực và xử lý tuần tự.</p></div></div>
            <div><span><Gavel /></span><div><b>Cập nhật không độ trễ</b><p>Giá mới xuất hiện ngay khi phiên đấu thay đổi.</p></div></div>
          </div>
        </div>
        <div className="auth-orb orb-a" /><div className="auth-orb orb-b" />
      </div>

      <section className="auth-panel">
        <div className="auth-card">
          <a className="mobile-auth-brand brand" href="/"><span className="brand-mark"><Gavel size={21} /></span><span>Bidora</span></a>
          <span className="form-kicker">{mode === "login" ? "CHÀO MỪNG TRỞ LẠI" : "BẮT ĐẦU TRONG 60 GIÂY"}</span>
          <h2>{mode === "login" ? "Đăng nhập vào Bidora" : "Tạo tài khoản mới"}</h2>
          <p>{mode === "login" ? "Tiếp tục hành trình săn tìm những giá trị độc bản." : "Chọn cách bạn muốn tham gia cộng đồng đấu giá."}</p>

          <div className="auth-switch" role="tablist">
            <button className={mode === "login" ? "active" : ""} onClick={() => { setMode("login"); setError(""); }}>Đăng nhập</button>
            <button className={mode === "register" ? "active" : ""} onClick={() => { setMode("register"); setError(""); }}>Đăng ký</button>
          </div>

          <form className="auth-form" onSubmit={submit}>
            {mode === "register" && (
              <div className="form-row">
                <label><span>Họ và tên</span><div className="input-wrap"><UserRound size={18} /><input name="displayName" required maxLength={100} placeholder="Nguyễn Minh Anh" /></div></label>
                <label><span>Số điện thoại</span><div className="input-wrap"><span className="phone-prefix">+84</span><input name="phoneNumber" maxLength={20} placeholder="901 234 567" /></div></label>
              </div>
            )}
            <label><span>Email</span><div className="input-wrap"><Mail size={18} /><input name="email" type="email" required placeholder="you@example.com" /></div></label>
            <label><span>Mật khẩu</span><div className="input-wrap"><KeyRound size={18} /><input name="password" type={showPassword ? "text" : "password"} minLength={8} required placeholder="Tối thiểu 8 ký tự" /><button type="button" onClick={() => setShowPassword((value) => !value)} aria-label="Hiện mật khẩu">{showPassword ? <EyeOff size={17} /> : <Eye size={17} />}</button></div></label>

            {mode === "register" && (
              <button className={`seller-option ${seller ? "selected" : ""}`} type="button" onClick={() => setSeller((value) => !value)}>
                <span className="check-box">{seller && <Check size={15} />}</span>
                <span><b>Tôi muốn bán sản phẩm</b><small>Nhận thêm quyền tạo sản phẩm và phiên đấu giá.</small></span>
              </button>
            )}

            {error && <div className="form-error">{error}</div>}
            <button className="submit-button" type="submit" disabled={loading}>
              {loading ? <span className="button-loader" /> : <>{mode === "login" ? "Đăng nhập" : "Tạo tài khoản"}<ArrowRight size={18} /></>}
            </button>
          </form>

          {mode === "login" && <div className="demo-account"><ShieldCheck size={16} /><span><b>Tài khoản admin local</b> admin@auction.local / Admin123!</span></div>}
          <a className="back-home" href="/">← Trở về trang khám phá</a>
        </div>
      </section>
    </main>
  );
}
