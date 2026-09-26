package com.cardapio.service;

import com.cardapio.dto.PaginaResponse;
import com.cardapio.dto.entregador.EntregadorRequest;
import com.cardapio.dto.entregador.EntregadorResponse;
import com.cardapio.entity.T_Entregador;
import com.cardapio.exception.RecursoNaoEncontradoException;
import com.cardapio.exception.RegraNegocioException;
import com.cardapio.repository.T_EntregadorRepository;
import com.cardapio.repository.T_PedidoRepository;
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

/** Cadastro de entregadores da loja (próprios e terceirizados) e o link secreto de cada um. */
@Service
@RequiredArgsConstructor
public class EntregadorService {

    private static final int TAMANHO_MAXIMO_PAGINA = 50;

    private final T_EntregadorRepository repository;
    private final T_PedidoRepository pedidoRepository;

    @Transactional(readOnly = true)
    public PaginaResponse<EntregadorResponse> buscar(UUID tenant, String busca, boolean mostrarInativos, int pagina, int tamanho) {
        int tamanhoLimitado = Math.min(Math.max(tamanho, 1), TAMANHO_MAXIMO_PAGINA);
        var resultado = repository.findAll(especificacao(tenant, busca, mostrarInativos), PageRequest.of(Math.max(pagina, 0), tamanhoLimitado));
        return PaginaResponse.of(resultado, EntregadorResponse::of);
    }

    /** Entregadores ativos (para escolher quem entrega o pedido). */
    @Transactional(readOnly = true)
    public List<EntregadorResponse> listarAtivos(UUID tenant) {
        return repository.findByTenantAndAtivoTrueAndDeletadoFalseOrderByNomeAsc(tenant).stream().map(EntregadorResponse::of).toList();
    }

    @Transactional(readOnly = true)
    public EntregadorResponse obter(UUID tenant, Long id) {
        return EntregadorResponse.of(buscarEntregador(tenant, id));
    }

    @Transactional
    public EntregadorResponse criar(UUID tenant, EntregadorRequest request) {
        T_Entregador entregador = new T_Entregador();
        entregador.setTenant(tenant);
        entregador.setToken(UUID.randomUUID());
        preencher(entregador, request);
        return EntregadorResponse.of(repository.save(entregador));
    }

    @Transactional
    public EntregadorResponse atualizar(UUID tenant, Long id, EntregadorRequest request) {
        T_Entregador entregador = buscarEntregador(tenant, id);
        preencher(entregador, request);
        return EntregadorResponse.of(repository.save(entregador));
    }

    @Transactional
    public void alterarAtivo(UUID tenant, Long id, boolean ativo) {
        T_Entregador entregador = buscarEntregador(tenant, id);
        entregador.setAtivo(ativo);
        repository.save(entregador);
    }

    /** Novo link secreto: o antigo para de funcionar (use quando o celular for perdido ou o entregador sair). */
    @Transactional
    public EntregadorResponse gerarNovoLink(UUID tenant, Long id) {
        T_Entregador entregador = buscarEntregador(tenant, id);
        entregador.setToken(UUID.randomUUID());
        return EntregadorResponse.of(repository.save(entregador));
    }

    /** Exclusão lógica; não exclui quem tem entrega em andamento. */
    @Transactional
    public void excluir(UUID tenant, Long id) {
        T_Entregador entregador = buscarEntregador(tenant, id);
        boolean emAndamento = !pedidoRepository.buscarEntregasDoEntregador(id, List.of(
                com.cardapio.entity.StatusPedido.PENDENTE, com.cardapio.entity.StatusPedido.CONFIRMADO,
                com.cardapio.entity.StatusPedido.EM_PREPARO, com.cardapio.entity.StatusPedido.SAIU_PARA_ENTREGA)).isEmpty();
        if (emAndamento) {
            throw new RegraNegocioException("Este entregador tem entregas em andamento: reatribua os pedidos antes de excluí-lo");
        }
        entregador.setDeletado(true);
        entregador.setAtivo(false);
        repository.save(entregador);
    }

    public T_Entregador buscarEntregador(UUID tenant, Long id) {
        return repository.findByIdAndTenantAndDeletadoFalse(id, tenant)
                .orElseThrow(() -> new RecursoNaoEncontradoException("Entregador não encontrado"));
    }

    private void preencher(T_Entregador entregador, EntregadorRequest r) {
        entregador.setNome(r.nome().trim());
        entregador.setTelefone(r.telefone() == null || r.telefone().isBlank() ? null : r.telefone().trim());
        entregador.setTipo(r.tipo());
        entregador.setVeiculo(r.veiculo() == null || r.veiculo().isBlank() ? null : r.veiculo().trim());
        entregador.setRepassePorEntrega(r.repassePorEntrega() != null ? r.repassePorEntrega() : BigDecimal.ZERO);
        if (r.ativo() != null) {
            entregador.setAtivo(r.ativo());
        }
    }

    private Specification<T_Entregador> especificacao(UUID tenant, String busca, boolean mostrarInativos) {
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
                query.orderBy(cb.asc(cb.lower(root.get("nome"))));
            }
            return cb.and(filtros.toArray(new Predicate[0]));
        };
    }
}
