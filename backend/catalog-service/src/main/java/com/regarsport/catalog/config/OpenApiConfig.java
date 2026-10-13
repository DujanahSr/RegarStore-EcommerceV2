package com.regarsport.catalog.config;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.License;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import io.swagger.v3.oas.models.servers.Server;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.List;

@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI catalogOpenAPI() {
        return new OpenAPI()
                .servers(List.of(new Server().url("/").description("API Gateway (URL relatif: lokal maupun domain demo)")))
                .info(new Info()
                        .title("RegarStore - Catalog Service API")
                        .description("High-performance Catalog & Inventory Microservice with Redis Caching and Optimistic Locking")
                        .version("v1.0.0")
                        .contact(new Contact()
                                .name("Abu Dujanah Siregar")
                                .email("abudujanahsiregar@gmail.com"))
                        .license(new License().name("Apache 2.0")))
                .components(new Components()
                        .addSecuritySchemes("bearerAuth", new SecurityScheme()
                                .type(SecurityScheme.Type.HTTP)
                                .scheme("bearer")
                                .bearerFormat("JWT")))
                .addSecurityItem(new SecurityRequirement().addList("bearerAuth"));
    }
}
