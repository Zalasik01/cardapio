-- Ao cancelar um pedido a loja informa o motivo e se cobra taxa de cancelamento (0 = sem taxa).
ALTER TABLE t_pedido ADD COLUMN IF NOT EXISTS motivo_cancelamento varchar(500);
ALTER TABLE t_pedido ADD COLUMN IF NOT EXISTS taxa_cancelamento numeric(10, 2) NOT NULL DEFAULT 0;
