import { useCart } from '../context/CartContext.jsx'
import { formatPreco } from '../lib/format.js'

export default function ProdutoCard({ produto }) {
  const { adicionar } = useCart()

  const tamanhos = [...(produto.tamanhos_produto ?? [])].sort(
    (a, b) => Number(a.preco) - Number(b.preco)
  )

  return (
    <article className="produto-card">
      {produto.foto_url ? (
        <img className="produto-foto" src={produto.foto_url} alt={produto.nome} loading="lazy" />
      ) : (
        <div className="produto-foto produto-foto--vazia" aria-hidden="true">
          🍕
        </div>
      )}

      <div className="produto-info">
        <h3>{produto.nome}</h3>
        {produto.descricao && <p className="produto-descricao">{produto.descricao}</p>}

        <div className="produto-tamanhos">
          {tamanhos.map((tamanho) => (
            <div key={tamanho.id} className="tamanho-linha">
              <span className="tamanho-nome">{tamanho.nome}</span>
              <span className="tamanho-preco">{formatPreco(tamanho.preco)}</span>
              <button
                type="button"
                className="tamanho-add"
                onClick={() => adicionar(produto, tamanho)}
                aria-label={`Adicionar ${produto.nome} ${tamanho.nome}`}
              >
                +
              </button>
            </div>
          ))}
        </div>
      </div>
    </article>
  )
}
