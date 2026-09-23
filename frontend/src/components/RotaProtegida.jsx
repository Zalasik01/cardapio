import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function RotaProtegida({ children }) {
  const { usuario, ehAdmin } = useAuth()

  if (!usuario || !ehAdmin) {
    return <Navigate to="/admin/login" replace />
  }

  return children
}
