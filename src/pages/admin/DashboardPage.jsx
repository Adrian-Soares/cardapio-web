import { useEffect, useState } from 'react'
import { Link, useOutletContext } from 'react-router-dom'
import { supabase } from '../../lib/supabase.js'

export default function DashboardPage() {
  const { pizzaria } = useOutletContext()
  const [contagens, setContagens] = useState({ produtos: null, categorias: null })

  useEffect(() => {
    async function carregar() {
      const [prods, cats] = await Promise.all([
        supabase
          .from('produtos')
          .select('id', { count: 'exact', head: true })
          .eq('pizzaria_id', pizzaria.id),
        supabase
          .from('categorias')
          .select('id', { count: 'exact', head: true })
          .eq('pizzaria_id', pizzaria.id),
      ])
      setContagens({ produtos: prods.count ?? 0, categorias: cats.count ?? 0 })
    }
    carregar()
  }, [pizzaria.id])

  return (
    <>
      <header className="pagina-cabecalho">
        <h1>Início</h1>
        <p>Visão geral do seu cardápio</p>
      </header>

      <div className="dashboard-cards">
        <Link to="/admin/produtos" className="dashboard-card">
          <span className="dashboard-card-numero">{contagens.produtos ?? '—'}</span>
          <span>Produtos</span>
        </Link>
        <Link to="/admin/categorias" className="dashboard-card">
          <span className="dashboard-card-numero">{contagens.categorias ?? '—'}</span>
          <span>Categorias</span>
        </Link>
        <a
          href={`/${pizzaria.slug}`}
          target="_blank"
          rel="noreferrer"
          className="dashboard-card dashboard-card--acao"
        >
          <span className="dashboard-card-numero">↗</span>
          <span>Ver cardápio publicado</span>
        </a>
      </div>

      <section className="dashboard-dica">
        <h2>Link do seu cardápio</h2>
        <p>Compartilhe com seus clientes ou coloque na bio do Instagram:</p>
        <code className="dashboard-link">
          {window.location.origin}/{pizzaria.slug}
        </code>
      </section>
    </>
  )
}
