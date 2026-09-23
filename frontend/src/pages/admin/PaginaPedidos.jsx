import { useEffect, useState } from 'react'
import { TabelaSkeleton } from '../../components/Skeleton'
import { useAuth } from '../../context/AuthContext'
import { atualizarStatusPedido, listarPedidosDaLoja } from '../../api/adminApi'
import { formatarMoeda } from '../../utils/formatadores'

const STATUS_OPCOES = ['PENDENTE', 'CONFIRMADO', 'EM_PREPARO', 'SAIU_PARA_ENTREGA', 'ENTREGUE', 'CANCELADO']

export default function PaginaPedidos() {
  const { usuario } = useAuth()
  const tenant = usuario.tenant

  const [pedidos, setPedidos] = useState([])
  const [erro, setErro] = useState(null)
  const [carregando, setCarregando] = useState(true)

  function carregar() {
    listarPedidosDaLoja(tenant)
      .then(setPedidos)
      .catch((e) => setErro(e.mensagem))
      .finally(() => setCarregando(false))
  }

  useEffect(() => {
    carregar()
    const intervalo = setInterval(carregar, 15000)
    return () => clearInterval(intervalo)
  }, [tenant])

  async function handleAlterarStatus(pedidoGuid, status) {
    await atualizarStatusPedido(pedidoGuid, status)
    carregar()
  }

  return (
    <div className="pagina-admin">
      <h1>Pedidos</h1>
      {erro && <p className="mensagem-erro">{erro}</p>}

      {carregando ? (
        <TabelaSkeleton cabecalhos={['#', 'Cliente', 'Tipo', 'Total', 'Status']} />
      ) : (
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
            <tr key={pedido.guid}>
              <td>{pedido.guid.slice(0, 8)}</td>
              <td>{pedido.nomeCliente} — {pedido.telefoneCliente}</td>
              <td>{pedido.tipoEntrega === 'ENTREGA' ? 'Entrega' : 'Retirada'}</td>
              <td>{formatarMoeda(pedido.total)}</td>
              <td>
                <select value={pedido.status} onChange={(e) => handleAlterarStatus(pedido.guid, e.target.value)}>
                  {STATUS_OPCOES.map((status) => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </select>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      )}
    </div>
  )
}
