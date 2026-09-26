-- Um cliente/fornecedor pode ter mais de um endereço (casa, trabalho...): um deles é o principal.
ALTER TABLE t_pessoa_endereco DROP CONSTRAINT IF EXISTS uk_t_pessoa_endereco_pessoa;
ALTER TABLE t_pessoa_endereco ADD COLUMN IF NOT EXISTS apelido   varchar(40);
ALTER TABLE t_pessoa_endereco ADD COLUMN IF NOT EXISTS principal boolean NOT NULL DEFAULT false;
UPDATE t_pessoa_endereco SET principal = true WHERE principal = false;
CREATE INDEX IF NOT EXISTS ix_t_pessoa_endereco_pessoa ON t_pessoa_endereco (id_pessoa);
