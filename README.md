# Cardápio Web — SaaS para Pizzarias

Cardápio digital com pedido via WhatsApp. Cliente monta o pedido no navegador e envia a mensagem formatada direto para o WhatsApp da pizzaria.

## Stack

- **React + Vite** — frontend
- **Supabase** — banco de dados (Postgres), autenticação e storage de imagens
- **Hostinger** — hospedagem de produção; **GitHub Pages** — demo
- **WhatsApp** — link `wa.me` com texto encodado (sem API paga)

## Como rodar

1. **Instalar dependências**

   ```
   npm install
   ```

2. **Configurar o Supabase**
   - Crie um projeto em [supabase.com](https://supabase.com)
   - No **SQL Editor**, execute o conteúdo de [`supabase/schema.sql`](supabase/schema.sql)
   - (Opcional, para testar) Crie um usuário em **Authentication > Users**, copie o UUID dele e execute [`supabase/seed-exemplo.sql`](supabase/seed-exemplo.sql)

3. **Configurar variáveis de ambiente**
   - Copie `.env.example` para `.env`
   - Preencha com a URL e a chave anon do projeto (**Project Settings > API**)

4. **Rodar**

   ```
   npm run dev
   ```

   - Cardápio público: `http://localhost:5173/<slug-da-pizzaria>` (com o seed: `/pizzaria-do-jadriano`)

## Deploy

O `base` do Vite é `/` por padrão (Hostinger e dev) e `/cardapio-web/` no build do GitHub Pages. O `basename` do React Router é derivado automaticamente, então não precisa mexer no código para alternar.

### Hostinger (produção, domínio raiz)

1. `npm run build` (usa o `.env` local para embutir as credenciais do Supabase).
2. Suba **todo o conteúdo de `dist/`** (incluindo o `.htaccess` e o `404.html`) para a pasta `public_html` via Gerenciador de Arquivos ou FTP do hPanel.
3. O `.htaccess` faz o Apache servir o `index.html` em qualquer rota (sem ele, atualizar em `/algum-slug` dá 404).
   - Se o site ficar numa **subpasta** (ex.: `seudominio.com/cardapio`), gere com `npx vite build --base=/cardapio/` e ajuste o `RewriteBase` do `.htaccess`.

### GitHub Pages (demo para mostrar ao cliente)

1. No repositório: **Settings > Pages > Source = GitHub Actions**.
2. **Settings > Secrets and variables > Actions** e crie os secrets `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` (mesmos valores do `.env`).
3. Dê `push` na branch `main`. O workflow [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml) builda com `npm run build:pages` e publica.
4. URL: `https://SEU-USUARIO.github.io/cardapio-web/` (o nome do repositório precisa ser `cardapio-web` para o `base` bater; se for outro, ajuste o `--base` no script `build:pages`).
   - O `public/404.html` + o script no `index.html` fazem links diretos como `/cardapio-web/<slug>` funcionarem mesmo ao atualizar a página.

## Estrutura

```
src/
  lib/          cliente Supabase + formatação (preço, mensagem WhatsApp)
  context/      carrinho (CartContext)
  pages/        HomePage, CardapioPage (cardápio público)
  components/   ProdutoCard, CartBar, CartDrawer (carrinho + checkout)
supabase/
  schema.sql        tabelas, RLS e storage
  seed-exemplo.sql  dados de exemplo
```

## Roadmap (MVP)

- [x] Cardápio público por slug (`/:slug`)
- [x] Carrinho + checkout (nome, endereço, pagamento)
- [x] Envio do pedido via WhatsApp
- [ ] Painel admin: login (Supabase Auth)
- [ ] Painel admin: CRUD de categorias
- [ ] Painel admin: CRUD de produtos (com foto e tamanhos)
- [ ] Painel admin: configurações da pizzaria (nome, logo, WhatsApp)
