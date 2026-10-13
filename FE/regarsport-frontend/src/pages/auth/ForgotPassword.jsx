import { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  KeyRound,
  RotateCcw,
  Compass,
} from "lucide-react";
import toast from "react-hot-toast";
import api from "../../services/api";

const TICKER_ITEMS = [
  "TACTICAL ATHLETICS",
  "PRO-LEVEL PERFORMANCE",
  "CICENDO ATELIER",
  "SECURITY PROTOCOL",
  "AUTHENTIC ACCESS",
  "ENDURANCE GRADE",
];

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [token, setToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const emailRef = useRef(null);
  const tokenRef = useRef(null);

  useEffect(() => {
    if (step === 1) {
      emailRef.current?.focus();
    }
  }, [step]);

  useEffect(() => {
    let timer;
    if (countdown > 0) {
      timer = setInterval(() => setCountdown((c) => c - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [countdown]);

  const handleRequestCode = async (e) => {
    if (e) e.preventDefault();
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) {
      toast.error("Silakan masukkan alamat email Anda");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      toast.error("Format email tidak valid");
      return;
    }

    setLoading(true);
    try {
      const res = await api.post("/auth/forgot-password", { email: cleanEmail });
      toast.success(
        res.data?.message || `Kode verifikasi telah dikirim ke ${cleanEmail}`
      );
      setStep(2);
      setCountdown(60);
      setTimeout(() => tokenRef.current?.focus(), 200);
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        err.message ||
        "Gagal mengirim kode reset password";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    const cleanToken = token.trim();
    if (!cleanToken) {
      toast.error("Silakan masukkan kode verifikasi 6 digit");
      return;
    }
    if (newPassword.length < 6) {
      toast.error("Kata sandi baru minimal 6 karakter");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Konfirmasi kata sandi tidak cocok!");
      return;
    }

    setLoading(true);
    try {
      await api.post("/auth/reset-password", {
        email: email.trim().toLowerCase(),
        token: cleanToken,
        newPassword: newPassword,
      });
      toast.success("Kata sandi berhasil diperbarui!");
      setStep(3);
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        err.message ||
        "Kode verifikasi tidak valid atau kedaluwarsa";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0F1712] text-[#FAF8F4] flex flex-col lg:flex-row relative selection:bg-emerald-500 selection:text-black">
      {/* ── Top Bar Mobile Navigation ── */}
      <div className="lg:hidden flex items-center justify-between px-6 py-4 border-b border-white/10 bg-[#18221B]/90 backdrop-blur-md sticky top-0 z-30">
        <Link
          to="/login"
          className="inline-flex items-center gap-2 text-xs font-mono tracking-widest text-[#FAF8F4]/80 hover:text-emerald-400 transition-colors uppercase"
        >
          <ArrowLeft size={14} />
          <span>Kembali Masuk</span>
        </Link>
        <span className="font-['Barlow_Condensed'] font-black tracking-widest text-base text-emerald-400 uppercase">
          REGARSTORE
        </span>
      </div>

      {/* ── Left Tactical Brand Showcase Panel ── */}
      <div className="hidden lg:flex w-[48%] xl:w-[50%] flex-col justify-between relative overflow-hidden bg-[#18221B] border-r border-white/10 p-12">
        <div
          className="absolute inset-0 opacity-10 pointer-events-none"
          style={{
            backgroundImage: "radial-gradient(#10B981 1px, transparent 1px)",
            backgroundSize: "28px 28px",
          }}
        />

        <div className="relative z-10 space-y-6">
          <div className="flex items-center justify-between">
            <Link
              to="/login"
              className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-xs font-mono uppercase tracking-widest text-[#FAF8F4]/80 hover:text-white hover:bg-white/10 hover:border-emerald-500/40 transition-all duration-200 group"
            >
              <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
              <span>Kembali Ke Halaman Masuk</span>
            </Link>

            <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest text-emerald-400/80 bg-emerald-950/60 border border-emerald-500/30 px-3 py-1 rounded-full">
              <span className="px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 font-mono text-[9px] font-bold border border-emerald-500/40">RS-BDG</span>
              ATELIER // CICENDO BANDUNG
            </div>
          </div>

          <div className="pt-8">
            <div className="inline-block text-[11px] font-mono tracking-[0.25em] text-emerald-400 uppercase bg-emerald-950/40 border border-emerald-800/40 px-3 py-1 rounded mb-4">
              ACCOUNT RECOVERY // PROTOKOL KEAMANAN
            </div>
            <h1 className="font-['Barlow_Condensed'] font-black text-5xl xl:text-6xl uppercase tracking-tight text-white leading-[0.92]">
              PULIHKAN AKSES <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-[#FAF8F4] to-emerald-200">
                AKUN ATLET ANDA.
              </span>
            </h1>
            <p className="text-sm text-[#FAF8F4]/70 max-w-md mt-4 leading-relaxed font-sans">
              Amankan kembali akun RegarStore Anda melalui verifikasi kode 6-digit resmi yang terkirim langsung ke email terdaftar.
            </p>
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

      {/* ── Right Panel: Form ── */}
      <div className="flex-1 flex flex-col justify-center items-center px-6 sm:px-12 py-12 lg:py-16 relative z-10">
        <div className="w-full max-w-md">
          {/* Top back button */}
          <div className="flex items-center justify-between mb-8">
            <Link
              to="/login"
              className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-[#FAF8F4]/60 hover:text-emerald-400 transition-colors group"
            >
              <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
              <span>← Kembali Masuk</span>
            </Link>
            <div className="flex items-center gap-1.5 text-xs font-mono text-emerald-400/80">
              <Compass size={14} />
              <span>REGARSTORE HUB</span>
            </div>
          </div>

          {/* Form Header */}
          <div className="mb-8">
            <div className="inline-flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.2em] text-emerald-400 bg-emerald-950/80 border border-emerald-500/30 px-3 py-1 rounded mb-3">
              <KeyRound size={12} />
              PASSWORD RECOVERY
            </div>
            <h2 className="font-['Barlow_Condensed'] font-black text-4xl sm:text-5xl uppercase tracking-tight text-white leading-none">
              {step === 1 && "LUPA KATA SANDI"}
              {step === 2 && "VERIFIKASI & SANDI BARU"}
              {step === 3 && "KATA SANDI DIPERBARUI"}
            </h2>
            <p className="text-xs sm:text-sm text-[#FAF8F4]/60 mt-2 font-sans">
              {step === 1 && "Masukkan email akun Anda untuk menerima kode verifikasi 6 digit."}
              {step === 2 && "Masukkan kode verifikasi 6 digit yang diterima dan buat kata sandi baru."}
              {step === 3 && "Kata sandi akun Anda telah berhasil diperbarui."}
            </p>
          </div>

          {/* Step 1: Input Email */}
          {step === 1 && (
            <form onSubmit={handleRequestCode} className="space-y-4">
              <div>
                <label className="block text-[11px] font-mono uppercase tracking-wider text-[#FAF8F4]/70 mb-2">
                  Alamat Email
                </label>
                <div className="relative flex items-center bg-[#18221B] border border-white/10 rounded-xl focus-within:border-emerald-400 focus-within:ring-2 focus-within:ring-emerald-400/20 transition-all">
                  <Mail size={16} className="text-[#FAF8F4]/40 ml-4 pointer-events-none" />
                  <input
                    ref={emailRef}
                    type="email"
                    placeholder="kapten@timanda.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-transparent px-3 py-3.5 text-sm text-white placeholder:text-[#FAF8F4]/30 focus:outline-none"
                    autoFocus
                  />
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
                    <span>MENGIRIM KODE...</span>
                  </>
                ) : (
                  <>
                    <span>KIRIM KODE RESET</span>
                    <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* Step 2: Verification & New Password */}
          {step === 2 && (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div className="bg-emerald-950/40 border border-emerald-500/30 rounded-xl p-3 text-xs text-slate-300">
                <span className="text-emerald-400 font-semibold block mb-0.5">Email Terdaftar:</span>
                <span className="font-mono text-white text-xs">{email}</span>
              </div>

              <div>
                <label className="block text-[11px] font-mono uppercase tracking-wider text-[#FAF8F4]/70 mb-2">
                  Kode Verifikasi 6 Digit
                </label>
                <div className="relative flex items-center bg-[#18221B] border border-white/10 rounded-xl focus-within:border-emerald-400 focus-within:ring-2 focus-within:ring-emerald-400/20 transition-all">
                  <input
                    ref={tokenRef}
                    type="text"
                    maxLength={6}
                    placeholder="Contoh: 853145"
                    value={token}
                    onChange={(e) => setToken(e.target.value.replace(/\D/g, ""))}
                    className="w-full bg-transparent px-4 py-3.5 text-center text-2xl font-mono tracking-[8px] font-bold text-emerald-400 placeholder:tracking-normal placeholder:text-sm placeholder:text-white/20 focus:outline-none"
                    autoFocus
                  />
                </div>
                <div className="flex items-center justify-between mt-1 text-[11px] text-slate-400">
                  <span>Periksa kotak masuk email / Mailpit</span>
                  {countdown > 0 ? (
                    <span className="font-mono text-emerald-400">Kirim ulang ({countdown}s)</span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleRequestCode()}
                      className="text-emerald-400 hover:underline flex items-center gap-1 font-semibold"
                    >
                      <RotateCcw size={11} /> Kirim Ulang
                    </button>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-mono uppercase tracking-wider text-[#FAF8F4]/70 mb-2">
                  Kata Sandi Baru
                </label>
                <div className="relative flex items-center bg-[#18221B] border border-white/10 rounded-xl focus-within:border-emerald-400 focus-within:ring-2 focus-within:ring-emerald-400/20 transition-all">
                  <Lock size={16} className="text-[#FAF8F4]/40 ml-4 pointer-events-none" />
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Minimal 6 karakter"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full bg-transparent px-3 py-3.5 text-sm text-white placeholder:text-[#FAF8F4]/30 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="p-3 text-[#FAF8F4]/40 hover:text-white transition-colors"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-mono uppercase tracking-wider text-[#FAF8F4]/70 mb-2">
                  Konfirmasi Kata Sandi Baru
                </label>
                <div className="relative flex items-center bg-[#18221B] border border-white/10 rounded-xl focus-within:border-emerald-400 focus-within:ring-2 focus-within:ring-emerald-400/20 transition-all">
                  <Lock size={16} className="text-[#FAF8F4]/40 ml-4 pointer-events-none" />
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Ulangi kata sandi baru"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full bg-transparent px-3 py-3.5 text-sm text-white placeholder:text-[#FAF8F4]/30 focus:outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || !token || newPassword.length < 6 || newPassword !== confirmPassword}
                className="w-full mt-2 py-4 px-6 rounded-xl bg-emerald-500 hover:bg-emerald-400 active:scale-[0.99] text-[#0F1712] font-['Barlow_Condensed'] font-black text-lg tracking-wider uppercase transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 group"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-[#0F1712] border-t-transparent rounded-full animate-spin" />
                    <span>MENYIMPAN...</span>
                  </>
                ) : (
                  <>
                    <span>SIMPAN KATA SANDI BARU</span>
                    <CheckCircle2 size={18} />
                  </>
                )}
              </button>
            </form>
          )}

          {/* Step 3: Success */}
          {step === 3 && (
            <div className="text-center py-6 space-y-5">
              <div className="w-20 h-20 mx-auto rounded-3xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-[0_0_30px_rgba(16,185,129,0.25)] animate-bounce">
                <CheckCircle2 size={40} />
              </div>

              <div>
                <h3 className="font-['Barlow_Condensed'] font-black text-3xl uppercase tracking-tight text-white">
                  Kata Sandi Berhasil Diperbarui!
                </h3>
                <p className="text-sm text-slate-300 mt-2 font-sans leading-relaxed">
                  Kata sandi baru Anda telah aktif. Silakan masuk menggunakan kata sandi baru Anda.
                </p>
              </div>

              <button
                type="button"
                onClick={() => navigate("/login")}
                className="w-full py-4 px-6 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-[#0F1712] font-['Barlow_Condensed'] font-black text-lg uppercase tracking-wider transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2"
              >
                <span>MASUK SEKARANG</span>
                <ArrowRight size={18} />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
