import { useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  FileText,
  Image as ImageIcon,
  MessageCircle,
  Package,
  Ruler,
  ShieldCheck,
  X,
  Loader2,
  Trash2,
  Link2,
  Camera,
} from "lucide-react";
import toast from "react-hot-toast";
import api from "../../services/api";

const CATEGORIES = [
  { id: "SIZE_EXCHANGE", label: "Tukar Ukuran (Ukuran Kurang Pas)", icon: Ruler },
  { id: "PRINTING_DEFECT", label: "Cacat Sablon / Salah Cetak Nama & No", icon: FileText },
  { id: "MATERIAL_DEFECT", label: "Cacat Jahitan / Kain Rusak", icon: AlertCircle },
  { id: "OTHER", label: "Kendala Lainnya", icon: Package },
];

const SOLUTIONS = [
  { id: "EXCHANGE_SIZE", label: "Tukar Ukuran Baru (Size Exchange)" },
  { id: "REPLACEMENT", label: "Ganti Baru / Produksi Ulang 100%" },
  { id: "REPAIR", label: "Perbaikan Cacat Jahitan oleh Atelier" },
];

const AVAILABLE_SIZES = ["S", "M", "L", "XL", "XXL", "3XL"];

export default function WarrantyClaimModal({ isOpen, onClose, order, onSuccess }) {
  const orderItems = order?.items || [];
  const [selectedProductId, setSelectedProductId] = useState(
    orderItems[0]?.productId || orderItems[0]?.id || null
  );
  const [category, setCategory] = useState("SIZE_EXCHANGE");
  const [solution, setSolution] = useState("EXCHANGE_SIZE");
  const [requestedSize, setRequestedSize] = useState("L");
  const [description, setDescription] = useState("");
  const [evidenceImage, setEvidenceImage] = useState("");
  const [uploadingImage, setUploadingImage] = useState(false);
  const [useManualUrl, setUseManualUrl] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submittedClaim, setSubmittedClaim] = useState(null);

  if (!isOpen || !order) return null;

  const selectedItem =
    orderItems.find((it) => (it.productId || it.id) === selectedProductId) ||
    orderItems[0];

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!["image/jpeg", "image/png", "image/webp", "image/jpg"].includes(file.type)) {
      toast.error("Format foto harus JPG, PNG, atau WEBP");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Ukuran foto maksimal 5MB");
      return;
    }

    try {
      setUploadingImage(true);
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", "regarstore/warranty");

      const res = await api.post("/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      const url = res.data?.image_url || res.data?.data?.imageUrl;
      if (url) {
        setEvidenceImage(url);
        toast.success("Foto bukti kendala berhasil diunggah!");
      }
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Gagal mengunggah foto bukti");
    } finally {
      setUploadingImage(false);
      e.target.value = "";
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!description.trim()) {
      toast.error("Mohon tuliskan penjelasan kendala produk Anda");
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        orderId: order.id,
        orderNumber: order.orderNumber || `#${order.id}`,
        productId: selectedItem?.productId || selectedItem?.id || 1,
        productName: selectedItem?.productName || selectedItem?.name || "Produk Apparel",
        productImage: selectedItem?.productImage || selectedItem?.imageUrl || "",
        category,
        solution,
        requestedSize: category === "SIZE_EXCHANGE" ? requestedSize : null,
        description: description.trim(),
        evidenceImages: evidenceImage.trim() || null,
      };

      const res = await api.post("/warranty-claims", payload);
      const claimData = res.data?.data || res.data;
      setSubmittedClaim(claimData);
      toast.success("Klaim garansi berhasil diajukan!");
      if (onSuccess) onSuccess(claimData);
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Gagal mengajukan klaim garansi");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSendToWhatsApp = () => {
    if (!submittedClaim) return;
    const catLabel =
      CATEGORIES.find((c) => c.id === submittedClaim.category)?.label ||
      submittedClaim.category;
    const solLabel =
      SOLUTIONS.find((s) => s.id === submittedClaim.solution)?.label ||
      submittedClaim.solution;

    let text = `Halo Customer Care PT RegarStore Indonesia,\n\nSaya telah mengajukan *Klaim Garansi Resmi* melalui website:\n`;
    text += `• *No. Tiket Klaim*: ${submittedClaim.claimNumber}\n`;
    text += `• *No. Pesanan*: ${submittedClaim.orderNumber}\n`;
    text += `• *Produk*: ${submittedClaim.productName}\n`;
    text += `• *Kendala*: ${catLabel}\n`;
    if (submittedClaim.requestedSize) {
      text += `• *Ukuran Pengganti*: ${submittedClaim.requestedSize}\n`;
    }
    text += `• *Solusi Diharapkan*: ${solLabel}\n`;
    text += `• *Keterangan*: ${submittedClaim.description}\n\n`;
    text += `Mohon bantuannya untuk verifikasi dan pemrosesan klaim ini. Terima kasih!`;

    const url = `https://api.whatsapp.com/send?phone=6282133445566&text=${encodeURIComponent(
      text
    )}`;
    window.open(url, "_blank");
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-xl max-h-[90vh] overflow-y-auto bg-[#162018] border border-white/15 rounded-3xl p-6 sm:p-8 text-white shadow-2xl space-y-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Tactical Header */}
        <div className="flex items-start justify-between pb-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shadow-xs shrink-0">
              <ShieldCheck size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-condensed text-xl font-black uppercase tracking-wider text-white">
                  Pengajuan Klaim Garansi Resmi
                </h3>
                <span className="rounded-full bg-emerald-400/10 px-2.5 py-0.5 text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-300 border border-emerald-400/20">
                  100% Bebas Cemas
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono mt-0.5">
                Garansi Resmi Tukar Ukuran &amp; Cacat Produksi • Atelier Cicendo Bandung
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-slate-400 hover:bg-white/10 hover:text-white transition cursor-pointer"
            title="Tutup (Esc)"
          >
            <X size={18} />
          </button>
        </div>

        {/* If claim already submitted successfully */}
        {submittedClaim ? (
          <div className="text-center py-4 space-y-5">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <CheckCircle2 size={36} />
            </div>

            <div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-400/15 px-3 py-1 text-xs font-mono font-bold text-emerald-300 border border-emerald-400/30 uppercase tracking-wider">
                <ShieldCheck size={13} className="text-emerald-400" />
                TIKET KLAIM RESMI DITERBITKAN
              </span>
              <h4 className="mt-2.5 text-2xl font-black font-mono tracking-tight text-white">
                {submittedClaim.claimNumber}
              </h4>
              <p className="mt-1 text-xs text-slate-400 font-mono max-w-md mx-auto">
                Klaim garansi untuk pesanan{" "}
                <span className="font-bold text-emerald-400">
                  {submittedClaim.orderNumber}
                </span>{" "}
                telah tercatat dalam sistem Quality Control kami.
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-black/40 p-4 text-left text-xs space-y-2 font-mono text-slate-300">
              <div className="flex justify-between border-b border-white/5 pb-1.5">
                <span className="text-slate-400">PRODUK:</span>
                <span className="font-bold text-white">{submittedClaim.productName}</span>
              </div>
              <div className="flex justify-between border-b border-white/5 pb-1.5">
                <span className="text-slate-400">KENDALA:</span>
                <span className="font-bold text-emerald-400">{submittedClaim.category}</span>
              </div>
              {submittedClaim.requestedSize && (
                <div className="flex justify-between border-b border-white/5 pb-1.5">
                  <span className="text-slate-400">UKURAN PENGGANTI:</span>
                  <span className="font-bold text-amber-300">{submittedClaim.requestedSize}</span>
                </div>
              )}
              <div className="flex justify-between pt-0.5">
                <span className="text-slate-400">STATUS KLAIM:</span>
                <span className="font-bold text-emerald-300">Verifikasi Tim QC Atelier Cicendo</span>
              </div>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={handleSendToWhatsApp}
                className="flex-1 flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-condensed font-black uppercase tracking-wider py-3 text-xs shadow-lg shadow-emerald-600/20 transition cursor-pointer"
              >
                <MessageCircle size={16} />
                <span>Teruskan ke WhatsApp CS</span>
              </button>

              <button
                type="button"
                onClick={onClose}
                className="rounded-2xl border border-white/15 bg-white/5 hover:bg-white/10 text-slate-300 font-mono font-bold py-3 px-6 text-xs transition cursor-pointer"
              >
                Tutup Tiket
              </button>
            </div>
          </div>
        ) : (
          /* Form Klaim Garansi */
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* 1. Pilih Produk */}
            {orderItems.length > 1 && (
              <div>
                <label className="block text-xs font-mono font-bold uppercase tracking-wider text-slate-300 mb-2">
                  1. Pilih Produk yang Diklaim
                </label>
                <div className="space-y-2">
                  {orderItems.map((it) => {
                    const isSelected = selectedProductId === (it.productId || it.id);
                    return (
                      <label
                        key={it.productId || it.id}
                        className={`flex items-center gap-3 p-3 rounded-2xl border cursor-pointer transition ${
                          isSelected
                            ? "border-emerald-400 bg-emerald-500/15 ring-1 ring-emerald-400/40 text-white"
                            : "border-white/10 bg-white/5 hover:bg-white/10 text-slate-300"
                        }`}
                      >
                        <input
                          type="radio"
                          name="productClaim"
                          checked={isSelected}
                          onChange={() => setSelectedProductId(it.productId || it.id)}
                          className="accent-emerald-500"
                        />
                        <img
                          src={
                            it.productImage ||
                            it.imageUrl ||
                            "https://images.unsplash.com/photo-1517466787929-bc90951d0974?w=200&q=80"
                          }
                          alt={it.productName}
                          className="w-10 h-10 object-cover rounded-xl border border-white/10 shrink-0"
                        />
                        <div className="text-xs font-mono">
                          <p className="font-bold text-white">
                            {it.productName || it.name}
                          </p>
                          <p className="text-slate-400 text-[11px]">Ukuran: {it.size || "L"}</p>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 2. Kategori Kendala */}
            <div>
              <label className="block text-xs font-mono font-bold uppercase tracking-wider text-slate-300 mb-2">
                2. Jenis Kendala Produk
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {CATEGORIES.map((cat) => {
                  const CatIcon = cat.icon;
                  const isSelected = category === cat.id;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setCategory(cat.id)}
                      className={`flex items-center gap-2.5 p-3 rounded-2xl border text-xs font-mono text-left transition cursor-pointer ${
                        isSelected
                          ? "border-emerald-400 bg-emerald-500/15 text-white ring-1 ring-emerald-400/40 font-bold"
                          : "border-white/10 bg-white/5 hover:bg-white/10 text-slate-300"
                      }`}
                    >
                      <CatIcon
                        size={16}
                        className={isSelected ? "text-emerald-400 shrink-0" : "text-slate-400 shrink-0"}
                      />
                      <span className="leading-snug">{cat.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 3. Jika Tukar Ukuran, Pilih Ukuran Baru */}
            {category === "SIZE_EXCHANGE" && (
              <div className="rounded-2xl border border-emerald-400/20 bg-black/30 p-4 space-y-2.5">
                <label className="block text-xs font-mono font-bold uppercase tracking-wider text-emerald-300">
                  PILIH UKURAN BARU PENGGANTI:
                </label>
                <div className="flex flex-wrap gap-2">
                  {AVAILABLE_SIZES.map((sz) => (
                    <button
                      key={sz}
                      type="button"
                      onClick={() => setRequestedSize(sz)}
                      className={`h-9 w-12 rounded-xl text-xs font-mono font-bold uppercase transition cursor-pointer ${
                        requestedSize === sz
                          ? "bg-emerald-500 text-[#111613] font-black shadow-xs ring-2 ring-emerald-400/50"
                          : "border border-white/15 bg-white/5 text-slate-300 hover:border-emerald-400/50 hover:text-white"
                      }`}
                    >
                      {sz}
                    </button>
                  ))}
                </div>
                <p className="text-[11px] font-mono text-slate-400 leading-relaxed">
                  💡 RegarStore akan memproduksi dan mengirimkan ukuran baru pengganti setelah konfirmasi verifikasi klaim.
                </p>
              </div>
            )}

            {/* 4. Solusi yang Diharapkan */}
            <div>
              <label className="block text-xs font-mono font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                3. Solusi yang Diharapkan
              </label>
              <select
                value={solution}
                onChange={(e) => setSolution(e.target.value)}
                className="w-full rounded-2xl border border-white/15 bg-black/40 p-3 text-xs font-mono text-white outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400/30 transition cursor-pointer"
              >
                {SOLUTIONS.map((sol) => (
                  <option key={sol.id} value={sol.id} className="bg-[#162018] text-white">
                    {sol.label}
                  </option>
                ))}
              </select>
            </div>

            {/* 5. Foto Bukti Kendala */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-mono font-bold uppercase tracking-wider text-slate-300">
                  4. Foto Bukti Kendala (Opsional / Dianjurkan)
                </label>
                <button
                  type="button"
                  onClick={() => setUseManualUrl(!useManualUrl)}
                  className="text-[11px] font-mono text-emerald-400 hover:text-emerald-300 font-bold flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <Link2 size={12} />
                  <span>{useManualUrl ? "Upload File Gambar" : "Gunakan Link URL"}</span>
                </button>
              </div>

              {useManualUrl ? (
                /* Mode Input URL Manual */
                <div className="relative">
                  <ImageIcon
                    size={15}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    type="url"
                    placeholder="https://... (link foto kendala atau upload)"
                    value={evidenceImage}
                    onChange={(e) => setEvidenceImage(e.target.value)}
                    className="w-full rounded-2xl border border-white/15 bg-black/40 py-2.5 pl-10 pr-4 text-xs font-mono text-white placeholder:text-slate-500 outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400/30"
                  />
                </div>
              ) : evidenceImage ? (
                /* Mode Preview Foto yang Berhasil Diunggah */
                <div className="flex items-center justify-between p-3 rounded-2xl border border-emerald-400/30 bg-emerald-500/10">
                  <div className="flex items-center gap-3">
                    <img
                      src={evidenceImage}
                      alt="Bukti Kendala"
                      className="w-14 h-14 object-cover rounded-xl border border-emerald-400/30 shadow-xs"
                    />
                    <div className="font-mono text-xs">
                      <div className="flex items-center gap-1 text-emerald-300 font-bold">
                        <CheckCircle2 size={13} className="text-emerald-400" />
                        <span>Foto Berhasil Diunggah</span>
                      </div>
                      <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5 max-w-[220px] sm:max-w-xs">
                        {evidenceImage}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setEvidenceImage("")}
                    className="p-2 rounded-xl text-rose-400 hover:bg-white/10 hover:text-rose-300 transition cursor-pointer"
                    title="Hapus foto"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ) : (
                /* Mode Upload File Baru */
                <label
                  className={`flex flex-col items-center justify-center p-5 rounded-2xl border-2 border-dashed transition cursor-pointer ${
                    uploadingImage
                      ? "border-emerald-400 bg-emerald-500/10"
                      : "border-white/20 bg-white/5 hover:border-emerald-400/60 hover:bg-white/10"
                  }`}
                >
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/jpg"
                    disabled={uploadingImage}
                    onChange={handlePhotoUpload}
                    className="hidden"
                  />
                  {uploadingImage ? (
                    <div className="flex flex-col items-center gap-2 text-emerald-400 font-mono">
                      <Loader2 size={22} className="animate-spin text-emerald-400" />
                      <span className="text-xs font-bold">Sedang mengunggah ke Cloud CDN...</span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-1.5 text-center font-mono">
                      <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center mb-1">
                        <Camera size={18} />
                      </div>
                      <span className="text-xs font-bold text-white">
                        Klik untuk Pilih Foto dari Galeri / Komputer
                      </span>
                      <span className="text-[11px] text-slate-400">
                        Format JPG, PNG, atau WEBP (Maksimal 5MB)
                      </span>
                    </div>
                  )}
                </label>
              )}
            </div>

            {/* 6. Deskripsi Kendala */}
            <div>
              <label className="block text-xs font-mono font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                5. Deskripsi Detail Kendala
              </label>
              <textarea
                rows={3}
                placeholder="Jelaskan secara singkat kendala pada produk, misalnya: ukuran dada terasa sempit, sablon nomor miring, kain tergores, dsb."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full rounded-2xl border border-white/15 bg-black/40 p-3 text-xs font-mono text-white placeholder:text-slate-500 outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400/30 resize-none"
              />
            </div>

            {/* Submit Action */}
            <div className="pt-2 flex items-center justify-end gap-3 font-mono">
              <button
                type="button"
                onClick={onClose}
                className="rounded-2xl border border-white/15 bg-white/5 hover:bg-white/10 px-5 py-2.5 text-xs font-bold text-slate-300 hover:text-white transition cursor-pointer"
              >
                Batal
              </button>

              <button
                type="submit"
                disabled={submitting}
                className="flex items-center gap-2 rounded-2xl bg-[#B9382B] hover:bg-[#982D22] px-6 py-2.5 text-xs font-condensed font-black uppercase tracking-wider text-white shadow-md shadow-[#B9382B]/20 transition active:scale-95 disabled:opacity-50 cursor-pointer"
              >
                <ShieldCheck size={16} />
                <span>{submitting ? "Mengajukan..." : "Kirim Pengajuan Klaim"}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
