import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  X,
  Plus,
  Minus,
  Trash2,
  ShoppingBag,
  ArrowRight,
  ShieldCheck,
  Truck,
} from "lucide-react";
import { useCart } from "../../context/CartContext";
import { useAuth } from "../../context/AuthContext";

export default function CartSlideOver({ isOpen, onClose }) {
  const { cartItems, increaseQty, decreaseQty, removeFromCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  // Close on ESC
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Prevent background scroll
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const totalItems = cartItems.reduce((acc, item) => acc + (item.quantity || 1), 0);
  const subtotal = cartItems.reduce((acc, item) => {
    const price = Number(item.price || item.products?.price || 0);
    const qty = Number(item.quantity || 1);
    return acc + price * qty;
  }, 0);

  const handleCheckoutClick = () => {
    onClose();
    if (!user) {
      navigate("/login?redirect=/dashboard/checkout");
    } else {
      navigate("/dashboard/cart");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity animate-fade-in"
        onClick={onClose}
      />

      {/* Slide-out Drawer Panel */}
      <div className="relative z-10 w-full max-w-md bg-[#FAF8F4] text-[#111613] flex flex-col h-full shadow-2xl border-l border-black/10 animate-slide-in-right">
        {/* Header */}
        <div className="p-5 border-b border-black/10 flex items-center justify-between bg-white">
          <div className="flex items-center gap-2">
            <span className="font-condensed text-2xl font-bold tracking-wide uppercase">
              KERANJANG ( {totalItems} )
            </span>
          </div>
          <button
            onClick={onClose}
            className="flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-slate-500 hover:text-black px-2.5 py-1 rounded-full border border-black/10 hover:border-black/30 transition-all cursor-pointer"
          >
            <X size={15} />
            <span>MENUTUP</span>
          </button>
        </div>

        {/* Promo Announcement Banner */}
        <div className="px-5 py-3 bg-[#EAE3D5]/60 border-b border-black/5 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-[#18221B] font-semibold">
            <Truck size={15} className="text-emerald-700 shrink-0" />
            <span>
              {subtotal >= 250000 ? (
                <span className="text-emerald-800 font-bold">🎉 Selamat! Anda Mendapatkan Bebas Ongkir</span>
              ) : (
                <span>Tambah Rp {(250000 - subtotal).toLocaleString("id-ID")} lagi untuk <b>Gratis Ongkir</b></span>
              )}
            </span>
          </div>
        </div>

        {/* Drawer Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {cartItems.length === 0 ? (
            <div className="py-16 text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-black/5 flex items-center justify-center mx-auto text-slate-400">
                <ShoppingBag size={28} />
              </div>
              <div className="space-y-1">
                <h4 className="font-condensed text-xl font-bold uppercase text-slate-800">
                  KERANJANG BELANJA ANDA KOSONG
                </h4>
                <p className="text-xs text-slate-500 max-w-xs mx-auto">
                  Jelajahi koleksi jersey custom dry-fit berkualitas juara untuk tim Anda.
                </p>
              </div>

              <button
                onClick={onClose}
                className="mt-4 px-6 py-3 rounded-full bg-[#111613] hover:bg-black text-white font-bold text-xs uppercase tracking-wider transition-transform hover:scale-105 cursor-pointer shadow-lg"
              >
                LANJUTKAN BERBELANJA
              </button>

              {/* Value Cards */}
              <div className="pt-8 space-y-3 text-left">
                <div className="p-4 rounded-2xl bg-white border border-black/5 flex items-start gap-3 shadow-sm">
                  <ShieldCheck size={20} className="text-emerald-700 shrink-0 mt-0.5" />
                  <div>
                    <div className="text-xs font-bold uppercase text-slate-800">Garansi Tukar Ukuran 100%</div>
                    <div className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                      Salah ukuran saat sampai? Tukar gratis dalam 7 hari tanpa syarat ribet.
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-white border border-black/5 flex items-start gap-3 shadow-sm">
                  <Truck size={20} className="text-emerald-700 shrink-0 mt-0.5" />
                  <div>
                    <div className="text-xs font-bold uppercase text-slate-800">Langsung Dari Atelier Cicendo Bandung</div>
                    <div className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                      Produksi terpusat berstandar atlet profesional dengan tinta sublimasi permanen OEKO-TEX di Cicendo, Bandung.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {cartItems.map((item) => {
                const itemPrice = Number(item.price || item.products?.price || 0);
                const itemImage =
                  item.productImage ||
                  item.products?.image_url ||
                  item.products?.imageUrl ||
                  "https://images.unsplash.com/photo-1517466787929-bc90951d0974?w=300&q=80";

                return (
                  <div
                    key={item.id}
                    className="p-3.5 rounded-2xl bg-white border border-black/5 shadow-sm flex items-center gap-3"
                  >
                    <div className="w-18 h-18 rounded-xl overflow-hidden bg-slate-100 shrink-0 border border-black/5">
                      <img
                        src={itemImage}
                        alt={item.productName || item.products?.name}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-1">
                        <h5 className="text-xs font-bold text-[#111613] line-clamp-1">
                          {item.productName || item.products?.name}
                        </h5>
                        <button
                          onClick={() => removeFromCart(item.id)}
                          className="text-slate-400 hover:text-red-600 p-1 transition-colors cursor-pointer"
                          title="Hapus"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>

                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-black/5 text-slate-600">
                          Ukuran: {item.size || "L"}
                        </span>
                        {item.customName && (
                          <span className="text-[10px] font-semibold text-emerald-700">
                            Custom: {item.customName}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center justify-between mt-2.5">
                        <span className="text-xs font-black text-slate-900">
                          Rp {(itemPrice * (item.quantity || 1)).toLocaleString("id-ID")}
                        </span>

                        <div className="flex items-center border border-black/10 rounded-full overflow-hidden bg-slate-50">
                          <button
                            onClick={() => decreaseQty(item.id, item.quantity)}
                            className="p-1 px-2 hover:bg-black/10 text-slate-700 transition-colors cursor-pointer"
                          >
                            <Minus size={12} />
                          </button>
                          <span className="px-2 text-xs font-bold text-slate-800">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => increaseQty(item.id, item.quantity)}
                            className="p-1 px-2 hover:bg-black/10 text-slate-700 transition-colors cursor-pointer"
                          >
                            <Plus size={12} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer Subtotal & Checkout */}
        {cartItems.length > 0 && (
          <div className="p-5 border-t border-black/10 bg-white space-y-3 shadow-lg">
            <div className="flex items-center justify-between text-sm">
              <span className="font-bold text-slate-600 uppercase text-xs tracking-wider">Subtotal</span>
              <span className="font-black text-lg text-[#111613]">
                Rp {subtotal.toLocaleString("id-ID")}
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Pajak dan biaya ongkir dihitung otomatis saat proses checkout.
            </p>

            <button
              onClick={handleCheckoutClick}
              className="w-full py-3.5 rounded-full bg-[#111613] hover:bg-black text-white font-extrabold text-xs tracking-wider uppercase flex items-center justify-center gap-2 transition-all hover:scale-[1.02] cursor-pointer shadow-xl"
            >
              <span>LANJUTKAN CHECKOUT</span>
              <ArrowRight size={16} />
            </button>

            <Link
              to="/dashboard/cart"
              onClick={onClose}
              className="block w-full text-center text-xs font-bold text-slate-600 hover:text-black py-1 transition-colors"
            >
              Lihat Detail Keranjang Penuh
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
