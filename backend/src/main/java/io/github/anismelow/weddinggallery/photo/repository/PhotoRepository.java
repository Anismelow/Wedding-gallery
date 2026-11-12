package io.github.anismelow.weddinggallery.photo.repository;

import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import io.github.anismelow.weddinggallery.photo.model.Photo;



public interface PhotoRepository extends JpaRepository <Photo, UUID> {

}
