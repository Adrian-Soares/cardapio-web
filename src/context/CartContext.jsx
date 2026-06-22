import { createContext, useContext, useMemo, useState } from 'react'

const CartContext = createContext(null)

export function CartProvider({ children }) {
  // item normal: { key, tipo:'normal', produtoNome, tamanhoNome, preco, qtd }
  // item meio:   { key, tipo:'meio', produtoNome:'Meio a meio', tamanhoNome, metades:[a,b], preco, qtd }
  const [itens, setItens] = useState([])

  // Adiciona um item já montado; se a mesma key já existe, soma a quantidade.
  function adicionarItem(novo) {
    setItens((atual) => {
      const existente = atual.find((i) => i.key === novo.key)
      if (existente) {
        return atual.map((i) =>
          i.key === novo.key ? { ...i, qtd: i.qtd + (novo.qtd ?? 1) } : i
        )
      }
      return [...atual, { qtd: 1, ...novo }]
    })
  }

  function adicionar(produto, tamanho) {
    adicionarItem({
      key: `${produto.id}:${tamanho.id}`,
      tipo: 'normal',
      produtoNome: produto.nome,
      tamanhoNome: tamanho.nome,
      preco: Number(tamanho.preco),
      qtd: 1,
    })
  }

  function alterarQtd(key, delta) {
    setItens((atual) =>
      atual
        .map((i) => (i.key === key ? { ...i, qtd: i.qtd + delta } : i))
        .filter((i) => i.qtd > 0)
    )
  }

  function limpar() {
    setItens([])
  }

  const total = useMemo(
    () => itens.reduce((soma, i) => soma + i.preco * i.qtd, 0),
    [itens]
  )

  const qtdTotal = useMemo(
    () => itens.reduce((soma, i) => soma + i.qtd, 0),
    [itens]
  )

  return (
    <CartContext.Provider
      value={{ itens, total, qtdTotal, adicionar, adicionarItem, alterarQtd, limpar }}
    >
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart deve ser usado dentro de CartProvider')
  return ctx
}

