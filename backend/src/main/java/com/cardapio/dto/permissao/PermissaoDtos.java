package com.cardapio.dto.permissao;

import java.util.List;
import java.util.Set;

/** Respostas e pedidos das permissões por tela. */
public final class PermissaoDtos {

    private PermissaoDtos() {
    }

    /** Uma permissão do catálogo (ex.: USUARIOS_INCLUIR - "Cadastrar usuário"). */
    public record PermissaoItem(String codigo, String nome, String tipo) {
    }

    /** Uma tela do menu com as permissões dela. */
    public record PaginaPermissoes(String nome, String rota, List<PermissaoItem> permissoes) {
    }

    /** Categoria do menu (galho principal da árvore) com as telas que têm permissões. */
    public record CategoriaPermissoes(String nome, String icone, List<PaginaPermissoes> paginas) {
    }

    /** Permissões de um usuário: administrador da loja tem tudo; senão vale a lista de códigos. */
    public record PermissoesDoUsuario(boolean administrador, Set<String> codigos) {
    }

    /** As permissões de quem está logado, para a tela esconder ou desabilitar o que ele não pode. */
    public record MinhasPermissoes(boolean total, Set<String> codigos) {
    }

    public record SalvarPermissoesRequest(Set<String> codigos) {
    }
}
