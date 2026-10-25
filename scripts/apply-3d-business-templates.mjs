import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const builtExamples = path.join(root, "template 3D", "Dioramas", "dist", "examples");

const sectors = [
  { id: "racer", match: /officina|carrozzeria|torneria|meccanica|auto|caroleo|masala|ghiturri|cfp/i, kind: "officina", nav: ["Servizi", "Lavorazioni", "L’officina"], cta: "Richiedi un intervento", description: "Officina e lavorazioni meccaniche: scopri i servizi e contatta l’attività per informazioni o un appuntamento." },
  { id: "hangar", match: /impiant|elettric|termoidraul|idraul|tecnic|sistemi|service|switch-on|elbo/i, kind: "impianti", nav: ["Servizi", "Soluzioni", "Contatti"], cta: "Richiedi un intervento", description: "Installazione e assistenza tecnica: scopri i servizi e contatta l’attività per informazioni o un sopralluogo." },
  { id: "monolith", match: /edil|costru|scavi|serrament|cemento|rover|va-edil|varedil|ponteggi/i, kind: "edilizia", nav: ["Servizi", "Progetti", "Contatti"], cta: "Richiedi un preventivo", description: "Impresa edile: scopri lavorazioni e servizi e richiedi informazioni o un preventivo." },
  { id: "florae", match: /giardin|fior|flor|verde|piante/i, kind: "verde", nav: ["Servizi", "Realizzazioni", "Contatti"], cta: "Richiedi informazioni", description: "Servizi per il verde e la cura degli spazi esterni: scopri le soluzioni e contatta l’attività." },
  { id: "ember", match: /ferro|accia|sald|artigian|lavorazion|resine/i, kind: "lavorazioni", nav: ["Servizi", "Lavorazioni", "Contatti"], cta: "Richiedi un preventivo", description: "Lavorazioni e servizi specializzati: contatta l’attività per descrivere il tuo progetto e chiedere informazioni." },
  { id: "nocturne", match: /beauty|fashion|parrucch|capelli|hair|sciampo|bellezza|donna|stile|sensation|sfumature|acconciature|virno|profumer|estetica|cosmetic/i, kind: "salone", nav: ["Servizi", "Il salone", "Prenotazioni"], cta: "Prenota ora", description: "Salone dedicato alla cura e allo stile: scopri i servizi e contatta l’attività per prenotare." },
  { id: "keeper", match: /puliz|clean|igien|sanific/i, kind: "pulizie", nav: ["Servizi", "Metodo", "Contatti"], cta: "Richiedi un preventivo", description: "Servizi di pulizia e cura degli ambienti: contatta l’attività per informazioni e preventivi." },
  { id: "atlas", match: /trasport|noleggio|logistic|viagg/i, kind: "servizi", nav: ["Servizi", "Soluzioni", "Contatti"], cta: "Richiedi informazioni", description: "Servizi e soluzioni su misura: contatta l’attività per disponibilità e informazioni." },
  { id: "koen", match: /casa|arred|legno|steelwood|mobili/i, kind: "casa", nav: ["Servizi", "Progetti", "Contatti"], cta: "Parliamo del progetto", description: "Soluzioni per casa e ambienti: scopri i servizi e contatta l’attività per parlare del tuo progetto." },
  { id: "gambit", match: /consulent|associat|studio|geom|basaglia|morello/i, kind: "studio", nav: ["Attività", "Competenze", "Contatti"], cta: "Richiedi un appuntamento", description: "Studio professionale: scopri le competenze e contatta l’attività per un appuntamento informativo." },
  { id: "reliquary", match: /arte|restaur|antiqu|intagliatore/i, kind: "artigianato", nav: ["Attività", "Lavorazioni", "Contatti"], cta: "Richiedi informazioni", description: "Competenze artigianali e lavorazioni specialistiche: contatta l’attività per informazioni." },
  { id: "terrarium", match: /agricol/i, kind: "natura", nav: ["Servizi", "Progetti", "Contatti"], cta: "Richiedi informazioni", description: "Servizi legati alla natura e al territorio: contatta l’attività per maggiori informazioni." }
];
const fallback = { id: "monolith", kind: "impresa", nav: ["Servizi", "Attività", "Contatti"], cta: "Richiedi informazioni", description: "Scopri i servizi dell’attività e contattala per informazioni." };

function esc(s) { return String(s || "").replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c])); }
function attr(html, re) { return (html.match(re) || [])[1] || ""; }
function getTextLinks(html) {
  return [...html.matchAll(/<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi)].map(m => ({ href: m[1], text: m[2].replace(/<[^>]+>/g, "").trim() }));
}
function pick(slug, title, desc) {
  const hay = slug + " " + title + " " + desc;
  return sectors.find(x => x.match.test(hay)) || fallback;
}
function replaceAll(html, pairs) {
  for (const [from, to] of pairs) html = html.split(from).join(to);
  return html;
}
function rewrite(html, business, sector, phone, email, address) {
  const title = esc(business);
  let out = html.replace(/<html lang="en">/i, '<html lang="it">');
  out = out.replace(/<title>[\s\S]*?<\/title>/i, '<title>' + title + ' — ' + sector.kind + '</title>');
  out = out.replace(/<meta name="description" content="[^"]*">/i, '<meta name="description" content="' + esc(sector.description) + '">');

  const base = [
    ["Maison Sucre", title], ["Maison&nbsp;Sucre", title], ["Nocturne No. 9", title], ["Nocturne", title],
    ["Florae", title], ["Kōen 紅園", title], ["Kōen", title], ["Bell &amp; Moss", title],
    ["Low Frequency", title], ["Velocity Lab", title], ["Velocity", title], ["The House", "L’attività"],
    ["Pâtisserie", sector.kind], ["Pâtissier", sector.kind], ["A flower a month, from the edge of the map", sector.description],
    ["Iris &amp; Oud, extrait de parfum", sector.description], ["A whole climate under glass", sector.description],
    ["One tree, four seasons", sector.description], ["Macarons piped by hand on rue du Bac since 1962. Sugar, almonds, and a little gravity.", sector.description],
    ["A twelve-seat listening bar and record label in Shimokitazawa. Put your hand on the record.", sector.description],
    ["A bonsai nursery in Ōmiya, Saitama. Our oldest maple has seen 180 autumns. Scroll to turn its year.", sector.description],
    ["The notes", sector.nav[0]], ["The house", sector.nav[1]], ["Discovery set", sector.nav[2]],
    ["The notes", sector.nav[0]], ["La Carte", sector.nav[0]], ["L'Atelier", sector.nav[1]], ["Visit", sector.nav[2]],
    ["Build a box", sector.nav[1]], ["Order a box", sector.cta], ["Order a box", sector.cta],
    ["Shop No. 9", sector.cta], ["Add to bag", sector.cta], ["Add to bag — €290", sector.cta],
    ["Meet the notes", sector.nav[0]], ["Begin with", "Scopri"], ["a drop.", "i servizi."],
    ["Grasse, ", ""], ["since 1911.", ""], ["44 rue du Bac, Paris 7", ""], ["Depuis 1962", ""]
  ];
  out = replaceAll(out, base);

  if (sector.kind === "salone") {
    out = replaceAll(out, [
      ["Bergamot", "Taglio"], ["di Calabria", "e styling"], ["Iris", "Colore"], ["pallida", "e riflessi"],
      ["Vanilla", "Trattamenti"], ["Bourbon", "per i capelli"], ["Oud", "Styling"], ["of Assam", "su misura"],
      ["Begin with", "Il tuo stile"], ["a drop.", "comincia qui."],
      ["50 ml — €290", "Prenota un appuntamento"], ["The notes", "Servizi"], ["The house", "Il salone"],
      ["Discovery set", "Prenotazioni"], ["No. 9 Extrait, 50 ml", "Servizio in salone"],
      ["Decanting", "Preparazione"], ["maceration", "hair studio"], ["Bag", "Prenota"],
      ["No. 9", title], ["iris, bergamot, vanilla, oud.", "taglio, colore e styling."]
    ]);
  } else if (sector.kind === "officina") {
    out = replaceAll(out, [["Bergamot", "Manutenzione"], ["Iris", "Diagnosi"], ["Vanilla", "Riparazioni"], ["Oud", "Assistenza"], ["50 ml — €290", "Richiedi un intervento"], ["Shop No. 9", "Richiedi un intervento"], ["Add to bag", "Richiedi informazioni"]]);
  } else if (sector.kind === "impianti") {
    out = replaceAll(out, [["Bergamot", "Installazione"], ["Iris", "Manutenzione"], ["Vanilla", "Assistenza"], ["Oud", "Impianti"], ["50 ml — €290", "Richiedi un intervento"], ["Shop No. 9", "Richiedi un intervento"]]);
  } else if (sector.kind === "edilizia") {
    out = replaceAll(out, [["Bergamot", "Progettazione"], ["Iris", "Ristrutturazioni"], ["Vanilla", "Lavorazioni"], ["Oud", "Finiture"], ["50 ml — €290", "Richiedi un preventivo"], ["Shop No. 9", "Richiedi un preventivo"]]);
  } else if (sector.kind === "pulizie") {
    out = replaceAll(out, [["Bergamot", "Pulizie civili"], ["Iris", "Pulizie uffici"], ["Vanilla", "Trattamenti"], ["Oud", "Sanificazione"], ["50 ml — €290", "Richiedi un preventivo"], ["Shop No. 9", "Richiedi un preventivo"]]);
  }

  // Remove product pricing/cart affordances from the original demo and add real business actions.
  out = out.replace(/<span class="bag"[^>]*>[\s\S]*?<\/span>/gi, '');
  out = out.replace(/<button class="btn [^"]* add"[^>]*>[\s\S]*?<\/button>/gi, '');
  out = out.replace(/<a class="btn btn-solid" href="#shop"[^>]*>[\s\S]*?<\/a>/i, '<a class="btn btn-solid" href="#contatti" data-magnetic>' + esc(sector.cta) + '</a>');
  out = out.replace(/<a class="btn btn-ghost" href="#shop"[^>]*>[\s\S]*?<\/a>/i, '<a class="btn btn-ghost" href="#contatti" data-magnetic>' + esc(sector.cta) + '</a>');
  out = out.replace(/<a class="btn btn-text" href="#bergamot"[^>]*>[\s\S]*?<\/a>/i, '<a class="btn btn-text" href="#contatti">' + esc(sector.nav[2]) + '</a>');

  const mapQuery = encodeURIComponent(business + " Varese");
  const contactHtml = '<section class="note" id="contatti" data-stop="7" data-side="left"><p class="eyebrow">Contatti</p><h2>Parliamo <em>con te.</em></h2><p>' + esc(sector.description) + '</p><div class="actions">' +
    (phone ? '<a class="btn btn-solid" href="tel:' + esc(phone) + '">Chiama</a>' : '<span class="btn btn-ghost" aria-label="Numero telefonico da verificare">Telefono da verificare</span>') +
    (email ? '<a class="btn btn-ghost" href="mailto:' + esc(email) + '">Scrivi</a>' : '') +
    '<a class="btn btn-ghost" href="https://www.google.com/maps/search/?api=1&query=' + mapQuery + '" target="_blank" rel="noopener noreferrer">Indicazioni stradali</a>' +
    '</div>' + (address ? '<p>' + esc(address) + '</p>' : '<p class="contact-note">Indirizzo da verificare prima della pubblicazione definitiva.</p>') + '</section>';
  if (!out.includes('id="contatti"')) out = out.replace(/<footer\b/i, contactHtml + '\n<footer');
  out = out.replace(/href="\.\.\/\.\.\/assets\//g, 'href="/varese-sites/Template%203D/assets/');
  out = out.replace(/src="\.\.\/\.\.\/assets\//g, 'src="/varese-sites/Template%203D/assets/');
  out = out.replace(/href="\.\.\/assets\//g, 'href="/varese-sites/Template%203D/assets/');
  out = out.replace(/src="\.\.\/assets\//g, 'src="/varese-sites/Template%203D/assets/');
  return out;
}

const sitesDir = path.join(root, "sites");
const siteDirs = fs.readdirSync(sitesDir, { withFileTypes: true }).filter(d => d.isDirectory());
let done = 0;
for (const dir of siteDirs) {
  const file = path.join(sitesDir, dir.name, "index.html");
  if (!fs.existsSync(file)) continue;
  const old = fs.readFileSync(file, "utf8");
  const business = (attr(old, /<title[^>]*>([\s\S]*?)<\/title>/i).replace(/\s*[—–-]\s*concept web.*$/i, "").trim()) || dir.name.replace(/-/g, " ");
  const oldDesc = attr(old, /<meta\s+name=["']description["']\s+content=["']([^"']*)["']/i);
  const sector = pick(dir.name, business, oldDesc);
  const templateFile = path.join(builtExamples, sector.id, "index.html");
  if (!fs.existsSync(templateFile)) throw new Error("Missing built template: " + templateFile);
  const originalTemplate = fs.readFileSync(templateFile, "utf8");
  const templateDir = path.dirname(templateFile);
  const pageDir = path.dirname(file);
  for (const name of fs.readdirSync(templateDir)) {
    if (name !== "index.html") fs.cpSync(path.join(templateDir, name), path.join(pageDir, name), { recursive: true, force: true });
  }
  const links = getTextLinks(old);
  const phoneLink = links.find(x => /^tel:/i.test(x.href));
  const emailLink = links.find(x => /^mailto:/i.test(x.href));
  const phone = phoneLink ? phoneLink.href.replace(/^tel:/i, "") : "";
  const email = emailLink ? emailLink.href.replace(/^mailto:/i, "") : "";
  const address = (old.match(/(?:Via|Viale|Piazza|Corso|Largo)\s+[A-ZÀ-Ü][^<\n]{5,90}/i) || [])[0] || "";
  fs.writeFileSync(file, rewrite(originalTemplate, business, sector, phone, email, address));
  done++;
}
console.log("Replaced " + done + " business pages with customized, full-page 3D templates.");
