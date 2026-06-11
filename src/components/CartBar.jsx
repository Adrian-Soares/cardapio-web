import { useCart } from '../context/CartContext.jsx'
import { formatPreco } from '../lib/format.js'

export default function CartBar({ onAbrir }) {
  const { qtdTotal, total } = useCart()

  if (qtdTotal === 0) return null

  return (
    <div className="cart-bar">
      <button type="button" className="cart-bar-btn" onClick={onAbrir}>
        <span className="cart-bar-qtd">{qtdTotal}</span>
        <span>Ver pedido</span>
        <span className="cart-bar-total">{formatPreco(total)}</span>
      </button>
    </div>
  )
}
