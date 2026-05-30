import React, { useState, useEffect } from "react";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import LoadingSpinner from "../components/LoadingSpinner";
import api from "../services/api";

const ProductManagement = () => {
  const [products, setProducts] = useState([]);
  const [totalElements, setTotalElements] = useState(0);
  const [page, setPage] = useState(0);
  const [size] = useState(10);
  const [totalPages, setTotalPages] = useState(0);
  
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [loading, setLoading] = useState(true);

  // Stats
  const [totalProductsCount, setTotalProductsCount] = useState(0);
  const [activeProductsCount, setActiveProductsCount] = useState(0);
  const [lowStockCount, setLowStockCount] = useState(0);

  // Drawer Form State
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null); // null means "Add Product" mode
  const [formName, setFormName] = useState("");
  const [formSku, setFormSku] = useState("");
  const [formCategory, setFormCategory] = useState("Bakery");
  const [formPrice, setFormPrice] = useState("");
  const [formStock, setFormStock] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formImageUrl, setFormImageUrl] = useState("");
  const [formIsActive, setFormIsActive] = useState(true);

  // Uploading state
  const [uploadingImage, setUploadingImage] = useState(false);
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await api.get("/products", {
        params: {
          page,
          size,
          category: categoryFilter || undefined,
          search: searchQuery || undefined,
        },
      });

      const { content, totalElements: totalItems, totalPages: pages } = response.data.data;
      setProducts(content);
      setTotalElements(totalItems);
      setTotalPages(pages);
      setLoading(false);
    } catch (error) {
      console.error("Lỗi khi tải danh sách sản phẩm:", error);
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      // In a production system we'd call a dedicated stats API, 
      // but in this monolith we can aggregate using a simple un-paginated query or fetch all active products.
      const response = await api.get("/products", { params: { page: 0, size: 200 } });
      const allProds = response.data.data.content;
      
      setTotalProductsCount(allProds.length);
      setActiveProductsCount(allProds.filter(p => p.isActive).length);
      setLowStockCount(allProds.filter(p => p.isActive && p.stockQuantity <= 10).length);
    } catch (e) {
      console.error("Lỗi khi tải thống kê:", e);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [page, categoryFilter, searchQuery]);

  useEffect(() => {
    fetchStats();
  }, [products]);

  // Open Drawer in Add/Edit modes
  const handleOpenDrawer = (product = null) => {
    setFormError("");
    setFormSuccess("");
    if (product) {
      // EDIT MODE
      setSelectedProduct(product);
      setFormName(product.name);
      setFormSku(product.sku);
      setFormCategory(product.category || "Bakery");
      setFormPrice(product.price);
      setFormStock(product.stockQuantity);
      setFormDescription(product.description || "");
      setFormImageUrl(product.imageUrl || "");
      setFormIsActive(product.isActive);
    } else {
      // ADD MODE
      setSelectedProduct(null);
      setFormName("");
      setFormSku("");
      setFormCategory("Bakery");
      setFormPrice("");
      setFormStock("");
      setFormDescription("");
      setFormImageUrl("");
      setFormIsActive(true);
    }
    setIsDrawerOpen(true);
  };

  const handleCloseDrawer = () => {
    setIsDrawerOpen(false);
    setSelectedProduct(null);
  };

  // Image upload handling directly to Cloudinary via BE proxy
  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadingImage(true);
    setFormError("");
    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await api.post("/products/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      const secureUrl = response.data.data.imageUrl;
      setFormImageUrl(secureUrl);
      setUploadingImage(false);
    } catch (error) {
      console.error("Lỗi khi tải hình ảnh lên Cloudinary:", error);
      setFormError("Không thể upload ảnh lên Cloudinary. Vui lòng kiểm tra lại cấu hình.");
      setUploadingImage(false);
    }
  };

  // Create/Update Product handler
  const handleSaveProduct = async (e) => {
    e.preventDefault();
    setFormError("");
    setFormSuccess("");

    if (!formName || !formSku || !formPrice || formStock === "") {
      setFormError("Vui lòng nhập đầy đủ các trường bắt buộc (*)");
      return;
    }

    if (!formImageUrl) {
      setFormError("Hình ảnh sản phẩm là bắt buộc. Vui lòng chọn và tải ảnh lên.");
      return;
    }

    const payload = {
      name: formName,
      sku: formSku,
      category: formCategory,
      price: parseFloat(formPrice),
      stockQuantity: parseInt(formStock),
      description: formDescription,
      imageUrl: formImageUrl,
      isActive: formIsActive
    };

    try {
      if (selectedProduct) {
        // UPDATE
        await api.put(`/products/${selectedProduct.id}`, payload);
        setFormSuccess("Cập nhật sản phẩm thành công!");
      } else {
        // CREATE
        await api.post("/products", payload);
        setFormSuccess("Tạo sản phẩm mới thành công!");
      }
      
      // Reload lists and stats
      fetchProducts();
      
      setTimeout(() => {
        handleCloseDrawer();
      }, 1500);
    } catch (error) {
      const msg = error.response?.data?.message || "Lưu thông tin sản phẩm thất bại.";
      setFormError(msg);
    }
  };

  // Soft Delete Handler
  const handleDeleteProduct = async (id) => {
    if (!window.confirm("Bạn có chắc chắn muốn ngừng kinh doanh sản phẩm này?")) return;

    try {
      await api.delete(`/products/${id}`);
      fetchProducts();
    } catch (error) {
      alert("Xóa sản phẩm thất bại: " + (error.response?.data?.message || error.message));
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
        placeholder="Tìm sản phẩm theo tên, SKU..."
      />

      {/* Main Content Area */}
      <main className="md:ml-[260px] px-6 pb-6 pt-20 md:px-8 md:pb-8 md:pt-24 min-h-screen bg-slate-50">
        
        {/* Overlay for Drawer */}
        {isDrawerOpen && (
          <div 
            onClick={handleCloseDrawer}
            className="fixed inset-0 bg-[#151c27]/20 z-40 transition-opacity duration-300 backdrop-blur-sm"
          ></div>
        )}

        <div className="max-w-[1440px] mx-auto space-y-6">
          
          {/* Header */}
          <div className="flex justify-between items-end">
            <div>
              <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-primary mb-1">
                Quản lý kho Sản phẩm
              </h1>
              <p className="text-sm text-on-surface-variant">
                Quản lý thông tin, giá bán và xuất nhập tồn kho hàng hóa
              </p>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-4 rounded-xl border border-outline-variant/40 bg-white flex items-center gap-4 shadow-sm">
              <div className="w-12 h-12 rounded bg-green-50 flex items-center justify-center text-primary">
                <span className="material-symbols-outlined text-[28px]">inventory</span>
              </div>
              <div>
                <div className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">Tổng sản phẩm</div>
                <div className="text-2xl font-bold text-on-surface">{totalProductsCount}</div>
              </div>
            </div>

            <div className="p-4 rounded-xl border border-outline-variant/40 bg-white flex items-center gap-4 shadow-sm">
              <div className="w-12 h-12 rounded bg-green-50 flex items-center justify-center text-primary">
                <span className="material-symbols-outlined text-[28px]">check_circle</span>
              </div>
              <div>
                <div className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">Đang kinh doanh</div>
                <div className="text-2xl font-bold text-on-surface">{activeProductsCount}</div>
              </div>
            </div>

            <div className="p-4 rounded-xl border border-outline-variant/40 bg-white flex items-center gap-4 shadow-sm">
              <div className="w-12 h-12 rounded bg-orange-50 flex items-center justify-center text-secondary">
                <span className="material-symbols-outlined text-[28px]">warning</span>
              </div>
              <div>
                <div className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">Sắp hết hàng</div>
                <div className="flex items-center gap-2">
                  <div className="text-2xl font-bold text-on-surface">{lowStockCount}</div>
                  {lowStockCount > 0 && (
                    <span className="px-2 py-0.5 rounded-full bg-secondary/10 text-secondary text-[9px] font-bold uppercase tracking-wider">
                      Cần xử lý
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Search, Filter & Add Toolbar */}
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-4 rounded-xl border border-outline-variant/40 shadow-sm">
            <div className="flex items-center gap-3 w-full md:w-auto">
              <select 
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="h-10 px-3 rounded-lg border border-outline-variant bg-white focus:border-primary outline-none text-sm text-on-surface-variant w-full md:w-48"
              >
                <option value="">Tất cả danh mục</option>
                <option value="Bakery">Bakery (Bánh mì)</option>
                <option value="Beverage">Beverage (Đồ uống)</option>
                <option value="Snack">Snack (Đồ ăn vặt)</option>
                <option value="Instant Food">Instant Food (Ăn liền)</option>
                <option value="Dairy">Dairy (Sữa)</option>
                <option value="Combo">Combo (Bữa ăn)</option>
              </select>
            </div>
            
            <button 
              onClick={() => handleOpenDrawer(null)}
              className="w-full md:w-auto h-10 px-5 rounded-lg bg-primary text-on-primary font-bold text-sm flex items-center justify-center gap-2 hover:bg-primary-container transition-all shadow-md"
            >
              <span className="material-symbols-outlined text-lg">add</span>
              Thêm sản phẩm
            </button>
          </div>

          {/* Table Container */}
          <div className="border border-outline-variant/40 rounded-xl bg-white overflow-hidden shadow-sm">
            {loading ? (
              <LoadingSpinner />
            ) : products.length === 0 ? (
              <div className="py-16 text-center text-on-surface-variant font-medium">
                <span className="material-symbols-outlined text-4xl block mb-2">sentiment_dissatisfied</span>
                Không tìm thấy sản phẩm nào phù hợp
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse min-w-[800px]">
                    <thead>
                      <tr className="bg-slate-50/70 border-b border-outline-variant/40">
                        <th className="p-4 font-bold text-xs uppercase tracking-wider text-on-surface-variant">Sản phẩm</th>
                        <th className="p-4 font-bold text-xs uppercase tracking-wider text-on-surface-variant">Danh mục</th>
                        <th className="p-4 font-bold text-xs uppercase tracking-wider text-on-surface-variant">Giá bán</th>
                        <th className="p-4 font-bold text-xs uppercase tracking-wider text-on-surface-variant">Số lượng kho</th>
                        <th className="p-4 font-bold text-xs uppercase tracking-wider text-on-surface-variant">Trạng thái</th>
                        <th className="p-4 pr-6 font-bold text-xs uppercase tracking-wider text-on-surface-variant text-right">Thao tác</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-outline-variant/20">
                      {products.map((prod) => (
                        <tr key={prod.id} className="hover:bg-slate-50/40 transition-colors group">
                          <td className="p-4">
                            <div className="flex items-center gap-3">
                              <div className="w-12 h-12 rounded-lg border border-outline-variant/40 bg-white flex-shrink-0 overflow-hidden shadow-sm">
                                <img 
                                  className="w-full h-full object-cover" 
                                  src={prod.imageUrl} 
                                  alt={prod.name} 
                                  onError={(e) => {
                                    e.target.src = "https://placehold.co/100x100?text=7-Eleven";
                                  }}
                                />
                              </div>
                              <div className="max-w-[280px]">
                                <div className="font-bold text-sm text-on-surface line-clamp-1">{prod.name}</div>
                                <div className="font-mono text-xs text-on-surface-variant tracking-tight mt-0.5">{prod.sku}</div>
                              </div>
                            </div>
                          </td>
                          <td className="p-4 text-sm font-medium text-on-surface-variant">{prod.category || "N/A"}</td>
                          <td className="p-4 font-bold text-sm text-primary">{prod.price.toLocaleString("vi-VN")}₫</td>
                          <td className="p-4 font-mono text-sm">
                            {prod.stockQuantity <= 10 ? (
                              <div className="flex items-center gap-1.5">
                                <span className="font-bold text-secondary">{prod.stockQuantity}</span>
                                <span className="px-1.5 py-0.5 rounded bg-secondary/15 text-secondary text-[9px] font-bold">
                                  SẮP HẾT
                                </span>
                              </div>
                            ) : (
                              <span className="text-on-surface font-semibold">{prod.stockQuantity}</span>
                            )}
                          </td>
                          <td className="p-4">
                            {prod.isActive ? (
                              <span className="inline-flex px-2 py-0.5 rounded-full bg-green-500/10 text-green-700 text-[10px] font-bold uppercase tracking-wider items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-green-600"></span> Đang bán
                              </span>
                            ) : (
                              <span className="inline-flex px-2 py-0.5 rounded-full bg-red-500/10 text-red-700 text-[10px] font-bold uppercase tracking-wider items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-red-600"></span> Ngừng bán
                              </span>
                            )}
                          </td>
                          <td className="p-4 pr-6 text-right">
                            <div className="flex items-center justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button 
                                onClick={() => handleOpenDrawer(prod)}
                                className="p-2 text-on-surface-variant hover:text-primary rounded-lg hover:bg-slate-100 transition-colors"
                                title="Chỉnh sửa"
                              >
                                <span className="material-symbols-outlined text-lg">edit</span>
                              </button>
                              <button 
                                onClick={() => handleDeleteProduct(prod.id)}
                                className="p-2 text-on-surface-variant hover:text-error rounded-lg hover:bg-error-container/20 transition-colors"
                                title="Ngừng kinh doanh"
                              >
                                <span className="material-symbols-outlined text-lg">delete</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                <div className="p-4 border-t border-outline-variant/30 flex items-center justify-between bg-slate-50/70">
                  <div className="text-xs font-semibold text-on-surface-variant">
                    Hiển thị <span className="font-bold text-on-surface">{products.length}</span> trên <span className="font-bold text-on-surface">{totalElements}</span> sản phẩm
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

      {/* Slide-out Drawer */}
      <aside 
        className={`fixed right-0 top-0 h-full w-[480px] bg-white shadow-[-4px_0_24px_rgba(0,0,0,0.1)] z-50 flex flex-col border-l border-outline-variant transition-transform duration-300 ease-in-out transform ${
          isDrawerOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Drawer Header */}
        <div className="px-6 py-4 border-b border-outline-variant/40 flex items-center justify-between bg-slate-50">
          <h2 className="font-bold text-lg text-on-surface">
            {selectedProduct ? "Cập nhật sản phẩm" : "Thêm sản phẩm mới"}
          </h2>
          <button 
            onClick={handleCloseDrawer}
            className="p-1.5 rounded-full hover:bg-slate-200 text-on-surface-variant transition-colors"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Drawer Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Action alerts */}
          {formError && (
            <div className="p-3 rounded-lg bg-error-container text-on-error-container text-xs font-semibold flex items-center gap-1.5 border border-error/10">
              <span className="material-symbols-outlined text-base">warning</span>
              <span>{formError}</span>
            </div>
          )}
          {formSuccess && (
            <div className="p-3 rounded-lg bg-green-100 text-green-800 text-xs font-semibold flex items-center gap-1.5 border border-green-200">
              <span className="material-symbols-outlined text-base">check_circle</span>
              <span>{formSuccess}</span>
            </div>
          )}

          {/* Secure Cloudinary Image Upload Widget */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-on-surface-variant mb-2">
              Hình ảnh sản phẩm *
            </label>
            <input 
              type="file" 
              id="image-file" 
              accept="image/*" 
              onChange={handleImageChange}
              className="hidden" 
            />
            
            {formImageUrl ? (
              <div className="relative w-full h-44 rounded-xl border border-outline-variant bg-slate-50 overflow-hidden shadow-inner group">
                <img src={formImageUrl} alt="Preview" className="w-full h-full object-cover" />
                <label 
                  htmlFor="image-file"
                  className="absolute inset-0 bg-[#151c27]/40 flex flex-col items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer gap-1"
                >
                  <span className="material-symbols-outlined text-[28px]">add_photo_alternate</span>
                  <span className="text-xs font-bold">Thay thế hình ảnh</span>
                </label>
              </div>
            ) : (
              <label 
                htmlFor="image-file"
                className="w-full h-44 rounded-xl border-2 border-dashed border-outline-variant flex flex-col items-center justify-center gap-2 bg-slate-50 hover:bg-slate-100 cursor-pointer transition-colors"
              >
                {uploadingImage ? (
                  <>
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
                    <span className="text-xs font-bold text-primary animate-pulse">Đang tải ảnh lên Cloudinary...</span>
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-[32px] text-on-surface-variant">add_photo_alternate</span>
                    <span className="text-xs font-bold text-on-surface-variant">Nhấp để tải ảnh lên (Cloudinary)</span>
                  </>
                )}
              </label>
            )}
          </div>

          <div className="space-y-4">
            {/* Product Name */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-on-surface-variant mb-2">
                Tên sản phẩm *
              </label>
              <input 
                type="text" 
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-outline-variant bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none text-sm transition-all"
                placeholder="Nhập tên sản phẩm..."
              />
            </div>

            {/* Row: SKU & Category */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-on-surface-variant mb-2">
                  Mã SKU *
                </label>
                <input 
                  type="text" 
                  value={formSku}
                  onChange={(e) => setFormSku(e.target.value)}
                  disabled={selectedProduct !== null}
                  className={`w-full px-3 py-2 rounded-lg border border-outline-variant text-sm transition-all ${
                    selectedProduct ? "bg-slate-100 text-on-surface-variant cursor-not-allowed font-semibold" : "bg-white focus:border-primary focus:ring-2 focus:ring-primary/20"
                  }`}
                  placeholder="Ví dụ: BM-001"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-on-surface-variant mb-2">
                  Danh mục
                </label>
                <select 
                  value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-outline-variant bg-white focus:border-primary outline-none text-sm h-[38px]"
                >
                  <option value="Bakery">Bakery</option>
                  <option value="Beverage">Beverage</option>
                  <option value="Snack">Snack</option>
                  <option value="Instant Food">Instant Food</option>
                  <option value="Dairy">Dairy</option>
                  <option value="Combo">Combo</option>
                </select>
              </div>
            </div>

            {/* Row: Price & Stock */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-on-surface-variant mb-2">
                  Giá bán (VND) *
                </label>
                <input 
                  type="number" 
                  value={formPrice}
                  onChange={(e) => setFormPrice(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-outline-variant bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none text-sm font-semibold"
                  placeholder="Ví dụ: 35000"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-on-surface-variant mb-2">
                  Số lượng kho *
                </label>
                <input 
                  type="number" 
                  value={formStock}
                  onChange={(e) => setFormStock(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-outline-variant bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none text-sm font-bold text-on-surface"
                  placeholder="Ví dụ: 50"
                />
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-on-surface-variant mb-2">
                Mô tả chi tiết
              </label>
              <textarea 
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-outline-variant bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none text-sm resize-none"
                rows="3"
                placeholder="Nhập mô tả sản phẩm..."
              />
            </div>

            {/* Status Toggle */}
            <div className="flex items-center justify-between p-3 border border-outline-variant/40 rounded-xl bg-slate-50">
              <div>
                <div className="font-bold text-sm text-on-surface">Mở bán sản phẩm</div>
                <div className="text-[11px] text-on-surface-variant font-medium">Hiển thị sản phẩm trong cửa hàng bán lẻ</div>
              </div>
              <button 
                type="button"
                onClick={() => setFormIsActive(!formIsActive)}
                className={`w-11 h-6 rounded-full relative transition-colors flex items-center px-[2px] ${
                  formIsActive ? "bg-primary" : "bg-slate-300"
                }`}
              >
                <div 
                  className={`w-5 h-5 rounded-full bg-white transition-transform shadow-md transform ${
                    formIsActive ? "translate-x-5" : "translate-x-0"
                  }`}
                ></div>
              </button>
            </div>
          </div>
        </div>

        {/* Drawer Footer */}
        <div className="p-4 border-t border-outline-variant/40 bg-slate-50 flex justify-end gap-3">
          <button 
            type="button"
            onClick={handleCloseDrawer}
            className="px-4 py-2 rounded-lg border border-outline-variant text-on-surface text-sm font-bold hover:bg-slate-200 transition-colors"
          >
            Hủy bỏ
          </button>
          <button 
            type="button"
            onClick={handleSaveProduct}
            disabled={uploadingImage}
            className="px-4 py-2 rounded-lg bg-primary text-on-primary text-sm font-bold hover:bg-primary-container transition-colors shadow-md disabled:opacity-50"
          >
            Lưu thay đổi
          </button>
        </div>
      </aside>
    </div>
  );
};

export default ProductManagement;
