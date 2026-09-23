-- Dados de demonstracao: carregados so nos perfis dev e docker (location classpath:db/dev).
-- Migration repetivel e idempotente: nao duplica o que ja existir.
--
-- Logins de teste:
--   admin@cardapio.com / admin123  (usuario do sistema: suporte, sem perfil de loja)
--   nonna@cardapio.com / nonna123  (administrador da loja Cantina da Nonna)

INSERT INTO s_loja (guid, nome, situacao_conta, tipo_organizacao, slug, descricao, telefone,
                    endereco_bairro, endereco_cidade, latitude, longitude,
                    taxa_entrega_base, taxa_entrega_por_km, distancia_maxima_entrega_km, valor_minimo_pedido)
SELECT gen_random_uuid(), 'Cantina da Nonna', 'ATIVA', 'RESTAURANTE', 'cantina-da-nonna',
       'Comida italiana caseira', '(11) 99999-0000', 'Centro', 'Sao Paulo', -23.5505, -46.6333,
       5.00, 1.50, 12.0, 20.00
WHERE NOT EXISTS (SELECT 1 FROM s_loja WHERE slug = 'cantina-da-nonna');

INSERT INTO s_loja (guid, nome, situacao_conta, tipo_organizacao, slug, descricao)
SELECT gen_random_uuid(), 'Pizzaria do Ze', 'ATIVA', 'RESTAURANTE', 'pizzaria-do-ze',
       'Pizzas artesanais no forno a lenha'
WHERE NOT EXISTS (SELECT 1 FROM s_loja WHERE slug = 'pizzaria-do-ze');

INSERT INTO s_usuario (guid, nome, email, senha, usuario_suporte, exige_trocar_senha, data_criacao)
SELECT gen_random_uuid(), 'Super Admin', 'admin@cardapio.com',
       encode(sha256('admin123'::bytea), 'hex'), true, false, now()::timestamp(0)
WHERE NOT EXISTS (SELECT 1 FROM s_usuario WHERE email = 'admin@cardapio.com');

INSERT INTO s_usuario (guid, nome, email, senha, usuario_suporte, exige_trocar_senha, data_criacao)
SELECT gen_random_uuid(), 'Admin da Nonna', 'nonna@cardapio.com',
       encode(sha256('nonna123'::bytea), 'hex'), false, false, now()::timestamp(0)
WHERE NOT EXISTS (SELECT 1 FROM s_usuario WHERE email = 'nonna@cardapio.com');

DO $$
DECLARE
    v_tenant  uuid;
    v_loja    bigint;
    v_usuario bigint;
    v_perfil  bigint;
    v_pf      bigint;
    v_pessoa  bigint;
    v_massas  bigint;
    v_bebidas bigint;
BEGIN
    SELECT guid, id_loja INTO v_tenant, v_loja FROM s_loja WHERE slug = 'cantina-da-nonna';
    SELECT id_usuario INTO v_usuario FROM s_usuario WHERE email = 'nonna@cardapio.com';
    SELECT id_perfil INTO v_perfil FROM s_perfil WHERE codigo = 'ROLE_ADMIN_LOJA';

    -- Vinculo do usuario com a loja (pessoa fisica + pessoa + perfil ATIVO)
    IF NOT EXISTS (SELECT 1 FROM t_perfil_usuario WHERE id_usuario = v_usuario AND id_loja = v_loja) THEN
        INSERT INTO t_pessoa_fisica (guid, tenant, nome, apelido)
        VALUES (gen_random_uuid(), v_tenant, 'Admin da Nonna', 'Nonna')
        RETURNING id_pessoa_fisica INTO v_pf;

        INSERT INTO t_pessoa (guid, tenant, id_pessoa_fisica)
        VALUES (gen_random_uuid(), v_tenant, v_pf)
        RETURNING id_pessoa INTO v_pessoa;

        INSERT INTO t_perfil_usuario (guid, tenant, id_usuario, id_pessoa, id_loja, id_perfil, status)
        VALUES (gen_random_uuid(), v_tenant, v_usuario, v_pessoa, v_loja, v_perfil, 'ATIVO');
    END IF;

    -- Cardapio e zonas de entrega
    IF NOT EXISTS (SELECT 1 FROM t_categoria WHERE tenant = v_tenant) THEN
        INSERT INTO t_categoria (guid, tenant, nome, ordem_exibicao)
        VALUES (gen_random_uuid(), v_tenant, 'Massas', 1) RETURNING id_categoria INTO v_massas;
        INSERT INTO t_categoria (guid, tenant, nome, ordem_exibicao)
        VALUES (gen_random_uuid(), v_tenant, 'Bebidas', 2) RETURNING id_categoria INTO v_bebidas;

        INSERT INTO t_produto (guid, tenant, id_categoria, nome, descricao, preco, ordem_exibicao) VALUES
            (gen_random_uuid(), v_tenant, v_massas, 'Lasanha a Bolonhesa',
             'Camadas de massa, molho bolonhesa e queijo gratinado', 39.90, 1),
            (gen_random_uuid(), v_tenant, v_massas, 'Fettuccine Alfredo',
             'Massa fresca ao molho branco cremoso', 34.90, 2),
            (gen_random_uuid(), v_tenant, v_bebidas, 'Suco Natural',
             'Laranja, limao ou maracuja', 8.00, 1);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM t_zona_entrega WHERE tenant = v_tenant) THEN
        INSERT INTO t_zona_entrega (guid, tenant, bairro, taxa, tempo_estimado_minutos) VALUES
            (gen_random_uuid(), v_tenant, 'Centro', 4.00, 30),
            (gen_random_uuid(), v_tenant, 'Jardins', 7.50, 40);
    END IF;
END $$;
