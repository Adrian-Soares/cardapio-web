import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase.js'
import { CartProvider } from '../context/CartContext.jsx'
import ProdutoCard from '../components/ProdutoCard.jsx'
import CartBar from '../components/CartBar.jsx'
import CartDrawer from '../components/CartDrawer.jsx'
import { statusAbertura, agruparHorarios } from '../lib/horarios.js'
import { formatPreco } from '../lib/format.js'

function normalizar(texto) {
  return (texto ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
}

// Ícone do chip de categoria, inferido pelo nome.
function CategoriaIcone({ nome }) {
  const n = normalizar(nome)
  const props = {
    className: 'filtro-icone',
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.7,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    'aria-hidden': true,
  }

  if (/bebida|refri|suco|drink|agua|cerveja|coca|guaran/.test(n)) {
    return (
      <svg {...props}>
        <path d="M6.6 7.6h10.8l-1.1 11.2a1.6 1.6 0 0 1-1.6 1.45H9.3a1.6 1.6 0 0 1-1.6-1.45L6.6 7.6Z" />
        <path d="M5.5 7.6h13" />
        <path d="M13.3 3.5 15.5 7.6" />
        <path d="M9.3 12h5.4" />
      </svg>
    )
  }
  if (/pizza/.test(n)) {
    return (
      <svg {...props}>
        <path d="M12 20.5 4.7 6.9c4.5-2.2 10.1-2.2 14.6 0L12 20.5Z" />
        <path d="M6.7 8.4c3.3-1.4 7.3-1.4 10.6 0" />
        <circle cx="9.9" cy="11" r="1.05" fill="currentColor" stroke="none" />
        <circle cx="13.9" cy="11.3" r="1.05" fill="currentColor" stroke="none" />
        <circle cx="11.9" cy="14.8" r="1.05" fill="currentColor" stroke="none" />
      </svg>
    )
  }
  return (
    <svg {...props}>
      <path d="M6.3 3v4a2 2 0 0 0 4 0V3" />
      <path d="M8.3 9.4V21" />
      <path d="M16.8 3c-1.7 0-3 2.6-3 5.8 0 2.2 1.1 3.7 2.3 4.1V21" />
    </svg>
  )
}

export default function CardapioPage() {
  const { slug } = useParams()
  const [pizzaria, setPizzaria] = useState(null)
  const [categorias, setCategorias] = useState([])
  const [produtos, setProdutos] = useState([])
  const [bordas, setBordas] = useState([])
  const [status, setStatus] = useState('carregando') // carregando | ok | nao-encontrada | erro
  const [drawerAberto, setDrawerAberto] = useState(false)
  const [busca, setBusca] = useState('')
  const [horariosAberto, setHorariosAberto] = useState(false)
  const [categoriaAtiva, setCategoriaAtiva] = useState('todas')

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

      // Bordas são opcionais: se a tabela ainda não existe (migração não rodada),
      // o cardápio segue normalmente sem borda.
      const { data: brd } = await supabase
        .from('bordas')
        .select('*')
        .eq('pizzaria_id', piz.id)
        .eq('ativo', true)
        .order('ordem', { ascending: true })

      setPizzaria(piz)
      setCategorias(cats ?? [])
      setProdutos(prods ?? [])
      setBordas(brd ?? [])
      setStatus('ok')
    }

    carregar()
  }, [slug])

  useEffect(() => {
    if (pizzaria) document.title = `${pizzaria.nome} — Cardápio`
  }, [pizzaria])

  // Esconde a barra de rolagem só no cardápio público (o admin mantém a sua).
  useEffect(() => {
    document.documentElement.classList.add('sem-scrollbar')
    return () => document.documentElement.classList.remove('sem-scrollbar')
  }, [])

  if (status === 'carregando') {
    return <main className="estado-pagina">Carregando cardápio…</main>
  }
  if (status === 'nao-encontrada') {
    return <main className="estado-pagina">Estabelecimento não encontrado. Confira o link.</main>
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

  // Categorias que têm ao menos um produto (para os botões de filtro)
  const categoriasComItens = categorias.filter((cat) =>
    produtos.some((p) => p.categoria_id === cat.id)
  )

  // Sabores que aceitam meio a meio (junta todas as categorias com permite_meio)
  const idsCategoriaMeio = new Set(categorias.filter((c) => c.permite_meio).map((c) => c.id))
  const produtosMeio = produtos.filter((p) => idsCategoriaMeio.has(p.categoria_id))

  const categoriasComProdutos = categorias
    .filter((cat) => categoriaAtiva === 'todas' || cat.id === categoriaAtiva)
    .map((cat) => ({
      ...cat,
      produtos: produtosVisiveis.filter((p) => p.categoria_id === cat.id),
    }))
    .filter((cat) => cat.produtos.length > 0)

  const statusHorario = statusAbertura(pizzaria.horarios)
  const estaFechado = statusHorario.configurado && !statusHorario.aberto
  const gruposHorario = agruparHorarios(pizzaria.horarios)
  const pedidoMinimo = Number(pizzaria.pedido_minimo) || 0
  const temInfoEstab = Boolean(pizzaria.cidade) || pedidoMinimo > 0 || statusHorario.configurado

  return (
    <CartProvider>
      <header
        className="cabecalho"
        style={pizzaria.banner_url ? { '--banner': `url("${pizzaria.banner_url}")` } : undefined}
      >
        {pizzaria.logo_url && (
          <img className="cabecalho-logo" src={pizzaria.logo_url} alt={pizzaria.nome} />
        )}
        <h1>{pizzaria.nome}</h1>
        <p>Monte seu pedido e envie direto pelo WhatsApp</p>
      </header>

      {temInfoEstab && (
        <section className="info-estab">
          <div className="info-estab-meta">
            {pizzaria.cidade && (
              <span className="info-item">
                <svg
                  className="info-icone"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M12 21s7-5.6 7-11a7 7 0 0 0-14 0c0 5.4 7 11 7 11Z" />
                  <circle cx="12" cy="10" r="2.5" />
                </svg>
                {pizzaria.cidade}
              </span>
            )}
            {pedidoMinimo > 0 && (
              <span className="info-item">
                <svg
                  className="info-icone"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M3.5 12 12 3.5h7a1.5 1.5 0 0 1 1.5 1.5v7L12 20.5Z" />
                  <circle cx="16" cy="8" r="1.3" />
                </svg>
                Pedido mínimo {formatPreco(pedidoMinimo)}
              </span>
            )}
          </div>

          {statusHorario.configurado && (
            <button
              type="button"
              className="status-toggle"
              onClick={() => setHorariosAberto((v) => !v)}
              aria-expanded={horariosAberto}
            >
              <span
                className={`status-ponto ${statusHorario.aberto ? 'status-ponto--aberto' : 'status-ponto--fechado'}`}
                aria-hidden="true"
              />
              <span
                className={`status-palavra ${statusHorario.aberto ? 'status-palavra--aberto' : 'status-palavra--fechado'}`}
              >
                {statusHorario.aberto ? 'Aberto' : 'Fechado'}
              </span>
              <span className="status-acao">{horariosAberto ? 'fechar' : 'ver horários'}</span>
              <svg
                className={`status-chevron ${horariosAberto ? 'status-chevron--aberto' : ''}`}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.4"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>
          )}
        </section>
      )}

      {statusHorario.configurado && (
        <div className={`horarios-painel ${horariosAberto ? 'horarios-painel--aberto' : ''}`}>
          <div className="horarios-painel-interno">
            <div className="horarios-painel-conteudo">
              <h3 className="horarios-painel-titulo">Horários de funcionamento</h3>
              {gruposHorario.map((g, i) => (
                <div key={i} className="horarios-linha">
                  <span className="horarios-dias">{g.dias}</span>
                  <span className={`horarios-valor ${g.fechado ? 'horarios-valor--fechado' : ''}`}>
                    {g.valor}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="barra-acoes">
        <div className="busca-barra">
          <svg
            className="busca-barra-lupa"
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
            className="busca-barra-input"
            value={busca}
            onChange={(e) => {
              setBusca(e.target.value)
              setCategoriaAtiva('todas')
            }}
            placeholder="Pesquisar..."
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

        {categoriasComItens.length > 0 && (
          <>
            <div className="categorias-cabecalho">
              <h2 className="categorias-titulo">Categorias</h2>
              <button
                type="button"
                className="ver-todas"
                onClick={() => setCategoriaAtiva('todas')}
              >
                Ver todas
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <polyline points="9 6 15 12 9 18" />
                </svg>
              </button>
            </div>
            <div className="filtros-categoria">
              {categoriasComItens.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  className={`filtro ${categoriaAtiva === cat.id ? 'filtro--ativo' : ''}`}
                  onClick={() => setCategoriaAtiva(cat.id)}
                >
                  <CategoriaIcone nome={cat.nome} />
                  {cat.nome}
                </button>
              ))}
            </div>
          </>
        )}
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
                <ProdutoCard
                  key={produto.id}
                  produto={produto}
                  ehPizza={/pizza/.test(normalizar(cat.nome))}
                  permiteMeio={!!cat.permite_meio}
                  saboresMeio={produtosMeio}
                  bordas={bordas}
                  meioPreco={pizzaria.meio_preco ?? 'maior'}
                />
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
        fechado={estaFechado}
      />
    </CartProvider>
  )
}
