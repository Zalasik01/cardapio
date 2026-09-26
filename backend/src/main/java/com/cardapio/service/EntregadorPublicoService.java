package com.cardapio.service;

import com.cardapio.dto.entregador.EntregadorPublicoDtos.EntregaCelular;
import com.cardapio.dto.entregador.EntregadorPublicoDtos.ItemEntrega;
import com.cardapio.dto.entregador.EntregadorPublicoDtos.PainelEntregador;
import com.cardapio.dto.pedido.AtualizarStatusPedidoRequest;
import com.cardapio.entity.StatusPedido;
import com.cardapio.entity.T_Entregador;
import com.cardapio.entity.T_Pedido;
import com.cardapio.exception.RecursoNaoEncontradoException;
import com.cardapio.exception.RegraNegocioException;
import com.cardapio.repository.T_EntregadorRepository;
import com.cardapio.repository.T_PedidoRepository;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

/**
 * O que o entregador faz pelo celular, com o link secreto dele: ver as entregas, sair para entregar, concluir com
 * foto e mandar a posição (GPS). Todo acesso confere que o pedido é mesmo dele.
 */
@Service
@RequiredArgsConstructor
public class EntregadorPublicoService {

    private static final List<StatusPedido> ABERTOS = List.of(
            StatusPedido.PENDENTE, StatusPedido.CONFIRMADO, StatusPedido.EM_PREPARO, StatusPedido.SAIU_PARA_ENTREGA);

    private final T_EntregadorRepository entregadorRepository;
    private final T_PedidoRepository pedidoRepository;
    private final FluxoPedidoService fluxoService;
    private final PedidoAdminService pedidoAdminService;
    private final PagamentoPedidoService pagamentoService;
    private final LojaService lojaService;
    private final ImagemService imagemService;
    private final PushService pushService;
    private final com.cardapio.repository.T_PedidoTrilhaRepository trilhaRepository;
    private final ApplicationEventPublisher eventos;

    @Transactional
    public PainelEntregador painel(UUID token) {
        T_Entregador entregador = entregadorPorToken(token);
        var fluxo = fluxoService.carregar(entregador.getTenant());
        List<EntregaCelular> entregas = pedidoRepository.buscarEntregasDoEntregador(entregador.getId(), ABERTOS).stream()
                .map(p -> paraCelular(p, fluxo)).toList();
        Object[] hoje = pedidoRepository.resumoDoEntregadorDesde(entregador.getId(), LocalDateTime.now().toLocalDate().atStartOfDay()).get(0);
        return new PainelEntregador(entregador.getNome(), lojaService.buscarPorTenant(entregador.getTenant()).getNome(), entregas,
                ((Number) hoje[0]).longValue(), new java.math.BigDecimal(String.valueOf(hoje[1])));
    }

    /** Manifesto do app instalável (PWA) deste entregador: abre direto na página dele. */
    @Transactional(readOnly = true)
    public java.util.Map<String, Object> manifesto(UUID token) {
        T_Entregador entregador = entregadorPorToken(token);
        String loja = lojaService.buscarPorTenant(entregador.getTenant()).getNome();
        String inicio = "/entregador/" + token;
        return java.util.Map.of(
                "name", "Entregas - " + loja,
                "short_name", "Entregas",
                "description", "Suas entregas de " + loja,
                "start_url", inicio,
                "scope", inicio,
                "display", "standalone",
                "orientation", "portrait",
                "background_color", "#f4f4f4",
                "theme_color", "#2563eb",
                "icons", List.of(
                        java.util.Map.of("src", "/icons/icon-192.png", "sizes", "192x192", "type", "image/png", "purpose", "any"),
                        java.util.Map.of("src", "/icons/icon-512.png", "sizes", "512x512", "type", "image/png", "purpose", "any"),
                        java.util.Map.of("src", "/icons/icon-maskable-512.png", "sizes", "512x512", "type", "image/png", "purpose", "maskable"),
                        java.util.Map.of("src", "/favicon.svg", "sizes", "any", "type", "image/svg+xml", "purpose", "any")));
    }

    /** "Saí para entrega": leva o pedido para a situação de saída do fluxo da loja. */
    @Transactional
    public void sair(UUID token, Long pedidoId) {
        mover(token, pedidoId, StatusPedido.SAIU_PARA_ENTREGA, null);
    }

    /** "Entregue": conclui o pedido no fluxo, guarda a foto da entrega (opcional) e a hora. */
    @Transactional
    public void entregar(UUID token, Long pedidoId, MultipartFile foto, String codigo) {
        conferirCodigo(token, pedidoId, codigo);
        String url = foto == null || foto.isEmpty() ? null : imagemService.enviar("entregas", foto);
        mover(token, pedidoId, StatusPedido.ENTREGUE, url);
    }

    @Transactional
    public void assinarPush(UUID token, PushService.Assinatura assinatura) {
        T_Entregador entregador = entregadorPorToken(token);
        pushService.assinarEntregador(entregador.getTenant(), entregador.getId(), assinatura);
    }

    /** Guarda a posição do celular e avisa quem acompanha os pedidos que ele está levando. */
    @Transactional
    public void posicao(UUID token, Double latitude, Double longitude) {
        if (latitude == null || longitude == null || Math.abs(latitude) > 90 || Math.abs(longitude) > 180) {
            throw new RegraNegocioException("Posição inválida");
        }
        T_Entregador entregador = entregadorPorToken(token);
        entregador.setUltimaLatitude(latitude);
        entregador.setUltimaLongitude(longitude);
        entregador.setPosicaoEm(LocalDateTime.now().withNano(0));
        entregadorRepository.save(entregador);
var emRota = pedidoRepository.buscarEntregasDoEntregador(entregador.getId(), List.of(StatusPedido.SAIU_PARA_ENTREGA));
        emRota.forEach(p -> {
            trilhaRepository.save(com.cardapio.entity.T_PedidoTrilha.builder().tenant(p.getTenant()).idPedido(p.getId())
                    .latitude(latitude).longitude(longitude).registradoEm(LocalDateTime.now()).build());
            eventos.publishEvent(new PedidoEventos.PedidoEvento(p.getTenant(), "POSICAO", p.getId()));
        });
    }

    /** Prova de entrega: pedido com código só é concluído se o entregador digitar o código que o cliente recebeu. */
    private void conferirCodigo(UUID token, Long pedidoId, String codigo) {
        T_Entregador entregador = entregadorPorToken(token);
        T_Pedido pedido = pedidoRepository.buscarComItensPorId(pedidoId, entregador.getTenant())
                .filter(p -> entregador.getId().equals(p.getIdEntregador()))
                .orElseThrow(() -> new RecursoNaoEncontradoException("Entrega não encontrada"));
        if (pedido.getCodigoEntrega() != null && !pedido.getCodigoEntrega().equals(codigo == null ? "" : codigo.trim())) {
            throw new RegraNegocioException("Código de entrega incorreto. Peça o código de 4 dígitos ao cliente.");
        }
    }

    private void mover(UUID token, Long pedidoId, StatusPedido categoria, String fotoUrl) {
        T_Entregador entregador = entregadorPorToken(token);
        T_Pedido pedido = pedidoRepository.buscarComItensPorId(pedidoId, entregador.getTenant())
                .filter(p -> entregador.getId().equals(p.getIdEntregador()))
                .orElseThrow(() -> new RecursoNaoEncontradoException("Entrega não encontrada"));
        var destino = fluxoService.carregar(entregador.getTenant()).proximas(pedido).stream()
                .filter(p -> p.categoria() == categoria).findFirst()
                .orElseThrow(() -> new RegraNegocioException("Este pedido ainda não pode ir para essa etapa"));
        pedidoAdminService.atualizarStatus(entregador.getTenant(), pedidoId, new AtualizarStatusPedidoRequest(destino.id(), null, null));
        if (categoria == StatusPedido.ENTREGUE) {
            T_Pedido atualizado = pedidoRepository.buscarComItensPorId(pedidoId, entregador.getTenant()).orElseThrow();
            atualizado.setDataEntrega(LocalDateTime.now().withNano(0));
            if (fotoUrl != null) {
                atualizado.setFotoEntregaUrl(fotoUrl);
            }
            pedidoRepository.save(atualizado);
        }
    }

    private EntregaCelular paraCelular(T_Pedido p, FluxoPedidoService.Fluxo fluxo) {
        var situacao = fluxo.info(p);
        var proximas = fluxo.proximas(p);
        String endereco = String.join(", ", java.util.stream.Stream.of(p.getEnderecoRua(), p.getEnderecoNumero(), p.getEnderecoComplemento())
                .filter(x -> x != null && !x.isBlank()).toList());
        var loja = lojaService.buscarPorTenant(p.getTenant());
        boolean mesmaCidade = p.getEnderecoCidade() == null || p.getEnderecoCidade().equalsIgnoreCase(loja.getEnderecoCidade());
        // sem o complemento (apto, bloco): ele atrapalha a busca no mapa
        String destinoMapa = String.join(", ", java.util.stream.Stream.of(p.getEnderecoRua(), p.getEnderecoNumero(), p.getEnderecoBairro(),
                        p.getEnderecoCidade() != null ? p.getEnderecoCidade() : loja.getEnderecoCidade(), mesmaCidade ? loja.getEnderecoEstado() : null, "Brasil")
                .filter(x -> x != null && !x.isBlank()).toList());
        var itens = p.getItens().stream().map(i -> new ItemEntrega(i.getNomeProduto() + (i.getOpcoes().isEmpty() ? "" : " (" + i.resumoOpcoes() + ")"), i.getQuantidade(), i.getObservacoes())).toList();
        var pagamentos = pagamentoService.doPedido(p.getId()).stream().map(PagamentoPedidoService::resposta).toList();
        return new EntregaCelular(p.getId(), p.getNomeCliente(), p.getTelefoneCliente(), endereco, p.getEnderecoBairro() + (p.getEnderecoCidade() != null ? " - " + p.getEnderecoCidade() : ""), destinoMapa,
                p.getObservacoes(), itens, p.getTotal(), pagamentos, p.getFormaPagamento(),
                situacao != null ? situacao.nome() : null, situacao != null ? situacao.cor() : null,
                proximas.stream().anyMatch(x -> x.categoria() == StatusPedido.SAIU_PARA_ENTREGA),
                proximas.stream().anyMatch(x -> x.categoria() == StatusPedido.ENTREGUE), p.getCodigoEntrega() != null, p.getDataCriacao());
    }

    private T_Entregador entregadorPorToken(UUID token) {
        return entregadorRepository.findByTokenAndDeletadoFalse(token).filter(T_Entregador::isAtivo)
                .orElseThrow(() -> new RecursoNaoEncontradoException("Link inválido ou desativado"));
    }
}
