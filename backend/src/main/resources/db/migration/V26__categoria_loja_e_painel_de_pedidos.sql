-- Nova categoria do menu "Loja" (futuramente terá também o "Site"): recebe a tela Minha loja, que sai de Geral.
UPDATE s_categoria_menu SET ordem = ordem + 1
WHERE ordem >= 3 AND NOT EXISTS (SELECT 1 FROM s_categoria_menu WHERE nome = 'Loja');

INSERT INTO s_categoria_menu (guid, nome, icone, ordem)
SELECT gen_random_uuid(), 'Loja', 'fa-solid fa-store', 3
WHERE NOT EXISTS (SELECT 1 FROM s_categoria_menu WHERE nome = 'Loja');

UPDATE s_pagina p
SET id_categoria_menu = c.id_categoria_menu, screen = 'Loja, Minha loja', ordem = 1
FROM s_categoria_menu c
WHERE c.nome = 'Loja' AND p.rota = '/admin/loja';

-- Operação > Painel de pedidos (quadro por situação, em tempo real), antes da lista de pedidos.
INSERT INTO s_pagina (guid, id_categoria_menu, nome, rota, ordem, screen)
SELECT gen_random_uuid(), c.id_categoria_menu, 'Painel de pedidos', '/admin/painel-pedidos', 0, 'Operação, Painel de pedidos'
FROM s_categoria_menu c
WHERE c.nome = 'Operação'
  AND NOT EXISTS (SELECT 1 FROM s_pagina x WHERE x.rota = '/admin/painel-pedidos');

INSERT INTO s_permissao (guid, codigo, nome, tipo, id_pagina, ordem)
SELECT gen_random_uuid(), v.codigo, v.nome, v.tipo, p.id_pagina, v.ordem
FROM (VALUES
    ('PAINEL_PEDIDOS_LEITURA', 'Visualizar o painel de pedidos', 'LEITURA', 1),
    ('PAINEL_PEDIDOS_ESCRITA', 'Editar o painel de pedidos', 'ESCRITA', 2),
    ('PAINEL_PEDIDOS_ALTERAR_STATUS', 'Avançar a situação do pedido pelo painel', 'ACAO', 3),
    ('PAINEL_PEDIDOS_CANCELAR', 'Cancelar pedido pelo painel', 'ACAO', 4)
) AS v (codigo, nome, tipo, ordem)
JOIN s_pagina p ON p.rota = '/admin/painel-pedidos'
WHERE NOT EXISTS (SELECT 1 FROM s_permissao x WHERE x.codigo = v.codigo);

-- Quem já via os pedidos passa a ver o painel também.
INSERT INTO t_permissao_usuario (guid, tenant, id_perfil_usuario, id_permissao)
SELECT gen_random_uuid(), pu.tenant, pu.id_perfil_usuario, novo.id_permissao
FROM t_permissao_usuario pu
JOIN s_permissao atual ON atual.id_permissao = pu.id_permissao AND atual.codigo IN ('PEDIDOS_LEITURA', 'PEDIDOS_ALTERAR_STATUS', 'PEDIDOS_CANCELAR')
JOIN s_permissao novo ON novo.codigo = replace(atual.codigo, 'PEDIDOS_', 'PAINEL_PEDIDOS_')
WHERE NOT EXISTS (SELECT 1 FROM t_permissao_usuario x WHERE x.id_perfil_usuario = pu.id_perfil_usuario AND x.id_permissao = novo.id_permissao);

INSERT INTO t_permissao_usuario (guid, tenant, id_perfil_usuario, id_permissao)
SELECT gen_random_uuid(), pu.tenant, pu.id_perfil_usuario, novo.id_permissao
FROM t_permissao_usuario pu
JOIN s_permissao atual ON atual.id_permissao = pu.id_permissao AND atual.codigo = 'PEDIDOS_ESCRITA'
JOIN s_permissao novo ON novo.codigo = 'PAINEL_PEDIDOS_ESCRITA'
WHERE NOT EXISTS (SELECT 1 FROM t_permissao_usuario x WHERE x.id_perfil_usuario = pu.id_perfil_usuario AND x.id_permissao = novo.id_permissao);
