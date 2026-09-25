package com.cardapio.service;

import com.cardapio.dto.PaginaResponse;
import com.cardapio.dto.produto.FiltroProdutoCadastro;
import com.cardapio.dto.produto.ProdutoCadastroRequest;
import com.cardapio.dto.produto.ProdutoCadastroRequest.ItemComposicaoRequest;
import com.cardapio.dto.produto.ProdutoCadastroResponse;
import com.cardapio.dto.produto.ProdutoCadastroResponse.ItemComposicao;
import com.cardapio.dto.produto.ProdutoCadastroResumoResponse;
import com.cardapio.entity.T_Categoria;
import com.cardapio.entity.T_Pessoa;
import com.cardapio.entity.T_Produto;
import com.cardapio.entity.T_ProdutoIngrediente;
import com.cardapio.entity.TipoProduto;
import com.cardapio.exception.RecursoNaoEncontradoException;
import com.cardapio.exception.RegraNegocioException;
import com.cardapio.repository.T_CategoriaRepository;
import com.cardapio.repository.T_PessoaRepository;
import com.cardapio.repository.T_ProdutoIngredienteRepository;
import com.cardapio.repository.T_ProdutoRepository;
import jakarta.persistence.criteria.Predicate;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.UUID;

/**
 * CRUD de produtos da loja, nos dois tipos: produto final (vendido no cardápio, com categoria, preço e uma
 * composição de ingredientes) e ingrediente (insumo, com custo por unidade e fornecedor opcional).
 */
@Service
@RequiredArgsConstructor
public class ProdutoCadastroService {

    private static final int TAMANHO_MAXIMO_PAGINA = 50;

    private final T_ProdutoRepository produtoRepository;
    private final T_ProdutoIngredienteRepository composicaoRepository;
    private final T_CategoriaRepository categoriaRepository;
    private final T_PessoaRepository pessoaRepository;

    /** Categoria do cardápio para o campo de seleção. */
    public record OpcaoCategoria(Long id, String nome) {
    }

    @Transactional(readOnly = true)
    public List<OpcaoCategoria> categorias(UUID tenant) {
        return categoriaRepository.findByTenantAndAtivoTrueAndDeletadoFalseOrderByOrdemExibicaoAsc(tenant).stream()
                .map(c -> new OpcaoCategoria(c.getId(), c.getNome())).toList();
    }

    /** Próximo código da loja: o menor número livre (reaproveita os buracos deixados por exclusões). O usuário pode trocá-lo. */
    @Transactional(readOnly = true)
    public String proximoCodigo(UUID tenant) {
        return String.valueOf(produtoRepository.menorCodigoNumericoLivre(tenant));
    }

    @Transactional(readOnly = true)
    public PaginaResponse<ProdutoCadastroResumoResponse> buscar(UUID tenant, FiltroProdutoCadastro filtro, int pagina, int tamanho) {
        int tamanhoLimitado = Math.min(Math.max(tamanho, 1), TAMANHO_MAXIMO_PAGINA);
        var resultado = produtoRepository.findAll(
                especificacao(tenant, filtro), PageRequest.of(Math.max(pagina, 0), tamanhoLimitado));
        return PaginaResponse.of(resultado, p -> ProdutoCadastroResumoResponse.of(p, nomePessoa(p.getFornecedor())));
    }

    @Transactional(readOnly = true)
    public ProdutoCadastroResponse obter(UUID tenant, Long id) {
        return montarResposta(buscarProduto(tenant, id));
    }

    @Transactional
    public ProdutoCadastroResponse criar(UUID tenant, ProdutoCadastroRequest request) {
        // sem código informado, usa o próximo da sequência
        String codigo = temTexto(request.codigo()) ? request.codigo().trim() : proximoCodigo(tenant);
        validarCodigoLivre(tenant, codigo, null);
        T_Produto produto = T_Produto.builder().tenant(tenant).tipo(request.tipo()).build();
        preencher(produto, request, tenant);
        produto.setCodigo(codigo);
        produto = produtoRepository.save(produto);
        salvarComposicao(produto, request, tenant);
        return montarResposta(produto);
    }

    @Transactional
    public ProdutoCadastroResponse atualizar(UUID tenant, Long id, ProdutoCadastroRequest request) {
        T_Produto produto = buscarProduto(tenant, id);
        if (produto.getTipo() != request.tipo()) {
            throw new RegraNegocioException("Não é possível trocar o tipo (produto final/ingrediente) de um cadastro existente");
        }
        validarCodigoLivre(tenant, request.codigo(), id);
        preencher(produto, request, tenant);
        produtoRepository.save(produto);
        salvarComposicao(produto, request, tenant);
        return montarResposta(produto);
    }

    /** Ativa ou inativa o produto. Inativo some das listas (salvo "Mostrar inativos"), do cardápio e dos pedidos. */
    @Transactional
    public void alterarAtivo(UUID tenant, Long id, boolean ativo) {
        T_Produto produto = buscarProduto(tenant, id);
        produto.setAtivo(ativo);
        produtoRepository.save(produto);
    }

    /** O código já está em uso por outro produto da loja? produtoId é o produto em edição (não conta contra ele mesmo). */
    @Transactional(readOnly = true)
    public boolean codigoDisponivel(UUID tenant, String codigo, Long produtoId) {
        if (!temTexto(codigo)) {
            return true;
        }
        return produtoId == null
                ? !produtoRepository.existsByTenantAndCodigoAndDeletadoFalse(tenant, codigo.trim())
                : !produtoRepository.existsByTenantAndCodigoAndDeletadoFalseAndIdNot(tenant, codigo.trim(), produtoId);
    }

    /**
     * Exclusão definitiva do cadastro (o código fica livre na hora). Só se o produto já foi vendido em algum pedido
     * é que ele é apenas marcado como excluído, para não quebrar o histórico. Um ingrediente usado na composição
     * de algum produto não pode ser excluído.
     */
    @Transactional
    public void excluir(UUID tenant, Long id) {
        T_Produto produto = buscarProduto(tenant, id);
        if (produto.getTipo() == TipoProduto.INGREDIENTE) {
            long usos = composicaoRepository.contarProdutosQueUsam(id);
            if (usos > 0) {
                throw new RegraNegocioException("Este ingrediente é usado na composição de " + usos
                        + " produto(s). Remova-o das composições antes de excluir.");
            }
        }
        if (produto.getTipo() == TipoProduto.INGREDIENTE) {
            composicaoRepository.deleteByIngredienteId(id);
        } else {
            composicaoRepository.deleteByProdutoId(id);
        }
        if (produtoRepository.contarItensDePedido(id) > 0) {
            produto.setDeletado(true);
            produto.setAtivo(false);
            produto.setDisponivel(false);
            produto.setCodigo(null);
            produtoRepository.save(produto);
        } else {
            produtoRepository.delete(produto);
        }
    }

    private T_Produto buscarProduto(UUID tenant, Long id) {
        return produtoRepository.findByIdAndTenantAndDeletadoFalse(id, tenant)
                .orElseThrow(() -> new RecursoNaoEncontradoException("Produto não encontrado"));
    }

    private void validarCodigoLivre(UUID tenant, String codigo, Long id) {
        if (!temTexto(codigo)) {
            return;
        }
        boolean emUso = id == null
                ? produtoRepository.existsByTenantAndCodigoAndDeletadoFalse(tenant, codigo.trim())
                : produtoRepository.existsByTenantAndCodigoAndDeletadoFalseAndIdNot(tenant, codigo.trim(), id);
        if (emUso) {
            throw new RegraNegocioException("Já existe um produto com este código");
        }
    }

    private void preencher(T_Produto produto, ProdutoCadastroRequest r, UUID tenant) {
        produto.setNome(r.nome().trim());
        produto.setCodigo(temTexto(r.codigo()) ? r.codigo().trim() : null);
        produto.setDescricao(vazioParaNulo(r.descricao()));
        produto.setUnidadeMedida(r.unidadeMedida());
        produto.setObservacao(vazioParaNulo(r.observacao()));
        if (r.ativo() != null) {
            produto.setAtivo(r.ativo());
        }

        if (r.tipo() == TipoProduto.FINAL) {
            if (r.categoriaId() == null) {
                throw new RegraNegocioException("Informe a categoria do produto");
            }
            if (r.preco() == null) {
                throw new RegraNegocioException("Informe o preço de venda");
            }
            T_Categoria categoria = categoriaRepository.findById(r.categoriaId())
                    .filter(c -> !c.isDeletado() && tenant.equals(c.getTenant()))
                    .orElseThrow(() -> new RegraNegocioException("Categoria não encontrada"));
            produto.setCategoria(categoria);
            produto.setPreco(r.preco());
            produto.setImagemUrl(vazioParaNulo(r.imagemUrl()));
            produto.setDisponivel(r.disponivel() == null || r.disponivel());
            produto.setCustoUnitario(BigDecimal.ZERO);
            produto.setFornecedor(null);
        } else {
            produto.setCategoria(null);
            produto.setPreco(BigDecimal.ZERO);
            produto.setImagemUrl(null);
            produto.setDisponivel(true);
            produto.setCustoUnitario(r.custoUnitario() == null ? BigDecimal.ZERO : r.custoUnitario());
            produto.setFornecedor(r.fornecedorId() == null ? null : buscarFornecedor(tenant, r.fornecedorId()));
        }
    }

    private T_Pessoa buscarFornecedor(UUID tenant, Long fornecedorId) {
        return pessoaRepository.findByIdAndTenantAndDeletadoFalse(fornecedorId, tenant)
                .filter(T_Pessoa::isFornecedor)
                .orElseThrow(() -> new RegraNegocioException("Fornecedor não encontrado"));
    }

    /** Só produto final tem composição. A lista enviada substitui a anterior; nula = não mexer. */
    private void salvarComposicao(T_Produto produto, ProdutoCadastroRequest r, UUID tenant) {
        if (produto.getTipo() != TipoProduto.FINAL) {
            if (r.composicao() != null && !r.composicao().isEmpty()) {
                throw new RegraNegocioException("Só produto final tem composição");
            }
            return;
        }
        if (r.composicao() == null) {
            return;
        }
        Set<Long> jaUsados = new HashSet<>();
        List<T_ProdutoIngrediente> itens = new ArrayList<>();
        for (ItemComposicaoRequest item : r.composicao()) {
            if (!jaUsados.add(item.ingredienteId())) {
                throw new RegraNegocioException("O mesmo ingrediente aparece mais de uma vez na composição");
            }
            T_Produto ingrediente = produtoRepository.findByIdAndTenantAndDeletadoFalse(item.ingredienteId(), tenant)
                    .filter(p -> p.getTipo() == TipoProduto.INGREDIENTE)
                    .orElseThrow(() -> new RegraNegocioException("Ingrediente não encontrado"));
            itens.add(T_ProdutoIngrediente.builder().tenant(tenant).produto(produto)
                    .ingrediente(ingrediente).quantidade(item.quantidade()).build());
        }
        composicaoRepository.deleteByProdutoId(produto.getId());
        composicaoRepository.flush();
        composicaoRepository.saveAll(itens);
    }

    private ProdutoCadastroResponse montarResposta(T_Produto p) {
        List<ItemComposicao> composicao = p.getTipo() == TipoProduto.FINAL
                ? composicaoRepository.findByProdutoIdOrderByIdAsc(p.getId()).stream()
                        .map(i -> new ItemComposicao(
                                i.getIngrediente().getId(), i.getIngrediente().getNome(), i.getIngrediente().getUnidadeMedida(),
                                i.getQuantidade(), i.getIngrediente().getCustoUnitario(),
                                i.getQuantidade().multiply(i.getIngrediente().getCustoUnitario()).setScale(2, RoundingMode.HALF_UP)))
                        .toList()
                : List.of();
        BigDecimal custoEstimado = composicao.stream().map(ItemComposicao::custoTotal).reduce(BigDecimal.ZERO, BigDecimal::add);
        return new ProdutoCadastroResponse(
                p.getId(), p.getTipo(), p.isAtivo(), p.getCodigo(), p.getNome(), p.getDescricao(), p.getUnidadeMedida(),
                p.getObservacao(),
                p.getCategoria() == null ? null : p.getCategoria().getId(),
                p.getCategoria() == null ? null : p.getCategoria().getNome(),
                p.getPreco(), p.getImagemUrl(), p.isDisponivel(), composicao, custoEstimado, p.getCustoUnitario(),
                p.getFornecedor() == null ? null : p.getFornecedor().getId(), nomePessoa(p.getFornecedor()));
    }

    private String nomePessoa(T_Pessoa pessoa) {
        if (pessoa == null) {
            return null;
        }
        if (pessoa.getPessoaFisica() != null) {
            return pessoa.getPessoaFisica().getNome();
        }
        var pj = pessoa.getPessoaJuridica();
        return pj == null ? null : (temTexto(pj.getNomeFantasia()) ? pj.getNomeFantasia() : pj.getRazaoSocial());
    }

    private Specification<T_Produto> especificacao(UUID tenant, FiltroProdutoCadastro filtro) {
        return (root, query, cb) -> {
            List<Predicate> filtros = new ArrayList<>();
            filtros.add(cb.equal(root.get("tenant"), tenant));
            filtros.add(cb.isFalse(root.get("deletado")));
            filtros.add(cb.equal(root.get("tipo"), filtro.tipo()));
            // por padrão só lista produtos ativos; "Mostrar inativos" inclui os demais
            if (!filtro.mostrarInativos()) {
                filtros.add(cb.isTrue(root.get("ativo")));
            }
            if (temTexto(filtro.busca())) {
                String padrao = "%" + filtro.busca().trim().toLowerCase(Locale.ROOT)
                        .replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_") + "%";
                filtros.add(cb.or(
                        cb.like(cb.lower(root.get("nome")), padrao, '\\'),
                        cb.like(cb.lower(cb.coalesce(root.<String>get("codigo"), "")), padrao, '\\')));
            }
            if (filtro.categoriaId() != null) {
                filtros.add(cb.equal(root.get("categoria").get("id"), filtro.categoriaId()));
            }
            if (query.getResultType() != Long.class) {
                query.orderBy(cb.asc(cb.lower(root.get("nome"))));
            }
            return cb.and(filtros.toArray(new Predicate[0]));
        };
    }

    private boolean temTexto(String valor) {
        return valor != null && !valor.isBlank();
    }

    private String vazioParaNulo(String valor) {
        return temTexto(valor) ? valor.trim() : null;
    }
}
