import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

/**
 * Exige usuario logado. Com exigirLoja (padrao), tambem exige que uma loja tenha
 * sido selecionada; caso contrario leva o usuario a tela de selecao de loja.
 */
export default function RotaProtegida({ children, exigirLoja = true }) {
  const { usuarioLogado, loja } = useAuth()

  if (!usuarioLogado) {
    return <Navigate to="/admin/login" replace />
  }

  if (exigirLoja && !loja) {
    return <Navigate to="/admin/selecionar-loja" replace />
  }

  return children
}
