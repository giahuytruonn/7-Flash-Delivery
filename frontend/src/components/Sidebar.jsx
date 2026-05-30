import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const Sidebar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const mockUser = {
    fullName: "Khách Demo (Admin)",
    role: "ADMIN"
  };
  const activeUser = user || mockUser;

  return (
    <nav className="fixed left-0 top-0 h-full w-[260px] bg-[#0D1F17] flex flex-col py-6 px-4 z-50 hidden md:flex">
      {/* Brand Header */}
      <div className="mb-8 flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-on-primary font-bold text-lg">
          7E
        </div>
        <div>
          <div className="font-bold text-xl font-black text-primary tracking-tight text-white">
            7-ELEVEN
          </div>
          <div className="text-white/50 text-[11px] font-bold uppercase tracking-wider">
            Retail OS
          </div>
        </div>
      </div>

      {/* Nav Links based on Role */}
      <div className="flex-1 space-y-2">
        {activeUser.role === "ADMIN" ? (
          <>
            {/* Standout button to return to Client Storefront */}
            <NavLink
              to="/shop"
              className="flex items-center gap-3 px-3 py-2.5 rounded bg-[#F58220] hover:bg-[#E07116] text-white font-extrabold transition-all duration-200 shadow-md mb-4 border border-[#F58220]/20"
            >
              <span className="material-symbols-outlined">storefront</span>
              <span>Về Trang Chủ Shop</span>
            </NavLink>

            <NavLink
              to="/admin/products"
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded transition-all duration-200 ${
                  isActive
                    ? "border-l-[4px] border-primary bg-white/10 text-white font-bold"
                    : "text-white/60 hover:bg-white/5 hover:text-white"
                }`
              }
            >
              <span className="material-symbols-outlined" data-weight="fill">inventory_2</span>
              <span>Sản phẩm</span>
            </NavLink>

            <NavLink
              to="/admin/orders"
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded transition-all duration-200 ${
                  isActive
                    ? "border-l-[4px] border-primary bg-white/10 text-white font-bold"
                    : "text-white/60 hover:bg-white/5 hover:text-white"
                }`
              }
            >
              <span className="material-symbols-outlined">shopping_cart</span>
              <span>Đơn hàng</span>
            </NavLink>
          </>
        ) : (
          <NavLink
            to="/shop"
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded transition-all duration-200 ${
                isActive
                  ? "border-l-[4px] border-primary bg-white/10 text-white font-bold"
                  : "text-white/60 hover:bg-white/5 hover:text-white"
              }`
            }
          >
            <span className="material-symbols-outlined" data-weight="fill">storefront</span>
            <span>Cửa hàng 7-11</span>
          </NavLink>
        )}
      </div>

      {/* Footer / User Profile & Logout */}
      <div className="mt-auto pt-4 border-t border-white/10 space-y-4">
        <div className="flex items-center gap-3 px-3">
          <div className="w-8 h-8 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center font-bold text-sm">
            {activeUser.fullName?.charAt(0).toUpperCase() || "U"}
          </div>
          <div className="overflow-hidden">
            <div className="text-white text-sm font-semibold truncate">
              {activeUser.fullName || "User"}
            </div>
            <div className="text-white/40 text-[10px] uppercase font-bold tracking-wider">
              {activeUser.role}
            </div>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded text-white/60 hover:bg-red-500/10 hover:text-red-400 transition-all duration-200"
        >
          <span className="material-symbols-outlined">logout</span>
          <span>Đăng xuất</span>
        </button>
      </div>
    </nav>
  );
};

export default Sidebar;
