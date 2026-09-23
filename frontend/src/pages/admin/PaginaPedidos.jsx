import { useEffect, useRef, useState } from 'react'
import TabelaDados from '../../components/TabelaDados'
import { useAuth } from '../../context/AuthContext'
import { dispatchMsgError, dispatchMsgSuccess } from '../../store/dispatchMsg'
import { atualizarStatusPedido, listarPedidosDaLoja } from '../../api/adminApi'
import { formatarMoeda } from '../../utils/formatadores'

const STATUS_OPCOES = ['PENDENTE', 'CONFIRMADO', 'EM_PREPARO', 'SAIU_PARA_ENTREGA', 'ENTREGUE', 'CANCELADO']

export default function PaginaPedidos() {
  const { loja } = useAuth()
  const tenant = loja.tenant

  const [pedidos, setPedidos] = useState([])
  const erroAvisado = useRef(false)
  const [carregando, setCarregando] = useState(true)

  function carregar() {
    listarPedidosDaLoja(tenant)
      .then((lista) => {
        setPedidos(lista)
        erroAvisado.current = false
      })
      .catch((e) => {
        if (!erroAvisado.current) dispatchMsgError(e.mensagem)
        erroAvisado.current = true
      })
      .finally(() => setCarregando(false))
  }

  useEffect(() => {
    carregar()
    const intervalo = setInterval(carregar, 15000)
    return () => clearInterval(intervalo)
  }, [tenant])

  async function handleAlterarStatus(pedidoGuid, status) {
    try {
      await atualizarStatusPedido(pedidoGuid, status)
      dispatchMsgSuccess('Status do pedido atualizado')
      carregar()
    } catch (e) {
      dispatchMsgError(e.mensagem)
    }
  }

  return (
    <div className="pagina-admin">
      <h1>Pedidos</h1>

      <TabelaDados
        dados={pedidos}
        chave="guid"
        carregando={carregando}
        colunas={[
          { campo: 'guid', cabecalho: '#', corpo: (pedido) => pedido.guid.slice(0, 8) },
          { campo: 'nomeCliente', cabecalho: 'Cliente', corpo: (pedido) => `${pedido.nomeCliente} — ${pedido.telefoneCliente}` },
          { campo: 'tipoEntrega', cabecalho: 'Tipo', corpo: (pedido) => (pedido.tipoEntrega === 'ENTREGA' ? 'Entrega' : 'Retirada') },
          { campo: 'total', cabecalho: 'Total', corpo: (pedido) => formatarMoeda(pedido.total) },
          {
            campo: 'status',
            cabecalho: 'Status',
            corpo: (pedido) => (
              <select value={pedido.status} onChange={(e) => handleAlterarStatus(pedido.guid, e.target.value)}>
                {STATUS_OPCOES.map((status) => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
            ),
          },
        ]}
      />
    </div>
  )
}
