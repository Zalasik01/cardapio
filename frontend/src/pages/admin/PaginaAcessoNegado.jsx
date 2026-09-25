import { useNavigate } from 'react-router-dom'
import { Button } from 'primereact/button'

/** Mostrada no lugar da tela quando o usuário não tem permissão de acessá-la. */
export default function PaginaAcessoNegado() {
  const navigate = useNavigate()

  return (
    <div className="acesso-negado">
      <span className="acesso-negado__icone" aria-hidden="true"><i className="fa-solid fa-lock" /></span>
      <h1>Acesso negado</h1>
      <p>Você não tem permissão para acessar esta tela. Peça a um administrador da loja para liberar o acesso.</p>
      <Button type="button" label="Voltar" icon="pi pi-arrow-left" outlined onClick={() => navigate(-1)} />
    </div>
  )
}
