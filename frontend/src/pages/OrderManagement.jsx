import React, { useState, useEffect } from "react";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import LoadingSpinner from "../components/LoadingSpinner";
import api from "../services/api";

const OrderManagement = () => {
  const [orders, setOrders] = useState([]);
  const [totalElements, setTotalElements] = useState(0);
  const [page, setPage] = useState(0);
  const [size] = useState(10);
  const [totalPages, setTotalPages] = useState(0);
  
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(true);

  // Expanded order ID tracker
  const [expandedOrderId, setExpandedOrderId] = useState(null);

  // Aggregate Stats
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    confirmed: 0,
    cancelled: 0,
  });

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await api.get("/orders", {
        params: {
          page,
          size,
          status: statusFilter || undefined,
        },
      });

      const { content, totalElements: totalItems, totalPages: pages } = response.data.data;
      setOrders(content);
      setTotalElements(totalItems);
      setTotalPages(pages);
      setLoading(false);
    } catch (error) {
      console.error("Lỗi khi tải danh sách đơn hàng:", error);
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      // Fetch a larger page size to calculate statistics dynamically across recent orders
      const response = await api.get("/orders", { params: { page: 0, size: 500 } });
      const allOrders = response.data.data.content;
      
      const newStats = {
        total: allOrders.length,
        pending: allOrders.filter(o => o.status === "PENDING").length,
        confirmed: allOrders.filter(o => o.status === "CONFIRMED").length,
        cancelled: allOrders.filter(o => o.status === "CANCELLED").length,
      };
      setStats(newStats);
    } catch (e) {
      console.error("Lỗi khi tải thống kê đơn hàng:", e);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [page, statusFilter]);

  useEffect(() => {
    fetchStats();
  }, [orders]);

  const toggleExpandOrder = (orderId) => {
    if (expandedOrderId === orderId) {
      setExpandedOrderId(null);
    } else {
      setExpandedOrderId(orderId);
    }
  };

  const handleUpdateStatus = async (orderId, newStatus) => {
    try {
      await api.put(`/orders/${orderId}/status`, null, {
        params: { status: newStatus }
      });
      fetchOrders();
    } catch (error) {
      console.error("Lỗi khi cập nhật trạng thái đơn hàng:", error);
      alert("Cập nhật trạng thái thất bại: " + (error.response?.data?.message || error.message));
    }
  };

  // Filter orders based on the search query (matching order ID)
  const filteredOrders = orders.filter((order) => {
    if (!searchQuery) return true;
    return order.id.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case "PENDING":
        return (
          <span className="inline-flex px-2.5 py-0.5 rounded-full bg-orange-500/10 text-orange-700 text-[10px] font-bold uppercase tracking-wider items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse"></span> Chờ xử lý
          </span>
        );
      case "CONFIRMED":
        return (
          <span className="inline-flex px-2.5 py-0.5 rounded-full bg-green-500/10 text-green-700 text-[10px] font-bold uppercase tracking-wider items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-green-600"></span> Thành công
          </span>
        );
      case "CANCELLED":
        return (
          <span className="inline-flex px-2.5 py-0.5 rounded-full bg-red-500/10 text-red-700 text-[10px] font-bold uppercase tracking-wider items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-red-600"></span> Đã hủy
          </span>
        );
      default:
        return (
          <span className="inline-flex px-2.5 py-0.5 rounded-full bg-slate-500/10 text-slate-700 text-[10px] font-bold uppercase tracking-wider items-center gap-1">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="bg-[#f9f9ff] text-[#151c27] min-h-screen relative font-body">
      {/* SideNavbar */}
      <Sidebar />

      {/* TopNavbar */}
      <Header 
        title="Hệ thống Quản lý Bán lẻ 7-11" 
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        placeholder="Tìm theo Mã đơn hàng (UUID)..."
      />

      {/* Main Content Area */}
      <main className="md:ml-[260px] px-6 pb-6 pt-20 md:px-8 md:pb-8 md:pt-24 min-h-screen bg-slate-50">
        <div className="max-w-[1440px] mx-auto space-y-6">
          
          {/* Header */}
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-primary mb-1">
              Quản lý Đơn hàng
            </h1>
            <p className="text-sm text-on-surface-variant">
              Theo dõi trạng thái giao dịch POS, tự động đồng bộ kho hàng theo thời gian thực
            </p>
          </div>

          {/* Bento Stats Row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="p-4 rounded-xl border border-outline-variant/40 bg-white flex items-center gap-4 shadow-sm">
              <div className="w-12 h-12 rounded bg-slate-50 flex items-center justify-center text-on-surface-variant flex-shrink-0">
                <span className="material-symbols-outlined text-[28px]">calendar_today</span>
              </div>
              <div>
                <div className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Tổng đơn gần đây</div>
                <div className="text-2xl font-bold text-on-surface">{stats.total}</div>
              </div>
            </div>

            <div className="p-4 rounded-xl border border-outline-variant/40 bg-white flex items-center gap-4 shadow-sm">
              <div className="w-12 h-12 rounded bg-orange-50 flex items-center justify-center text-orange-600 flex-shrink-0">
                <span className="material-symbols-outlined text-[28px]">pending_actions</span>
              </div>
              <div>
                <div className="text-[10px] font-bold text-orange-600 uppercase tracking-wider">Chờ xử lý</div>
                <div className="text-2xl font-bold text-orange-600">{stats.pending}</div>
              </div>
            </div>

            <div className="p-4 rounded-xl border border-outline-variant/40 bg-white flex items-center gap-4 shadow-sm">
              <div className="w-12 h-12 rounded bg-green-50 flex items-center justify-center text-primary flex-shrink-0">
                <span className="material-symbols-outlined text-[28px]">check_circle</span>
              </div>
              <div>
                <div className="text-[10px] font-bold text-primary uppercase tracking-wider font-semibold">Thành công</div>
                <div className="text-2xl font-bold text-primary">{stats.confirmed}</div>
              </div>
            </div>

            <div className="p-4 rounded-xl border border-outline-variant/40 bg-white flex items-center gap-4 shadow-sm">
              <div className="w-12 h-12 rounded bg-red-50 flex items-center justify-center text-error flex-shrink-0">
                <span className="material-symbols-outlined text-[28px]">cancel</span>
              </div>
              <div>
                <div className="text-[10px] font-bold text-error uppercase tracking-wider">Đã hủy</div>
                <div className="text-2xl font-bold text-error">{stats.cancelled}</div>
              </div>
            </div>
          </div>

          {/* Filters Toolbar */}
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-4 rounded-xl border border-outline-variant/40 shadow-sm">
            <div className="flex items-center gap-3 w-full md:w-auto">
              <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wider hidden md:inline">Bộ lọc:</span>
              <select 
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="h-10 px-3 rounded-lg border border-outline-variant bg-white focus:border-primary outline-none text-sm text-on-surface-variant w-full md:w-48"
              >
                <option value="">Tất cả trạng thái</option>
                <option value="PENDING">Chờ xử lý (PENDING)</option>
                <option value="CONFIRMED">Thành công (CONFIRMED)</option>
                <option value="CANCELLED">Đã hủy (CANCELLED)</option>
              </select>
            </div>
            
            <div className="text-xs font-bold text-on-surface-variant bg-slate-50 border border-outline-variant/40 px-3 py-2 rounded-lg flex items-center gap-1">
              <span className="material-symbols-outlined text-sm">sync</span>
              <span>Đồng bộ kho hàng tự động</span>
            </div>
          </div>

          {/* Main Orders Table */}
          <div className="border border-outline-variant/40 rounded-xl bg-white overflow-hidden shadow-sm">
            {loading ? (
              <LoadingSpinner />
            ) : filteredOrders.length === 0 ? (
              <div className="py-16 text-center text-on-surface-variant font-medium">
                <span className="material-symbols-outlined text-4xl block mb-2">sentiment_dissatisfied</span>
                Không tìm thấy đơn hàng nào phù hợp
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse min-w-[900px]">
                    <thead>
                      <tr className="bg-slate-50/70 border-b border-outline-variant/40">
                        <th className="p-4 font-bold text-xs uppercase tracking-wider text-on-surface-variant">Mã Đơn hàng</th>
                        <th className="p-4 font-bold text-xs uppercase tracking-wider text-on-surface-variant">Thời gian đặt</th>
                        <th className="p-4 font-bold text-xs uppercase tracking-wider text-on-surface-variant">Số sản phẩm</th>
                        <th className="p-4 font-bold text-xs uppercase tracking-wider text-on-surface-variant">Khách hàng</th>
                        <th className="p-4 font-bold text-xs uppercase tracking-wider text-on-surface-variant text-right">Tổng tiền</th>
                        <th className="p-4 font-bold text-xs uppercase tracking-wider text-on-surface-variant text-center">Trạng thái</th>
                        <th className="p-4 pr-6 font-bold text-xs uppercase tracking-wider text-on-surface-variant text-center w-20">Chi tiết</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-outline-variant/20">
                      {filteredOrders.map((order) => {
                        const isExpanded = expandedOrderId === order.id;
                        const formattedTime = new Date(order.createdAt).toLocaleString("vi-VN", {
                          hour: "2-digit",
                          minute: "2-digit",
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric"
                        });
                        const itemsCount = order.items?.reduce((sum, item) => sum + item.quantity, 0) || 0;

                        return (
                          <React.Fragment key={order.id}>
                            {/* Standard Row */}
                            <tr 
                              className={`hover:bg-slate-50/40 transition-colors ${
                                isExpanded ? "bg-blue-50/30" : ""
                              }`}
                            >
                              <td className="p-4 font-mono text-xs font-bold text-primary max-w-[120px] truncate" title={order.id}>
                                <span className="bg-primary/5 px-2 py-1 rounded border border-primary/10">
                                  {order.id.slice(0, 8)}...
                                </span>
                              </td>
                              <td className="p-4 text-xs font-semibold text-on-surface-variant">{formattedTime}</td>
                              <td className="p-4 text-xs font-bold text-on-surface">{itemsCount} món</td>
                              <td className="p-4 text-xs font-medium text-on-surface-variant">
                                {order.userId ? `User / POS` : `Khách vãng lai`}
                              </td>
                              <td className="p-4 font-bold text-sm text-primary text-right">
                                {order.totalAmount.toLocaleString("vi-VN")}₫
                              </td>
                              <td className="p-4 text-center">{getStatusBadge(order.status)}</td>
                              <td className="p-4 pr-6 text-center">
                                <button 
                                  onClick={() => toggleExpandOrder(order.id)}
                                  className={`p-1.5 rounded-full text-on-surface-variant hover:bg-slate-100 transition-all ${
                                    isExpanded ? "text-primary rotate-180 bg-slate-100" : ""
                                  }`}
                                  title="Xem chi tiết đơn hàng"
                                >
                                  <span className="material-symbols-outlined text-lg">
                                    {isExpanded ? "expand_less" : "visibility"}
                                  </span>
                                </button>
                              </td>
                            </tr>

                            {/* Expanded Detail Box */}
                            {isExpanded && (
                              <tr className="bg-slate-50/40">
                                <td colSpan="7" className="p-4 bg-slate-50 border-t border-b border-outline-variant/30">
                                  <div className="bg-white rounded-xl border border-outline-variant/30 p-5 shadow-sm space-y-4 max-w-[1200px] mx-auto animate-fade-in">
                                    
                                    {/* Order Details Header */}
                                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-3 border-b border-outline-variant/20 gap-3">
                                      <div>
                                        <h3 className="font-bold text-sm text-on-surface flex items-center gap-1.5">
                                          <span className="material-symbols-outlined text-primary text-lg">receipt_long</span>
                                          Chi tiết đơn hàng: <span className="font-mono text-primary text-xs font-bold">{order.id}</span>
                                        </h3>
                                        <div className="text-[10px] text-on-surface-variant font-semibold mt-1">
                                          Kênh POS / Đặt hàng trực tuyến
                                        </div>
                                      </div>
                                      
                                      <div className="flex flex-wrap items-center gap-4">
                                        {/* Interactive Order Status Dropdown */}
                                        <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-lg border border-outline-variant/40">
                                          <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Trạng thái:</span>
                                          <select
                                            value={order.status}
                                            onChange={(e) => handleUpdateStatus(order.id, e.target.value)}
                                            className="h-8 px-2 rounded border border-outline-variant bg-white focus:border-primary outline-none text-xs font-bold text-on-surface cursor-pointer"
                                          >
                                            <option value="PENDING">Chờ xử lý (PENDING)</option>
                                            <option value="CONFIRMED">Thành công (CONFIRMED)</option>
                                            <option value="CANCELLED">Đã hủy (CANCELLED)</option>
                                          </select>
                                        </div>

                                        <div className="text-right text-[10px] font-bold text-on-surface-variant">
                                          Cập nhật lúc: <span className="text-xs font-bold">{new Date(order.updatedAt).toLocaleTimeString("vi-VN")}</span>
                                        </div>
                                      </div>
                                    </div>

                                    {/* Items Table */}
                                    <div className="border border-outline-variant/20 rounded-lg overflow-hidden">
                                      <table className="w-full text-left border-collapse">
                                        <thead>
                                          <tr className="bg-slate-50 border-b border-outline-variant/20">
                                            <th className="py-2 px-4 font-bold text-[10px] uppercase tracking-wider text-on-surface-variant">Mã sản phẩm</th>
                                            <th className="py-2 px-4 font-bold text-[10px] uppercase tracking-wider text-on-surface-variant">Tên hàng hóa</th>
                                            <th className="py-2 px-4 font-bold text-[10px] uppercase tracking-wider text-on-surface-variant text-center">Số lượng</th>
                                            <th className="py-2 px-4 font-bold text-[10px] uppercase tracking-wider text-on-surface-variant text-right">Đơn giá</th>
                                            <th className="py-2 px-4 font-bold text-[10px] uppercase tracking-wider text-on-surface-variant text-right">Thành tiền</th>
                                          </tr>
                                        </thead>
                                        <tbody className="divide-y divide-outline-variant/10 text-xs">
                                          {order.items?.map((item) => (
                                            <tr key={item.id} className="hover:bg-slate-50/20">
                                              <td className="py-2 px-4 font-mono text-[10px] text-on-surface-variant">
                                                {item.productId ? item.productId.slice(0, 8).toUpperCase() : "N/A"}
                                              </td>
                                              <td className="py-2 px-4 font-bold text-on-surface">{item.productName}</td>
                                              <td className="py-2 px-4 text-center font-bold">{item.quantity}</td>
                                              <td className="py-2 px-4 text-right text-on-surface-variant">
                                                {item.unitPrice.toLocaleString("vi-VN")}₫
                                              </td>
                                              <td className="py-2 px-4 text-right font-semibold text-primary">
                                                {item.subtotal.toLocaleString("vi-VN")}₫
                                              </td>
                                            </tr>
                                          ))}
                                        </tbody>
                                      </table>
                                    </div>

                                    {/* Order Footer Elements */}
                                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center pt-3 border-t border-outline-variant/20 gap-4">
                                      {/* Note / Customer Info */}
                                      <div className="flex-1 space-y-2">
                                        {order.note ? (
                                          <div className="p-3 bg-amber-50 border border-amber-200/50 rounded-lg text-xs flex items-center gap-2 max-w-xl">
                                            <span className="material-symbols-outlined text-amber-600 text-lg flex-shrink-0">chat_bubble</span>
                                            <div>
                                              <span className="font-bold text-amber-800">Ghi chú giao hàng: </span>
                                              <span className="text-amber-900 font-semibold">{order.note}</span>
                                            </div>
                                          </div>
                                        ) : (
                                          <div className="text-xs text-on-surface-variant italic">Không có ghi chú bổ sung</div>
                                        )}

                                        <div className="text-[10px] text-on-surface-variant flex items-center gap-1 font-semibold">
                                          <span className="material-symbols-outlined text-sm text-green-600">verified</span>
                                          <span>Đơn hàng đã được trừ kho tự động thành công thông qua Event Handler.</span>
                                        </div>
                                      </div>

                                      {/* Total Calculation */}
                                      <div className="text-right">
                                        <div className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Tổng cộng thanh toán</div>
                                        <div className="text-xl font-black text-primary mt-1">
                                          {order.totalAmount.toLocaleString("vi-VN")}₫
                                        </div>
                                      </div>
                                    </div>

                                  </div>
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                <div className="p-4 border-t border-outline-variant/30 flex items-center justify-between bg-slate-50/70">
                  <div className="text-xs font-semibold text-on-surface-variant">
                    Hiển thị <span className="font-bold text-on-surface">{filteredOrders.length}</span> trên <span className="font-bold text-on-surface">{totalElements}</span> đơn hàng
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button 
                      onClick={() => setPage(p => Math.max(0, p - 1))}
                      disabled={page === 0}
                      className="w-8 h-8 rounded border border-outline-variant bg-white flex items-center justify-center text-on-surface-variant hover:bg-slate-50 disabled:opacity-40 transition-colors"
                    >
                      <span className="material-symbols-outlined text-lg">chevron_left</span>
                    </button>
                    <span className="text-xs font-bold text-on-surface-variant px-2">Trang {page + 1} / {totalPages || 1}</span>
                    <button 
                      onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                      disabled={page >= totalPages - 1}
                      className="w-8 h-8 rounded border border-outline-variant bg-white flex items-center justify-center text-on-surface-variant hover:bg-slate-50 disabled:opacity-40 transition-colors"
                    >
                      <span className="material-symbols-outlined text-lg">chevron_right</span>
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default OrderManagement;
