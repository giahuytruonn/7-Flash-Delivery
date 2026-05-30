import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import LoadingSpinner from "../components/LoadingSpinner";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";

const UserShop = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { cart, addToCart } = useCart();

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");

  // Flying items state for drop/fly micro-animation
  const [flyingItems, setFlyingItems] = useState([]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await api.get("/products", {
        params: {
          page: 0,
          size: 100, // Fetch first 100 active products for user browsing
          category: categoryFilter || undefined,
          search: searchQuery || undefined,
        },
      });
      setProducts(response.data.data.content);
      setLoading(false);
    } catch (error) {
      console.error("Lỗi khi tải danh sách sản phẩm:", error);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [categoryFilter, searchQuery]);

  const handleAddToCart = (e, prod) => {
    addToCart(prod);

    // Get starting coordinates from the clicked button
    const rect = e.currentTarget.getBoundingClientRect();
    const startX = rect.left + rect.width / 2 + window.scrollX;
    const startY = rect.top + window.scrollY;

    // Get ending coordinates of the cart icon in the top header
    const cartIcon = document.getElementById("header-cart-icon");
    let endX = window.innerWidth - 80 + window.scrollX;
    let endY = 30 + window.scrollY;
    
    if (cartIcon) {
      const cartRect = cartIcon.getBoundingClientRect();
      endX = cartRect.left + cartRect.width / 2 + window.scrollX;
      endY = cartRect.top + cartRect.height / 2 + window.scrollY;
    }

    // Add new flying thumbnail item
    const newItem = {
      id: Date.now() + Math.random(),
      imageUrl: prod.imageUrl,
      startX,
      startY,
      endX,
      endY
    };
    
    setFlyingItems((prev) => [...prev, newItem]);
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const categories = [
    { key: "", label: "Tất cả" },
    { key: "Bakery", label: "Bánh mì" },
    { key: "Beverage", label: "Đồ uống" },
    { key: "Snack", label: "Đồ ăn vặt" },
    { key: "Instant Food", label: "Ăn liền" },
    { key: "Dairy", label: "Sữa tươi" },
    { key: "Combo", label: "Combo" }
  ];

  return (
    <div className="bg-[#f9f9ff] text-[#151c27] min-h-screen relative font-body flex flex-col">
      
      {/* TopNavBar Component */}
      <nav className="sticky top-0 z-50 flex flex-col w-full bg-white px-4 md:px-8 py-2 border-b border-outline-variant shadow-sm">
        <div className="flex items-center justify-between w-full max-w-[1440px] mx-auto h-16">
          {/* Brand Logo */}
          <div className="flex items-center gap-4">
            <span 
              onClick={() => { setCategoryFilter(""); setSearchQuery(""); }}
              className="text-2xl font-black text-primary tracking-tight cursor-pointer"
            >
              7-Eleven Vietnam
            </span>
          </div>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center gap-6">
            {categories.map((cat) => (
              <button
                key={cat.key}
                onClick={() => setCategoryFilter(cat.key)}
                className={`text-sm font-semibold transition-all pb-1 ${
                  categoryFilter === cat.key
                    ? "text-primary border-b-2 border-primary font-bold"
                    : "text-on-surface-variant hover:text-primary"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Trailing Actions */}
          <div className="flex items-center gap-4 text-primary font-bold animate-fade-in">
            {/* Shopping Cart Icon (Navigates directly to /cart page!) */}
            <div 
              id="header-cart-icon"
              onClick={() => navigate("/cart")}
              className="p-2 hover:bg-slate-100 rounded-full transition-colors relative cursor-pointer"
              title="Xem giỏ hàng"
            >
              <span className="material-symbols-outlined text-[24px]">shopping_cart</span>
              {cart.length > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4.5 h-4.5 bg-error text-white text-[9px] font-bold rounded-full flex items-center justify-center shadow-md animate-pulse">
                  {cart.reduce((sum, item) => sum + item.quantity, 0)}
                </span>
              )}
            </div>

            {/* Location */}
            <div className="p-2 hover:bg-slate-100 rounded-full transition-colors hidden sm:block cursor-pointer" title="Hồ Chí Minh, VN">
              <span className="material-symbols-outlined text-[24px]">location_on</span>
            </div>

            {/* User Login/Logout Info */}
            {user ? (
              <div className="flex items-center gap-2 border-l border-slate-200 pl-3">
                <div className="w-8 h-8 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center font-bold text-xs uppercase shadow-sm">
                  {user.fullName?.charAt(0).toUpperCase() || "U"}
                </div>
                <div className="hidden lg:block text-left mr-1">
                  <div className="text-xs font-bold text-on-surface leading-tight truncate max-w-[80px]">
                    {user.fullName}
                  </div>
                  <div className="text-[9px] font-semibold text-on-surface-variant uppercase tracking-wider leading-none">
                    {user.role}
                  </div>
                </div>
                <button 
                  onClick={handleLogout}
                  className="p-1.5 rounded-full hover:bg-red-50 text-red-500 transition-colors"
                  title="Đăng xuất"
                >
                  <span className="material-symbols-outlined text-[20px]">logout</span>
                </button>
              </div>
            ) : (
              <button
                onClick={() => navigate("/login")}
                className="h-9 px-4 rounded-full border border-primary text-primary hover:bg-primary/5 transition-all text-xs font-bold flex items-center gap-1.5 shadow-sm"
              >
                <span className="material-symbols-outlined text-sm">person</span>
                Đăng nhập
              </button>
            )}
          </div>
        </div>

        {/* Search Bar Sub-row */}
        <div className="w-full max-w-[1440px] mx-auto py-2 flex justify-start">
          <div className="relative w-full max-w-md">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-lg">
              search
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-100 border border-outline-variant rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none"
              placeholder="Tìm kiếm món ăn, đồ uống tại cửa hàng 7-11..."
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-primary"
              >
                <span className="material-symbols-outlined text-sm">close</span>
              </button>
            )}
          </div>
        </div>
      </nav>

      {/* Main Full-width Layout */}
      <main className="w-full max-w-[1440px] mx-auto px-4 md:px-8 py-6 flex flex-col bg-slate-50 flex-grow min-h-[calc(100vh-200px)]">
        
        {/* Grid Title */}
        <div className="mb-6 flex justify-between items-center">
          <div>
            <h1 className="text-xl md:text-2xl font-black text-primary flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-2xl">restaurant_menu</span>
              Thực đơn Cửa hàng
            </h1>
            <p className="text-xs text-on-surface-variant mt-1">
              Thưởng thức món ăn tươi ngon chuẩn vị 7-Eleven. Đặt hàng POS nhanh không cần tài khoản!
            </p>
          </div>

          <button 
            onClick={() => navigate("/cart")}
            className="px-4 py-2 bg-primary text-on-primary text-xs font-bold rounded-xl hover:bg-primary-container transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
          >
            <span className="material-symbols-outlined text-base">shopping_cart_checkout</span>
            Xem giỏ hàng ({cart.reduce((sum, item) => sum + item.quantity, 0)})
          </button>
        </div>

        {/* Product Grid */}
        {loading ? (
          <LoadingSpinner />
        ) : products.length === 0 ? (
          <div className="bg-white rounded-2xl py-20 text-center text-on-surface-variant border border-outline-variant/30 shadow-sm flex-grow">
            <span className="material-symbols-outlined text-5xl block mb-3 text-slate-300">fastfood</span>
            Không tìm thấy sản phẩm nào phù hợp. Vui lòng chọn danh mục khác!
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {products.map((prod) => (
              <div 
                key={prod.id} 
                className="bg-white rounded-2xl border border-outline-variant/30 overflow-hidden shadow-sm hover:shadow-md transition-all group flex flex-col h-full"
              >
                {/* Image wrapper */}
                <div className="relative h-44 w-full bg-slate-100 border-b border-outline-variant/20 overflow-hidden flex-shrink-0">
                  <img 
                    src={prod.imageUrl} 
                    alt={prod.name} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    onError={(e) => {
                      e.target.src = "https://placehold.co/300x200?text=7-Eleven";
                    }}
                  />
                  <span className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-white/90 backdrop-blur-sm text-primary font-bold text-[10px] uppercase shadow-sm">
                    {prod.category}
                  </span>
                </div>

                {/* Product Details */}
                <div className="p-4 flex flex-col flex-1">
                  <h3 className="font-bold text-sm text-on-surface line-clamp-2 leading-snug mb-1 min-h-[40px]">
                    {prod.name}
                  </h3>
                  <div className="text-[10px] font-mono text-on-surface-variant uppercase tracking-wider mb-2">
                    SKU: {prod.sku}
                  </div>

                  <div className="flex items-end justify-between mt-auto">
                    <div className="flex flex-col">
                      <span className="text-[10px] text-on-surface-variant font-bold">Giá bán</span>
                      <span className="text-base font-extrabold text-primary">
                        {prod.price.toLocaleString("vi-VN")}₫
                      </span>
                    </div>

                    {prod.stockQuantity <= 0 ? (
                      <span className="px-3 py-1.5 rounded-lg bg-red-100 text-red-600 font-bold text-xs">
                        HẾT HÀNG
                      </span>
                    ) : (
                      <button
                        onClick={(e) => handleAddToCart(e, prod)}
                        className="px-4 py-1.5 rounded-lg bg-primary text-on-primary font-bold text-xs hover:bg-primary-container transition-colors shadow-sm flex items-center gap-1 cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-sm">add_shopping_cart</span>
                        Thêm giỏ
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Flying Items Animation Overlay */}
      {flyingItems.map((item) => (
        <div
          key={item.id}
          onAnimationEnd={() => setFlyingItems((prev) => prev.filter((f) => f.id !== item.id))}
          className="fixed z-50 pointer-events-none rounded-full overflow-hidden border-2 border-primary bg-white shadow-xl flex items-center justify-center"
          style={{
            left: item.startX - 20,
            top: item.startY - 20,
            width: 40,
            height: 40,
            animation: "flyToCart 0.8s cubic-bezier(0.25, 1, 0.5, 1) forwards",
            "--tx": `${item.endX - item.startX}px`,
            "--ty": `${item.endY - item.startY}px`,
          }}
        >
          <img src={item.imageUrl} alt="" className="w-full h-full object-cover" />
        </div>
      ))}

      {/* Footer Component */}
      <footer className="w-full py-8 px-4 md:px-8 grid grid-cols-1 md:grid-cols-4 gap-6 bg-white border-t mt-auto text-on-surface-variant text-xs">
        <div className="flex flex-col gap-4">
          <span className="text-sm font-bold text-primary">7-Eleven Việt Nam</span>
          <p>© 2026 7-Eleven Vietnam. Tất cả các quyền được bảo lưu.</p>
        </div>
        <div className="flex flex-col gap-2 font-medium">
          <a className="hover:text-primary hover:underline transition-all" href="#">Về chúng tôi</a>
          <a className="hover:text-primary hover:underline transition-all" href="#">Tìm cửa hàng</a>
          <a className="hover:text-primary hover:underline transition-all" href="#">Tuyển dụng</a>
        </div>
        <div className="flex flex-col gap-2 font-medium">
          <a className="hover:text-primary hover:underline transition-all" href="#">Điều khoản dịch vụ</a>
          <a className="hover:text-primary hover:underline transition-all" href="#">Chính sách bảo mật</a>
          <a className="hover:text-primary hover:underline transition-all" href="#">Hỗ trợ khách hàng</a>
        </div>
        <div className="flex flex-col gap-3">
          <span className="font-bold text-on-surface">Kết nối với chúng tôi</span>
          <div className="flex gap-2">
            <button className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center hover:bg-slate-200 transition-colors">
              <span className="material-symbols-outlined text-sm text-on-surface-variant">share</span>
            </button>
            <button className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center hover:bg-slate-200 transition-colors">
              <span className="material-symbols-outlined text-sm text-on-surface-variant">mail</span>
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default UserShop;
