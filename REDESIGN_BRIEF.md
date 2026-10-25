# VARESE SITES — MASTER REDESIGN BRIEF

Agisci come un team senior composto da creative director, digital art director, interaction designer, motion designer, frontend engineer e QA engineer. Obiettivo: trasformare ogni demo business del repository in una proposta web credibile, distintiva, interattiva e presentabile a un potenziale cliente.

## Principio non negoziabile
Non creare 80 copie dello stesso template con logo, colore e testo cambiati. Ogni sito deve avere un proprio concept visivo riconoscibile, un layout coerente con il settore e almeno un'idea creativa specifica. Le componenti condivise sono consentite solo per accessibilità, utility e comportamenti di base; mai come scorciatoia per rendere tutte le pagine visivamente identiche.

## Art direction
Assegna a ogni attività una direzione artistica basata su categoria e identità, variando davvero:
- composizione e gerarchia del layout;
- tipografia, scala, peso e ritmo;
- palette, contrasto, superfici e texture;
- uso e ritaglio delle immagini;
- forma e densità delle sezioni;
- stile dei pulsanti, card, navigazione e footer;
- linguaggio delle animazioni e microinterazioni.

Le famiglie visive possono includere editorial/luxury, brutalist, cinematic, organic, industrial, architectural/blueprint, minimal, high-tech, gallery e kinetic, ma non assegnarle meccanicamente senza valutare l'attività. Anche aziende della stessa categoria possono avere concept differenti.

## 3D e motion design
- Usa CSS 3D e prospettiva per elementi leggeri, con illuminazione, profondità e trasformazioni coerenti.
- Quando serve un oggetto 3D vero, valuta Three.js/WebGL e gestisci correttamente caricamento, fallback e prestazioni. Non simulare la presenza di Three.js se non è installato o usato.
- Prevedi scroll reveal, parallax controllato, transizioni, marquee, hover con tilt, menu animati e stati focus/active.
- Ogni animazione deve avere uno scopo, essere fluida e non ostacolare lettura o navigazione.
- Rispetta prefers-reduced-motion; su touch non dipendere da hover o cursore personalizzato.
- Evita animazioni pesanti, loop inutili e dipendenze esterne non necessarie.

## Interattività reale
Implementa comportamenti funzionanti: navigazione ancorata, menu mobile, card con feedback, FAQ/accordion se pertinenti, filtri se esiste un catalogo, CTA che conducono a destinazioni valide, form solo se collegati a un invio reale. Non mostrare controlli finti che sembrano funzionanti ma non fanno nulla. Non inventare telefono, email, prezzi, recensioni, clienti, certificazioni o risultati.

## Contenuti e credibilità
- Scrivi in italiano naturale, concreto e specifico per il settore.
- Distingui chiaramente concept dimostrativo e informazioni verificate.
- Non insinuare che il titolare abbia commissionato o approvato la demo.
- Usa immagini reali solo quando la fonte e i diritti sono appropriati; se mancano asset, progetta un placeholder art-directed invece di inventare fotografie di clienti o lavori.
- Ogni attività deve avere una proposta di valore plausibile, sezioni utili e un percorso di contatto chiaro.

## Tecnica e accessibilità
- Mobile-first, responsive da 320 px in su, con controlli touch comodi.
- HTML semantico, gerarchia heading corretta, focus visibile, contrasti leggibili, alt text, link descrittivi.
- CSS modulare e JavaScript robusto, senza errori in console o dipendenze da API non disponibili.
- Percorsi relativi corretti per GitHub Pages in sottocartelle.
- Ottimizza immagini, font e animazioni; evita layout shift.
- Mantieni un fallback sensato se JavaScript, font o risorse esterne non caricano.

## QA obbligatorio
Prima di dichiarare il lavoro finito:
1. controlla tutte le cartelle e verifica che ogni pagina carichi CSS e JS;
2. verifica che ogni slug trovi esattamente la propria attività nel dataset;
3. controlla che non ci siano duplicazioni di layout identiche per categorie diverse;
4. testa navigazione, CTA, menu, hover, focus e animazioni su desktop e mobile;
5. controlla errori di console, URL, accessibilità di base e reduced motion;
6. assicurati che catalogo e link di ritorno funzionino;
7. non dichiarare il deploy riuscito finché GitHub Actions o il sito pubblicato non confermano il successo.

## Definizione di qualità
Il risultato deve sembrare una selezione di progetti di un piccolo studio digitale di alto livello, non un generatore di landing page. Ogni demo deve avere una prima schermata memorabile, una struttura coerente, motion raffinato, almeno un'interazione utile e un'identità propria.