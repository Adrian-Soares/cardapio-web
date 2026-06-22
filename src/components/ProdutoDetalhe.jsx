import { useEffect, useMemo, useState } from 'react'
import { useCart } from '../context/CartContext.jsx'
import { formatPreco } from '../lib/format.js'

function normalizar(texto) {
  return (texto ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
}

// Preço de um sabor no tamanho escolhido (casado pelo nome do tamanho);
// se o sabor não tiver aquele tamanho, usa o maior preço dele.
function precoNoTamanho(produto, tamanhoNome) {
  const t = (produto.tamanhos_produto ?? []).find((x) => x.nome === tamanhoNome)
  if (t) return Number(t.preco)
  const precos = (produto.tamanhos_produto ?? []).map((x) => Number(x.preco))
  return precos.length ? Math.max(...precos) : 0
}

export default function ProdutoDetalhe({
  produto,
  tamanhos,
  saboresMeio = [],
  bordas = [],
  meioPreco = 'maior',
  montavel = false,
  maxSabores = 1,
  onFechar,
}) {
  const { adicionarItem } = useCart()
  const [tamanhoId, setTamanhoId] = useState(tamanhos[0]?.id)
  const [saboresSel, setSaboresSel] = useState(montavel ? [produto.id] : [])
  const [bordaId, setBordaId] = useState('')
  const [buscaSabor, setBuscaSabor] = useState('')
  const [observacao, setObservacao] = useState('')
  const [qtd, setQtd] = useState(1)
  const [fechando, setFechando] = useState(false)

  // Fecha com animação de recolhimento; se o usuário pediu menos movimento, fecha na hora.
  function fechar() {
    const semMovimento = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    if (semMovimento) {
      onFechar()
      return
    }
    setFechando(true)
    setTimeout(onFechar, 340)
  }

  // Trava a rolagem do cardápio atrás enquanto o detalhe está aberto.
  useEffect(() => {
    const anterior = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = anterior
    }
  }, [])

  const tamanhoSel = tamanhos.find((t) => t.id === tamanhoId) ?? tamanhos[0]
  const tamNome = tamanhoSel?.nome
  const bordaSel = bordas.find((b) => b.id === bordaId) ?? null

  function toggleSabor(id) {
    setSaboresSel((prev) =>
      prev.includes(id)
        ? prev.filter((x) => x !== id)
        : prev.length >= maxSabores
          ? prev
          : [...prev, id]
    )
  }

  const saboresFiltrados = useMemo(() => {
    const termo = normalizar(buscaSabor.trim())
    if (!termo) return saboresMeio
    return saboresMeio.filter((p) => normalizar(`${p.nome} ${p.descricao ?? ''}`).includes(termo))
  }, [saboresMeio, buscaSabor])

  let base = 0
  if (montavel) {
    if (saboresSel.length) {
      const precos = saboresSel.map((id) =>
        precoNoTamanho(saboresMeio.find((p) => p.id === id), tamNome)
      )
      base =
        meioPreco === 'media'
          ? precos.reduce((a, b) => a + b, 0) / precos.length
          : Math.max(...precos)
    }
  } else {
    base = Number(tamanhoSel?.preco ?? 0)
  }

  const completo = montavel ? saboresSel.length > 0 : !!tamanhoSel
  const unitario = base + (bordaSel ? Number(bordaSel.preco) : 0)
  const total = unitario * qtd

  function adicionar() {
    if (!completo) return
    const obs = observacao.trim()
    const sufixoObs = obs ? `|obs:${obs}` : ''
    if (montavel) {
      const nomes = saboresSel
        .map((id) => saboresMeio.find((p) => p.id === id)?.nome)
        .filter(Boolean)
      adicionarItem({
        key: `meio|${tamNome}|${[...saboresSel].sort().join('-')}|${bordaSel?.id ?? '0'}${sufixoObs}`,
        tipo: 'meio',
        produtoNome: produto.nome,
        tamanhoNome: tamNome,
        metades: nomes,
        borda: bordaSel?.nome ?? null,
        observacao: obs || null,
        preco: unitario,
        qtd,
      })
    } else {
      adicionarItem({
        key: `${produto.id}:${tamanhoSel.id}${sufixoObs}`,
        tipo: 'normal',
        produtoNome: produto.nome,
        tamanhoNome: tamNome,
        observacao: obs || null,
        preco: unitario,
        qtd,
      })
    }
    onFechar()
  }

  return (
    <div
      className={`detalhe-overlay ${fechando ? 'detalhe-overlay--fechando' : ''}`}
      onClick={fechar}
    >
      <div
        className={`detalhe ${fechando ? 'detalhe--fechando' : ''}`}
        role="dialog"
        aria-label={produto.nome}
        onClick={(e) => e.stopPropagation()}
      >
        <button type="button" className="detalhe-fechar" onClick={fechar} aria-label="Voltar">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>

        <div className="detalhe-corpo">
          <div className="detalhe-capa">
            {produto.foto_url ? (
              <img src={produto.foto_url} alt={produto.nome} />
            ) : (
              <span className="detalhe-capa-vazia" aria-hidden="true">
                <svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
                  <path d="M24 44 7 14a31 31 0 0 1 34 0Z" fill="#f0c485" />
                  <path d="M7 14a31 31 0 0 1 34 0l-2.6 4.6a25.6 25.6 0 0 0-28.8 0Z" fill="#d8862c" />
                  <circle cx="18.5" cy="24" r="3" fill="#bb4a2e" />
                  <circle cx="28.5" cy="22" r="3" fill="#bb4a2e" />
                  <circle cx="23.5" cy="31.5" r="2.6" fill="#bb4a2e" />
                </svg>
              </span>
            )}
          </div>

          <div className="detalhe-cabecalho">
            <h2>{produto.nome}</h2>
            {produto.descricao && <p>{produto.descricao}</p>}
          </div>

          {tamanhos.length > 1 && (
            <section className="detalhe-secao">
              <div className="detalhe-secao-topo">
                <h3>Tamanho</h3>
              </div>
              <div className="detalhe-pills">
                {tamanhos.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    className={`pill ${t.id === tamanhoSel.id ? 'pill--ativo' : ''}`}
                    aria-pressed={t.id === tamanhoSel.id}
                    onClick={() => setTamanhoId(t.id)}
                  >
                    {t.nome}
                    {!montavel && <span className="pill-extra"> {formatPreco(t.preco)}</span>}
                  </button>
                ))}
              </div>
            </section>
          )}

          {montavel && (
            <section className="detalhe-secao">
              <div className="detalhe-secao-topo">
                <h3>Sabores</h3>
                <span className="detalhe-contador">
                  {saboresSel.length}/{maxSabores}
                </span>
              </div>
              <p className="detalhe-secao-sub">
                Escolha até {maxSabores} {maxSabores > 1 ? 'sabores' : 'sabor'}
              </p>

              <div className="detalhe-busca">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                  <circle cx="11" cy="11" r="7" />
                  <line x1="16.5" y1="16.5" x2="21" y2="21" />
                </svg>
                <input
                  type="text"
                  value={buscaSabor}
                  onChange={(e) => setBuscaSabor(e.target.value)}
                  placeholder="Buscar sabor..."
                  aria-label="Buscar sabor"
                />
                {buscaSabor && (
                  <button
                    type="button"
                    className="detalhe-busca-limpar"
                    onClick={() => setBuscaSabor('')}
                    aria-label="Limpar busca"
                  >
                    ✕
                  </button>
                )}
              </div>

              <ul className="detalhe-lista">
                {saboresFiltrados.map((p) => {
                  const sel = saboresSel.includes(p.id)
                  const bloqueado = !sel && saboresSel.length >= maxSabores
                  return (
                    <li key={p.id} className="detalhe-item">
                      <div className="detalhe-item-info">
                        <strong>{p.nome}</strong>
                        {p.descricao && <span className="detalhe-item-desc">{p.descricao}</span>}
                        <span className="detalhe-item-preco">
                          {formatPreco(precoNoTamanho(p, tamNome))}
                        </span>
                      </div>
                      <button
                        type="button"
                        className={`detalhe-add ${sel ? 'detalhe-add--sel' : ''}`}
                        disabled={bloqueado}
                        aria-pressed={sel}
                        aria-label={sel ? `Remover ${p.nome}` : `Adicionar ${p.nome}`}
                        onClick={() => toggleSabor(p.id)}
                      >
                        {sel ? (
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                            <polyline points="5 12 10 17 19 7" />
                          </svg>
                        ) : (
                          '+'
                        )}
                      </button>
                    </li>
                  )
                })}
                {saboresFiltrados.length === 0 && (
                  <li className="detalhe-vazio">Nenhum sabor encontrado.</li>
                )}
              </ul>
            </section>
          )}

          {montavel && bordas.length > 0 && (
            <section className="detalhe-secao">
              <div className="detalhe-secao-topo">
                <h3>Borda recheada</h3>
              </div>
              <p className="detalhe-secao-sub">Opcional</p>
              <ul className="detalhe-lista">
                <li className="detalhe-item">
                  <div className="detalhe-item-info">
                    <strong>Sem borda</strong>
                  </div>
                  <button
                    type="button"
                    className={`detalhe-radio ${bordaId === '' ? 'detalhe-radio--sel' : ''}`}
                    aria-pressed={bordaId === ''}
                    aria-label="Sem borda"
                    onClick={() => setBordaId('')}
                  />
                </li>
                {bordas.map((b) => (
                  <li key={b.id} className="detalhe-item">
                    <div className="detalhe-item-info">
                      <strong>{b.nome}</strong>
                      {Number(b.preco) > 0 && (
                        <span className="detalhe-item-preco">+ {formatPreco(b.preco)}</span>
                      )}
                    </div>
                    <button
                      type="button"
                      className={`detalhe-radio ${b.id === bordaId ? 'detalhe-radio--sel' : ''}`}
                      aria-pressed={b.id === bordaId}
                      aria-label={b.nome}
                      onClick={() => setBordaId(b.id)}
                    />
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section className="detalhe-secao">
            <div className="detalhe-secao-topo">
              <h3>Alguma observação?</h3>
            </div>
            <p className="detalhe-secao-sub">Ex.: sem cebola, capricha no queijo, bem assada…</p>
            <textarea
              className="detalhe-obs"
              value={observacao}
              onChange={(e) => setObservacao(e.target.value)}
              maxLength={250}
              rows={3}
              placeholder="Escreva aqui para a cozinha"
              aria-label="Observação para o pedido"
            />
          </section>
        </div>

        <div className="detalhe-rodape">
          <div className="detalhe-qtd">
            <button type="button" onClick={() => setQtd((q) => Math.max(1, q - 1))} aria-label="Diminuir quantidade">
              −
            </button>
            <span>{qtd}</span>
            <button type="button" onClick={() => setQtd((q) => q + 1)} aria-label="Aumentar quantidade">
              +
            </button>
          </div>
          <button
            type="button"
            className="detalhe-confirmar"
            disabled={!completo}
            onClick={adicionar}
          >
            <span>Adicionar</span>
            <span className="detalhe-confirmar-total">{formatPreco(total)}</span>
          </button>
        </div>
      </div>
    </div>
  )
}
