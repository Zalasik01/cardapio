import { Link } from 'react-router-dom'

export default function PaginaInicial() {
  return (
    <div className="pagina-centralizada">
      <h1>Cardápio Digital</h1>
      <p>Acesse o cardapio de um restaurante pelo link fornecido por ele.</p>
      <p>
        Exemplo: <code>/cantina-da-nonna</code>
      </p>
      <Link to="/admin/login">Sou administrador de um restaurante</Link>
    </div>
  )
}
