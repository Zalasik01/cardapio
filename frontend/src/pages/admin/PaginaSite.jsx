import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from 'primereact/button'
import { ColorPicker } from 'primereact/colorpicker'
import { InputMask } from 'primereact/inputmask'
import { InputText } from 'primereact/inputtext'
import { InputTextarea } from 'primereact/inputtextarea'
import { useAuth } from '../../context/AuthContext'
import { dispatchMsgError, dispatchMsgSuccess } from '../../store/dispatchMsg'
import { obterSite, salvarSite } from '../../api/siteApi'
import { enviarImagemLoja } from '../../api/adminApi'
import DropzoneImagem from '../../components/DropzoneImagem'
import { Campo, GradeCampos, SecaoCrud } from '../../components/crud/Campo'
import CrudPagina from '../../components/crud/CrudPagina'
import { CrudSkeleton } from '../../components/Skeleton'

const COR_PADRAO = '#dc2626'
const VAZIO = { corPrimaria: '', bannerUrl: '', sobre: '', instagram: '', facebook: '', whatsapp: '', mensagemTopo: '', dominio: '' }

/** Loja > Site: aparência do cardápio online (cor da marca, banner, textos e redes) e domínio próprio. */
export default function PaginaSite() {
  const { loja, pode } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState(null)
  const [salvando, setSalvando] = useState(false)
  const podeAlterar = pode('SITE_ALTERAR')

  useEffect(() => {
    obterSite(loja.tenant)
      .then((s) => setForm(Object.fromEntries(Object.entries({ ...VAZIO, ...s }).map(([k, v]) => [k, v ?? '']))))
      .catch((e) => dispatchMsgError(e.mensagem))
  }, [loja.tenant])

  const definir = (campo) => (valor) => setForm((atual) => ({ ...atual, [campo]: valor }))
  const definirTexto = (campo) => (e) => definir(campo)(e.target.value)
  const cor = form?.corPrimaria || COR_PADRAO
  const link = `${window.location.origin}/${loja.slug}`

  async function salvar(e) {
    e.preventDefault()
    setSalvando(true)
    try {
      const dados = await salvarSite(loja.tenant, form)
      setForm(Object.fromEntries(Object.entries({ ...VAZIO, ...dados }).map(([k, v]) => [k, v ?? ''])))
      dispatchMsgSuccess('Site atualizado com sucesso')
    } catch (err) {
      dispatchMsgError(err.mensagem)
    } finally {
      setSalvando(false)
    }
  }

  return (
    <form onSubmit={salvar}>
      <CrudPagina
        somenteLeitura={!podeAlterar}
        titulo="Site da loja"
        subtitulo="Aparência e informações do seu cardápio online"
        aoVoltar={() => navigate('/admin/dashboard')}
        rodape={(
          <div className="crud__acoes">
            <a className="p-button p-button-outlined p-button-secondary site__ver" href={link} target="_blank" rel="noopener noreferrer">
              <i className="pi pi-external-link" aria-hidden="true" /> &nbsp;Ver o site
            </a>
            <span className="crud__espaco" />
            <Button type="button" label="Fechar" severity="secondary" outlined onClick={() => navigate('/admin/dashboard')} />
            {podeAlterar && <Button type="submit" label={salvando ? 'Salvando...' : 'Salvar alterações'} disabled={salvando || !form} />}
          </div>
        )}
      >
        {!form ? <CrudSkeleton blocos={[[4, 4, 4], [12]]} /> : (
          <>
            <SecaoCrud id="secao-aparencia" titulo="Aparência">
              <GradeCampos>
                <Campo id="cor" rotulo="Cor da marca" tamanho={3} ajuda="Botões, destaques e a faixa do topo do cardápio. Vazio = vermelho padrão.">
                  <div className="site__cor">
                    <ColorPicker inputId="cor" value={cor.replace('#', '')} format="hex" disabled={!podeAlterar}
                                 onChange={(e) => definir('corPrimaria')(`#${String(e.value).replace('#', '')}`)} />
                    <InputText value={form.corPrimaria} placeholder={COR_PADRAO} maxLength={7} disabled={!podeAlterar}
                               onChange={(e) => definir('corPrimaria')(e.target.value)} aria-label="Código da cor" />
                    {form.corPrimaria && <Button type="button" icon="pi pi-times" text rounded severity="secondary" aria-label="Voltar à cor padrão" onClick={() => definir('corPrimaria')('')} />}
                  </div>
                </Campo>
                <Campo id="mensagemTopo" rotulo="Aviso no topo" tamanho={9} ajuda="Faixa escura acima do cardápio (ex.: Frete grátis hoje!). Vazio = sem aviso.">
                  <InputText id="mensagemTopo" maxLength={160} value={form.mensagemTopo} onChange={definirTexto('mensagemTopo')} />
                </Campo>
                <Campo id="banner" rotulo="Banner da capa" tamanho={12} ajuda="Imagem larga (ex.: 1600×400) atrás do logo. Vazio = degradê da cor da marca.">
                  <DropzoneImagem valor={form.bannerUrl} aoAlterar={definir('bannerUrl')} enviar={(arquivo) => enviarImagemLoja(loja.tenant, arquivo)} desabilitado={!podeAlterar} />
                </Campo>
              </GradeCampos>
              <div className="site__previa" style={{ '--previa': cor }} aria-hidden="true">
                <span style={form.bannerUrl ? { backgroundImage: `url(${form.bannerUrl})` } : undefined} />
                <button type="button" tabIndex={-1}>Adicionar ao carrinho</button>
              </div>
            </SecaoCrud>

            <SecaoCrud id="secao-textos" titulo="Textos e redes sociais">
              <GradeCampos>
                <Campo id="sobre" rotulo="Sobre a loja" tamanho={12} ajuda="Aparece no fim do cardápio: história, diferenciais, formas de pedir.">
                  <InputTextarea id="sobre" rows={4} maxLength={1000} autoResize value={form.sobre} onChange={definirTexto('sobre')} />
                </Campo>
                <Campo id="instagram" rotulo="Instagram" tamanho={4} ajuda="Só o usuário, sem @.">
                  <InputText id="instagram" maxLength={100} value={form.instagram} onChange={definirTexto('instagram')} />
                </Campo>
                <Campo id="facebook" rotulo="Facebook" tamanho={4} ajuda="Página ou endereço completo.">
                  <InputText id="facebook" maxLength={255} value={form.facebook} onChange={definirTexto('facebook')} />
                </Campo>
                <Campo id="whatsapp" rotulo="WhatsApp" tamanho={4}>
                  <InputMask id="whatsapp" mask="(99) 99999-9999" autoClear={false} value={form.whatsapp} onChange={(e) => definir('whatsapp')(e.value ?? '')} />
                </Campo>
              </GradeCampos>
            </SecaoCrud>

            <SecaoCrud id="secao-endereco" titulo="Endereço do site">
              <GradeCampos>
                <Campo id="link" rotulo="Link atual" tamanho={6} ajuda="Este endereço já funciona. Use o ícone de link no topo do painel para copiar.">
                  <InputText id="link" value={link} readOnly />
                </Campo>
                <Campo id="dominio" rotulo="Domínio próprio" tamanho={6} ajuda="Ex.: pedidos.minhaloja.com.br. Vazio = usa só o link acima.">
                  <InputText id="dominio" maxLength={120} value={form.dominio} onChange={definirTexto('dominio')} placeholder="pedidos.minhaloja.com.br" />
                </Campo>
              </GradeCampos>
              {form.dominio && (
                <p className="texto-auxiliar">
                  Para o domínio funcionar, no provedor onde ele foi registrado crie um registro <strong>CNAME</strong> de <code>{form.dominio}</code> apontando
                  para o endereço do sistema e ative o certificado HTTPS. Depois disso, abrir <code>{form.dominio}</code> mostra o seu cardápio.
                </p>
              )}
            </SecaoCrud>
          </>
        )}
      </CrudPagina>
    </form>
  )
}
