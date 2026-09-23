import { useEffect, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { atualizarStatusPedido, listarPedidosDoRestaurante } from '../../api/adminApi'
import { formatarMoeda } from '../../utils/formatadores'

const STATUS_OPCOES = ['PENDENTE', 'CONFIRMADO', 'EM_PREPARO', 'SAIU_PARA_ENTREGA', 'ENTREGUE', 'CANCELADO']

export default function PaginaPedidos() {
  const { usuario } = useAuth()
  const restauranteId = usuario.restauranteId

  const [pedidos, setPedidos] = useState([])
  const [erro, setErro] = useState(null)

  function carregar() {
    listarPedidosDoRestaurante(restauranteId).then(setPedidos).catch((e) => setErro(e.mensagem))
  }

  useEffect(() => {
    carregar()
    const intervalo = setInterval(carregar, 15000)
    return () => clearInterval(intervalo)
  }, [restauranteId])

  async function handleAlterarStatus(pedidoId, status) {
    await atualizarStatusPedido(pedidoId, status)
    carregar()
  }

  return (
    <div className="pagina-admin">
      <h1>Pedidos</h1>
      {erro && <p className="mensagem-erro">{erro}</p>}

      <table className="tabela-admin">
        <thead>
          <tr>
            <th>#</th>
            <th>Cliente</th>
            <th>Tipo</th>
            <th>Total</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {pedidos.map((pedido) => (
            <tr key={pedido.id}>
              <td>{pedido.id}</td>
              <td>{pedido.nomeCliente} — {pedido.telefoneCliente}</td>
              <td>{pedido.tipoEntrega === 'ENTREGA' ? 'Entrega' : 'Retirada'}</td>
              <td>{formatarMoeda(pedido.total)}</td>
              <td>
                <select value={pedido.status} onChange={(e) => handleAlterarStatus(pedido.id, e.target.value)}>
                  {STATUS_OPCOES.map((status) => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </select>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
