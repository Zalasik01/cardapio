-- A loja também cria pedidos (balcão, telefone, WhatsApp): nova ação nas telas Pedidos e Painel de pedidos.
INSERT INTO s_permissao (guid, codigo, nome, tipo, id_pagina, ordem)
SELECT gen_random_uuid(), v.codigo, v.nome, 'ACAO', p.id_pagina, v.ordem
FROM (VALUES
    ('/admin/pedidos', 'PEDIDOS_INCLUIR', 'Criar pedido', 10),
    ('/admin/painel-pedidos', 'PAINEL_PEDIDOS_INCLUIR', 'Criar pedido pelo painel', 10)
) AS v (rota, codigo, nome, ordem)
JOIN s_pagina p ON p.rota = v.rota
WHERE NOT EXISTS (SELECT 1 FROM s_permissao x WHERE x.codigo = v.codigo);

-- Quem já avança a situação dos pedidos passa a poder criar também (para não tirar nada de ninguém).
INSERT INTO t_permissao_usuario (guid, tenant, id_perfil_usuario, id_permissao)
SELECT gen_random_uuid(), pu.tenant, pu.id_perfil_usuario, novo.id_permissao
FROM t_permissao_usuario pu
JOIN s_permissao atual ON atual.id_permissao = pu.id_permissao
    AND atual.codigo IN ('PEDIDOS_ALTERAR_STATUS', 'PAINEL_PEDIDOS_ALTERAR_STATUS')
JOIN s_permissao novo ON novo.codigo = replace(atual.codigo, 'ALTERAR_STATUS', 'INCLUIR')
WHERE NOT EXISTS (SELECT 1 FROM t_permissao_usuario x
                  WHERE x.id_perfil_usuario = pu.id_perfil_usuario AND x.id_permissao = novo.id_permissao);
