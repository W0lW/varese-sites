import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const sitesDir = path.join(root, "sites");
if (!fs.existsSync(sitesDir)) {
  console.error("QA error: directory sites/ not found.");
  process.exit(2);
}

const rules = [
  ["PARIS_ADDRESS", /(?:44\\s+rue\\s+du\\s+Bac|75007\\s+Paris|rue\\s+du\\s+Bac|Paris\\s*7)/i],
  ["MAISON_SUCRE_BRAND", /Maison(?:\\s|&nbsp;|&#160;)*Sucre|maisonsucre\\.fr/i],
  ["FICTIONAL_PASTRY_STORY", /Odile Marchand|Camille Marchand|Gariguette|Pistache de Bronte|Citron de Menton/i],
  ["FICTIONAL_CONTACT", /bonjour@maisonsucre\\.fr|\\+33\\s*1\\s*45\\s*48\\s*19\\s*62|your@email\\.fr/i],
  ["FICTIONAL_TOKYO_RECORD_BAR", /Shimokitazawa|Kazu Nomura|4,800 records on the wall|record label/i],
  ["FICTIONAL_BONSAI_NURSERY", /bonsai nursery|Ōmiya,?\\s*Saitama|oldest maple has seen 180 autumns/i],
  ["DEMO_SHOP_COPY", /Add to bag(?:\\s*[—-]\\s*€\\s*290)?|No\\.\\s*9 Extrait|50 ml\\s*[—-]\\s*€\\s*290|Made with butter, not margarine/i],
  ["ENGLISH_DEMO_UI", /(?:^|[>])\\s*(?:Subscribe|Fill it for me|Untie &amp; start again|Today,\\s*<em>|The shop|Order this box)\\s*(?:<|$)/i],
  ["SAMPLE_ADDRESS_OR_CONTACT", /(?:555\\s*014\\s*\\d{3,}|example\\.com|your@email\\.fr)/i],
];

function stripNonContent(html) {
  return html
    .replace(/<!--[\\s\\S]*?-->/g, " ")
    .replace(/<script\\b[^>]*>[\\s\\S]*?<\\/script>/gi, " ")
    .replace(/<style\\b[^>]*>[\\s\\S]*?<\\/style>/gi, " ");
}

function inspectPage(file) {
  const html = fs.readFileSync(file, "utf8");
  const slug = path.basename(path.dirname(file));
  const findings = [];
  const lang = (html.match(/<html\\b[^>]*\\blang=["']([^"']+)["']/i) || [])[1] || "";
  const template = (html.match(/<html\\b[^>]*\\bdata-template-3d=["']([^"']+)["']/i) || [])[1] || "";
  const title = (html.match(/<title\\b[^>]*>([\\s\\S]*?)<\\/title>/i) || [])[1] || "";
  if (lang.toLowerCase() !== "it") findings.push({ code: "LANG_NOT_IT", sample: lang || "(missing)" });
  if (!template) findings.push({ code: "MISSING_3D_TEMPLATE", sample: "(missing data-template-3d)" });
  if (!title.trim()) findings.push({ code: "MISSING_TITLE", sample: "(missing title)" });

  const visible = stripNonContent(html);
  for (const [code, re] of rules) {
    const match = visible.match(re);
    if (match) findings.push({ code, sample: match[0].replace(/\\s+/g, " ").slice(0, 100) });
  }
  return { slug, findings };
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
  finding_counts: findingCounts,
  flagged_pages: flagged.map(({ slug, findings }) => ({ slug, findings })),
};
const reportPath = path.join(root, "qa-generated-pages-report.json");
fs.writeFileSync(reportPath, JSON.stringify(report, null, 2) + "\\n");

console.log("Generated page QA");
console.log("Pages scanned: " + report.pages_scanned);
console.log("Pages with findings: " + report.pages_flagged);
console.log("Pages passing: " + report.pages_passed);
for (const [code, count] of Object.entries(findingCounts).sort((a, b) => b[1] - a[1])) {
  console.log("  " + code + ": " + count + " page(s)");
}
console.log("Detailed report: qa-generated-pages-report.json");

if (flagged.length) {
  console.error("QA FAILED: demo residue or structural problems detected; publication must stop until the findings are corrected.");
  process.exit(1);
}
console.log("QA PASSED: no configured demo-residue patterns or structural issues detected.");
