package com.cardapio.controller.admin;

import com.cardapio.dto.PaginaResponse;
import com.cardapio.dto.usuario.AlterarEmailRequest;
import com.cardapio.dto.usuario.FiltroUsuario;
import com.cardapio.dto.usuario.UsuarioConviteResponse;
import com.cardapio.dto.usuario.UsuarioLojaRequest;
import com.cardapio.dto.usuario.UsuarioLojaResponse;
import com.cardapio.entity.StatusPerfilUsuario;
import com.cardapio.security.AppUserDetails;
import com.cardapio.service.UsuarioFotoService;
import com.cardapio.service.UsuarioLojaService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.CacheControl;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.time.Duration;
import java.util.UUID;

/** CRUD e busca dos usuarios da loja. O acesso ao tenant da URL e validado no SecurityConfig. */
@RestController
@RequestMapping("/api/admin/lojas/{tenant}/usuarios")
@RequiredArgsConstructor
public class AdminUsuarioController {

    private final UsuarioLojaService usuarioLojaService;
    private final UsuarioFotoService usuarioFotoService;

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

    @GetMapping("/{usuarioId}")
    public UsuarioLojaResponse obter(@PathVariable UUID tenant, @PathVariable Long usuarioId) {
        return usuarioLojaService.obter(tenant, usuarioId);
    }

    @PostMapping
    public ResponseEntity<UsuarioConviteResponse> criar(@PathVariable UUID tenant,
                                                        @Valid @RequestBody UsuarioLojaRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(usuarioLojaService.criar(tenant, request));
    }

    @PutMapping("/{usuarioId}")
    public UsuarioLojaResponse atualizar(@PathVariable UUID tenant, @PathVariable Long usuarioId,
                                         @Valid @RequestBody UsuarioLojaRequest request) {
        return usuarioLojaService.atualizar(tenant, usuarioId, request);
    }

    @DeleteMapping("/{usuarioId}")
    public ResponseEntity<Void> excluir(@PathVariable UUID tenant, @PathVariable Long usuarioId,
                                        @AuthenticationPrincipal AppUserDetails logado) {
        usuarioLojaService.excluir(tenant, usuarioId, logado.getUsuarioId());
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/{usuarioId}/email")
    public UsuarioLojaResponse alterarEmail(@PathVariable UUID tenant, @PathVariable Long usuarioId,
                                            @Valid @RequestBody AlterarEmailRequest request) {
        return usuarioLojaService.alterarEmail(tenant, usuarioId, request.email());
    }

    @PostMapping("/{usuarioId}/novo-link")
    public UsuarioConviteResponse gerarNovoLink(@PathVariable UUID tenant, @PathVariable Long usuarioId) {
        return usuarioLojaService.gerarNovoLink(tenant, usuarioId);
    }

    @GetMapping("/{usuarioId}/foto")
    public ResponseEntity<byte[]> obterFoto(@PathVariable UUID tenant, @PathVariable Long usuarioId) {
        var foto = usuarioFotoService.obter(tenant, usuarioId);
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(foto.tipoConteudo()))
                .cacheControl(CacheControl.maxAge(Duration.ofSeconds(30)).cachePrivate())
                .body(foto.conteudo());
    }

    @PutMapping(path = "/{usuarioId}/foto", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<Void> salvarFoto(@PathVariable UUID tenant, @PathVariable Long usuarioId,
                                           @RequestParam("arquivo") MultipartFile arquivo) {
        usuarioFotoService.salvar(tenant, usuarioId, arquivo);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/{usuarioId}/foto")
    public ResponseEntity<Void> removerFoto(@PathVariable UUID tenant, @PathVariable Long usuarioId) {
        usuarioFotoService.remover(tenant, usuarioId);
        return ResponseEntity.noContent().build();
    }
}
