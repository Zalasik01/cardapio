import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import RotaProtegida from './components/RotaProtegida'

import PaginaInicial from './pages/PaginaInicial'

import LayoutCliente from './pages/cliente/LayoutCliente'
import PaginaCardapio from './pages/cliente/PaginaCardapio'
import PaginaCarrinho from './pages/cliente/PaginaCarrinho'
import PaginaCheckout from './pages/cliente/PaginaCheckout'
import PaginaConfirmacaoPedido from './pages/cliente/PaginaConfirmacaoPedido'

import PaginaLogin from './pages/admin/PaginaLogin'
import LayoutAdmin from './pages/admin/LayoutAdmin'
import PaginaCategorias from './pages/admin/PaginaCategorias'
import PaginaProdutos from './pages/admin/PaginaProdutos'
import PaginaZonasEntrega from './pages/admin/PaginaZonasEntrega'
import PaginaPedidos from './pages/admin/PaginaPedidos'
import PaginaLoja from './pages/admin/PaginaLoja'

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<PaginaInicial />} />

          <Route path="/admin/login" element={<PaginaLogin />} />
          <Route
            path="/admin"
            element={
              <RotaProtegida>
                <LayoutAdmin />
              </RotaProtegida>
            }
          >
            <Route index element={<PaginaPedidos />} />
            <Route path="categorias" element={<PaginaCategorias />} />
            <Route path="produtos" element={<PaginaProdutos />} />
            <Route path="zonas-entrega" element={<PaginaZonasEntrega />} />
            <Route path="loja" element={<PaginaLoja />} />
          </Route>

          <Route path="/:slug" element={<LayoutCliente />}>
            <Route index element={<PaginaCardapio />} />
            <Route path="carrinho" element={<PaginaCarrinho />} />
            <Route path="checkout" element={<PaginaCheckout />} />
            <Route path="pedido/:pedidoGuid" element={<PaginaConfirmacaoPedido />} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
