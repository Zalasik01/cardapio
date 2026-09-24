package com.cardapio.dto.funcionario;

/** Filtros da tela de busca de funcionarios. Campos nulos ou vazios nao filtram. */
public record FiltroFuncionario(
        String busca,
        String nome,
        String cpf,
        boolean mostrarInativos
) {
}
