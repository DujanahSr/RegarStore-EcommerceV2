/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useState, Component } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  Calendar,
  CreditCard,
  MapPin,
  Package,
  Wallet,
  ArrowLeft,
  CheckCircle2,
  Clock,
  Truck,
  Box,
  AlertCircle,
  Copy,
  Check,
  Star,
  X,
  PackageCheck,
  Camera,
  ImagePlus,
  Loader2,
  Printer,
  FileText,
  RotateCcw,
  ExternalLink,
  Ban,
  Phone,
  ShieldCheck,
  Tag,
} from "lucide-react";
import toast from "react-hot-toast";

import api from "../../services/api";
import { ScreenLoader } from "../../components/common/UiStates";
import MidtransModal from "../../components/common/MidtransModal";
import InvoiceModal from "../../components/customer/InvoiceModal";
import WarrantyClaimModal from "../../components/customer/WarrantyClaimModal";
import { useAuth } from "../../context/AuthContext";
import { useCart } from "../../context/CartContext";
import { useConfirm } from "../../context/ConfirmContext";

const ORDER_STEPS = [
  { key: "PENDING", label: "Pesanan Dibuat", icon: Clock },
  { key: "PAID", label: "Pembayaran Lunas", icon: CreditCard },
  { key: "PROCESSING", label: "Sedang Diproses", icon: Box },
  { key: "SHIPPED", label: "Dalam Pengiriman", icon: Truck },
  { key: "COMPLETED", label: "Selesai", icon: CheckCircle2 },
];

const STATUS_RANK = {
  PENDING: 1,
  PAID: 2,
  PROCESSING: 3,
  SHIPPED: 4,
  COMPLETED: 5,
  CANCELLED: -1,
};

function OrderDetailContent() {
  const confirm = useConfirm();
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { addToCart } = useCart();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [copiedResi, setCopiedResi] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [reordering, setReordering] = useState(false);

  // Review Modal State
  const [reviewItem, setReviewItem] = useState(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [reviewImages, setReviewImages] = useState([]);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewedProductIds, setReviewedProductIds] = useState(new Set());

  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState("Ingin mengubah varian ukuran produk");
  const [cancelling, setCancelling] = useState(false);

  // Official Warranty Claim States
  const [claims, setClaims] = useState([]);
  const [showWarrantyModal, setShowWarrantyModal] = useState(false);

  const handleReorder = async () => {
    try {
      setReordering(true);
      const items = order?.items || order?.order_items || [];
      if (!items.length) {
        toast.error("Rincian produk tidak dapat dimuat untuk pesan ulang");
        return;
      }
      for (const it of items) {
        await addToCart(
          {
            id: it.productId || it.products?.id,
            name: it.productName || it.products?.name,
            price: it.price || it.products?.price,
            imageUrl: it.productImage || it.products?.image_url,
          },
          it.quantity || 1,
          it.size || "L",
          {
            customName: it.customName || null,
            customNumber: it.customNumber || null,
            customCollar: it.customCollar || null,
            customTeam: it.customTeam || null,
          }
        );
      }
      toast.success(`${items.length} item berhasil dimasukkan kembali ke keranjang!`);
      navigate("/dashboard/cart");
    } catch (err) {
      console.error(err);
      toast.error("Gagal melakukan pemesanan ulang");
    } finally {
      setReordering(false);
    }
  };

  const handleCopyResi = (resi) => {
    if (!resi) return;
    navigator.clipboard.writeText(resi);
    setCopiedResi(true);
    toast.success("Nomor resi berhasil disalin!");
    setTimeout(() => setCopiedResi(false), 2000);
  };

  const getCourierTrackingUrl = (courier, resi) => {
    const c = (courier || "").toLowerCase();
    const cleanResi = encodeURIComponent((resi || "").trim());
    if (c.includes("j&t") || c.includes("jet")) return `https://www.jet.co.id/track`;
    if (c.includes("jne")) return `https://www.jne.co.id/id/tracking/trace`;
    if (c.includes("sicepat")) return `https://www.sicepat.com/checkAwb`;
    if (c.includes("anteraja")) return `https://anteraja.id/tracking`;
    if (c.includes("pos")) return `https://www.posindonesia.co.id/id/tracking`;
    if (c.includes("ninja")) return `https://www.ninjaxpress.co/id-id/tracking`;
    return `https://cekresi.com/?noresi=${cleanResi}`;
  };

  const handleCancelOrder = async (e) => {
    e.preventDefault();
    try {
      setCancelling(true);
      await api.patch(`/orders/${id}/cancel`, { reason: cancelReason });
      toast.success("Pesanan berhasil dibatalkan");
      setShowCancelModal(false);
      getOrder(true);
    } catch (err) {
      toast.error(err.response?.data?.message || "Gagal membatalkan pesanan");
    } finally {
      setCancelling(false);
    }
  };

  const handleWhatsAppSupport = () => {
    if (!order) return;
    const orderNum = order.orderNumber || `#${order.id}`;
    const recipient = order.recipientName || order.customerName || "Pelanggan";
    const itemNames = (order.items || []).map((it) => it.productName || it.name || "Apparel").join(", ");
    const text = encodeURIComponent(
      `Halo Customer Service PT RegarStore Indonesia,\n\nSaya ingin konsultasi Garansi / Tukar Ukuran untuk pesanan:\n• No Order: ${orderNum}\n• Atas Nama: ${recipient}\n• Produk: ${itemNames}\n\nMohon petunjuk prosedur klaim penukaran ukuran atau garansi. Terima kasih!`
    );
    window.open(`https://wa.me/6281234567890?text=${text}`, "_blank");
  };

  const handleCompleteOrder = async () => {
    if (!(await confirm({ title: "Selesaikan pesanan ini?", message: "Pastikan paket sudah Anda terima dengan baik. Status pesanan akan menjadi Selesai.", confirmLabel: "Ya, Sudah Diterima" }))) return;
    try {
      setCompleting(true);
      await api.patch(`/orders/${id}/complete`);
      toast.success("Pesanan telah selesai! Terima kasih atas pesanan Anda.");
      getOrder(true);
    } catch (err) {
      toast.error(err.response?.data?.message || "Gagal menyelesaikan pesanan");
    } finally {
      setCompleting(false);
    }
  };

  const handlePhotoUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    if (reviewImages.length + files.length > 3) {
      toast.error("Maksimal 3 foto ulasan untuk produk ini");
      return;
    }
    for (const file of files) {
      if (!["image/jpeg", "image/png", "image/webp", "image/jpg"].includes(file.type)) {
        toast.error("Format foto harus JPG, PNG, atau WEBP");
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Ukuran tiap foto maksimal 5MB");
        return;
      }
    }
    try {
      setUploadingImage(true);
      const newUrls = [];
      for (const file of files) {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("folder", "regarstore/reviews");
        const res = await api.post("/upload", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        const url = res.data?.image_url || res.data?.data?.imageUrl;
        if (url) newUrls.push(url);
      }
      setReviewImages((prev) => [...prev, ...newUrls].slice(0, 3));
      toast.success("Foto ulasan berhasil diunggah!");
    } catch (err) {
      toast.error(err.response?.data?.message || "Gagal mengunggah foto ulasan");
    } finally {
      setUploadingImage(false);
      e.target.value = "";
    }
  };

  const handleRemovePhoto = (indexToRemove) => {
    setReviewImages((prev) => prev.filter((_, i) => i !== indexToRemove));
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!reviewComment.trim()) {
      toast.error("Komentar ulasan tidak boleh kosong");
      return;
    }
    const productId = reviewItem.productId || reviewItem.products?.id;
    if (!productId) {
      toast.error("ID Produk tidak valid");
      return;
    }

    try {
      setSubmittingReview(true);
      await api.post(`/products/${productId}/reviews`, {
        rating: reviewRating,
        comment: reviewComment.trim(),
        customerName: user?.fullName || user?.full_name || user?.name || "Pelanggan RegarStore",
        customerAvatar: user?.avatarUrl || user?.avatar_url || "",
        images: reviewImages,
      });
      toast.success(
        reviewedProductIds.has(productId)
          ? "Ulasan Anda berhasil diperbarui!"
          : "Ulasan Anda berhasil dikirim! Terima kasih."
      );
      setReviewedProductIds((prev) => new Set(prev).add(productId));
      setReviewItem(null);
      setReviewComment("");
      setReviewRating(5);
      setReviewImages([]);
    } catch (err) {
      toast.error(err.response?.data?.message || "Gagal mengirim ulasan");
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleOpenReviewModal = async (item) => {
    setReviewItem(item);
    const productId = item.productId || item.products?.id;
    if (!productId) return;

    // Default values
    setReviewRating(5);
    setReviewComment("");
    setReviewImages([]);

    try {
      const res = await api.get(`/products/${productId}/my-review`);
      const existing = res.data?.data;
      if (existing) {
        setReviewRating(Number(existing.rating) || 5);
        setReviewComment(existing.comment || "");
        setReviewImages(Array.isArray(existing.images) ? existing.images : []);
        setReviewedProductIds((prev) => new Set(prev).add(productId));
      }
    } catch {
      // not yet reviewed
    }
  };

  const getOrder = async (skipLoading = false) => {
    try {
      if (!skipLoading) setLoading(true);
      setError("");
      const res = await api.get(`/orders/${id}`);
      const orderData = res.data?.data || res.data;
      setOrder(orderData);

      // Auto-detect existing reviews for completed orders
      if ((orderData?.status || "").toUpperCase() === "COMPLETED") {
        const items = orderData.items || orderData.order_items || [];
        items.forEach((it) => {
          const pId = it.productId || it.products?.id;
          if (pId) {
            api.get(`/products/${pId}/my-review`).then((r) => {
              if (r.data?.data) {
                setReviewedProductIds((prev) => new Set(prev).add(pId));
              }
            }).catch(() => {});
          }
        });
      }

      // Auto-fetch existing official warranty claims for this order
      if (orderData?.id) {
        api.get(`/warranty-claims/order/${orderData.id}`)
          .then((r) => {
            const list = r.data?.data || (Array.isArray(r.data) ? r.data : []);
            setClaims(list);
          })
          .catch(() => setClaims([]));
      }

      // Auto-sync with Midtrans if still pending
      if (
        (orderData?.status || "").toUpperCase() === "PENDING" &&
        orderData?.orderNumber
      ) {
        api
          .get(`/payments/sync/${orderData.orderNumber}`)
          .then((syncRes) => {
            const status = (
              syncRes.data?.data?.paymentStatus || ""
            ).toUpperCase();
            if (status === "SETTLEMENT" || status === "CAPTURE") {
              api
                .get(`/orders/${id}`)
                .then((r) => setOrder(r.data?.data || r.data));
            }
          })
          .catch(() => {});
      }
    } catch (requestError) {
      console.log(requestError);
      setError("Detail order gagal dimuat.");
      setOrder(null);
    } finally {
      if (!skipLoading) setLoading(false);
    }
  };

  useEffect(() => {
    getOrder();
  }, [id]);

  if (loading) {
    return (
      <div className="bg-[#FAF8F4] min-h-screen py-16 flex items-center justify-center">
        <ScreenLoader label="Memuat detail pesanan & paspor QC..." />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="bg-[#FAF8F4] min-h-screen py-16 text-[#111613] font-sans-body">
        <div className="mx-auto max-w-xl px-4 text-center">
          <div className="mb-4 inline-flex p-4 rounded-3xl bg-white border border-[#162018]/10 shadow-sm text-slate-400">
            <Package size={36} />
          </div>
          <h1 className="font-condensed text-3xl font-black uppercase text-[#162018]">
            {error ? "Detail Pesanan Gagal Dimuat" : "Pesanan Tidak Ditemukan"}
          </h1>
          <p className="mt-2 text-xs font-mono text-slate-500 leading-relaxed">
            {error || "Nomor pesanan yang Anda tuju tidak tersedia atau Anda tidak memiliki hak akses ke pesanan ini."}
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Link
              to="/dashboard/my-orders"
              className="inline-flex items-center gap-2 rounded-xl bg-[#162018] px-5 py-2.5 text-xs font-mono font-bold text-white uppercase hover:bg-black transition shadow-xs"
            >
              <ArrowLeft size={14} />
              <span>Kembali ke Pesanan Saya</span>
            </Link>
            <button
              type="button"
              onClick={() => getOrder()}
              className="inline-flex items-center gap-1.5 rounded-xl border border-[#162018]/20 bg-white px-4 py-2.5 text-xs font-mono font-bold text-slate-800 hover:bg-slate-50 transition cursor-pointer"
            >
              <RotateCcw size={14} />
              <span>Coba Lagi</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  const rawStatus = (order.status || "PENDING").toUpperCase();
  const currentRank = STATUS_RANK[rawStatus] || 1;
  const isCancelled = rawStatus === "CANCELLED";
  const isPending = rawStatus === "PENDING";
  const createdAtDate = new Date(order.createdAt || order.created_at);
  const isExpired =
    (order.cancellationReason && order.cancellationReason.toLowerCase().includes("kedaluwarsa")) ||
    (isPending &&
      !isNaN(createdAtDate.getTime()) &&
      Date.now() - createdAtDate.getTime() > 24 * 60 * 60 * 1000);
  const isPaid = ["PAID", "PROCESSING", "SHIPPED", "COMPLETED"].includes(rawStatus);
  const orderItems = order.items || order.order_items || [];
  const totalAmount = Number(order.totalAmount || order.total_amount || 0);

  return (
    <div className="bg-[#FAF8F4] min-h-screen py-8 sm:py-12 text-[#111613] font-sans-body animate-fade-in">
      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        {/* Tactical Breadcrumb & Origin Pill */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
          <Link
            to="/dashboard/my-orders"
            className="inline-flex items-center gap-1.5 rounded-full bg-white px-3.5 py-1.5 text-xs font-mono font-bold text-slate-700 border border-[#162018]/15 hover:border-[#162018] hover:text-[#162018] transition shadow-2xs group"
          >
            <ArrowLeft size={14} className="transition group-hover:-translate-x-0.5" />
            <span>Kembali ke Pesanan Saya</span>
          </Link>

          <span className="inline-flex items-center gap-2 rounded-full bg-[#162018] px-3.5 py-1.5 text-[11px] font-bold tracking-wider text-emerald-400 uppercase font-mono shadow-xs border border-white/10">
            <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[9px] font-black border border-emerald-500/40">
              QC PASSPORT
            </span>
            <span>Atelier Cicendo Bandung</span>
          </span>
        </div>

        {/* Main Card */}
        <div className="rounded-3xl border border-[#162018]/10 bg-white p-6 shadow-sm ring-1 ring-black/5 sm:p-8 space-y-8 relative overflow-hidden">
          {/* Header */}
          <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-[#162018]/10">
            <div>
              <div className="flex items-center gap-2">
                <Package size={20} className="text-[#162018]" />
                <h1 className="font-mono text-xl sm:text-2xl font-black text-[#162018]">
                  {order.orderNumber || `Order #${order.id}`}
                </h1>
              </div>
              {order.createdAt || order.created_at ? (
                <p className="mt-1 flex items-center gap-1.5 text-xs text-slate-400 font-mono">
                  <Calendar size={12} />
                  Dibuat pada:{" "}
                  {new Date(order.createdAt || order.created_at).toLocaleString("id-ID")}
                </p>
              ) : null}
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              {/* Tombol Cetak / Unduh Dokumen Resmi */}
              <button
                type="button"
                onClick={() => setShowInvoiceModal(true)}
                className={`flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-xs font-mono font-bold uppercase tracking-wider shadow-2xs transition active:scale-95 cursor-pointer ${
                  isPaid
                    ? "bg-emerald-50 text-emerald-800 border border-emerald-300 hover:bg-emerald-100"
                    : isPending
                    ? "bg-amber-50 text-amber-800 border border-amber-300 hover:bg-amber-100"
                    : "bg-[#FAF8F4] text-slate-700 border border-[#162018]/15 hover:bg-white"
                }`}
                title={isPaid ? "Cetak atau Unduh Invoice Resmi Lunas" : "Lihat / Cetak Tagihan Sementara"}
              >
                {isPaid ? <FileText size={14} className="text-emerald-700" /> : <Printer size={14} className="text-amber-700" />}
                <span>{isPaid ? "Invoice Resmi (PDF)" : "Cetak Tagihan"}</span>
              </button>

              {isCancelled ? (
                <div className="flex flex-col items-end gap-1">
                  <span className="rounded-full bg-rose-50 px-3.5 py-1 text-xs font-mono font-bold uppercase tracking-wider text-rose-700 border border-rose-200">
                    Dibatalkan
                  </span>
                  {order.cancellationReason && (
                    <span className="text-[10px] text-slate-500 italic max-w-xs text-right font-mono">
                      Alasan: {order.cancellationReason}
                    </span>
                  )}
                </div>
              ) : isExpired ? (
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-rose-50 px-3.5 py-1 text-xs font-mono font-bold uppercase tracking-wider text-rose-700 border border-rose-200">
                    Kedaluwarsa
                  </span>
                  <button
                    type="button"
                    onClick={handleReorder}
                    disabled={reordering}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-[#162018] hover:bg-black px-4 py-2 text-xs font-mono font-bold text-white shadow-xs transition cursor-pointer disabled:opacity-50"
                  >
                    <RotateCcw size={13} className={reordering ? "animate-spin" : ""} />
                    <span>{reordering ? "Memproses..." : "Pesan Ulang"}</span>
                  </button>
                </div>
              ) : isPending ? (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowCancelModal(true)}
                    className="flex items-center gap-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 px-3.5 py-2 text-xs font-mono font-bold transition active:scale-95 cursor-pointer"
                  >
                    <Ban size={13} />
                    <span>Batalkan</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowModal(true)}
                    className="flex items-center gap-2 rounded-xl bg-[#B9382B] hover:bg-[#982D22] px-5 py-2.5 text-xs font-condensed font-black uppercase tracking-wider text-white shadow-md shadow-[#B9382B]/20 transition hover:-translate-y-0.5 active:scale-95 cursor-pointer"
                  >
                    <CreditCard size={15} />
                    <span>Bayar Sekarang</span>
                  </button>
                </div>
              ) : (
                <span className="rounded-full bg-emerald-50 px-3.5 py-1 text-xs font-mono font-bold uppercase tracking-wider text-emerald-800 border border-emerald-300 flex items-center gap-1.5">
                  <CheckCircle2 size={13} />
                  {order.status}
                </span>
              )}
            </div>
          </div>

          {/* Stepper / Timeline Pelacakan Status Bergaris */}
          {isCancelled ? (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-rose-800 flex items-center gap-3">
              <AlertCircle size={20} className="text-rose-600 shrink-0" />
              <p className="text-sm font-medium">
                Pesanan ini telah dibatalkan dan proses produksi/pengiriman dihentikan.
              </p>
            </div>
          ) : isExpired ? (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-amber-900 flex items-center gap-3">
              <AlertCircle size={20} className="text-amber-600 shrink-0" />
              <div>
                <p className="text-sm font-bold font-mono">
                  Batas Waktu Pembayaran Telah Kedaluwarsa (Melebihi 24 Jam)
                </p>
                <p className="text-xs text-amber-700 mt-0.5">
                  Tagihan pembayaran untuk transaksi lama ini sudah kedaluwarsa di sistem Midtrans. Silakan lakukan pemesanan ulang jersey pilihan Anda.
                </p>
              </div>
            </div>
          ) : (
            <div className="py-2">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-500">
                  Status Progres Pelacakan Pesanan
                </h2>
                <span className="text-xs font-mono font-bold text-emerald-800 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                  Tahap {Math.max(1, currentRank)} dari 5
                </span>
              </div>

              {/* Desktop Stepper Bergaris Aktif */}
              <div className="hidden sm:block relative mb-6 pt-2">
                {/* Garis Dasar Abu-Abu */}
                <div className="absolute top-7 left-12 right-12 h-1 bg-slate-100 rounded-full z-0" />

                {/* Garis Progres Hijau Berjalan */}
                <div
                  className="absolute top-7 left-12 h-1 bg-emerald-600 rounded-full transition-all duration-500 z-0"
                  style={{
                    width: `${Math.min(100, Math.max(0, ((currentRank - 1) / 4) * 85))}%`,
                  }}
                />

                <div className="grid grid-cols-5 relative z-10">
                  {ORDER_STEPS.map((step, idx) => {
                    const stepRank = STATUS_RANK[step.key];
                    const isCompleted = currentRank > stepRank;
                    const isCurrent = currentRank === stepRank;
                    const IconComponent = step.icon;

                    return (
                      <div key={step.key} className="flex flex-col items-center text-center px-1">
                        <div
                          className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-all duration-300 ${
                            isCurrent
                              ? "bg-[#162018] text-amber-300 shadow-md ring-4 ring-[#162018]/15 scale-110"
                              : isCompleted
                              ? "bg-emerald-600 text-white shadow-xs"
                              : "bg-white border-2 border-slate-200 text-slate-400"
                          }`}
                        >
                          {isCompleted ? <Check size={18} strokeWidth={2.5} /> : <IconComponent size={18} />}
                        </div>

                        <span
                          className={`text-xs font-bold mt-3 leading-tight font-mono ${
                            isCurrent
                              ? "text-[#162018] font-black"
                              : isCompleted
                              ? "text-slate-800"
                              : "text-slate-400"
                          }`}
                        >
                          {step.label}
                        </span>

                        <span className="text-[10px] text-slate-400 mt-0.5 leading-tight font-mono">
                          {isCurrent
                            ? "Sedang berlangsung"
                            : isCompleted
                            ? "Selesai"
                            : `Langkah ${idx + 1}`}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Mobile Vertical Stepper */}
              <div className="sm:hidden space-y-4 relative pl-6 border-l-2 border-[#162018]/20 ml-3">
                {ORDER_STEPS.map((step) => {
                  const stepRank = STATUS_RANK[step.key];
                  const isCompleted = currentRank > stepRank;
                  const isCurrent = currentRank === stepRank;
                  const IconComponent = step.icon;

                  return (
                    <div key={step.key} className="relative pb-2 last:pb-0">
                      <div
                        className={`absolute -left-[31px] top-0 w-8 h-8 rounded-full flex items-center justify-center text-xs ${
                          isCurrent
                            ? "bg-[#162018] text-amber-300 ring-4 ring-[#162018]/15 font-bold"
                            : isCompleted
                            ? "bg-emerald-600 text-white"
                            : "bg-white border-2 border-slate-300 text-slate-400"
                        }`}
                      >
                        {isCompleted ? <Check size={13} /> : <IconComponent size={13} />}
                      </div>
                      <div className="ml-2 font-mono">
                        <p
                          className={`text-xs font-bold ${
                            isCurrent
                              ? "text-[#162018] font-black"
                              : isCompleted
                              ? "text-slate-900"
                              : "text-slate-400"
                          }`}
                        >
                          {step.label}
                        </p>
                        <p className="text-[10px] text-slate-400">
                          {isCurrent ? "Sedang dalam tahap ini" : isCompleted ? "Tahap selesai" : `Menunggu antrean`}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Kartu Informasi Pengiriman & Pelacakan Ekspedisi Visual */}
          {(order.shippingCourier || order.trackingNumber || (order.status || "").toUpperCase() === "SHIPPED") && (
            <div className="rounded-3xl border border-[#162018]/15 bg-[#FAF8F4] p-6 shadow-2xs space-y-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <div className="h-12 w-12 rounded-2xl bg-[#162018] text-emerald-400 flex items-center justify-center shrink-0 shadow-sm">
                    <Truck size={22} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono font-black uppercase tracking-wider bg-[#162018] text-amber-300 px-2.5 py-0.5 rounded">
                        {order.shippingCourier || "Ekspedisi Partner"}
                      </span>
                      <span className="text-xs text-slate-500 font-mono">Nomor Resi:</span>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="font-mono text-base font-black text-slate-900 tracking-wider">
                        {order.trackingNumber || "Menunggu penerbitan nomor resi"}
                      </span>
                      {order.trackingNumber && (
                        <button
                          type="button"
                          onClick={() => handleCopyResi(order.trackingNumber)}
                          className="p-1 text-slate-400 hover:text-[#162018] rounded-lg hover:bg-white transition cursor-pointer"
                          title="Salin Nomor Resi"
                        >
                          {copiedResi ? <Check size={15} className="text-emerald-600" /> : <Copy size={15} />}
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {order.trackingNumber && (
                    <button
                      type="button"
                      onClick={() => window.open(getCourierTrackingUrl(order.shippingCourier, order.trackingNumber), "_blank")}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-white text-slate-800 border border-[#162018]/15 hover:border-[#162018] px-4 py-2 text-xs font-mono font-bold shadow-2xs transition active:scale-95 cursor-pointer"
                    >
                      <ExternalLink size={13} />
                      <span>Lacak di Portal Kurir ↗</span>
                    </button>
                  )}

                  {(order.status || "").toUpperCase() === "SHIPPED" && (
                    <button
                      type="button"
                      onClick={handleCompleteOrder}
                      disabled={completing}
                      className="flex items-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-mono font-bold px-4 py-2 shadow-xs transition active:scale-95 disabled:opacity-50 shrink-0 cursor-pointer"
                    >
                      <PackageCheck size={16} />
                      {completing ? "Menyelesaikan..." : "Konfirmasi Diterima"}
                    </button>
                  )}
                </div>
              </div>

              {/* Visual Tracking Ekspedisi Stepper */}
              <div className="p-4 rounded-2xl bg-white border border-[#162018]/10 shadow-2xs">
                <div className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center justify-between">
                  <span>Tahapan Ekspedisi Pengiriman</span>
                  <span className="text-emerald-700 font-semibold font-mono">Atelier Cicendo Bandung Hub</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                  {[
                    {
                      step: "1",
                      title: "QC & Packing Selesai",
                      desc: "Inspeksi 3 lapis & label thermal dicetak di Atelier Bandung",
                      active: true,
                    },
                    {
                      step: "2",
                      title: "Diserahkan ke Kurir",
                      desc: `Paket diserahkan ke ${order.shippingCourier || "ekspedisi partner"}`,
                      active: Boolean(order.trackingNumber),
                    },
                    {
                      step: "3",
                      title: "Dalam Perjalanan",
                      desc: `Menuju kota tujuan (${order.shippingCity || "Tujuan"})`,
                      active: (order.status || "").toUpperCase() === "SHIPPED" || (order.status || "").toUpperCase() === "COMPLETED",
                    },
                    {
                      step: "4",
                      title: "Pesanan Diterima",
                      desc: `Kurir mengantar ke ${order.recipientName || "Penerima"}`,
                      active: (order.status || "").toUpperCase() === "COMPLETED",
                    },
                  ].map((item, idx) => (
                    <div key={idx} className="flex items-start gap-3">
                      <div
                        className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-mono font-bold shrink-0 ${
                          item.active
                            ? "bg-[#162018] text-amber-300 shadow-2xs"
                            : "bg-slate-100 text-slate-400 border border-slate-200"
                        }`}
                      >
                        {item.active ? <Check size={13} strokeWidth={3} /> : item.step}
                      </div>
                      <div>
                        <h5 className={`text-xs font-bold font-mono ${item.active ? "text-slate-900" : "text-slate-400"}`}>
                          {item.title}
                        </h5>
                        <p className="text-[10px] text-slate-500 mt-0.5 leading-relaxed">
                          {item.desc}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

        {/* 3 Pilar Garansi Resmi RegarStore & Klaim Retur */}
        {(() => {
          const isCompleted = (order.status || "").toUpperCase() === "COMPLETED";
          const completedDate = new Date(order.updatedAt || order.createdAt || Date.now());
          const warrantyExpiry = new Date(completedDate.getTime() + 7 * 24 * 60 * 60 * 1000);
          const now = new Date();
          const diffMs = warrantyExpiry.getTime() - now.getTime();
          const isWarrantyActive = isCompleted && diffMs > 0;
          const daysRemaining = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
          const expiryFormatted = warrantyExpiry.toLocaleDateString("id-ID", {
            day: "numeric",
            month: "short",
            year: "numeric",
          });

          return (
            <div className="rounded-3xl border border-white/15 bg-[#162018] text-white p-6 sm:p-7 shadow-sm space-y-5 relative overflow-hidden">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
                <div className="flex items-start sm:items-center gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shrink-0 shadow-xs">
                    <ShieldCheck size={24} />
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="font-condensed text-lg sm:text-xl font-black uppercase tracking-wider text-white">
                        Garansi Resmi RegarStore 100% Bebas Cemas
                      </h4>
                      {isCompleted ? (
                        isWarrantyActive ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                            <Clock size={11} />
                            Garansi Aktif: Sisa {daysRemaining} Hari
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-semibold bg-white/10 text-slate-400 border border-white/10">
                            Garansi 7 Hari Berakhir
                          </span>
                        )
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-medium bg-emerald-500/15 text-emerald-300 border border-emerald-500/20">
                          Aktif Setelah Paket Diterima
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-300 mt-1 font-mono leading-relaxed">
                      {isCompleted
                        ? isWarrantyActive
                          ? `Proteksi tukar ukuran (size exchange) dan ganti baru cacat produksi aktif sampai ${expiryFormatted}.`
                          : "Periode klaim 7 hari telah lewat. Butuh bantuan khusus? Silakan hubungi CS resmi kami."
                        : "Setiap pesanan dilindungi jaminan 100% kepuasan: salah ukuran bisa ditukar, cacat produksi diganti baru."}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2.5 self-start sm:self-center shrink-0 relative z-10">
                  {isCompleted && (
                    <button
                      type="button"
                      onClick={() => setShowWarrantyModal(true)}
                      className="flex items-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-condensed font-black uppercase tracking-wider px-4 py-2.5 shadow-md shadow-emerald-600/20 transition active:scale-95 cursor-pointer"
                    >
                      <ShieldCheck size={15} />
                      <span>Ajukan Klaim Garansi</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={handleWhatsAppSupport}
                    className="flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 hover:bg-white/10 text-white text-xs font-mono font-bold uppercase tracking-wider px-3.5 py-2.5 shadow-xs transition active:scale-95 cursor-pointer"
                  >
                    <Phone size={14} className="text-emerald-400" />
                    <span>WhatsApp CS</span>
                  </button>
                </div>
              </div>

              {/* 3 Pillars Quick Badges */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-4 border-t border-white/10 relative z-10">
                <div className="flex items-center gap-2 bg-white/5 rounded-xl px-3.5 py-2 border border-white/10 text-xs font-mono text-slate-300">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
                  <span className="font-bold text-white">100% Cacat Sablon</span>
                  <span className="text-slate-400">diganti baru</span>
                </div>
                <div className="flex items-center gap-2 bg-white/5 rounded-xl px-3.5 py-2 border border-white/10 text-xs font-mono text-slate-300">
                  <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0" />
                  <span className="font-bold text-white">7 Hari Tukar Ukuran</span>
                  <span className="text-slate-400">jika kurang pas</span>
                </div>
                <div className="flex items-center gap-2 bg-white/5 rounded-xl px-3.5 py-2 border border-white/10 text-xs font-mono text-slate-300">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
                  <span className="font-bold text-white">Jahitan Atletik Kuat</span>
                  <span className="text-slate-400">garansi perbaikan</span>
                </div>
              </div>

              {/* Existing Claim Tickets List */}
              {claims && claims.length > 0 && (
                <div className="mt-4 pt-4 border-t border-white/10 space-y-2 relative z-10">
                  <h5 className="text-xs font-condensed font-black uppercase tracking-wider text-white flex items-center gap-1.5">
                    <FileText size={14} className="text-emerald-400" />
                    Tiket Klaim Garansi Anda ({claims.length})
                  </h5>
                  <div className="grid gap-2.5">
                    {claims.map((c) => {
                      const statusUpper = (c.status || "PENDING").toUpperCase();
                      let statusBadge = "bg-amber-500/20 text-amber-300 border-amber-500/30";
                      let statusText = "Menunggu Verifikasi CS";
                      if (statusUpper === "APPROVED") {
                        statusBadge = "bg-emerald-500/20 text-emerald-300 border-emerald-500/30";
                        statusText = "Disetujui CS";
                      } else if (statusUpper === "PROCESSING") {
                        statusBadge = "bg-blue-500/20 text-blue-300 border-blue-500/30";
                        statusText = "Sedang Diproses";
                      } else if (statusUpper === "RESOLVED") {
                        statusBadge = "bg-emerald-500/20 text-emerald-300 border-emerald-500/30";
                        statusText = "Klaim Selesai";
                      } else if (statusUpper === "REJECTED") {
                        statusBadge = "bg-rose-500/20 text-rose-300 border-rose-500/30";
                        statusText = "Ditolak";
                      }

                      return (
                        <div
                          key={c.id || c.claimNumber}
                          className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-black/40 p-3.5 rounded-2xl border border-white/10 text-xs font-mono"
                        >
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-bold text-white bg-white/10 px-2.5 py-0.5 rounded">
                                #{c.claimNumber}
                              </span>
                              <span className={`px-2.5 py-0.5 rounded-md font-bold text-[10px] border ${statusBadge}`}>
                                {statusText}
                              </span>
                            </div>
                            <p className="text-slate-300 text-xs pt-1">
                              <span className="font-bold text-white">Solusi: </span>
                              {c.solution === "EXCHANGE_SIZE"
                                ? `Tukar Ukuran Baru (${c.requestedSize || "Varian Baru"})`
                                : c.solution === "REPLACEMENT"
                                ? "Produksi Ulang 100%"
                                : "Perbaikan Produk"}
                            </p>
                            {c.description && (
                              <p className="text-slate-400 text-xs italic line-clamp-1">
                                &ldquo;{c.description}&rdquo;
                              </p>
                            )}
                            {c.adminNotes && (
                              <div className="mt-1.5 p-2 rounded-xl bg-emerald-950/60 border border-emerald-500/30 text-xs text-emerald-200">
                                <span className="font-bold">Catatan CS / Gudang: </span>
                                <span>{c.adminNotes}</span>
                              </div>
                            )}
                            {c.replacementTrackingNumber && (
                              <div className="mt-1.5 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-white/5 border border-white/10 text-emerald-300 text-xs font-bold">
                                <Truck size={12} className="text-emerald-400" />
                                <span>Resi Pengganti:</span>
                                <span className="font-mono text-white">{c.replacementTrackingNumber}</span>
                                <button
                                  type="button"
                                  onClick={() => handleCopyResi(c.replacementTrackingNumber)}
                                  className="p-0.5 text-emerald-400 hover:text-white rounded cursor-pointer"
                                  title="Salin Resi Pengganti"
                                >
                                  <Copy size={11} />
                                </button>
                              </div>
                            )}
                          </div>

                          <button
                            type="button"
                            onClick={() => {
                              const text = encodeURIComponent(
                                `Halo CS PT RegarStore Indonesia,\n\nSaya ingin follow-up status Tiket Klaim Garansi:\n• No Tiket: #${c.claimNumber}\n• No Order: ${order.orderNumber || `#${order.id}`}\n• Kategori: ${c.category}\n\nMohon bantuannya untuk update proses klaim. Terima kasih!`
                              );
                              window.open(`https://wa.me/6281234567890?text=${text}`, "_blank");
                            }}
                            className="flex items-center gap-1.5 self-start sm:self-center px-3 py-1.5 rounded-xl border border-white/15 bg-white/5 hover:bg-white/10 text-emerald-400 text-xs font-mono font-bold uppercase tracking-wider transition"
                          >
                            <Phone size={12} />
                            <span>Follow Up WA CS</span>
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })()}

        {/* Info Grid: Customer & Shipping */}
        <div className="grid gap-6 md:grid-cols-2 pt-4 border-t border-[#162018]/10">
          {/* Shipping Address */}
          <div className="rounded-2xl border border-[#162018]/10 bg-[#FAF8F4] p-5 shadow-2xs space-y-3">
            <h3 className="flex items-center gap-2 font-condensed font-black text-sm uppercase tracking-wider text-[#162018]">
              <MapPin size={16} className="text-emerald-700" />
              Alamat Pengiriman
            </h3>
            <div className="text-xs font-mono text-slate-700 leading-relaxed space-y-1">
              <p className="font-bold text-[#162018]">
                {order.recipientName || order.customerName || "Penerima"}
                {(order.customerPhone || order.shippingPhone) && (
                  <span className="font-normal text-slate-500 ml-2">
                    ({order.customerPhone || order.shippingPhone})
                  </span>
                )}
              </p>
              <p>
                {order.shippingAddress ||
                  order.shipping_address ||
                  "Alamat tidak tercantum"}
              </p>
              {(order.shippingCity || order.shippingPostalCode) && (
                <p className="text-slate-500">
                  {[order.shippingCity, order.shippingPostalCode].filter(Boolean).join(", ")}
                </p>
              )}
              {order.shippingNotes && (
                <div className="mt-2.5 p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-800 font-sans-body">
                  <span className="font-bold font-mono">Catatan Kurir:</span> {order.shippingNotes}
                </div>
              )}
            </div>
          </div>

          {/* Payment Summary */}
          <div className="rounded-2xl border border-[#162018]/10 bg-[#FAF8F4] p-5 shadow-2xs space-y-3">
            <h3 className="flex items-center gap-2 font-condensed font-black text-sm uppercase tracking-wider text-[#162018]">
              <Wallet size={16} className="text-emerald-700" />
              Rincian Pembayaran
            </h3>
            <div className="space-y-2 text-xs font-mono">
              <div className="flex justify-between text-slate-600">
                <span>Metode Pembayaran</span>
                <span className="font-bold text-[#162018]">
                  Midtrans Payment Gateway
                </span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Status Transaksi</span>
                <span
                  className={`font-bold ${
                    isPending ? "text-amber-700" : "text-emerald-700"
                  }`}
                >
                  {isPending ? "Menunggu Pembayaran" : "Lunas (Settlement)"}
                </span>
              </div>
              {Number(order.discountAmount || 0) > 0 && (
                <div className="flex justify-between text-emerald-800 font-bold">
                  <span>Kupon Promo ({order.voucherCode || "Diskon"})</span>
                  <span>-Rp {Number(order.discountAmount).toLocaleString("id-ID")}</span>
                </div>
              )}
              <div className="flex justify-between border-t border-[#162018]/10 pt-2 text-[#162018]">
                <span className="font-bold">Total Pembayaran</span>
                <span className="font-black text-emerald-700 text-sm">
                  Rp {totalAmount.toLocaleString("id-ID")}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Ordered Items List */}
        <div className="pt-4 border-t border-[#162018]/10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-condensed text-lg font-black uppercase tracking-wider text-[#162018]">
              Daftar Produk ({orderItems.length} item)
            </h2>
            <span className="text-[11px] font-mono font-bold text-slate-500 uppercase">
              Standar Jahitan Atelier RS
            </span>
          </div>

          <div className="space-y-3">
            {orderItems.map((item, index) => {
              const name = item.productName || item.products?.name;
              const img =
                item.productImage ||
                item.products?.image_url ||
                "https://images.unsplash.com/photo-1517466787929-bc90951d0974?w=600&q=80";
              const price = Number(item.price || item.products?.price || 0);

              return (
                <div
                  key={item.id || index}
                  className="flex items-center justify-between gap-4 rounded-2xl border border-[#162018]/10 bg-[#FAF8F4] p-4 shadow-2xs transition hover:border-[#162018]/25"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <img
                      src={img}
                      alt={name}
                      className="h-16 w-16 shrink-0 rounded-xl object-cover bg-white border border-[#162018]/10 shadow-2xs"
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = "https://images.unsplash.com/photo-1517466787929-bc90951d0974?w=600&q=80";
                      }}
                    />
                    <div className="min-w-0">
                      <h4 className="font-condensed text-base font-black uppercase tracking-wider text-[#162018] truncate">
                        {name}
                      </h4>
                      <div className="flex items-center gap-2 mt-0.5">
                        <p className="text-xs text-slate-500 font-mono">
                          {item.quantity} barang &times; Rp {price.toLocaleString("id-ID")}
                        </p>
                        {item.size && (
                          <span className="inline-flex items-center rounded-md bg-white px-2 py-0.5 text-[10px] font-mono font-bold text-emerald-800 border border-[#162018]/15 shadow-2xs">
                            Ukuran: {item.size}
                          </span>
                        )}
                      </div>
                      {item.customName && (
                        <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-[11px] font-mono font-bold text-[#162018] bg-white px-2.5 py-1 rounded-lg border border-[#162018]/15 shadow-2xs w-fit">
                          <Tag size={11} className="text-emerald-600" />
                          <span>Custom: <strong>{item.customName}</strong> #{item.customNumber || "-"}</span>
                          {item.customCollar && <span className="text-slate-500">({item.customCollar})</span>}
                          {item.customTeam && <span className="text-slate-500">• {item.customTeam}</span>}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <span className="font-mono font-black text-[#162018] text-sm sm:text-base">
                      Rp {(price * item.quantity).toLocaleString("id-ID")}
                    </span>
                    {(order.status || "").toUpperCase() === "COMPLETED" && (
                      <button
                        type="button"
                        onClick={() => handleOpenReviewModal(item)}
                        className={`flex items-center gap-1.5 text-xs font-condensed font-black uppercase tracking-wider px-3.5 py-2 rounded-xl border transition active:scale-95 shadow-2xs cursor-pointer ${
                          reviewedProductIds.has(item.productId || item.products?.id)
                            ? "text-emerald-800 bg-white border-emerald-300 hover:bg-emerald-50"
                            : "text-amber-900 bg-white hover:bg-amber-50 border-amber-300"
                        }`}
                      >
                        <Star
                          size={13}
                          className={
                            reviewedProductIds.has(item.productId || item.products?.id)
                              ? "fill-emerald-600 text-emerald-600"
                              : "fill-amber-500 text-amber-500"
                          }
                        />
                        <span>{reviewedProductIds.has(item.productId || item.products?.id) ? "Ubah Ulasan" : "Beri Ulasan"}</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Pending Callout Button */}
        {isPending && !isExpired && (
          <div className="rounded-3xl border border-white/15 bg-[#162018] p-6 text-white flex flex-col sm:flex-row items-center justify-between gap-4 shadow-md">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-400" />
                <h4 className="font-condensed text-lg font-black uppercase tracking-wider text-white">
                  Pesanan Anda Belum Dibayar
                </h4>
              </div>
              <p className="text-xs text-slate-300 mt-1 font-mono">
                Segera selesaikan pembayaran untuk memproses produksi dan pengiriman produk Anda.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setShowModal(true)}
              className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-xl bg-[#B9382B] hover:bg-[#982D22] px-6 py-3 text-xs font-condensed font-black uppercase tracking-wider text-white shadow-md shadow-[#B9382B]/20 transition active:scale-95 shrink-0 cursor-pointer"
            >
              <CreditCard size={16} />
              <span>Bayar Sekarang</span>
            </button>
          </div>
        )}

        {/* Expired Callout */}
        {isExpired && (
          <div className="rounded-3xl border border-rose-500/25 bg-[#162018] p-6 text-white flex flex-col sm:flex-row items-center justify-between gap-4 shadow-md">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-rose-400" />
                <h4 className="font-condensed text-lg font-black uppercase tracking-wider text-rose-300">
                  Batas Waktu Pembayaran Telah Kedaluwarsa
                </h4>
              </div>
              <p className="text-xs text-slate-300 mt-1 font-mono">
                Batas waktu pembayaran 24 jam telah berakhir. Tagihan pembayaran di Midtrans otomatis ditutup. Silakan lakukan pemesanan ulang untuk memproses produk pilihan Anda.
              </p>
            </div>

            <button
              type="button"
              onClick={handleReorder}
              disabled={reordering}
              className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-xl bg-[#162018] hover:bg-black border border-white/20 px-6 py-3 text-xs font-condensed font-black uppercase tracking-wider text-white shadow-md transition active:scale-95 shrink-0 cursor-pointer disabled:opacity-50"
            >
              <RotateCcw size={16} className={reordering ? "animate-spin" : ""} />
              <span>{reordering ? "Memproses..." : "Pesan Ulang Produk Ini"}</span>
            </button>
          </div>
        )}
      </div>

      {/* Modal Beri Ulasan */}
      {reviewItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg bg-[#162018] border border-white/15 rounded-3xl p-6 sm:p-8 text-white shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between pb-4 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30 shrink-0">
                  <Star size={22} className="fill-current" />
                </div>
                <div>
                  <h3 className="font-condensed text-xl font-black uppercase tracking-wider text-white">
                    {reviewedProductIds.has(reviewItem.productId || reviewItem.products?.id)
                      ? "Ubah Ulasan Produk"
                      : "Ulasan Produk"}
                  </h3>
                  <p className="text-xs text-slate-400 font-mono truncate max-w-xs mt-0.5">
                    {reviewItem.productName || reviewItem.products?.name}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setReviewItem(null)}
                className="p-2 text-slate-400 hover:text-white rounded-full hover:bg-white/10 transition cursor-pointer"
                title="Tutup (Esc)"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmitReview} className="space-y-4">
              <div>
                <label className="block text-xs font-mono font-bold uppercase tracking-wider text-slate-300 mb-2">
                  Beri Bintang Kepuasan
                </label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      type="button"
                      key={star}
                      onClick={() => setReviewRating(star)}
                      className="p-1 transition hover:scale-110 active:scale-95 cursor-pointer"
                    >
                      <Star
                        size={28}
                        className={
                          star <= reviewRating
                            ? "text-amber-400 fill-amber-400"
                            : "text-white/20 hover:text-amber-400/50"
                        }
                      />
                    </button>
                  ))}
                  <span className="text-xs font-mono font-bold text-amber-300 ml-2 bg-amber-500/15 border border-amber-500/30 px-2.5 py-0.5 rounded-lg">
                    {reviewRating} dari 5 Bintang
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono font-bold uppercase tracking-wider text-slate-300 mb-2">
                  Testimoni / Pengalaman Anda
                </label>
                <textarea
                  rows={4}
                  placeholder="Ceritakan kualitas bahan jersey, sablon, kenyamanan, atau ketepatan jahitan..."
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  className="w-full rounded-2xl border border-white/15 bg-white/5 p-4 text-sm text-white placeholder:text-slate-500 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition resize-none font-sans-body"
                  required
                />
              </div>

              {/* Upload Foto Produk Ulasan */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                    <Camera size={14} className="text-emerald-400" />
                    <span>Foto Produk (Opsional, Maks. 3)</span>
                  </label>
                  <span className="text-xs text-slate-400 font-mono">
                    {reviewImages.length}/3 Foto
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-2.5">
                  {reviewImages.map((imgUrl, idx) => (
                    <div
                      key={idx}
                      className="relative h-20 w-20 rounded-2xl overflow-hidden border border-white/15 group bg-black/40 shrink-0"
                    >
                      <img
                        src={imgUrl}
                        alt={`Review foto ${idx + 1}`}
                        className="h-full w-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemovePhoto(idx)}
                        className="absolute top-1 right-1 h-5 w-5 rounded-full bg-black/80 hover:bg-rose-600 text-white flex items-center justify-center transition shadow-xs cursor-pointer"
                        title="Hapus foto"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ))}

                  {reviewImages.length < 3 && (
                    <label
                      className={`h-20 w-20 rounded-2xl border-2 border-dashed border-white/20 hover:border-emerald-400 hover:bg-emerald-500/10 flex flex-col items-center justify-center text-slate-400 hover:text-emerald-400 cursor-pointer transition shrink-0 ${
                        uploadingImage ? "opacity-50 pointer-events-none" : ""
                      }`}
                    >
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        multiple
                        className="hidden"
                        onChange={handlePhotoUpload}
                        disabled={uploadingImage}
                      />
                      {uploadingImage ? (
                        <Loader2 size={20} className="animate-spin text-emerald-400" />
                      ) : (
                        <>
                          <ImagePlus size={20} />
                          <span className="text-[10px] font-mono font-bold mt-1">+ Foto</span>
                        </>
                      )}
                    </label>
                  )}
                </div>
                <p className="text-[11px] text-slate-400 mt-1.5 font-mono">
                  Format JPG, PNG, WEBP (maks. 5MB). Foto asli jersey akan tampil di ulasan publik produk.
                </p>
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setReviewItem(null)}
                  className="flex-1 px-5 py-3 rounded-xl border border-white/15 bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-mono font-bold uppercase tracking-wider transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submittingReview}
                  className="flex-1 flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-condensed font-black uppercase tracking-wider text-sm shadow-md shadow-emerald-600/20 transition active:scale-95 disabled:opacity-50 cursor-pointer"
                >
                  <CheckCircle2 size={16} />
                  <span>
                    {reviewedProductIds.has(reviewItem?.productId || reviewItem?.products?.id)
                      ? (submittingReview ? "Memperbarui..." : "Perbarui Ulasan")
                      : (submittingReview ? "Mengirim..." : "Kirim Ulasan")}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Midtrans Payment Modal */}
      <MidtransModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        order={order}
        onSuccess={() => {
          setShowModal(false);
          setTimeout(() => {
            getOrder(true);
          }, 600);
        }}
      />

      {/* Invoice Resmi Pembelian Modal */}
      <InvoiceModal
        isOpen={showInvoiceModal}
        onClose={() => setShowInvoiceModal(false)}
        order={order}
      />

      {/* Modal Batalkan Pesanan (Customer Mandiri) */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-md bg-[#162018] border border-white/15 rounded-3xl p-6 sm:p-7 text-white shadow-2xl space-y-5">
            <div className="flex items-start justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-rose-500/20 text-rose-400 border border-rose-500/30 shrink-0">
                  <Ban size={22} />
                </div>
                <div>
                  <h3 className="font-condensed text-xl font-black uppercase tracking-wider text-white">
                    Batalkan Pesanan Ini?
                  </h3>
                  <p className="text-xs text-slate-400 font-mono mt-0.5">Order #{order.orderNumber}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowCancelModal(false)}
                className="text-slate-400 hover:text-white p-2 rounded-full hover:bg-white/10 transition cursor-pointer"
                title="Tutup (Esc)"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCancelOrder} className="space-y-4">
              <p className="text-xs text-slate-300 leading-relaxed font-sans-body">
                Pesanan yang dibatalkan tidak dapat dipulihkan. Mohon pilih alasan pembatalan agar kami dapat meningkatkan layanan Atelier RegarStore:
              </p>

              <div className="space-y-2">
                {[
                  "Ingin mengubah varian ukuran produk",
                  "Ingin mengganti alamat pengiriman",
                  "Salah memilih metode pembayaran",
                  "Ingin memesan model apparel lain",
                  "Lainnya",
                ].map((reason) => (
                  <label
                    key={reason}
                    className={`flex items-center gap-3 p-3.5 rounded-xl border text-xs font-mono cursor-pointer transition-all ${
                      cancelReason === reason
                        ? "bg-rose-500/15 border-rose-500/40 text-rose-200 font-bold shadow-2xs"
                        : "bg-white/5 border-white/10 text-slate-300 hover:bg-white/10 hover:text-white"
                    }`}
                  >
                    <input
                      type="radio"
                      name="cancelReason"
                      value={reason}
                      checked={cancelReason === reason}
                      onChange={(e) => setCancelReason(e.target.value)}
                      className="accent-rose-500"
                    />
                    <span>{reason}</span>
                  </label>
                ))}
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowCancelModal(false)}
                  className="px-5 py-2.5 rounded-xl border border-white/15 bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-mono font-bold uppercase tracking-wider cursor-pointer"
                >
                  Kembali
                </button>
                <button
                  type="submit"
                  disabled={cancelling}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-condensed font-black uppercase tracking-wider shadow-md shadow-rose-600/20 transition active:scale-95 disabled:opacity-50 cursor-pointer"
                >
                  {cancelling && <Loader2 size={14} className="animate-spin" />}
                  <span>Konfirmasi Batalkan</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Warranty Claim Modal */}
      <WarrantyClaimModal
        isOpen={showWarrantyModal}
        onClose={() => setShowWarrantyModal(false)}
        order={order}
        onSuccess={(newClaim) => {
          setClaims((prev) => [newClaim, ...prev]);
        }}
      />
      </div>
    </div>
  );
}

class OrderDetailErrorBoundary extends Component {
  state = { hasError: false, error: null };
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, info) {
    console.error("OrderDetail crash caught by boundary:", error, info);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="bg-[#FAF8F4] min-h-screen py-16 px-4 flex flex-col items-center justify-center text-center font-sans-body">
          <div className="p-4 rounded-3xl bg-white border border-rose-200 shadow-sm text-rose-500 mb-4">
            <AlertCircle size={36} />
          </div>
          <h2 className="font-condensed text-2xl font-black uppercase text-slate-900">
            Kendala Menampilkan Detail Pesanan
          </h2>
          <p className="text-xs text-slate-500 font-mono mt-1 max-w-md">
            Sistem mendeteksi kendala pada pemuatan data pesanan. Silakan muat ulang atau periksa status pesanan di halaman utama.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Link
              to="/dashboard/my-orders"
              className="inline-flex items-center gap-2 rounded-xl bg-[#162018] px-5 py-2.5 text-xs font-mono font-bold text-white uppercase hover:bg-black transition shadow-xs"
            >
              <ArrowLeft size={14} />
              <span>Kembali ke Pesanan Saya</span>
            </Link>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-xs font-mono font-bold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
            >
              <RotateCcw size={14} />
              <span>Muat Ulang Halaman</span>
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function OrderDetail() {
  return (
    <OrderDetailErrorBoundary>
      <OrderDetailContent />
    </OrderDetailErrorBoundary>
  );
}