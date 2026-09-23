package com.cardapio.service;

import com.cardapio.dto.frete.CalculoFreteRequest;
import com.cardapio.dto.frete.CalculoFreteResponse;
import com.cardapio.dto.frete.ZonaEntregaRequest;
import com.cardapio.entity.S_Loja;
import com.cardapio.entity.T_ZonaEntrega;
import com.cardapio.exception.RecursoNaoEncontradoException;
import com.cardapio.repository.T_ZonaEntregaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class FreteService {

    private static final int RAIO_TERRA_KM = 6371;

    private final T_ZonaEntregaRepository zonaEntregaRepository;
    private final LojaService lojaService;

    @Transactional(readOnly = true)
    public CalculoFreteResponse calcular(CalculoFreteRequest request) {
        S_Loja loja = lojaService.buscarPorTenant(request.tenant());

        if (request.bairro() != null && !request.bairro().isBlank()) {
            var zona = zonaEntregaRepository
                    .findByTenantAndBairroIgnoreCaseAndAtivoTrue(loja.getGuid(), request.bairro());

            if (zona.isPresent()) {
                T_ZonaEntrega z = zona.get();
                return new CalculoFreteResponse(true, z.getTaxa(), z.getTempoEstimadoMinutos(), null,
                        "ZONA_FIXA", "Frete calculado pela zona de entrega: " + z.getBairro());
            }
        }

        if (request.latitude() == null || request.longitude() == null
                || loja.getLatitude() == null || loja.getLongitude() == null) {
            return new CalculoFreteResponse(false, null, null, null, "INDISPONIVEL",
                    "Nao foi possivel calcular o frete: informe um bairro cadastrado ou a localizacao");
        }

        double distanciaKm = calcularDistanciaHaversine(
                loja.getLatitude(), loja.getLongitude(),
                request.latitude(), request.longitude());

        if (distanciaKm > loja.getDistanciaMaximaEntregaKm()) {
            return new CalculoFreteResponse(false, null, null, distanciaKm, "DISTANCIA",
                    "Endereco fora da area de entrega da loja");
        }

        BigDecimal taxa = loja.getTaxaEntregaBase()
                .add(loja.getTaxaEntregaPorKm().multiply(BigDecimal.valueOf(distanciaKm)))
                .setScale(2, RoundingMode.HALF_UP);

        int tempoEstimado = (int) Math.ceil(15 + distanciaKm * 4);

        return new CalculoFreteResponse(true, taxa, tempoEstimado, distanciaKm, "DISTANCIA",
                "Frete calculado por distancia (" + String.format("%.1f", distanciaKm) + " km)");
    }

    private double calcularDistanciaHaversine(double lat1, double lon1, double lat2, double lon2) {
        double dLat = Math.toRadians(lat2 - lat1);
        double dLon = Math.toRadians(lon2 - lon1);

        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2)
                + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                * Math.sin(dLon / 2) * Math.sin(dLon / 2);

        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return RAIO_TERRA_KM * c;
    }

    @Transactional(readOnly = true)
    public List<T_ZonaEntrega> listarZonas(UUID tenant) {
        return zonaEntregaRepository.findByTenantOrderByBairroAsc(tenant);
    }

    @Transactional
    public T_ZonaEntrega criarZona(UUID tenant, ZonaEntregaRequest request) {
        T_ZonaEntrega zona = T_ZonaEntrega.builder()
                .tenant(tenant)
                .bairro(request.bairro())
                .taxa(request.taxa())
                .tempoEstimadoMinutos(request.tempoEstimadoMinutos() != null ? request.tempoEstimadoMinutos() : 45)
                .build();

        if (request.ativo() != null) zona.setAtivo(request.ativo());

        return zonaEntregaRepository.save(zona);
    }

    @Transactional
    public T_ZonaEntrega atualizarZona(UUID tenant, UUID zonaGuid, ZonaEntregaRequest request) {
        T_ZonaEntrega zona = buscarZona(tenant, zonaGuid);
        zona.setBairro(request.bairro());
        zona.setTaxa(request.taxa());
        if (request.tempoEstimadoMinutos() != null) zona.setTempoEstimadoMinutos(request.tempoEstimadoMinutos());
        if (request.ativo() != null) zona.setAtivo(request.ativo());
        return zonaEntregaRepository.save(zona);
    }

    @Transactional
    public void excluirZona(UUID tenant, UUID zonaGuid) {
        T_ZonaEntrega zona = buscarZona(tenant, zonaGuid);
        zona.setDeletado(true);
        zona.setAtivo(false);
        zonaEntregaRepository.save(zona);
    }

    private T_ZonaEntrega buscarZona(UUID tenant, UUID zonaGuid) {
        return zonaEntregaRepository.findByGuidAndTenant(zonaGuid, tenant)
                .orElseThrow(() -> new RecursoNaoEncontradoException("Zona de entrega nao encontrada: " + zonaGuid));
    }
}
