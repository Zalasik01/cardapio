const { edit } = require('C:/Users/nizal/AppData/Local/Temp/claude/c--Users-nizal-Documents-GitHub-cardapio/5f19ba7a-e78c-4c6e-b494-9cd08549ccc9/scratchpad/ed.cjs')
const J = 'backend/src/main/java/com/cardapio/'

edit(J + 'service/AcompanhamentoService.java', [
  ['    private final PedidoEventos pedidoEventos;', '    private final PedidoEventos pedidoEventos;\n    private final com.cardapio.repository.T_PedidoTrilhaRepository trilhaRepository;'],
  ['pedido.getSubtotal(), pedido.getTaxaEntrega(), pedido.getTotal(), destino, entregador);', `pedido.getSubtotal(), pedido.getTaxaEntrega(), pedido.getTotal(), destino, entregador,
                pedido.getLatitude(), pedido.getLongitude(), trilha,
                // o código só aparece com o pedido a caminho: é o cliente quem o passa ao entregador
                pedido.getStatus() == StatusPedido.SAIU_PARA_ENTREGA ? pedido.getCodigoEntrega() : null);`],
  ['        String destino = pedido.getTipoEntrega()', `        List<AcompanhamentoResponse.Ponto> trilha = new ArrayList<>();
        if (pedido.getStatus() == StatusPedido.SAIU_PARA_ENTREGA) {
            var pontos = new ArrayList<>(trilhaRepository.ultimos(pedido.getId(), org.springframework.data.domain.PageRequest.of(0, 120)));
            java.util.Collections.reverse(pontos);
            pontos.forEach(t -> trilha.add(new AcompanhamentoResponse.Ponto(t.getLatitude(), t.getLongitude())));
        }
        String destino = pedido.getTipoEntrega()`],
])

edit(J + 'service/EntregadorPublicoService.java', [
  ['    private final ImagemService imagemService;', '    private final ImagemService imagemService;\n    private final com.cardapio.repository.T_PedidoTrilhaRepository trilhaRepository;'],
  ['    public void entregar(UUID token, Long pedidoId, MultipartFile foto) {\n', '    public void entregar(UUID token, Long pedidoId, MultipartFile foto, String codigo) {\n        conferirCodigo(token, pedidoId, codigo);\n'],
  ['        pedidoRepository.buscarEntregasDoEntregador(entregador.getId(), List.of(StatusPedido.SAIU_PARA_ENTREGA))\n                .forEach(p -> eventos.publishEvent(new PedidoEventos.PedidoEvento(p.getTenant(), "POSICAO", p.getId())));',
   `var emRota = pedidoRepository.buscarEntregasDoEntregador(entregador.getId(), List.of(StatusPedido.SAIU_PARA_ENTREGA));
        emRota.forEach(p -> {
            trilhaRepository.save(com.cardapio.entity.T_PedidoTrilha.builder().tenant(p.getTenant()).idPedido(p.getId())
                    .latitude(latitude).longitude(longitude).registradoEm(LocalDateTime.now()).build());
            eventos.publishEvent(new PedidoEventos.PedidoEvento(p.getTenant(), "POSICAO", p.getId()));
        });`],
  ['    private void mover(UUID token,', `    /** Prova de entrega: pedido com código só é concluído se o entregador digitar o código que o cliente recebeu. */
    private void conferirCodigo(UUID token, Long pedidoId, String codigo) {
        T_Entregador entregador = entregadorPorToken(token);
        T_Pedido pedido = pedidoRepository.buscarComItensPorId(pedidoId, entregador.getTenant())
                .filter(p -> entregador.getId().equals(p.getIdEntregador()))
                .orElseThrow(() -> new RecursoNaoEncontradoException("Entrega não encontrada"));
        if (pedido.getCodigoEntrega() != null && !pedido.getCodigoEntrega().equals(codigo == null ? "" : codigo.trim())) {
            throw new RegraNegocioException("Código de entrega incorreto. Peça o código de 4 dígitos ao cliente.");
        }
    }

    private void mover(UUID token,`],
])

edit(J + 'controller/EntregadorPublicoController.java', [
  ['@RequestPart(name = "foto", required = false) MultipartFile foto) {\n        service.entregar(token, pedidoId, foto);', '@RequestPart(name = "foto", required = false) MultipartFile foto,\n                                         @RequestParam(name = "codigo", required = false) String codigo) {\n        service.entregar(token, pedidoId, foto, codigo);'],
])

// código de 4 dígitos nos pedidos de entrega
edit(J + 'service/PedidoService.java', [
  ['        if (conta != null) {\n            pedido.setIdClienteConta(conta.getId());\n        }', `        if (conta != null) {
            pedido.setIdClienteConta(conta.getId());
        }
        if (request.tipoEntrega() == TipoEntrega.ENTREGA) {
            pedido.setCodigoEntrega(String.format("%04d", new java.security.SecureRandom().nextInt(10000)));
        }`],
])
