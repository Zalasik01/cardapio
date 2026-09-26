import http from '../api/http'

/** O aparelho/navegador sabe receber notificações push? (iPhone só com o app instalado na tela inicial.) */
export const pushSuportado = () => 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window

const paraBytes = (base64) => {
  const preenchido = `${base64}${'='.repeat((4 - (base64.length % 4)) % 4)}`.replace(/-/g, '+').replace(/_/g, '/')
  return Uint8Array.from(atob(preenchido), (c) => c.charCodeAt(0))
}

/** Já existe uma assinatura neste aparelho (e a permissão continua concedida)? */
export async function pushAtivo() {
  if (!pushSuportado() || Notification.permission !== 'granted') return false
  const registro = await navigator.serviceWorker.getRegistration()
  return !!(await registro?.pushManager.getSubscription())
}

/**
 * Pede permissão, assina o push neste aparelho e registra a assinatura no servidor (caminho relativo à API, ex.:
 * "/publico/entregador/{token}/push"). Devolve true quando ficou ativo; false se a pessoa recusou.
 */
export async function ativarPush(caminhoAssinatura) {
  if (!pushSuportado()) return false
  const permissao = await Notification.requestPermission()
  if (permissao !== 'granted') return false
  const registro = await navigator.serviceWorker.ready
  const { chave } = await http.get('/publico/push/chave').then((r) => r.data)
  const assinatura = (await registro.pushManager.getSubscription())
    ?? (await registro.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: paraBytes(chave) }))
  await http.post(caminhoAssinatura, assinatura.toJSON())
  return true
}
