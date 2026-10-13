import { useState } from "react";
import toast from "react-hot-toast";
import { CheckCircle2, KeyRound, Link2, Mail, ShieldCheck } from "lucide-react";
import api from "../../services/api";
import GoogleSignInButton from "../auth/GoogleSignInButton";

const cardBg = "bg-white border border-stone-200/80 shadow-xs text-stone-900";
const subText = "text-stone-500";
const inputBg =
  "bg-[#FAF8F4] border border-stone-300 text-stone-900 placeholder-stone-400 focus:border-[#162018] focus:bg-white focus:ring-2 focus:ring-[#162018]/10";
const labelCls =
  "block font-mono text-[11px] font-bold uppercase tracking-wider text-stone-700 mb-1.5 flex items-center gap-1.5";
const primaryBtn =
  "inline-flex items-center gap-2 rounded-xl px-6 py-3 font-condensed text-sm font-bold uppercase tracking-wider text-white bg-[#162018] hover:bg-black shadow-md transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer";

const GoogleLogo = () => (
  <svg width="20" height="20" viewBox="0 0 48 48" aria-hidden="true">
    <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
    <path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
    <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z" />
    <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
  </svg>
);

/** Kartu "Akun Pihak Ketiga Terhubung" di Pengaturan Akun > Keamanan. */
export function LinkedAccountsCard({ user, setUser }) {
  const [linking, setLinking] = useState(false);
  const googleConfigured = Boolean(import.meta.env.VITE_GOOGLE_CLIENT_ID);

  const handleLink = async (credential) => {
    setLinking(true);
    try {
      const res = await api.post("/auth/google/link", { credential });
      setUser(res.data?.data);
      toast.success("Akun Google berhasil dihubungkan!");
    } catch (err) {
      toast.error(err.response?.data?.message || "Gagal menghubungkan akun Google.");
    } finally {
      setLinking(false);
    }
  };

  return (
    <div className={`lg:col-span-3 rounded-3xl p-6 sm:p-8 ${cardBg}`}>
      <div className="flex items-center gap-2 font-condensed text-xl font-bold uppercase tracking-wide">
        <Link2 size={18} className="text-emerald-600" />
        Akun Pihak Ketiga Terhubung
      </div>
      <p className={`text-xs mt-1 mb-5 ${subText}`}>
        Masuk lebih cepat dengan akun pihak ketiga. Email akun pihak ketiga harus sama dengan email akun RegarStore Anda.
      </p>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-stone-200 p-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[#FAF8F4] border border-stone-200 flex items-center justify-center">
            <GoogleLogo />
          </div>
          <div>
            <p className="font-bold text-sm">Google</p>
            {user.googleLinked ? (
              <p className="text-xs text-emerald-700 flex items-center gap-1">
                <CheckCircle2 size={12} /> Terhubung dengan {user.email}
              </p>
            ) : (
              <p className={`text-xs ${subText}`}>
                Belum terhubung. Gunakan akun Google dengan email <span className="font-semibold">{user.email}</span>.
              </p>
            )}
          </div>
        </div>

        {!user.googleLinked && (
          <div className="sm:w-72">
            {googleConfigured ? (
              linking ? (
                <p className={`text-xs ${subText}`}>Menghubungkan...</p>
              ) : (
                <GoogleSignInButton text="continue_with" onCredential={handleLink} />
              )
            ) : (
              <p className={`text-xs ${subText}`}>Login Google belum dikonfigurasi di server.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/** Akun yang daftar via Google belum punya kata sandi: verifikasi email Google + OTP, lalu buat kata sandi. */
export function SetupPasswordForm({ user, setUser }) {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const requestCode = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.post("/auth/password/setup/request", { email: email.trim() });
      toast.success(res.data?.message || "Kode verifikasi telah dikirim.");
      setStep(2);
    } catch (err) {
      toast.error(err.response?.data?.message || "Gagal mengirim kode verifikasi.");
    } finally {
      setLoading(false);
    }
  };

  const savePassword = async (e) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      toast.error("Kata sandi baru minimal 6 karakter");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Konfirmasi kata sandi belum sama");
      return;
    }
    setLoading(true);
    try {
      const res = await api.post("/auth/password/setup", { code, newPassword });
      setUser(res.data?.data);
      toast.success("Kata sandi berhasil ditambahkan. Kini Anda juga bisa masuk dengan email & kata sandi.");
    } catch (err) {
      toast.error(err.response?.data?.message || "Gagal menyimpan kata sandi.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={step === 1 ? requestCode : savePassword}
      className={`lg:col-span-2 rounded-3xl p-6 sm:p-8 ${cardBg}`}
    >
      <div className="border-b border-stone-200/80 pb-4 mb-6">
        <h2 className="font-condensed text-xl font-bold uppercase tracking-wide">Atur Kata Sandi</h2>
        <p className={`text-xs mt-1 ${subText}`}>
          Akun Anda terdaftar via Google dan belum memiliki kata sandi. Masukkan email akun Google yang terhubung,
          lalu verifikasi dengan kode OTP yang kami kirim.
        </p>
      </div>

      {step === 1 ? (
        <div>
          <label htmlFor="setup-email" className={labelCls}>
            <Mail size={13} className="text-emerald-500" />
            Email Akun Google <span className="text-rose-500">*</span>
          </label>
          <input
            id="setup-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={user.email}
            className={`w-full rounded-xl px-4 py-3 text-sm transition outline-none ${inputBg}`}
            required
          />
        </div>
      ) : (
        <div className="space-y-4">
          <div>
            <label htmlFor="setup-code" className={labelCls}>
              <ShieldCheck size={13} className="text-emerald-500" />
              Kode OTP 6 Digit <span className="text-rose-500">*</span>
            </label>
            <input
              id="setup-code"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
              placeholder="Kode dari email Anda"
              className={`w-full rounded-xl px-4 py-3 text-sm font-mono tracking-[6px] transition outline-none ${inputBg}`}
              required
            />
          </div>
          <div>
            <label htmlFor="setup-password" className={labelCls}>
              <KeyRound size={13} className="text-emerald-500" />
              Kata Sandi Baru <span className="text-rose-500">*</span>
            </label>
            <input
              id="setup-password"
              type="password"
              autoComplete="new-password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Minimal 6 karakter"
              className={`w-full rounded-xl px-4 py-3 text-sm transition outline-none ${inputBg}`}
              required
            />
          </div>
          <div>
            <label htmlFor="setup-confirm" className={labelCls}>
              <KeyRound size={13} className="text-emerald-500" />
              Konfirmasi Kata Sandi Baru <span className="text-rose-500">*</span>
            </label>
            <input
              id="setup-confirm"
              type="password"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Ulangi kata sandi baru"
              className={`w-full rounded-xl px-4 py-3 text-sm transition outline-none ${inputBg}`}
              required
            />
          </div>
          <button type="button" onClick={() => setStep(1)} className="text-xs font-semibold text-emerald-700 hover:underline">
            Ganti email / kirim ulang kode
          </button>
        </div>
      )}

      <div className="mt-8 pt-6 border-t border-stone-200/80">
        <button type="submit" disabled={loading} className={primaryBtn}>
          <KeyRound size={16} />
          <span>
            {loading ? "Memproses..." : step === 1 ? "Kirim Kode Verifikasi" : "Simpan Kata Sandi"}
          </span>
        </button>
      </div>
    </form>
  );
}
