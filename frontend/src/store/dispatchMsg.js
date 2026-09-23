import { store } from './index'
import { adicionar } from './mensagensSlice'

/**
 * Mensagens ao usuario. Use SEMPRE estas funcoes (nunca alert/confirm do navegador).
 * Funcionam em qualquer lugar, dentro ou fora de componentes React.
 */
export const dispatchMsgError = (texto) => store.dispatch(adicionar('error', texto))
export const dispatchMsgSuccess = (texto) => store.dispatch(adicionar('success', texto))
export const dispatchMsgWarn = (texto) => store.dispatch(adicionar('warn', texto))
