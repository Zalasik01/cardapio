import { useEffect, useMemo, useState } from 'react'
import { Button } from 'primereact/button'
import { AutoComplete } from 'primereact/autocomplete'
import { Dropdown } from 'primereact/dropdown'
import { InputNumber } from 'primereact/inputnumber'
import { MultiSelect } from 'primereact/multiselect'
import { InputMask } from 'primereact/inputmask'
import { InputText } from 'primereact/inputtext'
import { InputTextarea } from 'primereact/inputtextarea'
import { SelectButton } from 'primereact/selectbutton'
import { Tooltip } from 'primereact/tooltip'
import { useAuth } from '../../context/AuthContext'
import { useChatPedidos } from '../../context/ChatPedidosContext'
import { calcularFrete } from '../../api/cardapioApi'
import { buscarEnderecoPorCep } from '../../api/cepApi'
import {
  buscarClientesParaPedido, criarPedido, obterFormasPagamentoParaPedido, obterProdutosParaPedido,
} from '../../api/pedidosApi'
import { dispatchMsgError, dispatchMsgSuccess, dispatchMsgWarn } from '../../store/dispatchMsg'
import { formatarMoeda } from '../../utils/formatadores'
import { TIPOS_ENTREGA } from '../../utils/pedido'

const PERMISSOES_CRIAR = ['PEDIDOS_INCLUIR', 'PAINEL_PEDIDOS_INCLUIR']

/** Título da janela: o cliente, quando já foi informado. */
const tituloDe = (rascunho, indice) => (rascunho.nomeCliente.trim() ? rascunho.nomeCliente.trim() : `Novo pedido ${indice + 1}`)

/** Uma janela de pedido em andamento (formulário compacto, estilo bate-papo). */
function JanelaPedido({ janela, indice, produtos, formasPagamento }) {
  const { loja } = useAuth()
  const { fechar, alternar, atualizar } = useChatPedidos()
  const { rascunho } = janela
  const [frete, setFrete] = useState(null) // { entregavel, taxa, mensagem } do bairro informado
  const [enviando, setEnviando] = useState(false)
  const [statusCep, setStatusCep] = useState(null) // texto de apoio da busca do CEP
  const [sugestoesClientes, setSugestoesClientes] = useState([])
  const definir = (campo) => (valor) => atualizar(janela.id, { [campo]: valor })
  const entrega = rascunho.tipoEntrega === 'ENTREGA'

  const subtotal = rascunho.itens.reduce((soma, item) => soma + item.preco * item.quantidade, 0)
  const taxaManual = rascunho.taxaEntrega ?? null // definida na mão pela loja; vazio = usa a da zona de entrega
  const taxaCalculada = frete?.entregavel ? Number(frete.taxa) : null
  const taxa = entrega ? (taxaManual ?? taxaCalculada ?? 0) : 0
  const tipoDesconto = rascunho.descontoTipo ?? 'PERCENTUAL' // rascunhos antigos não têm o campo
  const descontoValor = Number(rascunho.descontoValor) || 0
  const desconto = Math.min(subtotal, tipoDesconto === 'PERCENTUAL' ? (subtotal * descontoValor) / 100 : descontoValor)
  const formasSelecionadas = rascunho.formasPagamento ?? []
  // só aparecem as formas que valem para o tipo do pedido e para o valor dele
  const formasDisponiveis = formasPagamento.filter((f) => (entrega ? f.aceitaEntrega : f.aceitaRetirada)
    && (f.valorMinimo === null || subtotal >= Number(f.valorMinimo)))

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

  /** Sugere clientes cadastrados enquanto o nome é digitado; quem não é cadastrado continua podendo ser digitado. */
  function sugerirClientes(evento) {
    const texto = evento.query.trim()
    if (texto.length < 2) {
      setSugestoesClientes([])
      return
    }
    buscarClientesParaPedido(loja.tenant, texto).then(setSugestoesClientes).catch(() => setSugestoesClientes([]))
  }

  /** Cliente escolhido da lista: traz nome, telefone e endereço do cadastro. */
  function escolherCliente(cliente) {
    atualizar(janela.id, {
      nomeCliente: cliente.nome,
      telefoneCliente: cliente.telefone || rascunho.telefoneCliente,
      cep: cliente.cep || '',
      enderecoRua: cliente.logradouro || '',
      enderecoNumero: cliente.numero || '',
      enderecoComplemento: cliente.complemento || '',
      enderecoBairro: cliente.bairro || '',
      enderecoCidade: cliente.cidade || '',
    })
  }

  /** Com o CEP completo, busca o endereço (ViaCEP) e preenche rua, bairro, cidade e complemento. */
  async function preencherPorCep(cep) {
    setStatusCep('Buscando endereço...')
    try {
      const encontrado = await buscarEnderecoPorCep(cep)
      if (!encontrado) {
        setStatusCep('CEP não encontrado. Preencha o endereço manualmente.')
        return
      }
      atualizar(janela.id, {
        enderecoRua: encontrado.logradouro || rascunho.enderecoRua,
        enderecoBairro: encontrado.bairro || rascunho.enderecoBairro,
        enderecoCidade: encontrado.cidade || rascunho.enderecoCidade,
        enderecoComplemento: encontrado.complemento || rascunho.enderecoComplemento,
      })
      setStatusCep(null)
    } catch {
      setStatusCep('Não foi possível consultar o CEP agora. Preencha o endereço manualmente.')
    }
  }

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
    if (entrega && taxaManual === null && taxaCalculada === null) {
      dispatchMsgWarn('Este bairro não tem taxa de entrega cadastrada: informe a taxa de entrega.')
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
        formaPagamento: formasSelecionadas.length ? formasSelecionadas.join(', ') : null,
        taxaEntrega: entrega ? taxa : null,
        descontoTipo: desconto > 0 ? tipoDesconto : null,
        descontoValor: desconto > 0 ? descontoValor : null,
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
          <i className="fa-solid fa-receipt" aria-hidden="true" />
          <span className="dock-janela__nome">{tituloDe(rascunho, indice)}</span>
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
            <AutoComplete value={rascunho.nomeCliente} suggestions={sugestoesClientes} completeMethod={sugerirClientes}
                          field="nome" delay={300} maxLength={255} placeholder="Nome do cliente *"
                          itemTemplate={(c) => (
                            <span>{c.nome}{c.telefone && <small className="dock-janela__preco"> · {c.telefone}</small>}</span>
                          )}
                          onChange={(e) => typeof e.value === 'string' && definir('nomeCliente')(e.value)}
                          onSelect={(e) => escolherCliente(e.value)} />
            <InputText placeholder="Telefone *" value={rascunho.telefoneCliente} maxLength={20} inputMode="tel"
                       onChange={(e) => definir('telefoneCliente')(e.target.value)} />
            <SelectButton value={rascunho.tipoEntrega} options={TIPOS_ENTREGA} optionLabel="rotulo" optionValue="valor"
                          allowEmpty={false} onChange={(e) => definir('tipoEntrega')(e.value)} />
            {entrega && (
              <div className="dock-janela__grade">
                <InputMask placeholder="CEP" mask="99999-999" autoClear={false} value={rascunho.cep ?? ''}
                           onChange={(e) => definir('cep')(e.target.value ?? '')}
                           onComplete={(e) => preencherPorCep(e.value)} />
                {statusCep && <small className="dock-janela__frete dock-janela__frete--aviso">{statusCep}</small>}
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
                <InputNumber className="dock-janela__larga" value={taxaManual} min={0} mode="currency" currency="BRL"
                             locale="pt-BR"
                             placeholder={taxaCalculada !== null ? `Taxa de entrega: ${formatarMoeda(taxaCalculada)}` : 'Taxa de entrega (R$)'}
                             onValueChange={(e) => definir('taxaEntrega')(e.value ?? null)} />
                {frete && (
                  <small className={frete.entregavel ? 'dock-janela__frete' : 'dock-janela__frete dock-janela__frete--aviso'}>
                    {frete.entregavel
                      ? `Taxa da zona: ${formatarMoeda(frete.taxa)} (você pode alterar acima)`
                      : 'Bairro sem zona de entrega cadastrada: informe a taxa acima.'}
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

            <div className="dock-janela__desconto">
              <span className="dock-janela__rotulo">Desconto</span>
              <SelectButton value={tipoDesconto} options={[{ valor: 'PERCENTUAL', rotulo: '%' }, { valor: 'VALOR', rotulo: 'R$' }]}
                            optionLabel="rotulo" optionValue="valor" allowEmpty={false}
                            onChange={(e) => definir('descontoTipo')(e.value)} />
              {tipoDesconto === 'PERCENTUAL'
                ? <InputNumber value={rascunho.descontoValor} min={0} max={100} suffix="%" maxFractionDigits={2}
                               placeholder="0%" onValueChange={(e) => definir('descontoValor')(e.value)} />
                : <InputNumber value={rascunho.descontoValor} min={0} mode="currency" currency="BRL" locale="pt-BR"
                               placeholder="R$ 0,00" onValueChange={(e) => definir('descontoValor')(e.value)} />}
            </div>
            <MultiSelect value={formasSelecionadas} options={formasDisponiveis} optionLabel="nome" optionValue="nome"
                         placeholder="Formas de pagamento" display="chip" maxSelectedLabels={3}
                         emptyMessage="Nenhuma forma de pagamento cadastrada"
                         onChange={(e) => definir('formasPagamento')(e.value)} />
            <InputTextarea placeholder="Observações" rows={2} autoResize value={rascunho.observacoes}
                           onChange={(e) => definir('observacoes')(e.target.value)} />
          </div>
          <footer className="dock-janela__rodape">
            <span className="dock-janela__total">
              {desconto > 0 && <small>Desconto - {formatarMoeda(desconto)}</small>}
              Total <strong>{formatarMoeda(subtotal - desconto + taxa)}</strong>
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
  const [formasPagamento, setFormasPagamento] = useState([])
  const permitido = pode(...PERMISSOES_CRIAR)
  const temJanelas = janelas.length > 0

  // os produtos só são pedidos quando há alguma janela aberta
  useEffect(() => {
    if (!permitido || !temJanelas) return
    obterProdutosParaPedido(loja.tenant).then(setProdutos).catch((e) => dispatchMsgError(e.mensagem))
    obterFormasPagamentoParaPedido(loja.tenant).then(setFormasPagamento).catch(() => setFormasPagamento([]))
  }, [permitido, temJanelas, loja.tenant])

  const janelasVisiveis = useMemo(() => janelas, [janelas])
  if (!permitido) return null

  return (
    <div className="dock-pedidos">
      <Tooltip target=".dock-pedidos__novo" />
      {janelasVisiveis.map((janela, i) => <JanelaPedido key={janela.id} janela={janela} indice={i} produtos={produtos} formasPagamento={formasPagamento} />)}
      <button type="button" className="dock-pedidos__novo" onClick={() => abrirNovo()} disabled={limiteAtingido}
              aria-label="Novo pedido" data-pr-position="left"
              data-pr-tooltip={limiteAtingido ? 'Feche um pedido para abrir outro' : 'Novo pedido'}>
        <i className="fa-solid fa-plus" aria-hidden="true" />
      </button>
    </div>
  )
}
