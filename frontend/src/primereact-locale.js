import { addLocale, locale } from 'primereact/api'

/** Textos do PrimeReact em portugues (calendario, filtros, etc.). */
addLocale('pt-BR', {
  firstDayOfWeek: 1,
  dayNames: ['domingo', 'segunda-feira', 'terça-feira', 'quarta-feira', 'quinta-feira', 'sexta-feira', 'sábado'],
  dayNamesShort: ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'],
  dayNamesMin: ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'],
  monthNames: ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'],
  monthNamesShort: ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'],
  today: 'Hoje',
  clear: 'Limpar',
  weekHeader: 'Sem',
  dateFormat: 'dd/mm/yy',
  emptyMessage: 'Nenhum resultado encontrado',
  emptyFilterMessage: 'Nenhum resultado encontrado',
  choose: 'Escolher',
  upload: 'Enviar',
  cancel: 'Cancelar',
  apply: 'Aplicar',
  accept: 'Sim',
  reject: 'Não',
})

locale('pt-BR')
