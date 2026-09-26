// Service worker do cardápio da loja (PWA). Rede primeiro: preço, promoção e horário precisam estar sempre atualizados;
// sem internet, a última tela visitada aparece em vez de uma página em branco. O painel e a API nunca passam pelo cache.
const CACHE = 'loja-v1'

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
