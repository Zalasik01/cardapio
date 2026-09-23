import { createContext, useContext, useEffect, useState } from 'react'
import { login as loginApi } from '../api/authApi'

const AuthContext = createContext(null)

const CHAVE_TOKEN = 'cardapio_admin_token'
const CHAVE_USUARIO = 'cardapio_admin_usuario'

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(() => {
    const salvo = localStorage.getItem(CHAVE_USUARIO)
    return salvo ? JSON.parse(salvo) : null
  })
  const [carregando, setCarregando] = useState(false)
  const [erro, setErro] = useState(null)

  useEffect(() => {
    if (usuario) {
      localStorage.setItem(CHAVE_USUARIO, JSON.stringify(usuario))
    } else {
      localStorage.removeItem(CHAVE_USUARIO)
    }
  }, [usuario])

  async function entrar(email, senha) {
    setCarregando(true)
    setErro(null)
    try {
      const resposta = await loginApi(email, senha)
      localStorage.setItem(CHAVE_TOKEN, resposta.token)
      setUsuario(resposta)
      return resposta
    } catch (e) {
      setErro(e.mensagem || 'Nao foi possivel entrar')
      throw e
    } finally {
      setCarregando(false)
    }
  }

  function sair() {
    localStorage.removeItem(CHAVE_TOKEN)
    setUsuario(null)
  }

  const ehAdmin = usuario?.perfil === 'ROLE_SUPER_ADMIN' || usuario?.perfil === 'ROLE_ADMIN_LOJA'

  return (
    <AuthContext.Provider value={{ usuario, entrar, sair, carregando, erro, ehAdmin }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const contexto = useContext(AuthContext)
  if (!contexto) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider')
  }
  return contexto
}
