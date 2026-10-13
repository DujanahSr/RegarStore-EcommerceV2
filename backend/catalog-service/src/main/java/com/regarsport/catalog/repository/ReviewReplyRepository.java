package com.regarsport.catalog.repository;

import com.regarsport.catalog.entity.ReviewReply;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ReviewReplyRepository extends JpaRepository<ReviewReply, Long> {
    List<ReviewReply> findByReviewId(Long reviewId);
    void deleteByReviewId(Long reviewId);
}
