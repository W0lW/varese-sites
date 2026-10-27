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
  { id: "lowfreq", match: /bar\b|pub\b|cocktail|enoteca|birreria|ristorant|pizzeria|trattoria|osteria|sushi|caff[eè]|bistrot|lounge|discotec|musica|dj\b|eventi|club\b/i, kind: "ospitalità", nav: ["Esperienza", "Proposta", "Contatti"], cta: "Contatta l’attività", description: "Un luogo per incontrarsi e vivere una buona esperienza: consulta le informazioni e contatta l’attività." },
  { id: "velocity", match: /palestra|fitness|sport|karate|running|cicl|biciclett|atletica|yoga|pilates|danza|ballo|nuoto/i, kind: "sport", nav: ["Attività", "Percorsi", "Contatti"], cta: "Chiedi informazioni", description: "Attività sportive e percorsi di movimento: contatta l’attività per conoscere le proposte disponibili." },
  { id: "horologie", match: /orolog|gioiell|orefic|prezios|ottic|occhial|riparazione orologi/i, kind: "gioielli e precisione", nav: ["Collezione", "Lavorazioni", "Contatti"], cta: "Richiedi informazioni", description: "Una selezione di prodotti e lavorazioni di precisione: contatta l’attività per informazioni." },
  { id: "lithos", match: /dentist|dentale|medic|fisioterap|farmaci|laboratorio|ottic|salute|odontoiatr|clinica/i, kind: "servizi professionali", nav: ["Servizi", "Approccio", "Contatti"], cta: "Richiedi informazioni", description: "Informazioni sui servizi e sulle modalità di contatto dell’attività. I dettagli specifici vanno confermati con il professionista." },
  { id: "koi", match: /pescher|acquari|pesci|koi|laghetto|pesca/i, kind: "specialità", nav: ["Proposta", "Selezione", "Contatti"], cta: "Chiedi informazioni", description: "Scopri la proposta dell’attività e contattala per informazioni su disponibilità e servizi." },
  { id: "abyssal", match: /nautic|subacque|immersion|barca|marin|pesca sportiva/i, kind: "nautica", nav: ["Servizi", "Esperienze", "Contatti"], cta: "Richiedi informazioni", description: "Servizi ed esperienze legati all’acqua e alla nautica: contatta l’attività per dettagli e disponibilità." },
  { id: "hangar", match: /informatica|elettronic|computer|telefonia|smartphone|assistenza pc|riparazione pc|riparazione smartphone/i, kind: "tecnologia e assistenza", nav: ["Servizi", "Riparazioni", "Contatti"], cta: "Richiedi assistenza", description: "Assistenza tecnologica e soluzioni per dispositivi: contatta l’attività per verificare servizi, tempi e disponibilità." },
  { id: "gambit", match: /fotograf|video|grafica|design|comunicazion|marketing|web.?agency|stampa|tipograf|creativ|software/i, kind: "creativo e digitale", nav: ["Progetti", "Servizi", "Contatti"], cta: "Parliamo del progetto", description: "Servizi creativi e digitali: racconta all’attività il tuo progetto e chiedi informazioni sulle soluzioni disponibili." },
  { id: "artemis", match: /hotel|albergo|b.?b\b|bed.?and.?breakfast|casa vacanze|affittacamere|resort|ospitalit|wedding|matrimon/i, kind: "ospitalità", nav: ["Esperienza", "Spazi", "Contatti"], cta: "Richiedi informazioni", description: "Informazioni per organizzare il soggiorno o l’esperienza: contatta direttamente l’attività per disponibilità e dettagli." },
  { id: "gambit", match: /assicurazion|finanz|caf\b|patronato|formazion|scuola|agenzia|servizi alle imprese/i, kind: "servizi professionali", nav: ["Servizi", "Competenze", "Contatti"], cta: "Richiedi informazioni", description: "Servizi professionali e supporto su misura: contatta l’attività per informazioni sulle competenze e sulle modalità di accesso." }
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
function parseCsv(text) {
  const rows = []; let row = [], cell = "", quoted = false;
  const input = String(text || "").replace(/^\uFEFF/, "");
  for (let i = 0; i < input.length; i++) {
    const ch = input[i];
    if (quoted) {
      if (ch === '"' && input[i + 1] === '"') { cell += '"'; i++; }
      else if (ch === '"') quoted = false;
      else cell += ch;
    } else if (ch === '"' && cell === "") quoted = true;
    else if (ch === ",") { row.push(cell); cell = ""; }
    else if (ch === "\n") { row.push(cell.replace(/\r$/, "")); rows.push(row); row = []; cell = ""; }
    else cell += ch;
  }
  if (cell.length || row.length) { row.push(cell.replace(/\r$/, "")); rows.push(row); }
  const headers = (rows.shift() || []).map(x => x.trim());
  return rows.filter(r => r.some(v => v.trim())).map(r => Object.fromEntries(headers.map((h, i) => [h, r[i] || ""])));
}
function removeSectionById(html, id) {
  const openTagRe = /<section\b[^>]*>/gi;
  let open, start = -1;
  const idRe = new RegExp("\\bid=[\\\"']" + id + "[\\\"']", "i");
  while ((open = openTagRe.exec(html))) {
    if (idRe.test(open[0])) { start = open.index; break; }
  }
  if (start < 0) return html;
  const tokenRe = /<\/?section\b[^>]*>/gi;
  tokenRe.lastIndex = start;
  let depth = 0, token;
  while ((token = tokenRe.exec(html))) {
    if (/^<\s*section\b/i.test(token[0])) depth++;
    else depth--;
    if (depth === 0) return html.slice(0, start) + html.slice(tokenRe.lastIndex);
  }
  return html;
}
function getTextLinks(html) {
  return [...html.matchAll(/<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi)].map(m => ({ href: m[1], text: m[2].replace(/<[^>]+>/g, "").trim() }));
}
function pick(slug, title, desc, manifestSector = "") {
  const category = String(manifestSector || "").toLocaleLowerCase("it");
  // Trust the manifest's sector before fuzzy matching names: e.g. "restaurant" contains "restaur"
  // and must not be misclassified as a restoration/craft business.
  const explicitRules = [
    { match: /pasticcer|patisserie|gelateri|panetter|panific|bakery|cake|cioccolat|confetter|dolce.?salato/, id: "sucre" },
    { match: /parrucch|acconciatur|barbiere|barber|centro estetico|estetica|nail|unghie|profumer|capelli/, id: "nocturne" },
    { match: /carrozzer|officina|gommist|pneumatic|autoricamb|autotecn|meccanica|riparazione auto|moto/, id: "racer" },
    { match: /impiant|elettric|termoidraul|idraulic|caldaia|climatizz|fotovoltaic|domotic/, id: "hangar" },
    { match: /edilizia|impresa edile|costruzion|scav|serrament|ristruttur|murator|cartongess/, id: "monolith" },
    { match: /puliz|igien|sanific|multiserviz|facility/, id: "keeper" },
    { match: /giardin|fiorista|fioraio|vivaio|verde|piante|garden|paesagg/, id: "florae" },
    { match: /bar, cocktail|cocktail bar|ristorant|pizzer|trattoria|osteria|enoteca|birreria|pub|sushi|piadiner|caff[eè]|bistrot|lounge|discotec|ristoro/, id: "lowfreq" },
    { match: /hotel|albergo|bed.?and.?breakfast|casa vacanze|affittacamere|resort|ospitalit/, id: "artemis" },
    { match: /consulent|studio professionale|commercialist|notai|avvocat|ingegner|architett|amministrazion|assicurazion|finanz|agenzia immobiliare/, id: "gambit" },
    { match: /gioiell|orefic|preziosi|orolog|ottic|occhial|dentist|dentale|medic|fisioterap|farmaci|salute|odontoiatr|clinica/, id: "lithos" },
    { match: /agricol|animali|veterinar|pet.?shop|agriturism|biolog/, id: "terrarium" },
    { match: /trasport|noleggio|logistic|viagg|magazzin|trasloc|spedizion/, id: "atlas" },
    { match: /legno|falegnam|arred|mobili|cucine|interior/, id: "koen" },
    { match: /arte|restaur|antiqu|intagliator|cornic|tatuagg|artigian|ferro|accia|sald|resine|lavorazion/, id: "reliquary" }
  ];
  for (const rule of explicitRules) {
    if (rule.match.test(category)) {
      const chosen = sectors.find(x => x.id === rule.id);
      if (chosen) return chosen;
    }
  }
  const hay = slug + " " + title + " " + desc;
  return sectors.find(x => x.match.test(hay)) || fallback;
}
function replaceAll(html, pairs) {
  for (const [from, to] of pairs) html = html.split(from).join(to);
  return html;
}
function generatedDescription(business, sector, context = "", slug = "", municipality = "") {
  const hay = (business + " " + context).toLocaleLowerCase("it");
  const variants = {
    ospitalità: [
      `${business}: il posto giusto per staccare dalla routine, incontrarsi e godersi il momento. Scrivi o chiama per conoscere la proposta aggiornata e verificare gli orari.`,
      `Una pausa veloce o una serata senza fretta? ${business} è da scoprire dal vivo. Contatta il locale per menu, eventi e disponibilità, senza affidarti a informazioni non confermate.`,
      `A fare la differenza sono l’atmosfera e le persone con cui la condividi. Per ${business}, chiedi direttamente dettagli su aperitivi, servizio e iniziative in programma.`,
      `Per un caffè, un aperitivo o un’occasione da condividere, ${business} è un indirizzo da tenere presente. Contatta il locale per organizzare la visita.`,
      `Il prossimo momento da ricordare può iniziare da qui: scopri ${business} e chiedi informazioni aggiornate su proposta, orari e prenotazioni.`
    ],
    salone: [
      `${business}: uno spazio in cui valorizzare il tuo stile, con attenzione ai dettagli e alla persona. Contatta il salone per servizi e appuntamenti.`,
      `Un nuovo taglio, un colore diverso o semplicemente un momento per te: chiedi a ${business} quali servizi sono disponibili e prenota direttamente.`,
      `Lo stile si costruisce nei dettagli. Parla con ${business} per capire quali trattamenti e soluzioni sono adatti alle tue esigenze.`,
      `Dai forma alla prossima idea per i tuoi capelli: contatta ${business}, verifica i servizi offerti e concorda un appuntamento.`,
      `${business} è il punto di partenza per prenderti cura del tuo look. Scrivi o chiama per informazioni e disponibilità.`
    ],
    pasticceria: [
      `Profumi di forno, voglia di qualcosa di buono e occasioni da festeggiare: contatta ${business} per scoprire le specialità del laboratorio e gli ordini disponibili.`,
      `Per una colazione speciale, un dolce da condividere o una ricorrenza, chiedi a ${business} quali prodotti e preparazioni sono disponibili.`,
      `${business} porta al centro il piacere dei prodotti da forno e della pasticceria. Contatta il laboratorio per assortimento, prenotazioni e richieste su misura.`,
      `Ogni occasione merita il suo dolce: parla con ${business} per conoscere la proposta del giorno e organizzare eventuali ordini.`,
      `Cerchi qualcosa di buono da portare in tavola? Scopri la proposta di ${business} e verifica direttamente disponibilità e specialità.`
    ],
    officina: [
      `Un rumore insolito o la manutenzione da programmare? Descrivi l’esigenza a ${business} e chiedi informazioni su interventi, tempi e disponibilità.`,
      `${business} è un contatto da cui partire per prenderti cura del veicolo. Spiega il problema e richiedi indicazioni sul servizio più adatto.`,
      `Dalla verifica del problema al prossimo intervento, il primo passo è un confronto chiaro: contatta ${business} per informazioni e appuntamenti.`,
      `Per manutenzione e riparazioni, racconta a ${business} cosa ti serve e chiedi una valutazione prima di fissare l’intervento.`,
      `Il veicolo ha bisogno di attenzione? Contatta ${business} per conoscere le lavorazioni disponibili e concordare quando passare.`
    ],
    sport: [
      `Trova il tuo ritmo e scegli il prossimo obiettivo: contatta ${business} per conoscere attività, corsi e modalità di accesso.`,
      `Che tu voglia iniziare o migliorare, chiedi a ${business} quali percorsi e attività sono attualmente disponibili.`,
      `Il prossimo traguardo comincia con una domanda: parla con ${business} per informazioni su allenamenti, lezioni e iscrizioni.`,
      `${business} può essere il punto di partenza per rimetterti in movimento. Verifica direttamente attività, orari e disponibilità.`,
      `Più movimento, un obiettivo alla volta: contatta ${business} per capire quale proposta è adatta alle tue esigenze.`
    ],
    edilizia: [
      `Ogni intervento parte da un’esigenza concreta. Descrivi il tuo progetto a ${business} e chiedi informazioni su lavorazioni e preventivi.`,
      `Dall’idea al cantiere, chiarire obiettivi e vincoli è il primo passo: contatta ${business} per valutare il lavoro da realizzare.`,
      `${business}: racconta il progetto, condividi le necessità e richiedi un confronto sulle lavorazioni possibili.`,
      `Per una ristrutturazione o un lavoro da pianificare, chiedi a ${business} informazioni e una valutazione dell’intervento.`,
      `Hai un progetto da mettere a terra? Contatta ${business} per parlare delle esigenze, dei tempi e del preventivo.`
    ],
    default: [
      `Dietro ogni esigenza c’è una soluzione da valutare. Racconta a ${business} cosa ti serve e chiedi informazioni sui servizi disponibili.`,
      `Il modo migliore per iniziare è un confronto diretto: contatta ${business}, spiega il tuo obiettivo e verifica le opzioni possibili.`,
      `${business}: un punto di partenza per dare forma alla tua richiesta. Scrivi o chiama per chiarire servizi, modalità e disponibilità.`,
      `Hai una richiesta specifica? Parla con ${business} per ricevere informazioni pertinenti e capire come procedere.`,
      `Ogni progetto ha esigenze diverse. Contatta ${business} per descrivere la tua situazione e approfondire i servizi offerti.`
    ]
  };
  const pool = /pizzer|ristorant|trattoria|osteria|sushi|piadiner|ristoro|cucina/.test(hay)
    ? [
      `A tavola, ogni dettaglio contribuisce all’esperienza. Contatta ${business} per conoscere menu, orari e modalità di prenotazione.`,
      `Per una pausa pranzo o una cena da condividere, chiedi a ${business} la proposta aggiornata e verifica la disponibilità dei tavoli.`,
      `La prossima occasione per stare a tavola comincia da qui: scopri ${business} e chiedi direttamente informazioni su cucina e prenotazioni.`,
      `${business} è un indirizzo da valutare per il tuo prossimo momento a tavola. Menu e disponibilità vanno confermati direttamente con il locale.`
    ] : (variants[sector.kind] || variants.default);
  let hash = 0;
  for (const char of (slug || business)) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  const curatedCopy = {
    "barber-garage": "Taglio uomo e cura della barba in un barbershop dal carattere industriale. Barber Garage si trova in via Giacomo Matteotti 13, Busto Arsizio: chiama per concordare un appuntamento e confermare i servizi disponibili."
  };
  const chosen = curatedCopy[slug] || pool[hash % pool.length];
  const place = String(municipality || "").trim();
  const localClosers = [
    place ? "A " + place + ", contatta direttamente " + business + " per confermare servizi e disponibilità." : "Contatta direttamente " + business + " per confermare servizi e disponibilità.",
    place ? "Per chi cerca questo servizio a " + place + ", verifica i dettagli direttamente con " + business + "." : "Verifica i dettagli direttamente con " + business + ".",
    place ? "Prima di organizzare la visita a " + business + ", a " + place + ", chiedi conferma di orari e modalità." : "Prima della visita, chiedi conferma di orari e modalità direttamente a " + business + ".",
    place ? "Se ti trovi a " + place + ", usa i contatti di " + business + " per chiarire la richiesta e concordare i prossimi passi." : "Usa i contatti di " + business + " per chiarire la richiesta e concordare i prossimi passi.",
    place ? "Per informazioni aggiornate su " + business + " a " + place + ", fai riferimento ai contatti riportati in questa pagina." : "Per informazioni aggiornate, fai riferimento ai contatti riportati in questa pagina."
  ];
  return chosen + " " + localClosers[hash % localClosers.length];
}
function rewrite(html, business, sector, phone, email, address, context = "", municipality = "", phoneCandidate = "", emailCandidate = "") {
  const title = esc(business);
  let out = html.replace(/<html lang="en">/i, '<html lang="it">');
  out = out.replace(/<title>[\s\S]*?<\/title>/i, '<title>' + title + ' — ' + sector.kind + '</title>');
  // Replace the template's split/marked brand wordmark too (e.g. "Maison <em>Sucre</em>").
  out = out.replace(/<([a-z]+)\b([^>]*\bclass=["'][^"']*\bbrand-name\b[^"']*["'][^>]*)>[\s\S]*?<\/\1>/i,
    (_, tag, attrs) => '<' + tag + attrs + '>' + title + '</' + tag + '>');
  const businessDescription = generatedDescription(business, sector, context, business.toLocaleLowerCase('it').replace(/[^a-z0-9]+/g, '-'), municipality);
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
  // Template navigation labels can sit outside removable demo sections; translate them globally.
  out = out.replace(/\bRecord club\b/gi, sector.nav[2]);
  out = out.replace(/\bThe bar\b/gi, sector.nav[1]);
  out = out.replace(/The\s*<em>\s*bar\s*<\/em>/gi, sector.nav[1]);
  out = out.replace(/the\s*<em>\s*bar\s*<\/em>/gi, sector.nav[1]);
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
    ["Sound off", "Audio disattivato"], ["Sound on", "Audio attivo"], ["Sound", "Audio"], ["Audio off", "Audio disattivato"], ["Scroll to", "Scorri per"],
    ["Discover", "Scopri"], ["Explore", "Esplora"], ["Learn more", "Scopri di più"], ["Subscribe", "Contatti"], ["Newsletter", "Aggiornamenti"],
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

  // Normalize every remaining visible section, not only the first hero paragraph.
  // Template demo stories often live in repeated .lede/.byline elements or styled headings.
  const detailCopy = sector.kind === "ospitalità"
    ? [
      "Per menu, eventi e iniziative, chiedi direttamente al locale: le informazioni possono cambiare.",
      "Vuoi organizzare una visita o una serata? Contatta il locale e verifica in anticipo orari e disponibilità.",
      "La proposta aggiornata e gli eventuali servizi su prenotazione vanno confermati direttamente con l’attività.",
      "Per occasioni speciali o richieste specifiche, parla con il personale prima della visita."
    ]
    : [
      "Contatta direttamente l’attività per verificare servizi, modalità e disponibilità aggiornate.",
      "Ogni richiesta può avere esigenze diverse: descrivi la tua e chiedi un confronto prima di procedere.",
      "Per dettagli pratici, tempi o appuntamenti, usa i riferimenti presenti nella sezione contatti.",
      "Le informazioni specifiche vanno confermate con l’attività prima di prendere accordi."
    ];
  let detailIndex = 0;
  out = out.replace(/<p\b([^>]*\bclass=["'][^"']*\b(?:sub|lead|lede|byline|fine)\b[^"']*["'][^>]*)>[\s\S]*?<\/p>/gi,
    (_, attrs) => {
      const copy = detailIndex++ === 0 ? businessDescription : detailCopy[(detailIndex - 2) % detailCopy.length];
      return '<p' + attrs + '>' + esc(copy) + '</p>';
    });
  // Decorative Japanese copy and demo-specific secondary headings are not business content.
  out = out.replace(/<(p|span|div)\b([^>]*\bclass=["'][^"']*\bjp\b[^"']*["'][^>]*)>[\s\S]*?<\/\1>/gi, '');
  let h2Index = 0;
  out = out.replace(/<h2\b([^>]*)>[\s\S]*?<\/h2>/gi, (_, attrs) =>
    '<h2' + attrs + '>' + esc(sector.nav[h2Index++ % sector.nav.length]) + '</h2>');
  let h3Index = 0;
  out = out.replace(/<h3\b([^>]*)>[\s\S]*?<\/h3>/gi, (_, attrs) =>
    '<h3' + attrs + '>' + esc(sector.nav[h3Index++ % sector.nav.length]) + '</h3>');

  // Remove product pricing/cart affordances from the original demo and add real business actions.
  out = out.replace(/<span class="bag"[^>]*>[\s\S]*?<\/span>/gi, '');
  out = out.replace(/<button class="btn [^"]* add"[^>]*>[\s\S]*?<\/button>/gi, '');
  out = out.replace(/<a class="btn btn-solid" href="#shop"[^>]*>[\s\S]*?<\/a>/i, '<a class="btn btn-solid" href="#contatti" data-magnetic>' + esc(sector.cta) + '</a>');
  out = out.replace(/<a class="btn btn-ghost" href="#shop"[^>]*>[\s\S]*?<\/a>/i, '<a class="btn btn-ghost" href="#contatti" data-magnetic>' + esc(sector.cta) + '</a>');
  out = out.replace(/<a class="btn btn-text" href="#bergamot"[^>]*>[\s\S]*?<\/a>/i, '<a class="btn btn-text" href="#contatti">' + esc(sector.nav[2]) + '</a>');

  const mapQuery = encodeURIComponent(address || (business + (municipality ? " " + municipality : "")));
  const contactHtml = '<section class="note" id="contatti" data-stop="7" data-side="left"><p class="eyebrow">Contatti</p><h2>Parliamo <em>con te.</em></h2><p>' + esc(sector.description) + '</p><div class="actions">' +
    (phone ? '<a class="btn btn-solid" href="tel:' + esc(String(phone).split(/[;|]/)[0].replace(/[^0-9+]/g, "")) + '">Chiama ' + esc(phone) + '</a>' :
      phoneCandidate ? '<a class="btn btn-solid" href="tel:' + esc(String(phoneCandidate).split(/[;|]/)[0].replace(/[^0-9+]/g, "")) + '">Numero da verificare: ' + esc(phoneCandidate) + '</a>' :
      '<span class="btn btn-ghost" aria-label="Numero telefonico non disponibile nei dati verificati">Numero non disponibile</span>') +
    (email ? '<a class="btn btn-ghost" href="mailto:' + esc(email) + '">Scrivi ' + esc(email) + '</a>' :
      emailCandidate ? '<a class="btn btn-ghost" href="mailto:' + esc(emailCandidate) + '">Email da verificare: ' + esc(emailCandidate) + '</a>' : '') +
    '<a class="btn btn-ghost" href="https://www.google.com/maps/search/?api=1&query=' + mapQuery + '" target="_blank" rel="noopener noreferrer">Indicazioni stradali</a>' +
    '</div>' + (address ? '<p>' + esc(address) + '</p>' : '<p class="contact-note">Indirizzo da verificare prima della pubblicazione definitiva.</p>') +
    ((!phone && phoneCandidate) || (!email && emailCandidate) ? '<p class="contact-note">I contatti contrassegnati come da verificare provengono da snippet web e vanno confermati prima della pubblicazione definitiva.</p>' : '') + '</section>';
  if (!out.includes('id="contatti"')) {
    if (/<footer\b/i.test(out)) out = out.replace(/<footer\b/i, contactHtml + '\n<footer');
    else out = out.replace(/<\/body>/i, contactHtml + '\n</body>');
  }
  out = out.replace(/href="\.\.\/\.\.\/assets\//g, 'href="/varese-sites/Template%203D/assets/');
  out = out.replace(/src="\.\.\/\.\.\/assets\//g, 'src="/varese-sites/Template%203D/assets/');
  out = out.replace(/href="\.\.\/assets\//g, 'href="/varese-sites/Template%203D/assets/');
  out = out.replace(/src="\.\.\/assets\//g, 'src="/varese-sites/Template%203D/assets/');
  // Use paths relative to each /sites/<slug>/ page: works on both project Pages and root Pages.
  out = out.replace(/(["'=])\/varese-sites\/Template%203D\/assets\//g, '$1../../Template%203D/assets/');

  // Last-resort cleanup for known fictional demo content that must never reach a business page.
  // Keep unknown content for the QA gate to flag rather than guessing at a replacement.
  out = out
    .replace(/Maison(?:\s|&nbsp;|&#160;|&#x0*a0;|&amp;nbsp;)*Sucre/gi, title)
    .replace(/Maison\s*<em>\s*Sucre\s*<\/em>/gi, title)
    .replace(/maisonsucre\.fr/gi, "")
    .replace(/44\s+rue\s+du\s+Bac/gi, "")
    .replace(/75007\s+Paris/gi, "")
    .replace(/rue\s+du\s+Bac/gi, "")
    .replace(/Paris\s*7/gi, "")
    .replace(/bonjour@maisonsucre\.fr/gi, "")
    .replace(/\+33\s*1\s*45\s*48\s*19\s*62/gi, "")
    .replace(/your@email\.fr/gi, "email da verificare")
    .replace(/Odile Marchand|Camille Marchand/gi, title)
    .replace(/Pistache de Bronte|Citron de Menton|Gariguette/gi, "specialità del laboratorio")
    .replace(/Today,\s*<em>behind the glass\.<\/em>/gi, "La proposta dell’attività")
    .replace(/The shop/gi, "L’attività")
    .replace(/Fill it for me/gi, "Scopri la proposta")
    .replace(/Untie &amp; start again/gi, "Ricomincia")
    .replace(/Order this box/gi, "Chiedi informazioni")
    .replace(/Add to bag(?:\s*[—-]\s*€\s*290)?/gi, sector.cta)
    .replace(/No\.\s*9 Extrait,?\s*50 ml/gi, title)
    .replace(/50 ml\s*[—-]\s*€\s*290/gi, sector.cta)
    .replace(/Made with butter, not margarine\./gi, "")
    .replace(/Shimokitazawa|Kazu Nomura/gi, title)
    .replace(/4,800 records on the wall/gi, "una proposta da scoprire")
    .replace(/record label/gi, "attività")
    .replace(/bonsai nursery/gi, sector.kind)
    .replace(/Ōmiya,?\s*Saitama/gi, "")
    .replace(/oldest maple has seen 180 autumns/gi, sector.description)
    .replace(/555\s*014\s*\d{3,}/gi, "Telefono da verificare")
    .replace(/example\.com/gi, "");

  // Remove the collection/template switcher from every business page. It belongs only
  // on the 3D showcase, never on a customer's public website.
  const businessChrome = '<style id="business-page-cleanup">.tw-nav,.tw-nav-home,.tw-nav-step,.tw-nav-count{display:none!important;visibility:hidden!important;pointer-events:none!important}';
  // Remove only the demo-specific commerce/story sections for the chosen template.
  // Section IDs are not globally interchangeable: for Reliquary, "collection" is the hero and contains its H1.
  const demoSectionsByTemplate = {
    lowfreq: ["pressing", "catalogue", "club"],
    nocturne: ["shop"],
    terrarium: ["shop"],
    reliquary: ["membership"],
    hangar: ["program", "apply"],
    racer: ["waitlist"],
    florae: ["subscribe"],
    atlas: ["book"],
    artemis: ["price"],
    sucre: ["coffret"],
    horologie: ["collection", "calibre", "finishing"],
    koen: ["nursery", "craft"]
  };
  const removedSections = demoSectionsByTemplate[sector.id] || [];
  for (const sectionId of removedSections) {
    out = removeSectionById(out, sectionId);
    out = out.replaceAll('href="#' + sectionId + '"', 'href="#contatti"').replaceAll("href='#" + sectionId + "'", 'href="#contatti"');
  }
  // Translate navigation labels whose matching demo-only section was removed.
  out = out.replace(/\bPressing\b/gi, sector.nav[0]);
  out = out.replace(/\bCatalogue\b/gi, sector.nav[1]);
  out = out.replace(/\bMembership\b/gi, sector.nav[2]);
  out = out.replace(/\bCollection\b/gi, sector.nav[0]);
  out = out.replace(/\bNight hours\b/gi, sector.nav[1]);
  out = out.replace(/\bCoffrets?\b/gi, sector.nav[0]);
  out = out.replace(/\bBook a night visit\b/gi, sector.cta);
  out = out.replace(/<head>/i, '<head>\n' + businessChrome +
    '.tw-nav{display:none!important}.pressing .tracks,.pressing .buy,.catalogue .sleeves,.club .tiers{display:none!important}' +
    '</style>');
  return out;
}

// Contatti pubblici verificati online; gli altri dati vengono mantenuti solo se già presenti nella pagina sorgente.
const verifiedContacts = {
  "carpe-diem-parrucchieri": { phone: "3519908483", address: "Via Severo Piatti, 9, 21100 Varese (VA)" },
  "beauty-diffusion-snc": { phone: "0332223588", email: "deboracarcano79@gmail.com", address: "Via Daniele Manin, 30, 21100 Varese (VA)", website: "https://www.beautydiffusion.it" },
  "bergamo-srl": { phone: "0332262356", email: "andrea@bergamosrl.com", address: "Via Stromboli, 16, 21100 Varese (VA)" },
  "officina-caroleo": { phone: "0332333064", address: "Via Valle Venosta, 9, 21100 Varese (VA)" }
};

// Use the audited CSV first: it contains corrected phones, addresses and template decisions.
const manifestRecords = new Map();
const manifestCsvPath = path.join(root, "varese_sites_missing_manifest.csv");
const manifestPath = path.join(root, "varese_sites_missing_manifest.json");
if (fs.existsSync(manifestCsvPath)) {
  for (const item of parseCsv(fs.readFileSync(manifestCsvPath, "utf8"))) {
    if (!item.slug) continue;
    manifestRecords.set(item.slug, { ...item, nome: item.nome || "", settore: item.settore || "", telefono: item.telefono || "", email: item.email || "", indirizzo: item.indirizzo || "", comune: item.comune || "", template_id_3d: item.template_id_3d || "" });
  }
} else if (fs.existsSync(manifestPath)) {
  for (const item of JSON.parse(fs.readFileSync(manifestPath, "utf8"))) if (item.slug) manifestRecords.set(item.slug, item);
}

// The workbook audit separates 86 pages outside the prospect manifest and 268 web-snippet contact candidates.
// Keep those records distinct: out-of-manifest businesses are still regenerated, but not silently promoted to prospects.
const extraPagesPath = path.join(root, "audit-extra-pages.csv");
if (fs.existsSync(extraPagesPath)) {
  for (const item of parseCsv(fs.readFileSync(extraPagesPath, "utf8"))) {
    if (!item.slug || manifestRecords.has(item.slug)) continue;
    manifestRecords.set(item.slug, {
      slug: item.slug, nome: item.nome || "", comune: item.comune || "", settore: item.settore || "",
      telefono: "", email: "", indirizzo: "", template_id_3d: "", audit_provenienza: "fuori_manifest_da_verificare"
    });
  }
}
const candidateContacts = new Map();
const candidateContactsPath = path.join(root, "audit-contact-candidates.csv");
if (fs.existsSync(candidateContactsPath)) {
  for (const item of parseCsv(fs.readFileSync(candidateContactsPath, "utf8"))) {
    if (item.slug) candidateContacts.set(item.slug, item);
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
  const sector = { ...pick(dir.name, titleText, sectorText, manifestSector) };
  // Keep sector-appropriate Italian copy, but use the audited 3D concept for this exact business.
  const auditedTemplateId = record.template_id_3d || "";
  if (auditedTemplateId && /^[a-z0-9-]+$/.test(auditedTemplateId)) sector.id = auditedTemplateId;
  const links = getTextLinks(oldHtml);
  const discoveredPhone = (links.find(x => /^tel:/i.test(x.href)) || {}).href?.replace(/^tel:/i, "") || "";
  const discoveredEmail = (links.find(x => /^mailto:/i.test(x.href)) || {}).href?.replace(/^mailto:/i, "") || "";
  const discoveredAddress = (oldHtml.match(/(?:Via|Viale|Piazza|P.zza|Corso|Largo|Strada|Vicolo|Piazzale)\s+[^<\n]{4,100}/i) || [])[0] || "";
  const verified = verifiedContacts[dir.name] || {};
  const phone = verified.phone || record.telefono || "";
  const email = verified.email || record.email || "";
  const address = verified.address || record.indirizzo || "";
  const candidate = candidateContacts.get(dir.name) || {};
  const phoneCandidate = phone ? "" : String(candidate.telefono_snippet_da_verificare || "");
  const emailCandidate = email ? "" : String(candidate.email_snippet_da_verificare || "");
  const templatePath = path.join(builtExamples, sector.id, "index.html");
  if (!fs.existsSync(templatePath)) {
    failures.push(dir.name + " -> template mancante: " + sector.id);
    continue;
  }
  const templateHtml = fs.readFileSync(templatePath, "utf8");
  let html = rewrite(templateHtml, titleText, sector, phone, email, address, sectorText, String(record.comune || ""), phoneCandidate, emailCandidate);
  // Remove any old preview-link remnants if a template contained them.
  html = html.replace(/<section[^>]*class=["'][^"']*template-preview[^"']*["'][^>]*>[\s\S]*?<\/section>/gi, "");
  html = html.replace(/<html([^>]*?)lang=["']en["']/i, '<html$1lang="it"');
  html = html.replace(/<html(?![^>]*\blang=)/i, '<html lang="it"');
  // Keep the actual chosen template identifiable for the catalog and audits.
  html = html.replace(/<html([^>]*)>/i, (m, attrs) => '<html' + attrs.replace(/\sdata-template-3d=["'][^"']*["']/i, "") + ' data-template-3d="' + sector.id + '">');
  if (!/<title\\b[^>]*>[\\s\\S]*?<\\/title>/i.test(html)) {
    html = html.replace(/<head\\b[^>]*>/i, '$&<title>' + titleText + ' — ' + sector.kind + '</title>');
  }
  if (!/<h1\\b[^>]*>[\\s\\S]*?<\\/h1>/i.test(html)) {
    const fallbackHeading = '<h1 class="business-title">' + esc(titleText) + '</h1>';
    if (/<main\\b[^>]*>/i.test(html)) html = html.replace(/<main\\b[^>]*>/i, '$&' + fallbackHeading);
    else html = html.replace(/<body\\b[^>]*>/i, '$&' + fallbackHeading);
  }
  fs.writeFileSync(file, html);
  done++;
}
if (failures.length) {
  console.error("Template integration failures: " + failures.slice(0, 30).join("; "));
  if (failures.length > 30) console.error("... and " + (failures.length - 30) + " more");
  throw new Error(failures.length + " business pages could not be integrated with their 3D template");
}
console.log("Applied real interactive 3D templates to " + done + " business pages; no static preview-link pages retained.");
