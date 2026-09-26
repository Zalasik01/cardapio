import { useEffect, useMemo, useState } from 'react'
import { Button } from 'primereact/button'
import { AutoComplete } from 'primereact/autocomplete'
import { Dropdown } from 'primereact/dropdown'
import { InputNumber } from 'primereact/inputnumber'
import { InputMask } from 'primereact/inputmask'
import { InputText } from 'primereact/inputtext'
import { InputTextarea } from 'primereact/inputtextarea'
import { SelectButton } from 'primereact/selectbutton'
import { Tooltip } from 'primereact/tooltip'
import { useAuth } from '../../context/AuthContext'
import { useChatPedidos } from '../../context/ChatPedidosContext'
import { calcularFreteEndereco } from '../../api/cardapioApi'
import { buscarLoja } from '../../api/adminApi'
import { buscarEnderecoPorCep } from '../../api/cepApi'
import {
  buscarClientesParaPedido, criarPedido, editarPedido, obterFormasPagamentoParaPedido, obterProdutosParaPedido,
} from '../../api/pedidosApi'
import { dispatchMsgError, dispatchMsgSuccess, dispatchMsgWarn } from '../../store/dispatchMsg'
import { formatarMoeda } from '../../utils/formatadores'
import { TIPOS_ENTREGA } from '../../utils/pedido'

const PERMISSOES_CRIAR = ['PEDIDOS_INCLUIR', 'PAINEL_PEDIDOS_INCLUIR']

/** Título da janela: o cliente, quando já foi informado. */
const tituloDe = (rascunho, indice, pedidoId) => {
  if (pedidoId) return `Editando pedido ${pedidoId}`
  return rascunho.nomeCliente.trim() ? rascunho.nomeCliente.trim() : `Novo pedido ${indice + 1}`
}

/** Uma janela de pedido em andamento (formulário compacto, estilo bate-papo). */
function JanelaPedido({ janela, indice, produtos, formasPagamento, taxaBase }) {
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
  // sugestão do campo: a taxa da zona do bairro e, sem zona, a taxa base da loja (Minha loja)
  const taxaSugerida = frete?.entregavel ? Number(frete.taxa) : taxaBase
  const taxa = entrega ? (taxaManual ?? taxaSugerida ?? 0) : 0
  const tipoDesconto = rascunho.descontoTipo ?? 'PERCENTUAL' // rascunhos antigos não têm o campo
  const descontoValor = Number(rascunho.descontoValor) || 0
  const desconto = Math.min(subtotal, tipoDesconto === 'PERCENTUAL' ? (subtotal * descontoValor) / 100 : descontoValor)
  // pagamento dividido: cada forma paga uma parte do pedido; a soma tem de fechar com o valor a pagar
  const pagamentos = rascunho.pagamentos ?? []
  const base = Math.max(0, Math.round((subtotal - desconto + taxa) * 100) / 100)
  const taxaDe = (pg) => {
    const forma = formasPagamento.find((f) => f.id === pg.formaId)
    return forma ? (pg.valor * Number(forma.taxaPercentual)) / 100 + Number(forma.taxaFixa) : 0
  }
  const taxaPagamentos = Math.round(pagamentos.reduce((soma, pg) => soma + taxaDe(pg), 0) * 100) / 100
  const somaPagamentos = pagamentos.reduce((soma, pg) => soma + (pg.valor || 0), 0)
  const diferenca = Math.round((base - somaPagamentos) * 100) / 100
  // só aparecem as formas que valem para o tipo do pedido e para o valor dele, e que ainda não foram usadas
  const formasDisponiveis = formasPagamento.filter((f) => (entrega ? f.aceitaEntrega : f.aceitaRetirada)
    && (f.valorMinimo === null || base >= Number(f.valorMinimo)) && !pagamentos.some((pg) => pg.formaId === f.id))
  const totalFinal = base + taxaPagamentos

  // com uma forma só, ela paga o pedido todo (acompanha mudanças nos itens, desconto e entrega)
  useEffect(() => {
    if (pagamentos.length === 1 && pagamentos[0].valor !== base) {
      definir('pagamentos')([{ ...pagamentos[0], valor: base }])
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [base, pagamentos.length])

  function adicionarForma(formaId) {
    const forma = formasPagamento.find((f) => f.id === formaId)
    if (!forma) return
    const valor = pagamentos.length === 0 ? base : Math.max(0, diferenca)
    definir('pagamentos')([...pagamentos, { formaId, nome: forma.nome, tipo: forma.tipo, valor, valorRecebido: null }])
  }

  const alterarPagamento = (formaId, campos) =>
    definir('pagamentos')(pagamentos.map((pg) => (pg.formaId === formaId ? { ...pg, ...campos } : pg)))

  const removerPagamento = (formaId) => definir('pagamentos')(pagamentos.filter((pg) => pg.formaId !== formaId))

  // a taxa depende do bairro: consulta quando o bairro muda (com uma pausa enquanto digita)
  useEffect(() => {
    if (!entrega || !rascunho.enderecoBairro.trim()) {
      setFrete(null)
      return undefined
    }
    const espera = setTimeout(() => {
      calcularFreteEndereco({
        tenant: loja.tenant, rua: rascunho.enderecoRua, bairro: rascunho.enderecoBairro.trim(),
        cidade: rascunho.enderecoCidade || loja.enderecoCidade, estado: loja.enderecoEstado,
      })
        .then(setFrete)
        .catch(() => setFrete(null))
    }, 500)
    return () => clearTimeout(espera)
  }, [entrega, rascunho.enderecoBairro, rascunho.enderecoRua, rascunho.enderecoCidade, loja.tenant, loja.enderecoCidade, loja.enderecoEstado])

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
      // cliente com mais de um endereço: a loja escolhe qual usar neste pedido (chips acima do CEP)
      enderecosCliente: cliente.enderecos?.length > 1 ? cliente.enderecos : [],
    })
  }

  function usarEnderecoDoCliente(e) {
    atualizar(janela.id, {
      cep: e.cep || '', enderecoRua: e.logradouro || '', enderecoNumero: e.numero || '', enderecoComplemento: e.complemento || '',
      enderecoBairro: e.bairro || '', enderecoCidade: e.cidade || '',
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
    if (pagamentos.length > 0 && Math.abs(diferenca) >= 0.01) {
      dispatchMsgWarn(`A soma dos pagamentos deve ser igual ao valor do pedido (${formatarMoeda(base)}).`)
      return
    }
    setEnviando(true)
    try {
      const dados = {
        nomeCliente: rascunho.nomeCliente.trim(),
        telefoneCliente: rascunho.telefoneCliente.trim(),
        tipoEntrega: rascunho.tipoEntrega,
        enderecoRua: entrega ? rascunho.enderecoRua.trim() : null,
        enderecoNumero: entrega ? rascunho.enderecoNumero.trim() : null,
        enderecoComplemento: entrega ? rascunho.enderecoComplemento.trim() : null,
        enderecoBairro: entrega ? rascunho.enderecoBairro.trim() : null,
        enderecoCidade: entrega ? rascunho.enderecoCidade.trim() : null,
        formaPagamento: pagamentos.length ? null : (rascunho.formaLegada ?? null),
        pagamentos: pagamentos.map((pg) => ({ formaId: pg.formaId, valor: pg.valor, valorRecebido: pg.valorRecebido })),
        taxaEntrega: entrega ? taxa : null,
        descontoTipo: desconto > 0 ? tipoDesconto : null,
        descontoValor: desconto > 0 ? descontoValor : null,
        observacoes: rascunho.observacoes.trim() || null,
        itens: rascunho.itens.map((i) => ({ produtoGuid: i.guid, quantidade: i.quantidade, observacoes: i.observacoes ?? null })),
      }
      const pedido = janela.pedidoId
        ? await editarPedido(loja.tenant, janela.pedidoId, dados)
        : await criarPedido(loja.tenant, dados)
      dispatchMsgSuccess(janela.pedidoId ? `Pedido ${pedido.id} atualizado com sucesso` : `Pedido ${pedido.id} criado com sucesso`)
      fechar(janela.id)
    } catch (e) {
      dispatchMsgError(e.mensagem)
    } finally {
      setEnviando(false)
    }
  }

  return (
    <section className={`dock-janela${janela.minimizada ? ' dock-janela--minimizada' : ''}`} aria-label={tituloDe(rascunho, indice, janela.pedidoId)}>
      <header className="dock-janela__topo">
        <button type="button" className="dock-janela__titulo" onClick={() => alternar(janela.id)}
                aria-expanded={!janela.minimizada}>
          <i className="fa-solid fa-receipt" aria-hidden="true" />
          <span className="dock-janela__nome">{tituloDe(rascunho, indice, janela.pedidoId)}</span>
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
                {rascunho.enderecosCliente?.length > 1 && (
                  <div className="dock__enderecos" role="group" aria-label="Endereços do cliente">
                    {rascunho.enderecosCliente.map((e, i) => (
                      <button key={i} type="button" className={e.logradouro === rascunho.enderecoRua && e.numero === rascunho.enderecoNumero ? 'ativo' : ''}
                              onClick={() => usarEnderecoDoCliente(e)}>
                        <i className="pi pi-map-marker" aria-hidden="true" /> {e.apelido || (e.principal ? 'Principal' : e.logradouro)}
                      </button>
                    ))}
                  </div>
                )}
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
                <InputNumber className="dock-janela__larga" value={taxa} min={0} mode="currency" currency="BRL"
                             locale="pt-BR" placeholder="Taxa de entrega (R$)"
                             // só vira taxa "na mão" quando o valor difere do sugerido (o campo também avisa ao carregar)
                             onValueChange={(e) => (e.value ?? 0) !== taxa && definir('taxaEntrega')(e.value ?? 0)} />
                <small className={frete?.entregavel ? 'dock-janela__frete' : 'dock-janela__frete dock-janela__frete--aviso'}>
                  {frete?.entregavel
                    ? `Taxa da zona de entrega do bairro: ${formatarMoeda(frete.taxa)}. Você pode alterar.`
                    : `Sugestão: taxa base da loja (${formatarMoeda(taxaBase ?? 0)}). Você pode alterar.`}
                </small>
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
            <div className="dock-janela__pagamentos">
              <Dropdown value={null} options={formasDisponiveis} optionLabel="nome" optionValue="id"
                        placeholder="Adicionar forma de pagamento" emptyMessage="Nenhuma forma disponível"
                        onChange={(e) => adicionarForma(e.value)} />
              {pagamentos.map((pg) => (
                <div key={pg.formaId} className="dock-janela__pagamento">
                  <span className="dock-janela__pagamento-nome">{pg.nome}</span>
                  <InputNumber value={pg.valor} min={0} mode="currency" currency="BRL" locale="pt-BR" aria-label={`Valor em ${pg.nome}`}
                               onValueChange={(e) => (e.value ?? 0) !== pg.valor && alterarPagamento(pg.formaId, { valor: e.value ?? 0 })} />
                  <button type="button" className="dock-janela__remover" aria-label={`Remover ${pg.nome}`} onClick={() => removerPagamento(pg.formaId)}>
                    <i className="fa-solid fa-xmark" aria-hidden="true" />
                  </button>
                  {pg.tipo === 'DINHEIRO' && (
                    <>
                      <InputNumber className="dock-janela__larga" value={pg.valorRecebido} min={0} mode="currency" currency="BRL" locale="pt-BR"
                                   placeholder="Valor recebido (para o troco)"
                                   onValueChange={(e) => alterarPagamento(pg.formaId, { valorRecebido: e.value ?? null })} />
                      {pg.valorRecebido != null && pg.valorRecebido >= pg.valor + taxaDe(pg) && (
                        <small className="dock-janela__frete">Troco: {formatarMoeda(pg.valorRecebido - pg.valor - taxaDe(pg))}</small>
                      )}
                    </>
                  )}
                  {taxaDe(pg) > 0 && <small className="dock-janela__preco">Taxa desta forma: {formatarMoeda(taxaDe(pg))}</small>}
                </div>
              ))}
              {pagamentos.length > 0 && Math.abs(diferenca) >= 0.01 && (
                <small className="dock-janela__frete dock-janela__frete--erro">
                  {diferenca > 0 ? `Falta ${formatarMoeda(diferenca)} para fechar o valor do pedido` : `Passou ${formatarMoeda(-diferenca)} do valor do pedido`}
                </small>
              )}
            </div>
            <InputTextarea placeholder="Observações" rows={2} autoResize value={rascunho.observacoes}
                           onChange={(e) => definir('observacoes')(e.target.value)} />
          </div>
          <footer className="dock-janela__rodape">
            <span className="dock-janela__total">
              {desconto > 0 && <small>Desconto - {formatarMoeda(desconto)}</small>}
              {taxaPagamentos > 0 && <small>Taxas de pagamento + {formatarMoeda(taxaPagamentos)}</small>}
              Total <strong>{formatarMoeda(totalFinal)}</strong>
            </span>
            <Button type="button" size="small" label={enviando ? 'Salvando...' : (janela.pedidoId ? 'Salvar alterações' : 'Criar pedido')} icon="pi pi-check"
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
  const [taxaBase, setTaxaBase] = useState(null) // taxa de entrega base da loja (Minha loja)
  const permitido = pode(...PERMISSOES_CRIAR)
  const temJanelas = janelas.length > 0

  // os produtos só são pedidos quando há alguma janela aberta
  useEffect(() => {
    if (!permitido || !temJanelas) return
    obterProdutosParaPedido(loja.tenant).then(setProdutos).catch((e) => dispatchMsgError(e.mensagem))
    buscarLoja(loja.tenant).then((dados) => setTaxaBase(Number(dados.taxaEntregaBase) || 0)).catch(() => setTaxaBase(0))
    obterFormasPagamentoParaPedido(loja.tenant).then(setFormasPagamento).catch(() => setFormasPagamento([]))
  }, [permitido, temJanelas, loja.tenant])

  const janelasVisiveis = useMemo(() => janelas, [janelas])
  if (!permitido) return null

  return (
    <div className="dock-pedidos">
      <Tooltip target=".dock-pedidos__novo" />
      {janelasVisiveis.map((janela, i) => <JanelaPedido key={janela.id} janela={janela} indice={i} produtos={produtos} formasPagamento={formasPagamento} taxaBase={taxaBase} />)}
      <button type="button" className="dock-pedidos__novo" onClick={() => abrirNovo()} disabled={limiteAtingido}
              aria-label="Novo pedido" data-pr-position="left"
              data-pr-tooltip={limiteAtingido ? 'Feche um pedido para abrir outro' : 'Novo pedido'}>
        <i className="fa-solid fa-plus" aria-hidden="true" />
      </button>
    </div>
  )
}
