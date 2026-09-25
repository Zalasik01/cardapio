import { useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { Button } from 'primereact/button'
import { dispatchMsgError } from '../store/dispatchMsg'

const TAMANHO_MAXIMO = 2 * 1024 * 1024
const TIPOS = { 'image/png': ['.png'], 'image/jpeg': ['.jpg', '.jpeg'], 'image/webp': ['.webp'] }

/**
 * Área para arrastar (ou clicar e escolher) uma imagem, no lugar de digitar um endereço. O arquivo é enviado na
 * hora pela função `enviar(arquivo)` (devolve a URL guardada) e a URL vai para o formulário por aoAlterar(url).
 *
 * Props: valor (URL atual ou ''), aoAlterar(url), enviar(arquivo) => Promise<string>, desabilitado.
 */
export default function DropzoneImagem({ valor, aoAlterar, enviar, desabilitado = false }) {
  const [enviando, setEnviando] = useState(false)

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: TIPOS,
    maxSize: TAMANHO_MAXIMO,
    multiple: false,
    disabled: desabilitado || enviando,
    onDropRejected: (rejeitados) => {
      const erro = rejeitados[0]?.errors[0]?.code
      dispatchMsgError(erro === 'file-too-large' ? 'A imagem deve ter no máximo 2 MB.' : 'Envie uma imagem PNG, JPEG ou WEBP.')
    },
    onDropAccepted: async ([arquivo]) => {
      setEnviando(true)
      try {
        aoAlterar(await enviar(arquivo))
      } catch (e) {
        dispatchMsgError(e.mensagem || 'Não foi possível enviar a imagem.')
      } finally {
        setEnviando(false)
      }
    },
  })

  const classes = ['dropzone-imagem__area']
  if (isDragActive) classes.push('dropzone-imagem__area--ativa')

  return (
    <div className="dropzone-imagem">
      <div {...getRootProps({ className: classes.join(' ') })}>
        <input {...getInputProps()} aria-label="Escolher imagem" />
        {valor ? (
          <img src={valor} alt="Imagem enviada" className="dropzone-imagem__previa" />
        ) : (
          <span className="dropzone-imagem__texto">
            <i className={enviando ? 'pi pi-spin pi-spinner' : 'fa-solid fa-cloud-arrow-up'} aria-hidden="true" />
            {enviando ? 'Enviando...' : isDragActive ? 'Solte a imagem aqui' : 'Arraste uma imagem ou clique para escolher'}
            <small>PNG, JPEG ou WEBP de até 2 MB</small>
          </span>
        )}
      </div>
      {valor && (
        <div className="dropzone-imagem__acoes">
          <small>{enviando ? 'Enviando...' : 'Arraste outra imagem sobre a atual para trocar.'}</small>
          <Button type="button" label="Remover" icon="pi pi-times" severity="danger" text size="small"
                  disabled={desabilitado || enviando} onClick={() => aoAlterar('')} />
        </div>
      )}
    </div>
  )
}
