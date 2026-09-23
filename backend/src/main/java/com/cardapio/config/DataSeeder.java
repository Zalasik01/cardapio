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

    private final RestauranteRepository restauranteRepository;
    private final UsuarioRepository usuarioRepository;
    private final CategoriaRepository categoriaRepository;
    private final ProdutoRepository produtoRepository;
    private final ZonaEntregaRepository zonaEntregaRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        if (restauranteRepository.count() > 0) {
            return;
        }

        Restaurante restaurante = restauranteRepository.save(Restaurante.builder()
                .nome("Cantina da Nonna")
                .slug("cantina-da-nonna")
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

        usuarioRepository.save(Usuario.builder()
                .nome("Super Admin")
                .email("admin@cardapio.com")
                .senha(passwordEncoder.encode("admin123"))
                .telefone("(11) 90000-0000")
                .perfil(Perfil.ROLE_SUPER_ADMIN)
                .build());

        usuarioRepository.save(Usuario.builder()
                .nome("Admin da Nonna")
                .email("nonna@cardapio.com")
                .senha(passwordEncoder.encode("nonna123"))
                .telefone("(11) 90000-0001")
                .perfil(Perfil.ROLE_ADMIN_RESTAURANTE)
                .restaurante(restaurante)
                .build());

        Categoria massas = categoriaRepository.save(Categoria.builder()
                .restaurante(restaurante).nome("Massas").ordemExibicao(1).build());
        Categoria bebidas = categoriaRepository.save(Categoria.builder()
                .restaurante(restaurante).nome("Bebidas").ordemExibicao(2).build());

        produtoRepository.save(Produto.builder()
                .restaurante(restaurante).categoria(massas)
                .nome("Lasanha a Bolonhesa").descricao("Camadas de massa, molho bolonhesa e queijo gratinado")
                .preco(new BigDecimal("39.90")).ordemExibicao(1).build());

        produtoRepository.save(Produto.builder()
                .restaurante(restaurante).categoria(massas)
                .nome("Fettuccine Alfredo").descricao("Massa fresca ao molho branco cremoso")
                .preco(new BigDecimal("34.90")).ordemExibicao(2).build());

        produtoRepository.save(Produto.builder()
                .restaurante(restaurante).categoria(bebidas)
                .nome("Suco Natural").descricao("Laranja, limao ou maracuja")
                .preco(new BigDecimal("8.00")).ordemExibicao(1).build());

        zonaEntregaRepository.save(ZonaEntrega.builder()
                .restaurante(restaurante).bairro("Centro").taxa(new BigDecimal("4.00")).tempoEstimadoMinutos(30).build());
        zonaEntregaRepository.save(ZonaEntrega.builder()
                .restaurante(restaurante).bairro("Jardins").taxa(new BigDecimal("7.50")).tempoEstimadoMinutos(40).build());
    }
}
