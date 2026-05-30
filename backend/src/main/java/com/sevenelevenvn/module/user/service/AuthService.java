package com.sevenelevenvn.module.user.service;

import com.sevenelevenvn.common.exception.DuplicateResourceException;
import com.sevenelevenvn.common.exception.ResourceNotFoundException;
import com.sevenelevenvn.infrastructure.security.JwtUtils;
import com.sevenelevenvn.module.user.dto.LoginRequest;
import com.sevenelevenvn.module.user.dto.LoginResponse;
import com.sevenelevenvn.module.user.dto.RegisterRequest;
import com.sevenelevenvn.module.user.dto.RegisterResponse;
import com.sevenelevenvn.module.user.entity.Role;
import com.sevenelevenvn.module.user.entity.User;
import com.sevenelevenvn.module.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtils jwtUtils;

    @Transactional
    public RegisterResponse register(RegisterRequest request) {
        log.info("Bắt đầu đăng ký tài khoản mới: {}", request.getUsername());
        
        if (userRepository.findByUsername(request.getUsername()).isPresent()) {
            log.warn("Đăng ký thất bại. Tên đăng nhập đã tồn tại: {}", request.getUsername());
            throw new DuplicateResourceException("Tên đăng nhập đã tồn tại trong hệ thống");
        }

        Role assignedRole = Role.USER;
        if (request.getRole() != null) {
            try {
                assignedRole = Role.valueOf(request.getRole().toUpperCase());
            } catch (IllegalArgumentException e) {
                log.warn("Role không hợp lệ: {}, mặc định gán là USER", request.getRole());
            }
        }

        User user = User.builder()
                .username(request.getUsername())
                .password(passwordEncoder.encode(request.getPassword()))
                .fullName(request.getFullName())
                .role(assignedRole)
                .isActive(true)
                .build();

        User savedUser = userRepository.save(user);
        log.info("Đăng ký thành công tài khoản: {}, ID: {}", savedUser.getUsername(), savedUser.getId());

        return RegisterResponse.builder()
                .userId(savedUser.getId())
                .username(savedUser.getUsername())
                .role(savedUser.getRole().name())
                .build();
    }

    public LoginResponse login(LoginRequest request) {
        log.info("Bắt đầu xử lý đăng nhập cho tài khoản: {}", request.getUsername());

        User user = userRepository.findByUsername(request.getUsername())
                .orElseThrow(() -> {
                    log.warn("Đăng nhập thất bại. Tài khoản không tồn tại: {}", request.getUsername());
                    return new BadCredentialsException("Thông tin đăng nhập không chính xác");
                });

        if (!user.getIsActive()) {
            log.warn("Đăng nhập thất bại. Tài khoản bị khóa: {}", request.getUsername());
            throw new BadCredentialsException("Tài khoản này đã bị khóa hoặc không hoạt động");
        }

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            log.warn("Đăng nhập thất bại. Mật khẩu không trùng khớp cho tài khoản: {}", request.getUsername());
            throw new BadCredentialsException("Thông tin đăng nhập không chính xác");
        }

        String token = jwtUtils.generateToken(user);
        log.info("Đăng nhập thành công tài khoản: {}", user.getUsername());

        return LoginResponse.builder()
                .token(token)
                .role(user.getRole().name())
                .fullName(user.getFullName())
                .expiresIn(86400) // 24 hours in seconds
                .build();
    }

    public User findUserById(java.util.UUID id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy người dùng với ID: " + id));
    }
}
