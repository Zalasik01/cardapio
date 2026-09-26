-- Preço promocional (vale enquanto preenchido) e destaque do produto no cardápio online.
ALTER TABLE t_produto ADD COLUMN IF NOT EXISTS preco_promocional NUMERIC(12, 2);
ALTER TABLE t_produto ADD COLUMN IF NOT EXISTS destaque BOOLEAN NOT NULL DEFAULT FALSE;
