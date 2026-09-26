/** Sessão do cliente do cardápio online (fica só neste navegador; não mistura com a sessão do painel). */
const CHAVE = 'cardapio_cliente'
export const EVENTO_SESSAO_CLIENTE = 'cardapio:sessao-cliente'

export function lerSessaoCliente() {
  try {
    return JSON.parse(localStorage.getItem(CHAVE)) ?? { token: null, cliente: null }
  } catch {
    return { token: null, cliente: null }
  }
}

export function salvarSessaoCliente(sessao) {
  try {
    localStorage.setItem(CHAVE, JSON.stringify(sessao))
  } catch {
    // sem armazenamento local: a sessão vale só até recarregar a página
  }
  window.dispatchEvent(new Event(EVENTO_SESSAO_CLIENTE))
}

export function limparSessaoCliente() {
  try {
    localStorage.removeItem(CHAVE)
  } catch {
    // ignora
  }
  window.dispatchEvent(new Event(EVENTO_SESSAO_CLIENTE))
}
