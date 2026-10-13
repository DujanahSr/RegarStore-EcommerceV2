/* eslint-disable no-unused-vars */
/* eslint-disable react-hooks/set-state-in-effect */
// FRONTEND/src/pages/admin/Orders.jsx

import { useCallback, useEffect, useState, useMemo, useRef } from "react";
import {
  Download,
  Filter,
  ShoppingCart,
  ChevronLeft,
  ChevronRight,
  Truck,
  X,
  PackageCheck,
  Printer,
  Search,
  Scan,
  CheckSquare,
  Square,
  Layers,
  RefreshCw,
  CheckCircle2,
  Ban,
} from "lucide-react";
import api from "../../services/api";
import { EmptyState, ScreenLoader } from "../../components/common/UiStates";
import toast from "react-hot-toast";
import ShippingLabelModal from "../../components/admin/ShippingLabelModal";
import BulkShippingLabelModal from "../../components/admin/BulkShippingLabelModal";
import { useAuth } from "../../context/AuthContext";

const orderStatuses = ["pending", "paid", "processing", "shipped", "completed", "cancelled"];

const courierList = [
  "J&T Express",
  "JNE Reguler",
  "SiCepat Ekspres",
  "Anteraja",
  "Pos Indonesia",
  "ID Express",
  "Ninja Xpress"
];

const statusColors = {
  pending: "bg-yellow-500/10 text-yellow-400 border-yellow-500/30",
  paid: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
  processing: "bg-blue-500/10 text-blue-400 border-blue-500/30",
  shipped: "bg-purple-500/10 text-purple-400 border-purple-500/30",
  completed: "bg-green-500/10 text-green-400 border-green-500/30",
  cancelled: "bg-red-500/10 text-red-400 border-red-500/30",
};

export default function Orders() {
  const { user } = useAuth();
  const isLogistics = user?.role === "logistics";
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [exporting, setExporting] = useState(false);

  // Search & Barcode Scan State
  const [searchQuery, setSearchQuery] = useState("");
  const searchInputRef = useRef(null);

  // Bulk Selection & Print State
  const [selectedOrderIds, setSelectedOrderIds] = useState([]);
  const [showBulkModal, setShowBulkModal] = useState(false);

  // Ship Modal State
  const [shippingOrder, setShippingOrder] = useState(null);
  const [courier, setCourier] = useState(courierList[0]);
  const [trackingNumber, setTrackingNumber] = useState("");
  const [shippingSubmitting, setShippingSubmitting] = useState(false);

  // Label Thermal Modal State
  const [labelOrder, setLabelOrder] = useState(null);

  const getOrders = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get("/orders", {
        params: {
          status: statusFilter ? statusFilter.toUpperCase() : undefined,
          page,
          size: 10,
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
    } catch (error) {
      console.error(error);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter]);

  useEffect(() => {
    getOrders();
    setSelectedOrderIds([]);
  }, [getOrders]);

  useEffect(() => {
    if (isLogistics) {
      const timer = setTimeout(() => {
        searchInputRef.current?.focus();
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [isLogistics]);

  const filteredOrders = useMemo(() => {
    if (!searchQuery.trim()) return orders;
    const q = searchQuery.toLowerCase().trim();
    return orders.filter((order) => {
      const orderNum = (order.orderNumber || `#${order.id}`).toLowerCase();
      const tracking = (order.trackingNumber || "").toLowerCase();
      const recipient = (
        order.recipientName ||
        order.customerName ||
        order.users?.full_name ||
        ""
      ).toLowerCase();
      const phone = (order.customerPhone || order.shippingPhone || "").toLowerCase();
      const courierName = (order.shippingCourier || "").toLowerCase();
      const city = (order.shippingCity || "").toLowerCase();
      return (
        orderNum.includes(q) ||
        tracking.includes(q) ||
        recipient.includes(q) ||
        phone.includes(q) ||
        courierName.includes(q) ||
        city.includes(q)
      );
    });
  }, [orders, searchQuery]);

  const toggleSelectOrder = (id) => {
    setSelectedOrderIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedOrderIds.length === filteredOrders.length && filteredOrders.length > 0) {
      setSelectedOrderIds([]);
    } else {
      setSelectedOrderIds(filteredOrders.map((o) => o.id));
    }
  };

  const [syncingOrderId, setSyncingOrderId] = useState(null);

  const handleSyncPayment = async (order) => {
    try {
      setSyncingOrderId(order.id);
      const res = await api.get(`/payments/sync/${order.orderNumber}`);
      const st = res.data?.data?.paymentStatus || "";
      toast.success(`Sinkronisasi Midtrans: ${st || "Berhasil diperbarui"}`);
      getOrders();
    } catch (err) {
      toast.error(err.response?.data?.message || "Gagal sinkronisasi dengan Midtrans");
    } finally {
      setSyncingOrderId(null);
    }
  };

  const updateStatus = async (id, status, currentStatus) => {
    if (currentStatus === "pending" && status.toLowerCase() === "paid") {
      toast.error("Status PAID tidak dapat diubah sembarangan manual. Gunakan tombol 'Sync' untuk verifikasi Midtrans.");
      return;
    }
    try {
      await api.patch(`/orders/${id}/status`, { status: status.toUpperCase() });
      toast.success("Status pesanan berhasil diperbarui");
      getOrders();
    } catch (error) {
      toast.error(error.response?.data?.message || "Gagal memperbarui status");
    }
  };

  const handleOpenShipModal = (order) => {
    setShippingOrder(order);
    setCourier(order.shippingCourier || courierList[0]);
    setTrackingNumber(order.trackingNumber || "");
  };

  const handleShipSubmit = async (e) => {
    e.preventDefault();
    if (!trackingNumber.trim()) {
      toast.error("Nomor resi wajib diisi");
      return;
    }

    try {
      setShippingSubmitting(true);
      await api.patch(`/orders/${shippingOrder.id}/ship`, {
        courier: courier.trim(),
        trackingNumber: trackingNumber.trim(),
      });
      toast.success(`Pesanan #${shippingOrder.orderNumber} berhasil dikirim!`);
      setShippingOrder(null);
      getOrders();
    } catch (err) {
      toast.error(err.response?.data?.message || "Gagal mengirim pesanan");
    } finally {
      setShippingSubmitting(false);
    }
  };

  const handleExportCSV = async () => {
    try {
      setExporting(true);
      const response = await api.get("/admin/orders/export", { responseType: "blob" });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `orders-${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success("Data pesanan berhasil diekspor");
    } catch (error) {
      toast.error("Gagal mengekspor data");
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      {isLogistics ? (
        <div className="relative overflow-hidden rounded-3xl border border-black/10 shadow-xl bg-[#162018]">
          <div className="absolute inset-0 z-0">
            <img
              src="/images/logistics_hero_bg.jpg"
              alt="RegarStore Logistics Station"
              className="w-full h-full object-cover object-center filter brightness-[0.38] contrast-125"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-[#162018] via-[#162018]/85 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#162018] via-transparent to-black/30" />
            <div className="absolute inset-0 bg-topography opacity-15 mix-blend-overlay pointer-events-none" />
          </div>

          <div className="relative z-10 p-6 sm:p-8 lg:p-10 flex flex-col justify-between min-h-[200px]">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-full bg-white/10 text-emerald-400 font-mono text-[10px] font-black tracking-widest border border-white/10 uppercase">
                  RS // PACKING &amp; DISPATCH STATION
                </span>
                <span className="text-[11px] font-mono uppercase tracking-widest text-slate-300">
                  ATELIER CICENDO HUB
                </span>
              </div>

              <button
                onClick={getOrders}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-all border border-white/10 shadow-xs cursor-pointer active:scale-95"
              >
                <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
                <span>Refresh Antrean</span>
              </button>
            </div>

            <div className="my-3 max-w-3xl">
              <h1 className="font-['Barlow_Condensed'] font-black text-3xl sm:text-5xl uppercase tracking-tight text-white leading-none">
                LOGISTIK &amp; PENGIRIMAN
              </h1>
              <p className="text-slate-300 text-xs sm:text-sm mt-2 max-w-2xl leading-relaxed">
                Operasional pengepakan pesanan jersey, pencetakan label resi thermal A6 berstandar ekspedisi, dan sinkronisasi status kurir.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-white/10 text-[11px] font-mono text-slate-300">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <span>STATUS DISPATCH: ONLINE</span>
              </div>
              <span className="text-white/30">•</span>
              <div className="flex items-center gap-1.5">
                <Printer size={13} className="text-amber-400" />
                <span>FORMAT THERMAL: A6 (100x150MM)</span>
              </div>
              <span className="text-white/30">•</span>
              <div className="flex items-center gap-1.5">
                <Truck size={13} className="text-emerald-400" />
                <span>TERTAMPIL: {filteredOrders.length} PESANAN</span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="relative overflow-hidden rounded-3xl border border-black/15 shadow-xl bg-[#162018] text-white p-6 sm:p-8 mb-6">
          <div className="absolute inset-0 bg-topography opacity-15 pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="max-w-2xl">
              <div className="flex items-center gap-2 mb-2">
                <span className="px-2.5 py-0.5 rounded-full bg-white/10 text-emerald-400 font-mono text-[10px] font-black tracking-widest border border-white/10 uppercase">
                  RS // ORDER COMMAND CENTER
                </span>
                <span className="text-[11px] font-mono uppercase tracking-widest text-stone-300">
                  ATELIER TRANSACTION DESK
                </span>
              </div>
              <h1 className="font-['Barlow_Condensed'] font-black uppercase tracking-tight text-3xl sm:text-5xl text-white leading-none">
                MANAJEMEN PESANAN
              </h1>
              <p className="text-stone-300 text-xs sm:text-sm mt-2 leading-relaxed">
                Pantau antrean pesanan pelanggan, validasi pembayaran Midtrans, jadwal produksi kustom jersey, dan koordinasi pengiriman ekspedisi.
              </p>

              <div className="flex flex-wrap items-center gap-4 mt-4 pt-3 border-t border-white/10 text-xs font-mono text-stone-300">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  <span>TOTAL ANTREAN: {filteredOrders.length} PESANAN</span>
                </div>
                <span className="text-white/20">•</span>
                <div className="flex items-center gap-1.5">
                  <ShoppingCart size={13} className="text-amber-400" />
                  <span>SINKRONISASI: REALTIME MIDTRANS</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <button
                onClick={getOrders}
                className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/15 text-white text-xs font-bold transition-all active:scale-95 cursor-pointer shadow-sm"
              >
                <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
                <span>Refresh Antrean</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quick Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 mb-6 no-scrollbar">
        {[
          { label: "Semua Pesanan", value: "" },
          { label: "Perlu Dikemas", value: "PAID", badge: "Siap Kirim" },
          { label: "Sedang Diproses", value: "PROCESSING" },
          { label: "Dalam Pengiriman", value: "SHIPPED" },
          { label: "Selesai", value: "COMPLETED" },
          { label: "Dibatalkan", value: "CANCELLED" },
        ].map((tab) => {
          const isActive = (statusFilter || "").toUpperCase() === (tab.value || "").toUpperCase();
          return (
            <button
              key={tab.value}
              onClick={() => {
                setPage(1);
                setStatusFilter(tab.value);
              }}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                isActive
                  ? tab.value === "PAID"
                    ? "bg-[#B9382B] text-white shadow-md"
                    : "bg-[#162018] text-white shadow-md"
                  : "bg-white text-stone-600 hover:text-black hover:bg-stone-100 border border-stone-200"
              }`}
            >
              <span>{tab.label}</span>
              {tab.badge && (
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                  isActive ? "bg-white/20 text-white" : "bg-[#FAF0ED] text-[#B9382B] border border-[#B9382B]/20"
                }`}>
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Search & Action Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        {/* Barcode & Text Search */}
        <div className="flex-1 max-w-lg">
          <div className="flex items-center rounded-2xl px-4 py-2.5 transition-all bg-white border border-stone-200/80 focus-within:border-[#B9382B] focus-within:ring-1 focus-within:ring-[#B9382B] shadow-xs">
            <Scan size={18} className="mr-2.5 shrink-0 text-stone-400" />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Cari No. Order, Scan Barcode Resi, Nama, Kota, atau HP..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-transparent text-xs sm:text-sm outline-hidden font-mono text-slate-900 placeholder:text-stone-400"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="text-stone-400 hover:text-slate-900 ml-2 p-1 cursor-pointer transition-colors"
                title="Hapus pencarian"
              >
                <X size={15} />
              </button>
            )}
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-3">
          {filteredOrders.length > 0 && (
            <button
              type="button"
              onClick={toggleSelectAll}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer bg-white hover:bg-stone-50 text-stone-700 border border-stone-200/80 shadow-xs"
            >
              {selectedOrderIds.length > 0 && selectedOrderIds.length === filteredOrders.length ? (
                <>
                  <CheckSquare size={16} className="text-[#B9382B]" />
                  <span>Batal Pilih Semua</span>
                </>
              ) : (
                <>
                  <Square size={16} />
                  <span>Pilih Semua ({filteredOrders.length})</span>
                </>
              )}
            </button>
          )}

          {!isLogistics && (
            <button
              onClick={handleExportCSV}
              disabled={exporting}
              className="flex items-center gap-2 bg-white hover:bg-stone-50 text-stone-700 px-4 py-2.5 rounded-xl border border-stone-200/80 transition-all font-bold text-xs disabled:opacity-50 cursor-pointer shadow-xs"
            >
              <Download size={15} />
              {exporting ? "Mengekspor..." : "Export CSV"}
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <ScreenLoader label="Memuat daftar pesanan..." />
      ) : filteredOrders.length === 0 ? (
        <EmptyState
          title={searchQuery ? "Tidak ditemukan pesanan" : "Belum ada pesanan"}
          description={
            searchQuery
              ? `Tidak ada pesanan yang sesuai dengan kata kunci "${searchQuery}".`
              : "Pesanan dari pelanggan akan muncul di sini."
          }
        />
      ) : (
        <div className="rounded-3xl overflow-hidden shadow-xs bg-white border border-stone-200/80">
          <div className="overflow-x-auto relative z-10">
            <table className="w-full min-w-225">
              <thead>
                <tr className="border-b bg-stone-50/70 border-stone-200 text-stone-600 font-bold uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-3 pl-4 text-center w-12">
                    <button
                      type="button"
                      onClick={toggleSelectAll}
                      className="text-stone-500 hover:text-black cursor-pointer"
                      title="Pilih semua pesanan"
                    >
                      {selectedOrderIds.length > 0 && selectedOrderIds.length === filteredOrders.length ? (
                        <CheckSquare size={18} className="text-[#B9382B]" />
                      ) : (
                        <Square size={18} />
                      )}
                    </button>
                  </th>
                  <th className="py-3 px-3.5 text-left text-xs font-bold uppercase tracking-wider">Order ID</th>
                  <th className="py-3 px-3.5 text-left text-xs font-bold uppercase tracking-wider">Pelanggan</th>
                  <th className="py-3 px-3.5 text-left text-xs font-bold uppercase tracking-wider">Item &amp; Ukuran</th>
                  <th className="py-3 px-3.5 text-left text-xs font-bold uppercase tracking-wider">Total</th>
                  <th className="py-3 px-3.5 text-left text-xs font-bold uppercase tracking-wider">Status</th>
                  <th className="py-3 px-3.5 text-left text-xs font-bold uppercase tracking-wider">Pengiriman &amp; Resi</th>
                  <th className="py-3 px-3.5 text-left text-xs font-bold uppercase tracking-wider">Label Logistik</th>
                  <th className="py-3 px-3.5 text-left text-xs font-bold uppercase tracking-wider">Ubah Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {filteredOrders.map((order) => {
                  const s = (order.status || "").toLowerCase();
                  const hasShipping = order.shippingCourier || order.trackingNumber;

                  return (
                    <tr
                      key={order.id}
                      className={`transition-all duration-200 group hover:bg-stone-50/60 ${
                        selectedOrderIds.includes(order.id) ? "bg-[#FAF0ED]/60" : ""
                      }`}
                    >
                      <td className="py-3 px-3 pl-4 text-center">
                        <input
                          type="checkbox"
                          checked={selectedOrderIds.includes(order.id)}
                          onChange={() => toggleSelectOrder(order.id)}
                          className="w-4 h-4 rounded cursor-pointer accent-[#B9382B]"
                        />
                      </td>
                      <td className="py-3 px-3.5 font-mono text-sm font-bold text-slate-900">
                        {order.orderNumber || `#${order.id}`}
                      </td>
                      <td className="py-3 px-3.5">
                        <div className="font-bold text-slate-900">
                          {order.recipientName || order.customerName || order.users?.full_name || "Customer"}
                        </div>
                        <div className="text-xs mt-0.5 text-stone-500 font-mono">
                          {order.customerPhone || order.customerEmail || order.users?.email || "-"}
                        </div>
                        {order.shippingCity && (
                          <div className="text-[11px] mt-0.5 text-stone-600 font-medium">
                            📍 {order.shippingCity}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-3.5">
                        <div className="space-y-1.5 min-w-44 max-w-xs">
                          {(order.items || []).map((it, itIdx) => (
                            <div key={itIdx} className="flex flex-wrap items-center gap-1.5 text-xs">
                              <span className="font-medium truncate max-w-36 text-slate-800">
                                {it.productName}
                              </span>
                              <span className="font-mono text-[11px] text-stone-400">
                                {it.quantity}x
                              </span>
                              {it.size && (
                                <span className="px-1.5 py-0.5 rounded-md font-bold text-[10px] bg-stone-100 text-stone-800 border border-stone-200">
                                  {it.size}
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      </td>
                      <td className="py-3 px-3.5">
                        <span className="text-sm font-bold font-mono text-slate-900">
                          Rp {Number(order.totalAmount || order.total_amount).toLocaleString("id-ID")}
                        </span>
                      </td>
                      <td className="py-3 px-3.5">
                        <span
                          className={`inline-block text-xs font-bold px-3 py-1 rounded-full border ${
                            s === "paid"
                              ? "bg-[#FAF0ED] text-[#B9382B] border-[#B9382B]/30 font-mono"
                              : s === "shipped"
                              ? "bg-blue-50 text-blue-800 border-blue-200 font-mono"
                              : s === "completed"
                              ? "bg-emerald-50 text-emerald-800 border-emerald-200 font-mono"
                              : s === "processing"
                              ? "bg-purple-50 text-purple-800 border-purple-200 font-mono"
                              : s === "pending"
                              ? "bg-amber-50 text-amber-800 border-amber-200 font-mono"
                              : "bg-stone-100 text-stone-600 border-stone-200 font-mono"
                          }`}
                        >
                          {s === "paid" ? "🔥 Perlu Dikemas" : s.charAt(0).toUpperCase() + s.slice(1)}
                        </span>
                      </td>
                      <td className="py-3 px-3.5">
                        {hasShipping ? (
                          <div className="flex flex-col gap-1">
                            <span className="text-xs font-bold flex items-center gap-1 text-slate-900">
                              <Truck size={12} /> {order.shippingCourier || "Ekspedisi"}
                            </span>
                            <span className="text-xs font-mono px-2 py-0.5 rounded border w-fit text-slate-900 bg-stone-100 border-stone-200 font-bold">
                              {order.trackingNumber}
                            </span>
                          </div>
                        ) : s === "paid" || s === "processing" ? (
                          <button
                            onClick={() => handleOpenShipModal(order)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition active:scale-95 cursor-pointer bg-[#FAF0ED] hover:bg-[#B9382B] text-[#B9382B] hover:text-white border-[#B9382B]/30 shadow-xs"
                          >
                            <Truck size={14} /> Input Resi
                          </button>
                        ) : (
                          <span className="text-xs italic text-stone-400">-</span>
                        )}
                      </td>
                      <td className="py-3 px-3.5">
                        <button
                          onClick={() => setLabelOrder(order)}
                          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition active:scale-95 whitespace-nowrap cursor-pointer bg-stone-100 hover:bg-[#162018] text-stone-800 hover:text-white border border-stone-200 shadow-xs"
                          title="Cetak Label Pengiriman Thermal A6 & Packing Slip"
                        >
                          <Printer size={14} /> Cetak Label A6
                        </button>
                      </td>
                      <td className="py-3 px-3.5">
                        {s === "completed" ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-mono font-bold whitespace-nowrap">
                            <CheckCircle2 size={13} /> Selesai
                          </span>
                        ) : s === "cancelled" ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-50 text-rose-700 border border-rose-200 text-xs font-mono font-bold whitespace-nowrap">
                            <Ban size={13} /> Dibatalkan
                          </span>
                        ) : s === "pending" ? (
                          <div className="flex items-center gap-1.5 whitespace-nowrap">
                            <button
                              type="button"
                              onClick={() => handleSyncPayment(order)}
                              disabled={syncingOrderId === order.id}
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 text-xs font-mono font-bold transition active:scale-95 cursor-pointer disabled:opacity-50"
                              title="Sinkronkan status pembayaran terkini dari Midtrans"
                            >
                              <RefreshCw size={12} className={syncingOrderId === order.id ? "animate-spin" : ""} />
                              <span>Sync</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => updateStatus(order.id, "cancelled", s)}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-mono font-bold transition active:scale-95 cursor-pointer"
                              title="Batalkan pesanan ini"
                            >
                              <Ban size={12} />
                              <span>Batal</span>
                            </button>
                          </div>
                        ) : s === "paid" ? (
                          <div className="flex items-center gap-1.5 whitespace-nowrap">
                            <button
                              type="button"
                              onClick={() => updateStatus(order.id, "processing", s)}
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#B9382B] hover:bg-[#9E2D22] text-white text-xs font-mono font-bold transition active:scale-95 cursor-pointer shadow-xs"
                              title="Pindahkan ke antrean produksi Atelier"
                            >
                              <span>Mulai Jahit →</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => updateStatus(order.id, "cancelled", s)}
                              className="p-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs transition cursor-pointer"
                              title="Batalkan pesanan"
                            >
                              <Ban size={13} />
                            </button>
                          </div>
                        ) : s === "processing" ? (
                          <div className="flex items-center gap-1.5 whitespace-nowrap">
                            <button
                              type="button"
                              onClick={() => handleOpenShipModal(order)}
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-mono font-bold transition active:scale-95 cursor-pointer shadow-xs"
                              title="Input nomor resi pengiriman kurir"
                            >
                              <Truck size={13} />
                              <span>Kirim Resi</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => updateStatus(order.id, "cancelled", s)}
                              className="p-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs transition cursor-pointer"
                              title="Batalkan pesanan"
                            >
                              <Ban size={13} />
                            </button>
                          </div>
                        ) : s === "shipped" ? (
                          <div className="flex items-center gap-1.5 whitespace-nowrap">
                            <button
                              type="button"
                              onClick={async () => {
                                try {
                                  await api.patch(`/orders/${order.id}/complete`);
                                  toast.success("Pesanan berhasil ditandai selesai");
                                  getOrders();
                                } catch (e) {
                                  toast.error(e.response?.data?.message || "Gagal menyelesaikan pesanan");
                                }
                              }}
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-mono font-bold transition active:scale-95 cursor-pointer shadow-xs"
                              title="Tandai pesanan telah sampai dan selesai"
                            >
                              <CheckCircle2 size={13} />
                              <span>Selesaikan</span>
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs text-stone-400 font-mono">-</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pagination */}
      {!loading && totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 mt-10">
          <button
            disabled={page === 1}
            onClick={() => setPage((p) => Math.max(p - 1, 1))}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-white border border-stone-200/80 hover:bg-stone-50 rounded-xl text-stone-700 disabled:opacity-40 disabled:cursor-not-allowed transition font-bold text-xs shadow-xs cursor-pointer"
          >
            <ChevronLeft size={16} />
            Sebelumnya
          </button>

          <div className="px-5 py-2.5 bg-white border border-stone-200/80 rounded-xl text-xs text-stone-600 font-bold shadow-xs">
            Halaman <span className="text-slate-900">{page}</span> dari {totalPages}
          </div>

          <button
            disabled={page === totalPages}
            onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-white border border-stone-200/80 hover:bg-stone-50 rounded-xl text-stone-700 disabled:opacity-40 disabled:cursor-not-allowed transition font-bold text-xs shadow-xs cursor-pointer"
          >
            Berikutnya
            <ChevronRight size={16} />
          </button>
        </div>
      )}

      {/* Modal Input Resi / Kirim Pesanan */}
      {shippingOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative w-full max-w-md bg-white border border-stone-200 rounded-3xl p-6 shadow-2xl text-slate-900">
            <div className="flex items-center justify-between pb-4 mb-5 border-b border-stone-100">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-[#FAF0ED] text-[#B9382B] border border-[#B9382B]/20">
                  <Truck size={22} />
                </div>
                <div>
                  <h3 className="font-['Barlow_Condensed'] font-black uppercase tracking-wide text-2xl text-slate-900 leading-none">
                    Kirim Pesanan
                  </h3>
                  <p className="text-xs text-stone-500 font-mono mt-0.5">#{shippingOrder.orderNumber}</p>
                </div>
              </div>
              <button
                onClick={() => setShippingOrder(null)}
                className="p-1.5 text-stone-400 hover:text-slate-900 rounded-xl hover:bg-stone-100 transition cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            {/* Destination Preview */}
            <div className="mb-4 p-3.5 rounded-2xl bg-stone-50 border border-stone-200 text-xs text-stone-700 space-y-1">
              <p>
                <span className="text-stone-400">Penerima:</span>{" "}
                <strong className="text-slate-900">
                  {shippingOrder.recipientName || shippingOrder.customerName || "Customer"}
                </strong>
                {(shippingOrder.customerPhone || shippingOrder.shippingPhone) && (
                  <span className="font-mono text-stone-500 ml-1.5">
                    ({shippingOrder.customerPhone || shippingOrder.shippingPhone})
                  </span>
                )}
              </p>
              <p className="text-stone-600">
                <span className="text-stone-400">Alamat:</span>{" "}
                {[
                  shippingOrder.shippingAddress || shippingOrder.shipping_address,
                  shippingOrder.shippingCity,
                  shippingOrder.shippingPostalCode,
                ]
                  .filter(Boolean)
                  .join(", ") || "Alamat tidak tercantum"}
              </p>
              {shippingOrder.shippingNotes && (
                <p className="text-amber-800 bg-amber-50 px-2 py-1 rounded-lg border border-amber-200 text-[11px] mt-1 font-medium">
                  <span className="font-bold">Catatan:</span> {shippingOrder.shippingNotes}
                </p>
              )}
            </div>

            <form onSubmit={handleShipSubmit} className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-700 mb-2">
                  Pilih Kurir / Ekspedisi
                </label>
                <select
                  value={courier}
                  onChange={(e) => setCourier(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-2.5 text-xs font-semibold text-slate-900 outline-hidden focus:bg-white focus:border-[#B9382B] transition cursor-pointer"
                >
                  {courierList.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-700 mb-2">
                  Nomor Resi Pengiriman
                </label>
                <input
                  type="text"
                  placeholder="Contoh: JP8829104812"
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-2.5 text-xs text-slate-900 outline-hidden focus:bg-white focus:border-[#B9382B] transition font-mono font-bold placeholder:text-stone-400"
                  required
                />
              </div>

              <div className="pt-3 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShippingOrder(null)}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={shippingSubmitting}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#B9382B] hover:bg-[#9E2D22] text-white font-bold text-xs uppercase tracking-wider transition active:scale-95 disabled:opacity-50 shadow-md cursor-pointer"
                >
                  <PackageCheck size={16} />
                  {shippingSubmitting ? "Mengirim..." : "Kirim Pesanan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Floating Action Bar untuk Cetak Massal */}
      {selectedOrderIds.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-[#162018] border border-white/10 rounded-2xl px-5 py-3 shadow-2xl shadow-black/40 flex items-center gap-3 sm:gap-4 animate-in fade-in slide-in-from-bottom-4">
          <div className="flex items-center gap-2 text-xs sm:text-sm text-white font-medium">
            <span className="w-6 h-6 rounded-full bg-[#B9382B] text-white font-black text-xs flex items-center justify-center">
              {selectedOrderIds.length}
            </span>
            <span className="hidden sm:inline">Pesanan terpilih</span>
          </div>

          <div className="h-4 w-px bg-white/20" />

          <button
            onClick={() => setShowBulkModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#B9382B] hover:bg-[#9E2D22] text-white text-xs font-bold transition cursor-pointer shadow-md active:scale-95"
          >
            <Printer size={15} />
            Cetak {selectedOrderIds.length} Label Thermal (A6)
          </button>

          <button
            onClick={() => setSelectedOrderIds([])}
            className="text-xs text-stone-300 hover:text-white px-2 py-1 transition cursor-pointer"
          >
            Batal
          </button>
        </div>
      )}

      {/* Modal Cetak Label Thermal Pengiriman Satuan */}
      <ShippingLabelModal
        isOpen={!!labelOrder}
        onClose={() => setLabelOrder(null)}
        order={labelOrder}
      />

      {/* Modal Cetak Massal Label Thermal Pengiriman */}
      <BulkShippingLabelModal
        isOpen={showBulkModal}
        onClose={() => setShowBulkModal(false)}
        orders={filteredOrders.filter((o) => selectedOrderIds.includes(o.id))}
      />
    </div>
  );
}