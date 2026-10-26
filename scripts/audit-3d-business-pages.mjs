import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const sitesRoot = path.join(root, "sites");
const templatesRoot = path.join(root, "template 3D", "Dioramas", "examples");
const outDir = path.join(root, "audit-report");
fs.mkdirSync(outDir, { recursive: true });

const escCsv = v => '"' + String(v ?? "").replace(/"/g, '""').replace(/\r?\n/g, " ") + '"';
const strip = s => String(s || "")
  .replace(/<script\b[\s\S]*?<\/script>/gi, " ")
  .replace(/<style\b[\s\S]*?<\/style>/gi, " ")
  .replace(/<svg\b[\s\S]*?<\/svg>/gi, " ")
  .replace(/<[^>]+>/g, " ")
  .replace(/&amp;/g, "&").replace(/&nbsp;/g, " ").replace(/&quot;/g, '"')
  .replace(/&#39;|&apos;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
  .replace(/\s+/g, " ").trim();
const match = (s, re) => (String(s).match(re) || [])[1] || "";
const read = p => fs.existsSync(p) ? fs.readFileSync(p, "utf8") : "";
const templateIds = fs.readdirSync(templatesRoot, { withFileTypes: true }).filter(d => d.isDirectory() && d.name !== "_viewer").map(d => d.name);

const templateInfo = {};
for (const id of templateIds) {
  const dir = path.join(templatesRoot, id);
  const html = read(path.join(dir, "index.html"));
  const title = strip(match(html, /<title[^>]*>([\s\S]*?)<\/title>/i));
  const description = match(html, /<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)/i);
  const sourceFiles = fs.readdirSync(dir).filter(f => /\.(js|css|html)$/.test(f));
  const source = sourceFiles.map(f => read(path.join(dir, f))).join("\n");
  const visibleText = strip(html.replace(/<canvas\b[^>]*>/gi, " "));
  const visualClues = [];
  const clueRules = [
    [/koi|carp|pond|fish|water|ripple|caustic/i, "acqua/stagno/pesci"],
    [/astronaut|lunar|regolith|crater|moon|outpost/i, "spazio/luna/astronauta"],
    [/turntable|vinyl|record|deck|needle|listening bar/i, "giradischi/vinile/audio"],
    [/perfume|fragrance|bergamot|iris|oud|maceration|bottle/i, "profumo/flaconi/essenze"],
    [/bonsai|maple|tree|season|foliage|garden/i, "alberi/bonsai/giardino"],
    [/car|engine|motor|wheel|garage|chassis|vehicle/i, "auto/motore/meccanica"],
    [/building|architecture|concrete|structure|blueprint|construction/i, "architettura/strutture"],
    [/ship|ocean|submarine|marine|underwater|coral/i, "mare/nautica/sottomarino"],
    [/flower|petal|flora|leaf|plant|botanical/i, "fiori/piante/botanica"],
    [/shoe|fashion|fabric|cloth|garment/i, "moda/abbigliamento"],
    [/jewel|watch|clock|gear|dial|metal/i, "gioielli/orologeria/meccanismi"],
    [/clean|bubble|foam|spray|surface/i, "pulizia/superfici"],
    [/ball|sport|athlete|stadium|fitness/i, "sport/fitness"],
    [/code|pixel|screen|computer|circuit|digital/i, "tecnologia/digitale"]
  ];
  for (const [re, label] of clueRules) if (re.test(title + " " + description + " " + source)) visualClues.push(label);
  const fileNames = sourceFiles.filter(f => f !== "index.html").join(", ");
  templateInfo[id] = { id, title, description, sourceFiles: fileNames, visualClues: [...new Set(visualClues)].join("; "), sourceText: visibleText };
}

const englishDemo = /\b(add to bag|shop now|discovery set|book an appointment|learn more|about us|the experience|the house|record label|listening bar|bonsai nursery|reserve a room|reserve a seat|arrange a viewing|since 1846|since 1911|50 ml|€290|shimokitazawa|kyoto|tokyo|paris|rue du bac|artemis surface stays|seven days at the lunar south pole)\b/i;
const pages = [];
const walk = dir => {
  if (!fs.existsSync(dir)) return;
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) walk(p);
    else if (ent.name.toLowerCase() === "index.html") {
      const html = read(p);
      const rel = path.relative(sitesRoot, p).split(path.sep).join("/");
      const slug = rel.split("/")[0];
      const template = match(html, /data-template-3d=["']([^"']+)["']/i) || "MISSING";
      const title = strip(match(html, /<title[^>]*>([\s\S]*?)<\/title>/i));
      const h1 = strip(match(html, /<h1\b[^>]*>([\s\S]*?)<\/h1>/i));
      const meta = match(html, /<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)/i);
      const body = strip(html);
      const flags = [];
      if (template === "MISSING") flags.push("template-missing");
      if (!templateInfo[template]) flags.push("unknown-template");
      if (englishDemo.test(body)) flags.push("possible-demo-copy");
      if (/data-template-3d=["'](gambit|hangar|koi|artemis|lowfreq)["']/i.test(html)) flags.push("manual-concept-review");
      if (/https?:\/\/(example\.com|example\.org|localhost)/i.test(html)) flags.push("placeholder-url");
      if (/\b(?:undefined|null|lorem ipsum|your business|business name)\b/i.test(body)) flags.push("placeholder-text");
      if (!/<a\b[^>]*href=["']tel:/i.test(html)) flags.push("no-phone-action");
      if (!/<a\b[^>]*href=["']mailto:/i.test(html)) flags.push("no-email-action");
      if (!/google\.com\/maps\/search|maps\.google|href=["'][^"']*(?:maps|directions)/i.test(html)) flags.push("no-directions-action");
      pages.push({
        slug, path: rel, title, h1, template,
        templateTitle: templateInfo[template]?.title || "",
        templateDescription: templateInfo[template]?.description || "",
        templateVisualClues: templateInfo[template]?.visualClues || "",
        metaDescription: strip(meta),
        visibleText: body,
        flags: flags.join(";")
      });
    }
  }
};
walk(sitesRoot);
pages.sort((a,b) => a.slug.localeCompare(b.slug, "it"));
const cols = ["slug","path","title","h1","template","templateTitle","templateDescription","templateVisualClues","metaDescription","flags","visibleText"];
fs.writeFileSync(path.join(outDir, "all-pages.csv"), [cols.join(","), ...pages.map(p => cols.map(k => escCsv(p[k])).join(","))].join("\n"), "utf8");
fs.writeFileSync(path.join(outDir, "template-inventory.json"), JSON.stringify(templateInfo, null, 2), "utf8");
const counts = {};
for (const p of pages) counts[p.template] = (counts[p.template] || 0) + 1;
const flagCounts = {};
for (const p of pages) for (const f of p.flags.split(";").filter(Boolean)) flagCounts[f] = (flagCounts[f] || 0) + 1;
const summary = {
  generatedAt: new Date().toISOString(),
  pageCount: pages.length,
  templateCount: templateIds.length,
  pagesByTemplate: counts,
  flagCounts,
  flaggedPages: pages.filter(p => p.flags).map(p => ({ slug:p.slug, title:p.title, template:p.template, flags:p.flags, templateTitle:p.templateTitle, templateVisualClues:p.templateVisualClues, metaDescription:p.metaDescription, visibleText:p.visibleText.slice(0,1800) }))
};
fs.writeFileSync(path.join(outDir, "audit-summary.json"), JSON.stringify(summary, null, 2), "utf8");
console.log(JSON.stringify({ pageCount: pages.length, templateCount: templateIds.length, pagesByTemplate: counts, flagCounts, reports: ["audit-report/all-pages.csv","audit-report/template-inventory.json","audit-report/audit-summary.json"] }, null, 2));
if (pages.length < 80) throw new Error("Audit stopped: fewer than 80 business pages found.");
