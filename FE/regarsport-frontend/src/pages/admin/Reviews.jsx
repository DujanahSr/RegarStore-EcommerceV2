/* eslint-disable no-unused-vars */
/* eslint-disable react-hooks/set-state-in-effect */
import { memo, useCallback, useEffect, useRef, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  MessageSquareText,
  Search,
  Star,
  Reply,
  Trash2,
  Send,
} from "lucide-react";
import api from "../../services/api";
import { EmptyState, ScreenLoader } from "../../components/common/UiStates";
import toast from "react-hot-toast";
import { useConfirm } from "../../context/ConfirmContext";

/* ----------------------------------------------------------------
   ReviewRow – memoized untuk performa
---------------------------------------------------------------- */
const ReviewRow = memo(function ReviewRow({ review, index, page, limit, onReplySent }) {
  const confirm = useConfirm();
  const [avatarError, setAvatarError] = useState(false);
  const [productImageError, setProductImageError] = useState(false);
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [replyText, setReplyText] = useState(review.review_replies?.[0]?.reply || "");
  const [submitting, setSubmitting] = useState(false);

  const customerName = review.customerName || review.users?.full_name || "Pelanggan";
  const customerAvatar = review.customerAvatar || review.users?.avatar_url;
  const customerEmail = review.users?.email || "";
  const productName = review.productName || review.products?.name || "Jersey";
  const productImage = review.productImage || review.products?.image_url;
  const reviewDate = review.createdAt || review.created_at;
  const existingReply = review.review_replies?.[0];

  const handleSubmitReply = async () => {
    if (!replyText.trim()) {
      toast.error("Balasan tidak boleh kosong");
      return;
    }
    try {
      setSubmitting(true);
      await api.post(`/admin/reviews/${review.id}/reply`, { reply: replyText.trim() });
      toast.success("Balasan berhasil disimpan");
      setShowReplyForm(false);
      onReplySent();
    } catch (error) {
      toast.error(error.response?.data?.message || "Gagal menyimpan balasan");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteReply = async () => {
    if (!(await confirm({ title: "Hapus balasan ini?", message: "Balasan admin akan dihapus dari ulasan pelanggan.", confirmLabel: "Hapus Balasan", tone: "danger" }))) return;
    try {
      await api.delete(`/admin/reviews/${review.id}/reply`);
      toast.success("Balasan dihapus");
      onReplySent();
    } catch {
      toast.error("Gagal menghapus balasan");
    }
  };

  const handleDeleteReview = async () => {
    if (!(await confirm({ title: `Hapus ulasan dari "${customerName}"?`, message: "Tindakan ini permanen dan tidak bisa dibatalkan.", confirmLabel: "Hapus Ulasan", tone: "danger" }))) return;
    try {
      await api.delete(`/admin/reviews/${review.id}`);
      toast.success("Ulasan berhasil dihapus");
      onReplySent();
    } catch (error) {
      toast.error(error.response?.data?.message || "Gagal menghapus ulasan");
    }
  };

  return (
    <tr className="border-b border-stone-100 hover:bg-stone-50/60 transition-colors group">
      <td className="p-4 text-stone-400 text-xs font-mono font-semibold">
        {(page - 1) * limit + index + 1}
      </td>
      <td className="p-4 min-w-48">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full overflow-hidden bg-[#FAF0ED] border border-[#B9382B]/20 text-[#B9382B] flex items-center justify-center shrink-0 font-bold text-xs shadow-xs">
            {customerAvatar && !avatarError ? (
              <img
                src={customerAvatar}
                alt={customerName}
                className="w-full h-full object-cover"
                onError={() => setAvatarError(true)}
              />
            ) : (
              <span>
                {customerName.charAt(0).toUpperCase()}
              </span>
            )}
          </div>
          <div>
            <p className="text-slate-900 text-sm font-bold group-hover:text-[#B9382B] transition-colors">
              {customerName}
            </p>
            {customerEmail && <p className="text-stone-400 text-xs font-mono">{customerEmail}</p>}
          </div>
        </div>
      </td>
      <td className="p-4 min-w-48">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl overflow-hidden bg-stone-100 border border-stone-200 flex items-center justify-center shrink-0">
            {productImage && !productImageError ? (
              <img
                src={productImage}
                alt={productName}
                className="w-full h-full object-cover"
                onError={() => setProductImageError(true)}
              />
            ) : (
              <MessageSquareText size={16} className="text-stone-400" />
            )}
          </div>
          <p className="text-slate-800 text-sm font-semibold truncate max-w-45" title={productName}>
            {productName}
          </p>
        </div>
      </td>
      <td className="p-4">
        <div className="flex items-center gap-0.5 text-amber-400">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star
              key={i}
              size={14}
              className={i < Number(review.rating) ? "fill-current" : "text-stone-200"}
            />
          ))}
        </div>
      </td>
      <td className="p-4 text-slate-700 text-sm max-w-xs">
        <p className="line-clamp-3 leading-relaxed">{review.comment}</p>
        {Array.isArray(review.images) && review.images.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {review.images.map((imgUrl, i) => (
              <a
                key={i}
                href={imgUrl}
                target="_blank"
                rel="noreferrer"
                className="h-10 w-10 rounded-xl overflow-hidden border border-stone-200 hover:border-[#B9382B] transition shrink-0 block shadow-xs"
                title="Buka foto resolusi penuh"
              >
                <img src={imgUrl} alt={`Foto ulasan ${i + 1}`} className="h-full w-full object-cover hover:scale-105 transition duration-200" />
              </a>
            ))}
          </div>
        )}
        {existingReply && (
          <div className="mt-2 p-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs">
            <span className="font-bold text-[#B9382B]">
              Admin {existingReply.admin_name || "RegarStore"}:
            </span>
            <span className="text-slate-700 ml-1">{existingReply.reply}</span>
          </div>
        )}
      </td>
      <td className="p-4 text-stone-500 text-xs font-medium whitespace-nowrap">
        {reviewDate ? (
          new Date(reviewDate).toLocaleDateString("id-ID", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          })
        ) : "-"}
      </td>
      <td className="p-4">
        {!showReplyForm ? (
          <div className="flex items-center gap-1">
            <button
              onClick={() => setShowReplyForm(true)}
              className="p-2 rounded-xl hover:bg-stone-100 text-stone-600 hover:text-[#B9382B] transition-colors cursor-pointer"
              title="Balas Ulasan"
            >
              <Reply size={18} />
            </button>
            <button
              onClick={handleDeleteReview}
              className="p-2 rounded-xl hover:bg-rose-50 text-stone-400 hover:text-rose-600 transition-colors cursor-pointer"
              title="Hapus Ulasan Ini"
            >
              <Trash2 size={17} />
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-2 min-w-56 animate-in fade-in slide-in-from-top-2 duration-200">
            <textarea
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder="Tulis balasan resmi toko..."
              className="bg-stone-50 border border-stone-200 rounded-xl p-2.5 text-xs text-slate-900 placeholder:text-stone-400 outline-hidden focus:bg-white focus:border-[#B9382B] transition-all resize-none font-medium leading-relaxed"
              rows={2}
            />
            <div className="flex flex-wrap gap-2">
              <button
                onClick={handleSubmitReply}
                disabled={submitting}
                className="flex items-center gap-1.5 bg-[#B9382B] hover:bg-[#9E2D22] text-white font-bold px-3 py-1.5 rounded-lg text-xs transition disabled:opacity-50 active:scale-95 shadow-xs cursor-pointer"
              >
                <Send size={12} /> Kirim
              </button>
              <button
                onClick={() => setShowReplyForm(false)}
                className="bg-stone-100 hover:bg-stone-200 text-stone-700 font-semibold px-3 py-1.5 rounded-lg text-xs transition cursor-pointer"
              >
                Batal
              </button>
              {existingReply && (
                <button
                  onClick={handleDeleteReply}
                  className="flex items-center gap-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-semibold px-3 py-1.5 rounded-lg text-xs border border-rose-200 transition cursor-pointer"
                >
                  <Trash2 size={12} /> Hapus Balasan
                </button>
              )}
            </div>
          </div>
        )}
      </td>
    </tr>
  );
});

/* ----------------------------------------------------------------
   Reviews Page
---------------------------------------------------------------- */
export default function Reviews() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [ratingFilter, setRatingFilter] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [averageRating, setAverageRating] = useState(0);
  const limit = 10;
  const searchTimerRef = useRef(null);

  /* Debounce search */
  useEffect(() => {
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(() => {
      setPage(1);
      setDebouncedSearch(search.trim());
    }, 350);
    return () => clearTimeout(searchTimerRef.current);
  }, [search]);

  /* Fetch reviews */
  const getReviews = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get("/admin/reviews", {
        params: {
          search: debouncedSearch || undefined,
          rating: ratingFilter || undefined,
          page,
          limit,
        },
      });
      setReviews(res.data.data || []);
      setTotal(res.data.meta?.total || 0);
      setTotalPages(res.data.meta?.totalPages || 1);
      setAverageRating(Number(res.data.meta?.averageRating ?? res.data.summary?.averageRating ?? 0));
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, ratingFilter, page]);

  useEffect(() => {
    getReviews();
  }, [getReviews]);

  const activeFilterLabel = ratingFilter ? `${ratingFilter} bintang` : "Semua rating";

  return (
    <div className="space-y-8 pb-12">
      {/* Header Banner Tactical Forest */}
      <div className="relative overflow-hidden rounded-3xl border border-black/15 shadow-xl bg-[#162018] text-white p-6 sm:p-8">
        <div className="absolute inset-0 bg-topography opacity-15 pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="max-w-2xl">
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full bg-white/10 text-emerald-400 font-mono text-[10px] font-black tracking-widest border border-white/10 uppercase">
                RS // CUSTOMER SATISFACTION
              </span>
              <span className="text-[11px] font-mono uppercase tracking-widest text-stone-300">
                PRODUCT REVIEWS & RATINGS
              </span>
            </div>
            <h1 className="font-['Barlow_Condensed'] font-black uppercase tracking-tight text-3xl sm:text-5xl text-white leading-none">
              ULASAN & RATING PRODUK
            </h1>
            <p className="text-stone-300 text-xs sm:text-sm mt-2 leading-relaxed">
              Pantau testimoni pembeli apparel, rating kualitas bahan jersey olahraga, dokumentasi foto pembeli, dan moderasi tanggapan resmi toko.
            </p>

            <div className="flex flex-wrap items-center gap-4 mt-4 pt-3 border-t border-white/10 text-xs font-mono text-stone-300">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <span>TOTAL ULASAN: {total} ULASAN</span>
              </div>
              <span className="text-white/20">•</span>
              <div className="flex items-center gap-1.5 text-amber-400">
                <span>★ SKOR KEPUASAN: {averageRating.toFixed(1)} / 5.0</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <div className="bg-white/10 border border-white/15 px-5 py-4 rounded-2xl backdrop-blur-xs text-right">
              <p className="text-[10px] font-bold text-stone-300 uppercase tracking-widest">Rata-Rata Rating</p>
              <p className="font-['Barlow_Condensed'] font-black text-3xl text-amber-400 leading-tight flex items-center justify-end gap-1.5 mt-0.5">
                ★ {averageRating.toFixed(1)} <span className="text-xs text-stone-300 font-normal">/ 5.0</span>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ======================== FILTER BAR ======================== */}
      <div className="flex flex-col md:flex-row gap-3">
        {/* Search */}
        <div className="flex items-center gap-3 flex-1 bg-white border border-stone-200/80 rounded-2xl px-4 py-3 shadow-xs focus-within:border-[#B9382B] focus-within:ring-1 focus-within:ring-[#B9382B] transition-all group">
          <Search size={18} className="text-stone-400 group-focus-within:text-[#B9382B] transition-colors" />
          <input
            type="text"
            placeholder="Cari kata kunci dalam ulasan pembeli..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 bg-transparent text-slate-900 text-sm outline-hidden placeholder:text-stone-400"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="p-1 rounded-lg hover:bg-stone-100 text-stone-400 hover:text-stone-700 transition-all cursor-pointer"
            >
              <ChevronRight size={16} className="rotate-45" />
            </button>
          )}
        </div>

        {/* Rating Filter */}
        <div className="relative">
          <select
            value={ratingFilter}
            onChange={(e) => {
              setPage(1);
              setRatingFilter(e.target.value);
            }}
            className="bg-white border border-stone-200/80 rounded-2xl px-4 py-3 text-slate-800 text-sm font-semibold outline-hidden focus:border-[#B9382B] transition-all cursor-pointer shadow-xs pr-10 appearance-none"
          >
            <option value="">Semua Rating</option>
            {[5, 4, 3, 2, 1].map((r) => (
              <option key={r} value={r}>{r} Bintang</option>
            ))}
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-stone-500">
            <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20">
              <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
            </svg>
          </div>
        </div>
      </div>

      {/* ======================== TABLE ======================== */}
      {loading ? (
        <ScreenLoader label="Memuat ulasan produk..." />
      ) : reviews.length === 0 ? (
        <EmptyState title="Belum ada review" description="Belum ada customer yang memberikan review produk." />
      ) : (
        <div className="bg-white border border-stone-200/80 rounded-3xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full min-w-225">
              <thead>
                <tr className="border-b border-stone-100 bg-stone-50/70">
                  <th className="p-4 text-left text-[11px] font-bold text-stone-500 uppercase tracking-wider">No</th>
                  <th className="p-4 text-left text-[11px] font-bold text-stone-500 uppercase tracking-wider">Customer</th>
                  <th className="p-4 text-left text-[11px] font-bold text-stone-500 uppercase tracking-wider">Produk</th>
                  <th className="p-4 text-left text-[11px] font-bold text-stone-500 uppercase tracking-wider">Rating</th>
                  <th className="p-4 text-left text-[11px] font-bold text-stone-500 uppercase tracking-wider">Komentar</th>
                  <th className="p-4 text-left text-[11px] font-bold text-stone-500 uppercase tracking-wider">Tanggal</th>
                  <th className="p-4 text-left text-[11px] font-bold text-stone-500 uppercase tracking-wider">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {reviews.map((review, idx) => (
                  <ReviewRow
                    key={review.id}
                    review={review}
                    index={idx}
                    page={page}
                    limit={limit}
                    onReplySent={getReviews}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ======================== PAGINATION ======================== */}
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

          <div className="flex items-center gap-1.5">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                onClick={() => setPage(p)}
                className={`w-9 h-9 rounded-xl text-xs font-bold transition cursor-pointer ${
                  p === page
                    ? "bg-[#B9382B] text-white shadow-xs"
                    : "bg-white border border-stone-200/80 text-stone-600 hover:bg-stone-50 hover:text-slate-900"
                }`}
              >
                {p}
              </button>
            ))}
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
    </div>
  );
}