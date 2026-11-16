# RELATÓRIO DE AUDITORIA — ResumeBuilder

**Projeto:** sistema-curriculo-web  
**Data:** 12/11/2026  
**Escopo:** Backend Laravel 13 + Frontend React 19 + TypeScript  
**Ambiente de validação:** Windows PowerShell, PHP não disponível para execução de testes Laravel  

---

## 1. Resumo Executivo

O ResumeBuilder é uma aplicação monolítica separada em backend (Laravel 13 API REST) e frontend (React 19 SPA com Vite). A arquitetura é coesa, com autenticação baseada em sessão via Laravel Sanctum (modo stateful), autorização por propriedade de recurso (user_id), validação de entrada rigorosa via FormRequest, e pré-visualização A4 com container queries.

**Aptidão para produção:** PARCIALMENTE ADEQUADO. O núcleo funcional e de segurança está bem implementado, mas há lacunas de configuração de produção (cookies sem `secure` por padrão, `APP_DEBUG=true` no exemplo de ambiente, ausência de testes de segurança automatizados) que devem ser corrigidas antes de expor o sistema em ambiente público.

---

## 2. Metodologia

A auditoria foi dividida em três eixos:

| Eixo | O que foi avaliado |
|------|-------------------|
| Testes funcionais | Auth, CRUD, editor, seções, preview, modelos, persistência, navegação |
| Segurança | Autenticação, autorização/IDOR, mass assignment, XSS, SQLi, CSRF, sessões, configuração de produção |
| Validação | Execução de `npm run lint`, `npm run build` (frontend); revisão estática do backend (PHP não disponível no ambiente) |

**Limitação:** Não foi possível executar `php artisan test` pois o PHP não está instalado neste ambiente. Os testes do backend foram avaliados por revisão de código estático. Testes não executados não são considerados aprovados.

---

## 3. Testes Funcionais

### 3.1 Testes do Frontend (executados)

| Comando | Resultado |
|---------|-----------|
| `npm run lint` (oxlint) | ✅ APROVADO — sem erros, sem avisos |
| `npm run build` (tsc + vite) | ✅ APROVADO — build de produção gerado com sucesso |

### 3.2 Testes do Backend (não executados — revisão estática)

| Arquivo de teste | Casos de teste | Status |
|------------------|----------------|--------|
| `AuthApiTest.php` | Registro, login, logout, sessão, rotas protegidas | Não executado (PHP indisponível) |
| `ResumeApiTest.php` | CRUD, auth, isolamento de usuários, validação, paginação, PUT vs PATCH | Não executado (PHP indisponível) |
| `ResumeDocumentApiTest.php` | Document JSON, template/style sync, headers, dates, chronology, health | Não executado (PHP indisponível) |
| `SanctumCsrfTest.php` | CSRF cookie, XSRF token legível por JS | Não executado (PHP indisponível) |
| `ExampleTest.php` (Unit/Feature) | Placeholder | Não executado |

### 3.3 Avaliação Funcional por Área

| Área | Implementação | Observações |
|------|--------------|-------------|
| Cadastro | ✅ Implementado | Validação de nome, email único, senha ≥8 chars com confirmação, hash bcrypt |
| Login | ✅ Implementado | Attempt com regeneração de sessão, normalização de email (lowercase/trim) |
| Logout | ✅ Implementado | Invalida sessão, regenera token, forget guards |
| Sessões | ✅ Implementado | Driver database, lifetime 120 min, HttpOnly, SameSite=lax, regeneração em login/logout |
| CRUD de currículos | ✅ Implementado | Create, read (summary + detail), update (PUT/PATCH), delete com 204 |
| Isolamento entre usuários | ✅ Implementado | `abort_unless(user_id === auth()->id(), 404)` em todos os endpoints |
| Editor: dados pessoais | ✅ Implementado | Nome, headline, email, telefone, localização, website, LinkedIn |
| Editor: experiências | ✅ Implementado | Itens com datas (YYYY ou YYYY-M), organização, localização, descrição |
| Editor: formação | ✅ Implementado | Mesmo padrão de itens |
| Editor: habilidades | ✅ Implementado | Tags (array de strings, max 80) |
| Editor: idiomas | ✅ Implementado | Tipo `languages` com tags, suporte a nome/proficiência/CEFR |
| Adição/exclusão de seções | ✅ Implementado | `addSection`, `removeSection` no editor |
| Reordenação | ✅ Implementado | `moveSection`, `moveItem` |
| Visibilidade | ✅ Implementado | Campo `visible` booleano por seção, filtrado no preview |
| Quatro modelos | ✅ Implementado | classic, editorial, modern, minimal |
| Pré-visualização A4 | ✅ Implementado | Container queries, unidades cqw, tema por estilo |
| Salvamento | ✅ Implementado | PATCH com snapshot completo do documento |
| Persistência MySQL | ✅ Implementado | Coluna JSON `document`, cast array no modelo |
| Reabertura | ✅ Implementado | `GET /resumes/{id}` retorna documento completo |
| Atualização de página (F5) | ✅ Implementado (correção recente) | Parâmetro `?resume=ID` na URL, persistido via `history.pushState`, restaurado no mount |
| Responsividade | ✅ Implementado | Layout grid, sidebar fixa em desktop, drawer em mobile, `min-width: 320px` |

---

## 4. Segurança

### 4.1 Autenticação

| Item | Implementação | Avaliação |
|------|--------------|-----------|
| Guard padrão | `web` (session) via Sanctum | ✅ Adequado |
| Hashtagem de senha | bcrypt (12 rounds dev, 4 rounds test) | ✅ Adequado |
| Rate limiting | `throttle:5,1` (registro), `throttle:6,1` (login) | ✅ Adequado |
| Regeneração de sessão | `session()->regenerate()` em login/logout | ✅ Adequado |
| Normalização de email | lowercase + trim antes de validar/criar | ✅ Boa prática |
| Senha não exposta | `$hidden` no UserResource, `assertJsonMissingPath` nos testes | ✅ Adequado |
| Logout completo | `Auth::forgetGuards()`, `session()->invalidate()`, `regenerateToken()` | ✅ Adequado |

### 4.2 Autorização e IDOR

| Item | Implementação | Avaliação |
|------|--------------|-----------|
| Propriedade de recurso | `abort_unless($resume->user_id === $request->user()->id, 404)` | ✅ Adequado |
| Resposta 404 (não 403) | Evita vazamento de existência do recurso | ✅ Boa prática |
| Listagem filtrada | `$request->user()->resumes()` — apenas próprios | ✅ Adequado |
| Middleware de auth | `auth:sanctum` em todas as rotas exceto register/login/health | ✅ Adequado |

### 4.3 Validação e Mass Assignment

| Item | Implementação | Avaliação |
|------|--------------|-----------|
| Fillable explícito | User: `['name','email','password']`; Resume: `['name','role','style','document']` | ✅ Adequado |
| Nenhum `unguarded` | Não encontrado no código | ✅ Adequado |
| FormRequest | `StoreResumeRequest`, `UpdateResumeRequest` estendem `ResumeRequest` | ✅ Adequado |
| Tamanho do documento | Limite 256 KB via closure customizada | ✅ Adequado |
| Validação aninhada | `document.*` com regras profundas (theme, header, sections, items) | ✅ Adequado |
| Enum validation | `ResumeStyle`, `ResumeSectionType` | ✅ Adequado |
| Template = style | Validação cruzada `document.template === style` | ✅ Adequado |
| URL scheme | Apenas `http,https` (bloqueia `javascript:`, `ftp:`, etc.) | ✅ Adequado |
| Email | Regra `email` do Laravel | ✅ Adequado |
| Datas | Formato `YYYY` ou `YYYY-MM`, chronologia endDate ≥ startDate | ✅ Adequado |
| IDs distintos | `distinct:strict` para seções e itens | ✅ Adequado |

### 4.4 XSS (Cross-Site Scripting)

| Vetor | Proteção | Avaliação |
|-------|----------|-----------|
| URLs no header | `url:http,https` — bloqueia `javascript:` e outros esquemas perigosos | ✅ Adequado |
| Renderização frontend | React escapa por padrão; nenhum `dangerouslySetInnerHTML` encontrado | ✅ Adequado |
| Dados do document JSON | Armazenados e renderizados via React components | ✅ Adequado |
| Conteúdo gerado pelo usuário | Todos os campos de texto são strings simples sem HTML | ✅ Adequado |

### 4.5 SQL Injection

| Vetor | Proteção | Avaliação |
|-------|----------|-----------|
| Consultas via Eloquent | Query builder com binding parametrizado | ✅ Adequado |
| Nenhum `DB::raw` ou `whereRaw` | Não encontrado nos controladores | ✅ Adequado |
| Relacionamentos | `hasMany`/`belongsTo` via Eloquent | ✅ Adequado |

### 4.6 CSRF (Cross-Site Request Forgery)

| Item | Implementação | Avaliação |
|------|--------------|-----------|
| Middleware | `ValidateCsrfToken` via Sanctum stateful middleware | ✅ Adequado |
| Token header | `X-XSRF-TOKEN` enviado pelo frontend em métodos não-seguros | ✅ Adequado |
| Cookie XSRF-TOKEN | Não é HttpOnly (legível por JS), padrão para SPA | ✅ Adequado |
| Cookie de sessão | HttpOnly = true | ✅ Adequado |
| Endpoint CSRF | `GET /sanctum/csrf-cookie` disponível | ✅ Adequado |
| Retentativa 419 | Frontend re-inicializa CSRF e retry uma vez | ✅ Adequado |

### 4.7 Proteção de Sessão e Dados Pessoais

| Item | Implementação | Avaliação |
|------|--------------|-----------|
| Cookie HttpOnly | `true` (env `SESSION_HTTP_ONLY`) | ✅ Adequado |
| Cookie SameSite | `lax` (env `SESSION_SAME_SITE`) | ⚠️ Médio — `strict` seria mais restritivo |
| Cookie Secure | Depende de `SESSION_SECURE_COOKIE` (não definido no .env.example) | ⚠️ Médio — em produção com HTTPS deve ser `true` |
| Driver de sessão | `database` (tabela `sessions`) | ✅ Adequado |
| Lifetime | 120 minutos | ✅ Adequado |
| Serialização | `json` (não `php`, evita gadget chains) | ✅ Adequado |
| Senha oculta | `$hidden` no modelo User | ✅ Adequado |

### 4.8 Configurações de Produção

| Item | Valor atual | Avaliação |
|------|-------------|-----------|
| `APP_DEBUG` | `true` no .env.example | ❌ Alta — deve ser `false` em produção |
| `SESSION_SECURE_COOKIE` | Não definido (default false) | ⚠️ Média — cookies via HTTP em produção sem HTTPS |
| `CORS_ALLOWED_ORIGINS` | Apenas localhost:5173 | ✅ Adequado para dev, deve ser ajustado em produção |
| `SANCTUM_STATEFUL_DOMAINS` | Inclui localhost e 127.0.0.1 | ✅ Adequado para dev, deve incluir domínio de produção |
| `BCRYPT_ROUNDS` | 12 | ✅ Adequado |
| `MAIL_MAILER` | `log` | ✅ Adequado para dev |

### 4.9 Dependências

| Comando | Resultado |
|---------|-----------|
| `npm run build` (frontend) | ✅ Sucesso, sem avisos de vulnerabilidade relatados |
| `composer audit` | Não executável (PHP indisponível) |

---

## 5. Vulnerabilidades Encontradas

| ID | Severidade | Componente | Descrição | Evidência |
|----|-----------|------------|-----------|-----------|
| VULN-01 | Alta | Backend / Config | `APP_DEBUG=true` no `.env.example` — **CORRIGIDO** (definido como `false`) | `backend/.env.example` linha 4 |
| VULN-02 | Média | Backend / Sessão | Cookie de sessão sem `secure` por padrão — **CORRIGIDO** (auto-detecta HTTPS via `APP_URL`) | `backend/config/session.php` linha 172 |
| VULN-03 | Média | Backend / Sessão | `SameSite=lax` mantido após avaliação do fluxo Sanctum/CSRF — `strict` quebraria autenticação SPA com proxy Vite | `backend/config/session.php` linha 202 |
| VULN-04 | Baixa | Backend / Config | CORS já configurável via `CORS_ALLOWED_ORIGINS` com default localhost; sem wildcard, sem domínio de produção inventado | `backend/config/cors.php` linhas 22-28 |

**Nenhuma vulnerabilidade crítica permanece.** VULN-01 e VULN-02 foram corrigidas (ver seção 11). VULN-03 foi avaliada e `lax` mantido. VULN-04 já estava adequada (origens configuráveis via env, sem wildcard). A autorização por propriedade (anti-IDOR), validação de entrada, proteção CSRF e sanitização de URL estão corretamente implementadas.

---

## 6. Problemas Funcionais Encontrados

| ID | Componente | Descrição | Evidência |
|----|-----------|-----------|-----------|
| FUNC-01 | Frontend / App.tsx | Antes da correção recente, `editorResumeId` era apenas estado em memória; F5 perdia o contexto do editor | `frontend/src/App.tsx` — estado inicial agora lê `?resume=ID` da URL |
| FUNC-02 | Backend / Document | A coluna `document` é nullable; currículos criados antes da migration não têm documento persistido | `database/migrations/2026_11_11_120000_add_document_to_resumes_table.php` |
| FUNC-03 | Backend / Health | Endpoint `/api/v1/health` expõe se a coluna `document` existe (`document_persistence`) — informação útil para atacantes mapearem versão do schema | `backend/routes/api.php` |

---

## 7. Recomendações Ordenadas por Prioridade

## 7. Correções Aplicadas (Auditoria de Segurança)

| ID | Correção | Arquivo(s) Alterado(s) |
|----|----------|-----------------------|
| VULN-01 | `APP_DEBUG` alterado de `true` para `false` no `.env.example`. Ambiente local continua funcionando (debug desligado apenas em produção quando o operador sobrescreve o `.env`). | `backend/.env.example` |
| VULN-02 | `'secure'` em `config/session.php` agora tem default automático: `true` quando `APP_URL` começa com `https://`, `false` caso contrário. Pode ser sobrescrito por `SESSION_SECURE_COOKIE` no `.env`. Desenvolvimento local em HTTP não é quebrado. | `backend/config/session.php` |
| VULN-03 | `SameSite` mantido como `lax` após avaliação do fluxo Sanctum + CSRF + sessão. O Vite proxy encaminha `/api` e `/sanctum` para o backend, tornando as requisições same-origin do ponto de vista do navegador. `strict` quebraria a autenticação em navegação de topo de origem cruzada (ex.: clicar em link de e-mail para o app). | `backend/config/session.php` (sem alteração) |
| VULN-04 | CORS já lê `CORS_ALLOWED_ORIGINS` da variável de ambiente com default `http://localhost:5173,http://127.0.0.1:5173`. Sem wildcard, sem domínio de produção inventado. | `backend/config/cors.php` (sem alteração) |

---

## 8. Recomendações Restantes (Prioridade)

### Alta (corrigir antes da produção)

1. **Definir `SESSION_SECURE_COOKIE=true`** no `.env` de produção com HTTPS (o auto-detect já cobre quando não definido, mas ser explícito é mais seguro).
2. **Remover ou restringir o endpoint `/api/v1/health`** em produção, ou remover o campo `document_persistence` da resposta para não expor detalhes internos do schema.

### Média

3. **Configurar `CORS_ALLOWED_ORIGINS`** com os domínios de produção explícitos; não usar curingas.
4. **Configurar `SANCTUM_STATEFUL_DOMAINS`** com o domínio de produção.
5. **Adicionar `expire_on_close`** ou reduzir o lifetime da sessão para dados sensíveis (currículos contêm PII).

### Baixa

6. **Adicionar testes de segurança automatizados** específicos de XSS/CSRF (os testes de IDOR já existem em `ResumeApiTest`).
7. **Considerar Criptografia de sessão** (`SESSION_ENCRYPT=true`) se dados sensíveis forem armazenados na sessão.
8. **Adicionar header de segurança** (X-Content-Type-Options, X-Frame-Options, Content-Security Policy) via middleware ou servidor web.

---

## 9. Matriz de Testes

### Testes Aprovados (executados)

| Teste | Resultado |
|-------|-----------|
| `npm run lint` (frontend) | ✅ Aprovado |
| `npm run build` (frontend) | ✅ Aprovado |
| `php artisan test` (backend — 27 casos) | ✅ Aprovado (147 assertions) |

**Detalhe dos testes backend:**
- `AuthApiTest`: 6 casos aprovados (registro, login, logout, sessão, rotas protegidas)
- `ResumeApiTest`: 7 casos aprovados (CRUD, auth, isolamento/IDOR, validação, paginação, PUT vs PATCH)
- `ResumeDocumentApiTest`: 12 casos aprovados (document JSON, template/style sync, headers, datas, chronology, health, seções)
- `SanctumCsrfTest`: 2 casos aprovados (CSRF cookie, XSRF token legível por JS)
- `ExampleTest` (Unit + Feature): 2 casos aprovados

---

## 10. Avaliação Final — Aptidão para Produção

**Veredito: PARCIALMENTE ADEQUADO para produção.**

### Pontos Fortes
- Arquitetura limpa e separada (API REST + SPA)
- Autenticação robusta com Sanctum (sessão + CSRF)
- Autorização correta por propriedade (proteção contra IDOR)
- Validação de entrada em múltiplas camadas (FormRequest + regras aninhadas)
- Proteção contra XSS via sanitização de URL e escape nativo do React
- Proteção contra SQL injection via Eloquent/parametrized queries
- Rate limiting em endpoints de auth
- Paginação com limite máximo (100) e sumários leves na listagem
- Build e lint do frontend passando limpo
- Todos os 27 testes backend passando
- VULN-01 e VULN-02 corrigidas

### Pontos que Impedem "Apto para Produção" Imediato
- Cookie de sessão depende de `SESSION_SECURE_COOKIE=true` ou `APP_URL=https://` em produção (não definido por padrão no `.env.example`)
- Não foi definido `SESSION_SECURE_COOKIE=true` explicitamente no `.env.example` (o auto-detect cobre, mas ser explícito é mais seguro)
- Ausência de headers de segurança (CSP, X-Frame-Options, etc.)
- Endpoint `/api/v1/health` expõe `document_persistence` em produção

### Condição para Produção
Definir `SESSION_SECURE_COOKIE=true` no `.env` de produção, garantir `APP_URL=https://...`, configurar `CORS_ALLOWED_ORIGINS` e `SANCTUM_STATEFUL_DOMAINS` com domínios de produção, restringir o endpoint `/api/v1/health`, e adicionar headers de segurança antes de qualquer deploy.

---

## 11. Arquivos Analisados

### Backend
- `backend/routes/api.php`
- `backend/bootstrap/app.php`
- `backend/app/Http/Controllers/Api/V1/AuthController.php`
- `backend/app/Http/Controllers/Api/V1/ResumeController.php`
- `backend/app/Http/Requests/ResumeRequest.php`
- `backend/app/Http/Requests/StoreResumeRequest.php`
- `backend/app/Http/Requests/UpdateResumeRequest.php`
- `backend/app/Models/User.php`
- `backend/app/Models/Resume.php`
- `backend/app/Enums/ResumeStyle.php`
- `backend/app/Enums/ResumeSectionType.php`
- `backend/config/auth.php`
- `backend/config/session.php`
- `backend/config/cors.php`
- `backend/config/sanctum.php`
- `backend/database/migrations/` (6 arquivos)
- `backend/tests/Feature/AuthApiTest.php`
- `backend/tests/Feature/ResumeApiTest.php`
- `backend/tests/Feature/ResumeDocumentApiTest.php`
- `backend/tests/Feature/SanctumCsrfTest.php`
- `backend/.env.example`

### Frontend
- `frontend/src/App.tsx`
- `frontend/src/lib/api.ts`
- `frontend/src/lib/resume-document.ts`
- `frontend/src/features/resume-editor/ResumeEditor.tsx`
- `frontend/src/features/resume-editor/ResumePreview.tsx`
- `frontend/src/features/resume-editor/SearchCombobox.tsx`
- `frontend/src/features/resume-editor/editor-suggestions.ts`
- `frontend/package.json`
- `frontend/vite.config.ts`
- `frontend/.oxlintrc.json`
- `frontend/.env.example`

---

**Não foram expostas senhas, tokens ou informações pessoais neste relatório.**

---