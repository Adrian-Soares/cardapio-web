import { useState } from 'react'
import { useCart } from '../context/CartContext.jsx'
import { formatPreco, montarMensagemWhatsApp, montarLinkWhatsApp } from '../lib/format.js'

export default function CartDrawer({ aberto, onFechar, pizzaria }) {
  const { itens, total, alterarQtd, limpar } = useCart()
  const [nome, setNome] = useState('')
  const [endereco, setEndereco] = useState('')
  const [pagamento, setPagamento] = useState('pix')
  const [precisaTroco, setPrecisaTroco] = useState(false)
  const [trocoPara, setTrocoPara] = useState('')
  const [erroTroco, setErroTroco] = useState(null)

  if (!aberto) return null

  function enviarPedido(e) {
    e.preventDefault()
    if (itens.length === 0) return

    let trocoValor = null
    if (pagamento === 'dinheiro' && precisaTroco) {
      trocoValor = Number(trocoPara.replace(/[^\d,.]/g, '').replace(',', '.'))
      if (Number.isNaN(trocoValor) || trocoValor <= total) {
        setErroTroco(`Informe um valor maior que o total do pedido (${formatPreco(total)}).`)
        return
      }
    }
    setErroTroco(null)

    const mensagem = montarMensagemWhatsApp({
      pizzaria,
      itens,
      total,
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
                    <strong>{item.produtoNome}</strong>
                    <span className="drawer-item-detalhe">
                      {item.tamanhoNome} · {formatPreco(item.preco)}
                    </span>
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

            <div className="drawer-total">
              <span>Total</span>
              <strong>{formatPreco(total)}</strong>
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
                    placeholder={`Ex.: 100 (o pedido deu ${formatPreco(total)})`}
                  />
                  {erroTroco && <small className="troco-erro">{erroTroco}</small>}
                </label>
              )}

              <button type="submit" className="btn-whatsapp">
                Enviar pedido pelo WhatsApp
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  )
}
