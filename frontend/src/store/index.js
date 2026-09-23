import { configureStore } from '@reduxjs/toolkit'
import mensagens from './mensagensSlice'

export const store = configureStore({
  reducer: { mensagens },
})
