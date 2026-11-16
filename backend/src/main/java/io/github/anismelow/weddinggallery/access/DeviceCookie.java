package io.github.anismelow.weddinggallery.access;

import java.time.Duration;
import java.util.UUID;

import org.springframework.http.ResponseCookie;

public final class DeviceCookie {

    public static final String NAME = "wg_device";

    private DeviceCookie() {
    }

    public static ResponseCookie create(UUID deviceId) {
        return ResponseCookie.from(NAME, deviceId.toString())
                .httpOnly(true)
                .secure(true)
                .sameSite("Lax")
                .path("/")
                .maxAge(Duration.ofDays(365))
                .build();

    }

}
