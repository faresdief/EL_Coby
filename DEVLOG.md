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
