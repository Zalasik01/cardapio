import { useEffect, useMemo, useState } from 'react'
import { Link, Navigate, useNavigate, useOutletContext } from 'react-router-dom'
import { calcularFrete, criarPedido } from '../../api/cardapioApi'
import { buscarEnderecoPorCep } from '../../api/cepApi'
import { useCarrinho } from '../../context/CarrinhoContext'
import { formatarMoeda } from '../../utils/formatadores'

const somenteDigitos = (v) => v.replace(/\D/g, '')

function mascaraCep(v) {
  const d = somenteDigitos(v).slice(0, 8)
  return d.length > 5 ? `${d.slice(0, 5)}-${d.slice(5)}` : d
}

function mascaraTelefone(v) {
  const d = somenteDigitos(v).slice(0, 11)
  if (d.length <= 2) return d
  if (d.length <= 7) return `(${d.slice(0, 2)}) ${d.slice(2)}`
  const corte = d.length === 11 ? 7 : 6
  return `(${d.slice(0, 2)}) ${d.slice(2, corte)}-${d.slice(corte)}`
}

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

  const [tipoEntrega, setTipoEntrega] = useState('ENTREGA')
  const [form, setForm] = useState(FORM_INICIAL)
  const [frete, setFrete] = useState(null)
  const [buscandoCep, setBuscandoCep] = useState(false)
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState(null)

  const formas = useMemo(
    () => cardapio.formasPagamento.filter((f) => (tipoEntrega === 'ENTREGA' ? f.aceitaEntrega : f.aceitaRetirada)),
    [cardapio.formasPagamento, tipoEntrega],
  )

  useEffect(() => {
    if (!formas.some((f) => f.nome === form.formaPagamento)) {
      setForm((atual) => ({ ...atual, formaPagamento: formas[0]?.nome ?? '' }))
    }
  }, [formas, form.formaPagamento])

  const campo = (nome, valor) => setForm((atual) => ({ ...atual, [nome]: valor }))

  async function consultarFrete(bairro) {
    setFrete(null)
    if (!bairro) return
    try {
      const resultado = await calcularFrete({ tenant: loja.tenant, bairro })
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
      await consultarFrete(endereco.bairro)
    } catch {
      setErro('Não foi possível buscar o CEP agora. Preencha o endereço manualmente.')
    } finally {
      setBuscandoCep(false)
    }
  }

  async function enviar(e) {
    e.preventDefault()
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

  const taxa = tipoEntrega === 'ENTREGA' && frete?.entregavel ? Number(frete.taxa || 0) : 0
  const total = subtotal + taxa

  return (
    <form className="loja-pagina" onSubmit={enviar}>
      <header className="loja-pagina__topo">
        <Link to={`/${slug}/carrinho`} aria-label="Voltar ao carrinho"><i className="fa-solid fa-arrow-left" /></Link>
        <h1>Finalizar pedido</h1>
      </header>

      <section className="loja-bloco">
        <h2>Seus dados</h2>
        <label className="loja-campo">Nome
          <input required autoComplete="name" value={form.nomeCliente} onChange={(e) => campo('nomeCliente', e.target.value)} />
        </label>
        <label className="loja-campo">Telefone / WhatsApp
          <input required type="tel" inputMode="tel" autoComplete="tel" value={form.telefoneCliente} placeholder="(00) 00000-0000"
                 onChange={(e) => campo('telefoneCliente', mascaraTelefone(e.target.value))} />
        </label>
      </section>

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
                       onBlur={(e) => e.target.value && consultarFrete(e.target.value)} />
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

      <section className="loja-resumo">
        <p><span>Subtotal</span><span>{formatarMoeda(subtotal)}</span></p>
        <p><span>Entrega</span><span>{tipoEntrega === 'ENTREGA' ? (frete?.entregavel ? formatarMoeda(taxa) : 'a calcular') : 'Retirada'}</span></p>
        <p className="loja-resumo__total"><span>Total</span><strong>{formatarMoeda(total)}</strong></p>
      </section>

      {erro && <p className="loja__erro" role="alert">{erro}</p>}

      <footer className="loja-rodape-fixo">
        <button type="submit" className="loja-botao" disabled={enviando || !cardapio.aberta || formas.length === 0}>
          {enviando ? 'Enviando...' : `Enviar pedido · ${formatarMoeda(total)}`}
        </button>
      </footer>
    </form>
  )
}
