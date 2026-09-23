import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { consultarConvite, definirSenhaNovoUsuario } from '../../api/authApi'
import CampoSenha from '../../components/CampoSenha'
import ForcaSenha from '../../components/ForcaSenha'
import { Skeleton } from '../../components/Skeleton'
import { avaliarSenha } from '../../utils/senha'

/** Rota publica /novo-usuario/:token: o usuario convidado define a senha e entra no sistema. */
export default function PaginaNovoUsuario() {
  const { token } = useParams()
  const { aplicarSessao } = useAuth()
  const navigate = useNavigate()

  const [convite, setConvite] = useState(null)
  const [carregando, setCarregando] = useState(true)
  const [erroLink, setErroLink] = useState(null)
  const [senha, setSenha] = useState('')
  const [confirmacao, setConfirmacao] = useState('')
  const [erro, setErro] = useState(null)
  const [enviando, setEnviando] = useState(false)

  useEffect(() => {
    consultarConvite(token)
      .then(setConvite)
      .catch((e) => setErroLink(e.mensagem))
      .finally(() => setCarregando(false))
  }, [token])

  const avaliacao = useMemo(
    () => avaliarSenha(senha, { email: convite?.email, nome: convite?.nome }),
    [senha, convite],
  )
  const confirmacaoConfere = confirmacao !== '' && confirmacao === senha
  const podeEnviar = avaliacao.forte && confirmacaoConfere && !enviando

  async function handleSubmit(e) {
    e.preventDefault()
    if (!podeEnviar) return
    setErro(null)
    setEnviando(true)
    try {
      const resposta = await definirSenhaNovoUsuario(token, senha)
      aplicarSessao(resposta)
      // segue o fluxo normal: com uma unica loja entra direto; senao a tela de login abre a selecao de loja
      navigate(resposta.loja ? '/admin/dashboard' : '/admin/login', { replace: true })
    } catch (e2) {
      setErro(e2.mensagem)
      setEnviando(false)
    }
  }

  return (
    <div className="pagina-login">
      <div className="formulario-login formulario-login--largo">
        {carregando && (
          <div aria-busy="true" aria-label="Carregando convite" className="convite__esqueleto">
            <Skeleton largura="70%" altura="1.6rem" />
            <Skeleton altura="0.9rem" />
            <Skeleton altura="2.6rem" raio="8px" />
            <Skeleton altura="2.6rem" raio="8px" />
          </div>
        )}

        {!carregando && erroLink && (
          <>
            <h1>Link indisponível</h1>
            <p className="mensagem-erro" role="alert">{erroLink}</p>
            <Link to="/admin/login">Ir para o login</Link>
          </>
        )}

        {!carregando && convite && (
          <form onSubmit={handleSubmit} className="convite__form">
            <h1>Crie sua senha</h1>
            <p className="texto-auxiliar convite__intro">
              Olá, <strong>{convite.nome}</strong>. Defina a senha para acessar o sistema com <strong>{convite.email}</strong>.
            </p>

            <CampoSenha rotulo="Nova senha" valor={senha} aoAlterar={setSenha} autoComplete="new-password"
                        aria-describedby="regras-senha" />
            <ForcaSenha avaliacao={avaliacao} id="regras-senha" />

            <CampoSenha rotulo="Confirme a senha" valor={confirmacao} aoAlterar={setConfirmacao}
                        autoComplete="new-password" />
            {confirmacao !== '' && !confirmacaoConfere && (
              <p className="mensagem-erro" role="alert">As senhas não são iguais.</p>
            )}

            {erro && <p className="mensagem-erro" role="alert">{erro}</p>}

            <button type="submit" className="botao-principal" disabled={!podeEnviar}>
              {enviando ? 'Salvando...' : 'Definir senha e entrar'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
