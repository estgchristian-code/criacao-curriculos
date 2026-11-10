# ResumeBuilder

Fundação de um monorepo com frontend React e API REST Laravel. A interface atual
é apenas um ponto de entrada técnico e uma verificação de conectividade; recursos
de produto ainda não foram implementados.

## Requisitos

- Node.js 20.19+ ou 22.12+
- PHP 8.3+ com `pdo_mysql`
- Composer 2
- MySQL 8+

## Instalação local (PowerShell)

1. Crie o banco e um usuário MySQL local com acesso ao banco `resume_builder`.
   Não use credenciais reais em arquivos versionados.
2. No terminal do backend:

   ```powershell
   cd backend
   composer install
   if (!(Test-Path .env)) { Copy-Item .env.example .env }
   php artisan key:generate
   php artisan migrate
   ```

   Se necessário, ajuste `DB_HOST`, `DB_PORT`, `DB_DATABASE`, `DB_USERNAME` e
   `DB_PASSWORD` no arquivo `backend/.env` para sua instalação local.

3. Em outro terminal, instale e inicie o frontend:

   ```powershell
   cd frontend
   npm install
   if (!(Test-Path .env)) { Copy-Item .env.example .env }
   npm run dev
   ```

4. Em um terceiro terminal, inicie a API:

   ```powershell
   cd backend
   php artisan serve --host=localhost --port=8000
   ```

Abra <http://localhost:5173>. O servidor Vite encaminha `/api` e `/sanctum` para
a API Laravel em `http://localhost:8000`.

## API e autenticação SPA

- Endpoint de verificação: `GET /api/v1/health`.
- Endpoint da sessão autenticada: `GET /api/v1/user` (protegido por
  `auth:sanctum`; o fluxo de cadastro e login ainda não faz parte desta etapa).
- Antes de requisições que alteram estado, chame `initializeCsrf()` do cliente
  em `frontend/src/lib/api.ts`. O cliente inclui o cookie XSRF e credenciais.
- O middleware stateful do Sanctum, cookies HTTP-only e CORS com credenciais
  estão preparados para os domínios locais de desenvolvimento.
- Para outra origem, configure `VITE_API_URL` no frontend e ajuste
  `CORS_ALLOWED_ORIGINS`, `SANCTUM_STATEFUL_DOMAINS`, `SESSION_DOMAIN` e
  `SESSION_SECURE_COOKIE` no ambiente do backend. Em produção, use HTTPS e
  origens explícitas; não habilite CORS com wildcard junto a cookies.

## Verificações

```powershell
# frontend
cd frontend
npm run build
npm run lint

# backend
cd backend
php artisan route:list --path=api
php artisan config:show sanctum
```

## Estrutura

```text
frontend/  React, Vite, TypeScript, Tailwind CSS e cliente HTTP
backend/   Laravel 13, API versionada e Sanctum
```
