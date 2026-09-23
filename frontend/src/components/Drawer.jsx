import { Sidebar } from 'primereact/sidebar'

/** Painel lateral direito (PrimeReact Sidebar) com area de conteudo rolavel e rodape de acoes fixo. */
export default function Drawer({ aberto, titulo, aoFechar, children, rodape }) {
  return (
    <Sidebar
      visible={aberto}
      position="right"
      onHide={aoFechar}
      header={<h2 className="drawer__titulo">{titulo}</h2>}
      className="drawer-filtros"
      style={{ width: 'min(400px, 100vw)' }}
    >
      <div className="drawer__conteudo">{children}</div>
      {rodape && <div className="drawer__rodape">{rodape}</div>}
    </Sidebar>
  )
}
