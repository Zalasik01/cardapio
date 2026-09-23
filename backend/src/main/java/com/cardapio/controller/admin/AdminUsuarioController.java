package com.cardapio.controller.admin;

import com.cardapio.dto.PaginaResponse;
import com.cardapio.dto.usuario.FiltroUsuario;
import com.cardapio.dto.usuario.UsuarioConviteResponse;
import com.cardapio.dto.usuario.UsuarioLojaRequest;
import com.cardapio.dto.usuario.UsuarioLojaResponse;
import com.cardapio.entity.StatusPerfilUsuario;
import com.cardapio.security.AppUserDetails;
import com.cardapio.service.UsuarioLojaService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

/** CRUD e busca dos usuarios da loja. O acesso ao tenant da URL e validado no SecurityConfig. */
@RestController
@RequestMapping("/api/admin/lojas/{tenant}/usuarios")
@RequiredArgsConstructor
public class AdminUsuarioController {

    private final UsuarioLojaService usuarioLojaService;

    @GetMapping
    public PaginaResponse<UsuarioLojaResponse> buscar(@PathVariable UUID tenant,
                                                      @RequestParam(required = false) String busca,
                                                      @RequestParam(required = false) String nome,
                                                      @RequestParam(required = false) String email,
                                                      @RequestParam(required = false) Boolean ativo,
                                                      @RequestParam(required = false) StatusPerfilUsuario status,
                                                      @RequestParam(defaultValue = "0") int page,
                                                      @RequestParam(defaultValue = "10") int size) {
        return usuarioLojaService.buscar(tenant, new FiltroUsuario(busca, nome, email, ativo, status), page, size);
    }

    @GetMapping("/{usuarioGuid}")
    public UsuarioLojaResponse obter(@PathVariable UUID tenant, @PathVariable UUID usuarioGuid) {
        return usuarioLojaService.obter(tenant, usuarioGuid);
    }

    @PostMapping
    public ResponseEntity<UsuarioConviteResponse> criar(@PathVariable UUID tenant,
                                                        @Valid @RequestBody UsuarioLojaRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(usuarioLojaService.criar(tenant, request));
    }

    @PutMapping("/{usuarioGuid}")
    public UsuarioLojaResponse atualizar(@PathVariable UUID tenant, @PathVariable UUID usuarioGuid,
                                         @Valid @RequestBody UsuarioLojaRequest request) {
        return usuarioLojaService.atualizar(tenant, usuarioGuid, request);
    }

    @DeleteMapping("/{usuarioGuid}")
    public ResponseEntity<Void> excluir(@PathVariable UUID tenant, @PathVariable UUID usuarioGuid,
                                        @AuthenticationPrincipal AppUserDetails logado) {
        usuarioLojaService.excluir(tenant, usuarioGuid, logado.getUsuarioId());
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{usuarioGuid}/novo-link")
    public UsuarioConviteResponse gerarNovoLink(@PathVariable UUID tenant, @PathVariable UUID usuarioGuid) {
        return usuarioLojaService.gerarNovoLink(tenant, usuarioGuid);
    }
}
