package io.github.anismelow.weddinggallery.access;

import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
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
    public ResponseEntity<Void> enter(@RequestBody AccessRequest request) {
        if (!accessService.isValid(request.code())) {
            throw new UnauthorizedException("Código de acceso incorrecto");
        }
        return ResponseEntity.noContent()
                .header(HttpHeaders.SET_COOKIE, AccessCookie.create(request.code()).toString())
                .build();
    }
}