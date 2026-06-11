# Cardápio Web — SaaS para Pizzarias

Cardápio digital com pedido via WhatsApp. Cliente monta o pedido no navegador e envia a mensagem formatada direto para o WhatsApp da pizzaria.

## Stack

- **React + Vite** — frontend
- **Supabase** — banco de dados (Postgres), autenticação e storage de imagens
- **Vercel** — hospedagem
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
