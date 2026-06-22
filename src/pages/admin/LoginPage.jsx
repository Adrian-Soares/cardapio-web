import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase.js'
import { useAuth } from '../../context/AuthContext.jsx'
import { useTemaAdmin } from '../../hooks/useTemaAdmin.js'
import '../../styles/admin.css'

function LogoMarca({ className }) {
  // Cloche (cúpula de restaurante): marca neutra, serve qualquer negócio de comida.
  return (
    <svg
      className={className}
      viewBox="0 0 32 32"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M4 24h24" />
      <path d="M6.5 24a9.5 9.5 0 0 1 19 0" />
      <path d="M16 9V6.2" />
      <circle cx="16" cy="5" r="1.3" fill="currentColor" stroke="none" />
    </svg>
  )
}

export default function LoginPage() {
  useTemaAdmin() // aplica o tema salvo também na tela de login
  const { session, carregando } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [mostrarSenha, setMostrarSenha] = useState(false)
  const [erro, setErro] = useState(null)
  const [enviando, setEnviando] = useState(false)

  if (carregando) return <main className="estado-pagina">Carregando…</main>
  if (session) return <Navigate to="/admin" replace />

  async function entrar(e) {
    e.preventDefault()
    setErro(null)
    setEnviando(true)

    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password: senha,
    })

    setEnviando(false)

    if (error) {
      setErro(
        error.message === 'Invalid login credentials'
          ? 'E-mail ou senha incorretos.'
          : 'Não foi possível entrar. Tente novamente.'
      )
      return
    }

    navigate('/admin', { replace: true })
  }

  return (
    <main className="login-split">
      <section className="login-form-lado">
        <form className="login-form" onSubmit={entrar}>
          <div className="login-marca">
            <span className="login-marca-badge">
              <LogoMarca className="login-marca-icone" />
            </span>
            <span className="login-marca-nome">Cardápio Digital</span>
          </div>

          <div className="login-titulo">
            <h1>Bem-vindo de volta</h1>
            <p>Entre para gerenciar seu cardápio</p>
          </div>

          <label className="login-campo">
            E-mail
            <input
              type="email"
              required
              autoFocus
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="voce@exemplo.com"
            />
          </label>

          <label className="login-campo">
            Senha
            <div className="login-senha">
              <input
                type={mostrarSenha ? 'text' : 'password'}
                required
                autoComplete="current-password"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                placeholder="••••••••"
              />
              <button
                type="button"
                className="login-olho"
                onClick={() => setMostrarSenha((v) => !v)}
                aria-label={mostrarSenha ? 'Ocultar senha' : 'Mostrar senha'}
                aria-pressed={mostrarSenha}
              >
                {mostrarSenha ? (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M3 3l18 18" />
                    <path d="M10.6 10.6a2 2 0 0 0 2.8 2.8" />
                    <path d="M9.4 5.2A9.7 9.7 0 0 1 12 5c5 0 9 4.5 9 7a12.3 12.3 0 0 1-2.2 3" />
                    <path d="M6.2 6.2C3.9 7.6 2.3 9.7 2 12c.8 2.5 4 7 10 7a9.8 9.8 0 0 0 3.4-.6" />
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>
          </label>

          {erro && <p className="form-erro">{erro}</p>}

          <button type="submit" className="btn btn-primario login-entrar" disabled={enviando}>
            {enviando ? 'Entrando…' : 'Entrar'}
          </button>

          <a
            className="login-esqueci"
            href="#recuperar"
            onClick={(e) => {
              e.preventDefault()
              setErro('Para redefinir a senha, fale com o suporte por enquanto.')
            }}
          >
            Esqueci minha senha
          </a>
        </form>
      </section>

      <aside className="login-marca-lado" aria-hidden="true">
        <div className="login-marca-overlay">
          <p className="login-marca-overline">Cardápio Digital</p>
          <p className="login-marca-frase">
            Tudo o que seu cliente quer pedir, num link só.
          </p>
        </div>
      </aside>
    </main>
  )
}
