const agora = new Date();
const FUSO = "America/Sao_Paulo";

// Vale hoje se "agora" está entre o início e o fim do cupom.
// (Assim, mesmo que a atualização atrase, cupom vencido some sozinho.)
function validoAgora(c) {
  if (c.inicio && agora < new Date(c.inicio)) return false;
  if (c.fim && agora > new Date(c.fim)) return false;
  return true;
}

const reais = (v) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const dataBR = (iso) => new Date(iso).toLocaleDateString("pt-BR", { timeZone: FUSO });
const terminaHoje = (iso) => iso && dataBR(iso) === dataBR(agora.toISOString());

function esc(s) {
  const d = document.createElement("div");
  d.textContent = s ?? "";
  return d.innerHTML;
}

const cupons = (window.CUPONS || []).filter(validoAgora);
// Categorias na ordem em que aparecem no site do KFC; "Outros" por último
const categorias = [...new Set(cupons.map((c) => c.categoria))].sort(
  (a, b) => (a === "Outros") - (b === "Outros")
);

document.getElementById("data-hoje").textContent = agora.toLocaleDateString("pt-BR", {
  weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: FUSO,
});
if (window.CUPONS_ATUALIZADO_EM) {
  document.getElementById("atualizado").textContent =
    "Lista atualizada em " +
    new Date(window.CUPONS_ATUALIZADO_EM).toLocaleString("pt-BR", {
      timeZone: FUSO, dateStyle: "short", timeStyle: "short",
    });
}

const selCategoria = document.getElementById("categoria");
categorias.forEach((cat) => selCategoria.add(new Option(cat, cat)));

function cartao(c) {
  const alternativos = c.codigosAlternativos || [];
  const temDetalhes = c.regras || alternativos.length;
  return `
    <article class="cupom">
      ${c.imagem ? `<img src="${esc(c.imagem)}" alt="" loading="lazy">` : ""}
      ${terminaHoje(c.fim) ? '<span class="tag">Último dia!</span>' : ""}
      <div class="corpo">
        <h3>${esc(c.titulo)}</h3>
        <p class="descricao">${esc(c.descricao)}</p>
        ${c.preco != null ? `<p class="preco">${reais(c.preco)}</p>` : ""}
        <div class="rodape">
          ${c.codigo ? `<button class="codigo" data-codigo="${esc(c.codigo)}" title="Copiar código">${esc(c.codigo)}</button>` : ""}
          ${c.fim ? `<span class="info">até ${dataBR(c.fim)}</span>` : ""}
        </div>
        ${temDetalhes ? `
        <details>
          <summary>Regras e outros códigos</summary>
          ${alternativos.length ? `<p>Se o código não funcionar na sua loja, tente:
            ${alternativos.map((a) => `<button class="codigo pequeno" data-codigo="${esc(a)}">${esc(a)}</button>`).join(" ")}</p>` : ""}
          ${c.regras ? `<p class="regras">${esc(c.regras)}</p>` : ""}
        </details>` : ""}
      </div>
    </article>`;
}

function render() {
  const termo = document.getElementById("busca").value.trim().toLowerCase();
  const categoria = selCategoria.value;
  const filtrados = cupons.filter(
    (c) =>
      (!categoria || c.categoria === categoria) &&
      (!termo || `${c.titulo} ${c.descricao} ${c.codigo}`.toLowerCase().includes(termo))
  );

  document.getElementById("resumo").textContent =
    `${filtrados.length} ${filtrados.length === 1 ? "cupom válido" : "cupons válidos"} hoje`;

  const html = categorias
    .map((cat) => {
      const doGrupo = filtrados.filter((c) => c.categoria === cat);
      if (!doGrupo.length) return "";
      return `<h2>${esc(cat)}</h2><div class="grade">${doGrupo.map(cartao).join("")}</div>`;
    })
    .join("");

  document.getElementById("lista").innerHTML =
    html || '<p class="vazio">Nenhum cupom válido hoje com esses filtros.</p>';
}

document.getElementById("busca").addEventListener("input", render);
selCategoria.addEventListener("change", render);

document.getElementById("lista").addEventListener("click", async (e) => {
  const btn = e.target.closest(".codigo");
  if (!btn) return;
  try {
    await navigator.clipboard.writeText(btn.dataset.codigo);
    btn.textContent = "Copiado!";
    setTimeout(() => (btn.textContent = btn.dataset.codigo), 1200);
  } catch {}
});

render();
