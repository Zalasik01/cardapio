/** Selo com a cor da situação do pedido (a cor é escolhida pela loja no fluxo de pedidos). */
export default function SeloSituacao({ nome, cor, className = '' }) {
  return (
    <span className={`selo selo--situacao ${className}`} style={{ '--cor-selo': cor ?? '#6b7280' }}>
      {nome}
    </span>
  )
}
