# Handoff

State: see DEVLOG.md for what shipped per release.

Round 2 plan (owner approved): 1 compare, 2 remembered customer + order again + shareable wishlist, 3 seasonal banner from one data entry, 4 floating WhatsApp + smart search, 5 Search Console. Dropped for good: reviews, coupons page, order tracking, admin panel.

Architecture: static site, ES modules, no build step. `app.js` is the core (state, cart, checkout). Feature modules are loaded from `main.js` and talk to the core through the exported `api` object. `commerce.js` holds pure, tested logic.

Test: `npm ci && npm test && CHROME_PATH=/usr/bin/google-chrome npm run test:browser`.

Rules from the owner: never change the original visual identity; nothing paid; never edit `.github/workflows`; orders go to WhatsApp (`WA` in `data.js`).
