import { useEffect, useMemo, useState } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { buscarMenu } from '../../api/menuApi'
import { MenuSkeleton } from '../../components/Skeleton'
import CabecalhoAdmin from '../../components/CabecalhoAdmin'

const CHAVE_MENU_RECOLHIDO = 'cardapio_menu_recolhido'

/** A pagina (ou alguma descendente dela) e a rota aberta agora? */
function contemRota(pagina, pathname) {
  if (pagina.rota && pathname.startsWith(pagina.rota)) return true
  return (pagina.filhas ?? []).some((filha) => contemRota(filha, pathname))
}

/** Marca como abertos, em `destino`, os grupos (categorias e paginas) no caminho da rota atual. */
function abrirCaminhoAtual(destino, paginas, pathname) {
  let algumaAtiva = false
  paginas.forEach((pagina) => {
    if (contemRota(pagina, pathname)) {
      algumaAtiva = true
      destino[pagina.guid] = true
      abrirCaminhoAtual(destino, pagina.filhas ?? [], pathname)
    }
  })
  return algumaAtiva
}

/** Pagina do menu que abre a rota atual (a de rota mais especifica); serve para montar o caminho do cabecalho. */
function acharPagina(menu, pathname) {
  let melhor = null
  const visitar = (paginas) => {
    paginas.forEach((pagina) => {
      const abre = pagina.rota && (pathname === pagina.rota || pathname.startsWith(`${pagina.rota}/`))
      if (abre && (!melhor || pagina.rota.length > melhor.rota.length)) melhor = pagina
      visitar(pagina.filhas ?? [])
    })
  }
  menu.forEach((categoria) => visitar(categoria.paginas))
  return melhor
}

/** Item do submenu: link, ou grupo expansivel quando a pagina tem paginas filhas (qualquer profundidade). */
function ItemMenu({ pagina, abertas, aoAlternar, pathname }) {
  const filhas = pagina.filhas ?? []

  if (filhas.length === 0) {
    return pagina.rota ? (
      <li>
        <NavLink to={pagina.rota}>{pagina.nome}</NavLink>
      </li>
    ) : null
  }

  const aberta = !!abertas[pagina.guid]
  const idSubmenu = `submenu-${pagina.guid}`
  return (
    <li>
      <button
        type="button"
        className={`menu-subgrupo__titulo ${contemRota(pagina, pathname) ? 'menu-subgrupo__titulo--ativo' : ''}`}
        aria-expanded={aberta}
        aria-controls={idSubmenu}
        onClick={() => aoAlternar(pagina.guid)}
      >
        <span>{pagina.nome}</span>
        <i className={`fa-solid fa-chevron-down menu-grupo__seta ${aberta ? 'menu-grupo__seta--aberta' : ''}`} aria-hidden="true" />
      </button>
      {aberta && (
        <ul id={idSubmenu} className="menu-grupo__paginas menu-grupo__paginas--aninhada">
          {filhas.map((filha) => (
            <ItemMenu key={filha.guid} pagina={filha} abertas={abertas} aoAlternar={aoAlternar} pathname={pathname} />
          ))}
        </ul>
      )}
    </li>
  )
}

export default function LayoutAdmin() {
  const { sair } = useAuth()
  const navigate = useNavigate()
  const { pathname } = useLocation()

  const [menu, setMenu] = useState([])
  const [carregandoMenu, setCarregandoMenu] = useState(true)
  const [erroMenu, setErroMenu] = useState(null)
  const [abertas, setAbertas] = useState({})
  const [menuMobileAberto, setMenuMobileAberto] = useState(false)
  const [migalhaExtra, setMigalhaExtra] = useState(null) // ex.: "Editando usuário", definida pela tela
  const [recolhido, setRecolhido] = useState(() => {
    try {
      return localStorage.getItem(CHAVE_MENU_RECOLHIDO) === '1'
    } catch {
      return false
    }
  })

  useEffect(() => {
    buscarMenu()
      .then(setMenu)
      .catch((e) => setErroMenu(e.mensagem))
      .finally(() => setCarregandoMenu(false))
    // o menu so precisa ser carregado uma vez por sessao do painel
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    setMenuMobileAberto(false)
  }, [pathname])

  // mantem abertos a categoria e os submenus da pagina atual (inclui o redirecionamento de /admin para o dashboard)
  useEffect(() => {
    setAbertas((atual) => {
      const proximo = { ...atual }
      menu.forEach((categoria) => {
        if (abrirCaminhoAtual(proximo, categoria.paginas, pathname)) {
          proximo[categoria.guid] = true
        }
      })
      return proximo
    })
  }, [pathname, menu])

  function alternarRecolhido() {
    setRecolhido((atual) => {
      try {
        localStorage.setItem(CHAVE_MENU_RECOLHIDO, atual ? '0' : '1')
      } catch {
        // preferencia nao persistida; segue funcionando na sessao
      }
      return !atual
    })
  }

  function alternar(guid) {
    setAbertas((atual) => ({ ...atual, [guid]: !atual[guid] }))
  }

  function alternarCategoria(guid) {
    // com o menu recolhido, clicar num icone expande o menu e abre a categoria
    if (recolhido) {
      alternarRecolhido()
      setAbertas((atual) => ({ ...atual, [guid]: true }))
      return
    }
    alternar(guid)
  }

  // caminho do cabecalho: vem do campo "screen" da pagina ("Geral, Pessoas, Usuarios"); a tela pode acrescentar um item
  const migalhas = useMemo(() => {
    const pagina = acharPagina(menu, pathname)
    if (!pagina) return []
    const partes = pagina.screen ? pagina.screen.split(',').map((parte) => parte.trim()).filter(Boolean) : [pagina.nome]
    const lista = partes.map((texto, i) => ({ texto, rota: i === partes.length - 1 ? pagina.rota : null }))
    if (migalhaExtra) lista.push({ texto: migalhaExtra })
    return lista
  }, [menu, pathname, migalhaExtra])

  function handleSair() {
    sair()
    navigate('/admin/login')
  }

  return (
    <div className="layout-admin">
      {menuMobileAberto && <div className="menu-admin__fundo" onClick={() => setMenuMobileAberto(false)} />}

      <aside id="menu-admin" className={`menu-admin ${menuMobileAberto ? 'menu-admin--aberto' : ''} ${recolhido ? 'menu-admin--recolhido' : ''}`}>
        <div className="menu-admin__topo">
          <span className="marca-admin">
            <i className="fa-solid fa-utensils" aria-hidden="true" /> <span>Cardápio Admin</span>
          </span>
          <button
            type="button"
            className="botao-icone menu-admin__recolher"
            aria-label={recolhido ? 'Expandir menu' : 'Recolher menu'}
            aria-pressed={recolhido}
            title={recolhido ? 'Expandir menu' : 'Recolher menu'}
            onClick={alternarRecolhido}
          >
            <i className={`fa-solid ${recolhido ? 'fa-angles-right' : 'fa-angles-left'}`} aria-hidden="true" />
          </button>
          <button
            type="button"
            className="botao-icone menu-admin__fechar"
            aria-label="Fechar menu"
            onClick={() => setMenuMobileAberto(false)}
          >
            <i className="fa-solid fa-xmark" aria-hidden="true" />
          </button>
        </div>

        <nav aria-label="Menu principal" className="menu-admin__nav">
          {carregandoMenu && <MenuSkeleton />}
          {erroMenu && <p className="menu-admin__erro">{erroMenu}</p>}

          {menu.map((categoria) => {
            const aberta = !!abertas[categoria.guid]
            const idSubmenu = `submenu-${categoria.guid}`
            return (
              <div key={categoria.guid} className="menu-grupo">
                <button
                  type="button"
                  className="menu-grupo__titulo"
                  aria-expanded={aberta}
                  aria-controls={idSubmenu}
                  title={categoria.nome}
                  onClick={() => alternarCategoria(categoria.guid)}
                >
                  <i className={`${categoria.icone} menu-grupo__icone`} aria-hidden="true" />
                  <span>{categoria.nome}</span>
                  <i
                    className={`fa-solid fa-chevron-down menu-grupo__seta ${aberta ? 'menu-grupo__seta--aberta' : ''}`}
                    aria-hidden="true"
                  />
                </button>
                {aberta && (
                  <ul id={idSubmenu} className="menu-grupo__paginas">
                    {categoria.paginas.map((pagina) => (
                      <ItemMenu key={pagina.guid} pagina={pagina} abertas={abertas} aoAlternar={alternar} pathname={pathname} />
                    ))}
                  </ul>
                )}
              </div>
            )
          })}
        </nav>

      </aside>

      <div className="area-admin">
        <CabecalhoAdmin
          migalhas={migalhas}
          menuAberto={menuMobileAberto}
          aoAbrirMenu={() => setMenuMobileAberto(true)}
          aoSair={handleSair}
        />
        <main className="conteudo-admin">
          <Outlet context={{ definirMigalha: setMigalhaExtra }} />
        </main>
      </div>
    </div>
  )
}
