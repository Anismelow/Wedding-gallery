package io.github.anismelow.weddinggallery.storage;

import java.io.InputStream;

import org.springframework.core.io.Resource;

/**
 * Guarda, lee y borra ficheros.
 * No sabe nada de fotos ni de base de datos: solo bytes y claves.
 * Puede haber varias implementaciones (disco local, nube...).
 */
public interface StorageService {

    /**
     * Guarda el contenido y genera una clave única para encontrarlo después.
     *
     * @param content   los bytes del fichero, leídos poco a poco (streaming)
     * @param extension la extensión sin punto, por ejemplo "jpg"
     * @return la clave con la que se ha guardado, por ejemplo "3f2a9c1e-....jpg"
     * @throws StorageException si no se puede guardar
     */
    String store(InputStream content, String extension);

    /**
     * Devuelve el fichero asociado a la clave para poder leerlo.
     *
     * @param storageKey la clave que devolvió {@link #store}
     * @return el fichero como {@link Resource}
     * @throws StorageException si no existe o no se puede leer
     */
    Resource load(String storageKey);

    /**
     * Borra el fichero asociado a la clave.
     * Si no existe, no hace nada (idempotente).
     *
     * @param storageKey la clave que devolvió {@link #store}
     * @throws StorageException si existe pero no se puede borrar
     */
    void delete(String storageKey);
}