-- Produto: esgotado, janela de disponibilidade, selos/alérgenos e promoção por dia/horário (happy hour).
ALTER TABLE t_produto ADD COLUMN IF NOT EXISTS esgotado_ate      timestamp;
ALTER TABLE t_produto ADD COLUMN IF NOT EXISTS disponivel_dias   varchar(20);
ALTER TABLE t_produto ADD COLUMN IF NOT EXISTS disponivel_das    time;
ALTER TABLE t_produto ADD COLUMN IF NOT EXISTS disponivel_ate    time;
ALTER TABLE t_produto ADD COLUMN IF NOT EXISTS selos             varchar(200);
ALTER TABLE t_produto ADD COLUMN IF NOT EXISTS alergenos         varchar(300);
ALTER TABLE t_produto ADD COLUMN IF NOT EXISTS promo_dias        varchar(20);
ALTER TABLE t_produto ADD COLUMN IF NOT EXISTS promo_inicio      time;
ALTER TABLE t_produto ADD COLUMN IF NOT EXISTS promo_fim         time;

-- Loja: pausa temporária de pedidos e limite de pedidos em preparo.
ALTER TABLE s_loja ADD COLUMN IF NOT EXISTS pedidos_pausados_ate    timestamp;
ALTER TABLE s_loja ADD COLUMN IF NOT EXISTS limite_pedidos_em_preparo integer;

-- Vendas por produto (mais vendidos) filtram por loja e período.
CREATE INDEX IF NOT EXISTS ix_i_item_pedido_produto ON i_item_pedido (id_produto);
