-- O item antigo "Cardápio > Produtos" (cadastro legado por guid) foi removido do sistema.
DELETE FROM s_pagina WHERE rota = '/admin/produtos';
