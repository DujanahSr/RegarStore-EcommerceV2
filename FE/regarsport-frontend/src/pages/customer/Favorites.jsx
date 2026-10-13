import { useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  CheckCircle2,
  Heart,
  ShoppingCart,
  Trash2,
  ChevronLeft,
  ShieldCheck,
} from "lucide-react";

import { useWishlist } from "../../context/WishlistContext";
import { useCart } from "../../context/CartContext";
import { CardSkeletonList } from "../../components/common/UiStates";
import { useConfirm } from "../../context/ConfirmContext";

export default function Favorites() {
  const confirm = useConfirm();
  const { wishlistItems, loading, removeWishlist, clearWishlist } = useWishlist();
  const { addToCart } = useCart();
  const [addingId, setAddingId] = useState(null);
  const [clearing, setClearing] = useState(false);

  const handleAddToCart = async (item) => {
    try {
      setAddingId(item.productId || item.id);
      await addToCart(
        {
          id: item.productId || item.id,
          name: item.productName || item.products?.name || "Produk",
          price: item.price || item.products?.price || 0,
          imageUrl: item.productImage || item.products?.image_url || "",
        },
        1,
        "L"
      );
    } finally {
      setAddingId(null);
    }
  };

  const handleClearAll = async () => {
    if (await confirm({ title: "Kosongkan wishlist?", message: "Semua produk akan dihapus dari daftar favorit Anda.", confirmLabel: "Kosongkan", tone: "danger" })) {
      try {
        setClearing(true);
        await clearWishlist();
      } finally {
        setClearing(false);
      }
    }
  };

  return (
    <div className="bg-[#FAF8F4] min-h-screen text-[#111613] font-sans-body py-8 sm:py-12 animate-fade-in">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">

        {/* Top Header & Breadcrumb */}
        <div className="mb-8">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
            <Link
              to="/dashboard"
              className="inline-flex items-center gap-1.5 rounded-full bg-white px-3.5 py-1.5 text-xs font-mono font-bold text-slate-700 border border-[#162018]/15 hover:border-[#162018] hover:text-[#162018] transition shadow-2xs group"
            >
              <ChevronLeft size={14} className="transition-transform group-hover:-translate-x-0.5" />
              <span>Kembali ke Katalog Toko</span>
            </Link>

            <span className="inline-flex items-center gap-2 rounded-full bg-[#162018] px-3.5 py-1.5 text-[11px] font-bold tracking-wider text-emerald-400 uppercase font-mono shadow-xs border border-white/10">
              <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[9px] font-black border border-emerald-500/40">
                WISHLIST
              </span>
              <span>Atelier Cicendo Bandung</span>
            </span>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 border-b border-[#162018]/10 pb-5">
            <div>
              <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-wider text-[#B9382B]">
                <Heart size={14} className="fill-[#B9382B]" />
                <span>Wishlist Apparel &amp; Jersey Tim</span>
              </div>
              <h1 className="mt-1 font-condensed text-3xl sm:text-4xl font-black uppercase tracking-tight text-[#162018]">
                Jersey &amp; Produk Favorit
              </h1>
              <p className="mt-1 text-xs sm:text-sm text-slate-500">
                Simpan rancangan jersey impian dan masukkan ke keranjang belanja kapan saja saat tim Anda siap checkout.
              </p>
            </div>

            {wishlistItems.length > 0 && (
              <div className="flex items-center gap-3">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3.5 py-1.5 text-xs font-mono font-bold text-slate-700 border border-[#162018]/15 shadow-2xs">
                  <CheckCircle2 size={13} className="text-emerald-600" />
                  {wishlistItems.length} Produk Tersimpan
                </span>

                <button
                  type="button"
                  onClick={handleClearAll}
                  disabled={clearing}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-mono font-bold text-slate-600 transition hover:border-rose-300 hover:bg-rose-50 hover:text-rose-600 disabled:opacity-50 cursor-pointer shadow-2xs"
                >
                  <Trash2 size={14} />
                  <span>{clearing ? "Mengosongkan..." : "Kosongkan"}</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {loading ? (
          <CardSkeletonList count={4} />
        ) : wishlistItems.length === 0 ? (
          <div className="relative overflow-hidden rounded-3xl border border-[#162018]/10 bg-white p-8 sm:p-14 text-center shadow-xs">
            {/* Topographic Corak Overlay */}
            <div className="absolute inset-0 bg-topography opacity-20 pointer-events-none" />

            <div className="relative z-10">
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-rose-50 text-rose-500 ring-8 ring-rose-50/50 mb-4 shadow-sm">
                <Heart size={36} className="fill-rose-500/20 stroke-rose-500 stroke-2" />
              </div>

              <h2 className="font-condensed text-2xl sm:text-3xl font-black uppercase tracking-tight text-[#162018]">
                Wishlist Anda Masih Kosong
              </h2>
              <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-slate-500 font-sans">
                Belum ada jersey atau perlengkapan yang disimpan. Jelajahi katalog resmi kami untuk menandai produk pilihan Anda!
              </p>

              <div className="mt-6">
                <Link
                  to="/dashboard"
                  className="inline-flex items-center gap-2 rounded-2xl bg-[#B9382B] hover:bg-[#982D22] px-6 py-3.5 text-xs font-black font-condensed tracking-wider uppercase text-white shadow-md shadow-[#B9382B]/20 transition active:scale-95"
                >
                  <span>Buka Katalog Toko Sekarang</span>
                  <ArrowRight size={15} />
                </Link>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {wishlistItems.map((item) => {
              const prodId = item.productId || item.product_id || item.products?.id || item.id;
              const name = item.productName || item.products?.name || "Produk";
              const price = Number(item.price || item.products?.price || 0);
              const imageUrl =
                item.productImage ||
                item.products?.image_url ||
                "https://images.unsplash.com/photo-1517466787929-bc90951d0974?w=600&q=80";
              const isAdding = addingId === prodId;

              return (
                <div
                  key={item.id || prodId}
                  className="group relative flex flex-col overflow-hidden rounded-3xl bg-white border border-[#162018]/10 shadow-2xs transition duration-300 hover:-translate-y-1 hover:shadow-lg hover:border-[#162018]/30"
                >
                  {/* Product Image */}
                  <div className="relative aspect-square overflow-hidden bg-[#F3EFE7]">
                    <img
                      src={imageUrl}
                      alt={name}
                      className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src =
                          "https://images.unsplash.com/photo-1517466787929-bc90951d0974?w=600&q=80";
                      }}
                    />

                    {/* Top Tactical Badges */}
                    <div className="absolute top-3 left-3 flex flex-col gap-1 pointer-events-none">
                      <span className="inline-flex items-center px-2 py-0.5 rounded bg-[#162018]/90 text-[9px] font-black uppercase tracking-wider text-amber-300 backdrop-blur-xs font-mono">
                        ATELIER BANDUNG
                      </span>
                    </div>

                    {/* Remove Button in Top-Right */}
                    <button
                      type="button"
                      onClick={() => removeWishlist(prodId)}
                      aria-label="Hapus dari wishlist"
                      title="Hapus dari wishlist"
                      className="absolute top-3 right-3 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-slate-400 backdrop-blur-md shadow-sm transition hover:bg-rose-50 hover:text-rose-600 hover:scale-110 cursor-pointer"
                    >
                      <Trash2 size={15} />
                    </button>

                    <div className="absolute bottom-3 left-3">
                      <span className="inline-flex items-center gap-1 rounded-md bg-white/95 px-2 py-0.5 text-[9px] font-bold text-slate-800 shadow-2xs">
                        <ShieldCheck size={11} className="text-emerald-600" />
                        Garansi 100%
                      </span>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex flex-1 flex-col p-5">
                    <Link
                      to={`/dashboard/product/${prodId}`}
                      className="group-hover:text-[#B9382B] transition-colors"
                    >
                      <h2 className="line-clamp-2 font-condensed text-lg font-bold uppercase tracking-tight text-[#162018]">
                        {name}
                      </h2>
                    </Link>

                    <p className="mt-2 font-condensed text-xl font-black text-[#B9382B]">
                      Rp {price.toLocaleString("id-ID")}
                    </p>

                    <div className="mt-auto pt-4 space-y-2">
                      {/* Instant Add to Cart */}
                      <button
                        type="button"
                        onClick={() => handleAddToCart(item)}
                        disabled={isAdding}
                        className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#162018] hover:bg-black py-2.5 px-3 text-xs font-bold font-mono uppercase tracking-wider text-white shadow-xs transition active:scale-[0.98] disabled:opacity-60 cursor-pointer"
                      >
                        <ShoppingCart size={14} />
                        <span>{isAdding ? "Menambahkan..." : "+ Keranjang"}</span>
                      </button>

                      {/* View Details Link */}
                      <Link
                        to={`/dashboard/product/${prodId}`}
                        className="w-full flex items-center justify-center gap-1.5 rounded-xl border border-[#162018]/15 bg-[#FAF8F4] py-2 px-3 text-xs font-mono font-bold text-slate-700 transition hover:bg-white hover:border-[#162018]/40"
                      >
                        <span>Rincian Produk</span>
                        <ArrowRight size={13} />
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}