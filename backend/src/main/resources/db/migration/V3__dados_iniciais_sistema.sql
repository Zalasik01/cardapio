-- Dados de sistema necessarios em qualquer ambiente: perfis de acesso e menu do painel.

INSERT INTO s_perfil (guid, nome, codigo) VALUES
    (gen_random_uuid(), 'Super Administrador', 'ROLE_SUPER_ADMIN'),
    (gen_random_uuid(), 'Administrador da Loja', 'ROLE_ADMIN_LOJA'),
    (gen_random_uuid(), 'Cliente', 'ROLE_CLIENTE');

INSERT INTO s_categoria_menu (guid, nome, icone, ordem) VALUES
    (gen_random_uuid(), 'Operação', 'fa-solid fa-bag-shopping', 1),
    (gen_random_uuid(), 'Cardápio', 'fa-solid fa-utensils', 2),
    (gen_random_uuid(), 'Entrega', 'fa-solid fa-motorcycle', 3),
    (gen_random_uuid(), 'Configurações', 'fa-solid fa-gear', 4);

INSERT INTO s_pagina (guid, id_categoria_menu, nome, rota, ordem)
SELECT gen_random_uuid(), c.id_categoria_menu, p.nome, p.rota, p.ordem
FROM (VALUES
    ('Operação', 'Pedidos', '/admin', 1),
    ('Cardápio', 'Categorias', '/admin/categorias', 1),
    ('Cardápio', 'Produtos', '/admin/produtos', 2),
    ('Entrega', 'Zonas de entrega', '/admin/zonas-entrega', 1),
    ('Configurações', 'Minha loja', '/admin/loja', 1)
) AS p (categoria, nome, rota, ordem)
JOIN s_categoria_menu c ON c.nome = p.categoria;
