import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const base = "/varese-sites/Template%203D/examples/";
const examples = [
  { id: "racer", keys: /officina|carrozzeria|torneria|meccanica|auto|caroleo|masala|ghiturri|cfp/ },
  { id: "hangar", keys: /impiant|elettric|termoidraulic|idraul|tecnic|sistemi|service|switch-on|elbo/ },
  { id: "monolith", keys: /edil|costru|scavi|serrament|cemento|rover|va-edil|varedil|ponteggi/ },
  { id: "florae", keys: /giardin|fior|flor|verde|piante/ },
  { id: "ember", keys: /ferro|accia|sald|artigian|lavorazion|resine/ },
  { id: "sucre", keys: /beauty|fashion|parrucch|capelli|hair|sciampo|bellezza|donna|stile|sensation|sfumature|acconciature|virno/ },
  { id: "nocturne", keys: /profumer|estetica|cosmetic|beauty/ },
  { id: "keeper", keys: /puliz|clean|igien|sanific/ },
  { id: "atlas", keys: /trasport|noleggio|logistic|viagg/ },
  { id: "koen", keys: /casa|arred|legno|steelwood|mobili/ },
  { id: "gambit", keys: /consulent|associat|studio|geom|basaglia|morello/ },
  { id: "reliquary", keys: /arte|restaur|antiqu|intagliatore/ },
  { id: "abyssal", keys: /acqua|piscin|nautica|sub/ },
  { id: "velocity", keys: /sport|fitness|palestra|bike|cicl/ },
  { id: "terrarium", keys: /agricol|flor|giardin/ }
];
const fallback = {
  "racer": "Un concept digitale per presentare servizi, lavorazioni e contatti.",
  "hangar": "Soluzioni tecniche presentate in modo chiaro, con una richiesta di contatto immediata.",
  "monolith": "Progetti, lavorazioni e servizi in una vetrina digitale essenziale.",
  "florae": "Una vetrina digitale dedicata a cura, progettazione e manutenzione del verde.",
  "ember": "Un concept digitale per valorizzare lavorazioni, competenze e richieste di preventivo.",
  "sucre": "Un'esperienza visiva pensata per presentare servizi, stile e prenotazioni.",
  "nocturne": "Una presentazione elegante dei servizi e dell'esperienza del brand.",
  "keeper": "Servizi professionali presentati in modo diretto, con contatto rapido.",
  "atlas": "Servizi e soluzioni presentati con una navigazione semplice.",
  "koen": "Un concept digitale ispirato a materiali, dettagli e qualità.",
  "gambit": "Una presenza digitale pulita per spiegare attività e servizi professionali.",
  "reliquary": "Una vetrina essenziale che mette al centro identità e competenze.",
  "abyssal": "Una presentazione immersiva per servizi e soluzioni specialistiche.",
  "velocity": "Un concept dinamico per mettere in evidenza servizi e attività.",
  "terrarium": "Una vetrina visiva ispirata alla natura e ai dettagli."
};

function escapeHtml(s) {
  return String(s || "").replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
}
function getAttr(html, regex) { return (html.match(regex) || [])[1] || ""; }
function findLinks(html, re) {
  return [...html.matchAll(/<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi)]
    .map(m => ({ href: m[1].trim(), text: m[2].replace(/<[^>]+>/g, "").trim() }))
    .filter(x => re.test(x.href) || re.test(x.text));
}
function chooseTemplate(slug, title, desc) {
  const s = (slug + " " + title + " " + desc).toLowerCase();
  for (const e of examples) if (e.keys.test(s)) return e.id;
  return "monolith";
}
const dirs = fs.readdirSync(path.join(root, "sites"), { withFileTypes: true }).filter(d => d.isDirectory());
let done = 0;
for (const dir of dirs) {
  const file = path.join(root, "sites", dir.name, "index.html");
  if (!fs.existsSync(file)) continue;
  const old = fs.readFileSync(file, "utf8");
  const title = getAttr(old, /<title[^>]*>([\s\S]*?)<\/title>/i).replace(/\s*[—–-]\s*concept web.*$/i, "").trim() || dir.name.replace(/-/g, " ");
  const desc = getAttr(old, /<meta\s+name=["']description["']\s+content=["']([^"']*)["']/i);
  const template = chooseTemplate(dir.name, title, desc);
  const phones = findLinks(old, /^(tel:)|telefono|chiama|phone/i);
  const emails = findLinks(old, /^(mailto:)|email|e-mail/i);
  const socials = findLinks(old, /instagram\.com|facebook\.com|linkedin\.com/i);
  const addressMatch = old.match(/(?:Via|Viale|Piazza|Corso|Largo)\s+[A-ZÀ-Ü][^<\n]{5,90}/i);
  const phone = phones.find(x => x.href.toLowerCase().startsWith("tel:"));
  const email = emails.find(x => x.href.toLowerCase().startsWith("mailto:"));
  const address = addressMatch ? addressMatch[0].replace(/["']/g, "").trim() : "";
  const contactItems = [];
  if (phone) contactItems.push('<a class="contact-button" href="' + escapeHtml(phone.href) + '">Chiama ' + escapeHtml(phone.href.replace(/^tel:/i, "")) + '</a>');
  if (email) contactItems.push('<a class="contact-button secondary" href="' + escapeHtml(email.href) + '">Scrivi un’email</a>');
  if (socials[0]) contactItems.push('<a class="contact-button secondary" target="_blank" rel="noopener noreferrer" href="' + escapeHtml(socials[0].href) + '">' + escapeHtml(socials[0].text || "Profilo social") + '</a>');
  const contacts = contactItems.length ? contactItems.join("\n") : '<p class="missing">Contatti diretti da verificare prima della pubblicazione definitiva.</p>';
  const summary = desc || fallback[template];
  const html = `<!doctype html>
<html lang="it"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="theme-color" content="#0b0b0d"><meta name="description" content="${escapeHtml(summary)}"><title>${escapeHtml(title)} — concept 3D</title>
<style>
:root{color-scheme:dark;--bg:#0b0b0d;--fg:#f5f2ec;--accent:#d6ff52;--muted:#a7a7ad}*{box-sizing:border-box}html{scroll-behavior:smooth}body{margin:0;background:var(--bg);color:var(--fg);font:16px/1.55 Inter,system-ui,-apple-system,sans-serif}a{color:inherit}.bar{height:66px;padding:0 5vw;display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid #ffffff20;letter-spacing:.12em;font-size:11px;text-transform:uppercase}.brand{font-weight:800;letter-spacing:.06em}.brand span{color:var(--accent)}.hero{padding:clamp(24px,5vw,72px) 5vw 28px;display:grid;grid-template-columns:1fr auto;gap:24px;align-items:end}.eyebrow{font:11px ui-monospace,monospace;letter-spacing:.16em;text-transform:uppercase;color:var(--accent)}h1{font-size:clamp(40px,7.2vw,100px);line-height:.92;letter-spacing:-.07em;margin:16px 0;max-width:1000px;overflow-wrap:anywhere}.desc{max-width:680px;color:var(--muted);font-size:clamp(15px,1.5vw,19px)}.tag{border:1px solid #ffffff30;padding:10px 12px;font:10px ui-monospace,monospace;letter-spacing:.1em;text-transform:uppercase;white-space:nowrap}.scene{height:min(82vh,850px);min-height:540px;margin:0 5vw;border:1px solid #ffffff24;background:#111;overflow:hidden;position:relative}.scene iframe{width:100%;height:100%;border:0;display:block;background:#08090b}.scene-label{position:absolute;bottom:14px;left:14px;z-index:2;background:#0b0b0ddd;padding:8px 10px;font:10px ui-monospace,monospace;letter-spacing:.1em;text-transform:uppercase;pointer-events:none}.details{margin:clamp(42px,8vw,100px) 5vw;display:grid;grid-template-columns:1fr minmax(260px,.7fr);gap:40px;border-top:1px solid #ffffff24;padding-top:32px}.details h2{font-size:clamp(28px,4vw,52px);line-height:1;margin:0 0 18px;letter-spacing:-.055em}.contact{display:flex;flex-wrap:wrap;gap:10px;align-content:start}.contact-button{display:inline-flex;align-items:center;justify-content:center;padding:14px 18px;background:var(--accent);color:#111;text-decoration:none;font-weight:750;font-size:13px;min-height:48px}.contact-button.secondary{background:transparent;border:1px solid #ffffff50;color:var(--fg)}.missing{color:#ffcf7a;font-size:13px}.footer{padding:24px 5vw;border-top:1px solid #ffffff20;color:var(--muted);font-size:11px;display:flex;justify-content:space-between;gap:18px;flex-wrap:wrap}.footer a{color:var(--fg)}@media(max-width:700px){.hero{grid-template-columns:1fr}.tag{justify-self:start}.scene{height:70vh;min-height:460px;margin:0 4vw}.details{grid-template-columns:1fr;margin:56px 4vw}.bar{padding:0 4vw}}
</style></head><body>
<header class="bar"><a class="brand" href="../../">VARESE <span>/</span> DIGITAL</a><span>Concept interattivo · ${template.toUpperCase()}</span></header>
<main><section class="hero"><div><p class="eyebrow">Esperienza digitale · ${escapeHtml(template)}</p><h1>${escapeHtml(title)}</h1><p class="desc">${escapeHtml(summary)}</p></div><span class="tag">Concept non ufficiale</span></section>
<section class="scene" aria-label="Anteprima 3D interattiva"><iframe src="/varese-sites/Template%203D/examples/${template}/index.html" title="Esperienza 3D — ${escapeHtml(title)}" loading="eager" allow="fullscreen"></iframe><span class="scene-label">Scena 3D · interagisci all’interno</span></section>
<section class="details"><div><p class="eyebrow">Il progetto</p><h2>Un’identità digitale costruita intorno alla vostra attività.</h2><p class="desc">${escapeHtml(summary)} Questa pagina è un concept dimostrativo indipendente, da verificare e approvare con l’attività prima di considerarla ufficiale.</p>${address ? '<p class="desc">Riferimento indirizzo rilevato: ' + escapeHtml(address) + '</p>' : ''}</div><div><p class="eyebrow">Contatti</p><div class="contact">${contacts}</div></div></section></main>
<footer class="footer"><span>${escapeHtml(title)} · Concept web indipendente</span><a href="../../">Catalogo Varese Digital ↗</a></footer></body></html>`;
  fs.writeFileSync(file, html);
  done++;
}
console.log(`Applied 3D concepts to ${done} business pages.`);
