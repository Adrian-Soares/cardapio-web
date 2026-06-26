import { useEffect, useState } from 'react'
import { Navigate, NavLink, Outlet, useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase.js'
import { useAuth } from '../../context/AuthContext.jsx'
import { useTemaAdmin } from '../../hooks/useTemaAdmin.js'
import { montarLinkCardapio } from '../../lib/format.js'
import OnboardingPizzaria from './OnboardingPizzaria.jsx'
import '../../styles/admin.css'

const svgProps = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': true,
}

const IcInicio = () => (
  <svg {...svgProps}>
    <path d="M3 11.5 12 4l9 7.5" />
    <path d="M5.5 10v9.5h13V10" />
  </svg>
)
const IcProdutos = () => (
  <svg {...svgProps}>
    <path d="M3.5 3.5h7l9.5 9.5a2 2 0 0 1 0 2.8l-4.2 4.2a2 2 0 0 1-2.8 0L3.5 10.5z" />
    <circle cx="7.6" cy="7.6" r="1.3" />
  </svg>
)
const IcCategorias = () => (
  <svg {...svgProps}>
    <path d="M12 3 3 8l9 5 9-5-9-5z" />
    <path d="M3 13l9 5 9-5" />
  </svg>
)
const IcBordas = () => (
  <svg {...svgProps}>
    <circle cx="12" cy="12" r="8.5" />
    <circle cx="12" cy="12" r="3.2" />
  </svg>
)
const IcConfig = () => (
  <svg {...svgProps}>
    <line x1="4" y1="8" x2="20" y2="8" />
    <line x1="4" y1="16" x2="20" y2="16" />
    <circle cx="9" cy="8" r="2.2" />
    <circle cx="15" cy="16" r="2.2" />
  </svg>
)

const SECOES = [
  { to: '/admin', end: true, label: 'Início', curto: 'Início', Icone: IcInicio },
  { to: '/admin/produtos', label: 'Produtos', curto: 'Produtos', Icone: IcProdutos },
  { to: '/admin/categorias', label: 'Categorias', curto: 'Categorias', Icone: IcCategorias },
  { to: '/admin/bordas', label: 'Bordas', curto: 'Bordas', Icone: IcBordas },
  { to: '/admin/configuracoes', label: 'Configurações', curto: 'Config', Icone: IcConfig },
]

export default function AdminLayout() {
  const { session, carregando, sair } = useAuth()
  const { tema, alterarTema } = useTemaAdmin()
  const navigate = useNavigate()
  const [pizzaria, setPizzaria] = useState(null)
  const [carregandoPizzaria, setCarregandoPizzaria] = useState(true)
  const [erro, setErro] = useState(null)

  useEffect(() => {
    if (!session) return
    let ativo = true

    async function carregar() {
      setCarregandoPizzaria(true)
      const { data, error } = await supabase
        .from('pizzarias')
        .select('*')
        .eq('user_id', session.user.id)
        .maybeSingle()

      if (!ativo) return
      if (error) {
        console.error(error)
        setErro('Não foi possível carregar os dados do estabelecimento.')
      } else {
        setPizzaria(data)
      }
      setCarregandoPizzaria(false)
    }

    carregar()
    return () => {
      ativo = false
    }
  }, [session])

  if (carregando) return <main className="estado-pagina">Carregando…</main>
  if (!session) return <Navigate to="/admin/login" replace />
  if (carregandoPizzaria) return <main className="estado-pagina">Carregando…</main>
  if (erro) return <main className="estado-pagina">{erro}</main>

  if (!pizzaria) {
    return <OnboardingPizzaria userId={session.user.id} onCriada={setPizzaria} />
  }

  async function handleSair() {
    await sair()
    navigate('/admin/login', { replace: true })
  }

  const Marca = (
    <>
      {pizzaria.logo_url ? (
        <img src={pizzaria.logo_url} alt="" className="admin-nav-logo" />
      ) : (
        <span className="admin-nav-logo admin-nav-logo--vazio">🍽️</span>
      )}
      <strong>{pizzaria.nome}</strong>
    </>
  )

  return (
    <div className="admin">
      {/* Desktop: barra lateral */}
      <aside className="admin-nav">
        <div className="admin-nav-marca">{Marca}</div>

        <nav>
          {SECOES.map((s) => (
            <NavLink key={s.to} to={s.to} end={s.end}>
              <s.Icone />
              {s.label}
            </NavLink>
          ))}
        </nav>

        <div className="admin-nav-rodape">
          <a
            href={montarLinkCardapio(pizzaria.slug)}
            target="_blank"
            rel="noreferrer"
            className="link-cardapio"
          >
            Ver cardápio ↗
          </a>
          <button type="button" className="btn btn-sair" onClick={handleSair}>
            Sair
          </button>
        </div>
      </aside>

      {/* Mobile: topo enxuto */}
      <header className="admin-topbar">
        <div className="admin-topbar-marca">{Marca}</div>
        <div className="admin-topbar-acoes">
          <a
            href={montarLinkCardapio(pizzaria.slug)}
            target="_blank"
            rel="noreferrer"
            aria-label="Ver cardápio"
          >
            <svg {...svgProps}>
              <path d="M14 4h6v6" />
              <path d="M20 4 11 13" />
              <path d="M19 13.5V19a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h5.5" />
            </svg>
          </a>
          <button type="button" onClick={handleSair} aria-label="Sair">
            <svg {...svgProps}>
              <path d="M15 4h3a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1h-3" />
              <path d="M10 16l-4-4 4-4" />
              <line x1="6" y1="12" x2="16" y2="12" />
            </svg>
          </button>
        </div>
      </header>

      <main className="admin-conteudo">
        <Outlet context={{ pizzaria, setPizzaria, tema, alterarTema }} />
      </main>

      {/* Mobile: barra inferior */}
      <nav className="admin-tabbar" aria-label="Seções do painel">
        {SECOES.map((s) => (
          <NavLink key={s.to} to={s.to} end={s.end} className="admin-tab">
            <s.Icone />
            <span>{s.curto}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
