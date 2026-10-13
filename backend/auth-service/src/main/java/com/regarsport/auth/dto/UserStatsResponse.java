package com.regarsport.auth.dto;

import java.io.Serializable;

public record UserStatsResponse(
    long totalUsers,
    long totalAdmins,
    long totalCustomers
) implements Serializable {}
