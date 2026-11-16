package io.github.anismelow.weddinggallery.photo;

public class NotPhotoOwnerException extends RuntimeException {

    public NotPhotoOwnerException(String message){
        super(message);
    }

}
