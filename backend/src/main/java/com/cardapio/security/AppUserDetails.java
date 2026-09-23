package com.cardapio.security;

import com.cardapio.entity.S_Usuario;
import lombok.Getter;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collection;
import java.util.List;
import java.util.UUID;

@Getter
public class AppUserDetails implements UserDetails {

    private final S_Usuario usuario;

    public AppUserDetails(S_Usuario usuario) {
        this.usuario = usuario;
    }

    public Long getUsuarioId() {
        return usuario.getId();
    }

    public UUID getTenant() {
        return usuario.getTenant();
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return List.of(new SimpleGrantedAuthority(usuario.getPerfil().getCodigo()));
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
