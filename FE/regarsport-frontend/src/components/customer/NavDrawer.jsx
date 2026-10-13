import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  X,
  ChevronRight,
  ShieldCheck,
  Phone,
  Compass,
  User,
  LogOut,
  Building2,
  Award,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";

export default function NavDrawer({ isOpen, onClose, onOpenSearch }) {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  // Close on ESC key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Prevent background scroll when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const categories = [
    { name: "JERSEY SEPAKBOLA & FUTSAL", tag: "POPULER", categoryId: 1, desc: "Dry-Fit Microfiber" },
    { name: "JERSEY BOLA VOLI (PRO LIGA)", tag: "HOT", categoryId: 2, desc: "V-Neck Elastis Tinggi" },
    { name: "JERSEY BADMINTON & TENIS", tag: "ELITE", categoryId: 3, desc: "Ventilasi Aktif" },
    { name: "CUSTOM TIM & ESPORTS", tag: "CUSTOM", categoryId: 4, desc: "Sublimasi Full-Print" },
    { name: "JERSEY BASKET & STREETBALL", tag: "PRO", categoryId: 5, desc: "Sleeveless Athletic" },
  ];

  const handleScrollTo = (sectionId) => {
    onClose();
    if (window.location.pathname !== "/") {
      navigate(`/#${sectionId}`);
      setTimeout(() => {
        const el = document.getElementById(sectionId);
        if (el) {
          el.scrollIntoView({ behavior: "smooth" });
        }
      }, 250);
    } else {
      setTimeout(() => {
        const el = document.getElementById(sectionId);
        if (el) {
          el.scrollIntoView({ behavior: "smooth" });
        }
      }, 100);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity animate-fade-in"
        onClick={onClose}
      />

      {/* Slide-out Drawer Panel */}
      <div className="relative z-10 w-full max-w-md bg-[#162018] text-white flex flex-col h-full shadow-2xl border-r border-white/10 animate-slide-in-left overflow-hidden">
        {/* Topographic Background Texture */}
        <div className="absolute inset-0 bg-topography opacity-15 pointer-events-none" />

        {/* Header */}
        <div className="relative z-10 p-5 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Compass size={16} className="text-emerald-400 shrink-0" />
            <span className="font-condensed text-xl font-bold tracking-wider uppercase text-slate-100">
              REGARSTORE APPAREL
            </span>
          </div>
          <button
            onClick={onClose}
            className="flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-slate-400 hover:text-white px-2.5 py-1 rounded-full border border-white/10 hover:border-white/30 transition-all cursor-pointer"
          >
            <X size={16} />
            <span>TUTUP</span>
          </button>
        </div>

        {/* Drawer Body */}
        <div className="relative z-10 flex-1 overflow-y-auto px-6 py-6 space-y-6">
          {/* Search Shortcut Bar */}
          <button
            onClick={() => {
              onClose();
              if (onOpenSearch) onOpenSearch();
            }}
            className="w-full py-3 px-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-between text-xs text-slate-400 hover:text-slate-200 transition-all cursor-pointer group"
          >
            <span>Cari jersey, ukuran, bahan...</span>
            <span className="px-2 py-0.5 rounded bg-white/10 text-[10px] font-mono text-slate-300 group-hover:bg-white/20">
              ⌘K
            </span>
          </button>

          {/* Navigation Links */}
          {/* Navigation Links */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[11px] font-bold uppercase tracking-widest text-emerald-400">
                KATEGORI OLAHRAGA
              </p>
              <span className="text-[10px] font-mono text-slate-400">5 Cabang Resmi</span>
            </div>
            {categories.map((cat, idx) => (
              <Link
                key={idx}
                to={`/dashboard?categoryId=${cat.categoryId}`}
                onClick={onClose}
                className="w-full group flex items-center justify-between py-2.5 px-3 rounded-xl hover:bg-white/10 transition-all text-slate-200 hover:text-white cursor-pointer text-left border border-transparent hover:border-white/10"
              >
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-condensed text-base font-bold tracking-wide group-hover:translate-x-1 transition-transform text-white">
                      {cat.name}
                    </span>
                    {cat.tag && (
                      <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.2 rounded bg-red-600/30 text-red-400 border border-red-500/40">
                        {cat.tag}
                      </span>
                    )}
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono">
                    {cat.desc}
                  </div>
                </div>
                <div className="w-7 h-7 rounded-full bg-white/5 group-hover:bg-emerald-500 group-hover:text-black flex items-center justify-center text-slate-400 transition-all shrink-0">
                  <ChevronRight size={14} />
                </div>
              </Link>
            ))}

            {/* Direct Full Store Catalog Link */}
            <div className="pt-2">
              <Link
                to="/dashboard"
                onClick={onClose}
                className="w-full py-3 px-4 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/40 flex items-center justify-between text-xs font-mono uppercase tracking-wider text-emerald-300 hover:text-white transition-all group shadow-lg shadow-emerald-950/40"
              >
                <span className="font-bold">Buka Katalog Toko Lengkap (50+ Produk)</span>
                <span className="group-hover:translate-x-1.5 transition-transform text-emerald-400">→</span>
              </Link>
            </div>
          </div>

          {/* Info & Section Navigation */}
          <div className="pt-4 border-t border-white/10 space-y-1.5">
            <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-2">
              NAVIGASI HALAMAN
            </p>
            <button
              type="button"
              onClick={() => handleScrollTo("produk")}
              className="w-full flex items-center gap-3 py-2.5 px-3 text-xs font-semibold text-slate-300 hover:text-white hover:bg-white/5 rounded-lg transition-colors text-left cursor-pointer group"
            >
              <Award size={16} className="text-emerald-400 shrink-0 group-hover:scale-110 transition-transform" />
              <span>Koleksi Rekomendasi Jersey</span>
            </button>
            <Link
              to="/dashboard/about"
              onClick={onClose}
              className="w-full flex items-center gap-3 py-2.5 px-3 text-xs font-semibold text-slate-300 hover:text-white hover:bg-white/5 rounded-lg transition-colors text-left cursor-pointer group"
            >
              <Building2 size={16} className="text-emerald-400 shrink-0 group-hover:scale-110 transition-transform" />
              <span>Atelier &amp; Workshop Cicendo Bandung</span>
            </Link>
            <button
              type="button"
              onClick={() => handleScrollTo("keunggulan")}
              className="w-full flex items-center gap-3 py-2.5 px-3 text-xs font-semibold text-slate-300 hover:text-white hover:bg-white/5 rounded-lg transition-colors text-left cursor-pointer group"
            >
              <ShieldCheck size={16} className="text-emerald-400 shrink-0 group-hover:scale-110 transition-transform" />
              <span>Garansi Tukar Ukuran 100% &amp; Standar Mutu</span>
            </button>
            <button
              type="button"
              onClick={() => handleScrollTo("testimoni")}
              className="w-full flex items-center gap-3 py-2.5 px-3 text-xs font-semibold text-slate-300 hover:text-white hover:bg-white/5 rounded-lg transition-colors text-left cursor-pointer group"
            >
              <Award size={16} className="text-emerald-400 shrink-0 group-hover:scale-110 transition-transform" />
              <span>Testimoni Kapten Tim Se-Indonesia</span>
            </button>
            <a
              href="https://wa.me/6281234567890?text=Halo%20Tim%20RegarStore%20Cicendo%20Bandung,%20saya%20ingin%20konsultasi%20desain%20jersey%20tim"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 py-2.5 px-3 text-xs font-semibold text-slate-300 hover:text-white hover:bg-white/5 rounded-lg transition-colors group"
            >
              <Phone size={16} className="text-emerald-400 shrink-0 group-hover:scale-110 transition-transform" />
              <span>Konsultasi Desain Gratis (WhatsApp)</span>
            </a>
          </div>
        </div>

        {/* Footer Account Actions */}
        <div className="relative z-10 p-5 border-t border-white/10 bg-[#121A14]">
          {user ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-700/40 border border-emerald-500/30 flex items-center justify-center font-bold text-emerald-300">
                  {user.fullName ? user.fullName.charAt(0).toUpperCase() : <User size={18} />}
                </div>
                <div>
                  <div className="text-xs font-bold text-white line-clamp-1">{user.fullName || user.email}</div>
                  <div className="text-[10px] text-emerald-400 capitalize">{user.role || "Pelanggan"}</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Link
                  to={user.role === "admin" ? "/admin" : user.role === "logistics" ? "/admin/warehouse" : "/dashboard"}
                  onClick={onClose}
                  className="px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-[#0D130F] font-bold text-xs transition-colors"
                >
                  Dashboard
                </Link>
                <button
                  onClick={async () => {
                    if (!(await logout())) return;
                    onClose();
                  }}
                  className="p-2 rounded-lg bg-white/5 hover:bg-red-500/20 text-slate-400 hover:text-red-400 transition-colors"
                  title="Keluar"
                >
                  <LogOut size={16} />
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <Link
                to="/login"
                onClick={onClose}
                className="py-2.5 text-center rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs tracking-wider uppercase transition-colors"
              >
                Masuk
              </Link>
              <Link
                to="/register"
                onClick={onClose}
                className="py-2.5 text-center rounded-xl bg-emerald-500 hover:bg-emerald-400 text-[#0D130F] font-bold text-xs tracking-wider uppercase transition-colors shadow-lg shadow-emerald-500/20"
              >
                Daftar Akun
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
