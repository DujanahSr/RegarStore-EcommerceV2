import { useState, useEffect } from "react";
import { X, Save, Plus, Trash2, Package } from "lucide-react";
import api from "../../services/api";
import toast from "react-hot-toast";

export default function ManageSizeStockModal({ product, onClose, onStockUpdated }) {
  const [sizeStocks, setSizeStocks] = useState({});
  const [newSizeName, setNewSizeName] = useState("");
  const [newSizeQty, setNewSizeQty] = useState(10);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (product) {
      if (product.sizeStocks && Object.keys(product.sizeStocks).length > 0) {
        setSizeStocks({ ...product.sizeStocks });
      } else {
        // Fallback default sizes if none yet
        const defaultSizes = {
          S: 10,
          M: 20,
          L: 20,
          XL: 15,
          XXL: 10,
        };
        setSizeStocks(defaultSizes);
      }
    }
  }, [product]);

  if (!product) return null;

  const totalStock = Object.values(sizeStocks).reduce((acc, curr) => acc + (Number(curr) || 0), 0);

  const handleStockChange = (size, value) => {
    const val = Math.max(0, parseInt(value, 10) || 0);
    setSizeStocks((prev) => ({
      ...prev,
      [size]: val,
    }));
  };

  const handleQuickAdjust = (size, delta) => {
    setSizeStocks((prev) => {
      const current = prev[size] || 0;
      const updated = Math.max(0, current + delta);
      return {
        ...prev,
        [size]: updated,
      };
    });
  };

  const handleAddSize = (e) => {
    e.preventDefault();
    const clean = newSizeName.trim().toUpperCase();
    if (!clean) {
      toast.error("Nama ukuran tidak boleh kosong");
      return;
    }
    if (sizeStocks[clean] !== undefined) {
      toast.error(`Ukuran ${clean} sudah ada dalam daftar`);
      return;
    }
    setSizeStocks((prev) => ({
      ...prev,
      [clean]: Math.max(0, Number(newSizeQty) || 0),
    }));
    setNewSizeName("");
    setNewSizeQty(10);
    toast.success(`Ukuran ${clean} ditambahkan`);
  };

  const handleDeleteSize = (size) => {
    if (Object.keys(sizeStocks).length <= 1) {
      toast.error("Minimal produk harus memiliki 1 ukuran");
      return;
    }
    setSizeStocks((prev) => {
      const next = { ...prev };
      delete next[size];
      return next;
    });
  };

  const handleSaveAll = async () => {
    setSaving(true);
    try {
      // Update product with full sizeStocks payload
      await api.put(`/products/${product.id}`, {
        categoryId: product.categoryId || product.category_id || product.category?.id || 1,
        name: product.name,
        description: product.description || "",
        price: product.price,
        stock: totalStock,
        imageUrl: product.image_url || product.imageUrl || "",
        sizeStocks: sizeStocks,
      });

      toast.success(`Stok per ukuran untuk "${product.name}" berhasil diperbarui!`);
      if (onStockUpdated) {
        onStockUpdated({
          ...product,
          stock: totalStock,
          sizeStocks: sizeStocks,
        });
      }
      onClose();
    } catch (error) {
      console.error("Gagal memperbarui stok ukuran:", error);
      toast.error(error.response?.data?.message || "Gagal menyimpan kuota stok ukuran");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white border border-stone-200/80 rounded-3xl shadow-2xl w-full max-w-xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-6 border-b border-stone-100 flex items-center justify-between bg-stone-50/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-[#162018] text-white shadow-sm">
              <Package size={20} />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 font-['Barlow_Condensed'] uppercase tracking-wide truncate max-w-sm">
                Manajemen Stok Ukuran Produk
              </h2>
              <p className="text-xs text-stone-500 truncate max-w-sm font-medium">
                {product.name}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-stone-400 hover:text-slate-900 hover:bg-stone-100 transition-all cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {/* Summary Banner */}
          <div className="flex items-center justify-between p-4 rounded-2xl bg-stone-50 border border-stone-200">
            <div>
              <p className="text-[11px] font-mono text-stone-500 font-bold uppercase tracking-wider">Total Akumulasi Stok Fisik</p>
              <p className="text-3xl font-black text-slate-900 font-['Barlow_Condensed']">{totalStock} <span className="text-xs text-stone-500 font-sans font-normal">pcs</span></p>
            </div>
            <span className="text-xs px-3 py-1.5 rounded-full bg-white text-stone-800 font-mono font-bold border border-stone-200 shadow-2xs">
              {Object.keys(sizeStocks).length} Varian Ukuran
            </span>
          </div>

          {/* Size Stocks Table / List */}
          <div className="space-y-3">
            <label className="block text-xs font-bold uppercase tracking-widest text-stone-600">
              Daftar Ukuran &amp; Penyesuaian Kuota Stok
            </label>
            <div className="space-y-2.5">
              {Object.entries(sizeStocks).map(([size, qty]) => {
                const numQty = Number(qty) || 0;
                let stockStatus = {
                  label: "Ready Stock",
                  color: "text-emerald-800 bg-emerald-50 border-emerald-200",
                };
                if (numQty === 0) {
                  stockStatus = {
                    label: "Habis",
                    color: "text-[#B9382B] bg-[#FAF0ED] border-[#B9382B]/20",
                  };
                } else if (numQty < 5) {
                  stockStatus = {
                    label: "Menipis",
                    color: "text-amber-800 bg-amber-50 border-amber-200",
                  };
                }

                return (
                  <div
                    key={size}
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-2xl bg-stone-50/70 border border-stone-200/80 hover:border-stone-300 transition-all gap-3"
                  >
                    {/* Size Label & Status */}
                    <div className="flex items-center gap-3 min-w-32">
                      <div className="w-10 h-10 rounded-xl bg-white border border-stone-200 flex items-center justify-center font-black text-slate-900 text-sm shadow-2xs font-mono">
                        {size}
                      </div>
                      <div>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${stockStatus.color}`}>
                          {stockStatus.label}
                        </span>
                      </div>
                    </div>

                    {/* Stock Quick Controls */}
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleQuickAdjust(size, -5)}
                        className="px-2 py-1.5 rounded-lg bg-white hover:bg-stone-200 text-xs font-bold text-stone-700 transition cursor-pointer border border-stone-200 shadow-2xs"
                        title="Kurangi 5"
                      >
                        -5
                      </button>
                      <button
                        type="button"
                        onClick={() => handleQuickAdjust(size, -1)}
                        className="w-8 h-8 rounded-lg bg-white hover:bg-stone-200 text-sm font-bold text-stone-700 transition flex items-center justify-center cursor-pointer border border-stone-200 shadow-2xs"
                        title="Kurangi 1"
                      >
                        -
                      </button>

                      <input
                        type="number"
                        min="0"
                        value={qty}
                        onChange={(e) => handleStockChange(size, e.target.value)}
                        className="w-16 h-8 text-center bg-white border border-stone-300 rounded-lg text-slate-900 font-bold text-sm focus:outline-none focus:border-[#162018] transition [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none shadow-2xs"
                      />

                      <button
                        type="button"
                        onClick={() => handleQuickAdjust(size, 1)}
                        className="w-8 h-8 rounded-lg bg-white hover:bg-stone-200 text-sm font-bold text-stone-700 transition flex items-center justify-center cursor-pointer border border-stone-200 shadow-2xs"
                        title="Tambah 1"
                      >
                        +
                      </button>
                      <button
                        type="button"
                        onClick={() => handleQuickAdjust(size, 5)}
                        className="px-2 py-1.5 rounded-lg bg-white hover:bg-stone-200 text-xs font-bold text-stone-700 transition cursor-pointer border border-stone-200 shadow-2xs"
                        title="Tambah 5"
                      >
                        +5
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeleteSize(size)}
                        className="p-1.5 rounded-lg hover:bg-rose-50 text-stone-400 hover:text-rose-600 transition ml-1 cursor-pointer"
                        title="Hapus ukuran ini"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Add New Custom Size Form */}
          <form onSubmit={handleAddSize} className="p-4 rounded-2xl bg-stone-50 border border-dashed border-stone-300 flex flex-col sm:flex-row items-center gap-3">
            <div className="flex-1 w-full sm:w-auto">
              <input
                type="text"
                placeholder="Ukuran baru (misal: 3XL, 46)..."
                value={newSizeName}
                onChange={(e) => setNewSizeName(e.target.value)}
                className="w-full bg-white border border-stone-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 placeholder:text-stone-400 focus:outline-none focus:border-[#162018]"
              />
            </div>
            <div className="w-full sm:w-24">
              <input
                type="number"
                min="0"
                placeholder="Stok"
                value={newSizeQty}
                onChange={(e) => setNewSizeQty(e.target.value)}
                className="w-full bg-white border border-stone-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 text-center focus:outline-none focus:border-[#162018]"
              />
            </div>
            <button
              type="submit"
              className="w-full sm:w-auto flex items-center justify-center gap-1.5 bg-[#162018] hover:bg-black text-white px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer shrink-0 shadow-xs"
            >
              <Plus size={14} />
              Tambah Ukuran
            </button>
          </form>
        </div>

        {/* Modal Footer */}
        <div className="p-6 border-t border-stone-100 flex items-center justify-between bg-stone-50/50">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl text-stone-600 hover:text-slate-900 text-xs font-bold transition cursor-pointer"
          >
            Batal
          </button>

          <button
            type="button"
            onClick={handleSaveAll}
            disabled={saving}
            className="flex items-center gap-2 bg-[#B9382B] hover:bg-[#9E2D22] text-white px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider shadow-md transition active:scale-95 disabled:opacity-50 cursor-pointer"
          >
            {saving ? (
              <>
                <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Menyimpan...
              </>
            ) : (
              <>
                <Save size={15} />
                Simpan Perubahan Stok
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
