import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import CampoSenha from '../../components/CampoSenha'
import FundoLogin from '../../components/FundoLogin'
import ModalSelecionarLoja from '../../components/ModalSelecionarLoja'

export default function PaginaLogin() {
  const { entrar, sair, usuarioLogado, loja, carregando, erro } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')

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
      <FundoLogin />
      <form onSubmit={handleSubmit} className="formulario-login">
        <h1>Painel administrativo</h1>
        <label>
          Email
          <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        </label>
        <CampoSenha rotulo="Senha" valor={senha} aoAlterar={setSenha} />
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
