package com.cardapio.service;

import com.cardapio.entity.T_Pedido;
import com.cardapio.entity.T_PushAssinatura;
import com.cardapio.repository.T_PushAssinaturaRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.security.Security;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import nl.martijndwars.webpush.Notification;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Notificações push (Web Push com chaves VAPID). O envio roda em segundo plano para nunca atrasar a requisição de quem
 * mudou o pedido; assinatura que o navegador removeu (404/410) é apagada.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class PushService {

    public record Assinatura(String endpoint, Chaves keys) {
        public record Chaves(String p256dh, String auth) {
        }
    }

    private final T_PushAssinaturaRepository repository;
    private final ObjectMapper json;

    @Value("${app.push.chave-publica}")
    private String chavePublica;

    @Value("${app.push.chave-privada}")
    private String chavePrivada;

    @Value("${app.push.contato}")
    private String contato;

    private final ExecutorService fila = Executors.newFixedThreadPool(2);
    private nl.martijndwars.webpush.PushService cliente;

    public String chavePublica() {
        return chavePublica;
    }

    private synchronized nl.martijndwars.webpush.PushService cliente() throws Exception {
        if (cliente == null) {
            if (Security.getProvider("BC") == null) {
                Security.addProvider(new org.bouncycastle.jce.provider.BouncyCastleProvider());
            }
            cliente = new nl.martijndwars.webpush.PushService(chavePublica, chavePrivada, contato);
        }
        return cliente;
    }

    @Transactional
    public void assinarEntregador(UUID tenant, Long idEntregador, Assinatura a) {
        salvar(tenant, "ENTREGADOR", idEntregador, null, a);
    }

    @Transactional
    public void assinarPedido(UUID tenant, Long idPedido, Assinatura a) {
        salvar(tenant, "PEDIDO", null, idPedido, a);
    }

    private void salvar(UUID tenant, String tipo, Long idEntregador, Long idPedido, Assinatura a) {
        if (a == null || a.endpoint() == null || a.keys() == null || a.keys().p256dh() == null || a.keys().auth() == null) {
            throw new com.cardapio.exception.RegraNegocioException("Assinatura de notificação inválida");
        }
        if (repository.findFirstByEndpointAndTipoAndIdEntregadorAndIdPedido(a.endpoint(), tipo, idEntregador, idPedido).isPresent()) {
            return;
        }
        repository.save(T_PushAssinatura.builder().tenant(tenant).tipo(tipo).idEntregador(idEntregador).idPedido(idPedido)
                .endpoint(a.endpoint()).chaveP256dh(a.keys().p256dh()).chaveAuth(a.keys().auth()).criadoEm(LocalDateTime.now()).build());
    }

    /** "Nova entrega": avisa o celular do entregador. */
    public void novaEntrega(Long idEntregador, T_Pedido pedido, String urlDoEntregador) {
        enviar(repository.findByTipoAndIdEntregador("ENTREGADOR", idEntregador),
                "Nova entrega — pedido " + pedido.getId(), pedido.getNomeCliente() + " · " + (pedido.getEnderecoBairro() == null ? "" : pedido.getEnderecoBairro()),
                urlDoEntregador);
    }

    /** Mudança de situação: avisa quem acompanha o pedido. */
    public void situacaoDoPedido(T_Pedido pedido, String situacao) {
        enviar(repository.findByTipoAndIdPedido("PEDIDO", pedido.getId()),
                "Pedido " + pedido.getId() + ": " + situacao, "Toque para acompanhar.", "/pedido/" + pedido.getGuid());
    }

    private void enviar(List<T_PushAssinatura> assinaturas, String titulo, String corpo, String url) {
        if (assinaturas.isEmpty()) {
            return;
        }
        List<T_PushAssinatura> copia = List.copyOf(assinaturas);
        fila.submit(() -> {
            try {
                String carga = json.writeValueAsString(Map.of("titulo", titulo, "corpo", corpo, "url", url));
                for (T_PushAssinatura s : copia) {
                    try {
                        var resposta = cliente().send(new Notification(s.getEndpoint(), s.getChaveP256dh(), s.getChaveAuth(), carga));
                        int status = resposta.getStatusLine().getStatusCode();
                        if (status == 404 || status == 410) {
                            repository.deleteById(s.getId());
                        }
                    } catch (Exception e) {
                        log.warn("Falha ao enviar push: {}", e.getMessage());
                    }
                }
            } catch (Exception e) {
                log.warn("Falha ao preparar push: {}", e.getMessage());
            }
        });
    }
}
