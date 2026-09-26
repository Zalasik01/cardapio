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

    public record ItemHistorico(UUID produtoGuid, String nome, int quantidade, BigDecimal precoPago, String observacoes) {
    }

    public record PedidoHistorico(UUID guid, Long numero, LocalDateTime data, String situacao, String cor, boolean cancelado,
                                  boolean concluido, String tipoEntrega, BigDecimal total, List<ItemHistorico> itens) {
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
                    p.getItens().stream().map(i -> new ItemHistorico(i.getProduto().getGuid(), i.getNomeProduto(), i.getQuantidade(),
                            i.getPrecoUnitario(), i.getObservacoes())).toList());
        }).toList();
    }
}
