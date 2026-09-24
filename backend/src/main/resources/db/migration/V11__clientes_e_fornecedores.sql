-- Clientes e Fornecedores: pessoa fisica ou juridica marcada como cliente e/ou fornecedor.

-- 1) Papel da pessoa na loja
ALTER TABLE t_pessoa ADD COLUMN IF NOT EXISTS cliente    boolean NOT NULL DEFAULT false;
ALTER TABLE t_pessoa ADD COLUMN IF NOT EXISTS fornecedor boolean NOT NULL DEFAULT false;

-- 2) Pessoa juridica: novos campos (o telefone passa a ser um contato em t_pessoa_telefone)
ALTER TABLE t_pessoa_juridica ADD COLUMN IF NOT EXISTS inscricao_estadual   varchar(30);
ALTER TABLE t_pessoa_juridica ADD COLUMN IF NOT EXISTS inscricao_municipal  varchar(30);
ALTER TABLE t_pessoa_juridica ADD COLUMN IF NOT EXISTS observacao           varchar(2000);
ALTER TABLE t_pessoa_juridica DROP COLUMN IF EXISTS telefone;

-- um CNPJ por loja (so digitos)
CREATE UNIQUE INDEX IF NOT EXISTS uk_t_pessoa_juridica_tenant_cnpj
    ON t_pessoa_juridica (tenant, cnpj) WHERE cnpj IS NOT NULL AND deletado = false;

-- 3) Menu: Geral > Pessoas > Clientes e Fornecedores
INSERT INTO s_pagina (guid, id_categoria_menu, nome, rota, ordem, id_pagina_pai, screen)
SELECT gen_random_uuid(), c.id_categoria_menu, 'Clientes e Fornecedores', '/admin/pessoas', 2, p.id_pagina,
       'Geral, Pessoas, Clientes e Fornecedores'
FROM s_categoria_menu c
JOIN s_pagina p ON p.id_categoria_menu = c.id_categoria_menu AND p.nome = 'Pessoas' AND p.rota IS NULL
WHERE c.nome = 'Geral'
  AND NOT EXISTS (SELECT 1 FROM s_pagina x WHERE x.rota = '/admin/pessoas');
