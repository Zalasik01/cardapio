import { Checkbox } from 'primereact/checkbox'

/** Checkbox "Ativo" no topo dos cadastros. rotulo muda o texto (ex.: "Ativa" para lojas). */
export default function CampoAtivo({ valor, aoAlterar, rotulo = 'Ativo' }) {
  return (
    <div className="campo campo--12 campo--linha">
      <span className="campo-checkbox">
        <Checkbox inputId="ativo" checked={valor} onChange={(e) => aoAlterar(e.checked)} />
        <label htmlFor="ativo">{rotulo}</label>
      </span>
    </div>
  )
}
