package com.cardapio.service;

import com.cardapio.dto.restaurante.RestauranteRequest;
import com.cardapio.entity.Restaurante;
import com.cardapio.exception.RecursoNaoEncontradoException;
import com.cardapio.exception.RegraNegocioException;
import com.cardapio.repository.RestauranteRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;

@Service
@RequiredArgsConstructor
public class RestauranteService {

    private final RestauranteRepository restauranteRepository;

    public Restaurante buscarPorId(Long id) {
        return restauranteRepository.findById(id)
                .orElseThrow(() -> new RecursoNaoEncontradoException("Restaurante nao encontrado: " + id));
    }

    public Restaurante buscarPorSlug(String slug) {
        return restauranteRepository.findBySlug(slug)
                .orElseThrow(() -> new RecursoNaoEncontradoException("Restaurante nao encontrado: " + slug));
    }

    @Transactional
    public Restaurante criar(RestauranteRequest request) {
        if (restauranteRepository.existsBySlug(request.slug())) {
            throw new RegraNegocioException("Ja existe um restaurante com o slug: " + request.slug());
        }

        Restaurante restaurante = Restaurante.builder()
                .nome(request.nome())
                .slug(request.slug())
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

        return restauranteRepository.save(restaurante);
    }

    @Transactional
    public Restaurante atualizar(Long id, RestauranteRequest request) {
        Restaurante restaurante = buscarPorId(id);

        restaurante.setNome(request.nome());
        restaurante.setDescricao(request.descricao());
        restaurante.setTelefone(request.telefone());
        restaurante.setLogoUrl(request.logoUrl());
        restaurante.setEnderecoRua(request.enderecoRua());
        restaurante.setEnderecoNumero(request.enderecoNumero());
        restaurante.setEnderecoBairro(request.enderecoBairro());
        restaurante.setEnderecoCidade(request.enderecoCidade());
        restaurante.setEnderecoEstado(request.enderecoEstado());
        restaurante.setEnderecoCep(request.enderecoCep());
        restaurante.setLatitude(request.latitude());
        restaurante.setLongitude(request.longitude());
        if (request.taxaEntregaBase() != null) restaurante.setTaxaEntregaBase(request.taxaEntregaBase());
        if (request.taxaEntregaPorKm() != null) restaurante.setTaxaEntregaPorKm(request.taxaEntregaPorKm());
        if (request.distanciaMaximaEntregaKm() != null) restaurante.setDistanciaMaximaEntregaKm(request.distanciaMaximaEntregaKm());
        if (request.valorMinimoPedido() != null) restaurante.setValorMinimoPedido(request.valorMinimoPedido());

        return restauranteRepository.save(restaurante);
    }

    @Transactional
    public void inativar(Long id) {
        Restaurante restaurante = buscarPorId(id);
        restaurante.setAtivo(false);
        restauranteRepository.save(restaurante);
    }
}
