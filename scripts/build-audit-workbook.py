#!/usr/bin/env python3
"""Build an honest, traceable Excel audit for every generated business page.

Use Brave Search when configured; otherwise use the keyless DuckDuckGo search backend.
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
try:
    from ddgs import DDGS
except ImportError:
    DDGS = None
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
    cached = cache.get(query)
    if cached and cached.get("status") in ("RICERCA ESEGUITA (Brave)", "RICERCA ESEGUITA (DuckDuckGo)"):
        return cached
    if API_KEY:
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
            results = [{
                "title": clean(item.get("title")),
                "url": clean(item.get("url")),
                "description": clean(item.get("description")),
                "age": clean(item.get("age")),
                "page_age": clean(item.get("page_age")),
            } for item in payload.get("web", {}).get("results", [])[:5]]
            out = {"status": "RICERCA ESEGUITA (Brave)", "results": results}
        except Exception as exc:
            out = {"status": "ERRORE RICERCA BRAVE: " + clean(str(exc))[:240], "results": []}
    elif DDGS is not None:
        try:
            raw = DDGS().text(query, region="it-it", safesearch="moderate", max_results=5)
            results = []
            for item in raw or []:
                href = clean(item.get("href") or item.get("url"))
                if not href.startswith("http"):
                    continue
                results.append({
                    "title": clean(item.get("title")),
                    "url": href,
                    "description": clean(item.get("body") or item.get("description")),
                    "age": "",
                    "page_age": "",
                })
            out = {"status": "RICERCA ESEGUITA (DuckDuckGo)" if results else "NESSUN RISULTATO (DuckDuckGo)", "results": results}
        except Exception as exc:
            out = {"status": "ERRORE RICERCA DuckDuckGo: " + clean(str(exc))[:240], "results": []}
    else:
        out = {"status": "NON ESEGUITA: backend DuckDuckGo non installato e nessuna chiave Brave", "results": []}
    if out["status"].startswith("RICERCA ESEGUITA"):
        cache[query] = out
    time.sleep(PAUSE)
    return out

