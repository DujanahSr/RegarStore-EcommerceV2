import { useState } from 'react';
import { Award, Shirt, CheckCircle2 } from 'lucide-react';

export default function JerseyPreviewMockup({
  productImage = '',
  productName = '',
  customName = 'DUJANAH',
  customNumber = '10',
  customCollar = 'O-Neck',
  customTeam = '',
  selectedSize = 'M',
}) {
  const [activeTab, setActiveTab] = useState('back'); // 'back' | 'front'

  const displayName = customName ? customName.trim().toUpperCase() : 'NAMA ANDA';
  const displayNumber = customNumber ? customNumber.trim() : '10';
  const displayTeam = customTeam ? customTeam.trim().toUpperCase() : 'REGARSTORE ATELIER';

  return (
    <div className="w-full rounded-2xl bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 border border-slate-800 text-white shadow-xl overflow-hidden flex flex-col items-center">
      {/* View Switcher Header */}
      <div className="w-full px-4 py-3 flex items-center justify-between border-b border-slate-800/80 bg-slate-950/60 backdrop-blur-xs">
        <div className="flex items-center gap-2">
          <Shirt size={13} className="text-emerald-400 shrink-0" />
          <span className="text-[11px] font-bold font-mono tracking-wider text-emerald-400 uppercase">
            Live Preview Sablon
          </span>
        </div>

        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-900 border border-slate-800">
          <button
            type="button"
            onClick={() => setActiveTab('back')}
            className={`text-xs font-bold px-3 py-1 rounded-lg transition cursor-pointer ${
              activeTab === 'back'
                ? 'bg-emerald-500 text-slate-950 shadow-xs'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            Tampak Belakang
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('front')}
            className={`text-xs font-bold px-3 py-1 rounded-lg transition cursor-pointer ${
              activeTab === 'front'
                ? 'bg-emerald-500 text-slate-950 shadow-xs'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            Tampak Depan
          </button>
        </div>
      </div>

      {/* Main Mockup Presentation Canvas */}
      <div className="w-full p-4 sm:p-6 flex flex-col items-center justify-center relative min-h-[360px]">
        {activeTab === 'back' ? (
          /* ===================================================
             TAMPAK BELAKANG (REALISTIC ATHLETIC JERSEY SILHOUETTE)
             =================================================== */
          <div className="relative w-64 sm:w-72 transition-all duration-300 transform hover:scale-[1.02]">
            {/* SVG Silhouette of Athletic Jersey Back */}
            <svg
              viewBox="0 0 300 360"
              className="w-full h-auto drop-shadow-[0_15px_25px_rgba(0,0,0,0.7)]"
              xmlns="http://www.w3.org/2000/svg"
            >
              <defs>
                {/* Fabric gradient & lighting */}
                <linearGradient id="jerseyFabric" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#1e293b" />
                  <stop offset="45%" stopColor="#0f172a" />
                  <stop offset="100%" stopColor="#020617" />
                </linearGradient>

                <linearGradient id="sleeveShadeL" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#090d16" />
                  <stop offset="100%" stopColor="#1e293b" />
                </linearGradient>

                <linearGradient id="sleeveShadeR" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#1e293b" />
                  <stop offset="100%" stopColor="#090d16" />
                </linearGradient>

                <linearGradient id="goldAccent" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#10b981" />
                  <stop offset="100%" stopColor="#34d399" />
                </linearGradient>

                {/* Dry-Fit Breathable Micro-Mesh Pattern */}
                <pattern id="microMesh" width="8" height="8" patternUnits="userSpaceOnUse">
                  <circle cx="2" cy="2" r="0.8" fill="#ffffff" fillOpacity="0.04" />
                  <circle cx="6" cy="6" r="0.8" fill="#ffffff" fillOpacity="0.04" />
                </pattern>
              </defs>

              {/* Shadow Base */}
              <ellipse cx="150" cy="350" rx="95" ry="8" fill="rgba(0,0,0,0.5)" filter="blur(4px)" />

              {/* Left Raglan Sleeve */}
              <path
                d="M 95 38 L 22 92 L 48 142 L 88 122 Z"
                fill="url(#sleeveShadeL)"
                stroke="#334155"
                strokeWidth="1.5"
              />
              {/* Left Sleeve Cuff Band */}
              <path d="M 22 92 L 48 142 L 41 146 L 15 96 Z" fill="url(#goldAccent)" opacity="0.9" />

              {/* Right Raglan Sleeve */}
              <path
                d="M 205 38 L 278 92 L 252 142 L 212 122 Z"
                fill="url(#sleeveShadeR)"
                stroke="#334155"
                strokeWidth="1.5"
              />
              {/* Right Sleeve Cuff Band */}
              <path d="M 278 92 L 252 142 L 259 146 L 285 96 Z" fill="url(#goldAccent)" opacity="0.9" />

              {/* Jersey Main Torso (Athletic Tapered Cut) */}
              <path
                d="M 95 38 Q 150 48 205 38 L 214 125 Q 218 240 216 332 Q 150 340 84 332 Q 82 240 86 125 Z"
                fill="url(#jerseyFabric)"
                stroke="#334155"
                strokeWidth="2"
              />

              {/* Micro-mesh overlay texture */}
              <path
                d="M 95 38 Q 150 48 205 38 L 214 125 Q 218 240 216 332 Q 150 340 84 332 Q 82 240 86 125 Z"
                fill="url(#microMesh)"
              />

              {/* Side Ventilation Ribbed Panels */}
              <path
                d="M 86 125 Q 82 240 84 332 L 95 330 Q 92 235 96 125 Z"
                fill="url(#goldAccent)"
                opacity="0.35"
              />
              <path
                d="M 214 125 Q 218 240 216 332 L 205 330 Q 208 235 204 125 Z"
                fill="url(#goldAccent)"
                opacity="0.35"
              />

              {/* Raglan Stitching Seams */}
              <path d="M 95 38 Q 115 78 88 122" fill="none" stroke="#475569" strokeWidth="1.5" strokeDasharray="3,2" />
              <path d="M 205 38 Q 185 78 212 122" fill="none" stroke="#475569" strokeWidth="1.5" strokeDasharray="3,2" />

              {/* Dynamic Collar Variations */}
              {customCollar === 'V-Neck' ? (
                /* V-Neck Collar Back */
                <g>
                  <path d="M 95 38 Q 150 50 205 38 Q 150 42 95 38 Z" fill="#090d16" />
                  <path d="M 95 38 Q 150 50 205 38" fill="none" stroke="url(#goldAccent)" strokeWidth="4" />
                </g>
              ) : customCollar === 'Kerah Polo' ? (
                /* Polo Collar Folded Back */
                <g>
                  <path d="M 88 28 L 102 46 Q 150 56 198 46 L 212 28 Q 150 36 88 28 Z" fill="#0f172a" stroke="url(#goldAccent)" strokeWidth="2.5" />
                  <path d="M 102 46 Q 150 56 198 46" fill="none" stroke="#334155" strokeWidth="1.5" />
                </g>
              ) : (
                /* Standard O-Neck Collar Back */
                <g>
                  <path d="M 95 38 Q 150 48 205 38 Q 150 36 95 38 Z" fill="#090d16" />
                  <path d="M 95 38 Q 150 48 205 38" fill="none" stroke="url(#goldAccent)" strokeWidth="4.5" strokeLinecap="round" />
                </g>
              )}

              {/* Authentic Hem Bottom Stitch */}
              <path d="M 84 332 Q 150 340 216 332" fill="none" stroke="#334155" strokeWidth="2.5" />
            </svg>

            {/* Sablon Sublimasi Overlay (Nameset, Number, Team) */}
            <div className="absolute inset-0 flex flex-col items-center justify-between pt-16 pb-9 px-8 pointer-events-none">
              {/* Nameset (Nama Punggung) */}
              <div className="w-full text-center">
                <span
                  className="font-mono font-black text-emerald-400 tracking-[0.2em] text-xs sm:text-sm uppercase drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)] truncate block px-2"
                  style={{ textShadow: '0 2px 4px #000000, 0 0 10px rgba(16,185,129,0.3)' }}
                >
                  {displayName}
                </span>
              </div>

              {/* Big Athletic Back Number */}
              <div className="my-auto text-center flex flex-col items-center justify-center">
                <span
                  className="font-mono font-black text-5xl sm:text-6xl text-white tracking-tighter drop-shadow-[0_6px_8px_rgba(0,0,0,0.95)]"
                  style={{
                    WebkitTextStroke: '2px #10b981',
                    textShadow: '0 4px 10px rgba(0,0,0,0.9), 0 0 16px rgba(16,185,129,0.35)',
                  }}
                >
                  {displayNumber}
                </span>
              </div>

              {/* Team / Community Name & Sublimation Tag */}
              <div className="w-full flex flex-col items-center gap-1">
                <span className="font-mono font-bold text-[9px] text-slate-300 uppercase tracking-widest truncate max-w-[170px] drop-shadow-sm">
                  {displayTeam}
                </span>

                <div className="flex items-center justify-between w-36 text-[7px] font-mono text-slate-500 pt-1 border-t border-slate-700/60">
                  <span className="text-emerald-400/90 font-bold">DRY-FIT ACTIVE</span>
                  <span>SIZE: {selectedSize}</span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* ===================================================
             TAMPAK DEPAN (AUTHENTIC PRODUCT PHOTO WITH CENTER CHEST NUMBER)
             =================================================== */
          <div className="flex flex-col items-center gap-3 transition-all duration-300">
            <div className="relative w-60 sm:w-68 rounded-2xl overflow-hidden border border-slate-700/80 shadow-2xl bg-slate-900 group">
              {productImage ? (
                <img
                  src={productImage}
                  alt={productName || 'Jersey RegarStore'}
                  className="w-full h-72 sm:h-80 object-cover object-center group-hover:scale-105 transition duration-500"
                />
              ) : (
                <div className="w-full h-72 flex flex-col items-center justify-center bg-slate-800 text-slate-400">
                  <Shirt size={48} className="text-slate-600 mb-2" />
                  <span className="text-xs">Foto Produk Jersey</span>
                </div>
              )}

              {/* Subtle Ambient Contrast Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-black/20 to-black/35 pointer-events-none" />

              {/* Top Collar Badge & Tournament Badge */}
              <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between pointer-events-none z-10">
                <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-md bg-emerald-600 text-white backdrop-blur-xs shadow-xs flex items-center gap-1">
                  <Shirt size={11} />
                  Kerah: {customCollar}
                </span>
                <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded-md bg-slate-950/80 text-yellow-300 border border-yellow-400/40 backdrop-blur-xs">
                  EDISI TURNAMEN
                </span>
              </div>

              {/* ===================================================
                 CENTER CHEST NUMBER & TEAM (STANDAR FIFA / EURO)
                 Menempatkan nomor tepat di tengah dada seperti jersey timnas
                 =================================================== */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-10 px-4 pt-10 pb-12">
                {customNumber && (
                  <div className="flex flex-col items-center justify-center my-auto transform -translate-y-2">
                    <span
                      className="font-mono font-black text-5xl sm:text-6xl text-yellow-300 tracking-tight"
                      style={{
                        WebkitTextStroke: '2px #0f172a',
                        filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.95))',
                        textShadow: '0 3px 8px rgba(0,0,0,0.9), 0 0 16px rgba(253,224,71,0.5)',
                      }}
                    >
                      {displayNumber}
                    </span>
                    <span className="text-[8px] font-mono font-bold tracking-wider text-yellow-200 uppercase bg-slate-950/90 px-2.5 py-0.5 rounded-full border border-yellow-400/40 mt-1 shadow-md">
                      NOMOR DADA TENGAH
                    </span>
                  </div>
                )}

                {/* Team / Community Sponsor across chest */}
                {customTeam && (
                  <div className="mt-auto mb-2 text-center w-full">
                    <span
                      className="font-mono font-black text-[11px] sm:text-xs text-white tracking-[0.18em] uppercase bg-slate-950/90 px-3 py-1 rounded-lg border border-emerald-500/50 shadow-md inline-block max-w-[210px] truncate"
                      style={{ textShadow: '0 2px 4px #000000' }}
                    >
                      {displayTeam}
                    </span>
                  </div>
                )}
              </div>

              {/* Product Name & Sublimation Guarantee at bottom */}
              <div className="absolute bottom-2.5 left-2.5 right-2.5 pointer-events-none z-10">
                <p className="text-xs font-bold text-white truncate drop-shadow-sm">
                  {productName || 'Jersey RegarStore'}
                </p>
                <div className="flex items-center gap-1 text-[10px] text-emerald-400 font-mono mt-0.5">
                  <CheckCircle2 size={11} />
                  <span>Kain &amp; Motif Sesuai Katalog Resmi</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800/90 border border-slate-700/80 text-[10px] text-slate-300 font-mono shadow-xs">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
              <span>Standar FIFA/Proliga: Nomor tercetak di <strong>Tengah Dada</strong></span>
            </div>
          </div>
        )}
      </div>

      {/* Footer Info Ribbon */}
      <div className="w-full px-4 py-2.5 border-t border-slate-800/80 bg-slate-950/90 flex items-center justify-between text-[11px] text-slate-400 font-mono">
        <div className="flex items-center gap-1.5 text-emerald-400">
          <Award size={13} />
          <span className="font-semibold">Cetak Sablon Sublimasi Wonogiri</span>
        </div>
        <span className="text-[10px] bg-slate-800 px-2 py-0.5 rounded text-slate-300">
          Model: {customCollar}
        </span>
      </div>
    </div>
  );
}
