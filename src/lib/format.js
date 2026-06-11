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

export function montarMensagemWhatsApp({ pizzaria, itens, total, cliente }) {
  const linhas = []

  linhas.push(`*🍕 Novo pedido — ${pizzaria.nome}*`)
  linhas.push('')
  linhas.push('*Itens:*')

  for (const item of itens) {
    linhas.push(
      `${item.qtd}x ${item.produtoNome} (${item.tamanhoNome}) — ${formatPreco(item.preco * item.qtd)}`
    )
  }

  linhas.push('')
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
