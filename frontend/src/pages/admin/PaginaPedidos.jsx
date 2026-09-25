import { useNavigate } from 'react-router-dom'
import { useChatPedidos } from '../../context/ChatPedidosContext'
import { useAuth } from '../../context/AuthContext'
import { buscarPedidos } from '../../api/pedidosApi'
import TelaBusca from '../../components/crud/TelaBusca'
import { formatarMoeda, formatarTelefone } from '../../utils/formatadores'
import { OPCOES_STATUS, rotuloTipoEntrega, STATUS_PEDIDO, TIPOS_ENTREGA } from '../../utils/pedido'
import { periodoParaIso, resolverPeriodo } from '../../utils/periodo'

const PERIODO_PADRAO = { preset: 'ultimos-7' }

const FILTROS = [
  { nome: 'periodo', rotulo: 'Período do pedido', tipo: 'periodo', padrao: PERIODO_PADRAO },
  { nome: 'status', rotulo: 'Situação', tipo: 'selecao', opcoes: OPCOES_STATUS },
  { nome: 'tipoEntrega', rotulo: 'Tipo', tipo: 'selecao', opcoes: TIPOS_ENTREGA },
]

const COLUNAS = [
  { chave: 'id', cabecalho: 'Nº' },
  {
    chave: 'dataCriacao',
    cabecalho: 'Data',
    render: (pedido) => new Date(pedido.dataCriacao).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' }),
  },
  { chave: 'nomeCliente', cabecalho: 'Cliente' },
  { chave: 'telefoneCliente', cabecalho: 'Telefone', render: (pedido) => formatarTelefone(pedido.telefoneCliente) },
  {
    chave: 'tipoEntrega',
    cabecalho: 'Tipo',
    render: (pedido) => [rotuloTipoEntrega(pedido.tipoEntrega), pedido.bairro].filter(Boolean).join(' · '),
  },
  { chave: 'quantidadeItens', cabecalho: 'Itens' },
  { chave: 'total', cabecalho: 'Total', render: (pedido) => formatarMoeda(pedido.total) },
  {
    chave: 'status',
    cabecalho: 'Situação',
    render: (pedido) => {
      const status = STATUS_PEDIDO[pedido.status]
      return <span className={`selo selo--${status.tom}`}>{status.rotulo}</span>
    },
  },
]

/** Operação > Pedidos: os pedidos da loja num período (no máximo 90 dias; padrão: últimos 7 dias). */
export default function PaginaPedidos() {
  const { loja, pode } = useAuth()
  const { abrirNovo } = useChatPedidos()
  const navigate = useNavigate()

  return (
    <TelaBusca
      titulo="Pedidos"
      chaveFiltros="pedidos"
      placeholder="Buscar por cliente, telefone ou número do pedido"
      colunas={COLUNAS}
      filtros={FILTROS}
      comInativos={false}
      chaveLinha={(pedido) => pedido.id}
      buscar={({ busca, filtros, page, size }) => {
        const { periodo, ...demais } = filtros
        const { inicio, fim } = periodoParaIso(resolverPeriodo(periodo, PERIODO_PADRAO))
        return buscarPedidos(loja.tenant, { busca, ...demais, inicio, fim, page, size })
      }}
      aoNovo={pode('PEDIDOS_INCLUIR') ? () => abrirNovo() : undefined}
      rotuloNovo="Novo pedido"
      aoAbrir={(pedido) => navigate(`/admin/pedidos/${pedido.id}`)}
    />
  )
}
