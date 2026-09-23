/**
 * Sessao do painel administrativo, guardada no localStorage em 4 chaves:
 *   accessToken    - token das requisicoes
 *   refreshToken   - token para renovar o accessToken
 *   loja           - dto da loja selecionada (ausente ate o usuario escolher)
 *   usuarioLogado  - dto do usuario logado
 */
const CHAVES = {
  accessToken: 'accessToken',
  refreshToken: 'refreshToken',
  loja: 'loja',
  usuarioLogado: 'usuarioLogado',
}

function lerJson(chave) {
  try {
    const valor = localStorage.getItem(chave)
    return valor ? JSON.parse(valor) : null
  } catch {
    return null
  }
}

export function lerSessao() {
  return {
    accessToken: localStorage.getItem(CHAVES.accessToken),
    refreshToken: localStorage.getItem(CHAVES.refreshToken),
    loja: lerJson(CHAVES.loja),
    usuarioLogado: lerJson(CHAVES.usuarioLogado),
  }
}

/** Grava a resposta de login / selecao de loja / refresh (AuthResponse). */
export function salvarSessao({ accessToken, refreshToken, usuarioLogado, loja }) {
  localStorage.setItem(CHAVES.accessToken, accessToken)
  localStorage.setItem(CHAVES.refreshToken, refreshToken)
  localStorage.setItem(CHAVES.usuarioLogado, JSON.stringify(usuarioLogado))
  if (loja) {
    localStorage.setItem(CHAVES.loja, JSON.stringify(loja))
  } else {
    localStorage.removeItem(CHAVES.loja)
  }
}

/** Atualiza so o usuarioLogado (ex.: apos editar o proprio perfil), sem mexer nos tokens. */
export function salvarUsuarioLogado(usuarioLogado) {
  localStorage.setItem(CHAVES.usuarioLogado, JSON.stringify(usuarioLogado))
}

export function limparSessao() {
  Object.values(CHAVES).forEach((chave) => localStorage.removeItem(chave))
}
