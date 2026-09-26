/** Permissão de leitura exigida por cada tela do painel (primeiro trecho da rota depois de /admin). */
const LEITURA_POR_ROTA = {
  dashboard: 'DASHBOARD_LEITURA',
  'painel-pedidos': 'PAINEL_PEDIDOS_LEITURA',
  pedidos: 'PEDIDOS_LEITURA',
  usuarios: 'USUARIOS_LEITURA',
  funcionarios: 'FUNCIONARIOS_LEITURA',
  pessoas: 'CLIENTES_FORNECEDORES_LEITURA',
  'produtos-finais': 'PRODUTOS_FINAIS_LEITURA',
  ingredientes: 'INGREDIENTES_LEITURA',
  categorias: 'CATEGORIAS_LEITURA',
  'zonas-entrega': 'ZONAS_ENTREGA_LEITURA',
  'formas-pagamento': 'FORMAS_PAGAMENTO_LEITURA',
  cupons: 'CUPONS_LEITURA',
  avaliacoes: 'AVALIACOES_LEITURA',
  fidelidade: 'FIDELIDADE_LEITURA',
  site: 'SITE_LEITURA',
  'fluxo-pedidos': 'FLUXO_PEDIDOS_LEITURA',
  entregadores: 'ENTREGADORES_LEITURA',
  entregas: 'ENTREGAS_LEITURA',
  loja: 'MINHA_LOJA_LEITURA',
}

/** Código da permissão que libera a tela do caminho, ou undefined quando a tela é livre. */
export const permissaoDaRota = (pathname) => LEITURA_POR_ROTA[pathname.split('/')[2]]
