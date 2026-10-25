# Fit s Tomášem – web

Ukázkový jednostránkový web pro fiktivního osobního trenéra Tomáše Malého (Zlín). Portfolio projekt.

- Živě: https://fit-s-tomasem-web.polakondrej14.workers.dev
- GitHub: https://github.com/polakondrej14-del/fit-s-tomasem-web

## Struktura
- Čisté HTML/CSS/JS, žádný build krok. Vše servíruje Cloudflare Workers (static assets) ze složky `public/`.
- `public/index.html` – obsah, SEO, Open Graph, JSON-LD (SportsActivityLocation, Person, Offer)
- `public/styles.css` – design tokeny v `:root` (#141414, #F5F5F2, limetková #C8F03C, oranžová #FF6B2C), fonty Bebas Neue + Inter
- `public/script.js` – menu, scroll animace, počítadla, akordeon, kvíz, validace formuláře, plovoucí CTA
- `public/images/` – fotky z Unsplash ve WebP (max. 1600 px), `og.jpg` pro sdílení
- `wrangler.jsonc` – konfigurace Cloudflare

## Pravidla
- Texty česky, tykání. Limetku na světlém pozadí jen jako plochu, ne jako text.
- Respektovat `prefers-reduced-motion`, ovládání klávesnicí, alt texty.
- Formulář nic neodesílá (ukázka).

## Pracovní postup
Lokálně: `npx http-server public -p 8080 -c-1`, zkontrolovat na 375 px i desktopu.
Po každé změně:
1. `git add -A && git commit -m "…"`
2. `git push`
3. `npx wrangler deploy`
