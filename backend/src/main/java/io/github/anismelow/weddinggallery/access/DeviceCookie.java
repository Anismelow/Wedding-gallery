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

        /** Convierte el valor de la cookie en UUID; null si falta o no es válido. */
    public static UUID parse(String value) {
        if (value == null) {
            return null;
        }
        try {
            return UUID.fromString(value);
        } catch (IllegalArgumentException e) {
            return null;
        }
    }

}
