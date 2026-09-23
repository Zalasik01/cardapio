-- 1) Status do vinculo usuario-loja (ATIVO, PENDENTE, REJEITADO).
--    Registros existentes viram ATIVO; a aplicacao passa a informar o status sempre.
ALTER TABLE t_perfil_usuario ADD COLUMN IF NOT EXISTS status varchar(255) NOT NULL DEFAULT 'ATIVO';
ALTER TABLE t_perfil_usuario ALTER COLUMN status DROP DEFAULT;
ALTER TABLE t_perfil_usuario DROP CONSTRAINT IF EXISTS ck_t_perfil_usuario_status;
ALTER TABLE t_perfil_usuario ADD CONSTRAINT ck_t_perfil_usuario_status
    CHECK (status IN ('ATIVO', 'PENDENTE', 'REJEITADO'));

-- 2) Validade do link de "novo usuario" / esqueci a senha (o token ja existe em s_usuario).
ALTER TABLE s_usuario ADD COLUMN IF NOT EXISTS esqueci_senha_expira_em timestamp(0);
CREATE UNIQUE INDEX IF NOT EXISTS uk_s_usuario_esqueci_senha_token
    ON s_usuario (esqueci_senha_token) WHERE esqueci_senha_token IS NOT NULL;

-- 3) Menu: categorias Dashboards (tela padrao) e Geral; Pedidos passa para /admin/pedidos.
UPDATE s_pagina SET rota = '/admin/pedidos' WHERE rota = '/admin';

UPDATE s_categoria_menu SET ordem = ordem + 2
WHERE NOT EXISTS (SELECT 1 FROM s_categoria_menu WHERE nome = 'Dashboards');

INSERT INTO s_categoria_menu (guid, nome, icone, ordem)
SELECT gen_random_uuid(), c.nome, c.icone, c.ordem
FROM (VALUES
    ('Dashboards', 'fa-solid fa-chart-line', 1),
    ('Geral', 'fa-solid fa-layer-group', 2)
) AS c (nome, icone, ordem)
WHERE NOT EXISTS (SELECT 1 FROM s_categoria_menu x WHERE x.nome = c.nome);

INSERT INTO s_pagina (guid, id_categoria_menu, nome, rota, ordem)
SELECT gen_random_uuid(), c.id_categoria_menu, p.nome, p.rota, p.ordem
FROM (VALUES
    ('Dashboards', 'Visão geral', '/admin/dashboard', 1),
    ('Geral', 'Usuários', '/admin/usuarios', 1)
) AS p (categoria, nome, rota, ordem)
JOIN s_categoria_menu c ON c.nome = p.categoria
WHERE NOT EXISTS (SELECT 1 FROM s_pagina x WHERE x.rota = p.rota);
