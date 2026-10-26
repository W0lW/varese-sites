#!/usr/bin/env python3
"""Build an honest, traceable Excel audit for every generated business page.

If BRAVE_SEARCH_API_KEY is configured, run one Brave web search per business.
Search snippets are evidence leads, not automatic proof that every site claim is true.
"""
import csv
import json
import os
import re
import sys
import time
import urllib.parse
import urllib.request
from collections import Counter
from datetime import datetime, timezone
from pathlib import Path

from openpyxl import Workbook
from openpyxl.styles import Font, PatternFill, Alignment
from openpyxl.utils import get_column_letter

ROOT = Path.cwd()
REPORT = ROOT / "audit-report"
REPORT.mkdir(exist_ok=True)
PAGES_CSV = REPORT / "all-pages.csv"
CORRECTIONS_CSV = ROOT / "audit-template-corrections.csv"
CACHE_PATH = REPORT / "web-search-cache.json"
OUT = REPORT / "audit-completo-attivita.xlsx"
API_KEY = os.getenv("BRAVE_SEARCH_API_KEY", "").strip()
MAX_SEARCHES = int(os.getenv("AUDIT_MAX_SEARCHES") or "2500")
PAUSE = float(os.getenv("AUDIT_SEARCH_PAUSE_SECONDS", "0.25"))

def read_csv(path):
    if not path.exists():
        return []
    with path.open("r", encoding="utf-8-sig", newline="") as f:
        return list(csv.DictReader(f))

def clean(s):
    return re.sub(r"\s+", " ", str(s or "")).strip()

def business_name(page):
    h = clean(page.get("h1"))
    title = clean(page.get("title"))
    name = h or re.split(r"\s+[|—–-]\s+", title)[0] or page.get("slug", "")
    name = re.sub(r"^(home|benvenuti da|benvenuti a|welcome to)\s+", "", name, flags=re.I)
    return clean(name) or clean(page.get("slug"))

def web_search(query, cache):
    if query in cache:
        return cache[query]
    if not API_KEY:
        return {"status": "NON ESEGUITA: manca BRAVE_SEARCH_API_KEY", "results": []}
    url = "https://api.search.brave.com/res/v1/web/search?" + urllib.parse.urlencode({
        "q": query, "count": 5, "country": "IT", "search_lang": "it", "safesearch": "moderate"
    })
    req = urllib.request.Request(url, headers={
        "Accept": "application/json",
        "X-Subscription-Token": API_KEY,
        "User-Agent": "VareseSitesAudit/1.0"
    })
    try:
        with urllib.request.urlopen(req, timeout=25) as response:
            payload = json.loads(response.read().decode("utf-8"))
        results = []
        for item in payload.get("web", {}).get("results", [])[:5]:
            results.append({
                "title": clean(item.get("title")),
                "url": clean(item.get("url")),
                "description": clean(item.get("description")),
                "age": clean(item.get("age")),
                "page_age": clean(item.get("page_age")),
            })
        out = {"status": "RICERCA ESEGUITA", "results": results}
    except Exception as exc:
        out = {"status": "ERRORE RICERCA: " + clean(str(exc))[:240], "results": []}
    cache[query] = out
    time.sleep(PAUSE)
    return out

pages = read_csv(PAGES_CSV)
if not pages:
    raise SystemExit("Manca audit-report/all-pages.csv: eseguire prima node scripts/audit-3d-business-pages.mjs")
corrections = read_csv(CORRECTIONS_CSV)
correction_map = {clean(r.get("slug")): r for r in corrections}

try:
    cache = json.loads(CACHE_PATH.read_text(encoding="utf-8")) if CACHE_PATH.exists() else {}
except Exception:
    cache = {}

research_rows = []
searched = 0
for index, page in enumerate(pages):
    name = business_name(page)
    slug = clean(page.get("slug"))
    query = f'"{name}" Varese attività'
    result = {"status": "NON ESEGUITA: manca BRAVE_SEARCH_API_KEY", "results": []}
    if API_KEY and searched < MAX_SEARCHES:
        result = web_search(query, cache)
        if result["status"] == "RICERCA ESEGUITA":
            searched += 1
    elif API_KEY and searched >= MAX_SEARCHES:
        result = {"status": f"NON ESEGUITA: limite configurato {MAX_SEARCHES}", "results": []}
    sources = result.get("results", [])
    if not sources:
        research_rows.append({
            "slug": slug, "attività": name, "settore/template": clean(page.get("templateTitle") or page.get("template")),
            "query ricerca": query, "esito ricerca": result["status"],
            "fonte #": "", "titolo fonte": "", "URL fonte": "", "estratto fonte": "",
            "cosa confrontare nel sito": clean(page.get("visibleText"))[:1200],
            "esito verifica contenuti": "NON VERIFICATO: nessuna fonte disponibile",
            "azione": "Eseguire/confermare la ricerca e confrontare manualmente le affermazioni del sito."
        })
    else:
        for n, source in enumerate(sources, 1):
            research_rows.append({
                "slug": slug, "attività": name, "settore/template": clean(page.get("templateTitle") or page.get("template")),
                "query ricerca": query, "esito ricerca": result["status"],
                "fonte #": n, "titolo fonte": source.get("title", ""), "URL fonte": source.get("url", ""),
                "estratto fonte": source.get("description", ""),
                "cosa confrontare nel sito": clean(page.get("visibleText"))[:1200],
                "esito verifica contenuti": "FONTE TROVATA — confronto puntuale ancora richiesto",
                "azione": "Verificare nome, settore, servizi, indirizzo, contatti e ogni affermazione specifica contro la fonte."
            })

CACHE_PATH.write_text(json.dumps(cache, ensure_ascii=False, indent=2), encoding="utf-8")

wb = Workbook()
summary = wb.active
summary.title = "Riepilogo"
summary_rows = [
    ["AUDIT COMPLETO — VARESE SITES", ""],
    ["Generato (UTC)", datetime.now(timezone.utc).isoformat(timespec="seconds")],
    ["Pagine censite", len(pages)],
    ["Ricerche web realmente eseguite in questa esecuzione", searched],
    ["Chiave Brave configurata", "SÌ" if API_KEY else "NO"],
    ["Fonti raccolte (righe con URL)", sum(1 for r in research_rows if r.get("URL fonte"))],
    ["Pagine con anomalie strutturali", sum(1 for p in pages if clean(p.get("flags")))],
    ["Correzioni template già registrate", len(corrections)],
    ["Nota metodologica", "I risultati/snippet sono piste di verifica, non conferma automatica dei contenuti. Ogni affermazione specifica richiede confronto."],
    ["Stato", "Audit strutturale automatico + ricerca web dove disponibile; la verifica semantica finale non viene falsamente marcata come completata."],
    [],
    ["Anomalia", "Numero pagine"],
]
flag_counts = Counter()
template_counts = Counter()
for p in pages:
    template_counts[clean(p.get("template")) or "MISSING"] += 1
    for flag in clean(p.get("flags")).split(";"):
        if flag:
            flag_counts[flag] += 1
for k, v in sorted(flag_counts.items(), key=lambda x: (-x[1], x[0])):
    summary_rows.append([k, v])
summary.append(["Voce", "Valore"])
for row in summary_rows:
    summary.append(row)
summary.append([])
summary.append(["Template assegnato", "Numero pagine"])
for k, v in sorted(template_counts.items(), key=lambda x: (-x[1], x[0])):
    summary.append([k, v])

activity_headers = [
    "slug", "attività", "titolo pagina", "H1", "settore/template 3D",
    "descrizione template", "indizi visivi del template", "URL sito",
    "descrizione SEO", "anomalie automatiche", "testo visibile estratto",
    "correzione template registrata", "decisione audit template", "motivazione audit"
]
activities = wb.create_sheet("Attività")
activities.append(activity_headers)
for p in pages:
    corr = correction_map.get(clean(p.get("slug")), {})
    slug = clean(p.get("slug"))
    activities.append([
        slug, business_name(p), p.get("title", ""), p.get("h1", ""),
        p.get("templateTitle") or p.get("template", ""), p.get("templateDescription", ""),
        p.get("templateVisualClues", ""), "https://w0lw.github.io/varese-sites/sites/" + slug + "/",
        p.get("metaDescription", ""), p.get("flags", ""), p.get("visibleText", ""),
        corr.get("template_finale_audit", ""), corr.get("decisione_audit", ""), corr.get("motivo_audit", "")
    ])

research = wb.create_sheet("Ricerca web")
research_headers = [
    "slug", "attività", "settore/template", "query ricerca", "esito ricerca",
    "fonte #", "titolo fonte", "URL fonte", "estratto fonte",
    "testo del sito da confrontare", "esito verifica contenuti", "azione"
]
research.append(research_headers)
for r in research_rows:
    research.append([r.get(h, "") for h in research_headers])

corr_sheet = wb.create_sheet("Correzioni template")
if corrections:
    corr_sheet.append(list(corrections[0].keys()))
    for r in corrections:
        corr_sheet.append([r.get(k, "") for k in corrections[0].keys()])
else:
    corr_sheet.append(["Nessuna correzione esistente trovata"])

templates = wb.create_sheet("Distribuzione template")
templates.append(["Template ID", "Numero pagine", "Titolo/label"])
for k, v in sorted(template_counts.items(), key=lambda x: (-x[1], x[0])):
    label = next((clean(p.get("templateTitle")) for p in pages if clean(p.get("template")) == k and clean(p.get("templateTitle"))), "")
    templates.append([k, v, label])

# Readable, filterable sheets; preserve URLs as clickable links.
for ws in wb.worksheets:
    ws.freeze_panes = "A2"
    ws.auto_filter.ref = ws.dimensions
    for cell in ws[1]:
        cell.font = Font(bold=True, color="FFFFFF")
        cell.fill = PatternFill("solid", fgColor="20283A")
        cell.alignment = Alignment(wrap_text=True, vertical="top")
    for row in ws.iter_rows(min_row=2):
        for cell in row:
            cell.alignment = Alignment(wrap_text=True, vertical="top")
            if cell.column == 8 and ws.title == "Ricerca web" and str(cell.value).startswith("http"):
                cell.hyperlink = cell.value
                cell.style = "Hyperlink"
    for col in range(1, ws.max_column + 1):
        letter = get_column_letter(col)
        max_len = 12
        for cell in ws[letter][:min(ws.max_row, 150)]:
            max_len = max(max_len, min(len(str(cell.value or "")), 42))
        ws.column_dimensions[letter].width = min(max_len + 2, 48)
    ws.sheet_view.showGridLines = False

# Wide evidence/text columns are deliberately usable, not expanded to full text length.
for ws_name, widths in {
    "Riepilogo": {"A": 58, "B": 85},
    "Attività": {"A": 32, "B": 32, "C": 42, "D": 34, "E": 28, "F": 48, "G": 35, "H": 52, "I": 55, "J": 38, "K": 80, "L": 32, "M": 24, "N": 70},
    "Ricerca web": {"A": 32, "B": 32, "C": 30, "D": 45, "E": 38, "F": 10, "G": 48, "H": 58, "I": 75, "J": 80, "K": 45, "L": 70},
    "Correzioni template": {"A": 42, "B": 42, "C": 28, "D": 34, "E": 34, "F": 24, "G": 80},
}.items():
    ws = wb[ws_name]
    for col, width in widths.items():
        ws.column_dimensions[col].width = width

wb.save(OUT)
print(json.dumps({
    "output": str(OUT), "pages": len(pages), "searches_executed": searched,
    "search_api_configured": bool(API_KEY), "source_rows": sum(1 for r in research_rows if r.get("URL fonte")),
    "pages_with_flags": sum(1 for p in pages if clean(p.get("flags"))),
}, ensure_ascii=False, indent=2))
