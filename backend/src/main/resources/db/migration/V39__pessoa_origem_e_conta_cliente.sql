-- Clientes que se cadastram pelo app/site (conta por telefone) aparecem em Clientes e Fornecedores, marcados pela origem.
ALTER TABLE t_pessoa ADD COLUMN IF NOT EXISTS origem varchar(20) NOT NULL DEFAULT 'PAINEL';
ALTER TABLE t_pessoa ADD COLUMN IF NOT EXISTS id_cliente_conta bigint;
CREATE INDEX IF NOT EXISTS ix_t_pessoa_cliente_conta ON t_pessoa (tenant, id_cliente_conta);
