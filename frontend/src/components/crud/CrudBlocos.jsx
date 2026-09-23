import { TabView, TabPanel } from 'primereact/tabview'
import CrudPagina from './CrudPagina'

/**
 * CRUD em blocos (abas): cada bloco e uma aba (Dados basicos, Permissoes...).
 *
 * Props: titulo, subtitulo, aoVoltar, rodape (mesmos de CrudPagina) e
 *  - blocos: [{ id, titulo, conteudo }]
 *  - carregando / esqueleto: enquanto carrega, mostra o esqueleto no lugar do conteudo
 */
export default function CrudBlocos({ blocos, carregando, esqueleto, ...moldura }) {
  return (
    <CrudPagina {...moldura}>
      <TabView className="crud__abas">
        {blocos.map((bloco) => (
          <TabPanel key={bloco.id} header={bloco.titulo}>
            {carregando ? esqueleto : bloco.conteudo}
          </TabPanel>
        ))}
      </TabView>
    </CrudPagina>
  )
}
