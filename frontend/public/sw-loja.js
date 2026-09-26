// Service worker do cardápio da loja (PWA). Rede primeiro: preço, promoção e horário precisam estar sempre atualizados;
// sem internet, a última tela visitada aparece em vez de uma página em branco. O painel e a API nunca passam pelo cache.
// Também recebe os avisos (push) de mudança de situação do pedido.
const CACHE = 'loja-v2'

self.addEventListener('install', () => self.skipWaiting())

self.addEventListener('activate', (evento) => {
  evento.waitUntil(
    caches.keys().then((chaves) => Promise.all(chaves.filter((c) => c !== CACHE).map((c) => caches.delete(c)))).then(() => self.clients.claim()),
  )
})

self.addEventListener('fetch', (evento) => {
  const requisicao = evento.request
  if (requisicao.method !== 'GET' || requisicao.mode !== 'navigate') return
  const caminho = new URL(requisicao.url).pathname
  if (caminho.startsWith('/admin') || caminho.startsWith('/entregador') || caminho.startsWith('/api')) return
  evento.respondWith(
    fetch(requisicao)
      .then((resposta) => {
        const copia = resposta.clone()
        caches.open(CACHE).then((cache) => cache.put(requisicao, copia))
        return resposta
      })
      .catch(() => caches.match(requisicao).then((guardada) => guardada || Response.error())),
  )
})

self.addEventListener('push', (evento) => {
  let dados = { titulo: 'Seu pedido', corpo: 'Toque para acompanhar.', url: '/' }
  try {
    dados = { ...dados, ...evento.data.json() }
  } catch {
    // corpo sem JSON: fica o texto padrão
  }
  evento.waitUntil(self.registration.showNotification(dados.titulo, {
    body: dados.corpo,
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-192.png',
    tag: dados.url,
    renotify: true,
    vibrate: [150, 80, 150],
    data: { url: dados.url },
  }))
})

self.addEventListener('notificationclick', (evento) => {
  evento.notification.close()
  const alvo = evento.notification.data?.url || '/'
  evento.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((janelas) => {
      const aberta = janelas.find((j) => j.url.includes(alvo))
      return aberta ? aberta.focus() : self.clients.openWindow(alvo)
    }),
  )
})
