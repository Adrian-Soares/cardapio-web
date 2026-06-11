import { supabase } from './supabase.js'

// Envia uma imagem para o bucket "imagens" e retorna a URL pública.
export async function uploadImagem(pizzariaId, file) {
  const extensao = file.name.split('.').pop()?.toLowerCase() ?? 'jpg'
  const caminho = `${pizzariaId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${extensao}`

  const { error } = await supabase.storage.from('imagens').upload(caminho, file, {
    cacheControl: '3600',
    upsert: false,
  })
  if (error) throw error

  const { data } = supabase.storage.from('imagens').getPublicUrl(caminho)
  return data.publicUrl
}

export function gerarSlug(texto) {
  return texto
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // remove acentos
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
}
