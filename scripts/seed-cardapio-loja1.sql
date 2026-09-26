-- Cardápio de teste para a loja 1 (Cantina da Nonna). NÃO é migration do Flyway: rode à mão quando quiser.
--
--   docker compose exec -T postgres sh -c 'psql -U "$POSTGRES_USER" -d "$POSTGRES_DB"' < scripts/seed-cardapio-loja1.sql
--
-- Pode rodar mais de uma vez: categorias e produtos que já existem (mesmo nome na loja) são ignorados.
-- Sem imagens (imagem_url vazio): cadastre as fotos pela tela de produtos.
-- Para apagar só o que este script criou: rode a última seção (comentada) deste arquivo.

BEGIN;

-- ---------------------------------------------------------------------------
-- Categorias
-- ---------------------------------------------------------------------------
INSERT INTO t_categoria (ativo, deletado, guid, tenant, nome, ordem_exibicao)
SELECT TRUE, FALSE, gen_random_uuid(), '3910426d-2a80-4d4d-849e-055d9ed9c879', c.nome, c.ordem
FROM (VALUES
    ('Entradas',     1),
    ('Massas',       2),
    ('Pizzas',       3),
    ('Carnes',       4),
    ('Sobremesas',   8)
) AS c(nome, ordem)
WHERE NOT EXISTS (
    SELECT 1 FROM t_categoria x
    WHERE x.tenant = '3910426d-2a80-4d4d-849e-055d9ed9c879' AND x.deletado = FALSE AND lower(x.nome) = lower(c.nome)
);

-- ---------------------------------------------------------------------------
-- Produtos finais: (categoria, nome, descrição, preço, preço promocional, destaque, preparo em min, ordem)
-- ---------------------------------------------------------------------------
INSERT INTO t_produto (ativo, deletado, guid, tenant, id_categoria, tipo, unidade_medida, nome, descricao, preco,
                       preco_promocional, destaque, disponivel, tempo_preparo_minutos, ordem_exibicao, custo_unitario)
SELECT TRUE, FALSE, gen_random_uuid(), '3910426d-2a80-4d4d-849e-055d9ed9c879', cat.id_categoria, 'FINAL', 'UN',
       p.nome, p.descricao, p.preco, p.promo, p.destaque, TRUE, p.preparo, p.ordem, 0
FROM (VALUES
    -- Entradas
    ('Entradas', 'Bruschetta Italiana',      'Pão italiano tostado com tomate fresco, manjericão, alho e azeite extra virgem.',              24.90, NULL,  TRUE,  10, 1),
    ('Entradas', 'Bolinho de Risoto',        'Seis bolinhos crocantes de risoto de parmesão, servidos com molho pomodoro.',                  32.00, NULL,  FALSE, 15, 2),
    ('Entradas', 'Carpaccio de Carne',       'Fatias finas de filé mignon, rúcula, lascas de parmesão, alcaparras e molho de mostarda.',     44.90, 39.90, FALSE, 10, 3),
    ('Entradas', 'Provolone à Milanesa',     'Provolone empanado e frito, acompanha geleia de pimenta.',                                     36.00, NULL,  FALSE, 15, 4),
    ('Entradas', 'Tábua de Frios',           'Salame, presunto cru, queijos variados, azeitonas e torradas. Serve 2 pessoas.',               69.90, NULL,  TRUE,  10, 5),
    -- Massas
    ('Massas', 'Espaguete à Carbonara',      'Espaguete com bacon crocante, gema, pecorino e pimenta-do-reino moída na hora.',               46.90, NULL,  TRUE,  20, 1),
    ('Massas', 'Fettuccine Alfredo',         'Fettuccine em molho cremoso de manteiga e parmesão. Opção com frango grelhado.',               44.90, NULL,  FALSE, 20, 2),
    ('Massas', 'Lasanha à Bolonhesa',        'Camadas de massa fresca, molho bolonhesa da casa, molho branco e muçarela gratinada.',         48.90, 42.90, TRUE,  25, 3),
    ('Massas', 'Nhoque ao Sugo',             'Nhoque de batata feito na casa ao molho de tomate rústico e manjericão.',                      41.90, NULL,  FALSE, 20, 4),
    ('Massas', 'Ravioli de Queijo',          'Ravioli recheado com ricota e espinafre ao molho de manteiga e sálvia.',                       49.90, NULL,  FALSE, 22, 5),
    ('Massas', 'Penne ao Pesto',             'Penne ao molho pesto de manjericão, tomate cereja e lascas de parmesão.',                      42.90, NULL,  FALSE, 18, 6),
    -- Pizzas
    ('Pizzas', 'Pizza Margherita',           'Molho de tomate, muçarela de búfala, tomate e manjericão fresco. 8 fatias.',                   54.90, NULL,  TRUE,  30, 1),
    ('Pizzas', 'Pizza Calabresa',            'Calabresa fatiada, cebola, muçarela e orégano. 8 fatias.',                                     52.90, 46.90, FALSE, 30, 2),
    ('Pizzas', 'Pizza Quatro Queijos',       'Muçarela, provolone, gorgonzola e parmesão. 8 fatias.',                                        59.90, NULL,  FALSE, 30, 3),
    ('Pizzas', 'Pizza Portuguesa',           'Presunto, ovos, cebola, ervilha, azeitona e muçarela. 8 fatias.',                              56.90, NULL,  FALSE, 30, 4),
    ('Pizzas', 'Pizza Frango com Catupiry',  'Frango desfiado temperado, catupiry original e milho. 8 fatias.',                              55.90, NULL,  FALSE, 30, 5),
    ('Pizzas', 'Pizza de Chocolate',         'Chocolate ao leite derretido com morangos frescos. 8 fatias.',                                 49.90, NULL,  FALSE, 25, 6),
    -- Carnes
    ('Carnes', 'Filé à Parmegiana',          'Filé mignon empanado, molho de tomate e queijo gratinado. Acompanha arroz e batata frita.',    62.90, 56.90, TRUE,  30, 1),
    ('Carnes', 'Frango Grelhado ao Limão',   'Peito de frango grelhado ao molho de limão siciliano, arroz e legumes salteados.',             42.90, NULL,  FALSE, 25, 2),
    ('Carnes', 'Costela ao Molho Barbecue',  'Costela suína assada lentamente, molho barbecue defumado e batatas rústicas.',                 68.90, NULL,  FALSE, 35, 3),
    ('Carnes', 'Picanha na Chapa',           'Picanha grelhada em fatias com farofa, vinagrete, arroz e fritas. Serve 2 pessoas.',           119.90, NULL, TRUE,  35, 4),
    -- Sobremesas
    ('Sobremesas', 'Tiramisù',               'Clássico italiano com mascarpone, café e cacau.',                                              22.90, NULL,  TRUE,  5, 1),
    ('Sobremesas', 'Panna Cotta',            'Creme de baunilha com calda de frutas vermelhas.',                                             19.90, NULL,  FALSE, 5, 2),
    ('Sobremesas', 'Petit Gâteau',           'Bolinho quente de chocolate com sorvete de creme.',                                            26.90, 23.90, FALSE, 12, 3),
    ('Sobremesas', 'Cannoli Siciliano',      'Dois cannoli recheados com creme de ricota e gotas de chocolate.',                             21.90, NULL,  FALSE, 5, 4),
    -- Lanches (categoria já existente na loja)
    ('Lanches', 'X-Bacon',                   'Hambúrguer artesanal, muito bacon crocante, queijo cheddar e maionese da casa.',               26.90, NULL,  FALSE, 15, 2),
    ('Lanches', 'X-Salada',                  'Hambúrguer, queijo, alface, tomate e maionese.',                                               22.90, 19.90, FALSE, 15, 3),
    ('Lanches', 'X-Tudo',                    'Hambúrguer duplo, bacon, ovo, presunto, queijo, alface e tomate.',                             32.90, NULL,  TRUE,  18, 4),
    -- Porção (categoria já existente na loja)
    ('Porção', 'Batata Frita Cheddar e Bacon', 'Porção de batata frita coberta com cheddar cremoso e farofa de bacon.',                        34.90, NULL,  FALSE, 15, 2),
    ('Porção', 'Anéis de Cebola',            'Anéis de cebola empanados e crocantes com molho barbecue.',                                    24.90, NULL,  FALSE, 12, 3),
    ('Porção', 'Isca de Frango',             'Iscas de frango empanadas com molho de mostarda e mel.',                                       36.90, NULL,  FALSE, 15, 4),
    -- Bebidas (categoria já existente na loja)
    ('Bebidas', 'Coca-Cola Lata 350ml',      'Gelada.',                                                                                       6.50, NULL,  FALSE, NULL, 1),
    ('Bebidas', 'Guaraná Antarctica 350ml',  'Gelado.',                                                                                       6.00, NULL,  FALSE, NULL, 2),
    ('Bebidas', 'Suco Natural de Laranja',   'Suco de laranja espremido na hora, 400ml.',                                                    11.90, NULL,  FALSE, 5, 3),
    ('Bebidas', 'Suco de Limão com Hortelã', 'Refrescante, 400ml.',                                                                          11.90, NULL,  FALSE, 5, 4),
    ('Bebidas', 'Água Mineral 500ml',        'Com ou sem gás.',                                                                               4.50, NULL,  FALSE, NULL, 5),
    ('Bebidas', 'Cerveja Long Neck',         'Heineken 330ml.',                                                                              12.90, 10.90, FALSE, NULL, 6),
    ('Bebidas', 'Vinho Tinto Taça',          'Taça de vinho tinto seco da casa, 150ml.',                                                     18.90, NULL,  FALSE, NULL, 7)
) AS p(categoria, nome, descricao, preco, promo, destaque, preparo, ordem)
JOIN t_categoria cat
  ON cat.tenant = '3910426d-2a80-4d4d-849e-055d9ed9c879' AND cat.deletado = FALSE AND lower(cat.nome) = lower(p.categoria)
WHERE NOT EXISTS (
    SELECT 1 FROM t_produto x
    WHERE x.tenant = '3910426d-2a80-4d4d-849e-055d9ed9c879' AND x.deletado = FALSE AND lower(x.nome) = lower(p.nome)
);

COMMIT;

-- Conferência:
-- SELECT c.nome AS categoria, count(*) AS produtos
--   FROM t_produto p JOIN t_categoria c ON c.id_categoria = p.id_categoria
--  WHERE p.tenant = '3910426d-2a80-4d4d-849e-055d9ed9c879' AND p.deletado = FALSE GROUP BY c.nome ORDER BY c.nome;

-- Para desfazer (apaga o que este script criou; produtos já usados em pedidos não podem ser apagados):
-- DELETE FROM t_produto WHERE tenant = '3910426d-2a80-4d4d-849e-055d9ed9c879' AND nome IN (... nomes acima ...);
