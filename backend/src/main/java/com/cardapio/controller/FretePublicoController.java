package com.cardapio.controller;

import com.cardapio.dto.frete.CalculoFreteRequest;
import com.cardapio.dto.frete.CalculoFreteResponse;
import com.cardapio.service.FreteService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/publico/frete")
@RequiredArgsConstructor
public class FretePublicoController {

    private final FreteService freteService;

    @PostMapping("/calcular")
    public CalculoFreteResponse calcular(@Valid @RequestBody CalculoFreteRequest request) {
        return freteService.calcular(request);
    }
}
