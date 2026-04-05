# Slim Site Template

Template base para aplicacoes web em PHP com arquitetura orientada a rotas e controllers, utilizando Slim 4 como microframework HTTP/PSR-7 e Twig como engine de templates para composicao da camada de apresentacao.

## Stack
- PHP 8.3+
- Slim 4 (`slim/slim`, `slim/psr7`)
- Twig (`slim/twig-view`, `twig/twig`)
- PHPMailer (`phpmailer/phpmailer`)
- Apache 2.4 com `mod_rewrite`

## Estrutura
- `public/`: front controller (`index.php`), `.htaccess` e assets.
- `routes/web.php`: rotas Slim.
- `src/Controllers/HomeController.php`: controller HTTP (PSR-7).
- `src/Core/Env.php`: loader simples de `.env`.
- `views/`: templates Twig.
- `storage/`: cache e logs de runtime.
- `.env.example`: modelo de configuracao para novos servidores.

## Requisitos de servidor
- PHP 8.3 ou superior
- Apache 2.4 com `mod_rewrite`
- Composer 2
- Permissao de escrita em `storage/`

## Variaveis de ambiente
Use `.env.example` como base para criar o arquivo `.env` do servidor.

Principais variaveis:
- `APP_NAME`
- `APP_MARK`
- `APP_BADGE`
- `APP_PAGE_TITLE`
- `APP_BASE`
- `APP_ENV`
- `APP_PALETTE`
- `GITHUB_URL`
- `X_URL`
- `INSTAGRAM_URL`
- `WHATSAPP_URL`
- `CONTACT_TO`
- `CONTACT_FROM`
- `MAIL_DRIVER`
- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_USER`
- `SMTP_PASS`
- `SMTP_ENCRYPTION`
- `SMTP_AUTH`
- `SMTP_TIMEOUT`
- `RATE_LIMIT_MAX_ATTEMPTS`
- `RATE_LIMIT_WINDOW_SECONDS`

## Execucao local
```bash
composer install
cp .env.example .env
```

Para ambiente local, use:
- `APP_ENV="dev"`
- `APP_BASE=""` se o projeto abrir na raiz local

Atalho recomendado para dev local sem editar manualmente o .env:

```bash
bash scripts/dev-local.sh
```

Esse comando aplica APP_BASE vazio e APP_ENV dev apenas durante a sessao local e restaura o .env ao encerrar.

## Comportamento por ambiente
- `APP_ENV=dev`: Twig sem cache, `auto_reload` ativo e erros detalhados.
- `APP_ENV=production`: Twig com cache em `storage/cache/twig`, `auto_reload` desativado e middleware de erro em modo restrito.

## Formulario de contato
- Rota: `POST /contato`
- Controller: `src/Controllers/HomeController.php`
- Driver suportado: `smtp` ou `mail`
- Protecoes ativas: `CSRF`, honeypot simples e rate limit por IP
- Logs:
  - `storage/logs/lead-events.log`
  - `storage/logs/contatos-fallback.log`

Se `MAIL_DRIVER=smtp`, configure `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_ENCRYPTION`, `SMTP_AUTH` e `SMTP_TIMEOUT`.

Rate limit padrao:
- `RATE_LIMIT_MAX_ATTEMPTS=5`
- `RATE_LIMIT_WINDOW_SECONDS=600`

## Deploy principal: vhost compartilhado com alias `/natalcode`
Este e o fluxo recomendado para o servidor de destino atual, onde o host principal ja existe e o projeto sera publicado em `https://srv798468.hstgr.cloud/natalcode/`.

### 1. Publicar o codigo
```bash
git clone https://github.com/luciolemos/natalcode_cloud18344.git /var/www/natalcode
cd /var/www/natalcode
composer install --no-dev --optimize-autoloader
cp .env.example .env
```

### 2. Configurar o `.env`
Para deploy em subcaminho, use:
- `APP_ENV="production"`
- `APP_BASE="/natalcode"`

Preencha tambem:
- identidade visual (`APP_NAME`, `APP_MARK`, `APP_BADGE`, `APP_PAGE_TITLE`)
- links institucionais
- configuracao de envio de email

### 3. Ajustar permissoes
Exemplo com Apache rodando como `www-data`:

```bash
sudo chown -R www-data:www-data storage
sudo chmod -R 775 storage
```

### 4. Ajustar o vhost existente
No servidor de destino, adicione ao `VirtualHost` os aliases abaixo em `:80` e `:443`:

```apache
Alias /natalcode/ /var/www/natalcode/public/
Alias /natalcode /var/www/natalcode/public/

<Directory /var/www/natalcode/public>
    Options -Indexes +FollowSymLinks
    AllowOverride All
    Require all granted
</Directory>
```

No bloco HTTP (`*:80`), inclua `natalcode` no redirect para a barra final:

```apache
RewriteCond %{REQUEST_URI} ^/(dashboard|itapiru|mvc|natalcode)$
RewriteRule ^ https://%{HTTP_HOST}%{REQUEST_URI}/ [L,R=301]
```

No bloco HTTPS (`*:443`), inclua o redirect da URL sem barra:

```apache
RewriteRule ^/natalcode$ /natalcode/ [R=301,L]
```

Se o vhost usar segregacao de logs por app, inclua:

```apache
SetEnvIf Request_URI "^/natalcode(/|$)" app_natalcode
SetEnvIf Request_URI "^/(?!dashboard(/|$)|itapiru(/|$)|mvc(/|$)|natalcode(/|$)).*" app_root

CustomLog ${APACHE_LOG_DIR}/srv-hstgr-http-natalcode-access.log combined env=app_natalcode
CustomLog ${APACHE_LOG_DIR}/srv-hstgr-https-natalcode-access.log combined env=app_natalcode
```

### 5. Validar a configuracao Apache
```bash
sudo apache2ctl -t
sudo systemctl reload apache2
```

### 6. Pos-update obrigatorio (cache Twig + permissoes)
Em `APP_ENV="production"`, o Twig roda com cache compilado. Após update de código, limpe o cache compilado para evitar HTML antigo.

```bash
bash scripts/deploy-post-update.sh --project-root "/var/www/natalcode" --web-user "www-data" --web-group "www-data"
```

### 7. Validar apos o deploy
Checklist minimo:
- `https://srv798468.hstgr.cloud/natalcode/` abre corretamente
- assets carregam sem `404`
- `POST /contato` responde corretamente
- redirects preservam o prefixo `/natalcode`
- `storage/cache/twig` e `storage/logs/` recebem escrita

Smoke recomendado no host final:

```bash
bash scripts/smoke-contact.sh --url "https://srv798468.hstgr.cloud/natalcode/"
```

## Checklist de producao
Antes de considerar o deploy concluido, valide:
- `composer test` verde no ambiente de build ou homologacao
- `composer install --no-dev --optimize-autoloader` executado no servidor
- `APP_ENV="production"` e `APP_BASE` coerente com a publicacao
- envio real do formulario com recebimento do email
- criacao de entradas em `storage/logs/lead-events.log` quando houver submit
- ausencia de erro em `storage/logs/contatos-fallback.log` apos submit valido
- permissoes de escrita em `storage/cache`, `storage/logs` e `storage/rate-limit`
- `apache2ctl -t` sem erro antes do reload

Comandos uteis de verificacao:

```bash
composer test
php -r 'require "src/Core/Env.php"; \App\Core\Env::load(".env"); var_export($_ENV["APP_ENV"] ?? null); echo PHP_EOL;'
sudo apache2ctl -t
tail -n 50 storage/logs/lead-events.log
tail -n 50 storage/logs/contatos-fallback.log
```

## Deploy alternativo: vhost dedicado
Se no futuro o projeto for publicado em um host raiz dedicado, entao:
- o codigo pode continuar em `/var/www/natalcode`
- `APP_BASE=""`
- o `DocumentRoot` deve apontar para `/var/www/natalcode/public`

Exemplo:

```apache
<VirtualHost *:80>
    ServerName exemplo.com
    ServerAlias www.exemplo.com

    DocumentRoot /var/www/natalcode/public

    <Directory /var/www/natalcode/public>
        AllowOverride All
        Require all granted
    </Directory>

    ErrorLog ${APACHE_LOG_DIR}/natalcode_error.log
    CustomLog ${APACHE_LOG_DIR}/natalcode_access.log combined
</VirtualHost>
```

## APP_BASE e rotas
- Em `vhost` dedicado: `APP_BASE=""`
- Em subcaminho `/natalcode`: `APP_BASE="/natalcode"`

Se `APP_BASE` estiver incorreto, podem ocorrer `404` em rotas, redirects ou assets.

## Paletas
Paletas suportadas:
- `blue`
- `red`
- `emerald`
- `amber`
- `violet`

Resolucao no backend (SSR inicial):
1. query string `?palette=<cor>`
2. cookie `palette`
3. `APP_PALETTE`

Resolucao no frontend (apos JS carregar):
1. query string `?palette=<cor>`
2. `localStorage.palette`
3. paleta inicial renderizada pelo backend

Paletas invalidas fazem fallback para `blue`.

### Checklist de regressao (paleta)
1. Acesse sem query string e confirme que a pagina abre na paleta salva anteriormente.
2. Clique para trocar entre `blue`, `red` e `emerald` e valide mudanca imediata sem recarregar.
3. Recarregue a pagina e confirme persistencia da ultima paleta (sem flicker perceptivel).
4. Abra com `?palette=red` e confirme prioridade da query string sobre cookie/localStorage.
5. Abra com `?palette=invalida` e confirme fallback para `blue`.
6. Confirme que a URL so recebe `?palette=` apos clique do usuario (nao automaticamente no primeiro carregamento).

### Smoke test automatizado (SSR)
Para validar rapidamente o comportamento de paleta no HTML inicial (sem navegador), execute:

```bash
bash scripts/smoke-palette.sh --url "https://srv798468.hstgr.cloud/natalcloud/" --default blue
```

O script cobre:
1. query valida
2. prioridade query sobre cookie
3. prioridade cookie sem query
4. query invalida
5. fallback default SSR

### Smoke test automatizado (contato)
Para validar o fluxo HTTP basico do formulario de contato (payload invalido com redirect de retorno):

```bash
bash scripts/smoke-contact.sh --url "https://srv798468.hstgr.cloud/natalcloud/"
```

O script cobre:
1. status HTTP 302 no POST invalido
2. redirect para ancora de formulario
3. emissao de cookie de sessao

### Smoke test automatizado (frontend)
Para validar regressao basica de copy mode SSR e hooks de analytics no JS:

```bash
bash scripts/smoke-frontend.sh --url "https://srv798468.hstgr.cloud/natalcloud/"
```

O script cobre:
1. `?copy=growth` refletido no HTML SSR
2. fallback de copy invalido para `soft`
3. presenca dos hooks `dataLayer`, `gtag`, `cta_click` e `lead_form_submit_attempt`

### Smoke test automatizado (contato com sucesso SMTP)
Para validar caminho de sucesso do formulario (exige SMTP funcional/sandbox):

```bash
bash scripts/smoke-contact-success.sh --url "http://127.0.0.1:8000/"
```

O script cobre:
1. POST valido com status 302
2. redirect para `#form-orcamento`
3. flash de sucesso renderizado no HTML
4. evento `lead_form_submit_success` presente

### Runner unico de testes
Para rodar unitarios + smoke tests em um comando:

```bash
bash scripts/run-tests.sh --url "https://srv798468.hstgr.cloud/natalcloud/" --default-palette blue
```

Com teste de sucesso SMTP (quando sandbox estiver disponivel):

```bash
bash scripts/run-tests.sh --url "http://127.0.0.1:8000/" --default-palette blue --with-contact-success
```

### Quality Gate (seguranca + build)
Executa validacao de composer, auditoria de dependencias e lint basico:

```bash
bash scripts/quality-gate.sh
```

### Budget de performance (Lighthouse CI)
Executa auditoria Lighthouse com thresholds minimos de qualidade:

```bash
bash scripts/lighthouse-ci.sh balanced
```

Perfil mais rigoroso (recomendado para staging/release):

```bash
bash scripts/lighthouse-ci.sh strict
```

Arquivo de configuracao de budget:
- `.lighthouserc.json`
- `.lighthouserc.strict.json`

Runner local de um comando (sobe servidor + ajusta ambiente temporario + executa Lighthouse + restaura `.env`):

```bash
bash scripts/lighthouse-local.sh strict
```

### Smoke E2E (browser real com Playwright)
Executa validacao em navegador real (chromium):

```bash
bash scripts/smoke-e2e.sh "http://127.0.0.1:8000/"
```

Cobertura atual do E2E:
1. troca de paleta com persistencia apos reload
2. toggle de copy mode com navegacao growth/soft

### Testes unitarios PHP (sem framework externo)
Para validar regras centrais de controller (prioridade de paleta e validacao de contato):

```bash
php scripts/test-unit.php
```

CI automatizada:
1. workflow em `.github/workflows/ci.yml`
2. sobe SMTP sandbox (Mailpit) local
3. executa quality gate (composer validate/audit + lint)
4. executa runner unico com unitarios + smoke tests (paleta, contato, frontend e contato com sucesso)
5. aplica budget Lighthouse
    perfil usado no CI: `strict`
6. roda smoke E2E em navegador real (Playwright)

## Seguranca de deploy
- Publique apenas o diretorio `public/` no Apache
- Nao versione o arquivo `.env`
- Use `APP_ENV="production"` em servidor publico
- Restrinja escrita apenas a `storage/`
- Configure SMTP com credenciais do servidor de destino
- Revise o rate limit do formulario conforme o perfil de trafego do site
- Prefira HTTPS no host final
- Rode `apache2ctl -t` antes de qualquer reload

## Operacao
Comandos uteis:

```bash
composer install --no-dev --optimize-autoloader
composer test
bash scripts/deploy-post-update.sh --project-root "/var/www/natalcode" --web-user "www-data" --web-group "www-data"
sudo apache2ctl -t
sudo systemctl reload apache2
```

## Referencias internas
- Guia operacional de centralizacao: `docs/centralizacao.md`
- Exemplo de vhost compartilhado: `docs/apache-vhost-srv798468-natalcode.conf`
- Exemplo de `.env` para subcaminho: `docs/.env.natalcode.example`
- Script de paleta em lote: `scripts/set-palettes.sh`
- Conversao de imagens para WebP: `scripts/convert-webp.php`
