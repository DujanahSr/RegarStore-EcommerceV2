/* eslint-disable react-hooks/set-state-in-effect */
import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { Search, X, ArrowRight } from "lucide-react";
import api from "../../services/api";

export default function QuickSearchModal({ isOpen, onClose }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef(null);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
      setQuery("");
      setResults([]);
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  // Debounced search query
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setLoading(false);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setLoading(true);
        const res = await api.get("/products", {
          params: { search: query.trim(), size: 6 },
        });
        const raw = res.data?.data;
        const list = Array.isArray(raw) ? raw : raw?.content || [];
        setResults(list);
      } catch (err) {
        console.error("Gagal mencari produk:", err);
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

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

  if (!isOpen) return null;

  const quickPills = [
    "Sepakbola",
    "Bola Voli",
    "Badminton",
    "Esports",
    "Basket",
    "Dry-Fit",
  ];

  const visualCategories = [
    {
      name: "SEPAKBOLA & FUTSAL",
      image: "/images/cat-football.jpg",
      tag: "Terlaris",
      categoryId: 1,
    },
    {
      name: "BOLA VOLI PRO",
      image: "/images/cat-volleyball.jpg",
      tag: "Hot",
      categoryId: 2,
    },
    {
      name: "BADMINTON ELITE",
      image: "/images/cat-badminton.jpg",
      categoryId: 3,
    },
    {
      name: "KOMUNITAS & ESPORTS",
      image: "/images/cat-esports.jpg",
      tag: "Custom",
      categoryId: 4,
    },
  ];

  const handleSelectPill = (pillText) => {
    setQuery(pillText);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-8 sm:pt-16 px-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-md transition-opacity animate-fade-in"
        onClick={onClose}
      />

      {/* Modal Card */}
      <div className="relative z-10 w-full max-w-3xl bg-[#FAF8F4] text-[#111613] rounded-3xl shadow-2xl border border-black/10 overflow-hidden animate-fade-in-up">
        {/* Search Bar Input */}
        <div className="p-5 sm:p-6 bg-white border-b border-black/10 flex items-center gap-3">
          <Search size={22} className="text-slate-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Cari jersey tim, ukuran, nama bahan dry-fit..."
            className="w-full bg-transparent text-slate-900 font-semibold text-base sm:text-lg focus:outline-none placeholder:text-slate-400 placeholder:font-normal"
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="text-xs font-bold text-slate-400 hover:text-black px-2 py-1 rounded-md"
            >
              Hapus
            </button>
          )}
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-black/5 hover:bg-black/10 flex items-center justify-center text-slate-600 hover:text-black transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 max-h-[70vh] overflow-y-auto space-y-6">
          {/* Quick Search Pills */}
          <div>
            <div className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 mb-2.5">
              PENCARIAN CEPAT POPULER
            </div>
            <div className="flex flex-wrap gap-2">
              {quickPills.map((pill, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSelectPill(pill)}
                  className="px-3.5 py-1.5 rounded-full bg-white hover:bg-[#111613] text-slate-700 hover:text-white border border-black/10 hover:border-transparent text-xs font-semibold transition-all cursor-pointer"
                >
                  {pill}
                </button>
              ))}
            </div>
          </div>

          {/* Results List or Visual Categories */}
          {loading ? (
            <div className="py-12 text-center text-slate-400 text-xs">
              <span className="inline-block animate-spin mr-2">⟳</span>
              Mencari katalog jersey di pabrik...
            </div>
          ) : query.trim() ? (
            <div>
              <div className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 mb-3">
                HASIL PENCARIAN ({results.length})
              </div>
              {results.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {results.map((prod) => (
                    <Link
                      key={prod.id}
                      to={`/dashboard/product/${prod.id}`}
                      onClick={onClose}
                      className="p-3 rounded-2xl bg-white border border-black/5 hover:border-black/20 flex items-center gap-3 transition-all hover:-translate-y-0.5 shadow-sm group"
                    >
                      <div className="w-16 h-16 rounded-xl overflow-hidden bg-slate-100 shrink-0">
                        <img
                          src={
                            prod.imageUrl ||
                            prod.image_url ||
                            "/images/products/jersey_football_garuda.jpg"
                          }
                          alt={prod.name}
                          onError={(e) => {
                            e.currentTarget.onerror = null;
                            e.currentTarget.src = "/images/hero-athlete.jpg";
                          }}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="text-[9px] font-bold uppercase text-emerald-700">
                          {prod.category?.name || "Apparel"}
                        </span>
                        <h5 className="text-xs font-bold text-slate-900 line-clamp-1 group-hover:text-emerald-700 transition-colors">
                          {prod.name}
                        </h5>
                        <div className="text-xs font-black text-slate-900 mt-0.5">
                          Rp {Number(prod.price || 0).toLocaleString("id-ID")}
                        </div>
                      </div>
                      <div className="w-7 h-7 rounded-full bg-slate-100 group-hover:bg-[#111613] group-hover:text-white flex items-center justify-center text-slate-500 transition-colors">
                        <ArrowRight size={13} />
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center text-slate-500 text-xs">
                  Tidak ada produk yang cocok dengan kata kunci &quot;{query}&quot;.
                </div>
              )}
            </div>
          ) : (
            /* Visual Category Explorer */
            <div>
              <div className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 mb-3">
                JELAJAHI KATEGORI UNGGULAN
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {visualCategories.map((cat, idx) => (
                  <Link
                    key={idx}
                    to={`/dashboard?categoryId=${cat.categoryId}`}
                    onClick={onClose}
                    className="group relative aspect-4/5 rounded-2xl overflow-hidden bg-black/5 shadow-sm border border-black/5 flex flex-col justify-end p-3 transition-all hover:scale-[1.02]"
                  >
                    <img
                      src={cat.image}
                      alt={cat.name}
                      className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />

                    {cat.tag && (
                      <span className="absolute top-2.5 left-2.5 bg-red-600 text-white text-[9px] font-black uppercase px-2 py-0.5 rounded-full">
                        {cat.tag}
                      </span>
                    )}

                    <div className="relative z-10 flex items-center justify-between">
                      <span className="font-condensed text-xs sm:text-sm font-bold tracking-wide uppercase text-white leading-tight">
                        {cat.name}
                      </span>
                      <div className="w-6 h-6 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white shrink-0 group-hover:bg-white group-hover:text-black transition-colors">
                        <ArrowRight size={12} />
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="p-3 bg-white/60 border-t border-black/5 text-center text-[11px] text-slate-500">
          Tekan <kbd className="px-1.5 py-0.5 rounded bg-black/5 font-mono text-[10px]">ESC</kbd> untuk menutup
        </div>
      </div>
    </div>
  );
}
