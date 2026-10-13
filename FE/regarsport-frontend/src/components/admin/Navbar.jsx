import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { LogOut, User, ChevronDown } from "lucide-react";
import { useState } from "react";

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const isLogistics = user?.role === "logistics";

  const handleLogout = async () => {
    if (!(await logout())) return;
    navigate("/login");
  };

  return (
    <header className="sticky top-0 z-30 pl-16 pr-4 sm:pr-6 lg:pl-6 py-3.5 flex justify-between items-center gap-3 backdrop-blur-md bg-[#162018] text-white border-b border-white/10 shadow-sm transition-colors">
      <div className="flex items-center gap-2.5 min-w-0">
        <span className="hidden sm:inline-block shrink-0 font-mono text-[10px] uppercase font-bold tracking-widest px-2.5 py-0.5 rounded bg-white/10 text-emerald-300 border border-emerald-500/20">
          {isLogistics ? "LOGISTIK" : "ADMINISTRASI"}
        </span>
        <h2 className="truncate text-xs sm:text-sm font-bold text-slate-200 tracking-wide font-['Barlow_Condensed'] uppercase">
          {isLogistics ? "Atelier Logistics & Distribution Hub" : "Atelier Headquarters & Executive Command Center"}
        </h2>
      </div>

      <div className="flex items-center gap-3 shrink-0">
        <button
          onClick={() => setDropdownOpen(!dropdownOpen)}
          className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl border border-white/15 bg-white/5 hover:bg-white/10 text-white transition-all duration-200 cursor-pointer"
        >
          <div className="w-7 h-7 rounded-full overflow-hidden bg-white/15 border border-white/20 flex items-center justify-center shrink-0">
            {user?.avatar_url || user?.avatarUrl ? (
              <img
                src={user.avatar_url || user.avatarUrl}
                alt={user?.full_name || user?.fullName || "Avatar"}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-xs font-bold text-white">
                {(user?.full_name || user?.fullName || (isLogistics ? "G" : "A")).charAt(0).toUpperCase()}
              </span>
            )}
          </div>
          <span className="text-xs sm:text-sm font-semibold text-white/90 hidden sm:inline">
            {user?.full_name || user?.fullName || (isLogistics ? "Staf Gudang" : "Super Admin")}
          </span>
          <ChevronDown size={14} className="text-slate-400" />
        </button>

        {dropdownOpen && (
          <div className="absolute right-6 top-16 mt-1 w-52 rounded-2xl shadow-2xl py-1.5 z-50 border bg-[#162018] border-white/10 text-white">
            <div className="px-4 py-2 border-b border-white/10">
              <div className="text-xs font-bold text-white truncate">
                {user?.full_name || user?.fullName || (isLogistics ? "Staf Gudang" : "Super Admin")}
              </div>
              <div className="text-[10px] font-mono text-slate-400 truncate">
                {user?.email || (isLogistics ? "gudang@regarstore.com" : "admin@regarstore.com")}
              </div>
            </div>

            <Link
              to="/admin/profile"
              className="flex items-center gap-3 px-4 py-2.5 text-xs text-slate-300 hover:text-white hover:bg-white/5 transition-colors"
              onClick={() => setDropdownOpen(false)}
            >
              <User size={15} />
              <span>Profil Pengguna</span>
            </Link>

            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-xs text-rose-400 hover:text-rose-300 hover:bg-white/5 transition-colors text-left cursor-pointer"
            >
              <LogOut size={15} />
              <span>Keluar Akun</span>
            </button>
          </div>
        )}
      </div>
    </header>
  );
}