package com.cardapio.dto.usuario;

import com.cardapio.entity.T_PerfilUsuario;

import java.time.LocalDateTime;
import java.util.UUID;

/** Usuario visto de dentro de uma loja (dados do usuario + vinculo t_perfil_usuario). */
public record UsuarioLojaResponse(
        UUID guid,
        String nome,
        String email,
        boolean ativo,
        String status,
        String perfil,
        boolean exigeTrocarSenha,
        LocalDateTime dataUltimoAcesso
) {

    public static UsuarioLojaResponse of(T_PerfilUsuario vinculo) {
        var usuario = vinculo.getUsuario();
        var pessoaFisica = vinculo.getPessoa().getPessoaFisica();
        String nome = pessoaFisica != null ? pessoaFisica.getNome() : usuario.getNome();
        return new UsuarioLojaResponse(
                usuario.getGuid(), nome, usuario.getEmail(), vinculo.isAtivo(), vinculo.getStatus().name(),
                vinculo.getPerfil().getCodigo(), usuario.isExigeTrocarSenha(), usuario.getDataUltimoAcesso());
    }
}
