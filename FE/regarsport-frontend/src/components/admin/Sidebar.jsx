import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  FolderTree,
  Package,
  ShoppingCart,
  Users,
  Star,
  UserCircle,
  Menu,
  X,
  Truck,
  Layers,
  Tag,
  ShieldCheck,
} from "lucide-react";
import { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import RegarStoreLogo from "../common/RegarStoreLogo";

export default function Sidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const { user } = useAuth();
  const isLogistics = user?.role === "logistics";

  const adminMenuItems = [
    { to: "/admin", icon: LayoutDashboard, label: "Dashboard" },
    { to: "/admin/categories", icon: FolderTree, label: "Categories" },
    { to: "/admin/products", icon: Package, label: "Products" },
    { to: "/admin/inventory", icon: Layers, label: "Stok Gudang" },
    { to: "/admin/orders", icon: ShoppingCart, label: "Orders" },
    { to: "/admin/warranty-claims", icon: ShieldCheck, label: "Klaim Garansi" },
    { to: "/admin/vouchers", icon: Tag, label: "Vouchers" },
    { to: "/admin/users", icon: Users, label: "Users" },
    { to: "/admin/reviews", icon: Star, label: "Reviews" },
    { to: "/admin/profile", icon: UserCircle, label: "Profile" },
  ];

  const logisticsMenuItems = [
    { to: "/admin/warehouse", icon: Truck, label: "Dashboard Gudang" },
    { to: "/admin/inventory", icon: Layers, label: "Stok Gudang" },
    { to: "/admin/orders", icon: ShoppingCart, label: "Packing & Resi" },
    { to: "/admin/warranty-claims", icon: ShieldCheck, label: "Retur Garansi" },
    { to: "/admin/profile", icon: UserCircle, label: "Profile" },
  ];

  const menuItems = isLogistics ? logisticsMenuItems : adminMenuItems;

  const menuClass = ({ isActive }) => {
    return `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 text-sm font-medium ${
      isActive
        ? "bg-white/15 text-white font-bold border-l-2 border-emerald-400 shadow-xs"
        : "text-slate-300 hover:text-white hover:bg-white/5"
    }`;
  };

  return (
    <>
      {/* Mobile toggle button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-xl border border-white/10 bg-[#162018] text-white shadow-lg cursor-pointer"
      >
        {isOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:sticky top-0 z-40 w-72 h-screen flex flex-col transition-transform duration-300 bg-[#162018] text-[#FAF8F4] border-r border-white/10 ${
          isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        {/* Logo */}
        <div className="shrink-0 flex items-center gap-3 pl-16 pr-6 lg:pl-6 h-18 border-b border-white/10">
          <RegarStoreLogo size={36} />
          <div className="flex flex-col">
            <span className="text-white font-black tracking-[2px] text-sm uppercase font-['Barlow_Condensed'] leading-none">
              REGARSTORE
            </span>
            <span className="text-[9px] font-mono tracking-widest text-emerald-400/90 mt-1 uppercase">
              ATELIER // CICENDO
            </span>
          </div>
          <span className="ml-auto text-[9px] font-mono font-bold uppercase tracking-widest px-2 py-0.5 rounded-md bg-white/10 text-emerald-300 border border-emerald-500/30">
            {isLogistics ? "Gudang" : "Admin"}
          </span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-4 space-y-1.5">
          {menuItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/admin"}
              className={menuClass}
              onClick={() => setIsOpen(false)}
            >
              <item.icon size={18} strokeWidth={1.75} />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Footer */}
        <div className="shrink-0 px-6 py-4 border-t border-white/10">
          <div className="flex items-center gap-2 text-[11px] font-mono text-slate-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>SISTEM {isLogistics ? "DISPATCH" : "ADMINISTRASI"} AKTIF</span>
          </div>
        </div>
      </aside>
    </>
  );
}