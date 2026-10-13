import {
  ShieldCheck,
  Zap,
  Award,
  MapPin,
  Layers,
  ArrowRight,
  Printer,
  Shirt,
  Flame,
  CheckCircle2,
  Compass,
  MessageCircle,
} from "lucide-react";
import { Link } from "react-router-dom";

const pillars = [
  {
    icon: Printer,
    tag: "TEKNOLOGI CETAK",
    title: "OEKO-TEX® Sublimation Ink",
    desc: "Menggunakan formulasi tinta sublimasi standar OEKO-TEX asal Italia & Jepang. Warna pekat beresolusi 1440 DPI, anti-pudar, dan 100% aman kontak kulit tanpa memicu iritasi.",
  },
  {
    icon: Shirt,
    tag: "MATERIAL SPESIFIKASI",
    title: "180 GSM Dri-Fit Milano Mesh",
    desc: "Kain rajut mikropori berteknologi pelepasan panas kilat. Ringan, lentur 4 arah, serta mempertahankan sirkulasi udara optimal pada suhu kompetisi intensitas tinggi.",
  },
  {
    icon: ShieldCheck,
    tag: "JAMINAN KONSUMEN",
    title: "Garansi 7 Hari Tukar & Revisi",
    desc: "Setiap pesanan dijamin 100% bebas salah cetak. Jika terdapat cacat jahitan, salah ejaan nama, nomor punggung, atau ukuran tidak pas, kami ganti baru tanpa biaya tambahan.",
  },
  {
    icon: Flame,
    tag: "FLEKSIBILITAS TIM",
    title: "Zero Minimum Order Quantity",
    desc: "Layanan kustomisasi jersey tanpa batas minimum pemesanan. Pesan 1 pcs untuk kapten atau 500 pcs untuk satu korps kontingen tetap kami layani dengan standar atelier terbaik.",
  },
];

const milestones = [
  { value: "100%", label: "Original Atelier Cicendo", sub: "Produksi In-House Mandiri" },
  { value: "48 JAM", label: "Siklus Rilis Mockup", sub: "Digital Preview Presisi" },
  { value: "10.000+", label: "Tim & Komunitas Juara", sub: "Sepak Bola, Voli, Basket & eSports" },
  { value: "7 HARI", label: "Garansi Kepuasan Penuh", sub: "Bebas Resiko 100%" },
];

export default function About() {
  return (
    <div className="min-h-screen bg-[#FAF8F4] text-stone-900 py-12 md:py-16">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 space-y-16 md:space-y-24">
        
        {/* Hero Section */}
        <section className="text-center space-y-5 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 rounded-full border border-stone-300 bg-white px-3.5 py-1.5 font-mono text-xs font-bold uppercase tracking-widest text-[#162018] shadow-xs">
            <Compass size={13} className="text-[#B9382B]" />
            <span>KORPS RISET & MANUFAKTUR APPAREL OLAHRAGA</span>
          </div>

          <h1 className="font-condensed text-4xl sm:text-5xl md:text-6xl font-black uppercase tracking-tight text-stone-950 leading-[1.05]">
            DEDIKASI KERAJINAN TEKSTIL
            <br />
            <span className="text-[#B9382B]">ATELIER CICENDO BANDUNG</span>
          </h1>

          <p className="text-stone-600 text-sm md:text-base leading-relaxed max-w-2xl mx-auto">
            RegarStore lahir dari gairah mendalam terhadap performa atletik. Kami bukan sekadar penjual pakaian, melainkan bengkel manufaktur terintegrasi tempat seni desain grafis, riset serat mikropori, dan teknologi sublimasi modern menyatu melahirkan seragam tempur para juara.
          </p>
        </section>

        {/* High-Impact Milestone Metrics */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
          {milestones.map(({ value, label, sub }) => (
            <div
              key={label}
              className="group relative overflow-hidden rounded-2xl border border-stone-200/80 bg-white p-6 text-center shadow-xs transition hover:-translate-y-1 hover:border-stone-400 hover:shadow-md"
            >
              <div className="font-condensed text-3xl sm:text-4xl font-black text-stone-950 group-hover:text-[#B9382B] transition-colors">
                {value}
              </div>
              <div className="font-condensed text-sm font-bold uppercase tracking-wide text-stone-900 mt-1">
                {label}
              </div>
              <div className="font-mono text-[11px] text-stone-400 mt-1">
                {sub}
              </div>
            </div>
          ))}
        </section>

        {/* Narrative & Craftsmanship Showcase */}
        <section className="grid md:grid-cols-2 gap-8 items-center">
          <div className="space-y-4">
            <span className="font-mono text-xs font-bold uppercase tracking-widest text-[#B9382B]">
              // FILOSOFI KAMI
            </span>
            <h2 className="font-condensed text-3xl sm:text-4xl font-black uppercase tracking-tight text-stone-950">
              Setiap Garis, Jahitan, dan Warna Mengusung Kehormatan Tim
            </h2>
            <p className="text-stone-600 text-sm leading-relaxed">
              Di lapangan pertandingan, jersey bukan sekadar penutup tubuh. Ia adalah lambang identitas, rasa percaya diri, dan simbol kehormatan yang dikenakan bersama rekan seperjuangan.
            </p>
            <p className="text-stone-600 text-sm leading-relaxed">
              Oleh sebab itu, setiap sentimeter jersey yang keluar dari mesin sublimasi kami di Cicendo Bandung melalui proses inspeksi ganda: memastikan akurasi warna tajam, benang elastis anti-putus saat duel fisik, serta kenyamanan ventilasi udara saat keringat bercucuran.
            </p>
            
            <div className="pt-2 space-y-2">
              <div className="flex items-center gap-2.5 text-xs font-bold text-stone-800">
                <CheckCircle2 size={16} className="text-emerald-600" />
                <span>Teknologi Jahitan Flatlock Anti-Gesekan Kulit</span>
              </div>
              <div className="flex items-center gap-2.5 text-xs font-bold text-stone-800">
                <CheckCircle2 size={16} className="text-emerald-600" />
                <span>Pola Kerah Ergonomis Tahan Tarikan Fisik</span>
              </div>
              <div className="flex items-center gap-2.5 text-xs font-bold text-stone-800">
                <CheckCircle2 size={16} className="text-emerald-600" />
                <span>Sublimasi Penuh Depan, Belakang, Lengan & Kerah</span>
              </div>
            </div>
          </div>

          {/* Tactical Visual Card */}
          <div className="relative rounded-3xl bg-[#162018] p-8 text-white border border-[#243327] shadow-xl overflow-hidden">
            <div className="absolute inset-0 bg-topography opacity-15 pointer-events-none" />
            <div className="relative z-10 space-y-6">
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <span className="font-mono text-xs text-stone-400">SPECIFICATION // CERTIFICATE</span>
                <span className="font-mono text-xs font-bold text-emerald-400">PASSED ISO 9001</span>
              </div>

              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="rounded-xl bg-white/10 p-2.5 text-emerald-400 shrink-0">
                    <Layers size={20} />
                  </div>
                  <div>
                    <h3 className="font-condensed text-base font-bold uppercase tracking-wider text-white">
                      Riset Serat Mikropori
                    </h3>
                    <p className="text-xs text-stone-400 mt-0.5">
                      Bahan diuji untuk ketahanan cuci hingga 100x tanpa penurunan daya serap air atau kelunturan grafis.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="rounded-xl bg-white/10 p-2.5 text-[#B9382B] shrink-0">
                    <Zap size={20} />
                  </div>
                  <div>
                    <h3 className="font-condensed text-base font-bold uppercase tracking-wider text-white">
                      Rancangan Aerodinamis
                    </h3>
                    <p className="text-xs text-stone-400 mt-0.5">
                      Potongan pola dirancang mengikuti lekuk pergerakan bahu dan torso atlet saat melompat dan berlari kencang.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="rounded-xl bg-white/10 p-2.5 text-amber-400 shrink-0">
                    <Award size={20} />
                  </div>
                  <div>
                    <h3 className="font-condensed text-base font-bold uppercase tracking-wider text-white">
                      Akurasi Mockup Nyata
                    </h3>
                    <p className="text-xs text-stone-400 mt-0.5">
                      Hasil jadi apparel identik 99% dengan visual 3D mockup yang Anda setujui sebelum produksi.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 4 Pillars of Excellence */}
        <section className="space-y-8">
          <div className="text-center space-y-2">
            <span className="font-mono text-xs font-bold uppercase tracking-widest text-[#B9382B]">
              // STANDAR KUALITAS
            </span>
            <h2 className="font-condensed text-3xl sm:text-4xl font-black uppercase tracking-tight text-stone-950">
              4 Pilar Keunggulan Produksi
            </h2>
            <p className="text-stone-600 text-xs sm:text-sm max-w-xl mx-auto">
              Standar baku tanpa kompromi yang diterapkan pada setiap helai pakaian olahraga kami.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {pillars.map(({ icon: Icon, tag, title, desc }) => (
              <div
                key={title}
                className="group rounded-2xl border border-stone-200/80 bg-white p-6 shadow-xs transition hover:-translate-y-1 hover:border-stone-400 hover:shadow-md flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#FAF8F4] border border-stone-200 text-[#162018] group-hover:bg-[#162018] group-hover:text-white transition">
                      <Icon size={20} />
                    </div>
                    <span className="font-mono text-[10px] font-bold text-stone-400 tracking-wider">
                      {tag}
                    </span>
                  </div>
                  <h3 className="font-condensed text-lg font-bold uppercase tracking-tight text-stone-950 mb-2">
                    {title}
                  </h3>
                  <p className="text-xs text-stone-600 leading-relaxed">
                    {desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Flagship Atelier & Workshop Location */}
        <section className="relative overflow-hidden rounded-3xl bg-[#162018] text-white p-8 md:p-12 border border-[#243327] shadow-2xl">
          <div className="absolute inset-0 bg-topography opacity-15 pointer-events-none" />
          <div className="absolute top-0 right-0 -mr-16 -mt-16 w-80 h-80 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />

          <div className="relative z-10 max-w-4xl space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-1.5 font-mono text-xs uppercase tracking-widest text-emerald-400">
              <MapPin size={13} />
              <span>FLAGSHIP ATELIER & PUSAT PRODUKSI</span>
            </div>

            <div>
              <h2 className="font-condensed text-3xl sm:text-4xl md:text-5xl font-black uppercase tracking-tight text-white">
                Cicendo, Kota Bandung
              </h2>
              <p className="font-mono text-xs text-stone-400 mt-1">
                LAT: -6.9147° S // LONG: 107.6098° E // ELEVASI: 768M KOTA BANDUNG
              </p>
            </div>

            <p className="text-stone-300 text-sm md:text-base leading-relaxed max-w-3xl">
              Studio riset tekstil, rancang bangun pola aerodinamis, dan pusat sublimasi berstandar atlet profesional kami beroperasi penuh di jantung Cicendo, Kota Bandung. Seluruh pesanan custom jersey dan kit apparel diproduksi langsung di bawah satu atap dengan kontrol mutu ketat.
            </p>

            <div className="grid sm:grid-cols-3 gap-6 pt-6 border-t border-white/10 text-xs">
              <div>
                <span className="font-condensed text-sm font-bold uppercase tracking-wider text-white block mb-1">
                  Alamat Manufaktur:
                </span>
                <p className="text-stone-400 leading-relaxed">
                  Jl. Pasir Kaliki No. 123, Kel. Pasirkaliki, Kec. Cicendo, Kota Bandung, Jawa Barat 40171
                </p>
              </div>

              <div>
                <span className="font-condensed text-sm font-bold uppercase tracking-wider text-white block mb-1">
                  Jam Operasional Workshop:
                </span>
                <p className="text-stone-400 leading-relaxed">
                  Senin – Sabtu: 08.00 – 20.00 WIB
                  <br />
                  Minggu & Hari Libur: Penjadwalan Khusus
                </p>
              </div>

              <div>
                <span className="font-condensed text-sm font-bold uppercase tracking-wider text-white block mb-1">
                  Layanan Konsultasi Tim:
                </span>
                <p className="text-stone-400 leading-relaxed">
                  Tersedia fitting offline langsung di atelier atau konsultasi desain mockup via WhatsApp Official.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="rounded-3xl border border-stone-200/80 bg-white p-8 md:p-12 text-center shadow-sm space-y-6">
          <div className="space-y-2 max-w-xl mx-auto">
            <span className="font-mono text-xs font-bold uppercase tracking-widest text-[#B9382B]">
              // WUJUDKAN IDENTITAS TIM
            </span>
            <h2 className="font-condensed text-3xl sm:text-4xl font-black uppercase tracking-tight text-stone-950">
              Siap Memulai Seragam Baru Tim Anda?
            </h2>
            <p className="text-stone-600 text-xs sm:text-sm leading-relaxed">
              Jelajahi etalase produk olahraga atau hubungi tim desainer kami untuk mockup kustom jersey tim secara gratis.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <Link
              to="/dashboard"
              className="inline-flex items-center gap-2 rounded-xl bg-[#162018] hover:bg-stone-900 px-6 py-3.5 font-condensed text-sm font-bold uppercase tracking-wider text-white shadow-md transition transform hover:-translate-y-0.5"
            >
              <span>Jelajahi Katalog Toko</span>
              <ArrowRight size={16} />
            </Link>

            <a
              href="https://wa.me/6281234567890?text=Halo%20Atelier%20RegarStore%20Cicendo%2C%20saya%20ingin%20konsultasi%20pembuatan%20jersey%20custom"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-xl border border-stone-300 bg-white hover:bg-stone-100 px-6 py-3.5 font-condensed text-sm font-bold uppercase tracking-wider text-stone-900 transition"
            >
              <MessageCircle size={16} className="text-emerald-600" />
              <span>Konsultasi Desain WhatsApp</span>
            </a>
          </div>
        </section>

      </div>
    </div>
  );
}