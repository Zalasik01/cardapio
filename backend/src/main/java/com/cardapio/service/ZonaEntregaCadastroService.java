package com.cardapio.service;

import com.cardapio.dto.PaginaResponse;
import com.cardapio.dto.frete.ZonaCadastroRequest;
import com.cardapio.dto.frete.ZonaCadastroResponse;
import com.cardapio.entity.T_ZonaEntrega;
import com.cardapio.exception.RecursoNaoEncontradoException;
import com.cardapio.exception.RegraNegocioException;
import com.cardapio.repository.T_ZonaEntregaRepository;
import jakarta.persistence.criteria.Predicate;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.UUID;

/** CRUD das zonas de entrega (bairro, taxa e tempo estimado) da loja. */
@Service
@RequiredArgsConstructor
public class ZonaEntregaCadastroService {

    private static final int TAMANHO_MAXIMO_PAGINA = 50;
    private static final int TEMPO_PADRAO_MINUTOS = 45;

    private final T_ZonaEntregaRepository zonaRepository;

    @Transactional(readOnly = true)
    public PaginaResponse<ZonaCadastroResponse> buscar(UUID tenant, String busca, boolean mostrarInativos, int pagina, int tamanho) {
        int tamanhoLimitado = Math.min(Math.max(tamanho, 1), TAMANHO_MAXIMO_PAGINA);
        var resultado = zonaRepository.findAll(especificacao(tenant, busca, mostrarInativos),
                PageRequest.of(Math.max(pagina, 0), tamanhoLimitado));
        return PaginaResponse.of(resultado, ZonaCadastroResponse::of);
    }

    @Transactional(readOnly = true)
    public ZonaCadastroResponse obter(UUID tenant, Long id) {
        return ZonaCadastroResponse.of(buscarZona(tenant, id));
    }

    @Transactional
    public ZonaCadastroResponse criar(UUID tenant, ZonaCadastroRequest request) {
        validarBairroLivre(tenant, request.bairro(), null);
        T_ZonaEntrega zona = T_ZonaEntrega.builder().tenant(tenant).build();
        preencher(zona, request);
        return ZonaCadastroResponse.of(zonaRepository.save(zona));
    }

    @Transactional
    public ZonaCadastroResponse atualizar(UUID tenant, Long id, ZonaCadastroRequest request) {
        T_ZonaEntrega zona = buscarZona(tenant, id);
        validarBairroLivre(tenant, request.bairro(), id);
        preencher(zona, request);
        return ZonaCadastroResponse.of(zonaRepository.save(zona));
    }

    @Transactional
    public void alterarAtivo(UUID tenant, Long id, boolean ativo) {
        T_ZonaEntrega zona = buscarZona(tenant, id);
        zona.setAtivo(ativo);
        zonaRepository.save(zona);
    }

    /** Exclusão definitiva: nenhum outro cadastro aponta para a zona (o frete lê a taxa dela na hora do pedido). */
    @Transactional
    public void excluir(UUID tenant, Long id) {
        zonaRepository.delete(buscarZona(tenant, id));
    }

    private T_ZonaEntrega buscarZona(UUID tenant, Long id) {
        return zonaRepository.findByIdAndTenantAndDeletadoFalse(id, tenant)
                .orElseThrow(() -> new RecursoNaoEncontradoException("Zona de entrega não encontrada"));
    }

    private void validarBairroLivre(UUID tenant, String bairro, Long id) {
        boolean emUso = id == null
                ? zonaRepository.existsByTenantAndBairroIgnoreCaseAndDeletadoFalse(tenant, bairro.trim())
                : zonaRepository.existsByTenantAndBairroIgnoreCaseAndDeletadoFalseAndIdNot(tenant, bairro.trim(), id);
        if (emUso) {
            throw new RegraNegocioException("Já existe uma zona de entrega para este bairro");
        }
    }

    private void preencher(T_ZonaEntrega zona, ZonaCadastroRequest r) {
        zona.setBairro(r.bairro().trim());
        zona.setTaxa(r.taxa());
        zona.setTempoEstimadoMinutos(r.tempoEstimadoMinutos() != null ? r.tempoEstimadoMinutos() : TEMPO_PADRAO_MINUTOS);
        if (r.ativo() != null) {
            zona.setAtivo(r.ativo());
        }
    }

    private Specification<T_ZonaEntrega> especificacao(UUID tenant, String busca, boolean mostrarInativos) {
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
                filtros.add(cb.like(cb.lower(root.get("bairro")), padrao, '\\'));
            }
            if (query.getResultType() != Long.class) {
                query.orderBy(cb.asc(cb.lower(root.get("bairro"))));
            }
            return cb.and(filtros.toArray(new Predicate[0]));
        };
    }
}
