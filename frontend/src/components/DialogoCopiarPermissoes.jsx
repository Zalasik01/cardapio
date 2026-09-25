import { useEffect, useState } from 'react'
import { Button } from 'primereact/button'
import { Dialog } from 'primereact/dialog'
import { Dropdown } from 'primereact/dropdown'
import { useAuth } from '../context/AuthContext'
import { copiarPermissoesUsuario } from '../api/permissoesApi'
import { buscarUsuarios } from '../api/usuariosApi'
import { dispatchMsgError, dispatchMsgSuccess } from '../store/dispatchMsg'

/**
 * Copia as permissões de um usuário da loja para outro (as do destino são substituídas).
 * aberto: mostra o diálogo; destinoInicial: { id } já escolhido (ex.: o usuário aberto); aoCopiado(permissoes)
 * roda depois de gravar, com { administrador, codigos } do destino.
 */
export default function DialogoCopiarPermissoes({ aberto, destinoInicial, aoFechar, aoCopiado }) {
  const { loja } = useAuth()
  const [usuarios, setUsuarios] = useState([])
  const [origem, setOrigem] = useState(null)
  const [destino, setDestino] = useState(null)
  const [copiando, setCopiando] = useState(false)

  useEffect(() => {
    if (!aberto) return
    setOrigem(null)
    setDestino(destinoInicial?.id ?? null)
    buscarUsuarios(loja.tenant, { size: 50 })
      .then((pagina) => setUsuarios(pagina.content))
      .catch((e) => dispatchMsgError(e.mensagem))
  }, [aberto, destinoInicial, loja.tenant])

  const opcoes = usuarios.map((u) => ({ ...u, rotulo: `${u.nome} (${u.email})` }))

  async function copiar() {
    setCopiando(true)
    try {
      const resultado = await copiarPermissoesUsuario(loja.tenant, destino, origem)
      dispatchMsgSuccess('Permissões copiadas com sucesso')
      aoCopiado?.(resultado, destino)
      aoFechar()
    } catch (e) {
      dispatchMsgError(e.mensagem)
    } finally {
      setCopiando(false)
    }
  }

  return (
    <Dialog header="Copiar permissões" visible={aberto} onHide={aoFechar} style={{ width: '30rem', maxWidth: '95vw' }}
            footer={(
              <>
                <Button type="button" label="Cancelar" severity="secondary" outlined onClick={aoFechar} />
                <Button type="button" label={copiando ? 'Copiando...' : 'Copiar'} disabled={!origem || !destino || copiando}
                        onClick={copiar} />
              </>
            )}>
      <div className="grade-campos">
        <div className="campo campo--12">
          <label htmlFor="copiar-origem">Copiar as permissões de</label>
          <Dropdown inputId="copiar-origem" value={origem} options={opcoes.filter((u) => u.id !== destino)}
                    optionValue="id" optionLabel="rotulo" filter placeholder="Selecione o usuário de origem"
                    onChange={(e) => setOrigem(e.value)} />
        </div>
        <div className="campo campo--12">
          <label htmlFor="copiar-destino">Para</label>
          <Dropdown inputId="copiar-destino" value={destino} options={opcoes.filter((u) => u.id !== origem && !u.administrador)}
                    optionValue="id" optionLabel="rotulo" filter placeholder="Selecione o usuário de destino"
                    disabled={!!destinoInicial} onChange={(e) => setDestino(e.value)} />
        </div>
        <div className="campo campo--12">
          <small className="campo__ajuda">As permissões atuais do usuário de destino serão substituídas.</small>
        </div>
      </div>
    </Dialog>
  )
}
