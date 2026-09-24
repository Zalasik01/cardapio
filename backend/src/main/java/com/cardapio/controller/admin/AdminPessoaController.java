package com.cardapio.controller.admin;

import com.cardapio.dto.PaginaResponse;
import com.cardapio.dto.pessoa.FiltroPessoa;
import com.cardapio.dto.pessoa.PessoaExistenteResponse;
import com.cardapio.dto.pessoa.PessoaRequest;
import com.cardapio.dto.pessoa.PessoaResponse;
import com.cardapio.dto.pessoa.PessoaResumoResponse;
import com.cardapio.entity.TipoPessoa;
import com.cardapio.service.PessoaService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

/** CRUD e busca de clientes e fornecedores da loja. O acesso ao tenant da URL e validado no SecurityConfig. */
@RestController
@RequestMapping("/api/admin/lojas/{tenant}/pessoas")
@RequiredArgsConstructor
public class AdminPessoaController {

    private final PessoaService pessoaService;

    @GetMapping
    public PaginaResponse<PessoaResumoResponse> buscar(@PathVariable UUID tenant,
                                                       @RequestParam(required = false) String busca,
                                                       @RequestParam(required = false) String nome,
                                                       @RequestParam(required = false) String documento,
                                                       @RequestParam(required = false) TipoPessoa tipo,
                                                       @RequestParam(required = false) String papel,
                                                       @RequestParam(defaultValue = "false") boolean mostrarInativos,
                                                       @RequestParam(defaultValue = "0") int page,
                                                       @RequestParam(defaultValue = "10") int size) {
        return pessoaService.buscar(tenant, new FiltroPessoa(busca, nome, documento, tipo, papel, mostrarInativos), page, size);
    }

    /** 200 com a pessoa que ja usa o CPF na loja (funcionario, cliente ou fornecedor) ou 204 se nao existe. */
    @GetMapping("/por-cpf/{cpf}")
    public ResponseEntity<PessoaExistenteResponse> consultarPorCpf(@PathVariable UUID tenant, @PathVariable String cpf) {
        return pessoaService.consultarPorCpf(tenant, cpf)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.noContent().build());
    }

    @GetMapping("/{id}")
    public PessoaResponse obter(@PathVariable UUID tenant, @PathVariable Long id) {
        return pessoaService.obter(tenant, id);
    }

    @PostMapping
    public ResponseEntity<PessoaResponse> criar(@PathVariable UUID tenant, @Valid @RequestBody PessoaRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(pessoaService.criar(tenant, request));
    }

    @PutMapping("/{id}")
    public PessoaResponse atualizar(@PathVariable UUID tenant, @PathVariable Long id,
                                    @Valid @RequestBody PessoaRequest request) {
        return pessoaService.atualizar(tenant, id, request);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> excluir(@PathVariable UUID tenant, @PathVariable Long id) {
        pessoaService.excluir(tenant, id);
        return ResponseEntity.noContent().build();
    }
}
