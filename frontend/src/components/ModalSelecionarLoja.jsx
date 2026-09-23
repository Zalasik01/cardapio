import { useEffect, useRef, useState } from 'react'
import { Button } from 'primereact/button'
import { Dialog } from 'primereact/dialog'
import { useDebounce } from 'primereact/hooks'
import { IconField } from 'primereact/iconfield'
import { InputIcon } from 'primereact/inputicon'
import { InputText } from 'primereact/inputtext'
import { useAuth } from '../context/AuthContext'
import { listarLojasAcessiveis } from '../api/authApi'
import { dispatchMsgError } from '../store/dispatchMsg'
import { Skeleton } from './Skeleton'

const ATRASO_BUSCA_MS = 300

/**
 * Modal (PrimeReact Dialog) de selecao de loja, com busca pelo nome enquanto o usuario digita.
 *
 * - aoSelecionar: chamado depois que a sessao foi vinculada a loja escolhida.
 * - aoFechar: quando informado, o modal pode ser fechado; no login ele nao e informado,
 *   pois sem loja o usuario nao segue e so pode sair.
 * - aoSair: quando informado, exibe o botao "Sair".
 */
export default function ModalSelecionarLoja({ aoSelecionar, aoFechar, aoSair }) {
  const { usuarioLogado, loja: lojaAtual, selecionarLoja } = useAuth()

  const [lojas, setLojas] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [busca, buscaAtrasada, setBusca] = useDebounce('', ATRASO_BUSCA_MS)
  const [selecionando, setSelecionando] = useState(null)
  const primeiraBusca = useRef(true)

  // consulta pela busca "atrasada" (espera uma pausa na digitacao) e ignora respostas antigas
  useEffect(() => {
    let descartada = false
    setCarregando(true)
    listarLojasAcessiveis(buscaAtrasada.trim())
      .then((resultado) => !descartada && setLojas(resultado))
      .catch((e) => !descartada && dispatchMsgError(e.mensagem))
      .finally(() => {
        if (!descartada) {
          setCarregando(false)
          primeiraBusca.current = false
        }
      })
    return () => {
      descartada = true
    }
  }, [buscaAtrasada])

  async function handleSelecionar(loja) {
    setSelecionando(loja.tenant)
    try {
      await selecionarLoja(loja.tenant)
      aoSelecionar()
    } catch (e) {
      dispatchMsgError(e.mensagem)
      setSelecionando(null)
    }
  }

  return (
    <Dialog
      visible
      modal
      draggable={false}
      resizable={false}
      closable={!!aoFechar}
      closeOnEscape={!!aoFechar}
      dismissableMask={!!aoFechar}
      onHide={aoFechar ?? (() => {})}
      header="Selecione a loja"
      style={{ width: 'min(32rem, 95vw)' }}
      footer={aoSair && <Button type="button" label="Sair" icon="pi pi-sign-out" severity="secondary" outlined onClick={aoSair} />}
    >
      <div className="selecao-loja">
        <p className="selecao-loja__texto">
          Olá, <strong>{usuarioLogado?.nome}</strong>. Escolha em qual loja você quer trabalhar.
        </p>

        <IconField iconPosition="left" className="selecao-loja__busca">
          <InputIcon className="pi pi-search" />
          <InputText
            type="search"
            placeholder="Buscar loja pelo nome"
            aria-label="Buscar loja pelo nome"
            autoFocus
            autoComplete="off"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
          />
        </IconField>

        <div className="selecao-loja__lista">
          {carregando && (
            <ul className="lista-lojas" aria-busy="true" aria-label="Carregando lojas">
              {[0, 1, 2].map((i) => (
                <li key={i} className="cartao-loja cartao-loja--skeleton">
                  <Skeleton largura="44px" altura="44px" raio="50%" />
                  <div className="cartao-loja__textos">
                    <Skeleton largura="50%" altura="1rem" />
                    <Skeleton largura="30%" altura="0.8rem" />
                  </div>
                </li>
              ))}
            </ul>
          )}

          {!carregando && lojas.length === 0 && (
            <p className="selecao-loja__vazio">
              {buscaAtrasada.trim()
                ? `Nenhuma loja encontrada para “${buscaAtrasada.trim()}”.`
                : 'Você não tem acesso a nenhuma loja no momento.'}
            </p>
          )}

          {!carregando && lojas.length > 0 && (
            <ul className="lista-lojas">
              {lojas.map((loja) => (
                <li key={loja.tenant}>
                  <button
                    type="button"
                    className={`cartao-loja ${lojaAtual?.tenant === loja.tenant ? 'cartao-loja--atual' : ''}`}
                    disabled={selecionando !== null}
                    onClick={() => handleSelecionar(loja)}
                  >
                    <span className="cartao-loja__avatar" aria-hidden="true">
                      {loja.logoUrl ? <img src={loja.logoUrl} alt="" /> : <i className="fa-solid fa-store" />}
                    </span>
                    <span className="cartao-loja__textos">
                      <strong>{loja.id} - {loja.nome}</strong>
                      <small>/{loja.slug}</small>
                    </span>
                    {selecionando === loja.tenant
                      ? <i className="fa-solid fa-spinner fa-spin" aria-label="Entrando" />
                      : <i className="fa-solid fa-chevron-right" aria-hidden="true" />}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </Dialog>
  )
}
