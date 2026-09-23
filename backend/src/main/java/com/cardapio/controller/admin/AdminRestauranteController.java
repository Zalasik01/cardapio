package com.cardapio.controller.admin;

import com.cardapio.dto.restaurante.RestauranteRequest;
import com.cardapio.dto.restaurante.RestauranteResponse;
import com.cardapio.service.RestauranteService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin/restaurantes")
@RequiredArgsConstructor
public class AdminRestauranteController {

    private final RestauranteService restauranteService;

    @PostMapping
    @PreAuthorize("hasAuthority('ROLE_SUPER_ADMIN')")
    public ResponseEntity<RestauranteResponse> criar(@Valid @RequestBody RestauranteRequest request) {
        var restaurante = restauranteService.criar(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(RestauranteResponse.of(restaurante));
    }

    @GetMapping("/{id}")
    public RestauranteResponse buscarPorId(@PathVariable Long id) {
        return RestauranteResponse.of(restauranteService.buscarPorId(id));
    }

    @PutMapping("/{id}")
    public RestauranteResponse atualizar(@PathVariable Long id, @Valid @RequestBody RestauranteRequest request) {
        return RestauranteResponse.of(restauranteService.atualizar(id, request));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('ROLE_SUPER_ADMIN')")
    public ResponseEntity<Void> inativar(@PathVariable Long id) {
        restauranteService.inativar(id);
        return ResponseEntity.noContent().build();
    }
}
