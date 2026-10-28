# NOIR — Cinematic 3D template

Template statico per GitHub Pages con video full-screen in loop, audio controllabile, Three.js, reveal animation, grain cinematografico, micro-interazioni e layout responsive.

## Video di sfondo
Il markup usa `../assets/video.mp4` come sorgente. Il file `assets/video.mp4` non risulta presente nella repository al momento della verifica: caricalo in quel percorso per attivare il video reale.

## Avvio
Apri `index.html` tramite GitHub Pages o un server statico. Three.js e i font vengono caricati da CDN, quindi richiedono una connessione internet.

## Audio
Il video parte in autoplay **muted** perché i browser bloccano normalmente l'autoplay con audio. Il pulsante SOUND OFF abilita l'audio dopo un click/tap esplicito.

## Personalizzazione
- Cambia testi, colori e indirizzo email in `index.html` e `styles.css`.
- Sostituisci `hello@example.com` con il contatto reale.
- Rispetta le preferenze `prefers-reduced-motion`; le animazioni sono ridotte per chi le richiede.
