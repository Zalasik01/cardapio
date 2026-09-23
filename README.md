# Cardápio Digital — SaaS para Restaurantes

Plataforma multi-restaurante com cardápio digital, carrinho de compras, cálculo de frete
e painel administrativo.

## Estrutura

```
backend/    API REST em Java 17 + Spring Boot 3 (entity, dto, repository, service, controller)
frontend/   Aplicação em React + JavaScript (Vite)
```

## Rodando com Docker

```bash
docker compose up -d --build     # postgres + backend + frontend
docker compose watch             # opcional: hot reload do frontend (deixe rodando em outro terminal)
```

- Frontend: http://localhost:5173 (cardápio de exemplo em `/cantina-da-nonna`, painel em `/admin/login`)
- API: http://localhost:8080/api
- Postgres: `localhost:5440`, banco `cardapio`, usuário `postgres`, senha `postgres`

Logins de teste (dados de demonstração):
- `admin@cardapio.com` / `admin123` — usuário do sistema: escolhe qualquer loja após o login
- `nonna@cardapio.com` / `nonna123` — administrador da loja "Cantina da Nonna"

## Banco de dados (Flyway)

O schema é gerenciado por migrations SQL em `backend/src/main/resources/db/migration`
(o Hibernate apenas valida). Nunca edite uma migration já aplicada: crie uma nova (`V5__...sql`),
usando `IF NOT EXISTS` nos comandos de criação.

Os dados de demonstração ficam em `db/dev/R__dados_demonstracao.sql`, carregados só nos
perfis `dev` e `docker` (nunca em produção).

## Multi-tenant e acesso

- `s_usuario`: credenciais do usuário, sem loja. Um usuário pode ter acesso a várias lojas.
- `t_perfil_usuario`: vínculo usuário × loja (com `t_pessoa`, papel em `s_perfil` e `status`
  ATIVO/PENDENTE/REJEITADO). Só vínculo ATIVO dá acesso.
- Usuário de suporte **sem** vínculo é usuário do sistema e vê todas as lojas.
- Após o login, o usuário escolhe a loja (modal na tela de login); o token passa a valer só para ela.
- Novo usuário: criado como PENDENTE com um link `/novo-usuario/{token}` para definir a senha
  (senha forte obrigatória); ao definir, vira ATIVO e já entra no sistema.

## Backend sem Docker

```bash
docker compose up -d postgres
cd backend
mvn spring-boot:run          # perfil dev: Postgres em localhost:5440 + dados de demonstração
```

## Frontend sem Docker

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```
