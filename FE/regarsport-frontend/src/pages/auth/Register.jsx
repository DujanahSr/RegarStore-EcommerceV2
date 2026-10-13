import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  UserPlus,
  User,
  Mail,
  Lock,
  ArrowRight,
  ArrowLeft,
  Eye,
  EyeOff,
  ShieldCheck,
  CheckCircle2,
  Compass,
} from "lucide-react";
import api from "../../services/api";
import toast from "react-hot-toast";
import { useAuth, homePathFor } from "../../context/AuthContext";
import GoogleSignInButton from "../../components/auth/GoogleSignInButton";

const TICKER_ITEMS = [
  "TACTICAL ATHLETICS",
  "FREE 3D DESIGN RENDERING",
  "ORDER MINIMAL 1 PCS",
  "CICENDO ATELIER",
  "GARANSI TUKAR UKURAN 100%",
  "CUSTOM SUBLIMATION EXPERT",
];

export default function Register() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [form, setForm] = useState({
    full_name: "",
    email: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const validateForm = () => {
    if (!form.full_name.trim()) return "Nama lengkap wajib diisi";
    if (!form.email.trim()) return "Email wajib diisi";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) return "Format email tidak valid";
    if (!form.password.trim()) return "Password wajib diisi";
    if (form.password.length < 8) return "Password minimal 8 karakter";
    return "";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await api.post("/auth/register", form);
      const email = res.data?.data?.email || form.email.trim().toLowerCase();
      toast.success(res.data?.message || "Registrasi berhasil! Cek email Anda untuk kode verifikasi.");
      navigate(`/verify-email?email=${encodeURIComponent(email)}`);
    } catch (err) {
      const message = err.response?.data?.message || "Pendaftaran gagal. Silakan coba lagi.";
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async (credential) => {
    setLoading(true);
    setError("");
    try {
      const res = await api.post("/auth/google", { credential });
      const loggedInUser = login(res.data?.data);
      toast.success("Akun Google berhasil terdaftar!");
      navigate(homePathFor(loggedInUser));
    } catch (err) {
      const message = err.response?.data?.message || "Daftar dengan Google gagal. Silakan coba lagi.";
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0F1712] text-[#FAF8F4] flex flex-col lg:flex-row relative selection:bg-emerald-500 selection:text-black">
      {/* ── Top Bar Mobile Navigation ── */}
      <div className="lg:hidden flex items-center justify-between px-6 py-4 border-b border-white/10 bg-[#18221B]/90 backdrop-blur-md sticky top-0 z-30">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-xs font-mono tracking-widest text-[#FAF8F4]/80 hover:text-emerald-400 transition-colors uppercase"
        >
          <ArrowLeft size={14} />
          <span>Beranda</span>
        </Link>
        <span className="font-['Barlow_Condensed'] font-black tracking-widest text-base text-emerald-400 uppercase">
          REGARSTORE
        </span>
        <Link
          to="/login"
          className="text-xs font-bold text-emerald-400 hover:underline"
        >
          Masuk
        </Link>
      </div>

      {/* ══════════════════════════════════════════════
          LEFT PANEL — Benefits & Showcase
      ══════════════════════════════════════════════ */}
      <div className="hidden lg:flex w-[48%] xl:w-[50%] flex-col justify-between relative overflow-hidden bg-[#18221B] border-r border-white/10 p-12">
        {/* Topographic Background Texture */}
        <div
          className="absolute inset-0 opacity-10 pointer-events-none"
          style={{
            backgroundImage: "radial-gradient(#10B981 1px, transparent 1px)",
            backgroundSize: "28px 28px",
          }}
        />

        {/* Ambient Glow */}
        <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-emerald-600/15 blur-[120px] pointer-events-none" />
        <div className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-emerald-400/10 blur-[120px] pointer-events-none" />

        {/* Top Header inside Left Panel */}
        <div className="relative z-10 space-y-6">
          <div className="flex items-center justify-between">
            <Link
              to="/"
              className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-xs font-mono uppercase tracking-widest text-[#FAF8F4]/80 hover:text-white hover:bg-white/10 hover:border-emerald-500/40 transition-all duration-200 group"
            >
              <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
              <span>Kembali Ke Beranda</span>
            </Link>

            <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest text-emerald-400/80 bg-emerald-950/60 border border-emerald-500/30 px-3 py-1 rounded-full">
              <span className="px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 font-mono text-[9px] font-bold border border-emerald-500/40">RS-BDG</span>
              ATELIER // CICENDO BANDUNG
            </div>
          </div>

          <div className="pt-6">
            <div className="inline-block text-[11px] font-mono tracking-[0.25em] text-emerald-400 uppercase bg-emerald-950/40 border border-emerald-800/40 px-3 py-1 rounded mb-4">
              JOIN THE ELITE // DAFTAR TIM
            </div>
            <h1 className="font-['Barlow_Condensed'] font-black text-5xl xl:text-6xl uppercase tracking-tight text-white leading-[0.92]">
              MULAI REVOLUSI <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-[#FAF8F4] to-emerald-200">
                JERSEY KELAS DUNIA.
              </span>
            </h1>
            <p className="text-sm text-[#FAF8F4]/70 max-w-md mt-4 leading-relaxed font-sans">
              Daftarkan tim atau komunitas Anda untuk menikmati konsultasi desain 3D cuma-cuma, kemudahan order mulai 1 pcs, serta jaminan garansi tukar ukuran 100%.
            </p>
          </div>
        </div>

        {/* Mid Showcase Feature List */}
        <div className="relative z-10 my-8 space-y-3">
          {[
            {
              title: "GRATIS DESAIN 3D UNLIMITED",
              desc: "Tim desainer atelier Cicendo kami siap memvisualisasikan jersey impian Anda hingga puas sebelum proses cetak.",
            },
            {
              title: "ORDER TANPA MINIMAL KUOTA (MIN. 1 PCS)",
              desc: "Bisa pesan satu potong untuk sampel atau ribuan potong untuk seragam turnamen nasional.",
            },
            {
              title: "TINTA OEKO-TEX & BAHAN HIGH-PERFORMANCE",
              desc: "Kain sejuk berpori mikro (Dry-Fit Waffle & Milano) aman untuk kulit dan tidak luntur selamanya.",
            },
          ].map((item, idx) => (
            <div
              key={idx}
              className="bg-white/5 border border-white/8 rounded-2xl p-4 flex items-start gap-4 hover:border-emerald-500/40 transition-colors"
            >
              <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center shrink-0 text-emerald-400 font-mono font-bold text-xs">
                0{idx + 1}
              </div>
              <div>
                <h2 className="font-['Barlow_Condensed'] font-black text-white text-base tracking-wide uppercase">
                  {item.title}
                </h2>
                <p className="text-xs text-[#FAF8F4]/60 mt-1 leading-relaxed font-sans">
                  {item.desc}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom Ticker */}
        <div className="relative z-10 border-t border-white/10 pt-4 overflow-hidden">
          <div className="flex gap-6 whitespace-nowrap animate-[marquee_20s_linear_infinite] text-xs font-mono uppercase tracking-widest text-[#FAF8F4]/40">
            {TICKER_ITEMS.concat(TICKER_ITEMS).map((item, idx) => (
              <span key={idx} className="flex items-center gap-3">
                <span className="text-emerald-400">◆</span>
                {item}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════
          RIGHT PANEL — Clean Tactical Register Form
      ══════════════════════════════════════════════ */}
      <div className="flex-1 flex flex-col justify-center items-center px-6 sm:px-12 py-12 lg:py-16 relative z-10">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 sm:w-96 sm:h-96 rounded-full bg-emerald-500/5 blur-[100px] pointer-events-none" />

        <div className="w-full max-w-md">
          {/* Top back button for mobile/desktop fallback */}
          <div className="flex items-center justify-between mb-8">
            <Link
              to="/"
              className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-[#FAF8F4]/60 hover:text-emerald-400 transition-colors group"
            >
              <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
              <span>← Kembali ke Beranda</span>
            </Link>
            <div className="flex items-center gap-1.5 text-xs font-mono text-emerald-400/80">
              <Compass size={14} />
              <span>REGARSTORE HUB</span>
            </div>
          </div>

          {/* Form Header */}
          <div className="mb-8">
            <div className="inline-flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.2em] text-emerald-400 bg-emerald-950/80 border border-emerald-500/30 px-3 py-1 rounded mb-3">
              <UserPlus size={12} />
              NEW ACCOUNT REGISTRATION
            </div>
            <h1 className="font-['Barlow_Condensed'] font-black text-4xl sm:text-5xl uppercase tracking-tight text-white leading-none">
              BUAT AKUN BARU
            </h1>
            <p className="text-xs sm:text-sm text-[#FAF8F4]/60 mt-2 font-sans">
              Lengkapi data untuk memulai perancangan dan pemesanan jersey.
            </p>
          </div>

          {/* Error Notice */}
          {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-950/50 border border-red-500/40 text-red-200 text-xs flex items-start gap-3">
              <span className="font-bold text-red-400 text-sm leading-none mt-0.5">!</span>
              <p className="leading-relaxed">{error}</p>
            </div>
          )}

          {/* Registration Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="register-name"
                className="block text-[11px] font-mono uppercase tracking-wider text-[#FAF8F4]/70 mb-2"
              >
                Nama Lengkap / Nama Kapten
              </label>
              <div className="relative flex items-center bg-[#18221B] border border-white/10 rounded-xl focus-within:border-emerald-400 focus-within:ring-2 focus-within:ring-emerald-400/20 transition-all">
                <User size={16} className="text-[#FAF8F4]/40 ml-4 pointer-events-none" />
                <input
                  id="register-name"
                  type="text"
                  placeholder="Contoh: Dujanah Siregar"
                  autoComplete="name"
                  value={form.full_name}
                  onChange={(e) => {
                    setForm({ ...form, full_name: e.target.value });
                    if (error) setError("");
                  }}
                  className="w-full bg-transparent px-3 py-3.5 text-sm text-white placeholder:text-[#FAF8F4]/30 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="register-email"
                className="block text-[11px] font-mono uppercase tracking-wider text-[#FAF8F4]/70 mb-2"
              >
                Alamat Email
              </label>
              <div className="relative flex items-center bg-[#18221B] border border-white/10 rounded-xl focus-within:border-emerald-400 focus-within:ring-2 focus-within:ring-emerald-400/20 transition-all">
                <Mail size={16} className="text-[#FAF8F4]/40 ml-4 pointer-events-none" />
                <input
                  id="register-email"
                  type="email"
                  placeholder="kapten@timanda.com"
                  autoComplete="email"
                  value={form.email}
                  onChange={(e) => {
                    setForm({ ...form, email: e.target.value });
                    if (error) setError("");
                  }}
                  className="w-full bg-transparent px-3 py-3.5 text-sm text-white placeholder:text-[#FAF8F4]/30 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label
                  htmlFor="register-password"
                  className="block text-[11px] font-mono uppercase tracking-wider text-[#FAF8F4]/70"
                >
                  Kata Sandi (Min. 8 Karakter)
                </label>
              </div>
              <div className="relative flex items-center bg-[#18221B] border border-white/10 rounded-xl focus-within:border-emerald-400 focus-within:ring-2 focus-within:ring-emerald-400/20 transition-all">
                <Lock size={16} className="text-[#FAF8F4]/40 ml-4 pointer-events-none" />
                <input
                  id="register-password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  autoComplete="new-password"
                  value={form.password}
                  onChange={(e) => {
                    setForm({ ...form, password: e.target.value });
                    if (error) setError("");
                  }}
                  className="w-full bg-transparent px-3 py-3.5 text-sm text-white placeholder:text-[#FAF8F4]/30 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="p-3 text-[#FAF8F4]/40 hover:text-white transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-4 px-6 rounded-xl bg-emerald-500 hover:bg-emerald-400 active:scale-[0.99] text-[#0F1712] font-['Barlow_Condensed'] font-black text-lg tracking-wider uppercase transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 group"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-[#0F1712] border-t-transparent rounded-full animate-spin" />
                  <span>MEMPROSES PENDAFTARAN...</span>
                </>
              ) : (
                <>
                  <span>DAFTAR SEKARANG</span>
                  <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          {import.meta.env.VITE_GOOGLE_CLIENT_ID && (
            <>
              <div className="relative my-6 text-center">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-white/10" />
                </div>
                <span className="relative bg-[#0F1712] px-4 text-[11px] font-mono uppercase tracking-widest text-[#FAF8F4]/40">
                  ATAU
                </span>
              </div>
              <GoogleSignInButton text="signup_with" onCredential={handleGoogle} />
            </>
          )}

          {/* Quick Login Divider */}
          <div className="relative my-8 text-center">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/10" />
            </div>
            <span className="relative bg-[#0F1712] px-4 text-[11px] font-mono uppercase tracking-widest text-[#FAF8F4]/40">
              SUDAH MEMILIKI AKUN?
            </span>
          </div>

          {/* Login Action */}
          <Link
            to="/login"
            className="w-full py-3.5 px-6 rounded-xl border border-white/15 bg-white/5 hover:bg-white/10 hover:border-emerald-500/40 text-white font-sans text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 group"
          >
            <span>Masuk ke Akun Anda</span>
            <ArrowRight size={14} className="text-emerald-400 group-hover:translate-x-1 transition-transform" />
          </Link>

          {/* Footer Security Badges */}
          <div className="mt-10 pt-6 border-t border-white/10 flex items-center justify-center gap-6 text-[11px] font-mono uppercase text-[#FAF8F4]/40">
            <div className="flex items-center gap-1.5">
              <ShieldCheck size={14} className="text-emerald-400" />
              <span>256-Bit SSL</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 size={14} className="text-emerald-400" />
              <span>Garansi 100%</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Compass size={14} className="text-emerald-400" />
              <span>Cicendo BDO</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}