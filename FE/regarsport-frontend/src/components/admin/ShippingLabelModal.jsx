/* eslint-disable react-hooks/exhaustive-deps */
import { useRef, useEffect } from "react";
import { Printer, X, Truck } from "lucide-react";

// Helper to generate realistic SVG barcode patterns from string
function BarcodeSVG({ value = "REGAR-8829104812" }) {
  const bars = [];
  let seed = 0;
  for (let i = 0; i < value.length; i++) {
    seed = (seed * 31 + value.charCodeAt(i)) % 100000;
  }

  // Generate 48 bars with variable widths (1 to 4 px)
  let currentX = 10;
  for (let i = 0; i < 54; i++) {
    const width = ((seed + i * 7) % 3) + 1.2;
    const gap = ((seed + i * 13) % 2) + 1.2;
    bars.push(
      <rect
        key={i}
        x={currentX}
        y="0"
        width={width}
        height="50"
        fill="#000"
      />
    );
    currentX += width + gap;
  }

  return (
    <div className="flex flex-col items-center justify-center">
      <svg
        viewBox={`0 0 ${currentX + 10} 50`}
        className="w-full h-14 max-w-72"
        preserveAspectRatio="none"
      >
        {bars}
      </svg>
      <span className="font-mono text-xs tracking-[4px] font-bold text-black mt-1 uppercase">
        {value}
      </span>
    </div>
  );
}

// Mini SVG QR Mockup
function QrCodeSVG() {
  return (
    <svg viewBox="0 0 100 100" className="w-16 h-16 border border-black p-1 bg-white">
      {/* Corner position markers */}
      <rect x="5" y="5" width="28" height="28" fill="none" stroke="#000" strokeWidth="6" />
      <rect x="11" y="11" width="16" height="16" fill="#000" />
      <rect x="67" y="5" width="28" height="28" fill="none" stroke="#000" strokeWidth="6" />
      <rect x="73" y="11" width="16" height="16" fill="#000" />
      <rect x="5" y="67" width="28" height="28" fill="none" stroke="#000" strokeWidth="6" />
      <rect x="11" y="73" width="16" height="16" fill="#000" />
      {/* Center matrix elements */}
      <rect x="42" y="10" width="8" height="8" fill="#000" />
      <rect x="50" y="24" width="8" height="8" fill="#000" />
      <rect x="10" y="42" width="8" height="8" fill="#000" />
      <rect x="24" y="50" width="8" height="8" fill="#000" />
      <rect x="40" y="40" width="20" height="20" fill="#000" />
      <rect x="68" y="42" width="8" height="8" fill="#000" />
      <rect x="80" y="54" width="8" height="8" fill="#000" />
      <rect x="42" y="68" width="8" height="8" fill="#000" />
      <rect x="58" y="76" width="8" height="8" fill="#000" />
      <rect x="72" y="72" width="12" height="12" fill="#000" />
    </svg>
  );
}

function ShippingLabelContent({ onClose, order }) {
  const printRef = useRef(null);


  const orderNumber = order.orderNumber || `#${order.id}`;
  const trackingNo = order.trackingNumber || orderNumber;
  const courierName = (order.shippingCourier || "J&T EXPRESS").toUpperCase();
  const customerName = order.recipientName || order.customerName || order.users?.full_name || "Pelanggan RegarStore";
  const customerPhone = order.customerPhone || order.shippingPhone || "";
  const streetAddr = order.shippingAddress || order.shipping_address || "Alamat pengiriman terdaftar pada sistem";
  const cityPostal = [order.shippingCity, order.shippingPostalCode].filter(Boolean).join(" ");
  const fullShippingAddress = cityPostal ? `${streetAddr}, ${cityPostal}` : streetAddr;
  const shippingNotes = order.shippingNotes || "";
  const items = order.items || order.order_items || [];
  const totalQty = items.reduce((acc, it) => acc + (Number(it.quantity) || 1), 0);
  const estWeight = Math.max(1, Math.ceil(totalQty * 0.35)); // ~350g per sport apparel

  const handlePrint = () => {
    const labelEl = document.getElementById("thermal-shipping-label");
    if (!labelEl) {
      window.print();
      return;
    }

    const frameId = "official-shipping-label-frame";
    let iframe = document.getElementById(frameId);
    if (iframe) iframe.remove();

    iframe = document.createElement("iframe");
    iframe.id = frameId;
    iframe.style.position = "fixed";
    iframe.style.top = "-9999px";
    iframe.style.left = "-9999px";
    iframe.style.width = "0";
    iframe.style.height = "0";
    iframe.style.border = "none";
    document.body.appendChild(iframe);

    const styleTags = Array.from(document.querySelectorAll("style, link[rel='stylesheet']"))
      .map((el) => el.outerHTML)
      .join("\n");

    const frameDoc = iframe.contentWindow.document;
    frameDoc.open();
    frameDoc.write(`
      <!DOCTYPE html>
      <html lang="id">
        <head>
          <meta charset="utf-8">
          <title>Label Pengiriman - ${trackingNo}</title>
          ${styleTags}
          <style>
            @page {
              size: 100mm 150mm;
              margin: 0;
            }
            * {
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
              box-sizing: border-box;
            }
            html, body {
              margin: 0 !important;
              padding: 0 !important;
              background: #ffffff !important;
              color: #000000 !important;
              width: 100mm !important;
              font-family: Arial, Helvetica, sans-serif !important;
              overflow: hidden !important;
            }
            #thermal-shipping-label {
              width: 100mm !important;
              max-width: 100mm !important;
              margin: 0 auto !important;
              padding: 2.5mm !important;
              box-shadow: none !important;
              border: 2px solid #000 !important;
              page-break-inside: avoid !important;
              break-inside: avoid !important;
            }
          </style>
        </head>
        <body>
          <div id="thermal-shipping-label" class="w-full bg-white text-black font-sans text-xs leading-tight">
            ${labelEl.innerHTML}
          </div>
        </body>
      </html>
    `);
    frameDoc.close();

    setTimeout(() => {
      iframe.contentWindow.focus();
      iframe.contentWindow.print();
    }, 250);
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "p") {
        e.preventDefault();
        handlePrint();
      } else if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [order]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200">
      {/* Print CSS Scoped to this label */}
      <style>{`
        @media print {
          @page {
            size: 100mm 150mm;
            margin: 0;
          }
          html, body {
            margin: 0 !important;
            padding: 0 !important;
            background: #fff !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            overflow: visible !important;
          }
          body * {
            visibility: hidden !important;
          }
          .fixed.inset-0 {
            position: static !important;
            padding: 0 !important;
            margin: 0 !important;
            backdrop-filter: none !important;
            -webkit-backdrop-filter: none !important;
          }
          .relative.w-full.max-w-xl {
            position: static !important;
            max-width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            border: none !important;
            box-shadow: none !important;
          }
          #thermal-shipping-label, #thermal-shipping-label * {
            visibility: visible !important;
          }
          #thermal-shipping-label {
            position: relative !important;
            left: 0 !important;
            top: 0 !important;
            width: 100mm !important;
            max-width: 100mm !important;
            margin: 0 !important;
            padding: 2mm !important;
            background: #fff !important;
            color: #000 !important;
            font-family: Arial, Helvetica, sans-serif !important;
            border: 2px solid #000 !important;
            box-shadow: none !important;
            page-break-after: avoid !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
        }
      `}</style>

      <div className="relative w-full max-w-xl bg-white border border-stone-200 rounded-3xl p-6 shadow-2xl my-8">
        {/* Modal Actions Header */}
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-stone-100 print:hidden">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-xl bg-[#162018] text-white shadow-sm">
              <Truck size={20} />
            </div>
            <div>
              <h3 className="text-base font-bold text-stone-900 font-['Barlow_Condensed'] uppercase tracking-wide">Label Pengiriman Gudang</h3>
              <p className="text-xs text-stone-500">Ukuran Thermal A6 (100 x 150 mm)</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-4 py-2 bg-[#B9382B] hover:bg-[#9E2D22] text-white font-bold text-xs rounded-xl shadow-sm transition active:scale-95 cursor-pointer"
            >
              <Printer size={15} /> Cetak Thermal (A6)
            </button>
            <button
              onClick={onClose}
              className="p-2 text-stone-400 hover:text-stone-800 rounded-xl hover:bg-stone-100 transition cursor-pointer"
              title="Tutup"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* ===================== PHYSICAL THERMAL LABEL CONTAINER ===================== */}
        <div className="flex justify-center bg-stone-100/80 p-3 sm:p-5 rounded-2xl border border-stone-200 overflow-x-auto">
          <div
            id="thermal-shipping-label"
            ref={printRef}
            className="w-[380px] bg-white text-black p-3.5 border-2 border-black font-sans text-xs leading-tight select-none shadow-md"
            style={{ width: "380px", minWidth: "380px" }}
          >
            {/* Header: Logo & Ekspedisi */}
            <div className="flex items-center justify-between border-b-2 border-black pb-2 mb-2">
              <div className="flex items-center gap-1.5">
                <div className="bg-black text-white font-black text-xs px-2 py-1 rounded">
                  REGAR
                </div>
                <div>
                  <h1 className="font-black text-sm tracking-tight leading-none">REGARSTORE</h1>
                  <p className="text-[9px] font-bold text-zinc-600 tracking-wider">OFFICIAL STORE</p>
                </div>
              </div>

              <div className="text-right">
                <div className="border-2 border-black px-2.5 py-0.5 font-black text-xs uppercase tracking-wider inline-block">
                  {courierName}
                </div>
                <div className="text-[9px] font-bold text-zinc-700 mt-0.5">REGULER</div>
              </div>
            </div>

            {/* Barcode & Resi Box */}
            <div className="flex items-center justify-between border-b-2 border-black pb-2.5 mb-2 gap-2">
              <div className="flex-1 text-center">
                <BarcodeSVG value={trackingNo} />
              </div>
              <div className="shrink-0 flex flex-col items-center">
                <QrCodeSVG />
                <span className="text-[8px] font-mono mt-0.5">SCAN GUDANG</span>
              </div>
            </div>

            {/* Penerima & Pengirim Grid */}
            <div className="grid grid-cols-12 border-b-2 border-black pb-2 mb-2 gap-2 text-[11px]">
              {/* Penerima (8 Cols) */}
              <div className="col-span-8 border-r border-zinc-400 pr-2">
                <span className="text-[9px] font-bold uppercase tracking-wider text-zinc-500 block mb-0.5">
                  Kepada (Penerima):
                </span>
                <p className="font-black text-xs text-black uppercase">{customerName}</p>
                {customerPhone && (
                  <p className="font-bold text-black font-mono text-[11px] mb-1">{customerPhone}</p>
                )}
                <p className="text-zinc-800 leading-snug text-[10.5px]">
                  {fullShippingAddress}
                </p>
                {shippingNotes && (
                  <p className="text-[9px] text-zinc-700 italic mt-1 bg-zinc-100 p-1 rounded border border-zinc-300 leading-tight">
                    <span className="font-bold not-italic text-black">Catatan:</span> {shippingNotes}
                  </p>
                )}
              </div>

              {/* Pengirim (4 Cols) */}
              <div className="col-span-4 pl-1 text-[10px]">
                <span className="text-[9px] font-bold uppercase tracking-wider text-zinc-500 block mb-0.5">
                  Dari (Pengirim):
                </span>
                <p className="font-bold text-black">RegarStore Pusat</p>
                <p className="font-mono text-[9.5px]">0812-3456-7890</p>
                <p className="text-zinc-600 text-[9px] mt-0.5 leading-tight">
                  Wonogiri, Jawa Tengah 57612
                </p>
              </div>
            </div>

            {/* Parameter Paket */}
            <div className="grid grid-cols-3 border-b-2 border-black pb-1.5 mb-2 text-center text-[10px]">
              <div className="border-r border-zinc-400 pr-1">
                <span className="text-[8.5px] font-bold text-zinc-500 uppercase block">No. Order</span>
                <span className="font-mono font-bold">{orderNumber}</span>
              </div>
              <div className="border-r border-zinc-400 px-1">
                <span className="text-[8.5px] font-bold text-zinc-500 uppercase block">Berat Est.</span>
                <span className="font-bold">{estWeight} Kg</span>
              </div>
              <div className="pl-1">
                <span className="text-[8.5px] font-bold text-zinc-500 uppercase block">Metode</span>
                <span className="font-black text-[9.5px] text-black">NON-COD (LUNAS)</span>
              </div>
            </div>

            {/* Packing Slip & Checklist Barang */}
            <div className="border-b border-black pb-2 mb-2">
              <div className="flex items-center justify-between text-[9px] font-bold uppercase tracking-wider text-zinc-600 mb-1 border-b border-zinc-300 pb-0.5">
                <span>Checklist Item Gudang</span>
                <span>{items.length} Macam Barang</span>
              </div>

              <div className="space-y-1.5 max-h-40 overflow-hidden">
                {items.map((it, idx) => (
                  <div key={idx} className="border-b border-zinc-200 pb-1 last:border-b-0">
                    <div className="flex items-center justify-between text-[10px] gap-1.5">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="w-3.5 h-3.5 border border-black inline-block shrink-0 rounded-[2px]" />
                        <span className="font-bold text-black truncate max-w-44">
                          {it.productName || "Jersey Sport"}
                        </span>
                        {it.size && (
                          <span className="font-black px-1 border border-black text-[9px] uppercase">
                            {it.size}
                          </span>
                        )}
                      </div>
                      <span className="font-mono font-black text-[11px] shrink-0">
                        {it.quantity}x
                      </span>
                    </div>
                    {it.customName && (
                      <div className="text-[8.5px] font-black text-black pl-5 mt-0.5 font-mono">
                        👉 SABLON: &quot;{it.customName}&quot; #{it.customNumber || "-"} {it.customCollar && `| ${it.customCollar}`} {it.customTeam && `| ${it.customTeam}`}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Footer Note */}
            <div className="text-[8.5px] text-zinc-600 flex items-center justify-between pt-0.5">
              <span>Fulfillment: RegarStore Warehouse WN</span>
              <span className="font-mono">{new Date().toLocaleDateString("id-ID")}</span>
            </div>
          </div>
        </div>

        {/* Modal Footer Controls */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-5 pt-3 border-t border-stone-100 print:hidden">
          <span className="text-[11px] font-mono text-stone-500">
            Pintasan: <kbd className="px-1.5 py-0.5 rounded bg-stone-100 font-bold text-stone-700 border border-stone-200">Ctrl + P</kbd> untuk cetak langsung, <kbd className="px-1.5 py-0.5 rounded bg-stone-100 font-bold text-stone-700 border border-stone-200">Esc</kbd> tutup
          </span>
          <div className="flex gap-2 w-full sm:w-auto justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-semibold transition cursor-pointer"
            >
              Tutup [Esc]
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#162018] hover:bg-black text-white text-xs font-bold transition shadow-md active:scale-95 cursor-pointer"
            >
              <Printer size={16} /> Cetak Label Thermal
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Early return di wrapper supaya semua hook di dalam konten selalu dipanggil dengan urutan yang sama
export default function ShippingLabelModal({ isOpen, onClose, order }) {
  if (!isOpen || !order) return null;
  return <ShippingLabelContent onClose={onClose} order={order} />;
}
