import { useEffect, useState } from 'react'
import { Tooltip } from 'primereact/tooltip'
import { useAuth } from '../../context/AuthContext'
import { obterVendasPorHora } from '../../api/pedidosApi'
import { dispatchMsgError } from '../../store/dispatchMsg'
import { Skeleton } from '../Skeleton'
import { formatarMoeda } from '../../utils/formatadores'
import { periodoParaIso } from '../../utils/periodo'

/** Gráfico de barras das vendas por hora do dia no período (sem biblioteca: a altura da barra é o valor vendido). */
export default function VendasPorHora({ periodo }) {
  const { loja } = useAuth()
  const [horas, setHoras] = useState(null)
  const { inicio, fim } = periodoParaIso(periodo)

  useEffect(() => {
    let descartada = false
    setHoras(null)
    obterVendasPorHora(loja.tenant, inicio, fim)
      .then((dados) => !descartada && setHoras(dados))
      .catch((e) => dispatchMsgError(e.mensagem))
    return () => { descartada = true }
  }, [loja.tenant, inicio, fim])

  if (!horas) return <Skeleton altura="10rem" />

  const maximo = Math.max(...horas.map((h) => Number(h.valor)), 1)
  const total = horas.reduce((soma, h) => soma + Number(h.valor), 0)
  const pico = horas.reduce((melhor, h) => (Number(h.valor) > Number(melhor.valor) ? h : melhor), horas[0])

  if (total === 0) return <p className="texto-auxiliar">Nenhuma venda no período.</p>

  return (
    <div className="vendas-hora">
      <Tooltip target=".vendas-hora__coluna" position="top" />
      <p className="vendas-hora__resumo">
        Pico às <strong>{String(pico.hora).padStart(2, '0')}h</strong> · {pico.pedidos} pedido(s) · {formatarMoeda(pico.valor)}
      </p>
      <div className="vendas-hora__barras" role="img" aria-label="Vendas por hora do dia">
        {horas.map((h) => (
          <div key={h.hora} className={`vendas-hora__coluna${h.hora === pico.hora ? ' vendas-hora__coluna--pico' : ''}`}
               data-pr-tooltip={`${String(h.hora).padStart(2, '0')}h: ${h.pedidos} pedido(s), ${formatarMoeda(h.valor)}`}>
            <span style={{ height: `${Math.max(2, (Number(h.valor) / maximo) * 100)}%` }} />
            {h.hora % 3 === 0 && <small>{String(h.hora).padStart(2, '0')}</small>}
          </div>
        ))}
      </div>
    </div>
  )
}
