import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useChatPedidos } from '../../context/ChatPedidosContext'
import { useImpressaoPedido } from '../../context/ImpressaoPedidoContext'
import { useAuth } from '../../context/AuthContext'
import { rascunhoDoPedido } from '../../utils/edicaoPedido'
import { buscarPedidos, excluirPedido, obterPedido } from '../../api/pedidosApi'
import { dispatchMsgError, dispatchMsgSuccess } from '../../store/dispatchMsg'
import { confirmar } from '../../utils/confirmar'
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
      return (
        <>
          <span className={`selo selo--${status.tom}`}>{status.rotulo}</span>
          {pedido.editado && <span className="selo selo--info selo--editado">Editado</span>}
        </>
      )
    },
  },
]

/** Operação > Pedidos: os pedidos da loja num período (no máximo 90 dias; padrão: últimos 7 dias). */
export default function PaginaPedidos() {
  const { loja, pode } = useAuth()
  const { abrirNovo, abrirEdicao } = useChatPedidos()
  const { imprimir } = useImpressaoPedido()
  const [versao, setVersao] = useState(0) // muda para recarregar a lista depois de excluir

  async function editar(pedido) {
    try {
      const completo = await obterPedido(loja.tenant, pedido.id)
      abrirEdicao(completo, rascunhoDoPedido(completo))
    } catch (e) {
      dispatchMsgError(e.mensagem)
    }
  }

  function excluir(pedido) {
    confirmar({
      mensagem: `Excluir o pedido ${pedido.id}? Ele deixa de aparecer nas listas e no painel.`,
      rotuloConfirmar: 'Excluir',
      aoConfirmar: async () => {
        try {
          await excluirPedido(loja.tenant, pedido.id)
          dispatchMsgSuccess('Pedido excluído com sucesso')
          setVersao((atual) => atual + 1)
        } catch (e) {
          dispatchMsgError(e.mensagem)
        }
      },
    })
  }
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
      chaveAtualizacao={versao}
      acoesExtras={(pedido) => [
        ...(pode('PEDIDOS_ALTERAR') && pedido.status !== 'ENTREGUE' && pedido.status !== 'CANCELADO'
          ? [{ label: 'Editar', icon: 'pi pi-pencil', command: () => editar(pedido) }] : []),
        { label: 'Imprimir para a cozinha', icon: 'pi pi-print', command: () => imprimir(pedido, 'COZINHA') },
        { label: 'Imprimir para entrega', icon: 'pi pi-print', command: () => imprimir(pedido, 'ENTREGA') },
        ...(pode('PEDIDOS_EXCLUIR') ? [{ label: 'Excluir', icon: 'pi pi-trash', command: () => excluir(pedido) }] : []),
      ]}
      aoAbrir={(pedido) => navigate(`/admin/pedidos/${pedido.id}`)}
    />
  )
}
