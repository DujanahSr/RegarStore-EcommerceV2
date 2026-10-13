package com.regarsport.notification.service;

import com.regarsport.common.event.OrderItemEventPayload;
import com.regarsport.common.event.OrderPaidEvent;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

class InvoicePdfServiceTest {

    private final InvoicePdfService service = new InvoicePdfService();

    private OrderPaidEvent event() {
        return new OrderPaidEvent(
                1L, "REGAR-123", "Abu & <Dujanah>", "abu@example.com", "0812",
                "Abu", "Jl. Dago No. 10 & 12, Bandung", "Bandung", "40135",
                "HEMAT10", new BigDecimal("50000"), new BigDecimal("448000"), "bank_transfer",
                Instant.now(), Instant.now(),
                List.of(new OrderItemEventPayload(1L, "Jersey Garuda Home 2026", 2, new BigDecimal("249000"), "L",
                        "ABU", "10", "V-Neck", "Garuda FC"))
        );
    }

    @Test
    void rendersValidPdfEvenWithSpecialCharacters() {
        byte[] pdf = service.render(event());

        assertThat(new String(pdf, 0, 5, StandardCharsets.US_ASCII)).isEqualTo("%PDF-");
        assertThat(pdf.length).isGreaterThan(1000);
    }

    @Test
    void htmlEscapesUserDataAndShowsTotals() {
        String html = service.html(event());

        assertThat(html).contains("Abu &amp; &lt;Dujanah&gt;").doesNotContain("<Dujanah>");
        assertThat(html).contains("Rp 498.000"); // subtotal 2 x 249.000
        assertThat(html).contains("- Rp 50.000").contains("HEMAT10");
        assertThat(html).contains("Rp 448.000");
        assertThat(html).contains("BANK TRANSFER");
    }
}
