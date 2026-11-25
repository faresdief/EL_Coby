# Dev log

Rule for every release: keep the original look (colors, fonts, layout, logo). New features reuse existing components and tokens in `store.css`. One feature per release, one PR per release, tested on a fresh clone and live.

## Release 1: product page (branch feature/product-page)
- New `product.js`: full page at `#product/<id>` (old `#p=<id>` links redirect). Gallery with arrows, swipe, thumbnails and zoom; colors; sizes; size guide; details/delivery/returns accordions; related products; sticky add-to-cart bar on phones; Product JSON-LD.
- Watches now have sizes (38/40/42 mm). Old cart keys without a size still load.
- `gallerySlides` and `relatedProducts` added to `commerce.js` with unit tests.
- Extra photos: set `more:['url', ...]` on a product in `data.js`. Without it the page shows close-up views of the same photo (no fake different photos).
- Tests: unit 16 passing, browser smoke 19 checks.

## Release 2: AR/EN polish (branch feature/polish)
- Header search box now works (it did nothing before). Matches Arabic and English names. Empty result message in both languages.
- Aria labels (close, theme, cart, wishlist, limited-offer bar) follow the language.
- "Demo" wording removed from live text: checkout note and local profile title. Checkout note now says the WhatsApp draft is confirmed once the team replies and that shipping cost and payment are agreed on WhatsApp (no shipping calculation exists).
- Related products on the product page load eagerly with srcset (they showed blank in full-page screenshots because below-fold images are lazy; they load on scroll, now they never wait).
- Tests: unit 16, browser smoke 21.

Dropped by owner decision: reviews, coupons/offers page, order confirmation/tracking, admin panel.

## Release 3: Complete the look (branch feature/look)
- New section "Complete the look" on the home page (nav link too). Pick a watch, sunglasses and a chain or bracelet, see them together with live price.
- Automatic set discount: 2 categories 5%, 3 categories 10%. Tiers live in `SET_TIERS` in `data.js`. Best of set discount or coupon, never stacked (`calculateTotals` in `commerce.js`).
- Cart shows "Set discount" line, a nudge to unlock the next tier, and the WhatsApp message carries the line.
- Shareable link `#look=id,id,id` (`parseLook`, `lookLink`). New file `looks.js`, styles appended to `store.css`.
- Tests: unit 18, browser smoke 22.

## Round 2, Release 1: compare two products (branch feature/compare)
- New `compare.js`. A compare icon on every product card (next to the heart); pick two, a tray appears at the bottom with a Compare button, and a table opens: price, saving, category, material, colours, sizes, lowest-price mark, add to cart, view product.
- A third pick replaces the oldest. Selection lives in memory only. Esc and the X close it.
- `app.js` renders the icon button; `api.cmp` holds the picks. Text for the icon is `cmpBtn` in `data.js`; the rest of the text is inside `compare.js` (AR/EN).
- Tests: unit 18, browser smoke 24.

## Round 2, Release 2: remembered customer, order again, shareable wishlist (branch feature/customer-wishlist)
- New `customer.js`. After a customer sends an order, name and phone are kept in localStorage on that device only and prefill the next checkout. A note under the phone field says so, with a "Forget my details" link that clears them. Nothing is sent anywhere.
- "Order again": the last order (ids, quantity, colour, size) is kept on the device; the cart shows a "Your last order" block with an Order again button.
- Shareable wishlist: a "Share wishlist" tab (next to Wishlist) copies `#wish=id,id`. Opening that link shows a "Shared wishlist" tab with just those products and a "Save to my wishlist" tab. `parseWish` in `commerce.js` accepts only real products, no repeats, max 30.
- Hooks in `app.js`: `api.prefill`, `api.onOrder`, `api.cartExtra`.
- Cleanup: the nine numbered junk copies (1-app.js ... 9-HANDOFF.md) that PR #10 added by mistake are removed in this release (owner approved).
- Tests: unit 19, browser smoke 26.

## Round 2, Release 3: seasonal offers banner (branch feature/season-banner)
- New `offers.js` is the only file to edit: `on` (false turns it off), `id` (change it so people who closed it see it again), `until` ('YYYY-MM-DD' or '' for none, hides itself after that day), `ar`/`en` text, `cta` button text and `link`.
- New `season.js` draws it in a gold strip under the free-delivery bar, using the store's gold and the same pill button style. Visitors can close it; it stays closed on their device until `id` changes.
- `seasonActive` in `commerce.js` holds the rules, with a unit test.
- Tests: unit 20, browser smoke 27.
