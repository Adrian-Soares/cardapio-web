import { useRef, useState } from 'react'
import { useCart } from '../context/CartContext.jsx'
import { formatPreco } from '../lib/format.js'
import ProdutoDetalhe from './ProdutoDetalhe.jsx'

function Foto({ produto, carregada, setCarregada }) {
  return (
    <div className={`produto-foto ${produto.foto_url && !carregada ? 'produto-foto--carregando' : ''}`}>
      {produto.foto_url ? (
        <img
          className={`produto-foto-img ${carregada ? 'carregada' : ''}`}
          src={produto.foto_url}
          alt={produto.nome}
          loading="lazy"
          onLoad={() => setCarregada(true)}
        />
      ) : (
        <span className="produto-foto-placeholder" aria-hidden="true">
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
  )
}

export default function ProdutoCard({
  produto,
  ehPizza = false,
  permiteMeio = false,
  saboresMeio = [],
  bordas = [],
  meioPreco = 'maior',
}) {
  const { adicionarItem } = useCart()
  const [carregada, setCarregada] = useState(false)
  const [detalhe, setDetalhe] = useState(false)
  const [feito, setFeito] = useState(false)
  const timerRef = useRef(null)

  const tamanhos = [...(produto.tamanhos_produto ?? [])].sort(
    (a, b) => Number(a.preco) - Number(b.preco)
  )
  const maxSabores = Math.min(4, Math.max(1, saboresMeio.length))
  const montavel = permiteMeio && tamanhos.length > 0 && (maxSabores > 1 || bordas.length > 0)
  const temOpcoes = tamanhos.length > 1 || montavel

  const menorPreco = tamanhos.length ? Number(tamanhos[0].preco) : 0
  const prefixo = temOpcoes ? 'a partir de ' : ''

  function adicionarDireto() {
    const t = tamanhos[0]
    if (!t) return
    adicionarItem({
      key: `${produto.id}:${t.id}`,
      tipo: 'normal',
      produtoNome: produto.nome,
      tamanhoNome: t.nome,
      preco: Number(t.preco),
      qtd: 1,
    })
    setFeito(true)
    clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => setFeito(false), 1000)
  }

  const corpo = (
    <>
      <div className="produto-card-corpo">
        <h3 className="produto-card-nome">
          {produto.nome}
          {ehPizza && (
            <svg className="produto-folha" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M4 19c8 0 15-6 16-15" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
              <path d="M20 4c-5 .2-8.5 1.8-10 6 4.4.2 8-1.6 10-6z" fill="currentColor" />
              <path d="M11.5 11.5c-3.7.2-6.2 1.6-7.5 5 3.6.1 6.2-1.4 7.5-5z" fill="currentColor" />
            </svg>
          )}
        </h3>
        {produto.descricao && <p className="produto-card-desc">{produto.descricao}</p>}
        {menorPreco > 0 && (
          <span className="produto-card-preco">
            {prefixo}
            {formatPreco(menorPreco)}
          </span>
        )}
      </div>

      <div className="produto-card-midia">
        <Foto produto={produto} carregada={carregada} setCarregada={setCarregada} />
        {temOpcoes ? (
          <span className="produto-card-mais" aria-hidden="true">
            +
          </span>
        ) : (
          <button
            type="button"
            className={`produto-card-mais produto-card-mais--btn ${feito ? 'produto-card-mais--ok' : ''}`}
            onClick={adicionarDireto}
            aria-label={`Adicionar ${produto.nome}`}
          >
            {feito ? (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <polyline points="5 12 10 17 19 7" />
              </svg>
            ) : (
              '+'
            )}
          </button>
        )}
      </div>
    </>
  )

  if (!temOpcoes) {
    return <article className="produto-card">{corpo}</article>
  }

  return (
    <>
      <button
        type="button"
        className="produto-card produto-card--clicavel"
        onClick={() => setDetalhe(true)}
        aria-label={`Ver opções de ${produto.nome}`}
      >
        {corpo}
      </button>
      {detalhe && (
        <ProdutoDetalhe
          produto={produto}
          tamanhos={tamanhos}
          saboresMeio={saboresMeio}
          bordas={bordas}
          meioPreco={meioPreco}
          montavel={montavel}
          maxSabores={maxSabores}
          onFechar={() => setDetalhe(false)}
        />
      )}
    </>
  )
}
