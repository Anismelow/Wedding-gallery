CREATE TABLE photos (                               
    id                UUID PRIMARY KEY,
    original_filename VARCHAR(255) NOT NULL,
    storage_key       VARCHAR(255) NOT NULL UNIQUE, 
    content_type      VARCHAR(255) NOT NULL,
    size_bytes        BIGINT       NOT NULL,
    uploader_name     VARCHAR(50),
    uploaded_at       TIMESTAMPTZ  NOT NULL          
);

CREATE INDEX idx_photos_uploaded_at ON photos (uploaded_at DESC);  