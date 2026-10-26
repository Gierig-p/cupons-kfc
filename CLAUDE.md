# Cupons KFC de Hoje — contexto do projeto

Site estático (HTML/CSS/JS puro, sem framework) que mostra todos os cupons do
KFC Brasil válidos no dia atual. Usuário fala português; responder em pt-BR.

- Site no ar: https://gierig-p.github.io/cupons-kfc/
- Repositório (público): https://github.com/Gierig-p/cupons-kfc (conta GitHub: Gierig-p)
- GitHub CLI instalado em `C:\Program Files\GitHub CLI\gh.exe` (não está no PATH do bash), já logado.

## Arquivos
- `index.html`, `style.css`, `app.js` — o site. Abre com dois cliques (sem servidor).
  `app.js` filtra cupons pela validade (`inicio`/`fim` em ISO) comparando com o
  momento atual, agrupa por categoria, tem busca, botão copiar código, aviso
  "Último dia!" (fuso America/Sao_Paulo) e detalhes com regras + códigos alternativos.
- `cupons.js` — GERADO pelo script; define `window.CUPONS` e `window.CUPONS_ATUALIZADO_EM`.
- `scripts/atualizar-cupons.js` — Playwright abre https://www.kfc.com.br/coupons,
  espera a resposta que a própria página carrega
  (`plugins.api.x-mart.io/api/masivo/campaigns?status=RUNNING&providerPlatform=web`,
  a versão SEM `store_id`) e converte em `cupons.js`.
- `scripts/publicar.js` — `npm run atualizar` + commit de `cupons.js` + `git push`.
- `.github/workflows/atualizar-e-publicar.yml` — só publica o site no GitHub Pages a cada push.

## Comandos
- `npm run atualizar` — baixa os cupons de hoje para `cupons.js` (local).
- `npm run publicar` — baixa e envia para o site no ar (é assim que o usuário atualiza, à mão).

## Formato dos dados do KFC (descoberto em 26/10/2026)
- Cada campanha: `name`, `start_date`/`end_date` (UTC; 03:00Z = 00:00 Brasília),
  `stores` (ids de lojas), `attributes.codes` (códigos do cupom),
  `rules[0].effects[0].reward.attributes.estimated_value` (preço),
  `content.Title/Descripcion/Categoria/BannerImage/TermsAndConditions`.
- Cada oferta vem DUPLICADA para dois grupos de lojas sem sobreposição:
  ~220 lojas (códigos `KFCAxxx`, preço real) e ~41 lojas (códigos aleatórios,
  "preço" 1000/10000 que não é real). O script junta por título: código principal =
  versão com preço real; os outros viram `codigosAlternativos`.
- A página pública usa uma loja padrão (Shopping Norte Sul Plaza) para exibir.
- Em 26/10/2026: 51 campanhas → 27 cupons.

## Decisões e limitações
- Chamar a API interna do KFC direto (curl) foi bloqueado pelo modo automático de
  segurança. Por isso usamos navegador automático na página pública, com
  autorização explícita do usuário, que aceitou o risco dos termos de uso do KFC.
- A busca automática nos servidores do GitHub Actions FALHOU (timeout: a página não
  entrega a lista de campanhas lá, provável bloqueio de IP de servidor). Não tentar
  contornar bloqueio. Por isso o agendamento diário foi removido e o usuário
  escolheu atualizar À MÃO (recusou tarefa agendada no Windows).
- Criar repositório público foi bloqueado para o Claude; o usuário rodou os comandos
  `gh repo create`, ativou o Pages (`build_type=workflow`) e fez o primeiro push.
- Commits usam o nome/email noreply do GitHub do usuário (config local do repo).

## Histórico
- 26/10/2026: projeto criado do zero, primeiro com cupons de exemplo; depois
  scraper real, publicação no GitHub Pages, ajuste para atualização manual.

## Ideias possíveis (não feitas)
- Filtrar por loja/cidade (precisaria da lista de lojas e mapear ids).
- Detectar quando o formato dos dados do KFC mudar e avisar.
