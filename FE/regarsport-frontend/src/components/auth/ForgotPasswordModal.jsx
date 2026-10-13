import { useState, useEffect, useRef } from "react";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  CheckCircle2,
  X,
  RotateCcw,
  KeyRound,
} from "lucide-react";
import toast from "react-hot-toast";
import api from "../../services/api";

export default function ForgotPasswordModal({
  isOpen,
  onClose,
  defaultEmail = "",
  onPasswordReset,
}) {
  const [step, setStep] = useState(1); // 1: Email, 2: Code & New Password, 3: Success
  const [email, setEmail] = useState(defaultEmail || "");
  const [token, setToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const emailInputRef = useRef(null);
  const tokenInputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      if (defaultEmail && !email) {
        setEmail(defaultEmail);
      }
      if (step === 1) {
        setTimeout(() => emailInputRef.current?.focus(), 150);
      }
    } else {
      // Reset state on close
      setTimeout(() => {
        setStep(1);
        setToken("");
        setNewPassword("");
        setConfirmPassword("");
        setShowPassword(false);
      }, 300);
    }
  }, [isOpen, defaultEmail]);

  useEffect(() => {
    let timer;
    if (countdown > 0) {
      timer = setInterval(() => setCountdown((c) => c - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [countdown]);

  if (!isOpen) return null;

  // Password strength helper
  const getPasswordStrength = (pass) => {
    if (!pass) return { score: 0, label: "Kosong", color: "bg-white/10" };
    if (pass.length < 6) return { score: 1, label: "Terlalu Pendek (min. 6)", color: "bg-red-500" };
    let score = 1;
    if (pass.length >= 8) score += 1;
    if (/[A-Z]/.test(pass) && /[a-z]/.test(pass)) score += 1;
    if (/[0-9]/.test(pass) || /[^A-Za-z0-9]/.test(pass)) score += 1;

    if (score <= 2) return { score: 2, label: "Cukup", color: "bg-amber-500" };
    if (score === 3) return { score: 3, label: "Kuat", color: "bg-emerald-400" };
    return { score: 4, label: "Sangat Kuat", color: "bg-emerald-300" };
  };

  const strength = getPasswordStrength(newPassword);

  // Step 1: Send Reset Code
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
        res.data?.message || `Kode reset telah dikirim ke ${cleanEmail}`
      );
      setStep(2);
      setCountdown(60);
      setTimeout(() => tokenInputRef.current?.focus(), 200);
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

  // Step 2: Confirm Reset
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
        "Kode verifikasi salah atau telah kedaluwarsa";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleFinish = () => {
    if (onPasswordReset) {
      onPasswordReset(newPassword);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-[fadeIn_0.2s_ease-out]">
      <div className="relative w-full max-w-md bg-[#141C16] border border-white/15 rounded-2xl shadow-2xl p-6 sm:p-8 text-[#FAF8F4] overflow-hidden">
        {/* Subtle Ambient Glow */}
        <div className="absolute -top-24 -right-24 w-60 h-60 rounded-full bg-emerald-500/10 blur-[80px] pointer-events-none" />

        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 mb-5 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <KeyRound size={16} />
            </div>
            <div>
              <span className="text-[10px] font-mono tracking-widest uppercase text-emerald-400 block leading-none">
                SECURITY // ATELIER
              </span>
              <h3 className="font-['Barlow_Condensed'] font-black text-2xl uppercase tracking-tight text-white leading-tight">
                {step === 1 && "Lupa Kata Sandi"}
                {step === 2 && "Verifikasi & Sandi Baru"}
                {step === 3 && "Sandi Berhasil Diubah"}
              </h3>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* ─── STEP 1: INPUT EMAIL ─── */}
        {step === 1 && (
          <form onSubmit={handleRequestCode} className="space-y-4">
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-sans">
              Masukkan alamat email akun RegarStore Anda. Kami akan mengirimkan
              kode verifikasi 6-digit untuk mengatur ulang kata sandi.
            </p>

            <div>
              <label className="block text-[11px] font-mono uppercase tracking-wider text-slate-400 mb-1.5">
                Alamat Email Akun
              </label>
              <div className="relative flex items-center bg-[#18221B] border border-white/15 rounded-xl focus-within:border-emerald-400 focus-within:ring-2 focus-within:ring-emerald-400/20 transition-all">
                <Mail size={16} className="text-slate-400 ml-3.5 pointer-events-none" />
                <input
                  ref={emailInputRef}
                  type="email"
                  placeholder="kapten@timanda.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-transparent px-3 py-3 text-sm text-white placeholder:text-white/30 focus:outline-none"
                  autoFocus
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-5 mt-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 active:scale-[0.99] text-[#0F1712] font-['Barlow_Condensed'] font-black text-base uppercase tracking-wider transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 group"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-[#0F1712] border-t-transparent rounded-full animate-spin" />
                  <span>MENGIRIM KODE...</span>
                </>
              ) : (
                <>
                  <span>KIRIM KODE VERIFIKASI</span>
                  <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>
        )}

        {/* ─── STEP 2: VERIFIKASI KODE & BUAT SANDI BARU ─── */}
        {step === 2 && (
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div className="bg-emerald-950/30 border border-emerald-500/20 rounded-xl p-3 text-xs text-slate-300">
              <span className="text-emerald-400 font-semibold block mb-0.5">
                Email Terdaftar:
              </span>
              <span className="font-mono text-white text-xs">{email}</span>
            </div>

            {/* Kode Verifikasi 6 Digit */}
            <div>
              <label className="block text-[11px] font-mono uppercase tracking-wider text-slate-400 mb-1.5">
                Kode Verifikasi 6 Digit
              </label>
              <div className="relative flex items-center bg-[#18221B] border border-white/15 rounded-xl focus-within:border-emerald-400 focus-within:ring-2 focus-within:ring-emerald-400/20 transition-all">
                <input
                  ref={tokenInputRef}
                  type="text"
                  maxLength={6}
                  placeholder="Contoh: 853145"
                  value={token}
                  onChange={(e) => setToken(e.target.value.replace(/\D/g, ""))}
                  className="w-full bg-transparent px-4 py-3 text-center text-xl font-mono tracking-[6px] font-bold text-emerald-400 placeholder:tracking-normal placeholder:text-sm placeholder:text-white/20 focus:outline-none"
                />
              </div>
              <div className="flex items-center justify-between mt-1 text-[11px] text-slate-400">
                <span>Periksa kotak masuk / Mailpit</span>
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

            {/* Kata Sandi Baru */}
            <div>
              <label className="block text-[11px] font-mono uppercase tracking-wider text-slate-400 mb-1.5">
                Kata Sandi Baru
              </label>
              <div className="relative flex items-center bg-[#18221B] border border-white/15 rounded-xl focus-within:border-emerald-400 focus-within:ring-2 focus-within:ring-emerald-400/20 transition-all">
                <Lock size={15} className="text-slate-400 ml-3.5 pointer-events-none" />
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Minimal 6 karakter"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full bg-transparent px-3 py-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="p-2.5 text-slate-400 hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>

              {/* Password Strength Meter */}
              {newPassword && (
                <div className="mt-1.5 flex items-center gap-2">
                  <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden flex gap-1">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        strength.score >= 1 ? strength.color : "bg-transparent"
                      }`}
                      style={{ width: "25%" }}
                    />
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        strength.score >= 2 ? strength.color : "bg-transparent"
                      }`}
                      style={{ width: "25%" }}
                    />
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        strength.score >= 3 ? strength.color : "bg-transparent"
                      }`}
                      style={{ width: "25%" }}
                    />
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        strength.score >= 4 ? strength.color : "bg-transparent"
                      }`}
                      style={{ width: "25%" }}
                    />
                  </div>
                  <span className="text-[10px] font-mono uppercase text-slate-400">
                    {strength.label}
                  </span>
                </div>
              )}
            </div>

            {/* Konfirmasi Kata Sandi Baru */}
            <div>
              <label className="block text-[11px] font-mono uppercase tracking-wider text-slate-400 mb-1.5">
                Konfirmasi Kata Sandi Baru
              </label>
              <div className="relative flex items-center bg-[#18221B] border border-white/15 rounded-xl focus-within:border-emerald-400 focus-within:ring-2 focus-within:ring-emerald-400/20 transition-all">
                <Lock size={15} className="text-slate-400 ml-3.5 pointer-events-none" />
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Ulangi kata sandi baru"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full bg-transparent px-3 py-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none"
                />
              </div>
              {confirmPassword && newPassword !== confirmPassword && (
                <span className="text-[10px] text-red-400 mt-1 block">
                  Konfirmasi kata sandi belum sama
                </span>
              )}
            </div>

            <button
              type="submit"
              disabled={loading || !token || newPassword.length < 6 || newPassword !== confirmPassword}
              className="w-full py-3.5 px-5 mt-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 active:scale-[0.99] text-[#0F1712] font-['Barlow_Condensed'] font-black text-base uppercase tracking-wider transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 group"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-[#0F1712] border-t-transparent rounded-full animate-spin" />
                  <span>MENYIMPAN SANDI BARU...</span>
                </>
              ) : (
                <>
                  <span>SIMPAN KATA SANDI BARU</span>
                  <CheckCircle2 size={16} />
                </>
              )}
            </button>
          </form>
        )}

        {/* ─── STEP 3: SUKSES ─── */}
        {step === 3 && (
          <div className="text-center py-4 space-y-4">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-[0_0_24px_rgba(16,185,129,0.2)] animate-bounce">
              <CheckCircle2 size={32} />
            </div>

            <div>
              <h4 className="font-['Barlow_Condensed'] font-black text-2xl uppercase tracking-tight text-white">
                Kata Sandi Berhasil Diperbarui!
              </h4>
              <p className="text-xs sm:text-sm text-slate-300 mt-1 font-sans leading-relaxed">
                Kata sandi baru untuk akun <b className="text-emerald-400">{email}</b> telah aktif. Anda sekarang dapat masuk menggunakan kata sandi baru.
              </p>
            </div>

            <button
              type="button"
              onClick={handleFinish}
              className="w-full py-3.5 px-5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-[#0F1712] font-['Barlow_Condensed'] font-black text-base uppercase tracking-wider transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2"
            >
              <span>MASUK DENGAN KATA SANDI BARU</span>
              <ArrowRight size={16} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
