package io.github.anismelow.weddinggallery.photo;

import java.io.IOException;
import java.io.InputStream;
import java.util.Set;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;        
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import io.github.anismelow.weddinggallery.storage.StorageException;
import io.github.anismelow.weddinggallery.storage.StorageService;

@Service
public class PhotoService {

    private final PhotoRepository photoRepository;
    private final StorageService storageService;
    private static final Set<String> ALLOWED_EXTENSIONS = Set.of("jpg", "jpeg", "png", "heic", "heif", "webp");

    public PhotoService(PhotoRepository photoRepository, StorageService storageService) {
        this.photoRepository = photoRepository;
        this.storageService = storageService;
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

        Photo photo = new Photo();
        photo.setOriginalFilename(file.getOriginalFilename());
        photo.setStorageKey(storageKey);
        photo.setContentType(file.getContentType());
        photo.setSizeBytes(file.getSize());
        photo.setUploaderName(name);

        Photo saved = photoRepository.save(photo);
        return PhotoResponse.from(saved);
    }


    public Page<PhotoResponse> list(Pageable pageable) {
    return photoRepository.findAll(pageable).map(PhotoResponse::from);
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
        if (!ALLOWED_EXTENSIONS.contains(extension)) {
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