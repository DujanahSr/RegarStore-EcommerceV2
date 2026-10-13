package com.regarsport.catalog.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name = "products")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Product {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "category_id", nullable = false)
    private Category category;

    @Column(nullable = false, length = 200)
    private String name;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal price;

    @Column(nullable = false)
    private Integer stock;

    @Column(name = "image_url", length = 500)
    private String imageUrl;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "product_size_stocks", joinColumns = @JoinColumn(name = "product_id"))
    @MapKeyColumn(name = "size_name", length = 50)
    @Column(name = "stock", nullable = false)
    @Builder.Default
    private java.util.Map<String, Integer> sizeStocks = new java.util.LinkedHashMap<>();

    @Version
    private Long version;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private Instant updatedAt;

    public java.util.Map<String, Integer> getSizeStocks() {
        if (sizeStocks == null) {
            sizeStocks = new java.util.LinkedHashMap<>();
        }
        return sizeStocks;
    }

    public void recalculateTotalStock() {
        if (sizeStocks != null && !sizeStocks.isEmpty()) {
            this.stock = sizeStocks.values().stream().mapToInt(v -> v != null ? Math.max(0, v) : 0).sum();
        }
    }

    public void initDefaultSizeStocks() {
        if (sizeStocks == null) {
            sizeStocks = new java.util.LinkedHashMap<>();
        }
        String n = (name != null ? name : "").toLowerCase();
        Long catId = (category != null) ? category.getId() : 1L;
        int baseStock = (stock != null && stock > 0) ? stock : 50;

        if (catId != null && catId == 2L || n.contains("sepatu") || n.contains("shoes")) {
            String[] sizes = {"39", "40", "41", "42", "43", "44"};
            int perSize = Math.max(1, baseStock / sizes.length);
            for (String s : sizes) sizeStocks.put(s, perSize);
        } else if (catId != null && catId == 3L || n.contains("bola") || n.contains("ball")) {
            if (n.contains("basket") || n.contains("futsal") || n.contains("soccer") || n.contains("bola")) {
                sizeStocks.put("Size 7", baseStock / 2);
                sizeStocks.put("Size 6", baseStock - (baseStock / 2));
            } else {
                sizeStocks.put("Standar", baseStock);
            }
        } else if (catId != null && catId == 5L || n.contains("tas") || n.contains("aksesoris")) {
            sizeStocks.put("All Size", baseStock);
        } else {
            String[] sizes = {"S", "M", "L", "XL", "XXL"};
            int perSize = Math.max(1, baseStock / sizes.length);
            for (String s : sizes) sizeStocks.put(s, perSize);
        }
        recalculateTotalStock();
    }
}
