package io.github.anismelow.weddinggallery.storage;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;

class LocalStorageServiceTest {

    @TempDir
    Path tempDir; // JUnit crea una carpeta temporal y la borra al terminar

    private LocalStorageService storage;

    @BeforeEach
    void setUp() { // se ejecuta ANTES de cada test → cada uno empieza limpio
        storage = new LocalStorageService(tempDir.toString());
    }

    @Test
    void store_guardaElFicheroYDevuelveClaveConExtension() throws IOException {
        // Arrange (preparar)
        byte[] bytes = "foto-de-prueba".getBytes();

        // Act (ejecutar)
        String key = storage.store(new ByteArrayInputStream(bytes), "jpg");

        // Assert (comprobar)
        assertThat(key).endsWith(".jpg");
        assertThat(Files.readAllBytes(tempDir.resolve(key))).isEqualTo(bytes);
    }

    @Test
    void load_lanzaExcepcionSiNoExiste() {
        // Arrange: nada que preparar, la carpeta temporal empieza vacía

        // Act + Assert: pedir algo que no existe DEBE lanzar StorageException
        assertThatThrownBy(() -> storage.load("no-existe.jpg"))
                .isInstanceOf(StorageException.class)
                .hasMessageContaining("Fichero no encontrado");
    }

    @Test
    void delete_borraElFicheroYEsIdempotente() {
        // Arrange: guardamos un fichero para tener algo que borrar
        String key = storage.store(new ByteArrayInputStream("foto".getBytes()), "jpg");

        // Act: lo borramos
        storage.delete(key);

        // Assert 1: ya no está en el disco
        assertThat(Files.exists(tempDir.resolve(key))).isFalse();

        // Assert 2: borrarlo OTRA vez no da error (idempotente)
        assertThatCode(() -> storage.delete(key)).doesNotThrowAnyException();
    }

    @Test
    void load_bloqueaPathTraversal() {
        // Act + Assert: una clave con ".." intenta salir de la carpeta → debe
        // bloquearse
        assertThatThrownBy(() -> storage.load("../secreto.txt"))
                .isInstanceOf(StorageException.class)
                .hasMessageContaining("Ruta no permitida");
    }

}