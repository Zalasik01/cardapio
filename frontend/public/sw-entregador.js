// Service worker da página do entregador (PWA). Rede primeiro: as entregas precisam estar sempre atualizadas;
// só se estiver sem internet a última tela visitada é mostrada, para o app não abrir em branco.
const CACHE = 'entregador-v1'

self.addEventListener('install', () => self.skipWaiting())

self.addEventListener('activate', (evento) => {
  evento.waitUntil(
    caches.keys().then((chaves) => Promise.all(chaves.filter((c) => c !== CACHE).map((c) => caches.delete(c)))).then(() => self.clients.claim()),
  )
})

self.addEventListener('fetch', (evento) => {
  const requisicao = evento.request
  // só páginas do próprio entregador; a API (entregas, posição, foto) nunca passa pelo cache
  if (requisicao.method !== 'GET' || requisicao.mode !== 'navigate') return
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
