import { useEffect, useState } from 'react'
import { useNavigate, useOutletContext, useParams } from 'react-router-dom'
import { Button } from 'primereact/button'
import { Column } from 'primereact/column'
import { DataTable } from 'primereact/datatable'
import { useAuth } from '../../context/AuthContext'
import { dispatchMsgError, dispatchMsgSuccess } from '../../store/dispatchMsg'
import { confirmar } from '../../utils/confirmar'
import { atualizarStatusPedido, obterPedido } from '../../api/pedidosApi'
import CrudPagina from '../../components/crud/CrudPagina'
import { SecaoCrud } from '../../components/crud/Campo'
import { CrudSkeleton } from '../../components/Skeleton'
import { formatarMoeda, formatarTelefone } from '../../utils/formatadores'
import { ACAO_STATUS, rotuloTipoEntrega, STATUS_PEDIDO } from '../../utils/pedido'

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
  const { loja } = useAuth()
  const navigate = useNavigate()
  const { definirMigalha } = useOutletContext()

  const [pedido, setPedido] = useState(null)
  const [atualizando, setAtualizando] = useState(false)

  useEffect(() => {
    definirMigalha(`Pedido ${id}`)
    return () => definirMigalha(null)
  }, [id, definirMigalha])

  useEffect(() => {
    obterPedido(loja.tenant, id)
      .then(setPedido)
      .catch((e) => dispatchMsgError(e.mensagem))
  }, [id, loja.tenant])

  async function mudarStatus(status) {
    setAtualizando(true)
    try {
      setPedido(await atualizarStatusPedido(loja.tenant, id, status))
      dispatchMsgSuccess('Situação do pedido atualizada')
    } catch (e) {
      dispatchMsgError(e.mensagem)
    } finally {
      setAtualizando(false)
    }
  }

  function pedirStatus(status) {
    if (status !== 'CANCELADO') {
      mudarStatus(status)
      return
    }
    confirmar({
      mensagem: 'Cancelar este pedido? Essa ação não pode ser desfeita.',
      rotuloConfirmar: 'Cancelar pedido',
      aoConfirmar: () => mudarStatus(status),
    })
  }

  const status = pedido && STATUS_PEDIDO[pedido.status]
  const endereco = pedido && [
    [pedido.enderecoRua, pedido.enderecoNumero].filter(Boolean).join(', '),
    pedido.enderecoComplemento, pedido.enderecoBairro, pedido.enderecoCidade,
  ].filter(Boolean).join(' - ')

  const conteudo = pedido && (
    <>
      <SecaoCrud id="secao-pedido" titulo="Pedido">
        <div className="pedido__dados">
          <Dado rotulo="Situação"><span className={`selo selo--${status.tom}`}>{status.rotulo}</span></Dado>
          <Dado rotulo="Criado em">{formatarDataHora(pedido.dataCriacao)}</Dado>
          <Dado rotulo="Atualizado em">{pedido.dataAtualizacao && formatarDataHora(pedido.dataAtualizacao)}</Dado>
          <Dado rotulo="Cliente">{pedido.nomeCliente}</Dado>
          <Dado rotulo="Telefone">{formatarTelefone(pedido.telefoneCliente)}</Dado>
          <Dado rotulo="Forma de pagamento">{pedido.formaPagamento}</Dado>
          <Dado rotulo="Tipo">{rotuloTipoEntrega(pedido.tipoEntrega)}</Dado>
          {pedido.tipoEntrega === 'ENTREGA' && <Dado rotulo="Endereço de entrega">{endereco}</Dado>}
          <Dado rotulo="Observações">{pedido.observacoes}</Dado>
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
          <span className="pedido__total">Total: <strong>{formatarMoeda(pedido.total)}</strong></span>
        </div>
      </SecaoCrud>
    </>
  )

  return (
    <CrudPagina
      titulo={`Pedido ${id}`}
      subtitulo={pedido ? `${pedido.nomeCliente} · ${formatarMoeda(pedido.total)}` : 'Carregando'}
      aoVoltar={() => navigate(ROTA_LISTA)}
      rodape={(
        <div className="crud__acoes">
          {pedido?.proximosStatus.includes('CANCELADO') && (
            <Button type="button" label={ACAO_STATUS.CANCELADO.rotulo} icon={ACAO_STATUS.CANCELADO.icone}
                    severity="danger" outlined disabled={atualizando} onClick={() => pedirStatus('CANCELADO')} />
          )}
          <span className="crud__espaco" />
          <Button type="button" label="Fechar" severity="secondary" outlined onClick={() => navigate(ROTA_LISTA)} />
          {(pedido?.proximosStatus ?? []).filter((proximo) => proximo !== 'CANCELADO').map((proximo) => (
            <Button key={proximo} type="button" label={ACAO_STATUS[proximo].rotulo} icon={ACAO_STATUS[proximo].icone}
                    disabled={atualizando} onClick={() => pedirStatus(proximo)} />
          ))}
        </div>
      )}
    >
      {pedido ? conteudo : <CrudSkeleton blocos={[[4, 4, 4, 4, 4, 4, 12], [12, 12, 12]]} />}
    </CrudPagina>
  )
}
