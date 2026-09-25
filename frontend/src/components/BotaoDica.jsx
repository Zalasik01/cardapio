import { useRef } from 'react'
import { Button } from 'primereact/button'
import { Tooltip } from 'primereact/tooltip'

/**
 * Botão com uma dica (tooltip) ao passar o mouse, no mesmo visual da dica "!" dos dashboards.
 * O tooltip fica preso a um span ao redor do botão, o que o mantém centralizado sobre o ícone.
 * Aceita as mesmas props do Button do PrimeReact, mais dica (o texto) e posicao ('top' por padrão; use
 * 'left' para botões no canto direito da tela, onde o tooltip em cima seria empurrado para o lado).
 */
export default function BotaoDica({ dica, posicao = 'top', ...props }) {
  const alvo = useRef(null)

  return (
    <>
      <span ref={alvo} className="botao-dica">
        <Button {...props} />
      </span>
      <Tooltip target={alvo} content={dica} position={posicao} />
    </>
  )
}
