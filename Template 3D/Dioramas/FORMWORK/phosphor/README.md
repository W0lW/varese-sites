<!-- parable:beautified -->
<div align="center">

<h1>Phosphor</h1>

<p><strong>Retro CRT terminal with a real command line.</strong></p>

<p>
  <a href="https://bswxyz.github.io/formwork-phosphor/"><img alt="Live demo" src="https://img.shields.io/badge/demo-live-8b5cf6?style=flat-square&labelColor=1a1a1a"></a>
  <img alt="Family" src="https://img.shields.io/badge/family-Formwork-ec4899?style=flat-square&labelColor=1a1a1a">
  <img alt="Stack" src="https://img.shields.io/badge/stack-HTML%2FJS-f5a623?style=flat-square&labelColor=1a1a1a">
  <a href="LICENSE"><img alt="MIT License" src="https://img.shields.io/badge/license-MIT-22c55e?style=flat-square&labelColor=1a1a1a"></a>
</p>

<p>
  <a href="https://bswxyz.github.io/formwork-phosphor/"><b>Live demo</b></a>
  &nbsp;·&nbsp;
  <a href="https://bswxyz.github.io/formwork-phosphor/guide/">Build notes</a>
  &nbsp;·&nbsp;
  <a href="https://parable-three.vercel.app/templates">More templates</a>
</p>

<a href="https://bswxyz.github.io/formwork-phosphor/">
  <img src=".github/preview.jpg" alt="Phosphor — live preview" width="100%">
</a>

</div>

**Use this template** — copy the source into a new project:

```bash
npx degit bswxyz/formwork-phosphor my-app
```


**Live demo → https://bswxyz.github.io/formwork-phosphor/** · [How it was built](https://bswxyz.github.io/formwork-phosphor/guide/)

> A green-phosphor CRT that boots, glows, flickers — and answers real typed commands.

A free, MIT-licensed website template. Good for: **developer portfolios, retro products, docs with personality, 404 pages**.
The demo brand ("PHOSPHOR") is fictional — every word and colour is meant to be replaced with yours.

## The signature technique

- CRT stack in pure CSS: scanlines, vignette, flicker, phosphor text-glow
- Typed boot sequence on a jittered timer, then a working shell (`help`, `neofetch`, …)
- Hidden input mirrors to a fake caret — works on desktop and mobile keyboards

## Use this as your own site

This repo is a **template** — everything is plain HTML/CSS/JS with **relative paths**, so it
works under *any* repo name with zero configuration.

1. Click **Use this template → Create a new repository** (top of this page).
   **Name it whatever you like** — `my-site`, `portfolio`, anything.
2. In your new repo: **Settings → Pages → Build and deployment → Deploy from a branch**,
   then pick `main` / `/ (root)` and save. (CLI: see below.)
3. Wait ~1 minute. Your site is live at `https://YOUR-USERNAME.github.io/YOUR-REPO-NAME/`.

<details>
<summary>Prefer the command line?</summary>

```bash
gh repo create my-site --template bswxyz/formwork-phosphor --public --clone
cd my-site
gh api --method POST /repos/YOUR-USERNAME/my-site/pages \
  -f 'source[branch]=main' -f 'source[path]=/'
```
</details>

No build step, no dependencies to install — edit the files, push, done.
The only external requests are Google Fonts and (where used) pinned CDN copies of GSAP/three.js.

## Customize it

- Commands: add entries to the `COMMANDS` object in `main.js` (a command = a function returning text)
- Boot log: edit the `BOOT` array; banner text is the `BANNER` constant
- Phosphor colour: `--p` in `styles.css` (try amber `#ffb000` for a VT220 feel)

The `/guide/` page documents the signature technique in depth (with code) — keep it, rewrite it,
or delete the folder entirely.

## Files

```
index.html        the page
styles.css        all styling (design tokens in :root at the top)
main.js           the signature effect + motion
guide/index.html  how-it-works write-up (optional — yours to keep or delete)
```

## Built-in quality

- Works with JS disabled or a CDN failure (content is never permanently hidden)
- Respects `prefers-reduced-motion`; keyboard focus styles throughout
- Canvas/WebGL feature-detected with graceful fallbacks; devicePixelRatio capped for performance
- Responsive at phone / tablet / desktop widths

## License & credit

[MIT](LICENSE) — free for personal and commercial use, no attribution required
(a link back is always appreciated). Part of **FORMWORK** — a collection of
25 free website templates: **[the full gallery →](https://bswxyz.github.io/formwork/)**
