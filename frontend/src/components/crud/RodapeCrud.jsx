import { useRef } from 'react'
import { Button } from 'primereact/button'
import { Menu } from 'primereact/menu'

/**
 * Barra de ações fixa na base dos cadastros: Excluir (só na edição), "Mais opções" (opcional),
 * Fechar e Salvar. Vai no `rodape` do CrudPagina/CrudBlocos.
 *
 * Props: editando, carregando, salvando, aoExcluir, aoFechar e maisOpcoes (itens do menu do PrimeReact;
 * o botão só aparece na edição e quando há itens).
 */
export default function RodapeCrud({ editando, carregando, salvando, aoExcluir, aoFechar, maisOpcoes }) {
  const menu = useRef(null)

  return (
    <div className="crud__acoes">
      {editando && (
        <Button type="button" label="Excluir" icon="pi pi-trash" severity="danger" outlined
                disabled={carregando} onClick={aoExcluir} />
      )}
      <span className="crud__espaco" />
      {editando && maisOpcoes?.length > 0 && (
        <>
          <Button type="button" icon="pi pi-angle-up" severity="secondary" outlined aria-label="Mais opções"
                  title="Mais opções" aria-haspopup="menu" onClick={(e) => menu.current.toggle(e)} />
          <Menu model={maisOpcoes} popup ref={menu} />
        </>
      )}
      <Button type="button" label="Fechar" severity="secondary" outlined onClick={aoFechar} />
      <Button type="submit" label={salvando ? 'Salvando...' : 'Salvar alterações'} disabled={salvando || carregando} />
    </div>
  )
}
