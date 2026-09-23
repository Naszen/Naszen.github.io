// Uso: node tools/extract-lang.mjs <archivo.html> <es|en>
// Imprime el texto del idioma pedido, normalizado (una línea por bloque, espacios colapsados).
// Soporta dos formatos: el antiguo (<article id="es">) y el nuevo ([data-lang="es"]).
import { readFileSync } from 'node:fs';
const [file, lang] = process.argv.slice(2);
const html = readFileSync(file, 'utf8');
const other = lang === 'es' ? 'en' : 'es';

function stripTags(s) {
  return s
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<(br\s*\/?|\/p|\/li|\/h[1-6]|\/dt|\/dd|\/summary|\/div|\/ul|\/ol|li|ul|ol|p|h[1-6]|details|summary)(\s[^>]*)?>/gi, '\u0001')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&#39;/g, "'").replace(/&quot;/g, '"');
}
function removeLang(s, l) {
  // elimina elementos con data-lang="l" (anidamiento simple: el mismo tag de apertura/cierre)
  const re = new RegExp(`<(\\w+)[^>]*data-lang="${l}"[^>]*>[\\s\\S]*?<\\/\\1>`, 'g');
  let prev; do { prev = s; s = s.replace(re, ''); } while (s !== prev);
  return s;
}
let body;
const legacy = html.match(new RegExp(`<article[^>]*id="${lang}"[\\s\\S]*?<\\/article>`));
if (legacy) body = legacy[0];
else {
  const main = html.match(/<main[\s\S]*?<\/main>/);
  body = removeLang(main ? main[0] : html, other);
}
const out = stripTags(body).replace(/\s+/g, ' ').split('\u0001').map(l => l.replace(/ ([.,;:)»])/g, '$1').replace(/([(«]) /g, '$1').trim()).filter(Boolean)
  // quita las líneas de navegación entre idiomas y de fecha, que cambian de formato legítimamente
  .map(l => l.replace(/\s*·\s*(English below|Versión en español)$/, ''))
  .filter(l => l && !/^(English below|Versión en español|Español|English)$/.test(l))
  .join('\n');
process.stdout.write(out + '\n');
