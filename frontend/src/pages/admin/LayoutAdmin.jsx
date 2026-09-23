import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

export default function LayoutAdmin() {
  const { usuario, sair } = useAuth()
  const navigate = useNavigate()

  function handleSair() {
    sair()
    navigate('/admin/login')
  }

  return (
    <div className="layout-admin">
      <aside className="menu-admin">
        <h2>Cardapio Admin</h2>
        <nav>
          <NavLink to="/admin" end>Pedidos</NavLink>
          <NavLink to="/admin/categorias">Categorias</NavLink>
          <NavLink to="/admin/produtos">Produtos</NavLink>
          <NavLink to="/admin/zonas-entrega">Zonas de entrega</NavLink>
          <NavLink to="/admin/loja">Minha loja</NavLink>
        </nav>
        <div className="menu-admin__rodape">
          <span>{usuario?.nome}</span>
          <button type="button" onClick={handleSair}>Sair</button>
        </div>
      </aside>
      <main className="conteudo-admin">
        <Outlet />
      </main>
    </div>
  )
}
