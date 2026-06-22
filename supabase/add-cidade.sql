-- ============================================================
-- Migração: cidade / localização do estabelecimento (opcional).
-- Rode UMA vez no SQL Editor do Supabase (banco que já existe).
-- Aparece no cabeçalho do cardápio (ex.: "Maricá - RJ"). null = não mostra.
-- ============================================================

alter table pizzarias
  add column if not exists cidade text;
