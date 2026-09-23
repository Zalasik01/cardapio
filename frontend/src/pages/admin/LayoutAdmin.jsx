import { useEffect, useState } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { buscarMenu } from '../../api/menuApi'
import { MenuSkeleton } from '../../components/Skeleton'

const CHAVE_MENU_RECOLHIDO = 'cardapio_menu_recolhido'

export default function LayoutAdmin() {
  const { usuario, sair } = useAuth()
  const navigate = useNavigate()
  const { pathname } = useLocation()

  const [menu, setMenu] = useState([])
  const [carregandoMenu, setCarregandoMenu] = useState(true)
  const [erroMenu, setErroMenu] = useState(null)
  const [abertas, setAbertas] = useState({})
  const [menuMobileAberto, setMenuMobileAberto] = useState(false)
  const [recolhido, setRecolhido] = useState(() => {
    try {
      return localStorage.getItem(CHAVE_MENU_RECOLHIDO) === '1'
    } catch {
      return false
    }
  })

  useEffect(() => {
    buscarMenu()
      .then((categorias) => {
        setMenu(categorias)
        // abre por padrao a categoria da pagina atual
        const inicial = {}
        categorias.forEach((categoria) => {
          if (categoria.paginas.some((pagina) => pagina.rota === pathname)) {
            inicial[categoria.guid] = true
          }
        })
        setAbertas(inicial)
      })
      .catch((e) => setErroMenu(e.mensagem))
      .finally(() => setCarregandoMenu(false))
    // o menu so precisa ser carregado uma vez por sessao do painel
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    setMenuMobileAberto(false)
  }, [pathname])

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

  function alternarCategoria(guid) {
    // com o menu recolhido, clicar num icone expande o menu e abre a categoria
    if (recolhido) {
      alternarRecolhido()
      setAbertas((atual) => ({ ...atual, [guid]: true }))
      return
    }
    setAbertas((atual) => ({ ...atual, [guid]: !atual[guid] }))
  }

  function handleSair() {
    sair()
    navigate('/admin/login')
  }

  return (
    <div className="layout-admin">
      <header className="topo-admin">
        <button
          type="button"
          className="botao-icone"
          aria-label="Abrir menu"
          aria-expanded={menuMobileAberto}
          aria-controls="menu-admin"
          onClick={() => setMenuMobileAberto(true)}
        >
          <i className="fa-solid fa-bars" aria-hidden="true" />
        </button>
        <span className="marca-admin">Cardápio Admin</span>
      </header>

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
                      <li key={pagina.guid}>
                        <NavLink to={pagina.rota} end>
                          {pagina.nome}
                        </NavLink>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )
          })}
        </nav>

        <div className="menu-admin__rodape">
          <span className="menu-admin__usuario">
            <i className="fa-solid fa-circle-user" aria-hidden="true" /> <span>{usuario?.nome}</span>
          </span>
          <button type="button" className="botao-secundario botao-secundario--escuro" onClick={handleSair}>
            <i className="fa-solid fa-right-from-bracket" aria-hidden="true" /> <span>Sair</span>
          </button>
        </div>
      </aside>

      <main className="conteudo-admin">
        <Outlet />
      </main>
    </div>
  )
}
