package io.github.anismelow.weddinggallery.storage;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Service;

@Service
public class LocalStorageService implements StorageService {

    private final Path rootLocation;

    public LocalStorageService(@Value("${app.storage.location}") String location) {
        this.rootLocation = Paths.get(location).toAbsolutePath().normalize();

        try {
            Files.createDirectories(rootLocation);
        } catch (IOException e) {
            throw new StorageException("No se pudo crear la carpeta de almacenamiento: " + rootLocation, e);
        }
    }

    @Override
    public String store(InputStream content, String extension) {

        String storageKey = UUID.randomUUID() + "." + extension;
        Path destination = resolveSafely(storageKey);

        try {
            Files.copy(content, destination);
        } catch (IOException e) {
            throw new StorageException("No se pudo guardar el fichero: " + storageKey, e);
        }
        return storageKey;

    }

    @Override
    public Resource load(String storageKey) {
        Path file = resolveSafely(storageKey);
        if (!Files.exists(file)) {
            throw new StorageException("Fichero no encontrado: " + storageKey);
        }

        return new FileSystemResource(file);
    }

    @Override
    public void delete(String storageKey) {
        try {
            Files.deleteIfExists(resolveSafely(storageKey));
        } catch (IOException e) {
            throw new StorageException("No se ha podido eliminar el fichero: " + storageKey, e);
        }

    }

    /** Resuelve la clave dentro de rootLocation y bloquea el path traversal. */
    private Path resolveSafely(String storageKey) {
        Path file = rootLocation.resolve(storageKey).normalize();
        if (!file.startsWith(rootLocation)) {
            throw new StorageException("Ruta no permitida: " + storageKey);
        }
        return file;
    }
}