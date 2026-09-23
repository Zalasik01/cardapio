import { useEffect, useState } from 'react'
import foto1 from '../assets/login/login-1.webp'
import foto2 from '../assets/login/login-2.webp'

const FOTOS = [foto1, foto2]
const INTERVALO_MS = 7000

/**
 * Fundo das telas de acesso: as fotos se alternam com transicao suave (fade).
 * Quem prefere menos movimento (prefers-reduced-motion) ve so a primeira foto.
 */
export default function FundoLogin() {
  const [ativa, setAtiva] = useState(0)

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined
    const intervalo = setInterval(() => setAtiva((atual) => (atual + 1) % FOTOS.length), INTERVALO_MS)
    return () => clearInterval(intervalo)
  }, [])

  return (
    <div className="fundo-login" aria-hidden="true">
      {FOTOS.map((foto, i) => (
        <img
          key={foto}
          src={foto}
          alt=""
          decoding="async"
          className={`fundo-login__foto ${i === ativa ? 'fundo-login__foto--ativa' : ''}`}
        />
      ))}
      <div className="fundo-login__veu" />
    </div>
  )
}
