package io.github.anismelow.weddinggallery.photo;

import org.springframework.core.io.Resource;

public record PhotoFile(Resource resource, String contentType,String originalFilename) {

    
}
