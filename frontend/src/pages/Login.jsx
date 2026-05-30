import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const Login = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    if (!username || !password) {
      setError("Vui lòng điền đầy đủ tên đăng nhập và mật khẩu");
      setSubmitting(false);
      return;
    }

    const result = await login(username, password);
    setSubmitting(false);

    if (result.success) {
      if (result.role === "ADMIN") {
        navigate("/admin/products");
      } else {
        navigate("/shop");
      }
    } else {
      setError(result.message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f9f9ff] py-12 px-4 sm:px-6 lg:px-8 font-body">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-2xl shadow-xl border border-outline-variant/30">
        
        {/* Header Branding */}
        <div className="flex flex-col items-center">
          <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center text-on-primary font-black text-3xl shadow-md mb-3">
            7E
          </div>
          <h2 className="text-center text-3xl font-extrabold tracking-tight text-primary">
            7-ELEVEN BÁN LẺ
          </h2>
          <p className="mt-2 text-center text-sm text-on-surface-variant">
            Hệ thống quản lý bán lẻ cửa hàng tiện lợi
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="p-3 rounded-lg bg-error-container text-on-error-container border border-error/20 text-sm font-semibold flex items-center gap-2">
            <span className="material-symbols-outlined text-lg">warning</span>
            <span>{error}</span>
          </div>
        )}

        {/* Login Form */}
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-2">
                Tên đăng nhập
              </label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-lg">
                  person
                </span>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-10 pr-3 py-2.5 rounded-lg border border-outline-variant bg-[#f9f9ff] focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none text-sm transition-all"
                  placeholder="Nhập tên tài khoản..."
                  autoComplete="username"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-2">
                Mật khẩu
              </label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-lg">
                  lock
                </span>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-3 py-2.5 rounded-lg border border-outline-variant bg-[#f9f9ff] focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none text-sm transition-all"
                  placeholder="Nhập mật khẩu..."
                  autoComplete="current-password"
                />
              </div>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={submitting}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-bold rounded-lg text-on-primary bg-primary hover:bg-primary-container focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? "Đang xác thực..." : "Đăng nhập hệ thống"}
            </button>
          </div>
        </form>

        {/* Toggle Register */}
        <div className="text-center pt-2">
          <p className="text-sm text-on-surface-variant">
            Chưa có tài khoản?{" "}
            <Link to="/register" className="font-bold text-primary hover:underline">
              Đăng ký ngay
            </Link>
          </p>
        </div>

      </div>
    </div>
  );
};

export default Login;
