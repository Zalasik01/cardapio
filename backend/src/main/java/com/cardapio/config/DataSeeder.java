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
@Profile({"dev", "docker"})
@RequiredArgsConstructor
public class DataSeeder implements CommandLineRunner {
    // Dados de demonstracao: so nos perfis dev e docker, nunca em producao.


    private final S_LojaRepository lojaRepository;
    private final S_UsuarioRepository usuarioRepository;
    private final S_PerfilRepository perfilRepository;
    private final T_CategoriaRepository categoriaRepository;
    private final T_ProdutoRepository produtoRepository;
    private final T_ZonaEntregaRepository zonaEntregaRepository;
    private final T_PessoaFisicaRepository pessoaFisicaRepository;
    private final T_PessoaRepository pessoaRepository;
    private final T_PerfilUsuarioRepository perfilUsuarioRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        if (lojaRepository.count() > 0) {
            return;
        }

        // Os perfis de acesso e o menu do painel vem das migrations (V3).
        S_Perfil perfilAdminLoja = perfilRepository.findByCodigo("ROLE_ADMIN_LOJA")
                .orElseThrow(() -> new IllegalStateException("Perfil ROLE_ADMIN_LOJA nao cadastrado"));

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

        lojaRepository.save(S_Loja.builder()
                .nome("Pizzaria do Ze")
                .slug("pizzaria-do-ze")
                .tipoOrganizacao(TipoOrganizacao.RESTAURANTE)
                .situacaoConta(SituacaoConta.ATIVA)
                .descricao("Pizzas artesanais no forno a lenha")
                .build());

        // Usuario do sistema: suporte e sem perfil vinculado, escolhe qualquer loja apos o login.
        usuarioRepository.save(S_Usuario.builder()
                .nome("Super Admin")
                .email("admin@cardapio.com")
                .senha(passwordEncoder.encode("admin123"))
                .usuarioSuporte(true)
                .build());

        // Usuario de loja: o vinculo com a loja e o papel ficam em t_perfil_usuario.
        S_Usuario usuarioNonna = usuarioRepository.save(S_Usuario.builder()
                .nome("Admin da Nonna")
                .email("nonna@cardapio.com")
                .senha(passwordEncoder.encode("nonna123"))
                .build());

        T_PessoaFisica pessoaFisicaNonna = pessoaFisicaRepository.save(T_PessoaFisica.builder()
                .tenant(loja.getGuid()).nome("Admin da Nonna").apelido("Nonna").build());
        T_Pessoa pessoaNonna = pessoaRepository.save(T_Pessoa.builder()
                .tenant(loja.getGuid()).pessoaFisica(pessoaFisicaNonna).build());
        perfilUsuarioRepository.save(T_PerfilUsuario.builder()
                .usuario(usuarioNonna).pessoa(pessoaNonna).loja(loja).perfil(perfilAdminLoja).build());

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
