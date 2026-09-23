import { createSlice } from '@reduxjs/toolkit'

/**
 * Preferencias de tela do usuario (hoje: menu lateral recolhido). Ficam no navegador
 * (localStorage, veja store/index.js) e, se o usuario optar em "Seu perfil", tambem sao
 * guardadas na conta dele e reaplicadas no proximo login.
 */
export const CHAVE_MENU_RECOLHIDO = 'cardapio_menu_recolhido'

function lerMenuRecolhido() {
  try {
    return localStorage.getItem(CHAVE_MENU_RECOLHIDO) === '1'
  } catch {
    return false
  }
}

const preferenciasSlice = createSlice({
  name: 'preferencias',
  initialState: { menuRecolhido: lerMenuRecolhido() },
  reducers: {
    definirMenuRecolhido(state, action) {
      state.menuRecolhido = action.payload
    },
    /** Aplica preferencias vindas da conta do usuario (ignora campos desconhecidos). */
    aplicarPreferencias(state, action) {
      if (typeof action.payload?.menuRecolhido === 'boolean') {
        state.menuRecolhido = action.payload.menuRecolhido
      }
    },
    /** Volta tudo ao padrao ("Limpar configuracoes locais"). */
    limparPreferencias(state) {
      state.menuRecolhido = false
    },
  },
})

export const { definirMenuRecolhido, aplicarPreferencias, limparPreferencias } = preferenciasSlice.actions
export default preferenciasSlice.reducer
