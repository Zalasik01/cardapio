package com.cardapio.controller.admin;

import com.cardapio.dto.PaginaResponse;
import com.cardapio.dto.funcionario.FiltroFuncionario;
import com.cardapio.dto.funcionario.FuncionarioRequest;
import com.cardapio.dto.funcionario.FuncionarioResponse;
import com.cardapio.dto.funcionario.FuncionarioResumoResponse;
import com.cardapio.service.FuncionarioService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

/** CRUD e busca dos funcionarios da loja. O acesso ao tenant da URL e validado no SecurityConfig. */
@RestController
@RequestMapping("/api/admin/lojas/{tenant}/funcionarios")
@RequiredArgsConstructor
public class AdminFuncionarioController {

    private final FuncionarioService funcionarioService;

    @GetMapping
    public PaginaResponse<FuncionarioResumoResponse> buscar(@PathVariable UUID tenant,
                                                            @RequestParam(required = false) String busca,
                                                            @RequestParam(required = false) String nome,
                                                            @RequestParam(required = false) String cpf,
                                                            @RequestParam(required = false) Boolean ativo,
                                                            @RequestParam(defaultValue = "0") int page,
                                                            @RequestParam(defaultValue = "10") int size) {
        return funcionarioService.buscar(tenant, new FiltroFuncionario(busca, nome, cpf, ativo), page, size);
    }

    @GetMapping("/{guid}")
    public FuncionarioResponse obter(@PathVariable UUID tenant, @PathVariable UUID guid) {
        return funcionarioService.obter(tenant, guid);
    }

    @PostMapping
    public ResponseEntity<FuncionarioResponse> criar(@PathVariable UUID tenant,
                                                     @Valid @RequestBody FuncionarioRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(funcionarioService.criar(tenant, request));
    }

    @PutMapping("/{guid}")
    public FuncionarioResponse atualizar(@PathVariable UUID tenant, @PathVariable UUID guid,
                                         @Valid @RequestBody FuncionarioRequest request) {
        return funcionarioService.atualizar(tenant, guid, request);
    }

    @DeleteMapping("/{guid}")
    public ResponseEntity<Void> excluir(@PathVariable UUID tenant, @PathVariable UUID guid) {
        funcionarioService.excluir(tenant, guid);
        return ResponseEntity.noContent().build();
    }
}
