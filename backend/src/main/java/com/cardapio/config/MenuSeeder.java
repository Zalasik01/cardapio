package com.cardapio.config;

import com.cardapio.entity.S_CategoriaMenu;
import com.cardapio.entity.S_Pagina;
import com.cardapio.repository.S_CategoriaMenuRepository;
import com.cardapio.repository.S_PaginaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

/**
 * Cadastra o menu padrao do painel administrativo. Roda em todos os perfis,
 * pois o menu e dado de sistema; so insere quando a tabela esta vazia.
 */
@Component
@RequiredArgsConstructor
public class MenuSeeder implements CommandLineRunner {

    private final S_CategoriaMenuRepository categoriaMenuRepository;
    private final S_PaginaRepository paginaRepository;

    @Override
    public void run(String... args) {
        if (categoriaMenuRepository.count() > 0) {
            return;
        }

        S_CategoriaMenu operacao = categoria("Operação", "fa-solid fa-bag-shopping", 1);
        pagina(operacao, "Pedidos", "/admin", 1);

        S_CategoriaMenu cardapio = categoria("Cardápio", "fa-solid fa-utensils", 2);
        pagina(cardapio, "Categorias", "/admin/categorias", 1);
        pagina(cardapio, "Produtos", "/admin/produtos", 2);

        S_CategoriaMenu entrega = categoria("Entrega", "fa-solid fa-motorcycle", 3);
        pagina(entrega, "Zonas de entrega", "/admin/zonas-entrega", 1);

        S_CategoriaMenu configuracoes = categoria("Configurações", "fa-solid fa-gear", 4);
        pagina(configuracoes, "Minha loja", "/admin/loja", 1);
    }

    private S_CategoriaMenu categoria(String nome, String icone, int ordem) {
        return categoriaMenuRepository.save(S_CategoriaMenu.builder().nome(nome).icone(icone).ordem(ordem).build());
    }

    private void pagina(S_CategoriaMenu categoria, String nome, String rota, int ordem) {
        paginaRepository.save(S_Pagina.builder().categoriaMenu(categoria).nome(nome).rota(rota).ordem(ordem).build());
    }
}
