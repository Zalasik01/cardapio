package com.cardapio.security;

import java.util.Arrays;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

/**
 * Usado nos @PreAuthorize como {@code @perm.tem('USUARIOS_INCLUIR')}. O usuário do sistema e o
 * administrador da loja passam por qualquer permissão; os demais precisam de ao menos um dos códigos.
 */
@Component("perm")
public class Permissoes {

    public static final String PAPEL_SISTEMA = "ROLE_SISTEMA";
    public static final String PAPEL_ADMINISTRADOR_LOJA = "ROLE_ADMINISTRADOR_LOJA";
    public static final String PREFIXO = "PERM_";

    public boolean tem(String... codigos) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()) {
            return false;
        }
        return auth.getAuthorities().stream().anyMatch(a -> {
            String autoridade = a.getAuthority();
            return autoridade.equals(PAPEL_SISTEMA) || autoridade.equals(PAPEL_ADMINISTRADOR_LOJA)
                    || (autoridade.startsWith(PREFIXO)
                            && Arrays.asList(codigos).contains(autoridade.substring(PREFIXO.length())));
        });
    }
}
