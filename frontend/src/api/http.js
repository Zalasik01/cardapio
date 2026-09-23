import axios from 'axios'
import { lerSessao, limparSessao, salvarSessao } from '../utils/sessao'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api'

const http = axios.create({ baseURL: BASE_URL })

http.interceptors.request.use((config) => {
  const { accessToken } = lerSessao()
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`
  }
  return config
})

// Uma unica renovacao por vez: requisicoes que falham juntas aguardam a mesma promessa.
let renovacaoEmAndamento = null

function renovarSessao() {
  if (!renovacaoEmAndamento) {
    const { refreshToken } = lerSessao()
    renovacaoEmAndamento = axios
      .post(`${BASE_URL}/auth/refresh`, { refreshToken })
      .then((res) => {
        salvarSessao(res.data)
        return res.data.accessToken
      })
      .finally(() => {
        renovacaoEmAndamento = null
      })
  }
  return renovacaoEmAndamento
}

function ehRotaDeAutenticacao(url = '') {
  return url.includes('/auth/login') || url.includes('/auth/refresh')
}

http.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config
    const { refreshToken } = lerSessao()

    // access token expirado: renova com o refresh token e repete a requisicao uma vez
    if (error.response?.status === 401 && refreshToken && original && !original._renovada
      && !ehRotaDeAutenticacao(original.url)) {
      original._renovada = true
      try {
        const novoToken = await renovarSessao()
        original.headers.Authorization = `Bearer ${novoToken}`
        return http(original)
      } catch {
        limparSessao()
        window.location.assign('/admin/login')
        return Promise.reject({ ...error, mensagem: 'Sua sessao expirou. Entre novamente.' })
      }
    }

    const mensagem = error.response?.data?.mensagem || 'Ocorreu um erro inesperado. Tente novamente.'
    return Promise.reject({ ...error, mensagem })
  }
)

export default http
