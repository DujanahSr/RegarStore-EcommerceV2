import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, ArrowRight, MailCheck, RotateCcw } from "lucide-react";
import toast from "react-hot-toast";
import api from "../../services/api";
import { useAuth, homePathFor } from "../../context/AuthContext";

export default function VerifyEmail() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [params] = useSearchParams();
  const email = (params.get("email") || "").trim().toLowerCase();

  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  // OTP baru saja dikirim saat register/login, jadi tombol kirim ulang langsung cooldown
  const [countdown, setCountdown] = useState(60);

  useEffect(() => {
    if (countdown <= 0) return undefined;
    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  const handleVerify = async (e) => {
    e.preventDefault();
    if (code.length !== 6) {
      setError("Masukkan 6 digit kode verifikasi dari email Anda.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await api.post("/auth/verify-email", { email, code });
      const user = login(res.data?.data);
      toast.success("Email terverifikasi. Selamat datang di RegarStore!");
      navigate(homePathFor(user));
    } catch (err) {
      const message = err.response?.data?.message || "Verifikasi gagal. Silakan coba lagi.";
      setError(message);
      setCode("");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    try {
      const res = await api.post("/auth/resend-verification", { email });
      toast.success(res.data?.message || "Kode baru telah dikirim.");
      setCountdown(60);
      setError("");
    } catch (err) {
      toast.error(err.response?.data?.message || "Gagal mengirim ulang kode.");
    }
  };

  if (!email) {
    return (
      <div className="min-h-screen bg-[#0F1712] text-[#FAF8F4] flex items-center justify-center px-6">
        <div className="text-center space-y-4">
          <p className="text-sm text-[#FAF8F4]/70">Link verifikasi tidak lengkap. Silakan masuk kembali untuk menerima kode verifikasi.</p>
          <Link to="/login" className="text-emerald-400 font-bold hover:underline">Ke Halaman Masuk</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0F1712] text-[#FAF8F4] flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-md">
        <Link
          to="/login"
          className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-[#FAF8F4]/60 hover:text-emerald-400 transition-colors mb-8"
        >
          <ArrowLeft size={14} />
          <span>Kembali Masuk</span>
        </Link>

        <div className="mb-8">
          <div className="inline-flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.2em] text-emerald-400 bg-emerald-950/80 border border-emerald-500/30 px-3 py-1 rounded mb-3">
            <MailCheck size={12} />
            VERIFIKASI EMAIL
          </div>
          <h1 className="font-['Barlow_Condensed'] font-black text-4xl sm:text-5xl uppercase tracking-tight text-white leading-none">
            AKTIFKAN AKUN ANDA
          </h1>
          <p className="text-sm text-[#FAF8F4]/60 mt-3">
            Kami mengirim kode 6 digit ke <span className="font-mono text-white">{email}</span>. Kode berlaku 15 menit.
          </p>
        </div>

        <form onSubmit={handleVerify} className="space-y-4">
          <div>
            <label htmlFor="otp-code" className="block text-[11px] font-mono uppercase tracking-wider text-[#FAF8F4]/70 mb-2">
              Kode Verifikasi 6 Digit
            </label>
            <div className="flex items-center bg-[#18221B] border border-white/10 rounded-xl focus-within:border-emerald-400 focus-within:ring-2 focus-within:ring-emerald-400/20 transition-all">
              <input
                id="otp-code"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                placeholder="Contoh: 853145"
                value={code}
                onChange={(e) => {
                  setCode(e.target.value.replace(/\D/g, ""));
                  setError("");
                }}
                className="w-full bg-transparent px-4 py-3.5 text-center text-2xl font-mono tracking-[8px] font-bold text-emerald-400 placeholder:tracking-normal placeholder:text-sm placeholder:text-white/20 focus:outline-none"
                autoFocus
              />
            </div>
            {error && <p className="mt-2 text-xs text-red-400">{error}</p>}
            <div className="flex items-center justify-between mt-2 text-[11px] text-slate-400">
              <span>Tidak menerima email? Cek folder spam.</span>
              {countdown > 0 ? (
                <span className="font-mono text-emerald-400">Kirim ulang ({countdown}s)</span>
              ) : (
                <button
                  type="button"
                  onClick={handleResend}
                  className="text-emerald-400 hover:underline flex items-center gap-1 font-semibold"
                >
                  <RotateCcw size={11} /> Kirim Ulang Kode
                </button>
              )}
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-4 px-6 rounded-xl bg-emerald-500 hover:bg-emerald-400 active:scale-[0.99] text-[#0F1712] font-['Barlow_Condensed'] font-black text-lg tracking-wider uppercase transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-[#0F1712] border-t-transparent rounded-full animate-spin" />
                <span>MEMVERIFIKASI...</span>
              </>
            ) : (
              <>
                <span>VERIFIKASI AKUN</span>
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
