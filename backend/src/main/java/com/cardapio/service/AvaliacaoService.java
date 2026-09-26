package com.cardapio.service;

import com.cardapio.dto.PaginaResponse;
import com.cardapio.entity.StatusPedido;
import com.cardapio.entity.T_Avaliacao;
import com.cardapio.entity.T_Pedido;
import com.cardapio.entity.TipoEntrega;
import com.cardapio.exception.RecursoNaoEncontradoException;
import com.cardapio.exception.RegraNegocioException;
import com.cardapio.repository.T_AvaliacaoRepository;
import com.cardapio.repository.T_PedidoRepository;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** Avaliação do pedido: o cliente avalia depois de entregue; a loja acompanha, responde e é avisada de nota baixa. */
@Service
@RequiredArgsConstructor
public class AvaliacaoService {

    /** Nota igual ou abaixo disto gera alerta para a loja. */
    private static final int NOTA_BAIXA = 2;
    private static final int TAMANHO_MAXIMO_PAGINA = 50;

    private final T_AvaliacaoRepository repository;
    private final T_PedidoRepository pedidoRepository;
    private final NotificacaoService notificacaoService;

    public record AvaliacaoRequest(Integer notaLoja, Integer notaEntrega, String comentario) {
    }

    /** O que o cliente vê da própria avaliação. */
    public record AvaliacaoCliente(int notaLoja, Integer notaEntrega, String comentario, String resposta) {
        static AvaliacaoCliente of(T_Avaliacao a) {
            return new AvaliacaoCliente(a.getNotaLoja(), a.getNotaEntrega() == null ? null : a.getNotaEntrega().intValue(), a.getComentario(), a.getResposta());
        }
    }

    public record AvaliacaoAdmin(Long id, Long pedidoId, String cliente, int notaLoja, Integer notaEntrega, String comentario,
                                 LocalDateTime criadoEm, String resposta, LocalDateTime respondidaEm, String tipoEntrega) {
    }

    public record Resumo(long total, BigDecimal mediaLoja, BigDecimal mediaEntrega) {
    }

    // ---------- cliente ----------

    @Transactional
    public AvaliacaoCliente avaliar(UUID guidDoPedido, AvaliacaoRequest r) {
        T_Pedido pedido = pedidoRepository.buscarComItensPorGuid(guidDoPedido)
                .orElseThrow(() -> new RecursoNaoEncontradoException("Pedido não encontrado"));
        if (pedido.getStatus() != StatusPedido.ENTREGUE) {
            throw new RegraNegocioException("Você poderá avaliar assim que o pedido for entregue");
        }
        if (repository.findByIdPedidoAndDeletadoFalse(pedido.getId()).isPresent()) {
            throw new RegraNegocioException("Este pedido já foi avaliado");
        }
        int notaLoja = nota(r.notaLoja(), true);
        Integer notaEntrega = pedido.getTipoEntrega() == TipoEntrega.ENTREGA && pedido.getIdEntregador() != null ? nota(r.notaEntrega(), false) : null;
        String comentario = r.comentario() == null || r.comentario().isBlank() ? null : r.comentario().trim();
        if (comentario != null && comentario.length() > 500) {
            throw new RegraNegocioException("O comentário pode ter até 500 caracteres");
        }
        T_Avaliacao a = repository.save(T_Avaliacao.builder().tenant(pedido.getTenant()).idPedido(pedido.getId())
                .idClienteConta(pedido.getIdClienteConta()).notaLoja((short) notaLoja)
                .notaEntrega(notaEntrega == null ? null : notaEntrega.shortValue()).comentario(comentario).criadoEm(LocalDateTime.now()).build());
        if (notaLoja <= NOTA_BAIXA || (notaEntrega != null && notaEntrega <= NOTA_BAIXA)) {
            notificacaoService.avaliacaoBaixa(pedido, notaLoja, notaEntrega, comentario);
        }
        return AvaliacaoCliente.of(a);
    }

    @Transactional(readOnly = true)
    public AvaliacaoCliente doPedido(Long pedidoId) {
        return repository.findByIdPedidoAndDeletadoFalse(pedidoId).map(AvaliacaoCliente::of).orElse(null);
    }

    private static int nota(Integer valor, boolean obrigatoria) {
        if (valor == null) {
            if (obrigatoria) {
                throw new RegraNegocioException("Dê uma nota de 1 a 5");
            }
            return 0;
        }
        if (valor < 1 || valor > 5) {
            throw new RegraNegocioException("A nota vai de 1 a 5");
        }
        return valor;
    }

    // ---------- loja ----------

    @Transactional(readOnly = true)
    public Resumo resumo(UUID tenant) {
        Object[] l = repository.resumo(tenant).get(0);
        long total = ((Number) l[0]).longValue();
        return new Resumo(total, media(l[1]), l[2] == null ? null : media(l[2]));
    }

    private static BigDecimal media(Object valor) {
        return new BigDecimal(String.valueOf(valor)).setScale(1, RoundingMode.HALF_UP);
    }

    @Transactional(readOnly = true)
    public PaginaResponse<AvaliacaoAdmin> listar(UUID tenant, Integer nota, boolean semResposta, int pagina, int tamanho) {
        int limitado = Math.min(Math.max(tamanho, 1), TAMANHO_MAXIMO_PAGINA);
        var resultado = repository.buscar(tenant, nota == null ? null : nota.shortValue(), semResposta, PageRequest.of(Math.max(pagina, 0), limitado));
        List<Long> ids = resultado.getContent().stream().map(T_Avaliacao::getIdPedido).toList();
        Map<Long, T_Pedido> pedidos = pedidoRepository.findAllById(ids).stream().collect(Collectors.toMap(T_Pedido::getId, Function.identity()));
        return PaginaResponse.of(resultado, a -> {
            T_Pedido p = pedidos.get(a.getIdPedido());
            return new AvaliacaoAdmin(a.getId(), a.getIdPedido(), p == null ? "—" : p.getNomeCliente(), a.getNotaLoja(),
                    a.getNotaEntrega() == null ? null : a.getNotaEntrega().intValue(), a.getComentario(), a.getCriadoEm(), a.getResposta(),
                    a.getRespondidaEm(), p == null ? null : p.getTipoEntrega().name());
        });
    }

    @Transactional
    public void responder(UUID tenant, Long id, String resposta) {
        T_Avaliacao a = repository.findByIdAndTenantAndDeletadoFalse(id, tenant)
                .orElseThrow(() -> new RecursoNaoEncontradoException("Avaliação não encontrada"));
        String texto = resposta == null ? null : resposta.trim();
        if (texto != null && texto.length() > 500) {
            throw new RegraNegocioException("A resposta pode ter até 500 caracteres");
        }
        a.setResposta(texto == null || texto.isEmpty() ? null : texto);
        a.setRespondidaEm(a.getResposta() == null ? null : LocalDateTime.now());
        repository.save(a);
    }
}
