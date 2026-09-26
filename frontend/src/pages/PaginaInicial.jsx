import { useEffect, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import http from '../api/http'

/** Hosts do próprio sistema: neles a raiz mostra a tela de apresentação; em qualquer outro, procura a loja dona do domínio. */
const HOSTS_DO_SISTEMA = ['localhost', '127.0.0.1']

export default function PaginaInicial() {
  const host = window.location.hostname
  const propria = HOSTS_DO_SISTEMA.includes(host)
  const [slug, setSlug] = useState(null)
  const [procurando, setProcurando] = useState(!propria)

  useEffect(() => {
    if (propria) return
    http.get('/publico/lojas/por-dominio', { params: { host } })
      .then((res) => setSlug(res.data.slug))
      .catch(() => setSlug(null))
      .finally(() => setProcurando(false))
  }, [host, propria])

  if (slug) return <Navigate to={`/${slug}`} replace />
  if (procurando) return <div className="pagina-centralizada" aria-busy="true">Carregando...</div>

  return (
    <div className="pagina-centralizada">
      <h1>Cardápio Digital</h1>
      <p>Acesse o cardápio de um restaurante pelo link fornecido por ele.</p>
      <p>
        Exemplo: <code>/cantina-da-nonna</code>
      </p>
      <Link to="/admin/login">Sou administrador de um restaurante</Link>
    </div>
  )
}
