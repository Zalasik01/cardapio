import { createContext, useCallback, useContext, useState } from 'react'
import { login as loginApi, selecionarLoja as selecionarLojaApi } from '../api/authApi'
import { lerSessao, limparSessao, salvarSessao } from '../utils/sessao'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [sessao, setSessao] = useState(() => {
    const { accessToken, usuarioLogado, loja } = lerSessao()
    return accessToken ? { usuarioLogado, loja } : { usuarioLogado: null, loja: null }
  })
  const [carregando, setCarregando] = useState(false)
  const [erro, setErro] = useState(null)

  const aplicarResposta = useCallback((resposta) => {
    salvarSessao(resposta)
    setSessao({ usuarioLogado: resposta.usuarioLogado, loja: resposta.loja })
    return resposta
  }, [])

  async function entrar(email, senha) {
    setCarregando(true)
    setErro(null)
    try {
      return aplicarResposta(await loginApi(email, senha))
    } catch (e) {
      setErro(e.mensagem || 'Nao foi possivel entrar')
      throw e
    } finally {
      setCarregando(false)
    }
  }

  /** Vincula a sessao a uma loja; o backend devolve novos tokens com o tenant dela. */
  async function selecionarLoja(lojaGuid) {
    return aplicarResposta(await selecionarLojaApi(lojaGuid))
  }

  function sair() {
    limparSessao()
    setSessao({ usuarioLogado: null, loja: null })
  }

  return (
    <AuthContext.Provider
      value={{
        usuarioLogado: sessao.usuarioLogado,
        loja: sessao.loja,
        entrar,
        selecionarLoja,
        aplicarSessao: aplicarResposta,
        sair,
        carregando,
        erro,
      }}
    >
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
