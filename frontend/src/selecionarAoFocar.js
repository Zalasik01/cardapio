/**
 * Campos numéricos (InputNumber do PrimeReact, como preço e taxas) selecionam todo o conteúdo ao receber o foco:
 * quem clica e já digita "8" substitui o "0,00" em vez de ficar com o cursor no meio do valor.
 * Um único ouvinte no documento cobre todas as telas, inclusive os campos de janelas e diálogos.
 */
const SELETOR = '.p-inputnumber-input'

function selecionarTudo(campo) {
  // depois do clique o navegador e o PrimeReact reposicionam o cursor: seleciona de novo no próximo ciclo
  setTimeout(() => {
    if (document.activeElement === campo) campo.select()
  }, 0)
}

export function ativarSelecaoAoFocar() {
  document.addEventListener('focusin', (evento) => {
    if (evento.target instanceof HTMLInputElement && evento.target.matches(SELETOR)) selecionarTudo(evento.target)
  })
  // o clique que dá o foco reposiciona o cursor depois do foco; um novo clique no campo já focado edita normalmente
  let recemFocado = null
  document.addEventListener('focusin', (evento) => {
    recemFocado = evento.target
    setTimeout(() => { recemFocado = null }, 300)
  })
  document.addEventListener('mouseup', (evento) => {
    if (evento.target instanceof HTMLInputElement && evento.target === recemFocado && evento.target.matches(SELETOR)) {
      selecionarTudo(evento.target)
    }
  })
}
