package com.cardapio.controller.admin;

import com.cardapio.service.EstoqueService;
import com.cardapio.service.EstoqueService.ConfigRequest;
import com.cardapio.service.EstoqueService.IngredienteEstoque;
import com.cardapio.service.EstoqueService.LancamentoRequest;
import com.cardapio.service.EstoqueService.MovimentoResponse;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

/** Estoque de ingredientes. O acesso ao tenant da URL é validado no SecurityConfig. */
@RestController
@RequestMapping("/api/admin/lojas/{tenant}/estoque")
@RequiredArgsConstructor
public class AdminEstoqueController {

    private final EstoqueService service;

    @PreAuthorize("@perm.tem('ESTOQUE_LEITURA')")
    @GetMapping
    public List<IngredienteEstoque> listar(@PathVariable UUID tenant) {
        return service.listar(tenant);
    }

    @PreAuthorize("@perm.tem('ESTOQUE_LEITURA')")
    @GetMapping("/abaixo-do-minimo")
    public Map<String, Long> abaixoDoMinimo(@PathVariable UUID tenant) {
        return Map.of("quantidade", service.contarAbaixoDoMinimo(tenant));
    }

    @PreAuthorize("@perm.tem('ESTOQUE_LEITURA')")
    @GetMapping("/{id}/movimentos")
    public List<MovimentoResponse> historico(@PathVariable UUID tenant, @PathVariable Long id) {
        return service.historico(tenant, id);
    }

    @PreAuthorize("@perm.tem('ESTOQUE_ALTERAR')")
    @PutMapping("/{id}/config")
    public IngredienteEstoque configurar(@PathVariable UUID tenant, @PathVariable Long id, @RequestBody ConfigRequest request) {
        return service.configurar(tenant, id, request);
    }

    @PreAuthorize("@perm.tem('ESTOQUE_ESCRITA')")
    @PostMapping("/{id}/movimentos")
    public IngredienteEstoque lancar(@PathVariable UUID tenant, @PathVariable Long id, @RequestBody LancamentoRequest request) {
        return service.lancar(tenant, id, request);
    }
}
