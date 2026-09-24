import { useCallback, useEffect, useState } from 'react'
import { Button } from 'primereact/button'
import { InputTextarea } from 'primereact/inputtextarea'
import { dispatchMsgError, dispatchMsgSuccess } from '../../store/dispatchMsg'
import { confirmar } from '../../utils/confirmar'
import { SecaoCrud } from './Campo'

const formatarDataHora = (iso) => new Date(iso).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })

/**
 * Bloco "Anotações" dos cadastros: lista de anotações (mais recentes primeiro) com quem escreveu e
 * quando, mais o campo para escrever uma nova; cada uma pode ser editada ou excluída. Serve para
 * qualquer cadastro que tenha anotações, bastando informar as funções da API dele.
 *
 * Props:
 *  - registroId: id do cadastro (indefinido enquanto ele não foi salvo: o bloco pede para salvar antes)
 *  - listar(id) -> [{ id, texto, usuarioNome, dataCriacao, dataAlteracao }]
 *  - criar(id, texto), atualizar(id, anotacaoId, texto), excluir(id, anotacaoId)
 */
export default function Anotacoes({ registroId, listar, criar, atualizar, excluir }) {
  const [anotacoes, setAnotacoes] = useState(null)
  const [novoTexto, setNovoTexto] = useState('')
  const [edicao, setEdicao] = useState(null) // { id, texto }
  const [salvando, setSalvando] = useState(false)

  const carregar = useCallback(() => {
    if (!registroId) return
    listar(registroId)
      .then(setAnotacoes)
      .catch((e) => dispatchMsgError(e.mensagem))
  }, [registroId, listar])

  useEffect(() => {
    carregar()
  }, [carregar])

  async function adicionar() {
    if (!novoTexto.trim()) return
    setSalvando(true)
    try {
      await criar(registroId, novoTexto.trim())
      setNovoTexto('')
      dispatchMsgSuccess('Anotação adicionada')
      carregar()
    } catch (e) {
      dispatchMsgError(e.mensagem)
    } finally {
      setSalvando(false)
    }
  }

  async function salvarEdicao() {
    if (!edicao.texto.trim()) return
    setSalvando(true)
    try {
      await atualizar(registroId, edicao.id, edicao.texto.trim())
      setEdicao(null)
      dispatchMsgSuccess('Anotação atualizada')
      carregar()
    } catch (e) {
      dispatchMsgError(e.mensagem)
    } finally {
      setSalvando(false)
    }
  }

  function remover(anotacao) {
    confirmar({
      mensagem: 'Excluir esta anotação?',
      aoConfirmar: async () => {
        try {
          await excluir(registroId, anotacao.id)
          dispatchMsgSuccess('Anotação excluída')
          carregar()
        } catch (e) {
          dispatchMsgError(e.mensagem)
        }
      },
    })
  }

  return (
    <SecaoCrud id="secao-anotacoes" titulo="Anotações">
      {!registroId ? (
        <p className="texto-auxiliar">Salve o cadastro para poder fazer anotações.</p>
      ) : (
        <div className="anotacoes">
          <div className="anotacoes__nova">
            <InputTextarea rows={3} maxLength={4000} autoResize value={novoTexto} placeholder="Escreva uma anotação"
                           aria-label="Nova anotação" onChange={(e) => setNovoTexto(e.target.value)} />
            <Button type="button" label="Adicionar anotação" icon="pi pi-plus" size="small" outlined
                    disabled={salvando || !novoTexto.trim()} onClick={adicionar} />
          </div>

          {anotacoes && anotacoes.length === 0 && <p className="texto-auxiliar">Nenhuma anotação ainda.</p>}

          <ul className="anotacoes__lista">
            {(anotacoes ?? []).map((anotacao) => (
              <li key={anotacao.id} className="anotacao">
                <div className="anotacao__cabecalho">
                  <strong>{anotacao.usuarioNome}</strong>
                  <small>
                    {formatarDataHora(anotacao.dataCriacao)}
                    {anotacao.dataAlteracao && ` · editada em ${formatarDataHora(anotacao.dataAlteracao)}`}
                  </small>
                  <span className="anotacao__acoes">
                    <Button type="button" icon="pi pi-pencil" rounded text severity="secondary"
                            aria-label="Editar anotação" onClick={() => setEdicao({ id: anotacao.id, texto: anotacao.texto })} />
                    <Button type="button" icon="pi pi-trash" rounded text severity="danger"
                            aria-label="Excluir anotação" onClick={() => remover(anotacao)} />
                  </span>
                </div>
                {edicao?.id === anotacao.id ? (
                  <div className="anotacoes__nova">
                    <InputTextarea rows={3} maxLength={4000} autoResize value={edicao.texto} aria-label="Editar anotação"
                                   onChange={(e) => setEdicao({ ...edicao, texto: e.target.value })} />
                    <span className="anotacao__acoes">
                      <Button type="button" label="Cancelar" size="small" severity="secondary" outlined
                              onClick={() => setEdicao(null)} />
                      <Button type="button" label="Salvar" size="small" disabled={salvando || !edicao.texto.trim()}
                              onClick={salvarEdicao} />
                    </span>
                  </div>
                ) : (
                  <p className="anotacao__texto">{anotacao.texto}</p>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </SecaoCrud>
  )
}
