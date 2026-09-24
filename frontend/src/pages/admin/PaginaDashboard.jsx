import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { dispatchMsgError } from '../../store/dispatchMsg'
import { listarPedidosDaLoja } from '../../api/adminApi'
import PainelDashboard from '../../components/dashboard/PainelDashboard'
import { Skeleton } from '../../components/Skeleton'
import { formatarMoeda } from '../../utils/formatadores'
import { periodoParaIso } from '../../utils/periodo'

const EM_ANDAMENTO = ['PENDENTE', 'CONFIRMADO', 'EM_PREPARO', 'SAIU_PARA_ENTREGA']
const PERIODOS_PADRAO = { pedidos: { preset: 'hoje' } }
const ESQUELETO = { cartoes: 4, blocos: 0 }

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

/** Tela padrao do painel: resumo da loja selecionada (pedidos do periodo escolhido, hoje por padrao). */
export default function PaginaDashboard() {
  const { loja, usuarioLogado } = useAuth()
  const [pedidos, setPedidos] = useState(null)
  const [erro, setErro] = useState(null)

  useEffect(() => {
    listarPedidosDaLoja(loja.tenant)
      .then(setPedidos)
      .catch((e) => {
        setErro(e.mensagem)
        dispatchMsgError(e.mensagem)
      })
  }, [loja.tenant])

  const carregando = pedidos === null && !erro

  const widgets = useMemo(() => {
    // pedidos criados dentro do periodo (datas ISO comparam como texto)
    const noPeriodo = (periodo) => {
      const { inicio, fim } = periodoParaIso(periodo)
      return (pedidos ?? []).filter((p) => {
        const dia = String(p.dataCriacao).slice(0, 10)
        return dia >= inicio && dia <= fim
      })
    }
    const dicaPeriodo = 'Use o menu "..." para filtrar o período: no máximo 90 dias.'
    return [
      {
        id: 'pedidos',
        tamanho: 'cartao',
        periodo: 'pedidos',
        dica: `Pedidos criados no período escolhido (hoje por padrão). ${dicaPeriodo}`,
        conteudo: (ctx) => {
          const periodo = ctx.periodo('pedidos')
          return <ConteudoCartao rotulo="Pedidos" valor={noPeriodo(periodo).length} apoio={periodo.rotulo}
                                 icone="fa-solid fa-receipt" carregando={carregando} />
        },
      },
      {
        id: 'em-andamento',
        tamanho: 'cartao',
        dica: 'Pedidos que ainda estão sendo atendidos agora (pendentes, confirmados, em preparo ou em entrega), de qualquer dia.',
        conteudo: () => (
          <ConteudoCartao rotulo="Em andamento" valor={(pedidos ?? []).filter((p) => EM_ANDAMENTO.includes(p.status)).length}
                          icone="fa-solid fa-fire-burner" carregando={carregando} />
        ),
      },
      {
        id: 'entregues',
        tamanho: 'cartao',
        periodo: 'pedidos',
        dica: `Pedidos entregues entre os criados no período escolhido. ${dicaPeriodo}`,
        conteudo: (ctx) => {
          const periodo = ctx.periodo('pedidos')
          return <ConteudoCartao rotulo="Entregues" valor={noPeriodo(periodo).filter((p) => p.status === 'ENTREGUE').length}
                                 apoio={periodo.rotulo} icone="fa-solid fa-circle-check" carregando={carregando} />
        },
      },
      {
        id: 'faturamento',
        tamanho: 'cartao',
        periodo: 'pedidos',
        dica: `Soma dos pedidos entregues criados no período escolhido. ${dicaPeriodo}`,
        conteudo: (ctx) => {
          const periodo = ctx.periodo('pedidos')
          const entregues = noPeriodo(periodo).filter((p) => p.status === 'ENTREGUE')
          return <ConteudoCartao rotulo="Faturamento" valor={formatarMoeda(entregues.reduce((soma, p) => soma + Number(p.total), 0))}
                                 apoio={periodo.rotulo} icone="fa-solid fa-sack-dollar" carregando={carregando} />
        },
      },
    ]
  }, [pedidos, carregando])

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
