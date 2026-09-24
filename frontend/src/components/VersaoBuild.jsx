import { dataBuild } from 'virtual:versao-build'

const formatador = new Intl.DateTimeFormat('pt-BR', {
  dateStyle: 'short',
  timeStyle: 'medium',
  timeZone: 'America/Sao_Paulo',
})

/** Versão do sistema = data e hora do último build (fornecida pelo plugin versaoBuild do Vite). */
export default function VersaoBuild() {
  return <span className="versao-build">Versão build: {formatador.format(new Date(dataBuild))}</span>
}
