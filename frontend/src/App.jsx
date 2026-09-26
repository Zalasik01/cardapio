import { BrowserRouter, Navigate, Route, Routes, useParams } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import RotaProtegida from './components/RotaProtegida'

import PaginaInicial from './pages/PaginaInicial'

import LayoutCliente from './pages/cliente/LayoutCliente'
import PaginaCardapio from './pages/cliente/PaginaCardapio'
import PaginaCarrinho from './pages/cliente/PaginaCarrinho'
import PaginaCheckout from './pages/cliente/PaginaCheckout'
import PaginaMeusPedidos from './pages/cliente/PaginaMeusPedidos'

import PaginaLogin from './pages/admin/PaginaLogin'
import LayoutAdmin from './pages/admin/LayoutAdmin'
import PaginaCategorias from './pages/admin/PaginaCategorias'
import PaginaCategoriaCrud from './pages/admin/PaginaCategoriaCrud'
import PaginaPedidoCrud from './pages/admin/PaginaPedidoCrud'
import PaginaZonaEntregaCrud from './pages/admin/PaginaZonaEntregaCrud'
import PaginaZonasEntrega from './pages/admin/PaginaZonasEntrega'
import { ChatPedidosProvider } from './context/ChatPedidosContext'
import { ImpressaoPedidoProvider } from './context/ImpressaoPedidoContext'
import { NotificacoesProvider } from './context/NotificacoesContext'
import PaginaEntregadorCrud from './pages/admin/PaginaEntregadorCrud'
import PaginaEntregadores from './pages/admin/PaginaEntregadores'
import PaginaEntregas from './pages/admin/PaginaEntregas'
import PaginaAcompanhamento from './pages/publico/PaginaAcompanhamento'
import PaginaEntregador from './pages/publico/PaginaEntregador'
import PaginaFluxoPedidos from './pages/admin/PaginaFluxoPedidos'
import PaginaFormaPagamentoCrud from './pages/admin/PaginaFormaPagamentoCrud'
import PaginaCupons from './pages/admin/PaginaCupons'
import PaginaAvaliacoes from './pages/admin/PaginaAvaliacoes'
import PaginaFidelidade from './pages/admin/PaginaFidelidade'
import PaginaSite from './pages/admin/PaginaSite'
import PaginaCupomCrud from './pages/admin/PaginaCupomCrud'
import PaginaFormasPagamento from './pages/admin/PaginaFormasPagamento'
import PaginaPainelPedidos from './pages/admin/PaginaPainelPedidos'
import PaginaPedidos from './pages/admin/PaginaPedidos'
import PaginaLoja from './pages/admin/PaginaLoja'
import PaginaDashboard from './pages/admin/PaginaDashboard'
import PaginaUsuarios from './pages/admin/PaginaUsuarios'
import PaginaUsuarioCrud from './pages/admin/PaginaUsuarioCrud'
import PaginaFuncionarios from './pages/admin/PaginaFuncionarios'
import PaginaFuncionarioCrud from './pages/admin/PaginaFuncionarioCrud'
import PaginaGestaoDashboard from './pages/admin/PaginaGestaoDashboard'
import PaginaGestaoLojas from './pages/admin/PaginaGestaoLojas'
import PaginaGestaoLojaCrud from './pages/admin/PaginaGestaoLojaCrud'
import PaginaGestaoUsuarios from './pages/admin/PaginaGestaoUsuarios'
import PaginaGestaoUsuarioCrud from './pages/admin/PaginaGestaoUsuarioCrud'
import PaginaProdutosCadastro from './pages/admin/PaginaProdutosCadastro'
import PaginaProdutoCadastroCrud from './pages/admin/PaginaProdutoCadastroCrud'
import PaginaPessoas from './pages/admin/PaginaPessoas'
import PaginaPessoaCrud from './pages/admin/PaginaPessoaCrud'
import PaginaNovoUsuario from './pages/admin/PaginaNovoUsuario'

/** Links antigos /:slug/pedido/:guid levam ao acompanhamento público. */
function RedirecionaAcompanhamento() {
  const { pedidoGuid } = useParams()
  return <Navigate to={`/pedido/${pedidoGuid}`} replace />
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<PaginaInicial />} />

          <Route path="/admin/login" element={<PaginaLogin />} />
          {/* páginas públicas: o código no endereço é o acesso (sem login) */}
          <Route path="/entregador/:token" element={<PaginaEntregador />} />
          <Route path="/pedido/:guid" element={<PaginaAcompanhamento />} />
          <Route path="/novo-usuario/:token" element={<PaginaNovoUsuario />} />
          <Route
            path="/admin"
            element={
              <RotaProtegida>
                <NotificacoesProvider><ChatPedidosProvider><ImpressaoPedidoProvider><LayoutAdmin /></ImpressaoPedidoProvider></ChatPedidosProvider></NotificacoesProvider>
              </RotaProtegida>
            }
          >
            {/* tela padrao apos escolher a loja: categoria Dashboards */}
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<PaginaDashboard />} />
            <Route path="usuarios" element={<PaginaUsuarios />} />
            <Route path="usuarios/novo" element={<PaginaUsuarioCrud key="novo" />} />
            <Route path="usuarios/:id" element={<PaginaUsuarioCrud key="editar" />} />
            <Route path="funcionarios" element={<PaginaFuncionarios />} />
            <Route path="funcionarios/novo" element={<PaginaFuncionarioCrud key="novo" />} />
            <Route path="funcionarios/:id" element={<PaginaFuncionarioCrud key="editar" />} />
            <Route path="pessoas" element={<PaginaPessoas />} />
            <Route path="pessoas/novo" element={<PaginaPessoaCrud key="novo" />} />
            <Route path="pessoas/:id" element={<PaginaPessoaCrud key="editar" />} />
            <Route path="gestao-dashboard" element={<PaginaGestaoDashboard />} />
            <Route path="gestao-lojas" element={<PaginaGestaoLojas />} />
            <Route path="gestao-lojas/novo" element={<PaginaGestaoLojaCrud key="novo" />} />
            <Route path="gestao-lojas/:id" element={<PaginaGestaoLojaCrud key="editar" />} />
            <Route path="gestao-usuarios" element={<PaginaGestaoUsuarios />} />
            <Route path="gestao-usuarios/novo" element={<PaginaGestaoUsuarioCrud key="novo" />} />
            <Route path="gestao-usuarios/:id" element={<PaginaGestaoUsuarioCrud key="editar" />} />
            <Route path="produtos-finais" element={<PaginaProdutosCadastro tipo="FINAL" />} />
            <Route path="produtos-finais/novo" element={<PaginaProdutoCadastroCrud tipo="FINAL" key="final-novo" />} />
            <Route path="produtos-finais/:id" element={<PaginaProdutoCadastroCrud tipo="FINAL" key="final-editar" />} />
            <Route path="ingredientes" element={<PaginaProdutosCadastro tipo="INGREDIENTE" />} />
            <Route path="ingredientes/novo" element={<PaginaProdutoCadastroCrud tipo="INGREDIENTE" key="ingrediente-novo" />} />
            <Route path="ingredientes/:id" element={<PaginaProdutoCadastroCrud tipo="INGREDIENTE" key="ingrediente-editar" />} />
            <Route path="entregadores" element={<PaginaEntregadores />} />
            <Route path="entregadores/novo" element={<PaginaEntregadorCrud key="novo" />} />
            <Route path="entregadores/:id" element={<PaginaEntregadorCrud key="editar" />} />
            <Route path="entregas" element={<PaginaEntregas />} />
            <Route path="fluxo-pedidos" element={<PaginaFluxoPedidos />} />
            <Route path="painel-pedidos" element={<PaginaPainelPedidos />} />
            <Route path="pedidos" element={<PaginaPedidos />} />
            <Route path="pedidos/:id" element={<PaginaPedidoCrud />} />
            <Route path="categorias" element={<PaginaCategorias />} />
            <Route path="categorias/novo" element={<PaginaCategoriaCrud key="novo" />} />
            <Route path="categorias/:id" element={<PaginaCategoriaCrud key="editar" />} />
            <Route path="formas-pagamento" element={<PaginaFormasPagamento />} />
            <Route path="formas-pagamento/novo" element={<PaginaFormaPagamentoCrud key="novo" />} />
            <Route path="formas-pagamento/:id" element={<PaginaFormaPagamentoCrud key="editar" />} />
            <Route path="cupons" element={<PaginaCupons />} />
            <Route path="avaliacoes" element={<PaginaAvaliacoes />} />
            <Route path="fidelidade" element={<PaginaFidelidade />} />
            <Route path="site" element={<PaginaSite />} />
            <Route path="cupons/novo" element={<PaginaCupomCrud key="novo" />} />
            <Route path="cupons/:id" element={<PaginaCupomCrud key="editar" />} />
            <Route path="zonas-entrega" element={<PaginaZonasEntrega />} />
            <Route path="zonas-entrega/novo" element={<PaginaZonaEntregaCrud key="novo" />} />
            <Route path="zonas-entrega/:id" element={<PaginaZonaEntregaCrud key="editar" />} />
            <Route path="loja" element={<PaginaLoja />} />
          </Route>

          <Route path="/:slug" element={<LayoutCliente />}>
            <Route index element={<PaginaCardapio />} />
            <Route path="carrinho" element={<PaginaCarrinho />} />
            <Route path="checkout" element={<PaginaCheckout />} />
            <Route path="pedidos" element={<PaginaMeusPedidos />} />
            <Route path="pedido/:pedidoGuid" element={<RedirecionaAcompanhamento />} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
