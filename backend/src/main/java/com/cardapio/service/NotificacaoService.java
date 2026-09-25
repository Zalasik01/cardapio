package com.cardapio.service;

import com.cardapio.dto.notificacao.NotificacaoResponse;
import com.cardapio.entity.StatusPedido;
import com.cardapio.entity.T_Notificacao;
import com.cardapio.entity.T_Pedido;
import com.cardapio.entity.TipoNotificacao;
import com.cardapio.repository.T_NotificacaoRepository;
import com.cardapio.repository.T_PedidoRepository;
import java.text.NumberFormat;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Locale;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.data.domain.PageRequest;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Notificações da loja sobre pedidos: pedido novo do cliente e pedido esperando confirmação. Cada uma é gravada
 * (histórico do sino) e enviada em tempo real ao painel (evento "notificacao").
 */
@Service
@RequiredArgsConstructor
public class NotificacaoService {

    private static final int LIMITE_LISTA = 30;
    /** Depois disso sem confirmar, o pedido pendente gera um lembrete. */
    private static final Duration ESPERA_PARA_LEMBRETE = Duration.ofMinutes(5);

    /** Publicada ao gravar; o envio ao painel acontece depois do commit. */
    public record NotificacaoCriada(UUID tenant, NotificacaoResponse notificacao) {
    }

    private final T_NotificacaoRepository repository;
    private final T_PedidoRepository pedidoRepository;
    private final ApplicationEventPublisher eventos;

    @Transactional(readOnly = true)
    public List<NotificacaoResponse> listar(UUID tenant) {
        return repository.findByTenantAndDeletadoFalseOrderByIdDesc(tenant, PageRequest.of(0, LIMITE_LISTA)).stream()
                .map(NotificacaoResponse::of).toList();
    }

    /** Pedido novo feito pelo cliente (pedidos lançados pela própria loja não avisam ninguém). */
    @Transactional
    public void pedidoNovo(T_Pedido pedido) {
        String entrega = pedido.getTipoEntrega().name().equals("ENTREGA") ? "Entrega" : "Retirada";
        criar(pedido, TipoNotificacao.NOVO_PEDIDO, "Novo pedido " + pedido.getId(),
                pedido.getNomeCliente() + " · " + entrega + " · " + moeda(pedido));
    }

    /** Pedido editado: a cozinha precisa saber (mostra as primeiras mudanças na notificação). */
    @Transactional
    public void pedidoEditado(T_Pedido pedido, List<String> mudancas) {
        String resumo = String.join("; ", mudancas.stream().limit(2).toList()) + (mudancas.size() > 2 ? "..." : "");
        criar(pedido, TipoNotificacao.PEDIDO_EDITADO, "Pedido " + pedido.getId() + " foi editado", resumo);
    }

    private void criar(T_Pedido pedido, TipoNotificacao tipo, String titulo, String mensagem) {
        T_Notificacao notificacao = new T_Notificacao();
        notificacao.setTenant(pedido.getTenant());
        notificacao.setTipo(tipo);
        notificacao.setTitulo(titulo);
        notificacao.setMensagem(mensagem);
        notificacao.setRota("/admin/pedidos/" + pedido.getId());
        notificacao.setIdPedido(pedido.getId());
        T_Notificacao salva = repository.save(notificacao);
        eventos.publishEvent(new NotificacaoCriada(pedido.getTenant(), NotificacaoResponse.of(salva)));
    }

    /** A cada minuto: pedido pendente há mais de 5 minutos ganha um lembrete (uma única vez por pedido). */
    @Scheduled(fixedDelay = 60_000)
    @Transactional
    public void lembrarPedidosPendentes() {
        LocalDateTime limite = LocalDateTime.now().minus(ESPERA_PARA_LEMBRETE);
        for (T_Pedido pedido : pedidoRepository.findByStatusAndDeletadoFalseAndDataCriacaoBefore(StatusPedido.PENDENTE, limite)) {
            if (!repository.existsByIdPedidoAndTipo(pedido.getId(), TipoNotificacao.PEDIDO_AGUARDANDO)) {
                long minutos = Duration.between(pedido.getDataCriacao(), LocalDateTime.now()).toMinutes();
                criar(pedido, TipoNotificacao.PEDIDO_AGUARDANDO, "Pedido " + pedido.getId() + " aguardando confirmação",
                        pedido.getNomeCliente() + " espera há " + minutos + " min");
            }
        }
    }

    private String moeda(T_Pedido pedido) {
        return NumberFormat.getCurrencyInstance(new Locale("pt", "BR")).format(pedido.getTotal());
    }
}
