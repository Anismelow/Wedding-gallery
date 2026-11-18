package io.github.anismelow.weddinggallery.photo;

import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.UUID;

import org.springframework.core.io.Resource;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.data.web.PagedModel;
import org.springframework.http.CacheControl;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CookieValue;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import io.github.anismelow.weddinggallery.access.DeviceCookie;

@RestController
@RequestMapping("/api/photos")
public class PhotoController {

    private final PhotoService photoService;

    public PhotoController(PhotoService photoService) {
        this.photoService = photoService;
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @ResponseStatus(HttpStatus.CREATED)
    public PhotoResponse upload(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "uploaderName", required = false) String uploaderName,
            @CookieValue(name = DeviceCookie.NAME, required = false) String deviceId) {
        return photoService.upload(file, uploaderName, DeviceCookie.parse(deviceId));
    }

    @GetMapping
    public PagedModel<PhotoResponse> list(
            @PageableDefault(size = 20, sort = "uploadedAt", direction = Sort.Direction.DESC) Pageable pageable,
            @CookieValue(name = DeviceCookie.NAME, required = false) String deviceId) {
        return new PagedModel<>(photoService.list(pageable, DeviceCookie.parse(deviceId)));
    }

    @GetMapping("/{id}/image")
    public ResponseEntity<Resource> image(@PathVariable UUID id) {
        return toImageResponse(photoService.getImage(id));
    }

    @GetMapping("/{id}/thumbnail")
    public ResponseEntity<Resource> thumbnail(@PathVariable UUID id) {
        return toImageResponse(photoService.getThumbnail(id));
    }

    @GetMapping("/{id}/download")
    public ResponseEntity<Resource> download(@PathVariable UUID id) {
        PhotoFile file = photoService.getImage(id);

        ContentDisposition disposition = ContentDisposition.attachment()
                .filename(file.originalFilename(), StandardCharsets.UTF_8)
                .build();

        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(file.contentType()))
                .header(HttpHeaders.CONTENT_DISPOSITION, disposition.toString())
                .header("X-Content-Type-Options", "nosniff")
                .body(file.resource());
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(
            @PathVariable UUID id,
            @CookieValue(name = DeviceCookie.NAME, required = false) String deviceId) {
        photoService.delete(id, DeviceCookie.parse(deviceId));
    }

    private ResponseEntity<Resource> toImageResponse(PhotoFile file) {
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(file.contentType()))
                .cacheControl(CacheControl.maxAge(Duration.ofDays(365)).cachePrivate())
                .header("X-Content-Type-Options", "nosniff")
                .body(file.resource());
    }

}