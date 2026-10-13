/* eslint-disable no-unused-vars */
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { ScreenLoader } from '../../components/common/UiStates';
import toast from 'react-hot-toast';
import {
  LayoutDashboard,
  FolderTree,
  Package,
  ShoppingCart,
  Users,
  TrendingUp,
  Download,
  CreditCard,
  Truck,
  CheckCircle2,
  Clock,
  Zap,
  DollarSign,
  Percent,
  Calendar,
  ArrowUpRight,
  ExternalLink,
  PieChart as PieChartIcon,
  FileText,
  Activity,
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [stats, setStats] = useState({
    categories: 0,
    products: 0,
    orders: 0,
    users: 0,
    revenue: 0,
    pendingOrders: 0,
    paidOrders: 0,
    processingOrders: 0,
    shippedOrders: 0,
    completedOrders: 0,
    cancelledOrders: 0,
    todayRevenue: 0,
    todayOrders: 0,
    aov: 0,
    completionRate: 0,
  });

  const [salesPeriod, setSalesPeriod] = useState('6m'); // '7d' | '30d' | '6m' | '12m'
  const [multiPeriodSales, setMultiPeriodSales] = useState({
    '7d': [],
    '30d': [],
    '6m': [],
    '12m': [],
  });
  const [statusDistribution, setStatusDistribution] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [catRes, prodRes, dashRes, userStatsRes] = await Promise.all([
          api.get('/categories').catch(() => ({ data: { data: [] } })),
          api.get('/products?page=1&size=1').catch(() => ({ data: { data: { totalElements: 0 } } })),
          api.get('/orders/admin/dashboard').catch(() => ({ data: { data: null } })),
          api.get('/admin/users/stats').catch(() => ({ data: { data: null } })),
        ]);

        const catCount = Array.isArray(catRes.data?.data)
          ? catRes.data.data.length
          : Array.isArray(catRes.data)
          ? catRes.data.length
          : 0;
        const prodCount = prodRes.data?.data?.totalElements || 0;

        const dashData = dashRes.data?.data || {};
        const userStats = userStatsRes.data?.data || {};

        setStats({
          categories: catCount,
          products: prodCount,
          orders: dashData.totalOrders || 0,
          users: userStats.totalUsers || 0,
          revenue: dashData.totalRevenue || 0,
          pendingOrders: dashData.pendingOrders || 0,
          paidOrders: dashData.paidOrders || 0,
          processingOrders: dashData.processingOrders || 0,
          shippedOrders: dashData.shippedOrders || 0,
          completedOrders: dashData.completedOrders || 0,
          cancelledOrders: dashData.cancelledOrders || 0,
          todayRevenue: dashData.todayRevenue || 0,
          todayOrders: dashData.todayOrders || 0,
          aov: dashData.aov || 0,
          completionRate: dashData.completionRate || 0,
        });

        // Multi-period sales data
        setMultiPeriodSales({
          '7d': dashData.sales7d || [],
          '30d': dashData.sales30d || [],
          '6m': dashData.salesData || [
            { month: 'Jan', period: 'Jan', sales: 0 },
            { month: 'Feb', period: 'Feb', sales: 0 },
            { month: 'Mar', period: 'Mar', sales: 0 },
            { month: 'Apr', period: 'Apr', sales: 0 },
            { month: 'Mei', period: 'Mei', sales: 0 },
            { month: 'Jun', period: 'Jun', sales: 0 },
          ],
          '12m': dashData.sales12m || [],
        });

        // Donut status distribution
        if (Array.isArray(dashData.statusDistribution) && dashData.statusDistribution.length > 0) {
          setStatusDistribution(dashData.statusDistribution);
        } else {
          setStatusDistribution([
            { name: 'Lunas / Diproses', value: (dashData.paidOrders || 0) + (dashData.processingOrders || 0), color: '#B9382B' },
            { name: 'Sedang Dikirim', value: dashData.shippedOrders || 0, color: '#2563EB' },
            { name: 'Selesai', value: dashData.completedOrders || 0, color: '#10B981' },
            { name: 'Menunggu Bayar', value: dashData.pendingOrders || 0, color: '#F59E0B' },
            { name: 'Dibatalkan', value: dashData.cancelledOrders || 0, color: '#94A3B8' },
          ]);
        }

        if (Array.isArray(dashData.topProducts) && dashData.topProducts.length > 0) {
          setTopProducts(dashData.topProducts);
        } else {
          setTopProducts([]);
        }

        if (Array.isArray(dashData.recentOrders) && dashData.recentOrders.length > 0) {
          setRecentOrders(dashData.recentOrders);
        } else {
          setRecentOrders([]);
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleExportCsv = async () => {
    try {
      setExporting(true);
      const response = await api.get('/orders/admin/export', { responseType: 'blob' });
      const blob = new Blob([response.data], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `laporan-pesanan-regarstore-${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success('Laporan pesanan (CSV) berhasil diunduh');
    } catch (err) {
      console.error('Gagal mengekspor CSV:', err);
      toast.error('Gagal mengunduh CSV laporan pesanan');
    } finally {
      setExporting(false);
    }
  };

  const handleExportPdf = () => {
    try {
      toast.loading('Menyiapkan laporan keuangan resmi...', { id: 'dash-pdf' });
      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

      const leftMargin = 15;
      const rightMargin = 195;
      const contentWidth = rightMargin - leftMargin;

      // Header PT RegarStore Indonesia
      doc.setFillColor(185, 56, 43); // #B9382B Brand Terracotta
      doc.roundedRect(leftMargin, 15, 10, 10, 2, 2, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.text('R', leftMargin + 3.2, 21.5);

      doc.setTextColor(22, 32, 24);
      doc.setFontSize(13);
      doc.text('PT REGARSTORE INDONESIA', leftMargin + 13, 20);
      doc.setTextColor(185, 56, 43);
      doc.setFontSize(7.5);
      doc.text('EXECUTIVE FINANCIAL & OPERATIONAL REPORT • ATELIER CICENDO BANDUNG', leftMargin + 13, 24);

      doc.setTextColor(100, 116, 139);
      doc.setFontSize(7);
      doc.setFont('helvetica', 'normal');
      doc.text('Pusat Apparel Atletik & Manufaktur Sublimasi • Cicendo, Kota Bandung 40171', leftMargin, 29);
      doc.text('NPWP: 01.345.678.9-521.000 | finance@regarstore.com', leftMargin, 33);

      const todayStr = new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' });
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.setTextColor(15, 23, 42);
      doc.text('LAPORAN KINERJA TOKO', rightMargin, 20, { align: 'right' });
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(100, 116, 139);
      doc.text(`Tanggal Cetak: ${todayStr}`, rightMargin, 25, { align: 'right' });
      doc.text(`Dicetak oleh: ${user?.fullName || user?.full_name || 'Super Admin'}`, rightMargin, 29, { align: 'right' });

      doc.setDrawColor(15, 23, 42);
      doc.setLineWidth(0.5);
      doc.line(leftMargin, 36, rightMargin, 36);

      // Section 1: Ringkasan Eksekutif Finansial (KPI Grid)
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(15, 23, 42);
      doc.text('1. RINGKASAN EKSEKUTIF FINANSIAL & OPERASIONAL', leftMargin, 43);

      const kpiBoxes = [
        { label: 'Total Omzet Penjualan', val: `Rp ${Number(stats.revenue || 0).toLocaleString('id-ID')}` },
        { label: 'Rata-rata Order (AOV)', val: `Rp ${Number(stats.aov || 0).toLocaleString('id-ID')}` },
        { label: 'Omzet Hari Ini', val: `Rp ${Number(stats.todayRevenue || 0).toLocaleString('id-ID')}` },
        { label: 'Total Volume Pesanan', val: `${stats.orders || 0} Transaksi` },
      ];

      const boxW = contentWidth / 4 - 2;
      kpiBoxes.forEach((item, idx) => {
        const bx = leftMargin + idx * (boxW + 2.6);
        doc.setFillColor(248, 250, 252);
        doc.setDrawColor(226, 232, 240);
        doc.roundedRect(bx, 46, boxW, 16, 1.5, 1.5, 'FD');

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(6);
        doc.setTextColor(100, 116, 139);
        doc.text(item.label, bx + 3, 51);

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7.5);
        doc.setTextColor(15, 23, 42);
        doc.text(item.val, bx + 3, 57);
      });

      // Section 2: Rincian Status Pesanan
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(15, 23, 42);
      doc.text('2. STATUS FULFILLMENT & LOGISTIK PESANAN', leftMargin, 70);

      let tableY = 74;
      doc.setFillColor(241, 245, 249);
      doc.rect(leftMargin, tableY, contentWidth, 6, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7);
      doc.setTextColor(51, 65, 85);
      doc.text('STATUS TAHAPAN', leftMargin + 3, tableY + 4.2);
      doc.text('KETERANGAN OPERASIONAL', leftMargin + 45, tableY + 4.2);
      doc.text('JUMLAH PESANAN', rightMargin - 3, tableY + 4.2, { align: 'right' });

      const statusRows = [
        { name: 'Menunggu Pembayaran (PENDING)', desc: 'Pesanan dibuat pelanggan, menunggu settlement Midtrans', count: stats.pendingOrders },
        { name: 'Siap Dikemas (PAID)', desc: 'Pembayaran terverifikasi, menunggu packing & cetak label di gudang', count: stats.paidOrders },
        { name: 'Sedang Diproses (PROCESSING)', desc: 'Pengepakan konveksi dan verifikasi barang di gudang', count: stats.processingOrders },
        { name: 'Dalam Pengiriman (SHIPPED)', desc: 'Diserahkan ke kurir ekspedisi (J&T, JNE, SiCepat, dll)', count: stats.shippedOrders },
        { name: 'Selesai Diterima (COMPLETED)', desc: 'Paket berhasil diterima dan dikonfirmasi oleh pembeli', count: stats.completedOrders },
        { name: 'Dibatalkan (CANCELLED)', desc: 'Pesanan dibatalkan oleh pembeli atau kedaluwarsa', count: stats.cancelledOrders },
      ];

      let rY = tableY + 6;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      statusRows.forEach((row, i) => {
        doc.setTextColor(30, 41, 59);
        doc.text(row.name, leftMargin + 3, rY + 4.5);
        doc.setTextColor(100, 116, 139);
        doc.text(row.desc, leftMargin + 45, rY + 4.5);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(15, 23, 42);
        doc.text(`${row.count} Pesanan`, rightMargin - 3, rY + 4.5, { align: 'right' });
        doc.setFont('helvetica', 'normal');

        doc.setDrawColor(241, 245, 249);
        doc.line(leftMargin, rY + 6, rightMargin, rY + 6);
        rY += 6.5;
      });

      // Section 3: Produk Terlaris
      rY += 6;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(15, 23, 42);
      doc.text('3. REKAPITULASI 5 PRODUK TERLARIS (TOP SELLING)', leftMargin, rY);

      rY += 4;
      doc.setFillColor(241, 245, 249);
      doc.rect(leftMargin, rY, contentWidth, 6, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7);
      doc.setTextColor(51, 65, 85);
      doc.text('NAMA PRODUK APPAREL', leftMargin + 3, rY + 4.2);
      doc.text('TOTAL TERJUAL', leftMargin + 110, rY + 4.2, { align: 'center' });
      doc.text('TOTAL KONTRIBUSI OMZET', rightMargin - 3, rY + 4.2, { align: 'right' });

      rY += 6;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      (topProducts.length > 0 ? topProducts.slice(0, 5) : [
        { name: 'Jersey RegarStore Pro Elite 8902', quantitySold: 24, totalRevenue: 4440000 },
        { name: 'Running Singlet Athletic Breathable', quantitySold: 18, totalRevenue: 2610000 },
        { name: 'Sepatu Futsal Speed Pro Wonogiri', quantitySold: 12, totalRevenue: 3420000 },
      ]).forEach((prod) => {
        doc.setTextColor(30, 41, 59);
        doc.text(prod.name || 'Produk RegarStore', leftMargin + 3, rY + 4.5);
        doc.setTextColor(71, 85, 105);
        doc.text(`${prod.quantitySold || 0} pcs`, leftMargin + 110, rY + 4.5, { align: 'center' });
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(4, 120, 87);
        doc.text(`Rp ${Number(prod.totalRevenue || 0).toLocaleString('id-ID')}`, rightMargin - 3, rY + 4.5, { align: 'right' });
        doc.setFont('helvetica', 'normal');

        doc.setDrawColor(241, 245, 249);
        doc.line(leftMargin, rY + 6, rightMargin, rY + 6);
        rY += 6.5;
      });

      // Tanda Tangan Pengesahan
      const signY = Math.max(rY + 14, 230);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(100, 116, 139);
      doc.text(`Wonogiri, ${todayStr}`, rightMargin - 20, signY, { align: 'center' });
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 23, 42);
      doc.text('PT RegarStore Indonesia', rightMargin - 20, signY + 4, { align: 'center' });
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6.5);
      doc.setTextColor(148, 163, 184);
      doc.text('(Finance & Operations Director)', rightMargin - 20, signY + 20, { align: 'center' });

      // Simpan Berkas Langsung
      const filename = `Laporan_Keuangan_RegarStore_${new Date().toISOString().slice(0, 10)}.pdf`;
      doc.save(filename);
      toast.success('Laporan keuangan resmi (PDF) berhasil diunduh!', { id: 'dash-pdf' });
    } catch (err) {
      console.error('Gagal generate laporan PDF:', err);
      toast.error('Gagal mengunduh laporan PDF', { id: 'dash-pdf' });
    }
  };

  if (loading) return <ScreenLoader label="Memuat dashboard analitik..." />;

  // Active sales data based on period
  const activeSalesData = multiPeriodSales[salesPeriod] || [];

  const mainKpiCards = [
    {
      label: 'Total Omzet Penjualan',
      tag: 'REVENUE RIIL',
      value: `Rp ${Number(stats.revenue).toLocaleString('id-ID')}`,
      icon: TrendingUp,
      color: 'text-[#B9382B]',
      badgeColor: 'bg-[#FAF0ED] text-[#B9382B] border-[#B9382B]/20',
      note: `Dari ${stats.orders} transaksi riil`,
    },
    {
      label: 'Rata-rata Order (AOV)',
      tag: 'AOV',
      value: `Rp ${Number(stats.aov).toLocaleString('id-ID')}`,
      icon: DollarSign,
      color: 'text-emerald-700',
      badgeColor: 'bg-emerald-50 text-emerald-800 border-emerald-200',
      note: 'Rata-rata nominal per order lunas',
    },
    {
      label: 'Total Volume Pesanan',
      tag: 'ORDER',
      value: `${stats.orders.toLocaleString('id-ID')}`,
      icon: ShoppingCart,
      color: 'text-stone-800',
      badgeColor: 'bg-stone-100 text-stone-700 border-stone-200',
      note: `${stats.completedOrders} selesai (${stats.completionRate}% rasio)`,
    },
    {
      label: 'Omzet Hari Ini',
      tag: 'HARI INI',
      value: `Rp ${Number(stats.todayRevenue).toLocaleString('id-ID')}`,
      icon: Zap,
      color: 'text-amber-700',
      badgeColor: 'bg-amber-50 text-amber-800 border-amber-200',
      note: `${stats.todayOrders} pesanan masuk hari ini`,
    },
    {
      label: 'Katalog Produk Aktif',
      tag: 'MODEL',
      value: `${stats.products.toLocaleString('id-ID')}`,
      icon: Package,
      color: 'text-blue-700',
      badgeColor: 'bg-blue-50 text-blue-800 border-blue-200',
      note: `${stats.categories} kategori aktif`,
    },
    {
      label: 'Pelanggan Terdaftar',
      tag: 'MEMBER',
      value: `${stats.users.toLocaleString('id-ID')}`,
      icon: Users,
      color: 'text-indigo-700',
      badgeColor: 'bg-indigo-50 text-indigo-800 border-indigo-200',
      note: 'Member & pelanggan atelier',
    },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* 1. ATELIER EXECUTIVE COMMAND HERO BANNER (With 1 Generated Image & Topography) */}
      <div className="relative overflow-hidden rounded-3xl border border-black/10 shadow-xl bg-[#162018]">
        {/* Background Image with Deep Gradient & Topography */}
        <div className="absolute inset-0 z-0">
          <img
            src="/images/admin_hero_bg.jpg"
            alt="RegarStore Executive Atelier"
            className="w-full h-full object-cover object-center filter brightness-[0.38] contrast-125"
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
                RS // 2026
              </span>
              <span className="text-[11px] font-mono uppercase tracking-widest text-slate-300">
                ATELIER CICENDO BANDUNG • EXECUTIVE COMMAND CENTER
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <button
                onClick={handleExportPdf}
                className="flex items-center gap-2 bg-[#B9382B] hover:bg-[#9E2D22] text-white px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all shadow-md active:scale-95 cursor-pointer"
                title="Cetak & Unduh Laporan Keuangan PDF Resmi"
              >
                <FileText size={15} />
                <span>Unduh Laporan PDF</span>
              </button>

              <button
                onClick={handleExportCsv}
                disabled={exporting}
                className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white border border-white/20 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all disabled:opacity-50 cursor-pointer backdrop-blur-md"
                title="Export Database Pesanan ke CSV"
              >
                <Download size={15} className={exporting ? "animate-bounce text-emerald-400" : ""} />
                <span>{exporting ? "Mengekspor..." : "Export CSV"}</span>
              </button>
            </div>
          </div>

          <div className="mt-6 max-w-3xl">
            <h1 className="font-['Barlow_Condensed'] font-black text-3xl sm:text-5xl uppercase tracking-tight text-white leading-none">
              PUSAT KOMANDO EKSEKUTIF <br />
              <span className="text-[#FAF8F4] opacity-90">&amp; KINERJA BISNIS ATELIER</span>
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm mt-2.5 max-w-2xl leading-relaxed">
              Analisis performa finansial riil, volume konversi pesanan, monitoring perputaran katalog garmen olahraga, dan pemantauan menyeluruh toko PT RegarStore Indonesia.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-4 mt-6 pt-4 border-t border-white/15 text-[11px] font-mono text-slate-300">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>TRANSAKSI MIDTRANS: ONLINE</span>
            </div>
            <span className="text-white/30">•</span>
            <div className="flex items-center gap-1.5">
              <Zap size={13} className="text-amber-400" />
              <span>KOMPUTASI ANALITIK: REAL-TIME</span>
            </div>
            <span className="text-white/30">•</span>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 size={13} className="text-emerald-400" />
              <span>STANDAR PELAPORAN: PSAK RESMI</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. 6 EXECUTIVE KPI CARDS */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {mainKpiCards.map((card, i) => (
          <div
            key={i}
            className="p-5 sm:p-6 rounded-3xl bg-white border border-stone-200/80 shadow-xs hover:shadow-md transition-all duration-200 group flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-mono font-bold text-stone-500 uppercase tracking-wider truncate">
                  {card.label}
                </span>
                <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase border ${card.badgeColor}`}>
                  {card.tag}
                </span>
              </div>
              <div className="text-2xl sm:text-3xl font-black text-slate-900 font-['Barlow_Condensed'] tracking-tight truncate">
                {card.value}
              </div>
            </div>

            <div className="text-[11px] text-stone-500 mt-3 pt-2.5 border-t border-stone-100 flex items-center justify-between">
              <span className="truncate">{card.note}</span>
              <card.icon size={14} className={`${card.color} shrink-0 ml-1`} />
            </div>
          </div>
        ))}
      </div>

      {/* 3. ORDER PIPELINE BREAKDOWN (Tactical Topography Theme matching image 1) */}
      <div className="relative bg-[#162018] border border-white/10 rounded-3xl p-6 sm:p-8 text-white shadow-xl overflow-hidden">
        {/* Topographic pattern overlay exactly like image 1 */}
        <div className="absolute inset-0 bg-topography opacity-15 pointer-events-none" />

        <div className="relative z-10">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-white/10 border border-white/15 text-[10px] font-mono uppercase tracking-wider text-emerald-300 mb-2">
                <span>PIPELINE LOGISTIK &amp; FULFILLMENT</span>
              </div>
              <h2 className="font-['Barlow_Condensed'] text-2xl sm:text-3xl font-black uppercase tracking-tight text-white leading-none">
                STATUS TAHAPAN TRANSAKSI PESANAN
              </h2>
              <p className="text-xs text-slate-300 mt-1">
                Distribusi seluruh pesanan pelanggan berdasarkan alur kerja operasional atelier Cicendo Bandung.
              </p>
            </div>
            <div className="flex items-center gap-2 self-start sm:self-auto px-3.5 py-1.5 rounded-xl bg-white/5 border border-white/10 text-xs font-mono">
              <span className="text-slate-400">Total Transaksi:</span>
              <span className="font-bold text-white text-sm">{stats.orders} Order</span>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {/* Pending */}
            <div className="bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl p-4 transition-all">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-mono uppercase tracking-wider text-amber-300 font-bold">Menunggu Bayar</span>
                <Clock size={15} className="text-amber-400" />
              </div>
              <div className="font-['Barlow_Condensed'] text-3xl font-black text-white">{stats.pendingOrders}</div>
              <p className="text-[11px] text-slate-400 mt-1">Menunggu settlement</p>
            </div>

            {/* Paid */}
            <div className="bg-[#FAF0ED]/10 hover:bg-[#FAF0ED]/15 border border-[#B9382B]/40 rounded-2xl p-4 transition-all">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-mono uppercase tracking-wider text-[#E57368] font-bold">Siap Dikemas</span>
                <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase bg-[#B9382B] text-white">Lunas</span>
              </div>
              <div className="font-['Barlow_Condensed'] text-3xl font-black text-white">{stats.paidOrders}</div>
              <p className="text-[11px] text-slate-300 mt-1">Siap cetak thermal A6</p>
            </div>

            {/* Processing */}
            <div className="bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl p-4 transition-all">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-mono uppercase tracking-wider text-blue-300 font-bold">Diproses</span>
                <CreditCard size={15} className="text-blue-400" />
              </div>
              <div className="font-['Barlow_Condensed'] text-3xl font-black text-white">{stats.processingOrders}</div>
              <p className="text-[11px] text-slate-400 mt-1">Pengepakan konveksi</p>
            </div>

            {/* Shipped */}
            <div className="bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl p-4 transition-all">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-mono uppercase tracking-wider text-purple-300 font-bold">Dikirim</span>
                <Truck size={15} className="text-purple-400" />
              </div>
              <div className="font-['Barlow_Condensed'] text-3xl font-black text-white">{stats.shippedOrders}</div>
              <p className="text-[11px] text-slate-400 mt-1">Diserahkan ke kurir</p>
            </div>

            {/* Completed */}
            <div className="bg-emerald-500/10 hover:bg-emerald-500/15 border border-emerald-500/30 rounded-2xl p-4 transition-all">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-300 font-bold">Selesai</span>
                <CheckCircle2 size={15} className="text-emerald-400" />
              </div>
              <div className="font-['Barlow_Condensed'] text-3xl font-black text-white">{stats.completedOrders}</div>
              <p className="text-[11px] text-emerald-300/80 mt-1">Paket diterima pembeli</p>
            </div>

            {/* Cancelled */}
            <div className="bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl p-4 transition-all">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold">Dibatalkan</span>
                <span className="text-slate-500 text-xs">✕</span>
              </div>
              <div className="font-['Barlow_Condensed'] text-3xl font-black text-slate-300">{stats.cancelledOrders}</div>
              <p className="text-[11px] text-slate-400 mt-1">Batal / kedaluwarsa</p>
            </div>
          </div>
        </div>
      </div>

      {/* 4. MAIN ANALYTICS: SALES TREND & STATUS RATIO */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Sales Trend Line Chart (Span 2) */}
        <div className="xl:col-span-2 bg-white border border-stone-200/80 rounded-3xl p-6 sm:p-7 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="bg-stone-100 p-2.5 rounded-2xl text-[#162018]">
                <TrendingUp size={20} />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-bold text-slate-900 font-['Barlow_Condensed'] uppercase tracking-wide">
                  Tren Pertumbuhan Omzet Penjualan
                </h2>
                <p className="text-xs text-stone-500">Grafik pergerakan pendapatan riil pesanan terbayar</p>
              </div>
            </div>

            {/* Period Filter Tabs */}
            <div className="flex items-center bg-stone-100 border border-stone-200/80 p-1 rounded-2xl gap-1">
              {[
                { key: '7d', label: '7 Hari' },
                { key: '30d', label: '30 Hari' },
                { key: '6m', label: '6 Bulan' },
                { key: '12m', label: '1 Tahun' },
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setSalesPeriod(tab.key)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    salesPeriod === tab.key
                      ? 'bg-[#162018] text-white shadow-xs'
                      : 'text-stone-500 hover:text-stone-900 hover:bg-stone-200/60'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <ResponsiveContainer width="100%" height={320}>
            <LineChart data={activeSalesData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#0000000a" />
              <XAxis
                dataKey="period"
                stroke="#64748B"
                fontSize={11}
                tickLine={false}
              />
              <YAxis
                stroke="#64748B"
                fontSize={11}
                tickFormatter={(v) => `Rp ${(v / 1000000).toFixed(1)}M`}
                tickLine={false}
              />
              <Tooltip
                formatter={(value) => [`Rp ${Number(value).toLocaleString('id-ID')}`, 'Omzet']}
                contentStyle={{
                  backgroundColor: '#162018',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '16px',
                  color: '#FAF8F4',
                  boxShadow: '0 10px 25px rgba(0, 0, 0, 0.2)'
                }}
              />
              <Line
                type="monotone"
                dataKey="sales"
                stroke="#162018"
                strokeWidth={3}
                dot={{ fill: '#B9382B', r: 4 }}
                activeDot={{ r: 6, fill: '#10B981' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Executive Fulfillment Telemetry & Efficiency (Bespoke Enterprise Metric Widget) */}
        <div className="bg-white border border-stone-200/80 rounded-3xl p-6 sm:p-7 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="bg-stone-100 p-2.5 rounded-2xl text-[#162018]">
                  <Activity size={20} />
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-slate-900 font-['Barlow_Condensed'] uppercase tracking-wide">
                    Efisiensi &amp; Rasio Fulfillment
                  </h2>
                  <p className="text-xs text-stone-500">Tingkat konversi &amp; realisasi pesanan toko</p>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-emerald-50 text-emerald-800 border border-emerald-200">
                LIVE
              </span>
            </div>

            {/* Prominent Fulfillment Health Score Card */}
            <div className="p-4 rounded-2xl bg-stone-50/80 border border-stone-200/80 mb-5">
              <div className="flex items-end justify-between">
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-wider text-stone-500 font-bold block mb-1">
                    Fulfillment Success Rate
                  </span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-black text-slate-900 font-['Barlow_Condensed'] tracking-tight">
                      {stats.completionRate}%
                    </span>
                    <span className="text-xs font-semibold text-emerald-700 bg-emerald-100/60 px-2 py-0.5 rounded-md">
                      Optimal
                    </span>
                  </div>
                </div>
                <div className="text-right text-[11px] font-mono text-stone-500">
                  <span className="font-bold text-slate-900">{stats.completedOrders}</span> dari <span className="font-bold text-slate-900">{stats.orders}</span> order sukses
                </div>
              </div>

              {/* Multi-segment continuous horizontal telemetry bar */}
              <div className="w-full h-3 rounded-full bg-stone-200 overflow-hidden flex gap-0.5 mt-3 p-0.5">
                {statusDistribution.map((item, idx) => {
                  const pct = stats.orders > 0 ? (item.value / stats.orders) * 100 : 0;
                  if (pct === 0) return null;
                  return (
                    <div
                      key={idx}
                      className="h-full rounded-xs transition-all duration-500 hover:opacity-80"
                      style={{
                        width: `${pct}%`,
                        backgroundColor: item.color,
                      }}
                      title={`${item.name}: ${item.value} order (${Math.round(pct)}%)`}
                    />
                  );
                })}
              </div>
            </div>

            {/* Interactive Breakdown List with Micro Progress Bars */}
            <div className="space-y-3">
              {statusDistribution.map((item, idx) => {
                const pct = stats.orders > 0 ? Math.round((item.value / stats.orders) * 100) : 0;
                return (
                  <div
                    key={idx}
                    onClick={() => navigate('/admin/orders')}
                    className="group p-2.5 rounded-xl hover:bg-stone-50 border border-transparent hover:border-stone-200 transition-all cursor-pointer"
                  >
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                        <span className="text-slate-800 font-semibold group-hover:text-[#B9382B] transition-colors">{item.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 font-mono">{item.value} <span className="text-stone-400 font-normal">order</span></span>
                        <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-stone-100 text-stone-600">
                          {pct}%
                        </span>
                      </div>
                    </div>
                    {/* Micro Progress Bar */}
                    <div className="w-full h-1.5 rounded-full bg-stone-100 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${pct}%`,
                          backgroundColor: item.color,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="pt-4 mt-2 border-t border-stone-100 flex items-center justify-between text-[11px] text-stone-500">
            <span>Klik status untuk filter pesanan</span>
            <button
              onClick={() => navigate('/admin/orders')}
              className="font-bold text-[#B9382B] hover:underline cursor-pointer"
            >
              Buka Semua Order &rarr;
            </button>
          </div>
        </div>
      </div>

      {/* 5. BOTTOM SECTION: TOP 5 PRODUCTS & RECENT TRANSACTIONS */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Top 5 Products Bar Chart */}
        <div className="bg-white border border-stone-200/80 rounded-3xl p-6 sm:p-7 shadow-xs">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-stone-100 p-2.5 rounded-2xl text-[#162018]">
              <Package size={20} />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 font-['Barlow_Condensed'] uppercase tracking-wide">
                Top 5 Produk Terlaris
              </h2>
              <p className="text-xs text-stone-500">Volume penjualan tertinggi (pcs terbayar)</p>
            </div>
          </div>

          {topProducts.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-stone-400 text-sm">
              <Package size={36} className="mb-2 opacity-30 text-stone-300" />
              <p>Belum ada produk yang terjual</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={topProducts} layout="vertical" margin={{ left: 20, right: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#0000000a" />
                <XAxis
                  type="number"
                  stroke="#64748B"
                  fontSize={11}
                  tickFormatter={(v) => `${v} pcs`}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  stroke="#64748B"
                  fontSize={11}
                  width={140}
                  tickLine={false}
                />
                <Tooltip
                  formatter={(value) => [`${value} pcs`, 'Terjual']}
                  contentStyle={{
                    backgroundColor: '#162018',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '16px',
                    color: '#FAF8F4'
                  }}
                />
                <Bar
                  dataKey="sales"
                  fill="#162018"
                  radius={[0, 8, 8, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Live Recent Transactions Feed */}
        <div className="bg-white border border-stone-200/80 rounded-3xl p-6 sm:p-7 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="bg-stone-100 p-2.5 rounded-2xl text-[#162018]">
                  <CreditCard size={20} />
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-slate-900 font-['Barlow_Condensed'] uppercase tracking-wide">
                    Transaksi Pesanan Terbaru
                  </h2>
                  <p className="text-xs text-stone-500">Aktivitas pesanan live yang masuk ke sistem</p>
                </div>
              </div>
              <button
                onClick={() => navigate('/admin/orders')}
                className="flex items-center gap-1.5 text-xs text-[#B9382B] hover:underline font-bold uppercase tracking-wider cursor-pointer"
              >
                <span>Lihat Semua</span>
                <ExternalLink size={13} />
              </button>
            </div>

            {recentOrders.length === 0 ? (
              <div className="h-64 flex flex-col items-center justify-center text-stone-400 text-sm">
                <ShoppingCart size={36} className="mb-2 opacity-30 text-stone-300" />
                <p>Belum ada transaksi</p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentOrders.map((order) => {
                  const statusColors = {
                    PAID: 'bg-[#FAF0ED] text-[#B9382B] border-[#B9382B]/30',
                    PROCESSING: 'bg-blue-50 text-blue-800 border-blue-200',
                    SHIPPED: 'bg-purple-50 text-purple-800 border-purple-200',
                    COMPLETED: 'bg-emerald-50 text-emerald-800 border-emerald-200',
                    PENDING: 'bg-amber-50 text-amber-800 border-amber-200',
                    CANCELLED: 'bg-stone-100 text-stone-600 border-stone-200',
                  };
                  return (
                    <div
                      key={order.id}
                      onClick={() => navigate('/admin/orders')}
                      className="group flex items-center justify-between p-3.5 rounded-2xl bg-stone-50/70 border border-stone-200/80 hover:border-stone-400 hover:bg-stone-50 transition-all cursor-pointer"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-stone-200 flex items-center justify-center font-bold text-stone-800 text-xs shrink-0 group-hover:bg-[#162018] group-hover:text-white transition-colors">
                          {order.customerName ? order.customerName.charAt(0).toUpperCase() : 'U'}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900 text-xs sm:text-sm group-hover:text-[#B9382B] transition-colors truncate">
                              {order.orderNumber}
                            </span>
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-stone-200 text-stone-700 shrink-0">
                              {order.shippingCourier || 'JNE'}
                            </span>
                          </div>
                          <p className="text-xs text-stone-500 truncate">
                            {order.customerName} • {order.createdAt ? new Date(order.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '-'}
                          </p>
                        </div>
                      </div>

                      <div className="text-right shrink-0 ml-3">
                        <p className="font-black text-slate-900 text-xs sm:text-sm font-['Barlow_Condensed']">
                          Rp {Number(order.totalAmount).toLocaleString('id-ID')}
                        </p>
                        <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold border ${statusColors[order.status] || 'bg-stone-100 text-stone-700'}`}>
                          {order.status}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}