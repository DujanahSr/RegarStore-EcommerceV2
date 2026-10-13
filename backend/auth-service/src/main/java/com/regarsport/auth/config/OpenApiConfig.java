package com.regarsport.auth.config;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.License;
import io.swagger.v3.oas.models.security.SecurityScheme;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI authOpenAPI() {
        return new OpenAPI()
                .servers(java.util.List.of(new io.swagger.v3.oas.models.servers.Server().url("/").description("API Gateway (URL relatif: lokal maupun domain demo)")))
                .info(new Info()
                        .title("RegarStore - Auth & Identity Service API")
                        .description("Authentication and RBAC Authorization Microservice with Spring Security 6 and JWT")
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
                .addSecurityItem(new io.swagger.v3.oas.models.security.SecurityRequirement().addList("bearerAuth"));
    }
}
