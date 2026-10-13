package com.regarsport.auth.service;

import com.regarsport.auth.entity.OtpToken;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuthEmailService {

    private final JavaMailSender mailSender;
    private static final String BRAND_NAME = "RegarStore Official";

    @Value("${app.mail.from:noreply@regarstore.com}")
    private String fromEmail;

    public void sendOtpEmail(String recipientEmail, String recipientName, String code, OtpToken.Purpose purpose) {
        String[] copy = switch (purpose) {
            case VERIFY_EMAIL -> new String[]{"Kode Verifikasi Akun", "VERIFIKASI EMAIL",
                    "Terima kasih telah mendaftar di RegarStore. Masukkan 6-digit kode berikut untuk memverifikasi email dan mengaktifkan akun Anda:",
                    "Masukkan kode di atas pada halaman verifikasi akun RegarStore.",
                    "Jika Anda tidak merasa mendaftar di RegarStore, abaikan email ini."};
            case SET_PASSWORD -> new String[]{"Kode Atur Kata Sandi", "ATUR KATA SANDI",
                    "Kami menerima permintaan untuk menambahkan kata sandi pada akun RegarStore Anda yang terhubung dengan Google. Gunakan 6-digit kode berikut:",
                    "Masukkan kode di atas pada menu Keamanan di Pengaturan Akun.",
                    "Jika Anda tidak merasa melakukan permintaan ini, abaikan email ini. Akun Anda tetap aman."};
            case RESET_PASSWORD -> new String[]{"Kode Reset Kata Sandi", "PEMULIHAN KATA SANDI",
                    "Kami menerima permintaan untuk mengatur ulang kata sandi akun RegarStore Anda. Gunakan 6-digit kode verifikasi berikut untuk melanjutkan proses reset kata sandi:",
                    "Masukkan kode di atas pada formulir reset kata sandi di situs toko RegarStore.",
                    "Jika Anda tidak merasa melakukan permintaan ini, abaikan email ini. Kata sandi akun Anda tetap aman dan tidak akan berubah."};
        };
        try {
            log.info("Preparing {} OTP email for: {}", purpose, recipientEmail);
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(fromEmail, BRAND_NAME);
            helper.setTo(recipientEmail);
            helper.setSubject("[RegarStore] " + copy[0] + " Anda: " + code);

            String displayName = (recipientName != null && !recipientName.isBlank()) ? recipientName : "Sahabat Atlet RegarStore";

            String html = String.format("""
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="utf-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <style>
                        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0b110e; margin: 0; padding: 24px; color: #FAF8F4; }
                        .container { max-width: 580px; margin: 0 auto; background: #141c16; border: 1px solid rgba(255,255,255,0.12); border-radius: 20px; overflow: hidden; box-shadow: 0 20px 40px rgba(0,0,0,0.5); }
                        .header { background: #18221B; padding: 32px 24px; text-align: center; border-bottom: 1px solid rgba(255,255,255,0.1); }
                        .content { padding: 36px 30px; }
                        .badge { background: #059669; color: #ffffff; padding: 6px 14px; border-radius: 9999px; font-size: 11px; font-weight: 800; letter-spacing: 1px; text-transform: uppercase; display: inline-block; }
                        .code-box { background: #0b110e; border: 2px dashed #10B981; border-radius: 14px; padding: 20px; text-align: center; margin: 28px 0; }
                        .code-number { font-family: 'Courier New', Courier, monospace; font-size: 36px; font-weight: 900; letter-spacing: 10px; color: #34D399; margin: 0; }
                        .footer { background: #0e1611; padding: 24px; text-align: center; font-size: 12px; color: #8a9c90; border-top: 1px solid rgba(255,255,255,0.06); }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <h1 style="margin: 0; font-size: 24px; font-weight: 900; letter-spacing: 2px; color: #ffffff;">REGARSTORE</h1>
                            <p style="margin: 6px 0 0; font-size: 11px; color: #34D399; letter-spacing: 1px; text-transform: uppercase; font-weight: 700;">Atelier Cicendo Bandung • Official Security</p>
                        </div>
                        <div class="content">
                            <span class="badge">%s</span>
                            <h2 style="color: #ffffff; margin-top: 18px; font-size: 20px; font-weight: 700;">Halo, %s</h2>
                            <p style="color: #cbd5e1; font-size: 14px; line-height: 1.6; margin-top: 8px;">
                                %s
                            </p>

                            <div class="code-box">
                                <p style="font-size: 11px; text-transform: uppercase; letter-spacing: 2px; color: #94a3b8; margin: 0 0 8px 0; font-weight: 600;">KODE VERIFIKASI RESMI</p>
                                <p class="code-number">%s</p>
                                <p style="font-size: 11px; color: #64748b; margin: 8px 0 0 0;">Berlaku selama 15 menit</p>
                            </div>

                            <p style="color: #94a3b8; font-size: 13px; line-height: 1.6;">
                                %s
                            </p>
                            <p style="color: #64748b; font-size: 12px; line-height: 1.5; margin-top: 20px; border-top: 1px solid rgba(255,255,255,0.08); padding-top: 16px;">
                                ⚠️ %s
                            </p>
                        </div>
                        <div class="footer">
                            <p style="margin: 0;">&copy; 2026 PT RegarStore Industri Indonesia. Hak cipta dilindungi.</p>
                            <p style="margin: 4px 0 0;">Atelier Cicendo, Kota Bandung, Jawa Barat</p>
                        </div>
                    </div>
                </body>
                </html>
                """, copy[1], displayName, copy[2], code, copy[3], copy[4]);

            helper.setText(html, true);
            mailSender.send(message);
            log.info("{} OTP email sent successfully to: {}", purpose, recipientEmail);
        } catch (Exception e) {
            log.warn("Could not send {} OTP email to {} via SMTP: {}", purpose, recipientEmail, e.getMessage());
        }
    }
}
