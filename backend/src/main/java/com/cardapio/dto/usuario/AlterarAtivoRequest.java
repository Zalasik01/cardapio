package com.cardapio.dto.usuario;

/** Ativa ou inativa o usuario nesta loja (o acesso as outras lojas nao e afetado). */
public record AlterarAtivoRequest(boolean ativo) {
}
