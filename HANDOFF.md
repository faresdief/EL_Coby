# Handoff

State: see DEVLOG.md for what shipped per release.

Round 2 plan (owner approved): 1 compare (done), 2 remembered customer + order again + shared wishlist (done), 3 seasonal banner from one data entry, 4 floating WhatsApp + smart search. Search Console is handled by another agent. Dropped for good: reviews, coupons page, order tracking, admin panel.

Upload tip: the GitHub file picker renames files with number prefixes. Use drag-drop injection (DataTransfer + drop event on file-attachment) to keep exact names.

Architecture: static site, ES modules, no build step. `app.js` is the core (state, cart, checkout). Feature modules are loaded from `main.js` and talk to the core through the exported `api` object. `commerce.js` holds pure, tested logic.

Test: `npm ci && npm test && CHROME_PATH=/usr/bin/google-chrome npm run test:browser`.

Rules from the owner: never change the original visual identity; nothing paid; never edit `.github/workflows`; orders go to WhatsApp (`WA` in `data.js`).
