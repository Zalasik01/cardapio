package com.cardapio.service;

import com.cardapio.entity.StatusPedido;
import com.cardapio.entity.T_Avaliacao;
import com.cardapio.entity.T_Pedido;
import com.cardapio.entity.T_Pessoa;
import com.cardapio.exception.RecursoNaoEncontradoException;
import com.cardapio.repository.T_AvaliacaoRepository;
import com.cardapio.repository.T_PedidoRepository;
import com.cardapio.repository.T_PessoaRepository;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** Perfil do cliente para a loja: quanto pediu, gastou, o que avaliou e o cashback, mais os pedidos mais recentes. */
@Service
@RequiredArgsConstructor
public class PerfilClienteService {

    private static final int LIMITE_PEDIDOS = 50;

    private final T_PessoaRepository pessoaRepository;
    private final PessoaContatoService contatoService;
    private final T_PedidoRepository pedidoRepository;
    private final T_AvaliacaoRepository avaliacaoRepository;
    private final FidelidadeService fidelidadeService;

    public record PedidoDoCliente(Long id, LocalDateTime data, String status, String tipoEntrega, BigDecimal total, String cupom) {
    }

    public record PerfilCliente(long totalPedidos, long cancelados, BigDecimal totalGasto, BigDecimal ticketMedio, LocalDateTime primeiroPedido,
                                LocalDateTime ultimoPedido, long cuponsUsados, long avaliacoes, BigDecimal mediaAvaliacoes, BigDecimal cashback,
                                boolean temContaApp, List<PedidoDoCliente> pedidos) {
    }

    @Transactional(readOnly = true)
    public PerfilCliente perfil(UUID tenant, Long pessoaId) {
        T_Pessoa pessoa = pessoaRepository.findByIdAndTenantAndDeletadoFalse(pessoaId, tenant)
                .orElseThrow(() -> new RecursoNaoEncontradoException("Cliente não encontrado"));
        Set<String> telefones = new HashSet<>();
        contatoService.telefones(pessoa.getId()).forEach(t -> {
            String d = t.numero().replaceAll("\\D", "");
            if (!d.isEmpty()) {
                telefones.add(d);
            }
        });
        if (telefones.isEmpty()) {
            telefones.add("sem-telefone");
        }
        List<T_Pedido> pedidos = pedidoRepository.pedidosDoClienteDaLoja(tenant, telefones, pessoa.getIdClienteConta(), PageRequest.of(0, LIMITE_PEDIDOS));
        var validos = pedidos.stream().filter(p -> p.getStatus() != StatusPedido.CANCELADO).toList();
        BigDecimal gasto = validos.stream().map(T_Pedido::getTotal).reduce(BigDecimal.ZERO, BigDecimal::add).setScale(2, RoundingMode.HALF_UP);
        BigDecimal ticket = validos.isEmpty() ? BigDecimal.ZERO : gasto.divide(BigDecimal.valueOf(validos.size()), 2, RoundingMode.HALF_UP);
        List<T_Avaliacao> avaliacoes = pedidos.stream().map(p -> avaliacaoRepository.findByIdPedidoAndDeletadoFalse(p.getId()))
                .flatMap(java.util.Optional::stream).toList();
        BigDecimal media = avaliacoes.isEmpty() ? null : BigDecimal.valueOf(avaliacoes.stream().mapToInt(a -> a.getNotaLoja()).average().orElse(0))
                .setScale(1, RoundingMode.HALF_UP);
        BigDecimal cashback = pessoa.getIdClienteConta() == null ? BigDecimal.ZERO : fidelidadeService.saldo(tenant, pessoa.getIdClienteConta());
        return new PerfilCliente(validos.size(), pedidos.size() - validos.size(), gasto, ticket,
                pedidos.isEmpty() ? null : pedidos.get(pedidos.size() - 1).getDataCriacao(), pedidos.isEmpty() ? null : pedidos.get(0).getDataCriacao(),
                pedidos.stream().filter(p -> p.getCodigoCupom() != null).count(), avaliacoes.size(), media, cashback,
                pessoa.getIdClienteConta() != null,
                pedidos.stream().limit(15).map(p -> new PedidoDoCliente(p.getId(), p.getDataCriacao(), p.getStatus().name(), p.getTipoEntrega().name(),
                        p.getTotal(), p.getCodigoCupom())).toList());
    }
}
