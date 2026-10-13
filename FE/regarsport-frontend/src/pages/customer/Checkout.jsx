import { useState, useEffect } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { MapPin, Package, CreditCard, ArrowLeft, ShoppingBag, User, Phone, Building2, FileText, Tag, Check, Loader2 } from "lucide-react";
import toast from "react-hot-toast";

import api from "../../services/api";
import { useCart } from "../../context/CartContext";
import { useAuth } from "../../context/AuthContext";
import { ScreenLoader } from "../../components/common/UiStates";
import MidtransModal from "../../components/common/MidtransModal";

export default function Checkout() {
  const navigate = useNavigate();
  const location = useLocation();

  const { cartItems, loadCart, setSelectedItems } = useCart();

  const { user } = useAuth();

  const [recipientName, setRecipientName] = useState(user?.fullName || user?.full_name || "");
  const [phone, setPhone] = useState(user?.phoneNumber || user?.phone_number || "");
  const [city, setCity] = useState(user?.city || "");
  const [postalCode, setPostalCode] = useState(user?.postalCode || user?.postal_code || "");
  const [streetAddress, setStreetAddress] = useState(user?.address || "");
  const [shippingNotes, setShippingNotes] = useState("");

  // Promo Code / Voucher State
  const [voucherCodeInput, setVoucherCodeInput] = useState("");
  const [appliedVoucher, setAppliedVoucher] = useState(null);
  const [validatingVoucher, setValidatingVoucher] = useState(false);

  // Auto-fill dari data profil pengguna jika baru dimuat
  useEffect(() => {
    if (user) {
      if (!recipientName) setRecipientName(user.fullName || user.full_name || "");
      if (!phone && (user.phoneNumber || user.phone_number)) setPhone(user.phoneNumber || user.phone_number);
      if (!city && user.city) setCity(user.city);
      if (!postalCode && (user.postalCode || user.postal_code)) setPostalCode(user.postalCode || user.postal_code);
      if (!streetAddress && user.address) setStreetAddress(user.address);
    }
  }, [user]);

  const [loading, setLoading] = useState(false);
  const [validationError, setValidationError] = useState("");
  const [createdOrder, setCreatedOrder] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [confirmedItems, setConfirmedItems] = useState(null);

  const directItem = location.state?.directItem;
  const selectedIds = location.state?.selectedItems || [];

  const rawCheckoutItems = directItem
    ? [directItem]
    : selectedIds.length > 0
    ? cartItems.filter((item) => selectedIds.includes(item.id))
    : cartItems;

  const checkoutItems = confirmedItems || rawCheckoutItems;

  const total = checkoutItems.reduce(
    (acc, item) =>
      acc + Number(item.price || item.products?.price || 0) * item.quantity,
    0
  );

  const discount = appliedVoucher ? Number(appliedVoucher.discountAmount || 0) : 0;
  const finalTotal = Math.max(0, total - discount);

  const handleApplyVoucher = async () => {
    if (!voucherCodeInput.trim()) {
      toast.error("Masukkan kode kupon promo terlebih dahulu");
      return;
    }
    try {
      setValidatingVoucher(true);
      const res = await api.post("/orders/vouchers/validate", {
        code: voucherCodeInput.trim().toUpperCase(),
        subtotal: total,
      });
      const vData = res.data?.data || res.data;
      if (vData.valid) {
        setAppliedVoucher(vData);
        toast.success(vData.message || "Kupon berhasil diterapkan!");
      } else {
        setAppliedVoucher(null);
        toast.error(vData.message || "Kupon promo tidak valid");
      }
    } catch (err) {
      setAppliedVoucher(null);
      toast.error(err.response?.data?.message || "Gagal memvalidasi kupon promo");
    } finally {
      setValidatingVoucher(false);
    }
  };

  const handleRemoveVoucher = () => {
    setAppliedVoucher(null);
    setVoucherCodeInput("");
    toast.success("Kupon promo dilepas");
  };

  const handleCheckout = async () => {
    try {
      if (checkoutItems.length === 0) {
        setValidationError("Pilih produk terlebih dahulu");
        return;
      }

      if (!recipientName.trim()) {
        setValidationError("Nama penerima paket wajib diisi");
        return;
      }

      const cleanPhone = phone.trim().replace(/[-\s]/g, "");
      if (!cleanPhone || !/^08\d{8,12}$/.test(cleanPhone)) {
        setValidationError("Nomor WhatsApp/HP wajib diawali 08 dan memiliki 10-13 digit (contoh: 081234567890)");
        return;
      }

      if (!city.trim()) {
        setValidationError("Kota / Kabupaten pengiriman wajib diisi");
        return;
      }

      if (!postalCode.trim() || !/^\d{5}$/.test(postalCode.trim())) {
        setValidationError("Kode pos wajib 5 digit angka (contoh: 40171)");
        return;
      }

      if (!streetAddress.trim() || streetAddress.trim().length < 8) {
        setValidationError("Alamat jalan & nomor rumah wajib diisi lengkap (minimal 8 karakter)");
        return;
      }

      setValidationError("");
      setLoading(true);

      // Harga, nama, dan gambar ditentukan server dari katalog
      const items = checkoutItems.map((item) => ({
        productId: item.productId || item.products?.id || item.id,
        quantity: Number(item.quantity),
        size: item.size || "L",
        customName: item.customName || null,
        customNumber: item.customNumber || null,
        customCollar: item.customCollar || null,
        customTeam: item.customTeam || null,
      }));

      const orderResponse = await api.post("/orders/checkout", {
        shippingAddress: streetAddress.trim(),
        recipientName: recipientName.trim(),
        customerPhone: cleanPhone,
        shippingCity: city.trim(),
        shippingPostalCode: postalCode.trim(),
        shippingNotes: shippingNotes.trim(),
        voucherCode: appliedVoucher?.code || null,
        items,
      });

      const orderData = orderResponse.data?.data;
      setCreatedOrder(orderData);

      // Snapshot checkout items so unmount doesn't occur during cart refresh
      setConfirmedItems(checkoutItems);

      // Refresh cart and clear selected items
      await loadCart();
      setSelectedItems([]);
      setValidationError("");

      toast.success("Pesanan berhasil dibuat!");
      // Directly trigger Midtrans payment modal on checkout page
      setShowPaymentModal(true);
    } catch (error) {
      const msg = error.response?.data?.message || "Checkout pesanan gagal";
      setValidationError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentSuccess = (order) => {
    const targetId = order?.id || createdOrder?.id;
    navigate(`/dashboard/orders/${targetId}`);
  };

  const handlePaymentClose = () => {
    setShowPaymentModal(false);
    if (createdOrder?.id) {
      toast("Pesanan disimpan. Anda dapat menyelesaikan pembayaran kapan saja di Rincian Pesanan.", {
        icon: "ℹ️",
      });
      navigate(`/dashboard/orders/${createdOrder.id}`);
    }
  };

  if (loading && checkoutItems.length === 0) {
    return <ScreenLoader label="Menyiapkan checkout..." />;
  }

  if (!createdOrder && !showPaymentModal && checkoutItems.length === 0) {
    return (
      <div className="bg-[#FAF8F4] min-h-screen py-16 text-[#111613] font-sans-body">
        <div className="mx-auto max-w-lg px-4 text-center">
          <div className="mb-4 inline-flex p-4 rounded-3xl bg-white border border-[#162018]/10 shadow-sm text-slate-400">
            <ShoppingBag size={36} />
          </div>
          <h1 className="font-condensed text-3xl font-black uppercase text-[#162018]">
            Belum Ada Produk yang Dipilih
          </h1>
          <p className="mt-2 text-xs font-mono text-slate-500 leading-relaxed">
            Pilih item dari keranjang belanja atau gunakan tombol &apos;Beli Sekarang&apos; pada katalog produk olahraga.
          </p>
          <div className="mt-6 flex justify-center">
            <Link
              to="/dashboard/cart"
              className="inline-flex items-center gap-2 rounded-xl bg-[#162018] px-6 py-3 text-xs font-mono font-bold text-white uppercase hover:bg-black transition shadow-xs"
            >
              <ShoppingBag size={15} />
              <span>Buka Keranjang Belanja</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#FAF8F4] min-h-screen py-8 sm:py-12 text-[#111613] font-sans-body animate-fade-in">
      <div className="mx-auto max-w-4xl px-4 sm:px-6">

        {/* Step Progress Bar */}
        <div className="mb-6 flex items-center justify-between gap-2 max-w-md mx-auto text-xs font-mono">
          <div className="flex items-center gap-1.5 text-emerald-700 font-bold">
            <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px]">✓</span>
            <span className="hidden sm:inline">1. Keranjang</span>
          </div>
          <span className="h-0.5 flex-1 bg-[#162018]/15" />
          <div className="flex items-center gap-1.5 text-[#162018] font-black">
            <span className="w-5 h-5 rounded-full bg-[#162018] text-amber-300 flex items-center justify-center text-[10px]">2</span>
            <span>2. Pengiriman & Tim</span>
          </div>
          <span className="h-0.5 flex-1 bg-[#162018]/15" />
          <div className="flex items-center gap-1.5 text-slate-400">
            <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center text-[10px]">3</span>
            <span className="hidden sm:inline">3. Pembayaran</span>
          </div>
        </div>

        {/* Back navigation */}
        <div className="mb-4">
          <Link
            to={directItem ? -1 : "/dashboard/cart"}
            className="inline-flex items-center gap-1.5 rounded-full bg-white px-3.5 py-1.5 text-xs font-mono font-bold text-slate-700 border border-[#162018]/15 hover:border-[#162018] hover:text-[#162018] transition shadow-2xs group"
          >
            <ArrowLeft size={14} className="transition-transform group-hover:-translate-x-0.5" />
            <span>{directItem ? "Kembali ke Produk" : "Kembali ke Keranjang"}</span>
          </Link>
        </div>

        <div className="rounded-3xl border border-[#162018]/10 bg-white p-6 shadow-sm ring-1 ring-black/5 sm:p-8 relative overflow-hidden">
          {/* Subtle Topographic Watermark */}
          <div className="absolute top-0 right-0 w-80 h-80 bg-topography opacity-[0.03] pointer-events-none" />

          <div className="flex flex-wrap items-center justify-between gap-3 pb-6 border-b border-[#162018]/10 relative z-10">
            <div>
              <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block">
                Atelier Cicendo Bandung // Direct Order
              </span>
              <h1 className="font-condensed text-2xl sm:text-3xl font-black uppercase tracking-tight text-[#162018]">
                Checkout Pesanan &amp; Verifikasi Tim
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                Lengkapi alamat pengiriman dan periksa rincian sablon tim sebelum melanjutkan ke Midtrans.
              </p>
            </div>
            <span className="rounded-full bg-[#162018] px-3.5 py-1 text-xs font-mono font-bold text-amber-300 shadow-xs">
              {checkoutItems.length} Item Siap Cetak
            </span>
          </div>

          {/* Shipping Information Section */}
          <div className="mt-6 space-y-4 relative z-10">
            <div className="flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-sm sm:text-base font-bold text-[#162018] uppercase tracking-wider font-mono">
                <MapPin size={16} className="text-emerald-600" />
                Data Penerima &amp; Alamat Ekspedisi
              </h2>
              <span className="text-xs text-slate-400 font-mono hidden sm:inline">
                *Wajib lengkap untuk resi kurir
              </span>
            </div>

            {(user?.address || user?.phoneNumber) && (
              <div className="flex items-center justify-between rounded-xl bg-[#FAF8F4] border border-[#162018]/10 px-4 py-2.5 text-xs text-slate-700">
                <span className="flex items-center gap-1.5 font-medium">
                  ✨ Data alamat terisi otomatis dari profil kapten Anda.
                </span>
                <Link to="/dashboard/profile" className="font-bold font-mono text-[#162018] underline hover:text-emerald-700">
                  Kelola Profil
                </Link>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Nama Penerima */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5 font-mono flex items-center gap-1.5">
                  <User size={13} className="text-slate-400" />
                  Nama Lengkap Penerima <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Abu Dujanah Siregar"
                  value={recipientName}
                  onChange={(e) => setRecipientName(e.target.value)}
                  className="w-full rounded-xl border border-[#162018]/15 bg-[#FAF8F4] px-4 py-2.5 text-sm text-slate-900 transition placeholder:text-slate-400 focus:border-[#162018] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#162018]"
                  required
                />
              </div>

              {/* No WhatsApp / HP */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5 font-mono flex items-center gap-1.5">
                  <Phone size={13} className="text-slate-400" />
                  No. WhatsApp Aktif (Untuk Resi) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="tel"
                  placeholder="Contoh: 081234567890"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full rounded-xl border border-[#162018]/15 bg-[#FAF8F4] px-4 py-2.5 text-sm text-slate-900 transition placeholder:text-slate-400 focus:border-[#162018] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#162018] font-mono"
                  required
                />
              </div>

              {/* Kota / Kabupaten */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5 font-mono flex items-center gap-1.5">
                  <Building2 size={13} className="text-slate-400" />
                  Kota / Kabupaten Tujuan <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Kota Bandung / Jakarta Selatan"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full rounded-xl border border-[#162018]/15 bg-[#FAF8F4] px-4 py-2.5 text-sm text-slate-900 transition placeholder:text-slate-400 focus:border-[#162018] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#162018]"
                  required
                />
              </div>

              {/* Kode Pos */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5 font-mono">
                  Kode Pos (5 Digit) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  maxLength={5}
                  placeholder="Contoh: 40171"
                  value={postalCode}
                  onChange={(e) => setPostalCode(e.target.value.replace(/\D/g, ""))}
                  className="w-full rounded-xl border border-[#162018]/15 bg-[#FAF8F4] px-4 py-2.5 text-sm text-slate-900 transition placeholder:text-slate-400 focus:border-[#162018] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#162018] font-mono"
                  required
                />
              </div>
            </div>

            {/* Alamat Jalan Lengkap */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5 font-mono">
                Alamat Lengkap &amp; Patokan Penerima <span className="text-rose-500">*</span>
              </label>
              <textarea
                placeholder="Tuliskan nama jalan, nomor bangunan, RT/RW, kelurahan, kecamatan, dan patokan rumah..."
                value={streetAddress}
                onChange={(e) => setStreetAddress(e.target.value)}
                rows="3"
                className="w-full rounded-xl border border-[#162018]/15 bg-[#FAF8F4] p-3.5 text-sm text-slate-900 transition placeholder:text-slate-400 focus:border-[#162018] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#162018] resize-none"
                required
              />
            </div>

            {/* Catatan untuk Kurir */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5 font-mono flex items-center gap-1.5">
                <FileText size={13} className="text-slate-400" />
                Catatan Pengiriman Khusus (Opsional)
              </label>
              <input
                type="text"
                placeholder="Contoh: Hubungi via WA sebelum kirim, titip pos satpam jika tidak di rumah"
                value={shippingNotes}
                onChange={(e) => setShippingNotes(e.target.value)}
                className="w-full rounded-xl border border-[#162018]/15 bg-[#FAF8F4] px-4 py-2 text-xs sm:text-sm text-slate-900 transition placeholder:text-slate-400 focus:border-[#162018] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#162018]"
              />
            </div>
          </div>

          {validationError ? (
            <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs sm:text-sm font-semibold text-rose-700 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />
              <span>{validationError}</span>
            </div>
          ) : null}

          {/* Order Summary */}
          <div className="mt-8 border-t border-[#162018]/10 pt-6 relative z-10">
            <h2 className="flex items-center gap-2 text-sm sm:text-base font-bold text-[#162018] uppercase tracking-wider font-mono mb-4">
              <Package size={16} className="text-emerald-600" />
              Rincian Item yang Dipesan ({checkoutItems.length} Produk)
            </h2>

            <div className="space-y-3">
              {checkoutItems.map((item, index) => {
                const name = item.productName || item.products?.name || item.name;
                const img =
                  item.productImage ||
                  item.products?.image_url ||
                  item.imageUrl ||
                  item.image_url ||
                  "https://images.unsplash.com/photo-1517466787929-bc90951d0974?w=400&q=80";
                const price = Number(item.price || item.products?.price || 0);

                return (
                  <div
                    key={item.id || index}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-[#162018]/10 bg-[#FAF8F4] p-3.5 text-sm"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <img
                        src={img}
                        alt={name}
                        className="h-12 w-12 shrink-0 rounded-xl object-cover bg-white border border-[#162018]/10"
                        onError={(e) => {
                          e.currentTarget.onerror = null;
                          e.currentTarget.src = "https://images.unsplash.com/photo-1517466787929-bc90951d0974?w=400&q=80";
                        }}
                      />
                      <div className="min-w-0">
                        <p className="font-condensed font-bold uppercase tracking-tight text-slate-900 truncate">
                          {name}
                        </p>
                        <div className="flex flex-wrap items-center gap-2 mt-0.5">
                          <span className="text-xs font-mono text-slate-500">Jumlah: {item.quantity} pcs</span>
                          {item.size && (
                            <span className="inline-flex items-center rounded-md bg-[#162018] px-1.5 py-0.5 text-[10px] font-black font-mono text-white">
                              SIZE {item.size}
                            </span>
                          )}
                        </div>
                        {item.customName && (
                          <p className="text-[11px] font-mono text-emerald-800 font-bold mt-1 bg-white px-2 py-0.5 rounded-md border border-emerald-200/60 w-fit">
                            🎽 Sablon: {item.customName} #{item.customNumber || "-"} {item.customCollar && `(${item.customCollar})`}
                          </p>
                        )}
                      </div>
                    </div>

                    <span className="font-mono font-black text-[#B9382B] text-base self-end sm:self-center">
                      Rp {(price * item.quantity).toLocaleString("id-ID")}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Promo Code / Voucher Box */}
            <div className="mt-6 pt-5 border-t border-[#162018]/10">
              <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-wider text-slate-600 mb-2.5">
                <Tag size={14} className="text-emerald-600" />
                <span>Kupon Diskon Resmi RegarStore</span>
              </div>

              {appliedVoucher ? (
                <div className="flex items-center justify-between p-3.5 rounded-2xl bg-emerald-50 border border-emerald-300">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-full bg-emerald-700 text-white flex items-center justify-center shadow-xs">
                      <Check size={14} strokeWidth={3} />
                    </div>
                    <div>
                      <div className="text-xs font-black text-emerald-950 font-mono">
                        {appliedVoucher.code} (Diskon Aktif)
                      </div>
                      <div className="text-[11px] font-mono text-emerald-700">
                        Potongan harga: -Rp {discount.toLocaleString("id-ID")}
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleRemoveVoucher}
                    className="text-xs font-bold text-rose-600 hover:text-rose-800 px-2.5 py-1 rounded-lg hover:bg-rose-100 transition cursor-pointer font-mono"
                  >
                    Lepas
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={voucherCodeInput}
                    onChange={(e) => setVoucherCodeInput(e.target.value.toUpperCase())}
                    placeholder="Masukkan kode voucher (contoh: REGARJUARA)"
                    className="flex-1 px-4 py-2.5 rounded-xl bg-[#FAF8F4] border border-[#162018]/15 text-xs font-mono font-bold text-slate-900 uppercase focus:outline-none focus:border-[#162018] focus:bg-white"
                  />
                  <button
                    type="button"
                    onClick={handleApplyVoucher}
                    disabled={validatingVoucher || !voucherCodeInput.trim()}
                    className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-[#162018] hover:bg-black text-white text-xs font-bold font-mono uppercase tracking-wider transition disabled:opacity-50 cursor-pointer shrink-0"
                  >
                    {validatingVoucher && <Loader2 size={13} className="animate-spin" />}
                    <span>Terapkan</span>
                  </button>
                </div>
              )}
            </div>

            {/* Rincian Tagihan & Tombol Bayar */}
            <div className="mt-5 pt-4 border-t border-[#162018]/10 space-y-2 text-xs font-mono">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal Produk</span>
                <span className="font-bold text-slate-800">
                  Rp {total.toLocaleString("id-ID")}
                </span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Ongkos Kirim dari Bandung</span>
                <span className="font-bold text-emerald-700">GRATIS (Promo Ekspedisi Atelier)</span>
              </div>
              {appliedVoucher && (
                <div className="flex justify-between text-emerald-700 font-bold">
                  <span>Potongan Voucher ({appliedVoucher.code})</span>
                  <span>-Rp {discount.toLocaleString("id-ID")}</span>
                </div>
              )}
            </div>

            <div className="mt-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-t border-[#162018]/10 pt-5">
              <div>
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 block">
                  Total Tagihan Pembayaran
                </span>
                <h3 className="font-condensed text-3xl font-black text-[#B9382B] tracking-tight">
                  Rp {finalTotal.toLocaleString("id-ID")}
                </h3>
              </div>

              <button
                type="button"
                onClick={handleCheckout}
                disabled={loading}
                className="flex items-center justify-center gap-2 rounded-2xl bg-[#B9382B] hover:bg-[#982D22] px-8 py-4 text-xs font-black font-condensed tracking-wider uppercase text-white shadow-lg shadow-[#B9382B]/25 transition hover:-translate-y-0.5 active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
              >
                <CreditCard size={17} />
                <span>{loading ? "Memproses Order..." : "Bayar Sekarang via Midtrans"}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Direct Midtrans Payment Modal on Checkout */}
        {createdOrder && (
          <MidtransModal
            isOpen={showPaymentModal}
            onClose={handlePaymentClose}
            order={createdOrder}
            onSuccess={handlePaymentSuccess}
          />
        )}
      </div>
    </div>
  );
}