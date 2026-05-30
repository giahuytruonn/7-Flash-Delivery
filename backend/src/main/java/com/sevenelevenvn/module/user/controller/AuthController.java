package com.sevenelevenvn.module.user.controller;

import com.sevenelevenvn.common.ApiResponse;
import com.sevenelevenvn.module.user.dto.LoginRequest;
import com.sevenelevenvn.module.user.dto.LoginResponse;
import com.sevenelevenvn.module.user.dto.RegisterRequest;
import com.sevenelevenvn.module.user.dto.RegisterResponse;
import com.sevenelevenvn.module.user.service.AuthService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@Tag(name = "1. Authentication", description = "Endpoints phục vụ việc Đăng ký và Đăng nhập hệ thống")
public class AuthController {

    private final AuthService authService;

    @PostMapping("/register")
    @Operation(summary = "Đăng ký tài khoản mới", description = "Đăng ký người dùng hoặc quản trị viên mới")
    public ApiResponse<RegisterResponse> register(@Valid @RequestBody RegisterRequest request) {
        RegisterResponse response = authService.register(request);
        return ApiResponse.success("Đăng ký tài khoản thành công", response);
    }

    @PostMapping("/login")
    @Operation(summary = "Đăng nhập hệ thống", description = "Trả về JWT Token nếu đăng nhập thành công")
    public ApiResponse<LoginResponse> login(@Valid @RequestBody LoginRequest request) {
        LoginResponse response = authService.login(request);
        return ApiResponse.success("Đăng nhập thành công", response);
    }
}
