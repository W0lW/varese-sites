import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const builtExamples = path.join(root, "template 3D", "Dioramas", "dist", "examples");

const sectors = [
  // Regole ordinate: prima i settori specifici, poi le categorie più ampie.
  { id: "sucre", match: /pasticcer|patisserie|gelateri|panetter|panific|bakery|cake|cioccolat|confetter|dolce.?salato|cremeria/i, kind: "pasticceria", nav: ["Specialità", "Il laboratorio", "Contatti"], cta: "Chiedi informazioni", description: "Pasticceria e laboratorio dolciario: scopri le specialità e contatta l’attività per informazioni su prodotti e ordini." },
  { id: "nocturne", match: /parrucch|acconciatur|hair|barber|barbiere|estetic|beauty|nail|unghie|profumer|cosmetic|bellezza|fashion|sciampo|capelli|donna|sfumature|sensation|stile e bellezza/i, kind: "salone", nav: ["Servizi", "Il salone", "Prenotazioni"], cta: "Prenota un appuntamento", description: "Salone dedicato alla cura e allo stile: scopri i servizi e contatta l’attività per prenotare." },
  { id: "racer", match: /carrozzer|officina|gommist|pneumatic|autoricamb|autotecn|moto|torneria|meccanica|caroleo|masala|ghiturri|cfp/i, kind: "officina", nav: ["Servizi", "Lavorazioni", "Contatti"], cta: "Richiedi un intervento", description: "Officina e lavorazioni tecniche: scopri i servizi e contatta l’attività per informazioni o un appuntamento." },
  { id: "hangar", match: /impiant|elettric|termoidraul|idraulic|caldaia|climatizz|fotovoltaic|tecnic|automazion|domotic|sistemi|switch.?on|elbo/i, kind: "impianti", nav: ["Servizi", "Soluzioni", "Contatti"], cta: "Richiedi un sopralluogo", description: "Installazione e assistenza tecnica per impianti: contatta l’attività per informazioni o un sopralluogo." },
  { id: "monolith", match: /edil|costru|scav|serrament|cemento|pontegg|ristruttur|immobiliar|murator|cartongess|va.?edil|varedil|artedil/i, kind: "edilizia", nav: ["Servizi", "Realizzazioni", "Contatti"], cta: "Richiedi un preventivo", description: "Impresa e servizi per l’edilizia: scopri le lavorazioni e contatta l’attività per un preventivo." },
  { id: "florae", match: /giardin|fior|flor|vivaio|verde|piante|garden|paesagg|vivai/i, kind: "verde", nav: ["Servizi", "Realizzazioni", "Contatti"], cta: "Richiedi informazioni", description: "Cura del verde e degli spazi esterni: scopri i servizi e contatta l’attività per informazioni." },
  { id: "keeper", match: /puliz|clean|igien|sanific|multiserviz|facility/i, kind: "pulizie", nav: ["Servizi", "Metodo", "Contatti"], cta: "Richiedi un preventivo", description: "Servizi di pulizia e cura degli ambienti: contatta l’attività per informazioni e preventivi." },
  { id: "atlas", match: /trasport|noleggio|logistic|viagg|pontegg|magazzin|trasloc|spedizion/i, kind: "servizi", nav: ["Servizi", "Soluzioni", "Contatti"], cta: "Richiedi informazioni", description: "Servizi e soluzioni operative: contatta l’attività per informazioni, disponibilità e preventivi." },
  { id: "koen", match: /arred|legno|steelwood|mobili|falegnam|serramento|cucine|interior|casa.?srl/i, kind: "casa", nav: ["Soluzioni", "Progetti", "Contatti"], cta: "Parliamo del progetto", description: "Soluzioni per casa e ambienti: scopri le possibilità e contatta l’attività per parlare del tuo progetto." },
  { id: "gambit", match: /consulent|associat|studio|geom|commercialist|notai|avvocat|ingegner|architett|amministrazion|basaglia|morello|agenzia immobiliare/i, kind: "studio", nav: ["Competenze", "Attività", "Contatti"], cta: "Richiedi un appuntamento", description: "Studio professionale: scopri le competenze e contatta l’attività per un appuntamento informativo." },
  { id: "reliquary", match: /arte|restaur|antiqu|intagliator|cornic|tatuagg|artigian|ferro|accia|sald|resine|lavorazion/i, kind: "artigianato", nav: ["Lavorazioni", "Dettagli", "Contatti"], cta: "Richiedi informazioni", description: "Lavorazioni specialistiche e competenze artigianali: contatta l’attività per informazioni sul tuo progetto." },
  { id: "terrarium", match: /agricol|animali|veterinar|pet.?shop|florovivais|agriturism|biolog/i, kind: "natura", nav: ["Servizi", "Territorio", "Contatti"], cta: "Richiedi informazioni", description: "Servizi legati alla natura e al territorio: contatta l’attività per maggiori informazioni." },
  { id: "lowfreq", match: /bar|pub|cocktail|enoteca|birreria|ristorant|pizzeria|trattoria|osteria|sushi|caff[eè]|bistrot|lounge|discotec|musica|dj|eventi|club/i, kind: "ospitalità", nav: ["Esperienza", "Proposta", "Contatti"], cta: "Contatta l’attività", description: "Un luogo per incontrarsi e vivere una buona esperienza: consulta le informazioni e contatta l’attività." },
  { id: "velocity", match: /palestra|fitness|sport|karate|running|cicl|biciclett|atletica|yoga|pilates|danza|ballo|nuoto/i, kind: "sport", nav: ["Attività", "Percorsi", "Contatti"], cta: "Chiedi informazioni", description: "Attività sportive e percorsi di movimento: contatta l’attività per conoscere le proposte disponibili." },
  { id: "horologie", match: /orolog|gioiell|orefic|prezios|ottic|occhial|riparazione orologi/i, kind: "gioielli e precisione", nav: ["Collezione", "Lavorazioni", "Contatti"], cta: "Richiedi informazioni", description: "Una selezione di prodotti e lavorazioni di precisione: contatta l’attività per informazioni." },
  { id: "lithos", match: /dentist|dentale|medic|fisioterap|farmaci|laboratorio|ottic|salute|odontoiatr|clinica/i, kind: "servizi professionali", nav: ["Servizi", "Approccio", "Contatti"], cta: "Richiedi informazioni", description: "Informazioni sui servizi e sulle modalità di contatto dell’attività. I dettagli specifici vanno confermati con il professionista." },
  { id: "koi", match: /pescher|acquari|pesci|koi|laghetto|pesca/i, kind: "specialità", nav: ["Proposta", "Selezione", "Contatti"], cta: "Chiedi informazioni", description: "Scopri la proposta dell’attività e contattala per informazioni su disponibilità e servizi." },
  { id: "abyssal", match: /nautic|subacque|immersion|barca|marin|pesca sportiva/i, kind: "nautica", nav: ["Servizi", "Esperienze", "Contatti"], cta: "Richiedi informazioni", description: "Servizi ed esperienze legati all’acqua e alla nautica: contatta l’attività per dettagli e disponibilità." },
  { id: "pilot", match: /fotograf|video|grafica|design|comunicazion|marketing|web.?agency|stampa|tipograf|creativ|informatica|software/i, kind: "creativo e digitale", nav: ["Progetti", "Servizi", "Contatti"], cta: "Parliamo del progetto", description: "Un approccio progettuale per trasformare idee in risultati: contatta l’attività per raccontare il tuo progetto." },
  { id: "artemis", match: /hotel|albergo|b.?b\b|bed.?and.?breakfast|casa vacanze|affittacamere|resort|ospitalit|wedding|matrimon/i, kind: "ospitalità", nav: ["Esperienza", "Spazi", "Contatti"], cta: "Richiedi informazioni", description: "Informazioni per organizzare il soggiorno o l’esperienza: contatta direttamente l’attività per disponibilità e dettagli." },
  { id: "gambit", match: /assicurazion|finanz|caf|patronato|formazion|scuola|agenzia|servizi alle imprese/i, kind: "servizi professionali", nav: ["Servizi", "Competenze", "Contatti"], cta: "Richiedi informazioni", description: "Servizi professionali e supporto su misura: contatta l’attività per informazioni sulle competenze e sulle modalità di accesso." }
];
const fallback = { id: "gambit", kind: "attività professionale", nav: ["Servizi", "Attività", "Contatti"], cta: "Richiedi informazioni", description: "Scopri i servizi dell’attività e contattala per informazioni. Le informazioni specifiche vanno confermate direttamente con l’attività." };

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
    ["Abyssal", title], ["Artemis", title], ["Atlas", title], ["Ember", title], ["Florae", title], ["Gambit", title],
    ["Hangar", title], ["Horologie", title], ["Keeper", title], ["Kōen", title], ["Koi", title], ["Lithos", title],
    ["Low Frequency", title], ["Monolith", title], ["Pilot", title], ["Reliquary", title], ["Terrarium", title], ["Velocity", title],
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
  // Common interface copy translated so no demo is published with English controls.
  out = replaceAll(out, [
    ["Reserve a morning", "Prenota un appuntamento"], ["Reserve a seat", "Prenota"], ["Reserve a room", "Prenota"],
    ["Reserve", "Prenota"], ["Book an appointment", "Prenota un appuntamento"], ["Book now", "Prenota ora"],
    ["Since 1846", ""], ["Bonsai nursery", "Salone"], ["Adopt a tree", "Scopri i servizi"],
    ["Turn the year", "Scopri il salone"], ["Arrange a viewing", "Prenota una consulenza"],
    ["Come in any season. Come back in all four.", "Il tuo stile, in ogni stagione."],
    ["Trees looking for their next hundred years.", "Cura, stile e attenzione per ogni cliente."],
    ["The tree,", "Il tuo stile,"], ["undressed.", "senza compromessi."],
    ["Lighter than air.", "Leggerezza e precisione."], ["Storing the light.", "Valorizza il tuo look."],
    ["Sound", "Audio"], ["Sound off", "Disattiva audio"], ["Scroll to", "Scorri per"],
    ["Discover", "Scopri"], ["Explore", "Esplora"], ["Learn more", "Scopri di più"],
    ["Contact", "Contatti"], ["Services", "Servizi"], ["About", "Chi siamo"],
    ["The experience", "L’esperienza"], ["The details", "I dettagli"], ["Made to order", "Su misura"],
    ["Request an appointment", "Richiedi un appuntamento"], ["Request a commission", "Richiedi informazioni"],
    ["Visit", "Vieni a trovarci"], ["Shop", "Scopri i servizi"], ["Add to bag", "Prenota"],
    ["The notes", "I servizi"], ["The house", "Il salone"], ["Discovery set", "Prenotazioni"]
  ]);

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

  const mapQuery = encodeURIComponent(address ? address : business + " Varese");
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

// Contatti pubblici verificati online; gli altri dati vengono mantenuti solo se già presenti nella pagina sorgente.
const verifiedContacts = {
  "carpe-diem-parrucchieri": { phone: "3519908483", address: "Via Severo Piatti, 9, 21100 Varese (VA)" },
  "beauty-diffusion-snc": { phone: "0332223588", email: "deboracarcano79@gmail.com", address: "Via Daniele Manin, 30, 21100 Varese (VA)", website: "https://www.beautydiffusion.it" },
  "bergamo-srl": { phone: "0332262356", email: "andrea@bergamosrl.com", address: "Via Stromboli, 16, 21100 Varese (VA)" },
  "officina-caroleo": { phone: "0332333064", address: "Via Valle Venosta, 9, 21100 Varese (VA)" }
};

const sitesDir = path.join(root, "sites");
const siteDirs = fs.readdirSync(sitesDir, { withFileTypes: true }).filter(d => d.isDirectory());
let done = 0;
let contactSectionsAdded = 0;

// Keep the individually designed business pages intact. Replacing every page
// with a generic demo template erased business-specific layouts and could turn
// a hair salon into a perfume shop or a garden company into a bonsai nursery.
// This build step now only adds a consistent contact block where one is missing.
for (const dir of siteDirs) {
  const file = path.join(sitesDir, dir.name, "index.html");
  if (!fs.existsSync(file)) continue;
  let html = fs.readFileSync(file, "utf8");
  const titleText = (attr(html, /<title[^>]*>([\s\S]*?)<\/title>/i).replace(/\s*[—–-]\s*concept web.*$/i, "").trim()) || dir.name.replace(/-/g, " ");
  const links = getTextLinks(html);
  const discoveredPhone = (links.find(x => /^tel:/i.test(x.href)) || {}).href?.replace(/^tel:/i, "") || "";
  const discoveredEmail = (links.find(x => /^mailto:/i.test(x.href)) || {}).href?.replace(/^mailto:/i, "") || "";
  const discoveredAddress = (html.match(/(?:Via|Viale|Piazza|Corso|Largo|Strada|Viazza)\s+[A-ZÀ-Ü][^<\n]{5,90}/i) || [])[0] || "";
  const verified = verifiedContacts[dir.name] || {};
  const phone = verified.phone || discoveredPhone;
  const email = verified.email || discoveredEmail;
  const address = verified.address || discoveredAddress;

  if (!/id=["']contatti["']/i.test(html) && !/id=["']contacts["']/i.test(html)) {
    const mapLink = address
      ? '<a href="https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(address) + '" target="_blank" rel="noopener noreferrer">Indicazioni stradali</a>'
      : '';
    const actions = [
      phone ? '<a href="tel:' + esc(phone) + '">Chiama</a>' : '',
      email ? '<a href="mailto:' + esc(email) + '">Scrivi un’email</a>' : '',
      mapLink
    ].filter(Boolean).join(' ');
    const contact = '<section id="contatti" aria-labelledby="contatti-title" class="site-contact-check"><style>.site-contact-check{padding:clamp(28px,6vw,72px) max(22px,calc((100vw - 1120px)/2));margin:0;background:#111;color:#f5f2ec;border-top:1px solid #555}.site-contact-check h2{font-size:clamp(28px,4vw,48px);margin:0 0 12px}.site-contact-check p{max-width:680px;line-height:1.7}.site-contact-check .contact-actions{display:flex;flex-wrap:wrap;gap:12px;margin:22px 0}.site-contact-check a{display:inline-block;padding:12px 16px;border:1px solid currentColor;border-radius:3px;color:inherit;text-decoration:none}.site-contact-check .verify{opacity:.72;font-size:.9em}</style><p>CONTATTI</p><h2 id="contatti-title">Parliamone.</h2><p>Contatta direttamente ' + esc(titleText) + ' per informazioni sui servizi.</p><div class="contact-actions">' + actions + '</div>' + (address ? '<p>' + esc(address) + '</p>' : '<p class="verify">Indirizzo da verificare prima della pubblicazione definitiva.</p>') + ((!phone && !email) ? '<p class="verify">Telefono ed email non presenti nei dati disponibili: da verificare con l’attività.</p>' : '') + '</section>';
    html = /<footer\b/i.test(html) ? html.replace(/<footer\b/i, contact + '\n<footer') : html.replace(/<\/body>/i, contact + '\n</body>');
    contactSectionsAdded++;
  }
  // Normalize document language only when it is explicitly English; preserve
  // all original design assets, layouts, animations, and business copy.
  html = html.replace(/<html([^>]*?)lang=["']en["']/i, '<html$1lang="it"');
  fs.writeFileSync(file, html);
  done++;
}
console.log("Preserved " + done + " individually designed business pages; added " + contactSectionsAdded + " missing contact sections.");
