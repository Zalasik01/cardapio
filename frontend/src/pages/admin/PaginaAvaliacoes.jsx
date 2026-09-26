import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from 'primereact/button'
import { Dialog } from 'primereact/dialog'
import { InputTextarea } from 'primereact/inputtextarea'
import { useAuth } from '../../context/AuthContext'
import { buscarAvaliacoes, obterResumoAvaliacoes, responderAvaliacao } from '../../api/avaliacoesApi'
import Estrelas from '../../components/Estrelas'
import TelaBusca from '../../components/crud/TelaBusca'
import { dispatchMsgError, dispatchMsgSuccess } from '../../store/dispatchMsg'

const FILTROS = [
  { nome: 'nota', rotulo: 'Nota da loja', tipo: 'selecao', opcoes: [5, 4, 3, 2, 1].map((n) => ({ valor: String(n), rotulo: `${n} estrela${n > 1 ? 's' : ''}` })) },
  { nome: 'semResposta', rotulo: 'Resposta', tipo: 'selecao', opcoes: [{ valor: 'true', rotulo: 'Só sem resposta' }] },
]

const data = (iso) => new Date(iso).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })

/** Operação > Avaliações: o que os clientes acharam dos pedidos, com resposta da loja. */
export default function PaginaAvaliacoes() {
  const { loja, pode } = useAuth()
  const navigate = useNavigate()
  const [versao, setVersao] = useState(0)
  const [resumo, setResumo] = useState(null)
  const [respondendo, setRespondendo] = useState(null)
  const [texto, setTexto] = useState('')
  const [salvando, setSalvando] = useState(false)

  useEffect(() => {
    obterResumoAvaliacoes(loja.tenant).then(setResumo).catch(() => setResumo(null))
  }, [loja.tenant, versao])

  const COLUNAS = [
    { chave: 'pedidoId', cabecalho: 'Pedido', render: (a) => `#${a.pedidoId}` },
    { chave: 'cliente', cabecalho: 'Cliente' },
    { chave: 'notaLoja', cabecalho: 'Loja', render: (a) => <Estrelas valor={a.notaLoja} tamanho="1rem" rotulo="Nota da loja" /> },
    { chave: 'notaEntrega', cabecalho: 'Entrega', render: (a) => (a.notaEntrega ? <Estrelas valor={a.notaEntrega} tamanho="1rem" rotulo="Nota da entrega" /> : '—') },
    {
      chave: 'comentario',
      cabecalho: 'Comentário',
      render: (a) => (
        <span className="avaliacao__texto">
          {a.comentario || <em className="texto-auxiliar">Sem comentário</em>}
          {a.resposta && <small className="avaliacao__resposta"><i className="pi pi-reply" aria-hidden="true" /> {a.resposta}</small>}
        </span>
      ),
    },
    { chave: 'criadoEm', cabecalho: 'Quando', render: (a) => data(a.criadoEm) },
  ]

  async function salvarResposta() {
    setSalvando(true)
    try {
      await responderAvaliacao(loja.tenant, respondendo.id, texto)
      dispatchMsgSuccess('Resposta salva com sucesso')
      setRespondendo(null)
      setVersao((v) => v + 1)
    } catch (e) {
      dispatchMsgError(e.mensagem)
    } finally {
      setSalvando(false)
    }
  }

  return (
    <>
      {resumo && resumo.total > 0 && (
        <div className="avaliacao__resumo">
          <div>
            <strong>{String(resumo.mediaLoja).replace('.', ',')}</strong>
            <Estrelas valor={resumo.mediaLoja} tamanho="1.1rem" rotulo="Média da loja" />
            <small>{resumo.total} avaliação(ões)</small>
          </div>
          {resumo.mediaEntrega != null && (
            <div>
              <strong>{String(resumo.mediaEntrega).replace('.', ',')}</strong>
              <Estrelas valor={resumo.mediaEntrega} tamanho="1.1rem" rotulo="Média da entrega" />
              <small>entrega</small>
            </div>
          )}
        </div>
      )}
      <TelaBusca
        titulo="Avaliações"
        chaveFiltros="avaliacoes"
        placeholder="Buscar"
        colunas={COLUNAS}
        filtros={FILTROS}
        comInativos={false}
        chaveLinha={(a) => a.id}
        buscar={({ filtros, page, size }) => buscarAvaliacoes(loja.tenant, { nota: filtros.nota, semResposta: filtros.semResposta === 'true', page, size })}
        aoAbrir={(a) => navigate(`/admin/pedidos/${a.pedidoId}`)}
        chaveAtualizacao={versao}
        acoesExtras={(a) => (pode('AVALIACOES_RESPONDER')
          ? [{ label: a.resposta ? 'Editar resposta' : 'Responder', icon: 'pi pi-reply', command: () => { setRespondendo(a); setTexto(a.resposta ?? '') } }]
          : [])}
      />
      <Dialog visible={!!respondendo} header={respondendo ? `Responder ${respondendo.cliente}` : ''} onHide={() => setRespondendo(null)}
              style={{ width: 'min(32rem, 96vw)' }} draggable={false}>
        {respondendo && (
          <div className="avaliacao__dialogo">
            <p><Estrelas valor={respondendo.notaLoja} tamanho="1.1rem" rotulo="Nota da loja" /> {respondendo.comentario || <em>Sem comentário</em>}</p>
            <InputTextarea rows={4} maxLength={500} autoResize value={texto} onChange={(e) => setTexto(e.target.value)}
                           placeholder="Escreva uma resposta que o cliente verá no acompanhamento do pedido" />
            <div className="avaliacao__dialogo-acoes">
              <Button type="button" label="Cancelar" severity="secondary" outlined onClick={() => setRespondendo(null)} />
              <Button type="button" label="Salvar resposta" icon="pi pi-check" loading={salvando} onClick={salvarResposta} />
            </div>
          </div>
        )}
      </Dialog>
    </>
  )
}
