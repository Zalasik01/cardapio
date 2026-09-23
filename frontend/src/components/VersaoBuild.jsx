/* global __DATA_BUILD__ */

const formatador = new Intl.DateTimeFormat('pt-BR', {
  dateStyle: 'short',
  timeStyle: 'medium',
  timeZone: 'America/Sao_Paulo',
})

/** Versao do sistema = data e hora do ultimo build (injetada pelo Vite em __DATA_BUILD__). */
export default function VersaoBuild() {
  return <span className="versao-build">Versão build: {formatador.format(new Date(__DATA_BUILD__))}</span>
}
