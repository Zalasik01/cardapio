import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useOutletContext } from 'react-router-dom'
import { listarPedidosCliente } from '../../api/clienteApi'
import { useCarrinho } from '../../context/CarrinhoContext'
import { useCliente } from '../../context/ClienteContext'
import { formatarMoeda } from '../../utils/formatadores'

const dataHora = (iso) => new Date(iso).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })

/** Meus pedidos: histórico do cliente na loja, com acompanhamento e "pedir de novo". */
export default function PaginaMeusPedidos() {
  const { cardapio, slug } = useOutletContext()
  const navigate = useNavigate()
  const { cliente, abrirLogin, sair } = useCliente()
  const { adicionarItem } = useCarrinho()
  const [pedidos, setPedidos] = useState(null)
  const [erro, setErro] = useState(null)
  const [aviso, setAviso] = useState(null)

  const produtos = useMemo(() => new Map(cardapio.categorias.flatMap((c) => c.produtos).map((p) => [p.guid, p])), [cardapio])

  useEffect(() => {
    if (!cliente) return
    setPedidos(null)
    listarPedidosCliente(slug).then(setPedidos).catch((e) => setErro(e.mensagem))
  }, [cliente, slug])

  /** Coloca os itens do pedido antigo na sacola (com os preços de hoje); o que saiu do cardápio fica de fora. */
  function pedirDeNovo(pedido) {
    const indisponiveis = []
    pedido.itens.forEach((item) => {
      const produto = produtos.get(item.produtoGuid)
      if (produto) adicionarItem(produto, item.quantidade, item.observacoes ?? '')
      else indisponiveis.push(item.nome)
    })
    if (indisponiveis.length > 0) {
      setAviso(`Não estão mais no cardápio: ${indisponiveis.join(', ')}.`)
      if (indisponiveis.length === pedido.itens.length) return
    }
    navigate(`/${slug}/carrinho`)
  }

  return (
    <div className="loja-pagina">
      <header className="loja-pagina__topo">
        <Link to={`/${slug}`} aria-label="Voltar ao cardápio"><i className="fa-solid fa-arrow-left" /></Link>
        <h1>Meus pedidos</h1>
      </header>

      {!cliente ? (
        <div className="loja-vazio">
          <i className="fa-solid fa-receipt" aria-hidden="true" />
          <p>Entre com seu telefone para ver seus pedidos.</p>
          <button type="button" className="loja-botao" onClick={() => abrirLogin()}>Entrar</button>
        </div>
      ) : (
        <>
          <p className="loja-conta">
            <span><i className="fa-solid fa-circle-user" aria-hidden="true" /> {cliente.nome || 'Cliente'} · {cliente.telefone}</span>
            <button type="button" className="loja-link" onClick={sair}>Sair</button>
          </p>
          {aviso && <p className="loja-aviso" role="status"><i className="fa-solid fa-triangle-exclamation" aria-hidden="true" /><span>{aviso}</span></p>}
          {erro && <p className="loja__erro" role="alert">{erro}</p>}
          {pedidos === null && !erro && <p className="loja-vazio">Carregando...</p>}
          {pedidos?.length === 0 && (
            <div className="loja-vazio">
              <i className="fa-solid fa-bowl-food" aria-hidden="true" />
              <p>Você ainda não fez pedidos nesta loja.</p>
              <Link className="loja-botao" to={`/${slug}`}>Ver o cardápio</Link>
            </div>
          )}
          <ul className="loja-historico">
            {pedidos?.map((p) => (
              <li key={p.guid} className="loja-historico__pedido">
                <header>
                  <strong>Pedido {p.numero}</strong>
                  <span className="loja-historico__situacao" style={{ '--cor-selo': p.cor ?? '#6b7280' }}>{p.situacao}</span>
                </header>
                <small>{dataHora(p.data)} · {p.tipoEntrega === 'ENTREGA' ? 'Entrega' : 'Retirada'}</small>
                <ul>
                  {p.itens.map((i, idx) => <li key={idx}>{i.quantidade}x {i.nome}</li>)}
                </ul>
                <footer>
                  <strong>{formatarMoeda(p.total)}</strong>
                  <span>
                    <Link className="loja-botao loja-botao--sec loja-botao--pequeno" to={`/pedido/${p.guid}`}>Acompanhar</Link>
                    {cardapio.aberta && (
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
