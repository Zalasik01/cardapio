import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { obterDashboardGestao, obterRecebimentos } from '../../api/gestaoDashboardApi'
import PainelDashboard from '../../components/dashboard/PainelDashboard'
import { Skeleton } from '../../components/Skeleton'
import { dispatchMsgError } from '../../store/dispatchMsg'
import { formatarMoeda, isoParaData } from '../../utils/formatadores'
import { rotuloSituacaoConta, rotuloTipoOrganizacao } from '../../utils/loja'
import { periodoParaIso } from '../../utils/periodo'

const formatarData = (iso) => isoParaData(iso).toLocaleDateString('pt-BR')
const nomeMes = (iso) => isoParaData(iso).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })

/** Conteúdo de um cartão de número: ícone, rótulo, valor e uma linha de apoio. */
function ConteudoCartao({ rotulo, valor, apoio, icone, carregando }) {
  return (
    <div className="cartao-resumo">
      <span className="cartao-resumo__icone" aria-hidden="true"><i className={icone} /></span>
      <div>
        <span className="cartao-resumo__rotulo">{rotulo}</span>
        {carregando ? <Skeleton largura="70px" altura="1.6rem" /> : <strong className="cartao-resumo__valor">{valor}</strong>}
        {carregando ? <Skeleton largura="90%" altura="0.7rem" /> : apoio && <small className="cartao-resumo__apoio">{apoio}</small>}
      </div>
    </div>
  )
}

/** Barras horizontais proporcionais ao maior valor (quantidade por categoria). */
function Barras({ itens, rotulo, carregando }) {
  if (carregando) {
    return (
      <div className="barras" aria-busy="true">
        {[80, 55, 30].map((largura) => <Skeleton key={largura} altura="1.4rem" raio="3px" largura={`${largura}%`} />)}
      </div>
    )
  }
  if (!itens.length) return <p className="texto-auxiliar">Sem dados.</p>
  const maior = Math.max(...itens.map((item) => item.quantidade))
  return (
    <ul className="barras">
      {itens.map((item) => (
        <li key={item.chave} className="barra">
          <span className="barra__rotulo">{rotulo(item.chave)}</span>
          <span className="barra__trilha">
            <span className="barra__preenchimento" style={{ width: `${(item.quantidade / maior) * 100}%` }} />
          </span>
          <strong className="barra__valor">{item.quantidade}</strong>
        </li>
      ))}
    </ul>
  )
}

/** Lista de mensalidades (próximos vencimentos ou atrasadas) com atalho para a loja. */
function ListaVencimentos({ itens, carregando, vazio }) {
  if (carregando) {
    return <div className="barras" aria-busy="true">{[1, 2, 3].map((i) => <Skeleton key={i} altura="1.4rem" raio="3px" />)}</div>
  }
  if (!itens.length) return <p className="texto-auxiliar">{vazio}</p>
  return (
    <ul className="vencimentos">
      {itens.map((item) => (
        <li key={`${item.lojaId}-${item.competencia}`}>
          <Link to={`/admin/gestao-lojas/${item.lojaId}`}>{item.lojaNome}</Link>
          <span>{formatarData(item.dataVencimento)}</span>
          <strong>{formatarMoeda(item.valor)}</strong>
        </li>
      ))}
    </ul>
  )
}

/** Widget de período: mensalidades pagas entre inicio e fim (busca de novo quando o período muda). */
function CartaoRecebimentos({ periodo }) {
  const [dados, setDados] = useState(null)
  const inicio = periodoParaIso(periodo).inicio
  const fim = periodoParaIso(periodo).fim

  useEffect(() => {
    let descartada = false
    setDados(null)
    obterRecebimentos(inicio, fim)
      .then((resposta) => !descartada && setDados(resposta))
      .catch((e) => dispatchMsgError(e.mensagem))
    return () => {
      descartada = true
    }
  }, [inicio, fim])

  return (
    <ConteudoCartao
      rotulo="Recebimentos no período"
      valor={dados && formatarMoeda(dados.total)}
      apoio={dados && `${dados.quantidade} mensalidade(s) paga(s) · ${periodo.rotulo}`}
      icone="fa-solid fa-calendar-check"
      carregando={dados === null}
    />
  )
}

const PERIODOS_PADRAO = { recebimentos: { preset: 'ultimos-30' } }
const ESQUELETO = { cartoes: 8, blocos: 4 }

/** Gestão Interna > Dashboards: números da plataforma (somente usuário administrador). */
export default function PaginaGestaoDashboard() {
  const [dados, setDados] = useState(null)
  const [erro, setErro] = useState(false)

  useEffect(() => {
    obterDashboardGestao()
      .then(setDados)
      .catch((e) => {
        setErro(true)
        dispatchMsgError(e.mensagem)
      })
  }, [])

  const carregando = dados === null && !erro

  const widgets = useMemo(() => {
    const { lojas, mensalidades, usuarios } = dados ?? { lojas: {}, mensalidades: {}, usuarios: {} }
    const cartao = (id, dica, props) => ({
      id, tamanho: 'cartao', dica, conteudo: () => <ConteudoCartao {...props} carregando={carregando} />,
    })
    return [
      cartao('lojas', 'Total de lojas cadastradas (não excluídas). Inativas não aparecem nas listas por padrão.', {
        rotulo: 'Lojas', valor: lojas.total, apoio: `${lojas.ativas} ativas · ${lojas.inativas} inativas`, icone: 'fa-solid fa-store',
      }),
      cartao('receita-recorrente', 'Soma da mensalidade padrão das lojas ativas com conta ATIVA: quanto a plataforma deveria faturar por mês.', {
        rotulo: 'Receita recorrente', valor: formatarMoeda(mensalidades.receitaRecorrente),
        apoio: 'Mensalidades das lojas com conta ativa', icone: 'fa-solid fa-sack-dollar',
      }),
      cartao('recebido-mes', 'Mensalidades do mês corrente já pagas. Embaixo, o total previsto (pagas + pendentes do mês).', {
        rotulo: 'Recebido no mês', valor: formatarMoeda(mensalidades.recebido),
        apoio: `de ${formatarMoeda(mensalidades.previsto)} previstos`, icone: 'fa-solid fa-circle-check',
      }),
      cartao('a-receber-mes', 'Mensalidades do mês corrente que ainda estão pendentes de pagamento.', {
        rotulo: 'A receber no mês', valor: formatarMoeda(mensalidades.pendente),
        apoio: mensalidades.competencia && nomeMes(mensalidades.competencia), icone: 'fa-solid fa-hourglass-half',
      }),
      {
        id: 'recebimentos-periodo',
        tamanho: 'cartao',
        periodo: 'recebimentos',
        dica: 'Mensalidades pagas no período escolhido (pela data do pagamento). Use o menu "..." para filtrar o período: no máximo 90 dias.',
        conteudo: (ctx) => <CartaoRecebimentos periodo={ctx.periodo('recebimentos')} />,
      },
      cartao('atrasadas', 'Mensalidades pendentes com o vencimento já passado (de qualquer mês) e o valor somado.', {
        rotulo: 'Mensalidades atrasadas', valor: mensalidades.quantidadeAtrasadas,
        apoio: formatarMoeda(mensalidades.valorAtrasadas), icone: 'fa-solid fa-triangle-exclamation',
      }),
      cartao('sem-mensalidade', 'Lojas ativas, com conta ativa ou inadimplente, que ainda não têm a mensalidade do mês lançada.', {
        rotulo: 'Sem mensalidade no mês', valor: mensalidades.lojasSemLancamento,
        apoio: 'Lojas ativas ou inadimplentes', icone: 'fa-solid fa-file-circle-question',
      }),
      cartao('usuarios-internos', 'Equipe da plataforma: usuários de suporte e administradores. Pendentes ainda não definiram a senha.', {
        rotulo: 'Usuários internos', valor: usuarios.internos,
        apoio: `${usuarios.administradores} administradores · ${usuarios.pendentes} pendentes`, icone: 'fa-solid fa-user-shield',
      }),
      {
        id: 'lojas-situacao', tamanho: 'bloco', titulo: 'Lojas por situação da conta',
        dica: 'Quantas lojas há em cada situação: período de teste, ativa, inadimplente, bloqueada ou cancelada.',
        conteudo: () => <Barras itens={dados?.lojas.porSituacao ?? []} rotulo={rotuloSituacaoConta} carregando={carregando} />,
      },
      {
        id: 'lojas-tipo', tamanho: 'bloco', titulo: 'Lojas por tipo de organização',
        dica: 'Distribuição das lojas por tipo de estabelecimento (restaurante, pizzaria, cafeteria...).',
        conteudo: () => <Barras itens={dados?.lojas.porTipo ?? []} rotulo={rotuloTipoOrganizacao} carregando={carregando} />,
      },
      {
        id: 'proximos-vencimentos', tamanho: 'bloco', titulo: 'Próximos vencimentos',
        dica: 'As 5 próximas mensalidades pendentes a vencer, da mais próxima para a mais distante. Clique na loja para abrir.',
        conteudo: () => (
          <ListaVencimentos itens={dados?.proximosVencimentos ?? []} carregando={carregando} vazio="Nenhuma mensalidade a vencer." />
        ),
      },
      {
        id: 'atrasadas-lista', tamanho: 'bloco', titulo: 'Mensalidades atrasadas',
        dica: 'As 5 mensalidades pendentes vencidas há mais tempo. Clique na loja para registrar o pagamento.',
        conteudo: () => (
          <ListaVencimentos itens={dados?.atrasadas ?? []} carregando={carregando} vazio="Nenhuma mensalidade atrasada." />
        ),
      },
    ]
  }, [dados, carregando])

  return (
    <div className="pagina-admin">
      <h1>Dashboards</h1>
      <p className="texto-auxiliar">
        Números da plataforma: lojas, mensalidades e equipe interna. Arraste os quadros pela alça para reposicioná-los.
      </p>
      <PainelDashboard chave="dashboard-gestao" widgets={widgets} periodosPadrao={PERIODOS_PADRAO} esqueleto={ESQUELETO} />
    </div>
  )
}
