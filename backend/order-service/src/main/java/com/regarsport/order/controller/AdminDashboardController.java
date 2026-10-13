package com.regarsport.order.controller;

import com.regarsport.common.dto.ApiResponse;
import com.regarsport.order.entity.Order;
import com.regarsport.order.entity.OrderStatus;
import com.regarsport.order.repository.OrderRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.io.IOException;
import java.io.PrintWriter;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.time.format.TextStyle;
import java.util.*;

@Slf4j
@RestController
@RequiredArgsConstructor
@Tag(name = "Admin Order Analytics", description = "Endpoints for admin order dashboard analytics and CSV export")
@SecurityRequirement(name = "bearerAuth")
public class AdminDashboardController {

    private final OrderRepository orderRepository;

    private static final List<OrderStatus> REVENUE_STATUSES = List.of(
            OrderStatus.PAID,
            OrderStatus.PROCESSING,
            OrderStatus.SHIPPED,
            OrderStatus.COMPLETED
    );

    @GetMapping("/api/v1/orders/admin/dashboard")
    @Operation(summary = "Admin: Get real order analytics", description = "Retrieve live revenue, order breakdown, monthly sales, and top products")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getDashboardStats() {
        BigDecimal totalRevenue = orderRepository.calculateTotalRevenue(REVENUE_STATUSES);
        long totalOrders = orderRepository.count();
        long pendingOrders = orderRepository.countByStatus(OrderStatus.PENDING);
        long paidOrders = orderRepository.countByStatus(OrderStatus.PAID);
        long processingOrders = orderRepository.countByStatus(OrderStatus.PROCESSING);
        long shippedOrders = orderRepository.countByStatus(OrderStatus.SHIPPED);
        long completedOrders = orderRepository.countByStatus(OrderStatus.COMPLETED);
        long cancelledOrders = orderRepository.countByStatus(OrderStatus.CANCELLED);

        // Fetch top 5 products
        List<Object[]> topProductsRaw = orderRepository.findTopSellingProducts(REVENUE_STATUSES, PageRequest.of(0, 5));
        List<Map<String, Object>> topProducts = new ArrayList<>();
        for (Object[] row : topProductsRaw) {
            String name = (String) row[0];
            Number sales = (Number) row[1];
            topProducts.add(Map.of("name", name, "sales", sales != null ? sales.longValue() : 0L));
        }

        // Calculate multi-period sales and advanced metrics
        List<Order> allOrders = orderRepository.findAllWithItemsOrderByCreatedAtDesc();
        LocalDate today = LocalDate.now(ZoneId.systemDefault());

        BigDecimal todayRevenue = BigDecimal.ZERO;
        long todayOrders = 0;
        long revenueOrderCount = 0;

        // Last 7 days breakdown
        DateTimeFormatter day7Fmt = DateTimeFormatter.ofPattern("EEE, dd MMM", new Locale("id", "ID"));
        Map<String, BigDecimal> daily7dMap = new LinkedHashMap<>();
        for (int i = 6; i >= 0; i--) {
            LocalDate d = today.minusDays(i);
            daily7dMap.put(d.format(day7Fmt), BigDecimal.ZERO);
        }

        // Last 30 days breakdown
        DateTimeFormatter day30Fmt = DateTimeFormatter.ofPattern("dd MMM", new Locale("id", "ID"));
        Map<String, BigDecimal> daily30dMap = new LinkedHashMap<>();
        for (int i = 29; i >= 0; i--) {
            LocalDate d = today.minusDays(i);
            daily30dMap.put(d.format(day30Fmt), BigDecimal.ZERO);
        }

        // Last 6 months breakdown
        Map<String, BigDecimal> month6SalesMap = new LinkedHashMap<>();
        for (int i = 5; i >= 0; i--) {
            LocalDate m = today.minusMonths(i);
            String monthName = m.getMonth().getDisplayName(TextStyle.SHORT, new Locale("id", "ID"));
            month6SalesMap.put(monthName, BigDecimal.ZERO);
        }

        // Last 12 months breakdown
        Map<String, BigDecimal> month12SalesMap = new LinkedHashMap<>();
        for (int i = 11; i >= 0; i--) {
            LocalDate m = today.minusMonths(i);
            String monthYear = m.getMonth().getDisplayName(TextStyle.SHORT, new Locale("id", "ID")) + " " + String.valueOf(m.getYear()).substring(2);
            month12SalesMap.put(monthYear, BigDecimal.ZERO);
        }

        for (Order order : allOrders) {
            if (order.getCreatedAt() != null) {
                LocalDate orderDate = order.getCreatedAt().atZone(ZoneId.systemDefault()).toLocalDate();

                if (orderDate.isEqual(today)) {
                    todayOrders++;
                    if (REVENUE_STATUSES.contains(order.getStatus())) {
                        todayRevenue = todayRevenue.add(order.getTotalAmount() != null ? order.getTotalAmount() : BigDecimal.ZERO);
                    }
                }

                if (REVENUE_STATUSES.contains(order.getStatus())) {
                    revenueOrderCount++;
                    BigDecimal orderTotal = order.getTotalAmount() != null ? order.getTotalAmount() : BigDecimal.ZERO;

                    // 7 days
                    String k7 = orderDate.format(day7Fmt);
                    if (daily7dMap.containsKey(k7)) {
                        daily7dMap.put(k7, daily7dMap.get(k7).add(orderTotal));
                    }

                    // 30 days
                    String k30 = orderDate.format(day30Fmt);
                    if (daily30dMap.containsKey(k30)) {
                        daily30dMap.put(k30, daily30dMap.get(k30).add(orderTotal));
                    }

                    // 6 months
                    String k6 = orderDate.getMonth().getDisplayName(TextStyle.SHORT, new Locale("id", "ID"));
                    if (month6SalesMap.containsKey(k6)) {
                        month6SalesMap.put(k6, month6SalesMap.get(k6).add(orderTotal));
                    }

                    // 12 months
                    String k12 = orderDate.getMonth().getDisplayName(TextStyle.SHORT, new Locale("id", "ID")) + " " + String.valueOf(orderDate.getYear()).substring(2);
                    if (month12SalesMap.containsKey(k12)) {
                        month12SalesMap.put(k12, month12SalesMap.get(k12).add(orderTotal));
                    }
                }
            }
        }

        List<Map<String, Object>> sales7d = new ArrayList<>();
        daily7dMap.forEach((d, s) -> sales7d.add(Map.of("period", d, "sales", s)));

        List<Map<String, Object>> sales30d = new ArrayList<>();
        daily30dMap.forEach((d, s) -> sales30d.add(Map.of("period", d, "sales", s)));

        List<Map<String, Object>> salesData = new ArrayList<>();
        month6SalesMap.forEach((month, sales) -> salesData.add(Map.of("month", month, "period", month, "sales", sales)));

        List<Map<String, Object>> sales12m = new ArrayList<>();
        month12SalesMap.forEach((my, sales) -> sales12m.add(Map.of("period", my, "sales", sales)));

        // Average Order Value (AOV)
        BigDecimal safeRevenue = totalRevenue != null ? totalRevenue : BigDecimal.ZERO;
        BigDecimal aov = revenueOrderCount > 0 
                ? safeRevenue.divide(BigDecimal.valueOf(revenueOrderCount), 0, java.math.RoundingMode.HALF_UP)
                : BigDecimal.ZERO;

        // Completion Rate
        double completionRate = totalOrders > 0
                ? Math.round(((double) completedOrders / totalOrders) * 1000.0) / 10.0
                : 0.0;

        // Order Status Breakdown for Donut Chart
        List<Map<String, Object>> statusDistribution = List.of(
                Map.of("name", "Lunas / Diproses", "value", paidOrders + processingOrders, "color", "#00BFA5"),
                Map.of("name", "Sedang Dikirim", "value", shippedOrders, "color", "#8B5CF6"),
                Map.of("name", "Selesai", "value", completedOrders, "color", "#10B981"),
                Map.of("name", "Menunggu Bayar", "value", pendingOrders, "color", "#F59E0B"),
                Map.of("name", "Dibatalkan", "value", cancelledOrders, "color", "#EF4444")
        );

        // Recent 5 orders for live feed
        List<Map<String, Object>> recentOrders = allOrders.stream().limit(5).map(o -> {
            Map<String, Object> map = new HashMap<>();
            map.put("id", o.getId());
            map.put("orderNumber", o.getOrderNumber());
            map.put("customerName", o.getCustomerName());
            map.put("status", o.getStatus() != null ? o.getStatus().name() : "PENDING");
            map.put("totalAmount", o.getTotalAmount() != null ? o.getTotalAmount() : BigDecimal.ZERO);
            map.put("shippingCourier", o.getShippingCourier() != null ? o.getShippingCourier() : "JNE");
            map.put("createdAt", o.getCreatedAt());
            return map;
        }).toList();

        Map<String, Object> stats = new HashMap<>();
        stats.put("totalRevenue", safeRevenue);
        stats.put("totalOrders", totalOrders);
        stats.put("pendingOrders", pendingOrders);
        stats.put("paidOrders", paidOrders);
        stats.put("processingOrders", processingOrders);
        stats.put("shippedOrders", shippedOrders);
        stats.put("completedOrders", completedOrders);
        stats.put("cancelledOrders", cancelledOrders);
        stats.put("todayRevenue", todayRevenue);
        stats.put("todayOrders", todayOrders);
        stats.put("aov", aov);
        stats.put("completionRate", completionRate);
        stats.put("topProducts", topProducts);
        stats.put("salesData", salesData);
        stats.put("sales7d", sales7d);
        stats.put("sales30d", sales30d);
        stats.put("sales12m", sales12m);
        stats.put("statusDistribution", statusDistribution);
        stats.put("recentOrders", recentOrders);

        return ResponseEntity.ok(ApiResponse.success(stats));
    }

    @GetMapping(value = {"/api/v1/orders/admin/export", "/api/v1/admin/orders/export"}, produces = "text/csv; charset=UTF-8")
    @Operation(summary = "Admin: Export orders as CSV", description = "Download orders report as CSV file")
    public void exportOrdersToCsv(HttpServletResponse response) throws IOException {
        String filename = "laporan-pesanan-regarstore-" + LocalDate.now().format(DateTimeFormatter.ISO_LOCAL_DATE) + ".csv";
        response.setContentType("text/csv; charset=UTF-8");
        response.setHeader(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"");

        List<Order> orders = orderRepository.findAllWithItemsOrderByCreatedAtDesc();

        PrintWriter writer = response.getWriter();
        // UTF-8 BOM for Excel compatibility
        writer.write('\ufeff');

        // Excel delimiter directive: instructs Excel to cleanly split columns by semicolon
        writer.println("sep=;");

        // CSV Header
        writer.println("No;Nomor Pesanan;Nama Pelanggan;Email;Status Pesanan;Kurir / Ekspedisi;Nomor Resi;Total Pembayaran (Rp);Tanggal Transaksi");

        DateTimeFormatter dtf = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm").withZone(ZoneId.systemDefault());

        int index = 1;
        for (Order o : orders) {
            String courier = o.getShippingCourier() != null ? escapeCsv(o.getShippingCourier()) : "-";
            String tracking = o.getTrackingNumber() != null ? escapeCsv(o.getTrackingNumber()) : "-";
            String dateStr = o.getCreatedAt() != null ? dtf.format(o.getCreatedAt()) : "-";
            String statusStr = o.getStatus() != null ? o.getStatus().name() : "-";
            long amount = o.getTotalAmount() != null ? o.getTotalAmount().longValue() : 0L;

            writer.printf("%d;\"%s\";\"%s\";\"%s\";\"%s\";\"%s\";\"%s\";%d;\"%s\"%n",
                    index++,
                    escapeCsv(o.getOrderNumber()),
                    escapeCsv(o.getCustomerName()),
                    escapeCsv(o.getCustomerEmail()),
                    statusStr,
                    courier,
                    tracking,
                    amount,
                    dateStr
            );
        }

        writer.flush();
    }

    private String escapeCsv(String input) {
        if (input == null) return "";
        return input.replace("\"", "\"\"");
    }
}
