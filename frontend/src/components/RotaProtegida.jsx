import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

/**
 * Exige usuario logado com uma loja selecionada. Sem loja, volta ao login, onde
 * o modal de selecao de loja e exibido.
 */
export default function RotaProtegida({ children }) {
  const { usuarioLogado, loja } = useAuth()

  if (!usuarioLogado || !loja) {
    return <Navigate to="/admin/login" replace />
  }

  return children
}
