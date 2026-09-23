import { createSlice, nanoid } from '@reduxjs/toolkit'

/**
 * Fila de mensagens ao usuario (erro, sucesso, aviso). Quem exibe e a CentralMensagens
 * (Toast do PrimeReact); o resto do sistema so dispara pelas funcoes de dispatchMsg.js.
 */
const mensagensSlice = createSlice({
  name: 'mensagens',
  initialState: { fila: [] },
  reducers: {
    adicionar: {
      reducer(state, action) {
        state.fila.push(action.payload)
      },
      prepare(tipo, texto) {
        return { payload: { id: nanoid(), tipo, texto } }
      },
    },
    remover(state, action) {
      state.fila = state.fila.filter((mensagem) => mensagem.id !== action.payload)
    },
  },
})

export const { adicionar, remover } = mensagensSlice.actions
export default mensagensSlice.reducer
