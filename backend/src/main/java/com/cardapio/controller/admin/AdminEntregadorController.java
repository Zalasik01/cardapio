package com.cardapio.controller.admin;

import com.cardapio.dto.PaginaResponse;
import com.cardapio.dto.entregador.EntregaDtos.EntregasEmRota;
import com.cardapio.dto.entregador.EntregaDtos.Repasse;
import com.cardapio.dto.entregador.EntregadorRequest;
import com.cardapio.dto.entregador.EntregadorResponse;
import com.cardapio.dto.usuario.AlterarAtivoRequest;
import com.cardapio.service.EntregaAdminService;
import com.cardapio.service.EntregadorService;
import jakarta.validation.Valid;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/** Cadastro de entregadores e visões de entrega (em rota e repasse). O tenant da URL é validado no SecurityConfig. */
@RestController
@RequestMapping("/api/admin/lojas/{tenant}")
@RequiredArgsConstructor
public class AdminEntregadorController {

    private final EntregadorService entregadorService;
    private final EntregaAdminService entregaService;

    @PreAuthorize("@perm.tem('ENTREGADORES_LEITURA')")
    @GetMapping("/entregadores")
    public PaginaResponse<EntregadorResponse> buscar(@PathVariable UUID tenant, @RequestParam(required = false) String busca,
                                                     @RequestParam(defaultValue = "false") boolean mostrarInativos,
                                                     @RequestParam(defaultValue = "0") int page,
                                                     @RequestParam(defaultValue = "10") int size) {
        return entregadorService.buscar(tenant, busca, mostrarInativos, page, size);
    }

    /** Entregadores ativos, para escolher quem entrega um pedido (sem exigir acesso ao cadastro). */
    @PreAuthorize("@perm.tem('ENTREGADORES_LEITURA', 'PEDIDOS_ALTERAR_STATUS', 'PAINEL_PEDIDOS_ALTERAR_STATUS')")
    @GetMapping("/entregadores/ativos")
    public List<EntregadorResponse> ativos(@PathVariable UUID tenant) {
        // quem só atribui entrega não precisa do link secreto de cada entregador
        return entregadorService.listarAtivos(tenant).stream()
                .map(e -> new EntregadorResponse(e.id(), e.nome(), e.telefone(), e.tipo(), e.veiculo(), e.repassePorEntrega(), e.ativo(),
                        null, e.posicaoEm())).toList();
    }

    @PreAuthorize("@perm.tem('ENTREGADORES_LEITURA')")
    @GetMapping("/entregadores/{id}")
    public EntregadorResponse obter(@PathVariable UUID tenant, @PathVariable Long id) {
        return entregadorService.obter(tenant, id);
    }

    @PreAuthorize("@perm.tem('ENTREGADORES_INCLUIR')")
    @PostMapping("/entregadores")
    public ResponseEntity<EntregadorResponse> criar(@PathVariable UUID tenant, @Valid @RequestBody EntregadorRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(entregadorService.criar(tenant, request));
    }

    @PreAuthorize("@perm.tem('ENTREGADORES_ALTERAR')")
    @PutMapping("/entregadores/{id}")
    public EntregadorResponse atualizar(@PathVariable UUID tenant, @PathVariable Long id, @Valid @RequestBody EntregadorRequest request) {
        return entregadorService.atualizar(tenant, id, request);
    }

    @PreAuthorize("@perm.tem('ENTREGADORES_INATIVAR')")
    @PutMapping("/entregadores/{id}/ativo")
    public ResponseEntity<Void> alterarAtivo(@PathVariable UUID tenant, @PathVariable Long id, @RequestBody AlterarAtivoRequest request) {
        entregadorService.alterarAtivo(tenant, id, request.ativo());
        return ResponseEntity.noContent().build();
    }

    @PreAuthorize("@perm.tem('ENTREGADORES_ALTERAR')")
    @PostMapping("/entregadores/{id}/novo-link")
    public EntregadorResponse novoLink(@PathVariable UUID tenant, @PathVariable Long id) {
        return entregadorService.gerarNovoLink(tenant, id);
    }

    @PreAuthorize("@perm.tem('ENTREGADORES_EXCLUIR')")
    @DeleteMapping("/entregadores/{id}")
    public ResponseEntity<Void> excluir(@PathVariable UUID tenant, @PathVariable Long id) {
        entregadorService.excluir(tenant, id);
        return ResponseEntity.noContent().build();
    }

    /** Pedidos de entrega em andamento por entregador. */
    @PreAuthorize("@perm.tem('ENTREGAS_LEITURA')")
    @GetMapping("/entregas/em-rota")
    public EntregasEmRota emRota(@PathVariable UUID tenant) {
        return entregaService.emRota(tenant);
    }

    /** Entregas concluídas e repasse por entregador (período de no máximo 90 dias). */
    @PreAuthorize("@perm.tem('ENTREGAS_LEITURA')")
    @GetMapping("/entregas/repasse")
    public Repasse repasse(@PathVariable UUID tenant,
                           @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate inicio,
                           @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fim) {
        return entregaService.repasse(tenant, inicio, fim);
    }
}
