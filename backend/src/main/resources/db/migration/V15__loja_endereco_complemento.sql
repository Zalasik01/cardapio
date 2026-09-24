-- Complemento do endereço da loja (o bloco de endereço é o mesmo dos demais cadastros).
ALTER TABLE s_loja ADD COLUMN IF NOT EXISTS endereco_complemento varchar(255);
