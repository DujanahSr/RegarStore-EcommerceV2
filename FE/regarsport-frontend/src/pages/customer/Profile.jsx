/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useState, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import toast from "react-hot-toast";
import {
  Calendar,
  Camera,
  Mail,
  RotateCcw,
  Save,
  User,
  Phone,
  MapPin,
  Building2,
  Lock,
  KeyRound,
  Shield,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  ShoppingBag,
  Truck,
  Package,
  ArrowRight,
  ExternalLink,
  LayoutDashboard,
  TrendingUp,
  Check,
  Clock,
  Trash2,
  FileText,
  Cloud,
  Compass,
  Award,
  Layers,
} from "lucide-react";

import api from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import { LinkedAccountsCard, SetupPasswordForm } from "../../components/customer/AccountConnections";
import { EmptyState, ScreenLoader } from "../../components/common/UiStates";
import { useConfirm } from "../../context/ConfirmContext";

export default function Profile() {
  const confirm = useConfirm();
  const { user, setUser, loading: authLoading } = useAuth();
  const location = useLocation();
  const fileInputRef = useRef(null);

  const isAdminRoute = location.pathname.startsWith("/admin");

  // Active Tab: "info" | "security" | "activity"
  const [activeTab, setActiveTab] = useState("info");

  // Profile Form State
  const [form, setForm] = useState({
    fullName: "",
    phoneNumber: "",
    address: "",
    city: "",
    postalCode: "",
    bio: "",
  });

  // Password Form State
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  // Password Visibility States
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

  // Avatar State
  const [imageFile, setImageFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [avatarError, setAvatarError] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  // Loading & Saving States
  const [savingProfile, setSavingProfile] = useState(false);
  const [loadingStats, setLoadingStats] = useState(false);

  // Dynamic Role Stats
  const [roleStats, setRoleStats] = useState({
    totalOrders: 0,
    totalSpent: 0,
    activeOrders: 0,
    completedOrders: 0,
    recentOrders: [],
    warehousePending: 0,
    warehouseShipped: 0,
    adminRevenue: 0,
    adminTotalOrders: 0,
    adminTotalUsers: 0,
  });

  // Initialize form from user context
  useEffect(() => {
    if (user) {
      setForm({
        fullName: user.fullName || user.full_name || "",
        phoneNumber: user.phoneNumber || user.phone_number || "",
        address: user.address || "",
        city: user.city || "",
        postalCode: user.postalCode || user.postal_code || "",
        bio: user.bio || "",
      });
      setPreviewUrl(user.avatarUrl || user.avatar_url || "");
    }
  }, [user]);

  // Handle local image file preview
  useEffect(() => {
    if (!imageFile) {
      setPreviewUrl(user?.avatarUrl || user?.avatar_url || "");
      return;
    }
    const objectUrl = URL.createObjectURL(imageFile);
    setPreviewUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [imageFile, user?.avatarUrl, user?.avatar_url]);

  // Fetch role-specific statistics
  useEffect(() => {
    if (!user) return;

    const fetchRoleData = async () => {
      setLoadingStats(true);
      try {
        if (user.role === "customer") {
          const res = await api.get("/orders/my-orders?page=1&size=20").catch(() => null);
          if (res?.data?.data) {
            const orders = res.data.data.content || res.data.data.items || [];
            const totalElements = res.data.data.totalElements || orders.length;

            const spent = orders
              .filter((o) => ["PAID", "SHIPPED", "COMPLETED"].includes(o.status))
              .reduce((sum, o) => sum + Number(o.totalAmount || 0), 0);

            const active = orders.filter((o) =>
              ["PENDING", "PAID", "SHIPPED"].includes(o.status)
            ).length;

            const completed = orders.filter((o) => o.status === "COMPLETED").length;

            setRoleStats((prev) => ({
              ...prev,
              totalOrders: totalElements,
              totalSpent: spent,
              activeOrders: active,
              completedOrders: completed,
              recentOrders: orders.slice(0, 3),
            }));
          }
        } else if (user.role === "logistics") {
          const res = await api.get("/orders?page=1&size=50").catch(() => null);
          if (res?.data?.data) {
            const orders = res.data.data.content || res.data.data.items || [];
            const pendingPack = orders.filter((o) => o.status === "PAID").length;
            const inTransit = orders.filter((o) => o.status === "SHIPPED").length;
            const completed = orders.filter((o) => o.status === "COMPLETED").length;

            setRoleStats((prev) => ({
              ...prev,
              warehousePending: pendingPack,
              warehouseShipped: inTransit,
              completedOrders: completed,
              recentOrders: orders.slice(0, 4),
            }));
          }
        } else if (user.role === "admin") {
          const [dashRes, usersRes] = await Promise.all([
            api.get("/orders/admin/dashboard").catch(() => null),
            api.get("/admin/users/stats").catch(() => null),
          ]);

          const dashData = dashRes?.data?.data || {};
          const usersData = usersRes?.data?.data || {};

          setRoleStats((prev) => ({
            ...prev,
            adminRevenue: dashData.totalRevenue || 0,
            adminTotalOrders: dashData.totalOrders || 0,
            adminTotalUsers: usersData.totalUsers || 0,
            warehousePending: dashData.paidOrders || 0,
            warehouseShipped: dashData.shippedOrders || 0,
          }));
        }
      } catch (err) {
        console.warn("Could not load stats for profile:", err);
      } finally {
        setLoadingStats(false);
      }
    };

    fetchRoleData();
  }, [user]);

  // Image selection handler - Upload ke Cloudinary dan simpan ke database
  const handleSelectImage = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("File harus berupa gambar (JPG, PNG, WEBP)");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Ukuran file maksimal 5MB");
      return;
    }

    setAvatarError(false);
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
    setImageFile(file);

    try {
      setUploadingAvatar(true);
      toast.loading("Mengunggah foto ke Cloudinary...", { id: "avatar-action" });
      const cdnUrl = await uploadAvatarToCloudinary(file);

      const payload = {
        fullName: (form.fullName || user?.fullName || user?.full_name || "User").trim(),
        avatarUrl: cdnUrl,
        phoneNumber: form.phoneNumber || user?.phoneNumber || "",
        address: form.address || user?.address || "",
        city: form.city || user?.city || "",
        postalCode: form.postalCode || user?.postalCode || "",
        bio: form.bio || user?.bio || "",
      };

      const res = await api.put("/auth/profile", payload);
      const updatedUser = res.data?.data || res.data?.user || res.data;

      setUser(updatedUser);
      setPreviewUrl(cdnUrl);
      setImageFile(null);
      toast.success("Foto profil berhasil diunggah ke Cloudinary dan disimpan!", { id: "avatar-action" });
    } catch (err) {
      console.error("Auto upload avatar error:", err);
      const msg = err.response?.data?.message || err.message || "Gagal mengunggah foto profil";
      toast.error(msg, { id: "avatar-action" });
      setPreviewUrl(user?.avatarUrl || user?.avatar_url || "");
    } finally {
      setUploadingAvatar(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  // Upload avatar to Cloudinary
  const uploadAvatarToCloudinary = async (fileToUpload) => {
    if (!fileToUpload) return user?.avatarUrl || user?.avatar_url || "";

    const formData = new FormData();
    formData.append("file", fileToUpload);
    formData.append("image", fileToUpload);
    formData.append("folder", "regarstore/avatars");

    setUploadingAvatar(true);
    try {
      const uploadRes = await api.post("/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const cdnUrl =
        uploadRes.data?.image_url ||
        uploadRes.data?.data?.imageUrl ||
        uploadRes.data?.url;

      if (!cdnUrl) {
        throw new Error("Gagal menerima URL dari Cloudinary CDN");
      }
      return cdnUrl;
    } finally {
      setUploadingAvatar(false);
    }
  };

  // Remove avatar
  const handleRemoveAvatar = async () => {
    if (!(await confirm({ title: "Hapus foto profil?", message: "Foto profil akan diganti dengan inisial nama Anda.", confirmLabel: "Hapus Foto", tone: "danger" }))) return;

    try {
      setSavingProfile(true);
      toast.loading("Menghapus foto profil...", { id: "avatar-action" });
      const res = await api.put("/auth/profile", {
        fullName: (form.fullName || user?.fullName || user?.full_name || "User").trim(),
        avatarUrl: "",
        phoneNumber: form.phoneNumber || user?.phoneNumber || "",
        address: form.address || user?.address || "",
        city: form.city || user?.city || "",
        postalCode: form.postalCode || user?.postalCode || "",
        bio: form.bio || user?.bio || "",
      });

      const updated = res.data?.data || res.data?.user || res.data;
      setUser({ ...updated, avatarUrl: "", avatar_url: "" });
      setImageFile(null);
      setPreviewUrl("");
      toast.success("Foto profil berhasil dihapus", { id: "avatar-action" });
    } catch (err) {
      toast.error(err.response?.data?.message || "Gagal menghapus foto profil", { id: "avatar-action" });
    } finally {
      setSavingProfile(false);
    }
  };

  // Save Profile Handler
  const handleSaveProfile = async (e) => {
    e.preventDefault();

    if (!form.fullName.trim()) {
      toast.error("Nama lengkap tidak boleh kosong");
      return;
    }

    if (form.phoneNumber.trim()) {
      const cleanPhone = form.phoneNumber.trim().replace(/[-\s]/g, "");
      if (!/^08\d{8,12}$/.test(cleanPhone)) {
        toast.error("Nomor HP/WA harus diawali 08 dan memiliki 10-13 digit angka");
        return;
      }
    }

    if (form.postalCode.trim() && !/^\d{5}$/.test(form.postalCode.trim())) {
      toast.error("Kode pos harus berupa 5 digit angka (contoh: 40171)");
      return;
    }

    try {
      setSavingProfile(true);

      let avatarUrl = user?.avatarUrl || user?.avatar_url || "";
      if (imageFile) {
        avatarUrl = await uploadAvatarToCloudinary(imageFile);
      }

      const payload = {
        fullName: form.fullName.trim(),
        avatarUrl: avatarUrl || "",
        phoneNumber: form.phoneNumber.trim(),
        address: form.address.trim(),
        city: form.city.trim(),
        postalCode: form.postalCode.trim(),
        bio: form.bio.trim(),
      };

      const res = await api.put("/auth/profile", payload);
      const updatedUser = res.data?.data || res.data?.user || res.data;

      setUser(updatedUser);
      setImageFile(null);
      setPreviewUrl(avatarUrl);
      toast.success("Profil berhasil diperbarui!");
    } catch (error) {
      console.error("Save profile error:", error);
      const msg = error.response?.data?.message || error.message || "Gagal memperbarui profil";
      toast.error(msg);
    } finally {
      setSavingProfile(false);
    }
  };

  // Reset Profile Form
  const handleResetProfile = () => {
    if (user) {
      setForm({
        fullName: user.fullName || user.full_name || "",
        phoneNumber: user.phoneNumber || user.phone_number || "",
        address: user.address || "",
        city: user.city || "",
        postalCode: user.postalCode || user.postal_code || "",
        bio: user.bio || "",
      });
      setImageFile(null);
      setPreviewUrl(user.avatarUrl || user.avatar_url || "");
      setAvatarError(false);
      toast("Form profil di-reset ke data semula", { icon: "🔄" });
    }
  };

  // Change Password Handler
  const handleChangePassword = async (e) => {
    e.preventDefault();

    if (!passwordForm.currentPassword) {
      toast.error("Masukkan kata sandi saat ini");
      return;
    }

    if (!passwordForm.newPassword) {
      toast.error("Masukkan kata sandi baru");
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      toast.error("Kata sandi baru minimal 6 karakter");
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error("Konfirmasi kata sandi baru tidak cocok");
      return;
    }

    try {
      setChangingPassword(true);
      await api.put("/auth/password", {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });

      toast.success("Kata sandi berhasil diperbarui dengan aman!");
      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (error) {
      const msg =
        error.response?.data?.message ||
        "Gagal mengganti kata sandi. Pastikan sandi saat ini benar.";
      toast.error(msg);
    } finally {
      setChangingPassword(false);
    }
  };

  // Password strength helper
  const getPasswordStrength = (pass) => {
    if (!pass) return { score: 0, text: "Belum diisi", color: "bg-stone-200" };
    let score = 0;
    if (pass.length >= 6) score += 1;
    if (pass.length >= 10) score += 1;
    if (/[A-Z]/.test(pass) && /[a-z]/.test(pass)) score += 1;
    if (/\d/.test(pass)) score += 1;
    if (/[^A-Za-z0-9]/.test(pass)) score += 1;

    if (score <= 1) return { score: 1, text: "Sangat Lemah", color: "bg-rose-500" };
    if (score === 2) return { score: 2, text: "Cukup", color: "bg-amber-500" };
    if (score === 3) return { score: 3, text: "Kuat", color: "bg-emerald-500" };
    return { score: 4, text: "Sangat Kuat", color: "bg-emerald-600" };
  };

  const strength = getPasswordStrength(passwordForm.newPassword);

  if (authLoading) {
    return <ScreenLoader label="Memuat profil akun..." />;
  }

  if (!user) {
    return (
      <EmptyState
        title="Profil tidak tersedia"
        description="Silakan login ulang untuk melihat profil Anda."
      />
    );
  }

  const joinDate = user.createdAt
    ? new Date(user.createdAt).toLocaleDateString("id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "-";

  const roleConfig = {
    customer: {
      title: "KORPS KAPTEEN RESMI",
      subTitle: "MEMBER ATELIER CICENDO BANDUNG",
      badgeClass: isAdminRoute
        ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
        : "bg-[#162018] text-white border border-[#243327]",
      icon: ShoppingBag,
    },
    logistics: {
      title: "DIVISI OPERASIONAL LOGISTIK",
      subTitle: "ATELIER CICENDO BANDUNG HUB",
      badgeClass: isAdminRoute
        ? "bg-purple-500/20 text-purple-400 border border-purple-500/30"
        : "bg-purple-900 text-purple-200 border border-purple-700",
      icon: Truck,
    },
    admin: {
      title: "SUPER ADMINISTRATOR / OWNER",
      subTitle: "REGARSTORE CENTRAL HEADQUARTERS",
      badgeClass: isAdminRoute
        ? "bg-teal-500/20 text-teal-400 border border-teal-500/30"
        : "bg-stone-900 text-stone-100 border border-stone-700",
      icon: Shield,
    },
  }[user.role] || {
    title: "PENGGUNA RESMI",
    subTitle: "REGARSTORE ATELIER",
    badgeClass: "bg-stone-100 text-stone-700 border border-stone-200",
    icon: User,
  };

  const RoleIcon = roleConfig.icon;

  const cardBg = "bg-white border border-stone-200/80 shadow-xs text-stone-900";
  const subText = "text-stone-500";
  const inputBg = "bg-[#FAF8F4] border-stone-300 text-stone-900 placeholder-stone-400 focus:border-[#162018] focus:bg-white focus:ring-2 focus:ring-[#162018]/10";

  return (
    <div className="min-h-screen bg-[#FAF8F4] text-stone-900 py-8 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl space-y-6">
        
        {/* Tactical Captain Identity Card */}
        <div className="relative overflow-hidden rounded-3xl p-6 sm:p-8 bg-[#162018] text-white border border-[#243327] shadow-xl">
          {/* Topographic Background Overlay */}
          <div className="absolute inset-0 z-0">
            <img
              src="/images/warehouse_hero_bg.jpg"
              alt="Atelier Background"
              className="w-full h-full object-cover object-center filter brightness-[0.25] contrast-125"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-[#162018] via-[#162018]/90 to-transparent" />
            <div className="absolute inset-0 bg-topography opacity-15 mix-blend-overlay pointer-events-none" />
          </div>

          <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            {/* Avatar & Captain Identity */}
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 text-center sm:text-left">
              
              {/* Tactical Avatar Frame */}
              <div className="relative group shrink-0">
                <div className="relative h-28 w-28 sm:h-32 sm:w-32 rounded-2xl overflow-hidden ring-2 ring-emerald-500/40 bg-stone-950/80 shadow-2xl flex items-center justify-center border border-white/10">
                  {previewUrl && !avatarError ? (
                    <img
                      src={previewUrl}
                      alt={user.fullName || "Avatar"}
                      className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                      onError={() => setAvatarError(true)}
                    />
                  ) : (
                    <span className="font-condensed text-4xl font-extrabold text-emerald-400 tracking-wider">
                      {user.fullName?.charAt(0)?.toUpperCase() || "U"}
                    </span>
                  )}

                  {/* Loading overlay while uploading */}
                  {uploadingAvatar && (
                    <div className="absolute inset-0 bg-black/75 backdrop-blur-xs flex flex-col items-center justify-center text-white text-xs gap-1.5 z-20">
                      <div className="h-5 w-5 animate-spin rounded-full border-2 border-emerald-400 border-t-transparent" />
                      <span className="font-mono text-[10px] tracking-wider uppercase">Cloudinary CDN...</span>
                    </div>
                  )}
                </div>

                {/* Camera Trigger Button */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={savingProfile || uploadingAvatar}
                  className="absolute -bottom-2 -right-2 flex h-9 w-9 items-center justify-center rounded-xl bg-[#B9382B] hover:bg-[#9E2D22] text-white shadow-lg transition transform hover:scale-110 active:scale-95 disabled:opacity-50 border border-white/20"
                  title="Ganti Foto Profil"
                >
                  <Camera size={15} />
                </button>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png, image/jpeg, image/webp, image/gif"
                  onChange={handleSelectImage}
                  className="hidden"
                />
              </div>

              {/* Identity & Captain Metadata */}
              <div className="space-y-2.5">
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full font-mono text-[10px] font-extrabold tracking-wider uppercase ${
                    isAdminRoute ? "bg-white/10 text-emerald-300" : "bg-white/10 text-emerald-400 border border-white/10"
                  }`}>
                    <RoleIcon size={12} />
                    {roleConfig.title}
                  </span>

                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-mono text-[10px] font-bold text-emerald-300 bg-emerald-500/20 border border-emerald-500/30 uppercase tracking-widest">
                    <CheckCircle2 size={11} />
                    TERVERIFIKASI
                  </span>
                </div>

                <div>
                  <h1 className="font-condensed text-2xl sm:text-3xl font-black uppercase tracking-tight text-white">
                    {user.fullName || user.full_name}
                  </h1>
                  <p className="font-mono text-xs text-stone-400 tracking-wider uppercase">
                    {roleConfig.subTitle}
                  </p>
                </div>

                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 font-mono text-xs text-stone-300">
                  <span className="flex items-center gap-1.5">
                    <Mail size={13} className="text-emerald-400" />
                    {user.email}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Calendar size={13} className="text-emerald-400" />
                    BERGABUNG: <strong className="text-white">{joinDate}</strong>
                  </span>
                </div>

                {/* Bio snippet */}
                {user.bio ? (
                  <p className="text-xs italic line-clamp-2 max-w-md pt-1 text-stone-400">
                    &ldquo;{user.bio}&rdquo;
                  </p>
                ) : null}

                {/* Cloudinary CDN Indicator & Delete Action */}
                <div className="flex items-center justify-center sm:justify-start gap-3 pt-1">
                  <span className="inline-flex items-center gap-1.5 font-mono text-[11px] text-emerald-400/90">
                    <Cloud size={12} />
                    Cloudinary CDN Synchronized
                  </span>

                  {(user.avatarUrl || user.avatar_url || imageFile) && (
                    <button
                      type="button"
                      onClick={handleRemoveAvatar}
                      disabled={savingProfile}
                      className="inline-flex items-center gap-1 font-mono text-[11px] font-bold text-rose-400 hover:text-rose-300 transition"
                    >
                      <Trash2 size={11} />
                      Hapus Foto
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Quick Action Button */}
            <div className="flex flex-col sm:flex-row lg:flex-col gap-2 shrink-0 self-center lg:self-center">
              {user.role === "customer" && (
                <Link
                  to="/dashboard"
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#B9382B] hover:bg-[#9E2D22] px-5 py-3 font-condensed text-sm font-bold uppercase tracking-wider text-white shadow-lg shadow-black/30 transition transform hover:-translate-y-0.5"
                >
                  <ShoppingBag size={16} />
                  <span>Jelajahi Katalog Toko</span>
                </Link>
              )}

              {user.role === "logistics" && (
                <Link
                  to="/admin/orders"
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#B9382B] hover:bg-[#9E2D22] px-5 py-3 font-condensed text-sm font-bold uppercase tracking-wider text-white shadow-lg transition active:scale-95"
                >
                  <Truck size={16} />
                  <span>Antrean Pesanan Gudang</span>
                </Link>
              )}

              {user.role === "admin" && (
                <Link
                  to="/admin"
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 px-5 py-3 font-condensed text-sm font-bold uppercase tracking-wider text-white shadow-lg transition active:scale-95"
                >
                  <LayoutDashboard size={16} />
                  <span>Buka Admin Dashboard</span>
                </Link>
              )}
            </div>
          </div>

          {/* Tactical Metric Grid */}
          <div className="mt-8 grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4 border-t border-white/10 pt-6">
            {user.role === "customer" && (
              <>
                <div className="rounded-2xl p-4 bg-white/5 border border-white/10 backdrop-blur-xs">
                  <div className="flex items-center gap-1.5 font-mono text-[11px] font-bold text-stone-400 uppercase mb-1">
                    <ShoppingBag size={13} className="text-emerald-400" />
                    Total Transaksi
                  </div>
                  <div className="font-condensed text-2xl sm:text-3xl font-black text-white">
                    {loadingStats ? "..." : roleStats.totalOrders} <span className="font-sans text-xs font-normal text-stone-400">Pesanan</span>
                  </div>
                </div>

                <div className="rounded-2xl p-4 bg-white/5 border border-white/10 backdrop-blur-xs">
                  <div className="flex items-center gap-1.5 font-mono text-[11px] font-bold text-stone-400 uppercase mb-1">
                    <Award size={13} className="text-amber-400" />
                    Akumulasi Belanja
                  </div>
                  <div className="font-condensed text-2xl sm:text-3xl font-black text-white">
                    {loadingStats ? "..." : `Rp ${roleStats.totalSpent.toLocaleString("id-ID")}`}
                  </div>
                </div>

                <div className="col-span-2 md:col-span-1 rounded-2xl p-4 bg-white/5 border border-white/10 backdrop-blur-xs">
                  <div className="flex items-center gap-1.5 font-mono text-[11px] font-bold text-stone-400 uppercase mb-1">
                    <Package size={13} className="text-emerald-400" />
                    Pesanan Aktif
                  </div>
                  <div className="font-condensed text-2xl sm:text-3xl font-black text-white">
                    {loadingStats ? "..." : roleStats.activeOrders} <span className="font-sans text-xs font-normal text-stone-400">Dalam Proses</span>
                  </div>
                </div>
              </>
            )}

            {user.role === "logistics" && (
              <>
                <div className="rounded-2xl p-4 bg-white/5 border border-white/10">
                  <div className="flex items-center gap-1.5 font-mono text-[11px] font-bold text-amber-400 uppercase mb-1">
                    <Package size={13} />
                    Perlu Dikemas (Paid)
                  </div>
                  <div className="font-condensed text-2xl font-black text-white">
                    {loadingStats ? "..." : roleStats.warehousePending} <span className="text-xs font-normal text-stone-400">Siap Kemas</span>
                  </div>
                </div>

                <div className="rounded-2xl p-4 bg-white/5 border border-white/10">
                  <div className="flex items-center gap-1.5 font-mono text-[11px] font-bold text-emerald-400 uppercase mb-1">
                    <Truck size={13} />
                    Dalam Pengiriman
                  </div>
                  <div className="font-condensed text-2xl font-black text-white">
                    {loadingStats ? "..." : roleStats.warehouseShipped} <span className="text-xs font-normal text-stone-400">Di Kurir</span>
                  </div>
                </div>

                <div className="col-span-2 md:col-span-1 rounded-2xl p-4 bg-white/5 border border-white/10">
                  <div className="flex items-center gap-1.5 font-mono text-[11px] font-bold text-slate-300 uppercase mb-1">
                    <Building2 size={13} />
                    Fasilitas Hub
                  </div>
                  <div className="font-condensed text-lg font-bold text-white truncate">
                    Atelier Cicendo Bandung Hub
                  </div>
                </div>
              </>
            )}

            {user.role === "admin" && (
              <>
                <div className="rounded-2xl p-4 bg-white/5 border border-white/10">
                  <div className="flex items-center gap-1.5 font-mono text-[11px] font-bold text-teal-400 uppercase mb-1">
                    <TrendingUp size={13} />
                    Total Omzet
                  </div>
                  <div className="font-condensed text-2xl font-black text-white">
                    {loadingStats ? "..." : `Rp ${Number(roleStats.adminRevenue || 0).toLocaleString("id-ID")}`}
                  </div>
                </div>

                <div className="rounded-2xl p-4 bg-white/5 border border-white/10">
                  <div className="flex items-center gap-1.5 font-mono text-[11px] font-bold text-teal-400 uppercase mb-1">
                    <ShoppingBag size={13} />
                    Total Pesanan
                  </div>
                  <div className="font-condensed text-2xl font-black text-white">
                    {loadingStats ? "..." : roleStats.adminTotalOrders} <span className="text-xs font-normal text-stone-400">Order</span>
                  </div>
                </div>

                <div className="col-span-2 md:col-span-1 rounded-2xl p-4 bg-white/5 border border-white/10">
                  <div className="flex items-center gap-1.5 font-mono text-[11px] font-bold text-teal-400 uppercase mb-1">
                    <User size={13} />
                    Pengguna
                  </div>
                  <div className="font-condensed text-2xl font-black text-white">
                    {loadingStats ? "..." : roleStats.adminTotalUsers} <span className="text-xs font-normal text-stone-400">Akun</span>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Tactical Tabs Navigation */}
        <div className="flex border-b border-stone-200 dark:border-white/10 gap-2 sm:gap-4 overflow-x-auto pb-1">
          <button
            type="button"
            onClick={() => setActiveTab("info")}
            className={`flex items-center gap-2 px-4 py-3 font-condensed text-sm font-bold uppercase tracking-wider border-b-2 transition whitespace-nowrap cursor-pointer ${
              activeTab === "info"
                ? "border-[#B9382B] text-[#B9382B]"
                : "border-transparent text-stone-400 hover:text-stone-700"
            }`}
          >
            <User size={16} />
            <span>
              {user.role === "logistics"
                ? "01. Data Profil & Kontak Gudang"
                : user.role === "admin"
                ? "01. Data Profil Administrator"
                : "01. Data Diri & Alamat Pengiriman"}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("security")}
            className={`flex items-center gap-2 px-4 py-3 font-condensed text-sm font-bold uppercase tracking-wider border-b-2 transition whitespace-nowrap cursor-pointer ${
              activeTab === "security"
                ? "border-[#B9382B] text-[#B9382B]"
                : "border-transparent text-stone-400 hover:text-stone-700"
            }`}
          >
            <KeyRound size={16} />
            <span>02. Keamanan &amp; Sandi</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("activity")}
            className={`flex items-center gap-2 px-4 py-3 font-condensed text-sm font-bold uppercase tracking-wider border-b-2 transition whitespace-nowrap cursor-pointer ${
              activeTab === "activity"
                ? "border-[#B9382B] text-[#B9382B]"
                : "border-transparent text-stone-400 hover:text-stone-700"
            }`}
          >
            <Clock size={16} />
            <span>03. Riwayat &amp; Aktivitas</span>
          </button>
        </div>

        {/* Tab 1: Informasi Profil & Kontak */}
        {activeTab === "info" && (
          <form onSubmit={handleSaveProfile} className={`rounded-3xl p-6 sm:p-8 ${cardBg}`}>
            <div className="border-b border-stone-200/80 pb-4 mb-6">
              <h2 className="font-condensed text-xl font-bold uppercase tracking-wide text-slate-900">
                {user.role === "logistics"
                  ? "Identitas Petugas Operasional & Kontak Logistik"
                  : user.role === "admin"
                  ? "Identitas Administrator & Super User"
                  : "Identitas Kapten & Alamat Ekspedisi"}
              </h2>
              <p className={`text-xs mt-1 ${subText}`}>
                {user.role === "logistics"
                  ? "Informasi profil staf logistik, kontak darurat, dan koordinasi hub Cicendo Bandung."
                  : user.role === "admin"
                  ? "Informasi akun administrator sentral dan konfigurasi profil sistem RegarStore."
                  : "Data kontak dan alamat Anda akan otomatis disinkronkan saat proses checkout pesanan jersey di Atelier Cicendo."}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Nama Lengkap */}
              <div>
                <label className="block font-mono text-[11px] font-bold uppercase tracking-wider text-stone-700 dark:text-white/80 mb-1.5 flex items-center gap-1.5">
                  <User size={13} className="text-emerald-500" />
                  Nama Lengkap <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.fullName}
                  onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                  placeholder="Nama lengkap Anda"
                  className={`w-full rounded-xl px-4 py-3 text-sm transition outline-none ${inputBg}`}
                  required
                />
              </div>

              {/* Email (Read Only) */}
              <div>
                <label className="block font-mono text-[11px] font-bold uppercase tracking-wider text-stone-700 dark:text-white/80 mb-1.5 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Mail size={13} className="text-emerald-500" />
                    Alamat Email Terdaftar
                  </span>
                  <span className="font-mono text-[10px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-500/20 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-500/30">
                    TERVERIFIKASI
                  </span>
                </label>
                <input
                  type="email"
                  value={user.email}
                  disabled
                  className={`w-full rounded-xl px-4 py-3 text-sm opacity-70 cursor-not-allowed ${inputBg}`}
                />
                <p className={`text-[11px] mt-1 ${subText}`}>
                  Alamat email terikat pada sistem keamanan akun dan digunakan untuk konfirmasi faktur.
                </p>
              </div>

              {/* No. WhatsApp / HP */}
              <div>
                <label className="block font-mono text-[11px] font-bold uppercase tracking-wider text-stone-700 dark:text-white/80 mb-1.5 flex items-center gap-1.5">
                  <Phone size={13} className="text-emerald-500" />
                  Nomor WhatsApp / Kontak Aktif
                </label>
                <input
                  type="tel"
                  value={form.phoneNumber}
                  onChange={(e) => setForm({ ...form, phoneNumber: e.target.value })}
                  placeholder="Contoh: 081234567890"
                  className={`w-full rounded-xl px-4 py-3 text-sm font-mono transition outline-none ${inputBg}`}
                />
                <p className={`text-[11px] mt-1 ${subText}`}>
                  Digunakan untuk konfirmasi resi kurir dan koordinasi mockup nameset jersey.
                </p>
              </div>

              {/* Kota / Kabupaten */}
              <div>
                <label className="block font-mono text-[11px] font-bold uppercase tracking-wider text-stone-700 dark:text-white/80 mb-1.5 flex items-center gap-1.5">
                  <Building2 size={13} className="text-emerald-500" />
                  Kota / Kabupaten
                </label>
                <input
                  type="text"
                  value={form.city}
                  onChange={(e) => setForm({ ...form, city: e.target.value })}
                  placeholder="Contoh: Bandung, Jakarta Selatan, Surabaya"
                  className={`w-full rounded-xl px-4 py-3 text-sm transition outline-none ${inputBg}`}
                />
              </div>

              {/* Kode Pos */}
              <div>
                <label className="block font-mono text-[11px] font-bold uppercase tracking-wider text-stone-700 dark:text-white/80 mb-1.5 flex items-center gap-1.5">
                  <Compass size={13} className="text-emerald-500" />
                  Kode Pos
                </label>
                <input
                  type="text"
                  maxLength={5}
                  value={form.postalCode}
                  onChange={(e) => setForm({ ...form, postalCode: e.target.value.replace(/\D/g, "") })}
                  placeholder="Contoh: 40171"
                  className={`w-full rounded-xl px-4 py-3 text-sm font-mono transition outline-none ${inputBg}`}
                />
              </div>

              {/* Bio / Motto */}
              <div>
                <label className="block font-mono text-[11px] font-bold uppercase tracking-wider text-stone-700 dark:text-white/80 mb-1.5 flex items-center gap-1.5">
                  <FileText size={13} className="text-emerald-500" />
                  Nama Tim Olahraga / Bio Singkat
                </label>
                <input
                  type="text"
                  maxLength={150}
                  value={form.bio}
                  onChange={(e) => setForm({ ...form, bio: e.target.value })}
                  placeholder="Contoh: Kapten Garuda FC // Bandung"
                  className={`w-full rounded-xl px-4 py-3 text-sm transition outline-none ${inputBg}`}
                />
              </div>

              {/* Alamat Lengkap Pengiriman (Full Width) */}
              <div className="md:col-span-2">
                <label className="block font-mono text-[11px] font-bold uppercase tracking-wider text-stone-700 dark:text-white/80 mb-1.5 flex items-center gap-1.5">
                  <MapPin size={13} className="text-emerald-500" />
                  Alamat Lengkap Pengiriman (Jalan, Nomor, Patokan, RT/RW, Kecamatan)
                </label>
                <textarea
                  rows={3}
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  placeholder="Contoh: Jl. Pasir Kaliki No. 123, RT 02/05, Kel. Pasirkaliki, Kec. Cicendo..."
                  className={`w-full rounded-xl p-4 text-sm transition outline-none resize-y ${inputBg}`}
                />
                <p className={`text-[11px] mt-1 ${subText}`}>
                  Alamat ini otomatis menjadi rujukan ekspedisi kurir saat melakukan checkout.
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="mt-8 flex flex-wrap items-center gap-3 pt-6 border-t border-stone-200/80">
              <button
                type="submit"
                disabled={savingProfile || uploadingAvatar}
                className="inline-flex items-center gap-2 rounded-xl px-6 py-3 font-condensed text-sm font-bold uppercase tracking-wider text-white bg-[#162018] hover:bg-black shadow-md transition transform hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                <Save size={16} />
                <span>{savingProfile ? "Menyimpan ke Server..." : "Simpan Perubahan Profil"}</span>
              </button>

              <button
                type="button"
                onClick={handleResetProfile}
                disabled={savingProfile}
                className="inline-flex items-center gap-2 rounded-xl px-5 py-3 font-condensed text-sm font-bold uppercase tracking-wider border border-stone-300 hover:bg-stone-100 text-stone-700 transition cursor-pointer"
              >
                <RotateCcw size={16} />
                <span>Reset</span>
              </button>
            </div>
          </form>
        )}

        {/* Tab 2: Keamanan Akun & Sandi */}
        {activeTab === "security" && (
          <div className="grid gap-6 lg:grid-cols-3">
            <LinkedAccountsCard user={user} setUser={setUser} />

            {!user.hasPassword ? (
              <SetupPasswordForm user={user} setUser={setUser} />
            ) : (
            <form
              onSubmit={handleChangePassword}
              className={`lg:col-span-2 rounded-3xl p-6 sm:p-8 ${cardBg}`}
            >
              <div className="border-b border-stone-200/80 dark:border-white/10 pb-4 mb-6">
                <h2 className="font-condensed text-xl font-bold uppercase tracking-wide">
                  Perbarui Kata Sandi Akun
                </h2>
                <p className={`text-xs mt-1 ${subText}`}>
                  Gunakan kombinasi kata sandi yang kuat untuk menjaga keamanan data pesanan Anda.
                </p>
              </div>

              <div className="space-y-4">
                {/* Kata Sandi Saat Ini */}
                <div>
                  <label className="block font-mono text-[11px] font-bold uppercase tracking-wider text-stone-700 dark:text-white/80 mb-1.5 flex items-center gap-1.5">
                    <Lock size={13} className="text-emerald-500" />
                    Kata Sandi Saat Ini <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showCurrentPassword ? "text" : "password"}
                      value={passwordForm.currentPassword}
                      onChange={(e) =>
                        setPasswordForm({ ...passwordForm, currentPassword: e.target.value })
                      }
                      placeholder="Masukkan kata sandi lama Anda"
                      className={`w-full rounded-xl px-4 py-3 pr-12 text-sm transition outline-none ${inputBg}`}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 dark:hover:text-white"
                    >
                      {showCurrentPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                {/* Kata Sandi Baru */}
                <div>
                  <label className="block font-mono text-[11px] font-bold uppercase tracking-wider text-stone-700 dark:text-white/80 mb-1.5 flex items-center gap-1.5">
                    <KeyRound size={13} className="text-emerald-500" />
                    Kata Sandi Baru <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showNewPassword ? "text" : "password"}
                      value={passwordForm.newPassword}
                      onChange={(e) =>
                        setPasswordForm({ ...passwordForm, newPassword: e.target.value })
                      }
                      placeholder="Minimal 6 karakter kombinasi"
                      className={`w-full rounded-xl px-4 py-3 pr-12 text-sm transition outline-none ${inputBg}`}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 dark:hover:text-white"
                    >
                      {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>

                  {/* Password Strength Meter */}
                  {passwordForm.newPassword && (
                    <div className="mt-2.5 space-y-1.5">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className={subText}>Kekuatan Sandi:</span>
                        <span className="font-bold text-stone-800 dark:text-white">{strength.text}</span>
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-stone-200 dark:bg-white/10 overflow-hidden">
                        <div
                          className={`h-full transition-all duration-300 ${strength.color}`}
                          style={{ width: `${(strength.score / 4) * 100}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Konfirmasi Kata Sandi Baru */}
                <div>
                  <label className="block font-mono text-[11px] font-bold uppercase tracking-wider text-stone-700 dark:text-white/80 mb-1.5 flex items-center gap-1.5">
                    <ShieldCheck size={13} className="text-emerald-500" />
                    Konfirmasi Kata Sandi Baru <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      value={passwordForm.confirmPassword}
                      onChange={(e) =>
                        setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })
                      }
                      placeholder="Ulangi kata sandi baru"
                      className={`w-full rounded-xl px-4 py-3 pr-12 text-sm transition outline-none ${inputBg}`}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 dark:hover:text-white"
                    >
                      {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>

                  {/* Match indicator */}
                  {passwordForm.confirmPassword && (
                    <p
                      className={`text-[11px] mt-1.5 flex items-center gap-1 font-semibold ${
                        passwordForm.newPassword === passwordForm.confirmPassword
                          ? "text-emerald-600"
                          : "text-rose-500"
                      }`}
                    >
                      {passwordForm.newPassword === passwordForm.confirmPassword ? (
                        <>
                          <Check size={13} />
                          Kata sandi baru cocok
                        </>
                      ) : (
                        <>
                          <AlertCircle size={13} />
                          Konfirmasi kata sandi belum sama
                        </>
                      )}
                    </p>
                  )}
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-stone-200/80">
                <button
                  type="submit"
                  disabled={changingPassword}
                  className="inline-flex items-center gap-2 rounded-xl px-6 py-3 font-condensed text-sm font-bold uppercase tracking-wider text-white bg-[#162018] hover:bg-black shadow-md transition transform hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  <Lock size={16} />
                  <span>{changingPassword ? "Menyimpan Sandi..." : "Perbarui Kata Sandi Sekarang"}</span>
                </button>
              </div>
            </form>
            )}

            {/* Security Info Card */}
            <div className={`rounded-3xl p-6 space-y-4 ${cardBg} h-fit`}>
              <div className="flex items-center gap-2 font-condensed text-base font-bold uppercase tracking-wide text-emerald-600">
                <Shield size={18} />
                Protokol Keamanan Akun
              </div>
              <p className={`text-xs leading-relaxed ${subText}`}>
                Untuk melindungi transaksi dan privasi belanja Anda, patuhi standar berikut:
              </p>
              <ul className={`space-y-2.5 text-xs ${subText}`}>
                <li className="flex items-start gap-2">
                  <CheckCircle2 size={14} className="text-emerald-500 shrink-0 mt-0.5" />
                  <span>Minimal 6 karakter kombinasi huruf besar, huruf kecil, dan angka.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 size={14} className="text-emerald-500 shrink-0 mt-0.5" />
                  <span>Jangan gunakan kata sandi yang sama dengan akun media sosial Anda.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 size={14} className="text-emerald-500 shrink-0 mt-0.5" />
                  <span>Kata sandi diamankan menggunakan hashing terenkripsi BCrypt standar perbankan.</span>
                </li>
              </ul>
            </div>
          </div>
        )}

        {/* Tab 3: Ringkasan Aktivitas & Transaksi Cepat */}
        {activeTab === "activity" && (
          <div className="space-y-6">
            {user.role === "customer" && (
              <div className={`rounded-3xl p-6 sm:p-8 ${cardBg}`}>
                <div className="flex items-center justify-between border-b border-stone-200/80 dark:border-white/10 pb-4 mb-6">
                  <div>
                    <h2 className="font-condensed text-xl font-bold uppercase tracking-wide">
                      Pesanan Terbaru Anda
                    </h2>
                    <p className={`text-xs mt-1 ${subText}`}>
                      Pantau proses manufaktur dan ekspedisi jersey RegarStore Anda langsung dari Atelier Bandung.
                    </p>
                  </div>
                  <Link
                    to="/dashboard/my-orders"
                    className="inline-flex items-center gap-1 font-condensed text-xs sm:text-sm font-bold uppercase tracking-wider text-[#B9382B] hover:text-[#9E2D22] transition"
                  >
                    <span>Lihat Semua Pesanan</span>
                    <ArrowRight size={14} />
                  </Link>
                </div>

                {roleStats.recentOrders.length === 0 ? (
                  <div className="text-center py-12 space-y-3">
                    <ShoppingBag size={40} className="mx-auto text-stone-300 dark:text-white/20" />
                    <p className={`text-sm font-medium ${subText}`}>
                      Anda belum memiliki riwayat pesanan.
                    </p>
                    <Link
                      to="/dashboard"
                      className="inline-flex items-center gap-2 rounded-xl bg-[#162018] px-5 py-2.5 font-condensed text-xs font-bold uppercase tracking-wider text-white shadow-md hover:bg-stone-900 transition"
                    >
                      <span>Mulai Belanja Produk Olahraga</span>
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {roleStats.recentOrders.map((order) => (
                      <div
                        key={order.id}
                        className={`flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-2xl border transition ${
                          isAdminRoute
                            ? "border-white/10 bg-white/5 hover:bg-white/10"
                            : "border-stone-200/80 bg-[#FAF8F4] hover:bg-stone-100"
                        }`}
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-xs text-[#162018] dark:text-emerald-400">
                              #{order.orderNumber || order.order_number || `ORD-${order.id}`}
                            </span>
                            <span
                              className={`px-2 py-0.5 rounded-full font-mono text-[10px] font-bold ${
                                order.status === "COMPLETED"
                                  ? "bg-emerald-100 text-emerald-800"
                                  : order.status === "SHIPPED"
                                  ? "bg-blue-100 text-blue-800"
                                  : order.status === "PAID"
                                  ? "bg-purple-100 text-purple-800"
                                  : "bg-amber-100 text-amber-800"
                              }`}
                            >
                              {order.status}
                            </span>
                          </div>
                          <div className={`text-xs ${subText}`}>
                            {new Date(order.createdAt || order.created_at).toLocaleDateString("id-ID", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })}
                          </div>
                        </div>

                        <div className="mt-3 sm:mt-0 flex items-center justify-between sm:gap-6">
                          <div className="text-right">
                            <div className="font-condensed text-base font-black text-stone-900 dark:text-white">
                              Rp {Number(order.totalAmount || 0).toLocaleString("id-ID")}
                            </div>
                            <div className={`font-mono text-[11px] ${subText}`}>
                              {order.items?.length || 1} Item Produk
                            </div>
                          </div>

                          <Link
                            to={`/dashboard/orders/${order.id}`}
                            className="inline-flex items-center gap-1.5 font-condensed text-xs font-bold uppercase tracking-wider text-stone-800 dark:text-white bg-white dark:bg-white/10 px-3.5 py-2 rounded-xl border border-stone-200 dark:border-white/10 transition shadow-xs hover:border-stone-400"
                          >
                            <span>Detail</span>
                            <ExternalLink size={12} />
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {user.role === "logistics" && (
              <div className={`rounded-3xl p-6 sm:p-8 ${cardBg} space-y-6 shadow-sm`}>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-2.5 py-0.5 rounded-full bg-[#162018] text-[#FAF8F4] font-mono text-[10px] font-bold uppercase tracking-wider">
                      RS // LOGISTICS HUB
                    </span>
                  </div>
                  <h2 className="font-condensed text-xl font-bold uppercase tracking-wide text-slate-900">
                    Pusat Operasional Logistik Gudang
                  </h2>
                  <p className={`text-xs mt-1 ${subText}`}>
                    Fasilitas pemenuhan pesanan, cetak label thermal A6, manajemen stok pakaian atletik, dan retur garansi.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Card 1: Dashboard Gudang */}
                  <Link
                    to="/admin/warehouse"
                    className="rounded-2xl p-5 border border-stone-200/90 bg-[#FAF8F4] hover:bg-white hover:border-[#162018] hover:shadow-md transition-all group"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="p-2.5 rounded-xl bg-[#162018] text-white">
                        <Truck size={20} />
                      </div>
                      <ArrowRight size={14} className="text-stone-400 group-hover:translate-x-1 transition-transform" />
                    </div>
                    <div className="font-condensed text-base font-bold uppercase text-slate-900 group-hover:text-emerald-950 transition-colors">
                      Dashboard Hub
                    </div>
                    <p className={`text-xs mt-1 ${subText}`}>
                      Overview metrik harian dan pemindai barcode resi.
                    </p>
                  </Link>

                  {/* Card 2: Antrean Kemas */}
                  <Link
                    to="/admin/orders"
                    className="rounded-2xl p-5 border border-stone-200/90 bg-[#FAF8F4] hover:bg-white hover:border-[#B9382B] hover:shadow-md transition-all group"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="p-2.5 rounded-xl bg-[#B9382B] text-white">
                        <Package size={20} />
                      </div>
                      <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-[#FAF0ED] text-[#B9382B] border border-[#B9382B]/20">
                        {roleStats.warehousePending}
                      </span>
                    </div>
                    <div className="font-condensed text-base font-bold uppercase text-slate-900 group-hover:text-[#B9382B] transition-colors">
                      Packing &amp; Resi
                    </div>
                    <p className={`text-xs mt-1 ${subText}`}>
                      Cetak label thermal A6 dan input nomor resi pengiriman.
                    </p>
                  </Link>

                  {/* Card 3: Stok Gudang */}
                  <Link
                    to="/admin/inventory"
                    className="rounded-2xl p-5 border border-stone-200/90 bg-[#FAF8F4] hover:bg-white hover:border-amber-500 hover:shadow-md transition-all group"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="p-2.5 rounded-xl bg-amber-100 text-amber-900 border border-amber-200">
                        <Layers size={20} />
                      </div>
                      <ArrowRight size={14} className="text-stone-400 group-hover:translate-x-1 transition-transform" />
                    </div>
                    <div className="font-condensed text-base font-bold uppercase text-slate-900 group-hover:text-amber-900 transition-colors">
                      Stok Fisik Gudang
                    </div>
                    <p className={`text-xs mt-1 ${subText}`}>
                      Pantau varian ukuran garmen dan restock barang masuk.
                    </p>
                  </Link>

                  {/* Card 4: Retur Garansi */}
                  <Link
                    to="/admin/warranty-claims"
                    className="rounded-2xl p-5 border border-stone-200/90 bg-[#FAF8F4] hover:bg-white hover:border-emerald-600 hover:shadow-md transition-all group"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="p-2.5 rounded-xl bg-stone-200 text-stone-800 border border-stone-300">
                        <ShieldCheck size={20} />
                      </div>
                      <ArrowRight size={14} className="text-stone-400 group-hover:translate-x-1 transition-transform" />
                    </div>
                    <div className="font-condensed text-base font-bold uppercase text-slate-900 group-hover:text-emerald-950 transition-colors">
                      Retur Garansi
                    </div>
                    <p className={`text-xs mt-1 ${subText}`}>
                      Inspeksi unit klaim retur dan kirim apparel pengganti.
                    </p>
                  </Link>
                </div>
              </div>
            )}

            {user.role === "admin" && (
              <div className={`rounded-3xl p-6 sm:p-8 ${cardBg} space-y-6 shadow-sm`}>
                <div>
                  <h2 className="font-condensed text-xl font-bold uppercase tracking-wide text-slate-900">
                    Pintasan Cepat Manajemen Toko
                  </h2>
                  <p className={`text-xs mt-1 ${subText}`}>
                    Akses langsung ke modul inti pengelolaan e-commerce RegarStore.
                  </p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <Link
                    to="/admin"
                    className="flex flex-col items-center justify-center p-5 rounded-2xl border border-stone-200 bg-[#FAF8F4] hover:bg-white hover:border-[#162018] hover:shadow-md text-center transition group"
                  >
                    <div className="p-3 rounded-xl bg-[#162018] text-white mb-2">
                      <LayoutDashboard size={20} />
                    </div>
                    <span className="font-condensed text-xs font-bold uppercase tracking-wider text-slate-900">Dashboard Omzet</span>
                  </Link>

                  <Link
                    to="/admin/products"
                    className="flex flex-col items-center justify-center p-5 rounded-2xl border border-stone-200 bg-[#FAF8F4] hover:bg-white hover:border-[#162018] hover:shadow-md text-center transition group"
                  >
                    <div className="p-3 rounded-xl bg-emerald-100 text-emerald-900 mb-2">
                      <ShoppingBag size={20} />
                    </div>
                    <span className="font-condensed text-xs font-bold uppercase tracking-wider text-slate-900">Kelola Katalog</span>
                  </Link>

                  <Link
                    to="/admin/orders"
                    className="flex flex-col items-center justify-center p-5 rounded-2xl border border-stone-200 bg-[#FAF8F4] hover:bg-white hover:border-[#B9382B] hover:shadow-md text-center transition group"
                  >
                    <div className="p-3 rounded-xl bg-[#FAF0ED] text-[#B9382B] mb-2">
                      <Package size={20} />
                    </div>
                    <span className="font-condensed text-xs font-bold uppercase tracking-wider text-slate-900">Semua Pesanan</span>
                  </Link>

                  <Link
                    to="/admin/users"
                    className="flex flex-col items-center justify-center p-5 rounded-2xl border border-stone-200 bg-[#FAF8F4] hover:bg-white hover:border-[#162018] hover:shadow-md text-center transition group"
                  >
                    <div className="p-3 rounded-xl bg-blue-100 text-blue-900 mb-2">
                      <User size={20} />
                    </div>
                    <span className="font-condensed text-xs font-bold uppercase tracking-wider text-slate-900">Daftar Pengguna</span>
                  </Link>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}