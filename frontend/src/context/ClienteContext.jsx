import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import { Dialog } from 'primereact/dialog'
import { solicitarCodigoCliente, verificarCodigoCliente } from '../api/clienteApi'
import { mascaraTelefone } from '../utils/telefone'
import {
  EVENTO_SESSAO_CLIENTE, lerSessaoCliente, limparSessaoCliente, salvarSessaoCliente,
} from '../utils/sessaoCliente'

const ClienteContext = createContext(null)

/** Entrar com o telefone: passo 1 pede o número, passo 2 o código enviado (e o nome, se ainda não tiver conta). */
function DialogoLogin({ aoFechar, aoEntrar, slug }) {
  const [passo, setPasso] = useState('telefone')
  const [telefone, setTelefone] = useState('')
  const [codigo, setCodigo] = useState('')
  const [nome, setNome] = useState('')
  const [codigoDev, setCodigoDev] = useState(null)
  const [erro, setErro] = useState(null)
  const [ocupado, setOcupado] = useState(false)
  const campoCodigo = useRef(null)

  useEffect(() => {
    if (passo === 'codigo') campoCodigo.current?.focus()
  }, [passo])

  async function enviarCodigo(e) {
    e?.preventDefault()
    setErro(null)
    setOcupado(true)
    try {
      const resposta = await solicitarCodigoCliente(telefone)
      setCodigoDev(resposta.codigoDev ?? null)
      setPasso('codigo')
    } catch (err) {
      setErro(err.mensagem)
    } finally {
      setOcupado(false)
    }
  }

  async function confirmar(e) {
    e.preventDefault()
    setErro(null)
    setOcupado(true)
    try {
      const sessao = await verificarCodigoCliente({ telefone, codigo, nome, slug })
      aoEntrar(sessao)
    } catch (err) {
      setErro(err.mensagem)
    } finally {
      setOcupado(false)
    }
  }

  return (
    <Dialog visible onHide={aoFechar} header="Entrar" className="loja-dialogo loja-dialogo--login" dismissableMask draggable={false}
            style={{ width: 'min(26rem, 96vw)' }}>
      {passo === 'telefone' ? (
        <form className="loja-login" onSubmit={enviarCodigo}>
          <p>Informe seu telefone para acompanhar pedidos, repetir compras e ganhar vantagens.</p>
          <label className="loja-campo">Telefone com DDD
            <input type="tel" inputMode="tel" autoComplete="tel" autoFocus required placeholder="(00) 00000-0000"
                   value={telefone} onChange={(e) => setTelefone(mascaraTelefone(e.target.value))} />
          </label>
          {erro && <p className="loja__erro" role="alert">{erro}</p>}
          <button type="submit" className="loja-botao" disabled={ocupado || telefone.replace(/\D/g, '').length < 10}>
            {ocupado ? 'Enviando...' : 'Receber código'}
          </button>
        </form>
      ) : (
        <form className="loja-login" onSubmit={confirmar}>
          <p>Enviamos um código de 6 dígitos para <strong>{telefone}</strong>.</p>
          <label className="loja-campo">Código
            <input ref={campoCodigo} inputMode="numeric" autoComplete="one-time-code" required maxLength={6} placeholder="000000"
                   className="loja-login__codigo" value={codigo} onChange={(e) => setCodigo(e.target.value.replace(/\D/g, ''))} />
          </label>
          <label className="loja-campo">Seu nome <small>(na primeira vez)</small>
            <input autoComplete="name" value={nome} onChange={(e) => setNome(e.target.value)} />
          </label>
          {codigoDev && (
            <p className="loja-frete">
              Modo de teste (sem WhatsApp/SMS): seu código é <strong>{codigoDev}</strong>{' '}
              <button type="button" className="loja-link" onClick={() => setCodigo(codigoDev)}>preencher</button>
            </p>
          )}
          {erro && <p className="loja__erro" role="alert">{erro}</p>}
          <button type="submit" className="loja-botao" disabled={ocupado || codigo.length < 6}>
            {ocupado ? 'Entrando...' : 'Entrar'}
          </button>
          <button type="button" className="loja-botao loja-botao--sec" disabled={ocupado} onClick={() => { setPasso('telefone'); setCodigo('') }}>
            Trocar telefone
          </button>
        </form>
      )}
    </Dialog>
  )
}

/** Cliente logado no cardápio online (por telefone/OTP) e o diálogo de entrada, que qualquer tela pode abrir. */
export function ClienteProvider({ children, slug }) {
  const [sessao, setSessao] = useState(lerSessaoCliente)
  const [aberto, setAberto] = useState(false)
  const depois = useRef(null)

  useEffect(() => {
    const sincronizar = () => setSessao(lerSessaoCliente())
    window.addEventListener(EVENTO_SESSAO_CLIENTE, sincronizar)
    window.addEventListener('storage', sincronizar)
    return () => {
      window.removeEventListener(EVENTO_SESSAO_CLIENTE, sincronizar)
      window.removeEventListener('storage', sincronizar)
    }
  }, [])

  /** Abre o login; aoConcluir roda depois que o cliente entra. */
  const abrirLogin = useCallback((aoConcluir) => {
    depois.current = aoConcluir ?? null
    setAberto(true)
  }, [])

  function entrou(nova) {
    salvarSessaoCliente(nova)
    setSessao(nova)
    setAberto(false)
    depois.current?.(nova.cliente)
    depois.current = null
  }

  const sair = useCallback(() => limparSessaoCliente(), [])

  return (
    <ClienteContext.Provider value={{ cliente: sessao.token ? sessao.cliente : null, abrirLogin, sair }}>
      {children}
      {aberto && <DialogoLogin aoFechar={() => setAberto(false)} aoEntrar={entrou} slug={slug} />}
    </ClienteContext.Provider>
  )
}

export function useCliente() {
  const contexto = useContext(ClienteContext)
  if (!contexto) throw new Error('useCliente deve ser usado dentro de um ClienteProvider')
  return contexto
}
