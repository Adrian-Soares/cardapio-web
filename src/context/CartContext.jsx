import { createContext, useContext, useMemo, useState } from 'react'

const CartContext = createContext(null)

export function CartProvider({ children }) {
  // item: { key, produtoId, produtoNome, tamanhoId, tamanhoNome, preco, qtd }
  const [itens, setItens] = useState([])

  function adicionar(produto, tamanho) {
    const key = `${produto.id}:${tamanho.id}`
    setItens((atual) => {
      const existente = atual.find((i) => i.key === key)
      if (existente) {
        return atual.map((i) => (i.key === key ? { ...i, qtd: i.qtd + 1 } : i))
      }
      return [
        ...atual,
        {
          key,
          produtoId: produto.id,
          produtoNome: produto.nome,
          tamanhoId: tamanho.id,
          tamanhoNome: tamanho.nome,
          preco: Number(tamanho.preco),
          qtd: 1,
        },
      ]
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
    <CartContext.Provider value={{ itens, total, qtdTotal, adicionar, alterarQtd, limpar }}>
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart deve ser usado dentro de CartProvider')
  return ctx
}
