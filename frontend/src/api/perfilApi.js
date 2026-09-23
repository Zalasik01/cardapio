import http from './http'

/** Edita o proprio perfil. Devolve o usuarioLogado atualizado. */
export const atualizarPerfil = (dados) => http.put('/perfil', dados).then((res) => res.data)

export const alterarMinhaSenha = (senhaAtual, novaSenha) =>
  http.put('/perfil/senha', { senhaAtual, novaSenha })

/** Minha foto como Blob (404 se nao tiver). */
export const obterMinhaFoto = () => http.get('/perfil/foto', { responseType: 'blob' }).then((res) => res.data)

export const enviarMinhaFoto = (arquivo) => {
  const dados = new FormData()
  dados.append('arquivo', arquivo)
  return http.put('/perfil/foto', dados)
}

export const removerMinhaFoto = () => http.delete('/perfil/foto')
