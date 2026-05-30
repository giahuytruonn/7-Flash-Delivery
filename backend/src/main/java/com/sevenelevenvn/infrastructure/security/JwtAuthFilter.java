package com.sevenelevenvn.infrastructure.security;

import io.jsonwebtoken.Claims;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Collections;
import java.util.UUID;

@Component
@RequiredArgsConstructor
@Slf4j
public class JwtAuthFilter extends OncePerRequestFilter {

    private final JwtUtils jwtUtils;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        
        final String authHeader = request.getHeader("Authorization");
        
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            filterChain.doFilter(request, response);
            return;
        }

        try {
            final String jwtToken = authHeader.substring(7);
            Claims claims = jwtUtils.validateToken(jwtToken);
            
            if (claims != null && SecurityContextHolder.getContext().getAuthentication() == null) {
                String userId = claims.getSubject();
                String role = claims.get("role", String.class);
                String fullName = claims.get("fullName", String.class);
                
                // Add ROLE_ prefix if not present to match standard Spring Security checks
                String authorityName = role.startsWith("ROLE_") ? role : "ROLE_" + role;
                SimpleGrantedAuthority authority = new SimpleGrantedAuthority(authorityName);
                
                UsernamePasswordAuthenticationToken authToken = new UsernamePasswordAuthenticationToken(
                        userId, // set Principal as userId string
                        null,
                        Collections.singletonList(authority)
                );
                
                authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                SecurityContextHolder.getContext().setAuthentication(authToken);
            }
        } catch (Exception ex) {
            log.warn("Không thể xác thực token JWT hợp lệ: {}", ex.getMessage());
        }

        filterChain.doFilter(request, response);
    }
}
