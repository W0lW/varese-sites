import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const builtExamples = path.join(root, "template 3D", "Dioramas", "examples");

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
  { id: "hangar", match: /informatica|elettronic|computer|telefonia|smartphone|assistenza pc|riparazione pc|riparazione smartphone/i, kind: "tecnologia e assistenza", nav: ["Servizi", "Riparazioni", "Contatti"], cta: "Richiedi assistenza", description: "Assistenza tecnologica e soluzioni per dispositivi: contatta l’attività per verificare servizi, tempi e disponibilità." },
  { id: "gambit", match: /fotograf|video|grafica|design|comunicazion|marketing|web.?agency|stampa|tipograf|creativ|software/i, kind: "creativo e digitale", nav: ["Progetti", "Servizi", "Contatti"], cta: "Parliamo del progetto", description: "Servizi creativi e digitali: racconta all’attività il tuo progetto e chiedi informazioni sulle soluzioni disponibili." },
  { id: "artemis", match: /hotel|albergo|b.?b\b|bed.?and.?breakfast|casa vacanze|affittacamere|resort|ospitalit|wedding|matrimon/i, kind: "ospitalità", nav: ["Esperienza", "Spazi", "Contatti"], cta: "Richiedi informazioni", description: "Informazioni per organizzare il soggiorno o l’esperienza: contatta direttamente l’attività per disponibilità e dettagli." },
  { id: "gambit", match: /assicurazion|finanz|caf|patronato|formazion|scuola|agenzia|servizi alle imprese/i, kind: "servizi professionali", nav: ["Servizi", "Competenze", "Contatti"], cta: "Richiedi informazioni", description: "Servizi professionali e supporto su misura: contatta l’attività per informazioni sulle competenze e sulle modalità di accesso." }
];
const fallback = { id: "gambit", kind: "attività professionale", nav: ["Servizi", "Attività", "Contatti"], cta: "Richiedi informazioni", description: "Scopri i servizi dell’attività e contattala per informazioni. Le informazioni specifiche vanno confermate direttamente con l’attività." };

function unescapeHtml(s) {
  return String(s || "").replace(/&amp;/gi, "&").replace(/&lt;/gi, "<").replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"').replace(/&#39;|&apos;/gi, "'").replace(/&nbsp;/gi, " ")
    .replace(/&#(\\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)));
}
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
function generatedDescription(business, sector, context = "") {
  const hay = (business + " " + context).toLocaleLowerCase("it");
  if (sector.kind === "ospitalità") {
    if (/pizzer|ristorant|trattoria|osteria|sushi|piadiner|ristoro|cucina/.test(hay)) {
      return business + " è un indirizzo da scoprire per una pausa a tavola. Contatta il locale per conoscere la proposta, verificare gli orari e chiedere informazioni sulle prenotazioni.";
    }
    return business + " è un punto d’incontro per una pausa, un aperitivo o una serata in compagnia. Contatta il locale per verificare orari, proposta e disponibilità.";
  }
  if (sector.kind === "salone") return business + " è uno spazio dedicato alla cura personale e allo stile. Contatta il salone per conoscere i servizi disponibili e concordare un appuntamento.";
  if (sector.kind === "officina") return business + " è un riferimento per informazioni su manutenzione e interventi per il tuo veicolo. Contatta l’attività per descrivere il problema e verificare disponibilità e tempi.";
  if (sector.kind === "tecnologia e assistenza") return business + " offre un punto di contatto per informazioni su dispositivi e assistenza tecnologica. Contatta l’attività per verificare servizi, tempi e disponibilità.";
  if (sector.kind === "pasticceria") return business + " propone un’attività legata alla pasticceria e ai prodotti da forno. Contatta il laboratorio per conoscere le specialità disponibili e chiedere informazioni sugli ordini.";
  if (sector.kind === "sport") return business + " è un punto di riferimento per conoscere attività e percorsi sportivi. Contatta la struttura per ricevere dettagli su corsi, accessi e disponibilità.";
  if (sector.kind === "edilizia") return business + " si occupa di servizi per l’edilizia e lavori su progetto. Contatta l’attività per descrivere l’intervento e richiedere informazioni o un preventivo.";
  return business + ": " + sector.description;
}
function rewrite(html, business, sector, phone, email, address, context = "") {
  const title = esc(business);
  let out = html.replace(/<html lang="en">/i, '<html lang="it">');
  out = out.replace(/<title>[\s\S]*?<\/title>/i, '<title>' + title + ' — ' + sector.kind + '</title>');
  const businessDescription = generatedDescription(business, sector, context);
  out = out.replace(/<meta name="description" content="[^"]*">/i, '<meta name="description" content="' + esc(businessDescription) + '">');
  // Replace the visible hero headline and lead with business-specific Italian copy,
  // while keeping the template's 3D scene, layout, animation and interaction code.
  out = out.replace(/(<h1\b[^>]*>)[\s\S]*?(<\/h1>)/i, '$1' + title + '$2');
  out = out.replace(/(<p\b[^>]*class=["'][^"']*\b(?:sub|lead|lede)\b[^"']*["'][^>]*>)[\s\S]*?(<\/p>)/i, '$1' + esc(businessDescription) + '$2');

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
  // Replace fragrance-product labels with terms that fit the business sector in every template.
  const featureLabels = sector.kind === "salone" ? ["Taglio", "Colore", "Trattamenti", "Styling"]
    : sector.kind === "ospitalità" ? ["Cucina", "Accoglienza", "Atmosfera", "Proposta"]
    : sector.kind === "pasticceria" ? ["Pasticceria", "Dolci", "Laboratorio", "Ordini"]
    : sector.kind === "officina" ? ["Manutenzione", "Diagnosi", "Riparazioni", "Assistenza"]
    : sector.kind === "impianti" ? ["Installazione", "Manutenzione", "Assistenza", "Impianti"]
    : sector.kind === "edilizia" ? ["Progettazione", "Ristrutturazioni", "Lavorazioni", "Finiture"]
    : [sector.nav[0], sector.nav[1], "Servizi", "Informazioni"];
  out = replaceAll(out, [
    ["Bergamot", featureLabels[0]], ["bergamot", featureLabels[0].toLowerCase()],
    ["Iris", featureLabels[1]], ["iris", featureLabels[1].toLowerCase()],
    ["Vanilla", featureLabels[2]], ["vanilla", featureLabels[2].toLowerCase()],
    ["Oud", featureLabels[3]], ["oud", featureLabels[3].toLowerCase()],
    ["No phones on the counter.", "Contatta l’attività per informazioni e disponibilità."],
    ["No phones on the counter", "Informazioni e disponibilità"],
    ["Drop the needle", sector.nav[0]], ["Put your hand on the record", sector.nav[0]],
    ["lunar", ""], ["moon resort", ""], ["vinyl records", ""],
    ["50 ml — €290", sector.cta], ["Add to bag — €290", sector.cta],
    ["No. 9 Extrait, 50 ml", title], ["iris, bergamot, vanilla, oud.", sector.description]
  ]);
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

  if (sector.kind === "ospitalità") {
    out = replaceAll(out, [
      ["Listening bar &amp; record label · Shimokitazawa, Tokyo", "Locale · Bar e ristorazione"],
      ["Listening bar & record label · Shimokitazawa, Tokyo", "Locale · Bar e ristorazione"],
      ["This week’s pressing", "La proposta del locale"], ["This week's pressing", "La proposta del locale"],
      ["The bar", "Il locale"], ["Catalogue", "La proposta"], ["Record club", "Eventi e contatti"],
      ["Pressing", "La proposta"], ["Pre-order the LP", "Chiedi informazioni"],
      ["Aubergine Hours", business], ["Kazu Nomura &amp; The Late Room", "La proposta del locale"],
      ["Kazu Nomura & The Late Room", "La proposta del locale"],
      ["Tidal Room", "Un momento da condividere"], ["Counter Culture", "Il gusto di stare insieme"],
      ["Shimokita Rain", "La tua prossima visita"], ["vinyl", "proposta"], ["records", "momenti"],
      ["record label", "locale"], ["turntable", "atmosfera"], ["the needle", "locale"],
      ["The room", "Il locale"], ["the room", "il locale"], ["House rule", "Informazioni"],
      ["Hours", "Orari da confermare"], ["Seats", "Accoglienza"], ["Requests", "Richieste"],
      ["No phones on the counter.", "Contatta il locale per informazioni e disponibilità."],
      ["12 seats", "Accoglienza"], ["4,800 records on the wall", "Una proposta da scoprire"],
      ["turntable", "atmosfera"], ["playlists", "esperienze"],
      ["Put your hand on the record", business], ["Drop the needle", "Scopri il locale"],
      ["Pressed for the room first.", "La proposta del locale."],
      ["Recorded in a single night at the bar after close, with the room mics still up. Nomura plays the house Rhodes; the rhythm section plays the counter. Pick a band — the arm will find it.", sector.description],
      ["Every release on the label is played here before it is cut. If it can’t hold twelve strangers quiet for a whole side, it doesn’t get a number.", sector.description],
      ["Each cue is sixteen bars, synthesised in your browser the moment you press it. Nothing is streamed; nothing is sampled.", sector.description]
    ]);
    // Keep the original animated scene, but remove fictional record tracks, vinyl stock and prices.
    out = out.replace(/<\/head>/i, '<style>.pressing .tracks,.pressing .buy,.catalogue .sleeves{display:none!important}</style>\n</head>');
  } else if (sector.kind === "salone") {
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

// Use the corrected manifest as the source of truth for names, location, sector and template.
const manifestRecords = new Map();
const manifestPath = path.join(root, "varese_sites_missing_manifest.json");
if (fs.existsSync(manifestPath)) {
  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  for (const item of manifest) {
    if (item.slug) manifestRecords.set(item.slug, item);
  }
}

const sitesDir = path.join(root, "sites");
const siteDirs = fs.readdirSync(sitesDir, { withFileTypes: true }).filter(d => d.isDirectory());
let done = 0;
let contactSectionsAdded = 0;

// Apply the actual interactive 3D template to each business page.
// The previous implementation preserved the static HTML concepts and merely linked to a demo;
// that was not a real template integration. Each output page now starts from the built template.
let failures = [];
for (const dir of siteDirs) {
  const file = path.join(sitesDir, dir.name, "index.html");
  if (!fs.existsSync(file)) continue;
  const oldHtml = fs.readFileSync(file, "utf8");
  const record = manifestRecords.get(dir.name) || {};
  const rawTitle = attr(oldHtml, /<title[^>]*>([\s\S]*?)<\/title>/i).replace(/<[^>]+>/g, "").trim();
  const titleText = unescapeHtml(record.nome || rawTitle.replace(/\s*[—–-]\s*(?:Varese|[A-ZÀ-Ü][a-zà-ü]+)(?:\s*[—–-]\s*.*)?$/i, "").replace(/\s*[—–-]\s*concept web.*$/i, "").trim() || dir.name.replace(/-/g, " "));
  const description = attr(oldHtml, /<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)["']/i);
  const eyebrow = (oldHtml.match(/class=["'][^"']*eyebrow[^"']*["'][^>]*>([\s\S]*?)<\/[^>]+>/i) || [])[1] || "";
  const manifestSector = String(record.settore || "");
  const sectorText = manifestSector + " " + (oldHtml.match(/<h1[^>]*>[\s\S]*?<\/h1>/i) || [""])[0] + " " + eyebrow + " " + description;
  const sector = { ...pick(dir.name, titleText, sectorText) };
  // Keep sector-appropriate Italian copy, but use the audited 3D concept for this exact business.
  const auditedTemplateId = record.template_id_3d || "";
  if (auditedTemplateId && /^[a-z0-9-]+$/.test(auditedTemplateId)) sector.id = auditedTemplateId;
  const links = getTextLinks(oldHtml);
  const discoveredPhone = (links.find(x => /^tel:/i.test(x.href)) || {}).href?.replace(/^tel:/i, "") || "";
  const discoveredEmail = (links.find(x => /^mailto:/i.test(x.href)) || {}).href?.replace(/^mailto:/i, "") || "";
  const discoveredAddress = (oldHtml.match(/(?:Via|Viale|Piazza|P.zza|Corso|Largo|Strada|Vicolo|Piazzale)\s+[^<\n]{4,100}/i) || [])[0] || "";
  const verified = verifiedContacts[dir.name] || {};
  const phone = verified.phone || record.telefono || discoveredPhone;
  const email = verified.email || record.email || discoveredEmail;
  const address = verified.address || record.indirizzo || discoveredAddress;
  const templatePath = path.join(builtExamples, sector.id, "index.html");
  if (!fs.existsSync(templatePath)) {
    failures.push(dir.name + " -> template mancante: " + sector.id);
    continue;
  }
  const templateHtml = fs.readFileSync(templatePath, "utf8");
  let html = rewrite(templateHtml, titleText, sector, phone, email, address, sectorText);
  // Remove any old preview-link remnants if a template contained them.
  html = html.replace(/<section[^>]*class=["'][^"']*template-preview[^"']*["'][^>]*>[\s\S]*?<\/section>/gi, "");
  html = html.replace(/<html([^>]*?)lang=["']en["']/i, '<html$1lang="it"');
  html = html.replace(/<html(?![^>]*\blang=)/i, '<html lang="it"');
  // Keep the actual chosen template identifiable for the catalog and audits.
  html = html.replace(/<html([^>]*)>/i, (m, attrs) => '<html' + attrs.replace(/\sdata-template-3d=["'][^"']*["']/i, "") + ' data-template-3d="' + sector.id + '">');
  fs.writeFileSync(file, html);
  done++;
}
if (failures.length) {
  console.error("Template integration failures: " + failures.slice(0, 30).join("; "));
  if (failures.length > 30) console.error("... and " + (failures.length - 30) + " more");
  throw new Error(failures.length + " business pages could not be integrated with their 3D template");
}
console.log("Applied real interactive 3D templates to " + done + " business pages; no static preview-link pages retained.");
