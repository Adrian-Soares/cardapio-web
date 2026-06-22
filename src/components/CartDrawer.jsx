import { useState } from 'react'
import { useCart } from '../context/CartContext.jsx'
import { formatPreco, montarMensagemWhatsApp, montarLinkWhatsApp } from '../lib/format.js'

// Título exibido no carrinho para um item.
function tituloItem(item) {
  if (item.tipo !== 'meio') return item.produtoNome
  const nSabores = item.metades.length
  return nSabores > 1
    ? `Meio a meio (${item.tamanhoNome})`
    : `${item.metades[0]} (${item.tamanhoNome})`
}

// Linha secundária: sabores (quando mais de um), borda e preço.
function detalheItem(item) {
  const partes = []
  if (item.tipo === 'meio') {
    if (item.metades.length > 1) partes.push(item.metades.join(' / '))
    if (item.borda) partes.push(`Borda ${item.borda}`)
  } else {
    partes.push(item.tamanhoNome)
  }
  partes.push(formatPreco(item.preco))
  return partes.join(' · ')
}

export default function CartDrawer({ aberto, onFechar, pizzaria, fechado = false }) {
  const { itens, total: subtotal, alterarQtd, limpar } = useCart()
  const [nome, setNome] = useState('')
  const [endereco, setEndereco] = useState('')
  const [pagamento, setPagamento] = useState('pix')
  const [precisaTroco, setPrecisaTroco] = useState(false)
  const [trocoPara, setTrocoPara] = useState('')
  const [erroTroco, setErroTroco] = useState(null)

  if (!aberto) return null

  const taxa = Number(pizzaria.taxa_entrega) || 0
  const minimo = Number(pizzaria.pedido_minimo) || 0
  const totalFinal = subtotal + taxa
  const abaixoDoMinimo = minimo > 0 && subtotal < minimo
  const faltaParaMinimo = minimo - subtotal

  function enviarPedido(e) {
    e.preventDefault()
    if (itens.length === 0 || abaixoDoMinimo) return

    let trocoValor = null
    if (pagamento === 'dinheiro' && precisaTroco) {
      trocoValor = Number(trocoPara.replace(/[^\d,.]/g, '').replace(',', '.'))
      if (Number.isNaN(trocoValor) || trocoValor <= totalFinal) {
        setErroTroco(`Informe um valor maior que o total do pedido (${formatPreco(totalFinal)}).`)
        return
      }
    }
    setErroTroco(null)

    const mensagem = montarMensagemWhatsApp({
      pizzaria,
      itens,
      subtotal,
      taxa,
      total: totalFinal,
      cliente: { nome: nome.trim(), endereco: endereco.trim(), pagamento, trocoPara: trocoValor },
    })

    window.open(montarLinkWhatsApp(pizzaria.whatsapp, mensagem), '_blank')
    limpar()
    onFechar()
  }

  return (
    <div className="drawer-overlay" onClick={onFechar}>
      <div
        className="drawer"
        role="dialog"
        aria-label="Seu pedido"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="drawer-cabecalho">
          <h2>Seu pedido</h2>
          <button type="button" className="drawer-fechar" onClick={onFechar} aria-label="Fechar">
            ✕
          </button>
        </div>

        {itens.length === 0 ? (
          <p className="drawer-vazio">Seu carrinho está vazio.</p>
        ) : (
          <>
            <ul className="drawer-itens">
              {itens.map((item) => (
                <li key={item.key} className="drawer-item">
                  <div className="drawer-item-info">
                    <strong>{tituloItem(item)}</strong>
                    <span className="drawer-item-detalhe">{detalheItem(item)}</span>
                    {item.observacao && (
                      <span className="drawer-item-obs">Obs: {item.observacao}</span>
                    )}
                  </div>
                  <div className="drawer-item-qtd">
                    <button type="button" onClick={() => alterarQtd(item.key, -1)} aria-label="Diminuir">
                      −
                    </button>
                    <span>{item.qtd}</span>
                    <button type="button" onClick={() => alterarQtd(item.key, 1)} aria-label="Aumentar">
                      +
                    </button>
                  </div>
                </li>
              ))}
            </ul>

            {taxa > 0 && (
              <div className="drawer-valores">
                <div className="drawer-linha-valor">
                  <span>Subtotal</span>
                  <span>{formatPreco(subtotal)}</span>
                </div>
                <div className="drawer-linha-valor">
                  <span>Taxa de entrega</span>
                  <span>{formatPreco(taxa)}</span>
                </div>
              </div>
            )}

            <div className="drawer-total">
              <span>Total</span>
              <strong>{formatPreco(totalFinal)}</strong>
            </div>

            <form className="drawer-form" onSubmit={enviarPedido}>
              <label>
                Seu nome
                <input
                  type="text"
                  required
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  placeholder="Ex.: Maria Silva"
                />
              </label>

              <label>
                Endereço de entrega
                <input
                  type="text"
                  required
                  value={endereco}
                  onChange={(e) => setEndereco(e.target.value)}
                  placeholder="Rua, número, bairro, complemento"
                />
              </label>

              <fieldset className="drawer-pagamento">
                <legend>Forma de pagamento</legend>
                {[
                  ['pix', 'Pix'],
                  ['dinheiro', 'Dinheiro'],
                  ['cartao', 'Cartão'],
                ].map(([valor, label]) => (
                  <label key={valor} className="pagamento-opcao">
                    <input
                      type="radio"
                      name="pagamento"
                      value={valor}
                      checked={pagamento === valor}
                      onChange={() => setPagamento(valor)}
                    />
                    {label}
                  </label>
                ))}
              </fieldset>

              {pagamento === 'dinheiro' && (
                <fieldset className="drawer-pagamento campo-troco">
                  <legend>Vai precisar de troco?</legend>
                  <label className="pagamento-opcao">
                    <input
                      type="radio"
                      name="troco"
                      checked={!precisaTroco}
                      onChange={() => {
                        setPrecisaTroco(false)
                        setErroTroco(null)
                      }}
                    />
                    Não
                  </label>
                  <label className="pagamento-opcao">
                    <input
                      type="radio"
                      name="troco"
                      checked={precisaTroco}
                      onChange={() => setPrecisaTroco(true)}
                    />
                    Sim
                  </label>
                </fieldset>
              )}

              {pagamento === 'dinheiro' && precisaTroco && (
                <label className="campo-troco-valor">
                  Troco para quanto?
                  <input
                    type="text"
                    inputMode="decimal"
                    required
                    value={trocoPara}
                    onChange={(e) => {
                      setTrocoPara(e.target.value)
                      setErroTroco(null)
                    }}
                    placeholder={`Ex.: 100 (o pedido deu ${formatPreco(totalFinal)})`}
                  />
                  {erroTroco && <small className="troco-erro">{erroTroco}</small>}
                </label>
              )}

              {fechado && (
                <p className="drawer-aviso-fechado" role="status">
                  O estabelecimento está <strong>fechado agora</strong>. Você pode enviar o pedido
                  mesmo assim, mas ele pode não ser preparado de imediato.
                </p>
              )}

              {abaixoDoMinimo && (
                <p className="drawer-aviso-minimo" role="status">
                  Pedido mínimo de <strong>{formatPreco(minimo)}</strong>. Faltam{' '}
                  <strong>{formatPreco(faltaParaMinimo)}</strong> para fechar o pedido.
                </p>
              )}

              <button type="submit" className="btn-whatsapp" disabled={abaixoDoMinimo}>
                {abaixoDoMinimo
                  ? `Falta ${formatPreco(faltaParaMinimo)} para o mínimo`
                  : 'Enviar pedido pelo WhatsApp'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  )
}
