import { useEffect, useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { supabase } from '../../lib/supabase.js'
import { formatPreco } from '../../lib/format.js'

const ERRO_SEM_TABELA =
  'Para usar bordas, rode a migração supabase/add-borda.sql no SQL Editor do Supabase.'

// "12,90" / "12.90" -> 12.9 ; vazio/0 -> 0
function paraNumero(texto) {
  const n = Number(String(texto).replace(/[^\d,.]/g, '').replace(',', '.'))
  return Number.isNaN(n) || n < 0 ? 0 : n
}

function semTabela(error) {
  return error?.code === '42P01' || error?.code === 'PGRST205' || error?.code === 'PGRST204'
}

export default function BordasPage() {
  const { pizzaria } = useOutletContext()
  const [bordas, setBordas] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [novoNome, setNovoNome] = useState('')
  const [novoPreco, setNovoPreco] = useState('')
  const [editandoId, setEditandoId] = useState(null)
  const [nomeEdicao, setNomeEdicao] = useState('')
  const [precoEdicao, setPrecoEdicao] = useState('')
  const [erro, setErro] = useState(null)

  useEffect(() => {
    carregar()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pizzaria.id])

  async function carregar() {
    setCarregando(true)
    const { data, error } = await supabase
      .from('bordas')
      .select('*')
      .eq('pizzaria_id', pizzaria.id)
      .order('ordem', { ascending: true })

    if (error) {
      console.error(error)
      setErro(semTabela(error) ? ERRO_SEM_TABELA : 'Não foi possível carregar as bordas.')
    } else {
      setBordas(data ?? [])
      setErro(null)
    }
    setCarregando(false)
  }

  async function adicionar(e) {
    e.preventDefault()
    const nome = novoNome.trim()
    if (!nome) return

    const proximaOrdem = bordas.length > 0 ? Math.max(...bordas.map((b) => b.ordem)) + 1 : 1

    const { error } = await supabase.from('bordas').insert({
      pizzaria_id: pizzaria.id,
      nome,
      preco: paraNumero(novoPreco),
      ordem: proximaOrdem,
    })

    if (error) {
      console.error(error)
      setErro(semTabela(error) ? ERRO_SEM_TABELA : 'Não foi possível criar a borda.')
      return
    }
    setNovoNome('')
    setNovoPreco('')
    carregar()
  }

  function iniciarEdicao(borda) {
    setEditandoId(borda.id)
    setNomeEdicao(borda.nome)
    setPrecoEdicao(borda.preco ? String(borda.preco).replace('.', ',') : '')
  }

  async function salvarEdicao(borda) {
    const nome = nomeEdicao.trim()
    if (!nome) {
      setEditandoId(null)
      return
    }
    const { error } = await supabase
      .from('bordas')
      .update({ nome, preco: paraNumero(precoEdicao) })
      .eq('id', borda.id)
    if (error) {
      console.error(error)
      setErro('Não foi possível salvar a borda.')
      return
    }
    setEditandoId(null)
    carregar()
  }

  async function alternarAtivo(borda) {
    const { error } = await supabase
      .from('bordas')
      .update({ ativo: !borda.ativo })
      .eq('id', borda.id)
    if (error) {
      console.error(error)
      setErro('Não foi possível alterar o status da borda.')
      return
    }
    carregar()
  }

  async function mover(indice, direcao) {
    const destino = indice + direcao
    if (destino < 0 || destino >= bordas.length) return

    const a = bordas[indice]
    const b = bordas[destino]

    const [r1, r2] = await Promise.all([
      supabase.from('bordas').update({ ordem: b.ordem }).eq('id', a.id),
      supabase.from('bordas').update({ ordem: a.ordem }).eq('id', b.id),
    ])

    if (r1.error || r2.error) {
      console.error(r1.error ?? r2.error)
      setErro('Não foi possível reordenar.')
      return
    }
    carregar()
  }

  async function remover(borda) {
    if (!window.confirm(`Remover a borda "${borda.nome}"?`)) return
    const { error } = await supabase.from('bordas').delete().eq('id', borda.id)
    if (error) {
      console.error(error)
      setErro('Não foi possível remover a borda.')
      return
    }
    carregar()
  }

  return (
    <>
      <header className="pagina-cabecalho">
        <h1>Bordas</h1>
        <p>Recheios de borda que o cliente escolhe ao montar a pizza no cardápio</p>
      </header>

      {erro && <p className="form-erro">{erro}</p>}

      <form className="form-linha form-linha--borda" onSubmit={adicionar}>
        <input
          type="text"
          value={novoNome}
          onChange={(e) => setNovoNome(e.target.value)}
          placeholder="Nova borda — ex.: Catupiry"
        />
        <input
          type="text"
          inputMode="decimal"
          className="input-preco"
          value={novoPreco}
          onChange={(e) => setNovoPreco(e.target.value)}
          placeholder="R$ 0,00"
          aria-label="Preço da borda"
        />
        <button type="submit" className="btn btn-primario">
          Adicionar
        </button>
      </form>

      {carregando ? (
        <p className="texto-suave">Carregando…</p>
      ) : bordas.length === 0 ? (
        <p className="texto-suave">
          Nenhuma borda ainda. Cadastre a primeira acima (preço 0 para borda grátis).
        </p>
      ) : (
        <ul className="lista-admin">
          {bordas.map((borda, indice) => (
            <li
              key={borda.id}
              className={`lista-admin-item ${borda.ativo ? '' : 'lista-admin-item--inativo'}`}
            >
              {editandoId === borda.id ? (
                <div className="borda-edicao">
                  <input
                    type="text"
                    className="input-edicao"
                    value={nomeEdicao}
                    autoFocus
                    onChange={(e) => setNomeEdicao(e.target.value)}
                  />
                  <input
                    type="text"
                    inputMode="decimal"
                    className="input-edicao input-preco"
                    value={precoEdicao}
                    onChange={(e) => setPrecoEdicao(e.target.value)}
                    placeholder="R$ 0,00"
                    aria-label="Preço da borda"
                  />
                </div>
              ) : (
                <span className="lista-admin-nome">
                  {borda.nome}
                  <small className="texto-suave">
                    {' · '}
                    {Number(borda.preco) > 0 ? formatPreco(borda.preco) : 'grátis'}
                  </small>
                  {!borda.ativo && <em className="badge-inativo">inativa</em>}
                </span>
              )}

              <div className="lista-admin-acoes">
                {editandoId === borda.id ? (
                  <>
                    <button type="button" className="btn btn-mini" onClick={() => salvarEdicao(borda)}>
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
                      disabled={indice === bordas.length - 1}
                      onClick={() => mover(indice, 1)}
                      aria-label="Mover para baixo"
                    >
                      ↓
                    </button>
                    <button type="button" className="btn btn-mini" onClick={() => alternarAtivo(borda)}>
                      {borda.ativo ? 'Desativar' : 'Ativar'}
                    </button>
                    <button type="button" className="btn btn-mini" onClick={() => iniciarEdicao(borda)}>
                      Editar
                    </button>
                    <button
                      type="button"
                      className="btn btn-mini btn-perigo"
                      onClick={() => remover(borda)}
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
