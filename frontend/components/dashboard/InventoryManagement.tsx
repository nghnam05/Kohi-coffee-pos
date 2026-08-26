'use client';

import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';

export interface Ingredient {
  _id: string;
  name: string;
  category: string;
  unit: string;
  currentQuantity: number;
  minThreshold: number;
  status: 'in_stock' | 'low_stock' | 'out_of_stock';
  lastUpdatedBy: string;
  updatedAt: string;
}

interface InventoryManagementProps {
  userRole: 'admin' | 'staff';
  userName?: string;
  apiBase: string;
  socket?: any;
}

export const InventoryManagement: React.FC<InventoryManagementProps> = ({
  userRole,
  userName = 'Nhân viên',
  apiBase,
  socket,
}) => {
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Modal states
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [newIngredient, setNewIngredient] = useState({
    name: '',
    category: 'Cà phê & Đồ uống',
    unit: 'kg',
    currentQuantity: 5,
    minThreshold: 2,
  });

  const fetchIngredients = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${apiBase}/ingredients`);
      if (res.ok) {
        const data = await res.json();
        setIngredients(data);
      }
    } catch (err) {
      toast.error('Lỗi kết nối máy chủ khi lấy dữ liệu kho');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIngredients();

    if (socket) {
      socket.on('ingredientUpdated', (updatedItem: Ingredient) => {
        setIngredients((prev) => {
          const index = prev.findIndex((item) => item._id === updatedItem._id);
          if (index !== -1) {
            const next = [...prev];
            next[index] = updatedItem;
            return next;
          }
          return [updatedItem, ...prev];
        });
      });

      return () => {
        socket.off('ingredientUpdated');
      };
    }
  }, [apiBase, socket]);

  const handleUpdateStock = async (id: string, quantityChange?: number, absoluteQuantity?: number, forceStatus?: string) => {
    try {
      const payload: any = {
        lastUpdatedBy: userName,
      };
      if (typeof quantityChange === 'number') payload.quantityChange = quantityChange;
      if (typeof absoluteQuantity === 'number') payload.currentQuantity = absoluteQuantity;
      if (forceStatus) payload.status = forceStatus;

      const res = await fetch(`${apiBase}/ingredients/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const updated = await res.json();
        setIngredients((prev) => prev.map((item) => (item._id === id ? updated : item)));
        toast.success(`Đã cập nhật nguyên liệu: ${updated.name}`);
      } else {
        toast.error('Không thể cập nhật nguyên liệu');
      }
    } catch (err) {
      toast.error('Lỗi khi gửi yêu cầu cập nhật');
    }
  };

  const handleCreateIngredient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newIngredient.name.trim()) {
      toast.error('Vui lòng nhập tên nguyên liệu');
      return;
    }

    try {
      const res = await fetch(`${apiBase}/ingredients`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newIngredient,
          lastUpdatedBy: userName,
        }),
      });

      if (res.ok) {
        const created = await res.json();
        setIngredients((prev) => [created, ...prev]);
        setShowAddModal(false);
        setNewIngredient({
          name: '',
          category: 'Cà phê & Đồ uống',
          unit: 'kg',
          currentQuantity: 5,
          minThreshold: 2,
        });
        toast.success('Đã thêm nguyên liệu mới vào kho thành công');
      } else {
        toast.error('Không thể thêm nguyên liệu mới');
      }
    } catch (err) {
      toast.error('Lỗi kết nối khi thêm nguyên liệu');
    }
  };

  const handleDeleteIngredient = async (id: string, name: string) => {
    if (!confirm(`Bạn có chắc chắn muốn xóa nguyên liệu "${name}" khỏi kho?`)) return;

    try {
      const res = await fetch(`${apiBase}/ingredients/${id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        setIngredients((prev) => prev.filter((item) => item._id !== id));
        toast.success(`Đã xóa "${name}" khỏi danh sách kho`);
      } else {
        toast.error('Lỗi khi xóa nguyên liệu');
      }
    } catch (err) {
      toast.error('Không thể kết nối đến máy chủ');
    }
  };

  const categories = ['all', ...Array.from(new Set(ingredients.map((i) => i.category)))];

  const filteredIngredients = ingredients.filter((item) => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const lowStockCount = ingredients.filter((i) => i.status === 'low_stock').length;
  const outOfStockCount = ingredients.filter((i) => i.status === 'out_of_stock').length;
  const totalCount = ingredients.length;

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Top Action Bar (Admin Add Button + Live Counter) */}
      <div className="flex items-center justify-between gap-3 bg-white dark:bg-[#121824] p-3.5 sm:p-4 rounded-2xl border border-slate-200/80 dark:border-[#1E2638] shadow-xs">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping shrink-0" />
          <span className="text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-200">
            Trạng thái nguyên liệu pha chế thời gian thực
          </span>
        </div>

        {userRole === 'admin' && (
          <button
            onClick={() => setShowAddModal(true)}
            className="px-3.5 py-2 bg-[#0284c7] hover:bg-[#0369a1] dark:bg-[#38BDF8] dark:hover:bg-[#0284c7] text-white dark:text-[#000000] text-xs font-bold rounded-xl transition-all shadow-xs shrink-0 cursor-pointer active:scale-95"
          >
            + Thêm Nguyên Liệu
          </button>
        )}
      </div>

      {/* Summary Stat Cards - Compact 3 Column Grid */}
      <div className="grid grid-cols-3 gap-2.5 sm:gap-4">
        {/* Total Ingredients */}
        <div className="bg-white dark:bg-[#121824] p-3 sm:p-4 rounded-2xl border border-slate-200/80 dark:border-[#1E2638] flex flex-col justify-between">
          <span className="text-[10px] sm:text-xs font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wider truncate">
            Tổng hàng
          </span>
          <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-1">
            {totalCount} <span className="text-[10px] sm:text-xs font-medium text-slate-400">món</span>
          </div>
        </div>

        {/* Low Stock Warning */}
        <div className={`p-3 sm:p-4 rounded-2xl border flex flex-col justify-between transition-all ${
          lowStockCount > 0
            ? 'bg-amber-500/10 border-amber-500/30 dark:bg-amber-500/10'
            : 'bg-white dark:bg-[#121824] border-slate-200/80 dark:border-[#1E2638]'
        }`}>
          <span className={`text-[10px] sm:text-xs font-bold uppercase tracking-wider truncate ${
            lowStockCount > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-slate-400'
          }`}>
            Sắp hết
          </span>
          <div className={`text-xl sm:text-2xl font-black mt-1 ${
            lowStockCount > 0 ? 'text-amber-600 dark:text-amber-400 animate-pulse' : 'text-slate-900 dark:text-white'
          }`}>
            {lowStockCount} <span className="text-[10px] sm:text-xs font-medium opacity-80">cần nhập</span>
          </div>
        </div>

        {/* Out of Stock Alert */}
        <div className={`p-3 sm:p-4 rounded-2xl border flex flex-col justify-between transition-all ${
          outOfStockCount > 0
            ? 'bg-rose-500/10 border-rose-500/40 dark:bg-rose-500/15'
            : 'bg-white dark:bg-[#121824] border-slate-200/80 dark:border-[#1E2638]'
        }`}>
          <span className={`text-[10px] sm:text-xs font-bold uppercase tracking-wider truncate ${
            outOfStockCount > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-400'
          }`}>
            Đã hết hàng
          </span>
          <div className={`text-xl sm:text-2xl font-black mt-1 ${
            outOfStockCount > 0 ? 'text-rose-600 dark:text-rose-400 animate-pulse' : 'text-slate-900 dark:text-white'
          }`}>
            {outOfStockCount} <span className="text-[10px] sm:text-xs font-medium opacity-80">hết hẳn</span>
          </div>
        </div>
      </div>

      {/* Category Pills & Search Row */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Category Selector */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-[#0284c7] text-white dark:bg-[#38BDF8] dark:text-slate-950 shadow-xs'
                  : 'bg-slate-100 dark:bg-[#181B21] text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-[#222732]'
              }`}
            >
              {cat === 'all' ? 'Tất cả danh mục' : cat}
            </button>
          ))}
        </div>

        {/* Search Bar */}
        <div className="w-full sm:w-64">
          <input
            type="text"
            placeholder="Tìm kiếm nguyên liệu..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-3.5 py-2 bg-white dark:bg-[#121824] border border-slate-200 dark:border-[#1E2638] rounded-xl text-xs font-medium text-slate-800 dark:text-white focus:outline-hidden focus:border-[#0284c7] dark:focus:border-[#38BDF8] placeholder-slate-400"
          />
        </div>
      </div>

      {/* Ingredient Cards Grid */}
      {loading ? (
        <div className="p-8 text-center text-xs text-slate-400">
          Đang kết nối tải dữ liệu kho nguyên liệu...
        </div>
      ) : filteredIngredients.length === 0 ? (
        <div className="p-8 text-center bg-white dark:bg-[#121824] rounded-2xl border border-slate-200/80 dark:border-[#1E2638] text-xs text-slate-400">
          Không tìm thấy nguyên liệu nào phù hợp.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4">
          {filteredIngredients.map((item) => {
            const isLow = item.status === 'low_stock';
            const isOut = item.status === 'out_of_stock';
            const isWarning = isLow || isOut;

            return (
              <div
                key={item._id}
                className={`p-4 sm:p-5 rounded-2xl border transition-all flex flex-col justify-between space-y-3.5 ${
                  isOut
                    ? 'bg-rose-500/10 border-rose-500/40 text-rose-700 dark:text-rose-200 shadow-xs'
                    : isLow
                    ? 'bg-amber-500/10 border-amber-500/30 text-amber-700 dark:text-amber-200'
                    : 'bg-white dark:bg-[#121824] border-slate-200/80 dark:border-[#1E2638]'
                }`}
              >
                <div>
                  {/* Top Category & Status Header */}
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-400">
                        {item.category}
                      </span>
                      <h3 className="text-base font-black text-slate-900 dark:text-white mt-0.5">
                        {item.name}
                      </h3>
                    </div>

                    {/* Status Badge */}
                    <div>
                      {isOut ? (
                        <span className="px-2.5 py-1 bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/30 text-[10px] font-black tracking-wider rounded-lg uppercase">
                          HẾT HÀNG
                        </span>
                      ) : isLow ? (
                        <span className="px-2.5 py-1 bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30 text-[10px] font-black tracking-wider rounded-lg uppercase">
                          SẮP HẾT
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-[10px] font-black tracking-wider rounded-lg uppercase">
                          ĐỦ HÀNG
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Quantity Indicator Bar */}
                  <div className="mt-3 pt-3 border-t border-slate-200/60 dark:border-[#1E2638]/60 flex items-baseline justify-between">
                    <div>
                      <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Hiện có:</span>
                      <div className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                        {item.currentQuantity}{' '}
                        <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                          {item.unit}
                        </span>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 block">Ngưỡng báo hết:</span>
                      <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                        &le; {item.minThreshold} {item.unit}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Stock Controls */}
                <div className="pt-3 border-t border-slate-200/60 dark:border-[#1E2638]/60 space-y-2">
                  <div className="grid grid-cols-3 gap-1.5">
                    <button
                      onClick={() => handleUpdateStock(item._id, -1)}
                      className="py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-[#181B21] dark:hover:bg-[#222732] active:scale-95 text-slate-800 dark:text-white text-xs font-bold rounded-xl transition-all cursor-pointer"
                    >
                      - 1 {item.unit}
                    </button>
                    <button
                      onClick={() => handleUpdateStock(item._id, 1)}
                      className="py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-[#181B21] dark:hover:bg-[#222732] active:scale-95 text-slate-800 dark:text-white text-xs font-bold rounded-xl transition-all cursor-pointer"
                    >
                      + 1 {item.unit}
                    </button>
                    <button
                      onClick={() => handleUpdateStock(item._id, 5)}
                      className="py-1.5 bg-[#0284c7]/10 hover:bg-[#0284c7]/20 dark:bg-[#38BDF8]/15 dark:hover:bg-[#38BDF8]/25 active:scale-95 text-[#0284c7] dark:text-[#38BDF8] text-xs font-bold rounded-xl transition-all cursor-pointer"
                    >
                      + 5 {item.unit}
                    </button>
                  </div>

                  {/* Secondary Action Link */}
                  <div className="flex items-center justify-between gap-2 pt-0.5">
                    <button
                      onClick={() => handleUpdateStock(item._id, undefined, undefined, 'low_stock')}
                      className={`text-[11px] font-bold transition-colors cursor-pointer ${
                        isWarning
                          ? 'text-rose-600 dark:text-rose-400 hover:underline'
                          : 'text-slate-500 dark:text-slate-400 hover:text-[#0284c7] dark:hover:text-[#38BDF8]'
                      }`}
                    >
                      {isWarning ? 'Cảnh báo sắp hết tới Admin' : 'Đánh dấu sắp hết'}
                    </button>

                    {userRole === 'admin' && (
                      <button
                        onClick={() => handleDeleteIngredient(item._id, item.name)}
                        className="text-[11px] font-bold text-rose-500 hover:text-rose-600 transition-colors cursor-pointer"
                      >
                        Xóa
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Ingredient Modal (Admin Only) */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#121824] border border-slate-200 dark:border-[#1E2638] rounded-2xl w-full max-w-md p-5 sm:p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">
              Thêm Nguyên Liệu Vào Kho
            </h3>

            <form onSubmit={handleCreateIngredient} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
                  Tên nguyên liệu
                </label>
                <input
                  type="text"
                  required
                  placeholder="VD: Sữa tươi thanh trùng, Hạt Arabica..."
                  value={newIngredient.name}
                  onChange={(e) => setNewIngredient({ ...newIngredient, name: e.target.value })}
                  className="w-full px-3.5 py-2 bg-slate-50 dark:bg-[#181B21] border border-slate-200 dark:border-[#222732] rounded-xl text-xs font-medium text-slate-900 dark:text-white focus:outline-hidden focus:border-[#0284c7] dark:focus:border-[#38BDF8]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
                    Danh mục
                  </label>
                  <select
                    value={newIngredient.category}
                    onChange={(e) => setNewIngredient({ ...newIngredient, category: e.target.value })}
                    className="w-full px-3.5 py-2 bg-slate-50 dark:bg-[#181B21] border border-slate-200 dark:border-[#222732] rounded-xl text-xs font-medium text-slate-900 dark:text-white focus:outline-hidden focus:border-[#0284c7] dark:focus:border-[#38BDF8]"
                  >
                    <option value="Cà phê & Đồ uống">Cà phê & Đồ uống</option>
                    <option value="Sữa & Kem">Sữa & Kem</option>
                    <option value="Gia vị & Đường">Gia vị & Đường</option>
                    <option value="Trà & Bột">Trà & Bột</option>
                    <option value="Khác">Khác</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
                    Đơn vị tính
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="kg, lít, hộp..."
                    value={newIngredient.unit}
                    onChange={(e) => setNewIngredient({ ...newIngredient, unit: e.target.value })}
                    className="w-full px-3.5 py-2 bg-slate-50 dark:bg-[#181B21] border border-slate-200 dark:border-[#222732] rounded-xl text-xs font-medium text-slate-900 dark:text-white focus:outline-hidden focus:border-[#0284c7] dark:focus:border-[#38BDF8]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
                    Số lượng nhập kho
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    required
                    value={newIngredient.currentQuantity}
                    onChange={(e) => setNewIngredient({ ...newIngredient, currentQuantity: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3.5 py-2 bg-slate-50 dark:bg-[#181B21] border border-slate-200 dark:border-[#222732] rounded-xl text-xs font-medium text-slate-900 dark:text-white focus:outline-hidden focus:border-[#0284c7] dark:focus:border-[#38BDF8]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
                    Ngưỡng báo hết
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    required
                    value={newIngredient.minThreshold}
                    onChange={(e) => setNewIngredient({ ...newIngredient, minThreshold: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3.5 py-2 bg-slate-50 dark:bg-[#181B21] border border-slate-200 dark:border-[#222732] rounded-xl text-xs font-medium text-slate-900 dark:text-white focus:outline-hidden focus:border-[#0284c7] dark:focus:border-[#38BDF8]"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-[#222732]">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-slate-100 dark:bg-[#181B21] hover:bg-slate-200 dark:hover:bg-[#222732] text-slate-700 dark:text-white text-xs font-bold rounded-xl transition-all cursor-pointer"
                >
                  Hủy Bỏ
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#0284c7] dark:bg-[#38BDF8] text-white dark:text-slate-950 text-xs font-bold rounded-xl transition-all shadow-xs cursor-pointer"
                >
                  Lưu Vào Kho
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
