/**
 * Blocos de carregamento (skeleton). Reservam o espaco do conteudo final
 * para evitar salto de layout e sao ocultos de leitores de tela.
 */
export function Skeleton({ largura = '100%', altura = '1rem', raio, className = '' }) {
  return (
    <span
      className={`skeleton ${className}`}
      aria-hidden="true"
      style={{ width: largura, height: altura, borderRadius: raio }}
    />
  )
}

export function TabelaSkeleton({ cabecalhos, linhas = 5 }) {
  return (
    <table className="tabela-admin" aria-busy="true" aria-label="Carregando dados">
      <thead>
        <tr>
          {cabecalhos.map((cabecalho, i) => (
            <th key={i}>{cabecalho}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {Array.from({ length: linhas }, (_, linha) => (
          <tr key={linha}>
            {cabecalhos.map((_, coluna) => (
              <td key={coluna}>
                <Skeleton largura={coluna === 0 ? '70%' : '50%'} altura="0.9rem" />
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  )
}

export function FormularioSkeleton({ campos = 4 }) {
  return (
    <div className="formulario-restaurante" aria-busy="true" aria-label="Carregando formulario">
      {Array.from({ length: campos }, (_, i) => (
        <div key={i} className="skeleton-campo">
          <Skeleton largura="30%" altura="0.8rem" />
          <Skeleton altura="2.4rem" raio="8px" />
        </div>
      ))}
      <Skeleton altura="2.8rem" raio="8px" />
    </div>
  )
}

export function MenuSkeleton() {
  return (
    <div className="menu-skeleton" aria-busy="true" aria-label="Carregando menu">
      {[2, 3, 1, 2].map((paginas, i) => (
        <div key={i} className="menu-skeleton__grupo">
          <Skeleton altura="1.1rem" raio="6px" className="skeleton--escuro" />
          {Array.from({ length: paginas }, (_, j) => (
            <Skeleton key={j} largura="70%" altura="0.85rem" raio="6px" className="skeleton--escuro menu-skeleton__item" />
          ))}
        </div>
      ))}
    </div>
  )
}

export function CardapioSkeleton() {
  return (
    <div className="pagina-cardapio" aria-busy="true" aria-label="Carregando cardapio">
      <div className="cabecalho-restaurante">
        <Skeleton largura="72px" altura="72px" raio="50%" />
        <div className="cabecalho-restaurante__skeleton">
          <Skeleton largura="240px" altura="1.8rem" />
          <Skeleton largura="180px" altura="0.9rem" />
        </div>
      </div>
      {[0, 1].map((secao) => (
        <section key={secao} className="secao-categoria">
          <Skeleton largura="160px" altura="1.4rem" />
          <div className="grade-produtos">
            {Array.from({ length: 3 }, (_, i) => (
              <div key={i} className="cartao-produto">
                <Skeleton altura="140px" raio="0" />
                <div className="cartao-produto__conteudo">
                  <Skeleton largura="60%" altura="1.1rem" />
                  <Skeleton altura="0.85rem" />
                  <Skeleton largura="80%" altura="0.85rem" />
                  <Skeleton largura="35%" altura="1.2rem" />
                </div>
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}
