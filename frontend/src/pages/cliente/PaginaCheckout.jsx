import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { buscarCardapio, calcularFrete, criarPedido } from '../../api/cardapioApi'
import { useCarrinho } from '../../context/CarrinhoContext'
import { formatarMoeda } from '../../utils/formatadores'

export default function PaginaCheckout() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const { itens, subtotal, limparCarrinho } = useCarrinho()

  const [loja, setLoja] = useState(null)
  const [tipoEntrega, setTipoEntrega] = useState('ENTREGA')
  const [form, setForm] = useState({
    nomeCliente: '',
    telefoneCliente: '',
    enderecoRua: '',
    enderecoNumero: '',
    enderecoComplemento: '',
    enderecoBairro: '',
    enderecoCidade: '',
    formaPagamento: 'Dinheiro',
    observacoes: '',
  })

  const [frete, setFrete] = useState(null)
  const [calculandoFrete, setCalculandoFrete] = useState(false)
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState(null)

  useEffect(() => {
    buscarCardapio(slug).then((c) => setLoja(c.loja))
  }, [slug])

  function atualizarCampo(campo, valor) {
    setForm((atual) => ({ ...atual, [campo]: valor }))
  }

  async function handleCalcularFrete() {
    if (!loja || !form.enderecoBairro) return
    setCalculandoFrete(true)
    setErro(null)
    try {
      const resultado = await calcularFrete({ tenant: loja.tenant, bairro: form.enderecoBairro })
      setFrete(resultado)
      if (!resultado.entregavel) {
        setErro(resultado.mensagem)
      }
    } catch (e) {
      setErro(e.mensagem || 'Nao foi possivel calcular o frete')
    } finally {
      setCalculandoFrete(false)
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setErro(null)

    if (tipoEntrega === 'ENTREGA' && (!frete || !frete.entregavel)) {
      setErro('Calcule o frete para o seu bairro antes de finalizar o pedido')
      return
    }

    setEnviando(true)
    try {
      const pedido = await criarPedido({
        tenant: loja.tenant,
        nomeCliente: form.nomeCliente,
        telefoneCliente: form.telefoneCliente,
        tipoEntrega,
        enderecoRua: tipoEntrega === 'ENTREGA' ? form.enderecoRua : null,
        enderecoNumero: tipoEntrega === 'ENTREGA' ? form.enderecoNumero : null,
        enderecoComplemento: tipoEntrega === 'ENTREGA' ? form.enderecoComplemento : null,
        enderecoBairro: tipoEntrega === 'ENTREGA' ? form.enderecoBairro : null,
        enderecoCidade: tipoEntrega === 'ENTREGA' ? form.enderecoCidade : null,
        itens: itens.map((i) => ({ produtoGuid: i.produtoGuid, quantidade: i.quantidade, observacoes: i.observacoes })),
        formaPagamento: form.formaPagamento,
        observacoes: form.observacoes,
      })

      limparCarrinho()
      navigate(`/${slug}/pedido/${pedido.guid}`)
    } catch (e) {
      setErro(e.mensagem || 'Nao foi possivel enviar o pedido')
    } finally {
      setEnviando(false)
    }
  }

  const taxaEntrega = tipoEntrega === 'ENTREGA' && frete?.entregavel ? frete.taxa : 0
  const total = subtotal + Number(taxaEntrega || 0)

  return (
    <div className="pagina-checkout">
      <h1>Finalizar pedido</h1>

      <form onSubmit={handleSubmit} className="formulario-checkout">
        <fieldset>
          <legend>Seus dados</legend>
          <label>
            Nome completo
            <input required value={form.nomeCliente} onChange={(e) => atualizarCampo('nomeCliente', e.target.value)} />
          </label>
          <label>
            Telefone / WhatsApp
            <input required value={form.telefoneCliente} onChange={(e) => atualizarCampo('telefoneCliente', e.target.value)} />
          </label>
        </fieldset>

        <fieldset>
          <legend>Entrega</legend>
          <div className="opcoes-entrega">
            <label>
              <input type="radio" checked={tipoEntrega === 'ENTREGA'} onChange={() => setTipoEntrega('ENTREGA')} />
              Entrega
            </label>
            <label>
              <input type="radio" checked={tipoEntrega === 'RETIRADA'} onChange={() => setTipoEntrega('RETIRADA')} />
              Retirar no local
            </label>
          </div>

          {tipoEntrega === 'ENTREGA' && (
            <>
              <label>
                Rua
                <input required value={form.enderecoRua} onChange={(e) => atualizarCampo('enderecoRua', e.target.value)} />
              </label>
              <div className="linha-formulario">
                <label>
                  Numero
                  <input required value={form.enderecoNumero} onChange={(e) => atualizarCampo('enderecoNumero', e.target.value)} />
                </label>
                <label>
                  Complemento
                  <input value={form.enderecoComplemento} onChange={(e) => atualizarCampo('enderecoComplemento', e.target.value)} />
                </label>
              </div>
              <div className="linha-formulario">
                <label>
                  Bairro
                  <input required value={form.enderecoBairro} onChange={(e) => atualizarCampo('enderecoBairro', e.target.value)} />
                </label>
                <label>
                  Cidade
                  <input value={form.enderecoCidade} onChange={(e) => atualizarCampo('enderecoCidade', e.target.value)} />
                </label>
              </div>
              <button type="button" onClick={handleCalcularFrete} disabled={calculandoFrete || !form.enderecoBairro}>
                {calculandoFrete ? 'Calculando...' : 'Calcular frete'}
              </button>
              {frete && frete.entregavel && (
                <p className="frete-info">Frete: {formatarMoeda(frete.taxa)} — {frete.mensagem}</p>
              )}
            </>
          )}
        </fieldset>

        <fieldset>
          <legend>Pagamento</legend>
          <select value={form.formaPagamento} onChange={(e) => atualizarCampo('formaPagamento', e.target.value)}>
            <option value="Dinheiro">Dinheiro</option>
            <option value="Cartao na entrega">Cartao na entrega</option>
            <option value="Pix">Pix</option>
          </select>
          <label>
            Observacoes
            <textarea value={form.observacoes} onChange={(e) => atualizarCampo('observacoes', e.target.value)} />
          </label>
        </fieldset>

        <div className="resumo-checkout">
          <div>
            <span>Subtotal</span>
            <span>{formatarMoeda(subtotal)}</span>
          </div>
          <div>
            <span>Frete</span>
            <span>{tipoEntrega === 'ENTREGA' ? formatarMoeda(taxaEntrega) : 'Retirada'}</span>
          </div>
          <div className="resumo-checkout__total">
            <span>Total</span>
            <span>{formatarMoeda(total)}</span>
          </div>
        </div>

        {erro && <p className="mensagem-erro">{erro}</p>}

        <button type="submit" className="botao-principal" disabled={enviando}>
          {enviando ? 'Enviando pedido...' : 'Confirmar pedido'}
        </button>
      </form>
    </div>
  )
}
