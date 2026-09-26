package com.cardapio.service;

import com.cardapio.entity.S_ClienteConta;
import com.cardapio.entity.T_FidelidadeConfig;
import com.cardapio.entity.T_FidelidadeMovimento;
import com.cardapio.entity.T_Pedido;
import com.cardapio.exception.RegraNegocioException;
import com.cardapio.repository.T_FidelidadeConfigRepository;
import com.cardapio.repository.T_FidelidadeMovimentoRepository;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Fidelidade (cashback). O cliente ganha um percentual dos itens quando o pedido é entregue; o valor vira um lote com
 * validade. No checkout ele pode usar o saldo (começando pelos lotes que vencem primeiro), dentro dos limites da loja.
 */
@Service
@RequiredArgsConstructor
public class FidelidadeService {

    private final T_FidelidadeConfigRepository configRepository;
    private final T_FidelidadeMovimentoRepository movimentoRepository;

    public record ConfigRequest(boolean programaAtivo, BigDecimal percentual, Integer validadeDias, BigDecimal resgateMinimo, BigDecimal resgateMaximoPct) {
    }

    public record ConfigResponse(boolean programaAtivo, BigDecimal percentual, int validadeDias, BigDecimal resgateMinimo, BigDecimal resgateMaximoPct) {
        static ConfigResponse of(T_FidelidadeConfig c) {
            return new ConfigResponse(c.isProgramaAtivo(), c.getPercentual(), c.getValidadeDias(), c.getResgateMinimo(), c.getResgateMaximoPct());
        }
    }

    public record Vencimento(BigDecimal valor, LocalDateTime data) {
    }

    public record Lancamento(String tipo, BigDecimal valor, LocalDateTime data, Long pedido) {
    }

    /** O que o cliente vê: saldo, próximo vencimento, regras e as últimas movimentações. */
    public record Carteira(boolean ativo, BigDecimal percentual, BigDecimal saldo, Vencimento proximoVencimento, BigDecimal resgateMinimo,
                           BigDecimal resgateMaximoPct, List<Lancamento> extrato) {
    }

    // ---------- configuração da loja ----------

    @Transactional
    public ConfigResponse config(UUID tenant) {
        return ConfigResponse.of(configuracao(tenant));
    }

    @Transactional
    public ConfigResponse salvar(UUID tenant, ConfigRequest r) {
        if (r.percentual() == null || r.percentual().signum() < 0 || r.percentual().compareTo(BigDecimal.valueOf(100)) > 0) {
            throw new RegraNegocioException("O percentual de cashback deve ficar entre 0 e 100");
        }
        if (r.validadeDias() == null || r.validadeDias() < 1 || r.validadeDias() > 730) {
            throw new RegraNegocioException("A validade do cashback deve ser de 1 a 730 dias");
        }
        BigDecimal maximo = r.resgateMaximoPct() == null ? BigDecimal.valueOf(100) : r.resgateMaximoPct();
        if (maximo.signum() <= 0 || maximo.compareTo(BigDecimal.valueOf(100)) > 0) {
            throw new RegraNegocioException("O máximo do pedido pago com cashback deve ficar entre 1 e 100%");
        }
        T_FidelidadeConfig c = configuracao(tenant);
        c.setProgramaAtivo(r.programaAtivo());
        c.setPercentual(r.percentual());
        c.setValidadeDias(r.validadeDias());
        c.setResgateMinimo(r.resgateMinimo() == null ? BigDecimal.ZERO : r.resgateMinimo());
        c.setResgateMaximoPct(maximo);
        return ConfigResponse.of(configRepository.save(c));
    }

    private T_FidelidadeConfig configuracao(UUID tenant) {
        return configRepository.findByTenant(tenant).orElseGet(() -> configRepository.save(T_FidelidadeConfig.builder().tenant(tenant)
                .programaAtivo(false).percentual(BigDecimal.valueOf(5)).validadeDias(90).resgateMinimo(BigDecimal.ZERO)
                .resgateMaximoPct(BigDecimal.valueOf(50)).build()));
    }

    // ---------- cliente ----------

    @Transactional(readOnly = true)
    public boolean ativo(UUID tenant) {
        return configRepository.findByTenant(tenant).map(T_FidelidadeConfig::isProgramaAtivo).orElse(false);
    }

    @Transactional(readOnly = true)
    public BigDecimal percentual(UUID tenant) {
        return configRepository.findByTenant(tenant).filter(T_FidelidadeConfig::isProgramaAtivo).map(T_FidelidadeConfig::getPercentual).orElse(null);
    }

    @Transactional(readOnly = true)
    public BigDecimal saldo(UUID tenant, Long conta) {
        return movimentoRepository.lotesValidos(tenant, conta, LocalDateTime.now()).stream()
                .map(T_FidelidadeMovimento::getRestante).reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    @Transactional(readOnly = true)
    public Carteira carteira(UUID tenant, S_ClienteConta conta) {
        var cfg = configRepository.findByTenant(tenant).orElse(null);
        var lotes = movimentoRepository.lotesValidos(tenant, conta.getId(), LocalDateTime.now());
        BigDecimal saldo = lotes.stream().map(T_FidelidadeMovimento::getRestante).reduce(BigDecimal.ZERO, BigDecimal::add);
        Vencimento proximo = lotes.stream().filter(l -> l.getExpiraEm() != null).findFirst()
                .map(l -> new Vencimento(l.getRestante(), l.getExpiraEm())).orElse(null);
        var extrato = movimentoRepository.extrato(tenant, conta.getId(), PageRequest.of(0, 15)).stream()
                .map(m -> new Lancamento(m.getTipo(), m.getValor(), m.getCriadoEm(), m.getIdPedido())).toList();
        return new Carteira(cfg != null && cfg.isProgramaAtivo(), cfg == null ? null : cfg.getPercentual(), saldo, proximo,
                cfg == null ? BigDecimal.ZERO : cfg.getResgateMinimo(), cfg == null ? BigDecimal.valueOf(50) : cfg.getResgateMaximoPct(), extrato);
    }

    /**
     * Quanto do saldo pode ser usado agora num pedido cujos itens (já com desconto de cupom) valem "baseItens":
     * limitado ao saldo, ao teto da loja e a esse valor; zero se o saldo não alcança o mínimo de resgate.
     */
    @Transactional(readOnly = true)
    public BigDecimal resgatavel(UUID tenant, Long conta, BigDecimal baseItens) {
        var cfg = configRepository.findByTenant(tenant).filter(T_FidelidadeConfig::isProgramaAtivo).orElse(null);
        if (cfg == null) {
            return BigDecimal.ZERO;
        }
        BigDecimal saldo = saldo(tenant, conta);
        if (saldo.compareTo(cfg.getResgateMinimo()) < 0) {
            return BigDecimal.ZERO;
        }
        BigDecimal teto = baseItens.multiply(cfg.getResgateMaximoPct()).divide(BigDecimal.valueOf(100), 2, RoundingMode.DOWN);
        return saldo.min(teto).min(baseItens).max(BigDecimal.ZERO).setScale(2, RoundingMode.DOWN);
    }

    /** Consome o saldo dos lotes que vencem primeiro e registra o resgate no extrato. */
    @Transactional
    public void resgatar(UUID tenant, Long conta, BigDecimal valor, Long idPedido) {
        BigDecimal falta = valor;
        for (T_FidelidadeMovimento lote : movimentoRepository.lotesValidos(tenant, conta, LocalDateTime.now())) {
            if (falta.signum() <= 0) {
                break;
            }
            BigDecimal usa = lote.getRestante().min(falta);
            lote.setRestante(lote.getRestante().subtract(usa));
            movimentoRepository.save(lote);
            falta = falta.subtract(usa);
        }
        if (falta.signum() > 0) {
            throw new RegraNegocioException("Saldo de cashback insuficiente");
        }
        movimentoRepository.save(T_FidelidadeMovimento.builder().tenant(tenant).idClienteConta(conta).tipo("RESGATE")
                .valor(valor.negate()).restante(BigDecimal.ZERO).idPedido(idPedido).criadoEm(LocalDateTime.now()).build());
    }

    /** Pedido entregue: o cliente ganha o cashback (uma única vez por pedido). */
    @Transactional
    public void creditarPedidoEntregue(T_Pedido pedido) {
        if (pedido.getIdClienteConta() == null || movimentoRepository.existsByIdPedidoAndTipo(pedido.getId(), "GANHO")) {
            return;
        }
        var cfg = configRepository.findByTenant(pedido.getTenant()).filter(T_FidelidadeConfig::isProgramaAtivo).orElse(null);
        if (cfg == null || cfg.getPercentual().signum() <= 0) {
            return;
        }
        BigDecimal base = pedido.getSubtotal().subtract(pedido.getDesconto() == null ? BigDecimal.ZERO : pedido.getDesconto())
                .subtract(pedido.getCashbackUsado() == null ? BigDecimal.ZERO : pedido.getCashbackUsado());
        BigDecimal ganho = base.multiply(cfg.getPercentual()).divide(BigDecimal.valueOf(100), 2, RoundingMode.DOWN);
        if (ganho.signum() <= 0) {
            return;
        }
        movimentoRepository.save(T_FidelidadeMovimento.builder().tenant(pedido.getTenant()).idClienteConta(pedido.getIdClienteConta()).tipo("GANHO")
                .valor(ganho).restante(ganho).expiraEm(LocalDateTime.now().plusDays(cfg.getValidadeDias())).idPedido(pedido.getId())
                .criadoEm(LocalDateTime.now()).build());
    }

    /** Pedido cancelado: o cashback que o cliente tinha usado volta (com nova validade). */
    @Transactional
    public void estornarPedidoCancelado(T_Pedido pedido) {
        BigDecimal usado = pedido.getCashbackUsado();
        if (pedido.getIdClienteConta() == null || usado == null || usado.signum() <= 0
                || movimentoRepository.existsByIdPedidoAndTipo(pedido.getId(), "ESTORNO")) {
            return;
        }
        int dias = configRepository.findByTenant(pedido.getTenant()).map(T_FidelidadeConfig::getValidadeDias).orElse(90);
        movimentoRepository.save(T_FidelidadeMovimento.builder().tenant(pedido.getTenant()).idClienteConta(pedido.getIdClienteConta()).tipo("ESTORNO")
                .valor(usado).restante(usado).expiraEm(LocalDateTime.now().plusDays(dias)).idPedido(pedido.getId()).criadoEm(LocalDateTime.now()).build());
    }
}
