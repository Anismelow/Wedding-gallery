package io.github.anismelow.weddinggallery.photo.model;

import java.time.Instant;                        
import java.util.UUID;

import org.hibernate.annotations.CreationTimestamp;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "photos")
@Getter
@Setter
@NoArgsConstructor
public class Photo {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "original_filename", nullable = false, length = 255)   
    private String originalFilename;

    @Column(name = "storage_key", nullable = false, length = 255, unique = true)
    private String storageKey;

    @Column(name = "content_type", nullable = false, length = 255)       
    private String contentType;

    @Column(name = "size_bytes", nullable = false)                        
    private Long sizeBytes;                                               

    @Column(name = "uploader_name", length = 50)                          
    private String uploaderName;

    @CreationTimestamp
    @Column(name = "uploaded_at", nullable = false, updatable = false)    
    private Instant uploadedAt;                                            
}