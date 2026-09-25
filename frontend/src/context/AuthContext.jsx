import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { obterMinhasPermissoes } from '../api/permissoesApi'
import { login as loginApi, selecionarLoja as selecionarLojaApi } from '../api/authApi'
import { lerSessao, limparSessao, salvarSessao, salvarUsuarioLogado } from '../utils/sessao'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [sessao, setSessao] = useState(() => {
    const { accessToken, usuarioLogado, loja } = lerSessao()
    return accessToken ? { usuarioLogado, loja } : { usuarioLogado: null, loja: null }
  })
  const [carregando, setCarregando] = useState(false)
  const [versaoFoto, setVersaoFoto] = useState(0) // muda quando a foto do usuario troca (o cabecalho recarrega)
  const [erro, setErro] = useState(null)
  const [permissoes, setPermissoes] = useState(null) // { total, codigos } de quem esta logado na loja; nulo enquanto carrega

  // as permissoes vem do servidor (por loja): recarregam ao entrar ou trocar de loja
  const tenant = sessao.loja?.tenant
  useEffect(() => {
    setPermissoes(null)
    if (!tenant) return undefined
    let descartada = false
    obterMinhasPermissoes()
      .then((dados) => !descartada && setPermissoes({ total: dados.total, codigos: new Set(dados.codigos) }))
      .catch(() => !descartada && setPermissoes({ total: false, codigos: new Set() }))
    return () => {
      descartada = true
    }
  }, [tenant])

  /** Tem ao menos uma das permissoes? Enquanto carrega libera (o backend confere de qualquer forma). */
  const pode = useCallback((...codigos) => {
    if (!permissoes || permissoes.total) return true
    return codigos.some((codigo) => permissoes.codigos.has(codigo))
  }, [permissoes])

  const aplicarResposta = useCallback((resposta) => {
    salvarSessao(resposta)
    setSessao({ usuarioLogado: resposta.usuarioLogado, loja: resposta.loja })

    return resposta
  }, [])

  /** Atualiza os dados do usuario logado na sessao (nome, foto, configuracoes...) apos editar o perfil. */
  const atualizarUsuarioLogado = useCallback((usuarioLogado) => {
    salvarUsuarioLogado(usuarioLogado)
    setSessao((atual) => ({ ...atual, usuarioLogado }))
    setVersaoFoto((versao) => versao + 1)
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
        atualizarUsuarioLogado,
        versaoFoto,
        pode,
        permissoesCarregadas: permissoes !== null,
        podeConcederPermissoes: !permissoes || permissoes.total,
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
