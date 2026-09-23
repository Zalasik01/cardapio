import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import ModalSelecionarLoja from '../../components/ModalSelecionarLoja'

export default function PaginaLogin() {
  const { entrar, sair, usuarioLogado, loja, carregando, erro } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [mostrarSenha, setMostrarSenha] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    try {
      const resposta = await entrar(email, senha)
      // sem loja vinculada (usuario do sistema ou com varias lojas), o modal de selecao abre aqui mesmo
      if (resposta.loja) navigate('/admin/dashboard')
    } catch {
      // erro ja tratado no contexto
    }
  }

  const precisaEscolherLoja = !!usuarioLogado && !loja

  return (
    <div className="pagina-login">
      <form onSubmit={handleSubmit} className="formulario-login">
        <h1>Painel administrativo</h1>
        <label>
          Email
          <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        </label>
        <label>
          Senha
          <span className="campo-senha">
            <input
              type={mostrarSenha ? 'text' : 'password'}
              required
              autoComplete="current-password"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
            />
            <button
              type="button"
              className="campo-senha__alternar"
              aria-label={mostrarSenha ? 'Ocultar senha' : 'Mostrar senha'}
              aria-pressed={mostrarSenha}
              title={mostrarSenha ? 'Ocultar senha' : 'Mostrar senha'}
              onClick={() => setMostrarSenha((atual) => !atual)}
            >
              <i className={`fa-solid ${mostrarSenha ? 'fa-eye-slash' : 'fa-eye'}`} aria-hidden="true" />
            </button>
          </span>
        </label>
        {erro && <p className="mensagem-erro">{erro}</p>}
        <button type="submit" className="botao-principal" disabled={carregando}>
          {carregando ? 'Entrando...' : 'Entrar'}
        </button>
      </form>

      {precisaEscolherLoja && (
        <ModalSelecionarLoja aoSelecionar={() => navigate('/admin/dashboard')} aoSair={sair} />
      )}
    </div>
  )
}
