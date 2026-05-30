import React from "react";
import { useAuth } from "../context/AuthContext";

const Header = ({ title = "7-Eleven Retail OS", searchQuery, setSearchQuery, placeholder = "Tìm kiếm..." }) => {
  const { user } = useAuth();

  const mockUser = {
    fullName: "Khách Demo (Admin)",
    role: "ADMIN"
  };
  const activeUser = user || mockUser;

  return (
    <header className="fixed top-0 right-0 border-b border-outline-variant bg-[#f9f9ff] flex justify-between items-center w-full px-6 py-4 h-16 ml-[260px] max-w-[calc(100%-260px)] z-40 hidden md:flex">
      <div className="font-bold text-lg text-on-background">{title}</div>
      
      <div className="flex items-center gap-6">
        {/* Optional Search Bar */}
        {setSearchQuery !== undefined && (
          <div className="relative w-64">
            <span className="material-symbols-outlined absolute left-2 top-1/2 -translate-y-1/2 text-on-surface-variant text-sm">
              search
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 rounded border border-outline-variant bg-[#f9f9ff] focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none text-sm transition-all"
              placeholder={placeholder}
            />
          </div>
        )}

        <div className="flex items-center gap-3 text-on-surface-variant">
          <button className="p-1 rounded-full hover:bg-white/10 transition-colors">
            <span className="material-symbols-outlined">notifications</span>
          </button>
          <button className="p-1 rounded-full hover:bg-white/10 transition-colors">
            <span className="material-symbols-outlined">help_outline</span>
          </button>
        </div>

        <div className="w-8 h-8 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center font-bold text-sm">
          {activeUser.fullName?.charAt(0).toUpperCase() || "U"}
        </div>
      </div>
    </header>
  );
};

export default Header;
