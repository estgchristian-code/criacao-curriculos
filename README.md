# ResumeBuilder

Monorepo com frontend React e API REST Laravel. O frontend oferece operações de
currículos ligadas à API; elas exigem uma sessão autenticada do Sanctum.

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
   `DB_PASSWORD` no arquivo `backend/.env` para sua instalação local. Confirme
   também `DB_CONNECTION=mysql` antes de executar as migrations.

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
   php artisan serve --host=127.0.0.1 --port=8000
   ```

Abra <http://localhost:5173>. O servidor Vite encaminha `/api` e `/sanctum` para
a API Laravel em `http://127.0.0.1:8000`.

## API e autenticação SPA

- Endpoint de verificação: `GET /api/v1/health`.
- Autenticação SPA por sessão Sanctum: `POST /api/v1/register`,
  `POST /api/v1/login`, `POST /api/v1/logout` e `GET /api/v1/user`.
  Cadastro exige `name`, `email`, `password` e `password_confirmation`; cria a
  conta e inicia a sessão. Login recebe `email` e `password`. As senhas têm no
  mínimo 8 caracteres e são armazenadas com o cast de hash do model `User`.
- O frontend verifica a sessão no carregamento da página; cookies de sessão e
  CSRF são enviados com `credentials: include`. Não armazena senhas ou tokens no
  navegador. Login, cadastro e operações protegidas dependem de cookies e da
  configuração de sessão do backend.
- Currículos (todos protegidos por `auth:sanctum`): `GET /api/v1/resumes`,
  `POST /api/v1/resumes`, `GET /api/v1/resumes/{resume}`,
  `PUT/PATCH /api/v1/resumes/{resume}` e
  `DELETE /api/v1/resumes/{resume}`. Os registros são vinculados ao usuário
  autenticado e armazenam nome, cargo e estilo do modelo.
- O cliente em `frontend/src/lib/api.ts` inicializa o cookie CSRF do Sanctum
  automaticamente antes de requisições que alteram estado e envia credenciais.
- Rotas `/user`, `/logout` e todas as operações de currículos exigem
  `auth:sanctum`. O frontend restringe o dashboard sem sessão e volta à tela de
  login quando a sessão expira (`401`).
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
composer test
php artisan route:list --path=api
php artisan migrate:status
php artisan config:show database
php artisan config:show sanctum
```

Confirme que `config:show database` exibe a conexão `mysql` e o banco
`resume_builder` antes de testar o fluxo completo. Os testes automatizados usam
SQLite em memória isoladamente; a aplicação em execução deve permanecer no
MySQL configurado no `.env`. Use `composer test` (ou limpe o cache de
configuração antes de `php artisan test`) para garantir que a suíte não reutilize
uma configuração em cache apontando para o MySQL.

### Erro "Não foi possível inicializar a proteção CSRF do Sanctum"

A mensagem indica que o `GET /sanctum/csrf-cookie` respondeu com status de erro.
Como esse endpoint usa a sessão do Laravel, verifique primeiro se o banco do
`SESSION_DRIVER` está acessível (`php artisan migrate:status`) e se o MySQL
configurado no `.env` está em execução. O cliente exibe também a `message`
retornada pela API para facilitar o diagnóstico. Em produção, com frontend e API
em origens diferentes, configure `VITE_API_URL`, `CORS_ALLOWED_ORIGINS`,
`SANCTUM_STATEFUL_DOMAINS` e `SESSION_DOMAIN`.

## Estrutura

```text
frontend/  React, Vite, TypeScript, Tailwind CSS e cliente HTTP
backend/   Laravel 13, API versionada e Sanctum
```
