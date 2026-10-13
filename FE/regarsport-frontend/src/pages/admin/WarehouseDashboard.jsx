import { useEffect, useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Package,
  Truck,
  CheckCircle2,
  AlertTriangle,
  Printer,
  Barcode,
  Search,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
  Box,
  MapPin,
} from "lucide-react";
import api from "../../services/api";
import toast from "react-hot-toast";

export default function WarehouseDashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [scanCode, setScanCode] = useState("");
  const scanInputRef = useRef(null);

  const [orderMetrics, setOrderMetrics] = useState({
    paidOrders: 0,
    processingOrders: 0,
    shippedOrders: 0,
    completedOrders: 0,
    recentPaid: [],
  });

  const [stockMetrics, setStockMetrics] = useState({
    totalProducts: 0,
    lowStockCount: 0,
    outOfStockCount: 0,
    lowStockList: [],
  });

  const [approvedClaims, setApprovedClaims] = useState([]);

  const fetchWarehouseOverview = async () => {
    try {
      setLoading(true);
      const [ordersRes, prodsRes, claimsRes] = await Promise.all([
        api.get("/orders", { params: { size: 100 } }).catch(() => ({ data: { data: [] } })),
        api.get("/products", { params: { size: 100 } }).catch(() => ({ data: { data: [] } })),
        api.get("/warranty-claims/admin", { params: { status: "APPROVED", size: 10 } }).catch(() => ({ data: { data: { content: [] } } })),
      ]);

      const orderList = ordersRes.data?.data?.content || ordersRes.data?.data || ordersRes.data || [];
      const prodList = prodsRes.data?.data?.content || prodsRes.data?.data || prodsRes.data || [];
      const claimList = claimsRes.data?.data?.content || claimsRes.data?.data || [];
      setApprovedClaims(claimList);

      let paid = 0;
      let proc = 0;
      let ship = 0;
      let comp = 0;
      const recentPaid = [];

      orderList.forEach((o) => {
        const s = (o.status || "").toUpperCase();
        if (s === "PAID") {
          paid++;
          if (recentPaid.length < 6) recentPaid.push(o);
        } else if (s === "PROCESSING") proc++;
        else if (s === "SHIPPED") ship++;
        else if (s === "COMPLETED") comp++;
      });

      let low = 0;
      let out = 0;
      const lowList = [];

      prodList.forEach((p) => {
        const stk = Number(p.stock || 0);
        if (stk === 0) {
          out++;
          if (lowList.length < 6) lowList.push(p);
        } else if (stk <= 10) {
          low++;
          if (lowList.length < 6) lowList.push(p);
        }
      });

      setOrderMetrics({
        paidOrders: paid,
        processingOrders: proc,
        shippedOrders: ship,
        completedOrders: comp,
        recentPaid,
      });

      setStockMetrics({
        totalProducts: prodList.length,
        lowStockCount: low,
        outOfStockCount: out,
        lowStockList: lowList,
      });
    } catch (err) {
      console.error("Gagal memuat overview gudang:", err);
      toast.error("Gagal memuat ringkasan gudang");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWarehouseOverview();
    // Auto-focus barcode scanner for instant handheld scanning
    const timer = setTimeout(() => {
      scanInputRef.current?.focus();
    }, 150);
    return () => clearTimeout(timer);
  }, []);

  const handleScanSubmit = (e) => {
    e.preventDefault();
    if (!scanCode.trim()) {
      scanInputRef.current?.focus();
      return;
    }
    const code = scanCode.trim();
    setScanCode("");
    navigate(`/admin/orders?search=${encodeURIComponent(code)}`);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* ATELIER HERO DISPATCH BANNER (Matching Homepage Atelier Aesthetic) */}
      <div className="relative overflow-hidden rounded-3xl border border-black/10 shadow-xl bg-[#162018]">
        {/* Background Image with Deep Gradient & Topography */}
        <div className="absolute inset-0 z-0">
          <img
            src="/images/warehouse_hero_bg.jpg"
            alt="RegarStore Logistics Hub"
            className="w-full h-full object-cover object-center filter brightness-[0.4] contrast-125"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#162018] via-[#162018]/85 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#162018] via-transparent to-black/30" />
          <div className="absolute inset-0 bg-topography opacity-15 mix-blend-overlay pointer-events-none" />
        </div>

        {/* Content Inside Hero */}
        <div className="relative z-10 p-6 sm:p-8 lg:p-10 flex flex-col justify-between min-h-[220px]">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-md bg-white/15 text-[#FAF8F4] font-mono text-[10px] font-black tracking-widest border border-white/20">
                RS // DISPATCH HUB
              </span>
              <span className="text-[11px] font-mono uppercase tracking-widest text-slate-300">
                ATELIER CICENDO BANDUNG • CENTRAL LOGISTICS
              </span>
            </div>

            <button
              onClick={fetchWarehouseOverview}
              className="flex items-center gap-2 px-3.5 py-2 rounded-full bg-white/10 hover:bg-white/20 text-[#FAF8F4] border border-white/20 text-xs font-bold transition-all backdrop-blur-md cursor-pointer"
            >
              <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
              <span>Segarkan Data</span>
            </button>
          </div>

          <div className="mt-6 max-w-3xl">
            <h1 className="font-['Barlow_Condensed'] font-black text-3xl sm:text-5xl uppercase tracking-tight text-white leading-none">
              PUSAT OPERASIONAL <span className="text-[#FAF8F4] opacity-90">GUDANG &amp; PENGIRIMAN</span>
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm mt-2.5 max-w-2xl leading-relaxed">
              Manajemen antrean kemas pakaian atletik, pencetakan label thermal A6 otomatis, pelacakan barcode resi kurir, dan pengawasan stok fisik garmen PT RegarStore Indonesia.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-4 mt-6 pt-4 border-t border-white/15 text-[11px] font-mono text-slate-300">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span>SISTEM DISPATCH: AKTIF</span>
            </div>
            <span className="text-white/30">•</span>
            <div className="flex items-center gap-1.5">
              <Box size={13} className="text-emerald-400" />
              <span>STOK FISIK: {stockMetrics.totalProducts} MODEL TERDAFTAR</span>
            </div>
            <span className="text-white/30">•</span>
            <div className="flex items-center gap-1.5">
              <Printer size={13} className="text-slate-300" />
              <span>THERMAL READY: 100x150MM</span>
            </div>
          </div>
        </div>
      </div>

      {/* QUICK BARCODE / RESI SCANNER DOCK (Harmonious with Homepage Clean Card Style) */}
      <div className="rounded-3xl bg-white border border-stone-200/80 p-6 sm:p-7 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="max-w-xl">
            <div className="flex items-center gap-2 text-xs font-mono font-bold text-stone-500 uppercase tracking-widest mb-1">
              <Barcode size={16} />
              <span>STASIUN PEMINDAI RESI // QUICK BARCODE SCANNER</span>
            </div>
            <h2 className="text-base font-bold text-slate-900">
              Pencarian Cepat / Scan Barcode Resi Gudang
            </h2>
            <p className="text-xs text-stone-500 mt-0.5">
              Arahkan scanner barcode fisik Anda atau masukkan nomor resi / ID pesanan untuk langsung membuka tiket pengemasan.
            </p>
          </div>

          <form onSubmit={handleScanSubmit} className="flex-1 max-w-xl flex items-center gap-3">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
              <input
                ref={scanInputRef}
                type="text"
                value={scanCode}
                onChange={(e) => setScanCode(e.target.value)}
                placeholder="Scan barcode resi atau ketik kode order (misal: REGAR-2026...)"
                className="w-full pl-10 pr-4 py-3 rounded-2xl bg-stone-50 border border-stone-200 text-xs text-stone-900 placeholder:text-stone-400 focus:outline-none focus:border-[#162018] focus:bg-white transition-all font-mono"
              />
            </div>
            <button
              type="submit"
              className="px-6 py-3 rounded-xl bg-[#111613] hover:bg-black text-white font-bold text-xs uppercase tracking-wider transition-all shrink-0 cursor-pointer shadow-md active:scale-95"
            >
              Lacak &amp; Kemas
            </button>
          </form>
        </div>
      </div>

      {/* 4 OPERATIONAL KPI CARDS (Clean International Sportswear Aesthetic) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Paid / Packing Needed */}
        <Link
          to="/admin/orders"
          className="p-6 rounded-3xl bg-white border border-stone-200/80 shadow-sm hover:shadow-md transition-all group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-bold text-stone-500 uppercase tracking-wider">
              PERLU DIKEMAS
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-50 text-emerald-800 border border-emerald-200">
              Lunas
            </span>
          </div>
          <div className="text-3xl sm:text-4xl font-black text-slate-900 mt-2 font-['Barlow_Condensed'] tracking-tight">
            {orderMetrics.paidOrders} <span className="text-sm font-sans font-bold text-stone-400 uppercase">Paket</span>
          </div>
          <div className="text-[11px] text-stone-500 mt-2 flex items-center justify-between pt-2 border-t border-stone-100">
            <span>Siap cetak thermal A6</span>
            <ArrowRight size={14} className="text-stone-700 group-hover:translate-x-1 transition-transform" />
          </div>
        </Link>

        {/* Processing */}
        <Link
          to="/admin/orders"
          className="p-6 rounded-3xl bg-white border border-stone-200/80 shadow-sm hover:shadow-md transition-all group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-bold text-stone-500 uppercase tracking-wider">
              SEDANG DIPROSES
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-stone-100 text-stone-700 border border-stone-200">
              Antrean
            </span>
          </div>
          <div className="text-3xl sm:text-4xl font-black text-slate-900 mt-2 font-['Barlow_Condensed'] tracking-tight">
            {orderMetrics.processingOrders} <span className="text-sm font-sans font-bold text-stone-400 uppercase">Paket</span>
          </div>
          <div className="text-[11px] text-stone-500 mt-2 flex items-center justify-between pt-2 border-t border-stone-100">
            <span>Dalam antrean gudang</span>
            <ArrowRight size={14} className="text-stone-700 group-hover:translate-x-1 transition-transform" />
          </div>
        </Link>

        {/* Shipped */}
        <Link
          to="/admin/orders"
          className="p-6 rounded-3xl bg-white border border-stone-200/80 shadow-sm hover:shadow-md transition-all group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-bold text-stone-500 uppercase tracking-wider">
              DISERAHKAN KURIR
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-stone-100 text-stone-700 border border-stone-200">
              Transit
            </span>
          </div>
          <div className="text-3xl sm:text-4xl font-black text-slate-900 mt-2 font-['Barlow_Condensed'] tracking-tight">
            {orderMetrics.shippedOrders} <span className="text-sm font-sans font-bold text-stone-400 uppercase">Paket</span>
          </div>
          <div className="text-[11px] text-stone-500 mt-2 flex items-center justify-between pt-2 border-t border-stone-100">
            <span>Dalam perjalanan ekspedisi</span>
            <ArrowRight size={14} className="text-stone-700 group-hover:translate-x-1 transition-transform" />
          </div>
        </Link>

        {/* Low Stock Warning */}
        <Link
          to="/admin/inventory"
          className="p-6 rounded-3xl bg-white border border-stone-200/80 shadow-sm hover:shadow-md transition-all group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-bold text-stone-500 uppercase tracking-wider">
              STOK KRITIS / KOSONG
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-[#FAF0ED] text-[#B9382B] border border-[#B9382B]/20">
              Peringatan
            </span>
          </div>
          <div className="text-3xl sm:text-4xl font-black text-[#B9382B] mt-2 font-['Barlow_Condensed'] tracking-tight">
            {stockMetrics.lowStockCount + stockMetrics.outOfStockCount} <span className="text-sm font-sans font-bold text-stone-400 uppercase">Model</span>
          </div>
          <div className="text-[11px] text-stone-500 mt-2 flex items-center justify-between pt-2 border-t border-stone-100">
            <span>Buka manajemen inventaris</span>
            <ArrowRight size={14} className="text-stone-700 group-hover:translate-x-1 transition-transform" />
          </div>
        </Link>
      </div>

      {/* 2 COLUMN WORKSTATIONS (Matching Clean Sand & White Aesthetic) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Column 1: Antrean Paket Siap Kemas */}
        <div className="p-6 sm:p-7 rounded-3xl bg-white border border-stone-200/80 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-4 border-b border-stone-100">
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 rounded-xl bg-stone-100 text-stone-800">
                <Package size={18} />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 tracking-wide">Antrean Siap Kirim (Lunas)</h3>
                <p className="text-[11px] text-stone-500">Prioritas packing &amp; cetak resi thermal kurir</p>
              </div>
            </div>
            <Link
              to="/admin/orders"
              className="text-xs font-mono font-bold text-stone-700 hover:text-black flex items-center gap-1.5 transition-colors"
            >
              <span>Semua Antrean</span>
              <ArrowRight size={14} />
            </Link>
          </div>

          {orderMetrics.recentPaid.length === 0 ? (
            <div className="text-center py-12 px-4 rounded-2xl bg-stone-50 border border-dashed border-stone-200 space-y-2">
              <CheckCircle2 size={32} className="mx-auto text-emerald-700" />
              <p className="text-slate-900 text-xs font-medium">Semua pesanan lunas telah selesai dikemas!</p>
              <p className="text-stone-500 text-[11px]">Tidak ada paket yang menunggu proses penyerahan kurir.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {orderMetrics.recentPaid.map((order) => (
                <div
                  key={order.id}
                  className="p-4 rounded-2xl bg-stone-50 border border-stone-100 hover:border-stone-300 flex items-center justify-between gap-4 hover:bg-stone-100/60 transition-all group"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-slate-900">
                        {order.orderNumber}
                      </span>
                      <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase bg-emerald-50 text-emerald-800 border border-emerald-200">
                        LUNAS
                      </span>
                    </div>
                    <div className="text-[11px] text-stone-500 flex items-center gap-2">
                      <span className="text-slate-900 font-medium">{order.recipientName || order.customerName}</span>
                      <span>•</span>
                      <span className="flex items-center gap-1 text-stone-500">
                        <MapPin size={11} className="text-stone-400" />
                        {order.shippingCity || "Kota Pelanggan"}
                      </span>
                    </div>
                  </div>

                  <Link
                    to="/admin/orders"
                    className="px-4 py-2 rounded-xl bg-[#111613] hover:bg-black text-white text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 shadow-xs"
                  >
                    <Printer size={13} />
                    <span>Packing &amp; Resi</span>
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Column 2: Peringatan Stok Menipis */}
        <div className="p-6 sm:p-7 rounded-3xl bg-white border border-stone-200/80 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-4 border-b border-stone-100">
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 rounded-xl bg-[#FAF0ED] text-[#B9382B]">
                <AlertTriangle size={18} />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 tracking-wide">Produk Stok Kritis / Kosong</h3>
                <p className="text-[11px] text-stone-500">Varian apparel yang perlu restock konveksi segera</p>
              </div>
            </div>
            <Link
              to="/admin/inventory"
              className="text-xs font-mono font-bold text-stone-700 hover:text-black flex items-center gap-1.5 transition-colors"
            >
              <span>Kelola Stok</span>
              <ArrowRight size={14} />
            </Link>
          </div>

          {stockMetrics.lowStockList.length === 0 ? (
            <div className="text-center py-12 px-4 rounded-2xl bg-stone-50 border border-dashed border-stone-200 space-y-2">
              <CheckCircle2 size={32} className="mx-auto text-emerald-700" />
              <p className="text-slate-900 text-xs font-medium">Stok seluruh model apparel dalam batas aman!</p>
              <p className="text-stone-500 text-[11px]">Tidak ada produk yang kosong atau berada di bawah 10 pcs.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {stockMetrics.lowStockList.map((prod) => (
                <div
                  key={prod.id}
                  className="p-4 rounded-2xl bg-stone-50 border border-stone-100 hover:border-stone-300 flex items-center justify-between gap-4 hover:bg-stone-100/60 transition-all"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={prod.imageUrl || "https://images.unsplash.com/photo-1517466787929-bc90951d0974?w=100&q=80"}
                      alt={prod.name}
                      className="w-11 h-11 rounded-xl object-cover bg-stone-200 border border-stone-200 shrink-0"
                    />
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-slate-900 truncate">{prod.name}</div>
                      <div className="text-[11px] text-stone-500 mt-0.5">
                        Kategori: {prod.category?.name || "Apparel"} • SKU #{prod.id}
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className={`inline-block px-2.5 py-0.5 rounded font-mono text-xs font-bold ${
                      prod.stock === 0
                        ? "bg-[#FAF0ED] text-[#B9382B] border border-[#B9382B]/20"
                        : "bg-amber-50 text-amber-800 border border-amber-200"
                    }`}>
                      {prod.stock === 0 ? "HABIS (0)" : `${prod.stock} PCS`}
                    </span>
                    <Link
                      to="/admin/inventory"
                      className="text-[11px] text-emerald-800 hover:underline font-bold mt-1 block"
                    >
                      + Tambah Stok
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Retur & Penggantian Garansi Siap Diproses (Approved Claims) */}
      <div className="p-6 sm:p-7 rounded-3xl bg-white border border-stone-200/80 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between pb-4 border-b border-stone-100 gap-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-xl bg-stone-100 text-stone-800">
              <ShieldCheck size={18} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900 tracking-wide">Retur &amp; Penggantian Garansi Siap Kirim</h3>
                {approvedClaims.length > 0 && (
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-[#FAF0ED] text-[#B9382B] border border-[#B9382B]/20">
                    {approvedClaims.length} TIKET DISETUJUI
                  </span>
                )}
              </div>
              <p className="text-[11px] text-stone-500">Tiket klaim garansi yang telah disetujui CS dan menunggu penyerahan unit baru ke kurir</p>
            </div>
          </div>
          <Link
            to="/admin/warranty-claims"
            className="text-xs font-mono font-bold text-stone-700 hover:text-black flex items-center gap-1.5 transition-colors"
          >
            <span>Buka Semua Tiket Retur</span>
            <ArrowRight size={14} />
          </Link>
        </div>

        {approvedClaims.length === 0 ? (
          <div className="text-center py-10 px-4 rounded-2xl bg-stone-50 border border-dashed border-stone-200 space-y-2">
            <CheckCircle2 size={32} className="mx-auto text-emerald-700" />
            <p className="text-slate-900 text-xs font-medium">Tidak ada tiket garansi yang menunggu pengemasan ulang.</p>
            <p className="text-stone-500 text-[11px]">Seluruh klaim garansi pelanggan telah dituntaskan.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {approvedClaims.map((claim) => (
              <div
                key={claim.id || claim.claimNumber}
                className="p-5 rounded-2xl bg-stone-50 border border-stone-200 hover:border-stone-300 transition-all flex flex-col justify-between space-y-3 group"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-slate-900">
                      #{claim.claimNumber}
                    </span>
                    <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
                      DISETUJUI CS
                    </span>
                  </div>
                  <div className="text-xs font-bold text-slate-900 mt-2 truncate">
                    {claim.productName}
                  </div>
                  <div className="text-[11px] text-stone-600 font-medium mt-1">
                    {claim.solution === "EXCHANGE_SIZE"
                      ? `Tukar Ukuran: ${claim.requestedSize || "Varian Baru"}`
                      : claim.solution === "REPLACEMENT"
                      ? "Produksi Ulang 100%"
                      : "Perbaikan Garansi"}
                  </div>
                  {claim.adminNotes && (
                    <div className="text-[11px] text-stone-500 mt-2 p-2.5 rounded-xl bg-white border border-stone-200 italic line-clamp-2">
                      &ldquo;{claim.adminNotes}&rdquo;
                    </div>
                  )}
                </div>

                <Link
                  to="/admin/warranty-claims"
                  className="mt-3 w-full py-2.5 rounded-xl bg-[#111613] hover:bg-black text-white text-center text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-xs"
                >
                  <Truck size={14} />
                  <span>Proses &amp; Input Resi Pengganti</span>
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
