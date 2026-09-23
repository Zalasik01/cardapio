-- Caminho da tela para o cabecalho (breadcrumb): nomes separados por virgula.
-- Ex.: 'Geral, Pessoas, Funcionários' e exibido como Geral > Pessoas > Funcionários.
ALTER TABLE s_pagina ADD COLUMN IF NOT EXISTS screen varchar(255);

UPDATE s_pagina SET screen = 'Dashboards, Visão geral'          WHERE rota = '/admin/dashboard'     AND screen IS NULL;
UPDATE s_pagina SET screen = 'Geral, Usuários'                  WHERE rota = '/admin/usuarios'      AND screen IS NULL;
UPDATE s_pagina SET screen = 'Geral, Pessoas, Funcionários'     WHERE rota = '/admin/funcionarios'  AND screen IS NULL;
UPDATE s_pagina SET screen = 'Geral, Pessoas'                   WHERE nome = 'Pessoas' AND rota IS NULL AND screen IS NULL;
UPDATE s_pagina SET screen = 'Operação, Pedidos'                WHERE rota = '/admin/pedidos'       AND screen IS NULL;
UPDATE s_pagina SET screen = 'Cardápio, Categorias'             WHERE rota = '/admin/categorias'    AND screen IS NULL;
UPDATE s_pagina SET screen = 'Cardápio, Produtos'               WHERE rota = '/admin/produtos'      AND screen IS NULL;
UPDATE s_pagina SET screen = 'Entrega, Zonas de entrega'        WHERE rota = '/admin/zonas-entrega' AND screen IS NULL;
UPDATE s_pagina SET screen = 'Configurações, Minha loja'        WHERE rota = '/admin/loja'          AND screen IS NULL;
