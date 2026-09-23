package com.cardapio.dto;

import org.springframework.data.domain.Page;

import java.util.List;
import java.util.function.Function;

/** Resposta paginada das telas de busca. page comeca em 0. */
public record PaginaResponse<T>(
        List<T> content,
        int page,
        int size,
        long totalElements,
        int totalPages
) {

    public static <E, T> PaginaResponse<T> of(Page<E> pagina, Function<E, T> conversor) {
        return new PaginaResponse<>(
                pagina.getContent().stream().map(conversor).toList(),
                pagina.getNumber(), pagina.getSize(), pagina.getTotalElements(), pagina.getTotalPages());
    }
}
