-- Menu em arvore: uma pagina pode ter uma pagina "pai" (id_pagina_pai), formando submenus
-- dentro da categoria. A pagina pai funciona como agrupador e pode nao ter rota propria.

ALTER TABLE s_pagina ADD COLUMN IF NOT EXISTS id_pagina_pai bigint;

ALTER TABLE s_pagina DROP CONSTRAINT IF EXISTS fk_s_pagina_pagina_pai;
ALTER TABLE s_pagina ADD CONSTRAINT fk_s_pagina_pagina_pai
    FOREIGN KEY (id_pagina_pai) REFERENCES s_pagina (id_pagina);

ALTER TABLE s_pagina DROP CONSTRAINT IF EXISTS ck_s_pagina_pai_diferente;
ALTER TABLE s_pagina ADD CONSTRAINT ck_s_pagina_pai_diferente
    CHECK (id_pagina_pai IS NULL OR id_pagina_pai <> id_pagina);

CREATE INDEX IF NOT EXISTS ix_s_pagina_pagina_pai ON s_pagina (id_pagina_pai);

ALTER TABLE s_pagina ALTER COLUMN rota DROP NOT NULL;

-- Exemplo: Geral > Pessoas > Funcionarios
INSERT INTO s_pagina (guid, id_categoria_menu, nome, rota, ordem)
SELECT gen_random_uuid(), c.id_categoria_menu, 'Pessoas', NULL, 2
FROM s_categoria_menu c
WHERE c.nome = 'Geral'
  AND NOT EXISTS (SELECT 1 FROM s_pagina x WHERE x.id_categoria_menu = c.id_categoria_menu AND x.nome = 'Pessoas');

UPDATE s_pagina f
SET id_pagina_pai = p.id_pagina, ordem = 1
FROM s_pagina p
WHERE f.rota = '/admin/funcionarios'
  AND p.nome = 'Pessoas'
  AND p.id_categoria_menu = f.id_categoria_menu
  AND f.id_pagina_pai IS NULL;
