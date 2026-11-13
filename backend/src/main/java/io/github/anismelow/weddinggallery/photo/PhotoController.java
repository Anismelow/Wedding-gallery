package io.github.anismelow.weddinggallery.photo;

import java.time.Duration;
import java.util.UUID;


import org.springframework.core.io.Resource;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.data.web.PagedModel;
import org.springframework.http.CacheControl;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.data.domain.Sort;

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
            @RequestParam(value = "uploaderName", required = false) String uploaderName) {
        return photoService.upload(file, uploaderName);

    }

    @GetMapping
public PagedModel<PhotoResponse> list(
        @PageableDefault(size = 20, sort = "uploadedAt", direction = Sort.Direction.DESC) Pageable pageable) {
    return new PagedModel<>(photoService.list(pageable));
}

    @GetMapping("/{id}/image")
public ResponseEntity<Resource> image(@PathVariable  UUID id){
    PhotoFile file = photoService.getImage(id);
    return ResponseEntity.ok()
            .contentType(MediaType.parseMediaType(file.contentType()))
            .cacheControl(CacheControl.maxAge(Duration.ofDays(365)).cachePublic())
            .header("X-Content-Type-Options", "nosniff")
            .body(file.resource());
}


}