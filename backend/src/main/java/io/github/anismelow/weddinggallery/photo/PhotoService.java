package io.github.anismelow.weddinggallery.photo;

import java.io.IOException;
import java.io.InputStream;

import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import io.github.anismelow.weddinggallery.storage.StorageException;
import io.github.anismelow.weddinggallery.storage.StorageService;

@Service
public class PhotoService {

    private final PhotoRepository photoRepository;
    private final StorageService storageService;

    public PhotoService(PhotoRepository photoRepository, StorageService storageService) {
        this.photoRepository = photoRepository;
        this.storageService = storageService;
    }

    public PhotoResponse upload(MultipartFile file, String uploaderName) {
        String extension = StringUtils.getFilenameExtension(file.getOriginalFilename()).toLowerCase();

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
        photo.setUploaderName(uploaderName);

        Photo saved = photoRepository.save(photo);
        return PhotoResponse.from(saved);
    }
}