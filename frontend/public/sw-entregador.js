// Service worker da página do entregador (PWA): funciona sem internet e recebe avisos de nova entrega (push).
//
// - Páginas: rede primeiro, com a última cópia como reserva (o app abre mesmo sem sinal).
// - Arquivos do próprio site (scripts, estilos, fontes, imagens): usa o que está guardado e atualiza em segundo plano,
//   para o app abrir rápido e completo offline.
// - A API (/api) nunca passa por aqui: as entregas e as ações offline são tratadas pela própria página.
const CACHE = 'entregador-v2'

self.addEventListener('install', () => self.skipWaiting())

self.addEventListener('activate', (evento) => {
  evento.waitUntil(
    caches.keys().then((chaves) => Promise.all(chaves.filter((c) => c !== CACHE).map((c) => caches.delete(c)))).then(() => self.clients.claim()),
  )
})

self.addEventListener('fetch', (evento) => {
  const requisicao = evento.request
  if (requisicao.method !== 'GET') return
  const url = new URL(requisicao.url)
  if (url.origin === self.location.origin && url.pathname.startsWith('/api')) return

  if (requisicao.mode === 'navigate') {
    evento.respondWith(
      fetch(requisicao)
        .then((resposta) => {
          const copia = resposta.clone()
          caches.open(CACHE).then((cache) => cache.put(requisicao, copia))
          return resposta
        })
        .catch(() => caches.match(requisicao).then((guardada) => guardada || Response.error())),
    )
    return
  }

  if (url.origin === self.location.origin) {
    evento.respondWith(
      caches.open(CACHE).then((cache) => cache.match(requisicao).then((guardada) => {
        const rede = fetch(requisicao)
          .then((resposta) => {
            if (resposta.ok) cache.put(requisicao, resposta.clone())
            return resposta
          })
          .catch(() => guardada || Response.error())
        return guardada || rede
      })),
    )
  }
})

// Aviso de nova entrega (push): mostra a notificação e, ao tocar, abre/foca a página do entregador.
self.addEventListener('push', (evento) => {
  let dados = { titulo: 'Nova entrega', corpo: 'Abra o app para ver.', url: self.registration.scope }
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
    vibrate: [200, 100, 200],
    data: { url: dados.url },
  }))
})

self.addEventListener('notificationclick', (evento) => {
  evento.notification.close()
  const alvo = evento.notification.data?.url || self.registration.scope
  evento.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((janelas) => {
      const aberta = janelas.find((j) => j.url.includes(new URL(alvo, self.location.origin).pathname))
      return aberta ? aberta.focus() : self.clients.openWindow(alvo)
    }),
  )
})
