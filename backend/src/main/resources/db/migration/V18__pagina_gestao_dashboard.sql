-- Gestão Interna > Dashboards (primeira página da categoria).
INSERT INTO s_pagina (guid, id_categoria_menu, nome, rota, ordem, screen)
SELECT gen_random_uuid(), c.id_categoria_menu, 'Dashboards', '/admin/gestao-dashboard', 0,
       'Gestão Interna, Dashboards'
FROM s_categoria_menu c
WHERE c.nome = 'Gestão Interna'
  AND NOT EXISTS (SELECT 1 FROM s_pagina x WHERE x.rota = '/admin/gestao-dashboard');
