/** Constantes dos cadastros de produto (espelham os enums do backend). */

export const UNIDADES_MEDIDA = [
  { valor: 'UN', rotulo: 'Unidade (un)' },
  { valor: 'KG', rotulo: 'Quilo (kg)' },
  { valor: 'G', rotulo: 'Grama (g)' },
  { valor: 'L', rotulo: 'Litro (l)' },
  { valor: 'ML', rotulo: 'Mililitro (ml)' },
  { valor: 'PORCAO', rotulo: 'Porção' },
]

/** Sigla curta para tabelas e para a quantidade da composição. */
const SIGLAS = { UN: 'un', KG: 'kg', G: 'g', L: 'l', ML: 'ml', PORCAO: 'porção' }
export const siglaUnidade = (valor) => SIGLAS[valor] ?? valor

/** Textos de cada tipo de produto: usados pelas telas de busca e de cadastro. */
/** Selos e restrições alimentares (o código é o que o servidor guarda, separado por vírgula). */
export const SELOS_PRODUTO = [
  { valor: 'VEGANO', rotulo: 'Vegano' },
  { valor: 'VEGETARIANO', rotulo: 'Vegetariano' },
  { valor: 'SEM_GLUTEN', rotulo: 'Sem glúten' },
  { valor: 'SEM_LACTOSE', rotulo: 'Sem lactose' },
  { valor: 'PICANTE', rotulo: 'Picante' },
]

export const TIPOS_PRODUTO = {
  FINAL: {
    tipo: 'FINAL',
    titulo: 'Produtos finais',
    singular: 'produto final',
    novo: 'Novo produto',
    rota: '/admin/produtos-finais',
    chaveFiltros: 'produtos-finais',
  },
  INGREDIENTE: {
    tipo: 'INGREDIENTE',
    titulo: 'Ingredientes',
    singular: 'ingrediente',
    novo: 'Novo ingrediente',
    rota: '/admin/ingredientes',
    chaveFiltros: 'ingredientes',
  },
}

/** Soma de quantidade x custo unitário dos itens da composição. */
export const custoDaComposicao = (itens) =>
  itens.reduce((soma, item) => soma + Number(item.quantidade ?? 0) * Number(item.custoUnitario ?? 0), 0)
