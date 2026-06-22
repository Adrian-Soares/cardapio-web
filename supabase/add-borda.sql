-- ============================================================
-- Migração: bordas recheadas (preço fixo por borda).
-- Rode UMA vez no SQL Editor do Supabase (banco que já existe).
--   bordas: recheios de borda por estabelecimento (ex.: Catupiry, Cheddar).
--   O cliente escolhe a borda ao montar a pizza no card.
-- Idempotente: pode rodar de novo sem quebrar.
-- ============================================================

create table if not exists bordas (
  id uuid primary key default gen_random_uuid(),
  pizzaria_id uuid not null references pizzarias (id) on delete cascade,
  nome text not null,                         -- ex.: Catupiry, Cheddar, Chocolate
  preco numeric(10, 2) not null default 0 check (preco >= 0),
  ativo boolean not null default true,
  ordem integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists idx_bordas_pizzaria on bordas (pizzaria_id, ordem);

alter table bordas enable row level security;

-- Leitura pública (o cardápio é aberto)
drop policy if exists "leitura publica de bordas" on bordas;
create policy "leitura publica de bordas"
  on bordas for select using (true);

-- Escrita só do dono (usa a função is_dono_pizzaria já criada no schema.sql)
drop policy if exists "dono gerencia bordas" on bordas;
create policy "dono gerencia bordas"
  on bordas for all
  using (is_dono_pizzaria(pizzaria_id))
  with check (is_dono_pizzaria(pizzaria_id));
