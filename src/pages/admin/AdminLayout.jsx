import { useEffect, useState } from 'react'
import { Navigate, NavLink, Outlet, useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase.js'
import { useAuth } from '../../context/AuthContext.jsx'
import { useTemaAdmin } from '../../hooks/useTemaAdmin.js'
import OnboardingPizzaria from './OnboardingPizzaria.jsx'
import '../../styles/admin.css'

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
        setErro('Não foi possível carregar os dados da pizzaria.')
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

  return (
    <div className="admin">
      <aside className="admin-nav">
        <div className="admin-nav-marca">
          {pizzaria.logo_url ? (
            <img src={pizzaria.logo_url} alt="" className="admin-nav-logo" />
          ) : (
            <span className="admin-nav-logo admin-nav-logo--vazio">🍕</span>
          )}
          <strong>{pizzaria.nome}</strong>
        </div>

        <nav>
          <NavLink to="/admin" end>
            Início
          </NavLink>
          <NavLink to="/admin/produtos">Produtos</NavLink>
          <NavLink to="/admin/categorias">Categorias</NavLink>
          <NavLink to="/admin/configuracoes">Configurações</NavLink>
        </nav>

        <div className="admin-nav-rodape">
          <a href={`/${pizzaria.slug}`} target="_blank" rel="noreferrer" className="link-cardapio">
            Ver cardápio ↗
          </a>
          <button type="button" className="btn btn-sair" onClick={handleSair}>
            Sair
          </button>
        </div>
      </aside>

      <main className="admin-conteudo">
        <Outlet context={{ pizzaria, setPizzaria, tema, alterarTema }} />
      </main>
    </div>
  )
}
