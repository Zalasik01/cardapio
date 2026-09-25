-- O grupo Produtos (Produtos finais, Ingredientes e Categorias) passa de Geral para dentro de Cardápio.
-- O item antigo "Cardápio > Produtos" (cadastro legado) sai do menu: o grupo novo o substitui.
UPDATE s_pagina p
SET id_categoria_menu = cardapio.id_categoria_menu
FROM s_categoria_menu cardapio, s_pagina grupo
WHERE cardapio.nome = 'Cardápio'
  AND grupo.nome = 'Produtos' AND grupo.rota IS NULL
  AND (p.id_pagina = grupo.id_pagina OR p.id_pagina_pai = grupo.id_pagina);

UPDATE s_pagina
SET screen = replace(screen, 'Geral, Produtos', 'Cardápio, Produtos'), ordem = 1
WHERE nome = 'Produtos' AND rota IS NULL;

UPDATE s_pagina
SET screen = replace(screen, 'Geral, Produtos', 'Cardápio, Produtos')
WHERE screen LIKE 'Geral, Produtos,%';

UPDATE s_pagina SET ativo = false WHERE rota = '/admin/produtos';
