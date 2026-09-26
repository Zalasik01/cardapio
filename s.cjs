const { edit } = require('C:/Users/nizal/AppData/Local/Temp/claude/c--Users-nizal-Documents-GitHub-cardapio/5f19ba7a-e78c-4c6e-b494-9cd08549ccc9/scratchpad/ed.cjs')
const J = 'backend/src/main/java/com/cardapio/service/'
edit(J + 'PedidoService.java', [
  ['        T_Pedido salvo = pedidoRepository.save(pedido);\n', '        T_Pedido salvo = pedidoRepository.save(pedido);\n        estoqueService.baixarPedido(salvo);\n'],
])
edit(J + 'PedidoAdminService.java', [
  ['    private final OpcaoService opcaoService;', '    private final OpcaoService opcaoService;\n    private final EstoqueService estoqueService;'],
  ['            fidelidadeService.estornarPedidoCancelado(pedido);', '            fidelidadeService.estornarPedidoCancelado(pedido);\n            estoqueService.estornarPedido(pedido);'],
])
