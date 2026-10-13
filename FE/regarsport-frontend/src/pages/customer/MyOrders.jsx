/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Package,
  ShoppingBag,
  CreditCard,
  Eye,
  RotateCcw,
  Search,
  MessageCircle,
  Clock,
  CheckCircle2,
  Truck,
  Box,
  XCircle,
} from "lucide-react";
import toast from "react-hot-toast";

import api from "../../services/api";
import { CardSkeletonList } from "../../components/common/UiStates";
import MidtransModal from "../../components/common/MidtransModal";
import { useCart } from "../../context/CartContext";

const STATUS_TABS = [
  { id: "", label: "Semua", icon: Package },
  { id: "pending", label: "Belum Bayar", icon: Clock },
  { id: "paid", label: "Lunas", icon: CreditCard },
  { id: "processing", label: "Diproses", icon: Box },
  { id: "shipped", label: "Dikirim", icon: Truck },
  { id: "completed", label: "Selesai", icon: CheckCircle2 },
  { id: "cancelled", label: "Dibatalkan", icon: XCircle },
];

export default function MyOrders() {
  const navigate = useNavigate();
  const { addToCart } = useCart();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [payingOrder, setPayingOrder] = useState(null);
  const [reorderingId, setReorderingId] = useState(null);

  const getOrders = async () => {
    try {
      setLoading(true);
      const res = await api.get("/orders/my-orders", {
        params: {
          page,
          size: 20,
        },
      });
      const pageData = res.data?.data || res.data;
      const list = Array.isArray(pageData?.content)
        ? pageData.content
        : Array.isArray(pageData)
        ? pageData
        : [];
      setOrders(list);
      setTotalPages(pageData?.totalPages || 1);

      // Auto-sync any pending orders in background with Midtrans
      list.forEach((ord) => {
        if ((ord.status || "").toUpperCase() === "PENDING" && ord.orderNumber) {
          api
            .get(`/payments/sync/${ord.orderNumber}`)
            .then((syncRes) => {
              const status = (
                syncRes.data?.data?.paymentStatus || ""
              ).toUpperCase();
              if (status === "SETTLEMENT" || status === "CAPTURE") {
                setOrders((prev) =>
                  prev.map((o) =>
                    o.id === ord.id ? { ...o, status: "PAID" } : o
                  )
                );
              }
            })
            .catch(() => {});
        }
      });
    } catch (error) {
      console.log(error);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getOrders();
  }, [page]);

  const getStatusColor = (status) => {
    const s = (status || "").toLowerCase();
    switch (s) {
      case "pending":
        return "bg-amber-50 text-amber-700 border border-amber-200";
      case "processing":
        return "bg-blue-50 text-blue-700 border border-blue-200";
      case "paid":
        return "bg-emerald-50 text-emerald-700 border border-emerald-200";
      case "shipped":
        return "bg-purple-50 text-purple-700 border border-purple-200";
      case "completed":
        return "bg-green-50 text-green-700 border border-green-200";
      case "cancelled":
        return "bg-rose-50 text-rose-700 border border-rose-200";
      default:
        return "bg-slate-100 text-slate-600 border border-slate-200";
    }
  };

  // Filter orders by active status tab and search keyword
  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      const matchStatus =
        !statusFilter ||
        (o.status || "").toLowerCase() === statusFilter.toLowerCase();

      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        (o.orderNumber && o.orderNumber.toLowerCase().includes(q)) ||
        (o.shippingAddress && o.shippingAddress.toLowerCase().includes(q));

      return matchStatus && matchSearch;
    });
  }, [orders, statusFilter, searchQuery]);

  // Tab counter helper
  const countForStatus = (statusKey) => {
    if (!statusKey) return orders.length;
    return orders.filter(
      (o) => (o.status || "").toLowerCase() === statusKey.toLowerCase()
    ).length;
  };

  // Instant Reorder Action
  const handleReorder = async (order) => {
    try {
      setReorderingId(order.id);
      let items = order.items || [];
      if (!items.length) {
        const res = await api.get(`/orders/${order.id}`);
        const full = res.data?.data || res.data;
        items = full?.items || [];
      }

      if (!items.length) {
        toast.error("Rincian produk tidak dapat dimuat untuk pesan ulang");
        return;
      }

      for (const it of items) {
        await addToCart(
          {
            id: it.productId,
            name: it.productName,
            price: it.price,
            imageUrl: it.productImage,
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

      toast.success(
        `${items.length} item berhasil dimasukkan kembali ke keranjang!`
      );
      navigate("/dashboard/cart");
    } catch (err) {
      console.error(err);
      toast.error("Gagal melakukan pemesanan ulang");
    } finally {
      setReorderingId(null);
    }
  };

  // WhatsApp CS Direct Assistance
  const handleContactCS = (order) => {
    const orderNo = order.orderNumber || `Order #${order.id}`;
    const text = `Halo Admin RegarStore, saya ingin menanyakan informasi pesanan saya dengan nomor: *${orderNo}*. Mohon bantuannya ya min 🙏`;
    const url = `https://api.whatsapp.com/send?phone=6282133445566&text=${encodeURIComponent(
      text
    )}`;
    window.open(url, "_blank");
  };

  return (
    <div className="bg-[#FAF8F4] min-h-screen text-[#111613] font-sans-body py-8 sm:py-12 animate-fade-in">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">

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
                LIVE TRACKER
              </span>
              <span>Atelier Cicendo Bandung</span>
            </span>
          </div>

          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between border-b border-[#162018]/10 pb-5">
            <div>
              <h1 className="font-condensed text-3xl sm:text-4xl font-black uppercase tracking-tight text-[#162018]">
                Pesanan Saya &amp; Pelacakan Produksi
              </h1>
              <p className="mt-1 text-xs sm:text-sm text-slate-500">
                Pantau antrean sublimasi, proses jahit, resi ekspedisi, dan riwayat pesanan tim Anda secara real-time.
              </p>
            </div>

            {/* Search Input */}
            <div className="relative w-full md:w-80">
              <Search
                size={15}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="text"
                placeholder="Cari ID pesanan / alamat..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-xl border border-[#162018]/15 bg-white py-2.5 pl-10 pr-4 text-xs font-mono font-bold text-slate-900 placeholder-slate-400 shadow-2xs outline-none transition focus:border-[#162018] focus:ring-1 focus:ring-[#162018]"
              />
            </div>
          </div>
        </div>

        {/* Horizontal Status Filter Tabs */}
        <div className="mb-6 flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar">
          {STATUS_TABS.map((tab) => {
            const count = countForStatus(tab.id);
            const isActive = statusFilter === tab.id;
            const TabIcon = tab.icon;

            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  setStatusFilter(tab.id);
                  setPage(1);
                }}
                className={`flex shrink-0 items-center gap-2 whitespace-nowrap rounded-xl px-4 py-2.5 text-xs font-mono font-bold uppercase tracking-wider transition cursor-pointer ${
                  isActive
                    ? "bg-[#162018] text-amber-300 shadow-sm ring-1 ring-[#162018]"
                    : "bg-white text-slate-600 border border-[#162018]/15 hover:border-[#162018] hover:text-[#162018]"
                }`}
              >
                <TabIcon size={13} className={isActive ? "text-amber-400" : "text-slate-400"} />
                <span>{tab.label}</span>
                {count > 0 && (
                  <span
                    className={`rounded-full px-1.5 py-0.2 text-[10px] font-black ${
                      isActive
                        ? "bg-white/20 text-white"
                        : "bg-slate-100 text-slate-700"
                    }`}
                  >
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {loading ? (
          <CardSkeletonList count={3} />
        ) : filteredOrders.length === 0 ? (
          <div className="rounded-3xl border border-[#162018]/10 bg-white p-8 sm:p-14 text-center shadow-xs">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-[#162018]/5 text-[#162018] ring-8 ring-[#162018]/5 mb-4">
              <Package size={36} className="text-slate-400" />
            </div>

            <h2 className="font-condensed text-2xl sm:text-3xl font-black uppercase tracking-tight text-[#162018]">
              {searchQuery ? "Pesanan Tidak Ditemukan" : "Belum Ada Pesanan"}
            </h2>
            <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-slate-500">
              {searchQuery
                ? `Tidak ada pesanan yang sesuai dengan kata kunci "${searchQuery}".`
                : "Seluruh pesanan jersey dan perlengkapan tim yang Anda buat akan tercatat di sini."}
            </p>

            <div className="mt-6">
              <Link
                to="/dashboard"
                className="inline-flex items-center gap-2 rounded-2xl bg-[#B9382B] hover:bg-[#982D22] px-6 py-3.5 text-xs font-black font-condensed tracking-wider uppercase text-white shadow-md shadow-[#B9382B]/20 transition active:scale-95"
              >
                <ShoppingBag size={15} />
                <span>Mulai Belanja Jersey Tim</span>
              </Link>
            </div>
          </div>
        ) : (
          <>
            <div className="space-y-4">
              {filteredOrders.map((order) => {
                const isPending =
                  (order.status || "").toUpperCase() === "PENDING";
                const isCompleted =
                  (order.status || "").toUpperCase() === "COMPLETED";
                const isPaid =
                  (order.status || "").toUpperCase() === "PAID";
                const isCancelled =
                  (order.status || "").toUpperCase() === "CANCELLED";
                const createdAtDate = new Date(
                  order.createdAt || order.created_at
                );
                const isExpired =
                  (order.cancellationReason && order.cancellationReason.toLowerCase().includes("kedaluwarsa")) ||
                  (isPending &&
                    !isNaN(createdAtDate.getTime()) &&
                    Date.now() - createdAtDate.getTime() > 24 * 60 * 60 * 1000);
                const isReordering = reorderingId === order.id;

                return (
                  <div
                    key={order.id}
                    className="rounded-3xl border border-[#162018]/10 bg-white p-5 sm:p-6 shadow-2xs hover:border-[#162018]/30 transition duration-200"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100">
                      <div>
                        <div className="flex items-center gap-2">
                          <Package size={16} className="text-[#162018]" />
                          <h2 className="font-mono font-bold text-[#162018] text-sm sm:text-base">
                            {order.orderNumber || `Order #${order.id}`}
                          </h2>
                          <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 bg-[#FAF8F4] px-2 py-0.5 rounded border border-[#162018]/10">
                            Atelier Cicendo
                          </span>
                        </div>
                        {order.createdAt || order.created_at ? (
                          <p className="mt-1 flex items-center gap-1.5 text-xs text-slate-400 font-mono">
                            <Calendar size={12} />
                            {new Date(
                              order.createdAt || order.created_at
                            ).toLocaleString("id-ID")}
                          </p>
                        ) : null}
                      </div>

                      <span
                        className={`rounded-full px-3.5 py-1 text-xs font-mono font-bold uppercase tracking-wider ${
                          isExpired
                            ? "bg-rose-50 text-rose-700 border border-rose-200"
                            : getStatusColor(order.status)
                        }`}
                      >
                        {isExpired ? "KEDALUWARSA" : order.status}
                      </span>
                    </div>

                    <div className="mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <p className="text-xs font-mono text-slate-500">
                          Total Pembayaran:{" "}
                          <span className="font-condensed font-black text-[#B9382B] text-xl ml-1">
                            Rp{" "}
                            {Number(
                              order.totalAmount || order.total_amount
                            ).toLocaleString("id-ID")}
                          </span>
                        </p>

                        <p className="mt-1 flex items-start gap-1.5 text-xs text-slate-500">
                          <MapPin
                            size={13}
                            className="mt-0.5 shrink-0 text-slate-400"
                          />
                          <span>{order.shippingAddress || order.shipping_address}</span>
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 pt-2 sm:pt-0">
                        {/* Rincian & Lacak */}
                        <Link
                          to={`/dashboard/orders/${order.id}`}
                          className="inline-flex items-center gap-1.5 rounded-xl bg-[#162018] hover:bg-black px-4 py-2.5 text-xs font-mono font-bold uppercase tracking-wider text-white shadow-xs transition cursor-pointer"
                        >
                          <Eye size={13} />
                          <span>Rincian &amp; Resi</span>
                        </Link>

                        {/* Bayar Sekarang (jika PENDING) */}
                        {isPending && !isExpired && (
                          <button
                            type="button"
                            onClick={() => setPayingOrder(order)}
                            className="inline-flex items-center gap-1.5 rounded-xl bg-[#B9382B] hover:bg-[#982D22] px-4 py-2.5 text-xs font-mono font-bold uppercase tracking-wider text-white shadow-xs transition hover:-translate-y-0.5 cursor-pointer"
                          >
                            <CreditCard size={13} />
                            <span>Bayar Sekarang</span>
                          </button>
                        )}

                        {/* Beli Lagi (Reorder) untuk status Completed / Paid / Expired / Cancelled */}
                        {(isCompleted || isPaid || isExpired || isCancelled) && (
                          <button
                            type="button"
                            onClick={() => handleReorder(order)}
                            disabled={isReordering}
                            className="inline-flex items-center gap-1.5 rounded-xl border border-[#162018]/15 bg-[#FAF8F4] px-3.5 py-2.5 text-xs font-mono font-bold text-slate-700 transition hover:bg-white disabled:opacity-50 cursor-pointer"
                            title="Masukkan produk pesanan ini kembali ke keranjang"
                          >
                            <RotateCcw size={12} className={isReordering ? "animate-spin" : ""} />
                            <span>{isReordering ? "Memasukkan..." : "Pesan Ulang"}</span>
                          </button>
                        )}

                        {/* Bantuan CS WhatsApp */}
                        <button
                          type="button"
                          onClick={() => handleContactCS(order)}
                          className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-300 bg-emerald-50 px-3.5 py-2.5 text-xs font-mono font-bold text-emerald-800 transition hover:bg-emerald-100 cursor-pointer"
                          title="Tanya Admin CS perihal pesanan ini via WhatsApp"
                        >
                          <MessageCircle size={13} className="text-emerald-700" />
                          <span>Tanya CS</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {totalPages > 1 && (
              <div className="mt-8 flex items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.max(p - 1, 1))}
                  disabled={page === 1}
                  className="flex items-center gap-1 rounded-xl border border-[#162018]/15 bg-white px-4 py-2 text-xs font-mono font-bold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ChevronLeft size={14} />
                  Sebelumnya
                </button>

                <span className="text-xs font-mono text-slate-500">
                  Halaman {page} dari {totalPages}
                </span>

                <button
                  type="button"
                  onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
                  disabled={page === totalPages}
                  className="flex items-center gap-1 rounded-xl border border-[#162018]/15 bg-white px-4 py-2 text-xs font-mono font-bold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Berikutnya
                  <ChevronRight size={14} />
                </button>
              </div>
            )}
          </>
        )}

        {/* Midtrans Modal directly from order history */}
        {payingOrder && (
          <MidtransModal
            isOpen={Boolean(payingOrder)}
            onClose={() => setPayingOrder(null)}
            order={payingOrder}
            onSuccess={() => {
              setPayingOrder(null);
              getOrders();
            }}
          />
        )}
      </div>
    </div>
  );
}