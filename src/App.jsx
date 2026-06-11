import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext.jsx'
import CardapioPage from './pages/CardapioPage.jsx'
import HomePage from './pages/HomePage.jsx'
import LoginPage from './pages/admin/LoginPage.jsx'
import AdminLayout from './pages/admin/AdminLayout.jsx'
import DashboardPage from './pages/admin/DashboardPage.jsx'
import ProdutosPage from './pages/admin/ProdutosPage.jsx'
import CategoriasPage from './pages/admin/CategoriasPage.jsx'
import ConfiguracoesPage from './pages/admin/ConfiguracoesPage.jsx'

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/admin/login" element={<LoginPage />} />
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<DashboardPage />} />
            <Route path="produtos" element={<ProdutosPage />} />
            <Route path="categorias" element={<CategoriasPage />} />
            <Route path="configuracoes" element={<ConfiguracoesPage />} />
          </Route>
          <Route path="/:slug" element={<CardapioPage />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
