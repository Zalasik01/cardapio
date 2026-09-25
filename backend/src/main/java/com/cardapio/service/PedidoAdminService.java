package com.cardapio.service;

import org.springframework.context.ApplicationEventPublisher;
import com.cardapio.dto.PaginaResponse;
import com.cardapio.dto.pedido.PedidoAdminResponse;
import com.cardapio.dto.pedido.PedidoAdminResumoResponse;
import com.cardapio.dto.pedido.PedidoPeriodoResumoResponse;
import com.cardapio.entity.StatusPedido;
import com.cardapio.entity.T_Pedido;
import com.cardapio.entity.TipoEntrega;
import com.cardapio.exception.RecursoNaoEncontradoException;
import com.cardapio.exception.RegraNegocioException;
import com.cardapio.repository.T_PedidoRepository;
import jakarta.persistence.criteria.Predicate;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;

/** Pedidos vistos pelo painel da loja: busca por período, detalhe, andamento (status) e o resumo do dashboard. */
@Service
@RequiredArgsConstructor
public class PedidoAdminService {

    private static final int TAMANHO_MAXIMO_PAGINA = 50;
    private static final List<StatusPedido> EM_ANDAMENTO = List.of(
            StatusPedido.PENDENTE, StatusPedido.CONFIRMADO, StatusPedido.EM_PREPARO, StatusPedido.SAIU_PARA_ENTREGA);

    private final T_PedidoRepository pedidoRepository;
    private final ApplicationEventPublisher eventos;

    /** Filtros da busca: o período (início e fim, no máximo 90 dias) é obrigatório; os demais são opcionais. */
    public record Filtro(String busca, StatusPedido status, TipoEntrega tipoEntrega, LocalDate inicio, LocalDate fim) {
    }

    @Transactional(readOnly = true)
    public PaginaResponse<PedidoAdminResumoResponse> buscar(UUID tenant, Filtro filtro, int pagina, int tamanho) {
        PeriodoFiltro.validar(filtro.inicio(), filtro.fim());
        int tamanhoLimitado = Math.min(Math.max(tamanho, 1), TAMANHO_MAXIMO_PAGINA);
        var resultado = pedidoRepository.findAll(especificacao(tenant, filtro),
                PageRequest.of(Math.max(pagina, 0), tamanhoLimitado));

        // quantidade de itens de cada pedido da página, numa consulta só
        Map<Long, Long> itens = new HashMap<>();
        List<Long> ids = resultado.getContent().stream().map(T_Pedido::getId).toList();
        if (!ids.isEmpty()) {
            pedidoRepository.somarItensPorPedido(ids).forEach(linha -> itens.put((Long) linha[0], ((Number) linha[1]).longValue()));
        }
        return PaginaResponse.of(resultado, p -> PedidoAdminResumoResponse.of(p, itens.getOrDefault(p.getId(), 0L)));
    }

    /** Quadro do painel: pedidos em andamento e os encerrados hoje, já com itens e próximos passos. */
    @Transactional(readOnly = true)
    public List<PedidoAdminResponse> quadro(UUID tenant) {
        return pedidoRepository.buscarParaQuadro(tenant, EM_ANDAMENTO, LocalDate.now().atStartOfDay()).stream()
                .map(pedido -> PedidoAdminResponse.of(pedido, proximosStatus(pedido)))
                .toList();
    }

    @Transactional(readOnly = true)
    public PedidoAdminResponse obter(UUID tenant, Long id) {
        T_Pedido pedido = buscarPedido(tenant, id);
        return PedidoAdminResponse.of(pedido, proximosStatus(pedido));
    }

    /** Move o pedido para o próximo status (ou cancela). Só as transições de proximosStatus são aceitas. */
    @Transactional
    public PedidoAdminResponse atualizarStatus(UUID tenant, Long id, StatusPedido novoStatus) {
        T_Pedido pedido = buscarPedido(tenant, id);
        if (!proximosStatus(pedido).contains(novoStatus)) {
            throw new RegraNegocioException("Este pedido não pode ir de " + pedido.getStatus() + " para " + novoStatus);
        }
        pedido.setStatus(novoStatus);
        pedidoRepository.save(pedido);
        eventos.publishEvent(new PedidoEventos.PedidoEvento(tenant, "STATUS", pedido.getId()));
        return PedidoAdminResponse.of(pedido, proximosStatus(pedido));
    }

    @Transactional(readOnly = true)
    public PedidoPeriodoResumoResponse resumo(UUID tenant, LocalDate inicio, LocalDate fim) {
        PeriodoFiltro.validar(inicio, fim);
        LocalDateTime de = inicio.atStartOfDay();
        LocalDateTime ate = fim.plusDays(1).atStartOfDay();
        return new PedidoPeriodoResumoResponse(
                pedidoRepository.contarNoPeriodo(tenant, de, ate),
                pedidoRepository.contarNoPeriodoPorStatus(tenant, de, ate, StatusPedido.ENTREGUE),
                pedidoRepository.somarNoPeriodoPorStatus(tenant, de, ate, StatusPedido.ENTREGUE),
                pedidoRepository.contarPorStatus(tenant, EM_ANDAMENTO));
    }

    /**
     * Fluxo: pendente, confirmado, em preparo, saiu para entrega (só entrega), entregue. Em qualquer ponto antes
     * do fim dá para cancelar. Entregue e cancelado são finais.
     */
    private List<StatusPedido> proximosStatus(T_Pedido pedido) {
        return switch (pedido.getStatus()) {
            case PENDENTE -> List.of(StatusPedido.CONFIRMADO, StatusPedido.CANCELADO);
            case CONFIRMADO -> List.of(StatusPedido.EM_PREPARO, StatusPedido.CANCELADO);
            case EM_PREPARO -> List.of(
                    pedido.getTipoEntrega() == TipoEntrega.ENTREGA ? StatusPedido.SAIU_PARA_ENTREGA : StatusPedido.ENTREGUE,
                    StatusPedido.CANCELADO);
            case SAIU_PARA_ENTREGA -> List.of(StatusPedido.ENTREGUE, StatusPedido.CANCELADO);
            case ENTREGUE, CANCELADO -> List.of();
        };
    }

    private T_Pedido buscarPedido(UUID tenant, Long id) {
        return pedidoRepository.buscarComItensPorId(id, tenant)
                .orElseThrow(() -> new RecursoNaoEncontradoException("Pedido não encontrado"));
    }

    private Specification<T_Pedido> especificacao(UUID tenant, Filtro filtro) {
        return (root, query, cb) -> {
            List<Predicate> filtros = new ArrayList<>();
            filtros.add(cb.equal(root.get("tenant"), tenant));
            filtros.add(cb.greaterThanOrEqualTo(root.get("dataCriacao"), filtro.inicio().atStartOfDay()));
            filtros.add(cb.lessThan(root.get("dataCriacao"), filtro.fim().plusDays(1).atStartOfDay()));
            if (filtro.status() != null) {
                filtros.add(cb.equal(root.get("status"), filtro.status()));
            }
            if (filtro.tipoEntrega() != null) {
                filtros.add(cb.equal(root.get("tipoEntrega"), filtro.tipoEntrega()));
            }
            if (filtro.busca() != null && !filtro.busca().isBlank()) {
                String texto = filtro.busca().trim();
                String padrao = "%" + texto.toLowerCase(Locale.ROOT)
                        .replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_") + "%";
                List<Predicate> ou = new ArrayList<>(List.of(
                        cb.like(cb.lower(root.get("nomeCliente")), padrao, '\\'),
                        cb.like(root.get("telefoneCliente"), padrao, '\\')));
                if (texto.chars().allMatch(Character::isDigit) && texto.length() <= 12) {
                    ou.add(cb.equal(root.get("id"), Long.parseLong(texto))); // o número do pedido
                }
                filtros.add(cb.or(ou.toArray(new Predicate[0])));
            }
            if (query.getResultType() != Long.class) {
                query.orderBy(cb.desc(root.get("dataCriacao")));
            }
            return cb.and(filtros.toArray(new Predicate[0]));
        };
    }
}
