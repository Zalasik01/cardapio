package com.cardapio.controller.admin;

import com.cardapio.dto.PaginaResponse;
import com.cardapio.dto.gestao.FiltroLojaGestao;
import com.cardapio.dto.gestao.LojaGestaoRequest;
import com.cardapio.dto.gestao.LojaGestaoResponse;
import com.cardapio.dto.gestao.LojaGestaoResumoResponse;
import com.cardapio.entity.SituacaoConta;
import com.cardapio.entity.TipoOrganizacao;
import com.cardapio.service.GestaoLojaService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/** Gestão Interna: CRUD e busca das lojas da plataforma. Liberado só ao usuário administrador (SecurityConfig). */
@RestController
@RequestMapping("/api/admin/gestao/lojas")
@RequiredArgsConstructor
public class AdminGestaoLojaController {

    private final GestaoLojaService gestaoLojaService;

    @GetMapping
    public PaginaResponse<LojaGestaoResumoResponse> buscar(@RequestParam(required = false) String busca,
                                                           @RequestParam(required = false) SituacaoConta situacaoConta,
                                                           @RequestParam(required = false) TipoOrganizacao tipoOrganizacao,
                                                           @RequestParam(defaultValue = "false") boolean mostrarInativos,
                                                           @RequestParam(defaultValue = "0") int page,
                                                           @RequestParam(defaultValue = "10") int size) {
        return gestaoLojaService.buscar(new FiltroLojaGestao(busca, situacaoConta, tipoOrganizacao, mostrarInativos), page, size);
    }

    @GetMapping("/{id}")
    public LojaGestaoResponse obter(@PathVariable Long id) {
        return gestaoLojaService.obter(id);
    }

    @PostMapping
    public ResponseEntity<LojaGestaoResponse> criar(@Valid @RequestBody LojaGestaoRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(gestaoLojaService.criar(request));
    }

    @PutMapping("/{id}")
    public LojaGestaoResponse atualizar(@PathVariable Long id, @Valid @RequestBody LojaGestaoRequest request) {
        return gestaoLojaService.atualizar(id, request);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> excluir(@PathVariable Long id) {
        gestaoLojaService.excluir(id);
        return ResponseEntity.noContent().build();
    }
}
