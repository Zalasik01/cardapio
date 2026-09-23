package com.cardapio.dto.usuario;

import com.cardapio.entity.T_Funcionario;
import com.cardapio.entity.T_PerfilUsuario;

import java.time.LocalDateTime;

/** Usuario visto de dentro de uma loja (dados do usuario + vinculo t_perfil_usuario + funcionario). */
public record UsuarioLojaResponse(
        Long id,
        String nome,
        String email,
        boolean ativo,
        String status,
        boolean administrador,
        boolean exigeTrocarSenha,
        LocalDateTime dataUltimoAcesso,
        Long funcionarioId,
        String funcionarioNome,
        boolean temFoto
) {

    /** funcionario pode ser nulo (vinculo sem funcionario cadastrado). */
    public static UsuarioLojaResponse of(T_PerfilUsuario vinculo, T_Funcionario funcionario, boolean temFoto) {
        var usuario = vinculo.getUsuario();
        return new UsuarioLojaResponse(
                usuario.getId(), usuario.getNome(), usuario.getEmail(), vinculo.isAtivo(),
                vinculo.getStatus().name(), vinculo.isAdministrador(), usuario.isExigeTrocarSenha(),
                usuario.getDataUltimoAcesso(),
                funcionario != null ? funcionario.getId() : null,
                funcionario != null ? funcionario.getPessoa().getPessoaFisica().getNome() : null,
                temFoto);
    }
}
