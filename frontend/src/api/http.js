import axios from 'axios'

const http = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8080/api',
})

http.interceptors.request.use((config) => {
  const token = localStorage.getItem('cardapio_admin_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

http.interceptors.response.use(
  (response) => response,
  (error) => {
    const mensagem = error.response?.data?.mensagem || 'Ocorreu um erro inesperado. Tente novamente.'
    return Promise.reject({ ...error, mensagem })
  }
)

export default http
