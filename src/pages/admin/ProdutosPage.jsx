import { useEffect, useState } from 'react'
import { Link, useOutletContext } from 'react-router-dom'
import { supabase } from '../../lib/supabase.js'
import { uploadImagem } from '../../lib/storage.js'
import { formatPreco } from '../../lib/format.js'

const FORM_VAZIO = {
  id: null,
  nome: '',
  descricao: '',
  categoria_id: '',
  ativo: true,
  foto_url: null,
  tamanhos: [{ nome: '', preco: '' }],
}

export default function ProdutosPage() {
  const { pizzaria } = useOutletContext()
  const [produtos, setProdutos] = useState([])
  const [categorias, setCategorias] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState(null)

  // null = lista; objeto = formulário (novo ou edição)
  const [form, setForm] = useState(null)
  const [fotoFile, setFotoFile] = useState(null)
  const [previewFoto, setPreviewFoto] = useState(null)
  const [salvando, setSalvando] = useState(false)
  const [erroForm, setErroForm] = useState(null)

  useEffect(() => {
    carregar()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pizzaria.id])

  async function carregar() {
    setCarregando(true)
    const [{ data: prods, error: e1 }, { data: cats, error: e2 }] = await Promise.all([
      supabase
        .from('produtos')
        .select('*, tamanhos_produto(*)')
        .eq('pizzaria_id', pizzaria.id)
        .order('created_at', { ascending: true }),
      supabase
        .from('categorias')
        .select('*')
        .eq('pizzaria_id', pizzaria.id)
        .order('ordem', { ascending: true }),
    ])

    if (e1 || e2) {
      console.error(e1 ?? e2)
      setErro('Não foi possível carregar os produtos.')
    } else {
      setProdutos(prods ?? [])
      setCategorias(cats ?? [])
      setErro(null)
    }
    setCarregando(false)
  }

  function abrirNovo() {
    setForm({ ...FORM_VAZIO, categoria_id: categorias[0]?.id ?? '' })
    setFotoFile(null)
    setPreviewFoto(null)
    setErroForm(null)
  }

  function abrirEdicao(produto) {
    setForm({
      id: produto.id,
      nome: produto.nome,
      descricao: produto.descricao ?? '',
      categoria_id: produto.categoria_id,
      ativo: produto.ativo,
      foto_url: produto.foto_url,
      tamanhos:
        produto.tamanhos_produto.length > 0
          ? [...produto.tamanhos_produto]
              .sort((a, b) => Number(a.preco) - Number(b.preco))
              .map((t) => ({ nome: t.nome, preco: String(t.preco) }))
          : [{ nome: '', preco: '' }],
    })
    setFotoFile(null)
    setPreviewFoto(produto.foto_url)
    setErroForm(null)
  }

  function fecharForm() {
    setForm(null)
    setFotoFile(null)
    setPreviewFoto(null)
    setErroForm(null)
  }

  function aoEscolherFoto(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setFotoFile(file)
    setPreviewFoto(URL.createObjectURL(file))
  }

  function mudarTamanho(indice, campo, valor) {
    setForm((f) => ({
      ...f,
      tamanhos: f.tamanhos.map((t, i) => (i === indice ? { ...t, [campo]: valor } : t)),
    }))
  }

  function adicionarTamanho() {
    setForm((f) => ({ ...f, tamanhos: [...f.tamanhos, { nome: '', preco: '' }] }))
  }

  function removerTamanho(indice) {
    setForm((f) => ({ ...f, tamanhos: f.tamanhos.filter((_, i) => i !== indice) }))
  }

  async function salvar(e) {
    e.preventDefault()
    setErroForm(null)

    const tamanhosValidos = form.tamanhos
      .map((t) => ({ nome: t.nome.trim(), preco: Number(String(t.preco).replace(',', '.')) }))
      .filter((t) => t.nome && !Number.isNaN(t.preco) && t.preco >= 0)

    if (tamanhosValidos.length === 0) {
      setErroForm('Informe pelo menos um tamanho com nome e preço válidos.')
      return
    }
    if (!form.categoria_id) {
      setErroForm('Escolha uma categoria.')
      return
    }

    setSalvando(true)
    try {
      let foto_url = form.foto_url
      if (fotoFile) {
        foto_url = await uploadImagem(pizzaria.id, fotoFile)
      }

      const dados = {
        pizzaria_id: pizzaria.id,
        categoria_id: form.categoria_id,
        nome: form.nome.trim(),
        descricao: form.descricao.trim() || null,
        foto_url,
        ativo: form.ativo,
      }

      let produtoId = form.id

      if (produtoId) {
        const { error } = await supabase.from('produtos').update(dados).eq('id', produtoId)
        if (error) throw error
        // estratégia simples do MVP: recria os tamanhos
        const { error: eDel } = await supabase
          .from('tamanhos_produto')
          .delete()
          .eq('produto_id', produtoId)
        if (eDel) throw eDel
      } else {
        const { data, error } = await supabase.from('produtos').insert(dados).select().single()
        if (error) throw error
        produtoId = data.id
      }

      const { error: eTam } = await supabase
        .from('tamanhos_produto')
        .insert(tamanhosValidos.map((t) => ({ ...t, produto_id: produtoId })))
      if (eTam) throw eTam

      fecharForm()
      carregar()
    } catch (err) {
      console.error(err)
      setErroForm('Não foi possível salvar o produto. Tente novamente.')
    } finally {
      setSalvando(false)
    }
  }

  async function alternarAtivo(produto) {
    const { error } = await supabase
      .from('produtos')
      .update({ ativo: !produto.ativo })
      .eq('id', produto.id)
    if (error) {
      console.error(error)
      setErro('Não foi possível alterar o status.')
      return
    }
    carregar()
  }

  async function remover(produto) {
    if (!window.confirm(`Remover o produto "${produto.nome}"?`)) return
    const { error } = await supabase.from('produtos').delete().eq('id', produto.id)
    if (error) {
      console.error(error)
      setErro('Não foi possível remover o produto.')
      return
    }
    carregar()
  }

  const nomeCategoria = (id) => categorias.find((c) => c.id === id)?.nome ?? '—'

  // ===== Formulário (novo/edição) =====
  if (form) {
    return (
      <>
        <header className="pagina-cabecalho">
          <h1>{form.id ? 'Editar produto' : 'Novo produto'}</h1>
        </header>

        <form className="form-config" onSubmit={salvar}>
          <label>
            Nome
            <input
              type="text"
              required
              value={form.nome}
              onChange={(e) => setForm((f) => ({ ...f, nome: e.target.value }))}
              placeholder="Ex.: Calabresa"
            />
          </label>

          <label>
            Descrição
            <textarea
              rows={2}
              value={form.descricao}
              onChange={(e) => setForm((f) => ({ ...f, descricao: e.target.value }))}
              placeholder="Ex.: Molho de tomate, calabresa fatiada, cebola e orégano"
            />
          </label>

          <label>
            Categoria
            <select
              required
              value={form.categoria_id}
              onChange={(e) => setForm((f) => ({ ...f, categoria_id: e.target.value }))}
            >
              <option value="" disabled>
                Escolha…
              </option>
              {categorias.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nome}
                </option>
              ))}
            </select>
          </label>

          <fieldset className="form-tamanhos">
            <legend>Tamanhos e preços</legend>
            {form.tamanhos.map((t, indice) => (
              <div key={indice} className="form-tamanho-linha">
                <input
                  type="text"
                  value={t.nome}
                  onChange={(e) => mudarTamanho(indice, 'nome', e.target.value)}
                  placeholder="Ex.: Grande"
                />
                <input
                  type="text"
                  inputMode="decimal"
                  value={t.preco}
                  onChange={(e) => mudarTamanho(indice, 'preco', e.target.value)}
                  placeholder="49,90"
                />
                <button
                  type="button"
                  className="btn btn-mini btn-perigo"
                  onClick={() => removerTamanho(indice)}
                  disabled={form.tamanhos.length === 1}
                  aria-label="Remover tamanho"
                >
                  ✕
                </button>
              </div>
            ))}
            <button type="button" className="btn btn-mini" onClick={adicionarTamanho}>
              + Adicionar tamanho
            </button>
          </fieldset>

          <div className="campo-logo">
            <span className="campo-logo-titulo">Foto</span>
            <div className="campo-logo-conteudo">
              {previewFoto ? (
                <img src={previewFoto} alt="Foto do produto" className="campo-logo-preview" />
              ) : (
                <span className="campo-logo-preview campo-logo-preview--vazio">🍕</span>
              )}
              <label className="btn btn-secundario">
                {previewFoto ? 'Trocar foto' : 'Enviar foto'}
                <input type="file" accept="image/*" hidden onChange={aoEscolherFoto} />
              </label>
            </div>
          </div>

          <label className="campo-checkbox">
            <input
              type="checkbox"
              checked={form.ativo}
              onChange={(e) => setForm((f) => ({ ...f, ativo: e.target.checked }))}
            />
            Produto ativo (visível no cardápio)
          </label>

          {erroForm && <p className="form-erro">{erroForm}</p>}

          <div className="form-acoes">
            <button type="submit" className="btn btn-primario" disabled={salvando}>
              {salvando ? 'Salvando…' : 'Salvar produto'}
            </button>
            <button type="button" className="btn btn-secundario" onClick={fecharForm}>
              Cancelar
            </button>
          </div>
        </form>
      </>
    )
  }

  // ===== Lista =====
  return (
    <>
      <header className="pagina-cabecalho pagina-cabecalho--com-acao">
        <div>
          <h1>Produtos</h1>
          <p>Pizzas, bebidas e tudo que aparece no cardápio</p>
        </div>
        <button
          type="button"
          className="btn btn-primario"
          onClick={abrirNovo}
          disabled={categorias.length === 0}
        >
          + Novo produto
        </button>
      </header>

      {erro && <p className="form-erro">{erro}</p>}

      {carregando ? (
        <p className="texto-suave">Carregando…</p>
      ) : categorias.length === 0 ? (
        <p className="texto-suave">
          Antes de criar produtos, <Link to="/admin/categorias">crie ao menos uma categoria</Link>.
        </p>
      ) : produtos.length === 0 ? (
        <p className="texto-suave">Nenhum produto ainda. Clique em “+ Novo produto”.</p>
      ) : (
        <ul className="lista-admin">
          {produtos.map((produto) => (
            <li
              key={produto.id}
              className={`lista-admin-item ${produto.ativo ? '' : 'lista-admin-item--inativo'}`}
            >
              {produto.foto_url ? (
                <img src={produto.foto_url} alt="" className="produto-mini-foto" />
              ) : (
                <span className="produto-mini-foto produto-mini-foto--vazia">🍕</span>
              )}

              <div className="lista-admin-info">
                <span className="lista-admin-nome">
                  {produto.nome}
                  {!produto.ativo && <em className="badge-inativo">inativo</em>}
                </span>
                <small className="texto-suave">
                  {nomeCategoria(produto.categoria_id)} ·{' '}
                  {[...produto.tamanhos_produto]
                    .sort((a, b) => Number(a.preco) - Number(b.preco))
                    .map((t) => `${t.nome} ${formatPreco(t.preco)}`)
                    .join(' · ') || 'sem tamanhos'}
                </small>
              </div>

              <div className="lista-admin-acoes">
                <button type="button" className="btn btn-mini" onClick={() => alternarAtivo(produto)}>
                  {produto.ativo ? 'Desativar' : 'Ativar'}
                </button>
                <button type="button" className="btn btn-mini" onClick={() => abrirEdicao(produto)}>
                  Editar
                </button>
                <button
                  type="button"
                  className="btn btn-mini btn-perigo"
                  onClick={() => remover(produto)}
                >
                  Remover
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
  )
}
