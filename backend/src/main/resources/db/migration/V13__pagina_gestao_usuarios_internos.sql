-- Gestão Interna > Gestão de Usuários Internos (equipe da plataforma; só o usuário administrador vê a categoria).
INSERT INTO s_pagina (guid, id_categoria_menu, nome, rota, ordem, screen)
SELECT gen_random_uuid(), c.id_categoria_menu, 'Gestão de Usuários Internos', '/admin/gestao-usuarios', 2,
       'Gestão Interna, Gestão de Usuários Internos'
FROM s_categoria_menu c
WHERE c.nome = 'Gestão Interna'
  AND NOT EXISTS (SELECT 1 FROM s_pagina x WHERE x.rota = '/admin/gestao-usuarios');
