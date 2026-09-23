import { useState } from 'react'

/** Campo de senha com botao de mostrar/ocultar. */
export default function CampoSenha({ valor, aoAlterar, autoComplete = 'current-password', rotulo, ...resto }) {
  const [visivel, setVisivel] = useState(false)

  return (
    <label>
      {rotulo}
      <span className="campo-senha">
        <input
          type={visivel ? 'text' : 'password'}
          required
          autoComplete={autoComplete}
          value={valor}
          onChange={(e) => aoAlterar(e.target.value)}
          {...resto}
        />
        <button
          type="button"
          className="campo-senha__alternar"
          aria-label={visivel ? 'Ocultar senha' : 'Mostrar senha'}
          aria-pressed={visivel}
          title={visivel ? 'Ocultar senha' : 'Mostrar senha'}
          onClick={() => setVisivel((atual) => !atual)}
        >
          <i className={`fa-solid ${visivel ? 'fa-eye-slash' : 'fa-eye'}`} aria-hidden="true" />
        </button>
      </span>
    </label>
  )
}
