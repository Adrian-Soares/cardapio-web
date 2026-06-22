-- ============================================================
-- Migração: pizza meio a meio.
-- Rode UMA vez no SQL Editor do Supabase (banco que já existe).
--   categorias.permite_meio: a categoria aceita montar meio a meio (dois sabores).
--   pizzarias.meio_preco: como cobrar o meio a meio -> 'maior' (maior valor) | 'media'.
-- ============================================================

alter table categorias
  add column if not exists permite_meio boolean not null default false;

alter table pizzarias
  add column if not exists meio_preco text not null default 'maior';
