-- Categorias (do cardápio) passam de Cardápio para Geral > Produtos, junto dos produtos finais e ingredientes.
UPDATE s_pagina c
SET id_categoria_menu = pai.id_categoria_menu,
    id_pagina_pai     = pai.id_pagina,
    ordem             = 3,
    screen            = 'Geral, Produtos, Categorias'
FROM s_pagina pai
JOIN s_categoria_menu geral ON geral.id_categoria_menu = pai.id_categoria_menu AND geral.nome = 'Geral'
WHERE c.rota = '/admin/categorias'
  AND pai.nome = 'Produtos' AND pai.rota IS NULL
  AND c.id_pagina_pai IS DISTINCT FROM pai.id_pagina;
