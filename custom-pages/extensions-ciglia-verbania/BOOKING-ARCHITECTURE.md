# Extensions Ciglia Verbania — progetto

## Concept
Sito beauty editoriale rosa cipria/fragola, responsive, con hero 3D CSS, storyscrolling a sezioni sticky, catalogo prodotti e richiesta appuntamento.

## Prodotti comunicati dal cliente
- Lash Kit Valigetta — 60 ml — 15 €
- Whipped Shampoo — 100 ml — 20 €

## Prenotazioni: architettura da completare
La pagina include una UI di richiesta ma non dichiara disponibilità né conferma appuntamenti. Per prenotazioni automatiche reali serve una sorgente dati unica e persistente:
1. Supabase (Postgres) per servizi, durate, orari, eccezioni, appuntamenti e blocchi manuali.
2. API server-side (Vercel Functions) che calcola gli slot liberi e crea prenotazioni con transazione/constraint anti-overbooking.
3. Area privata titolare con login per bloccare date, pause, ferie e fasce orarie; tutte le modifiche aggiornano lo stesso calendario.
4. ChatGPT: creare un GPT privato con Actions verso le API protette (OAuth/API key custodita lato server) per leggere disponibilità e creare blocchi solo dopo autorizzazione. Non collegare il sito alla sessione ChatGPT personale del titolare e non esporre chiavi nel browser.
5. Invio conferma al cliente via email o canale scelto dal titolare; richiesta, conferma, modifica e cancellazione devono avere stati distinti.

## Dati mancanti prima di attivare le prenotazioni
- Servizi reali, prezzi e durata di ciascun trattamento.
- Giorni e orari di apertura, pause e durata minima tra appuntamenti.
- Anticipo minimo e finestra massima di prenotazione.
- Canale per conferme e cancellazioni.
- Credenziali/owner account per il calendario e il provider backend.

## Pubblicazione
Questa pagina è inserita come custom page in `custom-pages/extensions-ciglia-verbania/index.html`; il workflow della repository la applica in `sites/extensions-ciglia-verbania` durante il deploy.
