import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase.js'
import { CartProvider } from '../context/CartContext.jsx'
import ProdutoCard from '../components/ProdutoCard.jsx'
import CartBar from '../components/CartBar.jsx'
import CartDrawer from '../components/CartDrawer.jsx'

function normalizar(texto) {
  return (texto ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
}

export default function CardapioPage() {
  const { slug } = useParams()
  const [pizzaria, setPizzaria] = useState(null)
  const [categorias, setCategorias] = useState([])
  const [produtos, setProdutos] = useState([])
  const [status, setStatus] = useState('carregando') // carregando | ok | nao-encontrada | erro
  const [drawerAberto, setDrawerAberto] = useState(false)
  const [busca, setBusca] = useState('')

  useEffect(() => {
    async function carregar() {
      setStatus('carregando')

      const { data: piz, error: errPiz } = await supabase
        .from('pizzarias')
        .select('*')
        .eq('slug', slug)
        .maybeSingle()

      if (errPiz) {
        console.error(errPiz)
        setStatus('erro')
        return
      }
      if (!piz) {
        setStatus('nao-encontrada')
        return
      }

      const [{ data: cats, error: errCat }, { data: prods, error: errProd }] =
        await Promise.all([
          supabase
            .from('categorias')
            .select('*')
            .eq('pizzaria_id', piz.id)
            .order('ordem', { ascending: true }),
          supabase
            .from('produtos')
            .select('*, tamanhos_produto(*)')
            .eq('pizzaria_id', piz.id)
            .eq('ativo', true),
        ])

      if (errCat || errProd) {
        console.error(errCat ?? errProd)
        setStatus('erro')
        return
      }

      setPizzaria(piz)
      setCategorias(cats ?? [])
      setProdutos(prods ?? [])
      setStatus('ok')
    }

    carregar()
  }, [slug])

  useEffect(() => {
    if (pizzaria) document.title = `${pizzaria.nome} — Cardápio`
  }, [pizzaria])

  if (status === 'carregando') {
    return <main className="estado-pagina">Carregando cardápio…</main>
  }
  if (status === 'nao-encontrada') {
    return <main className="estado-pagina">Pizzaria não encontrada. Confira o link.</main>
  }
  if (status === 'erro') {
    return (
      <main className="estado-pagina">
        Não foi possível carregar o cardápio. Tente novamente em instantes.
      </main>
    )
  }

  const termo = normalizar(busca.trim())
  const produtosVisiveis = termo
    ? produtos.filter((p) => normalizar(`${p.nome} ${p.descricao ?? ''}`).includes(termo))
    : produtos

  const categoriasComProdutos = categorias
    .map((cat) => ({
      ...cat,
      produtos: produtosVisiveis.filter((p) => p.categoria_id === cat.id),
    }))
    .filter((cat) => cat.produtos.length > 0)

  return (
    <CartProvider>
      <header className="cabecalho">
        {pizzaria.logo_url && (
          <img className="cabecalho-logo" src={pizzaria.logo_url} alt={pizzaria.nome} />
        )}
        <h1>{pizzaria.nome}</h1>
        <p>Monte seu pedido e envie direto pelo WhatsApp</p>
      </header>

      <div className="busca-area">
        <div className="busca-campo">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            aria-hidden="true"
          >
            <circle cx="11" cy="11" r="7" />
            <line x1="16.5" y1="16.5" x2="21" y2="21" />
          </svg>
          <input
            type="text"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar pizza, bebida..."
            aria-label="Buscar no cardápio"
          />
          {busca && (
            <button
              type="button"
              className="busca-limpar"
              onClick={() => setBusca('')}
              aria-label="Limpar busca"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      <main className={termo ? 'cardapio cardapio--buscando' : 'cardapio'}>
        {categoriasComProdutos.length === 0 &&
          (termo ? (
            <div className="busca-vazia">
              <p>
                Nada encontrado para <strong>“{busca.trim()}”</strong>.
              </p>
              <button type="button" className="busca-vazia-btn" onClick={() => setBusca('')}>
                Limpar busca
              </button>
            </div>
          ) : (
            <p className="estado-pagina">Nenhum produto disponível no momento.</p>
          ))}

        {categoriasComProdutos.map((cat) => (
          <section key={cat.id} className="categoria">
            <h2>{cat.nome}</h2>
            <div className="categoria-produtos">
              {cat.produtos.map((produto) => (
                <ProdutoCard key={produto.id} produto={produto} />
              ))}
            </div>
          </section>
        ))}
      </main>

      <CartBar onAbrir={() => setDrawerAberto(true)} />
      <CartDrawer
        aberto={drawerAberto}
        onFechar={() => setDrawerAberto(false)}
        pizzaria={pizzaria}
      />
    </CartProvider>
  )
}
