package com.cardapio.security;

import com.cardapio.entity.S_Usuario;
import lombok.Getter;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collection;
import java.util.List;
import java.util.UUID;

/**
 * Usuario autenticado. Alem do S_Usuario carrega o contexto do token: a loja
 * escolhida (tenant, nulo enquanto nao escolheu) e o papel nessa loja.
 */
@Getter
public class AppUserDetails implements UserDetails {

    public static final String PAPEL_USUARIO = "ROLE_USUARIO";

    private final S_Usuario usuario;
    private final UUID tenant;
    private final String perfil;

    public AppUserDetails(S_Usuario usuario, UUID tenant, String perfil) {
        this.usuario = usuario;
        this.tenant = tenant;
        this.perfil = perfil != null ? perfil : PAPEL_USUARIO;
    }

    public Long getUsuarioId() {
        return usuario.getId();
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return List.of(new SimpleGrantedAuthority(perfil));
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
