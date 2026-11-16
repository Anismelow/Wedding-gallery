package io.github.anismelow.weddinggallery.access;



import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;


@Service 
public class AccessService {

     private static final int MIN_LENGTH = 16;

    private final String accessCode;


  public AccessService(@Value ("${app.access.code}") String accessCode) {
        if (accessCode.length() < MIN_LENGTH) {
            throw new IllegalStateException(
                    "ACCESS_CODE debe tener al menos " + MIN_LENGTH + " caracteres");
        }
        this.accessCode = accessCode;
    }

    public boolean isValid(String code) {
        if(!StringUtils.hasText(code)){
            return false;
        }
        return MessageDigest.isEqual(
            accessCode.getBytes(StandardCharsets.UTF_8),
            code.getBytes(StandardCharsets.UTF_8)
        );

    }
}