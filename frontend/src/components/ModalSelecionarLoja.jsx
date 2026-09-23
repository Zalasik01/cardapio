import { useEffect, useRef, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { listarLojasAcessiveis } from '../api/authApi'
import { Skeleton } from './Skeleton'

const ATRASO_BUSCA_MS = 300

/**
 * Modal de selecao de loja, com busca pelo nome enquanto o usuario digita.
 *
 * - aoSelecionar: chamado depois que a sessao foi vinculada a loja escolhida.
 * - aoFechar: quando informado, o modal pode ser fechado (botao e Esc); no login
 *   ele nao e informado, pois sem loja o usuario nao segue e so pode sair.
 * - aoSair: quando informado, exibe o botao "Sair".
 */
export default function ModalSelecionarLoja({ aoSelecionar, aoFechar, aoSair }) {
  const { usuarioLogado, loja: lojaAtual, selecionarLoja } = useAuth()

  const [lojas, setLojas] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState(null)
  const [busca, setBusca] = useState('')
  const [selecionando, setSelecionando] = useState(null)
  const campoBusca = useRef(null)

  useEffect(() => {
    campoBusca.current?.focus()
  }, [])

  useEffect(() => {
    if (!aoFechar) return undefined
    const aoTeclar = (e) => e.key === 'Escape' && aoFechar()
    document.addEventListener('keydown', aoTeclar)
    return () => document.removeEventListener('keydown', aoTeclar)
  }, [aoFechar])

  // busca enquanto digita: espera uma breve pausa na digitacao e ignora respostas antigas
  useEffect(() => {
    let descartada = false
    setCarregando(true)
    const espera = setTimeout(() => {
      listarLojasAcessiveis(busca.trim())
        .then((resultado) => {
          if (descartada) return
          setLojas(resultado)
          setErro(null)
        })
        .catch((e) => !descartada && setErro(e.mensagem))
        .finally(() => !descartada && setCarregando(false))
    }, busca ? ATRASO_BUSCA_MS : 0)

    return () => {
      descartada = true
      clearTimeout(espera)
    }
  }, [busca])

  async function handleSelecionar(loja) {
    setErro(null)
    setSelecionando(loja.tenant)
    try {
      await selecionarLoja(loja.tenant)
      aoSelecionar()
    } catch (e) {
      setErro(e.mensagem)
      setSelecionando(null)
    }
  }

  return (
    <div className="modal-fundo" onMouseDown={(e) => e.target === e.currentTarget && aoFechar?.()}>
      <div className="painel-selecao" role="dialog" aria-modal="true" aria-labelledby="titulo-selecao-loja">
        <header className="painel-selecao__cabecalho">
          <div>
            <h1 id="titulo-selecao-loja">Selecione a loja</h1>
            <p>
              Olá, <strong>{usuarioLogado?.nome}</strong>. Escolha em qual loja você quer trabalhar.
            </p>
          </div>
          {aoFechar && (
            <button type="button" className="botao-icone painel-selecao__fechar" aria-label="Fechar" onClick={aoFechar}>
              <i className="fa-solid fa-xmark" aria-hidden="true" />
            </button>
          )}
        </header>

        <div className="painel-selecao__busca">
          <i className="fa-solid fa-magnifying-glass" aria-hidden="true" />
          <input
            ref={campoBusca}
            type="search"
            placeholder="Buscar loja pelo nome"
            aria-label="Buscar loja pelo nome"
            autoComplete="off"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
          />
        </div>

        {erro && <p className="mensagem-erro" role="alert">{erro}</p>}

        <div className="painel-selecao__lista">
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

          {!carregando && lojas.length === 0 && !erro && (
            <p className="painel-selecao__vazio">
              {busca.trim()
                ? `Nenhuma loja encontrada para “${busca.trim()}”.`
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

        {aoSair && (
          <button type="button" className="botao-secundario painel-selecao__sair" onClick={aoSair}>
            <i className="fa-solid fa-right-from-bracket" aria-hidden="true" /> Sair
          </button>
        )}
      </div>
    </div>
  )
}
