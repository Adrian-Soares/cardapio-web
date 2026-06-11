-- ============================================================
-- Cardápio Web — Schema do banco (Supabase)
-- Execute este script no SQL Editor do Supabase (uma vez).
-- ============================================================

-- ===== Tabelas =====

create table pizzarias (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  nome text not null,
  slug text not null unique,
  logo_url text,
  whatsapp text not null, -- formato: 5511999999999 (código do país + DDD + número)
  created_at timestamptz not null default now()
);

create table categorias (
  id uuid primary key default gen_random_uuid(),
  pizzaria_id uuid not null references pizzarias (id) on delete cascade,
  nome text not null,
  ordem integer not null default 0,
  created_at timestamptz not null default now()
);

create table produtos (
  id uuid primary key default gen_random_uuid(),
  pizzaria_id uuid not null references pizzarias (id) on delete cascade,
  categoria_id uuid not null references categorias (id) on delete cascade,
  nome text not null,
  descricao text,
  foto_url text,
  ativo boolean not null default true,
  created_at timestamptz not null default now()
);

create table tamanhos_produto (
  id uuid primary key default gen_random_uuid(),
  produto_id uuid not null references produtos (id) on delete cascade,
  nome text not null,           -- ex.: Pequena, Média, Grande
  preco numeric(10, 2) not null check (preco >= 0),
  created_at timestamptz not null default now()
);

-- Índices para as consultas do cardápio público
create index idx_categorias_pizzaria on categorias (pizzaria_id, ordem);
create index idx_produtos_pizzaria on produtos (pizzaria_id);
create index idx_tamanhos_produto on tamanhos_produto (produto_id);

-- ===== Row Level Security =====
-- Leitura: pública (o cardápio é aberto, acessado sem login).
-- Escrita: somente o dono da pizzaria (user_id = usuário logado).

alter table pizzarias enable row level security;
alter table categorias enable row level security;
alter table produtos enable row level security;
alter table tamanhos_produto enable row level security;

-- Função auxiliar: o usuário logado é dono desta pizzaria?
create or replace function is_dono_pizzaria(p_pizzaria_id uuid)
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1 from pizzarias
    where id = p_pizzaria_id and user_id = auth.uid()
  );
$$;

-- pizzarias
create policy "leitura publica de pizzarias"
  on pizzarias for select using (true);

create policy "dono insere sua pizzaria"
  on pizzarias for insert with check (user_id = auth.uid());

create policy "dono atualiza sua pizzaria"
  on pizzarias for update using (user_id = auth.uid());

create policy "dono remove sua pizzaria"
  on pizzarias for delete using (user_id = auth.uid());

-- categorias
create policy "leitura publica de categorias"
  on categorias for select using (true);

create policy "dono gerencia categorias"
  on categorias for all
  using (is_dono_pizzaria(pizzaria_id))
  with check (is_dono_pizzaria(pizzaria_id));

-- produtos (público vê só os ativos; o dono vê todos)
create policy "leitura publica de produtos ativos"
  on produtos for select
  using (ativo = true or is_dono_pizzaria(pizzaria_id));

create policy "dono gerencia produtos"
  on produtos for insert with check (is_dono_pizzaria(pizzaria_id));

create policy "dono atualiza produtos"
  on produtos for update using (is_dono_pizzaria(pizzaria_id));

create policy "dono remove produtos"
  on produtos for delete using (is_dono_pizzaria(pizzaria_id));

-- tamanhos_produto
create policy "leitura publica de tamanhos"
  on tamanhos_produto for select using (true);

create policy "dono gerencia tamanhos"
  on tamanhos_produto for all
  using (
    exists (
      select 1 from produtos p
      where p.id = produto_id and is_dono_pizzaria(p.pizzaria_id)
    )
  )
  with check (
    exists (
      select 1 from produtos p
      where p.id = produto_id and is_dono_pizzaria(p.pizzaria_id)
    )
  );

-- ===== Storage (fotos de produtos e logos) =====

insert into storage.buckets (id, name, public)
values ('imagens', 'imagens', true);

create policy "leitura publica de imagens"
  on storage.objects for select
  using (bucket_id = 'imagens');

create policy "usuario logado envia imagens"
  on storage.objects for insert
  with check (bucket_id = 'imagens' and auth.role() = 'authenticated');

create policy "usuario logado atualiza imagens"
  on storage.objects for update
  using (bucket_id = 'imagens' and auth.role() = 'authenticated');

create policy "usuario logado remove imagens"
  on storage.objects for delete
  using (bucket_id = 'imagens' and auth.role() = 'authenticated');
