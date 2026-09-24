import { useId } from 'react'
import { Password } from 'primereact/password'

/** Campo de senha (PrimeReact Password) com botao de mostrar/ocultar. */
export default function CampoSenha({ valor, aoAlterar, rotulo, id, autoComplete = 'current-password', required = true, ...resto }) {
  const idGerado = useId()
  const idCampo = id ?? idGerado

  return (
    <div className="campo campo--12">
      <label htmlFor={idCampo}>{rotulo}</label>
      <Password
        inputId={idCampo}
        value={valor}
        onChange={(e) => aoAlterar(e.target.value)}
        toggleMask
        feedback={false}
        autoComplete={autoComplete}
        required={required}
        {...resto}
      />
    </div>
  )
}
