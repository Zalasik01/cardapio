import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { dispatchMsgError } from '../../store/dispatchMsg'
import { obterResumoPedidos } from '../../api/pedidosApi'
import PainelDashboard from '../../components/dashboard/PainelDashboard'
import VendasPorHora from '../../components/dashboard/VendasPorHora'
import { Skeleton } from '../../components/Skeleton'
import { formatarMoeda } from '../../utils/formatadores'
import { periodoParaIso } from '../../utils/periodo'

const PERIODOS_PADRAO = { pedidos: { preset: 'hoje' } }
const ESQUELETO = { cartoes: 5, blocos: 0 }

/** Conteúdo de um cartão de número (ícone, rótulo, valor e apoio) com esqueleto enquanto carrega. */
function ConteudoCartao({ rotulo, valor, apoio, icone, carregando }) {
  return (
    <div className="cartao-resumo">
      <span className="cartao-resumo__icone" aria-hidden="true"><i className={icone} /></span>
      <div>
        <span className="cartao-resumo__rotulo">{rotulo}</span>
        {carregando ? <Skeleton largura="70px" altura="1.6rem" /> : <strong className="cartao-resumo__valor">{valor}</strong>}
        {carregando ? <Skeleton largura="80%" altura="0.7rem" /> : apoio && <small className="cartao-resumo__apoio">{apoio}</small>}
      </div>
    </div>
  )
}

/**
 * Cartão do dashboard da loja alimentado pelo resumo de pedidos do período. Vários cartões pedem o mesmo
 * período: a consulta é compartilhada (cache curto em pedidosApi).
 */
function CartaoPedidos({ periodo, rotulo, icone, valor, apoio }) {
  const { loja } = useAuth()
  const [resumo, setResumo] = useState(null)
  const { inicio, fim } = periodoParaIso(periodo)

  useEffect(() => {
    let descartada = false
    setResumo(null)
    obterResumoPedidos(loja.tenant, inicio, fim)
      .then((dados) => !descartada && setResumo(dados))
      .catch((e) => dispatchMsgError(e.mensagem))
    return () => {
      descartada = true
    }
  }, [loja.tenant, inicio, fim])

  return (
    <ConteudoCartao rotulo={rotulo} icone={icone} carregando={resumo === null}
                    valor={resumo && valor(resumo)} apoio={resumo && (apoio ? apoio(resumo) : periodo.rotulo)} />
  )
}

/** "▲ 12% vs semana passada": variação do período contra o anterior (semana passada nos períodos de até 7 dias). */
function comparar(atual, anterior) {
  const a = Number(atual)
  const b = Number(anterior)
  if (!b) return a > 0 ? <span className="variacao variacao--sobe">▲ novo (sem base na semana passada)</span> : null
  const pct = Math.round(((a - b) / b) * 100)
  if (pct === 0) return <span className="variacao">= igual ao período anterior</span>
  return <span className={`variacao ${pct > 0 ? 'variacao--sobe' : 'variacao--desce'}`}>{pct > 0 ? '▲' : '▼'} {Math.abs(pct)}% vs. semana passada</span>
}

const DICA_PERIODO = 'Use o menu "..." para filtrar o período: no máximo 90 dias.'

/** Tela padrão do painel: resumo da loja selecionada (pedidos do período escolhido, hoje por padrão). */
export default function PaginaDashboard() {
  const { loja, usuarioLogado } = useAuth()

  const widgets = useMemo(() => [
    {
      id: 'pedidos',
      tamanho: 'cartao',
      periodo: 'pedidos',
      dica: `Pedidos criados no período escolhido (hoje por padrão). ${DICA_PERIODO}`,
      conteudo: (ctx) => (
        <CartaoPedidos periodo={ctx.periodo('pedidos')} rotulo="Pedidos" icone="fa-solid fa-receipt" valor={(r) => r.total}
                       apoio={(r) => comparar(r.total, r.totalAnterior)} />
      ),
    },
    {
      id: 'em-andamento',
      tamanho: 'cartao',
      periodo: 'pedidos',
      dica: 'Pedidos que ainda estão sendo atendidos agora (pendentes, confirmados, em preparo ou em entrega), de qualquer dia.',
      conteudo: (ctx) => (
        <CartaoPedidos periodo={ctx.periodo('pedidos')} rotulo="Em andamento" icone="fa-solid fa-fire-burner"
                       valor={(r) => r.emAndamento} apoio={() => 'Agora, de qualquer dia'} />
      ),
    },
    {
      id: 'entregues',
      tamanho: 'cartao',
      periodo: 'pedidos',
      dica: `Pedidos entregues entre os criados no período escolhido. ${DICA_PERIODO}`,
      conteudo: (ctx) => (
        <CartaoPedidos periodo={ctx.periodo('pedidos')} rotulo="Entregues" icone="fa-solid fa-circle-check" valor={(r) => r.entregues}
                       apoio={(r) => comparar(r.entregues, r.entreguesAnterior)} />
      ),
    },
    {
      id: 'faturamento',
      tamanho: 'cartao',
      periodo: 'pedidos',
      dica: `Soma dos pedidos entregues criados no período escolhido. ${DICA_PERIODO}`,
      conteudo: (ctx) => (
        <CartaoPedidos periodo={ctx.periodo('pedidos')} rotulo="Faturamento" icone="fa-solid fa-sack-dollar"
                       valor={(r) => formatarMoeda(r.faturamento)} apoio={(r) => comparar(r.faturamento, r.faturamentoAnterior)} />
      ),
    },
    {
      id: 'no-prazo',
      tamanho: 'cartao',
      periodo: 'pedidos',
      dica: `Entre os pedidos entregues no período, quantos foram entregues dentro do prazo de preparo. ${DICA_PERIODO}`,
      conteudo: (ctx) => (
        <CartaoPedidos periodo={ctx.periodo('pedidos')} rotulo="No prazo" icone="fa-solid fa-stopwatch"
                       valor={(r) => (r.noPrazoPercentual == null ? '—' : `${r.noPrazoPercentual}%`)}
                       apoio={(r) => (r.noPrazoPercentual == null ? 'Sem pedidos com prazo' : r.atrasoMedioMinutos > 0 ? `Atraso médio: ${r.atrasoMedioMinutos} min` : 'Nenhum atraso')} />
      ),
    },
    {
      id: 'vendas-hora',
      tamanho: 'bloco',
      titulo: 'Vendas por hora',
      periodo: 'pedidos',
      dica: `Quanto foi vendido em cada hora do dia (pedidos não cancelados) no período escolhido. ${DICA_PERIODO}`,
      conteudo: (ctx) => <VendasPorHora periodo={ctx.periodo('pedidos')} />,
    },
  ], [])

  return (
    <div className="pagina-admin">
      <h1>Visão geral</h1>
      <p className="texto-auxiliar">
        Olá, {usuarioLogado.nome}. Resumo de <strong>{loja.nome}</strong>. Arraste os quadros pela alça para reposicioná-los.
      </p>

      <PainelDashboard chave="dashboard-loja" widgets={widgets} periodosPadrao={PERIODOS_PADRAO} esqueleto={ESQUELETO} />

      <p><Link to="/admin/pedidos">Ver todos os pedidos →</Link></p>
    </div>
  )
}
