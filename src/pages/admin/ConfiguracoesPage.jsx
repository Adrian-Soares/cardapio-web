import { useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { supabase } from '../../lib/supabase.js'
import { uploadImagem, gerarSlug } from '../../lib/storage.js'
import { DIAS, horariosPadrao } from '../../lib/horarios.js'

export default function ConfiguracoesPage() {
  const { pizzaria, setPizzaria, tema, alterarTema } = useOutletContext()
  const [nome, setNome] = useState(pizzaria.nome)
  const [slug, setSlug] = useState(pizzaria.slug)
  const [whatsapp, setWhatsapp] = useState(pizzaria.whatsapp)
  const [cidade, setCidade] = useState(pizzaria.cidade ?? '')
  const [logoFile, setLogoFile] = useState(null)
  const [previewLogo, setPreviewLogo] = useState(pizzaria.logo_url)
  // imagens de fundo (banner do topo + fundo do cardápio)
  const [bannerFile, setBannerFile] = useState(null)
  const [previewBanner, setPreviewBanner] = useState(pizzaria.banner_url ?? null)
  const [bannerRemovido, setBannerRemovido] = useState(false)
  const [horarios, setHorarios] = useState(() => ({
    ...horariosPadrao(),
    ...(pizzaria.horarios ?? {}),
  }))
  const [cobraTaxa, setCobraTaxa] = useState((pizzaria.taxa_entrega ?? 0) > 0)
  const [taxaEntrega, setTaxaEntrega] = useState(
    pizzaria.taxa_entrega ? String(pizzaria.taxa_entrega).replace('.', ',') : ''
  )
  const [temMinimo, setTemMinimo] = useState((pizzaria.pedido_minimo ?? 0) > 0)
  const [pedidoMinimo, setPedidoMinimo] = useState(
    pizzaria.pedido_minimo ? String(pizzaria.pedido_minimo).replace('.', ',') : ''
  )
  const [meioPreco, setMeioPreco] = useState(pizzaria.meio_preco ?? 'maior')
  const [salvando, setSalvando] = useState(false)
  const [mensagem, setMensagem] = useState(null) // { tipo: 'ok' | 'erro', texto }

  // "12,90" / "12.90" -> 12.9 ; vazio/invalido -> null
  function paraNumero(texto) {
    const n = Number(String(texto).replace(/[^\d,.]/g, '').replace(',', '.'))
    return Number.isNaN(n) || n <= 0 ? null : n
  }

  function aoEscolherLogo(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setLogoFile(file)
    setPreviewLogo(URL.createObjectURL(file))
  }

  function aoEscolherBanner(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setBannerFile(file)
    setPreviewBanner(URL.createObjectURL(file))
    setBannerRemovido(false)
  }

  function removerBanner() {
    setBannerFile(null)
    setPreviewBanner(null)
    setBannerRemovido(true)
  }

  function mudarDia(chave, campo, valor) {
    setHorarios((h) => ({ ...h, [chave]: { ...h[chave], [campo]: valor } }))
  }

  function replicarParaTodos() {
    setHorarios((h) => {
      const modelo = h[DIAS[0].chave]
      const novo = {}
      for (const d of DIAS) novo[d.chave] = { ...modelo }
      return novo
    })
  }

  async function salvar(e) {
    e.preventDefault()
    setMensagem(null)
    setSalvando(true)

    // Validação dos campos opcionais ligados
    if (cobraTaxa && paraNumero(taxaEntrega) == null) {
      setSalvando(false)
      setMensagem({ tipo: 'erro', texto: 'Informe um valor válido para a taxa de entrega.' })
      return
    }
    if (temMinimo && paraNumero(pedidoMinimo) == null) {
      setSalvando(false)
      setMensagem({ tipo: 'erro', texto: 'Informe um valor válido para o pedido mínimo.' })
      return
    }

    try {
      let logo_url = pizzaria.logo_url
      if (logoFile) {
        logo_url = await uploadImagem(pizzaria.id, logoFile)
      }

      let banner_url = bannerFile ? null : bannerRemovido ? null : pizzaria.banner_url
      if (bannerFile) banner_url = await uploadImagem(pizzaria.id, bannerFile)

      const base = {
        nome: nome.trim(),
        slug: gerarSlug(slug),
        whatsapp: whatsapp.replace(/\D/g, ''),
        logo_url,
      }
      // Campos de colunas adicionadas por migração (podem ainda não existir no banco)
      const opcionais = {
        cidade: cidade.trim() || null,
        banner_url,
        horarios,
        taxa_entrega: cobraTaxa ? paraNumero(taxaEntrega) : null,
        pedido_minimo: temMinimo ? paraNumero(pedidoMinimo) : null,
        meio_preco: meioPreco,
      }

      async function atualizar(dados) {
        return supabase.from('pizzarias').update(dados).eq('id', pizzaria.id).select().single()
      }

      let { data, error } = await atualizar({ ...base, ...opcionais })

      // Alguma coluna opcional pode não existir ainda (migração não rodada):
      // PGRST204 ("schema cache") ou 42703 ("undefined column"). Salva o básico e avisa.
      let faltamColunas = false
      if (error && (error.code === 'PGRST204' || error.code === '42703')) {
        ;({ data, error } = await atualizar(base))
        faltamColunas = true
      }

      if (error) throw error

      setPizzaria(data)
      setSlug(data.slug)
      setLogoFile(null)
      setBannerFile(null)
      setBannerRemovido(false)
      setPreviewBanner(data.banner_url ?? null)
      setMensagem(
        faltamColunas
          ? {
              tipo: 'erro',
              texto:
                'Dados básicos salvos, mas recursos novos (horários, taxa de entrega, pedido mínimo) precisam das migrações. Rode os arquivos supabase/add-*.sql no SQL Editor do Supabase.',
            }
          : { tipo: 'ok', texto: 'Configurações salvas!' }
      )
    } catch (err) {
      console.error(err)
      setMensagem({
        tipo: 'erro',
        texto:
          err?.code === '23505'
            ? 'Esse endereço (slug) já está em uso por outro estabelecimento.'
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
        <p>Dados do seu estabelecimento exibidos no cardápio</p>
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
          Nome do estabelecimento
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

        <label>
          Cidade / localização
          <input
            type="text"
            value={cidade}
            onChange={(e) => setCidade(e.target.value)}
            placeholder="Ex.: Maricá - RJ"
          />
          <small className="campo-dica">Aparece no topo do cardápio. Deixe vazio para não mostrar.</small>
        </label>

        <fieldset className="entrega-editor">
          <legend>Entrega e pedido mínimo</legend>
          <p className="campo-dica">Tudo opcional. Deixe desligado se não se aplica ao seu negócio.</p>

          <label className="campo-checkbox entrega-toggle">
            <input
              type="checkbox"
              checked={cobraTaxa}
              onChange={(e) => setCobraTaxa(e.target.checked)}
            />
            Cobrar taxa de entrega
          </label>
          {cobraTaxa && (
            <div className="entrega-valor">
              <span className="entrega-prefixo">R$</span>
              <input
                type="text"
                inputMode="decimal"
                value={taxaEntrega}
                onChange={(e) => setTaxaEntrega(e.target.value)}
                placeholder="5,00"
                aria-label="Valor da taxa de entrega"
              />
            </div>
          )}

          <label className="campo-checkbox entrega-toggle">
            <input
              type="checkbox"
              checked={temMinimo}
              onChange={(e) => setTemMinimo(e.target.checked)}
            />
            Exigir valor mínimo do pedido
          </label>
          {temMinimo && (
            <div className="entrega-valor">
              <span className="entrega-prefixo">R$</span>
              <input
                type="text"
                inputMode="decimal"
                value={pedidoMinimo}
                onChange={(e) => setPedidoMinimo(e.target.value)}
                placeholder="30,00"
                aria-label="Valor do pedido mínimo"
              />
            </div>
          )}
          <small className="campo-dica">
            O cliente vê a taxa somada no checkout e não consegue fechar abaixo do mínimo.
          </small>

          <label className="meio-preco-campo">
            Preço da pizza com vários sabores
            <select value={meioPreco} onChange={(e) => setMeioPreco(e.target.value)}>
              <option value="maior">Maior valor entre os sabores</option>
              <option value="media">Média dos sabores</option>
            </select>
            <small className="campo-dica">
              Ative o meio a meio por categoria na aba Categorias. As bordas recheadas ficam na aba
              Bordas.
            </small>
          </label>
        </fieldset>

        <div className="campo-logo">
          <span className="campo-logo-titulo">Logo</span>
          <div className="campo-logo-conteudo">
            {previewLogo ? (
              <img src={previewLogo} alt="Logo do estabelecimento" className="campo-logo-preview" />
            ) : (
              <span className="campo-logo-preview campo-logo-preview--vazio">🍽️</span>
            )}
            <label className="btn btn-secundario">
              {previewLogo ? 'Trocar logo' : 'Enviar logo'}
              <input type="file" accept="image/*" hidden onChange={aoEscolherLogo} />
            </label>
          </div>
        </div>

        <fieldset className="imagens-fundo">
          <legend>Imagem do banner (topo)</legend>

          <div className="campo-imagem">
            <div className="campo-imagem-preview">
              {previewBanner ? (
                <img src={previewBanner} alt="Banner do cardápio" />
              ) : (
                <span className="campo-imagem-vazio">Imagem padrão</span>
              )}
            </div>
            <div className="campo-imagem-acoes">
              <label className="btn btn-secundario">
                {previewBanner ? 'Trocar' : 'Enviar imagem'}
                <input type="file" accept="image/*" hidden onChange={aoEscolherBanner} />
              </label>
              {previewBanner && (
                <button type="button" className="btn btn-mini btn-perigo" onClick={removerBanner}>
                  Remover
                </button>
              )}
            </div>
            <small className="campo-dica">Sem imagem, usa a foto padrão do topo.</small>
          </div>
        </fieldset>

        <fieldset className="horarios-editor">
          <legend>Horário de funcionamento</legend>
          <p className="campo-dica">
            Mostra um selo “Aberto/Fechado agora” no seu cardápio. Deixe um dia como Fechado se não
            abrir.
          </p>

          {DIAS.map((d) => {
            const dia = horarios[d.chave]
            return (
              <div className="horario-linha" key={d.chave}>
                <label className="horario-toggle">
                  <input
                    type="checkbox"
                    checked={dia.aberto}
                    onChange={(e) => mudarDia(d.chave, 'aberto', e.target.checked)}
                  />
                  <span className="horario-dia">{d.label}</span>
                </label>

                {dia.aberto ? (
                  <div className="horario-faixas">
                    <input
                      type="time"
                      value={dia.abre}
                      onChange={(e) => mudarDia(d.chave, 'abre', e.target.value)}
                      aria-label={`Abre ${d.label}`}
                    />
                    <span className="horario-ate">às</span>
                    <input
                      type="time"
                      value={dia.fecha}
                      onChange={(e) => mudarDia(d.chave, 'fecha', e.target.value)}
                      aria-label={`Fecha ${d.label}`}
                    />
                  </div>
                ) : (
                  <span className="horario-fechado-label">Fechado</span>
                )}
              </div>
            )
          })}

          <button type="button" className="btn btn-mini horario-replicar" onClick={replicarParaTodos}>
            Aplicar o horário de segunda a todos os dias
          </button>
          <small className="campo-dica">
            Dica: para quem fecha de madrugada, use por exemplo 18:00 às 02:00 — o sistema entende
            que vira o dia.
          </small>
        </fieldset>

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
