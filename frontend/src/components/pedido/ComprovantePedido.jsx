import { formatarMoeda, formatarTelefone } from '../../utils/formatadores'
import { rotuloTipoEntrega } from '../../utils/pedido'

const formatarDataHora = (iso) => new Date(iso).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })

/** Linha "rótulo ..... valor" do comprovante. */
const Linha = ({ rotulo, children, forte }) => (
  <div className={`comprovante__par${forte ? ' comprovante__par--forte' : ''}`}>
    <span>{rotulo}</span>
    <span>{children}</span>
  </div>
)

/** Resumo do histórico do cliente: "1º pedido" ou "5º pedido (4 anteriores)". */
function historicoCliente(total) {
  if (total <= 1) return 'Cliente novo (1º pedido)'
  return `${total}º pedido deste cliente (${total - 1} ${total - 1 === 1 ? 'anterior' : 'anteriores'})`
}

/**
 * Comprovante completo do pedido para impressão (80 mm): dados da loja, do pedido, do cliente (com o histórico de
 * pedidos), endereço, itens, valores e pagamento. via muda só o título e destaca os itens na via da cozinha.
 *  - 'COZINHA': itens em letra maior para leitura rápida na produção;
 *  - 'ENTREGA': via para quem entrega ou confere no balcão.
 */
export default function ComprovantePedido({ pedido, via, loja }) {
  const cozinha = via === 'COZINHA'
  const entrega = pedido.tipoEntrega === 'ENTREGA'
  const enderecoLoja = [
    [loja?.enderecoRua, loja?.enderecoNumero].filter(Boolean).join(', '),
    loja?.enderecoBairro, [loja?.enderecoCidade, loja?.enderecoEstado].filter(Boolean).join('/'),
  ].filter(Boolean).join(' - ')
  const totalItens = pedido.itens.reduce((soma, item) => soma + item.quantidade, 0)

  return (
    <article className="comprovante">
      <header className="comprovante__topo">
        <strong className="comprovante__loja">{loja?.nome}</strong>
        {enderecoLoja && <span>{enderecoLoja}</span>}
        {loja?.enderecoCep && <span>CEP {loja.enderecoCep}</span>}
        {loja?.telefone && <span>Tel. {formatarTelefone(loja.telefone)}</span>}
        <span className="comprovante__via">{cozinha ? 'VIA DA COZINHA' : 'VIA DE ENTREGA / CONFERÊNCIA'}</span>
      </header>

      <div className="comprovante__numero">Pedido {pedido.id}</div>
      {pedido.editado && (
        <div className="comprovante__editado">
          <strong>*** PEDIDO EDITADO ***</strong>
          {pedido.alteracoes?.[0]?.descricoes.map((descricao, i) => <div key={i}>{descricao}</div>)}
        </div>
      )}
      <div className="comprovante__destaque">{rotuloTipoEntrega(pedido.tipoEntrega).toUpperCase()}</div>
      <section className="comprovante__bloco">
        <Linha rotulo="Feito em">{formatarDataHora(pedido.dataCriacao)}</Linha>
        {pedido.situacao && <Linha rotulo="Situação">{pedido.situacao.nome}</Linha>}
      </section>

      <section className="comprovante__bloco">
        <div className="comprovante__titulo">CLIENTE</div>
        <div><strong>{pedido.nomeCliente}</strong></div>
        <div>{formatarTelefone(pedido.telefoneCliente)}</div>
        <div className="comprovante__historico">{historicoCliente(pedido.totalPedidosCliente ?? 1)}</div>
      </section>

      {entrega && (
        <section className="comprovante__bloco">
          <div className="comprovante__titulo">ENDEREÇO DE ENTREGA</div>
          <div><strong>{[pedido.enderecoRua, pedido.enderecoNumero].filter(Boolean).join(', ')}</strong></div>
          {pedido.enderecoComplemento && <div>Compl.: {pedido.enderecoComplemento}</div>}
          <div>{pedido.enderecoBairro}</div>
          <div>{pedido.enderecoCidade}</div>
        </section>
      )}

      <section className="comprovante__bloco">
        <div className="comprovante__titulo">ITENS ({totalItens})</div>
        {pedido.itens.map((item, i) => (
          <div key={i} className="comprovante__item">
            <div className={cozinha ? 'comprovante__item-nome comprovante__item-nome--grande' : 'comprovante__item-nome'}>
              <span>{item.quantidade}x {item.nomeProduto}{item.opcoes?.length > 0 && <small> ({item.opcoes.map((o) => o.nome).join(', ')})</small>}</span>
              <span>{formatarMoeda(item.totalItem)}</span>
            </div>
            <div className="comprovante__unit">{item.quantidade} x {formatarMoeda(item.precoUnitario)}</div>
            {item.observacoes && <div className="comprovante__obs">* {item.observacoes}</div>}
          </div>
        ))}
      </section>

      {pedido.observacoes && (
        <section className="comprovante__bloco comprovante__obs-geral">
          <div className="comprovante__titulo">OBSERVAÇÕES DO PEDIDO</div>
          <div>{pedido.observacoes}</div>
        </section>
      )}

      <section className="comprovante__bloco">
        <div className="comprovante__titulo">PAGAMENTO</div>
        <Linha rotulo="Subtotal">{formatarMoeda(pedido.subtotal)}</Linha>
        {Number(pedido.taxaEntrega) > 0 && <Linha rotulo="Taxa de entrega">{formatarMoeda(pedido.taxaEntrega)}</Linha>}
        {Number(pedido.desconto) > 0 && <Linha rotulo="Desconto">- {formatarMoeda(pedido.desconto)}</Linha>}
        {Number(pedido.taxaPagamentos) > 0 && <Linha rotulo="Taxas de pagamento">{formatarMoeda(pedido.taxaPagamentos)}</Linha>}
        <Linha rotulo="TOTAL" forte>{formatarMoeda(pedido.total)}</Linha>
        {pedido.pagamentos?.length > 0 ? pedido.pagamentos.map((pg, i) => (
          <div key={i}>
            <Linha rotulo={pg.forma}>{formatarMoeda(Number(pg.valor) + Number(pg.taxa))}</Linha>
            {pg.valorRecebido != null && (
              <div className="comprovante__unit">Recebido {formatarMoeda(pg.valorRecebido)} · Troco {formatarMoeda(pg.troco)}</div>
            )}
          </div>
        )) : <Linha rotulo="Forma">{pedido.formaPagamento || 'Não informada'}</Linha>}
      </section>

      <footer className="comprovante__rodape">
        Impresso em {formatarDataHora(new Date().toISOString())}
      </footer>
    </article>
  )
}
