const { edit } = require('C:/Users/nizal/AppData/Local/Temp/claude/c--Users-nizal-Documents-GitHub-cardapio/5f19ba7a-e78c-4c6e-b494-9cd08549ccc9/scratchpad/ed.cjs')
const J = 'backend/src/main/java/com/cardapio/'
const F = 'frontend/src/'
edit(J + 'service/ClienteEnderecoService.java', [
  ['    @Transactional\n    public void remover(', `    @Transactional
    public EnderecoResponse atualizar(S_ClienteConta conta, Long id, EnderecoRequest r) {
        S_ClienteEndereco e = repository.findByIdAndIdClienteContaAndDeletadoFalse(id, conta.getId())
                .orElseThrow(() -> new RecursoNaoEncontradoException("Endereço não encontrado"));
        if (texto(r.apelido()) == null || texto(r.rua()) == null || texto(r.numero()) == null || texto(r.bairro()) == null) {
            throw new RegraNegocioException("Informe o nome do endereço, a rua, o número e o bairro");
        }
        e.setApelido(texto(r.apelido()));
        e.setCep(texto(r.cep()));
        e.setRua(texto(r.rua()));
        e.setNumero(texto(r.numero()));
        e.setComplemento(texto(r.complemento()));
        e.setBairro(texto(r.bairro()));
        e.setCidade(texto(r.cidade()));
        e.setLatitude(r.latitude());
        e.setLongitude(r.longitude());
        return EnderecoResponse.of(repository.save(e));
    }

    @Transactional
    public void remover(`],
])
edit(J + 'controller/ClientePublicoController.java', [
  ['    @DeleteMapping("/enderecos/{id}")', `    @PutMapping("/enderecos/{id}")
    public com.cardapio.service.ClienteEnderecoService.EnderecoResponse atualizarEndereco(
            @RequestHeader(value = "Authorization", required = false) String auth, @PathVariable Long id,
            @RequestBody com.cardapio.service.ClienteEnderecoService.EnderecoRequest request) {
        return enderecoService.atualizar(contaService.autenticar(auth), id, request);
    }

    @DeleteMapping("/enderecos/{id}")`],
])
edit(F + 'api/cardapioApi.js', [
  ['export const removerEnderecoCliente', 'export const atualizarEnderecoCliente = (id, endereco) => http.put(`/publico/cliente/enderecos/${id}`, endereco).then((res) => res.data)\nexport const removerEnderecoCliente'],
])
edit(F + 'components/EnderecosCliente.jsx', [
  ["import { listarEnderecosCliente, removerEnderecoCliente, salvarEnderecoCliente } from '../api/cardapioApi'", "import { atualizarEnderecoCliente, listarEnderecosCliente, removerEnderecoCliente, salvarEnderecoCliente } from '../api/cardapioApi'"],
  ["/** Formulário de novo endereço: o CEP preenche rua, bairro e cidade; as coordenadas (para frete e mapa) são buscadas ao salvar. */\nfunction DialogoEndereco({ aoFechar, aoSalvo }) {\n  const [form, setForm] = useState(VAZIO)", "/** Formulário de endereço (novo ou existente): o CEP preenche rua, bairro e cidade; as coordenadas (para frete e mapa) são buscadas ao salvar. */\nfunction DialogoEndereco({ endereco, aoFechar, aoSalvo }) {\n  const editando = !!endereco\n  const [form, setForm] = useState(() => (endereco ? { ...VAZIO, ...Object.fromEntries(Object.entries(endereco).map(([k, v]) => [k, v ?? ''])) } : VAZIO))"],
  ["      const salvo = await salvarEnderecoCliente({ ...form, ...coordenadas })", "      // sem achar o lugar no mapa, mantém as coordenadas que o endereço já tinha\n      const dados = { ...form, latitude: coordenadas?.latitude ?? endereco?.latitude ?? null, longitude: coordenadas?.longitude ?? endereco?.longitude ?? null }\n      const salvo = editando ? await atualizarEnderecoCliente(endereco.id, dados) : await salvarEnderecoCliente(dados)"],
  ['<Dialog visible header="Novo endereço"', '<Dialog visible header={editando ? \'Editar endereço\' : \'Novo endereço\'}'],
  ["  const [novo, setNovo] = useState(false)", "  const [dialogo, setDialogo] = useState(null) // null = fechado; 'novo' ou o endereço em edição"],
  ['onClick={() => setNovo(true)}', "onClick={() => setDialogo('novo')}"],
  ['            {confirmando === e.id ? (', "            <button type=\"button\" className=\"cliente-enderecos__remover\" aria-label={`Editar endereço ${e.apelido}`} onClick={() => setDialogo(e)}>\n              <i className=\"fa-regular fa-pen-to-square\" aria-hidden=\"true\" />\n            </button>\n            {confirmando === e.id ? ("],
  ["      {novo && <DialogoEndereco aoFechar={() => setNovo(false)} aoSalvo={(salvo) => { setEnderecos((atual) => [salvo, ...(atual ?? [])]); setNovo(false) }} />}", "      {dialogo && (\n        <DialogoEndereco endereco={dialogo === 'novo' ? null : dialogo} aoFechar={() => setDialogo(null)}\n                         aoSalvo={(salvo) => {\n                           setEnderecos((atual) => (dialogo === 'novo' ? [salvo, ...(atual ?? [])] : atual.map((x) => (x.id === salvo.id ? salvo : x))))\n                           setDialogo(null)\n                         }} />\n      )}"],
])
// navbar também no carrinho
edit(F + 'components/NavbarLoja.jsx', [
  ['  if (/\/(carrinho|checkout)$/.test(pathname)) return null', '  if (/\/checkout$/.test(pathname)) return null'],
  [' * Some no carrinho e no checkout, que têm o próprio rodapé de ação e o botão de voltar.', ' * Some só no checkout (etapas com o próprio rodapé de ação); no carrinho o rodapé de ação sobe para ficar acima dela.'],
])
edit(F + 'styles/pages/_cardapio.scss', [
  ['.loja-menu.p-sidebar {', `// carrinho: o rodapé de ação (subtotal + Continuar) fica acima da navegação do celular
.loja:has(.loja-nav) .loja-rodape-fixo { bottom: calc(3.5rem + env(safe-area-inset-bottom)); }
.loja:has(.loja-nav) .loja-pagina:has(.loja-rodape-fixo--resumo) { padding-bottom: 13rem; }

.loja-menu.p-sidebar {`],
  ['  .loja-sacola { top: 4.5rem; }', '  .loja-sacola { top: 4.5rem; }\n  .loja:has(.loja-nav) .loja-rodape-fixo { bottom: 0; }\n  .loja:has(.loja-nav) .loja-pagina:has(.loja-rodape-fixo--resumo) { padding-bottom: 9rem; }'],
])
