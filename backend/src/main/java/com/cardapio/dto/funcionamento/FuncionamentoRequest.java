package com.cardapio.dto.funcionamento;

import com.cardapio.entity.ModoFuncionamento;
import com.fasterxml.jackson.annotation.JsonFormat;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

import java.time.LocalTime;
import java.util.List;

/** Modo de funcionamento e horários da loja. Os horários enviados substituem os anteriores. */
public record FuncionamentoRequest(
        @NotNull ModoFuncionamento modo,
        @Valid List<HorarioDto> horarios
) {

    /** Um intervalo de funcionamento; diaSemana de 1 (segunda) a 7 (domingo). */
    public record HorarioDto(
            @NotNull @Min(1) @Max(7) Integer diaSemana,
            @NotNull @JsonFormat(pattern = "HH:mm") LocalTime abre,
            @NotNull @JsonFormat(pattern = "HH:mm") LocalTime fecha
    ) {
    }
}
