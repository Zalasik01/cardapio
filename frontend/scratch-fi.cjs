const { edit } = require('C:/Users/nizal/AppData/Local/Temp/claude/c--Users-nizal-Documents-GitHub-cardapio/5f19ba7a-e78c-4c6e-b494-9cd08549ccc9/scratchpad/ed.cjs')
const F = 'frontend/src/'

edit(F + 'App.jsx', [
  ["import PaginaAvaliacoes from './pages/admin/PaginaAvaliacoes'", "import PaginaAvaliacoes from './pages/admin/PaginaAvaliacoes'\nimport PaginaFidelidade from './pages/admin/PaginaFidelidade'"],
  ['<Route path="avaliacoes" element={<PaginaAvaliacoes />} />', '<Route path="avaliacoes" element={<PaginaAvaliacoes />} />\n            <Route path="fidelidade" element={<PaginaFidelidade />} />'],
])
edit(F + 'utils/permissoesRotas.js', [["  avaliacoes: 'AVALIACOES_LEITURA',", "  avaliacoes: 'AVALIACOES_LEITURA',\n  fidelidade: 'FIDELIDADE_LEITURA',"]])

// ---- checkout: usar cashback
edit(F + 'pages/cliente/PaginaCheckout.jsx', [
  ['import { calcularFreteEndereco,', "import { obterCashbackResgatavel } from '../../api/fidelidadeApi'\nimport { calcularFreteEndereco,"],
  ["  const [salvos, setSalvos] = useState([])", "  const [salvos, setSalvos] = useState([])\n  const [cashbackDisponivel, setCashbackDisponivel] = useState(0)\n  const [usarCashback, setUsarCashback] = useState(false)"],
  ['  const campo = (nome, valor)', `  // cashback que dá para usar neste pedido (depende do valor dos itens já com o cupom)
  const baseCashback = Math.max(0, subtotal - Number(cupom?.desconto ?? 0))
  useEffect(() => {
    if (!cliente || !cardapio.cashbackPercentual) return undefined
    let cancelado = false
    obterCashbackResgatavel(slug, baseCashback.toFixed(2))
      .then((v) => { if (!cancelado) { setCashbackDisponivel(Number(v)); if (Number(v) <= 0) setUsarCashback(false) } })
      .catch(() => { if (!cancelado) setCashbackDisponivel(0) })
    return () => { cancelado = true }
  }, [cliente, slug, baseCashback, cardapio.cashbackPercentual])

  const campo = (nome, valor)`],
  ['  const total = Math.max(0, subtotal - desconto + taxa)', '  const cashbackAplicado = usarCashback ? Math.min(cashbackDisponivel, Math.max(0, subtotal - desconto)) : 0\n  const total = Math.max(0, subtotal - desconto - cashbackAplicado + taxa)'],
  ['        codigoCupom: cupom?.codigo ?? null,', '        codigoCupom: cupom?.codigo ?? null,\n        usarCashback: cashbackAplicado > 0,'],
  ['      <section className="loja-bloco loja-cupom">', `      {cashbackDisponivel > 0 && (
        <section className="loja-bloco loja-cashback">
          <label className="loja-check">
            <input type="checkbox" checked={usarCashback} onChange={(e) => setUsarCashback(e.target.checked)} />
            <span>Usar meu cashback: <strong>{formatarMoeda(cashbackDisponivel)}</strong> de desconto neste pedido</span>
          </label>
        </section>
      )}
      <section className="loja-bloco loja-cupom">`],
  ['        <p><span>Entrega</span>', "        {cashbackAplicado > 0 && <p className=\"loja-resumo__desconto\"><span>Cashback</span><span>-{formatarMoeda(cashbackAplicado)}</span></p>}\n        <p><span>Entrega</span>"],
])

// ---- cardápio: faixa "ganhe X% de volta"
edit(F + 'pages/cliente/PaginaCardapio.jsx', [
  ['            {abertura && <li><i className="fa-regular fa-calendar"', '            {cardapio.cashbackPercentual != null && (\n              <li className="loja-capa__cashback"><i className="fa-solid fa-coins" aria-hidden="true" /> {String(cardapio.cashbackPercentual).replace(\'.00\', \'\').replace(\'.\', \',\')}% de cashback</li>\n            )}\n            {abertura && <li><i className="fa-regular fa-calendar"'],
])

// ---- meus pedidos: carteira
edit(F + 'pages/cliente/PaginaMeusPedidos.jsx', [
  ["import { listarPedidosCliente, obterResumoCliente } from '../../api/clienteApi'", "import { listarPedidosCliente, obterResumoCliente } from '../../api/clienteApi'\nimport { obterCarteiraCliente } from '../../api/fidelidadeApi'"],
  ['  const [resumo, setResumo] = useState(null)', '  const [resumo, setResumo] = useState(null)\n  const [carteira, setCarteira] = useState(null)\n  const [verExtrato, setVerExtrato] = useState(false)'],
  ["    obterResumoCliente(slug).then(setResumo).catch(() => setResumo(null))", "    obterResumoCliente(slug).then(setResumo).catch(() => setResumo(null))\n    obterCarteiraCliente(slug).then(setCarteira).catch(() => setCarteira(null))"],
  ['          {resumo?.favorito && (', `          {carteira?.ativo && (
            <section className="cliente-carteira">
              <div>
                <small>Seu cashback</small>
                <strong>{formatarMoeda(carteira.saldo)}</strong>
                {carteira.proximoVencimento && (
                  <small>{formatarMoeda(carteira.proximoVencimento.valor)} vence em {new Date(carteira.proximoVencimento.data).toLocaleDateString('pt-BR')}</small>
                )}
              </div>
              <p>Ganhe <strong>{String(carteira.percentual).replace('.00', '').replace('.', ',')}%</strong> de volta a cada pedido entregue e use no próximo
                {Number(carteira.resgateMinimo) > 0 && \` (a partir de \${formatarMoeda(carteira.resgateMinimo)})\`}.</p>
              {carteira.extrato.length > 0 && (
                <>
                  <button type="button" className="loja-link" onClick={() => setVerExtrato((v) => !v)} aria-expanded={verExtrato}>
                    {verExtrato ? 'Ocultar extrato' : 'Ver extrato'}
                  </button>
                  {verExtrato && (
                    <ul className="cliente-carteira__extrato">
                      {carteira.extrato.map((l, i) => (
                        <li key={i}>
                          <span>{l.tipo === 'GANHO' ? 'Cashback recebido' : l.tipo === 'RESGATE' ? 'Usado no pedido' : 'Devolvido (pedido cancelado)'}{l.pedido ? \` · #\${l.pedido}\` : ''}</span>
                          <strong className={Number(l.valor) < 0 ? 'negativo' : 'positivo'}>{Number(l.valor) > 0 ? '+' : ''}{formatarMoeda(l.valor)}</strong>
                        </li>
                      ))}
                    </ul>
                  )}
                </>
              )}
            </section>
          )}

          {resumo?.favorito && (`],
])
