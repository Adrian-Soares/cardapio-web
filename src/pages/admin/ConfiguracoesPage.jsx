import { useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { supabase } from '../../lib/supabase.js'
import { uploadImagem, gerarSlug } from '../../lib/storage.js'

export default function ConfiguracoesPage() {
  const { pizzaria, setPizzaria, tema, alterarTema } = useOutletContext()
  const [nome, setNome] = useState(pizzaria.nome)
  const [slug, setSlug] = useState(pizzaria.slug)
  const [whatsapp, setWhatsapp] = useState(pizzaria.whatsapp)
  const [logoFile, setLogoFile] = useState(null)
  const [previewLogo, setPreviewLogo] = useState(pizzaria.logo_url)
  const [salvando, setSalvando] = useState(false)
  const [mensagem, setMensagem] = useState(null) // { tipo: 'ok' | 'erro', texto }

  function aoEscolherLogo(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setLogoFile(file)
    setPreviewLogo(URL.createObjectURL(file))
  }

  async function salvar(e) {
    e.preventDefault()
    setMensagem(null)
    setSalvando(true)

    try {
      let logo_url = pizzaria.logo_url
      if (logoFile) {
        logo_url = await uploadImagem(pizzaria.id, logoFile)
      }

      const atualizacao = {
        nome: nome.trim(),
        slug: gerarSlug(slug),
        whatsapp: whatsapp.replace(/\D/g, ''),
        logo_url,
      }

      const { data, error } = await supabase
        .from('pizzarias')
        .update(atualizacao)
        .eq('id', pizzaria.id)
        .select()
        .single()

      if (error) throw error

      setPizzaria(data)
      setSlug(data.slug)
      setLogoFile(null)
      setMensagem({ tipo: 'ok', texto: 'Configurações salvas!' })
    } catch (err) {
      console.error(err)
      setMensagem({
        tipo: 'erro',
        texto:
          err?.code === '23505'
            ? 'Esse endereço (slug) já está em uso por outra pizzaria.'
            : 'Não foi possível salvar. Tente novamente.',
      })
    } finally {
      setSalvando(false)
    }
  }

  return (
    <>
      <header className="pagina-cabecalho">
        <h1>Configurações</h1>
        <p>Dados da sua pizzaria exibidos no cardápio</p>
      </header>

      <section className="config-aparencia">
        <h2>Aparência do painel</h2>
        <p className="texto-suave">
          Vale apenas para este dispositivo. O cardápio dos seus clientes continua sempre claro.
        </p>
        <div className="seletor-tema" role="group" aria-label="Tema do painel">
          <button
            type="button"
            className={tema === 'claro' ? 'seletor-tema-opcao ativo' : 'seletor-tema-opcao'}
            aria-pressed={tema === 'claro'}
            onClick={() => alterarTema('claro')}
          >
            Claro
          </button>
          <button
            type="button"
            className={tema === 'escuro' ? 'seletor-tema-opcao ativo' : 'seletor-tema-opcao'}
            aria-pressed={tema === 'escuro'}
            onClick={() => alterarTema('escuro')}
          >
            Escuro
          </button>
        </div>
      </section>

      <form className="form-config" onSubmit={salvar}>
        <label>
          Nome da pizzaria
          <input type="text" required value={nome} onChange={(e) => setNome(e.target.value)} />
        </label>

        <label>
          Endereço do cardápio (slug)
          <input type="text" required value={slug} onChange={(e) => setSlug(e.target.value)} />
          <small className="campo-dica">
            Cardápio em: {window.location.origin}/{gerarSlug(slug) || '…'} — cuidado: mudar o
            endereço quebra links já compartilhados.
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
          <small className="campo-dica">
            Somente números: 55 + DDD + número. Ex.: 5511999999999
          </small>
        </label>

        <div className="campo-logo">
          <span className="campo-logo-titulo">Logo</span>
          <div className="campo-logo-conteudo">
            {previewLogo ? (
              <img src={previewLogo} alt="Logo da pizzaria" className="campo-logo-preview" />
            ) : (
              <span className="campo-logo-preview campo-logo-preview--vazio">🍕</span>
            )}
            <label className="btn btn-secundario">
              {previewLogo ? 'Trocar logo' : 'Enviar logo'}
              <input type="file" accept="image/*" hidden onChange={aoEscolherLogo} />
            </label>
          </div>
        </div>

        {mensagem && (
          <p className={mensagem.tipo === 'ok' ? 'form-ok' : 'form-erro'}>{mensagem.texto}</p>
        )}

        <button type="submit" className="btn btn-primario" disabled={salvando}>
          {salvando ? 'Salvando…' : 'Salvar configurações'}
        </button>
      </form>
    </>
  )
}
