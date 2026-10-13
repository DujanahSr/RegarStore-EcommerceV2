/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable react-hooks/set-state-in-effect */
import { memo, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import {
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Eye,
  ShoppingCart,
  Phone,
  RotateCcw,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Truck,
  Award,
  X,
  Tag,
} from "lucide-react";

import api from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import { useCart } from "../../context/CartContext";
import { useWishlist } from "../../context/WishlistContext";
import { EmptyState, SectionSkeletonGrid } from "../../components/common/UiStates";

// Tactical Athletic Product Card (Brigade Overland Aesthetic)
const ProductCard = memo(function ProductCard({ product, onQuickBuy }) {
  const originalPrice = Math.round(Number(product.price || 185000) * 1.18);
  const discountPercent = 15;

  return (
    <div className="group rounded-3xl bg-white border border-black/5 overflow-hidden flex flex-col hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
      {/* Image & Multi-Badge Container */}
      <div className="relative aspect-square overflow-hidden bg-slate-100">
        <img
          src={product.imageUrl || product.image_url || "/images/hero-athlete.jpg"}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          onError={(e) => {
            e.currentTarget.onerror = null;
            e.currentTarget.src = "/images/hero-athlete.jpg";
          }}
        />

        {/* Side-by-Side Multi-Badges */}
        <div className="absolute top-3 left-3 flex flex-wrap gap-1.5 z-10">
          <span className="bg-white/95 backdrop-blur-sm text-black text-[10px] font-black uppercase px-2.5 py-1 rounded-full shadow-xs">
            DISKON {discountPercent}%
          </span>
          <span className="bg-[#FAF0ED] text-[#B9382B] border border-[#B9382B]/20 text-[10px] font-extrabold uppercase px-2 py-1 rounded-full">
            GARANSI 100%
          </span>
        </div>

        {/* Stock Status Badge */}
        {product.stock === 0 ? (
          <span className="absolute bottom-3 left-3 rounded-full bg-slate-900/85 backdrop-blur-xs px-2.5 py-1 text-[10px] font-bold text-white uppercase tracking-wider">
            Stok Habis
          </span>
        ) : product.stock <= 5 ? (
          <span className="absolute bottom-3 left-3 rounded-full bg-amber-500/90 backdrop-blur-xs px-2.5 py-1 text-[10px] font-bold text-white uppercase tracking-wider">
            Sisa {product.stock} pcs
          </span>
        ) : null}
      </div>

      {/* Card Body */}
      <div className="p-5 flex-1 flex flex-col justify-between space-y-3">
        <div>
          <div className="text-[10px] font-mono font-bold uppercase tracking-widest text-slate-400">
            {product.category?.name || "REGARSTORE APPAREL"}
          </div>
          <Link
            to={`/dashboard/product/${product.id}`}
            className="font-condensed text-xl font-bold text-slate-900 line-clamp-1 group-hover:text-emerald-800 transition-colors mt-0.5 block"
          >
            {product.name}
          </Link>
        </div>

        <div className="pt-2 border-t border-black/5 flex items-center justify-between">
          <div>
            <div className="text-[11px] text-slate-400 line-through">
              Rp {originalPrice.toLocaleString("id-ID")}
            </div>
            <div className="font-condensed text-2xl font-black text-[#111613]">
              Rp {Number(product.price || 0).toLocaleString("id-ID")}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              to={`/dashboard/product/${product.id}`}
              className="flex items-center gap-1 px-3 py-2 rounded-full border border-black/10 hover:border-black/30 text-slate-700 hover:text-black text-xs font-bold uppercase tracking-wider transition-colors"
            >
              <Eye size={13} />
              Detail
            </Link>

            <button
              type="button"
              onClick={() => onQuickBuy(product)}
              disabled={product.stock === 0}
              className="flex items-center gap-1 px-4 py-2 rounded-full bg-[#111613] hover:bg-black text-white font-bold text-xs uppercase tracking-wider transition-all hover:scale-105 cursor-pointer shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
              title="Pesan Jersey"
            >
              <ShoppingCart size={13} />
              <span>BELI</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
});

export default function Home() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addToCart = () => {} } = useCart() || {};
  const wishlist = useWishlist() || {};
  const toggleWishlist = wishlist.toggleWishlist || (() => {});
  const isWishlisted = wishlist.isWishlisted || wishlist.isInWishlist || (() => false);

  const [searchParams, setSearchParams] = useSearchParams();
  const initialCategory = searchParams.get("categoryId") || searchParams.get("category") || "";
  const initialSearch = searchParams.get("search") || "";

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState(initialSearch);
  const [debouncedSearch, setDebouncedSearch] = useState(initialSearch);
  const [categoryId, setCategoryId] = useState(initialCategory);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [sortBy, setSortBy] = useState("default");
  const [priceRange, setPriceRange] = useState("all");

  const searchTimerRef = useRef(null);
  const catalogSectionRef = useRef(null);

  // Fetch products from catalog microservice
  const getProducts = async () => {
    try {
      setLoading(true);
      setError("");

      const res = await api.get("/products", {
        params: {
          search: debouncedSearch,
          categoryId: categoryId || undefined,
          category_id: categoryId || undefined,
          page,
          size: 12,
          limit: 12,
        },
      });

      const raw = res.data?.data;
      const productList = Array.isArray(raw) ? raw : (raw?.content || []);
      setProducts(productList);
      setTotalPages(raw?.totalPages || res.data?.meta?.totalPages || 1);
    } catch (requestError) {
      console.error("Gagal memuat katalog produk:", requestError);
      setError("Gagal memuat data produk dari server. Silakan coba lagi.");
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  // Debounced search
  useEffect(() => {
    if (searchTimerRef.current) {
      clearTimeout(searchTimerRef.current);
    }

    searchTimerRef.current = setTimeout(() => {
      setPage(1);
      setDebouncedSearch(search.trim());
    }, 350);

    return () => {
      if (searchTimerRef.current) {
        clearTimeout(searchTimerRef.current);
      }
    };
  }, [search]);

  // Refetch when search, category, or page changes
  useEffect(() => {
    getProducts();
  }, [debouncedSearch, categoryId, page]);

  // Sync URL searchParams
  useEffect(() => {
    const cat = searchParams.get("categoryId") || searchParams.get("category") || "";
    const q = searchParams.get("search") || "";
    if (cat !== categoryId) {
      setCategoryId(cat);
      setPage(1);
    }
    if (q !== search) {
      setSearch(q);
      setDebouncedSearch(q);
      setPage(1);
    }
  }, [searchParams]);

  // Fetch categories
  useEffect(() => {
    const getCategories = async () => {
      try {
        const res = await api.get("/categories");
        const categoryList = Array.isArray(res.data) ? res.data : (res.data?.data || []);
        setCategories(categoryList);
      } catch (categoryError) {
        console.error("Gagal memuat kategori:", categoryError);
      }
    };

    getCategories();
  }, []);

  // Filter & sort locally
  const filteredProducts = useMemo(() => {
    let list = products.filter((product) =>
      product.name?.toLowerCase().includes(search.toLowerCase())
    );

    // Filter Rentang Harga
    if (priceRange === "under_150k") {
      list = list.filter((p) => Number(p.price) < 150000);
    } else if (priceRange === "150k_250k") {
      list = list.filter((p) => Number(p.price) >= 150000 && Number(p.price) <= 250000);
    } else if (priceRange === "above_250k") {
      list = list.filter((p) => Number(p.price) > 250000);
    }

    // Pengurutan (Sorting)
    if (sortBy === "price_asc") {
      list = [...list].sort((a, b) => Number(a.price) - Number(b.price));
    } else if (sortBy === "price_desc") {
      list = [...list].sort((a, b) => Number(b.price) - Number(a.price));
    } else if (sortBy === "name_asc") {
      list = [...list].sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortBy === "name_desc") {
      list = [...list].sort((a, b) => b.name.localeCompare(a.name));
    }

    return list;
  }, [products, search, priceRange, sortBy]);

  // Wishlist handler with guest guard
  const handleToggleFav = (product) => {
    if (!user) {
      toast.error("Silakan masuk terlebih dahulu untuk menyimpan jersey favorit!");
      navigate("/login");
      return;
    }
    toggleWishlist(product);
  };

  // Quick Buy handler with guest guard
  const handleQuickBuy = async (product) => {
    if (!user) {
      toast.error("Silakan masuk terlebih dahulu untuk memesan jersey ini!");
      navigate("/login");
      return;
    }
    try {
      await addToCart(product, 1, "L");
    } catch {
      toast.error("Gagal menambahkan ke keranjang.");
    }
  };

  const handleCategorySelect = (id) => {
    setPage(1);
    setCategoryId(id ? String(id) : "");
    if (id) {
      setSearchParams({ categoryId: String(id) });
    } else {
      setSearchParams({});
    }
    setTimeout(() => {
      catalogSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
  };

  const handleWhatsAppConsultation = () => {
    const msg = encodeURIComponent(
      "Halo Tim Desainer RegarStore Atelier Cicendo Bandung, kami ingin konsultasi pembuatan custom jersey tim olahraga (nama, nomor punggung, & logo tim)."
    );
    window.open(`https://wa.me/6281234567890?text=${msg}`, "_blank");
  };

  return (
    <div className="min-h-screen bg-[#FAF8F4] text-[#111613] font-sans-body antialiased">
      {/* 1. TACTICAL STORE HERO BANNER (TOPOGRAPHY THEME) */}
      <section className="relative bg-[#18221B] text-white overflow-hidden border-b border-white/10">
        {/* Topographic Texture Overlay */}
        <div className="absolute inset-0 bg-topography opacity-20 pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            {/* Left Narrative */}
            <div className="lg:col-span-8 space-y-4">
              <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-white/10 border border-white/15 text-xs font-mono uppercase tracking-wider text-slate-200">
                <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 font-mono text-[10px] font-black tracking-widest border border-emerald-500/40">
                  RS // 2026
                </span>
                <span className="text-emerald-300 font-bold">KATALOG RESMI • ATELIER CICENDO BANDUNG</span>
              </div>

              <h1 className="font-condensed text-4xl sm:text-5xl lg:text-6xl font-black uppercase tracking-tight text-white leading-[0.95]">
                JERSEY OLAHRAGA PROFESIONAL. <br />
                <span className="text-[#FAF8F4] opacity-90">
                  DIRANCANG UNTUK PERFORMA JUARA.
                </span>
              </h1>

              <p className="text-sm sm:text-base text-slate-300 max-w-2xl leading-relaxed">
                {user ? (
                  <>
                    Selamat datang kembali, <b>Kapten {user.fullName ? user.fullName.split(" ")[0] : "Member"}</b>!
                    Jelajahi seluruh koleksi ready-stock Dry-Fit Microfiber berpori aktif atau pesan custom jersey dengan nama &amp; nomor tim langsung dari atelier Bandung.
                  </>
                ) : (
                  <>
                    Pusat apparel atletik &amp; custom jersey olahraga terlengkap di Indonesia. Dibuat langsung di atelier Cicendo Bandung dengan teknologi sublimasi permanen anti-luntur dan 100% garansi tukar ukuran.
                  </>
                )}
              </p>

              {/* Metric Assurance Strip */}
              <div className="pt-3 flex flex-wrap items-center gap-3 sm:gap-6 text-xs text-slate-300">
                <span className="flex items-center gap-1.5">
                  <ShieldCheck size={16} className="text-emerald-400 shrink-0" />
                  <span>100% Garansi Tukar Ukuran</span>
                </span>
                <span>•</span>
                <span className="flex items-center gap-1.5">
                  <Award size={16} className="text-emerald-400 shrink-0" />
                  <span>Sublimasi OEKO-TEX Permanen</span>
                </span>
                <span>•</span>
                <span className="flex items-center gap-1.5">
                  <Truck size={16} className="text-emerald-400 shrink-0" />
                  <span>Bebas Ongkir Seluruh Indonesia</span>
                </span>
              </div>
            </div>

            {/* Right Custom Inquiry CTA Card with Generated Background Texture */}
            <div className="lg:col-span-4">
              <div className="relative p-6 sm:p-7 rounded-3xl overflow-hidden border border-emerald-500/30 shadow-2xl space-y-4 group">
                {/* Generated Technical Fabric Texture Background */}
                <div
                  className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
                  style={{ backgroundImage: "url('/images/custom_cta_bg.jpg')" }}
                />
                {/* Deep Gradient Overlays for optimal contrast & legibility */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#0c130e] via-[#0f1911]/90 to-[#142017]/80 pointer-events-none" />
                {/* Topographic Corak Overlay */}
                <div className="absolute inset-0 bg-topography opacity-20 pointer-events-none" />

                <div className="relative z-10 space-y-3.5">
                  <div className="flex items-center gap-2 text-emerald-400 text-xs font-mono font-bold uppercase tracking-wider">
                    <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px] border border-emerald-500/40">CUSTOM</span>
                    <span>KONSULTASI JERSEY TIM</span>
                  </div>
                  <h3 className="font-condensed text-2xl font-black uppercase text-white leading-tight">
                    Ingin Buat Jersey Custom Khusus Tim Anda?
                  </h3>
                  <p className="text-xs text-slate-300 leading-relaxed font-sans">
                    Desain gratis, bisa custom nama, nomor punggung pemain, serta logo sponsor tanpa batasan warna sublimasi.
                  </p>
                  <button
                    type="button"
                    onClick={handleWhatsAppConsultation}
                    className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 active:scale-[0.99] text-[#0D130F] font-['Barlow_Condensed'] font-black text-sm uppercase tracking-wider transition-all cursor-pointer shadow-lg shadow-emerald-500/20"
                  >
                    <Phone size={15} />
                    <span>Hubungi Desainer (WhatsApp)</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. MAIN CATALOG CONTAINER & FILTER CONTROLS */}
      <div ref={catalogSectionRef} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 space-y-8 scroll-mt-24">
        {/* Elevated Filter Suite Card */}
        <div className="p-6 sm:p-7 rounded-3xl bg-white border border-black/5 shadow-xl space-y-6">
          {/* Top Search Bar */}
          <div className="relative">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari nama jersey, nomor, spesifikasi bahan Dry-Fit..."
              className="w-full pl-11 pr-10 py-3.5 rounded-2xl bg-slate-50 hover:bg-slate-100/80 focus:bg-white border border-black/10 focus:border-emerald-600 text-xs sm:text-sm font-medium focus:outline-none transition-all"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-black p-1 cursor-pointer"
              >
                <X size={16} />
              </button>
            )}
          </div>

          {/* Sport Category Pills (Barlow Condensed Athletic Style) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-widest text-slate-400">
              <span>PILIH CABANG OLAHRAGA</span>
              <span className="font-mono text-emerald-700">{categories.length} Kategori Resmi</span>
            </div>

            <div className="flex flex-wrap gap-2 pt-1">
              <button
                type="button"
                onClick={() => handleCategorySelect("")}
                className={`px-4 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                  categoryId === ""
                    ? "bg-[#111613] text-white shadow-md scale-105"
                    : "bg-slate-100 hover:bg-slate-200 text-slate-700 border border-black/5"
                }`}
              >
                SEMUA KOLEKSI
              </button>

              {categories.map((cat) => {
                const isActive = String(categoryId) === String(cat.id);
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => handleCategorySelect(cat.id)}
                    className={`px-4 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 ${
                      isActive
                        ? "bg-[#111613] text-white shadow-md scale-105"
                        : "bg-slate-100 hover:bg-slate-200 text-slate-700 border border-black/5"
                    }`}
                  >
                    <span>{cat.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Controls Strip: Price Filter & Sorting */}
          <div className="pt-4 border-t border-black/5 flex flex-col md:flex-row md:items-center justify-between gap-4">
            {/* Price Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 pr-1">Harga:</span>
              {[
                { id: "all", label: "Semua" },
                { id: "under_150k", label: "< Rp 150rb" },
                { id: "150k_250k", label: "Rp 150rb – 250rb" },
                { id: "above_250k", label: "> Rp 250rb" },
              ].map((pill) => (
                <button
                  key={pill.id}
                  type="button"
                  onClick={() => setPriceRange(pill.id)}
                  className={`px-3 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-wider transition-colors cursor-pointer ${
                    priceRange === pill.id
                      ? "bg-emerald-950 text-white shadow-xs"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {pill.label}
                </button>
              ))}
            </div>

            {/* Sort Dropdown & Reset Action */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-black/10 bg-slate-50 text-xs">
                <SlidersHorizontal size={13} className="text-slate-400" />
                <span className="text-[11px] font-semibold text-slate-500">Urutkan:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="bg-transparent text-xs font-bold text-slate-900 outline-none cursor-pointer"
                >
                  <option value="default">Paling Sesuai</option>
                  <option value="price_asc">Harga: Termurah</option>
                  <option value="price_desc">Harga: Termahal</option>
                  <option value="name_asc">Nama: A – Z</option>
                  <option value="name_desc">Nama: Z – A</option>
                </select>
              </div>

              {(priceRange !== "all" || sortBy !== "default" || search || categoryId) && (
                <button
                  type="button"
                  onClick={() => {
                    setPriceRange("all");
                    setSortBy("default");
                    setSearch("");
                    setCategoryId("");
                    setSearchParams({});
                  }}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-full border border-red-200 bg-red-50 text-[11px] font-bold text-red-600 hover:bg-red-100 transition-colors cursor-pointer"
                  title="Reset Semua Filter"
                >
                  <X size={12} />
                  <span>Reset Filter</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* 3. PRODUCT CATALOG GRID SECTION */}
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 border-b border-black/5 pb-4">
            <div>
              <span className="text-xs font-extrabold uppercase tracking-widest text-emerald-800">
                ETALASE RESMI ATELIER
              </span>
              <h2 className="font-condensed text-3xl font-extrabold uppercase tracking-tight text-[#111613]">
                KOLEKSI JERSEY JUARA PEKAN INI
              </h2>
            </div>

            <div className="text-xs text-slate-500 font-mono">
              Menampilkan <b>{filteredProducts.length}</b> jersey siap dipesan
            </div>
          </div>

          {/* Loading State */}
          {loading ? (
            <SectionSkeletonGrid />
          ) : error ? (
            <EmptyState
              title="Data produk gagal dimuat"
              description={error}
              action={
                <button
                  type="button"
                  onClick={getProducts}
                  className="inline-flex items-center gap-2 rounded-full bg-[#111613] px-6 py-3 text-xs font-bold uppercase tracking-wider text-white transition hover:bg-black cursor-pointer shadow-lg"
                >
                  <RotateCcw size={15} />
                  <span>Coba Muat Ulang</span>
                </button>
              }
            />
          ) : filteredProducts.length === 0 ? (
            <div className="p-12 text-center rounded-3xl bg-white border border-black/5 space-y-4">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400">
                <Tag size={24} />
              </div>
              <h3 className="font-condensed text-2xl font-bold uppercase text-slate-900">
                Tidak Ada Produk yang Sesuai
              </h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                {search
                  ? `Tidak ada jersey yang cocok dengan kata kunci "${search}". Silakan coba kata kunci lain atau reset filter.`
                  : "Belum ada produk untuk kategori atau rentang harga yang dipilih."}
              </p>
              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  setPriceRange("all");
                  setCategoryId("");
                  setSearchParams({});
                }}
                className="px-6 py-2.5 rounded-full bg-[#111613] hover:bg-black text-white text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer shadow"
              >
                Tampilkan Seluruh Produk
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  user={user}
                  isFav={isWishlisted(product.id)}
                  onToggleFav={handleToggleFav}
                  onQuickBuy={handleQuickBuy}
                />
              ))}
            </div>
          )}

          {/* Pagination Controls */}
          {!loading && !error && totalPages > 1 && (
            <div className="pt-8 flex items-center justify-center gap-3">
              <button
                type="button"
                disabled={page === 1}
                onClick={() => {
                  setPage((p) => Math.max(p - 1, 1));
                  catalogSectionRef.current?.scrollIntoView({ behavior: "smooth" });
                }}
                className="flex h-11 w-11 items-center justify-center rounded-full border border-black/10 bg-white text-slate-700 hover:bg-black hover:text-white transition-all disabled:opacity-40 disabled:hover:bg-white disabled:hover:text-slate-700 cursor-pointer shadow-xs"
                title="Halaman Sebelumnya"
              >
                <ChevronLeft size={18} />
              </button>

              <span className="px-6 py-2.5 rounded-full bg-[#111613] text-white font-mono text-xs font-bold tracking-wider shadow-md">
                HALAMAN {page} / {totalPages}
              </span>

              <button
                type="button"
                disabled={page === totalPages}
                onClick={() => {
                  setPage((p) => Math.min(p + 1, totalPages));
                  catalogSectionRef.current?.scrollIntoView({ behavior: "smooth" });
                }}
                className="flex h-11 w-11 items-center justify-center rounded-full border border-black/10 bg-white text-slate-700 hover:bg-black hover:text-white transition-all disabled:opacity-40 disabled:hover:bg-white disabled:hover:text-slate-700 cursor-pointer shadow-xs"
                title="Halaman Berikutnya"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          )}
        </div>

        {/* 4. BREAKOUT BANNER: ATELIER BANDUNG CUSTOM PRODUCTION */}
        <section className="p-8 sm:p-12 rounded-3xl bg-[#18221B] text-white relative overflow-hidden shadow-2xl border border-white/10">
          <div className="absolute inset-0 bg-topography opacity-15 pointer-events-none" />

          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-8 space-y-3">
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-400">
                LAYANAN CUSTOM ATELIER CICENDO
              </span>
              <h3 className="font-condensed text-3xl sm:text-4xl font-black uppercase text-white leading-tight">
                PRODUKSI JERSEY SATU TIM LENGKAP TANPA RIBET
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-2xl">
                Bebas kustom logo klub, nomor punggung, nama pemain, hingga sponsor dengan teknologi sublimasi digital presisi tinggi. Bergaransi 100% tukar ukuran jika tidak pas di badan.
              </p>
            </div>

            <div className="lg:col-span-4 flex flex-col sm:flex-row lg:flex-col gap-3">
              <button
                type="button"
                onClick={handleWhatsAppConsultation}
                className="flex items-center justify-center gap-2 py-3.5 px-6 rounded-full bg-[#FAF8F4] hover:bg-white text-[#111613] font-black text-xs uppercase tracking-wider transition-all hover:scale-105 shadow-xl cursor-pointer"
              >
                <Phone size={15} className="text-emerald-700" />
                <span>KONSULTASI DESAIN GRATIS</span>
              </button>
              <Link
                to="/dashboard/about"
                className="flex items-center justify-center gap-2 py-3.5 px-6 rounded-full bg-white/10 hover:bg-white/20 text-white font-bold text-xs uppercase tracking-wider transition-all border border-white/20 text-center"
              >
                <span>LIHAT WORKSHOP BANDUNG</span>
                <ArrowRight size={14} />
              </Link>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}