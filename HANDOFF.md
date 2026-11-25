# Handoff

State: see DEVLOG.md for what shipped per release.

Round 2 (owner approved) is complete: compare, remembered customer + order again + shared wishlist, seasonal banner (edit offers.js), floating WhatsApp + smart search. Search Console was handled separately. Dropped for good: reviews, coupons page, order tracking, admin panel.

Upload tip: the GitHub file picker renames files with number prefixes. Use drag-drop injection (DataTransfer + drop event on file-attachment) to keep exact names.

Architecture: static site, ES modules, no build step. `app.js` is the core (state, cart, checkout). Feature modules are loaded from `main.js` and talk to the core through the exported `api` object. `commerce.js` holds pure, tested logic.

Test: `npm ci && npm test && CHROME_PATH=/usr/bin/google-chrome npm run test:browser`.

Rules from the owner: never change the original visual identity; nothing paid; never edit `.github/workflows`; orders go to WhatsApp (`WA` in `data.js`).
