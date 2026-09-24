import { useRef } from 'react'
import { Tooltip } from 'primereact/tooltip'

/**
 * Ícone de exclamação que explica algo (um número, um gráfico) num tooltip ao passar o mouse
 * ou focar com o teclado. texto: a dica exibida.
 */
export default function Dica({ texto }) {
  const alvo = useRef(null)

  return (
    <>
      <span ref={alvo} className="dica" tabIndex={0} role="img" aria-label={`Dica: ${texto}`}>
        <i className="pi pi-exclamation-circle" aria-hidden="true" />
      </span>
      <Tooltip target={alvo} content={texto} position="top" className="dica__tooltip" />
    </>
  )
}
