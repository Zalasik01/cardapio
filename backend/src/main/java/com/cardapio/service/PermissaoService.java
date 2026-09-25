package com.cardapio.service;

import com.cardapio.dto.permissao.PermissaoDtos.CategoriaPermissoes;
import com.cardapio.dto.permissao.PermissaoDtos.MinhasPermissoes;
import com.cardapio.dto.permissao.PermissaoDtos.PaginaPermissoes;
import com.cardapio.dto.permissao.PermissaoDtos.PermissaoItem;
import com.cardapio.dto.permissao.PermissaoDtos.PermissoesDoUsuario;
import com.cardapio.entity.S_Permissao;
import com.cardapio.entity.T_PerfilUsuario;
import com.cardapio.entity.T_PermissaoUsuario;
import com.cardapio.entity.TipoPermissao;
import com.cardapio.exception.RecursoNaoEncontradoException;
import com.cardapio.repository.S_PermissaoRepository;
import com.cardapio.repository.T_PerfilUsuarioRepository;
import com.cardapio.repository.T_PermissaoUsuarioRepository;
import com.cardapio.security.AppUserDetails;
import com.cardapio.security.Permissoes;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Permissões por tela. O catálogo (s_permissao) é organizado em árvore: categoria do menu, tela e as
 * permissões da tela. Escrita inclui todas as ações da tela e qualquer permissão da tela inclui a leitura.
 */
@Service
@RequiredArgsConstructor
public class PermissaoService {

    private final S_PermissaoRepository permissaoRepository;
    private final T_PermissaoUsuarioRepository permissaoUsuarioRepository;
    private final T_PerfilUsuarioRepository perfilUsuarioRepository;

    @Transactional(readOnly = true)
    public List<CategoriaPermissoes> catalogo() {
        Map<Long, CategoriaEmMontagem> categorias = new LinkedHashMap<>();
        Map<Long, PaginaEmMontagem> paginas = new LinkedHashMap<>();
        for (S_Permissao permissao : permissaoRepository.listarCatalogo()) {
            var pagina = permissao.getPagina();
            var categoria = categorias.computeIfAbsent(pagina.getCategoriaMenu().getId(),
                    id -> new CategoriaEmMontagem(pagina.getCategoriaMenu().getNome(), pagina.getCategoriaMenu().getIcone()));
            var emMontagem = paginas.computeIfAbsent(pagina.getId(), id -> {
                var nova = new PaginaEmMontagem(pagina.getNome(), pagina.getRota());
                categoria.paginas.add(nova);
                return nova;
            });
            emMontagem.permissoes.add(new PermissaoItem(permissao.getCodigo(), permissao.getNome(), permissao.getTipo().name()));
        }
        return categorias.values().stream()
                .map(c -> new CategoriaPermissoes(c.nome, c.icone,
                        c.paginas.stream().map(p -> new PaginaPermissoes(p.nome, p.rota, p.permissoes)).toList()))
                .toList();
    }

    @Transactional(readOnly = true)
    public PermissoesDoUsuario obterDoUsuario(UUID tenant, Long usuarioId) {
        T_PerfilUsuario vinculo = buscarVinculo(tenant, usuarioId);
        if (vinculo.isAdministrador()) {
            return new PermissoesDoUsuario(true, Set.of());
        }
        return new PermissoesDoUsuario(false, new HashSet<>(permissaoUsuarioRepository.codigosDoUsuario(usuarioId, tenant)));
    }

    @Transactional
    public PermissoesDoUsuario salvar(UUID tenant, Long usuarioId, Set<String> codigos) {
        T_PerfilUsuario vinculo = buscarVinculo(tenant, usuarioId);
        if (vinculo.isAdministrador()) {
            return new PermissoesDoUsuario(true, Set.of());
        }
        List<S_Permissao> catalogo = permissaoRepository.listarCatalogo();
        Set<String> normalizados = normalizar(catalogo, codigos == null ? Set.of() : codigos);

        permissaoUsuarioRepository.removerDoPerfilUsuario(vinculo.getId());
        permissaoUsuarioRepository.flush();
        List<T_PermissaoUsuario> novas = catalogo.stream()
                .filter(p -> normalizados.contains(p.getCodigo()))
                .map(p -> {
                    T_PermissaoUsuario concedida = new T_PermissaoUsuario();
                    concedida.setPerfilUsuario(vinculo);
                    concedida.setPermissao(p);
                    concedida.setTenant(tenant);
                    return concedida;
                })
                .toList();
        permissaoUsuarioRepository.saveAll(novas);
        return new PermissoesDoUsuario(false, normalizados);
    }

    /** Descarta códigos desconhecidos, expande ESCRITA para todas as ações da tela e liga a leitura de quem tem algo. */
    private Set<String> normalizar(List<S_Permissao> catalogo, Set<String> pedidos) {
        Map<Long, List<S_Permissao>> porPagina = new LinkedHashMap<>();
        catalogo.forEach(p -> porPagina.computeIfAbsent(p.getPagina().getId(), id -> new ArrayList<>()).add(p));

        Set<String> resultado = new HashSet<>();
        for (List<S_Permissao> daPagina : porPagina.values()) {
            Set<String> escolhidas = new HashSet<>();
            daPagina.stream().filter(p -> pedidos.contains(p.getCodigo())).forEach(p -> escolhidas.add(p.getCodigo()));
            if (escolhidas.isEmpty()) {
                continue;
            }
            boolean escrita = daPagina.stream().anyMatch(p -> p.getTipo() == TipoPermissao.ESCRITA && escolhidas.contains(p.getCodigo()));
            for (S_Permissao p : daPagina) {
                if (p.getTipo() == TipoPermissao.LEITURA || (escrita && p.getTipo() != TipoPermissao.LEITURA)) {
                    escolhidas.add(p.getCodigo());
                }
            }
            resultado.addAll(escolhidas);
        }
        return resultado;
    }

    public MinhasPermissoes minhas(AppUserDetails usuario) {
        boolean total = usuario.getAuthorities().stream().anyMatch(a ->
                a.getAuthority().equals(Permissoes.PAPEL_SISTEMA) || a.getAuthority().equals(Permissoes.PAPEL_ADMINISTRADOR_LOJA));
        return new MinhasPermissoes(total, total ? Set.of() : usuario.getPermissoes());
    }

    private T_PerfilUsuario buscarVinculo(UUID tenant, Long usuarioId) {
        return perfilUsuarioRepository.findByUsuarioIdAndTenantAndDeletadoFalse(usuarioId, tenant)
                .orElseThrow(() -> new RecursoNaoEncontradoException("Usuário não encontrado"));
    }

    private static final class CategoriaEmMontagem {
        final String nome;
        final String icone;
        final List<PaginaEmMontagem> paginas = new ArrayList<>();

        CategoriaEmMontagem(String nome, String icone) {
            this.nome = nome;
            this.icone = icone;
        }
    }

    private static final class PaginaEmMontagem {
        final String nome;
        final String rota;
        final List<PermissaoItem> permissoes = new ArrayList<>();

        PaginaEmMontagem(String nome, String rota) {
            this.nome = nome;
            this.rota = rota;
        }
    }
}
