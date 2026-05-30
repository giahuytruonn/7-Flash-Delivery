import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const Register = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState("USER"); // USER by default, but allows selecting ADMIN
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setSubmitting(true);

    if (!username || !password || !fullName) {
      setError("Vui lòng điền đầy đủ họ tên, tên đăng nhập và mật khẩu");
      setSubmitting(false);
      return;
    }

    if (username.length < 3) {
      setError("Tên đăng nhập phải chứa ít nhất 3 ký tự");
      setSubmitting(false);
      return;
    }

    if (password.length < 6) {
      setError("Mật khẩu phải chứa ít nhất 6 ký tự");
      setSubmitting(false);
      return;
    }

    const result = await register(username, password, fullName, role);
    setSubmitting(false);

    if (result.success) {
      setSuccess("Đăng ký tài khoản thành công! Đang chuyển hướng về trang Đăng nhập...");
      setTimeout(() => {
        navigate("/login");
      }, 2500);
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
            ĐĂNG KÝ TÀI KHOẢN
          </h2>
          <p className="mt-2 text-center text-sm text-on-surface-variant">
            Gia nhập hệ thống quản lý bán lẻ 7-Eleven
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="p-3 rounded-lg bg-error-container text-on-error-container border border-error/20 text-sm font-semibold flex items-center gap-2">
            <span className="material-symbols-outlined text-lg">warning</span>
            <span>{error}</span>
          </div>
        )}

        {/* Success Alert */}
        {success && (
          <div className="p-3 rounded-lg bg-primary/10 text-primary border border-primary/20 text-sm font-semibold flex items-center gap-2">
            <span className="material-symbols-outlined text-lg">check_circle</span>
            <span>{success}</span>
          </div>
        )}

        {/* Registration Form */}
        <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
          <div className="space-y-4">
            
            {/* Full Name */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-2">
                Họ và tên
              </label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-lg">
                  badge
                </span>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full pl-10 pr-3 py-2.5 rounded-lg border border-outline-variant bg-[#f9f9ff] focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none text-sm transition-all"
                  placeholder="Nhập họ và tên..."
                />
              </div>
            </div>

            {/* Username */}
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
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-2">
                Mật khẩu (từ 6 ký tự)
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
                />
              </div>
            </div>

            {/* Role selection dropdown */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-2">
                Phân quyền tài khoản
              </label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-lg">
                  groups
                </span>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full pl-10 pr-3 py-2.5 rounded-lg border border-outline-variant bg-[#f9f9ff] focus:border-primary outline-none text-sm h-[40px] appearance-none"
                >
                  <option value="USER">Khách hàng</option>
                  <option value="ADMIN">Quản trị viên</option>
                </select>
                <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-lg pointer-events-none">
                  arrow_drop_down
                </span>
              </div>
            </div>

          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={submitting || success}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-bold rounded-lg text-on-primary bg-primary hover:bg-primary-container focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? "Đang xử lý..." : "Đăng ký thành viên"}
            </button>
          </div>
        </form>

        {/* Toggle Login */}
        <div className="text-center pt-2 border-t border-outline-variant/30">
          <p className="text-sm text-on-surface-variant">
            Đã có tài khoản?{" "}
            <Link to="/login" className="font-bold text-primary hover:underline">
              Đăng nhập tại đây
            </Link>
          </p>
        </div>

      </div>
    </div>
  );
};

export default Register;
