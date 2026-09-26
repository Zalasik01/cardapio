/**
 * Nota em estrelas. Com aoAlterar vira um seletor (1 a 5, acessível por teclado e leitor de tela); sem ele só mostra a nota.
 */
export default function Estrelas({ valor = 0, aoAlterar, tamanho = '1.5rem', rotulo = 'Nota' }) {
  const estrelas = [1, 2, 3, 4, 5]
  if (!aoAlterar) {
    return (
      <span className="estrelas" style={{ fontSize: tamanho }} role="img" aria-label={`${rotulo}: ${valor} de 5`}>
        {estrelas.map((n) => <i key={n} className={`fa-solid fa-star${n <= Math.round(valor) ? ' estrelas__cheia' : ''}`} aria-hidden="true" />)}
      </span>
    )
  }
  return (
    <span className="estrelas estrelas--editavel" style={{ fontSize: tamanho }} role="radiogroup" aria-label={rotulo}>
      {estrelas.map((n) => (
        <button key={n} type="button" role="radio" aria-checked={valor === n} aria-label={`${n} de 5`} onClick={() => aoAlterar(n)}>
          <i className={`fa-solid fa-star${n <= valor ? ' estrelas__cheia' : ''}`} aria-hidden="true" />
        </button>
      ))}
    </span>
  )
}
