-- ============================================================
-- Migração: adiciona horário de funcionamento ao estabelecimento.
-- Rode UMA vez no SQL Editor do Supabase (banco que já existe).
-- Estabelecimentos já cadastrados ficam com horarios = null
-- (o cardápio simplesmente não mostra o selo até configurar em Configurações).
-- ============================================================

alter table pizzarias
  add column if not exists horarios jsonb;

-- Formato esperado (gerenciado pelo painel admin):
--   {
--     "seg": { "aberto": true,  "abre": "18:00", "fecha": "23:00" },
--     "ter": { "aberto": true,  "abre": "18:00", "fecha": "23:00" },
--     "dom": { "aberto": false, "abre": "18:00", "fecha": "23:00" }
--   }
