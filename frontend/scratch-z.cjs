const { edit } = require('C:/Users/nizal/AppData/Local/Temp/claude/c--Users-nizal-Documents-GitHub-cardapio/5f19ba7a-e78c-4c6e-b494-9cd08549ccc9/scratchpad/ed.cjs')
const F = 'frontend/src/'
edit(F + 'api/entregadoresApi.js', [
  ["export const entregadorEntregou = (token, pedidoId, foto) => {\n  const dados = new FormData()\n  if (foto) dados.append('foto', foto)", "export const entregadorEntregou = (token, pedidoId, foto, codigo) => {\n  const dados = new FormData()\n  if (foto) dados.append('foto', foto)\n  if (codigo) dados.append('codigo', codigo)"],
  ['/** Conclui a entrega; foto é um File opcional (comprovante). */', '/** Conclui a entrega; foto é um File opcional (comprovante) e codigo é o de 4 dígitos que o cliente recebeu (prova de entrega). */'],
])
// acompanhamento: avisos push + service worker
edit(F + 'pages/publico/PaginaAcompanhamento.jsx', [
  ["import MapaAcompanhamento from '../../components/MapaAcompanhamento'", "import MapaAcompanhamento from '../../components/MapaAcompanhamento'\nimport { ativarPush, pushAtivo, pushSuportado } from '../../utils/push'"],
  ['  const encerradoRef = useRef(false)\n', `  const encerradoRef = useRef(false)
  const [avisos, setAvisos] = useState(null) // null = verificando; true/false = ligado/desligado

  // service worker do cardápio (recebe os avisos mesmo com a página fechada) e estado dos avisos neste aparelho
  useEffect(() => {
    if ('serviceWorker' in navigator) navigator.serviceWorker.register('/sw-loja.js', { scope: '/' }).catch(() => {})
    if (!pushSuportado()) {
      setAvisos(false)
      return
    }
    pushAtivo().then(setAvisos).catch(() => setAvisos(false))
  }, [])

  async function ligarAvisos() {
    try {
      setAvisos(await ativarPush(\`/publico/acompanhamento/\${guid}/push\`))
    } catch {
      setAvisos(false)
    }
  }
`],
  ['        <section className="pedido-ajuda">', `        {ativo && avisos === false && pushSuportado() && Notification.permission !== 'denied' && (
          <button type="button" className="pedido-avisos" onClick={ligarAvisos}>
            <i className="fa-solid fa-bell" aria-hidden="true" /> Avisar quando meu pedido mudar de situação
          </button>
        )}
        {ativo && avisos === true && <p className="pedido-avisos pedido-avisos--ligado"><i className="fa-solid fa-bell" aria-hidden="true" /> Você será avisado a cada mudança.</p>}

        <section className="pedido-ajuda">`],
])
