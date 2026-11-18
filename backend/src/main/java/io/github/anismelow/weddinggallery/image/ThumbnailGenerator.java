package io.github.anismelow.weddinggallery.image;

import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.util.Optional;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import net.coobird.thumbnailator.Thumbnails;

@Component
public class ThumbnailGenerator {

    private static final Logger log = LoggerFactory.getLogger(ThumbnailGenerator.class);
    private static final int MAX_SIZE = 400;

    /**
     * Genera una miniatura JPEG de como máximo 400x400 px, manteniendo la proporción.
     *
     * @param original los bytes de la imagen original
     * @return la miniatura, o vacío si el formato no se puede leer (por ejemplo, HEIC)
     */
    public Optional<byte[]> generate(InputStream original) {
        try {
            ByteArrayOutputStream out = new ByteArrayOutputStream();
            Thumbnails.of(original)
                    .size(MAX_SIZE, MAX_SIZE)
                    .imageType(BufferedImage.TYPE_INT_RGB)
                    .outputFormat("jpg")
                    .outputQuality(0.8)
                    .toOutputStream(out);
            return Optional.of(out.toByteArray());
        } catch (IOException e) {
            log.warn("No se pudo generar la miniatura: {}", e.getMessage());
            return Optional.empty();
        }
    }


}
