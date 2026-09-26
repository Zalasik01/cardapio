package com.cardapio.service;

import com.cardapio.dto.PaginaResponse;
import com.cardapio.dto.cupom.CupomDtos.CupomAplicado;
import com.cardapio.dto.cupom.CupomDtos.CupomRequest;
import com.cardapio.dto.cupom.CupomDtos.CupomResponse;
import com.cardapio.dto.cupom.CupomDtos.ValidarCupomRequest;
import com.cardapio.entity.S_ClienteConta;
import com.cardapio.entity.StatusPedido;
import com.cardapio.entity.T_Cupom;
import com.cardapio.entity.T_CupomUso;
import com.cardapio.entity.T_Produto;
import com.cardapio.entity.TipoCupom;
import com.cardapio.entity.TipoEntrega;
import com.cardapio.exception.RecursoNaoEncontradoException;
import com.cardapio.exception.RegraNegocioException;
import com.cardapio.repository.T_CupomRepository;
import com.cardapio.repository.T_CupomUsoRepository;
import com.cardapio.repository.T_PedidoRepository;
import com.cardapio.repository.T_ProdutoRepository;
import jakarta.persistence.criteria.Predicate;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** Cupons: cadastro da loja e a conferência (no servidor) das regras de uso quando o cliente aplica o código. */
@Service
@RequiredArgsConstructor
public class CupomService {

    private static final int TAMANHO_MAXIMO_PAGINA = 50;

    private final T_CupomRepository repository;
    private final T_CupomUsoRepository usoRepository;
    private final T_PedidoRepository pedidoRepository;
    private final T_ProdutoRepository produtoRepository;

    /** Um item do pedido para efeito de desconto. */
    public record ItemAvaliacao(T_Produto produto, int quantidade) {
        BigDecimal total() {
            return produto.precoVenda().multiply(BigDecimal.valueOf(quantidade));
        }
    }

    public record Resultado(T_Cupom cupom, BigDecimal desconto) {
    }

    // ---------- cadastro ----------

    @Transactional(readOnly = true)
    public PaginaResponse<CupomResponse> buscar(UUID tenant, String busca, boolean mostrarInativos, int pagina, int tamanho) {
        int limitado = Math.min(Math.max(tamanho, 1), TAMANHO_MAXIMO_PAGINA);
        var resultado = repository.findAll(especificacao(tenant, busca, mostrarInativos), PageRequest.of(Math.max(pagina, 0), limitado));
        return PaginaResponse.of(resultado, c -> CupomResponse.of(c, usoRepository.countByIdCupom(c.getId())));
    }

    @Transactional(readOnly = true)
    public CupomResponse obter(UUID tenant, Long id) {
        T_Cupom c = buscarCupom(tenant, id);
        return CupomResponse.of(c, usoRepository.countByIdCupom(id));
    }

    @Transactional
    public CupomResponse criar(UUID tenant, CupomRequest r) {
        String codigo = normalizar(r.codigo());
        if (repository.existsByTenantAndCodigoIgnoreCaseAndDeletadoFalse(tenant, codigo)) {
            throw new RegraNegocioException("Já existe um cupom com este código");
        }
        T_Cupom cupom = T_Cupom.builder().tenant(tenant).build();
        preencher(cupom, r, codigo);
        return CupomResponse.of(repository.save(cupom), 0);
    }

    @Transactional
    public CupomResponse atualizar(UUID tenant, Long id, CupomRequest r) {
        T_Cupom cupom = buscarCupom(tenant, id);
        String codigo = normalizar(r.codigo());
        if (repository.existsByTenantAndCodigoIgnoreCaseAndDeletadoFalseAndIdNot(tenant, codigo, id)) {
            throw new RegraNegocioException("Já existe um cupom com este código");
        }
        preencher(cupom, r, codigo);
        return CupomResponse.of(repository.save(cupom), usoRepository.countByIdCupom(id));
    }

    @Transactional
    public void alterarAtivo(UUID tenant, Long id, boolean ativo) {
        T_Cupom cupom = buscarCupom(tenant, id);
        cupom.setAtivo(ativo);
        repository.save(cupom);
    }

    @Transactional
    public void excluir(UUID tenant, Long id) {
        T_Cupom cupom = buscarCupom(tenant, id);
        cupom.setDeletado(true);
        cupom.setAtivo(false);
        repository.save(cupom);
    }

    // ---------- uso pelo cliente ----------

    /** Confere o cupom para o carrinho (sem gravar nada): usado pelo botão "Aplicar" do checkout. */
    @Transactional(readOnly = true)
    public CupomAplicado validar(S_ClienteConta conta, ValidarCupomRequest request) {
        List<ItemAvaliacao> itens = request.itens().stream().map(i -> new ItemAvaliacao(
                produtoRepository.findByGuidAndTenant(i.produtoGuid(), request.tenant())
                        .orElseThrow(() -> new RecursoNaoEncontradoException("Produto não encontrado")), i.quantidade())).toList();
        BigDecimal taxa = request.taxaEntrega() == null ? BigDecimal.ZERO : request.taxaEntrega();
        Resultado r = avaliar(request.tenant(), request.codigo(), conta, request.tipoEntrega(), itens, taxa);
        return new CupomAplicado(r.cupom().getCodigo(), r.cupom().getDescricao(), r.desconto());
    }

    /** Regras de uso; lança RegraNegocioException com o motivo em português quando o cupom não vale. */
    @Transactional(readOnly = true)
    public Resultado avaliar(UUID tenant, String codigoDigitado, S_ClienteConta conta, TipoEntrega tipoEntrega,
                             List<ItemAvaliacao> itens, BigDecimal taxaEntrega) {
        T_Cupom c = repository.findByTenantAndCodigoIgnoreCaseAndDeletadoFalse(tenant, normalizar(codigoDigitado))
                .filter(T_Cupom::isAtivo).orElseThrow(() -> new RegraNegocioException("Cupom não encontrado"));
        LocalDateTime agora = LocalDateTime.now();
        if (c.getInicio() != null && agora.isBefore(c.getInicio())) {
            throw new RegraNegocioException("Este cupom ainda não começou");
        }
        if (c.getFim() != null && agora.isAfter(c.getFim())) {
            throw new RegraNegocioException("Este cupom expirou");
        }
        if (c.getTipoEntrega() != null && c.getTipoEntrega() != tipoEntrega) {
            throw new RegraNegocioException(c.getTipoEntrega() == TipoEntrega.ENTREGA
                    ? "Este cupom vale só para entrega" : "Este cupom vale só para retirada");
        }
        if (c.getLimiteTotal() != null && usoRepository.countByIdCupom(c.getId()) >= c.getLimiteTotal()) {
            throw new RegraNegocioException("Este cupom já atingiu o limite de usos");
        }
        if (c.getLimitePorCliente() != null && usoRepository.countByIdCupomAndIdClienteConta(c.getId(), conta.getId()) >= c.getLimitePorCliente()) {
            throw new RegraNegocioException("Você já usou este cupom o máximo de vezes permitido");
        }
        if (c.isPrimeiroPedido() && pedidoRepository.countByIdClienteContaAndTenantAndDeletadoFalseAndStatusNot(
                conta.getId(), tenant, StatusPedido.CANCELADO) > 0) {
            throw new RegraNegocioException("Este cupom vale só no primeiro pedido");
        }

        BigDecimal subtotal = itens.stream().map(ItemAvaliacao::total).reduce(BigDecimal.ZERO, BigDecimal::add);
        if (c.getValorMinimo() != null && subtotal.compareTo(c.getValorMinimo()) < 0) {
            throw new RegraNegocioException("Pedido mínimo de R$ " + formatar(c.getValorMinimo()) + " para este cupom");
        }
        if (!c.isCumulativo() && itens.stream().anyMatch(i -> i.produto().emPromocao())) {
            throw new RegraNegocioException("Este cupom não vale em pedidos com produtos em promoção");
        }

        BigDecimal elegivel = c.getIdCategoria() == null ? subtotal : itens.stream()
                .filter(i -> i.produto().getCategoria() != null && c.getIdCategoria().equals(i.produto().getCategoria().getId()))
                .map(ItemAvaliacao::total).reduce(BigDecimal.ZERO, BigDecimal::add);
        if (c.getIdCategoria() != null && elegivel.signum() == 0) {
            throw new RegraNegocioException("Este cupom vale só para itens de uma categoria específica que não está no pedido");
        }

        BigDecimal desconto = switch (c.getTipo()) {
            case PERCENTUAL -> elegivel.multiply(c.getValor()).divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
            case VALOR -> c.getValor().min(elegivel);
            case FRETE_GRATIS -> {
                if (tipoEntrega != TipoEntrega.ENTREGA) {
                    throw new RegraNegocioException("Frete grátis vale só para entrega");
                }
                yield taxaEntrega == null ? BigDecimal.ZERO : taxaEntrega;
            }
        };
        if (c.getDescontoMaximo() != null && c.getTipo() != TipoCupom.FRETE_GRATIS) {
            desconto = desconto.min(c.getDescontoMaximo());
        }
        desconto = desconto.setScale(2, RoundingMode.HALF_UP);
        if (desconto.signum() <= 0) {
            throw new RegraNegocioException("Este cupom não gera desconto neste pedido");
        }
        return new Resultado(c, desconto);
    }

    /** Registra o uso depois que o pedido é gravado. */
    @Transactional
    public void registrarUso(T_Cupom cupom, Long idPedido, Long idClienteConta, BigDecimal desconto) {
        usoRepository.save(T_CupomUso.builder().tenant(cupom.getTenant()).idCupom(cupom.getId()).idPedido(idPedido)
                .idClienteConta(idClienteConta).valorDesconto(desconto).dataUso(LocalDateTime.now()).build());
    }

    // ---------- apoio ----------

    private static String normalizar(String codigo) {
        return codigo == null ? "" : codigo.trim().replaceAll("\\s+", "").toUpperCase(Locale.ROOT);
    }

    private static String formatar(BigDecimal v) {
        return v.setScale(2, RoundingMode.HALF_UP).toPlainString().replace('.', ',');
    }

    private T_Cupom buscarCupom(UUID tenant, Long id) {
        return repository.findByIdAndTenantAndDeletadoFalse(id, tenant)
                .orElseThrow(() -> new RecursoNaoEncontradoException("Cupom não encontrado"));
    }

    private void preencher(T_Cupom c, CupomRequest r, String codigo) {
        if (r.tipo() == TipoCupom.PERCENTUAL && (r.valor() == null || r.valor().signum() <= 0 || r.valor().compareTo(BigDecimal.valueOf(100)) > 0)) {
            throw new RegraNegocioException("Informe um percentual entre 0 e 100");
        }
        if (r.tipo() == TipoCupom.VALOR && (r.valor() == null || r.valor().signum() <= 0)) {
            throw new RegraNegocioException("Informe o valor do desconto");
        }
        if (r.inicio() != null && r.fim() != null && r.fim().isBefore(r.inicio())) {
            throw new RegraNegocioException("O fim da validade não pode ser antes do início");
        }
        c.setCodigo(codigo);
        c.setDescricao(r.descricao() == null || r.descricao().isBlank() ? null : r.descricao().trim());
        c.setTipo(r.tipo());
        c.setValor(r.tipo() == TipoCupom.FRETE_GRATIS || r.valor() == null ? BigDecimal.ZERO : r.valor());
        c.setValorMinimo(r.valorMinimo());
        c.setDescontoMaximo(r.descontoMaximo());
        c.setInicio(r.inicio());
        c.setFim(r.fim());
        c.setLimiteTotal(r.limiteTotal());
        c.setLimitePorCliente(r.limitePorCliente());
        c.setPrimeiroPedido(Boolean.TRUE.equals(r.primeiroPedido()));
        c.setTipoEntrega(r.tipoEntrega());
        c.setIdCategoria(r.idCategoria());
        c.setCumulativo(r.cumulativo() == null || r.cumulativo());
        if (r.ativo() != null) {
            c.setAtivo(r.ativo());
        }
    }

    private Specification<T_Cupom> especificacao(UUID tenant, String busca, boolean mostrarInativos) {
        return (root, query, cb) -> {
            List<Predicate> filtros = new ArrayList<>();
            filtros.add(cb.equal(root.get("tenant"), tenant));
            filtros.add(cb.isFalse(root.get("deletado")));
            if (!mostrarInativos) {
                filtros.add(cb.isTrue(root.get("ativo")));
            }
            if (busca != null && !busca.isBlank()) {
                String padrao = "%" + busca.trim().toLowerCase(Locale.ROOT)
                        .replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_") + "%";
                filtros.add(cb.or(cb.like(cb.lower(root.get("codigo")), padrao, '\\'), cb.like(cb.lower(root.get("descricao")), padrao, '\\')));
            }
            if (query.getResultType() != Long.class) {
                query.orderBy(cb.asc(cb.lower(root.get("codigo"))));
            }
            return cb.and(filtros.toArray(new Predicate[0]));
        };
    }
}
