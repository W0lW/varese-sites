import fs from "node:fs";
import path from "node:path";

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
  if (record) {
    if (record.telefono && !html.includes(record.telefono)) findings.push({ code: "MANIFEST_PHONE_MISSING", sample: record.telefono });
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
  if (candidate && !(record && record.telefono)) {
    if (candidate.telefono_snippet_da_verificare && (!visible.includes(candidate.telefono_snippet_da_verificare) || !/Numero da verificare/i.test(visible))) {
      findings.push({ code: "WEB_PHONE_CANDIDATE_NOT_LABELLED", sample: candidate.telefono_snippet_da_verificare });
    }
    if (candidate.email_snippet_da_verificare && (!visible.includes(candidate.email_snippet_da_verificare) || !/Email da verificare/i.test(visible))) {
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
    data_source: record ? "manifest" : (extraRecord ? "fuori_manifest_da_verificare" : "pagina_senza_record_audit"),
    phone_from_manifest: record?.telefono || "", phone_present: Boolean(record?.telefono && html.includes(record.telefono)),
    email_from_manifest: record?.email || "", email_present: Boolean(record?.email && html.includes(record.email)),
    address_from_manifest: record?.indirizzo || "", address_present: Boolean(record?.indirizzo && html.includes(record.indirizzo)),
    phone_candidate: candidate?.telefono_snippet_da_verificare || "",
    phone_candidate_labelled: Boolean(candidate?.telefono_snippet_da_verificare && visible.includes(candidate.telefono_snippet_da_verificare) && /Numero da verificare/i.test(visible)),
    email_candidate: candidate?.email_snippet_da_verificare || "",
    email_candidate_labelled: Boolean(candidate?.email_snippet_da_verificare && visible.includes(candidate.email_snippet_da_verificare) && /Email da verificare/i.test(visible))
  };
}

const pages = fs.readdirSync(sitesDir, { withFileTypes: true })
  .filter(entry => entry.isDirectory())
  .map(entry => path.join(sitesDir, entry.name, "index.html"))
  .filter(file => fs.existsSync(file))
  .sort();

const results = pages.map(inspectPage);
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
