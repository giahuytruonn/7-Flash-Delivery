import React, { useState, useEffect } from "react";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import LoadingSpinner from "../components/LoadingSpinner";
import { useCart } from "../context/CartContext";
import api from "../services/api";

const UserShop = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");

  const { cart, addToCart, removeFromCart, updateQuantity, totalAmount, checkout } = useCart();

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
            // Get error message if cancelled
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

  return (
    <div className="bg-[#f9f9ff] text-[#151c27] min-h-screen relative font-body">
      
      {/* SideNavbar */}
      <Sidebar />

      {/* TopNavbar with Search */}
      <Header 
        title="7-Eleven Việt Nam - Đặt hàng POS" 
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        placeholder="Tìm món ăn, đồ uống..."
      />

      {/* Main Grid: Products on Left, Shopping Cart on Right */}
      <main className="md:ml-[260px] pt-20 p-6 md:p-8 min-h-screen bg-slate-50 flex gap-6">
        
        {/* Left Side: Product Selection */}
        <div className="flex-1 space-y-6 max-w-[calc(100%-380px)]">
          {/* Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-2xl font-extrabold text-primary mb-1">
                Thực đơn Cửa hàng
              </h1>
              <p className="text-sm text-on-surface-variant">
                Lựa chọn sản phẩm tươi ngon của 7-Eleven và thêm vào giỏ hàng
              </p>
            </div>
            
            {/* Quick Category Filters */}
            <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-2 md:pb-0">
              {["", "Bakery", "Beverage", "Snack", "Instant Food", "Dairy", "Combo"].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setCategoryFilter(cat)}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all border whitespace-nowrap ${
                    categoryFilter === cat
                      ? "bg-primary text-on-primary border-primary shadow-sm"
                      : "bg-white text-on-surface-variant border-outline-variant hover:bg-slate-50"
                  }`}
                >
                  {cat === "" ? "Tất cả" : cat}
                </button>
              ))}
            </div>
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
                          className="px-4 py-1.5 rounded-lg bg-primary text-on-primary font-bold text-xs hover:bg-primary-container transition-colors shadow-sm flex items-center gap-1"
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

        {/* Right Side: Persistent Shopping Cart (Floating Panel) */}
        <aside className="w-[360px] bg-white rounded-2xl border border-outline-variant/30 flex flex-col h-[calc(100vh-120px)] shadow-sm fixed right-8 top-20 z-30">
          
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
              <span className="text-xs font-bold text-on-surface-variant">Tổng tiền toán:</span>
              <span className="text-lg font-black text-primary">
                {totalAmount.toLocaleString("vi-VN")}₫
              </span>
            </div>

            {/* Checkout Button */}
            <button
              onClick={handlePlaceOrder}
              disabled={cart.length === 0 || placingOrder}
              className="w-full py-3 rounded-xl bg-primary text-on-primary font-bold text-sm hover:bg-primary-container transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {placingOrder ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
                  <span>Đang xử lý đơn kho...</span>
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
                className="mt-6 w-full py-2.5 rounded-lg bg-primary text-on-primary font-bold text-sm hover:bg-primary-container transition-all"
              >
                Đồng ý
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default UserShop;
