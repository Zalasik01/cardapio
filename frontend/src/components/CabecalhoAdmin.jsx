import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { BreadCrumb } from 'primereact/breadcrumb'
import { Menu } from 'primereact/menu'
import { useAuth } from '../context/AuthContext'
import { obterMinhaFoto } from '../api/perfilApi'
import DialogoPerfil from './DialogoPerfil'
import SeloLoja from './SeloLoja'

/** Caminho da tela (BreadCrumb do PrimeReact): Geral > Pessoas > Usuarios. O ultimo item e a tela atual. */
function Migalhas({ migalhas }) {
  if (migalhas.length === 0) return <div />

  const modelo = migalhas.map((migalha, i) => {
    const ultima = i === migalhas.length - 1
    return {
      label: migalha.texto,
      template: () => {
        if (ultima) return <span className="migalhas__atual" aria-current="page">{migalha.texto}</span>
        return migalha.rota ? <Link to={migalha.rota}>{migalha.texto}</Link> : <span>{migalha.texto}</span>
      },
    }
  })
  return <BreadCrumb model={modelo} className="migalhas" aria-label="Caminho da tela" />
}

/**
 * Faixa superior do painel: botao do menu (celular), caminho da tela e, no fim,
 * o cartao do usuario logado com o menu de sessao (Sair).
 */
export default function CabecalhoAdmin({ migalhas, aoAbrirMenu, aoSair, menuAberto }) {
  const { usuarioLogado, loja, versaoFoto } = useAuth()
  const [perfilAberto, setPerfilAberto] = useState(false)
  const menu = useRef(null)
  const [foto, setFoto] = useState(null)

  // foto do proprio usuario (se tiver); sem foto mostra o icone padrao
  useEffect(() => {
    if (!usuarioLogado?.temFoto) {
      setFoto(null)
      return undefined
    }
    let url = null
    let cancelado = false
    obterMinhaFoto()
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
  }, [usuarioLogado?.temFoto, versaoFoto])

  const itens = [
    { label: 'Editar perfil', icon: 'pi pi-user-edit', command: () => setPerfilAberto(true) },
    { separator: true },
    { label: 'Sair', icon: 'pi pi-sign-out', command: aoSair },
  ]

  // TODO temporario: botao de teste de notificacoes (Notification API). Remover quando o fluxo definitivo existir.
  async function testarNotificacao() {
    if (!('Notification' in window)) {
      alert('Este navegador não suporta notificações.')
      return
    }
    let permissao = Notification.permission
    if (permissao === 'default') {
      permissao = await Notification.requestPermission()
    }
    if (permissao !== 'granted') {
      alert('Permissão de notificação negada.')
      return
    }
    new Notification('Cardápio Digital', {
      body: 'Notificação de teste 🔔',
      icon: '/favicon.svg',
    })
  }

  return (
    <header className="cabecalho-admin">
      <button type="button" className="botao-icone cabecalho-admin__menu" aria-label="Abrir menu"
              aria-expanded={menuAberto} aria-controls="menu-admin" onClick={aoAbrirMenu}>
        <i className="fa-solid fa-bars" aria-hidden="true" />
      </button>

      <Migalhas migalhas={migalhas} />

      <div className="cabecalho-admin__direita">
        <SeloLoja />

      <button type="button" className="botao-icone" aria-label="Testar notificação"
              title="Testar notificação (temporário)" onClick={testarNotificacao}>
        <i className="pi pi-bell" aria-hidden="true" />
      </button>

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
      </div>

      <DialogoPerfil aberto={perfilAberto} aoFechar={() => setPerfilAberto(false)} />
    </header>
  )
}
