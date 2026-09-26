import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, Navigate, useNavigate, useOutletContext } from 'react-router-dom'
import { InputNumber } from 'primereact/inputnumber'
import { Steps } from 'primereact/steps'
import { obterCashbackResgatavel } from '../../api/fidelidadeApi'
import { calcularFreteEndereco, criarPedido, listarEnderecosCliente, removerEnderecoCliente, salvarEnderecoCliente, validarCupom } from '../../api/cardapioApi'
import { buscarEnderecoPorCep } from '../../api/cepApi'
import { mascaraTelefone } from '../../utils/telefone'
import { useCarrinho } from '../../context/CarrinhoContext'
import { formatarMoeda } from '../../utils/formatadores'
import { useCliente } from '../../context/ClienteContext'

const somenteDigitos = (v) => v.replace(/\D/g, '')

function mascaraCep(v) {
  const d = somenteDigitos(v).slice(0, 8)
  return d.length > 5 ? `${d.slice(0, 5)}-${d.slice(5)}` : d
}

const PASSOS = [{ label: 'Dados' }, { label: 'Entrega' }, { label: 'Pagamento' }, { label: 'Revisão' }]

const FORM_INICIAL = {
  nomeCliente: '', telefoneCliente: '', cep: '', enderecoRua: '', enderecoNumero: '',
  enderecoComplemento: '', enderecoBairro: '', enderecoCidade: '', formaPagamento: '', observacoes: '',
}

/** Checkout: dados, entrega (CEP preenche o endereço e calcula o frete), pagamento e envio do pedido. */
export default function PaginaCheckout() {
  const { cardapio, slug } = useOutletContext()
  const { loja } = cardapio
  const navigate = useNavigate()
  const { itens, subtotal, limparCarrinho } = useCarrinho()
  const { cliente, abrirLogin } = useCliente()

  const [tipoEntrega, setTipoEntrega] = useState('ENTREGA')
  const [form, setForm] = useState(FORM_INICIAL)
  const [frete, setFrete] = useState(null)
  const [buscandoCep, setBuscandoCep] = useState(false)
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState(null)
  const [passo, setPasso] = useState(0)
  const [salvos, setSalvos] = useState([])
  const [cashbackDisponivel, setCashbackDisponivel] = useState(0)
  const [usarCashback, setUsarCashback] = useState(false)
  const [salvarEndereco, setSalvarEndereco] = useState(false)
  const [apelidoEndereco, setApelidoEndereco] = useState('')
  const [enderecoEscolhido, setEnderecoEscolhido] = useState(null)
  const [precisaTroco, setPrecisaTroco] = useState(null) // dinheiro: null = ainda não respondeu
  const [trocoPara, setTrocoPara] = useState(null)
  const [codigoCupom, setCodigoCupom] = useState('')
  const [cupom, setCupom] = useState(null)
  const [validandoCupom, setValidandoCupom] = useState(false)
  const [erroCupom, setErroCupom] = useState(null)
  const passoRef = useRef(null)

  const formas = useMemo(
    () => cardapio.formasPagamento.filter((f) => (tipoEntrega === 'ENTREGA' ? f.aceitaEntrega : f.aceitaRetirada)),
    [cardapio.formasPagamento, tipoEntrega],
  )

  useEffect(() => {
    if (!formas.some((f) => f.nome === form.formaPagamento)) {
      setForm((atual) => ({ ...atual, formaPagamento: formas[0]?.nome ?? '' }))
    }
  }, [formas, form.formaPagamento])

  // pedir exige entrar com o telefone: abre o login e preenche os dados com os da conta
  useEffect(() => {
    if (!cliente) {
      abrirLogin()
      return
    }
    setForm((atual) => ({
      ...atual,
      nomeCliente: atual.nomeCliente || cliente.nome || '',
      telefoneCliente: mascaraTelefone(cliente.telefone),
    }))
  }, [cliente, abrirLogin])

  // mudou o pedido (itens, entrega ou frete): o cupom precisa ser conferido de novo
  const taxaFrete = frete?.entregavel ? Number(frete.taxa || 0) : 0
  useEffect(() => {
    setCupom(null)
  }, [itens, tipoEntrega, taxaFrete])

  async function aplicarCupom() {
    setErroCupom(null)
    setValidandoCupom(true)
    try {
      const aplicado = await validarCupom({
        tenant: loja.tenant, codigo: codigoCupom, tipoEntrega, taxaEntrega: tipoEntrega === 'ENTREGA' ? taxaFrete : 0,
        itens: itens.map((i) => ({ produtoGuid: i.produtoGuid, quantidade: i.quantidade })),
      })
      setCupom(aplicado)
    } catch (e) {
      setCupom(null)
      setErroCupom(e.mensagem)
    } finally {
      setValidandoCupom(false)
    }
  }

  useEffect(() => {
    setPrecisaTroco(null)
    setTrocoPara(null)
  }, [form.formaPagamento])

  useEffect(() => {
    if (cliente) listarEnderecosCliente().then(setSalvos).catch(() => setSalvos([]))
  }, [cliente])

  function usarEndereco(e) {
    setEnderecoEscolhido(e.id)
    setSalvarEndereco(false)
    setForm((atual) => ({
      ...atual, cep: e.cep ?? '', enderecoRua: e.rua, enderecoNumero: e.numero, enderecoComplemento: e.complemento ?? '',
      enderecoBairro: e.bairro, enderecoCidade: e.cidade ?? '',
    }))
    consultarFrete({ rua: e.rua, bairro: e.bairro, cidade: e.cidade, latitude: e.latitude, longitude: e.longitude })
  }

  async function removerSalvo(e) {
    try {
      await removerEnderecoCliente(e.id)
      setSalvos((atual) => atual.filter((x) => x.id !== e.id))
      if (enderecoEscolhido === e.id) setEnderecoEscolhido(null)
    } catch (err) {
      setErro(err.mensagem || 'Não foi possível remover o endereço.')
    }
  }

  // cashback que dá para usar neste pedido (depende do valor dos itens já com o cupom)
  const baseCashback = Math.max(0, subtotal - Number(cupom?.desconto ?? 0))
  useEffect(() => {
    if (!cliente || !cardapio.cashbackPercentual) return undefined
    let cancelado = false
    obterCashbackResgatavel(slug, baseCashback.toFixed(2))
      .then((v) => { if (!cancelado) { setCashbackDisponivel(Number(v)); if (Number(v) <= 0) setUsarCashback(false) } })
      .catch(() => { if (!cancelado) setCashbackDisponivel(0) })
    return () => { cancelado = true }
  }, [cliente, slug, baseCashback, cardapio.cashbackPercentual])

  const campo = (nome, valor) => setForm((atual) => ({ ...atual, [nome]: valor }))

  /** Frete pela zona do bairro; sem zona cadastrada, calcula pela distância usando as coordenadas do endereço. */
  async function consultarFrete(endereco) {
    setFrete(null)
    if (!endereco.bairro) return
    try {
      const resultado = await calcularFreteEndereco({ tenant: loja.tenant, ...endereco, estado: endereco.estado ?? loja.enderecoEstado })
      setFrete(resultado)
      setErro(resultado.entregavel ? null : resultado.mensagem)
    } catch (e) {
      setErro(e.mensagem || 'Não foi possível calcular o frete.')
    }
  }

  async function aoDigitarCep(valor) {
    const cep = mascaraCep(valor)
    campo('cep', cep)
    if (somenteDigitos(cep).length !== 8) return
    setBuscandoCep(true)
    setErro(null)
    try {
      const endereco = await buscarEnderecoPorCep(cep)
      if (!endereco) {
        setErro('CEP não encontrado. Preencha o endereço manualmente.')
        return
      }
      setForm((atual) => ({
        ...atual, enderecoRua: endereco.logradouro, enderecoBairro: endereco.bairro, enderecoCidade: endereco.cidade,
      }))
      await consultarFrete({ rua: endereco.logradouro, bairro: endereco.bairro, cidade: endereco.cidade, estado: endereco.estado })
    } catch {
      setErro('Não foi possível buscar o CEP agora. Preencha o endereço manualmente.')
    } finally {
      setBuscandoCep(false)
    }
  }

  /** Valida os campos do passo atual (os do HTML) e a taxa de entrega antes de avançar. */
  function avancar() {
    setErro(null)
    const campos = [...(passoRef.current?.querySelectorAll('input, textarea') ?? [])]
    const invalido = campos.find((c) => !c.checkValidity())
    if (invalido) {
      invalido.reportValidity()
      return
    }
    if (passo === 1 && tipoEntrega === 'ENTREGA' && !frete?.entregavel) {
      setErro('Informe o CEP ou o bairro para calcularmos a taxa de entrega.')
      return
    }
    if (passo === 2 && !form.formaPagamento) {
      setErro('Escolha uma forma de pagamento.')
      return
    }
    if (passo === 2 && emDinheiro) {
      if (precisaTroco === null) {
        setErro('Informe se você precisa de troco.')
        return
      }
      if (precisaTroco && (!trocoPara || trocoPara < total)) {
        setErro(`O valor para o troco precisa ser maior ou igual ao total do pedido (${formatarMoeda(total)}).`)
        return
      }
    }
    setPasso((p) => p + 1)
  }

  function voltar() {
    setErro(null)
    setPasso((p) => p - 1)
  }

  async function enviar(e) {
    e.preventDefault()
    if (passo < PASSOS.length - 1) {
      avancar()
      return
    }
    setErro(null)
    if (tipoEntrega === 'ENTREGA' && !frete?.entregavel) {
      setErro('Informe o CEP ou o bairro para calcularmos a taxa de entrega.')
      return
    }
    setEnviando(true)
    try {
      const entrega = tipoEntrega === 'ENTREGA'
      const pedido = await criarPedido({
        tenant: loja.tenant,
        nomeCliente: form.nomeCliente.trim(),
        telefoneCliente: somenteDigitos(form.telefoneCliente),
        tipoEntrega,
        enderecoRua: entrega ? form.enderecoRua : null,
        enderecoNumero: entrega ? form.enderecoNumero : null,
        enderecoComplemento: entrega ? form.enderecoComplemento : null,
        enderecoBairro: entrega ? form.enderecoBairro : null,
        enderecoCidade: entrega ? form.enderecoCidade : null,
        latitude: entrega ? frete?.latitude : null,
        longitude: entrega ? frete?.longitude : null,
        itens: itens.map((i) => ({ produtoGuid: i.produtoGuid, quantidade: i.quantidade, observacoes: i.observacoes })),
        formaPagamento: textoPagamento,
        observacoes: form.observacoes,
        codigoCupom: cupom?.codigo ?? null,
        usarCashback: cashbackAplicado > 0,
      })
      if (entrega && salvarEndereco && apelidoEndereco.trim()) {
        // guardar o endereço é um extra: se falhar, o pedido já foi feito e segue normalmente
        salvarEnderecoCliente({
          apelido: apelidoEndereco.trim(), cep: form.cep, rua: form.enderecoRua, numero: form.enderecoNumero, complemento: form.enderecoComplemento,
          bairro: form.enderecoBairro, cidade: form.enderecoCidade, latitude: frete?.latitude ?? null, longitude: frete?.longitude ?? null,
        }).catch(() => {})
      }
      limparCarrinho()
      navigate(`/pedido/${pedido.guid}`)
    } catch (err) {
      setErro(err.mensagem || 'Não foi possível enviar o pedido.')
    } finally {
      setEnviando(false)
    }
  }

  if (itens.length === 0) return <Navigate to={`/${slug}`} replace />
  if (!cliente) {
    return (
      <div className="loja-pagina">
        <header className="loja-pagina__topo">
          <Link to={`/${slug}/carrinho`} aria-label="Voltar ao carrinho"><i className="fa-solid fa-arrow-left" /></Link>
          <h1>Finalizar pedido</h1>
        </header>
        <div className="loja-vazio">
          <i className="fa-solid fa-mobile-screen" aria-hidden="true" />
          <p>Entre com seu telefone para enviar o pedido.</p>
          <button type="button" className="loja-botao" onClick={() => abrirLogin()}>Entrar</button>
        </div>
      </div>
    )
  }

  const taxa = tipoEntrega === 'ENTREGA' && frete?.entregavel ? Number(frete.taxa || 0) : 0
  const desconto = Number(cupom?.desconto ?? 0)
  const cashbackAplicado = usarCashback ? Math.min(cashbackDisponivel, Math.max(0, subtotal - desconto)) : 0
  const total = Math.max(0, subtotal - desconto - cashbackAplicado + taxa)
  const formaEscolhida = formas.find((f) => f.nome === form.formaPagamento)
  const emDinheiro = formaEscolhida?.tipo === 'DINHEIRO'
  // o troco vai junto do texto da forma de pagamento, que a loja e o entregador já leem em todas as telas
  const textoPagamento = emDinheiro && precisaTroco === true && trocoPara
    ? `${form.formaPagamento} - troco para ${formatarMoeda(trocoPara)} (levar ${formatarMoeda(trocoPara - total)})`
    : emDinheiro && precisaTroco === false ? `${form.formaPagamento} - sem troco` : form.formaPagamento

  return (
    <form className="loja-pagina" onSubmit={enviar}>
      <header className="loja-pagina__topo">
        <Link to={`/${slug}/carrinho`} aria-label="Voltar ao carrinho"><i className="fa-solid fa-arrow-left" /></Link>
        <h1>Finalizar pedido</h1>
      </header>

      <Steps model={PASSOS} activeIndex={passo} readOnly className="loja-passos" />

      <div ref={passoRef}>
      {passo === 0 && (
      <section className="loja-bloco">
        <h2>Seus dados</h2>
        <label className="loja-campo">Nome
          <input required autoComplete="name" value={form.nomeCliente} onChange={(e) => campo('nomeCliente', e.target.value)} />
        </label>
        <label className="loja-campo">Telefone / WhatsApp
          <input required type="tel" readOnly value={form.telefoneCliente} />
        </label>
      </section>
      )}

      {passo === 1 && (
      <section className="loja-bloco">
        <h2>Como quer receber?</h2>
        <div className="loja-opcoes" role="radiogroup" aria-label="Tipo de entrega">
          <button type="button" role="radio" aria-checked={tipoEntrega === 'ENTREGA'}
                  className={tipoEntrega === 'ENTREGA' ? 'ativo' : ''} onClick={() => setTipoEntrega('ENTREGA')}>
            <i className="fa-solid fa-motorcycle" aria-hidden="true" /> Entrega
          </button>
          <button type="button" role="radio" aria-checked={tipoEntrega === 'RETIRADA'}
                  className={tipoEntrega === 'RETIRADA' ? 'ativo' : ''} onClick={() => setTipoEntrega('RETIRADA')}>
            <i className="fa-solid fa-store" aria-hidden="true" /> Retirar na loja
          </button>
        </div>

        {tipoEntrega === 'ENTREGA' && (
          <>
            {salvos.length > 0 && (
              <div className="loja-enderecos" role="group" aria-label="Seus endereços salvos">
                {salvos.map((e) => (
                  <span key={e.id} className={`loja-enderecos__item${enderecoEscolhido === e.id ? ' ativo' : ''}`}>
                    <button type="button" onClick={() => usarEndereco(e)}>
                      <i className="fa-solid fa-location-dot" aria-hidden="true" /> <strong>{e.apelido}</strong>
                      <small>{e.rua}, {e.numero}</small>
                    </button>
                    <button type="button" className="loja-enderecos__remover" aria-label={`Remover endereço ${e.apelido}`} onClick={() => removerSalvo(e)}>
                      <i className="fa-solid fa-xmark" aria-hidden="true" />
                    </button>
                  </span>
                ))}
              </div>
            )}
            <label className="loja-campo">CEP
              <input inputMode="numeric" autoComplete="postal-code" value={form.cep} placeholder="00000-000"
                     onChange={(e) => aoDigitarCep(e.target.value)} />
              {buscandoCep && <small>Buscando endereço...</small>}
            </label>
            <label className="loja-campo">Rua
              <input required autoComplete="address-line1" value={form.enderecoRua} onChange={(e) => campo('enderecoRua', e.target.value)} />
            </label>
            <div className="loja-linha">
              <label className="loja-campo">Número
                <input required value={form.enderecoNumero} onChange={(e) => campo('enderecoNumero', e.target.value)} />
              </label>
              <label className="loja-campo">Complemento
                <input value={form.enderecoComplemento} onChange={(e) => campo('enderecoComplemento', e.target.value)} />
              </label>
            </div>
            <div className="loja-linha">
              <label className="loja-campo">Bairro
                <input required value={form.enderecoBairro} onChange={(e) => campo('enderecoBairro', e.target.value)}
                       onBlur={(e) => e.target.value && consultarFrete({ rua: form.enderecoRua, bairro: e.target.value, cidade: form.enderecoCidade })} />
              </label>
              <label className="loja-campo">Cidade
                <input value={form.enderecoCidade} onChange={(e) => campo('enderecoCidade', e.target.value)} />
              </label>
            </div>
            {frete?.entregavel && <p className="loja-frete">Taxa de entrega: <strong>{formatarMoeda(frete.taxa)}</strong></p>}
            {form.enderecoRua && form.enderecoNumero && enderecoEscolhido === null && (
              <div className="loja-salvar-endereco">
                <label className="loja-check">
                  <input type="checkbox" checked={salvarEndereco} onChange={(e) => setSalvarEndereco(e.target.checked)} /> Salvar este endereço para os próximos pedidos
                </label>
                {salvarEndereco && (
                  <input placeholder="Nome do endereço (Casa, Trabalho...)" maxLength={40} value={apelidoEndereco}
                         onChange={(e) => setApelidoEndereco(e.target.value)} aria-label="Nome do endereço" />
                )}
              </div>
            )}
          </>
        )}
        {tipoEntrega === 'RETIRADA' && (
          <p className="loja-frete">
            Retire em {[loja.enderecoRua, loja.enderecoNumero].filter(Boolean).join(', ') || 'endereço da loja'}
            {loja.enderecoBairro ? ` - ${loja.enderecoBairro}` : ''}.
          </p>
        )}
      </section>
      )}

      {passo === 2 && (
      <>
      <section className="loja-bloco">
        <h2>Pagamento</h2>
        {formas.length === 0 ? (
          <p className="loja-frete">Nenhuma forma de pagamento disponível para este tipo de pedido. Fale com a loja.</p>
        ) : (
          <div className="loja-opcoes loja-opcoes--coluna" role="radiogroup" aria-label="Forma de pagamento">
            {formas.map((f) => (
              <button key={f.nome} type="button" role="radio" aria-checked={form.formaPagamento === f.nome}
                      className={form.formaPagamento === f.nome ? 'ativo' : ''} onClick={() => campo('formaPagamento', f.nome)}>
                {f.nome}
                {(Number(f.taxaPercentual) > 0 || Number(f.taxaFixa) > 0) && <small>com taxa</small>}
              </button>
            ))}
          </div>
        )}
        {emDinheiro && (
          <div className="loja-troco">
            <p><i className="fa-solid fa-coins" aria-hidden="true" /> Vai precisar de troco?</p>
            <div className="loja-opcoes" role="radiogroup" aria-label="Precisa de troco">
              <button type="button" role="radio" aria-checked={precisaTroco === false} className={precisaTroco === false ? 'ativo' : ''}
                      onClick={() => { setPrecisaTroco(false); setTrocoPara(null) }}>Não preciso</button>
              <button type="button" role="radio" aria-checked={precisaTroco === true} className={precisaTroco === true ? 'ativo' : ''}
                      onClick={() => setPrecisaTroco(true)}>Preciso de troco</button>
            </div>
            {precisaTroco === true && (
              <label className="loja-campo">Troco para quanto?
                <InputNumber inputId="troco-para" value={trocoPara} mode="currency" currency="BRL" locale="pt-BR" min={0} placeholder="R$ 0,00"
                             inputClassName="loja-troco__valor" onValueChange={(e) => setTrocoPara(e.value ?? null)} />
                <small>
                  {trocoPara && trocoPara >= total
                    ? `Você paga ${formatarMoeda(total)} e o entregador leva ${formatarMoeda(trocoPara - total)} de troco.`
                    : `O total do pedido é ${formatarMoeda(total)}. Informe uma nota maior ou igual a esse valor.`}
                </small>
              </label>
            )}
          </div>
        )}
      </section>
      {cashbackDisponivel > 0 && (
        <section className="loja-bloco loja-cashback">
          <label className="loja-check">
            <input type="checkbox" checked={usarCashback} onChange={(e) => setUsarCashback(e.target.checked)} />
            <span>Usar meu cashback: <strong>{formatarMoeda(cashbackDisponivel)}</strong> de desconto neste pedido</span>
          </label>
        </section>
      )}
      <section className="loja-bloco loja-cupom">
        <h2>Cupom de desconto</h2>
        {cupom ? (
          <p className="loja-frete">
            <i className="fa-solid fa-ticket" aria-hidden="true" /> <strong>{cupom.codigo}</strong> aplicado: -{formatarMoeda(cupom.desconto)}{' '}
            <button type="button" className="loja-link" onClick={() => { setCupom(null); setCodigoCupom('') }}>remover</button>
          </p>
        ) : (
          <div className="loja-cupom__linha">
            <input value={codigoCupom} onChange={(e) => setCodigoCupom(e.target.value.toUpperCase())} placeholder="Código do cupom"
                   aria-label="Código do cupom" autoCapitalize="characters" />
            <button type="button" className="loja-botao loja-botao--sec" disabled={!codigoCupom.trim() || validandoCupom} onClick={aplicarCupom}>
              {validandoCupom ? 'Conferindo...' : 'Aplicar'}
            </button>
          </div>
        )}
        {erroCupom && <small className="loja-resumo__aviso" role="alert">{erroCupom}</small>}
      </section>
      </>
      )}

      {passo === 3 && (
      <>
      <section className="loja-bloco">
        <h2>Confira seu pedido</h2>
        <ul className="loja-revisao">
          {itens.map((i) => <li key={`${i.produtoGuid}-${i.observacoes}`}><span>{i.quantidade}x {i.nome}</span><span>{formatarMoeda(i.preco * i.quantidade)}</span></li>)}
        </ul>
        <p className="loja-revisao__dados">
          {form.nomeCliente} · {form.telefoneCliente}<br />
          {tipoEntrega === 'ENTREGA' ? `Entrega: ${form.enderecoRua}, ${form.enderecoNumero} - ${form.enderecoBairro}` : 'Retirada na loja'}<br />
          Pagamento: {textoPagamento}
        </p>
      </section>
      <section className="loja-bloco">
        <h2>Observações do pedido</h2>
        <label className="loja-campo">
          <textarea rows={3} maxLength={300} value={form.observacoes} placeholder="Ex.: tocar a campainha, sem cebola no lanche..."
                    onChange={(e) => campo('observacoes', e.target.value)} />
        </label>
      </section>
      <section className="loja-resumo">
        <p><span>Subtotal</span><span>{formatarMoeda(subtotal)}</span></p>
        {desconto > 0 && <p className="loja-resumo__desconto"><span>Desconto ({cupom.codigo})</span><span>-{formatarMoeda(desconto)}</span></p>}
        {cashbackAplicado > 0 && <p className="loja-resumo__desconto"><span>Cashback</span><span>-{formatarMoeda(cashbackAplicado)}</span></p>}
        <p><span>Entrega</span><span>{tipoEntrega === 'ENTREGA' ? (frete?.entregavel ? formatarMoeda(taxa) : 'a calcular') : 'Retirada'}</span></p>
        <p className="loja-resumo__total"><span>Total</span><strong>{formatarMoeda(total)}</strong></p>
      </section>
      </>
      )}
      </div>

      {erro && <p className="loja__erro" role="alert">{erro}</p>}

      <footer className="loja-rodape-fixo loja-rodape-fixo--passos">
        {passo > 0 && <button type="button" className="loja-botao loja-botao--sec" onClick={voltar}>Voltar</button>}
        {passo < PASSOS.length - 1 ? (
          <button key="continuar" type="button" className="loja-botao" onClick={avancar}>Continuar</button>
        ) : (
          <button key="enviar" type="submit" className="loja-botao" disabled={enviando || !cardapio.aberta || formas.length === 0}>
            {enviando ? 'Enviando...' : `Enviar pedido · ${formatarMoeda(total)}`}
          </button>
        )}
      </footer>
    </form>
  )
}
