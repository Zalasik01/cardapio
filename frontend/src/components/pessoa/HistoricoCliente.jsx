import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { obterPerfilCliente } from '../../api/pessoasApi'
import { SecaoCrud } from '../crud/Campo'
import { Skeleton } from '../Skeleton'
import Estrelas from '../Estrelas'
import { formatarMoeda } from '../../utils/formatadores'

const ROTULOS = { PENDENTE: 'Pendente', CONFIRMADO: 'Confirmado', EM_PREPARO: 'Em preparo', SAIU_PARA_ENTREGA: 'Saiu para entrega', ENTREGUE: 'Entregue', CANCELADO: 'Cancelado' }
const data = (iso) => (iso ? new Date(iso).toLocaleDateString('pt-BR') : '—')

/** Cadastro do cliente > Histórico: números do cliente na loja (pedidos, gasto, avaliação, cashback) e os pedidos recentes. */
export default function HistoricoCliente({ tenant, pessoaId }) {
  const [perfil, setPerfil] = useState(null)
  const [erro, setErro] = useState(null)

  useEffect(() => {
    setPerfil(null)
    obterPerfilCliente(tenant, pessoaId).then(setPerfil).catch((e) => setErro(e.mensagem))
  }, [tenant, pessoaId])

  return (
    <SecaoCrud id="secao-historico" titulo="Histórico na loja">
      {erro && <p className="texto-auxiliar">{erro}</p>}
      {!perfil && !erro && <Skeleton altura="6rem" />}
      {perfil && (
        <>
          <div className="perfil-cliente__numeros">
            <div><strong>{perfil.totalPedidos}</strong><small>pedidos{perfil.cancelados > 0 ? ` (${perfil.cancelados} cancelado${perfil.cancelados > 1 ? 's' : ''})` : ''}</small></div>
            <div><strong>{formatarMoeda(perfil.totalGasto)}</strong><small>total gasto</small></div>
            <div><strong>{perfil.totalPedidos > 0 ? formatarMoeda(perfil.ticketMedio) : '—'}</strong><small>ticket médio</small></div>
            <div><strong>{data(perfil.ultimoPedido)}</strong><small>último pedido</small></div>
            <div><strong>{perfil.cuponsUsados}</strong><small>cupom(ns) usado(s)</small></div>
            <div>
              {perfil.mediaAvaliacoes != null
                ? <><strong>{String(perfil.mediaAvaliacoes).replace('.', ',')}</strong><Estrelas valor={perfil.mediaAvaliacoes} tamanho="0.8rem" rotulo="Média das avaliações" /></>
                : <strong>—</strong>}
              <small>{perfil.avaliacoes} avaliação(ões)</small>
            </div>
            {perfil.temContaApp && <div><strong>{formatarMoeda(perfil.cashback)}</strong><small>cashback</small></div>}
          </div>

          {perfil.pedidos.length === 0 ? (
            <p className="texto-auxiliar">Ainda não há pedidos deste cliente (a busca usa o telefone cadastrado).</p>
          ) : (
            <table className="perfil-cliente__tabela">
              <thead><tr><th>Pedido</th><th>Data</th><th>Tipo</th><th>Situação</th><th>Cupom</th><th className="direita">Total</th></tr></thead>
              <tbody>
                {perfil.pedidos.map((p) => (
                  <tr key={p.id}>
                    <td><Link to={`/admin/pedidos/${p.id}`}>#{p.id}</Link></td>
                    <td>{data(p.data)}</td>
                    <td>{p.tipoEntrega === 'ENTREGA' ? 'Entrega' : 'Retirada'}</td>
                    <td>{ROTULOS[p.status] ?? p.status}</td>
                    <td>{p.cupom ?? '—'}</td>
                    <td className="direita">{formatarMoeda(p.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </>
      )}
    </SecaoCrud>
  )
}
