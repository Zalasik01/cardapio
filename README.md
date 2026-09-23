# Cardápio Digital — SaaS para Restaurantes

Plataforma multi-restaurante com cardápio digital, carrinho de compras, cálculo de frete
e painel administrativo.

## Estrutura

```
backend/    API REST em Java 17 + Spring Boot 3 (padrão MVC: entity, dto, repository, service, controller)
frontend/   Aplicação em React + JavaScript (Vite)
```

## Funcionalidades

- Cardápio público por restaurante (`/:slug`), com categorias e produtos
- Carrinho de compras persistido no navegador
- Cálculo de frete: taxa fixa por bairro (zona de entrega) ou por distância (fórmula de Haversine)
- Checkout com entrega ou retirada no local
- Painel administrativo (JWT): categorias, produtos, zonas de entrega, pedidos e dados do restaurante
- Multi-tenant: cada restaurante tem seu próprio cardápio, frete e pedidos; `SUPER_ADMIN` gerencia restaurantes

## Backend

```bash
cd backend
mvn spring-boot:run
```

Roda por padrão no perfil `dev`, com banco H2 em memória e dados de exemplo (`DataSeeder`).

Usuários de teste (perfil dev):
- `admin@cardapio.com` / `admin123` (super admin)
- `nonna@cardapio.com` / `nonna123` (admin do restaurante "Cantina da Nonna", slug `cantina-da-nonna`)

Para produção, use o perfil `prod` (PostgreSQL) — veja `docker-compose.yml` para subir o banco local:

```bash
docker compose up -d postgres
cd backend
SPRING_PROFILES_ACTIVE=prod mvn spring-boot:run
```

## Frontend

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

Acesse `http://localhost:5173/cantina-da-nonna` para ver o cardápio de exemplo,
ou `http://localhost:5173/admin/login` para o painel administrativo.
