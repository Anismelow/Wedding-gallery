package io.github.anismelow.weddinggallery.photo;

import io.github.anismelow.weddinggallery.image.ThumbnailGenerator;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.util.Map;
import java.util.UUID;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.io.Resource;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import io.github.anismelow.weddinggallery.storage.StorageException;
import io.github.anismelow.weddinggallery.storage.StorageService;

@Service
public class PhotoService {

    private final ThumbnailGenerator thumbnailGenerator;
    private static final Logger log = LoggerFactory.getLogger(PhotoService.class);
    private final PhotoRepository photoRepository;
    private final StorageService storageService;
    private static final Map<String, String> CONTENT_TYPES = Map.of(
            "jpg", "image/jpeg",
            "jpeg", "image/jpeg",
            "png", "image/png",
            "heic", "image/heic",
            "heif", "image/heif",
            "webp", "image/webp");

    public PhotoService(
            PhotoRepository photoRepository,
            StorageService storageService,
            ThumbnailGenerator thumbnailGenerator) {
        this.photoRepository = photoRepository;
        this.storageService = storageService;
        this.thumbnailGenerator = thumbnailGenerator;
    }

    public PhotoResponse upload(MultipartFile file, String uploaderName) {

        String extension = validateAndGetExtension(file);
        String name = normalizeUploaderName(uploaderName);

        if (name != null && name.length() > 50) {
            throw new InvalidPhotoException("El nombre no puede tener más de 50 caracteres");
        }
        String storageKey;
        try (InputStream content = file.getInputStream()) {
            storageKey = storageService.store(content, extension);
        } catch (IOException e) {
            throw new StorageException("No se pudo leer el fichero subido", e);
        }
        String thumbnailKey = createThumbnail(storageKey);

        Photo photo = new Photo();
        photo.setOriginalFilename(file.getOriginalFilename());
        photo.setStorageKey(storageKey);
        photo.setContentType(CONTENT_TYPES.get(extension));
        photo.setSizeBytes(file.getSize());
        photo.setUploaderName(name);
        photo.setThumbnailKey(thumbnailKey);

        Photo saved = photoRepository.save(photo);
        return PhotoResponse.from(saved);
    }

    private String createThumbnail(String storageKey) {
        try (InputStream original = storageService.load(storageKey).getInputStream()) {
            return thumbnailGenerator.generate(original)
                    .map(bytes -> storageService.store(new ByteArrayInputStream(bytes), "jpg"))
                    .orElse(null);
        } catch (IOException e) {
            log.warn("No se pudo leer el original {} para la miniatura", storageKey, e);
            return null;
        }
    }

private Photo findPhoto(UUID id) {
    return photoRepository.findById(id)
            .orElseThrow(() -> new PhotoNotFoundException(id));
}


    public Page<PhotoResponse> list(Pageable pageable) {
        return photoRepository.findAll(pageable).map(PhotoResponse::from);
    }

    public PhotoFile getImage(UUID id) {
        Photo photo = findPhoto(id);

        Resource resource = storageService.load(photo.getStorageKey());
        return new PhotoFile(resource, photo.getContentType(), photo.getOriginalFilename());
    }
   
   
    public PhotoFile getThumbnail(UUID id) {
    Photo photo = findPhoto(id);

    if (photo.getThumbnailKey() == null) {
        // Sin miniatura (HEIC o fotos antiguas): servimos el original
        return getImage(id);
    }

    Resource thumbnail = storageService.load(photo.getThumbnailKey());
    return new PhotoFile(thumbnail, "image/jpeg", photo.getOriginalFilename());
}

    private String validateAndGetExtension(MultipartFile file) {

        if (file == null || file.isEmpty()) {
            throw new InvalidPhotoException("No se ha enviado ninguna foto o está vacía");
        }

        String extension = StringUtils.getFilenameExtension(file.getOriginalFilename());
        if (extension == null) {
            throw new InvalidPhotoException("El fichero no tiene extensión");
        }

        extension = extension.toLowerCase();
        if (!CONTENT_TYPES.containsKey(extension)) {
            throw new InvalidPhotoException("Formato no permitido: " + extension);
        }

        String contentType = file.getContentType();
        if (contentType == null || !contentType.startsWith("image/")) {
            throw new InvalidPhotoException("El fichero no es una imagen");
        }

        return extension;
    }

    private String normalizeUploaderName(String uploaderName) {
        if (!StringUtils.hasText(uploaderName)) {
            return null;
        }
        return uploaderName.trim();
    }

}