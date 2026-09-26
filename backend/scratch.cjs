const fs = require('fs')
const B = 'src/main/java/com/cardapio/'
const edit = (f, fn) => { const s = fs.readFileSync(B + f, 'utf8'); const n = fn(s); if (n === s) throw new Error('sem mudança: ' + f); fs.writeFileSync(B + f, n) }

edit('security/JwtService.java', (s) => s
  .replace('    private static final String TIPO_REFRESH = "refresh";', '    private static final String TIPO_REFRESH = "refresh";\n    private static final String TIPO_CLIENTE = "cliente";\n    private static final long CLIENTE_EXPIRACAO_MS = 30L * 24 * 60 * 60 * 1000;')
  .replace('    /** Valida assinatura, validade e tipo access.', `    /** Token do cliente final (cardápio online): não vale para o painel, pois o tipo é outro. Subject = id da conta. */
    public String gerarTokenCliente(Long contaId) {
        return gerar(String.valueOf(contaId), Map.of(), TIPO_CLIENTE, CLIENTE_EXPIRACAO_MS);
    }

    /** Devolve o id da conta do cliente; lança JwtException se o token for inválido, vencido ou de outro tipo. */
    public Long lerTokenCliente(String token) {
        try {
            return Long.valueOf(ler(token, TIPO_CLIENTE).getSubject());
        } catch (NumberFormatException e) {
            throw new JwtException("Token inválido");
        }
    }

    /** Valida assinatura, validade e tipo access.`))

edit('entity/T_Pedido.java', (s) => s.replace('    private Long idEntregador;', '    private Long idEntregador;\n\n    /** Conta do cliente que fez o pedido pelo cardápio online (vazio nos pedidos lançados pela loja). */\n    private Long idClienteConta;'))

edit('service/PedidoService.java', (s) => s
  .replace(`    @Transactional
    public T_Pedido criar(PedidoRequest request) {
        return criar(request, false);
    }`, `    @Transactional
    public T_Pedido criar(PedidoRequest request) {
        return criar(request, false);
    }

    /** Pedido do cliente logado: o telefone é o da conta (confirmado por OTP) e o pedido fica no histórico dela. */
    @Transactional
    public T_Pedido criarParaCliente(PedidoRequest request, com.cardapio.entity.S_ClienteConta conta) {
        PedidoRequest daConta = new PedidoRequest(request.tenant(), request.nomeCliente(), conta.getTelefone(),
                request.tipoEntrega(), request.enderecoRua(), request.enderecoNumero(), request.enderecoComplemento(),
                request.enderecoBairro(), request.enderecoCidade(), request.latitude(), request.longitude(),
                request.itens(), request.formaPagamento(), request.observacoes(), null, null, null, null);
        T_Pedido pedido = criar(daConta, false);
        pedido.setIdClienteConta(conta.getId());
        return pedidoRepository.save(pedido);
    }`))
