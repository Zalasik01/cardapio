import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { obterDashboardGestao } from '../../api/gestaoDashboardApi'
import Dica from '../../components/Dica'
import { Skeleton } from '../../components/Skeleton'
import { dispatchMsgError } from '../../store/dispatchMsg'
import { formatarMoeda, isoParaData } from '../../utils/formatadores'
import { rotuloSituacaoConta, rotuloTipoOrganizacao } from '../../utils/loja'

const formatarData = (iso) => isoParaData(iso).toLocaleDateString('pt-BR')
const nomeMes = (iso) => isoParaData(iso).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })

/** Cartão de número: rótulo, valor e uma linha de apoio opcional. */
function Cartao({ rotulo, valor, apoio, icone, dica, carregando }) {
  return (
    <div className="cartao-resumo">
      <Dica texto={dica} />
      <span className="cartao-resumo__icone" aria-hidden="true"><i className={icone} /></span>
      <div>
        <span className="cartao-resumo__rotulo">{rotulo}</span>
        {carregando ? <Skeleton largura="70px" altura="1.6rem" /> : <strong className="cartao-resumo__valor">{valor}</strong>}
        {!carregando && apoio && <small className="cartao-resumo__apoio">{apoio}</small>}
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
  const { lojas, mensalidades, usuarios } = dados ?? { lojas: {}, mensalidades: {}, usuarios: {} }

  const cartoes = [
    {
      rotulo: 'Lojas',
      valor: lojas.total,
      apoio: `${lojas.ativas} ativas · ${lojas.inativas} inativas`,
      icone: 'fa-solid fa-store',
      dica: 'Total de lojas cadastradas (não excluídas). Inativas não aparecem nas listas por padrão.',
    },
    {
      rotulo: 'Receita recorrente',
      valor: formatarMoeda(mensalidades.receitaRecorrente),
      apoio: 'Mensalidades das lojas com conta ativa',
      icone: 'fa-solid fa-sack-dollar',
      dica: 'Soma da mensalidade padrão das lojas ativas com conta ATIVA: quanto a plataforma deveria faturar por mês.',
    },
    {
      rotulo: 'Recebido no mês',
      valor: formatarMoeda(mensalidades.recebido),
      apoio: `de ${formatarMoeda(mensalidades.previsto)} previstos`,
      icone: 'fa-solid fa-circle-check',
      dica: 'Mensalidades do mês corrente já pagas. Embaixo, o total previsto (pagas + pendentes do mês).',
    },
    {
      rotulo: 'A receber no mês',
      valor: formatarMoeda(mensalidades.pendente),
      apoio: mensalidades.competencia && nomeMes(mensalidades.competencia),
      icone: 'fa-solid fa-hourglass-half',
      dica: 'Mensalidades do mês corrente que ainda estão pendentes de pagamento.',
    },
    {
      rotulo: 'Mensalidades atrasadas',
      valor: mensalidades.quantidadeAtrasadas,
      apoio: formatarMoeda(mensalidades.valorAtrasadas),
      icone: 'fa-solid fa-triangle-exclamation',
      dica: 'Mensalidades pendentes com o vencimento já passado (de qualquer mês) e o valor somado.',
    },
    {
      rotulo: 'Sem mensalidade no mês',
      valor: mensalidades.lojasSemLancamento,
      apoio: 'Lojas ativas ou inadimplentes',
      icone: 'fa-solid fa-file-circle-question',
      dica: 'Lojas ativas, com conta ativa ou inadimplente, que ainda não têm a mensalidade do mês lançada.',
    },
    {
      rotulo: 'Usuários internos',
      valor: usuarios.internos,
      apoio: `${usuarios.administradores} administradores · ${usuarios.pendentes} pendentes`,
      icone: 'fa-solid fa-user-shield',
      dica: 'Equipe da plataforma: usuários de suporte e administradores. Pendentes ainda não definiram a senha.',
    },
  ]

  return (
    <div className="pagina-admin">
      <h1>Dashboards</h1>
      <p className="texto-auxiliar">Números da plataforma: lojas, mensalidades e equipe interna.</p>

      <div className="cartoes-resumo" aria-busy={carregando}>
        {cartoes.map((cartao) => <Cartao key={cartao.rotulo} {...cartao} carregando={carregando} />)}
      </div>

      <div className="blocos-dashboard">
        <section className="bloco-dashboard">
          <h2>
            Lojas por situação da conta
            <Dica texto="Quantas lojas há em cada situação: período de teste, ativa, inadimplente, bloqueada ou cancelada." />
          </h2>
          <Barras itens={dados?.lojas.porSituacao ?? []} rotulo={rotuloSituacaoConta} carregando={carregando} />
        </section>
        <section className="bloco-dashboard">
          <h2>
            Lojas por tipo de organização
            <Dica texto="Distribuição das lojas por tipo de estabelecimento (restaurante, pizzaria, cafeteria...)." />
          </h2>
          <Barras itens={dados?.lojas.porTipo ?? []} rotulo={rotuloTipoOrganizacao} carregando={carregando} />
        </section>
        <section className="bloco-dashboard">
          <h2>
            Próximos vencimentos
            <Dica texto="As 5 próximas mensalidades pendentes a vencer, da mais próxima para a mais distante. Clique na loja para abrir." />
          </h2>
          <ListaVencimentos itens={dados?.proximosVencimentos ?? []} carregando={carregando}
                            vazio="Nenhuma mensalidade a vencer." />
        </section>
        <section className="bloco-dashboard">
          <h2>
            Mensalidades atrasadas
            <Dica texto="As 5 mensalidades pendentes vencidas há mais tempo. Clique na loja para registrar o pagamento." />
          </h2>
          <ListaVencimentos itens={dados?.atrasadas ?? []} carregando={carregando}
                            vazio="Nenhuma mensalidade atrasada." />
        </section>
      </div>
    </div>
  )
}
