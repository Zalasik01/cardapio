import { createSlice } from '@reduxjs/toolkit'

/**
 * Preferencias de tela do usuario (hoje: menu lateral recolhido), guardadas no navegador
 * (localStorage, veja store/index.js).
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
  },
})

export const { definirMenuRecolhido } = preferenciasSlice.actions
export default preferenciasSlice.reducer
