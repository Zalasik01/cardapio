export function formatarMoeda(valor) {
  return Number(valor || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

/** 11 digitos -> 000.000.000-00 (devolve o valor original se nao tiver 11 digitos). */
export function formatarCpf(valor) {
  const digitos = String(valor ?? '').replace(/\D/g, '')
  if (digitos.length !== 11) return valor ?? ''
  return digitos.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
}

export function soDigitos(valor) {
  return String(valor ?? '').replace(/\D/g, '')
}

/** Data ISO (yyyy-MM-dd) -> Date no fuso local (evita o deslocamento de um dia do new Date(iso)). */
export function isoParaData(iso) {
  if (!iso) return null
  const [ano, mes, dia] = iso.split('-').map(Number)
  return new Date(ano, mes - 1, dia)
}

/** Date -> yyyy-MM-dd */
export function dataParaIso(data) {
  if (!data) return null
  const dois = (n) => String(n).padStart(2, '0')
  return `${data.getFullYear()}-${dois(data.getMonth() + 1)}-${dois(data.getDate())}`
}

/** Link para abrir uma conversa no WhatsApp (assume Brasil, +55, quando o DDI nao foi informado). */
export function linkWhatsapp(numero) {
  const digitos = soDigitos(numero)
  if (digitos.length < 10) return null
  const comPais = digitos.startsWith('55') && digitos.length >= 12 ? digitos : `55${digitos}`
  return `https://wa.me/${comPais}`
}
