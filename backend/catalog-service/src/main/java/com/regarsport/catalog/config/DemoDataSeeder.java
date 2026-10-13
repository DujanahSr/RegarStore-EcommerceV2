package com.regarsport.catalog.config;

import com.regarsport.catalog.entity.Category;
import com.regarsport.catalog.entity.Product;
import com.regarsport.catalog.repository.CategoryRepository;
import com.regarsport.catalog.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/** Isi 5 kategori + 10 produk demo kalau katalog masih kosong. Gambar memakai aset statis frontend (/images/...). */
@Slf4j
@Component
@RequiredArgsConstructor
public class DemoDataSeeder implements CommandLineRunner {

    private final CategoryRepository categoryRepository;
    private final ProductRepository productRepository;

    private record Item(String category, String name, int price, String image, String description) {}

    @Override
    @Transactional
    public void run(String... args) {
        if (productRepository.count() > 0 || categoryRepository.count() > 0) {
            return;
        }

        Map<String, Category> categories = new LinkedHashMap<>();
        for (String[] c : new String[][]{
                {"Sepak Bola", "/images/cat-football.jpg"},
                {"Bola Voli", "/images/cat-volleyball.jpg"},
                {"Badminton", "/images/cat-badminton.jpg"},
                {"Basket", "/images/products/jersey_basketball_dunk.jpg"},
                {"Esports", "/images/cat-esports.jpg"}}) {
            categories.put(c[0], categoryRepository.save(Category.builder().name(c[0]).imageUrl(c[1]).build()));
        }

        String football = "/images/products/jersey_football_garuda.jpg";
        String volley = "/images/products/jersey_volleyball_spiker.jpg";
        String badminton = "/images/products/jersey_badminton_smash.jpg";
        String basket = "/images/products/jersey_basketball_dunk.jpg";
        String esports = "/images/products/jersey_esports_apex.jpg";

        List<Item> items = List.of(
                new Item("Sepak Bola", "Jersey Garuda Home 2026", 249000, football,
                        "Jersey sepak bola full printing dengan bahan Dry-Fit Microfiber, ringan dan cepat kering. Bisa custom nama & nomor punggung."),
                new Item("Sepak Bola", "Jersey Elang Away Custom", 189000, football,
                        "Jersey away dengan pola sublimasi elang, kerah V-neck, cocok untuk tim komunitas maupun turnamen."),
                new Item("Bola Voli", "Jersey Voli Spiker Pro", 179000, volley,
                        "Jersey voli sleeveless dengan ventilasi mesh di sisi badan untuk sirkulasi udara maksimal."),
                new Item("Bola Voli", "Jersey Voli Block Master", 169000, volley,
                        "Jersey voli lengan pendek bahan elastis 4-way stretch, nyaman untuk gerakan blocking dan spike."),
                new Item("Badminton", "Jersey Badminton Smash Elite", 159000, badminton,
                        "Kaos badminton bahan Polyester Cool-Tech anti-bakteri, warna tajam berkat sublimasi premium."),
                new Item("Badminton", "Jersey Badminton Drop Shot Lite", 139000, badminton,
                        "Versi ringan untuk latihan harian, potongan athletic fit dan jahitan flatlock anti-lecet."),
                new Item("Basket", "Jersey Basket Dunk Series", 219000, basket,
                        "Jersey basket reversible dengan bahan mesh tebal, lengkap dengan celana senada."),
                new Item("Basket", "Jersey Basket Street Ballers", 199000, basket,
                        "Desain streetball urban, bahan breathable dan potongan longgar untuk kebebasan bergerak."),
                new Item("Esports", "Jersey Esports Apex Predator", 229000, esports,
                        "Jersey gaming dengan desain agresif, bahan adem untuk sesi turnamen panjang. Gratis custom nickname."),
                new Item("Esports", "Jersey Esports Nexus Pro Team", 209000, esports,
                        "Jersey tim esports lengan panjang dengan sponsor slot di dada dan lengan, full sublimasi.")
        );

        int[][] stockPatterns = {{10, 20, 25, 15, 10}, {8, 15, 20, 12, 5}, {5, 12, 18, 10, 6}};
        String[] sizes = {"S", "M", "L", "XL", "XXL"};
        for (int i = 0; i < items.size(); i++) {
            Item item = items.get(i);
            Map<String, Integer> sizeStocks = new LinkedHashMap<>();
            int[] pattern = stockPatterns[i % stockPatterns.length];
            for (int s = 0; s < sizes.length; s++) {
                sizeStocks.put(sizes[s], pattern[s]);
            }
            Product product = Product.builder()
                    .category(categories.get(item.category()))
                    .name(item.name())
                    .description(item.description())
                    .price(BigDecimal.valueOf(item.price()))
                    .imageUrl(item.image())
                    .stock(0)
                    .sizeStocks(sizeStocks)
                    .build();
            product.recalculateTotalStock();
            productRepository.save(product);
        }
        log.info("[DemoDataSeeder] {} kategori dan {} produk demo berhasil dibuat", categories.size(), items.size());
    }
}
