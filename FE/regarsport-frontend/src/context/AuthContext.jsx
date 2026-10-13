/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useState } from "react";
import { LogOut } from "lucide-react";
import api from "../services/api";
import { useConfirm } from "./ConfirmContext";

const AuthContext = createContext();

const normalizeUser = (u) => {
  if (!u) return null;
  const roleStr = (u.role || "").toLowerCase();
  let role = "customer";
  if (roleStr.includes("admin")) {
    role = "admin";
  } else if (roleStr.includes("logistics") || roleStr.includes("gudang")) {
    role = "logistics";
  }

  return {
    ...u,
    role,
    rawRole: u.role,
    full_name: u.full_name || u.fullName || "User",
    fullName: u.fullName || u.full_name || "User",
    avatar_url: u.avatar_url || u.avatarUrl || "",
    avatarUrl: u.avatarUrl || u.avatar_url || "",
    phoneNumber: u.phoneNumber || u.phone_number || "",
    address: u.address || "",
    city: u.city || "",
    postalCode: u.postalCode || u.postal_code || "",
    bio: u.bio || "",
    createdAt: u.createdAt || u.created_at || "",
    active: u.active ?? true,
    emailVerified: u.emailVerified ?? true,
    googleLinked: u.googleLinked ?? false,
    hasPassword: u.hasPassword ?? true,
  };
};

export const AuthProvider = ({ children }) => {
  const [user, setUserState] = useState(() => {
    try {
      const saved = localStorage.getItem("user");
      return saved ? normalizeUser(JSON.parse(saved)) : null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(true);

  const setUser = (userData) => {
    const normalized = normalizeUser(userData);
    setUserState(normalized);
    if (normalized) {
      localStorage.setItem("user", JSON.stringify(normalized));
    } else {
      localStorage.removeItem("user");
    }
  };

  const fetchUser = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      setUserState(null);
      setLoading(false);
      return;
    }
    try {
      const res = await api.get("/auth/me");
      const userData = res.data?.data || res.data?.user || res.data;
      setUser(userData);
    } catch {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      setUserState(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUser();
  }, []);

  // Simpan sesi dari AuthResponse backend (login, verifikasi OTP, Google)
  const login = (authData) => {
    const token = authData?.accessToken || authData?.token;
    if (token) localStorage.setItem("token", token);
    setUser(authData?.user);
    return normalizeUser(authData?.user);
  };

  const confirm = useConfirm();

  // Return false kalau user membatalkan dialog konfirmasi
  const logout = async () => {
    const ok = await confirm({
      title: "Keluar dari akun?",
      message: "Anda perlu masuk kembali untuk melihat keranjang, pesanan, dan pengaturan akun.",
      confirmLabel: "Keluar",
      tone: "danger",
      icon: LogOut,
    });
    if (!ok) return false;
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUserState(null);
    return true;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        setUser,
        login,
        logout,
        fetchUser,
        loading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const homePathFor = (user) => {
  if (user?.role === "logistics") return "/admin/warehouse";
  if (user?.role === "admin") return "/admin";
  return "/dashboard";
};

export const useAuth = () => {
  return useContext(AuthContext);
};