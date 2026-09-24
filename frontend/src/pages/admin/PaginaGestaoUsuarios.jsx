import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  alterarAtivoUsuarioInterno, alterarEmailUsuarioInterno, buscarUsuariosInternos, redefinirSenhaUsuarioInterno,
} from '../../api/gestaoUsuariosApi'
import TelaBusca from '../../components/crud/TelaBusca'
import DialogoAlterarEmail from '../../components/DialogoAlterarEmail'
import DialogoRedefinirSenha from '../../components/DialogoRedefinirSenha'
import { dispatchMsgError, dispatchMsgSuccess } from '../../store/dispatchMsg'
import { confirmar } from '../../utils/confirmar'

const FILTROS = [
  {
    nome: 'administrador',
    rotulo: 'Administrador da plataforma',
    tipo: 'selecao',
    opcoes: [{ valor: 'true', rotulo: 'Sim' }, { valor: 'false', rotulo: 'Não' }],
  },
]

function formatarData(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })
}

const COLUNAS = [
  {
    chave: 'pendente',
    cabecalho: 'Acesso',
    render: (usuario) => (usuario.pendente
      ? <span className="selo selo--alerta">Pendente</span>
      : <span className="selo selo--sucesso">Ativo</span>),
  },
  { chave: 'nome', cabecalho: 'Nome' },
  { chave: 'email', cabecalho: 'E-mail' },
  { chave: 'administrador', cabecalho: 'Administrador', render: (usuario) => (usuario.administrador ? 'Sim' : 'Não') },
  { chave: 'dataUltimoAcesso', cabecalho: 'Último acesso', render: (usuario) => formatarData(usuario.dataUltimoAcesso) },
]

/** Gestão Interna > Gestão de Usuários Internos: a equipe da plataforma (somente usuário administrador). */
export default function PaginaGestaoUsuarios() {
  const navigate = useNavigate()
  const [usuarioEmail, setUsuarioEmail] = useState(null)
  const [usuarioSenha, setUsuarioSenha] = useState(null)
  const [versao, setVersao] = useState(0)

  function alterarAtivo(usuario, ativo) {
    const executar = async () => {
      try {
        await alterarAtivoUsuarioInterno(usuario.id, ativo)
        dispatchMsgSuccess(ativo ? 'Usuário ativado com sucesso' : 'Usuário inativado com sucesso')
        setVersao((atual) => atual + 1)
      } catch (e) {
        dispatchMsgError(e.mensagem)
      }
    }
    if (ativo) {
      executar()
      return
    }
    confirmar({
      mensagem: `Inativar ${usuario.nome}? Ele deixa de acessar o sistema até ser ativado novamente.`,
      rotuloConfirmar: 'Inativar',
      aoConfirmar: executar,
    })
  }

  return (
    <>
      <TelaBusca
        titulo="Gestão de Usuários Internos"
        chaveFiltros="gestao-usuarios"
        placeholder="Buscar por nome ou e-mail"
        colunas={COLUNAS}
        filtros={FILTROS}
        chaveLinha={(usuario) => usuario.id}
        buscar={({ busca, filtros, page, size }) => buscarUsuariosInternos({ busca, ...filtros, page, size })}
        aoNovo={() => navigate('/admin/gestao-usuarios/novo')}
        aoAbrir={(usuario) => navigate(`/admin/gestao-usuarios/${usuario.id}`)}
        chaveAtualizacao={versao}
        acoesExtras={(usuario) => [
          { label: 'Alterar e-mail', icon: 'pi pi-envelope', command: () => setUsuarioEmail(usuario) },
          usuario.ativo
            ? { label: 'Inativar usuário', icon: 'pi pi-ban', command: () => alterarAtivo(usuario, false) }
            : { label: 'Ativar usuário', icon: 'pi pi-check-circle', command: () => alterarAtivo(usuario, true) },
          // quem ainda não definiu a senha usa o link de acesso (dentro do cadastro)
          ...(!usuario.pendente
            ? [{ label: 'Redefinir senha', icon: 'pi pi-key', command: () => setUsuarioSenha(usuario) }]
            : []),
        ]}
      />
      <DialogoAlterarEmail
        usuario={usuarioEmail}
        salvar={alterarEmailUsuarioInterno}
        aoFechar={() => setUsuarioEmail(null)}
        aoAlterado={() => setVersao((atual) => atual + 1)}
      />
      <DialogoRedefinirSenha
        usuario={usuarioSenha}
        salvar={redefinirSenhaUsuarioInterno}
        aoFechar={() => setUsuarioSenha(null)}
        aoRedefinida={() => setVersao((atual) => atual + 1)}
      />
    </>
  )
}
