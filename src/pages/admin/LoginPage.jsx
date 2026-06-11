import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase.js'
import { useAuth } from '../../context/AuthContext.jsx'
import { useTemaAdmin } from '../../hooks/useTemaAdmin.js'
import '../../styles/admin.css'

export default function LoginPage() {
  useTemaAdmin() // aplica o tema salvo também na tela de login
  const { session, carregando } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
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
    <main className="login-pagina">
      <form className="login-card" onSubmit={entrar}>
        <h1>🍕 Painel da Pizzaria</h1>
        <p className="login-subtitulo">Entre para gerenciar seu cardápio</p>

        <label>
          E-mail
          <input
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="voce@exemplo.com"
          />
        </label>

        <label>
          Senha
          <input
            type="password"
            required
            autoComplete="current-password"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            placeholder="••••••••"
          />
        </label>

        {erro && <p className="form-erro">{erro}</p>}

        <button type="submit" className="btn btn-primario" disabled={enviando}>
          {enviando ? 'Entrando…' : 'Entrar'}
        </button>
      </form>
    </main>
  )
}
