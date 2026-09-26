package com.cardapio.service;

import com.cardapio.dto.PaginaResponse;
import com.cardapio.dto.categoria.CategoriaCadastroRequest;
import com.cardapio.dto.categoria.CategoriaCadastroResponse;
import com.cardapio.entity.T_Categoria;
import com.cardapio.exception.RecursoNaoEncontradoException;
import com.cardapio.exception.RegraNegocioException;
import com.cardapio.repository.T_CategoriaRepository;
import com.cardapio.repository.T_ProdutoRepository;
import jakarta.persistence.criteria.Predicate;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;

/** CRUD das categorias do cardápio da loja. */
@Service
@RequiredArgsConstructor
public class CategoriaCadastroService {

    private static final int TAMANHO_MAXIMO_PAGINA = 50;

    private final T_CategoriaRepository categoriaRepository;
    private final T_ProdutoRepository produtoRepository;

    @Transactional(readOnly = true)
    public PaginaResponse<CategoriaCadastroResponse> buscar(UUID tenant, String busca, boolean mostrarInativos, int pagina, int tamanho) {
        int tamanhoLimitado = Math.min(Math.max(tamanho, 1), TAMANHO_MAXIMO_PAGINA);
        var resultado = categoriaRepository.findAll(especificacao(tenant, busca, mostrarInativos),
                PageRequest.of(Math.max(pagina, 0), tamanhoLimitado));

        // quantidade de produtos de cada categoria da página, numa consulta só
        Map<Long, Long> produtos = new HashMap<>();
        List<Long> ids = resultado.getContent().stream().map(T_Categoria::getId).toList();
        if (!ids.isEmpty()) {
            produtoRepository.contarPorCategoria(ids).forEach(linha -> produtos.put((Long) linha[0], (Long) linha[1]));
        }
        return PaginaResponse.of(resultado, c -> CategoriaCadastroResponse.of(c, produtos.getOrDefault(c.getId(), 0L)));
    }

    @Transactional(readOnly = true)
    public int proximaOrdem(UUID tenant) {
        return categoriaRepository.proximaOrdem(tenant);
    }

    @Transactional(readOnly = true)
    public CategoriaCadastroResponse obter(UUID tenant, Long id) {
        T_Categoria categoria = buscarCategoria(tenant, id);
        return CategoriaCadastroResponse.of(categoria, produtoRepository.countByCategoriaIdAndDeletadoFalse(id));
    }

    @Transactional
    public CategoriaCadastroResponse criar(UUID tenant, CategoriaCadastroRequest request) {
        validarNomeLivre(tenant, request.nome(), null);
        T_Categoria categoria = T_Categoria.builder().tenant(tenant).build();
        preencher(categoria, request);
        categoria = categoriaRepository.save(categoria);
        return CategoriaCadastroResponse.of(categoria, 0);
    }

    @Transactional
    public CategoriaCadastroResponse atualizar(UUID tenant, Long id, CategoriaCadastroRequest request) {
        T_Categoria categoria = buscarCategoria(tenant, id);
        validarNomeLivre(tenant, request.nome(), id);
        preencher(categoria, request);
        categoriaRepository.save(categoria);
        return CategoriaCadastroResponse.of(categoria, produtoRepository.countByCategoriaIdAndDeletadoFalse(id));
    }

    @Transactional
    public void alterarAtivo(UUID tenant, Long id, boolean ativo) {
        T_Categoria categoria = buscarCategoria(tenant, id);
        categoria.setAtivo(ativo);
        categoriaRepository.save(categoria);
    }

    /**
     * Uma categoria com produtos vinculados não pode ser excluída. Sem produtos, é excluída de vez; só fica
     * marcada como excluída se produtos antigos (já vendidos e excluídos) ainda apontam para ela.
     */
    @Transactional
    public void excluir(UUID tenant, Long id) {
        T_Categoria categoria = buscarCategoria(tenant, id);
        long ativos = produtoRepository.countByCategoriaIdAndDeletadoFalse(id);
        if (ativos > 0) {
            throw new RegraNegocioException("Esta categoria possui " + ativos
                    + " produto(s) vinculado(s). Mude a categoria deles ou exclua-os antes de excluir a categoria.");
        }
        if (produtoRepository.countByCategoriaId(id) > 0) {
            categoria.setDeletado(true);
            categoria.setAtivo(false);
            categoriaRepository.save(categoria);
        } else {
            categoriaRepository.delete(categoria);
        }
    }

    private T_Categoria buscarCategoria(UUID tenant, Long id) {
        return categoriaRepository.findByIdAndTenantAndDeletadoFalse(id, tenant)
                .orElseThrow(() -> new RecursoNaoEncontradoException("Categoria não encontrada"));
    }

    private void validarNomeLivre(UUID tenant, String nome, Long id) {
        boolean emUso = id == null
                ? categoriaRepository.existsByTenantAndNomeIgnoreCaseAndDeletadoFalse(tenant, nome.trim())
                : categoriaRepository.existsByTenantAndNomeIgnoreCaseAndDeletadoFalseAndIdNot(tenant, nome.trim(), id);
        if (emUso) {
            throw new RegraNegocioException("Já existe uma categoria com este nome");
        }
    }

    private void preencher(T_Categoria categoria, CategoriaCadastroRequest r) {
        categoria.setNome(r.nome().trim());
        categoria.setTempoPreparoMinutos(r.tempoPreparoMinutos());
        categoria.setOrdemExibicao(r.ordemExibicao() != null ? r.ordemExibicao() : categoriaRepository.proximaOrdem(categoria.getTenant()));
        if (r.ativo() != null) {
            categoria.setAtivo(r.ativo());
        }
    }

    private Specification<T_Categoria> especificacao(UUID tenant, String busca, boolean mostrarInativos) {
        return (root, query, cb) -> {
            List<Predicate> filtros = new ArrayList<>();
            filtros.add(cb.equal(root.get("tenant"), tenant));
            filtros.add(cb.isFalse(root.get("deletado")));
            if (!mostrarInativos) {
                filtros.add(cb.isTrue(root.get("ativo")));
            }
            if (busca != null && !busca.isBlank()) {
                String padrao = "%" + busca.trim().toLowerCase(Locale.ROOT)
                        .replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_") + "%";
                filtros.add(cb.like(cb.lower(root.get("nome")), padrao, '\\'));
            }
            if (query.getResultType() != Long.class) {
                query.orderBy(cb.asc(root.get("ordemExibicao")), cb.asc(cb.lower(root.get("nome"))));
            }
            return cb.and(filtros.toArray(new Predicate[0]));
        };
    }
}
