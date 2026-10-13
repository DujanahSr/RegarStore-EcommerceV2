package com.regarsport.auth.mapper;

import com.regarsport.auth.dto.UserResponse;
import com.regarsport.auth.entity.User;
import org.springframework.stereotype.Component;

@Component
public class UserMapper {

    public UserResponse toResponse(User user) {
        if (user == null) return null;
        return new UserResponse(
                user.getId(),
                user.getFullName(),
                user.getEmail(),
                user.getRole() != null ? user.getRole().name() : null,
                user.getAvatarUrl(),
                user.getPhoneNumber(),
                user.getAddress(),
                user.getCity(),
                user.getPostalCode(),
                user.getBio(),
                user.getActive() != null ? user.getActive() : true,
                user.getCreatedAt(),
                Boolean.TRUE.equals(user.getEmailVerified()),
                user.getGoogleId() != null,
                user.getPassword() != null
        );
    }
}
