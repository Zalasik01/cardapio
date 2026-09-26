import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useOutletContext } from 'react-router-dom'
import { listarPedidosCliente, obterResumoCliente } from '../../api/clienteApi'
import { obterCarteiraCliente } from '../../api/fidelidadeApi'
import { useCarrinho } from '../../context/CarrinhoContext'
import { useCliente } from '../../context/ClienteContext'
import { formatarMoeda } from '../../utils/formatadores'
import { mascaraTelefone } from '../../utils/telefone'
import EnderecosCliente from '../../components/EnderecosCliente'

const dataHora = (iso) => new Date(iso).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
const mesAno = (iso) => new Date(iso).toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' }).replace('.', '')

const FILTROS = [
  { chave: 'todos', rotulo: 'Todos', vale: () => true },
  { chave: 'andamento', rotulo: 'Em andamento', vale: (p) => !p.concluido && !p.cancelado },
  { chave: 'entregues', rotulo: 'Entregues', vale: (p) => p.concluido },
  { chave: 'cancelados', rotulo: 'Cancelados', vale: (p) => p.cancelado },
]

/** Meus pedidos: perfil e números do cliente na loja, filtros por situação, acompanhamento e "pedir de novo". */
export default function PaginaMeusPedidos() {
  const { cardapio, slug } = useOutletContext()
  const navigate = useNavigate()
  const { cliente, abrirLogin, sair } = useCliente()
  const { adicionarItem } = useCarrinho()
  const [pedidos, setPedidos] = useState(null)
  const [resumo, setResumo] = useState(null)
  const [carteira, setCarteira] = useState(null)
  const [verExtrato, setVerExtrato] = useState(false)
  const [erro, setErro] = useState(null)
  const [aviso, setAviso] = useState(null)
  const [filtro, setFiltro] = useState('todos')

  const produtos = useMemo(() => new Map(cardapio.categorias.flatMap((c) => c.produtos).map((p) => [p.guid, p])), [cardapio])

  useEffect(() => {
    if (!cliente) return
    setPedidos(null)
    listarPedidosCliente(slug).then(setPedidos).catch((e) => setErro(e.mensagem))
    obterResumoCliente(slug).then(setResumo).catch(() => setResumo(null))
    obterCarteiraCliente(slug).then(setCarteira).catch(() => setCarteira(null))
  }, [cliente, slug])

  const contagem = useMemo(
    () => Object.fromEntries(FILTROS.map((f) => [f.chave, (pedidos ?? []).filter(f.vale).length])),
    [pedidos],
  )
  const visiveis = useMemo(() => (pedidos ?? []).filter(FILTROS.find((f) => f.chave === filtro).vale), [pedidos, filtro])

  /** Coloca os itens do pedido antigo na sacola (com os preços de hoje); o que saiu do cardápio fica de fora. */
  function pedirDeNovo(pedido) {
    const indisponiveis = []
    pedido.itens.forEach((item) => {
      const produto = produtos.get(item.produtoGuid)
      if (produto && !produto.indisponivel) adicionarItem(produto, item.quantidade, item.observacoes ?? '')
      else indisponiveis.push(item.nome)
    })
    if (indisponiveis.length > 0) {
      setAviso(`Não estão disponíveis agora: ${indisponiveis.join(', ')}.`)
      if (indisponiveis.length === pedido.itens.length) return
    }
    navigate(`/${slug}/carrinho`)
  }

  return (
    <div className="loja-pagina">
      <header className="loja-pagina__topo">
        <Link to={`/${slug}`} aria-label="Voltar ao cardápio"><i className="fa-solid fa-arrow-left" /></Link>
        <h1>Meu perfil</h1>
      </header>

      {!cliente ? (
        <div className="loja-vazio">
          <i className="fa-solid fa-receipt" aria-hidden="true" />
          <p>Entre com seu telefone para ver seus pedidos.</p>
          <button type="button" className="loja-botao" onClick={() => abrirLogin()}>Entrar</button>
        </div>
      ) : (
        <>
          <section className="cliente-perfil">
            <span className="cliente-perfil__avatar" aria-hidden="true">{(cliente.nome || 'C').charAt(0).toUpperCase()}</span>
            <div>
              <strong>{cliente.nome || 'Cliente'}</strong>
              <small>{mascaraTelefone(cliente.telefone)}</small>
            </div>
            <button type="button" className="loja-link" onClick={sair}>Sair</button>
          </section>

          <EnderecosCliente />

          <section className="cliente-numeros" aria-label="Seus números nesta loja">
            <div><strong>{resumo?.totalPedidos ?? '—'}</strong><small>{resumo?.totalPedidos === 1 ? 'pedido feito' : 'pedidos feitos'}</small></div>
            <div><strong>{resumo ? formatarMoeda(resumo.totalGasto) : '—'}</strong><small>total gasto</small></div>
            <div><strong>{resumo && resumo.totalPedidos > 0 ? formatarMoeda(resumo.ticketMedio) : '—'}</strong><small>ticket médio</small></div>
            <div><strong>{resumo?.clienteDesde ? mesAno(resumo.clienteDesde) : '—'}</strong><small>cliente desde</small></div>
          </section>

          {carteira?.ativo && (
            <section className="cliente-carteira">
              <div>
                <small>Seu cashback</small>
                <strong>{formatarMoeda(carteira.saldo)}</strong>
                {carteira.proximoVencimento && (
                  <small>{formatarMoeda(carteira.proximoVencimento.valor)} vence em {new Date(carteira.proximoVencimento.data).toLocaleDateString('pt-BR')}</small>
                )}
              </div>
              <p>Ganhe <strong>{String(carteira.percentual).replace('.00', '').replace('.', ',')}%</strong> de volta a cada pedido entregue e use no próximo
                {Number(carteira.resgateMinimo) > 0 && ` (a partir de ${formatarMoeda(carteira.resgateMinimo)})`}.</p>
              {carteira.extrato.length > 0 && (
                <>
                  <button type="button" className="loja-link" onClick={() => setVerExtrato((v) => !v)} aria-expanded={verExtrato}>
                    {verExtrato ? 'Ocultar extrato' : 'Ver extrato'}
                  </button>
                  {verExtrato && (
                    <ul className="cliente-carteira__extrato">
                      {carteira.extrato.map((l, i) => (
                        <li key={i}>
                          <span>{l.tipo === 'GANHO' ? 'Cashback recebido' : l.tipo === 'RESGATE' ? 'Usado no pedido' : 'Devolvido (pedido cancelado)'}{l.pedido ? ` · #${l.pedido}` : ''}</span>
                          <strong className={Number(l.valor) < 0 ? 'negativo' : 'positivo'}>{Number(l.valor) > 0 ? '+' : ''}{formatarMoeda(l.valor)}</strong>
                        </li>
                      ))}
                    </ul>
                  )}
                </>
              )}
            </section>
          )}

          {resumo?.favorito && (
            <p className="cliente-favorito"><i className="fa-solid fa-heart" aria-hidden="true" /> Seu favorito: <strong>{resumo.favorito}</strong></p>
          )}

          {aviso && <p className="loja-aviso" role="status"><i className="fa-solid fa-triangle-exclamation" aria-hidden="true" /><span>{aviso}</span></p>}
          {erro && <p className="loja__erro" role="alert">{erro}</p>}

          {pedidos?.length > 0 && (
            <div className="cliente-filtros" role="tablist" aria-label="Filtrar pedidos">
              {FILTROS.filter((f) => f.chave === 'todos' || contagem[f.chave] > 0).map((f) => (
                <button key={f.chave} type="button" role="tab" aria-selected={filtro === f.chave} className={filtro === f.chave ? 'ativo' : ''}
                        onClick={() => setFiltro(f.chave)}>
                  {f.rotulo} <span>{contagem[f.chave]}</span>
                </button>
              ))}
            </div>
          )}

          {pedidos === null && !erro && (
            <ul className="loja-historico" aria-busy="true" aria-label="Carregando pedidos">
              {[0, 1].map((i) => <li key={i} className="loja-historico__pedido loja-historico__pedido--esqueleto" />)}
            </ul>
          )}
          {pedidos?.length === 0 && (
            <div className="loja-vazio">
              <i className="fa-solid fa-bowl-food" aria-hidden="true" />
              <p>Você ainda não fez pedidos nesta loja.</p>
              <Link className="loja-botao" to={`/${slug}`}>Ver o cardápio</Link>
            </div>
          )}

          <ul className="loja-historico">
            {visiveis.map((p) => (
              <li key={p.guid} className={`loja-historico__pedido${p.cancelado ? ' loja-historico__pedido--cancelado' : ''}`} style={{ '--cor-selo': p.cancelado ? '#78716c' : p.concluido ? '#15803d' : '#dc2626' }}>
                <header>
                  <strong>Pedido {p.numero}</strong>
                  <span className="loja-historico__situacao">{p.situacao}</span>
                </header>
                <small>
                  <i className="fa-regular fa-calendar" aria-hidden="true" /> {dataHora(p.data)} ·{' '}
                  <i className={`fa-solid ${p.tipoEntrega === 'ENTREGA' ? 'fa-motorcycle' : 'fa-store'}`} aria-hidden="true" /> {p.tipoEntrega === 'ENTREGA' ? 'Entrega' : 'Retirada'}
                </small>
                <ul>
                  {p.itens.map((i, idx) => <li key={idx}><span>{i.quantidade}x</span> {i.nome}</li>)}
                </ul>
                <footer>
                  <strong>{formatarMoeda(p.total)}</strong>
                  <span>
                    {!p.cancelado && <Link className="loja-botao loja-botao--sec loja-botao--pequeno" to={`/pedido/${p.guid}`}>Acompanhar</Link>}
                    {cardapio.aberta && p.concluido && (
                      <button type="button" className="loja-botao loja-botao--pequeno" onClick={() => pedirDeNovo(p)}>
                        <i className="fa-solid fa-rotate-right" aria-hidden="true" /> Pedir de novo
                      </button>
                    )}
                  </span>
                </footer>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  )
}
