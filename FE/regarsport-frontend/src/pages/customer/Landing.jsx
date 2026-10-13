import { useEffect, useState, useMemo, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import {
  Search,
  Menu,
  ShoppingBag,
  ShoppingCart,
  User,
  ArrowRight,
  ShieldCheck,
  Truck,
  Star,
  CheckCircle2,
  Phone,
  Layers,
  Award,
  Copy,
  Check,
  Ruler,
  X,
  Building2,
  Clock,
  Tag,
  ChevronDown,
  LogOut,
  Package,
  Bookmark,
} from "lucide-react";

import api from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import { useCart } from "../../context/CartContext";

import NavDrawer from "../../components/customer/NavDrawer";
import CartSlideOver from "../../components/customer/CartSlideOver";
import QuickSearchModal from "../../components/customer/QuickSearchModal";
import RegarStoreLogo from "../../components/common/RegarStoreLogo";

export default function Landing() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { addToCart = () => {} } = useCart() || {};

  // User Dropdown State & Click-outside listener
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Drawer and Modal States
  const [isNavOpen, setIsNavOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // Interactive Modals State (Size Chart, Warranty Policy, Coupon)
  const [showCouponModal, setShowCouponModal] = useState(false);
  const [showSizeModal, setShowSizeModal] = useState(false);
  const [showWarrantyModal, setShowWarrantyModal] = useState(false);

  // Coupon / Newsletter state
  const [newsletterEmail, setNewsletterEmail] = useState("");
  const [couponClaimed, setCouponClaimed] = useState(() => {
    return localStorage.getItem("regarstore_coupon_claimed") === "true";
  });
  const [couponCopied, setCouponCopied] = useState(false);

  // Products and Categories Data
  const [products, setProducts] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLandingData = async () => {
      try {
        setLoading(true);
        const prodRes = await api
          .get("/products", {
            params: { page: 1, size: 8, sortBy: "id", sortOrder: "desc" },
          })
          .catch(() => ({ data: { data: { content: [] } } }));

        const prodList =
          prodRes.data?.data?.content || prodRes.data?.content || [];
        setProducts(prodList);
      } catch (err) {
        console.error("Gagal memuat data katalog:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchLandingData();
  }, []);

  const handleCustomWhatsApp = () => {
    const msg = encodeURIComponent(
      "Halo Tim Desain RegarStore Cicendo Bandung, saya ingin konsultasi pembuatan custom jersey tim olahraga kami. Mohon info katalog bahan dry-fit dan pricelist."
    );
    window.open(`https://wa.me/6281234567890?text=${msg}`, "_blank");
  };

  const handleNewsletterSubmit = (e) => {
    e.preventDefault();
    if (!newsletterEmail || !newsletterEmail.includes("@")) {
      toast.error("Mohon masukkan format email yang valid!");
      return;
    }
    localStorage.setItem("regarstore_subscriber", newsletterEmail);
    localStorage.setItem("regarstore_coupon_claimed", "true");
    setCouponClaimed(true);
    setShowCouponModal(true);
    toast.success("Kupon eksklusif REGARJUARA berhasil diaktifkan!");
  };

  const handleCopyCoupon = () => {
    navigator.clipboard.writeText("REGARJUARA");
    setCouponCopied(true);
    toast.success("Kode kupon 'REGARJUARA' berhasil disalin ke clipboard!");
    setTimeout(() => setCouponCopied(false), 3000);
  };

  // Filtered products for showcase section
  const filteredProducts = useMemo(() => {
    if (selectedCategory === "ALL") return products;
    return products.filter((p) => {
      const catName = (p.categoryName || p.category?.name || "").toUpperCase();
      const prodName = p.name?.toUpperCase() || "";
      return catName.includes(selectedCategory) || prodName.includes(selectedCategory);
    });
  }, [products, selectedCategory]);

  return (
    <div className="min-h-screen bg-[#FAF8F4] text-[#111613] font-sans-body antialiased selection:bg-[#B9382B] selection:text-white">
      {/* 1. TOP ANNOUNCEMENT TICKER */}
      <div className="bg-[#111613] text-[#FAF8F4] py-2 px-4 text-[11px] font-semibold border-b border-white/10 tracking-wider">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5 overflow-hidden whitespace-nowrap">
            <span className="bg-[#B9382B] text-white text-[9px] uppercase px-2 py-0.5 rounded-full font-black tracking-widest">
              OFFICIAL LAUNCH
            </span>
            <span className="text-slate-300">
              Koleksi Pro Elite 2026 Tersedia • Gunakan kupon{" "}
              <span className="text-white font-extrabold underline decoration-1 underline-offset-2">
                REGARJUARA
              </span>{" "}
              untuk diskon ekstra
            </span>
          </div>

          <div className="hidden lg:flex items-center gap-5 text-[11px] text-slate-300">
            <span className="flex items-center gap-1.5">
              <ShieldCheck size={14} className="text-emerald-400" />
              Garansi Tukar Ukuran 100%
            </span>
            <span>•</span>
            <span className="flex items-center gap-1.5">
              <Truck size={14} className="text-emerald-400" />
              Bebas Ongkir Seluruh Indonesia
            </span>
          </div>
        </div>
      </div>

      {/* 2. TACTICAL HEADER / NAVBAR (BRIGADE OVERLAND AESTHETIC) */}
      <header className="sticky top-0 z-40 bg-[#162018]/95 backdrop-blur-md text-white border-b border-white/10 transition-all">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-2">
          {/* Left: Menu Hamburger & Search Button */}
          <div className="flex items-center gap-3 sm:gap-4">
            <button
              onClick={() => setIsNavOpen(true)}
              className="flex items-center gap-2 py-2 px-3 rounded-full hover:bg-white/10 text-xs font-bold uppercase tracking-wider transition-all cursor-pointer"
              title="Buka Menu Kategori"
            >
              <Menu size={18} />
              <span className="hidden sm:inline">MENU</span>
            </button>

            <button
              onClick={() => setIsSearchOpen(true)}
              className="flex items-center gap-2 py-2 px-3 rounded-full hover:bg-white/10 text-xs font-bold uppercase tracking-wider text-slate-300 hover:text-white transition-all cursor-pointer"
              title="Cari Jersey & Produk"
            >
              <Search size={17} />
              <span className="hidden md:inline">CARI</span>
            </button>
          </div>

          {/* Center: Shield Crest Brand Emblem */}
          <Link to="/" className="flex items-center gap-2 sm:gap-3 group min-w-0">
            <div className="shrink-0 group-hover:scale-105 transition-transform drop-shadow-md">
              <RegarStoreLogo size={40} />
            </div>

            <div className="hidden sm:block text-left">
              <span className="font-condensed text-xl sm:text-3xl font-extrabold tracking-tight uppercase text-white block leading-none">
                REGARSTORE
              </span>
              <span className="hidden sm:block text-[9px] font-bold uppercase tracking-[2px] text-emerald-400/90">
                APPAREL • CICENDO BANDUNG
              </span>
            </div>
          </Link>

          {/* Right: Direct Store Catalog CTA, WhatsApp & Auth */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Direct Link to Store Catalog */}
            <Link
              to="/dashboard"
              className="flex items-center gap-2 py-2 px-3.5 rounded-full bg-white/10 hover:bg-white/20 text-xs font-bold uppercase tracking-wider text-white transition-all border border-white/10 hover:border-emerald-400/50"
              title="Buka Seluruh Koleksi di Katalog Toko"
            >
              <ShoppingBag size={15} className="text-emerald-400" />
              <span className="hidden sm:inline">KATALOG TOKO</span>
            </Link>

            {/* User Auth Buttons */}
            {user ? (
              <div className="relative" ref={userMenuRef}>
                <button
                  type="button"
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center gap-2 py-1.5 pl-1.5 pr-3 rounded-full bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 text-xs font-bold uppercase tracking-wider transition-all border border-emerald-500/40 cursor-pointer"
                >
                  {user.avatarUrl ? (
                    <img
                      src={user.avatarUrl}
                      alt={user.fullName}
                      className="w-7 h-7 rounded-full object-cover ring-1 ring-emerald-400 shrink-0"
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
                        e.currentTarget.nextElementSibling?.classList.remove("hidden");
                      }}
                    />
                  ) : null}
                  <span
                    className={`w-7 h-7 rounded-full bg-linear-to-br from-emerald-600 to-emerald-800 text-white font-black text-xs flex items-center justify-center ring-1 ring-emerald-400/50 shrink-0 ${
                      user.avatarUrl ? "hidden" : ""
                    }`}
                  >
                    {user.fullName?.charAt(0).toUpperCase() || "U"}
                  </span>
                  <span>{user.fullName ? user.fullName.split(" ")[0] : "Akun"}</span>
                  <ChevronDown
                    size={13}
                    className={`transition-transform duration-200 ${
                      isUserMenuOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {/* Tactical Profile Dropdown Menu */}
                {isUserMenuOpen && (
                  <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-[#162018] border border-emerald-500/30 shadow-2xl overflow-hidden z-50 animate-fade-in text-white divide-y divide-white/10">
                    {/* User Identity Header */}
                    <div className="p-4 bg-black/40 space-y-1.5">
                      <div className="flex items-center gap-2.5">
                        <div className="w-10 h-10 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center font-black text-emerald-300 text-sm overflow-hidden shrink-0">
                          {user.avatarUrl ? (
                            <img
                              src={user.avatarUrl}
                              alt={user.fullName}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            user.fullName?.charAt(0).toUpperCase() || "U"
                          )}
                        </div>
                        <div className="overflow-hidden">
                          <div className="text-xs font-bold text-white truncate">
                            {user.fullName || "Pengguna"}
                          </div>
                          <div className="text-[10px] text-slate-400 truncate">
                            {user.email}
                          </div>
                        </div>
                      </div>
                      <div className="pt-1 flex items-center gap-1.5">
                        <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 text-[9px] font-black uppercase tracking-wider border border-emerald-500/30">
                          {user.role === "admin"
                            ? "ADMINISTRATOR"
                            : user.role === "logistics"
                            ? "LOGISTIK GUDANG"
                            : "KAPTEN TIM MEMBER"}
                        </span>
                      </div>
                    </div>

                    {/* Navigation Links */}
                    <div className="p-2 space-y-0.5 text-xs">
                      <Link
                        to="/dashboard/profile"
                        onClick={() => setIsUserMenuOpen(false)}
                        className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-200 hover:text-white hover:bg-white/10 transition-colors font-medium"
                      >
                        <User size={15} className="text-emerald-400" />
                        <span>Profil &amp; Pengaturan Akun</span>
                      </Link>

                      <Link
                        to="/dashboard/my-orders"
                        onClick={() => setIsUserMenuOpen(false)}
                        className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-200 hover:text-white hover:bg-white/10 transition-colors font-medium"
                      >
                        <Package size={15} className="text-emerald-400" />
                        <span>Pesanan Saya &amp; Lacak Resi</span>
                      </Link>

                      <Link
                        to="/dashboard/favorites"
                        onClick={() => setIsUserMenuOpen(false)}
                        className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-200 hover:text-white hover:bg-white/10 transition-colors font-medium"
                      >
                        <Bookmark size={15} className="text-emerald-400" />
                        <span>Koleksi Jersey Tersimpan</span>
                      </Link>

                      <Link
                        to="/dashboard/cart"
                        onClick={() => setIsUserMenuOpen(false)}
                        className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-200 hover:text-white hover:bg-white/10 transition-colors font-medium"
                      >
                        <ShoppingBag size={15} className="text-emerald-400" />
                        <span>Keranjang Belanja</span>
                      </Link>

                      {user.role === "admin" && (
                        <Link
                          to="/admin"
                          onClick={() => setIsUserMenuOpen(false)}
                          className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-amber-300 hover:bg-amber-500/20 transition-colors font-bold"
                        >
                          <ShieldCheck size={15} className="text-amber-400" />
                          <span>Panel Administrator</span>
                        </Link>
                      )}

                      {user.role === "logistics" && (
                        <Link
                          to="/admin/warehouse"
                          onClick={() => setIsUserMenuOpen(false)}
                          className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-purple-300 hover:bg-purple-500/20 transition-colors font-bold"
                        >
                          <Truck size={15} className="text-purple-400" />
                          <span>Panel Gudang &amp; Ekspedisi</span>
                        </Link>
                      )}
                    </div>

                    {/* Logout Button */}
                    <div className="p-2">
                      <button
                        type="button"
                        onClick={async () => {
                          setIsUserMenuOpen(false);
                          if (!(await logout())) return;
                          toast.success("Berhasil keluar akun.");
                          navigate("/");
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-red-400 hover:text-red-300 hover:bg-red-500/15 transition-colors font-bold text-xs cursor-pointer"
                      >
                        <LogOut size={15} />
                        <span>Keluar Akun (Logout)</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-1.5 sm:gap-2">
                <Link
                  to="/login"
                  className="py-2 px-3 sm:px-4 rounded-full text-xs font-bold uppercase tracking-wider text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
                >
                  MASUK
                </Link>
                <Link
                  to="/register"
                  className="hidden sm:inline-block py-2 px-3 sm:px-4 rounded-full bg-emerald-500 hover:bg-emerald-400 text-[#0F1712] font-black text-xs uppercase tracking-wider transition-all shadow-md shadow-emerald-500/20"
                >
                  DAFTAR TIM
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* 3. SPLIT HERO SECTION (DARK TACTICAL OLIVE + TOPOGRAPHY TEXTURE) */}
      <section className="relative bg-[#18221B] text-white overflow-hidden border-b border-white/10">
        {/* Topographic Contour Texture Overlay */}
        <div className="absolute inset-0 bg-topography opacity-20 pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-20 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
            {/* Left Editorial Text */}
            <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
              <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-white/10 border border-white/15 text-xs font-mono uppercase tracking-wider text-slate-200">
                <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 font-mono text-[10px] font-black tracking-widest border border-emerald-500/40">
                  RS // 2026
                </span>
                <span className="text-emerald-300 font-bold">KOLEKSI ATLETIK • ATELIER CICENDO BANDUNG</span>
              </div>

              <h1 className="font-condensed text-5xl sm:text-6xl lg:text-7xl font-black uppercase tracking-tight text-white leading-[0.95]">
                PERFORMA TANPA BATAS. <br />
                <span className="text-[#FAF8F4] opacity-90">
                  DIBUAT UNTUK JUARA.
                </span>
              </h1>

              <p className="text-sm sm:text-base text-slate-300 max-w-xl mx-auto lg:mx-0 leading-relaxed font-normal">
                Pusat apparel & jersey olahraga custom berstandar profesional.
                Dibuat langsung di atelier PT RegarStore Indonesia (Cicendo, Kota Bandung) dengan
                bahan Dry-Fit Microfiber berpori aktif, sublimasi permanen anti-luntur,
                dan komitmen garansi tukar ukuran 100%.
              </p>

              {/* Action Buttons (Pill CTAs) */}
              <div className="pt-2 flex flex-wrap items-center justify-center lg:justify-start gap-4">
                <button
                  type="button"
                  onClick={() => {
                    const el = document.getElementById("produk");
                    if (el) {
                      el.scrollIntoView({ behavior: "smooth" });
                    }
                  }}
                  className="flex items-center gap-2.5 px-8 py-4 rounded-full bg-[#FAF8F4] hover:bg-white text-[#111613] font-black text-xs uppercase tracking-wider transition-all hover:scale-105 shadow-xl cursor-pointer"
                >
                  <span>JELAJAHI KOLEKSI JERSEY</span>
                  <ArrowRight size={16} />
                </button>

                <button
                  type="button"
                  onClick={handleCustomWhatsApp}
                  className="flex items-center gap-2 px-7 py-4 rounded-full bg-white/5 hover:bg-white/10 border border-white/20 text-white font-bold text-xs uppercase tracking-wider transition-all hover:scale-105 cursor-pointer"
                  title="Konsultasi pembuatan custom jersey tim via WhatsApp Official"
                >
                  <Phone size={15} className="text-emerald-400" />
                  <span>KONSULTASI DESAIN (WHATSAPP)</span>
                </button>
              </div>

              {/* 3 Metric Counters */}
              <div className="pt-8 border-t border-white/10 grid grid-cols-3 gap-6 text-left">
                <div>
                  <div className="font-condensed text-3xl sm:text-4xl font-extrabold text-white">
                    10.000+
                  </div>
                  <div className="text-[11px] text-slate-400 uppercase font-semibold mt-0.5">
                    Tim Juara
                  </div>
                </div>
                <div>
                  <div className="font-condensed text-3xl sm:text-4xl font-extrabold text-emerald-400">
                    100%
                  </div>
                  <div className="text-[11px] text-slate-400 uppercase font-semibold mt-0.5">
                    Garansi Resmi
                  </div>
                </div>
                <div>
                  <div className="font-condensed text-3xl sm:text-4xl font-extrabold text-white">
                    4.9 / 5.0
                  </div>
                  <div className="text-[11px] text-slate-400 uppercase font-semibold mt-0.5">
                    Rating Atlet
                  </div>
                </div>
              </div>
            </div>

            {/* Right Athlete Showcase Card */}
            <div className="lg:col-span-5 relative">
              <div className="relative mx-auto max-w-md rounded-3xl overflow-hidden bg-black/40 border border-white/15 shadow-2xl group">
                <div className="relative aspect-4/5 overflow-hidden">
                  <img
                    src="/images/hero-athlete.jpg"
                    alt="RegarStore Pro Athlete"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#162018] via-transparent to-black/30" />

                  {/* Floating Crest Badge */}
                  <div className="absolute top-4 left-4 flex items-center gap-2 bg-black/70 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/15 text-[11px] font-bold text-white uppercase tracking-wider">
                    <Award size={14} className="text-[#B9382B]" />
                    <span>REGARSTORE PRO ELITE SERIES</span>
                  </div>

                  {/* Bottom Card Information */}
                  <div className="absolute bottom-5 left-5 right-5 space-y-2">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-400">
                      OFFICIAL DRY-FIT MICROFIBER
                    </span>
                    <h3 className="font-condensed text-2xl font-bold uppercase text-white leading-tight">
                      JERSEY SUBLIMASI PREMIER ANTI-LUNTUR
                    </h3>
                    <div className="flex items-center justify-between pt-2 border-t border-white/15">
                      <div>
                        <div className="text-[10px] text-slate-400 uppercase">Mulai Dari</div>
                        <div className="font-condensed text-xl font-bold text-white">
                          Rp 175.000
                        </div>
                      </div>
                      <Link
                        to="/dashboard"
                        className="px-5 py-2 rounded-full bg-[#FAF8F4] hover:bg-white text-[#111613] font-black text-xs uppercase tracking-wider transition-all hover:scale-105"
                      >
                        Pesan Sekarang
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. VISUAL CATEGORY SHOWCASE (CAROUSEL / GRID WITH CIRCULAR ARROWS) */}
      <section id="kategori" className="py-16 sm:py-24 bg-[#F3EFE7]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-10 gap-4">
            <div>
              <span className="text-xs font-extrabold uppercase tracking-widest text-emerald-800">
                PILIHAN KATEGORI OLAHRAGA
              </span>
              <h2 className="font-condensed text-3xl sm:text-4xl lg:text-5xl font-extrabold uppercase tracking-tight text-[#111613] mt-1">
                DIRANCANG UNTUK SETIAP CABANG
              </h2>
            </div>
            <Link
              to="/dashboard"
              className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-700 hover:text-black hover:underline"
            >
              <span>LIHAT SEMUA KATEGORI</span>
              <ArrowRight size={14} />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              {
                id: 1,
                name: "SEPAKBOLA & FUTSAL",
                image: "/images/cat-football.jpg",
                tag: "TERLARIS",
                subtitle: "Dry-Fit Microfiber • Anti-UV",
              },
              {
                id: 2,
                name: "BOLA VOLI PRO",
                image: "/images/cat-volleyball.jpg",
                tag: "PRO LIGA",
                subtitle: "Kerah V-Neck • Elastis Tinggi",
              },
              {
                id: 3,
                name: "BADMINTON ELITE",
                image: "/images/cat-badminton.jpg",
                tag: "RINGAN",
                subtitle: "Ventilasi Aktif • Cepat Kering",
              },
              {
                id: 4,
                name: "KOMUNITAS & ESPORTS",
                image: "/images/cat-esports.jpg",
                tag: "CUSTOM",
                subtitle: "Full-Print Sublimasi Tanpa Batas",
              },
            ].map((cat) => (
              <Link
                key={cat.id}
                to={`/dashboard?categoryId=${cat.id}`}
                className="group relative aspect-4/5 rounded-3xl overflow-hidden bg-black/5 shadow-md border border-black/5 flex flex-col justify-between p-5 transition-all duration-500 hover:-translate-y-1.5 hover:shadow-2xl cursor-pointer"
              >
                <img
                  src={cat.image}
                  alt={cat.name}
                  className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-black/10" />

                {/* Top Badge */}
                <div className="relative z-10 flex items-center justify-between">
                  <span className="bg-[#B9382B] text-white text-[9px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full shadow">
                    {cat.tag}
                  </span>
                </div>

                {/* Bottom Title & Circular Arrow Button */}
                <div className="relative z-10 flex items-end justify-between gap-3">
                  <div>
                    <h3 className="font-condensed text-2xl font-bold uppercase text-white leading-tight">
                      {cat.name}
                    </h3>
                    <p className="text-[11px] text-slate-300 mt-0.5">
                      {cat.subtitle}
                    </p>
                  </div>

                  {/* Circular Arrow Button (Brigade Overland signature) */}
                  <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white shrink-0 group-hover:bg-white group-hover:text-black transition-all shadow">
                    <ArrowRight size={18} />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* 5. KOLEKSI UNGGULAN & MULTI-BADGE PRODUCTS GRID */}
      <section id="produk" className="py-16 sm:py-24 bg-[#FAF8F4] border-t border-black/5 scroll-mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
            <div>
              <span className="text-xs font-extrabold uppercase tracking-widest text-emerald-800">
                KATALOG UNGGULAN
              </span>
              <h2 className="font-condensed text-3xl sm:text-4xl lg:text-5xl font-extrabold uppercase tracking-tight text-[#111613] mt-1">
                REKOMENDASI ATLET PEKAN INI
              </h2>
            </div>

            {/* Category Filter Pills (Brigade Overland Pill Style) */}
            <div className="flex flex-wrap gap-2">
              {[
                { label: "SEMUA", value: "ALL" },
                { label: "SEPAKBOLA", value: "SEPAKBOLA" },
                { label: "BOLA VOLI", value: "VOLI" },
                { label: "BADMINTON", value: "BADMINTON" },
                { label: "ESPORTS & KOMUNITAS", value: "ESPORT" },
                { label: "BASKET", value: "BASKET" },
              ].map((pill) => (
                <button
                  key={pill.value}
                  onClick={() => setSelectedCategory(pill.value)}
                  className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                    selectedCategory === pill.value
                      ? "bg-[#111613] text-white shadow-md scale-105"
                      : "bg-white hover:bg-slate-200 text-slate-700 border border-black/10"
                  }`}
                >
                  {pill.label}
                </button>
              ))}
            </div>
          </div>

          {/* Product Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {loading ? (
              <div className="col-span-4 text-center py-16 text-slate-500 text-sm">
                Sedang memuat katalog jersey dari atelier Cicendo Bandung...
              </div>
            ) : filteredProducts.length > 0 ? (
              filteredProducts.slice(0, 8).map((prod) => {
                const discountPercent = 15;
                const originalPrice = Math.round(Number(prod.price || 185000) * 1.18);

                return (
                  <div
                    key={prod.id}
                    className="group rounded-3xl bg-white border border-black/5 overflow-hidden flex flex-col hover:shadow-2xl transition-all duration-300 hover:-translate-y-1"
                  >
                    {/* Image & Multi-Badge Container */}
                    <div className="relative aspect-square overflow-hidden bg-slate-100">
                      <Link to={`/dashboard/product/${prod.id}`} className="block w-full h-full">
                        <img
                          src={
                            prod.imageUrl ||
                            prod.image_url ||
                            "/images/hero-athlete.jpg"
                          }
                          alt={prod.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          onError={(e) => {
                            e.currentTarget.onerror = null;
                            e.currentTarget.src = "/images/hero-athlete.jpg";
                          }}
                        />
                      </Link>

                      {/* Side-by-Side Multi-Badges (Brigade Overland Style) */}
                      <div className="absolute top-3 left-3 flex flex-wrap gap-1.5 z-10 pointer-events-none">
                        <span className="bg-white/95 backdrop-blur-sm text-black text-[10px] font-black uppercase px-2.5 py-1 rounded-full shadow-sm">
                          DISKON {discountPercent}%
                        </span>
                        <span className="bg-[#FAF0ED] text-[#B9382B] border border-[#B9382B]/20 text-[10px] font-extrabold uppercase px-2 py-1 rounded-full">
                          GARANSI 100%
                        </span>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-5 flex-1 flex flex-col justify-between space-y-3">
                      <div>
                        <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          {prod.categoryName || prod.category?.name || "RegarStore Apparel"}
                        </div>
                        <Link to={`/dashboard/product/${prod.id}`}>
                          <h4 className="font-condensed text-lg font-bold text-slate-900 line-clamp-1 group-hover:text-emerald-800 transition-colors mt-0.5">
                            {prod.name}
                          </h4>
                        </Link>
                      </div>

                      <div className="pt-2 border-t border-black/5 flex items-center justify-between">
                        <div>
                          <div className="text-[11px] text-slate-400 line-through">
                            Rp {originalPrice.toLocaleString("id-ID")}
                          </div>
                          <div className="font-condensed text-xl font-black text-[#111613]">
                            Rp {Number(prod.price || 0).toLocaleString("id-ID")}
                          </div>
                        </div>

                        {/* Add to Cart Quick Pill Button */}
                        <button
                          onClick={async () => {
                            if (!user) {
                              toast.error("Silakan login terlebih dahulu untuk memesan jersey ini!");
                              navigate("/login");
                              return;
                            }
                            await addToCart(prod, 1, "L");
                            setIsCartOpen(true);
                          }}
                          className="flex items-center gap-1 px-4 py-2 rounded-full bg-[#111613] hover:bg-black text-white font-bold text-xs uppercase tracking-wider transition-all hover:scale-105 cursor-pointer shadow"
                          title="Pesan Jersey"
                        >
                          <ShoppingCart size={13} />
                          <span>BELI</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="col-span-4 text-center py-16 text-slate-500 text-sm">
                Tidak ada produk dalam kategori ini saat ini.
              </div>
            )}
          </div>

          <div className="mt-12 text-center">
            <Link
              to="/dashboard"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-[#111613] hover:bg-black text-white font-extrabold text-xs uppercase tracking-wider transition-all hover:scale-105 shadow-xl"
            >
              <span>LIHAT SELURUH READY STOCK ({products.length} PRODUK)</span>
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      {/* 6. EDITORIAL STORY BANNER ("DIPRODUKSI SENDIRI & TERUJI DI LAPANGAN") */}
      <section id="atelier" className="py-20 bg-[#18221B] text-white relative overflow-hidden border-y border-white/10 scroll-mt-20">
        {/* Topographic Background Texture */}
        <div className="absolute inset-0 bg-topography opacity-15 pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
            {/* Left Factory Craftsmanship Photo */}
            <div className="lg:col-span-6">
              <div className="relative rounded-3xl overflow-hidden shadow-2xl border border-white/15 aspect-16/10">
                <img
                  src="/images/story-factory.jpg"
                  alt="Atelier RegarStore Cicendo Bandung"
                  className="w-full h-full object-cover"
                />
                <div className="absolute bottom-4 left-4 bg-black/70 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-white/15 text-[10px] font-bold text-white uppercase tracking-wider">
                  CICENDO APPAREL STUDIO • KOTA BANDUNG
                </div>
              </div>
            </div>

            {/* Right Editorial Story Copy */}
            <div className="lg:col-span-6 space-y-5">
              <span className="text-xs font-extrabold uppercase tracking-widest text-emerald-400">
                FILOSOFI & DEDIKASI KAMI
              </span>

              <h2 className="font-condensed text-3xl sm:text-4xl lg:text-5xl font-black uppercase tracking-tight text-white leading-tight">
                DIPRODUKSI SENDIRI & <br />
                TERUJI DI SETIAP LAPANGAN.
              </h2>

              <p className="text-sm text-slate-300 leading-relaxed">
                Di RegarStore, kami tidak sekadar menjual jersey. Kami mengoperasikan
                fasilitas manufaktur & atelier tekstil terpadu di Cicendo, Kota Bandung. Mulai
                dari riset kain Dry-Fit berpori aktif, pencetakan tinta sublimasi
                standar OEKO-TEX ramah lingkungan, hingga penjahitan presisi tinggi
                yang dirancang untuk tahan bergesekan dalam kompetisi terberat.
              </p>

              <p className="text-sm text-slate-300 leading-relaxed">
                Itulah alasan kami berani memberikan <b>100% Garansi Tukar Ukuran</b>.
                Jika ukuran jersey tim Anda tidak pas saat sampai di tangan, kami
                perbaiki atau ganti baru secara cuma-cuma.
              </p>

              <div className="pt-2">
                <Link
                  to="/dashboard/about"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-full border border-white/30 hover:border-white bg-white/5 hover:bg-white/15 text-white font-bold text-xs uppercase tracking-wider transition-all hover:scale-105"
                >
                  <span>BACA PROFIL ATELIER BANDUNG</span>
                  <ArrowRight size={15} />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 7. 4 PILAR KEUNGGULAN BRAND */}
      <section id="keunggulan" className="py-16 sm:py-20 bg-[#F3EFE7] border-b border-black/5 scroll-mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-xs font-extrabold uppercase tracking-widest text-emerald-800">
              STANDAR MUTU UTAMA
            </span>
            <h2 className="font-condensed text-3xl sm:text-4xl font-extrabold uppercase tracking-tight text-[#111613] mt-1">
              MENGAPA 10.000+ TIM MEMILIH REGARSTORE?
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              {
                icon: ShieldCheck,
                title: "100% GARANSI TUKAR UKURAN",
                desc: "Klaim garansi tanpa ribet dalam 7 hari. Salah ukuran atau jahitan cacat langsung diproses tim admin & gudang kami.",
              },
              {
                icon: Award,
                title: "SUBLIMASI WARNA PERMANEN",
                desc: "Tinta bersertifikat OEKO-TEX standar Eropa. Warna tidak akan pudar atau mengelupas meski dicuci ratusan kali.",
              },
              {
                icon: Layers,
                title: "DRY-FIT PORI SIRKULASI AKTIF",
                desc: "Bahan microfiber dengan sirkulasi mikroaktif menyerap keringat seketika, ringan, dan sejuk di lapangan.",
              },
              {
                icon: Truck,
                title: "TRANSAKSI & RESI OTOMATIS",
                desc: "Pembayaran terverifikasi otomatis via Midtrans serta pelacakan resi ekspedisi real-time hingga pesanan tiba.",
              },
            ].map((pilar, idx) => (
              <div
                key={idx}
                className="p-6 rounded-3xl bg-white border border-black/5 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group"
              >
                <div className="w-12 h-12 rounded-2xl bg-[#18221B] text-emerald-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <pilar.icon size={22} />
                </div>
                <h3 className="font-condensed text-lg font-bold uppercase text-[#111613] mb-2">
                  {pilar.title}
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {pilar.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 8. TESTIMONI ATLET & KAPTEN TIM */}
      <section id="testimoni" className="py-20 bg-[#FAF8F4] scroll-mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <span className="text-xs font-extrabold uppercase tracking-widest text-emerald-800">
              BUKTI KEPUASAN TIM
            </span>
            <h2 className="font-condensed text-3xl sm:text-4xl font-extrabold uppercase tracking-tight text-[#111613] mt-1">
              DIPERCAYA OLEH KAPTEEN TIM SE-INDONESIA
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                quote:
                  "Jersey tim kami sudah dipakai lebih dari 30 pertandingan regional. Warna sublimasi dan sablon nomor punggung tetap tajam tanpa retak. Bahan sangat adem!",
                name: "Rian Saputra",
                role: "Kapten Bandung Juara FC",
                team: "Turnamen Liga 3 Regional",
              },
              {
                quote:
                  "Order 45 pcs untuk running komunitas kami. Garansi ukuran benar-benar ditepati, saat ada 2 jersey anggota kekecilan langsung diganti baru dalam 3 hari!",
                name: "Dian Permana",
                role: "Koordinator Bandung Runners",
                team: "Marathon Community",
              },
              {
                quote:
                  "Proses checkout Midtrans cepat, invoice PDF langsung terunduh resmi untuk klaim sponsor, dan resi J&T terverifikasi otomatis. Mantap sekali!",
                name: "Fikri Maulana",
                role: "Manajer Rajawali Futsal Solo",
                team: "Futsal Championship",
              },
            ].map((testi, idx) => (
              <div
                key={idx}
                className="p-7 rounded-3xl bg-white border border-black/5 shadow-sm flex flex-col justify-between space-y-4 hover:shadow-xl transition-all"
              >
                <div className="space-y-3">
                  <div className="flex items-center gap-1 text-amber-500">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} size={15} fill="currentColor" />
                    ))}
                  </div>
                  <p className="text-xs text-slate-700 leading-relaxed italic">
                    &quot;{testi.quote}&quot;
                  </p>
                </div>
                <div className="pt-4 border-t border-black/5">
                  <div className="font-condensed text-base font-bold uppercase text-[#111613]">
                    {testi.name}
                  </div>
                  <div className="text-[11px] text-emerald-800 font-semibold">
                    {testi.role}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 9. TACTICAL DARK FOOTER (TOPOGRAPHIC THEME) */}
      <footer className="bg-[#121A14] text-white pt-16 pb-12 border-t border-white/10 relative overflow-hidden">
        {/* Topographic Texture */}
        <div className="absolute inset-0 bg-topography opacity-15 pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 space-y-12">
          {/* Newsletter Section with Embedded Pill Input & Instant Coupon Claim */}
          {couponClaimed ? (
            <div className="p-8 sm:p-10 rounded-3xl bg-linear-to-r from-[#18221B] via-[#1F2F23] to-[#18221B] border border-emerald-500/40 flex flex-col lg:flex-row items-center justify-between gap-6 shadow-2xl relative overflow-hidden">
              <div className="space-y-1.5 text-center lg:text-left z-10">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-black uppercase tracking-wider">
                  <Tag size={12} />
                  <span>KUPON AKTIF ANDA</span>
                </div>
                <h3 className="font-condensed text-2xl sm:text-3xl font-bold uppercase tracking-tight text-white">
                  KUPON DISKON 15% TIM SIAP DIGUNAKAN
                </h3>
                <p className="text-xs text-slate-300 max-w-lg">
                  Gunakan kode kupon di bawah ini saat memesan jersey di katalog untuk potongan harga 15% + bebas biaya sablon nama & nomor punggung tim.
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-center lg:justify-end gap-3 z-10 w-full lg:w-auto">
                <div className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-black/60 border border-emerald-400/50 text-white font-mono text-sm tracking-widest font-bold">
                  <Tag size={15} className="text-emerald-400" />
                  <span>REGARJUARA</span>
                </div>
                <button
                  type="button"
                  onClick={handleCopyCoupon}
                  className="px-5 py-2.5 rounded-full bg-emerald-500 hover:bg-emerald-400 text-[#0F1712] font-black text-xs uppercase tracking-wider flex items-center gap-1.5 transition-transform hover:scale-105 cursor-pointer shadow-lg shadow-emerald-500/20"
                >
                  {couponCopied ? <Check size={14} /> : <Copy size={14} />}
                  <span>{couponCopied ? "TERSALIN!" : "SALIN KODE"}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowCouponModal(true)}
                  className="px-4 py-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer border border-white/15"
                >
                  Rincian
                </button>
                <Link
                  to="/dashboard"
                  className="px-5 py-2.5 rounded-full bg-[#FAF8F4] hover:bg-white text-[#111613] font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 transition-transform hover:scale-105 shadow"
                >
                  <span>Buka Toko</span>
                  <ArrowRight size={14} />
                </Link>
              </div>
            </div>
          ) : (
            <div className="p-8 sm:p-10 rounded-3xl bg-[#18221B] border border-white/10 flex flex-col lg:flex-row items-center justify-between gap-6 shadow-2xl">
              <div className="space-y-1 text-center lg:text-left">
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-400">
                  KUPON EKSKLUSIF & RILIS SERI BARU
                </span>
                <h3 className="font-condensed text-2xl sm:text-3xl font-bold uppercase tracking-tight text-white">
                  GABUNG DENGAN KOMUNITAS ATLET REGARSTORE
                </h3>
                <p className="text-xs text-slate-400 max-w-lg">
                  Daftarkan email kapten atau manajer tim Anda untuk langsung mengklaim kupon diskon 15% serta info rilis jersey terbaru.
                </p>
              </div>

              <form
                onSubmit={handleNewsletterSubmit}
                className="w-full lg:w-auto flex-1 max-w-md flex items-center bg-white/10 rounded-full p-1.5 border border-white/15 focus-within:border-emerald-400 transition-colors"
              >
                <input
                  type="email"
                  required
                  value={newsletterEmail}
                  onChange={(e) => setNewsletterEmail(e.target.value)}
                  placeholder="Masukkan email kapten / manajer..."
                  className="w-full bg-transparent px-4 py-2 text-xs text-white placeholder:text-slate-400 focus:outline-none"
                />
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-full bg-[#FAF8F4] hover:bg-white text-[#111613] font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 shrink-0 transition-transform hover:scale-105 cursor-pointer shadow"
                >
                  <span>KLAIM 15%</span>
                  <ArrowRight size={14} />
                </button>
              </form>
            </div>
          )}

          {/* 4 Multi-Column Links */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 text-xs text-slate-400">
            {/* Brand & Atelier Info Column */}
            <div className="space-y-3.5">
              <div className="flex items-center gap-2.5">
                <RegarStoreLogo size={32} />
                <span className="font-condensed text-xl font-bold uppercase tracking-wider text-white">
                  PT REGARSTORE INDONESIA
                </span>
              </div>
              <p className="text-[11px] leading-relaxed text-slate-300">
                Pusat manufaktur apparel dan jersey olahraga profesional berteknologi digital sublimasi modern terintegrasi di Cicendo, Kota Bandung.
              </p>
              <div className="space-y-1 text-[10px] text-slate-400 font-mono">
                <div className="flex items-center gap-1.5 text-slate-300">
                  <Building2 size={12} className="text-emerald-400 shrink-0" />
                  <span>Jl. Cicendo No. 18, Pasir Kaliki, Bandung 40171</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Clock size={12} className="text-emerald-400 shrink-0" />
                  <span>Senin – Sabtu: 08.00 – 21.00 WIB</span>
                </div>
                <div>NPWP: 01.345.678.9-521.000</div>
              </div>

              {/* Social Media Channels */}
              <div className="pt-1 flex items-center gap-2">
                <a
                  href="https://instagram.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-2.5 py-1 rounded-full bg-white/5 hover:bg-white/15 text-slate-300 hover:text-white border border-white/10 text-[10px] font-bold uppercase tracking-wider transition-colors"
                >
                  Instagram
                </a>
                <a
                  href="https://tiktok.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-2.5 py-1 rounded-full bg-white/5 hover:bg-white/15 text-slate-300 hover:text-white border border-white/10 text-[10px] font-bold uppercase tracking-wider transition-colors"
                >
                  TikTok
                </a>
                <a
                  href="https://wa.me/6281234567890"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-2.5 py-1 rounded-full bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 hover:text-white border border-emerald-500/30 text-[10px] font-bold uppercase tracking-wider transition-colors"
                >
                  WhatsApp
                </a>
              </div>
            </div>

            {/* Column 2: Katalog Olahraga */}
            <div>
              <h5 className="font-condensed text-sm font-bold uppercase tracking-wider text-white mb-3 flex items-center gap-2">
                <span>KATALOG OLAHRAGA</span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              </h5>
              <ul className="space-y-2.5 text-[11px]">
                <li>
                  <Link to="/dashboard?categoryId=1" className="hover:text-emerald-300 transition-colors flex items-center justify-between group">
                    <span>Jersey Sepakbola &amp; Futsal</span>
                    <span className="text-[10px] text-slate-500 group-hover:text-emerald-400 font-mono">10+</span>
                  </Link>
                </li>
                <li>
                  <Link to="/dashboard?categoryId=2" className="hover:text-emerald-300 transition-colors flex items-center justify-between group">
                    <span>Jersey Bola Voli Pro Liga</span>
                    <span className="text-[10px] text-slate-500 group-hover:text-emerald-400 font-mono">10+</span>
                  </Link>
                </li>
                <li>
                  <Link to="/dashboard?categoryId=3" className="hover:text-emerald-300 transition-colors flex items-center justify-between group">
                    <span>Jersey Badminton Elite</span>
                    <span className="text-[10px] text-slate-500 group-hover:text-emerald-400 font-mono">10+</span>
                  </Link>
                </li>
                <li>
                  <Link to="/dashboard?categoryId=4" className="hover:text-emerald-300 transition-colors flex items-center justify-between group">
                    <span>Custom Jersey Komunitas &amp; Esport</span>
                    <span className="text-[10px] text-slate-500 group-hover:text-emerald-400 font-mono">10+</span>
                  </Link>
                </li>
                <li>
                  <Link to="/dashboard?categoryId=5" className="hover:text-emerald-300 transition-colors flex items-center justify-between group">
                    <span>Jersey Basket &amp; Streetball</span>
                    <span className="text-[10px] text-slate-500 group-hover:text-emerald-400 font-mono">10+</span>
                  </Link>
                </li>
                <li className="pt-1">
                  <Link to="/dashboard" className="text-emerald-400 font-bold hover:underline flex items-center gap-1">
                    <span>Buka Katalog Lengkap (50+ Produk)</span>
                    <ArrowRight size={12} />
                  </Link>
                </li>
              </ul>
            </div>

            {/* Column 3: Garansi & Layanan Pelanggan */}
            <div>
              <h5 className="font-condensed text-sm font-bold uppercase tracking-wider text-white mb-3 flex items-center gap-2">
                <span>GARANSI &amp; LAYANAN</span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              </h5>
              <ul className="space-y-2.5 text-[11px]">
                <li>
                  <button
                    type="button"
                    onClick={() => setShowWarrantyModal(true)}
                    className="hover:text-emerald-300 transition-colors text-left flex items-center gap-1.5 cursor-pointer"
                  >
                    <ShieldCheck size={13} className="text-emerald-400" />
                    <span>Ketentuan Garansi Tukar Ukuran 100%</span>
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => setShowSizeModal(true)}
                    className="hover:text-emerald-300 transition-colors text-left flex items-center gap-1.5 cursor-pointer"
                  >
                    <Ruler size={13} className="text-emerald-400" />
                    <span>Panduan Ukuran (Size Chart S - 3XL)</span>
                  </button>
                </li>
                <li>
                  <Link to="/dashboard/cart" className="hover:text-emerald-300 transition-colors block">
                    Status Keranjang Belanja
                  </Link>
                </li>
                <li>
                  <Link to="/dashboard/my-orders" className="hover:text-emerald-300 transition-colors block">
                    Lacak Pesanan &amp; Status Resi
                  </Link>
                </li>
                <li>
                  <Link to="/dashboard/about" className="hover:text-emerald-300 transition-colors block">
                    Profil Atelier Cicendo Bandung
                  </Link>
                </li>
                <li>
                  <a
                    href="https://wa.me/6281234567890?text=Halo%20RegarStore,%20saya%20ingin%20konsultasi%20layanan%20dan%20garansi"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-emerald-400 font-semibold hover:underline flex items-center gap-1"
                  >
                    <Phone size={12} />
                    <span>Konsultasi WhatsApp Customer Care</span>
                  </a>
                </li>
              </ul>
            </div>

            {/* Column 4: Keamanan, Pembayaran & Ekspedisi */}
            <div className="space-y-3.5">
              <h5 className="font-condensed text-sm font-bold uppercase tracking-wider text-white flex items-center gap-2">
                <span>PEMBAYARAN &amp; EKSPEDISI</span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              </h5>
              <p className="text-[11px] leading-relaxed text-slate-300">
                Didukung gerbang pembayaran otomatis Midtrans dan kurir express resmi dengan nomor resi terverifikasi ke seluruh Indonesia.
              </p>

              {/* Payment Methods Pills */}
              <div>
                <div className="text-[10px] uppercase font-bold text-slate-400 mb-1.5">Metode Pembayaran</div>
                <div className="flex flex-wrap gap-1.5 text-[9px] font-black uppercase text-slate-200">
                  <span className="px-2 py-0.5 rounded bg-white/10 border border-white/15">QRIS</span>
                  <span className="px-2 py-0.5 rounded bg-white/10 border border-white/15">BCA</span>
                  <span className="px-2 py-0.5 rounded bg-white/10 border border-white/15">MANDIRI</span>
                  <span className="px-2 py-0.5 rounded bg-white/10 border border-white/15">BRI</span>
                  <span className="px-2 py-0.5 rounded bg-white/10 border border-white/15">GOPAY</span>
                </div>
              </div>

              {/* Courier Partners Pills */}
              <div>
                <div className="text-[10px] uppercase font-bold text-slate-400 mb-1.5">Kurir Pengiriman</div>
                <div className="flex flex-wrap gap-1.5 text-[9px] font-black uppercase text-slate-200">
                  <span className="px-2 py-0.5 rounded bg-white/10 border border-white/15">J&amp;T Express</span>
                  <span className="px-2 py-0.5 rounded bg-white/10 border border-white/15">JNE</span>
                  <span className="px-2 py-0.5 rounded bg-white/10 border border-white/15">SiCepat</span>
                </div>
              </div>

              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-[10px] font-semibold text-emerald-300">
                <CheckCircle2 size={13} className="text-emerald-400 shrink-0" />
                <span>Verified SSL 256-bit Secure Checkout</span>
              </div>
            </div>
          </div>

          {/* Copyright Bar */}
          <div className="pt-8 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-500 gap-3">
            <div>
              © {new Date().getFullYear()} PT RegarStore Indonesia. Hak Cipta Dilindungi Undang-Undang.
            </div>
            <div className="flex flex-wrap items-center gap-4">
              <Link to="/dashboard/about" className="hover:text-white transition-colors">Tentang Perusahaan</Link>
              <span>•</span>
              <button
                type="button"
                onClick={() => setShowWarrantyModal(true)}
                className="hover:text-white transition-colors cursor-pointer"
              >
                Kebijakan Retur &amp; Garansi
              </button>
              <span>•</span>
              <button
                type="button"
                onClick={() => setShowSizeModal(true)}
                className="hover:text-white transition-colors cursor-pointer"
              >
                Panduan Ukuran
              </button>
              <span>•</span>
              <span className="text-slate-400 font-medium">Cicendo, Kota Bandung • Indonesia</span>
            </div>
          </div>
        </div>
      </footer>

      {/* ------------------------------------------------------------- */}
      {/* INTERACTIVE MODALS */}
      {/* ------------------------------------------------------------- */}

      {/* 1. Modal Kupon Eksklusif REGARJUARA */}
      {showCouponModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/75 backdrop-blur-sm animate-fade-in" onClick={() => setShowCouponModal(false)} />
          <div className="relative z-10 w-full max-w-md bg-[#162018] border border-emerald-500/40 rounded-3xl p-6 sm:p-8 text-white shadow-2xl animate-scale-up space-y-5">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-2">
                <Tag size={14} className="text-emerald-400 shrink-0" />
                <span className="font-condensed text-lg font-bold tracking-wider uppercase text-emerald-300">
                  VOUCHER EKSKLUSIF REGARSTORE
                </span>
              </div>
              <button
                type="button"
                onClick={() => setShowCouponModal(false)}
                className="p-1 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="text-center space-y-2">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center">
                <Tag size={28} />
              </div>
              <h4 className="font-condensed text-2xl font-black uppercase text-white">
                DISKON 15% PEMESANAN TIM
              </h4>
              <p className="text-xs text-slate-300 leading-relaxed">
                Kupon ini berlaku untuk seluruh koleksi jersey ready stock &amp; custom di RegarStore Cicendo Bandung. Sudah termasuk gratis kustom nama dan nomor punggung pemain!
              </p>
            </div>

            {/* Voucher Code Box */}
            <div className="p-4 rounded-2xl bg-black/50 border-2 border-dashed border-emerald-500/50 text-center space-y-2">
              <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                Kode Kupon Resmi
              </div>
              <div className="font-mono text-2xl sm:text-3xl font-black tracking-widest text-emerald-300">
                REGARJUARA
              </div>
              <button
                type="button"
                onClick={handleCopyCoupon}
                className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-xs uppercase tracking-wider transition-all cursor-pointer shadow-md"
              >
                {couponCopied ? <Check size={14} /> : <Copy size={14} />}
                <span>{couponCopied ? "Kode Kupon Berhasil Disalin!" : "Salin Kode Kupon"}</span>
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowCouponModal(false)}
                className="py-3 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer"
              >
                Tutup
              </button>
              <Link
                to="/dashboard"
                onClick={() => setShowCouponModal(false)}
                className="py-3 text-center rounded-xl bg-emerald-500 hover:bg-emerald-400 text-[#0F1712] font-black text-xs uppercase tracking-wider transition-all shadow-lg shadow-emerald-500/20"
              >
                Gunakan di Toko →
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* 2. Modal Panduan Ukuran (Size Chart) */}
      {showSizeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/75 backdrop-blur-sm animate-fade-in" onClick={() => setShowSizeModal(false)} />
          <div className="relative z-10 w-full max-w-xl bg-[#162018] border border-white/15 rounded-3xl p-6 sm:p-8 text-white shadow-2xl animate-scale-up space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-2">
                <Ruler size={18} className="text-emerald-400" />
                <span className="font-condensed text-lg font-bold tracking-wider uppercase text-white">
                  PANDUAN UKURAN JERSEY ATLETIK
                </span>
              </div>
              <button
                type="button"
                onClick={() => setShowSizeModal(false)}
                className="p-1 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Standar ukuran jersey RegarStore dirancang pas di badan atlet (Athletic Slim-Fit) dengan bahan Dry-Fit Microfiber berpori aktif yang memiliki kelenturan 4-way stretch.
            </p>

            <div className="overflow-x-auto rounded-2xl border border-white/10 bg-black/40">
              <table className="w-full text-xs text-left">
                <thead className="bg-white/10 text-emerald-400 uppercase font-bold text-[10px] tracking-wider">
                  <tr>
                    <th className="px-3.5 py-3">Ukuran</th>
                    <th className="px-3.5 py-3">Lebar Dada (cm)</th>
                    <th className="px-3.5 py-3">Panjang Badan (cm)</th>
                    <th className="px-3.5 py-3">Rekomendasi BB / TB</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 font-mono text-slate-200">
                  <tr>
                    <td className="px-3.5 py-2.5 font-bold text-white">S</td>
                    <td className="px-3.5 py-2.5">48 cm</td>
                    <td className="px-3.5 py-2.5">68 cm</td>
                    <td className="px-3.5 py-2.5 text-[11px] text-slate-400 font-sans">50–60 kg • 160–168 cm</td>
                  </tr>
                  <tr className="bg-white/5">
                    <td className="px-3.5 py-2.5 font-bold text-white">M</td>
                    <td className="px-3.5 py-2.5">50 cm</td>
                    <td className="px-3.5 py-2.5">70 cm</td>
                    <td className="px-3.5 py-2.5 text-[11px] text-slate-400 font-sans">60–70 kg • 168–175 cm</td>
                  </tr>
                  <tr>
                    <td className="px-3.5 py-2.5 font-bold text-emerald-400">L (Populer)</td>
                    <td className="px-3.5 py-2.5">52 cm</td>
                    <td className="px-3.5 py-2.5">72 cm</td>
                    <td className="px-3.5 py-2.5 text-[11px] text-slate-400 font-sans">70–80 kg • 173–180 cm</td>
                  </tr>
                  <tr className="bg-white/5">
                    <td className="px-3.5 py-2.5 font-bold text-white">XL</td>
                    <td className="px-3.5 py-2.5">54 cm</td>
                    <td className="px-3.5 py-2.5">74 cm</td>
                    <td className="px-3.5 py-2.5 text-[11px] text-slate-400 font-sans">80–90 kg • 178–185 cm</td>
                  </tr>
                  <tr>
                    <td className="px-3.5 py-2.5 font-bold text-white">XXL</td>
                    <td className="px-3.5 py-2.5">56 cm</td>
                    <td className="px-3.5 py-2.5">76 cm</td>
                    <td className="px-3.5 py-2.5 text-[11px] text-slate-400 font-sans">90–100 kg • 182–190 cm</td>
                  </tr>
                  <tr className="bg-white/5">
                    <td className="px-3.5 py-2.5 font-bold text-white">3XL</td>
                    <td className="px-3.5 py-2.5">58 cm</td>
                    <td className="px-3.5 py-2.5">78 cm</td>
                    <td className="px-3.5 py-2.5 text-[11px] text-slate-400 font-sans">100+ kg • 185+ cm</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="p-3.5 rounded-2xl bg-emerald-950/50 border border-emerald-500/30 flex items-start gap-2.5 text-xs text-emerald-200">
              <ShieldCheck size={18} className="text-emerald-400 shrink-0 mt-0.5" />
              <span><b>Jaminan Pas 100%:</b> Jika setelah pesanan sampai ukurannya kurang nyaman, Anda berhak melakukan penukaran ukuran gratis dalam masa garansi 7 hari!</span>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setShowSizeModal(false)}
                className="px-6 py-2.5 rounded-full bg-[#FAF8F4] hover:bg-white text-black font-extrabold text-xs uppercase tracking-wider transition-colors cursor-pointer"
              >
                Mengerti &amp; Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. Modal Ketentuan 100% Garansi Tukar Ukuran */}
      {showWarrantyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/75 backdrop-blur-sm animate-fade-in" onClick={() => setShowWarrantyModal(false)} />
          <div className="relative z-10 w-full max-w-lg bg-[#162018] border border-white/15 rounded-3xl p-6 sm:p-8 text-white shadow-2xl animate-scale-up space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-2">
                <ShieldCheck size={20} className="text-emerald-400" />
                <span className="font-condensed text-lg font-bold tracking-wider uppercase text-white">
                  KEBIJAKAN 100% GARANSI TUKAR UKURAN
                </span>
              </div>
              <button
                type="button"
                onClick={() => setShowWarrantyModal(false)}
                className="p-1 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-300 leading-relaxed">
              <p>
                RegarStore Atelier Cicendo Bandung menjamin setiap kapten tim mendapatkan jersey dengan ukuran yang benar-benar pas untuk bertanding.
              </p>

              <div className="space-y-2.5 pt-1">
                <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 space-y-1">
                  <div className="font-bold text-white flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-[10px]">1</span>
                    <span>Masa Berlaku Klaim 7 Hari</span>
                  </div>
                  <p className="text-[11px] text-slate-400 pl-6.5">
                    Klaim tukar ukuran atau kendala jahitan dapat dilaporkan dalam 7 hari kalender sejak status resi kurir terkonfirmasi diterima.
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 space-y-1">
                  <div className="font-bold text-white flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-[10px]">2</span>
                    <span>Syarat Kondisi Jersey</span>
                  </div>
                  <p className="text-[11px] text-slate-400 pl-6.5">
                    Jersey belum dicuci, tidak terkena noda permanen pemakaian lapangan, dan hangtag produk masih ada.
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 space-y-1">
                  <div className="font-bold text-white flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-[10px]">3</span>
                    <span>Proses Cepat di Atelier Bandung</span>
                  </div>
                  <p className="text-[11px] text-slate-400 pl-6.5">
                    Tim produksi kami di Cicendo akan menyiapkan ukuran pengganti dalam 2-3 hari kerja dan dikirimkan kembali ke alamat tim Anda.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowWarrantyModal(false)}
                className="py-3 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer"
              >
                Tutup
              </button>
              <a
                href="https://wa.me/6281234567890?text=Halo%20Admin%20RegarStore,%20saya%20ingin%20klaim%20garansi%20tukar%20ukuran%20jersey%20tim"
                target="_blank"
                rel="noopener noreferrer"
                className="py-3 text-center rounded-xl bg-emerald-500 hover:bg-emerald-400 text-[#0F1712] font-black text-xs uppercase tracking-wider transition-all shadow-lg shadow-emerald-500/20"
              >
                Hubungi Admin CS →
              </a>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* INTERACTIVE DRAWERS & MODALS */}
      {/* ------------------------------------------------------------- */}
      {/* 1. Left Nav Drawer with Topographic Backdrop */}
      <NavDrawer
        isOpen={isNavOpen}
        onClose={() => setIsNavOpen(false)}
        onOpenSearch={() => setIsSearchOpen(true)}
      />

      {/* 2. Right Cart Slide-Over Drawer */}
      <CartSlideOver
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
      />

      {/* 3. Visual Search Overlay Modal */}
      <QuickSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
      />
    </div>
  );
}
