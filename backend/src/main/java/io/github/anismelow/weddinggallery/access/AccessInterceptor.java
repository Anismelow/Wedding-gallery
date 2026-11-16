package io.github.anismelow.weddinggallery.access;

import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;
import org.springframework.web.util.WebUtils;

import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

@Component
public class AccessInterceptor implements HandlerInterceptor {

    private final AccessService accessService;

    public AccessInterceptor(AccessService accessService) {
        this.accessService = accessService;
    }

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) {
        Cookie cookie = WebUtils.getCookie(request, AccessCookie.NAME);
        if (cookie == null || !accessService.isValid(cookie.getValue())) {
            throw new UnauthorizedException("Necesitas el código de acceso. Escanea el QR de la boda.");
        }
        return true;
    }
}