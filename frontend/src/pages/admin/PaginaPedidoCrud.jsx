import { useEffect, useState } from 'react'
import { useNavigate, useOutletContext, useParams } from 'react-router-dom'
import { Button } from 'primereact/button'
import { Tooltip } from 'primereact/tooltip'
import { Column } from 'primereact/column'
import { DataTable } from 'primereact/datatable'
import { useAuth } from '../../context/AuthContext'
import { useChatPedidos } from '../../context/ChatPedidosContext'
import { rascunhoDoPedido } from '../../utils/edicaoPedido'
import { useImpressaoPedido } from '../../context/ImpressaoPedidoContext'
import { dispatchMsgError, dispatchMsgSuccess } from '../../store/dispatchMsg'
import { confirmar } from '../../utils/confirmar'
import { atualizarStatusPedido, excluirPedido, obterPedido } from '../../api/pedidosApi'
import BotaoRota from '../../components/pedido/BotaoRota'
import DialogoCancelarPedido from '../../components/pedido/DialogoCancelarPedido'
import CrudPagina from '../../components/crud/CrudPagina'
import { SecaoCrud } from '../../components/crud/Campo'
import { CrudSkeleton } from '../../components/Skeleton'
import { formatarMoeda, formatarTelefone } from '../../utils/formatadores'
import SeloSituacao from '../../components/pedido/SeloSituacao'
import { ICONE_CATEGORIA, rotuloTipoEntrega } from '../../utils/pedido'

const ROTA_LISTA = '/admin/pedidos'

const formatarDataHora = (iso) => new Date(iso).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })

/** Uma informação do pedido: rótulo pequeno e o valor embaixo. */
function Dado({ rotulo, children }) {
  return (
    <div className="pedido__dado">
      <span className="pedido__rotulo">{rotulo}</span>
      <span>{children || '—'}</span>
    </div>
  )
}

/** Detalhe do pedido (/admin/pedidos/:id): cliente, itens e as ações que levam o pedido ao próximo status. */
export default function PaginaPedidoCrud() {
  const { id } = useParams()
  const { loja, pode } = useAuth()
  const navigate = useNavigate()
  const { definirMigalha } = useOutletContext()
  const { imprimir } = useImpressaoPedido()
  const { abrirEdicao } = useChatPedidos()

  const [pedido, setPedido] = useState(null)
  const [atualizando, setAtualizando] = useState(false)
  const [cancelando, setCancelando] = useState(false)

  useEffect(() => {
    definirMigalha(`Pedido ${id}`)
    return () => definirMigalha(null)
  }, [id, definirMigalha])

  useEffect(() => {
    obterPedido(loja.tenant, id)
      .then(setPedido)
      .catch((e) => dispatchMsgError(e.mensagem))
  }, [id, loja.tenant])

  async function mudarStatus(situacaoId, extra) {
    setAtualizando(true)
    try {
      const atualizado = await atualizarStatusPedido(loja.tenant, id, situacaoId, extra)
      setPedido(atualizado)
      dispatchMsgSuccess(`Pedido ${id} - ${atualizado.nomeCliente}: ${atualizado.situacao.nome.toLowerCase()}`)
    } catch (e) {
      dispatchMsgError(e.mensagem)
    } finally {
      setAtualizando(false)
    }
  }

  function excluir() {
    confirmar({
      mensagem: `Excluir o pedido ${id}? Ele deixa de aparecer nas listas e no painel.`,
      rotuloConfirmar: 'Excluir',
      aoConfirmar: async () => {
        try {
          await excluirPedido(loja.tenant, id)
          dispatchMsgSuccess('Pedido excluído com sucesso')
          navigate(ROTA_LISTA)
        } catch (e) {
          dispatchMsgError(e.mensagem)
        }
      },
    })
  }

  // avançar vai direto; cancelar pede o motivo e a taxa de cancelamento
  const avancos = (pedido?.proximasSituacoes ?? []).filter((p) => p.categoria !== 'CANCELADO')
  const cancelamento = pedido?.proximasSituacoes.find((p) => p.categoria === 'CANCELADO')
  const pedidoAberto = !!pedido && pedido.proximasSituacoes.length > 0
  const endereco = pedido && [
    [pedido.enderecoRua, pedido.enderecoNumero].filter(Boolean).join(', '),
    pedido.enderecoComplemento, pedido.enderecoBairro, pedido.enderecoCidade,
  ].filter(Boolean).join(' - ')

  const conteudo = pedido && (
    <>
      <SecaoCrud id="secao-pedido" titulo="Pedido">
        <div className="pedido__dados">
          <Dado rotulo="Situação">
            <SeloSituacao nome={pedido.situacao?.nome} cor={pedido.situacao?.cor} />
            {pedido.editado && <span className="selo selo--info selo--editado">Editado</span>}
          </Dado>
          <Dado rotulo="Criado em">{formatarDataHora(pedido.dataCriacao)}</Dado>
          <Dado rotulo="Atualizado em">{pedido.dataAtualizacao && formatarDataHora(pedido.dataAtualizacao)}</Dado>
          <Dado rotulo="Cliente">{pedido.nomeCliente}</Dado>
          <Dado rotulo="Telefone">{formatarTelefone(pedido.telefoneCliente)}</Dado>
          <Dado rotulo="Forma de pagamento">{pedido.formaPagamento}</Dado>
          <Dado rotulo="Tipo">{rotuloTipoEntrega(pedido.tipoEntrega)}</Dado>
          {pedido.tipoEntrega === 'ENTREGA' && (
            <Dado rotulo="Endereço de entrega">
              {endereco} <BotaoRota pedido={pedido} className="botao-rota botao-rota--texto" />
            </Dado>
          )}
          <Dado rotulo="Observações">{pedido.observacoes}</Dado>
          {pedido.situacao?.categoria === 'CANCELADO' && <Dado rotulo="Motivo do cancelamento">{pedido.motivoCancelamento || 'Não informado'}</Dado>}
          {pedido.situacao?.categoria === 'CANCELADO' && (
            <Dado rotulo="Taxa de cancelamento">
              {Number(pedido.taxaCancelamento) > 0 ? formatarMoeda(pedido.taxaCancelamento) : 'Sem taxa'}
            </Dado>
          )}
        </div>
      </SecaoCrud>

      <SecaoCrud id="secao-itens" titulo="Itens">
        <DataTable value={pedido.itens} emptyMessage="Sem itens." className="tabela-dados">
          <Column header="Produto" field="nomeProduto" />
          <Column header="Quantidade" field="quantidade" />
          <Column header="Preço" body={(item) => formatarMoeda(item.precoUnitario)} />
          <Column header="Total" body={(item) => formatarMoeda(item.totalItem)} />
          <Column header="Observação" body={(item) => item.observacoes || '—'} />
        </DataTable>
        <div className="pedido__totais">
          <span>Subtotal: <strong>{formatarMoeda(pedido.subtotal)}</strong></span>
          <span>Taxa de entrega: <strong>{formatarMoeda(pedido.taxaEntrega)}</strong></span>
          {Number(pedido.desconto) > 0 && <span>Desconto: <strong>- {formatarMoeda(pedido.desconto)}</strong></span>}
          <span className="pedido__total">Total: <strong>{formatarMoeda(pedido.total)}</strong></span>
        </div>
      </SecaoCrud>

      {pedido.alteracoes?.length > 0 && (
        <SecaoCrud id="secao-alteracoes" titulo="Alterações do pedido">
          <ul className="pedido__alteracoes">
            {pedido.alteracoes.map((alteracao, i) => (
              <li key={i}>
                <strong>{formatarDataHora(alteracao.data)}</strong>
                {alteracao.usuario && <span> · {alteracao.usuario}</span>}
                <ul>
                  {alteracao.descricoes.map((descricao, j) => <li key={j}>{descricao}</li>)}
                </ul>
              </li>
            ))}
          </ul>
        </SecaoCrud>
      )}
    </>
  )

  return (
    <CrudPagina
      titulo={`Pedido ${id}`}
      subtitulo={pedido ? `${pedido.nomeCliente} · ${formatarMoeda(pedido.total)}` : 'Carregando'}
      aoVoltar={() => navigate(ROTA_LISTA)}
      rodape={(
        <div className="crud__acoes">
          {cancelamento && pode('PEDIDOS_CANCELAR') && (
            <Button type="button" label="Cancelar pedido" icon="pi pi-times"
                    severity="danger" outlined disabled={atualizando} onClick={() => setCancelando(true)} />
          )}
          {pode('PEDIDOS_EXCLUIR') && (
            <Button type="button" label="Excluir" icon="pi pi-trash" severity="danger" outlined disabled={!pedido} onClick={excluir} />
          )}
          <span className="crud__espaco" />
          {pode('PEDIDOS_ALTERAR') && pedidoAberto && (
            <Button type="button" label="Editar" icon="pi pi-pencil" severity="secondary" outlined
                    onClick={() => abrirEdicao(pedido, rascunhoDoPedido(pedido))} />
          )}
          <Button type="button" label="Cozinha" icon="pi pi-print" severity="secondary" outlined disabled={!pedido}
                  onClick={() => imprimir(pedido, 'COZINHA')} />
          <Button type="button" label="Entrega" icon="pi pi-print" severity="secondary" outlined disabled={!pedido}
                  onClick={() => imprimir(pedido, 'ENTREGA')} />
          <Button type="button" label="Fechar" severity="secondary" outlined onClick={() => navigate(ROTA_LISTA)} />
          {pode('PEDIDOS_ALTERAR_STATUS') && avancos.map((destino) => (
            <Button key={destino.id} type="button" label={destino.rotulo} icon={ICONE_CATEGORIA[destino.categoria]}
                    disabled={atualizando} onClick={() => mudarStatus(destino.id)} />
          ))}
        </div>
      )}
    >
      <Tooltip target=".botao-rota" />
      <DialogoCancelarPedido pedido={cancelando ? { id } : null} enviando={atualizando} aoFechar={() => setCancelando(false)}
                             aoConfirmar={async (dados) => { await mudarStatus(cancelamento.id, dados); setCancelando(false) }} />
      {pedido ? conteudo : <CrudSkeleton blocos={[[4, 4, 4, 4, 4, 4, 12], [12, 12, 12]]} />}
    </CrudPagina>
  )
}
