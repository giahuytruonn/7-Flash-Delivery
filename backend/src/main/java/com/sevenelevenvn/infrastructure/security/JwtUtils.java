package com.sevenelevenvn.infrastructure.security;

import com.sevenelevenvn.module.user.entity.User;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.nio.charset.StandardCharsets;
import java.security.Key;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;
import java.util.function.Function;

@Component
public class JwtUtils {

    @Value("${app.jwt.secret:7eleven-vietnam-super-secret-key-2024-production}")
    private String jwtSecret;

    @Value("${app.jwt.expiration-ms:86400000}") // Default 24 hours
    private long jwtExpirationMs;

    private Key signingKey;

    @PostConstruct
    public void init() {
        this.signingKey = Keys.hmacShaKeyFor(jwtSecret.getBytes(StandardCharsets.UTF_8));
    }

    public String generateToken(User user) {
        Map<String, Object> claims = new HashMap<>();
        claims.put("role", user.getRole().name());
        claims.put("fullName", user.getFullName());

        return Jwts.builder()
                .setClaims(claims)
                .setSubject(user.getId().toString())
                .setIssuedAt(new Date(System.currentTimeMillis()))
                .setExpiration(new Date(System.currentTimeMillis() + jwtExpirationMs))
                .signWith(signingKey, SignatureAlgorithm.HS256)
                .compact();
    }

    public Claims validateToken(String token) {
        return Jwts.parserBuilder()
                .setSigningKey(signingKey)
                .build()
                .parseClaimsJws(token)
                .getBody();
    }

    public UUID extractUserId(String token) {
        String subject = extractClaim(token, Claims::getSubject);
        return UUID.fromString(subject);
    }

    public String extractRole(String token) {
        Claims claims = validateToken(token);
        return claims.get("role", String.class);
    }

    public <T> T extractClaim(String token, Function<Claims, T> claimsResolver) {
        final Claims claims = validateToken(token);
        return claimsResolver.apply(claims);
    }

    public boolean isTokenExpired(String token) {
        return extractClaim(token, Claims::getExpiration).before(new Date());
    }
}
