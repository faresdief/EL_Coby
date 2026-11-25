# Dev log

Rule for every release: keep the original look (colors, fonts, layout, logo). New features reuse existing components and tokens in `store.css`. One feature per release, one PR per release, tested on a fresh clone and live.

## Release 1: product page (branch feature/product-page)
- New `product.js`: full page at `#product/<id>` (old `#p=<id>` links redirect). Gallery with arrows, swipe, thumbnails and zoom; colors; sizes; size guide; details/delivery/returns accordions; related products; sticky add-to-cart bar on phones; Product JSON-LD.
- Watches now have sizes (38/40/42 mm). Old cart keys without a size still load.
- `gallerySlides` and `relatedProducts` added to `commerce.js` with unit tests.
- Extra photos: set `more:['url', ...]` on a product in `data.js`. Without it the page shows close-up views of the same photo (no fake different photos).
- Tests: unit 16 passing, browser smoke 19 checks.
