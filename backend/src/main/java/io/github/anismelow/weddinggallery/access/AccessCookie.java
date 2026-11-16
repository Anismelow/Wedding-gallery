package io.github.anismelow.weddinggallery.access;

import java.time.Duration;

import org.springframework.http.ResponseCookie;


public final class AccessCookie {

    public static final String NAME = "wg_access";

    private AccessCookie(){
    }

    public static ResponseCookie create(String code){
        return ResponseCookie.from(NAME , code)
                .httpOnly(true)
                .secure(true)
                .sameSite("Lax")
                .path("/")
                .maxAge(Duration.ofDays(30))
                .build();
    }

}
