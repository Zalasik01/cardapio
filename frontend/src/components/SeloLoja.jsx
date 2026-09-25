import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Menu } from 'primereact/menu'
import { Tag } from 'primereact/tag'
import { Tooltip } from 'primereact/tooltip'
import { alterarModoFuncionamento, obterSituacaoLoja } from '../api/funcionamentoApi'
import { useAuth } from '../context/AuthContext'
import { dispatchMsgError } from '../store/dispatchMsg'
import { aoFuncionamentoAlterado, avisarFuncionamentoAlterado, descreverSituacao } from '../utils/funcionamento'

const ATUALIZA_A_CADA_MS = 60000

/**
 * Selo "Loja aberta / fechada" do cabeçalho. Segue o horário de funcionamento (ou o modo forçado) e se
 * atualiza sozinho a cada minuto. Ao clicar, abre o menu para abrir/fechar agora, voltar ao horário
 * automático ou ir ao cadastro do horário.
 */
export default function SeloLoja() {
  const { loja } = useAuth()
  const navigate = useNavigate()
  const [situacao, setSituacao] = useState(null)
  const menu = useRef(null)
  const alvo = useRef(null)

  const carregar = useCallback(() => {
    obterSituacaoLoja(loja.tenant).then(setSituacao).catch(() => {}) // sem resposta, mantém o último estado
  }, [loja.tenant])

  useEffect(() => {
    carregar()
    const intervalo = setInterval(carregar, ATUALIZA_A_CADA_MS)
    const parar = aoFuncionamentoAlterado(carregar)
    return () => {
      clearInterval(intervalo)
      parar()
    }
  }, [carregar])

  async function mudarModo(modo) {
    try {
      setSituacao(await alterarModoFuncionamento(loja.tenant, modo))
      avisarFuncionamentoAlterado()
    } catch (e) {
      dispatchMsgError(e.mensagem)
    }
  }

  if (!situacao) return null
  const aberta = situacao.aberta
  const itens = [
    aberta
      ? { label: 'Fechar agora', icon: 'pi pi-lock', command: () => mudarModo('FECHADA') }
      : { label: 'Abrir agora', icon: 'pi pi-lock-open', command: () => mudarModo('ABERTA') },
    ...(situacao.modo !== 'AUTOMATICO'
      ? [{ label: 'Voltar ao horário automático', icon: 'pi pi-clock', command: () => mudarModo('AUTOMATICO') }]
      : []),
    { separator: true },
    { label: 'Horário de funcionamento', icon: 'pi pi-calendar', command: () => navigate('/admin/loja') },
  ]

  return (
    <>
      <button ref={alvo} type="button" className="selo-loja" aria-haspopup="menu"
              aria-label={`${aberta ? 'Loja aberta' : 'Loja fechada'}. ${descreverSituacao(situacao)}`}
              onClick={(e) => menu.current.toggle(e)}>
        <Tag
          className="badge-loja"
          severity={aberta ? 'success' : 'danger'}
          icon={aberta ? 'pi pi-lock-open' : 'pi pi-lock'}
          value={aberta ? 'Loja aberta' : 'Loja fechada'}
        />
      </button>
      <Tooltip target={alvo} content={descreverSituacao(situacao)} position="bottom" />
      <Menu popup ref={menu} model={itens} />
    </>
  )
}
