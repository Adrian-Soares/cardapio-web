import { useEffect, useState } from 'react'
import { Link, useOutletContext } from 'react-router-dom'
import { supabase } from '../../lib/supabase.js'
import { montarLinkCardapio } from '../../lib/format.js'

export default function DashboardPage() {
  const { pizzaria } = useOutletContext()
  const [contagens, setContagens] = useState({ produtos: null, categorias: null })
  const [copiado, setCopiado] = useState(false)

  const linkCardapio = montarLinkCardapio(pizzaria.slug)

  async function copiarLink() {
    try {
      await navigator.clipboard.writeText(linkCardapio)
    } catch {
      // Fallback para navegadores/contextos sem a API de clipboard
      const campo = document.createElement('textarea')
      campo.value = linkCardapio
      campo.style.position = 'fixed'
      campo.style.opacity = '0'
      document.body.appendChild(campo)
      campo.select()
      document.execCommand('copy')
      document.body.removeChild(campo)
    }
    setCopiado(true)
    setTimeout(() => setCopiado(false), 2000)
  }

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
          href={linkCardapio}
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
        <div className="dashboard-link-area">
          <code className="dashboard-link">{linkCardapio}</code>
          <button
            type="button"
            className={`btn btn-primario btn-copiar${copiado ? ' btn-copiar--ok' : ''}`}
            onClick={copiarLink}
          >
            {copiado ? '✓ Copiado!' : 'Copiar link'}
          </button>
        </div>
      </section>
    </>
  )
}
