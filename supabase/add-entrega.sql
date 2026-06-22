-- ============================================================
-- Migração: taxa de entrega + pedido mínimo (ambos opcionais).
-- Rode UMA vez no SQL Editor do Supabase (banco que já existe).
-- null = recurso desativado (estabelecimento sem taxa / sem mínimo).
-- ============================================================

alter table pizzarias
  add column if not exists taxa_entrega numeric(10, 2);

alter table pizzarias
  add column if not exists pedido_minimo numeric(10, 2);
