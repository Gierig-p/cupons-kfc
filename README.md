# Cupons KFC de Hoje

Site que mostra todos os cupons do KFC Brasil válidos no dia atual.

## Como funciona
- `scripts/atualizar-cupons.js` abre a página pública https://www.kfc.com.br/coupons
  num navegador automático (Playwright), lê os cupons que ela carrega e salva em `cupons.js`.
- O site (`index.html`) mostra só os cupons cuja validade inclui o momento atual.
- No GitHub, a automação `.github/workflows/atualizar-e-publicar.yml` roda todo dia
  às 06:00 e 12:00 (Brasília), atualiza os cupons e publica no GitHub Pages.

## Usar no computador
```
npm install
npx playwright install chromium
npm run atualizar     # baixa os cupons de hoje
```
Depois abra `index.html` com dois cliques.

## Observações
- Site não oficial. A leitura automática pode ir contra os termos de uso do KFC
  e pode parar de funcionar se o site deles mudar.
- Cada oferta vem em duas versões (grupos de lojas diferentes). O site mostra o
  código principal e, em "Regras e outros códigos", os códigos alternativos.
