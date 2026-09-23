-- "Seu perfil": WhatsApp do usuario e configuracoes de tela guardadas no proprio usuario.
ALTER TABLE s_usuario ADD COLUMN IF NOT EXISTS whatsapp varchar(20);
ALTER TABLE s_usuario ADD COLUMN IF NOT EXISTS salvar_configuracoes boolean NOT NULL DEFAULT false;
-- JSON com as preferencias (ex.: menu recolhido); so e usado quando salvar_configuracoes = true
ALTER TABLE s_usuario ADD COLUMN IF NOT EXISTS configuracoes text;
