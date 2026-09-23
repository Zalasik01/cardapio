/** Secao (bloco com titulo) de uma tela de cadastro longa. */
export function SecaoCrud({ id, titulo, children }) {
  return (
    <section id={id} className="secao-crud">
      <h2>{titulo}</h2>
      {children}
    </section>
  )
}

/** Grade de 12 colunas onde os Campos se distribuem. */
export function GradeCampos({ children }) {
  return <div className="grade-campos">{children}</div>
}

/**
 * Campo de formulario com rotulo. `tamanho` e o numero de colunas (de 12) que ele ocupa em
 * telas largas; em telas pequenas ocupa a linha toda.
 */
export function Campo({ id, rotulo, obrigatorio = false, tamanho = 12, ajuda, children }) {
  return (
    <div className={`campo campo--${tamanho}`}>
      {rotulo && (
        <label htmlFor={id}>
          {rotulo}
          {obrigatorio && <span className="campo__obrigatorio" aria-hidden="true"> *</span>}
        </label>
      )}
      {children}
      {ajuda && <small className="campo__ajuda">{ajuda}</small>}
    </div>
  )
}
