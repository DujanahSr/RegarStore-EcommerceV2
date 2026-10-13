package com.regarsport.notification.service;

import com.openhtmltopdf.pdfboxout.PdfRendererBuilder;
import com.regarsport.common.event.OrderItemEventPayload;
import com.regarsport.common.event.OrderPaidEvent;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.math.BigDecimal;
import java.text.NumberFormat;
import java.time.Instant;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Locale;

/** Render e-invoice pesanan (XHTML -> PDF) untuk dilampirkan di email pembeli. */
@Service
public class InvoicePdfService {

    private static final Locale ID = new Locale("id", "ID");
    private static final DateTimeFormatter DATE = DateTimeFormatter.ofPattern("dd MMMM yyyy, HH:mm 'WIB'", ID)
            .withZone(ZoneId.of("Asia/Jakarta"));

    public byte[] render(OrderPaidEvent e) {
        try (ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            PdfRendererBuilder builder = new PdfRendererBuilder();
            builder.useFastMode();
            builder.withHtmlContent(html(e), null);
            builder.toStream(out);
            builder.run();
            return out.toByteArray();
        } catch (Exception ex) {
            throw new IllegalStateException("Gagal membuat PDF invoice " + e.orderNumber(), ex);
        }
    }

    String html(OrderPaidEvent e) {
        List<OrderItemEventPayload> items = e.items() != null ? e.items() : List.of();
        BigDecimal subtotal = BigDecimal.ZERO;
        StringBuilder rows = new StringBuilder();
        int no = 1;
        for (OrderItemEventPayload item : items) {
            BigDecimal price = item.price() != null ? item.price() : BigDecimal.ZERO;
            int qty = item.quantity() != null ? item.quantity() : 0;
            BigDecimal lineTotal = price.multiply(BigDecimal.valueOf(qty));
            subtotal = subtotal.add(lineTotal);

            String custom = "";
            if (item.customName() != null && !item.customName().isBlank()) {
                custom = "<div class=\"muted\">Sablon: " + esc(item.customName()) + " #" + esc(orDash(item.customNumber()))
                        + " | Kerah: " + esc(orDash(item.customCollar())) + " | Tim: " + esc(orDash(item.customTeam())) + "</div>";
            }
            rows.append("<tr>")
                    .append("<td class=\"c\">").append(no++).append("</td>")
                    .append("<td>").append(esc(item.productName())).append(custom).append("</td>")
                    .append("<td class=\"c\">").append(esc(orDash(item.size()))).append("</td>")
                    .append("<td class=\"c\">").append(qty).append("</td>")
                    .append("<td class=\"r\">").append(rp(price)).append("</td>")
                    .append("<td class=\"r\">").append(rp(lineTotal)).append("</td>")
                    .append("</tr>");
        }

        BigDecimal discount = e.discountAmount() != null ? e.discountAmount() : BigDecimal.ZERO;
        String discountRow = discount.signum() > 0
                ? "<tr><td class=\"lbl\">Diskon" + (e.voucherCode() != null ? " (" + esc(e.voucherCode()) + ")" : "") + "</td><td class=\"r\">- " + rp(discount) + "</td></tr>"
                : "";
        String cityLine = String.join(" ", List.of(orEmpty(e.shippingCity()), orEmpty(e.shippingPostalCode()))).trim();

        return """
                <!DOCTYPE html>
                <html xmlns="http://www.w3.org/1999/xhtml">
                <head>
                <meta charset="utf-8" />
                <style>
                  @page { size: A4; margin: 18mm 16mm; }
                  body { font-family: Helvetica, Arial, sans-serif; font-size: 10pt; color: #1e293b; }
                  .brand { font-size: 22pt; font-weight: bold; letter-spacing: 2px; color: #065f46; }
                  .muted { color: #64748b; font-size: 8.5pt; }
                  .badge { display: inline-block; background: #059669; color: #ffffff; padding: 4px 10px; font-weight: bold; font-size: 9pt; }
                  table { width: 100%%; border-collapse: collapse; }
                  .head td { vertical-align: top; }
                  .box td { padding: 2px 0; }
                  .items { margin-top: 16px; }
                  .items th { background: #0f172a; color: #ffffff; padding: 7px 6px; font-size: 9pt; text-align: left; }
                  .items td { padding: 7px 6px; border-bottom: 1px solid #e2e8f0; vertical-align: top; }
                  .c, .items th.c { text-align: center; }
                  .r, .items th.r { text-align: right; }
                  .totals { width: 45%%; margin-left: 55%%; margin-top: 12px; }
                  .totals td { padding: 4px 6px; }
                  .lbl { color: #475569; }
                  .grand td { border-top: 2px solid #0f172a; font-weight: bold; font-size: 12pt; padding-top: 8px; }
                  .foot { margin-top: 36px; border-top: 1px solid #e2e8f0; padding-top: 10px; }
                </style>
                </head>
                <body>
                  <table class="head"><tr>
                    <td>
                      <div class="brand">REGARSTORE</div>
                      <div class="muted">PT RegarStore Industri Indonesia - Atelier Cicendo, Kota Bandung</div>
                    </td>
                    <td class="r">
                      <div style="font-size: 16pt; font-weight: bold;">INVOICE</div>
                      <div>No. %s</div>
                      <div style="margin-top: 6px;"><span class="badge">LUNAS</span></div>
                    </td>
                  </tr></table>

                  <table class="head" style="margin-top: 22px;"><tr>
                    <td style="width: 55%%;">
                      <div class="muted">DITAGIHKAN KEPADA</div>
                      <div style="font-weight: bold; margin-top: 3px;">%s</div>
                      <div>%s</div>
                      <div>%s</div>
                      <div class="muted" style="margin-top: 8px;">DIKIRIM KE</div>
                      <div style="font-weight: bold; margin-top: 3px;">%s</div>
                      <div>%s</div>
                      <div>%s</div>
                    </td>
                    <td>
                      <table class="box">
                        <tr><td class="lbl">Tanggal Pesanan</td><td class="r">%s</td></tr>
                        <tr><td class="lbl">Tanggal Bayar</td><td class="r">%s</td></tr>
                        <tr><td class="lbl">Metode Bayar</td><td class="r">%s</td></tr>
                      </table>
                    </td>
                  </tr></table>

                  <table class="items">
                    <tr><th class="c" style="width: 6%%;">No</th><th>Produk</th><th class="c" style="width: 9%%;">Ukuran</th><th class="c" style="width: 7%%;">Qty</th><th class="r" style="width: 17%%;">Harga</th><th class="r" style="width: 18%%;">Subtotal</th></tr>
                    %s
                  </table>

                  <table class="totals">
                    <tr><td class="lbl">Subtotal</td><td class="r">%s</td></tr>
                    %s
                    <tr class="grand"><td>Total Dibayar</td><td class="r">%s</td></tr>
                  </table>

                  <div class="foot muted">
                    Invoice ini sah dan diterbitkan secara elektronik oleh RegarStore sebagai bukti pembayaran. Simpan dokumen ini untuk keperluan klaim garansi dan penukaran ukuran.
                    Layanan pelanggan: cs@regarstore.com
                  </div>
                </body>
                </html>
                """.formatted(
                esc(e.orderNumber()),
                esc(orDash(e.customerName())),
                esc(orEmpty(e.customerEmail())),
                esc(orEmpty(e.customerPhone())),
                esc(orDash(e.recipientName() != null ? e.recipientName() : e.customerName())),
                esc(orDash(e.shippingAddress())),
                esc(cityLine),
                date(e.orderedAt()),
                date(e.paidAt()),
                esc(e.paymentType() != null ? e.paymentType().replace('_', ' ').toUpperCase() : "ONLINE PAYMENT"),
                rows,
                rp(subtotal),
                discountRow,
                rp(e.totalAmount() != null ? e.totalAmount() : subtotal.subtract(discount))
        );
    }

    private static String rp(BigDecimal amount) {
        NumberFormat nf = NumberFormat.getNumberInstance(ID);
        nf.setMaximumFractionDigits(0);
        return "Rp " + nf.format(amount);
    }

    private static String date(Instant instant) {
        return instant != null ? DATE.format(instant) : "-";
    }

    private static String orDash(String s) {
        return s == null || s.isBlank() ? "-" : s;
    }

    private static String orEmpty(String s) {
        return s == null ? "" : s;
    }

    /** XHTML wajib well-formed: escape semua data dari user (nama, alamat, catatan sablon). */
    static String esc(String s) {
        if (s == null) return "";
        return s.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;").replace("\"", "&quot;").replace("'", "&#39;");
    }
}
