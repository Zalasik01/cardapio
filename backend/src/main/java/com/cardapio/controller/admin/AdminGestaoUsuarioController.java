package com.cardapio.controller.admin;

import com.cardapio.dto.PaginaResponse;
import com.cardapio.dto.gestao.FiltroUsuarioInterno;
import com.cardapio.dto.gestao.UsuarioInternoConviteResponse;
import com.cardapio.dto.gestao.UsuarioInternoRequest;
import com.cardapio.dto.gestao.UsuarioInternoResponse;
import com.cardapio.dto.usuario.AlterarAtivoRequest;
import com.cardapio.dto.usuario.AlterarEmailRequest;
import com.cardapio.dto.usuario.RedefinirSenhaRequest;
import com.cardapio.security.AppUserDetails;
import com.cardapio.service.GestaoUsuarioInternoService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

/** Gestão Interna: usuários internos da plataforma. Liberado só ao usuário administrador (SecurityConfig). */
@RestController
@RequestMapping("/api/admin/gestao/usuarios")
@RequiredArgsConstructor
public class AdminGestaoUsuarioController {

    private final GestaoUsuarioInternoService usuarioService;

    @GetMapping
    public PaginaResponse<UsuarioInternoResponse> buscar(@RequestParam(required = false) String busca,
                                                         @RequestParam(required = false) Boolean administrador,
                                                         @RequestParam(defaultValue = "false") boolean mostrarInativos,
                                                         @RequestParam(defaultValue = "0") int page,
                                                         @RequestParam(defaultValue = "10") int size) {
        return usuarioService.buscar(new FiltroUsuarioInterno(busca, administrador, mostrarInativos), page, size);
    }

    @GetMapping("/{id}")
    public UsuarioInternoResponse obter(@PathVariable Long id) {
        return usuarioService.obter(id);
    }

    @PostMapping
    public ResponseEntity<UsuarioInternoConviteResponse> criar(@Valid @RequestBody UsuarioInternoRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(usuarioService.criar(request));
    }

    @PutMapping("/{id}")
    public UsuarioInternoResponse atualizar(@PathVariable Long id, @Valid @RequestBody UsuarioInternoRequest request,
                                            @AuthenticationPrincipal AppUserDetails logado) {
        return usuarioService.atualizar(id, request, logado.getUsuarioId());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> excluir(@PathVariable Long id, @AuthenticationPrincipal AppUserDetails logado) {
        usuarioService.excluir(id, logado.getUsuarioId());
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/{id}/ativo")
    public UsuarioInternoResponse alterarAtivo(@PathVariable Long id, @RequestBody AlterarAtivoRequest request,
                                               @AuthenticationPrincipal AppUserDetails logado) {
        return usuarioService.alterarAtivo(id, request.ativo(), logado.getUsuarioId());
    }

    @PutMapping("/{id}/email")
    public UsuarioInternoResponse alterarEmail(@PathVariable Long id, @Valid @RequestBody AlterarEmailRequest request) {
        return usuarioService.alterarEmail(id, request.email());
    }

    @PutMapping("/{id}/senha")
    public UsuarioInternoResponse redefinirSenha(@PathVariable Long id, @Valid @RequestBody RedefinirSenhaRequest request,
                                                 @AuthenticationPrincipal AppUserDetails logado) {
        return usuarioService.redefinirSenha(id, request.senhaTemporaria(), logado.getUsuarioId());
    }

    @PostMapping("/{id}/novo-link")
    public UsuarioInternoConviteResponse gerarNovoLink(@PathVariable Long id) {
        return usuarioService.gerarNovoLink(id);
    }
}
