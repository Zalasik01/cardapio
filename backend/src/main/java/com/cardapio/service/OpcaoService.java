package com.cardapio.service;

import com.cardapio.dto.PaginaResponse;
import com.cardapio.entity.I_ItemPedidoOpcao;
import com.cardapio.entity.T_GrupoOpcao;
import com.cardapio.entity.T_Opcao;
import com.cardapio.entity.T_Produto;
import com.cardapio.entity.T_ProdutoGrupo;
import com.cardapio.exception.RecursoNaoEncontradoException;
import com.cardapio.exception.RegraNegocioException;
import com.cardapio.repository.T_GrupoOpcaoRepository;
import com.cardapio.repository.T_ProdutoGrupoRepository;
import jakarta.persistence.criteria.Predicate;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.Collection;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Adicionais e variações. Um grupo (Tamanho, Adicionais, Ponto da carne...) tem opções com preço adicional e uma regra de
 * escolha (mínimo e máximo); o mesmo grupo pode ser ligado a vários produtos. No pedido, as escolhas são validadas aqui.
 */
@Service
@RequiredArgsConstructor
public class OpcaoService {

    private static final int TAMANHO_MAXIMO_PAGINA = 50;

    private final T_GrupoOpcaoRepository grupoRepository;
    private final T_ProdutoGrupoRepository produtoGrupoRepository;

    public record OpcaoDto(Long id, String nome, BigDecimal preco, Boolean disponivel) {
    }

    public record GrupoRequest(String nome, String descricao, Integer minimo, Integer maximo, Integer ordem, Boolean ativo, List<OpcaoDto> opcoes) {
    }

    public record GrupoResponse(Long id, String nome, String descricao, int minimo, int maximo, int ordem, boolean ativo,
                                List<OpcaoDto> opcoes, long produtos) {
    }

    /** O grupo como o cliente vê no cardápio. */
    public record GrupoPublico(Long id, String nome, String descricao, int minimo, int maximo, List<OpcaoPublica> opcoes) {
    }

    public record OpcaoPublica(Long id, String nome, BigDecimal preco, boolean disponivel) {
    }

    public record Resolvido(List<I_ItemPedidoOpcao> opcoes, BigDecimal adicional) {
        public static Resolvido vazio() {
            return new Resolvido(List.of(), BigDecimal.ZERO);
        }
    }

    // ---------- cadastro ----------

    @Transactional(readOnly = true)
    public PaginaResponse<GrupoResponse> buscar(UUID tenant, String busca, boolean mostrarInativos, int pagina, int tamanho) {
        int limitado = Math.min(Math.max(tamanho, 1), TAMANHO_MAXIMO_PAGINA);
        var resultado = grupoRepository.findAll(especificacao(tenant, busca, mostrarInativos), PageRequest.of(Math.max(pagina, 0), limitado));
        return PaginaResponse.of(resultado, this::resposta);
    }

    @Transactional(readOnly = true)
    public GrupoResponse obter(UUID tenant, Long id) {
        return resposta(buscarGrupo(tenant, id));
    }

    /** Grupos ativos (id e nome) para o cadastro de produto escolher. */
    @Transactional(readOnly = true)
    public List<GrupoResponse> listarAtivos(UUID tenant) {
        return grupoRepository.findByTenantAndDeletadoFalseAndAtivoTrueOrderByNomeAsc(tenant).stream().map(this::resposta).toList();
    }

    @Transactional
    public GrupoResponse criar(UUID tenant, GrupoRequest r) {
        validarNome(tenant, r.nome(), null);
        T_GrupoOpcao grupo = T_GrupoOpcao.builder().tenant(tenant).build();
        preencher(grupo, r);
        return resposta(grupoRepository.save(grupo));
    }

    @Transactional
    public GrupoResponse atualizar(UUID tenant, Long id, GrupoRequest r) {
        T_GrupoOpcao grupo = buscarGrupo(tenant, id);
        validarNome(tenant, r.nome(), id);
        preencher(grupo, r);
        return resposta(grupoRepository.save(grupo));
    }

    @Transactional
    public void alterarAtivo(UUID tenant, Long id, boolean ativo) {
        T_GrupoOpcao g = buscarGrupo(tenant, id);
        g.setAtivo(ativo);
        grupoRepository.save(g);
    }

    /** Exclusão lógica: os pedidos já feitos guardam o nome e o preço das opções escolhidas. */
    @Transactional
    public void excluir(UUID tenant, Long id) {
        T_GrupoOpcao g = buscarGrupo(tenant, id);
        g.setDeletado(true);
        g.setAtivo(false);
        grupoRepository.save(g);
    }

    private T_GrupoOpcao buscarGrupo(UUID tenant, Long id) {
        return grupoRepository.findByIdAndTenantAndDeletadoFalse(id, tenant)
                .orElseThrow(() -> new RecursoNaoEncontradoException("Grupo de opções não encontrado"));
    }

    private void validarNome(UUID tenant, String nome, Long id) {
        if (nome == null || nome.isBlank()) {
            throw new RegraNegocioException("Informe o nome do grupo");
        }
        boolean emUso = id == null ? grupoRepository.existsByTenantAndNomeIgnoreCaseAndDeletadoFalse(tenant, nome.trim())
                : grupoRepository.existsByTenantAndNomeIgnoreCaseAndDeletadoFalseAndIdNot(tenant, nome.trim(), id);
        if (emUso) {
            throw new RegraNegocioException("Já existe um grupo com este nome");
        }
    }

    private void preencher(T_GrupoOpcao g, GrupoRequest r) {
        int minimo = r.minimo() == null ? 0 : r.minimo();
        int maximo = r.maximo() == null ? 1 : r.maximo();
        List<OpcaoDto> opcoes = r.opcoes() == null ? List.of() : r.opcoes().stream().filter(o -> o.nome() != null && !o.nome().isBlank()).toList();
        if (opcoes.isEmpty()) {
            throw new RegraNegocioException("Cadastre ao menos uma opção no grupo");
        }
        if (minimo < 0 || maximo < 1 || minimo > maximo) {
            throw new RegraNegocioException("A quantidade mínima não pode passar da máxima (e a máxima é de pelo menos 1)");
        }
        if (minimo > opcoes.size()) {
            throw new RegraNegocioException("O mínimo não pode ser maior que a quantidade de opções");
        }
        g.setNome(r.nome().trim());
        g.setDescricao(r.descricao() == null || r.descricao().isBlank() ? null : r.descricao().trim());
        g.setMinimo(minimo);
        g.setMaximo(Math.min(maximo, opcoes.size()));
        g.setOrdem(r.ordem() == null ? 0 : r.ordem());
        if (r.ativo() != null) {
            g.setAtivo(r.ativo());
        }
        // opções: as que têm id são atualizadas, as sem id são novas e as que sumiram da lista são removidas
        Map<Long, T_Opcao> atuais = new HashMap<>();
        g.getOpcoes().forEach(o -> atuais.put(o.getId(), o));
        List<T_Opcao> novas = new ArrayList<>();
        int ordem = 0;
        Set<String> nomes = new HashSet<>();
        for (OpcaoDto d : opcoes) {
            if (!nomes.add(d.nome().trim().toLowerCase(Locale.ROOT))) {
                throw new RegraNegocioException("Há opções repetidas: " + d.nome().trim());
            }
            if (d.preco() != null && d.preco().signum() < 0) {
                throw new RegraNegocioException("O preço adicional não pode ser negativo");
            }
            T_Opcao o = d.id() != null && atuais.containsKey(d.id()) ? atuais.get(d.id()) : T_Opcao.builder().tenant(g.getTenant()).grupo(g).build();
            o.setNome(d.nome().trim());
            o.setPreco(d.preco() == null ? BigDecimal.ZERO : d.preco().setScale(2, RoundingMode.HALF_UP));
            o.setDisponivel(d.disponivel() == null || d.disponivel());
            o.setOrdem(ordem++);
            novas.add(o);
        }
        g.getOpcoes().clear();
        g.getOpcoes().addAll(novas);
    }

    private GrupoResponse resposta(T_GrupoOpcao g) {
        return new GrupoResponse(g.getId(), g.getNome(), g.getDescricao(), g.getMinimo(), g.getMaximo(), g.getOrdem(), g.isAtivo(),
                g.getOpcoes().stream().filter(o -> !o.isDeletado()).map(o -> new OpcaoDto(o.getId(), o.getNome(), o.getPreco(), o.isDisponivel())).toList(),
                produtoGrupoRepository.countByGrupoId(g.getId()));
    }

    private Specification<T_GrupoOpcao> especificacao(UUID tenant, String busca, boolean mostrarInativos) {
        return (root, query, cb) -> {
            List<Predicate> filtros = new ArrayList<>();
            filtros.add(cb.equal(root.get("tenant"), tenant));
            filtros.add(cb.isFalse(root.get("deletado")));
            if (!mostrarInativos) {
                filtros.add(cb.isTrue(root.get("ativo")));
            }
            if (busca != null && !busca.isBlank()) {
                String padrao = "%" + busca.trim().toLowerCase(Locale.ROOT).replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_") + "%";
                filtros.add(cb.like(cb.lower(root.get("nome")), padrao, '\\'));
            }
            if (query.getResultType() != Long.class) {
                query.orderBy(cb.asc(root.get("ordem")), cb.asc(cb.lower(root.get("nome"))));
            }
            return cb.and(filtros.toArray(new Predicate[0]));
        };
    }

    // ---------- ligação com produtos ----------

    /** Substitui os grupos do produto pelos ids enviados (na ordem). */
    @Transactional
    public void definirGruposDoProduto(T_Produto produto, List<Long> grupoIds) {
        if (grupoIds == null) {
            return;
        }
        UUID tenant = produto.getTenant();
        List<T_GrupoOpcao> grupos = grupoRepository.findByIdInAndTenantAndDeletadoFalse(grupoIds, tenant);
        Map<Long, T_GrupoOpcao> porId = new HashMap<>();
        grupos.forEach(g -> porId.put(g.getId(), g));
        produtoGrupoRepository.deleteByProdutoId(produto.getId());
        produtoGrupoRepository.flush();
        int ordem = 0;
        for (Long id : grupoIds) {
            T_GrupoOpcao g = porId.get(id);
            if (g != null) {
                produtoGrupoRepository.save(T_ProdutoGrupo.builder().tenant(tenant).produto(produto).grupo(g).ordem(ordem++).build());
            }
        }
    }

    @Transactional(readOnly = true)
    public List<Long> idsDosGruposDoProduto(Long produtoId) {
        return produtoGrupoRepository.findByProdutoIdOrderByOrdemAscIdAsc(produtoId).stream().map(pg -> pg.getGrupo().getId()).toList();
    }

    /** Grupos ativos (com as opções) de cada produto, para o cardápio do cliente. */
    @Transactional(readOnly = true)
    public Map<Long, List<GrupoPublico>> publicosPorProduto(Collection<Long> produtoIds) {
        Map<Long, List<GrupoPublico>> mapa = new HashMap<>();
        if (produtoIds.isEmpty()) {
            return mapa;
        }
        for (T_ProdutoGrupo pg : produtoGrupoRepository.findByProdutoIdInOrderByOrdemAscIdAsc(produtoIds)) {
            T_GrupoOpcao g = pg.getGrupo();
            if (g.isDeletado() || !g.isAtivo()) {
                continue;
            }
            mapa.computeIfAbsent(pg.getProduto().getId(), k -> new ArrayList<>()).add(publico(g));
        }
        return mapa;
    }

    private GrupoPublico publico(T_GrupoOpcao g) {
        return new GrupoPublico(g.getId(), g.getNome(), g.getDescricao(), g.getMinimo(), g.getMaximo(),
                g.getOpcoes().stream().filter(o -> !o.isDeletado() && o.isAtivo())
                        .map(o -> new OpcaoPublica(o.getId(), o.getNome(), o.getPreco(), o.isDisponivel())).toList());
    }

    // ---------- pedido ----------

    /**
     * Confere as opções escolhidas para um produto (elas precisam ser dos grupos dele, estar disponíveis e respeitar o mínimo
     * e o máximo de cada grupo) e devolve as linhas a gravar e o valor que somam ao preço do item.
     */
    @Transactional(readOnly = true)
    public Resolvido resolver(T_Produto produto, List<Long> escolhidas) {
        List<T_ProdutoGrupo> ligacoes = produtoGrupoRepository.findByProdutoIdOrderByOrdemAscIdAsc(produto.getId());
        List<T_GrupoOpcao> grupos = ligacoes.stream().map(T_ProdutoGrupo::getGrupo).filter(g -> !g.isDeletado() && g.isAtivo()).toList();
        Set<Long> ids = new HashSet<>(escolhidas == null ? List.of() : escolhidas);
        if (grupos.isEmpty()) {
            if (!ids.isEmpty()) {
                throw new RegraNegocioException("Este produto não tem opções: " + produto.getNome());
            }
            return Resolvido.vazio();
        }
        List<I_ItemPedidoOpcao> linhas = new ArrayList<>();
        BigDecimal adicional = BigDecimal.ZERO;
        Set<Long> usadas = new HashSet<>();
        for (T_GrupoOpcao g : grupos) {
            List<T_Opcao> escolhidasDoGrupo = g.getOpcoes().stream().filter(o -> ids.contains(o.getId())).toList();
            if (escolhidasDoGrupo.size() < g.getMinimo()) {
                throw new RegraNegocioException("Escolha " + (g.getMinimo() == 1 ? "uma opção" : "pelo menos " + g.getMinimo() + " opções")
                        + " em \"" + g.getNome() + "\" (" + produto.getNome() + ")");
            }
            if (escolhidasDoGrupo.size() > g.getMaximo()) {
                throw new RegraNegocioException("\"" + g.getNome() + "\" aceita no máximo " + g.getMaximo() + " opção(ões)");
            }
            for (T_Opcao o : escolhidasDoGrupo) {
                if (o.isDeletado() || !o.isAtivo() || !o.isDisponivel()) {
                    throw new RegraNegocioException("Opção indisponível: " + o.getNome());
                }
                usadas.add(o.getId());
                adicional = adicional.add(o.getPreco());
                linhas.add(I_ItemPedidoOpcao.builder().tenant(produto.getTenant()).idOpcao(o.getId()).nomeGrupo(g.getNome())
                        .nomeOpcao(o.getNome()).preco(o.getPreco()).build());
            }
        }
        if (!usadas.containsAll(ids)) {
            throw new RegraNegocioException("Há opções que não pertencem a este produto: " + produto.getNome());
        }
        return new Resolvido(linhas, adicional);
    }
}
