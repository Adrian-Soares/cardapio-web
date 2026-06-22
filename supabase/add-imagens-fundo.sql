-- ============================================================
-- Migração: imagem do banner do topo (opcional).
-- Rode UMA vez no SQL Editor do Supabase (banco que já existe).
--   banner_url: imagem do banner do topo (null = imagem padrão).
-- (A imagem de fundo do cardápio foi removida; se você já tinha rodado
--  uma versão antiga que criou a coluna fundo_url, pode ignorá-la — não é
--  mais usada. Para remover: alter table pizzarias drop column if exists fundo_url;)
-- ============================================================

alter table pizzarias
  add column if not exists banner_url text;
