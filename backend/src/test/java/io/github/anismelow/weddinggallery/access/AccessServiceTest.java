package io.github.anismelow.weddinggallery.access;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

class AccessServiceTest {

    private static final String CODE = "1234567890abcdef1234";

    private AccessService accessService;

    @BeforeEach
    void setUp() {
        accessService = new AccessService(CODE);
    }

    @Test
    void isValid_devuelveTrueConElCodigoCorrecto() {
        // Arrange: hecho en setUp
        // Act
        boolean result = accessService.isValid(CODE);
        // Assert
        assertThat(result).isTrue();
    }

    @Test 
    void isValid_devuelveFalseSiEsNull(){
        boolean result = accessService.isValid(null);

        assertThat(result).isFalse();
    }

    @Test
    void isValid_devuelveFalseSiSoloHayEspacios(){
        boolean result = accessService.isValid(" ");

        assertThat(result).isFalse();
    }

    @Test
    void constructor_fallaSiElCodigoEsCorto(){

        assertThatThrownBy(()-> new AccessService("corto"))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("16");
    }

    

}