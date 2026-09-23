import { ROTULOS_FORCA } from '../utils/senha'

/** Medidor de forca e checklist das regras de senha. `avaliacao` vem de avaliarSenha(). */
export default function ForcaSenha({ avaliacao, id }) {
  return (
    <div className="forca-senha" id={id} aria-live="polite">
      <div className="forca-senha__barra" aria-hidden="true">
        {[1, 2, 3, 4].map((n) => (
          <span key={n} className={n <= avaliacao.nivel ? `forca-senha__nivel forca-senha__nivel--${avaliacao.nivel}` : 'forca-senha__nivel'} />
        ))}
      </div>
      <p className="forca-senha__rotulo">
        {avaliacao.nivel > 0 ? `Senha ${ROTULOS_FORCA[avaliacao.nivel].toLowerCase()}` : 'Digite uma senha'}
      </p>
      <ul className="forca-senha__regras">
        {avaliacao.regras.map((regra) => (
          <li key={regra.id} className={regra.ok ? 'forca-senha__regra forca-senha__regra--ok' : 'forca-senha__regra'}>
            <i className={`fa-solid ${regra.ok ? 'fa-circle-check' : 'fa-circle'}`} aria-hidden="true" />
            <span>{regra.texto}</span>
            <span className="sr-only">{regra.ok ? ' (cumprida)' : ' (pendente)'}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
