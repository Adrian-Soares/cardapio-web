export function formatPreco(valor) {
  return Number(valor).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  })
}

const PAGAMENTO_LABELS = {
  pix: 'Pix',
  dinheiro: 'Dinheiro',
  cartao: 'Cartão',
}

export function montarMensagemWhatsApp({ pizzaria, itens, subtotal, taxa = 0, total, cliente }) {
  const linhas = []

  linhas.push(`*🧾 Novo pedido — ${pizzaria.nome}*`)
  linhas.push('')
  linhas.push('*Itens:*')

  for (const item of itens) {
    const valor = formatPreco(item.preco * item.qtd)
    if (item.tipo === 'meio') {
      const nSabores = item.metades.length
      const titulo =
        nSabores > 1
          ? `${nSabores} sabores (${item.tamanhoNome})`
          : `${item.metades[0]} (${item.tamanhoNome})`
      linhas.push(`${item.qtd}x ${titulo} — ${valor}`)
      if (nSabores > 1) linhas.push(`   ↳ ${item.metades.join(' / ')}`)
      if (item.borda) linhas.push(`   ↳ Borda: ${item.borda}`)
    } else {
      linhas.push(`${item.qtd}x ${item.produtoNome} (${item.tamanhoNome}) — ${valor}`)
    }
    if (item.observacao) linhas.push(`   ↳ Obs: ${item.observacao}`)
  }

  linhas.push('')
  if (taxa > 0) {
    linhas.push(`Subtotal: ${formatPreco(subtotal)}`)
    linhas.push(`Taxa de entrega: ${formatPreco(taxa)}`)
  }
  linhas.push(`*Total: ${formatPreco(total)}*`)
  linhas.push('')
  linhas.push(`*Cliente:* ${cliente.nome}`)
  linhas.push(`*Endereço:* ${cliente.endereco}`)

  const labelPagamento = PAGAMENTO_LABELS[cliente.pagamento] ?? cliente.pagamento
  if (cliente.pagamento === 'dinheiro') {
    if (cliente.trocoPara) {
      linhas.push(`*Pagamento:* ${labelPagamento}`)
      linhas.push(
        `*Troco para:* ${formatPreco(cliente.trocoPara)} (separar ${formatPreco(cliente.trocoPara - total)})`
      )
    } else {
      linhas.push(`*Pagamento:* ${labelPagamento} (sem troco)`)
    }
  } else {
    linhas.push(`*Pagamento:* ${labelPagamento}`)
  }

  return linhas.join('\n')
}

export function montarLinkWhatsApp(numero, mensagem) {
  const numeroLimpo = numero.replace(/\D/g, '')
  return `https://wa.me/${numeroLimpo}?text=${encodeURIComponent(mensagem)}`
}

// URL pública do cardápio, já com o caminho base da app (ex.: /cardapio-web/).
export function montarLinkCardapio(slug) {
  return `${window.location.origin}${import.meta.env.BASE_URL}${slug}`
}
