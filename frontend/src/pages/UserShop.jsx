import React, { useState, useEffect, useRef } from "react";
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

  // Ref to scroll to products grid
  const productsRef = useRef(null);

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

  const scrollToProducts = () => {
    productsRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // 6 Seeded/Interactive Categories mapping with beautiful material icons
  const categoriesList = [
    { key: "", label: "Tất cả", icon: "widgets" },
    { key: "Bakery", label: "Hot Food", icon: "lunch_dining" },
    { key: "Beverage", label: "Beverages", icon: "local_cafe" },
    { key: "Snack", label: "Snacks", icon: "cookie" },
    { key: "Instant Food", label: "Instant Food", icon: "ramen_dining" },
    { key: "Dairy", label: "Essentials", icon: "shopping_basket" },
    { key: "Combo", label: "Combos", icon: "fastfood" }
  ];

  return (
    <div className="bg-[#f9f9ff] text-[#151c27] min-h-screen relative font-body flex flex-col">
      
      {/* TopNavBar Component - Exact matching user-page.html bar layout */}
      <nav className="sticky top-0 z-50 flex flex-col w-full bg-white px-4 md:px-8 py-2 border-b border-outline-variant shadow-sm">
        <div className="flex items-center justify-between w-full max-w-[1440px] mx-auto h-16">
          {/* Brand Logo */}
          <div className="flex items-center gap-4">
            <span 
              onClick={() => { setCategoryFilter(""); setSearchQuery(""); }}
              className="text-2xl font-black text-primary tracking-tight cursor-pointer"
            >
              7-Flash Delivery
            </span>
          </div>

          {/* Navigation Links (Desktop) - Connects directly to Categories filter! */}
          <div className="hidden md:flex items-center gap-6">
            {categoriesList.map((cat) => (
              <button
                key={cat.key}
                onClick={() => {
                  setCategoryFilter(cat.key);
                  scrollToProducts();
                }}
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
          <div className="flex items-center gap-4 text-primary font-bold">
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

      {/* Main Full-width Layout matching user-page.html perfectly */}
      <main className="w-full max-w-[1440px] mx-auto px-4 md:px-8 py-6 space-y-8 bg-slate-50 flex-grow">
        
        {/* 1. Hero Banner Section */}
        <section className="relative w-full h-[320px] md:h-[420px] rounded-2xl overflow-hidden flex items-center shadow-md">
          <img 
            alt="Freshness at Your Doorstep - 7-Eleven Vietnam Delivery" 
            className="absolute inset-0 w-full h-full object-cover z-0" 
            src="https://images.unsplash.com/photo-1543007630-9710e4a00a20?auto=format&fit=crop&w=1200&q=80" 
            onError={(e) => {
              e.target.src = "https://images.unsplash.com/photo-1509722747041-616f39b57569?auto=format&fit=crop&w=1200&q=80";
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#151c27]/90 via-[#151c27]/60 to-transparent z-10"></div>
          
          <div className="relative z-20 px-6 md:px-12 max-w-xl text-white space-y-4">
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight leading-tight">
              Freshness at Your Doorstep
            </h1>
            <p className="text-sm md:text-base text-white/90 leading-relaxed font-medium">
              Order your favorite 7-Eleven treats online and get them delivered in minutes.
            </p>
            <button 
              onClick={scrollToProducts}
              className="h-11 px-6 rounded-lg bg-primary text-white font-bold text-sm hover:bg-primary-container transition-all shadow-md focus:ring-2 focus:ring-primary cursor-pointer flex items-center justify-center gap-1"
            >
              Shop Now
              <span className="material-symbols-outlined text-sm">arrow_forward</span>
            </button>
          </div>
        </section>

        {/* 2. Explore Categories (Circle-link horizontal grid, completely interactive!) */}
        <section className="py-2 border-b border-slate-100">
          <h2 className="text-base md:text-lg font-extrabold text-on-surface mb-6 flex items-center gap-1.5">
            <span className="material-symbols-outlined text-primary">category</span>
            Explore Categories
          </h2>
          
          <div className="grid grid-cols-4 sm:grid-cols-4 md:grid-cols-7 gap-4">
            {categoriesList.map((cat) => (
              <div 
                key={cat.key}
                onClick={() => {
                  setCategoryFilter(cat.key);
                  scrollToProducts();
                }}
                className="flex flex-col items-center gap-2 group cursor-pointer"
              >
                <div 
                  className={`w-14 h-14 md:w-16 md:h-16 rounded-full border flex items-center justify-center group-hover:border-primary group-hover:shadow-sm transition-all bg-white ${
                    categoryFilter === cat.key 
                      ? "border-primary bg-green-50/50 shadow-sm" 
                      : "border-outline-variant"
                  }`}
                >
                  <span 
                    className={`material-symbols-outlined text-2xl group-hover:text-primary transition-colors ${
                      categoryFilter === cat.key ? "text-primary font-semibold" : "text-on-surface-variant"
                    }`}
                  >
                    {cat.icon}
                  </span>
                </div>
                <span 
                  className={`text-[10px] md:text-xs font-bold text-center tracking-wider transition-colors ${
                    categoryFilter === cat.key ? "text-primary" : "text-on-surface"
                  }`}
                >
                  {cat.label}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* 3. Product Catalog Grid */}
        <section ref={productsRef} className="scroll-mt-24 space-y-6">
          <div className="flex justify-between items-center pb-2 border-b border-outline-variant/20">
            <h2 className="text-base md:text-lg font-extrabold text-primary flex items-center gap-1.5">
              <span className="material-symbols-outlined">restaurant_menu</span>
              {categoryFilter === "" ? "Tất cả sản phẩm" : `Danh mục: ${categoriesList.find(c => c.key === categoryFilter)?.label}`}
            </h2>
            <span className="text-xs font-bold text-on-surface-variant bg-white border border-outline-variant/30 px-3 py-1 rounded-full shadow-inner">
              Tìm thấy {products.length} sản phẩm
            </span>
          </div>

          {loading ? (
            <LoadingSpinner />
          ) : products.length === 0 ? (
            <div className="bg-white rounded-2xl py-20 text-center text-on-surface-variant border border-outline-variant/30 shadow-sm flex-grow">
              <span className="material-symbols-outlined text-5xl block mb-3 text-slate-300">fastfood</span>
              Không tìm thấy sản phẩm nào phù hợp. Vui lòng chọn danh mục khác!
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
              {products.map((prod) => (
                <div 
                  key={prod.id} 
                  className="bg-white rounded-2xl border border-outline-variant/30 overflow-hidden shadow-sm hover:shadow-md transition-all group flex flex-col h-full focus-within:ring-2 focus-within:ring-primary"
                >
                  {/* Image wrapper */}
                  <div className="relative h-40 md:h-44 w-full bg-slate-100 border-b border-outline-variant/20 overflow-hidden flex-shrink-0">
                    <img 
                      src={prod.imageUrl} 
                      alt={prod.name} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      onError={(e) => {
                        e.target.src = "https://placehold.co/300x200?text=7-Eleven";
                      }}
                    />
                    <span className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-white/90 backdrop-blur-sm text-primary font-bold text-[9px] uppercase shadow-sm">
                      {prod.category}
                    </span>
                  </div>

                  {/* Product Details */}
                  <div className="p-4 flex flex-col flex-grow">
                    <h3 className="font-extrabold text-xs md:text-sm text-on-surface line-clamp-2 leading-snug mb-1 min-h-[36px] md:min-h-[40px]">
                      {prod.name}
                    </h3>
                    <div className="text-[9px] font-mono text-on-surface-variant uppercase tracking-wider mb-2">
                      SKU: {prod.sku}
                    </div>

                    <div className="flex items-end justify-between mt-auto">
                      <div className="flex flex-col">
                        <span className="text-[9px] text-on-surface-variant font-bold">Giá bán</span>
                        <span className="text-sm md:text-base font-black text-primary">
                          {prod.price.toLocaleString("vi-VN")}₫
                        </span>
                      </div>

                      {prod.stockQuantity <= 0 ? (
                        <span className="px-2.5 py-1.5 rounded-lg bg-red-50 text-red-500 font-bold text-[10px]">
                          HẾT HÀNG
                        </span>
                      ) : (
                        <button
                          onClick={(e) => handleAddToCart(e, prod)}
                          className="w-8 h-8 rounded-full bg-primary text-white hover:bg-primary-container transition-colors shadow-sm flex items-center justify-center cursor-pointer group-hover:scale-105 duration-200"
                          title="Thêm vào giỏ hàng"
                        >
                          <span className="material-symbols-outlined text-sm font-bold">add</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
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
