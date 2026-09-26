import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, Navigate, useNavigate, useOutletContext } from 'react-router-dom'
import { Steps } from 'primereact/steps'
import { calcularFreteEndereco, criarPedido } from '../../api/cardapioApi'
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
        formaPagamento: form.formaPagamento,
        observacoes: form.observacoes,
      })
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
  const total = subtotal + taxa

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
        <label className="loja-campo">Observações do pedido
          <textarea rows={2} value={form.observacoes} onChange={(e) => campo('observacoes', e.target.value)} />
        </label>
      </section>
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
          Pagamento: {form.formaPagamento}
        </p>
      </section>
      <section className="loja-resumo">
        <p><span>Subtotal</span><span>{formatarMoeda(subtotal)}</span></p>
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
          <button type="button" className="loja-botao" onClick={avancar}>Continuar</button>
        ) : (
          <button type="submit" className="loja-botao" disabled={enviando || !cardapio.aberta || formas.length === 0}>
            {enviando ? 'Enviando...' : `Enviar pedido · ${formatarMoeda(total)}`}
          </button>
        )}
      </footer>
    </form>
  )
}
