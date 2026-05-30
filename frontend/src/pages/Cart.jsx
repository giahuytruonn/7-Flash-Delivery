import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import LoadingSpinner from "../components/LoadingSpinner";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";

const Cart = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { cart, removeFromCart, updateQuantity, totalAmount, checkout, clearCart } = useCart();

  // Order Placement & Polling State
  const [note, setNote] = useState("");
  const [placingOrder, setPlacingOrder] = useState(false);
  const [pollOrderId, setPollOrderId] = useState(null);
  const [pollStatus, setPollStatus] = useState("");
  const [pollError, setPollError] = useState("");
  const [showResultModal, setShowResultModal] = useState(false);

  // PayOS State variables
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [checkoutUrl, setCheckoutUrl] = useState("");
  const [qrCode, setQrCode] = useState("");
  const [loadingPaymentLink, setLoadingPaymentLink] = useState(false);

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
            setShowPaymentModal(false);
            clearCart();
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
      const orderId = result.orderId;
      setPollOrderId(orderId);
      setNote("");
      
      // Khởi tạo liên kết thanh toán PayOS
      try {
        setLoadingPaymentLink(true);
        setShowPaymentModal(true);
        const payResponse = await api.post(`/payments/create/${orderId}`);
        const payData = payResponse.data.data;
        setCheckoutUrl(payData.checkoutUrl);
        setQrCode(payData.qrCode);
        setLoadingPaymentLink(false);
      } catch (err) {
        console.error("Lỗi khi tạo liên kết thanh toán PayOS:", err);
        setLoadingPaymentLink(false);
        // Fallback nếu chưa cấu hình PayOS keys trong .env
        setCheckoutUrl("");
      }
    } else {
      setPlacingOrder(false);
      alert(result.message);
    }
  };

  // Xác nhận thanh toán nhanh (Demo - Bỏ qua QR)
  const handleConfirmDemoSuccess = async () => {
    if (!pollOrderId) return;
    try {
      setPlacingOrder(true);
      await api.post(`/payments/confirm-success/${pollOrderId}`);
      // Trình Polling tự động kiểm tra trạng thái và mở modal Thành công sau 1.5s
      setShowPaymentModal(false);
      clearCart(); // Làm sạch giỏ hàng khi thanh toán xong
    } catch (err) {
      console.error("Lỗi khi xác nhận thanh toán demo:", err);
      alert("Xác nhận thanh toán demo thất bại.");
      setPlacingOrder(false);
    }
  };

  const handleClosePaymentModal = () => {
    setShowPaymentModal(false);
    setPollOrderId(null); // Dừng Polling đơn hàng này
    setPlacingOrder(false);
  };

  const handleLogout = () => {
    logout();
    navigate("/shop");
  };

  return (
    <div className="bg-[#f9f9ff] text-[#151c27] min-h-screen relative font-body flex flex-col">
      
      {/* TopNavBar Component */}
      <nav className="sticky top-0 z-50 flex flex-col w-full bg-white px-4 md:px-8 py-2 border-b border-outline-variant shadow-sm">
        <div className="flex items-center justify-between w-full max-w-[1440px] mx-auto h-16">
          {/* Brand Logo */}
          <div className="flex items-center gap-4">
            <span 
              onClick={() => navigate("/shop")}
              className="text-2xl font-black text-primary tracking-tight cursor-pointer"
            >
              7-Eleven Vietnam
            </span>
          </div>

          {/* Navigation link back to Shop */}
          <div className="hidden md:flex items-center gap-6">
            <button
              onClick={() => navigate("/shop")}
              className="text-sm font-bold text-on-surface-variant hover:text-primary flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-lg">storefront</span>
              Quay lại Cửa hàng
            </button>
          </div>

          {/* Trailing Actions */}
          <div className="flex items-center gap-4 text-primary font-bold">
            {/* Cart Icon in Cart Page acts as navigation too */}
            <div 
              onClick={() => navigate("/cart")}
              className="p-2 bg-slate-100 rounded-full transition-colors relative cursor-pointer"
            >
              <span className="material-symbols-outlined text-[24px]">shopping_cart</span>
              {cart.length > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-error text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                  {cart.reduce((sum, item) => sum + item.quantity, 0)}
                </span>
              )}
            </div>

            {/* Admin Management Shortcut (Hidden for normal CUSTOMER accounts, visible for guests and admins) */}
            {(!user || user.role === "ADMIN") && (
              <button
                onClick={() => navigate("/admin/products")}
                className="h-9 px-4 rounded-full bg-slate-100 text-on-surface hover:bg-slate-200 transition-all text-xs font-bold flex items-center gap-1.5 shadow-sm border border-outline-variant/20 cursor-pointer"
                title="Truy cập cổng quản lý Admin"
              >
                <span className="material-symbols-outlined text-sm">dashboard</span>
                Quản lý
              </button>
            )}

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
                className="h-9 px-4 rounded-full border border-primary text-primary hover:bg-primary/5 transition-all text-xs font-bold flex items-center gap-1.5 shadow-sm cursor-pointer"
              >
                <span className="material-symbols-outlined text-sm">person</span>
                Đăng nhập
              </button>
            )}
          </div>
        </div>
      </nav>

      {/* Main Container - Full Width Center Aligned */}
      <main className="w-full max-w-[1440px] mx-auto px-4 md:px-8 py-8 bg-slate-50 flex-grow">
        
        {/* Title */}
        <div className="mb-6 flex items-center gap-3">
          <button 
            onClick={() => navigate("/shop")}
            className="p-2 bg-white rounded-xl border border-outline-variant hover:bg-slate-100 transition-all flex items-center justify-center shadow-sm"
            title="Quay lại mua sắm"
          >
            <span className="material-symbols-outlined text-primary text-xl">arrow_back</span>
          </button>
          <div>
            <h1 className="text-xl md:text-2xl font-black text-primary flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-2xl">shopping_cart</span>
              Giỏ hàng của tôi
            </h1>
            <p className="text-xs text-on-surface-variant mt-0.5">
              Kiểm tra các mặt hàng đã chọn và tiến hành đặt hàng thanh toán POS
            </p>
          </div>
        </div>

        {cart.length === 0 ? (
          /* Empty Cart State */
          <div className="bg-white rounded-2xl border border-outline-variant/30 py-20 px-6 text-center shadow-sm max-w-xl mx-auto space-y-6">
            <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-300">
              <span className="material-symbols-outlined text-5xl">shopping_cart_checkout</span>
            </div>
            <div className="space-y-1">
              <h3 className="font-extrabold text-lg text-on-surface">Giỏ hàng của bạn đang trống!</h3>
              <p className="text-xs text-on-surface-variant max-w-sm mx-auto leading-relaxed">
                Vui lòng quay trở lại màn hình thực đơn để chọn các món ăn và đồ uống tươi ngon của 7-Eleven.
              </p>
            </div>
            <button
              onClick={() => navigate("/shop")}
              className="px-6 py-2.5 bg-primary text-on-primary font-bold rounded-xl hover:bg-primary-container transition-all shadow-md text-sm cursor-pointer"
            >
              Tiếp tục mua sắm
            </button>
          </div>
        ) : (
          /* Cart Content Layout */
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Left Side: Cart Items List */}
            <div className="flex-1 space-y-4">
              <div className="bg-white rounded-2xl border border-outline-variant/30 overflow-hidden shadow-sm">
                <div className="p-4 bg-slate-50 border-b border-outline-variant/20 font-bold text-xs uppercase text-on-surface-variant tracking-wider">
                  Mặt hàng đã chọn ({cart.reduce((sum, item) => sum + item.quantity, 0)} sản phẩm)
                </div>
                
                <div className="divide-y divide-slate-100">
                  {cart.map((item) => (
                    <div key={item.id} className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                      {/* Product Thumbnail & Details */}
                      <div className="flex items-center gap-4 flex-1">
                        <div className="w-16 h-16 rounded-xl border border-outline-variant/20 overflow-hidden flex-shrink-0 bg-slate-50">
                          <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                        </div>
                        <div>
                          <h4 className="font-extrabold text-sm text-on-surface line-clamp-1">{item.name}</h4>
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-[10px] text-on-surface-variant">
                            <span className="bg-slate-100 px-1.5 py-0.5 rounded font-bold uppercase">{item.category}</span>
                            <span className="font-mono">SKU: {item.sku}</span>
                          </div>
                        </div>
                      </div>

                      {/* Quantity, Price and Subtotal Controls */}
                      <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto">
                        <div className="flex flex-col text-left sm:text-right">
                          <span className="text-[10px] text-on-surface-variant font-bold">Đơn giá</span>
                          <span className="text-xs font-semibold text-on-surface">
                            {item.price.toLocaleString("vi-VN")}₫
                          </span>
                        </div>

                        {/* Increment / Decrement */}
                        <div className="flex items-center border border-outline-variant/30 rounded-xl bg-slate-50 overflow-hidden h-9">
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            className="w-8 h-full flex items-center justify-center text-on-surface-variant hover:bg-slate-200 transition-colors font-bold text-lg"
                          >
                            -
                          </button>
                          <span className="w-10 text-center text-xs font-black text-primary">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            className="w-8 h-full flex items-center justify-center text-on-surface-variant hover:bg-slate-200 transition-colors font-bold text-lg"
                          >
                            +
                          </button>
                        </div>

                        <div className="flex flex-col text-right min-w-[80px]">
                          <span className="text-[10px] text-on-surface-variant font-bold">Thành tiền</span>
                          <span className="text-sm font-extrabold text-primary">
                            {(item.price * item.quantity).toLocaleString("vi-VN")}₫
                          </span>
                        </div>

                        <button
                          onClick={() => removeFromCart(item.id)}
                          className="p-1.5 rounded-full hover:bg-red-50 text-red-500 transition-colors cursor-pointer"
                          title="Xóa khỏi giỏ hàng"
                        >
                          <span className="material-symbols-outlined text-lg">delete</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="p-4 bg-slate-50 border-t border-outline-variant/20 flex justify-end">
                  <button 
                    onClick={clearCart}
                    className="text-xs font-bold text-red-500 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-sm">remove_shopping_cart</span>
                    Xóa toàn bộ giỏ hàng
                  </button>
                </div>
              </div>
            </div>

            {/* Right Side: Shipping Notes & Grand Total checkout */}
            <div className="w-full lg:w-[400px]">
              <div className="bg-white rounded-2xl border border-outline-variant/30 p-5 shadow-sm space-y-6 lg:sticky lg:top-24">
                <h3 className="font-extrabold text-sm text-on-surface pb-3 border-b border-slate-100 flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary">receipt_long</span>
                  Thông tin đơn hàng
                </h3>

                {/* Delivery Note */}
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">
                    Ghi chú giao hàng / chế biến
                  </label>
                  <textarea
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="Ghi chú (Ví dụ: thìa đũa, đá riêng, bánh mì sấy nóng...)"
                    className="w-full px-3 py-2 rounded-xl border border-outline-variant bg-white outline-none text-xs focus:border-primary transition-all resize-none"
                    rows="3"
                  />
                </div>

                {/* Pricing Summary */}
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between text-on-surface-variant font-medium">
                    <span>Tạm tính ({cart.reduce((sum, item) => sum + item.quantity, 0)} món):</span>
                    <span>{totalAmount.toLocaleString("vi-VN")}₫</span>
                  </div>
                  <div className="flex justify-between text-on-surface-variant font-medium">
                    <span>Phí dịch vụ POS:</span>
                    <span className="text-green-600 font-bold">Miễn phí</span>
                  </div>
                  <div className="pt-3 border-t border-dashed border-slate-200 flex justify-between items-center">
                    <span className="text-sm font-black text-on-surface">Tổng cộng thanh toán:</span>
                    <span className="text-xl font-black text-primary">
                      {totalAmount.toLocaleString("vi-VN")}₫
                    </span>
                  </div>
                </div>

                {/* Place Order Trigger Button */}
                <button
                  onClick={handlePlaceOrder}
                  disabled={placingOrder}
                  className="w-full py-3 rounded-xl bg-primary text-on-primary font-bold text-sm hover:bg-primary-container transition-all shadow-md disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
                >
                  {placingOrder ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
                      <span>Đang xử lý trừ tồn kho...</span>
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-lg">local_shipping</span>
                      <span>Xác nhận Đặt hàng</span>
                    </>
                  )}
                </button>

                <div className="text-[10px] text-on-surface-variant text-center font-semibold bg-slate-50 p-3 rounded-xl border border-outline-variant/20 flex items-center gap-1.5 justify-center">
                  <span className="material-symbols-outlined text-green-600 text-sm">verified</span>
                  <span>Đơn hàng được tiếp nhận và xử lý trừ kho POS tức thì.</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

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
                if (!pollError) {
                  navigate("/shop");
                }
              }}
              className="mt-6 w-full py-2.5 rounded-lg bg-primary text-on-primary font-bold text-sm hover:bg-primary-container transition-all cursor-pointer"
            >
              Đồng ý
            </button>
          </div>
        </div>
      )}

      {/* PayOS Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#151c27]/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-lg w-full flex flex-col shadow-2xl border border-outline-variant/20 overflow-hidden animate-fade-in max-h-[90vh]">
            
            {/* Modal Header */}
            <div className="px-6 py-4 bg-slate-50 border-b border-outline-variant/20 flex items-center justify-between">
              <h3 className="font-extrabold text-sm text-primary flex items-center gap-2">
                <span className="material-symbols-outlined text-xl text-primary animate-pulse">credit_card</span>
                Cổng thanh toán POS PayOS (Demo)
              </h3>
              <button 
                onClick={handleClosePaymentModal}
                className="p-1.5 rounded-full hover:bg-slate-200 text-on-surface-variant transition-colors"
                title="Đóng"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>
            
            {/* Modal Body */}
            <div className="flex-grow p-6 overflow-y-auto space-y-6 flex flex-col items-center">
              
              {loadingPaymentLink ? (
                <div className="py-12 flex flex-col items-center justify-center space-y-4">
                  <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary"></div>
                  <p className="text-xs font-bold text-primary animate-pulse">Đang liên kết với cổng thanh toán PayOS...</p>
                </div>
              ) : checkoutUrl ? (
                <div className="w-full space-y-4">
                  <div className="text-[11px] text-on-surface-variant font-semibold text-center bg-slate-50 p-2.5 rounded-lg border border-outline-variant/30">
                    Để thực hiện thanh toán, vui lòng quét mã QR trên cổng PayOS bên dưới.
                  </div>
                  {/* Embedded Iframe */}
                  <div className="w-full h-[360px] rounded-xl border border-outline-variant/40 bg-slate-100 overflow-hidden shadow-inner relative">
                    <iframe 
                      src={checkoutUrl} 
                      className="w-full h-full border-0" 
                      title="Cổng thanh toán PayOS"
                    ></iframe>
                  </div>
                </div>
              ) : (
                <div className="py-6 text-center space-y-3">
                  <span className="material-symbols-outlined text-5xl text-orange-500 bg-orange-50 p-3 rounded-full mb-2 inline-block">
                    info
                  </span>
                  <div className="space-y-1">
                    <h4 className="font-extrabold text-sm text-on-surface">Cấu hình PayOS chưa kích hoạt</h4>
                    <p className="text-xs text-on-surface-variant leading-relaxed max-w-sm">
                      Do bạn chưa điền API keys cho PayOS tại `.env`, liên kết thanh toán QR không thể khởi tạo.
                    </p>
                  </div>
                  <div className="text-xs font-semibold text-green-700 bg-green-50 p-2.5 rounded-lg border border-green-200">
                    Đừng lo lắng! Bạn vẫn có thể sử dụng nút "Thanh toán ngay (Demo)" bên dưới để hoàn tất đơn hàng tức thì!
                  </div>
                </div>
              )}
              
              {/* Demo Fast Checkout Panel */}
              <div className="w-full border-t border-dashed border-slate-200 pt-4 space-y-3 text-center">
                <div className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Khử tác vụ test nhanh (Recruiter Mode)</div>
                <button
                  onClick={handleConfirmDemoSuccess}
                  className="w-full py-3 rounded-xl bg-[#F58220] hover:bg-[#E07116] text-white font-extrabold text-sm transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span className="material-symbols-outlined">payments</span>
                  <span>Thanh toán ngay (Demo - Không quét mã)</span>
                </button>
                <p className="text-[9px] text-on-surface-variant font-semibold">
                  * Nhấp nút màu cam để lập tức duyệt đơn hàng <b>CONFIRMED</b> và đồng bộ trừ kho mà không cần thanh toán thực!
                </p>
              </div>

            </div>

          </div>
        </div>
      )}

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

export default Cart;
