import { useEffect, useState } from 'react'

const CHAVE = 'cardapio-admin-tema'

// Tema do painel admin (claro/escuro), salvo por dispositivo.
// O cardápio público não é afetado: o atributo é removido ao sair do admin.
export function useTemaAdmin() {
  const [tema, setTema] = useState(() =>
    localStorage.getItem(CHAVE) === 'escuro' ? 'escuro' : 'claro'
  )

  useEffect(() => {
    if (tema === 'escuro') {
      document.documentElement.setAttribute('data-tema-admin', 'escuro')
    } else {
      document.documentElement.removeAttribute('data-tema-admin')
    }
    return () => document.documentElement.removeAttribute('data-tema-admin')
  }, [tema])

  function alterarTema(novoTema) {
    localStorage.setItem(CHAVE, novoTema)
    setTema(novoTema)
  }

  return { tema, alterarTema }
}
