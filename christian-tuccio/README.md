# Christian Tuccio — Portfolio hub

Pagina di accesso al portfolio e ai progetti.

## Link
- Portfolio principale: https://w0lw.github.io/varese-sites/
- NORD DRIVE Rental: https://w0lw.github.io/varese-sites/demos/nord-drive-rental/
- BookCars: sott modulo Git collegato al progetto originale https://github.com/aelassas/bookcars
- Repository: https://github.com/W0lW/varese-sites

## BookCars
BookCars è incluso come Git submodule al percorso `christian-tuccio/bookcars`, puntato a un commit preciso del repository upstream. Per scaricare anche il contenuto del submodule in locale:

```bash
git clone --recurse-submodules https://github.com/W0lW/varese-sites.git
```

Oppure, dopo un clone normale:

```bash
git submodule update --init --recursive
```

Il progetto BookCars è un'applicazione full-stack (frontend, backend, admin e mobile), non una pagina statica: GitHub Pages può pubblicare questa pagina portfolio, ma non eseguire l'applicazione completa. Per avviare BookCars seguire la documentazione ufficiale e predisporre backend, database e variabili d'ambiente.

Licenza upstream: MIT. Conservare gli avvisi di copyright e licenza del progetto originale.
