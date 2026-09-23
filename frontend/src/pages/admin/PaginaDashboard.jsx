import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { listarPedidosDaLoja } from '../../api/adminApi'
import { Skeleton } from '../../components/Skeleton'
import { formatarMoeda } from '../../utils/formatadores'

const EM_ANDAMENTO = ['PENDENTE', 'CONFIRMADO', 'EM_PREPARO', 'SAIU_PARA_ENTREGA']

function hoje() {
  const agora = new Date()
  const dois = (n) => String(n).padStart(2, '0')
  return `${agora.getFullYear()}-${dois(agora.getMonth() + 1)}-${dois(agora.getDate())}`
}

/** Tela padrao do painel: resumo do dia da loja selecionada. */
export default function PaginaDashboard() {
  const { loja, usuarioLogado } = useAuth()
  const [pedidos, setPedidos] = useState(null)
  const [erro, setErro] = useState(null)

  useEffect(() => {
    listarPedidosDaLoja(loja.tenant)
      .then(setPedidos)
      .catch((e) => setErro(e.mensagem))
  }, [loja.tenant])

  const doDia = (pedidos ?? []).filter((pedido) => String(pedido.dataCriacao).startsWith(hoje()))
  const cartoes = [
    { rotulo: 'Pedidos hoje', valor: doDia.length, icone: 'fa-solid fa-receipt' },
    {
      rotulo: 'Em andamento',
      valor: (pedidos ?? []).filter((pedido) => EM_ANDAMENTO.includes(pedido.status)).length,
      icone: 'fa-solid fa-fire-burner',
    },
    {
      rotulo: 'Entregues hoje',
      valor: doDia.filter((pedido) => pedido.status === 'ENTREGUE').length,
      icone: 'fa-solid fa-circle-check',
    },
    {
      rotulo: 'Faturamento hoje',
      valor: formatarMoeda(
        doDia.filter((pedido) => pedido.status === 'ENTREGUE').reduce((soma, pedido) => soma + Number(pedido.total), 0),
      ),
      icone: 'fa-solid fa-sack-dollar',
    },
  ]

  return (
    <div className="pagina-admin">
      <h1>Visão geral</h1>
      <p className="texto-auxiliar">
        Olá, {usuarioLogado.nome}. Resumo de hoje em <strong>{loja.nome}</strong>.
      </p>

      {erro && <p className="mensagem-erro" role="alert">{erro}</p>}

      <div className="cartoes-resumo" aria-busy={pedidos === null && !erro}>
        {cartoes.map((cartao) => (
          <div key={cartao.rotulo} className="cartao-resumo">
            <span className="cartao-resumo__icone" aria-hidden="true"><i className={cartao.icone} /></span>
            <div>
              <span className="cartao-resumo__rotulo">{cartao.rotulo}</span>
              {pedidos === null && !erro
                ? <Skeleton largura="70px" altura="1.6rem" />
                : <strong className="cartao-resumo__valor">{cartao.valor}</strong>}
            </div>
          </div>
        ))}
      </div>

      <p><Link to="/admin/pedidos">Ver todos os pedidos →</Link></p>
    </div>
  )
}
