package com.cardapio.service;

import com.cardapio.dto.frete.CalculoFreteRequest;
import com.cardapio.dto.frete.CalculoFreteResponse;
import com.cardapio.dto.frete.ZonaEntregaRequest;
import com.cardapio.entity.Restaurante;
import com.cardapio.entity.ZonaEntrega;
import com.cardapio.exception.RecursoNaoEncontradoException;
import com.cardapio.repository.ZonaEntregaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;

@Service
@RequiredArgsConstructor
public class FreteService {

    private static final int RAIO_TERRA_KM = 6371;

    private final ZonaEntregaRepository zonaEntregaRepository;
    private final RestauranteService restauranteService;

    public CalculoFreteResponse calcular(CalculoFreteRequest request) {
        Restaurante restaurante = restauranteService.buscarPorId(request.restauranteId());

        if (request.bairro() != null && !request.bairro().isBlank()) {
            var zona = zonaEntregaRepository
                    .findByRestauranteIdAndBairroIgnoreCaseAndAtivoTrue(restaurante.getId(), request.bairro());

            if (zona.isPresent()) {
                ZonaEntrega z = zona.get();
                return new CalculoFreteResponse(true, z.getTaxa(), z.getTempoEstimadoMinutos(), null,
                        "ZONA_FIXA", "Frete calculado pela zona de entrega: " + z.getBairro());
            }
        }

        if (request.latitude() == null || request.longitude() == null
                || restaurante.getLatitude() == null || restaurante.getLongitude() == null) {
            return new CalculoFreteResponse(false, null, null, null, "INDISPONIVEL",
                    "Nao foi possivel calcular o frete: informe um bairro cadastrado ou a localizacao");
        }

        double distanciaKm = calcularDistanciaHaversine(
                restaurante.getLatitude(), restaurante.getLongitude(),
                request.latitude(), request.longitude());

        if (distanciaKm > restaurante.getDistanciaMaximaEntregaKm()) {
            return new CalculoFreteResponse(false, null, null, distanciaKm, "DISTANCIA",
                    "Endereco fora da area de entrega do restaurante");
        }

        BigDecimal taxa = restaurante.getTaxaEntregaBase()
                .add(restaurante.getTaxaEntregaPorKm().multiply(BigDecimal.valueOf(distanciaKm)))
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

    public List<ZonaEntrega> listarZonas(Long restauranteId) {
        return zonaEntregaRepository.findByRestauranteIdOrderByBairroAsc(restauranteId);
    }

    @Transactional
    public ZonaEntrega criarZona(Long restauranteId, ZonaEntregaRequest request) {
        Restaurante restaurante = restauranteService.buscarPorId(restauranteId);

        ZonaEntrega zona = ZonaEntrega.builder()
                .restaurante(restaurante)
                .bairro(request.bairro())
                .taxa(request.taxa())
                .tempoEstimadoMinutos(request.tempoEstimadoMinutos() != null ? request.tempoEstimadoMinutos() : 45)
                .ativo(request.ativo() == null || request.ativo())
                .build();

        return zonaEntregaRepository.save(zona);
    }

    @Transactional
    public ZonaEntrega atualizarZona(Long restauranteId, Long zonaId, ZonaEntregaRequest request) {
        ZonaEntrega zona = buscarZona(restauranteId, zonaId);
        zona.setBairro(request.bairro());
        zona.setTaxa(request.taxa());
        if (request.tempoEstimadoMinutos() != null) zona.setTempoEstimadoMinutos(request.tempoEstimadoMinutos());
        if (request.ativo() != null) zona.setAtivo(request.ativo());
        return zonaEntregaRepository.save(zona);
    }

    @Transactional
    public void excluirZona(Long restauranteId, Long zonaId) {
        zonaEntregaRepository.delete(buscarZona(restauranteId, zonaId));
    }

    private ZonaEntrega buscarZona(Long restauranteId, Long zonaId) {
        ZonaEntrega zona = zonaEntregaRepository.findById(zonaId)
                .orElseThrow(() -> new RecursoNaoEncontradoException("Zona de entrega nao encontrada: " + zonaId));
        if (!zona.getRestaurante().getId().equals(restauranteId)) {
            throw new RecursoNaoEncontradoException("Zona de entrega nao pertence a este restaurante");
        }
        return zona;
    }
}
