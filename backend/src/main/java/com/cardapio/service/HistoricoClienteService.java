package com.cardapio.service;

import com.cardapio.entity.S_ClienteConta;
import com.cardapio.entity.StatusPedido;
import com.cardapio.repository.T_PedidoRepository;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** Pedidos anteriores do cliente numa loja (para "meus pedidos" e "pedir de novo"). */
@Service
@RequiredArgsConstructor
public class HistoricoClienteService {

    private static final int LIMITE = 30;

    private final T_PedidoRepository pedidoRepository;
    private final LojaService lojaService;
    private final FluxoPedidoService fluxoService;

    public record ItemHistorico(UUID produtoGuid, String nome, int quantidade, BigDecimal precoPago, String observacoes, List<Long> opcoes) {
    }

    public record PedidoHistorico(UUID guid, Long numero, LocalDateTime data, String situacao, String cor, boolean cancelado,
                                  boolean concluido, String tipoEntrega, BigDecimal total, List<ItemHistorico> itens) {
    }

    /** Números do cliente na loja (cancelados não contam). */
    public record ResumoCliente(long totalPedidos, BigDecimal totalGasto, BigDecimal ticketMedio, LocalDateTime clienteDesde, String favorito) {
    }

    @Transactional(readOnly = true)
    public ResumoCliente resumo(S_ClienteConta conta, String slug) {
        UUID tenant = lojaService.buscarPorSlug(slug).getGuid();
        Object[] linha = pedidoRepository.resumoDoCliente(conta.getId(), tenant).get(0);
        long total = ((Number) linha[0]).longValue();
        BigDecimal gasto = new BigDecimal(String.valueOf(linha[1])).setScale(2, java.math.RoundingMode.HALF_UP);
        BigDecimal ticket = total == 0 ? BigDecimal.ZERO : gasto.divide(BigDecimal.valueOf(total), 2, java.math.RoundingMode.HALF_UP);
        var favoritos = pedidoRepository.favoritosDoCliente(conta.getId(), tenant, org.springframework.data.domain.PageRequest.of(0, 1));
        return new ResumoCliente(total, gasto, ticket, (LocalDateTime) linha[2], favoritos.isEmpty() ? null : (String) favoritos.get(0)[0]);
    }

    @Transactional(readOnly = true)
    public List<PedidoHistorico> listar(S_ClienteConta conta, String slug) {
        UUID tenant = lojaService.buscarPorSlug(slug).getGuid();
        var fluxo = fluxoService.carregar(tenant);
        return pedidoRepository.historicoDoCliente(conta.getId(), tenant).stream().limit(LIMITE).map(p -> {
            var info = fluxo.info(p);
            return new PedidoHistorico(p.getGuid(), p.getId(), p.getDataCriacao(), info != null ? info.nome() : p.getStatus().name(),
                    info != null ? info.cor() : null, p.getStatus() == StatusPedido.CANCELADO, p.getStatus() == StatusPedido.ENTREGUE,
                    p.getTipoEntrega().name(), p.getTotal(),
                    p.getItens().stream().map(i -> new ItemHistorico(i.getProduto().getGuid(), i.getNomeProduto() + (i.getOpcoes().isEmpty() ? "" : " (" + i.resumoOpcoes() + ")"), i.getQuantidade(),
                            i.getPrecoUnitario(), i.getObservacoes(),
                            i.getOpcoes().stream().map(com.cardapio.entity.I_ItemPedidoOpcao::getIdOpcao).toList())).toList());
        }).toList();
    }
}
