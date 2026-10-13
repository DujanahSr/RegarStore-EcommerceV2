import { useRef, useState } from "react";
import { Printer, X, FileText, Download, Loader2 } from "lucide-react";
import { jsPDF } from "jspdf";
import toast from "react-hot-toast";

export default function InvoiceModal({ isOpen, onClose, order }) {
  const printRef = useRef(null);
  const [downloadingPDF, setDownloadingPDF] = useState(false);

  if (!isOpen || !order) return null;

  const orderNumber = order.orderNumber || `#${order.id}`;
  const invoiceNumber = `INV/${new Date(order.createdAt || Date.now()).getFullYear()}/RS/${orderNumber.replace(/[^a-zA-Z0-9]/g, "")}`;
  const recipientName = order.recipientName || order.customerName || order.users?.full_name || "Pelanggan Terhormat";
  const customerEmail = order.customerEmail || order.users?.email || "-";
  const customerPhone = order.customerPhone || order.shippingPhone || "";
  const streetAddr = order.shippingAddress || order.shipping_address || "Alamat tidak tercantum";
  const cityPostal = [order.shippingCity, order.shippingPostalCode].filter(Boolean).join(", ");
  const fullShippingAddress = cityPostal ? `${streetAddr}, ${cityPostal}` : streetAddr;
  const shippingNotes = order.shippingNotes || "";
  const items = order.items || order.order_items || [];
  const totalAmount = Number(order.totalAmount || order.total_amount || 0);
  const rawStatus = (order.status || "").toUpperCase();
  const isPaid = ["PAID", "PROCESSING", "SHIPPED", "COMPLETED"].includes(rawStatus);
  const isPending = rawStatus === "PENDING";
  const isCancelled = rawStatus === "CANCELLED";

  // Unduh dokumen PDF resmi langsung ke perangkat tanpa membuka dialog printer dan tanpa freeze
  const handleDownloadPDF = () => {
    try {
      setDownloadingPDF(true);
      toast.loading("Membuat dokumen PDF resmi...", { id: "pdf-toast" });

      const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const leftMargin = 15;
      const rightMargin = 195;
      const contentWidth = rightMargin - leftMargin;

      // 1. Header & Logo
      // Badge RS
      doc.setFillColor(5, 150, 105); // emerald-600
      doc.roundedRect(leftMargin, 15, 10, 10, 2, 2, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.text("RS", leftMargin + 2.3, 21.5);

      // Nama Perusahaan
      doc.setTextColor(15, 23, 42); // slate-900
      doc.setFontSize(13);
      doc.setFont("helvetica", "bold");
      doc.text("PT REGARSTORE INDONESIA", leftMargin + 13, 20);

      // Tagline
      doc.setTextColor(4, 120, 87); // emerald-700
      doc.setFontSize(7.5);
      doc.text("OFFICIAL ATHLETIC GEAR & CUSTOM APPAREL", leftMargin + 13, 24);

      // Alamat & Kontak
      doc.setTextColor(100, 116, 139); // slate-500
      doc.setFontSize(7);
      doc.setFont("helvetica", "normal");
      doc.text("Jl. Jenderal Sudirman No. 45, Wonogiri, Jawa Tengah 57612", leftMargin, 29);
      doc.text("NPWP: 01.345.678.9-521.000 | Email: cs@regarstore.com | WA: +62 812-3456-7890", leftMargin, 33);

      // Judul Dokumen (Kanan)
      const titleText = isPaid
        ? "INVOICE RESMI"
        : isPending
        ? "PROFORMA INVOICE"
        : "INVOICE (BATAL)";
      doc.setFont("helvetica", "bold");
      doc.setFontSize(14);
      doc.setTextColor(15, 23, 42);
      doc.text(titleText, rightMargin, 20, { align: "right" });

      doc.setFontSize(8.5);
      doc.setTextColor(4, 120, 87); // emerald-700
      doc.text(invoiceNumber, rightMargin, 25, { align: "right" });

      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.5);
      doc.setTextColor(71, 85, 105);
      const invoiceDate = new Date(order.createdAt || Date.now()).toLocaleDateString("id-ID", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      });
      doc.text(`Tanggal: ${invoiceDate}`, rightMargin, 29, { align: "right" });
      doc.text(`Order Ref: ${orderNumber}`, rightMargin, 33, { align: "right" });

      // Garis Pembatas Header
      doc.setDrawColor(15, 23, 42);
      doc.setLineWidth(0.6);
      doc.line(leftMargin, 36, rightMargin, 36);

      // 2. Info Ditagihkan Kepada & Informasi Pembayaran
      const infoBoxY = 41;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(7.5);
      doc.setTextColor(148, 163, 184); // slate-400
      doc.text("DITAGIHKAN KEPADA:", leftMargin, infoBoxY);

      doc.setFontSize(9);
      doc.setTextColor(15, 23, 42);
      doc.text(recipientName.toUpperCase(), leftMargin, infoBoxY + 4.5);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.5);
      doc.setTextColor(71, 85, 105);
      doc.text(`${customerEmail} ${customerPhone ? "• " + customerPhone : ""}`, leftMargin, infoBoxY + 8.5);
      
      const addrLines = doc.splitTextToSize(`Alamat Kirim: ${fullShippingAddress}`, 80);
      doc.text(addrLines, leftMargin, infoBoxY + 12.5);

      let currentYAfterAddr = infoBoxY + 12.5 + addrLines.length * 3.5;
      if (shippingNotes) {
        doc.setFont("helvetica", "italic");
        doc.setTextColor(100, 116, 139);
        const notesLines = doc.splitTextToSize(`Catatan: ${shippingNotes}`, 80);
        doc.text(notesLines, leftMargin, currentYAfterAddr);
      }

      // Box Informasi Pembayaran (Kanan)
      const boxX = 108;
      const boxW = 87;
      const boxH = 26;
      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(241, 245, 249);
      doc.roundedRect(boxX, infoBoxY - 2, boxW, boxH, 2, 2, "FD");

      doc.setFont("helvetica", "bold");
      doc.setFontSize(7.5);
      doc.setTextColor(148, 163, 184);
      doc.text("INFORMASI PEMBAYARAN:", boxX + 4, infoBoxY + 2);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.5);
      doc.setTextColor(100, 116, 139);
      doc.text("Gateway:", boxX + 4, infoBoxY + 7);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(30, 41, 59);
      doc.text("Midtrans Online Payment", boxX + 38, infoBoxY + 7);

      doc.setFont("helvetica", "normal");
      doc.setTextColor(100, 116, 139);
      doc.text("Status Transaksi:", boxX + 4, infoBoxY + 12);
      doc.setFont("helvetica", "bold");
      if (isPaid) {
        doc.setTextColor(4, 120, 87);
        doc.text("LUNAS (SETTLEMENT)", boxX + 38, infoBoxY + 12);
      } else if (isPending) {
        doc.setTextColor(217, 119, 6);
        doc.text("MENUNGGU PEMBAYARAN", boxX + 38, infoBoxY + 12);
      } else {
        doc.setTextColor(225, 29, 72);
        doc.text("DIBATALKAN", boxX + 38, infoBoxY + 12);
      }

      if (order.shippingCourier) {
        doc.setFont("helvetica", "normal");
        doc.setTextColor(100, 116, 139);
        doc.text("Kurir:", boxX + 4, infoBoxY + 17);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(30, 41, 59);
        doc.text(String(order.shippingCourier), boxX + 38, infoBoxY + 17);
      }

      // Stempel Digital (Jika Lunas)
      if (isPaid) {
        const stampX = boxX + 44;
        const stampY = infoBoxY + 14;
        doc.setDrawColor(225, 29, 72);
        doc.setLineWidth(0.4);
        doc.setFillColor(255, 241, 242);
        doc.roundedRect(stampX, stampY, 38, 9, 1.5, 1.5, "FD");
        doc.setTextColor(225, 29, 72);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(6);
        doc.text("MIDTRANS VERIFIED", stampX + 19, stampY + 3.2, { align: "center" });
        doc.setFontSize(7.5);
        doc.text("PAID / LUNAS", stampX + 19, stampY + 6.8, { align: "center" });
      }

      // 3. Tabel Rincian Barang
      let tableY = 74;
      doc.setFillColor(241, 245, 249);
      doc.rect(leftMargin, tableY, contentWidth, 7, "F");
      doc.setDrawColor(15, 23, 42);
      doc.setLineWidth(0.4);
      doc.line(leftMargin, tableY + 7, rightMargin, tableY + 7);

      doc.setFont("helvetica", "bold");
      doc.setFontSize(7.5);
      doc.setTextColor(51, 65, 85);
      doc.text("NO", leftMargin + 2, tableY + 4.8);
      doc.text("DESKRIPSI BARANG & VARIASI", leftMargin + 12, tableY + 4.8);
      doc.text("UKURAN", leftMargin + 95, tableY + 4.8, { align: "center" });
      doc.text("HARGA SATUAN", leftMargin + 130, tableY + 4.8, { align: "right" });
      doc.text("QTY", leftMargin + 145, tableY + 4.8, { align: "center" });
      doc.text("TOTAL", rightMargin - 2, tableY + 4.8, { align: "right" });

      let rowY = tableY + 8;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);

      items.forEach((item, index) => {
        const pName = item.productName || item.products?.name || item.name || "Produk RegarStore";
        const size = item.size || "All Size";
        const price = Number(item.price || item.products?.price || 0);
        const qty = Number(item.quantity || 1);
        const lineTotal = price * qty;

        doc.setTextColor(148, 163, 184);
        doc.text(String(index + 1), leftMargin + 2, rowY + 4.5);

        doc.setFont("helvetica", "bold");
        doc.setTextColor(30, 41, 59);
        doc.text(pName, leftMargin + 12, rowY + 4);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(6.5);
        doc.setTextColor(148, 163, 184);
        doc.text("RegarStore Original Collection", leftMargin + 12, rowY + 7.5);

        doc.setFontSize(8);
        doc.setTextColor(51, 65, 85);
        doc.text(size, leftMargin + 95, rowY + 5, { align: "center" });
        doc.text(`Rp ${price.toLocaleString("id-ID")}`, leftMargin + 130, rowY + 5, { align: "right" });
        doc.text(String(qty), leftMargin + 145, rowY + 5, { align: "center" });
        doc.setFont("helvetica", "bold");
        doc.setTextColor(15, 23, 42);
        doc.text(`Rp ${lineTotal.toLocaleString("id-ID")}`, rightMargin - 2, rowY + 5, { align: "right" });

        // Garis batas row
        doc.setDrawColor(241, 245, 249);
        doc.line(leftMargin, rowY + 9, rightMargin, rowY + 9);
        rowY += 10;
      });

      // 4. Ringkasan Total (Summary)
      const summaryY = Math.max(rowY + 4, 120);
      const sumX = 125;
      const valX = rightMargin - 2;

      const subtotalProducts = items.reduce(
        (sum, it) => sum + Number(it.price || 0) * Number(it.quantity || 1),
        0
      );
      const ppn11 = Math.round(totalAmount * (11 / 111));

      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139);
      doc.text("Subtotal Produk:", sumX, summaryY);
      doc.setTextColor(30, 41, 59);
      doc.text(`Rp ${subtotalProducts.toLocaleString("id-ID")}`, valX, summaryY, { align: "right" });

      doc.setTextColor(100, 116, 139);
      doc.text("Ongkos Kirim:", sumX, summaryY + 5);
      doc.setTextColor(4, 120, 87);
      doc.text("Gratis (Promo RS)", valX, summaryY + 5, { align: "right" });

      doc.setTextColor(100, 116, 139);
      doc.text("PPN 11% (Termasuk):", sumX, summaryY + 10);
      doc.setTextColor(71, 85, 105);
      doc.text(`Rp ${ppn11.toLocaleString("id-ID")}`, valX, summaryY + 10, { align: "right" });

      // Garis Total
      doc.setDrawColor(15, 23, 42);
      doc.setLineWidth(0.4);
      doc.line(sumX, summaryY + 13, rightMargin, summaryY + 13);

      doc.setFont("helvetica", "bold");
      doc.setFontSize(9.5);
      doc.setTextColor(15, 23, 42);
      doc.text("Total Tagihan:", sumX, summaryY + 18);
      doc.setFontSize(11);
      doc.setTextColor(5, 150, 105); // emerald-600
      doc.text(`Rp ${totalAmount.toLocaleString("id-ID")}`, valX, summaryY + 18, { align: "right" });

      // 5. Catatan & Tanda Tangan
      doc.setFont("helvetica", "bold");
      doc.setFontSize(7.5);
      doc.setTextColor(100, 116, 139);
      doc.text("Catatan Penting:", leftMargin, summaryY);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7);
      doc.text("• Invoice ini merupakan bukti pembayaran resmi yang sah diterbitkan oleh sistem komputerisasi.", leftMargin, summaryY + 4);
      doc.text("• Simpan invoice ini sebagai syarat klaim garansi atau penukaran ukuran (size exchange).", leftMargin, summaryY + 8);
      doc.text("• Produk original bergaransi resmi PT RegarStore Indonesia.", leftMargin, summaryY + 12);

      // Tanda Tangan Dept
      doc.text(`Wonogiri, ${new Date(order.createdAt || Date.now()).toLocaleDateString("id-ID")}`, rightMargin - 15, summaryY + 32, { align: "center" });
      doc.setFont("helvetica", "bold");
      doc.setTextColor(15, 23, 42);
      doc.text("Finance & Logistics Dept", rightMargin - 15, summaryY + 36, { align: "center" });
      doc.setFont("helvetica", "normal");
      doc.setFontSize(6.5);
      doc.setTextColor(100, 116, 139);
      doc.text("PT RegarStore Indonesia", rightMargin - 15, summaryY + 39, { align: "center" });

      // Unduh langsung berkas PDF ke perangkat
      const cleanFilename = `${invoiceNumber.replace(/[^a-zA-Z0-9-]/g, "_")}.pdf`;
      doc.save(cleanFilename);
      toast.success("Dokumen PDF berhasil diunduh!", { id: "pdf-toast" });
    } catch (err) {
      console.error("Gagal membuat PDF:", err);
      toast.error("Gagal mengunduh PDF. Silakan coba lagi.", { id: "pdf-toast" });
    } finally {
      setDownloadingPDF(false);
      window.focus();
    }
  };

  const handlePrint = () => {
    const invoiceEl = document.getElementById("official-customer-invoice");
    if (!invoiceEl) {
      window.print();
      return;
    }

    const frameId = "official-invoice-print-frame";
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
          <title>${invoiceNumber}</title>
          ${styleTags}
          <style>
            @page {
              size: A4 portrait;
              margin: 8mm 10mm;
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
              color: #0f172a !important;
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif !important;
              height: auto !important;
              overflow: visible !important;
            }
            #official-customer-invoice {
              width: 100% !important;
              max-width: 100% !important;
              min-width: 0 !important;
              margin: 0 auto !important;
              padding: 0 !important;
              box-shadow: none !important;
              border: none !important;
              page-break-after: avoid !important;
              page-break-inside: avoid !important;
              break-inside: avoid !important;
            }
          </style>
        </head>
        <body>
          <div id="official-customer-invoice" class="w-full bg-white text-zinc-900 font-sans text-xs">
            ${invoiceEl.innerHTML}
          </div>
        </body>
      </html>
    `);
    frameDoc.close();

    setTimeout(() => {
      iframe.contentWindow.focus();
      iframe.contentWindow.print();
      // Bersihkan iframe dan pulihkan focus ke jendela utama agar halaman tidak terkunci/freeze
      setTimeout(() => {
        if (iframe) iframe.remove();
        window.focus();
      }, 1000);
    }, 250);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200">
      {/* Fallback Print CSS Scoped jika user menekan Ctrl+P langsung di browser */}
      <style>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 8mm 10mm;
          }
          html, body {
            height: 100% !important;
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
          .relative.w-full.max-w-3xl {
            position: static !important;
            max-width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            border: none !important;
            box-shadow: none !important;
          }
          #official-customer-invoice, #official-customer-invoice * {
            visibility: visible !important;
          }
          #official-customer-invoice {
            position: relative !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            background: #fff !important;
            color: #000 !important;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif !important;
            border: none !important;
            box-shadow: none !important;
            page-break-after: avoid !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
        }
      `}</style>

      <div className="relative w-full max-w-3xl bg-[#14141E] border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl my-8">
        {/* Modal Actions Header */}
        <div className="flex items-center justify-between pb-5 mb-5 border-b border-white/10 print:hidden">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-2xl border ${
              isPaid
                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                : isPending
                ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                : "bg-rose-500/10 text-rose-400 border-rose-500/20"
            }`}>
              <FileText size={22} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">
                {isPaid
                  ? "Invoice Resmi Pembelian (Lunas)"
                  : isPending
                  ? "Surat Tagihan / Proforma Invoice"
                  : "Faktur Pembelian (Dibatalkan)"}
              </h3>
              <p className="text-xs text-white/50 break-all">{invoiceNumber}</p>
            </div>
          </div>

          {/* Di mobile aksi yang sama tersedia di baris tombol bawah */}
          <div className="hidden sm:flex items-center gap-2">
            <button
              onClick={handleDownloadPDF}
              disabled={downloadingPDF}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-lg shadow-blue-600/20 transition active:scale-95 cursor-pointer"
              title="Unduh berkas PDF langsung ke perangkat"
            >
              {downloadingPDF ? <Loader2 size={15} className="animate-spin" /> : <Download size={15} />}
              <span>{downloadingPDF ? "Menyimpan..." : "Unduh PDF"}</span>
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-600/20 transition active:scale-95 cursor-pointer"
              title="Cetak lewat printer fisik atau preview dialog browser"
            >
              <Printer size={15} /> <span>Cetak Faktur</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 text-white/50 hover:text-white rounded-xl hover:bg-white/5 transition cursor-pointer"
              title="Tutup"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* ===================== PHYSICAL A4 INVOICE CONTAINER ===================== */}
        <div className="bg-zinc-950/60 p-2 sm:p-6 rounded-2xl border border-white/5 overflow-x-auto">
          <div
            id="official-customer-invoice"
            ref={printRef}
            className="w-full min-w-[620px] max-w-[760px] mx-auto bg-white text-zinc-900 p-6 sm:p-8 print:p-0 font-sans text-xs shadow-xl relative border border-slate-200 print:border-none"
          >
            {/* Header Perusahaan & Identitas Invoice */}
            <div className="flex items-start justify-between border-b-2 border-slate-800 pb-3 mb-3 print:pb-2 print:mb-2">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <div className="bg-emerald-600 text-white font-black text-xs px-2 py-0.5 rounded tracking-wider">
                    RS
                  </div>
                  <div>
                    <h1 className="text-lg font-black text-slate-900 tracking-tight leading-none">
                      PT REGARSTORE INDONESIA
                    </h1>
                    <p className="text-[9px] font-bold text-emerald-700 tracking-widest uppercase">
                      Official Athletic Gear & Custom Apparel
                    </p>
                  </div>
                </div>
                <p className="text-slate-500 text-[10px] leading-tight max-w-xs">
                  Jl. Jenderal Sudirman No. 45, Wonogiri, Jawa Tengah 57612<br />
                  NPWP: 01.345.678.9-521.000 | Email: cs@regarstore.com<br />
                  Hotline / WhatsApp: +62 812-3456-7890
                </p>
              </div>

              <div className="text-right">
                <span className="text-xl font-black text-slate-900 tracking-wider block">
                  {isPaid
                    ? "INVOICE RESMI"
                    : isPending
                    ? "PROFORMA INVOICE"
                    : "INVOICE (DIBATALKAN)"}
                </span>
                <p className="text-[11px] font-mono font-bold text-emerald-700">
                  {invoiceNumber}
                </p>
                <div className="mt-1 space-y-0.5 text-[10px] text-slate-600">
                  <p>
                    <span className="font-semibold text-slate-700">Tanggal:</span>{" "}
                    {new Date(order.createdAt || Date.now()).toLocaleDateString("id-ID", {
                      day: "2-digit",
                      month: "long",
                      year: "numeric",
                    })}
                  </p>
                  <p>
                    <span className="font-semibold text-slate-700">Order Ref:</span>{" "}
                    <span className="font-mono font-bold text-slate-900">{orderNumber}</span>
                  </p>
                </div>
              </div>
            </div>

            {/* Penerima & Info Pembayaran Grid */}
            <div className="grid grid-cols-2 gap-4 border-b border-slate-200 pb-3 mb-3 print:pb-2 print:mb-2">
              {/* Ditagihkan Kepada */}
              <div>
                <h2 className="text-[9.5px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                  DITAGIHKAN KEPADA:
                </h2>
                <p className="text-xs font-bold text-slate-900 uppercase">{recipientName}</p>
                <p className="text-slate-600 font-mono text-[10px]">
                  {customerEmail} {customerPhone && `• ${customerPhone}`}
                </p>
                <p className="text-slate-600 text-[10px] mt-1 leading-snug">
                  <span className="font-semibold text-slate-700">Alamat Kirim:</span> {fullShippingAddress}
                </p>
                {shippingNotes && (
                  <p className="text-slate-500 text-[9.5px] italic mt-0.5">
                    <span className="font-semibold not-italic text-slate-700">Catatan:</span> {shippingNotes}
                  </p>
                )}
              </div>

              {/* Rincian Metode & Status Transaksi */}
              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100 relative overflow-hidden text-[10.5px]">
                <h2 className="text-[9.5px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                  INFORMASI PEMBAYARAN:
                </h2>
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Gateway:</span>
                    <span className="font-bold text-slate-800">Midtrans Online Payment</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Status Transaksi:</span>
                    <span className={`font-bold ${isPaid ? "text-emerald-700" : isPending ? "text-amber-600" : "text-rose-600"}`}>
                      {isPaid ? "LUNAS (SETTLEMENT)" : isPending ? "MENUNGGU PEMBAYARAN" : "DIBATALKAN"}
                    </span>
                  </div>
                  {order.shippingCourier && (
                    <div className="flex justify-between">
                      <span className="text-slate-500">Kurir Pengiriman:</span>
                      <span className="font-bold text-slate-800">{order.shippingCourier}</span>
                    </div>
                  )}
                  {order.trackingNumber && (
                    <div className="flex justify-between">
                      <span className="text-slate-500">No. Resi:</span>
                      <span className="font-mono font-bold text-slate-800">{order.trackingNumber}</span>
                    </div>
                  )}
                </div>

                {/* Stempel Digital PAID jika Lunas */}
                {isPaid && (
                  <div className="absolute right-2.5 bottom-1.5 transform -rotate-12 pointer-events-none opacity-85 select-none">
                    <div className="border-2 border-dashed border-rose-600 rounded px-2.5 py-0.5 text-center bg-rose-50/50 shadow-xs">
                      <span className="text-[8px] font-black uppercase text-rose-600 tracking-widest block">
                        MIDTRANS VERIFIED
                      </span>
                      <span className="text-xs font-black text-rose-600 tracking-widest leading-tight block">
                        PAID / LUNAS
                      </span>
                      <span className="text-[7.5px] font-mono text-rose-500 font-bold block">
                        {new Date(order.createdAt || Date.now()).toLocaleDateString("id-ID")}
                      </span>
                    </div>
                  </div>
                )}

                {/* Stempel Digital PROFORMA jika Belum Lunas */}
                {isPending && (
                  <div className="absolute right-2.5 bottom-1.5 transform -rotate-12 pointer-events-none opacity-85 select-none">
                    <div className="border-2 border-dashed border-amber-500 rounded px-2.5 py-0.5 text-center bg-amber-50/60 shadow-xs">
                      <span className="text-[8px] font-black uppercase text-amber-600 tracking-widest block">
                        MENUNGGU BAYAR
                      </span>
                      <span className="text-xs font-black text-amber-600 tracking-widest leading-tight block">
                        UNPAID / PROFORMA
                      </span>
                      <span className="text-[7.5px] font-mono text-amber-500 font-bold block">
                        Tagihan Sementara
                      </span>
                    </div>
                  </div>
                )}

                {/* Stempel Digital VOID jika Dibatalkan */}
                {isCancelled && (
                  <div className="absolute right-2.5 bottom-1.5 transform -rotate-12 pointer-events-none opacity-85 select-none">
                    <div className="border-2 border-dashed border-rose-600 rounded px-2.5 py-0.5 text-center bg-rose-50/70 shadow-xs">
                      <span className="text-[8px] font-black uppercase text-rose-600 tracking-widest block">
                        STATUS TRANSAKSI
                      </span>
                      <span className="text-xs font-black text-rose-600 tracking-widest leading-tight block">
                        VOID / BATAL
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Tabel Rincian Barang */}
            <div className="mb-3 print:mb-2">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b-2 border-slate-900 bg-slate-100 text-[10px] font-bold text-slate-700 uppercase">
                    <th className="py-1.5 px-2 w-8">No</th>
                    <th className="py-1.5 px-2">Deskripsi Barang & Variasi</th>
                    <th className="py-1.5 px-2 text-center w-20">Ukuran</th>
                    <th className="py-1.5 px-2 text-right w-24">Harga Satuan</th>
                    <th className="py-1.5 px-2 text-center w-12">Qty</th>
                    <th className="py-1.5 px-2 text-right w-28">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-[10.5px]">
                  {items.map((it, idx) => {
                    const price = Number(it.price || 0);
                    const qty = Number(it.quantity || 1);
                    return (
                      <tr key={idx} className="hover:bg-slate-50/50">
                        <td className="py-1.5 px-2 text-slate-400 font-mono">{idx + 1}</td>
                        <td className="py-1.5 px-2">
                          <p className="font-bold text-slate-800">{it.productName || "Produk Olahraga"}</p>
                          <p className="text-[9px] text-slate-400">RegarStore Original Collection</p>
                        </td>
                        <td className="py-1.5 px-2 text-center">
                          {it.size ? (
                            <span className="inline-block px-1.5 py-0.5 rounded bg-slate-100 font-bold text-[9px] text-slate-700 border border-slate-200">
                              {it.size}
                            </span>
                          ) : (
                            <span className="text-slate-400 text-xs">-</span>
                          )}
                        </td>
                        <td className="py-1.5 px-2 text-right font-mono text-slate-700">
                          Rp {price.toLocaleString("id-ID")}
                        </td>
                        <td className="py-1.5 px-2 text-center font-bold text-slate-800 font-mono">
                          {qty}
                        </td>
                        <td className="py-1.5 px-2 text-right font-mono font-bold text-slate-900">
                          Rp {(price * qty).toLocaleString("id-ID")}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Total Pembayaran */}
            <div className="flex justify-end border-t-2 border-slate-900 pt-2 mb-3 print:mb-2">
              <div className="w-56 space-y-1 text-[11px]">
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal Produk:</span>
                  <span className="font-mono">Rp {totalAmount.toLocaleString("id-ID")}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Ongkos Kirim:</span>
                  <span className="font-semibold text-emerald-700">Gratis (Promo RS)</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>PPN 11% (Termasuk):</span>
                  <span className="font-mono text-slate-500">Rp {Math.round(totalAmount * 0.11 / 1.11).toLocaleString("id-ID")}</span>
                </div>
                <div className="flex justify-between border-t border-slate-300 pt-1 text-xs font-black text-slate-900">
                  <span>Total Tagihan:</span>
                  <span className="text-emerald-700 text-sm font-mono">
                    Rp {totalAmount.toLocaleString("id-ID")}
                  </span>
                </div>
              </div>
            </div>

            {/* Catatan Kaki & Tanda Tangan Komputerisasi */}
            <div className="grid grid-cols-2 items-end border-t border-slate-200 pt-2.5 text-[9.5px] text-slate-500">
              <div className="space-y-0.5">
                <p className="font-bold text-slate-700">Catatan Penting:</p>
                <ul className="list-disc list-inside space-y-0.5">
                  <li>Invoice ini merupakan bukti pembayaran resmi yang sah diterbitkan oleh sistem komputerisasi.</li>
                  <li>Simpan invoice ini sebagai syarat klaim garansi atau penukaran ukuran (size exchange).</li>
                  <li>Produk original bergaransi resmi PT RegarStore Indonesia.</li>
                </ul>
              </div>

              <div className="text-right">
                <p className="text-slate-400 text-[9px] mb-4">
                  Wonogiri, {new Date(order.createdAt || Date.now()).toLocaleDateString("id-ID")}
                </p>
                <div className="inline-block border-b border-slate-400 pb-0.5 text-center min-w-36">
                  <p className="font-bold text-slate-800 text-[10px]">Finance & Logistics Dept</p>
                </div>
                <p className="text-[8.5px] text-slate-400 mt-0.5">PT RegarStore Indonesia</p>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer Controls */}
        <div className="flex justify-end gap-3 mt-5 print:hidden">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 hover:text-white text-xs font-semibold transition cursor-pointer"
          >
            Tutup
          </button>
          <button
            onClick={handleDownloadPDF}
            disabled={downloadingPDF}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-bold transition shadow-lg shadow-blue-600/20 active:scale-95 cursor-pointer"
          >
            {downloadingPDF ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
            <span>{downloadingPDF ? "Menyimpan PDF..." : "Unduh PDF"}</span>
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition shadow-lg shadow-emerald-600/20 active:scale-95 cursor-pointer"
          >
            <Printer size={16} /> Cetak Faktur
          </button>
        </div>
      </div>
    </div>
  );
}
