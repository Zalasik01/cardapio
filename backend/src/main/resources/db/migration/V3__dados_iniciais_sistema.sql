-- Dados de sistema necessarios em qualquer ambiente: perfis de acesso e menu do painel.
-- Idempotente: nao duplica registros que ja existam.

INSERT INTO s_perfil (guid, nome, codigo)
SELECT gen_random_uuid(), p.nome, p.codigo
FROM (VALUES
    ('Super Administrador', 'ROLE_SUPER_ADMIN'),
    ('Administrador da Loja', 'ROLE_ADMIN_LOJA'),
    ('Cliente', 'ROLE_CLIENTE')
) AS p (nome, codigo)
WHERE NOT EXISTS (SELECT 1 FROM s_perfil x WHERE x.codigo = p.codigo);

INSERT INTO s_categoria_menu (guid, nome, icone, ordem)
SELECT gen_random_uuid(), c.nome, c.icone, c.ordem
FROM (VALUES
    ('Operação', 'fa-solid fa-bag-shopping', 1),
    ('Cardápio', 'fa-solid fa-utensils', 2),
    ('Entrega', 'fa-solid fa-motorcycle', 3),
    ('Configurações', 'fa-solid fa-gear', 4)
) AS c (nome, icone, ordem)
WHERE NOT EXISTS (SELECT 1 FROM s_categoria_menu x WHERE x.nome = c.nome);

INSERT INTO s_pagina (guid, id_categoria_menu, nome, rota, ordem)
SELECT gen_random_uuid(), c.id_categoria_menu, p.nome, p.rota, p.ordem
FROM (VALUES
    ('Operação', 'Pedidos', '/admin', 1),
    ('Cardápio', 'Categorias', '/admin/categorias', 1),
    ('Cardápio', 'Produtos', '/admin/produtos', 2),
    ('Entrega', 'Zonas de entrega', '/admin/zonas-entrega', 1),
    ('Configurações', 'Minha loja', '/admin/loja', 1)
) AS p (categoria, nome, rota, ordem)
JOIN s_categoria_menu c ON c.nome = p.categoria
WHERE NOT EXISTS (SELECT 1 FROM s_pagina x WHERE x.rota = p.rota);
