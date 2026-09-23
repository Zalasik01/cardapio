import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

export default function PaginaLogin() {
  const { entrar, carregando, erro } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    try {
      await entrar(email, senha)
      navigate('/admin')
    } catch {
      // erro ja tratado no contexto
    }
  }

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
          <input type="password" required value={senha} onChange={(e) => setSenha(e.target.value)} />
        </label>
        {erro && <p className="mensagem-erro">{erro}</p>}
        <button type="submit" className="botao-principal" disabled={carregando}>
          {carregando ? 'Entrando...' : 'Entrar'}
        </button>
      </form>
    </div>
  )
}
