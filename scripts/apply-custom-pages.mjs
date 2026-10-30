import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const sourceRoot = path.join(root, "custom-pages");
const sitesRoot = path.join(root, "sites");

if (!fs.existsSync(sourceRoot)) {
  console.log("No custom-pages directory; nothing to apply.");
  process.exit(0);
}

let applied = 0;
for (const entry of fs.readdirSync(sourceRoot, { withFileTypes: true })) {
  if (!entry.isDirectory() || !/^[a-z0-9-]+$/.test(entry.name)) continue;
  const source = path.join(sourceRoot, entry.name, "index.html");
  const targetDir = path.join(sitesRoot, entry.name);
  const target = path.join(targetDir, "index.html");
  if (!fs.existsSync(source)) continue;
  fs.mkdirSync(targetDir, { recursive: true });
  const html = fs.readFileSync(source, "utf8");
  if (!/<html\b/i.test(html) || !/<body\b/i.test(html) || !/<\/html>/i.test(html)) {
    throw new Error(`Custom page is not a complete HTML document: ${entry.name}`);
  }
  fs.writeFileSync(target, html);
  console.log(`Applied bespoke page: ${entry.name}`);
  applied++;
}
console.log(`Applied ${applied} bespoke business page(s).`);
