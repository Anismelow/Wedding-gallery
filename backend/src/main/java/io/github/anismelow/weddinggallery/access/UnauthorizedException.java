package io.github.anismelow.weddinggallery.access;

public class UnauthorizedException extends RuntimeException {

    public UnauthorizedException(String message){
        super(message);
    }
}
