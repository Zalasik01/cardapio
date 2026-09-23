package com.cardapio.exception;

import java.time.Instant;
import java.util.Map;

public record ErroResposta(
        Instant timestamp,
        int status,
        String erro,
        String mensagem,
        Map<String, String> campos
) {
}
