import { useState } from 'react'
import { supabase } from '../../lib/supabase.js'
import { gerarSlug } from '../../lib/storage.js'

// Mostrado quando o usuário logado ainda não tem pizzaria cadastrada.
export default function OnboardingPizzaria({ userId, onCriada }) {
  const [nome, setNome] = useState('')
  const [slug, setSlug] = useState('')
  const [slugEditado, setSlugEditado] = useState(false)
  const [whatsapp, setWhatsapp] = useState('')
  const [erro, setErro] = useState(null)
  const [enviando, setEnviando] = useState(false)

  function aoMudarNome(valor) {
    setNome(valor)
    if (!slugEditado) setSlug(gerarSlug(valor))
  }

  async function criar(e) {
    e.preventDefault()
    setErro(null)
    setEnviando(true)

    const { data, error } = await supabase
      .from('pizzarias')
      .insert({
        user_id: userId,
        nome: nome.trim(),
        slug: gerarSlug(slug),
        whatsapp: whatsapp.replace(/\D/g, ''),
      })
      .select()
      .single()

    setEnviando(false)

    if (error) {
      setErro(
        error.code === '23505'
          ? 'Esse endereço (slug) já está em uso. Escolha outro.'
          : 'Não foi possível criar a pizzaria. Tente novamente.'
      )
      return
    }

    onCriada(data)
  }

  return (
    <main className="login-pagina">
      <form className="login-card" onSubmit={criar}>
        <h1>🍕 Bem-vindo!</h1>
        <p className="login-subtitulo">Cadastre sua pizzaria para começar</p>

        <label>
          Nome da pizzaria
          <input
            type="text"
            required
            value={nome}
            onChange={(e) => aoMudarNome(e.target.value)}
            placeholder="Ex.: Pizzaria do João"
          />
        </label>

        <label>
          Endereço do cardápio
          <input
            type="text"
            required
            value={slug}
            onChange={(e) => {
              setSlug(e.target.value)
              setSlugEditado(true)
            }}
            placeholder="pizzaria-do-joao"
          />
          <small className="campo-dica">
            Seu cardápio ficará em: {window.location.origin}/{gerarSlug(slug) || 'seu-endereco'}
          </small>
        </label>

        <label>
          WhatsApp (com código do país e DDD)
          <input
            type="tel"
            required
            value={whatsapp}
            onChange={(e) => setWhatsapp(e.target.value)}
            placeholder="5511999999999"
          />
        </label>

        {erro && <p className="form-erro">{erro}</p>}

        <button type="submit" className="btn btn-primario" disabled={enviando}>
          {enviando ? 'Criando…' : 'Criar pizzaria'}
        </button>
      </form>
    </main>
  )
}
