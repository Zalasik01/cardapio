package com.cardapio.controller.admin;

import com.cardapio.dto.permissao.PermissaoDtos.CategoriaPermissoes;
import com.cardapio.dto.permissao.PermissaoDtos.CopiarPermissoesRequest;
import com.cardapio.dto.permissao.PermissaoDtos.MinhasPermissoes;
import com.cardapio.dto.permissao.PermissaoDtos.PermissoesDoUsuario;
import com.cardapio.dto.permissao.PermissaoDtos.SalvarPermissoesRequest;
import com.cardapio.security.AppUserDetails;
import com.cardapio.service.PermissaoService;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/** Catálogo de permissões, as de quem está logado e as de cada usuário da loja. */
@RestController
@RequiredArgsConstructor
public class AdminPermissaoController {

    private final PermissaoService permissaoService;

    @GetMapping("/api/admin/permissoes/catalogo")
    public List<CategoriaPermissoes> catalogo() {
        return permissaoService.catalogo();
    }

    @GetMapping("/api/admin/permissoes/minhas")
    public MinhasPermissoes minhas(@AuthenticationPrincipal AppUserDetails usuario) {
        return permissaoService.minhas(usuario);
    }

    @PreAuthorize("@perm.tem('USUARIOS_LEITURA')")
    @GetMapping("/api/admin/lojas/{tenant}/usuarios/{usuarioId}/permissoes")
    public PermissoesDoUsuario obter(@PathVariable UUID tenant, @PathVariable Long usuarioId) {
        return permissaoService.obterDoUsuario(tenant, usuarioId);
    }

    @PreAuthorize("hasAnyAuthority('ROLE_SISTEMA', 'ROLE_ADMINISTRADOR_LOJA')")
    @PostMapping("/api/admin/lojas/{tenant}/usuarios/{usuarioId}/permissoes/copiar")
    public PermissoesDoUsuario copiar(@PathVariable UUID tenant, @PathVariable Long usuarioId,
                                      @RequestBody CopiarPermissoesRequest request) {
        return permissaoService.copiar(tenant, request.origemId(), usuarioId);
    }

    /** Só o administrador da loja (ou o usuário do sistema) concede permissões: evita que alguém se promova. */
    @PreAuthorize("hasAnyAuthority('ROLE_SISTEMA', 'ROLE_ADMINISTRADOR_LOJA')")
    @PutMapping("/api/admin/lojas/{tenant}/usuarios/{usuarioId}/permissoes")
    public PermissoesDoUsuario salvar(@PathVariable UUID tenant, @PathVariable Long usuarioId,
                                      @RequestBody SalvarPermissoesRequest request) {
        return permissaoService.salvar(tenant, usuarioId, request.codigos());
    }
}
