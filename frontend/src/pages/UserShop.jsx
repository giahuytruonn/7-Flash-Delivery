import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import LoadingSpinner from "../components/LoadingSpinner";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";

const UserShop = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { cart, addToCart, removeFromCart, updateQuantity, totalAmount, checkout } = useCart();

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");

  // Order Placement & Polling State
  const [note, setNote] = useState("");
  const [placingOrder, setPlacingOrder] = useState(false);
  const [pollOrderId, setPollOrderId] = useState(null);
  const [pollStatus, setPollStatus] = useState("");
  const [pollError, setPollError] = useState("");
  const [showResultModal, setShowResultModal] = useState(false);

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

  // Polling logic for async stock deduction
  useEffect(() => {
    let intervalId;

    if (pollOrderId) {
      intervalId = setInterval(async () => {
        try {
          const response = await api.get(`/orders/${pollOrderId}/status`);
          const status = response.data.data.status;
          
          setPollStatus(status);

          if (status === "CONFIRMED") {
            clearInterval(intervalId);
            setPlacingOrder(false);
            setPollOrderId(null);
            setShowResultModal(true);
          } else if (status === "CANCELLED") {
            clearInterval(intervalId);
            setPlacingOrder(false);
            setPollOrderId(null);
            setShowResultModal(true);
            setPollError("Đơn hàng bị hủy do không đủ số lượng tồn kho trong hệ thống!");
          }
        } catch (error) {
          console.error("Lỗi khi poll trạng thái đơn hàng:", error);
          clearInterval(intervalId);
          setPlacingOrder(false);
          setPollOrderId(null);
        }
      }, 1500); // Poll every 1.5 seconds
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [pollOrderId]);

  // Order trigger
  const handlePlaceOrder = async () => {
    if (cart.length === 0) return;

    setPlacingOrder(true);
    setPollError("");
    setPollStatus("PENDING");
    
    const result = await checkout(note);

    if (result.success) {
      // Start polling the order ID
      setPollOrderId(result.orderId);
      setNote("");
    } else {
      setPlacingOrder(false);
      alert(result.message);
    }
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
      
      {/* TopNavBar Component - Match user-page.html layout */}
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

          {/* Navigation Links (Desktop) - Connects directly to Categories filter! */}
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
          <div className="flex items-center gap-4 text-primary font-bold">
            {/* Show Cart items badge indicator */}
            <div className="p-2 hover:bg-slate-100 rounded-full transition-colors relative cursor-pointer">
              <span className="material-symbols-outlined text-[24px]">shopping_cart</span>
              {cart.length > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-error text-white text-[9px] font-bold rounded-full flex items-center justify-center animate-bounce">
                  {cart.reduce((sum, item) => sum + item.quantity, 0)}
                </span>
              )}
            </div>

            {/* Location indicator */}
            <div className="p-2 hover:bg-slate-100 rounded-full transition-colors hidden sm:block cursor-pointer" title="Hồ Chí Minh, VN">
              <span className="material-symbols-outlined text-[24px]">location_on</span>
            </div>

            {/* Conditional Authentication Widget - Login is Optional */}
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

        {/* Secondary row for Search Bar */}
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

      {/* Main Grid: Products on Left, Shopping Cart on Right (No Sidebar margin, Center Aligned!) */}
      <main className="w-full max-w-[1440px] mx-auto px-4 md:px-8 py-6 flex gap-6 flex-col lg:flex-row bg-slate-50 flex-grow min-h-[calc(100vh-200px)]">
        
        {/* Left Side: Product Selection */}
        <div className="flex-1 space-y-6">
          {/* Heading */}
          <div>
            <h1 className="text-xl md:text-2xl font-black text-primary flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-2xl">restaurant_menu</span>
              Thực đơn Cửa hàng
            </h1>
            <p className="text-xs text-on-surface-variant mt-1">
              Thưởng thức món ăn tươi ngon chuẩn vị 7-Eleven. Đặt hàng POS nhanh không cần tài khoản!
            </p>
          </div>

          {/* Product Grid */}
          {loading ? (
            <LoadingSpinner />
          ) : products.length === 0 ? (
            <div className="bg-white rounded-2xl py-20 text-center text-on-surface-variant border border-outline-variant/30 shadow-sm">
              <span className="material-symbols-outlined text-5xl block mb-3 text-slate-300">fastfood</span>
              Không tìm thấy sản phẩm nào phù hợp. Vui lòng chọn danh mục khác!
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
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
                          onClick={() => addToCart(prod)}
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
        </div>

        {/* Right Side: Shopping Cart (Sticky Flex Column) */}
        <aside className="w-full lg:w-[380px] bg-white rounded-2xl border border-outline-variant/30 flex flex-col h-[calc(100vh-160px)] lg:sticky lg:top-24 shadow-sm z-30">
          
          {/* Cart Header */}
          <div className="p-4 border-b border-outline-variant/20 flex items-center justify-between bg-slate-50 rounded-t-2xl">
            <h3 className="font-bold text-sm text-on-surface flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">shopping_basket</span>
              Giỏ hàng của tôi
            </h3>
            <span className="px-2 py-0.5 rounded bg-primary-container/20 text-primary-container text-xs font-bold">
              {cart.reduce((sum, item) => sum + item.quantity, 0)} món
            </span>
          </div>

          {/* Cart Items List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center text-on-surface-variant/60 py-12">
                <span className="material-symbols-outlined text-5xl block mb-2 text-slate-200">shopping_cart_checkout</span>
                <p className="text-xs font-semibold">Giỏ hàng đang trống.</p>
                <p className="text-[10px] mt-1 text-slate-400">Chọn sản phẩm bên trái để mua</p>
              </div>
            ) : (
              cart.map((item) => (
                <div key={item.id} className="flex gap-3 border-b border-outline-variant/10 pb-3">
                  {/* Thumbnail */}
                  <div className="w-12 h-12 rounded-lg border border-outline-variant/20 bg-slate-100 overflow-hidden flex-shrink-0">
                    <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                  </div>

                  {/* Quantity & price controls */}
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-xs text-on-surface truncate" title={item.name}>
                      {item.name}
                    </h4>
                    <div className="text-xs font-semibold text-primary mt-0.5">
                      {item.price.toLocaleString("vi-VN")}₫
                    </div>

                    <div className="flex items-center justify-between mt-2">
                      {/* Quantity Increment/Decrement */}
                      <div className="flex items-center border border-outline-variant/30 rounded bg-slate-50">
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="w-6 h-6 flex items-center justify-center text-on-surface-variant hover:bg-slate-200 transition-colors"
                        >
                          -
                        </button>
                        <span className="w-8 text-center text-xs font-bold text-on-surface">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="w-6 h-6 flex items-center justify-center text-on-surface-variant hover:bg-slate-200 transition-colors"
                        >
                          +
                        </button>
                      </div>

                      <button
                        onClick={() => removeFromCart(item.id)}
                        className="text-xs font-bold text-red-500 hover:underline"
                      >
                        Xóa
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Cart Footer & Checkout */}
          <div className="p-4 border-t border-outline-variant/20 bg-slate-50 rounded-b-2xl space-y-4">
            
            {/* Note Input */}
            {cart.length > 0 && (
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-on-surface-variant mb-1.5">
                  Ghi chú giao hàng
                </label>
                <input
                  type="text"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Ghi chú (Ví dụ: thìa đũa, đá riêng...)"
                  className="w-full px-3 py-1.5 rounded-lg border border-outline-variant/40 bg-white outline-none text-xs focus:border-primary transition-all"
                />
              </div>
            )}

            {/* Total calculation */}
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-on-surface-variant">Tổng thanh toán:</span>
              <span className="text-lg font-black text-primary">
                {totalAmount.toLocaleString("vi-VN")}₫
              </span>
            </div>

            {/* Checkout Button */}
            <button
              onClick={handlePlaceOrder}
              disabled={cart.length === 0 || placingOrder}
              className="w-full py-3 rounded-xl bg-primary text-on-primary font-bold text-sm hover:bg-primary-container transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
            >
              {placingOrder ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
                  <span>Đang xử lý tồn kho...</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-lg">local_shipping</span>
                  <span>Xác nhận Đặt hàng</span>
                </>
              )}
            </button>
          </div>
        </aside>

        {/* Polling Outcome Result Modal */}
        {showResultModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#151c27]/40 backdrop-blur-sm">
            <div className="bg-white rounded-2xl p-6 max-w-sm w-full text-center shadow-2xl border border-outline-variant/20 animate-fade-in">
              
              {pollError ? (
                <>
                  <span className="material-symbols-outlined text-6xl text-error bg-error-container/20 p-3 rounded-full mb-4 inline-block">
                    error
                  </span>
                  <h3 className="text-lg font-bold text-on-surface mb-2">Đặt hàng thất bại!</h3>
                  <p className="text-sm text-on-surface-variant leading-relaxed">
                    {pollError}
                  </p>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-6xl text-primary bg-green-50 p-3 rounded-full mb-4 inline-block">
                    check_circle
                  </span>
                  <h3 className="text-lg font-bold text-on-surface mb-2">Đặt hàng thành công!</h3>
                  <p className="text-sm text-on-surface-variant leading-relaxed">
                    Đơn hàng của bạn đã được trừ kho thành công và chuyển sang trạng thái **XÁC NHẬN** (CONFIRMED).
                  </p>
                </>
              )}

              <button
                onClick={() => {
                  setShowResultModal(false);
                  setPollError("");
                }}
                className="mt-6 w-full py-2.5 rounded-lg bg-primary text-on-primary font-bold text-sm hover:bg-primary-container transition-all cursor-pointer"
              >
                Đồng ý
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Footer Component - Match user-page.html */}
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
