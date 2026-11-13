package io.github.anismelow.weddinggallery.photo;

import java.time.Instant;
import java.util.UUID;

public record PhotoResponse(
        UUID id,
        String originalFilename,
        String contentType,
        Long sizeBytes,
        String uploaderName,
        Instant uploadedAt){

            public static PhotoResponse from(Photo photo) {
        return new PhotoResponse(
                photo.getId(),
                photo.getOriginalFilename(),
                photo.getContentType(),
                photo.getSizeBytes(),
                photo.getUploaderName(),
                photo.getUploadedAt()
           
        );
    }

}



