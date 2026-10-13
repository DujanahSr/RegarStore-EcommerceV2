package com.regarsport.notification.service;

import com.regarsport.common.event.OrderCreatedEvent;
import com.regarsport.common.event.OrderItemEventPayload;
import com.regarsport.common.event.OrderShippedEvent;
import com.regarsport.common.event.OrderPaidEvent;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.text.NumberFormat;
import java.util.Locale;

@Slf4j
@Service
@RequiredArgsConstructor
public class EmailService {

    private final JavaMailSender mailSender;
    private final InvoicePdfService invoicePdfService;
    private static final String BRAND_NAME = "RegarStore Official";

    @Value("${app.mail.from:noreply@regarstore.com}")
    private String fromEmail;

    @Value("${app.frontend-url:http://localhost:5173}")
    private String frontendUrl;

    private String formatRp(BigDecimal amount) {
        if (amount == null) return "Rp 0";
        NumberFormat nf = NumberFormat.getCurrencyInstance(new Locale("id", "ID"));
        return nf.format(amount).replace(",00", "");
    }

    @Async
    public void sendOrderConfirmationEmail(OrderCreatedEvent event) {
        try {
            log.info("Sending Order Confirmation Email to: {} for order: {}", event.customerEmail(), event.orderNumber());
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(fromEmail, BRAND_NAME);
            helper.setTo(event.customerEmail());
            helper.setSubject("[RegarStore] Konfirmasi Pemesanan #" + event.orderNumber());

            StringBuilder itemsHtml = new StringBuilder();
            if (event.items() != null) {
                for (OrderItemEventPayload item : event.items()) {
                    String customBadge = "";
                    if (item.customName() != null && !item.customName().isBlank()) {
                        customBadge = String.format(
                                "<div style='font-size: 11px; color: #059669; background: #ecfdf5; padding: 4px 8px; border-radius: 4px; margin-top: 4px; display: inline-block;'>" +
                                "🎽 Sablon: <strong>%s</strong> #%s | Kerah: %s | Tim: %s</div>",
                                item.customName(),
                                item.customNumber() != null ? item.customNumber() : "-",
                                item.customCollar() != null ? item.customCollar() : "O-Neck",
                                item.customTeam() != null ? item.customTeam() : "-"
                        );
                    }

                    itemsHtml.append(String.format(
                            "<tr>" +
                            "<td style='padding: 12px; border-bottom: 1px solid #e2e8f0; font-size: 14px; color: #1e293b;'>" +
                            "<strong>%s</strong> (Ukuran: %s)%s</td>" +
                            "<td style='padding: 12px; border-bottom: 1px solid #e2e8f0; font-size: 14px; text-align: center; color: #475569;'>%d</td>" +
                            "<td style='padding: 12px; border-bottom: 1px solid #e2e8f0; font-size: 14px; text-align: right; color: #0f172a; font-weight: bold;'>%s</td>" +
                            "</tr>",
                            item.productName(),
                            item.size() != null ? item.size() : "L",
                            customBadge,
                            item.quantity(),
                            formatRp(item.price().multiply(BigDecimal.valueOf(item.quantity())))
                    ));
                }
            }

            String html = """
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="utf-8">
                    <style>
                        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 20px; }
                        .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); }
                        .header { background: #0f172a; padding: 28px; text-align: center; color: #ffffff; }
                        .content { padding: 32px; }
                        .badge { background: #059669; color: #ffffff; padding: 6px 14px; border-radius: 20px; font-size: 12px; font-weight: bold; display: inline-block; }
                        .footer { background: #f1f5f9; padding: 24px; text-align: center; font-size: 12px; color: #64748b; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <h1 style="margin: 0; font-size: 24px; letter-spacing: 1px;">REGARSTORE</h1>
                            <p style="margin: 4px 0 0; font-size: 12px; color: #94a3b8; text-transform: uppercase;">Wonogiri Factory Direct - Official E-Commerce</p>
                        </div>
                        <div class="content">
                            <span class="badge">PESANAN DITERIMA</span>
                            <h2 style="color: #0f172a; margin-top: 16px; font-size: 20px;">Halo, %s!</h2>
                            <p style="color: #475569; font-size: 14px; line-height: 1.6;">
                                Terima kasih telah berbelanja di <strong>RegarStore Indonesia</strong>. Pesanan Anda dengan nomor <strong>%s</strong> telah kami catat di sistem dan siap untuk diproses.
                            </p>
                            
                            <table style="width: 100%%; border-collapse: collapse; margin-top: 24px;">
                                <thead>
                                    <tr style="background: #f8fafc;">
                                        <th style="padding: 10px 12px; text-align: left; font-size: 12px; color: #64748b; text-transform: uppercase;">Produk</th>
                                        <th style="padding: 10px 12px; text-align: center; font-size: 12px; color: #64748b; text-transform: uppercase;">Qty</th>
                                        <th style="padding: 10px 12px; text-align: right; font-size: 12px; color: #64748b; text-transform: uppercase;">Total</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    %s
                                </tbody>
                                <tfoot>
                                    <tr>
                                        <td colspan="2" style="padding: 14px 12px; font-size: 15px; font-weight: bold; color: #0f172a;">Total Tagihan:</td>
                                        <td style="padding: 14px 12px; font-size: 18px; font-weight: 900; color: #059669; text-align: right;">%s</td>
                                    </tr>
                                </tfoot>
                            </table>

                            <div style="background: #f8fafc; padding: 16px; border-radius: 12px; margin-top: 24px;">
                                <h4 style="margin: 0 0 8px; font-size: 13px; color: #334155; text-transform: uppercase;">Alamat Tujuan Pengiriman:</h4>
                                <p style="margin: 0; font-size: 13px; color: #64748b; line-height: 1.5;">%s</p>
                            </div>

                            <div style="text-align: center; margin-top: 32px;">
                                <a href="%s/dashboard/my-orders" style="background: #059669; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 10px; font-weight: bold; font-size: 14px; display: inline-block;">Lihat Status Pesanan</a>
                            </div>
                        </div>
                        <div class="footer">
                            <p style="margin: 0 0 6px;">PT REGARSTORE INDONESIA - Wonogiri, Jawa Tengah</p>
                            <p style="margin: 0;">Layanan Pelanggan WhatsApp: +62 812-3456-7890 | Email: cs@regarstore.com</p>
                        </div>
                    </div>
                </body>
                </html>
                """.formatted(
                    event.customerName(),
                    event.orderNumber(),
                    itemsHtml.toString(),
                    formatRp(event.totalAmount()),
                    event.shippingAddress(),
                    frontendUrl
            );

            helper.setText(html, true);
            mailSender.send(message);
            log.info("Order Confirmation Email successfully sent to: {}", event.customerEmail());
        } catch (Exception e) {
            log.error("Failed to send order confirmation email for order: {}", event.orderNumber(), e);
        }
    }

    @Async
    public void sendInvoiceEmail(OrderPaidEvent event) {
        if (event.customerEmail() == null || !event.customerEmail().contains("@")) {
            log.warn("Skip e-invoice for order {}: invalid customer email", event.orderNumber());
            return;
        }
        try {
            String recipientEmail = event.customerEmail().trim();
            String recipientName = event.customerName() != null ? event.customerName() : "Pelanggan RegarStore";

            log.info("Sending E-Invoice to: {} for order: {}", recipientEmail, event.orderNumber());
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(fromEmail, BRAND_NAME);
            helper.setTo(recipientEmail);
            helper.setSubject("[RegarStore] E-Invoice Pesanan #" + event.orderNumber() + " [LUNAS]");

            String html = """
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="utf-8">
                    <style>
                        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 20px; }
                        .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); }
                        .header { background: #059669; padding: 28px; text-align: center; color: #ffffff; }
                        .content { padding: 32px; }
                        .status-box { background: #ecfdf5; border: 2px dashed #059669; padding: 20px; border-radius: 12px; text-align: center; margin: 20px 0; }
                        .footer { background: #f1f5f9; padding: 24px; text-align: center; font-size: 12px; color: #64748b; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <h1 style="margin: 0; font-size: 24px; letter-spacing: 1px;">REGARSTORE</h1>
                            <p style="margin: 4px 0 0; font-size: 12px; color: #a7f3d0; text-transform: uppercase;">Bukti Pembayaran Resmi (E-Invoice)</p>
                        </div>
                        <div class="content">
                            <h2 style="color: #0f172a; margin: 0; font-size: 20px;">Halo, %s!</h2>
                            <p style="color: #475569; font-size: 14px; line-height: 1.6;">
                                Pembayaran Anda untuk pesanan <strong>%s</strong> telah berhasil diverifikasi oleh Midtrans Payment Gateway.
                            </p>

                            <div class="status-box">
                                <div style="font-size: 13px; font-weight: bold; color: #047857; text-transform: uppercase; letter-spacing: 1px;">Status Pembayaran</div>
                                <div style="font-size: 26px; font-weight: 900; color: #065f46; margin: 6px 0;">LUNAS</div>
                                <div style="font-size: 14px; color: #047857;">Total Terbayar: <strong>%s</strong> (%s)</div>
                            </div>

                            <p style="color: #475569; font-size: 14px; line-height: 1.6;">
                                Pesanan Anda saat ini telah diteruskan ke antrean operasional <strong>Staf Gudang RegarStore di Wonogiri</strong> untuk proses quality control sablon dan pengemasan.
                            </p>

                            <p style="color: #0f172a; font-size: 14px; line-height: 1.6; background: #f1f5f9; padding: 14px 16px; border-radius: 10px;">
                                📎 <strong>Invoice resmi (PDF) terlampir</strong> pada email ini. Simpan sebagai bukti pembelian untuk klaim garansi atau penukaran ukuran.
                            </p>
                        </div>
                        <div class="footer">
                            <p style="margin: 0 0 6px;">PT REGARSTORE INDONESIA - Wonogiri, Jawa Tengah</p>
                            <p style="margin: 0;">Layanan Pelanggan WhatsApp: +62 812-3456-7890 | Email: cs@regarstore.com</p>
                        </div>
                    </div>
                </body>
                </html>
                """.formatted(
                    recipientName,
                    event.orderNumber(),
                    formatRp(event.totalAmount()),
                    event.paymentType() != null ? event.paymentType() : "Online Payment"
            );

            helper.setText(html, true);
            helper.addAttachment("Invoice-" + event.orderNumber() + ".pdf",
                    new ByteArrayResource(invoicePdfService.render(event)), "application/pdf");
            mailSender.send(message);
            log.info("E-Invoice successfully sent to: {}", recipientEmail);
        } catch (Exception e) {
            log.error("Failed to send e-invoice email for order: {}", event.orderNumber(), e);
        }
    }

    @Async
    public void sendOrderShippedEmail(OrderShippedEvent event) {
        try {
            log.info("Sending Order Shipped Email to: {} for order: {}", event.customerEmail(), event.orderNumber());
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(fromEmail, BRAND_NAME);
            helper.setTo(event.customerEmail());
            helper.setSubject("[RegarStore] Pesanan #" + event.orderNumber() + " Sedang Dikirim (" + event.shippingCourier() + ")");

            String html = """
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="utf-8">
                    <style>
                        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 20px; }
                        .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); }
                        .header { background: #2563eb; padding: 28px; text-align: center; color: #ffffff; }
                        .content { padding: 32px; }
                        .shipping-card { background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 12px; padding: 20px; margin: 20px 0; }
                        .footer { background: #f1f5f9; padding: 24px; text-align: center; font-size: 12px; color: #64748b; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <h1 style="margin: 0; font-size: 24px; letter-spacing: 1px;">REGARSTORE</h1>
                            <p style="margin: 4px 0 0; font-size: 12px; color: #bfdbfe; text-transform: uppercase;">Paket Anda Dalam Perjalanan</p>
                        </div>
                        <div class="content">
                            <h2 style="color: #0f172a; margin: 0; font-size: 20px;">Halo, %s!</h2>
                            <p style="color: #475569; font-size: 14px; line-height: 1.6;">
                                Kabar baik! Pesanan jersey Anda dengan nomor <strong>%s</strong> telah selesai dikemas oleh Staf Gudang kami di Wonogiri dan telah diserahkan ke jasa ekspedisi.
                            </p>

                            <div class="shipping-card">
                                <div style="font-size: 12px; font-weight: bold; color: #1e40af; text-transform: uppercase;">Ekspedisi Pengiriman</div>
                                <div style="font-size: 18px; font-weight: 900; color: #1e3a8a; margin: 4px 0;">%s</div>
                                <div style="font-size: 12px; font-weight: bold; color: #1e40af; text-transform: uppercase; margin-top: 12px;">Nomor Resi Pelacakan</div>
                                <div style="font-size: 22px; font-weight: 900; color: #1d4ed8; font-family: monospace; letter-spacing: 2px;">%s</div>
                            </div>

                            <p style="color: #475569; font-size: 13px; line-height: 1.6;">
                                💡 <em>Tips: Anda dapat memantau status posisi paket secara langsung melalui halaman Riwayat Pesanan di aplikasi kami atau melalui web resmi ekspedisi.</em>
                            </p>

                            <div style="text-align: center; margin-top: 28px;">
                                <a href="%s/dashboard/my-orders" style="background: #2563eb; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 10px; font-weight: bold; font-size: 14px; display: inline-block;">Lacak Posisi Paket</a>
                            </div>
                        </div>
                        <div class="footer">
                            <p style="margin: 0 0 6px;">PT REGARSTORE INDONESIA - Wonogiri, Jawa Tengah</p>
                            <p style="margin: 0;">Garansi 100%% Ukuran Pas & Tukar Ukuran: WhatsApp +62 812-3456-7890</p>
                        </div>
                    </div>
                </body>
                </html>
                """.formatted(
                    event.customerName(),
                    event.orderNumber(),
                    event.shippingCourier(),
                    event.trackingNumber(),
                    frontendUrl
            );

            helper.setText(html, true);
            mailSender.send(message);
            log.info("Order Shipped Email successfully sent to: {}", event.customerEmail());
        } catch (Exception e) {
            log.error("Failed to send order shipped email for order: {}", event.orderNumber(), e);
        }
    }
}
