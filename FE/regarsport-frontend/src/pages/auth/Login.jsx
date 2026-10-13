import { useEffect, useRef, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  LogIn,
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
import { useAuth, homePathFor } from "../../context/AuthContext";
import GoogleSignInButton from "../../components/auth/GoogleSignInButton";
import toast from "react-hot-toast";
import ForgotPasswordModal from "../../components/auth/ForgotPasswordModal";

const TICKER_ITEMS = [
  "TACTICAL ATHLETICS",
  "PRO-LEVEL PERFORMANCE",
  "CICENDO ATELIER",
  "AERODYNAMIC KNIT",
  "SUBLIMATION SYSTEM",
  "ZERO DISTRACTION",
  "ENDURANCE GRADE",
];

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);
  const emailRef = useRef(null);

  useEffect(() => {
    if (emailRef.current) emailRef.current.focus();
  }, []);

  const validateForm = () => {
    if (!form.email.trim()) return "Email wajib diisi";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) return "Format email tidak valid";
    if (!form.password.trim()) return "Password wajib diisi";
    return "";
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await api.post("/auth/login", form);
      const loggedInUser = login(res.data?.data || res.data);
      toast.success("Login berhasil!");
      navigate(homePathFor(loggedInUser));
    } catch (err) {
      const data = err.response?.data;
      if (data?.data?.code === "EMAIL_NOT_VERIFIED") {
        toast(data.message, { icon: "✉️" });
        navigate(`/verify-email?email=${encodeURIComponent(data.data.email)}`);
        return;
      }
      const message = data?.message || err.message || "Email atau password salah";
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
      toast.success("Login Google berhasil!");
      navigate(homePathFor(loggedInUser));
    } catch (err) {
      const message = err.response?.data?.message || "Login Google gagal. Silakan coba lagi.";
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
          to="/register"
          className="text-xs font-bold text-emerald-400 hover:underline"
        >
          Daftar
        </Link>
      </div>

      {/* ══════════════════════════════════════════════
          LEFT PANEL — Tactical Brand Editorial & Showcase
      ══════════════════════════════════════════════ */}
      <div className="hidden lg:flex w-[48%] xl:w-[50%] flex-col justify-between relative overflow-hidden bg-[#18221B] border-r border-white/10 p-12">
        {/* Subtle Topographic / Crosshair Texture */}
        <div
          className="absolute inset-0 opacity-10 pointer-events-none"
          style={{
            backgroundImage: "radial-gradient(#10B981 1px, transparent 1px)",
            backgroundSize: "28px 28px",
          }}
        />

        {/* Ambient Gradient Glow */}
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
              SECURE ACCESS // PORTAL ATLET
            </div>
            <h1 className="font-['Barlow_Condensed'] font-black text-5xl xl:text-6xl uppercase tracking-tight text-white leading-[0.92]">
              PERSATUKAN <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-[#FAF8F4] to-emerald-200">
                ENERGI & IDENTITAS.
              </span>
            </h1>
            <p className="text-sm text-[#FAF8F4]/70 max-w-md mt-4 leading-relaxed font-sans">
              Akses akun RegarStore untuk memantau status pesanan custom jersey tim, riwayat invoice, serta katalog edisi terbatas berstandar atelier Cicendo Bandung.
            </p>
          </div>
        </div>

        {/* Mid Showcase: Athletic Imagery & Tactical Specifications */}
        <div className="relative z-10 my-8">
          <div className="relative rounded-2xl overflow-hidden border border-white/15 bg-black/40 shadow-2xl group">
            <img
              src="https://images.unsplash.com/photo-1517466787929-bc90951d0974?w=900&q=80"
              alt="Athletic Performance"
              className="w-full h-64 object-cover object-top opacity-60 group-hover:scale-105 transition-transform duration-700"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#18221B] via-[#18221B]/40 to-transparent" />

            <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-widest text-emerald-400 block">
                  CRAFTED FOR CHAMPIONS
                </span>
                <p className="font-['Barlow_Condensed'] font-bold text-lg text-white uppercase tracking-wide">
                  OEKO-TEX High-Tensile Fabric
                </p>
              </div>
              <div className="text-right font-mono text-[10px] text-[#FAF8F4]/60">
                <span>EST. 2014 // BDO</span>
              </div>
            </div>
          </div>

          {/* Quick Pillars */}
          <div className="grid grid-cols-3 gap-3 mt-4 text-center">
            <div className="bg-white/5 border border-white/8 rounded-xl p-3">
              <span className="block font-['Barlow_Condensed'] font-black text-xl text-emerald-400">100%</span>
              <span className="text-[10px] font-mono uppercase tracking-wider text-[#FAF8F4]/60">Garansi Ukuran</span>
            </div>
            <div className="bg-white/5 border border-white/8 rounded-xl p-3">
              <span className="block font-['Barlow_Condensed'] font-black text-xl text-emerald-400">1 PCS</span>
              <span className="text-[10px] font-mono uppercase tracking-wider text-[#FAF8F4]/60">Bisa Custom Tim</span>
            </div>
            <div className="bg-white/5 border border-white/8 rounded-xl p-3">
              <span className="block font-['Barlow_Condensed'] font-black text-xl text-emerald-400">0 RUPIAH</span>
              <span className="text-[10px] font-mono uppercase tracking-wider text-[#FAF8F4]/60">Desain 3D Gratis</span>
            </div>
          </div>
        </div>

        {/* Bottom Continuous Ticker */}
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
          RIGHT PANEL — Clean Tactical Login Form
      ══════════════════════════════════════════════ */}
      <div className="flex-1 flex flex-col justify-center items-center px-6 sm:px-12 py-12 lg:py-16 relative z-10">
        {/* Subtle Ambient Light */}
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
              <LogIn size={12} />
              AUTHENTICATION
            </div>
            <h2 className="font-['Barlow_Condensed'] font-black text-4xl sm:text-5xl uppercase tracking-tight text-white leading-none">
              MASUK KE AKUN
            </h2>
            <p className="text-xs sm:text-sm text-[#FAF8F4]/60 mt-2 font-sans">
              Kelola pesanan jersey tim, simpan wishlist, atau lanjutkan checkout.
            </p>
          </div>

          {/* Error Notice */}
          {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-950/50 border border-red-500/40 text-red-200 text-xs flex items-start gap-3">
              <span className="font-bold text-red-400 text-sm leading-none mt-0.5">!</span>
              <p className="leading-relaxed">{error}</p>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label
                htmlFor="login-email"
                className="block text-[11px] font-mono uppercase tracking-wider text-[#FAF8F4]/70 mb-2"
              >
                Alamat Email
              </label>
              <div className="relative flex items-center bg-[#18221B] border border-white/10 rounded-xl focus-within:border-emerald-400 focus-within:ring-2 focus-within:ring-emerald-400/20 transition-all">
                <Mail size={16} className="text-[#FAF8F4]/40 ml-4 pointer-events-none" />
                <input
                  ref={emailRef}
                  id="login-email"
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
                  htmlFor="login-password"
                  className="block text-[11px] font-mono uppercase tracking-wider text-[#FAF8F4]/70"
                >
                  Kata Sandi
                </label>
                <button
                  type="button"
                  onClick={() => setIsForgotModalOpen(true)}
                  className="text-[11px] font-mono text-emerald-400 hover:text-emerald-300 transition-colors uppercase tracking-wider cursor-pointer"
                >
                  Lupa Kata Sandi?
                </button>
              </div>
              <div className="relative flex items-center bg-[#18221B] border border-white/10 rounded-xl focus-within:border-emerald-400 focus-within:ring-2 focus-within:ring-emerald-400/20 transition-all">
                <Lock size={16} className="text-[#FAF8F4]/40 ml-4 pointer-events-none" />
                <input
                  id="login-password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  autoComplete="current-password"
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
                  <span>MEMVERIFIKASI...</span>
                </>
              ) : (
                <>
                  <span>MASUK SEKARANG</span>
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
              <GoogleSignInButton text="signin_with" onCredential={handleGoogle} />
            </>
          )}

          {/* Quick Register Divider */}
          <div className="relative my-8 text-center">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/10" />
            </div>
            <span className="relative bg-[#0F1712] px-4 text-[11px] font-mono uppercase tracking-widest text-[#FAF8F4]/40">
              BELUM PUNYA AKUN?
            </span>
          </div>

          {/* Register Action */}
          <Link
            to="/register"
            className="w-full py-3.5 px-6 rounded-xl border border-white/15 bg-white/5 hover:bg-white/10 hover:border-emerald-500/40 text-white font-sans text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 group"
          >
            <span>Daftar Akun Baru Tim Anda</span>
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
              <span>Official Atelier</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Compass size={14} className="text-emerald-400" />
              <span>Cicendo BDO</span>
            </div>
          </div>
        </div>
      </div>

      {/* Forgot Password Modal */}
      <ForgotPasswordModal
        isOpen={isForgotModalOpen}
        onClose={() => setIsForgotModalOpen(false)}
        defaultEmail={form.email}
        onPasswordReset={(newPass) => {
          setForm((prev) => ({ ...prev, password: newPass }));
          setIsForgotModalOpen(false);
          toast.success("Kata sandi berhasil diperbarui! Silakan klik 'Masuk Sekarang'.");
        }}
      />
    </div>
  );
}