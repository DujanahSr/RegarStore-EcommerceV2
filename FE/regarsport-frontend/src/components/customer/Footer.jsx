import { Link } from "react-router-dom";
import {
  ShieldCheck,
  Phone,
  CheckCircle2,
  Building2,
  Clock,
  ArrowRight,
} from "lucide-react";
import RegarStoreLogo from "../common/RegarStoreLogo";

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-[#121A14] text-white pt-16 pb-12 border-t border-white/10 relative overflow-hidden">
      {/* Topographic Texture */}
      <div className="absolute inset-0 bg-topography opacity-15 pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 space-y-12">
        {/* 4 Multi-Column Links */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 text-xs text-slate-400">
          {/* Brand & Atelier Info Column */}
          <div className="space-y-3.5">
            <div className="flex items-center gap-2.5">
              <RegarStoreLogo size={32} />
              <span className="font-condensed text-xl font-bold uppercase tracking-wider text-white">
                PT REGARSTORE INDONESIA
              </span>
            </div>
            <p className="text-[11px] leading-relaxed text-slate-300">
              Pusat manufaktur apparel dan jersey olahraga profesional berteknologi digital sublimasi modern terintegrasi di Cicendo, Kota Bandung.
            </p>
            <div className="space-y-1 text-[10px] text-slate-400 font-mono">
              <div className="flex items-center gap-1.5 text-slate-300">
                <Building2 size={12} className="text-emerald-400 shrink-0" />
                <span>Jl. Cicendo No. 18, Pasir Kaliki, Bandung 40171</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Clock size={12} className="text-emerald-400 shrink-0" />
                <span>Senin – Sabtu: 08.00 – 21.00 WIB</span>
              </div>
              <div>NPWP: 01.345.678.9-521.000</div>
            </div>

            {/* Social Media Channels */}
            <div className="pt-1 flex items-center gap-2">
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                className="px-2.5 py-1 rounded-full bg-white/5 hover:bg-white/15 text-slate-300 hover:text-white border border-white/10 text-[10px] font-bold uppercase tracking-wider transition-colors"
              >
                Instagram
              </a>
              <a
                href="https://tiktok.com"
                target="_blank"
                rel="noopener noreferrer"
                className="px-2.5 py-1 rounded-full bg-white/5 hover:bg-white/15 text-slate-300 hover:text-white border border-white/10 text-[10px] font-bold uppercase tracking-wider transition-colors"
              >
                TikTok
              </a>
              <a
                href="https://wa.me/6281234567890"
                target="_blank"
                rel="noopener noreferrer"
                className="px-2.5 py-1 rounded-full bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 hover:text-white border border-emerald-500/30 text-[10px] font-bold uppercase tracking-wider transition-colors"
              >
                WhatsApp
              </a>
            </div>
          </div>

          {/* Column 2: Katalog Olahraga */}
          <div>
            <h5 className="font-condensed text-sm font-bold uppercase tracking-wider text-white mb-3 flex items-center gap-2">
              <span>KATALOG OLAHRAGA</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            </h5>
            <ul className="space-y-2.5 text-[11px]">
              <li>
                <Link to="/dashboard?categoryId=1" className="hover:text-emerald-300 transition-colors flex items-center justify-between group">
                  <span>Jersey Sepakbola &amp; Futsal</span>
                  <span className="text-[10px] text-slate-500 group-hover:text-emerald-400 font-mono">10+</span>
                </Link>
              </li>
              <li>
                <Link to="/dashboard?categoryId=2" className="hover:text-emerald-300 transition-colors flex items-center justify-between group">
                  <span>Jersey Bola Voli Pro Liga</span>
                  <span className="text-[10px] text-slate-500 group-hover:text-emerald-400 font-mono">10+</span>
                </Link>
              </li>
              <li>
                <Link to="/dashboard?categoryId=3" className="hover:text-emerald-300 transition-colors flex items-center justify-between group">
                  <span>Jersey Badminton Elite</span>
                  <span className="text-[10px] text-slate-500 group-hover:text-emerald-400 font-mono">10+</span>
                </Link>
              </li>
              <li>
                <Link to="/dashboard?categoryId=4" className="hover:text-emerald-300 transition-colors flex items-center justify-between group">
                  <span>Custom Jersey Komunitas &amp; Esport</span>
                  <span className="text-[10px] text-slate-500 group-hover:text-emerald-400 font-mono">10+</span>
                </Link>
              </li>
              <li>
                <Link to="/dashboard?categoryId=5" className="hover:text-emerald-300 transition-colors flex items-center justify-between group">
                  <span>Jersey Basket &amp; Streetball</span>
                  <span className="text-[10px] text-slate-500 group-hover:text-emerald-400 font-mono">10+</span>
                </Link>
              </li>
              <li className="pt-1">
                <Link to="/dashboard" className="text-emerald-400 font-bold hover:underline flex items-center gap-1">
                  <span>Buka Katalog Lengkap (50+ Produk)</span>
                  <ArrowRight size={12} />
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Garansi & Layanan Pelanggan */}
          <div>
            <h5 className="font-condensed text-sm font-bold uppercase tracking-wider text-white mb-3 flex items-center gap-2">
              <span>GARANSI &amp; LAYANAN</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            </h5>
            <ul className="space-y-2.5 text-[11px]">
              <li>
                <Link to="/dashboard/about" className="hover:text-emerald-300 transition-colors flex items-center gap-1.5">
                  <ShieldCheck size={13} className="text-emerald-400" />
                  <span>Ketentuan Garansi Tukar Ukuran 100%</span>
                </Link>
              </li>
              <li>
                <Link to="/dashboard/cart" className="hover:text-emerald-300 transition-colors block">
                  Status Keranjang Belanja
                </Link>
              </li>
              <li>
                <Link to="/dashboard/my-orders" className="hover:text-emerald-300 transition-colors block">
                  Lacak Pesanan &amp; Status Resi
                </Link>
              </li>
              <li>
                <Link to="/dashboard/favorites" className="hover:text-emerald-300 transition-colors block">
                  Wishlist Jersey Favorit
                </Link>
              </li>
              <li>
                <Link to="/dashboard/about" className="hover:text-emerald-300 transition-colors block">
                  Profil Atelier Cicendo Bandung
                </Link>
              </li>
              <li>
                <a
                  href="https://wa.me/6281234567890?text=Halo%20RegarStore,%20saya%20ingin%20konsultasi%20layanan%20dan%20garansi"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-emerald-400 font-semibold hover:underline flex items-center gap-1"
                >
                  <Phone size={12} />
                  <span>Konsultasi WhatsApp Customer Care</span>
                </a>
              </li>
            </ul>
          </div>

          {/* Column 4: Keamanan, Pembayaran & Ekspedisi */}
          <div className="space-y-3.5">
            <h5 className="font-condensed text-sm font-bold uppercase tracking-wider text-white flex items-center gap-2">
              <span>PEMBAYARAN &amp; EKSPEDISI</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            </h5>
            <p className="text-[11px] leading-relaxed text-slate-300">
              Didukung gerbang pembayaran otomatis Midtrans dan kurir express resmi dengan nomor resi terverifikasi ke seluruh Indonesia.
            </p>

            {/* Payment Methods Pills */}
            <div>
              <div className="text-[10px] uppercase font-bold text-slate-400 mb-1.5">Metode Pembayaran</div>
              <div className="flex flex-wrap gap-1.5 text-[9px] font-black uppercase text-slate-200">
                <span className="px-2 py-0.5 rounded bg-white/10 border border-white/15">QRIS</span>
                <span className="px-2 py-0.5 rounded bg-white/10 border border-white/15">BCA</span>
                <span className="px-2 py-0.5 rounded bg-white/10 border border-white/15">MANDIRI</span>
                <span className="px-2 py-0.5 rounded bg-white/10 border border-white/15">BRI</span>
                <span className="px-2 py-0.5 rounded bg-white/10 border border-white/15">GOPAY</span>
              </div>
            </div>

            {/* Courier Partners Pills */}
            <div>
              <div className="text-[10px] uppercase font-bold text-slate-400 mb-1.5">Kurir Pengiriman</div>
              <div className="flex flex-wrap gap-1.5 text-[9px] font-black uppercase text-slate-200">
                <span className="px-2 py-0.5 rounded bg-white/10 border border-white/15">J&amp;T Express</span>
                <span className="px-2 py-0.5 rounded bg-white/10 border border-white/15">JNE</span>
                <span className="px-2 py-0.5 rounded bg-white/10 border border-white/15">SiCepat</span>
              </div>
            </div>

            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-[10px] font-semibold text-emerald-300">
              <CheckCircle2 size={13} className="text-emerald-400 shrink-0" />
              <span>Verified SSL 256-bit Secure Checkout</span>
            </div>
          </div>
        </div>

        {/* Copyright Bar */}
        <div className="pt-8 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-500 gap-3">
          <div>
            © {year} PT RegarStore Indonesia. Hak Cipta Dilindungi Undang-Undang.
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <Link to="/" className="hover:text-white transition-colors">Beranda Utama</Link>
            <span>•</span>
            <Link to="/dashboard/about" className="hover:text-white transition-colors">Tentang Perusahaan</Link>
            <span>•</span>
            <Link to="/dashboard/about" className="hover:text-white transition-colors">Kebijakan Retur &amp; Garansi</Link>
            <span>•</span>
            <span className="text-slate-400 font-medium">Cicendo, Kota Bandung • Indonesia</span>
          </div>
        </div>
      </div>
    </footer>
  );
}