package io.github.anismelow.weddinggallery.photo;

import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;  


public interface PhotoRepository extends JpaRepository <Photo, UUID> {



}
