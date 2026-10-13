package com.regarsport.auth.repository;

import com.regarsport.auth.entity.OtpToken;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface OtpTokenRepository extends JpaRepository<OtpToken, Long> {

    Optional<OtpToken> findFirstByEmailAndPurposeOrderByCreatedAtDesc(String email, OtpToken.Purpose purpose);

    Optional<OtpToken> findFirstByEmailAndPurposeAndUsedFalseOrderByCreatedAtDesc(String email, OtpToken.Purpose purpose);

    @Modifying
    @Query("UPDATE OtpToken o SET o.used = true WHERE o.email = :email AND o.purpose = :purpose AND o.used = false")
    void invalidateActive(@Param("email") String email, @Param("purpose") OtpToken.Purpose purpose);
}
