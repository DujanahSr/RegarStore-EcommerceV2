import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  Bookmark,
  BookmarkCheck,
  Minus,
  Plus,
  ShoppingCart,
  Star,
  Zap,
  ShieldCheck,
  CheckCircle2,
  ThumbsUp,
  ArrowRight,
  Camera,
  ChevronLeft,
  ChevronRight,
  X,
  Ruler,
  Info,
  Shirt,
  Award,
  Eye,
  Share2,
} from "lucide-react";
import toast from "react-hot-toast";

import api from "../../services/api";
import { useCart } from "../../context/CartContext";
import { useAuth } from "../../context/AuthContext";
import { useWishlist } from "../../context/WishlistContext";
import { EmptyState, ScreenLoader } from "../../components/common/UiStates";
import JerseyPreviewMockup from "../../components/customer/JerseyPreviewMockup";

const getAvailableSizes = (prod) => {
  if (!prod) return ["S", "M", "L", "XL", "XXL", "3XL"];
  const name = (prod.name || "").toLowerCase();

  // 1. Sepatu Olahraga
  if (name.includes("sepatu") || name.includes("shoes") || name.includes("boots")) {
    return ["39", "40", "41", "42", "43", "44", "45"];
  }

  // 2. Sarung Tangan / Deker
  if (name.includes("sarung") || name.includes("gloves")) {
    return ["Size 8", "Size 9", "Size 10", "Size 11"];
  }
  if (name.includes("deker") || name.includes("guard")) {
    return ["S", "M", "L"];
  }

  // 3. Tas / Aksesoris
  if (name.includes("tas") || name.includes("bag") || name.includes("botol") || name.includes("kaos kaki")) {
    return ["All Size"];
  }

  // 4. Default: Jersey & Apparel Atletik Sublimasi (S - 3XL)
  return ["S", "M", "L", "XL", "XXL", "3XL"];
};

const getDefaultSize = (sizes) => {
  if (!sizes || sizes.length === 0) return "L";
  if (sizes.includes("L")) return "L";
  if (sizes.includes("42")) return "42";
  return sizes[0];
};

const getProductType = (prod) => {
  if (!prod) return "clothing";
  const name = (prod.name || "").toLowerCase();

  if (name.includes("sepatu") || name.includes("shoes") || name.includes("boots")) {
    return "shoes";
  }
  if (name.includes("bola ") || name.includes("ball") || name.includes("sarung") || name.includes("deker")) {
    return "equipment";
  }
  return "clothing";
};

// Filter untuk kustomisasi sablon: aktif untuk seluruh produk apparel/jersey RegarStore
const isCustomizableJersey = (prod) => {
  if (!prod) return true;
  const name = (prod.name || "").toLowerCase();

  // Non-jersey items
  if (
    name.includes("sepatu") ||
    name.includes("shoes") ||
    name.includes("boots") ||
    name.includes("sarung") ||
    name.includes("gloves") ||
    name.includes("deker") ||
    name.includes("tas ") ||
    name.includes("botol")
  ) {
    return false;
  }

  // Seluruh kategori 1 (Sepakbola/Futsal), 2 (Bola Voli), 3 (Badminton), 4 (Esports), 5 (Basket) adalah jersey kustom
  return true;
};

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addToCart } = useCart();
  const { addToWishlist, removeWishlist, isWishlisted } = useWishlist();

  const [product, setProduct] = useState(null);
  const [qty, setQty] = useState(1);
  const [selectedSize, setSelectedSize] = useState("L");
  const [showSizeChart, setShowSizeChart] = useState(false);
  const [activeChartTab, setActiveChartTab] = useState("clothing"); // clothing, shoes, equipment

  // Custom Jersey Sablon State (Hanya aktif untuk kategori Jersey)
  const isJersey = useMemo(() => isCustomizableJersey(product), [product]);
  const [isCustomJersey, setIsCustomJersey] = useState(false);
  const [customName, setCustomName] = useState("");
  const [customNumber, setCustomNumber] = useState("");
  const [customCollar, setCustomCollar] = useState("O-Neck");
  const [customTeam, setCustomTeam] = useState("");
  const [activeMediaTab, setActiveMediaTab] = useState("photo"); // photo | mockup

  // Otomatis matikan kustomisasi jika berpindah ke produk non-jersey
  useEffect(() => {
    if (product && !isCustomizableJersey(product)) {
      setIsCustomJersey(false);
    }
  }, [product]);

  const availableSizes = useMemo(() => {
    if (product?.sizeStocks && Object.keys(product.sizeStocks).length > 0) {
      return Object.keys(product.sizeStocks);
    }
    return getAvailableSizes(product);
  }, [product]);

  // Current stock for chosen size
  const currentSizeStock = useMemo(() => {
    if (product?.sizeStocks && selectedSize) {
      return Number(product.sizeStocks[selectedSize] ?? 0);
    }
    return Number(product?.stock ?? 0);
  }, [product, selectedSize]);

  const isCurrentSizeSoldOut = currentSizeStock <= 0;

  // Auto select size that has available stock
  useEffect(() => {
    if (product?.sizeStocks && Object.keys(product.sizeStocks).length > 0) {
      const entries = Object.entries(product.sizeStocks);
      const firstWithStock = entries.find(([, s]) => Number(s) > 0);
      if (firstWithStock) {
        setSelectedSize(firstWithStock[0]);
      } else {
        setSelectedSize(entries[0][0]);
      }
    }
  }, [product]);

  const handleAddToCart = () => {
    if (!user) {
      toast.error("Silakan login terlebih dahulu untuk menambahkan produk ke keranjang");
      navigate("/login");
      return;
    }
    if (product.stock <= 0) {
      toast.error("Stok produk ini sedang habis");
      return;
    }
    if (isCurrentSizeSoldOut) {
      toast.error(`Ukuran ${selectedSize} sedang habis`);
      return;
    }
    if (qty > currentSizeStock) {
      toast.error(`Stok ukuran ${selectedSize} hanya tersisa ${currentSizeStock} buah`);
      return;
    }
    const customOptions = (isJersey && isCustomJersey) ? {
      customName: customName.trim().toUpperCase() || null,
      customNumber: customNumber.trim() || null,
      customCollar: customCollar || "O-Neck",
      customTeam: customTeam.trim().toUpperCase() || null,
    } : null;

    addToCart(product, qty, selectedSize, customOptions);
  };

  const handleDirectBuy = () => {
    if (!user) {
      toast.error("Silakan login terlebih dahulu untuk membeli");
      navigate("/login");
      return;
    }
    if (product.stock <= 0) {
      toast.error("Stok produk ini sedang habis");
      return;
    }
    if (isCurrentSizeSoldOut) {
      toast.error(`Ukuran ${selectedSize} sedang habis`);
      return;
    }
    if (qty > currentSizeStock) {
      toast.error(`Stok ukuran ${selectedSize} hanya tersisa ${currentSizeStock} buah`);
      return;
    }

    const directItem = {
      productId: product.id,
      productName: product.name,
      productImage: product.imageUrl || product.image_url || "",
      price: Number(product.price),
      quantity: Number(qty),
      size: selectedSize,
      customName: isJersey && isCustomJersey && customName.trim() ? customName.trim().toUpperCase() : null,
      customNumber: isJersey && isCustomJersey && customNumber.trim() ? customNumber.trim() : null,
      customCollar: isJersey && isCustomJersey ? customCollar : null,
      customTeam: isJersey && isCustomJersey && customTeam.trim() ? customTeam.trim().toUpperCase() : null,
    };

    navigate("/dashboard/checkout", {
      state: { directItem },
    });
  };

  const handleShareToWhatsApp = () => {
    const isCustomized = isJersey && isCustomJersey && (customName || customNumber || customTeam);
    let text = `Halo rekan tim! Cek produk apparel dari RegarStore ini:\n\n`;
    text += `🏆 *${product.name}*\n`;
    text += `💰 *Harga*: Rp ${Number(product.price).toLocaleString("id-ID")}\n`;
    text += `👕 *Ukuran Dipilih*: ${selectedSize}\n`;
    if (isCustomized) {
      text += `\n✨ *Rancangan Sablon Tim*:\n`;
      if (customTeam.trim()) text += `• Nama Tim: ${customTeam.trim()}\n`;
      if (customName.trim()) text += `• Nama Punggung: ${customName.trim()}\n`;
      if (customNumber.trim()) text += `• Nomor Punggung: ${customNumber.trim()}\n`;
      if (customCollar) text += `• Kerah: ${customCollar}\n`;
    }
    text += `\n🔗 *Lihat Detail Produk*: ${window.location.href}\n\nBagaimana menurut kalian? Siap kita pesan bareng?`;

    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    window.open(url, "_blank");
  };

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reviews, setReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [reviewSummary, setReviewSummary] = useState(null);
  const [selectedFilter, setSelectedFilter] = useState(null); // null = all, 'photos' = with photos, 1..5 = stars
  const [lightbox, setLightbox] = useState({ open: false, images: [], index: 0 });

  const getProduct = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await api.get(`/products/${id}`);
      const prodData = res.data?.data || res.data;
      setProduct(prodData);
      const sizes = getAvailableSizes(prodData);
      setSelectedSize(getDefaultSize(sizes));
      setActiveChartTab(getProductType(prodData));
    } catch (requestError) {
      console.log(requestError);
      setError("Produk tidak ditemukan atau gagal dimuat.");
      setProduct(null);
    } finally {
      setLoading(false);
    }
  };

  const getReviewSummary = async () => {
    try {
      const res = await api.get(`/products/${id}/reviews/summary`).catch(() => null);
      if (res?.data) {
        setReviewSummary(res.data?.data || res.data);
      }
    } catch {
      setReviewSummary(null);
    }
  };

  const getReviews = async (filter = selectedFilter) => {
    try {
      setReviewsLoading(true);
      const params = { size: 50 };
      if (filter === "photos") {
        params.withPhotos = true;
      } else if (typeof filter === "number") {
        params.rating = filter;
      }
      const res = await api.get(`/products/${id}/reviews`, { params }).catch(() => ({ data: { data: [] } }));
      const payload = res.data?.data;
      const list = Array.isArray(payload?.content)
        ? payload.content
        : Array.isArray(payload)
        ? payload
        : [];
      setReviews(list);
    } catch {
      setReviews([]);
    } finally {
      setReviewsLoading(false);
    }
  };

  useEffect(() => {
    getProduct();
    getReviewSummary();
  }, [id]);

  useEffect(() => {
    getReviews(selectedFilter);
  }, [id, selectedFilter]);

  // Lightbox keyboard shortcut listener
  useEffect(() => {
    if (!lightbox.open) return;
    const handleKeyDown = (e) => {
      if (e.key === "Escape") setLightbox((l) => ({ ...l, open: false }));
      if (e.key === "ArrowRight") setLightbox((l) => ({ ...l, index: (l.index + 1) % l.images.length }));
      if (e.key === "ArrowLeft") setLightbox((l) => ({ ...l, index: (l.index - 1 + l.images.length) % l.images.length }));
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [lightbox.open]);

  const averageRating = useMemo(() => {
    if (reviewSummary?.averageRating != null && Number(reviewSummary.averageRating) > 0) {
      return Number(reviewSummary.averageRating);
    }
    if (!reviews.length) {
      return 0;
    }
    return reviews.reduce((sum, item) => sum + Number(item.rating), 0) / reviews.length;
  }, [reviewSummary, reviews]);

  const totalReviewsCount = useMemo(() => {
    if (reviewSummary?.totalReviews != null) {
      return Number(reviewSummary.totalReviews);
    }
    return reviews.length;
  }, [reviewSummary, reviews]);

  const totalWithPhotos = useMemo(() => {
    if (reviewSummary?.totalWithPhotos != null) {
      return Number(reviewSummary.totalWithPhotos);
    }
    return reviews.filter((r) => r.images && r.images.length > 0).length;
  }, [reviewSummary, reviews]);

  const breakdown = useMemo(() => {
    const map = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    if (reviewSummary?.breakdown) {
      Object.entries(reviewSummary.breakdown).forEach(([k, v]) => {
        map[Number(k)] = Number(v) || 0;
      });
      return map;
    }
    reviews.forEach((r) => {
      const star = Number(r.rating) || 5;
      map[star] = (map[star] || 0) + 1;
    });
    return map;
  }, [reviewSummary, reviews]);

  const satisfactionRate = useMemo(() => {
    if (!totalReviewsCount) return 100;
    const satisfied = (breakdown[5] || 0) + (breakdown[4] || 0);
    return Math.min(100, Math.round((satisfied / totalReviewsCount) * 100));
  }, [breakdown, totalReviewsCount]);

  if (loading) {
    return <ScreenLoader label="Memuat detail produk..." />;
  }

  if (error) {
    return <EmptyState title="Detail produk gagal dimuat" description={error} />;
  }

  if (!product) {
    return <EmptyState title="Produk tidak tersedia" description="Produk yang Anda cari tidak ditemukan." />;
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-10 animate-fade-in">
      {/* Tactical Breadcrumb & Origin Pill */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 text-xs">
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-1.5 rounded-full bg-white px-4 py-2 font-mono font-bold text-slate-700 border border-[#162018]/15 hover:border-[#162018] hover:text-[#162018] transition shadow-2xs group"
        >
          <ChevronLeft size={14} className="transition-transform group-hover:-translate-x-0.5" />
          <span>Kembali ke Katalog Toko</span>
        </Link>

        <div className="flex items-center gap-2">
          <span className="hidden sm:inline-flex items-center gap-2 rounded-full bg-[#162018] px-3.5 py-1.5 text-[11px] font-bold tracking-wider text-emerald-400 uppercase font-mono shadow-xs border border-white/10">
            <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[9px] font-black border border-emerald-500/40">
              PRO SERIES
            </span>
            <span>Atelier Cicendo Bandung</span>
          </span>
          <span className="inline-flex items-center rounded-full bg-[#FAF8F4] px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-700 border border-[#162018]/15">
            {product.categoryName || "Official Sportswear"}
          </span>
        </div>
      </div>

      <div className="rounded-3xl border border-[#162018]/10 bg-white p-6 shadow-sm ring-1 ring-black/5 sm:p-8 relative overflow-hidden">
        {/* Subtle Topographic Accent */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-topography opacity-[0.03] pointer-events-none" />

        <div className="grid gap-10 lg:grid-cols-12 relative z-10 items-start">
          {/* Left Column: Gallery / Mockup Showcase (5 cols) */}
          <div className="lg:col-span-5 space-y-4">
            {/* Media Mode Tabs (For Jersey Categories) */}
            {isJersey && (
              <div className="flex items-center rounded-xl bg-[#FAF8F4] p-1 border border-[#162018]/10 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setActiveMediaTab("photo")}
                  className={`flex-1 py-2 rounded-lg flex items-center justify-center gap-1.5 transition cursor-pointer ${
                    activeMediaTab === "photo"
                      ? "bg-[#162018] text-white shadow-xs font-mono"
                      : "text-slate-600 hover:text-black font-mono"
                  }`}
                >
                  <Eye size={14} />
                  <span>Foto Produk Real</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveMediaTab("mockup")}
                  className={`flex-1 py-2 rounded-lg flex items-center justify-center gap-1.5 transition cursor-pointer ${
                    activeMediaTab === "mockup"
                      ? "bg-[#162018] text-white shadow-xs font-mono"
                      : "text-slate-600 hover:text-black font-mono"
                  }`}
                >
                  <Shirt size={14} />
                  <span>Simulasi 3D Custom</span>
                </button>
              </div>
            )}

            {/* Media Box */}
            <div className="group relative aspect-square overflow-hidden rounded-2xl bg-[#F3EFE7] border border-[#162018]/10 shadow-inner">
              {activeMediaTab === "photo" || !isJersey ? (
                <>
                  <img
                    src={product.imageUrl || product.image_url || "https://images.unsplash.com/photo-1517466787929-bc90951d0974?w=800&q=80"}
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = "https://images.unsplash.com/photo-1517466787929-bc90951d0974?w=800&q=80";
                    }}
                    alt={product.name}
                    className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
                  />

                  {/* Tactical Overlays */}
                  <div className="absolute top-3.5 left-3.5 flex flex-col gap-1.5 pointer-events-none">
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-[#162018]/90 text-[10px] font-black uppercase tracking-wider text-amber-300 backdrop-blur-xs border border-white/10 shadow-xs font-mono">
                      ORIGINAL ATELIER
                    </span>
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-emerald-900/90 text-[10px] font-black uppercase tracking-wider text-emerald-300 backdrop-blur-xs border border-emerald-500/30 shadow-xs font-mono">
                      OEKO-TEX INK
                    </span>
                  </div>

                  <div className="absolute bottom-3.5 left-3.5 right-3.5 flex items-center justify-between">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-white/95 text-[10px] font-bold text-slate-800 shadow-sm border border-slate-200/80">
                      <ShieldCheck size={13} className="text-emerald-600" />
                      100% Garansi Tukar Ukuran
                    </span>
                    <button
                      type="button"
                      onClick={() => setLightbox({ open: true, index: 0, images: [product.imageUrl || product.image_url] })}
                      className="p-2 rounded-lg bg-white/90 hover:bg-white text-slate-700 shadow-md transition cursor-pointer"
                      title="Perbesar foto produk"
                    >
                      <Eye size={15} />
                    </button>
                  </div>
                </>
              ) : (
                <div className="p-4 h-full flex flex-col items-center justify-center bg-radial from-white to-[#F3EFE7]">
                  <JerseyPreviewMockup
                    productImage={product.imageUrl}
                    productName={product.name}
                    customName={customName}
                    customNumber={customNumber}
                    customCollar={customCollar}
                    customTeam={customTeam}
                    selectedSize={selectedSize}
                  />
                  <p className="text-[11px] font-mono text-slate-500 mt-2 text-center">
                    Visualisasi rendering otomatis berdasarkan form kustomisasi tim
                  </p>
                </div>
              )}
            </div>

            {/* Quick Assurance Strip under Media */}
            <div className="grid grid-cols-2 gap-2 text-center text-xs">
              <div className="p-3 rounded-xl bg-[#FAF8F4] border border-[#162018]/10">
                <span className="block text-[10px] font-mono uppercase tracking-wider text-slate-500">Kapasitas Produksi</span>
                <span className="font-bold text-[#162018]">Order Satuan s/d Ribuan Pcs</span>
              </div>
              <div className="p-3 rounded-xl bg-[#FAF8F4] border border-[#162018]/10">
                <span className="block text-[10px] font-mono uppercase tracking-wider text-slate-500">QC Standar Bandung</span>
                <span className="font-bold text-[#162018]">Inspeksi Jahitan 3 Lapis</span>
              </div>
            </div>

            {/* Share to WhatsApp Button */}
            <button
              type="button"
              onClick={handleShareToWhatsApp}
              className="w-full flex items-center justify-center gap-2 rounded-xl border border-emerald-600/30 bg-emerald-50/60 px-4 py-2.5 text-xs font-bold text-emerald-800 transition hover:bg-emerald-100/80 cursor-pointer"
              title="Bagikan rincian dan rancangan produk ini ke WhatsApp tim Anda"
            >
              <Share2 size={15} className="text-emerald-600" />
              <span>Diskusikan Rancangan dengan Tim via WhatsApp</span>
            </button>
          </div>

          {/* Right Column: Tactical Product Detail Info (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span className="px-2.5 py-0.5 rounded-full bg-[#162018]/10 text-[10px] font-bold uppercase tracking-wider text-[#162018]">
                  {product.categoryName || "Official Apparel"}
                </span>

                {product.stock === 0 ? (
                  <span className="rounded-full bg-rose-50 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-rose-600 border border-rose-200">
                    Stok Habis
                  </span>
                ) : product.stock <= 5 ? (
                  <span className="rounded-full bg-amber-50 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-700 border border-amber-200">
                    Sisa {product.stock} pcs (Segera Habis)
                  </span>
                ) : (
                  <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-700 border border-emerald-200">
                    Tersedia ({product.stock} pcs)
                  </span>
                )}
              </div>

              <h1 className="font-condensed text-3xl sm:text-4xl font-black uppercase tracking-tight text-[#162018] leading-tight">
                {product.name}
              </h1>

              {/* Rating Summary Strip */}
              <div className="mt-2.5 flex flex-wrap items-center gap-3 text-xs text-slate-500">
                <div className="flex items-center gap-1 text-amber-500">
                  <Star size={15} className="fill-current" />
                  <span className="font-black text-slate-900">{averageRating.toFixed(1)}</span>
                </div>
                <span className="text-slate-300">•</span>
                <span className="font-semibold text-slate-700">{totalReviewsCount} Ulasan Pembeli</span>
                {totalReviewsCount > 0 && (
                  <>
                    <span className="text-slate-300">•</span>
                    <span className="inline-flex items-center gap-1 text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-md">
                      <ThumbsUp size={12} />
                      {satisfactionRate}% Pembeli Puas
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* Tactical Pricing Box */}
            <div className="p-4 rounded-2xl bg-[#FAF8F4] border border-[#162018]/10 flex flex-wrap items-center justify-between gap-4">
              <div>
                <span className="block text-[10px] font-mono uppercase tracking-wider text-slate-400">Harga Resmi Atelier</span>
                <div className="flex items-baseline gap-2.5">
                  <p className="font-condensed text-3xl sm:text-4xl font-black text-[#B9382B] tracking-tight">
                    Rp {Number(product.price).toLocaleString("id-ID")}
                  </p>
                  <span className="text-xs font-bold text-slate-400 line-through">
                    Rp {Math.round(Number(product.price) * 1.15).toLocaleString("id-ID")}
                  </span>
                  <span className="px-2 py-0.5 rounded bg-[#B9382B]/10 text-[#B9382B] text-[11px] font-black uppercase">
                    HEMAT 15%
                  </span>
                </div>
              </div>

              <div className="text-right">
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200/80">
                  <CheckCircle2 size={13} className="text-emerald-600" />
                  Bebas Biaya Tambahan
                </span>
              </div>
            </div>

            {/* Product Description */}
            <div>
              <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                Deskripsi & Karakteristik Produk
              </h2>
              <p className="leading-relaxed text-sm text-slate-600">{product.description}</p>
            </div>

            {/* Tactical 4-Cell Tech Specs Matrix */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div className="p-3 rounded-xl bg-[#FAF8F4] border border-[#162018]/10">
                <span className="block text-[10px] font-mono uppercase text-slate-400">Material</span>
                <span className="font-bold text-xs text-[#162018]">Dri-Fit Jacquard</span>
              </div>
              <div className="p-3 rounded-xl bg-[#FAF8F4] border border-[#162018]/10">
                <span className="block text-[10px] font-mono uppercase text-slate-400">Gramasi</span>
                <span className="font-bold text-xs text-[#162018]">180 GSM Pro</span>
              </div>
              <div className="p-3 rounded-xl bg-[#FAF8F4] border border-[#162018]/10">
                <span className="block text-[10px] font-mono uppercase text-slate-400">Teknik Cetak</span>
                <span className="font-bold text-xs text-[#162018]">OEKO-TEX Sublim</span>
              </div>
              <div className="p-3 rounded-xl bg-[#FAF8F4] border border-[#162018]/10">
                <span className="block text-[10px] font-mono uppercase text-slate-400">Atelier Asal</span>
                <span className="font-bold text-xs text-[#162018]">Cicendo, Bandung</span>
              </div>
            </div>

            {/* Size Selection Section */}
            <div className="rounded-2xl border border-[#162018]/10 bg-[#FAF8F4] p-4 sm:p-5">
              <div className="flex items-center justify-between gap-3 mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    Pilihan Ukuran:
                  </span>
                  <span className={`inline-flex items-center rounded-lg px-2.5 py-0.5 text-xs font-black shadow-xs ${
                    isCurrentSizeSoldOut ? 'bg-rose-600 text-white' : 'bg-[#162018] text-white'
                  }`}>
                    {selectedSize} {isCurrentSizeSoldOut && '(Habis)'}
                  </span>
                </div>

                {/* Panduan Ukuran Button */}
                <button
                  type="button"
                  onClick={() => setShowSizeChart(true)}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-[#162018]/20 bg-white px-3 py-1.5 text-xs font-bold text-[#162018] transition hover:bg-emerald-50/50 active:scale-95 cursor-pointer shadow-2xs"
                >
                  <Ruler size={14} className="text-[#162018]" />
                  <span>Panduan Ukuran (Size Chart)</span>
                </button>
              </div>

              {/* Size Buttons with Dynamic Stock Indicators */}
              <div className="flex flex-wrap gap-2">
                {availableSizes.map((sz) => {
                  const isSelected = selectedSize === sz;
                  const szStock = product?.sizeStocks ? Number(product.sizeStocks[sz] ?? 0) : (product?.stock ?? 0);
                  const isSzSoldOut = szStock <= 0;
                  const isSzLow = szStock > 0 && szStock < 5;

                  return (
                    <button
                      key={sz}
                      type="button"
                      onClick={() => setSelectedSize(sz)}
                      className={`relative h-12 min-w-14 px-3 rounded-xl text-xs font-bold transition-all active:scale-95 flex flex-col items-center justify-center cursor-pointer ${
                        isSelected
                          ? isSzSoldOut
                            ? "bg-rose-600 text-white shadow-md shadow-rose-600/25 ring-2 ring-rose-500/20"
                            : "bg-[#162018] text-white shadow-md shadow-[#162018]/30 ring-2 ring-[#162018]/30"
                          : isSzSoldOut
                          ? "bg-slate-100 text-slate-400 border border-dashed border-slate-300 opacity-60"
                          : "bg-white text-slate-700 border border-slate-200 hover:border-[#162018]/50 hover:bg-white"
                      }`}
                    >
                      <span className={`font-mono text-xs ${isSzSoldOut ? "line-through" : ""}`}>{sz}</span>
                      {isSzSoldOut ? (
                        <span className="text-[8px] font-black text-rose-500 tracking-tighter uppercase leading-none mt-0.5">
                          Habis
                        </span>
                      ) : isSzLow ? (
                        <span className={`text-[8px] font-bold tracking-tighter leading-none mt-0.5 ${isSelected ? 'text-amber-300' : 'text-amber-600'}`}>
                          Sisa {szStock}
                        </span>
                      ) : null}
                    </button>
                  );
                })}
              </div>

              {/* Size Stock Feedback Banner */}
              {isCurrentSizeSoldOut ? (
                <div className="mt-3 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />
                  <span>Ukuran <strong>{selectedSize}</strong> saat ini habis. Silakan pilih varian ukuran lain yang masih tersedia.</span>
                </div>
              ) : (
                <div className="mt-3 p-2.5 rounded-xl bg-white border border-[#162018]/10 text-slate-700 text-xs flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                    Stok varian <strong>{selectedSize}</strong>: <strong>{currentSizeStock} pcs</strong> siap kirim dari Cicendo
                  </span>
                  {currentSizeStock < 5 && (
                    <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-md">
                      Segera Habis!
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Kustomisasi Jersey Builder (HANYA MUNCUL PADA KATEGORI JERSEY) */}
            {isJersey && (
              <div className="rounded-2xl border border-emerald-300/80 bg-gradient-to-br from-emerald-50/50 via-[#FAF8F4] to-white p-4 sm:p-5 shadow-xs">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-[#162018] text-emerald-400 flex items-center justify-center shrink-0 shadow-sm">
                      <Shirt size={18} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-xs sm:text-sm font-black text-slate-900">
                          Kustomisasi Sablon Jersey Tim
                        </h4>
                        <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-600 text-white shadow-xs">
                          FREE SUBLIMASI
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Cetak nama punggung, nomor, kerah, &amp; nama tim langsung dari Atelier Cicendo Bandung.
                      </p>
                    </div>
                  </div>

                  <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-1">
                    <input
                      type="checkbox"
                      checked={isCustomJersey}
                      onChange={(e) => {
                        setIsCustomJersey(e.target.checked);
                        if (e.target.checked) {
                          setActiveMediaTab("mockup");
                          if (!customName && user?.fullName) {
                            setCustomName(user.fullName.split(" ")[0].toUpperCase());
                            setCustomNumber("10");
                          }
                        }
                      }}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#162018]"></div>
                  </label>
                </div>

                {isCustomJersey && (
                  <div className="mt-5 pt-4 border-t border-emerald-200/80 space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                      {/* Kolom Form Input */}
                      <div className="space-y-3">
                        <div>
                          <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1">
                            Nama Punggung (Nameset):
                          </label>
                          <input
                            type="text"
                            maxLength={14}
                            value={customName}
                            onChange={(e) => setCustomName(e.target.value.toUpperCase())}
                            placeholder="CONTOH: DUJANAH"
                            className="w-full px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-xs font-mono font-bold text-slate-900 uppercase focus:outline-none focus:border-[#162018] focus:ring-1 focus:ring-[#162018] shadow-2xs"
                          />
                          <span className="text-[10px] text-slate-400 mt-0.5 block">
                            Maksimal 14 karakter huruf kapital
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1">
                              Nomor Punggung &amp; Dada:
                            </label>
                            <input
                              type="text"
                              maxLength={2}
                              value={customNumber}
                              onChange={(e) => {
                                const val = e.target.value.replace(/\D/g, "");
                                setCustomNumber(val);
                              }}
                              placeholder="10"
                              className="w-full px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-xs font-mono font-bold text-slate-900 focus:outline-none focus:border-[#162018] focus:ring-1 focus:ring-[#162018] text-center shadow-2xs"
                            />
                            <span className="text-[10px] text-emerald-700 font-semibold mt-0.5 block">
                              Standar FIFA/PBVSI
                            </span>
                          </div>

                          <div>
                            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1">
                              Model Kerah:
                            </label>
                            <select
                              value={customCollar}
                              onChange={(e) => setCustomCollar(e.target.value)}
                              className="w-full px-2.5 py-2 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-800 focus:outline-none focus:border-[#162018] shadow-2xs"
                            >
                              <option value="O-Neck">O-Neck (Bulat)</option>
                              <option value="V-Neck">V-Neck (Lancip)</option>
                              <option value="Kerah Polo">Kerah Polo</option>
                            </select>
                          </div>
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1">
                            Nama Tim / Komunitas (Opsional):
                          </label>
                          <input
                            type="text"
                            maxLength={24}
                            value={customTeam}
                            onChange={(e) => setCustomTeam(e.target.value.toUpperCase())}
                            placeholder="CONTOH: BANDUNG UNITED"
                            className="w-full px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-xs font-mono font-bold text-slate-900 uppercase focus:outline-none focus:border-[#162018] focus:ring-1 focus:ring-[#162018] shadow-2xs"
                          />
                        </div>
                      </div>

                      {/* Kolom Live Preview */}
                      <div className="w-full flex flex-col items-center justify-center p-2 rounded-2xl bg-white/80 border border-emerald-100">
                        <JerseyPreviewMockup
                          productImage={product.imageUrl}
                          productName={product.name}
                          customName={customName}
                          customNumber={customNumber}
                          customCollar={customCollar}
                          customTeam={customTeam}
                          selectedSize={selectedSize}
                        />
                        <span className="text-[10px] font-mono text-emerald-800 mt-1 font-bold">
                          ✓ Live Preview Aktual
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Quantity Selector */}
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-600 block mb-2 font-mono">
                Jumlah Pesanan:
              </span>
              <div className="flex items-center gap-4">
                <div className="flex items-center rounded-xl border border-[#162018]/20 bg-white p-1 shadow-2xs">
                  <button
                    type="button"
                    onClick={() => qty > 1 && setQty(qty - 1)}
                    disabled={qty <= 1 || isCurrentSizeSoldOut}
                    className="flex h-10 w-10 items-center justify-center rounded-lg text-slate-700 transition hover:bg-slate-100 disabled:opacity-30 cursor-pointer"
                    aria-label="Kurangi jumlah"
                  >
                    <Minus size={15} />
                  </button>

                  <span className="min-w-12 text-center text-base font-black font-mono text-slate-900">
                    {isCurrentSizeSoldOut ? 0 : qty}
                  </span>

                  <button
                    type="button"
                    onClick={() => qty < currentSizeStock && setQty(qty + 1)}
                    disabled={qty >= currentSizeStock || isCurrentSizeSoldOut}
                    className="flex h-10 w-10 items-center justify-center rounded-lg text-slate-700 transition hover:bg-slate-100 disabled:opacity-30 cursor-pointer"
                    aria-label="Tambah jumlah"
                  >
                    <Plus size={15} />
                  </button>
                </div>

                {!isCurrentSizeSoldOut && currentSizeStock > 0 && (
                  <span className="text-xs text-slate-500 font-mono">
                    Maks. {currentSizeStock} pcs per checkout
                  </span>
                )}
              </div>
            </div>

            {/* Tactical Action Buttons */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                type="button"
                onClick={async () => {
                  if (!user) {
                    toast.error("Silakan login untuk menyimpan jersey favorit!");
                    navigate("/login");
                    return;
                  }
                  if (isWishlisted(product.id)) {
                    await removeWishlist(product.id);
                  } else {
                    await addToWishlist(product);
                  }
                }}
                className={`group flex items-center gap-2 rounded-2xl border px-4 py-3.5 text-xs sm:text-sm font-mono font-bold uppercase tracking-wider transition-all cursor-pointer ${
                  isWishlisted(product.id)
                    ? "border-emerald-600 bg-emerald-50 text-emerald-800 shadow-xs"
                    : "border-[#162018]/15 bg-white text-slate-700 hover:border-[#162018] hover:text-[#162018] shadow-xs"
                }`}
                title={isWishlisted(product.id) ? "Hapus dari Koleksi Favorit" : "Simpan ke Koleksi Favorit"}
              >
                {isWishlisted(product.id) ? (
                  <BookmarkCheck
                    size={18}
                    className="text-emerald-700 fill-emerald-700 transition-transform duration-200 group-hover:scale-110"
                  />
                ) : (
                  <Bookmark
                    size={18}
                    className="text-slate-400 group-hover:text-[#162018] transition-transform duration-200 group-hover:scale-110"
                  />
                )}
                <span className="hidden sm:inline">{isWishlisted(product.id) ? "Tersimpan" : "Simpan"}</span>
              </button>

              <button
                type="button"
                onClick={handleAddToCart}
                disabled={product.stock <= 0 || isCurrentSizeSoldOut}
                className={`flex-1 flex items-center justify-center gap-2 rounded-2xl border-2 px-5 py-3.5 text-sm font-bold transition disabled:cursor-not-allowed disabled:opacity-40 font-mono ${
                  isCurrentSizeSoldOut
                    ? 'border-slate-300 bg-slate-100 text-slate-400'
                    : 'border-[#162018] bg-white text-[#162018] hover:bg-[#162018] hover:text-white cursor-pointer shadow-xs'
                }`}
              >
                <ShoppingCart size={18} />
                {isCurrentSizeSoldOut ? `Ukuran ${selectedSize} Habis` : '+ KERANJANG'}
              </button>

              <button
                type="button"
                onClick={handleDirectBuy}
                disabled={product.stock <= 0 || isCurrentSizeSoldOut}
                className="flex-1 flex items-center justify-center gap-2 rounded-2xl bg-[#B9382B] hover:bg-[#982D22] px-6 py-3.5 text-sm font-black font-condensed tracking-wider uppercase text-white shadow-lg shadow-[#B9382B]/25 transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:translate-y-0 disabled:opacity-40 cursor-pointer"
              >
                <Zap size={18} />
                BELI SEKARANG
              </button>
            </div>

            {/* 3 Pilar Garansi Resmi RegarStore 100% Bebas Cemas */}
            <div className="rounded-3xl border border-[#162018]/10 bg-[#FAF8F4] p-5 shadow-2xs">
              <div className="flex items-center gap-2.5 text-xs font-black uppercase tracking-wider text-[#162018] font-mono">
                <ShieldCheck size={18} className="text-emerald-600" />
                <span>GARANSI RESMI ATELIER REGARSTORE CICENDO</span>
              </div>

              <div className="mt-3.5 grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="flex items-start gap-2.5 rounded-2xl bg-white border border-[#162018]/10 p-3 shadow-2xs">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-emerald-100/70 text-emerald-700">
                    <CheckCircle2 size={15} />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">Akurasi Sablon 100%</h4>
                    <p className="text-[11px] text-slate-500 mt-0.5 leading-tight">
                      Cetak nama, nomor, dan logo presisi sesuai pesanan.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-2.5 rounded-2xl bg-white border border-[#162018]/10 p-3 shadow-2xs">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-emerald-100/70 text-emerald-700">
                    <Ruler size={15} />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">7 Hari Tukar Ukuran</h4>
                    <p className="text-[11px] text-slate-500 mt-0.5 leading-tight">
                      Ukuran kurang pas? Garansi tukar baru tanpa ribet.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-2.5 rounded-2xl bg-white border border-[#162018]/10 p-3 shadow-2xs">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-emerald-100/70 text-emerald-700">
                    <Award size={15} />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">Anti-Luntur Seumur Hidup</h4>
                    <p className="text-[11px] text-slate-500 mt-0.5 leading-tight">
                      Sublimasi OEKO-TEX menyatu permanen pada serat kain.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-12 border-t border-slate-100 pt-10">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
            <div>
              <div className="flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-50 text-amber-500 border border-amber-200/60">
                  <Star size={18} className="fill-current" />
                </span>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                  ULASAN & PENILAIAN PEMBELI
                </h2>
              </div>
              <p className="mt-1 text-sm text-slate-500">
                Ulasan resmi dari pelanggan yang telah menerima dan menyelesaikan pesanan produk ini.
              </p>
            </div>

            {totalReviewsCount > 0 && (
              <div className="flex items-center gap-2 rounded-2xl bg-emerald-50/80 border border-emerald-200/80 px-4 py-2 text-xs font-bold text-emerald-800">
                <ThumbsUp size={15} className="text-emerald-600" />
                <span>{satisfactionRate}% Pembeli Puas</span>
              </div>
            )}
          </div>

          {/* Tokopedia/Shopee Style Rating Overview Card */}
          <div className="mb-8 grid gap-6 rounded-3xl border border-slate-100 bg-slate-50/60 p-6 md:grid-cols-12 md:items-center">
            {/* Left: Big Score & Stars */}
            <div className="flex flex-col items-center justify-center text-center border-b border-slate-200/70 pb-6 md:col-span-4 md:border-b-0 md:border-r md:pb-0 md:pr-6">
              <div className="flex items-baseline gap-1">
                <span className="text-5xl font-black text-slate-900 tracking-tight">
                  {averageRating.toFixed(1)}
                </span>
                <span className="text-lg font-bold text-slate-400">/ 5.0</span>
              </div>

              <div className="mt-2.5 flex items-center gap-1 text-amber-400">
                {Array.from({ length: 5 }).map((_, idx) => (
                  <Star
                    key={idx}
                    size={20}
                    className={idx < Math.round(averageRating) ? "fill-amber-400" : "text-slate-200"}
                  />
                ))}
              </div>

              <p className="mt-2 text-xs font-semibold text-slate-500">
                {totalReviewsCount > 0
                  ? `Berdasarkan ${totalReviewsCount} ulasan pembeli`
                  : "Belum ada penilaian ulasan"}
              </p>
            </div>

            {/* Right: Star Progress Bars */}
            <div className="space-y-2 md:col-span-8 md:pl-2">
              {[5, 4, 3, 2, 1].map((star) => {
                const count = breakdown[star] || 0;
                const percentage = totalReviewsCount > 0 ? Math.round((count / totalReviewsCount) * 100) : 0;
                const isSelected = selectedFilter === star;

                return (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setSelectedFilter(isSelected ? null : star)}
                    className={`w-full flex items-center gap-3 text-xs font-semibold rounded-xl px-2.5 py-1.5 transition text-left ${
                      isSelected
                        ? "bg-emerald-100/70 ring-1 ring-emerald-500/40"
                        : "hover:bg-white/80"
                    }`}
                  >
                    <div className="flex items-center gap-1 w-16 text-slate-700 shrink-0">
                      <span>{star}</span>
                      <Star size={12} className="fill-amber-400 text-amber-400" />
                    </div>

                    <div className="flex-1 h-2.5 bg-slate-200/80 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-amber-400 rounded-full transition-all duration-500"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>

                    <span className="w-16 text-right text-slate-400 font-mono text-[11px] shrink-0">
                      {count} ({percentage}%)
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Filter Pills */}
          <div className="mb-6 flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 mr-1">
              Filter:
            </span>
            <button
              type="button"
              onClick={() => setSelectedFilter(null)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition active:scale-95 ${
                selectedFilter === null
                  ? "bg-emerald-600 text-white shadow-sm shadow-emerald-600/20"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              Semua ({totalReviewsCount})
            </button>

            {/* Pill Dengan Foto (Tokopedia / Shopee Style) */}
            <button
              type="button"
              onClick={() => setSelectedFilter(selectedFilter === "photos" ? null : "photos")}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold transition active:scale-95 ${
                selectedFilter === "photos"
                  ? "bg-emerald-600 text-white shadow-sm shadow-emerald-600/20"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              <Camera size={13} />
              <span>Dengan Foto ({totalWithPhotos})</span>
            </button>

            {[5, 4, 3, 2, 1].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setSelectedFilter(selectedFilter === star ? null : star)}
                className={`flex items-center gap-1 px-3.5 py-1.5 rounded-full text-xs font-bold transition active:scale-95 ${
                  selectedFilter === star
                    ? "bg-emerald-600 text-white shadow-sm shadow-emerald-600/20"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                <span>{star} Bintang</span>
                <span className="text-[10px] opacity-75">({breakdown[star] || 0})</span>
              </button>
            ))}
          </div>

          {/* Trust Banner (Verified Buyers Only) */}
          <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 rounded-2xl border border-emerald-100 bg-emerald-50/40 p-4 text-xs text-emerald-950">
            <div className="flex items-center gap-2.5">
              <ShieldCheck size={20} className="text-emerald-600 shrink-0" />
              <div>
                <span className="font-bold text-emerald-900">Ulasan Terverifikasi Pembeli:</span>
                <span className="text-slate-600 ml-1">
                  Seluruh testimoni hanya dapat dibuat oleh pembeli resmi setelah menerima pesanan untuk memastikan keaslian ulasan.
                </span>
              </div>
            </div>
            <Link
              to="/dashboard/my-orders"
              className="inline-flex items-center gap-1 font-bold text-emerald-700 hover:text-emerald-800 shrink-0 hover:underline"
            >
              <span>Pesanan Saya</span>
              <ArrowRight size={13} />
            </Link>
          </div>

          {/* Review List */}
          {reviewsLoading ? (
            <ScreenLoader label="Memuat ulasan pembeli..." />
          ) : reviews.length === 0 ? (
            <EmptyState
              title={
                selectedFilter === "photos"
                  ? "Belum ada ulasan dengan foto"
                  : typeof selectedFilter === "number"
                  ? `Tidak ada ulasan ${selectedFilter} bintang`
                  : "Belum Ada Ulasan"
              }
              description={
                selectedFilter === "photos"
                  ? "Belum ada pembeli yang melampirkan foto produk untuk ulasan ini."
                  : typeof selectedFilter === "number"
                  ? "Belum ada pembeli yang memberikan rating bintang ini."
                  : "Jadilah yang pertama memesan dan memberikan ulasan untuk jersey ini!"
              }
            />
          ) : (
            <div className="space-y-4">
              {reviews.map((review) => {
                const customerName = review.customerName || review.users?.full_name || "Pelanggan RegarStore";
                const customerAvatar = review.customerAvatar || review.users?.avatar_url;
                const reviewDate = review.createdAt || review.created_at;
                const replies = review.review_replies || review.replies || [];
                const images = Array.isArray(review.images) ? review.images : [];

                return (
                  <div
                    key={review.id}
                    className="rounded-3xl border border-slate-100 bg-white p-5 shadow-xs transition hover:border-slate-200 hover:shadow-sm sm:p-6"
                  >
                    {/* Buyer Header */}
                    <div className="mb-3 flex items-start justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-full bg-emerald-100 text-emerald-700 font-bold border border-emerald-200/80 shrink-0">
                          {customerAvatar ? (
                            <img
                              src={customerAvatar}
                              alt={customerName}
                              className="h-full w-full object-cover"
                              onError={(e) => {
                                e.currentTarget.style.display = "none";
                              }}
                            />
                          ) : (
                            customerName.charAt(0).toUpperCase()
                          )}
                        </div>

                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="font-bold text-slate-900 text-sm">{customerName}</h3>
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-extrabold text-emerald-700 ring-1 ring-emerald-200">
                              <CheckCircle2 size={11} />
                              Pembeli Terverifikasi
                            </span>
                          </div>

                          {reviewDate && (
                            <p className="text-xs text-slate-400 mt-0.5">
                              {new Date(reviewDate).toLocaleDateString("id-ID", {
                                day: "numeric",
                                month: "long",
                                year: "numeric",
                              })}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Stars */}
                      <div className="flex items-center gap-0.5 text-amber-400">
                        {Array.from({ length: 5 }).map((_, index) => (
                          <Star
                            key={index}
                            size={15}
                            className={index < Number(review.rating) ? "fill-current" : "text-slate-200"}
                          />
                        ))}
                      </div>
                    </div>

                    {/* Comment Body */}
                    <p className="leading-relaxed text-slate-700 text-sm pl-1">{review.comment}</p>

                    {/* Customer Photo Attachments (Cloudinary Thumbnails) */}
                    {images.length > 0 && (
                      <div className="mt-3.5 flex flex-wrap gap-2.5 pl-1">
                        {images.map((imgUrl, imgIdx) => (
                          <button
                            key={imgIdx}
                            type="button"
                            onClick={() =>
                              setLightbox({
                                open: true,
                                images,
                                index: imgIdx,
                              })
                            }
                            className="relative h-20 w-20 sm:h-24 sm:w-24 rounded-2xl overflow-hidden border border-slate-200 hover:border-emerald-500 transition-all hover:scale-105 active:scale-95 group shadow-xs shrink-0"
                            title="Klik untuk memperbesar foto ulasan"
                          >
                            <img
                              src={imgUrl}
                              alt={`Foto ulasan ${imgIdx + 1}`}
                              className="h-full w-full object-cover group-hover:scale-110 transition duration-300"
                            />
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/15 transition" />
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Official Seller Reply */}
                    {replies && replies.length > 0 && (
                      <div className="mt-4 rounded-2xl border border-emerald-200/70 bg-emerald-50/60 p-4 text-xs">
                        <div className="flex items-center justify-between gap-2 mb-1.5">
                          <div className="flex items-center gap-1.5 font-bold text-emerald-900">
                            <ShieldCheck size={15} className="text-emerald-600" />
                            <span>Respon Penjual: {replies[0].admin_name || "Admin RegarStore"}</span>
                          </div>
                          {replies[0].created_at && (
                            <span className="text-[10px] text-emerald-700/60 font-medium">
                              {new Date(replies[0].created_at).toLocaleDateString("id-ID", {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              })}
                            </span>
                          )}
                        </div>
                        <p className="text-slate-700 leading-relaxed pl-5">{replies[0].reply}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Lightbox / Fullscreen Image Zoom Modal */}
        {lightbox.open && lightbox.images.length > 0 && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-in fade-in duration-200"
            onClick={() => setLightbox({ open: false, images: [], index: 0 })}
          >
            <div
              className="relative max-w-4xl max-h-[90vh] flex flex-col items-center"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close Button */}
              <button
                type="button"
                onClick={() => setLightbox({ open: false, images: [], index: 0 })}
                className="absolute -top-12 right-0 p-2 text-white/70 hover:text-white rounded-full bg-white/10 hover:bg-white/20 transition"
                title="Tutup (Esc)"
              >
                <X size={24} />
              </button>

              {/* Main Display Image */}
              <img
                src={lightbox.images[lightbox.index]}
                alt={`Foto Ulasan ${lightbox.index + 1}`}
                className="max-h-[75vh] max-w-full rounded-2xl object-contain shadow-2xl ring-1 ring-white/15"
              />

              {/* Footer Controls */}
              <div className="mt-4 flex items-center justify-between w-full text-white/80 text-xs px-2">
                <span className="font-medium">
                  Foto {lightbox.index + 1} dari {lightbox.images.length}
                </span>

                {lightbox.images.length > 1 && (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        setLightbox((l) => ({
                          ...l,
                          index: (l.index - 1 + l.images.length) % l.images.length,
                        }))
                      }
                      className="p-2 rounded-full bg-white/10 hover:bg-white/25 text-white transition active:scale-95"
                      title="Foto Sebelumnya"
                    >
                      <ChevronLeft size={18} />
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setLightbox((l) => ({
                          ...l,
                          index: (l.index + 1) % l.images.length,
                        }))
                      }
                      className="p-2 rounded-full bg-white/10 hover:bg-white/25 text-white transition active:scale-95"
                      title="Foto Berikutnya"
                    >
                      <ChevronRight size={18} />
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Panduan Ukuran (Size Chart) Tactical Modal */}
        {showSizeChart && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in duration-200"
            onClick={() => setShowSizeChart(false)}
          >
            <div
              className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-[#162018] rounded-3xl p-6 sm:p-8 shadow-2xl border border-white/15 text-white space-y-6"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="flex items-start justify-between pb-4 border-b border-white/10">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shadow-xs shrink-0">
                    <Ruler size={22} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-condensed text-xl font-black uppercase tracking-wider text-white">
                        Panduan Ukuran (Size Chart)
                      </h3>
                      <span className="rounded-full bg-emerald-400/10 px-2.5 py-0.5 text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-300 border border-emerald-400/20">
                        Atelier Cicendo
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 font-mono mt-0.5">
                      Standar ukuran resmi RegarStore untuk performa atletik dan kenyamanan optimal.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setShowSizeChart(false)}
                  className="rounded-full p-2 text-slate-400 hover:bg-white/10 hover:text-white transition cursor-pointer"
                  title="Tutup (Esc)"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Category Tabs inside Modal */}
              <div className="flex items-center gap-2 p-1.5 bg-black/40 border border-white/10 rounded-2xl">
                <button
                  type="button"
                  onClick={() => setActiveChartTab("clothing")}
                  className={`flex-1 py-2 text-xs font-mono font-bold uppercase tracking-wider rounded-xl transition cursor-pointer ${
                    activeChartTab === "clothing"
                      ? "bg-[#111613] text-emerald-400 border border-emerald-500/30 shadow-sm"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  Jersey &amp; Apparel
                </button>
                <button
                  type="button"
                  onClick={() => setActiveChartTab("shoes")}
                  className={`flex-1 py-2 text-xs font-mono font-bold uppercase tracking-wider rounded-xl transition cursor-pointer ${
                    activeChartTab === "shoes"
                      ? "bg-[#111613] text-emerald-400 border border-emerald-500/30 shadow-sm"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  Sepatu Olahraga
                </button>
                <button
                  type="button"
                  onClick={() => setActiveChartTab("equipment")}
                  className={`flex-1 py-2 text-xs font-mono font-bold uppercase tracking-wider rounded-xl transition cursor-pointer ${
                    activeChartTab === "equipment"
                      ? "bg-[#111613] text-emerald-400 border border-emerald-500/30 shadow-sm"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  Perlengkapan &amp; Bola
                </button>
              </div>

              {/* Tab 1: Clothing / Jersey */}
              {activeChartTab === "clothing" && (
                <div className="space-y-4">
                  <div className="overflow-x-auto rounded-2xl border border-white/10 bg-black/30">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-white/10 text-emerald-400 font-mono font-bold uppercase tracking-wider text-[11px] border-b border-white/10">
                        <tr>
                          <th className="p-3.5">Ukuran</th>
                          <th className="p-3.5">Lebar Dada (cm)</th>
                          <th className="p-3.5">Panjang Baju (cm)</th>
                          <th className="p-3.5">Rekomendasi TB (cm)</th>
                          <th className="p-3.5">Rekomendasi BB (kg)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5 font-mono text-slate-200">
                        {[
                          { size: "S", chest: "48", length: "68", tb: "155 - 165", bb: "50 - 60" },
                          { size: "M", chest: "50", length: "70", tb: "160 - 170", bb: "58 - 68" },
                          { size: "L", chest: "52", length: "72", tb: "168 - 178", bb: "65 - 78" },
                          { size: "XL", chest: "54", length: "74", tb: "175 - 185", bb: "75 - 88" },
                          { size: "XXL", chest: "56", length: "76", tb: "180 - 190", bb: "85 - 98" },
                          { size: "3XL", chest: "58", length: "78", tb: "185 - 195", bb: "95 - 110" },
                        ].map((row) => (
                          <tr
                            key={row.size}
                            className={`transition hover:bg-white/5 ${
                              selectedSize === row.size ? "bg-emerald-500/15 text-emerald-300 font-bold border-l-2 border-emerald-400" : ""
                            }`}
                          >
                            <td className="p-3.5 font-bold flex items-center gap-1.5">
                              <span className="text-white">{row.size}</span>
                              {selectedSize === row.size && (
                                <span className="rounded-full bg-emerald-400/20 text-emerald-300 text-[9px] font-mono uppercase px-2 py-0.5 border border-emerald-400/30">
                                  Pilihan Anda
                                </span>
                              )}
                            </td>
                            <td className="p-3.5">{row.chest} cm</td>
                            <td className="p-3.5">{row.length} cm</td>
                            <td className="p-3.5">{row.tb} cm</td>
                            <td className="p-3.5">{row.bb} kg</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="rounded-2xl border border-amber-400/20 bg-amber-400/5 p-4 text-xs text-amber-200/90 space-y-1.5 font-mono">
                    <p className="font-bold flex items-center gap-1.5 text-amber-300 uppercase tracking-wider text-[11px]">
                      <Info size={14} className="text-amber-400 shrink-0" />
                      Tips Pengukuran Jersey &amp; Pakaian:
                    </p>
                    <ul className="list-disc list-inside space-y-1 text-slate-300 pl-1 text-[11px] font-sans">
                      <li>Ukur <strong className="text-white">Lebar Dada</strong> dari bawah ketiak kiri ke ketiak kanan secara mendatar pada jersey favorit Anda.</li>
                      <li>Toleransi jahit manual atelier sekitar <strong className="text-white">&plusmn; 1-2 cm</strong>.</li>
                      <li>Untuk gaya <em>loose fit</em> saat bertanding intensif, Anda dapat memilih 1 ukuran di atas rekomendasi.</li>
                    </ul>
                  </div>
                </div>
              )}

              {/* Tab 2: Shoes */}
              {activeChartTab === "shoes" && (
                <div className="space-y-4">
                  <div className="overflow-x-auto rounded-2xl border border-white/10 bg-black/30">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-white/10 text-emerald-400 font-mono font-bold uppercase tracking-wider text-[11px] border-b border-white/10">
                        <tr>
                          <th className="p-3.5">Size (EU)</th>
                          <th className="p-3.5">Panjang Kaki (cm)</th>
                          <th className="p-3.5">US Men</th>
                          <th className="p-3.5">UK</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5 font-mono text-slate-200">
                        {[
                          { eu: "39", cm: "24.5", us: "6.5", uk: "5.5" },
                          { eu: "40", cm: "25.0", us: "7.0", uk: "6.0" },
                          { eu: "41", cm: "26.0", us: "8.0", uk: "7.0" },
                          { eu: "42", cm: "26.5", us: "8.5", uk: "7.5" },
                          { eu: "43", cm: "27.5", us: "9.5", uk: "8.5" },
                          { eu: "44", cm: "28.0", us: "10.0", uk: "9.0" },
                          { eu: "45", cm: "29.0", us: "11.0", uk: "10.0" },
                        ].map((row) => (
                          <tr
                            key={row.eu}
                            className={`transition hover:bg-white/5 ${
                              selectedSize === row.eu ? "bg-emerald-500/15 text-emerald-300 font-bold border-l-2 border-emerald-400" : ""
                            }`}
                          >
                            <td className="p-3.5 font-bold flex items-center gap-1.5">
                              <span className="text-white">EU {row.eu}</span>
                              {selectedSize === row.eu && (
                                <span className="rounded-full bg-emerald-400/20 text-emerald-300 text-[9px] font-mono uppercase px-2 py-0.5 border border-emerald-400/30">
                                  Pilihan Anda
                                </span>
                              )}
                            </td>
                            <td className="p-3.5">{row.cm} cm</td>
                            <td className="p-3.5">{row.us}</td>
                            <td className="p-3.5">{row.uk}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="rounded-2xl border border-amber-400/20 bg-amber-400/5 p-4 text-xs text-amber-200/90 space-y-1.5 font-mono">
                    <p className="font-bold flex items-center gap-1.5 text-amber-300 uppercase tracking-wider text-[11px]">
                      <Info size={14} className="text-amber-400 shrink-0" />
                      Tips Pengukuran Telapak Kaki:
                    </p>
                    <ul className="list-disc list-inside space-y-1 text-slate-300 pl-1 text-[11px] font-sans">
                      <li>Letakkan tumit merapat ke dinding di atas kertas putih tegak lurus.</li>
                      <li>Tandai ujung jari kaki terpanjang dengan pensil lalu ukur panjangnya dalam cm.</li>
                      <li>Tambahkan <strong className="text-white">0.5 cm</strong> untuk ruang gerak saat mengenakan kaos kaki tebal.</li>
                    </ul>
                  </div>
                </div>
              )}

              {/* Tab 3: Equipment */}
              {activeChartTab === "equipment" && (
                <div className="space-y-4">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                      <span className="inline-block rounded-lg bg-emerald-400/20 text-emerald-300 text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 mb-1.5 border border-emerald-400/30">
                        Sepakbola Lapangan
                      </span>
                      <h4 className="font-condensed text-base font-bold text-white uppercase tracking-wide">Bola Size 5 (Resmi FIFA)</h4>
                      <p className="text-xs text-slate-300 mt-1 font-mono">
                        Keliling 68-70 cm, berat 410-450 gr. Standar kompetisi usia 12 tahun ke atas hingga level profesional.
                      </p>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                      <span className="inline-block rounded-lg bg-sky-400/20 text-sky-300 text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 mb-1.5 border border-sky-400/30">
                        Futsal &amp; Indoor
                      </span>
                      <h4 className="font-condensed text-base font-bold text-white uppercase tracking-wide">Bola Size 4 (Standar Futsal)</h4>
                      <p className="text-xs text-slate-300 mt-1 font-mono">
                        Keliling 62-64 cm, berat 400-440 gr. Pantulan rendah (low bounce) khusus lapangan indoor/sintetis.
                      </p>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                      <span className="inline-block rounded-lg bg-amber-400/20 text-amber-300 text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 mb-1.5 border border-amber-400/30">
                        Bola Basket
                      </span>
                      <h4 className="font-condensed text-base font-bold text-white uppercase tracking-wide">Size 7 (Pria) &amp; Size 6 (Wanita)</h4>
                      <p className="text-xs text-slate-300 mt-1 font-mono">
                        Size 7 standar resmi kompetisi pria SMA/kuliah/FIBA. Size 6 untuk wanita &amp; remaja usia 12-14 tahun.
                      </p>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                      <span className="inline-block rounded-lg bg-purple-400/20 text-purple-300 text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 mb-1.5 border border-purple-400/30">
                        Perlengkapan Kiper &amp; Deker
                      </span>
                      <h4 className="font-condensed text-base font-bold text-white uppercase tracking-wide">Size 8 - 11 &amp; Shin Guard M/L</h4>
                      <p className="text-xs text-slate-300 mt-1 font-mono">
                        Size 8 (telapak 18cm), Size 9 (19cm), Size 10 (20cm). Deker M (&lt;170cm), L (&gt;170cm).
                      </p>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-xs text-slate-300 font-mono">
                    <p className="font-bold text-white mb-1 uppercase tracking-wider text-[11px]">Aksesoris &amp; Tas Olahraga:</p>
                    <p className="text-[11px] leading-relaxed text-slate-400">
                      Kategori tas ransel gym, duffle bag, kaos kaki, dan botol minum RegarStore berukuran <strong className="text-white">All Size</strong> dengan konstruksi ergonomis.
                    </p>
                  </div>
                </div>
              )}

              {/* Modal Footer */}
              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={() => setShowSizeChart(false)}
                  className="rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 px-6 py-2.5 text-xs font-mono font-bold uppercase tracking-wider text-white transition active:scale-95 cursor-pointer"
                >
                  Tutup Panduan
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}