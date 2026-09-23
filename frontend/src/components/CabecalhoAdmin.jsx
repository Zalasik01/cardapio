import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Menu } from 'primereact/menu'
import { useAuth } from '../context/AuthContext'
import { obterFotoUsuario } from '../api/usuariosApi'

/** Caminho da tela: Geral > Pessoas > Usuarios. O ultimo item e a tela atual. */
function Migalhas({ migalhas }) {
  if (migalhas.length === 0) return <div />

  return (
    <nav aria-label="Caminho da tela" className="migalhas">
      <ol>
        {migalhas.map((migalha, i) => {
          const ultima = i === migalhas.length - 1
          return (
            <li key={`${migalha.texto}-${i}`} aria-current={ultima ? 'page' : undefined}
                className={ultima ? 'migalhas__atual' : undefined}>
              {migalha.rota && !ultima ? <Link to={migalha.rota}>{migalha.texto}</Link> : <span>{migalha.texto}</span>}
              {!ultima && <i className="fa-solid fa-caret-right migalhas__separador" aria-hidden="true" />}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}

/**
 * Faixa superior do painel: botao do menu (celular), caminho da tela e, no fim,
 * o cartao do usuario logado com o menu de sessao (Sair).
 */
export default function CabecalhoAdmin({ migalhas, aoAbrirMenu, aoSair, menuAberto }) {
  const { usuarioLogado, loja } = useAuth()
  const menu = useRef(null)
  const [foto, setFoto] = useState(null)

  // foto do usuario logado (se tiver); sem foto ou sem acesso, mostra o icone padrao
  useEffect(() => {
    if (!usuarioLogado?.temFoto || !usuarioLogado?.id) return undefined
    let url = null
    let cancelado = false
    obterFotoUsuario(loja.tenant, usuarioLogado.id)
      .then((blob) => {
        if (cancelado) return
        url = URL.createObjectURL(blob)
        setFoto(url)
      })
      .catch(() => {})
    return () => {
      cancelado = true
      if (url) URL.revokeObjectURL(url)
    }
  }, [usuarioLogado?.temFoto, usuarioLogado?.id, loja.tenant])

  const itens = [{ label: 'Sair', icon: 'pi pi-sign-out', command: aoSair }]

  return (
    <header className="cabecalho-admin">
      <button type="button" className="botao-icone cabecalho-admin__menu" aria-label="Abrir menu"
              aria-expanded={menuAberto} aria-controls="menu-admin" onClick={aoAbrirMenu}>
        <i className="fa-solid fa-bars" aria-hidden="true" />
      </button>

      <Migalhas migalhas={migalhas} />

      <button type="button" className="cartao-usuario" aria-haspopup="menu" aria-label="Menu do usuário"
              onClick={(e) => menu.current.toggle(e)}>
        <span className="cartao-usuario__avatar" aria-hidden="true">
          {foto ? <img src={foto} alt="" /> : <i className="pi pi-user" />}
        </span>
        <span className="cartao-usuario__textos">
          <strong title={usuarioLogado?.nome}>{usuarioLogado?.nome}</strong>
          <small title={loja?.nome}>{loja?.id} - {loja?.nome}</small>
        </span>
        <i className="fa-solid fa-chevron-down cartao-usuario__seta" aria-hidden="true" />
      </button>
      <Menu model={itens} popup ref={menu} popupAlignment="right" />
    </header>
  )
}
