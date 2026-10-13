package com.regarsport.order.repository;

import com.regarsport.order.entity.Order;
import com.regarsport.order.entity.OrderStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface OrderRepository extends JpaRepository<Order, Long> {

    Optional<Order> findByOrderNumber(String orderNumber);

    Page<Order> findByUserId(Long userId, Pageable pageable);

    Page<Order> findByStatus(OrderStatus status, Pageable pageable);

    @Query("SELECT o FROM Order o LEFT JOIN FETCH o.items WHERE o.id = :id")
    Optional<Order> findByIdWithItems(@Param("id") Long id);

    @Query("SELECT o FROM Order o LEFT JOIN FETCH o.items WHERE o.orderNumber = :orderNumber")
    Optional<Order> findByOrderNumberWithItems(@Param("orderNumber") String orderNumber);

    @Query("SELECT COALESCE(SUM(o.totalAmount), 0) FROM Order o WHERE o.status IN (:statuses)")
    java.math.BigDecimal calculateTotalRevenue(@Param("statuses") java.util.List<OrderStatus> statuses);

    long countByStatus(OrderStatus status);

    @Query("SELECT o FROM Order o LEFT JOIN FETCH o.items ORDER BY o.createdAt DESC")
    java.util.List<Order> findAllWithItemsOrderByCreatedAtDesc();

    @Query("SELECT item.productName, SUM(item.quantity) FROM OrderItem item JOIN item.order o WHERE o.status IN (:statuses) GROUP BY item.productName ORDER BY SUM(item.quantity) DESC")
    java.util.List<Object[]> findTopSellingProducts(@Param("statuses") java.util.List<OrderStatus> statuses, Pageable pageable);
}
