import { useEffect, useState, useMemo } from "react";
import {
  Package,
  Search,
  AlertTriangle,
  Plus,
  RefreshCw,
  Layers,
  X,
  Loader2,
  TrendingDown,
  Boxes,
} from "lucide-react";
import api from "../../services/api";
import toast from "react-hot-toast";
import { EmptyState, ScreenLoader } from "../../components/common/UiStates";

export default function Inventory() {

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterMode, setFilterMode] = useState("all"); // 'all' | 'low' | 'out'

  // Restock Modal State
  const [restockProduct, setRestockProduct] = useState(null);
  const [selectedSize, setSelectedSize] = useState("");
  const [restockQty, setRestockQty] = useState(10);
  const [restocking, setRestocking] = useState(false);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const res = await api.get("/products", {
        params: { page: 1, size: 100, sortBy: "id", sortOrder: "desc" },
      });
      const data = res.data?.data?.content || res.data?.content || [];
      setProducts(data);
    } catch (err) {
      console.error("Gagal memuat inventaris produk:", err);
      toast.error("Gagal memuat data inventaris");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  // Filter products by search and stock condition
  const filteredProducts = useMemo(() => {
    return products.filter((prod) => {
      const matchSearch =
        !searchQuery.trim() ||
        prod.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (prod.category?.name || "").toLowerCase().includes(searchQuery.toLowerCase());

      if (!matchSearch) return false;

      const totalStock = Number(prod.stock || 0);
      if (filterMode === "low") return totalStock > 0 && totalStock <= 10;
      if (filterMode === "out") return totalStock === 0;
      return true;
    });
  }, [products, searchQuery, filterMode]);

  // Overall Inventory Stats
  const stats = useMemo(() => {
    let totalItems = products.length;
    let totalStockPcs = 0;
    let lowStockCount = 0;
    let outOfStockCount = 0;

    products.forEach((p) => {
      const s = Number(p.stock || 0);
      totalStockPcs += s;
      if (s === 0) outOfStockCount++;
      else if (s <= 10) lowStockCount++;
    });

    return { totalItems, totalStockPcs, lowStockCount, outOfStockCount };
  }, [products]);

  const handleOpenRestock = (product, defaultSize = "") => {
    setRestockProduct(product);
    const sizeKeys = Object.keys(product.sizeStocks || {});
    setSelectedSize(defaultSize || (sizeKeys.length > 0 ? sizeKeys[0] : "L"));
    setRestockQty(10);
  };

  const handleRestockSubmit = async (e) => {
    e.preventDefault();
    if (!restockProduct) return;
    const qtyChange = Number(restockQty);
    if (!qtyChange || qtyChange <= 0) {
      toast.error("Jumlah stok masuk minimal 1 pcs");
      return;
    }

    try {
      setRestocking(true);
      await api.patch(`/products/${restockProduct.id}/stock`, {
        quantityChange: qtyChange,
        size: selectedSize.trim(),
      });

      toast.success(
        `Berhasil menambah +${qtyChange} pcs stok (${selectedSize}) untuk ${restockProduct.name}`
      );
      setRestockProduct(null);
      fetchProducts();
    } catch (err) {
      toast.error(err.response?.data?.message || "Gagal menambah stok");
    } finally {
      setRestocking(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* ATELIER INVENTORY HERO BANNER */}
      <div className="relative overflow-hidden rounded-3xl border border-black/10 shadow-xl bg-[#162018]">
        {/* Background Image with Deep Gradient & Topography */}
        <div className="absolute inset-0 z-0">
          <img
            src="/images/inventory_hero_bg.jpg"
            alt="RegarStore Inventory Atelier"
            className="w-full h-full object-cover object-center filter brightness-[0.38] contrast-125"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#162018] via-[#162018]/85 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#162018] via-transparent to-black/30" />
          <div className="absolute inset-0 bg-topography opacity-15 mix-blend-overlay pointer-events-none" />
        </div>

        {/* Content Inside Hero */}
        <div className="relative z-10 p-6 sm:p-8 lg:p-10 flex flex-col justify-between min-h-[220px]">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-white/10 text-emerald-400 font-mono text-[10px] font-black tracking-widest border border-white/10 uppercase">
                RS // INVENTORY HUB
              </span>
              <span className="text-[11px] font-mono uppercase tracking-widest text-slate-300">
                CENTRAL APPAREL WAREHOUSE
              </span>
            </div>

            <button
              onClick={fetchProducts}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-all border border-white/10 shadow-xs cursor-pointer active:scale-95"
            >
              <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
              <span>Refresh Katalog</span>
            </button>
          </div>

          <div className="my-4 max-w-3xl">
            <h1 className="font-['Barlow_Condensed'] font-black text-3xl sm:text-5xl uppercase tracking-tight text-white leading-none">
              INVENTARIS &amp; STOK GUDANG
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm mt-2 max-w-2xl leading-relaxed">
              Monitoring real-time kuota rak fisik Cicendo &amp; Wonogiri Hub, alokasi matriks varian ukuran (S-XXL), dan kontrol restock konveksi jersey atletik.
            </p>
          </div>

          {/* Live Indicator Badges */}
          <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-white/10 text-[11px] font-mono text-slate-300">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span>STATUS RAK: TERVERIFIKASI</span>
            </div>
            <span className="text-white/30">•</span>
            <div className="flex items-center gap-1.5">
              <Package size={13} className="text-emerald-400" />
              <span>TOTAL KATALOG: {stats.totalItems} MODEL</span>
            </div>
            <span className="text-white/30">•</span>
            <div className="flex items-center gap-1.5">
              <Boxes size={13} className="text-amber-400" />
              <span>TOTAL UNIT FISIK: {stats.totalStockPcs.toLocaleString("id-ID")} PCS</span>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Cards Overview */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-6 rounded-3xl bg-white border border-stone-200/80 shadow-sm">
          <div className="text-xs font-mono font-bold text-stone-500 uppercase tracking-wider">Total Model Produk</div>
          <div className="text-3xl font-black text-slate-900 mt-1.5 font-['Barlow_Condensed'] tracking-tight">
            {stats.totalItems} <span className="text-sm font-sans font-bold text-stone-400 uppercase">Model</span>
          </div>
          <div className="text-[11px] text-stone-400 mt-1">Tercatat di sistem katalog</div>
        </div>

        <div className="p-6 rounded-3xl bg-white border border-stone-200/80 shadow-sm">
          <div className="text-xs font-mono font-bold text-stone-500 uppercase tracking-wider">Total Fisik di Gudang</div>
          <div className="text-3xl font-black text-slate-900 mt-1.5 font-['Barlow_Condensed'] tracking-tight">
            {stats.totalStockPcs.toLocaleString("id-ID")} <span className="text-sm font-sans font-bold text-stone-400 uppercase">pcs</span>
          </div>
          <div className="text-[11px] text-emerald-800 font-semibold mt-1">Ready stock Cicendo &amp; Wonogiri</div>
        </div>

        <div
          onClick={() => setFilterMode(filterMode === "low" ? "all" : "low")}
          className={`p-6 rounded-3xl border cursor-pointer transition-all duration-200 shadow-sm ${
            filterMode === "low"
              ? "bg-[#FAF0ED] border-[#B9382B]/40 ring-2 ring-[#B9382B]/20"
              : "bg-white border-stone-200/80 hover:border-amber-400"
          }`}
        >
          <div className="flex items-center justify-between text-xs font-mono font-bold text-amber-800 uppercase tracking-wider">
            <span>Stok Menipis (≤10)</span>
            <AlertTriangle size={16} />
          </div>
          <div className="text-3xl font-black text-amber-800 mt-1.5 font-['Barlow_Condensed'] tracking-tight">
            {stats.lowStockCount} <span className="text-sm font-sans font-bold text-stone-400 uppercase">Model</span>
          </div>
          <div className="text-[11px] text-amber-700 mt-1">Perlu restock konveksi segera</div>
        </div>

        <div
          onClick={() => setFilterMode(filterMode === "out" ? "all" : "out")}
          className={`p-6 rounded-3xl border cursor-pointer transition-all duration-200 shadow-sm ${
            filterMode === "out"
              ? "bg-[#FAF0ED] border-[#B9382B]/40 ring-2 ring-[#B9382B]/20"
              : "bg-white border-stone-200/80 hover:border-[#B9382B]/50"
          }`}
        >
          <div className="flex items-center justify-between text-xs font-mono font-bold text-[#B9382B] uppercase tracking-wider">
            <span>Stok Habis (0 pcs)</span>
            <TrendingDown size={16} />
          </div>
          <div className="text-3xl font-black text-[#B9382B] mt-1.5 font-['Barlow_Condensed'] tracking-tight">
            {stats.outOfStockCount} <span className="text-sm font-sans font-bold text-stone-400 uppercase">Model</span>
          </div>
          <div className="text-[11px] text-rose-700 mt-1">Barang kosong di rak gudang</div>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
          {[
            { label: "Semua Produk", value: "all", count: stats.totalItems },
            { label: "Stok Menipis", value: "low", count: stats.lowStockCount },
            { label: "Stok Habis", value: "out", count: stats.outOfStockCount },
          ].map((tab) => {
            const isActive = filterMode === tab.value;
            return (
              <button
                key={tab.value}
                onClick={() => setFilterMode(tab.value)}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                  isActive
                    ? tab.value === "out"
                      ? "bg-[#B9382B] text-white shadow-md"
                      : "bg-[#162018] text-white shadow-md"
                    : "bg-white text-stone-600 hover:text-black hover:bg-stone-100 border border-stone-200"
                }`}
              >
                <span>{tab.label}</span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                  isActive ? "bg-white/20 text-white" : "bg-stone-100 text-stone-700"
                }`}>
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        <div className="relative w-full sm:w-auto sm:min-w-[320px]">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari nama produk, SKU, atau kategori..."
            className="w-full pl-11 pr-4 py-2.5 rounded-full bg-white border border-stone-200 text-xs text-stone-900 placeholder:text-stone-400 focus:outline-none focus:border-[#162018] shadow-xs transition-all font-mono"
          />
        </div>
      </div>

      {/* Product Inventory Cards (Spacious, Structured, Zero Horizontal Squeezing) */}
      {loading ? (
        <ScreenLoader label="Memuat inventaris produk..." />
      ) : filteredProducts.length === 0 ? (
        <EmptyState
          title="Tidak Ada Produk Ditemukan"
          description="Tidak ada data stok yang sesuai dengan filter atau kata kunci pencarian Anda."
        />
      ) : (
        <div className="space-y-4">
          {filteredProducts.map((product) => {
            const sizeStocks = product.sizeStocks || {};
            const totalStock = Number(product.stock || 0);
            const isOutOfStock = totalStock === 0;
            const isLowStock = totalStock > 0 && totalStock <= 10;

            return (
              <div
                key={product.id}
                className="p-5 sm:p-6 rounded-3xl bg-white border border-stone-200/80 hover:border-stone-300 shadow-xs hover:shadow-md transition-all group"
              >
                {/* Upper Tier: Product Info, Stock Status, and Restock Action */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  {/* Left: Thumbnail & Details */}
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="w-16 h-16 sm:w-18 sm:h-18 rounded-2xl bg-stone-100 border border-stone-200 overflow-hidden shrink-0">
                      <img
                        src={product.imageUrl || "https://images.unsplash.com/photo-1517466787929-bc90951d0974?w=200&q=80"}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider bg-stone-100 text-stone-600 border border-stone-200">
                          {product.category?.name || "Apparel"}
                        </span>
                        <span className="text-[10px] font-mono font-bold text-stone-400">
                          SKU #{product.id}
                        </span>
                      </div>
                      <h3 className="text-base sm:text-lg font-bold text-slate-900 truncate group-hover:text-emerald-950 transition-colors">
                        {product.name}
                      </h3>
                      <div className="text-xs font-mono font-bold text-slate-800 mt-0.5">
                        Rp {Number(product.price || 0).toLocaleString("id-ID")}
                      </div>
                    </div>
                  </div>

                  {/* Right: Status Pill, Total Stock, and Main Restock Button */}
                  <div className="flex items-center justify-between md:justify-end gap-5 pt-3 md:pt-0 border-t md:border-t-0 border-stone-100 shrink-0">
                    {/* Status Pill */}
                    <div>
                      {isOutOfStock ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-mono font-black uppercase tracking-wider bg-[#FAF0ED] text-[#B9382B] border border-[#B9382B]/30">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#B9382B] animate-pulse" />
                          HABIS (0 PCS)
                        </span>
                      ) : isLowStock ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-mono font-black uppercase tracking-wider bg-amber-50 text-amber-800 border border-amber-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                          MENIPIS (≤10 PCS)
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-mono font-black uppercase tracking-wider bg-emerald-50 text-emerald-800 border border-emerald-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          READY STOCK
                        </span>
                      )}
                    </div>

                    {/* Total Count */}
                    <div className="text-right">
                      <div className="text-[9px] font-mono uppercase tracking-wider text-stone-400">Total Fisik</div>
                      <div className="font-['Barlow_Condensed'] text-2xl font-black text-slate-900 leading-none">
                        {totalStock} <span className="text-xs font-sans font-bold text-stone-400 uppercase">pcs</span>
                      </div>
                    </div>

                    {/* Restock Button */}
                    <button
                      onClick={() => handleOpenRestock(product)}
                      className="flex items-center gap-1.5 px-4 sm:px-5 py-2.5 rounded-xl bg-[#162018] hover:bg-black text-white font-bold text-xs uppercase tracking-wider transition-all shadow-sm active:scale-95 cursor-pointer"
                    >
                      <Plus size={14} strokeWidth={2.5} />
                      <span>Restock</span>
                    </button>
                  </div>
                </div>

                {/* Lower Tier: Dedicated Full-Width Size Variant Matrix */}
                <div className="mt-4 pt-3.5 border-t border-stone-100">
                  <div className="flex items-center justify-between text-[11px] font-semibold text-stone-500 mb-2.5">
                    <span className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider text-stone-600">
                      <Layers size={13} className="text-[#B9382B]" />
                      Matriks Varian Ukuran Rak:
                    </span>
                    <span className="text-[10px] text-stone-400 font-mono">
                      Klik salah satu ukuran untuk restock instan
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-6 gap-2">
                    {Object.entries(sizeStocks).length > 0 ? (
                      Object.entries(sizeStocks).map(([sizeName, qty]) => {
                        const q = Number(qty || 0);
                        const isSizeOut = q === 0;
                        const isSizeLow = q > 0 && q <= 3;
                        return (
                          <div
                            key={sizeName}
                            onClick={() => handleOpenRestock(product, sizeName)}
                            className={`flex items-center justify-between p-2.5 px-3 rounded-xl border text-xs cursor-pointer transition-all duration-150 hover:shadow-sm hover:-translate-y-0.5 ${
                              isSizeOut
                                ? "bg-[#FAF0ED] border-[#B9382B]/30 text-[#B9382B] hover:border-[#B9382B]"
                                : isSizeLow
                                ? "bg-amber-50/80 border-amber-200 text-amber-900 hover:border-amber-400"
                                : "bg-[#FAF8F4] border-stone-200 text-stone-800 hover:border-stone-400 hover:bg-white"
                            }`}
                            title={`Klik untuk restock ukuran ${sizeName}`}
                          >
                            <div className="flex items-center gap-2">
                              <span className="font-['Barlow_Condensed'] font-black text-sm uppercase px-1.5 py-0.5 rounded bg-white border border-stone-200 shadow-2xs">
                                {sizeName}
                              </span>
                              <span className="font-mono font-bold text-xs">{q} pcs</span>
                            </div>
                            <span className="w-5 h-5 rounded-md bg-white border border-stone-300 flex items-center justify-center text-stone-500 hover:text-black">
                              <Plus size={11} strokeWidth={2.5} />
                            </span>
                          </div>
                        );
                      })
                    ) : (
                      <div className="col-span-full py-2 text-xs text-stone-400 italic">
                        Belum ada matriks ukuran individual. Gunakan tombol restock untuk inisialisasi varian (S, M, L, XL, XXL).
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* QUICK RESTOCK MODAL */}
      {restockProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-md rounded-3xl bg-white border border-stone-200 p-6 shadow-2xl space-y-5 text-slate-900">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <div className="flex items-center gap-2.5">
                <div className="bg-[#162018] p-2.5 rounded-xl text-white">
                  <Plus size={18} strokeWidth={3} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Tambah Stok Masuk Konveksi</h3>
                  <p className="text-[11px] text-stone-500">Penerimaan barang fisik dari pabrik RegarStore</p>
                </div>
              </div>
              <button
                onClick={() => setRestockProduct(null)}
                className="text-stone-400 hover:text-black p-1 rounded-lg hover:bg-stone-100 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleRestockSubmit} className="space-y-4">
              <div className="p-3 rounded-2xl bg-stone-50 border border-stone-200 flex items-center gap-3">
                <img
                  src={restockProduct.imageUrl || "https://images.unsplash.com/photo-1517466787929-bc90951d0974?w=120&q=80"}
                  alt={restockProduct.name}
                  className="w-12 h-12 rounded-xl object-cover bg-stone-200 border border-stone-200"
                />
                <div>
                  <div className="text-xs font-bold text-slate-900 line-clamp-1">{restockProduct.name}</div>
                  <div className="text-[11px] text-stone-500 mt-0.5">
                    Sisa stok saat ini: <strong className="text-slate-900 font-mono">{restockProduct.stock} pcs</strong>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono font-bold text-stone-700 uppercase tracking-wider mb-2">
                  Pilih Varian Ukuran Masuk
                </label>
                <select
                  value={selectedSize}
                  onChange={(e) => setSelectedSize(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-stone-50 border border-stone-200 text-xs text-slate-900 focus:outline-none focus:border-[#162018] font-mono"
                >
                  {Object.keys(restockProduct.sizeStocks || {}).length > 0 ? (
                    Object.entries(restockProduct.sizeStocks).map(([size, qty]) => (
                      <option key={size} value={size}>
                        Ukuran {size} (Saat ini: {qty} pcs)
                      </option>
                    ))
                  ) : (
                    <>
                      <option value="S">Ukuran S</option>
                      <option value="M">Ukuran M</option>
                      <option value="L">Ukuran L</option>
                      <option value="XL">Ukuran XL</option>
                      <option value="XXL">Ukuran XXL</option>
                      <option value="All Size">All Size</option>
                    </>
                  )}
                </select>
              </div>

              <div>
                <label className="block text-xs font-mono font-bold text-stone-700 uppercase tracking-wider mb-2">
                  Jumlah Barang Masuk (+ pcs)
                </label>
                <input
                  type="number"
                  min="1"
                  max="1000"
                  value={restockQty}
                  onChange={(e) => setRestockQty(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-stone-50 border border-stone-200 text-sm font-bold text-slate-900 focus:outline-none focus:border-[#162018] font-mono"
                  placeholder="Contoh: 10, 25, 50"
                  required
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setRestockProduct(null)}
                  className="px-4 py-2 text-xs font-bold text-stone-500 hover:text-black transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={restocking}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#111613] hover:bg-black text-white font-bold text-xs uppercase tracking-wider disabled:opacity-50 transition-all cursor-pointer shadow-md active:scale-95"
                >
                  {restocking && <Loader2 size={14} className="animate-spin" />}
                  <span>Simpan Stok Masuk</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
