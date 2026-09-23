import { configureStore } from '@reduxjs/toolkit'
import mensagens from './mensagensSlice'
import preferencias, { CHAVE_MENU_RECOLHIDO } from './preferenciasSlice'

export const store = configureStore({
  reducer: { mensagens, preferencias },
})

// persiste as preferencias no navegador sempre que mudarem
let ultimoMenuRecolhido = store.getState().preferencias.menuRecolhido
store.subscribe(() => {
  const { menuRecolhido } = store.getState().preferencias
  if (menuRecolhido === ultimoMenuRecolhido) return
  ultimoMenuRecolhido = menuRecolhido
  try {
    if (menuRecolhido) localStorage.setItem(CHAVE_MENU_RECOLHIDO, '1')
    else localStorage.removeItem(CHAVE_MENU_RECOLHIDO)
  } catch {
    // navegador sem localStorage: a preferencia vale so nesta sessao
  }
})
