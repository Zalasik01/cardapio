package com.cardapio.security;

import com.cardapio.entity.S_Usuario;
import lombok.Getter;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collection;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;
import java.util.UUID;

/**
 * Usuario autenticado. Alem do S_Usuario carrega o contexto do token: a loja
 * escolhida (tenant, nulo enquanto nao escolheu) e o papel nessa loja.
 */
@Getter
public class AppUserDetails implements UserDetails {

    public static final String PAPEL_USUARIO = "ROLE_USUARIO";
    public static final String PAPEL_ADMINISTRADOR = "ROLE_ADMINISTRADOR_PLATAFORMA";

    private final S_Usuario usuario;
    private final UUID tenant;
    private final String perfil;
    private final boolean administradorLoja;
    private final Set<String> permissoes;

    public AppUserDetails(S_Usuario usuario, UUID tenant, String perfil) {
        this(usuario, tenant, perfil, false, Set.of());
    }

    public AppUserDetails(S_Usuario usuario, UUID tenant, String perfil, boolean administradorLoja, Set<String> permissoes) {
        this.usuario = usuario;
        this.tenant = tenant;
        this.perfil = perfil != null ? perfil : PAPEL_USUARIO;
        this.administradorLoja = administradorLoja;
        this.permissoes = permissoes;
    }

    public Long getUsuarioId() {
        return usuario.getId();
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        // o papel de administrador vem do cadastro do usuario a cada requisicao, nunca do token
        List<GrantedAuthority> autoridades = new ArrayList<>();
        autoridades.add(new SimpleGrantedAuthority(perfil));
        if (usuario.isUsuarioAdministrador()) {
            autoridades.add(new SimpleGrantedAuthority(PAPEL_ADMINISTRADOR));
        }
        if (administradorLoja) {
            autoridades.add(new SimpleGrantedAuthority(Permissoes.PAPEL_ADMINISTRADOR_LOJA));
        }
        permissoes.forEach(codigo -> autoridades.add(new SimpleGrantedAuthority(Permissoes.PREFIXO + codigo)));
        return autoridades;
    }

    @Override
    public String getPassword() {
        return usuario.getSenha();
    }

    @Override
    public String getUsername() {
        return usuario.getEmail();
    }

    @Override
    public boolean isAccountNonExpired() {
        return true;
    }

    @Override
    public boolean isAccountNonLocked() {
        return true;
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return true;
    }

    @Override
    public boolean isEnabled() {
        return usuario.isAtivo() && !usuario.isDeletado();
    }
}
