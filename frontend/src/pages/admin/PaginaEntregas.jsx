import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Button } from 'primereact/button'
import { Column } from 'primereact/column'
import { DataTable } from 'primereact/datatable'
import { TabPanel, TabView } from 'primereact/tabview'
import { useAuth } from '../../context/AuthContext'
import { useNotificacoes } from '../../context/NotificacoesContext'
import { dispatchMsgError } from '../../store/dispatchMsg'
import { obterEntregasEmRota, obterRepasse } from '../../api/entregadoresApi'
import DialogoPeriodo from '../../components/periodo/DialogoPeriodo'
import SeloSituacao from '../../components/pedido/SeloSituacao'
import { Skeleton } from '../../components/Skeleton'
import { formatarMoeda } from '../../utils/formatadores'
import { periodoParaIso, resolverPeriodo, rotuloPeriodo } from '../../utils/periodo'

const PERIODO_PADRAO = { preset: 'ultimos-7' }
const TIPOS = { PROPRIO: 'Próprio', TERCEIRIZADO: 'Terceirizado' }

/** "há 3 min" a partir de um horário (a posição do GPS do entregador). */
function haQuanto(iso) {
  if (!iso) return null
  const minutos = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 60000))
  return minutos < 1 ? 'agora' : minutos < 60 ? `há ${minutos} min` : `há ${Math.floor(minutos / 60)} h`
}

function PedidoLinha({ pedido }) {
  return (
    <li className="entregas__pedido">
      <Link to={`/admin/pedidos/${pedido.id}`}>Pedido {pedido.id}</Link>
      <span>{pedido.cliente}{pedido.bairro ? ` · ${pedido.bairro}` : ''}</span>
      <SeloSituacao nome={pedido.situacao} cor={pedido.cor} />
    </li>
  )
}

/** Aba "Em rota": quem está com quais pedidos agora (atualiza sozinha quando algo muda). */
function EmRota() {
  const { loja } = useAuth()
  const { assinarEventos } = useNotificacoes()
  const [dados, setDados] = useState(null)

  const carregar = useCallback(() => {
    obterEntregasEmRota(loja.tenant).then(setDados).catch((e) => dispatchMsgError(e.mensagem))
  }, [loja.tenant])

  useEffect(() => {
    carregar()
    const intervalo = setInterval(carregar, 30000) // a posição do GPS chega sem evento no painel
    const parar = assinarEventos(carregar)
    return () => {
      clearInterval(intervalo)
      parar()
    }
  }, [carregar, assinarEventos])

  if (!dados) {
    return (
      <div className="entregas__grade" aria-busy="true" aria-label="Carregando entregas">
        {[0, 1, 2].map((i) => (
          <div key={i} className="secao-crud">
            <Skeleton largura="50%" altura="1rem" />
            <Skeleton largura="35%" altura="0.8rem" />
            <Skeleton altura="1.4rem" />
            <Skeleton altura="1.4rem" />
          </div>
        ))}
      </div>
    )
  }

  const vazio = dados.entregadores.length === 0 && dados.semEntregador.length === 0
  return (
    <>
      {vazio && <p className="texto-auxiliar">Nenhuma entrega em andamento agora.</p>}
      <div className="entregas__grade">
        {dados.entregadores.map((e) => (
          <section key={e.id} className="secao-crud entregas__cartao">
            <header className="entregas__topo">
              <strong>{e.nome}</strong>
              <span className="selo selo--info">{TIPOS[e.tipo] ?? e.tipo}</span>
            </header>
            <small className="texto-auxiliar">
              {e.posicaoEm ? (
                <>
                  Posição {haQuanto(e.posicaoEm)}{' '}
                  <a href={`https://www.google.com/maps?q=${e.latitude},${e.longitude}`} target="_blank" rel="noopener noreferrer">
                    ver no mapa
                  </a>
                </>
              ) : 'Sem posição do celular ainda'}
            </small>
            <ul className="entregas__lista">{e.pedidos.map((p) => <PedidoLinha key={p.id} pedido={p} />)}</ul>
          </section>
        ))}
        {dados.semEntregador.length > 0 && (
          <section className="secao-crud entregas__cartao entregas__cartao--alerta">
            <header className="entregas__topo"><strong>Sem entregador</strong></header>
            <small className="texto-auxiliar">Pedidos de entrega que ainda não têm quem entregue.</small>
            <ul className="entregas__lista">{dados.semEntregador.map((p) => <PedidoLinha key={p.id} pedido={p} />)}</ul>
          </section>
        )}
      </div>
    </>
  )
}

/** Aba "Repasse": entregas concluídas e quanto cada entregador tem a receber no período. */
function Repasse() {
  const { loja } = useAuth()
  const [periodo, setPeriodo] = useState(PERIODO_PADRAO)
  const [dialogo, setDialogo] = useState(false)
  const [dados, setDados] = useState(null)
  const resolvido = resolverPeriodo(periodo, PERIODO_PADRAO)
  const { inicio, fim } = periodoParaIso(resolvido)

  useEffect(() => {
    setDados(null)
    obterRepasse(loja.tenant, inicio, fim).then(setDados).catch((e) => dispatchMsgError(e.mensagem))
  }, [loja.tenant, inicio, fim])

  return (
    <>
      <div className="entregas__filtro">
        <Button type="button" icon="fa-solid fa-calendar-days" label={rotuloPeriodo(periodo, resolvido)} outlined severity="secondary"
                onClick={() => setDialogo(true)} />
        {dados && (
          <span>
            <strong>{dados.totalEntregas}</strong> entrega(s) · repasse total <strong>{formatarMoeda(dados.totalRepasse)}</strong>
          </span>
        )}
      </div>
      <DataTable value={dados?.linhas ?? []} loading={dados === null} emptyMessage="Nenhuma entrega concluída no período." className="tabela-dados">
        <Column header="Entregador" field="entregador" />
        <Column header="Tipo" body={(l) => TIPOS[l.tipo] ?? '—'} />
        <Column header="Entregas" field="entregas" />
        <Column header="Repasse" body={(l) => formatarMoeda(l.repasse)} />
      </DataTable>
      <DialogoPeriodo aberto={dialogo} periodo={periodo} atual={resolvido} aoFechar={() => setDialogo(false)}
                      aoAplicar={(novo) => { setPeriodo(novo); setDialogo(false) }} />
    </>
  )
}

/** Entrega > Entregas em rota: o que está na rua agora e o repasse dos entregadores. */
export default function PaginaEntregas() {
  return (
    <div className="pagina-admin">
      <h1>Entregas</h1>
      <p className="texto-auxiliar">Acompanhe as entregas em andamento e calcule o repasse dos entregadores por período.</p>
      <TabView className="crud__abas">
        <TabPanel header="Em rota agora"><EmRota /></TabPanel>
        <TabPanel header="Repasse por período"><Repasse /></TabPanel>
      </TabView>
    </div>
  )
}
