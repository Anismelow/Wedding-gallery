package io.github.anismelow.weddinggallery.access;

import java.util.UUID;

import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CookieValue;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/access")
public class AccessController {

    private final AccessService accessService;

    public AccessController(AccessService accessService) {
        this.accessService = accessService;
    }
    

 @PostMapping
    public ResponseEntity<Void> enter(
            @RequestBody AccessRequest request,
            @CookieValue(name = DeviceCookie.NAME, required = false) String deviceId) {
        if (!accessService.isValid(request.code())) {
            throw new UnauthorizedException("Código de acceso incorrecto");
        }
        var response = ResponseEntity.noContent()
                .header(HttpHeaders.SET_COOKIE, AccessCookie.create(request.code()).toString());

        if (deviceId == null) {
            response.header(HttpHeaders.SET_COOKIE,
                    DeviceCookie.create(UUID.randomUUID()).toString());
        }
        return response.build();
    }
    
}