package com.cardapio.service;

import com.cardapio.dto.pedido.PagamentoRequest;
import com.cardapio.dto.pedido.PedidoAdminResponse;
import com.cardapio.entity.T_FormaPagamento;
import com.cardapio.entity.T_PedidoPagamento;
import com.cardapio.entity.TipoEntrega;
import com.cardapio.entity.TipoFormaPagamento;
import com.cardapio.exception.RegraNegocioException;
import com.cardapio.repository.T_FormaPagamentoRepository;
import com.cardapio.repository.T_PedidoPagamentoRepository;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.text.NumberFormat;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

/**
 * Pagamento dividido: valida as partes do pagamento de um pedido, calcula a taxa de cada forma (percentual sobre a
 * parte que ela paga, mais a taxa fixa) e o troco do dinheiro. A soma das partes tem de ser igual ao valor do pedido
 * (itens - desconto + entrega); as taxas das formas são somadas ao total.
 */
@Service
@RequiredArgsConstructor
public class PagamentoPedidoService {

    private final T_FormaPagamentoRepository formaRepository;
    private final T_PedidoPagamentoRepository pagamentoRepository;

    /** Pagamentos já validados e calculados, ainda não gravados. nomes é o texto para telas antigas (ex.: "PIX, Dinheiro"). */
    public record Preparado(List<T_PedidoPagamento> linhas, BigDecimal taxaTotal, String nomes) {
        public static Preparado vazio() {
            return new Preparado(List.of(), BigDecimal.ZERO, null);
        }

        public boolean temPagamentos() {
            return !linhas.isEmpty();
        }
    }

    public Preparado preparar(UUID tenant, TipoEntrega tipo, List<PagamentoRequest> partes, BigDecimal base) {
        if (partes == null || partes.isEmpty()) {
            return Preparado.vazio();
        }
        BigDecimal soma = BigDecimal.ZERO;
        BigDecimal taxaTotal = BigDecimal.ZERO;
        Set<Long> usadas = new HashSet<>();
        List<T_PedidoPagamento> linhas = new ArrayList<>();
        for (PagamentoRequest parte : partes) {
            if (!usadas.add(parte.formaId())) {
                throw new RegraNegocioException("Use cada forma de pagamento uma vez só");
            }
            T_FormaPagamento forma = formaRepository.findByIdAndTenantAndDeletadoFalse(parte.formaId(), tenant)
                    .filter(T_FormaPagamento::isAtivo)
                    .orElseThrow(() -> new RegraNegocioException("Forma de pagamento não encontrada ou inativa"));
            boolean aceita = tipo == TipoEntrega.ENTREGA ? forma.isAceitaEntrega() : forma.isAceitaRetirada();
            if (!aceita) {
                throw new RegraNegocioException("\"" + forma.getNome() + "\" não vale para pedidos de "
                        + (tipo == TipoEntrega.ENTREGA ? "entrega" : "retirada"));
            }
            if (forma.getValorMinimo() != null && base.compareTo(forma.getValorMinimo()) < 0) {
                throw new RegraNegocioException("\"" + forma.getNome() + "\" exige pedido de no mínimo " + moeda(forma.getValorMinimo()));
            }
            BigDecimal valor = parte.valor().setScale(2, RoundingMode.HALF_UP);
            BigDecimal taxa = valor.multiply(forma.getTaxaPercentual()).divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP)
                    .add(forma.getTaxaFixa()).setScale(2, RoundingMode.HALF_UP);
            BigDecimal recebido = null;
            if (forma.getTipo() == TipoFormaPagamento.DINHEIRO && parte.valorRecebido() != null) {
                recebido = parte.valorRecebido().setScale(2, RoundingMode.HALF_UP);
                if (recebido.compareTo(valor.add(taxa)) < 0) {
                    throw new RegraNegocioException("O valor recebido em dinheiro é menor que o valor a pagar (" + moeda(valor.add(taxa)) + ")");
                }
            }
            T_PedidoPagamento linha = new T_PedidoPagamento();
            linha.setTenant(tenant);
            linha.setIdFormaPagamento(forma.getId());
            linha.setFormaNome(forma.getNome());
            linha.setTipo(forma.getTipo());
            linha.setValor(valor);
            linha.setTaxa(taxa);
            linha.setValorRecebido(recebido);
            linhas.add(linha);
            soma = soma.add(valor);
            taxaTotal = taxaTotal.add(taxa);
        }
        if (soma.compareTo(base.setScale(2, RoundingMode.HALF_UP)) != 0) {
            throw new RegraNegocioException("A soma dos pagamentos (" + moeda(soma) + ") deve ser igual ao valor do pedido ("
                    + moeda(base) + ")");
        }
        String nomes = String.join(", ", linhas.stream().map(T_PedidoPagamento::getFormaNome).toList());
        return new Preparado(linhas, taxaTotal, nomes);
    }

    /** Grava os pagamentos do pedido (apaga os antigos: a lista é sempre a versão completa). */
    public void persistir(Long idPedido, UUID tenant, Preparado preparado) {
        pagamentoRepository.apagarDoPedido(idPedido);
        pagamentoRepository.flush();
        preparado.linhas().forEach(linha -> {
            linha.setIdPedido(idPedido);
            linha.setTenant(tenant);
        });
        pagamentoRepository.saveAll(preparado.linhas());
    }

    public List<T_PedidoPagamento> doPedido(Long idPedido) {
        return pagamentoRepository.findByIdPedidoOrderByIdAsc(idPedido);
    }

    /** Texto do que foi pago, para o histórico de edição (ex.: "PIX R$ 20,00 + Dinheiro R$ 16,00"). */
    public String descrever(List<T_PedidoPagamento> linhas) {
        if (linhas.isEmpty()) {
            return "sem pagamento informado";
        }
        return String.join(" + ", linhas.stream().map(l -> l.getFormaNome() + " " + moeda(l.getValor())).toList());
    }

    public static PedidoAdminResponse.Pagamento resposta(T_PedidoPagamento p) {
        BigDecimal troco = p.getValorRecebido() == null ? null : p.getValorRecebido().subtract(p.getValor().add(p.getTaxa()));
        return new PedidoAdminResponse.Pagamento(p.getIdFormaPagamento(), p.getFormaNome(), p.getTipo(), p.getValor(), p.getTaxa(),
                p.getValorRecebido(), troco);
    }

    private String moeda(BigDecimal valor) {
        return NumberFormat.getCurrencyInstance(new Locale("pt", "BR")).format(valor);
    }
}
