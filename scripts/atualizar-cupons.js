// Abre a página pública de cupons do KFC (kfc.com.br/coupons) num navegador
// automático, lê a lista de campanhas que a própria página carrega e salva
// os cupons em cupons.js.
//
// Uso: npm run atualizar

import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const PAGINA = "https://www.kfc.com.br/coupons";
const RAIZ = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const SAIDA = path.join(RAIZ, "cupons.js");

// A página carrega a lista geral (sem store_id) e depois a de uma loja.
// Queremos a geral, que traz todos os cupons ativos.
const ehListaGeral = (url) =>
  url.includes("/masivo/campaigns") &&
  url.includes("status=RUNNING") &&
  !url.includes("store_id");

async function baixarCampanhas() {
  const navegador = await chromium.launch();
  try {
    const pagina = await navegador.newPage({ locale: "pt-BR" });
    const resposta = pagina.waitForResponse((r) => ehListaGeral(r.url()) && r.ok(), {
      timeout: 90_000,
    });
    await pagina.goto(PAGINA, { waitUntil: "domcontentloaded", timeout: 90_000 });
    return await (await resposta).json();
  } finally {
    await navegador.close();
  }
}

// Valores de 1000/10000 aparecem como "preço" em alguns grupos de lojas,
// mas não são preço real.
const precoValido = (v) => (typeof v === "number" && v > 0 && v < 1000 ? v : null);

function converter(c) {
  const conteudo = c.content || {};
  const premio = c.rules?.[0]?.effects?.[0]?.reward;
  return {
    titulo: (conteudo.Title?.value || c.name || "").trim(),
    descricao: (conteudo.Descripcion?.value || premio?.description || c.description || "").trim(),
    categoria: conteudo.Categoria?.value || "Outros",
    imagem: conteudo.BannerImage?.value || null,
    preco: precoValido(premio?.attributes?.estimated_value),
    codigos: c.attributes?.codes || [],
    regras: (conteudo.TermsAndConditions?.value || "").trim(),
    inicio: c.start_date,
    fim: c.end_date,
    lojas: c.stores?.length || 0,
  };
}

// Junta campanhas com o mesmo nome (mesma oferta para grupos de lojas diferentes).
function juntar(campanhas) {
  const porNome = new Map();
  for (const c of campanhas.map(converter)) {
    const chave = c.titulo.toUpperCase();
    if (!porNome.has(chave)) porNome.set(chave, []);
    porNome.get(chave).push(c);
  }

  return [...porNome.values()].map((grupo) => {
    // Principal: a que tem preço real; empate -> a que vale em mais lojas.
    grupo.sort((a, b) => (b.preco != null) - (a.preco != null) || b.lojas - a.lojas);
    const [principal, ...outras] = grupo;
    const todos = grupo.flatMap((g) => g.codigos);
    return {
      titulo: principal.titulo,
      descricao: principal.descricao || outras.find((o) => o.descricao)?.descricao || "",
      categoria: principal.categoria !== "Outros" ? principal.categoria
        : outras.find((o) => o.categoria !== "Outros")?.categoria || "Outros",
      imagem: principal.imagem || outras.find((o) => o.imagem)?.imagem || null,
      preco: principal.preco,
      codigo: principal.codigos[0] || null,
      codigosAlternativos: [...new Set(todos)].filter((x) => x !== principal.codigos[0]),
      regras: principal.regras || outras.find((o) => o.regras)?.regras || "",
      // Período em que pelo menos uma versão vale
      inicio: grupo.map((g) => g.inicio).sort()[0],
      fim: grupo.map((g) => g.fim).sort().at(-1),
    };
  });
}

const campanhas = await baixarCampanhas();
if (!Array.isArray(campanhas)) throw new Error("Resposta inesperada: não é uma lista");

const cupons = juntar(campanhas.filter((c) => c.type === "COUPONS" && c.status === "RUNNING"));
if (cupons.length === 0) throw new Error("Nenhum cupom encontrado; mantendo arquivo antigo");

const conteudo =
  "// Arquivo gerado por scripts/atualizar-cupons.js. Não edite à mão.\n" +
  `window.CUPONS_ATUALIZADO_EM = ${JSON.stringify(new Date().toISOString())};\n` +
  `window.CUPONS = ${JSON.stringify(cupons, null, 2)};\n`;
fs.writeFileSync(SAIDA, conteudo);
console.log(`${cupons.length} cupons salvos em cupons.js (de ${campanhas.length} campanhas)`);
