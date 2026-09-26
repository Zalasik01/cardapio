package com.cardapio.service;

import com.cardapio.dto.pedido.AcompanhamentoResponse;
import com.cardapio.dto.pedido.AcompanhamentoResponse.Entregador;
import com.cardapio.dto.pedido.AcompanhamentoResponse.Etapa;
import com.cardapio.dto.pedido.AcompanhamentoResponse.Item;
import com.cardapio.entity.StatusPedido;
import com.cardapio.entity.T_Pedido;
import com.cardapio.entity.T_SituacaoPedido;
import com.cardapio.entity.TipoEntrega;
import com.cardapio.exception.RecursoNaoEncontradoException;
import com.cardapio.repository.T_EntregadorRepository;
import com.cardapio.repository.T_PedidoRepository;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** Acompanhamento do pedido pelo cliente: o guid do pedido é o segredo do link. */
@Service
@RequiredArgsConstructor
public class AcompanhamentoService {

    private final T_PedidoRepository pedidoRepository;
    private final T_EntregadorRepository entregadorRepository;
    private final FluxoPedidoService fluxoService;
    private final LojaService lojaService;
    private final PedidoEventos pedidoEventos;
    private final com.cardapio.repository.T_PedidoTrilhaRepository trilhaRepository;
    private final AvaliacaoService avaliacaoService;

    @Transactional
    public AcompanhamentoResponse obter(UUID guid) {
        T_Pedido pedido = buscar(guid);
        var fluxo = fluxoService.carregar(pedido.getTenant());
        var loja = lojaService.buscarPorTenant(pedido.getTenant());
        T_SituacaoPedido atual = fluxo.atual(pedido);
        boolean cancelado = pedido.getStatus() == StatusPedido.CANCELADO;
        boolean concluido = pedido.getStatus() == StatusPedido.ENTREGUE;

        List<T_SituacaoPedido> caminho = fluxo.etapasPara(pedido.getTipoEntrega());
        int posicaoAtual = atual == null ? -1 : indice(caminho, atual);
        List<Etapa> etapas = new ArrayList<>();
        for (int i = 0; i < caminho.size(); i++) {
            T_SituacaoPedido e = caminho.get(i);
            etapas.add(new Etapa(e.getNome(), e.getCor(), !cancelado && posicaoAtual >= 0 && i < posicaoAtual || concluido, !cancelado && i == posicaoAtual));
        }

        Entregador entregador = null;
        if (pedido.getIdEntregador() != null && pedido.getStatus() == StatusPedido.SAIU_PARA_ENTREGA) {
            entregador = entregadorRepository.findById(pedido.getIdEntregador())
                    .map(e -> new Entregador(primeiroNome(e.getNome()), e.getVeiculo(), e.getUltimaLatitude(), e.getUltimaLongitude(), e.getPosicaoEm()))
                    .orElse(null);
        }
        var avaliacao = concluido ? avaliacaoService.doPedido(pedido.getId()) : null;
        List<AcompanhamentoResponse.Ponto> trilha = new ArrayList<>();
        if (pedido.getStatus() == StatusPedido.SAIU_PARA_ENTREGA) {
            var pontos = new ArrayList<>(trilhaRepository.ultimos(pedido.getId(), org.springframework.data.domain.PageRequest.of(0, 120)));
            java.util.Collections.reverse(pontos);
            pontos.forEach(t -> trilha.add(new AcompanhamentoResponse.Ponto(t.getLatitude(), t.getLongitude())));
        }
        String destino = pedido.getTipoEntrega() == TipoEntrega.ENTREGA
                ? String.join(" - ", java.util.stream.Stream.of(pedido.getEnderecoBairro(), pedido.getEnderecoCidade())
                        .filter(x -> x != null && !x.isBlank()).toList())
                : null;
        return new AcompanhamentoResponse(pedido.getId(), loja.getNome(), loja.getSlug(), loja.getLogoUrl(), loja.getTelefone(), pedido.getTipoEntrega(),
                primeiroNome(pedido.getNomeCliente()), atual != null ? atual.getNome() : pedido.getStatus().name(),
                atual != null ? atual.getCor() : "#6b7280", pedido.getStatus(), cancelado, concluido, etapas, pedido.getDataCriacao(),
                pedido.getTempoPreparoMinutos() == null ? null : pedido.getDataCriacao().plusMinutes(pedido.getTempoPreparoMinutos()),
                pedido.getItens().stream().map(i -> new Item(i.getNomeProduto() + (i.getOpcoes().isEmpty() ? "" : " (" + i.resumoOpcoes() + ")"), i.getQuantidade(), i.getTotalItem())).toList(),
                pedido.getSubtotal(), pedido.getTaxaEntrega(), pedido.getTotal(), destino, entregador,
                pedido.getLatitude(), pedido.getLongitude(), trilha,
                // o código só aparece com o pedido a caminho: é o cliente quem o passa ao entregador
                pedido.getStatus() == StatusPedido.SAIU_PARA_ENTREGA ? pedido.getCodigoEntrega() : null,
                avaliacao, concluido && avaliacao == null,
                pedido.getTipoEntrega() == TipoEntrega.ENTREGA && pedido.getIdEntregador() != null);
    }

    @Transactional
    public void assinarPush(UUID guid, com.cardapio.service.PushService.Assinatura assinatura, PushService push) {
        T_Pedido pedido = buscar(guid);
        push.assinarPedido(pedido.getTenant(), pedido.getId(), assinatura);
    }

    /** Abre a conexão em tempo real do cliente para este pedido. */
    @Transactional(readOnly = true)
    public org.springframework.web.servlet.mvc.method.annotation.SseEmitter eventos(UUID guid) {
        return pedidoEventos.inscreverAcompanhamento(buscar(guid).getId());
    }

    private T_Pedido buscar(UUID guid) {
        return pedidoRepository.buscarComItensPorGuid(guid).orElseThrow(() -> new RecursoNaoEncontradoException("Pedido não encontrado"));
    }

    private int indice(List<T_SituacaoPedido> caminho, T_SituacaoPedido atual) {
        for (int i = 0; i < caminho.size(); i++) {
            if (caminho.get(i).getId().equals(atual.getId())) {
                return i;
            }
        }
        return -1;
    }

    private String primeiroNome(String nome) {
        return nome == null ? "" : nome.trim().split("\\s+")[0];
    }
}
