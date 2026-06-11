import { useEffect, useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { supabase } from '../../lib/supabase.js'

export default function CategoriasPage() {
  const { pizzaria } = useOutletContext()
  const [categorias, setCategorias] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [novoNome, setNovoNome] = useState('')
  const [editandoId, setEditandoId] = useState(null)
  const [nomeEdicao, setNomeEdicao] = useState('')
  const [erro, setErro] = useState(null)

  useEffect(() => {
    carregar()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pizzaria.id])

  async function carregar() {
    setCarregando(true)
    const { data, error } = await supabase
      .from('categorias')
      .select('*')
      .eq('pizzaria_id', pizzaria.id)
      .order('ordem', { ascending: true })

    if (error) {
      console.error(error)
      setErro('Não foi possível carregar as categorias.')
    } else {
      setCategorias(data ?? [])
      setErro(null)
    }
    setCarregando(false)
  }

  async function adicionar(e) {
    e.preventDefault()
    const nome = novoNome.trim()
    if (!nome) return

    const proximaOrdem =
      categorias.length > 0 ? Math.max(...categorias.map((c) => c.ordem)) + 1 : 1

    const { error } = await supabase
      .from('categorias')
      .insert({ pizzaria_id: pizzaria.id, nome, ordem: proximaOrdem })

    if (error) {
      console.error(error)
      setErro('Não foi possível criar a categoria.')
      return
    }
    setNovoNome('')
    carregar()
  }

  function iniciarEdicao(cat) {
    setEditandoId(cat.id)
    setNomeEdicao(cat.nome)
  }

  async function salvarEdicao(cat) {
    const nome = nomeEdicao.trim()
    if (!nome || nome === cat.nome) {
      setEditandoId(null)
      return
    }

    const { error } = await supabase.from('categorias').update({ nome }).eq('id', cat.id)
    if (error) {
      console.error(error)
      setErro('Não foi possível renomear a categoria.')
      return
    }
    setEditandoId(null)
    carregar()
  }

  async function mover(indice, direcao) {
    const destino = indice + direcao
    if (destino < 0 || destino >= categorias.length) return

    const a = categorias[indice]
    const b = categorias[destino]

    const [r1, r2] = await Promise.all([
      supabase.from('categorias').update({ ordem: b.ordem }).eq('id', a.id),
      supabase.from('categorias').update({ ordem: a.ordem }).eq('id', b.id),
    ])

    if (r1.error || r2.error) {
      console.error(r1.error ?? r2.error)
      setErro('Não foi possível reordenar.')
      return
    }
    carregar()
  }

  async function remover(cat) {
    const confirmado = window.confirm(
      `Remover a categoria "${cat.nome}"?\n\nATENÇÃO: todos os produtos dessa categoria também serão removidos.`
    )
    if (!confirmado) return

    const { error } = await supabase.from('categorias').delete().eq('id', cat.id)
    if (error) {
      console.error(error)
      setErro('Não foi possível remover a categoria.')
      return
    }
    carregar()
  }

  return (
    <>
      <header className="pagina-cabecalho">
        <h1>Categorias</h1>
        <p>Organize as seções do seu cardápio (a ordem aqui é a ordem de exibição)</p>
      </header>

      {erro && <p className="form-erro">{erro}</p>}

      <form className="form-linha" onSubmit={adicionar}>
        <input
          type="text"
          value={novoNome}
          onChange={(e) => setNovoNome(e.target.value)}
          placeholder="Nova categoria — ex.: Pizzas Doces"
        />
        <button type="submit" className="btn btn-primario">
          Adicionar
        </button>
      </form>

      {carregando ? (
        <p className="texto-suave">Carregando…</p>
      ) : categorias.length === 0 ? (
        <p className="texto-suave">Nenhuma categoria ainda. Crie a primeira acima.</p>
      ) : (
        <ul className="lista-admin">
          {categorias.map((cat, indice) => (
            <li key={cat.id} className="lista-admin-item">
              {editandoId === cat.id ? (
                <input
                  type="text"
                  className="input-edicao"
                  value={nomeEdicao}
                  autoFocus
                  onChange={(e) => setNomeEdicao(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') salvarEdicao(cat)
                    if (e.key === 'Escape') setEditandoId(null)
                  }}
                />
              ) : (
                <span className="lista-admin-nome">{cat.nome}</span>
              )}

              <div className="lista-admin-acoes">
                {editandoId === cat.id ? (
                  <>
                    <button type="button" className="btn btn-mini" onClick={() => salvarEdicao(cat)}>
                      Salvar
                    </button>
                    <button type="button" className="btn btn-mini" onClick={() => setEditandoId(null)}>
                      Cancelar
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      className="btn btn-mini"
                      disabled={indice === 0}
                      onClick={() => mover(indice, -1)}
                      aria-label="Mover para cima"
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      className="btn btn-mini"
                      disabled={indice === categorias.length - 1}
                      onClick={() => mover(indice, 1)}
                      aria-label="Mover para baixo"
                    >
                      ↓
                    </button>
                    <button type="button" className="btn btn-mini" onClick={() => iniciarEdicao(cat)}>
                      Renomear
                    </button>
                    <button
                      type="button"
                      className="btn btn-mini btn-perigo"
                      onClick={() => remover(cat)}
                    >
                      Remover
                    </button>
                  </>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
  )
}
