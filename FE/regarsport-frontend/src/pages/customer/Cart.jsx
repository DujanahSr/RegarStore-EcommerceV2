import { Link } from "react-router-dom";
import { useMemo } from "react";
import {
  CheckSquare,
  Square,
  Trash2,
  Minus,
  Plus,
  ShoppingCart,
  ArrowRight,
  Package,
  ShieldCheck,
  Truck,
  ChevronLeft,
} from "lucide-react";
import { useCart } from "../../context/CartContext";
import {
  CardSkeletonList,
} from "../../components/common/UiStates";

export default function Cart() {
  const {
    cartItems,
    loading,
    removeFromCart,
    increaseQty,
    decreaseQty,
    selectedItems,
    toggleSelectItem,
    selectAllItems,
  } = useCart();

  const total = useMemo(
    () =>
      cartItems
        .filter((item) => selectedItems.includes(item.id))
        .reduce(
          (sum, item) => sum + Number(item.products?.price ?? item.price ?? 0) * item.quantity,
          0
        ),
    [cartItems, selectedItems]
  );

  const isAllSelected =
    cartItems.length > 0 && selectedItems.length === cartItems.length;

  return (
    <div className="bg-[#FAF8F4] min-h-screen text-[#111613] font-sans-body py-8 sm:py-12 animate-fade-in">
      <div className="mx-auto max-w-5xl px-4 sm:px-6">

        {/* Tactical Breadcrumb & Header */}
        <div className="mb-8">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
            <Link
              to="/dashboard"
              className="inline-flex items-center gap-1.5 rounded-full bg-white px-3.5 py-1.5 text-xs font-mono font-bold text-slate-700 border border-[#162018]/15 hover:border-[#162018] hover:text-[#162018] transition shadow-2xs group"
            >
              <ChevronLeft size={14} className="transition-transform group-hover:-translate-x-0.5" />
              <span>Lanjut Belanja Jersey</span>
            </Link>

            <span className="inline-flex items-center gap-2 rounded-full bg-[#162018] px-3.5 py-1.5 text-[11px] font-bold tracking-wider text-emerald-400 uppercase font-mono shadow-xs border border-white/10">
              <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[9px] font-black border border-emerald-500/40">
                CART
              </span>
              <span>Atelier Cicendo Bandung</span>
            </span>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2 border-b border-[#162018]/10 pb-4">
            <div>
              <h1 className="font-condensed text-3xl sm:text-4xl font-black uppercase tracking-tight text-[#162018]">
                Keranjang Belanja
              </h1>
              <p className="mt-1 text-xs sm:text-sm text-slate-500">
                Pilih jersey dan apparel yang ingin Anda proses ke sesi checkout dan produksi.
              </p>
            </div>

            {!loading && cartItems.length > 0 && (
              <span className="font-mono text-xs font-bold text-slate-600 bg-white px-3 py-1.5 rounded-xl border border-[#162018]/10 w-fit">
                {cartItems.length} Jenis Produk Terdaftar
              </span>
            )}
          </div>
        </div>

        {loading ? (
          <CardSkeletonList count={3} />
        ) : cartItems.length === 0 ? (
          <div className="rounded-3xl border border-[#162018]/10 bg-white p-8 sm:p-14 text-center shadow-xs">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-[#162018]/5 text-[#162018] ring-8 ring-[#162018]/5 mb-4">
              <ShoppingCart size={36} className="text-slate-400" />
            </div>
            <h2 className="font-condensed text-2xl sm:text-3xl font-black uppercase tracking-tight text-[#162018]">
              Keranjang Masih Kosong
            </h2>
            <p className="mt-2 text-sm text-slate-500 max-w-md mx-auto">
              Belum ada jersey atau kit olahraga yang Anda tambahkan. Jelajahi katalog resmi untuk memilih apparel tim Anda.
            </p>
            <div className="mt-6">
              <Link
                to="/dashboard"
                className="inline-flex items-center gap-2 rounded-2xl bg-[#B9382B] hover:bg-[#982D22] px-6 py-3.5 text-xs font-black font-condensed tracking-wider uppercase text-white shadow-md shadow-[#B9382B]/20 transition active:scale-95"
              >
                <ShoppingCart size={16} />
                <span>Buka Katalog Toko Sekarang</span>
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_360px] items-start">

            {/* Left Column: Items List */}
            <div className="space-y-4">

              {/* Select All Bar */}
              <div className="flex items-center justify-between rounded-2xl bg-white px-5 py-4 border border-[#162018]/10 shadow-2xs">
                <button
                  type="button"
                  onClick={selectAllItems}
                  className="flex items-center gap-3 transition hover:opacity-80 cursor-pointer"
                  aria-label={isAllSelected ? "Batal pilih semua" : "Pilih semua produk"}
                >
                  {isAllSelected ? (
                    <CheckSquare size={20} className="text-[#162018]" />
                  ) : (
                    <Square size={20} className="text-slate-400" />
                  )}
                  <span className="text-xs sm:text-sm font-bold text-[#162018] uppercase tracking-wider font-mono">
                    Pilih Semua ({cartItems.length} Produk)
                  </span>
                </button>

                <span className="rounded-full bg-[#FAF8F4] border border-[#162018]/10 px-3 py-1 text-[11px] font-mono font-bold text-slate-600">
                  {selectedItems.length} dipilih
                </span>
              </div>

              {/* Cart Items Cards */}
              {cartItems.map((item) => {
                const isSelected = selectedItems.includes(item.id);
                const itemPrice = Number(item.products?.price ?? item.price ?? 0);
                const subtotal = itemPrice * item.quantity;
                const itemName = item.products?.name || item.productName || "Produk";
                const itemStock = item.products?.stock ?? item.stock ?? 999;
                const itemImage =
                  item.products?.image_url ||
                  item.productImage ||
                  "https://images.unsplash.com/photo-1517466787929-bc90951d0974?w=400&q=80";

                return (
                  <div
                    key={item.id}
                    className={`group relative flex flex-col sm:flex-row gap-4 rounded-2xl bg-white p-4 sm:p-5 border transition-all duration-200 ${
                      isSelected
                        ? "border-[#162018] shadow-sm ring-1 ring-[#162018]/20"
                        : "border-[#162018]/10 hover:border-[#162018]/30 shadow-2xs"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {/* Checkbox */}
                      <button
                        type="button"
                        onClick={() => toggleSelectItem(item.id)}
                        className="mt-1 shrink-0 transition hover:opacity-75 cursor-pointer"
                        aria-label={isSelected ? "Batal pilih" : "Pilih produk"}
                      >
                        {isSelected ? (
                          <CheckSquare size={20} className="text-[#162018]" />
                        ) : (
                          <Square size={20} className="text-slate-400" />
                        )}
                      </button>

                      {/* Product Thumbnail */}
                      <div className="h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-[#F3EFE7] border border-[#162018]/10">
                        <img
                          src={itemImage}
                          alt={itemName}
                          className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                          onError={(e) => {
                            e.currentTarget.onerror = null;
                            e.currentTarget.src = "https://images.unsplash.com/photo-1517466787929-bc90951d0974?w=400&q=80";
                          }}
                        />
                      </div>
                    </div>

                    {/* Product Info */}
                    <div className="flex flex-1 flex-col justify-between gap-3 min-w-0">
                      <div>
                        <div className="flex items-start justify-between gap-4">
                          <h2 className="font-condensed text-lg font-bold uppercase tracking-tight text-[#162018] line-clamp-2">
                            {itemName}
                          </h2>
                          <button
                            type="button"
                            onClick={() => removeFromCart(item.id)}
                            className="text-slate-400 hover:text-rose-600 transition p-1 rounded-lg hover:bg-rose-50 cursor-pointer shrink-0"
                            title="Hapus dari keranjang"
                            aria-label="Hapus produk"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>

                        {/* Price & Size Tag */}
                        <div className="mt-1.5 flex flex-wrap items-center gap-2">
                          <p className="font-condensed text-lg font-black text-[#B9382B]">
                            Rp {itemPrice.toLocaleString("id-ID")}
                          </p>

                          {item.size && (
                            <span className="inline-flex items-center rounded-md bg-[#162018] px-2 py-0.5 text-[11px] font-mono font-black text-white">
                              SIZE {item.size}
                            </span>
                          )}

                          <span className="inline-flex items-center gap-1 text-[10px] font-mono text-slate-400">
                            <Package size={11} />
                            Stok: {itemStock} pcs
                          </span>
                        </div>

                        {/* Custom Jersey Nameset Badge */}
                        {item.customName && (
                          <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[11px] font-mono font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200/80 w-fit">
                            <span>🎽 SABLON: {item.customName} #{item.customNumber || "-"}</span>
                            {item.customCollar && <span>({item.customCollar})</span>}
                            {item.customTeam && <span>• {item.customTeam}</span>}
                          </div>
                        )}
                      </div>

                      {/* Quantity Control & Subtotal */}
                      <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100">
                        <div className="flex items-center gap-1 rounded-xl border border-[#162018]/15 bg-[#FAF8F4] p-1">
                          <button
                            type="button"
                            onClick={() => decreaseQty(item.id, item.quantity)}
                            className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-700 transition hover:bg-white disabled:opacity-30 cursor-pointer"
                            disabled={item.quantity <= 1}
                            aria-label="Kurangi jumlah"
                          >
                            <Minus size={13} />
                          </button>
                          <span className="min-w-8 text-center text-xs font-mono font-bold text-slate-900">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => increaseQty(item.id, item.quantity)}
                            className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-700 transition hover:bg-white disabled:opacity-30 cursor-pointer"
                            disabled={item.quantity >= itemStock}
                            aria-label="Tambah jumlah"
                          >
                            <Plus size={13} />
                          </button>
                        </div>

                        <p className="text-xs font-mono text-slate-500">
                          Subtotal:{" "}
                          <span className="font-bold text-sm text-[#162018] ml-1">
                            Rp {subtotal.toLocaleString("id-ID")}
                          </span>
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Right Column: Tactical Order Summary */}
            <div className="rounded-3xl border border-[#162018]/10 bg-white p-6 shadow-sm sticky top-20 space-y-5">
              <div className="border-b border-[#162018]/10 pb-4">
                <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block">
                  Estimasi Biaya
                </span>
                <h2 className="font-condensed text-xl font-black uppercase tracking-tight text-[#162018]">
                  Ringkasan Belanja
                </h2>
              </div>

              <div className="space-y-3 text-xs font-mono">
                <div className="flex items-center justify-between text-slate-600">
                  <span>Produk Terpilih</span>
                  <span className="font-bold text-slate-900">{selectedItems.length} Item</span>
                </div>

                <div className="flex items-center justify-between text-slate-600">
                  <span>Atelier Produksi</span>
                  <span className="font-bold text-emerald-700">Cicendo, Bandung</span>
                </div>

                <div className="flex items-center justify-between text-slate-600">
                  <span>Garansi Ukuran</span>
                  <span className="font-bold text-emerald-700">100% Tukar Baru</span>
                </div>

                <div className="h-px bg-slate-100 my-2" />

                <div className="flex items-baseline justify-between pt-1">
                  <span className="font-sans font-bold text-sm text-[#162018]">Total Pembayaran</span>
                  <div className="text-right">
                    <span className="font-condensed text-2xl font-black text-[#B9382B]">
                      Rp {total.toLocaleString("id-ID")}
                    </span>
                    <span className="block text-[10px] text-slate-400 font-sans">
                      *Belum termasuk voucher diskon checkout
                    </span>
                  </div>
                </div>
              </div>

              {selectedItems.length > 0 ? (
                <Link
                  to="/dashboard/checkout"
                  state={{ selectedItems }}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#B9382B] hover:bg-[#982D22] py-4 text-xs font-black font-condensed tracking-wider uppercase text-white shadow-lg shadow-[#B9382B]/25 transition active:scale-[0.98] cursor-pointer"
                >
                  <span>Lanjut ke Checkout ({selectedItems.length})</span>
                  <ArrowRight size={15} />
                </Link>
              ) : (
                <button
                  type="button"
                  disabled
                  className="w-full rounded-2xl bg-slate-100 py-3.5 text-xs font-bold uppercase tracking-wider text-slate-400 cursor-not-allowed text-center"
                >
                  Pilih Produk Terlebih Dahulu
                </button>
              )}

              {/* Security & Logistics Assurances */}
              <div className="pt-4 border-t border-[#162018]/10 space-y-2">
                <div className="flex items-center gap-2 text-[11px] text-slate-600">
                  <ShieldCheck size={14} className="text-emerald-600 shrink-0" />
                  <span>Midtrans Official Payment Gateway</span>
                </div>
                <div className="flex items-center gap-2 text-[11px] text-slate-600">
                  <Truck size={14} className="text-emerald-600 shrink-0" />
                  <span>Ekspedisi Cepat: J&T, JNE, SiCepat</span>
                </div>
              </div>
            </div>

          </div>
        )}
      </div>
    </div>
  );
}