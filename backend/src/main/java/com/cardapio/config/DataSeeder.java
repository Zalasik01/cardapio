package com.cardapio.config;

import com.cardapio.entity.*;
import com.cardapio.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;

@Component
@Profile("dev")
@RequiredArgsConstructor
public class DataSeeder implements CommandLineRunner {

    private final S_LojaRepository lojaRepository;
    private final S_UsuarioRepository usuarioRepository;
    private final S_PerfilRepository perfilRepository;
    private final T_CategoriaRepository categoriaRepository;
    private final T_ProdutoRepository produtoRepository;
    private final T_ZonaEntregaRepository zonaEntregaRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        if (perfilRepository.count() > 0) {
            return;
        }

        S_Perfil perfilSuperAdmin = perfilRepository.save(S_Perfil.builder()
                .nome("Super Administrador").codigo("ROLE_SUPER_ADMIN").build());
        S_Perfil perfilAdminLoja = perfilRepository.save(S_Perfil.builder()
                .nome("Administrador da Loja").codigo("ROLE_ADMIN_LOJA").build());
        perfilRepository.save(S_Perfil.builder()
                .nome("Cliente").codigo("ROLE_CLIENTE").build());

        S_Loja loja = lojaRepository.save(S_Loja.builder()
                .nome("Cantina da Nonna")
                .slug("cantina-da-nonna")
                .tipoOrganizacao(TipoOrganizacao.RESTAURANTE)
                .situacaoConta(SituacaoConta.ATIVA)
                .descricao("Comida italiana caseira")
                .telefone("(11) 99999-0000")
                .enderecoBairro("Centro")
                .enderecoCidade("Sao Paulo")
                .latitude(-23.5505)
                .longitude(-46.6333)
                .taxaEntregaBase(new BigDecimal("5.00"))
                .taxaEntregaPorKm(new BigDecimal("1.50"))
                .distanciaMaximaEntregaKm(12.0)
                .valorMinimoPedido(new BigDecimal("20.00"))
                .build());

        usuarioRepository.save(S_Usuario.builder()
                .nome("Super Admin")
                .email("admin@cardapio.com")
                .senha(passwordEncoder.encode("admin123"))
                .perfil(perfilSuperAdmin)
                .usuarioSuporte(true)
                .build());

        usuarioRepository.save(S_Usuario.builder()
                .nome("Admin da Nonna")
                .email("nonna@cardapio.com")
                .senha(passwordEncoder.encode("nonna123"))
                .perfil(perfilAdminLoja)
                .tenant(loja.getGuid())
                .build());

        T_Categoria massas = categoriaRepository.save(T_Categoria.builder()
                .tenant(loja.getGuid()).nome("Massas").ordemExibicao(1).build());
        T_Categoria bebidas = categoriaRepository.save(T_Categoria.builder()
                .tenant(loja.getGuid()).nome("Bebidas").ordemExibicao(2).build());

        produtoRepository.save(T_Produto.builder()
                .tenant(loja.getGuid()).categoria(massas)
                .nome("Lasanha a Bolonhesa").descricao("Camadas de massa, molho bolonhesa e queijo gratinado")
                .preco(new BigDecimal("39.90")).ordemExibicao(1).build());

        produtoRepository.save(T_Produto.builder()
                .tenant(loja.getGuid()).categoria(massas)
                .nome("Fettuccine Alfredo").descricao("Massa fresca ao molho branco cremoso")
                .preco(new BigDecimal("34.90")).ordemExibicao(2).build());

        produtoRepository.save(T_Produto.builder()
                .tenant(loja.getGuid()).categoria(bebidas)
                .nome("Suco Natural").descricao("Laranja, limao ou maracuja")
                .preco(new BigDecimal("8.00")).ordemExibicao(1).build());

        zonaEntregaRepository.save(T_ZonaEntrega.builder()
                .tenant(loja.getGuid()).bairro("Centro").taxa(new BigDecimal("4.00")).tempoEstimadoMinutos(30).build());
        zonaEntregaRepository.save(T_ZonaEntrega.builder()
                .tenant(loja.getGuid()).bairro("Jardins").taxa(new BigDecimal("7.50")).tempoEstimadoMinutos(40).build());
    }
}
