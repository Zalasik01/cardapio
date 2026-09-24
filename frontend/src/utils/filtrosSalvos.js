/**
 * Filtros das telas de busca guardados no localStorage, na chave "filtros", como um json por tela:
 *   { "usuarios": { busca, filtros: {...}, mostrarInativos, automatico }, "funcionarios": {...} }
 * So existe entrada para a tela quando o usuario liga "Manter filtros salvos".
 */
const CHAVE = 'filtros'

function lerTodos() {
  try {
    const valor = JSON.parse(localStorage.getItem(CHAVE))
    return valor && typeof valor === 'object' ? valor : {}
  } catch {
    return {}
  }
}

export function lerFiltrosSalvos(tela) {
  return lerTodos()[tela] ?? null
}

/** Grava os filtros da tela; valor nulo remove a entrada da tela. */
export function salvarFiltros(tela, valor) {
  try {
    const todos = lerTodos()
    if (valor) {
      todos[tela] = valor
    } else {
      delete todos[tela]
    }
    if (Object.keys(todos).length) {
      localStorage.setItem(CHAVE, JSON.stringify(todos))
    } else {
      localStorage.removeItem(CHAVE)
    }
  } catch {
    // localStorage indisponivel: os filtros simplesmente nao sao mantidos
  }
}
