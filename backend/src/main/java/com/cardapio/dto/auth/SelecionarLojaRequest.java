package com.cardapio.dto.auth;

import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public record SelecionarLojaRequest(@NotNull UUID lojaGuid) {
}
