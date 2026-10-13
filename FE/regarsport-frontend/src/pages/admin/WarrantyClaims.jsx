/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useState, useMemo } from "react";
import {
  ShieldCheck,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  Truck,
  Layers,
  Copy,
  Check,
  Eye,
  RefreshCw,
  X,
  MessageSquare,
} from "lucide-react";
import api from "../../services/api";
import toast from "react-hot-toast";
import { useAuth } from "../../context/AuthContext";

const statusConfig = {
  PENDING: {
    label: "Menunggu Verifikasi CS",
    color: "bg-amber-500/10 text-amber-400 border-amber-500/30",
    badge: "Pending",
    icon: Clock,
  },
  APPROVED: {
    label: "Disetujui CS (Menunggu Gudang)",
    color: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
    badge: "Disetujui",
    icon: CheckCircle2,
  },
  PROCESSING: {
    label: "Sedang Diproses Gudang",
    color: "bg-blue-500/10 text-blue-400 border-blue-500/30",
    badge: "Diproses",
    icon: RefreshCw,
  },
  RESOLVED: {
    label: "Selesai (Resi Dikirim)",
    color: "bg-teal-500/10 text-teal-300 border-teal-500/30",
    badge: "Selesai",
    icon: Truck,
  },
  REJECTED: {
    label: "Ditolak",
    color: "bg-rose-500/10 text-rose-400 border-rose-500/30",
    badge: "Ditolak",
    icon: XCircle,
  },
};

const categoryLabels = {
  SIZE_EXCHANGE: "Tukar Ukuran (Size Exchange)",
  PRINTING_DEFECT: "Cacat Sablon / Warna",
  SEWING_DEFECT: "Cacat Jahitan / Bahan",
  OTHER: "Kendala Lainnya",
};

const solutionLabels = {
  EXCHANGE_SIZE: "Tukar Ukuran Baru",
  REPLACEMENT: "Produksi Ulang 100% Baru",
  REPAIR: "Perbaikan Gratis",
};

const courierList = [
  "J&T Express",
  "JNE Reguler",
  "SiCepat Ekspres",
  "Anteraja",
  "Pos Indonesia",
  "ID Express",
];

export default function WarrantyClaims() {
  const { user } = useAuth();
  const isLogistics = user?.role === "logistics";

  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);

  // Active selected claim for modal detail/action
  const [activeClaim, setActiveClaim] = useState(null);
  const [adminNotes, setAdminNotes] = useState("");
  const [replacementCourier, setReplacementCourier] = useState(courierList[0]);
  const [replacementTrackingNumber, setReplacementTrackingNumber] = useState("");
  const [submittingAction, setSubmittingAction] = useState(false);

  // Lightbox preview for photos
  const [previewImage, setPreviewImage] = useState(null);
  const [copiedText, setCopiedText] = useState(null);

  const fetchClaims = async () => {
    try {
      setLoading(true);
      const res = await api.get("/warranty-claims/admin", {
        params: {
          status: statusFilter ? statusFilter.toUpperCase() : undefined,
          page,
          size: 10,
        },
      });
      const data = res.data?.data;
      if (data) {
        setClaims(data.content || []);
        setTotalPages(data.totalPages || 1);
        setTotalElements(data.totalElements || 0);
      } else {
        setClaims([]);
      }
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Gagal memuat daftar klaim garansi");
      setClaims([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClaims();
  }, [page, statusFilter]);

  const handleCopy = (text, label) => {
    navigator.clipboard.writeText(text);
    setCopiedText(label);
    toast.success(`${label} disalin`);
    setTimeout(() => setCopiedText(null), 2000);
  };

  const handleOpenDetailModal = (claim) => {
    setActiveClaim(claim);
    setAdminNotes(claim.adminNotes || "");
    setReplacementTrackingNumber(claim.replacementTrackingNumber || "");
  };

  const handleCloseModal = () => {
    setActiveClaim(null);
    setAdminNotes("");
    setReplacementTrackingNumber("");
  };

  const handleUpdateStatus = async (newStatus) => {
    if (!activeClaim) return;

    if (newStatus === "REJECTED" && !adminNotes.trim()) {
      toast.error("Wajib mengisi alasan penolakan klaim untuk pelanggan");
      return;
    }

    if (newStatus === "RESOLVED" && !replacementTrackingNumber.trim()) {
      toast.error("Wajib mengisi nomor resi pengiriman produk pengganti");
      return;
    }

    try {
      setSubmittingAction(true);
      const payload = {
        status: newStatus,
        adminNotes: adminNotes.trim(),
        replacementTrackingNumber: replacementTrackingNumber.trim()
          ? `${replacementCourier} - ${replacementTrackingNumber.trim()}`
          : undefined,
      };

      const res = await api.patch(`/warranty-claims/${activeClaim.id}/status`, payload);
      toast.success(res.data?.message || "Status klaim garansi berhasil diperbarui!");
      handleCloseModal();
      fetchClaims();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Gagal memperbarui status klaim");
    } finally {
      setSubmittingAction(false);
    }
  };

  // Filter claims by client search query
  const filteredClaims = useMemo(() => {
    if (!searchQuery.trim()) return claims;
    const q = searchQuery.toLowerCase();
    return claims.filter(
      (c) =>
        (c.claimNumber || "").toLowerCase().includes(q) ||
        (c.orderNumber || "").toLowerCase().includes(q) ||
        (c.productName || "").toLowerCase().includes(q) ||
        (c.description || "").toLowerCase().includes(q)
    );
  }, [claims, searchQuery]);

  // Quick stats computed
  const stats = useMemo(() => {
    let pending = 0;
    let approved = 0;
    let processing = 0;
    let resolved = 0;

    claims.forEach((c) => {
      const s = (c.status || "").toUpperCase();
      if (s === "PENDING") pending++;
      else if (s === "APPROVED") approved++;
      else if (s === "PROCESSING") processing++;
      else if (s === "RESOLVED") resolved++;
    });

    return { pending, approved, processing, resolved };
  }, [claims]);

  return (
    <div className="space-y-8 animate-in fade-in duration-300 pb-12">
      {/* Header Banner Tactical Forest */}
      <div className="relative overflow-hidden rounded-3xl border border-black/15 shadow-xl bg-[#162018] text-white p-6 sm:p-8">
        <div className="absolute inset-0 bg-topography opacity-15 pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="max-w-2xl">
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full bg-white/10 text-emerald-400 font-mono text-[10px] font-black tracking-widest border border-white/10 uppercase">
                {isLogistics ? "RS // WARRANTY DISPATCH" : "RS // WARRANTY CENTER"}
              </span>
              <span className="text-[11px] font-mono uppercase tracking-widest text-stone-300">
                {isLogistics ? "INSPEKSI FISIK & PENGGANTIAN RESMI" : "VERIFIKASI KLAIM PELANGGAN"}
              </span>
            </div>
            <h1 className="font-['Barlow_Condensed'] font-black uppercase tracking-tight text-3xl sm:text-5xl text-white leading-none">
              {isLogistics ? "RETUR & PENGGANTIAN GARANSI" : "KLAIM GARANSI & RETUR"}
            </h1>
            <p className="text-stone-300 text-xs sm:text-sm mt-2 leading-relaxed">
              {isLogistics
                ? "Pemeriksaan paket retur masuk, pengepakan tukar ukuran, dan pengiriman resi produk pengganti."
                : "Verifikasi tiket kendala pelanggan, validasi bukti foto/video apparel, dan persetujuan klaim garansi atelier."}
            </p>

            <div className="flex flex-wrap items-center gap-4 mt-4 pt-3 border-t border-white/10 text-xs font-mono text-stone-300">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-400" />
                <span>MENUNGGU VERIFIKASI: {stats.pending}</span>
              </div>
              <span className="text-white/20">•</span>
              <div className="flex items-center gap-1.5 text-emerald-400">
                <span>DISETUJUI / SELESAI: {stats.approved + stats.resolved}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={fetchClaims}
              disabled={loading}
              className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/15 text-white text-xs font-bold transition active:scale-95 cursor-pointer shadow-sm"
            >
              <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
              <span>Segarkan Data</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Stats Bar */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="p-5 rounded-3xl border flex items-center gap-3.5 shadow-xs bg-white border-stone-200/80">
          <div className="w-10 h-10 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 flex items-center justify-center shrink-0">
            <Clock size={20} />
          </div>
          <div>
            <div className="text-2xl font-black font-['Barlow_Condensed'] text-slate-900">
              {stats.pending}
            </div>
            <div className="text-[11px] font-semibold text-stone-500">
              Menunggu Verifikasi CS
            </div>
          </div>
        </div>

        <div className="p-5 rounded-3xl border flex items-center gap-3.5 shadow-xs bg-white border-stone-200/80">
          <div className="w-10 h-10 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center justify-center shrink-0">
            <CheckCircle2 size={20} />
          </div>
          <div>
            <div className="text-2xl font-black font-['Barlow_Condensed'] text-slate-900">
              {stats.approved}
            </div>
            <div className="text-[11px] font-semibold text-stone-500">
              Disetujui / Siap Kirim
            </div>
          </div>
        </div>

        <div className="p-5 rounded-3xl border flex items-center gap-3.5 shadow-xs bg-white border-stone-200/80">
          <div className="w-10 h-10 rounded-2xl bg-stone-100 border border-stone-200 text-stone-800 flex items-center justify-center shrink-0">
            <Layers size={20} />
          </div>
          <div>
            <div className="text-2xl font-black font-['Barlow_Condensed'] text-slate-900">
              {stats.processing}
            </div>
            <div className="text-[11px] font-semibold text-stone-500">
              Diproses di Gudang
            </div>
          </div>
        </div>

        <div className="p-5 rounded-3xl border flex items-center gap-3.5 shadow-xs bg-white border-stone-200/80">
          <div className="w-10 h-10 rounded-2xl bg-stone-100 border border-stone-200 text-stone-800 flex items-center justify-center shrink-0">
            <Truck size={20} />
          </div>
          <div>
            <div className="text-2xl font-black font-['Barlow_Condensed'] text-slate-900">
              {stats.resolved}
            </div>
            <div className="text-[11px] font-semibold text-stone-500">
              Pengganti Terkirim / Selesai
            </div>
          </div>
        </div>
      </div>

      {/* Filter Tabs & Search */}
      <div className="space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar">
            {[
              { label: "Semua Tiket", value: "" },
              { label: "Menunggu Review", value: "PENDING", badge: stats.pending > 0 ? stats.pending : null },
              { label: "Disetujui CS", value: "APPROVED", badge: stats.approved > 0 ? stats.approved : null },
              { label: "Proses Gudang", value: "PROCESSING" },
              { label: "Selesai (Resi Dikirim)", value: "RESOLVED" },
              { label: "Ditolak", value: "REJECTED" },
            ].map((tab) => {
              const isActive = (statusFilter || "").toUpperCase() === tab.value;
              return (
                <button
                  key={tab.value}
                  onClick={() => {
                    setPage(1);
                    setStatusFilter(tab.value);
                  }}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                    isActive
                      ? "bg-[#111613] text-white shadow-md"
                      : "bg-white text-stone-600 hover:text-black hover:bg-stone-100 border border-stone-200"
                  }`}
                >
                  <span>{tab.label}</span>
                  {tab.badge && (
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                      isActive ? "bg-white/20 text-white" : "bg-amber-50 text-amber-800 border border-amber-200"
                    }`}>
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Search Box */}
          <div className="relative w-full lg:w-72 shrink-0">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
            <input
              type="text"
              placeholder="Cari Tiket, Order, Produk..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-full text-xs outline-hidden transition font-mono bg-white border border-stone-200/80 text-slate-900 placeholder:text-stone-400 focus:border-[#B9382B] focus:ring-1 focus:ring-[#B9382B] shadow-xs"
            />
          </div>
        </div>
      </div>

      {/* Main Table */}
      <div className="rounded-3xl overflow-hidden shadow-xs bg-white border border-stone-200/80">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center text-center">
            <RefreshCw size={32} className="animate-spin mb-3 text-[#B9382B]" />
            <p className="text-sm text-stone-500 font-semibold">Memuat data klaim garansi...</p>
          </div>
        ) : filteredClaims.length === 0 ? (
          <div className="py-20 px-4 text-center">
            <ShieldCheck size={48} className="text-stone-300 mx-auto mb-3" />
            <h3 className="text-base font-bold mb-1 text-slate-900">Tidak Ada Tiket Klaim</h3>
            <p className="text-xs text-stone-500 max-w-sm mx-auto">
              {statusFilter
                ? `Tidak ditemukan tiket klaim dengan status "${statusFilter}".`
                : "Belum ada pengajuan klaim garansi atau kendala pesanan dari pelanggan."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b font-bold uppercase tracking-wider text-[11px] bg-stone-50/70 border-stone-200 text-stone-600">
                  <th className="py-4 px-5">Tiket Klaim &amp; Tanggal</th>
                  <th className="py-4 px-5">No. Pesanan &amp; Pemesan</th>
                  <th className="py-4 px-5">Produk &amp; Solusi</th>
                  <th className="py-4 px-5">Bukti Foto</th>
                  <th className="py-4 px-5">Status</th>
                  <th className="py-4 px-5">Resi Pengganti</th>
                  <th className="py-4 px-5 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {filteredClaims.map((claim) => {
                  const statusInfo = statusConfig[claim.status] || statusConfig.PENDING;
                  const StatusIcon = statusInfo.icon;
                  const dateStr = claim.createdAt
                    ? new Date(claim.createdAt).toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : "-";

                  const evidenceUrls = (claim.evidenceImages || "")
                    .split(",")
                    .map((s) => s.trim())
                    .filter(Boolean);

                  return (
                    <tr
                      key={claim.id || claim.claimNumber}
                      className="hover:bg-stone-50/60 transition-colors group"
                    >
                      {/* Ticket Number & Date */}
                      <td className="py-4 px-5">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-bold text-[#B9382B] text-sm">
                            #{claim.claimNumber}
                          </span>
                          <button
                            onClick={() => handleCopy(claim.claimNumber, "No. Tiket")}
                            className="text-stone-400 hover:text-slate-900 p-1 rounded-md transition cursor-pointer"
                            title="Salin Tiket"
                          >
                            {copiedText === "No. Tiket" ? (
                              <Check size={12} className="text-emerald-600" />
                            ) : (
                              <Copy size={12} />
                            )}
                          </button>
                        </div>
                        <div className="text-[10px] text-stone-400 font-mono mt-0.5">{dateStr}</div>
                      </td>

                      {/* Order Number & User */}
                      <td className="py-4 px-5">
                        <div className="font-mono font-bold text-slate-800">
                          {claim.orderNumber || `#${claim.orderId}`}
                        </div>
                        <div className="text-[10px] text-stone-400 font-mono mt-0.5">
                          User ID: #{claim.userId}
                        </div>
                      </td>

                      {/* Product & Solution */}
                      <td className="py-4 px-5 max-w-xs">
                        <div className="flex items-center gap-3">
                          <img
                            src={claim.productImage || "https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=100"}
                            alt={claim.productName}
                            className="w-10 h-10 rounded-xl object-cover bg-stone-100 border border-stone-200 shrink-0"
                          />
                          <div className="min-w-0">
                            <div className="font-bold text-slate-900 truncate" title={claim.productName}>
                              {claim.productName}
                            </div>
                            <div className="flex items-center gap-1 text-[11px] text-stone-600 font-semibold mt-0.5">
                              <span>{solutionLabels[claim.solution] || claim.solution}</span>
                              {claim.requestedSize && (
                                <span className="bg-[#FAF0ED] text-[#B9382B] border border-[#B9382B]/20 px-1.5 py-0.2 rounded-md text-[10px] font-mono font-bold">
                                  Size {claim.requestedSize}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Evidence Photo */}
                      <td className="py-4 px-5">
                        {evidenceUrls.length > 0 ? (
                          <div className="flex items-center gap-1.5">
                            {evidenceUrls.slice(0, 2).map((img, i) => (
                              <button
                                key={i}
                                type="button"
                                onClick={() => setPreviewImage(img)}
                                className="relative w-9 h-9 rounded-xl overflow-hidden border border-stone-200 hover:border-[#B9382B] transition group/img cursor-pointer shadow-xs"
                              >
                                <img src={img} alt="Bukti" className="w-full h-full object-cover" />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 flex items-center justify-center transition">
                                  <Eye size={12} className="text-white" />
                                </div>
                              </button>
                            ))}
                            {evidenceUrls.length > 2 && (
                              <span className="text-[10px] text-stone-600 font-bold bg-stone-100 px-1.5 py-1 rounded-md">
                                +{evidenceUrls.length - 2}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-[10px] text-stone-400 italic">Tanpa foto</span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-4 px-5">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border ${statusInfo.color}`}
                        >
                          <StatusIcon size={12} />
                          <span>{statusInfo.badge}</span>
                        </span>
                      </td>

                      {/* Replacement Tracking */}
                      <td className="py-4 px-5">
                        {claim.replacementTrackingNumber ? (
                          <div className="space-y-0.5">
                            <div className="font-mono text-xs font-bold text-emerald-700 flex items-center gap-1">
                              <span>{claim.replacementTrackingNumber}</span>
                              <button
                                onClick={() => handleCopy(claim.replacementTrackingNumber, "Resi Pengganti")}
                                className="text-stone-400 hover:text-slate-800 p-0.5 rounded-md cursor-pointer"
                              >
                                <Copy size={11} />
                              </button>
                            </div>
                            <span className="text-[10px] text-stone-500 font-medium">Pengganti Terkirim</span>
                          </div>
                        ) : (
                          <span className="text-stone-400 text-[11px]">-</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-5 text-right">
                        <button
                          type="button"
                          onClick={() => handleOpenDetailModal(claim)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-stone-100 hover:bg-[#162018] text-stone-700 hover:text-white font-bold text-xs border border-stone-200 transition active:scale-95 cursor-pointer shadow-xs"
                        >
                          <Eye size={13} />
                          <span>Tinjau</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-stone-100 flex items-center justify-between text-xs text-stone-500">
            <div>
              Menampilkan {filteredClaims.length} dari total {totalElements} tiket klaim
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="px-3 py-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 disabled:opacity-40 text-stone-700 font-bold transition cursor-pointer"
              >
                Sebelumnya
              </button>
              <span className="px-2 font-bold text-slate-800">
                {page} / {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="px-3 py-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 disabled:opacity-40 text-stone-700 font-bold transition cursor-pointer"
              >
                Selanjutnya
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Detail & Action Modal */}
      {activeClaim && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white border border-stone-200 rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col text-slate-900">
            {/* Modal Header */}
            <div className="p-5 border-b border-stone-100 flex items-center justify-between sticky top-0 bg-white/95 backdrop-blur-md z-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#FAF0ED] border border-[#B9382B]/20 text-[#B9382B] flex items-center justify-center shadow-xs">
                  <ShieldCheck size={22} />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 flex items-center gap-2 font-['Barlow_Condensed'] uppercase tracking-wide">
                    <span>Tiket #{activeClaim.claimNumber}</span>
                    <span
                      className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold border ${
                        (statusConfig[activeClaim.status] || statusConfig.PENDING).color
                      }`}
                    >
                      {(statusConfig[activeClaim.status] || statusConfig.PENDING).badge}
                    </span>
                  </h3>
                  <p className="text-xs text-stone-500 font-mono">
                    Order: {activeClaim.orderNumber || `#${activeClaim.orderId}`} &bull; Pemesan ID: #{activeClaim.userId}
                  </p>
                </div>
              </div>
              <button
                onClick={handleCloseModal}
                className="p-1.5 text-stone-400 hover:text-slate-900 rounded-xl hover:bg-stone-100 transition cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6 text-xs flex-1">
              {/* Product Info Card */}
              <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <img
                    src={activeClaim.productImage || "https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=100"}
                    alt={activeClaim.productName}
                    className="w-14 h-14 rounded-xl object-cover bg-white border border-stone-200 shrink-0"
                  />
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">{activeClaim.productName}</h4>
                    <p className="text-stone-500 mt-0.5">
                      Kategori: <span className="text-slate-800 font-semibold">{categoryLabels[activeClaim.category] || activeClaim.category}</span>
                    </p>
                    <p className="text-[#B9382B] font-bold mt-0.5">
                      Solusi: {solutionLabels[activeClaim.solution] || activeClaim.solution}
                      {activeClaim.requestedSize && (
                        <span className="ml-1 text-[#B9382B] font-mono bg-[#FAF0ED] px-1.5 py-0.5 rounded-md border border-[#B9382B]/20">
                          (Ukuran Baru: {activeClaim.requestedSize})
                        </span>
                      )}
                    </p>
                  </div>
                </div>
              </div>

              {/* Customer Complaint Description */}
              <div className="space-y-1.5">
                <div className="text-stone-700 font-bold uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                  <MessageSquare size={13} className="text-[#B9382B]" />
                  Keluhan / Alasan Pelanggan:
                </div>
                <div className="p-3.5 rounded-2xl bg-stone-50 border border-stone-200 text-slate-800 text-xs leading-relaxed italic">
                  &ldquo;{activeClaim.description || "Tidak ada deskripsi tambahan."}&rdquo;
                </div>
              </div>

              {/* Evidence Images Gallery */}
              <div className="space-y-2">
                <div className="text-stone-700 font-bold uppercase tracking-wider text-[11px]">
                  Foto Bukti Cacat / Ukuran (Cloudinary CDN):
                </div>
                {activeClaim.evidenceImages ? (
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5">
                    {activeClaim.evidenceImages.split(",").map((img, idx) => (
                      <div
                        key={idx}
                        onClick={() => setPreviewImage(img.trim())}
                        className="group/thumb relative aspect-square rounded-2xl overflow-hidden border border-stone-200 hover:border-[#B9382B] bg-stone-100 cursor-pointer transition shadow-xs"
                      >
                        <img
                          src={img.trim()}
                          alt={`Bukti ${idx + 1}`}
                          className="w-full h-full object-cover transition group-hover/thumb:scale-105"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/thumb:opacity-100 flex items-center justify-center transition">
                          <Eye size={18} className="text-white" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-stone-400 italic">Tidak ada foto bukti yang disertakan.</p>
                )}
              </div>

              {/* Existing Admin Notes or Tracking */}
              {(activeClaim.adminNotes || activeClaim.replacementTrackingNumber) && (
                <div className="p-3.5 rounded-2xl bg-stone-50 border border-stone-200 space-y-2">
                  <div className="font-bold text-stone-700 text-[11px] uppercase tracking-wider">
                    Catatan Internal & Tracking Saat Ini:
                  </div>
                  {activeClaim.adminNotes && (
                    <div className="text-slate-800">
                      <span className="text-stone-500 font-semibold">Catatan CS/Admin: </span>
                      {activeClaim.adminNotes}
                    </div>
                  )}
                  {activeClaim.replacementTrackingNumber && (
                    <div className="text-emerald-700 font-mono font-bold">
                      <span className="text-stone-500 font-semibold">Resi Pengganti: </span>
                      {activeClaim.replacementTrackingNumber}
                    </div>
                  )}
                </div>
              )}

              {/* Action Forms */}
              <div className="pt-4 border-t border-stone-100 space-y-4">
                <div className="flex items-center justify-between">
                  <h5 className="font-bold text-slate-900 text-xs uppercase tracking-wider">
                    Tindakan & Verifikasi
                  </h5>
                  <span className="text-[10px] text-stone-500 font-semibold">
                    Role Anda: {isLogistics ? "Gudang / Logistik" : "Admin / CS"}
                  </span>
                </div>

                {/* Form Input Catatan CS / Alasan */}
                <div>
                  <label className="block text-stone-700 text-xs font-bold uppercase tracking-wider mb-1.5">
                    Catatan Verifikasi / Instruksi untuk Pelanggan:
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Contoh: Disetujui. Silakan kirimkan jersey lama ke Gudang RegarStore Wonogiri..."
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    className="w-full p-3 rounded-xl bg-stone-50 border border-stone-200 focus:bg-white focus:border-[#B9382B] focus:ring-1 focus:ring-[#B9382B] text-xs text-slate-900 placeholder:text-stone-400 outline-hidden transition resize-none leading-relaxed font-medium"
                  />
                </div>

                {/* If APPROVED or PROCESSING, show Replacement Tracking Input for Gudang */}
                {(activeClaim.status === "APPROVED" || activeClaim.status === "PROCESSING") && (
                  <div className="p-4 rounded-2xl bg-[#FAF0ED] border border-[#B9382B]/20 space-y-3">
                    <div className="flex items-center gap-2 text-xs font-bold text-[#B9382B]">
                      <Truck size={15} />
                      <span>Pengiriman Produk Pengganti / Hasil Retur (Gudang)</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-stone-700 text-[11px] font-bold mb-1">
                          Pilih Ekspedisi:
                        </label>
                        <select
                          value={replacementCourier}
                          onChange={(e) => setReplacementCourier(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl bg-white border border-stone-200 text-xs text-slate-900 outline-hidden focus:border-[#B9382B] font-semibold cursor-pointer"
                        >
                          {courierList.map((c) => (
                            <option key={c} value={c}>
                              {c}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block text-stone-700 text-[11px] font-bold mb-1">
                          Nomor Resi Baru:
                        </label>
                        <input
                          type="text"
                          placeholder="Misal: JT88927192801"
                          value={replacementTrackingNumber}
                          onChange={(e) => setReplacementTrackingNumber(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl bg-white border border-stone-200 text-xs text-slate-900 outline-hidden focus:border-[#B9382B] font-mono font-bold"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex flex-wrap items-center justify-end gap-2.5 pt-2">
                  {activeClaim.status === "PENDING" && (
                    <>
                      <button
                        type="button"
                        disabled={submittingAction}
                        onClick={() => handleUpdateStatus("REJECTED")}
                        className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold transition active:scale-95 disabled:opacity-50 cursor-pointer"
                      >
                        <XCircle size={15} />
                        <span>Tolak Klaim</span>
                      </button>

                      <button
                        type="button"
                        disabled={submittingAction}
                        onClick={() => handleUpdateStatus("APPROVED")}
                        className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-[#B9382B] hover:bg-[#9E2D22] text-white text-xs font-bold shadow-md transition active:scale-95 disabled:opacity-50 cursor-pointer"
                      >
                        <CheckCircle2 size={15} />
                        <span>Setujui Klaim</span>
                      </button>
                    </>
                  )}

                  {activeClaim.status === "APPROVED" && (
                    <>
                      <button
                        type="button"
                        disabled={submittingAction}
                        onClick={() => handleUpdateStatus("PROCESSING")}
                        className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-xs font-bold transition active:scale-95 disabled:opacity-50 cursor-pointer"
                      >
                        <RefreshCw size={14} />
                        <span>Terima Retur & Proses di Gudang</span>
                      </button>

                      <button
                        type="button"
                        disabled={submittingAction}
                        onClick={() => handleUpdateStatus("RESOLVED")}
                        className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md transition active:scale-95 disabled:opacity-50 cursor-pointer"
                      >
                        <Truck size={15} />
                        <span>Kirim Resi Pengganti & Selesaikan</span>
                      </button>
                    </>
                  )}

                  {activeClaim.status === "PROCESSING" && (
                    <button
                      type="button"
                      disabled={submittingAction}
                      onClick={() => handleUpdateStatus("RESOLVED")}
                      className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md transition active:scale-95 disabled:opacity-50 cursor-pointer"
                    >
                      <Truck size={15} />
                      <span>Kirim Resi Pengganti & Selesaikan</span>
                    </button>
                  )}

                  {(activeClaim.status === "RESOLVED" || activeClaim.status === "REJECTED") && (
                    <button
                      type="button"
                      disabled={submittingAction}
                      onClick={() => handleUpdateStatus(activeClaim.status)}
                      className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-slate-800 text-xs font-bold transition active:scale-95 disabled:opacity-50 cursor-pointer"
                    >
                      <Check size={14} />
                      <span>Perbarui Catatan Saja</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Lightbox Modal for Photo Evidence */}
      {previewImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in"
          onClick={() => setPreviewImage(null)}
        >
          <div className="relative max-w-3xl max-h-[85vh] overflow-hidden rounded-2xl border border-white/20 shadow-2xl bg-black">
            <button
              onClick={() => setPreviewImage(null)}
              className="absolute top-3 right-3 z-10 p-2 rounded-full bg-black/70 text-white hover:bg-black transition cursor-pointer"
            >
              <X size={18} />
            </button>
            <img
              src={previewImage}
              alt="Bukti Besar"
              className="w-full h-full object-contain max-h-[85vh]"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}
    </div>
  );
}
