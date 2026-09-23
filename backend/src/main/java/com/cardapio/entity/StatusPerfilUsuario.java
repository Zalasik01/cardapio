package com.cardapio.entity;

/** Situacao do vinculo de um usuario com uma loja. So o vinculo ATIVO da acesso a loja. */
public enum StatusPerfilUsuario {
    ATIVO,
    /** Usuario convidado que ainda nao definiu a senha. */
    PENDENTE,
    REJEITADO
}
