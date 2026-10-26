// Busca os cupons de hoje e envia para o GitHub (o site se atualiza sozinho).
// Uso: npm run publicar
import { execSync } from "node:child_process";

const rodar = (cmd) => execSync(cmd, { stdio: "inherit" });

rodar("npm run atualizar");
rodar("git add cupons.js");
try {
  execSync("git diff --cached --quiet");
  console.log("Nenhuma mudança nos cupons; nada para enviar.");
} catch {
  rodar('git commit -m "Atualiza cupons"');
  rodar("git push");
  console.log("Enviado! O site atualiza em 1 ou 2 minutos.");
}
