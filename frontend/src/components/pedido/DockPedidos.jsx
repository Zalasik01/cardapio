import { useEffect, useMemo, useState } from 'react'
import { Button } from 'primereact/button'
import { Dropdown } from 'primereact/dropdown'
import { InputText } from 'primereact/inputtext'
import { InputTextarea } from 'primereact/inputtextarea'
import { SelectButton } from 'primereact/selectbutton'
import { Tooltip } from 'primereact/tooltip'
import { useAuth } from '../../context/AuthContext'
import { useChatPedidos } from '../../context/ChatPedidosContext'
import { calcularFrete } from '../../api/cardapioApi'
import { criarPedido, obterProdutosParaPedido } from '../../api/pedidosApi'
import { dispatchMsgError, dispatchMsgSuccess, dispatchMsgWarn } from '../../store/dispatchMsg'
import { formatarMoeda } from '../../utils/formatadores'
import { TIPOS_ENTREGA } from '../../utils/pedido'

const PERMISSOES_CRIAR = ['PEDIDOS_INCLUIR', 'PAINEL_PEDIDOS_INCLUIR']

/** Título da janela: o cliente, quando já foi informado. */
const tituloDe = (rascunho, indice) => (rascunho.nomeCliente.trim() ? rascunho.nomeCliente.trim() : `Novo pedido ${indice + 1}`)

/** Uma janela de pedido em andamento (formulário compacto, estilo bate-papo). */
function JanelaPedido({ janela, indice, produtos }) {
  const { loja } = useAuth()
  const { fechar, alternar, atualizar } = useChatPedidos()
  const { rascunho } = janela
  const [frete, setFrete] = useState(null) // { entregavel, taxa, mensagem } do bairro informado
  const [enviando, setEnviando] = useState(false)
  const definir = (campo) => (valor) => atualizar(janela.id, { [campo]: valor })
  const entrega = rascunho.tipoEntrega === 'ENTREGA'

  const subtotal = rascunho.itens.reduce((soma, item) => soma + item.preco * item.quantidade, 0)
  const taxa = entrega && frete?.entregavel ? Number(frete.taxa) : 0

  // a taxa depende do bairro: consulta quando o bairro muda (com uma pausa enquanto digita)
  useEffect(() => {
    if (!entrega || !rascunho.enderecoBairro.trim()) {
      setFrete(null)
      return undefined
    }
    const espera = setTimeout(() => {
      calcularFrete({ tenant: loja.tenant, bairro: rascunho.enderecoBairro.trim() })
        .then(setFrete)
        .catch(() => setFrete(null))
    }, 500)
    return () => clearTimeout(espera)
  }, [entrega, rascunho.enderecoBairro, loja.tenant])

  function adicionarProduto(guid) {
    const produto = produtos.find((p) => p.guid === guid)
    if (!produto) return
    const existente = rascunho.itens.find((i) => i.guid === guid)
    definir('itens')(existente
      ? rascunho.itens.map((i) => (i.guid === guid ? { ...i, quantidade: i.quantidade + 1 } : i))
      : [...rascunho.itens, { guid, nome: produto.nome, preco: Number(produto.preco), quantidade: 1 }])
  }

  function mudarQuantidade(guid, delta) {
    definir('itens')(rascunho.itens
      .map((i) => (i.guid === guid ? { ...i, quantidade: i.quantidade + delta } : i))
      .filter((i) => i.quantidade > 0))
  }

  async function enviar() {
    if (!rascunho.nomeCliente.trim() || !rascunho.telefoneCliente.trim()) {
      dispatchMsgWarn('Informe o nome e o telefone do cliente.')
      return
    }
    if (rascunho.itens.length === 0) {
      dispatchMsgWarn('Adicione ao menos um item ao pedido.')
      return
    }
    if (entrega && (!rascunho.enderecoRua.trim() || !rascunho.enderecoBairro.trim())) {
      dispatchMsgWarn('Informe a rua e o bairro da entrega.')
      return
    }
    setEnviando(true)
    try {
      const pedido = await criarPedido(loja.tenant, {
        nomeCliente: rascunho.nomeCliente.trim(),
        telefoneCliente: rascunho.telefoneCliente.trim(),
        tipoEntrega: rascunho.tipoEntrega,
        enderecoRua: entrega ? rascunho.enderecoRua.trim() : null,
        enderecoNumero: entrega ? rascunho.enderecoNumero.trim() : null,
        enderecoComplemento: entrega ? rascunho.enderecoComplemento.trim() : null,
        enderecoBairro: entrega ? rascunho.enderecoBairro.trim() : null,
        enderecoCidade: entrega ? rascunho.enderecoCidade.trim() : null,
        formaPagamento: rascunho.formaPagamento.trim() || null,
        observacoes: rascunho.observacoes.trim() || null,
        itens: rascunho.itens.map((i) => ({ produtoGuid: i.guid, quantidade: i.quantidade })),
      })
      dispatchMsgSuccess(`Pedido ${pedido.id} criado com sucesso`)
      fechar(janela.id)
    } catch (e) {
      dispatchMsgError(e.mensagem)
    } finally {
      setEnviando(false)
    }
  }

  return (
    <section className={`dock-janela${janela.minimizada ? ' dock-janela--minimizada' : ''}`} aria-label={tituloDe(rascunho, indice)}>
      <header className="dock-janela__topo">
        <button type="button" className="dock-janela__titulo" onClick={() => alternar(janela.id)}
                aria-expanded={!janela.minimizada}>
          <i className="fa-solid fa-receipt" aria-hidden="true" /> {tituloDe(rascunho, indice)}
          {rascunho.itens.length > 0 && <span className="dock-janela__contagem">{rascunho.itens.length}</span>}
        </button>
        <button type="button" className="dock-janela__botao" aria-label={janela.minimizada ? 'Expandir' : 'Minimizar'}
                onClick={() => alternar(janela.id)}>
          <i className={janela.minimizada ? 'fa-solid fa-chevron-up' : 'fa-solid fa-minus'} aria-hidden="true" />
        </button>
        <button type="button" className="dock-janela__botao" aria-label="Fechar e descartar o pedido" onClick={() => fechar(janela.id)}>
          <i className="fa-solid fa-xmark" aria-hidden="true" />
        </button>
      </header>

      {!janela.minimizada && (
        <>
          <div className="dock-janela__corpo">
            <InputText placeholder="Nome do cliente *" value={rascunho.nomeCliente} maxLength={255}
                       onChange={(e) => definir('nomeCliente')(e.target.value)} />
            <InputText placeholder="Telefone *" value={rascunho.telefoneCliente} maxLength={20} inputMode="tel"
                       onChange={(e) => definir('telefoneCliente')(e.target.value)} />
            <SelectButton value={rascunho.tipoEntrega} options={TIPOS_ENTREGA} optionLabel="rotulo" optionValue="valor"
                          allowEmpty={false} onChange={(e) => definir('tipoEntrega')(e.value)} />
            {entrega && (
              <div className="dock-janela__grade">
                <InputText className="dock-janela__larga" placeholder="Rua *" value={rascunho.enderecoRua}
                           onChange={(e) => definir('enderecoRua')(e.target.value)} />
                <InputText placeholder="Nº" value={rascunho.enderecoNumero}
                           onChange={(e) => definir('enderecoNumero')(e.target.value)} />
                <InputText placeholder="Bairro *" value={rascunho.enderecoBairro}
                           onChange={(e) => definir('enderecoBairro')(e.target.value)} />
                <InputText placeholder="Cidade" value={rascunho.enderecoCidade}
                           onChange={(e) => definir('enderecoCidade')(e.target.value)} />
                <InputText className="dock-janela__larga" placeholder="Complemento" value={rascunho.enderecoComplemento}
                           onChange={(e) => definir('enderecoComplemento')(e.target.value)} />
                {frete && (
                  <small className={frete.entregavel ? 'dock-janela__frete' : 'dock-janela__frete dock-janela__frete--erro'}>
                    {frete.entregavel ? `Taxa de entrega: ${formatarMoeda(frete.taxa)}` : frete.mensagem}
                  </small>
                )}
              </div>
            )}

            <Dropdown value={null} options={produtos} optionLabel="nome" optionValue="guid" filter
                      placeholder="Adicionar item" emptyMessage="Nenhum produto" emptyFilterMessage="Nenhum produto"
                      itemTemplate={(p) => <span>{p.nome} <small className="dock-janela__preco">{formatarMoeda(p.preco)}</small></span>}
                      onChange={(e) => adicionarProduto(e.value)} />
            {rascunho.itens.length > 0 && (
              <ul className="dock-janela__itens">
                {rascunho.itens.map((item) => (
                  <li key={item.guid}>
                    <span className="dock-janela__item-nome">{item.nome}</span>
                    <span className="dock-janela__qtd">
                      <button type="button" aria-label={`Diminuir ${item.nome}`} onClick={() => mudarQuantidade(item.guid, -1)}>
                        <i className={item.quantidade === 1 ? 'fa-solid fa-trash' : 'fa-solid fa-minus'} aria-hidden="true" />
                      </button>
                      {item.quantidade}
                      <button type="button" aria-label={`Aumentar ${item.nome}`} onClick={() => mudarQuantidade(item.guid, 1)}>
                        <i className="fa-solid fa-plus" aria-hidden="true" />
                      </button>
                    </span>
                    <span className="dock-janela__item-total">{formatarMoeda(item.preco * item.quantidade)}</span>
                  </li>
                ))}
              </ul>
            )}

            <InputText placeholder="Forma de pagamento" value={rascunho.formaPagamento} maxLength={100}
                       onChange={(e) => definir('formaPagamento')(e.target.value)} />
            <InputTextarea placeholder="Observações" rows={2} autoResize value={rascunho.observacoes}
                           onChange={(e) => definir('observacoes')(e.target.value)} />
          </div>
          <footer className="dock-janela__rodape">
            <span className="dock-janela__total">
              Total <strong>{formatarMoeda(subtotal + taxa)}</strong>
            </span>
            <Button type="button" size="small" label={enviando ? 'Criando...' : 'Criar pedido'} icon="pi pi-check"
                    disabled={enviando} onClick={enviar} />
          </footer>
        </>
      )}
    </section>
  )
}

/**
 * Base da tela do painel: os pedidos que a loja está lançando, como janelas de bate-papo lado a lado (o mais
 * recente à direita), mais o botão redondo "Novo pedido". Só aparece para quem pode criar pedidos.
 */
export default function DockPedidos() {
  const { loja, pode } = useAuth()
  const { janelas, abrirNovo, limiteAtingido } = useChatPedidos()
  const [produtos, setProdutos] = useState([])
  const permitido = pode(...PERMISSOES_CRIAR)
  const temJanelas = janelas.length > 0

  // os produtos só são pedidos quando há alguma janela aberta
  useEffect(() => {
    if (!permitido || !temJanelas) return
    obterProdutosParaPedido(loja.tenant).then(setProdutos).catch((e) => dispatchMsgError(e.mensagem))
  }, [permitido, temJanelas, loja.tenant])

  const janelasVisiveis = useMemo(() => janelas, [janelas])
  if (!permitido) return null

  return (
    <div className="dock-pedidos">
      <Tooltip target=".dock-pedidos__novo" />
      {janelasVisiveis.map((janela, i) => <JanelaPedido key={janela.id} janela={janela} indice={i} produtos={produtos} />)}
      <button type="button" className="dock-pedidos__novo" onClick={() => abrirNovo()} disabled={limiteAtingido}
              aria-label="Novo pedido" data-pr-position="left"
              data-pr-tooltip={limiteAtingido ? 'Feche um pedido para abrir outro' : 'Novo pedido'}>
        <i className="fa-solid fa-plus" aria-hidden="true" />
      </button>
    </div>
  )
}
