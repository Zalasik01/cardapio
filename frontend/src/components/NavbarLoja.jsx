import { useState } from 'react'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { Sidebar } from 'primereact/sidebar'
import { useCarrinho } from '../context/CarrinhoContext'
import { useCliente } from '../context/ClienteContext'
import { useInstalarApp } from '../utils/instalarApp'

/**
 * Barra de navegação do cardápio: embaixo no celular (Início, Carrinho, Perfil e o menu ☰) e no topo no computador.
 * As opções do menu ☰ ficam numa lista (ITENS_MENU) para acrescentar novas no futuro sem mexer no resto.
 * Some só no checkout (etapas com o próprio rodapé de ação); no carrinho o rodapé de ação sobe para ficar acima dela.
 */
export default function NavbarLoja({ loja, slug }) {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const { totalItens } = useCarrinho()
  const { cliente, abrirLogin, sair } = useCliente()
  const { podeInstalar, ehIphone, instalar } = useInstalarApp()
  const [menuAberto, setMenuAberto] = useState(false)
  const [copiado, setCopiado] = useState(false)
  const [ajudaIphone, setAjudaIphone] = useState(false)

  if (/\/(checkout)$/.test(pathname)) return null

  const base = `/${slug}`
  const irPara = (destino) => { setMenuAberto(false); navigate(destino) }

  async function compartilhar() {
    const url = `${window.location.origin}${base}`
    if (navigator.share) {
      navigator.share({ title: loja.nome, url }).catch(() => {})
      return
    }
    try {
      await navigator.clipboard.writeText(url)
      setCopiado(true)
      setTimeout(() => setCopiado(false), 2000)
    } catch {
      // sem permissão da área de transferência: nada a fazer
    }
  }

  // opções do menu ☰ — para criar uma nova, é só acrescentar um item aqui
  const ITENS_MENU = [
    { chave: 'pedidos', rotulo: 'Meus pedidos', icone: 'fa-receipt', acao: () => irPara(`${base}/perfil`) },
    { chave: 'enderecos', rotulo: 'Meus endereços', icone: 'fa-location-dot', acao: () => irPara(`${base}/perfil#enderecos`) },
    { chave: 'compartilhar', rotulo: copiado ? 'Link copiado!' : 'Compartilhar o cardápio', icone: copiado ? 'fa-check' : 'fa-share-nodes', acao: compartilhar },
    ...(podeInstalar ? [{
      chave: 'instalar', rotulo: 'Instalar o app', icone: 'fa-mobile-screen-button',
      acao: () => { if (ehIphone) setAjudaIphone((v) => !v); else { setMenuAberto(false); instalar() } },
    }] : []),
    cliente
      ? { chave: 'sair', rotulo: 'Sair', icone: 'fa-right-from-bracket', acao: () => { setMenuAberto(false); sair() } }
      : { chave: 'entrar', rotulo: 'Entrar com telefone', icone: 'fa-right-to-bracket', acao: () => { setMenuAberto(false); abrirLogin() } },
  ]

  return (
    <>
      <nav className="loja-nav" aria-label="Navegação do cardápio">
        <Link to={base} className="loja-nav__marca">
          {loja.logoUrl ? <img src={loja.logoUrl} alt="" /> : <span aria-hidden="true">{loja.nome.charAt(0)}</span>}
          <strong>{loja.nome}</strong>
        </Link>

        <NavLink to={base} end className={({ isActive }) => `loja-nav__item${isActive ? ' ativo' : ''}`}>
          <i className="fa-solid fa-house" aria-hidden="true" /><span>Início</span>
        </NavLink>
        <NavLink to={`${base}/carrinho`} className={({ isActive }) => `loja-nav__item${isActive ? ' ativo' : ''}`}>
          <span className="loja-nav__icone">
            <i className="fa-solid fa-bag-shopping" aria-hidden="true" />
            {totalItens > 0 && <em aria-label={`${totalItens} itens`}>{totalItens}</em>}
          </span>
          <span>Carrinho</span>
        </NavLink>
        <NavLink to={`${base}/perfil`} className={({ isActive }) => `loja-nav__item${isActive ? ' ativo' : ''}`}>
          <i className="fa-regular fa-circle-user" aria-hidden="true" /><span>{cliente ? 'Meu perfil' : 'Perfil'}</span>
        </NavLink>
        <button type="button" className="loja-nav__item" onClick={() => setMenuAberto(true)} aria-haspopup="dialog">
          <i className="fa-solid fa-bars" aria-hidden="true" /><span>Menu</span>
        </button>
      </nav>

      <Sidebar visible={menuAberto} onHide={() => setMenuAberto(false)} position="right" className="loja-menu" header={loja.nome}>
        <ul className="loja-menu__lista">
          {ITENS_MENU.map((item) => (
            <li key={item.chave}>
              <button type="button" onClick={item.acao}><i className={`fa-solid ${item.icone}`} aria-hidden="true" /> {item.rotulo}</button>
            </li>
          ))}
        </ul>
        {ajudaIphone && (
          <p className="loja-menu__ajuda" role="status">
            No iPhone: toque em <strong>Compartilhar</strong> <i className="fa-solid fa-arrow-up-from-bracket" aria-hidden="true" /> no Safari e depois em <strong>Adicionar à Tela de Início</strong>.
          </p>
        )}
      </Sidebar>
    </>
  )
}
