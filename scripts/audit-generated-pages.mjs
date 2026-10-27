import fs from "node:fs";
import path from "node:path";
import { gunzipSync, inflateSync, inflateRawSync, brotliDecompressSync } from "node:zlib";

const root = process.cwd();
const sitesDir = path.join(root, "sites");
if (!fs.existsSync(sitesDir)) {
  console.error("QA error: directory sites/ not found.");
  process.exit(2);
}

const rules = [
  ["PARIS_ADDRESS", /(?:44\s+rue\s+du\s+Bac|75007\s+Paris|rue\s+du\s+Bac|Paris\s*7)/i],
  ["MAISON_SUCRE_BRAND", /Maison(?:\s|&nbsp;|&#160;)*Sucre|maisonsucre\.fr/i],
  ["FICTIONAL_PASTRY_STORY", /Odile Marchand|Camille Marchand|Gariguette|Pistache de Bronte|Citron de Menton/i],
  ["FICTIONAL_CONTACT", /bonjour@maisonsucre\.fr|\+33\s*1\s*45\s*48\s*19\s*62|your@email\.fr/i],
  ["FICTIONAL_TOKYO_RECORD_BAR", /Shimokitazawa|Kazu Nomura|4,800 records on the wall|record label/i],
  ["FICTIONAL_BONSAI_NURSERY", /bonsai nursery|Ōmiya,?\s*Saitama|oldest maple has seen 180 autumns/i],
  ["DEMO_SHOP_COPY", /Add to bag(?:\s*[—-]\s*€\s*290)?|No\.\s*9 Extrait|50 ml\s*[—-]\s*€\s*290|Made with butter, not margarine/i],
  ["ENGLISH_DEMO_UI", /(?:^|[>])\s*(?:Subscribe|Fill it for me|Untie &amp; start again|Today,\s*<em>|The shop|Order this box)\s*(?:<|$)/i],
  ["SAMPLE_ADDRESS_OR_CONTACT", /(?:555\s*014\s*\d{3,}|example\.com|your@email\.fr)/i],
  ["FICTIONAL_MEMBERSHIP_OR_PRODUCT_CARD", /(?:Join Sleeve|MOST KEPT|Every LF pressing|Liner notes written at the counter|10% off anything on the wall|¥\s*[0-9,]+\s*\/\s*month|SLEEVE)/i],
  ["UNTRANSLATED_DEMO_CONTROL", /(?:Listening bar & record label|Shimokitazawa|Sound off|Audio off|Subscribe|Newsletter|Drop the needle|\bThe bar\b|Record club|Pre-order the LP)/i],
];

function stripNonContent(html) {
  return html
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ")
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, " ")
    // Audit visible copy, not aria-labels, asset URLs, class names or other markup attributes.
    .replace(/<[^>]+>/g, " ")
    .replace(/&(?:amp|nbsp|lt|gt|quot|#39);/gi, " ");
}

function phoneDigits(value) {
  return String(value || "").replace(/\D/g, "");
}
function phoneMatchesHtml(html, phone) {
  const expectedNumbers = String(phone || "").split(/[;,\\n]+/).map(phoneDigits).filter(Boolean);
  if (!expectedNumbers.length) return true;
  const telLinks = [...String(html || "").matchAll(/href=["']tel:([^"']+)["']/gi)]
    .map(match => phoneDigits(match[1]));
  // Manifest entries may contain multiple numbers separated by semicolons.
  // Match each complete number independently, allowing Italian international prefixes and formatting.
  return expectedNumbers.some(expected => {
    const national = expected.replace(/^0039/, "").replace(/^39(?=0|3)/, "");
    return telLinks.some(value => value === expected || value.endsWith(national) || expected.endsWith(value));
  });
}

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
  const headers = rows.shift() || [];
  return rows.filter(r => r.some(v => String(v || "").trim())).map(r => Object.fromEntries(headers.map((h, i) => [h, r[i] || ""])));
}
const manifestRecords = new Map();
const manifestCsv = path.join(root, "varese_sites_missing_manifest.csv");
if (fs.existsSync(manifestCsv)) {
  for (const record of parseCsv(fs.readFileSync(manifestCsv, "utf8"))) {
    if (record.slug) manifestRecords.set(record.slug, record);
  }
}

const extraPageRecords = new Map();
const extraPagesCsv = path.join(root, "audit-extra-pages.csv");
if (fs.existsSync(extraPagesCsv)) for (const r of parseCsv(fs.readFileSync(extraPagesCsv, "utf8"))) if (r.slug) extraPageRecords.set(r.slug, r);
const candidateContacts = new Map();
const candidateCsv = path.join(root, "audit-contact-candidates.csv");
if (fs.existsSync(candidateCsv)) for (const r of parseCsv(fs.readFileSync(candidateCsv, "utf8"))) if (r.slug) candidateContacts.set(r.slug, r);
const compressedPhoneCandidatesPath = path.join(root, "audit-phone-candidates.json.gz.b64");
if (fs.existsSync(compressedPhoneCandidatesPath)) {
  const encoded = fs.readFileSync(compressedPhoneCandidatesPath, "utf8").trim();
  const candidates = JSON.parse(gunzipSync(Buffer.from(encoded, "base64")).toString("utf8"));
  for (const item of candidates) {
    if (!item.s || !item.p) continue;
    const existing = candidateContacts.get(item.s) || {};
    if (existing.telefono_snippet_da_verificare) continue;
    candidateContacts.set(item.s, { ...existing, slug: item.s, telefono_snippet_da_verificare: item.p, fonte_contatto_web: existing.fonte_contatto_web || item.u || "", source_url: item.u || "", provenance: "Ricerca web — contatto da verificare" });
  }
}

const compressedEmailCandidatesPath = path.join(root, "audit-email-candidates.json.gz.b64");
if (fs.existsSync(compressedEmailCandidatesPath)) {
  const encoded = fs.readFileSync(compressedEmailCandidatesPath, "utf8").trim();
  const candidates = JSON.parse(gunzipSync(Buffer.from(encoded, "base64")).toString("utf8"));
  for (const item of candidates) {
    if (!item.s || !item.e) continue;
    const existing = candidateContacts.get(item.s) || {};
    if (existing.email_snippet_da_verificare) continue;
    candidateContacts.set(item.s, { ...existing, slug: item.s, email_snippet_da_verificare: item.e, email_source_url: item.u || "", provenance: existing.provenance || "Ricerca web — contatto da verificare" });
  }
}

const verifiedContactOverrides = {
  "carpe-diem-parrucchieri": { phone: "3519908483" },
  "beauty-diffusion-snc": { phone: "0332223588", email: "deboracarcano79@gmail.com" },
  "bergamo-srl": { phone: "0332262356", email: "andrea@bergamosrl.com" },
  "officina-caroleo": { phone: "0332333064" }
};

const businessCategoryCodes = {
  bc: "bar_cafe", rd: "retail_design", ba: "bakery", ha: "hair", re: "restaurant", au: "automotive", ho: "hospitality",
  be: "beauty", ct: "construction_trades", fg: "florist_garden", cl: "cleaning_services", lp: "legal_professional",
  sb: "salon_beauty", ac: "art_craft", op: "optical", tr: "travel", ri: "real_estate", fi: "fitness", ta: "tattoo",
  cs: "creative_services", ec: "education_culture", he: "health", pz: "pizzeria", ps: "pet_supply", fr: "food_retail",
  "??": "needs_review", is: "industrial_services", lb: "logistics_business"
};
const businessCategoryLetterCodes = {
  a: "bar_cafe", b: "retail_design", c: "bakery", d: "hair", e: "restaurant", f: "automotive", g: "hospitality",
  h: "beauty", i: "construction_trades", j: "florist_garden", k: "cleaning_services", l: "legal_professional",
  m: "salon_beauty", n: "art_craft", o: "optical", p: "travel", q: "real_estate", r: "fitness", s: "tattoo",
  t: "creative_services", u: "education_culture", v: "health", w: "pizzeria", x: "pet_supply", y: "food_retail",
  z: "needs_review", A: "industrial_services", B: "logistics_business"
};
const businessCategoryOverrides = new Map();
const businessCategoryPath = path.join(root, "audit-business-categories.json.gz.b64");
if (fs.existsSync(businessCategoryPath)) {
  const bytes = Buffer.from(fs.readFileSync(businessCategoryPath, "utf8").trim(), "base64");
  let decoded = null;
  for (const decompress of [gunzipSync, inflateSync, inflateRawSync, brotliDecompressSync]) {
    try {
      const raw = decompress(bytes).toString("utf8");
      try { decoded = JSON.parse(raw); } catch { decoded = raw; }
      break;
    } catch { /* Unknown compression format: use the auditable CSV and manifest fallback below. */ }
  }
  if (Array.isArray(decoded)) {
    for (const [slug, code] of decoded) {
      if (slug) businessCategoryOverrides.set(slug, businessCategoryCodes[code] || businessCategoryLetterCodes[code] || String(code || ""));
    }
  } else if (typeof decoded === "string") {
    const slugs = fs.readdirSync(sitesDir, { withFileTypes: true })
      .filter(entry => entry.isDirectory()).map(entry => entry.name).sort();
    if (decoded.length === slugs.length) {
      for (let i = 0; i < slugs.length; i++) {
        businessCategoryOverrides.set(slugs[i], businessCategoryLetterCodes[decoded[i]] || "needs_review");
      }
    }
  }
}
const businessCategorySources = new Map();
const businessCategorySourcesPath = path.join(root, "audit-category-sources.csv");
if (fs.existsSync(businessCategorySourcesPath)) {
  for (const item of parseCsv(fs.readFileSync(businessCategorySourcesPath, "utf8"))) {
    if (item.slug) businessCategorySources.set(item.slug, item);
  }
}

function inferAuditCategoryKey(sectorText, titleText, template) {
  const hay = (String(sectorText || "") + " " + String(titleText || "")).toLocaleLowerCase("it");
  const rules = [
    ["pizzeria", /pizzer/], ["restaurant", /ristorant|trattoria|osteria|sushi|gastronom/],
    ["bar_cafe", /\bbar\b|caff[eè]|pub\b|birreria|enoteca|cocktail|bistrot|lounge|gelateria/],
    ["bakery", /pasticcer|panetter|panific|forno\b|bakery|gelateria|cioccolat/],
    ["food_retail", /alimentar|maceller|salumer|pescher|gastronomia|supermercat/],
    ["hair", /parrucch|acconciator|barbiere|barber|taglio uomo/], ["beauty", /centro estetico|estetica|nail|unghie/],
    ["salon_beauty", /salone|benessere|cura della persona|beauty/], ["tattoo", /tatuagg|tattoo|piercing/],
    ["automotive", /carrozzer|officina|gommist|pneumatic|autoricamb|autolavagg|concessionar|veicol/],
    ["hospitality", /hotel|albergo|bed.?and.?breakfast|affittacamere|casa vacanze|resort/],
    ["real_estate", /agenzia immobiliare|immobiliar/],
    ["legal_professional", /avvocat|notai|commercialist|consulent|geometra|ingegner|architett|assicurazion|caf\b|patronato/],
    ["construction_trades", /edil|costruzion|ristruttur|serrament|idraulic|elettric|cartongess|murator|scav/],
    ["industrial_services", /informatica|elettronic|computer|smartphone|automazion|domotic|industr|forniture tecniche|impiant/],
    ["florist_garden", /fiorist|fioraio|fiori|giardin|vivaio|flor|piante|verde/],
    ["cleaning_services", /puliz|sanific|lavander|lavasecco/], ["fitness", /palestra|fitness|sport|karate|yoga|pilates|danza|nuoto/],
    ["optical", /ottic|occhial|optometr/], ["health", /dentist|dentale|medic|fisioterap|farmaci|salute|clinica|psicolog/],
    ["pet_supply", /animali|pet.?shop|mangimi/], ["travel", /trasport|noleggio|logistic|viagg|trasloc|spedizion|nautic|barca/],
    ["creative_services", /fotograf|video|grafica|design|marketing|web.?agency|stampa|software|creativ/],
    ["education_culture", /scuola|formazion|centro studi|associazion culturale|biblioteca|museo|teatro|corsi/],
    ["art_craft", /artigian|restaur|antiqu|intagliator|cornic|ferro|accia|sald|resine/],
    ["retail_design", /negozio|boutique|arred|mobili|falegnam|legno|cucine|abbigliamento|calzatur|gioiell|orefic|orolog/]
  ];
  for (const [key, pattern] of rules) if (pattern.test(hay)) return key;
  return ({
    lowfreq: "bar_cafe", sucre: "bakery", nocturne: "hair", racer: "automotive",
    hangar: "industrial_services", monolith: "construction_trades", florae: "florist_garden",
    keeper: "cleaning_services", atlas: "logistics_business", koen: "retail_design",
    gambit: "legal_professional", reliquary: "art_craft", terrarium: "pet_supply",
    velocity: "fitness", horologie: "optical", lithos: "health", koi: "food_retail",
    abyssal: "travel", artemis: "hospitality", ember: "industrial_services", pilot: "automotive"
  })[template] || "needs_review";
}

function inspectPage(file) {
  const html = fs.readFileSync(file, "utf8");
  const slug = path.basename(path.dirname(file));
  const findings = [];
  const lang = (html.match(/<html\b[^>]*\blang=["']([^"']+)["']/i) || [])[1] || "";
  const template = (html.match(/<html\b[^>]*\bdata-template-3d=["']([^"']+)["']/i) || [])[1] || "";
  const title = (html.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i) || [])[1] || "";
  if (lang.toLowerCase() !== "it") findings.push({ code: "LANG_NOT_IT", sample: lang || "(missing)" });
  if (!template) findings.push({ code: "MISSING_3D_TEMPLATE", sample: "(missing data-template-3d)" });
  if (!/id=["']business-page-cleanup["']/i.test(html)) {
    findings.push({ code: "MISSING_BUSINESS_CHROME_CLEANUP", sample: "Template switcher / demo card cleanup missing" });
  }
  if (/<section\b(?=[^>]*\bid=["'](?:club|catalogue)["'])[^>]*>/i.test(html)) {
    findings.push({ code: "UNRELATED_COMMERCE_SECTION", sample: "Fictional catalogue or paid membership section remains in the page source" });
  }
  if (!title.trim()) findings.push({ code: "MISSING_TITLE", sample: "(missing title)" });
  const record = manifestRecords.get(slug);
  const extraRecord = extraPageRecords.get(slug);
  const candidate = candidateContacts.get(slug);
  const categorySource = businessCategorySources.get(slug) || {};
  const categoryText = record?.settore || extraRecord?.settore || "";
  const auditedOverride = businessCategoryOverrides.get(slug) || "";
  const categoryKey = (auditedOverride && auditedOverride !== "needs_review" ? auditedOverride : "") || categorySource.category ||
    inferAuditCategoryKey(categoryText, [record?.nome, extraRecord?.nome, extraRecord?.titolo_pagina, title, h1].filter(Boolean).join(" "), template);
  if (!categoryKey || categoryKey === "needs_review") findings.push({ code: "BUSINESS_CATEGORY_NEEDS_REVIEW", sample: "Category inferred from limited business data; manual review recommended" });
  if (record) {
    if (record.telefono && !phoneMatchesHtml(html, record.telefono)) findings.push({ code: "MANIFEST_PHONE_MISSING", sample: record.telefono });
    if (record.email && !html.includes(record.email)) findings.push({ code: "MANIFEST_EMAIL_MISSING", sample: record.email });
    if (record.indirizzo && !html.includes(record.indirizzo)) findings.push({ code: "MANIFEST_ADDRESS_MISSING", sample: record.indirizzo });
    if (record.template_id_3d && template !== record.template_id_3d) findings.push({ code: "AUDITED_TEMPLATE_MISMATCH", sample: "expected " + record.template_id_3d + ", got " + (template || "(missing)") });
  }
  if (!/<link\b[^>]*rel=["']stylesheet["'][^>]*href=["'][^"']+["']/i.test(html)) {
    findings.push({ code: "MISSING_3D_STYLESHEET", sample: "No linked stylesheet found" });
  }
  if (!/<script\b[^>]*type=["']module["'][^>]*src=["'][^"']+["']/i.test(html)) {
    findings.push({ code: "MISSING_3D_MODULE_SCRIPT", sample: "No bundled module script found" });
  }

  // Verify that each required stylesheet and module script resolves to a built file.
  const requiredAssets = [];
  for (const match of html.matchAll(/<link\b([^>]*)>/gi)) {
    if (/\brel=["']stylesheet["']/i.test(match[1])) {
      const ref = (match[1].match(/\bhref=["']([^"']+)["']/i) || [])[1];
      if (ref) requiredAssets.push(ref);
    }
  }
  for (const match of html.matchAll(/<script\b([^>]*)>/gi)) {
    if (/\btype=["']module["']/i.test(match[1])) {
      const ref = (match[1].match(/\bsrc=["']([^"']+)["']/i) || [])[1];
      if (ref) requiredAssets.push(ref);
    }
  }
  for (const ref of requiredAssets) {
    if (/^(?:https?:|data:|#|mailto:|tel:|javascript:)/i.test(ref)) continue;
    const clean = decodeURIComponent(ref.split(/[?#]/)[0]);
    let diskPath;
    if (clean.startsWith("../../Template 3D/")) {
      diskPath = path.join(root, "template 3D", "Dioramas", "dist", clean.replace(/^\.\.\/\.\.\/Template 3D\//, ""));
    } else if (clean.startsWith("/varese-sites/Template 3D/")) {
      diskPath = path.join(root, "template 3D", "Dioramas", "dist", clean.replace(/^\/varese-sites\/Template 3D\//, ""));
    } else if (clean.startsWith("/")) {
      diskPath = path.join(root, clean.replace(/^\/+/, ""));
    } else {
      diskPath = path.resolve(path.dirname(file), clean);
    }
    if (!fs.existsSync(diskPath)) {
      findings.push({ code: "BROKEN_LOCAL_ASSET", sample: ref.slice(0, 120) });
    }
  }

  const visible = stripNonContent(html);
  if (extraRecord && extraRecord.nome && !html.includes(extraRecord.nome) && !html.includes(extraRecord.nome.replace(/&/g, "&amp;"))) {
    findings.push({ code: "OUT_OF_MANIFEST_NAME_MISSING", sample: extraRecord.nome });
  }
  if (candidate) {
    const curated = verifiedContactOverrides[slug] || {};
    const digits = value => String(value || "").replace(/\D/g, "");
    const curatedPhoneDigits = digits(curated.phone);
    const candidatePhoneDigits = digits(candidate.telefono_snippet_da_verificare);
    const displayedTelDigits = [...html.matchAll(/href=["']tel:([^"']+)["']/gi)].map(m => digits(m[1]));
    const curatedPhoneIsDisplayed = Boolean(curatedPhoneDigits && displayedTelDigits.some(value =>
      value.endsWith(curatedPhoneDigits) || (candidatePhoneDigits && value.endsWith(candidatePhoneDigits))
    ));
    const curatedEmailIsDisplayed = Boolean(curated.email && html.toLocaleLowerCase("it").includes(curated.email.toLocaleLowerCase("it")));
    if (candidate.telefono_snippet_da_verificare && !(record && record.telefono) &&
        !curatedPhoneIsDisplayed &&
        (!visible.includes(candidate.telefono_snippet_da_verificare) || !/Numero da verificare/i.test(visible))) {
      findings.push({ code: "WEB_PHONE_CANDIDATE_NOT_LABELLED", sample: candidate.telefono_snippet_da_verificare });
    }
    if (candidate.email_snippet_da_verificare && !(record && record.email) &&
        !curatedEmailIsDisplayed &&
        (!visible.includes(candidate.email_snippet_da_verificare) || !/Email da verificare/i.test(visible))) {
      findings.push({ code: "WEB_EMAIL_CANDIDATE_NOT_LABELLED", sample: candidate.email_snippet_da_verificare });
    }
  }
  for (const [code, re] of rules) {
    const match = visible.match(re);
    if (match) findings.push({ code, sample: visible.slice(Math.max(0, match.index - 45), Math.min(visible.length, match.index + match[0].length + 45)).replace(/\s+/g, " ").slice(0, 160) });
  }
  const h1 = (html.match(/<h1\b[^>]*>[\s\S]*?<\/h1>/i) || [""])[0].replace(/<[^>]+>/g, " ").replace(/&amp;/gi, "&").replace(/\s+/g, " ").trim();
  const intro = (html.match(/<p\b[^>]*class=["'][^"']*\b(?:sub|lead|lede)\b[^"']*["'][^>]*>[\s\S]*?<\/p>/i) || [""])[0].replace(/<[^>]+>/g, " ").replace(/&amp;/gi, "&").replace(/\s+/g, " ").trim();
  return {
    slug, findings, title: title.replace(/<[^>]+>/g, "").replace(/&amp;/gi, "&").trim(), h1, template, intro,
    category_key: categoryKey, category_review_required: categoryKey === "needs_review",
    category_source: categorySource.source_url || "",
    category_reason: categorySource.reason || (categoryKey === "needs_review" ? "needs_review" : "nome/settore auditato"),
    data_source: record ? "manifest" : (extraRecord ? "fuori_manifest_da_verificare" : "pagina_senza_record_audit"),
    phone_from_manifest: record?.telefono || "", phone_present: Boolean(record?.telefono && phoneMatchesHtml(html, record.telefono)),
    email_from_manifest: record?.email || "", email_present: Boolean(record?.email && html.includes(record.email)),
    address_from_manifest: record?.indirizzo || "", address_present: Boolean(record?.indirizzo && html.includes(record.indirizzo)),
    phone_candidate: candidate?.telefono_snippet_da_verificare || "",
    phone_candidate_source: candidate?.source_url || candidate?.fonte_contatto_web || "",
    phone_candidate_labelled: Boolean(candidate?.telefono_snippet_da_verificare && visible.includes(candidate.telefono_snippet_da_verificare) && /Numero da verificare/i.test(visible)),
    email_candidate: candidate?.email_snippet_da_verificare || "",
    email_candidate_source: candidate?.email_source_url || candidate?.fonte_contatto_web || "",
    email_candidate_labelled: Boolean(candidate?.email_snippet_da_verificare && visible.includes(candidate.email_snippet_da_verificare) && /Email da verificare/i.test(visible))
  };
}

const pages = fs.readdirSync(sitesDir, { withFileTypes: true })
  .filter(entry => entry.isDirectory())
  .map(entry => path.join(sitesDir, entry.name, "index.html"))
  .filter(file => fs.existsSync(file))
  .sort();

const results = pages.map(inspectPage);
// Repeated introductions are a defect: every business page needs its own generated presentation.
const introOwners = new Map();
for (const result of results) {
  const normalizedIntro = String(result.intro || "").replace(/\s+/g, " ").trim().toLocaleLowerCase("it");
  if (!normalizedIntro) continue;
  const firstSlug = introOwners.get(normalizedIntro);
  if (firstSlug) {
    result.findings.push({ code: "DUPLICATE_BUSINESS_INTRO", sample: "Same presentation as " + firstSlug });
  } else {
    introOwners.set(normalizedIntro, result.slug);
  }
}
const findingCounts = {};
const flagged = [];
for (const result of results) {
  if (result.findings.length) flagged.push(result);
  for (const finding of result.findings) findingCounts[finding.code] = (findingCounts[finding.code] || 0) + 1;
}

const report = {
  generated_at: new Date().toISOString(),
  pages_scanned: pages.length,
  pages_flagged: flagged.length,
  pages_passed: pages.length - flagged.length,
  manifest_rows: manifestRecords.size,
  out_of_manifest_audit_rows: extraPageRecords.size,
  contact_candidate_rows: candidateContacts.size,
  category_mapped_pages: results.filter(r => r.category_key).length,
  pages_needing_category_review: results.filter(r => r.category_review_required).length,
  category_review_slugs: results.filter(r => r.category_review_required).map(r => r.slug),
  manifest_phone_rows: results.filter(r => r.phone_from_manifest).length,
  manifest_email_rows: results.filter(r => r.email_from_manifest).length,
  manifest_address_rows: results.filter(r => r.address_from_manifest).length,
  labelled_phone_candidates: results.filter(r => r.phone_candidate_labelled).length,
  labelled_email_candidates: results.filter(r => r.email_candidate_labelled).length,
  finding_counts: findingCounts,
  pages: results.map(({ findings, ...page }) => page),
  flagged_pages: flagged.map(({ slug, findings }) => ({ slug, findings })),
};
const reportPath = path.join(root, "qa-generated-pages-report.json");
fs.writeFileSync(reportPath, JSON.stringify(report, null, 2) + "\n");

console.log("Generated page QA");
console.log("Pages scanned: " + report.pages_scanned);
console.log("Pages with findings: " + report.pages_flagged);
console.log("Pages passing: " + report.pages_passed);
console.log("Manifest rows: " + report.manifest_rows + "; out-of-manifest audit rows: " + report.out_of_manifest_audit_rows);
console.log("Pages with manifest phone/email/address: " + report.manifest_phone_rows + "/" + report.manifest_email_rows + "/" + report.manifest_address_rows);
console.log("Web contact candidates labelled as unverified: phone " + report.labelled_phone_candidates + ", email " + report.labelled_email_candidates);
for (const [code, count] of Object.entries(findingCounts).sort((a, b) => b[1] - a[1])) {
  console.log("  " + code + ": " + count + " page(s)");
}
console.log("Detailed report: qa-generated-pages-report.json");
for (const item of flagged.slice(0, 20)) {
  console.log("  SAMPLE " + item.slug + ": " + item.findings.map(f => f.code + "=" + f.sample).join(" | "));
}

if (flagged.length) {
  console.error("QA FAILED: demo residue or structural problems detected; publication must stop until the findings are corrected.");
  process.exit(1);
}
console.log("QA PASSED: no configured demo-residue patterns or structural issues detected.");
