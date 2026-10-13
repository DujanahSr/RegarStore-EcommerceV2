/* eslint-disable react-hooks/set-state-in-effect */
import { memo, useCallback, useEffect, useRef, useState } from "react";
import {
  Search,
  Users as UsersIcon,
  UserX,
  UserCheck,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import api from "../../services/api";
import { EmptyState, ScreenLoader } from "../../components/common/UiStates";

import toast from "react-hot-toast";
import { useConfirm } from "../../context/ConfirmContext";

/* ----------------------------------------------------------------
   UserRow – tetap memoized untuk performa
---------------------------------------------------------------- */
const UserRow = memo(function UserRow({ user, index, page, limit, onUserChange }) {
  const confirm = useConfirm();
  const [avatarError, setAvatarError] = useState(false);
  const [updatingRole, setUpdatingRole] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const fullName = user.fullName || user.full_name || "Pengguna";
  const email = user.email || "-";
  const roleRaw = (user.role || "ROLE_CUSTOMER").toUpperCase();
  const isAdmin = roleRaw.includes("ADMIN");
  const isLogistics = roleRaw.includes("LOGISTICS") || roleRaw.includes("GUDANG");
  const isActive = user.active !== false;
  const avatarUrl = user.avatarUrl || user.avatar_url;
  const createdAt = user.createdAt || user.created_at;

  const handleRoleChange = async (e) => {
    const newRole = e.target.value;
    if (newRole === roleRaw) return;
    if (!(await confirm({ title: "Ubah role pengguna?", message: `Role ${fullName} akan diubah menjadi ${newRole}.`, confirmLabel: "Ubah Role" }))) return;

    try {
      setUpdatingRole(true);
      await api.patch(`/admin/users/${user.id}/role`, { role: newRole });
      toast.success(`Role ${fullName} berhasil diubah!`);
      if (onUserChange) onUserChange();
    } catch (err) {
      toast.error(err.response?.data?.message || "Gagal mengubah role pengguna");
    } finally {
      setUpdatingRole(false);
    }
  };

  const handleToggleStatus = async () => {
    const nextActive = !isActive;
    const actionLabel = nextActive ? "mengaktifkan kembali" : "menonaktifkan / suspend";
    if (!(await confirm({
      title: nextActive ? "Aktifkan kembali akun?" : "Nonaktifkan akun?",
      message: `Yakin ingin ${actionLabel} akun ${fullName}?`,
      confirmLabel: nextActive ? "Aktifkan Akun" : "Nonaktifkan Akun",
      tone: nextActive ? "default" : "danger",
    }))) return;

    try {
      setUpdatingStatus(true);
      await api.patch(`/admin/users/${user.id}/status`, { active: nextActive });
      toast.success(`Akun ${fullName} berhasil ${nextActive ? "diaktifkan" : "disuspend"}!`);
      if (onUserChange) onUserChange();
    } catch (err) {
      toast.error(err.response?.data?.message || "Gagal mengubah status pengguna");
    } finally {
      setUpdatingStatus(false);
    }
  };

  return (
    <tr className="border-b border-stone-100 hover:bg-stone-50/60 transition-colors group">
      <td className="p-4 text-stone-400 text-xs font-mono font-semibold">
        {(page - 1) * limit + index + 1}
      </td>
      <td className="p-4">
        <div className="flex items-center gap-3">
          {/* Initial Avatar */}
          <div className="w-9 h-9 rounded-full bg-[#FAF0ED] border border-[#B9382B]/20 text-[#B9382B] flex items-center justify-center shrink-0 overflow-hidden font-bold text-xs shadow-xs">
            {avatarUrl && !avatarError ? (
              <img
                src={avatarUrl}
                alt={fullName}
                className="w-full h-full object-cover"
                onError={() => setAvatarError(true)}
              />
            ) : (
              <span>
                {fullName?.charAt(0)?.toUpperCase() || "U"}
              </span>
            )}
          </div>
          <div>
            <p className="text-slate-900 text-sm font-bold group-hover:text-[#B9382B] transition-colors">
              {fullName}
            </p>
            <p className="text-stone-400 text-xs font-mono">{email}</p>
          </div>
        </div>
      </td>

      {/* Role Selector */}
      <td className="p-4">
        <div className="flex items-center gap-2">
          <select
            value={roleRaw}
            onChange={handleRoleChange}
            disabled={updatingRole}
            className={`border rounded-xl px-3 py-1.5 text-xs font-bold outline-hidden cursor-pointer transition shadow-xs ${
              isAdmin
                ? "border-[#B9382B]/30 text-[#B9382B] bg-[#FAF0ED]"
                : isLogistics
                ? "border-blue-200 text-blue-700 bg-blue-50"
                : "border-emerald-200 text-emerald-800 bg-emerald-50"
            }`}
          >
            <option value="ROLE_CUSTOMER">Pelanggan (Customer)</option>
            <option value="ROLE_LOGISTICS">Staf Gudang (Logistik)</option>
            <option value="ROLE_ADMIN">Administrator</option>
          </select>
        </div>
      </td>

      {/* Status Akun */}
      <td className="p-4">
        <span
          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${
            isActive
              ? "bg-emerald-50 text-emerald-800 border-emerald-200"
              : "bg-rose-50 text-rose-800 border-rose-200"
          }`}
        >
          <span className={`w-1.5 h-1.5 rounded-full ${isActive ? "bg-emerald-500" : "bg-rose-500"}`} />
          {isActive ? "Aktif" : "Suspended"}
        </span>
      </td>

      {/* Tanggal Bergabung */}
      <td className="p-4 text-stone-500 text-xs font-medium">
        {createdAt
          ? new Date(createdAt).toLocaleDateString("id-ID", {
              day: "2-digit",
              month: "short",
              year: "numeric",
            })
          : "-"}
      </td>

      {/* Tombol Aksi Moderasi */}
      <td className="p-4">
        <button
          onClick={handleToggleStatus}
          disabled={updatingStatus}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold border transition-all active:scale-95 disabled:opacity-50 cursor-pointer shadow-xs ${
            isActive
              ? "border-rose-200 text-rose-700 bg-white hover:bg-rose-50 hover:border-rose-300"
              : "border-emerald-200 text-emerald-700 bg-white hover:bg-emerald-50 hover:border-emerald-300"
          }`}
          title={isActive ? "Suspend Akun Pengguna" : "Aktifkan Kembali Akun"}
        >
          {isActive ? <UserX size={13} /> : <UserCheck size={13} />}
          {updatingStatus ? "Menyimpan..." : isActive ? "Suspend" : "Aktifkan"}
        </button>
      </td>
    </tr>
  );
});

/* ----------------------------------------------------------------
   Users Page
---------------------------------------------------------------- */
export default function Users() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 10;
  const searchTimerRef = useRef(null);

  /* Debounce search */
  useEffect(() => {
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(() => {
      setPage(1);
      setDebouncedSearch(search.trim());
    }, 350);
    return () => clearTimeout(searchTimerRef.current);
  }, [search]);

  /* Fetch users */
  const getUsers = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get("/admin/users", {
        params: {
          search: debouncedSearch || undefined,
          role: roleFilter ? (roleFilter.toUpperCase().startsWith("ROLE_") ? roleFilter : `ROLE_${roleFilter.toUpperCase()}`) : undefined,
          page,
          limit,
        },
      });
      const responseData = res.data?.data || res.data;
      const list = Array.isArray(responseData?.content)
        ? responseData.content
        : Array.isArray(responseData)
        ? responseData
        : [];
      setUsers(list);
      setTotal(responseData?.totalElements ?? res.data?.meta?.total ?? list.length);
      setTotalPages(responseData?.totalPages ?? res.data?.meta?.totalPages ?? 1);
    } catch (error) {
      console.error(error);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, roleFilter, page]);

  useEffect(() => {
    getUsers();
  }, [getUsers]);

  return (
    <div className="space-y-8 pb-12">
      {/* ======================== HEADER ======================== */}
      {/* Header Banner Tactical Forest */}
      <div className="relative overflow-hidden rounded-3xl border border-black/15 shadow-xl bg-[#162018] text-white p-6 sm:p-8">
        <div className="absolute inset-0 bg-topography opacity-15 pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="max-w-2xl">
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full bg-white/10 text-emerald-400 font-mono text-[10px] font-black tracking-widest border border-white/10 uppercase">
                RS // ACCESS DIRECTORY
              </span>
              <span className="text-[11px] font-mono uppercase tracking-widest text-stone-300">
                USER ROLES & AUTH
              </span>
            </div>
            <h1 className="font-['Barlow_Condensed'] font-black uppercase tracking-tight text-3xl sm:text-5xl text-white leading-none">
              MANAJEMEN PENGGUNA
            </h1>
            <p className="text-stone-300 text-xs sm:text-sm mt-2 leading-relaxed">
              Pantau direktori akun terdaftar, kelola hak akses role Administrator / Staf Gudang, dan kontrol status moderasi akun pengguna.
            </p>

            <div className="flex flex-wrap items-center gap-4 mt-4 pt-3 border-t border-white/10 text-xs font-mono text-stone-300">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <span>TOTAL AKUN: {total} PENGGUNA</span>
              </div>
              <span className="text-white/20">•</span>
              <div className="flex items-center gap-1.5">
                <UsersIcon size={13} className="text-amber-400" />
                <span>AKTIF: {users.filter((u) => u.isActive ?? u.is_active).length} PADA HALAMAN INI</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <div className="bg-white/10 border border-white/15 px-5 py-3 rounded-2xl backdrop-blur-xs text-right">
              <p className="text-[10px] font-bold text-stone-300 uppercase tracking-widest">Total Akun</p>
              <p className="font-['Barlow_Condensed'] font-black text-2xl text-white leading-tight">
                {total} Terdaftar
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ======================== FILTER BAR ======================== */}
      <div className="flex flex-col md:flex-row gap-3">
        {/* Search */}
        <div className="flex items-center gap-3 flex-1 bg-white border border-stone-200/80 rounded-2xl px-4 py-3 shadow-xs focus-within:border-[#B9382B] focus-within:ring-1 focus-within:ring-[#B9382B] transition-all group">
          <Search size={18} className="text-stone-400 group-focus-within:text-[#B9382B] transition-colors" />
          <input
            type="text"
            placeholder="Cari nama lengkap atau email pengguna..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 bg-transparent text-slate-900 text-sm outline-hidden placeholder:text-stone-400"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="p-1 rounded-lg hover:bg-stone-100 text-stone-400 hover:text-stone-700 transition-all cursor-pointer"
            >
              <ChevronRight size={16} className="rotate-45" />
            </button>
          )}
        </div>

        {/* Role Filter */}
        <div className="relative">
          <select
            value={roleFilter}
            onChange={(e) => {
              setPage(1);
              setRoleFilter(e.target.value);
            }}
            className="bg-white border border-stone-200/80 rounded-2xl px-4 py-3 text-slate-800 text-sm font-semibold outline-hidden focus:border-[#B9382B] transition-all cursor-pointer shadow-xs pr-10 appearance-none"
          >
            <option value="">Semua Role Pengguna</option>
            <option value="admin">Administrator</option>
            <option value="logistics">Staf Gudang (Logistik)</option>
            <option value="customer">Pelanggan (Customer)</option>
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-stone-500">
            <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20">
              <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
            </svg>
          </div>
        </div>
      </div>

      {/* ======================== TABLE ======================== */}
      {loading ? (
        <ScreenLoader label="Memuat data pengguna..." />
      ) : users.length === 0 ? (
        <EmptyState
          title="Tidak ada pengguna"
          description={
            debouncedSearch || roleFilter
              ? "Tidak ada pengguna yang cocok dengan kata kunci atau filter role."
              : "Belum ada akun pengguna terdaftar."
          }
        />
      ) : (
        <div className="bg-white border border-stone-200/80 rounded-3xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full min-w-175">
              <thead>
                <tr className="border-b border-stone-100 bg-stone-50/70">
                  <th className="p-4 text-left text-[11px] font-bold text-stone-500 uppercase tracking-wider">
                    No
                  </th>
                  <th className="p-4 text-left text-[11px] font-bold text-stone-500 uppercase tracking-wider">
                    Pengguna
                  </th>
                  <th className="p-4 text-left text-[11px] font-bold text-stone-500 uppercase tracking-wider">
                    Role & Hak Akses
                  </th>
                  <th className="p-4 text-left text-[11px] font-bold text-stone-500 uppercase tracking-wider">
                    Status Akun
                  </th>
                  <th className="p-4 text-left text-[11px] font-bold text-stone-500 uppercase tracking-wider">
                    Bergabung
                  </th>
                  <th className="p-4 text-left text-[11px] font-bold text-stone-500 uppercase tracking-wider">
                    Aksi Moderasi
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {users.map((user, index) => (
                  <UserRow
                    key={user.id}
                    user={user}
                    index={index}
                    page={page}
                    limit={limit}
                    onUserChange={getUsers}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ======================== PAGINATION ======================== */}
      {!loading && totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 mt-10">
          <button
            disabled={page === 1}
            onClick={() => setPage((p) => Math.max(p - 1, 1))}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-white border border-stone-200/80 hover:bg-stone-50 rounded-xl text-stone-700 disabled:opacity-40 disabled:cursor-not-allowed transition font-bold text-xs shadow-xs cursor-pointer"
          >
            <ChevronLeft size={16} />
            Sebelumnya
          </button>

          <div className="flex items-center gap-1.5">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                onClick={() => setPage(p)}
                className={`w-9 h-9 rounded-xl text-xs font-bold transition cursor-pointer ${
                  p === page
                    ? "bg-[#B9382B] text-white shadow-xs"
                    : "bg-white border border-stone-200/80 text-stone-600 hover:bg-stone-50 hover:text-slate-900"
                }`}
              >
                {p}
              </button>
            ))}
          </div>

          <button
            disabled={page === totalPages}
            onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-white border border-stone-200/80 hover:bg-stone-50 rounded-xl text-stone-700 disabled:opacity-40 disabled:cursor-not-allowed transition font-bold text-xs shadow-xs cursor-pointer"
          >
            Berikutnya
            <ChevronRight size={16} />
          </button>
        </div>
      )}
    </div>
  );
}