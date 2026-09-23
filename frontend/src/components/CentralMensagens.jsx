import { useEffect, useRef } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { ConfirmDialog } from 'primereact/confirmdialog'
import { Toast } from 'primereact/toast'
import { remover } from '../store/mensagensSlice'

const TITULOS = { error: 'Erro', success: 'Sucesso', warn: 'Atenção' }
const DURACAO_MS = { error: 8000, success: 4000, warn: 6000 }

/**
 * Exibe as mensagens da fila do Redux (Toast) e hospeda os dialogos de confirmacao
 * (utils/confirmar.js). Montada uma unica vez, na raiz da aplicacao.
 */
export default function CentralMensagens() {
  const fila = useSelector((estado) => estado.mensagens.fila)
  const dispatch = useDispatch()
  const toast = useRef(null)

  useEffect(() => {
    fila.forEach((mensagem) => {
      toast.current?.show({
        severity: mensagem.tipo,
        summary: TITULOS[mensagem.tipo],
        detail: mensagem.texto,
        life: DURACAO_MS[mensagem.tipo],
      })
      dispatch(remover(mensagem.id))
    })
  }, [fila, dispatch])

  return (
    <>
      <Toast ref={toast} position="top-right" />
      <ConfirmDialog />
    </>
  )
}
