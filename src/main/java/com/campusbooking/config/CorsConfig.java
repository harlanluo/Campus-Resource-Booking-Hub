package com.campusbooking.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

/**
 * Global CORS configuration for the Campus Booking Hub API.
 *
 * <p>Allows all common HTTP methods from any {@code localhost} origin so that
 * a frontend application running on any local dev-server port (e.g. 3000, 5173,
 * 8081) can make cross-origin requests without browser CORS errors.</p>
 *
 * <h3>Allowed origins pattern</h3>
 * Uses {@code http://localhost:*} wildcard pattern so all local ports are covered
 * (React/Vite typically 3000/5173, Angular 4200, Next.js 3000, etc.).
 *
 * <h3>Production note</h3>
 * Before deploying to production, replace the wildcard origin with the specific
 * frontend URL (e.g., {@code https://booking.youruni.edu}).
 */
@Configuration
public class CorsConfig {

    /**
     * Registers CORS mappings that apply to all {@code /api/**} endpoints.
     *
     * <ul>
     *   <li>Allowed origins: {@code http://localhost} (any port via pattern)</li>
     *   <li>Allowed methods: {@code GET, POST, PUT, DELETE, PATCH, OPTIONS}</li>
     *   <li>Allowed headers: all ({@code *})</li>
     *   <li>Max age: 3600 s (1 hour) — browsers cache preflight results</li>
     * </ul>
     *
     * @return a {@link WebMvcConfigurer} that installs the CORS rules
     */
    @Bean
    public WebMvcConfigurer corsConfigurer() {
        return new WebMvcConfigurer() {
            @Override
            public void addCorsMappings(CorsRegistry registry) {
                registry.addMapping("/api/**")
                        .allowedOriginPatterns(
                                "http://localhost:*",
                                "http://127.0.0.1:*")
                        .allowedMethods("GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS")
                        .allowedHeaders("*")
                        .allowCredentials(true)
                        .maxAge(3600);
            }
        };
    }
}
