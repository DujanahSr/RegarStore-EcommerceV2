import { useEffect, useState } from "react";
import {
  Tag,
  Plus,
  Trash2,
  X,
  Loader2,
  Copy,
  Check,
} from "lucide-react";
import api from "../../services/api";
import toast from "react-hot-toast";
import { ScreenLoader } from "../../components/common/UiStates";
import { useConfirm } from "../../context/ConfirmContext";

export default function Vouchers() {
  const confirm = useConfirm();
  const [vouchers, setVouchers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [copiedCode, setCopiedCode] = useState("");

  const [formData, setFormData] = useState({
    code: "",
    name: "",
    discountType: "PERCENTAGE",
    discountValue: 10,
    minSpend: 100000,
    maxDiscount: 50000,
    usageLimit: 100,
    validUntil: "",
  });

  const fetchVouchers = async () => {
    try {
      setLoading(true);
      const res = await api.get("/orders/vouchers");
      const list = Array.isArray(res.data?.data) ? res.data.data : [];
      setVouchers(list);
    } catch (err) {
      console.error("Gagal memuat daftar kupon:", err);
      toast.error("Gagal memuat kupon promo");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVouchers();
  }, []);

  const handleCopyCode = (code) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    toast.success(`Kode '${code}' berhasil disalin!`);
    setTimeout(() => setCopiedCode(""), 2000);
  };

  const handleToggleActive = async (id) => {
    try {
      await api.patch(`/orders/vouchers/${id}/toggle`);
      toast.success("Status kupon berhasil diperbarui");
      fetchVouchers();
    } catch (err) {
      toast.error(err.response?.data?.message || "Gagal mengubah status");
    }
  };

  const handleDelete = async (id, code) => {
    if (!(await confirm({ title: `Hapus kupon '${code}'?`, message: "Kupon tidak bisa dipakai lagi oleh pelanggan.", confirmLabel: "Hapus Kupon", tone: "danger" }))) return;
    try {
      await api.delete(`/orders/vouchers/${id}`);
      toast.success(`Kupon '${code}' berhasil dihapus`);
      fetchVouchers();
    } catch (err) {
      toast.error(err.response?.data?.message || "Gagal menghapus kupon");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.code.trim()) {
      toast.error("Kode promo wajib diisi");
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        code: formData.code.trim().toUpperCase(),
        name: formData.name.trim(),
        discountType: formData.discountType,
        discountValue: Number(formData.discountValue),
        minSpend: formData.minSpend ? Number(formData.minSpend) : 0,
        maxDiscount:
          formData.discountType === "PERCENTAGE" && formData.maxDiscount
            ? Number(formData.maxDiscount)
            : null,
        usageLimit: formData.usageLimit ? Number(formData.usageLimit) : 100,
        isActive: true,
        validUntil: formData.validUntil ? new Date(formData.validUntil).toISOString() : null,
      };

      await api.post("/orders/vouchers", payload);
      toast.success(`Kupon promo '${payload.code}' berhasil dibuat!`);
      setShowAddModal(false);
      setFormData({
        code: "",
        name: "",
        discountType: "PERCENTAGE",
        discountValue: 10,
        minSpend: 100000,
        maxDiscount: 50000,
        usageLimit: 100,
        validUntil: "",
      });
      fetchVouchers();
    } catch (err) {
      toast.error(err.response?.data?.message || "Gagal membuat kupon promo");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Header Banner Tactical Forest */}
      <div className="relative overflow-hidden rounded-3xl border border-black/15 shadow-xl bg-[#162018] text-white p-6 sm:p-8">
        <div className="absolute inset-0 bg-topography opacity-15 pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="max-w-2xl">
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full bg-white/10 text-emerald-400 font-mono text-[10px] font-black tracking-widest border border-white/10 uppercase">
                RS // CAMPAIGN & PROMOTIONS
              </span>
              <span className="text-[11px] font-mono uppercase tracking-widest text-stone-300">
                ATELIER REWARD SYSTEM
              </span>
            </div>
            <h1 className="font-['Barlow_Condensed'] font-black uppercase tracking-tight text-3xl sm:text-5xl text-white leading-none">
              KUPON & VOUCHER PROMO
            </h1>
            <p className="text-stone-300 text-xs sm:text-sm mt-2 leading-relaxed">
              Kelola diskon promosi apparel olahraga, subsidi ongkir, kupon loyalitas pesanan tim, dan kuota potongan harga checkout Midtrans.
            </p>

            <div className="flex flex-wrap items-center gap-4 mt-4 pt-3 border-t border-white/10 text-xs font-mono text-stone-300">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <span>KUPON AKTIF: {vouchers.filter((v) => v.isActive).length}</span>
              </div>
              <span className="text-white/20">•</span>
              <div className="flex items-center gap-1.5">
                <Tag size={13} className="text-amber-400" />
                <span>TOTAL TERDAFTAR: {vouchers.length} KODE</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-[#B9382B] hover:bg-[#9E2D22] text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-[#B9382B]/30 transition-all active:scale-95 cursor-pointer"
            >
              <Plus size={16} strokeWidth={3} />
              <span>Buat Kupon Baru</span>
            </button>
          </div>
        </div>
      </div>

      {/* Vouchers Grid */}
      {loading ? (
        <ScreenLoader label="Memuat kupon promo..." />
      ) : vouchers.length === 0 ? (
        <div className="p-12 text-center rounded-3xl bg-white border border-stone-200/80 shadow-xs space-y-4">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-[#FAF0ED] border border-[#B9382B]/20 flex items-center justify-center text-[#B9382B]">
            <Tag size={32} />
          </div>
          <h3 className="font-['Barlow_Condensed'] font-black uppercase tracking-wide text-2xl text-slate-900">
            Belum Ada Kupon Promo
          </h3>
          <p className="text-xs text-stone-500 max-w-sm mx-auto">
            Buat kupon pertama Anda seperti diskon 10% atau potongan Rp 20.000 untuk menarik pembeli apparel olahraga.
          </p>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-5 py-2.5 rounded-xl bg-[#B9382B] hover:bg-[#9E2D22] text-white font-bold text-xs uppercase tracking-wider shadow-md transition cursor-pointer"
          >
            + Buat Kupon Sekarang
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {vouchers.map((voucher) => {
            const isPercentage = voucher.discountType === "PERCENTAGE";
            const usagePct = Math.min(
              100,
              Math.round(((voucher.usedCount || 0) / (voucher.usageLimit || 1)) * 100)
            );

            return (
              <div
                key={voucher.id}
                className={`p-6 rounded-3xl border transition-all flex flex-col justify-between space-y-5 relative overflow-hidden ${
                  voucher.isActive
                    ? "bg-white border-stone-200/80 hover:border-stone-300 hover:shadow-lg shadow-xs"
                    : "bg-stone-50/80 border-stone-200 opacity-70"
                }`}
              >
                {/* Top Section */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <button
                      onClick={() => handleCopyCode(voucher.code)}
                      className="group flex items-center gap-2 px-3 py-1.5 rounded-xl bg-stone-100 hover:bg-[#FAF0ED] border border-stone-200 text-xs font-mono font-black text-[#B9382B] transition-colors cursor-pointer"
                      title="Klik untuk menyalin kode"
                    >
                      <span>{voucher.code}</span>
                      {copiedCode === voucher.code ? (
                        <Check size={14} className="text-emerald-600" />
                      ) : (
                        <Copy size={14} className="opacity-60 group-hover:opacity-100" />
                      )}
                    </button>

                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-md border ${
                          voucher.isActive
                            ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                            : "bg-rose-50 text-rose-800 border-rose-200"
                        }`}
                      >
                        {voucher.isActive ? "Aktif" : "Nonaktif"}
                      </span>
                      <button
                        onClick={() => handleDelete(voucher.id, voucher.code)}
                        className="text-stone-400 hover:text-rose-600 p-1 rounded-lg transition-colors cursor-pointer"
                        title="Hapus kupon"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-slate-900">{voucher.name}</h3>
                    <div className="font-['Barlow_Condensed'] font-black text-3xl text-[#B9382B] tracking-tight leading-none mt-1">
                      {isPercentage
                        ? `Diskon ${voucher.discountValue}%`
                        : `Potongan Rp ${Number(voucher.discountValue).toLocaleString("id-ID")}`}
                    </div>
                  </div>

                  <div className="text-xs text-stone-500 space-y-1 pt-3 border-t border-stone-100">
                    <div className="flex justify-between items-center">
                      <span>Min. Belanja:</span>
                      <strong className="text-slate-800">Rp {Number(voucher.minSpend || 0).toLocaleString("id-ID")}</strong>
                    </div>
                    {isPercentage && voucher.maxDiscount && (
                      <div className="flex justify-between items-center">
                        <span>Maks. Potongan:</span>
                        <strong className="text-slate-800">Rp {Number(voucher.maxDiscount).toLocaleString("id-ID")}</strong>
                      </div>
                    )}
                    {voucher.validUntil && (
                      <div className="flex justify-between items-center">
                        <span>Berlaku s/d:</span>
                        <strong className="text-slate-800">
                          {new Date(voucher.validUntil).toLocaleDateString("id-ID", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })}
                        </strong>
                      </div>
                    )}
                  </div>
                </div>

                {/* Bottom Section: Usage & Toggle */}
                <div className="space-y-3 pt-3 border-t border-stone-100">
                  <div>
                    <div className="flex items-center justify-between text-[11px] font-semibold text-stone-500 mb-1">
                      <span>Pemakaian Kuota</span>
                      <span className="font-mono text-slate-800">
                        {voucher.usedCount || 0} / {voucher.usageLimit || 100} ({usagePct}%)
                      </span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-stone-100 overflow-hidden border border-stone-200/50">
                      <div
                        className="h-full bg-[#B9382B] rounded-full transition-all"
                        style={{ width: `${usagePct}%` }}
                      />
                    </div>
                  </div>

                  <button
                    onClick={() => handleToggleActive(voucher.id)}
                    className={`w-full py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      voucher.isActive
                        ? "bg-stone-100 hover:bg-rose-50 hover:text-rose-700 text-stone-700 border border-stone-200"
                        : "bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100"
                    }`}
                  >
                    {voucher.isActive ? "Nonaktifkan Kupon" : "Aktifkan Kupon"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* CREATE VOUCHER MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg rounded-3xl bg-white border border-stone-200 p-6 sm:p-7 shadow-2xl space-y-5 text-slate-900">
            <div className="flex items-center justify-between pb-4 border-b border-stone-100">
              <div className="flex items-center gap-3">
                <div className="bg-[#FAF0ED] border border-[#B9382B]/20 p-2.5 rounded-2xl text-[#B9382B]">
                  <Plus size={18} strokeWidth={3} />
                </div>
                <div>
                  <h3 className="font-['Barlow_Condensed'] font-black uppercase tracking-wide text-2xl text-slate-900 leading-none">
                    Buat Kupon Promo Baru
                  </h3>
                  <p className="text-xs text-stone-500 mt-0.5">Atur kode voucher dan ketentuan diskon</p>
                </div>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-stone-400 hover:text-slate-800 p-1.5 rounded-xl hover:bg-stone-100 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-stone-700 uppercase tracking-wider mb-2">
                    Kode Kupon *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    placeholder="Contoh: REGARJUARA"
                    className="w-full px-4 py-2.5 rounded-xl bg-stone-50 border border-stone-200 font-mono font-bold text-slate-900 text-xs uppercase focus:bg-white focus:border-[#B9382B] focus:ring-1 focus:ring-[#B9382B] outline-hidden transition-all"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-stone-700 uppercase tracking-wider mb-2">
                    Tipe Diskon *
                  </label>
                  <select
                    value={formData.discountType}
                    onChange={(e) => setFormData({ ...formData, discountType: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-stone-50 border border-stone-200 text-xs font-semibold text-slate-900 focus:bg-white focus:border-[#B9382B] focus:ring-1 focus:ring-[#B9382B] outline-hidden transition-all cursor-pointer"
                  >
                    <option value="PERCENTAGE">Persentase (%)</option>
                    <option value="FIXED_AMOUNT">Nominal Tetap (Rp)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-stone-700 uppercase tracking-wider mb-2">
                  Nama Promo *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Contoh: Diskon Juara Turnamen Futsal"
                  className="w-full px-4 py-2.5 rounded-xl bg-stone-50 border border-stone-200 text-xs text-slate-900 focus:bg-white focus:border-[#B9382B] focus:ring-1 focus:ring-[#B9382B] outline-hidden transition-all font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-stone-700 uppercase tracking-wider mb-2">
                    Nilai Diskon {formData.discountType === "PERCENTAGE" ? "(%)" : "(Rp)"} *
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={formData.discountValue}
                    onChange={(e) => setFormData({ ...formData, discountValue: e.target.value })}
                    placeholder={formData.discountType === "PERCENTAGE" ? "10" : "20000"}
                    className="w-full px-4 py-2.5 rounded-xl bg-stone-50 border border-stone-200 text-xs font-mono font-bold text-slate-900 focus:bg-white focus:border-[#B9382B] focus:ring-1 focus:ring-[#B9382B] outline-hidden transition-all"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-stone-700 uppercase tracking-wider mb-2">
                    Minimal Belanja (Rp)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.minSpend}
                    onChange={(e) => setFormData({ ...formData, minSpend: e.target.value })}
                    placeholder="100000"
                    className="w-full px-4 py-2.5 rounded-xl bg-stone-50 border border-stone-200 text-xs font-mono font-bold text-slate-900 focus:bg-white focus:border-[#B9382B] focus:ring-1 focus:ring-[#B9382B] outline-hidden transition-all"
                  />
                </div>
              </div>

              {formData.discountType === "PERCENTAGE" && (
                <div>
                  <label className="block text-[11px] font-bold text-stone-700 uppercase tracking-wider mb-2">
                    Maksimal Potongan Diskon (Rp, Opsional)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.maxDiscount}
                    onChange={(e) => setFormData({ ...formData, maxDiscount: e.target.value })}
                    placeholder="Contoh: 50000"
                    className="w-full px-4 py-2.5 rounded-xl bg-stone-50 border border-stone-200 text-xs font-mono font-bold text-slate-900 focus:bg-white focus:border-[#B9382B] focus:ring-1 focus:ring-[#B9382B] outline-hidden transition-all"
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-stone-700 uppercase tracking-wider mb-2">
                    Batas Kuota Pemakaian
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.usageLimit}
                    onChange={(e) => setFormData({ ...formData, usageLimit: e.target.value })}
                    placeholder="100"
                    className="w-full px-4 py-2.5 rounded-xl bg-stone-50 border border-stone-200 text-xs font-mono font-bold text-slate-900 focus:bg-white focus:border-[#B9382B] focus:ring-1 focus:ring-[#B9382B] outline-hidden transition-all"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-stone-700 uppercase tracking-wider mb-2">
                    Berlaku Sampai (Opsional)
                  </label>
                  <input
                    type="date"
                    value={formData.validUntil}
                    onChange={(e) => setFormData({ ...formData, validUntil: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-stone-50 border border-stone-200 text-xs font-semibold text-slate-900 focus:bg-white focus:border-[#B9382B] focus:ring-1 focus:ring-[#B9382B] outline-hidden transition-all cursor-pointer"
                  />
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end gap-3 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-xs font-bold text-stone-500 hover:text-slate-900 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#B9382B] hover:bg-[#9E2D22] text-white font-bold text-xs uppercase tracking-wider shadow-md disabled:opacity-50 cursor-pointer active:scale-95 transition-all"
                >
                  {submitting && <Loader2 size={14} className="animate-spin" />}
                  <span>Simpan Kupon</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
