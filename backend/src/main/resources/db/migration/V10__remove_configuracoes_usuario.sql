-- A opcao de guardar configuracoes de tela na conta do usuario foi descartada.
ALTER TABLE s_usuario DROP COLUMN IF EXISTS salvar_configuracoes;
ALTER TABLE s_usuario DROP COLUMN IF EXISTS configuracoes;
