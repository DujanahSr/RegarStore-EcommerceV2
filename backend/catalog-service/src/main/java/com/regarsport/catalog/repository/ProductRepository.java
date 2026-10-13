package com.regarsport.catalog.repository;

import com.regarsport.catalog.entity.Product;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface ProductRepository extends JpaRepository<Product, Long> {

    @Query("SELECT p FROM Product p JOIN FETCH p.category WHERE p.id = :id")
    Optional<Product> findByIdWithCategory(@Param("id") Long id);

    @Query(value = "SELECT p FROM Product p JOIN FETCH p.category",
           countQuery = "SELECT count(p) FROM Product p")
    Page<Product> findAllWithCategory(Pageable pageable);

    @Query(value = "SELECT p FROM Product p JOIN FETCH p.category WHERE p.category.id = :categoryId",
           countQuery = "SELECT count(p) FROM Product p WHERE p.category.id = :categoryId")
    Page<Product> findByCategoryId(@Param("categoryId") Long categoryId, Pageable pageable);

    @Query(value = "SELECT p FROM Product p JOIN FETCH p.category WHERE " +
           "LOWER(p.name) LIKE LOWER(CONCAT('%', :search, '%')) " +
           "OR LOWER(p.description) LIKE LOWER(CONCAT('%', :search, '%')) " +
           "OR LOWER(p.category.name) LIKE LOWER(CONCAT('%', :search, '%'))",
           countQuery = "SELECT count(p) FROM Product p WHERE " +
           "LOWER(p.name) LIKE LOWER(CONCAT('%', :search, '%')) " +
           "OR LOWER(p.description) LIKE LOWER(CONCAT('%', :search, '%')) " +
           "OR LOWER(p.category.name) LIKE LOWER(CONCAT('%', :search, '%'))")
    Page<Product> searchByName(@Param("search") String search, Pageable pageable);

    @Query(value = "SELECT p FROM Product p JOIN FETCH p.category WHERE p.category.id = :categoryId AND " +
           "(LOWER(p.name) LIKE LOWER(CONCAT('%', :search, '%')) " +
           "OR LOWER(p.description) LIKE LOWER(CONCAT('%', :search, '%')))",
           countQuery = "SELECT count(p) FROM Product p WHERE p.category.id = :categoryId AND " +
           "(LOWER(p.name) LIKE LOWER(CONCAT('%', :search, '%')) " +
           "OR LOWER(p.description) LIKE LOWER(CONCAT('%', :search, '%')))")
    Page<Product> searchByCategoryAndName(@Param("categoryId") Long categoryId, @Param("search") String search, Pageable pageable);

    boolean existsByImageUrl(String imageUrl);
}
