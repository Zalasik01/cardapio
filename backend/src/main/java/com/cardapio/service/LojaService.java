package com.cardapio.service;

import com.cardapio.dto.loja.LojaRequest;
import com.cardapio.entity.S_Loja;
import com.cardapio.exception.RecursoNaoEncontradoException;
import com.cardapio.exception.RegraNegocioException;
import com.cardapio.repository.S_LojaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class LojaService {

    private final S_LojaRepository lojaRepository;

    public S_Loja buscarPorTenant(UUID tenant) {
        return lojaRepository.findByGuid(tenant)
                .orElseThrow(() -> new RecursoNaoEncontradoException("Loja não encontrada: " + tenant));
    }

    public S_Loja buscarPorSlug(String slug) {
        return lojaRepository.findBySlug(slug)
                .orElseThrow(() -> new RecursoNaoEncontradoException("Loja não encontrada: " + slug));
    }

    @Transactional
    public S_Loja criar(LojaRequest request) {
        if (lojaRepository.existsBySlug(request.slug())) {
            throw new RegraNegocioException("Já existe uma loja com o slug: " + request.slug());
        }

        S_Loja loja = S_Loja.builder()
                .nome(request.nome())
                .slug(request.slug())
                .tipoOrganizacao(request.tipoOrganizacao())
                .descricao(request.descricao())
                .telefone(request.telefone())
                .logoUrl(request.logoUrl())
                .enderecoRua(request.enderecoRua())
                .enderecoNumero(request.enderecoNumero())
                .enderecoBairro(request.enderecoBairro())
                .enderecoCidade(request.enderecoCidade())
                .enderecoEstado(request.enderecoEstado())
                .enderecoCep(request.enderecoCep())
                .latitude(request.latitude())
                .longitude(request.longitude())
                .taxaEntregaBase(request.taxaEntregaBase() != null ? request.taxaEntregaBase() : BigDecimal.ZERO)
                .taxaEntregaPorKm(request.taxaEntregaPorKm() != null ? request.taxaEntregaPorKm() : BigDecimal.ZERO)
                .distanciaMaximaEntregaKm(request.distanciaMaximaEntregaKm())
                .valorMinimoPedido(request.valorMinimoPedido() != null ? request.valorMinimoPedido() : BigDecimal.ZERO)
                .build();

        return lojaRepository.save(loja);
    }

    @Transactional
    public S_Loja atualizar(UUID tenant, LojaRequest request) {
        S_Loja loja = buscarPorTenant(tenant);

        loja.setNome(request.nome());
        loja.setTipoOrganizacao(request.tipoOrganizacao());
        loja.setDescricao(request.descricao());
        loja.setTelefone(request.telefone());
        loja.setLogoUrl(request.logoUrl());
        loja.setEnderecoRua(request.enderecoRua());
        loja.setEnderecoNumero(request.enderecoNumero());
        loja.setEnderecoBairro(request.enderecoBairro());
        loja.setEnderecoCidade(request.enderecoCidade());
        loja.setEnderecoEstado(request.enderecoEstado());
        loja.setEnderecoCep(request.enderecoCep());
        loja.setLatitude(request.latitude());
        loja.setLongitude(request.longitude());
        if (request.taxaEntregaBase() != null) loja.setTaxaEntregaBase(request.taxaEntregaBase());
        if (request.taxaEntregaPorKm() != null) loja.setTaxaEntregaPorKm(request.taxaEntregaPorKm());
        if (request.distanciaMaximaEntregaKm() != null) loja.setDistanciaMaximaEntregaKm(request.distanciaMaximaEntregaKm());
        if (request.valorMinimoPedido() != null) loja.setValorMinimoPedido(request.valorMinimoPedido());
        if (request.tempoPreparoPadraoMinutos() != null) loja.setTempoPreparoPadraoMinutos(request.tempoPreparoPadraoMinutos());

        return lojaRepository.save(loja);
    }

    @Transactional
    public void inativar(UUID tenant) {
        S_Loja loja = buscarPorTenant(tenant);
        loja.setAtivo(false);
        lojaRepository.save(loja);
    }
}
