package com.cardapio.service;

import com.cardapio.dto.PaginaResponse;
import com.cardapio.dto.pagamento.FormaPagamentoRequest;
import com.cardapio.dto.pagamento.FormaPagamentoResponse;
import com.cardapio.entity.T_FormaPagamento;
import com.cardapio.exception.RecursoNaoEncontradoException;
import com.cardapio.exception.RegraNegocioException;
import com.cardapio.repository.T_FormaPagamentoRepository;
import jakarta.persistence.criteria.Predicate;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** CRUD das formas de pagamento da loja e a lista usada ao lançar pedidos. */
@Service
@RequiredArgsConstructor
public class FormaPagamentoService {

    private static final int TAMANHO_MAXIMO_PAGINA = 50;

    private final T_FormaPagamentoRepository repository;

    @Transactional(readOnly = true)
    public PaginaResponse<FormaPagamentoResponse> buscar(UUID tenant, String busca, boolean mostrarInativos, int pagina, int tamanho) {
        int tamanhoLimitado = Math.min(Math.max(tamanho, 1), TAMANHO_MAXIMO_PAGINA);
        var resultado = repository.findAll(especificacao(tenant, busca, mostrarInativos),
                PageRequest.of(Math.max(pagina, 0), tamanhoLimitado));
        return PaginaResponse.of(resultado, FormaPagamentoResponse::of);
    }

    /** Formas ativas, na ordem de exibição (para o lançamento de pedidos). */
    @Transactional(readOnly = true)
    public List<FormaPagamentoResponse> listarAtivas(UUID tenant) {
        return repository.findByTenantAndAtivoTrueAndDeletadoFalseOrderByOrdemAscNomeAsc(tenant).stream()
                .map(FormaPagamentoResponse::of).toList();
    }

    @Transactional(readOnly = true)
    public FormaPagamentoResponse obter(UUID tenant, Long id) {
        return FormaPagamentoResponse.of(buscarForma(tenant, id));
    }

    @Transactional
    public FormaPagamentoResponse criar(UUID tenant, FormaPagamentoRequest request) {
        validarNomeLivre(tenant, request.nome(), null);
        T_FormaPagamento forma = T_FormaPagamento.builder().tenant(tenant).build();
        preencher(forma, request);
        return FormaPagamentoResponse.of(repository.save(forma));
    }

    @Transactional
    public FormaPagamentoResponse atualizar(UUID tenant, Long id, FormaPagamentoRequest request) {
        T_FormaPagamento forma = buscarForma(tenant, id);
        validarNomeLivre(tenant, request.nome(), id);
        preencher(forma, request);
        return FormaPagamentoResponse.of(repository.save(forma));
    }

    @Transactional
    public void alterarAtivo(UUID tenant, Long id, boolean ativo) {
        T_FormaPagamento forma = buscarForma(tenant, id);
        forma.setAtivo(ativo);
        repository.save(forma);
    }

    /** Exclusão lógica: os pedidos guardam o nome da forma usada, então nada aponta para o cadastro. */
    @Transactional
    public void excluir(UUID tenant, Long id) {
        T_FormaPagamento forma = buscarForma(tenant, id);
        forma.setDeletado(true);
        forma.setAtivo(false);
        repository.save(forma);
    }

    private T_FormaPagamento buscarForma(UUID tenant, Long id) {
        return repository.findByIdAndTenantAndDeletadoFalse(id, tenant)
                .orElseThrow(() -> new RecursoNaoEncontradoException("Forma de pagamento não encontrada"));
    }

    private void validarNomeLivre(UUID tenant, String nome, Long id) {
        boolean emUso = id == null
                ? repository.existsByTenantAndNomeIgnoreCaseAndDeletadoFalse(tenant, nome.trim())
                : repository.existsByTenantAndNomeIgnoreCaseAndDeletadoFalseAndIdNot(tenant, nome.trim(), id);
        if (emUso) {
            throw new RegraNegocioException("Já existe uma forma de pagamento com este nome");
        }
    }

    private void preencher(T_FormaPagamento forma, FormaPagamentoRequest r) {
        forma.setNome(r.nome().trim());
        forma.setTipo(r.tipo());
        forma.setTaxaPercentual(r.taxaPercentual() != null ? r.taxaPercentual() : BigDecimal.ZERO);
        forma.setTaxaFixa(r.taxaFixa() != null ? r.taxaFixa() : BigDecimal.ZERO);
        forma.setValorMinimo(r.valorMinimo());
        boolean entrega = r.aceitaEntrega() == null || r.aceitaEntrega();
        boolean retirada = r.aceitaRetirada() == null || r.aceitaRetirada();
        if (!entrega && !retirada) {
            throw new RegraNegocioException("A forma de pagamento precisa valer para entrega, retirada ou os dois");
        }
        forma.setAceitaEntrega(entrega);
        forma.setAceitaRetirada(retirada);
        forma.setOrdem(r.ordem() != null ? r.ordem() : 0);
        if (r.ativo() != null) {
            forma.setAtivo(r.ativo());
        }
    }

    private Specification<T_FormaPagamento> especificacao(UUID tenant, String busca, boolean mostrarInativos) {
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
                query.orderBy(cb.asc(root.get("ordem")), cb.asc(cb.lower(root.get("nome"))));
            }
            return cb.and(filtros.toArray(new Predicate[0]));
        };
    }
}
