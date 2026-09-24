-- Usuario administrador da plataforma e a categoria de menu "Gestão Interna" (somente para ele).

-- 1) Quem administra a plataforma (diferente do suporte e do administrador de uma loja)
ALTER TABLE s_usuario ADD COLUMN IF NOT EXISTS usuario_administrador boolean NOT NULL DEFAULT false;

-- 2) Categorias marcadas assim so aparecem no menu (e so tem a API liberada) para o usuario administrador
ALTER TABLE s_categoria_menu ADD COLUMN IF NOT EXISTS somente_administrador boolean NOT NULL DEFAULT false;

-- 3) Menu: Gestão Interna > Gestão de Lojas (ao final do menu)
INSERT INTO s_categoria_menu (guid, nome, icone, ordem, somente_administrador)
SELECT gen_random_uuid(), 'Gestão Interna', 'fa-solid fa-user-shield',
       COALESCE((SELECT MAX(ordem) FROM s_categoria_menu), 0) + 1, true
WHERE NOT EXISTS (SELECT 1 FROM s_categoria_menu WHERE nome = 'Gestão Interna');

INSERT INTO s_pagina (guid, id_categoria_menu, nome, rota, ordem, screen)
SELECT gen_random_uuid(), c.id_categoria_menu, 'Gestão de Lojas', '/admin/gestao-lojas', 1,
       'Gestão Interna, Gestão de Lojas'
FROM s_categoria_menu c
WHERE c.nome = 'Gestão Interna'
  AND NOT EXISTS (SELECT 1 FROM s_pagina x WHERE x.rota = '/admin/gestao-lojas');
