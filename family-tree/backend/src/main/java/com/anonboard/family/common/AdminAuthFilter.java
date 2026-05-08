package com.anonboard.family.common;

import jakarta.servlet.*;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

import java.io.IOException;

@Component
@Order(1)
public class AdminAuthFilter implements Filter {

    private final JwtUtil jwtUtil;

    public AdminAuthFilter(JwtUtil jwtUtil) {
        this.jwtUtil = jwtUtil;
    }

    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain)
            throws IOException, ServletException {

        HttpServletRequest req = (HttpServletRequest) request;
        HttpServletResponse res = (HttpServletResponse) response;

        String path = req.getRequestURI();

        // 只拦截 /api/admin/ 下的请求
        if (path.startsWith("/api/admin/")) {
            // 登录接口不拦截
            if (path.equals("/api/admin/family/login")) {
                chain.doFilter(request, response);
                return;
            }

            String authHeader = req.getHeader("Authorization");
            if (authHeader == null || !authHeader.startsWith("Bearer ")) {
                res.setStatus(401);
                res.setContentType("application/json;charset=UTF-8");
                res.getWriter().write("{\"code\":401,\"message\":\"未登录或 token 已过期\",\"data\":null}");
                return;
            }

            String token = authHeader.substring(7);
            if (!jwtUtil.validateToken(token)) {
                res.setStatus(401);
                res.setContentType("application/json;charset=UTF-8");
                res.getWriter().write("{\"code\":401,\"message\":\"token 无效或已过期\",\"data\":null}");
                return;
            }
        }

        chain.doFilter(request, response);
    }
}
