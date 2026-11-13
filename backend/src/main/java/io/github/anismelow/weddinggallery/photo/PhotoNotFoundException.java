package io.github.anismelow.weddinggallery.photo;

import java.util.UUID;

public class PhotoNotFoundException extends RuntimeException{

      public PhotoNotFoundException(UUID id) {
        super("No existe ninguna foto con id " + id);
    }
}
