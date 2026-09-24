import { Skeleton as EsqueletoPrime } from 'primereact/skeleton'

/**
 * Blocos de carregamento (skeleton do PrimeReact). Reservam o espaco do conteudo final
 * para evitar salto de layout; os contenedores marcam aria-busy.
 */
export function Skeleton({ largura = '100%', altura = '1rem', raio, className = '' }) {
  return <EsqueletoPrime width={largura} height={altura} borderRadius={raio} className={className} />
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

/**
 * Esqueleto dos cadastros em blocos: um cartão por bloco (mesma moldura das seções reais), com o título
 * e a grade de campos. blocos: lista de blocos; cada bloco é a lista de larguras (colunas de 12) dos campos.
 */
export function CrudSkeleton({ blocos }) {
  return blocos.map((campos, i) => (
    <div key={i} className="secao-crud" aria-busy="true" aria-label="Carregando bloco do cadastro">
      <Skeleton largura="9rem" altura="1.1rem" raio="6px" />
      <div className="grade-campos crud-skeleton__grade">
        {campos.map((tamanho, j) => (
          <div key={j} className={`campo campo--${tamanho} skeleton-campo`}>
            <Skeleton largura="35%" altura="0.8rem" />
            <Skeleton altura="2.4rem" raio="6px" />
          </div>
        ))}
      </div>
    </div>
  ))
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
